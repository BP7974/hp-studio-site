import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header header-center">
      <div className="header-left">
        <img src="/logo.jpg" alt="logo" style={{ width: 40, height: 40, borderRadius: '50%' }} />
      </div>
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
        .header-center {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }
        .header-left {
          flex: 1;
          display: flex;
          align-items: center;
        }
        .brand {
          flex: 2;
          text-align: center;
          font-size: 1.7rem;
          font-weight: bold;
          letter-spacing: 0.25rem;
          text-transform: uppercase;
          color: #fff;
        }
        .header-nav {
          flex: 1;
          display: flex;
          gap: 2.8rem !important;
          align-items: center;
          justify-content: flex-end;
        }
        .header-nav a, .header-nav button {
          font-size: 1.12rem;
        }
      `}</style>
    </header>
  );
}
