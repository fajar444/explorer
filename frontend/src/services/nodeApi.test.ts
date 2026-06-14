import { describe, it, expect } from 'vitest';
import { nodeApi } from './nodeApi';

describe('nodeApi.contentUrl', () => {
  it('builds an inline content URL by default', () => {
    const url = nodeApi.contentUrl('abc');
    expect(url).toContain('/nodes/abc/content');
    expect(url).toContain('disposition=inline');
  });
  it('builds an attachment URL when requested', () => {
    expect(nodeApi.contentUrl('abc', 'attachment')).toContain('disposition=attachment');
  });
});
