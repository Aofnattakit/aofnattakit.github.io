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

const APP_VERSION = '1.1.0';
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
    .addItem('ตั้งค่า AI อ่านเกียรติบัตร (Gemini)', 'setupGemini')
    .addItem('อนุญาตสิทธิ์ระบบอ่านเกียรติบัตร', 'testReader')
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

/* ===================== อ่านเกียรติบัตร/เอกสารอัตโนมัติ ===================== */
// ลำดับการทำงาน: มีคีย์ Gemini → ให้ AI อ่านและแยกข้อมูล  |  ไม่มีคีย์หรือ AI ล้มเหลว → OCR ของ Google Drive + กฎภาษาไทย
const DOC_RESULTS = ['เหรียญทอง', 'เหรียญเงิน', 'เหรียญทองแดง', 'ชนะเลิศ', 'รองชนะเลิศอันดับ 1', 'รองชนะเลิศอันดับ 2', 'ชมเชย', 'เข้าร่วม'];
const DOC_SCOPES = ['โรงเรียน', 'เขตพื้นที่', 'จังหวัด', 'ภาค', 'ประเทศ', 'นานาชาติ'];
const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const TH_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function setupGemini() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('ตั้งค่า AI อ่านเกียรติบัตร (Gemini)',
    'วางคีย์ API จาก aistudio.google.com/apikey\n(เว้นว่างแล้วกด ตกลง = ลบคีย์ ใช้ตัวอ่านของ Google Drive แทน)', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const k = res.getResponseText().trim();
  const props = PropertiesService.getScriptProperties();
  if (!k) { props.deleteProperty('GEMINI_KEY'); ui.alert('ลบคีย์แล้ว ระบบจะใช้ตัวอ่านของ Google Drive'); return; }
  props.setProperty('GEMINI_KEY', k);
  try {
    const out = callGemini_([{ text: 'ตอบคำเดียวว่า พร้อม' }], false);
    ui.alert('เชื่อมต่อ AI สำเร็จ ✓\nคำตอบทดสอบ: ' + String(out).slice(0, 40));
  } catch (err) {
    ui.alert('ยังเชื่อมต่อ AI ไม่ได้: ' + err.message + '\n\nตรวจว่าคัดลอกคีย์ครบ แล้วลองใหม่');
  }
}

function testReader() {
  // ใช้ให้ Google ขอสิทธิ์การเชื่อมต่ออินเทอร์เน็ตครั้งแรก
  UrlFetchApp.fetch('https://www.google.com', { muteHttpExceptions: true });
  SpreadsheetApp.getUi().alert('อนุญาตสิทธิ์เรียบร้อย ระบบอ่านเกียรติบัตรพร้อมใช้งาน\nอย่าลืม Deploy เวอร์ชันใหม่ตามคู่มือ');
}

function adminReadDoc(key, fileId) {
  check_(key);
  const file = DriveApp.getFileById(fileId);
  const blob = file.getBlob();
  const mime = blob.getContentType();
  const cats = readCats_().filter(c => c.type === 'news');
  const props = PropertiesService.getScriptProperties();
  let errNote = '';
  if (props.getProperty('GEMINI_KEY')) {
    try {
      const f = readWithGemini_(blob, mime, cats);
      return { engine: 'ai', fields: cleanFields_(f, cats) };
    } catch (err) { errNote = 'AI อ่านไม่สำเร็จ (' + err.message + ') จึงใช้ตัวอ่านสำรอง'; }
  }
  const text = ocrDrive_(blob, mime);
  if (!text.trim()) throw new Error('อ่านตัวอักษรในรูปไม่ได้ ลองถ่ายให้ตรงและชัดขึ้น');
  return { engine: 'ocr', note: errNote, text: text.slice(0, 3000), fields: cleanFields_(parseCertText_(text, cats), cats) };
}

function callGemini_(parts, json) {
  const props = PropertiesService.getScriptProperties();
  const k = props.getProperty('GEMINI_KEY');
  const model = props.getProperty('GEMINI_MODEL') || 'gemini-flash-latest';
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';
  const body = { contents: [{ role: 'user', parts: parts }], generationConfig: { temperature: 0.1 } };
  if (json) body.generationConfig.responseMimeType = 'application/json';
  const r = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', headers: { 'x-goog-api-key': k }, payload: JSON.stringify(body), muteHttpExceptions: true });
  const code = r.getResponseCode(), txt = r.getContentText();
  if (code !== 200) {
    let m = 'รหัส ' + code;
    try { m = JSON.parse(txt).error.message || m; } catch (e) {}
    throw new Error(m.slice(0, 160));
  }
  const data = JSON.parse(txt);
  const out = (((data.candidates || [])[0] || {}).content || {}).parts || [];
  return out.map(p => p.text || '').join('');
}

