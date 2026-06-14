<script setup lang="ts">
import { computed } from 'vue';
import {
  mdiDeleteRestore,
  mdiDeleteForever,
  mdiTrashCanOutline,
} from '@mdi/js';
import MdiIcon from './MdiIcon.vue';
import EmptyState from './EmptyState.vue';
import { useExplorerStore } from '@/stores/explorerStore';
import { useDialogs } from '@/composables/useDialogs';
import { getNodeIcon } from '@/utils/nodeIcon';
import { formatSize } from '@/utils/formatSize';
import type { Node } from '@/types/node';

const store = useExplorerStore();

const hasSelection = computed(() => store.selectedIds.size > 0);

function onRowClick(item: Node, ev: MouseEvent): void {
  if (ev.ctrlKey || ev.metaKey) store.toggleSelection(item.id);
  else store.selectOnly(item.id);
}

async function onEmpty(): Promise<void> {
  const ok = await useDialogs().confirm({
    title: 'Empty Recycle Bin',
    message: 'Permanently delete all items in the Recycle Bin? This cannot be undone.',
    confirmLabel: 'Empty',
    danger: true,
  });
  if (ok) await store.emptyTrashAll();
}

async function onRestore(): Promise<void> {
  await store.restoreNodes([...store.selectedIds]);
}

async function onPermanentDelete(): Promise<void> {
  const n = store.selectedIds.size;
  const ok = await useDialogs().confirm({
    title: 'Delete permanently',
    message: `Permanently delete ${n} item${n > 1 ? 's' : ''}? This cannot be undone.`,
    confirmLabel: 'Delete',
    danger: true,
  });
  if (ok) await store.permanentDeleteNodes([...store.selectedIds]);
}
</script>

<template>
  <section class="trash-view">
    <header class="trash-view__header">
      <div class="trash-view__title-block">
        <h2 class="trash-view__title">Recycle Bin</h2>
        <p class="trash-view__count">
          {{ store.trashItems.length }}
          {{ store.trashItems.length === 1 ? 'item' : 'items' }}
        </p>
      </div>

      <button
        type="button"
        class="trash-view__empty-btn"
        :disabled="store.trashItems.length === 0"
        title="Empty Recycle Bin"
        @click="onEmpty"
      >
        <MdiIcon :path="mdiTrashCanOutline" :size="16" />
        <span>Empty Recycle Bin</span>
      </button>
    </header>

    <div
      v-if="hasSelection"
      class="trash-view__bulk"
      role="toolbar"
      aria-label="Recycle Bin actions"
    >
      <span class="trash-view__bulk-count">
        {{ store.selectedIds.size }} selected
      </span>
      <div class="trash-view__bulk-actions">
        <button
          type="button"
          class="trash-view__bulk-btn"
          title="Restore"
          @click="onRestore"
        >
          <MdiIcon :path="mdiDeleteRestore" :size="16" />
          <span>Restore</span>
        </button>
        <button
          type="button"
          class="trash-view__bulk-btn trash-view__bulk-btn--danger"
          title="Delete permanently"
          @click="onPermanentDelete"
        >
          <MdiIcon :path="mdiDeleteForever" :size="16" />
          <span>Delete permanently</span>
        </button>
      </div>
    </div>

    <div class="trash-view__body">
      <div v-if="store.isLoadingTrash" class="trash-view__skeletons">
        <div v-for="i in 8" :key="i" class="skeleton-row">
          <div class="skeleton skeleton-row__icon" />
          <div class="skeleton-row__lines">
            <div class="skeleton skeleton-row__line" />
            <div class="skeleton skeleton-row__line is-short" />
          </div>
        </div>
      </div>

      <EmptyState
        v-else-if="store.trashItems.length === 0"
        :icon="mdiTrashCanOutline"
        title="Recycle Bin is empty"
        description="Items you delete will appear here, where you can restore or permanently remove them."
      />

      <ul v-else class="trash-view__list">
        <li
          v-for="item in store.trashItems"
          :key="item.id"
          class="trash-row"
          :class="{ 'is-selected': store.selectedIds.has(item.id) }"
          @click="onRowClick(item, $event)"
        >
          <div class="trash-row__icon">
            <MdiIcon :path="getNodeIcon(item.type, item.extension)" :size="24" />
          </div>

          <div class="trash-row__body">
            <span class="trash-row__name" :title="item.name">{{ item.name }}</span>
            <span class="trash-row__path" :title="item.path">{{ item.path }}</span>
          </div>

          <span
            v-if="item.type === 'file' && formatSize(item.size)"
            class="trash-row__size"
          >{{ formatSize(item.size) }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.trash-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.trash-view__header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-divider);
  background-color: var(--color-bg-panel);
}

.trash-view__title-block {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.trash-view__title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

.trash-view__count {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.trash-view__empty-btn {
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
  transition: background-color var(--transition), opacity var(--transition);
}

.trash-view__empty-btn:hover:not(:disabled) {
  background-color: var(--color-error-bg);
}

.trash-view__empty-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.trash-view__bulk {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-3) var(--space-4) 0;
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-accent-subtle);
  border: 1px solid var(--color-accent-border, var(--color-accent));
  border-radius: var(--radius-md);
  animation: fadeIn var(--transition-slow) var(--ease-out) both;
}

.trash-view__bulk-count {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-accent);
}

.trash-view__bulk-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex: 1;
}

.trash-view__bulk-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  transition: color var(--transition), background-color var(--transition);
}

.trash-view__bulk-btn:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-hover);
}

.trash-view__bulk-btn--danger {
  color: var(--color-error-text);
}

.trash-view__bulk-btn--danger:hover {
  color: var(--color-error-text);
  background-color: var(--color-error-bg);
}

.trash-view__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-4);
}

.trash-view__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  list-style: none;
}

.trash-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-panel);
  cursor: pointer;
  transition:
    background-color var(--transition),
    border-color var(--transition),
    box-shadow var(--transition);
}

.trash-row:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

.trash-row.is-selected,
.trash-row.is-selected:hover {
  background-color: var(--color-bg-selected);
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.trash-row__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-active);
  color: var(--color-text-tertiary);
}

.trash-row__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trash-row__name {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-tight);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trash-row__path {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trash-row__size {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.trash-view__skeletons {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-panel);
}

.skeleton-row__icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.skeleton-row__lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.skeleton-row__line {
  height: 10px;
}

.skeleton-row__line.is-short {
  width: 40%;
}
</style>
