(function () {
  "use strict";

  var FD = window.FindData;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var START_TIME = 120;
  var GAUGE_MAX = 150;
  var CLEAR_BONUS = 15;
  var MISS_PENALTY = 5;
  var START_HEARTS = 5;
  var START_HINTS = 3;
  var HINT_DURATION = 2600;
  var X_MARK_LIFETIME = 650;

  // ---- DOM refs ----------------------------------------------------
  var screens = {
    title: document.getElementById("screen-title"),
    howto: document.getElementById("screen-howto"),
    game: document.getElementById("screen-game"),
    result: document.getElementById("screen-result")
  };

  var hudRoundVal = document.getElementById("hud-round-val");
  var heartsRow = document.getElementById("hud-hearts-val");
  var progressVal = document.getElementById("hud-progress-val");
  var hintBtn = document.getElementById("btn-hint");
  var hintCountEl = document.getElementById("hint-count");

  var fuseBurnt = document.getElementById("fuse-burnt");
  var fuseSpark = document.getElementById("fuse-spark");
  var fuseBomb = document.getElementById("fuse-bomb");
  var fuseTime = document.getElementById("fuse-time");
  var explosionFlash = document.getElementById("explosion-flash");

  var stageEmoji = document.getElementById("stage-emoji");
  var stageName = document.getElementById("stage-name");
  var roundToast = document.getElementById("round-toast");

  var answerBtn = document.getElementById("btn-answer");
  var gateModal = document.getElementById("gate-modal");
  var gateBody = document.getElementById("gate-body");
  var gateClose = document.getElementById("gate-close");
  var answerBanner = document.getElementById("answer-banner");
  var btnHideAnswer = document.getElementById("btn-hide-answer");

  var panelLeft = document.getElementById("panel-left");
  var panelRight = document.getElementById("panel-right");
  var gLeft = document.getElementById("g-left");
  var gRight = document.getElementById("g-right");
  var overlayLeft = document.getElementById("overlay-left");
  var overlayRight = document.getElementById("overlay-right");

  function showScreen(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.toggle("active", k === name);
    });
  }

  // ---- Audio (tiny synth beeps, no assets needed) --------------------
  var audioCtx = null;
  function ac() {
    if (!audioCtx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
    }
    return audioCtx;
  }
  function beep(freq, duration, delay, type, vol) {
    try {
      var ctx = ac();
      var t0 = ctx.currentTime + (delay || 0);
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol || 0.18, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.02);
    } catch (e) { /* audio not available, ignore */ }
  }
  function playCorrect() { beep(660, 0.12, 0, "triangle", 0.16); beep(880, 0.16, 0.08, "triangle", 0.16); }
  function playWrong() { beep(260, 0.16, 0, "sawtooth", 0.1); }
  function playClear() { [523, 659, 784, 1046].forEach(function (f, i) { beep(f, 0.2, i * 0.09, "triangle", 0.16); }); }
  function playHint() { beep(880, 0.08, 0, "sine", 0.1); }
  function playBoom() { beep(90, 0.5, 0, "sawtooth", 0.22); beep(60, 0.6, 0.05, "square", 0.18); }

  // ---- Game state -----------------------------------------------------
  var state = {
    levelOrder: [],
    levelPos: 0,
    level: null,
    diffsFound: [],
    foundCount: 0,
    round: 0,
    hearts: START_HEARTS,
    hints: START_HINTS,
    hintsUsed: 0,
    totalMistakes: 0,
    timeLeft: START_TIME,
    timerHandle: null,
    locked: false,
    playing: false
  };

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function nextLevel() {
    if (!state.levelOrder.length || state.levelPos >= state.levelOrder.length) {
      state.levelOrder = shuffle(FD.LEVELS.map(function (_, i) { return i; }));
      state.levelPos = 0;
    }
    var idx = state.levelOrder[state.levelPos++];
    return FD.LEVELS[idx];
  }

  // ---- Rendering --------------------------------------------------------
  function renderLevel() {
    gLeft.innerHTML = "";
    gRight.innerHTML = "";
    overlayLeft.innerHTML = "";
    overlayRight.innerHTML = "";
    state.level.drawBase(gLeft);
    state.level.drawLeft(gLeft);
    state.level.drawBase(gRight);
    state.level.drawRight(gRight);
    stageEmoji.textContent = state.level.emoji;
    stageName.textContent = state.level.name;
  }

  function updateHearts() {
    heartsRow.innerHTML = "";
    for (var i = 0; i < START_HEARTS; i++) {
      var span = document.createElement("span");
      span.className = "heart " + (i < state.hearts ? "filled" : "empty");
      span.textContent = i < state.hearts ? "❤️" : "🤍";
      heartsRow.appendChild(span);
    }
  }
  function popLastHeart() {
    var spans = heartsRow.querySelectorAll(".heart");
    var idx = state.hearts; // the one that just became empty
    if (spans[idx]) {
      spans[idx].classList.add("lost");
      setTimeout(function () { spans[idx] && spans[idx].classList.remove("lost"); }, 400);
    }
  }

  function updateProgress() {
    var total = state.level ? state.level.diffs.length : 5;
    progressVal.textContent = state.foundCount + " / " + total;
  }

  function updateHintBtn() {
    hintCountEl.textContent = state.hints;
    hintBtn.disabled = state.hints <= 0;
  }

  function formatTime(sec) {
    sec = Math.max(0, Math.ceil(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function updateFuse() {
    var ratio = Math.max(0, Math.min(1, state.timeLeft / GAUGE_MAX));
    var burntPct = (1 - ratio) * 100;
    fuseBurnt.style.width = burntPct + "%";
    fuseSpark.style.left = burntPct + "%";
    fuseTime.textContent = formatTime(state.timeLeft);
    var danger = state.timeLeft <= 20;
    fuseBomb.classList.toggle("danger", danger);
    fuseTime.classList.toggle("danger", danger);
  }

  function addTime(delta) {
    state.timeLeft = Math.max(0, state.timeLeft + delta);
    updateFuse();
  }

  // ---- Timer ----------------------------------------------------------
  function startTimer() {
    stopTimer();
    state.timerHandle = setInterval(function () {
      state.timeLeft -= 0.1;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        updateFuse();
        triggerExplosion();
        endGame("time");
        return;
      }
      updateFuse();
    }, 100);
  }
  function stopTimer() {
    if (state.timerHandle) { clearInterval(state.timerHandle); state.timerHandle = null; }
  }

  function triggerExplosion() {
    fuseBomb.textContent = "💥";
    fuseBomb.classList.add("boom");
    explosionFlash.classList.add("show");
    playBoom();
    setTimeout(function () {
      explosionFlash.classList.remove("show");
    }, 650);
  }

  // ---- Marks -----------------------------------------------------------
  function drawCircleMark(overlay, d) {
    var r = (d.r || 34) * 0.72;
    var c = E(overlay, "circle", { cx: d.x, cy: d.y, r: r, class: "mark-circle" });
    var c2 = E(overlay, "circle", { cx: d.x + 2, cy: d.y - 1, r: r * 0.82, class: "mark-circle" });
    c2.style.opacity = "0.6";
  }
  function drawXMark(overlay, x, y) {
    var s = 16;
    var g = document.createElementNS(SVG_NS, "g");
    overlay.appendChild(g);
    E(g, "line", { x1: x - s, y1: y - s, x2: x + s, y2: y + s, class: "mark-x" });
    E(g, "line", { x1: x + s, y1: y - s, x2: x - s, y2: y + s, class: "mark-x" });
    setTimeout(function () {
      Array.prototype.forEach.call(g.querySelectorAll(".mark-x"), function (el) { el.classList.add("fading"); });
      setTimeout(function () { g.parentNode && g.parentNode.removeChild(g); }, 450);
    }, X_MARK_LIFETIME);
  }
  function drawHintMark(overlay, d) {
    var el = E(overlay, "circle", { cx: d.x, cy: d.y, r: (d.r || 34) * 0.85, class: "hint-mark" });
    setTimeout(function () { el.parentNode && el.parentNode.removeChild(el); }, HINT_DURATION);
  }
  function E(parent, tag, attrs) {
    var e = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }

  // ---- Answer gate (parental multiply-question / PIN lock) ----------------
  var PIN_KEY = "spotdiff_answer_pin";

  function getSavedPin() {
    try { return localStorage.getItem(PIN_KEY); } catch (e) { return null; }
  }
  function savePin(pin) {
    try { localStorage.setItem(PIN_KEY, pin); } catch (e) { /* ignore */ }
  }

  function openGate() {
    if (!state.playing || !state.level) return;
    gateModal.classList.add("show");
    var pin = getSavedPin();
    if (pin) renderPinEntry(pin); else renderMultiplyChallenge();
  }
  function closeGate() {
    gateModal.classList.remove("show");
    gateBody.innerHTML = "";
  }

  function digitsOnly(input, max) {
    input.addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "").slice(0, max);
    });
  }
  function onEnter(input, fn) {
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") fn(); });
  }

  function renderMultiplyChallenge() {
    var a = 2 + Math.floor(Math.random() * 8);
    var b = 2 + Math.floor(Math.random() * 8);
    gateBody.innerHTML =
      '<p class="gate-title">🔒 보호자 확인</p>' +
      '<p class="gate-desc">정답을 보려면 문제를 풀어주세요</p>' +
      '<div class="gate-problem">' + a + ' &times; ' + b + ' = ?</div>' +
      '<input type="number" id="gate-input" class="gate-input" inputmode="numeric" autocomplete="off" placeholder="정답 입력">' +
      '<p class="gate-error" id="gate-error" hidden>다시 확인해주세요!</p>' +
      '<button type="button" class="btn btn-primary gate-submit" id="gate-submit">확인</button>';
    var input = document.getElementById("gate-input");
    var errEl = document.getElementById("gate-error");
    input.focus();
    function submit() {
      if (parseInt(input.value, 10) === a * b) {
        renderSetPassword();
      } else {
        errEl.hidden = false;
        setTimeout(renderMultiplyChallenge, 900);
      }
    }
    document.getElementById("gate-submit").addEventListener("click", submit);
    onEnter(input, submit);
  }

  function renderSetPassword() {
    gateBody.innerHTML =
      '<p class="gate-title">🔑 비밀번호를 설정해주세요</p>' +
      '<p class="gate-desc">앞으로 정답을 볼 때 쓸 숫자 4자리를 정해주세요</p>' +
      '<input type="password" id="gate-pin-input" class="gate-input gate-pin-input" inputmode="numeric" autocomplete="off" placeholder="••••">' +
      '<p class="gate-error" id="gate-error" hidden>숫자 4자리를 입력해주세요</p>' +
      '<button type="button" class="btn btn-primary gate-submit" id="gate-submit">설정하고 정답 보기</button>';
    var input = document.getElementById("gate-pin-input");
    var errEl = document.getElementById("gate-error");
    digitsOnly(input, 4);
    input.focus();
    function submit() {
      var val = input.value;
      if (!/^\d{4}$/.test(val)) {
        errEl.hidden = false;
        input.value = "";
        input.focus();
        return;
      }
      savePin(val);
      closeGate();
      revealAnswer();
    }
    document.getElementById("gate-submit").addEventListener("click", submit);
    onEnter(input, submit);
  }

  function renderPinEntry(savedPin) {
    gateBody.innerHTML =
      '<p class="gate-title">🔒 비밀번호 입력</p>' +
      '<p class="gate-desc">정답을 보려면 비밀번호 4자리를 입력해주세요</p>' +
      '<input type="password" id="gate-pin-input" class="gate-input gate-pin-input" inputmode="numeric" autocomplete="off" placeholder="••••">' +
      '<p class="gate-error" id="gate-error" hidden>비밀번호가 달라요</p>' +
      '<button type="button" class="btn btn-primary gate-submit" id="gate-submit">확인</button>';
    var input = document.getElementById("gate-pin-input");
    var errEl = document.getElementById("gate-error");
    digitsOnly(input, 4);
    input.focus();
    function submit() {
      if (input.value === savedPin) {
        closeGate();
        revealAnswer();
      } else {
        errEl.hidden = false;
        input.value = "";
        input.focus();
      }
    }
    document.getElementById("gate-submit").addEventListener("click", submit);
    onEnter(input, submit);
  }

  function drawAnswerMark(overlay, d) {
    E(overlay, "circle", { cx: d.x, cy: d.y, r: (d.r || 30) * 0.9, class: "answer-mark" });
  }
  function clearAnswerMarks() {
    Array.prototype.forEach.call(document.querySelectorAll(".answer-mark"), function (el) { el.remove(); });
  }
  function revealAnswer() {
    if (!state.level) return;
    clearAnswerMarks();
    state.level.diffs.forEach(function (d) {
      drawAnswerMark(overlayLeft, d);
      drawAnswerMark(overlayRight, d);
    });
    answerBanner.classList.add("show");
  }
  function hideAnswer() {
    clearAnswerMarks();
    answerBanner.classList.remove("show");
  }

  answerBtn.addEventListener("click", openGate);
  gateClose.addEventListener("click", closeGate);
  btnHideAnswer.addEventListener("click", hideAnswer);

  // ---- Round flow -------------------------------------------------------
  function startRound() {
    state.level = nextLevel();
    state.diffsFound = state.level.diffs.map(function () { return false; });
    state.foundCount = 0;
    state.locked = false;
    hideAnswer();
    renderLevel();
    updateProgress();
    hudRoundVal.textContent = state.round + 1;
  }

  function showToast(text) {
    roundToast.textContent = text;
    roundToast.classList.add("show");
    setTimeout(function () { roundToast.classList.remove("show"); }, 1100);
  }

  function correctHit(i) {
    state.diffsFound[i] = true;
    state.foundCount++;
    var d = state.level.diffs[i];
    drawCircleMark(overlayLeft, d);
    drawCircleMark(overlayRight, d);
    playCorrect();
    updateProgress();
    if (state.foundCount === state.level.diffs.length) {
      roundClear();
    }
  }

  function wrongHit(x, y, panel) {
    state.totalMistakes++;
    state.hearts = Math.max(0, state.hearts - 1);
    updateHearts();
    popLastHeart();
    addTime(-MISS_PENALTY);
    playWrong();
    var overlay = panel === panelLeft ? overlayLeft : overlayRight;
    drawXMark(overlay, x, y);
    panel.classList.add("shake");
    setTimeout(function () { panel.classList.remove("shake"); }, 350);
    if (state.hearts <= 0) {
      endGame("hearts");
    }
  }

  function roundClear() {
    state.locked = true;
    state.round++;
    addTime(CLEAR_BONUS);
    playClear();
    showToast("🎉 정답! 모두 찾았어요! (+15초)");
    setTimeout(function () {
      if (!state.playing) return;
      startRound();
    }, 1100);
  }

  // ---- Input -------------------------------------------------------------
  function panelCoords(panel, evt) {
    var rect = panel.getBoundingClientRect();
    var clientX = evt.clientX, clientY = evt.clientY;
    var x = (clientX - rect.left) / rect.width * 480;
    var y = (clientY - rect.top) / rect.height * 480;
    return { x: x, y: y };
  }

  function onPanelDown(panel, evt) {
    if (!state.playing || state.locked) return;
    evt.preventDefault();
    var p = panelCoords(panel, evt);
    var diffs = state.level.diffs;
    var hit = -1;
    for (var i = 0; i < diffs.length; i++) {
      if (state.diffsFound[i]) continue;
      var d = diffs[i];
      var dx = p.x - d.x, dy = p.y - d.y;
      if (dx * dx + dy * dy <= d.r * d.r) { hit = i; break; }
    }
    if (hit >= 0) {
      correctHit(hit);
    } else {
      wrongHit(p.x, p.y, panel);
    }
  }

  panelLeft.addEventListener("pointerdown", function (evt) { onPanelDown(panelLeft, evt); });
  panelRight.addEventListener("pointerdown", function (evt) { onPanelDown(panelRight, evt); });

  // ---- Hint --------------------------------------------------------------
  function useHint() {
    if (!state.playing || state.locked || state.hints <= 0) return;
    var remaining = [];
    for (var i = 0; i < state.level.diffs.length; i++) if (!state.diffsFound[i]) remaining.push(i);
    if (!remaining.length) return;
    var idx = remaining[Math.floor(Math.random() * remaining.length)];
    state.hints--;
    state.hintsUsed++;
    updateHintBtn();
    playHint();
    var d = state.level.diffs[idx];
    drawHintMark(overlayLeft, d);
    drawHintMark(overlayRight, d);
  }
  hintBtn.addEventListener("click", useHint);

  // ---- Game lifecycle -----------------------------------------------------
  function newGame() {
    state.levelOrder = [];
    state.levelPos = 0;
    state.round = 0;
    state.hearts = START_HEARTS;
    state.hints = START_HINTS;
    state.hintsUsed = 0;
    state.totalMistakes = 0;
    state.timeLeft = START_TIME;
    state.locked = false;
    state.playing = true;
    fuseBomb.textContent = "💣";
    fuseBomb.classList.remove("boom", "danger");
    fuseTime.classList.remove("danger");
    updateHearts();
    updateHintBtn();
    updateFuse();
    showScreen("game");
    startRound();
    startTimer();
  }

  function starsFor(rounds) {
    if (rounds >= 8) return 5;
    if (rounds >= 6) return 4;
    if (rounds >= 4) return 3;
    if (rounds >= 2) return 2;
    return rounds >= 1 ? 1 : 0;
  }
  function starsHtml(n, total) {
    var s = "";
    for (var i = 1; i <= total; i++) s += '<span class="' + (i <= n ? "star-filled" : "star-empty") + '">' + (i <= n ? "★" : "☆") + "</span>";
    return s;
  }

  function endGame(reason) {
    if (!state.playing) return;
    state.playing = false;
    state.locked = true;
    stopTimer();
    closeGate();
    hideAnswer();
    var titleEl = document.getElementById("result-title");
    var reasonEl = document.getElementById("result-reason");
    var emojiEl = document.getElementById("result-emoji");
    if (reason === "time") {
      emojiEl.textContent = "💥";
      titleEl.textContent = "펑! 시간이 다 됐어요";
      reasonEl.textContent = "심지가 다 타버렸어요. 다음엔 더 빨리 찾아봐요!";
    } else {
      emojiEl.textContent = "💔";
      titleEl.textContent = "에너지가 다 떨어졌어요";
      reasonEl.textContent = "하트가 모두 사라졌어요. 조금 더 신중하게 찾아봐요!";
    }
    document.getElementById("result-stars").innerHTML = starsHtml(starsFor(state.round), 5);
    document.getElementById("result-rounds").textContent = state.round;
    document.getElementById("result-mistakes").textContent = state.totalMistakes;
    document.getElementById("result-hints").textContent = state.hintsUsed;
    setTimeout(function () { showScreen("result"); }, reason === "time" ? 650 : 0);
  }

  function quitGame() {
    state.playing = false;
    state.locked = true;
    stopTimer();
    closeGate();
    hideAnswer();
    showScreen("title");
  }

  // ---- Wire up UI ----------------------------------------------------
  document.getElementById("btn-start").addEventListener("click", function () { ac(); newGame(); });
  document.getElementById("btn-howto").addEventListener("click", function () { showScreen("howto"); });
  document.getElementById("btn-howto-back").addEventListener("click", function () { showScreen("title"); });
  document.getElementById("btn-quit").addEventListener("click", quitGame);
  document.getElementById("btn-retry").addEventListener("click", function () { newGame(); });
  document.getElementById("btn-to-title").addEventListener("click", function () { showScreen("title"); });

  showScreen("title");
})();
