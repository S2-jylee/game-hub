(function () {
  "use strict";

  var CD = window.CodingData;
  var PROFILES_KEY = "coding_profiles_v1";
  var STEP_MS = 450;       // 토끼가 블록 하나를 하는 데 걸리는 시간
  var HINT_AFTER = 3;      // 이만큼 틀리면 발자국 힌트를 보여줘요
  var WALL_ICONS = ["🌳", "🪨", "🌲"];

  // ---- DOM refs ----------------------------------------------------
  var screens = {
    title: document.getElementById("screen-title"),
    user: document.getElementById("screen-user"),
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
  var hudBlocksVal = document.getElementById("hud-blocks-val");
  var hudRunsVal = document.getElementById("hud-runs-val");
  var hudTimerVal = document.getElementById("hud-timer-val");
  var hudScoreVal = document.getElementById("hud-score-val");
  var progressFill = document.getElementById("stage-progress-fill");
  var levelGrid = document.getElementById("level-grid");

  var boardEl = document.getElementById("board");
  var programEl = document.getElementById("program");
  var paletteEl = document.getElementById("palette");
  var codeLimitEl = document.getElementById("code-limit");
  var runBtn = document.getElementById("btn-run");
  var delBtn = document.getElementById("btn-del");
  var clearBtn = document.getElementById("btn-clear");
  var qBuddy = document.getElementById("q-buddy");
  var qText = document.getElementById("q-text");
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
  function playMatch() { beep(660, 0.12, 0, "triangle", 0.14); beep(880, 0.16, 0.08, "triangle", 0.14); }
  function playMiss() { beep(260, 0.14, 0, "sawtooth", 0.09); }

  function speak(text) {
    // 가이드북이 게임 화면을 덮고 있는 동안에는 기다렸다가 '시작'을 누르면 읽어줘요
    if (text && bookIsOpen() && !book.readOnly) { book.pendingSay = text; return; }
    if (!("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      if (!text) return;
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "ko-KR"; u.rate = 0.95; u.pitch = 1.2;
      speechSynthesis.speak(u);
    } catch (e) { /* speech not available, ignore */ }
  }

  function key(x, y) { return CD.key(x, y); }
  function cmdKind(c) { return CD.CMD[c].kind === "turn" && c !== "F" ? "turn" : "arrow"; }

  // ---- Game state -----------------------------------------------------
  var state = {
    catIndex: 0,
    levelIndex: 0,
    totalScore: 0,
    results: [],      // {name, elapsed, gain, stars, percent}
    prog: [],         // [{c:"R"} | {loop:3, body:[{c:"R"}]}]
    sel: null,        // 고른 블록 {i, j}  (j = -1 이면 맨 바깥 블록이나 반복 블록 자체)
    errRef: null,     // 지난 실행에서 틀린 블록
    running: false,
    runs: 0,
    fails: 0,
    faceDeg: 0,
    stageStartTime: 0,
    timerHandle: null,
    guideRead: {},    // 이번에 가이드북을 다 읽은 놀이 (다시 들어오면 바로 문제부터)
    token: 0          // 나가거나 다시 시작하면 바뀌어서, 기다리던 예약을 무효로 만들어요
  };

  function currentCat() { return CD.CATEGORIES[state.catIndex]; }
  function currentLevel() { return currentCat().stages[state.levelIndex]; }
  function stageName(cat, stage) { return cat.name + " " + stage.n + "단계"; }
  function usedBlocks() { return CD.countBlocks(state.prog); }
  function refBlocks(level) { return level.limit || level.best; }

  function later(fn, ms) {
    var tok = state.token;
    setTimeout(function () { if (tok === state.token) fn(); }, ms);
  }

  // ---- Board ----------------------------------------------------------
  var cellEls = {};
  var actorEl = null;

  function cellPos(level, x, y) {
    var n = level.size;
    var cell = "((100% - 16px - " + (n - 1) * 4 + "px) / " + n + ")";
    return {
      left: "calc(8px + " + x + " * (" + cell + " + 4px))",
      top: "calc(8px + " + y + " * (" + cell + " + 4px))",
      size: "calc" + cell
    };
  }

  function buildBoard(level) {
    boardEl.innerHTML = "";
    cellEls = {};
    var n = level.size;
    // 칸 크기를 모두 같게: 그림(🥕 · 돌 · 나무)이 있는 칸도 다른 칸과 같은 크기로
    boardEl.style.gridTemplateColumns = "repeat(" + n + ", minmax(0, 1fr))";
    boardEl.style.gridTemplateRows = "repeat(" + n + ", minmax(0, 1fr))";
    boardEl.style.setProperty("--cell-font", { 4: "2.4rem", 5: "2rem", 6: "1.7rem", 7: "1.45rem", 8: "1.25rem" }[n] || "1.6rem");
    var starAt = {};
    level.stars.forEach(function (s, i) { starAt[key(s.x, s.y)] = i; });
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var c = document.createElement("div");
        c.className = "cell";
        var k = key(x, y);
        if (level.walls[k]) {
          c.classList.add("wall");
          c.textContent = WALL_ICONS[(x * 7 + y * 3 + level.n) % WALL_ICONS.length];
        } else if (x === level.goal.x && y === level.goal.y) {
          c.classList.add("goal");
          c.innerHTML = '<span class="goal-ico">🥕</span>';
        } else if (starAt[k] != null) {
          c.innerHTML = '<span class="star-ico">⭐</span>';
        }
        boardEl.appendChild(c);
        cellEls[k] = c;
      }
    }
    actorEl = document.createElement("div");
    actorEl.className = "actor" + (level.cmds[0] === "F" ? "" : " no-face");
    actorEl.innerHTML = '<div class="actor-face"></div><span class="actor-ico">🐰</span>';
    var p = cellPos(level, 0, 0);
    actorEl.style.width = p.size;
    actorEl.style.height = p.size;
    boardEl.appendChild(actorEl);
    resetActor();
  }

  function placeActor(x, y) {
    var p = cellPos(currentLevel(), x, y);
    actorEl.style.left = p.left;
    actorEl.style.top = p.top;
  }
  function faceActor() {
    actorEl.querySelector(".actor-face").style.transform = "rotate(" + state.faceDeg + "deg)";
  }

  function resetActor() {
    var level = currentLevel();
    actorEl.classList.add("instant");
    actorEl.classList.remove("bump", "win");
    state.faceDeg = level.start.d * 90;
    placeActor(level.start.x, level.start.y);
    faceActor();
    void actorEl.offsetWidth;
    actorEl.classList.remove("instant");
    Object.keys(cellEls).forEach(function (k) { cellEls[k].classList.remove("trail", "star-got"); });
    showHintFeet();
  }

  function showHintFeet() {
    var level = currentLevel(), on = state.fails >= HINT_AFTER;
    Object.keys(cellEls).forEach(function (k) { cellEls[k].classList.remove("hint-foot"); });
    if (!on) return;
    level.hintCells.forEach(function (c) {
      if (c.x === level.goal.x && c.y === level.goal.y) return;
      cellEls[key(c.x, c.y)].classList.add("hint-foot");
    });
  }

  // ---- Program editing ----------------------------------------------------
  function blockButton(c, cls) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "blk blk-" + cmdKind(c) + (c === "F" ? " blk-F" : "") + (cls ? " " + cls : "");
    b.textContent = CD.CMD[c].icon;
    b.title = CD.CMD[c].name;
    return b;
  }
  function sameRef(a, b) { return !!a && !!b && a.i === b.i && a.j === b.j; }

  // 화면에 보이는 블록 번호 (반복 블록도 1개로 세요)
  function blockNumber(ref) {
    var n = 0;
    for (var i = 0; i < state.prog.length; i++) {
      n++;
      if (i === ref.i && ref.j < 0) return n;
      var it = state.prog[i];
      if (it.body) {
        for (var j = 0; j < it.body.length; j++) {
          n++;
          if (i === ref.i && j === ref.j) return n;
        }
      }
    }
    return n;
  }

  function renderProgram(nowRef) {
    var popRef = state.popRef;
    state.popRef = null;
    programEl.innerHTML = "";
    var level = currentLevel();
    if (!state.prog.length) {
      var empty = document.createElement("div");
      empty.className = "program-empty";
      empty.innerHTML = "아래 블록을 누르거나<br>여기로 끌어다 놓아요 👇";
      programEl.appendChild(empty);
    }
    var num = 0;
    state.prog.forEach(function (it, i) {
      num++;
      if (it.body) {
        var box = document.createElement("div");
        var ref = { i: i, j: -1 };
        box.dataset.i = i;
        box.className = "loop-blk" + (sameRef(state.sel, ref) ? " sel" : "") + (sameRef(popRef, ref) ? " pop" : "") +
          (nowRef && nowRef.i === i ? " now" : "") + (state.errRef && state.errRef.i === i && state.errRef.j >= 0 ? " err" : "");
        var head = document.createElement("button");
        head.type = "button";
        head.className = "loop-head";
        head.innerHTML = '🔁 <span class="loop-pm" data-d="-1">－</span><span class="loop-count">' + it.loop +
          '</span><span class="loop-pm" data-d="1">＋</span>번';
        head.addEventListener("pointerdown", function (evt) {
          if (!evt.target.closest(".loop-pm")) watchDrag(evt, { move: ref }, box);
        });
        head.addEventListener("click", function (evt) {
          if (state.running || dragJustEnded()) return;
          var pm = evt.target.closest(".loop-pm");
          if (pm) {
            evt.stopPropagation();
            it.loop = Math.max(2, Math.min(9, it.loop + Number(pm.dataset.d)));
            edited();
            return;
          }
          selectRef(ref);
        });
        box.appendChild(head);
        if (nowRef && nowRef.i === i) {
          var iter = document.createElement("span");
          iter.className = "loop-iter";
          iter.textContent = (nowRef.r + 1) + "/" + it.loop;
          box.appendChild(iter);
        }
        it.body.forEach(function (b, j) {
          num++;
          var r2 = { i: i, j: j };
          var bb = blockButton(b.c, (sameRef(state.sel, r2) ? "sel" : "") +
            (sameRef(nowRef, r2) ? " now" : "") + (sameRef(state.errRef, r2) ? " err" : "") + (sameRef(popRef, r2) ? " pop" : ""));
          bb.insertAdjacentHTML("afterbegin", '<span class="blk-no">' + num + "</span>");
          bb.dataset.i = i;
          bb.dataset.j = j;
          bb.addEventListener("pointerdown", function (evt) { watchDrag(evt, { move: r2 }, bb); });
          bb.addEventListener("click", function () { if (!dragJustEnded()) selectRef(r2); });
          box.appendChild(bb);
        });
        if (!it.body.length || sameRef(state.sel, ref)) {
          var slot = document.createElement("span");
          slot.className = "loop-slot";
          slot.textContent = it.body.length ? "＋ 더 넣기" : "여기에 쏙!";
          // 빈칸을 누르면 반복이 골라져서, 아래 블록을 누르면 안으로 들어가요
          slot.addEventListener("click", function () { if (!sameRef(state.sel, ref)) selectRef(ref); });
          box.appendChild(slot);
        }
        programEl.appendChild(box);
      } else {
        var r1 = { i: i, j: -1 };
        var b1 = blockButton(it.c, (sameRef(state.sel, r1) ? "sel" : "") +
          (sameRef(nowRef, r1) ? " now" : "") + (sameRef(state.errRef, r1) ? " err" : "") + (sameRef(popRef, r1) ? " pop" : ""));
        b1.insertAdjacentHTML("afterbegin", '<span class="blk-no">' + num + "</span>");
        b1.dataset.i = i;
        b1.addEventListener("pointerdown", function (evt) { watchDrag(evt, { move: r1 }, b1); });
        b1.addEventListener("click", function () { if (!dragJustEnded()) selectRef(r1); });
        programEl.appendChild(b1);
      }
    });
    var used = usedBlocks();
    if (level.limit) {
      codeLimitEl.hidden = false;
      codeLimitEl.textContent = "블록 " + used + " / " + level.limit + "개";
      codeLimitEl.classList.toggle("full", used === level.limit);
      codeLimitEl.classList.toggle("over", used > level.limit);
    } else {
      codeLimitEl.hidden = false;
      codeLimitEl.textContent = "블록 " + used + "개";
      codeLimitEl.classList.remove("full", "over");
    }
    hudBlocksVal.textContent = level.limit ? used + " / " + level.limit : used;
    var nowEl = programEl.querySelector(".now, .err");
    if (nowEl && nowEl.scrollIntoView) nowEl.scrollIntoView({ block: "nearest" });
  }

  function selectedItem() {
    if (!state.sel) return null;
    var it = state.prog[state.sel.i];
    if (!it) return null;
    return state.sel.j >= 0 ? it.body[state.sel.j] : it;
  }
  function loopSelected() { var it = selectedItem(); return it && it.body ? it : null; }
  // 블록 개수 제한은 실행할 때만 확인해요. 만드는 동안에는 자유롭게 넣고 빼고 옮길 수 있어요
  function overLimit() { var l = currentLevel().limit; return !!l && usedBlocks() > l; }

  function selectRef(ref) {
    if (state.running) return;
    state.sel = sameRef(state.sel, ref) ? null : ref;
    renderProgram();
    renderPalette();
  }

  function edited() {
    state.errRef = null;
    clearFeedback();
    resetActor();
    renderProgram();
    renderPalette();
  }

  function addCmd(c) {
    if (state.running) return;
    var it = selectedItem();
    if (it && !it.body) {
      // 고른 블록을 바꿔요 (버그 고치기)
      it.c = c;
      state.popRef = state.sel;
      state.sel = null;
    } else if (it && it.body) {
      it.body.push({ c: c });
      state.popRef = { i: state.sel.i, j: it.body.length - 1 };
    } else {
      state.prog.push({ c: c });
      state.popRef = { i: state.prog.length - 1, j: -1 };
    }
    edited();
  }

  function addLoop() {
    if (state.running) return;
    if (state.sel && state.sel.j >= 0) state.sel = null;
    var loopIt = loopSelected();
    if (loopIt) {
      say("hint", "🔁 반복 안에 또 반복은 넣을 수 없어요. ✔ 다 넣었어요를 먼저 눌러요!");
      return;
    }
    state.prog.push({ loop: 2, body: [] });
    state.sel = { i: state.prog.length - 1, j: -1 };
    state.popRef = state.sel;
    edited();
  }

  function limitWarn() {
    playMiss();
    say("hint", "블록이 " + usedBlocks() + "개예요. " + currentLevel().limit + "개까지만 쓸 수 있어요. 🔁 반복으로 줄여 봐요!");
    animate(codeLimitEl, "err");
  }

  function deleteBlock() {
    if (state.running || !state.prog.length) return;
    var s = state.sel;
    if (s) {
      var it = state.prog[s.i];
      if (s.j >= 0) {
        it.body.splice(s.j, 1);
        state.sel = null;
      } else if (it.body && it.body.length) {
        it.body.pop();
      } else {
        state.prog.splice(s.i, 1);
        state.sel = null;
      }
    } else {
      var last = state.prog[state.prog.length - 1];
      if (last.body && last.body.length) last.body.pop();
      else state.prog.pop();
    }
    edited();
  }

  function clearProgram() {
    if (state.running) return;
    var level = currentLevel();
    state.prog = level.prefill ? JSON.parse(JSON.stringify(level.prefill)) : [];
    state.sel = null;
    edited();
  }

  function renderPalette() {
    paletteEl.innerHTML = "";
    var level = currentLevel();
    level.cmds.forEach(function (c) {
      var b = blockButton(c);
      b.innerHTML = CD.CMD[c].icon + "<small>" + CD.CMD[c].name + "</small>";
      b.disabled = state.running;
      b.addEventListener("pointerdown", function (evt) { if (!b.disabled) watchDrag(evt, { item: { c: c } }, b); });
      b.addEventListener("click", function () { if (!dragJustEnded()) addCmd(c); });
      paletteEl.appendChild(b);
    });
    if (level.loop) {
      var lb = document.createElement("button");
      lb.type = "button";
      lb.className = "blk blk-loop";
      lb.innerHTML = "🔁<small>반복</small>";
      lb.disabled = state.running || !!loopSelected();
      lb.addEventListener("pointerdown", function (evt) { if (!lb.disabled) watchDrag(evt, { item: { loop: 2, body: [] } }, lb); });
      lb.addEventListener("click", function () { if (!dragJustEnded()) addLoop(); });
      paletteEl.appendChild(lb);
    }
    if (loopSelected()) {
      var done = document.createElement("button");
      done.type = "button";
      done.className = "blk blk-done";
      done.textContent = "✔ 다 넣었어요 (반복 밖으로)";
      done.addEventListener("click", function () { selectRef(state.sel); });
      paletteEl.appendChild(done);
    }
    delBtn.disabled = state.running || !state.prog.length;
    clearBtn.disabled = state.running;
    clearBtn.textContent = level.prefill ? "↩️ 처음 코드" : "🗑️ 모두 지우기";
  }

  // ---- 끌어다 놓기 ----------------------------------------------------------
  // 아래 블록을 끌어서 코드 사이 / 반복 안 원하는 자리에 끼워 넣어요.
  // 코드에 있는 블록도 끌어서 옮길 수 있고, 코드 밖으로 끌어내면 지워져요.
  var drag = null;
  var dragEndedAt = 0;
  var dropMark = document.createElement("div");
  dropMark.className = "drop-mark";
  dropMark.hidden = true;
  document.body.appendChild(dropMark);

  function dragJustEnded() { return performance.now() - dragEndedAt < 120; }

  function watchDrag(evt, payload, el) {
    if (state.running || evt.button > 0) return;
    drag = { payload: payload, el: el, x0: evt.clientX, y0: evt.clientY, active: false, ghost: null, target: null };
  }

  function dragIsLoop() {
    var p = drag.payload;
    if (p.item) return !!p.item.body;
    return p.move.j < 0 && !!state.prog[p.move.i].body;
  }

  // 손가락 위치에서 가장 가까운 블록의 앞/뒤를 찾아요
  function nearestSlot(els, x, y) {
    var best = null;
    els.forEach(function (el, k) {
      var r = el.getBoundingClientRect();
      var dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom);
      var d = dx * dx + dy * dy * 4;   // 같은 줄을 더 가깝게 쳐요
      if (!best || d < best.d) best = { d: d, k: k, r: r };
    });
    if (!best) return { at: 0, rect: null };
    var after = y > best.r.bottom || (y >= best.r.top && x > best.r.left + best.r.width / 2);
    return { at: best.k + (after ? 1 : 0), rect: best.r, after: after };
  }

  function findTarget(x, y) {
    var pr = programEl.getBoundingClientRect();
    if (x < pr.left - 12 || x > pr.right + 12 || y < pr.top - 12 || y > pr.bottom + 12) return null;
    var under = document.elementFromPoint(x, y);
    var loopEl = under && under.closest ? under.closest(".loop-blk") : null;
    if (loopEl && programEl.contains(loopEl) && !dragIsLoop()) {
      var kids = Array.prototype.slice.call(loopEl.querySelectorAll(".blk[data-j]"));
      var s1 = nearestSlot(kids, x, y);
      return { i: Number(loopEl.dataset.i), inLoop: true, at: s1.at, rect: s1.rect, after: s1.after, box: loopEl };
    }
    var items = Array.prototype.filter.call(programEl.children, function (el) { return el.dataset.i != null; });
    var s2 = nearestSlot(items, x, y);
    return { inLoop: false, at: s2.at, rect: s2.rect, after: s2.after };
  }

  function showTarget(t) {
    programEl.classList.remove("drop-on");
    Array.prototype.forEach.call(programEl.querySelectorAll(".drop-on"), function (el) { el.classList.remove("drop-on"); });
    dropMark.hidden = true;
    document.body.classList.toggle("drag-out", !t && !!drag.payload.move);
    if (!t) return;
    if (!t.rect) {
      // 빈 반복 / 빈 코드: 통째로 반짝
      (t.inLoop ? t.box : programEl).classList.add("drop-on");
      return;
    }
    dropMark.hidden = false;
    dropMark.style.left = (t.after ? t.rect.right + 1 : t.rect.left - 5) + "px";
    dropMark.style.top = t.rect.top + "px";
    dropMark.style.height = t.rect.height + "px";
  }

  document.addEventListener("pointermove", function (evt) {
    if (!drag) return;
    if (!drag.active) {
      if (Math.abs(evt.clientX - drag.x0) + Math.abs(evt.clientY - drag.y0) < 8) return;
      drag.active = true;
      var it = drag.payload.item, g;
      if (it && it.c) g = blockButton(it.c);
      else if (it) {
        g = document.createElement("div");
        g.className = "loop-blk";
        g.innerHTML = '<span class="loop-head">🔁 <span class="loop-count">2</span>번</span><span class="loop-slot">여기에 쏙!</span>';
      } else g = drag.el.cloneNode(true);
      g.classList.remove("sel", "now", "err", "pop");
      g.classList.add("drag-ghost");
      document.body.appendChild(g);
      drag.ghost = g;
      if (drag.payload.move) drag.el.classList.add("dragging");
    }
    evt.preventDefault();
    drag.ghost.style.left = evt.clientX + "px";
    drag.ghost.style.top = evt.clientY + "px";
    drag.target = findTarget(evt.clientX, evt.clientY);
    showTarget(drag.target);
  });

  function endDrag(drop) {
    if (!drag) return;
    var d = drag;
    drag = null;
    if (d.ghost) d.ghost.remove();
    d.el.classList.remove("dragging");
    dropMark.hidden = true;
    programEl.classList.remove("drop-on");
    document.body.classList.remove("drag-out");
    if (!d.active) return;
    dragEndedAt = performance.now();
    if (drop) dropBlock(d.payload, d.target);
    else renderProgram();
  }
  document.addEventListener("pointerup", function () { endDrag(true); });
  document.addEventListener("pointercancel", function () { endDrag(false); });

  function dropBlock(payload, t) {
    if (state.running) return;
    var item;
    if (payload.item) {
      if (!t) { renderProgram(); return; }
      item = JSON.parse(JSON.stringify(payload.item));
    } else {
      // 원래 자리에서 빼요
      var m = payload.move;
      if (m.j >= 0) item = state.prog[m.i].body.splice(m.j, 1)[0];
      else item = state.prog.splice(m.i, 1)[0];
      if (!t) {
        // 코드 밖으로 끌어내면 지워져요
        state.sel = null;
        edited();
        return;
      }
      if (t.inLoop) {
        if (m.j < 0 && m.i < t.i) t.i--;
        if (m.j >= 0 && m.i === t.i && m.j < t.at) t.at--;
      } else if (m.j < 0 && m.i < t.at) {
        t.at--;
      }
    }
    if (t.inLoop) {
      state.prog[t.i].body.splice(t.at, 0, item);
      state.popRef = { i: t.i, j: t.at };
      state.sel = null;
    } else {
      state.prog.splice(t.at, 0, item);
      state.popRef = { i: t.at, j: -1 };
      // 새 반복 블록은 골라 둬서 아래 블록을 누르면 바로 안으로 들어가요
      state.sel = item.body && !item.body.length ? { i: t.at, j: -1 } : null;
    }
    edited();
  }

  // ---- Feedback -------------------------------------------------------
  function clearFeedback() {
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
  }
  function say(kind, text) {
    feedbackEl.className = "feedback " + kind;
    feedbackEl.textContent = text;
  }

  // ---- Running ----------------------------------------------------------
  function setRunning(on) {
    state.running = on;
    runBtn.textContent = on ? "■ 멈추기" : "▶ 실행";
    runBtn.classList.toggle("stop", on);
    runBtn.disabled = false;
    renderPalette();
  }

  function stopRun() {
    state.token++;
    setRunning(false);
    resetActor();
    renderProgram();
    clearFeedback();
  }

  function run() {
    if (state.running) { stopRun(); return; }
    var level = currentLevel();
    if (!state.prog.length) {
      playMiss();
      say("hint", "먼저 아래 블록을 눌러서 코드를 만들어요!");
      return;
    }
    if (overLimit()) { limitWarn(); return; }
    var hasEmptyLoop = state.prog.some(function (it) { return it.body && !it.body.length; });
    if (hasEmptyLoop) {
      playMiss();
      say("hint", "🔁 반복 안이 비어 있어요. 반복할 블록을 넣어 줘요!");
      return;
    }
    state.sel = null;
    state.errRef = null;
    state.runs++;
    hudRunsVal.textContent = state.runs + "번";
    var sim = CD.simulate(level, state.prog);
    resetActor();
    clearFeedback();
    setRunning(true);
    speak("");
    var tok = state.token, i = 0;
    function next() {
      if (tok !== state.token) return;
      if (i >= sim.steps.length) { finishRun(sim); return; }
      var st = sim.steps[i++];
      renderProgram(st.ref);
      if (st.type === "move") {
        placeActor(st.x, st.y);
        cellEls[key(st.x, st.y)].classList.add("trail");
        if (st.star != null) {
          cellEls[key(st.x, st.y)].classList.add("star-got");
          playMatch();
        }
      } else if (st.type === "turn") {
        state.faceDeg += (st.ref && blockAt(st.ref).c === "TL") ? -90 : 90;
        faceActor();
      } else if (st.type === "bump") {
        actorEl.style.setProperty("--bx", (CD.DX[st.dir] * 28) + "%");
        actorEl.style.setProperty("--by", (CD.DY[st.dir] * 28) + "%");
        animate(actorEl, "bump");
        playMiss();
        state.errRef = st.ref;
      }
      later(next, STEP_MS);
    }
    later(next, 150);
  }

  function blockAt(ref) {
    var it = state.prog[ref.i];
    return ref.j >= 0 ? it.body[ref.j] : it;
  }

  function finishRun(sim) {
    var level = currentLevel();
    if (sim.result === "win") {
      runBtn.disabled = true;   // 도착한 뒤에는 멈추기로 클리어가 취소되지 않게
      renderProgram();
      animate(actorEl, "win");
      animate(qBuddy, "jump");
      burst(cellEls[key(level.goal.x, level.goal.y)]);
      say("good", "냠냠! 🥕 당근에 도착했어요!");
      speak("도착!");
      later(onStageComplete, 1100);
      return;
    }
    state.fails++;
    animate(qBuddy, "sad");
    var msg;
    if (sim.result === "bump") {
      var last = sim.steps[sim.steps.length - 1];
      var where = blockNumber(state.errRef) + "번째 블록";
      if (state.errRef.j >= 0) where = "🔁 반복 " + (state.errRef.r + 1) + "번째 바퀴의 " + where;
      msg = "앗! " + where + "에서 " + (last.out ? "판 밖으로 나가려고 했어요." : "부딪혔어요.");
      speak("앗, 부딪혔어요!");
    } else if (sim.result === "nostar") {
      playMiss();
      msg = "⭐ 별을 " + (level.stars.length - sim.gotStars) + "개 더 모아야 당근을 먹을 수 있어요!";
      speak("별을 다 모아야 해요");
    } else {
      playMiss();
      msg = "당근까지 가지 못했어요. 코드가 더 필요해요!";
      speak("조금 더 가야 해요");
    }
    if (state.fails === HINT_AFTER) msg += "  👣 발자국을 따라가 봐요!";
    say("bad", msg);
    renderProgram();
    later(function () {
      setRunning(false);
      resetActor();
      renderProgram();
    }, 1300);
  }

  // ---- Level loading ----------------------------------------------------
  function promptFor(level) {
    var cat = currentCat(), stars = level.stars.length;
    var starText = stars ? "⭐ 별 " + stars + "개를 모두 모으고 " : "";
    if (cat.id === "bug") return { html: "🐞 코드에 <b>버그가 " + level.bugs + "개</b> 있어요. 고쳐서 🥕 당근까지!", say: "코드에 버그가 " + level.bugs + "개 있어요. 고쳐서 당근까지 가요!" };
    if (cat.id === "loop") return { html: "🔁 반복을 써서 <b>블록 " + level.limit + "개</b> 안에 🥕 당근까지!", say: "반복을 써서 블록 " + level.limit + "개 안에 당근까지 가요!" };
    if (cat.id === "turn") return { html: starText + "🥕 당근까지! <small>노란 화살표가 토끼가 보는 쪽이에요.</small>", say: (stars ? "별을 모두 모으고 " : "") + "당근까지 가요. 노란 화살표가 토끼가 보는 쪽이에요." };
    return { html: starText + "🐰 토끼를 🥕 당근까지 데려다줘요!", say: (stars ? "별을 모두 모으고 " : "") + "토끼를 당근까지 데려다줘요!" };
  }

  function loadLevel(idx) {
    state.token++;
    state.levelIndex = idx;
    var level = currentLevel();
    state.prog = level.prefill ? JSON.parse(JSON.stringify(level.prefill)) : [];
    state.sel = null;
    state.errRef = null;
    state.runs = 0;
    state.fails = 0;
    state.running = false;
    completionModal.classList.remove("show", "show-success");
    var p = promptFor(level);
    qText.innerHTML = p.html;
    // 기본 문구(토끼를 당근까지 데려다줘요!)는 보여주지 않아요. 버그 개수·블록 수·별처럼 꼭 필요한 문제만 보여요
    qText.parentNode.classList.toggle("q-plain", p.html.indexOf("🐰 토끼를 🥕 당근까지 데려다줘요!") === 0);
    state.sayText = p.say;
    buildBoard(level);
    setRunning(false);
    renderProgram();
    clearFeedback();
    updateHud();
    startTimer();
    speak(p.say);
  }

  function updateHud() {
    var cat = currentCat(), level = currentLevel();
    hudStageVal.textContent = level.n + " / " + cat.stages.length;
    hudThemeVal.textContent = cat.icon + " " + cat.name + " · " + level.label;
    hudRunsVal.textContent = state.runs + "번";
    hudScoreVal.textContent = state.totalScore;
    progressFill.style.width = (state.levelIndex / cat.stages.length * 100) + "%";
  }

  // ---- Timer ----------------------------------------------------------
  function startTimer() {
    stopTimer();
    state.stageStartTime = performance.now();
    state.lastTick = state.stageStartTime;
    hudTimerVal.textContent = "0.0초";
    state.timerHandle = setInterval(function () {
      // 방법 팝업(가이드북)이 떠 있는 동안은 시간이 흐르지 않아요. '확인'을 누르면 그때부터 흘러요
      var now = performance.now();
      if (document.querySelector(".gb-overlay.show, #screen-book.open")) state.stageStartTime += now - state.lastTick;
      state.lastTick = now;
      var el = (now - state.stageStartTime) / 1000;
      hudTimerVal.textContent = el.toFixed(1) + "초";
    }, 100);
  }
  function stopTimer() {
    if (state.timerHandle) { clearInterval(state.timerHandle); state.timerHandle = null; }
  }
  function elapsedStage() { return (performance.now() - state.stageStartTime) / 1000; }

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
      var ang = Math.PI * 2 * k / 12, dist = 60 + Math.random() * 60;
      p.style.left = cx + "px"; p.style.top = cy + "px";
      p.style.setProperty("--x", Math.cos(ang) * dist + "px");
      p.style.setProperty("--y", Math.sin(ang) * dist + "px");
      document.body.appendChild(p);
      (function (node) { setTimeout(function () { node.remove(); }, 950); })(p);
    }
  }

  // ---- Completion ---------------------------------------------------------
  function idealTime(level) {
    var cat = currentCat(), ref = refBlocks(level);
    var think = cat.id === "bug" ? 10 + level.bugs * 10 : cat.id === "loop" ? 12 + ref * 6 : 6 + ref * 3;
    return think + ref * STEP_MS / 1000 * 2;
  }

  function onStageComplete() {
    stopTimer();
    setRunning(false);
    var level = currentLevel();
    var used = usedBlocks(), ref = refBlocks(level);
    var accuracy = Math.max(20, 100 - state.fails * 20);
    var efficiency = Math.min(100, ref / used * 100);
    var elapsed = elapsedStage();
    var timeScore = Math.max(40, Math.min(100, 100 - Math.max(0, elapsed - idealTime(level)) * 1.2));

    var finalPercent = Math.round(accuracy * 0.5 + efficiency * 0.3 + timeScore * 0.2);
    finalPercent = Math.max(0, Math.min(100, finalPercent));
    var stars = finalPercent >= 95 ? 5 : finalPercent >= 85 ? 4 : finalPercent >= 70 ? 3 : finalPercent >= 50 ? 2 : 1;
    var scoreGain = Math.round(finalPercent * 10);

    state.totalScore += scoreGain;
    state.results.push({
      name: stageName(currentCat(), level),
      elapsed: elapsed, gain: scoreGain, stars: stars, percent: finalPercent
    });
    recordStars(level.id, stars);
    recordTime(level.id, elapsed);
    updateHud();
    progressFill.style.width = ((state.levelIndex + 1) / currentCat().stages.length * 100) + "%";

    completionStarsEl.innerHTML = starsHtml(stars, 5);
    completionPercentEl.textContent = finalPercent + "% 완성";
    completionDetailEl.textContent = "실행 " + state.runs + "번 · 블록 " + used + "개" +
      (used > ref ? " (가장 짧게 " + ref + "개)" : " 👍") + " · " + elapsed.toFixed(1) + "초";
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
    state.running = false;
    stopTimer();
    speak("");
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

  // ---- 가이드북 ----------------------------------------------------------------
  var book = { pages: [], index: 0, startLevel: 0 };
  var bookPageEl = document.getElementById("book-page");
  var bookPrev = document.getElementById("book-prev");
  var bookNext = document.getElementById("book-next");
  var bookDots = document.getElementById("book-dots");

  function miniBlock(c, cls) {
    return '<span class="blk blk-' + cmdKind(c) + (c === "F" ? " blk-F" : "") + (cls ? " " + cls : "") + '">' + CD.CMD[c].icon + "</span>";
  }
  function miniBoardHtml(b) {
    var cols = b.rows[0].length;
    var html = '<div class="mini-board" style="grid-template-columns:repeat(' + cols + ',1fr);max-width:' + Math.min(270, cols * 70) + 'px">';
    b.rows.forEach(function (row) {
      for (var i = 0; i < row.length; i++) {
        var ch = row[i];
        if (ch === "T") html += '<div class="cell wall">🌳</div>';
        else if (ch === "G") html += '<div class="cell goal">🥕</div>';
        else if (ch === "*") html += '<div class="cell">⭐</div>';
        else if (ch === "o") html += '<div class="cell foot"></div>';
        else if (ch === "S") html += '<div class="cell">' + (b.face ? '<span class="mini-face" style="--rot:' + b.d * 90 + 'deg">🐰</span>' : "🐰") + "</div>";
        else html += '<div class="cell"></div>';
      }
    });
    return html + "</div>";
  }
  function miniProgHtml(prog, bad, sel) {
    var html = '<div class="mini-prog">';
    prog.forEach(function (it, i) {
      if (typeof it === "string") html += miniBlock(it, i === bad ? "err" : i === sel ? "sel" : "");
      else {
        html += '<span class="loop-blk"><span class="loop-head">🔁 <span class="loop-count">' + it.loop + "</span>번</span>";
        it.body.forEach(function (c) { html += miniBlock(c); });
        html += "</span>";
      }
    });
    return html + "</div>";
  }
  function miniBlocksHtml(keys) {
    return '<div class="mini-blocks">' + keys.map(function (c) {
      return '<span class="blk blk-' + cmdKind(c) + (c === "F" ? " blk-F" : "") + '">' + CD.CMD[c].icon + "<small>" + CD.CMD[c].name + "</small></span>";
    }).join("") + "</div>";
  }
  function loopHowHtml() {
    return '<div class="mini-prog"><span class="loop-blk sel"><span class="loop-head">🔁 <span class="loop-pm">－</span><span class="loop-count">3</span><span class="loop-pm">＋</span>번</span>' +
      miniBlock("R") + miniBlock("D") + '<span class="loop-slot">＋ 더 넣기</span></span></div>' +
      '<div class="palette" style="width:100%"><span class="blk blk-done">✔ 다 넣었어요 (반복 밖으로)</span></div>';
  }

  // 가이드북은 게임 화면 위에 팝업으로 떠요 (구구단 놀이터의 펭귄 달리기처럼).
  // readOnly: 스테이지 고르기 화면의 '📖 게임 방법'으로 열었을 때 (마지막 장에 '닫기')
  function bookIsOpen() { return screens.book.classList.contains("open"); }
  function openBook(levelIndex, readOnly) {
    var guide = CD.GUIDES[currentCat().guide];
    book.pages = guide.pages.concat([{ start: true }]);
    book.index = 0;
    book.startLevel = levelIndex;
    book.readOnly = !!readOnly;
    book.pendingSay = null;
    document.getElementById("book-title").textContent = "📖 " + guide.title;
    document.getElementById("book-close").textContent = readOnly ? "닫기" : "← 스테이지 고르기";
    document.getElementById("book-skip").hidden = !!readOnly;
    screens.book.classList.add("open");
    renderBookPage(0);
  }
  function closeBook() { screens.book.classList.remove("open"); }
  // 시작: 팝업을 닫고 시간을 0초부터 재요. 기다리던 소리도 이제 읽어줘요
  function beginStage() {
    var say = book.pendingSay;
    book.pendingSay = null;
    state.guideRead[currentCat().id] = true;
    closeBook();
    startTimer();
    if (say) speak(say);
  }

  function renderBookPage(dir) {
    var page = book.pages[book.index], last = book.pages.length - 1;
    var html;
    if (page.start && book.readOnly) {
      html = '<div class="bp-start-emoji">📖✔️</div>' +
        '<div class="bp-start-text">다 읽었어요!</div>' +
        '<button id="book-done" class="btn btn-primary btn-huge" type="button">닫기</button>';
    } else if (page.start) {
      var lvl = currentCat().stages[book.startLevel];
      html = '<div class="bp-start-emoji">🐰💻</div>' +
        '<div class="bp-start-text">자, 이제 코딩해 볼까?</div>' +
        '<div class="bp-swipe">' + currentCat().name + " " + lvl.n + "단계 · " + lvl.label + "</div>" +
        '<button id="book-start" class="btn btn-primary btn-huge" type="button">시작! 🚀</button>';
    } else {
      var visual = "";
      if (page.board) visual = miniBoardHtml(page.board) + (page.prog ? miniProgHtml(page.prog, page.bad, page.sel) : "");
      else if (page.blocks && page.blocks.length) visual = miniBlocksHtml(page.blocks);
      else if (page.loopHow) visual = loopHowHtml();
      else visual = '<div class="bp-big-ico">' + (page.bugIcon ? "🐞" : currentCat().icon) + "</div>";
      html = '<div class="bp-title">' + page.title + "</div>" +
        '<div class="bp-row"><div class="bp-visual">' + visual + '</div><div class="bp-text">' + page.text + "</div></div>" +
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
    if (startBtn) startBtn.addEventListener("click", beginStage);
    var doneBtn = document.getElementById("book-done");
    if (doneBtn) doneBtn.addEventListener("click", closeBook);
  }

  function turnBook(delta) {
    var next = Math.max(0, Math.min(book.pages.length - 1, book.index + delta));
    if (next === book.index) return;
    book.index = next;
    renderBookPage(delta);
  }

  bookPrev.addEventListener("click", function () { turnBook(-1); });
  bookNext.addEventListener("click", function () { turnBook(1); });
  // 손가락으로 옆으로 밀어도 넘어가요
  var swipeX = null;
  bookPageEl.addEventListener("pointerdown", function (evt) { swipeX = evt.clientX; });
  bookPageEl.addEventListener("pointerup", function (evt) {
    if (swipeX == null) return;
    var dx = evt.clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) > 50) turnBook(dx < 0 ? 1 : -1);
  });
  document.getElementById("book-close").addEventListener("click", function () {
    var readOnly = book.readOnly;
    closeBook();
    if (readOnly) return;
    book.pendingSay = null;
    leaveGame();
    goToLevelSelect();
  });
  // 건너뛰기: 읽은 걸로 치고 바로 그 스테이지를 시작해요
  document.getElementById("book-skip").addEventListener("click", beginStage);

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
    // 게임 화면 위에 가이드북을 띄워요. '시작'을 누를 때까지 시간은 멈춰 있어요
    stopTimer();
    openBook(i);
  }

  function buildLevelGrid() {
    var cat = currentCat();
    levelSelectTitle.textContent = cat.icon + " " + cat.name;
    levelGrid.innerHTML = "";
    var starsMap = loadStars();
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
      name.textContent = lvl.label;
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
        btn.addEventListener("click", function () { startStage(i); });
      }
      levelGrid.appendChild(btn);
    });
  }

  // ---- Keyboard ------------------------------------------------------
  var KEY_CMD = { ArrowUp: "U", ArrowRight: "R", ArrowDown: "D", ArrowLeft: "L" };
  var KEY_TURN = { ArrowUp: "F", ArrowLeft: "TL", ArrowRight: "TR" };
  document.addEventListener("keydown", function (evt) {
    if (bookIsOpen()) {
      if (evt.key === "ArrowRight") turnBook(1);
      if (evt.key === "ArrowLeft") turnBook(-1);
      return;
    }
    if (!screens.game.classList.contains("active") || completionModal.classList.contains("show")) return;
    var level = currentLevel();
    var c = (level.cmds[0] === "F" ? KEY_TURN : KEY_CMD)[evt.key];
    if (c) { evt.preventDefault(); addCmd(c); }
    else if (evt.key === "Backspace" || evt.key === "Delete") { evt.preventDefault(); deleteBlock(); }
    else if (evt.key === "Enter" || evt.key === " ") { evt.preventDefault(); run(); }
  });

  // ---- Wire up UI ----------------------------------------------------
  document.getElementById("btn-start").addEventListener("click", function () {
    ac();
    speak("");
    buildUserList();
    userNameInput.value = "";
    showScreen("user");
  });

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
  document.getElementById("btn-guide").addEventListener("click", function () { openBook(0, true); });

  document.getElementById("btn-quit").addEventListener("click", function () {
    leaveGame();
    completionModal.classList.remove("show", "show-success");
    goToLevelSelect();
  });
  document.getElementById("btn-speak").addEventListener("click", function () { speak(state.sayText); });
  runBtn.addEventListener("click", run);
  delBtn.addEventListener("click", deleteBlock);
  clearBtn.addEventListener("click", clearProgram);
  programEl.addEventListener("click", function (evt) {
    // 빈 곳을 누르면 고른 블록을 놓아요
    if (evt.target === programEl && state.sel && !dragJustEnded()) selectRef(state.sel);
  });
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

  showScreen("title");
})();
