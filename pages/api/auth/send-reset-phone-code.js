const db = require('../../../lib/db');
const { createVerificationCode } = require('../../../lib/verification');
const { isSmsConfigured, sendSmsVerification } = require('../../../lib/sms');

const PURPOSE = 'reset-phone';
const TTL_MINUTES = Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 10);
const RESEND_SECONDS = Number(process.env.VERIFICATION_RESEND_SECONDS || process.env.VR_CODE_RESEND_SECONDS || 60);

function isValidPhone(phone) {
  return /^\+?\d{6,20}$/.test(phone);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, phone } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = String(phone || '').trim();

  if (!normalizedEmail || !isValidPhone(normalizedPhone)) {
    return res.status(400).json({ error: '请输入正确的邮箱和手机号' });
  }

  const user = db
    .prepare('SELECT id, phone FROM users WHERE LOWER(email) = ?')
    .get(normalizedEmail);

  if (!user || user.phone !== normalizedPhone) {
    return res.status(404).json({ error: '账号信息不匹配' });
  }

  try {
    const { code, expiresAt } = createVerificationCode({
      targetType: 'phone',
      targetValue: normalizedPhone,
      purpose: PURPOSE,
      ttlMinutes: TTL_MINUTES
    });

    let delivery = 'preview';
    if (isSmsConfigured()) {
      await sendSmsVerification({
        phone: normalizedPhone,
        code,
        ttlMinutes: TTL_MINUTES,
        messageTemplate: '【HP Studio】找回密码验证码 {code}，{ttl} 分钟内有效，请勿泄露。'
      });
      delivery = 'sms';
    }

    const payload = {
      message: '短信验证码已发送',
      expiresAt,
      delivery,
      cooldown: RESEND_SECONDS
    };

    if (delivery !== 'sms') {
      payload.previewCode = code;
    }

    return res.status(200).json(payload);
  } catch (err) {
    if (err.code === 'RATE_LIMIT') {
      return res.status(429).json({ error: err.message, retryAfter: err.retryAfter });
    }
    console.error('send-reset-phone-code error', err);
    return res.status(500).json({ error: '短信发送失败，请稍后再试' });
  }
};
