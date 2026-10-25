export type FileCategory = 'photos' | 'videos' | 'documents';
export type RetentionColor = 'forever' | 'long' | 'medium' | 'short';

export interface VaultFile {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  date: string;
  timestamp: number;
  category: FileCategory;
  retention: string;
  retentionColor: RetentionColor;
  thumb: string | null;
  icon: 'photo' | 'video' | 'doc';
  checksum?: string;
  mimeType?: string;
}

export interface UploadingItem {
  id: string;
  name: string;
  progress: number;
  status?: 'encrypting' | 'uploading' | 'replicating' | 'completed';
}
