const db = require('../lib/db');
const { hashPassword, verifyPassword } = require('../lib/auth');
const forgotHandler = require('../pages/api/auth/forgot');
const resetHandler = require('../pages/api/auth/reset');

const TEST_EMAIL = 'reset-test@hpstudio.local';
const TEST_PHONE = '19900000000';
const INITIAL_PASSWORD = 'Initial123!';
const NEW_PASSWORD = 'Reset456!';

function createMockRes(resolve) {
  return {
    statusCode: 200,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      resolve({ statusCode: this.statusCode, body: payload, headers: this.headers });
      return this;
    }
  };
}

function invokeHandler(handler, req) {
  return new Promise((resolve, reject) => {
    const res = createMockRes(resolve);
    try {
      const maybePromise = handler(req, res);
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.catch(reject);
      }
    } catch (err) {
      reject(err);
    }
  });
}

async function ensureTestUser() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(TEST_EMAIL);
  const passwordHash = await hashPassword(INITIAL_PASSWORD);

  if (existing) {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, existing.id);
    return existing.id;
  }

  const insert = db.prepare(
    'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)' 
  );
  const info = insert.run('Reset Tester', TEST_EMAIL, TEST_PHONE, passwordHash);
  return info.lastInsertRowid;
}

async function verifyDatabasePassword(userId) {
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);
  if (!row) {
    throw new Error('用户不存在，无法校验密码');
  }
  const matches = await verifyPassword(NEW_PASSWORD, row.password_hash);
  if (!matches) {
    throw new Error('数据库中的密码哈希与期望不符');
  }
}

async function main() {
  try {
    const userId = await ensureTestUser();

    const forgotRes = await invokeHandler(forgotHandler, {
      method: 'POST',
      body: { email: TEST_EMAIL },
      headers: { host: 'localhost:3000' }
    });

    if (forgotRes.statusCode !== 200 || !forgotRes.body.resetToken) {
      throw new Error(`找回密码接口返回异常: ${JSON.stringify(forgotRes.body)}`);
    }

    const resetRes = await invokeHandler(resetHandler, {
      method: 'POST',
      body: { token: forgotRes.body.resetToken, password: NEW_PASSWORD },
      headers: { host: 'localhost:3000' }
    });

    if (resetRes.statusCode !== 200) {
      throw new Error(`重置密码接口返回异常: ${JSON.stringify(resetRes.body)}`);
    }

    await verifyDatabasePassword(userId);

    db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(userId);

    console.log('✅ 找回密码流程校验通过');
  } catch (err) {
    console.error('❌ 找回密码流程校验失败:', err.message);
    process.exit(1);
  }
}

main();
