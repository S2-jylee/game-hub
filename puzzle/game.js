(function () {
  "use strict";

  var PD = window.PuzzleData;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var XLINK_NS = "http://www.w3.org/1999/xlink";
  var ART_SIZE = PD.ART_SIZE;

  var ART_G_TX = 40, ART_G_TY = 70, ART_TARGET_SIZE = 460;
  var ART_G_SCALE = ART_TARGET_SIZE / ART_SIZE;
  var TRAY = { x0: 520, x1: 880, y0: 20, y1: 580 };

  var DIFFS = {
    easy: { grid: 3, label: "쉬움", par: 40, scoreMult: 1 },
    normal: { grid: 4, label: "보통", par: 90, scoreMult: 1.5 },
    hard: { grid: 5, label: "어려움", par: 170, scoreMult: 2.2 }
  };

  var PROFILES_KEY = "puzzle_profiles_v1";

  // ---- DOM refs ----------------------------------------------------
  var screens = {
    title: document.getElementById("screen-title"),
    user: document.getElementById("screen-user"),
    howto: document.getElementById("screen-howto"),
    difficulty: document.getElementById("screen-difficulty"),
    levelselect: document.getElementById("screen-levelselect"),
    game: document.getElementById("screen-game"),
    result: document.getElementById("screen-result")
  };
  var userListEl = document.getElementById("user-list");
  var userNameInput = document.getElementById("user-name-input");
  var boardSvg = document.getElementById("board");
  var artworkDefs = document.getElementById("artwork-defs");
  var clipDefs = document.getElementById("clip-defs");
  var artSpace = document.getElementById("art-space");
  var layerTarget = document.getElementById("layer-target");
  var layerPieces = document.getElementById("layer-pieces");
  var hudStageVal = document.getElementById("hud-stage-val");
  var hudLevelName = document.getElementById("hud-level-name");
  var hudPiecesVal = document.getElementById("hud-pieces-val");
  var hudTimerVal = document.getElementById("hud-timer-val");
  var hudScoreVal = document.getElementById("hud-score-val");
  var progressFill = document.getElementById("stage-progress-fill");
  var levelGrid = document.getElementById("level-grid");
  var levelSelectDiffLabel = document.getElementById("levelselect-diff-label");
  var btnPreview = document.getElementById("btn-preview");

  var completionModal = document.getElementById("completion-modal");
  var completionStarsEl = document.getElementById("completion-stars");
  var completionPercentEl = document.getElementById("completion-percent");
  var completionScoreEl = document.getElementById("completion-score");

  var rankingModal = document.getElementById("ranking-modal");
  var rankingStageLabel = document.getElementById("ranking-stage-label");
  var rankingList = document.getElementById("ranking-list");

  artSpace.setAttribute("transform", "translate(" + ART_G_TX + " " + ART_G_TY + ") scale(" + ART_G_SCALE + ")");

  function showScreen(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.toggle("active", k === name);
    });
  }

  function goToLevelSelect() {
    levelSelectDiffLabel.textContent = DIFFS[state.difficulty].label;
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
        showScreen("difficulty");
      });
      userListEl.appendChild(btn);
    });
  }

  // ---- Star / ranking storage (scoped to the active user) ---------------
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
  function recordStars(key, stars) {
    var map = loadStars();
    if (!map[key] || map[key] < stars) {
      map[key] = stars;
      saveStars(map);
    }
    return map[key];
  }
  function recordTime(key, elapsed) {
    if (guestMode || !currentUser) return;
    var profiles = loadProfiles();
    var profile = profiles[currentUser] = profiles[currentUser] || { stars: {} };
    profile.times = profile.times || {};
    var prev = profile.times[key];
    if (prev == null || elapsed < prev) {
      profile.times[key] = elapsed;
      saveProfiles(profiles);
    }
  }
  function localRanking(key, limit) {
    var profiles = loadProfiles();
    var rows = [];
    Object.keys(profiles).forEach(function (name) {
      var t = profiles[name] && profiles[name].times && profiles[name].times[key];
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
  function formatTime(sec) { return sec.toFixed(1) + "초"; }

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
  function playClick() { beep(440, 0.06, 0, "square", 0.06); }

  // ---- Game state -----------------------------------------------------
  var state = {
    difficulty: "easy",
    levelIndex: 0,
    totalScore: 0,
    results: [],
    pieces: [],
    placedCount: 0,
    total: 0,
    gridN: 3,
    snapTol: 40,
    previewOn: true,
    stageStartTime: 0,
    timerHandle: null
  };

  function currentLevel() { return PD.LEVELS[state.levelIndex]; }
  function rankKey() { return currentLevel().id + "_" + state.difficulty; }

  // ---- Jigsaw piece geometry --------------------------------------------
  // Every internal edge is randomly a "tab" (bulges outward into the
  // neighbour) or a "blank" (cut inward); the neighbour's matching edge uses
  // the opposite sign so the two curves are mirror images of the same line
  // and always interlock regardless of which piece computes it first.
  function edgeSegment(x0, y0, x1, y1, dir) {
    if (!dir) return "L " + x1 + " " + y1 + " ";
    var dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy);
    var ux = dx / L, uy = dy / L;
    var nx = uy, ny = -ux; // outward normal for a clockwise-wound piece outline
    var bw = L * 0.16;
    var depth = L * 0.22 * dir;
    var mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    var sx = mx - ux * bw, sy = my - uy * bw;
    var ex = mx + ux * bw, ey = my + uy * bw;
    var bx = mx + nx * depth, by = my + ny * depth;
    var c1x = sx + nx * depth, c1y = sy + ny * depth;
    var c2x = bx - ux * bw * 0.5, c2y = by - uy * bw * 0.5;
    var c3x = bx + ux * bw * 0.5, c3y = by + uy * bw * 0.5;
    var c4x = ex + nx * depth, c4y = ey + ny * depth;
    return "L " + sx + " " + sy + " " +
      "C " + c1x + " " + c1y + " " + c2x + " " + c2y + " " + bx + " " + by + " " +
      "C " + c3x + " " + c3y + " " + c4x + " " + c4y + " " + ex + " " + ey + " " +
      "L " + x1 + " " + y1 + " ";
  }

  function piecePathD(x0, y0, x1, y1, topDir, rightDir, bottomDir, leftDir) {
    var d = "M " + x0 + " " + y0 + " ";
    d += edgeSegment(x0, y0, x1, y0, topDir);
    d += edgeSegment(x1, y0, x1, y1, rightDir);
    d += edgeSegment(x1, y1, x0, y1, bottomDir);
    d += edgeSegment(x0, y1, x0, y0, leftDir);
    d += "Z";
    return d;
  }

  function buildPiecePaths(rows, cols, size) {
    var r, c;
    var tabsH = []; // edge between row r / r+1 at column c -> direction from the ABOVE piece's viewpoint
    for (r = 0; r < rows - 1; r++) {
      var rowH = [];
      for (c = 0; c < cols; c++) rowH.push(Math.random() < 0.5 ? 1 : -1);
      tabsH.push(rowH);
    }
    var tabsV = []; // edge between col c / c+1 at row r -> direction from the LEFT piece's viewpoint
    for (r = 0; r < rows; r++) {
      var rowV = [];
      for (c = 0; c < cols - 1; c++) rowV.push(Math.random() < 0.5 ? 1 : -1);
      tabsV.push(rowV);
    }
    var pw = size / cols, ph = size / rows;
    var out = [];
    for (r = 0; r < rows; r++) {
      for (c = 0; c < cols; c++) {
        var x0 = c * pw, y0 = r * ph, x1 = x0 + pw, y1 = y0 + ph;
        var topDir = r > 0 ? -tabsH[r - 1][c] : 0;
        var bottomDir = r < rows - 1 ? tabsH[r][c] : 0;
        var leftDir = c > 0 ? -tabsV[r][c - 1] : 0;
        var rightDir = c < cols - 1 ? tabsV[r][c] : 0;
        out.push({ r: r, c: c, x0: x0, y0: y0, x1: x1, y1: y1, d: piecePathD(x0, y0, x1, y1, topDir, rightDir, bottomDir, leftDir) });
      }
    }
    return out;
  }

  // ---- Coordinate helpers -------------------------------------------------
  function boardToLocal(bx, by) {
    return { x: (bx - ART_G_TX) / ART_G_SCALE, y: (by - ART_G_TY) / ART_G_SCALE };
  }
  function randomTrayLocalPoint() {
    var bx = TRAY.x0 + Math.random() * (TRAY.x1 - TRAY.x0);
    var by = TRAY.y0 + Math.random() * (TRAY.y1 - TRAY.y0);
    return boardToLocal(bx, by);
  }
  function svgPoint(evt) {
    var pt = boardSvg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    var ctm = boardSvg.getScreenCTM().inverse();
    var p = pt.matrixTransform(ctm);
    return { x: p.x, y: p.y };
  }

  // ---- Level loading ----------------------------------------------------
  function loadLevel(idx) {
    state.levelIndex = idx;
    state.placedCount = 0;
    completionModal.classList.remove("show");

    var level = currentLevel();
    var n = DIFFS[state.difficulty].grid;
    state.gridN = n;
    state.total = n * n;
    state.snapTol = (ART_SIZE / n) * 0.28;

    artworkDefs.innerHTML = "";
    var artG = document.createElementNS(SVG_NS, "g");
    artG.setAttribute("id", "artwork-" + level.id);
    level.draw(artG);
    artworkDefs.appendChild(artG);

    clipDefs.innerHTML = "";
    layerTarget.innerHTML = "";
    layerPieces.innerHTML = "";

    var refUse = document.createElementNS(SVG_NS, "use");
    refUse.setAttribute("href", "#artwork-" + level.id);
    refUse.setAttributeNS(XLINK_NS, "href", "#artwork-" + level.id);
    refUse.setAttribute("class", "art-preview" + (state.previewOn ? "" : " hidden"));
    layerTarget.appendChild(refUse);

    var frame = document.createElementNS(SVG_NS, "rect");
    frame.setAttribute("x", 0); frame.setAttribute("y", 0);
    frame.setAttribute("width", ART_SIZE); frame.setAttribute("height", ART_SIZE);
    frame.setAttribute("class", "target-frame");
    layerTarget.appendChild(frame);

    var piecesData = buildPiecePaths(n, n, ART_SIZE);
    state.pieces = piecesData.map(function (p, i) {
      var clipId = "clip-" + i;
      var clip = document.createElementNS(SVG_NS, "clipPath");
      clip.setAttribute("id", clipId);
      var clipPath = document.createElementNS(SVG_NS, "path");
      clipPath.setAttribute("d", p.d);
      clip.appendChild(clipPath);
      clipDefs.appendChild(clip);

      var group = document.createElementNS(SVG_NS, "g");
      group.setAttribute("class", "piece");
      group.dataset.idx = i;
      var clipG = document.createElementNS(SVG_NS, "g");
      clipG.setAttribute("clip-path", "url(#" + clipId + ")");
      var useEl = document.createElementNS(SVG_NS, "use");
      useEl.setAttribute("href", "#artwork-" + level.id);
      useEl.setAttributeNS(XLINK_NS, "href", "#artwork-" + level.id);
      clipG.appendChild(useEl);
      group.appendChild(clipG);
      var outline = document.createElementNS(SVG_NS, "path");
      outline.setAttribute("class", "piece-outline");
      outline.setAttribute("d", p.d);
      group.appendChild(outline);

      var piece = {
        idx: i, x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y1,
        cx: (p.x0 + p.x1) / 2, cy: (p.y0 + p.y1) / 2,
        offset: { x: 0, y: 0 }, locked: false, groupEl: group
      };
      var tp = randomTrayLocalPoint();
      piece.offset.x = tp.x - piece.cx;
      piece.offset.y = tp.y - piece.cy;

      group.addEventListener("pointerdown", function (evt) { onPiecePointerDown(evt, piece); });
      layerPieces.appendChild(group);
      updatePieceTransform(piece);
      return piece;
    });

    updateHud();
    startTimer();
  }

  function updatePieceTransform(piece) {
    piece.groupEl.setAttribute("transform", "translate(" + piece.offset.x + " " + piece.offset.y + ")");
  }
  function bringToFront(piece) {
    layerPieces.appendChild(piece.groupEl);
  }

  function updateHud() {
    hudStageVal.textContent = (state.levelIndex + 1) + " / " + PD.LEVELS.length;
    hudLevelName.textContent = currentLevel().name;
    hudPiecesVal.textContent = state.placedCount + " / " + state.total;
    hudScoreVal.textContent = state.totalScore;
    progressFill.style.width = (state.levelIndex / PD.LEVELS.length * 100) + "%";
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

  // ---- Pointer drag / snap ------------------------------------------------
  var drag = null;

  function onPiecePointerDown(evt, piece) {
    if (piece.locked) return;
    if (completionModal.classList.contains("show")) return;
    evt.preventDefault();
    bringToFront(piece);
    piece.groupEl.classList.add("dragging");
    var p = svgPoint(evt);
    drag = { piece: piece, startX: p.x, startY: p.y, startOffX: piece.offset.x, startOffY: piece.offset.y };
    piece.groupEl.setPointerCapture(evt.pointerId);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function onPointerMove(evt) {
    if (!drag) return;
    var p = svgPoint(evt);
    var dx = (p.x - drag.startX) / ART_G_SCALE;
    var dy = (p.y - drag.startY) / ART_G_SCALE;
    drag.piece.offset.x = drag.startOffX + dx;
    drag.piece.offset.y = drag.startOffY + dy;
    updatePieceTransform(drag.piece);
  }

  function onPointerUp() {
    if (!drag) return;
    var piece = drag.piece;
    piece.groupEl.classList.remove("dragging");
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);

    var dist = Math.hypot(piece.offset.x, piece.offset.y);
    if (dist < state.snapTol) {
      piece.offset.x = 0; piece.offset.y = 0;
      piece.locked = true;
      updatePieceTransform(piece);
      piece.groupEl.classList.add("locked", "just-locked");
      setTimeout(function () { piece.groupEl.classList.remove("just-locked"); }, 400);
      state.placedCount++;
      updateHud();
      playClick();
      if (state.placedCount === state.total) finishStage();
    }
    drag = null;
  }

  // ---- Completion ---------------------------------------------------------
  function computeStars(elapsed, par) {
    if (elapsed <= par * 0.5) return 5;
    if (elapsed <= par * 0.75) return 4;
    if (elapsed <= par * 1.0) return 3;
    if (elapsed <= par * 1.5) return 2;
    return 1;
  }

  function finishStage() {
    stopTimer();
    var elapsed = elapsedStage();
    var diff = DIFFS[state.difficulty];
    var stars = computeStars(elapsed, diff.par);
    var scoreGain = Math.round(stars * 20 * diff.scoreMult);
    state.totalScore += scoreGain;
    state.results.push({ name: currentLevel().name, elapsed: elapsed, gain: scoreGain, stars: stars });
    recordStars(rankKey(), stars);
    recordTime(rankKey(), elapsed);
    updateHud();

    completionStarsEl.innerHTML = starsHtml(stars, 5);
    completionPercentEl.textContent = elapsed.toFixed(1) + "초 만에 완성!";
    completionScoreEl.textContent = "+" + scoreGain + "점";
    completionModal.classList.add("show");
    playClear();
  }

  function goToNextLevelOrResult() {
    completionModal.classList.remove("show");
    if (state.levelIndex + 1 < PD.LEVELS.length) {
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
    var rows = ["<tr><th>그림</th><th>별</th><th>시간</th><th>점수</th></tr>"];
    state.results.forEach(function (r) {
      rows.push(
        "<tr><td>" + r.name + "</td><td class=\"result-stars\">" + starsHtml(r.stars, 5) + "</td><td>" +
        r.elapsed.toFixed(1) + "초</td><td>+" + r.gain + "</td></tr>"
      );
    });
    table.innerHTML = rows.join("");
  }

  // ---- Ranking modal ------------------------------------------------------
  function openRanking(levelIndex) {
    var level = PD.LEVELS[levelIndex];
    var key = level.id + "_" + state.difficulty;
    rankingStageLabel.textContent = DIFFS[state.difficulty].label + " · " + level.name;
    rankingList.innerHTML = "";
    rankingModal.classList.add("show");

    var rows = localRanking(key, 5);
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

  // ---- Level select ------------------------------------------------------
  function buildLevelGrid() {
    levelGrid.innerHTML = "";
    var starsMap = loadStars();
    PD.LEVELS.forEach(function (lvl, i) {
      var btn = document.createElement("button");
      btn.className = "level-grid-btn";
      var emoji = document.createElement("div");
      emoji.className = "lvl-emoji";
      emoji.textContent = lvl.emoji;
      var name = document.createElement("div");
      name.className = "lvl-name";
      name.textContent = lvl.name;
      var starsEl = document.createElement("div");
      starsEl.className = "lvl-stars";
      var key = lvl.id + "_" + state.difficulty;
      var st = starsMap[key] || 0;
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
      btn.appendChild(emoji);
      btn.appendChild(name);
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
  document.getElementById("btn-diff-back").addEventListener("click", function () { showScreen("title"); });

  document.getElementById("btn-user-guest").addEventListener("click", function () {
    currentUser = null;
    guestMode = true;
    guestStars = {};
    updateUserBadge();
    showScreen("difficulty");
  });
  function submitNewUser() {
    var name = userNameInput.value.trim();
    if (!name) return;
    ensureProfile(name);
    currentUser = name;
    guestMode = false;
    updateUserBadge();
    showScreen("difficulty");
  }
  document.getElementById("btn-user-new-start").addEventListener("click", submitNewUser);
  userNameInput.addEventListener("keydown", function (evt) {
    if (evt.key === "Enter") submitNewUser();
  });
  document.getElementById("btn-user-back").addEventListener("click", function () { showScreen("title"); });

  Array.prototype.forEach.call(document.querySelectorAll(".diff-btn"), function (btn) {
    btn.addEventListener("click", function () {
      state.difficulty = btn.dataset.diff;
      goToLevelSelect();
    });
  });

  document.getElementById("btn-levelselect-diff").addEventListener("click", function () { showScreen("difficulty"); });
  document.getElementById("btn-levelselect-title").addEventListener("click", function () { showScreen("title"); });

  document.getElementById("btn-quit").addEventListener("click", function () {
    stopTimer();
    goToLevelSelect();
  });
  document.getElementById("btn-retry").addEventListener("click", goToLevelSelect);
  document.getElementById("btn-to-title").addEventListener("click", function () { showScreen("title"); });

  btnPreview.addEventListener("click", function () {
    state.previewOn = !state.previewOn;
    var ref = layerTarget.querySelector(".art-preview");
    if (ref) ref.classList.toggle("hidden", !state.previewOn);
    btnPreview.classList.toggle("btn-toggle-on", state.previewOn);
  });
  document.getElementById("btn-shuffle").addEventListener("click", function () {
    state.pieces.forEach(function (piece) {
      if (piece.locked) return;
      var tp = randomTrayLocalPoint();
      piece.offset.x = tp.x - piece.cx;
      piece.offset.y = tp.y - piece.cy;
      updatePieceTransform(piece);
    });
    playClick();
  });

  document.getElementById("btn-completion-next").addEventListener("click", goToNextLevelOrResult);
  document.getElementById("btn-completion-list").addEventListener("click", function () {
    completionModal.classList.remove("show");
    goToLevelSelect();
  });
  document.getElementById("btn-completion-rank").addEventListener("click", function () {
    openRanking(state.levelIndex);
  });
  document.getElementById("btn-ranking-close").addEventListener("click", closeRanking);

  showScreen("title");
})();
