// 엔트리포인트: 세이브 로드 → 게임 루프 시작
import { startGame } from './src/game.js';

const forceNew = process.argv.includes('--new');

startGame({ forceNew }).catch((err) => {
  console.error('\n[오류] 게임 실행 중 문제가 발생했어요:');
  console.error(err);
  process.exit(1);
});
