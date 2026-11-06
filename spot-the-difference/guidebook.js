// 📖 놀이 방법 팝업: 구구단 놀이터의 펭귄 달리기 안내처럼, 게임을 시작할 때마다 한 장짜리 팝업으로 방법을 보여주고
// '확인'을 누르면 시작해요. 영어 놀이(스펠링 기차 · 징검다리 · 버블 팝 · 꿀벌 · 낚시 · 디펜스 · 바구니 · 펭귄)와
// 그 구구단 버전이 같이 써요. 틀린그림 찾기(spot-the-difference/)에도 같은 파일을 복사해서 써요 (따로 배포돼서).
// (탱그램 · 카드 · 퍼즐은 자기 폴더의 예전 가이드북 책을 그대로 써요)
(function () {
  "use strict";

  var READ_KEY = "guidebook_read_v1";
  var root = null, boxEl, cur = null;

  function readMap() {
    try { return JSON.parse(localStorage.getItem(READ_KEY)) || {}; } catch (e) { return {}; }
  }
  // 시작할 때마다 방법을 보여줘야 해서, 게임 쪽에서 물어보면 늘 '아직 안 읽었어요'라고 해요
  function isRead() { return false; }
  function markRead(id) {
    var m = readMap();
    m[id] = true;
    try { localStorage.setItem(READ_KEY, JSON.stringify(m)); } catch (e) { /* storage unavailable, ignore */ }
  }

  function build() {
    root = document.createElement("div");
    root.className = "gb-overlay gb-intro";
    root.innerHTML = '<div class="gb-pop" role="dialog" aria-modal="true"></div>';
    document.body.appendChild(root);
    boxEl = root.querySelector(".gb-pop");
    // 팝업이 열려 있을 때는 키 입력이 게임으로 가지 않게 먼저 받아요 (스페이스 · 엔터 = 확인)
    document.addEventListener("keydown", function (e) {
      if (!root.classList.contains("show")) return;
      e.stopPropagation();
      if (e.key === "Enter" || e.code === "Space" || e.key === " ") { e.preventDefault(); if (!e.repeat) (cur && cur.onStart ? start() : close(true)); }
      else if (e.key === "Escape") close(true);
    }, true);
    root.addEventListener("click", function (e) { if (e.target === root && cur && !cur.onStart) close(true); });
  }

  function render() {
    var o = cur, first = o.pages[0] || { icon: "📖" };
    var items = o.pages.map(function (p) {
      return '<li><span class="gb-li-ico">' + p.icon + '</span><span><b>' + p.title + "</b><br>" + p.text + "</span></li>";
    }).join("");
    // 설명이 많으면 넓은 화면에서는 두 줄로 나란히 (확인 버튼까지 한 화면에 보이게)
    boxEl.classList.toggle("gb-many", o.pages.length > 5);
    boxEl.innerHTML =
      '<div class="gb-pop-emoji">' + (o.icon || first.icon) + "</div>" +
      "<h3>" + o.title + "</h3>" +
      '<ul class="gb-pop-list">' + items + "</ul>" +
      (o.onStart
        ? '<button type="button" class="gb-ok gb-skip">' + (o.startLabel || "확인") + "</button>" +
          '<div><button type="button" class="gb-back">← 돌아가기</button></div>'
        : '<button type="button" class="gb-ok">닫기</button>');
    boxEl.querySelector(".gb-ok").addEventListener("click", function () { if (cur && cur.onStart) start(); else close(true); });
    var back = boxEl.querySelector(".gb-back");
    if (back) back.addEventListener("click", function () { close(true); });
    boxEl.scrollTop = 0;
  }

  // 확인: 읽은 걸로 치고 바로 시작해요
  function start() {
    var o = cur;
    if (!o) return;
    markRead(o.id);
    close(false);
    if (o.onStart) o.onStart();
  }

  // opts: { id, title, pages: [{icon, title, text}], startLabel, onStart, onClose }
  function open(opts) {
    if (!root) build();
    cur = opts;
    render();
    root.classList.add("show");
  }

  function close(byUser) {
    if (!root) return;
    root.classList.remove("show");
    var o = cur;
    cur = null;
    if (byUser && o && o.onClose) o.onClose();
  }

  // (예전 가이드북 칸 · 영어 놀이에서는 쓰지 않아요)
  function tile(opts) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = (opts.className || "level-grid-btn") + " gb-tile";
    btn.innerHTML = '<div class="gb-tile-ico">📖</div><div class="gb-tile-name">게임 방법</div>';
    btn.addEventListener("click", function () { open(opts.guide()); });
    return btn;
  }

  window.GuideBook = { open: open, close: close, isRead: isRead, markRead: markRead, tile: tile };
})();
