import { describe, it, expect } from 'vitest';
import {
  mdiFolderOutline,
  mdiFolderOpen,
  mdiFileOutline,
  mdiFilePdfBox,
  mdiFileImageOutline,
  mdiFileCode,
  mdiLanguageMarkdown,
} from '@mdi/js';
import { getNodeIcon } from '@/utils/nodeIcon';

describe('getNodeIcon', () => {
  it('returns closed folder icon for a folder', () => {
    expect(getNodeIcon('folder', null)).toBe(mdiFolderOutline);
  });

  it('returns open folder icon when isOpen is true', () => {
    expect(getNodeIcon('folder', null, true)).toBe(mdiFolderOpen);
  });

  it('returns the pdf icon for pdf files', () => {
    expect(getNodeIcon('file', 'pdf')).toBe(mdiFilePdfBox);
  });

  it('returns the image icon for jpg files', () => {
    expect(getNodeIcon('file', 'jpg')).toBe(mdiFileImageOutline);
  });

  it('returns the markdown icon for md files', () => {
    expect(getNodeIcon('file', 'md')).toBe(mdiLanguageMarkdown);
  });

  it('returns the code icon for ts files', () => {
    expect(getNodeIcon('file', 'ts')).toBe(mdiFileCode);
  });

  it('returns the generic file icon for an unknown extension', () => {
    expect(getNodeIcon('file', 'xyz')).toBe(mdiFileOutline);
  });

  it('returns the generic file icon for a null extension', () => {
    expect(getNodeIcon('file', null)).toBe(mdiFileOutline);
  });

  it('is case-insensitive for extensions', () => {
    expect(getNodeIcon('file', 'PDF')).toBe(mdiFilePdfBox);
  });
});
