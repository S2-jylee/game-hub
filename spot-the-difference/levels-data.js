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
        E("image", { x: 60, y: 0, width: 360, height: 480, href: "assets/bagel-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 60, y: 0, width: 360, height: 480, href: "assets/bagel-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 365, y: 206, r: 36 },
        { x: 203, y: 298, r: 40 },
        { x: 150, y: 315, r: 32 },
        { x: 367, y: 434, r: 42 },
        { x: 179, y: 45.8, r: 24 },
        { x: 287.9, y: 328.2, r: 24 },
        { x: 250.6, y: 319.1, r: 24 },
        { x: 182, y: 247.5, r: 24 }
      ]
    },
    // ---- 02 ----
    {
      id: "bearpicnic", name: "곰돌이네 소풍", emoji: "🧺",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 60, y: 0, width: 360, height: 480, href: "assets/02-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 60, y: 0, width: 360, height: 480, href: "assets/02-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 281.8, y: 98.6, r: 24 },
        { x: 373.6, y: 101.7, r: 24 },
        { x: 259.7, y: 291.2, r: 24 },
        { x: 340.3, y: 309.4, r: 24 },
        { x: 364.5, y: 370.9, r: 24 },
        { x: 304, y: 433.4, r: 24 },
        { x: 377.6, y: 431.4, r: 24 },
        { x: 188.1, y: 435.4, r: 24 },
        { x: 103.4, y: 429.4, r: 24 },
        { x: 140.7, y: 263, r: 24 },
        { x: 111.4, y: 90.6, r: 24 }
      ]
    },
    // ---- 03 ----
    {
      id: "bearpicnic2", name: "떡갈나무 아래 소풍", emoji: "🌳",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.2, y: 0, width: 439.6, height: 480, href: "assets/03-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.2, y: 0, width: 439.6, height: 480, href: "assets/03-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 303.7, y: 395, r: 32 },
        { x: 356.5, y: 119.2, r: 24 },
        { x: 305, y: 298.7, r: 24 },
        { x: 274.8, y: 235.2, r: 24 },
        { x: 158.8, y: 177.7, r: 24 },
        { x: 138.7, y: 388.4, r: 24 },
        { x: 223.4, y: 337, r: 24 },
        { x: 364.5, y: 337, r: 24 }
      ]
    },
    // ---- 04 ----
    {
      id: "livingroom1", name: "곰돌이네 거실", emoji: "🛋️",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 60, y: 0, width: 360, height: 480, href: "assets/04-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 60, y: 0, width: 360, height: 480, href: "assets/04-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 121.5, y: 89, r: 24 },
        { x: 198.2, y: 50.7, r: 24 },
        { x: 254.6, y: 51.7, r: 24 },
        { x: 391.8, y: 50.7, r: 24 },
        { x: 400.8, y: 111.2, r: 24 },
        { x: 234.5, y: 163.6, r: 24 },
        { x: 125.5, y: 280.6, r: 24 },
        { x: 150.8, y: 319.9, r: 24 },
        { x: 209.2, y: 398.6, r: 24 },
        { x: 267.7, y: 431.8, r: 24 },
        { x: 353.4, y: 412.7, r: 24 },
        { x: 312.1, y: 265.4, r: 24 },
        { x: 361.5, y: 199.9, r: 24 },
        { x: 353.4, y: 290.7, r: 24 },
        { x: 246.6, y: 316.9, r: 24 }
      ]
    },
    // ---- 05 ----
    {
      id: "zootiger2", name: "동물원 나들이", emoji: "🐅",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20.2, y: 0, width: 439.6, height: 480, href: "assets/05-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20.2, y: 0, width: 439.6, height: 480, href: "assets/05-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 204.8, y: 77.3, r: 26 },
        { x: 411, y: 335, r: 26 },
        { x: 56, y: 329.7, r: 24 },
        { x: 297, y: 352.9, r: 24 },
        { x: 121.5, y: 279.3, r: 24 },
        { x: 37.8, y: 122, r: 24 }
      ]
    },
    // ---- 06 ----
    {
      id: "girlpicnic1", name: "소녀의 책 읽는 소풍", emoji: "📖",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 60, y: 0, width: 360, height: 480, href: "assets/06-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 60, y: 0, width: 360, height: 480, href: "assets/06-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 88.8, y: 326.4, r: 26 },
        { x: 157.8, y: 115.3, r: 24 },
        { x: 158.8, y: 354.3, r: 24 },
        { x: 122.5, y: 244.4, r: 24 },
        { x: 339.3, y: 382.6, r: 24 },
        { x: 285.9, y: 118.4, r: 24 }
      ]
    },
    // ---- 07 ----
    {
      id: "gardentea", name: "정원 티타임", emoji: "🍵",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 60, y: 0, width: 360, height: 480, href: "assets/07-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 60, y: 0, width: 360, height: 480, href: "assets/07-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 96, y: 432, r: 26 },
        { x: 366, y: 432, r: 26 },
        { x: 114.5, y: 54.2, r: 24 },
        { x: 267.7, y: 82.5, r: 24 },
        { x: 339.3, y: 123.8, r: 24 },
        { x: 383.7, y: 157.1, r: 24 },
        { x: 402.9, y: 219.6, r: 24 },
        { x: 301, y: 137.9, r: 24 },
        { x: 357.5, y: 322.5, r: 24 },
        { x: 270.8, y: 288.2, r: 24 },
        { x: 228.4, y: 241.8, r: 24 },
        { x: 248.6, y: 348.7, r: 24 },
        { x: 168.9, y: 363.8, r: 24 },
        { x: 223.4, y: 311.4, r: 24 },
        { x: 272.8, y: 395.1, r: 24 }
      ]
    },
    // ---- 08 ----
    {
      id: "livingroom2", name: "아늑한 거실", emoji: "🧸",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 80, y: 0, width: 320, height: 480, href: "assets/08-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 80, y: 0, width: 320, height: 480, href: "assets/08-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 176, y: 220.8, r: 29 },
        { x: 265.6, y: 326.4, r: 26 },
        { x: 147.7, y: 429.7, r: 24 },
        { x: 330.3, y: 457, r: 24 },
        { x: 211.3, y: 331.9, r: 24 },
        { x: 302, y: 339, r: 24 },
        { x: 239.5, y: 228.1, r: 24 },
        { x: 304, y: 224, r: 24 },
        { x: 382.7, y: 224, r: 24 },
        { x: 372.6, y: 306.7, r: 24 },
        { x: 315.1, y: 135.3, r: 24 },
        { x: 231.4, y: 65.7, r: 24 },
        { x: 317.1, y: 62.7, r: 24 },
        { x: 355.5, y: 62.7, r: 24 },
        { x: 274.8, y: 57.6, r: 24 },
        { x: 133.6, y: 154.4, r: 24 },
        { x: 156.8, y: 295.6, r: 24 },
        { x: 197.1, y: 398.5, r: 24 }
      ]
    },
    // ---- 09 ----
    {
      id: "bearbunnypicnic", name: "곰돌이 토끼 소풍", emoji: "🧺",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 94.7, y: 0, width: 290.5, height: 480, href: "assets/09-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 94.7, y: 0, width: 290.5, height: 480, href: "assets/09-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 147, y: 129.6, r: 26 },
        { x: 153.8, y: 75.2, r: 24 },
        { x: 307.1, y: 165.9, r: 24 },
        { x: 308.1, y: 125.6, r: 24 },
        { x: 219.3, y: 286.9, r: 24 },
        { x: 186.1, y: 375.7, r: 24 },
        { x: 139.7, y: 429.1, r: 24 },
        { x: 355.5, y: 360.6, r: 24 },
        { x: 325.2, y: 214.3, r: 24 },
        { x: 280.8, y: 294, r: 24 },
        { x: 367.6, y: 197.2, r: 24 },
        { x: 358.5, y: 67.1, r: 24 },
        { x: 203.2, y: 432.1, r: 24 }
      ]
    },
    // ---- 10 ----
    {
      id: "drawingtime", name: "다 같이 그림 그리기", emoji: "🖍️",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 60, y: 0, width: 360, height: 480, href: "assets/10-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 60, y: 0, width: 360, height: 480, href: "assets/10-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 184, y: 252, r: 24 },
        { x: 153.8, y: 255.1, r: 24 },
        { x: 306.1, y: 345.8, r: 24 },
        { x: 253.6, y: 392.2, r: 24 },
        { x: 141.7, y: 367, r: 24 },
        { x: 233.4, y: 337.8, r: 24 },
        { x: 383.7, y: 275.2, r: 24 },
        { x: 322.2, y: 236.9, r: 24 },
        { x: 347.4, y: 41.3, r: 24 },
        { x: 365.5, y: 150.2, r: 24 }
      ]
    },
    // ---- 11 ----
    {
      id: "girlbedroom", name: "소녀의 방", emoji: "🐶",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 90.1, y: 0, width: 299.9, height: 480, href: "assets/11-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 90.1, y: 0, width: 299.9, height: 480, href: "assets/11-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 315, y: 105.6, r: 26 },
        { x: 275.8, y: 59.8, r: 24 },
        { x: 369.6, y: 46.7, r: 24 },
        { x: 142.7, y: 129.4, r: 24 },
        { x: 191.1, y: 132.4, r: 24 },
        { x: 188.1, y: 81, r: 24 },
        { x: 124.5, y: 190.9, r: 24 },
        { x: 159.8, y: 224.2, r: 24 },
        { x: 128.6, y: 313.9, r: 24 },
        { x: 149.7, y: 389.6, r: 24 },
        { x: 225.4, y: 424.9, r: 24 },
        { x: 310.1, y: 407.7, r: 24 },
        { x: 355.5, y: 328.1, r: 24 },
        { x: 343.4, y: 233.3, r: 24 },
        { x: 307.1, y: 192.9, r: 24 },
        { x: 266.7, y: 114.3, r: 24 }
      ]
    },
    // ---- 13 ----
    {
      id: "trainstation", name: "기차역 가족 여행", emoji: "🚂",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/13-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/13-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 402.8, y: 264, r: 26 },
        { x: 148.7, y: 226, r: 24 },
        { x: 201.2, y: 258.3, r: 24 },
        { x: 202.2, y: 368.2, r: 24 },
        { x: 196.1, y: 428.7, r: 24 },
        { x: 92.3, y: 375.2, r: 24 },
        { x: 41.8, y: 302.6, r: 24 },
        { x: 361.5, y: 192.7, r: 24 },
        { x: 376.6, y: 328.8, r: 24 },
        { x: 421, y: 320.8, r: 24 },
        { x: 264.7, y: 319.8, r: 24 },
        { x: 82.2, y: 255.2, r: 24 },
        { x: 79.2, y: 224, r: 24 },
        { x: 305, y: 86.8, r: 24 }
      ]
    },
    // ---- 14 ----
    {
      id: "nightfeeding", name: "한밤중 우리 아기", emoji: "🍼",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/14-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/14-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 233.4, y: 306.1, r: 24 },
        { x: 351.4, y: 60, r: 24 },
        { x: 271.8, y: 242.5, r: 24 },
        { x: 271.8, y: 307.1, r: 24 },
        { x: 133.6, y: 402.9, r: 24 }
      ]
    },
    // ---- 15 ----
    {
      id: "forestpicnic", name: "숲속 친구들 소풍", emoji: "🦊",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/15-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/15-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 108.4, y: 88.6, r: 24 },
        { x: 251.6, y: 183.4, r: 24 },
        { x: 354.5, y: 347.8, r: 24 },
        { x: 223.4, y: 371, r: 24 },
        { x: 337.3, y: 230.8, r: 24 }
      ]
    },
    // ---- 16 ----
    {
      id: "singinggirl", name: "노래하는 소녀", emoji: "🎤",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/16-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/16-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 430.1, y: 124, r: 24 },
        { x: 257.6, y: 361.9, r: 24 },
        { x: 376.6, y: 311.5, r: 24 },
        { x: 441.2, y: 311.5, r: 24 },
        { x: 66.1, y: 210.7, r: 24 },
        { x: 92.3, y: 62.4, r: 24 },
        { x: 74.1, y: 145.1, r: 24 },
        { x: 36.8, y: 215.7, r: 24 }
      ]
    },
    // ---- 19 ----
    {
      id: "amusementpark", name: "신나는 놀이공원", emoji: "🎡",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/19-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/19-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 64, y: 177.6, r: 29 },
        { x: 240.5, y: 293.2, r: 24 },
        { x: 418, y: 242.8, r: 24 },
        { x: 373.6, y: 196.4, r: 24 },
        { x: 281.8, y: 124.8, r: 24 },
        { x: 75.1, y: 389, r: 24 },
        { x: 83.2, y: 316.4, r: 24 },
        { x: 132.6, y: 322.4, r: 24 },
        { x: 305, y: 404.1, r: 24 },
        { x: 138.7, y: 421.2, r: 24 },
        { x: 162.9, y: 284.1, r: 24 },
        { x: 196.1, y: 202.4, r: 24 },
        { x: 386.7, y: 123.8, r: 24 }
      ]
    },
    // ---- 20 ----
    {
      id: "dinoclass1", name: "공룡 친구들 소풍", emoji: "🦕",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/20-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/20-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 350, y: 345.6, r: 26 },
        { x: 190.1, y: 64.7, r: 24 },
        { x: 127.6, y: 232.1, r: 24 },
        { x: 118.5, y: 291.6, r: 24 },
        { x: 434.1, y: 257.3, r: 24 },
        { x: 321.2, y: 247.2, r: 24 }
      ]
    },
    // ---- 21 ----
    {
      id: "classroom1", name: "즐거운 학교 생활", emoji: "🏫",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/21-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/21-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 243.5, y: 58.6, r: 24 },
        { x: 352.4, y: 46.5, r: 24 },
        { x: 73.1, y: 48.6, r: 24 },
        { x: 143.7, y: 236.1, r: 24 },
        { x: 330.3, y: 143.4, r: 24 },
        { x: 136.6, y: 300.7, r: 24 },
        { x: 373.6, y: 297.6, r: 24 },
        { x: 356.5, y: 346, r: 24 },
        { x: 311.1, y: 376.3, r: 24 },
        { x: 175, y: 246.2, r: 24 },
        { x: 385.7, y: 213.9, r: 24 },
        { x: 420, y: 41.5, r: 24 },
        { x: 41.8, y: 318.8, r: 24 },
        { x: 75.1, y: 246.2, r: 24 }
      ]
    },
    // ---- 22 ----
    {
      id: "motherdaughter", name: "엄마와 함께 책 읽기", emoji: "📚",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/22-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/22-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 54.4, y: 231.3, r: 28 },
        { x: 80.2, y: 92, r: 24 },
        { x: 285.9, y: 270.4, r: 24 },
        { x: 90.3, y: 297.7, r: 24 },
        { x: 422, y: 400.5, r: 24 },
        { x: 291.9, y: 215, r: 24 },
        { x: 334.3, y: 148.4, r: 24 }
      ]
    },
    // ---- 23 ----
    {
      id: "dinoclass2", name: "꼬마 공룡 학교", emoji: "🦖",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/23-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/23-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 152, y: 393.6, r: 26 },
        { x: 328.2, y: 141.8, r: 24 },
        { x: 99.3, y: 33.9, r: 24 },
        { x: 60, y: 109.5, r: 24 },
        { x: 131.6, y: 319.2, r: 24 },
        { x: 352.4, y: 341.4, r: 24 },
        { x: 308.1, y: 229.5, r: 24 },
        { x: 274.8, y: 365.6, r: 24 },
        { x: 228.4, y: 133.7, r: 24 },
        { x: 352.4, y: 42.9, r: 24 },
        { x: 421, y: 45, r: 24 },
        { x: 244.5, y: 55, r: 24 },
        { x: 366.6, y: 221.4, r: 24 },
        { x: 136.6, y: 241.6, r: 24 }
      ]
    },
    // ---- 24 ----
    {
      id: "forestmarket", name: "숲속 열매 시장", emoji: "🦉",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 94.7, y: 0, width: 290.7, height: 480, href: "assets/24-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 94.7, y: 0, width: 290.7, height: 480, href: "assets/24-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 134.6, y: 439.6, r: 24 },
        { x: 341.3, y: 459.8, r: 24 },
        { x: 299, y: 398.3, r: 24 },
        { x: 166.9, y: 289.4, r: 24 },
        { x: 125.5, y: 177.4, r: 24 },
        { x: 184, y: 171.4, r: 24 },
        { x: 208.2, y: 217.8, r: 24 },
        { x: 243.5, y: 103.8, r: 24 },
        { x: 306.1, y: 274.3, r: 24 },
        { x: 325.2, y: 310.6, r: 24 },
        { x: 372.6, y: 349.9, r: 24 },
        { x: 313.1, y: 88.7, r: 24 }
      ]
    },
    // ---- 25 ----
    {
      id: "forestfriends", name: "숲속 동물 친구들", emoji: "🌳",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/25-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/25-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 207.2, y: 81.7, r: 24 },
        { x: 197.1, y: 189.6, r: 24 },
        { x: 318.2, y: 292.4, r: 24 },
        { x: 185, y: 309.6, r: 24 },
        { x: 202.2, y: 347.9, r: 24 },
        { x: 260.7, y: 342.9, r: 24 },
        { x: 263.7, y: 307.6, r: 24 },
        { x: 413.9, y: 233.9, r: 24 },
        { x: 325.2, y: 270.3, r: 24 },
        { x: 403.9, y: 52.4, r: 24 }
      ]
    },
    // ---- 26 ----
    {
      id: "dinowater", name: "공룡 물놀이", emoji: "💦",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/26-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/26-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 144.7, y: 393.3, r: 24 },
        { x: 220.3, y: 362, r: 24 },
        { x: 358.5, y: 347.9, r: 24 },
        { x: 340.3, y: 38.4, r: 24 },
        { x: 433.1, y: 250.1, r: 24 },
        { x: 430.1, y: 309.6, r: 24 },
        { x: 148.7, y: 228.9, r: 24 }
      ]
    },
    // ---- 27 ----
    {
      id: "welcomehome", name: "어서오세요, 우리 집", emoji: "🏠",
      drawBase: function (g) {},
      drawLeft: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/27-left.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      drawRight: function (g) {
        E("image", { x: 20, y: 0, width: 440, height: 480, href: "assets/27-right.png", preserveAspectRatio: "xMidYMid slice" }, g);
      },
      diffs: [
        { x: 429.2, y: 422.4, r: 29 },
        { x: 245.5, y: 423.6, r: 24 },
        { x: 55, y: 282.4, r: 24 },
        { x: 146.7, y: 306.6, r: 24 },
        { x: 184, y: 287.5, r: 24 },
        { x: 452.3, y: 192.7, r: 24 },
        { x: 418, y: 130.1, r: 24 },
        { x: 421, y: 186.6, r: 24 },
        { x: 40.8, y: 174.5, r: 24 },
        { x: 300, y: 374.2, r: 24 }
      ]
    }
  ];

  root.FindData = { LEVELS: LEVELS };
})(window);
