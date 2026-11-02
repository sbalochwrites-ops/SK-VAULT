import { db } from './index.ts';
import { users, vaultFiles, vaultAuditLogs } from './schema.ts';
import { eq, desc, inArray, and } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user profile.', { cause: error });
  }
}

export async function getUserFiles(userId: number) {
  try {
    return await db
      .select()
      .from(vaultFiles)
      .where(eq(vaultFiles.userId, userId))
      .orderBy(desc(vaultFiles.timestamp));
  } catch (error) {
    console.error('Database query failed in getUserFiles:', error);
    throw new Error('Failed to load vault files.', { cause: error });
  }
}

export async function upsertUserFile(
  userId: number,
  fileData: {
    id: string;
    name: string;
    size: string;
    sizeBytes: number;
    date: string;
    timestamp: number;
    category: string;
    retention: string;
    retentionColor: string;
    thumb: string | null;
    icon: string;
    checksum?: string;
    mimeType?: string;
  }
) {
  try {
    const result = await db
      .insert(vaultFiles)
      .values({
        id: fileData.id,
        userId,
        name: fileData.name,
        size: fileData.size,
        sizeBytes: fileData.sizeBytes,
        date: fileData.date,
        timestamp: fileData.timestamp,
        category: fileData.category,
        retention: fileData.retention,
        retentionColor: fileData.retentionColor,
        thumb: fileData.thumb,
        icon: fileData.icon,
        checksum: fileData.checksum || null,
        mimeType: fileData.mimeType || null,
      })
      .onConflictDoUpdate({
        target: vaultFiles.id,
        set: {
          name: fileData.name,
          size: fileData.size,
          sizeBytes: fileData.sizeBytes,
          retention: fileData.retention,
          retentionColor: fileData.retentionColor,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in upsertUserFile:', error);
    throw new Error('Failed to save vault file.', { cause: error });
  }
}

export async function deleteUserFiles(userId: number, fileIds: string[]) {
  try {
    if (!fileIds.length) return;
    await db
      .delete(vaultFiles)
      .where(
        and(
          eq(vaultFiles.userId, userId),
          inArray(vaultFiles.id, fileIds)
        )
      );
  } catch (error) {
    console.error('Database query failed in deleteUserFiles:', error);
    throw new Error('Failed to delete vault files.', { cause: error });
  }
}

export async function createAuditLog(userId: number, action: string, details: string) {
  try {
    const result = await db
      .insert(vaultAuditLogs)
      .values({
        userId,
        action,
        details,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in createAuditLog:', error);
    throw new Error('Failed to record audit log.', { cause: error });
  }
}

export async function getUserAuditLogs(userId: number) {
  try {
    return await db
      .select()
      .from(vaultAuditLogs)
      .where(eq(vaultAuditLogs.userId, userId))
      .orderBy(desc(vaultAuditLogs.createdAt))
      .limit(25);
  } catch (error) {
    console.error('Database query failed in getUserAuditLogs:', error);
    throw new Error('Failed to load audit logs.', { cause: error });
  }
}
