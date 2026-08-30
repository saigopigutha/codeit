const express = require('express');
const router = express.Router();

router.get('/contest/:contestId', (req, res) => {
  res.json({ results: [], leaderboard: [] });
});

router.get('/student/:jntuNo', (req, res) => {
  res.json({ results: [] });
});

module.exports = router;
