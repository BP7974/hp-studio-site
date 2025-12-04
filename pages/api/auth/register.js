const db = require('../../../lib/db');
const {
  hashPassword,
  signToken,
  setAuthCookie,
  serializeUser
} = require('../../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, phone, password } = req.body || {};

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const emailTrimmed = String(email).trim().toLowerCase();
  const phoneTrimmed = String(phone).trim();

  try {
    const existing = db
      .prepare('SELECT id FROM users WHERE email = ? OR phone = ?')
      .get(emailTrimmed, phoneTrimmed);

    if (existing) {
      return res.status(409).json({ error: 'Email or phone already registered' });
    }

    const passwordHash = await hashPassword(password);
    const result = db
      .prepare('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)')
      .run(name.trim(), emailTrimmed, phoneTrimmed, passwordHash);

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
