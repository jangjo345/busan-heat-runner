# 앱 전환 기술 기획서 — BEAT THE HEAT: BUSAN 네이티브 앱 출시

작성: 게임개발 총괄감독 (2026-06-10) · 승인: 진우님 · 실행: 개발자
전략: **웹 = 유입(QR·인스타 즉시 플레이) / 앱 = 리텐션(푸시·스트릭·홈화면)** 투트랙. 웹은 지금 그대로 유지하고, 같은 코드베이스를 앱으로도 패키징한다.

---

## 0. 핵심 결정

| 항목 | 결정 | 이유 |
|---|---|---|
| 래퍼 | **Capacitor** (iOS+Android 단일 파이프라인) | TWA는 Android 전용. 코드 95% 재사용 |
| 코드베이스 | **단일 유지** — 플랫폼 분기 `window.Capacitor` | 웹/앱 이중 관리 금지. 기능은 capability 감지로 분기 |
| 푸시 1단계 | **로컬 알림** (스트릭 리마인더) | 서버 0원, Cloud Functions 불필요 |
| 푸시 2단계 | FCM + Cloud Functions 스케줄러 (폭염 데이) | Blaze 전환 필요 → 진우님 결정 후 |
| 영구 데이터 | localStorage → **Capacitor Preferences 미러** | iOS WKWebView는 localStorage를 OS가 임의 퍼지할 수 있음 — 스트릭/코인 증발 사고 방지 |

---

## 1. 프로젝트 구조 (저장소 변경 최소화)

```
busan-runner_v0/
├─ index.html / config.js / data.js / game.js   ← 그대로 (웹 배포도 계속 사용)
├─ www/                       ← 앱 번들 (빌드 스크립트가 생성, .gitignore)
├─ capacitor.config.ts        ← appId: com.summertect.beattheheat
├─ ios/ android/              ← cap add 산출물
└─ scripts/build-app.mjs      ← index.html+js 3종+아이콘을 www/로 복사 (번들러 불필요)
```

- 빌드: `node scripts/build-app.mjs && npx cap sync` — 기존 "빌드 도구 없음" 철학 유지, 복사만 한다.
- **BUILD 규약 확장**: 웹 BUILD 상수와 앱 버전(`versionName`)을 동기 (예: BUILD 85 = 앱 1.0.85). progress.md에 앱 제출 빌드 기록.

## 2. 필수 코드 변경 (game.js)

### 2-1. 인증 — 현재 웹 팝업은 iOS WebView에서 동작 불가 ★최우선
- 플러그인: `@capacitor-firebase/authentication`
- 분기: `isNative() ? FirebaseAuthentication.signInWithGoogle() → credential을 web SDK에 주입 : 기존 signInWithPopup` (웹 경로 무변경)
- **Sign in with Apple 추가 (iOS 의무)** — 애플 가이드라인 4.8: 타사 로그인 제공 시 Apple 로그인 필수. iOS에서만 버튼 노출. Firebase 콘솔 Apple 공급자 활성화 + Apple Developer에서 Sign in with Apple capability.
- **계정 삭제 기능 (애플 5.1.1(v) 의무)** — 계정 생성이 있으면 앱 내 계정 삭제 제공 필수. 락커룸 설정에 "계정·기록 삭제" 버튼: `user.delete()` + leaderboard/marathon 내 문서 삭제. 이거 빼먹으면 100% 리젝.

### 2-2. 영구 데이터 보호
- `saveMeta()`에 Preferences 미러 추가 (`@capacitor/preferences`): 기존 localStorage 코드 그대로 두고 native일 때 동일 JSON을 Preferences에도 기록, 부팅 시 localStorage 비어 있으면 Preferences에서 복원.
- 대상 키: `META_KEY`(코인·스트릭·장비·쿠폰), 주간/일별 베스트, 마라톤 베스트.

### 2-3. 알림 (리텐션 코어)
- 1단계 `@capacitor/local-notifications`:
  - 런 종료 시마다 다음날 18:00 로컬 알림 예약(기존 예약 교체): "🔥 N일 스트릭이 오늘 끊겨요 — 한 판이면 이어집니다"
  - 스트릭 6일차엔 문구 강화: "내일이면 5,000원 쿠폰!"
  - 권한 요청 타이밍: 설치 직후 ✕ → **스트릭 2일차 달성 직후** (가치를 본 뒤에 요청 = 수락률 2배)
- 2단계(별도 결정): FCM 폭염 데이 브로드캐스트 — Cloud Functions 매일 09:00 Open-Meteo 체크 → 33°C↑면 발송.

### 2-4. 네이티브 손맛 + 리젝 방어 (4.2 "웹사이트 포장" 대응)
- `@capacitor/haptics`: 점프(light) / 착지 PERFECT(medium) / 충돌·사망(heavy) / 오버히트 진입(vibrate 패턴)
- `@capacitor/status-bar`: 몰입형(overlay, 다크) — safe-area CSS는 이미 대응돼 있음(env() 사용 중)
- `@capacitor/splash-screen`: 라임 배경 + 펫 로고
- 오프라인 보장: 에셋 전부 번들 내장이라 자동 충족. Open-Meteo 실패 폴백 이미 있음(확인됨). Firebase 미연결 시 봇 랭킹 폴백 이미 있음.
- Android back button: `@capacitor/app` listener → 런 중=일시정지, 홈=앱 최소화.

