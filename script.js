(function () {
  "use strict";

  var GAMES = {
    tangram: "https://tangram-azure.vercel.app",
    typing: "https://typing-practice-izqt.vercel.app/"
  };

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
