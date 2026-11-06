// 🐧 그림 문 달리기: 위에 나온 영어 단어의 뜻에 맞는 그림 문으로 펭귄이 달려가요.
// 구구단 놀이터의 펭귄 달리기와 같은 길·펭귄 그림을 써요. ← → (스와이프, ◀ ▶)로 칸을 옮겨요.
// 맞히면 효과음과 함께 점점 빨라지고, 틀리면 하트가 하나 줄어요. 15문제를 지나면 이글루 도착!
// 구구단 놀이터에서 열면(?mul=1) '구구단 문 달리기': 위에 나온 답(12)이 되는 식 문(3 × 4)으로 달려요.
(function () {
  "use strict";

  const ML = window.MulLink || { on: false }, MATH = ML.on;

  const $ = s => document.querySelector(s);
  const GRADES = window.SPELL_GRADES;
  const TOTAL = 15;           // 한 판 문제 수
  const LIVES = 5;
  const PROFILES_KEY = "wordrun_profiles", GUIDE_ID = MATH ? "wordrun_mul" : "wordrun", MUSIC_KEY = "wordrun_music";
  const Z_SPAWN = 60;         // 문이 처음 나타나는 거리
  const CAM = 18;             // 원근감 (작을수록 강함)
  const T_START = 4.6, T_MIN = 2.3; // 문이 다가오는 시간(초): 맞힐수록 짧아져요(가속)
  const COLORS = ["#ff7eb6", "#60a5fa", "#34d399", "#ff9f43", "#a78bfa", "#f5b400"];
  const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

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
  const cap = w => w.charAt(0).toUpperCase() + w.slice(1);

  /* ---------- 소리 ---------- */
  let actx = null;
  function tone(freq, dur, type = "sine", when = 0, vol = 0.12) {
    if (MATH && !ML.sound) return;
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
    wrong() { tone(220, 0.22, "square", 0, 0.06); tone(160, 0.3, "sine", 0.1, 0.1); },
    win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", i * 0.1, 0.12)); }
  };
  function speakEn(text) {
    if (!("speechSynthesis" in window) || (MATH && !ML.sound)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = MATH ? "ko-KR" : "en-US"; u.rate = MATH ? 0.95 : 0.8; u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch (e) { /* speech unavailable, ignore */ }
  }
  // 펭귄 달리기 배경 음악을 같이 써요 (음원 끝 약 5초는 무음이라 그 전에 처음으로)
  const BGM_START = 0.23, BGM_END = 175.8;
  const bgm = new Audio("../multiplication/penguin-bgm.mp3");
  bgm.loop = true; bgm.volume = 0.3;
  const loopBgm = () => { if (bgm.currentTime >= BGM_END) bgm.currentTime = BGM_START; };
  bgm.addEventListener("timeupdate", loopBgm);
  let music = (!MATH || ML.sound) && store.get(MUSIC_KEY, true);
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
    const bits = ["🎉", "🎊", "⭐", "🐧", "💖", "🌟", "❄️"];
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
  const PRAISE = ["딩동댕! 🎉", "최고예요! 🌟", "잘했어요! 👏", "멋져요! 💖", "정답! 🐧"];

  /* ---------- 사용자 (이 기기에만 저장, 게스트는 저장 안 함) ---------- */
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
    renderUserList(); $("#user-name-input").value = ""; show("screen-user"); });
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
    if (MATH) return {
      id: GUIDE_ID, title: "구구단 문 달리기",
      pages: [
        { icon: "🐧", title: "펭귄이 달려요", text: "펭귄이 얼음길을 <b>쌩쌩</b> 달려요.<br>위에 <b>답</b>이 되는 숫자가 크게 나와요." },
        { icon: "🚪", title: "식 문으로!", text: "앞에서 <b>구구단 식</b>이 적힌 문이 다가와요.<br>예) 위에 <b>12</b> → <b>3 × 4</b> 문으로 통과!" },
        { icon: "⬅️➡️", title: "옮기는 방법", text: "<b>← →</b> 방향키(또는 A, D)로 움직여요.<br>태블릿은 <b>옆으로 밀거나</b> 아래 <b>◀ ▶</b> 를 눌러요." },
        { icon: "🚀", title: "맞히면 가속!", text: "맞히면 <b>점점 빨라져요</b>. 틀리면 ❤️ 하트가 하나 줄어요.<br>문 <b>" + TOTAL + "개</b>를 지나면 이글루 도착!" }
      ],
      startText: "자, 달려 볼까?", startLabel: "출발! 🐧", onStart
    };
    return {
      id: GUIDE_ID, title: "그림 문 달리기",
      pages: [
        { icon: "🐧", title: "펭귄이 달려요", text: "펭귄이 얼음길을 <b>쌩쌩</b> 달려요.<br>위에 <b>영어 단어</b>가 크게 나와요. 🔊 소리로도 들려줘요!" },
        { icon: "🚪", title: "그림 문으로!", text: "앞에서 <b>그림 문</b>이 다가와요.<br>단어 뜻에 맞는 그림 문으로 가서 <b>통과</b>해요." },
        { icon: "⬅️➡️", title: "옮기는 방법", text: "<b>← →</b> 방향키(또는 A, D)로 움직여요.<br>태블릿은 <b>옆으로 밀거나</b> 아래 <b>◀ ▶</b> 를 눌러요." },
        { icon: "🚀", title: "맞히면 가속!", text: "맞히면 <b>점점 빨라져요</b>. 연속으로 맞히면 점수도 더!<br>틀리면 ❤️ 하트가 하나 줄어요." },
        { icon: "🏠", title: "이글루까지", text: "문 <b>" + TOTAL + "개</b>를 지나면 이글루에 도착!<br>하트를 다 쓰면 끝나요." }
      ],
      startText: "자, 달려 볼까?",
      startLabel: "출발! 🐧",
      onStart
    };
  }
  function choose() {
    if (!GuideBook.isRead(GUIDE_ID)) GuideBook.open(guide(startRun));
    else startRun();
  }
  $("#btn-guide").addEventListener("click", () => GuideBook.open(guide(null)));

  /* ---------- 문제 만들기: 같은 학년 단어 중 다른 그림을 섞어요 ---------- */
  // 구구단: 답(12)을 보여주고, 그 답이 되는 식(3 × 4)과 답이 다른 식 2개를 문에 붙여요
  function mathQuestions() {
    return ML.questions(TOTAL).map(([a, b]) => {
      const c = a * b, key = e => e[0] + "×" + e[1], label = e => e[0] + " × " + e[1];
      const cand = [];
      ML.dans.forEach(x => { for (let y = 1; y <= 9; y++) if (x * y !== c) cand.push([x, y]); });
      [[a, b + 1], [a, b - 1], [a + 1, b], [a - 1, b]].forEach(e => { if (e[0] >= 2 && e[1] >= 1 && e[1] <= 9 && e[0] * e[1] !== c) cand.push(e, e); });
      const others = [];
      shuffle(cand).forEach(e => { if (others.length < 2 && !others.some(o => key(o) === key(e))) others.push(e); });
      const opts = shuffle([[a, b]].concat(others)).map(e => [key(e), label(e)]);
      return { en: key([a, b]), word: String(c), emoji: "", ko: label([a, b]), say: String(c), opts };
    });
  }
  function buildQuestions() {
    if (MATH) return mathQuestions();
    const words = grade.words, n = grade.grade === 1 ? 2 : 3;
    return shuffle(words.slice()).slice(0, TOTAL).map(w => {
      const others = shuffle(words.filter(o => o[1] !== w[1])).slice(0, n - 1);
      return { en: w[0], emoji: w[1], ko: w[2], opts: shuffle([w].concat(others)) };
    });
  }

  /* ---------- 달리기 ---------- */
  const canvas = $("#run-canvas"), ctx = canvas.getContext("2d");
  const run = {
    W: 0, H: 0, raf: 0, last: 0, active: false, tok: 0,
    dist: 0, speed: 10, gateT: T_START, px: 0, lean: 0, target: null, keys: { l: false, r: false },
    gates: [], jumpT: 0, fallT: 0, goal: null, banner: null, boostT: 0,
    qs: [], i: 0, lives: LIVES, score: 0, combo: 0, correct: 0, learned: [], cur: null
  };

  function resize() {
    const r = $("#field").getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    run.W = r.width; run.H = r.height;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", () => { if (run.active) resize(); });

  // 화면 좌표 계산: x(-1~1 길 폭), z(앞쪽 거리), h(높이)
  function geo() {
    const { W, H } = run;
    return { W, H, cx: W / 2, hy: H * 0.24, gy: H * 0.82, R: Math.min(W * 0.4, H * 0.62) };
  }
  function proj(g, x, z, h = 0) {
    const s = CAM / (CAM + z);
    return { x: g.cx + x * s * g.R, y: g.hy + (g.gy - g.hy) * s - h * s * g.R, s };
  }
  const lanesX = () => !MATH && grade.grade === 1 ? [-0.45, 0.45] : [-2 / 3, 0, 2 / 3];
  function laneOf(xs, x) {
    let best = 0;
    xs.forEach((c, i) => { if (Math.abs(c - x) < Math.abs(xs[best] - x)) best = i; });
    return best;
  }

  function startRun() {
    stopRun();
    Object.assign(run, {
      active: true, dist: 0, px: 0, lean: 0, target: null, gates: [], jumpT: 0, fallT: 0, goal: null, banner: null, boostT: 0,
      gateT: T_START, qs: buildQuestions(), i: 0, lives: LIVES, score: 0, combo: 0, correct: 0, learned: [], cur: null
    });
    run.speed = Z_SPAWN / run.gateT;
    run.keys.l = run.keys.r = false;
    run.tok++;
    $("#hud-score").textContent = "0";
    renderHearts();
    renderMusic();
    show("screen-game");
    resize();
    run.banner = { text: "출발! 🐧", t: 1.6 };
    msg(MATH ? "◀ ▶ 로 움직여서 답에 맞는 식 문으로!" : "◀ ▶ 로 움직여서 뜻에 맞는 그림 문으로!");
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

  function nextQuestion() {
    if (run.i >= TOTAL || run.lives <= 0) return finish();
    const q = run.qs[run.i];
    run.cur = q;
    const qw = $("#q-word");
    qw.textContent = MATH ? q.word : cap(q.en); qw.className = "q-word";
    $("#q-sub").textContent = MATH ? "답이 " + q.word + " 인 식 문으로 달려요!" : "뜻에 맞는 그림 문으로 달려요!";
    $("#hud-q").textContent = (run.i + 1) + " / " + TOTAL;
    animate($(".q-card"), "pop");
    speakEn(MATH ? q.say : q.en);
    run.speed = Z_SPAWN / run.gateT;
    run.gates.push({ z: Z_SPAWN, xs: lanesX(), q, done: false, pick: -1, ok: false });
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
    const lane = laneOf(gate.xs, run.px), q = gate.q;
    gate.pick = lane;
    gate.ok = gate.q.opts[lane][0] === q.en;
    const g = geo(), p = proj(g, run.px, 0), r = canvas.getBoundingClientRect();
    const sx = r.left + p.x, sy = r.top + p.y - g.R * 0.3;
    const qw = $("#q-word");
    let delay;
    if (gate.ok) {
      run.correct++; run.combo++;
      const gain = 10 + Math.min(run.combo - 1, 5) * 2;
      sfx.correct();
      floatAt(sx, sy, "+" + gain, "#2563eb");
      addScore(gain);
      run.learned.push(q);
      qw.className = "q-word ok";
      $("#q-sub").textContent = MATH ? q.ko + " = " + q.word : q.emoji + " " + cap(q.en) + " = " + q.ko;
      run.jumpT = 0.55;
      // 맞힐수록 빨라져요
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
      qw.className = "q-word no";
      $("#q-sub").textContent = "정답은 " + (MATH ? "" : q.emoji + " ") + q.ko + " 이에요";
      run.fallT = 0.9;
      run.gateT = Math.min(T_START, run.gateT + 0.25);
      msg(MATH ? "앗! " + q.word + " = " + q.ko + " 이야!" : "앗! " + cap(q.en) + " 은(는) " + q.emoji + " " + q.ko + " 이야!");
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

  /* ---------- 끝의 이글루 ---------- */
  function startGoal() {
    run.goal = { z: Math.max(30, run.speed * 3.2), phase: "approach", t: 0 };
    msg("🏠 저기 이글루가 보여요! 조금만 더!");
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
        msg("🎉 이글루 도착! 다 해냈어요!");
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
    const fast = Z_SPAWN / run.gateT / (Z_SPAWN / T_START);
    run.px = Math.max(-0.82, Math.min(0.82, run.px + dir * (1.9 + (fast - 1) * 1.2) * dt));
    run.lean += (dir * 0.22 - run.lean) * Math.min(1, dt * 10);
    $("#pad-l").classList.toggle("on", dir < -0.1);
    $("#pad-r").classList.toggle("on", dir > 0.1);

    if (run.goal) {
      updateGoal(dt);
      if (!run.active) return;
    } else {
      run.dist += run.speed * dt;
      run.gates.forEach(gt => {
        gt.z -= run.speed * dt;
        if (!gt.done && gt.z <= 0) judgeGate(gt);
      });
    }
    if (run.goal && run.goal.phase === "approach") run.gates.forEach(gt => { gt.z -= run.speed * dt; });
    run.gates = run.gates.filter(gt => gt.z > -CAM * 0.7);
    run.jumpT = Math.max(0, run.jumpT - dt);
    run.fallT = Math.max(0, run.fallT - dt);
    run.boostT = Math.max(0, run.boostT - dt);
    if (run.banner && (run.banner.t -= dt) <= 0) run.banner = null;

    draw(now / 1000);
    loopBgm();
    run.raf = requestAnimationFrame(frame);
  }

  /* ---------- 그리기 (펭귄 달리기와 같은 모양) ---------- */
  const PEAKS = [[0.06, 0.1, 0.16], [0.2, 0.17, 0.2], [0.36, 0.08, 0.14], [0.66, 0.12, 0.18], [0.82, 0.19, 0.22], [0.97, 0.09, 0.14]];
  function draw(t) {
    const g = geo(), { W, H, cx, hy, gy, R } = g;
    ctx.clearRect(0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, "#7cc8ff"); sky.addColorStop(1, "#e3f5ff");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hy + 1);
    PEAKS.forEach(([fx, fh, fw]) => {
      const x = fx * W, top = hy - fh * H, half = fw * W / 2;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.moveTo(x - half, hy); ctx.lineTo(x, top); ctx.lineTo(x + half, hy); ctx.fill();
      ctx.fillStyle = "#cfe8fb";
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + half, hy); ctx.lineTo(x + half * 0.2, hy); ctx.fill();
    });
    ctx.fillStyle = "#f5fbff"; ctx.fillRect(0, hy, W, H - hy);
    const sb = (H - hy) / (gy - hy);
    ctx.fillStyle = "#d6ecff";
    ctx.beginPath(); ctx.moveTo(cx, hy);
    ctx.lineTo(cx + 1.05 * sb * R, H); ctx.lineTo(cx - 1.05 * sb * R, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#9fd0f5"; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, hy); ctx.lineTo(cx + 1.05 * sb * R, H);
    ctx.moveTo(cx, hy); ctx.lineTo(cx - 1.05 * sb * R, H);
    ctx.stroke();

    // 칸 나누는 점선 (달리는 느낌)
    const xs = lanesX(), seps = [];
    for (let k = 0; k < xs.length - 1; k++) seps.push((xs[k] + xs[k + 1]) / 2);
    ctx.strokeStyle = "#b3d9f7"; ctx.lineCap = "round";
    const off = run.dist % 6;
    for (let k = -2; k < 12; k++) {
      const z = k * 6 - off;
      if (z < -CAM * 0.6) continue;
      seps.forEach(x => {
        const p1 = proj(g, x, z), p2 = proj(g, x, z + 2.4);
        ctx.lineWidth = Math.max(1, 6 * p1.s);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      });
    }
    // 빨라지면 옆으로 바람 줄
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
    // 길가 깃발 (먼 것부터)
    const foff = run.dist % 10;
    for (let k = 7; k >= 0; k--) {
      const z = k * 10 - foff;
      if (z < -CAM * 0.5) continue;
      const idx = Math.floor((run.dist + z) / 10);
      [-1.25, 1.25].forEach((x, side) => {
        const b = proj(g, x, z), tp = proj(g, x, z, 0.38);
        ctx.strokeStyle = "#6b5f86"; ctx.lineWidth = Math.max(1, 5 * b.s);
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(tp.x, tp.y); ctx.stroke();
        const fl = proj(g, x + (side ? -0.16 : 0.16), z, 0.3);
        ctx.fillStyle = (idx + side) % 2 ? "#ff5d73" : "#60a5fa";
        ctx.beginPath(); ctx.moveTo(tp.x, tp.y); ctx.lineTo(fl.x, fl.y); ctx.lineTo(tp.x, (tp.y + b.y) / 2 - (b.y - tp.y) * 0.25); ctx.fill();
      });
    }
    run.gates.filter(gt => gt.z >= 0).sort((a, b) => b.z - a.z).forEach(gt => drawGate(g, gt));
    if (run.goal) drawIgloo(g, run.goal.z, t);
    drawPenguin(g, t);
    run.gates.filter(gt => gt.z < 0).forEach(gt => drawGate(g, gt));
    if (run.banner) drawBanner(g, run.banner);
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
    ctx.lineWidth = 4; ctx.strokeStyle = "#ff9f43"; ctx.stroke();
    ctx.fillStyle = "#3b2d5c"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(bn.text, g.cx, y + h / 2 + fs * 0.05);
    ctx.restore();
  }

  // 그림 문: 두 기둥 위에 그림 판, 아래는 지나가는 문 (정답 문은 통과하면 활짝 열려요)
  function drawGate(g, gt) {
    const half = gt.xs.length === 2 ? 0.36 : 0.29;
    ctx.save();
    ctx.globalAlpha = Math.min(1, (Z_SPAWN - gt.z) / 10 + 0.15);
    gt.xs.forEach((c, i) => {
      const passed = gt.done && gt.pick === i;
      const isAns = gt.q.opts[i][0] === gt.q.en;
      // 기둥
      ctx.strokeStyle = "#6b5f86";
      [c - half * 0.85, c + half * 0.85].forEach(x => {
        const b = proj(g, x, gt.z), tp = proj(g, x, gt.z, 0.62);
        ctx.lineWidth = Math.max(1.5, 8 * b.s);
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(tp.x, tp.y); ctx.stroke();
      });
      // 그림 판
      const tl = proj(g, c - half, gt.z, 0.66), br = proj(g, c + half, gt.z, 0.3);
      const w = br.x - tl.x, h = br.y - tl.y;
      roundRect(tl.x, tl.y, w, h, Math.min(w, h) * 0.2);
      ctx.fillStyle = gt.done && !gt.ok && i === gt.pick ? "#d4d0de" : "#ffffff";
      ctx.fill();
      ctx.lineWidth = Math.max(2, (gt.done && isAns ? 16 : 9) * tl.s);
      ctx.strokeStyle = gt.done && isAns ? "#34d399" : COLORS[(i * 2 + 1) % COLORS.length];
      ctx.stroke();
      ctx.font = MATH ? "800 " + Math.max(8, h * 0.42) + "px Nunito, Pretendard, sans-serif" : Math.max(8, h * 0.72) + "px " + EMOJI_FONT;
      if (MATH) ctx.fillStyle = "#1e3a8a";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(gt.q.opts[i][1], tl.x + w / 2, tl.y + h / 2 + h * 0.05);
      // 아래 문 (통과한 정답 문은 양쪽으로 열려요)
      const open = passed && gt.ok ? 1 : 0;
      const dl = proj(g, c - half * 0.8, gt.z, 0.28), dr = proj(g, c + half * 0.8, gt.z, 0);
      const dw = dr.x - dl.x, dh = dr.y - dl.y;
      ctx.fillStyle = COLORS[(i * 2 + 1) % COLORS.length];
      ctx.globalAlpha *= open ? 0.25 : 0.55;
      ctx.fillRect(dl.x, dl.y, dw / 2 - dw * 0.02 - open * dw * 0.4, dh);
      ctx.fillRect(dl.x + dw / 2 + dw * 0.02 + open * dw * 0.4, dl.y, dw / 2 - dw * 0.02 - open * dw * 0.4, dh);
      ctx.globalAlpha = Math.min(1, (Z_SPAWN - gt.z) / 10 + 0.15);
    });
    ctx.restore();
  }

  // 끝의 이글루 (얼음 벽돌 + 입구 + 깃발)
  function drawIgloo(g, z, t) {
    const b = proj(g, 0, z), W = g.R * 1.1 * b.s, H = W * 0.62;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = "rgba(91,127,166,.18)";
    ctx.beginPath(); ctx.ellipse(0, 0, W * 0.62, H * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    const dome = ctx.createLinearGradient(0, -H, 0, 0);
    dome.addColorStop(0, "#ffffff"); dome.addColorStop(1, "#d9eefe");
    ctx.fillStyle = dome;
    ctx.beginPath(); ctx.ellipse(0, 0, W * 0.5, H, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#9fd0f5"; ctx.lineWidth = Math.max(1, W * 0.012);
    ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, 0, W * 0.5, H, 0, Math.PI, 0); ctx.clip();
    for (let r = 1; r <= 3; r++) {
      const y = -H * r / 4;
      ctx.beginPath(); ctx.moveTo(-W, y); ctx.lineTo(W, y); ctx.stroke();
      for (let c = -4; c <= 4; c++) {
        const x = (c + (r % 2) * 0.5) * W * 0.18;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + H / 4); ctx.stroke();
      }
    }
    ctx.restore();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.ellipse(0, 0, W * 0.2, H * 0.5, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#3b4a6b";
    ctx.beginPath(); ctx.ellipse(0, 0, W * 0.13, H * 0.37, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    const fx = W * 0.05, top = -H * 1.45;
    ctx.strokeStyle = "#6b5f86"; ctx.lineWidth = Math.max(1, W * 0.015);
    ctx.beginPath(); ctx.moveTo(fx, -H * 0.98); ctx.lineTo(fx, top); ctx.stroke();
    const wave = Math.sin(t * 6) * W * 0.03;
    ctx.fillStyle = "#ff5d73";
    ctx.beginPath(); ctx.moveTo(fx, top); ctx.lineTo(fx + W * 0.24, top + H * 0.1 + wave); ctx.lineTo(fx, top + H * 0.22); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // 앞에서 본 펭귄: 웃으면서 날개를 흔들어요 (발 밑 가운데가 0,0)
  function drawPenguinFront(s, t) {
    const waveA = -1.9 + Math.sin(t * 9) * 0.45;
    ctx.fillStyle = "#ff9f43";
    [-1, 1].forEach(side => { ctx.beginPath(); ctx.ellipse(side * s * 0.14, -s * 0.03, s * 0.12, s * 0.05, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#1f1b2e";
    [[-1, 0.12], [1, waveA]].forEach(([side, rot]) => {
      ctx.save();
      ctx.translate(side * s * 0.25, -s * 0.58);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.06);
      ctx.quadraticCurveTo(side * s * 0.26, s * 0.02, side * s * 0.34, s * 0.3);
      ctx.quadraticCurveTo(side * s * 0.14, s * 0.18, 0, s * 0.14);
      ctx.closePath(); ctx.fill();
      ctx.restore();
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
  // 뒤에서 본 펭귄 (발 밑 가운데가 0,0)
  function drawPenguinBack(s, t) {
    const step = Math.sin(t * (14 + (run.boostT > 0 ? 6 : 0)));
    const wingRot = side => run.jumpT > 0 ? -side * 0.7 : step * 0.22;
    ctx.fillStyle = "#ff9f43";
    [-1, 1].forEach(side => {
      const lift = Math.max(0, step * side) * s * 0.05;
      ctx.beginPath(); ctx.ellipse(side * s * 0.15, -s * 0.03 - lift, s * 0.11, s * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = "#1f1b2e";
    [-1, 1].forEach(side => {
      ctx.save();
      ctx.translate(side * s * 0.25, -s * 0.58);
      ctx.rotate(wingRot(side));
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.06);
      ctx.quadraticCurveTo(side * s * 0.26, s * 0.02, side * s * 0.34, s * 0.3);
      ctx.quadraticCurveTo(side * s * 0.14, s * 0.18, 0, s * 0.14);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    ctx.beginPath(); ctx.ellipse(0, -s * 0.4, s * 0.31, s * 0.38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -s * 0.74, s * 0.23, 0, Math.PI * 2); ctx.fill();
  }
  function drawPenguin(g, t) {
    const p = proj(g, run.px, 0);
    const size = Math.min(g.R * 0.42, (g.gy - g.hy) * 0.5);
    if (run.goal && run.goal.phase === "wave") {
      const hop = Math.abs(Math.sin(run.goal.t * 5)) * g.R * 0.05;
      ctx.save(); ctx.translate(p.x, p.y - hop); drawPenguinFront(size, t); ctx.restore();
      return;
    }
    let y = p.y, rot = run.lean + Math.sin(t * 14) * 0.09;
    if (run.jumpT > 0) y -= Math.sin(Math.PI * (1 - run.jumpT / 0.55)) * g.R * 0.28;
    if (run.fallT > 0) {
      const k = 1 - run.fallT / 0.9;
      rot = Math.sin(k * Math.PI * 4) * 0.5 * (1 - k);
    }
    ctx.save();
    ctx.translate(p.x, y);
    ctx.rotate(rot * 0.7);
    drawPenguinBack(size, t);
    if (run.fallT > 0) {
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
    if (MATH) isRecord = ML.saveBest("wordrun", run.score).isRecord;
    else {
      const data = userData(); data.best = data.best || {};
      const key = "g" + grade.grade, best = data.best[key] || 0;
      isRecord = run.score > best;
      if (isRecord) data.best[key] = run.score;
      saveUserData(data);
    }
    $("#result-text").innerHTML = "🐧 " + (MATH ? esc(ML.danText()) : grade.grade + "학년") + " · 맞힌 문 <b>" + n + "</b> / " + TOTAL + "<br>" +
      "점수 <b>" + run.score + "</b>점" + (isRecord && run.score > 0 ? '<span class="record">🎊 최고 기록!</span>' : "");
    const wb = $("#result-words"); wb.innerHTML = "";
    run.learned.forEach(w => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "word-chip";
      if (MATH) b.innerHTML = esc(w.ko + " = " + w.word);
      else {
        b.innerHTML = esc(w.emoji + " " + w.en) + "<small>" + esc(w.ko) + "</small>";
        b.title = "눌러서 듣기";
        b.addEventListener("click", () => speakEn(w.en));
      }
      wb.appendChild(b);
    });
    show("screen-result");
  }
  $("#btn-again").addEventListener("click", startRun);
  $("#btn-result-grade").addEventListener("click", () => { if (MATH) { ML.back(); return; } renderGrades(); show("screen-grade"); });
  $("#btn-quit").addEventListener("click", () => { stopRun(); if (MATH) { ML.back(); return; } renderGrades(); show("screen-grade"); });
  $("#btn-say").addEventListener("click", () => { if (run.cur) speakEn(MATH ? run.cur.say : run.cur.en); });

  /* ---------- 구구단 놀이터에서 열었을 때 ---------- */
  if (MATH) {
    document.title = "구구단 문 달리기";
    $(".title-card h1").textContent = "구구단 문 달리기";
    $(".title-card .subtitle").textContent = "답을 보고 맞는 구구단 식 문으로 쌩쌩! (" + ML.danText() + ")";
    const back = $(".title-card .back-link");
    back.textContent = "← 게임 고르기";
    back.addEventListener("click", e => { e.preventDefault(); ML.back(); });
    $("#btn-result-grade").textContent = "게임 고르기";
  }

  /* ---------- 조작 ---------- */
  // 마우스: 누른 곳으로 따라가요 / 터치: 옆으로 밀면 손가락을 따라가고, 휙 밀면 옆 칸으로
  const field = $("#field");
  let swipe = null;
  function aim(e) {
    const g = geo(), r = field.getBoundingClientRect();
    run.target = Math.max(-0.82, Math.min(0.82, (e.clientX - r.left - g.cx) / g.R));
  }
  function nextLane(dir) {
    const xs = lanesX(), from = run.target != null ? run.target : run.px;
    const lanes = dir > 0 ? xs.filter(x => x > from + 0.05) : xs.filter(x => x < from - 0.05).reverse();
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
  // ◀ ▶ 버튼: 톡 누르면 옆 칸으로 한 칸, 꾹 누르고 있으면 계속 그쪽으로
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
