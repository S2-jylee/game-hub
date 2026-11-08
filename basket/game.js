// 🧺 단어 바구니: 구구단 놀이터의 정답 바구니를 영어 단어로 바꿨어요.
// 게임 부분은 multiplication/index.html 과 같은 코드예요 (문제·채점·글자 그리기만 영어로).
(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable, ignore */ } }
  };
  const GRADES = window.SPELL_GRADES;
  const KIND = "basket";                 // penguin | basket
  const PROFILES_KEY = KIND + "_profiles", GUIDE_ID = KIND;
  const LIVES = 3, CATCH_LIVES = 5;
  const RUN_STAGES = 5, PER_STAGE = 6;    // 스테이지 5개 × 단어 6개
  const STAGE_TIME = [6, 5.3, 4.7, 4.2, 3.8]; // 스테이지별 허들이 다가오는 시간(초) (영어 단어는 읽을 시간이 더 필요해요)
  const COLORS = ['#ff7eb6', '#ffbe0b', '#60a5fa', '#34d399', '#a78bfa', '#ff9f43'];
  const PRAISE = ['딩동댕! 🔔', '잘했어! 🎉', '최고야! 👍', '우와, 천재다! 🌟', '멋져요! 💖', '정답이야! 🍭'];
  const BATCHIM = { 0: true, 1: true, 2: false, 3: true, 4: false, 5: false, 6: true, 7: true, 8: true, 9: false };
  const eun = n => BATCHIM[n % 10] ? '은' : '는';
  const eul = n => BATCHIM[n % 10] ? '을' : '를';
  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const cap = w => w.charAt(0).toUpperCase() + w.slice(1);

  const state = {
    sound: store.get('eng_sound', true), buddy: '🐰', mode: KIND,
    user: null, guest: false, guestData: null,
    qs: [], i: 0, total: 0, score: 0, lives: LIVES, combo: 0, correct: 0, wrong: [], missedThis: false, cur: null
  };
  let grade = GRADES[0];
  const EL = window.EngLink || { on: false }, LINK = EL.on;   // 영어 놀이 메뉴 팝업에서 열렸어요

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
    pop() { tone(880, 0.07, 'square', 0, 0.05); },
    win() { [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', i * 0.13)); }
  };
  function say(text, lang) {
    if (GuideBook.defer(() => say(text, lang))) return;   // 방법 팝업이 닫히면 읽어줘요
    if (!state.sound || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang; u.rate = lang === 'en-US' ? 0.8 : 0.95; u.pitch = 1.2;
      speechSynthesis.speak(u);
    } catch (e) { /* speech unavailable, ignore */ }
  }
  const speak = text => say(text, 'ko-KR');
  const speakEn = text => say(text, 'en-US');

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
  function confetti(n = 40) {
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

  /* ---------- 화면 ---------- */
  const SCREENS = ['#intro', '#user', '#grade', '#run', '#catch', '#result'];
  function show(id) {
    SCREENS.forEach(s => { const el = $(s); if (el) el.classList.toggle('hidden', s !== id); });
    $('.app').classList.toggle('wide', id === '#catch');
  }

  /* ---------- 사용자 (이 기기에만 저장, 게스트는 저장 안 함) ---------- */
  const emptyData = () => ({ best: {} });
  const loadProfiles = () => store.get(PROFILES_KEY, {});
  function userData() { return state.guest ? state.guestData : (loadProfiles()[state.user] || emptyData()); }
  function saveUserData(d) {
    if (state.guest) { state.guestData = d; return; }
    const p = loadProfiles(); p[state.user] = d; store.set(PROFILES_KEY, p);
  }
  function enterAs(name) {
    state.guest = !name; state.user = name;
    if (state.guest) state.guestData = emptyData();
    else if (!loadProfiles()[name]) saveUserData(emptyData());
    $('#userBadge').textContent = '👤 ' + (name || '게스트');
    renderGrades(); show('#grade');
  }
  function renderUserList() {
    const l = $('#userList'); l.innerHTML = '';
    const names = Object.keys(loadProfiles());
    if (!names.length) { l.innerHTML = '<div class="user-empty-hint">저장된 사용자가 없어요. 새 이름으로 시작해보세요!</div>'; return; }
    names.forEach(name => {
      const b = document.createElement('button');
      b.className = 'user-item-btn'; b.textContent = '👤 ' + name;
      b.onclick = () => enterAs(name);
      l.appendChild(b);
    });
  }
  function submitNewUser() {
    const name = $('#userNameInput').value.trim();
    if (!name) { $('#userNameInput').focus(); return; }
    enterAs(name);
  }
  $('#introStart').onclick = () => { renderUserList(); $('#userNameInput').value = ''; show('#user'); };
  $('#userNewStart').onclick = submitNewUser;
  $('#userNameInput').addEventListener('keydown', e => { if (e.key === 'Enter') submitNewUser(); });
  $('#userGuest').onclick = () => enterAs(null);
  $('#userBack').onclick = () => show('#intro');
  $('#gradeBack').onclick = () => show('#intro');
  $('#soundBtn').onclick = () => { state.sound = !state.sound; store.set('eng_sound', state.sound); renderSoundBtn(); };
  function renderSoundBtn() { $('#soundBtn').textContent = state.sound ? '🔊 소리 켜짐' : '🔇 소리 꺼짐'; }

  /* ---------- 학년 고르기 ---------- */
  const GR_BG = [['#ecfccb', '#65a30d'], ['#fef9c3', '#ca8a04'], ['#ffedd5', '#ea580c'], ['#e1efff', '#2563eb'], ['#f3e8ff', '#9333ea'], ['#ffe4e6', '#e11d48']];
  function renderGrades() {
    const g = $('#gradeGrid'); g.innerHTML = '';
    const best = userData().best || {};
    GRADES.forEach((gr, i) => {
      const b = document.createElement('button');
      b.className = 'arcade-game';
      b.style.setProperty('--mbg', GR_BG[i][0]); b.style.setProperty('--mc', GR_BG[i][1]);
      b.innerHTML = `<span class="m-emoji">${gr.emoji}</span><span class="m-name">${gr.grade}학년</span><small>${gr.desc}</small>` +
        (best['g' + gr.grade] ? `<span class="best">🏆 최고 ${best['g' + gr.grade]}점</span>` : '') + '<span class="m-go">시작 ▶</span>';
      b.onclick = () => { grade = gr; choose(); };
      g.appendChild(b);
    });
  }
  // 게임 화면을 먼저 열고, 그 위에 방법 팝업을 띄워요 (구구단 놀이터의 펭귄 달리기처럼)
  function choose() { startGame(); }
  $('#guideBtn').onclick = () => GuideBook.open(GUIDE(null));

  // 같은 학년 단어를 섞어서 n개 (모자라면 다시 섞어서 이어 붙여요)
  function wordQueue(n) {
    let qs = [];
    while (qs.length < n) {
      const next = shuffle(picWords(grade.words));
      if (qs.length && next[0][0] === qs[qs.length - 1][0]) next.push(next.shift());
      qs = qs.concat(next);
    }
    return qs.slice(0, n);
  }
  function renderHearts(justLost) {
    const h = $(KIND === 'penguin' ? '#runHearts' : '#catchHearts');
    h.className = 'hearts';
    let html = '';
    const lostAt = Math.floor(state.lives);
    const max = KIND === 'basket' ? CATCH_LIVES : LIVES;
    for (let k = 0; k < max; k++) {
      if (state.lives >= k + 1) html += '<span>❤️</span>';
      else if (state.lives >= k + 0.5) html += `<span class="half${justLost ? ' halfpop' : ''}">🤍</span>`;
      else html += `<span class="${justLost && k === lostAt ? 'lost' : ''}" style="opacity:.5">🤍</span>`;
    }
    h.innerHTML = html;
  }
  function bumpScore(gain) {
    state.score += gain;
    const el = $(KIND === 'penguin' ? '#runScore' : '#catchScore');
    el.textContent = state.score;
    animate(el.parentNode, 'bump');
  }

  /* ---------- 정답 바구니: 하늘에서 떨어지는 정답 열매를 바구니로 받아요 ---------- */
  // 정답 열매 = 점수 + 콤보, 틀린 열매·폭탄 = 하트 -1, 하트 = 하트 +1, 보석 = +50점(랭킹용)
  const GEM_POINTS = 50;
  const FADE = 0.35;        // 하트를 다 써서 끝날 때 남은 것들이 사라지는 시간(초)
  const RANK_KEY = 'basket_rank';
  const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  const ITEM_EMOJI = { bomb: '💣', heart: '❤️', gem: '💎' };
  const catchCanvas = $('#catchCanvas');
  const cctx = catchCanvas.getContext('2d');
  const cg = {
    W: 0, H: 0, raf: 0, last: 0, t: 0, active: false,
    px: 0.5, lean: 0, target: null, keys: { l: false, r: false },
    items: [], spawnT: 0, sinceAns: 0, heartT: 0, gemT: 0, gems: 0,
    waitT: 0, overT: 0, hurtT: 0, happyT: 0, shakeT: 0, flashT: 0, banner: null, basket: []
  };

  function resizeCatch() {
    const r = $('#catchField').getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    cg.W = r.width; cg.H = r.height;
    catchCanvas.width = Math.round(r.width * dpr); catchCanvas.height = Math.round(r.height * dpr);
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', () => { if (cg.active) resizeCatch(); });

  // 화면 크기에 맞춘 바구니·열매 크기
  function cgeo() {
    const { W, H } = cg;
    const gh = Math.max(20, H * 0.06);
    const cs = Math.max(40, Math.min(H * 0.13, W * 0.08, 70));
    const baseY = H - gh * 0.45;
    return { W, H, gh, cs, baseY, basketY: baseY - cs * 0.42, bw: cs * 0.62, ir: Math.max(17, Math.min(26, Math.min(W, H) * 0.04)) };
  }
  // 속도는 6단계: 정답 10개마다 한 단계씩 빨라지고, 6단계부터는 하트가 다 없어질 때까지 그대로예요
  const SPEED_STEPS = 6, PER_SPEED = 10;
  const speedStep = () => Math.min(SPEED_STEPS - 1, Math.floor(state.correct / PER_SPEED));   // 0 ~ 5
  const catchLevel = () => speedStep() * 6;   // 아래 속도 식에 쓰는 값 (0 ~ 30)
  function showSpeedUp() {
    const step = speedStep() + 1;
    cg.speedUp = { t: 1.5, step };
    [660, 880, 1175].forEach((fq, i) => tone(fq, 0.14, 'triangle', i * 0.08, 0.1));
  }

  function startCatch() {
    renderHearts();
    show('#catch');
    resizeCatch();
    Object.assign(cg, {
      active: true, t: 0, px: 0.5, lean: 0, target: null, items: [], spawnT: 0.6, sinceAns: 1,
      heartT: 25 + Math.random() * 10, gemT: 9 + Math.random() * 6, gems: 0,
      waitT: 0, overT: 0, hurtT: 0, happyT: 0, shakeT: 0, flashT: 0, basket: [],
      banner: { text: '준비~ 시작! 🧺', t: 1.8 }, speedUp: null
    });
    cg.keys.l = cg.keys.r = false;
    $('#catchGems').textContent = '0';
    $('#catchMsg').textContent = '바구니를 움직여서 정답 열매만 쏙! 💣 폭탄은 피해요';
    setCatchQuestion();
    cg.last = performance.now();
    cancelAnimationFrame(cg.raf);
    cg.raf = requestAnimationFrame(catchFrame);
    // 방법 팝업을 띄워요. 확인을 누를 때까지 멈춰 있어요 (구구단 놀이터의 펭귄 달리기처럼)
    GuideBook.intro(GUIDE(null), () => $('#catchQuit').onclick());
  }
  function stopCatch() {
    GuideBook.close(false);
    cg.active = false;
    cancelAnimationFrame(cg.raf);
  }

  // 영어 단어를 보여주고, 그 뜻의 그림 열매를 받아요
  function setCatchQuestion() {
    const w = state.qs[state.i % state.qs.length];
    state.cur = { w, ans: w[1], wrongs: shuffle(picWords(grade.words).filter(o => o[1] !== w[1])).slice(0, 6).map(o => o[1]) };
    state.missedThis = false;
    $('#cqWord').textContent = cap(w[0]);
    resetAns($('#cqans'));
    speakEn(w[0]);
  }

  // 다른 열매와 겹치지 않는 가로 위치
  function freeX(g) {
    const m = (g.ir + 6) / g.W;
    let x = 0.5;
    for (let k = 0; k < 6; k++) {
      x = m + Math.random() * (1 - 2 * m);
      if (!cg.items.some(it => it.y < g.ir * 3 && Math.abs(it.x - x) * g.W < g.ir * 2.4)) break;
    }
    return x;
  }

  function addItem(kind, g, v, speedMul = 1) {
    const lv = catchLevel();
    // 처음엔 화면을 9초쯤 걸려 내려오고, 정답 30개쯤이면 3.5초쯤으로 빨라져요
    const fall = g.H * (0.11 + lv * 0.006) * (0.9 + Math.random() * 0.25) * speedMul * (LINK ? EL.by({ easy: 0.75, normal: 1, hard: 1.3 }) : 1);
    cg.items.push({
      kind, v, x: freeX(g), y: -g.ir, r: g.ir * (kind === 'num' ? 1.2 : 0.9), vy: fall,
      ph: Math.random() * 6, color: pick(COLORS), done: false, fade: null, wob: kind === 'gem' ? 0.06 : 0
    });
  }

  function spawnCatch(g) {
    if (cg.waitT > 0 || cg.overT > 0) { cg.spawnT = 0.2; return; }
    const lv = catchLevel();
    cg.spawnT = Math.max(0.7, 1.4 - lv * 0.023) * (0.85 + Math.random() * 0.3);
    if (Math.random() < Math.min(0.2, 0.08 + lv * 0.004)) { addItem('bomb', g); return; }
    const { ans, wrongs } = state.cur;
    const onScreen = cg.items.filter(it => it.kind === 'num' && !it.done && it.v === ans).length;
    // 정답은 너무 오래 안 나오지 않게, 한 번에 너무 많지도 않게
    if (cg.sinceAns >= 3 || (onScreen < 2 && Math.random() < 0.32)) {
      addItem('num', g, ans);
      cg.sinceAns = 0;
    } else {
      addItem('num', g, pick(wrongs));
      cg.sinceAns++;
    }
  }

  function screenPos(x, y) {
    const r = catchCanvas.getBoundingClientRect();
    return [r.left + x, r.top + y];
  }

  function catchItem(it, g) {
    it.done = true;
    const [sx, sy] = screenPos(it.x * g.W, g.basketY - g.ir);
    const { ans, w } = state.cur;
    if (it.kind === 'num' && it.v === ans) {
      // 정답!
      state.correct++; state.combo++;
      const gain = 10 + Math.min(state.combo - 1, 10) * 2;
      bumpScore(gain);
      sfx.pop(); sfx.correct();
      burstAt(sx, sy); floatAt(sx, sy - 20, '+' + gain);
      fitAns($('#cqans'), ans, 'q-mark ok');
      cg.happyT = 0.4;
      cg.basket.push(it.color); if (cg.basket.length > 5) cg.basket.shift();
      $('#catchMsg').textContent = pick(PRAISE) + (state.combo >= 2 ? `  🔥 ${state.combo}콤보!` : '');
      if (state.combo % 5 === 0) cg.banner = { text: `🔥 ${state.combo}콤보! 보너스 점수 UP`, t: 1.8 };
      // 정답 10개마다 한 단계씩 빨라져요 (6단계까지)
      if (state.correct % PER_SPEED === 0 && state.correct / PER_SPEED < SPEED_STEPS) showSpeedUp();
      $('#catchMsg').textContent = `${cap(w[0])} = ${ans} ${w[2]} 정답! ` + pick(PRAISE) + (state.combo >= 2 ? `  🔥 ${state.combo}콤보!` : '');
      // 화면은 멈추지 않아요: 이미 떨어지고 있던 열매도 그대로 받을 수 있고(새 문제로 채점해요),
      // 다음 문제의 열매가 바로 이어서 떨어져요
      state.i++;
      setCatchQuestion();
      cg.sinceAns = 2;
      cg.spawnT = Math.min(cg.spawnT, 0.35);
      return;
    }
    if (it.kind === 'heart') {
      state.lives = Math.min(CATCH_LIVES, state.lives + 1);
      renderHearts();
      sfx.correct();
      floatAt(sx, sy, '❤️ +1');
      $('#catchMsg').textContent = '❤️ 하트 한 개가 채워졌어요!';
      return;
    }
    if (it.kind === 'gem') {
      cg.gems++;
      $('#catchGems').textContent = cg.gems;
      animate($('#catchGemBox'), 'bump');
      bumpScore(GEM_POINTS);
      [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.15, 'triangle', i * 0.06, 0.1));
      burstAt(sx, sy); floatAt(sx, sy - 20, `💎 +${GEM_POINTS}`);
      $('#catchMsg').textContent = `💎 반짝반짝 보석! +${GEM_POINTS}점`;
      return;
    }
    // 틀린 열매 또는 폭탄: 하트 -1
    state.combo = 0;
    state.lives = Math.max(0, state.lives - 1);
    renderHearts(true);
    cg.hurtT = 0.6; cg.flashT = 0.35;
    if (it.kind === 'bomb') {
      cg.shakeT = 0.4;
      tone(110, 0.35, 'sawtooth', 0, 0.12); tone(70, 0.4, 'square', 0.05, 0.08);
      floatAt(sx, sy, '💥 펑!');
      $('#catchMsg').textContent = '펑! 💣 폭탄은 피해야 해요!';
    } else {
      sfx.wrong();
      floatAt(sx, sy, '❌ ' + it.v);
      if (!state.missedThis) state.wrong.push(w);
      state.missedThis = true;
      $('#catchMsg').textContent = `앗! 그건 ${koOf(it.v)}예요. ${cap(w[0])} 는 어떤 그림일까요?`;
    }
    if (state.lives <= 0) {
      cg.overT = 1.2;
      cg.banner = { text: '하트를 다 썼어요! 💪', t: 1.8 };
      cg.items.forEach(o => { if (!o.done) { o.done = true; o.fade = FADE; } });
    }
  }

  // 모바일(좁은 화면 · 가로로 눕힌 폰): 이동 속도를 절반 아래로 줄여요
  const MOBILE = window.matchMedia('(max-width: 560px), (pointer: coarse) and (max-height: 500px)');
  const MOBILE_SPEED = 0.45;
  function catchFrame(now) {
    if (!cg.active) return;
    const dt = GuideBook.isOpen() ? 0 : Math.min(0.05, (now - cg.last) / 1000);
    cg.last = now; cg.t += dt;
    const g = cgeo();

    // 바구니 움직이기 (방향키는 그 방향으로, 마우스·손가락은 그 자리로 따라가요)
    // 화면 넓이와 상관없이 1초에 320px쯤 움직여요 (정답을 받을수록 조금씩 빨라져요)
    const spd = (320 + catchLevel() * 5) / g.W * (MOBILE.matches ? MOBILE_SPEED : 1);
    const lo = g.bw / g.W, hi = 1 - lo;
    let dir = (cg.keys.r ? 1 : 0) - (cg.keys.l ? 1 : 0);
    if (cg.overT > 0) dir = 0;
    else if (dir) cg.target = null;
    else if (cg.target != null) {
      const d = Math.max(lo, Math.min(hi, cg.target)) - cg.px;
      dir = Math.max(-1, Math.min(1, d * 12));
      if (Math.abs(d) < 0.003) dir = 0;
    }
    cg.px = Math.max(lo, Math.min(hi, cg.px + dir * spd * dt));
    cg.lean += (dir * 0.18 - cg.lean) * Math.min(1, dt * 10);

    if (cg.overT > 0) {
      if ((cg.overT -= dt) <= 0) { finish(); return; }
    } else {
      if (cg.waitT > 0 && (cg.waitT -= dt) <= 0) { state.i++; setCatchQuestion(); cg.sinceAns = 2; cg.spawnT = Math.min(cg.spawnT, 0.3); }
      if ((cg.spawnT -= dt) <= 0) spawnCatch(g);
      if ((cg.gemT -= dt) <= 0) { addItem('gem', g, 0, 1.35); cg.gemT = 12 + Math.random() * 10; }
      // 하트는 가끔, 하트가 줄어 있을 때만 떨어져요
      if ((cg.heartT -= dt) <= 0) {
        if (state.lives < CATCH_LIVES) { addItem('heart', g); cg.heartT = 22 + Math.random() * 14; }
        else cg.heartT = 4;
      }
    }

    const bx = cg.px * g.W;
    cg.items.forEach(it => {
      it.y += it.vy * dt;
      if (it.wob) it.x = Math.max(0.05, Math.min(0.95, it.x + Math.sin(cg.t * 3 + it.ph) * it.wob * dt));
      if (it.fade != null) { it.fade -= dt; return; }
      if (it.done || cg.overT > 0) return;
      // 바구니 입구에 닿으면 받아요
      if (it.y + it.r * 0.4 >= g.basketY && it.y - it.r * 0.4 <= g.basketY + g.cs * 0.25 &&
          Math.abs(it.x * g.W - bx) <= g.bw + it.r * 0.3) catchItem(it, g);
    });
    cg.items = cg.items.filter(it => !(it.done && it.fade == null) && !(it.fade != null && it.fade <= 0) && it.y - it.r < g.H);
    cg.hurtT = Math.max(0, cg.hurtT - dt);
    cg.happyT = Math.max(0, cg.happyT - dt);
    cg.shakeT = Math.max(0, cg.shakeT - dt);
    cg.flashT = Math.max(0, cg.flashT - dt);
    if (cg.banner && (cg.banner.t -= dt) <= 0) cg.banner = null;
    if (cg.speedUp && (cg.speedUp.t -= dt) <= 0) cg.speedUp = null;

    drawCatch(g);
    cg.raf = requestAnimationFrame(catchFrame);
  }

  /* ---------- 정답 바구니 그리기 ---------- */
  function drawCatch(g) {
    const c = cctx, { W, H } = g;
    c.save();
    c.clearRect(0, 0, W, H);
    if (cg.shakeT > 0) c.translate((Math.random() - 0.5) * 14 * cg.shakeT / 0.4, (Math.random() - 0.5) * 10 * cg.shakeT / 0.4);

    // 하늘과 구름
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#a5dcff'); sky.addColorStop(1, '#eef9ff');
    c.fillStyle = sky; c.fillRect(-10, -10, W + 20, H + 20);
    c.fillStyle = 'rgba(255,255,255,.9)';
    [[0.18, 0.16, 1], [0.62, 0.1, 0.8], [0.9, 0.3, 0.7]].forEach(([fx, fy, s], k) => {
      const x = ((fx * W + cg.t * (12 + k * 6)) % (W + 160)) - 80, y = fy * H, r = 22 * s;
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.arc(x + r * 1.1, y - r * 0.4, r * 1.2, 0, Math.PI * 2); c.arc(x + r * 2.3, y, r, 0, Math.PI * 2); c.fill();
    });

    // 풀밭
    c.fillStyle = '#9be36d'; c.fillRect(-10, H - g.gh, W + 20, g.gh + 10);
    c.fillStyle = '#6fcf45';
    for (let x = -10; x < W + 20; x += 18) { c.beginPath(); c.moveTo(x, H - g.gh); c.lineTo(x + 9, H - g.gh - 8); c.lineTo(x + 18, H - g.gh); c.fill(); }

    // 떨어지는 것들
    cg.items.forEach(it => {
      const x = it.x * W, y = it.y;
      c.save(); c.translate(x, y);
      if (it.fade != null) { const k = Math.max(0, it.fade / FADE); c.globalAlpha = k; c.scale(1 + (1 - k) * 0.6, 1 + (1 - k) * 0.6); }      if (it.kind === 'num') drawFruit(c, it);
      else drawEmojiItem(c, it);
      c.restore();
    });

    drawCatcher(g);

    // 다쳤을 때 빨갛게 번쩍
    if (cg.flashT > 0) { c.fillStyle = `rgba(255,93,115,${0.28 * cg.flashT / 0.35})`; c.fillRect(-10, -10, W + 20, H + 20); }
    if (cg.banner) drawCatchBanner(c, g, cg.banner);
    drawSpeedBadge(c, g);
    if (cg.speedUp) drawSpeedUp(c, g, cg.speedUp);
    c.restore();
  }

  // 왼쪽 위 지금 속도 단계
  function drawSpeedBadge(c, g) {
    const step = speedStep() + 1, fs = Math.max(13, Math.min(18, g.W * 0.03));
    const text = `🚀 속도 ${step} / ${SPEED_STEPS}`;
    c.save();
    c.font = `800 ${fs}px Pretendard, sans-serif`;
    const w = c.measureText(text).width + fs * 1.4, h = fs * 2;
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.beginPath(); if (c.roundRect) c.roundRect(10, 10, w, h, h / 2); else c.rect(10, 10, w, h); c.fill();
    c.fillStyle = step >= SPEED_STEPS ? '#e8590c' : '#3b2d5c';
    c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(text, 10 + fs * 0.7, 10 + h / 2 + 1);
    c.restore();
  }

  // 화면 가운데 "스피드 업!" (톡 커졌다가 사라져요)
  function drawSpeedUp(c, g, su) {
    const life = 1.5, k = 1 - su.t / life;
    const pop = k < 0.15 ? 0.6 + k / 0.15 * 0.55 : k < 0.25 ? 1.15 - (k - 0.15) / 0.1 * 0.15 : 1;
    const alpha = su.t < 0.35 ? su.t / 0.35 : 1;
    const fs = Math.max(30, Math.min(64, g.W * 0.09));
    c.save();
    c.globalAlpha = alpha;
    c.translate(g.W / 2, g.H * 0.42);
    c.scale(pop, pop);
    c.rotate(-0.05);
    c.font = `${fs}px CookieRun, Jua, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = fs * 0.22; c.strokeStyle = '#ffffff';
    c.strokeText('스피드 업! 🚀', 0, 0);
    c.fillStyle = '#ff5d73';
    c.fillText('스피드 업! 🚀', 0, 0);
    const sub = su.step >= SPEED_STEPS ? '최고 속도! 끝까지 버텨요 🔥' : `속도 ${su.step}단계`;
    c.font = `800 ${fs * 0.42}px Pretendard, sans-serif`;
    c.lineWidth = fs * 0.12; c.strokeText(sub, 0, fs * 0.85);
    c.fillStyle = '#3b2d5c'; c.fillText(sub, 0, fs * 0.85);
    c.restore();
  }

  // 숫자 열매: 동그란 과일 + 꼭지 + 잎 + 숫자
  function drawFruit(c, it) {
    const r = it.r, rot = Math.sin(cg.t * 2.2 + it.ph) * 0.15;
    c.rotate(rot);
    c.fillStyle = 'rgba(0,0,0,.1)';
    c.beginPath(); c.arc(r * 0.08, r * 0.1, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = it.color;
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.beginPath(); c.ellipse(-r * 0.42, -r * 0.45, r * 0.24, r * 0.14, -0.7, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#7a4520'; c.lineWidth = Math.max(2, r * 0.1); c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -r * 0.88); c.quadraticCurveTo(r * 0.04, -r * 1.12, r * 0.14, -r * 1.24); c.stroke();
    c.fillStyle = '#34d399';
    c.beginPath(); c.ellipse(r * 0.36, -r * 1.08, r * 0.28, r * 0.13, -0.5, 0, Math.PI * 2); c.fill();
    c.rotate(-rot);
    // 그림 열매: 하얀 동그라미 위에 그림
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.beginPath(); c.arc(0, 0, r * 0.78, 0, Math.PI * 2); c.fill();
    c.font = `${r * 1.1}px ${EMOJI_FONT}`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#000'; c.fillText(it.v, 0, r * 0.08);
  }

  // 폭탄·하트·보석 (보석과 하트는 반짝반짝 빛나요)
  function drawEmojiItem(c, it) {
    const r = it.r;
    c.rotate(Math.sin(cg.t * 3 + it.ph) * (it.kind === 'bomb' ? 0.25 : 0.12));
    if (it.kind !== 'bomb') {
      const glow = c.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.7);
      glow.addColorStop(0, it.kind === 'gem' ? 'rgba(125,211,252,.75)' : 'rgba(255,126,182,.6)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = glow;
      c.beginPath(); c.arc(0, 0, r * 1.7, 0, Math.PI * 2); c.fill();
    }
    c.font = `${r * 1.9}px ${EMOJI_FONT}`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#000';
    c.fillText(ITEM_EMOJI[it.kind], 0, r * 0.1);
    if (it.kind === 'bomb') {
      // 심지 불꽃
      c.fillStyle = Math.sin(cg.t * 30) > 0 ? '#ffd23f' : '#ff9f43';
      c.beginPath(); c.arc(r * 0.62, -r * 0.78, r * 0.16, 0, Math.PI * 2); c.fill();
    } else if (it.kind === 'gem' && Math.sin(cg.t * 6 + it.ph) > 0.3) {
      c.font = `${r * 0.8}px ${EMOJI_FONT}`;
      c.fillText('✨', r * 0.8, -r * 0.7);
    }
  }

  // 친구 + 바구니 (바구니 입구 가운데가 기준)
  function drawCatcher(g) {
    const c = cctx, { cs, bw, basketY, baseY } = g;
    const x = cg.px * g.W;
    const hop = cg.happyT > 0 ? Math.sin(Math.PI * (1 - cg.happyT / 0.4)) * cs * 0.16 : 0;
    const shake = cg.hurtT > 0 ? Math.sin(cg.t * 60) * cs * 0.05 : 0;
    const h = baseY - basketY;
    // 그림자
    c.fillStyle = 'rgba(59,45,92,.18)';
    c.beginPath(); c.ellipse(x, baseY + 2, bw * (1 - hop / cs), cs * 0.07, 0, 0, Math.PI * 2); c.fill();
    c.save();
    c.translate(x + shake, basketY - hop);
    c.rotate(cg.lean);
    // 친구 (바구니 뒤에서 머리를 쏙)
    c.font = `${cs * 1.05}px ${EMOJI_FONT}`;
    c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.fillStyle = '#000';   // 이모지는 fillStyle의 투명도를 따라가서, 불투명한 색으로 바꿔 둬요
    // 하얀 친구도 밝은 하늘에서 잘 보이게 그림자를 둘러요
    c.save();
    c.shadowColor = 'rgba(59,45,92,.45)'; c.shadowBlur = cs * 0.08;
    c.fillText(state.buddy, 0, cs * 0.22);
    c.restore();
    if (cg.hurtT > 0) { c.font = `${cs * 0.35}px ${EMOJI_FONT}`; c.fillText('💫', 0, -cs * 0.8); }
    // 바구니에 담긴 열매
    cg.basket.forEach((col, k) => {
      const fx = (k - (cg.basket.length - 1) / 2) * bw * 0.36;
      c.fillStyle = col;
      c.beginPath(); c.arc(fx, -cs * 0.02, cs * 0.14, 0, Math.PI * 2); c.fill();
    });
    // 바구니 몸통
    c.fillStyle = '#c98a4b';
    c.beginPath(); c.moveTo(-bw, 0); c.lineTo(bw, 0); c.lineTo(bw * 0.78, h); c.lineTo(-bw * 0.78, h); c.closePath(); c.fill();
    c.save();
    c.clip();
    c.strokeStyle = 'rgba(122,69,32,.55)'; c.lineWidth = Math.max(1.5, cs * 0.025);
    for (let k = 1; k <= 2; k++) { c.beginPath(); c.moveTo(-bw, h * k / 3); c.lineTo(bw, h * k / 3); c.stroke(); }
    for (let k = -4; k <= 4; k++) { c.beginPath(); c.moveTo(k * bw * 0.25, 0); c.lineTo(k * bw * 0.2, h); c.stroke(); }
    c.restore();
    // 바구니 테두리
    c.fillStyle = '#a0622d';
    roundRectOn(c, -bw - 4, -cs * 0.06, bw * 2 + 8, cs * 0.12, cs * 0.06); c.fill();
    c.restore();
  }

  function roundRectOn(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  function drawCatchBanner(c, g, bn) {
    const fs = Math.min(g.W * 0.07, 34);
    c.save();
    c.globalAlpha = Math.min(1, bn.t / 0.3, (1.8 - bn.t) / 0.2 + 0.2);
    c.font = `${fs}px CookieRun, Jua, sans-serif`;
    const w = c.measureText(bn.text).width + fs * 1.4, h = fs * 1.9;
    const x = g.W / 2 - w / 2, y = g.H * 0.3;
    roundRectOn(c, x, y, w, h, h / 2);
    c.fillStyle = '#ffffff'; c.fill();
    c.lineWidth = 4; c.strokeStyle = '#ff9f43'; c.stroke();
    c.fillStyle = '#3b2d5c'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(bn.text, g.W / 2, y + h / 2 + fs * 0.05);
    c.restore();
  }

  /* ---------- 정답 바구니 랭킹 (이 기기에 저장, 게스트는 빼요) ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  function catchRankHtml() {
    let list = store.get(RANK_KEY, []);
    let mine = null;
    if (!state.guest && state.score > 0) {
      mine = { name: state.user, score: state.score, gems: cg.gems, at: Date.now() };
      list.push(mine);
      list.sort((a, b) => b.score - a.score || a.at - b.at);
      list = list.slice(0, 10);
      store.set(RANK_KEY, list);
    }
    if (!list.length) return '';
    const medal = ['🥇', '🥈', '🥉'];
    const myIdx = mine ? list.findIndex(e => e.at === mine.at) : -1;
    const row = (e, i) => `<li class="${i === myIdx ? 'me' : ''}"><span class="no">${medal[i] || i + 1}</span>` +
      `<span class="nm">${esc(e.name)}</span><span class="gm">💎${e.gems}</span><span class="sc">${e.score}점</span></li>`;
    let html = list.slice(0, 5).map(row).join('');
    if (myIdx >= 5) html += row(list[myIdx], myIdx);
    const note = state.guest ? '게스트 점수는 랭킹에 올라가지 않아요. 이름으로 시작해 보세요!'
      : mine && myIdx < 0 ? '아쉽게 10위 안에 못 들었어요. 💎 보석을 모으면 점수가 쑥쑥!' : '💎 보석을 많이 받을수록 순위가 올라가요!';
    return `<div class="rank"><div class="label" style="text-align:center">🏆 단어 바구니 랭킹</div><ol>${html}</ol><div class="rank-note">${note}</div></div>`;
  }

  // 마우스: 화면 위에서 움직이면 바구니가 따라가요 / 손가락: 누른 채 밀면 따라가요
  const cfield = $('#catchField');
  function caim(e) {
    const r = cfield.getBoundingClientRect();
    cg.target = (e.clientX - r.left) / r.width;
  }
  cfield.addEventListener('pointerdown', e => {
    cfield.setPointerCapture(e.pointerId);
    caim(e);
  });
  cfield.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' || cfield.hasPointerCapture(e.pointerId)) caim(e);
  });
  // ◀ ▶ 버튼 (모바일에서만 보여요): 누르고 있는 동안 그쪽으로 가요
  [['#cpadL', 'l'], ['#cpadR', 'r']].forEach(([sel, k]) => {
    const pad = $(sel);
    pad.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      if (!cg.active) return;
      cg.keys[k] = true;
      try { pad.setPointerCapture(e.pointerId); } catch (err) { /* 이미 끝난 터치 */ }
      pad.classList.add('on');
    });
    const up = () => { cg.keys[k] = false; pad.classList.remove('on'); };
    pad.addEventListener('pointerup', up);
    pad.addEventListener('pointercancel', up);
    pad.addEventListener('lostpointercapture', up);
  });
  document.addEventListener('keydown', e => {
    if (!cg.active || !RUN_KEYS[e.key]) return;
    cg.keys[RUN_KEYS[e.key]] = true; e.preventDefault();
  });
  document.addEventListener('keyup', e => {
    if (RUN_KEYS[e.key]) cg.keys[RUN_KEYS[e.key]] = false;
  });


  const RUN_KEYS = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r' };
  window.addEventListener('blur', () => { cg.keys.l = cg.keys.r = false; });
  // 그림 → 뜻 (지금 학년 단어에서 찾아요. 같은 그림이 다른 학년에도 있을 수 있어서)
  const koOf = e => { const f = grade.words.find(w => w[1] === e); return e + ' ' + (f ? f[2] : ''); };
  function GUIDE(onStart) {
    return {
      id: GUIDE_ID, title: '단어 바구니',
      pages: [
        { icon: '🧺', title: '그림 열매를 받아요', text: '위에 <b>영어 단어</b>가 나와요. 🔊 소리로도 들려줘요.<br>그 뜻의 <b>그림 열매</b>를 바구니로 받아요!' },
        { icon: '⬅️➡️', title: '바구니 움직이기', text: '<b>← →</b> 방향키로 움직여요.<br>마우스나 손가락으로 <b>끌어도</b> 따라와요.' },
        { icon: '💣', title: '조심해요!', text: '틀린 열매나 <b>💣 폭탄</b>을 받으면 ❤️ 하트가 하나 줄어요.<br>❤️ 하트를 받으면 하나 채워져요.' },
        { icon: '💎', title: '보석은 보너스', text: '<b>💎 보석</b>을 받으면 <b>+50점</b>!<br>정답 10개마다 점점 빨라져요. 하트를 다 쓰면 끝!' }
      ],
      startText: '자, 바구니를 들어 볼까?', startLabel: '시작! 🧺', onStart
    };
  }
  function startGame() {
    state.total = 999;
    Object.assign(state, { qs: wordQueue(120), i: 0, score: 0, lives: CATCH_LIVES, combo: 0, correct: 0, wrong: [] });
    $('#catchScore').textContent = '0';
    startCatch();
  }
  function finish() {
    stopCatch();
    const stars = state.correct >= 30 ? 3 : state.correct >= 15 ? 2 : 1;
    showResult(stars, false, `받은 정답 <b>${state.correct}</b>개 · 💎 보석 <b>${cg.gems}</b>개<br>`, '🧺', catchRankHtml);
  }
  $('#catchQuit').onclick = () => { stopCatch(); if ('speechSynthesis' in window) speechSynthesis.cancel(); if (LINK) { EL.back(); return; } renderGrades(); show('#grade'); };
  $('#cqSay').onclick = () => { if (state.cur) speakEn(state.cur.w[0]); };

  /* ---------- 결과 ---------- */
  function showResult(stars, lost, line, emoji, extra) {
    const titles = { 3: '완벽해요! 🏆', 2: '아주 잘했어요! 🎉', 1: '잘했어요! 다음엔 더 잘할 수 있어 💪' };
    $('#resultTitle').textContent = lost ? '하트를 다 썼어요! 다시 도전! 💪' : titles[stars];
    $('#stars').innerHTML = [1, 2, 3].map(k => `<span class="${k <= stars ? '' : 'dim'}" style="animation-delay:${k * 0.25}s">⭐</span>`).join('');
    const data = userData(); data.best = data.best || {};
    const key = 'g' + grade.grade, best = data.best[key] || 0, isRecord = state.score > best;
    if (isRecord) data.best[key] = state.score;
    saveUserData(data);
    $('#resultCard').innerHTML = line +
      `점수 <b>${state.score}</b>점 ${isRecord && state.score > 0 ? '<span class="record">🎊 최고 기록!</span>' : ''}<br>` +
      `<small style="color:var(--muted)">${grade.grade}학년 최고 점수: ${Math.max(best, state.score)}점</small>` + (extra ? extra() : '');
    const rv = $('#review'); rv.innerHTML = '';
    if (state.wrong.length) {
      rv.innerHTML = '<div class="label" style="text-align:center">📝 다시 보면 좋은 단어 (누르면 읽어줘요)</div><div class="chips"></div>';
      state.wrong.forEach(w => {
        const c = document.createElement('button'); c.className = 'chip'; c.textContent = w[1] + ' ' + w[0] + ' ' + w[2];
        c.onclick = () => speakEn(w[0]);
        rv.querySelector('.chips').appendChild(c);
      });
    } else rv.innerHTML = '<div class="label" style="text-align:center">💯 틀린 단어가 하나도 없어요!</div>';
    $('#resultBuddy').textContent = emoji;
    show('#result');
    sfx.win();
    confetti(stars * 15);
  }
  $('#againBtn').onclick = choose;   // 다시 할 때도 방법 팝업부터
  $('#homeBtn').onclick = () => { if (LINK) { EL.back(); return; } renderGrades(); show('#grade'); };
  renderSoundBtn();
  // 영어 놀이 메뉴 팝업에서 고른 사용자 · 학년으로 바로 시작해요
  if (LINK) { $('#homeBtn').textContent = '← 게임 선택'; enterAs(EL.user); grade = GRADES[EL.grade - 1]; choose(); }
})();
