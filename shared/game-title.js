/* 게임 제목 왼쪽 '←' 뒤로 버튼
   - 같은 화면에 이미 있는 뒤로 가기 버튼(← 학년 고르기, 처음으로 …)이 보이면 그걸 대신 눌러요
   - 그런 버튼이 없으면(허브에서 연 첫 화면) 게임 허브 홈으로 돌아가요 */
(function () {
  // 음성 읽기(영어 단어·문제 읽어주기)는 모든 게임에서 꺼요
  try {
    // 회화 게임(<html data-tts>)은 듣기가 중요해서 음성을 그대로 둬요
    if (window.speechSynthesis && !document.documentElement.hasAttribute("data-tts")) {
      window.speechSynthesis.speak = function () {};
      window.speechSynthesis.cancel();
    }
  } catch (e) { /* 지원하지 않는 브라우저 */ }

  function visible(el) { return !!el && el.getClientRects().length > 0; }

  function goHubHome() {
    // 영어 게임처럼 돌아갈 메뉴(← 영어 놀이)가 있으면 그리로
    var menu = document.querySelector("a.back-link[href]");
    if (menu && !/[?&]mul=1/.test(location.search)) { location.href = menu.href; return; }
    if (window.parent !== window) window.parent.postMessage({ type: "hub-home" }, "*");
    else location.href = "../index.html";
  }

  function findBack(screen) {
    if (!screen) return null;
    var cands = screen.querySelectorAll("button, a");
    for (var i = 0; i < cands.length; i++) {
      var b = cands[i], t = (b.textContent || "").trim();
      // 아래 '처음으로/← …' 줄을 화면에서 숨겼어도(영어 게임 메인) 그 버튼을 대신 눌러요. 허브가 숨긴 버튼(style=display:none)은 빼요
      if (b.classList.contains("gt-back") || b.style.display === "none") continue;
      if (!visible(b) && !b.closest(".en-main")) continue;
      if (t.charAt(0) === "←" || t === "처음으로" || t.indexOf("처음으로") >= 0) return b;
    }
    return null;
  }

  // outside: 제목 바깥(바로 앞)에 둬요. 타자연습 제목은 마우스를 올리면 커져서(transform),
  // 안에 있으면 고정(fixed)된 버튼이 제목 옆으로 튀어요
  function addBack(h1, onClick, outside) {
    if (h1.querySelector(".gt-back") || (outside && h1.previousElementSibling && h1.previousElementSibling.classList.contains("gt-back"))) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gt-back";
    btn.setAttribute("aria-label", "뒤로");
    btn.title = "뒤로";
    btn.textContent = "←";
    btn.addEventListener("click", function (e) { e.stopPropagation(); onClick(); });
    if (outside) h1.parentNode.insertBefore(btn, h1); else h1.insertBefore(btn, h1.firstChild);
  }

  // 구구단 놀이터에서 연 게임(?mul=1)은 제목도 구구단 이름으로 (스펠링 기차 → 구구단 기차 …)
  var MUL_NAMES = { "스펠링 기차": "구구단 기차", "단어 징검다리": "구구단 징검다리", "알파벳 버블 팝": "구구단 버블 팝",
    "꿀벌 비행": "구구단 꿀벌 비행", "알파벳 낚시": "구구단 낚시", "외계인 단어 디펜스": "구구단 디펜스" };
  function mulTitles() {
    if (!/[?&]mul=1/.test(location.search)) return;
    Array.prototype.forEach.call(document.querySelectorAll("h1.game-title"), function (h1) {
      Array.prototype.forEach.call(h1.childNodes, function (n) {
        if (n.nodeType === 3 && MUL_NAMES[n.nodeValue.trim()]) n.nodeValue = n.nodeValue.replace(n.nodeValue.trim(), MUL_NAMES[n.nodeValue.trim()]);
      });
    });
  }

  function init() {
    mulTitles();
    Array.prototype.forEach.call(document.querySelectorAll("h1.game-title"), function (h1) {
      addBack(h1, function () {
        var back = findBack(h1.closest("section, .screen"));
        if (back) back.click(); else goHubHome();
      });
    });
    // 타자연습: 연습 화면이면 홈 카드로, 홈이면 허브로
    var typing = document.getElementById("home-link");
    if (typing) {
      typing.classList.add("game-title-typing");
      addBack(typing, function () {
        var home = document.getElementById("home-view"), who = document.getElementById("user-screen");
        // '누구인가요?' 화면이 떠 있으면 연습 홈이 아니라 허브로 돌아가요
        if (who && who.classList.contains("show")) { goHubHome(); return; }
        if (home && !visible(home)) typing.click(); else goHubHome();
      }, true);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* ---- 제목과 그 다음 버튼·타일의 세로 위치를 말랑말랑 타자연습과 같게 맞춰요 ----
   타자연습 기준(직접 잰 값): 휴대폰(폭 560 이하) 제목 위 14px · 다음 줄 55px / 그보다 넓으면 37px · 105px */
(function () {
  function target() { return window.innerWidth <= 560 ? { top: 14, next: 55 } : { top: 15, next: 83 }; }   // PC: 제목 위 15px
  function shown(el) { return !!el && el.getClientRects().length > 0; }
  function nextBelow(t) {
    var r = t.getBoundingClientRect(), best = null;
    var scope = t.closest("section, .screen") || document.body;
    // 스테이지 고르기처럼 타일 묶음이 있으면 첫 타일을 기준으로 (투명한 카드 테두리가 아니라 타일 자체를 맞춰요)
    var firstTile = scope.querySelector(".level-grid > *, .grade-grid > *, .mode-grid > *, .play-grid > *, .tile-grid > *, .arcade-grid > *");
    if (shown(firstTile) && firstTile.getBoundingClientRect().top >= r.bottom - 1) {
      var ft = firstTile.getBoundingClientRect();
      var other = null;
      Array.prototype.forEach.call(scope.querySelectorAll("button, .btn, .row, .panel, .question-card"), function (e) {
        if (t.contains(e) || !shown(e) || e.closest(".scene, .en-bg, .gt-back") || firstTile.parentElement.contains(e)) return;
        var b = e.getBoundingClientRect();
        if (b.height > 20 && b.top >= r.bottom - 1 && b.top < ft.top && (!other || b.top < other.top)) other = b;
      });
      return other || ft;
    }
    Array.prototype.forEach.call(scope.querySelectorAll("*"), function (e) {
      if (t.contains(e) || !shown(e) || e.closest(".scene, .en-bg, .gt-back")) return;
      if (getComputedStyle(e).position === "fixed") return;
      var b = e.getBoundingClientRect();
      if (b.height > 20 && b.top >= r.bottom - 1 && (!best || b.top < best.top)) best = b;
    });
    return best;
  }
  var busy = false;
  function align() {
    if (busy) return; busy = true;
    var T = target();
    Array.prototype.forEach.call(document.querySelectorAll("h1.game-title"), function (t) {
      if (!shown(t)) return;
      // 스크롤된 상태에서는 제목이 위에 붙어(sticky) 있어서 위치를 잴 수 없어요. 맨 위일 때만 맞춰요
      for (var p = t.parentElement; p && p !== document.body; p = p.parentElement) { if (p.scrollTop > 0) return; }
      if ((document.scrollingElement || document.documentElement).scrollTop > 0) return;
      var cs = getComputedStyle(t);
      var top = t.getBoundingClientRect().top;
      t.style.marginTop = Math.round(parseFloat(cs.marginTop) + (T.top - top)) + "px";
      var n = nextBelow(t);
      if (n) t.style.marginBottom = Math.round(parseFloat(getComputedStyle(t).marginBottom) + (T.next - n.top)) + "px";
    });
    busy = false;
  }
  var queued = false;
  function queue() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; align(); }); } }
  function init() {
    if (!document.querySelector("h1.game-title")) return;
    align();
    window.addEventListener("resize", queue);
    // 화면이 바뀌면(학년 → 난이도 등) 다시 맞춰요
    new MutationObserver(queue).observe(document.body, { attributes: true, subtree: true, attributeFilter: ["class", "hidden"] });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* ---- 스크롤해서 제목 밑으로 내용이 지나가면 제목(타자연습은 머리줄)에 gt-stuck 을 붙여 반투명 띠를 깔아요 ---- */
(function () {
  function scroller(el) {
    for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      var oy = getComputedStyle(p).overflowY;
      if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight + 1) return p;
    }
    return document.scrollingElement || document.documentElement;
  }
  var queued = false;
  function update() {
    queued = false;
    Array.prototype.forEach.call(document.querySelectorAll("h1.game-title, .app-header"), function (el) {
      if (!el.getClientRects().length) return;
      el.classList.toggle("gt-stuck", scroller(el).scrollTop > 4);
    });
    // ← 뒤로 버튼은 제목 띠의 세로 가운데에 맞춰요 (제목이 위에 붙어도 띠 밖으로 넘어가지 않게)
    Array.prototype.forEach.call(document.querySelectorAll(".gt-back"), function (btn) {
      if (!btn.getClientRects().length) return;
      var title = btn.closest("h1.game-title") || btn.nextElementSibling;
      if (!title || !title.getClientRects().length) return;
      var band = title.closest(".app-header") || title;
      var tr = band.getBoundingClientRect(), br = btn.getBoundingClientRect(), h = btn.offsetHeight;
      var want = Math.max(4 + h / 2, tr.top + tr.height / 2);
      var cur = parseFloat(getComputedStyle(btn).top) || 0;
      var next = Math.round(cur + want - (br.top + br.height / 2));
      if (Math.abs(next - cur) >= 1) btn.style.top = next + "px";
    });
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  document.addEventListener("scroll", queue, true);
  window.addEventListener("resize", queue);
  // 화면이 바뀔 때(버튼을 누른 뒤)나 처음 열 때도 다시 맞춰요
  document.addEventListener("click", function () { queue(); setTimeout(queue, 350); }, true);
  window.addEventListener("load", function () { queue(); setTimeout(queue, 600); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
  queue(); setTimeout(queue, 300);
})();
