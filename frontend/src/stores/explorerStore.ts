import { defineStore } from 'pinia';
import { ref, computed, reactive } from 'vue';
import type { Node, NodeTree } from '@/types/node';
import { nodeApi } from '@/services/nodeApi';

export const useExplorerStore = defineStore('explorer', () => {
  const tree = ref<NodeTree[]>([]);
  const selectedNode = ref<Node | null>(null);
  const children = ref<Node[]>([]);
  const searchQuery = ref<string>('');
  const searchResults = ref<Node[]>([]);
  const isSearchActive = ref<boolean>(false);
  const expandedIds = ref<Set<string>>(reactive(new Set<string>()));
  const isLoadingTree = ref<boolean>(false);
  const isLoadingChildren = ref<boolean>(false);
  const isSearching = ref<boolean>(false);
  const error = ref<string | null>(null);

  const selectedIds = ref<Set<string>>(reactive(new Set<string>()));
  const lastClickedId = ref<string | null>(null);

  const undoStack = ref<Array<
    | { type: 'rename'; id: string; oldName: string }
    | { type: 'move'; oldParentIds: Array<{ id: string; parentId: string | null }> }
    | { type: 'trash'; ids: string[] }
  >>([]);

  function findNodeInMemory(id: string): Node | null {
    if (nodeIndex.has(id)) return nodeIndex.get(id) || null;
    const child = children.value.find((c) => c.id === id);
    if (child) return child;
    const trashItem = trashItems.value.find((c) => c.id === id);
    if (trashItem) return trashItem;
    return null;
  }

  const nodeIndex = new Map<string, Node>();

  function buildIndex(treeNodes: NodeTree[]): void {
    nodeIndex.clear();
    const walk = (nodes: NodeTree[]) => {
      for (const node of nodes) {
        nodeIndex.set(node.id, node);
        if (node.children.length > 0) walk(node.children);
      }
    };
    walk(treeNodes);
  }

  function expandAncestors(nodeId: string): void {
    let current = nodeIndex.get(nodeId);
    let parentId = current?.parentId ?? null;
    while (parentId !== null) {
      expandedIds.value.add(parentId);
      current = nodeIndex.get(parentId);
      parentId = current?.parentId ?? null;
    }
  }

  async function loadTree(): Promise<void> {
    isLoadingTree.value = true;
    error.value = null;
    try {
      const res = await nodeApi.getTree();
      tree.value = res.data;
      buildIndex(tree.value);
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      isLoadingTree.value = false;
    }
  }

  async function selectNode(node: Node): Promise<void> {
    clearSelection();
    view.value = 'browse';
    selectedNode.value = node;
    isSearchActive.value = false;
    searchResults.value = [];
    searchQuery.value = '';
    expandAncestors(node.id);
    isLoadingChildren.value = true;
    error.value = null;
    try {
      const res = await nodeApi.getChildren(node.id);
      children.value = res.data;
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      isLoadingChildren.value = false;
    }
  }

  function toggleExpand(id: string): void {
    if (expandedIds.value.has(id)) {
      expandedIds.value.delete(id);
    } else {
      expandedIds.value.add(id);
    }
  }

  function collapseAll(): void { expandedIds.value.clear(); }

  async function runSearch(query: string): Promise<void> {
    searchQuery.value = query;
    if (query.trim() === '') {
      clearSearch();
      return;
    }
    isSearchActive.value = true;
    isSearching.value = true;
    error.value = null;
    try {
      const res = await nodeApi.search(query.trim());
      searchResults.value = res.data;
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      isSearching.value = false;
    }
  }

  function clearSearch(): void {
    searchQuery.value = '';
    searchResults.value = [];
    isSearchActive.value = false;
  }

  function clearError(): void {
    error.value = null;
  }

  function selectOnly(id: string): void {
    selectedIds.value.clear();
    selectedIds.value.add(id);
    lastClickedId.value = id;
  }
  function toggleSelection(id: string): void {
    if (selectedIds.value.has(id)) selectedIds.value.delete(id);
    else selectedIds.value.add(id);
    lastClickedId.value = id;
  }
  function selectRangeTo(id: string): void {
    const items = rightPanelItems.value;
    const anchor = lastClickedId.value ?? id;
    const from = items.findIndex((n) => n.id === anchor);
    const to = items.findIndex((n) => n.id === id);
    if (from === -1 || to === -1) { selectOnly(id); return; }
    const [lo, hi] = from <= to ? [from, to] : [to, from];
    selectedIds.value.clear();
    for (let i = lo; i <= hi; i++) selectedIds.value.add(items[i].id);
    lastClickedId.value = anchor;
  }
  function selectAll(): void {
    selectedIds.value.clear();
    for (const n of rightPanelItems.value) selectedIds.value.add(n.id);
  }
  function clearSelection(): void {
    selectedIds.value.clear();
    lastClickedId.value = null;
  }

  const clipboard = ref<{ ids: string[]; mode: 'copy' | 'cut' } | null>(null);
  const view = ref<'browse' | 'trash'>('browse');
  const trashItems = ref<Node[]>([]);
  const isLoadingTrash = ref<boolean>(false);
  const progress = ref<{ active: boolean; label: string; current: number; total: number }>(
    { active: false, label: '', current: 0, total: 0 },
  );

  function setView(next: 'browse' | 'trash'): void {
    view.value = next;
    clearSelection();
  }

  async function refresh(): Promise<void> {
    await loadTree();
    if (view.value === 'trash') {
      await loadTrash();
    } else if (selectedNode.value) {
      try {
        const res = await nodeApi.getChildren(selectedNode.value.id);
        children.value = res.data;
      } catch (e) {
        error.value = (e as Error).message;
      }
    }
  }

  async function runBatch(label: string, ids: string[], perItem: (id: string) => Promise<void>): Promise<void> {
    progress.value = { active: true, label, current: 0, total: ids.length };
    try {
      for (const id of ids) {
        await perItem(id);
        progress.value = { ...progress.value, current: progress.value.current + 1 };
      }
    } finally {
      progress.value = { active: false, label: '', current: 0, total: 0 };
    }
  }

  async function createFolderIn(name: string): Promise<void> {
    const parentId = view.value === 'trash' ? null : (selectedNode.value?.id ?? null);
    error.value = null;
    try {
      await nodeApi.createFolder(name, parentId);
      await refresh();
    } catch (e) { error.value = (e as Error).message; throw e; }
  }
  async function renameNode(id: string, name: string): Promise<void> {
    const node = findNodeInMemory(id);
    const oldName = node ? node.name : null;
    error.value = null;
    try {
      await nodeApi.rename(id, name);
      if (oldName && oldName !== name) {
        undoStack.value.push({ type: 'rename', id, oldName });
      }
      await refresh();
    } catch (e) { error.value = (e as Error).message; throw e; }
  }

  async function moveNodes(ids: string[], targetParentId: string | null): Promise<void> {
    const oldParentIds = ids.map((id) => ({ id, parentId: findNodeInMemory(id)?.parentId ?? null }));
    error.value = null;
    try {
      await runBatch(`Moving ${ids.length} item${ids.length > 1 ? 's' : ''}…`, ids, async (id) => {
        await nodeApi.move([id], targetParentId);
      });
      undoStack.value.push({ type: 'move', oldParentIds });
      clearSelection();
      await refresh();
    } catch (e) { error.value = (e as Error).message; throw e; }
  }
  async function copyNodes(ids: string[], targetParentId: string | null): Promise<void> {
    error.value = null;
    try {
      await runBatch(`Copying ${ids.length} item${ids.length > 1 ? 's' : ''}…`, ids, async (id) => {
        await nodeApi.copy([id], targetParentId);
      });
      await refresh();
    } catch (e) { error.value = (e as Error).message; throw e; }
  }
  function copyToClipboard(ids: string[]): void { clipboard.value = { ids: [...ids], mode: 'copy' }; }
  function cutToClipboard(ids: string[]): void { clipboard.value = { ids: [...ids], mode: 'cut' }; }
  async function pasteInto(targetParentId?: string | null): Promise<void> {
    if (!clipboard.value) return;
    const target = targetParentId !== undefined ? targetParentId : (selectedNode.value?.id ?? null);
    const { ids, mode } = clipboard.value;
    if (mode === 'copy') await copyNodes(ids, target);
    else { await moveNodes(ids, target); clipboard.value = null; }
  }

  async function trashNodes(ids: string[]): Promise<void> {
    error.value = null;
    try {
      await nodeApi.trash(ids);
      undoStack.value.push({ type: 'trash', ids: [...ids] });
      clearSelection();
      await refresh();
    } catch (e) { error.value = (e as Error).message; throw e; }
  }
  async function loadTrash(): Promise<void> {
    isLoadingTrash.value = true;
    error.value = null;
    try {
      const res = await nodeApi.getTrash();
      trashItems.value = res.data;
    } catch (e) { error.value = (e as Error).message; }
    finally { isLoadingTrash.value = false; }
  }
  async function restoreNodes(ids: string[]): Promise<void> {
    error.value = null;
    try {
      await runBatch(`Restoring ${ids.length} item${ids.length > 1 ? 's' : ''}…`, ids, async (id) => {
        await nodeApi.restore([id]);
      });
      clearSelection();
      await loadTrash();
      await loadTree();
    } catch (e) { error.value = (e as Error).message; throw e; }
  }
  async function permanentDeleteNodes(ids: string[]): Promise<void> {
    error.value = null;
    try {
      await runBatch(`Deleting ${ids.length} item${ids.length > 1 ? 's' : ''}…`, ids, async (id) => {
        await nodeApi.permanentDelete([id]);
      });
      clearSelection();
      await loadTrash();
    } catch (e) { error.value = (e as Error).message; throw e; }
  }
  async function emptyTrashAll(): Promise<void> {
    error.value = null;
    try {
      await nodeApi.emptyTrash();
      await loadTrash();
    } catch (e) { error.value = (e as Error).message; throw e; }
  }

  const preview = ref<{ node: Node | null; visible: boolean }>({ node: null, visible: false });

  function openPreview(node: Node): void {
    preview.value = { node, visible: true };
  }
  function closePreview(): void {
    preview.value = { ...preview.value, visible: false };
  }
  function togglePreview(): void {
    preview.value = { ...preview.value, visible: !preview.value.visible };
  }

  async function uploadFiles(files: File[]): Promise<void> {
    if (files.length === 0) return;
    const parentId = view.value === 'trash' ? null : (selectedNode.value?.id ?? null);
    error.value = null;
    progress.value = {
      active: true,
      label: `Uploading ${files.length} file${files.length > 1 ? 's' : ''}…`,
      current: 0,
      total: 100,
    };
    try {
      await nodeApi.upload(parentId, files, (loaded, total) => {
        progress.value = { ...progress.value, current: loaded, total };
      });
      await refresh();
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      progress.value = { active: false, label: '', current: 0, total: 0 };
    }
  }

  async function extractNode(id: string): Promise<void> {
    error.value = null;
    progress.value = { active: true, label: 'Extracting…', current: 0, total: 0 };
    try {
      await nodeApi.extract(id);
      await refresh();
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      progress.value = { active: false, label: '', current: 0, total: 0 };
    }
  }

  async function undo(): Promise<void> {
    const action = undoStack.value.pop();
    if (!action) return;
    error.value = null;
    progress.value = { active: true, label: 'Undoing…', current: 0, total: 0 };
    try {
      if (action.type === 'rename') {
        await nodeApi.rename(action.id, action.oldName);
      } else if (action.type === 'move') {
        for (const item of action.oldParentIds) {
          await nodeApi.move([item.id], item.parentId);
        }
      } else if (action.type === 'trash') {
        await runBatch('Restoring…', action.ids, async (id) => {
          await nodeApi.restore([id]);
        });
      }
      await refresh();
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      progress.value = { active: false, label: '', current: 0, total: 0 };
    }
  }

  const isExpanded = (id: string): boolean => expandedIds.value.has(id);
  const rightPanelItems = computed<Node[]>(() => {
    if (view.value === 'trash') return trashItems.value;
    return isSearchActive.value ? searchResults.value : children.value;
  });
  const selectedNodes = computed(() =>
    rightPanelItems.value.filter((n) => selectedIds.value.has(n.id)),
  );

  return {
    tree,
    selectedNode,
    children,
    searchQuery,
    searchResults,
    isSearchActive,
    expandedIds,
    isLoadingTree,
    isLoadingChildren,
    isSearching,
    error,
    selectedIds,
    lastClickedId,
    clipboard,
    view,
    trashItems,
    isLoadingTrash,
    progress,
    preview,
    loadTree,
    selectNode,
    toggleExpand,
    collapseAll,
    runSearch,
    clearSearch,
    clearError,
    selectOnly,
    toggleSelection,
    selectRangeTo,
    selectAll,
    clearSelection,
    setView,
    createFolderIn,
    renameNode,
    moveNodes,
    copyNodes,
    copyToClipboard,
    cutToClipboard,
    pasteInto,
    trashNodes,
    loadTrash,
    restoreNodes,
    permanentDeleteNodes,
    emptyTrashAll,
    openPreview,
    closePreview,
    togglePreview,
    uploadFiles,
    extractNode,
    isExpanded,
    rightPanelItems,
    selectedNodes,
    undo,
  };
});
