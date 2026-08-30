const express = require('express');
const router = express.Router();

// Student login / register (JNTU-based, no password)
router.post('/student/login', (req, res) => {
  const { jntuNo, name, branch, contact } = req.body;
  if (!jntuNo || !name || !branch || !contact)
    return res.status(400).json({ error: 'All fields are required.' });
  if (!/^\d{2}[0-9A-Z]{3}\d[A-Z]\d{4}$/i.test(jntuNo))
    return res.status(400).json({ error: 'Invalid JNTU number format.' });
  // In production: upsert student in MongoDB
  const year = 2000 + parseInt(jntuNo.substring(0, 2));
  res.json({ jntuNo, name, branch, contact, batch: year, token: 'MOCK_JWT_' + jntuNo });
});

// Admin login (demo only — use MSAL for production)
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@gmrit.edu.in' && password === 'admin123')
    return res.json({ token: 'ADMIN_MOCK_JWT', role: 'admin' });
  res.status(401).json({ error: 'Invalid credentials.' });
});

module.exports = router;
