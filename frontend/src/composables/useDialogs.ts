import { ref } from 'vue';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

const confirmState = ref<ConfirmOptions | null>(null);
let resolver: ((ok: boolean) => void) | null = null;

function confirm(options: ConfirmOptions): Promise<boolean> {
  confirmState.value = options;
  return new Promise<boolean>((resolve) => {
    resolver = resolve;
  });
}

function resolveConfirm(ok: boolean): void {
  confirmState.value = null;
  resolver?.(ok);
  resolver = null;
}

export function useDialogs() {
  return { confirmState, confirm, resolveConfirm };
}
