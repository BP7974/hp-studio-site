const db = require('../../../lib/db');
const { createVerificationCode } = require('../../../lib/verification');
const { isSmtpConfigured, sendVerificationEmail } = require('../../../lib/mailer');

const PURPOSE = 'reset-email';
const TTL_MINUTES = Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 10);
const RESEND_SECONDS = Number(process.env.VERIFICATION_RESEND_SECONDS || process.env.VR_CODE_RESEND_SECONDS || 60);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, phone } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = String(phone || '').trim();

  if (!normalizedEmail || !normalizedPhone) {
    return res.status(400).json({ error: '请输入邮箱和手机号' });
  }

  const user = db
    .prepare('SELECT id, email, phone FROM users WHERE LOWER(email) = ?')
    .get(normalizedEmail);

  if (!user || user.phone !== normalizedPhone) {
    return res.status(404).json({ error: '账号信息不匹配' });
  }

  try {
    const { code, expiresAt } = createVerificationCode({
      targetType: 'email',
      targetValue: normalizedEmail,
      purpose: PURPOSE,
      ttlMinutes: TTL_MINUTES
    });

    let delivery = 'preview';
    if (isSmtpConfigured()) {
      await sendVerificationEmail({
        to: normalizedEmail,
        code,
        ttlMinutes: TTL_MINUTES,
        subject: 'HP Studio 找回密码邮箱验证码',
        text: `找回密码验证码：${code}，${TTL_MINUTES} 分钟内有效。`,
        html: `
          <p>您正在验证找回 HP Studio 账号的邮箱。</p>
          <p style="font-size:24px;font-weight:bold;letter-spacing:2px;">${code}</p>
          <p>请在 ${TTL_MINUTES} 分钟内输入完成验证。</p>
        `
      });
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
    console.error('send-reset-email-code error', err);
    return res.status(500).json({ error: '验证码发送失败，请稍后再试' });
  }
};
