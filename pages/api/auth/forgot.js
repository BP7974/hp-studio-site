const crypto = require('crypto');
const db = require('../../../lib/db');
const { sendPasswordResetEmail, isSmtpConfigured } = require('../../../lib/mailer');
const { verifyVerificationCode } = require('../../../lib/verification');

const RESET_TOKEN_TTL_MINUTES = parseInt(process.env.PASSWORD_RESET_TTL_MINUTES || '60', 10);
const RESET_EMAIL_PURPOSE = 'reset-email';
const RESET_PHONE_PURPOSE = 'reset-phone';

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function buildBaseUrl(req) {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, '');
  }
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`.replace(/\/$/, '');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, phone, emailCode, phoneCode } = req.body || {};
  if (!email || !phone || !emailCode || !phoneCode) {
    return res.status(400).json({ error: '请填写邮箱、手机号及验证码' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim();
  let resetToken;

  try {
    const userStmt = db.prepare('SELECT id, email, name, phone FROM users WHERE LOWER(email) = ?');
    const user = userStmt.get(normalizedEmail);

    if (!user || user.phone !== normalizedPhone) {
      return res.status(404).json({ error: '账号信息不匹配' });
    }

    try {
      verifyVerificationCode({
        targetType: 'email',
        targetValue: normalizedEmail,
        code: emailCode,
        purpose: RESET_EMAIL_PURPOSE
      });

      verifyVerificationCode({
        targetType: 'phone',
        targetValue: normalizedPhone,
        code: phoneCode,
        purpose: RESET_PHONE_PURPOSE
      });
    } catch (verificationError) {
      return res.status(400).json({ error: verificationError.message || '验证码校验失败' });
    }

    let resetUrl;

    if (user) {
      resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(resetToken);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

      const cleanup = db.prepare('DELETE FROM password_resets WHERE user_id = ? AND (expires_at <= CURRENT_TIMESTAMP OR used_at IS NOT NULL)');
      cleanup.run(user.id);

      const insert = db.prepare('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)');
      insert.run(user.id, tokenHash, expiresAt);

      resetUrl = `${buildBaseUrl(req)}/auth?token=${resetToken}`;
      if (isSmtpConfigured()) {
        sendPasswordResetEmail({ to: user.email, resetUrl, token: resetToken }).catch((err) => {
          console.error('Failed to send password reset email', err);
        });
      } else {
        console.log(`[Password reset] ${user.email} -> ${resetUrl}`);
      }
    }

    return res.status(200).json({
      message: '如果账号存在，重置链接已经发送到邮箱。',
      resetToken,
      resetUrl
    });
  } catch (err) {
    console.error('Forgot password error', err);
    return res.status(500).json({ error: '请求失败' });
  }
};
