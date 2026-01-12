
import Header from '../components/Header';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import FileCard from '../components/FileCard';
import { useRouter } from 'next/router';

export default function ExplorePage() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [hideHero, setHideHero] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingNav, setPendingNav] = useState(null);
  const heroRef = useRef();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/files/list')
      .then(res => res.json())
      .then(data => setFiles(data.files));
    // 预加载 explore 页面
    router.prefetch && router.prefetch('/explore');
  }, []);

  // 处理动画结束后跳转
  const [hasNavigated, setHasNavigated] = useState(false);
  const [fullyHide, setFullyHide] = useState(false);
  const handleTransitionEnd = () => {
    if (pendingNav && !hasNavigated) {
      setIsTransitioning(false);
      setHasNavigated(true);
      setFullyHide(true); // 先隐藏内容
      setTimeout(() => {
        router.push(pendingNav);
        setHideHero(false);
        setHasNavigated(false);
        setPendingNav(null);
        setFullyHide(false);
      }, 120); // 延迟后再跳转
    }
  };

  return (
    <>
      <Header />
      {/* 只在首页渲染 hero 区，切换页面时彻底卸载 */}
      <Layout title="HP Studio 公共作品">
        <main className="main">
          {router.pathname === '/' && (
            <section
              ref={heroRef}
              className={`hero-video-full${hideHero ? ' hero-video-hide' : ''}${isTransitioning ? ' hero-video-transitioning' : ''}`}
              onTransitionEnd={handleTransitionEnd}
            >
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
              <div className={`hero-content-full${fullyHide ? ' fully-hide' : ''}`}>
                <img src="/logo.jpg" alt="HP STUDIO" className="hero-logo-full" />
                <h1>HP STUDIO 影视资源站</h1>
                <p>发现、分享、上传你的影视作品</p>
                <div className="main-links-full">
                  <span
                    className="main-link"
                    onClick={() => {
                      if (isTransitioning) return;
                      setIsTransitioning(true);
                      setHideHero(true);
                      setPendingNav('/explore');
                    }}
                  >
                    立即探索
                  </span>
                  <span
                    className="main-link"
                    onClick={() => {
                      if (isTransitioning) return;
                      setIsTransitioning(true);
                      setHideHero(true);
                      setPendingNav('/explore');
                    }}
                  >
                    作品集
                  </span>
                  <span
                    className="main-link"
                    onClick={() => {
                      if (isTransitioning) return;
                      setIsTransitioning(true);
                      setHideHero(true);
                      setPendingNav('/upload');
                    }}
                  >
                    上传
                  </span>
                  <span
                    className="main-link"
                    onClick={() => {
                      if (isTransitioning) return;
                      setIsTransitioning(true);
                      setHideHero(true);
                      setPendingNav('/dashboard');
                    }}
                  >
                    上传中心
                  </span>
                </div>
              </div>
            </section>
          )}
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
          transition: transform 1s cubic-bezier(0.77,0,0.175,1), opacity 0.7s cubic-bezier(0.77,0,0.175,1);
          will-change: transform, opacity;
        }
        .hero-video-hide {
          transform: translateY(-100vh) scale(0.98);
          opacity: 0;
          pointer-events: none;
        }
        .hero-video-transitioning .hero-content-full {
          opacity: 0;
          transition: opacity 0.4s cubic-bezier(0.77,0,0.175,1);
        }
        .hero-content-full {
          opacity: 1;
          transition: opacity 0.4s cubic-bezier(0.77,0,0.175,1);
        }
        .hero-content-full.fully-hide {
          opacity: 0;
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
        .main-links-full {
          margin-top: 2.5rem;
          display: flex;
          justify-content: center;
          gap: 2.5rem;
        }
        .main-link {
          color: #fff;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.2s;
        }
        .main-link:hover {
          color: #ffd700;
        }
      `}</style>
    </>
  );
}
