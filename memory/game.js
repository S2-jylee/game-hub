(function () {
  "use strict";

  var MD = window.MemoryData;
  var PROFILES_KEY = "memory_profiles_v1";
  var MISMATCH_DELAY = 800;

  // ---- DOM refs ----------------------------------------------------
  var screens = {
    title: document.getElementById("screen-title"),
    user: document.getElementById("screen-user"),
    howto: document.getElementById("screen-howto"),
    levelselect: document.getElementById("screen-levelselect"),
    game: document.getElementById("screen-game"),
    result: document.getElementById("screen-result")
  };
  var userListEl = document.getElementById("user-list");
  var userNameInput = document.getElementById("user-name-input");
  var cardGrid = document.getElementById("card-grid");
  var hudStageVal = document.getElementById("hud-stage-val");
  var hudThemeVal = document.getElementById("hud-theme-val");
  var hudTimerVal = document.getElementById("hud-timer-val");
  var hudTriesVal = document.getElementById("hud-tries-val");
  var hudScoreVal = document.getElementById("hud-score-val");
  var progressFill = document.getElementById("stage-progress-fill");
  var levelGrid = document.getElementById("level-grid");

  var completionModal = document.getElementById("completion-modal");
  var completionStarsEl = document.getElementById("completion-stars");
  var completionPercentEl = document.getElementById("completion-percent");
  var completionScoreEl = document.getElementById("completion-score");

  var rankingModal = document.getElementById("ranking-modal");
  var rankingStageLabel = document.getElementById("ranking-stage-label");
  var rankingList = document.getElementById("ranking-list");

  function showScreen(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.toggle("active", k === name);
    });
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
        goToLevelSelect();
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
  // Records live inside each profile's own entry, so the board only ever
  // shows names/times that were set by playing on this PC/browser - nothing
  // is shared with other devices.
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
  function playMatch() { beep(660, 0.12, 0, "triangle", 0.14); beep(880, 0.16, 0.08, "triangle", 0.14); }
  function playMiss() { beep(260, 0.14, 0, "sawtooth", 0.09); }

  // ---- Game state -----------------------------------------------------
  var state = {
    levelIndex: 0,
    totalScore: 0,
    results: [],      // {name, elapsed, gain, stars, percent}
    pairs: 0,
    cards: [],        // {id, icon, matched, flipped, el}
    flippedIds: [],
    pairsFound: 0,
    tries: 0,
    lock: false,
    stageStartTime: 0,
    timerHandle: null
  };

  function currentLevel() { return MD.LEVELS[state.levelIndex]; }
  function findCard(id) {
    for (var i = 0; i < state.cards.length; i++) if (state.cards[i].id === id) return state.cards[i];
    return null;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function gridColumns(cardCount) {
    return Math.min(6, Math.max(2, Math.ceil(Math.sqrt(cardCount))));
  }

  // ---- Level loading ----------------------------------------------------
  function loadLevel(idx) {
    state.levelIndex = idx;
    state.flippedIds = [];
    state.pairsFound = 0;
    state.tries = 0;
    state.lock = false;
    completionModal.classList.remove("show", "show-success");

    var level = MD.LEVELS[idx];
    var cat = MD.CATEGORIES[level.themeKey];
    var icons = cat.icons.slice(0, level.pairs);
    state.pairs = level.pairs;

    var deck = shuffle(icons.concat(icons));
    state.cards = deck.map(function (icon, i) {
      return { id: "c" + i, icon: icon, matched: false, flipped: false, el: null, frontEl: null };
    });

    renderGrid();
    updateHud();
    startTimer();
  }

  function renderGrid() {
    cardGrid.innerHTML = "";
    var cols = gridColumns(state.cards.length);
    cardGrid.style.gridTemplateColumns = "repeat(" + cols + ", minmax(0, 128px))";
    state.cards.forEach(function (card) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mem-card";
      btn.setAttribute("aria-label", "카드");

      var inner = document.createElement("div");
      inner.className = "mem-card-inner";

      var back = document.createElement("div");
      back.className = "mem-card-face mem-card-back";

      var front = document.createElement("div");
      front.className = "mem-card-face mem-card-front";
      front.textContent = card.icon;

      inner.appendChild(back);
      inner.appendChild(front);
      btn.appendChild(inner);
      btn.addEventListener("click", function () { onCardClick(card); });

      card.el = btn;
      cardGrid.appendChild(btn);
    });
  }

  function renderCardState(card) {
    if (!card.el) return;
    card.el.classList.toggle("flipped", card.flipped);
    card.el.classList.toggle("matched", card.matched);
  }

  function updateHud() {
    var level = currentLevel();
    hudStageVal.textContent = (state.levelIndex + 1) + " / " + MD.LEVELS.length;
    hudThemeVal.textContent = level.themeName;
    hudTriesVal.textContent = state.tries;
    hudScoreVal.textContent = state.totalScore;
    progressFill.style.width = (state.levelIndex / MD.LEVELS.length * 100) + "%";
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

  // ---- Card interaction -------------------------------------------------
  function onCardClick(card) {
    if (state.lock || card.matched || card.flipped) return;
    if (state.flippedIds.length >= 2) return;

    card.flipped = true;
    renderCardState(card);
    playClick();
    state.flippedIds.push(card.id);

    if (state.flippedIds.length < 2) return;

    state.tries++;
    state.lock = true;
    updateHud();

    var a = findCard(state.flippedIds[0]);
    var b = findCard(state.flippedIds[1]);

    if (a.icon === b.icon) {
      a.matched = true; b.matched = true;
      renderCardState(a); renderCardState(b);
      state.pairsFound++;
      state.flippedIds = [];
      state.lock = false;
      playMatch();
      if (state.pairsFound === state.pairs) {
        setTimeout(onStageComplete, 350);
      }
    } else {
      a.el.classList.add("mismatch");
      b.el.classList.add("mismatch");
      playMiss();
      setTimeout(function () {
        a.flipped = false; b.flipped = false;
        renderCardState(a); renderCardState(b);
        a.el.classList.remove("mismatch");
        b.el.classList.remove("mismatch");
        state.flippedIds = [];
        state.lock = false;
      }, MISMATCH_DELAY);
    }
  }

  // ---- Completion ---------------------------------------------------------
  function onStageComplete() {
    stopTimer();

    var idealTries = state.pairs;
    var efficiency = Math.max(0, Math.min(1, idealTries / state.tries));
    var accuracyPercent = efficiency * 100;

    var elapsed = elapsedStage();
    var idealTime = state.pairs * 3;
    var timeScore = Math.max(40, Math.min(100, 100 - Math.max(0, elapsed - idealTime) * 3));

    var finalPercent = Math.round(accuracyPercent * 0.6 + timeScore * 0.4);
    finalPercent = Math.max(0, Math.min(100, finalPercent));
    var stars = finalPercent >= 95 ? 5 : finalPercent >= 85 ? 4 : finalPercent >= 70 ? 3 : finalPercent >= 50 ? 2 : 1;
    var scoreGain = Math.round(finalPercent * 10);

    state.totalScore += scoreGain;
    state.results.push({
      name: currentLevel().themeName + " · " + (state.levelIndex + 1) + "단계",
      elapsed: elapsed, gain: scoreGain, stars: stars, percent: finalPercent
    });
    recordStars(currentLevel().id, stars);
    recordTime(currentLevel().id, elapsed);
    updateHud();

    completionStarsEl.innerHTML = starsHtml(stars, 5);
    completionPercentEl.textContent = finalPercent + "% 완성";
    completionScoreEl.textContent = "+" + scoreGain + "점";
    completionModal.classList.add("show", "show-success");
    playClear();
  }

  // ---- Ranking modal ----------------------------------------------------
  function formatTime(sec) {
    return sec.toFixed(1) + "초";
  }

  function openRanking(levelIndex) {
    var level = MD.LEVELS[levelIndex];
    rankingStageLabel.textContent = (levelIndex + 1) + "단계 · " + level.themeName;
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

  function goToNextLevelOrResult() {
    completionModal.classList.remove("show", "show-success");
    if (state.levelIndex + 1 < MD.LEVELS.length) {
      loadLevel(state.levelIndex + 1);
    } else {
      showResult();
    }
  }

  function showResult() {
    stopTimer();
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

  // ---- Stage select ------------------------------------------------------
  function buildLevelGrid() {
    levelGrid.innerHTML = "";
    var starsMap = loadStars();
    MD.LEVELS.forEach(function (lvl, i) {
      var btn = document.createElement("button");
      btn.className = "level-grid-btn";
      var num = document.createElement("div");
      num.textContent = (i + 1);
      var starsEl = document.createElement("div");
      starsEl.className = "lvl-stars";
      var st = starsMap[lvl.id] || 0;
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
      btn.appendChild(starsEl);
      btn.appendChild(trophy);
      btn.addEventListener("click", function () {
        state.totalScore = 0;
        state.results = [];
        showScreen("game");
        loadLevel(i);
      });
      levelGrid.appendChild(btn);
    });
  }

  // ---- Wire up UI ----------------------------------------------------
  document.getElementById("btn-start").addEventListener("click", function () {
    ac();
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
    goToLevelSelect();
  });
  function submitNewUser() {
    var name = userNameInput.value.trim();
    if (!name) return;
    ensureProfile(name);
    currentUser = name;
    guestMode = false;
    updateUserBadge();
    goToLevelSelect();
  }
  document.getElementById("btn-user-new-start").addEventListener("click", submitNewUser);
  userNameInput.addEventListener("keydown", function (evt) {
    if (evt.key === "Enter") submitNewUser();
  });
  document.getElementById("btn-user-back").addEventListener("click", function () { showScreen("title"); });

  document.getElementById("btn-levelselect-title").addEventListener("click", function () { showScreen("title"); });

  document.getElementById("btn-quit").addEventListener("click", function () {
    stopTimer();
    goToLevelSelect();
  });
  document.getElementById("btn-retry").addEventListener("click", goToLevelSelect);
  document.getElementById("btn-to-title").addEventListener("click", function () { showScreen("title"); });
  document.getElementById("btn-completion-next").addEventListener("click", goToNextLevelOrResult);
  document.getElementById("btn-completion-list").addEventListener("click", function () {
    completionModal.classList.remove("show", "show-success");
    goToLevelSelect();
  });
  document.getElementById("btn-completion-rank").addEventListener("click", function () {
    openRanking(state.levelIndex);
  });
  document.getElementById("btn-ranking-close").addEventListener("click", closeRanking);

  buildLevelGrid();
  showScreen("title");
})();
