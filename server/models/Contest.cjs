const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  id: Number,
  input: { type: String, default: '' },
  expected: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
  explanation: { type: String, default: '' }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  type: { type: String, enum: ['mcq', 'code'], required: true },
  title: String,
  text: { type: String, required: true },
  options: [String],
  correct: Number,
  marks: { type: Number, default: 10 },
  lang: String,
  testCases: [testCaseSchema]
}, { _id: false });

const contestSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  desc: { type: String, default: '' },
  duration: { type: Number, default: 60 },
  marks: { type: Number, default: 0 },
  type: { type: String, default: 'Mixed' },
  status: { type: String, enum: ['Open', 'Upcoming', 'Closed'], default: 'Upcoming' },
  password: { type: String, required: true },
  students: { type: Number, default: 0 },
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contest', contestSchema);
