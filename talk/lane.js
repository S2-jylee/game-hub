/* 3줄 달리기 트랙: 위에서 판(보드) 3개가 한 줄로 내려오고, 아래의 캐릭터를 ◀ ▶ (방향키 · 옆으로 밀기 · 줄 톡)로
   옮겨서 원하는 판을 지나가요. 판이 캐릭터에 닿는 순간 어느 줄에 있었는지 onPass 로 알려줘요.
   make(field, { player: "🐰", travel: 6 (초) , onPass(row, lane) })  →  { spawn(texts, data), clear(), stop(), lane() } */
(function () {
  "use strict";
  function make(field, opt) {
    field.classList.add("lane-field");
    var player = document.createElement("div");
    player.className = "lane-player";
    player.textContent = opt.player || "🐰";
    field.appendChild(player);
    var help = document.createElement("div");
    help.className = "lane-help";
    help.textContent = "◀ ▶ 로 줄을 바꿔요";
    field.appendChild(help);
    var padL = document.createElement("div"), padR = document.createElement("div");
    padL.className = "lane-pad left"; padL.textContent = "◀";
    padR.className = "lane-pad right"; padR.textContent = "▶";
    field.appendChild(padL); field.appendChild(padR);

    var lane = 1, rows = [], raf = 0, last = 0, alive = true;
    function place() { player.style.left = (lane * 33.333) + "%"; }
    function move(d) { if (Talk.paused()) return; lane = Math.max(0, Math.min(2, lane + d)); place(); help.style.display = "none"; }
    function goto(l) { if (Talk.paused()) return; lane = l; place(); help.style.display = "none"; }
    place();

    function press(el, d) {
      el.addEventListener("pointerdown", function (e) { e.preventDefault(); e.stopPropagation(); move(d); });
    }
    press(padL, -1); press(padR, 1);
    function onKey(e) {
      if (!alive || !field.isConnected || field.offsetParent === null) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
    }
    document.addEventListener("keydown", onKey);
    // 옆으로 밀거나, 가고 싶은 줄을 톡
    var sx = null, sy = null;
    field.addEventListener("pointerdown", function (e) { sx = e.clientX; sy = e.clientY; });
    field.addEventListener("pointerup", function (e) {
      if (sx == null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) { move(dx > 0 ? 1 : -1); return; }
      var r = field.getBoundingClientRect();
      goto(Math.max(0, Math.min(2, Math.floor((e.clientX - r.left) / (r.width / 3)))));
    });

    function spawn(texts, data) {
      var row = { y: -90, data: data, els: [], done: false };
      texts.forEach(function (t, i) {
        var b = document.createElement("div");
        b.className = "lane-board";
        b.style.left = "calc(" + (i * 33.333) + "% + 5px)";
        b.textContent = t;
        field.appendChild(b);
        row.els.push(b);
      });
      row.h = Math.max.apply(null, row.els.map(function (b) { return b.offsetHeight; }));
      row.y = -row.h - 6;
      rows.push(row);
      draw(row);
      return row;
    }
    function draw(row) { row.els.forEach(function (b) { b.style.transform = "translateY(" + row.y + "px)"; }); }
    function clear() { rows.forEach(function (r) { r.els.forEach(function (b) { b.remove(); }); }); rows = []; }

    function frame(now) {
      if (!alive) return;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!Talk.paused()) {
        var H = field.clientHeight;
        var speed = (H + 80) / (opt.travel || 6);
        var py = player.offsetTop + 6;
        rows.forEach(function (row) {
          row.y += speed * dt;
          draw(row);
          if (!row.done && row.y + row.h >= py) {
            row.done = true;
            var res = opt.onPass(row, lane);
            row.els.forEach(function (b, i) {
              if (res && res.correct === i) b.classList.add("ok");
              else if (i === lane) b.classList.add("no");
            });
            if (res && res.hit) { player.classList.remove("hit"); void player.offsetWidth; player.classList.add("hit"); }
            setTimeout(function () { row.els.forEach(function (b) { b.classList.add("fade"); }); }, 260);
            setTimeout(function () { row.els.forEach(function (b) { b.remove(); }); rows = rows.filter(function (r) { return r !== row; }); }, 700);
          }
        });
      }
      raf = requestAnimationFrame(frame);
    }
    last = performance.now();
    raf = requestAnimationFrame(frame);

    return {
      spawn: spawn,
      clear: clear,
      lane: function () { return lane; },
      playerRect: function () { return player.getBoundingClientRect(); },
      stop: function () { alive = false; cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); clear(); }
    };
  }
  window.Lane = { make: make };
})();
