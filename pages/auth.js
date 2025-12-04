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

const MODE_VALUES = Object.values(MODES);

const normalizeMode = (value) => (MODE_VALUES.includes(value) ? value : MODES.LOGIN);

const pickModeFromQuery = (rawMode) => {
  if (!rawMode) {
    return null;
  }
  const candidate = Array.isArray(rawMode) ? rawMode[0] : rawMode;
  return MODE_VALUES.includes(candidate) ? candidate : null;
};

const parseJsonResponse = async (res) => {
  if (typeof res.clone === 'function') {
    try {
      return await res.clone().json();
    } catch (err) {
      let raw = '';
      try {
        raw = await res.text();
      } catch (_) {
        // ignore secondary failure
      }
      const snippet = raw ? raw.slice(0, 200).replace(/\s+/g, ' ').trim() : err.message;
      throw new Error(`服务器响应异常（${res.status}）：${snippet}`);
    }
  }

  const text = await res.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    const snippet = text.slice(0, 200).replace(/\s+/g, ' ').trim();
    throw new Error(`服务器响应异常（${res.status}）：${snippet || err.message}`);
  }
};

export default function AuthPage({ initialMode = MODES.LOGIN }) {
  const [mode, setMode] = useState(() => normalizeMode(initialMode));
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    identifier: '',
    emailCode: '',
    phoneCode: ''
  });
  const [forgotForm, setForgotForm] = useState({
    email: '',
    phone: '',
    emailCode: '',
    phoneCode: ''
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
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [sendingPhoneCode, setSendingPhoneCode] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);
  const [phoneTimer, setPhoneTimer] = useState(0);
  const [sendingForgotEmailCode, setSendingForgotEmailCode] = useState(false);
  const [sendingForgotPhoneCode, setSendingForgotPhoneCode] = useState(false);
  const [forgotEmailTimer, setForgotEmailTimer] = useState(0);
  const [forgotPhoneTimer, setForgotPhoneTimer] = useState(0);
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

  const handleForgotChange = (e) => {
    setForgotForm({ ...forgotForm, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (!emailTimer) {
      return undefined;
    }
    const id = setInterval(() => {
      setEmailTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [emailTimer]);

  useEffect(() => {
    if (!phoneTimer) {
      return undefined;
    }
    const id = setInterval(() => {
      setPhoneTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [phoneTimer]);

  useEffect(() => {
    if (!forgotEmailTimer) {
      return undefined;
    }
    const id = setInterval(() => {
      setForgotEmailTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [forgotEmailTimer]);

  useEffect(() => {
    if (!forgotPhoneTimer) {
      return undefined;
    }
    const id = setInterval(() => {
      setForgotPhoneTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [forgotPhoneTimer]);

  const requestEmailCode = async () => {
    if (!form.email) {
      setError('请先填写邮箱');
      return;
    }
    setSendingEmailCode(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auth/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        const err = new Error(data.error || '验证码发送失败');
        if (data.retryAfter) {
          err.retryAfter = data.retryAfter;
        }
        throw err;
      }
      setMessage(data.previewCode ? `${data.message}（测试验证码：${data.previewCode}）` : data.message || '验证码已发送');
      if (data.previewCode) {
        setForm((prev) => ({ ...prev, emailCode: prev.emailCode || data.previewCode }));
      }
      const cooldown = data.cooldown || 60;
      setEmailTimer(cooldown);
    } catch (err) {
      setError(err.message);
      if (err.retryAfter) {
        setEmailTimer(err.retryAfter);
      }
    } finally {
      setSendingEmailCode(false);
    }
  };

  const requestPhoneCode = async () => {
    if (!form.phone) {
      setError('请先填写手机号');
      return;
    }
    setSendingPhoneCode(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auth/send-phone-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone })
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        const err = new Error(data.error || '短信发送失败');
        if (data.retryAfter) {
          err.retryAfter = data.retryAfter;
        }
        throw err;
      }
      setMessage(data.previewCode ? `${data.message}（测试验证码：${data.previewCode}）` : data.message || '验证码已发送');
      if (data.previewCode) {
        setForm((prev) => ({ ...prev, phoneCode: prev.phoneCode || data.previewCode }));
      }
      const cooldown = data.cooldown || 60;
      setPhoneTimer(cooldown);
    } catch (err) {
      setError(err.message);
      if (err.retryAfter) {
        setPhoneTimer(err.retryAfter);
      }
    } finally {
      setSendingPhoneCode(false);
    }
  };

  const requestForgotEmailCode = async () => {
    if (!forgotForm.email || !forgotForm.phone) {
      setError('请先填写邮箱和手机号');
      return;
    }
    setSendingForgotEmailCode(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auth/send-reset-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotForm.email, phone: forgotForm.phone })
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        const err = new Error(data.error || '验证码发送失败');
        if (data.retryAfter) {
          err.retryAfter = data.retryAfter;
        }
        throw err;
      }
      setMessage(data.previewCode ? `${data.message}（测试验证码：${data.previewCode}）` : data.message || '验证码已发送');
      if (data.previewCode) {
        setForgotForm((prev) => ({ ...prev, emailCode: prev.emailCode || data.previewCode }));
      }
      setForgotEmailTimer(data.cooldown || 60);
    } catch (err) {
      setError(err.message);
      if (err.retryAfter) {
        setForgotEmailTimer(err.retryAfter);
      }
    } finally {
      setSendingForgotEmailCode(false);
    }
  };

  const requestForgotPhoneCode = async () => {
    if (!forgotForm.email || !forgotForm.phone) {
      setError('请先填写邮箱和手机号');
      return;
    }
    setSendingForgotPhoneCode(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/auth/send-reset-phone-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotForm.email, phone: forgotForm.phone })
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) {
        const err = new Error(data.error || '短信发送失败');
        if (data.retryAfter) {
          err.retryAfter = data.retryAfter;
        }
        throw err;
      }
      setMessage(data.previewCode ? `${data.message}（测试验证码：${data.previewCode}）` : data.message || '验证码已发送');
      if (data.previewCode) {
        setForgotForm((prev) => ({ ...prev, phoneCode: prev.phoneCode || data.previewCode }));
      }
      setForgotPhoneTimer(data.cooldown || 60);
    } catch (err) {
      setError(err.message);
      if (err.retryAfter) {
        setForgotPhoneTimer(err.retryAfter);
      }
    } finally {
      setSendingForgotPhoneCode(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setMessage('');
    setLoading(false);
    if (nextMode === MODES.FORGOT) {
      setForgotForm({ email: '', phone: '', emailCode: '', phoneCode: '' });
      setForgotEmailTimer(0);
      setForgotPhoneTimer(0);
    }
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
        : {
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            emailCode: form.emailCode,
            phoneCode: form.phoneCode
          };

    if (mode === MODES.REGISTER) {
      const emailValue = form.email.trim();
      const phoneValue = form.phone.trim();
      const hasEmail = Boolean(emailValue);
      const hasPhone = Boolean(phoneValue);

      if (!hasEmail && !hasPhone) {
        setError('请至少填写邮箱或手机号');
        setLoading(false);
        return;
      }

      if (hasEmail && !form.emailCode.trim()) {
        setError('请填写邮箱验证码');
        setLoading(false);
        return;
      }

      if (hasPhone && !form.phoneCode.trim()) {
        setError('请填写短信验证码');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await parseJsonResponse(res);
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

    if (!forgotForm.email || !forgotForm.phone || !forgotForm.emailCode || !forgotForm.phoneCode) {
      setError('请完整填写邮箱、手机号及验证码');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotForm.email,
          phone: forgotForm.phone,
          emailCode: forgotForm.emailCode,
          phoneCode: forgotForm.phoneCode
        })
      });

      const data = await parseJsonResponse(res);
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

      const data = await parseJsonResponse(res);
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
                <p className="helper-text">
                  至少完成一种方式的验证即可：邮箱或手机号。未填写的项可以稍后在个人中心绑定。
                </p>
                <label>
                  姓名
                  <input name="name" value={form.name} onChange={handleChange} required />
                </label>
                <label>
                  邮箱
                  <input type="email" name="email" value={form.email} onChange={handleChange} />
                </label>
                <label>
                  邮箱验证码
                  <div className="code-input">
                    <input name="emailCode" value={form.emailCode} onChange={handleChange} />
                    <button
                      type="button"
                      className="ghost"
                      onClick={requestEmailCode}
                      disabled={sendingEmailCode || emailTimer > 0 || !form.email}
                    >
                      {sendingEmailCode ? '发送中…' : emailTimer > 0 ? `重发(${emailTimer}s)` : '获取验证码'}
                    </button>
                  </div>
                  <p className="helper-text">先填写邮箱，再点击“获取验证码”完成验证。</p>
                </label>
                <label>
                  手机号
                  <input name="phone" value={form.phone} onChange={handleChange} />
                </label>
                <label>
                  手机验证码
                  <div className="code-input">
                    <input name="phoneCode" value={form.phoneCode} onChange={handleChange} />
                    <button
                      type="button"
                      className="ghost"
                      onClick={requestPhoneCode}
                      disabled={sendingPhoneCode || phoneTimer > 0 || !form.phone}
                    >
                      {sendingPhoneCode ? '发送中…' : phoneTimer > 0 ? `重发(${phoneTimer}s)` : '获取验证码'}
                    </button>
                  </div>
                  <p className="helper-text">支持含区号的数字，如 +86，先点击“获取验证码”。</p>
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
                name="email"
                value={forgotForm.email}
                onChange={handleForgotChange}
                required
              />
            </label>

            <label>
              邮箱验证码
              <div className="code-input">
                <input
                  name="emailCode"
                  value={forgotForm.emailCode}
                  onChange={handleForgotChange}
                  required
                />
                <button
                  type="button"
                  className="ghost"
                  onClick={requestForgotEmailCode}
                  disabled={
                    sendingForgotEmailCode ||
                    forgotEmailTimer > 0 ||
                    !forgotForm.email ||
                    !forgotForm.phone
                  }
                >
                  {sendingForgotEmailCode
                    ? '发送中…'
                    : forgotEmailTimer > 0
                      ? `重发(${forgotEmailTimer}s)`
                      : '获取验证码'}
                </button>
              </div>
            </label>

            <label>
              注册手机号
              <input
                name="phone"
                value={forgotForm.phone}
                onChange={handleForgotChange}
                required
              />
            </label>

            <label>
              手机验证码
              <div className="code-input">
                <input
                  name="phoneCode"
                  value={forgotForm.phoneCode}
                  onChange={handleForgotChange}
                  required
                />
                <button
                  type="button"
                  className="ghost"
                  onClick={requestForgotPhoneCode}
                  disabled={
                    sendingForgotPhoneCode ||
                    forgotPhoneTimer > 0 ||
                    !forgotForm.email ||
                    !forgotForm.phone
                  }
                >
                  {sendingForgotPhoneCode
                    ? '发送中…'
                    : forgotPhoneTimer > 0
                      ? `重发(${forgotPhoneTimer}s)`
                      : '获取验证码'}
                </button>
              </div>
            </label>

            <button type="submit" disabled={loading}>
              {loading ? '发送中…' : '发送重置链接'}
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => switchMode(MODES.LOGIN)}
            >
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

export async function getServerSideProps({ query }) {
  const initialMode = pickModeFromQuery(query?.mode) || MODES.LOGIN;

  return {
    props: {
      initialMode
    }
  };
}
