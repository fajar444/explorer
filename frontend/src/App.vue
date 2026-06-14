<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { mdiAlertCircleOutline, mdiRefresh } from '@mdi/js';
import MdiIcon from './components/MdiIcon.vue';
import AppHeader from './components/AppHeader.vue';
import ExplorerLayout from './components/ExplorerLayout.vue';
import ConfirmModal from './components/ConfirmModal.vue';
import ProgressModal from './components/ProgressModal.vue';
import { useExplorerStore } from '@/stores/explorerStore';
import { useTheme } from '@/composables/useTheme';
import { useDialogs } from '@/composables/useDialogs';

const store = useExplorerStore();

useTheme();

const drawerOpen = ref(false);

const showFatalError = computed(
  () => !!store.error && store.tree.length === 0 && !store.isLoadingTree,
);

function retry(): void {
  void store.loadTree();
}

function isEditing(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    active.getAttribute('contenteditable') === 'true'
  );
}

async function handleGlobalKeydown(event: KeyboardEvent): Promise<void> {
  if (isEditing()) return;

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? event.metaKey : event.ctrlKey;

  if (modifier) {
    switch (event.key.toLowerCase()) {
      case 'c':
        if (store.selectedIds.size > 0) {
          event.preventDefault();
          store.copyToClipboard([...store.selectedIds]);
        }
        break;
      case 'x':
        if (store.selectedIds.size > 0) {
          event.preventDefault();
          store.cutToClipboard([...store.selectedIds]);
        }
        break;
      case 'v':
        if (store.clipboard) {
          event.preventDefault();
          await store.pasteInto();
        }
        break;
      case 'z':
        event.preventDefault();
        await store.undo();
        break;
    }
  } else {
    if (event.key === 'Delete') {
      if (store.selectedIds.size > 0) {
        event.preventDefault();
        if (event.shiftKey || store.view === 'trash') {
          const n = store.selectedIds.size;
          const ok = await useDialogs().confirm({
            title: 'Delete permanently',
            message: `Permanently delete ${n} item${n > 1 ? 's' : ''}? This cannot be undone.`,
            confirmLabel: 'Delete',
            danger: true,
          });
          if (ok) await store.permanentDeleteNodes([...store.selectedIds]);
        } else {
          const n = store.selectedIds.size;
          const ok = await useDialogs().confirm({
            title: 'Move to Recycle Bin',
            message: `Move ${n} item${n > 1 ? 's' : ''} to the Recycle Bin?`,
            confirmLabel: 'Move to Bin',
            danger: true,
          });
          if (ok) await store.trashNodes([...store.selectedIds]);
        }
      }
    }
  }
}

onMounted(() => {
  void store.loadTree();
  window.addEventListener('keydown', handleGlobalKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<template>
  <AppHeader @toggle-menu="drawerOpen = !drawerOpen" />

  <div
    v-if="showFatalError"
    class="fatal-error"
    role="alert"
  >
    <MdiIcon class="fatal-error__icon" :path="mdiAlertCircleOutline" :size="48" />
    <h1 class="fatal-error__title">Couldn't load Explorer</h1>
    <p class="fatal-error__message">{{ store.error }}</p>
    <button type="button" class="fatal-error__retry" @click="retry">
      <MdiIcon :path="mdiRefresh" :size="18" />
      <span>Retry</span>
    </button>
  </div>

  <ExplorerLayout
    v-else
    :drawer-open="drawerOpen"
    @close-drawer="drawerOpen = false"
  />

  <ConfirmModal />
  <ProgressModal />
</template>

<style scoped>
.fatal-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-6);
  text-align: center;
  animation: fadeInUp var(--transition-slow) var(--ease-out);
}

.fatal-error__icon {
  color: var(--color-error-text);
}

.fatal-error__title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

.fatal-error__message {
  max-width: 44ch;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  word-break: break-word;
}

.fatal-error__retry {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-accent-contrast);
  background-color: var(--color-accent);
  border-radius: var(--radius-md);
  transition:
    background-color var(--transition),
    transform var(--transition);
}

.fatal-error__retry:hover {
  background-color: var(--color-accent-hover);
}

.fatal-error__retry:active {
  transform: scale(0.98);
}
</style>
