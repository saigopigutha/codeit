const express = require('express');
const router = express.Router();
let Submission;
try {
  Submission = require('../models/Submission.cjs');
} catch(e) {}

// In-memory store when MongoDB is not running
const inMemorySubmissions = [];

router.post('/', async (req, res) => {
  const { jntuNo, studentName, branch, contestId, contestName, score, totalMarks, mcqCorrect, timeTaken, refreshes, warnings, submittedAt, answers, code, lang } = req.body;
  console.log(`[Submission Received] ${jntuNo} - Contest ${contestId}: Score ${score}/${totalMarks} (Refreshes: ${refreshes || 0}, Warnings: ${warnings || 0})`);

  const now = new Date();
  const formattedTime = submittedAt || (now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ', ' +
    now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));

  const subObj = {
    id: Date.now().toString(),
    jntuNo,
    studentName,
    branch,
    contestId,
    contestName,
    score,
    totalMarks,
    mcqCorrect,
    timeTaken,
    refreshes: refreshes || 0,
    warnings: warnings || 0,
    answers,
    code,
    lang,
    submittedAt: formattedTime,
    createdAt: now
  };

  inMemorySubmissions.unshift(subObj);

  if (Submission) {
    try {
      const doc = await Submission.create(subObj);
      return res.json({ success: true, id: doc._id, score });
    } catch(err) {
      console.warn('MongoDB save error:', err.message);
    }
  }

  res.json({ success: true, id: subObj.id, score });
});

router.get('/', async (req, res) => {
  if (Submission) {
    try {
      const list = await Submission.find({}).sort({ submittedAt: -1 });
      return res.json({ submissions: list });
    } catch(e) {}
  }
  res.json({ submissions: inMemorySubmissions });
});

router.get('/student/:jntuNo', async (req, res) => {
  if (Submission) {
    try {
      const list = await Submission.find({ jntuNo: req.params.jntuNo }).sort({ submittedAt: -1 });
      return res.json({ submissions: list });
    } catch(e) {}
  }
  const filtered = inMemorySubmissions.filter(s => s.jntuNo === req.params.jntuNo);
  res.json({ submissions: filtered });
});

module.exports = router;
