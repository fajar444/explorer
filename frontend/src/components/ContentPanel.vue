<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  mdiAlertCircleOutline,
  mdiRefresh,
  mdiFolderOpenOutline,
  mdiFileQuestionOutline,
  mdiViewGridOutline,
  mdiViewListOutline,
  mdiContentCut,
  mdiContentCopy,
  mdiContentPaste,
  mdiPencilOutline,
  mdiFolderPlusOutline,
  mdiDeleteOutline,
  mdiEye,
  mdiDownload,
  mdiArchiveArrowDownOutline,
  mdiUpload,
} from '@mdi/js';
import MdiIcon from './MdiIcon.vue';
import Breadcrumb from './Breadcrumb.vue';
import SearchResultsInfo from './SearchResultsInfo.vue';
import NodeGrid from './NodeGrid.vue';
import SelectionBar from './SelectionBar.vue';
import EmptyState from './EmptyState.vue';
import ContextMenu from './ContextMenu.vue';
import NewFolderDialog from './NewFolderDialog.vue';
import RenameDialog from './RenameDialog.vue';
import TrashView from './TrashView.vue';
import { useExplorerStore } from '@/stores/explorerStore';
import { useDialogs } from '@/composables/useDialogs';
import { previewKind, isArchive } from '@/utils/previewKind';
import { nodeApi } from '@/services/nodeApi';
import type { ContextMenuItem } from '@/types/contextMenu';
import type { Node } from '@/types/node';

const store = useExplorerStore();

const menuVisible = ref(false);
const menuPos = ref<{ x: number; y: number }>({ x: 0, y: 0 });
const menuItems = ref<ContextMenuItem[]>([]);
const contextTarget = ref<Node | null>(null);
const showNewFolder = ref(false);
const showRename = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);
const dragDepth = ref(0);
const isDraggingFiles = ref(false);

const hasFiles = (e: DragEvent): boolean =>
  !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');

async function onFilePicked(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = '';
  if (files.length) await store.uploadFiles(files);
}

function onBodyDragEnter(e: DragEvent): void {
  if (!hasFiles(e)) return;
  dragDepth.value++;
  isDraggingFiles.value = true;
}

function onBodyDragOver(e: DragEvent): void {
  if (!hasFiles(e)) return;
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
}

function onBodyDragLeave(): void {
  dragDepth.value = Math.max(0, dragDepth.value - 1);
  if (dragDepth.value === 0) isDraggingFiles.value = false;
}

async function onBodyDrop(e: DragEvent): Promise<void> {
  dragDepth.value = 0;
  isDraggingFiles.value = false;
  if (!hasFiles(e)) return;
  const files = Array.from(e.dataTransfer?.files ?? []);
  if (files.length) await store.uploadFiles(files);
}

const renameTargetName = computed(
  () => store.selectedNodes[0]?.name ?? contextTarget.value?.name ?? '',
);

function openNodeMenu(node: Node, pos: { x: number; y: number }): void {
  contextTarget.value = node;
  const count = store.selectedIds.size;
  const items: ContextMenuItem[] = [];
  if (node.type === 'file' && count === 1) {
    if (previewKind(node) !== 'none') {
      items.push({ id: 'preview', label: 'Preview', icon: mdiEye });
    }
    items.push({ id: 'download', label: 'Download', icon: mdiDownload });
    if (isArchive(node)) {
      items.push({ id: 'extract', label: 'Extract here', icon: mdiArchiveArrowDownOutline });
    }
    items.push({ id: 'sepFile', separator: true });
  }
  if (node.type === 'folder' && count === 1) {
    items.push({ id: 'open', label: 'Open', icon: mdiFolderOpenOutline });
  }
  items.push(
    { id: 'cut', label: 'Cut', icon: mdiContentCut },
    { id: 'copy', label: 'Copy', icon: mdiContentCopy },
    { id: 'paste', label: 'Paste', icon: mdiContentPaste, disabled: !store.clipboard },
    { id: 'rename', label: 'Rename', icon: mdiPencilOutline, disabled: count !== 1 },
    { id: 'sep1', separator: true },
    { id: 'delete', label: 'Delete', icon: mdiDeleteOutline, danger: true },
  );
  menuItems.value = items;
  menuPos.value = pos;
  menuVisible.value = true;
}

function openEmptyMenu(pos: { x: number; y: number }): void {
  contextTarget.value = null;
  menuItems.value = [
    { id: 'newFolder', label: 'New Folder', icon: mdiFolderPlusOutline },
    { id: 'paste', label: 'Paste', icon: mdiContentPaste, disabled: !store.clipboard },
  ];
  menuPos.value = pos;
  menuVisible.value = true;
}

function onBodyContextMenu(ev: MouseEvent): void {
  if (store.view !== 'browse' || !store.selectedNode || store.isSearchActive) return;
  if ((ev.target as HTMLElement).closest('[data-id]')) return;
  ev.preventDefault();
  openEmptyMenu({ x: ev.clientX, y: ev.clientY });
}

