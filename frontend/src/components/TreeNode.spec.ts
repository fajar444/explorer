import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TreeNode from './TreeNode.vue';
import { useExplorerStore } from '@/stores/explorerStore';
import type { NodeTree } from '@/types/node';

vi.mock('@/services/nodeApi', () => ({
  nodeApi: {
    getTree: vi.fn().mockResolvedValue({ data: [] }),
    getChildren: vi.fn().mockResolvedValue({ data: [] }),
    search: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

function makeTree(overrides: Partial<NodeTree> = {}): NodeTree {
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
    children: [],
    ...overrides,
  };
}

function fixtureTree(): NodeTree {
  const grandchild = makeTree({
    id: 'grandchild',
    name: 'Grandchild',
    parentId: 'childA',
    path: '/root/childA/grandchild',
  });
  const childA = makeTree({
    id: 'childA',
    name: 'Child A',
    parentId: 'root',
    path: '/root/childA',
    children: [grandchild],
  });
  const childB = makeTree({
    id: 'childB',
    name: 'Child B',
    parentId: 'root',
    path: '/root/childB',
  });
  return makeTree({
    id: 'root',
    name: 'Root Folder',
    path: '/root',
    children: [childA, childB],
  });
}

function mountNode(node: NodeTree, depth = 0) {
  return mount(TreeNode, { props: { node, depth } });
}

describe('TreeNode', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('renders the node name', () => {
    const wrapper = mountNode(fixtureTree());
    expect(wrapper.text()).toContain('Root Folder');
  });

  it('shows a visible chevron when the node has children', () => {
    const wrapper = mountNode(fixtureTree());
    const chevron = wrapper.find('.tree-node__chevron');
    expect(chevron.exists()).toBe(true);
    expect(chevron.classes()).not.toContain('is-hidden');
  });

  it('hides the chevron when the node has no children', () => {
    const leaf = makeTree({ id: 'leaf', name: 'Leaf', children: [] });
    const wrapper = mountNode(leaf);
    const chevron = wrapper.find('.tree-node__chevron');
    expect(chevron.classes()).toContain('is-hidden');
  });

  it('clicking the row calls selectNode with the node', async () => {
    const wrapper = mountNode(fixtureTree());
    const store = useExplorerStore();
    const spy = vi.spyOn(store, 'selectNode').mockResolvedValue();

    await wrapper.find('.tree-node__row').trigger('click');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(wrapper.props('node'));
  });

  it('clicking the chevron toggles expand and does NOT select (@click.stop)', async () => {
    const tree = fixtureTree();
    const wrapper = mountNode(tree);
    const store = useExplorerStore();
    const toggleSpy = vi.spyOn(store, 'toggleExpand');
    const selectSpy = vi.spyOn(store, 'selectNode').mockResolvedValue();

    await wrapper.find('.tree-node__chevron').trigger('click');

    expect(toggleSpy).toHaveBeenCalledTimes(1);
    expect(toggleSpy).toHaveBeenCalledWith('root');
    expect(selectSpy).not.toHaveBeenCalled();
  });

  it('does not render children when collapsed, and renders them recursively when expanded', async () => {
    const tree = fixtureTree();
    const wrapper = mountNode(tree);
    const store = useExplorerStore();

    expect(wrapper.findAllComponents(TreeNode)).toHaveLength(0);
    expect(wrapper.text()).not.toContain('Child A');

    store.toggleExpand('root');
    await nextTick();

    const nodesAfterRoot = wrapper.findAllComponents(TreeNode);
    expect(nodesAfterRoot.length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('Child A');
    expect(wrapper.text()).toContain('Child B');
    expect(wrapper.text()).not.toContain('Grandchild');

    store.toggleExpand('childA');
    await nextTick();

    expect(wrapper.findAllComponents(TreeNode).length).toBeGreaterThan(
      nodesAfterRoot.length,
    );
    expect(wrapper.text()).toContain('Grandchild');
  });
});
