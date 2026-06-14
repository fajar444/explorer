<script setup lang="ts">
import { computed } from 'vue';
import { mdiChevronRight, mdiHomeOutline } from '@mdi/js';
import MdiIcon from './MdiIcon.vue';
import { useExplorerStore } from '@/stores/explorerStore';
import type { NodeTree } from '@/types/node';

const store = useExplorerStore();

interface Crumb {
  name: string;
  path: string;
}

const crumbs = computed<Crumb[]>(() => {
  const path = store.selectedNode?.path;
  if (!path) return [];
  const segments = path.split('/').filter((s) => s.length > 0);
  let cumulative = '';
  return segments.map((segment) => {
    cumulative += `/${segment}`;
    return { name: segment, path: cumulative };
  });
});

function findByPath(nodes: NodeTree[], path: string): NodeTree | null {
  for (const n of nodes) {
    if (n.path === path) return n;
    const found = findByPath(n.children, path);
    if (found) return found;
  }
  return null;
}

function onCrumbClick(crumb: Crumb, isLast: boolean): void {
  if (isLast) return;
  const found = findByPath(store.tree, crumb.path);
  if (found) void store.selectNode(found);
}
</script>

<template>
  <nav v-if="crumbs.length > 0" class="breadcrumb" aria-label="Breadcrumb">
    <span class="breadcrumb__home" aria-hidden="true">
      <MdiIcon :path="mdiHomeOutline" :size="16" />
    </span>
    <MdiIcon
      class="breadcrumb__divider"
      :path="mdiChevronRight"
      :size="16"
    />

    <template v-for="(crumb, index) in crumbs" :key="crumb.path">
      <button
        type="button"
        class="breadcrumb__crumb"
        :class="{ 'is-active': index === crumbs.length - 1 }"
        :disabled="index === crumbs.length - 1"
        :aria-current="index === crumbs.length - 1 ? 'page' : undefined"
        @click="onCrumbClick(crumb, index === crumbs.length - 1)"
      >
        {{ crumb.name }}
      </button>
      <MdiIcon
        v-if="index < crumbs.length - 1"
        class="breadcrumb__divider"
        :path="mdiChevronRight"
        :size="16"
      />
    </template>
  </nav>
</template>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-1);
  font-size: var(--text-sm);
}

.breadcrumb__home {
  display: grid;
  place-items: center;
  color: var(--color-text-tertiary);
}

.breadcrumb__divider {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  opacity: 0.7;
}

.breadcrumb__crumb {
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  white-space: nowrap;
  transition: color var(--transition), background-color var(--transition);
}

.breadcrumb__crumb:not(.is-active):hover {
  color: var(--color-accent);
  background-color: var(--color-bg-hover);
  text-decoration: underline;
}

.breadcrumb__crumb.is-active {
  color: var(--color-text-primary);
  font-weight: var(--weight-semibold);
  cursor: default;
}
</style>
