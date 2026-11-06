// 🎈 알파벳 버블 팝: 위에 나온 알파벳(또는 단어)을 순서대로 풍선을 터뜨려 만들어요.
// 60초 안에 많이! 맞으면 +점수, 단어(묶음)를 끝내면 +3초. 순서를 틀리면 풍선이 튕겨 나가고 -3점.
// 구구단 놀이터에서 열면(?mul=1) '구구단 버블 팝': 3, 6, 9, 12 … 단의 답 풍선을 순서대로 터뜨려요.
(function () {
  "use strict";

  var ML = window.MulLink || { on: false }, MATH = ML.on;

  var $ = function (s) { return document.querySelector(s); };
  var GRADES = window.SPELL_GRADES;
  var TIME = 60;              // 한 판 시간(초)
  var PER_LETTER = 5, WORD_BONUS = 10, TIME_BONUS = 3, WRONG = 3;
  var PROFILES_KEY = "bubble_profiles", GUIDE_ID = MATH ? "bubble_mul" : "bubble";
  var COLORS = ["#ff7eb6", "#ff9f43", "#f5b400", "#34d399", "#60a5fa", "#a78bfa", "#f472b6", "#2dd4bf", "#fb7185"];
  var ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var ABC_CHUNKS = ["ABCDE", "FGHIJ", "KLMNO", "PQRST", "UVWXYZ"];

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
    pop: function (k) { tone(520 + k * 60, 0.09, "triangle", 0, 0.14); tone(1200, 0.05, "square", 0, 0.03); },
    word: function () { [659, 784, 1047].forEach(function (f, i) { tone(f, 0.14, "triangle", i * 0.08, 0.12); }); },
    wrong: function () { tone(200, 0.2, "square", 0, 0.06); tone(150, 0.25, "sine", 0.08, 0.1); },
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
  function burstAt(x, y) {
    var bits = ["✨", "⭐", "💥", "🫧", "💖"];
    for (var k = 0; k < 8; k++) {
      var p = document.createElement("div");
      p.className = "pop-bit"; p.textContent = pick(bits);
      var a = k / 8 * Math.PI * 2, d = rand(40, 80);
      p.style.left = x + "px"; p.style.top = y + "px";
      p.style.setProperty("--x", Math.cos(a) * d + "px"); p.style.setProperty("--y", Math.sin(a) * d + "px");
      p.style.setProperty("--r", rand(-180, 180) + "deg");
      document.body.appendChild(p);
      (function (el) { setTimeout(function () { el.remove(); }, 850); })(p);
    }
  }
  function confetti(n) {
    var bits = ["🎉", "🎊", "⭐", "🎈", "💖", "🌟"];
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
    if (MATH) { mode = MUL_MODE; choose(); return; }
    renderUserList(); $("#user-name-input").value = ""; show("screen-user"); });
  $("#btn-user-new").addEventListener("click", submitNewUser);
  $("#user-name-input").addEventListener("keydown", function (e) { if (e.key === "Enter") submitNewUser(); });
  $("#btn-user-guest").addEventListener("click", function () { enterAs(null); });
  $("#btn-user-back").addEventListener("click", function () { show("screen-title"); });
  $("#btn-mode-back").addEventListener("click", function () { show("screen-title"); });
  $("#btn-grade-back").addEventListener("click", function () { renderModes(); show("screen-mode"); });

  /* ---------- 놀이 고르기 ---------- */
  var MODES = [
    { id: "abc", name: "ABC 순서", emoji: "🔠", desc: "A → B → C … 대문자를 순서대로 터뜨려요", bg: "#ffe4f1", c: "#db2777" },
    { id: "abcs", name: "abc 순서", emoji: "🔡", desc: "a → b → c … 소문자를 순서대로 터뜨려요", bg: "#e1efff", c: "#1d4ed8" },
    { id: "word", name: "단어 만들기", emoji: "🐶", desc: "D → O → G 처럼 글자를 터뜨려 단어 완성 (학년별)", bg: "#ecfccb", c: "#65a30d" }
  ];
  // 구구단 버블 팝은 ABC 순서처럼 '묶음'을 차례로 해요
  var MUL_MODE = { id: "mul", name: "구구단 버블 팝", emoji: "🔢" };
  var mode = MODES[0], grade = null;
  function modeKey() { return mode.id === "word" ? "word_g" + grade.grade : mode.id; }
  function renderModes() {
    var g = $("#mode-grid"); g.innerHTML = "";
    var best = userData().best || {};
    MODES.forEach(function (m) {
      var b = document.createElement("button");
      b.className = "level-btn"; b.type = "button";
      b.style.setProperty("--bg", m.bg); b.style.setProperty("--c", m.c);
      var bestTxt = m.id === "word" ? "학년을 골라요" : (best[m.id] ? "⭐ 내 최고 " + best[m.id] + "점" : "아직 기록이 없어요");
      b.innerHTML = '<span class="lv-emoji">' + m.emoji + '</span><span class="lv-name">' + m.name + "</span>" +
        '<span class="lv-desc">' + m.desc + '</span><span class="lv-best">' + bestTxt + '</span><span class="lv-go">' + (m.id === "word" ? "학년 고르기 ▶" : "시작 ▶") + "</span>";
      b.addEventListener("click", function () {
        mode = m;
        if (m.id === "word") { renderGrades(); show("screen-grade"); }
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
      var bs = best["word_g" + gr.grade];
      b.innerHTML = '<span class="gr-emoji">' + gr.emoji + '</span><span class="gr-name">' + gr.grade + "학년</span>" +
        '<span class="gr-desc">' + (bs ? "⭐ 내 최고 " + bs + "점" : gr.desc) + "</span>";
      b.addEventListener("click", function () { grade = gr; choose(); });
      g.appendChild(b);
    });
  }

  function guide(onStart) {
    if (MATH) return {
      id: GUIDE_ID, title: "구구단 버블 팝",
      pages: [
        { icon: "🎈", title: "풍선이 둥둥", text: "숫자 풍선이 하늘에 <b>둥둥</b> 떠다녀요.<br>위에 나온 <b>몇 단</b>인지 잘 봐요!" },
        { icon: "👆", title: "작은 답부터 펑!", text: "단의 답을 <b>작은 것부터 순서대로</b> 터뜨려요.<br>예) 3단 → <b>3 → 6 → 9 → 12 → 15</b>" },
        { icon: "💫", title: "틀리면 튕겨요", text: "순서가 틀린 풍선은 <b>튕겨 나가고</b> <b>-3점</b>이에요." },
        { icon: "⏰", title: "60초 스피드!", text: "숫자 하나 <b>+5점</b>, 묶음을 다 하면 <b>+10점</b>에 <b>+3초</b>!" }
      ],
      startText: "자, 풍선을 터뜨려 볼까?", startLabel: "시작! 🎈", onStart: onStart
    };
    return {
      id: GUIDE_ID, title: "알파벳 버블 팝",
      pages: [
        { icon: "🎈", title: "풍선이 둥둥", text: "알파벳 풍선이 하늘에 <b>둥둥</b> 떠다녀요.<br>위에 나온 <b>글자</b>를 잘 봐요!" },
        { icon: "👆", title: "순서대로 펑!", text: "반짝이는 칸의 글자부터 <b>순서대로</b> 풍선을 눌러 터뜨려요.<br>예) <b>D → O → G</b> 를 터뜨리면 DOG 완성!" },
        { icon: "💫", title: "틀리면 튕겨요", text: "순서가 틀린 풍선은 <b>튕겨 나가고</b> <b>-3점</b>이에요.<br>천천히 잘 보고 눌러요." },
        { icon: "⏰", title: "60초 스피드!", text: "시간은 <b>60초</b>예요. 글자 하나 <b>+5점</b>,<br>단어를 다 만들면 <b>+10점</b>에 <b>+3초</b>가 늘어나요!" }
      ],
      startText: "자, 풍선을 터뜨려 볼까?",
      startLabel: "시작! 🎈",
      onStart: onStart
    };
  }
  // 게임 화면을 먼저 열고, 그 위에 방법 팝업을 띄워요. '확인'을 누르면 출발 (팝업이 떠 있는 동안은 멈춰 있어요)
  function choose() {
    startRound();
    GuideBook.intro(guide(null), function () { $("#btn-quit").click(); });
  }
  $("#btn-guide").addEventListener("click", function () { GuideBook.open(guide(null)); });

  /* ---------- 게임 ---------- */
  var sky = $("#sky");
  var G = {
    active: false, raf: 0, last: 0, time: TIME, score: 0, words: 0, wrongs: 0,
    target: "", idx: 0, cur: null, balloons: [], queue: [], chunk: 0, made: [], W: 0, H: 0, size: 60, cleared: false, busy: false
  };

  // 글자(또는 숫자)를 배열로
  function toks() { return Array.isArray(G.target) ? G.target.slice() : G.target.split(""); }
  // 구구단 묶음: 단마다 1~5번째 답, 6~9번째 답 (묶음이 너무 많으면 단을 몇 개만 골라요)
  function mulChunks() {
    var dans = ML.dans.slice();
    if (dans.length > 3) dans = shuffle(dans).slice(0, 3).sort(function (a, b) { return a - b; });
    var out = [];
    dans.forEach(function (d) {
      [[1, 5], [6, 9]].forEach(function (r) {
        var t = [];
        for (var k = r[0]; k <= r[1]; k++) t.push(String(d * k));
        out.push({ dan: d, from: r[0], toks: t });
      });
    });
    return out;
  }
  function chunkCount() { return MATH ? G.mchunks.length : ABC_CHUNKS.length; }
  function makeQueue() {
    if (mode.id !== "word") return [];
    // 이 학년 단어를 섞어서 차례로 (다 쓰면 다시 섞어요)
    return shuffle(grade.words.slice());
  }
  function nextTarget() {
    if (mode.id === "word") {
      if (!G.queue.length) G.queue = makeQueue();
      var w = G.queue.shift();
      G.cur = { en: w[0], emoji: w[1], ko: w[2] };
      G.target = w[0].toUpperCase();
    } else {
      if (G.chunk >= chunkCount()) { G.cleared = true; return endRound(); }
      if (MATH) {
        var mc = G.mchunks[G.chunk];
        G.target = mc.toks;
        G.cur = { en: mc.toks.join(", "), emoji: "🔢", dan: mc.dan, ko: mc.dan + "단 " + mc.dan + " × " + mc.from + " 부터 (" + (G.chunk + 1) + " / " + chunkCount() + " 묶음)" };
      } else {
        var t = ABC_CHUNKS[G.chunk];
        G.target = mode.id === "abcs" ? t.toLowerCase() : t;
        G.cur = { en: G.target, emoji: mode.id === "abcs" ? "🔡" : "🔠", ko: "알파벳 " + (G.chunk + 1) + " / " + ABC_CHUNKS.length + " 묶음" };
      }
    }
    G.idx = 0;
    renderSlots();
    $("#q-emoji").textContent = G.cur.emoji;
    $("#q-sub").textContent = mode.id === "word" ? G.cur.ko + " · " + toks().join(" → ") + " 순서로 터뜨려요" : MATH ? G.cur.ko : G.cur.ko + " · " + toks().join(" → ");
    animate($(".q-card"), "pop");
    if (mode.id === "word") speakEn(G.cur.en);
    spawnBalloons();
    G.busy = false;
  }
  function renderSlots() {
    var box = $("#q-slots"); box.innerHTML = "";
    var box2 = $("#q-slots"); box2.classList.toggle("num", MATH);
    toks().forEach(function (ch, i) {
      var s = document.createElement("div");
      s.className = "slot" + (i < G.idx ? " done" : i === G.idx ? " next" : "");
      s.textContent = ch;
      s.style.setProperty("--c", COLORS[i % COLORS.length]);
      box.appendChild(s);
    });
  }

  function measure() {
    var r = sky.getBoundingClientRect();
    G.W = r.width; G.H = r.height;
    var n = Math.max(G.balloons.length, 6);
    G.size = Math.max(52, Math.min(96, Math.sqrt(G.W * G.H / n) * 0.42));
  }
  window.addEventListener("resize", function () { if (G.active) measure(); });

  // 헷갈리는 숫자: 답 ±1, 다른 단의 답처럼 보이는 수
  function mulDecoys(letters) {
    var d = G.cur.dan, set = {};
    letters.forEach(function (t) { [+t + 1, +t - 1, +t + 2, +t + d + 1].forEach(function (v) { if (v > 0) set[v] = true; }); });
    return Object.keys(set).filter(function (v) { return letters.indexOf(v) < 0; });
  }
  function spawnBalloons() {
    G.balloons.forEach(function (b) { b.el.remove(); });
    G.balloons = [];
    var letters = toks();
    var lower = mode.id === "abcs";
    var pool = MATH ? mulDecoys(letters) : ABC.split("").filter(function (ch) { return G.target.toUpperCase().indexOf(ch) < 0; });
    // 풍선은 5~7개 정도 (단어가 길면 글자 수 + 2개)
    var total = Math.max(letters.length + 2, mode.id === "word" ? (grade.grade <= 2 ? 5 : 6) : 7);
    if (mode.id !== "word") total = Math.max(letters.length + 2, 7);
    var extra = shuffle(pool).slice(0, total - letters.length).map(function (ch) { return lower ? ch.toLowerCase() : ch; });
    var all = shuffle(letters.concat(extra));
    measure();
    var n = all.length;
    var cols = Math.ceil(Math.sqrt(n * G.W / Math.max(1, G.H)));
    var rows = Math.ceil(n / cols);
    var cells = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) cells.push([(c + 0.5) / cols, (r + 0.5) / rows]);
    shuffle(cells);
    G.size = Math.max(52, Math.min(96, Math.min(G.W / cols, G.H * 0.8 / rows) * 0.62));
    all.forEach(function (ch, i) {
      var el = document.createElement("button");
      el.type = "button"; el.className = "balloon";
      el.innerHTML = "<span>" + esc(ch) + "</span>";
      el.style.setProperty("--c", COLORS[(i * 4) % COLORS.length]);
      el.style.setProperty("--w", G.size + "px");
      if (ch.length > 1) el.style.fontSize = G.size * (ch.length > 2 ? 0.3 : 0.4) + "px";
      var cell = cells[i];
      var b = {
        ch: ch, el: el, popped: false,
        x: cell[0] * G.W, y: G.H + G.size * (1 + Math.random()), hy: cell[1] * G.H * 0.8 + G.H * 0.06,
        vx: (Math.random() - 0.5) * 50, vy: -(G.H * 1.3), rise: true, ph: Math.random() * 6, kick: 0, wrongT: 0
      };
      el.addEventListener("pointerdown", function (e) { e.preventDefault(); tap(b, e); });
      sky.appendChild(el);
      G.balloons.push(b);
    });
  }

  function tap(b, e) {
    if (!G.active || b.popped || G.busy) return;
    var need = G.target[G.idx];
    if (b.ch === need) {
      b.popped = true;
      b.el.classList.add("pop");
      (function (el) { setTimeout(function () { el.remove(); }, 300); })(b.el);
      sfx.pop(G.idx);
      burstAt(e.clientX, e.clientY);
      addScore(PER_LETTER);
      floatAt(e.clientX, e.clientY - 30, "+" + PER_LETTER, "#db2777");
      G.idx++;
      renderSlots();
      clearHint();
      if (G.idx >= G.target.length) wordDone();
      else msg("좋아요! 다음은 '" + G.target[G.idx] + "' 풍선!");
    } else {
      // 순서가 틀렸어요: 누른 곳 반대쪽으로 튕겨 나가요
      sfx.wrong();
      G.wrongs++;
      var lost = Math.min(G.score, WRONG);
      addScore(-lost);
      floatAt(e.clientX, e.clientY - 30, lost ? "-" + lost : "앗!", "#64748b");
      var r = sky.getBoundingClientRect();
      var dx = b.x - (e.clientX - r.left), dy = b.y - (e.clientY - r.top);
      var d = Math.hypot(dx, dy) || 1;
      if (d < 4) { dx = Math.random() - 0.5; dy = -1; d = Math.hypot(dx, dy); }
      b.vx = dx / d * 520 + (Math.random() - 0.5) * 200;
      b.vy = dy / d * 520 - 120;
      b.kick = 0.6; b.wrongT = 0.7;
      b.el.classList.add("wrong");
      animate(b.el, "wrong");
      msg("앗! 지금은 '" + need + "' 차례예요. 반짝이는 칸을 봐요!");
      // 두 번 틀리면 정답 풍선에 동그라미 힌트
      G.wrongStreak++;
      if (G.wrongStreak >= 2) showHint();
    }
  }
  function showHint() {
    var need = G.target[G.idx];
    var b = G.balloons.filter(function (o) { return !o.popped && o.ch === need; })[0];
    if (b) b.el.classList.add("hint");
  }
  function clearHint() {
    G.wrongStreak = 0;
    G.balloons.forEach(function (o) { o.el.classList.remove("hint"); });
  }

  function wordDone() {
    G.busy = true;
    G.words++;
    sfx.word();
    addScore(WORD_BONUS);
    G.time = Math.min(TIME + 30, G.time + TIME_BONUS);
    animate($(".time-box"), "plus");
    var qr = $(".q-card").getBoundingClientRect();
    floatAt(qr.left + qr.width / 2, qr.top + qr.height, "+" + WORD_BONUS + "점 · ⏰+" + TIME_BONUS + "초", "#16a34a");
    if (mode.id === "word") {
      G.made.push(G.cur);
      speakEn(G.cur.en);
      msg("딩동! " + G.cur.emoji + " " + G.target + " = " + G.cur.ko + " 🎉");
    } else {
      G.chunk++;
      msg(G.chunk >= chunkCount() ? (MATH ? "🎉 묶음을 다 했어요!" : "🎉 A부터 Z까지 다 했어요!") : "🎉 잘했어요! 다음 " + (MATH ? "" : "알파벳 ") + "묶음으로!");
    }
    // 남은 풍선은 하늘로 날아가요
    G.balloons.forEach(function (o) { if (!o.popped) { o.fly = true; o.vy = -G.H * 1.6; } });
    setTimeout(function () { if (G.active) nextTarget(); }, 900);
  }

  function addScore(n) {
    G.score += n;
    $("#hud-score").textContent = G.score;
    if (n > 0) animate($("#hud-score-box"), "bump");
  }
  function renderTime() {
    var t = Math.max(0, G.time);
    $("#time-text").textContent = Math.ceil(t);
    var f = $("#time-fill");
    f.style.width = Math.min(100, t / TIME * 100) + "%";
    f.classList.toggle("hurry", t <= 10);
  }

  function startRound() {
    stopRound();
    if (MATH) G.mchunks = mulChunks();
    Object.assign(G, { active: true, time: TIME, score: 0, words: 0, wrongs: 0, chunk: 0, made: [], queue: makeQueue(), cleared: false, busy: false, wrongStreak: 0 });
    $("#hud-score").textContent = "0";
    show("screen-game");
    // 구름 몇 개
    Array.prototype.forEach.call(sky.querySelectorAll(".cloud"), function (c) { c.remove(); });
    [[8, 12, 110], [60, 22, 90], [32, 6, 70]].forEach(function (c) {
      var d = document.createElement("div"); d.className = "cloud";
      d.style.left = c[0] + "%"; d.style.top = c[1] + "%"; d.style.width = c[2] + "px";
      sky.appendChild(d);
    });
    renderTime();
    nextTarget();
    msg(mode.id === "word" ? "단어 글자를 순서대로 터뜨려요! 🎈" : MATH ? "작은 답부터 순서대로 터뜨려요! 🎈" : "알파벳 순서대로 터뜨려요! 🎈");
    G.last = performance.now();
    G.raf = requestAnimationFrame(frame);
  }
  function stopRound() {
    G.active = false; cancelAnimationFrame(G.raf);
    G.balloons.forEach(function (b) { b.el.remove(); });
    G.balloons = [];
  }

  function frame(now) {
    if (!G.active) return;
    var dt = GuideBook.isOpen() ? 0 : Math.min(0.05, (now - G.last) / 1000);
    G.last = now;
    G.time -= dt;
    renderTime();
    if (G.time <= 0) { endRound(); return; }
    var W = G.W, H = G.H, R = G.size * 0.55, t = now / 1000;
    G.balloons.forEach(function (b) {
      if (b.popped) return;
      if (b.fly) {
        b.y += b.vy * dt;
      } else if (b.rise) {
        // 아래에서 둥실 떠올라요
        b.y += (b.hy - b.y) * Math.min(1, dt * 4);
        if (Math.abs(b.y - b.hy) < 4) { b.rise = false; b.vy = (Math.random() - 0.5) * 40; }
      } else {
        if (b.kick > 0) {
          b.kick -= dt;
          b.vx *= Math.pow(0.08, dt); b.vy *= Math.pow(0.08, dt);
        } else {
          // 천천히 둥둥: 원래 속도로 돌아가요
          var sp = 28 + (mode.id === "word" ? 0 : 6);
          var cur = Math.hypot(b.vx, b.vy) || 1;
          var k = Math.min(1, dt * 1.5);
          if (cur < sp) { b.vx += (b.vx / cur) * (sp - cur) * k; b.vy += (b.vy / cur) * (sp - cur) * k; }
          else { b.vx *= 1 - k * 0.5; b.vy *= 1 - k * 0.5; }
        }
        b.x += b.vx * dt; b.y += b.vy * dt;
        var top = R * 1.1, bottom = H * 0.86 - R * 0.6;
        if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); }
        if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx); }
        if (b.y < top) { b.y = top; b.vy = Math.abs(b.vy); }
        if (b.y > bottom) { b.y = bottom; b.vy = -Math.abs(b.vy); }
      }
      if (b.wrongT > 0 && (b.wrongT -= dt) <= 0) b.el.classList.remove("wrong");
    });
    // 풍선끼리 겹치지 않게 살짝 밀어요
    var live = G.balloons.filter(function (b) { return !b.popped && !b.rise && !b.fly; });
    for (var i = 0; i < live.length; i++) for (var j = i + 1; j < live.length; j++) {
      var a = live[i], c = live[j], dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy) || 1, min = G.size * 1.05;
      if (d < min) {
        var push = (min - d) / 2, nx = dx / d, ny = dy / d;
        a.x -= nx * push; a.y -= ny * push; c.x += nx * push; c.y += ny * push;
      }
    }
    G.balloons.forEach(function (b) {
      if (b.popped) return;
      var bob = Math.sin(t * 2 + b.ph) * 5, rot = Math.sin(t * 1.6 + b.ph) * 4;
      b.el.style.transform = "translate(" + b.x.toFixed(1) + "px," + (b.y + bob).toFixed(1) + "px) rotate(" + rot.toFixed(1) + "deg)";
    });
    G.raf = requestAnimationFrame(frame);
  }

  /* ---------- 끝 ---------- */
  function endRound() {
    var cleared = G.cleared, timeLeft = Math.max(0, Math.ceil(G.time));
    if (cleared && timeLeft) addScore(timeLeft * 2);
    stopRound();
    var n = G.words;
    var stars = mode.id === "word" ? (n >= 10 ? 3 : n >= 6 ? 2 : n >= 3 ? 1 : 0) : (cleared ? (G.wrongs <= 2 ? 3 : 2) : (G.chunk >= 3 ? 1 : 0));
    if (cleared || stars) { sfx.win(); if (stars >= 2) confetti(26); }
    $("#result-title").textContent = cleared ? (MATH ? "묶음을 다 터뜨렸어요! 🏆" : "A부터 Z까지 완성! 🏆") : stars === 3 ? "완벽해요! 🏆" : stars === 2 ? "아주 잘했어요! 🎉" : stars === 1 ? "잘했어요! 💪" : "시간이 다 됐어요! 다시 도전! 💪";
    $("#result-stars").innerHTML = [1, 2, 3].map(function (k) { return '<span class="' + (k <= stars ? "" : "dim") + '">⭐</span>'; }).join("");
    var isRecord;
    if (MATH) isRecord = ML.saveBest("bubble", G.score).isRecord;
    else {
      var data = userData(); data.best = data.best || {};
      var key = modeKey(), best = data.best[key] || 0;
      isRecord = G.score > best;
      if (isRecord) data.best[key] = G.score;
      saveUserData(data);
    }
    var label = MATH ? esc(ML.danText()) : mode.id === "word" ? grade.grade + "학년 " + mode.name : mode.name;
    var line = mode.id === "word" ? "만든 단어 <b>" + n + "</b>개" : "끝낸 묶음 <b>" + G.chunk + "</b> / " + chunkCount() + (cleared ? " · 남은 시간 " + timeLeft + "초 × 2점 보너스" : "");
    $("#result-text").innerHTML = mode.emoji + " " + label + " · " + line + "<br>" +
      "점수 <b>" + G.score + "</b>점" + (isRecord && G.score > 0 ? '<span class="record">🎊 최고 기록!</span>' : "");
    var wb = $("#result-words"); wb.innerHTML = "";
    G.made.forEach(function (w) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "word-chip";
      b.innerHTML = esc(w.emoji + " " + w.en) + "<small>" + esc(w.ko) + "</small>";
      b.title = "눌러서 듣기";
      b.addEventListener("click", function () { speakEn(w.en); });
      wb.appendChild(b);
    });
    show("screen-result");
  }
  $("#btn-again").addEventListener("click", choose);
  $("#btn-result-mode").addEventListener("click", function () { if (MATH) { ML.back(); return; } renderModes(); show("screen-mode"); });
  $("#btn-quit").addEventListener("click", function () { stopRound(); if (MATH) { ML.back(); return; } renderModes(); show("screen-mode"); });
  $("#btn-say").addEventListener("click", function () {
    if (!G.cur) return;
    speakEn(mode.id === "word" ? G.cur.en : toks().join(", "));
  });

  /* ---------- 구구단 놀이터에서 열었을 때 ---------- */
  if (MATH) {
    document.title = "구구단 버블 팝";
    $(".title-card h1").textContent = "구구단 버블 팝";
    $(".title-card .subtitle").textContent = "단의 답 풍선을 작은 것부터 펑펑! (" + ML.danText() + ")";
    var back = $(".title-card .back-link");
    back.textContent = "← 게임 고르기";
    back.addEventListener("click", function (e) { e.preventDefault(); ML.back(); });
    $("#btn-result-mode").textContent = "게임 고르기";
  }
})();
