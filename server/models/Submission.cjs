const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  jntuNo: { type: String, required: true },
  studentName: String,
  branch: String,
  contestId: { type: Number, required: true },
  contestName: String,
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  mcqCorrect: Number,
  timeTaken: Number,
  answers: Object,
  code: Object,
  lang: Object,
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', submissionSchema);
