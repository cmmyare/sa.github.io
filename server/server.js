require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const {
  DEV_DB_URL,
  DB_NAME = 'meet_sab',
  COLLECTION = 'trick',
  PORT = 3000,
  ALLOWED_ORIGINS = 'https://cmmyare.github.io,http://localhost:3000,http://127.0.0.1:3000,http://127.0.0.1:5500,http://localhost:5500',
} = process.env;

if (!DEV_DB_URL) {
  console.error('DEV_DB_URL is missing. Copy .env.example to .env and fill it in.');
}

const MIN_DATE = '2026-10-16';
const MAX_DATE = '2026-10-23'; // Friday next week
const ANSWER_ID = 'saabira-answer'; // fixed _id => only one entry can ever be stored

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use(cors({ origin: ALLOWED_ORIGINS.split(',').map((o) => o.trim()) }));

// Serve the frontend too, handy for local testing at http://localhost:3000
const FRONTEND_FILES = { '/': 'index.html', '/index.html': 'index.html', '/style.css': 'style.css', '/app.js': 'app.js', '/config.js': 'config.js' };
app.get(Object.keys(FRONTEND_FILES), (req, res) => res.sendFile(path.join(__dirname, '..', FRONTEND_FILES[req.path])));

// Connect once and reuse (works both locally and on Vercel serverless)
let collectionPromise;
function getCollection() {
  if (!collectionPromise) {
    collectionPromise = new MongoClient(DEV_DB_URL).connect()
      .then((client) => client.db(DB_NAME).collection(COLLECTION))
      .catch((err) => { collectionPromise = null; throw err; });
  }
  return collectionPromise;
}

const str = (v, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/status', async (_req, res) => {
  try {
    const doc = await (await getCollection()).findOne({ _id: ANSWER_ID });
    if (!doc) return res.json({ submitted: false });
    const { name, breakfastDate, breakfastTime, place } = doc;
    res.json({ submitted: true, answer: { name, breakfastDate, breakfastTime, place } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/answer', async (req, res) => {
  const b = req.body || {};
  const answer = {
    _id: ANSWER_ID,
    name: str(b.name, 40),
    missesHim: b.missesHim === true,
    loveLevel: str(b.loveLevel, 20),
    fellInLoveFirst: str(b.fellInLoveFirst, 40),
    favoriteThing: str(b.favoriteThing, 40),
    forever: str(b.forever, 40),
    breakfastDate: str(b.breakfastDate, 10),
    breakfastTime: str(b.breakfastTime, 5),
    place: str(b.place, 120),
    remembersAnniversary: b.remembersAnniversary === true,
    anniversary: '2026-10-28',
    submittedAt: new Date(),
    userAgent: str(req.get('user-agent') || '', 300),
  };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(answer.breakfastDate) || answer.breakfastDate < MIN_DATE || answer.breakfastDate > MAX_DATE) {
    return res.status(400).json({ error: `Breakfast date must be between ${MIN_DATE} and ${MAX_DATE}` });
  }
  if (!/^\d{2}:\d{2}$/.test(answer.breakfastTime)) return res.status(400).json({ error: 'Invalid time' });
  if (!answer.name || answer.place.length < 2) return res.status(400).json({ error: 'Missing name or place' });

  try {
    await (await getCollection()).insertOne(answer);
    console.log('💌 New answer saved:', answer.breakfastDate, answer.breakfastTime, answer.place);
    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Answer already submitted' });
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = app;

if (require.main === module) {
  getCollection()
    .then(() => {
      console.log(`Connected to MongoDB → ${DB_NAME}.${COLLECTION}`);
      app.listen(PORT, () => console.log(`🤎 Server running on http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error('Failed to start:', err.message);
      process.exit(1);
    });
}
