
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import Header from '../components/Header';
import PageTransition from '../components/PageTransition';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const videoRef = useRef(null);
  const router = useRouter();
  const [currentVideo, setCurrentVideo] = useState(0);
  const videos = [
    '/videos/AdobeStock_226440999.mov',
    '/videos/AdobeStock_474016262.mov'
  ];

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.src = videos[currentVideo];
      video.play().catch(err => console.log('Autoplay failed:', err));
      
      const handleVideoEnd = () => {
        setCurrentVideo(prev => (prev + 1) % videos.length);
      };

      video.addEventListener('ended', handleVideoEnd);

      return () => {
        video.removeEventListener('ended', handleVideoEnd);
      };
    }
  }, [currentVideo]);

  return (
    <>
      <video
        ref={videoRef}
        className="global-background-video"
        autoPlay
        muted
        playsInline
      />
      <AuthProvider>
        {router.pathname !== '/' && <Header />}
        <PageTransition>
          <Component {...pageProps} />
        </PageTransition>
      </AuthProvider>
      <style jsx global>{`
        .global-background-video {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          object-fit: cover;
          z-index: -1;
          pointer-events: none;
        }
      `}</style>
    </>
  );
}

export default MyApp;
