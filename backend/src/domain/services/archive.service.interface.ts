export interface ExtractedEntry {
  relativePath: string;
  isDirectory: boolean;
  data: Uint8Array;
}

export interface ExtractCapability {
  supported: boolean;
  reason?: string;
}

export interface IArchiveService {
  canExtract(extension: string | null): ExtractCapability;
  extract(absolutePath: string, extension: string): Promise<ExtractedEntry[]>;
}
