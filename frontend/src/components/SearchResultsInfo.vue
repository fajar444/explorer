<script setup lang="ts">
import { computed } from 'vue';
import { mdiClose, mdiMagnify } from '@mdi/js';
import MdiIcon from './MdiIcon.vue';
import { useExplorerStore } from '@/stores/explorerStore';

const store = useExplorerStore();

const count = computed(() => store.searchResults.length);
const resultLabel = computed(() =>
  count.value === 1 ? 'result' : 'results',
);
</script>

<template>
  <div class="search-info">
    <MdiIcon class="search-info__glyph" :path="mdiMagnify" :size="18" />
    <span class="search-info__text">
      <strong>{{ count }}</strong> {{ resultLabel }} for
      <span class="search-info__query">"{{ store.searchQuery }}"</span>
    </span>
    <button
      type="button"
      class="search-info__clear"
      @click="store.clearSearch()"
    >
      <MdiIcon :path="mdiClose" :size="16" />
      <span>Clear</span>
    </button>
  </div>
</template>

<style scoped>
.search-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background-color: var(--color-accent-subtle);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.search-info__glyph {
  color: var(--color-accent);
  flex-shrink: 0;
}

.search-info__text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-info__text strong {
  color: var(--color-text-primary);
  font-weight: var(--weight-semibold);
}

.search-info__query {
  color: var(--color-accent);
  font-weight: var(--weight-medium);
}

.search-info__clear {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  flex-shrink: 0;
  transition: color var(--transition), background-color var(--transition);
}

.search-info__clear:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-hover);
}
</style>
