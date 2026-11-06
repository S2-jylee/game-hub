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
    english: "english/index.html"
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

  /* ---------- 누가 놀까요? (이 탭에서 한 번 고르면 모든 게임이 같은 사용자) ---------- */
  // hub_user: "guest" 또는 "u:이름" — 같은 주소의 게임은 sessionStorage로, 다른 주소의 게임은 ?hub= 로 받아요
  var USERS_KEY = "hub_users";
  function getStore(s, k) { try { return s.getItem(k); } catch (e) { return null; } }
  function setStore(s, k, v) { try { s.setItem(k, v); } catch (e) { /* storage unavailable, ignore */ } }
  function currentUser() { return getStore(sessionStorage, "hub_user"); }
  // 등록한 이름 + 각 게임에 이미 저장된 사용자 이름(…profiles)을 모아요
  function knownUsers() {
    var names = [];
    try { names = JSON.parse(getStore(localStorage, USERS_KEY) || "[]"); } catch (e) { names = []; }
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!/profiles$/.test(k)) continue;
        var obj = JSON.parse(localStorage.getItem(k));
        if (obj && typeof obj === "object" && !Array.isArray(obj)) Object.keys(obj).forEach(function (n) { if (names.indexOf(n) < 0) names.push(n); });
      }
    } catch (e) { /* ignore broken data */ }
    return names.filter(function (n) { return n && n.length <= 10; });
  }
  function renderUserBtn() {
    var u = currentUser();
    document.getElementById("hub-user-name").textContent = !u ? "사용자 선택" : u === "guest" ? "게스트" : u.slice(2);
  }
  var who = document.getElementById("who"), pendingGame = null;
  function setUser(v) {
    setStore(sessionStorage, "hub_user", v);
    renderUserBtn();
    who.classList.remove("show");
    var g = pendingGame; pendingGame = null;
    if (g) openGame(g);
    // 게임 안의 이름표로 바꿨으면, 보던 게임을 새 사용자로 다시 열어요
    else if (gameScreen.classList.contains("active") && currentGame) reloadGame(v);
  }
  function openWho(gameKey) {
    pendingGame = gameKey || null;
    var u = currentUser();
    document.getElementById("who-title").textContent = gameKey ? "누가 놀까요?" : "사용자 전환";
    document.getElementById("who-sub").textContent = gameKey ? "한 번 고르면 다른 게임도 같은 이름으로 해요" : "고른 사용자로 모든 게임을 해요";
    var list = document.getElementById("who-list"); list.innerHTML = "";
    var names = knownUsers();
    if (!names.length) list.innerHTML = '<div class="who-empty">아직 등록한 사용자가 없어요. 새 이름을 적어 보세요!</div>';
    names.forEach(function (n) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "who-user" + (u === "u:" + n ? " on" : "");
      b.textContent = "👤 " + n;
      b.addEventListener("click", function () { setUser("u:" + n); });
      list.appendChild(b);
    });
    document.getElementById("who-guest").classList.toggle("on", u === "guest");
    document.getElementById("who-input").value = "";
    who.classList.add("show");
  }
  function addUser() {
    var inp = document.getElementById("who-input"), n = inp.value.trim().slice(0, 10);
    if (!n) { inp.focus(); return; }
    var names = [];
    try { names = JSON.parse(getStore(localStorage, USERS_KEY) || "[]"); } catch (e) { names = []; }
    if (names.indexOf(n) < 0) { names.push(n); setStore(localStorage, USERS_KEY, JSON.stringify(names)); }
    setUser("u:" + n);
  }
  document.getElementById("who-add").addEventListener("click", addUser);
  document.getElementById("who-input").addEventListener("keydown", function (e) { if (e.key === "Enter") addUser(); });
  document.getElementById("who-guest").addEventListener("click", function () { setUser("guest"); });
  document.getElementById("who-close").addEventListener("click", function () { pendingGame = null; who.classList.remove("show"); });
  who.addEventListener("click", function (e) { if (e.target === who) { pendingGame = null; who.classList.remove("show"); } });
  document.getElementById("btn-switch-user").addEventListener("click", function () { openWho(null); });
  // 게임 안의 이름표(👤 게스트 [전환])를 누르면 게임이 알려줘요 → 같은 사용자 전환 팝업
  window.addEventListener("message", function (e) {
    if (e.source === gameFrame.contentWindow && e.data && e.data.type === "hub-switch-user") openWho(null);
    // 게임 제목 왼쪽 ← 버튼: 더 돌아갈 화면이 없으면 허브 홈으로
    if (e.source === gameFrame.contentWindow && e.data && e.data.type === "hub-home") document.getElementById("btn-home").click();
  });
  renderUserBtn();

  var currentGame = null;
  // 보던 게임 페이지를 그대로 새 사용자로 다시 열어요 (다른 주소의 게임은 처음부터)
  function reloadGame(u) {
    var href = null;
    try { href = gameFrame.contentWindow.location.href; } catch (e) { href = null; }
    if (!href || href === "about:blank") { openGame(currentGame); return; }
    var url = new URL(href);
    url.searchParams.set("hub", u);
    url.searchParams.delete("back");
    // 구구단 놀이터에서 연 게임(?mul=1)은 기록을 저장할 사용자도 바꿔요
    if (url.searchParams.has("u")) url.searchParams.set("u", u === "guest" ? "" : u.slice(2));
    gameFrame.contentWindow.location.replace(url.toString());
  }
  function openGame(key) {
    if (!GAMES[key]) return;
    var u = currentUser();
    if (!u) { openWho(key); return; }
    currentGame = key;
    var url = GAMES[key];
    gameFrame.src = url + (url.indexOf("?") < 0 ? "?" : "&") + "hub=" + encodeURIComponent(u);
    Array.prototype.forEach.call(document.querySelectorAll(".nav-item"), function (btn) {
      btn.classList.toggle("active", btn.dataset.game === key);
    });
    homeScreen.classList.remove("active");
    gameScreen.classList.add("active");
  }

  function goHome() {
    currentGame = null;
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
