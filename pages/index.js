
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function ExplorePage() {
  const router = useRouter();
  const [hoveredLink, setHoveredLink] = useState(null);

  return (
    <>
      <Head>
        <title>HP Studio</title>
        <meta name="description" content="HP Studio - 发现、分享、上传你的影视作品" />
      </Head>
      {router.pathname === '/' && (
        <section className="hero-video-full">
          <div className="hero-content-full">
            <img src="/logo.jpg" alt="HP STUDIO" className="hero-logo-full" />
            <h1>HP STUDIO 影视资源站</h1>
            <p>发现、分享、上传你的影视作品</p>
            <div className="main-links-full">
              <Link 
                href="/explore" 
                className="main-link"
                style={{ color: hoveredLink === 'explore1' ? '#ffd700' : '#fff' }}
                onMouseEnter={() => setHoveredLink('explore1')}
                onMouseLeave={() => setHoveredLink(null)}
              >
                立即探索
              </Link>
              <Link 
                href="/explore" 
                className="main-link"
                style={{ color: hoveredLink === 'explore2' ? '#ffd700' : '#fff' }}
                onMouseEnter={() => setHoveredLink('explore2')}
                onMouseLeave={() => setHoveredLink(null)}
              >
                作品集
              </Link>
              <Link 
                href="/upload" 
                className="main-link"
                style={{ color: hoveredLink === 'upload' ? '#ffd700' : '#fff' }}
                onMouseEnter={() => setHoveredLink('upload')}
                onMouseLeave={() => setHoveredLink(null)}
              >
                上传
              </Link>
              <Link 
                href="/dashboard" 
                className="main-link"
                style={{ color: hoveredLink === 'dashboard' ? '#ffd700' : '#fff' }}
                onMouseEnter={() => setHoveredLink('dashboard')}
                onMouseLeave={() => setHoveredLink(null)}
              >
                上传中心
              </Link>
            </div>
          </div>
        </section>
      )}
      <style jsx>{`
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
          color: #fff !important;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          text-decoration: none !important;
          transition: color 0.2s;
        }
        .main-link:hover {
          color: #ffd700 !important;
        }
        .main-link:visited {
          color: #fff !important;
        }
      `}</style>
    </>
  );
}
