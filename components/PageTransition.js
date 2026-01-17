import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function PageTransition({ children }) {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState('');

  useEffect(() => {
    const handleRouteChangeStart = () => {
      const directions = ['left', 'right', 'up', 'down'];
      const randomDirection = directions[Math.floor(Math.random() * directions.length)];
      setDirection('');
      setIsAnimating(true);
      setTimeout(() => setDirection(randomDirection), 50);
    };

    const handleRouteChangeComplete = () => {
      setTimeout(() => {
        setIsAnimating(false);
        setDirection('');
      }, 150);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);

  return (
    <>
      {isAnimating && (
        <div className={`page-transition-overlay ${direction}`} />
      )}
      <div className="page-transition-content">
        {children}
      </div>
      <style jsx>{`
        .page-transition-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #181c27;
          z-index: 9999;
          pointer-events: none;
          transform: translate(0, 0);
          transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .page-transition-overlay.left {
          transform: translateX(-100%);
        }
        .page-transition-overlay.right {
          transform: translateX(100%);
        }
        .page-transition-overlay.up {
          transform: translateY(-100%);
        }
        .page-transition-overlay.down {
          transform: translateY(100%);
        }
        .page-transition-content {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </>
  );
}
