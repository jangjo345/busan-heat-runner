/* =====================================================================
   폭염 러너 (Heat Runner) — 튜닝 설정
   단계 1: 점프 손맛 전용. 모든 수치는 여기서 조정한다.
   ===================================================================== */
window.CONFIG = {
  /* ── 물리 (점프) ── (화면좌표: y 아래가 +, 점프속도는 음수=위로) */
  gravity: 2000,            // px/s^2  중력 (낮출수록 체공↑ → 플립 여유)
  jumpVel: -830,            // px/s    점프 초기 속도 (위로)
  doubleJumpVel: -720,      // px/s    공중 두 번째 탭 = 더블 점프(위로 한 번 더) + 플립

  /* ── 질주 ── */
  baseSpeed: 320,           // px/s    시작 질주 속도
  speedRampPerSec: 2.2,     // px/s    초당 가속 (서서히 빨라짐)
  maxSpeed: 760,            // px/s    상한
  pxPerMeter: 50,           // 50px = 1m (거리 환산)

  /* ── 입력 손맛 ── */
  coyoteTime: 0.09,         // s  발 떨어진 직후 점프 허용 (단계2 지형용)
  jumpBuffer: 0.13,         // s  착지 직전 입력 버퍼 → 즉시 재점프

  /* ── 플립 (공중 홀드) ── */
  flipSpeed: 12.5,          // rad/s  홀드 시 회전 속도 (빠르고 눈에 띄게)
  flipTapKick: 1.25,        // rad    공중 두 번째 탭 즉시 회전 보정(짧은 더블탭도 플립으로 보이게)
  cleanLandTolerance: 0.6,  // rad    착지 시 'upright' 허용 오차

  /* ── 착지 보상 / 패널티 ── */
  cleanBoost: 70,           // px/s   깔끔 착지 일시 가속
  flipBoostMul: 0.6,        // 플립 1회당 보너스 배수 (×(1+flips*mul))
  boostDecay: 1.9,          // 1/s    보너스 감쇠
  stumblePenalty: 0.40,     // 비율   휘청 시 속도 손실
  stumbleRecover: 1.4,      // s      휘청 회복 시간
  minLandImpactForShake: 360, // px/s 이 낙하속도 넘으면 화면 흔들림

  /* ── squash & stretch ── */
  takeoffStretch: 0.20,     // 점프 순간 세로로 늘어남
  landSquashMax: 0.40,      // 착지 시 최대 납작
  squashSpring: 15,         // 1/s  원형 복원 속도

  /* ── 카메라 흔들림 ── */
  shakeHard: 9,             // px  강착지
  shakeStumble: 5,          // px  휘청
  shakeDecay: 13,           // 1/s 감쇠

  /* ── 레이아웃 ── */
  groundYRatio: 0.80,       // (참고용) 평지 기준 지면 위치
  petScreenXRatio: 0.30,    // 펫 화면 x 위치
  petTargetYRatio: 0.60,    // 펫이 화면에서 머무는 높이(카메라 타깃)
  petRadius: 30,            // 펫 기준 반지름(px, DPR 전 논리좌표)
  legCycle: 0.024,          // 다리 스윙 빈도 계수

  /* ── 지형 굴곡 (단계2) ── (사인 합성 — 단계4에서 시드 노이즈로 교체 예정) */
  /* Alto 톤: 완만하고 길게. 최대 경사 ~25° 내외로 유지. */
  terrainAmp1: 62,  terrainWave1: 860,   // 큰 언덕
  terrainAmp2: 34,  terrainWave2: 1600,  // 완만한 기복
  terrainAmp3: 7,   terrainWave3: 520,   // 잔결(약하게)
  groundSlopeMax: 0.9,      // (예비) 경사 제한

  /* ── 카메라 (단계2) ── */
  camFollow: 5.5,           // 1/s 수직 추적 부드러움 (낮을수록 점프 시 더 따라붙음)

  /* ── 패럴랙스 (단계2) ── */
  parallaxFar: 0.16,        // 먼 도시·광안대교 스크롤 비율
  parallaxMid: 0.34,        // 해안선 언덕
  parallaxNear: 0.60,       // 가까운 야자수·해변

  /* ── 파티클 ── */
  dustOnLandBase: 8,
  dustOnTakeoff: 5,

  /* ── 체온 / 더위 (단계3) ── 이 게임의 주인공: 햇볕 노출 관리 */
  heatMax: 100,
  heatSunRate: 14,          // 햇볕 구간 초당 체온 상승
  heatShadeRate: 18,        // 그늘 구간 초당 체온 하강 (sun>shade라 결국 더위가 이김 → 런 종료)
  heatShimmerFrom: 34,      // 이 이상 → 아지랑이/비네트 강화
  heatPantFrom: 55,         // 이 이상 → 펫 헥헥(땀)
  heatStartGrace: 3.0,      // s  시작 직후 상승 유예(살짝 적응 시간)
  heatRampPer1000m: 0.22,   // 거리 1000m마다 햇볕 가열 +22% (난이도 상승 → 런이 결국 끝남)

  /* ── 햇볕/그늘 구간 (단계3) ── (단계4에서 시드/구조물로 확장) */
  shadePeriod: 1500,        // 햇볕↔그늘 반복 거리(px)
  shadeBand: [0.56, 0.86],  // 한 주기 내 그늘 위치(비율)
  shadeFeather: 0.06,       // 그늘 가장자리 부드러움
  shadeDeath: false,        // (그늘은 안전, 죽지 않음)

  /* ── 물 / 이온음료 픽업 (단계4) ── 더위 관리 수단 */
  waterCool: 32,            // 픽업 시 체온 즉시 감소
  waterSpacing: 1000,       // 평균 등장 간격(px)
  waterJitter: 360,         // 간격 흔들림
  waterRadius: 34,          // 획득 반경(px)
  waterMinH: 42,            // 지면 위 최소 높이(달리며 획득)
  waterMaxH: 135,           // 최대 높이(점프 필요)

  /* ── 시간대 사이클 (단계4) ── 거리에 따라 새벽→밤 순환, 정오=피크 위험 */
  metersPerBand: 240,       // 한 시간대 지속(m)

  /* ── 점수 (단계4) ── */
  flipScoreBonus: 12,       // 플립 1회당 보너스 거리(m)

  /* ── 장비 (단계5) ── SUMMERTECT 제품. 스펙=효과(광고 톤 금지). 수치는 여기서 튜닝.
     MVP: flexer_cap / frosty_gaiter / run_shorts 효과 구현. 나머지는 구조만. */
  /* 효과는 중첩(스택)된다. 같은 파라미터는 곱(mult)·합(coolPerSec)으로 합산. */
  gear: {
    flexer_cap:    { sunMult: 0.8 },                     // UPF: 햇볕 가열 -20%
    frosty_gaiter: { coolPerSec: 4 },                    // 냉감: 항시 체온 -4/s
    run_shorts:    { jumpMult: 1.10 },                   // 점프 높이 +10%
    calf_sleeve:   { speedMult: 1.05, stumbleRecMult: 0.65 }, // 속도 +5% / 휘청 회복 35%↑
    hairband:      { waterRadiusMult: 1.4, waterCoolMult: 1.3 }, // 물 획득 반경·효과 ↑
    running_shoes: { speedMult: 1.08, jumpMult: 1.06 },  // 경량 반발: 속도·점프 ↑
  },
  gearDefault: ['flexer_cap'],            // 시작 보유/착용 (나머지는 코인으로 해금)
  gearCost: { flexer_cap: 0, frosty_gaiter: 45, run_shorts: 80, calf_sleeve: 130, hairband: 180, running_shoes: 160 },

  /* ── 코인 / 메타 진행 (단계6) ── 런으로 코인 모아 장비 영구 해금 */
  coinSpacing: 760,         // 코인 평균 간격(px)
  coinJitter: 240,
  coinRadius: 30,           // 획득 반경
  coinMinH: 28,             // 지면 위 높이 범위(낮은 건 달리며, 높은 건 점프)
  coinMaxH: 155,
  coinDistBonusPer: 2500,   // 거리 N px(=50m)마다 +1 보너스 (픽업 수집이 주 수입)

  /* ── 폭주 모드 (파워 부스트) ── 먹으면 몇 초간 무적+가속, 굴러서 장애물 파괴 ── */
  powerStartDist: 1600,     // 첫 파워 등장(px)
  powerSpacing: 3400,       // 등장 간격(px) — 드물게(특별하게)
  powerJitter: 800,
  powerChance: 0.2,         // 슬롯당 등장 확률 (드물게 — 특별한 보상)
  powerRadius: 38,          // 획득 반경
  powerH: 70,               // 지면 위 높이
  rampageDuration: 4.5,     // s  지속 시간
  rampageSpeedMult: 1.7,    // 가속 배수
  rampageSpin: 16,          // rad/s  굴러가는 회전 속도
  rampageHeatDrain: 35,     // s당 체온 하락(무적+냉각)
  smashCoin: 2,             // 장애물 파괴 시 코인

  /* ── 폴리시 ── */
  deathSlowmo: 0.7,         // s  사망 슬로모 지속(이후 결과 카드)

  /* ── 부산 랜드마크 구간 목표 (단계7) ── 거리(m) 도달 시 배너 + 보너스 코인 ── */
  landmarks: [
    { m: 500,  name: '온천천 산책로', icon: '🏞️', bonus: 10 },
    { m: 1200, name: '자갈치 시장',   icon: '🐟', bonus: 15 },
    { m: 2000, name: '광안대교',      icon: '🌉', bonus: 25 },
    { m: 3000, name: '해운대 해변',   icon: '🏖️', bonus: 35 },
    { m: 4200, name: '감천문화마을',  icon: '🏘️', bonus: 50 },
    { m: 5500, name: '다대포 일몰',   icon: '🌅', bonus: 70 },
  ],

  /* ── 데일리 미션 (단계7) ── 매일(시드) 3개. 완료 시 보너스 코인(하루 1회) ── */
  missionReward: 45,

  /* ── 장애물 / 균열 (단계8) ── 점프를 "생존"으로 만든다. 부딪히거나 빠지면 런 종료 ── */
  obstacleSpacing: 820,     // 장애물 슬롯 간격(px)
  obstacleJitter: 260,
  obstacleChance: 0.62,     // 슬롯당 등장 확률
  obstacleW: 34,            // 폭(충돌)
  obstacleH: 52,            // 높이(이만큼 못 넘으면 충돌)
  obstacleStartDist: 2700,  // 첫 장애물 ~8초 뒤 (초반 사망 방지 — 조작 익힐 시간)

  gapSpacing: 1500,         // 균열 슬롯 간격(px)
  gapJitter: 400,
  gapChance: 0.5,
  gapMinW: 80, gapMaxW: 175, // 균열 폭(px) — 점프로 건너야 함
  gapStartDist: 8000,       // 첫 균열 ~25초 뒤 (처음엔 장애물+더위만, 구멍은 나중에)

  /* ── 사운드 / BGM (단계9) ── 파일 없이 WebAudio 절차 생성 ── */
  sound: true,
  musicVol: 0.5,            // BGM 마스터 음량
  bgmBeatMs: 460,           // 비트 간격(ms) — 잔잔하게
  windVol: 0.05,            // 속도 바람소리 최대 음량
};
