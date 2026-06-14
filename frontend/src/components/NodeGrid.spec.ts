import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NodeGrid from './NodeGrid.vue';
import { useExplorerStore } from '@/stores/explorerStore';
import type { Node } from '@/types/node';

vi.mock('@/services/nodeApi', () => ({
  nodeApi: {
    getTree: vi.fn().mockResolvedValue({ data: [] }),
    getChildren: vi.fn().mockResolvedValue({ data: [] }),
    search: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

function makeNode(overrides: Partial<Node> = {}): Node {
  return {
    id: 'n1',
    name: 'node',
    type: 'folder',
    parentId: null,
    path: '/node',
    size: null,
    extension: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const items: Node[] = [
  makeNode({ id: 'a', name: 'A', path: '/A' }),
  makeNode({ id: 'b', name: 'B', path: '/B' }),
  makeNode({ id: 'c', name: 'C', path: '/C' }),
];

function mountGrid() {
  return mount(NodeGrid, { props: { items }, attachTo: document.body });
}

describe('NodeGrid marquee selection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('forwards :data-id onto each NodeCard root element', () => {
    const wrapper = mountGrid();
    const tagged = wrapper.element.querySelectorAll('[data-id]');
    expect(tagged).toHaveLength(3);
    expect(Array.from(tagged).map((el) => (el as HTMLElement).dataset.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect((tagged[0] as HTMLElement).classList.contains('node-card')).toBe(true);
  });

  it('clears selection on a plain (non-Ctrl) background mousedown', () => {
    const wrapper = mountGrid();
    const store = useExplorerStore();
    store.selectedIds.add('a');
    store.selectedIds.add('b');

    wrapper.find('.node-grid').trigger('mousedown', { button: 0 });
    expect(store.selectedIds.size).toBe(0);
  });

  it('preserves selection on a Ctrl background mousedown (additive)', () => {
    const wrapper = mountGrid();
    const store = useExplorerStore();
    store.selectedIds.add('a');

    wrapper.find('.node-grid').trigger('mousedown', { button: 0, ctrlKey: true });
    expect(store.selectedIds.has('a')).toBe(true);
  });

  it('ignores mousedown that starts on a card (lets the card handle it)', () => {
    const wrapper = mountGrid();
    const store = useExplorerStore();
    store.selectedIds.add('a');

    const card = wrapper.element.querySelector('[data-id="b"]') as HTMLElement;
    card.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
    expect(store.selectedIds.has('a')).toBe(true);
  });

  it('selects cards intersected by the dragged rectangle', async () => {
    const wrapper = mountGrid();
    const store = useExplorerStore();
    const gridEl = wrapper.find('.node-grid').element as HTMLElement;

    gridEl.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 600, bottom: 400, width: 600, height: 400 }) as DOMRect;

    const layout: Record<string, [number, number, number, number]> = {
      a: [0, 0, 190, 80],
      b: [200, 0, 390, 80],
      c: [400, 0, 590, 80],
    };
    for (const el of gridEl.querySelectorAll<HTMLElement>('[data-id]')) {
      const [l, t, r, b] = layout[el.dataset.id!];
      el.getBoundingClientRect = () =>
        ({ left: l, top: t, right: r, bottom: b, width: r - l, height: b - t }) as DOMRect;
    }

    gridEl.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 0, clientY: 0, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 90 }));

    expect(store.selectedIds.has('a')).toBe(true);
    expect(store.selectedIds.has('b')).toBe(true);
    expect(store.selectedIds.has('c')).toBe(false);

    window.dispatchEvent(new MouseEvent('mouseup'));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.node-grid__marquee').exists()).toBe(false);
  });
});
