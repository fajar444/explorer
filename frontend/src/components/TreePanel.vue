<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  mdiFolderMultipleOutline,
  mdiUnfoldLessHorizontal,
  mdiFolderPlusOutline,
  mdiTrashCanOutline,
} from '@mdi/js';
import MdiIcon from './MdiIcon.vue';
import TreeNode from './TreeNode.vue';
import NewFolderDialog from './NewFolderDialog.vue';
import { useExplorerStore } from '@/stores/explorerStore';

const store = useExplorerStore();

const showNewFolder = ref(false);

async function onNewFolderSubmit(name: string): Promise<void> {
  await store.createFolderIn(name);
  showNewFolder.value = false;
}

async function toggleRecycleBin(): Promise<void> {
  if (store.view === 'trash') {
    store.setView('browse');
  } else {
    store.setView('trash');
    await store.loadTrash();
  }
}

const rootCount = computed(() => store.tree.length);

const showError = computed(() => !!store.error && store.tree.length === 0);
const showEmpty = computed(
  () => !store.isLoadingTree && !showError.value && store.tree.length === 0,
);
const showTree = computed(
  () => !store.isLoadingTree && store.tree.length > 0,
);

const skeletonRows = [
  { depth: 0, width: '58%' },
  { depth: 1, width: '72%' },
  { depth: 1, width: '46%' },
  { depth: 2, width: '64%' },
  { depth: 0, width: '52%' },
  { depth: 1, width: '68%' },
  { depth: 1, width: '40%' },
];
</script>

<template>
  <aside class="tree-panel" data-tour="tree">
    <header class="tree-panel__header">
      <MdiIcon :path="mdiFolderMultipleOutline" :size="18" />
      <span class="tree-panel__title">Folders</span>
      <span v-if="showTree" class="tree-panel__count">{{ rootCount }}</span>

      <div class="tree-panel__toolbar" data-tour="tree-toolbar">
        <button
          type="button"
          class="tree-panel__tool-btn"
          aria-label="Collapse all"
          title="Collapse all"
          @click="store.collapseAll()"
        >
          <MdiIcon :path="mdiUnfoldLessHorizontal" :size="16" />
        </button>
        <button
          type="button"
          class="tree-panel__tool-btn"
          aria-label="New folder"
          title="New folder"
          @click="showNewFolder = true"
        >
          <MdiIcon :path="mdiFolderPlusOutline" :size="16" />
        </button>
        <button
          type="button"
          class="tree-panel__tool-btn"
          :class="{ 'is-active': store.view === 'trash' }"
          :aria-pressed="store.view === 'trash'"
          aria-label="Recycle Bin"
          title="Recycle Bin"
          @click="toggleRecycleBin"
        >
          <MdiIcon :path="mdiTrashCanOutline" :size="16" />
        </button>
      </div>
    </header>

    <div class="tree-panel__body">
      <div v-if="store.isLoadingTree" class="tree-panel__skeletons" aria-hidden="true">
        <div
          v-for="(row, i) in skeletonRows"
          :key="i"
          class="skeleton-row"
          :style="{ paddingLeft: `${8 + row.depth * 16}px` }"
        >
          <span class="skeleton skeleton-row__chevron" />
          <span class="skeleton skeleton-row__icon" />
          <span class="skeleton skeleton-row__label" :style="{ width: row.width }" />
        </div>
      </div>

      <div v-else-if="showError" class="tree-panel__error" role="alert">
        <p class="tree-panel__error-title">Couldn't load folders</p>
        <p class="tree-panel__error-msg">{{ store.error }}</p>
        <button
          type="button"
          class="tree-panel__retry"
          @click="store.loadTree()"
        >
          Retry
        </button>
      </div>

      <div v-else-if="showEmpty" class="tree-panel__empty">No folders</div>

      <div v-else-if="showTree" class="tree-panel__tree" role="tree">
        <TreeNode
          v-for="root in store.tree"
          :key="root.id"
          :node="root"
          :depth="0"
        />
      </div>
    </div>

    <NewFolderDialog
      :visible="showNewFolder"
      @submit="onNewFolderSubmit"
      @cancel="showNewFolder = false"
    />
  </aside>
</template>

<style scoped>
.tree-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background-color: var(--color-bg-panel);
  border-right: 1px solid var(--color-border);
}

.tree-panel__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-divider);
  color: var(--color-text-secondary);
}

.tree-panel__title {
  flex: 1;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
}

.tree-panel__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-tertiary);
  background-color: var(--color-bg-hover);
  border-radius: var(--radius-full);
}

.tree-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.tree-panel__tool-btn {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  transition:
    color var(--transition),
    background-color var(--transition);
}

.tree-panel__tool-btn:hover {
  color: var(--color-text-secondary);
  background-color: var(--color-bg-hover);
}

.tree-panel__tool-btn:active {
  background-color: var(--color-bg-active);
}

.tree-panel__tool-btn.is-active {
  color: var(--color-accent);
  background-color: var(--color-accent-subtle);
}

.tree-panel__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-2);
}

.tree-panel__tree {
  display: flex;
  flex-direction: column;
  gap: 1px;
  animation: fadeIn var(--transition-slow) var(--ease-out);
}

.tree-panel__skeletons {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-1);
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 30px;
}

.skeleton-row__chevron {
  width: 14px;
  height: 14px;
  border-radius: var(--radius-sm);
}

.skeleton-row__icon {
  width: 18px;
  height: 18px;
  border-radius: var(--radius-sm);
}

.skeleton-row__label {
  height: 10px;
}

.tree-panel__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  margin: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-md);
  animation: fadeIn var(--transition-slow) var(--ease-out);
}

.tree-panel__error-title {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-error-text);
}

.tree-panel__error-msg {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  word-break: break-word;
}

.tree-panel__retry {
  margin-top: var(--space-1);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-accent-contrast);
  background-color: var(--color-accent);
  border-radius: var(--radius-sm);
  transition:
    background-color var(--transition),
    transform var(--transition);
}

.tree-panel__retry:hover {
  background-color: var(--color-accent-hover);
}

.tree-panel__retry:active {
  transform: scale(0.97);
}

.tree-panel__empty {
  padding: var(--space-5) var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  text-align: center;
}
</style>
