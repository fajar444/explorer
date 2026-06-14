<script setup lang="ts">
import { computed } from 'vue';
import { useExplorerStore } from '@/stores/explorerStore';

const store = useExplorerStore();

const progress = computed(() => store.progress);

const isDeterminate = computed(() => progress.value.total > 0);

const percent = computed(() => {
  if (!isDeterminate.value) return 0;
  return Math.min(100, Math.round((progress.value.current / progress.value.total) * 100));
});
</script>

<template>
  <Transition name="progress-fade">
    <div v-if="progress.active" class="progress-backdrop">
      <div class="progress-card" role="dialog" aria-modal="true">
        <p class="progress-card__label">{{ progress.label }}</p>

        <div
          v-if="isDeterminate"
          class="progress-track"
          role="progressbar"
          :aria-valuenow="progress.current"
          aria-valuemin="0"
          :aria-valuemax="progress.total"
        >
          <div class="progress-fill" :style="{ width: percent + '%' }" />
        </div>
        <div v-else class="progress-track progress-track--indeterminate">
          <div class="progress-fill progress-fill--indeterminate" />
        </div>

        <p v-if="isDeterminate" class="progress-card__caption" aria-live="polite">
          {{ progress.current }} of {{ progress.total }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.progress-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background-color: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}

.progress-card {
  width: 100%;
  max-width: 22rem;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  animation: fadeInUp var(--transition-slow) var(--ease-out);
}

.progress-card__label {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-primary);
}

.progress-track {
  position: relative;
  width: 100%;
  height: 6px;
  overflow: hidden;
  background-color: var(--color-bg-active);
  border-radius: var(--radius-full);
}

.progress-fill {
  height: 100%;
  background-color: var(--color-accent);
  border-radius: var(--radius-full);
  transition: width var(--transition-slow) var(--ease-out);
}

.progress-fill--indeterminate {
  position: absolute;
  left: 0;
  width: 40%;
  animation: progress-slide 1.2s ease-in-out infinite;
}

.progress-card__caption {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
}

@keyframes progress-slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(250%);
  }
}

.progress-fade-enter-active,
.progress-fade-leave-active {
  transition: opacity var(--transition) var(--ease-out);
}

.progress-fade-enter-from,
.progress-fade-leave-to {
  opacity: 0;
}
</style>
