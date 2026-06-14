import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useExplorerStore } from '@/stores/explorerStore';
import { nodeApi } from '@/services/nodeApi';
import type { Node, NodeTree } from '@/types/node';

vi.mock('@/services/nodeApi', () => ({
  nodeApi: {
    getTree: vi.fn(),
    getChildren: vi.fn(),
    search: vi.fn(),
    getTrash: vi.fn(),
    createFolder: vi.fn(),
    rename: vi.fn(),
    move: vi.fn(),
    copy: vi.fn(),
    trash: vi.fn(),
    restore: vi.fn(),
    permanentDelete: vi.fn(),
    emptyTrash: vi.fn(),
    upload: vi.fn(),
    extract: vi.fn(),
    contentUrl: vi.fn(),
    getContentText: vi.fn(),
  },
}));

function makeNode(overrides: Partial<Node> = {}): Node {
  return {
    id: 'n1',
    name: 'node',
    type: 'folder',
    parentId: null,
    path: '/node',
    size: null,
    extension: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeTree(overrides: Partial<NodeTree> = {}): NodeTree {
  return {
    ...makeNode(overrides),
    children: [],
    ...overrides,
  };
}


function nestedTree(): NodeTree[] {
  const grandchild = makeTree({
    id: 'grandchild',
    name: 'grandchild',
    type: 'file',
    parentId: 'child',
    path: '/root/child/grandchild',
    children: [],
  });
  const child = makeTree({
    id: 'child',
    name: 'child',
    type: 'folder',
    parentId: 'root',
    path: '/root/child',
    children: [grandchild],
  });
  const root = makeTree({
    id: 'root',
    name: 'root',
    type: 'folder',
    parentId: null,
    path: '/root',
    children: [child],
  });
  return [root];
}

const mockedApi = vi.mocked(nodeApi);

describe('explorerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('loadTree', () => {
    it('sets tree, builds index, clears error and toggles loading', async () => {
      const tree = nestedTree();
      mockedApi.getTree.mockResolvedValue({ data: tree });

      const store = useExplorerStore();
      const promise = store.loadTree();
      expect(store.isLoadingTree).toBe(true);
      await promise;

      expect(store.tree).toEqual(tree);
      expect(store.error).toBeNull();
      expect(store.isLoadingTree).toBe(false);

      
      mockedApi.getChildren.mockResolvedValue({ data: [] });
      const grandchild = makeNode({ id: 'grandchild', parentId: 'child', type: 'file' });
      await store.selectNode(grandchild);
      expect(store.isExpanded('root')).toBe(true);
      expect(store.isExpanded('child')).toBe(true);
    });

    it('sets error and keeps tree empty on failure', async () => {
      mockedApi.getTree.mockRejectedValue(new Error('boom'));

      const store = useExplorerStore();
      await store.loadTree();

      expect(store.error).toBe('boom');
      expect(store.tree).toEqual([]);
      expect(store.isLoadingTree).toBe(false);
    });
  });

  describe('selectNode', () => {
    it('sets selectedNode, calls getChildren with id, sets children', async () => {
      const kids = [makeNode({ id: 'k1', parentId: 'root' })];
      mockedApi.getChildren.mockResolvedValue({ data: kids });

      const store = useExplorerStore();
      const node = makeNode({ id: 'root' });
      await store.selectNode(node);

      expect(store.selectedNode).toEqual(node);
      expect(mockedApi.getChildren).toHaveBeenCalledWith('root');
      expect(store.children).toEqual(kids);
      expect(store.isLoadingChildren).toBe(false);
    });

    it('expands ancestors but not the node itself', async () => {
      mockedApi.getTree.mockResolvedValue({ data: nestedTree() });
      mockedApi.getChildren.mockResolvedValue({ data: [] });

      const store = useExplorerStore();
      await store.loadTree();

      const grandchild = makeNode({ id: 'grandchild', parentId: 'child', type: 'file' });
      await store.selectNode(grandchild);

      expect(store.isExpanded('root')).toBe(true);
      expect(store.isExpanded('child')).toBe(true);
      expect(store.isExpanded('grandchild')).toBe(false);
    });

    it('clears search mode', async () => {
      mockedApi.getChildren.mockResolvedValue({ data: [] });
      mockedApi.search.mockResolvedValue({ data: [makeNode({ id: 's1' })] });

      const store = useExplorerStore();
      await store.runSearch('foo');
      expect(store.isSearchActive).toBe(true);

      await store.selectNode(makeNode({ id: 'root' }));
      expect(store.isSearchActive).toBe(false);
      expect(store.searchResults).toEqual([]);
      expect(store.searchQuery).toBe('');
    });

    it('sets error on getChildren failure', async () => {
      mockedApi.getChildren.mockRejectedValue(new Error('nope'));

      const store = useExplorerStore();
      await store.selectNode(makeNode({ id: 'root' }));

      expect(store.error).toBe('nope');
      expect(store.isLoadingChildren).toBe(false);
    });
  });

  describe('toggleExpand', () => {
    it('adds then removes an id', () => {
      const store = useExplorerStore();
      expect(store.isExpanded('x')).toBe(false);
      store.toggleExpand('x');
      expect(store.isExpanded('x')).toBe(true);
      store.toggleExpand('x');
      expect(store.isExpanded('x')).toBe(false);
    });
  });

  describe('runSearch', () => {
    it('activates search, calls search, sets results for a non-empty query', async () => {
      const results = [makeNode({ id: 's1' })];
      mockedApi.search.mockResolvedValue({ data: results });

      const store = useExplorerStore();
      await store.runSearch('report');

      expect(store.isSearchActive).toBe(true);
      expect(mockedApi.search).toHaveBeenCalledWith('report');
      expect(store.searchResults).toEqual(results);
      expect(store.isSearching).toBe(false);
    });

    it('does not call search for an empty query', async () => {
      const store = useExplorerStore();
      await store.runSearch('');

      expect(mockedApi.search).not.toHaveBeenCalled();
      expect(store.isSearchActive).toBe(false);
      expect(store.searchResults).toEqual([]);
    });

    it('does not call search for a whitespace-only query', async () => {
      const store = useExplorerStore();
      await store.runSearch('   ');

      expect(mockedApi.search).not.toHaveBeenCalled();
      expect(store.isSearchActive).toBe(false);
      expect(store.searchResults).toEqual([]);
    });

    it('trims the query before searching', async () => {
      mockedApi.search.mockResolvedValue({ data: [] });

      const store = useExplorerStore();
      await store.runSearch('  hi  ');

      expect(mockedApi.search).toHaveBeenCalledWith('hi');
    });

    it('sets error on search failure', async () => {
      mockedApi.search.mockRejectedValue(new Error('search-fail'));

      const store = useExplorerStore();
      await store.runSearch('q');

      expect(store.error).toBe('search-fail');
      expect(store.isSearching).toBe(false);
    });
  });

  describe('clearSearch', () => {
    it('resets query, results and active flag', async () => {
      mockedApi.search.mockResolvedValue({ data: [makeNode({ id: 's1' })] });

      const store = useExplorerStore();
      await store.runSearch('foo');
      store.clearSearch();

      expect(store.searchQuery).toBe('');
      expect(store.searchResults).toEqual([]);
      expect(store.isSearchActive).toBe(false);
    });
  });

  describe('clearError', () => {
    it('clears the error', async () => {
      mockedApi.getTree.mockRejectedValue(new Error('boom'));

      const store = useExplorerStore();
      await store.loadTree();
      expect(store.error).toBe('boom');

      store.clearError();
      expect(store.error).toBeNull();
    });
  });

  describe('rightPanelItems getter', () => {
    it('returns children when not searching', async () => {
      const kids = [makeNode({ id: 'k1' })];
      mockedApi.getChildren.mockResolvedValue({ data: kids });

      const store = useExplorerStore();
      await store.selectNode(makeNode({ id: 'root' }));

      expect(store.rightPanelItems).toEqual(kids);
    });

    it('returns search results when searching', async () => {
      const results = [makeNode({ id: 's1' })];
      mockedApi.search.mockResolvedValue({ data: results });

      const store = useExplorerStore();
      await store.runSearch('foo');

      expect(store.rightPanelItems).toEqual(results);
    });

    it('rightPanelItems returns trashItems in trash view', () => {
      const store = useExplorerStore();
      store.trashItems = [{ id: 't', name: 'T', type: 'folder', parentId: null, path: '/T', size: null, extension: null, createdAt: '', updatedAt: '' }];
      store.setView('trash');
      expect(store.rightPanelItems.map((n) => n.id)).toEqual(['t']);
    });
  });

  describe('isExpanded', () => {
    it('reflects the expandedIds set', () => {
      const store = useExplorerStore();
      expect(store.isExpanded('a')).toBe(false);
      store.toggleExpand('a');
      expect(store.isExpanded('a')).toBe(true);
    });
  });

  describe('collapseAll', () => {
    it('clears all expanded ids', () => {
      const store = useExplorerStore();
      store.toggleExpand('a');
      store.toggleExpand('b');
      expect(store.expandedIds.size).toBe(2);
      store.collapseAll();
      expect(store.expandedIds.size).toBe(0);
    });
  });

  describe('selection model', () => {
    const seedChildren = (store: ReturnType<typeof useExplorerStore>) => {
      store.children = [
        { id: 'a', name: 'A', type: 'folder', parentId: 'root', path: '/A', size: null, extension: null, createdAt: '', updatedAt: '' },
        { id: 'b', name: 'B', type: 'folder', parentId: 'root', path: '/B', size: null, extension: null, createdAt: '', updatedAt: '' },
        { id: 'c', name: 'c.txt', type: 'file', parentId: 'root', path: '/c.txt', size: 1, extension: 'txt', createdAt: '', updatedAt: '' },
      ];
      store.isSearchActive = false;
    };

    it('selectOnly replaces the selection with a single id', () => {
      const store = useExplorerStore();
      seedChildren(store);
      store.selectOnly('b');
      expect([...store.selectedIds]).toEqual(['b']);
    });

    it('toggleSelection adds then removes an id', () => {
      const store = useExplorerStore();
      seedChildren(store);
      store.toggleSelection('a');
      store.toggleSelection('c');
      expect(store.selectedIds.has('a')).toBe(true);
      expect(store.selectedIds.has('c')).toBe(true);
      store.toggleSelection('a');
      expect(store.selectedIds.has('a')).toBe(false);
    });

    it('selectRangeTo selects the inclusive range from the last clicked item', () => {
      const store = useExplorerStore();
      seedChildren(store);
      store.selectOnly('a');
      store.selectRangeTo('c');
      expect([...store.selectedIds].sort()).toEqual(['a', 'b', 'c']);
    });

    it('selectAll selects every right-panel item; clearSelection empties it', () => {
      const store = useExplorerStore();
      seedChildren(store);
      store.selectAll();
      expect(store.selectedIds.size).toBe(3);
      store.clearSelection();
      expect(store.selectedIds.size).toBe(0);
    });

    it('selectedNodes returns the Node objects for the selected ids', () => {
      const store = useExplorerStore();
      seedChildren(store);
      store.selectOnly('b');
      expect(store.selectedNodes.map((n) => n.id)).toEqual(['b']);
    });

    it('navigating with selectNode clears the selection', async () => {
      const store = useExplorerStore();
      seedChildren(store);
      store.selectOnly('b');
      await store.selectNode({ id: 'a', name: 'A', type: 'folder', parentId: 'root', path: '/A', size: null, extension: null, createdAt: '', updatedAt: '' });
      expect(store.selectedIds.size).toBe(0);
    });
  });

  describe('operations + clipboard + trash', () => {
    const docs = { id: 'docs', name: 'Documents', type: 'folder' as const, parentId: null, path: '/Documents', size: null, extension: null, createdAt: '', updatedAt: '' };

    beforeEach(() => {
      (nodeApi.getTree as any) = vi.fn(async () => ({ data: [] }));
      (nodeApi.getChildren as any) = vi.fn(async () => ({ data: [] }));
    });

    it('createFolderIn calls api with the current folder and refreshes', async () => {
      const store = useExplorerStore();
      store.selectedNode = docs;
      (nodeApi.createFolder as any) = vi.fn(async () => ({ data: { ...docs, id: 'new', name: 'New' } }));
      await store.createFolderIn('New');
      expect(nodeApi.createFolder).toHaveBeenCalledWith('New', 'docs');
      expect(nodeApi.getTree).toHaveBeenCalled();
    });

    it('renameNode calls api.rename and refreshes', async () => {
      const store = useExplorerStore();
      store.selectedNode = docs;
      (nodeApi.rename as any) = vi.fn(async () => ({ data: { ...docs, name: 'X' } }));
      await store.renameNode('docs', 'X');
      expect(nodeApi.rename).toHaveBeenCalledWith('docs', 'X');
    });

    it('copyToClipboard then pasteInto copies into the target', async () => {
      const store = useExplorerStore();
      store.selectedNode = docs;
      (nodeApi.copy as any) = vi.fn(async () => ({ created: [] }));
      store.copyToClipboard(['a', 'b']);
      expect(store.clipboard).toEqual({ ids: ['a', 'b'], mode: 'copy' });
      await store.pasteInto();
      expect(nodeApi.copy).toHaveBeenCalledWith(['a'], 'docs');
      expect(nodeApi.copy).toHaveBeenCalledWith(['b'], 'docs');
    });

    it('cutToClipboard then pasteInto moves and clears the clipboard', async () => {
      const store = useExplorerStore();
      store.selectedNode = docs;
      (nodeApi.move as any) = vi.fn(async () => ({ moved: 1 }));
      store.cutToClipboard(['a', 'b']);
      await store.pasteInto();
      expect(nodeApi.move).toHaveBeenCalledWith(['a'], 'docs');
      expect(nodeApi.move).toHaveBeenCalledWith(['b'], 'docs');
      expect(store.clipboard).toBeNull();
    });

    it('trashNodes calls api.trash with the ids, clears selection, refreshes', async () => {
      const store = useExplorerStore();
      store.selectedNode = docs;
      (nodeApi.trash as any) = vi.fn(async () => ({ trashed: 2 }));
      store.selectOnly('a'); store.toggleSelection('b');
      await store.trashNodes(['a', 'b']);
      expect(nodeApi.trash).toHaveBeenCalledWith(['a', 'b']);
      expect(store.selectedIds.size).toBe(0);
    });

    it('loadTrash populates trashItems and setView switches mode', async () => {
      const store = useExplorerStore();
      (nodeApi.getTrash as any) = vi.fn(async () => ({ data: [{ ...docs, id: 't', isTrashed: true }] }));
      store.setView('trash');
      await store.loadTrash();
      expect(store.view).toBe('trash');
      expect(store.trashItems.map((n) => n.id)).toEqual(['t']);
    });

    it('restoreNodes and permanentDeleteNodes call their APIs', async () => {
      const store = useExplorerStore();
      (nodeApi.getTrash as any) = vi.fn(async () => ({ data: [] }));
      (nodeApi.restore as any) = vi.fn(async () => ({ restored: 1 }));
      (nodeApi.permanentDelete as any) = vi.fn(async () => ({ deleted: 1 }));
      store.setView('trash');
      await store.restoreNodes(['t']);
      expect(nodeApi.restore).toHaveBeenCalledWith(['t']);
      await store.permanentDeleteNodes(['t']);
      expect(nodeApi.permanentDelete).toHaveBeenCalledWith(['t']);
    });
  });

  describe('preview + upload + extract', () => {
    const docs = { id: 'docs', name: 'Documents', type: 'folder' as const, parentId: null, path: '/Documents', size: null, extension: null, createdAt: '', updatedAt: '' };
    const file = { id: 'f', name: 'a.png', type: 'file' as const, parentId: 'docs', path: '/Documents/a.png', size: 10, extension: 'png', storageKey: 'k', mimeType: 'image/png', createdAt: '', updatedAt: '' };

    beforeEach(() => {
      (nodeApi.getTree as any) = vi.fn(async () => ({ data: [] }));
      (nodeApi.getChildren as any) = vi.fn(async () => ({ data: [] }));
    });

    it('openPreview sets the node and makes it visible; closePreview hides; toggle flips', () => {
      const store = useExplorerStore();
      store.openPreview(file);
      expect(store.preview.node?.id).toBe('f');
      expect(store.preview.visible).toBe(true);
      store.closePreview();
      expect(store.preview.visible).toBe(false);
      store.togglePreview();
      expect(store.preview.visible).toBe(true);
    });

    it('uploadFiles uploads to the current folder and refreshes', async () => {
      const store = useExplorerStore();
      store.selectedNode = docs;
      (nodeApi.upload as any) = vi.fn(async (_pid: string | null, _files: File[], onProg?: (l: number, t: number) => void) => {
        onProg?.(50, 100);
        return { data: [file] };
      });
      const fileObj = new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' });
      await store.uploadFiles([fileObj]);
      expect(nodeApi.upload).toHaveBeenCalled();
      expect((nodeApi.upload as any).mock.calls[0][0]).toBe('docs');
      expect(nodeApi.getTree).toHaveBeenCalled();
      expect(store.progress.active).toBe(false);
    });

    it('uploadFiles is a no-op for an empty list', async () => {
      const store = useExplorerStore();
      (nodeApi.upload as any) = vi.fn();
      await store.uploadFiles([]);
      expect(nodeApi.upload).not.toHaveBeenCalled();
    });

    it('extractNode calls api.extract and refreshes', async () => {
      const store = useExplorerStore();
      store.selectedNode = docs;
      (nodeApi.extract as any) = vi.fn(async () => ({ created: [] }));
      await store.extractNode('zip-id');
      expect(nodeApi.extract).toHaveBeenCalledWith('zip-id');
      expect(nodeApi.getTree).toHaveBeenCalled();
    });

    it('extractNode surfaces a capability error through the error channel', async () => {
      const store = useExplorerStore();
      (nodeApi.extract as any) = vi.fn(async () => { throw new Error('Install 7z'); });
      await expect(store.extractNode('z')).rejects.toThrow(/install 7z/i);
      expect(store.error).toMatch(/install 7z/i);
    });
  });

  describe('navigation exits trash view', () => {
    it('selectNode switches view back to browse', async () => {
      const store = useExplorerStore();
      (nodeApi.getTree as any) = vi.fn(async () => ({ data: [] }));
      (nodeApi.getChildren as any) = vi.fn(async () => ({ data: [] }));
      store.setView('trash');
      expect(store.view).toBe('trash');
      await store.selectNode({ id: 'docs', name: 'Documents', type: 'folder', parentId: null, path: '/Documents', size: null, extension: null, createdAt: '', updatedAt: '' });
      expect(store.view).toBe('browse');
    });
  });
});
