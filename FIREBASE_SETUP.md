# 온라인 월간 랭킹 켜기 — Firebase 설정 가이드 (10분)

게임은 지금도 잘 돌아갑니다(봇 랭킹 폴백). 아래 **키 4개만** `config.js`에 넣으면
**구글 로그인 + 진짜 전국 월간 랭킹**이 자동으로 켜집니다. (스크린샷 위조 방지)

> 비용: Firebase 무료 티어(Spark)로 충분합니다. 카드 등록 불필요.

---

## 1) Firebase 프로젝트 만들기
1. https://console.firebase.google.com → **프로젝트 추가** → 이름 예: `beat-the-heat-busan` → 만들기
   (Google Analytics는 꺼도 됨)

## 2) 웹앱 등록 → 키 4개 복사
1. 프로젝트 개요 → **</> (웹)** 아이콘 클릭 → 앱 닉네임 `web` → 등록
2. 나오는 `firebaseConfig`에서 **4개**만 복사:
   ```
   apiKey, authDomain, projectId, appId
   ```
3. `config.js`의 `firebase: { ... }`에 붙여넣기:
   ```js
   firebase: {
     apiKey: 'AIza................',
     authDomain: 'beat-the-heat-busan.firebaseapp.com',
     projectId: 'beat-the-heat-busan',
     appId: '1:....:web:....',
   },
   ```
4. BUILD 번호 +1, `index.html`의 `?v=N`도 +1 → git push (자동 배포)

## 3) 구글 로그인 켜기
- Firebase 콘솔 → **Authentication** → 시작하기 → **Sign-in method** → **Google** 사용 설정 → 저장
- **Authentication → Settings → 승인된 도메인(Authorized domains)** 에 추가:
  - `jangjo345.github.io` (게임 배포 도메인)
  - `localhost` (테스트용, 보통 기본 포함)

## 4) Firestore 만들기 + 보안 규칙
1. 콘솔 → **Firestore Database** → 데이터베이스 만들기 → **프로덕션 모드** → 지역 `asia-northeast3 (서울)` 권장
2. **규칙(Rules)** 탭에 아래 붙여넣고 **게시**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /leaderboard/{docId} {
         allow read: if true;                                   // 랭킹은 누구나 보기
         allow create, update: if request.auth != null          // 로그인 필수
           && request.resource.data.uid == request.auth.uid      // 내 문서만
           && docId == request.resource.data.month + '_' + request.auth.uid
           && request.resource.data.best is number               // int/double 모두 허용(JS 숫자 저장 안전)
           && request.resource.data.best >= 0
           && request.resource.data.best <= 15000                // 비정상 점수 상한(m) — 현실적 최대치(absurd 차단)
           && request.resource.data.name is string
           && request.resource.data.name.size() <= 20;
         allow delete: if false;
       }
     }
   }
   ```
   → 이 규칙이 "남의 점수 조작 금지 + 점수 상한 + 본인 인증"을 강제합니다.

### (선택) 월간 마라톤 이벤트 — 완주 시간 랭킹 규칙
마라톤(고정 코스 완주 시간 경쟁)의 **전국 랭킹**을 켜려면 `leaderboard` match 옆에 아래 `marathon` match를 **추가**하고 게시하세요. (안 넣어도 마라톤은 로컬 기록으로 동작 — 게임 안 깨짐)
```
       match /marathon/{docId} {
         allow read: if true;                                   // 랭킹은 누구나 보기
         allow create, update: if request.auth != null
           && request.resource.data.uid == request.auth.uid
           && docId == request.resource.data.month + '_' + request.auth.uid
           && request.resource.data.timeMs is number
           && request.resource.data.timeMs >= 1000               // 1초 미만 = 비정상
           && request.resource.data.timeMs <= 3600000            // 1시간 초과 = 비정상
           && request.resource.data.name is string
           && request.resource.data.name.size() <= 20;
         allow delete: if false;
       }
```
- 완주 시간 = **timeMs(밀리초), 작을수록 1등**. 색인 불필요(클라에서 정렬).
- 월말 운영: `marathon` → `month == 'YYYY-MM'` 필터 → `timeMs` 오름차순 상위 3명(거리 랭킹과 동일하게 수동 검수 후 적립금).

## 5) 끝 — 동작 방식
- 홈/락커룸 랭킹에 **"구글 로그인하고 월간 랭킹 참가"** 버튼 등장
- 로그인 후 게임할 때마다 **이번 달 최고 거리**가 자동 서버 저장(더 높을 때만)
- 랭킹표 = `leaderboard` 컬렉션의 이달 상위 20명 (medal + 내 순위 하이라이트)
- 매달 자동으로 새 달(`YYYY-MM`)로 분리 → 월간 랭킹

## 6) (보안 강화) App Check — 봇/스크립트 직접 쓰기 차단
구글 로그인만으론 "콘솔/curl로 가짜 점수 제출"을 못 막습니다. App Check를 켜면 **진짜 우리 게임(브라우저)에서 온 요청만** 허용 → 스크립트 공격을 크게 줄입니다.
1. Firebase 콘솔 → **App Check** → **앱 등록**(웹앱 선택) → 공급자 **reCAPTCHA v3** 선택
2. reCAPTCHA v3 **사이트 키**가 생성/요청됨 → 그 키를 `config.js`의 **`appCheckKey: '여기'`** 에 붙여넣기 → BUILD/?v 올리고 push
3. 게임 한 번 열어서 콘솔 → App Check → **요청 메트릭에 "확인됨(verified)"** 뜨는지 확인 (며칠 모니터링 권장)
4. 확인되면 App Check → **Firestore → 적용(Enforce)** 켜기
   - ⚠️ **순서 중요**: 2~3을 먼저 하고(클라가 토큰 발급되는 것 확인) → 그다음 4(적용). 거꾸로 하면 라이브 게임의 랭킹이 막힙니다.

## 치팅 방어 수준 (정직하게) — 3중 방어
- ✅ **규칙**: 구글 1인 1기록 / 본인 문서만 / 점수 상한 15000 / 이름 길이 (익명·absurd 차단)
- ✅ **App Check**: 봇/스크립트/curl 직접 쓰기 차단 (위 6번)
- ✅ **수동 검수**: 클라 게임 특성상 "앱 안에서 콘솔로 상한 이내 조작"은 100% 못 막음 → **5만원 실상품은 상위 3명만 플레이 영상/패턴 검수 후 지급**
- (옵션) Cloud Functions 서버 검증(제출 빈도·증가폭 이상 탐지) — Blaze 필요, 추후

## 월말 운영 (수동 검수 정책)
- Firestore → `leaderboard` → `month == '2026-06'` 필터 → `best` 내림차순 상위 3명 확인
- 상위 3명에게 **플레이 영상/스크린 녹화 요청** → 정상 플레이 확인 → 적립금 지급
  (비정상 패턴: 첫 플레이에 만점, updatedAt 급증, 동일 IP 다계정 등 → 제외)
- 닉네임/연락은 구글 계정 기반 → 당첨자에게 DM/이메일로 적립금 코드 발급

## 월말 운영
- Firestore → `leaderboard` → `month == '2026-06'` 필터 → `best` 내림차순 상위 3명 확인
- 닉네임/연락은 구글 계정 기반 → 당첨자에게 DM/이메일로 적립금 코드 발급
  (연락처가 필요하면, 당첨자에게만 받는 별도 폼 한 단계 추가 권장)
