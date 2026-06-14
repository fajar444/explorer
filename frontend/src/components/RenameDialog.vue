<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
  currentName: string;
}>();

const emit = defineEmits<{
  (e: 'submit', name: string): void;
  (e: 'cancel'): void;
}>();

const value = ref<string>(props.currentName);
const inputEl = ref<HTMLInputElement | null>(null);

watch(
  [() => props.visible, () => props.currentName],
  async ([isVisible, name]) => {
    if (!isVisible) {
      return;
    }
    value.value = name;
    await nextTick();
    const el = inputEl.value;
    if (!el) {
      return;
    }
    el.focus();
    const dotIndex = name.lastIndexOf('.');
    if (dotIndex > 0) {
      el.setSelectionRange(0, dotIndex);
    } else {
      el.select();
    }
  },
);

function onSubmit(): void {
  const trimmed = value.value.trim();
  if (!trimmed || trimmed === props.currentName) {
    return;
  }
  emit('submit', trimmed);
}

function onCancel(): void {
  emit('cancel');
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    onCancel();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    onSubmit();
  }
}

function onBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) {
    onCancel();
  }
}
</script>

<template>
  <Transition name="dialog-fade">
    <div
      v-if="visible"
      class="dialog-backdrop"
      @click="onBackdropClick"
      @keydown="onKeydown"
    >
      <div
        class="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-dialog-title"
      >
        <h2 id="rename-dialog-title" class="dialog-card__title">Rename</h2>

        <input
          ref="inputEl"
          v-model="value"
          type="text"
          class="dialog-card__input"
          aria-label="New name"
          autocomplete="off"
          spellcheck="false"
        />

        <div class="dialog-card__actions">
          <button
            type="button"
            class="dialog-btn dialog-btn--cancel"
            @click="onCancel"
          >
            Cancel
          </button>
          <button
            type="button"
            class="dialog-btn dialog-btn--primary"
            @click="onSubmit"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.dialog-backdrop {
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

.dialog-card {
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

.dialog-card__title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--leading-tight);
}

.dialog-card__input {
  width: 100%;
  height: 38px;
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  background-color: var(--color-bg-app);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition:
    border-color var(--transition),
    background-color var(--transition),
    box-shadow var(--transition);
}

.dialog-card__input:hover {
  border-color: var(--color-border-strong);
}

.dialog-card__input:focus {
  outline: none;
  border-color: var(--color-accent);
  background-color: var(--color-bg-panel);
  box-shadow: 0 0 0 3px var(--color-accent-subtle);
}

.dialog-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.dialog-btn {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  border-radius: var(--radius-md);
  transition:
    background-color var(--transition),
    color var(--transition),
    transform var(--transition);
}

.dialog-btn:active {
  transform: scale(0.98);
}

.dialog-btn--cancel {
  color: var(--color-text-secondary);
  background-color: var(--color-bg-hover);
}

.dialog-btn--cancel:hover {
  background-color: var(--color-bg-active);
}

.dialog-btn--primary {
  color: var(--color-accent-contrast);
  background-color: var(--color-accent);
}

.dialog-btn--primary:hover {
  background-color: var(--color-accent-hover);
}

.dialog-btn--primary:active {
  background-color: var(--color-accent-active);
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity var(--transition) var(--ease-out);
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
</style>
