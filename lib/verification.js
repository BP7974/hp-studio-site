const crypto = require('crypto');
const db = require('./db');

const DEFAULT_TTL_MINUTES = Number(process.env.VERIFICATION_CODE_TTL_MINUTES || 10);
const DEFAULT_RESEND_SECONDS = Number(process.env.VR_CODE_RESEND_SECONDS || process.env.VERIFICATION_RESEND_SECONDS || 60);
const DEFAULT_CODE_LENGTH = Number(process.env.VERIFICATION_CODE_LENGTH || 6);

function normalizeTarget(targetType, value) {
  if (!value) {
    return '';
  }
  return targetType === 'email' ? String(value).trim().toLowerCase() : String(value).trim();
}

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function generateNumericCode(length = DEFAULT_CODE_LENGTH) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += crypto.randomInt(0, 10);
  }
  return code;
}

function assertRateLimit(targetType, targetValue, purpose, resendSeconds) {
  const row = db
    .prepare(
      `SELECT created_at FROM verification_codes
       WHERE target_type = ? AND target_value = ? AND purpose = ?
       AND used_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(targetType, targetValue, purpose);

  if (!row) {
    return;
  }

  const createdAt = new Date(row.created_at).getTime();
  const now = Date.now();
  const elapsedSeconds = (now - createdAt) / 1000;

  if (elapsedSeconds < resendSeconds) {
    const wait = Math.ceil(resendSeconds - elapsedSeconds);
    const err = new Error(`请等待 ${wait} 秒后再请求验证码`);
    err.code = 'RATE_LIMIT';
    err.retryAfter = wait;
    throw err;
  }
}

function createVerificationCode({
  targetType,
  targetValue,
  purpose = 'register',
  ttlMinutes = DEFAULT_TTL_MINUTES,
  resendSeconds = DEFAULT_RESEND_SECONDS
}) {
  if (!['email', 'phone'].includes(targetType)) {
    throw new Error('Unsupported target type');
  }

  const normalizedValue = normalizeTarget(targetType, targetValue);
  if (!normalizedValue) {
    throw new Error('Target value is required');
  }

  assertRateLimit(targetType, normalizedValue, purpose, resendSeconds);

  const code = generateNumericCode();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
  const codeHash = hashCode(code);

  db.prepare(
    `INSERT INTO verification_codes (target_type, target_value, purpose, code_hash, expires_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(targetType, normalizedValue, purpose, codeHash, expiresAt);

  return { code, expiresAt };
}

function verifyVerificationCode({ targetType, targetValue, code, purpose = 'register', consume = true }) {
  if (!code) {
    throw new Error('验证码不能为空');
  }

  const normalizedValue = normalizeTarget(targetType, targetValue);
  const row = db
    .prepare(
      `SELECT id, code_hash, expires_at, used_at FROM verification_codes
       WHERE target_type = ? AND target_value = ? AND purpose = ?
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(targetType, normalizedValue, purpose);

  if (!row) {
    throw new Error('请先获取验证码');
  }

  if (row.used_at) {
    throw new Error('验证码已被使用，请重新获取');
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new Error('验证码已过期');
  }

  const incomingHash = hashCode(code);
  if (incomingHash !== row.code_hash) {
    throw new Error('验证码不正确');
  }

  if (consume) {
    db.prepare('UPDATE verification_codes SET used_at = CURRENT_TIMESTAMP WHERE id = ?').run(row.id);
  }

  return true;
}

module.exports = {
  createVerificationCode,
  verifyVerificationCode,
  normalizeTarget,
  generateNumericCode
};
