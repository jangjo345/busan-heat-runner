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
  const BUILD = 30;           // 빌드 번호(캐시 확인용) — 화면 하단에 표시
  window.HR_BUILD = BUILD;

  /* ── 커스텀 아이콘(이모지 대체) ── 직접 디자인한 인라인 SVG. ic(name) → 텍스트 옆에 들어가는 svg 문자열 ── */
  const ICONS = {
    coin: () => '<circle cx="12" cy="12" r="9" fill="#f2c14e"/><circle cx="12" cy="12" r="6.4" fill="#dca42c"/><path d="M9 9.4c1.6-1.3 4.4-1.3 6 0" stroke="#fff4d2" stroke-width="1.3" stroke-linecap="round" fill="none"/>',
    drop: () => '<path d="M12 3c3.4 4.4 6 7.6 6 10.6A6 6 0 1 1 6 13.6C6 10.6 8.6 7.4 12 3z" fill="#5bb6e0"/><path d="M9.4 14.4a2.6 2.6 0 0 0 2.1 2.5" stroke="#dff1fb" stroke-width="1.3" stroke-linecap="round" fill="none"/>',
    shoe: () => '<path d="M3 13.2c2 .2 4-.4 6-1.7 1.7-1 3-2.5 4.4-2.3 2 .3 3.3 2 6 2.2 1.4.1 2.6.5 2.6 1.8 0 1.1-1 1.8-2.6 1.8H4.6C3.8 15 3 14.1 3 13.2z" fill="#2b3240"/><path d="M3.6 14.9h17.8" stroke="#A7D500" stroke-width="1.9" stroke-linecap="round"/><path d="M9 11.7l1.1 2.2M12 10.9l1 2.6" stroke="#8b97ad" stroke-width="1" stroke-linecap="round"/>',
    flame: () => '<path d="M12 3c2.1 2.9-1 4 .5 6 .8 1 2-.2 2-1.6 1.9 1.8 2.5 3.4 2.5 5.1A7 7 0 1 1 7 12.7c1.2.8 2.3.3 2.6-1C9.9 9 9 6.6 12 3z" fill="#ff7a35"/><path d="M12 19a3 3 0 0 0 1.6-5.5C13.4 15 12.4 15.7 11.4 15A3 3 0 0 0 12 19z" fill="#ffd34d"/>',
    trophy: (c) => '<path d="M7 4h10v3a5 5 0 0 1-10 0V4z" fill="#f2c14e"/><path d="M7 5H4.6v1.4A2.6 2.6 0 0 0 7 9M17 5h2.4v1.4A2.6 2.6 0 0 1 17 9" stroke="#dca42c" stroke-width="1.4" fill="none"/><rect x="10.6" y="11" width="2.8" height="4" fill="#dca42c"/><rect x="8" y="15" width="8" height="2.4" rx="1.2" fill="#f2c14e"/>',
    medal: (c) => '<path d="M9 3l2 5M15 3l-2 5" stroke="#9aa6c0" stroke-width="1.6"/><circle cx="12" cy="14" r="6" fill="' + (c || '#f2c14e') + '"/><circle cx="12" cy="14" r="3.2" fill="rgba(255,255,255,.4)"/>',
    target: (c) => '<circle cx="12" cy="12" r="8.4" stroke="' + (c || '#A7D500') + '" stroke-width="1.7" fill="none"/><circle cx="12" cy="12" r="4.4" stroke="' + (c || '#A7D500') + '" stroke-width="1.7" fill="none"/><circle cx="12" cy="12" r="1.5" fill="' + (c || '#A7D500') + '"/>',
    lock: (c) => '<rect x="5.5" y="10.5" width="13" height="9" rx="2.2" fill="' + (c || '#9aa6c0') + '"/><path d="M8.4 10.5V8a3.6 3.6 0 0 1 7.2 0v2.5" stroke="' + (c || '#9aa6c0') + '" stroke-width="1.8" fill="none"/>',
    check: (c) => '<path d="M5 12.5l4.4 4.5L19 7" stroke="' + (c || '#A7D500') + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    star: (c) => '<path d="M12 3l2.4 5.6 6 .5-4.6 4 1.4 5.9L12 16l-5.2 3 1.4-5.9-4.6-4 6-.5L12 3z" fill="' + (c || '#ffd34d') + '"/>',
    ruler: (c) => '<rect x="3" y="9" width="18" height="6" rx="1.3" stroke="' + (c || '#A7D500') + '" stroke-width="1.7" fill="none"/><path d="M7 9v3M11 9v4M15 9v3M19 9v4" stroke="' + (c || '#A7D500') + '" stroke-width="1.5"/>',
    calendar: (c) => '<rect x="4" y="5.5" width="16" height="14.5" rx="2.2" stroke="' + (c || '#A7D500') + '" stroke-width="1.7" fill="none"/><path d="M4 10h16M8 3.5v4M16 3.5v4" stroke="' + (c || '#A7D500') + '" stroke-width="1.7" stroke-linecap="round"/>',
    runner: (c) => '<circle cx="14.5" cy="5.3" r="2.1" fill="' + (c || '#A7D500') + '"/><path d="M13 8.2l-3.2 3 2.2 2 .6 4.2M12 11.2l4.2 1M9.8 11.2l-3.2 1M12 17.2l-3.2 3" stroke="' + (c || '#A7D500') + '" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    flip: (c) => '<path d="M19 12a7 7 0 1 1-2.1-5" stroke="' + (c || '#A7D500') + '" stroke-width="1.9" fill="none" stroke-linecap="round"/><path d="M17 3.5V7h-3.5" stroke="' + (c || '#A7D500') + '" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    share: (c) => '<circle cx="6" cy="12" r="2.5" stroke="' + (c || '#fff') + '" stroke-width="1.7" fill="none"/><circle cx="18" cy="6" r="2.5" stroke="' + (c || '#fff') + '" stroke-width="1.7" fill="none"/><circle cx="18" cy="18" r="2.5" stroke="' + (c || '#fff') + '" stroke-width="1.7" fill="none"/><path d="M8.2 11l7.6-3.9M8.2 13l7.6 3.9" stroke="' + (c || '#fff') + '" stroke-width="1.5"/>',
    home: (c) => '<path d="M4 11.2l8-6 8 6" stroke="' + (c || '#fff') + '" stroke-width="1.9" fill="none" stroke-linejoin="round"/><path d="M6 10v9h12v-9" stroke="' + (c || '#fff') + '" stroke-width="1.9" fill="none" stroke-linejoin="round"/>',
    shield: (c) => '<path d="M12 3l7 2.5v6c0 4-3 6.6-7 8-4-1.4-7-4-7-8v-6L12 3z" fill="' + (c || '#A7D500') + '"/>',
    paw: (c) => '<circle cx="7.5" cy="11" r="1.9" fill="' + (c || '#A7D500') + '"/><circle cx="12" cy="9" r="2" fill="' + (c || '#A7D500') + '"/><circle cx="16.5" cy="11" r="1.9" fill="' + (c || '#A7D500') + '"/><path d="M8 16a4 4 0 0 1 8 0c0 2.1-2 2.6-4 2.6S8 18.1 8 16z" fill="' + (c || '#A7D500') + '"/>',
    pin: (c) => '<path d="M12 21s6-5.3 6-10A6 6 0 0 0 6 11c0 4.7 6 10 6 10z" fill="' + (c || '#A7D500') + '"/><circle cx="12" cy="11" r="2.4" fill="#1b2233"/>',
    thermo: (c) => '<path d="M11 4a2 2 0 0 1 4 0v8.6a3.5 3.5 0 1 1-4 0V4z" stroke="' + (c || '#ffd9a0') + '" stroke-width="1.7" fill="none"/><circle cx="13" cy="15.6" r="2.1" fill="#ff7a35"/>',
    sun: () => '<circle cx="12" cy="12" r="4.4" fill="#ffd34d"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" stroke="#ffd34d" stroke-width="1.8" stroke-linecap="round"/>',
    rain: () => '<path d="M7 14a4 4 0 0 1 .6-7.9A5 5 0 0 1 17 7.5 3.5 3.5 0 0 1 17 14H7z" fill="#9fb3c8"/><path d="M8 16l-1 3M12 16l-1 3M16 16l-1 3" stroke="#5bb6e0" stroke-width="1.6" stroke-linecap="round"/>',
    tools: (c) => '<path d="M14.7 6.3a3.5 3.5 0 0 1-4.6 4.6l-6 6a1.8 1.8 0 0 0 2.5 2.5l6-6a3.5 3.5 0 0 1 4.6-4.6l-2.3 2.3-2-.4-.4-2 2.2-2.4z" stroke="' + (c || '#fff') + '" stroke-width="1.5" fill="none" stroke-linejoin="round"/>',
    cap: (c) => '<path d="M4 14.5a8 6.5 0 0 1 15-2.8" stroke="none" fill="' + (c || '#A7D500') + '"/><path d="M4.5 14.5a7.5 6 0 0 1 14-3" fill="' + (c || '#A7D500') + '"/><path d="M18 14.5c2.4 0 3.6.5 3.6 1.6" stroke="' + (c || '#A7D500') + '" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
    scarf: (c) => '<path d="M8 5h8v6a4 4 0 0 1-8 0V5z" fill="' + (c || '#A7D500') + '"/><path d="M14.5 11l1 8M9.5 11l-1 8" stroke="' + (c || '#A7D500') + '" stroke-width="2.2" stroke-linecap="round"/>',
    shorts: (c) => '<path d="M6 5h12l-1.2 14h-3.6L12 11l-1.2 8H7.2L6 5z" fill="' + (c || '#A7D500') + '"/>',
    sock: (c) => '<path d="M9.5 3h4.5v8l3 4a3.2 3.2 0 0 1-2.6 5.1H10a2.1 2.1 0 0 1-1.1-3.1l3.1-3V3z" fill="' + (c || '#A7D500') + '"/>',
    band: (c) => '<path d="M4 14a8 8 0 0 1 16 0" stroke="' + (c || '#A7D500') + '" stroke-width="2.6" fill="none"/><rect x="2.6" y="12.6" width="3.4" height="3.4" rx="1.2" fill="' + (c || '#A7D500') + '"/><rect x="18" y="12.6" width="3.4" height="3.4" rx="1.2" fill="' + (c || '#A7D500') + '"/>',
    fall: (c) => '<ellipse cx="12" cy="18" rx="8" ry="2.6" fill="#1b2233"/><path d="M12 3v9" stroke="' + (c || '#ffb37a') + '" stroke-width="2.2" stroke-linecap="round"/><path d="M8.5 9.5L12 13l3.5-3.5" stroke="' + (c || '#ffb37a') + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    crash: (c) => '<path d="M12 2l2.4 5.2L20 5l-2.2 5.6L23 12l-5.2 1.4L20 19l-5.6-2.2L12 22l-1.4-5.2L5 19l2.2-5.6L2 12l5.2-1.4L5 5l5.6 2.2L12 2z" fill="' + (c || '#ff6b5e') + '"/>',
    overheat: () => '<circle cx="12" cy="11" r="5" fill="#ffd34d"/><path d="M12 2.5v2.5M3.5 11h2M18.5 11h2M5.6 4.6l1.6 1.6M17 4.6l-1.6 1.6" stroke="#ff7a35" stroke-width="1.9" stroke-linecap="round"/><path d="M8 18c1-1.4 3-1.4 4 0s3 1.4 4 0" stroke="#ff7a35" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
    soundOn: (c) => '<path d="M4 9.5h3l4-3.5v12l-4-3.5H4z" fill="' + (c || '#fff') + '"/><path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" stroke="' + (c || '#fff') + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
    soundOff: (c) => '<path d="M4 9.5h3l4-3.5v12l-4-3.5H4z" fill="' + (c || '#fff') + '"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5" stroke="' + (c || '#fff') + '" stroke-width="1.7" stroke-linecap="round"/>',
    up: (c) => '<path d="M12 6l6 8H6z" fill="' + (c || '#A7D500') + '"/>',
  };
  function ic(name, opts) {
    opts = opts || {};
    const fn = ICONS[name]; if (!fn) return '';
    const s = opts.size || '1.05em';
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" style="display:inline-block;vertical-align:-0.16em;flex:none">' + fn(opts.color) + '</svg>';
  }

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
    flexer_cap:    { name: 'Flexer 캡', slot: '머리', icon: 'cap', spec: 'UPF 차단', effect: '햇볕 체온 -20%' },
    frosty_gaiter: { name: 'Frosty 게이터', slot: '목', icon: 'scarf', spec: '냉감 원단', effect: '항시 냉각' },
    run_shorts:    { name: '런쇼츠', slot: '하의', icon: 'shorts', spec: '2겹 구조', effect: '점프 +10%' },
    calf_sleeve:   { name: '카프 슬리브', slot: '다리', icon: 'sock', spec: '단계 압박', effect: '속도+5%·휘청회복' },
    hairband:      { name: '헤어밴드', slot: '머리', icon: 'band', spec: '땀 흡수', effect: '물 반경·효과 증가' },
    running_shoes: { name: 'SUMMER 러닝화', slot: '발', icon: 'shoe', spec: '경량 반발', effect: '속도+8%·점프+6%' },
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
    m.trail = m.trail || 'none';
    m.ownedTrails = Array.isArray(m.ownedTrails) ? m.ownedTrails : ['none'];
    if (m.ownedTrails.indexOf('none') < 0) m.ownedTrails.push('none');
    m.achieved = Array.isArray(m.achieved) ? m.achieved : [];
    m.stats = (m.stats && typeof m.stats === 'object') ? m.stats : {};
    const ds = { dist: 0, flips: 0, coins: 0, water: 0, bestCombo: 0, bestDist: 0, rank1: 0, streak: 0, lastDay: 0 };
    for (const k in ds) if (typeof m.stats[k] !== 'number') m.stats[k] = ds[k];
    return m;
  })();
  function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify({ coins: meta.coins, owned: meta.owned, equipped: meta.equipped, skin: meta.skin, ownedSkins: meta.ownedSkins, trail: meta.trail, ownedTrails: meta.ownedTrails, achieved: meta.achieved, stats: meta.stats })); } catch (e) {} }
  // ── 업적 (영구 배지 + 달성 보너스) ── 누적/단판 스탯 기반
  const ACHIEVEMENTS = [
    { id: 'run500', name: '첫 질주', icon: 'runner', desc: '누적 500m', stat: 'dist', goal: 500, reward: 20 },
    { id: 'flip100', name: '플립 입문', icon: 'flip', desc: '누적 플립 100', stat: 'flips', goal: 100, reward: 30 },
    { id: 'combo30', name: '콤보 러너', icon: 'flame', desc: '한 판 콤보 30', stat: 'bestCombo', goal: 30, reward: 40 },
    { id: 'dist1500', name: '장거리 러너', icon: 'ruler', desc: '한 판 1500m', stat: 'bestDist', goal: 1500, reward: 50 },
    { id: 'water100', name: '수분 충전', icon: 'drop', desc: '누적 물 100개', stat: 'water', goal: 100, reward: 50 },
    { id: 'coin1000', name: '코인 수집가', icon: 'coin', desc: '누적 코인 1000', stat: 'coins', goal: 1000, reward: 60 },
    { id: 'rank1', name: '정상 정복', icon: 'trophy', desc: '데일리 순위 1위', stat: 'rank1', goal: 1, reward: 100 },
    { id: 'flip500', name: '플립 마스터', icon: 'star', desc: '누적 플립 500', stat: 'flips', goal: 500, reward: 90 },
    { id: 'run10k', name: '마라토너', icon: 'medal', desc: '누적 10,000m', stat: 'dist', goal: 10000, reward: 120 },
    { id: 'streak7', name: '7일 연속', icon: 'calendar', desc: '7일 연속 플레이', stat: 'streak', goal: 7, reward: 150 },
  ];
  const TRAILS = [
    { key: 'none', name: '없음', cost: 0, color: null },
    { key: 'lime', name: '라임 트레일', cost: 120, color: '#A7D500' },
    { key: 'fire', name: '카본 반발 트레일', cost: 220, color: '#ff7a35' },
    { key: 'water', name: '쿨링 트레일', cost: 220, color: '#74c7ec' },
  ];
  const trailColor = () => { const t = TRAILS.find((x) => x.key === meta.trail); return t ? t.color : null; };
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
    { tier: '쉬움', reward: 25, list: [{ desc: '80m 달리기', metric: 'distM', goal: 80 }, { desc: '코인 6개 줍기', metric: 'coins', goal: 6 }, { desc: '플립 2회', metric: 'flips', goal: 2 }] },
    { tier: '보통', reward: 60, list: [{ desc: '500m 주파', metric: 'distM', goal: 500 }, { desc: '코인 25개 줍기', metric: 'coins', goal: 25 }, { desc: '플립 10회', metric: 'flips', goal: 10 }, { desc: '물 5개 마시기', metric: 'water', goal: 5 }] },
    { tier: '어려움', reward: 120, list: [{ desc: '1500m 주파', metric: 'distM', goal: 1500 }, { desc: '코인 55개 줍기', metric: 'coins', goal: 55 }, { desc: '플립 22회', metric: 'flips', goal: 22 }, { desc: '깔끔 착지 10연속', metric: 'cleanCombo', goal: 10 }] },
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
        banner('미션 완료! (' + m.tier + ')', m.desc + '  +' + m.reward + ' 코인', '#A7D500'); sfx('flip', 2);
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
      banner(lm.name, lm.m + 'm 돌파!  +' + lm.bonus + ' 코인', '#ffd34d'); sfx('coin');
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
  const trailParts = []; let trailTimer = 0;   // 코스메틱 잔상 트레일

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    petX = W * (H > W ? C.petScreenXRatioPortrait : C.petScreenXRatio); // 세로화면은 펫을 왼쪽으로 → 앞을 더 보이게
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
  let rainOn = false, rainAuto = false;   // 비 — 실제 부산 강수 연동(rainAuto) + 수동(setRain)
  const rainDrops = [], rainSplashes = [];

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
    if (after > before) { state.runCoins += C.comboMilestoneCoin; banner((after * C.comboMilestone) + ' 콤보!', '+' + C.comboMilestoneCoin + ' 코인', '#ff7a59'); sfx('flip', 2); }
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
    trailParts.length = 0; trailTimer = 0;
    snapCamera();
    const dead = document.getElementById('dead'); if (dead) dead.classList.remove('show');
    const home = document.getElementById('home'); if (home) home.classList.remove('show');
  }
  const bestKey = () => 'hr-best-' + SEED;
  const DEATH_INFO = { heat: ['overheat', '열사병!'], fall: ['fall', '추락!'], crash: ['crash', '충돌!'] };
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
    // ── 누적/단판 스탯 + 연속일 + 업적 ──
    const st = meta.stats;
    st.dist += dist;
    st.flips += state.flipCount;
    st.coins += earned;
    st.water += (state.waterCount || 0);
    if (state.comboBest > st.bestCombo) st.bestCombo = state.comboBest;
    if (dist > st.bestDist) st.bestDist = dist;
    if (newRank === 1) st.rank1 = 1;
    updateStreak(SEED);
    const achv = checkAchievements();
    if (achv.bonus > 0) meta.coins += achv.bonus;
    saveMeta();
    const di = DEATH_INFO[state.deathReason] || DEATH_INFO.heat;
    setHTML('deadEmoji', ic(di[0], { size: '20px' })); setText('deadTitle', di[1]);
    setText('deadDist', dist + ' ');
    setHTML('deadBest', best + 'm');
    setHTML('deadRank', newRank + '위' + (newRank < oldRank ? ' ' + ic('up', { size: '0.9em' }) : ''));
    setHTML('deadCoins', '+' + earned + ' <small>(보유 ' + meta.coins + ')</small>');
    setHTML('deadFlips', state.flipCount + ' / ' + ic('flame', { size: '0.95em' }) + state.comboBest);
    const doneN = missionDone.filter(Boolean).length;
    setHTML('deadMissions', doneN + '/3');
    setHTML('deadWeather', realTemp == null ? '—' : ((rainOn ? ic('rain', { size: '0.95em' }) : ic('sun', { size: '0.95em' })) + ' ' + Math.round(realTemp) + '°C'));
    // 다음 해금까지 — "한 판 더" 동기
    const u = nextUnlock();
    setHTML('deadUnlock', u ? (u.need === 0 ? (u.name + ' 해금 가능!') : (u.name + '까지 ' + u.need + ic('coin'))) : '모두 해금 완료!');
    const nb = document.getElementById('deadNewBest'); if (nb) nb.style.display = isBest ? 'inline-flex' : 'none';
    const ae = document.getElementById('deadAch');
    if (ae) { if (achv.unlocked.length) { ae.innerHTML = ic('medal') + ' 업적 달성! ' + achv.unlocked.map((a) => ic(a.icon) + ' ' + a.name).join(' · ') + ' (+' + achv.bonus + ic('coin') + ')'; ae.style.display = 'flex'; } else ae.style.display = 'none'; }
    const dead = document.getElementById('dead'); if (dead) dead.classList.add('show');
  }
  // 연속 플레이일: 오늘이 어제와 이어지면 +1, 하루 이상 비면 1로 리셋
  function updateStreak(todaySeed) {
    const st = meta.stats;
    if (st.lastDay === todaySeed) return;
    const prev = dateFromSeed(st.lastDay), cur = dateFromSeed(todaySeed);
    if (st.lastDay && prev && cur) {
      const gap = Math.round((cur - prev) / 86400000);
      st.streak = (gap === 1) ? st.streak + 1 : 1;
    } else st.streak = 1;
    st.lastDay = todaySeed;
  }
  function dateFromSeed(s) { if (!s) return null; const y = Math.floor(s / 10000), m = Math.floor((s % 10000) / 100), d = s % 100; return new Date(y, m - 1, d).getTime(); }
  // 미달성 업적 중 목표 달성한 것 처리 → 보너스 코인 합산 + 새로 달성한 목록 반환
  function checkAchievements() {
    let bonus = 0; const unlocked = [];
    for (const a of ACHIEVEMENTS) {
      if (meta.achieved.indexOf(a.id) >= 0) continue;
      if ((meta.stats[a.stat] || 0) >= a.goal) { meta.achieved.push(a.id); bonus += a.reward; unlocked.push(a); }
    }
    return { bonus, unlocked };
  }
  function setText(id, t) { const e = document.getElementById(id); if (e) { if (e.firstChild && e.firstChild.nodeType === 3) e.firstChild.nodeValue = t; else e.textContent = t; } }
  function setHTML(id, h) { const e = document.getElementById(id); if (e) e.innerHTML = h; }

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
    setHTML('homeCoins', ic('coin') + ' ' + meta.coins);
    setHTML('homeSeed', '오늘의 출발 · ' + startZoneName() + ' #' + SEED);
    updateWeatherUI();
    // 오늘의 도전 1개 (첫 미완료 미션 → 다 했으면 다음 해금)
    const goalEl = document.getElementById('homeGoal');
    if (goalEl) {
      const fi = todaysMissions.findIndex((m, i) => !missionDone[i]);
      if (fi >= 0) { const m = todaysMissions[fi]; goalEl.innerHTML = ic('target') + ' <b>오늘의 도전</b> · [' + m.tier + '] ' + m.desc + ' <b>+' + m.reward + ic('coin') + '</b>'; }
      else { const u = nextUnlock(); goalEl.innerHTML = u ? (ic('check') + ' 미션 완료! <b>' + u.name + '</b>까지 <b>' + u.need + ic('coin') + '</b>') : ('<b>오늘 미션·해금 완료!</b> 최고 기록에 도전!'); }
    }
    const grid = document.getElementById('gearGrid'); if (!grid) return;
    grid.innerHTML = '';
    for (const id in EQUIP) {
      const g = EQUIP[id], cost = C.gearCost[id] || 0;
      const owned = meta.owned.indexOf(id) >= 0, on = equipped.has(id);
      const card = document.createElement('button');
      card.className = 'gcard' + (on ? ' on' : '') + (owned ? '' : ' locked');
      let status = on ? '장착중' : owned ? '장착하기' : (meta.coins >= cost ? ('해금 ' + cost + ic('coin')) : (ic('lock') + ' ' + cost + ic('coin')));
      card.innerHTML = '<div class="gi">' + ic(g.icon, { size: '1.8em' }) + '</div><div class="gn">' + g.name + '</div>'
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
        const status = on ? '착용중' : owned ? '착용' : (meta.coins >= s.cost ? (s.cost + ic('coin')) : (ic('lock') + s.cost));
        card.innerHTML = '<div class="sdot" style="background:' + s.body + '"></div><div class="sn">' + s.name + '</div><div class="ss">' + status + '</div>';
        card.addEventListener('click', (e) => { e.stopPropagation(); onSkinCard(s.key); });
        sk.appendChild(card);
      });
    }
    const lb = document.getElementById('lbList');
    if (lb) {
      let best = 0; try { best = parseInt(localStorage.getItem(bestKey()) || '0', 10) || 0; } catch (e) {}
      const cap = document.getElementById('lbCaption');
      if (cap) {
        if (realTemp == null) cap.innerHTML = best > 0 ? ('오늘 최고 ' + best + 'm') : '';
        else cap.innerHTML = (rainOn ? ic('rain') + ' 비 오는 ' : ic('thermo') + ' ') + Math.round(realTemp) + '°C 부산에서 ' + (best > 0 ? ('오늘 최고 ' + best + 'm 주파!') : '아직 기록 없음 — 도전!');
      }
      lb.innerHTML = '';
      dailyLeaderboard(best).forEach((e) => {
        const row = document.createElement('div');
        row.className = 'lbrow' + (e.you ? ' you' : '');
        const medal = e.rank <= 3 ? ic('medal', { color: e.rank === 1 ? '#f2c14e' : e.rank === 2 ? '#cdd3dd' : '#d39b6a', size: '1.2em' }) : (e.rank + '위');
        row.innerHTML = '<span class="lbr">' + medal + '</span><span class="lbn">' + (e.you ? ic('runner') + ' 나' : e.name) + '</span><span class="lbd">' + e.dist + 'm</span>';
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
        row.innerHTML = '<span class="mck">' + (done ? ic('check') : ic('target')) + '</span>'
          + '<span class="mdesc"><b>[' + m.tier + ']</b> ' + m.desc + '</span>'
          + '<span class="mrew">' + (done ? '완료' : '+' + m.reward + ic('coin')) + '</span>';
        ml.appendChild(row);
      });
    }
    // ── 업적 배지 ──
    const ag = document.getElementById('achGrid');
    if (ag) {
      ag.innerHTML = '';
      const got = meta.achieved.length;
      setText('achCount', got + '/' + ACHIEVEMENTS.length);
      ACHIEVEMENTS.forEach((a) => {
        const done = meta.achieved.indexOf(a.id) >= 0;
        const cur = Math.min(meta.stats[a.stat] || 0, a.goal);
        const card = document.createElement('div');
        card.className = 'acard' + (done ? ' on' : '');
        card.innerHTML = '<div class="ai">' + (done ? ic(a.icon, { size: '1.7em' }) : ic('lock', { size: '1.5em' })) + '</div><div class="an">' + a.name + '</div>'
          + '<div class="ad">' + a.desc + '</div><div class="ap">' + (done ? ic('check') + ' 달성 +' + a.reward + ic('coin') : cur + '/' + a.goal) + '</div>';
        ag.appendChild(card);
      });
    }
    // ── 코스메틱 트레일 ──
    const tg = document.getElementById('trailGrid');
    if (tg) {
      tg.innerHTML = '';
      TRAILS.forEach((t) => {
        const owned = meta.ownedTrails.indexOf(t.key) >= 0, on = meta.trail === t.key;
        const card = document.createElement('button');
        card.className = 'tcard' + (on ? ' on' : '') + (owned ? '' : ' locked');
        const status = on ? '사용중' : owned ? '사용' : (meta.coins >= t.cost ? (t.cost + ic('coin')) : (ic('lock') + t.cost));
        const dot = t.color ? ('background:' + t.color) : 'background:#3a4360;border:1px dashed #6b7a90';
        card.innerHTML = '<div class="tdot" style="' + dot + '"></div><div class="tn">' + t.name + '</div><div class="ts">' + status + '</div>';
        card.addEventListener('click', (e) => { e.stopPropagation(); onTrailCard(t.key); });
        tg.appendChild(card);
      });
    }
  }
  function onTrailCard(key) {
    const t = TRAILS.find((x) => x.key === key); if (!t) return;
    const owned = meta.ownedTrails.indexOf(key) >= 0;
    if (owned) { meta.trail = key; }
    else { if (meta.coins < t.cost) { banner('코인 부족', t.cost + ' 코인 필요', '#ff7a35'); return; } meta.coins -= t.cost; meta.ownedTrails.push(key); meta.trail = key; banner(t.name, '트레일 해금!', t.color || '#A7D500'); }
    saveMeta(); buildHome();
  }
  function shareResult() {
    const dist = Math.floor(state.distance / C.pxPerMeter);
    const text = '[BEAT THE HEAT: BUSAN] ' + startZoneName() + ' 출발 #' + SEED + ' — ' + dist + 'm 주파! 코인 ' + meta.coins + ' · SUMMERTECT. 너도 도전!';
    try {
      if (navigator.share) { navigator.share({ title: 'BEAT THE HEAT: BUSAN', text }).catch(() => {}); return; }
      if (navigator.clipboard) { navigator.clipboard.writeText(text).then(() => banner('복사 완료', '붙여넣어 공유하세요', '#74c7ec')).catch(() => {}); return; }
    } catch (e) {}
    banner('공유', dist + 'm · #' + SEED, '#74c7ec');
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
        if (perfect) { state.runCoins += C.perfectCoin; player.boost += C.cleanBoost; addCombo(1); state.lastLanding = 'PERFECT ×' + flips; sparkle(8); banner('PERFECT!', '+' + C.perfectCoin + ' 코인 · 부스트', '#A7D500'); }
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
    updateRain(dt);                                // 비는 모든 화면에서(홈 포함) 내림
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
    if (meta.trail !== 'none') { trailTimer -= dt; if (trailTimer <= 0) { trailTimer = 0.035; trailParts.push({ wx: state.worldX, wy: player.worldY, born: state.t }); if (trailParts.length > 48) trailParts.shift(); } }

    // ── 시간대 사이클(단계4): 거리에 따라 새벽→밤 순환, 정오=피크 ──
    updateBand();

    // ── 더위 관리: 햇볕(×시간대배수)=상승, 그늘=하강, 물=급랭, 만땅=열사병 ──
    const nowShade = shadeAt(state.worldX);
    state.shade = nowShade;
    const ramp = 1 + (state.distance / C.pxPerMeter / 1000) * C.heatRampPer1000m; // 거리에 따른 난이도 상승
    // 장비: Flexer 캡 = 햇볕 -20%, Frosty 게이터 = 항시 냉각
    const coolMult = clamp(1 / weatherMult, 0.65, 1.35); // 더운 날=그늘도 덜 식음 / 시원한 날=더 식음
    const rainSun = rainOn ? C.rainSunMult : 1;          // 비 = 구름 → 햇볕 약함
    const rainCool = rainOn ? C.rainCoolPerSec : 0;      // 비 = 추가 냉각
    let dHeat = state.rampage > 0 ? -C.rampageHeatDrain : ((1 - nowShade) * C.heatSunRate * state.sunMult * ramp * weatherMult * gearSunMult() * rainSun - nowShade * C.heatShadeRate * coolMult - gearCoolPerSec() - rainCool);
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
  // 근처에서 가장 평탄한 지점 찾기 — 가파른 경사에 장애물이 놓여 점프가 불합리해지는 것 방지
  function flattestNear(x, range, steps) {
    let best = x, bestS = Math.abs(terrainSlope(x));
    for (let i = 1; i <= steps; i++) {
      const d = (range * i) / steps;
      const a = Math.abs(terrainSlope(x - d)); if (a < bestS) { bestS = a; best = x - d; }
      const b = Math.abs(terrainSlope(x + d)); if (b < bestS) { bestS = b; best = x + d; }
    }
    return best;
  }
  function updateObstacles() {
    const aheadX = state.worldX + (W - petX) + 320;
    while (nextObstacleSlot * C.obstacleSpacing < aheadX) {
      const k = nextObstacleSlot++;
      let ox = k * C.obstacleSpacing + (hash01(k * 19 + 1) * 2 - 1) * C.obstacleJitter;
      ox = flattestNear(ox, C.obstacleFlattenRange, 7);  // 평탄한 곳으로 스냅 → 공정한 점프
      const nearGap = gaps.some((g) => ox > g.x - C.gapClearPx && ox < g.x + g.w + C.gapClearPx);
      if (ox > C.obstacleStartDist && hash01(k * 19 + 9) < C.obstacleChance && Math.abs(terrainSlope(ox)) < C.obstacleMaxSlope && !inGap(ox) && !nearGap && ox - lastObstacleX >= C.minObstacleSpacing) {
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
    banner('카본 부스트!', '카본화 장착 — 몇 초간 무적·질주·돌파!', '#A7D500');
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
    drawTrail();           // 코스메틱 잔상
    drawPet();
    drawParticles('spark');
    drawParticles('water');
    drawParticles('coin');
    drawFlipFx();          // 플립 중 회전 표시(라임 호) — 확실히 보이게
    drawCombo();           // 콤보 카운터 팝
    drawShade();           // 그늘 쿨 틴트(월드 위에)
    drawShimmer();         // 햇볕 아지랑이(더울 때)
    drawRain();            // 비(실제 부산 강수 연동)

    ctx.restore();
    drawVignette();
    if (state.rampage > 0) drawRampageHUD();
  }
  // ── 코스메틱 잔상 트레일: 펫 뒤로 색 잔상 ──
  function drawTrail() {
    const col = trailColor(); if (!col || !trailParts.length) return;
    const LIFE = 0.5, r = C.petRadius;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of trailParts) {
      const life = 1 - (state.t - p.born) / LIFE; if (life <= 0) continue;
      const sx = petX + (p.wx - state.worldX), sy = p.wy - state.camY;
      if (sx < -40) continue;
      ctx.globalAlpha = life * 0.45;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(sx, sy, r * (0.45 + life * 0.75), 0, TAU); ctx.fill();
    }
    ctx.restore();
    while (trailParts.length && state.t - trailParts[0].born > LIFE) trailParts.shift();
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
    ctx.fillStyle = '#A7D500'; roundRect(x, y, bw * f, 12, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 13px Pretendard, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('카본 부스트', W / 2, y - 5);
    ctx.restore();
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  // ── 카본화(카본 플레이트 러닝화) 픽업 — 먹으면 카본 부스트 ──
  function drawPowers() {
    for (const pw of powers) {
      const sx = petX + (pw.x - state.worldX); if (sx < -50 || sx > W + 50) continue;
      const y = (pw.y - state.camY) + Math.sin(state.t * 3 + pw.bob) * 5, pul = 1 + Math.sin(state.t * 8 + pw.bob) * 0.12;
      ctx.save();
      const g = ctx.createRadialGradient(sx, y, 2, sx, y, 32 * pul);     // 라임 글로우
      g.addColorStop(0, 'rgba(167,213,0,0.55)'); g.addColorStop(0.55, 'rgba(167,213,0,0.2)'); g.addColorStop(1, 'rgba(167,213,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, y, 32 * pul, 0, TAU); ctx.fill();
      carbonShoe(sx, y, 1.7 * pul, state.t);
      ctx.restore();
    }
  }
  function carbonShoe(cx, cy, s, t) { // 옆모습 카본화 — 어두운 갑피 + 라임 카본솔
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.rotate(-0.07 + Math.sin(t * 6) * 0.04);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; // 속도선
    ctx.beginPath(); ctx.moveTo(-17, -5); ctx.lineTo(-10, -5); ctx.moveTo(-19, 0); ctx.lineTo(-12, 0); ctx.stroke();
    ctx.fillStyle = '#2b3240';                                          // 갑피
    ctx.beginPath(); ctx.moveTo(-9, 3.5); ctx.quadraticCurveTo(-9, -5, -2.5, -5);
    ctx.quadraticCurveTo(4, -5, 9, -1.5); ctx.quadraticCurveTo(15, 0.5, 16.5, 3.5);
    ctx.lineTo(-9, 3.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#A7D500';                                          // 카본 밑창
    ctx.beginPath(); ctx.moveTo(-10.5, 3.5); ctx.lineTo(17, 3.5); ctx.quadraticCurveTo(18.5, 8, 13.5, 8); ctx.lineTo(-8, 8); ctx.quadraticCurveTo(-11.5, 8, -10.5, 3.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7d8aa0'; ctx.lineWidth = 0.8;                   // 카본판 결
    ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(2, 2.5); ctx.moveTo(4.5, -2.5); ctx.lineTo(6.5, 1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;       // 끈 하이라이트
    ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(2.5, -2); ctx.stroke();
    ctx.restore();
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
  const ZONES = ['서면 도심', '온천천', '자갈치시장', '광안리', '해운대', '감천문화마을', '다대포 해변', '전포 카페거리'];
  const ZONE_ROT = ((SEED % ZONES.length) + ZONES.length) % ZONES.length;  // 매일 출발 지역이 달라짐(시드 결정적)
  function zoneByDist() {
    const m = state.distance / C.pxPerMeter;
    if (m < 250) return 0; if (m < 600) return 1; if (m < 1100) return 2;
    if (m < 1800) return 3; if (m < 2700) return 4; if (m < 3800) return 5; return 6;
  }
  let _forceZone = null;  // QA용 구역 강제(없으면 null)
  function currentZone() { return _forceZone != null ? _forceZone : (zoneByDist() + ZONE_ROT) % ZONES.length; }  // 거리 진행 + 오늘의 회전
  function startZoneName() { return ZONES[ZONE_ROT % ZONES.length]; }
  // ── 비 ── 실제 부산 강수 연동(rainAuto) 또는 수동(setRain). 빗줄기 + 바닥 튐 + 시원함
  function setRain(on) { rainOn = !!on; if (rainOn) ensureRain(); }
  function ensureRain() {
    if (rainDrops.length) return;
    const n = C.rainDropCount || 130;
    for (let i = 0; i < n; i++) rainDrops.push({ x: Math.random() * (W + 120) - 60, y: Math.random() * H, len: 9 + Math.random() * 12, sp: 760 + Math.random() * 520, a: 0.18 + Math.random() * 0.3 });
  }
  function updateRain(dt) {
    if (!rainOn) { if (rainSplashes.length) rainSplashes.length = 0; return; }
    ensureRain();
    const wind = 150;
    for (const d of rainDrops) {
      d.y += d.sp * dt; d.x -= wind * dt;
      if (d.y > H) { // 바닥에 튐
        if (rainSplashes.length < 40 && Math.random() < 0.35) rainSplashes.push({ x: d.x, y: H - 4 - Math.random() * 8, t: 0, max: 0.32 });
        d.y = -10; d.x = Math.random() * (W + 120) - 60;
      } else if (d.x < -60) d.x = W + 60;
    }
    for (let i = rainSplashes.length - 1; i >= 0; i--) { const s = rainSplashes[i]; s.t += dt; if (s.t >= s.max) rainSplashes.splice(i, 1); }
  }
  function drawRain() {
    if (!rainOn || !rainDrops.length) return;
    ctx.save();
    ctx.fillStyle = 'rgba(70,86,112,0.14)'; ctx.fillRect(0, 0, W, H); // 흐린 베일
    ctx.strokeStyle = 'rgba(174,196,224,0.55)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath();
    for (const d of rainDrops) { ctx.globalAlpha = d.a; ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 5, d.y + d.len); }
    ctx.globalAlpha = 0.5; ctx.stroke();
    for (const s of rainSplashes) { const a = 1 - s.t / s.max; ctx.globalAlpha = a * 0.5; ctx.strokeStyle = 'rgba(190,210,235,0.6)'; ctx.beginPath(); ctx.arc(s.x, s.y, (1 - a) * 9 + 2, Math.PI, TAU); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function drawParallaxFar() {
    const scroll = state.worldX * C.parallaxFar, base = H * 0.56 - camVar() * 0.06, z = currentZone();
    const patt = 1000, off = -(((scroll % patt) + patt) % patt);
    for (let bx = off - patt; bx < W + patt; bx += patt) {
      if (z === 3) farBridge(bx, base);
      else if (z === 2) farHarbor(bx, base);
      else if (z === 4) farHotels(bx, base);
      else if (z === 5) farGamcheon(bx, base);
      else if (z === 7) farCafe(bx, base);
      else if (z === 1 || z === 6) farHills(bx, base, z);
      else farSkyline(bx, base);
    }
  }
  // 시간대에 따라 창문 불빛 진해짐(밤=밝게)
  function winAlpha() { return clamp(0.92 - state.sunMult * 0.46, 0.16, 0.8); }
  function fwin(bx, by, bw, bh, seed) { // 건물 외벽 창문 격자 (구역 위치 기준 → 깜빡임 없음)
    ctx.fillStyle = 'rgba(255,221,150,' + winAlpha().toFixed(2) + ')';
    const cols = Math.max(1, Math.floor(bw / 14)), rows = Math.max(1, Math.floor(bh / 18));
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++)
      if (((c * 7 + r * 13 + seed * 5) % 9) < 4) ctx.fillRect(bx + 6 + c * 14, by + 7 + r * 18, 5, 8);
  }
  function softTree(x, y, s, col) { // 동글동글 귀여운 나무
    s = s || 1; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(86,72,56,0.5)'; ctx.fillRect(-2, -11, 4, 13);
    ctx.fillStyle = col || 'rgba(96,142,98,0.55)';
    ctx.beginPath(); ctx.arc(0, -17, 10, 0, TAU); ctx.arc(-7, -12, 7.5, 0, TAU); ctx.arc(7, -12, 7.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function seagull(x, y, s) { // 갈매기 (살짝 위아래로)
    s = s || 1; const f = Math.sin(state.t * 2 + x * 0.05) * 1.5;
    ctx.save(); ctx.strokeStyle = 'rgba(235,238,245,0.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 8 * s, y + f); ctx.quadraticCurveTo(x - 2 * s, y - 4 * s + f, x, y + f);
    ctx.quadraticCurveTo(x + 2 * s, y - 4 * s + f, x + 8 * s, y + f); ctx.stroke(); ctx.restore();
  }
  function farSkyline(x, base) { // 도심 — 빌딩숲 + 창문 + 옥상 물탱크
    const blds = [[20, 46, 90], [78, 34, 130], [120, 50, 70], [180, 40, 150], [232, 60, 100], [300, 38, 180], [350, 52, 120], [430, 44, 110], [600, 44, 110], [660, 36, 160], [712, 56, 80], [780, 40, 140], [860, 50, 100]];
    let i = 0;
    for (const [bx, bw, bh] of blds) {
      ctx.fillStyle = 'rgba(116,128,166,0.5)'; ctx.fillRect(x + bx, base - bh, bw, bh + 40);
      if (bh > 120) { ctx.fillStyle = 'rgba(96,108,148,0.5)'; ctx.fillRect(x + bx + bw * 0.32, base - bh - 9, bw * 0.36, 9); } // 물탱크
      fwin(x + bx, base - bh, bw, bh, i++);
    }
    seagull(x + 520, base - 200, 0.8); seagull(x + 580, base - 215, 0.7);
  }
  function farHills(x, base, z) { // 온천천(초록)/다대포(노을) — 능선 + 귀여운 나무
    const green = z === 1;
    ctx.fillStyle = green ? 'rgba(104,148,104,0.5)' : 'rgba(158,128,150,0.48)';
    ctx.beginPath(); ctx.moveTo(x, base + 40);
    for (let i = 0; i <= 1000; i += 20) ctx.lineTo(x + i, base - (Math.sin(i / 150) * 30 + Math.sin(i / 60) * 8 + 16));
    ctx.lineTo(x + 1000, base + 40); ctx.closePath(); ctx.fill();
    for (let i = 60; i < 1000; i += 130) {
      const ty = base - (Math.sin(i / 150) * 30 + Math.sin(i / 60) * 8 + 16) + 4;
      if (green) softTree(x + i, ty, 0.9 + ((i / 130) % 2) * 0.25, 'rgba(108,158,108,0.55)');
      else { softTree(x + i, ty, 0.85, 'rgba(190,150,120,0.5)'); } // 노을빛 나무
    }
    if (!green) seagull(x + 700, base - 150, 0.9); // 다대포 바닷가
  }
  function farHarbor(x, base) { // 자갈치 수산물시장 — 물결지붕 시장 건물 + 줄무늬 좌판 차양 + 생선상자/얼음 + 갈매기 + 어선
    // 뒤: 자갈치시장 건물 (물결 모양 지붕)
    ctx.fillStyle = 'rgba(126,140,158,0.5)'; ctx.fillRect(x + 110, base - 150, 430, 190);
    ctx.fillStyle = 'rgba(98,118,142,0.55)'; ctx.beginPath(); ctx.moveTo(x + 100, base - 150);
    for (let i = 0; i <= 450; i += 18) ctx.lineTo(x + 110 + i, base - 150 - Math.sin(i / 52) * 13 - 9);
    ctx.lineTo(x + 560, base - 150); ctx.closePath(); ctx.fill();
    fwin(x + 130, base - 150, 400, 120, 2);
    ctx.fillStyle = 'rgba(167,213,0,0.5)'; ctx.fillRect(x + 150, base - 130, 350, 15);   // 간판 띠
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let s = 0; s < 9; s++) ctx.fillRect(x + 168 + s * 38, base - 127, 16, 9); // 간판 글자 느낌
    // 앞: 시장 좌판 줄무늬 차양 + 생선상자 + 얼음 + 생선
    const awn = [['#d4615e', '#f2ece2'], ['#4f86c0', '#f2ece2'], ['#d9b24f', '#f2ece2'], ['#46a386', '#f2ece2']];
    const boxc = ['#c9544f', '#5083bd', '#dfe6ec'];
    for (let s = 0; s < 6; s++) {
      const sx = x + 24 + s * 165, ay = base - 76, c = awn[s % awn.length];
      ctx.fillStyle = 'rgba(78,82,90,0.6)'; ctx.fillRect(sx, ay, 4, 76); ctx.fillRect(sx + 120, ay, 4, 76);          // 차양 지지대
      for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? c[1] : c[0]; ctx.fillRect(sx - 4 + i * 16, ay - 13, 16, 15); } // 줄무늬 차양
      ctx.fillStyle = 'rgba(70,74,82,0.7)'; ctx.fillRect(sx - 4, base - 26, 132, 9);                                   // 좌판 테이블
      for (let b = 0; b < 3; b++) {
        ctx.fillStyle = boxc[b]; ctx.fillRect(sx + 4 + b * 41, base - 25, 36, 19);                                     // 생선상자
        ctx.fillStyle = 'rgba(228,233,240,0.9)'; for (let f = 0; f < 3; f++) { ctx.beginPath(); ctx.ellipse(sx + 11 + b * 41 + f * 10, base - 21, 5, 2.3, -0.25, 0, TAU); ctx.fill(); } // 은빛 생선
      }
    }
    // 어선
    const hulls = ['rgba(214,96,96,0.7)', 'rgba(96,150,214,0.7)', 'rgba(230,196,90,0.75)'];
    for (let b = 0; b < 2; b++) {
      const bx = x + 250 + b * 360, by = base + 26;
      ctx.fillStyle = hulls[b]; ctx.beginPath(); ctx.moveTo(bx - 26, by); ctx.quadraticCurveTo(bx, by + 13, bx + 26, by); ctx.lineTo(bx + 20, by - 8); ctx.lineTo(bx - 20, by - 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(90,98,112,0.6)'; ctx.fillRect(bx - 1, by - 24, 2, 16);
    }
    seagull(x + 300, base - 165, 1); seagull(x + 360, base - 155, 0.8); seagull(x + 600, base - 175, 0.9); seagull(x + 660, base - 168, 0.7);
  }
  function farBridge(x, base) { // 광안대교 — 현수교 + 케이블 조명
    const deckY = base - 18, span = 760, x0 = x + 120, towerH = 150;
    ctx.fillStyle = 'rgba(120,140,175,0.5)';
    ctx.fillRect(x0, deckY, span, 9);
    ctx.fillRect(x0 + 130, deckY - towerH, 9, towerH); ctx.fillRect(x0 + span - 140, deckY - towerH, 9, towerH);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(120,140,175,0.5)';
    ctx.beginPath(); ctx.moveTo(x0, deckY); ctx.quadraticCurveTo(x0 + 135, deckY - towerH + 6, x0 + 135, deckY - towerH);
    ctx.moveTo(x0 + 135, deckY - towerH); ctx.quadraticCurveTo(x0 + span / 2, deckY + 30, x0 + span - 140, deckY - towerH);
    ctx.moveTo(x0 + span - 140, deckY - towerH); ctx.quadraticCurveTo(x0 + span - 140, deckY - towerH + 6, x0 + span, deckY); ctx.stroke();
    ctx.fillStyle = 'rgba(255,228,150,' + winAlpha().toFixed(2) + ')'; // 케이블 따라 조명
    for (let k = 0; k <= 14; k++) { const t = k / 14, lx = x0 + 135 + t * (span - 275); const dip = Math.sin(t * Math.PI) * 56; ctx.beginPath(); ctx.arc(lx, deckY - towerH + dip + 6, 1.8, 0, TAU); ctx.fill(); }
    seagull(x0 + 380, deckY - towerH - 24, 1);
  }
  function farHotels(x, base) { // 해운대 — 마린시티 고층 + 창문 + 대관람차
    let i = 0;
    for (const [bx, bw, bh] of [[40, 40, 230], [110, 34, 300], [170, 46, 180], [260, 38, 260], [330, 30, 340], [400, 44, 210], [560, 36, 280], [630, 48, 200], [720, 34, 320], [800, 42, 240], [880, 36, 290]]) {
      ctx.fillStyle = 'rgba(150,168,186,0.52)'; ctx.fillRect(x + bx, base - bh, bw, bh + 40); fwin(x + bx, base - bh, bw, bh, i++);
    }
    // 귀여운 대관람차
    const wx = x + 500, wy = base - 92, wr = 50;
    ctx.strokeStyle = 'rgba(150,168,186,0.55)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(wx, wy, wr, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,221,150,' + winAlpha().toFixed(2) + ')';
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + state.t * 0.18; ctx.beginPath(); ctx.arc(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr, 3.4, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(120,134,150,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(wx - 14, base + 40); ctx.lineTo(wx, wy); ctx.lineTo(wx + 14, base + 40); ctx.stroke();
  }
  function farGamcheon(x, base) { // 감천문화마을 — 비탈 알록달록 집 (더 밝고 귀엽게) + 작은 창
    const cols = ['rgba(120,165,205,0.66)', 'rgba(210,150,180,0.66)', 'rgba(232,200,120,0.68)', 'rgba(150,205,170,0.66)', 'rgba(230,160,120,0.66)'];
    const roofs = ['rgba(90,130,170,0.6)', 'rgba(180,115,150,0.6)', 'rgba(200,165,90,0.6)', 'rgba(115,170,135,0.6)', 'rgba(195,125,90,0.6)'];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 16; c++) {
      const bx = x + c * 62 + r * 14, by = base - 20 - r * 26 - (c % 2) * 6;
      if (((c + r) * 7) % 5 === 0) continue;
      const ci = (c + r) % cols.length;
      ctx.fillStyle = cols[ci]; ctx.fillRect(bx, by, 40, 34);
      ctx.fillStyle = roofs[ci]; ctx.fillRect(bx - 1, by - 4, 42, 4); // 지붕
      ctx.fillStyle = 'rgba(255,236,180,' + (winAlpha() * 0.9).toFixed(2) + ')'; ctx.fillRect(bx + 6, by + 8, 8, 9); ctx.fillRect(bx + 24, by + 8, 8, 9); // 창
    }
  }
  function farCafe(x, base) { // 전포 카페거리 — 낮은 상가 + 줄무늬 차양 + 간판
    const cols = ['rgba(150,140,118,0.55)', 'rgba(120,150,170,0.52)', 'rgba(170,140,150,0.52)'];
    const awn = ['#d9806e', '#6fae8f', '#dcb157', '#7aa6d0'];
    let i = 0;
    for (let bx = 20; bx < 980; bx += 150) {
      const bh = 70 + (i % 3) * 16;
      ctx.fillStyle = cols[i % 3]; ctx.fillRect(x + bx, base - bh, 120, bh + 40);
      fwin(x + bx, base - bh + 14, 120, bh - 30, i);
      ctx.fillStyle = awn[i % 4]; ctx.fillRect(x + bx - 4, base - 26, 128, 11);            // 차양
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let s = 0; s < 8; s++) ctx.fillRect(x + bx - 4 + s * 16, base - 26, 8, 11);
      ctx.fillStyle = 'rgba(70,80,95,0.55)'; ctx.fillRect(x + bx + 50, base - bh - 12, 20, 12); // 간판
      ctx.fillStyle = 'rgba(255,221,150,' + winAlpha().toFixed(2) + ')'; ctx.fillRect(x + bx + 54, base - bh - 9, 12, 6);
      i++;
    }
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
      if (z === 4) { palm(px + 50, base - 4); umbrella(px + 150, base, '#ff7a8a'); palm(px + 250, base + 2, 0.85); }   // 해운대 야자수+파라솔
      else if (z === 1) { reeds(px + 40, base); flower(px + 110, base, '#ff9ec4'); reeds(px + 170, base); flower(px + 240, base, '#ffd34d'); reeds(px + 300, base); } // 온천천 갈대+꽃
      else if (z === 6) { reeds(px + 40, base); umbrella(px + 150, base, '#ffd34d'); reeds(px + 270, base); } // 다대포 갈대+파라솔
      else if (z === 2) { fishBox(px + 45, base, '#c9544f'); seagullGround(px + 150, base); fishBox(px + 230, base, '#5083bd'); fishBox(px + 305, base, '#dfe6ec'); } // 자갈치 생선상자+갈매기
      else if (z === 5) { houseBlock(px + 60, base); flower(px + 160, base, '#9be3a0'); houseBlock(px + 200, base); }   // 감천 집+화분
      else if (z === 7) { cafeSet(px + 60, base); umbrella(px + 170, base, '#6fae8f'); cafeSet(px + 280, base); }       // 전포 카페 테이블+파라솔
      else { bush(px + 70, base); flower(px + 150, base, '#ffd34d'); bush(px + 220, base); }                            // 기본 덤불+꽃
    }
  }
  function umbrella(x, base, col) { // 비치 파라솔
    ctx.save();
    ctx.fillStyle = 'rgba(60,66,56,0.85)'; ctx.fillRect(x - 1.5, base - 40, 3, 42);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 24, base - 38); ctx.quadraticCurveTo(x, base - 56, x + 24, base - 38); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(x - 8, base - 43); ctx.quadraticCurveTo(x, base - 50, x + 8, base - 43); ctx.lineTo(x, base - 40); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function flower(x, base, col) { // 작은 꽃 한 송이
    ctx.save();
    ctx.strokeStyle = 'rgba(70,90,55,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, base - 16); ctx.stroke();
    ctx.fillStyle = col; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 4, base - 18 + Math.sin(a) * 4, 3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#fff5cc'; ctx.beginPath(); ctx.arc(x, base - 18, 2.4, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function seagullGround(x, base) { // 바닥에 앉은 갈매기
    ctx.save(); ctx.fillStyle = 'rgba(238,240,246,0.92)';
    ctx.beginPath(); ctx.ellipse(x, base - 8, 9, 6, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 6, base - 13, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffb24d'; ctx.beginPath(); ctx.moveTo(x + 9, base - 13); ctx.lineTo(x + 14, base - 12); ctx.lineTo(x + 9, base - 11); ctx.fill();
    ctx.fillStyle = 'rgba(70,80,95,0.8)'; ctx.beginPath(); ctx.ellipse(x - 3, base - 8, 6, 3, 0.3, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function fishBox(x, base, col) { // 수산시장 생선상자 — 얼음 위 은빛 생선
    ctx.save();
    ctx.fillStyle = col; ctx.fillRect(x - 18, base - 16, 36, 16);                                  // 상자
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x - 18, base - 4, 36, 4);
    ctx.fillStyle = 'rgba(226,238,248,0.92)'; ctx.fillRect(x - 16, base - 19, 32, 5);               // 얼음
    ctx.fillStyle = 'rgba(208,216,226,0.95)';                                                       // 생선 3마리
    for (let f = 0; f < 3; f++) { ctx.save(); ctx.translate(x - 10 + f * 10, base - 20); ctx.rotate((f - 1) * 0.35); ctx.beginPath(); ctx.ellipse(0, 0, 7, 3, 0, 0, TAU); ctx.moveTo(6, 0); ctx.lineTo(10, -3); ctx.lineTo(10, 3); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = 'rgba(60,70,80,0.8)'; for (let f = 0; f < 3; f++) { ctx.beginPath(); ctx.arc(x - 13 + f * 10, base - 20, 1, 0, TAU); ctx.fill(); } // 눈
    ctx.restore();
  }
  function cafeSet(x, base) { // 카페 화분(작은 나무 화분)
    ctx.save();
    ctx.fillStyle = 'rgba(140,104,76,0.92)'; ctx.beginPath(); ctx.moveTo(x - 7, base); ctx.lineTo(x - 5, base - 13); ctx.lineTo(x + 5, base - 13); ctx.lineTo(x + 7, base); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(96,142,98,0.92)'; ctx.beginPath(); ctx.arc(x, base - 18, 8, 0, TAU); ctx.arc(x - 6, base - 14, 6, 0, TAU); ctx.arc(x + 6, base - 14, 6, 0, TAU); ctx.fill();
    ctx.restore();
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
  // ── 콤보 카운터 (펫 위, 증가 시 팝) ── 직접 그린 불꽃 + 숫자
  function drawCombo() {
    if (state.combo < 2) return;
    const cx = petX, cy = player.worldY - state.camY - C.petRadius * 2.1;
    const pop = 1 + state.comboPopT * 0.5;
    const col = state.combo >= 15 ? '#A7D500' : state.combo >= 10 ? '#ff7a59' : state.combo >= 5 ? '#ffd34d' : '#fff';
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop);
    ctx.font = '900 26px Anton, "Black Han Sans", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const txt = String(state.combo), tw = ctx.measureText(txt).width, fw = 15, gap = 5, total = fw + gap + tw, sx = -total / 2;
    flameVec(sx + fw * 0.5, 0, 1);
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.strokeText(txt, sx + fw + gap, 0);
    ctx.fillStyle = col; ctx.fillText(txt, sx + fw + gap, 0);
    ctx.restore();
  }
  function flameVec(x, y, s) { // 캔버스용 불꽃
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#ff7a35';
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(7, -4, 3, 2); ctx.quadraticCurveTo(8, 0, 7, 6);
    ctx.arc(0, 7, 7, -0.4, Math.PI + 0.4, false); ctx.quadraticCurveTo(-6, 1, -2, -3); ctx.quadraticCurveTo(-3, -7, 0, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(0, 6.5, 3.2, 0, TAU); ctx.fill();
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
    if (elBand) elBand.innerHTML = ic('pin', { size: '1em' }) + ' ' + ZONES[currentZone()] + ' · ' + state.bandName + (realTemp != null ? ' · ' + ic('thermo', { size: '1em' }) + '부산 ' + Math.round(realTemp) + '°C' : '') + ' · #' + SEED + ' · build ' + BUILD;
    if (elGear) elGear.innerHTML = equipped.size ? (ic('shield', { size: '1em' }) + ' ' + [...equipped].map((id) => EQUIP[id].name).join(' · ')) : '맨몸';
    if (elCoins) elCoins.innerHTML = ic('coin') + ' ' + state.runCoins;
    if (elMtrack) {
      elMtrack.innerHTML = todaysMissions.map((m, i) => {
        const v = missionValue(m.metric), done = missionDone[i] || v >= m.goal;
        return '<span class="' + (done ? 'md' : '') + '">' + (done ? ic('check', { size: '0.95em' }) + ' ' : '') + MSHORT[m.metric] + ' ' + Math.min(v, m.goal) + '/' + m.goal + '</span>';
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
    if (mute) mute.addEventListener('click', (e) => { e.stopPropagation(); C.sound = !C.sound; mute.innerHTML = ic(C.sound ? 'soundOn' : 'soundOff', { size: '1.1em' }); if (C.sound) ensureAudio(); else { stopMusic(); setWind(0); } mute.blur(); });
    const homeStart = document.getElementById('homeStart');
    if (homeStart) homeStart.addEventListener('click', (e) => { e.stopPropagation(); ensureAudio(); startRun(); });
    const homeMore = document.getElementById('homeMore');
    if (homeMore) homeMore.addEventListener('click', (e) => { e.stopPropagation(); const d = document.getElementById('homeDetail'); if (!d) return; d.classList.toggle('show'); homeMore.innerHTML = d.classList.contains('show') ? '닫기 ▲' : (ic('tools') + ' 장비 · 스킨 · 업적 · 트레일 ▾'); });
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
      fetch('https://api.open-meteo.com/v1/forecast?latitude=' + C.weatherLat + '&longitude=' + C.weatherLon + '&current=temperature_2m,precipitation,weather_code')
        .then((r) => r.json()).then((d) => {
          const c = d && d.current; if (!c) return;
          const t = c.temperature_2m;
          if (typeof t === 'number') {
            realTemp = t;
            weatherMult = clamp(1 + (t - C.weatherTempBase) * C.weatherTempScale, C.weatherMultMin, C.weatherMultMax);
          }
          // WMO weather_code: 51~67 이슬비/비, 80~82 소나기, 95~99 뇌우 → 비
          const wc = c.weather_code | 0, prec = +c.precipitation || 0;
          const raining = prec > 0 || (wc >= 51 && wc <= 67) || (wc >= 80 && wc <= 99);
          rainAuto = raining; setRain(raining);
          updateWeatherUI();
        }).catch(() => {});
    } catch (e) {}
  }
  function weatherLine() {
    if (realTemp == null) return '';
    const pct = Math.round((weatherMult - 1) * 100);
    const icon = rainOn ? ic('rain') : ic('sun');
    const rainTxt = rainOn ? ' · 비 시원함' : '';
    return icon + ' 오늘 부산 실제 ' + Math.round(realTemp) + '°C' + (pct >= 0 ? ' · 더위 +' + pct + '%' : ' · 더위 ' + pct + '%') + rainTxt;
  }
  // 정적 HTML 요소의 이모지 → 직접 디자인한 인라인 SVG로 1회 치환
  function decorateStatic() {
    setHTML('mute', ic(C.sound ? 'soundOn' : 'soundOff', { size: '1.1em' }));
    setHTML('heaticon', ic('thermo', { size: '1em' }));
    setHTML('deadShare', ic('share') + ' 공유');
    setHTML('deadHome', ic('home') + ' 락커룸');
    setHTML('deadNewBest', ic('trophy', { size: '0.95em' }) + ' 신기록!');
    setHTML('deadCoinsL', ic('coin', { size: '0.95em' }) + ' 획득 코인');
    setHTML('deadBestL', ic('trophy', { size: '0.95em' }) + ' 오늘 최고');
    setHTML('deadRankL', ic('medal', { size: '0.95em' }) + ' 오늘 순위');
    setHTML('deadFlipsL', ic('flip', { size: '0.95em' }) + ' 플립 / 콤보');
    setHTML('deadMissionsL', ic('target', { size: '0.95em' }) + ' 미션 달성');
    setHTML('deadWeatherL', ic('thermo', { size: '0.95em' }) + ' 오늘 날씨');
    setHTML('deadUnlockL', ic('lock', { size: '0.95em', color: '#ff7a3d' }) + ' 다음 해금');
    setHTML('homeStart', '달리기 시작 ' + ic('runner', { color: '#243018' }));
    setHTML('homeMore', ic('tools') + ' 장비 · 스킨 · 업적 · 트레일 ▾');
    setHTML('lblMission', ic('target') + ' 오늘의 미션');
    setHTML('lblGear', ic('shield') + ' 장비 — 슬롯당 1개 (머리/목/하의/다리/발)');
    setHTML('lblSkin', ic('paw') + ' 펫 스킨');
    setHTML('lblTrail', ic('star') + ' 쿨링 트레일');
    setHTML('lblAch', ic('medal') + ' 업적 <span id="achCount" class="hbadge">0/10</span>');
  }
  function updateWeatherUI() {
    const el = document.getElementById('homeWeather'); if (el) el.innerHTML = weatherLine();
    // 순위 라벨에도 오늘 날씨 표시
    const ll = document.getElementById('lbLabel');
    if (ll) ll.innerHTML = realTemp == null ? (ic('trophy') + ' 오늘의 순위') : (ic('trophy') + ' 오늘의 순위 · ' + (rainOn ? ic('rain') : ic('thermo')) + Math.round(realTemp) + '°C');
  }
  function init() {
    resize();
    snapCamera();
    bindInput();
    decorateStatic();        // 정적 이모지 → 커스텀 SVG
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
    setRain: (on) => setRain(on), get rain() { return rainOn; },
    forceZone: (z) => { _forceZone = z; }, startZoneName,
  };

  /* ── 자동 QA 표준 훅 (개발자 피드백) ── 텍스트 스냅샷 + 시간 빨리감기 ── */
  window.render_game_to_text = function () {
    const m = state.distance / C.pxPerMeter;
    const L = [];
    L.push('PHASE=' + state.phase + '  BUILD=' + BUILD);
    L.push('DIST=' + m.toFixed(1) + 'm  ZONE=' + ZONES[currentZone()] + '  SPEED=' + state.speed.toFixed(0));
    L.push('HEAT=' + state.heat.toFixed(1) + '/' + C.heatMax + '  SHADE=' + state.shade.toFixed(2) + '  BAND=' + state.bandName);
    L.push('PLAYER grounded=' + player.grounded + ' flipping=' + player.flipping + ' doubleJumped=' + player.doubleJumped + ' worldY=' + player.worldY.toFixed(0) + ' rot=' + player.rot.toFixed(2));
    L.push('COMBO=' + state.combo + '(best ' + state.comboBest + ')  FLIPS=' + state.flipCount + '  WATER=' + state.waterCount + '  RUNCOINS=' + state.runCoins);
    L.push('META coins=' + meta.coins + ' achieved=' + meta.achieved.length + '/' + ACHIEVEMENTS.length + ' trail=' + meta.trail);
    L.push('WEATHER temp=' + (realTemp == null ? '?' : realTemp + 'C') + ' mult=' + weatherMult.toFixed(2) + ' rain=' + rainOn + '  RAMPAGE=' + state.rampage.toFixed(1));
    const ob = obstacles.filter((o) => o.x > state.worldX).sort((a, b) => a.x - b.x)[0];
    if (ob) L.push('NEXT_OBSTACLE=' + OBSTACLE_TYPES[ob.t].key + ' in ' + ((ob.x - state.worldX) / C.pxPerMeter).toFixed(1) + 'm');
    const gp = gaps.filter((g) => g.x > state.worldX).sort((a, b) => a.x - b.x)[0];
    if (gp) L.push('NEXT_GAP in ' + ((gp.x - state.worldX) / C.pxPerMeter).toFixed(1) + 'm width ' + (gp.w / C.pxPerMeter).toFixed(1) + 'm');
    const mz = todaysMissions.map((mm, i) => (missionDone[i] ? '✓' : Math.min(missionValue(mm.metric), mm.goal) + '/' + mm.goal) + '[' + mm.tier + ']').join(' ');
    L.push('MISSIONS ' + mz);
    return L.join('\n');
  };
  window.advanceTime = function (seconds, render) {
    const dt = 1 / 60, n = Math.max(1, Math.round((seconds || 1) / dt));
    for (let i = 0; i < n; i++) { update(dt); if (state.phase === 'dead') break; }
    if (render !== false) draw();
    return window.render_game_to_text();
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
