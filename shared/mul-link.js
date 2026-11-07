// 구구단 놀이터의 '신나는 게임'에서 열린 놀이(?mul=1)가 구구단 놀이터와 정보를 나눠 써요.
// 고른 단(ggd_dans), 소리(ggd_sound), 사용자 기록(ggd_profiles)을 같이 쓰고, 끝나면 게임 고르기로 돌아가요.
(function () {
  "use strict";
  var q = new URLSearchParams(location.search);
  var get = function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  var set = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable, ignore */ } };
  var user = q.get("u") || null;
  var dans = get("ggd_dans", [2]).filter(function (d) { return d >= 2 && d <= 12; });
  if (!dans.length) dans = [2];
  // 난이도: 구구단 놀이터 설정 창에서 고른 값 (?d=easy|normal|hard)
  var DIFF_NAME = { easy: "느긋하게", normal: "알맞게", hard: "빠르게" };
  var diff = q.get("d");
  if (!DIFF_NAME[diff]) diff = get("ggd_diff", "normal");
  if (!DIFF_NAME[diff]) diff = "normal";

  window.MulLink = {
    on: q.get("mul") === "1",
    diff: diff,
    diffName: DIFF_NAME[diff],
    // 난이도별 값 고르기: ML.by({ easy: 1, normal: 2, hard: 3 })
    by: function (o) { return o[diff]; },
    user: user,
    dans: dans.sort(function (a, b) { return a - b; }),
    sound: get("ggd_sound", true),
    danText: function () { return dans.length === 11 ? "전체 (2~12단)" : dans.map(function (d) { return d + "단"; }).join(", "); },
    // 게스트는 저장하지 않아요
    saveBest: function (mode, score) {
      if (!user) return { best: 0, isRecord: score > 0 };
      var p = get("ggd_profiles", {});
      var d = p[user] || { stickers: [], best: {} };
      d.best = d.best || {};
      var best = d.best[mode] || 0;
      if (score > best) d.best[mode] = score;
      p[user] = d; set("ggd_profiles", p);
      return { best: best, isRecord: score > best };
    },
    back: function () { location.href = "../multiplication/index.html?back=arcade&u=" + encodeURIComponent(user || ""); },
    // 고른 단에서 문제를 골라요 (같은 문제가 연달아 나오지 않게)
    questions: function (n) {
      var pool = [];
      dans.forEach(function (a) { for (var b = 1; b <= 9; b++) pool.push([a, b]); });
      var out = [];
      while (out.length < n) {
        var next = pool.slice();
        for (var i = next.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = next[i]; next[i] = next[j]; next[j] = t; }
        if (out.length && next.length > 1 && next[0].join() === out[out.length - 1].join()) next.push(next.shift());
        out = out.concat(next);
      }
      return out.slice(0, n);
    },
    // 정답 근처의 헷갈리는 숫자들 (정답 포함 count개)
    choices: function (a, b, count) {
      var ans = a * b, s = [ans];
      var near = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10];
      for (var i = near.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = near[i]; near[i] = near[j]; near[j] = t; }
      near.forEach(function (n) { if (s.length < count && n > 0 && s.indexOf(n) < 0) s.push(n); });
      while (s.length < count) { var x = ans + 3 + Math.floor(Math.random() * 10); if (s.indexOf(x) < 0) s.push(x); }
      return s;
    }
  };
})();
