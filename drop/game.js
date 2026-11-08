// 🟥🟦 발판 서바이벌: 넓은 방에 색깔 발판 4개. 문제를 보고 시간 안에 정답 발판으로 뛰어가요.
// 0초가 되면 오답 발판 3개가 쾅! 꺼지고, 그 위에 있던 캐릭터는 아래로 떨어져요 (하트 -1).
// 스테이지가 올라갈수록 고를 시간이 줄어들어요.
// 영어 놀이(?eng=1): 영어 단어 → 한글 뜻 발판 / 구구단 놀이터(?mul=1): 7 × 8 = ? → 숫자 발판
(function () {
  "use strict";

  var ML = window.MulLink || { on: false }, MATH = ML.on;
  var EL = window.EngLink || { on: false }, LINK = !MATH && EL.on;
  var $ = function (s) { return document.querySelector(s); };

  var ROUNDS = 15, PER_STAGE = 3, LIVES = 3;
  // 스테이지(3문제씩)마다 고를 시간(초): 갈수록 줄어들어요
  var TIMES = { easy: [9, 8, 7, 6, 5], normal: [7, 6, 5, 4.5, 4], hard: [5.5, 5, 4.5, 4, 3.5] };
  var DIFF = MATH ? ML.diff : LINK ? EL.diff : "normal";
  var DIFF_NAME = MATH ? ML.diffName : LINK ? EL.diffName : "알맞게";
  var STAGE_TIMES = TIMES[DIFF] || TIMES.normal;
  var TILE_COLORS = [
    { top: "#f87171", side: "#b91c1c", name: "빨강" },
    { top: "#60a5fa", side: "#1d4ed8", name: "파랑" },
    { top: "#facc15", side: "#a16207", name: "노랑" },
    { top: "#4ade80", side: "#15803d", name: "초록" }
  ];
  var LETTERS = ["A", "B", "C", "D"];
  var PRAISE = ["세이프! 🎉", "살았다! 😆", "정답 발판! 👍", "멋져요! 🌟", "완벽해! 💖"];

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable, ignore */ } }
  };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  var rand = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]; }); }
  var cap = function (w) { return w.charAt(0).toUpperCase() + w.slice(1); };
  function show(id) { Array.prototype.forEach.call(document.querySelectorAll(".screen"), function (s) { s.classList.toggle("active", s.id === id); }); }
  function msg(t) { $("#game-msg").textContent = t; }
  function animate(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  /* ---------- 소리 ---------- */
  var actx = null;
  var soundOn = function () { return !MATH || ML.sound; };
  function tone(freq, dur, type, when, vol, slideTo) {
    if (!soundOn()) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime + (when || 0);
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(vol || 0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t); o.stop(t + dur);
    } catch (e) { /* audio unavailable, ignore */ }
  }
  var sfx = {
    tick: function () { tone(1250, 0.05, "square", 0, 0.05); },
    go: function () { tone(880, 0.12, "triangle", 0, 0.12); tone(1320, 0.16, "triangle", 0.1, 0.1); },
    boom: function () { tone(120, 0.45, "sawtooth", 0, 0.16, 40); tone(70, 0.5, "square", 0.03, 0.1, 30); },
    safe: function () { [659, 784, 1047].forEach(function (f, i) { tone(f, 0.16, "triangle", 0.25 + i * 0.08, 0.13); }); },
    fall: function () { tone(700, 0.9, "sine", 0.15, 0.14, 90); },
    stage: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.15, "triangle", i * 0.09, 0.11); }); },
    win: function () { [523, 659, 784, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.2, "triangle", i * 0.12, 0.12); }); }
  };
  function speak(text, lang) {
    if (GuideBook.defer(function () { speak(text, lang); })) return;   // 방법 팝업이 닫히면 읽어줘요
    if (!soundOn() || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang || "en-US"; u.rate = lang === "ko-KR" ? 0.95 : 0.8; u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch (e) { /* speech unavailable, ignore */ }
  }

  /* ---------- 효과 ---------- */
  function floatAt(x, y, text, color) {
    var f = document.createElement("div");
    f.className = "float-text"; f.textContent = text;
    f.style.left = x + "px"; f.style.top = y + "px";
    if (color) f.style.color = color;
    document.body.appendChild(f);
    setTimeout(function () { f.remove(); }, 1000);
  }
  function confetti(n) {
    var bits = ["🎉", "🎊", "⭐", "🪙", "💖", "🌟"];
    for (var k = 0; k < n; k++) {
      var c = document.createElement("div");
      c.className = "confetti"; c.textContent = pick(bits);
      c.style.left = Math.random() * 100 + "vw";
      c.style.animationDuration = rand(22, 40) / 10 + "s";
      c.style.animationDelay = Math.random() * 1 + "s";
      document.body.appendChild(c);
      (function (el) { setTimeout(function () { el.remove(); }, 5500); })(c);
    }
  }

  /* ---------- 문제 ---------- */
  var grade = LINK ? (window.SPELL_GRADES[(EL.grade || 1) - 1] || window.SPELL_GRADES[0]) : null;
  function makeQuestions() {
    var qs = [];
    if (MATH) {
      ML.questions(ROUNDS).forEach(function (ab) {
        var a = ab[0], b = ab[1], c = a * b;
        qs.push({ emoji: "🔢", html: '<span class="en">' + a + " × " + b + "</span> = ?", say: a + " 곱하기 " + b + "는?", lang: "ko-KR",
          answer: String(c), options: shuffle(ML.choices(a, b, 4).map(String)), review: a + " × " + b + " = " + c, reviewSay: a + " 곱하기 " + b + "는 " + c });
      });
    } else {
      var words = grade.words.filter(function (w) { return w[2]; });
      var list = [];
      while (list.length < ROUNDS) list = list.concat(shuffle(words.slice()));
      list.slice(0, ROUNDS).forEach(function (w) {
        var others = [];
        shuffle(words.slice()).forEach(function (o) { if (others.length < 3 && o[2] !== w[2] && others.indexOf(o[2]) < 0) others.push(o[2]); });
        qs.push({ emoji: "🔤", html: '<span class="en">' + esc(cap(w[0])) + "</span> = ?", say: w[0], lang: "en-US",
          answer: w[2], options: shuffle([w[2]].concat(others)), review: cap(w[0]) + "  " + w[2], reviewSay: w[0] });
      });
    }
    return qs;
  }

  /* ---------- 게임 상태 ---------- */
  var canvas = $("#arena-canvas"), ctx = canvas.getContext("2d");
  var G = {
    active: false, raf: 0, last: 0, t: 0, W: 0, H: 0,
    qs: [], i: 0, lives: LIVES, score: 0, combo: 0, safeCount: 0, wrong: [],
    px: 0.5, py: 0.5, face: 1, walkT: 0,
    phase: "ready", phaseT: 0, timeLeft: 0, timeMax: 0, tickSec: 0,
    tiles: [], fallen: false, fallT: 0, shakeT: 0, banner: null, keys: {}, joy: null, stars: []
  };
  for (var s = 0; s < 60; s++) G.stars.push({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.6, ph: Math.random() * 6 });

  function resize() {
    var r = $("#arena").getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    G.W = r.width; G.H = r.height;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", function () { if (G.active) resize(); });

  // 경기장: 가운데 정사각형 (발판 2 × 2)
  function geo() {
    var S = Math.max(160, Math.min(G.W - 24, G.H - 34));
    var ox = (G.W - S) / 2, oy = (G.H - S) / 2 - 6;
    return { S: S, ox: ox, oy: oy, gap: S * 0.035, depth: S * 0.045, pr: S * 0.055 };
  }
  function tileRect(g, k) {
    var half = (g.S - g.gap) / 2;
    return { x: g.ox + (k % 2) * (half + g.gap), y: g.oy + Math.floor(k / 2) * (half + g.gap), w: half, h: half };
  }
  function tileUnder() { return (G.py > 0.5 ? 2 : 0) + (G.px > 0.5 ? 1 : 0); }
  function stageOf(i) { return Math.min(STAGE_TIMES.length - 1, Math.floor(i / PER_STAGE)); }

  function renderHearts(justLost) {
    var h = "";
    for (var k = 0; k < LIVES; k++) h += k < G.lives ? "❤️" : '<span class="' + (justLost && k === G.lives ? "lost" : "") + '" style="opacity:.35">🤍</span>';
    $("#hearts").innerHTML = h;
  }
  function addScore(n) {
    G.score += n;
    $("#hud-score").textContent = G.score;
    animate($("#hud-score-box"), "bump");
  }

  function guide() {
    return {
      id: MATH ? "drop_mul" : "drop", title: MATH ? "구구단 발판 서바이벌" : "발판 서바이벌",
      pages: [
        { icon: "🟥", title: "발판 4개", text: "넓은 방에 <b>색깔 발판 4개</b>가 있어요.<br>발판마다 " + (MATH ? "<b>숫자</b>" : "<b>한글 뜻</b>") + "이 하나씩 적혀 있어요." },
        { icon: "🏃", title: "정답 발판으로 달려요", text: (MATH ? "위에 나온 <b>구구단</b>의 정답" : "위에 나온 <b>영어 단어</b>의 뜻") + "이 적힌 발판으로 뛰어가요.<br><b>← ↑ → ↓</b> 방향키(WASD)나, 화면을 <b>꾹 눌러 끌면</b> 움직여요." },
        { icon: "💥", title: "0초가 되면 쾅!", text: "시간이 다 되면 <b>오답 발판</b>이 쾅! 꺼져요.<br>그 위에 있으면 아래로 떨어지고 ❤️ 하트가 하나 줄어요." },
        { icon: "⏱️", title: "점점 빨라져요", text: "3문제마다 <b>스테이지</b>가 올라가고, 고를 시간이 줄어들어요.<br><b>" + ROUNDS + "문제</b>를 버티면 성공!" }
      ],
      startText: "자, 발판 위에서 살아남아 볼까?", startLabel: "시작! 🏃", onStart: null
    };
  }

  function startGame() {
    Object.assign(G, {
      active: true, qs: makeQuestions(), i: 0, lives: LIVES, score: 0, combo: 0, safeCount: 0, wrong: [],
      px: 0.5, py: 0.5, face: 1, walkT: 0, fallen: false, fallT: 0, shakeT: 0, banner: null, keys: {}, joy: null, t: 0
    });
    $("#hud-score").textContent = "0";
    renderHearts();
    show("screen-game");
    resize();
    setRound(true);
    G.last = performance.now();
    cancelAnimationFrame(G.raf);
    G.raf = requestAnimationFrame(frame);
    GuideBook.intro(guide(), function () { $("#btn-quit").click(); });
  }
  function stopGame() { G.active = false; cancelAnimationFrame(G.raf); }

  // 새 문제: 발판에 보기를 쓰고, 스테이지가 바뀌면 잠깐 알려줘요
  function setRound(first) {
    var q = G.qs[G.i], st = stageOf(G.i);
    G.tiles = q.options.map(function (v) { return { v: v, ok: v === q.answer, drop: 0, rise: 1 }; });
    if (!first) G.tiles.forEach(function (t) { t.rise = 0; });
    $("#q-emoji").textContent = q.emoji;
    $("#q-text").innerHTML = q.html;
    $("#q-sub").textContent = MATH ? "정답 숫자 발판으로 뛰어가요!" : "맞는 뜻 발판으로 뛰어가요!";
    animate($("#q-card"), "pop");
    $("#hud-q").textContent = (G.i + 1) + " / " + ROUNDS;
    $("#hud-stage").textContent = st + 1;
    G.timeMax = STAGE_TIMES[st];
    G.timeLeft = G.timeMax; G.tickSec = 4;
    renderTime();
    var newStage = G.i % PER_STAGE === 0;
    if (newStage) {
      G.banner = { text: "스테이지 " + (st + 1), sub: G.timeMax + "초 안에 골라요!", t: 0 };
      G.phase = "ready"; G.phaseT = 1.5;
      if (!first) sfx.stage();
    } else { G.phase = "ready"; G.phaseT = 0.45; }
    msg(newStage && st > 0 ? "⏱️ 스테이지 " + (st + 1) + "! 이제 " + G.timeMax + "초밖에 없어요" : "정답 발판으로 달려가요! 🏃");
    speak(q.say, q.lang);
  }
  function renderTime() {
    var f = $("#time-fill");
    f.style.width = Math.max(0, G.timeLeft / G.timeMax * 100) + "%";
    f.classList.toggle("hurry", G.timeLeft <= 2.5);
    var sec = $("#time-sec");
    sec.textContent = "⏱️ " + Math.ceil(G.timeLeft) + "초";
    sec.classList.toggle("hurry", G.phase === "count" && G.timeLeft <= 3);
  }

  // 0초! 오답 발판이 꺼져요
  function dropTiles() {
    G.phase = "drop"; G.phaseT = 2.0;
    G.keys = {};
    var k = tileUnder(), tile = G.tiles[k], q = G.qs[G.i];
    G.tiles.forEach(function (t) { if (!t.ok) t.drop = 0.0001; });
    G.shakeT = 0.45;
    sfx.boom();
    var g = geo(), r = canvas.getBoundingClientRect();
    var sx = r.left + g.ox + G.px * g.S, sy = r.top + g.oy + G.py * g.S - g.pr * 2;
    if (tile.ok) {
      G.combo++; G.safeCount++;
      var gain = 10 + Math.min(G.combo - 1, 5) * 2;
      addScore(gain);
      sfx.safe();
      floatAt(sx, sy, "🪙 +" + gain, "#ca8a04");
      msg(pick(PRAISE) + (G.combo >= 2 ? "  🔥 " + G.combo + "연속!" : ""));
    } else {
      G.fallen = true; G.fallT = 0; G.combo = 0;
      G.lives--;
      renderHearts(true);
      sfx.fall();
      G.wrong.push(q);
      floatAt(sx, sy, "으악! ❤️-1", "#ef4444");
      msg("앗! 정답은 " + LETTERS[G.tiles.indexOf(G.tiles.filter(function (t) { return t.ok; })[0])] + " 발판 '" + q.answer + "' 이었어요");
    }
  }
  function nextRound() {
    if (G.lives <= 0) { finish(false); return; }
    G.i++;
    if (G.i >= ROUNDS) { finish(true); return; }
    if (G.fallen) { G.fallen = false; G.px = 0.5; G.py = 0.5; }
    setRound(false);
  }

  /* ---------- 매 프레임 ---------- */
  function frame(now) {
    if (!G.active) return;
    var dt = GuideBook.isOpen() ? 0 : Math.min(0.05, (now - G.last) / 1000);
    G.last = now; G.t += dt;
    if (G.banner) { G.banner.t += dt; if (G.banner.t > 1.6) G.banner = null; }
    G.tiles.forEach(function (t) {
      if (t.rise < 1) t.rise = Math.min(1, t.rise + dt * 2.5);
      if (t.drop > 0) t.drop += dt;
    });
    G.shakeT = Math.max(0, G.shakeT - dt);

    if (G.phase === "ready") {
      move(dt);
      if ((G.phaseT -= dt) <= 0) { G.phase = "count"; sfx.go(); }
    } else if (G.phase === "count") {
      move(dt);
      G.timeLeft -= dt;
      var sec = Math.ceil(G.timeLeft);
      if (G.timeLeft <= 3 && sec < G.tickSec && G.timeLeft > 0) { G.tickSec = sec; sfx.tick(); }
      renderTime();
      if (G.timeLeft <= 0) { G.timeLeft = 0; renderTime(); dropTiles(); }
    } else if (G.phase === "drop") {
      if (G.fallen) G.fallT += dt;
      if ((G.phaseT -= dt) <= 0) nextRound();
      if (!G.active) return;
    }
    draw();
    G.raf = requestAnimationFrame(frame);
  }

  // 방향키 · 조이스틱으로 걸어요 (발판 밖으로는 못 나가요)
  function move(dt) {
    var dx = (G.keys.r ? 1 : 0) - (G.keys.l ? 1 : 0), dy = (G.keys.d ? 1 : 0) - (G.keys.u ? 1 : 0);
    if (G.joy && G.joy.mag > 0) { dx = G.joy.dx; dy = G.joy.dy; }
    var len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; len = 1; }
    var sp = 0.62;   // 1초에 경기장 폭의 62%
    G.px = Math.max(0.04, Math.min(0.96, G.px + dx * sp * dt));
    G.py = Math.max(0.04, Math.min(0.96, G.py + dy * sp * dt));
    if (dx) G.face = dx > 0 ? 1 : -1;
    G.walkT = len > 0.1 ? G.walkT + dt * 10 : 0;
  }

  /* ---------- 그리기 ---------- */
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function draw() {
    var W = G.W, H = G.H, g = geo();
    ctx.save();
    // 아래는 깊은 낭떠러지
    var bg = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * 0.75);
    bg.addColorStop(0, "#312e81"); bg.addColorStop(1, "#0f0a2e");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    G.stars.forEach(function (st) {
      ctx.globalAlpha = 0.35 + 0.35 * Math.sin(G.t * 2 + st.ph);
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(st.x * W, st.y * H, st.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (G.shakeT > 0) ctx.translate((Math.random() - 0.5) * 12 * G.shakeT / 0.45, (Math.random() - 0.5) * 12 * G.shakeT / 0.45);

    var playerTile = tileUnder();
    var fallingOn = G.fallen ? playerTile : -1;
    // 떨어지는 발판(캐릭터가 같이 떨어지면 캐릭터를 그 사이에)
    G.tiles.forEach(function (t, k) { if (t.drop > 0) drawTile(g, t, k); });
    if (G.fallen) drawPlayer(g);
    G.tiles.forEach(function (t, k) { if (!(t.drop > 0)) drawTile(g, t, k); });
    if (!G.fallen) drawPlayer(g);
    void fallingOn;

    // 큰 숫자 카운트다운
    // 마지막 3초는 가운데에 큰 숫자 (3, 2, 1)
    if (G.phase === "count" && G.timeLeft <= 3) {
      var n = Math.ceil(G.timeLeft), hurry = true;
      ctx.globalAlpha = 0.9;
      var fs = Math.min(110, g.S * 0.28) * (1 + 0.15 * (1 - (G.timeLeft % 1)));
      ctx.font = "900 " + fs + "px CookieRun, Jua, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = 6; ctx.strokeStyle = "rgba(15,10,46,.85)";
      var cy = g.oy + g.S / 2;
      ctx.strokeText(n, W / 2, cy);
      ctx.fillStyle = hurry ? "#f87171" : "#fff";
      ctx.fillText(n, W / 2, cy);
      ctx.globalAlpha = 1;
    }
    // 스테이지 알림
    if (G.banner) {
      var a = Math.min(1, G.banner.t * 4, (1.6 - G.banner.t) * 4);
      ctx.globalAlpha = Math.max(0, a);
      var bw = Math.min(W - 30, 340), bh = 92, bx = (W - bw) / 2, by = g.oy + g.S * 0.18;
      ctx.fillStyle = "rgba(255,255,255,.95)"; rr(bx, by, bw, bh, 22); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = "#6366f1"; ctx.stroke();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#4f46e5"; ctx.font = "34px CookieRun, Jua, sans-serif";
      ctx.fillText(G.banner.text, W / 2, by + 34);
      ctx.fillStyle = "#db2777"; ctx.font = "800 18px Pretendard, sans-serif";
      ctx.fillText("⏱️ " + G.banner.sub, W / 2, by + 68);
      ctx.globalAlpha = 1;
    }
    // 조이스틱
    if (G.joy) {
      var r = canvas.getBoundingClientRect(), jx = G.joy.x0 - r.left, jy = G.joy.y0 - r.top;
      ctx.globalAlpha = 0.35; ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(jx, jy, 46, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.75;
      ctx.beginPath(); ctx.arc(jx + G.joy.dx * 46 * Math.min(1, G.joy.mag), jy + G.joy.dy * 46 * Math.min(1, G.joy.mag), 22, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawTile(g, t, k) {
    var rc = tileRect(g, k), col = TILE_COLORS[k];
    var e = t.rise < 1 ? 1 - Math.pow(1 - t.rise, 3) : 1;   // 아래에서 쑥 올라와요
    var dropK = t.drop > 0 ? Math.min(1, t.drop / 1.1) : 0;
    var sc = (0.6 + 0.4 * e) * (1 - dropK * 0.55);
    var off = (1 - e) * g.S * 0.25 + dropK * dropK * g.S * 0.5;
    var alpha = e * (1 - dropK);
    if (alpha <= 0.01) return;
    var cx = rc.x + rc.w / 2, cy = rc.y + rc.h / 2 + off;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy); ctx.scale(sc, sc);
    if (t.drop > 0) ctx.rotate((k % 2 ? 1 : -1) * dropK * 0.35);
    var w = rc.w, h = rc.h, rad = Math.min(w, h) * 0.08;
    // 옆면 (두께)
    ctx.fillStyle = col.side; rr(-w / 2, -h / 2 + g.depth, w, h, rad); ctx.fill();
    // 윗면
    ctx.fillStyle = col.top; rr(-w / 2, -h / 2, w, h, rad); ctx.fill();
    // 바둑판 무늬
    ctx.globalAlpha = alpha * 0.18; ctx.fillStyle = "#fff";
    var n = 4, cs = w / n;
    for (var yy = 0; yy < n; yy++) for (var xx = 0; xx < n; xx++) if ((xx + yy) % 2 === 0) ctx.fillRect(-w / 2 + xx * cs, -h / 2 + yy * cs, cs, cs);
    ctx.globalAlpha = alpha;
    // 정답 발판은 쾅! 뒤에 반짝
    if (G.phase === "drop" && t.ok) {
      ctx.lineWidth = 6; ctx.strokeStyle = "rgba(255,255,255," + (0.6 + 0.4 * Math.sin(G.t * 12)) + ")";
      rr(-w / 2, -h / 2, w, h, rad); ctx.stroke();
    }
    // 글자 칸
    var showLabel = G.phase !== "ready" || !G.banner;
    ctx.fillStyle = "rgba(255,255,255,.92)";
    var lw = w * 0.82, lh = h * 0.36;
    rr(-lw / 2, -lh / 2, lw, lh, lh * 0.3); ctx.fill();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    var txt = showLabel ? t.v : "?";
    var fs = Math.min(lh * 0.62, MATH ? 48 : 34);
    ctx.font = "800 " + fs + "px Pretendard, Jua, sans-serif";
    while (fs > 10 && ctx.measureText(txt).width > lw * 0.9) { fs -= 1; ctx.font = "800 " + fs + "px Pretendard, Jua, sans-serif"; }
    ctx.fillStyle = "#1f2937"; ctx.fillText(txt, 0, 2);
    // 발판 글자 A B C D
    ctx.font = "800 " + Math.max(12, w * 0.1) + "px Nunito, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText(LETTERS[k], -w / 2 + w * 0.06, -h / 2 + h * 0.05);
    ctx.restore();
  }

  // 캐릭터: 동글동글 아이 (떨어지면 빙글빙글 작아져요)
  function drawPlayer(g) {
    var x = g.ox + G.px * g.S, y = g.oy + G.py * g.S, r = g.pr;
    var sc = 1, rot = 0, alpha = 1, dy = 0;
    if (G.fallen) {
      var k = Math.min(1, G.fallT / 1.1);
      sc = 1 - k * 0.8; rot = k * 6; alpha = 1 - k; dy = k * k * g.S * 0.45;
      if (alpha <= 0.02) return;
    }
    var bob = G.walkT ? Math.abs(Math.sin(G.walkT)) * r * 0.25 : 0;
    var happy = G.phase === "drop" && !G.fallen;
    if (happy) bob = Math.abs(Math.sin(G.t * 9)) * r * 0.45;
    ctx.save();
    ctx.globalAlpha = alpha;
    // 그림자
    if (!G.fallen) { ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(x, y + r * 0.85, r * 0.85, r * 0.3, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.translate(x, y - bob + dy); ctx.rotate(rot); ctx.scale(sc, sc);
    // 다리
    var step = Math.sin(G.walkT) * r * 0.25;
    ctx.fillStyle = "#1e3a8a";
    ctx.beginPath(); ctx.ellipse(-r * 0.35, r * 0.75 + (G.walkT ? step : 0), r * 0.22, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(r * 0.35, r * 0.75 - (G.walkT ? step : 0), r * 0.22, r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    // 몸
    ctx.fillStyle = "#fb923c"; ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(2, r * 0.1);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // 얼굴
    var lx = G.face * r * 0.12;
    ctx.fillStyle = "#1f2937";
    if (happy) {
      ctx.lineWidth = Math.max(2, r * 0.1); ctx.strokeStyle = "#1f2937";
      [-1, 1].forEach(function (s2) { ctx.beginPath(); ctx.arc(lx + s2 * r * 0.32, -r * 0.12, r * 0.13, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); });
    } else if (G.fallen) {
      ctx.font = "800 " + r * 0.5 + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("× ×", lx, -r * 0.12);
    } else {
      [-1, 1].forEach(function (s2) { ctx.beginPath(); ctx.arc(lx + s2 * r * 0.32, -r * 0.15, r * 0.12, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = "#fff";
      [-1, 1].forEach(function (s2) { ctx.beginPath(); ctx.arc(lx + s2 * r * 0.32 + r * 0.04, -r * 0.2, r * 0.045, 0, Math.PI * 2); ctx.fill(); });
    }
    ctx.fillStyle = "rgba(255,90,120,.5)";
    [-1, 1].forEach(function (s2) { ctx.beginPath(); ctx.ellipse(lx + s2 * r * 0.55, r * 0.15, r * 0.14, r * 0.09, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.strokeStyle = "#7c2d12"; ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.beginPath();
    if (G.fallen) ctx.arc(lx, r * 0.42, r * 0.15, Math.PI * 1.15, Math.PI * 1.85);
    else ctx.arc(lx, r * 0.18, r * 0.2, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    // 모자 꼭지
    ctx.fillStyle = "#6366f1";
    ctx.beginPath(); ctx.arc(0, -r * 0.95, r * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* ---------- 결과 ---------- */
  function finish(survived) {
    stopGame();
    var n = G.safeCount, stars = survived ? (n >= ROUNDS - 1 ? 3 : n >= ROUNDS - 4 ? 2 : 1) : (n >= 8 ? 1 : 0);
    $("#result-title").textContent = !survived ? "하트를 다 썼어요! 다시 도전! 💪" : stars === 3 ? "끝까지 살아남았어요! 🏆" : stars === 2 ? "아주 잘했어요! 🎉" : "잘했어요! 💪";
    $("#result-stars").innerHTML = [1, 2, 3].map(function (k) { return '<span class="' + (k <= stars ? "" : "dim") + '">⭐</span>'; }).join("");
    var isRecord;
    if (MATH) isRecord = ML.saveBest("drop", G.score).isRecord;
    else if (EL.user) {
      var p = store.get("drop_profiles", {}), d = p[EL.user] || { best: {} }, key = "g" + grade.grade;
      d.best = d.best || {};
      isRecord = G.score > (d.best[key] || 0);
      if (isRecord) d.best[key] = G.score;
      p[EL.user] = d; store.set("drop_profiles", p);
    } else isRecord = false;
    var label = MATH ? "🔢 " + esc(ML.danText()) + " · " + DIFF_NAME : grade.grade + "학년 · " + DIFF_NAME;
    $("#result-text").innerHTML = label + " · 살아남은 문제 <b>" + n + "</b> / " + ROUNDS + "<br>" +
      "코인 <b>" + G.score + "</b>개" + (isRecord && G.score > 0 ? '<span class="record">🎊 최고 기록!</span>' : "");
    var wb = $("#result-words"); wb.innerHTML = "";
    if (G.wrong.length) {
      G.wrong.forEach(function (q) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "word-chip"; b.textContent = q.review; b.title = "눌러서 듣기";
        b.addEventListener("click", function () { speak(q.reviewSay, q.lang); });
        wb.appendChild(b);
      });
    } else wb.innerHTML = '<div class="label">💯 한 번도 안 떨어졌어요!</div>';
    show("screen-result");
    sfx.win();
    confetti(Math.max(1, stars) * 15);
  }

  function back() { stopGame(); if ("speechSynthesis" in window) speechSynthesis.cancel(); if (MATH) ML.back(); else EL.back(); }
  $("#btn-again").addEventListener("click", startGame);
  $("#btn-result-back").addEventListener("click", back);
  $("#btn-quit").addEventListener("click", back);
  $("#q-say").addEventListener("click", function () { var q = G.qs[G.i]; if (q) speak(q.say, q.lang); });

  /* ---------- 조작: 방향키 · WASD · 화면 끌기(조이스틱) ---------- */
  var KEYS = { ArrowLeft: "l", a: "l", A: "l", ArrowRight: "r", d: "r", D: "r", ArrowUp: "u", w: "u", W: "u", ArrowDown: "d", s: "d", S: "d" };
  document.addEventListener("keydown", function (e) {
    if (!G.active || document.querySelector(".gb-overlay.show")) return;
    if (KEYS[e.key]) { G.keys[KEYS[e.key]] = true; e.preventDefault(); }
  });
  document.addEventListener("keyup", function (e) { if (KEYS[e.key]) G.keys[KEYS[e.key]] = false; });
  window.addEventListener("blur", function () { G.keys = {}; G.joy = null; });
  var arena = $("#arena");
  arena.addEventListener("pointerdown", function (e) {
    if (!G.active) return;
    e.preventDefault();
    G.joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, mag: 0 };
    try { arena.setPointerCapture(e.pointerId); } catch (err) { /* 이미 끝난 터치 */ }
  });
  arena.addEventListener("pointermove", function (e) {
    if (!G.joy || e.pointerId !== G.joy.id) return;
    var dx = e.clientX - G.joy.x0, dy = e.clientY - G.joy.y0, d = Math.hypot(dx, dy);
    // 너무 멀리 끌면 조이스틱 가운데가 따라와요
    if (d > 70) { G.joy.x0 = e.clientX - dx / d * 70; G.joy.y0 = e.clientY - dy / d * 70; dx = e.clientX - G.joy.x0; dy = e.clientY - G.joy.y0; d = 70; }
    if (d < 8) { G.joy.dx = G.joy.dy = G.joy.mag = 0; return; }
    G.joy.dx = dx / d; G.joy.dy = dy / d; G.joy.mag = Math.min(1, d / 46);
    G.joy.dx *= Math.max(0.5, G.joy.mag); G.joy.dy *= Math.max(0.5, G.joy.mag);
  });
  var endJoy = function (e) { if (G.joy && e.pointerId === G.joy.id) G.joy = null; };
  arena.addEventListener("pointerup", endJoy);
  arena.addEventListener("pointercancel", endJoy);
  arena.addEventListener("lostpointercapture", endJoy);

  /* ---------- 시작 ---------- */
  if (MATH) {
    document.title = "구구단 발판 서바이벌";
  }
  if (MATH || LINK) startGame();
  else show("screen-intro");
})();
