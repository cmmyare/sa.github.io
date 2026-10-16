import { MongoClient } from 'mongodb';

const {
  DEV_DB_URL,
  DB_NAME = 'meet_sab',
  COLLECTION = 'trick',
  ALLOWED_ORIGINS = 'https://cmmyare.github.io,http://localhost:3000,http://127.0.0.1:3000,http://127.0.0.1:5500,http://localhost:5500',
} = process.env;

const MIN_DATE = '2026-10-16';
const MAX_DATE = '2026-10-23'; // Friday next week
const allowed = ALLOWED_ORIGINS.split(',').map((o) => o.trim());

// Connect once and reuse between invocations
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

export default async (req) => {
  const origin = req.headers.get('origin') || '';
  const cors = {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
  const json = (status, body) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const path = new URL(req.url).pathname;
  if (path === '/api/health') return json(200, { ok: true });
  if (path !== '/api/answer' || req.method !== 'POST') return json(404, { error: 'Not found' });

  const b = await req.json().catch(() => ({}));
  const answer = {
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
    userAgent: str(req.headers.get('user-agent') || '', 300),
  };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(answer.breakfastDate) || answer.breakfastDate < MIN_DATE || answer.breakfastDate > MAX_DATE) {
    return json(400, { error: `Breakfast date must be between ${MIN_DATE} and ${MAX_DATE}` });
  }
  if (!/^\d{2}:\d{2}$/.test(answer.breakfastTime)) return json(400, { error: 'Invalid time' });
  if (!answer.name || answer.place.length < 2) return json(400, { error: 'Missing name or place' });

  try {
    await (await getCollection()).insertOne(answer);
    return json(201, { ok: true });
  } catch (err) {
    console.error(err);
    return json(500, { error: 'Database error' });
  }
};

export const config = { path: ['/api/health', '/api/answer'] };
