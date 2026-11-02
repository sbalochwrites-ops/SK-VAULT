import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  getUserFiles,
  upsertUserFile,
  deleteUserFiles,
  createAuditLog,
  getUserAuditLogs,
} from './src/db/users.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Sync user and fetch vault files
  app.get('/api/vault/files', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || 'user@skvault.io';
      const userRecord = await getOrCreateUser(uid, email);
      const files = await getUserFiles(userRecord.id);
      res.json({ user: userRecord, files });
    } catch (error: any) {
      console.error('Failed to fetch vault files:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch vault files' });
    }
  });

  // Upsert a vault file
  app.post('/api/vault/files', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || 'user@skvault.io';
      const userRecord = await getOrCreateUser(uid, email);
      const file = await upsertUserFile(userRecord.id, req.body);
      await createAuditLog(userRecord.id, 'FILE_PRESERVED', `Preserved file ${req.body.name}`);
      res.json({ file });
    } catch (error: any) {
      console.error('Failed to save vault file:', error);
      res.status(500).json({ error: error.message || 'Failed to save vault file' });
    }
  });

  // Bulk delete vault files
  app.delete('/api/vault/files', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || 'user@skvault.io';
      const userRecord = await getOrCreateUser(uid, email);
      const { fileIds } = req.body;
      if (Array.isArray(fileIds) && fileIds.length > 0) {
        await deleteUserFiles(userRecord.id, fileIds);
        await createAuditLog(
          userRecord.id,
          'BULK_DELETE',
          `Deleted ${fileIds.length} item(s) from vault`
        );
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to delete vault files:', error);
      res.status(500).json({ error: error.message || 'Failed to delete vault files' });
    }
  });

  // Fetch audit logs
  app.get('/api/vault/audit', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || 'user@skvault.io';
      const userRecord = await getOrCreateUser(uid, email);
      const logs = await getUserAuditLogs(userRecord.id);
      res.json({ logs });
    } catch (error: any) {
      console.error('Failed to load audit logs:', error);
      res.status(500).json({ error: error.message || 'Failed to load audit logs' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
