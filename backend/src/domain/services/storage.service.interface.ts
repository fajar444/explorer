export interface StoredBlob {
  storageKey: string;
  size: number;
}

export interface IStorageService {
  saveBytes(data: Uint8Array): Promise<StoredBlob>;
  copy(storageKey: string): Promise<string>;
  delete(storageKey: string): Promise<void>;
  absolutePath(storageKey: string): string;
}
