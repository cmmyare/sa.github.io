(() => {
  const API_URL = window.MEET_API_URL;
  const MAX_DATE = '2026-10-23'; // Friday next week — last day she can pick
  const ANNIVERSARY = '28/10/2026';

  const card = document.getElementById('card');
  const overlay = document.getElementById('overlay');
  const progress = document.getElementById('progress');

  const answers = {};
  const STEP_ICONS = ['💌', '🥺', '💗', '💞', '😍', '💍', '☕', '📍', '🎉'];

  // ---------- helpers ----------
  const $ = (sel, root = card) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function todayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function prettyDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function prettyTime(t) {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  function levenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[a.length][b.length];
  }

  // Saabira, SABIRA, sabiraa, Saabirah, sabeera... all count 🤎
  function isSaabira(value) {
    const s = value.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
    if (!s) return false;
    if (/^sa+b+(i+|e+)r+a+h?$/.test(s)) return true;
    return levenshtein(s, 'saabira') <= 2 || levenshtein(s, 'sabira') <= 1;
  }

  function shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  function setProgress(i) {
    progress.innerHTML = STEP_ICONS.map((e, idx) =>
      `<span class="dot ${idx < i ? 'done' : idx === i ? 'now' : ''}">${e}</span>`).join('');
  }

  function render(html, stepIndex) {
    if (stepIndex !== undefined) setProgress(stepIndex);
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = '';
    card.innerHTML = html;
  }

  // ---------- background magic ----------
  const HEARTS = ['🤎', '💗', '💕', '💖', '🤍', '🌸', '💞', '🍫'];
  function spawnHeart() {
    const h = document.createElement('span');
    h.className = 'float-heart';
    h.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
    h.style.left = Math.random() * 100 + 'vw';
    h.style.fontSize = 14 + Math.random() * 26 + 'px';
    h.style.animationDuration = 7 + Math.random() * 8 + 's';
    document.getElementById('hearts-bg').appendChild(h);
    setTimeout(() => h.remove(), 16000);
  }
  for (let i = 0; i < 10; i++) setTimeout(spawnHeart, i * 400);
  setInterval(spawnHeart, 900);

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

  function celebrate() {
    rain(['🌹', '🌸', '💐', '🌷', '🌺', '💗', '🤎', '💖', '🎉'], 90, 5000);
    if (typeof confetti !== 'function') return;
    const colors = ['#e8798f', '#c94f6d', '#c8875a', '#8a5534', '#fbd9df', '#ffffff'];
    const heart = confetti.shapeFromPath ? confetti.shapeFromPath({ path: 'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z' }) : undefined;
    const end = Date.now() + 3500;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors, shapes: heart ? [heart, 'circle'] : undefined, scalar: 1.4 });
      confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors, shapes: heart ? [heart, 'circle'] : undefined, scalar: 1.4 });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    confetti({ particleCount: 160, spread: 120, origin: { y: 0.45 }, colors, scalar: 1.2 });
  }

  function showOverlay(html) {
    overlay.innerHTML = `<div class="card">${html}</div>`;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { overlay.classList.add('hidden'); overlay.innerHTML = ''; }

  // A "No" button that refuses to be clicked 😜
  function makeRunaway(btn) {
    const escape = (e) => {
      e.preventDefault();
      const box = btn.parentElement.getBoundingClientRect();
      const maxX = Math.max(0, box.width - btn.offsetWidth);
      btn.style.position = 'absolute';
      btn.style.left = Math.random() * maxX + 'px';
      btn.style.top = (Math.random() > 0.5 ? -1 : 1) * (20 + Math.random() * 40) + 'px';
      const lines = ['Nope 😜', 'Try again 🙈', 'Not allowed 🤭', 'Liar 😏', 'Hehe 🤎'];
      btn.textContent = lines[Math.floor(Math.random() * lines.length)];
    };
    btn.addEventListener('mouseenter', escape);
    btn.addEventListener('touchstart', escape, { passive: false });
    btn.addEventListener('click', escape);
  }

  // A tiny reply between questions
  function reaction(emoji, title, text, next, delay = 1700) {
    render(`
      <div class="big-emoji">${emoji}</div>
      <h2>${title}</h2>
      <p class="sub">${text}</p>
    `);
    rain([emoji, '💗', '🤎'], 18, 1200);
    setTimeout(next, delay);
  }

  // ---------- steps ----------
  function stepWelcome() {
    render(`
      <div class="big-emoji">💌</div>
      <h1>Hey there, beautiful</h1>
      <p class="sub">Someone who loves you so much made this little surprise. Answer honestly… he is watching 👀🤎</p>
      <div class="btns"><button class="btn" id="go">Open my surprise 🎁</button></div>
    `, 0);
    $('#go').onclick = stepName;
  }

  function stepName() {
    render(`
      <div class="big-emoji">🥰</div>
      <h2>What is the name your love always calls you?</h2>
      <p class="sub">Only the real one knows it… 🤫</p>
      <input class="field" id="name" placeholder="Type your name here 💗" autocomplete="off" maxlength="40" />
      <p class="hint" id="hint"></p>
      <div class="btns"><button class="btn" id="next">That's me 💁‍♀️</button></div>
    `, 0);
    const input = $('#name');
    input.focus();
    const tries = ['Hmm… that’s not what he calls you 🤔', 'Nope! Think harder, my love 😜', 'He calls you something sweeter 🍯', 'Last hint: it starts with “S” 🤎'];
    let n = 0;
    const submit = () => {
      if (isSaabira(input.value)) {
        answers.name = input.value.trim();
        reaction('😍', 'Saabira! 💖', 'I knew it was you, my queen 👑', stepMiss);
      } else {
        $('#hint').textContent = tries[Math.min(n++, tries.length - 1)];
        shake(input);
      }
    };
    $('#next').onclick = submit;
    input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  }

  function stepMiss() {
    render(`
      <div class="big-emoji">🥺</div>
      <h2>Do you miss him?</h2>
      <p class="sub">Be honest, ${esc(answers.name)}… 🤎</p>
      <div class="btns">
        <button class="btn" id="yes">Yes, so much 🥹</button>
        <button class="btn ghost runaway" id="no">No 🙄</button>
      </div>
    `, 1);
    makeRunaway($('#no'));
    $('#yes').onclick = () => {
      answers.missesHim = true;
      reaction('🥹', 'Awww!', 'He misses you even more — every single second 💞', stepLoveMeter);
    };
  }

  function stepLoveMeter() {
    render(`
      <div class="big-emoji">💗</div>
      <h2>How much do you love him?</h2>
      <div class="meter-val" id="val">50%</div>
      <input type="range" id="meter" min="0" max="100" value="50" />
      <div class="meter-msg" id="msg">Hmm… only half? 🤨</div>
      <div class="btns"><button class="btn" id="next">That's my answer 💘</button></div>
    `, 2);
    const meter = $('#meter');
    const msgs = [
      [20, 'Excuse me?! 😤'], [40, 'That’s it?? 😒'], [60, 'Hmm… only half? 🤨'],
      [80, 'Getting warmer 🔥'], [99, 'Sooo close 😍'], [100, 'TO INFINITY! 💖🤎💖'],
    ];
    const update = () => {
      const v = Number(meter.value);
      $('#val').textContent = v === 100 ? '∞%' : v + '%';
      $('#msg').textContent = msgs.find(([max]) => v <= max)[1];
    };
    meter.oninput = update;
    update();
    $('#next').onclick = () => {
      if (Number(meter.value) < 100) {
        $('#msg').textContent = 'Wrong answer! Slide it all the way 😤💗';
        shake(meter);
        return;
      }
      answers.loveLevel = 'infinity';
      reaction('🥰', 'To infinity and beyond!', 'He loves you more than all the stars in the sky ✨', stepFellFirst);
    };
  }

  function choiceStep({ index, emoji, title, sub, key, options, react }) {
    render(`
      <div class="big-emoji">${emoji}</div>
      <h2>${title}</h2>
      ${sub ? `<p class="sub">${sub}</p>` : ''}
      <div class="choices">
        ${options.map((o, i) => `<button class="choice" data-i="${i}"><span class="e">${o.e}</span>${o.t}</button>`).join('')}
      </div>
    `, index);
    card.querySelectorAll('.choice').forEach((btn) => {
      btn.onclick = () => {
        const o = options[Number(btn.dataset.i)];
        btn.classList.add('picked');
        answers[key] = o.t;
        setTimeout(() => react(o), 350);
      };
    });
  }

  function stepFellFirst() {
    choiceStep({
      index: 3, emoji: '💞', key: 'fellInLoveFirst',
      title: 'Who fell in love first?',
      options: [
        { e: '🙋‍♀️', t: 'Me' }, { e: '🙋‍♂️', t: 'Him' },
        { e: '💘', t: 'Both at once' }, { e: '🤭', t: 'Secret' },
      ],
      react: (o) => {
        const r = {
          Me: ['😏', 'Ooh, you admit it!', 'But he fell harder, trust me 🤎'],
          Him: ['😌', 'Correct!', 'He fell the moment he saw your smile 💗'],
          'Both at once': ['💘', 'Destiny!', 'Two hearts, one beat 💓'],
          Secret: ['🤫', 'Hehe, mysterious!', 'He already knows the answer anyway 😜'],
        }[o.t];
        reaction(r[0], r[1], r[2], stepFavorite);
      },
    });
  }

  function stepFavorite() {
    choiceStep({
      index: 4, emoji: '😍', key: 'favoriteThing',
      title: 'What do you love most about him?',
      options: [
        { e: '😊', t: 'His smile' }, { e: '🤗', t: 'His hugs' },
        { e: '😂', t: 'His jokes' }, { e: '💯', t: 'Everything!' },
      ],
      react: (o) => reaction('🥹', `${o.t.replace('!', '')}? Aww!`, 'And he loves EVERYTHING about you, from head to toe 🤎', stepForever),
    });
  }

  function stepForever() {
    render(`
      <div class="big-emoji">💍</div>
      <h2>Will you be his forever?</h2>
      <p class="sub">Think carefully… there is only one right answer 😌</p>
      <div class="btns">
        <button class="btn" data-a="Yes">Yes 💗</button>
        <button class="btn brown" data-a="Of course">Of course 🤎</button>
        <button class="btn" data-a="Forever and always">Forever &amp; always ♾️</button>
      </div>
    `, 5);
    card.querySelectorAll('[data-a]').forEach((b) => {
      b.onclick = () => {
        answers.forever = b.dataset.a;
        celebrate();
        reaction('💍', 'He’s the luckiest man alive!', 'Now… let’s plan a sweet date together ☕🥐', stepBreakfast, 2300);
      };
    });
  }

  function stepBreakfast() {
    const min = todayISO();
    render(`
      <div class="big-emoji">☕</div>
      <h2>When do you want to have breakfast with him?</h2>
      <p class="sub">Pick a day and a time for your breakfast date 🥐🍳</p>
      <div class="row">
        <div>
          <label class="lbl" for="date">📅 Day</label>
          <input class="field" type="date" id="date" min="${min}" />
        </div>
        <div>
          <label class="lbl" for="time">⏰ Time</label>
          <input class="field" type="time" id="time" value="09:00" />
        </div>
      </div>
      <div class="chips">
        ${['07:30', '08:00', '09:00', '10:00', '11:00'].map((t) => `<button class="chip" data-t="${t}">${prettyTime(t)}</button>`).join('')}
      </div>
      <p class="hint" id="hint"></p>
      <div class="btns"><button class="btn" id="next">Book my date 💕</button></div>
    `, 6);
    if (answers.breakfastDate) $('#date').value = answers.breakfastDate;
    card.querySelectorAll('.chip').forEach((c) => {
      c.onclick = () => {
        $('#time').value = c.dataset.t;
        card.querySelectorAll('.chip').forEach((x) => x.classList.toggle('picked', x === c));
      };
    });
    $('#next').onclick = () => {
      const date = $('#date').value;
      const time = $('#time').value;
      if (!date) { $('#hint').textContent = 'Pick a day first, my love 📅'; shake($('#date')); return; }
      if (!time) { $('#hint').textContent = 'And a time please ⏰'; shake($('#time')); return; }
      if (date < min || date > MAX_DATE) {
        const tooEarly = date < min;
        showOverlay(`
          <div class="cry">😭</div>
          <div class="tears">💧💧💧</div>
          <h2>${tooEarly ? 'That day is already gone!' : 'Nooo, that’s too far away!'}</h2>
          <p class="sub">${tooEarly
            ? 'We can’t go back in time, silly 🥺'
            : `He can’t wait that long to see you 💔<br/>Please choose a day before <b>${prettyDate(MAX_DATE)}</b> 🙏`}</p>
          <div class="btns"><button class="btn" id="again">Okay, I’ll choose again 🥺</button></div>
        `);
        overlay.querySelector('#again').onclick = () => { hideOverlay(); $('#date').value = ''; $('#date').focus(); };
        return;
      }
      answers.breakfastDate = date;
      answers.breakfastTime = time;
      reaction('🥐', 'It’s a date!', `${prettyDate(date)} at ${prettyTime(time)} 💗<br/>He’s already counting the hours ⏳`, stepPlace, 2200);
    };
  }

  function stepPlace() {
    render(`
      <div class="big-emoji">📍</div>
      <h2>Where do you plan to meet?</h2>
      <p class="sub">Anywhere is perfect when you’re there 🤎</p>
      <input class="field" id="place" placeholder="Type the place 🗺️" maxlength="120" autocomplete="off" />
      <div class="chips">
        ${['☕ A cozy café', '🏖️ By the beach', '🏨 Hotel restaurant', '🌳 In the park', '🏠 Surprise me!'].map((p) => `<button class="chip">${p}</button>`).join('')}
      </div>
      <p class="hint" id="hint"></p>
      <div class="btns"><button class="btn" id="next">That’s the spot 💞</button></div>
    `, 7);
    const input = $('#place');
    input.focus();
    card.querySelectorAll('.chip').forEach((c) => { c.onclick = () => { input.value = c.textContent; }; });
    const submit = () => {
      const place = input.value.trim();
      if (place.length < 2) { $('#hint').textContent = 'Tell him where to find you 🥺'; shake(input); return; }
      answers.place = place;
      reaction('🗺️', 'Perfect choice!', 'He’ll be there early, with the biggest smile 😁', stepAnniversary);
    };
    $('#next').onclick = submit;
    input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  }

  function stepAnniversary() {
    render(`
      <div class="big-emoji">🗓️</div>
      <h2>Do you remember this date?</h2>
      <div class="date-badge">${ANNIVERSARY}</div>
      <p class="sub" style="margin-top:14px">It’s the <b>2nd anniversary</b> of our love 💞<br/>Did you remember?</p>
      <div class="btns">
        <button class="btn" id="yes">Yes, of course! 💖</button>
        <button class="btn ghost" id="no">Ehh… I forgot 🙈</button>
      </div>
    `, 8);
    $('#yes').onclick = () => { answers.remembersAnniversary = true; stepCelebration(); };
    $('#no').onclick = () => {
      answers.remembersAnniversary = false;
      showOverlay(`
        <div class="cry">😤</div>
        <h2>How could you forget?!</h2>
        <p class="sub">Two whole years of love, ${esc(answers.name)}! 💔<br/>Okay okay… he forgives you, because he loves you 🤎</p>
        <div class="btns"><button class="btn" id="ok">Sorry, I remember now 🥺💗</button></div>
      `);
      overlay.querySelector('#ok').onclick = () => { hideOverlay(); stepCelebration(); };
    };
  }

  function stepCelebration() {
    setProgress(STEP_ICONS.length);
    celebrate();
    render(`
      <div class="big-emoji">🎉</div>
      <h1>Happy 2nd Anniversary!</h1>
      <p class="sub">🌹 Two years of laughter, hugs, and love 🌹<br/>Here’s to forever together, my love 💞🤎</p>
      <div class="big-emoji" style="font-size:3rem">💐🌷🌸🌺🌹</div>
      <p class="hint" id="status"><span class="spinner">💌</span><br/>Sending your answers to him…</p>
    `);
    setTimeout(save, 1800);
  }

  async function save() {
    const status = $('#status');
    try {
      const res = await fetch(`${API_URL}/api/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        stepDone(answers);
        return;
      }
      throw new Error(data.error || 'Something went wrong');
    } catch (err) {
      status.innerHTML = `Oops, the love letter got lost 🥺<br/><small>${esc(err.message)}</small>`;
      const btns = document.createElement('div');
      btns.className = 'btns';
      btns.innerHTML = '<button class="btn" id="retry">Send again 💌</button>';
      card.appendChild(btns);
      $('#retry').onclick = () => { btns.remove(); status.innerHTML = '<span class="spinner">💌</span><br/>Sending again…'; save(); };
    }
  }

  function stepDone(a) {
    setProgress(STEP_ICONS.length);
    render(`
      <div class="big-emoji">💌</div>
      <h1>Sent with love!</h1>
      <p class="sub">He got your answers, ${esc(a.name || 'my love')} 🤎</p>
      ${a.breakfastDate ? `
      <div class="summary">
        📅 <b>Day:</b> ${prettyDate(a.breakfastDate)}<br/>
        ⏰ <b>Time:</b> ${prettyTime(a.breakfastTime)}<br/>
        📍 <b>Place:</b> ${esc(a.place)}<br/>
        💞 <b>Anniversary:</b> ${ANNIVERSARY}
      </div>` : ''}
      <p class="love-letter">See you soon, my love… ☕🥐💗</p>
    `);
  }

  // ---------- start ----------
  // Wake the backend early so saving at the end is fast
  fetch(`${API_URL}/api/health`).catch(() => {});
  stepWelcome();
})();
