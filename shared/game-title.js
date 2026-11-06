/* 게임 제목 왼쪽 '←' 뒤로 버튼
   - 같은 화면에 이미 있는 뒤로 가기 버튼(← 학년 고르기, 처음으로 …)이 보이면 그걸 대신 눌러요
   - 그런 버튼이 없으면(허브에서 연 첫 화면) 게임 허브 홈으로 돌아가요 */
(function () {
  // 음성 읽기(영어 단어·문제 읽어주기)는 모든 게임에서 꺼요
  try {
    if (window.speechSynthesis) {
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

  function addBack(h1, onClick) {
    if (h1.querySelector(".gt-back")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gt-back";
    btn.setAttribute("aria-label", "뒤로");
    btn.title = "뒤로";
    btn.textContent = "←";
    btn.addEventListener("click", function (e) { e.stopPropagation(); onClick(); });
    h1.insertBefore(btn, h1.firstChild);
  }

  function init() {
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
        var home = document.getElementById("home-view");
        if (home && !visible(home)) typing.click(); else goHubHome();
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
