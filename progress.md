폭염 러너 (Heat Runner) — 진행 기록 / SUMMERTECT 브랜드 원버튼 엔드리스 러너
파일: index.html + config.js(튜닝값) + game.js(엔진). HTML5 Canvas 2D + rAF, 바닐라 IIFE, classic <script>.
배포: GitHub Pages (jangjo345/busan-heat-runner) → https://jangjo345.github.io/busan-heat-runner/
재배포: git add/commit/push → 1~2분 자동 반영. 매 배포 BUILD 상수 + ?v=N 동기 증가(캐시버스트).
디버그 핸들: window.HR (state/player/step(dt)/setRain/...) + window.render_game_to_text() + window.advanceTime(sec).

──────────────────────────────────────────────────────────────────────
2026-06-03  (이력은 최신 → 과거 순)

[build 31] 속도 km/h 표시 + 스내피 점프 + 배경 디테일
- ★시속 표시(유저 "후반 가속 체감 안됨"): #speed HUD(좌상단 코인 아래), currentKmh()=유효속도/pxPerMeter*3.6*speedKmhScale(1.2). 베이스~26 → 최고~55 → 카본부스트~94km/h. 부스트 시 골드+scale.
- ★스내피 점프(게임개발자 "둥둥 뜨면 아마추어"): 하강 시 중력 ×fallGravityMult(1.4), 정점 부근(|vy|<apexHangVel 130) 중력 ×apexGravityMult(0.55)로 살짝 체공. 점프 높이(클리어 가능성)는 유지, 착지감만 묵직.
- ★배경 디테일(유저 "너무 대충"): drawGroundDetail(지면 풀포기·자갈·밝은 흙 띠, 월드좌표 고정→무깜빡), drawParallaxMid에 더 먼 능선(깊이) + 전봇대/나무 실루엣 추가.
- 시작버튼 cubic-bezier 이징.
- ★게임개발자 "바이브코딩 탈출" 체크리스트 — 이미 구현된 것: DPR/레티나(resize: DPR=min(dpr,2.5), canvas W*DPR), 화면흔들림(state.shake), 파티클(먼지/물/코인/스파크/디브리), WebAudio SFX(점프/코인/충돌/플립/스매시), Pretendard, 팔레트 라임+그레이프 제한. 신규 반영=스내피 물리·버튼 이징·속도표시.

