const { requireUser } = require('../../../lib/auth');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const user = requireUser(req, res);
  if (!user) return;

  return res.status(200).json({ user });
};
