
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import FileCard from '../components/FileCard';

export default function ExplorePage() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/files/list')
      .then(res => res.json())
      .then(data => setFiles(data.files));
  }, []);

  return (
    <Layout title="HP Studio 公共作品">
      <section className="panel">
        <h2>公共作品墙</h2>
        <p className="muted">HP Studio 的每一位成员都在此处共享成果，你也可以即刻浏览或下载。</p>
      </section>
      {error && <p className="muted">{error}</p>}
      <div className="stack">
        {files.map((file) => (
          <FileCard key={file.id} file={file} />
        ))}
        {files.length === 0 && !error && <p className="muted">暂时还没有文件，快去上传第一个吧。</p>}
      </div>
    </Layout>
  );
}