async function onMenuAction(id: string): Promise<void> {
  menuVisible.value = false;
  switch (id) {
    case 'open':
      if (contextTarget.value?.type === 'folder') void store.selectNode(contextTarget.value);
      break;
    case 'preview':
      if (contextTarget.value) store.openPreview(contextTarget.value);
      break;
    case 'download':
      if (contextTarget.value) window.open(nodeApi.contentUrl(contextTarget.value.id, 'attachment'), '_blank');
      break;
    case 'extract':
      if (contextTarget.value) await store.extractNode(contextTarget.value.id);
      break;
    case 'cut':
      store.cutToClipboard([...store.selectedIds]);
      break;
    case 'copy':
      store.copyToClipboard([...store.selectedIds]);
      break;
    case 'paste':
      await store.pasteInto();
      break;
    case 'rename':
      showRename.value = true;
      break;
    case 'newFolder':
      showNewFolder.value = true;
      break;
    case 'delete': {
      const n = store.selectedIds.size;
      const ok = await useDialogs().confirm({
        title: 'Move to Recycle Bin',
        message: `Move ${n} item${n > 1 ? 's' : ''} to the Recycle Bin?`,
        confirmLabel: 'Move to Bin',
        danger: true,
      });
      if (ok) await store.trashNodes([...store.selectedIds]);
      break;
    }
  }
}

async function onNewFolderSubmit(name: string): Promise<void> {
  showNewFolder.value = false;
  await store.createFolderIn(name);
}

async function onRenameSubmit(name: string): Promise<void> {
  const id = store.selectedNodes[0]?.id ?? contextTarget.value?.id;
  showRename.value = false;
  if (id) await store.renameNode(id, name);
}

const view = ref<'grid' | 'list'>('grid');

const counts = computed(() => {
  const folders = store.children.filter((n) => n.type === 'folder').length;
  const files = store.children.length - folders;
  return { total: store.children.length, folders, files };
});

const isLoading = computed(
  () => store.isSearching || store.isLoadingChildren,
);

const noResultsDescription = computed(
  () => `No folders or files match "${store.searchQuery}"`,
);

function retry(): void {
  if (store.isSearchActive) {
    void store.runSearch(store.searchQuery);
  } else if (store.selectedNode) {
    void store.selectNode(store.selectedNode);
  }
}
</script>

