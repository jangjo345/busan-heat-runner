// 일차 + 시간대 진행 모델
// 실시간 아님. 선택을 할 때마다 시간대가 한 칸 넘어간다.
// 정오/오후 = 위험(체온↑ 수분↓), 새벽/저녁/밤 = 회복 구간.

export const LAST_DAY = 7;

// 시간대 정의. drift = 그 시간대에 진입할 때 자동으로 적용되는 패시브 스탯 변화.
export const BANDS = [
  {
    key: '새벽',
    icon: '🌙',
    kind: 'recover',
    drift: { 체온: -2, 수분: -1, 체력: +4, 사기: +1 },
    blurb: '선선한 새벽 공기. 달리기 가장 좋은 시간이다.',
  },
  {
    key: '오전',
    icon: '🌤️',
    kind: 'mild',
    drift: { 체온: +1, 수분: -2, 체력: +1, 사기: 0 },
    blurb: '해가 오르기 시작한다. 아직은 버틸 만하다.',
  },
  {
    key: '정오',
    icon: '☀️',
    kind: 'danger',
    drift: { 체온: +4, 수분: -5, 체력: -1, 사기: -1 },
    blurb: '정오의 직사광선. 하루 중 가장 위험한 시간대.',
  },
  {
    key: '오후',
    icon: '🔥',
    kind: 'danger',
    drift: { 체온: +3, 수분: -4, 체력: -1, 사기: 0 },
    blurb: '달궈진 아스팔트에서 아지랑이가 피어오른다.',
  },
  {
    key: '저녁',
    icon: '🌇',
    kind: 'recover',
    drift: { 체온: -2, 수분: -1, 체력: +2, 사기: +1 },
    blurb: '열기가 한풀 꺾였다. 숨을 돌릴 시간.',
  },
  {
    key: '밤',
    icon: '🌃',
    kind: 'recover',
    drift: { 체온: -2, 수분: -1, 체력: +3, 사기: +1 },
    blurb: '시원한 밤. 회복의 시간이다.',
  },
];

export function currentBand(state) {
  return BANDS[state.bandIndex];
}

// 시간대를 한 칸 진행. 밤을 지나면 다음 날 새벽으로.
export function advanceTime(state) {
  state.bandIndex += 1;
  if (state.bandIndex >= BANDS.length) {
    state.bandIndex = 0;
    state.day += 1;
  }
}

// 7일차 밤을 넘기면(=8일차로 진입) 완주.
export function isComplete(state) {
  return state.day > LAST_DAY;
}
