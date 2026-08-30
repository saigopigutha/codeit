const express = require('express');
const router = express.Router();

router.get('/contest/:contestId', (req, res) => {
  // In production: fetch questions from MongoDB by contest ID
  res.json({ questions: [], message: 'Questions served from frontend mock data for now.' });
});

module.exports = router;
