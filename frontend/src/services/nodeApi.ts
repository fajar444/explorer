import type { Node, NodeTree, ApiResponse } from '@/types/node';

const BASE = import.meta.env.VITE_API_BASE_URL as string;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const nodeApi = {
  getTree: () => request<ApiResponse<NodeTree[]>>(`${BASE}/nodes/tree`),
  getChildren: (id: string) => request<ApiResponse<Node[]>>(`${BASE}/nodes/${id}/children`),
  search: (q: string) => request<ApiResponse<Node[]>>(`${BASE}/nodes/search?q=${encodeURIComponent(q)}`),
  getTrash: () => request<ApiResponse<Node[]>>(`${BASE}/nodes/trash`),

  createFolder: (name: string, parentId: string | null) =>
    request<ApiResponse<Node>>(`${BASE}/nodes/folder`, jsonInit('POST', { name, parentId })),
  rename: (id: string, name: string) =>
    request<ApiResponse<Node>>(`${BASE}/nodes/${id}`, jsonInit('PATCH', { name })),
  move: (ids: string[], targetParentId: string | null) =>
    request<{ moved: number }>(`${BASE}/nodes/move`, jsonInit('POST', { ids, targetParentId })),
  copy: (ids: string[], targetParentId: string | null) =>
    request<{ created: Node[] }>(`${BASE}/nodes/copy`, jsonInit('POST', { ids, targetParentId })),
  trash: (ids: string[]) =>
    request<{ trashed: number }>(`${BASE}/nodes/trash`, jsonInit('POST', { ids })),
  restore: (ids: string[]) =>
    request<{ restored: number }>(`${BASE}/nodes/restore`, jsonInit('POST', { ids })),
  permanentDelete: (ids: string[]) =>
    request<{ deleted: number }>(`${BASE}/nodes/permanent-delete`, jsonInit('POST', { ids })),
  emptyTrash: () => request<{ deleted: number }>(`${BASE}/nodes/trash/empty`, jsonInit('POST', {})),

  contentUrl: (id: string, disposition: 'inline' | 'attachment' = 'inline'): string =>
    `${BASE}/nodes/${id}/content?disposition=${disposition}`,

  getContentText: async (id: string): Promise<string> => {
    const res = await fetch(`${BASE}/nodes/${id}/content?disposition=inline`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  },

  extract: (id: string) =>
    request<{ created: Node[] }>(`${BASE}/nodes/${id}/extract`, jsonInit('POST', {})),

  upload: (
    parentId: string | null,
    files: File[],
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<ApiResponse<Node[]>> =>
    new Promise((resolve, reject) => {
      const form = new FormData();
      if (parentId !== null) form.append('parentId', parentId);
      for (const f of files) form.append('files', f);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE}/nodes/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(e.loaded, e.total);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText) as ApiResponse<Node[]>);
        } else {
          let message = `HTTP ${xhr.status}`;
          try { message = (JSON.parse(xhr.responseText) as { message?: string }).message ?? message; } catch {  }
          reject(new Error(message));
        }
      };
      xhr.onerror = () => reject(new Error('Upload failed - network error'));
      xhr.send(form);
    }),
};
