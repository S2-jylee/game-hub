(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var ART_SIZE = 480;

  function E(tag, attrs, parent) {
    var e = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  }

  // Every difficulty uses the real illustrations from the spot-the-difference
  // game (left picture only). Each Vercel project deploys only its own folder, so the
  // images are copied into assets/find/; aspect = width / height of the picture.
  var FIND_PICTURES = [
    { id: "bagelshop", name: "베이글 데이즈 카페", emoji: "🥯", file: "bagel-left.png", aspect: 0.7500 },
    { id: "bearpicnic", name: "곰돌이네 소풍", emoji: "🧺", file: "02-left.png", aspect: 0.7500 },
    { id: "bearpicnic2", name: "떡갈나무 아래 소풍", emoji: "🌳", file: "03-left.png", aspect: 0.9158 },
    { id: "livingroom1", name: "곰돌이네 거실", emoji: "🛋️", file: "04-left.png", aspect: 0.7500 },
    { id: "zootiger2", name: "동물원 나들이", emoji: "🐅", file: "05-left.png", aspect: 0.9158 },
    { id: "girlpicnic1", name: "소녀의 책 읽는 소풍", emoji: "📖", file: "06-left.png", aspect: 0.7500 },
    { id: "gardentea", name: "정원 티타임", emoji: "🍵", file: "07-left.png", aspect: 0.7500 },
    { id: "livingroom2", name: "아늑한 거실", emoji: "🧸", file: "08-left.png", aspect: 0.6667 },
    { id: "bearbunnypicnic", name: "곰돌이 토끼 소풍", emoji: "🧺", file: "09-left.png", aspect: 0.6052 },
    { id: "drawingtime", name: "다 같이 그림 그리기", emoji: "🖍️", file: "10-left.png", aspect: 0.7500 },
    { id: "girlbedroom", name: "소녀의 방", emoji: "🐶", file: "11-left.png", aspect: 0.6248 },
    { id: "trainstation", name: "기차역 가족 여행", emoji: "🚂", file: "13-left.png", aspect: 0.9167 },
    { id: "nightfeeding", name: "한밤중 우리 아기", emoji: "🍼", file: "14-left.png", aspect: 0.9167 },
    { id: "forestpicnic", name: "숲속 친구들 소풍", emoji: "🦊", file: "15-left.png", aspect: 0.9167 },
    { id: "singinggirl", name: "노래하는 소녀", emoji: "🎤", file: "16-left.png", aspect: 0.9167 },
    { id: "amusementpark", name: "신나는 놀이공원", emoji: "🎡", file: "19-left.png", aspect: 0.9167 },
    { id: "dinoclass1", name: "공룡 친구들 소풍", emoji: "🦕", file: "20-left.png", aspect: 0.9167 },
    { id: "classroom1", name: "즐거운 학교 생활", emoji: "🏫", file: "21-left.png", aspect: 0.9167 },
    { id: "motherdaughter", name: "엄마와 함께 책 읽기", emoji: "📚", file: "22-left.png", aspect: 0.9167 },
    { id: "dinoclass2", name: "꼬마 공룡 학교", emoji: "🦖", file: "23-left.png", aspect: 0.9167 },
    { id: "forestmarket", name: "숲속 열매 시장", emoji: "🦉", file: "24-left.png", aspect: 0.6056 },
    { id: "forestfriends", name: "숲속 동물 친구들", emoji: "🌳", file: "25-left.png", aspect: 0.9167 },
    { id: "dinowater", name: "공룡 물놀이", emoji: "💦", file: "26-left.png", aspect: 0.9167 },
    { id: "welcomehome", name: "어서오세요, 우리 집", emoji: "🏠", file: "27-left.png", aspect: 0.9167 }
  ];
  var LEVELS = FIND_PICTURES.map(function (p) {
    var href = "assets/find/" + p.file;
    var w = ART_SIZE * p.aspect;
    return {
      id: "find_" + p.id, name: p.name, emoji: p.emoji, thumb: href,
      width: w, height: ART_SIZE,
      draw: function (g) {
        E("image", { x: 0, y: 0, width: w, height: ART_SIZE, href: href, preserveAspectRatio: "none" }, g);
      }
    };
  });

  window.PuzzleData = { ART_SIZE: ART_SIZE, LEVELS: LEVELS, E: E };
})();
