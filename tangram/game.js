(function () {
  "use strict";

  var TD = window.TangramData;
  var SVG_NS = "http://www.w3.org/2000/svg";
  // VB_W is a fixed reference frame; VB_H is set per-level from the actual
  // board-wrap's on-screen aspect ratio (see updateViewBoxHeight) so the
  // viewBox always matches the real container and "meet" scaling doesn't
  // waste space letterboxing top/bottom or left/right.
  var VB_W = 1200, VB_H = 650;

  // Piece tray lives in a column on the right; the target board gets
  // everything to the left of it.
  var TRAY_WIDTH = 480;
  var TRAY_X0 = VB_W - TRAY_WIDTH;
  var TRAY_MARGIN = 16;
  var TRAY_GAP = 14;
  var TRAY_TOP = 20;
  var TRAY_USABLE_W = TRAY_WIDTH - TRAY_MARGIN * 2;
  var TARGET_AREA_W = TRAY_X0 - 40;
  var TARGET_CENTER_X = TRAY_X0 / 2;
  // Recomputed alongside VB_H in updateViewBoxHeight().
  var TRAY_USABLE_H = VB_H - TRAY_TOP * 2;
  var TARGET_AREA_H = VB_H - 40;
  var TARGET_CENTER_Y = VB_H / 2;

  // Within this distance/angle of a slot, a dropped piece snaps into place.
  // The angle tolerance is kept well under one 45-degree rotate step so that
  // rotating a piece away from a slot it's sitting near reliably clears
  // snap range instead of the piece re-snapping right back on every click.
  var SNAP_POS_TOL = 1.0;    // unit-space centroid distance
  var SNAP_ANGLE_TOL = 20;   // degrees

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
  var progressFill = document.getElementById("stage-progress-fill");
  var levelGrid = document.getElementById("level-grid");
  var levelSelectDiffLabel = document.getElementById("levelselect-diff-label");
  var btnFlip = document.getElementById("btn-flip");
  var btnHint = document.getElementById("btn-hint");

  var completionModal = document.getElementById("completion-modal");

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
  // Each profile keeps its own cleared-level map, keyed by name, so several
  // people sharing this PC don't overwrite each other's progress. Guest play
  // is kept in memory only and never touches storage.
  var currentUser = null;
  var guestMode = false;
  var guestCleared = {};

  function loadProfiles() {
    try { return JSON.parse(localStorage.getItem(PROFILES_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveProfiles(profiles) {
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)); } catch (e) { /* storage unavailable, ignore */ }
  }
  function ensureProfile(name) {
    var profiles = loadProfiles();
    if (!profiles[name]) {
      profiles[name] = { cleared: {} };
      saveProfiles(profiles);
    }
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
      btn.appendChild(nameSpan);
      btn.addEventListener("click", function () {
        currentUser = name;
        guestMode = false;
        updateUserBadge();
        showScreen("difficulty");
      });
      userListEl.appendChild(btn);
    });
  }

  // ---- Cleared-level storage (scoped to the active user) -----------------
  function loadCleared() {
    if (guestMode) return guestCleared;
    if (!currentUser) return {};
    var profiles = loadProfiles();
    return (profiles[currentUser] && profiles[currentUser].cleared) || {};
  }
  function markCleared(levelId) {
    if (guestMode) { guestCleared[levelId] = true; return; }
    if (!currentUser) return;
    var profiles = loadProfiles();
    profiles[currentUser] = profiles[currentUser] || { cleared: {} };
    profiles[currentUser].cleared[levelId] = true;
    saveProfiles(profiles);
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
    slots: [],          // target slots for current level
    pieces: [],         // physical draggable pieces for current level
    slotOccupant: [],   // slotOccupant[i] = id of the piece snapped into slots[i], or null
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

  // Matches the viewBox height to board-wrap's actual current aspect ratio,
  // so "meet" scaling fills the real container edge-to-edge on whatever
  // device/orientation this happens to be, instead of letterboxing based on
  // a guessed ratio. Only read at level-load time (not on resize) so an
  // in-progress board never gets rebuilt out from under the player.
  function updateViewBoxHeight() {
    var w = boardSvg.parentElement.clientWidth, h = boardSvg.parentElement.clientHeight;
    if (w > 0 && h > 0) {
      VB_H = Math.max(500, Math.min(900, Math.round(VB_W * h / w)));
    }
    TRAY_USABLE_H = VB_H - TRAY_TOP * 2;
    TARGET_AREA_H = VB_H - 40;
    TARGET_CENTER_Y = VB_H / 2;
    boardSvg.setAttribute("viewBox", "0 0 " + VB_W + " " + VB_H);
  }

  // ---- Level loading ----------------------------------------------------
  function loadLevel(idx) {
    updateViewBoxHeight();
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
    var areaScale = Math.min(TARGET_AREA_W / bw, TARGET_AREA_H / bh);
    areaScale = Math.max(38, Math.min(260, areaScale));
    var trayShapes = level.slots.map(function (s) { return TD.SHAPES[s.shape]; });
    var scale = fitTrayScale(trayShapes, areaScale);
    state.unitScale = scale;

    var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    state.offsetX = TARGET_CENTER_X - cx * scale;
    state.offsetY = TARGET_CENTER_Y - cy * scale;

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
        snappedSlot: null,
        el: null,
        groupEl: null
      };
    });
    state.slotOccupant = new Array(state.slots.length).fill(null);

    layoutTray();
    renderTarget(resolved, scale);
    renderPieces(true);
    updateHud();
    startTimer();
    updateRotateHandle();
    updateFlipButton();
    resetHint();
    btnHint.hidden = state.difficulty !== "hard";
  }

  function localBBox(shape) {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shape.forEach(function (v) {
      minX = Math.min(minX, v[0]); maxX = Math.max(maxX, v[0]);
      minY = Math.min(minY, v[1]); maxY = Math.max(maxY, v[1]);
    });
    return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY };
  }

  // Lays shapes out left-to-right, wrapping into a new row when the next
  // one wouldn't fit within TRAY_USABLE_W - a plain shelf packer. Used both
  // to size-check candidate scales (fitTrayScale) and to actually place the
  // pieces (layoutTray), so what's checked is exactly what's rendered.
  function packShelves(shapes, scale) {
    var x = 0, y = 0, rowH = 0;
    var positions = shapes.map(function (shape) {
      var bb = localBBox(shape);
      var w = bb.w * scale, h = bb.h * scale;
      if (x > 0 && x + w > TRAY_USABLE_W) { x = 0; y += rowH + TRAY_GAP; rowH = 0; }
      var pos = { x: x, y: y, w: w, h: h, bb: bb };
      x += w + TRAY_GAP;
      rowH = Math.max(rowH, h);
      return pos;
    });
    return { positions: positions, totalHeight: y + rowH };
  }

  // The target board and the tray pieces share one scale (they have to line
  // up 1:1), so a board big enough to want a large scale can leave the tray
  // too cramped for however many pieces this level has. Shrinks from the
  // area-based scale only as far as needed for the tray to still fit.
  function fitTrayScale(shapes, maxScale) {
    // However roomy the target area allows, no single piece may end up
    // wider than the tray column itself.
    var maxPieceW = 0;
    shapes.forEach(function (shape) { maxPieceW = Math.max(maxPieceW, localBBox(shape).w); });
    var scale = Math.min(maxScale, TRAY_USABLE_W / maxPieceW);
    while (scale > 30) {
      if (packShelves(shapes, scale).totalHeight <= TRAY_USABLE_H) return scale;
      scale -= 1;
    }
    return 30;
  }

  function layoutTray() {
    var shapes = state.pieces.map(function (piece) { return piece.localShape; });
    var packed = packShelves(shapes, state.unitScale);
    var vOffset = Math.max(0, (TRAY_USABLE_H - packed.totalHeight) / 2);
    state.pieces.forEach(function (piece, i) {
      var pos = packed.positions[i];
      var screenLeft = TRAY_X0 + TRAY_MARGIN + pos.x;
      var screenTop = TRAY_TOP + vOffset + pos.y;
      piece.current.x = screenLeft - pos.bb.cx * state.unitScale + pos.w / 2;
      piece.current.y = screenTop - pos.bb.cy * state.unitScale + pos.h / 2;
      piece.current.angleDeg = 0;
      piece.current.flip = false;
    });
  }

  var targetEls = [];

  function renderTarget(resolved, scale) {
    layerTarget.innerHTML = "";
    targetEls = [];
    var hard = state.difficulty === "hard";
    resolved.forEach(function (p) {
      var poly = document.createElementNS(SVG_NS, "polygon");
      var pts = p.worldVerts.map(function (v) {
        return (v[0] * scale + state.offsetX) + "," + (v[1] * scale + state.offsetY);
      }).join(" ");
      poly.setAttribute("points", pts);
      poly.setAttribute("class", hard ? "target-poly hard" : "target-poly");
      layerTarget.appendChild(poly);
      targetEls.push(poly);
    });
  }

  // ---- Hint (hard mode only) --------------------------------------------
  // Briefly shows one random slot the way easy mode always shows it, then
  // hides it again - a peek, not a permanent reveal.
  var hintTimer = null;

  function resetHint() {
    if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
    btnHint.disabled = false;
  }

  function showHint() {
    if (state.difficulty !== "hard" || hintTimer || !state.slots.length) return;
    var idx = Math.floor(Math.random() * targetEls.length);
    var el = targetEls[idx];
    el.classList.remove("hard");
    el.classList.add("hint-active");
    btnHint.disabled = true;
    hintTimer = setTimeout(function () {
      el.classList.remove("hint-active");
      el.classList.add("hard");
      hintTimer = null;
      btnHint.disabled = false;
    }, 3000);
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
    if (drag.moved) releaseSnap(drag.piece);
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
      releaseSnap(piece);
      piece.current.angleDeg = normalizeDeg(piece.current.angleDeg + 45);
      updatePieceTransform(piece);
      playClick();
    }
    trySnap(piece);
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
    releaseSnap(rotateDrag.piece);
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
    trySnap(rotateDrag.piece);
    rotateDrag = null;
    playClick();
  }

  handleKnob.addEventListener("pointerdown", onHandlePointerDown);

  function rotateSelected(dir) {
    if (!state.selectedId) return;
    var piece = findPiece(state.selectedId);
    if (!piece) return;
    releaseSnap(piece);
    piece.current.angleDeg = normalizeDeg(piece.current.angleDeg + dir * 45);
    updatePieceTransform(piece);
    trySnap(piece);
    playClick();
  }

  function flipSelected() {
    if (!state.selectedId) return;
    var piece = findPiece(state.selectedId);
    if (!piece) return;
    releaseSnap(piece);
    piece.current.flip = !piece.current.flip;
    updatePieceTransform(piece);
    trySnap(piece);
    playClick();
  }

  // ---- Snapping ------------------------------------------------------------
  function releaseSnap(piece) {
    if (piece.snappedSlot != null) {
      state.slotOccupant[piece.snappedSlot] = null;
      piece.snappedSlot = null;
    }
  }

  // Exact transform (x, y, angleDeg) that lands this piece precisely on the
  // given slot, reusing the same flip/symmetry reconciliation pieceSlotDeviation
  // uses to judge a match, so "close enough to snap" and "how it looks once
  // snapped" always agree. Keeps the piece's current flip state (for
  // non-chiral shapes, some rotation always reproduces the target look) and
  // picks whichever symmetry-equivalent angle is closest to the piece's
  // current angle, so snapping never spins it further than necessary.
  function computeSnapPose(piece, slot) {
    var flip = piece.current.flip;
    var targetAngle;
    if (piece.chiral) {
      if (flip !== slot.flip) return null;
      targetAngle = slot.angleDeg;
    } else {
      var offset = TD.SHAPE_FLIP_ROTATE_OFFSET[piece.shape] || 0;
      targetAngle = flip ? (offset - slot.angleDeg) : slot.angleDeg;
    }
    var base = normalizeDeg(targetAngle);
    var cur = normalizeDeg(piece.current.angleDeg);
    var best = base, bestDiff = Infinity;
    for (var k = -2; k <= 2; k++) {
      var cand = base + k * piece.symmetry;
      var diff = Math.abs(cur - normalizeDeg(cand));
      diff = Math.min(diff, 360 - diff);
      if (diff < bestDiff) { bestDiff = diff; best = cand; }
    }
    var angleDeg = normalizeDeg(best);
    var lc = piece.localCentroid;
    var rad = angleDeg * Math.PI / 180;
    var p0 = lc[0] * state.unitScale, p1 = lc[1] * state.unitScale;
    var rx = p0 * Math.cos(rad) - p1 * Math.sin(rad);
    var ry = p0 * Math.sin(rad) + p1 * Math.cos(rad);
    return { x: slot.centroidPx.x - rx, y: slot.centroidPx.y - ry, angleDeg: angleDeg, flip: flip };
  }

  // Called whenever a piece's pose settles (drag/rotate/flip ends). If it's
  // now close enough to an open matching-shape slot, snaps it exactly into
  // place - "손 놓으면 착 붙는" - and claims that slot.
  function trySnap(piece) {
    var bestIdx = -1, bestCost = Infinity;
    state.slots.forEach(function (slot, i) {
      if (slot.shape !== piece.shape) return;
      if (state.slotOccupant[i] != null) return;
      var d = pieceSlotDeviation(piece, slot);
      if (d.dist > SNAP_POS_TOL || d.angleDiff > SNAP_ANGLE_TOL || !d.flipOk) return;
      var cost = d.dist + d.angleDiff / 90;
      if (cost < bestCost) { bestCost = cost; bestIdx = i; }
    });
    if (bestIdx === -1) return;
    var pose = computeSnapPose(piece, state.slots[bestIdx]);
    if (!pose) return;
    piece.current.x = pose.x;
    piece.current.y = pose.y;
    piece.current.angleDeg = pose.angleDeg;
    piece.current.flip = pose.flip;
    piece.snappedSlot = bestIdx;
    state.slotOccupant[bestIdx] = piece.id;
    updatePieceTransform(piece);
    piece.el.classList.remove("snap-pop");
    requestAnimationFrame(function () { piece.el.classList.add("snap-pop"); });
    playClick();
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

  // With snapping in place a piece is either exactly seated in its slot or
  // not placed at all, so completion is just "every slot has an occupant" -
  // no more scoring/ranking pieces against each other.
  function evaluateCompletion() {
    return { ok: state.slotOccupant.indexOf(null) === -1 };
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
    markCleared(currentLevel().id);
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
  }

  // ---- Level select ------------------------------------------------------
  function buildLevelGrid() {
    levelGrid.innerHTML = "";
    var clearedMap = loadCleared();
    TD.LEVELS.forEach(function (lvl, i) {
      var btn = document.createElement("button");
      btn.className = "level-grid-btn";
      var cleared = !!clearedMap[lvl.id];
      var locked = i > 0 && !clearedMap[TD.LEVELS[i - 1].id];
      var num = document.createElement("div");
      num.textContent = (i + 1);
      btn.appendChild(num);
      if (cleared) {
        btn.classList.add("cleared");
        var checkEl = document.createElement("div");
        checkEl.className = "lvl-check";
        checkEl.textContent = "✓";
        btn.appendChild(checkEl);
      }
      if (locked) {
        btn.classList.add("locked");
        btn.disabled = true;
        btn.title = "이전 단계를 클리어해야 도전할 수 있어요";
        var lockEl = document.createElement("div");
        lockEl.className = "lvl-lock";
        lockEl.textContent = "🔒";
        btn.appendChild(lockEl);
      } else {
        btn.addEventListener("click", function () {
          showScreen("game");
          loadLevel(i);
        });
      }
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
    guestCleared = {};
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
  btnHint.addEventListener("click", showHint);
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
