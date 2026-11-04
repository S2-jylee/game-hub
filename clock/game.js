(function () {
  "use strict";

  var CD = window.ClockData;
  var PROFILES_KEY = "clock_profiles_v1";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var CX = 150, CY = 150;
  var MAX_SET_TRIES = 3;   // 바늘 맞추기에서 이만큼 틀리면 정답을 보여주고 넘어가요

  // ---- DOM refs ----------------------------------------------------
  var screens = {
    title: document.getElementById("screen-title"),
    user: document.getElementById("screen-user"),
    howto: document.getElementById("screen-howto"),
    mode: document.getElementById("screen-mode"),
    book: document.getElementById("screen-book"),
    levelselect: document.getElementById("screen-levelselect"),
    game: document.getElementById("screen-game"),
    result: document.getElementById("screen-result")
  };
  var userListEl = document.getElementById("user-list");
  var userNameInput = document.getElementById("user-name-input");
  var modeGrid = document.getElementById("mode-grid");
  var levelSelectTitle = document.getElementById("levelselect-title");
  var hudStageVal = document.getElementById("hud-stage-val");
  var hudThemeVal = document.getElementById("hud-theme-val");
  var hudQVal = document.getElementById("hud-q-val");
  var hudTimerVal = document.getElementById("hud-timer-val");
  var hudScoreVal = document.getElementById("hud-score-val");
  var progressFill = document.getElementById("stage-progress-fill");
  var levelGrid = document.getElementById("level-grid");

  var clockSvg = document.getElementById("clock");
  var clockBox = document.getElementById("clock-box");
  var ampmBadge = document.getElementById("ampm-badge");
  var qBuddy = document.getElementById("q-buddy");
  var qText = document.getElementById("q-text");
  var choiceGrid = document.getElementById("choice-grid");
  var setPanel = document.getElementById("set-panel");
  var checkBtn = document.getElementById("btn-check");
  var feedbackEl = document.getElementById("feedback");

  var completionModal = document.getElementById("completion-modal");
  var completionStarsEl = document.getElementById("completion-stars");
  var completionPercentEl = document.getElementById("completion-percent");
  var completionDetailEl = document.getElementById("completion-detail");
  var completionScoreEl = document.getElementById("completion-score");

  var rankingModal = document.getElementById("ranking-modal");
  var rankingStageLabel = document.getElementById("ranking-stage-label");
  var rankingList = document.getElementById("ranking-list");

  function showScreen(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.toggle("active", k === name);
    });
  }

  function goToModeSelect() {
    buildModeGrid();
    showScreen("mode");
  }
  function goToLevelSelect() {
    buildLevelGrid();
    showScreen("levelselect");
  }

  // ---- User profiles (this device only, via localStorage) --------------
  var currentUser = null;
  var guestMode = false;
  var guestStars = {};

  function loadProfiles() {
    try { return JSON.parse(localStorage.getItem(PROFILES_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveProfiles(profiles) {
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); } catch (e) { /* storage unavailable, ignore */ }
  }
  function ensureProfile(name) {
    var profiles = loadProfiles();
    if (!profiles[name]) {
      profiles[name] = { stars: {} };
      saveProfiles(profiles);
    }
  }
  function totalStarsFor(profile) {
    var stars = (profile && profile.stars) || {};
    return Object.keys(stars).reduce(function (sum, k) { return sum + stars[k]; }, 0);
  }
  function updateUserBadge() {
    var text = guestMode ? "게스트" : (currentUser || "");
    Array.prototype.forEach.call(document.querySelectorAll(".current-user-badge"), function (el) {
      el.textContent = text;
    });
  }
  function buildUserList() {
    userListEl.innerHTML = "";
    var profiles = loadProfiles();
    var names = Object.keys(profiles);
    if (names.length === 0) {
      var hint = document.createElement("div");
      hint.className = "user-empty-hint";
      hint.textContent = "저장된 사용자가 없어요. 새 이름으로 시작해보세요!";
      userListEl.appendChild(hint);
      return;
    }
    names.forEach(function (name) {
      var btn = document.createElement("button");
      btn.className = "user-item-btn";
      var nameSpan = document.createElement("span");
      nameSpan.textContent = name;
      var starsSpan = document.createElement("span");
      starsSpan.className = "user-item-stars";
      starsSpan.textContent = "★ " + totalStarsFor(profiles[name]);
      btn.appendChild(nameSpan);
      btn.appendChild(starsSpan);
      btn.addEventListener("click", function () {
        currentUser = name;
        guestMode = false;
        updateUserBadge();
        goToModeSelect();
      });
      userListEl.appendChild(btn);
    });
  }

  // ---- Star storage (scoped to the active user) -------------------------
  function loadStars() {
    if (guestMode) return guestStars;
    if (!currentUser) return {};
    var profiles = loadProfiles();
    return (profiles[currentUser] && profiles[currentUser].stars) || {};
  }
  function saveStars(map) {
    if (guestMode) { guestStars = map; return; }
    if (!currentUser) return;
    var profiles = loadProfiles();
    profiles[currentUser] = profiles[currentUser] || { stars: {} };
    profiles[currentUser].stars = map;
    saveProfiles(profiles);
  }
  function recordStars(levelId, stars) {
    var map = loadStars();
    if (!map[levelId] || map[levelId] < stars) {
      map[levelId] = stars;
      saveStars(map);
    }
    return map[levelId];
  }

  // ---- Local ranking (this device only) ----------------------------------
  function recordTime(levelId, elapsed) {
    if (guestMode || !currentUser) return;
    var profiles = loadProfiles();
    var profile = profiles[currentUser] = profiles[currentUser] || { stars: {} };
    profile.times = profile.times || {};
    var prev = profile.times[levelId];
    if (prev == null || elapsed < prev) {
      profile.times[levelId] = elapsed;
      saveProfiles(profiles);
    }
  }
  function localRanking(levelId, limit) {
    var profiles = loadProfiles();
    var rows = [];
    Object.keys(profiles).forEach(function (name) {
      var t = profiles[name] && profiles[name].times && profiles[name].times[levelId];
      if (t != null) rows.push({ player_name: name, elapsed_seconds: t });
    });
    rows.sort(function (a, b) { return a.elapsed_seconds - b.elapsed_seconds; });
    return rows.slice(0, limit || 5);
  }
  function starsGlyph(n, total) {
    var s = "";
    for (var i = 1; i <= total; i++) s += (i <= n ? "★" : "☆");
    return s;
  }
  function starsHtml(n, total) {
    var s = "";
    for (var i = 1; i <= total; i++) {
      s += '<span class="' + (i <= n ? "star-filled" : "star-empty") + '">' + (i <= n ? "★" : "☆") + "</span>";
    }
    return s;
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
  function playClear() {
    [523, 659, 784, 1046].forEach(function (f, i) { beep(f, 0.22, i * 0.09, "triangle", 0.16); });
  }
  function playClick() { beep(520, 0.06, 0, "square", 0.06); }
  function playTick() { beep(1250, 0.03, 0, "square", 0.025); }
  function playMatch() { beep(660, 0.12, 0, "triangle", 0.14); beep(880, 0.16, 0.08, "triangle", 0.14); }
  function playMiss() { beep(260, 0.14, 0, "sawtooth", 0.09); }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      if (!text) return;
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "ko-KR"; u.rate = 0.95; u.pitch = 1.2;
      speechSynthesis.speak(u);
    } catch (e) { /* speech not available, ignore */ }
  }

  // ---- Time helpers ---------------------------------------------------
  // 시계 시각 {h: 1~12, m}은 12시부터 지난 분(0~719)으로 계산해요.
  // 24시간 시각은 시(H, 1~23)와 분(m)을 따로 다루고, 0시는 쓰지 않아요.
  function toTotal(h, m) { return (((h % 12) * 60 + m) % 720 + 720) % 720; }
  function fromTotal(total) {
    total = ((total % 720) + 720) % 720;
    return { h: Math.floor(total / 60) || 12, m: total % 60 };
  }
  function shift(t, minutes) { return fromTotal(toTotal(t.h, t.m) + minutes); }
  function sameTime(a, b) { return toTotal(a.h, a.m) === toTotal(b.h, b.m); }
  function fmt(t) { return t.m === 0 ? t.h + "시" : t.h + "시 " + t.m + "분"; }
  function fmt24(H, m) { return m === 0 ? H + "시" : H + "시 " + m + "분"; }
  function isPm(H) { return H >= 12; }
  function to12(H, m) { return { h: H % 12 || 12, m: m }; }
  function ampmText(H) { return isPm(H) ? (H >= 18 ? "🌙" : "🌤️") + " 오후 (PM)" : "☀️ 오전 (AM)"; }
  function fmtAmPm(H, m) { return (isPm(H) ? "오후 " : "오전 ") + fmt(to12(H, m)); }

  var HOUR_KO = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열", "열한", "열두"];
  var DIGIT_KO = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
  function sinoKo(n) {
    var tens = Math.floor(n / 10), ones = n % 10;
    return (tens ? (tens > 1 ? DIGIT_KO[tens] : "") + "십" : "") + DIGIT_KO[ones];
  }
  function minKo(m) { return m ? " " + sinoKo(m) + " 분" : ""; }
  function speakTime(t) { return HOUR_KO[t.h] + " 시" + minKo(t.m); }
  function speak24(H, m) { return (H <= 12 ? HOUR_KO[H] : sinoKo(H)) + " 시" + minKo(m); }
  function speakAmPm(H, m) { return (isPm(H) ? "오후 " : "오전 ") + speakTime(to12(H, m)); }
  function durationText(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return (h ? h + "시간" : "") + (h && m ? " " : "") + (m ? m + "분" : "");
  }
  function durationKo(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return (h ? HOUR_KO[h] + " 시간" : "") + (h && m ? " " : "") + (m ? sinoKo(m) + " 분" : "");
  }
  // "…시"로 끝나면 받침이 없고, "…분"으로 끝나면 받침이 있어요
  function eul(m) { return m === 0 ? "를" : "을"; }
  function eun(m) { return m === 0 ? "는" : "은"; }
  function ieyo(m) { return m === 0 ? "예요" : "이에요"; }
  // 숫자 1~12를 읽을 때 받침이 있는지 (일, 삼, 육, 칠, 팔, 십, 십일)
  var NUM_BATCHIM = { 1: true, 3: true, 6: true, 7: true, 8: true, 10: true, 11: true };
  function numEul(n) { return n + (NUM_BATCHIM[n] ? "을" : "를"); }
  function numGwa(n) { return n + (NUM_BATCHIM[n] ? "과" : "와"); }

  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pickOne(arr) { return arr[randInt(0, arr.length - 1)]; }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }
  function randomMinute(step) { return step >= 60 ? 0 : randInt(0, 60 / step - 1) * step; }
  function randomTime(step, onlyHalf) {
    return { h: randInt(1, 12), m: onlyHalf ? 30 : randomMinute(step) };
  }

  // ---- Clock drawing ----------------------------------------------------
  var hands = { hour: null, minute: null };

  function svgEl(tag, attrs, parent) {
    var e = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  }
  function polar(deg, r) {
    var rad = (deg - 90) * Math.PI / 180;
    return { x: CX + Math.cos(rad) * r, y: CY + Math.sin(rad) * r };
  }

  function buildClock() {
    clockSvg.innerHTML = "";
    clockSvg.setAttribute("viewBox", "-26 -26 352 352");
    var defs = svgEl("defs", {}, clockSvg);
    var grad = svgEl("linearGradient", { id: "ring-grad", x1: "0", y1: "0", x2: "1", y2: "1" }, defs);
    svgEl("stop", { offset: "0", "stop-color": "#d81b7a" }, grad);
    svgEl("stop", { offset: "1", "stop-color": "#7c2ce0" }, grad);

    svgEl("circle", { cx: CX, cy: CY, r: 142, fill: "#ffffff", stroke: "url(#ring-grad)", "stroke-width": 10 }, clockSvg);

    var minuteLabels = svgEl("g", { "class": "minute-labels" }, clockSvg);
    for (var i = 0; i < 60; i++) {
      var big = i % 5 === 0;
      var a = polar(i * 6, 131), b = polar(i * 6, big ? 117 : 124);
      svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, "class": "tick" + (big ? " big" : "") }, clockSvg);
      if (big) {
        var lp = polar(i * 6, 162);
        var lbl = svgEl("text", { x: lp.x, y: lp.y, "text-anchor": "middle", "dominant-baseline": "central", "class": "clock-min-num" }, minuteLabels);
        lbl.textContent = (i === 0 ? 60 : i) + "분";
      }
    }
    for (var n = 1; n <= 12; n++) {
      var p = polar(n * 30, 98);
      var t = svgEl("text", { x: p.x, y: p.y, "text-anchor": "middle", "dominant-baseline": "central", "class": "clock-num" }, clockSvg);
      t.textContent = n;
    }

    hands.hour = makeHand("hour", 62);
    hands.minute = makeHand("minute", 104);
    svgEl("circle", { cx: CX, cy: CY, r: 10, fill: "#241b3a" }, clockSvg);
    svgEl("circle", { cx: CX, cy: CY, r: 4, fill: "#ffffff" }, clockSvg);
  }

  function makeHand(kind, len) {
    var g = svgEl("g", { "class": "hand-g hand-g-" + kind, "data-hand": kind }, clockSvg);
    svgEl("line", { x1: CX, y1: CY + 14, x2: CX, y2: CY - len, "class": "hand-hit" }, g);
    svgEl("line", { x1: CX, y1: CY + 14, x2: CX, y2: CY - len, "class": "hand hand-" + kind }, g);
    return g;
  }

  // 바늘이 한 바퀴를 넘어갈 때 거꾸로 휙 돌지 않도록 누적 각도로 돌려요
  var handDeg = { hour: 0, minute: 0 };
  function rotateHand(kind, deg) {
    var prev = handDeg[kind];
    var diff = ((deg - prev) % 360 + 540) % 360 - 180;
    handDeg[kind] = prev + diff;
    hands[kind].style.transform = "rotate(" + handDeg[kind] + "deg)";
  }
  function showTimeOnClock(t, instant) {
    clockSvg.classList.toggle("no-anim", !!instant);
    rotateHand("hour", toTotal(t.h, t.m) * 0.5);
    rotateHand("minute", t.m * 6);
    if (instant) { void clockSvg.getBoundingClientRect(); clockSvg.classList.remove("no-anim"); }
  }
  function setMinuteLabels(on) {
    clockSvg.querySelector(".minute-labels").style.display = on ? "" : "none";
  }

  // ---- Game state -----------------------------------------------------
  var state = {
    catIndex: 0,
    levelIndex: 0,
    totalScore: 0,
    results: [],      // {name, elapsed, gain, stars, percent}
    questions: [],
    qIndex: 0,
    cur: null,
    missedThis: false,
    setTries: 0,
    firstTry: 0,
    lock: false,
    setTime: null,    // 바늘 맞추기: 지금 바늘이 가리키는 시각
    stageStartTime: 0,
    timerHandle: null,
    guideRead: {},    // 이번에 원리 책을 다 읽은 놀이 (다시 들어오면 바로 문제부터)
    token: 0          // 나가거나 다시 시작하면 바뀌어서, 기다리던 다음 문제 예약을 무효로 만들어요
  };

  function currentCat() { return CD.CATEGORIES[state.catIndex]; }
  function currentLevel() { return currentCat().stages[state.levelIndex]; }
  function stageName(cat, stage) { return cat.name + " " + stage.n + "단계"; }

  // ---- Choices ------------------------------------------------------------
  // 정답과 헷갈리기 쉬운 보기(앞쪽 3개 중에서 먼저)를 고르고, 모자라면 filler로 채워요
  function pickChoices(correct, cands, filler, count) {
    var picked = [correct], seen = {};
    seen[correct] = true;
    function add(label) {
      if (picked.length >= count || !label || seen[label]) return;
      seen[label] = true;
      picked.push(label);
    }
    shuffle(cands.slice(0, 3)).forEach(add);
    shuffle(cands.slice(3)).forEach(add);
    var guard = 0;
    while (picked.length < count && guard++ < 200) add(filler());
    return shuffle(picked);
  }

  // 시계 보고 고르기: 아이들이 자주 하는 실수로 보기를 만들어요
  function readCandidates(ans, step, onlyHalf) {
    var h = ans.h, m = ans.m, list;
    if (step >= 60) {
      list = [shift(ans, 60), shift(ans, -60), shift(ans, 120), shift(ans, -120), shift(ans, 360)];
    } else if (step === 30) {
      list = m === 30
        ? [shift(ans, 60), { h: h, m: 0 }, shift(ans, 30), shift(ans, -60), shift(ans, 90)]   // 30분을 다음 시로 읽는 실수
        : [{ h: h, m: 30 }, shift(ans, -30), shift(ans, 60), shift(ans, -60), shift(ans, 90)];
      if (onlyHalf) list = [shift(ans, 60), shift(ans, -60), shift(ans, 120), shift(ans, -120)];
    } else {
      var minuteNum = Math.round(m / 5) || 12;
      list = [
        m >= 30 ? shift(ans, 60) : shift(ans, -60),   // 짧은바늘을 다음/앞 숫자로 읽는 실수
        { h: minuteNum, m: (h % 12) * 5 },             // 긴바늘·짧은바늘을 바꿔 읽는 실수
        shift(ans, step === 1 ? 1 : 5),
        shift(ans, step === 1 ? -1 : -5),
        shift(ans, step === 1 ? 5 : 10),
        m >= 30 ? shift(ans, -60) : shift(ans, 60)
      ];
    }
    return list.filter(function (t) { return t.m % step === 0 && (!onlyHalf || t.m === 30); }).map(fmt);
  }

  // ---- Question building ---------------------------------------------------
  // 문제 하나: { kind, show(시계에 보일 시각), badge(24시간의 시, 오전/오후 표시용), badgeAsk(오전·오후를 물음표로),
  //            prompt(html), say, answer(보기 정답), choices, target(바늘 맞추기 정답), done, sayDone, ideal(목표 초) }
  function makeQuestion(stage) {
    var kind = pickOne(stage.kinds);
    var step = stage.step;
    var count = stage.choices;
    var q = { kind: kind, labels: stage.labels, badge: null, badgeAsk: false, show: null, target: null };
    var t, add, H, m, ans;

    if (kind === "read") {
      t = randomTime(step, stage.onlyHalf);
      q.show = t;
      q.prompt = step >= 60 ? "몇 시일까요?" : "몇 시 몇 분일까요?";
      q.say = q.prompt;
      q.answer = fmt(t);
      q.choices = pickChoices(q.answer, readCandidates(t, step, stage.onlyHalf), function () { return fmt(randomTime(step, stage.onlyHalf)); }, count);
      q.done = fmt(t); q.sayDone = speakTime(t);
      q.ideal = 6;
      q.hint = function (picked) { return readHint(t, step, picked); };
    } else if (kind === "set") {
      t = randomTime(step, stage.onlyHalf);
      q.target = t; q.step = step;
      q.prompt = '<span class="q-time">' + fmt(t) + "</span>" + eul(t.m) + " 만들어 봐요!";
      q.say = speakTime(t) + eul(t.m) + " 만들어 봐요";
      q.done = fmt(t); q.sayDone = speakTime(t);
      q.ideal = 12;
    } else if (kind === "after" || kind === "before") {
      t = randomTime(step, stage.onlyHalf);
      add = randInt(1, 5) * 60;
      var sign = kind === "after" ? 1 : -1;
      ans = shift(t, sign * add);
      q.show = t;
      q.prompt = '지금 시각에서 <span class="q-time">' + durationText(add) + (kind === "after" ? " 뒤" : " 전") + "</span>는 몇 시일까요?";
      q.say = durationKo(add) + (kind === "after" ? " 뒤는" : " 전은") + " 몇 시일까요?";
      q.answer = fmt(ans);
      q.choices = pickChoices(q.answer, [fmt(shift(ans, 60)), fmt(shift(ans, -60)), fmt(shift(t, -sign * add)), fmt(shift(ans, 120))],
        function () { return fmt(shift(ans, randInt(-4, 4) * 60)); }, count);
      q.done = fmt(ans); q.sayDone = speakTime(ans);
      q.ideal = 9;
      q.hint = function () {
        return "짧은바늘을 숫자 " + (add / 60) + "칸 " + (kind === "after" ? "앞으로(오른쪽으로)" : "뒤로(왼쪽으로)") + " 돌려 봐요.";
      };
    } else if (kind === "conv") {
      H = randInt(13, 23); m = randomMinute(step);
      var amText = fmtAmPm(H, m);
      q.show = to12(H, m); q.badge = H;
      q.prompt = '<span class="q-time">' + amText + "</span>" + eun(m) + " 24시간으로 몇 시일까요?";
      q.say = speakAmPm(H, m) + eun(m) + " 몇 시일까요?";
      q.answer = fmt24(H, m);
      q.choices = pickChoices(q.answer, [fmt24(H - 12, m), fmt24(H - 2, m), fmt24(Math.min(23, H + 1), m), fmt24(H - 1, m), fmt24(Math.min(23, H + 2), m)],
        function () { return fmt24(randInt(13, 23), m); }, count);
      q.done = amText + " = " + fmt24(H, m); q.sayDone = speak24(H, m);
      q.ideal = 6;
      q.hint = function () { return "오후 시각에는 12를 더해요! 오후 1시가 13시예요."; };
    } else if (kind === "rev") {
      H = randInt(13, 23); m = randomMinute(step);
      q.show = to12(H, m); q.badge = H; q.badgeAsk = true;
      q.prompt = '<span class="q-time">' + fmt24(H, m) + "</span>" + eun(m) + " 오전·오후로 몇 시일까요?";
      q.say = speak24(H, m) + eun(m) + " 오후 몇 시일까요?";
      q.answer = fmtAmPm(H, m);
      q.choices = pickChoices(q.answer, [fmtAmPm(H - 12, m), H - 10 <= 11 ? "오후 " + fmt({ h: H - 10, m: m }) : null, fmtAmPm(H === 13 ? 14 : H - 1, m), fmtAmPm(Math.min(23, H + 1), m)],
        function () { return fmtAmPm(randInt(13, 23), m); }, count);
      q.done = fmt24(H, m) + " = " + fmtAmPm(H, m); q.sayDone = speakAmPm(H, m);
      q.ideal = 6;
      q.hint = function () { return "12보다 큰 시각은 12를 빼고 '오후'를 붙여요. 13시는 오후 1시예요."; };
    } else if (kind === "read24") {
      if (stage.fullRange) { H = randInt(1, 23); } else { H = randInt(1, 22); if (H === 12) H = 15; }
      m = randomMinute(step);
      q.show = to12(H, m); q.badge = H;
      q.prompt = "24시간으로 읽으면 몇 시일까요?";
      q.say = "이십사 시간으로 읽으면 몇 시일까요?";
      q.answer = fmt24(H, m);
      var other = isPm(H) ? H - 12 : H + 12;
      var cands = [other ? fmt24(other, m) : null, fmt24(isPm(H) ? (H > 13 ? H - 2 : 22) : H + 10, m), fmt24(H === 23 ? 21 : H + 1, m), fmt24(H - 1 || 23, m)];
      if (step < 60) cands.push(fmt24(H, (m + step) % 60), fmt24(H, (m + 60 - step) % 60));
      q.choices = pickChoices(q.answer, cands, function () { return fmt24(H, randomMinute(step)); }, count);
      q.done = fmtAmPm(H, m) + " = " + fmt24(H, m); q.sayDone = speak24(H, m);
      q.ideal = 7;
      q.hint = function (picked) {
        if (picked.split(" ")[0] === q.answer.split(" ")[0]) return readHint(q.show, step, "");
        if (H === 12) return "낮 12시는 오후(PM)지만 그대로 12시예요!";
        return isPm(H) ? "오후(PM)니까 시계가 가리키는 시에 12를 더해요!" : "오전(AM)은 시계가 가리키는 그대로 읽어요!";
      };
    } else if (kind === "set24") {
      H = randInt(13, 22); m = randomMinute(step);
      t = to12(H, m);
      q.target = t; q.step = step; q.badge = H;
      q.prompt = '<span class="q-time">' + fmt24(H, m) + "</span>" + eul(m) + " 시계 바늘로 만들어 봐요!";
      q.say = speak24(H, m) + eul(m) + " 만들어 봐요";
      q.done = fmt24(H, m) + " = " + fmtAmPm(H, m); q.sayDone = speakAmPm(H, m);
      q.ideal = 12;
    } else { // after24
      H = randInt(8, 18); m = randomMinute(step);
      add = randInt(1, Math.min(5, 23 - H)) * 60;
      var E = H + add / 60;
      q.show = to12(H, m); q.badge = H;
      q.prompt = '<span class="q-time">' + fmt24(H, m) + "</span>에서 " + '<span class="q-time">' + durationText(add) + " 뒤</span>는 몇 시일까요?";
      q.say = speak24(H, m) + "에서 " + durationKo(add) + " 뒤는 몇 시일까요?";
      q.answer = fmt24(E, m);
      q.choices = pickChoices(q.answer, [E > 12 ? fmt24(E - 12, m) : null, fmt24(E + 1 > 23 ? E - 2 : E + 1, m), fmt24(E - 1, m), fmt24(Math.max(1, H - add / 60), m)],
        function () { return fmt24(randInt(Math.max(1, E - 4), Math.min(23, E + 3)), m); }, count);
      q.done = fmt24(E, m); q.sayDone = speak24(E, m);
      q.ideal = 9;
      q.hint = function () { return fmt24(H, m) + "에 " + (add / 60) + "시간을 더해 봐요. 24시간에서는 12 다음이 13, 14…로 이어져요."; };
    }
    if (q.target && sameTime({ h: 12, m: 0 }, q.target)) q.start = { h: 6, m: 0 };
    return q;
  }

  function questionKey(q) { return q.answer || fmt(q.target); }

  function buildQuestions(stage) {
    var list = [], seen = {}, guard = 0;
    while (list.length < stage.count && guard++ < 600) {
      var q = makeQuestion(stage);
      var key = q.kind + "|" + questionKey(q) + "|" + q.prompt;
      var last = list[list.length - 1];
      if (seen[key] && guard < 450) continue;
      if (last && questionKey(last) === questionKey(q) && guard < 550) continue;
      seen[key] = true;
      list.push(q);
    }
    return list;
  }

  function readHint(ans, step, picked) {
    var pickedMinute = picked.indexOf("분") >= 0 ? picked.split(" ")[1] : "";
    var ansMinute = ans.m ? ans.m + "분" : "";
    if (picked && pickedMinute === ansMinute) {
      return ans.m === 0 ? "짧은바늘이 가리키는 숫자가 '시'예요." : "짧은바늘이 막 지나온 숫자가 '시'예요.";
    }
    if (step === 1) return "긴바늘이 큰 숫자를 지나 작은 눈금을 몇 칸 더 갔는지 세어 봐요.";
    if (ans.m === 0) return "긴바늘이 12를 가리키면 '정각'이에요.";
    if (ans.m === 30) return "긴바늘이 6을 가리키면 30분이에요.";
    return "긴바늘이 가리키는 숫자에 5를 곱하면 '분'이에요. (1은 5분, 2는 10분…)";
  }

  function setHint(a, now) {
    if (now.m !== a.m) {
      if (a.m === 0) return "긴바늘이 12를 가리켜야 정각이에요.";
      if (a.m % 5 === 0) return "긴바늘이 숫자 " + numEul(a.m / 5) + " 가리켜야 " + a.m + "분이에요.";
      return "긴바늘을 숫자 " + (Math.floor(a.m / 5) || 12) + "에서 작은 눈금 " + (a.m % 5) + "칸 더 돌려요.";
    }
    return a.m === 0
      ? "짧은바늘이 숫자 " + numEul(a.h) + " 가리켜야 해요."
      : "짧은바늘은 숫자 " + numGwa(a.h) + " " + (a.h % 12 + 1) + " 사이에 있어야 해요.";
  }

  // ---- Level loading ----------------------------------------------------
  function loadLevel(idx) {
    state.token++;
    state.levelIndex = idx;
    state.qIndex = 0;
    state.firstTry = 0;
    state.lock = false;
    completionModal.classList.remove("show", "show-success");
    state.questions = buildQuestions(currentLevel());
    updateHud();
    startTimer();
    showQuestion(true);
  }

  function updateHud() {
    var cat = currentCat(), level = currentLevel();
    hudStageVal.textContent = level.n + " / " + cat.stages.length;
    hudThemeVal.textContent = cat.icon + " " + cat.name + " · " + level.label;
    hudQVal.textContent = Math.min(state.qIndex + 1, state.questions.length) + " / " + state.questions.length;
    hudScoreVal.textContent = state.totalScore;
    progressFill.style.width = (state.qIndex / state.questions.length * 100) + "%";
  }

  // ---- Timer ----------------------------------------------------------
  function startTimer() {
    stopTimer();
    state.stageStartTime = performance.now();
    hudTimerVal.textContent = "0.0초";
    state.timerHandle = setInterval(function () {
      var el = (performance.now() - state.stageStartTime) / 1000;
      hudTimerVal.textContent = el.toFixed(1) + "초";
    }, 100);
  }
  function stopTimer() {
    if (state.timerHandle) { clearInterval(state.timerHandle); state.timerHandle = null; }
  }
  function elapsedStage() { return (performance.now() - state.stageStartTime) / 1000; }

  function later(fn, ms) {
    var tok = state.token;
    setTimeout(function () { if (tok === state.token) fn(); }, ms);
  }

  // ---- Showing a question -------------------------------------------------
  function showQuestion(first) {
    var q = state.cur = state.questions[state.qIndex];
    state.missedThis = false;
    state.setTries = 0;
    state.lock = false;
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    updateHud();
    setMinuteLabels(q.labels);
    qText.innerHTML = q.prompt;

    // 시계 위 오전(AM)/오후(PM) 표시. "15시 → 오후 몇 시?" 문제는 물음표로 보여줘요
    if (q.badge != null) {
      ampmBadge.hidden = false;
      ampmBadge.className = "ampm-badge" + (q.badgeAsk ? " ask" : isPm(q.badge) ? " pm" : "");
      ampmBadge.textContent = q.badgeAsk ? "❓ 오전(AM)일까요, 오후(PM)일까요?" : ampmText(q.badge);
    } else {
      ampmBadge.hidden = true;
    }

    if (q.target) {
      var start = q.start || { h: 12, m: 0 };
      state.setTime = start;
      showTimeOnClock(start, first);
      clockSvg.classList.add("settable");
      choiceGrid.hidden = true;
      setPanel.hidden = false;
      checkBtn.hidden = false;
    } else {
      state.setTime = null;
      if (q.show) showTimeOnClock(q.show, first);
      clockSvg.classList.remove("settable");
      choiceGrid.hidden = false;
      setPanel.hidden = true;
      checkBtn.hidden = true;
      renderChoices(q);
    }
    speak(q.say);
  }

  function renderChoices(q) {
    choiceGrid.innerHTML = "";
    choiceGrid.style.gridTemplateColumns = q.choices.length === 3 ? "1fr" : "";
    q.choices.forEach(function (label, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.style.setProperty("--i", i);
      btn.textContent = label;
      btn.addEventListener("click", function () { onChoose(btn, label); });
      choiceGrid.appendChild(btn);
    });
  }

  // ---- Answering ----------------------------------------------------------
  var PRAISE = ["딩동댕! 🔔", "잘했어요! 🎉", "최고예요! 👍", "정답이에요! 🌟", "멋져요! 💖"];

  function onCorrect(fromEl) {
    state.lock = true;
    if (!state.missedThis) state.firstTry++;
    playMatch();
    burst(fromEl);
    animate(qBuddy, "jump");
    feedbackEl.className = "feedback good";
    feedbackEl.textContent = PRAISE[randInt(0, PRAISE.length - 1)] + "  " + state.cur.done;
    speak(state.cur.sayDone + "!");
    later(nextQuestion, 1300);
  }

  function onWrong(hint) {
    state.missedThis = true;
    playMiss();
    animate(qBuddy, "sad");
    feedbackEl.className = "feedback hint";
    feedbackEl.textContent = "💡 " + hint;
  }

  function onChoose(btn, label) {
    if (state.lock) return;
    var q = state.cur;
    if (label === q.answer) {
      btn.classList.add("correct");
      onCorrect(btn);
      return;
    }
    btn.classList.add("wrong");
    onWrong(q.hint(label));
  }

  function onCheck() {
    if (state.lock || !state.setTime) return;
    var q = state.cur;
    if (sameTime(state.setTime, q.target)) {
      onCorrect(clockSvg);
      return;
    }
    state.setTries++;
    animate(clockBox, "shake");
    if (state.setTries >= MAX_SET_TRIES) {
      state.missedThis = true;
      state.lock = true;
      playMiss();
      animate(qBuddy, "sad");
      feedbackEl.className = "feedback hint";
      feedbackEl.textContent = "이렇게 하면 " + q.done + ieyo(q.target.m) + "! 바늘을 잘 봐요 👀";
      state.setTime = q.target;
      showTimeOnClock(q.target);
      speak(q.sayDone);
      later(nextQuestion, 2600);
      return;
    }
    var hint = setHint(q.target, state.setTime);
    if (q.kind === "set24" && state.setTries === 1) {
      hint = fmt24(q.badge, q.target.m) + eun(q.target.m) + " " + fmtAmPm(q.badge, q.target.m) + ieyo(q.target.m) + ". " + hint;
    }
    onWrong(hint);
  }

  function nextQuestion() {
    state.qIndex++;
    if (state.qIndex >= state.questions.length) {
      updateHud();
      onStageComplete();
      return;
    }
    showQuestion(false);
  }

  // ---- Dragging the hands (바늘 맞추기) ------------------------------------
  var drag = null;

  function pointerAngle(evt) {
    var pt = clockSvg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    var p = pt.matrixTransform(clockSvg.getScreenCTM().inverse());
    var dx = p.x - CX, dy = p.y - CY;
    return { deg: (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360, dist: Math.hypot(dx, dy) };
  }
  function angleGap(a, b) { var d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }

  function applyDrag(kind, deg) {
    var now = state.setTime;
    var total = toTotal(now.h, now.m);
    if (kind === "minute") {
      var step = state.cur.step;
      var newMin = (Math.round(deg / 6 / step) * step) % 60;
      var delta = newMin - now.m;
      if (delta > 30) delta -= 60;
      if (delta < -30) delta += 60;
      total += delta;      // 12를 지나가면 짧은바늘도 따라서 한 칸 움직여요
    } else {
      var hourIdx = Math.round((deg * 2 - now.m) / 60);
      total = hourIdx * 60 + now.m;
    }
    var next = fromTotal(total);
    if (!sameTime(next, now)) {
      state.setTime = next;
      showTimeOnClock(next);
      playTick();
    }
  }

  clockSvg.addEventListener("pointerdown", function (evt) {
    if (!state.cur || !state.cur.target || state.lock) return;
    evt.preventDefault();
    var a = pointerAngle(evt);
    // 누른 방향에 가까운 바늘을 잡아요. 두 바늘이 겹쳐 있으면 가운데 쪽은 짧은바늘, 바깥쪽은 긴바늘이에요
    var total = toTotal(state.setTime.h, state.setTime.m);
    var gapH = angleGap(a.deg, total * 0.5), gapM = angleGap(a.deg, state.setTime.m * 6);
    var kind = gapH < 25 && gapM < 25 ? (a.dist < 76 ? "hour" : "minute") : (gapH < gapM ? "hour" : "minute");
    // 정각 놀이에서는 긴바늘이 12에 고정이라 짧은바늘만 움직여요
    if (state.cur.step >= 60) kind = "hour";
    drag = { id: evt.pointerId, kind: kind };
    clockSvg.setPointerCapture(evt.pointerId);
    clockSvg.classList.add("dragging");
    applyDrag(kind, a.deg);
  });
  clockSvg.addEventListener("pointermove", function (evt) {
    if (!drag || evt.pointerId !== drag.id) return;
    applyDrag(drag.kind, pointerAngle(evt).deg);
  });
  function endDrag(evt) {
    if (!drag || evt.pointerId !== drag.id) return;
    drag = null;
    clockSvg.classList.remove("dragging");
  }
  clockSvg.addEventListener("pointerup", endDrag);
  clockSvg.addEventListener("pointercancel", endDrag);

  // ---- Effects ------------------------------------------------------------
  function animate(el, cls) { el.classList.remove(cls); void el.getBoundingClientRect(); el.classList.add(cls); }
  function burst(el) {
    var r = el.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var bits = ["⭐", "✨", "💖", "🌟"];
    for (var k = 0; k < 12; k++) {
      var p = document.createElement("div");
      p.className = "particle";
      p.textContent = bits[k % bits.length];
      var ang = Math.PI * 2 * k / 12, dist = randInt(60, 120);
      p.style.left = cx + "px"; p.style.top = cy + "px";
      p.style.setProperty("--x", Math.cos(ang) * dist + "px");
      p.style.setProperty("--y", Math.sin(ang) * dist + "px");
      document.body.appendChild(p);
      (function (node) { setTimeout(function () { node.remove(); }, 950); })(p);
    }
  }

  // ---- Completion ---------------------------------------------------------
  function onStageComplete() {
    stopTimer();
    var total = state.questions.length;
    var accuracyPercent = state.firstTry / total * 100;

    var elapsed = elapsedStage();
    var slow = currentCat().step === 1 ? 1.3 : 1;   // 1분 읽기는 세는 데 시간이 더 걸려요
    var idealTime = state.questions.reduce(function (sum, q) { return sum + q.ideal * slow * (currentLevel().pace || 1); }, 0);
    var timeScore = Math.max(40, Math.min(100, 100 - Math.max(0, elapsed - idealTime) * 1.5));

    var finalPercent = Math.round(accuracyPercent * 0.7 + timeScore * 0.3);
    finalPercent = Math.max(0, Math.min(100, finalPercent));
    var stars = finalPercent >= 95 ? 5 : finalPercent >= 85 ? 4 : finalPercent >= 70 ? 3 : finalPercent >= 50 ? 2 : 1;
    var scoreGain = Math.round(finalPercent * 10);

    state.totalScore += scoreGain;
    state.results.push({
      name: stageName(currentCat(), currentLevel()),
      elapsed: elapsed, gain: scoreGain, stars: stars, percent: finalPercent
    });
    recordStars(currentLevel().id, stars);
    recordTime(currentLevel().id, elapsed);
    updateHud();
    progressFill.style.width = "100%";

    completionStarsEl.innerHTML = starsHtml(stars, 5);
    completionPercentEl.textContent = finalPercent + "% 완성";
    completionDetailEl.textContent = "한 번에 맞힌 문제 " + state.firstTry + " / " + total + " · " + elapsed.toFixed(1) + "초";
    completionScoreEl.textContent = "+" + scoreGain + "점";
    document.getElementById("btn-completion-next").textContent =
      state.levelIndex + 1 < currentCat().stages.length ? "다음 스테이지" : "결과 보기";
    completionModal.classList.add("show", "show-success");
    playClear();
    speak("스테이지 클리어!");
  }

  // ---- Ranking modal ----------------------------------------------------
  function formatTime(sec) {
    return sec.toFixed(1) + "초";
  }

  function openRanking(levelIndex) {
    var cat = currentCat(), level = cat.stages[levelIndex];
    rankingStageLabel.textContent = stageName(cat, level);
    rankingList.innerHTML = "";
    rankingModal.classList.add("show");

    var rows = localRanking(level.id, 5);
    rankingModal.classList.toggle("empty", rows.length === 0);
    var medals = ["🥇", "🥈", "🥉"];
    rows.forEach(function (row, i) {
      var li = document.createElement("li");
      li.className = "ranking-row";
      if (!guestMode && currentUser && row.player_name === currentUser) li.classList.add("me");
      var rank = document.createElement("span");
      rank.className = "ranking-rank";
      rank.textContent = medals[i] || (i + 1) + "위";
      var name = document.createElement("span");
      name.className = "ranking-name";
      name.textContent = row.player_name;
      var time = document.createElement("span");
      time.className = "ranking-time";
      time.textContent = formatTime(row.elapsed_seconds);
      li.appendChild(rank); li.appendChild(name); li.appendChild(time);
      rankingList.appendChild(li);
    });
  }

  function closeRanking() {
    rankingModal.classList.remove("show", "empty");
  }

  function leaveGame() {
    state.token++;
    stopTimer();
    speak("");
    drag = null;
  }

  function goToNextLevelOrResult() {
    completionModal.classList.remove("show", "show-success");
    if (state.levelIndex + 1 < currentCat().stages.length) {
      loadLevel(state.levelIndex + 1);
    } else {
      showResult();
    }
  }

  function showResult() {
    leaveGame();
    showScreen("result");
    document.getElementById("result-total-score").textContent = state.totalScore;
    var table = document.getElementById("result-table");
    var rows = ["<tr><th>스테이지</th><th>별</th><th>시간</th><th>점수</th></tr>"];
    state.results.forEach(function (r) {
      rows.push(
        "<tr><td>" + r.name + "</td><td class=\"result-stars\">" + starsHtml(r.stars, 5) + "</td><td>" +
        r.elapsed.toFixed(1) + "초</td><td>+" + r.gain + "</td></tr>"
      );
    });
    table.innerHTML = rows.join("");
  }

  // ---- 원리 책 ----------------------------------------------------------------
  var book = { pages: [], index: 0, startLevel: 0 };
  var bookPageEl = document.getElementById("book-page");
  var bookPrev = document.getElementById("book-prev");
  var bookNext = document.getElementById("book-next");
  var bookDots = document.getElementById("book-dots");
  var miniClockId = 0;

  // 책에 넣을 작은 시계 그림 (문제 시계와 같은 모양)
  function miniClockSvg(c) {
    var gid = "ring-grad-book-" + (++miniClockId);
    var out = ['<svg viewBox="-26 -26 352 352" aria-hidden="true">',
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d81b7a"/><stop offset="1" stop-color="#7c2ce0"/></linearGradient></defs>',
      '<circle cx="150" cy="150" r="142" fill="#fff" stroke="url(#' + gid + ')" stroke-width="10"/>'];
    for (var i = 0; i < 60; i++) {
      var big = i % 5 === 0;
      var hl = c.ticks && i > c.ticks[0] && i <= c.ticks[1];
      var a = polar(i * 6, 131), b = polar(i * 6, big ? 117 : (hl ? 119 : 124));
      out.push('<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" class="tick' + (big ? " big" : "") + (hl ? " hl" : "") + '"/>');
      if (hl && c.count) {
        var cp = polar(i * 6, 158);
        out.push('<text x="' + cp.x + '" y="' + cp.y + '" text-anchor="middle" dominant-baseline="central" class="tick-count">' + i + "</text>");
      }
      if (big && c.labels) {
        var lp = polar(i * 6, 162);
        out.push('<text x="' + lp.x + '" y="' + lp.y + '" text-anchor="middle" dominant-baseline="central" class="clock-min-num">' + (i === 0 ? 60 : i) + "분</text>");
      }
    }
    for (var n = 1; n <= 12; n++) {
      var p = polar(n * 30, 98);
      out.push('<text x="' + p.x + '" y="' + p.y + '" text-anchor="middle" dominant-baseline="central" class="clock-num">' + n + "</text>");
    }
    if (!c.noHands) {
      var hourDeg = toTotal(c.h, c.m) * 0.5, minDeg = c.m * 6;
      out.push('<line x1="150" y1="164" x2="150" y2="88" class="hand hand-hour" transform="rotate(' + hourDeg + ' 150 150)"/>');
      out.push('<line x1="150" y1="164" x2="150" y2="46" class="hand hand-minute" transform="rotate(' + minDeg + ' 150 150)"/>');
    }
    out.push('<circle cx="150" cy="150" r="10" fill="#241b3a"/><circle cx="150" cy="150" r="4" fill="#fff"/></svg>');
    return out.join("");
  }

  function dayStripHtml() {
    var am = "", pm = "";
    for (var i = 1; i <= 11; i++) {
      am += '<div class="ds-cell">' + i + "</div>";
      pm += '<div class="ds-cell">' + (i + 12) + "<small>" + i + "</small></div>";
    }
    return '<div class="day-strip">' +
      '<div class="ds-row ds-am"><div class="ds-label">☀️ 오전<br>(AM)</div><div class="ds-cells">' + am + "</div></div>" +
      '<div class="ds-row ds-pm"><div class="ds-label">🌙 오후<br>(PM)</div><div class="ds-cells">' + pm + "</div></div></div>";
  }
  function pmTableHtml() {
    var html = '<div class="pm-table">';
    for (var i = 1; i <= 11; i++) html += '<div class="pm-cell">오후 ' + i + "시 = <b>" + (i + 12) + "시</b></div>";
    return html + '<div class="pm-cell">낮 12시 = <b>12시</b></div></div>';
  }

  function openBook(levelIndex) {
    var guide = CD.GUIDES[currentCat().guide];
    book.pages = guide.pages.concat([{ start: true }]);
    book.index = 0;
    book.startLevel = levelIndex;
    document.getElementById("book-title").textContent = "📖 " + guide.title;
    showScreen("book");
    renderBookPage(0);
  }

  function renderBookPage(dir) {
    var page = book.pages[book.index], last = book.pages.length - 1;
    var html;
    if (page.start) {
      var lvl = currentCat().stages[book.startLevel];
      html = '<div class="bp-start-emoji">🐰✏️</div>' +
        '<div class="bp-start-text">자, 이제 문제를 풀어볼까?</div>' +
        '<div class="bp-swipe">' + currentCat().name + " " + lvl.n + "단계 · " + lvl.label + "</div>" +
        '<button id="book-start" class="btn btn-primary btn-huge" type="button">시작! 🚀</button>';
    } else {
      var visual = "";
      if (page.clock) {
        visual = (page.clock.badge != null
          ? '<div class="ampm-badge' + (isPm(page.clock.badge) ? " pm" : "") + '">' + ampmText(page.clock.badge) + "</div>" : "") +
          miniClockSvg(page.clock);
      } else if (page.strip) {
        visual = dayStripHtml();
      } else if (page.table) {
        visual = pmTableHtml();
      }
      html = '<div class="bp-title">' + page.title + "</div>" +
        '<div class="bp-row"><div class="bp-visual' + (page.clock ? "" : " bp-wide") + '">' + visual + '</div><div class="bp-text">' + page.text + "</div></div>" +
        (book.index === 0 ? '<div class="bp-swipe">▶ 를 누르면 다음 장으로 넘어가요</div>' : "");
    }
    bookPageEl.innerHTML = html;
    bookPageEl.classList.remove("turn-next", "turn-prev");
    if (dir) { void bookPageEl.offsetWidth; bookPageEl.classList.add(dir > 0 ? "turn-next" : "turn-prev"); }
    bookPrev.disabled = book.index === 0;
    bookNext.disabled = book.index === last;
    bookNext.classList.toggle("nudge", book.index === 0);
    document.getElementById("book-page-num").textContent = (book.index + 1) + " / " + book.pages.length;
    bookDots.innerHTML = "";
    book.pages.forEach(function (_, i) {
      var d = document.createElement("button");
      d.type = "button";
      d.className = "book-dot" + (i === book.index ? " on" : "");
      d.title = (i + 1) + "쪽";
      d.addEventListener("click", function () { turnBook(i - book.index); });
      bookDots.appendChild(d);
    });
    var startBtn = document.getElementById("book-start");
    if (startBtn) startBtn.addEventListener("click", function () {
      state.guideRead[currentCat().id] = true;
      startStage(book.startLevel);
    });
  }

  function turnBook(delta) {
    var next = Math.max(0, Math.min(book.pages.length - 1, book.index + delta));
    if (next === book.index) return;
    book.index = next;
    playClick();
    renderBookPage(delta);
  }

  bookPrev.addEventListener("click", function () { turnBook(-1); });
  bookNext.addEventListener("click", function () { turnBook(1); });
  document.addEventListener("keydown", function (evt) {
    if (!screens.book.classList.contains("active")) return;
    if (evt.key === "ArrowRight") turnBook(1);
    if (evt.key === "ArrowLeft") turnBook(-1);
  });
  // 손가락으로 옆으로 밀어도 넘어가요
  var swipeX = null;
  bookPageEl.addEventListener("pointerdown", function (evt) { swipeX = evt.clientX; });
  bookPageEl.addEventListener("pointerup", function (evt) {
    if (swipeX == null) return;
    var dx = evt.clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) > 50) turnBook(dx < 0 ? 1 : -1);
  });
  document.getElementById("book-close").addEventListener("click", goToLevelSelect);

  // ---- Mode select (놀이 고르기) --------------------------------------------
  function buildModeGrid() {
    modeGrid.innerHTML = "";
    var starsMap = loadStars();
    CD.CATEGORIES.forEach(function (cat, ci) {
      var got = 0, cleared = 0;
      cat.stages.forEach(function (s) { if (starsMap[s.id]) { got += starsMap[s.id]; cleared++; } });
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mode-btn mode-" + cat.color;
      btn.innerHTML =
        '<div class="mode-emoji">' + cat.icon + "</div>" +
        '<div><div class="mode-title"></div><div class="mode-desc"></div>' +
        '<div class="mode-progress">' + cleared + " / " + cat.stages.length + " 스테이지 · ★ " + got + "</div></div>";
      btn.querySelector(".mode-title").textContent = cat.name;
      btn.querySelector(".mode-desc").textContent = cat.desc;
      btn.addEventListener("click", function () {
        playClick();
        state.catIndex = ci;
        goToLevelSelect();
      });
      modeGrid.appendChild(btn);
    });
  }

  // ---- Stage select ------------------------------------------------------
  function startStage(i) {
    state.totalScore = 0;
    state.results = [];
    showScreen("game");
    loadLevel(i);
  }

  function buildLevelGrid() {
    var cat = currentCat();
    levelSelectTitle.textContent = cat.icon + " " + cat.name;
    levelGrid.innerHTML = "";
    var starsMap = loadStars();
    // 원리 책이 있는 놀이는 1단계 바로 앞에 큰 책 칸을 둬요. 읽고 나면 1단계로 이어져요
    if (cat.guide) {
      var read = !!state.guideRead[cat.id];
      var bookBtn = document.createElement("button");
      bookBtn.type = "button";
      bookBtn.className = "level-grid-btn book-tile" + (read ? " read" : "");
      bookBtn.innerHTML = '<div class="lvl-num">📖</div><div class="lvl-name">원리 책</div>' +
        '<div class="lvl-stars">' + (read ? "✔ 다 읽었어요" : "먼저 읽어요!") + "</div>";
      bookBtn.addEventListener("click", function () { openBook(0); });
      levelGrid.appendChild(bookBtn);
    }
    cat.stages.forEach(function (lvl, i) {
      var btn = document.createElement("button");
      btn.className = "level-grid-btn";
      var st = starsMap[lvl.id] || 0;
      var locked = i > 0 && !(starsMap[cat.stages[i - 1].id] > 0);
      var num = document.createElement("div");
      num.className = "lvl-num";
      num.textContent = lvl.n;
      var name = document.createElement("div");
      name.className = "lvl-name";
      name.textContent = lvl.label + (lvl.help ? " · 도움 숫자" : "");
      var starsEl = document.createElement("div");
      starsEl.className = "lvl-stars";
      if (st > 0) {
        starsEl.textContent = starsGlyph(st, 5);
        btn.classList.add("has-stars");
      }
      var trophy = document.createElement("span");
      trophy.className = "lvl-trophy";
      trophy.textContent = "🏆";
      trophy.title = "랭킹 보기";
      trophy.addEventListener("click", function (evt) {
        evt.stopPropagation();
        openRanking(i);
      });
      btn.appendChild(num);
      btn.appendChild(name);
      btn.appendChild(starsEl);
      btn.appendChild(trophy);
      if (locked) {
        btn.classList.add("locked");
        btn.disabled = true;
        btn.title = "이전 스테이지를 클리어해야 도전할 수 있어요";
        var lockEl = document.createElement("div");
        lockEl.className = "lvl-lock";
        lockEl.textContent = "🔒";
        btn.appendChild(lockEl);
        trophy.style.display = "none";
      } else {
        btn.addEventListener("click", function () {
          if (cat.guide && !state.guideRead[cat.id]) openBook(i);
          else startStage(i);
        });
      }
      levelGrid.appendChild(btn);
    });
  }

  // ---- Wire up UI ----------------------------------------------------
  document.getElementById("btn-start").addEventListener("click", function () {
    ac();
    speak("");
    buildUserList();
    userNameInput.value = "";
    showScreen("user");
  });
  document.getElementById("btn-howto").addEventListener("click", function () { showScreen("howto"); });
  document.getElementById("btn-howto-back").addEventListener("click", function () { showScreen("title"); });

  document.getElementById("btn-user-guest").addEventListener("click", function () {
    currentUser = null;
    guestMode = true;
    guestStars = {};
    updateUserBadge();
    goToModeSelect();
  });
  function submitNewUser() {
    var name = userNameInput.value.trim();
    if (!name) return;
    ensureProfile(name);
    currentUser = name;
    guestMode = false;
    updateUserBadge();
    goToModeSelect();
  }
  document.getElementById("btn-user-new-start").addEventListener("click", submitNewUser);
  userNameInput.addEventListener("keydown", function (evt) {
    if (evt.key === "Enter") submitNewUser();
  });
  document.getElementById("btn-user-back").addEventListener("click", function () { showScreen("title"); });

  document.getElementById("btn-mode-title").addEventListener("click", function () { showScreen("title"); });
  document.getElementById("btn-levelselect-mode").addEventListener("click", goToModeSelect);

  document.getElementById("btn-quit").addEventListener("click", function () {
    leaveGame();
    completionModal.classList.remove("show", "show-success");
    goToLevelSelect();
  });
  document.getElementById("btn-speak").addEventListener("click", function () {
    if (state.cur) speak(state.cur.say);
  });
  checkBtn.addEventListener("click", function () { playClick(); onCheck(); });
  document.getElementById("btn-retry").addEventListener("click", goToModeSelect);
  document.getElementById("btn-to-title").addEventListener("click", function () { showScreen("title"); });
  document.getElementById("btn-completion-next").addEventListener("click", goToNextLevelOrResult);
  document.getElementById("btn-completion-retry").addEventListener("click", function () {
    state.totalScore -= state.results.length ? state.results.pop().gain : 0;
    loadLevel(state.levelIndex);
  });
  document.getElementById("btn-completion-list").addEventListener("click", function () {
    completionModal.classList.remove("show", "show-success");
    leaveGame();
    goToLevelSelect();
  });
  document.getElementById("btn-completion-rank").addEventListener("click", function () {
    openRanking(state.levelIndex);
  });
  document.getElementById("btn-ranking-close").addEventListener("click", closeRanking);

  buildClock();
  showScreen("title");
})();
