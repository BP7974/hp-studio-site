
import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
  let { filename } = req.query;
  if (!filename) {
    res.status(400).json({ error: 'Missing filename' });
    return;
  }
  // 兼容中文/特殊字符
  try {
    filename = decodeURIComponent(filename);
  } catch (e) {
    // 忽略解码错误
  }
  // 只允许单层文件名，防止路径穿越
  if (filename.includes('/') || filename.includes('\\')) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const filePath = path.join(uploadsDir, filename);
  // 兼容 Linux/Windows 路径
  if (!fs.existsSync(filePath)) {
    // 输出调试信息
    console.log('[Download API] File not found:', filePath);
    res.status(404).json({ error: 'File not found' });
    return;
  }
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.setHeader('Content-Type', 'application/octet-stream');
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
}
