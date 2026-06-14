import { ref, computed, type Ref, type ComputedRef } from 'vue';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'explorer-theme';


function resolveInitialTheme(): Theme {
  if (typeof document !== 'undefined') {
    const fromDom = document.documentElement.dataset.theme;
    if (fromDom === 'light' || fromDom === 'dark') return fromDom;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
   
  }

  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }

  return 'light';
}

function apply(next: Theme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = next;
  }
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
   
  }
}

const theme = ref<Theme>(resolveInitialTheme());
const isDark = computed<boolean>(() => theme.value === 'dark');

apply(theme.value);

function toggleTheme(): void {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  apply(theme.value);
}

function setTheme(next: Theme): void {
  theme.value = next;
  apply(next);
}

export function useTheme(): {
  theme: Ref<Theme>;
  isDark: ComputedRef<boolean>;
  toggleTheme: () => void;
  setTheme: (next: Theme) => void;
} {
  return { theme, isDark, toggleTheme, setTheme };
}
