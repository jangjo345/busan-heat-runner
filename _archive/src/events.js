// 이벤트 로드·선택 로직.
// 카드는 data/events.json에 정의. 등장 조건(when.bands / when.days)으로 필터링한 뒤 하나를 고른다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVENTS_PATH = path.join(__dirname, '..', 'data', 'events.json');

// 조건에 맞는 카드가 하나도 없을 때를 대비한 안전망 카드.
const DEFAULT_EVENT = {
  id: '_fallback',
  title: '한적한 골목',
  text: '낯선 골목에 들어섰다. 잠시 숨을 고를 작은 선택의 순간.',
  choices: [
    {
      label: '그늘 벤치에서 잠깐 쉰다',
      effects: { 체력: 8, 체온: -3, 수분: -2 },
      result: '벤치에 앉아 한숨 돌린다. 조금 회복됐다.',
    },
    {
      label: '분식집에서 물 한 컵 얻어 마신다',
      effects: { 수분: 18, 사기: 2 },
      result: '인심 좋은 사장님이 시원한 물을 내어준다.',
    },
  ],
};

export function loadEvents() {
  const raw = fs.readFileSync(EVENTS_PATH, 'utf8');
  const events = JSON.parse(raw);
  if (!Array.isArray(events) || events.length === 0) return [DEFAULT_EVENT];
  return events;
}

// 현재 상태(일차/시간대)에 맞는 카드 하나를 고른다.
// 우선순위: ① 미소비 보급 이벤트 → ② 일차 지정 특수 이벤트 → ③ 일반 이벤트
export function pickEvent(events, state, band) {
  const bandKey = band.key;
  const day = state.day;
  const seen = state.seenSupply || [];
  const usable = (e) => !(e.supply && seen.includes(e.id));

  let pool = events.filter((e) => matches(e, bandKey, day) && usable(e));

  // 조건에 맞는 게 없으면 "아무 때나" 등장 가능한 카드라도 찾는다.
  if (pool.length === 0) {
    pool = events.filter((e) => isAnytime(e) && usable(e));
  }
  if (pool.length === 0) return DEFAULT_EVENT;

  // ① 보급 이벤트가 매칭되면 최우선으로 등장시킨다.
  const supplies = pool.filter((e) => e.supply);
  if (supplies.length > 0) return choose(supplies, state);

  // ② 일차가 명시된 특수 이벤트를 그 다음으로 우선한다.
  const dayLocked = pool.filter((e) => e.when && Array.isArray(e.when.days) && e.when.days.length > 0);
  if (dayLocked.length > 0) return choose(dayLocked, state);

  // ③ 일반 이벤트
  return choose(pool, state);
}

// 직전과 같은 카드는 가능하면 피한 뒤 무작위 선택.
function choose(pool, state) {
  let candidates = pool;
  if (pool.length > 1 && state.lastEventId) {
    const fresh = pool.filter((e) => e.id !== state.lastEventId);
    if (fresh.length > 0) candidates = fresh;
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function matches(event, bandKey, day) {
  const when = event.when || {};
  const bandOk = !when.bands || when.bands.length === 0 || when.bands.includes(bandKey);
  const dayOk = !when.days || when.days.length === 0 || when.days.includes(day);
  return bandOk && dayOk;
}

function isAnytime(event) {
  const when = event.when || {};
  const noBand = !when.bands || when.bands.length === 0;
  const noDay = !when.days || when.days.length === 0;
  return noBand && noDay;
}
