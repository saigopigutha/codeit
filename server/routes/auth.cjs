const express = require('express');
const router = express.Router();

// Student login / register (JNTU-based, no password)
router.post('/student/login', (req, res) => {
  const { jntuNo, name, branch, contact } = req.body;
  if (!jntuNo || !name || !branch || !contact)
    return res.status(400).json({ error: 'All fields are required.' });
  const cleanJntu = (jntuNo || '').trim().toUpperCase();
  if (!/^[0-9]{2}[0-9A-Z]{8}$/i.test(cleanJntu))
    return res.status(400).json({ error: 'Invalid JNTU number format (10 characters expected).' });
  const year = 2000 + parseInt(cleanJntu.substring(0, 2));
  res.json({ jntuNo: cleanJntu, name, branch, contact, batch: year, token: 'JWT_' + cleanJntu });
});

// Admin login (demo only — use MSAL for production)
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@gmrit.edu.in' && password === 'admin123')
    return res.json({ token: 'ADMIN_MOCK_JWT', role: 'admin' });
  res.status(401).json({ error: 'Invalid credentials.' });
});

module.exports = router;
