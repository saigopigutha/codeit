const express = require('express');
const router = express.Router();

const CONTESTS = [
  { id:1, name:'ISTE Coding Challenge – Round 1', desc:'Algorithmic problems', duration:90, marks:100, qCount:5, type:'Coding', status:'Open' },
  { id:2, name:'DSA Fundamentals MCQ Test', desc:'25 MCQ questions', duration:60, marks:50, qCount:25, type:'MCQ', status:'Upcoming' },
  { id:3, name:'Web Dev Hackathon – Qualifier', desc:'Build responsive pages', duration:120, marks:150, qCount:3, type:'Coding', status:'Closed' },
  { id:4, name:'Python Basics Assessment', desc:'Beginner Python problems', duration:45, marks:50, qCount:5, type:'Coding', status:'Open' },
];

router.get('/', (req, res) => res.json({ contests: CONTESTS }));
router.get('/:id', (req, res) => {
  const c = CONTESTS.find(x => x.id === parseInt(req.params.id));
  if (!c) return res.status(404).json({ error: 'Contest not found' });
  res.json(c);
});

module.exports = router;
