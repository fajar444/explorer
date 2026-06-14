<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue';
import {
  mdiEye,
  mdiEyeOff,
  mdiFolderMultipleOutline,
  mdiHelpCircleOutline,
  mdiKeyboardOutline,
  mdiMenu,
  mdiPlayCircleOutline,
  mdiWeatherNight,
  mdiWeatherSunny,
} from '@mdi/js';
import MdiIcon from './MdiIcon.vue';
import SearchBar from './SearchBar.vue';
import { useTheme } from '@/composables/useTheme';
import { useTour } from '@/composables/useTour';
import { useExplorerStore } from '@/stores/explorerStore';

defineEmits<{ (e: 'toggle-menu'): void }>();

const { isDark, toggleTheme } = useTheme();
const { startTour } = useTour();
const store = useExplorerStore();

const helpOpen = ref(false);
const shortcutsOpen = ref(false);
const helpRoot = ref<HTMLElement | null>(null);

function onDocumentPointerDown(event: PointerEvent): void {
  if (helpRoot.value && !helpRoot.value.contains(event.target as Node)) {
    closeHelp();
  }
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') closeHelp();
}

function openHelp(): void {
  helpOpen.value = true;
  window.addEventListener('pointerdown', onDocumentPointerDown);
  window.addEventListener('keydown', onDocumentKeydown);
}

function closeHelp(): void {
  helpOpen.value = false;
  shortcutsOpen.value = false;
  window.removeEventListener('pointerdown', onDocumentPointerDown);
  window.removeEventListener('keydown', onDocumentKeydown);
}

function toggleHelp(): void {
  if (helpOpen.value) closeHelp();
  else openHelp();
}

async function onStartTour(): Promise<void> {
  closeHelp();
  await nextTick();
  startTour();
}

function toggleShortcuts(): void {
  shortcutsOpen.value = !shortcutsOpen.value;
}

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', onDocumentPointerDown);
  window.removeEventListener('keydown', onDocumentKeydown);
});

const shortcuts = [
  { keys: 'Ctrl / ⌘ + Click', action: 'Toggle select an item' },
  { keys: 'Shift + Click', action: 'Range select' },
  { keys: 'Double-click', action: 'Open folder or preview file' },
  { keys: 'Right-click', action: 'Open actions menu' },
  { keys: 'Drag', action: 'Box-select or move items' },
  { keys: 'Ctrl / ⌘ + C', action: 'Copy selection' },
  { keys: 'Ctrl / ⌘ + X', action: 'Cut selection' },
  { keys: 'Ctrl / ⌘ + V', action: 'Paste clipboard' },
  { keys: 'Ctrl / ⌘ + Z', action: 'Undo last action' },
  { keys: 'Delete', action: 'Move selection to Bin' },
  { keys: 'Shift + Delete', action: 'Delete permanently' },
];
</script>

<template>
  <header class="app-header">
    <button
      type="button"
      class="app-header__menu"
      aria-label="Toggle folder tree"
      @click="$emit('toggle-menu')"
    >
      <MdiIcon :path="mdiMenu" :size="22" />
    </button>

    <a class="app-header__brand" href="/" aria-label="Explorer home">
      <span class="app-header__logo">
        <MdiIcon :path="mdiFolderMultipleOutline" :size="22" />
      </span>
      <span class="app-header__wordmark">Explorer</span>
    </a>

    <SearchBar />

    <button
      type="button"
      class="app-header__theme"
      data-tour="preview-toggle"
      :disabled="!store.preview.node"
      :aria-label="store.preview.visible ? 'Hide preview' : 'Show preview'"
      :title="store.preview.visible ? 'Hide preview' : 'Show preview'"
      @click="store.togglePreview()"
    >
      <MdiIcon :path="store.preview.visible ? mdiEyeOff : mdiEye" :size="20" />
    </button>

    <button
      type="button"
      class="app-header__theme"
      data-tour="theme-toggle"
      aria-label="Toggle theme"
      :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggleTheme"
    >
      <MdiIcon :path="isDark ? mdiWeatherSunny : mdiWeatherNight" :size="20" />
    </button>

    <div ref="helpRoot" class="app-header__help">
      <button
        type="button"
        class="app-header__theme"
        data-tour="help"
        aria-label="Help"
        title="Help"
        aria-haspopup="menu"
        :aria-expanded="helpOpen"
        @click="toggleHelp"
      >
        <MdiIcon :path="mdiHelpCircleOutline" :size="20" />
      </button>

      <div
        v-if="helpOpen"
        class="help-menu"
        role="menu"
        aria-label="Help menu"
      >
        <button
          type="button"
          class="help-menu__item"
          role="menuitem"
          @click="onStartTour"
        >
          <MdiIcon :path="mdiPlayCircleOutline" :size="18" />
          <span>Start guided tour</span>
        </button>

        <button
          type="button"
          class="help-menu__item"
          role="menuitem"
          :aria-expanded="shortcutsOpen"
          @click="toggleShortcuts"
        >
          <MdiIcon :path="mdiKeyboardOutline" :size="18" />
          <span>Keyboard shortcuts</span>
        </button>

        <ul v-if="shortcutsOpen" class="help-menu__shortcuts">
          <li
            v-for="shortcut in shortcuts"
            :key="shortcut.keys"
            class="help-menu__shortcut"
          >
            <kbd class="help-menu__keys">{{ shortcut.keys }}</kbd>
            <span class="help-menu__action">{{ shortcut.action }}</span>
          </li>
        </ul>

        <div class="help-menu__about">A modern file manager.</div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
  height: 60px;
  padding: 0 var(--space-4);
  background-color: var(--color-bg-panel);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  z-index: var(--z-sticky);
}

.app-header__menu {
  display: none;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  transition:
    color var(--transition),
    background-color var(--transition);
}

.app-header__menu:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-hover);
}

.app-header__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.app-header__logo {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: var(--color-accent);
}

.app-header__wordmark {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}

.app-header__theme {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  transition:
    color var(--transition),
    background-color var(--transition);
}

.app-header__theme:hover:not(:disabled) {
  color: var(--color-text-primary);
  background-color: var(--color-bg-hover);
}

.app-header__theme:disabled {
  color: var(--color-text-tertiary);
  opacity: 0.5;
  cursor: default;
}

.app-header__help {
  position: relative;
  flex-shrink: 0;
}

.help-menu {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  z-index: var(--z-dropdown);
  width: 260px;
  padding: var(--space-2);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  animation: fadeIn var(--transition) var(--ease-out);
}

.help-menu__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-primary);
  border-radius: var(--radius-sm);
  transition:
    color var(--transition),
    background-color var(--transition);
}

.help-menu__item:hover {
  background-color: var(--color-bg-hover);
}

.help-menu__shortcuts {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: var(--space-1) var(--space-2) var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-bg-hover);
  border-radius: var(--radius-sm);
}

.help-menu__shortcut {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.help-menu__keys {
  flex-shrink: 0;
  padding: 2px var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-panel);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.help-menu__action {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-align: right;
}

.help-menu__about {
  margin-top: var(--space-1);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  border-top: 1px solid var(--color-divider);
}

@media (max-width: 767px) {
  .app-header {
    gap: var(--space-2);
    padding: 0 var(--space-3);
  }

  .app-header__menu {
    display: grid;
  }

  .app-header__wordmark {
    display: none;
  }
}
</style>
