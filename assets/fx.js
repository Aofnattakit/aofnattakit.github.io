/*
 * แฟ้มผลงานครู — เอฟเฟกต์เคลื่อนไหว (ไฟล์เสริม)
 * ----------------------------------------------------------
 * 1) พื้นหลังมีชีวิต: สัญลักษณ์คณิตศาสตร์และรูปทรงลอยช้า ๆ ขยับตามเมาส์/นิ้ว
 * 2) กดปุ่มหรือการ์ด: คลื่นวงน้ำ + ประกายสีทองและสัญลักษณ์คณิตกระจายออก
 * 3) การ์ดเอียงตามเมาส์ + แสงวาบ, ปุ่มหลักดูดเข้าหาเมาส์เล็กน้อย
 * 4) เลื่อนหน้าแล้วเนื้อหาค่อย ๆ ปรากฏ, ตัวเลขนับขึ้น, แถบความคืบหน้าด้านบน
 *
 * ปิดเอฟเฟกต์ทั้งหมด: ลบบรรทัด <script src="assets/fx.js"> ใน index.html
 * ปรับความแรง: แก้ค่าใน FX ด้านล่าง
 * ผู้ใช้ที่ตั้งค่าเครื่องให้ "ลดการเคลื่อนไหว" จะไม่เห็นภาพเคลื่อนไหว (ยังใช้งานเว็บได้ปกติ)
 */
