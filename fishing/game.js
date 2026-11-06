// 🎣 알파벳 낚시: 빈칸이 있는 영어 단어(M _ N K E Y)를 보고, 빈칸 알파벳을 단 물고기를 낚아요.
// ← → 로 배를 옮기고 스페이스(↓, 🎣 버튼)로 낚싯줄을 내려요. 바다를 톡 누르면 그 자리로 가서 내려요.
// 맞는 물고기를 낚으면 빈칸이 채워지고, 틀린 물고기는 '퐁' 하고 도망가며 하트 -1.
// 구구단 놀이터에서 열면(?mul=1) '구구단 낚시': 3 × _ = 12 의 빈칸 숫자 물고기를 낚아요.
(function () {
  "use strict";

  const $ = s => document.querySelector(s);
  const ML = window.MulLink || { on: false }, MATH = ML.on;
  const GRADES = window.SPELL_GRADES;
  const TOTAL = 12, LIVES = 5;
  const MAX_FISH = 7;          // 바닷속 물고기는 많아야 7마리
  const PROFILES_KEY = "fishing_profiles", GUIDE_ID = MATH ? "fishing_mul" : "fishing";
  const SOUND = !MATH || ML.sound;
  const VOWELS = "AEIOU", CONSONANTS = "BCDFGHKLMNPRSTW";
  const FISH_COLORS = ["#fb923c", "#f472b6", "#facc15", "#60a5fa", "#a78bfa", "#34d399", "#f87171"];

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
    drop() { tone(600, 0.25, "sine", 0, 0.06, 250); },
    plop() { tone(300, 0.08, "sine", 0, 0.1, 700); },
    correct() { [784, 988, 1319].forEach((f, i) => tone(f, 0.14, "triangle", i * 0.07, 0.13)); },
    wrong() { tone(220, 0.22, "square", 0, 0.06); tone(160, 0.3, "sine", 0.1, 0.1); },
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
    const bits = ["🎉", "🎊", "⭐", "🐟", "🐠", "🌟", "🫧"];
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
  const PRAISE = ["딩동댕! 🎉", "월척이다! 🐟", "잘했어요! 👏", "멋져요! 💖", "낚았다! 🎣"];

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
      id: GUIDE_ID, title: MATH ? "구구단 낚시" : "알파벳 낚시",
      pages: [
        { icon: "🎣", title: "빈칸을 봐요", text: MATH ? "위에 <b>빈칸</b>이 있는 구구단이 나와요.<br>예) <b>3 × _ = 12</b> → 빈칸은 <b>4</b>" : "위에 <b>빈칸</b>이 있는 영어 단어가 나와요.<br>예) <b>M _ N K E Y</b> → 빈칸은 <b>O</b>" },
        { icon: "🐟", title: "물고기를 찾아요", text: "바닷속 물고기마다 " + (MATH ? "<b>숫자</b>" : "<b>알파벳</b>") + "이 하나씩 있어요.<br>빈칸에 맞는 물고기를 찾아요!" },
        { icon: "⬅️➡️", title: "배를 옮겨요", text: "<b>← →</b> 로 배를 옮기고 <b>스페이스바</b>(↓)로 낚싯줄을 내려요.<br>태블릿은 바다를 <b>톡</b> 누르면 그 자리로 가서 내려요." },
        { icon: "💦", title: "틀리면 퐁!", text: "틀린 물고기를 낚으면 <b>퐁</b> 하고 도망가요. ❤️ 하트가 하나 줄어요.<br>" + TOTAL + "문제를 다 낚으면 끝!" }
      ],
      startText: "자, 낚시하러 가 볼까?", startLabel: "출발! 🎣", onStart
    };
  }
  function choose() {
    if (!GuideBook.isRead(GUIDE_ID)) GuideBook.open(guide(startGame));
    else startGame();
  }
  $("#btn-guide").addEventListener("click", () => GuideBook.open(guide(null)));

  /* ---------- 문제 (알파벳 서핑과 같은 방식) ---------- */
  const ALL_WORDS = new Set();
  GRADES.forEach(g => g.words.forEach(w => ALL_WORDS.add(w[0].toUpperCase())));
  function englishQuestions() {
    return shuffle(grade.words.slice()).slice(0, TOTAL).map(w => {
      const word = w[0].toUpperCase();
      const at = rand(0, word.length - 1), ans = word[at];
      // 넣어도 다른 단어가 되지 않는 글자만 섞어요 (모음이면 모음끼리, 자음이면 자음끼리)
      const pool = (VOWELS.indexOf(ans) >= 0 ? VOWELS : CONSONANTS).split("").filter(ch => ch !== ans && !ALL_WORDS.has(word.slice(0, at) + ch + word.slice(at + 1)));
      const decoys = shuffle(pool).slice(0, 4);
      while (decoys.length < 4) { const ch = pick(CONSONANTS.split("")); if (ch !== ans && decoys.indexOf(ch) < 0) decoys.push(ch); }
      return { slots: word.split("").map((ch, i) => ({ t: ch, blank: i === at })), ans, decoys, emoji: w[1], sub: w[2], say: w[0],
        learn: { en: w[0], ko: w[2], emoji: w[1] } };
    });
  }
  function mathQuestions() {
    return ML.questions(TOTAL).map(([a, b]) => {
      const r = Math.random(), kind = r < 0.5 ? "ans" : r < 0.8 ? "b" : "a", c = a * b;
      let ans, decoys;
      if (kind === "ans") { ans = c; decoys = ML.choices(a, b, 5).filter(n => n !== c); }
      else {
        ans = kind === "b" ? b : a;
        const lo = kind === "b" ? 1 : 2, hi = kind === "b" ? 9 : 12;
        decoys = shuffle([ans - 1, ans + 1, ans - 2, ans + 2, ans + 3].filter(n => n >= lo && n <= hi && n !== ans)).slice(0, 4);
      }
      return { slots: [{ t: String(a), blank: kind === "a" }, { t: "×", op: true }, { t: String(b), blank: kind === "b" }, { t: "=", op: true }, { t: String(c), blank: kind === "ans" }],
        ans: String(ans), decoys: decoys.map(String), emoji: "🔢", sub: "빈칸 숫자 물고기를 낚아요!", say: a + " 곱하기 " + b + "는 " + c,
        learn: { en: a + " × " + b + " = " + c, ko: "", emoji: "" } };
    });
  }

  /* ---------- 게임 상태 ---------- */
  const canvas = $("#sea-canvas"), ctx = canvas.getContext("2d");
  const G = {
    W: 0, H: 0, raf: 0, last: 0, t: 0, active: false,
    bx: 0.5, target: null, autoDrop: false, keys: { l: false, r: false },
    hook: null, fish: [], spawnT: 0, bubbles: [], splashes: [],
    qs: [], i: 0, cur: null, lives: LIVES, score: 0, combo: 0, correct: 0, missed: false, learned: [], ending: 0, busy: false
  };
  function resize() {
    const r = $("#field").getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    G.W = r.width; G.H = r.height;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", () => { if (G.active) resize(); });
  const seaY = () => G.H * 0.24;                 // 물 위
  const fishR = () => Math.max(20, Math.min(34, Math.min(G.W, G.H) * 0.055));
  // 물고기가 다니는 세 줄 깊이
  const rowY = k => seaY() + (G.H - seaY()) * (0.28 + k * 0.26);

  function startGame() {
    stopGame();
    Object.assign(G, {
      active: true, bx: 0.5, target: null, autoDrop: false, hook: null, fish: [], spawnT: 0, bubbles: [], splashes: [],
      qs: MATH ? mathQuestions() : englishQuestions(), i: 0, cur: null, lives: LIVES, score: 0, combo: 0, correct: 0, learned: [], ending: 0, busy: false, t: 0
    });
    G.keys.l = G.keys.r = false;
    $("#hud-score").textContent = "0";
    renderHearts();
    show("screen-game");
    resize();
    msg("← → 로 배를 옮기고 스페이스바로 낚싯줄을 내려요! 🎣");
    nextQuestion();
    G.last = performance.now();
    G.raf = requestAnimationFrame(frame);
  }
  function stopGame() { G.active = false; cancelAnimationFrame(G.raf); }
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
    const q = G.qs[G.i];
    G.cur = q; G.missed = false; G.busy = false;
    renderSlots(q);
    $("#q-emoji").textContent = q.emoji;
    $("#q-sub").textContent = q.sub;
    $("#hud-q").textContent = (G.i + 1) + " / " + TOTAL;
    animate($(".q-card"), "pop");
    // 바닷속 물고기는 그대로 계속 헤엄쳐요. 먼저 나와 있던 물고기도 새 정답이면 낚을 수 있어요.
    // 정답 물고기가 없을 때만 넣고, 헷갈리는 물고기를 몇 마리 더해요
    const live = G.fish.filter(f => !f.leave && !f.caught);
    const add = live.some(f => f.v === q.ans) ? [] : [q.ans];
    const want = live.length ? 3 : 5;
    shuffle(q.decoys.slice()).forEach(v => { if (add.length < want && !live.some(f => f.v === v) && add.indexOf(v) < 0) add.push(v); });
    // 너무 많아지면 오래된 물고기부터 천천히 헤엄쳐 나가요 (정답 물고기는 남겨요)
    let over = live.length + add.length - MAX_FISH;
    live.forEach(f => { if (over > 0 && f.v !== q.ans) { f.leave = true; over--; } });
    shuffle(add).forEach((v, k) => addFish(v, k * 0.5));
    G.spawnT = 3;
  }
  function addFish(v, delay) {
    const dir = Math.random() < 0.5 ? 1 : -1, row = rand(0, 2);
    const used = G.fish.filter(f => !f.leave && f.row === row).length;
    G.fish.push({
      v, row: used >= 2 ? (row + 1) % 3 : row, dir, x: dir > 0 ? -0.1 - delay * 0.2 : 1.1 + delay * 0.2,
      speed: 0.05 + Math.random() * 0.04, ph: Math.random() * 6, color: pick(FISH_COLORS), caught: false, flee: 0, leave: false
    });
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

  /* ---------- 낚싯줄 ---------- */
  function drop() {
    if (!G.active || G.ending || G.hook || G.busy) return;
    G.hook = { x: G.bx, y: seaY() - 10, state: "down", fish: null };
    sfx.drop();
  }
  function hooked(f) {
    const q = G.cur, r = canvas.getBoundingClientRect(), sx = r.left + f.x * G.W, sy = r.top + G.hook.y - 30;
    if (f.v === q.ans) {
      f.caught = true;
      G.hook.fish = f; G.hook.state = "up";
      sfx.plop();
      return;
    }
    // 틀린 물고기: 퐁 하고 도망가요
    f.flee = 1; f.dir = -f.dir; f.speed = 0.5;
    G.hook.state = "up";
    G.combo = 0; G.missed = true;
    G.lives--;
    renderHearts(true);
    sfx.wrong();
    floatAt(sx, sy, "퐁! ❤️-1", "#ef4444");
    msg("앗! '" + f.v + "' 이(가) 아니에요. 빈칸에 맞는 물고기를 찾아요!");
    if (G.lives <= 0) { G.ending = 1.3; msg("하트를 다 썼어요… 😢"); }
  }
  function landed(f) {
    // 맞는 물고기를 배까지 끌어올렸어요
    const q = G.cur, r = canvas.getBoundingClientRect(), sx = r.left + G.bx * G.W, sy = r.top + seaY() - 40;
    G.correct++; G.combo++;
    const gain = G.missed ? 5 : 10 + Math.min(G.combo - 1, 5) * 2;
    addScore(gain);
    sfx.correct();
    floatAt(sx, sy, "+" + gain, "#0284c7");
    G.splashes.push({ x: G.bx, t: 0 });
    renderSlots(q, "ok");
    G.learned.push(q.learn);
    if (MATH) speak(q.say, "ko-KR"); else speak(q.say);
    msg(pick(PRAISE) + (G.combo >= 2 ? "  🔥 " + G.combo + "연속!" : ""));
    G.fish = G.fish.filter(o => o !== f);
    G.busy = true;
    G.i++;
    setTimeout(() => {
      if (!G.active || G.ending) return;
      if (G.i >= TOTAL) { G.ending = 1.6; G.win = true; sfx.win(); confetti(30); msg("🎉 다 낚았어요! 최고의 낚시꾼!"); return; }
      nextQuestion();
    }, 1100);
  }

  /* ---------- 매 프레임 ---------- */
  function frame(now) {
    if (!G.active) return;
    const dt = Math.min(0.05, (now - G.last) / 1000);
    G.last = now; G.t += dt;
    const W = G.W, H = G.H, R = fishR();
    // 배 움직이기
    let dir = (G.keys.r ? 1 : 0) - (G.keys.l ? 1 : 0);
    if (G.hook) dir = 0;
    else if (dir) { G.target = null; G.autoDrop = false; }
    else if (G.target != null) {
      const d = G.target - G.bx;
      if (Math.abs(d) < 0.006) { G.target = null; if (G.autoDrop) { G.autoDrop = false; drop(); } }
      else dir = Math.max(-1, Math.min(1, d * 14));
    }
    G.bx = Math.max(0.06, Math.min(0.94, G.bx + dir * 0.55 * dt * Math.min(1.6, 700 / Math.max(300, W))));
    // 낚싯줄
    const h = G.hook;
    if (h) {
      h.x = G.bx;
      if (h.state === "down") {
        h.y += H * 0.75 * dt;
        const hit = G.fish.find(f => !f.caught && !f.flee && !f.leave && Math.abs(f.x * W - (h.x * W + 36)) < R * 1.25 && Math.abs(rowY(f.row) - h.y) < R * 0.8);
        if (hit) hooked(hit);
        else if (h.y > H - 10) h.state = "up";
      } else {
        h.y -= H * (h.fish ? 0.6 : 1.1) * dt;
        if (h.fish) { h.fish.x = h.x; h.fish.hy = h.y; }
        if (h.y <= seaY() - 10) {
          const f = h.fish; G.hook = null;
          if (f) landed(f);
        }
      }
    }
    // 물고기 헤엄
    G.fish.forEach(f => {
      if (f.caught) return;
      f.x += f.dir * f.speed * dt;
      if (f.flee > 0) f.flee = Math.max(0, f.flee - dt);
      if (!f.leave && f.speed > 0.1 && f.flee <= 0) f.speed = 0.06;
      // 화면 끝에서 돌아와요 (떠나는 물고기는 그냥 나가요)
      if (!f.leave && ((f.dir > 0 && f.x > 1.08) || (f.dir < 0 && f.x < -0.08))) { f.dir = -f.dir; f.row = rand(0, 2); }
    });
    G.fish = G.fish.filter(f => f.caught || !f.leave || (f.x > -0.2 && f.x < 1.2));
    // 정답 물고기가 사라졌으면 다시 넣어요
    if (!G.busy && !G.ending && !G.fish.some(f => !f.leave && !f.flee && f.v === G.cur.ans) && (G.spawnT -= dt) <= 0) { addFish(G.cur.ans, 0); G.spawnT = 2; }
    if (Math.random() < dt * 2) G.bubbles.push({ x: Math.random(), y: H, s: 2 + Math.random() * 4 });
    G.bubbles.forEach(b => { b.y -= 40 * dt; b.x += Math.sin(G.t * 2 + b.s) * 0.0005; });
    G.bubbles = G.bubbles.filter(b => b.y > seaY());
    G.splashes.forEach(s => { s.t += dt; });
    G.splashes = G.splashes.filter(s => s.t < 0.8);
    if (G.ending && (G.ending -= dt) <= 0) { G.ending = 0; endGame(); return; }
    draw();
    G.raf = requestAnimationFrame(frame);
  }

  /* ---------- 그리기 ---------- */
  function draw() {
    const W = G.W, H = G.H, sy = seaY(), R = fishR(), t = G.t;
    const sky = ctx.createLinearGradient(0, 0, 0, sy);
    sky.addColorStop(0, "#7dd3fc"); sky.addColorStop(1, "#e0f7ff");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, sy + 1);
    ctx.fillStyle = "#fde68a"; ctx.beginPath(); ctx.arc(W * 0.88, sy * 0.4, Math.min(W, H) * 0.05, 0, Math.PI * 2); ctx.fill();
    const sea = ctx.createLinearGradient(0, sy, 0, H);
    sea.addColorStop(0, "#38bdf8"); sea.addColorStop(1, "#075985");
    ctx.fillStyle = sea; ctx.fillRect(0, sy, W, H - sy);
    // 바다 바닥 모래 · 해초
    ctx.fillStyle = "#fcd34d"; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, H - 14 - Math.sin(x * 0.05) * 6); ctx.lineTo(W, H); ctx.fill();
    ctx.strokeStyle = "#16a34a"; ctx.lineWidth = 5; ctx.lineCap = "round";
    [0.08, 0.3, 0.55, 0.8, 0.95].forEach((fx, k) => {
      const x = fx * W; ctx.beginPath(); ctx.moveTo(x, H - 12);
      ctx.quadraticCurveTo(x + Math.sin(t * 1.5 + k) * 12, H - 50, x + Math.sin(t * 1.5 + k + 1) * 8, H - 80 - k * 6); ctx.stroke();
    });
    // 물방울
    ctx.fillStyle = "rgba(255,255,255,.35)";
    G.bubbles.forEach(b => { ctx.beginPath(); ctx.arc(b.x * W, b.y, b.s, 0, Math.PI * 2); ctx.fill(); });
    // 물고기
    G.fish.forEach(f => { if (!f.caught) drawFish(f, f.x * W, rowY(f.row) + Math.sin(t * 2 + f.ph) * 6, R, f.flee > 0); });
    // 낚싯줄 + 낚인 물고기
    const bx = G.bx * W, rodX = bx + 36, rodY = sy - 52;
    if (G.hook) {
      ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(rodX, rodY); ctx.lineTo(rodX, G.hook.y); ctx.stroke();
      ctx.strokeStyle = "#475569"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(rodX - 5, G.hook.y, 6, 0, Math.PI); ctx.stroke();
      if (G.hook.fish) drawFish(G.hook.fish, rodX, G.hook.y + R * 0.6, R, false, true);
    }
    // 물결선
    ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 10) { const y = sy + Math.sin(x * 0.04 + t * 3) * 3; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    G.splashes.forEach(s => {
      const k = s.t / 0.8;
      ctx.strokeStyle = "rgba(255,255,255," + (1 - k).toFixed(2) + ")"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(s.x * W + 36, sy, 20 + k * 40, 5 + k * 8, 0, 0, Math.PI * 2); ctx.stroke();
    });
    drawBoat(bx, sy, t);
    // 겨누는 점선
    if (!G.hook && !G.ending) {
      ctx.setLineDash([4, 8]); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(rodX, sy + 6); ctx.lineTo(rodX, H - 20); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  function drawFish(f, x, y, R, fleeing, hanging) {
    ctx.save();
    ctx.translate(x, y);
    if (hanging) ctx.rotate(-Math.PI / 2 + Math.sin(G.t * 12) * 0.25);
    else ctx.scale(f.dir, 1);
    if (fleeing) ctx.globalAlpha = 0.6;
    const wag = Math.sin(G.t * 10 + f.ph) * 0.25;
    // 꼬리
    ctx.fillStyle = f.color;
    ctx.save(); ctx.translate(-R * 0.95, 0); ctx.rotate(wag);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-R * 0.6, -R * 0.5); ctx.lineTo(-R * 0.6, R * 0.5); ctx.closePath(); ctx.fill();
    ctx.restore();
    // 몸
    ctx.beginPath(); ctx.ellipse(0, 0, R * 1.15, R * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.3)"; ctx.beginPath(); ctx.ellipse(-R * 0.1, R * 0.35, R * 0.7, R * 0.25, 0, 0, Math.PI * 2); ctx.fill();
    // 눈
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(R * 0.65, -R * 0.2, R * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1e293b"; ctx.beginPath(); ctx.arc(R * 0.7, -R * 0.2, R * 0.1, 0, Math.PI * 2); ctx.fill();
    // 글자 (몸 가운데, 뒤집히지 않게)
    ctx.scale(hanging ? 1 : f.dir, 1);
    if (hanging) ctx.rotate(Math.PI / 2);
    const txt = String(f.v);
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(hanging ? 0 : -f.dir * R * 0.15, 0, R * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0c4a6e";
    ctx.font = "800 " + R * (txt.length > 2 ? 0.48 : txt.length > 1 ? 0.6 : 0.78) + "px Nunito, Pretendard, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(txt, hanging ? 0 : -f.dir * R * 0.15, R * 0.04);
    ctx.restore();
  }
  function drawBoat(x, sy, t) {
    const bob = Math.sin(t * 2) * 2;
    ctx.save();
    ctx.translate(x, sy + bob);
    // 낚시하는 고양이
    ctx.font = "30px " + '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillStyle = "#000";
    ctx.fillText("🐱", -6, -12);
    // 낚싯대
    ctx.strokeStyle = "#92400e"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(4, -22); ctx.lineTo(36, -52); ctx.stroke();
    // 배
    ctx.fillStyle = "#ef4444";
    ctx.beginPath(); ctx.moveTo(-40, -14); ctx.lineTo(40, -14); ctx.lineTo(28, 6); ctx.lineTo(-28, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillRect(-36, -12, 72, 4);
    ctx.restore();
  }

  /* ---------- 끝 ---------- */
  function endGame() {
    stopGame();
    const won = !!G.win; G.win = false;
    const n = G.correct;
    const stars = won ? (G.lives >= 4 ? 3 : G.lives >= 2 ? 2 : 1) : (n >= 6 ? 1 : 0);
    $("#result-title").textContent = !won ? "하트를 다 썼어요! 다시 도전! 💪" : stars === 3 ? "완벽해요! 🏆" : stars === 2 ? "아주 잘했어요! 🎉" : "잘했어요! 💪";
    $("#result-stars").innerHTML = [1, 2, 3].map(k => '<span class="' + (k <= stars ? "" : "dim") + '">⭐</span>').join("");
    let isRecord;
    if (MATH) isRecord = ML.saveBest("fishing", G.score).isRecord;
    else {
      const data = userData(); data.best = data.best || {};
      const key = "g" + grade.grade, best = data.best[key] || 0;
      isRecord = G.score > best;
      if (isRecord) data.best[key] = G.score;
      saveUserData(data);
    }
    const label = MATH ? "🎣 " + ML.danText() : "🎣 " + grade.grade + "학년";
    $("#result-text").innerHTML = esc(label) + " · 낚은 빈칸 <b>" + n + "</b> / " + TOTAL + "<br>" +
      "점수 <b>" + G.score + "</b>점" + (isRecord && G.score > 0 ? '<span class="record">🎊 최고 기록!</span>' : "");
    const wb = $("#result-words"); wb.innerHTML = "";
    G.learned.forEach(w => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "word-chip";
      b.innerHTML = esc((w.emoji ? w.emoji + " " : "") + w.en) + (w.ko ? "<small>" + esc(w.ko) + "</small>" : "");
      if (!MATH) { b.title = "눌러서 듣기"; b.addEventListener("click", () => speak(w.en)); }
      wb.appendChild(b);
    });
    show("screen-result");
  }
  $("#btn-again").addEventListener("click", choose);
  $("#btn-result-back").addEventListener("click", () => { if (MATH) ML.back(); else { renderGrades(); show("screen-grade"); } });
  $("#btn-quit").addEventListener("click", () => { stopGame(); if (MATH) ML.back(); else { renderGrades(); show("screen-grade"); } });
  $("#btn-say").addEventListener("click", () => { if (G.cur) { if (MATH) speak(G.cur.say, "ko-KR"); else speak(G.cur.say); } });

  if (MATH) {
    document.title = "구구단 낚시";
    $("#title-name").textContent = "구구단 낚시";
    $("#title-sub").textContent = "빈칸에 들어갈 숫자 물고기를 낚아요! (" + ML.danText() + ")";
    const back = $("#title-back");
    back.textContent = "← 게임 고르기";
    back.addEventListener("click", e => { e.preventDefault(); ML.back(); });
    $("#btn-result-back").textContent = "게임 고르기";
    $("#btn-say").style.display = "none";
  }

  /* ---------- 조작 ---------- */
  const KEYS = { ArrowLeft: "l", a: "l", A: "l", ArrowRight: "r", d: "r", D: "r" };
  document.addEventListener("keydown", e => {
    if (!G.active || document.querySelector(".gb-overlay.show")) return;
    if (KEYS[e.key]) { G.keys[KEYS[e.key]] = true; e.preventDefault(); return; }
    if (e.code === "Space" || e.key === " " || e.key === "ArrowDown" || e.key === "Enter" || e.key === "s" || e.key === "S") { e.preventDefault(); if (!e.repeat) drop(); }
  });
  document.addEventListener("keyup", e => { if (KEYS[e.key]) G.keys[KEYS[e.key]] = false; });
  window.addEventListener("blur", () => { G.keys.l = G.keys.r = false; });
  // 바다를 톡: 배가 그 자리로 가서 낚싯줄을 내려요 (물고기를 누르면 그 물고기 쪽으로)
  $("#field").addEventListener("pointerdown", e => {
    if (!G.active || e.target.closest(".shoot-pad")) return;
    const r = canvas.getBoundingClientRect(), px = (e.clientX - r.left) / G.W;
    // 낚싯대 끝이 배보다 조금 오른쪽이라 그만큼 빼요
    G.target = Math.max(0.06, Math.min(0.94, px - 36 / G.W));
    G.autoDrop = true;
  });
  document.querySelectorAll("#fish-pad .sp").forEach(b => {
    const act = b.dataset.act;
    b.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (act === "drop") { drop(); return; }
      G.target = null; G.autoDrop = false;
      G.keys[act === "left" ? "l" : "r"] = true;
      b.classList.add("on");
      try { b.setPointerCapture(e.pointerId); } catch (err) { /* 이미 끝난 터치 */ }
    });
    const up = () => { if (act !== "drop") { G.keys[act === "left" ? "l" : "r"] = false; b.classList.remove("on"); } };
    b.addEventListener("pointerup", up);
    b.addEventListener("pointercancel", up);
    b.addEventListener("lostpointercapture", up);
  });
})();
