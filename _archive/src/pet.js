// 펫 스탯/상태 계산
// 수분·체력·사기: 0~100. 체온: "안전 구간(36~38) 유지"가 핵심, 40+면 열사병 리타이어.

export const STAT_KEYS = ['수분', '체온', '체력', '사기'];

export function newPet(name = '러너') {
  return {
    name,
    수분: 80,
    체온: 37,
    체력: 80,
    사기: 70,
  };
}

// 스탯 효과 적용 후 범위 보정.
export function applyEffects(pet, effects = {}) {
  for (const [key, delta] of Object.entries(effects)) {
    if (pet[key] === undefined) continue;
    pet[key] += delta;
  }
  clampPet(pet);
}

// 시간대/장비 "패시브" 적용. 치명 한계선은 패시브만으로 넘지 않도록 막는다.
// → 리타이어는 항상 플레이어의 "선택" 다음에만 일어난다(손쓸 기회 보장, 스펙 턴 루프 4단계와 일치).
//   폭염 패시브는 체온을 39까지만 끌어올린다(40 돌파는 네 선택의 결과).
export function applyPassive(pet, effects = {}) {
  applyEffects(pet, effects);
  if (pet.체온 > 39) pet.체온 = 39;
  if (pet.수분 < 1) pet.수분 = 1;
  if (pet.사기 < 1) pet.사기 = 1;
}

export function clampPet(pet) {
  pet.수분 = clamp(pet.수분, 0, 100);
  pet.체력 = clamp(pet.체력, 0, 100);
  pet.사기 = clamp(pet.사기, 0, 100);
  // 체온은 별도 범위. 30~45로 제한(36~38이 안전, 40+ 리타이어).
  pet.체온 = clamp(pet.체온, 30, 45);
}

function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.round(value)));
}

// 리타이어 사유 판정. 없으면 null.
export function checkRetire(pet) {
  if (pet.체온 >= 40) return 'heat';
  if (pet.수분 <= 0) return 'dehydration';
  if (pet.사기 <= 0) return 'morale';
  return null;
}

// 리타이어 사유 → endings.json 키 매핑.
export function retireEndingKey(reason) {
  return {
    heat: 'retire_heat',
    dehydration: 'retire_dehydration',
    morale: 'retire_morale',
  }[reason];
}
