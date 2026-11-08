/* 영어 놀이 회화: 네 게임(핑퐁 대화 · 주문 서빙 · 문장 퍼즐 조립 · 상황 해결 어드벤처)이 같이 쓰는 틀
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
  // 읽어 주고 나서 다음으로: 소리가 다 끝난 뒤(최소 minMs) cb 를 불러요. 음성이 없거나 안 끝나면 글 길이만큼 기다려요
  function speakThen(text, cb, minMs) {
    var t0 = Date.now(), done = false;
    function go() { if (done) return; done = true; var wait = Math.max(0, (minMs || 0) - (Date.now() - t0)); setTimeout(cb, wait + 250); }
    var guess = 900 + String(text || "").length * 85;   // 소리가 끝났다는 신호가 안 오면 이만큼 뒤에
    setTimeout(go, Math.max(guess, minMs || 0) + 1500);
    try {
      if (!window.speechSynthesis || !text || (window.GuideBook && GuideBook.isOpen())) { setTimeout(go, Math.max(minMs || 0, guess * 0.6)); return; }
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US"; u.rate = 0.88; u.pitch = 1.05;
      if (voice) u.voice = voice;
      u.onend = go; u.onerror = go;
      speechSynthesis.speak(u);
    } catch (e) { setTimeout(go, minMs || 900); }
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

  // ---- 🎤 말해서 대답하기: 브라우저 음성 인식으로 아이가 말한 영어를 글자로 바꿔서, 보기 중 가장 비슷한 것을 골라요 ----
  // (서버 · AI 없이 브라우저만으로 동작 — 크롬/안드로이드는 잘 되고, 안 되는 브라우저에서는 🎤 버튼이 안 보여요)
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var rec = null;
  var CONTRACT = {
    "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are", "it's": "it is", "that's": "that is",
    "what's": "what is", "where's": "where is", "how's": "how is", "let's": "let us", "don't": "do not", "doesn't": "does not",
    "didn't": "did not", "can't": "can not", "cannot": "can not", "won't": "will not", "isn't": "is not", "aren't": "are not",
    "i'll": "i will", "you'll": "you will", "i'd": "i would", "i've": "i have", "he's": "he is", "she's": "she is",
    "ok": "okay", "o.k.": "okay"
  };
  function words(s) {
    return String(s).toLowerCase().replace(/[’`]/g, "'").split(/\s+/).map(function (w) {
      w = w.replace(/^[^a-z0-9']+|[^a-z0-9'.]+$/g, "").replace(/\.$/, "");
      return CONTRACT[w] || w;
    }).join(" ").replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  }
  // 낱말이 얼마나 겹치는지 (0 ~ 1)
  function similar(a, b) {
    var x = words(a), y = words(b);
    if (!x.length || !y.length) return 0;
    var bag = {}, same = 0;
    y.forEach(function (w) { bag[w] = (bag[w] || 0) + 1; });
    x.forEach(function (w) { if (bag[w]) { bag[w]--; same++; } });
    return (2 * same) / (x.length + y.length);
  }
  // 들은 문장 후보들 중에서 보기와 가장 잘 맞는 것을 찾아요. 애매하면 -1
  function bestMatch(heard, options) {
    var scores = options.map(function (o) {
      return Math.max.apply(null, heard.map(function (h) { return similar(h, o); }));
    });
    var order = scores.map(function (s, i) { return i; }).sort(function (a, b) { return scores[b] - scores[a]; });
    var top = order[0], second = order.length > 1 ? scores[order[1]] : 0;
    if (scores[top] >= 0.5 && scores[top] - second >= 0.12) return top;
    return -1;
  }
  function stopListen() { try { if (rec) rec.abort(); } catch (e) { /* ignore */ } rec = null; G.listening = false; }

  var cfg = null, level = null, api = null;
  var G = { lives: LIVES, score: 0, combo: 0, q: 0, total: 0, playing: false, over: false, listening: false };

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
      '      <button id="btn-result-level" class="btn btn-ghost" type="button">← 난이도 고르기</button>' +
      '      <button id="btn-again" class="btn btn-primary" type="button">🔁 한 번 더 하기</button>' +
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
    stopListen();
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
    stopListen();
    G.playing = false;
    if (api && api.stop) api.stop();
    show("screen-level");
  }

  function finish(win) {
    if (G.over) return;
    G.over = true; G.playing = false;
    if (api && api.stop) api.stop();
    stopSpeak();
    stopListen();
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
    speakThen: speakThen,
    stopSpeak: stopSpeak,
    sfx: sfx,
    floatText: floatText,
    paused: function () { return !G.playing || G.over || G.listening || (window.GuideBook && GuideBook.isOpen()); },
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
    // 🎤 말해서 대답하기 버튼 — getOptions(): 지금 고를 수 있는 보기 글자들, onPick(i, 들은 말): 알아들은 보기 번호
    // 음성 인식을 못 쓰는 브라우저면 null 을 돌려줘요 (버튼을 안 붙이면 돼요)
    canListen: !!SR,
    micButton: function (getOptions, onPick, label) {
      if (!SR) return null;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "talk-mic" + (label ? " wide" : "");
      b.title = "말해서 대답하기";
      b.innerHTML = "🎤" + (label ? " <span>" + esc(label) + "</span>" : "");
      function done() { b.classList.remove("on"); G.listening = false; rec = null; }
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        if (rec) { try { rec.stop(); } catch (err) { /* ignore */ } return; }
        if (!G.playing || G.over || (window.GuideBook && GuideBook.isOpen())) return;
        var options = getOptions();
        if (!options || !options.length) { Talk.msg("🎤 대답이 나오면 말해 봐요!"); return; }
        stopSpeak();
        var r;
        try { r = new SR(); } catch (err) { return; }
        rec = r;
        r.lang = "en-US"; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
        var got = false;
        r.onresult = function (ev) {
          got = true;
          var heard = [];
          var res = ev.results[0];
          for (var i = 0; i < res.length; i++) heard.push(res[i].transcript);
          done();
          var pick = bestMatch(heard, options);
          if (pick >= 0) onPick(pick, heard[0]);
          else Talk.msg("🎤 <b>“" + esc(heard[0]) + "”</b> 라고 들렸어요. 다시 말해 볼까요?");
        };
        r.onerror = function (ev) {
          got = true;
          done();
          if (ev.error === "not-allowed" || ev.error === "service-not-allowed") Talk.msg("🎤 마이크를 쓸 수 있게 <b>허용</b>해 주세요!");
          else if (ev.error === "no-speech") Talk.msg("🎤 소리가 안 들렸어요. 🎤 를 누르고 크게 말해 봐요!");
          else if (ev.error !== "aborted") Talk.msg("🎤 잘 못 들었어요. 다시 해 볼까요?");
        };
        r.onend = function () { if (!got) { done(); Talk.msg("🎤 소리가 안 들렸어요. 🎤 를 누르고 크게 말해 봐요!"); } };
        try { r.start(); } catch (err) { done(); return; }
        G.listening = true;
        b.classList.add("on");
        Talk.msg("🎤 듣고 있어요… <b>영어로 말해 봐요!</b>");
      });
      return b;
    },
    mount: function (c) { cfg = c; build(); }
  };
  window.Talk = Talk;
})();
