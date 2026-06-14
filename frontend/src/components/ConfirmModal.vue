<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useDialogs } from '@/composables/useDialogs';

const { confirmState, resolveConfirm } = useDialogs();

const confirmButton = ref<HTMLButtonElement | null>(null);

watch(confirmState, async (state) => {
  if (state) {
    await nextTick();
    confirmButton.value?.focus();
  }
});

function onCancel(): void {
  resolveConfirm(false);
}

function onConfirm(): void {
  resolveConfirm(true);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    resolveConfirm(false);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    resolveConfirm(true);
  }
}

function onBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) {
    resolveConfirm(false);
  }
}
</script>

<template>
  <Transition name="confirm-fade">
    <div
      v-if="confirmState"
      class="confirm-backdrop"
      @click="onBackdropClick"
      @keydown="onKeydown"
    >
      <div
        class="confirm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <h2 id="confirm-modal-title" class="confirm-card__title">
          {{ confirmState.title }}
        </h2>
        <p class="confirm-card__message">{{ confirmState.message }}</p>

        <div class="confirm-card__actions">
          <button
            type="button"
            class="confirm-btn confirm-btn--cancel"
            @click="onCancel"
          >
            {{ confirmState.cancelLabel ?? 'Cancel' }}
          </button>
          <button
            ref="confirmButton"
            type="button"
            class="confirm-btn"
            :class="confirmState.danger ? 'confirm-btn--danger' : 'confirm-btn--primary'"
            @click="onConfirm"
          >
            {{ confirmState.confirmLabel ?? 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.confirm-backdrop {
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

.confirm-card {
  width: 100%;
  max-width: 26rem;
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

.confirm-card__title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--leading-tight);
}

.confirm-card__message {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
}

.confirm-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.confirm-btn {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  border-radius: var(--radius-md);
  transition:
    background-color var(--transition),
    color var(--transition),
    transform var(--transition);
}

.confirm-btn:active {
  transform: scale(0.98);
}

.confirm-btn--cancel {
  color: var(--color-text-secondary);
  background-color: var(--color-bg-hover);
}

.confirm-btn--cancel:hover {
  background-color: var(--color-bg-active);
}

.confirm-btn--primary {
  color: var(--color-accent-contrast);
  background-color: var(--color-accent);
}

.confirm-btn--primary:hover {
  background-color: var(--color-accent-hover);
}

.confirm-btn--primary:active {
  background-color: var(--color-accent-active);
}

.confirm-btn--danger {
  color: var(--color-error-text);
  background-color: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
}

.confirm-btn--danger:hover {
  filter: brightness(0.97);
  background-color: var(--color-error-bg);
}

.confirm-fade-enter-active {
  transition: opacity var(--transition) var(--ease-out);
}

.confirm-fade-leave-active {
  transition: opacity var(--transition) var(--ease-out);
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
</style>
