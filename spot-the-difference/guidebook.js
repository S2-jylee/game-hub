// 📖 가이드북: 놀이 방법을 책처럼 한 장씩 넘겨 보고, 마지막 장에서 바로 시작해요.
// 게임마다 같은 파일을 복사해서 써요 (게임들이 따로따로 배포돼요).
(function () {
  "use strict";

  var READ_KEY = "guidebook_read_v1";
  var root = null, pageEl, prevBtn, nextBtn, dotsEl, numEl, titleEl;
  var cur = null, index = 0;

  function readMap() {
    try { return JSON.parse(localStorage.getItem(READ_KEY)) || {}; } catch (e) { return {}; }
  }
  function isRead(id) { return !!readMap()[id]; }
  function markRead(id) {
    var m = readMap();
    m[id] = true;
    try { localStorage.setItem(READ_KEY, JSON.stringify(m)); } catch (e) { /* storage unavailable, ignore */ }
  }

  function build() {
    root = document.createElement("div");
    root.className = "gb-overlay";
    root.innerHTML =
      '<div class="gb-book" role="dialog" aria-modal="true">' +
        '<div class="gb-head"><span class="gb-title"></span><span class="gb-num"></span></div>' +
        '<div class="gb-body">' +
          '<button type="button" class="gb-arrow gb-prev" title="앞 장">◀</button>' +
          '<div class="gb-page"></div>' +
          '<button type="button" class="gb-arrow gb-next" title="다음 장">▶</button>' +
        "</div>" +
        '<div class="gb-dots"></div>' +
        '<button type="button" class="gb-close">← 돌아가기</button>' +
      "</div>";
    document.body.appendChild(root);
    pageEl = root.querySelector(".gb-page");
    prevBtn = root.querySelector(".gb-prev");
    nextBtn = root.querySelector(".gb-next");
    dotsEl = root.querySelector(".gb-dots");
    numEl = root.querySelector(".gb-num");
    titleEl = root.querySelector(".gb-title");
    prevBtn.addEventListener("click", function () { turn(-1); });
    nextBtn.addEventListener("click", function () { turn(1); });
    root.querySelector(".gb-close").addEventListener("click", function () { close(true); });
    // 손가락으로 옆으로 밀어도 넘어가요
    var sx = null;
    pageEl.addEventListener("pointerdown", function (e) { sx = e.clientX; });
    pageEl.addEventListener("pointerup", function (e) {
      if (sx == null) return;
      var dx = e.clientX - sx;
      sx = null;
      if (Math.abs(dx) > 50) turn(dx < 0 ? 1 : -1);
    });
    // 책이 열려 있을 때는 키 입력이 게임으로 가지 않게 먼저 받아요
    document.addEventListener("keydown", function (e) {
      if (!root.classList.contains("show")) return;
      e.stopPropagation();
      if (e.key === "ArrowRight") { e.preventDefault(); turn(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); turn(-1); }
      else if (e.key === "Escape") close(true);
    }, true);
  }

  function render(dir) {
    var pages = cur.pages, last = pages.length;   // 마지막 장 = 시작 장
    var html;
    if (index === last) {
      html = '<div class="gb-icon">' + (cur.startIcon || "🚀") + "</div>" +
        '<div class="gb-start-text">' + (cur.startText || "자, 이제 시작해 볼까?") + "</div>" +
        (cur.startNote ? '<div class="gb-note">' + cur.startNote + "</div>" : "") +
        '<button type="button" class="gb-start">' + (cur.startLabel || "시작! 🚀") + "</button>";
    } else {
      var p = pages[index];
      html = '<div class="gb-icon">' + p.icon + "</div>" +
        '<div class="gb-page-title">' + p.title + "</div>" +
        '<div class="gb-text">' + p.text + "</div>" +
        (index === 0 ? '<div class="gb-note">▶ 를 누르면 다음 장으로 넘어가요</div>' : "");
    }
    pageEl.innerHTML = html;
    pageEl.classList.remove("gb-turn-next", "gb-turn-prev");
    if (dir) { void pageEl.offsetWidth; pageEl.classList.add(dir > 0 ? "gb-turn-next" : "gb-turn-prev"); }
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === last;
    nextBtn.classList.toggle("gb-nudge", index === 0);
    numEl.textContent = (index + 1) + " / " + (last + 1);
    dotsEl.innerHTML = "";
    for (var i = 0; i <= last; i++) {
      var d = document.createElement("button");
      d.type = "button";
      d.className = "gb-dot" + (i === index ? " on" : "");
      d.title = (i + 1) + "쪽";
      (function (k) { d.addEventListener("click", function () { turn(k - index); }); })(i);
      dotsEl.appendChild(d);
    }
    var start = pageEl.querySelector(".gb-start");
    if (start) start.addEventListener("click", function () {
      var o = cur;
      markRead(o.id);
      close(false);
      if (o.onStart) o.onStart();
    });
  }

  function turn(delta) {
    var next = Math.max(0, Math.min(cur.pages.length, index + delta));
    if (next === index) return;
    index = next;
    render(delta);
  }

  // opts: { id, title, pages: [{icon, title, text}], startText, startNote, startLabel, onStart, onClose }
  function open(opts) {
    if (!root) build();
    cur = opts;
    index = 0;
    titleEl.textContent = "📖 " + opts.title;
    root.classList.add("show");
    render(0);
  }

  function close(byUser) {
    if (!root) return;
    root.classList.remove("show");
    var o = cur;
    cur = null;
    if (byUser && o && o.onClose) o.onClose();
  }

  // 스테이지 고르기 맨 앞에 넣는 큰 가이드북 칸
  function tile(opts) {
    var btn = document.createElement("button");
    btn.type = "button";
    var read = isRead(opts.id);
    btn.className = (opts.className || "level-grid-btn") + " gb-tile" + (read ? " read" : "");
    btn.innerHTML = '<div class="gb-tile-ico">📖</div><div class="gb-tile-name">가이드북</div>' +
      '<div class="gb-tile-sub">' + (read ? "✔ 다 읽었어요" : "먼저 읽어요!") + "</div>";
    btn.addEventListener("click", function () { open(opts.guide()); });
    return btn;
  }

  window.GuideBook = { open: open, close: close, isRead: isRead, markRead: markRead, tile: tile };
})();
