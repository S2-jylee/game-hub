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

  var LEVELS = [
    {
      id: "rainbow", name: "해님과 무지개", emoji: "🌈",
      draw: function (g) {
        E("rect", { x: 0, y: 0, width: 480, height: 480, fill: "#bdeaff" }, g);
        var bands = [
          { r: 190, c: "#ff3b3b" }, { r: 170, c: "#ff9500" }, { r: 150, c: "#ffd400" },
          { r: 130, c: "#22c55e" }, { r: 110, c: "#2e9bff" }, { r: 90, c: "#a259ff" }
        ];
        bands.forEach(function (b) {
          E("path", {
            d: "M " + (240 - b.r) + " 430 A " + b.r + " " + b.r + " 0 0 1 " + (240 + b.r) + " 430",
            fill: "none", stroke: b.c, "stroke-width": 18, "stroke-linecap": "round"
          }, g);
        });
        E("ellipse", { cx: 70, cy: 430, rx: 60, ry: 26, fill: "#ffffff" }, g);
        E("ellipse", { cx: 410, cy: 430, rx: 60, ry: 26, fill: "#ffffff" }, g);
        [[0, -1], [1, -0.4], [-1, -0.4], [0.7, 0.7], [-0.7, 0.7], [0, 1], [1, 0.5], [-1, 0.5]].forEach(function (r) {
          E("line", { x1: 100, y1: 90, x2: 100 + r[0] * 46, y2: 90 + r[1] * 46, stroke: "#ffd400", "stroke-width": 8, "stroke-linecap": "round" }, g);
        });
        E("circle", { cx: 100, cy: 90, r: 46, fill: "#ffd400" }, g);
        E("circle", { cx: 82, cy: 78, r: 6, fill: "#e6be00" }, g);
        E("path", { d: "M 74 96 Q 100 112 126 96", stroke: "#e6be00", "stroke-width": 4, fill: "none", "stroke-linecap": "round" }, g);
      }
    },
    {
      id: "rocket", name: "우주 로켓", emoji: "🚀",
      draw: function (g) {
        E("rect", { x: 0, y: 0, width: 480, height: 480, fill: "#1c1b3d" }, g);
        var stars = [[40, 60], [90, 140], [420, 90], [380, 200], [60, 320], [430, 340], [340, 60], [140, 400], [420, 430], [30, 200], [230, 40], [300, 420]];
        stars.forEach(function (s, i) {
          E("circle", { cx: s[0], cy: s[1], r: (i % 3) + 2, fill: "#ffffff" }, g);
        });
        E("circle", { cx: 390, cy: 100, r: 44, fill: "#ff9500" }, g);
        E("ellipse", { cx: 390, cy: 100, rx: 66, ry: 16, fill: "none", stroke: "#ffd400", "stroke-width": 6, transform: "rotate(-18 390 100)" }, g);
        E("polygon", { points: "240,120 300,230 180,230", fill: "#ff3b3b" }, g);
        E("rect", { x: 190, y: 220, width: 100, height: 160, rx: 26, fill: "#f4f4f8" }, g);
        E("circle", { cx: 240, cy: 270, r: 26, fill: "#2e9bff" }, g);
        E("circle", { cx: 240, cy: 270, r: 14, fill: "#bdeaff" }, g);
        E("polygon", { points: "190,340 150,400 190,380", fill: "#ff3b3b" }, g);
        E("polygon", { points: "290,340 330,400 290,380", fill: "#ff3b3b" }, g);
        E("rect", { x: 190, y: 370, width: 100, height: 20, fill: "#d81b7a" }, g);
        E("polygon", { points: "210,390 270,390 250,440 230,440", fill: "#ffd400" }, g);
        E("polygon", { points: "222,390 258,390 244,420 236,420", fill: "#ff9500" }, g);
      }
    },
    {
      id: "cat", name: "고양이 얼굴", emoji: "🐱",
      draw: function (g) {
        E("rect", { x: 0, y: 0, width: 480, height: 480, fill: "#f0e9fb" }, g);
        E("polygon", { points: "110,150 170,60 210,180", fill: "#f5c99b" }, g);
        E("polygon", { points: "370,150 310,60 270,180", fill: "#f5c99b" }, g);
        E("polygon", { points: "130,140 165,90 185,165", fill: "#ff9fc9" }, g);
        E("polygon", { points: "350,140 315,90 295,165", fill: "#ff9fc9" }, g);
        E("circle", { cx: 240, cy: 270, r: 150, fill: "#f5c99b" }, g);
        E("ellipse", { cx: 190, cy: 260, rx: 16, ry: 22, fill: "#3a2e50" }, g);
        E("ellipse", { cx: 290, cy: 260, rx: 16, ry: 22, fill: "#3a2e50" }, g);
        E("circle", { cx: 195, cy: 253, r: 4, fill: "#ffffff" }, g);
        E("circle", { cx: 295, cy: 253, r: 4, fill: "#ffffff" }, g);
        E("polygon", { points: "230,300 250,300 240,315", fill: "#ff4fa3" }, g);
        E("path", { d: "M 240 315 Q 240 328 222 332", stroke: "#7c5230", "stroke-width": 4, fill: "none", "stroke-linecap": "round" }, g);
        E("path", { d: "M 240 315 Q 240 328 258 332", stroke: "#7c5230", "stroke-width": 4, fill: "none", "stroke-linecap": "round" }, g);
        [-1, 1].forEach(function (side) {
          [-14, 0, 14].forEach(function (dy) {
            E("line", { x1: 240 + side * 40, y1: 300 + dy, x2: 240 + side * 110, y2: 292 + dy, stroke: "#c9a06a", "stroke-width": 3, "stroke-linecap": "round" }, g);
          });
        });
      }
    },
    {
      id: "appletree", name: "사과나무", emoji: "🍎",
      draw: function (g) {
        E("rect", { x: 0, y: 0, width: 480, height: 340, fill: "#bdeaff" }, g);
        E("rect", { x: 0, y: 340, width: 480, height: 140, fill: "#7bd389" }, g);
        E("circle", { cx: 400, cy: 70, r: 40, fill: "#ffd400" }, g);
        E("rect", { x: 218, y: 260, width: 44, height: 160, fill: "#8b5a2b" }, g);
        E("circle", { cx: 190, cy: 220, r: 95, fill: "#3fae5c" }, g);
        E("circle", { cx: 290, cy: 220, r: 95, fill: "#3fae5c" }, g);
        E("circle", { cx: 240, cy: 160, r: 100, fill: "#4fc06a" }, g);
        var apples = [[160, 190], [310, 190], [240, 130], [200, 250], [280, 250], [240, 190]];
        apples.forEach(function (a) { E("circle", { cx: a[0], cy: a[1], r: 16, fill: "#ff3b3b" }, g); });
        E("ellipse", { cx: 150, cy: 400, rx: 26, ry: 8, fill: "#5fb877" }, g);
        E("ellipse", { cx: 340, cy: 420, rx: 30, ry: 9, fill: "#5fb877" }, g);
      }
    },
    {
      id: "fish", name: "물고기 바다", emoji: "🐟",
      draw: function (g) {
        E("rect", { x: 0, y: 0, width: 480, height: 220, fill: "#7fd4f0" }, g);
        E("rect", { x: 0, y: 220, width: 480, height: 260, fill: "#3fa8d8" }, g);
        E("ellipse", { cx: 250, cy: 260, rx: 110, ry: 70, fill: "#ff9500" }, g);
        E("polygon", { points: "140,260 60,220 60,300", fill: "#ff9500" }, g);
        E("polygon", { points: "230,200 270,200 250,150", fill: "#ffd400" }, g);
        E("circle", { cx: 300, cy: 245, r: 12, fill: "#ffffff" }, g);
        E("circle", { cx: 304, cy: 245, r: 6, fill: "#241b3a" }, g);
        E("path", { d: "M 200 260 Q 250 240 300 260", stroke: "#e67300", "stroke-width": 5, fill: "none" }, g);
        var bubbles = [[380, 340], [400, 280], [360, 400], [420, 400], [80, 160], [120, 340]];
        bubbles.forEach(function (b, i) { E("circle", { cx: b[0], cy: b[1], r: 6 + (i % 3) * 4, fill: "rgba(255,255,255,0.75)" }, g); });
        E("path", { d: "M 60 480 Q 80 400 60 340 Q 40 400 60 480", fill: "#2f8f5b" }, g);
        E("path", { d: "M 420 480 Q 440 420 420 360 Q 400 420 420 480", fill: "#2f8f5b" }, g);
      }
    },
    {
      id: "icecream", name: "아이스크림", emoji: "🍦",
      draw: function (g) {
        E("rect", { x: 0, y: 0, width: 480, height: 480, fill: "#ffe1ef" }, g);
        E("polygon", { points: "190,300 290,300 240,440", fill: "#d9a066" }, g);
        for (var i = 0; i < 4; i++) {
          E("line", { x1: 200 + i * 22, y1: 305, x2: 226 + i * 22, y2: 420, stroke: "#b97f45", "stroke-width": 3 }, g);
        }
        E("line", { x1: 195, y1: 340, x2: 285, y2: 340, stroke: "#b97f45", "stroke-width": 3 }, g);
        E("line", { x1: 195, y1: 380, x2: 285, y2: 380, stroke: "#b97f45", "stroke-width": 3 }, g);
        E("circle", { cx: 240, cy: 270, r: 70, fill: "#ff9fc9" }, g);
        E("circle", { cx: 240, cy: 195, r: 62, fill: "#c9f7d8" }, g);
        E("circle", { cx: 240, cy: 130, r: 52, fill: "#fff3d6" }, g);
        E("circle", { cx: 240, cy: 85, r: 16, fill: "#ff3b3b" }, g);
        E("line", { x1: 240, y1: 85, x2: 250, y2: 60, stroke: "#2f8f5b", "stroke-width": 4 }, g);
        [[210, 170], [270, 200], [220, 260]].forEach(function (p) {
          E("circle", { cx: p[0], cy: p[1], r: 5, fill: "#ffffff" }, g);
        });
      }
    },
    {
      id: "balloons", name: "풍선 다발", emoji: "🎈",
      draw: function (g) {
        E("rect", { x: 0, y: 0, width: 480, height: 480, fill: "#cdeeff" }, g);
        E("ellipse", { cx: 90, cy: 90, rx: 44, ry: 22, fill: "#ffffff" }, g);
        E("ellipse", { cx: 400, cy: 130, rx: 50, ry: 24, fill: "#ffffff" }, g);
        var balloons = [
          { x: 130, y: 150, c: "#ff3b3b" }, { x: 210, y: 110, c: "#ffd400" },
          { x: 290, y: 150, c: "#2e9bff" }, { x: 240, y: 190, c: "#22c55e" },
          { x: 350, y: 190, c: "#a259ff" }
        ];
        balloons.forEach(function (b) {
          E("path", { d: "M " + b.x + " " + (b.y + 60) + " Q " + (b.x + 10) + " 320 " + (b.x - 20) + " 400", stroke: "#7c5230", "stroke-width": 3, fill: "none" }, g);
          E("ellipse", { cx: b.x, cy: b.y, rx: 46, ry: 56, fill: b.c }, g);
          E("ellipse", { cx: b.x - 14, cy: b.y - 20, rx: 12, ry: 16, fill: "rgba(255,255,255,0.45)" }, g);
          E("polygon", { points: (b.x - 8) + "," + (b.y + 54) + " " + (b.x + 8) + "," + (b.y + 54) + " " + b.x + "," + (b.y + 66), fill: b.c }, g);
        });
      }
    },
    {
      id: "house", name: "아늑한 집", emoji: "🏠",
      draw: function (g) {
        E("rect", { x: 0, y: 0, width: 480, height: 320, fill: "#bdeaff" }, g);
        E("rect", { x: 0, y: 320, width: 480, height: 160, fill: "#7bd389" }, g);
        E("circle", { cx: 400, cy: 70, r: 36, fill: "#ffd400" }, g);
        E("rect", { x: 130, y: 220, width: 220, height: 160, fill: "#fff3d6" }, g);
        E("polygon", { points: "110,220 370,220 240,110", fill: "#d81b7a" }, g);
        E("rect", { x: 300, y: 130, width: 24, height: 50, fill: "#8b5a2b" }, g);
        E("circle", { cx: 306, cy: 110, r: 10, fill: "#e6e6e6" }, g);
        E("circle", { cx: 318, cy: 96, r: 13, fill: "#f0f0f0" }, g);
        E("circle", { cx: 330, cy: 80, r: 16, fill: "#ffffff" }, g);
        E("rect", { x: 218, y: 300, width: 44, height: 80, fill: "#8b5a2b" }, g);
        E("circle", { cx: 252, cy: 340, r: 4, fill: "#ffd400" }, g);
        [160, 300].forEach(function (wx) {
          E("rect", { x: wx, y: 250, width: 50, height: 50, fill: "#7fd4f0", stroke: "#ffffff", "stroke-width": 5 }, g);
          E("line", { x1: wx + 25, y1: 250, x2: wx + 25, y2: 300, stroke: "#ffffff", "stroke-width": 5 }, g);
          E("line", { x1: wx, y1: 275, x2: wx + 50, y2: 275, stroke: "#ffffff", "stroke-width": 5 }, g);
        });
      }
    },
    {
      id: "butterfly", name: "나비와 꽃", emoji: "🦋",
      draw: function (g) {
        E("rect", { x: 0, y: 0, width: 480, height: 480, fill: "#d8f7e6" }, g);
        [[70, 90], [400, 380], [420, 100], [60, 380]].forEach(function (p) {
          [0, 72, 144, 216, 288].forEach(function (ang) {
            var rad = ang * Math.PI / 180;
            E("circle", { cx: p[0] + Math.cos(rad) * 14, cy: p[1] + Math.sin(rad) * 14, r: 10, fill: "#ff9fc9" }, g);
          });
          E("circle", { cx: p[0], cy: p[1], r: 9, fill: "#ffd400" }, g);
        });
        E("path", { d: "M 240 150 Q 200 60 160 90", stroke: "#3a2e50", "stroke-width": 4, fill: "none", "stroke-linecap": "round" }, g);
        E("path", { d: "M 240 150 Q 280 60 320 90", stroke: "#3a2e50", "stroke-width": 4, fill: "none", "stroke-linecap": "round" }, g);
        E("path", { d: "M 240 170 C 140 90 60 170 130 250 C 170 290 220 250 240 220 Z", fill: "#a259ff" }, g);
        E("path", { d: "M 240 170 C 340 90 420 170 350 250 C 310 290 260 250 240 220 Z", fill: "#a259ff" }, g);
        E("path", { d: "M 240 230 C 170 210 120 290 170 330 C 200 350 230 320 240 290 Z", fill: "#ff9500" }, g);
        E("path", { d: "M 240 230 C 310 210 360 290 310 330 C 280 350 250 320 240 290 Z", fill: "#ff9500" }, g);
        [[190, 170], [290, 170]].forEach(function (p) { E("circle", { cx: p[0], cy: p[1], r: 10, fill: "#fff3d6" }, g); });
        E("ellipse", { cx: 240, cy: 220, rx: 12, ry: 90, fill: "#3a2e50" }, g);
        E("circle", { cx: 240, cy: 140, r: 16, fill: "#3a2e50" }, g);
      }
    },
    {
      id: "car", name: "씽씽 자동차", emoji: "🚗",
      draw: function (g) {
        E("rect", { x: 0, y: 0, width: 480, height: 330, fill: "#bdeaff" }, g);
        E("rect", { x: 0, y: 330, width: 480, height: 150, fill: "#5b6b7a" }, g);
        for (var i = 0; i < 6; i++) {
          E("rect", { x: 20 + i * 80, y: 400, width: 40, height: 10, fill: "#ffffff" }, g);
        }
        E("ellipse", { cx: 100, cy: 80, rx: 46, ry: 22, fill: "#ffffff" }, g);
        E("rect", { x: 100, y: 250, width: 280, height: 80, rx: 24, fill: "#ff3b3b" }, g);
        E("path", { d: "M 140 250 Q 160 190 220 190 L 300 190 Q 340 190 360 250 Z", fill: "#ff3b3b" }, g);
        E("polygon", { points: "225,198 235,240 300,240 315,198", fill: "#bdeaff" }, g);
        E("line", { x1: 262, y1: 198, x2: 262, y2: 240, stroke: "#ffffff", "stroke-width": 4 }, g);
        E("circle", { cx: 170, cy: 340, r: 34, fill: "#2b2b2b" }, g);
        E("circle", { cx: 170, cy: 340, r: 14, fill: "#e6e6e6" }, g);
        E("circle", { cx: 330, cy: 340, r: 34, fill: "#2b2b2b" }, g);
        E("circle", { cx: 330, cy: 340, r: 14, fill: "#e6e6e6" }, g);
        E("circle", { cx: 372, cy: 275, r: 10, fill: "#ffd400" }, g);
      }
    },
    {
      id: "penguin", name: "아기 펭귄", emoji: "🐧",
      draw: function (g) {
        E("rect", { x: 0, y: 0, width: 480, height: 300, fill: "#cdeeff" }, g);
        E("rect", { x: 0, y: 300, width: 480, height: 180, fill: "#f2fbff" }, g);
        [[80, 330], [380, 350], [140, 400], [340, 420]].forEach(function (p) {
          E("circle", { cx: p[0], cy: p[1], r: 10, fill: "#ffffff" }, g);
        });
        E("ellipse", { cx: 240, cy: 300, rx: 100, ry: 130, fill: "#2b2b3a" }, g);
        E("ellipse", { cx: 240, cy: 330, rx: 62, ry: 90, fill: "#f5f6fa" }, g);
        E("circle", { cx: 240, cy: 165, r: 78, fill: "#2b2b3a" }, g);
        E("ellipse", { cx: 240, cy: 190, rx: 46, ry: 40, fill: "#f5f6fa" }, g);
        E("circle", { cx: 215, cy: 155, r: 9, fill: "#241b3a" }, g);
        E("circle", { cx: 265, cy: 155, r: 9, fill: "#241b3a" }, g);
        E("polygon", { points: "225,180 255,180 240,205", fill: "#ff9500" }, g);
        E("ellipse", { cx: 150, cy: 300, rx: 22, ry: 55, fill: "#2b2b3a", transform: "rotate(-18 150 300)" }, g);
        E("ellipse", { cx: 330, cy: 300, rx: 22, ry: 55, fill: "#2b2b3a", transform: "rotate(18 330 300)" }, g);
        E("polygon", { points: "205,420 235,420 220,445", fill: "#ff9500" }, g);
        E("polygon", { points: "245,420 275,420 260,445", fill: "#ff9500" }, g);
      }
    },
    {
      id: "cake", name: "생일 케이크", emoji: "🎂",
      draw: function (g) {
        E("rect", { x: 0, y: 0, width: 480, height: 480, fill: "#fff3d6" }, g);
        E("ellipse", { cx: 240, cy: 420, rx: 160, ry: 22, fill: "#e6e6e6" }, g);
        E("rect", { x: 110, y: 300, width: 260, height: 110, fill: "#ff9fc9" }, g);
        E("rect", { x: 110, y: 295, width: 260, height: 20, fill: "#ffffff" }, g);
        E("rect", { x: 150, y: 210, width: 180, height: 90, fill: "#ffd6e8" }, g);
        E("rect", { x: 150, y: 205, width: 180, height: 18, fill: "#ffffff" }, g);
        [180, 240, 300].forEach(function (cx) {
          E("rect", { x: cx - 6, y: 150, width: 12, height: 55, fill: "#7fd4f0" }, g);
          E("ellipse", { cx: cx, cy: 145, rx: 8, ry: 14, fill: "#ffd400" }, g);
        });
        var confetti = [[60, 120, "#ff3b3b"], [420, 150, "#22c55e"], [70, 300, "#2e9bff"], [410, 320, "#a259ff"], [90, 400, "#ffd400"], [400, 420, "#ff9500"]];
        confetti.forEach(function (c) { E("circle", { cx: c[0], cy: c[1], r: 8, fill: c[2] }, g); });
      }
    }
  ];

  window.PuzzleData = { ART_SIZE: ART_SIZE, LEVELS: LEVELS, E: E };
})();
