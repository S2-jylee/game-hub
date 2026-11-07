// 영어 놀이 파닉스 메뉴의 설정 팝업에서 열린 놀이(?eng=1)가 고른 값을 받아요.
// ?eng=1&u=이름&g=학년(1~6)&d=easy|normal|hard&m=놀이 종류  → 게임 안의 사용자·학년·난이도 화면을 건너뛰고 바로 시작해요.
// 끝나거나 나가면 영어 놀이 메뉴로 돌아가요.
(function () {
  "use strict";
  var q = new URLSearchParams(location.search);
  var DIFF_NAME = { easy: "느긋하게", normal: "알맞게", hard: "빠르게" };   // 구구단 놀이터와 같은 이름
  var diff = q.get("d");
  if (!DIFF_NAME[diff]) diff = "normal";
  var g = parseInt(q.get("g"), 10);
  if (!(g >= 1 && g <= 6)) g = 1;
  window.EngLink = {
    on: q.get("eng") === "1",
    user: q.get("u") || null,          // 비어 있으면 게스트 (기록 저장 안 함)
    grade: g,
    mode: q.get("m") || "",
    diff: diff,
    diffName: DIFF_NAME[diff],
    // 난이도별 값 고르기: EL.by({ easy: 1, normal: 2, hard: 3 })
    by: function (o) { return o[diff]; },
    back: function () { location.href = "../english/index.html"; }
  };
})();
