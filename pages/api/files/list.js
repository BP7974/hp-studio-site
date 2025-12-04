const db = require('../../../lib/db');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const stmt = db.prepare(`
      SELECT files.id, files.title, files.description, files.original_name,
             files.mime_type, files.size, files.created_at,
             users.name as uploader
      FROM files
      JOIN users ON users.id = files.user_id
      ORDER BY files.created_at DESC
      LIMIT 200
    `);
    const rows = stmt.all();

    const files = rows.map((row) => ({
      ...row,
      downloadUrl: `/api/files/download/${row.id}`
    }));

    return res.status(200).json({ files });
  } catch (error) {
    console.error('List files error', error);
    return res.status(500).json({ error: 'Unable to load files' });
  }
};
