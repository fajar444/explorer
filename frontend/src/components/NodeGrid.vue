<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import NodeCard from './NodeCard.vue';
import { useExplorerStore } from '@/stores/explorerStore';
import type { Node } from '@/types/node';

withDefaults(
  defineProps<{
    items: Node[];
    showPath?: boolean;
  }>(),
  { showPath: false },
);

const emit = defineEmits<{
  (e: 'nodeContextMenu', node: Node, pos: { x: number; y: number }): void;
  (e: 'itemDragStart', node: Node, event: DragEvent): void;
}>();

const store = useExplorerStore();

const MAX_STAGGER = 12;
function staggerDelay(index: number): string {
  return `${Math.min(index, MAX_STAGGER) * 25}ms`;
}

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
}

function onItemClick(node: Node, mods: { ctrl: boolean; shift: boolean }): void {
  if (mods.shift) {
    store.selectRangeTo(node.id);
    return;
  }
  if (mods.ctrl) {
    store.toggleSelection(node.id);
    return;
  }
  if (isMobileViewport()) {
    onItemDblClick(node);
    return;
  }
  store.selectOnly(node.id);
  if (node.type === 'file') {
    store.openPreview(node);
  }
}

function onItemDblClick(node: Node): void {
  if (node.type === 'folder') void store.selectNode(node);
  else store.openPreview(node);
}

function onItemContextMenu(node: Node, pos: { x: number; y: number }): void {
  if (!store.selectedIds.has(node.id)) store.selectOnly(node.id);
  emit('nodeContextMenu', node, pos);
}

const DRAG_MIME = 'application/x-explorer-ids';

function onGridDrop(ev: DragEvent): void {
  const onCard = (ev.target as HTMLElement).closest('[data-id]') !== null;
  if (onCard) return;
  const raw = ev.dataTransfer?.getData(DRAG_MIME);
  const ids = raw ? (JSON.parse(raw) as string[]) : [];
  if (ids.length) void store.moveNodes(ids, store.selectedNode?.id ?? null);
}

const DRAG_THRESHOLD = 4;

const gridEl = ref<HTMLElement | null>(null);
const marquee = ref<{ x: number; y: number; w: number; h: number } | null>(null);

let startX = 0;
let startY = 0;
let dragging = false;
let shown = false;
let additive = false;
let cardRects: { id: string; left: number; top: number; right: number; bottom: number }[] = [];
let baseSelection: string[] = [];

function toLocal(clientX: number, clientY: number): { x: number; y: number } {
  const r = gridEl.value!.getBoundingClientRect();
  return {
    x: clientX - r.left + gridEl.value!.scrollLeft,
    y: clientY - r.top + gridEl.value!.scrollTop,
  };
}

function onMouseDown(ev: MouseEvent): void {
  if (ev.button !== 0 || !gridEl.value) return;
  if ((ev.target as HTMLElement).closest('[data-id]') !== null) return;

  additive = ev.ctrlKey || ev.metaKey;
  const p = toLocal(ev.clientX, ev.clientY);
  startX = p.x;
  startY = p.y;
  dragging = true;
  shown = false;

  if (!additive) store.clearSelection();
  baseSelection = [...store.selectedIds];

  const r = gridEl.value.getBoundingClientRect();
  const scrollLeft = gridEl.value.scrollLeft;
  const scrollTop = gridEl.value.scrollTop;
  cardRects = [];
  for (const el of gridEl.value.querySelectorAll<HTMLElement>('[data-id]')) {
    const id = el.dataset.id;
    if (!id) continue;
    const cr = el.getBoundingClientRect();
    cardRects.push({
      id,
      left: cr.left - r.left + scrollLeft,
      top: cr.top - r.top + scrollTop,
      right: cr.right - r.left + scrollLeft,
      bottom: cr.bottom - r.top + scrollTop,
    });
  }

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(ev: MouseEvent): void {
  if (!dragging || !gridEl.value) return;
  const p = toLocal(ev.clientX, ev.clientY);

  if (!shown && Math.hypot(p.x - startX, p.y - startY) < DRAG_THRESHOLD) return;
  shown = true;

  const left = Math.min(startX, p.x);
  const top = Math.min(startY, p.y);
  const right = Math.max(startX, p.x);
  const bottom = Math.max(startY, p.y);
  marquee.value = { x: left, y: top, w: right - left, h: bottom - top };

  store.selectedIds.clear();
  if (additive) for (const id of baseSelection) store.selectedIds.add(id);
  for (const c of cardRects) {
    if (left < c.right && right > c.left && top < c.bottom && bottom > c.top) {
      store.selectedIds.add(c.id);
    }
  }
}

function onMouseUp(): void {
  dragging = false;
  shown = false;
  marquee.value = null;
  cardRects = [];
  baseSelection = [];
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
});
</script>

<template>
  <div
    ref="gridEl"
    class="node-grid"
    @mousedown="onMouseDown"
    @dragover.prevent
    @drop.prevent="onGridDrop"
  >
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="node-grid__cell"
      :style="{ animationDelay: staggerDelay(index) }"
    >
      <NodeCard
        :data-id="item.id"
        :node="item"
        :show-path="showPath"
        @item-click="onItemClick"
        @item-dbl-click="onItemDblClick"
        @item-context-menu="onItemContextMenu"
        @item-drag-start="(n, e) => emit('itemDragStart', n, e)"
      />
    </div>

    <div
      v-if="marquee"
      class="node-grid__marquee"
      :style="{
        left: `${marquee.x}px`,
        top: `${marquee.y}px`,
        width: `${marquee.w}px`,
        height: `${marquee.h}px`,
      }"
    />
  </div>
</template>

<style scoped>
.node-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: var(--space-3);
  padding: var(--space-1);
}

.node-grid__cell {
  min-width: 0;
  animation: fadeInUp var(--transition-slow) var(--ease-out) both;
}

.node-grid__marquee {
  position: absolute;
  background-color: var(--color-accent-subtle);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  pointer-events: none;
  z-index: 10;
}

@media (prefers-reduced-motion: reduce) {
  .node-grid__cell {
    animation: none;
  }
}
</style>
