폭염 러너 (Heat Runner) — 진행 기록 / SUMMERTECT 브랜드 원버튼 엔드리스 러너
파일: index.html + config.js(튜닝값) + game.js(엔진). HTML5 Canvas 2D + rAF, 바닐라 IIFE, classic <script>.
배포: GitHub Pages (jangjo345/busan-heat-runner) → https://jangjo345.github.io/busan-heat-runner/
재배포: git add/commit/push → 1~2분 자동 반영. 매 배포 BUILD 상수 + ?v=N 동기 증가(캐시버스트).
디버그 핸들: window.HR (state/player/step(dt)/setRain/...) + window.render_game_to_text() + window.advanceTime(sec).

──────────────────────────────────────────────────────────────────────
2026-06-03~04  (이력은 최신 → 과거 순)

[build 81] ★"어제의 나" 고스트 레이스 (감독 처방② — 차별화 한방)
- 매 일반 런의 궤적을 0.1s 간격 [worldX, 지면위높이(슬라이드=-1)] flat 배열로 기록(15분 cap ~70KB) → localStorage 'hr-ghost' {seed, dist, s}. 갱신: 새 날=첫 런으로 교체, 같은 날=더 멀 때만. ★높이(지면 대비) 저장이라 일별 지형이 바뀌어도 고스트가 땅에 안 묻힘.
- 재생: 다음 런에서 state.t 기반 보간(드로우만, 물리 영향 0). 반투명 하늘색 펫 실루엣+눈+머리 위 라벨('오늘의 나'/'어제의 나'). 기록 끝=사망 지점에 머묾('여기까지', 알파↓). 슬라이드 자세 재현. drawPet 직전 레이어.
- 추월: distance > ghost.dist 순간 1회 — '어제의 나 추월! +20코인(coinMult 적용)'+petPop+sparkle. "랭킹 1등"이 아니라 "어제의 나 이기기"가 매일의 목표(PB 정서).
- 마라톤: 기록·재생 모두 제외. 검증: 기록 98샘플/저장·로드·렌더 예외0·추월 1회+중복0·더 먼 런 갱신·어제 라벨·마라톤 미적용·콘솔0.
- 세션 사고 기록: 감독 임시커밋(6537622)이 index.html을 CP949+BOM 손상 → 감독 자가 재작성(1359f81, UTF8-OK 검증). origin 미푸시라 라이브 무사고.
- 다음: ③PWA/푸시(폭염 데이 알림 — SW는 network-first로 캐시 사고 방지 설계).

[build 80] 감독 검수 마감 — 주간 전환 문구 잔재 2곳 수정 (총괄감독 직접 커밋)
- game.js 554(사망 화면)·687(락커룸 로그인 버튼) '월간 랭킹 참가'→'주간 랭킹 참가' — build 79서 누락된 사용자 노출 문구 (주석 4곳은 무해라 유지, 마라톤 '월간'은 의도).
- 감독 검수 결과(build 78~79): 스트릭 2일차 +20·같은날 중복 0·7일차 +100+업적150·쿠폰 모달 code '' 미표시 — 전부 실측 합격. "코인 자석 역방향" 리포트는 감독이 오탐 판정(lerp 정상).
- ★진우님 결정 확정(2026-06-10): ④주간 랭킹+상금 매주 1만·5천·3천 승인 / 7일 스트릭 Cafe24 5,000원 쿠폰 연결 승인(코드 발급 대기 — 수령 즉시 config.event.streakCoupon.code 1줄). 마라톤 규칙 콘솔 게시 완료(P0-1 해소, 감독 라이브 검증).
- 다음 착수: ②"어제의 나" 고스트 레이스 → ③PWA/푸시(폭염 데이 알림).

