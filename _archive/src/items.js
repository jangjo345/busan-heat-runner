// 장비 시스템 (이스터에그). 슬롯: 머리 / 목 / 다리 / 하의.
// 효과(mods)는 data/items.json에서 수치만 조정 가능. 엔진은 mod의 kind를 해석만 한다.
//
// mod 종류:
//   { kind: "perTurn", stat, delta }                            → 매 턴 고정 변화
//   { kind: "scale", stat, phase, direction, factor, bands? }   → 특정 스탯 변화량에 배율
//     - phase: "drift"(시간대 패시브) | "effect"(선택 효과) | "both"
//     - direction: "up"(증가분에만) | "down"(감소분에만) | "any"
//     - bands: 지정 시 해당 시간대에서만 적용
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ITEMS_PATH = path.join(__dirname, '..', 'data', 'items.json');

export const SLOTS = ['머리', '목', '다리', '하의'];

export function loadItems() {
  return JSON.parse(fs.readFileSync(ITEMS_PATH, 'utf8'));
}

export function emptyEquipment() {
  return { 머리: null, 목: null, 다리: null, 하의: null };
}

export function owns(equipment, itemId) {
  return Object.values(equipment).includes(itemId);
}

function activeMods(equipment, items) {
  const mods = [];
  for (const slot of SLOTS) {
    const id = equipment[slot];
    const item = id ? items[id] : null;
    if (item && Array.isArray(item.mods)) mods.push(...item.mods);
  }
  return mods;
}

// 시간대 drift나 선택 효과에 scale 모디파이어를 적용한 새 effects 객체를 돌려준다.
export function scaleEffects(effects = {}, equipment, items, ctx = {}) {
  const mods = activeMods(equipment, items).filter((m) => m.kind === 'scale');
  const out = {};
  for (const [stat, delta] of Object.entries(effects)) {
    let value = delta;
    for (const m of mods) {
      if (m.stat !== stat) continue;
      if (m.phase !== 'both' && m.phase !== ctx.phase) continue;
      if (m.bands && m.bands.length && (!ctx.band || !m.bands.includes(ctx.band.key))) continue;
      if (m.direction === 'up' && !(value > 0)) continue;
      if (m.direction === 'down' && !(value < 0)) continue;
      value *= m.factor;
    }
    out[stat] = value;
  }
  return out;
}

// 매 턴 적용되는 고정 패시브(perTurn)들을 합산.
export function perTurnEffects(equipment, items) {
  const mods = activeMods(equipment, items).filter((m) => m.kind === 'perTurn');
  const out = {};
  for (const m of mods) out[m.stat] = (out[m.stat] || 0) + m.delta;
  return out;
}

export function mergeEffects(a = {}, b = {}) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] || 0) + v;
  return out;
}

// 장비 장착(같은 슬롯이면 교체). { item, replacedId } 반환.
export function equip(equipment, items, itemId) {
  const item = items[itemId];
  if (!item) return null;
  const slot = item.slot;
  const replacedId = equipment[slot];
  equipment[slot] = itemId;
  return { item, replacedId };
}
