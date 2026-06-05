// 게임 상태 + 메인 루프.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prompts from 'prompts';

import { newPet, applyEffects, applyPassive, checkRetire, retireEndingKey } from './pet.js';
import { BANDS, currentBand, advanceTime, isComplete } from './time.js';
import { loadEvents, pickEvent } from './events.js';
import { loadSave, writeSave, clearSave } from './save.js';
import {
  loadItems,
  emptyEquipment,
  scaleEffects,
  perTurnEffects,
  mergeEffects,
  equip,
  owns,
} from './items.js';
import * as ui from './ui.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENDINGS_PATH = path.join(__dirname, '..', 'data', 'endings.json');

function loadEndings() {
  return JSON.parse(fs.readFileSync(ENDINGS_PATH, 'utf8'));
}

export async function startGame({ forceNew = false } = {}) {
  ui.banner();

  // AUTO_PLAY=1 이면 입력 없이 휴리스틱으로 자동 진행(테스트/데모용).
  const auto = !!process.env.AUTO_PLAY;
  if (forceNew || auto) clearSave();

  const items = loadItems();

  let state = loadSave();
  if (state) {
    // 구버전 세이브 호환: 장비 필드가 없으면 채워준다.
    state.equipment = state.equipment || emptyEquipment();
    state.seenSupply = state.seenSupply || [];
    ui.info(
      `이어하기 — ${state.pet.name} · ${state.day}일차 ${BANDS[state.bandIndex].key} (지금까지 ${state.turns ?? 0}턴)`,
    );
  } else {
    const name = auto ? '바람' : await askName();
    state = {
      pet: newPet(name),
      day: 1,
      bandIndex: 0,
      lastEventId: null,
      turns: 0,
      equipment: emptyEquipment(),
      seenSupply: [],
    };
    writeSave(state);
    ui.info(`새 게임 시작! ${name}와(과) 함께 부산의 폭염 7일을 버텨보자.`);
    ui.dim('   (맨몸 출발 — 장비는 진행 중 "보급" 이벤트에서 얻는다)');
  }

  const events = loadEvents();
  const endings = loadEndings();

  // 메인 루프
  while (true) {
    // 1) 완주 체크
    if (isComplete(state)) {
      ui.showEnding(endings.complete, state, items);
      clearSave();
      break;
    }

    const band = currentBand(state);

    // 2) 시간대 패시브 = 시간대 drift(장비 스케일 적용) + 장비 perTurn 효과
    //    패시브만으로는 리타이어 한계선을 넘지 않는다(체온 39까지). 손쓸 기회는 항상 보장.
    const driftEff = scaleEffects(band.drift, state.equipment, items, { phase: 'drift', band });
    const turnEff = perTurnEffects(state.equipment, items);
    applyPassive(state.pet, mergeEffects(driftEff, turnEff));

    // 3) 현재 상태 + 장비 + 이벤트 출력
    ui.renderTurn(state, band);
    ui.renderEquipment(state.equipment, items);
    const event = pickEvent(events, state, band);
    ui.renderEvent(event);

    // 4) 선택
    const choice = await askChoice(event, state, auto, items);
    if (!choice) {
      // 중도 종료(Ctrl+C 등): 진행 상황 저장 후 빠져나간다.
      writeSave(state);
      console.log();
      ui.info('진행 상황을 저장했어. 다음에 이어서 하자!');
      break;
    }

    // 5) 선택 효과(장비 스케일 적용) — 표시도 실제 적용값으로
    const fx = scaleEffects(choice.effects || {}, state.equipment, items, { phase: 'effect', band });
    ui.showResult(choice, fx);
    applyEffects(state.pet, fx);

    // 5-1) 장비 획득 연출
    if (choice.grant) {
      const res = equip(state.equipment, items, choice.grant);
      if (res) ui.showAcquire(res.item, res.replacedId ? items[res.replacedId] : null);
    }
    // 5-2) 보급 이벤트 소비 처리(다시 등장하지 않도록)
    if (event.supply && !state.seenSupply.includes(event.id)) {
      state.seenSupply.push(event.id);
    }

    state.lastEventId = event.id;
    state.turns = (state.turns ?? 0) + 1;

    // 6) 선택 결과로 인한 리타이어 체크 (리타이어는 항상 선택 다음에만)
    const reason = checkRetire(state.pet);
    if (reason) {
      ui.showEnding(endings[retireEndingKey(reason)], state, items);
      clearSave();
      break;
    }

    // 7) 시간대 진행 + 저장
    advanceTime(state);
    writeSave(state);

    if (auto) await tick();
  }
}

async function askName() {
  const res = await prompts({
    type: 'text',
    name: 'name',
    message: '러너 펫의 이름을 지어줘',
    initial: '바람',
    validate: (v) => (v && v.trim().length > 0 ? true : '이름을 한 글자 이상 입력해줘'),
  });
  if (!res.name) return '바람';
  return res.name.trim();
}

async function askChoice(event, state, auto, items) {
  if (auto) return autoPick(event, state, items);

  const res = await prompts({
    type: 'select',
    name: 'idx',
    message: '어떻게 할까?',
    choices: event.choices.map((c, i) => ({ title: c.label, value: i })),
    initial: 0,
  });
  if (res.idx === undefined || res.idx === null) return null; // 취소
  return event.choices[res.idx];
}

// ── 자동 플레이: 생존 점수가 가장 높은 선택지를 고른다 ──────────
function autoPick(event, state, items) {
  let best = event.choices[0];
  let bestScore = -Infinity;
  for (const choice of event.choices) {
    const sim = { ...state.pet };
    applyEffects(sim, choice.effects || {});
    let score = survivalScore(sim);
    // 아직 없는 장비는 적극적으로 획득(이스터에그 시연용).
    if (choice.grant && !owns(state.equipment, choice.grant)) score += 500;
    if (score > bestScore) {
      bestScore = score;
      best = choice;
    }
  }
  return best;
}

function survivalScore(p) {
  let s = 0;
  s -= Math.max(0, p.체온 - 38) * 30; // 과열은 치명적
  s -= Math.max(0, 36 - p.체온) * 3; // 너무 식어도 약간 감점
  s += p.수분 * 1.6;
  s += p.체력 * 0.8;
  s += p.사기 * 1.1;
  if (p.수분 <= 15) s -= 250;
  if (p.사기 <= 15) s -= 180;
  if (p.체온 >= 39) s -= 350;
  return s;
}

function tick() {
  return new Promise((resolve) => setTimeout(resolve, 120));
}
