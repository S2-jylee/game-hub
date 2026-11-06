/* 영어 놀이 회화: 네 게임(핑퐁 대화 · 주문 서빙 · 문장 퍼즐 달리기 · 상황 해결 어드벤처)이 같이 쓰는 틀
   - 난이도 고르기 화면 · 게임 화면(위쪽 정보줄: ← 나가기 · 하트 · 문제 · 점수) · 결과 화면을 만들어요
   - 방법 팝업은 ../spelling/guidebook.js (확인을 누를 때까지 게임은 멈춰 있어요)
   - 회화 게임은 듣기가 중요해서 음성(영어 읽어주기)을 켜 둬요 (<html data-tts> · shared/game-title.js 가 끄지 않아요) */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var LIVES = 5;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---- 음성: 영어 문장을 읽어줘요 ----
  var voice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    var vs = speechSynthesis.getVoices();
    voice = vs.filter(function (v) { return /^en[-_]US/i.test(v.lang); })[0] || vs.filter(function (v) { return /^en/i.test(v.lang); })[0] || null;
  }
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text) {
    try {
      if (!window.speechSynthesis || !text) return;
      if (window.GuideBook && GuideBook.isOpen()) return;
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US"; u.rate = 0.88; u.pitch = 1.05;
      if (voice) u.voice = voice;
      speechSynthesis.speak(u);
    } catch (e) { /* 음성을 못 쓰는 브라우저 */ }
  }
  function stopSpeak() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* ignore */ } }

  // ---- 소리 효과 ----
  var actx = null;
  function beep(freqs, dur, type) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime;
      freqs.forEach(function (f, i) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = type || "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + i * dur);
        g.gain.exponentialRampToValueAtTime(0.18, t + i * dur + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (i + 1) * dur);
        o.connect(g); g.connect(actx.destination);
        o.start(t + i * dur); o.stop(t + (i + 1) * dur + 0.02);
      });
    } catch (e) { /* 소리를 못 쓰는 브라우저 */ }
  }
  var sfx = {
    good: function () { beep([660, 880], 0.09); },
    bad: function () { beep([220, 170], 0.13, "triangle"); },
    coin: function () { beep([988, 1319], 0.07, "square"); },
    win: function () { beep([523, 659, 784, 1047], 0.12); }
  };

  var cfg = null, level = null, api = null;
  var G = { lives: LIVES, score: 0, combo: 0, q: 0, total: 0, playing: false, over: false };

  function show(id) {
    Array.prototype.forEach.call(document.querySelectorAll(".screen"), function (s) { s.classList.toggle("active", s.id === id); });
  }

  function build() {
    var root = document.createElement("div");
    root.innerHTML =
      '<section id="screen-level" class="screen active">' +
      '  <h1 class="game-title">' + esc(cfg.title) + "</h1>" +
      '  <div class="card card-wide en-main">' +
      '    <div id="level-grid" class="level-grid"></div>' +
      '    <div class="row-buttons"><a class="btn btn-ghost back-link" href="index.html">← 영어 놀이 회화</a></div>' +
      "  </div>" +
      "</section>" +
      '<section id="screen-game" class="screen">' +
      '  <header class="hud">' +
      '    <button id="btn-quit" class="btn btn-ghost btn-small" type="button">← 나가기</button>' +
      '    <div id="hearts" class="hearts"></div>' +
      '    <div class="hud-item"><span class="hud-label">' + esc(cfg.unit || "문제") + '</span><span id="hud-q" class="hud-value">1 / 10</span></div>' +
      '    <div id="hud-score-box" class="hud-item hud-score"><span class="hud-label">점수</span><span id="hud-score" class="hud-value">0</span></div>' +
      "  </header>" +
      '  <div id="talk-stage" class="talk-stage"></div>' +
      "</section>" +
      '<section id="screen-result" class="screen">' +
      '  <div class="card">' +
      '    <h2 id="result-title"></h2>' +
      '    <div id="result-stars" class="result-stars"></div>' +
      '    <div id="result-text" class="result-text"></div>' +
      '    <div class="row-buttons">' +
      '      <button id="btn-again" class="btn btn-primary" type="button">🔁 다시 하기</button>' +
      '      <button id="btn-result-level" class="btn btn-ghost" type="button">← 난이도 고르기</button>' +
      "    </div>" +
      "  </div>" +
      "</section>";
    while (root.firstChild) document.body.insertBefore(root.firstChild, document.body.querySelector("script"));

    var grid = $("#level-grid");
    cfg.levels.forEach(function (lv) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "level-btn";
      b.style.setProperty("--bg", lv.bg);
      b.style.setProperty("--c", lv.c);
      b.innerHTML = '<span class="lv-emoji">' + lv.emoji + '</span><span class="lv-name">' + esc(lv.name) + "</span>" +
        '<span class="lv-desc">' + esc(lv.desc) + '</span><span class="lv-go">' + esc(cfg.goLabel || "시작 ▶") + "</span>";
      b.addEventListener("click", function () { start(lv); });
      grid.appendChild(b);
    });
    $("#btn-quit").addEventListener("click", quit);
    $("#btn-again").addEventListener("click", function () { start(level); });
    $("#btn-result-level").addEventListener("click", function () { show("screen-level"); });
  }

  function renderHearts(justLost) {
    var h = "";
    for (var k = 0; k < LIVES; k++) {
      if (k < G.lives) h += "<span>❤️</span>";
      else h += '<span class="' + (justLost && k === G.lives ? "lost" : "") + '" style="opacity:.45">🤍</span>';
    }
    $("#hearts").innerHTML = h;
  }
  function renderHud() {
    $("#hud-q").textContent = Math.min(G.q + 1, G.total) + " / " + G.total;
    $("#hud-score").textContent = G.score;
  }

  function start(lv) {
    level = lv;
    stopSpeak();
    if (api && api.stop) api.stop();
    Object.assign(G, { lives: LIVES, score: 0, combo: 0, q: 0, total: cfg.total || 10, playing: false, over: false });
    var stage = $("#talk-stage");
    stage.innerHTML = "";
    stage.className = "talk-stage " + (cfg.stageClass || "");
    show("screen-game");
    renderHearts();
    api = cfg.create(stage, lv, Talk) || {};
    renderHud();
    GuideBook.intro({
      id: cfg.id, title: cfg.title, pages: cfg.guide(lv), startLabel: cfg.startLabel || "시작! 🚀",
      onStart: function () { G.playing = true; if (api.begin) api.begin(); }
    }, function () { quit(); });
  }

  function quit() {
    stopSpeak();
    G.playing = false;
    if (api && api.stop) api.stop();
    show("screen-level");
  }

  function finish(win) {
    if (G.over) return;
    G.over = true; G.playing = false;
    if (api && api.stop) api.stop();
    stopSpeak();
    var stars = !win ? 0 : G.lives >= 5 ? 3 : G.lives >= 3 ? 2 : 1;
    $("#result-title").textContent = win ? (stars === 3 ? "완벽해요! 🏆" : stars === 2 ? "아주 잘했어요! 🎉" : "잘했어요! 💪") : "하트를 다 썼어요! 다시 도전! 💪";
    var s = "";
    for (var i = 0; i < 3; i++) s += i < stars ? "⭐" : '<span class="dim">⭐</span>';
    $("#result-stars").innerHTML = s;
    $("#result-text").innerHTML = "점수 <b>" + G.score + "</b>점" + (win ? "<br>남은 하트 " + G.lives + "개" : "");
    if (win) { sfx.win(); confetti(); }
    setTimeout(function () { show("screen-result"); }, win ? 500 : 300);
  }

  function floatText(text, x, y, color) {
    var f = document.createElement("div");
    f.className = "float-text";
    f.textContent = text;
    f.style.left = x + "px"; f.style.top = y + "px";
    if (color) f.style.color = color;
    document.body.appendChild(f);
    setTimeout(function () { f.remove(); }, 1000);
  }
  function confetti() {
    var em = ["🎉", "⭐", "💖", "🎈", "✨"];
    for (var i = 0; i < 18; i++) {
      var c = document.createElement("div");
      c.className = "confetti";
      c.textContent = em[i % em.length];
      c.style.left = Math.random() * 100 + "vw";
      c.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
      document.body.appendChild(c);
      (function (el) { setTimeout(function () { el.remove(); }, 3200); })(c);
    }
  }

  var Talk = {
    G: G,
    $: $,
    esc: esc,
    shuffle: shuffle,
    speak: speak,
    stopSpeak: stopSpeak,
    sfx: sfx,
    floatText: floatText,
    paused: function () { return !G.playing || G.over || (window.GuideBook && GuideBook.isOpen()); },
    // 맞혔을 때: 점수 + 연속 보너스
    good: function (x, y, base) {
      G.combo++;
      var add = (base || 10) + Math.min(G.combo - 1, 5) * 2;
      G.score += add;
      sfx.good();
      if (x != null) floatText("+" + add, x, y);
      var box = $("#hud-score-box"); box.classList.remove("bump"); void box.offsetWidth; box.classList.add("bump");
      renderHud();
    },
    // 틀렸을 때: 하트 하나 줄고, 다 쓰면 끝
    bad: function () {
      G.combo = 0;
      G.lives--;
      sfx.bad();
      renderHearts(true);
      if (G.lives <= 0) { finish(false); return false; }
      return true;
    },
    next: function () { G.q++; if (G.q >= G.total) { finish(true); return false; } renderHud(); return true; },
    setTotal: function (n) { G.total = n; renderHud(); },
    finish: finish,
    // 게임 위쪽 안내 한 줄
    msg: function (html) { var m = $("#talk-msg"); if (m) m.innerHTML = html; },
    // 회화 문장을 읽어주는 🔊 버튼
    sayButton: function (getText) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "talk-say";
      b.title = "다시 듣기";
      b.textContent = "🔊";
      b.addEventListener("click", function (e) { e.stopPropagation(); speak(getText()); });
      return b;
    },
    mount: function (c) { cfg = c; build(); }
  };
  window.Talk = Talk;
})();
