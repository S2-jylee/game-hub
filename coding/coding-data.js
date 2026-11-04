(function () {
  "use strict";

  // 방향: 0 위, 1 오른쪽, 2 아래, 3 왼쪽
  var DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  var ABS = { U: 0, R: 1, D: 2, L: 3 };
  var ABS_KEYS = ["U", "R", "D", "L"];

  var CMD = {
    U: { icon: "⬆️", name: "위로", kind: "arrow" },
    R: { icon: "➡️", name: "오른쪽으로", kind: "arrow" },
    D: { icon: "⬇️", name: "아래로", kind: "arrow" },
    L: { icon: "⬅️", name: "왼쪽으로", kind: "arrow" },
    F: { icon: "⬆", name: "앞으로", kind: "turn" },
    TL: { icon: "↺", name: "왼쪽 돌기", kind: "turn" },
    TR: { icon: "↻", name: "오른쪽 돌기", kind: "turn" }
  };

  // ---- 같은 스테이지는 언제나 같은 맵이 나오도록 씨앗이 있는 난수를 써요 ----
  function rngFrom(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function ri(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }
  function key(x, y) { return x + "," + y; }

  // ---- 실행 엔진: 게임 화면과 스테이지 검사에서 같이 써요 ----------------------
  function countBlocks(prog) {
    return prog.reduce(function (s, it) { return s + 1 + (it.body ? it.body.length : 0); }, 0);
  }

  function simulate(level, prog) {
    var x = level.start.x, y = level.start.y, d = level.start.d;
    var need = level.stars.length, got = {}, gotN = 0;
    var steps = [], result = null;
    var starAt = {};
    level.stars.forEach(function (s, i) { starAt[key(s.x, s.y)] = i; });

    function exec(c, ref) {
      if (result) return;
      if (c === "TL" || c === "TR") {
        d = (d + (c === "TL" ? 3 : 1)) % 4;
        steps.push({ type: "turn", x: x, y: y, d: d, ref: ref });
        return;
      }
      var dir = c === "F" ? d : ABS[c];
      var nx = x + DX[dir], ny = y + DY[dir];
      if (nx < 0 || ny < 0 || nx >= level.size || ny >= level.size || level.walls[key(nx, ny)]) {
        steps.push({ type: "bump", x: x, y: y, d: d, dir: dir, out: !(nx >= 0 && ny >= 0 && nx < level.size && ny < level.size), ref: ref });
        result = "bump";
        return;
      }
      x = nx; y = ny;
      var st = { type: "move", x: x, y: y, d: d, dir: dir, ref: ref };
      var si = starAt[key(x, y)];
      if (si != null && !got[si]) { got[si] = true; gotN++; st.star = si; }
      steps.push(st);
      if (x === level.goal.x && y === level.goal.y && gotN === need) result = "win";
    }

    prog.forEach(function (it, i) {
      if (it.body) {
        for (var r = 0; r < it.loop; r++) {
          it.body.forEach(function (b, j) { exec(b.c, { i: i, j: j, r: r }); });
        }
      } else {
        exec(it.c, { i: i, j: -1 });
      }
    });
    if (!result) {
      if (!steps.length) result = "empty";
      else result = (x === level.goal.x && y === level.goal.y) ? "nostar" : "short";
    }
    return { steps: steps, result: result, gotStars: gotN };
  }

  // 가장 적은 블록 수 (반복 없이) + 그때 지나가는 칸
  function bestPath(level, relative) {
    var need = level.stars.length, full = (1 << need) - 1;
    var starAt = {};
    level.stars.forEach(function (s, i) { starAt[key(s.x, s.y)] = i; });
    function sk(x, y, d, m) { return x + "," + y + "," + d + "," + m; }
    var sd = relative ? level.start.d : 0;
    var m0 = 0;
    var start = { x: level.start.x, y: level.start.y, d: sd, m: m0, prev: null };
    var seen = {}; seen[sk(start.x, start.y, sd, m0)] = true;
    var queue = [start], head = 0;
    while (head < queue.length) {
      var s = queue[head++];
      if (s.x === level.goal.x && s.y === level.goal.y && s.m === full) {
        var cells = [], moves = [], n = 0, cur = s;
        while (cur.prev) { n++; cells.unshift({ x: cur.x, y: cur.y }); moves.unshift(cur.act); cur = cur.prev; }
        var seenCell = {}, uniq = [];
        cells.forEach(function (c) { var k = key(c.x, c.y); if (!seenCell[k]) { seenCell[k] = 1; uniq.push(c); } });
        return { length: n, cells: uniq, moves: moves };
      }
      var nexts = [];
      if (relative) {
        nexts.push({ x: s.x + DX[s.d], y: s.y + DY[s.d], d: s.d, mv: true, act: "F" });
        nexts.push({ x: s.x, y: s.y, d: (s.d + 3) % 4, act: "TL" });
        nexts.push({ x: s.x, y: s.y, d: (s.d + 1) % 4, act: "TR" });
      } else {
        for (var k = 0; k < 4; k++) nexts.push({ x: s.x + DX[k], y: s.y + DY[k], d: 0, mv: true, act: ABS_KEYS[k] });
      }
      nexts.forEach(function (t) {
        if (t.mv && (t.x < 0 || t.y < 0 || t.x >= level.size || t.y >= level.size || level.walls[key(t.x, t.y)])) return;
        var m = s.m;
        if (t.mv && starAt[key(t.x, t.y)] != null) m |= 1 << starAt[key(t.x, t.y)];
        var kk = sk(t.x, t.y, t.d, m);
        if (seen[kk]) return;
        seen[kk] = true;
        queue.push({ x: t.x, y: t.y, d: t.d, m: m, act: t.act, prev: s });
      });
    }
    return null;
  }

  // ---- 맵 만들기 ----------------------------------------------------------
  // 서로 옆에 붙지 않는 꼬불꼬불한 길 (지름길이 잘 안 생겨요)
  function randomWalk(rng, size, len, straight) {
    for (var attempt = 0; attempt < 400; attempt++) {
      var x = ri(rng, 0, size - 1), y = ri(rng, 0, size - 1), d = ri(rng, 0, 3);
      var cells = [{ x: x, y: y }], moves = [], used = {};
      used[key(x, y)] = true;
      var ok = true;
      for (var s = 0; s < len; s++) {
        var opts = rng() < straight ? [d, (d + 1) % 4, (d + 3) % 4] : (rng() < 0.5 ? [(d + 1) % 4, (d + 3) % 4, d] : [(d + 3) % 4, (d + 1) % 4, d]);
        var moved = false;
        for (var o = 0; o < opts.length && !moved; o++) {
          var nd = opts[o], nx = x + DX[nd], ny = y + DY[nd];
          if (nx < 0 || ny < 0 || nx >= size || ny >= size || used[key(nx, ny)]) continue;
          var touch = false;
          for (var k = 0; k < 4; k++) {
            var ax = nx + DX[k], ay = ny + DY[k];
            if ((ax !== x || ay !== y) && used[key(ax, ay)]) touch = true;
          }
          if (touch) continue;
          x = nx; y = ny; d = nd; moved = true;
          used[key(x, y)] = true; cells.push({ x: x, y: y }); moves.push(nd);
        }
        if (!moved) { ok = false; break; }
      }
      if (ok) return { cells: cells, moves: moves };
    }
    return null;
  }

  // 길이 아닌 칸에 나무·바위를 심어요
  function plantWalls(rng, size, open, density) {
    var walls = {};
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
      if (!open[key(x, y)] && rng() < density) walls[key(x, y)] = true;
    }
    return walls;
  }

  function cellsOpen(cells) {
    var open = {};
    cells.forEach(function (c) { open[key(c.x, c.y)] = true; });
    return open;
  }

  function finish(level, relative) {
    var bp = bestPath(level, relative);
    if (!bp) return null;
    level.best = bp.length;
    level.hintCells = bp.cells;
    return level;
  }

  // 길 위 / 길 옆 막다른 칸에 별을 놓아요
  function placeStars(rng, size, walk, count, spurs, open) {
    var stars = [], used = {};
    used[key(walk.cells[0].x, walk.cells[0].y)] = true;
    used[key(walk.cells[walk.cells.length - 1].x, walk.cells[walk.cells.length - 1].y)] = true;
    for (var n = 0; n < count; n++) {
      var placed = false;
      for (var t = 0; t < 60 && !placed; t++) {
        var idx = ri(rng, 1, walk.cells.length - 2), c = walk.cells[idx];
        if (n < spurs) {
          var k = ri(rng, 0, 3), sx = c.x + DX[k], sy = c.y + DY[k];
          if (sx < 0 || sy < 0 || sx >= size || sy >= size || open[key(sx, sy)] || used[key(sx, sy)]) continue;
          open[key(sx, sy)] = true; used[key(sx, sy)] = true;
          stars.push({ x: sx, y: sy }); placed = true;
        } else if (!used[key(c.x, c.y)]) {
          used[key(c.x, c.y)] = true;
          stars.push({ x: c.x, y: c.y }); placed = true;
        }
      }
      if (!placed) return null;
    }
    return stars;
  }

  function walkLevel(rng, opt) {
    for (var attempt = 0; attempt < 60; attempt++) {
      var len = Math.max(2, opt.len - Math.floor(attempt / 15));
      var walk = randomWalk(rng, opt.size, len, opt.straight);
      if (!walk) continue;
      var open = cellsOpen(walk.cells);
      var stars = placeStars(rng, opt.size, walk, opt.stars || 0, opt.spurs || 0, open);
      if (!stars) continue;
      var first = walk.moves[0];
      var sd = opt.relative ? (opt.faceFirst ? first : (first + ri(rng, 1, 3)) % 4) : 1;
      var level = {
        size: opt.size,
        start: { x: walk.cells[0].x, y: walk.cells[0].y, d: sd },
        goal: walk.cells[walk.cells.length - 1],
        walls: plantWalls(rng, opt.size, open, opt.density),
        stars: stars
      };
      level = finish(level, opt.relative);
      if (!level || level.best < Math.ceil(len * 0.8)) continue;   // 지름길이 생기면 다시 만들어요
      level.walkMoves = walk.moves;
      return level;
    }
    throw new Error("level gen failed");
  }

  // 반복이 꼭 필요한 맵: 앞부분 + (무늬 × 횟수) + 뒷부분
  function loopLevel(rng, opt) {
    for (var attempt = 0; attempt < 500; attempt++) {
      var k = opt.k, reps = ri(rng, opt.reps[0], opt.reps[1]);
      var pre = ri(rng, opt.pre[0], opt.pre[1]), post = ri(rng, opt.post[0], opt.post[1]);
      var pattern = [], last = -1;
      for (var i = 0; i < k; i++) {
        var m;
        do { m = ri(rng, 0, 3); } while (last >= 0 && m === (last + 2) % 4);
        pattern.push(m); last = m;
      }
      // 다음 반복으로 넘어갈 때 뒤로 돌아가면 안 돼요
      if (k > 1 && pattern[0] === (pattern[k - 1] + 2) % 4) continue;
      var ndx = 0, ndy = 0;
      pattern.forEach(function (p) { ndx += DX[p]; ndy += DY[p]; });
      if (ndx === 0 && ndy === 0) continue;
      var prefix = [], suffix = [];
      for (i = 0; i < pre; i++) prefix.push(ri(rng, 0, 3));
      for (i = 0; i < post; i++) suffix.push(ri(rng, 0, 3));
      var moves = prefix.slice();
      for (var r = 0; r < reps; r++) moves = moves.concat(pattern);
      moves = moves.concat(suffix);
      // 칸이 겹치지 않는지, 판 안에 들어가는지 확인해요
      var x = 0, y = 0, cells = [{ x: 0, y: 0 }], used = { "0,0": true }, bad = false;
      for (i = 0; i < moves.length; i++) {
        x += DX[moves[i]]; y += DY[moves[i]];
        if (used[key(x, y)]) { bad = true; break; }
        used[key(x, y)] = true; cells.push({ x: x, y: y });
      }
      if (bad) continue;
      var minX = 0, maxX = 0, minY = 0, maxY = 0;
      cells.forEach(function (c) { minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x); minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y); });
      var need = Math.max(maxX - minX, maxY - minY) + 1;
      var size = Math.max(opt.minSize, need);
      if (size > 8) continue;
      var ox = ri(rng, 0, size - 1 - (maxX - minX)) - minX, oy = ri(rng, 0, size - 1 - (maxY - minY)) - minY;
      cells = cells.map(function (c) { return { x: c.x + ox, y: c.y + oy }; });
      var level = {
        size: size,
        start: { x: cells[0].x, y: cells[0].y, d: 1 },
        goal: cells[cells.length - 1],
        walls: plantWalls(rng, size, cellsOpen(cells), opt.density),
        stars: []
      };
      level = finish(level, false);
      if (!level) continue;
      var prog = prefix.map(function (p) { return { c: ABS_KEYS[p] }; });
      prog.push({ loop: reps, body: pattern.map(function (p) { return { c: ABS_KEYS[p] }; }) });
      suffix.forEach(function (p) { prog.push({ c: ABS_KEYS[p] }); });
      var limit = countBlocks(prog);
      if (limit >= level.best) continue;            // 반복 없이도 풀리면 연습이 안 돼요
      if (simulate(level, prog).result !== "win") continue;
      level.solution = prog;
      level.limit = limit;
      return level;
    }
    throw new Error("loop gen failed");
  }

  // 정답 코드에 버그를 몇 개 심어요 (틀린 방향 / 필요 없는 블록 / 틀린 반복 횟수)
  function addBugs(rng, level, prog, count) {
    for (var attempt = 0; attempt < 300; attempt++) {
      var p = JSON.parse(JSON.stringify(prog)), done = 0, kinds = [];
      while (done < count) {
        var kind = ri(rng, 0, 9);
        var loops = p.filter(function (it) { return it.body; });
        if (kind >= 8 && loops.length) {
          var lp = loops[ri(rng, 0, loops.length - 1)], nv;
          do { nv = lp.loop + (rng() < 0.5 ? -1 : 1); } while (nv < 2);
          if (nv === lp.loop) continue;
          lp.loop = nv; kinds.push("count");
        } else if (kind >= 6) {
          // 필요 없는 블록 끼우기
          var at = ri(rng, 0, p.length);
          p.splice(at, 0, { c: ABS_KEYS[ri(rng, 0, 3)] });
          kinds.push("extra");
        } else {
          var flat = [];
          p.forEach(function (it, i) {
            if (it.body) it.body.forEach(function (b, j) { flat.push(b); });
            else flat.push(it);
          });
          var b = flat[ri(rng, 0, flat.length - 1)], nc;
          do { nc = ABS_KEYS[ri(rng, 0, 3)]; } while (nc === b.c);
          b.c = nc; kinds.push("wrong");
        }
        done++;
      }
      if (simulate(level, p).result === "win") continue;
      return p;
    }
    throw new Error("bug gen failed");
  }

  // ---- 놀이별 스테이지 100개 ----------------------------------------------------
  var N_STAGES = 100;
  function t(n) { return (n - 1) / (N_STAGES - 1); }   // 0 ~ 1

  function arrowStage(n) {
    var rng = rngFrom(hash("arrow-" + n));
    var size = n <= 10 ? 4 : n <= 30 ? 5 : n <= 55 ? 6 : n <= 80 ? 7 : 8;
    var stars = n <= 15 ? 0 : n <= 45 ? 1 : n <= 75 ? 2 : 3;
    var spurs = n <= 30 ? 0 : n <= 60 ? 1 : n <= 85 ? 1 : 2;
    var lvl = walkLevel(rng, {
      size: size, len: Math.round(3 + t(n) * 13) + ri(rng, 0, 1), straight: 0.5,
      stars: stars, spurs: Math.min(spurs, stars), density: 0.3 + 0.4 * t(n)
    });
    lvl.cmds = ["U", "R", "D", "L"];
    return lvl;
  }

  function turnStage(n) {
    var rng = rngFrom(hash("turn-" + n));
    var size = n <= 12 ? 4 : n <= 35 ? 5 : n <= 65 ? 6 : 7;
    var stars = n <= 30 ? 0 : n <= 70 ? 1 : 2;
    var lvl = walkLevel(rng, {
      size: size, len: Math.round(2 + t(n) * 11) + ri(rng, 0, 1), straight: 0.55,
      relative: true, faceFirst: n <= 10,
      stars: stars, spurs: n > 70 ? 1 : 0, density: 0.3 + 0.4 * t(n)
    });
    lvl.cmds = ["F", "TL", "TR"];
    return lvl;
  }

  function loopOpt(n) {
    if (n <= 15) return { k: 1, reps: [3, 5 + (n > 8 ? 1 : 0)], pre: [0, n > 8 ? 1 : 0], post: [0, n > 11 ? 1 : 0], minSize: 5 };
    if (n <= 40) return { k: 2, reps: [3, n > 28 ? 4 : 3], pre: [0, n > 24 ? 1 : 0], post: [0, n > 32 ? 1 : 0], minSize: 5 };
    if (n <= 70) return { k: 3, reps: [2, n > 55 ? 4 : 3], pre: [0, n > 50 ? 2 : 1], post: [0, n > 60 ? 2 : 1], minSize: 6 };
    return { k: n > 85 ? 4 : ri(rngFrom(n), 2, 3), reps: [n > 85 ? 2 : 3, n > 85 ? 3 : 5], pre: [0, 2], post: [0, 2], minSize: 6 };
  }
  function loopStage(n) {
    var rng = rngFrom(hash("loop-" + n));
    var opt = loopOpt(n);
    opt.density = 0.45 + 0.3 * t(n);
    var lvl = loopLevel(rng, opt);
    lvl.cmds = ["U", "R", "D", "L"];
    lvl.loop = true;
    return lvl;
  }

  function bugStage(n) {
    var rng = rngFrom(hash("bug-" + n));
    var lvl, prog, bugs;
    if (n <= 50) {
      lvl = walkLevel(rng, {
        size: n <= 15 ? 4 : n <= 35 ? 5 : 6, len: Math.round(3 + t(n * 2 - 1) * 9) + ri(rng, 0, 1),
        straight: 0.5, stars: 0, density: 0.35 + 0.3 * t(n * 2 - 1)
      });
      prog = lvl.walkMoves.map(function (m) { return { c: ABS_KEYS[m] }; });
      bugs = n <= 20 ? 1 : n <= 40 ? 2 : 3;
    } else {
      var m = n - 50;
      var opt = loopOpt(Math.min(100, m * 2));
      opt.density = 0.5 + 0.25 * t(m * 2);
      lvl = loopLevel(rng, opt);
      prog = lvl.solution;
      lvl.loop = true;
      lvl.limit = null;
      bugs = m <= 25 ? 1 : 2;
    }
    lvl.cmds = ["U", "R", "D", "L"];
    lvl.prefill = addBugs(rng, lvl, prog, bugs);
    lvl.bugs = bugs;
    lvl.best = Math.min(lvl.best, countBlocks(prog));
    return lvl;
  }

  function stagesFor(id, make, labelOf) {
    var list = [];
    for (var n = 1; n <= N_STAGES; n++) {
      var lvl = make(n);
      lvl.id = "coding-" + id + "-" + n;
      lvl.n = n;
      lvl.label = labelOf(lvl);
      list.push(lvl);
    }
    return list;
  }

  var CATEGORIES = [
    {
      id: "arrow", name: "화살표 길찾기", icon: "🧭", color: "pink", guide: "arrow",
      desc: "⬆️➡️⬇️⬅️ 화살표로 길을 알려줘요",
      make: arrowStage,
      labelOf: function (l) { return "👣 " + l.best + "걸음" + (l.stars.length ? " · ⭐" + l.stars.length : ""); }
    },
    {
      id: "turn", name: "돌고 걷기", icon: "🔄", color: "sky", guide: "turn",
      desc: "앞으로 · 왼쪽 돌기 · 오른쪽 돌기",
      make: turnStage,
      labelOf: function (l) { return "🔄 블록 " + l.best + "개" + (l.stars.length ? " · ⭐" + l.stars.length : ""); }
    },
    {
      id: "loop", name: "반복 마법", icon: "🔁", color: "mint", guide: "loop",
      desc: "똑같은 건 🔁 반복으로 짧게!",
      make: loopStage,
      labelOf: function (l) { return "🔁 블록 " + l.limit + "개까지"; }
    },
    {
      id: "bug", name: "버그 고치기", icon: "🐞", color: "peach", guide: "bug",
      desc: "틀린 코드를 찾아서 고쳐요",
      make: bugStage,
      labelOf: function (l) { return "🐞 버그 " + l.bugs + "개" + (l.loop ? " · 🔁" : ""); }
    }
  ];

  // 스테이지는 처음 열 때 만들어요 (놀이 400개를 한꺼번에 만들면 느려요)
  CATEGORIES.forEach(function (cat) {
    var cache = null;
    Object.defineProperty(cat, "stages", {
      get: function () { return cache || (cache = stagesFor(cat.id, cat.make, cat.labelOf)); }
    });
  });

  // ---- 가이드북 ----------------------------------------------------------------
  // board: 줄마다 한 글자씩. . 빈칸  T 나무  S 토끼  G 당근  * 별  o 발자국
  var GUIDES = {
    arrow: {
      title: "코딩이 뭐예요?",
      pages: [
        { title: "토끼에게 길을 알려줘요", board: { rows: ["S..G"], d: 1 }, prog: ["R", "R", "R"],
          text: "토끼는 <b>우리가 말한 대로만</b> 움직여요.<br>명령을 <b>차례대로</b> 늘어놓는 것, 그게 바로 <b>코딩</b>이에요!" },
        { title: "화살표 블록", blocks: ["U", "R", "D", "L"],
          text: "블록 하나에 <b>딱 한 칸</b>씩 움직여요.<br>⬆️ 위로, ➡️ 오른쪽으로, ⬇️ 아래로, ⬅️ 왼쪽으로!" },
        { title: "칸을 세어 봐요", board: { rows: ["Soo.", "T.o.", "..oG"], d: 1 }, prog: ["R", "R", "D", "D", "R"],
          text: "👣 발자국을 따라가며 <b>몇 칸</b>, <b>어느 쪽</b>인지 세어 봐요.<br>오른쪽 2칸, 아래 2칸, 오른쪽 1칸!" },
        { title: "나무에 부딪히면 멈춰요", board: { rows: ["S.T.", "...G"], d: 1 }, prog: ["R", "R"],
          text: "🌳 나무나 🪨 바위가 있는 칸으로는 못 가요.<br>부딪히면 <b>빨간 블록</b>이 어디가 틀렸는지 알려줘요." },
        { title: "⭐ 별도 모아요", board: { rows: ["S*.", "T.G"], d: 1 }, prog: ["R", "R", "D"],
          text: "별이 있는 스테이지에서는 <b>별을 다 모아야</b> 당근을 먹을 수 있어요.<br>다 놓았으면 <b>▶ 실행</b>을 눌러요!" },
        { title: "블록 고치기", board: { rows: ["S..", ".oG"], d: 1 }, prog: ["R", "U", "R"], sel: 1,
          text: "블록을 <b>끌어서</b> 코드 사이 원하는 자리에 쏙 끼워 넣을 수 있어요.<br>놓은 블록을 <b>톡</b> 누르고 다른 블록을 누르면 <b>바뀌어요</b>.<br>코드 <b>밖으로 끌어내거나</b> ⌫ 지우기를 누르면 지워져요." }
      ]
    },
    turn: {
      title: "방향 바꾸기",
      pages: [
        { title: "토끼가 바라보는 쪽", board: { rows: ["S..G"], d: 1, face: true }, prog: ["F", "F", "F"],
          text: "토끼 옆의 <b>노란 화살표</b>가 토끼가 <b>바라보는 쪽</b>이에요.<br>⬆ <b>앞으로</b>는 바라보는 쪽으로 한 칸 가요." },
        { title: "돌기 블록", blocks: ["F", "TL", "TR"],
          text: "↺ <b>왼쪽 돌기</b>, ↻ <b>오른쪽 돌기</b>는<br>제자리에서 <b>방향만</b> 바꿔요. 움직이지는 않아요!" },
        { title: "돌고 나서 걸어요", board: { rows: ["S.", ".o", ".G"], d: 1, face: true }, prog: ["F", "TR", "F", "F"],
          text: "오른쪽을 보고 있다가 ↻ 오른쪽으로 돌면<br>이제 <b>아래</b>를 봐요. 그다음 ⬆ 앞으로 가면 아래로 가요." },
        { title: "내가 토끼가 되어 봐요", board: { rows: ["S", "o", "G"], d: 2, face: true }, prog: ["F", "F"],
          text: "토끼가 <b>아래</b>를 볼 때는 헷갈려요.<br>몸을 토끼처럼 돌려 보면 쉬워요. 토끼의 <b>오른쪽</b>은 화면의 <b>왼쪽</b>이에요!" },
        { title: "뒤로 돌기", board: { rows: ["G.S"], d: 1, face: true }, prog: ["TL", "TL", "F", "F"],
          text: "같은 쪽으로 <b>두 번</b> 돌면 뒤를 봐요.<br>별이 막다른 길에 있으면 뒤로 돌아서 나와요." }
      ]
    },
    loop: {
      title: "반복 마법",
      pages: [
        { title: "똑같은 블록이 계속?", board: { rows: ["Sooo.G"], d: 1 }, prog: ["R", "R", "R", "R", "R"],
          text: "➡️ 블록을 다섯 번이나 놓아야 해요.<br>좀 더 <b>짧게</b> 쓸 수는 없을까요?" },
        { title: "🔁 반복 블록", board: { rows: ["Sooo.G"], d: 1 }, prog: [{ loop: 5, body: ["R"] }],
          text: "<b>🔁 5번 반복</b> 안에 ➡️ 하나만 넣으면<br>➡️ 다섯 개와 똑같아요. 블록 <b>2개</b>로 끝!" },
        { title: "여러 블록도 반복해요", board: { rows: ["So..", ".oo.", "..oo", "...G"], d: 1 }, prog: [{ loop: 3, body: ["R", "D"] }],
          text: "계단 모양은 ➡️⬇️ 가 <b>되풀이</b>돼요.<br>되풀이되는 <b>무늬</b>를 찾는 게 반복 마법의 비밀이에요!" },
        { title: "반복 블록 쓰는 법", loopHow: true,
          text: "① <b>🔁 반복</b>을 누르거나 끌어다 놓아요<br>② 넣을 블록을 <b>‘여기에 쏙!’</b> 칸으로 <b>끌어다 놓아요</b><br>　(반복이 골라져 있을 때는 그냥 눌러도 들어가요)<br>③ <b>－ ＋</b> 로 몇 번 할지 정해요<br>④ <b>✔ 다 넣었어요</b>를 누르면 밖으로 나와요" },
        { title: "블록 개수 제한", blocks: [],
          text: "반복 마법 스테이지는 <b>블록 개수</b>가 정해져 있어요.<br>🔁 반복 블록도 <b>1개</b>로 세요. 반복을 써야만 풀 수 있어요!" }
      ]
    },
    bug: {
      title: "버그 고치기",
      pages: [
        { title: "버그가 뭐예요?", bugIcon: true,
          text: "코드 속의 <b>실수</b>를 <b>버그(벌레)</b>라고 해요.<br>옛날 컴퓨터 속에 진짜 나방이 들어가 고장 난 적이 있대요! 🦋" },
        { title: "먼저 실행해 봐요", board: { rows: ["S..", "..G"], d: 1 }, prog: ["R", "U", "R"], bad: 1,
          text: "▶ 실행을 눌러 보면 토끼가 <b>어디서</b> 길을 잃는지 보여요.<br>틀린 곳의 블록이 <b>빨갛게</b> 바뀌어요." },
        { title: "블록 바꾸기", board: { rows: ["S..", ".oG"], d: 1 }, prog: ["R", "D", "R"], sel: 1,
          text: "틀린 블록을 <b>톡</b> 눌러 고르고<br>맞는 화살표를 누르면 <b>바뀌어요</b>." },
        { title: "필요 없는 블록 지우기", blocks: [],
          text: "남는 블록은 톡 눌러 고른 다음 <b>⌫ 지우기</b>를 눌러요.<br>🔁 반복 횟수가 틀렸을 때는 <b>－ ＋</b> 로 고쳐요." },
        { title: "진짜 개발자처럼!", bugIcon: true,
          text: "개발자들도 매일 버그를 고쳐요.<br><b>실행 → 살펴보기 → 고치기</b>를 되풀이하면 꼭 고칠 수 있어요!" }
      ]
    }
  };

  window.CodingData = {
    CATEGORIES: CATEGORIES,
    GUIDES: GUIDES,
    CMD: CMD,
    DX: DX, DY: DY,
    key: key,
    simulate: simulate,
    countBlocks: countBlocks,
    bestPath: bestPath
  };
})();
