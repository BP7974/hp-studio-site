const db = require('../../../lib/db');
const { hashPassword } = require('../../../lib/auth');
const crypto = require('crypto');

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token, password } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ error: '重置令牌和新密码不能为空' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: '新密码至少需要 8 位字符' });
  }

  const tokenHash = hashToken(token.trim());

  try {
    const resetStmt = db.prepare(`
      SELECT id, user_id, expires_at, used_at
      FROM password_resets
      WHERE token_hash = ?
        AND used_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
      ORDER BY id DESC
      LIMIT 1
    `);
    const resetRequest = resetStmt.get(tokenHash);

    if (!resetRequest) {
      return res.status(400).json({ error: '重置链接无效或已过期' });
    }

    const hashedPassword = await hashPassword(password);
    const updateUser = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    updateUser.run(hashedPassword, resetRequest.user_id);

    const markUsed = db.prepare('UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE id = ?');
    markUsed.run(resetRequest.id);

    const cleanup = db.prepare('DELETE FROM password_resets WHERE user_id = ? AND (expires_at <= CURRENT_TIMESTAMP OR used_at IS NOT NULL)');
    cleanup.run(resetRequest.user_id);

    return res.status(200).json({ message: '密码已更新，请重新登录' });
  } catch (err) {
    console.error('Reset password error', err);
    return res.status(500).json({ error: '重置失败' });
  }
};
