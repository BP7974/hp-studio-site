import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header header-center">
      <div className="brand">HP STUDIO</div>
      <nav className="header-nav">
        <Link href="/">主页</Link>
        <Link href="/explore">作品集</Link>
        <Link href="/upload">上传</Link>
        {user ? (
          <>
            <Link href="/dashboard">上传中心</Link>
            <button className="ghost" onClick={logout}>退出</button>
          </>
        ) : (
          <Link href="/auth">登录/注册</Link>
        )}
      </nav>
      <style jsx>{`
        .header {
          background: rgba(24, 28, 39, 0.8);
          backdrop-filter: blur(10px);
        }
        .header-center {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          padding: 0 2rem;
        }
        .brand {
          flex: 1;
          text-align: center;
          font-size: 1.7rem;
          font-weight: bold;
          letter-spacing: 0.25rem;
          text-transform: uppercase;
          color: #fff;
        }
        .header-nav {
          display: flex;
          gap: 2.8rem !important;
          align-items: center;
          justify-content: flex-end;
        }
        .header-nav a, .header-nav button {
          font-size: 1.12rem;
          color: #fff;
        }
      `}</style>
    </header>
  );
}
