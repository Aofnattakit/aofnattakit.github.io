/**
 * แฟ้มผลงานครู — ระบบหลังบ้าน (Google Apps Script)
 * -----------------------------------------------------------
 * หน้าที่ของไฟล์นี้
 *   1) ส่งข้อมูลผลงานให้หน้าเว็บสาธารณะ  →  <URL เว็บแอป>?api=1
 *   2) เปิดหน้าโพสต์ด่วนสำหรับครู        →  <URL เว็บแอป>
 *   3) บันทึก แก้ไข ลบ ผลงาน และอัปโหลดรูป/PDF ลง Google Drive
 *
 * ข้อมูลทั้งหมดอยู่ใน Google Sheet นี้ (แท็บ items, categories, settings)
 * หน้าตาเว็บอยู่บน GitHub แยกจากข้อมูล → เปลี่ยนดีไซน์ได้โดยข้อมูลไม่หาย
 */

const APP_VERSION = '1.0.0';
const SHEETS = { items: 'items', cats: 'categories', settings: 'settings' };

// คอลัมน์ของแท็บ items — เพิ่มคอลัมน์ใหม่ต่อท้ายได้ แล้วกดเมนู "ตั้งค่าครั้งแรก" ซ้ำ ระบบจะเติมหัวคอลัมน์ให้
const ITEM_HEADERS = [
  'id', 'type', 'cat', 'pa', 'title', 'sub', 'desc', 'date', 'year', 'level', 'status',
  'result', 'scope', 'event', 'students', 'showStudents', 'tags', 'link', 'images', 'files',
  'featured', 'hidden', 'created', 'updated'
];
const CAT_HEADERS = ['key', 'type', 'name', 'color', 'icon', 'order'];
const SETTING_HEADERS = ['key', 'value', 'note'];
const TEXT_COLUMNS = ['id', 'date', 'year', 'level', 'images', 'files', 'tags', 'created', 'updated'];
const CACHE_KEY = 'public_v1';

/* ===================== เมนูใน Google Sheet ===================== */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('แฟ้มผลงาน')
    .addItem('ตั้งค่าครั้งแรก / อัปเกรดโครงสร้าง', 'setup')
    .addItem('ดูรหัสสำหรับโพสต์', 'showKey')
    .addItem('ตั้งรหัสโพสต์ใหม่', 'resetKey')
    .addSeparator()
    .addItem('อัปเดตหน้าเว็บทันที (ล้างแคช)', 'clearCache')
    .addToUi();
}

function setup() {
  const ss = SpreadsheetApp.getActive();
  const items = ensureSheet_(ss, SHEETS.items, ITEM_HEADERS);
  const cats = ensureSheet_(ss, SHEETS.cats, CAT_HEADERS);
  const settings = ensureSheet_(ss, SHEETS.settings, SETTING_HEADERS);

  const headers = headers_(items);
  TEXT_COLUMNS.forEach(h => {
    const c = headers.indexOf(h) + 1;
    if (c > 0) items.getRange(2, c, Math.max(1, items.getMaxRows() - 1), 1).setNumberFormat('@');
  });

  if (cats.getLastRow() < 2) appendObjects_(cats, SEED_CATEGORIES);
  if (settings.getLastRow() < 2) appendObjects_(settings, SEED_SETTINGS);
  if (items.getLastRow() < 2) SEED_ITEMS.forEach(it => writeItem_(Object.assign({ created: nowIso_(), updated: nowIso_() }, it)));

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('FOLDER_ID')) {
    const folder = DriveApp.createFolder('แฟ้มผลงานครู - รูปและไฟล์');
    props.setProperty('FOLDER_ID', folder.getId());
  }
  if (!props.getProperty('ADMIN_KEY')) props.setProperty('ADMIN_KEY', newKey_());
  clearCache(true);

  SpreadsheetApp.getUi().alert(
    'ตั้งค่าเรียบร้อย (เวอร์ชัน ' + APP_VERSION + ')\n\n' +
    'รหัสสำหรับโพสต์: ' + props.getProperty('ADMIN_KEY') + '\n\n' +
    'ขั้นต่อไป: กด "ทำให้ใช้งานได้" (Deploy) > การทำให้ใช้งานได้รายการใหม่ > เว็บแอป\n' +
    'ตามคู่มือ README ขั้นตอนที่ 2'
  );
}

