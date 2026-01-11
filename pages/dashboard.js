import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import UploadForm from '../components/UploadForm';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/files/list')
      .then(res => res.json())
      .then(data => setFiles(data.files))
      .catch(err => setError('无法获取上传记录'));
  }, []);

  if (!user && loading) {
    return <Layout><p className="muted">加载中…</p></Layout>;
  }
  if (!user) {
    return null;
  }

  return (
    <Layout title="上传记录">
      <section className="panel">
        <h2>上传记录</h2>
        {error && <p className="muted">{error}</p>}
        {files.length === 0 ? (
          <p className="muted">暂无上传记录。</p>
        ) : (
          <div className="stack">
            {files.map((file) => (
              <div key={file.id} className="file-card">
                <div>
                  <h3>{file.title || file.original_name}</h3>
                  <p className="muted">{file.description ? file.description : '无描述'}</p>
                </div>
                <div className="file-meta">
                  <p>{file.created_at ? (() => { const d = new Date(file.created_at); d.setHours(d.getHours() + 8); return d.toLocaleString('zh-CN', { hour12: false }); })() : '未知时间'}</p>
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                  <span>{file.mimetype}</span>
                  <a className="ghost" href={file.downloadUrl} download>
                    下载 {file.original_name}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
// ...existing code...

  if (!user && loading) {
    return <Layout><p className="muted">加载中…</p></Layout>;
  }

  if (!user) {
    return null;
  }

  return (
    <Layout title="HP Studio 上传中心">
      <section className="grid two">
        <UploadForm onUploaded={loadFiles} />
        <div className="panel">
          <h3>HP Studio 工作室宣言</h3>
          <p>"黑白之间，展示真实" —— 每一次分享都是对 HP Studio 品牌的加冕。</p>
          <ul className="bullets">
            <li>使用真实姓名和联系方式，提升信任度。</li>
            <li>文件默认公开，团队成员彼此互通。</li>
            <li>支持最大 20MB 的常规创作文件。</li>
          </ul>
        </div>
      </section>

      <section className="panel">
        <h2>我的上传</h2>
        {error && <p className="muted">{error}</p>}
        {files.length === 0 ? (
          <p className="muted">暂时还没有上传记录。</p>) : (
          <div className="stack">
            {files.map((file) => (
              <div key={file.id} className="file-card">
                <div>
                  <h3>{file.title}</h3>
                  <p className="muted">{file.description || '无描述'}</p>
                </div>
                <div className="file-meta">
                  <p>{new Date(file.created_at).toLocaleString()}</p>
                  <a className="ghost" href={file.downloadUrl}>
                    下载 {file.original_name}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
