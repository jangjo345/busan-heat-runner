# BEAT THE HEAT: BUSAN

부산 한여름 폭염을 달리는 **HTML5 Canvas 엔드리스 러너** — SUMMERTECT 브랜드 어드버게임.
원버튼 점프·플립으로 더위와 장애물을 피하며 부산 랜드마크 코스를 질주합니다.

- 라이브: https://jangjo345.github.io/busan-heat-runner/
- 핵심 파일: `index.html` → `config.js`(튜닝) + `game.js`(엔진)
- 빌드: Vanilla JS · HTML5 Canvas 2D · `requestAnimationFrame`. 빌드 도구·번들러 없음.

---

## 실행 방법

**방법 1 (가장 간단)** — `index.html` 더블클릭. `file://`에서도 동작합니다.

**방법 2** — 로컬 서버:
```bash
npm run web
# → http://localhost:4321
```
의존성 없는 Node 정적 파일 서버(`serve.js`, ~40줄). `npm install`은 dependencies가 비어 있어 사실상 no-op입니다.

---

## 메커닉

| 입력 | 동작 |
|---|---|
| 탭 / Space | 점프 |
| 공중에서 한 번 더 | 더블 점프 + 플립 (콤보) |
| ESC / 우상단 ⏸ | 일시정지 → 계속하기 / 락커룸 복귀 |

### 더위 / 체온 시스템
- 햇볕에 노출되면 체온↑, 그늘·물·비에서 체온↓. 만땅 = **열사병 사망**.
- 시간대(새벽~밤)가 거리에 따라 순환, 정오가 가장 더움.
- 부산 실제 날씨를 Open-Meteo로 불러와 더위 배수에 반영.

### 코인 / 보상
- 필드 코인 줍기 + 거리 보너스 + 콤보·니어미스·마일스톤 보너스.
- 코인으로 **장비**(성능) / **펫 스킨**(꾸미기) / **잔상 트레일**(꾸미기) 해금.
- 미션 3개 완수 → 자동 레벨업 + 새 미션 (젯팩식 영구 진행).

### 페이스 표시 (러닝앱식)
좌상단에 `6'00"/km` 같은 페이스로 표시 — 숫자가 작을수록 빠름. 시작 6'00" → 최고속 3'00" → 카본 부스트 시 2'30"(바닥).

### 부산 랜드마크 코스
서면 도심 · 온천천 · 자갈치시장 · 광안리 · 해운대 · 감천문화마을 · 다대포 해변 · 전포 카페거리 (매일 시드에 따라 출발 지역 회전).

### 월간 마라톤 이벤트
홈 → **"이달의 마라톤"** 버튼. **2,195m 고정 코스**(월 단위 시드 → 그 달엔 모두 같은 코스)를 누가 가장 빠르게 완주하는지 시간 경쟁. 신기록 시 전용 결과 화면 + 전국 시간 랭킹.

### 직선 + 곡선 지형
사인 합성 곡선 지형 사이에 ~132m 주기로 직선(평지) 구간이 끼어 리듬을 환기.

---

## 튜닝

모든 게임 밸런스 값은 **`config.js`**(window.CONFIG)에 집중 — 속도·중력·점프·더위 상승률·코인 economy·페이스 매핑·마라톤 거리·준비운동 시간 등.

빌드 캐시는 `BUILD` 상수(game.js) + `?v=N`(index.html) 동기 증가로 무효화합니다.

---

## 온라인 랭킹 (선택)

월간 거리 랭킹 + 마라톤 시간 랭킹은 **Firebase**(Auth + Firestore)로 동작합니다. 키를 안 넣어도 게임은 봇 랭킹 폴백으로 정상 작동.

설정 가이드: **[`FIREBASE_SETUP.md`](FIREBASE_SETUP.md)** — 키 4개 + 보안규칙 + (선택) App Check.

---

## QA 디버그 훅 (개발자용)

브라우저 콘솔에서 `window.HR` 객체로 게임 상태에 접근:
```js
HR.state             // phase/distance/heat/runCoins ...
HR.player            // worldY/vy/rot ...
HR.step(1/60)        // 한 프레임 수동 진행
HR.advanceTime(10)   // 10초 빨리 감기
HR.setRain(true)     // 비 강제
HR.forceZone(4)      // 구역 강제(0~7)
HR.enterMarathon()   // 마라톤 즉시 진입
window.render_game_to_text()   // 텍스트 스냅샷
window.get_game_state()        // JSON 상태
```

---

## 배포

GitHub Pages — `git push`로 자동 배포. 자세한 내용은 [`DEPLOY.md`](DEPLOY.md).

---

## 진행 기록 / 변경 이력

빌드별 변경 내역은 **[`progress.md`](progress.md)** 참고 (build 1 → 현재).

---

## 옛 프로토타입 (Archive)

초기 프로토타입은 Node CLI 기반 턴제 펫 생존 게임이었습니다. 현재는 폐기됐고 이력 보존 목적으로 `_archive/` 폴더에만 남아 있습니다 (`_archive/README_turnbased.md` 참고). 현행 작품은 위에서 설명한 HTML5 Canvas 엔드리스 러너입니다.
