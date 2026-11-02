// ============================= 틀린그림 영역 그리기 공용 도구 =============================
// index.html(만들기·수정)과 reference.html(대조표)이 함께 써요. 좌표는 게임과 같은 480x480 기준이에요.
(function (root) {
  "use strict";

  var SIZE = 480;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var TAP_PX = 6;         // 이만큼도 안 움직였으면 그리기가 아니라 "누르기"
  var MIN_AREA = 150;     // 이보다 작은 영역은 실수로 보고 버려요
  var SIMPLIFY = 1.5;     // 점을 줄이는 허용 오차 (코드 길이를 짧게)

  function round1(n) { return Math.round(n * 10) / 10; }

  function segDist(p, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1];
    var len = dx * dx + dy * dy;
    var t = len ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len)) : 0;
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  }

  // Ramer-Douglas-Peucker
  function simplify(points) {
    if (points.length < 3) return points.slice();
    var maxD = 0, at = 0, last = points.length - 1;
    for (var i = 1; i < last; i++) {
      var d = segDist(points[i], points[0], points[last]);
      if (d > maxD) { maxD = d; at = i; }
    }
    if (maxD <= SIMPLIFY) return [points[0], points[last]];
    return simplify(points.slice(0, at + 1)).slice(0, -1).concat(simplify(points.slice(at)));
  }

  function signedArea(area) {
    var s = 0;
    for (var i = 0; i < area.length; i++) {
      var a = area[i], b = area[(i + 1) % area.length];
      s += a[0] * b[1] - b[0] * a[1];
    }
    return s / 2;
  }

  // 펜으로 그린 점들 → { x, y, r, area }. 너무 작으면 null
  function fromStroke(points) {
    // 시작점과 끝점이 거의 같으면 RDP가 한 점으로 뭉개므로, 가장 먼 점에서 둘로 나눠 줄여요
    var far = 0, farD = -1;
    points.forEach(function (p, i) {
      var d = Math.hypot(p[0] - points[0][0], p[1] - points[0][1]);
      if (d > farD) { farD = d; far = i; }
    });
    var area = simplify(points.slice(0, far + 1)).slice(0, -1).concat(simplify(points.slice(far)));
    area = area.map(function (p) { return [round1(p[0]), round1(p[1])]; });
    var signed = signedArea(area);
    if (area.length < 3 || Math.abs(signed) < MIN_AREA) return null;

    var cx = 0, cy = 0;
    for (var i = 0; i < area.length; i++) {
      var a = area[i], b = area[(i + 1) % area.length], k = a[0] * b[1] - b[0] * a[1];
      cx += (a[0] + b[0]) * k;
      cy += (a[1] + b[1]) * k;
    }
    cx /= 6 * signed; cy /= 6 * signed;
    var r = 0;
    area.forEach(function (p) { r = Math.max(r, Math.hypot(p[0] - cx, p[1] - cy)); });
    return { x: round1(cx), y: round1(cy), r: Math.ceil(r), area: area };
  }

  function pointsAttr(area) {
    return area.map(function (p) { return p[0] + "," + p[1]; }).join(" ");
  }

  // levels-data.js의 diffs 배열에 그대로 넣을 수 있는 코드 한 줄
  function code(d) {
    var text = "{ x: " + d.x + ", y: " + d.y + ", r: " + d.r;
    if (d.area) text += ", area: " + JSON.stringify(d.area).replace(/\],\[/g, "], [");
    return text + " }";
  }

  function makeSvg() {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + SIZE + " " + SIZE);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("class", "area-svg");
    return svg;
  }

  function addPolygon(svg, area, cls, idx) {
    var el = document.createElementNS(SVG_NS, "polygon");
    el.setAttribute("points", pointsAttr(area));
    el.setAttribute("class", cls);
    if (idx != null) el.setAttribute("data-idx", String(idx));
    svg.appendChild(el);
    return el;
  }

  // opts.peers(): 그리는 동안 같은 선을 함께 보여줄 그림틀들
  // opts.onDraw(shape): 영역을 다 그렸을 때
  // opts.onTap(target): 움직이지 않고 눌렀을 때 (target은 처음 누른 요소)
  // opts.onTooSmall(): 그렸지만 영역이 너무 작을 때
  function attach(frame, opts) {
    var stroke = null;

    function toLocal(e) {
      var rect = frame.getBoundingClientRect();
      return [
        Math.max(0, Math.min(SIZE, (e.clientX - rect.left) / rect.width * SIZE)),
        Math.max(0, Math.min(SIZE, (e.clientY - rect.top) / rect.height * SIZE))
      ];
    }

    function clearLive() {
      if (!stroke) return;
      stroke.live.forEach(function (svg) { svg.remove(); });
      stroke = null;
    }

    frame.addEventListener("dragstart", function (e) { e.preventDefault(); });

    frame.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      clearLive();
      frame.setPointerCapture(e.pointerId);
      stroke = {
        id: e.pointerId, target: e.target, moved: false,
        startX: e.clientX, startY: e.clientY,
        points: [toLocal(e)], live: [], lines: []
      };
    });

    frame.addEventListener("pointermove", function (e) {
      if (!stroke || e.pointerId !== stroke.id) return;
      if (!stroke.moved) {
        if (Math.hypot(e.clientX - stroke.startX, e.clientY - stroke.startY) < TAP_PX) return;
        stroke.moved = true;
        opts.peers().forEach(function (f) {
          var svg = makeSvg();
          f.appendChild(svg);
          stroke.live.push(svg);
          stroke.lines.push(addPolygon(svg, stroke.points, "area-live"));
        });
      }
      var events = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      (events.length ? events : [e]).forEach(function (ev) { stroke.points.push(toLocal(ev)); });
      var attr = pointsAttr(stroke.points);
      stroke.lines.forEach(function (line) { line.setAttribute("points", attr); });
    });

    frame.addEventListener("pointerup", function (e) {
      if (!stroke || e.pointerId !== stroke.id) return;
      var done = stroke;
      clearLive();
      if (!done.moved) { opts.onTap(done.target); return; }
      var shape = fromStroke(done.points);
      if (shape) opts.onDraw(shape);
      else opts.onTooSmall();
    });

    frame.addEventListener("pointercancel", function (e) {
      if (stroke && e.pointerId === stroke.id) clearLive();
    });
  }

  root.AreaDraw = { attach: attach, code: code, makeSvg: makeSvg, addPolygon: addPolygon, pointsAttr: pointsAttr, fromStroke: fromStroke };
})(window);
