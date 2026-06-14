import { describe, it, expect, beforeAll } from 'bun:test';

const BASE = 'http://localhost:3000/api/v1';

const get = async (url: string) => {
  const res = await fetch(url);
  return { status: res.status, body: await res.json() as any };
};

describe('GET /api/v1/nodes/tree', () => {
  it('returns 200 with a non-empty array', async () => {
    const { status, body } = await get(`${BASE}/nodes/tree`);
    expect(status).toBe(200);
    expect(body.data).toBeArray();
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('root nodes have required fields and type=folder', async () => {
    const { body } = await get(`${BASE}/nodes/tree`);
    const node = body.data[0];
    expect(node.id).toBeString();
    expect(node.name).toBeString();
    expect(node.type).toBe('folder');
    expect(node.children).toBeArray();
  });

  it('tree has at least two levels of nesting', async () => {
    const { body } = await get(`${BASE}/nodes/tree`);
    const hasGrandchild = body.data.some((n: any) =>
      n.children.length > 0 && n.children.some((c: any) => c.children !== undefined)
    );
    expect(hasGrandchild).toBe(true);
  });

  it('returns 6 root folders', async () => {
    const { body } = await get(`${BASE}/nodes/tree`);
    expect(body.data.length).toBe(6);
  });
});

describe('GET /api/v1/nodes/:id/children', () => {
  let documentsId: string;

  beforeAll(async () => {
    const { body } = await get(`${BASE}/nodes/tree`);
    const doc = body.data.find((n: any) => n.name === 'Documents');
    documentsId = doc.id;
  });

  it('returns 200 with children array for valid ID', async () => {
    const { status, body } = await get(`${BASE}/nodes/${documentsId}/children`);
    expect(status).toBe(200);
    expect(body.data).toBeArray();
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('returns both folders and files in children', async () => {
    const { body } = await get(`${BASE}/nodes/${documentsId}/children`);
    const types = new Set(body.data.map((n: any) => n.type));
    expect(types.has('folder')).toBe(true);
    expect(types.has('file')).toBe(true);
  });

  it('children are ordered: folders first, then files, alphabetically', async () => {
    const { body } = await get(`${BASE}/nodes/${documentsId}/children`);
    const items: Array<{ name: string; type: string }> = body.data;
    const folders = items.filter(i => i.type === 'folder');
    const files = items.filter(i => i.type === 'file');
    // Folders come before files
    if (folders.length > 0 && files.length > 0) {
      const lastFolderIdx = items.findLastIndex(i => i.type === 'folder');
      const firstFileIdx = items.findIndex(i => i.type === 'file');
      expect(lastFolderIdx).toBeLessThan(firstFileIdx);
    }
    // Folders are alphabetically sorted A-Z
    const folderNames = folders.map(f => f.name);
    expect(folderNames).toEqual([...folderNames].sort((a, b) => a.localeCompare(b)));
    // Files are alphabetically sorted A-Z
    const fileNames = files.map(f => f.name);
    expect(fileNames).toEqual([...fileNames].sort((a, b) => a.localeCompare(b)));
  });

  it('returns 404 for non-existent UUID', async () => {
    const { status, body } = await get(`${BASE}/nodes/00000000-0000-0000-0000-000000000000/children`);
    expect(status).toBe(404);
    expect(body.message).toBeString();
  });
});

describe('GET /api/v1/nodes/search', () => {
  it('returns 200 with results for matching query', async () => {
    const { status, body } = await get(`${BASE}/nodes/search?q=Documents`);
    expect(status).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('is case-insensitive', async () => {
    const { body: lower } = await get(`${BASE}/nodes/search?q=documents`);
    const { body: upper } = await get(`${BASE}/nodes/search?q=DOCUMENTS`);
    expect(lower.data.length).toBe(upper.data.length);
    expect(lower.data.length).toBeGreaterThan(0);
  });

  it('returns empty array for no matches', async () => {
    const { body } = await get(`${BASE}/nodes/search?q=xyznonexistent999`);
    expect(body.data).toHaveLength(0);
  });

  it('finds nodes by partial name', async () => {
    const { body } = await get(`${BASE}/nodes/search?q=doc`);
    expect(body.data.length).toBeGreaterThan(0);
    const found = body.data.some((n: any) => n.name.toLowerCase().includes('doc'));
    expect(found).toBe(true);
  });
});
