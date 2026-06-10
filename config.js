/* =====================================================================
   폭염 러너 (Heat Runner) — 튜닝 설정
   단계 1: 점프 손맛 전용. 모든 수치는 여기서 조정한다.
   ===================================================================== */
window.CONFIG = {
  /* ── 물리 (점프) ── (화면좌표: y 아래가 +, 점프속도는 음수=위로) */
  gravity: 2000,            // px/s^2  중력 (낮출수록 체공↑ → 플립 여유)
  fallGravityMult: 1.4,     // 하강 시 중력 가중 — 스내피한 착지감(둥둥 뜨는 느낌 제거)
  apexHangVel: 130,         // |vy|<이 값(정점 부근)이면 중력 약화 → 살짝 체공감
  apexGravityMult: 0.55,    // 정점 부근 중력 배수(작을수록 더 머묾)
  jumpVel: -830,            // px/s    점프 초기 속도 (위로)
  doubleJumpVel: -720,      // px/s    공중 두 번째 탭 = 더블 점프(위로 한 번 더) + 플립
  speedKmhScale: 1.2,       // (구) 화면 속도(km/h) 표시 배수 — 디버그 스냅샷용으로만 유지
  // ── 페이스 표시(러닝앱식 min/km) — 숫자 작을수록 빠름 ──
  paceSlowSecPerKm: 360,    // 시작(baseSpeed) 페이스 = 6'00"/km
  paceFastSecPerKm: 180,    // 최고속(maxSpeed) 페이스 = 3'00"/km
  paceFloorSecPerKm: 150,   // 부스트 시 최저(바닥) 페이스 = 2'30"/km
  // ── 준비운동(본 게임 시작 전 카운트다운) ──
  warmupOn: true,           // 홈 '달리기 시작' → 짧은 준비운동 후 출발 (사망 후 재시작은 즉시)
  warmupDuration: 1.5,      // 길이(초) — 탭하면 즉시 스킵
  warmupHop: 12,            // 펫 제자리 호핑 높이(px)
  // ── 월간 마라톤 이벤트(고정 코스 + 완주 시간 랭킹) ──
  marathonOn: true,         // 홈에 '이달의 마라톤' 진입 버튼 표시
  marathonDistM: 2195,      // 결승선 거리(미니 마라톤 — 42.195km 상징)
  marathonFinishCoin: 150,  // 완주 보너스 코인
  marathonMinMs: 120000,    // 완주 인정 하한(ms) — 이론 최단 ~140s보다 빠르면 위조로 보고 기록/제출 거부 (Firestore 규칙과 이중 방어)

  /* ── 질주 ── */
  baseSpeed: 290,           // px/s    시작 질주 속도(폰 반응시간 위해 약간 낮춤)
  speedRampPerSec: 1.7,     // px/s    초당 가속 (서서히 빨라짐)
  maxSpeed: 640,            // px/s    상한
  pxPerMeter: 50,           // 50px = 1m (거리 환산)

  /* ── 입력 손맛 ── */
  coyoteTime: 0.09,         // s  발 떨어진 직후 점프 허용 (단계2 지형용)
  jumpBuffer: 0.13,         // s  착지 직전 입력 버퍼 → 즉시 재점프

  /* ── 플립 (공중 홀드) ── */
  flipSpeed: 12.5,          // rad/s  홀드 시 회전 속도 (빠르고 눈에 띄게)
  flipTapKick: 1.25,        // rad    공중 두 번째 탭 즉시 회전 보정(짧은 더블탭도 플립으로 보이게)
  cleanLandTolerance: 0.6,  // rad    착지 시 'upright' 허용 오차

  /* ── 착지 보상 / 패널티 ── */
  cleanBoost: 110,          // px/s   깔끔 착지 일시 가속(70→110, 후반에도 체감되게)
  flipBoostMul: 0.6,        // 플립 1회당 보너스 배수 (×(1+flips*mul))
  boostDecay: 1.3,          // 1/s    보너스 감쇠(1.9→1.3, 부스트 지속 시간 늘림)
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

  petName: '단디',           // 펫(브랜드 마스코트) 이름 — 부산 사투리 '단단히·제대로' ("단디 달리라!")

  /* ── 레이아웃 ── */
  screenBrightness: 1.2,    // 게임 화면 밝기(1=원본, 1.2=+20%) — 캔버스 CSS 필터로 적용
  groundYRatio: 0.80,       // (참고용) 평지 기준 지면 위치
  petScreenXRatio: 0.30,    // 펫 화면 x 위치 (가로/PC)
  petScreenXRatioPortrait: 0.20, // 세로(폰)에선 더 왼쪽 → 앞을 더 보이게(반응시간↑)
  petTargetYRatio: 0.60,    // 펫이 화면에서 머무는 높이(카메라 타깃)
  petRadius: 30,            // 펫 기준 반지름(px, DPR 전 논리좌표)
  legCycle: 0.024,          // 다리 스윙 빈도 계수

  /* ── 지형 굴곡 (단계2) ── (사인 합성 — 단계4에서 시드 노이즈로 교체 예정) */
  /* Alto 톤: 완만하고 길게. 최대 경사 ~25° 내외로 유지. */
  terrainAmp1: 62,  terrainWave1: 860,   // 큰 언덕
  terrainAmp2: 34,  terrainWave2: 1600,  // 완만한 기복
  terrainAmp3: 7,   terrainWave3: 520,   // 잔결(약하게)
  groundSlopeMax: 0.9,      // (예비) 경사 제한
  // ── 직선(평지) 구간: 곡선 지형 사이에 평평한 직선길 삽입(결정적·공정) ──
  flatPeriod: 2200,         // 세그먼트 길이(px, ≈44m) — 이 단위로 직선/곡선 판정
  flatEvery: 3,             // N세그먼트마다 직선 1개(규칙적·가뭄 없음 → 약 132m마다 직선, 시드별 위상)
  flatEdge: 0.22,           // 양끝 전이 비율(부드럽게 평지로) — 가운데는 완전 직선

  /* ── 카메라 (단계2) ── */
  camFollow: 5.5,           // 1/s 수직 추적 부드러움 (낮을수록 점프 시 더 따라붙음)
  camGroundLock: true,      // true=지면 고정(점프해도 땅이 보임, 알토즈식) — 펫이 프레임 안에서 떠오름
  camTopMarginRatio: 0.16,  // 펫이 이 높이(화면 위)까지 차오르면 그때부터 카메라가 따라 올라감(데드존)

  /* ── 패럴랙스 (단계2) ── */
  parallaxFar: 0.16,        // 먼 도시·광안대교 스크롤 비율
  parallaxMid: 0.34,        // 해안선 언덕
  parallaxNear: 0.60,       // 가까운 야자수·해변

  /* ── 파티클 ── */
  dustOnLandBase: 8,
  dustOnTakeoff: 5,

  /* ── 체온 / 더위 (단계3) ── 이 게임의 주인공: 햇볕 노출 관리 */
  heatMax: 100,
  heatSunRate: 16,          // 햇볕 구간 초당 체온 상승 (더위 관리가 진짜 긴장되게)
  heatShadeRate: 12,        // 그늘 구간 초당 체온 하강 — 너무 확 시원해지지 않게 완만히 (sun>shade)
  heatShimmerFrom: 34,      // 이 이상 → 아지랑이/비네트 강화
  heatPantFrom: 55,         // 이 이상 → 펫 헥헥(땀)
  heatStartGrace: 3.0,      // s  시작 직후 상승 유예(살짝 적응 시간)
  heatRampPer1000m: 0.30,   // 거리 1000m마다 햇볕 가열 +30% (장거리일수록 더위가 진짜 위협 → "더위 관리" 체감)

  /* ── ★한방①: 오버히트 존 — 체온 한계 직전 줄타기 = 보상 (더위를 피하는 게 아니라 이용) ── */
  overheatFrom: 82,         // 체온 이 이상 = 오버히트 존 (100 = 여전히 즉사 — 리스크는 진짜)
  overheatCoinMult: 2,      // 존 안에서 획득 코인 배수
  overheatSpeedMult: 1.12,  // 존 안 속도 배수 (마라톤 기록 단축 전략으로도 활용 가능)
  /* ── ★한방②: 폭염 데이 — 실제 부산이 폭염이면 전 코인 보너스 (실제 더위 = 콘텐츠) ── */
  heatwaveTempC: 33,        // 실제 부산 기온 이 이상 = 폭염 데이
  heatwaveCoinMult: 1.5,    // 폭염 데이 코인 배수(오버히트와 곱연산 → 최대 ×3)

  /* ── 존별 시그니처 게임플레이 modifier (currentZone 인덱스 0~7 기준) ──
     heat=햇볕 체온상승 배수 / obstacle=장애물 밀도 배수 / water=물 추가 스폰 확률(>1) / tag=HUD 표시.
     없는 키는 1(기본). 밸런스는 여기서 조절. (0 서면·1 온천천·2 자갈치·3 광안리·4 해운대·5 감천·6 다대포·7 전포) */
  zoneMods: {
    2: { obstacle: 1.20, tag: '붐비는 시장' },           // 자갈치시장 — 좌판 많아 장애물↑
    4: { heat: 1.30, water: 1.6, tag: '땡볕 해변' },     // 해운대 — 땡볕 더위↑, 대신 물 많음
    5: { obstacle: 1.35, heat: 0.92, tag: '좁은 골목' }, // 감천문화마을 — 좁은 골목 장애물↑, 그늘 약간 시원
    6: { heat: 1.25, water: 1.5, tag: '땡볕 해변' },     // 다대포 해변 — 땡볕 더위↑, 물 많음
  },

  /* ── 햇볕/그늘 구간 (단계3) ── (단계4에서 시드/구조물로 확장) */
  shadePeriod: 1500,        // 햇볕↔그늘 반복 거리(px)
  shadeBand: [0.60, 0.84],  // 한 주기 내 그늘 위치(비율) — 그늘 비중 24%(더위 체감↑, 너무 빡세지 않게)
  shadeFeather: 0.06,       // 그늘 가장자리 부드러움
  shadeDeath: false,        // (그늘은 안전, 죽지 않음)

  /* ── 물 / 이온음료 픽업 (단계4) ── 더위 관리 수단 */
  waterCool: 24,            // 픽업 시 체온 즉시 감소 (완전 리셋이 아니라 '관리' 자원)
  waterSpacing: 1300,       // 평균 등장 간격(px) — 너무 잦으면 더위 관리 긴장이 사라짐
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
  gearCost: { flexer_cap: 0, frosty_gaiter: 120, run_shorts: 220, calf_sleeve: 360, hairband: 500, running_shoes: 420 }, // 천천히 모이게 ~3배

  /* ── 코인 / 메타 진행 (단계6) ── 런으로 코인 모아 장비 영구 해금 */
  coinSpacing: 760,         // 코인 평균 간격(px)
  coinJitter: 240,
  coinRadius: 30,           // 획득 반경
  coinMinH: 28,             // 지면 위 높이 범위(낮은 건 달리며, 높은 건 점프)
  coinMaxH: 155,
  coinDistBonusPer: 9000,   // 거리 N px(=180m)마다 +1 보너스 (수입 절반으로 늦춤)
  coinGainMult: 0.5,        // 미션·레벨업 보상 코인 배율 (수입 속도 조절 — 0.5=절반)

  /* ── 폭주 모드 (파워 부스트) ── 먹으면 몇 초간 무적+가속, 굴러서 장애물 파괴 ── */
  powerStartDist: 9000,     // 첫 파워 등장(px ~180m) — 첫 개는 보장 등장(~200m서 체험), 이후 드물게
  powerSpacing: 3400,       // 등장 간격(px) — 드물게(특별하게)
  powerJitter: 800,
  powerChance: 0.2,         // 슬롯당 등장 확률 (드물게 — 특별한 보상)
  powerRadius: 38,          // 획득 반경
  powerH: 70,               // 지면 위 높이
  rampageDuration: 4.5,     // s  지속 시간
  rampageSpeedMult: 1.7,    // 가속 배수
  rushSpeedMult: 1.25,      // 나이트 코인러시 속도 배수(이전 0 → 후반(maxSpeed 박힘) 일반과 똑같던 문제)

  /* ── 슬라이드(머리 위 현수막 통과) & 공중 다이브 ── */
  slideDuration: 0.75,      // s  슬라이드 유지 시간
  slideCooldown: 0.18,      // s  연속 슬라이드 방지(스팸 캔슬)
  swipeDownPx: 34,          // px 아래 스와이프 인식 이동량
  swipeDownMs: 140,         // ms 인식 시간창(탭과 구분)
  diveVy: 980,              // px/s 공중에서 아래 스와이프 = 급강하(착지 후 자동 슬라이드)
  overheadStartDist: 9000,  // 첫 현수막 등장 거리(px, ≈180m — 학습 여유)
  rampageSpin: 16,          // rad/s  굴러가는 회전 속도
  rampageHeatDrain: 35,     // s당 체온 하락(무적+냉각)
  smashCoin: 2,             // 장애물 파괴 시 코인

  /* ── 아이템(쿨링캡=실드 / 카본삭스=코인자석) ── 자사 제품 노출 + 사망 스트레스 완화 ── */
  itemStartDist: 1400,      // 첫 아이템 등장(px ~28m)
  itemFirstCapDist: 2400,   // ★첫 쿨링 캡 보장 거리(px ~48m) — 첫 장애물(~80m)보다 앞에 둬서 초반 충돌 스트레스↓
  itemSpacing: 1700,        // 등장 간격(px ~34m) — 더 꾸준히 등장
  itemJitter: 480,
  itemChance: 0.36,         // 슬롯당 등장 확률
  itemShieldWeight: 0.66,   // 실드(쿨링 캡) 비중 ↑ — 모자가 약 1.3배 더 자주 (자석은 비슷하게 유지)
  itemRadius: 40, itemH: 72,
  magnetDuration: 5.5,      // s  코인 자석 지속
  magnetRadius: 230,        // px  흡인 반경
  magnetPull: 7,            // 흡인 속도 계수

  /* ── 나이트 코인러시: 가끔 장애물 없이 코인만 쏟아지는 무적 구간 ── */
  rushFirstM: 450,          // 첫 러시 거리(m)
  rushIntervalM: 620,       // 이후 간격(m)
  rushDuration: 5.5,        // s  지속
  rushCoinSpacing: 110,     // px  러시 중 코인 촘촘히

  /* ── 마일스톤 이벤트: 3000m마다 "폭염 특별 구간"(보너스 코인 + 무적 코인러시 보상) ── */
  milestoneEventM: 3000,    // 이벤트 간격(m)
  milestoneBonusCoin: 40,   // 보너스 코인(×마일스톤 번호)

  /* ── 월간 랭킹 이벤트 (소셜 응모) ── 매달 1·2·3등 써머텍트 적립금 ──
     ★ 아래 3개만 채우면 활성화됩니다:
       submitUrl : 구글폼 등 응모 링크 (비워두면 '기록 공유'로 폴백)
       storeUrl  : 자사몰 주소 (비워두면 '제품 보러가기' 링크 숨김)
       prizeLine : 상품 안내 문구 (원하는 금액으로 수정) */
  event: {
    on: true,
    // 주간 랭킹(감독 처방④): 피드백 주기 4배 단축 — 금액은 진우님 비즈니스 판단으로 조정(아래는 월 총액 유지 환산 예시)
    prizeLine: '매주 1·2·3등 적립금 1만·5천·3천 (자사몰)',
    submitUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScU6FiHRPN-rwmY-eG3PXeabIhrHA93UI3SFeWtTDYxU63Dvg/viewform',
    storeUrl: 'https://summertect.com',
    // 7일 스트릭 달성 보상 쿠폰 — code가 비어 있으면 미발급(코인만). Cafe24 쿠폰 코드 발급 후 채우면 자동 활성.
    streakCoupon: { days: 7, code: '', desc: 'SUMMERTECT 자사몰 5,000원 쿠폰' },
  },

  /* ── 온라인 월간 랭킹 (Firebase) ── 스크린샷 위조 방지: 구글 로그인 + 서버 저장 점수 ──
     ★ Firebase 콘솔에서 웹앱 만들고 아래 4개만 붙이면 자동 활성화. 비어있으면 기존 봇 랭킹으로 폴백(게임 안 깨짐).
       (FIREBASE_SETUP.md 참고 — Authentication>Google 켜고, Firestore 만들고, 보안규칙 붙여넣기) */
  firebase: {
    apiKey: 'AIzaSyDh8BTAh5HFd6gz7fFaUScE-a3HGMcH7IM',
    authDomain: 'beat-the-heat-busan.firebaseapp.com',
    projectId: 'beat-the-heat-busan',
    appId: '1:472932049116:web:ae3fcc62efa4e28af31419',
  },
  // App Check (reCAPTCHA v3) — 봇/스크립트 직접 쓰기 차단(점수 조작 방어). reCAPTCHA v3 '사이트 키' 넣으면 활성. 비면 무시.
  appCheckKey: '',
  fcmVapidKey: '',          // (예약) Firebase Cloud Messaging 웹 푸시 인증서 키 — 폭염 데이 푸시용. FIREBASE_SETUP.md 참고. 비어 있으면 푸시 비활성.

  /* ── 플립 PERFECT (타이밍 보상) ── 플립은 항상 성공, 착지 순간 업라이트면 PERFECT */
  perfectLandTolerance: 0.45, // rad  이 안이면 PERFECT
  perfectCoin: 2,             // PERFECT 보너스 코인

  /* ── 콤보 (연속 플립/코인/착지) ── */
  comboWindow: 2.6,         // s  이 시간 안에 이어가면 콤보 유지
  comboMilestone: 5,        // N콤보마다 보너스
  comboMilestoneCoin: 5,    // 마일스톤 보너스 코인

  /* ── 폴리시 ── */
  deathSlowmo: 0.7,         // s  사망 슬로모 지속(이후 결과 카드)

  /* ── 부산 랜드마크 구간 목표 (단계7) ── 거리(m) 도달 시 배너 + 보너스 코인 ── */
  landmarks: [
    { m: 250,  name: '온천천 산책로', icon: '🏞️', bonus: 10 },
    { m: 600,  name: '자갈치 시장',   icon: '🐟', bonus: 15 },
    { m: 1100, name: '광안대교',      icon: '🌉', bonus: 25 },
    { m: 1800, name: '해운대 해변',   icon: '🏖️', bonus: 35 },
    { m: 2700, name: '감천문화마을',  icon: '🏘️', bonus: 50 },
    { m: 3800, name: '다대포 일몰',   icon: '🌅', bonus: 70 },
  ],

  /* ── "어제의 나" 고스트 레이스 (감독 처방②) — 직전 베스트 런과 함께 달리기 ── */
  ghostOn: true,            // 고스트 표시(끄면 기록도 중단)
  ghostSampleSec: 0.1,      // 궤적 샘플 간격(초) — 10분 런 ≈ 12000개(60KB) 수준
  ghostBeatCoin: 20,        // 고스트(직전 기록) 추월 시 보너스 코인(1회)

  /* ── 스트릭(연속 출석) — 매일 첫 런 완료 시 누적 보너스, 끊기면 리셋 (감독 처방①: "달리기는 habit") ── */
  streakBonus: [10, 20, 30, 45, 60, 80, 100],  // 1일~7일+의 보너스 코인(7일 이후 100 유지)

  /* ── 데일리 미션 (단계7) ── 매일(시드) 3개. 완료 시 보너스 코인 ── */
  missionReward: 45,
  /* ── 미션 레벨업 (젯팩식 연속 미션) ── 3개 다 깨면 즉시 레벨업+새 미션 ── */
  missionGoalScalePer: 0.12,   // 레벨당 목표 +12% (점진적으로 어려워짐 → cascade 자연 정지)
  missionLevelBonus: 20,       // 레벨업 기본 보너스 코인
  missionLevelBonusPer: 10,    // 레벨당 추가 보너스(×레벨)

  /* ── 장애물 / 균열 (단계8) ── 점프를 "생존"으로 만든다. 부딪히거나 빠지면 런 종료 ── */
  obstacleSpacing: 820,     // 장애물 슬롯 간격(px)
  obstacleJitter: 260,
  obstacleChance: 0.58,     // 슬롯당 등장 확률 (0.5→0.58 — 한산함 줄이기, 재미 레버③)
  /* ── 장애물 패턴/웨이브 (재미 레버①): 단일 장애물을 가끔 콤보로 승격 ── */
  patternChance: 0.35,      // 스폰 시 패턴(콤보)으로 승격될 확률
  patternStartDist: 20000,  // 패턴 등장 시작(px, ≈400m — 기본기 학습 후)
  /* ── 니어미스 체인 (재미 레버②): 아슬아슬 연속 통과 시 보상 배수 ── */
  nearChainWindow: 4.0,     // s  이 시간 안에 다음 니어미스 → 체인 유지
  nearChainCap: 5,          // 체인 보상 배수 상한 (2·4·6·8·10코인)
  obstacleEaseM: 350,       // 이 거리(m)까지 장애물 밀도를 점진적으로 올림(초반 워밍업 — 첫 사망 너무 빠르지 않게)
  nearMissPx: 26,           // 장애물을 이 간격 이내로 아슬아슬 통과 시 니어미스 보너스(실력 보상)
  nearMissCoin: 2,          // 니어미스 보너스 코인
  minObstacleSpacing: 470,  // 장애물 사이 최소 간격(px) — 점프·착지·반응 시간 보장
  obstacleFlattenRange: 130,// 장애물을 근처 이 범위(px) 안 가장 평탄한 곳으로 이동 — 공정성
  obstacleMaxSlope: 0.34,   // 이 경사(rad)보다 가파르면 장애물 미배치(불합리한 점프 방지)
  gapClearPx: 430,          // 구멍 앞뒤 이만큼은 장애물 없음(구멍↔장애물 반응시간 확보)
  obstacleW: 34,            // 폭(충돌)
  obstacleH: 52,            // 높이(이만큼 못 넘으면 충돌)
  obstacleStartDist: 4000,  // 첫 장애물 ~80m (초보 첫 판 학습 시간 — 너무 빨리 죽지 않게)

  gapSpacing: 1500,         // 균열 슬롯 간격(px)
  gapJitter: 400,
  gapChance: 0.5,
  gapMinW: 80, gapMaxW: 175, // 균열 폭(px) — 점프로 건너야 함
  gapStartDist: 8000,       // 첫 균열 ~25초 뒤 (처음엔 장애물+더위만, 구멍은 나중에)

  /* ── 실제 부산 날씨 연동 (Open-Meteo, 무료·키 불필요) ── 실제 더울수록 게임도 더 빡세게 ── */
  weatherLat: 35.18, weatherLon: 129.08,
  weatherTempBase: 28,      // 기준 기온(°C)
  weatherTempScale: 0.022,  // °C당 햇볕 가열 배수 변화
  weatherMultMin: 0.85, weatherMultMax: 1.7,  // 쿨한 날도 더위가 어느 정도 느껴지게 하한 상향
  // 비: 실제 부산에 비 오면 화면에도 비 + 시원함(체온 천천히 상승)
  rainDropCount: 130,       // 빗방울 수
  rainSunMult: 0.42,        // 비 올 때 햇볕 가열 배수(구름)
  rainCoolPerSec: 5,        // 비 올 때 추가 냉각(체온/초)

  /* ── 사운드 / BGM (단계9) ── 파일 없이 WebAudio 절차 생성 ── */
  sound: true,
  musicVol: 0.5,            // BGM 마스터 음량
  bgmBeatMs: 460,           // 비트 간격(ms) — 잔잔하게
  windVol: 0.05,            // 속도 바람소리 최대 음량
};
