// 👾 외계인 단어 디펜스: 단어를 머리 위에 단 외계인들이 천천히 내려와요.
// 미션에 맞는 단어(예: 동사)를 단 외계인만 대포로 쏴요. 다른 외계인은 방어벽이 흡수해요.
// ← → 로 대포를 옮기고 스페이스·엔터로 쏴요. 태블릿은 화면을 톡 누르면 그곳으로 가서 쏴요.
// 구구단 놀이터에서 열면(?mul=1) 위에 나온 구구단의 정답 숫자를 단 외계인을 쏴요.
(function () {
  "use strict";

  const $ = s => document.querySelector(s);
  const ML = window.MulLink, MATH = ML.on;
  const GROUPS = window.ALIEN_GROUPS;
  const GOAL = 15, LIVES = 5;
  const PROFILES_KEY = "alien_profiles", GUIDE_ID = MATH ? "alien_mul" : "alien";
  const SOUND = !MATH || ML.sound;
  const ALIEN_COLORS = ["#4ade80", "#f472b6", "#60a5fa", "#fbbf24", "#a78bfa", "#2dd4bf", "#fb923c"];

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable, ignore */ } }
  };
  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  function show(id) { document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id)); }

  /* ---------- 소리 ---------- */
  let actx = null;
  function tone(freq, dur, type = "sine", when = 0, vol = 0.12, slide) {
    if (!SOUND) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime + when;
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t); o.stop(t + dur);
    } catch (e) { /* audio unavailable, ignore */ }
  }
  const sfx = {
    shoot() { tone(900, 0.12, "square", 0, 0.035, 300); },
    hit() { tone(660, 0.1, "triangle", 0, 0.14); tone(990, 0.16, "triangle", 0.07, 0.12); tone(1320, 0.18, "sine", 0.14, 0.08); },
    wrong() { tone(220, 0.22, "square", 0, 0.06); tone(150, 0.3, "sine", 0.1, 0.1); },
    absorb() { tone(520, 0.12, "sine", 0, 0.06, 780); },
    hurt() { tone(160, 0.35, "sawtooth", 0, 0.05, 80); },
    win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", i * 0.1, 0.12)); }
  };
  function speak(text, lang) {
    if (!SOUND || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang || "en-US"; u.rate = lang ? 0.95 : 0.85; u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch (e) { /* speech unavailable, ignore */ }
  }

  /* ---------- 효과 ---------- */
  function floatAt(x, y, text, color) {
    const f = document.createElement("div");
    f.className = "float-text"; f.textContent = text;
    f.style.left = x + "px"; f.style.top = y + "px";
    if (color) f.style.color = color;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1000);
  }
  function confetti(n) {
    const bits = ["🎉", "🎊", "⭐", "👾", "🚀", "🌟", "🪐"];
    for (let k = 0; k < n; k++) {
      const c = document.createElement("div");
      c.className = "confetti"; c.textContent = pick(bits);
      c.style.left = Math.random() * 100 + "vw";
      c.style.animationDuration = rand(22, 40) / 10 + "s";
      c.style.animationDelay = Math.random() + "s";
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 5500);
    }
  }
  function animate(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  const msg = t => { $("#game-msg").textContent = t; };

  /* ---------- 사용자 (영어 놀이: 이 기기에만 저장, 게스트는 저장 안 함) ---------- */
  let user = null, guest = false, guestData = null;
  const loadProfiles = () => store.get(PROFILES_KEY, {});
  const userData = () => guest ? guestData : (loadProfiles()[user] || { best: {} });
  function saveUserData(d) {
    if (guest) { guestData = d; return; }
    const p = loadProfiles(); p[user] = d; store.set(PROFILES_KEY, p);
  }
  function enterAs(name) {
    guest = !name; user = name;
    if (guest) guestData = { best: {} };
    else if (!loadProfiles()[name]) saveUserData({ best: {} });
    document.querySelectorAll(".user-badge").forEach(el => { el.textContent = "👤 " + (name || "게스트"); });
    renderModes(); show("screen-mode");
  }
  function renderUserList() {
    const l = $("#user-list"); l.innerHTML = "";
    const names = Object.keys(loadProfiles());
    if (!names.length) { l.innerHTML = '<div class="user-empty-hint">저장된 사용자가 없어요. 새 이름으로 시작해보세요!</div>'; return; }
    names.forEach(name => {
      const b = document.createElement("button");
      b.className = "user-item-btn"; b.textContent = "👤 " + name;
      b.addEventListener("click", () => enterAs(name));
      l.appendChild(b);
    });
  }
  function submitNewUser() {
    const name = $("#user-name-input").value.trim();
    if (!name) { $("#user-name-input").focus(); return; }
    enterAs(name);
  }
  $("#btn-start").addEventListener("click", () => {
    if (MATH) { choose(); return; }
    renderUserList(); $("#user-name-input").value = ""; show("screen-user");
  });
  $("#btn-user-new").addEventListener("click", submitNewUser);
  $("#user-name-input").addEventListener("keydown", e => { if (e.key === "Enter") submitNewUser(); });
  $("#btn-user-guest").addEventListener("click", () => enterAs(null));
  $("#btn-user-back").addEventListener("click", () => show("screen-title"));
  $("#btn-mode-back").addEventListener("click", () => show("screen-title"));

  /* ---------- 미션 고르기 ---------- */
  const MODE_BG = { action: ["#ffe4e6", "#be123c"], thing: ["#e1efff", "#1d4ed8"], animal: ["#ecfccb", "#4d7c0f"], food: ["#ffedd5", "#c2410c"], color: ["#f3e8ff", "#7e22ce"] };
  let mode = "action";
  function renderModes() {
    const g = $("#mode-grid"); g.innerHTML = "";
    const best = userData().best || {};
    Object.keys(GROUPS).forEach(id => {
      const m = GROUPS[id];
      const b = document.createElement("button");
      b.className = "level-btn"; b.type = "button";
      b.style.setProperty("--bg", MODE_BG[id][0]); b.style.setProperty("--c", MODE_BG[id][1]);
      b.innerHTML = '<span class="lv-emoji">' + m.emoji + '</span><span class="lv-name">' + m.name + "</span>" +
        '<span class="lv-desc">' + m.mission + '</span><span class="lv-best">' + (best[id] ? "⭐ 내 최고 " + best[id] + "점" : "아직 기록이 없어요") +
        '</span><span class="lv-go">출동 ▶</span>';
      b.addEventListener("click", () => { mode = id; choose(); });
      g.appendChild(b);
    });
  }
  function guide(onStart) {
    return {
      id: GUIDE_ID, title: MATH ? "구구단 디펜스" : "외계인 단어 디펜스",
      pages: [
        { icon: "👾", title: "외계인이 내려와요", text: MATH ? "외계인들이 <b>숫자</b>를 머리 위에 달고<br>천천히 내려와요." : "귀여운 외계인들이 <b>영어 단어</b>를 머리 위에 달고<br>천천히 내려와요." },
        { icon: "🎯", title: "미션을 봐요", text: MATH ? "위에 나온 <b>구구단의 정답</b> 숫자를 단 외계인만 쏴요!<br>예) 6 × 7 → <b>42</b>" : "위에 나온 <b>미션</b>에 맞는 단어만 쏴요!<br>예) 동사 미션 → <b>run, jump</b> 는 쏘고, <b>book</b> 은 그냥 둬요." },
        { icon: "⬅️➡️", title: "대포 쏘기", text: "<b>← →</b> 로 대포를 옮기고 <b>스페이스바</b>(또는 엔터)로 쏴요.<br>태블릿은 외계인을 <b>톡</b> 누르면 그쪽으로 가서 쏴요." },
        { icon: "🛡️", title: "방어벽", text: "다른 외계인은 쏘지 말고 두면 <b>방어벽</b>이 흡수해요.<br>잘못 쏘거나, 맞는 외계인을 놓치면 ❤️ 하트가 하나 줄어요." },
        { icon: "🏆", title: GOAL + "마리 물리치기", text: "맞는 외계인을 <b>" + GOAL + "마리</b> 물리치면 지구를 지켜요!<br>한 마리에 <b>+10점</b>, 연속이면 더!" }
      ],
      startText: "자, 지구를 지켜 볼까?",
      startLabel: "출동! 🚀",
      onStart
    };
  }
  function choose() {
    if (!GuideBook.isRead(GUIDE_ID)) GuideBook.open(guide(startGame));
    else startGame();
  }
  $("#btn-guide").addEventListener("click", () => GuideBook.open(guide(null)));

  /* ---------- 게임 상태 ---------- */
  const canvas = $("#space-canvas"), ctx = canvas.getContext("2d");
  const G = {
    W: 0, H: 0, raf: 0, last: 0, t: 0, active: false, tok: 0,
    cx: 0.5, target: null, autoFire: false, keys: { l: false, r: false }, cool: 0, recoil: 0,
    aliens: [], bullets: [], bits: [], spawnT: 0, speed: 0.05,
    lives: LIVES, score: 0, combo: 0, kills: 0, wrongShots: 0, learned: [], shieldFlash: 0, shieldHurt: 0, stars: [],
    q: null, qs: [], qi: 0, ending: 0
  };
  function resize() {
    const r = $("#field").getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    G.W = r.width; G.H = r.height;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", () => { if (G.active) resize(); });
  const shieldY = () => G.H - Math.max(70, G.H * 0.17);
  const cannonY = () => G.H - Math.max(26, G.H * 0.06);
  const alienR = () => Math.max(18, Math.min(34, Math.min(G.W, G.H) * 0.05));

  /* ---------- 단어 · 문제 ---------- */
  let targetPool = [], otherPool = [];
  function setupPools() {
    if (MATH) return;
    targetPool = GROUPS[mode].words.slice();
    otherPool = [];
    Object.keys(GROUPS).forEach(id => { if (id !== mode) otherPool = otherPool.concat(GROUPS[id].words); });
  }
  function isTarget(a) { return MATH ? G.q && a.num === G.q.ans : a.target; }
  function nextMathQuestion() {
    if (G.qi >= G.qs.length) G.qs = G.qs.concat(ML.questions(GOAL));
    const [a, b] = G.qs[G.qi++];
    G.q = { a, b, ans: a * b };
    $("#mission-text").innerHTML = '<span class="eq">' + a + " × " + b + " = ?</span>정답 외계인을 쏘세요!";
    animate($("#mission"), "pop");
    // 정답 외계인이 화면에 없으면 곧 내려보내요
    if (!G.aliens.some(x => !x.dead && x.num === G.q.ans)) G.spawnT = Math.min(G.spawnT, 0.5);
  }

  function spawn() {
    const live = G.aliens.filter(a => !a.dead);
    if (live.length >= 6) { G.spawnT = 0.6; return; }
    const r = alienR();
    // 위쪽에서 다른 외계인과 겹치지 않는 자리
    let x = 0.5, tries = 0;
    do { x = 0.1 + Math.random() * 0.8; tries++; } while (tries < 20 && live.some(a => a.y < r * 5 && Math.abs(a.x - x) * G.W < r * 4.2));
    const a = { x, y: -r * 2.2, r, ph: Math.random() * 6, color: pick(ALIEN_COLORS), dead: false, wrong: 0, eyes: Math.random() < 0.4 ? 1 : 2, vy: G.speed * (0.85 + Math.random() * 0.3) };
    if (MATH) {
      const hasAns = live.some(o => o.num === G.q.ans);
      const want = !hasAns && Math.random() < 0.75;
      const nums = ML.choices(G.q.a, G.q.b, 4);
      a.num = want ? G.q.ans : pick(nums.filter(n => n !== G.q.ans));
      a.word = String(a.num);
    } else {
      const targets = live.filter(o => o.target).length;
      a.target = targets === 0 ? Math.random() < 0.8 : Math.random() < 0.42;
      const w = pick(a.target ? targetPool : otherPool);
      a.word = w[0]; a.ko = w[1];
    }
    G.aliens.push(a);
    G.spawnT = Math.max(1.0, 2.3 - G.kills * 0.06) * (0.8 + Math.random() * 0.4);
  }

  /* ---------- 시작 · 끝 ---------- */
  function startGame() {
    stopGame();
    setupPools();
    Object.assign(G, {
      active: true, cx: 0.5, target: null, autoFire: false, cool: 0, recoil: 0, aliens: [], bullets: [], bits: [], spawnT: 0.3,
      speed: 0.045, lives: LIVES, score: 0, combo: 0, kills: 0, wrongShots: 0, learned: [], shieldFlash: 0, shieldHurt: 0,
      q: null, qs: MATH ? ML.questions(GOAL) : [], qi: 0, ending: 0, t: 0
    });
    G.keys.l = G.keys.r = false;
    G.tok++;
    G.stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 1.6 + 0.4, tw: Math.random() * 6 }));
    $("#hud-score").textContent = "0";
    renderHearts(); renderKills();
    show("screen-game");
    resize();
    if (MATH) { $("#mission-emoji").textContent = "🔢"; nextMathQuestion(); }
    else { $("#mission-emoji").textContent = GROUPS[mode].emoji; $("#mission-text").textContent = GROUPS[mode].mission; animate($("#mission"), "pop"); }
    msg("← → 로 움직이고 스페이스바로 쏴요! 🚀");
    G.last = performance.now();
    G.raf = requestAnimationFrame(frame);
  }
  function stopGame() { G.active = false; G.tok++; cancelAnimationFrame(G.raf); }
  function renderHearts(justLost) {
    let h = "";
    for (let k = 0; k < LIVES; k++) h += k < G.lives ? "❤️" : '<span class="' + (justLost && k === G.lives ? "lost" : "") + '" style="opacity:.35">🤍</span>';
    $("#hearts").innerHTML = h;
  }
  const renderKills = () => { $("#hud-kill").textContent = G.kills + " / " + GOAL; };
  function addScore(n) {
    G.score += n;
    $("#hud-score").textContent = G.score;
    animate($("#hud-score-box"), "bump");
  }
  function loseLife() {
    G.lives--;
    G.combo = 0;
    renderHearts(true);
    sfx.hurt();
    if (G.lives <= 0 && !G.ending) { G.ending = 1.2; msg("하트를 다 썼어요… 😢"); }
  }
  function screenXY(x, y) { const r = canvas.getBoundingClientRect(); return [r.left + x, r.top + y]; }

  /* ---------- 쏘기 ---------- */
  function fire() {
    if (!G.active || G.ending || G.cool > 0) return;
    G.cool = 0.28; G.recoil = 0.12;
    G.bullets.push({ x: G.cx * G.W, y: cannonY() - 34 });
    sfx.shoot();
  }
  function hitAlien(a, b) {
    const [sx, sy] = screenXY(a.x * G.W, a.y);
    if (isTarget(a)) {
      a.dead = true;
      G.kills++; G.combo++;
      const gain = 10 + Math.min(G.combo - 1, 5) * 2;
      addScore(gain);
      sfx.hit();
      burst(a.x * G.W, a.y, a.color);
      floatAt(sx, sy - a.r, "+" + gain, "#7c3aed");
      renderKills();
      if (MATH) {
        G.learned.push({ en: G.q.a + " × " + G.q.b + " = " + G.q.ans });
        msg("딩동! " + G.q.a + " × " + G.q.b + " = " + G.q.ans + " 🎉" + (G.combo >= 2 ? "  🔥 " + G.combo + "연속!" : ""));
        speak(G.q.a + " 곱하기 " + G.q.b + "는 " + G.q.ans, "ko-KR");
        if (G.kills < GOAL) nextMathQuestion();
      } else {
        if (!G.learned.some(w => w.en === a.word)) G.learned.push({ en: a.word, ko: a.ko });
        msg("명중! " + a.word + " = " + a.ko + " 🎯" + (G.combo >= 2 ? "  🔥 " + G.combo + "연속!" : ""));
        speak(a.word);
      }
      G.speed = Math.min(0.11, G.speed + 0.003);
      if (G.kills >= GOAL && !G.ending) { G.ending = 1.4; G.win = true; sfx.win(); confetti(30); msg("🎉 외계인을 다 물리쳤어요! 지구를 지켰어요!"); }
    } else {
      // 쏘면 안 되는 외계인: 놀라서 흐려지고 하트 -1 (다시 맞아도 괜찮아요)
      a.wrong = 1;
      G.wrongShots++;
      sfx.wrong();
      floatAt(sx, sy - a.r, "앗! ❤️-1", "#ef4444");
      msg(MATH ? "앗! " + a.num + " 은(는) 정답이 아니에요. " + G.q.a + " × " + G.q.b + " = ?" : "앗! " + a.word + " (" + a.ko + ") 은(는) " + GROUPS[mode].name + "이(가) 아니에요!");
      loseLife();
    }
    void b;
  }
  function burst(x, y, color) {
    for (let k = 0; k < 16; k++) {
      const an = Math.random() * Math.PI * 2, sp = 80 + Math.random() * 180;
      G.bits.push({ x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, t: 0, c: k % 3 ? color : "#fde68a" });
    }
  }

  /* ---------- 매 프레임 ---------- */
  function frame(now) {
    if (!G.active) return;
    const dt = Math.min(0.05, (now - G.last) / 1000);
    G.last = now; G.t += dt;
    // 대포 움직이기
    let dir = (G.keys.r ? 1 : 0) - (G.keys.l ? 1 : 0);
    if (dir) G.target = null;
    else if (G.target != null) {
      const d = G.target - G.cx;
      if (Math.abs(d) < 0.006) { G.target = null; if (G.autoFire) { G.autoFire = false; fire(); } }
      else dir = Math.max(-1, Math.min(1, d * 14));
    }
    const margin = 0.05;
    G.cx = Math.max(margin, Math.min(1 - margin, G.cx + dir * 0.75 * dt * Math.min(1.6, 700 / Math.max(300, G.W))));
    G.cool = Math.max(0, G.cool - dt);
    G.recoil = Math.max(0, G.recoil - dt);
    if (!G.ending && (G.spawnT -= dt) <= 0) spawn();
    // 총알
    G.bullets.forEach(b => { b.y -= G.H * 1.5 * dt; });
    G.bullets = G.bullets.filter(b => {
      if (b.y < -20) return false;
      for (const a of G.aliens) {
        if (a.dead || a.wrong) continue;
        const sw = signW(a) / 2;
        const hx = Math.max(a.r * 1.05, sw), top = a.y - a.r * 2.6, bot = a.y + a.r;
        const ax = a.drawX != null ? a.drawX : a.x * G.W;
        if (Math.abs(b.x - ax) < hx && b.y > top && b.y < bot) { hitAlien(a, b); return false; }
      }
      return true;
    });
    // 외계인
    const sy = shieldY();
    G.aliens.forEach(a => {
      if (a.dead) return;
      a.y += a.vy * G.H * dt * (G.ending ? 0 : 1);
      if (a.wrong) a.wrong = Math.max(0.35, a.wrong - dt * 0.8);
      if (a.y + a.r >= sy && !G.ending) {
        a.dead = true;
        const [sx, sy2] = screenXY(a.x * G.W, sy);
        if (isTarget(a)) {
          G.shieldHurt = 0.6;
          floatAt(sx, sy2 - 20, "놓쳤어요! ❤️-1", "#ef4444");
          if (MATH) { msg("놓쳤어요! " + G.q.a + " × " + G.q.b + " = " + G.q.ans + " 이에요"); loseLife(); if (!G.ending) nextMathQuestion(); }
          else { msg("놓쳤어요! " + a.word + " (" + a.ko + ") 은(는) 쏴야 했어요"); loseLife(); }
        } else {
          G.shieldFlash = 0.5;
          sfx.absorb();
          burst(a.x * G.W, sy, "#93c5fd");
        }
      }
    });
    G.aliens = G.aliens.filter(a => !a.dead);
    G.bits.forEach(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; });
    G.bits = G.bits.filter(p => p.t < 0.7);
    G.shieldFlash = Math.max(0, G.shieldFlash - dt);
    G.shieldHurt = Math.max(0, G.shieldHurt - dt);
    if (G.ending && (G.ending -= dt) <= 0) { G.ending = 0; endGame(); return; }
    draw();
    G.raf = requestAnimationFrame(frame);
  }

  /* ---------- 그리기 ---------- */
  function signW(a) {
    const fs = signFont(a);
    ctx.font = "800 " + fs + "px Nunito, Pretendard, sans-serif";
    return ctx.measureText(a.word).width + fs * 1.0;
  }
  const signFont = a => Math.max(13, a.r * 0.78);
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function draw() {
    const { W, H, t } = G;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1e1b4b"); bg.addColorStop(1, "#4c1d95");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    G.stars.forEach(s => {
      ctx.globalAlpha = 0.5 + Math.sin(t * 2 + s.tw) * 0.4;
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.s, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    // 멀리 있는 행성
    ctx.fillStyle = "#f9a8d4"; ctx.beginPath(); ctx.arc(W * 0.86, H * 0.16, Math.min(W, H) * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(253,230,138,.8)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(W * 0.86, H * 0.16, Math.min(W, H) * 0.1, Math.min(W, H) * 0.025, -0.3, 0, Math.PI * 2); ctx.stroke();
    // 땅(지구)
    const gy = cannonY() + 12;
    ctx.fillStyle = "#22c55e"; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = "#16a34a"; ctx.fillRect(0, gy, W, 4);
    // 외계인
    G.aliens.forEach(drawAlien);
    // 방어벽
    const sy = shieldY();
    const hurt = G.shieldHurt > 0, glow = G.shieldFlash > 0;
    ctx.save();
    ctx.globalAlpha = 0.35 + (glow ? 0.4 * G.shieldFlash / 0.5 : 0) + (hurt ? 0.4 : 0) + Math.sin(t * 3) * 0.05;
    const sg = ctx.createLinearGradient(0, sy - 8, 0, sy + 10);
    sg.addColorStop(0, hurt ? "#f87171" : "#7dd3fc"); sg.addColorStop(1, "rgba(125,211,252,0)");
    ctx.fillStyle = sg; ctx.fillRect(0, sy - 6, W, 16);
    ctx.strokeStyle = hurt ? "#ef4444" : "#bae6fd"; ctx.lineWidth = 3;
    ctx.setLineDash([14, 8]); ctx.lineDashOffset = -t * 30;
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    // 총알
    G.bullets.forEach(b => {
      ctx.fillStyle = "#fde047";
      rr(b.x - 4, b.y - 14, 8, 22, 4); ctx.fill();
      ctx.fillStyle = "rgba(253,224,71,.35)";
      rr(b.x - 7, b.y - 4, 14, 26, 7); ctx.fill();
    });
    // 파편
    G.bits.forEach(p => {
      ctx.globalAlpha = 1 - p.t / 0.7;
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    drawCannon();
    // 겨누는 선
    if (G.active && !G.ending) {
      ctx.strokeStyle = "rgba(253,224,71,.25)"; ctx.lineWidth = 2; ctx.setLineDash([4, 10]);
      ctx.beginPath(); ctx.moveTo(G.cx * W, cannonY() - 40); ctx.lineTo(G.cx * W, 0); ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  function drawAlien(a) {
    const t = G.t, x = a.x * G.W + Math.sin(t * 1.5 + a.ph) * a.r * 0.5, y = a.y, r = a.r;
    a.drawX = x;
    ctx.save();
    if (a.wrong) ctx.globalAlpha = a.wrong;
    // 줄 + 단어 표지판
    const fs = signFont(a);
    ctx.font = "800 " + fs + "px Nunito, Pretendard, sans-serif";
    const sw = ctx.measureText(a.word).width + fs * 1.0, sh = fs * 1.5, syy = y - r * 2.55;
    ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.05); ctx.lineTo(x, syy + sh); ctx.stroke();
    rr(x - sw / 2, syy, sw, sh, sh / 2);
    ctx.fillStyle = "#ffffff"; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = a.color; ctx.stroke();
    ctx.fillStyle = "#312e81"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(a.word, x, syy + sh / 2 + fs * 0.05);
    // 더듬이
    ctx.strokeStyle = a.color; ctx.lineWidth = Math.max(2, r * 0.1);
    [-1, 1].forEach(k => {
      ctx.beginPath(); ctx.moveTo(x + k * r * 0.35, y - r * 0.75); ctx.lineTo(x + k * r * 0.6, y - r * 1.2); ctx.stroke();
      ctx.fillStyle = "#fde68a"; ctx.beginPath(); ctx.arc(x + k * r * 0.6, y - r * 1.25, r * 0.14, 0, Math.PI * 2); ctx.fill();
    });
    // 팔
    ctx.strokeStyle = a.color; ctx.lineWidth = Math.max(3, r * 0.18); ctx.lineCap = "round";
    const wave = Math.sin(t * 6 + a.ph) * 0.4;
    [-1, 1].forEach(k => { ctx.beginPath(); ctx.moveTo(x + k * r * 0.8, y + r * 0.1); ctx.lineTo(x + k * r * 1.25, y - r * 0.3 + k * wave * r * 0.4); ctx.stroke(); });
    // 몸
    ctx.fillStyle = a.color;
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.95, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.25, r * 0.15, -0.5, 0, Math.PI * 2); ctx.fill();
    // 눈
    const eyes = a.eyes === 1 ? [0] : [-0.33, 0.33], er = a.eyes === 1 ? r * 0.36 : r * 0.24;
    eyes.forEach(ex => {
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + ex * r, y - r * 0.15, er, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#1e1b4b"; ctx.beginPath(); ctx.arc(x + ex * r, y - r * 0.1, er * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + ex * r + er * 0.15, y - r * 0.18, er * 0.15, 0, Math.PI * 2); ctx.fill();
    });
    // 입
    ctx.strokeStyle = "#1e1b4b"; ctx.lineWidth = Math.max(1.5, r * 0.07);
    ctx.beginPath();
    if (a.wrong) ctx.arc(x, y + r * 0.5, r * 0.15, Math.PI * 1.15, Math.PI * 1.85);
    else ctx.arc(x, y + r * 0.3, r * 0.22, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }
  function drawCannon() {
    const x = G.cx * G.W, y = cannonY(), k = G.recoil / 0.12;
    ctx.save();
    ctx.translate(x, y + k * 4);
    // 바퀴
    ctx.fillStyle = "#334155";
    [-1, 1].forEach(s => { ctx.beginPath(); ctx.arc(s * 18, 8, 9, 0, Math.PI * 2); ctx.fill(); });
    // 포신
    ctx.fillStyle = "#e2e8f0";
    rr(-8, -40 + k * 6, 16, 30, 6); ctx.fill();
    ctx.fillStyle = "#f472b6"; ctx.fillRect(-8, -38 + k * 6, 16, 6);
    // 몸통
    ctx.fillStyle = "#ec4899";
    ctx.beginPath(); ctx.ellipse(0, -4, 28, 20, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#be185d"; ctx.fillRect(-30, -4, 60, 8);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.beginPath(); ctx.ellipse(-10, -14, 8, 4, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* ---------- 끝 ---------- */
  function endGame() {
    stopGame();
    const won = !!G.win; G.win = false;
    const n = G.kills;
    const stars = won ? (G.wrongShots === 0 && G.lives >= 4 ? 3 : G.lives >= 2 ? 2 : 1) : (n >= 8 ? 1 : 0);
    $("#result-title").textContent = won ? (stars === 3 ? "완벽한 방어! 🏆" : "지구를 지켰어요! 🎉") : "하트를 다 썼어요! 다시 도전! 💪";
    $("#result-stars").innerHTML = [1, 2, 3].map(k => '<span class="' + (k <= stars ? "" : "dim") + '">⭐</span>').join("");
    let isRecord;
    if (MATH) isRecord = ML.saveBest("alien", G.score).isRecord;
    else {
      const data = userData(); data.best = data.best || {};
      const best = data.best[mode] || 0;
      isRecord = G.score > best;
      if (isRecord) data.best[mode] = G.score;
      saveUserData(data);
    }
    const label = MATH ? "👾 " + ML.danText() : GROUPS[mode].emoji + " " + GROUPS[mode].name;
    $("#result-text").innerHTML = esc(label) + " · 물리친 외계인 <b>" + n + "</b> / " + GOAL + "<br>" +
      "점수 <b>" + G.score + "</b>점" + (isRecord && G.score > 0 ? '<span class="record">🎊 최고 기록!</span>' : "");
    const wb = $("#result-words"); wb.innerHTML = "";
    G.learned.forEach(w => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "word-chip";
      b.innerHTML = esc(w.en) + (w.ko ? "<small>" + esc(w.ko) + "</small>" : "");
      if (!MATH) { b.title = "눌러서 듣기"; b.addEventListener("click", () => speak(w.en)); }
      wb.appendChild(b);
    });
    show("screen-result");
  }
  $("#btn-again").addEventListener("click", startGame);
  $("#btn-result-back").addEventListener("click", () => { if (MATH) ML.back(); else { renderModes(); show("screen-mode"); } });
  $("#btn-quit").addEventListener("click", () => { stopGame(); if (MATH) ML.back(); else { renderModes(); show("screen-mode"); } });

  if (MATH) {
    document.title = "구구단 디펜스";
    $("#title-name").textContent = "구구단 디펜스";
    $("#title-sub").textContent = "구구단 정답 숫자를 단 외계인만 쏴요! (" + ML.danText() + ")";
    const back = $("#title-back");
    back.textContent = "← 게임 고르기";
    back.addEventListener("click", e => { e.preventDefault(); ML.back(); });
    $("#btn-result-back").textContent = "게임 고르기";
  }

  /* ---------- 조작 ---------- */
  const KEYS = { ArrowLeft: "l", a: "l", A: "l", ArrowRight: "r", d: "r", D: "r" };
  document.addEventListener("keydown", e => {
    if (!G.active || document.querySelector(".gb-overlay.show")) return;
    if (KEYS[e.key]) { G.keys[KEYS[e.key]] = true; e.preventDefault(); return; }
    if (e.code === "Space" || e.key === " " || e.key === "Enter" || e.key === "ArrowUp" || e.key === "w" || e.key === "W") { e.preventDefault(); fire(); }
  });
  document.addEventListener("keyup", e => { if (KEYS[e.key]) G.keys[KEYS[e.key]] = false; });
  window.addEventListener("blur", () => { G.keys.l = G.keys.r = false; });
  // 화면을 톡: 그 자리로 대포가 가서 쏴요 (외계인을 누르면 그 외계인 쪽으로)
  $("#field").addEventListener("pointerdown", e => {
    if (!G.active || e.target.closest(".shoot-pad")) return;
    const r = canvas.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    let tx = px;
    G.aliens.forEach(a => { if (!a.dead && Math.abs((a.drawX || a.x * G.W) - px) < a.r * 1.4 && py > a.y - a.r * 3 && py < a.y + a.r * 1.2) tx = a.drawX || a.x * G.W; });
    G.target = Math.max(0.05, Math.min(0.95, tx / G.W));
    G.autoFire = true;
  });
  document.querySelectorAll(".sp").forEach(b => {
    const act = b.dataset.act;
    b.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (act === "fire") { fire(); return; }
      G.target = null; G.autoFire = false;
      G.keys[act === "left" ? "l" : "r"] = true;
      b.classList.add("on");
      try { b.setPointerCapture(e.pointerId); } catch (err) { /* 이미 끝난 터치 */ }
    });
    const up = () => { if (act !== "fire") { G.keys[act === "left" ? "l" : "r"] = false; b.classList.remove("on"); } };
    b.addEventListener("pointerup", up);
    b.addEventListener("pointercancel", up);
    b.addEventListener("lostpointercapture", up);
  });
})();
