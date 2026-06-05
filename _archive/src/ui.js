// 콘솔 출력, ASCII 펫 얼굴, 컬러 연출.
import chalk from 'chalk';
import { LAST_DAY } from './time.js';
import { SLOTS } from './items.js';

const LINE = '━'.repeat(46);

// ── 펫 얼굴: 사기·체온·체력·수분 상태에 따라 바뀐다 ──────────────
const FACES = {
  hot: [
    '   ( ×﹏× )  💦',
    '  <(   )>',
    '    /  \\',
  ],
  thirst: [
    '   ( ◞‸◟ )  💧',
    '  <(   )>',
    '    /  \\',
  ],
  tired: [
    '   ( >﹏< )ゞ',
    '  <(   )>',
    '    /  \\   하…',
  ],
  sad: [
    '   ( ╥﹏╥ )',
    '  <(   )>',
    '    /  \\',
  ],
  happy: [
    '   ( ᗒ ᗨ ᗕ )✧',
    '  <(   )>',
    '   _/  \\_  다다닷!',
  ],
  calm: [
    '   ( • ᴗ • )',
    '  <(   )>',
    '    /  \\',
  ],
};

export function faceFor(pet) {
  if (pet.체온 >= 39) return { art: FACES.hot, mood: '헉… 너무 더워!', color: chalk.red };
  if (pet.수분 <= 20) return { art: FACES.thirst, mood: '목말라…', color: chalk.yellowBright };
  if (pet.체력 <= 20) return { art: FACES.tired, mood: '헥… 헥… 다리가…', color: chalk.yellow };
  if (pet.사기 <= 20) return { art: FACES.sad, mood: '포기하고 싶어…', color: chalk.blueBright };
  if (pet.사기 >= 80 && pet.체온 <= 38) return { art: FACES.happy, mood: '좋았어, 달리자!', color: chalk.greenBright };
  return { art: FACES.calm, mood: '아직 괜찮아.', color: chalk.cyanBright };
}

