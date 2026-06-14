import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SearchBar from './SearchBar.vue';
import { useExplorerStore } from '@/stores/explorerStore';

vi.mock('@/services/nodeApi', () => ({
  nodeApi: {
    getTree: vi.fn().mockResolvedValue({ data: [] }),
    getChildren: vi.fn().mockResolvedValue({ data: [] }),
    search: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('SearchBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces input and calls runSearch with the trimmed value after 300ms', async () => {
    const wrapper = mount(SearchBar);
    const store = useExplorerStore();
    const runSearch = vi.spyOn(store, 'runSearch').mockResolvedValue();

    await wrapper.find('input').setValue('  reports  ');

    expect(runSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(runSearch).toHaveBeenCalledTimes(1);
    expect(runSearch).toHaveBeenCalledWith('reports');
  });

  it('clear button empties the input and clears the search', async () => {
    const wrapper = mount(SearchBar);
    const store = useExplorerStore();
    const clearSearch = vi.spyOn(store, 'clearSearch');

    await wrapper.find('input').setValue('docs');
    expect(wrapper.find('.search-bar__clear').exists()).toBe(true);

    await wrapper.find('.search-bar__clear').trigger('click');

    expect(clearSearch).toHaveBeenCalled();
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
  });
});
