const db = require('../../../lib/db');
const {
  hashPassword,
  signToken,
  setAuthCookie,
  serializeUser
} = require('../../../lib/auth');
const { verifyVerificationCode } = require('../../../lib/verification');

const EMAIL_PURPOSE = 'register-email';
const PHONE_PURPOSE = 'register-phone';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, phone, password, emailCode, phoneCode } = req.body || {};

  if (!name || !email || !phone || !password || !emailCode || !phoneCode) {
    return res.status(400).json({ error: '请输入完整信息及验证码' });
  }

  const emailTrimmed = String(email).trim().toLowerCase();
  const phoneTrimmed = String(phone).trim();

  try {
    const existing = db
      .prepare('SELECT id FROM users WHERE email = ? OR phone = ?')
      .get(emailTrimmed, phoneTrimmed);

    if (existing) {
      return res.status(409).json({ error: 'Email or phone already registered' });
    }

    try {
      verifyVerificationCode({
        targetType: 'email',
        targetValue: emailTrimmed,
        code: emailCode,
        purpose: EMAIL_PURPOSE
      });

      verifyVerificationCode({
        targetType: 'phone',
        targetValue: phoneTrimmed,
        code: phoneCode,
        purpose: PHONE_PURPOSE
      });
    } catch (verificationError) {
      return res.status(400).json({ error: verificationError.message || '验证码校验失败' });
    }

    const passwordHash = await hashPassword(password);
    const result = db
      .prepare('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)')
      .run(name.trim(), emailTrimmed, phoneTrimmed, passwordHash);

    const user = serializeUser({
      id: result.lastInsertRowid,
      name: name.trim(),
      email: emailTrimmed,
      phone: phoneTrimmed,
      created_at: new Date().toISOString()
    });

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({ user });
  } catch (error) {
    console.error('Register error', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
};
