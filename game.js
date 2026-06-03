/* =====================================================================
   폭염 러너 (Heat Runner) — 단계 1 + 2 엔진
   단계1: 자동질주 + 탭 점프 + 공중 홀드 플립 + juicy 착지(품질 판정)
   단계2: 굴곡 지형 + 수직 추적 카메라 + 패럴랙스 실루엣(도시/광안대교/해안/야자수)

   아직 없음(다음 단계): 체온·그늘/햇볕·픽업·시간대 사이클·장비.
   모듈 경계(다음 단계 분리 예정): Input · Player · World/Terrain · Camera ·
                                   Parallax · Particles · Renderer · Game
   2단계 훅(메타/공유/리더보드)은 파일 하단에 boundaries만 열어둠.
   ===================================================================== */
(() => {
  'use strict';
  const C = window.CONFIG;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const approach = (a, b, t) => a + (b - a) * Math.min(1, t);
  const now = () => performance.now();
  const BUILD = 24;           // 빌드 번호(캐시 확인용) — 화면 하단에 표시
  window.HR_BUILD = BUILD;

  /* ── 데일리 시드: 날짜(YYYYMMDD) → 결정적 코스 (모두 같은 코스를 달림) ── */
  function mulberry32(a) {
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const _d = new Date();
  const SEED = _d.getFullYear() * 10000 + (_d.getMonth() + 1) * 100 + _d.getDate();
  const _r = mulberry32(SEED);
  // 지형/그늘 위상 오프셋 — 매일 코스가 달라지되 부드럽게
  const TP = { p1: _r() * 6.283, p2: _r() * 6.283, p3: _r() * 6.283, shade: _r() };
  const hash01 = (k) => { let t = (k * 2654435761 + SEED) >>> 0; t = Math.imul(t ^ (t >>> 15), 1 | t); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // 시간대(거리에 따라 순환). 정오=가장 더움, 밤=시원.
  const TBANDS = [
    { key: '새벽', sky: ['#5b6fa6', '#caa6b0', '#f0c79a'], sun: 0.5 },
    { key: '오전', sky: ['#6f97c4', '#cfe0ee', '#fef0d8'], sun: 0.95 },
    { key: '정오', sky: ['#7fc6e6', '#cfeaf2', '#fffbe8'], sun: 1.6 },
    { key: '오후', sky: ['#e9a86a', '#f3c489', '#ffe0ab'], sun: 1.3 },
    { key: '저녁', sky: ['#9c6fae', '#e08a9a', '#f6b07a'], sun: 0.7 },
    { key: '밤', sky: ['#22305f', '#3a4a7a', '#6a6a96'], sun: 0.35 },
  ];

  /* ── 장비 (단계5): SUMMERTECT 제품. 스펙=효과. 펫에 시각 장착. ── */
  const EQUIP = {
    flexer_cap:    { name: 'Flexer 캡', slot: '머리', icon: '🧢', spec: 'UPF 차단', effect: '햇볕 체온 -20%' },
    frosty_gaiter: { name: 'Frosty 게이터', slot: '목', icon: '🧣', spec: '냉감 원단', effect: '항시 냉각' },
    run_shorts:    { name: '런쇼츠', slot: '하의', icon: '🩳', spec: '2겹 구조', effect: '점프 +10%' },
    calf_sleeve:   { name: '카프 슬리브', slot: '다리', icon: '🦵', spec: '단계 압박', effect: '속도+5%·휘청회복' },
    hairband:      { name: '헤어밴드', slot: '머리', icon: '🎀', spec: '땀 흡수', effect: '물 반경·효과↑' },
    running_shoes: { name: 'SUMMER 러닝화', slot: '발', icon: '👟', spec: '경량 반발', effect: '속도+8%·점프+6%' },
  };
  // ── 메타 진행 영구 저장: 코인 / 보유 / 착용 ──
  const META_KEY = 'hr-meta-v1';
  const meta = (function () {
    let m = null; try { m = JSON.parse(localStorage.getItem(META_KEY)); } catch (e) {}
    if (!m || typeof m !== 'object') m = {};
    m.coins = m.coins | 0;
    m.owned = Array.isArray(m.owned) ? m.owned : (C.gearDefault || []).slice();
    m.equipped = Array.isArray(m.equipped) ? m.equipped : (C.gearDefault || []).slice();
    for (const id in C.gearCost) if (C.gearCost[id] === 0 && m.owned.indexOf(id) < 0) m.owned.push(id); // 무료 장비는 항상 보유
    m.skin = m.skin || 'classic';
    m.ownedSkins = Array.isArray(m.ownedSkins) ? m.ownedSkins : ['classic'];
    if (m.ownedSkins.indexOf('classic') < 0) m.ownedSkins.push('classic');
    return m;
  })();
  function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify({ coins: meta.coins, owned: meta.owned, equipped: meta.equipped, skin: meta.skin, ownedSkins: meta.ownedSkins })); } catch (e) {} }
  const SKINS = [
    { key: 'classic', name: '클래식', body: '#ffd3b6', cost: 0 },
    { key: 'lime', name: '라임', body: '#c3e84a', cost: 70 },
    { key: 'sky', name: '하늘', body: '#a9d8ff', cost: 90 },
    { key: 'coral', name: '코랄', body: '#ff9e86', cost: 90 },
    { key: 'grape', name: '포도', body: '#b39ddb', cost: 130 },
  ];
  const skinColor = () => { const s = SKINS.find((k) => k.key === meta.skin); return s ? s.body : '#ffd3b6'; };
  let equipped = new Set(meta.equipped);
  const hasGear = (id) => equipped.has(id);
  // 장착한 모든 장비의 효과를 중첩(곱/합)
  function gearProd(param) { let m = 1; for (const id of equipped) { const g = C.gear[id]; if (g && g[param] !== undefined) m *= g[param]; } return m; }
  function gearSum(param) { let s = 0; for (const id of equipped) { const g = C.gear[id]; if (g && g[param] !== undefined) s += g[param]; } return s; }
  const gearSunMult = () => gearProd('sunMult');
  const gearCoolPerSec = () => gearSum('coolPerSec');
  const gearJumpMult = () => gearProd('jumpMult');
  const gearSpeedMult = () => gearProd('speedMult');
  const gearStumbleRec = () => gearProd('stumbleRecMult');
  const gearWaterRadius = () => C.waterRadius * gearProd('waterRadiusMult');
  const gearWaterCool = () => C.waterCool * gearProd('waterCoolMult');

  // ── 데일리 미션: 시드로 매일 3개 결정적 선택 (모두 같은 미션) ──
  // 난이도 계층: 매일 쉬움 1 + 보통 1 + 어려움 1 (첫 유저도 쉬움은 워밍업 중 바로 클리어)
  const MISSION_TIERS = [
    { tier: '쉬움', reward: 25, list: [{ desc: '150m 달리기', metric: 'distM', goal: 150 }, { desc: '코인 12개 줍기', metric: 'coins', goal: 12 }, { desc: '플립 5회', metric: 'flips', goal: 5 }] },
    { tier: '보통', reward: 70, list: [{ desc: '1200m 주파', metric: 'distM', goal: 1200 }, { desc: '코인 50개 줍기', metric: 'coins', goal: 50 }, { desc: '플립 18회', metric: 'flips', goal: 18 }, { desc: '물 9개 마시기', metric: 'water', goal: 9 }] },
    { tier: '어려움', reward: 140, list: [{ desc: '4000m 주파', metric: 'distM', goal: 4000 }, { desc: '코인 100개 줍기', metric: 'coins', goal: 100 }, { desc: '플립 36회', metric: 'flips', goal: 36 }, { desc: '깔끔 착지 18연속', metric: 'cleanCombo', goal: 18 }] },
  ];
  const todaysMissions = (function () {
    const rng = mulberry32(SEED ^ 0x9e3779b9);
    return MISSION_TIERS.map((t) => { const m = t.list[Math.floor(rng() * t.list.length)]; return Object.assign({}, m, { reward: t.reward, tier: t.tier }); });
  })();
  const MZ_KEY = 'hr-mz-' + SEED;
  let missionDone = (function () { try { const a = JSON.parse(localStorage.getItem(MZ_KEY)); if (Array.isArray(a)) return a; } catch (e) {} return [false, false, false]; })();
  function saveMissions() { try { localStorage.setItem(MZ_KEY, JSON.stringify(missionDone)); } catch (e) {} }
  function missionValue(metric) {
    if (metric === 'flips') return state.flipCount;
    if (metric === 'water') return state.waterCount;
    if (metric === 'coins') return state.runCoins;
    if (metric === 'shadeTime') return Math.floor(state.shadeTime);
    if (metric === 'cleanCombo') return state.maxCleanCombo;
    if (metric === 'distM') return Math.floor(state.distance / C.pxPerMeter);
    return 0;
  }
  function checkMissions() {
    for (let i = 0; i < todaysMissions.length; i++) {
      if (missionDone[i]) continue;
      const m = todaysMissions[i];
      if (missionValue(m.metric) >= m.goal) {
        missionDone[i] = true; meta.coins += m.reward; saveMeta(); saveMissions();
        banner('🎯 미션 완료! (' + m.tier + ')', m.desc + '  +' + m.reward + '🪙', '#A7D500'); sfx('flip', 2);
      }
    }
  }
  // ── 데일리 리더보드: 시드로 만든 "오늘의 도전자"(봇) 사다리 + 내 최고기록 ──
  const BOT_NAMES = ['해운대치타', '광안리바람', '온천천토끼', '자갈치불꽃', '다대포질주', '서면스프린터', '남포동번개', '기장갈매기', '센텀스피드', '태종대독수리', '송정파도', '범어사구름'];
  function dailyLeaderboard(myBest) {
    const rng = mulberry32((SEED ^ 0x51ed2701) >>> 0);
    const names = BOT_NAMES.slice();
    for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = names[i]; names[i] = names[j]; names[j] = t; }
    const list = [];
    for (let i = 0; i < 9; i++) {
      const base = 720 + i * 560, jit = Math.floor((rng() * 2 - 1) * 230);
      list.push({ name: names[i], dist: Math.max(300, base + jit), you: false });
    }
    list.push({ name: '나', dist: myBest | 0, you: true });
    list.sort((a, b) => b.dist - a.dist || (a.you ? -1 : 1));
    list.forEach((e, i) => (e.rank = i + 1));
    return list;
  }
  const myRankWith = (best) => { const l = dailyLeaderboard(best); return l.find((e) => e.you).rank; };

  // ── 부산 랜드마크 구간 목표 ──
  function checkLandmarks() {
    const m = state.distance / C.pxPerMeter;
    while (state.landmarkIdx < C.landmarks.length && m >= C.landmarks[state.landmarkIdx].m) {
      const lm = C.landmarks[state.landmarkIdx++];
      state.runCoins += lm.bonus;
      banner(lm.icon + ' ' + lm.name, lm.m + 'm 돌파!  +' + lm.bonus + '🪙', '#ffd34d'); sfx('coin');
    }
  }
  // ── 배너(미션/랜드마크 알림) ──
  function banner(title, sub, color) {
    const b = document.getElementById('banner'); if (!b) return;
    const t = document.getElementById('bannerTitle'), s = document.getElementById('bannerSub');
    if (t) t.textContent = title; if (s) s.textContent = sub || '';
    b.style.borderColor = color || '#A7D500';
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('show'), 1900);
  }

  /* ───────────────────────── 캔버스 ───────────────────────── */
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1, petX = 0, skyGrad = null;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    petX = W * C.petScreenXRatio;
    buildSky();
    snapCamera();
  }
  function buildSky() {
    skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0.00, '#6f8fb5');  // 페리윙클
    skyGrad.addColorStop(0.42, '#c89a96');  // 더스티 로즈
    skyGrad.addColorStop(0.70, '#efb482');  // 따뜻한 피치
    skyGrad.addColorStop(0.92, '#f7cf92');  // 수평선 샌드
  }

  /* ───────────────── World / Terrain ─────────────────
     화면좌표계(아래가 +). 지형 표면 worldY = -terrainHeight(x).
     평균 지형은 worldY≈0 부근, 카메라가 펫을 화면 petTargetY에 맞춤. */
  function terrainHeight(x) {
    return Math.sin(x / C.terrainWave1 * TAU + TP.p1) * C.terrainAmp1
         + Math.sin(x / C.terrainWave2 * TAU + TP.p2) * C.terrainAmp2
         + Math.sin(x / C.terrainWave3 * TAU + TP.p3) * C.terrainAmp3;
  }
  const surfWorldY = (x) => -terrainHeight(x);            // 지형 표면 (월드 y)
  const groundCenterY = (x) => surfWorldY(x) - C.petRadius; // 그 위에 선 펫 중심
  function terrainSlope(x) {
    const e = 6;
    return Math.atan2(surfWorldY(x + e) - surfWorldY(x - e), 2 * e);
  }
  // 그늘 강도 0..1 (1=완전 그늘). 단계4에서 시드/구조물(가로수·고가도로·터널·구름)로 확장.
  function shadeAt(x) {
    const P = C.shadePeriod;
    const ph = ((((x + TP.shade * P) % P) + P) % P) / P;
    const [a, b] = C.shadeBand, f = C.shadeFeather;
    if (ph < a - f || ph > b + f) return 0;
    if (ph < a) return (ph - (a - f)) / f;
    if (ph > b) return 1 - (ph - b) / f;
    return 1;
  }

  /* ───────────────────────── 상태 ───────────────────────── */
  const input = { held: false };
  const player = {
    worldY: 0, vy: 0, grounded: true, doubleJumped: false,
    rot: 0, flipAccum: 0, flipping: false,
    squashX: 1, squashY: 1, legPhase: 0,
    boost: 0, stumble: 0, coyote: 0, buffer: 0,
  };
  const state = {
    t: 0, speed: C.baseSpeed, distance: 0, worldX: 0, camY: 0,
    shake: 0, started: false, lastLanding: '', flashClean: 0, flashStumble: 0,
    phase: 'home', heat: 0, shade: 0, coolFlash: 0, deathT: 0, cardT: 0, deathReason: 'heat',
    flipCount: 0, sunMult: 1, bandName: '새벽', runCoins: 0,
    waterCount: 0, shadeTime: 0, cleanCombo: 0, maxCleanCombo: 0, landmarkIdx: 0, rampage: 0,
    combo: 0, comboTimer: 0, comboBest: 0, comboPopT: 0,
  };
  const particles = [];
  const water = [];          // 물/이온음료 픽업
  let nextWaterSlot = 0;
  const coins = [];          // 코인 픽업(메타 화폐)
  let nextCoinSlot = 0;
  const obstacles = [];      // 장애물(부딪히면 충돌사)
  let nextObstacleSlot = 0, lastObstacleX = -9999;
  const gaps = [];           // 균열(빠지면 추락사)
  let nextGapSlot = 0;
  const powers = [];         // 파워 부스트(먹으면 폭주 모드)
  let nextPowerSlot = 0, powersSpawnedCount = 0;
  let realTemp = null, weatherMult = 1;   // 실제 부산 기온 연동

  function snapCamera() {
    player.worldY = groundCenterY(state.worldX);
    state.camY = player.worldY - H * C.petTargetYRatio;
  }

  /* ───────────────────────── 입력 ───────────────────────── */
  const canJump = () => player.grounded || player.coyote > 0;
  function beginFlip() {
    if (player.grounded || player.flipping) return;
    player.flipping = true;
    const kick = C.flipTapKick || 0;
    if (kick > 0 && player.flipAccum < kick) {
      player.rot += kick;
      player.flipAccum = kick;
    }
    sparkle(3);
  }
  function addCombo(n) {
    const prev = state.combo;
    state.combo += n; state.comboTimer = C.comboWindow; state.comboPopT = 1;
    if (state.combo > state.comboBest) state.comboBest = state.combo;
    // 마일스톤(5,10,15…) 넘을 때 보너스 코인 + 연출
    const before = Math.floor(prev / C.comboMilestone), after = Math.floor(state.combo / C.comboMilestone);
    if (after > before) { state.runCoins += C.comboMilestoneCoin; banner('🔥 ' + (after * C.comboMilestone) + ' 콤보!', '+' + C.comboMilestoneCoin + '🪙', '#ff7a59'); sfx('flip', 2); }
  }
  function restartFromDead() {
    if (state.phase === 'dead') startRun();
  }
  function onDown() {
    ensureAudio();
    if (state.phase === 'home' || state.phase === 'dying') return;  // 차고/슬로모 중 입력 무시
    if (state.phase === 'dead') { restartFromDead(); return; } // 결과 카드 → 탭 재시작
    input.held = true;
    if (!state.started) { state.started = true; hideHint(); }
    if (canJump()) doJump();
    else if (!player.grounded && !player.doubleJumped) {
      player.doubleJumped = true;
      player.vy = C.doubleJumpVel * gearJumpMult();   // 공중 두 번째 탭 = 더블 점프(위로!)
      player.squashY = 1 + C.takeoffStretch; player.squashX = 1 - C.takeoffStretch * 0.6;
      spawnDust(C.dustOnTakeoff, 0.5);
      beginFlip();                                    // + 플립 회전
      sfx('jump');
    }
  }
  function onUp() { input.held = false; }

  function resetRun() {
    Object.assign(state, { t: 0, speed: C.baseSpeed, distance: 0, worldX: 0,
      shake: 0, started: true, lastLanding: '', flashClean: 0, flashStumble: 0,
      phase: 'running', heat: 0, shade: 0, coolFlash: 0, deathT: 0, cardT: 0, deathReason: 'heat',
      flipCount: 0, sunMult: 1, bandName: '새벽', runCoins: 0,
      waterCount: 0, shadeTime: 0, cleanCombo: 0, maxCleanCombo: 0, landmarkIdx: 0, rampage: 0,
      combo: 0, comboTimer: 0, comboBest: 0, comboPopT: 0 });
    Object.assign(player, { vy: 0, grounded: true, doubleJumped: false, rot: 0, flipAccum: 0, flipping: false,
      squashX: 1, squashY: 1, legPhase: 0, boost: 0, stumble: 0, coyote: 0, buffer: 0 });
    particles.length = 0; water.length = 0; nextWaterSlot = 0; coins.length = 0; nextCoinSlot = 0;
    obstacles.length = 0; nextObstacleSlot = 0; lastObstacleX = -9999; gaps.length = 0; nextGapSlot = 0;
    powers.length = 0; nextPowerSlot = 0; powersSpawnedCount = 0;
    snapCamera();
    const dead = document.getElementById('dead'); if (dead) dead.classList.remove('show');
    const home = document.getElementById('home'); if (home) home.classList.remove('show');
  }
  const bestKey = () => 'hr-best-' + SEED;
  const DEATH_INFO = { heat: ['🥵', '열사병!'], fall: ['🕳️', '추락!'], crash: ['💥', '충돌!'] };
  function die(reason) {
    if (state.phase !== 'running') return;
    state.phase = 'dying'; state.deathReason = reason || 'heat'; state.deathT = 0; input.held = false;
    state.shake = Math.max(state.shake, C.shakeHard);
    sfx(reason === 'heat' ? 'death' : 'crash');
  }
  function finalizeDeath() {
    state.phase = 'dead'; state.cardT = 0;
    const dist = Math.floor(state.distance / C.pxPerMeter);
    const bonus = C.coinDistBonusPer > 0 ? Math.floor(state.distance / C.coinDistBonusPer) : 0;
    const earned = state.runCoins + bonus;
    meta.coins += earned;
    let best = 0; try { best = parseInt(localStorage.getItem(bestKey()) || '0', 10) || 0; } catch (e) {}
    const oldRank = myRankWith(best);
    const isBest = dist > best; if (isBest) { try { localStorage.setItem(bestKey(), String(dist)); } catch (e) {} best = dist; }
    const newRank = myRankWith(best);
    saveMeta();
    const di = DEATH_INFO[state.deathReason] || DEATH_INFO.heat;
    setText('deadEmoji', di[0]); setText('deadTitle', di[1]);
    setText('deadDist', dist + ' ');
    setText('deadBest', '오늘 최고  ' + best + 'm');
    setText('deadRank', newRank < oldRank ? ('🏆 ' + oldRank + '위 → ' + newRank + '위 🔼') : ('🏆 오늘 순위 ' + newRank + '위'));
    setText('deadCoins', '🪙 +' + earned + '   (보유 ' + meta.coins + ')');
    setText('deadFlips', '플립 ' + state.flipCount + '회  ·  최대 🔥' + state.comboBest + ' 콤보');
    // 미션 진행(가장 가까운 미완료의 현재/목표 → "거의 다 됐는데" 동기)
    const doneN = missionDone.filter(Boolean).length;
    let mProg = '🎯 미션 ' + doneN + '/3';
    const fi = todaysMissions.findIndex((m, i) => !missionDone[i]);
    if (fi >= 0) { const m = todaysMissions[fi]; mProg += '  ·  [' + m.tier + '] ' + Math.min(missionValue(m.metric), m.goal) + '/' + m.goal; }
    setText('deadMissions', mProg);
    // 다음 해금까지 — "한 판 더" 동기
    const u = nextUnlock();
    setText('deadUnlock', u ? (u.need === 0 ? ('🔓 ' + u.name + ' 해금 가능!') : ('🔓 ' + u.name + '까지 ' + u.need + '🪙')) : '🔓 모두 해금 완료! 🎉');
    const nb = document.getElementById('deadNewBest'); if (nb) nb.style.display = isBest ? 'block' : 'none';
    const dead = document.getElementById('dead'); if (dead) dead.classList.add('show');
  }
  function setText(id, t) { const e = document.getElementById(id); if (e) { if (e.firstChild && e.firstChild.nodeType === 3) e.firstChild.nodeValue = t; else e.textContent = t; } }

  /* ── 차고(홈): 코인·장비 해금/장착·시작 ── */
  function showHome() {
    state.phase = 'home';
    const dead = document.getElementById('dead'); if (dead) dead.classList.remove('show');
    buildHome();
    const home = document.getElementById('home'); if (home) home.classList.add('show');
  }
  function nextUnlock() {
    let cheap = Infinity, name = '';
    for (const id in C.gearCost) if (meta.owned.indexOf(id) < 0 && C.gearCost[id] < cheap) { cheap = C.gearCost[id]; name = EQUIP[id].name; }
    for (const sk of SKINS) if (meta.ownedSkins.indexOf(sk.key) < 0 && sk.cost < cheap) { cheap = sk.cost; name = sk.name; }
    return cheap === Infinity ? null : { name, need: Math.max(0, cheap - meta.coins), cost: cheap };
  }
  function buildHome() {
    setText('homeCoins', '🪙 ' + meta.coins);
    setText('homeSeed', '오늘의 폭염 #' + SEED);
    updateWeatherUI();
    // 오늘의 도전 1개 (첫 미완료 미션 → 다 했으면 다음 해금)
    const goalEl = document.getElementById('homeGoal');
    if (goalEl) {
      const fi = todaysMissions.findIndex((m, i) => !missionDone[i]);
      if (fi >= 0) { const m = todaysMissions[fi]; goalEl.innerHTML = '🎯 <b>오늘의 도전</b> · [' + m.tier + '] ' + m.desc + ' <b>+' + m.reward + '🪙</b>'; }
      else { const u = nextUnlock(); goalEl.innerHTML = u ? ('✅ 미션 완료! <b>' + u.name + '</b>까지 <b>' + u.need + '🪙</b>') : '🎉 <b>오늘 미션·해금 완료!</b> 최고 기록에 도전!'; }
    }
    const grid = document.getElementById('gearGrid'); if (!grid) return;
    grid.innerHTML = '';
    for (const id in EQUIP) {
      const g = EQUIP[id], cost = C.gearCost[id] || 0;
      const owned = meta.owned.indexOf(id) >= 0, on = equipped.has(id);
      const card = document.createElement('button');
      card.className = 'gcard' + (on ? ' on' : '') + (owned ? '' : ' locked');
      let status = on ? '장착중' : owned ? '장착하기' : (meta.coins >= cost ? ('해금 ' + cost + '🪙') : ('🔒 ' + cost + '🪙'));
      card.innerHTML = '<div class="gi">' + g.icon + '</div><div class="gn">' + g.name + '</div>'
        + '<div class="ge">' + g.spec + ' · ' + g.effect + '</div><div class="gs">' + status + '</div>';
      card.addEventListener('click', (e) => { e.stopPropagation(); onGearCard(id); });
      grid.appendChild(card);
    }
    const sk = document.getElementById('skinGrid');
    if (sk) {
      sk.innerHTML = '';
      SKINS.forEach((s) => {
        const owned = meta.ownedSkins.indexOf(s.key) >= 0, on = meta.skin === s.key;
        const card = document.createElement('button');
        card.className = 'scard' + (on ? ' on' : '') + (owned ? '' : ' locked');
        const status = on ? '착용중' : owned ? '착용' : (meta.coins >= s.cost ? (s.cost + '🪙') : ('🔒' + s.cost));
        card.innerHTML = '<div class="sdot" style="background:' + s.body + '"></div><div class="sn">' + s.name + '</div><div class="ss">' + status + '</div>';
        card.addEventListener('click', (e) => { e.stopPropagation(); onSkinCard(s.key); });
        sk.appendChild(card);
      });
    }
    const lb = document.getElementById('lbList');
    if (lb) {
      let best = 0; try { best = parseInt(localStorage.getItem(bestKey()) || '0', 10) || 0; } catch (e) {}
      lb.innerHTML = '';
      dailyLeaderboard(best).forEach((e) => {
        const row = document.createElement('div');
        row.className = 'lbrow' + (e.you ? ' you' : '');
        const medal = e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : (e.rank + '위');
        row.innerHTML = '<span class="lbr">' + medal + '</span><span class="lbn">' + (e.you ? '🏃 나' : e.name) + '</span><span class="lbd">' + e.dist + 'm</span>';
        lb.appendChild(row);
      });
    }
    const ml = document.getElementById('missionList');
    if (ml) {
      ml.innerHTML = '';
      todaysMissions.forEach((m, i) => {
        const done = missionDone[i];
        const row = document.createElement('div');
        row.className = 'mrow' + (done ? ' done' : '');
        row.innerHTML = '<span class="mck">' + (done ? '✓' : '🎯') + '</span>'
          + '<span class="mdesc"><b>[' + m.tier + ']</b> ' + m.desc + '</span>'
          + '<span class="mrew">' + (done ? '완료' : '+' + m.reward + '🪙') + '</span>';
        ml.appendChild(row);
      });
    }
  }
  function shareResult() {
    const dist = Math.floor(state.distance / C.pxPerMeter);
    const text = '[부산 폭염 러너 🏃🔥] 오늘의 폭염 #' + SEED + ' — ' + dist + 'm 주파! 🪙' + meta.coins + ' · SUMMERTECT. 너도 도전!';
    try {
      if (navigator.share) { navigator.share({ title: '부산 폭염 러너', text }).catch(() => {}); return; }
      if (navigator.clipboard) { navigator.clipboard.writeText(text).then(() => banner('📋 복사 완료', '붙여넣어 공유하세요', '#74c7ec')).catch(() => {}); return; }
    } catch (e) {}
    banner('📤 공유', dist + 'm · #' + SEED, '#74c7ec');
  }
  function equipSlot(id) {                 // 같은 슬롯 장비는 1개만 — 교체 장착(슬롯 선택형)
    const slot = EQUIP[id] && EQUIP[id].slot;
    for (const eid of [...equipped]) if (EQUIP[eid] && EQUIP[eid].slot === slot) equipped.delete(eid);
    equipped.add(id);
  }
  function onGearCard(id) {
    const cost = C.gearCost[id] || 0;
    const owned = meta.owned.indexOf(id) >= 0;
    if (!owned) {
      if (meta.coins < cost) { sfx('stumble'); return; }     // 코인 부족
      meta.coins -= cost; meta.owned.push(id); equipSlot(id); sfx('flip', 1);
    } else {
      if (equipped.has(id)) equipped.delete(id); else { equipSlot(id); sfx('clean'); }
    }
    meta.equipped = [...equipped]; saveMeta(); buildHome();
  }
  function onSkinCard(key) {
    const s = SKINS.find((k) => k.key === key); if (!s) return;
    const owned = meta.ownedSkins.indexOf(key) >= 0;
    if (!owned) { if (meta.coins < s.cost) { sfx('stumble'); return; } meta.coins -= s.cost; meta.ownedSkins.push(key); meta.skin = key; sfx('flip', 1); }
    else { meta.skin = key; sfx('clean'); }
    saveMeta(); buildHome();
  }
  function startRun() { resetRun(); state.phase = 'running'; hideHint(); }

  function doJump() {
    player.vy = C.jumpVel * gearJumpMult();   // 런쇼츠 = 점프 +10%
    player.grounded = false;
    player.coyote = 0;
    player.doubleJumped = false;              // 새 점프마다 더블 점프 1회 충전
    player.flipAccum = 0;
    player.flipping = false;
    player.squashY = 1 + C.takeoffStretch;
    player.squashX = 1 - C.takeoffStretch * 0.6;
    spawnDust(C.dustOnTakeoff, 0.6);
    sfx('jump');
  }

  function land() {
    const cy = groundCenterY(state.worldX);
    const impact = player.vy;
    player.worldY = cy; player.vy = 0; player.grounded = true;
    const slope = terrainSlope(state.worldX);

    let clean, flips = 0, perfect = false;
    if (player.flipping) {
      // 플립은 항상 성공(자동 업라이트, 휘청 없음). 착지 순간 자연스럽게 업라이트면 PERFECT(추가 보상).
      let norm = (player.rot - slope) % TAU;
      if (norm > Math.PI) norm -= TAU; if (norm < -Math.PI) norm += TAU;
      flips = Math.max(1, Math.round(player.flipAccum / TAU));
      clean = true;
      perfect = Math.abs(norm) <= C.perfectLandTolerance;
    } else {
      // 일반 점프: 거의 항상 클린(경사 정렬)
      let norm = (player.rot - slope) % TAU;
      if (norm > Math.PI) norm -= TAU; if (norm < -Math.PI) norm += TAU;
      clean = Math.abs(norm) <= C.cleanLandTolerance;
    }

    const sq = clamp(impact / 2200 * C.landSquashMax + 0.12, 0.12, C.landSquashMax);
    player.squashY = 1 - sq; player.squashX = 1 + sq * 0.85;
    spawnDust(C.dustOnLandBase + Math.round(Math.abs(impact) / 110), 1);

    if (clean) {
      player.boost += C.cleanBoost * (1 + flips * C.flipBoostMul);
      state.flashClean = 1;
      state.lastLanding = flips > 0 ? ('FLIP ×' + flips) : 'CLEAN';
      sfx(flips > 0 ? 'flip' : 'clean', flips);
      if (flips > 0) {
        sparkle(6 + flips * 3); state.distance += flips * C.flipScoreBonus * C.pxPerMeter; state.flipCount += flips; addCombo(flips);
        if (perfect) { state.runCoins += C.perfectCoin; player.boost += C.cleanBoost; addCombo(1); state.lastLanding = 'PERFECT ×' + flips; sparkle(8); banner('✨ PERFECT!', '+' + C.perfectCoin + '🪙 · 부스트', '#A7D500'); }
      }
      state.cleanCombo++; if (state.cleanCombo > state.maxCleanCombo) state.maxCleanCombo = state.cleanCombo; // 미션: 연속 클린
    } else {
      state.speed *= (1 - C.stumblePenalty);
      player.stumble = C.stumbleRecover * gearStumbleRec();   // 카프 슬리브 = 회복 빠름
      state.flashStumble = 1;
      state.shake = Math.max(state.shake, C.shakeStumble);
      state.lastLanding = 'STUMBLE';
      sfx('stumble');
      state.cleanCombo = 0;
    }
    if (impact > C.minLandImpactForShake) state.shake = Math.max(state.shake, C.shakeHard * clamp(impact / 900, 0, 1.4));

    player.rot = slope; player.flipAccum = 0; player.flipping = false;
    if (player.buffer > 0) { player.buffer = 0; doJump(); }
  }

  /* ───────────────────────── 업데이트 ───────────────────────── */
  function update(dt) {
    if (state.phase === 'home') { return; }       // 차고: 월드 정지(배경만)
    if (state.phase === 'dead') {                 // 결과 카드: 정지, 파티클만
      state.cardT += dt;
      state.shake = Math.max(0, state.shake - C.shakeDecay * dt * 2);
      updateParticles(dt);
      return;
    }
    if (state.phase === 'dying') {                // 사망 슬로모 → 결과 카드
      state.deathT += dt;
      const slow = Math.max(0, 1 - state.deathT / C.deathSlowmo);
      const sdt = dt * slow * slow;
      state.worldX += state.speed * sdt;
      if (!player.grounded) {
        player.vy += C.gravity * sdt; player.worldY += player.vy * sdt;
        const cy = groundCenterY(state.worldX);
        if (player.worldY >= cy) { player.worldY = cy; player.vy = 0; player.grounded = true; }
      }
      const tc = player.worldY - H * C.petTargetYRatio;
      state.camY = lerp(state.camY, tc, 1 - Math.exp(-C.camFollow * dt));
      updateParticles(dt);
      if (state.deathT >= C.deathSlowmo) finalizeDeath();
      return;
    }

    state.t += dt;
    state.speed = Math.min(C.maxSpeed, state.speed + C.speedRampPerSec * dt);
    player.boost *= Math.exp(-C.boostDecay * dt);
    const eff = (state.speed + player.boost) * gearSpeedMult() * (state.rampage > 0 ? C.rampageSpeedMult : 1);  // 카프 슬리브 + 폭주 가속

    if (player.stumble > 0) player.stumble = Math.max(0, player.stumble - dt);
    if (player.coyote > 0) player.coyote = Math.max(0, player.coyote - dt);
    if (player.buffer > 0) player.buffer = Math.max(0, player.buffer - dt);

    state.worldX += eff * dt;
    if (state.rampage > 0) state.rampage = Math.max(0, state.rampage - dt);

    // ── 시간대 사이클(단계4): 거리에 따라 새벽→밤 순환, 정오=피크 ──
    updateBand();

    // ── 더위 관리: 햇볕(×시간대배수)=상승, 그늘=하강, 물=급랭, 만땅=열사병 ──
    const nowShade = shadeAt(state.worldX);
    state.shade = nowShade;
    const ramp = 1 + (state.distance / C.pxPerMeter / 1000) * C.heatRampPer1000m; // 거리에 따른 난이도 상승
    // 장비: Flexer 캡 = 햇볕 -20%, Frosty 게이터 = 항시 냉각
    const coolMult = clamp(1 / weatherMult, 0.65, 1.35); // 더운 날=그늘도 덜 식음 / 시원한 날=더 식음
    let dHeat = state.rampage > 0 ? -C.rampageHeatDrain : ((1 - nowShade) * C.heatSunRate * state.sunMult * ramp * weatherMult * gearSunMult() - nowShade * C.heatShadeRate * coolMult - gearCoolPerSec());
    if (state.t < C.heatStartGrace && dHeat > 0) dHeat *= state.t / C.heatStartGrace; // 시작 유예
    state.heat = clamp(state.heat + dHeat * dt, 0, C.heatMax);
    const enteredShade = nowShade > 0.45;
    if (enteredShade && !state._wasShade) { state.coolFlash = Math.max(state.coolFlash, 0.7); sfx('shade'); }
    state._wasShade = enteredShade;
    state.coolFlash = Math.max(0, state.coolFlash - dt * 2);

    if (nowShade > 0.5) state.shadeTime += dt;     // 미션: 그늘 생존
    updateGaps();
    updateObstacles();      // 충돌 시 내부에서 die('crash')
    if (state.phase !== 'running') return;
    updateWater(dt);
    updateCoins(dt);
    updatePowers();
    checkLandmarks();
    checkMissions();
    if (state.rampage <= 0 && state.heat >= C.heatMax) { die('heat'); return; }

    if (state.rampage <= 0 && player.grounded && inGap(state.worldX)) { player.grounded = false; player.vy = Math.max(player.vy, 30); } // 균열 위 → 추락(폭주 중엔 무시)
    if (player.grounded) {
      player.vy = 0;
      player.worldY = groundCenterY(state.worldX);          // 지형 따라감
      if (state.rampage > 0) player.rot += C.rampageSpin * dt; // 폭주: 굴러가기
      else player.rot = approach(player.rot, terrainSlope(state.worldX), dt * 12); // 경사 정렬
      player.legPhase += eff * dt * C.legCycle;
    } else {
      player.vy += C.gravity * dt;
      player.worldY += player.vy * dt;
      // 플립은 첫 점프 홀드가 아니라 공중의 두 번째 탭에서만 래치된다.
      if (player.flipping) {
        player.rot += C.flipSpeed * dt;
        player.flipAccum += C.flipSpeed * dt;
      } else {
        player.rot = approach(player.rot, 0, dt * 10);       // 안 돌릴 땐 업라이트 유지
      }
      if ((state.rampage > 0 || !inGap(state.worldX)) && player.worldY >= groundCenterY(state.worldX)) land();  // 폭주 중엔 균열 위에서도 착지(굴러 통과)
      if (state.rampage <= 0 && player.worldY > groundCenterY(state.worldX) + 150) { die('fall'); return; }      // 추락사(폭주 중 무적)
    }

    const k = Math.min(1, dt * C.squashSpring);
    player.squashX = lerp(player.squashX, 1, k);
    player.squashY = lerp(player.squashY, 1, k);

    state.distance += eff * dt;

    // 카메라: 펫 worldY를 화면 petTargetY로 부드럽게 추적
    const targetCam = player.worldY - H * C.petTargetYRatio;
    state.camY = lerp(state.camY, targetCam, 1 - Math.exp(-C.camFollow * dt));

    state.shake = Math.max(0, state.shake - (C.shakeDecay * state.shake * 0.6 + C.shakeDecay * 0.3) * dt);
    state.flashClean = Math.max(0, state.flashClean - dt * 2.2);
    state.flashStumble = Math.max(0, state.flashStumble - dt * 2.6);
    if (state.comboTimer > 0) { state.comboTimer -= dt; if (state.comboTimer <= 0) state.combo = 0; } // 콤보 만료
    if (state.comboPopT > 0) state.comboPopT = Math.max(0, state.comboPopT - dt * 3);

    setWind(eff);
    updateParticles(dt);
    updateHUD();
  }

  /* ───────────────────────── 파티클 ───────────────────────── */
  function surfaceScreenY(x) { return surfWorldY(x) - state.camY; }
  function spawnDust(n, scale) {
    const fx = petX - C.petRadius * 0.3, fy = surfaceScreenY(state.worldX);
    for (let i = 0; i < n; i++) {
      const a = (Math.random() * 0.8 + 0.1) * Math.PI, sp = (30 + Math.random() * 90) * (scale || 1);
      particles.push({ x: fx + (Math.random() * 16 - 8), y: fy - Math.random() * 4,
        vx: -Math.cos(a) * sp - state.speed * 0.25, vy: -Math.sin(a) * sp * 0.7,
        life: 0.45 + Math.random() * 0.35, max: 0.8, r: 3 + Math.random() * 4, type: 'dust' });
    }
  }
  function sparkle(n) {
    const py = player.worldY - state.camY;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = 60 + Math.random() * 140;
      particles.push({ x: petX, y: py, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: 0.4 + Math.random() * 0.4, max: 0.8, r: 3 + Math.random() * 3, type: 'spark' });
    }
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += (p.type === 'dust' ? 320 : 120) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  /* ── 시간대 밴드: 거리(m)로 새벽→밤 순환, sky/sun 보간 ── */
  function updateBand() {
    const m = state.distance / C.pxPerMeter;
    const t = m / C.metersPerBand;
    const i = Math.floor(t) % TBANDS.length, frac = t - Math.floor(t);
    const a = TBANDS[i], b = TBANDS[(i + 1) % TBANDS.length];
    state.sunMult = lerp(a.sun, b.sun, frac);
    state.bandName = frac < 0.5 ? a.key : b.key;
    state._bandA = a; state._bandB = b; state._bandFrac = frac;
  }

  /* ── 물/이온음료 픽업: 결정적 슬롯 생성 + 획득 시 급랭 ── */
  function updateWater(dt) {
    const aheadX = state.worldX + (W - petX) + 240;
    while (nextWaterSlot * C.waterSpacing < aheadX) {
      const k = nextWaterSlot++;
      const x = k * C.waterSpacing + (hash01(k * 7 + 1) * 2 - 1) * C.waterJitter;
      if (x > 40) {
        const h = C.waterMinH + hash01(k * 7 + 3) * (C.waterMaxH - C.waterMinH);
        water.push({ x, y: surfWorldY(x) - h, got: false, pop: 0, bob: hash01(k * 7 + 5) * 6.283 });
      }
    }
    for (let i = water.length - 1; i >= 0; i--) {
      const w = water[i];
      if (w.got) { w.pop -= dt; if (w.pop <= 0) water.splice(i, 1); continue; }
      const dx = w.x - state.worldX, dy = w.y - player.worldY, rr = gearWaterRadius() + C.petRadius; // 헤어밴드=반경↑
      if (dx * dx + dy * dy < rr * rr) {
        w.got = true; w.pop = 0.4; state.waterCount++;
        state.heat = clamp(state.heat - gearWaterCool(), 0, C.heatMax);  // 헤어밴드=효과↑
        state.coolFlash = 1; waterPop(w.x, w.y); sfx('water');
      } else if (w.x < state.worldX - petX - 120) water.splice(i, 1);
    }
  }
  function waterPop(wx, wy) {
    const sx = petX + (wx - state.worldX), sy = wy - state.camY;
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * TAU, sp = 70 + Math.random() * 140;
      particles.push({ x: sx, y: sy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50, life: 0.4 + Math.random() * 0.35, max: 0.75, r: 3 + Math.random() * 3, type: 'water' });
    }
  }

  /* ── 코인 픽업: 결정적 슬롯 생성 + 획득 시 런코인 +1 ── */
  function updateCoins(dt) {
    const aheadX = state.worldX + (W - petX) + 240;
    while (nextCoinSlot * C.coinSpacing < aheadX) {
      const k = nextCoinSlot++;
      const x = k * C.coinSpacing + (hash01(k * 13 + 2) * 2 - 1) * C.coinJitter;
      if (x > 40) {
        const h = C.coinMinH + hash01(k * 13 + 4) * (C.coinMaxH - C.coinMinH);
        coins.push({ x, y: surfWorldY(x) - h, got: false, pop: 0, bob: hash01(k * 13 + 6) * 6.283 });
      }
    }
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      if (c.got) { c.pop -= dt; if (c.pop <= 0) coins.splice(i, 1); continue; }
      const dx = c.x - state.worldX, dy = c.y - player.worldY, rr = C.coinRadius + C.petRadius;
      if (dx * dx + dy * dy < rr * rr) {
        c.got = true; c.pop = 0.35; state.runCoins++; coinPop(c.x, c.y); sfx('coin'); addCombo(1);
      } else if (c.x < state.worldX - petX - 120) coins.splice(i, 1);
    }
  }
  function coinPop(wx, wy) {
    const sx = petX + (wx - state.worldX), sy = wy - state.camY;
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * TAU, sp = 60 + Math.random() * 120;
      particles.push({ x: sx, y: sy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50, life: 0.35 + Math.random() * 0.3, max: 0.65, r: 2.5 + Math.random() * 2.5, type: 'coin' });
    }
  }

  /* ── 균열(틈): 빠지면 추락. 점프로 건너야 함 ── */
  function inGap(x) { for (const g of gaps) if (x >= g.x && x <= g.x + g.w) return true; return false; }
  function updateGaps() {
    const aheadX = state.worldX + (W - petX) + 320;
    while (nextGapSlot * C.gapSpacing < aheadX) {
      const k = nextGapSlot++;
      const gx = k * C.gapSpacing + (hash01(k * 17 + 3) * 2 - 1) * C.gapJitter;
      if (gx > C.gapStartDist && hash01(k * 17 + 5) < C.gapChance) gaps.push({ x: gx, w: C.gapMinW + hash01(k * 17 + 7) * (C.gapMaxW - C.gapMinW) });
    }
    for (let i = gaps.length - 1; i >= 0; i--) if (gaps[i].x + gaps[i].w < state.worldX - petX - 240) gaps.splice(i, 1);
  }
  /* ── 장애물: 종류별 높이/폭이 달라 점프 타이밍이 다양해짐 ── */
  const OBSTACLE_TYPES = [
    { key: 'cone', w: 34, h: 52, wgt: 3 },     // 🚧 라바콘
    { key: 'rock', w: 44, h: 40, wgt: 3 },     // 🪨 바위(넓고 낮음)
    { key: 'parasol', w: 30, h: 80, wgt: 2 },  // ⛱️ 파라솔(높음 — 높이 점프)
    { key: 'chair', w: 50, h: 44, wgt: 2 },    // 🪑 캠핑의자(넓음)
    { key: 'sand', w: 54, h: 32, wgt: 2 },     // 🏰 모래성(낮고 넓음)
  ];
  const OBS_WSUM = OBSTACLE_TYPES.reduce((a, b) => a + b.wgt, 0);
  function updateObstacles() {
    const aheadX = state.worldX + (W - petX) + 320;
    while (nextObstacleSlot * C.obstacleSpacing < aheadX) {
      const k = nextObstacleSlot++;
      const ox = k * C.obstacleSpacing + (hash01(k * 19 + 1) * 2 - 1) * C.obstacleJitter;
      const nearGap = gaps.some((g) => ox > g.x - C.gapClearPx && ox < g.x + g.w + C.gapClearPx);
      if (ox > C.obstacleStartDist && hash01(k * 19 + 9) < C.obstacleChance && !inGap(ox) && !nearGap && ox - lastObstacleX >= C.minObstacleSpacing) {
        let r = hash01(k * 19 + 13) * OBS_WSUM, t = 0;
        for (let j = 0; j < OBSTACLE_TYPES.length; j++) { r -= OBSTACLE_TYPES[j].wgt; if (r <= 0) { t = j; break; } }
        obstacles.push({ x: ox, t }); lastObstacleX = ox;
      }
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i], T = OBSTACLE_TYPES[o.t];
      if (Math.abs(o.x - state.worldX) < T.w * 0.5 + C.petRadius * 0.55) {
        if (state.rampage > 0) { smashObstacle(o, i); continue; }                              // 폭주: 부숨
        if (player.worldY + C.petRadius * 0.55 > surfWorldY(o.x) - T.h) { die('crash'); return; } // 충분히 높지 않으면 충돌
      }
      if (o.x < state.worldX - petX - 240) obstacles.splice(i, 1);
    }
  }

  /* ── 파워 부스트: 먹으면 폭주 모드(무적+가속+파괴) ── */
  function updatePowers() {
    const aheadX = state.worldX + (W - petX) + 320;
    while (nextPowerSlot * C.powerSpacing < aheadX) {
      const k = nextPowerSlot++;
      const px = k * C.powerSpacing + (hash01(k * 23 + 1) * 2 - 1) * C.powerJitter;
      if (px > C.powerStartDist && !inGap(px)) {
        const ch = powersSpawnedCount === 0 ? 1 : C.powerChance;  // 첫 파워는 보장 등장(체험), 이후 드물게
        if (hash01(k * 23 + 3) < ch) { powers.push({ x: px, y: surfWorldY(px) - C.powerH, got: false, bob: hash01(k * 23 + 5) * 6.283 }); powersSpawnedCount++; }
      }
    }
    for (let i = powers.length - 1; i >= 0; i--) {
      const pw = powers[i];
      if (pw.got) { powers.splice(i, 1); continue; }
      const dx = pw.x - state.worldX, dy = pw.y - player.worldY, rr = C.powerRadius + C.petRadius;
      if (dx * dx + dy * dy < rr * rr) { pw.got = true; startRampage(); }
      else if (pw.x < state.worldX - petX - 200) powers.splice(i, 1);
    }
  }
  function startRampage() {
    state.rampage = C.rampageDuration;
    state.shake = Math.max(state.shake, 9);
    banner('⚡ 폭주 모드!', '몇 초간 무적 — 다 부순다!', '#ffd34d');
    sfx('power'); sparkle(16);
  }
  function smashObstacle(o, i) {
    const sx = petX + (o.x - state.worldX), sy = surfaceScreenY(o.x);
    for (let n = 0; n < 11; n++) {
      const a = Math.random() * TAU, sp = 110 + Math.random() * 200;
      particles.push({ x: sx, y: sy - 18, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90, life: 0.45 + Math.random() * 0.35, max: 0.8, r: 3 + Math.random() * 4, type: 'debris' });
    }
    obstacles.splice(i, 1);
    state.runCoins += C.smashCoin; state.shake = Math.max(state.shake, 6); sfx('smash'); addCombo(1);
  }

  /* ───────────────────────── 렌더 ───────────────────────── */
  function camVar() { return state.camY + H * C.petTargetYRatio; } // ≈ 펫 높이 변동(패럴랙스 수직용)

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (state.shake > 0.3) ctx.translate((Math.random() * 2 - 1) * state.shake, (Math.random() * 2 - 1) * state.shake);

    drawSky();
    drawSun();
    drawMotes();           // 떠다니는 빛 입자(분위기)
    drawClouds();          // 그늘 구름(그늘의 원천)
    drawParallaxFar();
    drawParallaxMid();
    drawParallaxNear();
    drawTerrain();
    drawObstacles();       // 장애물(라바콘/바위)
    drawShadow();
    drawWater();           // 물/이온음료 픽업
    drawCoins();           // 코인 픽업
    drawPowers();          // 파워 부스트
    drawParticles('dust');
    drawParticles('debris');
    if (state.rampage > 0) drawRampageAura();
    drawPet();
    drawParticles('spark');
    drawParticles('water');
    drawParticles('coin');
    drawFlipFx();          // 플립 중 회전 표시(라임 호) — 확실히 보이게
    drawCombo();           // 콤보 카운터 팝
    drawShade();           // 그늘 쿨 틴트(월드 위에)
    drawShimmer();         // 햇볕 아지랑이(더울 때)

    ctx.restore();
    drawVignette();
    if (state.rampage > 0) drawRampageHUD();
  }
  // ── 폭주 모드: 펫 둘레 불꽃 아우라 ──
  function drawRampageAura() {
    const cx = petX, cy = player.worldY - state.camY, r = C.petRadius * (1.7 + Math.sin(state.t * 30) * 0.12);
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.6);
    g.addColorStop(0, 'rgba(255,211,77,0.5)'); g.addColorStop(0.6, 'rgba(255,122,53,0.35)'); g.addColorStop(1, 'rgba(255,122,53,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 1.6, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // ── 폭주 모드: 화면 가장자리 글로우 + 남은 시간 바 ──
  function drawRampageHUD() {
    const a = Math.min(1, state.rampage / 0.6) * (0.35 + 0.15 * Math.sin(state.t * 24));
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.62);
    g.addColorStop(0, 'rgba(255,200,60,0)'); g.addColorStop(1, 'rgba(255,150,30,0.7)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    const bw = Math.min(W * 0.6, 320), x = (W - bw) / 2, y = H * 0.13, f = clamp(state.rampage / C.rampageDuration, 0, 1);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; roundRect(x, y, bw, 12, 6); ctx.fill();
    ctx.fillStyle = '#ffd34d'; roundRect(x, y, bw * f, 12, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 13px Pretendard, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('⚡ 폭주!', W / 2, y - 5);
    ctx.restore();
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  // ── 파워 부스트 픽업 (펄스 별/오브) ──
  function drawPowers() {
    for (const pw of powers) {
      const sx = petX + (pw.x - state.worldX); if (sx < -40 || sx > W + 40) continue;
      const y = (pw.y - state.camY) + Math.sin(state.t * 3 + pw.bob) * 5, pul = 1 + Math.sin(state.t * 8 + pw.bob) * 0.15;
      ctx.save();
      const g = ctx.createRadialGradient(sx, y, 2, sx, y, 30 * pul);
      g.addColorStop(0, 'rgba(255,231,120,0.85)'); g.addColorStop(0.5, 'rgba(255,180,60,0.4)'); g.addColorStop(1, 'rgba(255,150,30,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, y, 30 * pul, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd34d'; ctx.translate(sx, y); ctx.rotate(state.t * 3); star2(0, 0, 13 * pul, 6);
      ctx.fillStyle = '#fff7d0'; star2(0, 0, 6 * pul, 6);
      ctx.restore();
    }
  }
  function star2(cx, cy, r, n) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r * 0.45 : r, ang = (i / (n * 2)) * TAU - Math.PI / 2; const px = cx + Math.cos(ang) * rr, py = cy + Math.sin(ang) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fill();
  }

  // ── 그늘 구름: 그늘 구간 위쪽에 떠 있는 부드러운 구름(그늘의 원천) ──
  function drawClouds() {
    const P = C.shadePeriod, mid = (C.shadeBand[0] + C.shadeBand[1]) / 2;
    const leftWX = state.worldX - petX, rightWX = state.worldX + (W - petX);
    const n0 = Math.floor(leftWX / P) - 1, n1 = Math.ceil(rightWX / P) + 1;
    for (let n = n0; n <= n1; n++) {
      const cwx = (n + mid) * P;
      const sx = petX + (cwx - state.worldX);
      cloud(sx, H * 0.15 - camVar() * 0.05, Math.min(W, H) / 720);
    }
  }
  function cloud(x, y, s) {
    ctx.save(); ctx.globalAlpha = 0.85;
    const puffs = [[-70, 8, 38], [-30, -10, 50], [20, -14, 56], [70, -2, 44], [110, 12, 34]];
    for (const [dx, dy, r] of puffs) {
      const g = ctx.createRadialGradient(x + dx * s, y + dy * s, 2, x + dx * s, y + dy * s, r * s);
      g.addColorStop(0, 'rgba(236,238,246,0.95)'); g.addColorStop(1, 'rgba(214,220,236,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // ── 그늘 쿨 틴트: shadeAt>0 구간을 시원한 남색으로 살짝 덮음 ──
  function drawShade() {
    const step = 8;
    for (let sx = 0; sx < W; sx += step) {
      const sh = shadeAt(state.worldX + (sx - petX));
      if (sh <= 0.01) continue;
      ctx.fillStyle = 'rgba(38,56,104,' + (0.30 * sh).toFixed(3) + ')';
      ctx.fillRect(sx, 0, step + 1, H);
    }
  }

  // ── 아지랑이: 햇볕 + 더울 때 수평선 부근에 어른거림 ──
  function drawShimmer() {
    const heatF = clamp((state.heat - C.heatShimmerFrom) / (100 - C.heatShimmerFrom), 0, 1) * (1 - state.shade);
    if (heatF <= 0.02) return;
    ctx.save(); ctx.globalAlpha = heatF * 0.16;
    const t = state.t * 7;
    for (let i = 0; i < 7; i++) {
      const y = H * 0.5 + i * 20 + Math.sin(t + i * 0.9) * 4;
      ctx.fillStyle = 'rgba(255,250,235,0.6)'; ctx.fillRect(0, y, W, 2.5);
    }
    ctx.restore();
  }

  const _hx = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  function mix(c1, c2, t) { const a = _hx(c1), b = _hx(c2); return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`; }
  function drawSky() {
    const A = state._bandA || TBANDS[0], B = state._bandB || TBANDS[1], f = state._bandFrac || 0;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0.00, mix(A.sky[0], B.sky[0], f));
    g.addColorStop(0.55, mix(A.sky[1], B.sky[1], f));
    g.addColorStop(1.00, mix(A.sky[2], B.sky[2], f));
    ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
  }
  function drawSun() {
    const sx = W * 0.72, sy = H * 0.24 - camVar() * 0.04, r = Math.min(W, H) * 0.11;
    // 회전하는 햇살(god rays) — 낮엔 또렷, 밤엔 사라짐
    const dayBright = clamp(state.sunMult / 1.2, 0.15, 1);
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(state.t * 0.04); ctx.globalAlpha = 0.10 * dayBright;
    ctx.fillStyle = '#fff6d8';
    for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 4.2, -r * 0.5); ctx.lineTo(r * 4.2, r * 0.5); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    const g = ctx.createRadialGradient(sx, sy, r * 0.2, sx, sy, r * 3.4);
    g.addColorStop(0, 'rgba(255,248,225,0.95)'); g.addColorStop(0.18, 'rgba(255,236,190,0.55)'); g.addColorStop(1, 'rgba(255,220,160,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r * 3.4, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,250,235,0.96)'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fill();
  }
  // 떠다니는 빛 입자(먼지/열기) — 분위기
  const motes = (function () { const a = []; for (let i = 0; i < 26; i++) a.push({ x: hash01(i * 3 + 1), y: hash01(i * 3 + 2), s: 0.5 + hash01(i * 3 + 3) * 1.5, ph: hash01(i * 3 + 4) * 6.283 }); return a; })();
  function drawMotes() {
    ctx.save();
    for (const m of motes) {
      const x = ((m.x + state.t * 0.004 * m.s) % 1) * W;
      const y = (m.y * 0.7 + Math.sin(state.t * 0.4 + m.ph) * 0.02) * H;
      ctx.globalAlpha = 0.18 + 0.12 * Math.sin(state.t * 1.5 + m.ph);
      ctx.fillStyle = '#fff7e6';
      ctx.beginPath(); ctx.arc(x, y, m.s, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // ── 패럴랙스: 먼 도시 + 광안대교 ──
  // ── 구역: 거리에 따라 부산 명소로 배경이 바뀐다 ──
  const ZONES = ['도심', '온천천', '자갈치', '광안대교', '해운대', '감천문화마을', '다대포'];
  function currentZone() {
    const m = state.distance / C.pxPerMeter;
    if (m < 500) return 0; if (m < 1200) return 1; if (m < 2000) return 2;
    if (m < 3000) return 3; if (m < 4200) return 4; if (m < 5500) return 5; return 6;
  }
  function drawParallaxFar() {
    const scroll = state.worldX * C.parallaxFar, base = H * 0.56 - camVar() * 0.06, z = currentZone();
    ctx.fillStyle = 'rgba(150,158,186,0.42)';
    const patt = 1000, off = -(((scroll % patt) + patt) % patt);
    for (let bx = off - patt; bx < W + patt; bx += patt) {
      if (z === 3) farBridge(bx, base);
      else if (z === 2) farHarbor(bx, base);
      else if (z === 4) farHotels(bx, base);
      else if (z === 5) farGamcheon(bx, base);
      else if (z === 1 || z === 6) farHills(bx, base);
      else farSkyline(bx, base);
    }
  }
  function farSkyline(x, base) {
    const blds = [[20, 46, 90], [78, 34, 130], [120, 50, 70], [180, 40, 150], [232, 60, 100], [300, 38, 180], [350, 52, 120], [430, 44, 110], [600, 44, 110], [660, 36, 160], [712, 56, 80], [780, 40, 140], [860, 50, 100]];
    for (const [bx, bw, bh] of blds) ctx.fillRect(x + bx, base - bh, bw, bh + 40);
  }
  function farHills(x, base) { // 온천천/다대포 — 낮고 푸른 능선
    ctx.beginPath(); ctx.moveTo(x, base + 40);
    for (let i = 0; i <= 1000; i += 20) ctx.lineTo(x + i, base - (Math.sin(i / 150) * 28 + Math.sin(i / 60) * 8 + 14));
    ctx.lineTo(x + 1000, base + 40); ctx.closePath(); ctx.fill();
  }
  function farHarbor(x, base) { // 자갈치 — 갠트리 크레인 + 낮은 창고
    for (const bx of [40, 230, 470, 720]) { // 크레인
      ctx.fillRect(x + bx, base - 110, 6, 110); ctx.fillRect(x + bx - 30, base - 110, 90, 7); ctx.fillRect(x + bx + 54, base - 104, 5, 36);
    }
    for (const [bx, bw, bh] of [[100, 120, 40], [330, 140, 34], [560, 130, 46], [800, 150, 38]]) ctx.fillRect(x + bx, base - bh, bw, bh + 40);
  }
  function farBridge(x, base) { // 광안대교 — 큰 현수교
    const deckY = base - 18, span = 760, x0 = x + 120, towerH = 150;
    ctx.fillRect(x0, deckY, span, 9);
    ctx.fillRect(x0 + 130, deckY - towerH, 9, towerH); ctx.fillRect(x0 + span - 140, deckY - towerH, 9, towerH);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(150,158,186,0.42)';
    ctx.beginPath(); ctx.moveTo(x0, deckY); ctx.quadraticCurveTo(x0 + 135, deckY - towerH + 6, x0 + 135, deckY - towerH);
    ctx.moveTo(x0 + 135, deckY - towerH); ctx.quadraticCurveTo(x0 + span / 2, deckY + 30, x0 + span - 140, deckY - towerH);
    ctx.moveTo(x0 + span - 140, deckY - towerH); ctx.quadraticCurveTo(x0 + span - 140, deckY - towerH + 6, x0 + span, deckY); ctx.stroke();
  }
  function farHotels(x, base) { // 해운대 — 마린시티풍 고층 타워
    for (const [bx, bw, bh] of [[40, 40, 230], [110, 34, 300], [170, 46, 180], [260, 38, 260], [330, 30, 340], [400, 44, 210], [560, 36, 280], [630, 48, 200], [720, 34, 320], [800, 42, 240], [880, 36, 290]]) {
      ctx.fillRect(x + bx, base - bh, bw, bh + 40);
    }
  }
  function farGamcheon(x, base) { // 감천문화마을 — 비탈에 쌓인 알록달록 집
    const cols = ['rgba(120,150,190,0.5)', 'rgba(170,140,180,0.5)', 'rgba(190,170,120,0.5)', 'rgba(150,180,160,0.5)'];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 16; c++) {
      const bx = x + c * 62 + r * 14, by = base - 20 - r * 26 - (c % 2) * 6;
      if (((c + r) * 7) % 5 === 0) continue;
      ctx.fillStyle = cols[(c + r) % cols.length]; ctx.fillRect(bx, by, 40, 34);
    }
    ctx.fillStyle = 'rgba(150,158,186,0.42)';
  }

  // ── 패럴랙스: 중간 해안선 언덕 ──
  function drawParallaxMid() {
    const scroll = state.worldX * C.parallaxMid;
    const base = H * 0.60 - camVar() * 0.12;
    ctx.fillStyle = 'rgba(120,108,124,0.5)';
    ctx.beginPath(); ctx.moveTo(-20, H + 20);
    for (let sx = -20; sx <= W + 20; sx += 16) {
      const wx = sx + scroll;
      const y = base - (Math.sin(wx / 430) * 42 + Math.sin(wx / 175 + 1) * 16);
      ctx.lineTo(sx, y);
    }
    ctx.lineTo(W + 20, H + 20); ctx.closePath(); ctx.fill();
  }

  // ── 패럴랙스: 가까운 전경 (구역별) ──
  function drawParallaxNear() {
    const scroll = state.worldX * C.parallaxNear, base = H * 0.70 - camVar() * 0.2, z = currentZone();
    ctx.fillStyle = 'rgba(64,74,52,0.85)';
    ctx.beginPath(); ctx.moveTo(-20, H + 20); ctx.lineTo(-20, base);
    for (let sx = -20; sx <= W + 20; sx += 18) { const wx = sx + scroll; ctx.lineTo(sx, base - (Math.sin(wx / 260) * 14 + 6)); }
    ctx.lineTo(W + 20, H + 20); ctx.closePath(); ctx.fill();
    const patt = 340, off = -(((scroll % patt) + patt) % patt);
    for (let px = off - patt; px < W + patt; px += patt) {
      if (z === 4) { palm(px + 60, base - 4); palm(px + 210, base + 2, 0.85); }      // 해운대 야자수
      else if (z === 1 || z === 6) { reeds(px + 40, base); reeds(px + 150, base); reeds(px + 260, base); } // 온천천/다대포 갈대
      else if (z === 2) { crate(px + 50, base); crate(px + 180, base); crate(px + 300, base); }            // 자갈치 상자
      else if (z === 5) { houseBlock(px + 60, base); houseBlock(px + 200, base); }   // 감천 집
      else { bush(px + 70, base); bush(px + 220, base); }                            // 기본 덤불
    }
  }
  function palm(x, y, s) {
    s = s || 1; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(50,60,42,0.9)';
    ctx.fillRect(-3, -54, 6, 56);
    for (let i = -2; i <= 2; i++) { ctx.save(); ctx.translate(0, -54); ctx.rotate(i * 0.5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(26, -6, 44, 10); ctx.quadraticCurveTo(26, 2, 0, 6); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }
  function reeds(x, base) { ctx.fillStyle = 'rgba(60,72,48,0.9)'; for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(x + i * 5, base); ctx.rotate((i - 2) * 0.12 + Math.sin(state.t + x + i) * 0.05); ctx.fillRect(-1.5, -32 - i % 2 * 6, 3, 34); ctx.restore(); } }
  function crate(x, base) { ctx.fillStyle = 'rgba(70,64,50,0.92)'; ctx.fillRect(x, base - 22, 26, 24); ctx.fillRect(x + 28, base - 16, 20, 18); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x + 3, base - 19, 20, 4); }
  function houseBlock(x, base) { const cs = ['rgba(120,150,190,0.85)', 'rgba(180,150,180,0.85)', 'rgba(190,175,130,0.85)']; for (let i = 0; i < 3; i++) { ctx.fillStyle = cs[i]; ctx.fillRect(x + i * 22, base - 26 - i * 6, 22, 28 + i * 6); } }
  function bush(x, base) { ctx.fillStyle = 'rgba(54,64,44,0.9)'; ctx.beginPath(); ctx.arc(x, base, 16, Math.PI, 0); ctx.arc(x + 18, base, 12, Math.PI, 0); ctx.arc(x - 14, base, 11, Math.PI, 0); ctx.fill(); }

  // ── 플레이 지형 ──
  let _top = [];
  function drawTerrain() {
    _top.length = 0;
    const step = 10;
    for (let sx = -20; sx <= W + 20; sx += step) {
      const wx = state.worldX + (sx - petX);
      _top.push([sx, inGap(wx) ? (H + 160) : surfaceScreenY(wx)]);  // 균열 구간은 바닥으로 뚝 떨어뜨려 협곡 표현
    }
    // 채움 (grape)
    const gg = ctx.createLinearGradient(0, H * 0.4, 0, H);
    gg.addColorStop(0, '#46543b'); gg.addColorStop(1, '#2c3527');
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.moveTo(_top[0][0], H + 20);
    for (const [x, y] of _top) ctx.lineTo(x, y);
    ctx.lineTo(_top[_top.length - 1][0], H + 20); ctx.closePath(); ctx.fill();
    // 라임 표면 라인
    ctx.beginPath(); ctx.moveTo(_top[0][0], _top[0][1]);
    for (const [x, y] of _top) ctx.lineTo(x, y);
    ctx.lineWidth = 3; ctx.strokeStyle = '#A7D500'; ctx.lineJoin = 'round'; ctx.stroke();
  }

  function drawShadow() {
    const cy = groundCenterY(state.worldX);
    const h = cy - player.worldY;                 // 점프 높이
    const t = clamp(h / 320, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.28 * (1 - t * 0.6);
    ctx.fillStyle = '#1c241a';
    ctx.beginPath(); ctx.ellipse(petX, surfaceScreenY(state.worldX) + 3, C.petRadius * (1.25 - t * 0.55), C.petRadius * 0.3, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawParticles(kind) {
    for (const p of particles) {
      if (p.type !== kind) continue;
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = a;
      if (p.type === 'dust') { ctx.fillStyle = '#cdbfa6'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.6 + a * 0.6), 0, TAU); ctx.fill(); }
      else if (p.type === 'water') { ctx.fillStyle = '#74c7ec'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.6 + a * 0.6), 0, TAU); ctx.fill(); }
      else if (p.type === 'coin') { ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.6 + a * 0.6), 0, TAU); ctx.fill(); }
      else if (p.type === 'debris') { ctx.fillStyle = '#8a8070'; ctx.fillRect(p.x - p.r * 0.6, p.y - p.r * 0.6, p.r * 1.2, p.r * 1.2); }
      else { ctx.fillStyle = '#A7D500'; star(p.x, p.y, p.r * (0.5 + a)); }
    }
    ctx.globalAlpha = 1;
  }

  // ── 물/이온음료 픽업 렌더 ──
  function drawWater() {
    for (const w of water) {
      const sx = petX + (w.x - state.worldX), sy = w.y - state.camY;
      if (sx < -40 || sx > W + 40) continue;
      if (w.got) {
        const a = clamp(w.pop / 0.4, 0, 1);
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#74c7ec'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(sx, sy, (1 - a) * 38 + 8, 0, TAU); ctx.stroke(); ctx.restore();
        continue;
      }
      const y = sy + Math.sin(state.t * 3 + w.bob) * 4;
      ctx.save();
      const g = ctx.createRadialGradient(sx, y, 2, sx, y, 24);
      g.addColorStop(0, 'rgba(116,199,236,0.55)'); g.addColorStop(1, 'rgba(116,199,236,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, y, 24, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5bb6e0';
      ctx.beginPath(); ctx.moveTo(sx, y - 14); ctx.quadraticCurveTo(sx + 11, y - 2, sx + 8, y + 6);
      ctx.arc(sx, y + 6, 8, -0.45, Math.PI + 0.45); ctx.quadraticCurveTo(sx - 11, y - 2, sx, y - 14); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(sx - 3, y + 3, 2.6, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  // ── 장애물 렌더 (종류별) ──
  function drawObstacles() {
    for (const o of obstacles) {
      const T = OBSTACLE_TYPES[o.t], sx = petX + (o.x - state.worldX), sy = surfaceScreenY(o.x), w = T.w, h = T.h;
      if (sx < -60 || sx > W + 60) continue;
      ctx.save();
      ctx.globalAlpha = 0.22; ctx.fillStyle = '#1c241a';
      ctx.beginPath(); ctx.ellipse(sx, sy + 3, w * 0.6, w * 0.2, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      if (T.key === 'cone') {
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath(); ctx.moveTo(sx, sy - h); ctx.lineTo(sx - w * 0.5, sy); ctx.lineTo(sx + w * 0.5, sy); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(sx - w * 0.3, sy - h * 0.52, w * 0.6, 5);
        ctx.fillStyle = '#3d2c20'; ctx.fillRect(sx - w * 0.5, sy - 3, w, 4);
      } else if (T.key === 'rock') {
        ctx.fillStyle = '#5b5246';
        ctx.beginPath(); ctx.moveTo(sx - w * 0.55, sy); ctx.quadraticCurveTo(sx - w * 0.6, sy - h * 0.85, sx - w * 0.1, sy - h * 0.88);
        ctx.quadraticCurveTo(sx + w * 0.6, sy - h * 0.92, sx + w * 0.55, sy); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(sx - 4, sy - h * 0.55, w * 0.22, h * 0.16, -0.3, 0, TAU); ctx.fill();
      } else if (T.key === 'parasol') {
        ctx.strokeStyle = '#8a6f55'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy - h); ctx.stroke();
        const c = ['#ff6b6b', '#ffd34d']; for (let s2 = 0; s2 < 6; s2++) { ctx.fillStyle = c[s2 % 2]; ctx.beginPath(); ctx.moveTo(sx, sy - h); ctx.arc(sx, sy - h, w * 1.1, Math.PI + s2 * Math.PI / 6, Math.PI + (s2 + 1) * Math.PI / 6); ctx.closePath(); ctx.fill(); }
      } else if (T.key === 'chair') {
        ctx.fillStyle = '#3a7bd5';
        ctx.beginPath(); ctx.moveTo(sx - w * 0.4, sy); ctx.lineTo(sx - w * 0.1, sy - h); ctx.lineTo(sx + w * 0.45, sy - h); ctx.lineTo(sx + w * 0.2, sy - h * 0.5); ctx.lineTo(sx + w * 0.4, sy); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#2c3527'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx - w * 0.4, sy); ctx.lineTo(sx - w * 0.1, sy - h); ctx.moveTo(sx + w * 0.4, sy); ctx.lineTo(sx + w * 0.2, sy - h * 0.5); ctx.stroke();
      } else { // sand
        ctx.fillStyle = '#e0b878';
        ctx.beginPath(); ctx.moveTo(sx - w * 0.5, sy); ctx.lineTo(sx - w * 0.36, sy - h); ctx.lineTo(sx + w * 0.36, sy - h); ctx.lineTo(sx + w * 0.5, sy); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#cda35e'; ctx.fillRect(sx - w * 0.42, sy - h - 6, 7, 8); ctx.fillRect(sx + w * 0.42 - 7, sy - h - 6, 7, 8); ctx.fillRect(sx - 3, sy - h - 8, 7, 10);
      }
      ctx.restore();
    }
  }

  // ── 코인 픽업 렌더 (골드) ──
  function drawCoins() {
    for (const c of coins) {
      const sx = petX + (c.x - state.worldX), sy = c.y - state.camY;
      if (sx < -40 || sx > W + 40) continue;
      if (c.got) {
        const a = clamp(c.pop / 0.35, 0, 1);
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(sx, sy, (1 - a) * 34 + 8, 0, TAU); ctx.stroke(); ctx.restore();
        continue;
      }
      const y = sy + Math.sin(state.t * 3 + c.bob) * 4;
      const wob = Math.abs(Math.cos(state.t * 4 + c.bob));   // 납작해지며 회전하는 느낌
      ctx.save();
      const g = ctx.createRadialGradient(sx, y, 1, sx, y, 20);
      g.addColorStop(0, 'rgba(255,224,120,0.55)'); g.addColorStop(1, 'rgba(255,211,77,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, y, 20, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.ellipse(sx, y, 9 * (0.4 + 0.6 * wob), 9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e8b020'; ctx.beginPath(); ctx.ellipse(sx, y, 5 * (0.4 + 0.6 * wob), 5, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
  function star(x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.28, y - r * 0.28); ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.28, y + r * 0.28);
    ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.28, y + r * 0.28); ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.28, y - r * 0.28);
    ctx.closePath(); ctx.fill();
  }

  function drawPet() {
    const r = C.petRadius;
    const wob = player.stumble > 0 ? Math.sin(state.t * 38) * 0.13 * (player.stumble / C.stumbleRecover) : 0;
    ctx.save();
    ctx.translate(petX, player.worldY - state.camY);
    ctx.rotate(player.rot + wob);
    ctx.scale(player.squashX, player.squashY);

    const grounded = player.grounded;
    ctx.lineCap = 'round'; ctx.lineWidth = r * 0.30;
    const hips = [-r * 0.28, r * 0.34];
    for (let i = 0; i < 2; i++) {
      const ph = player.legPhase + i * Math.PI;
      const swing = grounded ? Math.sin(ph) * 0.55 : (-0.7 - i * 0.25);
      const hx = hips[i], hy = r * 0.55, len = grounded ? r * 0.7 : r * 0.55;
      const fx = hx + Math.sin(swing) * len, fy = hy + Math.cos(swing) * len;
      ctx.strokeStyle = '#e9a07a';
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(fx, fy); ctx.stroke();
      if (hasGear('calf_sleeve')) {                 // 카프 슬리브 (정강이 압박)
        ctx.strokeStyle = '#4895ef'; ctx.lineWidth = r * 0.32;
        ctx.beginPath(); ctx.moveTo(hx + Math.sin(swing) * len * 0.45, hy + Math.cos(swing) * len * 0.45); ctx.lineTo(fx, fy); ctx.stroke();
        ctx.lineWidth = r * 0.30;
      }
      if (hasGear('running_shoes')) {                 // 👟 러닝화: 크고 밑창 있는 신발
        ctx.save(); ctx.translate(fx + 2, fy + 3); ctx.rotate(swing);
        ctx.fillStyle = '#A7D500'; ctx.beginPath(); ctx.ellipse(0, -1, r * 0.27, r * 0.16, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, r * 0.08, r * 0.27, r * 0.07, 0, 0, TAU); ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = '#A7D500';
        ctx.beginPath(); ctx.ellipse(fx + 2, fy + 2, r * 0.18, r * 0.11, swing, 0, TAU); ctx.fill();
      }
    }
    ctx.fillStyle = skinColor();
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.18, r * 1.02, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.beginPath(); ctx.ellipse(r * 0.1, r * 0.18, r * 0.7, r * 0.62, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = skinColor();
    ctx.beginPath(); ctx.ellipse(-r * 0.55, -r * 0.82, r * 0.26, r * 0.34, -0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,150,150,0.55)';
    ctx.beginPath(); ctx.ellipse(r * 0.42, r * 0.28, r * 0.2, r * 0.15, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a3b39';
    ctx.beginPath(); ctx.arc(r * 0.55, -r * 0.12, r * 0.15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(r * 0.6, -r * 0.18, r * 0.05, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#b9645a'; ctx.lineWidth = r * 0.08;
    ctx.beginPath(); ctx.arc(r * 0.62, r * 0.06, r * 0.18, 0.1, 1.1); ctx.stroke();

    // ── 장비 시각 장착 (SUMMERTECT) ──
    if (hasGear('run_shorts')) {                 // 런쇼츠 (하의)
      ctx.fillStyle = '#3D4A35';
      ctx.beginPath(); ctx.ellipse(0, r * 0.52, r * 0.98, r * 0.52, 0, 0, Math.PI); ctx.fill();
    }
    if (hasGear('frosty_gaiter')) {              // 넥 게이터 (목)
      ctx.fillStyle = '#8ecae6';
      ctx.beginPath(); ctx.ellipse(r * 0.18, r * 0.34, r * 0.58, r * 0.22, 0, 0, TAU); ctx.fill();
    }
    if (hasGear('hairband')) {                   // 헤어밴드 (머리)
      ctx.fillStyle = '#ff6b9d';
      ctx.fillRect(-r * 0.25, -r * 0.52, r * 1.15, r * 0.16);
    }
    if (hasGear('flexer_cap')) {                 // Flexer 캡 (머리)
      ctx.fillStyle = '#2ec4b6';
      ctx.beginPath(); ctx.ellipse(r * 0.1, -r * 0.74, r * 0.72, r * 0.44, 0, Math.PI, TAU); ctx.fill();
      ctx.fillRect(r * 0.1, -r * 0.78, r * 1.0, r * 0.12);   // 챙(앞쪽)
      ctx.fillStyle = '#26a89b';
      ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.74, r * 0.1, 0, TAU); ctx.fill();
    }

    // 더울 때: 헥헥 벌어진 입 + 또르르 땀방울
    if (state.heat >= C.heatPantFrom) {
      const hp = clamp((state.heat - C.heatPantFrom) / (100 - C.heatPantFrom), 0, 1);
      ctx.fillStyle = '#a8453e';
      ctx.beginPath(); ctx.ellipse(r * 0.62, r * 0.12, r * (0.05 + 0.1 * hp), r * (0.04 + 0.08 * hp), 0, 0, TAU); ctx.fill();
      const dy = ((state.t * 1.6) % 1) * r * 0.55;
      ctx.fillStyle = 'rgba(159,214,255,0.95)';
      ctx.beginPath(); ctx.ellipse(r * 0.18, -r * 0.55 + dy, r * 0.09, r * 0.13, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // 플립 중 회전 호 — 펫 주위로 라임 호가 함께 돌아 회전이 또렷이 보임
  function drawFlipFx() {
    if (!player.flipping) return;
    const cx = petX, cy = player.worldY - state.camY, r = C.petRadius * 1.7;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(player.rot);
    ctx.strokeStyle = 'rgba(167,213,0,0.85)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, r, 0.35, Math.PI * 1.45); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r, Math.PI + 0.35, Math.PI * 2.45); ctx.stroke();
    ctx.restore();
  }
  // ── 콤보 카운터 (펫 위, 증가 시 팝) ──
  function drawCombo() {
    if (state.combo < 2) return;
    const cx = petX, cy = player.worldY - state.camY - C.petRadius * 2.1;
    const pop = 1 + state.comboPopT * 0.5;
    const col = state.combo >= 15 ? '#A7D500' : state.combo >= 10 ? '#ff7a59' : state.combo >= 5 ? '#ffd34d' : '#fff';
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop);
    ctx.font = '900 26px Anton, "Black Han Sans", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.strokeText('🔥' + state.combo, 0, 0);
    ctx.fillStyle = col; ctx.fillText('🔥' + state.combo, 0, 0);
    ctx.restore();
  }

  let _vig = null, _vigW = 0;
  function drawVignette() {
    // 은은한 시네마틱 비네트(항상) — Alto 톤 깊이감
    if (!_vig || _vigW !== W) { _vig = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.4, W / 2, H * 0.5, Math.max(W, H) * 0.75); _vig.addColorStop(0, 'rgba(20,18,30,0)'); _vig.addColorStop(1, 'rgba(20,18,30,0.30)'); _vigW = W; }
    ctx.fillStyle = _vig; ctx.fillRect(0, 0, W, H);
    // 더위 비네트: 체온↑ → 화면 가장자리 점점 붉게
    const hv = clamp((state.heat - C.heatShimmerFrom) / (100 - C.heatShimmerFrom), 0, 1);
    if (hv > 0.01) {
      ctx.save(); ctx.globalAlpha = hv * 0.6;
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.30, W / 2, H / 2, Math.max(W, H) * 0.62);
      g.addColorStop(0, 'rgba(200,40,40,0)'); g.addColorStop(1, 'rgba(190,28,28,0.85)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    // 그늘 진입: 시원한 파랑 플래시
    if (state.coolFlash > 0.01) {
      ctx.save(); ctx.globalAlpha = state.coolFlash * 0.35;
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
      g.addColorStop(0, 'rgba(120,200,255,0)'); g.addColorStop(1, 'rgba(90,170,255,0.6)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    if (state.flashClean > 0.01) {
      ctx.save(); ctx.globalAlpha = state.flashClean * 0.5;
      const g = ctx.createRadialGradient(petX, H * C.petTargetYRatio, 0, petX, H * C.petTargetYRatio, Math.max(W, H) * 0.5);
      g.addColorStop(0, 'rgba(167,213,0,0)'); g.addColorStop(1, 'rgba(167,213,0,0.6)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    if (state.flashStumble > 0.01) {
      ctx.save(); ctx.globalAlpha = state.flashStumble * 0.55;
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.62);
      g.addColorStop(0, 'rgba(200,40,40,0)'); g.addColorStop(1, 'rgba(180,30,30,0.7)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
  }

  /* ───────────────────────── HUD ───────────────────────── */
  const elDist = document.getElementById('dist');
  const elHint = document.getElementById('hint');
  const elTag = document.getElementById('landtag');
  const elHeat = document.getElementById('heatfill');
  const elBand = document.getElementById('bandlabel');
  const elGear = document.getElementById('gearlabel');
  const elCoins = document.getElementById('runcoins');
  const elMtrack = document.getElementById('mtracker');
  const MSHORT = { flips: '플립', water: '물', coins: '코인', shadeTime: '그늘', cleanCombo: '클린', distM: '거리' };
  function updateHUD() {
    if (elDist) elDist.firstChild.nodeValue = Math.floor(state.distance / C.pxPerMeter) + ' ';
    if (elHeat) elHeat.style.height = (state.heat / C.heatMax * 100).toFixed(1) + '%';
    if (elBand) elBand.textContent = '📍' + ZONES[currentZone()] + ' · ' + state.bandName + ' · #' + SEED + ' · build ' + BUILD;
    if (elGear) elGear.textContent = equipped.size ? ('🛡 ' + [...equipped].map((id) => EQUIP[id].name).join(' · ')) : '맨몸';
    if (elCoins) elCoins.textContent = '🪙 ' + state.runCoins;
    if (elMtrack) {
      elMtrack.innerHTML = todaysMissions.map((m, i) => {
        const v = missionValue(m.metric), done = missionDone[i] || v >= m.goal;
        return '<span class="' + (done ? 'md' : '') + '">' + (done ? '✓ ' : '') + MSHORT[m.metric] + ' ' + Math.min(v, m.goal) + '/' + m.goal + '</span>';
      }).join('<i>·</i>');
    }
    if (elTag) {
      if (state.lastLanding && (state.flashClean > 0.05 || state.flashStumble > 0.05)) {
        elTag.textContent = state.lastLanding;
        elTag.style.opacity = Math.max(state.flashClean, state.flashStumble);
        elTag.style.color = state.flashStumble > 0.05 ? '#ff6b6b' : '#A7D500';
      } else elTag.style.opacity = 0;
    }
  }
  function hideHint() { if (elHint) elHint.classList.add('hide'); }

  /* ───────────────────────── 사운드 ───────────────────────── */
  let actx = null;
  function ensureAudio() {
    if (!actx && C.sound) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (actx && actx.state === 'suspended') { try { actx.resume(); } catch (e) {} }
    if (actx && C.sound) { startMusic(); startWind(); }
  }
  function tone(freq, dur, type, vol, slideTo) {
    if (!C.sound || !actx) return;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, actx.currentTime + dur);
    g.gain.value = vol || 0.05; g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + dur);
  }
  function sfx(kind, n) {
    if (!C.sound) return;
    if (kind === 'jump') tone(420, 0.12, 'sine', 0.05, 760);
    else if (kind === 'clean') tone(660, 0.10, 'triangle', 0.05, 880);
    else if (kind === 'flip') { for (let i = 0; i <= (n || 1); i++) setTimeout(() => tone(700 + i * 140, 0.09, 'triangle', 0.05), i * 55); }
    else if (kind === 'stumble') tone(150, 0.22, 'sawtooth', 0.06, 80);
    else if (kind === 'shade') tone(880, 0.16, 'sine', 0.04, 1340);
    else if (kind === 'water') { tone(1050, 0.10, 'sine', 0.05, 1500); setTimeout(() => tone(720, 0.12, 'sine', 0.04, 520), 50); }
    else if (kind === 'coin') { tone(1320, 0.07, 'square', 0.035, 1760); }
    else if (kind === 'crash') { tone(200, 0.2, 'square', 0.07, 70); setTimeout(() => tone(120, 0.3, 'sawtooth', 0.06, 60), 60); }
    else if (kind === 'power') { for (let i = 0; i < 4; i++) setTimeout(() => tone(440 + i * 220, 0.1, 'square', 0.05, 660 + i * 220), i * 45); }
    else if (kind === 'smash') { tone(160, 0.12, 'square', 0.06, 90); }
    else if (kind === 'death') { tone(300, 0.5, 'sawtooth', 0.06, 90); setTimeout(() => tone(170, 0.6, 'sine', 0.05, 90), 120); }
  }

  /* ── 절차적 앰비언트 BGM (펜타토닉 패드+멜로디, 시간대 분위기) ── */
  let musicBus = null, musicFilter = null, musicTimer = null, musicStep = 0;
  const PENTA = [0, 2, 4, 7, 9, 12];
  const semiFreq = (s) => 220 * Math.pow(2, s / 12);
  function startMusic() {
    if (!actx || musicTimer || !C.sound) return;
    if (!musicBus) {
      musicBus = actx.createGain(); musicBus.gain.value = C.musicVol;
      musicFilter = actx.createBiquadFilter(); musicFilter.type = 'lowpass'; musicFilter.frequency.value = 1100;
      musicBus.connect(musicFilter); musicFilter.connect(actx.destination);
    }
    musicTimer = setInterval(bgmTick, C.bgmBeatMs);
  }
  function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }
  function mnote(semi, dur, peak, type) {
    const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
    o.type = type || 'triangle'; o.frequency.value = semiFreq(semi);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + Math.min(0.35, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function bgmTick() {
    if (!actx || !C.sound) { stopMusic(); return; }
    musicStep++;
    const bright = clamp(state.sunMult || 1, 0.35, 1.6);              // 정오 밝게/밤 어둡게
    const heatT = clamp(state.heat / C.heatMax, 0, 1);
    if (musicFilter) musicFilter.frequency.setTargetAtTime(600 + bright * 850 + heatT * 400, actx.currentTime, 0.25);
    // 시간대로 화음 루트 살짝 이동
    const bandShift = [-3, 0, 2, 0, -2, -5][Math.max(0, TBANDS.findIndex((b) => b.key === state.bandName))] || 0;
    const root = -12 + bandShift;
    if (musicStep % 4 === 0) { mnote(root, 1.9, 0.16, 'triangle'); mnote(root + 7, 1.9, 0.12, 'triangle'); mnote(root + 12, 1.9, 0.09, 'sine'); }
    // 멜로디: 더울수록(긴장) 더 자주
    if (Math.random() < 0.4 + heatT * 0.4) mnote(root + 12 + PENTA[Math.floor(Math.random() * PENTA.length)], 0.45, 0.10, 'sine');
  }

  /* ── 속도 바람소리 ── */
  let windSrc = null, windGain = null;
  function startWind() {
    if (!actx || windGain) return;
    try {
      const buf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      windSrc = actx.createBufferSource(); windSrc.buffer = buf; windSrc.loop = true;
      const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 550;
      windGain = actx.createGain(); windGain.gain.value = 0;
      windSrc.connect(lp); lp.connect(windGain); windGain.connect(actx.destination); windSrc.start();
    } catch (e) {}
  }
  function setWind(speed) {
    if (!windGain || !actx) return;
    const v = (!C.sound || state.phase !== 'running') ? 0 : clamp((speed - 300) / 600, 0, 1) * C.windVol;
    windGain.gain.setTargetAtTime(v, actx.currentTime, 0.15);
  }

  /* ───────────────────────── 루프 ───────────────────────── */
  let last = now(), raf = 0;
  function frame() {
    const t = now();
    let dt = (t - last) / 1000; last = t;
    dt = Math.min(dt, 1 / 30);
    if (dt > 0) update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  /* ───────────────────────── 부팅 ───────────────────────── */
  // 점프/플립 입력 키 판정 (code·key 둘 다 — 키보드 차이 대비)
  function isActionKey(e) { return e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ' || e.key === 'Spacebar'; }
  let spaceActive = false;
  function onKeyDown(e) {
    if (!isActionKey(e)) return;
    e.preventDefault();
    input.held = true;                 // 누르는 동안 홀드 유지 (autorepeat 무관)
    if (!spaceActive) { spaceActive = true; onDown(); } // 첫 눌림에만 점프/재시작
  }
  function onKeyUp(e) {
    if (!isActionKey(e)) return;
    spaceActive = false;
    input.held = false;
  }
  function bindInput() {
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      try { window.focus(); } catch (_) {}
      onDown();
    }, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    // 포커스 문제까지 대비해 document(capture) + window(bubble) 양쪽에 등록 (중복은 spaceActive로 방지)
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', resize);
    window.addEventListener('blur', () => { spaceActive = false; onUp(); });
    const mute = document.getElementById('mute');
    if (mute) mute.addEventListener('click', (e) => { e.stopPropagation(); C.sound = !C.sound; mute.textContent = C.sound ? '🔊' : '🔇'; if (C.sound) ensureAudio(); else { stopMusic(); setWind(0); } mute.blur(); });
    const homeStart = document.getElementById('homeStart');
    if (homeStart) homeStart.addEventListener('click', (e) => { e.stopPropagation(); ensureAudio(); startRun(); });
    const homeMore = document.getElementById('homeMore');
    if (homeMore) homeMore.addEventListener('click', (e) => { e.stopPropagation(); const d = document.getElementById('homeDetail'); if (!d) return; d.classList.toggle('show'); homeMore.textContent = d.classList.contains('show') ? '▲ 닫기' : '🛠 장비 · 스킨 · 순위 · 미션 ▾'; });
    // 결과 오버레이는 캔버스를 덮으므로, 오버레이 자체 탭으로 재시작 (버튼 제외)
    const deadOv = document.getElementById('dead');
    const onDeadRestart = (e) => {
      if (e.target.closest('button')) return;
      e.preventDefault();
      e.stopPropagation();
      restartFromDead();
    };
    if (deadOv) {
      deadOv.addEventListener('pointerdown', onDeadRestart, { passive: false });
      deadOv.addEventListener('click', onDeadRestart);
    }
    const deadHome = document.getElementById('deadHome');
    if (deadHome) deadHome.addEventListener('click', (e) => { e.stopPropagation(); showHome(); });
    const deadShare = document.getElementById('deadShare');
    if (deadShare) deadShare.addEventListener('click', (e) => { e.stopPropagation(); shareResult(); });
    try { window.focus(); } catch (_) {}
  }
  // ── 실제 부산 날씨(Open-Meteo, 무료·키 불필요·CORS OK) → 더위 배수 ──
  function fetchWeather() {
    try {
      fetch('https://api.open-meteo.com/v1/forecast?latitude=' + C.weatherLat + '&longitude=' + C.weatherLon + '&current=temperature_2m')
        .then((r) => r.json()).then((d) => {
          const t = d && d.current && d.current.temperature_2m;
          if (typeof t === 'number') {
            realTemp = t;
            weatherMult = clamp(1 + (t - C.weatherTempBase) * C.weatherTempScale, C.weatherMultMin, C.weatherMultMax);
            updateWeatherUI();
          }
        }).catch(() => {});
    } catch (e) {}
  }
  function updateWeatherUI() {
    const el = document.getElementById('homeWeather'); if (!el) return;
    if (realTemp == null) { el.textContent = ''; return; }
    const pct = Math.round((weatherMult - 1) * 100);
    el.textContent = '☀️ 오늘 부산 실제 ' + Math.round(realTemp) + '°C' + (pct >= 0 ? ' · 더위 +' + pct + '%' : ' · 더위 ' + pct + '%');
  }
  function init() {
    resize();
    snapCamera();
    bindInput();
    fetchWeather();          // 실제 부산 기온 가져오기
    showHome();              // 차고에서 시작
    last = now();
    raf = requestAnimationFrame(frame);
  }

  /* ── 디버그/테스트 핸들 ── */
  window.HR = {
    CONFIG: C, state, player, particles, water, coins, obstacles, gaps, powers, SEED, TBANDS, EQUIP, BUILD, meta, inGap,
    get equipped() { return equipped; },
    jump: () => onDown(), release: () => onUp(),
    step: (dt) => { update(dt || 1 / 60); draw(); },
    terrainHeight, surfWorldY, terrainSlope, groundCenterY, shadeAt, currentZone, ZONES,
    reset: () => resetRun(), startRun: () => startRun(), showHome: () => showHome(),
  };

  /* =====================================================================
     2단계 훅 — 미구현, 경계만. (메타 진행 / 공유 카드 / 데일리 리더보드)
     ===================================================================== */
  // window.HR.meta = MetaProgress;
  // window.HR.share = ShareCard;
  // window.HR.leaderboard = Daily;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
