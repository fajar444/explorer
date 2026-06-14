import { describe, it, expect } from 'vitest';
import { useDialogs } from './useDialogs';

describe('useDialogs.confirm', () => {
  it('resolves true when confirmed', async () => {
    const { confirm, confirmState, resolveConfirm } = useDialogs();
    const p = confirm({ title: 'Delete?', message: 'Sure?', danger: true });
    expect(confirmState.value?.title).toBe('Delete?');
    resolveConfirm(true);
    await expect(p).resolves.toBe(true);
    expect(confirmState.value).toBeNull();
  });

  it('resolves false when cancelled', async () => {
    const { confirm, resolveConfirm } = useDialogs();
    const p = confirm({ title: 'X', message: 'Y' });
    resolveConfirm(false);
    await expect(p).resolves.toBe(false);
  });
});
