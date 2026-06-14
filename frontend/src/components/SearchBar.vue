<script setup lang="ts">
import { ref, watch } from 'vue';
import { mdiMagnify, mdiClose } from '@mdi/js';
import MdiIcon from './MdiIcon.vue';
import { useExplorerStore } from '@/stores/explorerStore';
import { useDebounceFn } from '@/composables/useDebounce';

const store = useExplorerStore();

const query = ref<string>(store.searchQuery);
const inputEl = ref<HTMLInputElement | null>(null);

const dispatch = useDebounceFn((value: string) => {
  const trimmed = value.trim();
  if (trimmed) {
    void store.runSearch(trimmed);
  } else if (store.isSearchActive || store.searchQuery) {
    store.clearSearch();
  }
}, 300);

watch(query, (value) => {
  dispatch(value);
});

watch(
  () => store.searchQuery,
  (value) => {
    if (value !== query.value) {
      query.value = value;
    }
  },
);

function clear(): void {
  query.value = '';
  store.clearSearch();
  inputEl.value?.focus();
}
</script>

<template>
  <div class="search-bar" data-tour="search">
    <MdiIcon class="search-bar__icon" :path="mdiMagnify" :size="18" />
    <input
      ref="inputEl"
      v-model="query"
      type="search"
      class="search-bar__input"
      placeholder="Search files and folders…"
      aria-label="Search files and folders"
      autocomplete="off"
      spellcheck="false"
    />
    <button
      v-if="query"
      type="button"
      class="search-bar__clear"
      aria-label="Clear search"
      @click="clear"
    >
      <MdiIcon :path="mdiClose" :size="16" />
    </button>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  max-width: 560px;
  min-width: 0;
}

.search-bar__icon {
  position: absolute;
  left: var(--space-3);
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.search-bar__input {
  width: 100%;
  height: 38px;
  padding: 0 var(--space-3) 0 calc(var(--space-3) + 18px + var(--space-2));
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  background-color: var(--color-bg-app);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  transition:
    border-color var(--transition),
    background-color var(--transition),
    box-shadow var(--transition);
}

.search-bar__input::placeholder {
  color: var(--color-text-tertiary);
}

.search-bar__input:hover {
  border-color: var(--color-border-strong);
}

.search-bar__input:focus {
  outline: none;
  border-color: var(--color-accent);
  background-color: var(--color-bg-panel);
  box-shadow: 0 0 0 3px var(--color-accent-subtle);
}

.search-bar__input::-webkit-search-decoration,
.search-bar__input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

.search-bar__clear {
  position: absolute;
  right: var(--space-2);
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  color: var(--color-text-tertiary);
  border-radius: var(--radius-full);
  transition:
    color var(--transition),
    background-color var(--transition);
}

.search-bar__clear:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-hover);
}
</style>
