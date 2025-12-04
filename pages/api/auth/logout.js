const { clearAuthCookie } = require('../../../lib/auth');

module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  clearAuthCookie(res);
  return res.status(200).json({ success: true });
};
