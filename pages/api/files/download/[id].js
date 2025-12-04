const fs = require('fs');
const path = require('path');
const db = require('../../../../lib/db');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing file id' });
  }

  const stmt = db.prepare('SELECT * FROM files WHERE id = ?');
  const file = stmt.get(id);

  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const filePath = path.join(process.cwd(), 'uploads', file.stored_name);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File missing on server' });
  }

  res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
};
