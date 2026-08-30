require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codeit';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.warn('MongoDB not connected (running without DB):', err.message));

app.use('/api/auth',        require('./routes/auth.cjs'));
app.use('/api/contests',    require('./routes/contests.cjs'));
app.use('/api/questions',   require('./routes/questions.cjs'));
app.use('/api/submissions', require('./routes/submissions.cjs'));
app.use('/api/results',     require('./routes/results.cjs'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, () => console.log(`CodeIT backend running on http://localhost:${PORT}`));
