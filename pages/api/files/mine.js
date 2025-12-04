const db = require('../../../lib/db');
const { requireUser } = require('../../../lib/auth');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const user = requireUser(req, res);
  if (!user) return;

  try {
    const stmt = db.prepare(`
      SELECT id, title, description, original_name, created_at
      FROM files
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `);
    const files = stmt.all(user.id).map((row) => ({
      ...row,
      downloadUrl: `/api/files/download/${row.id}`
    }));

    return res.status(200).json({ files });
  } catch (error) {
    console.error('My files error', error);
    return res.status(500).json({ error: 'Unable to load files' });
  }
};
