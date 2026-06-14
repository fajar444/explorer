<script setup lang="ts">
import { computed, ref } from 'vue';
import { mdiChevronRight } from '@mdi/js';
import MdiIcon from './MdiIcon.vue';
import { useExplorerStore } from '@/stores/explorerStore';
import { getNodeIcon } from '@/utils/nodeIcon';
import { formatSize } from '@/utils/formatSize';
import type { Node } from '@/types/node';

const props = withDefaults(
  defineProps<{
    node: Node;
    showPath?: boolean;
  }>(),
  { showPath: false },
);

const emit = defineEmits<{
  (e: 'itemClick', node: Node, mods: { ctrl: boolean; shift: boolean }): void;
  (e: 'itemDblClick', node: Node): void;
  (e: 'itemContextMenu', node: Node, pos: { x: number; y: number }): void;
  (e: 'itemDragStart', node: Node, event: DragEvent): void;
}>();

const store = useExplorerStore();

const isFolder = computed(() => props.node.type === 'folder');
const isSelected = computed(() => store.selectedIds.has(props.node.id));
const icon = computed(() => getNodeIcon(props.node.type, props.node.extension));
const sizeLabel = computed(() => formatSize(props.node.size));
const extBadge = computed(() => props.node.extension?.toUpperCase() ?? '');

const isDropTarget = ref(false);

const DRAG_MIME = 'application/x-explorer-ids';

function onDragStart(event: DragEvent): void {
  if (!store.selectedIds.has(props.node.id)) store.selectOnly(props.node.id);

  const ids = [...store.selectedIds];
  event.dataTransfer?.setData(DRAG_MIME, JSON.stringify(ids));
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';

  emit('itemDragStart', props.node, event);
}

function onDragOver(event: DragEvent): void {
  if (!isFolder.value) return;
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  isDropTarget.value = true;
}

function onDragLeave(): void {
  isDropTarget.value = false;
}

async function onDrop(event: DragEvent): Promise<void> {
  if (!isFolder.value) return;
  isDropTarget.value = false;
  const raw = event.dataTransfer?.getData(DRAG_MIME);
  const ids = raw ? (JSON.parse(raw) as string[]) : [];
  if (ids.length && !ids.includes(props.node.id)) {
    await store.moveNodes(ids, props.node.id);
  }
}
</script>

<template>
  <component
    :is="isFolder ? 'button' : 'div'"
    class="node-card"
    :class="{
      'is-folder': isFolder,
      'is-file': !isFolder,
      'is-selected': isSelected,
      'is-drop-target': isDropTarget,
    }"
    :type="isFolder ? 'button' : undefined"
    :title="node.name"
    draggable="true"
    @click="(ev: MouseEvent) => emit('itemClick', node, { ctrl: ev.ctrlKey || ev.metaKey, shift: ev.shiftKey })"
    @dblclick="emit('itemDblClick', node)"
    @contextmenu.prevent="(ev: MouseEvent) => emit('itemContextMenu', node, { x: ev.clientX, y: ev.clientY })"
    @dragstart="onDragStart"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div class="node-card__icon" :class="{ 'is-folder': isFolder }">
      <MdiIcon :path="icon" :size="30" />
    </div>

    <div class="node-card__body">
      <span class="node-card__name">{{ node.name }}</span>

      <span
        v-if="showPath"
        class="node-card__path"
        :title="node.path"
      >{{ node.path }}</span>

      <div class="node-card__meta">
        <template v-if="isFolder">
          <span class="node-card__folder-label">Folder</span>
        </template>
        <template v-else>
          <span v-if="extBadge" class="node-card__badge">{{ extBadge }}</span>
          <span v-if="sizeLabel" class="node-card__size">{{ sizeLabel }}</span>
        </template>
      </div>
    </div>

    <MdiIcon
      v-if="isFolder"
      class="node-card__chevron"
      :path="mdiChevronRight"
      :size="18"
    />
  </component>
</template>

<style scoped>
.node-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  text-align: left;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-panel);
  box-shadow: var(--shadow-sm);
  color: var(--color-text-primary);
  transition:
    background-color var(--transition),
    border-color var(--transition),
    box-shadow var(--transition),
    transform var(--transition);
}

.node-card.is-folder {
  cursor: pointer;
}

.node-card.is-folder:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.node-card.is-folder:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.node-card.is-file {
  cursor: pointer;
}

.node-card.is-file:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

.node-card.is-selected,
.node-card.is-selected:hover {
  background-color: var(--color-bg-selected);
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent);
}

.node-card.is-drop-target,
.node-card.is-drop-target:hover {
  background-color: var(--color-accent-subtle);
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent);
}

.node-card__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-active);
  color: var(--color-text-tertiary);
  transition: color var(--transition), background-color var(--transition);
}

.node-card__icon.is-folder {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
}

.node-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.node-card__name {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-tight);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-card__path {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: 2px;
}

.node-card__folder-label {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.node-card__badge {
  display: inline-block;
  padding: 1px var(--space-2);
  border-radius: var(--radius-sm);
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.03em;
  line-height: 1.4;
}

.node-card__size {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.node-card__chevron {
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  transition: color var(--transition), transform var(--transition);
}

.node-card.is-folder:hover .node-card__chevron {
  color: var(--color-accent);
  transform: translateX(2px);
}
</style>