function readWithGemini_(blob, mime, cats) {
  const prompt = [
    'คุณคือผู้ช่วยกรอกข้อมูลแฟ้มผลงานครูไทย อ่านเอกสารในภาพ (เกียรติบัตร วุฒิบัตร หนังสือรับรอง หรือภาพกิจกรรม) แล้วตอบเป็น JSON เท่านั้น ตามโครงสร้าง:',
    '{"title": "หัวข้อโพสต์สั้น กระชับ เป็นธรรมชาติ ไม่เกิน 80 ตัวอักษร เช่น นักเรียนคว้าเหรียญทองการแข่งขันคิดเลขเร็ว ม.ต้น",',
    ' "event": "ชื่องาน/รายการ/หลักสูตรตามเอกสาร",',
    ' "result": "เลือกหนึ่งค่าจาก ' + DOC_RESULTS.join(' | ') + ' หรือ \\"\\" ถ้าไม่มี",',
    ' "scope": "เลือกหนึ่งค่าจาก ' + DOC_SCOPES.join(' | ') + ' หรือ \\"\\" (ระดับชาติ=ประเทศ, สพม./สพป./เขต=เขตพื้นที่)",',
    ' "date": "วันที่บนเอกสารเป็น ค.ศ. รูปแบบ YYYY-MM-DD (แปลง พ.ศ. ลบ 543) หรือ \\"\\"",',
    ' "students": "ชื่อผู้ได้รับเกียรติบัตร คั่นด้วยจุลภาค",',
    ' "issuer": "หน่วยงานผู้ออกเอกสาร",',
    ' "cat": "เลือก key หนึ่งค่าจาก ' + cats.map(c => c.key + '=' + c.name).join(', ') + '",',
    ' "pa": "1, 2 หรือ 3 (1 การจัดการเรียนการสอน, 2 ส่งเสริมสนับสนุน เช่น พานักเรียนแข่งขัน, 3 พัฒนาตนเอง เช่น อบรม)",',
    ' "desc": "สรุป 1-2 ประโยคภาษาไทยทางการ สำหรับโพสต์"}',
    'ห้ามเดาข้อมูลที่ไม่มีในเอกสาร ให้เว้นเป็น "" แทน'
  ].join('\n');
  const parts = [{ text: prompt }, { inline_data: { mime_type: mime, data: Utilities.base64Encode(blob.getBytes()) } }];
  let out = callGemini_(parts, true).trim().replace(/^```(json)?/i, '').replace(/```$/, '');
  return JSON.parse(out);
}

function ocrDrive_(blob, mime) {
  const token = ScriptApp.getOAuthToken();
  const boundary = 'pf' + Date.now();
  const meta = JSON.stringify({ title: 'ocr-temp', mimeType: mime });
  const head = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + meta + '\r\n--' + boundary + '\r\nContent-Type: ' + mime + '\r\n\r\n';
  const tail = '\r\n--' + boundary + '--';
  const payload = Utilities.newBlob(head).getBytes().concat(blob.getBytes()).concat(Utilities.newBlob(tail).getBytes());
  const up = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart&convert=true&ocr=true&ocrLanguage=th', {
    method: 'post', contentType: 'multipart/related; boundary=' + boundary, payload: payload,
    headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true
  });
  if (up.getResponseCode() !== 200) throw new Error('ตัวอ่านของ Google Drive ใช้งานไม่ได้ (' + up.getResponseCode() + ')');
  const id = JSON.parse(up.getContentText()).id;
  try {
    const ex = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id + '/export?mimeType=text/plain', { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
    return ex.getResponseCode() === 200 ? ex.getContentText() : '';
  } finally {
    try { DriveApp.getFileById(id).setTrashed(true); } catch (e) {}
  }
}