### 2-5. 외부 링크/웹뷰 이탈 차단
- 자사몰(`storeUrl`)·구글 폼(`submitUrl`)·개인정보처리방침: `@capacitor/browser` (인앱 브라우저)로 열기. WebView 내 직접 네비게이션 금지 (심사 시 "앱 안에 쇼핑몰 웹사이트" 인상 방지).

### 2-6. 보안 업그레이드 (보너스)
- App Check를 네이티브로: iOS **DeviceCheck/App Attest**, Android **Play Integrity** — 웹 reCAPTCHA보다 강력. `@capacitor-firebase/app-check`. 콘솔에서 등록 후 모니터링 → Enforce (FIREBASE_SETUP.md 6번 순서 준수).

## 3. 애플 리젝 방어 체크리스트 (제출 전 전부 ✓)

| # | 가이드라인 | 항목 | 대응 |
|---|---|---|---|
| 1 | 4.2 최소 기능 | "웹사이트 포장" 판정 | 오프라인 플레이 + 햅틱 + 로컬 알림 + 네이티브 로그인 = 네이티브 경험 입증 |
| 2 | 4.8 | Apple 로그인 | 2-1 구현. iOS에서 구글만 노출하면 리젝 |
| 3 | 5.1.1(v) | 계정 삭제 | 2-1 구현 |
| 4 | 5.1.1 | 개인정보처리방침 URL | 정적 페이지 1장 (수집: 구글/애플 계정 식별자·닉네임·점수. 진우님 확인 필요) |
| 5 | 3.1.1 | 쿠폰·적립금 | **실물 상품/오프라인 혜택 = IAP 면제.** 심사 노트에 "쿠폰은 실물 의류몰 할인" 명기 |
| 6 | 2.1 | 완성도 | 심사용 테스트 노트: 로그인 없이 전 기능 동작함을 명시 (심사관이 로그인 안 해도 됨 — 중요) |
| 7 | 2.3 | 스크린샷 정확성 | 실플레이 화면만 사용 |
| 8 | — | 등급 설문(IARC/애플) | 전체이용가. "경품 이벤트" 항목 정직하게 체크 (현금성 적립금 — 설문에서 도박류 아님 확인) |
| 9 | 5.2 | 명칭 | "BEAT THE HEAT" 상표 충돌 간단 검색 후 제출 (대안: "비트더히트 부산: 폭염 러닝") |

Google Play: 데이터 보안 양식(계정 식별자·점수 수집 신고) + 타겟 API 레벨 최신 + 비공개 테스트 트랙에서 12명/14일 테스트 요건(신규 개인 계정일 경우) 확인.

## 4. 스토어 에셋 (디자인 작업 목록)

- 앱 아이콘 1024×1024 (펫 + 라임 — 펫 네이밍 확정 후 제작 권장)
- 스플래시 2732×2732 (중앙 로고 단순형)
- 스크린샷: iOS 6.7"/6.5"/5.5" 각 3~5장, Android 폰/7"/10" — 공통 5컷: ①오버히트 질주 ②부산 랜드마크 ③마라톤 완주 ④스트릭/쿠폰 ⑤랭킹
- 설명문(한/영) + 키워드: 러닝, 부산, 폭염, 캐주얼, 러닝게임, 쿨링
- 프로모 영상(선택, 후순위)

## 5. 일정 (파트타임 기준 4~5주)

| 마일스톤 | 내용 | 기간 | 감독 검수 게이트 |
|---|---|---|---|
| M1 | Capacitor 래핑 + www 빌드 스크립트 + 실기기 스모크(iOS/Android 각 1대) | 1주 | 게임플레이 60fps·터치 슬라이드 실기기 확인 |
| M2 | 네이티브 로그인(구글+애플) + 계정 삭제 + Preferences 미러 | 1.5주 | 로그인→랭킹 제출→삭제 풀사이클 |
| M3 | 로컬 알림 + 햅틱 + 인앱 브라우저 + back button | 1주 | 스트릭 알림 실발화 확인 |
| M4 | 스토어 에셋 + 심사 노트 + 제출 | 0.5주+심사 1~2주 | 체크리스트 §3 전 항목 ✓ |

리스크 버퍼: 애플 1차 리젝 1회는 일정에 포함해둘 것(통계적으로 절반은 1차에서 걸림 — §3가 그 확률을 낮추는 장치).

## 6. 수용 기준 (감독 최종 검수)

1. 비행기 모드에서 설치→플레이→사망→락커룸 전 과정 동작 (랭킹은 봇 폴백)
2. iOS 실기기: 슬라이드 스와이프 인식률 체감 정상 (P2 백로그의 pointermove 이슈 — M1에서 실기기로 판정, 문제 시 touchmove 병행 등록 수정 포함)
3. 앱 삭제→재설치 시 Preferences 복원으로 스트릭·코인 유지
4. 구글/애플 로그인 각각 랭킹 제출 성공 + 계정 삭제 시 Firestore 문서 소거
5. 스트릭 리마인더 알림: 예약→발화→탭→앱 진입 풀체인
6. 웹(GitHub Pages) 회귀 없음 — 같은 game.js가 브라우저에서 기존대로 동작

---
부록: 진우님 액션 — ① 애플 개발자 계정 $99/년 + 구글 $25 등록 ② 개인정보처리방침 내용 확인 ③ (2단계 푸시 원하면) Firebase Blaze 전환 결정 ④ 펫 이름 확정(아이콘 제작 선행 조건).
