/* 영어 놀이 공통 배경을 넣어요 (shared/english-bg.css) */
(function () {
  function init() {
    if (document.querySelector(".en-bg")) return;
    var bg = document.createElement("div");
    bg.className = "scene en-bg";
    bg.setAttribute("aria-hidden", "true");
    bg.innerHTML = '<div class="en-sun"></div>' +
      '<svg class="en-hills" viewBox="0 0 1200 200" preserveAspectRatio="none">' +
      '<path d="M0 120 Q200 40 420 110 T820 90 T1200 100 V200 H0Z" fill="#9be36d"/>' +
      '<path d="M0 160 Q300 90 600 150 T1200 140 V200 H0Z" fill="#6fcf45"/></svg>';
    document.body.insertBefore(bg, document.body.firstChild);
    document.body.classList.add("en-bg-on");
    document.documentElement.classList.add("en-bg-on");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
