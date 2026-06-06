/* BEAT THE HEAT: BUSAN — 정적 데이터 분리 (build 63 ~)
 * 게임 로직과 독립적인 상수/아이콘 정의. game.js IIFE 시작부에서 destructure.
 * 분리 이점: 172KB game.js의 가독성 + 캐시 분리(데이터만 바꿀 때 game.js 캐시 유지).
 * file:// 호환 위해 ES module 대신 IIFE + window.HR_DATA. */
(function () {
  // ── 인라인 SVG 아이콘 (이모지 대신 — 진우님 정책: 디자인된 SVG만) ──
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
    pause: (c) => '<rect x="7" y="5" width="3.4" height="14" rx="1.2" fill="' + (c || '#fff') + '"/><rect x="13.6" y="5" width="3.4" height="14" rx="1.2" fill="' + (c || '#fff') + '"/>',
  };
  function ic(name, opts) {
    opts = opts || {};
    const fn = ICONS[name]; if (!fn) return '';
    const s = opts.size || '1.05em';
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" style="display:inline-block;vertical-align:-0.16em;flex:none">' + fn(opts.color) + '</svg>';
  }

  // ── 시간대(거리에 따라 순환). 정오=가장 더움, 밤=시원.
  const TBANDS = [
    { key: '새벽', sky: ['#5b6fa6', '#caa6b0', '#f0c79a'], sun: 0.5 },
    { key: '오전', sky: ['#6f97c4', '#cfe0ee', '#fef0d8'], sun: 0.95 },
    { key: '정오', sky: ['#7fc6e6', '#cfeaf2', '#fffbe8'], sun: 1.6 },
    { key: '오후', sky: ['#e9a86a', '#f3c489', '#ffe0ab'], sun: 1.3 },
    { key: '저녁', sky: ['#9c6fae', '#e08a9a', '#f6b07a'], sun: 0.7 },
    { key: '밤', sky: ['#22305f', '#3a4a7a', '#6a6a96'], sun: 0.35 },
  ];

  // ── 구역: 거리에 따라 부산 명소로 배경이 바뀐다 ──
  const ZONES = ['서면 도심', '온천천', '자갈치시장', '광안리', '해운대', '감천문화마을', '다대포 해변', '전포 카페거리'];

  // ── 장애물: 종류별 높이/폭이 달라 점프 타이밍이 다양해짐 ──
  const OBSTACLE_TYPES = [
    { key: 'cone', w: 34, h: 52, wgt: 3 },     // 라바콘
    { key: 'rock', w: 44, h: 40, wgt: 3 },     // 바위(넓고 낮음)
    { key: 'parasol', w: 30, h: 80, wgt: 2 },  // 파라솔(높음 — 높이 점프)
    { key: 'chair', w: 50, h: 44, wgt: 2 },    // 캠핑의자(넓음)
    { key: 'sand', w: 54, h: 32, wgt: 2 },     // 모래성(낮고 넓음)
  ];
  const OBS_WSUM = OBSTACLE_TYPES.reduce((a, b) => a + b.wgt, 0);

  const DEATH_INFO = { heat: ['overheat', '열사병!'], fall: ['fall', '추락!'], crash: ['crash', '충돌!'] };

  // ── window 전역으로 노출 (file:// 호환 — ES module 안 씀) ──
  window.HR_DATA = { ICONS, ic, TBANDS, ZONES, OBSTACLE_TYPES, OBS_WSUM, DEATH_INFO };
})();
