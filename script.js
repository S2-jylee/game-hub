(function () {
  "use strict";

  var GAMES = {
    tangram: "https://tangram-azure.vercel.app",
    typing: "https://typing-practice-izqt.vercel.app/",
    memory: "https://memory-virid-five.vercel.app",
    puzzle: "https://puzzle-lyart-one.vercel.app",
    findhidden: "https://find-hidden-picture.vercel.app",
    multiplication: "multiplication/index.html",
    clock: "clock/index.html",
    coding: "coding/index.html",
    spelling: "spelling/index.html"
  };
  // GitHub Pages(…github.io)에서는 같은 저장소 안의 게임 폴더를 바로 열어요
  if (/\.github\.io$/.test(location.hostname)) {
    GAMES.tangram = "tangram/index.html";
    GAMES.typing = "typing-practice/index.html";
    GAMES.memory = "memory/index.html";
    GAMES.puzzle = "puzzle/index.html";
    GAMES.findhidden = "spot-the-difference/index.html";
  }

  var homeScreen = document.getElementById("home-screen");
  var gameScreen = document.getElementById("game-screen");
  var gameFrame = document.getElementById("game-frame");

  function openGame(key) {
    if (!GAMES[key]) return;
    gameFrame.src = GAMES[key];
    Array.prototype.forEach.call(document.querySelectorAll(".nav-item"), function (btn) {
      btn.classList.toggle("active", btn.dataset.game === key);
    });
    homeScreen.classList.remove("active");
    gameScreen.classList.add("active");
  }

  function goHome() {
    gameScreen.classList.remove("active");
    homeScreen.classList.add("active");
    gameFrame.src = "";
  }

  Array.prototype.forEach.call(document.querySelectorAll(".tile"), function (btn) {
    btn.addEventListener("click", function () { openGame(btn.dataset.game); });
  });
  Array.prototype.forEach.call(document.querySelectorAll(".nav-item"), function (btn) {
    btn.addEventListener("click", function () { openGame(btn.dataset.game); });
  });
  document.getElementById("btn-home").addEventListener("click", goHome);
})();
