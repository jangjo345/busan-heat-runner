# 폭염 러너 배포 가이드 (GitHub Pages)

이 게임은 **정적 파일**(`index.html` + `config.js` + `game.js`)이라 GitHub Pages에 그대로 올라갑니다.
로컬 깃 저장소는 **이미 커밋 완료** 상태입니다. 아래 한 번만 따라 하면 폰·PC 어디서든 URL로 접속됩니다.

---

## 방법 A — GitHub Pages (URL 영구, 추천)

### 1) GitHub에 빈 저장소 만들기
- https://github.com/new 접속
- **Repository name**: `heat-runner` (아무 이름 OK)
- **Public** 선택
- ⚠️ README/.gitignore **추가하지 말 것**(이미 있음) → **Create repository**

### 2) 올리기 (PowerShell에서, 이 폴더에서)
GitHub가 보여주는 주소로 아래 두 줄 (USERNAME은 본인 깃허브 아이디):
```powershell
git remote add origin https://github.com/USERNAME/heat-runner.git
git push -u origin main
```
- 처음 push 때 **브라우저 로그인 창**이 뜹니다 → GitHub 로그인하면 끝.

### 3) Pages 켜기
- 저장소 → **Settings** → 왼쪽 **Pages**
- **Source**: `Deploy from a branch`
- **Branch**: `main` / 폴더 `/ (root)` → **Save**
- 1~2분 뒤 주소가 나옵니다:
  ```
  https://USERNAME.github.io/heat-runner/
  ```
  → 이 URL을 폰에서 열면 바로 플레이 (홈 화면에 추가하면 앱처럼).

---

## 방법 B — Netlify Drop (30초, 계정·깃 불필요 · 가장 빠름)
1. https://app.netlify.com/drop 접속
2. **이 폴더(`busan-runner_v0`)를 통째로 드래그&드롭**
   - (`node_modules` 폴더는 빼고 올려도 됨 — 게임엔 불필요)
3. 즉시 `https://랜덤이름.netlify.app` URL 생성 → 폰에서 바로 플레이

---

## 참고
- 코드 수정 후 재배포:
  - GitHub Pages: `git add -A && git commit -m "update" && git push` → 자동 반영
  - Netlify: 폴더 다시 드롭
- 게임은 인터넷 없이도 동작하지만, 폰트(Anton 등)는 온라인일 때 더 예쁩니다.
- 최고기록·코인·장비·스킨은 **그 기기 브라우저(localStorage)** 에 저장됩니다(서버 계정 아님).
