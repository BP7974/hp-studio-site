const db = require('../../../lib/db');
const { createVerificationCode } = require('../../../lib/verification');
const { isSmsConfigured, sendSmsVerification } = require('../../../lib/sms');

const PURPOSE = 'register-phone';
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

  const { phone } = req.body || {};
  const phoneTrimmed = String(phone || '').trim();

  if (!isValidPhone(phoneTrimmed)) {
    return res.status(400).json({ error: '请输入正确的手机号（仅数字，可包含国家区号）' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phoneTrimmed);
  if (existing) {
    return res.status(409).json({ error: '该手机号已注册' });
  }

  try {
    const { code, expiresAt } = createVerificationCode({
      targetType: 'phone',
      targetValue: phoneTrimmed,
      purpose: PURPOSE,
      ttlMinutes: TTL_MINUTES
    });

    let delivery = 'preview';
    if (isSmsConfigured()) {
      await sendSmsVerification({ phone: phoneTrimmed, code, ttlMinutes: TTL_MINUTES });
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
    console.error('send-phone-code error', err);
    return res.status(500).json({ error: '短信发送失败，请稍后再试' });
  }
};
