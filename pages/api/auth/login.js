const db = require('../../../lib/db');
const {
  verifyPassword,
  signToken,
  setAuthCookie,
  serializeUser
} = require('../../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier and password are required' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ? OR phone = ?');
    const user = stmt.get(identifier.trim().toLowerCase(), identifier.trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const safeUser = serializeUser(user);
    const token = signToken(safeUser);
    setAuthCookie(res, token);

    return res.status(200).json({ user: safeUser });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ error: 'Login failed' });
  }
};
