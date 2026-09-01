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

  function skyBg(g, color) {
    E("rect", { x: 0, y: 0, width: 480, height: 480, fill: color }, g);
  }
  function clouds(g, list, color) {
    color = color || "#ffffff";
    list.forEach(function (c) {
      E("ellipse", { cx: c[0], cy: c[1], rx: 34, ry: 18, fill: color }, g);
      E("ellipse", { cx: c[0] + 28, cy: c[1] + 6, rx: 26, ry: 14, fill: color }, g);
      E("ellipse", { cx: c[0] - 26, cy: c[1] + 8, rx: 22, ry: 12, fill: color }, g);
    });
  }
  function groundFlat(g, y, color, edgeColor) {
    E("rect", { x: 0, y: y, width: 480, height: 480 - y, fill: color }, g);
    E("rect", { x: 0, y: y - 8, width: 480, height: 14, fill: edgeColor }, g);
  }
  function sunShape(g, cx, cy, r, color, rays) {
    rays = rays || 8;
    for (var i = 0; i < rays; i++) {
      var a = (i / rays) * Math.PI * 2, r1 = r + 8, r2 = r + 22;
      E("line", { x1: cx + Math.cos(a) * r1, y1: cy + Math.sin(a) * r1, x2: cx + Math.cos(a) * r2, y2: cy + Math.sin(a) * r2, stroke: color, "stroke-width": 5, "stroke-linecap": "round" }, g);
    }
    E("circle", { cx: cx, cy: cy, r: r, fill: color }, g);
  }

  var LEVELS = [
    // ---------------------------------------------------------------- 1
    {
      id: "playground", name: "신나는 놀이터", emoji: "🛝",
      drawBase: function (g) {
        skyBg(g, "#bdeaff");
        clouds(g, [[70, 55], [350, 45]]);
        groundFlat(g, 380, "#a8e063", "#8fd350");
        E("rect", { x: 330, y: 210, width: 12, height: 170, fill: "#2e9bff" }, g);
        E("rect", { x: 378, y: 210, width: 12, height: 170, fill: "#2e9bff" }, g);
        for (var i = 0; i < 6; i++) E("rect", { x: 332, y: 228 + i * 22, width: 56, height: 6, fill: "#0b7fe0" }, g);
        E("path", { d: "M 342 212 Q 300 250 244 372", stroke: "#ff9500", "stroke-width": 24, fill: "none", "stroke-linecap": "round" }, g);
        E("path", { d: "M 244 372 L 210 372 L 218 392 L 252 392 Z", fill: "#ff9500" }, g);
        E("line", { x1: 70, y1: 170, x2: 50, y2: 380, stroke: "#7c5230", "stroke-width": 10 }, g);
        E("line", { x1: 210, y1: 170, x2: 230, y2: 380, stroke: "#7c5230", "stroke-width": 10 }, g);
        E("line", { x1: 50, y1: 170, x2: 230, y2: 170, stroke: "#7c5230", "stroke-width": 10 }, g);
        E("line", { x1: 100, y1: 170, x2: 100, y2: 270, stroke: "#3a2e50", "stroke-width": 4 }, g);
        E("line", { x1: 140, y1: 170, x2: 140, y2: 270, stroke: "#3a2e50", "stroke-width": 4 }, g);
        E("rect", { x: 96, y: 268, width: 48, height: 10, rx: 4, fill: "#a259ff" }, g);
      },
      drawLeft: function (g) {
        sunShape(g, 410, 65, 34, "#ffd400", 8);
        E("circle", { cx: 110, cy: 430, r: 22, fill: "#ff3b3b" }, g);
        E("rect", { x: 88, y: 422, width: 44, height: 16, fill: "#ffffff" }, g);
        E("polygon", { points: "400,120 420,148 400,176 380,148", fill: "#ff4fa3" }, g);
        [0, 1, 2].forEach(function (i) { E("circle", { cx: 400, cy: 182 + i * 16, r: 5, fill: "#7c2ce0" }, g); });
        E("circle", { cx: 60, cy: 412, r: 14, fill: "#ff9fc9" }, g);
        E("circle", { cx: 60, cy: 412, r: 6, fill: "#ffd400" }, g);
        E("path", { d: "M 182 84 Q 196 74 210 84 Q 196 92 182 84", fill: "#3a2e50" }, g);
      },
      drawRight: function (g) {
        sunShape(g, 410, 65, 30, "#ff9500", 6);
        E("circle", { cx: 110, cy: 430, r: 22, fill: "#2e9bff" }, g);
        [-14, 0, 14].forEach(function (dx) { E("line", { x1: 110 + dx, y1: 410, x2: 110 + dx, y2: 450, stroke: "#ffffff", "stroke-width": 5 }, g); });
        E("polygon", { points: "400,120 420,148 400,176 380,148", fill: "#ff4fa3" }, g);
        [0, 1].forEach(function (i) { E("circle", { cx: 400, cy: 182 + i * 16, r: 5, fill: "#7c2ce0" }, g); });
        E("circle", { cx: 60, cy: 412, r: 14, fill: "#ffd400" }, g);
        E("circle", { cx: 60, cy: 412, r: 6, fill: "#ff9500" }, g);
      },
      diffs: [
        { x: 410, y: 65, r: 40 },
        { x: 110, y: 430, r: 34 },
        { x: 400, y: 190, r: 34 },
        { x: 60, y: 412, r: 28 },
        { x: 196, y: 84, r: 30 }
      ]
    },
    // ---------------------------------------------------------------- 2
    {
      id: "picnic", name: "즐거운 소풍", emoji: "🧺",
      drawBase: function (g) {
        skyBg(g, "#bdeaff");
        clouds(g, [[80, 50], [360, 60]]);
        groundFlat(g, 340, "#a8e063", "#8fd350");
        E("rect", { x: 40, y: 250, width: 22, height: 110, fill: "#a9713f" }, g);
        E("circle", { cx: 51, cy: 220, r: 54, fill: "#3fae5c" }, g);
        E("rect", { x: 150, y: 350, width: 220, height: 110, rx: 8, fill: "#ff9fc9" }, g);
        for (var i = 0; i < 5; i++) E("rect", { x: 150 + i * 44, y: 350, width: 22, height: 110, fill: "#ffffff", opacity: "0.5" }, g);
        E("path", { d: "M 250 300 Q 260 270 270 300", stroke: "#7c5230", "stroke-width": 6, fill: "none" }, g);
        E("rect", { x: 245, y: 298, width: 34, height: 26, rx: 4, fill: "#e6b378" }, g);
        E("circle", { cx: 310, cy: 390, r: 28, fill: "#c98a4b" }, g);
        E("circle", { cx: 310, cy: 355, r: 20, fill: "#c98a4b" }, g);
        E("circle", { cx: 298, cy: 340, r: 8, fill: "#c98a4b" }, g);
        E("circle", { cx: 322, cy: 340, r: 8, fill: "#c98a4b" }, g);
        E("circle", { cx: 303, cy: 353, r: 2.5, fill: "#3a2e50" }, g);
        E("circle", { cx: 317, cy: 353, r: 2.5, fill: "#3a2e50" }, g);
        E("ellipse", { cx: 310, cy: 360, rx: 6, ry: 4, fill: "#8a5a2b" }, g);
      },
      drawLeft: function (g) {
        E("ellipse", { cx: 390, cy: 120, rx: 20, ry: 26, fill: "#ff4fa3" }, g);
        E("line", { x1: 390, y1: 146, x2: 390, y2: 190, stroke: "#7c2ce0", "stroke-width": 2 }, g);
        E("path", { d: "M 130 140 Q 110 120 130 108 Q 150 120 130 140", fill: "#ffd400" }, g);
        E("path", { d: "M 130 140 Q 150 120 130 108 Q 110 120 130 140", fill: "#ff9500", transform: "translate(24,0)" }, g);
        [[210, 330], [230, 332], [250, 328]].forEach(function (p) { E("circle", { cx: p[0], cy: p[1], r: 9, fill: "#ff3b3b" }, g); });
        E("path", { d: "M 300 336 L 292 326 L 308 326 Z", fill: "#2e9bff" }, g);
        E("circle", { cx: 55, cy: 395, r: 12, fill: "#ff9fc9" }, g);
        E("circle", { cx: 55, cy: 395, r: 5, fill: "#ffd400" }, g);
      },
      drawRight: function (g) {
        E("ellipse", { cx: 390, cy: 120, rx: 20, ry: 26, fill: "#22c55e" }, g);
        E("line", { x1: 390, y1: 146, x2: 390, y2: 190, stroke: "#7c2ce0", "stroke-width": 2 }, g);
        [[210, 330], [235, 330]].forEach(function (p) { E("circle", { cx: p[0], cy: p[1], r: 9, fill: "#ff3b3b" }, g); });
        E("path", { d: "M 300 336 L 292 326 L 308 326 Z", fill: "#ff4fa3" }, g);
        E("circle", { cx: 55, cy: 395, r: 12, fill: "#ffd400" }, g);
        E("circle", { cx: 55, cy: 395, r: 5, fill: "#ff9500" }, g);
      },
      diffs: [
        { x: 390, y: 120, r: 34 },
        { x: 130, y: 124, r: 34 },
        { x: 232, y: 330, r: 40 },
        { x: 300, y: 331, r: 30 },
        { x: 55, y: 395, r: 28 }
      ]
    },
    // ---------------------------------------------------------------- 3
    {
      id: "pool", name: "첨벙첨벙 물놀이", emoji: "🏊",
      drawBase: function (g) {
        skyBg(g, "#e8f7ff");
        clouds(g, [[70, 55], [370, 50]]);
        E("rect", { x: 0, y: 260, width: 480, height: 220, fill: "#f4e3c1" }, g);
        E("rect", { x: 40, y: 290, width: 400, height: 160, rx: 16, fill: "#2e9bff" }, g);
        E("rect", { x: 40, y: 290, width: 400, height: 160, rx: 16, fill: "none", stroke: "#0b7fe0", "stroke-width": 8 }, g);
        for (var i = 0; i < 5; i++) E("path", { d: "M " + (60 + i * 80) + " 320 Q " + (90 + i * 80) + " 330 " + (120 + i * 80) + " 320", stroke: "#ffffff", "stroke-width": 3, fill: "none", opacity: "0.6" }, g);
        E("rect", { x: 410, y: 200, width: 8, height: 100, fill: "#8a5a2b" }, g);
        E("rect", { x: 30, y: 400, width: 70, height: 40, fill: "#ffffff" }, g);
        [[380, 90], [360, 160], [410, 190]].forEach(function (p) { E("rect", { x: p[0], y: p[1], width: 8, height: 8, fill: "#ffd400", transform: "rotate(20 " + p[0] + " " + p[1] + ")" }, g); });
      },
      drawLeft: function (g) {
        E("circle", { cx: 150, cy: 400, r: 24, fill: "#ff3b3b" }, g);
        E("path", { d: "M 150 376 A 24 24 0 0 1 174 400 L 150 400 Z", fill: "#ffffff" }, g);
        E("ellipse", { cx: 250, cy: 410, rx: 34, ry: 20, fill: "#ffd400" }, g);
        E("circle", { cx: 276, cy: 400, r: 14, fill: "#ffd400" }, g);
        E("path", { d: "M 276 392 L 270 384 L 284 384 Z", fill: "#ff9500" }, g);
        E("path", { d: "M 410 200 A 60 60 0 0 1 470 210 L 350 210 A 60 60 0 0 1 410 200 Z", fill: "#ff4fa3" }, g);
        for (var i = 0; i < 4; i++) E("rect", { x: 30 + i * 17.5, y: 400, width: 8.75, height: 40, fill: "#a259ff" }, g);
        E("ellipse", { cx: 400, cy: 140, rx: 12, ry: 7, fill: "#ff4fa3", transform: "rotate(20 400 140)" }, g);
      },
      drawRight: function (g) {
        E("circle", { cx: 150, cy: 400, r: 24, fill: "#22c55e" }, g);
        E("path", { d: "M 150 376 A 24 24 0 0 1 174 400 L 150 400 Z", fill: "#ffffff" }, g);
        E("path", { d: "M 410 200 A 60 60 0 0 1 470 210 L 350 210 A 60 60 0 0 1 410 200 Z", fill: "#22c55e" }, g);
        for (var i = 0; i < 4; i++) E("rect", { x: 30 + i * 17.5, y: 400, width: 8.75, height: 40, fill: (i % 2 ? "#ff4fa3" : "#a259ff") }, g);
        E("ellipse", { cx: 400, cy: 140, rx: 12, ry: 7, fill: "#2e9bff", transform: "rotate(20 400 140)" }, g);
      },
      diffs: [
        { x: 150, y: 400, r: 30 },
        { x: 255, y: 405, r: 38 },
        { x: 410, y: 205, r: 40 },
        { x: 65, y: 420, r: 34 },
        { x: 400, y: 140, r: 26 }
      ]
    },
    // ---------------------------------------------------------------- 4
    {
      id: "balloon", name: "신나는 풍선 파티", emoji: "🎈",
      drawBase: function (g) {
        E("rect", { x: 0, y: 0, width: 480, height: 340, fill: "#fdeaf3" }, g);
        E("rect", { x: 0, y: 340, width: 480, height: 140, fill: "#f4e3c1" }, g);
        for (var i = 0; i < 7; i++) E("polygon", { points: (40 + i * 58) + ",40 " + (68 + i * 58) + ",40 " + (54 + i * 58) + ",70", fill: (i % 2 ? "#ff4fa3" : "#2e9bff") }, g);
        E("line", { x1: 40, y1: 40, x2: 432, y2: 40, stroke: "#7c5230", "stroke-width": 3 }, g);
        E("rect", { x: 130, y: 300, width: 220, height: 16, fill: "#c98a4b" }, g);
        E("rect", { x: 150, y: 316, width: 16, height: 70, fill: "#a9713f" }, g);
        E("rect", { x: 314, y: 316, width: 16, height: 70, fill: "#a9713f" }, g);
        E("rect", { x: 210, y: 250, width: 60, height: 50, rx: 6, fill: "#ffffff" }, g);
        [[380, 90], [360, 160], [410, 190]].forEach(function (p) { E("rect", { x: p[0], y: p[1], width: 8, height: 8, fill: "#ffd400", transform: "rotate(20 " + p[0] + " " + p[1] + ")" }, g); });
      },
      drawLeft: function (g) {
        E("ellipse", { cx: 90, cy: 130, rx: 26, ry: 32, fill: "#ff3b3b" }, g);
        E("line", { x1: 90, y1: 162, x2: 90, y2: 250, stroke: "#7c2ce0", "stroke-width": 2 }, g);
        [225, 240, 255].forEach(function (x) { E("rect", { x: x, y: 230, width: 4, height: 20, fill: "#ffd400" }, g); E("circle", { cx: x + 2, cy: 227, r: 4, fill: "#ff9500" }, g); });
        E("rect", { x: 210, y: 250, width: 60, height: 14, fill: "#ff4fa3" }, g);
        E("rect", { x: 380, y: 340, width: 50, height: 40, fill: "#a259ff" }, g);
        E("rect", { x: 380, y: 355, width: 50, height: 10, fill: "#ffd400" }, g);
        E("rect", { x: 400, y: 340, width: 10, height: 40, fill: "#ffd400" }, g);
        E("ellipse", { cx: 400, cy: 140, rx: 12, ry: 7, fill: "#ff4fa3", transform: "rotate(20 400 140)" }, g);
      },
      drawRight: function (g) {
        E("ellipse", { cx: 90, cy: 130, rx: 26, ry: 32, fill: "#2e9bff" }, g);
        E("line", { x1: 90, y1: 162, x2: 90, y2: 250, stroke: "#7c2ce0", "stroke-width": 2 }, g);
        [230, 250].forEach(function (x) { E("rect", { x: x, y: 230, width: 4, height: 20, fill: "#ffd400" }, g); E("circle", { cx: x + 2, cy: 227, r: 4, fill: "#ff9500" }, g); });
        E("rect", { x: 210, y: 250, width: 60, height: 14, fill: "#22c55e" }, g);
        E("rect", { x: 380, y: 340, width: 50, height: 40, fill: "#a259ff" }, g);
        E("rect", { x: 380, y: 355, width: 50, height: 10, fill: "#ff4fa3" }, g);
        E("rect", { x: 400, y: 340, width: 10, height: 40, fill: "#ff4fa3" }, g);
        E("ellipse", { cx: 400, cy: 140, rx: 12, ry: 7, fill: "#2e9bff", transform: "rotate(20 400 140)" }, g);
      },
      diffs: [
        { x: 90, y: 130, r: 36 },
        { x: 240, y: 238, r: 40 },
        { x: 240, y: 257, r: 34 },
        { x: 405, y: 355, r: 34 },
        { x: 400, y: 140, r: 26 }
      ]
    },
    // ---------------------------------------------------------------- 5
    {
      id: "toyroom", name: "포근한 장난감 방", emoji: "🧸",
      drawBase: function (g) {
        E("rect", { x: 0, y: 0, width: 480, height: 340, fill: "#fdf6e8" }, g);
        E("rect", { x: 0, y: 340, width: 480, height: 140, fill: "#e6b378" }, g);
        for (var i = 0; i < 8; i++) E("line", { x1: i * 60, y1: 340, x2: i * 60, y2: 480, stroke: "#c98a4b", "stroke-width": 2 }, g);
        E("rect", { x: 340, y: 40, width: 110, height: 110, rx: 8, fill: "#bdeaff", stroke: "#a9713f", "stroke-width": 8 }, g);
        E("line", { x1: 395, y1: 40, x2: 395, y2: 150, stroke: "#a9713f", "stroke-width": 6 }, g);
        E("line", { x1: 340, y1: 95, x2: 450, y2: 95, stroke: "#a9713f", "stroke-width": 6 }, g);
        E("ellipse", { cx: 220, cy: 420, rx: 130, ry: 40, fill: "#ffd8ea" }, g);
        E("ellipse", { cx: 220, cy: 420, rx: 90, ry: 26, fill: "#ffffff" }, g);
        E("rect", { x: 30, y: 60, width: 120, height: 16, fill: "#a9713f" }, g);
        E("rect", { x: 30, y: 130, width: 120, height: 16, fill: "#a9713f" }, g);
        E("rect", { x: 250, y: 360, width: 60, height: 34, rx: 6, fill: "#ff3b3b" }, g);
        E("circle", { cx: 264, cy: 398, r: 10, fill: "#3a2e50" }, g);
        E("circle", { cx: 296, cy: 398, r: 10, fill: "#3a2e50" }, g);
        E("rect", { x: 260, y: 344, width: 14, height: 18, fill: "#7c5230" }, g);
        E("circle", { cx: 60, cy: 400, r: 22, fill: "#c98a4b" }, g);
        E("circle", { cx: 60, cy: 376, r: 16, fill: "#c98a4b" }, g);
        E("circle", { cx: 53, cy: 373, r: 2.5, fill: "#3a2e50" }, g);
        E("circle", { cx: 67, cy: 373, r: 2.5, fill: "#3a2e50" }, g);
      },
      drawLeft: function (g) {
        ["#ffd400", "#22c55e", "#2e9bff", "#ff4fa3"].forEach(function (c, i) { E("rect", { x: 110, y: 360 - i * 26, width: 28, height: 24, fill: c }, g); });
        E("circle", { cx: 200, cy: 410, r: 24, fill: "#ff3b3b" }, g);
        E("rect", { x: 178, y: 402, width: 44, height: 16, fill: "#ffffff" }, g);
        E("path", { d: "M 60 392 L 52 386 L 68 386 Z", fill: "#2e9bff" }, g);
        E("rect", { x: 340, y: 40, width: 20, height: 110, fill: "#ffd400", opacity: "0.85" }, g);
      },
      drawRight: function (g) {
        ["#ffd400", "#22c55e", "#2e9bff"].forEach(function (c, i) { E("rect", { x: 110, y: 360 - i * 26, width: 28, height: 24, fill: c }, g); });
        E("circle", { cx: 200, cy: 410, r: 24, fill: "#22c55e" }, g);
        E("rect", { x: 178, y: 402, width: 44, height: 16, fill: "#ffffff" }, g);
        E("path", { d: "M 60 392 L 52 386 L 68 386 Z", fill: "#ff4fa3" }, g);
        E("rect", { x: 340, y: 40, width: 20, height: 110, fill: "#ff4fa3", opacity: "0.85" }, g);
      },
      diffs: [
        { x: 124, y: 322, r: 42 },
        { x: 200, y: 410, r: 32 },
        { x: 60, y: 390, r: 30 },
        { x: 350, y: 95, r: 26 },
        { x: 280, y: 378, r: 0 }
      ]
    },
    // ---------------------------------------------------------------- 6
    {
      id: "snow", name: "하얀 눈놀이", emoji: "⛄",
      drawBase: function (g) {
        skyBg(g, "#dceeff");
        clouds(g, [[80, 50], [360, 45]], "#ffffff");
        groundFlat(g, 380, "#ffffff", "#eaf6ff");
        E("polygon", { points: "380,230 420,300 340,300", fill: "#0e9b45" }, g);
        E("polygon", { points: "380,260 428,330 332,330", fill: "#0e9b45" }, g);
        E("polygon", { points: "380,290 436,370 324,370", fill: "#0e9b45" }, g);
        E("rect", { x: 372, y: 368, width: 16, height: 24, fill: "#7c5230" }, g);
        E("circle", { cx: 150, cy: 410, r: 42, fill: "#ffffff", stroke: "#dceeff", "stroke-width": 2 }, g);
        E("circle", { cx: 150, cy: 355, r: 30, fill: "#ffffff", stroke: "#dceeff", "stroke-width": 2 }, g);
        E("circle", { cx: 140, cy: 348, r: 3, fill: "#3a2e50" }, g);
        E("circle", { cx: 160, cy: 348, r: 3, fill: "#3a2e50" }, g);
        E("polygon", { points: "150,355 168,360 150,365", fill: "#ff9500" }, g);
        [0, 1, 2].forEach(function (i) { E("circle", { cx: 150, cy: 390 + i * 14, r: 3, fill: "#3a2e50" }, g); });
      },
      drawLeft: function (g) {
        E("path", { d: "M 128 375 Q 150 388 172 375 L 172 385 Q 150 398 128 385 Z", fill: "#ff3b3b" }, g);
        E("rect", { x: 150, y: 384, width: 10, height: 26, fill: "#ff3b3b" }, g);
        E("rect", { x: 250, y: 420, width: 80, height: 14, rx: 6, fill: "#2e9bff" }, g);
        E("path", { d: "M 250 434 Q 240 450 260 450", stroke: "#0b7fe0", "stroke-width": 6, fill: "none" }, g);
        E("ellipse", { cx: 210, cy: 440, rx: 14, ry: 10, fill: "#ff9500" }, g);
        E("polygon", { points: "380,210 386,224 400,224 389,232 393,246 380,238 367,246 371,232 360,224 374,224", fill: "#ffd400" }, g);
        [[50, 120], [70, 150], [40, 160]].forEach(function (p) { E("circle", { cx: p[0], cy: p[1], r: 5, fill: "#ffffff", stroke: "#bcd8ee", "stroke-width": 1.5 }, g); });
      },
      drawRight: function (g) {
        E("path", { d: "M 128 375 Q 150 388 172 375 L 172 385 Q 150 398 128 385 Z", fill: "#22c55e" }, g);
        E("rect", { x: 150, y: 384, width: 10, height: 26, fill: "#22c55e" }, g);
        E("rect", { x: 250, y: 420, width: 80, height: 14, rx: 6, fill: "#ff3b3b" }, g);
        E("path", { d: "M 250 434 Q 240 450 260 450", stroke: "#e62222", "stroke-width": 6, fill: "none" }, g);
        E("ellipse", { cx: 210, cy: 440, rx: 14, ry: 10, fill: "#a259ff" }, g);
        [[50, 120], [70, 150]].forEach(function (p) { E("circle", { cx: p[0], cy: p[1], r: 5, fill: "#ffffff", stroke: "#bcd8ee", "stroke-width": 1.5 }, g); });
      },
      diffs: [
        { x: 150, y: 388, r: 34 },
        { x: 290, y: 430, r: 40 },
        { x: 210, y: 440, r: 28 },
        { x: 380, y: 228, r: 34 },
        { x: 55, y: 140, r: 34 }
      ]
    },
    // ---------------------------------------------------------------- 7
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
    }
  ];

  // fix up the toyroom placeholder diff (train color) which needs its own
  // real hit-zone rather than the accidental zero-radius entry above
  LEVELS[4].diffs[4] = { x: 280, y: 378, r: 36 };

  root.FindData = { LEVELS: LEVELS };
})(window);
