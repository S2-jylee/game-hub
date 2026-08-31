(function () {
  "use strict";

  // Each category needs at least 18 unique icons - the highest stage uses
  // 18 pairs, and every card in a single board must show a different icon.
  var CATEGORIES = {
    animals: { name: "동물 친구들", icons: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🦉"] },
    fruits:  { name: "맛있는 과일", icons: ["🍎","🍊","🍋","🍌","🍉","🍇","🍓","🍒","🍑","🍍","🥝","🍈","🥥","🍅","🥑","🍏","🍐","🌽"] },
    vehicles:{ name: "씽씽 탈것",   icons: ["🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🚚","🚜","🛵","🏍️","🚲","🚂","✈️","🚀"] },
    weather: { name: "하늘과 날씨", icons: ["☀️","🌤️","⛅","🌥️","☁️","🌦️","🌧️","⛈️","🌩️","🌨️","❄️","🌪️","🌈","☔","⚡","🌙","⭐","🌟"] },
    sports:  { name: "신나는 운동", icons: ["⚽","🏀","🏈","⚾","🎾","🏐","🏉","🎱","🏓","🏸","⛳","🏹","🎣","🥊","🥋","🎽","🛹","🥅"] },
    ocean:   { name: "바닷속 친구들", icons: ["🐠","🐟","🐡","🦈","🐙","🦑","🦀","🦞","🦐","🐳","🐋","🐬","🦭","🐢","🐚","🌊","⚓","🛟"] },
    space:   { name: "우주 탐험",   icons: ["🚀","🛸","🌍","🌎","🌏","🌕","🌖","🌗","🌘","🌑","🌒","🌓","🌔","🌞","🪐","☄️","🌌","⭐"] },
    faces:   { name: "표정 놀이",   icons: ["😀","😃","😄","😁","😆","😂","🥰","😍","😘","😜","🤩","🥳","😎","🤗","😇","🙂","😊","😋"] },
    nature:  { name: "예쁜 자연",   icons: ["🌸","🌼","🌻","🌺","🌹","🌷","🌵","🌲","🌳","🌴","🍀","🍁","🍂","🍃","🌾","🌱","🪷","🌰"] }
  };

  var THEME_ORDER = ["animals", "fruits", "vehicles", "weather", "sports", "ocean", "space", "faces", "nature"];

  var TOTAL_STAGES = 100;
  var MAX_PAIRS = 18;

  function pairsForStage(stageNum) {
    return Math.min(MAX_PAIRS, 2 + Math.floor((stageNum - 1) / 6));
  }

  var LEVELS = [];
  for (var i = 0; i < TOTAL_STAGES; i++) {
    var stageNum = i + 1;
    var themeKey = THEME_ORDER[i % THEME_ORDER.length];
    LEVELS.push({
      id: "stage" + stageNum,
      stage: stageNum,
      pairs: pairsForStage(stageNum),
      themeKey: themeKey,
      themeName: CATEGORIES[themeKey].name
    });
  }

  window.MemoryData = {
    CATEGORIES: CATEGORIES,
    LEVELS: LEVELS
  };
})();
