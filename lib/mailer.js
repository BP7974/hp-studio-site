const nodemailer = require('nodemailer');

let cachedTransport = null;
let cachedSignature = null;
const DEFAULT_VERIFICATION_TTL = Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 10);

function getSmtpConfig() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    return null;
  }

  const port = Number(SMTP_PORT || 465);
  const secure = typeof SMTP_SECURE === 'string'
    ? !['0', 'false', 'False', 'FALSE'].includes(SMTP_SECURE)
    : port === 465;

  return {
    host: SMTP_HOST,
    port,
    secure,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    from: SMTP_FROM
  };
}

function getTransport() {
  const config = getSmtpConfig();
  if (!config) {
    cachedTransport = null;
    cachedSignature = null;
    return null;
  }

  const { from, ...transportConfig } = config;
  const signature = JSON.stringify(transportConfig);

  if (!cachedTransport || signature !== cachedSignature) {
    cachedTransport = nodemailer.createTransport(transportConfig);
    cachedSignature = signature;
  }

  return cachedTransport;
}

function isSmtpConfigured() {
  return Boolean(getTransport());
}

async function sendPasswordResetEmail({ to, resetUrl, token }) {
  const transport = getTransport();
  const config = getSmtpConfig();

  if (!transport || !config) {
    throw new Error('SMTP is not configured');
  }

  const subject = 'HP Studio 密码重置';
  const text = [
    '你正在请求重置 HP Studio 账号的密码。',
    `重置链接：${resetUrl}`,
    '如果不是你本人操作，请忽略此邮件。'
  ].join('\n');

  const html = `
    <p>你正在请求重置 HP Studio 账号的密码。</p>
    <p>点击以下链接即可完成重置（${process.env.PASSWORD_RESET_TTL_MINUTES || 60} 分钟内有效）：</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>如果不是你本人操作，请忽略此邮件。</p>
    <p style="color:#666;font-size:12px;">如果无法点击链接，可复制令牌：<code>${token}</code></p>
  `;

  await transport.sendMail({
    from: config.from,
    to,
    subject,
    text,
    html
  });
}

async function sendVerificationEmail({
  to,
  code,
  ttlMinutes = DEFAULT_VERIFICATION_TTL,
  subject: customSubject,
  text: customText,
  html: customHtml
}) {
  const transport = getTransport();
  const config = getSmtpConfig();

  if (!transport || !config) {
    throw new Error('SMTP is not configured');
  }

  const subject = customSubject || 'HP Studio 注册验证码';
  const text =
    customText || `您的验证码是 ${code}，${ttlMinutes} 分钟内有效，请勿泄露给他人。`;
  const html =
    customHtml || `
    <p>您的 HP Studio 注册验证码：</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:2px;">${code}</p>
    <p>请在 ${ttlMinutes} 分钟内完成输入，该验证码仅供一次性使用。</p>
  `;

  await transport.sendMail({
    from: config.from,
    to,
    subject,
    text,
    html
  });
}

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
  isSmtpConfigured
};
