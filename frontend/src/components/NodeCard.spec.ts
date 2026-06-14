import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NodeCard from './NodeCard.vue';
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

function mountCard(node: Node, showPath = false) {
  return mount(NodeCard, { props: { node, showPath } });
}

describe('NodeCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('renders the node name', () => {
    const wrapper = mountCard(makeNode({ name: 'My Folder' }));
    expect(wrapper.text()).toContain('My Folder');
  });

  it('shows formatted size for a file and does NOT call selectNode when clicked', async () => {
    const file = makeNode({
      id: 'f1',
      name: 'report.pdf',
      type: 'file',
      path: '/report.pdf',
      size: 245760,
      extension: 'pdf',
    });
    const wrapper = mountCard(file);
    const store = useExplorerStore();
    const spy = vi.spyOn(store, 'selectNode').mockResolvedValue();

    expect(wrapper.text()).toContain('240');
    expect(wrapper.text()).toContain('KB');

    await wrapper.find('.node-card').trigger('click');
    expect(spy).not.toHaveBeenCalled();
  });

  it('emits itemClick with modifier flags when clicked (no direct store call)', async () => {
    const folder = makeNode({ id: 'd1', name: 'Documents', path: '/Documents' });
    const wrapper = mountCard(folder);
    const store = useExplorerStore();
    const spy = vi.spyOn(store, 'selectNode').mockResolvedValue();

    await wrapper.find('.node-card').trigger('click', { ctrlKey: true });

    expect(spy).not.toHaveBeenCalled();
    const events = wrapper.emitted('itemClick');
    expect(events).toHaveLength(1);
    expect(events?.[0][0]).toEqual(wrapper.props('node'));
    expect(events?.[0][1]).toEqual({ ctrl: true, shift: false });
  });

  it('emits itemDblClick and itemContextMenu', async () => {
    const folder = makeNode({ id: 'd1', name: 'Documents', path: '/Documents' });
    const wrapper = mountCard(folder);

    await wrapper.find('.node-card').trigger('dblclick');
    expect(wrapper.emitted('itemDblClick')).toHaveLength(1);
    expect(wrapper.emitted('itemDblClick')?.[0][0]).toEqual(wrapper.props('node'));

    await wrapper.find('.node-card').trigger('contextmenu');
    const ctx = wrapper.emitted('itemContextMenu');
    expect(ctx).toHaveLength(1);
    expect(ctx?.[0][0]).toEqual(wrapper.props('node'));
    expect(ctx?.[0][1]).toHaveProperty('x');
    expect(ctx?.[0][1]).toHaveProperty('y');
  });

  it('shows selected state when the node is in the store selection', () => {
    const folder = makeNode({ id: 'sel1', name: 'Selected', path: '/Selected' });
    const wrapper = mountCard(folder);
    const store = useExplorerStore();

    expect(wrapper.find('.node-card').classes()).not.toContain('is-selected');

    store.selectOnly('sel1');
    return wrapper.vm.$nextTick().then(() => {
      expect(wrapper.find('.node-card').classes()).toContain('is-selected');
    });
  });

  it('renders the node path when showPath is true', () => {
    const node = makeNode({
      id: 'p1',
      name: 'deep',
      path: '/a/b/c/deep',
    });
    const wrapper = mountCard(node, true);
    expect(wrapper.text()).toContain('/a/b/c/deep');
  });
});