function showKey() {
  SpreadsheetApp.getUi().alert('รหัสสำหรับโพสต์: ' + PropertiesService.getScriptProperties().getProperty('ADMIN_KEY'));
}
function resetKey() {
  const k = newKey_();
  PropertiesService.getScriptProperties().setProperty('ADMIN_KEY', k);
  SpreadsheetApp.getUi().alert('ตั้งรหัสใหม่แล้ว: ' + k + '\nมือถือที่เคยจำรหัสเก่าไว้ ต้องเข้าสู่ระบบใหม่');
}
function clearCache(silent) {
  CacheService.getScriptCache().remove(CACHE_KEY);
  if (silent !== true) SpreadsheetApp.getUi().alert('ล้างแคชแล้ว หน้าเว็บจะแสดงข้อมูลล่าสุดในการเปิดครั้งถัดไป');
}

/* ===================== เว็บแอป ===================== */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.api) {
    return ContentService.createTextOutput(getPublicJson_()).setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createHtmlOutputFromFile('Admin')
    .setTitle('โพสต์ผลงาน')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .addMetaTag('apple-mobile-web-app-capable', 'yes');
}

function getPublicJson_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get(CACHE_KEY);
  if (hit) return hit;
  const all = readItems_();
  const data = {
    version: APP_VERSION,
    generated: nowIso_(),
    settings: readSettings_(true),
    categories: readCats_(),
    items: all.filter(i => !i.hidden).map(i => {
      const o = Object.assign({}, i);
      if (!o.showStudents) o.students = '';
      delete o.hidden; delete o.showStudents;
      return o;
    })
  };
  const str = JSON.stringify(data);
  try { cache.put(CACHE_KEY, str, 21600); } catch (err) { /* ข้อมูลใหญ่เกินแคช ไม่เป็นไร */ }
  return str;
}

/* ===================== ฟังก์ชันที่หน้าโพสต์เรียกใช้ ===================== */
function adminLogin(key) { check_(key); return { ok: true, version: APP_VERSION }; }

function adminData(key) {
  check_(key);
  return { items: readItems_(), categories: readCats_(), settings: readSettings_(false) };
}

function adminSave(key, item) {
  check_(key);
  if (!item || !String(item.title || '').trim()) throw new Error('กรุณาใส่ชื่อเรื่อง');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const exists = item.id && readItems_().some(x => x.id === item.id);
    if (!item.id) item.id = (item.type === 'news' ? 'n' : 'w') + Date.now().toString(36);
    if (!exists) item.created = nowIso_();
    item.updated = nowIso_();
    if (!item.year && item.date) item.year = String(Number(String(item.date).slice(0, 4)) + 543);
    writeItem_(item);
    CacheService.getScriptCache().remove(CACHE_KEY);
    return readItems_().find(x => x.id === item.id);
  } finally { lock.releaseLock(); }
}

function adminDelete(key, id) {
  check_(key);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.items);
    const h = headers_(sh), col = h.indexOf('id');
    const values = sh.getDataRange().getValues();
    for (let r = values.length - 1; r >= 1; r--) {
      if (String(values[r][col]) === String(id)) {
        const it = normalizeItem_(Object.fromEntries(h.map((k, i) => [k, values[r][i]])));
        sh.deleteRow(r + 1);
        // ย้ายรูป/ไฟล์ไปถังขยะ (กู้คืนได้ใน 30 วัน)
        it.images.concat(it.files.map(f => f.id)).forEach(fid => {
          if (/^https?:/.test(fid)) return;
          try { DriveApp.getFileById(fid).setTrashed(true); } catch (err) {}
        });
      }
    }
    CacheService.getScriptCache().remove(CACHE_KEY);
    return { ok: true };
  } finally { lock.releaseLock(); }
}

function adminUpload(key, f) {
  check_(key);
  const folder = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('FOLDER_ID'));
  const blob = Utilities.newBlob(Utilities.base64Decode(f.data), f.mime, f.name);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { id: file.getId(), name: f.name };
}

