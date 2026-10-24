/*
 * แฟ้มผลงานครู — สคริปต์หน้าเว็บ
 * อ่านข้อมูลจาก Google Sheet ผ่าน Apps Script (ลิงก์อยู่ใน config.js)
 * โครงสร้างข้อมูล: { settings, categories, items }  — ดูรายละเอียดใน README.md
 */
(function () {
  "use strict";
  const ICONS = {
    game: '<line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/>',
    app: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
    media: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    doc: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    activity: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
    design: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/>',
    pd: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M22 10v6"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7l10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    pdf: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    school: '<path d="M14 22v-4a2 2 0 1 0-4 0v4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M18 5v17"/><path d="m4 6 8-4 8 4"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    sigma: '<path d="M18 7V4H6l6 8-6 8h12v-3"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>'
  };
  const ic = (n, cls) => `<svg class="ico${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.star}</svg>`;

  const PA = {
    1: { name: "ด้านการจัดการเรียนการสอน", a: "#22b8f0", b: "#1f63e0" },
    2: { name: "ด้านการส่งเสริมและสนับสนุนการจัดการเรียนรู้", a: "#2dd4bf", b: "#0891b2" },
    3: { name: "ด้านการพัฒนาตนเองและวิชาชีพ", a: "#a5b4fc", b: "#5b5ef0" }
  };
  const STATUS = { live: { t: "ใช้งานจริง", c: "var(--ok)" }, wip: { t: "กำลังพัฒนา", c: "var(--wip)" } };
  const SKILL_ICONS = [[/คณิต/, "sigma"], [/เกม/, "game"], [/เว็บ|แอป|โค้ด|โปรแกรม/, "code"], [/ออกแบบ|กราฟิก/, "design"], [/ดนตรี|เพลง/, "music"], [/ลูกเสือ/, "compass"]];
  const medalTone = r => /ทองแดง|อันดับ 2/.test(r) ? "bronze" : /ทอง|ชนะเลิศ$/.test(r) ? "gold" : /เงิน|อันดับ 1/.test(r) ? "silver" : "blue";
  const TH_MONTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  /* Illustrated cover art per category — drawn with SVG, varied per work */
  function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function art(cat, seed) {
    const h = hash(seed), r = n => (h >>> (n % 24)) % 1000 / 1000;
    const W = "rgba(255,255,255,", rot = Math.round(r(3) * 24 - 12), sx = Math.round(r(5) * 60 - 30);
    const grid = `<pattern id="g${h}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="${W}.10)" stroke-width="1"/></pattern><rect width="400" height="250" fill="url(#g${h})"/>`;
    const glow = `<radialGradient id="r${h}" cx="${0.6 + r(7) * 0.3}" cy="${0.2 + r(9) * 0.3}" r=".7"><stop offset="0" stop-color="#ffd25a" stop-opacity=".45"/><stop offset="1" stop-color="#ffd25a" stop-opacity="0"/></radialGradient><rect width="400" height="250" fill="url(#r${h})"/>`;
    let g = "";
    switch (cat) {
      case "game": {
        const die = (x, y, a, n) => { const p = { 1: [[0,0]], 2: [[-1,-1],[1,1]], 3: [[-1,-1],[0,0],[1,1]], 4: [[-1,-1],[1,-1],[-1,1],[1,1]], 5: [[-1,-1],[1,-1],[0,0],[-1,1],[1,1]], 6: [[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]] }[n];
          return `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-30" y="-30" width="60" height="60" rx="12" fill="${W}.16)" stroke="${W}.7)" stroke-width="2"/>${p.map(([i, j]) => `<circle cx="${i * 14}" cy="${j * 14}" r="5" fill="#fff"/>`).join("")}</g>`; };
        g = `<path d="M30 210 C 110 140, 170 240, 250 170 S 360 120, 390 60" fill="none" stroke="${W}.55)" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>
          ${[[30,210],[140,182],[250,170],[330,118]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="${W}.8)" stroke-width="2.5"/>`).join("")}
          ${die(250 + sx, 92, rot + 14, 1 + (h % 6))}${die(320 + sx / 2, 160, -rot - 8, 1 + ((h >>> 3) % 6))}
          <polygon points="80,60 110,110 50,110" fill="${W}.12)" stroke="${W}.6)" stroke-width="2"/><text x="72" y="104" fill="#fff" font-size="16" font-family="serif" font-style="italic">θ</text>`;
        break;
      }
      case "app": {
        const bars = [0,1,2,3,4].map(i => { const v = 20 + Math.round(((h >>> (i * 3)) % 50)); return `<rect x="${222 + i * 24}" y="${190 - v}" width="14" height="${v}" rx="3" fill="${W}${i === 3 ? ".95" : ".55"})"/>`; }).join("");
        g = `<g transform="translate(${40 + sx / 3} 34) rotate(${rot / 3})"><rect width="320" height="190" rx="14" fill="${W}.12)" stroke="${W}.6)" stroke-width="2"/>
          <path d="M0 30H320" stroke="${W}.4)" stroke-width="2"/>${[18,34,50].map(x => `<circle cx="${x}" cy="15" r="5" fill="${W}.8)"/>`).join("")}
          <rect x="18" y="48" width="110" height="10" rx="5" fill="${W}.85)"/><rect x="18" y="68" width="150" height="8" rx="4" fill="${W}.35)"/><rect x="18" y="84" width="130" height="8" rx="4" fill="${W}.35)"/>
          <rect x="18" y="110" width="70" height="56" rx="10" fill="${W}.18)"/><rect x="96" y="110" width="70" height="56" rx="10" fill="${W}.18)"/></g>${bars}`;
        break;
      }
      case "media": {
        g = `${[40,75,110,145].map((rr, i) => `<circle cx="${280 + sx / 2}" cy="110" r="${rr}" fill="none" stroke="${W}${(.5 - i * .1).toFixed(2)})" stroke-width="1.5"/>`).join("")}
          <g transform="translate(${280 + sx / 2} 110)">${[0,45,90,135,180,225,270,315].map(a => `<line x1="0" y1="-52" x2="0" y2="-66" stroke="${W}.8)" stroke-width="3" stroke-linecap="round" transform="rotate(${a})"/>`).join("")}
          <circle r="30" fill="${W}.95)"/><path d="M-8 -6 L0 6 L8 -6" fill="none" stroke="#0b2557" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
          <text x="40" y="90" fill="${W}.85)" font-size="30" font-family="serif" font-style="italic">x² + y²</text><text x="58" y="150" fill="${W}.5)" font-size="22" font-family="serif" font-style="italic">= r²</text>`;
        break;
      }
      case "doc": {
        const sheet = (x, y, a, o) => `<g transform="translate(${x} ${y}) rotate(${a})"><rect width="150" height="190" rx="8" fill="${W}${o})" stroke="${W}.6)" stroke-width="1.5"/>${[30,48,66,84,102,120,138].map((yy, i) => `<rect x="18" y="${yy}" width="${i % 3 === 2 ? 70 : 114}" height="6" rx="3" fill="${W}.45)"/>`).join("")}<rect x="18" y="12" width="60" height="9" rx="4" fill="${W}.9)"/></g>`;
        g = `${sheet(150 + sx / 2, 40, -8 + rot / 3, ".10")}${sheet(185 + sx / 2, 30, 4 + rot / 4, ".18")}
          <g transform="translate(70 170)"><circle r="34" fill="${W}.14)" stroke="${W}.7)" stroke-width="2"/><path d="M-14 0 l9 9 18-18" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`;
        break;
      }
      case "activity": {
        const flags = [0,1,2,3,4,5,6,7].map(i => { const x = 20 + i * 50, y = 40 + Math.sin(i / 7 * Math.PI) * 30; return `<polygon points="${x},${y} ${x + 36},${y + 2} ${x + 18},${y + 40}" fill="${W}${i % 2 ? ".85" : ".35"})"/>`; }).join("");
        const conf = [0,1,2,3,4,5,6,7,8,9,10,11].map(i => { const x = (hash(seed + i) % 380) + 10, y = 110 + (hash(i + seed) >>> 5) % 120; return `<rect x="${x}" y="${y}" width="8" height="4" rx="2" fill="${W}.7)" transform="rotate(${(i * 37) % 180} ${x} ${y})"/>`; }).join("");
        g = `<path d="M0 36 Q200 110 400 36" fill="none" stroke="${W}.7)" stroke-width="2"/>${flags}${conf}
          <g transform="translate(${200 + sx} 170)"><circle r="38" fill="${W}.14)" stroke="${W}.6)" stroke-width="2"/><path d="M-12 18 V-22 M-12 -22 C 0 -28, 8 -14, 20 -20 V0 C 8 6, 0 -8, -12 -2" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></g>`;
        break;
      }
      case "design": {
        g = `<circle cx="${170 + sx}" cy="110" r="62" fill="${W}.14)" stroke="${W}.6)" stroke-width="2"/><circle cx="${230 + sx}" cy="110" r="62" fill="${W}.10)" stroke="${W}.6)" stroke-width="2"/><circle cx="${200 + sx}" cy="160" r="62" fill="${W}.08)" stroke="${W}.6)" stroke-width="2"/>
          <path d="M40 210 C 120 120, 280 250, 370 70" fill="none" stroke="#fff" stroke-width="3"/>
          <line x1="40" y1="210" x2="120" y2="120" stroke="${W}.5)" stroke-dasharray="4 5"/><line x1="370" y1="70" x2="280" y2="250" stroke="${W}.5)" stroke-dasharray="4 5"/>
          ${[[40,210],[370,70]].map(([x,y]) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="#0b2557" stroke="#fff" stroke-width="2"/>`).join("")}${[[120,120],[280,250]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#fff"/>`).join("")}`;
        break;
      }
      case "award": {
        g = `<g transform="translate(${200 + sx / 2} 108)">${Array.from({ length: 24 }, (_, i) => `<line x1="0" y1="-70" x2="0" y2="-${i % 2 ? 84 : 96}" stroke="${W}.35)" stroke-width="2" transform="rotate(${i * 15})"/>`).join("")}
          <path d="M-26 40 L-40 110 L-14 96 L0 118 L6 52 Z M26 40 L40 110 L14 96 L0 118 L-6 52 Z" fill="${W}.4)"/>
          <circle r="54" fill="${W}.2)" stroke="#fff" stroke-width="3"/><circle r="40" fill="none" stroke="${W}.6)" stroke-width="1.5" stroke-dasharray="3 5"/>
          <path d="M0 -24 l7 15 16 2 -12 11 3 16 -14 -8 -14 8 3 -16 -12 -11 16 -2Z" fill="#fff"/></g>`;
        break;
      }
      default: {
        const steps = [0,1,2,3,4].map(i => `<rect x="${60 + i * 58}" y="${200 - (i + 1) * 30}" width="50" height="${(i + 1) * 30}" rx="6" fill="${W}${(.12 + i * .08).toFixed(2)})" stroke="${W}.5)" stroke-width="1.5"/>`).join("");
        g = `${steps}<path d="M70 150 L135 118 L195 92 L250 60 L320 30" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 10"/>
          <g transform="translate(330 32) rotate(${rot})"><path d="M0 -14 L30 0 L0 14 L-30 0 Z" fill="#fff"/><path d="M-16 6 v12 c10 8 22 8 32 0 v-12" fill="none" stroke="#fff" stroke-width="3"/></g>`;
      }
    }
    return `<svg class="art" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs></defs>${grid}${glow}${g}</svg>`;
  }

  /* ---------- state ---------- */
  const CFG = window.SITE_CONFIG || {};
  let DATA = null, CAT = {}, WORK_CATS = [], ui = { cat: "", pa: 0, q: "", newsAll: false };
  const app = document.getElementById("app");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = u => /^https?:\/\//i.test(u || "") ? u : "";
  const isPath = id => /^(https?:|assets\/|data\/|\.\/)/.test(id);
  const imgUrl = (id, w) => isPath(id) ? id : `https://lh3.googleusercontent.com/d/${id}=w${w || 1600}`;
  const imgFallback = id => isPath(id) ? "" : `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
  const fileUrl = id => /^https?:/.test(id) ? id : `https://drive.google.com/file/d/${id}/view`;
  window.__pfImgErr = el => { const f = el.dataset.fb; if (f && el.src !== f) { el.src = f; el.dataset.fb = ""; } else el.remove(); };
  const imgTag = (id, alt, w, extra) => `<img src="${esc(imgUrl(id, w))}" data-fb="${esc(imgFallback(id))}" alt="${esc(alt || "")}" loading="lazy" referrerpolicy="no-referrer" onerror="__pfImgErr(this)"${extra || ""}>`;
  const catOf = k => CAT[k] || { key: k, name: k || "อื่น ๆ", color: "#2563eb", icon: "pd", type: "work" };
  const thDate = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ""); return m ? { d: +m[3], m: TH_MONTH[+m[2] - 1], y: +m[1] + 543 } : null; };
  const thDateText = d => { const x = thDate(d); return x ? `${x.d} ${x.m} ${x.y}` : ""; };

  /* ---------- data loading: cache → API → sample ---------- */
  async function load() {
    try { const c = JSON.parse(localStorage.getItem("pf-cache") || "null"); if (c && c.items) { setData(c); } } catch (e) {}
    let fresh = null, api = String(CFG.API_URL || "").trim();
    if (/^https:\/\/script\.google/.test(api)) {
      try { const r = await fetch(api + (api.includes("?") ? "&" : "?") + "api=1", { redirect: "follow" }); if (r.ok) fresh = await r.json(); } catch (e) {}
    }
    if (!fresh && !DATA) {
      try { fresh = await (await fetch("data/sample.json")).json(); fresh._sample = true; } catch (e) {}
    }
    if (fresh && fresh.items) {
      if (!fresh._sample) try { localStorage.setItem("pf-cache", JSON.stringify(fresh)); } catch (e) {}
      setData(fresh);
    }
    if (!DATA) app.innerHTML = `<div class="wrap" style="padding-block:64px;text-align:center"><h2>โหลดข้อมูลไม่สำเร็จ</h2><p>ตรวจการเชื่อมต่ออินเทอร์เน็ต แล้วลองรีเฟรชหน้าอีกครั้ง</p></div>`;
  }
  let lastSig = "";
  function setData(d) {
    const sig = JSON.stringify(d);
    if (sig === lastSig) return;
    lastSig = sig;
    DATA = d;
    DATA.items = (d.items || []).map(i => Object.assign({ images: [], files: [], tags: [] }, i));
    CAT = {}; (d.categories || []).forEach(c => CAT[c.key] = c);
    WORK_CATS = (d.categories || []).filter(c => (c.type || "work") === "work");
    const openId = ui.openId || (/^#item-(.+)$/.exec(location.hash) || [])[1];
    shell();
    if (openId && DATA.items.some(i => i.id === openId)) openDetail(openId, true);
    heroCanvas();
  }

  const works = () => DATA.items.filter(i => i.type !== "news");
  const news = () => DATA.items.filter(i => i.type === "news").sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const sortedWorks = () => works().sort((a, b) => (+(b.year || 0)) - (+(a.year || 0)) || String(b.created || "").localeCompare(String(a.created || "")));
  function filteredWorks() {
    const q = ui.q.toLowerCase();
    return sortedWorks().filter(w => (!ui.cat || w.cat === ui.cat) && (!ui.pa || w.pa === ui.pa) &&
      (!q || [w.title, w.sub, w.desc, w.level, (w.tags || []).join(" ")].join(" ").toLowerCase().includes(q)));
  }
  function featuredList() {
    let f = DATA.items.filter(w => w.featured);
    if (f.length < 4) f = f.concat(sortedWorks().filter(w => !w.featured && w.status === "live").slice(0, 4 - f.length));
    return f.slice(0, 4);
  }
  const visualFor = w => { const c = catOf(w.cat); return art(c.icon, w.id) + (w.images[0] ? imgTag(w.images[0], "", 1200) : ""); };

  /* ---------- layout ---------- */
  const LEAF = (cls, rot) => `<svg class="leaf ${cls}" viewBox="0 0 220 220" aria-hidden="true" style="--r:${rot}deg">
    <defs><linearGradient id="lg-${cls}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3f8a4f"/><stop offset="1" stop-color="#174d2b"/></linearGradient></defs>
    <g fill="url(#lg-${cls})">
      <path d="M110 214 C 60 170, 20 120, 30 60 C 70 70, 105 110, 110 214 Z"/>
      <path d="M110 214 C 150 160, 205 130, 200 60 C 160 75, 120 120, 110 214 Z"/>
      <path d="M110 214 C 95 150, 90 80, 112 10 C 135 80, 128 150, 110 214 Z"/>
    </g>
    <g fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.6" stroke-linecap="round">
      <path d="M110 210 C 80 160, 55 110, 40 70"/><path d="M110 210 C 140 160, 170 115, 192 70"/><path d="M111 205 C 108 140, 108 80, 112 22"/>
    </g></svg>`;
  const BRUSH = `<svg class="brush" viewBox="0 0 400 400" aria-hidden="true"><defs>
      <filter id="rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="7"/><feDisplacementMap in="SourceGraphic" scale="22"/></filter>
      <radialGradient id="sun" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#ffd25a"/><stop offset="1" stop-color="#f0a915"/></radialGradient></defs>
      <circle cx="200" cy="200" r="168" fill="url(#sun)" filter="url(#rough)"/>
      <path d="M58 250 C 70 300, 120 350, 190 362" fill="none" stroke="#f6c443" stroke-width="10" stroke-linecap="round" filter="url(#rough)" opacity=".7"/></svg>`;
  const DOODLES = `<svg class="doodles" viewBox="0 0 400 400" aria-hidden="true" fill="none" stroke="var(--forest)" stroke-width="4" stroke-linecap="round">
      <g class="rays"><path d="M78 70 l-14 -18"/><path d="M98 58 l-4 -24"/><path d="M118 62 l8 -20"/></g>
      <g class="arrow-d"><path d="M40 300 C 20 250, 30 200, 70 180" stroke-width="3" pathLength="1"/><path d="M58 172 l14 7 -6 15" stroke-width="3"/></g>
      <path class="twinkle" d="M350 120 l0 18 M341 129 l18 0" stroke="var(--gold-ink)" stroke-width="3"/>
      <circle cx="330" cy="330" r="5" fill="var(--forest)" stroke="none"/></svg>`;
  const HEART = `<svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3.1 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.7 0 5.9 3.8 4.4 7.3C19.5 16.4 12 21 12 21z"/></svg>`;

  function titleHtml(s) {
    const lines = esc(s || "แฟ้มผลงาน|[ครูคณิตศาสตร์]").split("|").map(l => l.trim()).filter(Boolean);
    const big = lines.filter(l => !/^\{.*\}$/.test(l)), small = lines.filter(l => /^\{.*\}$/.test(l));
    const fmt = l => l.replace(/\[(.+?)\]/g, '<span class="gold">$1</span>');
    return big.map(fmt).join("<br>") + small.map(l => `<span class="t-sub">${fmt(l.slice(1, -1))}</span>`).join("");
  }
  function secHead(icon, kicker, title, extra) {
    return `<div class="sec-head"><span class="sec-ico">${ic(icon)}</span><div class="sec-t"><span class="kicker">${kicker}</span><h2>${title}</h2></div><span class="dash" aria-hidden="true"></span>${extra || ""}</div>`;
  }

  function shell() {
    const S = DATA.settings || {}, W = works(), N = news();
    const live = W.filter(w => w.status === "live").length;
    const awards = N.filter(n => n.result && n.result !== "เข้าร่วม").length;
    const skills = String(S.skills || "").split(/[,，]/).map(s => s.trim()).filter(Boolean);
    const name = S.name || "ครู";
    const initial = name.replace(/^ครู/, "").charAt(0) || "ค";
    const canva = safeUrl(S.canvaUrl), fb = safeUrl(S.facebook);
    const contacts = [
      S.phone ? ["phone", S.phone, "tel:" + S.phone.replace(/[^\d+]/g, "")] : null,
      S.email ? ["mail", S.email, "mailto:" + S.email] : null,
      S.line ? ["chat", "LINE: " + S.line, ""] : null,
      fb ? ["globe", "Facebook", fb] : null,
      S.school ? ["school", S.school, ""] : null,
      S.office ? ["pin", S.office, ""] : null
    ].filter(Boolean);
    const workCats = WORK_CATS.filter(c => W.some(w => w.cat === c.key));
    app.innerHTML = `
    <nav class="nav"><div class="wrap">
      <a class="logo" href="#top"><span class="logo-mark">${esc(initial)}</span><span class="logo-name">${esc(name)}</span></a>
      <div class="nav-links">${N.length ? `<a href="#news">ความเคลื่อนไหว</a>` : ""}<a href="#featured">ผลงานเด่น</a><a href="#works">ผลงานทั้งหมด</a><a href="#contact">เกี่ยวกับครู</a></div>
      <a class="btn btn-dark btn-sm" href="#contact">ติดต่อครู</a>
    </div></nav>
    ${DATA._sample ? `<div class="wrap"><div class="notice">กำลังแสดงข้อมูลตัวอย่าง · ใส่ลิงก์ Apps Script ในไฟล์ config.js เพื่อเชื่อมกับ Google Sheet</div></div>` : ""}

    <header class="hero" id="top">
      <span class="shade s1" aria-hidden="true"></span><span class="shade s2" aria-hidden="true"></span>
      ${LEAF("l1", -35)}${LEAF("l2", 150)}
      <div class="wrap hero-grid">
        <div class="hero-text">
          <h1 class="title rise">${titleHtml(S.heroTitle)}</h1>
          <p class="tagline rise d1">${esc(S.tagline || "ออกแบบการเรียนรู้ให้มีชีวิต")}${HEART}</p>
          <span class="pill-dark rise d2">เกี่ยวกับครู</span>
          <p class="intro rise d2"><b>${esc(name)}</b> ${esc(S.role || "")}<br>${esc(S.intro || "")}</p>
          <div class="hero-actions rise d3">
            <a class="btn btn-dark" href="#works">ดูผลงานทั้งหมด${ic("arrow")}</a>
            ${canva ? `<a class="btn btn-outline" href="${esc(canva)}" target="_blank" rel="noopener">${ic("ext")}เว็บสื่อการสอน</a>` : ""}
          </div>
        </div>
        <div class="hero-visual">
          <div class="portrait">
            ${BRUSH}
            ${S.avatar ? imgTag(S.avatar, name, 1000, ' class="person"') : `<canvas id="heroCanvas" aria-hidden="true"></canvas>`}
            ${DOODLES}
            <div class="stat-chip c1"><b>${W.length}</b><span>ผลงาน</span></div>
            <div class="stat-chip c2"><b>${awards || live}</b><span>${awards ? "รางวัลและผลงานนักเรียน" : "ใช้งานจริงในโรงเรียน"}</span></div>
          </div>
        </div>
      </div>
    </header>

    <section class="wrap">
      <div class="info-panel" id="contact">
        <div class="info-contact">
          <h3>ติดต่อครู</h3>
          <ul>${contacts.map(([i, t, href]) => `<li><span class="ci">${ic(i)}</span>${href ? `<a href="${esc(href)}"${/^https/.test(href) ? ' target="_blank" rel="noopener"' : ""}>${esc(t)}</a>` : `<span>${esc(t)}</span>`}</li>`).join("")}</ul>
        </div>
        <div class="info-skills">
          <h3>ความถนัด</h3>
          <div class="skill-tiles">${skills.map(s => `<div class="skill"><span class="sk-ico">${ic((SKILL_ICONS.find(([re]) => re.test(s)) || [0, "star"])[1])}</span><span>${esc(s)}</span></div>`).join("")}</div>
        </div>
      </div>
    </section>

    ${N.length ? `<section class="block wrap" id="news">
      ${secHead("award", "LATEST", "ความเคลื่อนไหวล่าสุด")}
      <div class="timeline" id="timeline"></div>
    </section>` : ""}

    <section class="block wrap" id="featured">
      ${secHead("star", "FEATURED", "ผลงานเด่น", `<a class="btn btn-dark btn-sm" href="#works">ดูผลงานทั้งหมด${ic("arrow")}</a>`)}
      <div class="proj-grid" id="feat"></div>
    </section>

    <section class="block wrap" id="categories">
      ${secHead("grid", "CATEGORIES", "หมวดผลงาน")}
      <div class="cats" id="cats"></div>
    </section>

    <section class="block wrap" id="works">
      ${secHead("layers", "ALL WORKS", '<span id="listTitle">ผลงานทั้งหมด</span>')}
      <div class="toolbar">
        <div class="seg" id="paSeg" role="group" aria-label="ด้านตามกรอบ ว PA"><button data-pa="0">ทุกด้าน</button><button data-pa="1">ด้านที่ 1</button><button data-pa="2">ด้านที่ 2</button><button data-pa="3">ด้านที่ 3</button></div>
        <div class="searchbox">${ic("search")}<input id="q" type="search" placeholder="ค้นหา เช่น ม.2, บอร์ดเกม" aria-label="ค้นหาผลงาน"></div>
        <div class="result-note" id="note" aria-live="polite"></div>
      </div>
      <div class="proj-grid" id="grid"></div>
    </section>

    <section class="block wrap" id="pa">
      <div class="pa-panel">
        <div><span class="kicker">ว PA</span><h3>ผลงานตามกรอบการประเมินวิทยฐานะ</h3><p>สัดส่วนผลงานและความเคลื่อนไหวใน 3 ด้าน</p></div>
        <div class="pa-list" id="paList"></div>
      </div>
    </section>

    <footer class="foot">
      ${LEAF("l3", 20)}
      <div class="wrap foot-grid">
        <div class="foot-brand">
          <span class="foot-mark">${esc(initial)}</span>
          <b>${esc(name)}</b><span>${esc(S.role || "")}</span>
          <div class="socials">${[fb ? ["globe", fb, "Facebook"] : null, S.email ? ["mail", "mailto:" + S.email, "อีเมล"] : null, canva ? ["ext", canva, "เว็บสื่อการสอน"] : null].filter(Boolean).map(([i, h, l]) => `<a href="${esc(h)}" aria-label="${l}"${/^https/.test(h) ? ' target="_blank" rel="noopener"' : ""}>${ic(i)}</a>`).join("")}</div>
        </div>
        <div><h4>ลิงก์ด่วน</h4><ul>${N.length ? `<li><a href="#news">ความเคลื่อนไหว</a></li>` : ""}<li><a href="#featured">ผลงานเด่น</a></li><li><a href="#works">ผลงานทั้งหมด</a></li><li><a href="#pa">ผลงานตาม ว PA</a></li><li><a href="#contact">ติดต่อครู</a></li></ul></div>
        <div><h4>หมวดผลงาน</h4><ul>${workCats.map(c => `<li><a href="#works" data-catlink="${esc(c.key)}">${esc(c.name)}</a></li>`).join("")}</ul></div>
        <div><h4>ร่วมงานกับครู</h4><p>${esc(S.cta || "ต้องการสื่อการสอน วิทยากร หรือแลกเปลี่ยนแนวคิดการสอนคณิตศาสตร์ ติดต่อได้เลย")}</p><a class="btn btn-gold" href="#contact">ติดต่อครู${ic("arrow")}</a></div>
      </div>
      <div class="wrap foot-bottom"><span>© ${new Date().getFullYear() + 543} ${esc(name)}${S.school ? " · " + esc(S.school) : ""}</span><span class="formula">${esc(S.footer || "")}</span></div>
    </footer>
    <div id="modalRoot"></div>`;

    const q = document.getElementById("q");
    q.value = ui.q;
    q.addEventListener("input", e => { ui.q = e.target.value.trim(); renderList(); });
    document.getElementById("paSeg").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; ui.pa = +b.dataset.pa; renderList(); });
    document.getElementById("cats").addEventListener("click", e => {
      const b = e.target.closest(".cat"); if (!b) return;
      ui.cat = ui.cat === b.dataset.k ? "" : b.dataset.k; renderList();
      if (ui.cat) document.getElementById("works").scrollIntoView({ block: "start" });
    });
    renderNews(); renderStatic(); renderList();
  }
  function onAppClick(e) {
    const o = e.target.closest("[data-open]"); if (o) return openDetail(o.dataset.open);
    const cl = e.target.closest("[data-catlink]"); if (cl) { ui.cat = cl.dataset.catlink; renderList(); }
    if (e.target.closest("[data-clear]")) { ui.cat = ""; ui.pa = 0; ui.q = ""; document.getElementById("q").value = ""; renderList(); }
    if (e.target.closest("[data-newsall]")) { ui.newsAll = !ui.newsAll; renderNews(); }
  }

  function renderNews() {
    const box = document.getElementById("timeline"); if (!box) return;
    const all = news(), list = ui.newsAll ? all : all.slice(0, 5);
    let lastYear = null, html = "";
    list.forEach(n => {
      const d = thDate(n.date), c = catOf(n.cat), y = d ? d.y : (n.year || "");
      if (y !== lastYear) { html += `<div class="tl-year">${y ? "ปี " + esc(y) : "ไม่ระบุวันที่"}</div>`; lastYear = y; }
      html += `<div class="tl-item">
        <div class="tl-date">${d ? `<b>${d.d}</b><span>${d.m}</span>` : ""}</div>
        <div class="tl-rail"><i></i></div>
        <button class="tl-card" data-open="${esc(n.id)}">
          <div class="thumb">${visualFor(n)}</div>
          <div class="tl-body">
            <div class="tl-badges">${n.result ? `<span class="medal ${medalTone(n.result)}"><i>${ic("award")}</i>${esc(n.result)}</span>` : ""}${n.scope ? `<span class="scope">ระดับ${esc(n.scope)}</span>` : ""}<span class="chip">${esc(c.name)}</span></div>
            <h3>${esc(n.title)}</h3>
            ${n.event ? `<p>${esc(n.event)}</p>` : n.desc ? `<p>${esc(n.desc)}</p>` : ""}
          </div>
        </button>
      </div>`;
    });
    if (all.length > 5) html += `<div class="tl-more"><button class="btn btn-outline" data-newsall>${ui.newsAll ? "แสดงน้อยลง" : `ดูทั้งหมด ${all.length} รายการ`}</button></div>`;
    box.innerHTML = html;
  }

  function projCard(w, meta) {
    const c = catOf(w.cat), nAtt = w.images.length + w.files.length;
    return `<button class="proj" data-open="${esc(w.id)}">
      <div class="thumb">${visualFor(w)}<span class="tag">${ic(c.icon)}${esc(c.name)}</span>${nAtt ? `<span class="count">${ic("image")}${nAtt}</span>` : ""}</div>
      <div class="proj-body"><div class="proj-t"><h3>${esc(w.title)}</h3><span class="sub">${esc(w.sub || w.event || c.name)}</span>${meta || ""}</div><span class="arrow">${ic("arrow")}</span></div>
    </button>`;
  }

  function renderStatic() {
    document.getElementById("feat").innerHTML = featuredList().map(w => projCard(w)).join("");
    const total = DATA.items.length || 1;
    document.getElementById("paList").innerHTML = [1, 2, 3].map(k => {
      const n = DATA.items.filter(w => w.pa === k).length;
      return `<div class="pa-row"><div class="top"><span>ด้านที่ ${k} · ${PA[k].name.replace("ด้าน", "")}</span><b>${n}</b></div><div class="bar"><i style="width:${n / total * 100}%"></i></div></div>`;
    }).join("");
  }

  function renderList() {
    const W = works();
    document.getElementById("cats").innerHTML = WORK_CATS.map(c => {
      const n = W.filter(w => w.cat === c.key).length;
      return `<button class="cat" data-k="${esc(c.key)}" aria-pressed="${ui.cat === c.key}">
        <span class="gicon">${ic(c.icon)}</span><span class="cat-txt"><span class="cat-t">${esc(c.name)}</span><span class="cat-n">${n} ผลงาน</span></span></button>`;
    }).join("");
    document.querySelectorAll("#paSeg button").forEach(b => b.setAttribute("aria-pressed", +b.dataset.pa === ui.pa));
    const list = filteredWorks();
    document.getElementById("listTitle").textContent = ui.cat ? catOf(ui.cat).name : "ผลงานทั้งหมด";
    const parts = [];
    if (ui.pa) parts.push(PA[ui.pa].name);
    if (ui.q) parts.push(`คำค้น “${ui.q}”`);
    document.getElementById("note").innerHTML = `แสดง ${list.length} จาก ${W.length} ผลงาน${parts.length ? " · " + esc(parts.join(" · ")) : ""}${(ui.cat || ui.pa || ui.q) ? ` · <button data-clear>ล้างตัวกรอง</button>` : ""}`;
    const grid = document.getElementById("grid");
    if (!list.length) { grid.innerHTML = `<div class="empty">${ic("search")}<div>${ui.cat && !ui.q && !ui.pa ? "ยังไม่มีผลงานในหมวดนี้" : "ไม่พบผลงานที่ตรงกับตัวกรอง"}</div><button class="btn btn-outline" data-clear>ล้างตัวกรอง</button></div>`; return; }
    grid.innerHTML = list.map(w => {
      const s = STATUS[w.status] || STATUS.live;
      return projCard(w, `<span class="meta"><span class="status" style="--s:${s.c}">${s.t}</span>${w.level ? `<span>${esc(w.level)}</span>` : ""}</span>`);
    }).join("");
  }

  /* ---------- Hero canvas: rotating icosahedron + drifting math glyphs ---------- */
  function heroCanvas() {
    const cv = document.getElementById("heroCanvas"); if (!cv || !cv.getContext) return;
    const ctx = cv.getContext("2d");
    const t = (1 + Math.sqrt(5)) / 2;
    const V = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
    const E = []; for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) { const d = V[i].reduce((s, v, k) => s + (v - V[j][k]) ** 2, 0); if (Math.abs(d - 4) < .01) E.push([i, j]); }
    const glyphs = ["π", "√2", "Σ", "Δ", "sin θ", "x²", "∞", "%", "∫", "a²+b²", "θ", "÷"].map((s, i) => ({ s, a: i / 12 * Math.PI * 2, r: .62 + (i % 3) * .1, sp: .00012 + (i % 4) * .00004, y: (i % 5 - 2) * .06, z: 12 + (i % 3) * 5 }));
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, visible = true, raf = 0;
    function size() { const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function frame(ms) {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * .22, ay = ms * .00025, ax = .5 + Math.sin(ms * .0002) * .2;
      // orbit rings
      ctx.lineWidth = 1;
      [1.6, 2.15].forEach((k, i) => { ctx.strokeStyle = `rgba(15,59,42,${.35 - i * .12})`; ctx.setLineDash(i ? [2, 8] : []); ctx.beginPath(); ctx.ellipse(cx, cy, R * k, R * k * .38, -.35, 0, Math.PI * 2); ctx.stroke(); });
      ctx.setLineDash([]);
      // glow
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.8); gr.addColorStop(0, "rgba(255,236,170,.55)"); gr.addColorStop(1, "rgba(255,236,170,0)"); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
      // project
      const P = V.map(([x, y, z]) => { let x1 = x * Math.cos(ay) - z * Math.sin(ay), z1 = x * Math.sin(ay) + z * Math.cos(ay); let y1 = y * Math.cos(ax) - z1 * Math.sin(ax), z2 = y * Math.sin(ax) + z1 * Math.cos(ax); const s = R / 1.9 * (3.2 / (3.2 + z2 * .35)); return [cx + x1 * s, cy + y1 * s, z2]; });
      E.forEach(([i, j]) => { const d = (P[i][2] + P[j][2]) / 2; ctx.strokeStyle = `rgba(15,59,42,${.3 + (d + 1.9) / 3.8 * .65})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke(); });
      P.forEach(p => { const k = (p[2] + 1.9) / 3.8; ctx.fillStyle = `rgba(15,59,42,${.5 + k * .5})`; ctx.beginPath(); ctx.arc(p[0], p[1], 2 + k * 2.5, 0, Math.PI * 2); ctx.fill(); });
      // glyphs
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      glyphs.forEach(g => { const a = g.a + ms * g.sp * (reduce ? 0 : 1); const x = cx + Math.cos(a) * w * g.r * .5, y = cy + Math.sin(a) * h * .26 + g.y * h; const depth = (Math.sin(a) + 1) / 2;
        ctx.font = `italic ${g.z + depth * 8}px "Times New Roman", serif`; ctx.fillStyle = `rgba(15,59,42,${.3 + depth * .55})`; ctx.fillText(g.s, x, y); });
    }
    function loop(ms) { if (visible) frame(ms); raf = requestAnimationFrame(loop); }
    size(); frame(4000);
    window.addEventListener("resize", () => { size(); frame(performance.now()); });
    if (!reduce) {
      if ("IntersectionObserver" in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(cv);
      raf = requestAnimationFrame(loop);
    }
  }

  /* ---------- detail window ---------- */
  let lastFocus = null;
  function openDetail(id, fromHash) {
    const w = DATA.items.find(x => x.id === id); if (!w) return;
    ui.openId = id;
    lastFocus = fromHash ? null : document.activeElement;
    try { history.replaceState(null, "", "#item-" + id); } catch (e) {}
    const c = catOf(w.cat), s = STATUS[w.status] || STATUS.live, imgs = w.images, link = safeUrl(w.link), isNews = w.type === "news";
    const facts = [
      isNews && w.date ? ["calendar", "วันที่", thDateText(w.date)] : null,
      isNews && w.event ? ["flag", "งาน/รายการ", w.event] : null,
      isNews && w.scope ? ["layers", "ระดับ", w.scope] : null,
      w.students ? ["users", "นักเรียน", w.students] : null,
      !isNews && w.level ? ["users", "ระดับชั้น", w.level] : null,
      !isNews && w.year ? ["calendar", "ปีการศึกษา", w.year] : null,
      PA[w.pa] ? ["grid", "กรอบ ว PA", PA[w.pa].name] : null
    ].filter(Boolean);
    document.getElementById("modalRoot").innerHTML = `<div class="overlay" id="ov"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(w.title)}">
      <div class="modal-hero" style="--c:${esc(c.color)}">${art(c.icon, w.id)}${imgs.length ? imgTag(imgs[0], w.title, 1600, ' id="gMain"') : ""}
        <button class="icon-btn close" data-close aria-label="ปิด">${ic("x")}</button></div>
      <div class="modal-body">
        ${imgs.length > 1 ? `<div class="thumbs" id="gThumbs">${imgs.map((im, i) => `<button data-i="${i}" aria-pressed="${i === 0}" aria-label="ภาพที่ ${i + 1}">${imgTag(im, "", 300)}</button>`).join("")}</div>` : ""}
        <div class="d-title"><div class="tl-badges">${w.result ? `<span class="medal ${medalTone(w.result)}"><i>${ic("award")}</i>${esc(w.result)}</span>` : ""}<span class="chip">${esc(c.name)}</span></div>
          <h2>${esc(w.title)}</h2>${w.sub ? `<span class="sub">${esc(w.sub)}</span>` : ""}</div>
        <div class="detail-grid">
          <div style="display:grid;gap:14px;align-content:start;min-width:0">
            <p>${esc(w.desc) || (isNews ? "" : "ยังไม่มีรายละเอียด")}</p>
            ${w.tags.length ? `<div class="chips">${w.tags.map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>` : ""}
            ${w.files.length ? `<div class="files">${w.files.map(f => `<a class="file" href="${esc(fileUrl(f.id))}" target="_blank" rel="noopener">${ic("pdf")}<span style="min-width:0;overflow-wrap:anywhere">${esc(f.name || "ไฟล์แนบ")}</span></a>`).join("")}</div>` : ""}
          </div>
          <div class="facts">
            ${facts.map(([i, l, v]) => `<div class="fact">${ic(i)}<span><small>${l}</small>${esc(v)}</span></div>`).join("")}
            ${!isNews ? `<div class="fact"><span class="status" style="--s:${s.c}">${s.t}</span></div>` : ""}
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <div class="left"><button class="btn btn-ghost" id="shareBtn">${ic("share")}แชร์</button></div>
        ${link ? `<a class="btn btn-primary" href="${esc(link)}" target="_blank" rel="noopener">${ic("ext")}เปิดลิงก์</a>` : `<button class="btn btn-ghost" data-close>ปิด</button>`}
      </div></div></div>`;
    document.body.classList.add("locked");
    const ov = document.getElementById("ov");
    ov.addEventListener("mousedown", e => { if (e.target === ov) closeDetail(); });
    ov.querySelectorAll("[data-close]").forEach(b => b.onclick = closeDetail);
    const th = ov.querySelector("#gThumbs");
    th && th.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      const im = imgs[+b.dataset.i], main = ov.querySelector("#gMain");
      if (main) { main.dataset.fb = imgFallback(im); main.src = imgUrl(im, 1600); }
      th.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
    });
    ov.querySelector("#shareBtn").onclick = async () => {
      const url = location.href.split("#")[0] + "#item-" + w.id;
      try { if (navigator.share) { await navigator.share({ title: w.title, url }); return; } } catch (e) { return; }
      try { await navigator.clipboard.writeText(url); toast("คัดลอกลิงก์แล้ว นำไปวางใน LINE หรือ Facebook ได้เลย"); }
      catch (e) { prompt("คัดลอกลิงก์นี้", url); }
    };
    ov.querySelector("[data-close]").focus();
  }
  function closeDetail() {
    document.getElementById("modalRoot").innerHTML = "";
    document.body.classList.remove("locked");
    ui.openId = null;
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  document.addEventListener("keydown", e => { if (e.key === "Escape" && document.getElementById("ov")) closeDetail(); });
  window.addEventListener("hashchange", () => { const m = /^#item-(.+)$/.exec(location.hash); if (m && DATA && m[1] !== ui.openId) openDetail(m[1], true); });

  let toastT;
  function toast(msg) {
    let t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200);
  }

  app.addEventListener("click", onAppClick);
  load();
})();
