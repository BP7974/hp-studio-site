const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_HP_STUDIO_SECRET';
const TOKEN_NAME = 'hpstudio_token';

const serializeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  created_at: user.created_at
});

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function signToken(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie', cookie.serialize(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60
  }));
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  }));
}

function getUserFromToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(decoded.id);
    return user ? serializeUser(user) : null;
  } catch (err) {
    return null;
  }
}

function getTokenFromRequest(req) {
  if (!req.headers.cookie) return null;
  const cookies = cookie.parse(req.headers.cookie);
  return cookies[TOKEN_NAME] || null;
}

function requireUser(req, res) {
  const token = getTokenFromRequest(req);
  const user = getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return user;
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  requireUser,
  getUserFromToken,
  getTokenFromRequest,
  serializeUser
};