/* ===================== อ่าน/เขียนชีต ===================== */
function readItems_() {
  return readTable_(SHEETS.items).map(normalizeItem_).filter(i => i.id);
}
function readCats_() {
  return readTable_(SHEETS.cats).map(c => ({
    key: str_(c.key), type: str_(c.type) || 'work', name: str_(c.name),
    color: str_(c.color) || '#2563eb', icon: str_(c.icon) || str_(c.key), order: Number(c.order) || 0
  })).filter(c => c.key).sort((a, b) => a.order - b.order);
}
function readSettings_(publicOnly) {
  const o = {};
  readTable_(SHEETS.settings).forEach(r => {
    const k = str_(r.key);
    if (k && !(publicOnly && k.charAt(0) === '_')) o[k] = str_(r.value);
  });
  return o;
}

function normalizeItem_(o) {
  return {
    id: str_(o.id), type: str_(o.type) || 'work', cat: str_(o.cat), pa: Number(o.pa) || 0,
    title: str_(o.title), sub: str_(o.sub), desc: str_(o.desc), date: str_(o.date), year: str_(o.year),
    level: str_(o.level), status: str_(o.status) || 'live', result: str_(o.result), scope: str_(o.scope),
    event: str_(o.event), students: str_(o.students), showStudents: bool_(o.showStudents),
    tags: list_(o.tags), link: str_(o.link), images: list_(o.images), files: files_(o.files),
    featured: bool_(o.featured), hidden: bool_(o.hidden), created: str_(o.created), updated: str_(o.updated)
  };
}

function writeItem_(item) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEETS.items);
  const h = headers_(sh);
  const ser = {
    tags: v => (Array.isArray(v) ? v : list_(v)).join(', '),
    images: v => (Array.isArray(v) ? v : list_(v)).join(', '),
    files: v => JSON.stringify(Array.isArray(v) ? v : files_(v)),
    featured: v => !!v, hidden: v => !!v, showStudents: v => !!v
  };
  const row = h.map(k => {
    const v = item[k];
    if (ser[k]) return ser[k](v);
    return v == null ? '' : v;
  });
  const idCol = h.indexOf('id') + 1;
  const last = sh.getLastRow();
  let r = 0;
  if (last >= 2) {
    const ids = sh.getRange(2, idCol, last - 1, 1).getValues();
    const i = ids.findIndex(x => String(x[0]) === String(item.id));
    if (i >= 0) r = i + 2;
  }
  if (!r) r = last + 1;
  TEXT_COLUMNS.forEach(k => { const c = h.indexOf(k) + 1; if (c > 0) sh.getRange(r, c).setNumberFormat('@'); });
  sh.getRange(r, 1, 1, h.length).setValues([row]);
}

function readTable_(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  const v = sh.getDataRange().getValues();
  const h = v.shift().map(String);
  return v.filter(r => r.some(c => c !== '' && c !== null)).map(r => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}

function ensureSheet_(ss, name, wanted) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastColumn() === 0) {
    sh.getRange(1, 1, 1, wanted.length).setValues([wanted]);
  } else {
    const have = headers_(sh);
    const missing = wanted.filter(w => have.indexOf(w) < 0);
    if (missing.length) sh.getRange(1, have.length + 1, 1, missing.length).setValues([missing]);
  }
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold').setBackground('#dbe8fb');
  return sh;
}
function headers_(sh) { return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String); }
function appendObjects_(sh, arr) {
  const h = headers_(sh);
  sh.getRange(sh.getLastRow() + 1, 1, arr.length, h.length).setValues(arr.map(o => h.map(k => o[k] == null ? '' : o[k])));
}

/* ===================== ตัวช่วย ===================== */
function check_(key) {
  const k = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!k || String(key || '').trim() !== k) { Utilities.sleep(1500); throw new Error('รหัสไม่ถูกต้อง'); }
}
function newKey_() { let s = ''; for (let i = 0; i < 8; i++) s += Math.floor(Math.random() * 10); return s; }
function nowIso_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss"); }
function str_(x) {
  if (x instanceof Date) return Utilities.formatDate(x, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(x == null ? '' : x).trim();
}
function bool_(x) { return x === true || /^(true|1|yes|ใช่)$/i.test(String(x).trim()); }
function list_(x) { return Array.isArray(x) ? x : String(x == null ? '' : x).split(/[,，\n]/).map(s => s.trim()).filter(Boolean); }
function files_(x) {
  if (Array.isArray(x)) return x;
  try { const a = JSON.parse(String(x || '[]')); return Array.isArray(a) ? a.filter(f => f && f.id) : []; } catch (e) { return []; }
}
