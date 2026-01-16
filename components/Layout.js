

import Head from 'next/head';
import Header from './Header';
import { useRouter } from 'next/router';
import React, { useRef, useState, useLayoutEffect } from 'react';

export default function Layout({ title = 'HP Studio', description = 'HP Studio file showcase', children }) {
  const router = useRouter();
  const isHome = router.pathname === '/';
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    if (isHome) {
      setHeaderHeight(0);
      return;
    }
    function updateHeaderHeight() {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    }
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, [isHome]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="msvalidate.01" content="53ECB99C7381894125564A7220946484" />
      </Head>
      <div className="app-shell">
        {!isHome && (
          <header ref={headerRef} className="header-fixed header-large">
            <Header />
          </header>
        )}
        <main className={isHome ? "main-with-header home-main" : "main-with-header"} style={{ paddingTop: isHome ? 0 : headerHeight }}>{children}</main>
        <footer className="footer">© {new Date().getFullYear()} HP Studio · Monochrome craftsmanship</footer>
      </div>
      <style jsx>{`
        .app-shell {
          position: relative;
          z-index: 10;
        }
        .main-with-header, .home-main {
          background: transparent !important;
        }
        .header-fixed {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          z-index: 100;
          margin: 0 !important;
          padding: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          background: rgba(24,28,39,0.7);
        }
        .header-large {
          min-height: 80px;
          background: rgba(24,28,39,0.55) !important;
          backdrop-filter: blur(10px);
        }
        .main-with-header {
          min-height: 100vh;
          margin: 0;
          padding: 0;
          background: transparent;
        }
        .home-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
        }
        .home-main > * {
          margin-top: 2.5rem !important;
        }
        .home-main > *:not(:first-child) {
          margin-top: 4.5rem !important;
        }
      `}</style>
    </>
  );
}
