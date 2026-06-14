<script setup lang="ts">
import { computed } from 'vue';
import {
  mdiContentCopy,
  mdiContentCut,
  mdiDownload,
  mdiDeleteOutline,
  mdiClose,
} from '@mdi/js';
import MdiIcon from './MdiIcon.vue';
import { useExplorerStore } from '@/stores/explorerStore';
import { useDialogs } from '@/composables/useDialogs';
import { nodeApi } from '@/services/nodeApi';

const store = useExplorerStore();

const singleFile = computed(() => {
  const sel = store.selectedNodes;
  return sel.length === 1 && sel[0].type === 'file' ? sel[0] : null;
});

function onCopy(): void {
  store.copyToClipboard([...store.selectedIds]);
}

function onCut(): void {
  store.cutToClipboard([...store.selectedIds]);
}

function onDownload(): void {
  if (singleFile.value) {
    window.open(nodeApi.contentUrl(singleFile.value.id, 'attachment'), '_blank');
  }
}

async function onDelete(): Promise<void> {
  const n = store.selectedIds.size;
  const ok = await useDialogs().confirm({
    title: 'Move to Recycle Bin',
    message: `Move ${n} item${n > 1 ? 's' : ''} to the Recycle Bin?`,
    confirmLabel: 'Move to Bin',
    danger: true,
  });
  if (ok) await store.trashNodes([...store.selectedIds]);
}

function onClear(): void {
  store.clearSelection();
}
</script>

<template>
  <div
    v-if="store.selectedIds.size > 0 && store.view === 'browse'"
    class="selection-bar"
    role="toolbar"
    aria-label="Selection actions"
  >
    <span class="selection-bar__count">
      {{ store.selectedIds.size }} selected
    </span>

    <div class="selection-bar__actions">
      <button
        type="button"
        class="selection-bar__btn"
        aria-label="Copy"
        title="Copy"
        @click="onCopy"
      >
        <MdiIcon :path="mdiContentCopy" :size="16" />
        <span>Copy</span>
      </button>
      <button
        type="button"
        class="selection-bar__btn"
        aria-label="Cut"
        title="Cut"
        @click="onCut"
      >
        <MdiIcon :path="mdiContentCut" :size="16" />
        <span>Cut</span>
      </button>
      <button
        v-if="singleFile"
        type="button"
        class="selection-bar__btn"
        aria-label="Download"
        title="Download"
        @click="onDownload"
      >
        <MdiIcon :path="mdiDownload" :size="16" />
        <span>Download</span>
      </button>
      <button
        type="button"
        class="selection-bar__btn selection-bar__btn--danger"
        aria-label="Delete"
        title="Move to Recycle Bin"
        @click="onDelete"
      >
        <MdiIcon :path="mdiDeleteOutline" :size="16" />
        <span>Delete</span>
      </button>
    </div>

    <button
      type="button"
      class="selection-bar__close"
      aria-label="Clear selection"
      title="Clear selection"
      @click="onClear"
    >
      <MdiIcon :path="mdiClose" :size="16" />
    </button>
  </div>
</template>

<style scoped>
.selection-bar {
  position: absolute;
  bottom: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-sticky, 20);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  max-width: calc(100% - var(--space-6));
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-full, 9999px);
  box-shadow: var(--shadow-lg, var(--shadow-md));
  animation: fadeInUp var(--transition-slow) var(--ease-out) both;
}

.selection-bar__count {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-accent);
  white-space: nowrap;
  flex-shrink: 0;
}

.selection-bar__actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.selection-bar__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  white-space: nowrap;
  transition:
    color var(--transition),
    background-color var(--transition);
}

.selection-bar__btn:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-hover);
}

.selection-bar__btn--danger {
  color: var(--color-error-text);
}

.selection-bar__btn--danger:hover {
  color: var(--color-error-text);
  background-color: var(--color-error-bg);
}

.selection-bar__close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  border-radius: var(--radius-sm);
  transition:
    color var(--transition),
    background-color var(--transition);
}

.selection-bar__close:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-hover);
}

@media (max-width: 767px) {
  .selection-bar {
    left: var(--space-3);
    right: var(--space-3);
    bottom: var(--space-3);
    transform: none;
    max-width: none;
    flex-wrap: wrap;
    justify-content: space-between;
    border-radius: var(--radius-lg);
  }

  .selection-bar__actions {
    order: 3;
    flex-basis: 100%;
    justify-content: space-between;
    gap: var(--space-1);
  }

  .selection-bar__btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
