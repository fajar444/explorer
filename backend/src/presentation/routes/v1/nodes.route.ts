import Elysia, { t } from 'elysia';
import type { NodeService } from '../../../application/node.service';
import type { NodeWriteService } from '../../../application/node-write.service';
import { env } from '../../../config/env';

export const nodesRoute = (nodeService: NodeService, writeService: NodeWriteService) =>
  new Elysia({ prefix: '/nodes' })
    .get('/tree', async () => ({ data: await nodeService.getTree() }), {
      detail: { summary: 'Get complete folder tree', tags: ['Nodes'] },
    })
    .get('/search', async ({ query }) => ({ data: await nodeService.search(query.q) }), {
      query: t.Object({ q: t.String({ minLength: 1 }) }),
      detail: { summary: 'Search nodes by name', tags: ['Nodes'] },
    })
    .get('/trash', async () => ({ data: await writeService.listTrash() }), {
      detail: { summary: 'List items in the recycle bin', tags: ['Trash'] },
    })
    .get('/:id/children', async ({ params, set }) => {
      try {
        return { data: await nodeService.getChildren(params.id) };
      } catch (e) {
        set.status = 404;
        return { message: (e as Error).message };
      }
    }, {
      params: t.Object({ id: t.String() }),
      detail: { summary: 'Get direct children of a node', tags: ['Nodes'] },
    })
    .get('/:id/content', async ({ params, query, request, set }) => {
      try {
        const { node, absolutePath } = await writeService.getContent(params.id);
        const file = Bun.file(absolutePath);
        const total = file.size;
        const disposition = query.disposition === 'attachment' ? 'attachment' : 'inline';
        const contentType = node.mimeType ?? 'application/octet-stream';
        const filename = encodeURIComponent(node.name);
        const range = request.headers.get('range');
        set.headers['Accept-Ranges'] = 'bytes';
        set.headers['Content-Type'] = contentType;
        set.headers['Content-Disposition'] = `${disposition}; filename*=UTF-8''${filename}`;
        if (range) {
          const m = /bytes=(\d*)-(\d*)/.exec(range);
          const start = m && m[1] ? parseInt(m[1], 10) : 0;
          const end = m && m[2] ? parseInt(m[2], 10) : total - 1;
          if (Number.isNaN(start) || start > end || start >= total) {
            set.status = 416;
            set.headers['Content-Range'] = `bytes */${total}`;
            return '';
          }
          set.status = 206;
          set.headers['Content-Range'] = `bytes ${start}-${end}/${total}`;
          return file.slice(start, end + 1);
        }
        return file;
      } catch (e) {
        set.status = 404;
        return { message: (e as Error).message };
      }
    }, {
      params: t.Object({ id: t.String() }),
      query: t.Object({ disposition: t.Optional(t.String()) }),
      detail: { summary: 'Stream file content (range supported)', tags: ['Files'] },
    })
    .post('/folder', async ({ body, set }) => {
      try {
        return { data: await writeService.createFolder(body.name, body.parentId ?? null) };
      } catch (e) {
        set.status = 409;
        return { message: (e as Error).message };
      }
    }, {
      body: t.Object({ name: t.String({ minLength: 1 }), parentId: t.Optional(t.Union([t.String(), t.Null()])) }),
      detail: { summary: 'Create a folder', tags: ['Nodes'] },
    })
    .patch('/:id', async ({ params, body, set }) => {
      try {
        if (body.name !== undefined) await writeService.rename(params.id, body.name);
        if (body.parentId !== undefined) await writeService.move([params.id], body.parentId);
        return { data: await nodeService.getById(params.id) };
      } catch (e) {
        set.status = 409;
        return { message: (e as Error).message };
      }
    }, {
      params: t.Object({ id: t.String() }),
      body: t.Object({ name: t.Optional(t.String({ minLength: 1 })), parentId: t.Optional(t.Union([t.String(), t.Null()])) }),
      detail: { summary: 'Rename and/or move a node', tags: ['Nodes'] },
    })
    .post('/move', async ({ body, set }) => {
      try { return await writeService.move(body.ids, body.targetParentId); }
      catch (e) { set.status = 409; return { message: (e as Error).message }; }
    }, {
      body: t.Object({ ids: t.Array(t.String()), targetParentId: t.Union([t.String(), t.Null()]) }),
      detail: { summary: 'Move nodes (batch)', tags: ['Nodes'] },
    })
    .post('/copy', async ({ body, set }) => {
      try { return await writeService.copy(body.ids, body.targetParentId); }
      catch (e) { set.status = 409; return { message: (e as Error).message }; }
    }, {
      body: t.Object({ ids: t.Array(t.String()), targetParentId: t.Union([t.String(), t.Null()]) }),
      detail: { summary: 'Copy nodes (batch)', tags: ['Nodes'] },
    })
    .post('/trash', async ({ body }) => writeService.trash(body.ids), {
      body: t.Object({ ids: t.Array(t.String()) }),
      detail: { summary: 'Move nodes to the recycle bin (batch)', tags: ['Trash'] },
    })
    .post('/restore', async ({ body }) => writeService.restore(body.ids), {
      body: t.Object({ ids: t.Array(t.String()) }),
      detail: { summary: 'Restore nodes from the recycle bin (batch)', tags: ['Trash'] },
    })
    .post('/permanent-delete', async ({ body }) => writeService.permanentDelete(body.ids), {
      body: t.Object({ ids: t.Array(t.String()) }),
      detail: { summary: 'Permanently delete nodes (batch)', tags: ['Trash'] },
    })
    .post('/trash/empty', async () => writeService.emptyTrash(), {
      detail: { summary: 'Empty the recycle bin', tags: ['Trash'] },
    })
    .post('/upload', async ({ body, set }) => {
      try {
        const filesRaw = body.files;
        const files = Array.isArray(filesRaw) ? filesRaw : [filesRaw];
        const prepared = [];
        for (const f of files) {
          if (f.size > env.MAX_UPLOAD_SIZE) {
            set.status = 413;
            return { message: `"${f.name}" exceeds the maximum upload size` };
          }
          prepared.push({ name: f.name, mimeType: f.type || null, data: new Uint8Array(await f.arrayBuffer()) });
        }
        const data = await writeService.upload(body.parentId ?? null, prepared);
        return { data };
      } catch (e) {
        set.status = 400;
        return { message: (e as Error).message };
      }
    }, {
      body: t.Object({
        parentId: t.Optional(t.Union([t.String(), t.Null()])),
        files: t.Files(),
      }),
      type: 'multipart/form-data',
      detail: { summary: 'Upload one or more files', tags: ['Files'] },
    })
    .post('/:id/extract', async ({ params, set }) => {
      try { return await writeService.extract(params.id); }
      catch (e) { set.status = 409; return { message: (e as Error).message }; }
    }, {
      params: t.Object({ id: t.String() }),
      detail: { summary: 'Extract an archive into its folder', tags: ['Files'] },
    });
