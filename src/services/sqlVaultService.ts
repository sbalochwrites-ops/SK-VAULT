import { getIdToken } from '../lib/workspace';
import { VaultFile } from '../types';

export const fetchVaultFilesFromSql = async (): Promise<VaultFile[] | null> => {
  try {
    const token = await getIdToken();
    if (!token) return null;

    const res = await fetch('/api/vault/files', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (Array.isArray(data.files) && data.files.length > 0) {
      return data.files as VaultFile[];
    }
    return [];
  } catch (err) {
    console.warn('Cloud SQL fetch notice:', err);
    return null;
  }
};

export const saveVaultFileToSql = async (file: VaultFile): Promise<boolean> => {
  try {
    const token = await getIdToken();
    if (!token) return false;

    const res = await fetch('/api/vault/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(file),
    });
    return res.ok;
  } catch (err) {
    console.warn('Cloud SQL save notice:', err);
    return false;
  }
};

export const deleteVaultFilesFromSql = async (fileIds: string[]): Promise<boolean> => {
  try {
    const token = await getIdToken();
    if (!token) return false;

    const res = await fetch('/api/vault/files', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileIds }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Cloud SQL delete notice:', err);
    return false;
  }
};
