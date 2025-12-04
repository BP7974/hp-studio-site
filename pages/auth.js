import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    identifier: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload =
      mode === 'login'
        ? { identifier: form.identifier, password: form.password }
        : { name: form.name, email: form.email, phone: form.phone, password: form.password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '请求失败');
      }

      await refreshUser();
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="HP Studio 登录注册">
      <section className="auth-panel">
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            登录
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <label>
                姓名
                <input name="name" value={form.name} onChange={handleChange} required />
              </label>
              <label>
                邮箱
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </label>
              <label>
                手机号
                <input name="phone" value={form.phone} onChange={handleChange} required />
              </label>
            </>
          )}

          {mode === 'login' && (
            <label>
              邮箱或手机号
              <input name="identifier" value={form.identifier} onChange={handleChange} required />
            </label>
          )}

          <label>
            密码
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? '处理中…' : mode === 'login' ? '登录' : '注册'}
          </button>
          {error && <p className="muted">{error}</p>}
        </form>
      </section>
    </Layout>
  );
}
