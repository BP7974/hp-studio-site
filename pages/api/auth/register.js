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

  if (!name || !password) {
    return res.status(400).json({ error: '请输入姓名和密码' });
  }

  const hasEmail = Boolean(email && String(email).trim());
  const hasPhone = Boolean(phone && String(phone).trim());

  if (!hasEmail && !hasPhone) {
    return res.status(400).json({ error: '请至少填写邮箱或手机号' });
  }

  if (hasEmail && !emailCode) {
    return res.status(400).json({ error: '请输入邮箱验证码' });
  }

  if (hasPhone && !phoneCode) {
    return res.status(400).json({ error: '请输入短信验证码' });
  }

  const emailTrimmed = hasEmail ? String(email).trim().toLowerCase() : null;
  const phoneTrimmed = hasPhone ? String(phone).trim() : null;

  try {
    let existing = null;
    const clauses = [];
    const params = [];
    if (hasEmail) {
      clauses.push('email = ?');
      params.push(emailTrimmed);
    }
    if (hasPhone) {
      clauses.push('phone = ?');
      params.push(phoneTrimmed);
    }

    if (clauses.length) {
      existing = db.prepare(`SELECT id FROM users WHERE ${clauses.join(' OR ')}`).get(...params);
    }

    if (existing) {
      return res.status(409).json({ error: 'Email or phone already registered' });
    }

    try {
      if (hasEmail) {
        verifyVerificationCode({
          targetType: 'email',
          targetValue: emailTrimmed,
          code: emailCode,
          purpose: EMAIL_PURPOSE
        });
      }

      if (hasPhone) {
        verifyVerificationCode({
          targetType: 'phone',
          targetValue: phoneTrimmed,
          code: phoneCode,
          purpose: PHONE_PURPOSE
        });
      }
    } catch (verificationError) {
      return res.status(400).json({ error: verificationError.message || '验证码校验失败' });
    }

    const passwordHash = await hashPassword(password);
    const result = db
      .prepare('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)')
      .run(name.trim(), emailTrimmed || null, phoneTrimmed || null, passwordHash);

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
