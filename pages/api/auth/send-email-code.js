const db = require('../../../lib/db');
const { createVerificationCode } = require('../../../lib/verification');
const { isSmtpConfigured, sendVerificationEmail } = require('../../../lib/mailer');

const PURPOSE = 'register-email';
const TTL_MINUTES = Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 10);
const RESEND_SECONDS = Number(process.env.VERIFICATION_RESEND_SECONDS || process.env.VR_CODE_RESEND_SECONDS || 60);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body || {};
  const emailTrimmed = String(email || '').trim().toLowerCase();

  if (!emailTrimmed) {
    return res.status(400).json({ error: '请输入邮箱' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailTrimmed);
  if (existing) {
    return res.status(409).json({ error: '该邮箱已注册' });
  }

  try {
    const { code, expiresAt } = createVerificationCode({
      targetType: 'email',
      targetValue: emailTrimmed,
      purpose: PURPOSE,
      ttlMinutes: TTL_MINUTES
    });

    let delivery = 'preview';
    if (isSmtpConfigured()) {
      await sendVerificationEmail({ to: emailTrimmed, code, ttlMinutes: TTL_MINUTES });
      delivery = 'email';
    }

    const payload = {
      message: '邮箱验证码已发送',
      expiresAt,
      delivery,
      cooldown: RESEND_SECONDS
    };

    if (delivery !== 'email') {
      payload.previewCode = code;
    }

    return res.status(200).json(payload);
  } catch (err) {
    if (err.code === 'RATE_LIMIT') {
      return res.status(429).json({ error: err.message, retryAfter: err.retryAfter });
    }
    console.error('send-email-code error', err);
    return res.status(500).json({ error: '发送失败，请稍后再试' });
  }
};
