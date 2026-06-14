import {
  mdiFolderOutline, mdiFolderOpen,
  mdiFileOutline, mdiFilePdfBox, mdiFileImageOutline,
  mdiFileMusic, mdiFileVideo, mdiFileCode,
  mdiMicrosoftWord, mdiMicrosoftExcel, mdiMicrosoftPowerpoint,
  mdiZipBox, mdiApplication, mdiLanguageMarkdown, mdiFileDocumentOutline,
} from '@mdi/js';

export function getNodeIcon(type: 'folder' | 'file', extension: string | null, isOpen = false): string {
  if (type === 'folder') return isOpen ? mdiFolderOpen : mdiFolderOutline;

  const ext = extension?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pdf: mdiFilePdfBox,
    jpg: mdiFileImageOutline, jpeg: mdiFileImageOutline,
    png: mdiFileImageOutline, gif: mdiFileImageOutline, webp: mdiFileImageOutline, svg: mdiFileImageOutline,
    mp3: mdiFileMusic, wav: mdiFileMusic, flac: mdiFileMusic,
    mp4: mdiFileVideo, mkv: mdiFileVideo, avi: mdiFileVideo,
    ts: mdiFileCode, js: mdiFileCode, vue: mdiFileCode,
    json: mdiFileCode, html: mdiFileCode, css: mdiFileCode,
    docx: mdiMicrosoftWord, doc: mdiMicrosoftWord,
    xlsx: mdiMicrosoftExcel, xls: mdiMicrosoftExcel,
    pptx: mdiMicrosoftPowerpoint, ppt: mdiMicrosoftPowerpoint,
    zip: mdiZipBox, rar: mdiZipBox, '7z': mdiZipBox,
    exe: mdiApplication,
    md: mdiLanguageMarkdown,
    txt: mdiFileDocumentOutline,
  };
  return map[ext] ?? mdiFileOutline;
}
