// 🏄 알파벳 서핑: 빈칸이 있는 영어 단어(M _ N K E Y)를 보고, 빈칸에 들어갈 알파벳이 있는 물길로 서핑해요.
// 그림 문 달리기(펭귄 달리기)와 같은 3칸 원근 길을 바다로 바꿨어요. 맞히면 빨라지고, 틀리면 하트 -1.
// 구구단 놀이터에서 열면(?mul=1) 같은 놀이를 구구단 빈칸(3 × _ = 12)으로 해요.
(function () {
  "use strict";

  const $ = s => document.querySelector(s);
  const ML = window.MulLink, MATH = ML.on;
  const GRADES = window.SPELL_GRADES;
  const TOTAL = 15, LIVES = 5;
  const PROFILES_KEY = "surf_profiles", GUIDE_ID = MATH ? "surf_mul" : "surf", MUSIC_KEY = "surf_music";
  const Z_SPAWN = 60, CAM = 18;
  const T_START = 4.6, T_MIN = 2.3;   // 표지판이 다가오는 시간(초): 맞힐수록 짧아져요(가속)
  const LANES = [-2 / 3, 0, 2 / 3];
  const COLORS = ["#ff7eb6", "#f59e0b", "#a78bfa", "#34d399", "#60a5fa"];
  const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  const VOWELS = "AEIOU", CONSONANTS = "BCDFGHKLMNPRSTW";
  const SOUND = !MATH || ML.sound;

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
    correct() { [784, 988, 1319].forEach((f, i) => tone(f, 0.14, "triangle", i * 0.07, 0.13)); tone(1568, 0.25, "sine", 0.22, 0.08); },
    wrong() { tone(200, 0.25, "sine", 0, 0.14); tone(120, 0.4, "triangle", 0.08, 0.1); },
    win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", i * 0.1, 0.12)); }
  };
  function speak(text, lang) {
    if (!SOUND || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang || "en-US"; u.rate = lang ? 0.95 : 0.8; u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch (e) { /* speech unavailable, ignore */ }
  }
  const BGM_START = 0.23, BGM_END = 175.8;
  const bgm = new Audio("../multiplication/penguin-bgm.mp3");
  bgm.loop = true; bgm.volume = 0.3;
  const loopBgm = () => { if (bgm.currentTime >= BGM_END) bgm.currentTime = BGM_START; };
  bgm.addEventListener("timeupdate", loopBgm);
  let music = SOUND && store.get(MUSIC_KEY, true);
  function renderMusic() { $("#btn-music").classList.toggle("off", !music); }
  $("#btn-music").addEventListener("click", () => {
    music = !music; store.set(MUSIC_KEY, music); renderMusic();
    if (music && run.active) bgm.play().catch(() => {}); else bgm.pause();
  });

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
    const bits = ["🎉", "🎊", "⭐", "🏄", "🐚", "🌟", "🌊"];
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
  const PRAISE = ["딩동댕! 🎉", "최고예요! 🌟", "잘했어요! 👏", "멋져요! 💖", "파도 타기 성공! 🏄"];

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
    const what = MATH ? "구구단 식" : "영어 단어";
    return {
      id: GUIDE_ID, title: MATH ? "구구단 서핑" : "알파벳 서핑",
      pages: [
        { icon: "🏄", title: "파도를 타요", text: "펭귄이 서핑보드를 타고 바다를 <b>쌩쌩</b> 달려요.<br>위에 <b>빈칸</b>이 있는 " + what + "이 나와요." },
        { icon: MATH ? "🔢" : "🔤", title: "빈칸을 채워요", text: MATH ? "예) <b>3 × _ = 12</b> 이면 빈칸은 <b>4</b>!<br>물길마다 숫자 표지판이 다가와요." : "예) <b>M _ N K E Y</b> 이면 빈칸은 <b>O</b>!<br>물길마다 알파벳 표지판이 다가와요." },
        { icon: "⬅️➡️", title: "물길 바꾸기", text: "<b>← →</b> 방향키(또는 A, D)로 물길을 바꿔요.<br>태블릿은 <b>옆으로 밀거나</b> 아래 <b>◀ ▶</b> 를 눌러요." },
        { icon: "🚀", title: "맞히면 가속!", text: "맞는 표지판을 지나면 <b>점점 빨라져요</b>. 연속으로 맞히면 점수도 더!<br>틀린 표지판에 부딪히면 💦 ❤️ 하트가 하나 줄어요." },
        { icon: "🏝️", title: "섬까지!", text: "표지판 <b>" + TOTAL + "개</b>를 지나면 섬에 도착!<br>하트를 다 쓰면 끝나요." }
      ],
      startText: "자, 파도를 타 볼까?",
      startLabel: "출발! 🏄",
      onStart
    };
  }
  function choose() {
    if (!GuideBook.isRead(GUIDE_ID)) GuideBook.open(guide(startRun));
    else startRun();
  }
  $("#btn-guide").addEventListener("click", () => GuideBook.open(guide(null)));

  /* ---------- 문제 만들기 ---------- */
  const ALL_WORDS = new Set();
  GRADES.forEach(g => g.words.forEach(w => ALL_WORDS.add(w[0].toUpperCase())));
  function englishQuestions() {
    return shuffle(grade.words.slice()).slice(0, TOTAL).map(w => {
      const word = w[0].toUpperCase();
      const at = rand(0, word.length - 1), ans = word[at];
      // 빈칸에 넣어도 다른 단어가 되지 않는 글자만 섞어요 (모음이면 모음끼리, 자음이면 자음끼리)
      const pool = (VOWELS.indexOf(ans) >= 0 ? VOWELS : CONSONANTS).split("").filter(ch => ch !== ans && !ALL_WORDS.has(word.slice(0, at) + ch + word.slice(at + 1)));
      const extra = shuffle(pool).slice(0, 2);
      while (extra.length < 2) { const ch = pick(CONSONANTS.split("")); if (ch !== ans && extra.indexOf(ch) < 0) extra.push(ch); }
      const opts = shuffle([ans].concat(extra));
      const slots = word.split("").map((ch, i) => ({ t: ch, blank: i === at }));
      return { slots, ans, opts, emoji: w[1], sub: w[2], say: w[0], learn: { en: w[0], ko: w[2], emoji: w[1] } };
    });
  }
  function mathQuestions() {
    return ML.questions(TOTAL).map(([a, b]) => {
      const r = Math.random(), kind = r < 0.5 ? "ans" : r < 0.8 ? "b" : "a", c = a * b;
      let ans, opts;
      if (kind === "ans") { ans = c; opts = ML.choices(a, b, 3); }
      else {
        ans = kind === "b" ? b : a;
        const lo = kind === "b" ? 1 : 2, hi = kind === "b" ? 9 : 12;
        const near = shuffle([ans - 1, ans + 1, ans - 2, ans + 2].filter(n => n >= lo && n <= hi));
        opts = [ans].concat(near.slice(0, 2));
      }
      opts = shuffle(opts.map(String));
      const slots = [
        { t: String(a), blank: kind === "a" }, { t: "×", op: true }, { t: String(b), blank: kind === "b" },
        { t: "=", op: true }, { t: String(c), blank: kind === "ans" }
      ];
      return { slots, ans: String(ans), opts, emoji: "🔢", sub: "빈칸에 들어갈 숫자 물길로!", say: a + " 곱하기 " + b + "는 " + c, ko: true,
        learn: { en: a + " × " + b + " = " + c, ko: "", emoji: "" } };
    });
  }

  /* ---------- 달리기 ---------- */
  const canvas = $("#run-canvas"), ctx = canvas.getContext("2d");
  const run = {
    W: 0, H: 0, raf: 0, last: 0, active: false, tok: 0,
    dist: 0, speed: 10, gateT: T_START, px: 0, lean: 0, target: null, keys: { l: false, r: false },
    gates: [], jumpT: 0, fallT: 0, goal: null, banner: null, boostT: 0, sprays: [],
    qs: [], i: 0, lives: LIVES, score: 0, combo: 0, correct: 0, learned: [], cur: null
  };
  function resize() {
    const r = $("#field").getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    run.W = r.width; run.H = r.height;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", () => { if (run.active) resize(); });
  function geo() {
    const { W, H } = run;
    return { W, H, cx: W / 2, hy: H * 0.24, gy: H * 0.82, R: Math.min(W * 0.4, H * 0.62) };
  }
  function proj(g, x, z, h = 0) {
    const s = CAM / (CAM + z);
    return { x: g.cx + x * s * g.R, y: g.hy + (g.gy - g.hy) * s - h * s * g.R, s };
  }
  function laneOf(x) {
    let best = 0;
    LANES.forEach((c, i) => { if (Math.abs(c - x) < Math.abs(LANES[best] - x)) best = i; });
    return best;
  }

  function startRun() {
    stopRun();
    Object.assign(run, {
      active: true, dist: 0, px: 0, lean: 0, target: null, gates: [], jumpT: 0, fallT: 0, goal: null, banner: null, boostT: 0, sprays: [],
      gateT: T_START, qs: MATH ? mathQuestions() : englishQuestions(), i: 0, lives: LIVES, score: 0, combo: 0, correct: 0, learned: [], cur: null
    });
    run.speed = Z_SPAWN / run.gateT;
    run.keys.l = run.keys.r = false;
    run.tok++;
    $("#hud-score").textContent = "0";
    renderHearts();
    renderMusic();
    show("screen-game");
    resize();
    run.banner = { text: "출발! 🏄", t: 1.6 };
    msg("◀ ▶ 로 빈칸에 맞는 물길로!");
    if (music) { bgm.currentTime = BGM_START; bgm.play().catch(() => {}); }
    nextQuestion();
    run.last = performance.now();
    run.raf = requestAnimationFrame(frame);
  }
  function stopRun() {
    run.active = false; run.tok++;
    cancelAnimationFrame(run.raf);
    bgm.pause();
  }

  function renderSlots(q, state) {
    const box = $("#q-slots"); box.innerHTML = "";
    q.slots.forEach(s => {
      const d = document.createElement("div");
      d.className = "slot" + (s.op ? " op" : "") + (s.blank ? (state ? " " + state : " blank") : "");
      d.textContent = s.blank && !state ? "?" : (s.blank ? q.ans : s.t);
      box.appendChild(d);
    });
  }
  function nextQuestion() {
    if (run.i >= TOTAL || run.lives <= 0) return finish();
    const q = run.qs[run.i];
    run.cur = q;
    renderSlots(q);
    $("#q-emoji").textContent = q.emoji;
    $("#q-sub").textContent = q.sub;
    $("#hud-q").textContent = (run.i + 1) + " / " + TOTAL;
    animate($(".q-card"), "pop");
    run.speed = Z_SPAWN / run.gateT;
    run.gates.push({ z: Z_SPAWN, q, done: false, pick: -1, ok: false });
  }
  function renderHearts(justLost) {
    let h = "";
    for (let k = 0; k < LIVES; k++) h += k < run.lives ? "❤️" : '<span class="' + (justLost && k === run.lives ? "lost" : "") + '" style="opacity:.35">🤍</span>';
    $("#hearts").innerHTML = h;
  }
  function addScore(n) {
    run.score += n;
    $("#hud-score").textContent = run.score;
    animate($("#hud-score-box"), "bump");
  }

  function judgeGate(gate) {
    gate.done = true;
    const lane = laneOf(run.px), q = gate.q;
    gate.pick = lane;
    gate.ok = q.opts[lane] === q.ans;
    const g = geo(), p = proj(g, run.px, 0), r = canvas.getBoundingClientRect();
    const sx = r.left + p.x, sy = r.top + p.y - g.R * 0.3;
    let delay;
    if (gate.ok) {
      run.correct++; run.combo++;
      const gain = 10 + Math.min(run.combo - 1, 5) * 2;
      sfx.correct();
      floatAt(sx, sy, "+" + gain, "#0284c7");
      addScore(gain);
      run.learned.push(q.learn);
      renderSlots(q, "ok");
      if (MATH) speak(q.say, "ko-KR"); else speak(q.say);
      run.jumpT = 0.55;
      const before = run.gateT;
      run.gateT = Math.max(T_MIN, run.gateT * 0.94);
      if (run.gateT < before) { run.boostT = 0.8; run.banner = { text: "🚀 가속!", t: 1.0 }; }
      msg(pick(PRAISE) + (run.combo >= 2 ? "  🔥 " + run.combo + "연속!" : ""));
      delay = 700;
    } else {
      sfx.wrong();
      run.combo = 0;
      run.lives--;
      renderHearts(true);
      renderSlots(q, "no");
      floatAt(sx, sy, "💦 첨벙!", "#2563eb");
      run.fallT = 0.9;
      run.gateT = Math.min(T_START, run.gateT + 0.25);
      msg("앗! 빈칸은 '" + q.ans + "' 이에요" + (MATH ? "" : " → " + q.learn.en.toUpperCase()));
      delay = 1500;
    }
    const tok = run.tok;
    setTimeout(() => {
      if (tok !== run.tok) return;
      run.i++;
      if (run.lives <= 0) finish();
      else if (run.i >= TOTAL) startGoal();
      else nextQuestion();
    }, delay);
  }

  /* ---------- 끝의 섬 ---------- */
  function startGoal() {
    run.goal = { z: Math.max(30, run.speed * 3.2), phase: "approach", t: 0 };
    msg("🏝️ 저기 섬이 보여요! 조금만 더!");
  }
  function updateGoal(dt) {
    const gl = run.goal;
    gl.t += dt;
    if (gl.phase === "approach") {
      gl.z -= run.speed * dt;
      run.dist += run.speed * dt;
      run.target = 0;
      if (gl.z <= 4.2) {
        gl.z = 4.2; gl.phase = "wave"; gl.t = 0;
        sfx.win(); confetti(30);
        msg("🎉 섬에 도착! 다 해냈어요!");
        run.banner = { text: "🎉 도착!", t: 1.8 };
      }
    } else if (gl.t > 2.6) {
      run.goal = null;
      finish();
    }
  }

  function frame(now) {
    if (!run.active) return;
    const dt = Math.min(0.05, (now - run.last) / 1000);
    run.last = now;
    let dir = (run.keys.r ? 1 : 0) - (run.keys.l ? 1 : 0);
    if (dir) run.target = null;
    else if (run.target != null) {
      const d = run.target - run.px;
      if (Math.abs(d) < 0.02) run.target = null;
      else dir = Math.max(-1, Math.min(1, d * 8));
    }
    if (run.fallT > 0 || (run.goal && run.goal.phase === "wave")) dir = 0;
    const fast = T_START / run.gateT;
    run.px = Math.max(-0.82, Math.min(0.82, run.px + dir * (1.9 + (fast - 1) * 1.2) * dt));
    run.lean += (dir * 0.25 - run.lean) * Math.min(1, dt * 10);
    $("#pad-l").classList.toggle("on", dir < -0.1);
    $("#pad-r").classList.toggle("on", dir > 0.1);

    if (run.goal) {
      updateGoal(dt);
      if (!run.active) return;
      if (run.goal && run.goal.phase === "approach") run.gates.forEach(gt => { gt.z -= run.speed * dt; });
    } else {
      run.dist += run.speed * dt;
      run.gates.forEach(gt => {
        gt.z -= run.speed * dt;
        if (!gt.done && gt.z <= 0) judgeGate(gt);
      });
    }
    run.gates = run.gates.filter(gt => gt.z > -CAM * 0.7);
    // 보드 뒤로 튀는 물보라
    if (!run.goal || run.goal.phase === "approach") {
      for (let k = 0; k < 2; k++) run.sprays.push({ x: run.px + (Math.random() - 0.5) * 0.25, z: -0.2, h: 0.02, vx: (Math.random() - 0.5) * 0.6 - run.lean, vh: 0.4 + Math.random() * 0.4, t: 0 });
    }
    run.sprays.forEach(s => { s.t += dt; s.x += s.vx * dt; s.h += s.vh * dt; s.vh -= 1.8 * dt; s.z -= run.speed * dt * 0.15; });
    run.sprays = run.sprays.filter(s => s.t < 0.5 && s.h > -0.02);
    run.jumpT = Math.max(0, run.jumpT - dt);
    run.fallT = Math.max(0, run.fallT - dt);
    run.boostT = Math.max(0, run.boostT - dt);
    if (run.banner && (run.banner.t -= dt) <= 0) run.banner = null;
    draw(now / 1000);
    loopBgm();
    run.raf = requestAnimationFrame(frame);
  }

  /* ---------- 그리기: 바다 길 ---------- */
  function draw(t) {
    const g = geo(), { W, H, cx, hy, gy, R } = g;
    ctx.clearRect(0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, "#7dd3fc"); sky.addColorStop(1, "#e0f7ff");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hy + 1);
    // 해와 구름
    ctx.fillStyle = "#fde68a"; ctx.beginPath(); ctx.arc(W * 0.86, hy * 0.42, Math.min(W, H) * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.9)";
    [[0.14, 0.35, 1], [0.48, 0.22, 0.8], [0.7, 0.55, 0.7]].forEach(([fx, fy, s]) => {
      const x = (fx * W + t * 8 * s) % (W + 120) - 60, y = hy * fy, r = 14 * s;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.arc(x + r * 1.2, y - r * 0.5, r * 1.2, 0, Math.PI * 2); ctx.arc(x + r * 2.4, y, r, 0, Math.PI * 2); ctx.fill();
    });
    // 먼 섬 실루엣
    ctx.fillStyle = "#86c48a";
    ctx.beginPath(); ctx.ellipse(W * 0.18, hy, W * 0.1, hy * 0.12, 0, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(W * 0.78, hy, W * 0.07, hy * 0.08, 0, Math.PI, 0); ctx.fill();
    // 바다
    const sea = ctx.createLinearGradient(0, hy, 0, H);
    sea.addColorStop(0, "#38bdf8"); sea.addColorStop(1, "#0284c7");
    ctx.fillStyle = sea; ctx.fillRect(0, hy, W, H - hy);
    // 물길(밝은 띠)
    const sb = (H - hy) / (gy - hy);
    ctx.fillStyle = "rgba(186,230,253,.55)";
    ctx.beginPath(); ctx.moveTo(cx, hy);
    ctx.lineTo(cx + 1.05 * sb * R, H); ctx.lineTo(cx - 1.05 * sb * R, H); ctx.closePath(); ctx.fill();
    // 다가오는 물결 줄
    ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineCap = "round";
    const woff = run.dist % 5;
    for (let k = -1; k < 14; k++) {
      const z = k * 5 - woff;
      if (z < -CAM * 0.6) continue;
      for (let x = -1.6; x <= 1.6; x += 0.8) {
        const a = proj(g, x + Math.sin(k * 1.7 + x) * 0.1, z), b = proj(g, x + 0.3, z);
        ctx.lineWidth = Math.max(1, 4 * a.s);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, a.y - 8 * a.s, b.x, b.y); ctx.stroke();
      }
    }
    // 물길 가장자리 거품 + 칸 나누는 점선
    ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, hy); ctx.lineTo(cx + 1.05 * sb * R, H);
    ctx.moveTo(cx, hy); ctx.lineTo(cx - 1.05 * sb * R, H);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.7)";
    const off = run.dist % 6;
    for (let k = -2; k < 12; k++) {
      const z = k * 6 - off;
      if (z < -CAM * 0.6) continue;
      [-1 / 3, 1 / 3].forEach(x => {
        const p1 = proj(g, x, z), p2 = proj(g, x, z + 2.4);
        ctx.lineWidth = Math.max(1, 6 * p1.s);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      });
    }
    // 빨라지면 바람 줄
    if (run.boostT > 0) {
      ctx.save();
      ctx.globalAlpha = run.boostT / 0.8 * 0.7;
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
      for (let k = 0; k < 8; k++) {
        const side = k % 2 ? 1 : -1, y = hy + (H - hy) * ((k * 0.13 + t * 2.5) % 1);
        const x = cx + side * (W * 0.28 + (k % 3) * W * 0.06);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + side * W * 0.06, y + H * 0.05); ctx.stroke();
      }
      ctx.restore();
    }
    // 길가 부표 (먼 것부터)
    const foff = run.dist % 10;
    for (let k = 7; k >= 0; k--) {
      const z = k * 10 - foff;
      if (z < -CAM * 0.5) continue;
      const idx = Math.floor((run.dist + z) / 10);
      [-1.25, 1.25].forEach((x, side) => drawBuoy(g, x, z, (idx + side) % 2 ? "#ff5d73" : "#fbbf24", t + k));
    }
    run.gates.filter(gt => gt.z >= 0).sort((a, b) => b.z - a.z).forEach(gt => drawGate(g, gt, t));
    if (run.goal) drawIsland(g, run.goal.z, t);
    drawSurfer(g, t);
    run.gates.filter(gt => gt.z < 0).forEach(gt => drawGate(g, gt, t));
    if (run.banner) drawBanner(g, run.banner);
  }
  function drawBuoy(g, x, z, col, t) {
    const b = proj(g, x, z), r = Math.max(2, g.R * 0.07 * b.s), bob = Math.sin(t * 3) * r * 0.15;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(b.x, b.y - r * 0.4 + bob, r, r * 0.8, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillRect(b.x - r, b.y - r * 0.55 + bob, r * 2, r * 0.3);
    ctx.strokeStyle = "#475569"; ctx.lineWidth = Math.max(1, r * 0.15);
    ctx.beginPath(); ctx.moveTo(b.x, b.y - r * 1.2 + bob); ctx.lineTo(b.x, b.y - r * 2.4 + bob); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(b.x, b.y - r * 2.4 + bob); ctx.lineTo(b.x + r, b.y - r * 2.1 + bob); ctx.lineTo(b.x, b.y - r * 1.8 + bob); ctx.fill();
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawBanner(g, bn) {
    const fs = Math.min(g.W * 0.07, 34);
    ctx.save();
    ctx.globalAlpha = Math.min(1, bn.t / 0.3);
    ctx.font = fs + "px CookieRun, Jua, sans-serif";
    const w = ctx.measureText(bn.text).width + fs * 1.4, h = fs * 1.9;
    const x = g.cx - w / 2, y = g.hy * 0.3;
    roundRect(x, y, w, h, h / 2);
    ctx.fillStyle = "#ffffff"; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = "#0ea5e9"; ctx.stroke();
    ctx.fillStyle = "#0c4a6e"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(bn.text, g.cx, y + h / 2 + fs * 0.05);
    ctx.restore();
  }
  // 물 위에 떠 있는 표지판: 정답 표지판은 지나가면 '퐁' 하고 사라지고, 틀린 표지판은 장애물(바위)이에요
  function drawGate(g, gt, t) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (Z_SPAWN - gt.z) / 10 + 0.15);
    LANES.forEach((c, i) => {
      const isAns = gt.q.opts[i] === gt.q.ans;
      if (gt.done && gt.ok && gt.pick === i) return;
      const bob = Math.sin(t * 2.5 + i) * 0.015;
      // 아래 바위/뜬 판
      const base = proj(g, c, gt.z), rw = 0.22 * g.R * base.s;
      ctx.fillStyle = "rgba(255,255,255,.6)";
      ctx.beginPath(); ctx.ellipse(base.x, base.y, rw * 1.25, rw * 0.28, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#64748b";
      ctx.beginPath(); ctx.ellipse(base.x, base.y - rw * 0.08, rw, rw * 0.45, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath(); ctx.ellipse(base.x - rw * 0.25, base.y - rw * 0.2, rw * 0.45, rw * 0.22, 0, Math.PI, 0); ctx.fill();
      // 기둥
      const pb = proj(g, c, gt.z, 0.08), pt = proj(g, c, gt.z, 0.3 + bob);
      ctx.strokeStyle = "#7c5a3a"; ctx.lineWidth = Math.max(1.5, 9 * base.s);
      ctx.beginPath(); ctx.moveTo(pb.x, pb.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();
      // 표지판
      const tl = proj(g, c - 0.24, gt.z, 0.66 + bob), br = proj(g, c + 0.24, gt.z, 0.3 + bob);
      const w = br.x - tl.x, h = br.y - tl.y;
      roundRect(tl.x, tl.y, w, h, Math.min(w, h) * 0.22);
      ctx.fillStyle = gt.done && !gt.ok && i === gt.pick ? "#cbd5e1" : "#ffffff";
      ctx.fill();
      ctx.lineWidth = Math.max(2, (gt.done && isAns ? 16 : 9) * tl.s);
      ctx.strokeStyle = gt.done && isAns ? "#34d399" : COLORS[i % COLORS.length];
      ctx.stroke();
      const txt = gt.q.opts[i];
      ctx.fillStyle = "#0c4a6e";
      ctx.font = "800 " + Math.max(8, h * (txt.length > 2 ? 0.5 : 0.7)) + "px Nunito, Pretendard, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(txt, tl.x + w / 2, tl.y + h / 2 + h * 0.05);
    });
    ctx.restore();
  }
  function drawIsland(g, z, t) {
    const b = proj(g, 0, z), W = g.R * 1.3 * b.s;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.beginPath(); ctx.ellipse(b.x, b.y, W * 0.62, W * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fde68a";
    ctx.beginPath(); ctx.ellipse(b.x, b.y - W * 0.02, W * 0.55, W * 0.16, 0, Math.PI, 0); ctx.fill();
    ctx.font = W * 0.42 + "px " + EMOJI_FONT;
    ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText("🌴", b.x - W * 0.25, b.y - W * 0.08);
    ctx.fillText("🌴", b.x + W * 0.28, b.y - W * 0.1);
    ctx.font = W * 0.2 + "px " + EMOJI_FONT;
    ctx.fillText("🚩", b.x + Math.sin(t * 4) * 2, b.y - W * 0.12);
    ctx.restore();
  }

  // 펭귄 (구구단 놀이터 펭귄 달리기와 같은 그림)
  function drawPenguinFront(s, t) {
    const waveA = -1.9 + Math.sin(t * 9) * 0.45;
    ctx.fillStyle = "#ff9f43";
    [-1, 1].forEach(side => { ctx.beginPath(); ctx.ellipse(side * s * 0.14, -s * 0.03, s * 0.12, s * 0.05, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#1f1b2e";
    [[-1, 0.12], [1, waveA]].forEach(([side, rot]) => {
      ctx.save(); ctx.translate(side * s * 0.25, -s * 0.58); ctx.rotate(rot);
      ctx.beginPath(); ctx.moveTo(0, -s * 0.06);
      ctx.quadraticCurveTo(side * s * 0.26, s * 0.02, side * s * 0.34, s * 0.3);
      ctx.quadraticCurveTo(side * s * 0.14, s * 0.18, 0, s * 0.14);
      ctx.closePath(); ctx.fill(); ctx.restore();
    });
    ctx.beginPath(); ctx.ellipse(0, -s * 0.4, s * 0.31, s * 0.38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.ellipse(0, -s * 0.34, s * 0.21, s * 0.29, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1f1b2e";
    ctx.beginPath(); ctx.arc(0, -s * 0.74, s * 0.23, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.ellipse(-s * 0.08, -s * 0.73, s * 0.09, s * 0.11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.08, -s * 0.73, s * 0.09, s * 0.11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#1f1b2e"; ctx.lineWidth = Math.max(1.5, s * 0.025); ctx.lineCap = "round";
    [-1, 1].forEach(side => { ctx.beginPath(); ctx.arc(side * s * 0.08, -s * 0.74, s * 0.04, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); });
    ctx.fillStyle = "rgba(255,120,150,.6)";
    [-1, 1].forEach(side => { ctx.beginPath(); ctx.ellipse(side * s * 0.13, -s * 0.66, s * 0.04, s * 0.025, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#ff9f43";
    ctx.beginPath(); ctx.moveTo(-s * 0.055, -s * 0.67); ctx.quadraticCurveTo(0, -s * 0.6, s * 0.055, -s * 0.67); ctx.quadraticCurveTo(0, -s * 0.7, -s * 0.055, -s * 0.67); ctx.fill();
  }
  function drawPenguinBack(s) {
    // 서핑할 때는 양 날개를 옆으로 벌려 균형을 잡아요
    const wingRot = side => run.jumpT > 0 ? -side * 0.7 : -side * 0.35;
    ctx.fillStyle = "#1f1b2e";
    [-1, 1].forEach(side => {
      ctx.save(); ctx.translate(side * s * 0.25, -s * 0.58); ctx.rotate(wingRot(side));
      ctx.beginPath(); ctx.moveTo(0, -s * 0.06);
      ctx.quadraticCurveTo(side * s * 0.26, s * 0.02, side * s * 0.34, s * 0.3);
      ctx.quadraticCurveTo(side * s * 0.14, s * 0.18, 0, s * 0.14);
      ctx.closePath(); ctx.fill(); ctx.restore();
    });
    ctx.beginPath(); ctx.ellipse(0, -s * 0.4, s * 0.31, s * 0.38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -s * 0.74, s * 0.23, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ff9f43";
    [-1, 1].forEach(side => { ctx.beginPath(); ctx.ellipse(side * s * 0.15, -s * 0.03, s * 0.11, s * 0.05, 0, 0, Math.PI * 2); ctx.fill(); });
  }
  function drawBoard(s) {
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f472b6";
    ctx.fillRect(-s * 0.05, -s * 0.1, s * 0.1, s * 0.2);
    ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = Math.max(1, s * 0.02);
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.12, 0, 0, Math.PI * 2); ctx.stroke();
  }
  function drawSurfer(g, t) {
    const p = proj(g, run.px, 0);
    const size = Math.min(g.R * 0.42, (g.gy - g.hy) * 0.5);
    // 물보라
    run.sprays.forEach(s => {
      const q = proj(g, s.x, s.z, s.h);
      ctx.fillStyle = "rgba(255,255,255," + (0.8 * (1 - s.t / 0.5)).toFixed(2) + ")";
      ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(1.5, size * 0.035), 0, Math.PI * 2); ctx.fill();
    });
    if (run.goal && run.goal.phase === "wave") {
      const hop = Math.abs(Math.sin(run.goal.t * 5)) * g.R * 0.05;
      ctx.save(); ctx.translate(p.x, p.y); drawBoard(size); ctx.translate(0, -size * 0.04 - hop); drawPenguinFront(size, t); ctx.restore();
      return;
    }
    let y = p.y + Math.sin(t * 5) * size * 0.03, rot = run.lean + Math.sin(t * 3) * 0.05;
    if (run.jumpT > 0) y -= Math.sin(Math.PI * (1 - run.jumpT / 0.55)) * g.R * 0.28;
    let sink = 0;
    if (run.fallT > 0) {
      const k = 1 - run.fallT / 0.9;
      rot = Math.sin(k * Math.PI * 4) * 0.5 * (1 - k);
      sink = Math.sin(Math.PI * k) * size * 0.25;
    }
    ctx.save();
    ctx.translate(p.x, y);
    ctx.rotate(rot * 0.6);
    drawBoard(size);
    ctx.save(); ctx.translate(0, -size * 0.04 + sink); drawPenguinBack(size); ctx.restore();
    if (run.fallT > 0) {
      // 첨벙! 물방울이 튀어요
      ctx.fillStyle = "rgba(255,255,255,.9)";
      const k = 1 - run.fallT / 0.9;
      for (let d = 0; d < 6; d++) {
        const a = Math.PI + d / 5 * Math.PI;
        ctx.beginPath(); ctx.arc(Math.cos(a) * size * 0.5 * (0.5 + k), Math.sin(a) * size * 0.5 * k - size * 0.1, size * 0.05, 0, Math.PI * 2); ctx.fill();
      }
      ctx.font = size * 0.4 + "px " + EMOJI_FONT;
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText("💫", 0, -size * 1.02);
    }
    ctx.restore();
  }

  /* ---------- 끝 ---------- */
  function finish() {
    if (!run.active) return;
    stopRun();
    const n = run.correct, done = run.lives > 0;
    const stars = n >= 14 ? 3 : n >= 10 ? 2 : n >= 6 ? 1 : 0;
    $("#result-title").textContent = !done ? "하트를 다 썼어요! 다시 도전! 💪" : stars === 3 ? "완벽해요! 🏆" : stars === 2 ? "아주 잘했어요! 🎉" : "잘했어요! 💪";
    $("#result-stars").innerHTML = [1, 2, 3].map(k => '<span class="' + (k <= stars ? "" : "dim") + '">⭐</span>').join("");
    let isRecord;
    if (MATH) isRecord = ML.saveBest("surf", run.score).isRecord;
    else {
      const data = userData(); data.best = data.best || {};
      const key = "g" + grade.grade, best = data.best[key] || 0;
      isRecord = run.score > best;
      if (isRecord) data.best[key] = run.score;
      saveUserData(data);
    }
    const label = MATH ? "🏄 " + ML.danText() : "🏄 " + grade.grade + "학년";
    $("#result-text").innerHTML = esc(label) + " · 맞힌 빈칸 <b>" + n + "</b> / " + TOTAL + "<br>" +
      "점수 <b>" + run.score + "</b>점" + (isRecord && run.score > 0 ? '<span class="record">🎊 최고 기록!</span>' : "");
    const wb = $("#result-words"); wb.innerHTML = "";
    run.learned.forEach(w => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "word-chip";
      b.innerHTML = esc((w.emoji ? w.emoji + " " : "") + w.en) + (w.ko ? "<small>" + esc(w.ko) + "</small>" : "");
      if (!MATH) { b.title = "눌러서 듣기"; b.addEventListener("click", () => speak(w.en)); }
      wb.appendChild(b);
    });
    show("screen-result");
  }
  $("#btn-again").addEventListener("click", startRun);
  $("#btn-result-back").addEventListener("click", () => { if (MATH) ML.back(); else { renderGrades(); show("screen-grade"); } });
  $("#btn-quit").addEventListener("click", () => { stopRun(); if (MATH) ML.back(); else { renderGrades(); show("screen-grade"); } });
  $("#btn-say").addEventListener("click", () => { if (run.cur) { if (MATH) speak(run.cur.say, "ko-KR"); else speak(run.cur.say); } });

  /* ---------- 구구단 놀이터에서 열었을 때 ---------- */
  if (MATH) {
    document.title = "구구단 서핑";
    $("#title-name").textContent = "구구단 서핑";
    $("#title-sub").textContent = "빈칸에 들어갈 숫자 물길로 쌩쌩 서핑! (" + ML.danText() + ")";
    const back = $("#title-back");
    back.textContent = "← 게임 고르기";
    back.addEventListener("click", e => { e.preventDefault(); ML.back(); });
    $("#btn-result-back").textContent = "게임 고르기";
    $("#btn-say").style.display = "none";
  }

  /* ---------- 조작 ---------- */
  const field = $("#field");
  let swipe = null;
  function aim(e) {
    const g = geo(), r = field.getBoundingClientRect();
    run.target = Math.max(-0.82, Math.min(0.82, (e.clientX - r.left - g.cx) / g.R));
  }
  function nextLane(dir) {
    const from = run.target != null ? run.target : run.px;
    const lanes = dir > 0 ? LANES.filter(x => x > from + 0.05) : LANES.filter(x => x < from - 0.05).reverse();
    return lanes.length ? lanes[0] : dir * 0.82;
  }
  field.addEventListener("pointerdown", e => {
    if (e.target.closest(".run-pad") || !run.active) return;
    try { field.setPointerCapture(e.pointerId); } catch (err) { /* 이미 끝난 터치 */ }
    if (e.pointerType === "mouse") aim(e);
    else swipe = { x: e.clientX, px: run.px, t: performance.now(), moved: false };
  });
  field.addEventListener("pointermove", e => {
    if (!field.hasPointerCapture(e.pointerId)) return;
    if (e.pointerType === "mouse") { aim(e); return; }
    if (!swipe) return;
    const dx = e.clientX - swipe.x;
    if (!swipe.moved && Math.abs(dx) > 14) swipe.moved = true;
    if (swipe.moved) run.target = Math.max(-0.82, Math.min(0.82, swipe.px + dx * 1.6 / geo().R));
  });
  field.addEventListener("pointerup", e => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x, quick = performance.now() - swipe.t < 300;
    if (!swipe.moved) aim(e);
    else if (quick && Math.abs(dx) > 30) {
      const lane = nextLane(Math.sign(dx));
      if (Math.sign(dx) * (lane - run.target) > 0) run.target = lane;
    }
    swipe = null;
  });
  field.addEventListener("pointercancel", () => { swipe = null; });
  [["#pad-l", "l", -1], ["#pad-r", "r", 1]].forEach(([sel, k, dir]) => {
    const pad = $(sel);
    let holdTimer = null;
    pad.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (!run.active) return;
      run.target = nextLane(dir);
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => { run.keys[k] = true; }, 250);
      try { pad.setPointerCapture(e.pointerId); } catch (err) { /* 이미 끝난 터치 */ }
    });
    const up = () => { clearTimeout(holdTimer); run.keys[k] = false; };
    pad.addEventListener("pointerup", up);
    pad.addEventListener("pointercancel", up);
    pad.addEventListener("lostpointercapture", up);
  });
  const RUN_KEYS = { ArrowLeft: "l", a: "l", A: "l", ArrowRight: "r", d: "r", D: "r" };
  document.addEventListener("keydown", e => {
    if (!run.active || !RUN_KEYS[e.key] || document.querySelector(".gb-overlay.show")) return;
    run.keys[RUN_KEYS[e.key]] = true; e.preventDefault();
  });
  document.addEventListener("keyup", e => { if (RUN_KEYS[e.key]) run.keys[RUN_KEYS[e.key]] = false; });
  window.addEventListener("blur", () => { run.keys.l = run.keys.r = false; });
})();