[build 79] 주간 랭킹 전환 + 7일 스트릭 쿠폰 (감독 처방④ + 쿠폰 연결)
- 거리 랭킹 월간→주간: weekKey()='W'+그 주 월요일 YYYYMMDD(ISO 주번호 연초 버그 회피). monthBest/noteMonthBest→weekBest/noteWeekBest('hr-wb-'), submitOnlineScore/fetchOnlineTop이 weekKey 사용(Firestore month 필드에 주간 키 — 기존 규칙 docId==month+'_'+uid 그대로 통과, 마이그레이션 불필요). UI 문구 '이번 달'→'이번 주' 7곳. prizeLine '매주 1·2·3등 적립금 1만·5천·3천'(금액은 진우님 조정 가능).
- 마라톤은 월간 유지(monthKey 3곳 — 고정 코스 정체성).
- 7일 스트릭 쿠폰: config.event.streakCoupon {days:7, code:'', desc}. code 비면 미발급(현행 코인만). grantDailyStreak서 streak===days && 미수령 시 쿠폰 모달(#couponModal — pmcard 재사용+.cpcode 점선 박스, 복사 버튼 clipboard). meta.coupons로 중복 지급 방지(영구 저장).
- 검증: weekKey 월요일·주간 베스트 저장·'이번 주' 라벨·마라톤 '이달의' 유지·쿠폰 모달+claimed+중복차단·무결성 300f 런타임0·콘솔0.
- ★진우님 결정 대기: Cafe24 쿠폰 코드 발급(→config 1줄)·주간 상금액 확정·마라톤 규칙 콘솔 게시(P0). ②고스트·③PWA/푸시는 다음 착수.

[build 78] 스트릭(연속 출석) 시스템 — 감독 리텐션 처방① ("달리기는 habit")
- 기존 updateStreak(업적 카운트만, 보상 없음·1회성 streak7 업적뿐)를 보상 지급형으로 확장: 반환값=오늘 첫 완료 여부. grantDailyStreak() — 매일 첫 런 완료(사망 finalizeDeath/마라톤 완주 finishMarathon 양쪽) 시 1회, config.streakBonus [10,20,30,45,60,80,100](7일+ cap 100) meta.coins 지급 + 배너 'N일 연속 러닝!'(7일+ '꾸준함이 곧 실력!').
- 홈 표시: homeSeed 라인에 flame 아이콘+'N일 연속'(2일부터).
- 검증: 어제 연결 2→3일 +30·같은날 중복 0·3일 공백 리셋 1 +10·9→10일 +100(+150 streak7 업적 자동 발화=의도)·마라톤 완주도 스트릭·홈 '10일 연속' 표시·콘솔0.
- 감독 처방 ②고스트 ③푸시(PWA) ④주간 랭킹은 진우님 결정 대기(쿠폰·상금 구조 = 비즈니스 결정 포함).

[build 77] 총괄감독 평가 반영 — P1 3건 + P0-2 클라 방어 + 오버히트 글로우
- [P1-3 실버그] 마라톤 미완주가 일별 최고기록 오염: finalizeDeath의 bestKey 갱신에 !state.marathon 가드. 검증: 마라톤 1500m 사망 후 bestKey 100 유지.
- [P1-4] 자정 넘기면 어제 코스 갇힘(모바일 탭 유지): showHome 진입 시 오늘 날짜≠SEED면 location.reload(). 오늘=SEED일 땐 무동작 확인.
- [P1-5] 마라톤 HUD 정체성: 마라톤 중 메인 숫자=경과 시간(fmtTime), span=남은 Nm, 미션 트래커 숨김. 일반 런 복귀 시 원복. 검증: 75.4s/1000m → "1'15"4 / 남은 1195m" / mtracker 빈칸 → 일반 "0 m"+트래커 복귀.
- [P0-2c] 마라톤 시간 위조 클라 1차 방어: marathonMinMs 120000(이론 최단 ~140s). finishMarathon서 미만이면 로컬 저장+제출 거부(console.warn), submitMarathonTime 이중 가드. 검증: 100s 거부 / 200s 저장(200017ms).
- [P2] 오버히트 보상 체감: 가장자리 황금-주황 글로우 상시(알파 0.30+0.12sin) — '위험'이 아니라 '벌고 있는 중'으로 읽히게.
- FIREBASE_SETUP.md: marathon 규칙 timeMs 하한 1000→120000(이중 방어), 월말 수동 검수 절차 명문화(거리+마라톤 모두, 비정상 패턴 체크리스트, 폼 응모 대조), 중복 구 섹션 제거.
- ★진우님 콘솔 액션(P0-1·P0-2): marathon 컬렉션 규칙 콘솔에 미적용(라이브서 permission denied — 랭킹 조용히 실패 중) → FIREBASE_SETUP.md 규칙 붙여넣기. App Check 키 발급 시 활성화 가능.
- P2 백로그(다음 스프린트): 렌더 per-frame 할당 캐시화(중저가 안드로이드), iOS 실기기 스와이프 QA, 아지랑이 밴딩 폴리시.
- 콘솔0·file:// OK.

[build 76] ★★게임의 한방: 오버히트 존 + 폭염 데이 (진우님 "우리만의 한방" 요청 → 기획 승인)
- 콘셉트: 더위를 '피하는' 게임 → 더위와 '줄타기'하는 게임. 한 문장 = "체온이 터지기 직전까지 버틸수록 돈을 버는 게임"(BEAT THE HEAT 제목 완성). 모든 물/그늘이 의사결정이 됨(먹으면 안전하지만 배수 풀림).
- ①오버히트 존: heat≥overheatFrom(82) → 코인 ×2(overheatCoinMult)·속도 ×1.12(eff/pace/kmh 3곳). 100=여전히 즉사(리스크 진짜). 진입 엣지 배너 '오버히트!'+쉐이크, HUD 칩 '오버히트 ×N'(popper 펄스), 비네트 펄스(×1.18+sin), 펫 발갛게 맥동. 쿨링 기어=존에서 더 버티는 장비 → 게임 장비 가치=실제 제품 가치(브랜드 정렬).
- ②폭염 데이: 실제 부산 realTemp≥heatwaveTempC(33) → 전 코인 ×1.5(heatwaveCoinMult, 오버히트와 곱=최대 ×3). 시작카드 '폭염 데이! 전 코인 1.5배'. 실제 폭염=마케팅 이벤트(8월 내내 자연 리텐션).
- coinMult() 적용 지점: 코인 픽업·니어미스 체인·PERFECT·스매시(런 중 액션 보상 — 미션/레벨/마일스톤 고정 보너스는 제외).
- 검증: 평상+1/오버히트+2/폭염+2/둘다+3·페이스 3'00"→2'30"·HUD칩·진입배너·100°사망 유지·600프레임 런타임0·콘솔0·file:// OK. 마라톤서 오버히트 줄타기=기록 단축 전략(의도된 깊이).

[build 75] 재미 레버 3종: 패턴/웨이브 + 니어미스 체인 + 밀도 상향 (진우님 승인)
- ①패턴(웨이브): data.js OBSTACLE_PATTERNS 4종 — double(콘×2 연속점프)·jump-slide(콘→현수막)·slide-jump(현수막→바위)·rhythm3(모래성×3 리듬). 스폰 시 patternChance(0.35)로 단일→콤보 승격, patternStartDist 20000(~400m, 기본기 학습 후). 패턴 내 간격 330~360px(점프 체공 240~530px·슬라이드 전환 고려). 각 위치 inGap/nearGap/경사 체크(불공정 방지). 결정적 시드.
- ②니어미스 체인: nearMissReward() — 아슬아슬/슬라이드 통과 연속 시 보상 2·4·6·8·10(cap5), nearChainWindow 4s 내 유지·만료 리셋. ×3부터 배너 '아슬아슬 체인!'. state.nmChain/nmChainT.
- ③밀도: obstacleChance 0.5→0.58. 패턴 포함 실측 57m→31m당 1개.
- 검증: 400m 이후 클러스터 12쌍/이전 0·체인 2→4(×2)→6(×3)·5초 경과 후 리셋·600프레임 혼합 입력 런타임0·콘솔0·file:// OK.

[build 74] ★슬라이드 + 머리 위 현수막 + 판정 정확도 (유저: 재미없다·판정 부정확·머리 위 장애물 요청)
- 핵심 진단: 동사(verb)가 점프 하나뿐 → 모든 장애물 답이 같아 자동조종화. 두 번째 동사(슬라이드)+머리 위 장애물로 순간 판단 부여.
- 슬라이드: 아래 스와이프(터치, swipeDownPx34/Ms140)·↓/S(키보드). slideDuration 0.75s+쿨0.18s. 점프=즉시 기상. 공중 스와이프=다이브(diveVy980)→착지 자동 슬라이드. 탭으로 새나간 점프/더블점프/플립은 스와이프 인식 시 환불·해제(onSwipeDown). 펫 슬라이드 자세(translate+scale 1.22/0.58)+먼지.
- 현수막(banner): OBSTACLE_TYPES 6번째(overhead, gap52, bh140, w60, wgt2). overheadStartDist 9000(~180m, 그 전엔 콘으로 대체). 세로구간 [barTop,barBottom] vs 펫 [top,bottom] 겹침=충돌(무적=통과, 실드=1회 방어). 슬라이드 통과=+2코인 '슬라이드!'. 더블점프 타이밍으로 위 넘기도 가능(bh140 — 스킬 표현). 렌더: 하늘 로프+주황/흰 줄무늬 천+스티커 윤곽+▼유도, 흔들림. 첫 등장 시 1회 안내 배너(state.slideHint, 페이지당 1회).
- 판정 정확도: 종류별 hitW 도입 — cone .36(삼각)·rock .46·parasol .26(기둥)·chair .44·sand .46 + 펫 코어 0.55r→0.45r. 라바콘 기준 33.5px→25.7px(23%↓). "보이는 것보다 좁게" = 억울한 죽음 제거(시각적 스침은 생존).
- 검증: 슬라이드 발동/지속/쿨다운·현수막 무슬라이드=사망/슬라이드=생존+2코인/낮은점프=사망·콘 유효32px 생존(예전 사망)/20px 사망·다이브→자동슬라이드·600프레임 혼합 입력 런타임0·콘솔0·file:// OK.
- hint/hsub/README 조작 안내 갱신. HR.slide() QA훅.

[build 73] 후반 부스트 무력화 수정 — "3000m+에서 일반=부스트" (유저)
- 진단: 일반 속도가 ~2635m서 maxSpeed(640) 박힘. 그 후 rush(나이트 코인러시)는 속도 배수 0이라 일반과 완전 동일(+0%, 페이스 3'00"→3'00"). PERFECT cleanBoost(+70/decay1.9)는 1초 뒤 +1.6%로 미미.
- ★수정:
  · rushSpeedMult 1.25 신설 → eff/currentPaceSec/currentKmh 셋 다에 *(rush>0?Mult:1) 적용. 코인러시 +25%(2'30") 명확.
  · cleanBoost 70→110, boostDecay 1.9→1.3 → PERFECT 직후 +17%(2'30"), 1초 뒤도 +5%(2'45") 지속.
- 검증(3000m+ speed=maxSpeed 가정): 일반640 / rush800(+25%) / PERFECT 직후750·1초뒤670 / rampage1088(+70%) 그대로. 콘솔0·문법OK.

[build 72] 적립금 응모 폼 연결 (구글 폼) + eventAction 분기 수정
- config.event.submitUrl: 구글 폼 URL(1FAIpQLScU6FiHRPN-rwmY-eG3PXeabIhrHA93UI3SFeWtTDYxU63Dvg) 설정. prizeLine: '매월 1·2·3등 적립금 5만·3만·1만 (자사몰)'. event.on=true·appCheckKey 빈 값 유지.
- ★분기 수정(명세 검증 위해 game.js도 손댐, 진우님 A 선택 승인): eventAction이 onlineOn()&&fbReady면 submitUrl 분기 못 갔던 문제 → submitUrl 있으면 항상 최우선으로 폼 새 탭. Firebase 점수 등록은 finalizeDeath서 자동(중복 안 됨). 미로그인 시 signInGoogle()로 자동 등록 안내.
- 검증: 결과화면(dead) deadEvent·홈 homeEvent 양쪽 클릭 → 둘 다 폼 URL(target=_blank, opts=noopener) 새 탭. 소셜공유 폴백 0건. 콘솔 Firebase popup 에러 2건은 헤드리스 프리뷰 제약(실 환경 무관).

[build 71] 시작 펫 선글라스 제거 — '눈처럼 보여 무섭다' 피드백
- 원인: gearDefault=['flexer_cap']이라 모든 신규 플레이어가 시작부터 쿨링기어 → PART C에서 추가한 검은 타원 선글라스가 자연스러운 큰 눈처럼 보여 호러. 진우님 정확한 표현: "선글라스같지않고 그냥눈처럼보여서 무서워요".
- ★수정: drawPet의 (hasGear('flexer_cap')||hasGear('frosty_gaiter')) 선글라스 블록 전체 제거. flexer_cap 효과(햇볕 -20%)는 그대로 유지. 기본 귀여운 눈 항상 보임.
- 검증: defaultEquipped=['flexer_cap'] 유지·sunglasses 미렌더·게임루프 정상·콘솔0.

[build 70] 무서운 펫 눈 제거 + 랜드마크 배너=배경 동기화 (유저 피드백)
- ①펫 눈 무서움: PART C서 추가한 큰 흰자+검은 동공(흠칫) / 반달눈(기쁨·안도) 표정이 무섭게 보임. ★수정: 기본 귀여운 눈은 항상 유지(눈 그대로). 흠칫=식은땀만 / PERFECT=별빛만 / 쿨링기어=선글라스만. petRelief는 시각 없음(연출 X, 상태만).
- ②랜드마크 배너=배경 불일치(진짜 원인): config.landmarks가 고정 이름('온천천/자갈치/광안대교/해운대/감천/다대포')으로 매기되 zone은 zoneRot(SEED 회전)이 들어가 매일 출발 다름. 250m에서 zoneIdx=1+rot=다른 zone, 배경은 그 zone인데 배너는 '온천천' → mismatch.
  · ★수정: checkLandmarks의 banner 제목을 ZONES[currentZone()]+' 진입!'으로 → 배경=배너 항상 일치. 거리·보너스는 그대로(공정성 유지).
  · 검증: 6개 랜드마크 m 전 트리거 → 모든 zone에서 배너=배경 일치.
- 콘솔0·file:// OK.

[build 69] 버그 2종 수정 (유저 피드백)
- ②"안 부딪혔는데 충돌사(~3540m)": 충돌 창이 좌우 대칭이라 점프로 넘은 뒤 착지하며 내려올 때, 이미 지나친 장애물이 뒤쪽 창(±41px)에 남아 clearance≤0 → die('crash'). ★수정: clearance>0(펫이 위로 통과)이면 o.cleared=true 표시, 이후 !o.cleared일 때만 충돌. (build64는 무적 케이스만 고쳤음; 이건 사망 케이스)
  · 검증: 넘은뒤 착지=생존(cleared) / 진짜 접근충돌=사망 유지.
- ①홈 배경/이름 불일치: showHome이 state.distance/worldX를 안 리셋 → 한 판 뛰고 락커룸 오면 배경은 죽은 지점 존인데 라벨('오늘의 출발')은 시작 존. ★수정: showHome서 resetRun() 호출(setCourseSeed(SEED) 뒤) → 월드를 오늘 코스 시작점으로, phase=home 복원. 더위 잔상(붉은 틴트)도 제거.
  · 검증: 36m 뒤 홈 → distance/worldX/heat=0, 배경=출발 존 일치.
- 참고: 인게임은 far/mid/near 전부 currentZone() 동일 프레임이라 항상 일치(8존 전부 전용 전경 확인). 불일치는 홈 한정이었음.
- 콘솔0·file:// OK.

[build 68] PART C: 펫 마스코트화 (브랜드 ROI) — 표정 반응 + 선글라스
- drawPet에 덧그리기(코어 무손상): PERFECT=반달눈(^)+머리 위 별빛 반짝 / near-miss=눈 크게+식은땀(흠칫) / 그늘 진입=안도 반달눈 / 상시 미세 숨쉬기 바운스(grounded) / 쿨링기어(flexer_cap·frosty_gaiter) 장착=선글라스.
- 반응 타이머 state.petPop/petFlinch/petRelief: PERFECT(0.5)·near-miss(0.4)·그늘(0.8)서 set, 매 프레임 감쇠.
- 검증: 그늘 안도 런 중 자동 발화·각 표정+선글라스 draw 예외0·감쇠 동작·게임루프 런타임0·콘솔0·file:// OK.
- ★펫 이름 후보(진우님 확정 대상): ①써미(Summi, SUMMER+친근) ②쿨이(Cooli, 쿨링 콘셉트) ③부기(부산 Busan 지역색). 확정 시 결과/홈에 표기 연결 예정.

[build 67] PART B: 날씨 시각화 (실제 부산 더위를 게임 전면으로 — 공유성)
- 시작카드: weatherLine() 등급 메시지 — 폭염(≥33 "오늘은 SUMMERTECT가 필요한 날")·무더위(≥29)·한여름(≥25)·선선·비, 실제 realTemp 분기 + (더위 N.NN×) 표기. .hweather 멀티라인 카드형으로 CSS 조정.
- 플레이 중: weatherVis()=rainOn?0.5:clamp(weatherMult,.85,1.7). 기존 drawShimmer 알파·drawVignette 더위붉음(hv)에 곱 → 더운 날 더 타들어감/비 안도. 새 시스템 아님(증폭).
- 사망화면: deadWeather에 '°C · N.NN×' 표기. 열사병+weatherMult≥1.15면 deadGap '오늘 부산 더위 1.5× — 더위가 빨랐습니다'(마라톤은 기존 우선).
- QA훅: HR.setWeather(t,m)·HR.weather(realTemp/weatherMult/rainOn/vis).
- 검증: 5등급 메시지 정확·weatherVis 1.7>0.85>0.5(비)·게임루프(시머/비네트 호출) 런타임0·사망 더위메시지·콘솔0·file:// OK.

[build 66] PART A: 존별 시그니처 게임플레이 (콘셉트를 게임플레이 전면으로)
- 문제: currentZone()이 렌더에만 쓰여 8개 존이 보기만 다르고 게임 동일.
- config.zoneMods(데이터 주도): heat(햇볕 체온상승 배수)·obstacle(장애물 밀도 배수)·water(물 추가 스폰 확률)·tag(HUD). 코어 물리 무손상, 배수만.
  · 자갈치(2) obstacle1.2 '붐비는 시장' / 해운대(4) heat1.3+water1.6 '땡볕 해변' / 감천(5) obstacle1.35+heat0.92 '좁은 골목' / 다대포(6) heat1.25+water1.5 '땡볕 해변'. 나머지 기본.
- game.js: zoneIdxByM/zoneAtM/currentZone/zmod/zoneTag. 더위 항에 *zHeat, 장애물 스폰에 *zObs(스폰위치 존), 물 슬롯에 땡볕존 추가 1병(결정적), HUD 존라벨에 tag.
- STEP2 버그수정: zoneByDist가 6에서 캡→전포(7) 거리로 도달 불가였음. zoneIdxByM에 <5000→6, else→7 추가.
- 검증(forceZone playtest): 더위 해운대13>기본10>감천9 · 물 해운대6>기본4 · 장애물 감천18/자갈치16/기본15(min간격이 과밀 방지=공정) · 전포(7) 도달 · 런타임0 · 콘솔0 · file:// 호환(window 전역).

[build 65] 익명 닉네임 기본값 — 공개 랭킹 구글 실명 노출 방지 (인스타 공유 대비)
- 원인: playerName()이 닉네임 미설정 시 fbUser.displayName(구글 표시이름=실명 가능)으로 폴백 → 공개 리더보드에 실명 노출 위험.
- 수정: anonName()(uid 해시→'러너####' 안정적 익명) 신설. playerName() 폴백을 displayName→anonName으로 교체(displayName 전 코드서 완전 제거). 첫 로그인 닉네임 모달 prefill도 실명 대신 anonName 제안.
- 검증: anonName 같은uid=동일·다른uid=구별·형식 '러너1883'. displayName 잔재 0(grep). 게임 루프 정상·콘솔0.

[build 64] 무적 중 "안 부딪혔는데 장애물 깨짐" 버그 수정 (유저 피드백)
- 원인: updateObstacles 무적 분기(rush/rampage)가 가로 겹침만으로 smashObstacle 호출 — clearance(높이) 미체크. 점프로 깨끗이 넘어가도 아래 장애물이 부서지고 sfx('smash') 남, 무적이라 사망X. "가끔(러시/부스트 중)" 정확히 일치.
- 수정: 무적 파괴를 clearance<=0(실제 충돌 높이) 안으로 이동 — 경로상 장애물만 부수고, 점프로 넘어간 건 그대로. (실드 분기는 이미 clearance 안에 있어 무관)
- 검증 4케이스: 무적+flyover=안깨짐(was 깨짐)·무적+지면=깨짐+코인·일반+flyover=생존/안깨짐·일반+지면=사망. 콘솔0.

[build 63] P2-부분: 정적 데이터 분리 (game.js → data.js)
- game.js 172KB 분할 1단계(가장 안전한 정적 데이터만): ICONS+ic·TBANDS·ZONES·OBSTACLE_TYPES+OBS_WSUM·DEATH_INFO를 data.js(IIFE→window.HR_DATA)로 이전. game.js 시작부에서 destructure. file:// 호환 위해 ES module 대신 window 전역.
- index.html 로드 순서: config.js → data.js → game.js (모두 ?v=63). game.js는 HR_DATA 없으면 명확한 에러 throw.
- 마이그레이션은 앵커 기반 Node 스크립트(assertion: 인라인 잔재 0·destructure 1회)로 수행 후 스크립트 삭제. game.js 163,316→153,856B(-9,460).
- 검증: node -c 양쪽 OK. 프리뷰 reload — HR_DATA.ic('coin') SVG 정상·ZONES8/TBANDS6/OBS5/WSUM12/DEATH_INFO 동일·게임루프240f+8점프+forceZone 런타임0·홈 아이콘 정상·콘솔0.
- ★로직 분할(physics/render 등)은 단일 IIFE 클로저(state/player/C 자유참조) mass-rewrite라 회귀 위험 큼 → 보류(데이터 분리만 안전 확정). App Check(STEP2)는 reCAPTCHA 키 없어 스킵.

[build 62] 균열 위 코인 — "뛰어도 못 먹는" 버그 수정 (친구 피드백)
- 원인: updateCoins 스폰 분기만 inGap(x) 체크 누락 — 다른 픽업(장애물/파워/아이템)은 다 체크함. 균열(추락 구간) 위에 코인이 그대로 떠 있어 점프로 도달 불가(닿으려면 추락→사망).
- 실측: 시드 결정적 재현으로 코인 399개 중 21개(5.3%)가 균열 위 + 14개(3.5%)가 가장자리 60px 이내. 첫 문제 코인 338m(매판 만남).
- ★수정: spawn 분기에 nearGap(x) 체크 — gap.x-petRadius ~ gap.x+gap.w+petRadius 범위 회피. updateGaps(aheadX+320)가 updateCoins(aheadX+240)보다 먼저 호출돼 gap 결정 보장.
- 검증: 새 로직 시뮬레이션 400슬롯 → 균열 위 코인 0개(was 21), 회피된 30개(7.5%). 콘솔0.

[build 61 + chore archive] 꾸미기 섹션 아래로 + 구 턴제 CLI 폐기 (P1)
- ux(home): 락커룸 순서 미션→순위→장비→업적 (기능) → 꾸미기 구분선 → 펫스킨→트레일 (꾸미기). 친구 피드백 "스킨/트레일 뭐 쓰는지 모름" 후속 보강. CSS .hcosmeticDivider 점선 라벨 추가.
- chore archive: 초기 프로토타입(턴제 CLI 펫게임) 전부 _archive/로 git mv(이력 보존): src/ (events/game/items/pet/save/time/ui), data/ (endings/events/items), index.js, README.md→_archive/README_turnbased.md, busan-runner-v2.html(orphan). 의존성 안전 게이트(grep src/·data/·index.js·fetch(·import·require) 0건 확인 후 진행.
- package.json: type:module 유지(serve.js ESM), main/start/new 스크립트 제거(node index.js 깨짐), CLI deps chalk/prompts 제거(러너 미사용), keywords endless-runner/canvas로 갱신. package-lock.json 재생성(deps 트리 비어짐).
- README.md 재작성: 러너 정체·실행법(index.html 더블클릭 / npm run web)·메커닉(더위/코인/페이스/마라톤/직선길)·튜닝(config.js)·랭킹(FIREBASE_SETUP.md)·QA 훅(HR)·archive 1줄.
- 검증: index.html 스크립트=config.js+game.js만(archive 무참조)·러너 reload 후 phase running·dist 5m·런타임/콘솔 에러 0·serve.js HTTP 200(deps 제거 무영향).

[build 60] ★월간 마라톤 이벤트 (유저 아이디어 ①/3) — 고정 코스 + 완주 시간 랭킹
- 시드 리팩터: TP const→let+makeTP(seed), hash01이 mutable courseSeed 사용, setCourseSeed(seed)로 전환. MARATHON_SEED=YYYYMM(월 고정→그 달엔 모두 같은 코스). ZONE_ROT→zoneRot()(courseSeed 기반). 일반 모드는 courseSeed=SEED라 무변화(검증: 일반 지형 동일).
- 모드: state.marathon. enterMarathon(setCourseSeed(MARATHON)+resetRun+warmup). 결승선 C.marathonDistM(2195m) 도달→finishMarathon(phase 'finish', 월드정지, 완주시간=state.t, 코인 +150, 로컬 베스트=최소시간, 온라인 제출). 미션/마일스톤은 마라톤서 스킵. 사망=DNF(거리랭킹 제외, deadTitle '미완주!'+결승선까지 표기, 재시작=마라톤 재진입). showHome/startRun/enterWarmup가 일별 시드 복원.
- 완주 오버레이 #mfin(시간 크게 m'ss"t + 내최고/신기록 + 전국순위 + 다시도전/락커룸). 홈 '이달의 마라톤' 버튼(#homeMarathon, 내최고시간·전국순위 표시).
- 온라인 시간 랭킹: Firestore 'marathon' 컬렉션(timeMs 오름차순=빠를수록1등, 색인없이 클라정렬). submitMarathonTime(최소시간 갱신)/fetchMarathonTop. ★별도 보안규칙 필요(FIREBASE_SETUP.md에 추가) — 없으면 로컬만 동작(graceful).
- 검증: 코스 실제 변경(일반[0,51,40]vs마라톤[0,-50,85])·진입warmup·완주→finish+오버레이·시간포맷(94.3s→1'34"3)·DNF 미완주+재진입·홈복귀 일별복원·콘솔0.
- 유저 아이디어 3종 모두 완료: ②직선길(58)·③준비운동(59)·①마라톤(60).
- ※밸런스 관찰점: 2195m 열사병 생존 난이도 — 아무도 완주 못하면 랭킹 빔. 고정코스라 학습 가능하나, 필요시 마라톤 heat ramp 완화/쿨링캡 보장 추가.

[build 59] 준비운동(시작 전 카운트다운) 추가 (유저 아이디어 ③/3)
- 새 phase 'warmup': 홈 '달리기 시작' → enterWarmup(resetRun 후 phase=warmup). 월드 정지 + 펫 제자리 호핑(worldY를 sin으로 들썩) + 3·2·1 카운트다운 오버레이(drawWarmup). warmupDuration(1.5s) 경과 또는 탭 시 finishWarmup→running(sfx jump). ★사망 후 재시작(restartFromDead→startRun)은 준비운동 없이 즉시(반복 마찰 방지).
- onDown: warmup 중 탭=finishWarmup(스킵). config: warmupOn/warmupDuration 1.5/warmupHop 12. HR.enterWarmup/finishWarmup 노출.
- 검증: 진입 phase=warmup·월드정지·펫호핑·탭스킵→running·자동종료(1.52s)→running·사망재시작은 즉시. 콘솔0.
- 유저 아이디어 진행: ②직선길(58)·③준비운동(59) 완료 → 남은 건 ①월간 마라톤 이벤트(랭킹 기준 등 기획 필요).

[build 58] 직선(평지) 구간 추가 — 곡선만이라 단조롭다는 피드백 (유저 아이디어 ②/3)
- terrainHeight = 사인합성 × (1 - flatAt(x)). flatAt: 평지 구간 강도 0..1, smoothstep 사다리꼴(0→1→0)로 양끝 부드럽게 전이(단차/경사 스파이크 없음). terrainSlope는 수치미분이라 자동 반영.
- ★첫 시도 독립확률(flatChance)은 오늘 SEED서 첫 직선이 352m(불운한 시드=대부분 못 봄) → 규칙 주기(flatEvery=3)로 변경: N세그먼트마다 직선 1개, 시드별 위상(off=hash01(99)). 가뭄 없음.
- config: flatPeriod 2200(≈44m), flatEvery 3(≈132m마다 직선), flatEdge 0.22.
- 검증: 패턴 SCCSCC… 규칙적, 첫 직선 ~22m, 직선비율 23%, 최대경사 33.7°(기존 기본지형값·전이 스파이크 없음), 콘솔0.
- 유저 아이디어: ②직선길(완료) → ③준비운동 → ①월간 마라톤 이벤트 순서. 펫 미리보기는 현상유지(설명+배너로 충분).

[build 57] 스킨·트레일 용도 불명확 해소 — 설명 부제 + 착용 피드백 (유저: 친구가 어디 쓰는지 모름)
- 원인: 스킨/트레일은 순수 코스메틱인데 ①섹션 설명 없음 ②스킨 onSkinCard는 효과음만(배너 없음) ③락커룸에 펫 미리보기 없어 착용해도 변화가 안 보임 → "샀는데 뭐가 달라지는지 모름".
- 수정: .hlabel flex-wrap + .hsub(부제 스타일). lblGear/lblSkin/lblTrail에 설명 부제 — 장비=실제 성능, 스킨=펫 색/외형(성능X), 트레일=달릴 때 빛 잔상. onSkinCard: 코인부족 배너 + 착용 배너('○○ 펫 착용! 달리기 화면의 펫 색이 바뀌어요'). onTrailCard: 착용 배너('○○ ON 달릴 때 뒤로 빛 잔상', none=끄기) 통합.
- 검증: 부제 3종 렌더·스킨클릭 배너 정상·콘솔0.

[build 56] 속도 표시 km/h → 페이스(min/km) 러닝앱식 교체 (유저 제안)
- 게임 속도가 시속 25~55km로 과장돼 직역하면 1~2분/km 초인값 → 러닝앱처럼 그럴듯한 페이스대로 매핑.
- currentPaceSec(): eff 속도를 baseSpeed~maxSpeed → paceSlow~paceFast 선형보간, 부스트는 frac>1로 더 당겨지고 paceFloor로 클램프. fmtPace = m'ss"/km. HUD #speed를 페이스로 교체(단위 /km), .boost 색강조 유지. currentKmh()는 디버그 스냅샷용 유지.
- config: paceSlowSecPerKm 360(6'00"), paceFastSecPerKm 180(3'00"), paceFloorSecPerKm 150(2'30").
- 검증: 시작 6'00"→중간 4'30"→최고 3'00"→부스트 2'30". 콘솔0.

[build 55] 장애물 가독성 — 배경과 안 묻히게 외곽선 추가 (유저: 가끔 배경/장애물 구분 안 됨)
- 원인: 장애물이 단색 채움만 있고 외곽선 없음 → 배경색과 비슷한 조합(밤 어두운 바위·해변 모래 장애물·노을 주황 라바콘)에서 묻힘. 바닥 그림자도 옅음(0.22).
- ★수정: drawObstacles에 obOutline() 헬퍼 — 현재 실루엣 경로에 흰 외광(lw5, 0.5)+어두운 외곽선(lw2.4, 0.72) 이중 스트로크 → 밝은배경=어두운선, 어두운배경=흰외광으로 항상 분리(스티커 룩). cone/rock/parasol/chair/sand 전부 적용. 바닥 그림자 0.22→0.34·색 진하게·약간 크게. 바위색 #5b5246→#73695a(밝힘)+하이라이트 0.12→0.22.
- 검증: 5개 타입 전부 draw 예외0·콘솔0. (스샷툴 타임아웃 지속 → 기능검증)

[build 54] 코인러시+카본부스트 동시 발동 시 상단 바·글자 겹침 수정 (유저 텔레그램)
- 원인: drawRushOverlay('나이트 코인러시' 바)와 drawRampageHUD('카본 부스트' 바) 둘 다 y=H*0.13 고정 → 코인러시 중 카본화 먹으면 두 바+라벨 정확히 겹침. (startRush는 rampage<=0 가드라 역순; rush 중 카본 픽업 시 동시 발생)
- ★수정: drawRampageHUD의 y에 (state.rush>0 ? 36 : 0) 오프셋 → 동시면 카본바를 36px 아래 줄로. 바12+라벨18=30 < 36 → 겹침 없음. 단독일 땐 그대로 H*0.13.
- 검증: 동시상태(rush/rampage 활성) draw 예외0·콘솔0. 결정적 오프셋.

[build 53] 오늘의 도전 보상 위치 수정 + 코인 수입 ~50% 감소 (유저 텔레그램 2건)
- ①보상(+324) 위치 어긋남: #home .hgoal이 display:flex+flex-wrap이라 <br>이 무시되고 보상 숫자가 길어지면(+324, 3자리) 엉뚱한 곳에 wrap·겹침. ★수정: flex 제거→display:block(암묵)+text-align:center+line-height 1.55 → <br>이 진짜 줄바꿈으로 동작, 보상이 2번째 줄 끝에 깔끔히 정렬. 검증: homeGoalDisplay='block', hasBR=true.
- ②코인 너무 잘 모임→50% 감소: Lv.18선 미션 보상·레벨 보너스가 수입 대부분. config.coinGainMult 0.5 신설 → genMissions reward ×0.5(표시·적립 동시, +324→+162), 레벨업 보너스 ×0.5(200→100). coinDistBonusPer 4500→9000(거리보너스 절반). ★필드 코인 density는 유지(줍는 재미 + '코인 N개 줍기' 미션 난이도 안 꼬이게) → 라이브 HUD 정직. 검증: Lv.1 [쉬움] 보상 26→13, 레벨보너스 200→100.
- 콘솔0.

[build 52] 랭킹 색인 의존 제거 + 일시정지/메인복귀 + 화면 밝기 +20% (유저 텔레그램 3건)
- ①랭킹 미표시 진단: fetchOnlineTop이 where(month)+orderBy(best) → Firestore 복합 색인 필요, 없으면 쿼리 실패→.catch로 조용히 빈 목록("아직 기록 없어요"). 스샷 증거(로그인됨+138m+빈목록). ★해결: orderBy 제거, where(month) 단일필터(자동색인) limit(500) 받아 클라 정렬 → 색인 의존 완전 제거(콘솔 안 만져도 됨). myOnlineRank(20위밖 내순위) 계산해 캡션 표시. 쓰기/조회 catch에 console.warn(진단). 검증: 프리뷰 localhost서 실쿼리 성공=이달 1건('천재' 3308m) 색인에러 없이 반환.
- ②일시정지/메인복귀: state.phase 'paused' 추가(update/onDown에서 정지·입력무시). pauseGame/resumeGame/quitToHome. 우상단 ⏸ 버튼(running 중만 표시, #pauseBtn right:60px), #pauseModal(계속하기/메인으로). ESC 토글. startRun=버튼표시, showHome/die=숨김. resume시 last=now()로 dt점프 방지. 검증: 월드정지(97→97)·탭무시·재개·메인복귀 전부 OK.
- ③화면 밝기 +20%: config.screenBrightness 1.2 → resize에서 canvas.style.filter='brightness(1.2)'(GPU합성, 프레임비용0, HUD는 HTML이라 영향X). 검증: canvasFilter='brightness(1.2)'.
- pause 아이콘 SVG ICONS 추가. HR.pause/resume/quitHome 노출. 콘솔0.

[build 51] 카메라 지면 고정 — 점프 중 땅이 안 보이는 "복불복 착지" 해결 (유저 피드백)
- 문제: 카메라가 점프하는 펫을 화면 60%에 고정 추적 → 더블점프로 높이 뜨면 땅·장애물이 화면 아래로 밀려 사라짐 → 착지가 복불복.
- 수정(알토즈식): camGroundLock. targetCam=min(restCam, followCam). restCam=groundCenterY(worldX)-H*petTargetYRatio(땅 고정), followCam=worldY-H*camTopMarginRatio(0.16, 펫이 상단 여백 차오를 때만 추적). → 점프해도 땅은 거의 고정, 펫이 프레임 안에서 떠오름.
- config: camGroundLock:true, camTopMarginRatio:0.16 추가. dying 단계는 기존 풀-팔로우 유지.
- 검증(HR.step 수동 스텝, H=844): 더블점프 최고 316px인데 땅 최저 화면위치 535px(바닥서 309px 위, 예전 ~807). groundVisible/playerVisible 모두 true. 평상시 펫 0.58(≈예전 0.60, 회귀X). 콘솔0.

[build 42] 젯팩식 연속 미션 레벨업 + 니어미스 보너스 (히트작 벤치마킹 ①②)
- ①연속 미션 레벨업: meta.runLevel(영구, loadMeta/saveMeta). genMissions(level)=(SEED,level) 결정적+목표 ×(1+0.12*(lv-1)). 3개 다 깨면 checkMissions의 while루프(guard 6)로 즉시 레벨업+새 미션+보너스(missionLevelBonus 20+lv*10). MZ_KEY={lvl,done}. todaysMissions/missionDone now let(재할당). 홈 도전카드+lblMission+게임오버에 Lv.N. missionDesc()로 목표 동적 텍스트.
- ②니어미스: updateObstacles 충돌블록에서 clearance=(장애물윗면-펫아랫면). <=0 충돌, 0<clearance<nearMissPx(26)&&공중 → o.nm 1회 +nearMissCoin(2)+addCombo+sparkle+lastLanding "아슬아슬!".
- 검증: 레벨 cascade(maxstep 1→7 guard캡)·프레시런 레벨유지·니어미스 +2코인/태그/nm마킹·콘솔0.
- ③커머스 루프는 자사몰/응모폼 URL 대기(유저 제공 필요).

[build 41] 첫 캡을 첫 장애물 앞으로 + 첫 장애물 80m + 타이틀 모바일 잘림 (게임개발자 리뷰)
- 첫 쿨링캡 130m라 첫 장애물(53m)보다 늦어 무의미 → itemFirstCapDist 6500→2400(48m). 검증 캡 48m < 첫 장애물 82m.
- 첫 장애물 54m라 초보 학습시간 짧음 → obstacleStartDist 2700→4000(~80m). 검증 첫 장애물 82m.
- 홈 타이틀 390px 우측 잘림 → .htitle clamp(38,12.5vw,58)→clamp(30,9.6vw,56)+letter-spacing .5+nowrap. 검증 390px overflow 없음.
- ★세션 재개로 프리뷰 서버 죽음 → preview_start 'busan-runner-web'로 재시작(새 serverId).

[build 40] 해안 구역 바다 배경 (유저: 해운대/광안리 더 바다 느낌)
- 핵심: 중간 패럴랙스가 보라 언덕이라 바다가 안 보였음 → 해안 구역(z2 자갈치·z3 광안리·z4 해운대·z6 다대포)에서 mid 레이어를 drawSea()로 교체. 물결 그라데이션 채움 + 수평선 하이라이트 + 윤슬(시간 드리프트 점선) + 햇빛 반사 기둥(태양쪽). 빌딩/현수교가 물에서 솟는 연출. 해변 구역(3·4·6) 전경 모래톤(rgba 150,134,102).
- 검증: 해운대 스샷=바다+윤슬+타워 확인. ★프리뷰 screenshot 툴이 2번째 캡처서 UnknownVizError/timeout(툴 글리치, 게임 무관·콘솔0). 광안리는 동일 drawSea 경로라 동일 적용.

[build 39] 첫 쿨링 캡 보장 + 초반 장애물 워밍업 (유저: 300m서 계속 죽고 400m까지 캡 0개)
- 진단(QA 시뮬): 오늘 SEED는 전체 공유라 600m 내 쿨링캡 0개(아이템 2개 다 자석)인 불운한 시드 → 유저+친구 동일 경험. 300m 사망 원인은 더위 아님(봇 heat 46@300m)=초반 장애물 클러스터(245/262/330m)+캡 없어서 세이브 불가.
- ★itemFirstCapDist 6500(130m): 시드 무관 첫 쿨링 캡 보장 → 모두 초반 방어막 1개 확보. itemSpacing 2100→1700(꾸준). obstacleEaseM 350(초반 밀도 0.4→1.0 워밍업 → 350m내 장애물 12→7).
- HR.items 노출(QA). 검증: 첫 캡 130m·봇 캡 획득·콘솔0.
[build 38] 랭킹 이벤트 상품 문구: 1등 5만·2등 3만·3등 1만원 적립금(prizeLine).

[build 37] 쿨링 캡 빈도 ↑ + 그늘 냉각 완만 (유저 플레이 피드백)
- 모자(쿨링캡) 너무 안 나옴 → itemChance 0.31→0.36 + itemShieldWeight 0.58→0.66 = 캡 1.32배(자석 비슷 유지).
- 그늘 너무 확 시원 → heatShadeRate 16→12(완만). 봇: peak heat 68→83(더 긴장), 봇은 여전히 1727m 장애물 사망(불공정 벽 아님). 더 세지면 heatShadeRate 살짝 복구.

[build 36] 월간 랭킹 이벤트 (소셜 응모) — 커머스 루프 스캐폴드
- 유저 결정: 고정 쿠폰(유포 위험) ✗ → 매달 1·2·3등 써머텍트 적립금 = 소셜 응모 방식(백엔드 없이 지금 가능).
- config.event{ on, prizeLine, submitUrl, storeUrl } — submitUrl/storeUrl 비면 안전 폴백(응모=기록 공유, 스토어 링크 숨김), 채우면 즉시 활성화. ★유저가 채워야 할 3개: submitUrl(구글폼 등), storeUrl(자사몰), prizeLine(상품 문구).
- UI: 홈 이벤트 카드(#homeEvent, 앰버 글래스 "이번 달 랭킹 이벤트 · 매달 1·2·3등 적립금 · 응모하기"), 게임오버 응모 버튼(#deadEvent), 자사몰 링크(#storeLink, storeUrl 있을때만).
- eventAction(): submitUrl 있으면 새탭, 없으면 shareResult() 폴백. 공유텍스트=오늘최고+콤보+#비트더히트부산 #써머텍트 +스토어URL(소셜 수집/바이럴용).
- 검증: 카드/버튼 표시·클릭 무에러·빈 storeUrl 숨김·콘솔0.

[build 35] 아이템 빈도 -50% + 더위 난이도 상향 + 3000m 마일스톤 이벤트 (유저 플레이 피드백)
- 쿨링캡/카본삭스 너무 잦음 → itemChance 0.62→0.31.
- 더위 너무 쉬움(그늘 잦고 온도 안 오름) → heatSunRate 15→16, shadeBand [0.56,0.86]→[0.60,0.84](그늘 30%→24%), weatherMultMin 0.78→0.85, heatRampPer1000m 0.34→0.30, waterSpacing 1500→1300. ★봇 시뮬로 균형점 탐색: 처음 18/18%/0.92로 과해서 봇이 385m 즉사(heat 100) → 16/24%/0.85로 되돌리니 peak heat 68(실제 위협)·봇은 1727m서 장애물 사망(더위는 불공정 벽 아님). 더운 날(mult 1.7)엔 더 위협적.
- ★3000m 마일스톤 이벤트: state.milestoneNext(3000부터), 도달 시 보너스 코인(milestoneBonusCoin 40×N) + startRush(무적 코인러시 보상) + 배너 "N,000m 돌파! 폭염 특별 구간". 검증 3000m서 +177코인·러시·다음 6000m.

[build 34] 밸런스 실측 튜닝 + 빌딩 입체음영 + 데일리 도전 다양화 (유저: 밸런스+구역디테일+데일리 선택)
- ★밸런스(점프AI 봇 시뮬레이션으로 실측): 봇이 get_game_state()의 nextObstacle/nextGap 보고 자동 점프 → 완벽플레이가 1727m까지 생존(코스 공정 재확인). 발견: 체온이 거의 0(물 20m마다 -32 → '더위 관리' 사문화). 튜닝: heatRampPer1000m 0.22→0.34, heatSunRate 14→15, heatShadeRate 18→16, waterSpacing 1000→1500, waterCool 32→24. 쿨한 날(21°C) peak heat 18→40, 더운 날 ~80 예상(날씨연동), 공정성 유지.
- ★구역 디테일: bldgFill()(세로 그라데이션+좌측 림라이트+우측 음영) → farSkyline·farHotels 빌딩이 평면→입체.
- ★데일리 도전 다양화: MISSION_TIERS 풀 확장(쉬움 5종/보통 6종/어려움 6종, 그늘생존·물·깔끔착지 추가), 홈 도전카드 출발지(+비) 플레이버: "오늘의 도전 · (비 오는) 해운대 / [쉬움] 80m". ※todaysMissions는 ZONES보다 먼저 생성되므로 zone 플레이버는 빌드시점 아닌 렌더시점(buildHome)에 startZoneName()로 주입.
- 커머스(쿠폰/제품링크)는 유저가 미선택 → 자사몰 URL+쿠폰정책 받으면 진행.

[build 33] 마감 폴리시 (게임개발자 2인 피드백 수렴)
- 빈 날씨 pill 숨김(.hweather:empty{display:none}) — fetch 전/실패 시 빈 타원 제거.
- 조작 설명 2줄 고정(<br>) + max-width 340 + word-break:keep-all — 모바일 우측 잘림 해결.
- window.get_game_state() JSON 스냅샷 추가(자동화 파싱용; render_game_to_text는 사람용 유지).
- 락커룸 메뉴 전환 이징: hdetail display:none → max-height+opacity cubic-bezier 슬라이드.
- 죽은 직후 아쉬움: #deadGap "최고 기록까지 Nm!" / "X 해금까지 N코인".
- 주스: 코인 획득 시 #runcoins scale 팝(coinPopT+.pop), 거리/속도 이탤릭 슬랜트.
- ★확인(이미 구현, dev는 캐시본 봄): 차고→락커룸(build30), 사망 분기 열사병/추락/충돌(DEATH_INFO), DPR 레티나(resize), localStorage 영속, 커스텀 공유텍스트, 날씨=체온 기능연동, 나이트러시.
- 미완(데이터/백엔드 필요): 쿠폰/프로모코드, 장비 [제품 보러가기] 아웃링크(자사몰 URL 필요), 밸런스 실측(점프AI 봇 또는 플레이테스트 필요).

[build 32] 실드+코인자석+미션 게이지바+나이트 코인러시 + 구역 전경 수정 (글로벌 히트작 벤치마킹 반영)
- ★🛡 쿨링 캡(실드): items 배열 아이템, 획득 시 state.shield=1, 충돌 시 소모하고 die 대신 smashObstacle+방어 배너. 펫에 시안 버블 drawShieldAura. "즉시 사망" 스트레스 완화 + 자사 제품 노출.
- ★🧲 카본 삭스(코인 자석): 획득 시 state.magnet=magnetDuration(5.5s), updateCoins서 magnetRadius(230) 내 코인을 magnetPull(7)로 펫 쪽으로 끌어당김. HUD 칩(#itemhud).
- ★📊 게임오버 미션 게이지바: deadMissions 카드를 풀폭 .mgauge로 — 가장 가까운 미완료 미션 진행도 바(deadMbar width%)+텍스트("[보통] 물 5개 2/5 40%"). "한 판 더" 압박.
- ★🌙 나이트 코인러시: state.rush, rushNext(거리 기반, rushFirstM 450/rushIntervalM 620), startRush/spawnRushCoins(물결 코인). 무적(invincible=rampage||rush, 장애물 smash·구멍/열사병 면제)+야간 틴트 drawRushOverlay+남은시간 바.
- 아이템 spawn: itemSpacing 2100·startDist 1400·chance .62·shieldWeight .58. drawItems + coolingCap/carbonSock 캔버스 아트.
- ★구역 전경 수정(유저 "광안리인데 온천천 느낌"): z3 광안리·z0 도심이 near switch의 else(덤불+꽃)로 빠지던 버그 → 광안리=해안 난간+바위(railing/seaRock), 도심=볼라드+벤치(bollard/bench). far는 원래 정상(다리/스카이라인).
- 쿠폰 리워드는 백엔드 필요 → 미구현(별도).
- 검증: 실드방어·자석수집·러시트리거·아이템스폰 무에러, 게임오버 게이지·실드버블·광안리 스샷, 콘솔0.

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

[build 43] 자사몰 URL 연결 — event.storeUrl=https://summertect.com(메모리 확인). 홈 "제품 보러가기" 링크+공유텍스트 삽입. 남은 것=응모폼 submitUrl.

[build 45] 온라인 월간 랭킹(Firebase 구글로그인+서버점수). config.firebase 비면 봇 폴백(게임 안 깨짐). loadFirebase/initOnline/signInGoogle/submitOnlineScore/fetchOnlineTop. Firestore 규칙+FIREBASE_SETUP.md 가이드. 유저가 키4개 붙이면 활성.

[build 46-47] Firebase 키 연결(beat-the-heat-busan, Spark 무료) + Auth/Firestore 설정 완료. 백엔드 검증: Firestore 읽기 OK·미로그인 쓰기 permission-denied(치팅방어 작동). 규칙 best is int→is number 권고. 신기록+미로그인 순간 deadEvent "신기록! 구글 로그인하면 전국 랭킹 등록" 유도(.hot). 구글 로그인 팝업은 유저가 라이브 최종확인.

[build 48] 랭킹 닉네임 입력(커스텀 모달, meta.nick, playerName, 락커룸 닉변경). 유저 테스트: 점수저장 성공·랭킹목록은 Firestore 복합인덱스(month+best) 생성 필요(1클릭).

[build 49] 보안: 닉네임 저장형 XSS 수정(esc 이스케이프). 공격면 분석=점수치팅(규칙+App Check+수동검수)·apiKey공개(정상)·Spark 비용안전·localStorage 무해.

[build 50] App Check(reCAPTCHA v3) 클라연동(appCheckKey 채우면 활성) + 점수상한 100000→15000 가이드 + 수동검수 정책 문서화. 유저: reCAPTCHA 키 발급→연결, 규칙 cap 15000 게시.
