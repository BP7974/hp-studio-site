import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const MODES = {
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT: 'forgot',
  RESET: 'reset'
};

export default function AuthPage() {
  const [mode, setMode] = useState(MODES.LOGIN);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    identifier: ''
  });
  const [resetForm, setResetForm] = useState({
    email: '',
    token: '',
    password: '',
    confirm: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const tokenFromQuery = router.query.token || router.query.resetToken;
    if (tokenFromQuery) {
      setMode(MODES.RESET);
      setResetForm((prev) => ({ ...prev, token: tokenFromQuery }));
      setMessage('请输入新密码以完成重置');
      router.replace('/auth', undefined, { shallow: true });
    }
  }, [router, router.query.token, router.query.resetToken]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setMessage('');
    setLoading(false);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const endpoint = mode === MODES.LOGIN ? '/api/auth/login' : '/api/auth/register';
    const payload =
      mode === MODES.LOGIN
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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetForm.email })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '重置请求失败');
      }

      setMessage(data.message || '重置邮件已发送');
      if (data.resetToken) {
        setResetForm((prev) => ({ ...prev, token: data.resetToken }));
        setMode(MODES.RESET);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!resetForm.token) {
      setError('请输入重置令牌');
      setLoading(false);
      return;
    }

    if (resetForm.password.length < 8) {
      setError('新密码至少 8 位');
      setLoading(false);
      return;
    }

    if (resetForm.password !== resetForm.confirm) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetForm.token, password: resetForm.password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '重置失败');
      }

      setMessage(data.message || '密码已更新');
      setResetForm({ email: '', token: '', password: '', confirm: '' });
      setForm((prev) => ({ ...prev, password: '', identifier: prev.identifier || '' }));
      setMode(MODES.LOGIN);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderTabs = () => (
    <div className="auth-tabs">
      <button className={mode === MODES.LOGIN ? 'active' : ''} onClick={() => switchMode(MODES.LOGIN)}>
        登录
      </button>
      <button className={mode === MODES.REGISTER ? 'active' : ''} onClick={() => switchMode(MODES.REGISTER)}>
        注册
      </button>
      <button className={mode === MODES.FORGOT ? 'active' : ''} onClick={() => switchMode(MODES.FORGOT)}>
        找回密码
      </button>
    </div>
  );

  return (
    <Layout title="HP Studio 登录注册">
      <section className="auth-panel">
        {renderTabs()}

        {(mode === MODES.LOGIN || mode === MODES.REGISTER) && (
          <form onSubmit={handleAuthSubmit}>
            {mode === MODES.REGISTER && (
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

            {mode === MODES.LOGIN && (
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
              {loading ? '处理中…' : mode === MODES.LOGIN ? '登录' : '注册'}
            </button>

            {mode === MODES.LOGIN && (
              <button type="button" className="link-button" onClick={() => switchMode(MODES.FORGOT)}>
                忘记密码？
              </button>
            )}
          </form>
        )}

        {mode === MODES.FORGOT && (
          <form onSubmit={handleForgotSubmit}>
            <label>
              注册邮箱
              <input
                type="email"
                name="resetEmail"
                value={resetForm.email}
                onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? '发送中…' : '发送重置链接'}
            </button>
            <button type="button" className="link-button" onClick={() => switchMode(MODES.LOGIN)}>
              返回登录
            </button>
          </form>
        )}

        {mode === MODES.RESET && (
          <form onSubmit={handleResetSubmit}>
            <label>
              重置令牌
              <input
                name="resetToken"
                value={resetForm.token}
                onChange={(e) => setResetForm({ ...resetForm, token: e.target.value })}
                required
              />
            </label>
            <label>
              新密码
              <input
                type="password"
                name="newPassword"
                value={resetForm.password}
                onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                required
              />
            </label>
            <label>
              确认新密码
              <input
                type="password"
                name="confirmPassword"
                value={resetForm.confirm}
                onChange={(e) => setResetForm({ ...resetForm, confirm: e.target.value })}
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? '重置中…' : '更新密码'}
            </button>
            <button type="button" className="link-button" onClick={() => switchMode(MODES.LOGIN)}>
              返回登录
            </button>
          </form>
        )}

        {(error || message) && <p className={`muted ${error ? 'error' : 'notice'}`}>{error || message}</p>}
      </section>
    </Layout>
  );
}
