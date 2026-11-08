// 🐝 꿀벌 비행: 옆으로 날아가는 꿀벌을 톡톡(스페이스) 날갯짓시켜서, 영어 단어에 맞는 그림 꽃길로 통과해요.
// 꽃 기둥이 오른쪽에서 다가오고, 위·가운데·아래 세 길에 그림이 하나씩 달려 있어요. 맞는 길로 지나가면 +점수,
// 틀린 길로 가면 꽃잎에 부딪혀 하트 -1. 15번 지나면 벌집 도착!
// 구구단 놀이터에서 열면(?mul=1) '구구단 꿀벌 비행': 6 × 7 = ? 의 정답 숫자 길로 날아가요.
(function () {
  "use strict";

  const $ = s => document.querySelector(s);
  const ML = window.MulLink || { on: false }, MATH = ML.on;
  const EL = window.EngLink || { on: false }, LINK = !MATH && EL.on;   // 영어 놀이 메뉴 팝업에서 열렸어요
  const GRADES = window.SPELL_GRADES;
  const TOTAL = 15, LIVES = 5;
  // 구구단: 고른 난이도의 속도로 한 판 내내 날아요 (영어는 맞힐수록 조금씩 빨라져요)
  const MUL_SPEED = MATH ? ML.by({ easy: 0.15, normal: 0.21, hard: 0.28 }) : 0;
  const PROFILES_KEY = "bee_profiles", GUIDE_ID = MATH ? "bee_mul" : "bee";
  const SOUND = !MATH || ML.sound;
  const GRAVITY = 1.15, FLAP = -0.62, MAX_FALL = 0.75;  // 화면 높이 기준(1초에 화면 몇 배)
  const COL_W = 0.1;           // 꽃 기둥 너비 (화면 너비 기준)
  const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  const LANE_COLORS = ["#f472b6", "#a78bfa", "#fb923c"];

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
  const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
  function show(id) { document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id)); }

  /* ---------- 소리 ---------- */
  let actx = null;
  function tone(freq, dur, type = "sine", when = 0, vol = 0.12) {
    if (!SOUND) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime + when;
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t); o.stop(t + dur);
    } catch (e) { /* audio unavailable, ignore */ }
  }
  const sfx = {
    flap() { tone(520, 0.06, "triangle", 0, 0.05); },
    correct() { [784, 988, 1319].forEach((f, i) => tone(f, 0.14, "triangle", i * 0.07, 0.13)); },
    wrong() { tone(220, 0.22, "square", 0, 0.06); tone(160, 0.3, "sine", 0.1, 0.1); },
    win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", i * 0.1, 0.12)); },
    gem() { [1319, 1760].forEach((f, i) => tone(f, 0.09, "sine", i * 0.05, 0.09)); },
    heart() { [659, 880, 1175].forEach((f, i) => tone(f, 0.12, "sine", i * 0.07, 0.11)); }
  };
  function speak(text, lang) {
    if (GuideBook.defer(() => speak(text, lang))) return;   // 방법 팝업이 닫히면 읽어줘요
    if (!SOUND || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang || "en-US"; u.rate = lang ? 0.95 : 0.8; u.pitch = 1.1;
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
    const bits = ["🎉", "🎊", "⭐", "🐝", "🌼", "🌟", "🍯"];
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
  const PRAISE = ["딩동댕! 🎉", "최고예요! 🌟", "잘했어요! 👏", "멋져요! 💖", "윙윙 통과! 🐝"];

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
    renderGrades(); show("screen-grade");
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
  $("#btn-grade-back").addEventListener("click", () => show("screen-title"));

  /* ---------- 학년 고르기 ---------- */
  const GR_BG = [["#ecfccb", "#4d7c0f"], ["#fef9c3", "#a16207"], ["#ffedd5", "#c2410c"], ["#e1efff", "#1d4ed8"], ["#f3e8ff", "#7e22ce"], ["#ffe4e6", "#be123c"]];
  let grade = GRADES[0];
  function renderGrades() {
    const g = $("#grade-grid"); g.innerHTML = "";
    const best = userData().best || {};
    GRADES.forEach((gr, i) => {
      const b = document.createElement("button");
      b.className = "grade-btn"; b.type = "button";
      b.style.setProperty("--bg", GR_BG[i][0]); b.style.setProperty("--c", GR_BG[i][1]);
      const bs = best["g" + gr.grade];
      b.innerHTML = '<span class="gr-emoji">' + gr.emoji + '</span><span class="gr-name">' + gr.grade + "학년</span>" +
        '<span class="gr-desc">' + (bs ? "⭐ 내 최고 " + bs + "점" : gr.desc) + "</span>";
      b.addEventListener("click", () => { grade = gr; choose(); });
      g.appendChild(b);
    });
  }
  function guide(onStart) {
    return {
      id: GUIDE_ID, title: MATH ? "구구단 꿀벌 비행" : "꿀벌 비행",
      pages: [
        { icon: "🐝", title: "꿀벌이 날아요", text: "꿀벌은 가만히 두면 <b>아래로 슝</b> 내려가요.<br>화면을 <b>톡</b>(또는 <b>스페이스바</b>)하면 <b>위로 파닥!</b>" },
        { icon: "🌼", title: "꽃길이 다가와요", text: "꽃 기둥에 <b>위 · 가운데 · 아래</b> 세 길이 있어요.<br>길마다 " + (MATH ? "<b>숫자</b>" : "<b>한글 뜻</b>") + "이 하나씩 달려 있어요." },
        { icon: MATH ? "🔢" : "🔤", title: "맞는 길로 쏙!", text: MATH ? "위에 나온 <b>구구단의 정답</b> 길로 지나가요.<br>예) 6 × 7 → <b>42</b> 길" : "위에 나온 <b>영어 단어</b>의 뜻에 맞는 <b>한글 길</b>로 지나가요.<br>예) Apple → <b>사과</b> 길" },
        { icon: "💎", title: "보석을 먹어요", text: "꽃길 사이에 <b>보석 💎</b>이 줄지어 떠 있어요. 꿀벌이 지나가며 먹으면 <b>점수</b>가 올라가요!<br>가끔 <b>⭐ 별</b>이 날아오고, <b>❤️</b>를 먹으면 하트가 다시 차요." },
        { icon: "💫", title: "틀리면 꽈당", text: "틀린 길로 가면 꽃잎에 부딪혀 ❤️ 하트가 하나 줄어요.<br>꽃길 <b>" + TOTAL + "개</b>를 지나면 <b>벌집</b> 도착!" }
      ],
      startText: "자, 날아 볼까?", startLabel: "출발! 🐝", onStart
    };
  }
  // 게임 화면을 먼저 열고, 그 위에 방법 팝업을 띄워요. '확인'을 누르면 출발 (팝업이 떠 있는 동안은 멈춰 있어요)
  function choose() {
    startGame();
    GuideBook.intro(guide(null), () => $("#btn-quit").click());
  }
  $("#btn-guide").addEventListener("click", () => GuideBook.open(guide(null)));

  /* ---------- 문제 ---------- */
  function englishQuestions() {
    // 꽃길 표지판에는 그림 대신 한글 뜻이 적혀 있어요
    const words = grade.words.filter(w => w[2]);
    return shuffle(words.slice()).slice(0, TOTAL).map(w => {
      const others = [];
      shuffle(words.filter(o => o[2] !== w[2])).forEach(o => { if (others.length < 2 && !others.includes(o[2])) others.push(o[2]); });
      return { word: cap(w[0]), sub: "뜻에 맞는 한글 꽃길로 날아가요!", ans: w[2], opts: shuffle([w[2]].concat(others)), emojiOpts: false,
        say: w[0], learn: { en: w[0], ko: w[2], emoji: w[1] }, reveal: w[2] };
    });
  }
  function mathQuestions() {
    return ML.questions(TOTAL).map(([a, b]) => {
      const c = a * b;
      return { word: a + " × " + b + " = ?", sub: "정답 숫자 꽃길로 날아가요!", ans: String(c), opts: shuffle(ML.choices(a, b, 3).map(String)), emojiOpts: false,
        say: a + " 곱하기 " + b + "는 " + c, learn: { en: a + " × " + b + " = " + c, ko: "", emoji: "" }, reveal: String(c) };
    });
  }

  /* ---------- 게임 상태 ---------- */
  const canvas = $("#bee-canvas"), ctx = canvas.getContext("2d");
  const G = {
    W: 0, H: 0, raf: 0, last: 0, t: 0, active: false, started: false,
    y: 0.45, vy: 0, cols: [], scroll: 0, speed: 0.2, qs: [], i: 0, cur: null,
    lives: LIVES, score: 0, combo: 0, correct: 0, learned: [], hurtT: 0, happyT: 0, ending: 0, hive: null, trail: [],
    gems: [], gemT: 0, gemsGot: 0
  };
  function resize() {
    const r = $("#field").getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    G.W = r.width; G.H = r.height;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", () => { if (G.active) resize(); });
  const BEE_X = 0.24;
  const groundY = () => G.H * 0.9;
  // 세 길의 세로 범위 (위쪽 여백 ~ 땅)
  function laneBounds() {
    const top = G.H * 0.04, bot = groundY(), h = (bot - top) / 3;
    return [0, 1, 2].map(i => [top + i * h, top + (i + 1) * h]);
  }

  function startGame() {
    stopGame();
    Object.assign(G, {
      active: true, started: false, y: 0.45, vy: 0, cols: [], scroll: 0, speed: MATH ? MUL_SPEED : LINK ? EL.by({ easy: 0.15, normal: 0.19, hard: 0.25 }) : 0.19,
      qs: MATH ? mathQuestions() : englishQuestions(), i: 0, cur: null,
      lives: LIVES, score: 0, combo: 0, correct: 0, learned: [], hurtT: 0, happyT: 0, ending: 0, hive: null, trail: [], t: 0,
      gems: [], gemT: 5, gemsGot: 0
    });
    $("#hud-score").textContent = "0";
    renderHearts();
    show("screen-game");
    resize();
    $("#flap-hint").classList.remove("hide");
    msg("화면을 톡 누르면 출발! 🐝");
    setQuestion();
    G.last = performance.now();
    G.raf = requestAnimationFrame(frame);
  }
  function stopGame() { G.active = false; cancelAnimationFrame(G.raf); }
  function setQuestion() {
    const q = G.qs[G.i];
    G.cur = q;
    $("#q-emoji").textContent = MATH ? "🔢" : "🐝";
    const qw = $("#q-word"); qw.textContent = q.word; qw.className = "q-word";
    $("#q-sub").textContent = q.sub;
    $("#hud-q").textContent = (G.i + 1) + " / " + TOTAL;
    animate($(".q-card"), "pop");
    if (!MATH) speak(q.say);
    // 꽃 기둥은 화면 오른쪽 밖에서 출발해요
    G.cols.push({ x: 1.1, q, done: false, pick: -1, ok: false, pop: 0 });
    spawnArc(1.1 + COL_W * 2);
  }
  function renderHearts(justLost) {
    let h = "";
    for (let k = 0; k < LIVES; k++) h += k < G.lives ? "❤️" : '<span class="' + (justLost && k === G.lives ? "lost" : "") + '" style="opacity:.35">🤍</span>';
    $("#hearts").innerHTML = h;
  }
  function addScore(n) {
    G.score += n;
    $("#hud-score").textContent = G.score;
    animate($("#hud-score-box"), "bump");
  }
  function flap() {
    if (!G.active || G.ending) return;
    if (!G.started) { G.started = true; $("#flap-hint").classList.add("hide"); msg(MATH ? "정답 숫자 길로 날아가요!" : "뜻에 맞는 한글 길로 날아가요!"); }
    G.vy = FLAP;
    sfx.flap();
  }

  function judge(col) {
    col.done = true;
    const lanes = laneBounds(), by = G.y * G.H;
    let lane = lanes.findIndex(([a, b]) => by >= a && by < b);
    if (lane < 0) lane = by < lanes[0][0] ? 0 : 2;
    col.pick = lane;
    col.ok = col.q.opts[lane] === col.q.ans;
    const r = canvas.getBoundingClientRect(), sx = r.left + BEE_X * G.W, sy = r.top + by - 30;
    const qw = $("#q-word");
    if (col.ok) {
      G.correct++; G.combo++;
      const gain = 10 + Math.min(G.combo - 1, 5) * 2;
      addScore(gain);
      sfx.correct();
      floatAt(sx, sy, "+" + gain, "#ca8a04");
      G.learned.push(col.q.learn);
      G.happyT = 0.6; col.pop = 0.0001;
      qw.className = "q-word ok";
      $("#q-sub").textContent = MATH ? col.q.learn.en : col.q.word + " = " + col.q.reveal;
      if (MATH) speak(col.q.say, "ko-KR"); else speak(col.q.say);
      if (!MATH) G.speed = Math.min(0.32, G.speed + 0.008);
      msg(pick(PRAISE) + (G.combo >= 2 ? "  🔥 " + G.combo + "연속!" : ""));
    } else {
      G.combo = 0;
      G.lives--;
      renderHearts(true);
      sfx.wrong();
      G.hurtT = 0.9;
      floatAt(sx, sy, "꽈당! ❤️-1", "#ef4444");
      qw.className = "q-word no";
      $("#q-sub").textContent = "정답은 " + col.q.reveal + " 이에요";
      msg("앗! " + col.q.word + (MATH ? " 의 답은 " : " 은(는) ") + col.q.reveal + " 이에요");
    }
    G.i++;
    if (G.lives <= 0) { G.ending = 1.4; msg("하트를 다 썼어요… 😢"); return; }
    if (G.i >= TOTAL) { G.hive = { x: 1.25 }; return; }
    // 다음 꽃 기둥은 조금 뒤에 나와요
    setTimeout(() => { if (G.active && !G.ending) setQuestion(); }, 650);
  }

  function frame(now) {
    if (!G.active) return;
    const dt = GuideBook.isOpen() ? 0 : Math.min(0.05, (now - G.last) / 1000);
    G.last = now; G.t += dt;
    const W = G.W, H = G.H;
    if (G.started && !G.ending) {
      // 날갯짓 · 중력 (위아래 끝에서는 살짝 튕겨요)
      G.vy = Math.min(MAX_FALL, G.vy + GRAVITY * dt);
      G.y += G.vy * dt;
      const minY = 0.05, maxY = groundY() / H - 0.04;
      if (G.y < minY) { G.y = minY; G.vy = 0.1; }
      if (G.y > maxY) { G.y = maxY; G.vy = -0.35; }
      const move = G.speed * dt;
      G.scroll += move * W;
      G.cols.forEach(c => { c.x -= move; if (!c.done && c.x <= BEE_X) judge(c); if (c.pop > 0) c.pop += dt; });
      G.cols = G.cols.filter(c => c.x > -COL_W * 2);
      updateGems(dt);
      if (G.hive) {
        G.hive.x -= move;
        if (G.hive.x <= BEE_X + 0.08 && !G.ending) { G.ending = 2.2; G.win = true; sfx.win(); confetti(30); msg("🎉 벌집 도착! 꿀이 가득해요!"); }
      }
    } else if (!G.started) {
      G.y = 0.45 + Math.sin(G.t * 3) * 0.02;
    } else if (G.win) {
      // 벌집 앞에서 콩콩
      G.y += (0.5 - G.y) * Math.min(1, dt * 3);
    }
    G.trail.push({ x: BEE_X * W, y: G.y * H, t: 0 });
    G.trail.forEach(p => { p.t += dt; p.x -= G.speed * W * dt; });
    G.trail = G.trail.filter(p => p.t < 0.5);
    G.hurtT = Math.max(0, G.hurtT - dt);
    G.happyT = Math.max(0, G.happyT - dt);
    if (G.ending && (G.ending -= dt) <= 0) { G.ending = 0; endGame(); return; }
    draw();
    G.raf = requestAnimationFrame(frame);
  }

  /* ---------- 보석 · 하트: 마리오 동전처럼 꽃 기둥 사이에 포물선 모양으로 떠 있어요 (화면과 같이 흘러와요)
     가끔 ⭐ 별은 포물선을 그리며 날아와요. 먹으면 점수, ❤️ 는 하트 +1 ---------- */
  const GEM_GRAVITY = 1.05;
  const GEM = { e: "💎", pts: 3 }, CROWN = { e: "👑", pts: 15 }, HEART = { e: "❤️", heart: true }, STAR = { e: "⭐", pts: 10, big: true };
  // 꽃 기둥 하나가 나올 때, 그 기둥과 다음 기둥 사이에 보석 줄을 하나 놓아요
  function spawnArc(x0) {
    // 보석은 곡선을 따라 같은 간격으로 놓아요 (아치 · 골짜기 · 일자 모두 보석 사이 거리가 같게)
    const W = Math.max(1, G.W), H = Math.max(1, G.H);
    const gemPx = Math.max(32, Math.min(W, H) * 0.085) * 0.7;
    const n = 5 + Math.floor(Math.random() * 2), d = gemPx * 1.25, total = (n - 1) * d;
    const shape = ["arch", "arch", "valley", "line"][Math.floor(Math.random() * 4)];
    const sign = shape === "arch" ? -1 : shape === "valley" ? 1 : 0;
    const hPx = sign ? Math.min((0.1 + Math.random() * 0.08) * H, total * 0.3) : 0;
    const base = shape === "valley" ? 0.2 + Math.random() * 0.25 : 0.45 + Math.random() * 0.3;
    // 곡선 길이가 total 이 되도록 가로 폭 L 을 맞춰요
    const curve = (L, t) => [t * L, sign * hPx * 4 * t * (1 - t)];
    const lenOf = L => { let len = 0, prev = curve(L, 0); for (let i = 1; i <= 80; i++) { const c = curve(L, i / 80); len += Math.hypot(c[0] - prev[0], c[1] - prev[1]); prev = c; } return len; };
    let L = total;
    for (let it = 0; it < 8; it++) L *= total / Math.max(1, lenOf(L));
    // 곡선을 잘게 나눠 길이 k*d 인 곳마다 하나씩
    const pts = [], STEPS = 240;
    let acc = 0, prev = curve(L, 0), want = 0;
    pts.push(prev);
    for (let i = 1; i <= STEPS && pts.length < n; i++) {
      const c = curve(L, i / STEPS), seg = Math.hypot(c[0] - prev[0], c[1] - prev[1]);
      acc += seg; prev = c;
      if (acc >= (want + d) - 0.5) { want += d; pts.push(c); }
    }
    while (pts.length < n) pts.push(curve(L, 1));
    const mid = Math.floor((n - 1) / 2);
    const withHeart = G.lives < LIVES && Math.random() < 0.45;
    const withCrown = !withHeart && Math.random() < 0.15;
    pts.forEach((pt, k) => {
      let kind = GEM;
      if (k === mid && withHeart) kind = HEART;
      else if (k === mid && withCrown) kind = CROWN;
      G.gems.push({ kind, x: x0 + pt[0] / W, y: Math.max(0.08, Math.min(0.82, base + pt[1] / H)), fly: false, spin: k * 0.7, got: 0 });
    });
  }
  function spawnStar() {
    G.gems.push({ kind: STAR, x: 1.05, y: 0.84 + Math.random() * 0.06, fly: true,
      vx: -(G.speed + 0.3 + Math.random() * 0.2), vy: -(0.9 + Math.random() * 0.4), spin: 0, got: 0 });
  }
  function updateGems(dt) {
    if (!G.hive) {
      G.gemT -= dt;
      if (G.gemT <= 0) { spawnStar(); G.gemT = 6 + Math.random() * 5; }
    }
    const bx = BEE_X * G.W, by = G.y * G.H, rad = Math.max(28, Math.min(G.W, G.H) * 0.07);
    G.gems.forEach(g => {
      if (g.got) { g.got += dt; return; }
      if (g.fly) { g.vy += GEM_GRAVITY * dt; g.x += g.vx * dt; g.y += g.vy * dt; }
      else g.x -= G.speed * dt;
      g.spin += dt * 4;
      const dx = g.x * G.W - bx, dy = g.y * G.H - by;
      if (dx * dx + dy * dy < rad * rad) {
        g.got = 0.0001;
        const r = canvas.getBoundingClientRect(), sx = r.left + g.x * G.W, sy = r.top + g.y * G.H - 20;
        if (g.kind.heart) {
          if (G.lives < LIVES) { G.lives++; renderHearts(); }
          sfx.heart(); floatAt(sx, sy, "❤️+1", "#ef4444");
        } else {
          G.gemsGot++; addScore(g.kind.pts); sfx.gem();
          if (g.kind.pts >= 10) floatAt(sx, sy, "+" + g.kind.pts, "#7c3aed");
        }
      }
    });
    G.gems = G.gems.filter(g => g.got ? g.got < 0.3 : g.x > -0.1 && g.y < 1.1);
  }
  function drawGems() {
    const base = Math.max(32, Math.min(G.W, G.H) * 0.085);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    G.gems.forEach(g => {
      const x = g.x * G.W, y = g.y * G.H + (g.fly ? 0 : Math.sin(g.spin * 0.8) * 3);
      const sz = g.kind === GEM ? base * 0.7 : base;
      ctx.save();
      ctx.translate(x, y);
      if (g.got) { const k = g.got / 0.35; ctx.globalAlpha = 1 - k; ctx.scale(1 + k, 1 + k); }
      // 반짝이는 빛
      ctx.fillStyle = g.kind.heart ? "rgba(248,113,113,.28)" : "rgba(255,255,255,.55)";
      ctx.beginPath(); ctx.arc(0, 0, sz * (0.62 + Math.sin(g.spin) * 0.08), 0, Math.PI * 2); ctx.fill();
      ctx.rotate(Math.sin(g.spin) * 0.25);
      ctx.font = sz + "px " + EMOJI_FONT; ctx.fillStyle = "#000";
      ctx.fillText(g.kind.e, 0, sz * 0.05);
      ctx.restore();
    });
  }

  /* ---------- 그리기 ---------- */
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function draw() {
    const W = G.W, H = G.H, gy = groundY();
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#fde68a"); sky.addColorStop(0.55, "#fef3c7"); sky.addColorStop(1, "#ecfccb");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // 해
    ctx.fillStyle = "rgba(251,191,36,.55)"; ctx.beginPath(); ctx.arc(W * 0.85, H * 0.16, Math.min(W, H) * 0.08, 0, Math.PI * 2); ctx.fill();
    // 먼 언덕 (천천히)
    ctx.fillStyle = "#bbf7d0";
    const o1 = (G.scroll * 0.3) % 400;
    for (let x = -400 - o1; x < W + 400; x += 400) { ctx.beginPath(); ctx.ellipse(x + 200, gy, 260, H * 0.22, 0, Math.PI, 0); ctx.fill(); }
    // 구름
    ctx.fillStyle = "rgba(255,255,255,.85)";
    const o2 = (G.scroll * 0.15) % (W + 200);
    [[0.2, 0.18], [0.6, 0.1], [0.95, 0.26]].forEach(([fx, fy], k) => {
      const x = ((fx * (W + 200) - o2 + (W + 200)) % (W + 200)) - 100, y = fy * H, r = 16 + k * 3;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.arc(x + r * 1.2, y - r * 0.5, r * 1.2, 0, Math.PI * 2); ctx.arc(x + r * 2.4, y, r, 0, Math.PI * 2); ctx.fill();
    });
    // 땅 + 작은 꽃
    ctx.fillStyle = "#86efac"; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = "#4ade80"; ctx.fillRect(0, gy, W, 4);
    const o3 = G.scroll % 60;
    for (let x = -o3; x < W + 60; x += 60) {
      ctx.fillStyle = ["#f472b6", "#facc15", "#ffffff", "#a78bfa"][Math.floor((x + G.scroll) / 60) & 3];
      ctx.beginPath(); ctx.arc(x + 20, gy + (H - gy) * 0.5, 4, 0, Math.PI * 2); ctx.fill();
    }
    G.cols.forEach(drawColumn);
    if (G.hive) drawHive(G.hive.x * W, gy);
    drawGems();
    // 날갯짓 반짝이
    G.trail.forEach(p => {
      ctx.fillStyle = "rgba(255,255,255," + (0.5 * (1 - p.t / 0.5)).toFixed(2) + ")";
      ctx.beginPath(); ctx.arc(p.x - 14, p.y + 4, 3, 0, Math.PI * 2); ctx.fill();
    });
    drawBee(BEE_X * W, G.y * H);
  }
  // 꽃 기둥: 세 길 사이에 꽃 덩굴, 길마다 그림(숫자) 표지판
  function drawColumn(c) {
    const W = G.W, lanes = laneBounds(), x = c.x * W, cw = Math.max(46, COL_W * W);
    const gap = (lanes[0][1] - lanes[0][0]);
    // 덩굴 칸막이 (위 끝, 길 사이, 땅)
    const walls = [lanes[0][0], lanes[1][0], lanes[2][0], lanes[2][1]];
    ctx.strokeStyle = "#16a34a"; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, groundY()); ctx.stroke();
    walls.forEach((wy, k) => {
      if (k === 0 || k === 3) return;
      ctx.fillStyle = "#22c55e";
      rr(x - cw / 2, wy - 7, cw, 14, 7); ctx.fill();
      // 칸막이 꽃
      for (let f = -1; f <= 1; f += 2) {
        ctx.fillStyle = k === 1 ? "#f472b6" : "#facc15";
        for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2 + G.t; ctx.beginPath(); ctx.arc(x + f * cw * 0.3 + Math.cos(a) * 6, wy + Math.sin(a) * 6, 4.5, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = "#fff7ed"; ctx.beginPath(); ctx.arc(x + f * cw * 0.3, wy, 3.5, 0, Math.PI * 2); ctx.fill();
      }
    });
    // 길마다 표지판
    c.q.opts.forEach((v, i) => {
      const [a, b] = lanes[i], cy = (a + b) / 2, sz = Math.min(gap * 0.62, cw * 1.6, 92);
      const passed = c.done && c.pick === i, isAns = v === c.q.ans;
      if (passed && c.ok && c.pop > 0) {
        // 맞힌 표지판은 꽃가루처럼 퐁
        const k = Math.min(1, c.pop / 0.5);
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = "#fde047";
        for (let p = 0; p < 8; p++) { const an = p / 8 * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(an) * sz * k, cy + Math.sin(an) * sz * k, 5, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;
        return;
      }
      rr(x - sz / 2, cy - sz / 2, sz, sz, sz * 0.24);
      ctx.fillStyle = c.done && !c.ok && passed ? "#e5e7eb" : "#ffffff"; ctx.fill();
      ctx.lineWidth = c.done && isAns ? 6 : 4;
      ctx.strokeStyle = c.done && isAns ? "#22c55e" : LANE_COLORS[i]; ctx.stroke();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (c.q.emojiOpts) { ctx.font = sz * 0.62 + "px " + EMOJI_FONT; ctx.fillStyle = "#000"; }
      else {
        // 글자가 길면 표지판 안에 들어가게 줄여요 (한글 뜻 · 숫자)
        let fs = sz * 0.46;
        ctx.font = "800 " + fs + "px Pretendard, Nunito, sans-serif";
        const tw = ctx.measureText(v).width;
        if (tw > sz * 0.86) { fs *= sz * 0.86 / tw; ctx.font = "800 " + fs + "px Pretendard, Nunito, sans-serif"; }
        ctx.fillStyle = "#713f12";
      }
      ctx.fillText(v, x, cy + sz * 0.04);
    });
  }
  function drawHive(x, gy) {
    const s = Math.min(G.W, G.H) * 0.22;
    ctx.save();
    ctx.translate(x, gy);
    ctx.strokeStyle = "#92400e"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(s * 0.1, 0); ctx.lineTo(s * 0.1, -s * 1.4); ctx.lineTo(-s * 0.3, -s * 1.7); ctx.stroke();
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = k % 2 ? "#f59e0b" : "#fbbf24";
      rr(-s * (0.45 - k * 0.06), -s * (0.25 + k * 0.28), s * (0.9 - k * 0.12), s * 0.3, s * 0.15); ctx.fill();
    }
    ctx.fillStyle = "#78350f"; ctx.beginPath(); ctx.ellipse(0, -s * 0.22, s * 0.1, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function drawBee(x, y) {
    const s = Math.max(22, Math.min(G.W, G.H) * 0.06);
    const tilt = Math.max(-0.5, Math.min(0.6, G.vy * 0.9));
    ctx.save();
    ctx.translate(x + (G.hurtT > 0 ? Math.sin(G.t * 50) * 3 : 0), y);
    ctx.rotate(G.hurtT > 0 ? Math.sin(G.t * 20) * 0.4 : tilt);
    // 날개 (파닥파닥)
    const flapA = Math.sin(G.t * 40) * 0.5;
    ctx.fillStyle = "rgba(219,234,254,.85)";
    ctx.save(); ctx.rotate(-0.4 + flapA); ctx.beginPath(); ctx.ellipse(-s * 0.1, -s * 0.75, s * 0.32, s * 0.55, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.rotate(0.1 - flapA); ctx.beginPath(); ctx.ellipse(s * 0.2, -s * 0.7, s * 0.28, s * 0.5, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // 몸통 + 줄무늬
    ctx.fillStyle = "#facc15";
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.85, s * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, s * 0.85, s * 0.6, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "#1f2937";
    [-0.35, 0.05].forEach(f => ctx.fillRect(s * f - s * 0.1, -s, s * 0.2, s * 2));
    ctx.restore();
    // 침
    ctx.fillStyle = "#1f2937"; ctx.beginPath(); ctx.moveTo(-s * 0.85, 0); ctx.lineTo(-s * 1.1, s * 0.05); ctx.lineTo(-s * 0.8, s * 0.15); ctx.fill();
    // 얼굴
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.12, s * 0.17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1f2937";
    if (G.hurtT > 0) { ctx.font = "800 " + s * 0.3 + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("×", s * 0.52, -s * 0.12); }
    else { ctx.beginPath(); ctx.arc(s * 0.55, -s * 0.12, s * 0.08, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "rgba(244,114,182,.6)"; ctx.beginPath(); ctx.ellipse(s * 0.5, s * 0.15, s * 0.1, s * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#1f2937"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(s * 0.68, s * 0.12, s * 0.1, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    // 더듬이
    ctx.beginPath(); ctx.moveTo(s * 0.55, -s * 0.5); ctx.quadraticCurveTo(s * 0.7, -s * 0.9, s * 0.9, -s * 0.85); ctx.stroke();
    ctx.fillStyle = "#1f2937"; ctx.beginPath(); ctx.arc(s * 0.9, -s * 0.85, s * 0.07, 0, Math.PI * 2); ctx.fill();
    if (G.happyT > 0) { ctx.font = s * 0.5 + "px " + EMOJI_FONT; ctx.textAlign = "center"; ctx.fillText("✨", 0, -s * 1.2); }
    ctx.restore();
  }

  /* ---------- 끝 ---------- */
  function endGame() {
    stopGame();
    const won = !!G.win; G.win = false;
    const n = G.correct;
    const stars = n >= 14 ? 3 : n >= 10 ? 2 : n >= 6 ? 1 : 0;
    $("#result-title").textContent = !won ? "하트를 다 썼어요! 다시 도전! 💪" : stars === 3 ? "완벽해요! 🏆" : stars === 2 ? "아주 잘했어요! 🎉" : "잘했어요! 💪";
    $("#result-stars").innerHTML = [1, 2, 3].map(k => '<span class="' + (k <= stars ? "" : "dim") + '">⭐</span>').join("");
    let isRecord;
    if (MATH) isRecord = ML.saveBest("bee", G.score).isRecord;
    else {
      const data = userData(); data.best = data.best || {};
      const key = "g" + grade.grade, best = data.best[key] || 0;
      isRecord = G.score > best;
      if (isRecord) data.best[key] = G.score;
      saveUserData(data);
    }
    const label = MATH ? "🐝 " + ML.danText() + " · " + ML.diffName : "🐝 " + grade.grade + "학년";
    $("#result-text").innerHTML = esc(label) + " · 맞힌 꽃길 <b>" + n + "</b> / " + TOTAL + " · 💎 <b>" + G.gemsGot + "</b>개<br>" +
      "점수 <b>" + G.score + "</b>점" + (isRecord && G.score > 0 ? '<span class="record">🎊 최고 기록!</span>' : "");
    // 맞힌 문제 목록은 보여 주지 않아요
    const wb = $("#result-words"); wb.innerHTML = ""; wb.style.display = "none";
    show("screen-result");
  }
  $("#btn-again").addEventListener("click", choose);
  $("#btn-result-back").addEventListener("click", () => { if (MATH) ML.back(); else if (LINK) EL.back(); else { renderGrades(); show("screen-grade"); } });
  $("#btn-quit").addEventListener("click", () => { stopGame(); if (MATH) ML.back(); else if (LINK) EL.back(); else { renderGrades(); show("screen-grade"); } });
  $("#btn-say").addEventListener("click", () => { if (G.cur) { if (MATH) speak(G.cur.say, "ko-KR"); else speak(G.cur.say); } });

  if (MATH) {
    document.title = "구구단 꿀벌 비행";
    $("#title-name").textContent = "구구단 꿀벌 비행";
    $("#title-sub").textContent = "톡톡 날갯짓! 구구단 정답 꽃길로 쏙! (" + ML.danText() + ")";
    const back = $("#title-back");
    back.textContent = "← 게임 고르기";
    back.addEventListener("click", e => { e.preventDefault(); ML.back(); });
    $("#btn-result-back").textContent = "← 게임 선택";
    $("#btn-again").textContent = "🔁 한 번 더 하기";
    $("#btn-say").style.display = "none";
  }

  /* ---------- 조작: 스페이스 · ↑ · 화면 톡 = 날갯짓 ---------- */
  document.addEventListener("keydown", e => {
    if (!G.active || document.querySelector(".gb-overlay.show")) return;
    if (e.code === "Space" || e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === "Enter") { e.preventDefault(); if (!e.repeat) flap(); }
  });
  $("#field").addEventListener("pointerdown", e => { e.preventDefault(); flap(); });
  // 영어 놀이 메뉴 팝업에서 고른 사용자 · 학년 · 난이도로 바로 시작해요
  if (LINK) { $("#btn-result-back").textContent = "← 게임 선택"; enterAs(EL.user); grade = GRADES[EL.grade - 1]; choose(); }
})();
