(function (root) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  function E(tag, attrs, parent) {
    var e = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  }

  var LEVELS = [
    // ---- 01 ----
    {
      id: "bagelshop", name: "베이글 데이즈 카페", emoji: "🥯",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 60, y: 0, width: 360, height: 480, href: "bagel-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 60, y: 0, width: 360, height: 480, href: "bagel-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 161, y: 59, r: 34 },
        { x: 365, y: 206, r: 36 },
        { x: 224, y: 248, r: 42 },
        { x: 203, y: 298, r: 40 },
        { x: 257, y: 326, r: 40 },
        { x: 311, y: 323, r: 40 },
        { x: 150, y: 315, r: 32 },
        { x: 367, y: 434, r: 42 }
      ]
    },
    // ---- 02 ----
    {
      id: "bearpicnic", name: "곰돌이네 소풍", emoji: "🧺",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 60.0, y: 0, width: 360.0, height: 480, href: "02-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 60.0, y: 0, width: 360.0, height: 480, href: "02-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 103.2, y: 96.0, r: 26 },
        { x: 168.0, y: 76.8, r: 26 },
        { x: 211.2, y: 278.4, r: 29 },
        { x: 283.2, y: 288.0, r: 26 },
        { x: 103.2, y: 446.4, r: 26 },
        { x: 168.0, y: 446.4, r: 26 },
        { x: 232.8, y: 446.4, r: 26 }
      ]
    },
    // ---- 04 ----
    {
      id: "livingroom1", name: "곰돌이네 거실", emoji: "🛋️",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 60.0, y: 0, width: 360.0, height: 480, href: "04-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 60.0, y: 0, width: 360.0, height: 480, href: "04-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 139.2, y: 81.6, r: 26 },
        { x: 211.2, y: 72.0, r: 29 },
        { x: 358.8, y: 48.0, r: 29 },
        { x: 132.0, y: 254.4, r: 29 },
        { x: 283.2, y: 168.0, r: 26 },
        { x: 139.2, y: 302.4, r: 26 },
        { x: 258.0, y: 297.6, r: 26 },
        { x: 186.0, y: 417.6, r: 26 },
        { x: 358.8, y: 384.0, r: 26 }
      ]
    },
    // ---- 06 ----
    {
      id: "girlpicnic1", name: "소녀의 책 읽는 소풍", emoji: "📖",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 60.0, y: 0, width: 360.0, height: 480, href: "06-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 60.0, y: 0, width: 360.0, height: 480, href: "06-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 124.8, y: 105.6, r: 26 },
        { x: 211.2, y: 115.2, r: 29 },
        { x: 88.8, y: 326.4, r: 26 },
        { x: 175.2, y: 326.4, r: 26 },
        { x: 330.0, y: 350.4, r: 26 }
      ]
    },
    // ---- 07 ----
    {
      id: "gardentea", name: "정원 티타임", emoji: "🍵",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 60.0, y: 0, width: 360.0, height: 480, href: "07-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 60.0, y: 0, width: 360.0, height: 480, href: "07-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 96.0, y: 67.2, r: 26 },
        { x: 258.0, y: 96.0, r: 29 },
        { x: 211.2, y: 172.8, r: 26 },
        { x: 283.2, y: 230.4, r: 26 },
        { x: 304.8, y: 278.4, r: 26 },
        { x: 384.0, y: 273.6, r: 26 },
        { x: 96.0, y: 432.0, r: 26 },
        { x: 366.0, y: 432.0, r: 26 }
      ]
    },
    // ---- 08 ----
    {
      id: "livingroom2", name: "아늑한 거실", emoji: "🧸",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 80.0, y: 0, width: 320.0, height: 480, href: "08-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 80.0, y: 0, width: 320.0, height: 480, href: "08-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 112.0, y: 144.0, r: 26 },
        { x: 176.0, y: 220.8, r: 29 },
        { x: 131.2, y: 201.6, r: 26 },
        { x: 137.6, y: 312.0, r: 26 },
        { x: 195.2, y: 321.6, r: 26 },
        { x: 265.6, y: 326.4, r: 26 },
        { x: 118.4, y: 422.4, r: 26 },
        { x: 329.6, y: 417.6, r: 29 }
      ]
    },
    // ---- 09 ----
    {
      id: "bearbunnypicnic", name: "곰돌이 토끼 소풍", emoji: "🧺",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 94.7, y: 0, width: 290.5, height: 480, href: "09-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 94.7, y: 0, width: 290.5, height: 480, href: "09-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 123.8, y: 72.0, r: 26 },
        { x: 147.0, y: 129.6, r: 26 },
        { x: 303.9, y: 182.4, r: 26 },
        { x: 321.3, y: 230.4, r: 26 },
        { x: 176.1, y: 417.6, r: 26 },
        { x: 356.2, y: 417.6, r: 26 },
        { x: 118.0, y: 465.6, r: 26 },
        { x: 176.1, y: 465.6, r: 26 }
      ]
    },
    // ---- 10 ----
    {
      id: "drawingtime", name: "다 같이 그림 그리기", emoji: "🖍️",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 60.0, y: 0, width: 360.0, height: 480, href: "10-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 60.0, y: 0, width: 360.0, height: 480, href: "10-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 139.2, y: 230.4, r: 29 },
        { x: 384.0, y: 134.4, r: 29 },
        { x: 394.8, y: 273.6, r: 26 },
        { x: 276.0, y: 393.6, r: 29 },
        { x: 376.8, y: 38.4, r: 26 }
      ]
    },
    // ---- 11 ----
    {
      id: "girlbedroom", name: "소녀의 방", emoji: "🐶",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 90.1, y: 0, width: 299.9, height: 480, href: "11-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 90.1, y: 0, width: 299.9, height: 480, href: "11-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 135.0, y: 120.0, r: 26 },
        { x: 294.0, y: 62.4, r: 26 },
        { x: 315.0, y: 105.6, r: 26 },
        { x: 120.0, y: 230.4, r: 26 },
        { x: 315.0, y: 249.6, r: 29 },
        { x: 279.0, y: 201.6, r: 26 },
        { x: 360.0, y: 408.0, r: 29 },
        { x: 354.0, y: 326.4, r: 26 }
      ]
    },
    // ---- 13 ----
    {
      id: "trainstation", name: "기차역 가족 여행", emoji: "🚂",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "13-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "13-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 138.8, y: 230.4, r: 29 },
        { x: 64.0, y: 374.4, r: 29 },
        { x: 204.8, y: 326.4, r: 26 },
        { x: 402.8, y: 264.0, r: 26 },
        { x: 385.2, y: 297.6, r: 26 }
      ]
    },
    // ---- 14 ----
    {
      id: "nightfeeding", name: "한밤중 우리 아기", emoji: "🍼",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "14-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "14-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 187.2, y: 48.0, r: 26 },
        { x: 152.0, y: 288.0, r: 29 },
        { x: 72.8, y: 408.0, r: 26 },
        { x: 319.2, y: 456.0, r: 26 },
        { x: 42.0, y: 336.0, r: 26 }
      ]
    },
    // ---- 15 ----
    {
      id: "forestpicnic", name: "숲속 친구들 소풍", emoji: "🦊",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "15-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "15-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 72.8, y: 81.6, r: 29 },
        { x: 138.8, y: 182.4, r: 26 },
        { x: 319.2, y: 326.4, r: 29 },
        { x: 204.8, y: 374.4, r: 26 }
      ]
    },
    // ---- 16 ----
    {
      id: "singinggirl", name: "노래하는 소녀", emoji: "🎤",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "16-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "16-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 257.6, y: 38.4, r: 26 },
        { x: 416.0, y: 72.0, r: 26 },
        { x: 138.8, y: 264.0, r: 29 },
        { x: 429.2, y: 230.4, r: 26 },
        { x: 407.2, y: 297.6, r: 26 }
      ]
    },
    // ---- 17 ----
    {
      id: "zootiger", name: "동물원 호랑이", emoji: "🐯",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "17-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "17-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 116.8, y: 57.6, r: 26 },
        { x: 55.2, y: 278.4, r: 29 },
        { x: 37.6, y: 288.0, r: 26 },
        { x: 407.2, y: 345.6, r: 26 },
        { x: 270.8, y: 374.4, r: 26 }
      ]
    },
    // ---- 18 ----
    {
      id: "brushingteeth", name: "이 닦기 시간", emoji: "🪥",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "18-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "18-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 81.6, y: 216.0, r: 26 },
        { x: 37.6, y: 297.6, r: 26 },
        { x: 375.0, y: 300.0, r: 32 },
        { x: 429.2, y: 422.4, r: 26 }
      ]
    },
    // ---- 19 ----
    {
      id: "amusementpark", name: "신나는 놀이공원", emoji: "🎡",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "19-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "19-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 64.0, y: 177.6, r: 29 },
        { x: 213.6, y: 254.4, r: 29 },
        { x: 297.2, y: 273.6, r: 29 },
        { x: 130.0, y: 273.6, r: 26 },
        { x: 77.2, y: 360.0, r: 26 }
      ]
    },
    // ---- 20 ----
    {
      id: "dinoclass1", name: "공룡 친구들 소풍", emoji: "🦕",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "20-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "20-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 160.8, y: 182.4, r: 29 },
        { x: 350.0, y: 345.6, r: 26 },
        { x: 402.8, y: 201.6, r: 26 },
        { x: 152.0, y: 374.4, r: 26 }
      ]
    },
    // ---- 21 ----
    {
      id: "classroom1", name: "즐거운 학교 생활", emoji: "🏫",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "21-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "21-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 341.2, y: 120.0, r: 29 },
        { x: 160.8, y: 422.4, r: 26 },
        { x: 328.0, y: 326.4, r: 26 },
        { x: 407.2, y: 360.0, r: 26 }
      ]
    },
    // ---- 22 ----
    {
      id: "motherdaughter", name: "엄마와 함께 책 읽기", emoji: "📚",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "22-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "22-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 55.2, y: 96.0, r: 26 },
        { x: 354.4, y: 264.0, r: 26 },
        { x: 319.2, y: 153.6, r: 26 },
        { x: 54.4, y: 231.3, r: 28 },
        { x: 424.8, y: 432.0, r: 26 }
      ]
    },
    // ---- 23 ----
    {
      id: "dinoclass2", name: "꼬마 공룡 학교", emoji: "🦖",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "23-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "23-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 350.0, y: 105.6, r: 29 },
        { x: 248.8, y: 129.6, r: 26 },
        { x: 218.0, y: 249.6, r: 29 },
        { x: 152.0, y: 393.6, r: 26 },
        { x: 407.2, y: 374.4, r: 26 }
      ]
    },
    // ---- 24 ----
    {
      id: "forestmarket", name: "숲속 열매 시장", emoji: "🦉",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 94.7, y: 0, width: 290.7, height: 480, href: "24-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 94.7, y: 0, width: 290.7, height: 480, href: "24-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 312.7, y: 230.4, r: 29 },
        { x: 370.8, y: 297.6, r: 26 },
        { x: 167.3, y: 422.4, r: 29 }
      ]
    },
    // ---- 25 ----
    {
      id: "forestfriends", name: "숲속 동물 친구들", emoji: "🌳",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "25-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "25-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 130.0, y: 201.6, r: 26 },
        { x: 231.2, y: 326.4, r: 29 }
      ]
    },
    // ---- 26 ----
    {
      id: "dinowater", name: "공룡 물놀이", emoji: "💦",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "26-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "26-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 108.0, y: 374.4, r: 29 },
        { x: 350.0, y: 374.4, r: 26 }
      ]
    },
    // ---- 27 ----
    {
      id: "welcomehome", name: "어서오세요, 우리 집", emoji: "🏠",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "27-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.0, y: 0, width: 440.0, height: 480, href: "27-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 160.8, y: 422.4, r: 29 },
        { x: 37.6, y: 278.4, r: 26 },
        { x: 279.4, y: 240.6, r: 28 },
        { x: 429.2, y: 422.4, r: 29 }
      ]
    }
  ];

  root.FindData = { LEVELS: LEVELS };
})(window);
