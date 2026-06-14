<script setup lang="ts">
import { watch } from 'vue';
import TreePanel from './TreePanel.vue';
import ContentPanel from './ContentPanel.vue';
import PreviewPanel from './PreviewPanel.vue';
import { useExplorerStore } from '@/stores/explorerStore';

const props = defineProps<{ drawerOpen: boolean }>();
const emit = defineEmits<{ (e: 'close-drawer'): void }>();

const store = useExplorerStore();

watch(
  () => store.selectedNode,
  () => {
    if (props.drawerOpen) emit('close-drawer');
  },
);
</script>

<template>
  <div class="layout">
    <div
      v-if="drawerOpen"
      class="layout__backdrop"
      @click="emit('close-drawer')"
    />

    <aside class="layout__sidebar" :class="{ 'is-open': drawerOpen }">
      <TreePanel />
    </aside>

    <main class="layout__content">
      <ContentPanel />
    </main>

    <aside
      v-if="store.preview.visible && store.preview.node"
      class="layout__preview"
    >
      <PreviewPanel />
    </aside>
  </div>
</template>

<style scoped>
.layout {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.layout__sidebar {
  flex-shrink: 0;
  width: 300px;
  min-height: 0;
}

.layout__content {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.layout__preview {
  flex-shrink: 0;
  width: clamp(320px, 30vw, 460px);
  min-height: 0;
}

.layout__backdrop {
  display: none;
}

@media (max-width: 767px) {
  .layout__sidebar {
    position: absolute;
    inset: 0 auto 0 0;
    z-index: var(--z-dropdown);
    width: min(320px, 84vw);
    box-shadow: var(--shadow-lg);
    transform: translateX(-100%);
    transition: transform var(--transition-slow) var(--ease-out);
  }

  .layout__sidebar.is-open {
    transform: translateX(0);
  }

  .layout__backdrop {
    display: block;
    position: absolute;
    inset: 0;
    z-index: var(--z-sticky);
    background-color: rgba(0, 0, 0, 0.45);
    animation: fadeIn var(--transition) var(--ease-out);
  }

  .layout__preview {
    position: absolute;
    inset: 0;
    z-index: var(--z-dropdown);
    width: 100%;
    background-color: var(--color-bg-app);
  }
}
</style>
