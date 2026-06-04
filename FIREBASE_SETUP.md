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
           && request.resource.data.best is int
           && request.resource.data.best >= 0
           && request.resource.data.best <= 100000               // 비정상 점수 상한(m)
           && request.resource.data.name is string
           && request.resource.data.name.size() <= 20;
         allow delete: if false;
       }
     }
   }
   ```
   → 이 규칙이 "남의 점수 조작 금지 + 점수 상한 + 본인 인증"을 강제합니다.

## 5) 끝 — 동작 방식
- 홈/락커룸 랭킹에 **"구글 로그인하고 월간 랭킹 참가"** 버튼 등장
- 로그인 후 게임할 때마다 **이번 달 최고 거리**가 자동 서버 저장(더 높을 때만)
- 랭킹표 = `leaderboard` 컬렉션의 이달 상위 20명 (medal + 내 순위 하이라이트)
- 매달 자동으로 새 달(`YYYY-MM`)로 분리 → 월간 랭킹

## 치팅 방어 수준 (정직하게)
- ✅ 구글 계정 1인 1기록 / 본인 문서만 쓰기 / 점수 상한 / 이름 길이 제한 (규칙으로 강제)
- ⚠️ 클라이언트 게임 특성상 "콘솔로 상한 이내 가짜 점수 제출"은 100% 못 막습니다.
  → **5만원 실상품은 상위 3명만 수동 검수**(플레이 영상/패턴 확인) 후 지급 권장.
  → 필요시 Cloud Functions로 서버 검증(제출 빈도/증가폭 이상 탐지)을 추가할 수 있습니다(별도 작업).

## 월말 운영
- Firestore → `leaderboard` → `month == '2026-06'` 필터 → `best` 내림차순 상위 3명 확인
- 닉네임/연락은 구글 계정 기반 → 당첨자에게 DM/이메일로 적립금 코드 발급
  (연락처가 필요하면, 당첨자에게만 받는 별도 폼 한 단계 추가 권장)