(function () {
  "use strict";
  const FX = {
    bgDensity: 1,          // จำนวนสัญลักษณ์บนพื้นหลัง (0 = ปิด, 1 = ปกติ, 1.5 = มากขึ้น)
    bgSpeed: 1,            // ความเร็วการลอย
    burst: true,           // ประกายตอนกด
    tilt: true,            // การ์ดเอียงตามเมาส์
    reveal: true           // เนื้อหาค่อย ๆ ปรากฏตอนเลื่อน
  };
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  const root = document.documentElement;
  root.classList.add("fx");
  if (reduce) root.classList.add("fx-reduce");

  const FOREST = [15, 59, 42], GOLD = [242, 178, 27], GOLD2 = [255, 210, 90];
  const GLYPHS = ["π", "Σ", "√", "∞", "%", "θ", "Δ", "x²", "÷", "×", "+", "=", "∫", "a²+b²", "sin", "½"];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  /* ======================== 1) พื้นหลังมีชีวิต ======================== */
  const bg = document.createElement("canvas");
  bg.className = "fx-bg"; bg.setAttribute("aria-hidden", "true");
  document.body.prepend(bg);
  const bctx = bg.getContext("2d");
  let W = 0, H = 0, DPR = 1, items = [], mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5, pointer = { x: -999, y: -999 };

  function makeItem(spawnBottom) {
    const kind = Math.random() < 0.55 ? "glyph" : pick(["tri", "circle", "square", "plus", "dots"]);
    const depth = rnd(0.35, 1);                       // ไกล-ใกล้ (ใช้ทำ parallax และความจาง)
    return {
      kind, depth,
      g: pick(GLYPHS),
      x: rnd(0, W), y: spawnBottom ? H + rnd(20, 120) : rnd(0, H),
      vx: rnd(-0.08, 0.08), vy: -rnd(0.12, 0.38) * depth,
      r: rnd(10, 26) * (0.6 + depth * 0.7),
      rot: rnd(0, Math.PI * 2), vr: rnd(-0.004, 0.004),
      color: Math.random() < 0.62 ? FOREST : GOLD,
      a: rnd(0.07, 0.16) * (0.5 + depth * 0.6),
      ox: 0, oy: 0
    };
  }
  function sizeBg() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    bg.width = W * DPR; bg.height = H * DPR;
    bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const target = Math.round(Math.min(46, (W * H) / 30000) * FX.bgDensity);
    while (items.length < target) items.push(makeItem(false));
    items.length = target;
  }
  function drawItem(p) {
    bctx.save();
    bctx.translate(p.x + p.ox, p.y + p.oy);
    bctx.rotate(p.rot);
    bctx.globalAlpha = p.a;
    bctx.strokeStyle = bctx.fillStyle = rgba(p.color, 1);
    bctx.lineWidth = 1.6;
    const r = p.r;
    switch (p.kind) {
      case "glyph":
        bctx.font = `italic ${Math.round(r * 1.25)}px "Times New Roman", serif`;
        bctx.textAlign = "center"; bctx.textBaseline = "middle";
        bctx.fillText(p.g, 0, 0); break;
      case "tri":
        bctx.beginPath(); bctx.moveTo(0, -r); bctx.lineTo(r * 0.87, r * 0.5); bctx.lineTo(-r * 0.87, r * 0.5); bctx.closePath(); bctx.stroke(); break;
      case "circle":
        bctx.beginPath(); bctx.arc(0, 0, r * 0.7, 0, Math.PI * 2); bctx.stroke();
        bctx.beginPath(); bctx.moveTo(0, 0); bctx.lineTo(r * 0.7, 0); bctx.stroke(); break;
      case "square":
        bctx.strokeRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2);
        bctx.strokeRect(-r * 0.6, r * 0.6 - 8, 8, 8); break;
      case "plus":
        bctx.lineWidth = 2.4; bctx.beginPath(); bctx.moveTo(-r * 0.5, 0); bctx.lineTo(r * 0.5, 0); bctx.moveTo(0, -r * 0.5); bctx.lineTo(0, r * 0.5); bctx.stroke(); break;
      default:
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { bctx.beginPath(); bctx.arc((i - 1) * r * 0.45, (j - 1) * r * 0.45, 1.8, 0, Math.PI * 2); bctx.fill(); }
    }
    bctx.restore();
  }
  let bgRaf = 0, bgVisible = true;
  function bgFrame() {
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
    bctx.clearRect(0, 0, W, H);
    for (const p of items) {
      p.x += p.vx * FX.bgSpeed; p.y += p.vy * FX.bgSpeed; p.rot += p.vr * FX.bgSpeed;
      // parallax ตามเมาส์: ชิ้นที่ "ใกล้" ขยับมากกว่า
      const px = (mx - 0.5) * 40 * p.depth, py = (my - 0.5) * 30 * p.depth;
      // หลบนิ้ว/เมาส์เบา ๆ
      const dx = p.x + px - pointer.x, dy = p.y + py - pointer.y, d2 = dx * dx + dy * dy;
      if (d2 < 120 * 120) { const f = (1 - Math.sqrt(d2) / 120) * 3; p.vx += (dx / 120) * 0.02 * f; p.vy += (dy / 120) * 0.02 * f; }
      p.vx *= 0.995; p.vy = p.vy * 0.995 + (-0.25 * p.depth) * 0.005;
      p.ox = px; p.oy = py;
      if (p.y < -60 || p.x < -80 || p.x > W + 80) Object.assign(p, makeItem(true));
      drawItem(p);
    }
    bgRaf = requestAnimationFrame(bgFrame);
  }
  if (FX.bgDensity > 0) {
    sizeBg();
    if (reduce) { for (const p of items) drawItem(p); }      // ภาพนิ่งสำหรับผู้ที่ปิดการเคลื่อนไหว
    else bgRaf = requestAnimationFrame(bgFrame);
    let rT; window.addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(() => { sizeBg(); if (reduce) { bctx.clearRect(0, 0, W, H); items.forEach(drawItem); } }, 150); });
    document.addEventListener("visibilitychange", () => {
      if (reduce) return;
      if (document.hidden) { cancelAnimationFrame(bgRaf); bgVisible = false; }
      else if (!bgVisible) { bgVisible = true; bgRaf = requestAnimationFrame(bgFrame); }
    });
  }
  window.addEventListener("pointermove", e => {
    tmx = e.clientX / (W || 1); tmy = e.clientY / (H || 1);
    pointer.x = e.clientX; pointer.y = e.clientY;
  }, { passive: true });
  document.addEventListener("pointerleave", () => { pointer.x = pointer.y = -999; });

  /* ======================== 2) ประกายตอนกด ======================== */
  const fxc = document.createElement("canvas");
  fxc.className = "fx-burst"; fxc.setAttribute("aria-hidden", "true");
  document.body.appendChild(fxc);
  const fctx = fxc.getContext("2d");
  let sparks = [], burstRaf = 0;
  function sizeFx() { const d = Math.min(2, window.devicePixelRatio || 1); fxc.width = innerWidth * d; fxc.height = innerHeight * d; fctx.setTransform(d, 0, 0, d, 0, 0); }
  sizeFx(); window.addEventListener("resize", sizeFx);
  function burst(x, y, big) {
    const n = big ? 22 : 10;
    for (let i = 0; i < n; i++) {
      const ang = (Math.PI * 2 * i) / n + rnd(-0.3, 0.3), sp = rnd(2, big ? 7 : 4.5);
      const glyph = Math.random() < (big ? 0.35 : 0.2);
      sparks.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - (big ? 1.5 : 0.5), life: 1, decay: rnd(0.018, 0.032),
        size: glyph ? rnd(13, 19) : rnd(2.5, 5), glyph: glyph ? pick(GLYPHS.slice(0, 13)) : null, color: Math.random() < 0.75 ? (Math.random() < 0.5 ? GOLD : GOLD2) : FOREST,
        rot: rnd(0, 6), vr: rnd(-0.2, 0.2), star: !glyph && Math.random() < 0.4 });
    }
    sparks.push({ ring: true, x, y, r: 4, life: 1, decay: 0.045, big });
    if (!burstRaf) burstRaf = requestAnimationFrame(burstFrame);
  }
  function star(c, r) { c.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = i % 2 ? r * 0.4 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); }
  function burstFrame() {
    fctx.clearRect(0, 0, innerWidth, innerHeight);
    sparks = sparks.filter(s => s.life > 0);
    for (const s of sparks) {
      s.life -= s.decay;
      if (s.ring) {
        s.r += s.big ? 4.2 : 3;
        fctx.strokeStyle = rgba(GOLD, Math.max(0, s.life) * 0.7); fctx.lineWidth = 2.5;
        fctx.beginPath(); fctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); fctx.stroke();
        continue;
      }
      s.vy += 0.16; s.vx *= 0.97; s.x += s.vx; s.y += s.vy; s.rot += s.vr;
      fctx.save(); fctx.translate(s.x, s.y); fctx.rotate(s.rot); fctx.globalAlpha = Math.max(0, s.life);
      fctx.fillStyle = rgba(s.color, 1);
      if (s.glyph) { fctx.font = `italic 700 ${s.size}px "Times New Roman", serif`; fctx.textAlign = "center"; fctx.textBaseline = "middle"; fctx.fillText(s.glyph, 0, 0); }
      else if (s.star) star(fctx, s.size * 1.4);
      else { fctx.beginPath(); fctx.arc(0, 0, s.size, 0, Math.PI * 2); fctx.fill(); }
      fctx.restore();
    }
    burstRaf = sparks.length ? requestAnimationFrame(burstFrame) : 0;
    if (!sparks.length) fctx.clearRect(0, 0, innerWidth, innerHeight);
  }

  const PRESSABLE = ".btn, .proj, .cat, .tl-card, .seg button, .icon-btn, .socials a, .nav-links a, .logo, .thumbs button";
  document.addEventListener("pointerdown", e => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const el = e.target.closest(PRESSABLE);
    if (el) {
      // คลื่นวงน้ำในปุ่ม
      const r = el.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.2;
      const rip = document.createElement("span");
      rip.className = "fx-ripple";
      rip.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      el.classList.add("fx-host"); el.appendChild(rip);
      setTimeout(() => rip.remove(), 700);
    }
    if (FX.burst && !reduce) burst(e.clientX, e.clientY, !!(el && el.matches(".btn, .proj, .cat, .tl-card")));
  }, { passive: true });

  /* ======================== 3) การ์ดเอียง + ปุ่มดูดเข้าหาเมาส์ ======================== */
  if (FX.tilt && finePointer && !reduce) {
    const TILT = ".proj, .tl-card, .cat, .info-panel";
    let cur = null;
    document.addEventListener("pointermove", e => {
      const el = e.target.closest(TILT);
      if (cur && cur !== el) { cur.style.transform = ""; cur.classList.remove("fx-tilting"); cur = null; }
      if (!el) return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      const k = el.matches(".info-panel") ? 2.5 : el.matches(".cat") ? 8 : 6;
      el.style.setProperty("--mx", (x * 100).toFixed(1) + "%"); el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      el.style.transform = `perspective(900px) rotateX(${((0.5 - y) * k).toFixed(2)}deg) rotateY(${((x - 0.5) * k).toFixed(2)}deg) translateY(-4px)`;
      el.classList.add("fx-tilting"); cur = el;
    }, { passive: true });
    document.addEventListener("pointerleave", () => { if (cur) { cur.style.transform = ""; cur.classList.remove("fx-tilting"); cur = null; } });

    // ปุ่มหลักขยับเข้าหาเมาส์
    document.addEventListener("pointermove", e => {
      document.querySelectorAll(".hero-actions .btn, .foot .btn-gold, .nav .btn").forEach(b => {
        const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy);
        b.style.translate = d < 110 ? `${(dx * 0.18).toFixed(1)}px ${(dy * 0.25).toFixed(1)}px` : "";
      });
      // รูปครูขยับตามเมาส์เล็กน้อย (มิติลึก)
      const p = document.querySelector(".portrait");
      if (p) {
        const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
        p.style.setProperty("--px", (nx * 14).toFixed(1) + "px"); p.style.setProperty("--py", (ny * 10).toFixed(1) + "px");
      }
    }, { passive: true });
  }

  /* ======================== 4) เลื่อนหน้าแล้วปรากฏ + ตัวเลขนับขึ้น + แถบความคืบหน้า ======================== */
  const bar = document.createElement("div");
  bar.className = "fx-progress"; bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const io = ("IntersectionObserver" in window) ? new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target; io.unobserve(el);
      el.classList.add("in");
      if (el.classList.contains("rv")) setTimeout(() => el.classList.remove("rv"), 900 + (parseInt(el.style.getPropertyValue("--d"), 10) || 0));
      if (el.matches(".stat-chip b, .pa-row b")) countUp(el);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }) : null;

  function countUp(el) {
    const end = parseInt(el.textContent, 10);
    if (!isFinite(end) || end <= 0 || reduce) return;
    const t0 = performance.now(), dur = 1100;
    const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(end * e); if (k < 1) requestAnimationFrame(step); };
    el.textContent = "0"; requestAnimationFrame(step);
  }

  const REVEAL = ".info-panel, .sec-head, .proj, .cat, .tl-item, .pa-panel, .foot-grid > div, .empty";
  function scan(scope) {
    if (!io) return;
    if (FX.reveal && !reduce) {
      const groups = new Map();
      scope.querySelectorAll(REVEAL).forEach(el => {
        if (el.dataset.fx) return;
        el.dataset.fx = "1";
        const parent = el.parentElement, i = groups.get(parent) || 0;
        groups.set(parent, i + 1);
        el.style.setProperty("--d", Math.min(i, 8) * 70 + "ms");
        el.classList.add("rv");
        io.observe(el);
      });
    }
    scope.querySelectorAll(".stat-chip b, .pa-row b").forEach(el => { if (!el.dataset.fxn) { el.dataset.fxn = "1"; io.observe(el); } });
  }
  const app = document.getElementById("app");
  if (app) {
    scan(app);
    new MutationObserver(muts => { for (const m of muts) m.addedNodes.forEach(n => { if (n.nodeType === 1) scan(n.parentElement || n); }); })
      .observe(app, { childList: true, subtree: true });
  }
  // กันเหนียว: ถ้าเลื่อนเร็วมากหรือพิมพ์หน้า ให้แสดงทุกอย่าง
  addEventListener("beforeprint", () => document.querySelectorAll(".rv").forEach(el => el.classList.add("in")));
})();
