import { useState } from 'react';

export default function UploadForm({ onUploaded }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus('请先选择文件');
      return;
    }
    setLoading(true);
    setStatus('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', file);

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '上传失败');
      }
      setTitle('');
      setDescription('');
      setFile(null);
      setStatus('上传成功');
      onUploaded?.();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h3>上传新文件</h3>
      <label>
        标题
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="项目名称" required />
      </label>
      <label>
        描述
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="添加一句话介绍" />
      </label>
      <label className="file-input">
        <span>选择文件</span>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {file && <small>{file.name}</small>}
      </label>
      <button type="submit" disabled={loading}>
        {loading ? '上传中…' : '提交'}
      </button>
      {status && <p className="muted">{status}</p>}
    </form>
  );
}