/* แยกข้อมูลจากข้อความด้วยกฎภาษาไทย (ใช้เมื่อไม่มี AI) */
function parseCertText_(raw, cats) {
  const text = thaiDigits_(raw).replace(/​/g, '');
  const flat = text.replace(/\s+/g, ' ');
  const lines = text.split(/\n+/).map(s => s.replace(/\s+/g, ' ').trim()).filter(s => s.length > 1);
  const f = { title: '', event: '', result: '', scope: '', date: '', students: '', desc: '', cat: '', pa: '' };

  // ผลรางวัล
  const resultRules = [
    [/เหรียญทองแดง/, 'เหรียญทองแดง'], [/เหรียญเงิน/, 'เหรียญเงิน'], [/เหรียญทอง/, 'เหรียญทอง'],
    [/รองชนะเลิศ\s*อันดับ\s*(ที่)?\s*1|รองชนะเลิศอันดับหนึ่ง/, 'รองชนะเลิศอันดับ 1'], [/รองชนะเลิศ\s*อันดับ\s*(ที่)?\s*2|รองชนะเลิศอันดับสอง/, 'รองชนะเลิศอันดับ 2'],
    [/ชนะเลิศ/, 'ชนะเลิศ'], [/ชมเชย/, 'ชมเชย'], [/เข้าร่วม|ผ่านการอบรม|ผ่านการ/, 'เข้าร่วม']
  ];
  for (const [re, v] of resultRules) if (re.test(flat)) { f.result = v; break; }

  // ระดับ
  const scopeRules = [[/นานาชาติ|international/i, 'นานาชาติ'], [/ระดับชาติ|ระดับประเทศ|ประเทศไทย/, 'ประเทศ'], [/ระดับภาค|ภาคกลาง|ภาคเหนือ|ภาคใต้|ภาคตะวันออก/, 'ภาค'],
    [/ระดับจังหวัด/, 'จังหวัด'], [/เขตพื้นที่|สพม\.|สพป\.|ระดับเขต/, 'เขตพื้นที่'], [/ระดับโรงเรียน/, 'โรงเรียน']];
  for (const [re, v] of scopeRules) if (re.test(flat)) { f.scope = v; break; }

  // วันที่ (เลือกวันที่สุดท้ายในเอกสาร ซึ่งมักเป็นวันที่ออกเกียรติบัตร)
  const mAll = [], mre = new RegExp('(\\d{1,2})\\s*(?:เดือน)?\\s*(' + TH_MONTHS.concat(TH_MONTHS_SHORT.map(s => s.replace(/\./g, '\\.'))).join('|') + ')\\s*(?:พ\\.?\\s*ศ\\.?)?\\s*(\\d{4})', 'g');
  let m; while ((m = mre.exec(flat))) mAll.push(m);
  if (mAll.length) {
    const d = mAll[mAll.length - 1];
    let mi = TH_MONTHS.indexOf(d[2]); if (mi < 0) mi = TH_MONTHS_SHORT.indexOf(d[2]);
    let y = +d[3]; if (y > 2400) y -= 543;
    if (mi >= 0) f.date = y + '-' + String(mi + 1).padStart(2, '0') + '-' + String(+d[1]).padStart(2, '0');
  }

  // ชื่อผู้ได้รับ
  const nameRe = /(เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|นางสาว|นาย|นาง|ครู|ว่าที่ร้อยตรี)\s*[ก-๙]+(\s+[ก-๙]+)?/g;
  const names = [];
  (flat.replace(/\([^)]*\)/g, ' ').match(nameRe) || []).forEach(n => { n = n.trim(); if (!/ผู้อำนวยการ|ประธาน/.test(n) && names.indexOf(n) < 0) names.push(n); });
  f.students = names.slice(0, 6).join(', ');

  // ชื่องาน
  const evLine = lines.find(l => /การแข่งขัน|การประกวด|การอบรม|โครงการ|งานศิลปหัตถกรรม|มหกรรม|ค่าย|สัมมนา|การประชุม/.test(l) && l.length < 160);
  if (evLine) f.event = evLine.replace(/^(ได้ผ่าน|ผ่าน|ได้เข้าร่วม|เข้าร่วม|ในการ|ใน|เนื่องใน)\s*/, '').replace(/^ได้รับรางวัล\S*\s*/, '');

  // ประเภท
  const find = re => (cats.find(c => re.test(c.name)) || {}).key || '';
  if (/อบรม|สัมมนา|ประชุมเชิงปฏิบัติการ|วุฒิบัตร/.test(flat)) { f.cat = find(/อบรม/); f.pa = 3; }
  else if (/วิทยากร/.test(flat)) { f.cat = find(/วิทยากร/); f.pa = 3; }
  else if (/เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|นักเรียน/.test(flat)) { f.cat = find(/แข่งขัน/); f.pa = 2; }
  else if (f.result && f.result !== 'เข้าร่วม') { f.cat = find(/รางวัล/); f.pa = 3; }

  // หัวข้อ
  const who = /เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\./.test(f.students) ? 'นักเรียน' : '';
  if (f.result && f.result !== 'เข้าร่วม') f.title = (who ? who + 'คว้า' : 'ได้รับรางวัล') + f.result + (f.event ? ' ' + f.event : '');
  else if (f.event) f.title = (f.cat && /อบรม/.test((cats.find(c => c.key === f.cat) || {}).name || '') ? 'เข้าร่วม' : '') + f.event;
  f.title = f.title.slice(0, 100);
  return f;
}

function cleanFields_(f, cats) {
  f = f || {};
  const s = v => String(v == null ? '' : v).trim();
  const out = {
    title: s(f.title).slice(0, 120), event: s(f.event).slice(0, 200), students: s(f.students).slice(0, 300),
    desc: s(f.desc).slice(0, 600) || (f.issuer ? 'ออกโดย ' + s(f.issuer) : ''),
    result: DOC_RESULTS.indexOf(s(f.result)) >= 0 ? s(f.result) : '',
    scope: DOC_SCOPES.indexOf(s(f.scope)) >= 0 ? s(f.scope) : '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(s(f.date)) ? s(f.date) : '',
    cat: cats.some(c => c.key === s(f.cat)) ? s(f.cat) : '',
    pa: [1, 2, 3].indexOf(Number(f.pa)) >= 0 ? Number(f.pa) : ''
  };
  if (out.date) { const y = +out.date.slice(0, 4); if (y > 2400) out.date = (y - 543) + out.date.slice(4); }
  return out;
}
function thaiDigits_(s) { return String(s).replace(/[๐-๙]/g, d => '๐๑๒๓๔๕๖๗๘๙'.indexOf(d)); }
