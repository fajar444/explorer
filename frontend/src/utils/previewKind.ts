import type { Node } from '@/types/node';

export type PreviewKind = 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'none';

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif', 'ico'];
const VIDEO_EXT = ['mp4', 'webm', 'ogv', 'mov'];
const AUDIO_EXT = ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac'];
const TEXT_EXT = ['txt', 'md', 'markdown', 'json', 'js', 'ts', 'tsx', 'jsx', 'vue', 'css', 'scss', 'html', 'xml', 'csv', 'log', 'yml', 'yaml', 'ini', 'sh', 'py', 'java', 'c', 'cpp', 'go', 'rs'];
const ARCHIVE_EXT = ['zip', 'rar', '7z'];

export function previewKind(node: Node): PreviewKind {
  if (node.type !== 'file' || !node.storageKey) return 'none';
  const mime = node.mimeType ?? '';
  const ext = (node.extension ?? '').toLowerCase();
  if (mime.startsWith('image/') || IMAGE_EXT.includes(ext)) return 'image';
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mime.startsWith('video/') || VIDEO_EXT.includes(ext)) return 'video';
  if (mime.startsWith('audio/') || AUDIO_EXT.includes(ext)) return 'audio';
  if (mime.startsWith('text/') || TEXT_EXT.includes(ext)) return 'text';
  return 'none';
}

export function isArchive(node: Node): boolean {
  return ARCHIVE_EXT.includes((node.extension ?? '').toLowerCase());
}
