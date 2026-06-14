import { describe, it, expect, beforeAll } from 'bun:test';

const BASE = 'http://localhost:3000/api/v1';
const json = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, init);
  return { status: res.status, body: (await res.json().catch(() => ({}))) as any };
};
const findFolderId = async (name: string): Promise<string> => {
  const { body } = await json(`${BASE}/nodes/search?q=${encodeURIComponent(name)}`);
  return body.data.find((n: any) => n.name === name && n.type === 'folder').id;
};

describe('folder lifecycle: create -> rename -> trash -> restore -> permanent-delete', () => {
  let docsId: string;
  let folderId: string;

  beforeAll(async () => { docsId = await findFolderId('Documents'); });

  it('creates a folder', async () => {
    const { status, body } = await json(`${BASE}/nodes/folder`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `IT_${Date.now()}`, parentId: docsId }),
    });
    expect(status).toBe(200);
    expect(body.data.type).toBe('folder');
    folderId = body.data.id;
  });

  it('automatically renames a duplicate name', async () => {
    const name = `DUP_${Date.now()}`;
    const res1 = await json(`${BASE}/nodes/folder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, parentId: docsId }) });
    expect(res1.status).toBe(200);
    const res2 = await json(`${BASE}/nodes/folder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, parentId: docsId }) });
    expect(res2.status).toBe(200);
    expect(res2.body.data.name).toBe(`${name}_1`);
  });

  it('renames the folder', async () => {
    const { status, body } = await json(`${BASE}/nodes/${folderId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `Renamed_${Date.now()}` }),
    });
    expect(status).toBe(200);
    expect(body.data.name).toMatch(/^Renamed_/);
  });

  it('trashes then lists in trash', async () => {
    const { status } = await json(`${BASE}/nodes/trash`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [folderId] }),
    });
    expect(status).toBe(200);
    const { body } = await json(`${BASE}/nodes/trash`);
    expect(body.data.some((n: any) => n.id === folderId)).toBe(true);
  });

  it('restores from trash', async () => {
    const { status } = await json(`${BASE}/nodes/restore`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [folderId] }),
    });
    expect(status).toBe(200);
    const { body } = await json(`${BASE}/nodes/trash`);
    expect(body.data.some((n: any) => n.id === folderId)).toBe(false);
  });

  it('permanently deletes', async () => {
    const { status, body } = await json(`${BASE}/nodes/permanent-delete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [folderId] }),
    });
    expect(status).toBe(200);
    expect(body.deleted).toBeGreaterThanOrEqual(1);
  });
});

describe('upload -> content -> extract', () => {
  let docsId: string;
  let dlId: string;
  beforeAll(async () => { docsId = await findFolderId('Documents'); dlId = await findFolderId('Downloads'); });

  it('uploads a file and streams it back', async () => {
    const form = new FormData();
    form.append('parentId', docsId);
    form.append('files', new File([new TextEncoder().encode('integration upload')], `up_${Date.now()}.txt`, { type: 'text/plain' }));
    const res = await fetch(`${BASE}/nodes/upload`, { method: 'POST', body: form });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    const id = body.data[0].id;

    const contentRes = await fetch(`${BASE}/nodes/${id}/content`);
    expect(contentRes.status).toBe(200);
    expect(await contentRes.text()).toBe('integration upload');
  });

  it('serves a partial range (206) for content', async () => {
    const form = new FormData();
    form.append('parentId', docsId);
    form.append('files', new File([new TextEncoder().encode('0123456789')], `range_${Date.now()}.txt`, { type: 'text/plain' }));
    const up = await (await fetch(`${BASE}/nodes/upload`, { method: 'POST', body: form })).json() as any;
    const id = up.data[0].id;
    const res = await fetch(`${BASE}/nodes/${id}/content`, { headers: { Range: 'bytes=0-3' } });
    expect(res.status).toBe(206);
    expect(await res.text()).toBe('0123');
  });

  it('extracts the seeded sample.zip', async () => {
    const { body: search } = await json(`${BASE}/nodes/search?q=sample.zip`);
    const zip = search.data.find((n: any) => n.name === 'sample.zip');
    expect(zip).toBeDefined();
    const { status, body } = await json(`${BASE}/nodes/${zip.id}/extract`, { method: 'POST' });
    expect(status).toBe(200);
    expect(body.created.length).toBeGreaterThanOrEqual(2);
  });
});
