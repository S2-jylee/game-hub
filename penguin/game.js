// 🐧 알파벳 펭귄 달리기: 구구단 놀이터의 펭귄 달리기를 영어 단어로 바꿨어요.
// 게임 부분은 multiplication/index.html 과 같은 코드예요 (문제·채점·글자 그리기만 영어로).
(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable, ignore */ } }
  };
  const GRADES = window.SPELL_GRADES;
  const KIND = "penguin";                 // penguin | basket
  const PROFILES_KEY = KIND + "_profiles", GUIDE_ID = KIND;
  const LIVES = 3, CATCH_LIVES = 5;
  // 한 판 = 단어 20개를 지나 이글루에 도착하면 끝 (구구단 펭귄과 같아요). 끝나면 '한 번 더 / 게임 선택' 팝업
  const RUN_STAGES = 1, PER_STAGE = 20;
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
      const next = shuffle(grade.words.slice());
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

  /* ---------- 펭귄 달리기 ---------- */
  const Z_SPAWN = 60;     // 허들이 처음 나타나는 거리
  const CAM = 18;         // 원근감 (작을수록 강함)
  const LANE_X = [-2 / 3, 0, 2 / 3];
  const canvas = $('#runCanvas');
  const ctx = canvas.getContext('2d');
  const run = {
    W: 0, H: 0, raf: 0, last: 0, active: false, tok: 0,
    dist: 0, speed: 8, px: 0, lean: 0, dir: 0, target: null,
    keys: { l: false, r: false }, gates: [], jumpT: 0, fallT: 0,
    fish: [], fishT: 0, flags: [], flagT: 2, goal: null, gulpT: 0, logs: [], freezeT: 0, energy: 0, hopT: 0
  };
  const FISH_FLY = 1.6;     // 물고기가 옆에서 튀어나와 길 위에 떨어지기까지 걸리는 시간(초)
  const FISH_PER_HALF = 3;  // 물고기 3마리 = 게이지 가득 = 하트 반 개
  const HOP = 0.65;         // 스페이스 / 화면 톡: 점프하는 시간(초)
  const FREEZE = 1.0;       // 통나무를 밟으면 이만큼(초) 꽁꽁 얼어서 못 움직여요

  // 음원 끝 약 5초가 무음이라, 소리가 끝나는 지점에서 곡 처음으로 바로 돌아가요
  // 남극 탐험.mp3: 6.75초부터 1:49.2까지가 배경곡(반복), 1:50.7 ~ 1:56.3 은 이글루 도착 곡이에요
  const BGM_START = 6.75, BGM_END = 109.2;
  const GOAL_START = 110.7, GOAL_END = 116.3;
  const GOAL_APPROACH = 3.4, GOAL_WAVE = 2.6;   // 이글루가 보이기 시작해서 도착 + 손 흔들기 = 6초
  const bgm = new Audio('../multiplication/penguin-bgm.mp3');
  bgm.loop = true; bgm.volume = 0.35;
  function loopBgm() { if (bgm.currentTime >= BGM_END) bgm.currentTime = BGM_START; }
  bgm.addEventListener('timeupdate', loopBgm);
  // 이글루 도착 곡: 같은 음원의 다른 부분이라 따로 하나 더 만들어요
  const goalSong = new Audio(bgm.src);
  goalSong.volume = 0.45;
  goalSong.addEventListener('timeupdate', () => { if (goalSong.currentTime >= GOAL_END) goalSong.pause(); });
  function playGoalSong() {
    bgm.pause(); goalSong.pause();
    if (!state.sound) return;
    try { goalSong.currentTime = GOAL_START; } catch (e) { /* 아직 못 불러왔어요 */ }
    goalSong.play().catch(() => {});
  }
  function resumeBgm() {
    goalSong.pause();
    if (state.sound && run.active) bgm.play().catch(() => {});
  }

  function resizeRun() {
    const r = $('#runField').getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    run.W = r.width; run.H = r.height;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', () => { if (run.active) resizeRun(); });

  // 화면 좌표 계산: x(-1~1 길 폭), z(앞쪽 거리), h(높이)
  function geo() {
    const { W, H } = run;
    return { W, H, cx: W / 2, hy: H * 0.26, gy: H * 0.8, R: Math.min(W * 0.4, H * 0.62) };
  }
  function proj(g, x, z, h = 0) {
    const s = CAM / (CAM + z);
    return { x: g.cx + x * s * g.R, y: g.hy + (g.gy - g.hy) * s - h * s * g.R, s };
  }
  const laneOf = x => x < -1 / 3 ? 0 : x > 1 / 3 ? 2 : 1;

  function startRun() {
    renderHearts();
    show('#run');
    resizeRun();
    Object.assign(run, { active: false, dist: 0, px: 0, lean: 0, dir: 0, target: null, gates: [], jumpT: 0, fallT: 0, stage: 0, banner: null,
      fish: [], fishT: 4, flags: [], flagT: 2, goal: null, gulpT: 0, logs: [], freezeT: 0, energy: 0, hopT: 0 });
    renderEnergy();
    run.keys.l = run.keys.r = false;
    run.tok++;
    cancelAnimationFrame(run.raf);
    $('#runMsg').textContent = '';
    setRunQ(null);
    drawRun(0);
    // 시작하기 전에 방법 팝업을 먼저 보여줘요. 확인을 누르면 출발!
    GuideBook.intro(GUIDE(beginRun), () => $('#runQuit').onclick());
  }
  function beginRun() {
    if (run.active || $('#run').classList.contains('hidden')) return;
    run.active = true;
    loadJump();   // 점프 소리를 미리 불러 둬요
    // 조작 방법 (영어 놀이 설정 창에서 고른 것): 한손 조작이면 ◀ ▶ 를 오른쪽 아래에
    let hand = 'two'; try { hand = localStorage.getItem('penguin_hand') === 'one' ? 'one' : 'two'; } catch (e) { /* 기본: 양손 */ }
    document.body.classList.toggle('hand-one', hand === 'one');
    if (state.sound) { bgm.currentTime = BGM_START; bgm.play().catch(() => {}); }
    $('#runMsg').textContent = '◀ ▶ 로 정답 허들로! 🪵 통나무는 스페이스(화면 톡)로 점프!';
    nextRunQuestion();
    run.last = performance.now();
    run.raf = requestAnimationFrame(runFrame);
  }
  function stopRun() {
    GuideBook.close(false);
    run.active = false; run.tok++;
    cancelAnimationFrame(run.raf);
    bgm.pause(); goalSong.pause();
  }

  function nextRunQuestion() {
    if (state.i >= state.total || state.lives <= 0) return finish();
    const w = state.qs[state.i];
    state.cur = { w, ans: w[0] };
    setRunQ(w);
    $('#runProgress').style.width = (state.i / state.total * 100) + '%';
    // 스테이지가 올라갈수록 허들이 빨리 다가옴
    const stage = Math.floor(state.i / PER_STAGE);
    if (stage !== run.stage || state.i === 0) {
      run.stage = stage;
      run.banner = { text: (LINK && EL.diffName ? EL.diffName + ' ' : '') + '출발! 🐧', t: 1.8 };
      if (stage > 0) $('#runMsg').textContent = '◀ ▶ 로 정답 허들로! 🪵 통나무는 스페이스(화면 톡)로 점프!';
    }
    $('#runProgressText').textContent = `${LINK && EL.diffName ? EL.diffName + '  ·  ' : ''}${state.i + 1} / ${state.total}`;
    run.speed = Z_SPAWN / (STAGE_TIME[stage] * (LINK ? EL.by({ easy: 1.4, normal: 1.15, hard: 0.92 }) : 1));
    run.gates.push({ z: Z_SPAWN, vals: wordChoices(w, 3), ans: w[0], done: false, pick: -1, ok: false });
    run.flags = run.flags.filter(fl => Math.abs(fl.z - Z_SPAWN) > run.speed * 1.0);   // 정답 허들 자리의 깃발은 치워요
    // 이 허들 뒤(다음 허들 전)에 굴러올 통나무를 지금 미리 놓아요 → 허들 너머로 멀리서부터 보여요
    const goalNext = (state.i + 1) % PER_STAGE === 0 || state.i + 1 >= state.total;
    if (!goalNext) { maybeLog(0.9, Z_SPAWN); placeFlags(Z_SPAWN); }
  }

  function judgeGate(gate) {
    gate.done = true;
    const lane = laneOf(run.px);
    const { ans, w } = state.cur;
    gate.pick = lane;
    gate.ok = gate.vals[lane] === ans;
    const qm = $('#rqans'); fitAns(qm, ans);
    const g = geo(), p = proj(g, run.px, 0), r = canvas.getBoundingClientRect();
    const sx = r.left + p.x, sy = r.top + p.y - g.R * 0.25;
    let delay;
    if (gate.ok) {
      state.correct++; state.combo++;
      const gain = 10 + Math.min(state.combo - 1, 5) * 2;
      sfx.pop(); sfx.correct(); speakEn(ans);
      burstAt(sx, sy); floatAt(sx, sy - 30, '+' + gain);
      bumpScore(gain);
      qm.className = 'q-mark ok';
      $('#runMsg').textContent = pick(PRAISE) + (state.combo >= 2 ? `  🔥 ${state.combo}연속!` : '');
      delay = 900;
    } else {
      sfx.wrong();
      state.combo = 0;
      state.wrong.push(w);
      state.lives--;
      renderHearts(true);
      qm.className = 'q-mark reveal';
      run.fallT = 0.9;
      $('#runMsg').textContent = `앗! ${w[1] ? w[1] + ' ' : ''}${w[2]} 은(는) ${ans} 이야!`;
      delay = 1700;
    }
    const tok = run.tok;
    setTimeout(() => {
      if (tok !== run.tok) return;
      state.i++;
      $('#runProgress').style.width = (state.i / state.total * 100) + '%';
      // 스테이지 마지막 문제를 지나면 이글루까지 달려가요
      if (state.lives > 0 && state.i % PER_STAGE === 0) startGoal();
      else nextRunQuestion();
    }, delay);
  }

  /* ---------- 물고기 게이지 ---------- */
  function renderEnergy(full) {
    $('#energyFill').style.width = run.energy + '%';
    if (full) animate($('#runEnergy'), 'full');
  }
  function spawnFish() {
    const zStart = run.speed * FISH_FLY;
    // 허들과 같은 때에 떨어지지 않게 해요
    const clash = run.gates.some(gt => !gt.done && Math.abs(gt.z - zStart) < run.speed * 0.9);
    if (clash) { run.fishT = 0.4; return; }
    const side = Math.random() < 0.5 ? -1 : 1;
    run.fish.push({ z: zStart, z0: zStart, x0: side * 1.35, x1: pick(LANE_X) + (Math.random() - 0.5) * 0.2, done: false, caught: false, hue: pick(['#60a5fa', '#fb923c', '#f472b6']) });
    run.fishT = 5 + Math.random() * 3;   // 5~8초에 한 번
  }

  function fishPos(fs) {
    const p = Math.min(1, Math.max(0, 1 - fs.z / fs.z0));
    return { x: fs.x0 + (fs.x1 - fs.x0) * p, h: Math.sin(Math.PI * p) * 0.55 + 0.18 * p, p };
  }

  function catchFish(fs) {
    fs.caught = true;
    run.gulpT = 0.35;
    const g = geo(), p = proj(g, run.px, 0), r = canvas.getBoundingClientRect();
    const sx = r.left + p.x, sy = r.top + p.y - g.R * 0.35;
    sfx.pop(); tone(990, 0.08, 'triangle', 0.05, 0.12);
    floatAt(sx, sy, '🐟 냠!');
    run.energy = Math.min(100, run.energy + 100 / FISH_PER_HALF + 0.01);
    if (run.energy >= 100) {
      run.energy = 0;
      renderEnergy(true);
      if (state.lives < LIVES) {
        state.lives = Math.min(LIVES, state.lives + 0.5);
        renderHearts();
        $('#runMsg').textContent = '🐟 게이지 가득! ❤️ 하트 반 개가 채워졌어요!';
      } else {
        bumpScore(30);
        $('#runMsg').textContent = '🐟 게이지 가득! 하트가 가득이라 보너스 +30점!';
      }
      sfx.correct();
      burstAt(sx, sy);
    } else {
      renderEnergy();
    }
  }

  /* ---------- 깃발: 달리다가 길 위의 파란 깃발을 먹으면 점수가 올라요 ---------- */
  // 정답 허들이 나올 때 그 허들 뒤(다음 허들 전) 길에 깃발을 1~3개 놓아요
  // 색깔마다 점수가 달라요: 파랑 +3 (자주) · 초록 +5 · 빨강 +10 (가끔)
  const FLAG_KINDS = [
    { color: '#2563eb', pole: '#1e3a8a', pts: 3, w: 0.5 },
    { color: '#16a34a', pole: '#14532d', pts: 5, w: 0.33 },
    { color: '#ef4444', pole: '#7f1d1d', pts: 10, w: 0.17 }
  ];
  function pickFlagKind() {
    let r = Math.random();
    for (const k of FLAG_KINDS) { if ((r -= k.w) < 0) return k; }
    return FLAG_KINDS[0];
  }
  function placeFlags(base) {
    const T = Z_SPAWN / run.speed;
    const tMin = 0.55, tMax = T - 0.25;          // 이번 허들 바로 뒤 ~ 다음 허들 조금 앞
    if (tMax <= tMin) return;
    const n = 1 + Math.floor(Math.random() * 3);   // 1~3개
    const seg = (tMax - tMin) / n;
    for (let k = 0; k < n; k++) {
      const z = base + run.speed * (tMin + seg * (k + 0.2 + Math.random() * 0.6));
      // 통나무와 겹치지 않는 줄에만
      const lanes = LANE_X.filter(x => !run.logs.some(lg => Math.abs(lg.z - z) < run.speed * 0.45 && Math.abs(lg.x - x) < (lg.half || 0.27) + 0.2));
      if (!lanes.length) continue;
      const kind = pickFlagKind();
      run.flags.push({ z, x: pick(lanes), done: false, got: 0, color: kind.color, pole: kind.pole, pts: kind.pts });
    }
  }
  function catchFlag(fl) {
    fl.got = 0.001;
    const g = geo(), p = proj(g, run.px, 0), r = canvas.getBoundingClientRect();
    const sx = r.left + p.x, sy = r.top + p.y - g.R * 0.35;
    sfx.pop(); tone(990, 0.08, 'triangle', 0.05, 0.12);   // 물고기 먹을 때와 같은 소리
    floatAt(sx, sy, '🚩 +' + (fl.pts || 3));
    bumpScore(fl.pts || 3);
  }
  function updateFlags(dt) {
    run.flags.forEach(fl => {
      fl.z -= run.speed * dt;
      if (fl.got) fl.got += dt;
      if (!fl.done && fl.z <= 0) {
        fl.done = true;
        if (Math.abs(run.px - fl.x) < 0.3) catchFlag(fl);
      }
    });
    run.flags = run.flags.filter(fl => (fl.got ? fl.got < 0.3 : fl.z > -CAM * 0.6));
  }
  function drawFlag(g, fl) {
    const b = proj(g, fl.x, fl.z), top = proj(g, fl.x, fl.z, 0.16);
    if (b.s <= 0) return;
    const h = b.y - top.y, w = h * 0.75;
    ctx.save();
    if (fl.got) { ctx.globalAlpha = Math.max(0, 1 - fl.got / 0.3); ctx.translate(0, -fl.got * h * 2); }
    // 그림자 · 깃대
    ctx.fillStyle = 'rgba(91,127,166,.22)';
    ctx.beginPath(); ctx.ellipse(b.x, b.y, w * 0.45, w * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = fl.pole || '#1e3a8a'; ctx.lineWidth = Math.max(1.5, h * 0.06); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(top.x, top.y); ctx.stroke();
    // 파란 깃발
    ctx.fillStyle = fl.color || '#2563eb';
    ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(top.x + w, top.y + h * 0.08); ctx.lineTo(top.x + w * 0.9, top.y + h * 0.4); ctx.lineTo(top.x, top.y + h * 0.36); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // 점프 효과음: 바탕화면의 727650__cjspellsfish__basic-retro-jump.wav (penguin/jump.wav)
  // <audio> 로 틀면 누른 뒤 조금 늦게 들려서, 미리 불러 둔 소리(Web Audio)로 바로 틀어요
  const JUMP_VOL = 0.42;      // 처음(0.7)의 60%
  const JUMP_SKIP = 0.015;    // 앞쪽 0.015초를 잘라 누르는 순간 바로 들리게
  let jumpBuf = null, jumpLoading = false;
  function loadJump() {
    if (jumpBuf || jumpLoading) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      jumpLoading = true;
      fetch('../penguin/jump.wav').then(r => r.arrayBuffer())
        .then(ab => new Promise((ok, no) => actx.decodeAudioData(ab, ok, no)))
        .then(buf => { jumpBuf = buf; }).catch(() => { jumpLoading = false; });
    } catch (e) { /* 소리를 못 내는 브라우저 */ }
  }
  const jumpSnd = new Audio('../penguin/jump.wav');   // 미리 불러 두기 전에 뛰면 이걸로
  jumpSnd.preload = 'auto'; jumpSnd.volume = JUMP_VOL;
  // 조작 방법은 페이지를 열 때 바로 적용해요 (방법 팝업 뒤로도 버튼 자리가 맞게)
  try { document.body.classList.toggle('hand-one', localStorage.getItem('penguin_hand') === 'one'); } catch (e) { /* 기본: 양손 */ }
  function playJump() {
    if (!state.sound) return;
    try {
      loadJump();
      if (jumpBuf) {
        if (actx.state === 'suspended') actx.resume();
        const src = actx.createBufferSource(), g = actx.createGain();
        src.buffer = jumpBuf; g.gain.value = JUMP_VOL;
        src.connect(g).connect(actx.destination);
        src.start(0, JUMP_SKIP);
      } else {
        jumpSnd.currentTime = JUMP_SKIP; jumpSnd.play().catch(() => {});
      }
    } catch (e) { /* 소리를 못 내는 브라우저 */ }
  }

  /* ---------- 통나무: 걸리면 하트 반 개 + 1초 동안 꽁꽁, 점프로 피해요 ---------- */
  // 허들을 지나면 거의 매번 다음 허들 전에 통나무가 굴러와요.
  // 다음 허들까지 1.5초 넘게 남는 때에만 놓아서, 얼었다 풀려도 정답 칸으로 갈 수 있어요.
  // 스테이지가 올라갈수록 허들 사이에 통나무가 여러 개 굴러와요
  // 5스테이지부터는 가끔 두 칸을 차지하는 긴 통나무도 나와요
  // 8스테이지부터는 통나무 사이가 점프 시간보다 짧을 수 있어서, 그때는 서로 다른 칸에 짧은 통나무만 놓아요
  // base: 통나무를 놓는 기준 거리 (허들이 있는 곳). 허들을 지난 뒤 ta 초 뒤에 펭귄에게 닿아요
  function maybeLog(delaySec, base) {
    base = base || 0;
    const LOG_GAP = run.stage >= 7 ? 0.55 : 0.75;
    if (Math.random() > (run.stage === 0 ? 0.85 : 1)) return;
    const T = Z_SPAWN / run.speed;
    const tMin = 0.7, tMax = delaySec + T - 1.5;
    if (tMax < tMin) return;
    const fit = Math.floor((tMax - tMin) / LOG_GAP) + 1;
    const want = 1 + Math.floor(run.stage * 0.3 + Math.random());
    const n = Math.max(1, Math.min(fit, want));
    const gap = n > 1 ? (tMax - tMin) / (n - 1) : 0;
    const close = gap > 0 && gap < HOP + 0.1;   // 한 번 점프로 둘 다 넘기 어려울 만큼 가까워요
    // 가까이 붙은 두 통나무는 겹치는 칸이 없게 놓아요 (긴 통나무 + 남은 한 칸 통나무는 괜찮아요)
    const overlap = (a, b) => Math.abs(a.x - b.x) < a.half + b.half - 0.05;
    let prev = null;
    for (let k = 0; k < n; k++) {
      const ta = n > 1 ? tMin + k * gap - (k === n - 1 ? Math.random() * 0.05 : 0) : tMin + Math.random() * (tMax - tMin);
      const opts = [];
      if (run.stage >= 4 && Math.random() < 0.3) [-1 / 3, 1 / 3].forEach(x => opts.push({ x, half: 0.6 }));
      if (!opts.length) LANE_X.forEach(x => opts.push({ x, half: 0.27 }));
      let ok = close && prev ? opts.filter(o => !overlap(o, prev)) : opts;
      if (!ok.length) ok = LANE_X.map(x => ({ x, half: 0.27 })).filter(o => !(close && prev && overlap(o, prev)));
      const c = pick(ok);
      const lg = { z: base + run.speed * ta, x: c.x, half: c.half, done: false, age: 0 };
      prev = lg;
      run.logs.push(lg);
      run.flags = run.flags.filter(fl => !(Math.abs(fl.z - lg.z) < run.speed * 0.45 && Math.abs(fl.x - lg.x) < lg.half + 0.2));
    }
  }

  function hitLog() {
    run.freezeT = FREEZE;
    run.target = null;
    tone(180, 0.18, 'square', 0, 0.08); tone(1400, 0.25, 'sine', 0.1, 0.06);
    const g = geo(), p = proj(g, run.px, 0), r = canvas.getBoundingClientRect();
    floatAt(r.left + p.x, r.top + p.y - g.R * 0.45, '❄️ 꽁꽁! ❤️-½');
    state.lives = Math.max(0, state.lives - 0.5);
    renderHearts(true);
    $('#runMsg').textContent = '앗, 통나무에 걸려서 꽁꽁! 하트 반 개가 줄었어요 🪵❄️';
  }

  // 점프: 통나무를 넘어가요
  function hop() {
    if (!run.active || run.goal || run.hopT > 0 || run.freezeT > 0 || run.fallT > 0) return;
    run.hopT = HOP;
    playJump();
  }

  /* ---------- 스테이지 끝 이글루 ---------- */
  function startGoal() {
    run.goal = { z: Math.max(30, run.speed * 3.2), phase: 'approach', t: 0, last: state.i >= state.total };
    // 멀리서 이글루가 보이기 시작하면 도착 곡이 나와요. 도착까지 GOAL_APPROACH 초에 맞춰 달려요
    run.goal.vz = (run.goal.z - 4.2) / GOAL_APPROACH;
    playGoalSong();
    run.fish = [];
    run.flags = [];
    run.logs = [];
    $('#runMsg').textContent = '🏠 저기 이글루가 보여요! 조금만 더!';
  }

  function updateGoal(dt) {
    const gl = run.goal;
    gl.t += dt;
    if (gl.phase === 'approach') {
      gl.z -= gl.vz * dt;
      run.dist += gl.vz * dt;
      run.target = 0;
      if (gl.z <= 4.2) {
        gl.z = 4.2; gl.phase = 'wave'; gl.t = 0;
        const stage = state.i / PER_STAGE;
        sfx.win();
        const g = geo(), p = proj(g, 0, 0), r = canvas.getBoundingClientRect();
        burstAt(r.left + p.x, r.top + p.y - g.R * 0.4);
        if (gl.last) { confetti(30); speak('도착! 다 해냈어요!'); }
        else speak('도착!');
        $('#runMsg').textContent = gl.last ? '🎉 마지막 이글루 도착! 다 해냈어요!' : `🏠 이글루 도착! 스테이지 ${stage}${eul(stage)} 통과했어요!`;
        run.banner = { text: gl.last ? '🎉 이글루 도착!' : `🏠 스테이지 ${stage} 도착!`, t: 1.8 };
      }
    } else if (gl.t > GOAL_WAVE) {
      run.goal = null;
      if (!gl.last) resumeBgm();
      if (gl.last) finish();
      else nextRunQuestion();
    }
  }

  // 모바일(좁은 화면 · 가로로 눕힌 폰): 이동 속도를 절반 아래로 줄여요
  const MOBILE = window.matchMedia('(max-width: 560px), (pointer: coarse) and (max-height: 500px)');
  const MOBILE_SPEED = 0.54; // 0.45에서 20% 빠르게
  const LANE_SNAP = 7;        // 줄을 옮길 때 속도 (한 줄을 0.1초쯤에)
  function runFrame(now) {
    if (!run.active) return;
    const dt = Math.min(0.05, (now - run.last) / 1000);
    run.last = now;

    // 펭귄 움직이기
    let dir = (run.keys.r ? 1 : 0) - (run.keys.l ? 1 : 0);
    if (dir) run.target = null;
    else if (run.target != null) {
      const d = run.target - run.px;
      if (Math.abs(d) < 0.01) { run.px = run.target; run.target = null; }
      else dir = Math.sign(d);
    }
    if (run.fallT > 0 || run.freezeT > 0 || (run.goal && run.goal.phase === 'wave')) dir = 0;
    run.dir = dir;
    // 줄을 옮길 때는 슉! 빠르게 그 줄 가운데로 가서 딱 멈춰요 (모바일도 같아요)
    const spd = run.target != null ? LANE_SNAP : (1.9 + run.stage * 0.15) * (MOBILE.matches ? MOBILE_SPEED : 1);
    let nx = run.px + dir * spd * dt;
    if (run.target != null && (nx - run.target) * (run.px - run.target) <= 0) { nx = run.target; run.target = null; }
    run.px = Math.max(-0.82, Math.min(0.82, nx));
    run.lean += (dir * 0.22 - run.lean) * Math.min(1, dt * 10);
    $('#padL').classList.toggle('on', dir < -0.1);
    $('#padR').classList.toggle('on', dir > 0.1);

    if (run.goal) {
      updateGoal(dt);
      if (!run.active) return;
    } else {
      // 앞으로 달리기
      run.dist += run.speed * dt;
      // 옆에서 물고기가 튀어나와요
      if ((run.fishT -= dt) <= 0) spawnFish();
    }
    run.fish.forEach(fs => {
      fs.z -= run.speed * dt;
      if (!fs.done && fs.z <= 0) {
        fs.done = true;
        if (Math.abs(run.px - fs.x1) < 0.3) catchFish(fs);
      }
    });
    run.fish = run.fish.filter(fs => !fs.caught && fs.z > -CAM * 0.6);
    updateFlags(dt);
    run.gulpT = Math.max(0, run.gulpT - dt);
    run.logs.forEach(lg => {
      lg.z -= run.speed * dt;
      lg.age += dt;
      if (!lg.done && lg.z <= 0) {
        lg.done = true;
        const onLog = Math.abs(run.px - lg.x) < (lg.half || 0.27) + 0.03;
        if (onLog && run.jumpT <= 0 && run.hopT <= 0) hitLog();
      }
    });
    run.logs = run.logs.filter(lg => lg.z > -CAM * 0.6);
    if (run.freezeT > 0 && (run.freezeT -= dt) <= 0) {
      run.freezeT = 0;
      if (state.lives <= 0) { finish(); return; }
      $('#runMsg').textContent = '휴, 다 녹았어요! 다시 달려요 🐧';
    }
    run.hopT = Math.max(0, run.hopT - dt);
    if (!run.goal || run.goal.phase === 'approach') run.gates.forEach(gt => {
      gt.z -= run.speed * dt;
      if (!gt.done && gt.z <= 0) judgeGate(gt);
    });
    run.gates = run.gates.filter(gt => gt.z > -CAM * 0.7);
    run.jumpT = Math.max(0, run.jumpT - dt);
    run.fallT = Math.max(0, run.fallT - dt);
    if (run.banner && (run.banner.t -= dt) <= 0) run.banner = null;

    drawRun(now / 1000);
    loopBgm(); // timeupdate보다 촘촘하게 확인해서 이음새를 매끄럽게
    run.raf = requestAnimationFrame(runFrame);
  }

  const PEAKS = [[0.06, 0.1, 0.16], [0.2, 0.17, 0.2], [0.36, 0.08, 0.14], [0.66, 0.12, 0.18], [0.82, 0.19, 0.22], [0.97, 0.09, 0.14]];
  function drawRun(t) {
    const g = geo(), { W, H, cx, hy, gy, R } = g;
    ctx.clearRect(0, 0, W, H);

    // 하늘
    const sky = ctx.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, '#7cc8ff'); sky.addColorStop(1, '#e3f5ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hy + 1);

    // 빙산
    PEAKS.forEach(([fx, fh, fw]) => {
      const x = fx * W, top = hy - fh * H, half = fw * W / 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(x - half, hy); ctx.lineTo(x, top); ctx.lineTo(x + half, hy); ctx.fill();
      ctx.fillStyle = '#cfe8fb';
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + half, hy); ctx.lineTo(x + half * 0.2, hy); ctx.fill();
    });

    // 눈밭과 얼음길
    ctx.fillStyle = '#f5fbff'; ctx.fillRect(0, hy, W, H - hy);
    const sb = (H - hy) / (gy - hy);
    ctx.fillStyle = '#d6ecff';
    ctx.beginPath(); ctx.moveTo(cx, hy);
    ctx.lineTo(cx + 1.05 * sb * R, H); ctx.lineTo(cx - 1.05 * sb * R, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#9fd0f5'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, hy); ctx.lineTo(cx + 1.05 * sb * R, H);
    ctx.moveTo(cx, hy); ctx.lineTo(cx - 1.05 * sb * R, H);
    ctx.stroke();

    // 칸 나누는 점선 (달리는 느낌)
    ctx.strokeStyle = '#b3d9f7'; ctx.lineCap = 'round';
    const off = run.dist % 6;
    for (let k = -2; k < 12; k++) {
      const z = k * 6 - off;
      if (z < -CAM * 0.6) continue;
      [-1 / 3, 1 / 3].forEach(x => {
        const p1 = proj(g, x, z), p2 = proj(g, x, z + 2.4);
        ctx.lineWidth = Math.max(1, 6 * p1.s);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      });
    }

    // 길가 깃발 (먼 것부터)
    const foff = run.dist % 10;
    for (let k = 7; k >= 0; k--) {
      const z = k * 10 - foff;
      if (z < -CAM * 0.5) continue;
      const idx = Math.floor((run.dist + z) / 10);
      [-1.25, 1.25].forEach((x, side) => {
        const b = proj(g, x, z), tp = proj(g, x, z, 0.38);
        ctx.strokeStyle = '#6b5f86'; ctx.lineWidth = Math.max(1, 5 * b.s);
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(tp.x, tp.y); ctx.stroke();
        const fl = proj(g, x + (side ? -0.16 : 0.16), z, 0.3);
        ctx.fillStyle = (idx + side) % 2 ? '#ff5d73' : '#60a5fa';
        ctx.beginPath(); ctx.moveTo(tp.x, tp.y); ctx.lineTo(fl.x, fl.y); ctx.lineTo(tp.x, (tp.y + b.y) / 2 - (b.y - tp.y) * 0.25); ctx.fill();
      });
    }

    // 허들: 펭귄보다 먼 것 → 펭귄 → 지나간 것
    const far = run.gates.filter(gt => gt.z >= 0).sort((a, b) => b.z - a.z);
    const near = run.gates.filter(gt => gt.z < 0);
    if (run.goal) drawIgloo(g, run.goal.z, t);
    // 먼 것부터 차례로 그려요 (투명하게 비치지 않아요):
    // 허들 너머의 통나무 · 깃발은 정답 표지판 뒤에 가려지고, 허들이 가까워져 뒤쪽 길이 넓게 보이면 미리 보여요
    const gateZ = far.length ? Math.min(...far.map(gt => gt.z)) : Infinity;
    far.map(gt => ({ z: gt.z, k: 0, o: gt }))
      .concat(run.logs.filter(lg => lg.z >= 0).map(lg => ({ z: lg.z, k: 1, o: lg })))
      .concat(run.flags.filter(fl => fl.z >= 0 && fl.z > gateZ).map(fl => ({ z: fl.z, k: 2, o: fl })))
      .sort((p, q) => q.z - p.z)
      .forEach(it => { if (it.k === 0) drawGate(g, it.o); else if (it.k === 1) { it.o.dim = 1; drawLog(g, it.o); } else drawFlag(g, it.o); });
    run.flags.filter(fl => fl.z >= 0 && !(fl.z > gateZ)).sort((a, b) => b.z - a.z).forEach(fl => drawFlag(g, fl));
    run.fish.filter(fs => fs.z >= 0).forEach(fs => drawFish(g, fs));
    drawPenguin(g, t);
    run.logs.filter(lg => lg.z < 0).forEach(lg => drawLog(g, lg));
    run.flags.filter(fl => fl.z < 0).forEach(fl => drawFlag(g, fl));
    run.fish.filter(fs => fs.z < 0).forEach(fs => drawFish(g, fs));
    near.forEach(gt => drawGate(g, gt));
    if (run.banner) drawBanner(g, run.banner);
  }

  function drawBanner(g, bn) {
    const fs = Math.min(g.W * 0.07, 34);
    ctx.save();
    ctx.globalAlpha = Math.min(1, bn.t / 0.3, (1.8 - bn.t) / 0.2 + 0.2);
    ctx.font = `${fs}px CookieRun, Jua, sans-serif`;
    const w = ctx.measureText(bn.text).width + fs * 1.4, h = fs * 1.9;
    const x = g.cx - w / 2, y = g.hy * 0.55;
    roundRect(x, y, w, h, h / 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#ff9f43'; ctx.stroke();
    ctx.fillStyle = '#3b2d5c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(bn.text, g.cx, y + h / 2 + fs * 0.05);
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function drawGate(g, gt) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (Z_SPAWN - gt.z) / 10 + 0.15);
    LANE_X.forEach((c, i) => {
      if (gt.done && gt.ok && gt.pick === i) return; // 정답 허들은 부서짐
      // 기둥
      ctx.strokeStyle = '#6b5f86';
      [c - 0.22, c + 0.22].forEach(x => {
        const b = proj(g, x, gt.z), tp = proj(g, x, gt.z, 0.16);
        ctx.lineWidth = Math.max(1.5, 7 * b.s);
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(tp.x, tp.y); ctx.stroke();
      });
      // 판
      const tl = proj(g, c - 0.29, gt.z, 0.46), br = proj(g, c + 0.29, gt.z, 0.14);
      const w = br.x - tl.x, h = br.y - tl.y;
      roundRect(tl.x, tl.y, w, h, Math.min(w, h) * 0.22);
      const isAns = gt.vals[i] === gt.ans;
      ctx.fillStyle = gt.done && !gt.ok && i === gt.pick ? '#b9b3c9' : COLORS[(i * 2) % COLORS.length];
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, (gt.done && isAns ? 14 : 6) * tl.s);
      ctx.strokeStyle = gt.done && isAns ? '#34d399' : '#ffffff';
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      // 영어 단어는 판 너비에 맞춰 글자 크기를 줄여요
      ctx.font = `800 ${Math.max(8, Math.min(h * 0.6, w * 1.55 / Math.max(3, String(gt.vals[i]).length)))}px Nunito, Pretendard, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(gt.vals[i], tl.x + w / 2, tl.y + h / 2 + h * 0.04);
    });
    ctx.restore();
  }

  // 옆에서 튀어나오는 물고기 (그림자 + 몸통 + 꼬리 + 눈)
  function drawFish(g, fs) {
    const { x, h, p: k } = fishPos(fs);
    const base = proj(g, x, fs.z), p = proj(g, x, fs.z, h);
    if (base.s <= 0) return;
    const L = g.R * 0.27 * p.s;
    ctx.save();
    ctx.globalAlpha = 0.25 * Math.min(1, k * 3);
    ctx.fillStyle = '#5b7fa6';
    ctx.beginPath(); ctx.ellipse(base.x, base.y, L * 0.5, L * 0.13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(p.x, p.y);
    const dirX = fs.x1 > fs.x0 ? 1 : -1;
    ctx.scale(dirX, 1);
    ctx.rotate((0.5 - k) * 1.4 + Math.sin(fs.z * 3) * 0.15);
    ctx.fillStyle = fs.hue;
    ctx.beginPath(); ctx.moveTo(-L * 0.42, 0); ctx.lineTo(-L * 0.75, -L * 0.24); ctx.lineTo(-L * 0.75, L * 0.24); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, L * 0.48, L * 0.24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.ellipse(L * 0.05, L * 0.08, L * 0.3, L * 0.09, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(L * 0.26, -L * 0.05, L * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1f1b2e';
    ctx.beginPath(); ctx.arc(L * 0.28, -L * 0.05, L * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // 물방울
    if (k < 0.35) {
      ctx.fillStyle = 'rgba(125,211,252,.8)';
      for (let d = 0; d < 3; d++) {
        const bx = proj(g, fs.x0 + (fs.x1 - fs.x0) * k * 0.6 - dirX * 0.06 * d, fs.z + d * 0.6, h * 0.6);
        ctx.beginPath(); ctx.arc(bx.x, bx.y, Math.max(1, L * 0.06), 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // 길 위에 가로로 누운 통나무 (한 칸 폭)
  function drawLog(g, lg) {
    const half = lg.half || 0.27, rad = 0.055;
    const L = proj(g, lg.x - half, lg.z, rad), Rr = proj(g, lg.x + half, lg.z, rad), base = proj(g, lg.x, lg.z);
    if (base.s <= 0) return;
    const r = Math.max(2, rad * g.R * base.s);
    ctx.save();
    ctx.globalAlpha = (lg.dim || 1) * Math.min(1, lg.age / 0.25);
    // 그림자
    ctx.fillStyle = 'rgba(91,127,166,.22)';
    ctx.beginPath(); ctx.ellipse(base.x, base.y, (Rr.x - L.x) / 2 + r, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    // 몸통
    const wood = ctx.createLinearGradient(0, L.y - r, 0, L.y + r);
    wood.addColorStop(0, '#c98a4b'); wood.addColorStop(0.5, '#a0622d'); wood.addColorStop(1, '#7a4520');
    ctx.fillStyle = wood;
    ctx.beginPath(); ctx.rect(L.x, L.y - r, Rr.x - L.x, r * 2); ctx.fill();
    // 나뭇결
    ctx.strokeStyle = 'rgba(90,50,20,.45)'; ctx.lineWidth = Math.max(1, r * 0.12);
    for (let k = 1; k <= 3; k++) {
      const x = L.x + (Rr.x - L.x) * (k / 4);
      ctx.beginPath(); ctx.moveTo(x - r * 0.4, L.y - r * 0.5); ctx.lineTo(x + r * 0.4, L.y - r * 0.3); ctx.stroke();
    }
    // 양쪽 나이테
    [L.x, Rr.x].forEach(x => {
      ctx.fillStyle = '#e8b980';
      ctx.beginPath(); ctx.ellipse(x, L.y, r * 0.55, r, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a0622d'; ctx.lineWidth = Math.max(1, r * 0.1);
      ctx.beginPath(); ctx.ellipse(x, L.y, r * 0.3, r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
    });
    // 쌓인 눈
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse((L.x + Rr.x) / 2, L.y - r * 0.85, (Rr.x - L.x) * 0.3, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // 스테이지 끝의 이글루 (얼음 벽돌 + 입구 + 깃발)
  function drawIgloo(g, z, t) {
    const b = proj(g, 0, z), W = g.R * 1.1 * b.s, H = W * 0.62;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = 'rgba(91,127,166,.18)';
    ctx.beginPath(); ctx.ellipse(0, 0, W * 0.62, H * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    // 돔
    const dome = ctx.createLinearGradient(0, -H, 0, 0);
    dome.addColorStop(0, '#ffffff'); dome.addColorStop(1, '#d9eefe');
    ctx.fillStyle = dome;
    ctx.beginPath(); ctx.ellipse(0, 0, W * 0.5, H, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#9fd0f5'; ctx.lineWidth = Math.max(1, W * 0.012);
    ctx.stroke();
    // 얼음 벽돌 줄
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, 0, W * 0.5, H, 0, Math.PI, 0); ctx.clip();
    for (let r = 1; r <= 3; r++) {
      const y = -H * r / 4;
      ctx.beginPath(); ctx.moveTo(-W, y); ctx.lineTo(W, y); ctx.stroke();
      for (let c = -4; c <= 4; c++) {
        const x = (c + (r % 2) * 0.5) * W * 0.18;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + H / 4); ctx.stroke();
      }
    }
    ctx.restore();
    // 입구
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, 0, W * 0.2, H * 0.5, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3b4a6b';
    ctx.beginPath(); ctx.ellipse(0, 0, W * 0.13, H * 0.37, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    // 깃발
    const fx = W * 0.05, top = -H * 1.45;
    ctx.strokeStyle = '#6b5f86'; ctx.lineWidth = Math.max(1, W * 0.015);
    ctx.beginPath(); ctx.moveTo(fx, -H * 0.98); ctx.lineTo(fx, top); ctx.stroke();
    const wave = Math.sin(t * 6) * W * 0.03;
    ctx.fillStyle = '#ff5d73';
    ctx.beginPath(); ctx.moveTo(fx, top); ctx.lineTo(fx + W * 0.24, top + H * 0.1 + wave); ctx.lineTo(fx, top + H * 0.22); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // 앞에서 본 펭귄: 웃으면서 날개를 흔들어요 (발 밑 가운데가 0,0)
  function drawPenguinFront(s, t) {
    const waveA = -1.9 + Math.sin(t * 9) * 0.45;
    // 발
    ctx.fillStyle = '#ff9f43';
    [-1, 1].forEach(side => { ctx.beginPath(); ctx.ellipse(side * s * 0.14, -s * 0.03, s * 0.12, s * 0.05, 0, 0, Math.PI * 2); ctx.fill(); });
    // 날개: 왼쪽은 몸에 붙이고, 오른쪽은 번쩍 들어 흔들어요
    ctx.fillStyle = '#1f1b2e';
    [[-1, 0.12], [1, waveA]].forEach(([side, rot]) => {
      ctx.save();
      ctx.translate(side * s * 0.25, -s * 0.58);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.06);
      ctx.quadraticCurveTo(side * s * 0.26, s * 0.02, side * s * 0.34, s * 0.3);
      ctx.quadraticCurveTo(side * s * 0.14, s * 0.18, 0, s * 0.14);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    // 몸통 + 흰 배
    ctx.beginPath(); ctx.ellipse(0, -s * 0.4, s * 0.31, s * 0.38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, -s * 0.34, s * 0.21, s * 0.29, 0, 0, Math.PI * 2); ctx.fill();
    // 머리 + 얼굴
    ctx.fillStyle = '#1f1b2e';
    ctx.beginPath(); ctx.arc(0, -s * 0.74, s * 0.23, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(-s * 0.08, -s * 0.73, s * 0.09, s * 0.11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.08, -s * 0.73, s * 0.09, s * 0.11, 0, 0, Math.PI * 2); ctx.fill();
    // 웃는 눈 ^ ^
    ctx.strokeStyle = '#1f1b2e'; ctx.lineWidth = Math.max(1.5, s * 0.025); ctx.lineCap = 'round';
    [-1, 1].forEach(side => {
      ctx.beginPath(); ctx.arc(side * s * 0.08, -s * 0.74, s * 0.04, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    });
    // 볼
    ctx.fillStyle = 'rgba(255,120,150,.6)';
    [-1, 1].forEach(side => { ctx.beginPath(); ctx.ellipse(side * s * 0.13, -s * 0.66, s * 0.04, s * 0.025, 0, 0, Math.PI * 2); ctx.fill(); });
    // 웃는 입(부리)
    ctx.fillStyle = '#ff9f43';
    ctx.beginPath(); ctx.moveTo(-s * 0.055, -s * 0.67); ctx.quadraticCurveTo(0, -s * 0.6, s * 0.055, -s * 0.67); ctx.quadraticCurveTo(0, -s * 0.7, -s * 0.055, -s * 0.67); ctx.fill();
    ctx.strokeStyle = '#e67300'; ctx.lineWidth = Math.max(1, s * 0.015);
    ctx.beginPath(); ctx.moveTo(-s * 0.05, -s * 0.665); ctx.quadraticCurveTo(0, -s * 0.625, s * 0.05, -s * 0.665); ctx.stroke();
  }

  function drawPenguin(g, t) {
    const p = proj(g, run.px, 0);
    const size = Math.min(g.R * 0.42, (g.gy - g.hy) * 0.5);
    if (run.goal && run.goal.phase === 'wave') {
      // 이글루 앞에서 돌아서서 콩콩 뛰며 손 흔들기
      const hop = Math.abs(Math.sin(run.goal.t * 5)) * g.R * 0.05;
      ctx.save();
      ctx.translate(p.x, p.y - hop);
      drawPenguinFront(size, t);
      ctx.restore();
      return;
    }
    let y = p.y, rot = run.lean + (run.freezeT > 0 ? 0 : Math.sin(t * 14) * 0.09);
    if (run.jumpT > 0) y -= Math.sin(Math.PI * (1 - run.jumpT / 0.55)) * g.R * 0.28;
    if (run.hopT > 0) {
      // 땅에 그림자를 남기고 폴짝
      const k = Math.sin(Math.PI * (1 - run.hopT / HOP));
      ctx.fillStyle = 'rgba(91,127,166,.22)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, size * 0.3 * (1 - k * 0.4), size * 0.07, 0, 0, Math.PI * 2); ctx.fill();
      y -= k * g.R * 0.34;
    }
    if (run.fallT > 0) {
      const k = 1 - run.fallT / 0.9;
      rot = Math.sin(k * Math.PI * 4) * 0.5 * (1 - k);
    }
    ctx.save();
    ctx.translate(p.x, y);
    ctx.rotate(rot * 0.7);
    if (run.gulpT > 0) ctx.scale(1 + run.gulpT * 0.35, 1 - run.gulpT * 0.15);
    drawPenguinBack(size, t);
    if (run.fallT > 0) {
      ctx.font = `${size * 0.4}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('💫', 0, -size * 1.02);
    }
    if (run.freezeT > 0) {
      // 얼음 덩어리에 갇혀 덜덜 떨어요
      ctx.translate(Math.sin(t * 60) * size * 0.015, 0);
      ctx.globalAlpha = Math.min(1, run.freezeT / 0.25);
      roundRect(-size * 0.42, -size * 1.05, size * 0.84, size * 1.08, size * 0.14);
      ctx.fillStyle = 'rgba(186,230,253,.55)'; ctx.fill();
      ctx.lineWidth = Math.max(2, size * 0.03); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = Math.max(1.5, size * 0.025);
      ctx.beginPath(); ctx.moveTo(-size * 0.3, -size * 0.9); ctx.lineTo(-size * 0.18, -size * 0.6); ctx.stroke();
      ctx.font = `${size * 0.3}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('❄️', -size * 0.38, -size * 0.95);
      ctx.fillText('❄️', size * 0.4, -size * 0.7);
    }
    ctx.restore();
  }

  // 뒤에서 본 펭귄 (발 밑 가운데가 0,0)
  function drawPenguinBack(s, t) {
    const step = Math.sin(t * 14);
    // 걸을 땐 번갈아 파닥, 점프할 땐 양쪽 날개를 위로
    const wingRot = side => run.jumpT > 0 || run.hopT > 0 ? -side * 0.7 : step * 0.22;
    // 발
    ctx.fillStyle = '#ff9f43';
    [-1, 1].forEach(side => {
      const lift = Math.max(0, step * side) * s * 0.05;
      ctx.beginPath();
      ctx.ellipse(side * s * 0.15, -s * 0.03 - lift, s * 0.11, s * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#1f1b2e';
    // 날개 (어깨를 축으로 파닥파닥)
    [-1, 1].forEach(side => {
      ctx.save();
      ctx.translate(side * s * 0.25, -s * 0.58);
      ctx.rotate(wingRot(side));
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.06);
      ctx.quadraticCurveTo(side * s * 0.26, s * 0.02, side * s * 0.34, s * 0.3);
      ctx.quadraticCurveTo(side * s * 0.14, s * 0.18, 0, s * 0.14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    // 몸통과 머리
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.4, s * 0.31, s * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -s * 0.74, s * 0.23, 0, Math.PI * 2);
    ctx.fill();
  }

  // 마우스: 누른 곳으로 펭귄이 따라가요
  // 터치(휴대폰 · 태블릿): 화면을 터치하면 점프만 해요. 옆 줄 이동은 ◀ ▶ 버튼으로만 해요
  const field = $('#runField');
  let swipe = null;
  function aim(e) {
    const g = geo(), r = field.getBoundingClientRect();
    run.target = nearLane((e.clientX - r.left - g.cx) / g.R);
  }
  // dir 쪽으로 가장 가까운 다음 줄 (끝 줄이면 가장자리까지)
  function nextLane(dir) {
    const from = run.target != null ? run.target : run.px;
    const lanes = dir > 0 ? LANE_X.filter(x => x > from + 0.05) : LANE_X.filter(x => x < from - 0.05).reverse();
    return lanes.length ? lanes[0] : LANE_X[dir > 0 ? 2 : 0];
  }
  // 가장 가까운 줄 가운데
  const nearLane = x => LANE_X.reduce((a, b) => Math.abs(b - x) < Math.abs(a - x) ? b : a);
  field.addEventListener('pointerdown', e => {
    if (e.target.closest('.run-pad')) return;
    try { field.setPointerCapture(e.pointerId); } catch (err) { /* 이미 끝난 터치 */ }
    if (e.pointerType === 'mouse') aim(e);
    else hop();   // 휴대폰 · 태블릿: ◀ ▶ 버튼이 아닌 곳을 터치하면 그 순간 점프 (밀어서 움직이기는 없어요. 이동은 ◀ ▶ 버튼으로만)
  });
  field.addEventListener('pointermove', e => {
    if (!field.hasPointerCapture(e.pointerId)) return;
    if (e.pointerType === 'mouse') { aim(e); return; }
    if (!swipe) return;
    const dx = e.clientX - swipe.x;
    if (!swipe.moved && Math.abs(dx) > 14) swipe.moved = true;
    if (swipe.moved) run.target = nearLane(swipe.px + dx * 1.6 / geo().R);
  });
  field.addEventListener('pointerup', e => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x, quick = performance.now() - swipe.t < 300;
    if (swipe.moved && quick && Math.abs(dx) > 30) {
      const lane = nextLane(Math.sign(dx));
      if (Math.sign(dx) * (lane - run.target) > 0) run.target = lane;
    }
    swipe = null;
  });
  field.addEventListener('pointercancel', () => { swipe = null; });
  // ◀ ▶ 버튼: 톡 누르면 옆 줄로 한 칸, 꾹 누르고 있으면 계속 그쪽으로 가요
  [['#padL', 'l', -1], ['#padR', 'r', 1]].forEach(([sel, k, dir]) => {
    const pad = $(sel);
    let holdTimer = null;
    pad.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (!run.active) return;
      run.target = nextLane(dir);
      clearTimeout(holdTimer);
      // 꾹 누르고 있으면 조금 뒤에 한 칸 더 (줄 가운데에서 멈춰요)
      holdTimer = setTimeout(function again() { if (!run.active) return; run.target = nextLane(dir); holdTimer = setTimeout(again, 380); }, 380);
      try { pad.setPointerCapture(e.pointerId); } catch (err) { /* 이미 끝난 터치 */ }
    });
    const up = () => { clearTimeout(holdTimer); run.keys[k] = false; };
    pad.addEventListener('pointerup', up);
    pad.addEventListener('pointercancel', up);
    pad.addEventListener('lostpointercapture', up);
  });

  // 키보드: ← → 또는 A D
  const RUN_KEYS = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r' };
  document.addEventListener('keydown', e => {
    // 안내 팝업이 떠 있으면 스페이스·엔터로도 확인
    if (run.active && (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W')) { e.preventDefault(); if (!e.repeat) hop(); return; }
    if (!run.active || !RUN_KEYS[e.key]) return;
    e.preventDefault();
    if (e.repeat) return;
    run.target = nextLane(RUN_KEYS[e.key] === 'r' ? 1 : -1);   // 한 번 누르면 옆 줄 가운데로
  });
  document.addEventListener('keyup', e => {
    if (RUN_KEYS[e.key]) run.keys[RUN_KEYS[e.key]] = false;
  });
  window.addEventListener('blur', () => { run.keys.l = run.keys.r = false; });


  /* ---------- 영어 문제 ---------- */
  function setRunQ(w) {
    $('#rqEmoji').textContent = w ? wordPic(w) : '🐧';
    $('#rqKo').textContent = w ? w[2] : '';
    resetAns($('#rqans'));
  }
  // 정답 + 같은 학년의 다른 단어 (길이가 비슷한 것부터)
  function wordChoices(w, n) {
    const others = shuffle(grade.words.filter(o => o[0] !== w[0])).sort((a, b) => Math.abs(a[0].length - w[0].length) - Math.abs(b[0].length - w[0].length));
    return shuffle([w[0]].concat(others.slice(0, n - 1).map(o => o[0])));
  }
  function GUIDE(onStart) {
    return {
      id: GUIDE_ID, title: '알파벳 펭귄 달리기',
      pages: [
        { icon: '🐧', title: '펭귄이 달려요', text: '위에 <b>그림</b>과 <b>뜻</b>이 나와요.<br>맞는 <b>영어 단어 허들</b>로 펭귄을 옮겨요!' },
        { icon: '⬅️➡️', title: '옮기는 방법', text: '<b>← →</b> 방향키로 움직여요.<br>태블릿은 <b>옆으로 밀거나</b> 아래 <b>◀ ▶</b> 를 눌러요.' },
        { icon: '🪵', title: '통나무는 점프!', text: '<b>통나무</b>는 <b>스페이스바</b>(화면 톡)로 점프해서 피해요.<br>걸리면 꽁꽁 얼고 하트가 반 개 줄어요.' },
        { icon: '🐟', title: '물고기 냠냠', text: '<b>물고기</b>를 먹어서 게이지를 채우면 <b>❤️ 하트 반 개</b>가 차요!' },
        { icon: '🏠', title: '이글루까지', text: '단어 <b>' + PER_STAGE + '개</b>를 지나 이글루에 도착하면 끝!' }
      ],
      startText: '자, 달려 볼까?', startLabel: '출발! 🐧', onStart
    };
  }
  function startGame() {
    state.total = RUN_STAGES * PER_STAGE;
    Object.assign(state, { qs: wordQueue(state.total), i: 0, score: 0, lives: LIVES, combo: 0, correct: 0, wrong: [] });
    $('#runScore').textContent = '0';
    startRun();
  }
  function finish() {
    stopRun();
    const ratio = state.correct / state.total;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
    showResult(stars, state.lives <= 0,
      `맞힌 단어 <b>${state.correct}</b> / ${state.total}<br>`, '🐧');
  }
  $('#runQuit').onclick = () => { stopRun(); if ('speechSynthesis' in window) speechSynthesis.cancel(); if (LINK) { EL.back(); return; } renderGrades(); show('#grade'); };

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
    $('#review').innerHTML = '';   // 다시 보면 좋은 단어 목록은 보여 주지 않아요
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
