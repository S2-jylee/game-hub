// 🐸 단어 징검다리: 위에 나온 문제에 맞는 영어 단어 연잎으로 점프해서 강을 건너요.
// ← → 로 연잎을 고르고 스페이스(위로 밀기, 연잎 톡)로 점프. 틀린 연잎은 가라앉아 풍덩!
// 구구단 놀이터에서 열면(?mul=1) '구구단 징검다리': 6 × 7 = ? 의 정답 숫자 연잎으로 점프해요.
(function () {
  "use strict";

  var ML = window.MulLink || { on: false }, MATH = ML.on;

  var $ = function (s) { return document.querySelector(s); };
  var GRADES = window.SPELL_GRADES, OPPOSITES = window.FROG_OPPOSITES, SYNONYMS = window.FROG_SYNONYMS;
  var PER_ROUND = 10;         // 한 판 문제 수 (연잎 줄 수)
  var LIVES = 5;              // 하트 수
  var PROFILES_KEY = "frog_profiles", GUIDE_ID = MATH ? "frog_mul" : "frog";
  var JUMP_T = 0.5, SINK_T = 0.9, CAM_T = 0.45;

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable, ignore */ } }
  };
  var rand = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]; });
  }
  function show(id) {
    Array.prototype.forEach.call(document.querySelectorAll(".screen"), function (s) { s.classList.toggle("active", s.id === id); });
  }

  /* ---------- 소리 (결과를 알려주는 소리만) ---------- */
  var actx = null;
  function tone(freq, dur, type, when, vol) {
    if (MATH && !ML.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime + (when || 0);
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol || 0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t); o.stop(t + dur);
    } catch (e) { /* audio unavailable, ignore */ }
  }
  var sfx = {
    right: function () { tone(660, 0.12, "triangle", 0, 0.14); tone(990, 0.16, "triangle", 0.08, 0.12); },
    splash: function () { tone(220, 0.3, "sine", 0, 0.14); tone(140, 0.4, "triangle", 0.08, 0.1); },
    win: function () { [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) { tone(f, 0.18, "triangle", i * 0.1, 0.12); }); }
  };
  function speakEn(text) {
    if (GuideBook.defer(function () { speakEn(text); })) return;   // 방법 팝업이 닫히면 읽어줘요
    if (!("speechSynthesis" in window) || (MATH && !ML.sound)) return;
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = MATH ? "ko-KR" : "en-US"; u.rate = MATH ? 0.95 : 0.8; u.pitch = 1.1;
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
    var bits = ["🎉", "🎊", "⭐", "🐸", "💖", "🌟", "🪷"];
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
  function animate(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function msg(t) { $("#game-msg").textContent = t; }

  /* ---------- 사용자 (이 기기에만 저장, 게스트는 저장 안 함) ---------- */
  var user = null, guest = false, guestData = null;
  function loadProfiles() { return store.get(PROFILES_KEY, {}); }
  function userData() { return guest ? guestData : (loadProfiles()[user] || { best: {} }); }
  function saveUserData(d) {
    if (guest) { guestData = d; return; }
    var p = loadProfiles(); p[user] = d; store.set(PROFILES_KEY, p);
  }
  function enterAs(name) {
    guest = !name; user = name;
    if (guest) guestData = { best: {} };
    else if (!loadProfiles()[name]) saveUserData({ best: {} });
    Array.prototype.forEach.call(document.querySelectorAll(".user-badge"), function (el) { el.textContent = "👤 " + (name || "게스트"); });
    renderModes(); show("screen-mode");
  }
  function renderUserList() {
    var l = $("#user-list"); l.innerHTML = "";
    var names = Object.keys(loadProfiles());
    if (!names.length) { l.innerHTML = '<div class="user-empty-hint">저장된 사용자가 없어요. 새 이름으로 시작해보세요!</div>'; return; }
    names.forEach(function (name) {
      var b = document.createElement("button");
      b.className = "user-item-btn"; b.textContent = "👤 " + name;
      b.addEventListener("click", function () { enterAs(name); });
      l.appendChild(b);
    });
  }
  function submitNewUser() {
    var name = $("#user-name-input").value.trim();
    if (!name) { $("#user-name-input").focus(); return; }
    enterAs(name);
  }
  $("#btn-start").addEventListener("click", function () {
    if (MATH) { choose(); return; }
    renderUserList(); $("#user-name-input").value = ""; show("screen-user"); });
  $("#btn-user-new").addEventListener("click", submitNewUser);
  $("#user-name-input").addEventListener("keydown", function (e) { if (e.key === "Enter") submitNewUser(); });
  $("#btn-user-guest").addEventListener("click", function () { enterAs(null); });
  $("#btn-user-back").addEventListener("click", function () { show("screen-title"); });
  $("#btn-mode-back").addEventListener("click", function () { show("screen-title"); });
  $("#btn-grade-back").addEventListener("click", function () { renderModes(); show("screen-mode"); });

  /* ---------- 놀이 고르기 ---------- */
  var MODES = [
    { id: "meaning", name: "뜻 찾기", emoji: "🍎", desc: "한글 뜻에 맞는 영어 단어를 찾아요 (학년별)", bg: "#ecfccb", c: "#65a30d" },
    { id: "opposite", name: "반대말", emoji: "↔️", desc: "happy ↔ sad 처럼 반대 뜻 단어를 찾아요", bg: "#ffe4e6", c: "#be123c" },
    { id: "synonym", name: "비슷한 말", emoji: "🤝", desc: "big ≈ large 처럼 뜻이 비슷한 단어를 찾아요", bg: "#e1efff", c: "#1d4ed8" }
  ];
  var mode = MODES[0], grade = null;
  function modeKey() { return mode.id === "meaning" ? "meaning_g" + grade.grade : mode.id; }
  function renderModes() {
    var g = $("#mode-grid"); g.innerHTML = "";
    var best = userData().best || {};
    MODES.forEach(function (m) {
      var b = document.createElement("button");
      b.className = "level-btn"; b.type = "button";
      b.style.setProperty("--bg", m.bg); b.style.setProperty("--c", m.c);
      var bestTxt = m.id === "meaning" ? "학년을 골라요" : (best[m.id] ? "⭐ 내 최고 " + best[m.id] + "점" : "아직 기록이 없어요");
      b.innerHTML = '<span class="lv-emoji">' + m.emoji + '</span><span class="lv-name">' + m.name + "</span>" +
        '<span class="lv-desc">' + m.desc + '</span><span class="lv-best">' + bestTxt + '</span><span class="lv-go">' + (m.id === "meaning" ? "학년 고르기 ▶" : "출발 ▶") + "</span>";
      b.addEventListener("click", function () {
        mode = m;
        if (m.id === "meaning") { renderGrades(); show("screen-grade"); }
        else choose();
      });
      g.appendChild(b);
    });
  }
  var GR_BG = [["#ecfccb", "#4d7c0f"], ["#fef9c3", "#a16207"], ["#ffedd5", "#c2410c"], ["#e1efff", "#1d4ed8"], ["#f3e8ff", "#7e22ce"], ["#ffe4e6", "#be123c"]];
  function renderGrades() {
    var g = $("#grade-grid"); g.innerHTML = "";
    var best = userData().best || {};
    GRADES.forEach(function (gr, i) {
      var b = document.createElement("button");
      b.className = "grade-btn"; b.type = "button";
      b.style.setProperty("--bg", GR_BG[i][0]); b.style.setProperty("--c", GR_BG[i][1]);
      var bs = best["meaning_g" + gr.grade];
      b.innerHTML = '<span class="gr-emoji">' + gr.emoji + '</span><span class="gr-name">' + gr.grade + "학년</span>" +
        '<span class="gr-desc">' + (bs ? "⭐ 내 최고 " + bs + "점" : gr.desc) + "</span>";
      b.addEventListener("click", function () { grade = gr; choose(); });
      g.appendChild(b);
    });
  }

  function guide(onStart) {
    if (MATH) return {
      id: GUIDE_ID, title: "구구단 징검다리",
      pages: [
        { icon: "🐸", title: "강을 건너요", text: "개구리가 <b>연잎</b>을 밟고 강을 건너야 해요.<br>위에 나온 <b>구구단</b>을 잘 봐요!" },
        { icon: "🪷", title: "정답 연잎을 골라요", text: "연잎 3개에 숫자가 하나씩 적혀 있어요.<br><b>← →</b> 방향키로 <b>정답</b> 연잎을 골라요." },
        { icon: "⤴️", title: "폴짝 점프!", text: "<b>스페이스바</b>(또는 ↑)를 누르면 점프해요.<br>태블릿은 연잎을 <b>톡</b> 누르거나 <b>위로 밀어도</b> 돼요." },
        { icon: "💦", title: "틀리면 풍덩!", text: "틀린 연잎은 <b>가라앉아서</b> 물에 빠져요. ❤️ 하트가 하나 줄어요.<br>연잎 <b>10줄</b>을 건너면 도착!" }
      ],
      startText: "자, 강을 건너 볼까?", startLabel: "출발! 🐸", onStart: onStart
    };
    return {
      id: GUIDE_ID, title: "단어 징검다리",
      pages: [
        { icon: "🐸", title: "강을 건너요", text: "개구리가 <b>연잎</b>을 밟고 강을 건너야 해요.<br>위에 나온 <b>문제</b>를 잘 봐요!" },
        { icon: "🪷", title: "맞는 연잎을 골라요", text: "연잎 3개에 영어 단어가 하나씩 적혀 있어요.<br><b>← →</b> 방향키로 맞는 연잎을 골라요." },
        { icon: "⤴️", title: "폴짝 점프!", text: "<b>스페이스바</b>(또는 ↑)를 누르면 점프해요.<br>태블릿은 연잎을 <b>톡</b> 누르거나 <b>위로 밀어도</b> 돼요." },
        { icon: "💦", title: "틀리면 풍덩!", text: "틀린 연잎은 <b>가라앉아서</b> 물에 빠져요. ❤️ 하트가 하나 줄어요.<br>다시 남은 연잎 중에서 골라요." },
        { icon: "🏝️", title: "건너편까지!", text: "연잎 <b>10줄</b>을 건너면 도착이에요.<br>한 번에 맞히면 <b>+10점</b>, 다시 맞히면 <b>+5점</b>!" }
      ],
      startText: "자, 강을 건너 볼까?",
      startLabel: "출발! 🐸",
      onStart: onStart
    };
  }
  // 게임 화면을 먼저 열고, 그 위에 방법 팝업을 띄워요. '확인'을 누르면 출발 (팝업이 떠 있는 동안은 멈춰 있어요)
  function choose() {
    startRound();
    GuideBook.intro(guide(null), function () { $("#btn-quit").click(); });
  }
  $("#btn-guide").addEventListener("click", function () { GuideBook.open(guide(null)); });

  /* ---------- 문제 만들기 ---------- */
  function pickOthers(pool, avoid, n) {
    var out = [];
    shuffle(pool.slice()).forEach(function (w) { if (out.length < n && avoid.indexOf(w) < 0 && out.indexOf(w) < 0) out.push(w); });
    return out;
  }
  function makeQuestions() {
    var qs = [];
    if (MATH) {
      ML.questions(PER_ROUND).forEach(function (ab) {
        var a = ab[0], b = ab[1], c = a * b;
        qs.push({ emoji: "🔢", html: '<span class="en">' + a + " × " + b + "</span> = ?", sub: "정답 숫자 연잎으로 점프!", answer: String(c),
          options: shuffle(ML.choices(a, b, 3).map(String)), learn: { en: a + " × " + b + " = " + c, ko: "", emoji: "", say: a + " 곱하기 " + b + "는 " + c } });
      });
    } else if (mode.id === "meaning") {
      var words = grade.words, all = words.map(function (w) { return w[0]; });
      shuffle(words.slice()).slice(0, PER_ROUND).forEach(function (w) {
        // 길이가 비슷한 단어를 섞어서 헷갈리게
        var near = all.filter(function (x) { return x !== w[0] && Math.abs(x.length - w[0].length) <= 1; });
        var others = pickOthers(near.length >= 2 ? near : all, [w[0]], 2);
        qs.push({ emoji: w[1], html: esc(w[2]), sub: "알맞은 영어 단어 연잎으로 점프!", answer: w[0], options: shuffle([w[0]].concat(others)),
          learn: { en: w[0], ko: w[2], emoji: w[1] } });
      });
    } else {
      var pairs = mode.id === "opposite" ? OPPOSITES : SYNONYMS;
      var allW = []; pairs.forEach(function (p) { allW.push(p[0], p[2]); });
      shuffle(pairs.slice()).slice(0, PER_ROUND).forEach(function (p) {
        var flip = Math.random() < 0.5;
        var a = flip ? [p[2], p[3]] : [p[0], p[1]], b = flip ? [p[0], p[1]] : [p[2], p[3]];
        var others = pickOthers(allW, [a[0], b[0]], 2);
        var word = mode.id === "opposite" ? "의 반대말은?" : "와 비슷한 말은?";
        qs.push({ emoji: mode.id === "opposite" ? "↔️" : "🤝",
          html: '<span class="en">' + esc(a[0]) + "</span> (" + esc(a[1]) + ")" + word,
          sub: mode.id === "opposite" ? "반대 뜻의 영어 단어 연잎으로 점프!" : "뜻이 비슷한 영어 단어 연잎으로 점프!",
          answer: b[0], options: shuffle([b[0]].concat(others)),
          learn: { en: a[0] + (mode.id === "opposite" ? " ↔ " : " ≈ ") + b[0], ko: b[1], say: b[0], emoji: mode.id === "opposite" ? "↔️" : "🤝" } });
      });
    }
    return qs;
  }

  /* ---------- 게임 상태 ---------- */
  var canvas = $("#river-canvas"), ctx = canvas.getContext("2d");
  var G = {
    W: 0, H: 0, raf: 0, last: 0, t: 0, active: false,
    rows: [], row: 0, x: 0.5, aim: 1, cam: 0, camFrom: 0, camT: 0,
    jump: null, sink: null, lock: false, after: null,
    lives: LIVES, score: 0, firstTry: 0, missed: false, learned: [], ripples: [], winT: 0
  };
  var PAD_X = [0.2, 0.5, 0.8];

  function resize() {
    var r = $("#river").getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    G.W = r.width; G.H = r.height;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", function () { if (G.active) resize(); });

  function geo() {
    var W = G.W, H = G.H;
    var gap = H * 0.42, frogY = H * 0.8;
    var r = Math.max(30, Math.min(W * 0.12, H * 0.14, 78));
    return { W: W, H: H, gap: gap, frogY: frogY, r: r };
  }
  function rowY(g, row) { return g.frogY - (row - G.cam) * g.gap; }

  function startRound() {
    var qs = makeQuestions();
    G.rows = [{ bank: true }];
    qs.forEach(function (q) {
      G.rows.push({ q: q, pads: q.options.map(function (w, i) { return { x: PAD_X[i], word: w, ok: w === q.answer, gone: false, sink: 0, fade: 0 }; }) });
    });
    G.rows.push({ bank: true, far: true });
    Object.assign(G, { active: true, row: 0, x: 0.5, aim: 1, cam: 0, camT: 0, jump: null, sink: null, lock: false, after: null,
      lives: LIVES, score: 0, firstTry: 0, missed: false, learned: [], ripples: [], winT: 0, t: 0 });
    $("#hud-score").textContent = "0";
    renderHearts();
    show("screen-game");
    resize();
    showQuestion();
    msg("← → 로 연잎을 고르고 스페이스바로 폴짝! 🐸");
    G.last = performance.now();
    cancelAnimationFrame(G.raf);
    G.raf = requestAnimationFrame(frame);
  }
  function stopRound() { G.active = false; cancelAnimationFrame(G.raf); }

  function showQuestion() {
    var row = G.rows[G.row + 1];
    if (!row || !row.q) return;
    $("#q-emoji").textContent = row.q.emoji;
    $("#q-text").innerHTML = row.q.html;
    $("#q-sub").textContent = row.q.sub;
    $("#hud-q").textContent = G.row + 1 + " / " + PER_ROUND;
    animate($(".q-card"), "pop");
    G.missed = false;
    G.aim = 1;
  }
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

  /* ---------- 조작 ---------- */
  function nextPads() { var r = G.rows[G.row + 1]; return r && r.pads ? r.pads : null; }
  function moveAim(d) {
    if (!G.active || G.lock) return;
    var pads = nextPads(); if (!pads) return;
    var i = G.aim;
    for (var k = 0; k < 3; k++) { i += d; if (i < 0 || i > 2) return; if (!pads[i].gone) { G.aim = i; return; } }
  }
  function jump(i) {
    if (!G.active || G.lock) return;
    var pads = nextPads(); if (!pads) return;
    if (i == null) i = G.aim;
    if (pads[i].gone) { moveAim(1); return; }
    G.aim = i;
    G.lock = true;
    G.jump = { fx: G.x, fr: G.row, tx: pads[i].x, tr: G.row + 1, t: 0, pad: pads[i] };
    tone(520, 0.08, "sine", 0, 0.05);
  }

  function screenOf(g, x, row) {
    var r = canvas.getBoundingClientRect();
    return [r.left + x * g.W, r.top + rowY(g, row)];
  }

  function landed(pad) {
    var g = geo();
    var row = G.rows[G.row + 1], q = row.q;
    if (pad.ok) {
      var gain = G.missed ? 5 : 10;
      if (!G.missed) G.firstTry++;
      addScore(gain);
      sfx.right();
      var p = screenOf(g, pad.x, G.row + 1);
      floatAt(p[0], p[1] - g.r, "+" + gain, "#0d9488");
      G.learned.push(q.learn);
      msg(MATH ? "딩동! " + q.learn.en + " 🎉" : mode.id === "meaning" ? "딩동! " + q.learn.emoji + " " + q.learn.ko + " = " + q.answer + " 🎉" : "딩동! " + q.learn.en + " (" + q.learn.ko + ") 🎉");
      row.pads.forEach(function (o) { if (o !== pad) o.fade = 0.0001; });
      G.row++; G.x = pad.x;
      G.ripples.push({ x: pad.x, row: G.row, t: 0, small: true });
      // 화면을 한 줄 위로 올려요
      G.camFrom = G.cam; G.camT = 0.0001;
      G.after = function () {
        if (G.row >= PER_ROUND) {
          // 마지막 연잎에서 건너편 강가로 폴짝
          msg("건너편까지 한 번만 더 폴짝! 🏝️");
          G.jump = { fx: G.x, fr: G.row, tx: 0.5, tr: G.row + 1, t: 0, bank: true };
        } else { showQuestion(); G.lock = false; }
      };
    } else {
      // 틀렸어요: 연잎이 가라앉고 풍덩
      G.missed = true;
      sfx.splash();
      pad.sink = 0.0001;
      G.sink = { x: pad.x, row: G.row + 1, t: 0, pad: pad };
      G.ripples.push({ x: pad.x, row: G.row + 1, t: 0 });
      G.lives--;
      renderHearts(true);
      var sp = screenOf(g, pad.x, G.row + 1);
      floatAt(sp[0], sp[1] - g.r, "💦 풍덩!", "#2563eb");
      msg("앗! '" + pad.word + "' 이(가) 아니에요. 남은 연잎 중에서 다시 골라 봐요!");
    }
  }

  /* ---------- 매 프레임 ---------- */
  function frame(now) {
    if (!G.active) return;
    var dt = GuideBook.isOpen() ? 0 : Math.min(0.05, (now - G.last) / 1000);
    G.last = now; G.t += dt;
    if (G.jump) {
      G.jump.t += dt / JUMP_T;
      if (G.jump.t >= 1) {
        var j = G.jump; G.jump = null;
        if (j.bank) { win(); } else landed(j.pad);
      }
    }
    if (G.camT > 0) {
      G.camT += dt / CAM_T;
      var k = Math.min(1, G.camT), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      G.cam = G.camFrom + (G.row - G.camFrom) * e;
      if (G.camT >= 1) { G.camT = 0; G.cam = G.row; var a = G.after; G.after = null; if (a) a(); }
    }
    if (G.sink) {
      G.sink.t += dt / SINK_T;
      if (G.sink.t >= 1) {
        G.sink.pad.gone = true; G.sink = null;
        if (G.lives <= 0) { G.lock = true; setTimeout(function () { if (G.active) endRound(false); }, 400); }
        else { G.lock = false; var pads = nextPads(); if (pads[G.aim].gone) { G.aim = pads.findIndex(function (o) { return !o.gone; }); } }
      }
    }
    G.rows.forEach(function (r) { if (r.pads) r.pads.forEach(function (o) { if (o.sink > 0 && o.sink < 1) o.sink = Math.min(1, o.sink + dt / SINK_T); if (o.fade > 0 && o.fade < 1) o.fade = Math.min(1, o.fade + dt / 0.5); }); });
    G.ripples.forEach(function (r) { r.t += dt; });
    G.ripples = G.ripples.filter(function (r) { return r.t < 1.2; });
    if (G.winT > 0) G.winT += dt;
    draw();
    G.raf = requestAnimationFrame(frame);
  }

  function win() {
    G.row = PER_ROUND + 1; G.x = 0.5;
    G.camFrom = G.cam; G.camT = 0.0001;
    G.winT = 0.0001;
    sfx.win();
    confetti(30);
    msg("🎉 도착! 강을 다 건넜어요!");
    G.after = function () { setTimeout(function () { if (G.active) endRound(true); }, 1400); };
  }

  /* ---------- 그리기 ---------- */
  function draw() {
    var g = geo(), c = ctx, W = g.W, H = g.H;
    // 물
    var grd = c.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#5ec8e5"); grd.addColorStop(1, "#2fa3c8");
    c.fillStyle = grd; c.fillRect(0, 0, W, H);
    // 흐르는 물결 (화면이 올라가면 같이 움직여요)
    c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 2; c.lineCap = "round";
    var off = (G.cam * g.gap) % 46;
    for (var y = -46 + off; y < H + 46; y += 46) {
      for (var x0 = -80; x0 < W + 80; x0 += 140) {
        var x = x0 + ((G.t * 18 + y * 1.7) % 140);
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 14, y - 6, x + 28, y); c.quadraticCurveTo(x + 42, y + 6, x + 56, y); c.stroke();
      }
    }
    // 강가 (출발 / 도착)
    G.rows.forEach(function (row, ri) {
      if (!row.bank) return;
      var yy = rowY(g, ri);
      c.fillStyle = "#86d36b";
      if (row.far) { if (yy + g.gap * 0.3 > 0) { c.fillRect(0, -10, W, yy + g.gap * 0.18 + 10); drawGrassEdge(c, W, yy + g.gap * 0.18, -1); drawFlowers(c, W, yy - g.gap * 0.05); } }
      else if (yy - g.gap * 0.18 < H) { c.fillRect(0, yy - g.gap * 0.12, W, H); drawGrassEdge(c, W, yy - g.gap * 0.12, 1); }
    });
    // 퍼지는 물결
    G.ripples.forEach(function (r) {
      var p = 1 - r.t / 1.2, yy = rowY(g, r.row);
      c.strokeStyle = "rgba(255,255,255," + (0.8 * p).toFixed(2) + ")"; c.lineWidth = 3;
      for (var k = 0; k < 2; k++) {
        var rr = g.r * (r.small ? 0.9 : 0.6) + (r.t + k * 0.25) * g.r * (r.small ? 0.8 : 1.4);
        c.beginPath(); c.ellipse(r.x * W, yy + g.r * 0.2, rr, rr * 0.4, 0, 0, Math.PI * 2); c.stroke();
      }
    });
    // 연잎: 지나온 줄은 밟은 연잎만, 다음 줄은 3개 다
    for (var ri = Math.max(1, G.row - 1); ri <= Math.min(G.rows.length - 2, G.row + 1); ri++) {
      var row = G.rows[ri];
      row.pads.forEach(function (pad, pi) {
        if (pad.gone) return;
        var landedHere = ri <= G.row && pad.x === (ri === G.row ? G.x : pad.x) && !pad.fade;
        if (ri <= G.row && pad.fade >= 1) return;
        if (ri <= G.row && !pad.ok) return;
        drawPad(c, g, pad, pad.x * W, rowY(g, ri), ri === G.row + 1 && pi === G.aim && !G.jump && !G.sink && G.camT === 0, ri <= G.row);
        void landedHere;
      });
    }
    // 겨누는 점선
    var pads = nextPads();
    if (pads && !G.jump && !G.sink && G.camT === 0 && !G.lock) {
      var tp = pads[G.aim], fx = G.x * W, fy = rowY(g, G.row) - g.r * 0.3, tx = tp.x * W, ty = rowY(g, G.row + 1);
      c.setLineDash([6, 8]); c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 3;
      c.beginPath(); c.moveTo(fx, fy); c.quadraticCurveTo((fx + tx) / 2, Math.min(fy, ty) - g.gap * 0.35, tx, ty - g.r * 0.2); c.stroke();
      c.setLineDash([]);
    }
    // 개구리
    var px, py, s = 1, alpha = 1, look = 0;
    if (G.jump) {
      var j = G.jump, k = Math.min(1, j.t);
      px = (j.fx + (j.tx - j.fx) * k) * W;
      py = rowY(g, j.fr) + (rowY(g, j.tr) - rowY(g, j.fr)) * k - Math.sin(Math.PI * k) * g.gap * 0.35;
      s = 1 + Math.sin(Math.PI * k) * 0.25; look = j.tx - j.fx;
    } else if (G.sink) {
      var sk = G.sink.t;
      px = G.sink.x * W; py = rowY(g, G.sink.row) + sk * g.r * 0.6;
      s = 1 - sk * 0.5; alpha = 1 - sk;
    } else {
      px = G.x * W; py = rowY(g, G.row);
      if (pads && !G.lock) look = pads[G.aim].x - G.x;
      if (G.winT > 0) py -= Math.abs(Math.sin(G.winT * 7)) * g.r * 0.5;
    }
    drawFrog(c, px, py, g.r * 0.95 * s, alpha, look, G.winT > 0);
    // 빠진 동안에는 출발했던 자리에 흐릿한 개구리가 다시 나와요
    if (G.sink) drawFrog(c, G.x * W, rowY(g, G.row), g.r * 0.95, Math.min(1, G.sink.t * 1.4) * 0.9, 0, false);
  }

  function drawGrassEdge(c, W, y, dir) {
    c.fillStyle = "#6fbf55";
    for (var x = -10; x < W + 20; x += 22) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 11, y - dir * 10); c.lineTo(x + 22, y); c.fill(); }
  }
  function drawFlowers(c, W, y) {
    ["#ff7eb6", "#ffd23f", "#ffffff", "#a78bfa"].forEach(function (col, i) {
      var x = W * (0.12 + i * 0.26);
      c.fillStyle = col;
      for (var k = 0; k < 5; k++) { var a = k / 5 * Math.PI * 2; c.beginPath(); c.arc(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 5, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = "#f59e0b"; c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill();
    });
  }

  function drawPad(c, g, pad, x, y, aimed, past) {
    var r = g.r, s = 1 - pad.sink * 0.7, a = (1 - pad.sink) * (1 - pad.fade);
    if (a <= 0.01) return;
    c.save();
    c.globalAlpha = a;
    c.translate(x, y + pad.sink * r * 0.5 + Math.sin(G.t * 2 + x) * 2);
    c.scale(s, s * 0.62);
    if (aimed) { c.fillStyle = "rgba(255,240,140,.55)"; c.beginPath(); c.arc(0, 0, r * 1.22, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = "rgba(0,60,80,.18)"; c.beginPath(); c.arc(4, 8, r, 0, Math.PI * 2); c.fill();
    // 홈이 파인 연잎
    c.fillStyle = "#3fae4f"; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, -Math.PI / 2 + 0.28, Math.PI * 1.5 - 0.28); c.closePath(); c.fill();
    c.fillStyle = "#56c463"; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r * 0.86, -Math.PI / 2 + 0.3, Math.PI * 1.5 - 0.3); c.closePath(); c.fill();
    c.strokeStyle = "rgba(30,110,50,.5)"; c.lineWidth = 2;
    for (var k = 0; k < 6; k++) { var an = -Math.PI / 2 + 0.6 + k * 0.9; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(an) * r * 0.8, Math.sin(an) * r * 0.8); c.stroke(); }
    c.restore();
    // 단어 이름표 (지나온 연잎에는 안 보여요)
    if (past || pad.sink > 0.6) return;
    c.save();
    c.globalAlpha = a;
    var fs = Math.min(r * 0.52, 30), word = pad.word;
    c.font = "800 " + fs + "px Nunito, Pretendard, sans-serif";
    var tw = c.measureText(word).width;
    if (tw > r * 2.1) { fs = fs * r * 2.1 / tw; c.font = "800 " + fs + "px Nunito, Pretendard, sans-serif"; tw = c.measureText(word).width; }
    var bw = tw + fs * 0.9, bh = fs * 1.45, by = y - bh / 2 + pad.sink * r * 0.5;
    c.fillStyle = aimed ? "#fff7cc" : "#ffffff";
    c.beginPath(); if (c.roundRect) c.roundRect(x - bw / 2, by, bw, bh, bh / 2); else c.rect(x - bw / 2, by, bw, bh); c.fill();
    c.lineWidth = aimed ? 3 : 2; c.strokeStyle = aimed ? "#f59e0b" : "rgba(15,118,110,.4)"; c.stroke();
    c.fillStyle = "#134e4a"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(word, x, by + bh / 2 + fs * 0.04);
    c.restore();
  }

  // 귀여운 개구리 (발 밑 가운데가 x, y)
  function drawFrog(c, x, y, s, alpha, look, happy) {
    if (alpha <= 0.01) return;
    c.save();
    c.globalAlpha = alpha;
    c.translate(x, y - s * 0.35);
    var lx = Math.max(-1, Math.min(1, look * 3)) * s * 0.05;
    // 뒷다리
    c.fillStyle = "#2f9e44";
    [-1, 1].forEach(function (k) { c.beginPath(); c.ellipse(k * s * 0.42, s * 0.22, s * 0.26, s * 0.16, k * 0.4, 0, Math.PI * 2); c.fill(); });
    // 몸
    c.fillStyle = "#4cc764"; c.beginPath(); c.ellipse(0, 0, s * 0.5, s * 0.42, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#c7f2a4"; c.beginPath(); c.ellipse(0, s * 0.12, s * 0.3, s * 0.24, 0, 0, Math.PI * 2); c.fill();
    // 앞발
    c.fillStyle = "#2f9e44";
    [-1, 1].forEach(function (k) { c.beginPath(); c.ellipse(k * s * 0.2, s * 0.36, s * 0.1, s * 0.06, 0, 0, Math.PI * 2); c.fill(); });
    // 눈
    [-1, 1].forEach(function (k) {
      c.fillStyle = "#4cc764"; c.beginPath(); c.arc(k * s * 0.24, -s * 0.36, s * 0.17, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(k * s * 0.24, -s * 0.38, s * 0.12, 0, Math.PI * 2); c.fill();
      if (happy) {
        c.strokeStyle = "#1f2937"; c.lineWidth = Math.max(1.5, s * 0.04); c.beginPath(); c.arc(k * s * 0.24, -s * 0.36, s * 0.06, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      } else {
        c.fillStyle = "#1f2937"; c.beginPath(); c.arc(k * s * 0.24 + lx, -s * 0.37, s * 0.06, 0, Math.PI * 2); c.fill();
      }
    });
    // 볼 + 입
    c.fillStyle = "rgba(255,120,150,.55)";
    [-1, 1].forEach(function (k) { c.beginPath(); c.ellipse(k * s * 0.3, -s * 0.08, s * 0.07, s * 0.045, 0, 0, Math.PI * 2); c.fill(); });
    c.strokeStyle = "#1f6f32"; c.lineWidth = Math.max(1.5, s * 0.035);
    c.beginPath(); c.arc(0, -s * 0.12, s * 0.16, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.restore();
  }

  /* ---------- 끝 ---------- */
  function endRound(cleared) {
    stopRound();
    var n = G.firstTry, stars = cleared ? (n >= 9 ? 3 : n >= 6 ? 2 : 1) : (n >= 5 ? 1 : 0);
    $("#result-title").textContent = cleared ? (stars === 3 ? "완벽해요! 🏆" : stars === 2 ? "아주 잘했어요! 🎉" : "잘했어요! 💪") : "하트를 다 썼어요! 다시 도전! 💪";
    $("#result-stars").innerHTML = [1, 2, 3].map(function (k) { return '<span class="' + (k <= stars ? "" : "dim") + '">⭐</span>'; }).join("");
    var isRecord;
    if (MATH) isRecord = ML.saveBest("frog", G.score).isRecord;
    else {
      var data = userData(); data.best = data.best || {};
      var key = modeKey(), best = data.best[key] || 0;
      isRecord = G.score > best;
      if (isRecord) data.best[key] = G.score;
      saveUserData(data);
    }
    var label = MATH ? "🔢 " + esc(ML.danText()) : mode.emoji + " " + (mode.id === "meaning" ? grade.grade + "학년 " + mode.name : mode.name);
    $("#result-text").innerHTML = label + " · 한 번에 맞힌 문제 <b>" + n + "</b> / " + PER_ROUND + "<br>" +
      "점수 <b>" + G.score + "</b>점" + (isRecord && G.score > 0 ? '<span class="record">🎊 최고 기록!</span>' : "");
    var wb = $("#result-words"); wb.innerHTML = "";
    G.learned.forEach(function (w) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "word-chip";
      b.innerHTML = esc((w.emoji ? w.emoji + " " : "") + w.en) + (w.ko ? "<small>" + esc(w.ko) + "</small>" : "");
      b.title = "눌러서 듣기";
      b.addEventListener("click", function () { speakEn(w.say || w.en); });
      wb.appendChild(b);
    });
    show("screen-result");
  }
  $("#btn-again").addEventListener("click", choose);
  $("#btn-result-mode").addEventListener("click", function () { if (MATH) { ML.back(); return; } renderModes(); show("screen-mode"); });
  $("#btn-quit").addEventListener("click", function () { stopRound(); if (MATH) { ML.back(); return; } renderModes(); show("screen-mode"); });

  /* ---------- 구구단 놀이터에서 열었을 때 ---------- */
  if (MATH) {
    document.title = "구구단 징검다리";
    $(".title-card h1").textContent = "구구단 징검다리";
    $(".title-card .subtitle").textContent = "정답 숫자 연잎으로 폴짝! 강을 건너요 (" + ML.danText() + ")";
    var back = $(".title-card .back-link");
    back.textContent = "← 게임 고르기";
    back.addEventListener("click", function (e) { e.preventDefault(); ML.back(); });
    $("#btn-result-mode").textContent = "게임 고르기";
  }

  /* ---------- 키보드 · 터치 ---------- */
  document.addEventListener("keydown", function (e) {
    if (!G.active || document.querySelector(".gb-overlay.show")) return;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { e.preventDefault(); moveAim(-1); }
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { e.preventDefault(); moveAim(1); }
    else if (e.code === "Space" || e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === "Enter") { e.preventDefault(); if (!e.repeat) jump(); }
  });
  var down = null;
  canvas.addEventListener("pointerdown", function (e) { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener("pointerup", function (e) {
    if (!down) return;
    var dx = e.clientX - down.x, dy = e.clientY - down.y; down = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { moveAim(dx > 0 ? 1 : -1); return; }
    if (dy < -40) { jump(); return; }
    // 연잎을 톡 누르면 그 연잎으로 점프
    var pads = nextPads(); if (!pads) return;
    var g = geo(), r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, ty = rowY(g, G.row + 1);
    var hit = -1;
    pads.forEach(function (p, i) { if (!p.gone && Math.abs(x - p.x * g.W) < g.r * 1.15 && Math.abs(y - ty) < g.r * 0.9) hit = i; });
    if (hit >= 0) jump(hit);
  });
  Array.prototype.forEach.call(document.querySelectorAll(".jp"), function (b) {
    b.addEventListener("click", function () {
      var a = b.dataset.act;
      if (a === "left") moveAim(-1); else if (a === "right") moveAim(1); else jump();
    });
  });

})();
