const express = require('express');
const router = express.Router();
let Submission;
try {
  Submission = require('../models/Submission.cjs');
} catch(e) {}

router.post('/', async (req, res) => {
  const { jntuNo, studentName, branch, contestId, contestName, score, totalMarks, mcqCorrect, timeTaken, answers, code, lang } = req.body;
  console.log(`[Submission Received] ${jntuNo} - Contest ${contestId}: Score ${score}/${totalMarks}`);

  if (Submission) {
    try {
      const doc = await Submission.create({
        jntuNo,
        studentName,
        branch,
        contestId,
        contestName,
        score,
        totalMarks,
        mcqCorrect,
        timeTaken,
        answers,
        code,
        lang
      });
      return res.json({ success: true, id: doc._id, score });
    } catch(err) {
      console.warn('MongoDB save error:', err.message);
    }
  }

  res.json({ success: true, message: 'Submission recorded', score });
});

router.get('/student/:jntuNo', async (req, res) => {
  if (Submission) {
    try {
      const list = await Submission.find({ jntuNo: req.params.jntuNo }).sort({ submittedAt: -1 });
      return res.json({ submissions: list });
    } catch(e) {}
  }
  res.json({ submissions: [] });
});

module.exports = router;
