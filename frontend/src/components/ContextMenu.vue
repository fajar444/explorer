<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import MdiIcon from './MdiIcon.vue';
import type { ContextMenuItem } from '@/types/contextMenu';

const props = defineProps<{
  x: number;
  y: number;
  visible: boolean;
  items: ContextMenuItem[];
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'close'): void;
}>();

const menu = ref<HTMLElement | null>(null);

const left = ref(props.x);
const top = ref(props.y);

function onItemClick(item: ContextMenuItem): void {
  if (item.separator || item.disabled) {
    return;
  }
  emit('select', item.id);
  emit('close');
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('close');
  }
}

function onOutsidePointer(event: MouseEvent): void {
  if (menu.value && !menu.value.contains(event.target as Node)) {
    emit('close');
  }
}

function clampToViewport(): void {
  const el = menu.value;
  if (!el) {
    return;
  }
  const { offsetWidth: w, offsetHeight: h } = el;
  const margin = 8;
  const maxLeft = window.innerWidth - w - margin;
  const maxTop = window.innerHeight - h - margin;
  left.value = Math.max(margin, Math.min(props.x, Math.max(margin, maxLeft)));
  top.value = Math.max(margin, Math.min(props.y, Math.max(margin, maxTop)));
}

watch(
  () => props.visible,
  async (isVisible) => {
    if (isVisible) {
      left.value = props.x;
      top.value = props.y;
      await nextTick();
      clampToViewport();
      menu.value?.focus();
      window.addEventListener('mousedown', onOutsidePointer);
    } else {
      window.removeEventListener('mousedown', onOutsidePointer);
    }
  },
  { immediate: true },
);

watch(
  () => [props.x, props.y],
  async () => {
    if (props.visible) {
      left.value = props.x;
      top.value = props.y;
      await nextTick();
      clampToViewport();
    }
  },
);

onBeforeUnmount(() => {
  window.removeEventListener('mousedown', onOutsidePointer);
});
</script>

<template>
  <div
    v-if="visible"
    ref="menu"
    class="context-menu"
    role="menu"
    tabindex="-1"
    :style="{ left: `${left}px`, top: `${top}px` }"
    @keydown="onKeydown"
  >
    <template v-for="item in items" :key="item.id">
      <div v-if="item.separator" class="context-menu__separator" role="separator" />
      <button
        v-else
        type="button"
        data-menu-item
        role="menuitem"
        class="context-menu__item"
        :class="{
          'context-menu__item--danger': item.danger,
          'context-menu__item--disabled': item.disabled,
        }"
        :disabled="item.disabled"
        @click="onItemClick(item)"
      >
        <MdiIcon
          v-if="item.icon"
          :path="item.icon"
          :size="18"
          class="context-menu__icon"
        />
        <span class="context-menu__label">{{ item.label }}</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: var(--z-dropdown);
  min-width: 180px;
  padding: var(--space-1);
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  animation: fadeIn var(--transition) var(--ease-out);
  outline: none;
}

.context-menu__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  text-align: left;
  color: var(--color-text-primary);
  background-color: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color var(--transition);
}

.context-menu__item:hover,
.context-menu__item:focus-visible {
  background-color: var(--color-bg-hover);
}

.context-menu__item--danger {
  color: var(--color-error-text);
}

.context-menu__item--disabled {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
  pointer-events: none;
  opacity: 0.6;
}

.context-menu__icon {
  flex-shrink: 0;
}

.context-menu__label {
  flex: 1;
}

.context-menu__separator {
  height: 1px;
  margin: var(--space-1) 0;
  background-color: var(--color-divider);
}
</style>
