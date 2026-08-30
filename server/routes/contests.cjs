const express = require('express');
const router = express.Router();

let CONTESTS = [];

router.get('/', (req, res) => res.json({ contests: CONTESTS }));
router.get('/:id', (req, res) => {
  const c = CONTESTS.find(x => x.id === parseInt(req.params.id));
  if (!c) return res.status(404).json({ error: 'Contest not found' });
  res.json(c);
});

module.exports = router;