[build 30] 게임명 BEAT THE HEAT: BUSAN + 브랜드컬러(라임·그레이프) + 자갈치 수산물시장 + 용어
- ★게임명 변경: 폭염 러너 → "BEAT THE HEAT: BUSAN"(타이틀 Anton + "BUSAN" 태그, 페이지 title, 브랜드 라벨, 공유문구/navigator.share title).
- ★브랜드 컬러(유저: "대표 컬러 2개로 조합" = 라임 #A7D500 + 그레이프 #3D4A35): build29 오렌지/차콜 → 라임/그레이프. :root --bg #14180f(다크 그레이프) --heat #A7D500 --heat2 #c4e85a --amber #FFD24D(코인 골드 토큰만) --glass-bd 라임틴트. sed로 rgba(255,87,34)→rgba(167,213,0), 오렌지 hex→라임 hex 일괄 치환. 라임 버튼은 다크텍스트(#1b2410). 글래스모피즘 레이아웃은 유지. ★인게임 캔버스 라임은 원래부터 라임이라 일관.
- ★자갈치 수산물시장(유저 "자갈치 느낌 안남"): farHarbor 재작성 — 물결지붕 시장건물+간판띠, 줄무늬 좌판 차양 6동(빨강/파랑/노랑/초록 ×흰 줄무늬), 생선상자(빨강/파랑/은색)+얼음+은빛생선, 어선2, 갈매기4. 전경 z===2 = fishBox(얼음+은빛 생선상자)+앉은갈매기.
- ★용어(게임개발자): 차고 → 락커룸(deadHome), 잔상 트레일 → 쿨링 트레일(섹션/homeMore), 트레일명 라임/카본반발/쿨링.
- QA: HR.forceZone(z) 추가(오늘 회전상 안 나오는 구역 미리보기). 검증 홈/자갈치 스샷, 콘솔0.
- 참고(게임개발자 글로벌 히트작 벤치마킹 의견): 다수 이미 구현됨(체온게이지=수분메커니즘, 물픽업, 파티클/쉐이크/콤보=쥬스, 카본부스트=피버, 데일리미션, 시간대). 미구현 후보=실드(1히트면제) 아이템·코인자석·게임오버 미션 게이지바·전용 나이트 코인러시·쿠폰 리워드(백엔드).

[build 29] 홈·게임오버 UI 전면 리디자인(폭염 테마/글래스모피즘) + 장애물 공정성
- ★게임 디자이너 피드백 ("촌스럽다=프로토타입 느낌"): 컬러 시스템 재정의 — :root에 --bg #121214(다크차콜) --heat #FF5722(네온오렌지) --amber #FFC107 --ink #E6E4E2 --glass. 기존 라임-온-네이비 → 폭염 테마 오렌지/앰버-온-차콜. (라임 #A7D500은 인게임 캔버스 전용 유지)
- ★홈: 배경 = 차콜 + 상단 오렌지 radial glow + 미세 그리드(40px). 타이틀 히트 그라데이션(Black Han Sans). 슬림 글래스 헤더바(.htopline→.hbar: 출발지+코인). 날씨 pill. 도전카드 글래스모피즘(rgba black+blur, 앰버 보더). 시작버튼 오렌지 그라데이션+글로우+hover scale(1.03)/active(.97). hmore/카드 전부 글래스+오렌지/앰버 액센트.
- ★게임오버: 투박한 텍스트 나열 → 구조화. .badge(상태 아이콘+제목 pill, popper 애니) / .score(그라데이션 점수+m 앰버+신기록 pill) / .statsboard 2열 글래스 카드(코인hl·최고·순위·플립콤보·미션·**오늘 날씨**·해금full) / .again(blink) / .deadbtns(공유 글래스 + 차고 오렌지). finalizeDeath는 값(sv)만 설정, 라벨(sl)은 decorateStatic서 아이콘+텍스트.
- ★장애물 공정성(유저 "883m 돌 불합리"): 진단=장애물이 롤링힐 가파른 사면(±0.4rad)에 놓여 점프 불공정. 수정 = `flattestNear(ox,130,7)`로 근처 가장 평탄한 지점으로 스냅 + `obstacleMaxSlope 0.34` 캡(이상 미배치) + gapClearPx 330→430(구멍↔장애물 반응시간) + obstacleChance 0.45→0.5. 결과 평균|경사| 0.4→0.065, max 0.32.
- 커스텀 SVG 아이콘 유지(이모지 0). 검증: 홈/게임오버/디테일 스샷 확인, 콘솔0.

[build 28] 이모지 전면 제거(커스텀 SVG) + 카본화 부스트 + 매일 출발지 + 홈 네모박스 수정
- ★이모지 제거(브랜드 "바이브코딩 느낌" 우려): game.js에 직접 디자인한 인라인 SVG 아이콘 세트 ICONS{} + ic(name,{size,color}) 헬퍼(~30종: coin/drop/shoe/trophy/medal/flame/target/lock/check/star/ruler/calendar/runner/flip/share/home/shield/paw/pin/thermo/sun/rain/tools/cap/scarf/shorts/sock/band/fall/crash/overheat/sound...). setHTML 헬퍼로 textContent→innerHTML 전환. 정적 HTML 이모지는 id 부여 후 decorateStatic()가 init서 1회 치환. 캔버스 이모지(콤보🔥, 폭주⚡)는 벡터로 직접 그림(flameVec). 결과: index.html 이모지 0, game.js는 코드주석만 잔존.
- ★카본화: 파워업 별/오브 → 카본 플레이트 러닝화(carbonShoe: 어두운 갑피+라임 카본솔+속도선+라임 글로우). "폭주"→"카본 부스트" 리브랜딩(배너/HUD/주석). 메커니즘(무적·가속·파괴) 동일.
- ★매일 출발지(유저 요청): const ZONE_ROT = SEED % ZONES.length, currentZone()=(zoneByDist()+ZONE_ROT)%N → 매일 시작 구역 회전. ZONES 8개로(서면도심/온천천/자갈치시장/광안리/해운대/감천문화마을/다대포해변/전포카페거리), 신규 farCafe(차양 줄무늬+간판+창)+cafeSet(화분). startZoneName() 홈/공유 표기. (오늘 SEED%8=3 → 광안리 출발)
- ★홈 네모박스(반복 제보): 원인 = .htop position:sticky + 반투명 패널 background(rgba(36,44,64,.97))가 #home 그라데이션과 미세 색차 → 사각형 가장자리 보임. 조치: htop 배경/sticky 제거, #home align-items flex-start + padding-top clamp(36px,12vh,120px)로 균형. 스크린샷으로 사라짐 확인.
- 검증: node --check OK, 홈 렌더 이모지 0·SVG 55개, 카본화 픽업/부스트/콤보불꽃/비/구역배경 스크린샷 확인, 콘솔 에러 0.

[build 27] 배경 디테일+귀엽게 / 비 / QA훅 / 홈여백 / 미션완화 / 순위날씨
- 배경 대폭 강화(유저 "구역 구분이 안 됨"): 먼 배경에 창문 격자(fwin, 밤=밝게 winAlpha)·옥상물탱크·갈매기(seagull)·귀여운 나무(softTree) 추가. 구역별 시그니처 — 도심(빌딩+창문), 자갈치(크레인+창고+알록달록 어선+갈매기), 광안대교(현수교 케이블 조명), 해운대(고층+창문+대관람차 회전), 감천(밝은 파스텔 집+지붕+창), 온천천(초록언덕+나무), 다대포(노을언덕+야자+갈매기). 전경에 비치파라솔(umbrella)·꽃(flower)·앉은 갈매기(seagullGround).
- 비(rain): 실제 부산 강수 연동. fetchWeather가 precipitation+weather_code도 받아 비면 rainAuto→setRain. 빗줄기(rainDrops)+바닥 튐(rainSplashes)+흐린 베일, drawRain()은 draw 후반(shimmer 뒤). 비 오면 햇볕 약화(rainSunMult 0.42)+추가 냉각(rainCoolPerSec 5)=체온 천천히. 수동: HR.setRain(true). ※2026-06-03 부산 실제 비 → 자동 ON 확인.
- QA 표준훅(개발자 요청): window.render_game_to_text()(phase/dist/zone/heat/player/combo/meta/weather/다음장애물·구멍/미션 텍스트 스냅샷), window.advanceTime(초)(고정 dt 빨리감기 후 스냅샷).
- 홈 상단 여백(P3): align-items center→flex-start, padding-top clamp(20px,5vh,64px) + overflow-y auto. 모바일서 위로 당겨짐.
- 미션 완화(P2): 쉬움 80m/코인6/플립2, 보통 500m/코인25/플립10/물5, 어려움 1500m/코인55/플립22/깔끔10. "오늘 다 깰만함" 톤.
- 순위창 날씨(유저 요청): lbLabel "🏆 오늘의 순위 · 🌧️21°C", lbCaption "🌧️ 비 오는 21°C 부산에서 오늘 최고 N m 주파!".
- 검증: node --check OK, 7개 구역 전부 draw 무에러, 비 렌더 무에러, 콘솔 에러 0.

[build 26] 업적 + 코스메틱 트레일 + 모바일 좁은화면 완화
- 업적 10종(ACHIEVEMENTS, meta.stats 누적/단판 기반): 첫질주500m·플립100·콤보30·장거리1500m·물100·코인1000·1위·플립500·1만m·7일연속 → 영구배지 meta.achieved + 보너스코인(20~150). finalizeDeath서 stats 누적+updateStreak(SEED 날짜차 연속일)+checkAchievements, 결과창 #deadAch 표시.
- 코스메틱 트레일 3종(라임120/불꽃220/물방울220): meta.trail/ownedTrails, drawTrail 펫 뒤 색 잔상(lighter, 0.5s). 코인 소비처. onTrailCard 구매/장착. 차고 #homeDetail에 🏅업적그리드+✨트레일그리드.
- 모바일: baseSpeed 320→290·ramp 2.2→1.7·maxSpeed 760→640, 세로화면 펫 좌측 petScreenXRatioPortrait 0.20(resize H>W면 적용).
- saveMeta에 trail/ownedTrails/achieved/stats 추가 저장(localStorage hr-meta-v1).

[build 25] 난이도 완화(장애물0.45·최소간격470·구멍앞뒤330) / 날씨 cooling 연동 / HUD 겹침 정리(코인 좌상단·미션트래커 하단) / 구역 앞당김(온천천 250m~다대포 3800m) / 인게임 실제기온 표시.
[build 22] 실제 부산 날씨 Open-Meteo 연동(weatherMult), 장비비용~3배·미션~3배 상향(이후 다시 완화), 폭주 첫등장 ~210m 보장, 시작창 radial→linear(밝은 patch 제거).
[build 19] 콤보(addCombo, 🔥팝, 마일스톤 보너스) + 구역별 배경 실루엣.
[build 17] ★더블점프 — 공중 2번째 탭=위로 부스트(-720)+플립 래치. 유저 "폰에서 잘됨" 확인.
[build 14] 재시작 버그(#dead pointerdown 핸들러), 폰 더블탭(#game touch-action:none), 슬롯형 장비(equipSlot).
[~build 10] 장애물/구멍 추가(점프 동기), 플립 input.held 의존 제거→공중 onDown 즉시 래치, 추락 사망 깊이기준.

진행 단계(전부 완료): ①점프 ②지형/패럴랙스/카메라 ③체온/햇볕/그늘 ④물/시간대/거리/데일리시드/결과 ⑤장비 ⑥폴리시/메타 + 사운드·리더보드·콤보·구역배경·폭주·날씨·업적·트레일·비.

알려진 이슈/주의:
- 인스타/카톡 인앱 브라우저는 캐시가 강함 → "크롬/사파리로 열기" 안내. BUILD 번호로 버전 확인.
- 기록·코인·장비·스킨·업적·트레일은 기기 브라우저 localStorage 저장(서버 계정 아님).

다음 후보: 구역 경계 크로스페이드, 비 외 날씨(안개/노을 강조), 업적 더보기/칭호 장착, 밸런스 실측 튜닝.
