(function () {
  "use strict";

  // A single pool of icons chosen to look nothing alike - no two share both
  // a similar shape and color - so an 8-year-old never has to squint to
  // tell two cards apart. (Earlier themed sets like "moon phases" or "yellow
  // smileys" packed a whole board with near-identical pictures.) 30 icons
  // covers the highest stage's 18 pairs with room to rotate for variety.
  var MASTER_ICONS = [
    "🐶", "🐱", "🐰", "🐻", "🦁", "🐸", "🐵", "🐷", "🐔", "🐧",
    "🍎", "🍌", "🍓", "🍉", "🍇", "🥕",
    "🚗", "🚲", "🚀", "✈️", "🚂", "⛵",
    "⚽", "🎁", "🌈", "☀️", "🌙", "⭐", "❤️", "🌸"
  ];

  var TOTAL_STAGES = 100;
  var MAX_PAIRS = 18;

  function pairsForStage(stageNum) {
    return Math.min(MAX_PAIRS, 2 + Math.floor((stageNum - 1) / 6));
  }

  // Rotates through the pool by stage so nearby stages don't always reuse
  // the exact same subset, while every subset still only ever contains
  // icons from the one vetted, mutually-distinct pool.
  function iconsForStage(stageNum, pairs) {
    var n = MASTER_ICONS.length;
    var offset = (stageNum * 7) % n;
    var rotated = MASTER_ICONS.slice(offset).concat(MASTER_ICONS.slice(0, offset));
    return rotated.slice(0, pairs);
  }

  var LEVELS = [];
  for (var i = 0; i < TOTAL_STAGES; i++) {
    var stageNum = i + 1;
    LEVELS.push({
      id: "stage" + stageNum,
      stage: stageNum,
      pairs: pairsForStage(stageNum)
    });
  }

  window.MemoryData = {
    MASTER_ICONS: MASTER_ICONS,
    LEVELS: LEVELS,
    iconsForStage: iconsForStage
  };
})();
