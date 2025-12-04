const fs = require('fs');
const path = require('path');
const formidable = require('formidable');
const { nanoid } = require('nanoid');
const db = require('../../../lib/db');
const { requireUser } = require('../../../lib/auth');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const user = requireUser(req, res);
  if (!user) return;

  const form = formidable({
    multiples: false,
    maxFileSize: 20 * 1024 * 1024,
    keepExtensions: true
  });

  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const uploaded = files.file;
    if (!uploaded) {
      return res.status(400).json({ error: 'File is required' });
    }

    const fileData = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    const title = (fields.title || fileData.originalFilename || 'Untitled').toString();
    const description = (fields.description || '').toString();

    const extension = path.extname(fileData.originalFilename || '');
    const storedName = `${Date.now()}-${nanoid(6)}${extension}`;
    const destPath = path.join(uploadDir, storedName);

    await fs.promises.rename(fileData.filepath, destPath);

    const stmt = db.prepare(`
      INSERT INTO files (
        id, user_id, title, description, original_name, stored_name, mime_type, size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const fileId = nanoid(12);
    stmt.run(
      fileId,
      user.id,
      title.trim(),
      description.trim(),
      fileData.originalFilename || storedName,
      storedName,
      fileData.mimetype,
      fileData.size || fs.statSync(destPath).size
    );

    return res.status(201).json({
      file: {
        id: fileId,
        title: title.trim(),
        description: description.trim(),
        downloadUrl: `/api/files/download/${fileId}`
      }
    });
  } catch (error) {
    console.error('Upload error', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
};

module.exports.config = {
  api: {
    bodyParser: false
  }
};
