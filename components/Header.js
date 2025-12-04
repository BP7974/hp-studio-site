import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="brand">hp studio</div>
      <nav>
        <Link href="/">主页</Link>
        <Link href="/explore">作品集</Link>
        {user ? (
          <>
            <Link href="/dashboard">上传中心</Link>
            <button className="ghost" onClick={logout}>退出</button>
          </>
        ) : (
          <Link href="/auth">登录/注册</Link>
        )}
      </nav>
    </header>
  );
}
