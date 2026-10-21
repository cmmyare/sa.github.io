(() => {
  const API_URLS = window.MEET_API_URLS;

  // ---------- the plan (from Sabira's answer) ----------
  const NAME = 'Sabira';
  const PLACE = '☕ A cozy café';
  const MEETING = new Date(2026, 9, 21, 9, 0, 0); // Wed 21 Oct 2026, 9:00 AM
  const GRACE_END = new Date(MEETING.getTime() + 60 * 60 * 1000); // +1 extra hour
  const GIFT_TIME = new Date(2026, 9, 27, 23, 0, 0); // Tue 27 Oct 2026, 11:00 PM — anniversary eve
  const LOVE_START = new Date(2024, 9, 28); // 28/10/2024
  const ARRIVED_KEY = 'meetSab.arrivedAt';

  const card = document.getElementById('card');
  const overlay = document.getElementById('overlay');

  // ---------- preview mode (for him only): ?preview=meeting|grace|late|anniversary|gifts or ?at=HH:MM ----------
  const params = new URLSearchParams(location.search);
  // [day, time] each preview pretends it is; ?date=2026-10-27&at=22:59:40 picks any moment
  const PREVIEW_TIMES = {
    meeting: ['2026-10-21', '07:45'], grace: ['2026-10-21', '09:20'], late: ['2026-10-21', '10:35'],
    anniversary: ['2026-10-21', '21:30'], gifts: ['2026-10-27', '23:00:03'],
  };
  const preview = params.get('preview');
  const [prevDay, prevAt] = PREVIEW_TIMES[preview] || [];
  const atParam = params.get('at') || prevAt;
  const dayParam = params.get('date') || prevDay || '2026-10-21';
  const isPreview = !!atParam;
  let offset = 0;
  if (atParam) {
    const [y, mo, d] = dayParam.split('-').map(Number);
    const [h, m = 0, s = 0] = atParam.split(':').map(Number);
    offset = new Date(y, mo - 1, d, h, m, s).getTime() - Date.now();
  }
  const now = () => new Date(Date.now() + offset);

  let arrivedAt = null;
  if (isPreview) {
    if (preview === 'anniversary' || preview === 'gifts') arrivedAt = new Date(2026, 9, 21, 9, 12);
  } else {
    try { const v = localStorage.getItem(ARRIVED_KEY); if (v) arrivedAt = new Date(v); } catch {}
  }

  // ---------- helpers ----------
  const $ = (sel, root = card) => root.querySelector(sel);
  const pad = (n) => String(n).padStart(2, '0');

  function fetchWithTimeout(url, options = {}, ms = 15000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(timer));
  }

  // Try each backend until one answers
  async function api(path, options) {
    for (const base of API_URLS) {
      try {
        const res = await fetchWithTimeout(base + path, options);
        if (res.ok) return await res.json();
      } catch { /* try next */ }
    }
    throw new Error('No server reachable');
  }

  function render(html) {
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = '';
    card.innerHTML = html;
  }

  function showOverlay(html) {
    overlay.innerHTML = `<div class="card">${html}</div>`;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { overlay.classList.add('hidden'); overlay.innerHTML = ''; }

  // ---------- background magic ----------
  const HEARTS = {
    meeting: ['🤎', '☕', '🥐', '💗', '🤍', '🍫'],
    grace: ['⏰', '😤', '☕', '🤎', '⌛'],
    late: ['💔', '😡', '⏰', '🥺', '☕'],
    anniversary: ['💗', '💖', '💕', '🌸', '🌷', '💞', '🤍'],
    gifts: ['🎁', '💐', '👑', '✨', '💖', '🌹', '🎀'],
  };
  let stage = null;

  function spawnHeart() {
    const set = HEARTS[stage] || HEARTS.meeting;
    const h = document.createElement('span');
    h.className = 'float-heart';
    h.textContent = set[Math.floor(Math.random() * set.length)];
    h.style.left = Math.random() * 100 + 'vw';
    h.style.fontSize = 14 + Math.random() * 26 + 'px';
    h.style.animationDuration = 7 + Math.random() * 8 + 's';
    document.getElementById('hearts-bg').appendChild(h);
    setTimeout(() => h.remove(), 16000);
  }
  for (let i = 0; i < 10; i++) setTimeout(spawnHeart, i * 400);
  setInterval(spawnHeart, 800);

  function rain(items, count = 60, duration = 4000) {
    const box = document.getElementById('rain');
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const f = document.createElement('span');
        f.className = 'fall';
        f.textContent = items[Math.floor(Math.random() * items.length)];
        f.style.left = Math.random() * 100 + 'vw';
        f.style.fontSize = 18 + Math.random() * 26 + 'px';
        f.style.animationDuration = 3 + Math.random() * 3 + 's';
        box.appendChild(f);
        setTimeout(() => f.remove(), 7000);
      }, Math.random() * duration);
    }
  }

  const PINKS = ['#f9a8d4', '#f472b6', '#db2777', '#fbcfe8', '#ffffff', '#d4a24c'];
  function heartShape() {
    return typeof confetti === 'function' && confetti.shapeFromPath
      ? confetti.shapeFromPath({ path: 'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z' })
      : null;
  }

  function celebrate(ms = 3500) {
    rain(['🌹', '🌸', '💐', '🌷', '🌺', '💗', '💖', '🎉'], 90, 5000);
    if (typeof confetti !== 'function') return;
    const heart = heartShape();
    const shapes = heart ? [heart, 'circle'] : undefined;
    const end = Date.now() + ms;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors: PINKS, shapes, scalar: 1.4 });
      confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors: PINKS, shapes, scalar: 1.4 });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    confetti({ particleCount: 160, spread: 120, origin: { y: 0.45 }, colors: PINKS, scalar: 1.2 });
  }

  function fireworks(seconds = 12) {
    if (typeof confetti !== 'function') return;
    const end = Date.now() + seconds * 1000;
    const timer = setInterval(() => {
      if (Date.now() > end) return clearInterval(timer);
      confetti({
        particleCount: 70, startVelocity: 32, spread: 360, ticks: 70, gravity: 0.9, scalar: 1.1,
        origin: { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.35 }, colors: PINKS,
      });
    }, 700);
  }

  // ---------- clock ----------
  function clockHTML(negative) {
    return `
      <div class="clock">
        ${negative ? '<span class="sign">−</span>' : ''}
        <div class="unit" id="dd-unit" hidden><span id="dd">0</span><small>days</small></div><span class="sep" id="dd-sep" hidden>:</span>
        <div class="unit"><span id="hh">00</span><small>hours</small></div><span class="sep">:</span>
        <div class="unit"><span id="mm">00</span><small>min</small></div><span class="sep">:</span>
        <div class="unit"><span id="ss">00</span><small>sec</small></div>
      </div>`;
  }

  function setClock(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const hh = $('#hh');
    if (!hh) return;
    const days = Math.floor(s / 86400);
    $('#dd-unit').hidden = $('#dd-sep').hidden = days === 0;
    $('#dd').textContent = days;
    hh.textContent = pad(Math.floor((s % 86400) / 3600));
    $('#mm').textContent = pad(Math.floor((s % 3600) / 60));
    $('#ss').textContent = pad(s % 60);
  }

  // ---------- stages ----------
  function stageAt(t) {
    if (arrivedAt) return t < GIFT_TIME ? 'anniversary' : 'gifts';
    if (t < MEETING) return 'meeting';
    if (t < GRACE_END) return 'grace';
    return 'late';
  }

  // How the clock behaves in each stage: ms to show, and whether it is "minus" time
  function clockValue(s, t) {
    if (s === 'meeting') return MEETING - t;
    if (s === 'grace') return GRACE_END - t;
    if (s === 'late') return t - GRACE_END;
    if (s === 'anniversary') return GIFT_TIME - t;
    return 0;
  }

  const infoCard = () => `
    <div class="summary">
      📅 <b>Day:</b> Today, Wednesday 21 October<br/>
      ⏰ <b>Time:</b> 9:00 AM<br/>
      📍 <b>Place:</b> ${PLACE}<br/>
      💑 <b>With:</b> the one who loves you most
    </div>`;

  const VIEWS = {
    meeting: () => `
      <div class="big-emoji">☕</div>
      <h1>Today is the day!</h1>
      <p class="sub">Good morning, ${NAME} 🌸<br/>Your breakfast date with him is <b>today</b>. He can’t wait to see you!</p>
      <p class="clock-label">Our date starts in</p>
      ${clockHTML(false)}
      ${infoCard()}
      <div class="btns"><button class="btn" id="here">I’m here with him 🥰</button></div>`,

    grace: () => `
      <div class="big-emoji">😤</div>
      <h1>Ehem… you’re late!</h1>
      <p class="sub">It’s past 9:00 and he’s already sitting there ☕<br/>Okay okay… he gave you <b>1 extra hour</b>. Hurry up, princess! 🏃‍♀️💨</p>
      <p class="clock-label">Extra time left</p>
      ${clockHTML(false)}
      ${infoCard()}
      <div class="btns"><button class="btn" id="here">I’m finally here 🙈</button></div>`,

    late: () => `
      <div class="big-emoji">😡</div>
      <h1>You are sooo late!</h1>
      <p class="sub">Even the extra hour is gone 💔<br/>The coffee is cold, the croissant is lonely, and he is <b>still</b> waiting for you…</p>
      <p class="clock-label">You are late by</p>
      ${clockHTML(true)}
      ${infoCard()}
      <div class="btns"><button class="btn" id="here">I’m here, sorry! 🥺</button></div>`,

    anniversary: () => `
      <div class="big-emoji">💞</div>
      <h1>Welcome, my love!</h1>
      <p class="sub">You came${arrivedAt && arrivedAt > MEETING ? ' (a little late 😏)' : ''}… and my whole day became beautiful 🌸</p>
      <div class="anniv-badge">💗 Happy 2nd Anniversary 💗</div>
      <p class="anniv-dates">28 · 10 · 2024 &nbsp;→&nbsp; 28 · 10 · 2026</p>
      <div class="together"><b id="days">0</b> days of us 💕</div>
      <div class="note" id="note"></div>
      <p class="clock-label">🎁 A secret surprise unlocks on 27 October at 11:00 PM</p>
      ${clockHTML(false)}
      <div class="lock">🎁<span>🔒</span></div>`,

    gifts: () => `
      <div class="big-emoji">🎉</div>
      <h1 class="shimmer">Happy Anniversary, my Princess! 👑</h1>
      <p class="sub">Congratulations on two beautiful years together 💞<br/>I have a little surprise for you…</p>
      <button class="gift-box" id="giftBox" aria-label="Open your gift">
        <img src="assets/gifts/box.webp" alt="A gift box for you" />
        <span class="tap">Tap to open your gift 🎁</span>
      </button>
      <div id="reveal" class="reveal" hidden>
        <div class="hero"><img src="assets/gifts/set.webp" alt="Princess Reef gift set" /></div>
        <h2>Princess Reef 👑</h2>
        <p class="sub">A whole princess set, for my princess 💗</p>
        <div class="gallery">
          ${giftItem('perfume.webp', 'Princess Reef Perfume', '100 ml · your new signature scent 🌸')}
          ${giftItem('glitter.webp', 'Perfume Glitter', '50 ml · so you sparkle even more ✨')}
          ${giftItem('mini.webp', 'Travel Perfume', '15 ml · so I’m always in your bag 👜')}
          ${giftItem('notes.jpg', 'How it smells', 'Bergamot, peony, rose, amber &amp; vanilla 🌹')}
        </div>
        <p class="love-letter">Every time you wear it, remember: you are loved, today, tomorrow and forever. 🤎</p>
      </div>`,
  };

  function giftItem(img, title, text) {
    return `<figure class="gift-item"><img src="assets/gifts/${img}" alt="${title}" loading="lazy" /><figcaption><b>${title}</b><span>${text}</span></figcaption></figure>`;
  }

  const NOTES = [
    'You are my favorite good morning ☀️',
    'Two years, and I still get butterflies 🦋',
    'Your smile is my favorite place in the world 😊',
    'Every day with you feels like a love story 📖💗',
    'Thank you for choosing me, every single day 🤎',
    'With you, even breakfast feels like a celebration 🥐☕',
    'Forever isn’t long enough with you ♾️',
  ];
  let noteTimer;

  function enterStage(s, prev) {
    document.body.className = 'stage-' + s;
    render(VIEWS[s]());
    clearInterval(noteTimer);

    const here = $('#here');
    if (here) here.onclick = askArrived;

    if (s === 'anniversary') {
      $('#days').textContent = Math.floor((now() - LOVE_START) / 86400000);
      let i = 0;
      const note = $('#note');
      const showNote = () => {
        note.classList.remove('show');
        setTimeout(() => { note.textContent = NOTES[i++ % NOTES.length]; note.classList.add('show'); }, 350);
      };
      showNote();
      noteTimer = setInterval(showNote, 4500);
      celebrate(prev ? 3500 : 1500);
    }

    if (s === 'gifts') {
      celebrate(4000);
      fireworks(prev ? 15 : 8);
      $('#giftBox').onclick = openGift;
      if (isPreview && params.get('open')) setTimeout(openGift, 1500);
    }

    if (s === 'grace' && prev === 'meeting') rain(['⏰', '😤', '☕'], 30, 2000);
    if (s === 'late' && prev === 'grace') rain(['💔', '😡', '⏰'], 30, 2000);
  }

  function openGift() {
    const box = $('#giftBox');
    box.classList.add('open');
    celebrate(4000);
    fireworks(6);
    setTimeout(() => {
      box.remove();
      const reveal = $('#reveal');
      reveal.hidden = false;
      reveal.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 900);
  }

  function askArrived() {
    showOverlay(`
      <div class="big-emoji">👀</div>
      <h2>Are you with him right now?</h2>
      <p class="sub">No cheating, ${NAME}… he can see you 😏</p>
      <div class="btns">
        <button class="btn" id="yes">Yes, I’m here! 🥰</button>
        <button class="btn ghost" id="no">Not yet 🙈</button>
      </div>`);
    overlay.querySelector('#no').onclick = hideOverlay;
    overlay.querySelector('#yes').onclick = () => { hideOverlay(); markArrived(); };
  }

  function markArrived() {
    arrivedAt = now();
    tick();
    if (isPreview) return;
    try { localStorage.setItem(ARRIVED_KEY, arrivedAt.toISOString()); } catch {}
    const send = (tries) => api('/api/arrived', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: NAME }),
    }).catch(() => { if (tries > 1) setTimeout(() => send(tries - 1), 30000); });
    send(10);
  }

  // ---------- main loop ----------
  function tick() {
    const t = now();
    const s = stageAt(t);
    if (s !== stage) {
      const prev = stage;
      stage = s;
      enterStage(s, prev);
    }
    const ms = clockValue(s, t);
    setClock(ms);
    if (s !== 'gifts') {
      const sec = Math.max(0, Math.floor(ms / 1000));
      const d = Math.floor(sec / 86400);
      document.title = `${s === 'late' ? '−' : ''}${d ? d + 'd ' : ''}${pad(Math.floor((sec % 86400) / 3600))}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)} · For You 💌`;
    } else {
      document.title = 'Happy Anniversary 👑💗';
    }
  }

  // Preview bar so he can see every page before the real time comes
  if (isPreview) {
    const bar = document.getElementById('preview-bar');
    const base = location.pathname;
    bar.innerHTML = '👀 Preview: ' + Object.keys(PREVIEW_TIMES)
      .map((p) => `<a href="${base}?preview=${p}" class="${p === preview ? 'on' : ''}">${p}</a>`).join('') +
      `<a href="${base}">real</a>`;
    bar.hidden = false;
  } else if (!arrivedAt) {
    // She may have tapped "I'm here" on another device
    api('/api/arrived').then((d) => {
      if (d.arrived && !arrivedAt) {
        arrivedAt = new Date(d.arrivedAt);
        try { localStorage.setItem(ARRIVED_KEY, arrivedAt.toISOString()); } catch {}
        tick();
      }
    }).catch(() => {});
  }

  // Wake the backends early
  if (!isPreview) API_URLS.forEach((base) => fetch(`${base}/api/health`).catch(() => {}));

  tick();
  setInterval(tick, 250);
})();
