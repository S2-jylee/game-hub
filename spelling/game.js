// 🚂 스펠링 기차: 그림을 보고, 맵에 흩어진 알파벳을 순서대로 먹어 영어 단어를 완성해요.
// 맞는 글자를 먹으면 기차 칸이 하나씩 늘어나고, 틀린 글자·벽·기차 칸에 부딪히면 하트가 줄어요.
// 구구단 놀이터에서 열면(?mul=1) '구구단 기차': 7단 14 → 21 → 28 처럼 단의 답을 차례대로 먹어요.
(function () {
  "use strict";

  var ML = window.MulLink || { on: false }, MATH = ML.on;

  var $ = function (s) { return document.querySelector(s); };
  var GRADES = window.SPELL_GRADES, LEVELS = window.SPELL_LEVELS;
  var grade = GRADES[0];          // 고른 학년
  var COLS = 13, ROWS = 9;        // 맵 칸 수 (세로 화면에서는 판을 시작할 때 9칸 너비로 바꿔요)
  var LIVES = 5;                  // 한 판 하트 수
  var PER_ROUND = 8;              // 한 판 단어 수
  var COLORS = ["#ff7eb6", "#ffbe0b", "#60a5fa", "#34d399", "#a78bfa", "#ff9f43"];
  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var OPP = { up: "down", down: "up", left: "right", right: "left" };
  var ALPHABET = "abcdefghijklmnopqrstuvwxyz";
  var PROFILES_KEY = "spell_profiles", RANK_KEY = "spell_rank_";
  var GUIDE_ID = MATH ? "spelling_mul" : "spelling";
  if (MATH) PER_ROUND = 6;

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

  /* ---------- 화면 ---------- */
  function show(id) {
    Array.prototype.forEach.call(document.querySelectorAll(".screen"), function (s) {
      s.classList.toggle("active", s.id === id);
    });
  }

  /* ---------- 소리 ---------- */
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
    eat: function (n) { var f = 523 * Math.pow(1.122, n); tone(f, 0.12, "triangle", 0, 0.14); tone(f * 1.5, 0.12, "triangle", 0.06, 0.1); },
    wrong: function () { tone(260, 0.2, "triangle", 0, 0.14); tone(196, 0.28, "triangle", 0.12, 0.14); },
    bump: function () { tone(120, 0.25, "square", 0, 0.1); tone(90, 0.3, "sine", 0.05, 0.12); },
    word: function () { [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) { tone(f, 0.18, "triangle", i * 0.1, 0.12); }); },
    no: function () { tone(330, 0.08, "sine", 0, 0.06); }
  };
  // 영어 단어는 영어 목소리로 읽어요 (구구단 기차는 우리말로)
  function speakEn(text) {
    if (GuideBook.defer(function () { speakEn(text); })) return;   // 방법 팝업이 닫히면 읽어줘요
    if (!("speechSynthesis" in window) || (MATH && !ML.sound)) return;
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(MATH ? wordLabel(text) : text);
      u.lang = MATH ? "ko-KR" : "en-US"; u.rate = MATH ? 0.95 : 0.8; u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch (e) { /* speech unavailable, ignore */ }
  }

  // 구구단 기차의 '단어'는 숫자 배열이에요
  function wordLabel(en) { return Array.isArray(en) ? en.join(" → ") : en; }
  var UNIT = MATH ? "숫자" : "글자";

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
    var bits = ["🎉", "🎊", "⭐", "🚂", "💖", "🌟", "🍭"];
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

  /* ---------- 사용자 (이 기기에만 저장, 게스트는 저장 안 함) ---------- */
  var user = null, guest = false, guestData = null;
  var loadProfiles = function () { return store.get(PROFILES_KEY, {}); };
  function userData() {
    if (guest) return guestData;
    return loadProfiles()[user] || { best: {} };
  }
  function saveUserData(d) {
    if (guest) { guestData = d; return; }
    var p = loadProfiles(); p[user] = d; store.set(PROFILES_KEY, p);
  }
  function enterAs(name) {
    guest = !name; user = name;
    if (guest) guestData = { best: {} };
    else if (!loadProfiles()[name]) saveUserData({ best: {} });
    $("#user-badge").textContent = "👤 " + (name || "게스트");
    Array.prototype.forEach.call(document.querySelectorAll(".user-badge-copy"), function (el) { el.textContent = "👤 " + (name || "게스트"); });
    renderGrades();
    show("screen-grade");
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
    // 구구단: 난이도는 구구단 놀이터 설정 창에서 이미 골랐어요
    if (MATH) { chooseLevel(mathLevel()); return; }
    renderUserList(); $("#user-name-input").value = ""; show("screen-user"); });
  $("#btn-user-new").addEventListener("click", submitNewUser);
  $("#user-name-input").addEventListener("keydown", function (e) { if (e.key === "Enter") submitNewUser(); });
  $("#btn-user-guest").addEventListener("click", function () { enterAs(null); });
  $("#btn-user-back").addEventListener("click", function () { show("screen-title"); });
  $("#btn-level-back").addEventListener("click", function () { if (MATH) { ML.back(); return; } renderGrades(); show("screen-grade"); });
  $("#btn-grade-back").addEventListener("click", function () { show("screen-title"); });

  /* ---------- 학년 고르기 ---------- */
  var GR_BG = [["#ecfccb", "#4d7c0f"], ["#fef9c3", "#a16207"], ["#ffedd5", "#c2410c"], ["#e1efff", "#1d4ed8"], ["#f3e8ff", "#7e22ce"], ["#ffe4e6", "#be123c"]];
  function renderGrades() {
    var g = $("#grade-grid"); g.innerHTML = "";
    GRADES.forEach(function (gr, i) {
      var b = document.createElement("button");
      b.className = "grade-btn"; b.type = "button";
      b.style.setProperty("--bg", GR_BG[i][0]); b.style.setProperty("--c", GR_BG[i][1]);
      var ex = gr.words.slice(0, 3).map(function (w) { return w[0]; }).join(" · ");
      b.innerHTML = '<span class="gr-emoji">' + gr.emoji + '</span><span class="gr-name">' + gr.grade + "학년</span>" +
        '<span class="gr-desc">' + gr.desc + '</span><span class="gr-ex">' + ex + " …</span>";
      b.addEventListener("click", function () { grade = gr; renderLevels(); show("screen-level"); });
      g.appendChild(b);
    });
  }
  // 학년 + 난이도마다 기록을 따로 모아요
  function recKey(lv) { return "g" + grade.grade + "_" + lv.id; }

  /* ---------- 난이도 고르기 ---------- */
  var LV_BG = { easy: ["#ecfccb", "#65a30d"], normal: ["#e1efff", "#2e9bff"], hard: ["#ffe7f2", "#d81b7a"] };
  function renderLevels() {
    var g = $("#level-grid"); g.innerHTML = "";
    $("#level-grade-tag").textContent = MATH ? "🔢 " + ML.danText() : grade.emoji + " " + grade.grade + "학년";
    var best = userData().best || {};
    LEVELS.forEach(function (lv) {
      var b = document.createElement("button");
      b.className = "level-btn"; b.type = "button";
      b.style.setProperty("--bg", LV_BG[lv.id][0]); b.style.setProperty("--c", LV_BG[lv.id][1]);
      var top = MATH ? null : store.get(RANK_KEY + recKey(lv), [])[0];
      b.innerHTML = '<span class="lv-emoji">' + lv.emoji + '</span><span class="lv-name">' + lv.name + "</span>" +
        '<span class="lv-desc">' + (MATH ? MATH_DESC[lv.id] : lv.desc) + "</span>" +
        '<span class="lv-best">' + (MATH ? "" : best[recKey(lv)] ? "⭐ 내 최고 " + best[recKey(lv)] + "점" : "아직 기록이 없어요") +
        (top ? " · 🥇 " + esc(top.name) + " " + top.score + "점" : "") + "</span>" +
        '<span class="lv-go">출발 ▶</span>';
      b.addEventListener("click", function () { chooseLevel(lv); });
      g.appendChild(b);
    });
  }
  function mathLevel() { return LEVELS.filter(function (l) { return l.id === ML.diff; })[0] || LEVELS[1]; }
  var MATH_DESC = { easy: "필요한 숫자만 나와요. 다음 숫자가 반짝!", normal: "헷갈리는 방해 숫자 3개", hard: "방해 숫자 6개! 기차도 더 빨라요" };
  function guide(onStart) {
    if (MATH) return {
      id: GUIDE_ID, title: "구구단 기차",
      pages: [
        { icon: "🔢", title: "몇 단인지 봐요", text: "위 칸에 <b>7×1, 7×2 …</b> 처럼 외울 단이 나와요.<br>예) <b>7단</b> → 7, 14, 21, 28 … 63" },
        { icon: "🚂", title: "기차를 움직여요", text: "<b>방향키(← ↑ → ↓)</b>를 누르면 기차가 그쪽으로 달려요.<br>태블릿은 화면을 <b>밀거나</b> 방향 버튼을 눌러요." },
        { icon: "🔢", title: "답을 차례대로 먹어요", text: "단의 답을 <b>작은 것부터 차례대로</b> 먹어요.<br>맞는 숫자를 먹으면 <b>기차 칸</b>이 하나씩 늘어나요!" },
        { icon: "⚠️", title: "조심해요!", text: "<b>틀린 숫자</b>를 먹거나 <b>벽</b>, 기차 칸에 부딪히면 ❤️ 하트가 하나 줄어요." },
        { icon: "🏆", title: PER_ROUND + "번 완성!", text: "한 판에 <b>" + PER_ROUND + "번</b> 완성해요. 한 번도 안 틀리면 <b>보너스</b>!" }
      ],
      startText: "자, 구구단 기차 출발!", startLabel: "출발! 🚂", onStart: onStart
    };
    return {
      id: GUIDE_ID, title: "스펠링 기차",
      pages: [
        { icon: "🍎", title: "그림을 보고 단어를 떠올려요", text: "위에 나온 <b>그림</b>과 <b>뜻</b>을 보고 어떤 영어 단어인지 생각해요.<br>🔊 를 누르면 단어를 읽어줘요." },
        { icon: "🚂", title: "기차를 움직여요", text: "<b>방향키(← ↑ → ↓)</b>를 누르면 기차가 그쪽으로 칙칙폭폭 달려요.<br>태블릿은 화면을 <b>밀거나</b> 방향 버튼을 눌러요." },
        { icon: "🔤", title: "글자를 순서대로 먹어요", text: "단어의 <b>첫 글자부터 차례대로</b> 먹어요.<br>맞는 글자를 먹으면 <b>기차 칸</b>이 하나씩 늘어나요!<br>예) a → p → p → l → e" },
        { icon: "⚠️", title: "조심해요!", text: "<b>틀린 글자</b>를 먹거나 <b>벽</b>, 기차에 붙인 <b>알파벳 칸</b>에 부딪히면 ❤️ 하트가 하나 줄어요.<br>부딪히면 기차가 멈추니까, 다른 방향키를 눌러 다시 출발해요." },
        { icon: "🏆", title: "단어 8개에 도전!", text: "한 판에 단어 <b>8개</b>를 완성해요.<br>한 번도 안 틀리고 완성하면 <b>보너스 점수</b>! 하트 5개를 다 쓰면 끝나요." }
      ],
      startText: "자, 기차 출발해 볼까?",
      startLabel: "출발! 🚂",
      onStart: onStart
    };
  }
  // 게임 화면을 먼저 열고, 그 위에 방법 팝업을 띄워요. '확인'을 누르면 출발 (팝업이 떠 있는 동안은 멈춰 있어요)
  function chooseLevel(lv) {
    startRound(lv);
    GuideBook.intro(guide(null), function () { $("#btn-quit").click(); });
  }
  $("#btn-guide").addEventListener("click", function () { GuideBook.open(guide(null)); });
  $("#btn-grade-guide").addEventListener("click", function () { GuideBook.open(guide(null)); });

  /* ---------- 게임 상태 ---------- */
  var canvas = $("#board"), ctx = canvas.getContext("2d");
  var G = {
    W: 0, H: 0, raf: 0, last: 0, t: 0, active: false,
    level: null, words: [], wi: 0, word: null, idx: 0,
    lives: LIVES, score: 0, mistakes: 0, done: [],
    snake: [], prev: [], cars: [], dir: null, queue: [], moving: false, acc: 0,
    letters: [], freezeT: 0, after: null, shakeT: 0, crashT: 0, puffs: [], puffT: 0
  };

  function resize() {
    var r = $("#board-wrap").getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    G.W = r.width; G.H = r.height;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", function () { if (G.active) resize(); });

  function startRound(lv) {
    // 학년 단어를 짧은 순서로 세우고(같은 길이는 섞어서), 난이도에 맞는 쪽에서 골라요
    var mathWords = MATH ? makeMathWords(lv) : null;
    var sorted = shuffle(grade.words.slice()).sort(function (a, b) { return a[0].length - b[0].length; });
    var pool = sorted.slice(Math.floor(sorted.length * lv.part[0]), Math.ceil(sorted.length * lv.part[1]));
    Object.assign(G, {
      level: lv, words: mathWords || shuffle(pool.slice()).slice(0, PER_ROUND), wi: 0,
      lives: LIVES, score: 0, done: [], active: true, t: 0, freezeT: 0, after: null, puffs: []
    });
    $("#hud-score").textContent = "0";
    renderHearts();
    show("screen-game");
    resize();
    // 휴대폰처럼 세로로 긴 화면: 가로 9칸, 세로는 남는 높이만큼 (7~13칸)
    if (G.H > G.W) { COLS = 9; ROWS = Math.max(7, Math.min(13, Math.floor(G.H / (G.W / 9)))); }
    else { COLS = 13; ROWS = 9; }
    nextWord();
    G.last = performance.now();
    cancelAnimationFrame(G.raf);
    G.raf = requestAnimationFrame(frame);
  }

  // 구구단 기차 문제: 고른 단에서 연속된 답 3~5개 (예: 7단 14, 21, 28)
  function makeMathWords(lv) {
    // 한 판에 한 단을 통째로: ×1부터 ×9까지 9개를 한 번에 이어가요 (3개씩 끊지 않아요)
    var len = 9, out = [];
    for (var k = 0; k < PER_ROUND; k++) {
      var d = pick(ML.dans), st = 1, toks = [];
      for (var i = 0; i < len; i++) toks.push(String(d * (st + i)));
      out.push([toks, "🔢", d + "단 · " + d + " × " + st + " 부터 차례로", d, st]);
    }
    return out;
  }
  function nextWord() {
    var w = G.words[G.wi];
    G.word = { en: w[0], emoji: w[1], ko: w[2], dan: w[3], st: w[4] };
    G.idx = 0; G.mistakes = 0;
    var cx = Math.floor(COLS / 2), cy = Math.floor(ROWS / 2);
    G.snake = [{ x: cx, y: cy }]; G.prev = [{ x: cx, y: cy }];
    G.cars = []; G.dir = null; G.queue = []; G.moving = false; G.acc = 0;
    placeLetters();
    $("#hint-emoji").textContent = MATH ? G.word.emoji : wordPic([G.word.en, G.word.emoji]);
    animate($("#hint-emoji"), "pop");
    $("#hint-meaning").textContent = MATH ? "" : G.word.ko;
    $("#hud-word").textContent = (G.wi + 1) + " / " + G.words.length;
    renderBlanks();
    msg(MATH ? "방향키를 눌러 출발! 🚂  " + G.word.dan + "단을 외워봐요" : "방향키를 눌러 출발! 🚂  첫 " + UNIT + "를 찾아요");
    setTimeout(function () { if (G.active) speakEn(G.word.en); }, 400);
  }

  function renderBlanks() {
    var box = $("#hint-blanks"); box.innerHTML = "";
    box.classList.toggle("num", MATH);
    for (var i = 0; i < G.word.en.length; i++) {
      var s = document.createElement("span");
      s.className = "blank" + (i < G.idx ? " filled" : i === G.idx ? " next" : "");
      if (i < G.idx) { s.textContent = G.word.en[i]; s.style.setProperty("--c", G.cars[i].color); }
      // 구구단: 아직 못 먹은 칸에는 문제(2×7)를 보여줘요. 먹으면 정답 숫자로 바뀌어요
      else if (MATH) { s.textContent = G.word.dan + "×" + (G.word.st + i); s.classList.add("q"); }
      box.appendChild(s);
    }
  }

  function renderHearts(justLost) {
    var html = "";
    for (var k = 0; k < LIVES; k++) {
      if (k < G.lives) html += "<span>❤️</span>";
      else html += '<span class="' + (justLost && k === G.lives ? "lost" : "") + '" style="opacity:.45">🤍</span>';
    }
    $("#hud-hearts").innerHTML = html;
  }
  function msg(text) { $("#game-msg").textContent = text; }
  function addScore(n) {
    G.score += n;
    $("#hud-score").textContent = G.score;
    animate($("#hud-score-box"), "bump");
  }

  /* ---------- 글자 놓기 ---------- */
  function freeCell(taken) {
    var head = G.snake[0];
    for (var tries = 0; tries < 300; tries++) {
      var x = rand(0, COLS - 1), y = rand(0, ROWS - 1);
      if (taken[x + "," + y]) continue;
      if (Math.abs(x - head.x) + Math.abs(y - head.y) < 3) continue;
      return { x: x, y: y };
    }
    return null;
  }
  function takenMap() {
    var m = {};
    G.snake.forEach(function (s) { m[s.x + "," + s.y] = true; });
    G.letters.forEach(function (l) { m[l.x + "," + l.y] = true; });
    return m;
  }
  function addLetter(ch, need) {
    var c = freeCell(takenMap());
    if (c) G.letters.push({ x: c.x, y: c.y, ch: ch, need: need, born: G.t, ph: Math.random() * 6 });
  }
  function placeLetters() {
    G.letters = [];
    var en = G.word.en;
    for (var i = 0; i < en.length; i++) addLetter(en[i], true);
    // 방해 글자: 단어에 없는 글자로만 골라요 (헷갈리지 않게)
    var others = shuffle((MATH ? mathDecoys() : ALPHABET.split("")).filter(function (ch) { return en.indexOf(ch) < 0; }));
    for (var k = 0; k < G.level.decoys; k++) addLetter(others[k], false);
  }
  // 헷갈리는 숫자: 앞뒤 답, 답 ±1, 다른 단의 답
  function mathDecoys() {
    var d = G.word.dan, st = G.word.st, n = G.word.en.length, set = {};
    var add = function (v) { if (v > 0) set[v] = true; };
    add(d * (st - 1)); add(d * (st + n));
    G.word.en.forEach(function (t) { add(+t + 1); add(+t - 1); add(+t + (d > 2 ? d - 1 : d + 1)); });
    return Object.keys(set);
  }
  function letterAt(x, y) {
    for (var i = 0; i < G.letters.length; i++) if (G.letters[i].x === x && G.letters[i].y === y) return G.letters[i];
    return null;
  }

  /* ---------- 조작 ---------- */
  // 벽이나, 기차에 붙인 알파벳 칸에 머리가 부딪히면 멈추고 하트가 하나 줄어요.
  function isWall(x, y) { return x < 0 || y < 0 || x >= COLS || y >= ROWS; }
  // 머리가 (x, y)로 갈 때 부딪히는 기차 칸이 있나요? (한 칸 가면 꼬리는 비켜나요)
  function hitsCar(x, y, grow) {
    var body = grow ? G.snake.slice(1) : G.snake.slice(1, -1);
    return body.some(function (s) { return s.x === x && s.y === y; });
  }
  function input(d) {
    if (!G.active || G.freezeT > 0 || !DIRS[d]) return;
    if (!G.moving) {
      // 멈춰 있을 때: 벽 쪽이나 바로 뒤 칸 쪽으로는 출발하지 않아요
      var h = G.snake[0], nx = h.x + DIRS[d][0], ny = h.y + DIRS[d][1], back = G.snake[1];
      if (isWall(nx, ny)) { sfx.no(); msg("그쪽은 벽이에요! 다른 방향을 눌러요"); return; }
      if (back && back.x === nx && back.y === ny) { sfx.no(); msg("기차는 뒤로 갈 수 없어요! 다른 방향을 눌러요"); return; }
      if (hitsCar(nx, ny, false)) { sfx.no(); msg("그쪽은 기차 칸이 있어요! 다른 방향을 눌러요"); return; }
      G.dir = d; G.queue = []; G.moving = true; G.acc = G.level.step; // 다음 프레임에 바로 한 칸
      if (G.idx === 0 && G.cars.length === 0) msg("칙칙폭폭! 🚂 \"" + G.word.ko + "\" 의 첫 " + UNIT + "를 먹어요");
      return;
    }
    var last = G.queue.length ? G.queue[G.queue.length - 1] : G.dir;
    if (d === last) return;
    if (d === OPP[last] && G.snake.length > 1) return;   // 기차 칸이 있으면 뒤로 돌 수 없어요
    if (G.queue.length < 2) G.queue.push(d);
  }

  function step() {
    if (G.queue.length) {
      var nd = G.queue.shift();
      if (!(nd === OPP[G.dir] && G.snake.length > 1)) G.dir = nd;
    }
    var h = G.snake[0], d = DIRS[G.dir];
    var nx = h.x + d[0], ny = h.y + d[1];
    if (isWall(nx, ny)) { crash(); return; }
    var lt = letterAt(nx, ny);
    var grow = !!lt && lt.ch === G.word.en[G.idx];
    if (hitsCar(nx, ny, grow)) { crash(true); return; }
    var old = G.snake;
    G.snake = [{ x: nx, y: ny }].concat(grow ? old : old.slice(0, -1));
    G.prev = G.snake.map(function (s, i) { return old[Math.min(i, old.length - 1)]; });
    if (lt) {
      G.letters.splice(G.letters.indexOf(lt), 1);
      if (grow) eatRight(lt); else eatWrong(lt);
    }
  }

  function cellScreen(x, y) {
    var b = geo(), r = canvas.getBoundingClientRect();
    return [r.left + b.ox + (x + 0.5) * b.cs, r.top + b.oy + (y + 0.5) * b.cs];
  }

  function eatRight(lt) {
    var color = COLORS[G.idx % COLORS.length];
    G.cars.push({ ch: lt.ch, color: color });
    G.idx++;
    addScore(10);
    sfx.eat(G.idx);
    var p = cellScreen(lt.x, lt.y);
    floatAt(p[0], p[1] - 10, lt.ch + "  +10", color);
    renderBlanks();
    if (G.idx >= G.word.en.length) { wordDone(); return; }
    msg("딩동! '" + lt.ch + "' 칸이 붙었어요 🚃  다음 " + UNIT + "를 찾아요");
  }

  function loseLife() {
    G.lives = Math.max(0, G.lives - 1);
    G.mistakes++;
    renderHearts(true);
    G.shakeT = 0.35;
    if (G.lives <= 0) {
      G.moving = false;
      G.freezeT = 1.3;
      G.after = function () { endRound(); };
      msg("하트를 다 썼어요! 💪");
      return true;
    }
    return false;
  }

  function eatWrong(lt) {
    sfx.wrong();
    var p = cellScreen(lt.x, lt.y);
    floatAt(p[0], p[1] - 10, "❌ " + lt.ch, "#ff3b3b");
    // 단어에 꼭 필요한 글자였으면 다른 곳에 다시 놓아요
    if (lt.need) addLetter(lt.ch, true);
    if (loseLife()) return;
    msg(G.word.en.indexOf(lt.ch) >= 0
      ? "앗, 순서가 달라요! 지금은 " + (G.idx + 1) + "번째 " + UNIT + "를 먹어야 해요"
      : MATH ? "앗, " + lt.ch + " 은(는) " + G.word.dan + "단 답이 아니에요!" : "앗, '" + lt.ch + "' 는 \"" + G.word.ko + "\" 에 없는 글자예요!");
  }

  function crash(car) {
    sfx.bump();
    G.moving = false; G.queue = []; G.acc = 0;
    G.prev = G.snake.slice();
    G.crashT = 0.6;
    G.freezeT = 0.4;   // 부딪히자마자 또 부딪히지 않게 잠깐 쉬어요
    if (loseLife()) return;
    msg(car ? "쿵! 기차 칸에 부딪혔어요 💫 다른 방향키를 눌러 다시 출발해요" : "쿵! 벽에 부딪혔어요 💫 다른 방향키를 눌러 다시 출발해요");
  }

  function wordDone() {
    var perfect = G.mistakes === 0;
    addScore(30 + (perfect ? 20 : 0));
    G.done.push(G.word);
    G.moving = false; G.queue = [];
    G.letters = [];
    sfx.word();
    confetti(18);
    setTimeout(function () { speakEn(G.word.en); }, 250);
    msg("🎉 " + (MATH ? G.word.dan + "단 " + wordLabel(G.word.en) : G.word.en + " (" + G.word.ko + ")") + " 완성!" + (perfect ? "  한 번도 안 틀렸어요! +20" : ""));
    G.freezeT = 2.0;
    G.after = function () {
      G.wi++;
      if (G.wi >= G.words.length) endRound(); else nextWord();
    };
  }

  /* ---------- 끝 ---------- */
  function endRound() {
    G.active = false;
    cancelAnimationFrame(G.raf);
    var n = G.done.length;
    var stars = n >= PER_ROUND ? 3 : n >= 5 ? 2 : 1;
    var titles = { 3: "완벽해요! 🏆", 2: "아주 잘했어요! 🎉", 1: "잘했어요! 다음엔 더 잘할 수 있어 💪" };
    $("#result-title").textContent = n < G.words.length ? (n >= 5 ? titles[2] : "하트를 다 썼어요! 다시 도전! 💪") : titles[3];
    $("#result-stars").innerHTML = [1, 2, 3].map(function (k) { return '<span class="' + (k <= stars ? "" : "dim") + '">⭐</span>'; }).join("");

    var lv = G.level, isRecord;
    if (MATH) isRecord = ML.saveBest("train", G.score).isRecord;
    else {
      var data = userData();
      data.best = data.best || {};
      var best = data.best[recKey(lv)] || 0;
      isRecord = G.score > best;
      if (isRecord) data.best[recKey(lv)] = G.score;
      saveUserData(data);
    }
    $("#result-text").innerHTML = (MATH ? esc(ML.danText()) + " · " + ML.diffName : grade.grade + "학년 " + lv.emoji + " " + lv.name) + " · 완성한 " + (MATH ? "차례" : "단어") + " <b>" + n + "</b> / " + G.words.length + "<br>" +
      "점수 <b>" + G.score + "</b>점" + (isRecord && G.score > 0 ? '<span class="record">🎊 최고 기록!</span>' : "");

    var wb = $("#result-words"); wb.innerHTML = "";
    G.done.forEach(function (w) {
      var c = document.createElement("button");
      c.type = "button"; c.className = "word-chip";
      if (MATH) c.innerHTML = esc(w.dan + "단 " + wordLabel(w.en));
      else {
        c.innerHTML = w.emoji + " " + w.en + "<small>" + w.ko + "</small>";
        c.title = "눌러서 듣기";
        c.addEventListener("click", function () { speakEn(w.en); });
      }
      wb.appendChild(c);
    });
    $("#result-rank").innerHTML = MATH ? "" : rankHtml();
    show("screen-result");
    if (stars >= 2) confetti(stars * 12);
  }

  // 난이도별 랭킹 (이 기기에 저장, 게스트는 빼요)
  function rankHtml() {
    var key = RANK_KEY + recKey(G.level);
    var list = store.get(key, []), mine = null;
    if (!guest && G.score > 0) {
      mine = { name: user, score: G.score, words: G.done.length, at: Date.now() };
      list.push(mine);
      list.sort(function (a, b) { return b.score - a.score || a.at - b.at; });
      list = list.slice(0, 10);
      store.set(key, list);
    }
    if (!list.length) return "";
    var medal = ["🥇", "🥈", "🥉"];
    var myIdx = mine ? list.findIndex(function (e) { return e.at === mine.at; }) : -1;
    function row(e, i) {
      return '<li class="' + (i === myIdx ? "me" : "") + '"><span class="no">' + (medal[i] || i + 1) + "</span>" +
        '<span class="nm">' + esc(e.name) + '</span><span class="sc">' + e.score + "점</span></li>";
    }
    var html = list.slice(0, 5).map(row).join("");
    if (myIdx >= 5) html += row(list[myIdx], myIdx);
    var note = guest ? "게스트 점수는 랭킹에 올라가지 않아요. 이름으로 시작해 보세요!"
      : mine && myIdx < 0 ? "아쉽게 10위 안에 못 들었어요. 다시 도전!" : "한 번도 안 틀리고 완성하면 보너스 +20점!";
    return '<div class="rank-title">🏆 ' + grade.grade + "학년 " + G.level.name + " 랭킹</div><ol>" + html + '</ol><div class="rank-note">' + note + "</div>";
  }

  $("#btn-again").addEventListener("click", function () { chooseLevel(G.level); });
  $("#btn-result-level").addEventListener("click", function () { if (MATH) { ML.back(); return; } renderLevels(); show("screen-level"); });
  $("#btn-quit").addEventListener("click", function () {
    G.active = false; cancelAnimationFrame(G.raf);
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (MATH) { ML.back(); return; }
    renderLevels(); show("screen-level");
  });
  $("#btn-speak").addEventListener("click", function () { if (G.word) speakEn(G.word.en); });

  /* ---------- 매 프레임 ---------- */
  function frame(now) {
    if (!G.active) return;
    var dt = GuideBook.isOpen() ? 0 : Math.min(0.05, (now - G.last) / 1000);
    G.last = now; G.t += dt;

    if (G.freezeT > 0 && (G.freezeT -= dt) <= 0) {
      G.freezeT = 0;
      var fn = G.after; G.after = null;
      if (fn) { fn(); if (!G.active) return; }
    }
    if (G.moving && G.freezeT <= 0) {
      G.acc += dt;
      while (G.moving && G.acc >= G.level.step) { G.acc -= G.level.step; step(); }
      if ((G.puffT -= dt) <= 0) { G.puffT = 0.28; puff(); }
    }
    G.shakeT = Math.max(0, G.shakeT - dt);
    G.crashT = Math.max(0, G.crashT - dt);
    G.puffs.forEach(function (p) { p.t += dt; });
    G.puffs = G.puffs.filter(function (p) { return p.t < 1.1; });

    draw();
    G.raf = requestAnimationFrame(frame);
  }

  /* ---------- 그리기 ---------- */
  function geo() {
    var cs = Math.floor(Math.min(G.W / COLS, G.H / ROWS));
    return { cs: cs, ox: Math.floor((G.W - COLS * cs) / 2), oy: Math.floor((G.H - ROWS * cs) / 2) };
  }
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  // 기차 칸 위치: 한 칸 움직이는 사이를 부드럽게 이어요
  function segPos(i) {
    var k = G.moving ? Math.min(1, G.acc / G.level.step) : 1;
    var a = G.prev[i] || G.snake[i], b = G.snake[i];
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
  }
  function puff() {
    var p = segPos(0);
    G.puffs.push({ x: p.x, y: p.y, t: 0, dx: (Math.random() - 0.5) * 0.3 });
  }

  function draw() {
    var b = geo(), cs = b.cs;
    ctx.clearRect(0, 0, G.W, G.H);
    ctx.save();
    if (G.shakeT > 0) ctx.translate((Math.random() - 0.5) * 12 * G.shakeT, (Math.random() - 0.5) * 8 * G.shakeT);
    ctx.translate(b.ox, b.oy);

    // 맵: 연두색 바둑판
    rr(-6, -6, COLS * cs + 12, ROWS * cs + 12, 18);
    ctx.fillStyle = "#bfe3a0"; ctx.fill();
    for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
      ctx.fillStyle = (x + y) % 2 ? "#e4f6d4" : "#d6f0c0";
      ctx.fillRect(x * cs, y * cs, cs, cs);
    }

    // 글자
    var next = G.word ? G.word.en[G.idx] : null;
    G.letters.forEach(function (l) {
      var cx = (l.x + 0.5) * cs, cy = (l.y + 0.5) * cs + Math.sin(G.t * 3 + l.ph) * cs * 0.04;
      var s = Math.min(1, (G.t - l.born) / 0.25);
      var r = cs * 0.4 * (0.4 + 0.6 * s);
      if (G.level.glow && l.ch === next) {   // 쉬움: 다음에 먹을 글자가 반짝반짝
        var pulse = 0.5 + 0.5 * Math.sin(G.t * 6);
        ctx.fillStyle = "rgba(255,212,0," + (0.35 + 0.35 * pulse) + ")";
        ctx.beginPath(); ctx.arc(cx, cy, r * (1.3 + 0.15 * pulse), 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = "rgba(36,27,58,.12)";
      ctx.beginPath(); ctx.arc(cx + cs * 0.03, cy + cs * 0.05, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = Math.max(2, cs * 0.06); ctx.strokeStyle = "#a78bfa"; ctx.stroke();
      ctx.fillStyle = "#3b2d5c";
      ctx.font = "800 " + Math.round(r * (l.ch.length > 2 ? 0.75 : l.ch.length > 1 ? 1 : 1.25)) + "px Nunito, Pretendard, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(l.ch, cx, cy + r * 0.04);
    });

    // 연기
    G.puffs.forEach(function (p) {
      var k = p.t / 1.1;
      ctx.fillStyle = "rgba(255,255,255," + (0.8 * (1 - k)) + ")";
      ctx.beginPath();
      ctx.arc((p.x + 0.5 + p.dx * k) * cs, (p.y + 0.5) * cs - cs * (0.45 + k * 0.9), cs * (0.12 + k * 0.18), 0, Math.PI * 2);
      ctx.fill();
    });

    // 기차: 꼬리부터 그리고, 기관차를 맨 위에
    var n = G.snake.length, pts = [];
    for (var i = 0; i < n; i++) pts.push(segPos(i));
    ctx.strokeStyle = "#6b5f86"; ctx.lineWidth = Math.max(3, cs * 0.1); ctx.lineCap = "round";
    for (var j = 1; j < n; j++) {
      ctx.beginPath();
      ctx.moveTo((pts[j - 1].x + 0.5) * cs, (pts[j - 1].y + 0.5) * cs);
      ctx.lineTo((pts[j].x + 0.5) * cs, (pts[j].y + 0.5) * cs);
      ctx.stroke();
    }
    for (var k = n - 1; k >= 1; k--) drawCar(pts[k], G.cars[k - 1], cs);
    if (n) drawEngine(pts[0], cs);

    // 멈춰 있을 때: 출발하라고 기관차 둘레가 콩닥콩닥
    if (!G.moving && G.freezeT <= 0 && n) {
      var pr = cs * (0.62 + 0.08 * Math.sin(G.t * 5));
      ctx.strokeStyle = "rgba(255,159,67,.85)"; ctx.lineWidth = Math.max(2, cs * 0.06);
      ctx.setLineDash([cs * 0.12, cs * 0.1]);
      ctx.beginPath(); ctx.arc((pts[0].x + 0.5) * cs, (pts[0].y + 0.5) * cs, pr, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawCar(p, car, cs) {
    var s = cs * 0.8, x = (p.x + 0.5) * cs - s / 2, y = (p.y + 0.5) * cs - s / 2;
    ctx.fillStyle = "rgba(36,27,58,.15)";
    rr(x + cs * 0.03, y + cs * 0.06, s, s, s * 0.22); ctx.fill();
    ctx.fillStyle = car.color;
    rr(x, y, s, s, s * 0.22); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.35)";
    rr(x + s * 0.12, y + s * 0.1, s * 0.76, s * 0.18, s * 0.09); ctx.fill();
    // 바퀴
    ctx.fillStyle = "#3b2d5c";
    [0.26, 0.74].forEach(function (f) { ctx.beginPath(); ctx.arc(x + s * f, y + s * 0.98, s * 0.1, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#fff";
    ctx.font = "800 " + Math.round(s * (car.ch.length > 2 ? 0.38 : car.ch.length > 1 ? 0.5 : 0.62)) + "px Nunito, Pretendard, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(car.ch, x + s / 2, y + s * 0.55);
  }

  function drawEngine(p, cs) {
    var s = cs * 0.9, cx = (p.x + 0.5) * cs, cy = (p.y + 0.5) * cs;
    var d = DIRS[G.dir || "right"];
    var wob = G.crashT > 0 ? Math.sin(G.t * 50) * cs * 0.04 : 0;
    ctx.save();
    ctx.translate(cx + wob, cy);
    // 굴뚝
    ctx.fillStyle = "#3b2d5c";
    rr(-s * 0.12 - d[0] * s * 0.15, -s * 0.72, s * 0.24, s * 0.3, s * 0.06); ctx.fill();
    // 몸통
    ctx.fillStyle = "rgba(36,27,58,.18)";
    rr(-s / 2 + cs * 0.03, -s / 2 + cs * 0.06, s, s, s * 0.26); ctx.fill();
    ctx.fillStyle = "#ff5d73";
    rr(-s / 2, -s / 2, s, s, s * 0.26); ctx.fill();
    ctx.fillStyle = "#ffd23f";
    rr(-s * 0.36, s * 0.22, s * 0.72, s * 0.16, s * 0.08); ctx.fill();
    // 바퀴
    ctx.fillStyle = "#3b2d5c";
    [-0.26, 0.26].forEach(function (f) { ctx.beginPath(); ctx.arc(s * f, s * 0.5, s * 0.11, 0, Math.PI * 2); ctx.fill(); });
    // 얼굴: 가는 쪽을 바라봐요
    var ex = d[0] * s * 0.1, ey = d[1] * s * 0.08 - s * 0.06;
    ctx.fillStyle = "#fff";
    [-1, 1].forEach(function (k) { ctx.beginPath(); ctx.arc(k * s * 0.17 + ex * 0.5, ey, s * 0.12, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#241b3a";
    if (G.crashT > 0) {
      ctx.font = Math.round(s * 0.2) + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      [-1, 1].forEach(function (k) { ctx.fillText("×", k * s * 0.17 + ex * 0.5, ey); });
    } else {
      [-1, 1].forEach(function (k) { ctx.beginPath(); ctx.arc(k * s * 0.17 + ex, ey + d[1] * s * 0.03, s * 0.06, 0, Math.PI * 2); ctx.fill(); });
    }
    ctx.strokeStyle = "#241b3a"; ctx.lineWidth = Math.max(1.5, s * 0.04); ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(ex * 0.5, s * 0.06, s * 0.1, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.beginPath(); ctx.arc(-s * 0.3, s * 0.05, s * 0.06, 0, Math.PI * 2); ctx.arc(s * 0.3, s * 0.05, s * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* ---------- 구구단 놀이터에서 열었을 때 ---------- */
  if (MATH) {
    document.title = "구구단 기차";
    $(".title-card h1").textContent = "구구단 기차";
    $(".title-card .subtitle").textContent = "단의 답을 차례대로 먹고 기차를 길게! (" + ML.danText() + ")";
    var back = $(".title-card .back-link");
    back.textContent = "← 게임 고르기";
    back.addEventListener("click", function (e) { e.preventDefault(); ML.back(); });
    $("#btn-level-back").textContent = "← 게임 고르기";
    $("#hud-word").previousElementSibling.textContent = "차례";
    $("#btn-result-level").textContent = "게임 선택";
    $("#btn-again").textContent = "🔁 한 번 더 하기";
  }

  /* ---------- 키보드 · 밀기 · 방향 버튼 ---------- */
  var KEYS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right" };
  document.addEventListener("keydown", function (e) {
    if (!G.active || !KEYS[e.key]) return;
    e.preventDefault();
    input(KEYS[e.key]);
  });

  var wrap = $("#board-wrap"), sw = null;
  wrap.addEventListener("pointerdown", function (e) {
    sw = { x: e.clientX, y: e.clientY };
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener("pointermove", function (e) {
    if (!sw) return;
    var dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    input(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
    sw = { x: e.clientX, y: e.clientY };   // 손을 떼지 않고 이어서 밀어도 돼요
  });
  wrap.addEventListener("pointerup", function () { sw = null; });
  wrap.addEventListener("pointercancel", function () { sw = null; });

  Array.prototype.forEach.call(document.querySelectorAll(".dp"), function (btn) {
    btn.addEventListener("pointerdown", function (e) { e.preventDefault(); input(btn.dataset.dir); });
  });
})();
