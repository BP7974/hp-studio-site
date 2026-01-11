import Header from '../components/Header';
import Link from 'next/link';
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
    <>
      <Header />
      <Layout title="HP Studio 公共作品">
        <main className="main">
          <section className="hero-video-full">
            <video
              className="bg-video-full"
              src="/videos/AdobeStock_157357375.mov"
              autoPlay
              loop
              muted
              playsInline
              poster="/logo.jpg"
              controls={false}
            />
            <div className="video-overlay-full" />
            <div className="hero-content-full">
              <img src="/logo.jpg" alt="HP STUDIO" className="hero-logo-full" />
              <h1>HP STUDIO 影视资源站</h1>
              <p>发现、分享、上传你的影视作品</p>
              <Link href="/explore" className="explore-btn-full">立即探索</Link>
            </div>
          </section>
        </main>
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
      <style jsx>{`
        .main {
          min-height: 100vh;
          background: #181c27;
          margin: 0;
          padding: 0;
        }
        .hero-video-full {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          z-index: 0;
          margin: 0;
          padding: 0;
        }
        .bg-video-full {
          position: absolute;
          top: 0;
          left: 0;
          width: 100vw;
          min-width: 100vw;
          max-width: 100vw;
          height: 100vh;
          min-height: 100vh;
          max-height: 100vh;
          object-fit: cover;
          z-index: 1;
          pointer-events: none;
          margin: 0;
          padding: 0;
        }
        .video-overlay-full {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          max-width: 100vw;
          height: 100vh;
          background: linear-gradient(120deg, rgba(24,28,39,0.7) 0%, rgba(24,28,39,0.3) 100%);
          z-index: 2;
        }
        .hero-content-full {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 3;
          text-align: center;
          color: #fff;
        }
        .hero-logo-full {
          width: 100px;
          border-radius: 16px;
          margin-bottom: 1.5rem;
        }
        .explore-btn-full {
          display: inline-block;
          margin-top: 2rem;
          background: #ffd700;
          color: #181c27;
          padding: 0.9rem 2.5rem;
          border-radius: 10px;
          font-size: 1.3rem;
          font-weight: bold;
          text-decoration: none;
          transition: background 0.2s;
        }
        .explore-btn-full:hover {
          background: #fff;
        }
      `}</style>
    </>
  );
}
