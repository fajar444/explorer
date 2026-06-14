import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import ContextMenu from './ContextMenu.vue';

const items = [
  { id: 'open', label: 'Open' },
  { id: 'sep', separator: true },
  { id: 'delete', label: 'Delete', danger: true },
];

describe('ContextMenu', () => {
  it('renders visible items and emits select with the item id', async () => {
    const wrapper = mount(ContextMenu, { props: { x: 10, y: 20, items, visible: true } });
    expect(wrapper.text()).toContain('Open');
    expect(wrapper.text()).toContain('Delete');
    await wrapper.findAll('[data-menu-item]')[0].trigger('click');
    expect(wrapper.emitted('select')?.[0]).toEqual(['open']);
  });

  it('does not render when visible is false', () => {
    const wrapper = mount(ContextMenu, { props: { x: 0, y: 0, items, visible: false } });
    expect(wrapper.find('[data-menu-item]').exists()).toBe(false);
  });

  it('emits close on Escape', async () => {
    const wrapper = mount(ContextMenu, { props: { x: 0, y: 0, items, visible: true } });
    await wrapper.trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
