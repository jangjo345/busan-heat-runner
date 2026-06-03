Original prompt: D:\Claude_auto\experiments\busan-runner_v0 게임의 더블클릭(플립)과 사망 후 다시 달리기 입력이 계속 고장나는 원인을 찾아 수정.

2026-06-03
- 원인 1: 사망 결과 오버레이가 캔버스를 덮기 때문에 캔버스 pointerdown 기반 재시작은 불안정함. 기존 오버레이 리스너도 0.4초 cardT 게이트 때문에 유저가 바로 누르면 무시될 수 있었음.
- 조치: 결과 오버레이 자체에 pointerdown + click 재시작 핸들러를 붙이고 버튼 클릭은 제외. 사망 상태면 즉시 startRun().
- 원인 2: 기존 플립은 input.held에 의존해서 첫 점프 홀드와 공중 두 번째 탭의 의미가 섞였고, 짧은 더블탭은 회전 피드백이 약했음.
- 조치: beginFlip()을 추가해 공중 두 번째 탭만 플립으로 래치. 짧은 탭도 즉시 보이도록 flipTapKick 보정값 추가.
- 빌드/캐시: BUILD와 script query는 v15로 확인됨.
