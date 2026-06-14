<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { mdiChevronRight } from '@mdi/js';
import MdiIcon from './MdiIcon.vue';
import { useExplorerStore } from '@/stores/explorerStore';
import { getNodeIcon } from '@/utils/nodeIcon';
import type { NodeTree } from '@/types/node';

defineOptions({ name: 'TreeNode' });

const props = defineProps<{
  node: NodeTree;
  depth: number;
}>();

const store = useExplorerStore();

const expanded = computed(() => store.isExpanded(props.node.id));
const selected = computed(() => store.selectedNode?.id === props.node.id);
const hasChildren = computed(() => props.node.children.length > 0);
const folderIcon = computed(() =>
  getNodeIcon('folder', null, expanded.value),
);

const BASE_INDENT = 8;
const STEP_INDENT = 16;
const rowPadding = computed(
  () => `${BASE_INDENT + props.depth * STEP_INDENT}px`,
);

const rowEl = ref<HTMLElement | null>(null);

const isDropTarget = ref(false);

const DRAG_MIME = 'application/x-explorer-ids';

function onRowClick(): void {
  void store.selectNode(props.node);
  if (hasChildren.value) {
    store.toggleExpand(props.node.id);
  }
}

function onToggle(): void {
  store.toggleExpand(props.node.id);
}

function onDragOver(event: DragEvent): void {
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  isDropTarget.value = true;
}

function onDragLeave(): void {
  isDropTarget.value = false;
}

async function onDrop(event: DragEvent): Promise<void> {
  isDropTarget.value = false;
  const raw = event.dataTransfer?.getData(DRAG_MIME);
  const ids = raw ? (JSON.parse(raw) as string[]) : [];
  if (ids.length && !ids.includes(props.node.id)) {
    await store.moveNodes(ids, props.node.id);
  }
}

watch(selected, async (isSelected) => {
  if (!isSelected) return;
  await nextTick();
  rowEl.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
</script>

<template>
  <div class="tree-node">
    <div
      ref="rowEl"
      class="tree-node__row"
      :class="{ 'is-selected': selected, 'is-drop-target': isDropTarget }"
      :style="{ paddingLeft: rowPadding }"
      role="treeitem"
      :aria-expanded="hasChildren ? expanded : undefined"
      :aria-selected="selected"
      @click="onRowClick"
      @dragover.prevent.stop="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent.stop="onDrop"
    >
      <button
        type="button"
        class="tree-node__chevron"
        :class="{ 'is-open': expanded, 'is-hidden': !hasChildren }"
        :tabindex="hasChildren ? 0 : -1"
        :aria-label="expanded ? 'Collapse' : 'Expand'"
        @click.stop="onToggle"
      >
        <MdiIcon :path="mdiChevronRight" :size="16" />
      </button>

      <MdiIcon class="tree-node__folder" :path="folderIcon" :size="18" />

      <span class="tree-node__name">{{ node.name }}</span>
    </div>

    <Transition name="tree-reveal">
      <div v-if="expanded && hasChildren" class="tree-node__children" role="group">
        <TreeNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :depth="depth + 1"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tree-node {
  user-select: none;
}

.tree-node__row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 30px;
  padding-right: var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-tight);
  cursor: pointer;
  position: relative;
  transition:
    background-color var(--transition),
    color var(--transition);
}

.tree-node__row:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.tree-node__row.is-selected {
  background-color: var(--color-bg-selected);
  color: var(--color-accent);
  font-weight: var(--weight-medium);
}

.tree-node__row.is-drop-target,
.tree-node__row.is-drop-target:hover {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  box-shadow: inset 0 0 0 2px var(--color-accent);
}

.tree-node__row.is-selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  border-radius: var(--radius-full);
  background-color: var(--color-accent);
}

.tree-node__chevron {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  transition:
    transform var(--transition),
    color var(--transition),
    background-color var(--transition);
}

.tree-node__chevron:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-active);
}

.tree-node__chevron.is-open {
  transform: rotate(90deg);
}

.tree-node__chevron.is-hidden {
  visibility: hidden;
  pointer-events: none;
}

.tree-node__folder {
  color: var(--color-text-tertiary);
  transition: color var(--transition);
}

.tree-node__row:hover .tree-node__folder {
  color: var(--color-text-secondary);
}

.tree-node__row.is-selected .tree-node__folder {
  color: var(--color-accent);
}

.tree-node__name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-node__children {
  overflow: hidden;
}

.tree-reveal-enter-active,
.tree-reveal-leave-active {
  transition:
    opacity var(--transition),
    transform var(--transition);
}

.tree-reveal-enter-from,
.tree-reveal-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
