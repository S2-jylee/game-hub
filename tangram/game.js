(function () {
  "use strict";

  var TD = window.TangramData;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var VB_W = 900, VB_H = 600;

  // Beyond these, a piece counts as "way off" and completion is rejected.
  var FAIL_POS_TOL = 1.0;    // unit-space centroid distance
  var FAIL_ANGLE_TOL = 45;   // degrees

  var PROFILES_KEY = "tangram_profiles_v1";

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
  var layerTarget = document.getElementById("layer-target");
  var layerPieces = document.getElementById("layer-pieces");
  var layerToolbar = document.getElementById("layer-toolbar");
  var hudStageVal = document.getElementById("hud-stage-val");
  var hudLevelName = document.getElementById("hud-level-name");
  var hudTimerVal = document.getElementById("hud-timer-val");
  var hudScoreVal = document.getElementById("hud-score-val");
  var progressFill = document.getElementById("stage-progress-fill");
  var levelGrid = document.getElementById("level-grid");
  var levelSelectDiffLabel = document.getElementById("levelselect-diff-label");
  var btnFlip = document.getElementById("btn-flip");

  var completionModal = document.getElementById("completion-modal");
  var completionStarsEl = document.getElementById("completion-stars");
  var completionPercentEl = document.getElementById("completion-percent");
  var completionScoreEl = document.getElementById("completion-score");

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
  // Each profile keeps its own star map, keyed by name, so several people
  // sharing this PC don't overwrite each other's progress. Guest play is
  // kept in memory only and never touches storage.
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
  function playClick() { beep(440, 0.06, 0, "square", 0.06); }
  function playRetry() { beep(300, 0.1, 0, "sawtooth", 0.1); beep(220, 0.16, 0.08, "sawtooth", 0.1); }

  // ---- Game state -----------------------------------------------------
  var state = {
    difficulty: "easy",
    levelIndex: 0,
    totalScore: 0,
    results: [],       // {name, elapsed, gain, stars, percent}
    slots: [],          // target slots for current level
    pieces: [],         // physical draggable pieces for current level
    selectedId: null,
    stageStartTime: 0,
    timerHandle: null,
    unitScale: 60,
    offsetX: 0,
    offsetY: 0
  };

  function currentLevel() { return TD.LEVELS[state.levelIndex]; }

  function localCentroid(shape) {
    var sx = 0, sy = 0;
    shape.forEach(function (p) { sx += p[0]; sy += p[1]; });
    return [sx / shape.length, sy / shape.length];
  }

  // Distance from centroid to the polygon boundary along a fixed local
  // direction (straight "up", before rotation). The rotate handle is placed
  // this far out - along the SAME local direction, which then rotates with
  // the piece - so it hugs the actual silhouette instead of orbiting at a
  // generic "farthest corner" radius that's way too wide for most pieces.
  function localUpExtent(shape, centroid) {
    var dx = 0, dy = -1;
    var best = Infinity;
    var n = shape.length;
    for (var i = 0; i < n; i++) {
      var a = shape[i], b = shape[(i + 1) % n];
      var abx = b[0] - a[0], aby = b[1] - a[1];
      var det = abx * dy - aby * dx;
      if (Math.abs(det) < 1e-9) continue;
      var acx = a[0] - centroid[0], acy = a[1] - centroid[1];
      var t = (abx * acy - aby * acx) / det;
      var s = (dx * acy - dy * acx) / det;
      if (t > 1e-6 && s >= -1e-6 && s <= 1 + 1e-6 && t < best) best = t;
    }
    return isFinite(best) ? best : 1;
  }

  // ---- Level loading ----------------------------------------------------
  function loadLevel(idx) {
    state.levelIndex = idx;
    state.selectedId = null;
    completionModal.classList.remove("show", "show-retry", "show-success");

    var level = TD.LEVELS[idx];
    var resolved = TD.resolveSlots(level.slots); // [{shape,chiral,symmetry,transform,localShape,worldVerts,centroid}]

    // bounding box of target in unit space
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    resolved.forEach(function (p) {
      p.worldVerts.forEach(function (v) {
        minX = Math.min(minX, v[0]); maxX = Math.max(maxX, v[0]);
        minY = Math.min(minY, v[1]); maxY = Math.max(maxY, v[1]);
      });
    });
    var bw = maxX - minX, bh = maxY - minY;
    var targetAreaW = 480, targetAreaH = 300;
    var scale = Math.min(targetAreaW / bw, targetAreaH / bh);
    scale = Math.max(38, Math.min(92, scale));
    state.unitScale = scale;

    var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    state.offsetX = VB_W / 2 - cx * scale;
    state.offsetY = 195 - cy * scale;

    // Build slots (targets) - identified by SHAPE only, not tied to any one
    // physical piece; matching at completion time pairs pieces to slots by
    // best fit within same-shape groups, so duplicate pieces are interchangeable.
    state.slots = resolved.map(function (p) {
      return {
        shape: p.shape,
        chiral: p.chiral,
        symmetry: p.symmetry,
        angleDeg: p.transform.angle * 180 / Math.PI,
        flip: p.transform.flip,
        centroidPx: { x: p.centroid[0] * scale + state.offsetX, y: p.centroid[1] * scale + state.offsetY }
      };
    });

    // Build the matching multiset of physical draggable pieces.
    var shapeCounts = {};
    state.pieces = level.slots.map(function (s, i) {
      var n = shapeCounts[s.shape] || 0;
      shapeCounts[s.shape] = n + 1;
      var colors = TD.SHAPE_COLORS[s.shape];
      var localShape = TD.SHAPES[s.shape];
      var lc = localCentroid(localShape);
      return {
        id: "piece" + i,
        shape: s.shape,
        color: colors[n % colors.length],
        chiral: !!TD.CHIRAL_SHAPES[s.shape],
        symmetry: TD.SHAPE_SYMMETRY[s.shape] || 360,
        localShape: localShape,
        localCentroid: lc,
        handleRadiusPx: localUpExtent(localShape, lc) * scale + 24,
        current: { x: 0, y: 0, angleDeg: 0, flip: false },
        el: null,
        groupEl: null
      };
    });

    layoutTray();
    renderTarget(resolved, scale);
    renderPieces(true);
    updateHud();
    startTimer();
    updateRotateHandle();
    updateFlipButton();
  }

  function localBBox(shape) {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shape.forEach(function (v) {
      minX = Math.min(minX, v[0]); maxX = Math.max(maxX, v[0]);
      minY = Math.min(minY, v[1]); maxY = Math.max(maxY, v[1]);
    });
    return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY };
  }

  function layoutTray() {
    var n = state.pieces.length;
    var trayTop = 400;
    var trayBottom = 560;
    var cols = n;
    var slotW = (VB_W - 60) / cols;
    state.pieces.forEach(function (piece, i) {
      var bb = localBBox(piece.localShape);
      var slotX = 30 + slotW * (i + 0.5);
      var slotY = trayTop + (trayBottom - trayTop) / 2;
      piece.current.x = slotX - bb.cx * state.unitScale;
      piece.current.y = slotY - bb.cy * state.unitScale;
      piece.current.angleDeg = 0;
      piece.current.flip = false;
    });
  }

  function renderTarget(resolved, scale) {
    layerTarget.innerHTML = "";
    var hard = state.difficulty === "hard";
    resolved.forEach(function (p) {
      var poly = document.createElementNS(SVG_NS, "polygon");
      var pts = p.worldVerts.map(function (v) {
        return (v[0] * scale + state.offsetX) + "," + (v[1] * scale + state.offsetY);
      }).join(" ");
      poly.setAttribute("points", pts);
      poly.setAttribute("class", hard ? "target-poly hard" : "target-poly");
      layerTarget.appendChild(poly);
    });
  }

  function pointsAttr(shape, scale) {
    return shape.map(function (v) { return (v[0] * scale) + "," + (v[1] * scale); }).join(" ");
  }

  function renderPieces(rebuild) {
    if (rebuild) layerPieces.innerHTML = "";
    state.pieces.forEach(function (piece) {
      var el = piece.el;
      if (!el) {
        // Positional transform (translate/rotate/flip) lives on the wrapping <g>.
        var group = document.createElementNS(SVG_NS, "g");
        el = document.createElementNS(SVG_NS, "polygon");
        el.setAttribute("points", pointsAttr(piece.localShape, state.unitScale));
        el.setAttribute("fill", piece.color);
        el.setAttribute("class", "piece-poly");
        el.dataset.id = piece.id;
        el.addEventListener("pointerdown", onPointerDown);
        group.appendChild(el);
        layerPieces.appendChild(group);
        piece.el = el;
        piece.groupEl = group;
      }
      updatePieceTransform(piece);
    });
  }

  function updatePieceTransform(piece) {
    var c = piece.current;
    var transform;
    if (c.flip) {
      // Mirror across a screen-vertical line through the piece's CURRENT
      // (already-rotated) centroid, applied after the rotation - so flip
      // always turns over whatever is on screen right now, instead of
      // mirroring the pre-rotation shape and then re-applying the old
      // rotation on top (which made flipping a rotated piece look like it
      // was flipping some other, unrotated version of it).
      var rad = c.angleDeg * Math.PI / 180;
      var lc = piece.localCentroid;
      var rx = (lc[0] * state.unitScale) * Math.cos(rad) - (lc[1] * state.unitScale) * Math.sin(rad);
      transform =
        "translate(" + c.x + " " + c.y + ") " +
        "translate(" + (2 * rx) + " 0) scale(-1 1) " +
        "rotate(" + c.angleDeg + ")";
    } else {
      transform = "translate(" + c.x + " " + c.y + ") rotate(" + c.angleDeg + ")";
    }
    piece.groupEl.setAttribute("transform", transform);
    piece.el.classList.toggle("selected", state.selectedId === piece.id);
    if (state.selectedId === piece.id) updateRotateHandle();
  }

  function updateHud() {
    hudStageVal.textContent = (state.levelIndex + 1) + " / " + TD.LEVELS.length;
    hudLevelName.textContent = currentLevel().name;
    hudScoreVal.textContent = state.totalScore;
    progressFill.style.width = ((state.levelIndex) / TD.LEVELS.length * 100) + "%";
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

  // ---- Pointer interaction --------------------------------------------
  var drag = null; // {piece, startX, startY, pieceStartX, pieceStartY, moved}

  function svgPoint(evt) {
    var pt = boardSvg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    var ctm = boardSvg.getScreenCTM().inverse();
    var p = pt.matrixTransform(ctm);
    return { x: p.x, y: p.y };
  }

  function findPiece(id) {
    for (var i = 0; i < state.pieces.length; i++) if (state.pieces[i].id === id) return state.pieces[i];
    return null;
  }

  function selectPiece(piece) {
    state.selectedId = piece ? piece.id : null;
    state.pieces.forEach(updatePieceTransform);
    updateRotateHandle();
    updateFlipButton();
  }

  function updateFlipButton() {
    btnFlip.disabled = !state.selectedId;
  }

  function bringToFront(piece) {
    layerPieces.appendChild(piece.groupEl);
  }

  function onPointerDown(evt) {
    var id = evt.currentTarget.dataset.id;
    var piece = findPiece(id);
    if (!piece) return;
    evt.preventDefault();
    var wasSelected = state.selectedId === piece.id;
    bringToFront(piece);
    selectPiece(piece);
    var p = svgPoint(evt);
    drag = {
      piece: piece,
      startX: p.x, startY: p.y,
      pieceStartX: piece.current.x, pieceStartY: piece.current.y,
      moved: false,
      wasSelected: wasSelected
    };
    evt.currentTarget.classList.add("dragging");
    evt.currentTarget.setPointerCapture(evt.pointerId);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function onPointerMove(evt) {
    if (!drag) return;
    var p = svgPoint(evt);
    var dx = p.x - drag.startX, dy = p.y - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    drag.piece.current.x = drag.pieceStartX + dx;
    drag.piece.current.y = drag.pieceStartY + dy;
    updatePieceTransform(drag.piece);
  }

  function onPointerUp(evt) {
    if (!drag) return;
    var piece = drag.piece;
    piece.el.classList.remove("dragging");
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    if (!drag.moved && drag.wasSelected) {
      // tap on an already-selected piece = rotate 45 deg. A tap that only
      // just selected the piece stops there, so picking a piece never also
      // spins it before the player has chosen what to do with it.
      piece.current.angleDeg = normalizeDeg(piece.current.angleDeg + 45);
      updatePieceTransform(piece);
      playClick();
    }
    drag = null;
  }

  function normalizeDeg(a) {
    a = a % 360;
    if (a < 0) a += 360;
    return a;
  }

  function angleDiffMod(a, b, period) {
    var d = Math.abs(normalizeDeg(a) - normalizeDeg(b)) % period;
    if (d > period / 2) d = period - d;
    return d;
  }

  // World-space centroid of a piece at its CURRENT pose (rotation-invariant
  // reference point, so which of several symmetry-equivalent angles the
  // player used doesn't matter - only the shape's actual final position does).
  function pieceCentroidPx(piece) {
    var lc = piece.localCentroid;
    // Flip now mirrors the piece around this same centroid (see
    // updatePieceTransform), so the centroid itself never moves under a flip.
    var p = [lc[0] * state.unitScale, lc[1] * state.unitScale];
    var rad = piece.current.angleDeg * Math.PI / 180;
    var c = Math.cos(rad), s = Math.sin(rad);
    var rx = p[0] * c - p[1] * s, ry = p[0] * s + p[1] * c;
    return { x: rx + piece.current.x, y: ry + piece.current.y };
  }

  // ---- Rotate handle (drag-to-rotate) ----------------------------------
  var handleGroup = document.createElementNS(SVG_NS, "g");
  handleGroup.setAttribute("class", "rotate-handle-group");
  var handleLine = document.createElementNS(SVG_NS, "line");
  handleLine.setAttribute("class", "rotate-handle-line");
  var handleKnob = document.createElementNS(SVG_NS, "circle");
  handleKnob.setAttribute("r", 17);
  handleKnob.setAttribute("class", "rotate-handle-knob");
  var handleGlyph = document.createElementNS(SVG_NS, "text");
  handleGlyph.setAttribute("class", "rotate-handle-glyph");
  handleGlyph.setAttribute("text-anchor", "middle");
  handleGlyph.setAttribute("dominant-baseline", "central");
  handleGlyph.textContent = "↻";
  handleGroup.appendChild(handleLine);
  handleGroup.appendChild(handleKnob);
  handleGroup.appendChild(handleGlyph);
  handleGroup.style.display = "none";
  layerToolbar.appendChild(handleGroup);

  function updateRotateHandle() {
    var piece = state.selectedId ? findPiece(state.selectedId) : null;
    if (!piece) { handleGroup.style.display = "none"; return; }
    var c = pieceCentroidPx(piece);
    var theta = (piece.current.angleDeg - 90) * Math.PI / 180;
    var hx = c.x + piece.handleRadiusPx * Math.cos(theta);
    var hy = c.y + piece.handleRadiusPx * Math.sin(theta);
    handleLine.setAttribute("x1", c.x); handleLine.setAttribute("y1", c.y);
    handleLine.setAttribute("x2", hx); handleLine.setAttribute("y2", hy);
    handleKnob.setAttribute("cx", hx); handleKnob.setAttribute("cy", hy);
    handleGlyph.setAttribute("x", hx); handleGlyph.setAttribute("y", hy);
    handleGroup.style.display = "";
  }

  var rotateDrag = null; // {piece, centroid, startPointerAngle, startPieceAngle}

  function onHandlePointerDown(evt) {
    var piece = state.selectedId ? findPiece(state.selectedId) : null;
    if (!piece) return;
    evt.preventDefault();
    evt.stopPropagation();
    var centroid = pieceCentroidPx(piece);
    var p = svgPoint(evt);
    var startPointerAngle = Math.atan2(p.y - centroid.y, p.x - centroid.x) * 180 / Math.PI;
    rotateDrag = { piece: piece, centroid: centroid, startPointerAngle: startPointerAngle, startPieceAngle: piece.current.angleDeg };
    handleKnob.setPointerCapture(evt.pointerId);
    window.addEventListener("pointermove", onHandlePointerMove);
    window.addEventListener("pointerup", onHandlePointerUp);
  }

  function onHandlePointerMove(evt) {
    if (!rotateDrag) return;
    var p = svgPoint(evt);
    var angleNow = Math.atan2(p.y - rotateDrag.centroid.y, p.x - rotateDrag.centroid.x) * 180 / Math.PI;
    var delta = angleNow - rotateDrag.startPointerAngle;
    rotateDrag.piece.current.angleDeg = normalizeDeg(rotateDrag.startPieceAngle + delta);
    updatePieceTransform(rotateDrag.piece);
  }

  function onHandlePointerUp(evt) {
    if (!rotateDrag) return;
    window.removeEventListener("pointermove", onHandlePointerMove);
    window.removeEventListener("pointerup", onHandlePointerUp);
    rotateDrag = null;
    playClick();
  }

  handleKnob.addEventListener("pointerdown", onHandlePointerDown);

  function rotateSelected(dir) {
    if (!state.selectedId) return;
    var piece = findPiece(state.selectedId);
    if (!piece) return;
    piece.current.angleDeg = normalizeDeg(piece.current.angleDeg + dir * 45);
    updatePieceTransform(piece);
    playClick();
  }

  function flipSelected() {
    if (!state.selectedId) return;
    var piece = findPiece(state.selectedId);
    if (!piece) return;
    piece.current.flip = !piece.current.flip;
    updatePieceTransform(piece);
    playClick();
  }

  // ---- Completion evaluation ---------------------------------------------
  // Pairs each physical piece with its best-fitting UNfilled slot of the same
  // shape (duplicate pieces are interchangeable - only shape identity matters),
  // then scores the whole board by how close every pairing actually is.
  function groupIndicesByShape(list) {
    var map = {};
    list.forEach(function (item, i) {
      (map[item.shape] = map[item.shape] || []).push(i);
    });
    return map;
  }

  function bestAssignmentForGroup(pieceIdxs, slotIdxs, costFn) {
    var n = pieceIdxs.length;
    var perm = slotIdxs.slice();
    var bestPerm = null, bestCost = Infinity;
    function permute(k) {
      if (k === n) {
        var cost = 0;
        for (var i = 0; i < n; i++) cost += costFn(pieceIdxs[i], perm[i]);
        if (cost < bestCost) { bestCost = cost; bestPerm = perm.slice(); }
        return;
      }
      for (var i = k; i < n; i++) {
        var tmp = perm[k]; perm[k] = perm[i]; perm[i] = tmp;
        permute(k + 1);
        tmp = perm[k]; perm[k] = perm[i]; perm[i] = tmp;
      }
    }
    permute(0);
    return bestPerm;
  }

  function pieceSlotDeviation(piece, slot) {
    var pc = pieceCentroidPx(piece);
    var dxu = (pc.x - slot.centroidPx.x) / state.unitScale;
    var dyu = (pc.y - slot.centroidPx.y) / state.unitScale;
    var dist = Math.sqrt(dxu * dxu + dyu * dyu);

    // Only a truly chiral piece (the parallelogram) needs its flip state to
    // match literally - no rotation can turn one handedness into the other.
    // Every other shape has a mirror axis, so a flipped piece already looks
    // exactly like *some* unflipped rotation; compare against that instead
    // of the raw angle, so completion judges the piece's actual appearance
    // rather than which controls (rotate vs flip) the player happened to use.
    var flipOk, effectiveAngle;
    if (piece.chiral) {
      flipOk = piece.current.flip === slot.flip;
      effectiveAngle = piece.current.angleDeg;
    } else {
      flipOk = true;
      // Flip mirrors across a screen-fixed vertical axis after rotation, so
      // (unlike a plain rotation) it reverses the angle's sense: flipping a
      // piece rotated by θ looks the same as rotating an unflipped piece by
      // (offset - θ), not (θ + offset).
      var offset = TD.SHAPE_FLIP_ROTATE_OFFSET[piece.shape] || 0;
      effectiveAngle = piece.current.flip ? (offset - piece.current.angleDeg) : piece.current.angleDeg;
    }
    var angleDiff = angleDiffMod(effectiveAngle, slot.angleDeg, piece.symmetry);
    return { dist: dist, angleDiff: angleDiff, flipOk: flipOk };
  }

  function evaluateCompletion() {
    var pieces = state.pieces, slots = state.slots;
    var pieceGroups = groupIndicesByShape(pieces);
    var slotGroups = groupIndicesByShape(slots);
    var assignment = new Array(pieces.length).fill(-1);

    function costFn(pieceIdx, slotIdx) {
      var d = pieceSlotDeviation(pieces[pieceIdx], slots[slotIdx]);
      return d.dist + d.angleDiff / 90 + (d.flipOk ? 0 : 5);
    }

    Object.keys(pieceGroups).forEach(function (shape) {
      var pIdxs = pieceGroups[shape], sIdxs = slotGroups[shape] || [];
      var perm = bestAssignmentForGroup(pIdxs, sIdxs, costFn);
      pIdxs.forEach(function (pIdx, k) { assignment[pIdx] = perm[k]; });
    });

    var anyFail = false;
    var totalScore = 0;
    pieces.forEach(function (piece, i) {
      var slot = slots[assignment[i]];
      var d = pieceSlotDeviation(piece, slot);
      if (d.dist > FAIL_POS_TOL || d.angleDiff > FAIL_ANGLE_TOL || !d.flipOk) anyFail = true;
      var posScore = Math.max(0, 1 - d.dist / FAIL_POS_TOL);
      var angleScore = Math.max(0, 1 - d.angleDiff / FAIL_ANGLE_TOL);
      var flipScore = d.flipOk ? 1 : 0;
      totalScore += posScore * 0.5 + angleScore * 0.3 + flipScore * 0.2;
    });

    if (anyFail) return { ok: false };

    var accuracyPercent = (totalScore / pieces.length) * 100;
    var elapsed = elapsedStage();
    var idealTime = pieces.length * 3.5;
    var timeScore = Math.max(40, Math.min(100, 100 - Math.max(0, elapsed - idealTime) * 4));
    var finalPercent = Math.round(accuracyPercent * 0.75 + timeScore * 0.25);
    finalPercent = Math.max(0, Math.min(100, finalPercent));
    var stars = finalPercent >= 95 ? 5 : finalPercent >= 85 ? 4 : finalPercent >= 70 ? 3 : finalPercent >= 50 ? 2 : 1;
    var scoreGain = Math.round(finalPercent * 10);

    return { ok: true, finalPercent: finalPercent, stars: stars, scoreGain: scoreGain, elapsed: elapsed };
  }

  // ---- Complete button / modal --------------------------------------------
  function onCompleteClick() {
    if (completionModal.classList.contains("show")) return;
    var result = evaluateCompletion();
    if (!result.ok) {
      completionModal.classList.add("show", "show-retry");
      playRetry();
      return;
    }

    stopTimer();
    state.totalScore += result.scoreGain;
    state.results.push({
      name: currentLevel().name, elapsed: result.elapsed,
      gain: result.scoreGain, stars: result.stars, percent: result.finalPercent
    });
    recordStars(currentLevel().id, result.stars);
    updateHud();

    completionStarsEl.innerHTML = starsHtml(result.stars, 5);
    completionPercentEl.textContent = result.finalPercent + "% 완성";
    completionScoreEl.textContent = "+" + result.scoreGain + "점";
    completionModal.classList.add("show", "show-success");
    playClear();
  }

  function closeRetryModal() {
    completionModal.classList.remove("show", "show-retry");
  }

  function goToNextLevelOrResult() {
    completionModal.classList.remove("show", "show-success");
    if (state.levelIndex + 1 < TD.LEVELS.length) {
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
    var rows = ["<tr><th>모양</th><th>별</th><th>시간</th><th>점수</th></tr>"];
    state.results.forEach(function (r) {
      rows.push(
        "<tr><td>" + r.name + "</td><td class=\"result-stars\">" + starsHtml(r.stars, 5) + "</td><td>" +
        r.elapsed.toFixed(1) + "초</td><td>+" + r.gain + "</td></tr>"
      );
    });
    table.innerHTML = rows.join("");
  }

  // ---- Level select ------------------------------------------------------
  function buildLevelGrid() {
    levelGrid.innerHTML = "";
    var starsMap = loadStars();
    TD.LEVELS.forEach(function (lvl, i) {
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
      btn.appendChild(num);
      btn.appendChild(starsEl);
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
      levelSelectDiffLabel.textContent = state.difficulty === "hard" ? "어려움" : "쉬움";
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
  document.getElementById("btn-rotate-left").addEventListener("click", function () { rotateSelected(-1); });
  document.getElementById("btn-rotate-right").addEventListener("click", function () { rotateSelected(1); });
  document.getElementById("btn-flip").addEventListener("click", flipSelected);
  document.getElementById("btn-complete").addEventListener("click", onCompleteClick);
  document.getElementById("btn-completion-retry-ok").addEventListener("click", closeRetryModal);
  document.getElementById("btn-completion-next").addEventListener("click", goToNextLevelOrResult);
  document.getElementById("btn-completion-list").addEventListener("click", function () {
    completionModal.classList.remove("show", "show-success");
    goToLevelSelect();
  });

  buildLevelGrid();
  showScreen("title");
})();
