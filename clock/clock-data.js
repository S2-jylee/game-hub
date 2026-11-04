(function (root) {
  "use strict";

  // 놀이 종류. step: 나오는 분의 간격 (60 = 정각만, 30 = 30분, 5 = 5분, 1 = 1분)
  var CATEGORIES = [
    { id: "hour", icon: "🕐", name: "몇 시일까요?", desc: "정각 읽기 · 긴바늘이 12에 있어요", step: 60, color: "pink" },
    { id: "half", icon: "🕧", name: "몇 시 30분", desc: "30분 읽기 · 긴바늘이 6에 있어요", step: 30, color: "sky" },
    { id: "five", icon: "🖐️", name: "5분씩 읽기", desc: "긴바늘 숫자 한 칸은 5분", step: 5, color: "mint" },
    { id: "one", icon: "🔍", name: "1분까지 읽기", desc: "작은 눈금 한 칸은 1분", step: 1, color: "peach", guide: "one" },
    { id: "day", icon: "🌙", name: "24시간 읽기", desc: "오후 3시는 15시!", step: 60, color: "lavender", guide: "day" },
    { id: "full", icon: "🕰️", name: "전체 시간 확인하기", desc: "오전(AM)·오후(PM) 시계를 24시간으로", step: 1, color: "red" }
  ];

  // 문제 종류
  //  read   시계 보고 고르기          set     바늘 맞추기
  //  after  몇 시간 뒤               before  몇 시간 전
  //  conv   오후 3시 → 15시          rev     15시 → 오후 3시
  //  read24 오전/오후 시계 → 15시     set24   15시 → 바늘 맞추기
  //  after24 14시에서 3시간 뒤 → 17시
  var KIND_LABEL = {
    read: "👀 보고 고르기", set: "✋ 바늘 맞추기", after: "⏩ 몇 시간 뒤", before: "⏪ 몇 시간 전",
    conv: "🔁 오후 → 24시간", rev: "🔁 24시간 → 오후", read24: "👀 24시간으로 읽기",
    set24: "✋ 24시간 바늘 맞추기", after24: "⏩ 24시간 뒤 계산"
  };

  // 한 놀이 안의 난이도 계획 20칸 (아래 expand가 100스테이지로 늘려요)
  //  labels: 시계 둘레에 5분, 10분… 도움 숫자   choices: 보기 개수   count: 문제 수
  function clockStages(cat) {
    var list = [];
    for (var n = 1; n <= 20; n++) {
      var s = { kinds: ["read"], labels: true, choices: 4, count: 6, step: cat.step, onlyHalf: false };
      if (n <= 2) { s.choices = 3; }
      else if (n <= 4) { /* 보고 고르기, 도움 숫자 */ }
      else if (n <= 6) { s.kinds = ["set"]; }
      else if (n <= 8) { s.kinds = ["set"]; s.labels = false; }
      else if (n <= 12) { s.labels = false; s.count = 8; }
      else if (n <= 16) { s.kinds = ["read", "set"]; s.labels = false; s.count = 8; }
      else if (n <= 18) { s.kinds = ["read", "set", "after"]; s.labels = false; s.count = 10; }
      else { s.kinds = ["read", "set", "after", "before"]; s.labels = false; s.count = 10; }
      // 30분 놀이는 앞쪽 8단계까지 30분만, 그 뒤로는 정각과 섞어요
      if (cat.id === "half" && n <= 8) s.onlyHalf = true;
      list.push(s);
    }
    return list;
  }

  function dayStages() {
    var plan = [
      { kinds: ["conv"], step: 60, choices: 3, count: 6 },
      { kinds: ["conv"], step: 60, choices: 3, count: 6 },
      { kinds: ["conv"], step: 60, choices: 4, count: 6 },
      { kinds: ["conv"], step: 30, choices: 4, count: 6 },
      { kinds: ["rev"], step: 60, choices: 4, count: 6 },
      { kinds: ["rev"], step: 30, choices: 4, count: 6 },
      { kinds: ["conv", "rev"], step: 60, choices: 4, count: 8 },
      { kinds: ["conv", "rev"], step: 30, choices: 4, count: 8 },
      { kinds: ["read24"], step: 60, choices: 4, count: 8 },
      { kinds: ["read24"], step: 60, choices: 4, count: 8 },
      { kinds: ["read24"], step: 30, choices: 4, count: 8 },
      { kinds: ["read24"], step: 30, choices: 4, count: 8 },
      { kinds: ["set24"], step: 60, choices: 4, count: 6 },
      { kinds: ["set24"], step: 30, choices: 4, count: 6 },
      { kinds: ["read24"], step: 5, choices: 4, count: 8, labels: true },
      { kinds: ["read24"], step: 5, choices: 4, count: 8 },
      { kinds: ["read24", "set24"], step: 5, choices: 4, count: 8 },
      { kinds: ["after24"], step: 30, choices: 4, count: 8 },
      { kinds: ["read24", "set24", "after24"], step: 5, choices: 4, count: 10 },
      { kinds: ["conv", "rev", "read24", "set24", "after24"], step: 5, choices: 4, count: 10 }
    ];
    return plan.map(function (p) {
      return { kinds: p.kinds, step: p.step, choices: p.choices, count: p.count, labels: !!p.labels, onlyHalf: false };
    });
  }

  // 전체 시간 확인하기: 하루 전체(1시~23시)의 시계를 24시간 보기로 골라요. 정각 → 30분 → 5분 → 1분 순서로 어려워져요
  function fullStages() {
    var list = [];
    for (var n = 1; n <= 20; n++) {
      var step = n <= 4 ? 60 : n <= 8 ? 30 : n <= 14 ? 5 : 1;
      var labels = (n >= 9 && n <= 11) || (n >= 15 && n <= 17);
      list.push({ kinds: ["read24"], step: step, choices: n <= 2 ? 3 : 4, count: n <= 4 ? 6 : n <= 14 ? 8 : 10, labels: labels, onlyHalf: false, fullRange: true });
    }
    return list;
  }

  // 위의 20칸 계획을 100스테이지로 늘려요. 계획 한 칸이 5스테이지가 되고,
  // 같은 칸 안에서도 뒤로 갈수록 문제가 늘고(+0~2, 51단계부터 +1 더), 목표 시간이 조금씩 짧아져요(pace 1 → 0.7)
  var STAGE_COUNT = 100;
  function expand(plan) {
    var per = STAGE_COUNT / plan.length, list = [];
    for (var n = 1; n <= STAGE_COUNT; n++) {
      var base = plan[Math.floor((n - 1) / per)];
      var s = {};
      for (var k in base) if (Object.prototype.hasOwnProperty.call(base, k)) s[k] = base[k];
      s.count = base.count + Math.floor(((n - 1) % per) / 2) + (n > STAGE_COUNT / 2 ? 1 : 0);
      s.pace = Math.round((1 - 0.3 * (n - 1) / (STAGE_COUNT - 1)) * 100) / 100;
      list.push(s);
    }
    return list;
  }

  CATEGORIES.forEach(function (cat) {
    var stages = expand(cat.id === "day" ? dayStages() : cat.id === "full" ? fullStages() : clockStages(cat));
    cat.stages = stages.map(function (s, i) {
      s.id = cat.id + "-" + (i + 1);
      s.n = i + 1;
      // 섞인 단계는 어떤 문제가 섞였는지 아이콘으로 보여줘요 (예: 👀✋⏩ 섞어서)
      s.label = s.kinds.length > 1
        ? s.kinds.map(function (k) { return KIND_LABEL[k].split(" ")[0]; }).filter(function (ic, i, arr) { return arr.indexOf(ic) === i; }).join("") + " 섞어서"
        : KIND_LABEL[s.kinds[0]];
      s.help = s.labels && cat.step < 30;
      return s;
    });
  });

  // 문제 풀기 전에 읽는 원리 책. 마지막 장(“자, 이제 문제를 풀어볼까?”)은 자동으로 붙어요
  //  clock: { h, m, labels(5분… 도움 숫자), ticks: [시작분, 끝분](색칠할 작은 눈금), count(눈금 옆에 분 숫자), badge(24시간의 시), noHands }
  var GUIDES = {
    one: {
      title: "1분까지 읽는 법",
      pages: [
        { title: "긴바늘은 '분'을 알려줘요", clock: { h: 3, m: 0, labels: true },
          text: "<b>긴바늘</b>이 시계를 한 바퀴 빙 돌면 <b>60분</b>이에요.<br>60분은 <b>1시간</b>과 같아요." },
        { title: "큰 숫자 한 칸은 5분", clock: { h: 2, m: 10, labels: true },
          text: "긴바늘이 가리키는 큰 숫자에 <b>× 5</b>를 하면 '분'이 돼요.<br>1 → 5분, 2 → 10분, 3 → 15분 …<br>지금 긴바늘은 <b>2</b>에 있으니까 <b>10분</b>!" },
        { title: "작은 눈금 한 칸은 1분", clock: { h: 12, m: 0, ticks: [10, 15], count: true, noHands: true },
          text: "큰 숫자와 큰 숫자 사이에는 작은 눈금이 <b>5칸</b> 있어요.<br>작은 눈금 <b>한 칸이 1분</b>이에요.<br>2에서 3까지 세어 보면 11, 12, 13, 14, <b>15분</b>!" },
        { title: "몇 분인지 세어 봐요", clock: { h: 4, m: 13, ticks: [10, 13], count: true },
          text: "① 긴바늘 바로 앞의 큰 숫자를 찾아요 → <b>2</b>는 10분<br>② 거기서 작은 눈금을 하나씩 세요 → 11, 12, <b>13</b><br>③ 그래서 <b>13분</b>이에요!" },
        { title: "몇 시인지는 짧은바늘로", clock: { h: 4, m: 48, ticks: [45, 48], count: true },
          text: "짧은바늘이 <b>5</b>에 가까워도 아직 5를 지나지 않았어요.<br>짧은바늘이 <b>막 지나온 숫자 4</b>가 '시'예요.<br>긴바늘은 9(45분)에서 3칸 더 → <b>4시 48분</b>!" }
      ]
    },
    day: {
      title: "오전(AM)과 오후(PM)",
      pages: [
        { title: "하루는 24시간이에요", strip: true,
          text: "시계의 짧은바늘은 하루에 <b>두 바퀴</b> 돌아요.<br>첫 번째 바퀴는 <b>오전(AM)</b>, 두 번째 바퀴는 <b>오후(PM)</b>예요.<br>그래서 하루는 12 + 12 = <b>24시간</b>!" },
        { title: "오전 (AM)", clock: { h: 9, m: 0, badge: 9 },
          text: "밤 12시부터 낮 12시 전까지가 <b>오전(AM)</b>이에요. ☀️<br>아침에 일어나고 학교 가는 시간이죠.<br>오전은 그대로 읽어요: 오전 9시 = <b>9시</b>" },
        { title: "오후 (PM)", clock: { h: 3, m: 0, badge: 15 },
          text: "낮 12시부터 밤 12시 전까지가 <b>오후(PM)</b>예요. 🌤️<br>오후에는 시계 숫자에 <b>12를 더해요</b>.<br>오후 3시 → 3 + 12 = <b>15시</b>" },
        { title: "오후 시각 바꾸기 표", table: true,
          text: "오후 1시는 13시, 오후 2시는 14시…<br>거꾸로 <b>15시</b>는 15 − 12 = 3이니까 <b>오후 3시</b>예요.<br>낮 12시는 그대로 <b>12시</b>예요." },
        { title: "분은 그대로예요", clock: { h: 7, m: 30, badge: 19 },
          text: "오후 7시 30분 → '시'만 바꿔요: 7 + 12 = <b>19</b><br>그래서 <b>19시 30분</b>! 분은 바뀌지 않아요. 🌙" }
      ]
    }
  };

  root.ClockData = { CATEGORIES: CATEGORIES, KIND_LABEL: KIND_LABEL, GUIDES: GUIDES };
})(window);
