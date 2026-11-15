// Claude: màn mở đầu GlassBox Ink (15/11/2026), học nhịp từ video mẫu anh gửi nhưng dùng màu và logo của GlassBox:
// 1) vệt sơn chéo hai tông tím quét phủ màn  2) cọ bay chéo, xoá vệt thành nền tím mượt
// 3) sơn trắng bắn và viết tay "GlassBox Ink"  4) nền co lại thành ô logo, nét chữ ký trắng tự vẽ  5) logo bay về thanh trên.
// Khoảng 3 giây; bấm hoặc gõ phím để bỏ qua. Trả về Promise xong khi trang đã lộ ra.
window.GBIntro = function run(onReveal) {
  const host = document.getElementById('intro');
  const cv = document.getElementById('introCanvas');
  if (!host || !cv) { onReveal(); return; }
  const ctx = cv.getContext('2d');
  const dpr = Math.min(2, devicePixelRatio || 1);
  const W = innerWidth, H = innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const PAPER = '#F7F6F2', P1 = '#5B3FC4', P2 = '#7A5CF0', P3 = '#3F25B0';
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const span = (t, a, b) => clamp((t - a) / (b - a));
  const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eo = x => 1 - Math.pow(1 - x, 3);
  const lerp = (a, b, x) => a + (b - a) * x;

  // hướng chéo đi lên bên phải (như video mẫu)
  const ang = -Math.PI / 4.2, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const cx = W / 2, cy = H / 2;
  const corners = [[0, 0], [W, 0], [0, H], [W, H]];
  const projN = corners.map(([x, y]) => (x - cx) * nx + (y - cy) * ny);
  const projD = corners.map(([x, y]) => (x - cx) * dx + (y - cy) * dy);
  const nMin = Math.min(...projN), nMax = Math.max(...projN);
  const dMin = Math.min(...projD) - 80, dMax = Math.max(...projD) + 80;
  const diag = Math.hypot(W, H);
  const at = (s, n) => [cx + dx * s + nx * n, cy + dy * s + ny * n];

  // 1) dải sơn
  const BW = Math.max(70, diag / 7);
  const bands = [];
  for (let n = nMin - BW * .3, i = 0; n <= nMax + BW * .5; n += BW * .82, i++) {
    bands.push({ n, w: BW * (i % 2 ? .95 : 1.1), c: i % 2 ? P2 : P1, delay: (i % 3) * .05 + i * .025, rev: i % 2 === 1 });
  }
  // nền tím mượt (đích của cọ)
  const smooth = ctx.createLinearGradient(0, 0, W, H);
  smooth.addColorStop(0, '#8C6CF6'); smooth.addColorStop(.5, '#6A4BDC'); smooth.addColorStop(1, '#4A2FB8');

  // 2) các lượt cọ: phủ đủ bề ngang theo pháp tuyến
  const PW = BW * 2.7;
  const passes = [];
  for (let n = nMin + PW * .35, i = 0; n <= nMax + PW * .2; n += PW * .78, i++) passes.push({ n, rev: i % 2 === 1 });

  // 3) chữ viết tay + vết sơn bắn (cố định ngẫu nhiên)
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const fontPx = Math.round(Math.min(W * .13, H * .2, 118));
  const font = `700 ${fontPx}px "Dancing Script", "Segoe Script", cursive`;
  const word = 'GlassBox Ink';
  let tw = 0, tx = 0;
  const ty = cy + fontPx * .32;
  function measure() { ctx.font = font; tw = ctx.measureText(word).width; tx = cx - tw / 2; }
  const drops = Array.from({ length: 90 }, () => ({
    u: rnd(), oy: (rnd() - .5) * fontPx * 2.2, r: 1.5 + rnd() * rnd() * fontPx * .16, life: .2 + rnd() * .45,
  }));

  // 4) logo
  const S = Math.min(W, H) * .2, R = S * .25;
  const sig = new Path2D('M11 30.5c2.2-9 4.6-14 6.6-11.2 1.7 2.4-.2 11.6 2.6 10.3 2.4-1.1 3.2-6.7 5.6-5.2 2 1.3 1.6 4.6 4 3.6 1.7-.7 2.7-2.6 4.6-3.2 1-.3 1.8.1 2.6.6');
  const navLogo = document.querySelector('.nav .brand .logo');
  const nr = navLogo ? navLogo.getBoundingClientRect() : { left: 16, top: 14, width: 36, height: 36 };

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  }
  // Cọ vẽ có khối: đầu lông giọt nước ướt màu, khâu kim loại có ngấn, cán vàng bóng thuôn dần, đổ bóng.
  // Toạ độ riêng: ngòi ở gốc (0,0), thân kéo dài về +x tới 300.
  function brush(x, y, a, sc) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(sc, sc);
    ctx.shadowColor = 'rgba(25,10,70,.35)'; ctx.shadowBlur = 16; ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 12;
    // cán
    let g = ctx.createLinearGradient(0, -12, 0, 12);
    g.addColorStop(0, '#9C6400'); g.addColorStop(.18, '#F2BC2C'); g.addColorStop(.36, '#FFF0B3');
    g.addColorStop(.55, '#F5B800'); g.addColorStop(1, '#7E5000');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(110, -10);
    ctx.bezierCurveTo(165, -13, 235, -9, 300, -5.5); ctx.quadraticCurveTo(309, 0, 300, 5.5);
    ctx.bezierCurveTo(235, 9, 165, 13, 110, 10); ctx.closePath(); ctx.fill();
    ctx.shadowColor = 'transparent';
    // khâu kim loại
    g = ctx.createLinearGradient(0, -12, 0, 12);
    g.addColorStop(0, '#7C828C'); g.addColorStop(.22, '#F5F7FA'); g.addColorStop(.5, '#AEB4BE');
    g.addColorStop(.72, '#E8EBF0'); g.addColorStop(1, '#646A73');
    ctx.fillStyle = g; rr(66, -12, 46, 24, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(40,40,50,.28)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(78, -12); ctx.lineTo(78, 12); ctx.moveTo(84, -12); ctx.lineTo(84, 12); ctx.stroke();
    // đầu lông
    g = ctx.createLinearGradient(0, -14, 0, 14);
    g.addColorStop(0, '#7A1238'); g.addColorStop(.25, '#FF8FB1'); g.addColorStop(.5, '#E5487D'); g.addColorStop(1, '#8E1A45');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-2, 1);
    ctx.bezierCurveTo(10, -6, 30, -15, 68, -11); ctx.lineTo(68, 11);
    ctx.bezierCurveTo(32, 15, 12, 8, -2, 1); ctx.closePath(); ctx.fill();
    // vệt ướt và sợi lông
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(14, -4); ctx.quadraticCurveTo(36, -9, 60, -8); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,10,40,.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, 3); ctx.quadraticCurveTo(40, 6, 64, 5); ctx.moveTo(26, -1); ctx.quadraticCurveTo(44, 0, 64, 0); ctx.stroke();
    // vệt sáng dọc cán
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.moveTo(120, -6); ctx.bezierCurveTo(170, -8.5, 230, -6, 290, -3.5); ctx.lineTo(290, -2); ctx.bezierCurveTo(230, -4.2, 170, -6, 120, -4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  const T = { bandEnd: .55, pass0: .42, passEnd: 1.15, wr0: 1.12, wrEnd: 1.8, col0: 1.85, col1: 2.3, sig0: 2.15, sig1: 2.55, fly0: 2.6, fly1: 3.05 };
  let t0 = null, finished = false, revealed = false;
  // ?introAt=1.5 giữ nguyên hình ở giây 1,5 (để soát từng nhịp)
  const q = new URLSearchParams(location.search).get('introAt');
  const FREEZE = q !== null ? parseFloat(q) : null;

  function frame(ts) {
    if (finished) return;
    if (t0 === null) t0 = ts;
    const t = FREEZE !== null ? FREEZE : (ts - t0) / 1000;

    // nền
    ctx.globalAlpha = 1;
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);

    if (t < T.col0) {
      // 1) dải sơn chéo
      ctx.lineCap = 'round';
      for (const b of bands) {
        const p = eo(span(t, b.delay, b.delay + .32));
        if (p <= 0) continue;
        const s0 = b.rev ? dMax : dMin, s1 = b.rev ? dMax - (dMax - dMin) * p : dMin + (dMax - dMin) * p;
        const [x0, y0] = at(s0, b.n), [x1, y1] = at(s1, b.n);
        ctx.strokeStyle = b.c; ctx.lineWidth = b.w;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
      // 2) cọ quét thành nền mượt
      const pp = span(t, T.pass0, T.passEnd) * passes.length;
      let head = null;
      ctx.strokeStyle = smooth; ctx.lineWidth = PW;
      passes.forEach((ps, i) => {
        const p = eio(clamp(pp - i));
        if (p <= 0) return;
        const a = ps.rev ? dMax : dMin, b = lerp(a, ps.rev ? dMin : dMax, p);
        const [x0, y0] = at(a, ps.n), [x1, y1] = at(b, ps.n);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        if (p < 1) head = { x: x1, y: y1, rev: ps.rev };
      });
      if (pp >= passes.length) { ctx.fillStyle = smooth; ctx.fillRect(0, 0, W, H); }
      if (head) {
        const travel = head.rev ? ang + Math.PI : ang;
        brush(head.x, head.y, travel + Math.PI + .5 + .07 * Math.sin(t * 14), Math.max(.85, Math.min(W, H) * .52 / 300));
      }

      // 3) sơn trắng bắn rồi viết tay chữ
      const wp = span(t, T.wr0, T.wrEnd);
      if (wp > 0) {
        const edge = tx + tw * eio(wp);
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, edge + 4, H); ctx.clip();
        ctx.font = font; ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic';
        ctx.shadowColor = 'rgba(40,20,110,.25)'; ctx.shadowBlur = 12;
        ctx.fillText(word, tx, ty);
        ctx.restore();
        ctx.fillStyle = '#fff';
        for (const d of drops) {
          const born = d.u * .85;
          const age = (wp - born) / d.life;
          if (age <= 0 || age >= 1) continue;
          const x = tx + tw * d.u + (age * 18), y = cy + d.oy * (.4 + age);
          ctx.globalAlpha = 1 - age;
          ctx.beginPath(); ctx.arc(x, y, d.r * (1 - age * .5), 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    } else {
      // 4) nền tím co lại thành ô logo, chữ cuộn vào
      const c = eio(span(t, T.col0, T.col1));
      const w = lerp(W + 40, S, c), h = lerp(H + 40, S, c), r = lerp(0, R, c);
      let x = cx - w / 2, y = cy - h / 2;
      // 5) bay về logo trên thanh trên
      const f = eio(span(t, T.fly0, T.fly1));
      let size = S, lx = cx - S / 2, ly = cy - S / 2;
      if (f > 0) {
        size = lerp(S, nr.width, f); lx = lerp(cx - S / 2, nr.left, f); ly = lerp(cy - S / 2, nr.top, f);
        ctx.clearRect(0, 0, W, H);
        ctx.globalAlpha = 1 - f; ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
        if (!revealed) { revealed = true; onReveal(); }
      }
      const rr0 = f > 0 ? size * .25 : r;
      if (f > 0) { x = lx; y = ly; }
      rr(x, y, f > 0 ? size : w, f > 0 ? size : h, rr0);
      ctx.fillStyle = smooth; ctx.fill();
      ctx.globalAlpha = f > 0 ? 1 : c; ctx.fillStyle = P1; ctx.fill(); ctx.globalAlpha = 1;
      // chữ trắng co lại và mờ dần vào giữa
      const k = 1 - c;
      if (k > .02) {
        ctx.save();
        ctx.globalAlpha = k;
        ctx.translate(cx, cy); ctx.scale(lerp(.25, 1, k), lerp(.25, 1, k)); ctx.rotate((1 - k) * -.5);
        ctx.font = font; ctx.fillStyle = '#fff';
        ctx.fillText(word, -tw / 2, fontPx * .32);
        ctx.restore();
      }
      // nét chữ ký trắng tự vẽ
      const sp = eo(span(t, T.sig0, T.sig1));
      if (sp > 0) {
        const bs = f > 0 ? size : Math.min(w, h), bx = f > 0 ? lx : cx - bs / 2, by = f > 0 ? ly : cy - bs / 2;
        ctx.save();
        ctx.translate(bx, by); ctx.scale(bs / 48, bs / 48);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.setLineDash([92, 92]); ctx.lineDashOffset = 92 * (1 - sp);
        ctx.stroke(sig);
        ctx.restore();
      }
    }
    if (FREEZE !== null) return;
    if (t >= T.fly1) { done(); return; }
    requestAnimationFrame(frame);
  }
  function done() {
    if (finished) return;
    finished = true;
    if (!revealed) { revealed = true; onReveal(); }
    host.classList.add('gone');
    setTimeout(() => host.remove(), 350);
  }
  host.addEventListener('click', done);
  // tab mở ở nền (không vẽ khung hình) thì bỏ qua; lớp an toàn: tối đa 6 giây
  if (document.hidden && FREEZE === null) { done(); return; }
  setTimeout(() => { if (FREEZE === null) done(); }, 6000);
  addEventListener('keydown', done, { once: true });
  // chờ font viết tay tối đa 0,5 giây rồi chạy
  const ready = document.fonts && document.fonts.load ? document.fonts.load(font, word) : Promise.resolve();
  Promise.race([ready, new Promise(r => setTimeout(r, 500))]).then(() => { measure(); requestAnimationFrame(frame); });
};
