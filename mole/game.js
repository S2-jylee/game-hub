// 🔨 두더지 잡기 (영어): 위에 나온 영어 단어의 뜻 그림을 든 두더지만 잡아요.
// 구구단 놀이터의 두더지 잡기와 같은 게임이에요 (문제만 영어 단어 → 그림).
// 영어 놀이 메뉴의 설정 팝업(?eng=1&u=이름&g=학년&d=난이도)에서 열어요.
(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable, ignore */ } }
  };
  const GRADES = window.SPELL_GRADES;
  const PROFILES_KEY = 'mole_profiles', GUIDE_ID = 'mole';
  const EL = window.EngLink || { on: false };
  const TOTAL = 15, LIVES = 3;
  // 난이도: 두더지가 올라와 있는 시간(초) · 나오는 간격(초) · 한 번에 나오는 수 (영어는 읽을 시간이 조금 더 필요해요)
  const UP = EL.by ? EL.by({ easy: 2.8, normal: 1.9, hard: 1.3 }) : 1.9;
  const GAP = EL.by ? EL.by({ easy: 1.0, normal: 0.75, hard: 0.5 }) : 0.75;
  const MAX = EL.by ? EL.by({ easy: 2, normal: 3, hard: 4 }) : 3;
  // 한 문제에 주는 시간(초): 게이지가 다 줄어들 때까지 못 잡으면 하트 -1
  const QTIME = EL.by ? EL.by({ easy: 16, normal: 12, hard: 9 }) : 12;
  const PRAISE = ['딩동댕! 🔔', '잘했어! 🎉', '최고야! 👍', '우와, 천재다! 🌟', '멋져요! 💖', '정답이야! 🍭'];
  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  const grade = GRADES[(EL.grade || 1) - 1] || GRADES[0];
  const state = { sound: store.get('eng_sound', true), user: EL.user, qs: [], i: 0, score: 0, lives: LIVES, combo: 0, correct: 0, wrong: [], missedThis: false, cur: null };

  /* ---------- 소리 ---------- */
  let actx = null;

  // 정답이 '?' 자리에 들어가도 문제 칸(흰 상자)이 커지지 않게 글자 크기를 줄여 맞춰요
  function fitAns(qm, text, cls) {
    const box = qm.parentElement, w0 = box.offsetWidth, h0 = box.offsetHeight;
    qm.style.fontSize = ''; qm.style.verticalAlign = '';
    qm.textContent = text; if (cls) qm.className = cls;
    let f = 1;
    while (f > 0.3 && (box.offsetWidth > w0 + 1 || box.offsetHeight > h0 + 1 || box.scrollWidth > box.clientWidth + 1)) { f -= 0.05; qm.style.fontSize = f + 'em'; }
    if (f < 1) qm.style.verticalAlign = 'middle';
  }
  function resetAns(qm) { qm.style.fontSize = ''; qm.style.verticalAlign = ''; qm.textContent = '?'; qm.className = 'q-mark'; }

  function tone(freq, dur, type = 'sine', when = 0, vol = 0.15) {
    if (!state.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime + when;
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t); o.stop(t + dur);
    } catch (e) { /* audio unavailable, ignore */ }
  }
  const sfx = {
    correct() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', i * 0.08)); },
    wrong() { tone(260, 0.22, 'triangle', 0, 0.14); tone(196, 0.3, 'triangle', 0.14, 0.14); },
    tick() { tone(1250, 0.04, 'square', 0, 0.03); },
    win() { [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', i * 0.13)); }
  };
  function speakEn(text) {
    if (GuideBook.defer(() => speakEn(text))) return;   // 방법 팝업이 닫히면 읽어줘요
    if (!state.sound || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US'; u.rate = 0.8; u.pitch = 1.2;
      speechSynthesis.speak(u);
    } catch (e) { /* speech unavailable, ignore */ }
  }

  /* ---------- 효과 ---------- */
  function burstAt(cx, cy) {
    const bits = ['⭐', '✨', '💖', '🎈', '🌟', '🍬'];
    for (let k = 0; k < 14; k++) {
      const p = document.createElement('div');
      p.className = 'particle'; p.textContent = pick(bits);
      const ang = (Math.PI * 2 * k) / 14, dist = rand(70, 140);
      p.style.left = cx + 'px'; p.style.top = cy + 'px';
      p.style.setProperty('--x', Math.cos(ang) * dist + 'px');
      p.style.setProperty('--y', Math.sin(ang) * dist + 'px');
      p.style.setProperty('--r', rand(-200, 200) + 'deg');
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 950);
    }
  }
  function floatAt(x, y, text) {
    const f = document.createElement('div');
    f.className = 'float-text'; f.textContent = text;
    f.style.left = x + 'px'; f.style.top = y + 'px';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1000);
  }
  function confetti(n) {
    const bits = ['🎉', '🎊', '⭐', '🎈', '💖', '🌟', '🍭'];
    for (let k = 0; k < n; k++) {
      const c = document.createElement('div');
      c.className = 'confetti'; c.textContent = pick(bits);
      c.style.left = Math.random() * 100 + 'vw';
      c.style.animationDuration = rand(22, 40) / 10 + 's';
      c.style.animationDelay = Math.random() * 1.2 + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 5500);
    }
  }
  function animate(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function show(id) { ['#intro', '#mole', '#result'].forEach(s => $(s).classList.toggle('hidden', s !== id)); }

  /* ---------- 사용자 기록 (이 기기에만 저장, 게스트는 저장 안 함) ---------- */
  const loadProfiles = () => store.get(PROFILES_KEY, {});
  function saveBest(score) {
    if (!state.user) return { best: 0, isRecord: score > 0 };
    const p = loadProfiles(), d = p[state.user] || { best: {} };
    d.best = d.best || {};
    const key = 'g' + grade.grade, best = d.best[key] || 0;
    if (score > best) d.best[key] = score;
    p[state.user] = d; store.set(PROFILES_KEY, p);
    return { best, isRecord: score > best };
  }

  /* ---------- 문제 ---------- */
  function wordQueue(n) {
    let qs = [];
    while (qs.length < n) {
      const next = shuffle(grade.words.filter(w => w[2]));   // 두더지가 한글 뜻을 들고 나와서, 그림 없는 단어도 괜찮아요
      if (qs.length && next[0][0] === qs[qs.length - 1][0]) next.push(next.shift());
      qs = qs.concat(next);
    }
    return qs.slice(0, n);
  }
  function renderHearts(justLost) {
    let html = '';
    for (let k = 0; k < LIVES; k++) html += k < state.lives ? '<span>❤️</span>' : `<span class="${justLost && k === state.lives ? 'lost' : ''}" style="opacity:.5">🤍</span>`;
    $('#moleHearts').innerHTML = html;
  }
  function bumpScore(gain) {
    state.score += gain;
    $('#moleScore').textContent = state.score;
    animate($('#moleScoreBox'), 'bump');
  }

  /* ---------- 두더지 ---------- */
  const mg = { active: false, raf: 0, last: 0, holes: [], spawnT: 0, sinceAns: 0, waitT: 0, overT: 0, timeLeft: 0, tickSec: 0 };
  function buildField() {
    const f = $('#moleField'); f.innerHTML = '';
    mg.holes = [];
    for (let k = 0; k < 9; k++) {
      const h = document.createElement('div');
      h.className = 'hole';
      h.innerHTML = `<div class="pit"></div><div class="clip"><div class="mole"><span class="m-ear l"></span><span class="m-ear r"></span>` +
        `<span class="m-eye l"></span><span class="m-eye r"></span><span class="m-nose"></span><span class="m-num"></span></div></div><span class="h-no">${k + 1}</span>`;
      const hole = { el: h, mole: h.querySelector('.mole'), num: h.querySelector('.m-num'), st: 'down', v: '', t: 0, life: 0, cool: 0 };
      h.addEventListener('pointerdown', e => { e.preventDefault(); whack(hole, e.clientX, e.clientY); });
      f.appendChild(h);
      mg.holes.push(hole);
    }
  }
  function guide() {
    return {
      id: GUIDE_ID, title: '두더지 잡기',
      pages: [
        { icon: '🕳️', title: '두더지가 쑥쑥', text: '구멍에서 <b>한글 뜻</b>을 든 두더지들이 쑥쑥 올라왔다 내려가요.' },
        { icon: '🔨', title: '맞는 뜻을 뿅!', text: '위에 나온 <b>영어 단어</b>의 뜻을 든 두더지를 눌러서 잡아요.<br>예) Apple → <b>사과</b> 두더지' },
        { icon: '❤️', title: '틀리면 하트가 줄어요', text: '틀린 두더지를 잡거나 <b>시간 게이지</b>가 다 줄어들면 ❤️ 하트가 하나 줄어요.<br><b>하트 3개</b>를 다 쓰면 끝!' },
        { icon: '⌨️', title: '키보드로도 OK', text: '키보드 <b>1 ~ 9</b> 번으로도 잡을 수 있어요 (왼쪽 위부터).<br>단어 <b>' + TOTAL + '개</b>를 다 잡으면 성공!' }
      ],
      startText: '자, 두더지를 잡아 볼까?', startLabel: '시작! 🔨', onStart: null
    };
  }
  // 게임 화면을 먼저 열고, 그 위에 방법 팝업을 띄워요. 팝업이 떠 있는 동안은 멈춰 있어요
  function startGame() {
    Object.assign(state, { qs: wordQueue(TOTAL), i: 0, score: 0, lives: LIVES, combo: 0, correct: 0, wrong: [] });
    $('#moleScore').textContent = '0';
    renderHearts();
    show('#mole');
    buildField();
    Object.assign(mg, { active: true, spawnT: 0.8, sinceAns: 0, waitT: 0, overT: 0 });
    $('#moleMsg').textContent = '단어 뜻에 맞는 두더지를 뿅! 잡아요';
    setQuestion();
    mg.last = performance.now();
    cancelAnimationFrame(mg.raf);
    mg.raf = requestAnimationFrame(frame);
    GuideBook.intro(guide(), () => $('#moleQuit').onclick());
  }
  function stopGame() { mg.active = false; cancelAnimationFrame(mg.raf); }
  function setQuestion() {
    const w = state.qs[state.i];
    // 두더지는 그림 대신 한글 뜻을 들고 올라와요
    const others = [];
    shuffle(grade.words.filter(o => o[2] && o[2] !== w[2])).forEach(o => { if (others.length < 7 && !others.includes(o[2])) others.push(o[2]); });
    state.cur = { w, ans: w[2], wrongs: others };
    state.missedThis = false;
    $('#mqWord').textContent = cap(w[0]);
    resetAns($('#mqans'));
    $('#moleProgress').style.width = (state.i / TOTAL * 100) + '%';
    $('#moleProgressText').textContent = `${grade.grade}학년 · ${EL.diffName || ''}  ·  ${state.i + 1} / ${TOTAL}`;
    speakEn(w[0]);
    mg.timeLeft = QTIME; mg.tickSec = 4;
    renderTimer();
  }
  function renderTimer() {
    const fill = $('#moleTimer');
    fill.style.width = Math.max(0, mg.timeLeft / QTIME * 100) + '%';
    fill.classList.toggle('hurry', mg.timeLeft <= 3);
  }
  // 시간 끝: 하트 -1, 정답을 보여주고 다음 단어로
  function timeUp() {
    const { w, ans } = state.cur;
    sfx.wrong();
    state.combo = 0;
    if (!state.missedThis) state.wrong.push(w);
    state.lives--;
    renderHearts(true);
    fitAns($('#mqans'), ans, 'q-mark reveal');
    mg.holes.forEach(o => { if (o.st === 'up') moleDown(o, true); });
    $('#moleMsg').textContent = `⏰ 시간 끝! ${cap(w[0])} = ${ans} 이에요`;
    state.i++;
    if (state.lives <= 0) { mg.overT = 1.6; $('#moleMsg').textContent = '하트를 다 썼어요! 💪'; return; }
    if (state.i >= TOTAL) { mg.overT = 1.6; return; }
    mg.waitT = 1.8;
  }
  function moleDown(h, fast) {
    h.st = 'down'; h.cool = fast ? 0.15 : 0.3;
    h.mole.classList.remove('up', 'hit', 'shock');
  }
  function spawn() {
    const free = mg.holes.filter(h => h.st === 'down' && h.cool <= 0);
    const up = mg.holes.filter(h => h.st === 'up');
    if (!free.length || up.length >= MAX) return;
    const { ans, wrongs } = state.cur;
    let v;
    // 정답 두더지는 너무 오래 안 나오지 않게, 한 번에 하나만
    if (!up.some(h => h.v === ans) && (mg.sinceAns >= 2 || Math.random() < 0.4)) { v = ans; mg.sinceAns = 0; }
    else {
      const opts = wrongs.filter(n => !up.some(h => h.v === n));
      v = pick(opts.length ? opts : wrongs); mg.sinceAns++;
    }
    const h = pick(free);
    Object.assign(h, { st: 'up', v, t: 0, life: UP * (0.85 + Math.random() * 0.3) });
    h.num.textContent = v;
    h.mole.classList.remove('hit', 'shock');
    h.mole.classList.add('up');
  }
  function hammerAt(x, y) {
    const m = document.createElement('div');
    m.className = 'hammer'; m.textContent = '🔨';
    m.style.left = x + 'px'; m.style.top = y + 'px';
    document.body.appendChild(m);
    setTimeout(() => m.remove(), 350);
  }
  function whack(h, x, y) {
    if (!mg.active || GuideBook.isOpen() || mg.overT > 0) return;
    if (x == null) { const r = h.el.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height * 0.45; }
    hammerAt(x, y);
    if (h.st !== 'up' || mg.waitT > 0) return;
    const { w, ans } = state.cur;
    if (h.v === ans) {
      h.st = 'hit'; h.t = 0;
      h.mole.classList.add('hit');
      if (!state.missedThis) state.correct++;
      state.combo++;
      const gain = (state.missedThis ? 5 : 10) + Math.min(state.combo - 1, 5) * 2;
      bumpScore(gain);
      tone(1500, 0.06, 'square', 0, 0.06); tone(2100, 0.1, 'triangle', 0.05, 0.1); sfx.correct();
      burstAt(x, y); floatAt(x, y - 30, '뿅! +' + gain);
      fitAns($('#mqans'), ans, 'q-mark ok');
      $('#moleMsg').textContent = `${cap(w[0])} = ${ans} 정답! ` + pick(PRAISE) + (state.combo >= 2 ? `  🔥 ${state.combo}연속!` : '');
      mg.holes.forEach(o => { if (o !== h && o.st === 'up') moleDown(o, true); });
      state.i++;
      if (state.i >= TOTAL) { mg.overT = 1.3; sfx.win(); return; }
      mg.waitT = 0.9;
      return;
    }
    // 틀린 두더지: 깜짝 놀라 도망가요
    h.st = 'hit'; h.t = 0;
    h.mole.classList.add('shock');
    sfx.wrong();
    state.combo = 0;
    if (!state.missedThis) state.wrong.push(w);
    state.missedThis = true;
    state.lives--;
    renderHearts(true);
    floatAt(x, y - 30, '앗! ' + h.v);
    $('#moleMsg').textContent = `앗! 그 뜻이 아니에요. ${cap(w[0])} 는(은) 무슨 뜻일까요?`;
    if (state.lives <= 0) {
      mg.overT = 1.3;
      mg.holes.forEach(o => { if (o !== h && o.st === 'up') moleDown(o, true); });
      $('#moleMsg').textContent = '하트를 다 썼어요! 💪';
    }
  }
  function frame(now) {
    if (!mg.active) return;
    const dt = GuideBook.isOpen() ? 0 : Math.min(0.05, (now - mg.last) / 1000);
    mg.last = now;
    if (mg.overT > 0) {
      if ((mg.overT -= dt) <= 0) { finish(); return; }
    } else if (mg.waitT > 0) {
      if ((mg.waitT -= dt) <= 0) { setQuestion(); mg.sinceAns = 0; mg.spawnT = 0.2; }
    } else {
      mg.timeLeft -= dt;
      if (mg.timeLeft <= 3 && Math.ceil(mg.timeLeft) < mg.tickSec) { mg.tickSec = Math.ceil(mg.timeLeft); if (mg.timeLeft > 0) sfx.tick(); }
      renderTimer();
      if (mg.timeLeft <= 0) timeUp();
      else if ((mg.spawnT -= dt) <= 0) {
        spawn();
        mg.spawnT = GAP * (0.8 + Math.random() * 0.4);
      }
    }
    mg.holes.forEach(h => {
      if (h.st === 'down') { h.cool -= dt; return; }
      h.t += dt;
      if (h.st === 'hit' && h.t > 0.45) moleDown(h);
      else if (h.st === 'up' && h.t >= h.life && mg.overT <= 0) {
        if (h.v === state.cur.ans && mg.waitT <= 0) $('#moleMsg').textContent = '정답 두더지가 숨었어요! 다시 나올 거예요 👀';
        moleDown(h);
      }
    });
    mg.raf = requestAnimationFrame(frame);
  }

  /* ---------- 결과 ---------- */
  function finish() {
    stopGame();
    const ratio = state.correct / TOTAL, lost = state.lives <= 0;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
    const titles = { 3: '완벽해요! 🏆', 2: '아주 잘했어요! 🎉', 1: '잘했어요! 다음엔 더 잘할 수 있어 💪' };
    $('#resultTitle').textContent = lost ? '하트를 다 썼어요! 다시 도전! 💪' : titles[stars];
    $('#stars').innerHTML = [1, 2, 3].map(k => `<span class="${k <= stars ? '' : 'dim'}" style="animation-delay:${k * 0.25}s">⭐</span>`).join('');
    const { best, isRecord } = saveBest(state.score);
    $('#resultCard').innerHTML =
      `두더지 잡기 · ${grade.grade}학년 · ${esc(EL.diffName || '')}<br>` +
      `맞힌 단어 <b>${state.correct}</b> / ${TOTAL}<br>` +
      `점수 <b>${state.score}</b>점 ${isRecord && state.score > 0 ? '<span class="record">🎊 최고 기록!</span>' : ''}<br>` +
      (state.user ? `<small style="color:var(--muted)">${grade.grade}학년 최고 점수: ${Math.max(best, state.score)}점</small>` : '');
    const rv = $('#review'); rv.innerHTML = '';
    if (state.wrong.length) {
      rv.innerHTML = '<div class="label" style="text-align:center">📝 다시 보면 좋은 단어 (누르면 읽어줘요)</div><div class="chips"></div>';
      state.wrong.forEach(w => {
        const c = document.createElement('button'); c.className = 'chip'; c.textContent = w[1] + ' ' + w[0] + ' ' + w[2];
        c.onclick = () => speakEn(w[0]);
        rv.querySelector('.chips').appendChild(c);
      });
    } else rv.innerHTML = '<div class="label" style="text-align:center">💯 틀린 단어가 하나도 없어요!</div>';
    show('#result');
    sfx.win();
    confetti(stars * 15);
  }

  $('#moleQuit').onclick = () => { stopGame(); if ('speechSynthesis' in window) speechSynthesis.cancel(); EL.back ? EL.back() : (location.href = '../english/index.html'); };
  $('#mqSay').onclick = () => { if (state.cur) speakEn(state.cur.w[0]); };
  $('#againBtn').onclick = startGame;
  $('#homeBtn').onclick = () => { EL.back ? EL.back() : (location.href = '../english/index.html'); };
  // 키보드 1~9: 구멍 번호 (왼쪽 위부터)
  document.addEventListener('keydown', e => {
    if ($('#mole').classList.contains('hidden') || GuideBook.isOpen()) return;
    const k = +e.key;
    if (k >= 1 && k <= 9 && mg.holes[k - 1]) { e.preventDefault(); whack(mg.holes[k - 1]); }
  });

  // 영어 놀이 메뉴 팝업에서 고른 이름 · 학년 · 난이도로 바로 시작해요
  if (EL.on) startGame(); else show('#intro');
})();
