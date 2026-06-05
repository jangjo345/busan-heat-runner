// JSON 저장/불러오기. saves/save.json 한 파일에 진행 상황을 담는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAVE_DIR = path.join(__dirname, '..', 'saves');
const SAVE_PATH = path.join(SAVE_DIR, 'save.json');

export function loadSave() {
  try {
    const raw = fs.readFileSync(SAVE_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!data || !data.pet) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeSave(state) {
  fs.mkdirSync(SAVE_DIR, { recursive: true });
  fs.writeFileSync(SAVE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

export function clearSave() {
  try {
    fs.unlinkSync(SAVE_PATH);
  } catch {
    /* 파일이 없으면 무시 */
  }
}