<template>
  <section class="content-panel">
    <TrashView v-if="store.view === 'trash'" />

    <template v-else>
    <header class="content-panel__header" data-tour="content-toolbar">
      <div class="content-panel__header-main">
        <SearchResultsInfo v-if="store.isSearchActive" />
        <Breadcrumb v-else />

        <p
          v-if="!store.isSearchActive && store.selectedNode"
          class="content-panel__counts"
        >
          {{ counts.total }} {{ counts.total === 1 ? 'item' : 'items' }}
          <template v-if="counts.total > 0">
            · {{ counts.folders }}
            {{ counts.folders === 1 ? 'folder' : 'folders' }}
            · {{ counts.files }}
            {{ counts.files === 1 ? 'file' : 'files' }}
          </template>
        </p>
      </div>

      <button
        v-if="store.view === 'browse'"
        type="button"
        class="content-panel__toggle-btn content-panel__upload-btn"
        aria-label="Upload files"
        title="Upload files"
        @click="fileInput?.click()"
      >
        <MdiIcon :path="mdiUpload" :size="18" />
      </button>
      <input
        ref="fileInput"
        type="file"
        multiple
        class="content-panel__file-input"
        @change="onFilePicked"
      />

      <div class="content-panel__view-toggle" role="group" aria-label="View">
        <button
          type="button"
          class="content-panel__toggle-btn"
          :class="{ 'is-active': view === 'grid' }"
          :aria-pressed="view === 'grid'"
          title="Grid view"
          @click="view = 'grid'"
        >
          <MdiIcon :path="mdiViewGridOutline" :size="18" />
        </button>
        <button
          type="button"
          class="content-panel__toggle-btn"
          :class="{ 'is-active': view === 'list' }"
          :aria-pressed="view === 'list'"
          title="List view"
          @click="view = 'list'"
        >
          <MdiIcon :path="mdiViewListOutline" :size="18" />
        </button>
      </div>
    </header>

    <div
      class="content-panel__body"
      data-tour="content"
      :class="[`is-${view}`, { 'has-selection-bar': store.selectedIds.size > 0 }]"
      @contextmenu="onBodyContextMenu"
      @dragenter.prevent="onBodyDragEnter"
      @dragover.prevent="onBodyDragOver"
      @dragleave="onBodyDragLeave"
      @drop.prevent="onBodyDrop"
    >
      <div v-if="isDraggingFiles" class="content-panel__dropzone">
        <MdiIcon :path="mdiUpload" :size="40" />
        <p class="content-panel__dropzone-text">Drop files to upload</p>
      </div>

      <div v-if="isLoading" class="content-panel__skeletons">
        <div v-for="i in 8" :key="i" class="skeleton-card">
          <div class="skeleton skeleton-card__icon" />
          <div class="skeleton-card__lines">
            <div class="skeleton skeleton-card__line" />
            <div class="skeleton skeleton-card__line is-short" />
          </div>
        </div>
      </div>

      <div v-else-if="store.error" class="content-panel__error" role="alert">
        <MdiIcon
          class="content-panel__error-icon"
          :path="mdiAlertCircleOutline"
          :size="32"
        />
        <div class="content-panel__error-text">
          <p class="content-panel__error-title">Something went wrong</p>
          <p class="content-panel__error-message">{{ store.error }}</p>
        </div>
        <button
          type="button"
          class="content-panel__retry"
          @click="retry"
        >
          <MdiIcon :path="mdiRefresh" :size="16" />
          <span>Retry</span>
        </button>
      </div>

      <EmptyState
        v-else-if="store.isSearchActive && store.rightPanelItems.length === 0"
        :icon="mdiFileQuestionOutline"
        title="No results"
        :description="noResultsDescription"
      />

      <EmptyState
        v-else-if="!store.selectedNode && !store.isSearchActive"
        :icon="mdiFolderOpenOutline"
        title="Select a folder"
        description="Choose a folder on the left to view its contents"
      />

      <EmptyState
        v-else-if="store.rightPanelItems.length === 0"
        :icon="mdiFolderOpenOutline"
        title="This folder is empty"
        description="There are no folders or files here yet"
      />

      <NodeGrid
        v-else
        :items="store.rightPanelItems"
        :show-path="store.isSearchActive"
        @node-context-menu="openNodeMenu"
        @item-drag-start="() => {}"
      />
    </div>
    </template>

    <SelectionBar />

    <ContextMenu
      :x="menuPos.x"
      :y="menuPos.y"
      :visible="menuVisible"
      :items="menuItems"
      @select="onMenuAction"
      @close="menuVisible = false"
    />
    <NewFolderDialog
      :visible="showNewFolder"
      @submit="onNewFolderSubmit"
      @cancel="showNewFolder = false"
    />
    <RenameDialog
      :visible="showRename"
      :current-name="renameTargetName"
      @submit="onRenameSubmit"
      @cancel="showRename = false"
    />
  </section>
</template>

<style scoped>
.content-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background-color: var(--color-bg-app);
}

.content-panel__header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-divider);
  background-color: var(--color-bg-panel);
}

.content-panel__header-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.content-panel__counts {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.content-panel__upload-btn {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
}

.content-panel__file-input {
  display: none;
}

.content-panel__view-toggle {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-active);
  flex-shrink: 0;
}

.content-panel__toggle-btn {
  display: grid;
  place-items: center;
  width: 30px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  transition: color var(--transition), background-color var(--transition);
}

.content-panel__toggle-btn:hover {
  color: var(--color-text-secondary);
}

.content-panel__toggle-btn.is-active {
  background-color: var(--color-bg-panel);
  color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.content-panel__body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-4);
}

.content-panel__body.has-selection-bar {
  padding-bottom: calc(var(--space-8) + var(--space-6));
}

@media (max-width: 767px) {
  .content-panel__body.has-selection-bar {
    padding-bottom: calc(var(--space-8) * 3);
  }
}

.content-panel__dropzone {
  position: absolute;
  inset: var(--space-3);
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  border: 2px dashed var(--color-accent);
  border-radius: var(--radius-lg);
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  pointer-events: none;
  animation: fadeIn var(--transition) var(--ease-out) both;
}

.content-panel__dropzone-text {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.content-panel__body.is-list :deep(.node-grid) {
  grid-template-columns: 1fr;
}

.content-panel__skeletons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: var(--space-3);
}

.content-panel__body.is-list .content-panel__skeletons {
  grid-template-columns: 1fr;
}

.skeleton-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-panel);
}

.skeleton-card__icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.skeleton-card__lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.skeleton-card__line {
  height: 10px;
}

.skeleton-card__line.is-short {
  width: 50%;
}

.content-panel__error {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-error-bg);
  animation: fadeIn var(--transition-slow) var(--ease-out) both;
}

.content-panel__error-icon {
  color: var(--color-error-text);
  flex-shrink: 0;
}

.content-panel__error-text {
  flex: 1;
  min-width: 0;
}

.content-panel__error-title {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-error-text);
}

.content-panel__error-message {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  word-break: break-word;
}

.content-panel__retry {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-error-border);
  color: var(--color-error-text);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  flex-shrink: 0;
  transition: background-color var(--transition);
}

.content-panel__retry:hover {
  background-color: var(--color-error-bg);
}
</style>
