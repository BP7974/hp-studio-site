import Database from 'better-sqlite3';
import path from 'path';

export default function handler(req, res) {
  const dbPath = path.join(process.cwd(), 'data', 'filemeta.db');
  const db = new Database(dbPath);
  const rows = db.prepare('SELECT * FROM files ORDER BY uploadtime DESC').all();
  db.close();
  // 适配前端 FileCard 组件字段
  const files = rows.map(row => ({
    title: row.originalname,
    created_at: row.uploadtime,
    downloadUrl: `/api/files/download?filename=${encodeURIComponent(row.filename)}`,
    size: row.size,
    mimetype: row.mimetype,
    original_name: row.originalname,
    // 其他需要的字段
  }));
  res.status(200).json({ files });
}