// ── 스탯 바 ────────────────────────────────────────────────
function bar(value) {
  const filled = Math.max(0, Math.min(10, Math.round(value / 10)));
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

function colorFor(value) {
  if (value <= 20) return chalk.red;
  if (value <= 40) return chalk.yellow;
  return chalk.green;
}

function statLine(label, value) {
  const color = colorFor(value);
  return `  ${label} ${color('[' + bar(value) + ']')} ${color(String(value).padStart(3))}`;
}

function tempLine(t) {
  let status;
  let color;
  if (t >= 40) { status = '열사병 위험!!'; color = chalk.bgRed.whiteBright; }
  else if (t >= 39) { status = '과열'; color = chalk.redBright; }
  else if (t >= 38) { status = '주의'; color = chalk.yellow; }
  else if (t >= 36) { status = '안전'; color = chalk.green; }
  else { status = '서늘'; color = chalk.cyanBright; }
  return `  체온 ${color(`${t}°C  [${status}]`)}`;
}

// ── 화면 출력 ──────────────────────────────────────────────
export function banner() {
  console.log();
  console.log(chalk.bold.hex('#ff7a18')('  ╔══════════════════════════════════════════╗'));
  console.log(chalk.bold.hex('#ff7a18')('  ║   부산 러너 — 한여름 폭염 7일 생존기   ║'));
  console.log(chalk.bold.hex('#ff7a18')('  ╚══════════════════════════════════════════╝'));
  console.log(chalk.dim('     체온 40↑ · 수분 0 · 사기 0 → 리타이어. 7일을 버텨라.'));
  console.log();
}

export function info(msg) {
  console.log(chalk.cyan('› ') + msg);
}

export function dim(msg) {
  console.log(chalk.dim(msg));
}

export function renderTurn(state, band) {
  const pet = state.pet;
  const face = faceFor(pet);

  console.log();
  console.log(chalk.gray(LINE));
  console.log(
    `  ${band.icon}  ${chalk.bold(`${state.day}일차`)} ${chalk.bold(band.key)}` +
      chalk.dim(`   ·   완주까지 D-${Math.max(0, LAST_DAY - state.day)}`),
  );
  console.log('  ' + chalk.italic.dim(band.blurb));
  console.log(chalk.gray(LINE));

  // 얼굴 + 이름/기분
  const [l1, l2, l3] = face.art;
  console.log(`${l1}      ${chalk.bold(pet.name)}`);
  console.log(`${l2}      ${face.color(face.mood)}`);
  console.log(`${l3}`);
  console.log();

  // 스탯
  console.log(statLine('수분', pet.수분));
  console.log(tempLine(pet.체온));
  console.log(statLine('체력', pet.체력));
  console.log(statLine('사기', pet.사기));
  console.log();
}

// 현재 장착 장비 한 줄 표시.
export function renderEquipment(equipment, items) {
  const parts = [];
  for (const slot of SLOTS) {
    const id = equipment[slot];
    if (id && items[id]) parts.push(`${chalk.dim(slot)} ${chalk.green(items[id].name)}`);
  }
  if (parts.length === 0) {
    console.log('  ' + chalk.dim('장비: 없음 (맨몸)'));
  } else {
    console.log('  ' + chalk.dim('장비: ') + parts.join(chalk.dim('  ·  ')));
  }
  console.log();
}

// 장비 획득 연출 한 줄(+ 효과 / 교체 안내).
export function showAcquire(item, replacedItem) {
  console.log();
  console.log(
    '  ' +
      chalk.bgGreen.black(' 장비 획득 ') +
      ' ' +
      chalk.bold.greenBright(item.name) +
      chalk.dim(` (${item.slot})`),
  );
  console.log('  ' + chalk.dim(`${item.spec}  →  ${item.desc}`));
  if (replacedItem) {
    console.log('  ' + chalk.dim(`(${replacedItem.name} 탈착)`));
  }
}

export function renderEvent(event) {
  console.log(chalk.bold.hex('#ffd166')(`  「 ${event.title} 」`));
  console.log('  ' + event.text.replace(/\n/g, '\n  '));
  console.log();
}

// appliedEffects: 장비 보정이 적용된 실제 변화량(없으면 원본 effects).
export function showResult(choice, appliedEffects) {
  if (choice.result) {
    console.log();
    console.log('  ' + chalk.magentaBright('→ ') + chalk.italic(choice.result));
  }
  const fx = formatEffects(appliedEffects || choice.effects);
  if (fx) console.log('  ' + chalk.dim(fx));
}

function formatEffects(effects = {}) {
  const parts = [];
  for (const [key, deltaRaw] of Object.entries(effects)) {
    const delta = Math.round(deltaRaw);
    if (!delta) continue;
    const sign = delta > 0 ? `+${delta}` : `${delta}`;
    const colored = delta > 0 ? chalk.green(sign) : chalk.red(sign);
    parts.push(`${key} ${colored}`);
  }
  return parts.length ? `( ${parts.join('  ')} )` : '';
}

export function showEnding(ending, state, items = null) {
  const pet = state.pet;
  // 완주 시 state.day는 8(=7일차 밤을 넘김)이 되므로 표시는 LAST_DAY로 보정.
  const shownDay = Math.min(state.day, LAST_DAY);
  const text = (ending.text || '').replaceAll('{name}', pet.name).replaceAll('{day}', String(shownDay));

  console.log();
  console.log(chalk.gray(LINE));
  console.log('  ' + chalk.bold.hex('#ff7a18')(ending.title || '엔딩'));
  console.log(chalk.gray(LINE));
  if (Array.isArray(ending.art)) {
    for (const line of ending.art) console.log('  ' + line);
    console.log();
  }
  console.log('  ' + text.replace(/\n/g, '\n  '));
  console.log();
  console.log(
    chalk.dim(
      `  버틴 시간: ${shownDay}일차 · 최종 스탯 — 수분 ${pet.수분} / 체온 ${pet.체온}°C / 체력 ${pet.체력} / 사기 ${pet.사기}`,
    ),
  );
  if (items && state.equipment) {
    const gear = SLOTS.map((s) => state.equipment[s])
      .filter(Boolean)
      .map((id) => items[id]?.name)
      .filter(Boolean);
    if (gear.length > 0) {
      console.log(chalk.dim(`  최종 장비: ${gear.join(' · ')}`));
    }
  }
  console.log(chalk.gray(LINE));
  console.log();
}
