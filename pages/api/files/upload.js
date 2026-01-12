import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024 * 1024; // 10 GiB
const MAX_UPLOAD_BYTES = (() => {
  const fromEnv = Number(process.env.MAX_UPLOAD_BYTES);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_MAX_UPLOAD_BYTES;
})();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({
    multiples: false,
    maxFileSize: MAX_UPLOAD_BYTES,
    keepExtensions: true,
    allowEmptyFiles: true,
    minFileSize: 0,
    uploadDir,
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
    if (!fileData.filepath) {
      // 0字节文件未生成物理文件
      return res.status(200).json({
        file: {
          originalName: fileData.originalFilename,
          storedName: null,
          size: fileData.size || 0,
          mimetype: fileData.mimetype,
          url: null,
          note: '0字节文件未生成物理文件'
        }
      });
    }


    // 保留原始文件名，若重名自动加后缀避免覆盖
    let storedName = fileData.originalFilename;
    let destPath = path.join(uploadDir, storedName);
    let count = 1;
    const ext = path.extname(storedName);
    const base = path.basename(storedName, ext);
    while (fs.existsSync(destPath)) {
      storedName = `${base}(${count})${ext}`;
      destPath = path.join(uploadDir, storedName);
      count++;
    }
    await fs.promises.rename(fileData.filepath, destPath);

    // 写入数据库
    try {
      const Database = (await import('better-sqlite3')).default;
      const dbPath = path.join(process.cwd(), 'data', 'filemeta.db');
      const db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.prepare(`CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT,
        originalname TEXT,
        size INTEGER,
        mimetype TEXT,
        description TEXT,
        uploadtime DATETIME DEFAULT CURRENT_TIMESTAMP
      )`).run();
      db.prepare('INSERT INTO files (filename, originalname, size, mimetype, description) VALUES (?, ?, ?, ?, ?)')
        .run(
          storedName,
          fileData.originalFilename,
          fileData.size,
          fileData.mimetype,
          fields.description || ''
        );
      db.close();
    } catch (e) {
      console.error('DB error', e);
      // 不影响主流程
    }

    return res.status(201).json({
      file: {
        originalName: fileData.originalFilename,
        storedName,
        size: fileData.size,
        mimetype: fileData.mimetype,
        url: `/uploads/${storedName}`,
      }
    });
  } catch (error) {
    console.error('Upload error', error);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
}

console.log('process.cwd():', process.cwd());
