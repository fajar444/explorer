import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { db } from './infrastructure/database/connection';
import { NodeDrizzleRepository } from './infrastructure/repositories/node.drizzle.repository';
import { FilesystemStorageService } from './infrastructure/storage/filesystem-storage.service';
import { ArchiveService } from './infrastructure/archive/archive.service';
import { NodeService } from './application/node.service';
import { NodeWriteService } from './application/node-write.service';
import { nodesRoute } from './presentation/routes/v1/nodes.route';
import { env } from './config/env';

const nodeRepository = new NodeDrizzleRepository(db);
const storageService = new FilesystemStorageService(env.STORAGE_DIR);
const archiveService = new ArchiveService();
const nodeService = new NodeService(nodeRepository);
const nodeWriteService = new NodeWriteService(nodeRepository, storageService, archiveService);

const app = new Elysia()
  .use(cors({ origin: env.FRONTEND_URL, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type'] }))
  .use(swagger({
    path: '/docs',
    provider: 'scalar',
    documentation: {
      info: {
        title: 'Explorer API',
        version: '2.0.0',
        description: [
          '# Explorer API',
          '',
          'A REST API for a Windows Explorer-style file manager. It serves an unlimited-depth tree of',
          'folders and files, streams real file content, and supports the full set of file operations:',
          'create, rename, move, copy, upload, download, archive extraction, and a recycle bin.',
          '',
          '## Base URL',
          '',
          '```',
          'http://localhost:3000/api/v1',
          '```',
          '',
          '## Conventions',
          '',
          '- **Format** - all JSON responses are wrapped in an envelope: `{ "data": ... }`.',
          '- **Identifiers** - every node (folder or file) is identified by a UUID.',
          '- **Errors** - failures return the matching HTTP status with `{ "message": "..." }` (e.g. `404` not found, `409` conflict, `413` payload too large).',
          '- **Authentication** - none; this is a single-user local application.',
          '',
          '## Resource groups',
          '',
          '- **Nodes** - read the folder tree, list the children of a folder, search, and perform structure operations (create / rename / move / copy).',
          '- **Files** - upload files (multipart), stream content (with HTTP range support for video and audio), and extract archives.',
          '- **Trash** - soft-delete to the recycle bin, restore, permanently delete, and empty.',
          '',
          '## Content streaming',
          '',
          '`GET /nodes/{id}/content` streams the bytes of a file with the correct `Content-Type`. It honours the',
          '`Range` header (returning `206 Partial Content`) so media can be scrubbed, and accepts',
          '`?disposition=attachment` to force a download.',
        ].join('\n'),
        contact: { name: 'Fajar Iryanto Putra' },
      },
      tags: [
        { name: 'Nodes', description: 'Folder/file structure operations' },
        { name: 'Files', description: 'Upload, content streaming, extraction' },
        { name: 'Trash', description: 'Recycle bin operations' },
      ],
    },
  }))
  .group('/api/v1', (app) => app.use(nodesRoute(nodeService, nodeWriteService)))
  .listen(env.PORT);

console.log(`Server : http://localhost:${env.PORT}`);
console.log(`API    : http://localhost:${env.PORT}/api/v1`);
console.log(`Docs   : http://localhost:${env.PORT}/docs`);

export type App = typeof app;
