import { db } from './src/infrastructure/database/connection';
import { nodes, type NodeInsert } from './src/infrastructure/database/schema';
import { FilesystemStorageService } from './src/infrastructure/storage/filesystem-storage.service';
import { env } from './src/config/env';
import { readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { zipSync, strToU8 } from 'fflate';

type Row = Omit<NodeInsert, 'id' | 'createdAt' | 'updatedAt'>;

const MIME: Record<string, string> = {
  css: 'text/css', js: 'text/javascript', csv: 'text/csv', txt: 'text/plain', test: 'text/plain',
  svg: 'image/svg+xml', json: 'application/json', md: 'text/markdown',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  pdf: 'application/pdf',
  mp4: 'video/mp4', webm: 'video/webm', avi: 'video/x-msvideo', mkv: 'video/x-matroska', mov: 'video/quicktime',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text',
  rtf: 'application/rtf',
  zip: 'application/zip', rar: 'application/vnd.rar', '7z': 'application/x-7z-compressed', tar: 'application/x-tar',
};

const CATEGORY: Record<string, string> = {
  jpg: 'Images', jpeg: 'Images', png: 'Images', gif: 'Images', webp: 'Images', svg: 'Images', bmp: 'Images',
  mp3: 'Audio', wav: 'Audio', ogg: 'Audio', m4a: 'Audio', aac: 'Audio', flac: 'Audio',
  mp4: 'Video', webm: 'Video', mov: 'Video', avi: 'Video', mkv: 'Video',
  zip: 'Archives', rar: 'Archives', '7z': 'Archives', tar: 'Archives', gz: 'Archives',
  pdf: 'Documents', doc: 'Documents', docx: 'Documents', xls: 'Documents', xlsx: 'Documents',
  ppt: 'Documents', pptx: 'Documents', odt: 'Documents', rtf: 'Documents', csv: 'Documents', txt: 'Documents', md: 'Documents',
  js: 'Code', ts: 'Code', css: 'Code', html: 'Code', json: 'Code', xml: 'Code', test: 'Code',
};

const storage = new FilesystemStorageService(env.STORAGE_DIR);

async function seed() {
  console.log('Clearing existing data...');
  await db.delete(nodes);
  await rm(resolve(process.cwd(), env.STORAGE_DIR), { recursive: true, force: true });

  console.log('Seeding...');

  const insert = async (row: Row): Promise<string> => {
    const [{ id }] = await db.insert(nodes).values(row).returning({ id: nodes.id });
    return id;
  };

  const addFile = async (parentId: string, name: string, mime: string, bytes: Uint8Array, parentPath: string) => {
    const { storageKey, size } = await storage.saveBytes(bytes);
    const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : null;
    await db.insert(nodes).values({
      name, type: 'file', parentId, path: `${parentPath}/${name}`,
      size, extension: ext, storageKey, mimeType: mime,
    } as NodeInsert);
  };

  const docId  = await insert({ name: 'Documents', type: 'folder', parentId: null, path: '/Documents', size: null, extension: null });
  const dlId   = await insert({ name: 'Downloads', type: 'folder', parentId: null, path: '/Downloads', size: null, extension: null });
  const picId  = await insert({ name: 'Pictures',  type: 'folder', parentId: null, path: '/Pictures',  size: null, extension: null });
  const musId  = await insert({ name: 'Music',     type: 'folder', parentId: null, path: '/Music',     size: null, extension: null });
  const vidId  = await insert({ name: 'Videos',    type: 'folder', parentId: null, path: '/Videos',    size: null, extension: null });
  const deskId = await insert({ name: 'Desktop', type: 'folder', parentId: null, path: '/Desktop', size: null, extension: null });

  const projId = await insert({ name: 'Projects', type: 'folder', parentId: docId, path: '/Documents/Projects', size: null, extension: null });
  const workId = await insert({ name: 'Work',     type: 'folder', parentId: docId, path: '/Documents/Work',     size: null, extension: null });
  await insert({ name: 'Personal',   type: 'folder', parentId: docId, path: '/Documents/Personal',   size: null, extension: null });
  await insert({ name: 'Resume.pdf', type: 'file',   parentId: docId, path: '/Documents/Resume.pdf', size: 245760, extension: 'pdf' });

  const expId  = await insert({ name: 'Explorer',  type: 'folder', parentId: projId, path: '/Documents/Projects/Explorer',  size: null, extension: null });
  await insert({ name: 'Portfolio', type: 'folder', parentId: projId, path: '/Documents/Projects/Portfolio', size: null, extension: null });
  await insert({ name: 'README.md', type: 'file',   parentId: projId, path: '/Documents/Projects/README.md', size: 1024, extension: 'md' });

  await insert({ name: 'backend',  type: 'folder', parentId: expId, path: '/Documents/Projects/Explorer/backend',  size: null, extension: null });
  await insert({ name: 'frontend', type: 'folder', parentId: expId, path: '/Documents/Projects/Explorer/frontend', size: null, extension: null });

  const repId  = await insert({ name: 'Reports',       type: 'folder', parentId: workId, path: '/Documents/Work/Reports',       size: null, extension: null });
  await insert({ name: 'Presentations', type: 'folder', parentId: workId, path: '/Documents/Work/Presentations', size: null, extension: null });
  await insert({ name: '2024', type: 'folder', parentId: repId, path: '/Documents/Work/Reports/2024', size: null, extension: null });
  await insert({ name: '2025', type: 'folder', parentId: repId, path: '/Documents/Work/Reports/2025', size: null, extension: null });

  await insert({ name: 'Software',         type: 'folder', parentId: dlId, path: '/Downloads/Software',         size: null,     extension: null });
  await insert({ name: 'Media',            type: 'folder', parentId: dlId, path: '/Downloads/Media',            size: null,     extension: null });
  await insert({ name: 'chrome_setup.exe', type: 'file',   parentId: dlId, path: '/Downloads/chrome_setup.exe', size: 88080384, extension: 'exe' });

  const p2024Id = await insert({ name: '2024', type: 'folder', parentId: picId, path: '/Pictures/2024', size: null, extension: null });
  const p2025Id = await insert({ name: '2025', type: 'folder', parentId: picId, path: '/Pictures/2025', size: null, extension: null });
  await insert({ name: 'January',  type: 'folder', parentId: p2024Id, path: '/Pictures/2024/January',  size: null, extension: null });
  await insert({ name: 'June',     type: 'folder', parentId: p2024Id, path: '/Pictures/2024/June',     size: null, extension: null });
  await insert({ name: 'December', type: 'folder', parentId: p2024Id, path: '/Pictures/2024/December', size: null, extension: null });
  await insert({ name: 'January',  type: 'folder', parentId: p2025Id, path: '/Pictures/2025/January',  size: null, extension: null });
  await insert({ name: 'photo_001.jpg', type: 'file', parentId: p2024Id, path: '/Pictures/2024/photo_001.jpg', size: 3145728, extension: 'jpg' });

  const artId  = await insert({ name: 'Artists',   type: 'folder', parentId: musId, path: '/Music/Artists',   size: null, extension: null });
  await insert({ name: 'Playlists',   type: 'folder', parentId: musId, path: '/Music/Playlists',             size: null, extension: null });
  await insert({ name: 'Coldplay',    type: 'folder', parentId: artId, path: '/Music/Artists/Coldplay',      size: null, extension: null });
  await insert({ name: 'Linkin Park', type: 'folder', parentId: artId, path: '/Music/Artists/Linkin Park',   size: null, extension: null });
  await insert({ name: 'Daft Punk',   type: 'folder', parentId: artId, path: '/Music/Artists/Daft Punk',     size: null, extension: null });

  await insert({ name: 'Movies',    type: 'folder', parentId: vidId, path: '/Videos/Movies',    size: null, extension: null });
  await insert({ name: 'Series',    type: 'folder', parentId: vidId, path: '/Videos/Series',    size: null, extension: null });
  await insert({ name: 'Tutorials', type: 'folder', parentId: vidId, path: '/Videos/Tutorials', size: null, extension: null });

  await addFile(docId, 'welcome.txt', 'text/plain', new TextEncoder().encode('Welcome to Explorer!\nThis is a real, previewable file.\n'), '/Documents');

  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  await addFile(docId, 'pixel.png', 'image/png', Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0)), '/Documents');

  const sampleZip = zipSync({
    'readme.txt': strToU8('Extracted from sample.zip'),
    'nested/data.txt': strToU8('nested file'),
  });
  await addFile(dlId, 'sample.zip', 'application/zip', sampleZip, '/Downloads');

  const samplesRoot = resolve(import.meta.dir, '..', 'sample_file');
  let sampleNames: string[] = [];
  try {
    sampleNames = (await readdir(samplesRoot)).sort();
  } catch {
    sampleNames = [];
  }
  if (sampleNames.length > 0) {
    const samplesId = await insert({ name: 'Samples', type: 'folder', parentId: deskId, path: '/Desktop/Samples', size: null, extension: null });
    const catIds: Record<string, string> = {};
    const ensureCat = async (cat: string): Promise<string> => {
      if (!catIds[cat]) {
        catIds[cat] = await insert({ name: cat, type: 'folder', parentId: samplesId, path: `/Desktop/Samples/${cat}`, size: null, extension: null });
      }
      return catIds[cat];
    };
    for (const fname of sampleNames) {
      const dot = fname.lastIndexOf('.');
      const ext = dot > 0 ? fname.slice(dot + 1).toLowerCase() : '';
      const cat = CATEGORY[ext] ?? 'Other';
      const mime = MIME[ext] ?? 'application/octet-stream';
      const parentId = await ensureCat(cat);
      const bytes = new Uint8Array(await Bun.file(resolve(samplesRoot, fname)).arrayBuffer());
      const { storageKey, size } = await storage.saveBytes(bytes);
      await insert({ name: fname, type: 'file', parentId, path: `/Desktop/Samples/${cat}/${fname}`, size, extension: ext || null, storageKey, mimeType: mime });
    }
  }

  const result = await db.execute(`SELECT COUNT(*)::text AS count FROM nodes`);
  const count = (result.rows[0] as { count: string }).count;
  console.log(`Done — seeded ${count} nodes.`);
}

seed().catch(console.error).finally(() => process.exit(0));
