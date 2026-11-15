// Claude: màn mở đầu GlassBox Ink, bản 3 (15/11/2026). Vẽ bằng canvas, giống mực và cọ thật:
// 1) cọ quét ba vệt cong, mỗi vệt là chùm sợi lông (mép rách, đầu khô xơ, vệt bóng ướt), mực văng ở chỗ đổi hướng
// 2) vũng mực rơi xuống (mép lồi lõm, gai, giọt văng, bật nảy) rồi loang phủ kín màn thành nền tím
// 3) mực trắng viết tay "GlassBox Ink"  4) nền co lại như thạch thành ô logo, nét chữ ký tự vẽ  5) logo bay về thanh trên.
// Khoảng 3,3 giây; bấm/gõ phím để bỏ qua; ?introAt=1.2 giữ hình ở giây 1,2 để soát.
window.GBIntro = function run(onReveal) {
  const host = document.getElementById('intro');
  const cv = document.getElementById('introCanvas');
  if (!host || !cv || innerWidth < 50 || innerHeight < 50) { host?.remove(); onReveal(); return; }
  const ctx = cv.getContext('2d');
  const dpr = Math.min(2, devicePixelRatio || 1);
  const W = innerWidth, H = innerHeight, M = Math.min(W, H), X = Math.max(W, H);
  const diag = Math.hypot(W, H);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // lớp mực đã khô (vẽ dần, không vẽ lại từ đầu mỗi khung)
  const layer = document.createElement('canvas');
  layer.width = cv.width; layer.height = cv.height;
  const lx = layer.getContext('2d');
  lx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const PAPER = '#F7F6F2';
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const span = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, x) => a + (b - a) * x;
  const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eo = x => 1 - Math.pow(1 - x, 3);
  const back = x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = a => a[Math.floor(rnd() * a.length)];

  const smooth = ctx.createLinearGradient(0, 0, W, H);
  smooth.addColorStop(0, '#8E6CF7'); smooth.addColorStop(.45, '#6A4BDC'); smooth.addColorStop(1, '#4527B4');

  /* ---------- 1) vệt cọ: đường cong bậc ba, chùm sợi lông ---------- */
  function bez(p0, p1, p2, p3, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
      const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
      pts.push([x, y]);
    }
    return pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return { x: p[0], y: p[1], tx: (b[0] - a[0]) / d, ty: (b[1] - a[1]) / d };
    });
  }
  const P = (x, y) => [x * W, y * H];
  const BWID = X * .19;
  const strokes = [
    { t0: .08, t1: .42, pal: ['#5B3FC4', '#6B4BE0', '#4A30B0', '#7A5CF0', '#5236BE'], w: BWID,
      pts: bez(P(-.15, .3), P(.25, -.08), P(.6, .62), P(1.15, .18), 140) },
    { t0: .44, t1: .74, pal: ['#9b4dff', '#7A5CF0', '#B06CFF', '#8650F0', '#a35cff'], w: BWID * .95,
      pts: bez(P(1.15, .55), P(.7, .2), P(.35, .98), P(-.15, .62), 140) },
    { t0: .76, t1: 1.02, pal: ['#e5487d', '#c8407a', '#ff6f9a', '#b03a8f', '#d9457f'], w: BWID * .9,
      pts: bez(P(-.15, 1.02), P(.3, .66), P(.7, 1.2), P(1.15, .8), 140) },
  ];
  for (const s of strokes) {
    const n = Math.round(clamp(s.w / 4, 26, 44));
    s.bristles = Array.from({ length: n }, (_, k) => {
      const u = (k / (n - 1)) * 2 - 1;                    // vị trí ngang trong vệt
      const edge = Math.abs(u);
      return {
        u, lw: s.w / n * (1.6 + rnd() * 1.8), col: pick(s.pal), a: .55 + rnd() * .45,
        ph: rnd() * 6.28, amp: 1 + rnd() * 3,
        i0: Math.floor(rnd() * 6 + edge * edge * 10),      // mép bắt đầu muộn hơn
        i1: 140 - Math.floor(rnd() * 8 + edge * edge * (18 + rnd() * 26)), // đầu vệt khô xơ
      };
    });
    s.done = 0;
  }
  function paintStroke(s, upto) {
    const pts = s.pts, from = Math.max(1, s.done);
    if (upto < from) return;
    lx.lineCap = 'butt'; lx.lineJoin = 'round';
    const pos = (i, off) => [pts[i].x - pts[i].ty * off, pts[i].y + pts[i].tx * off];
    for (const br of s.bristles) {
      const i0 = Math.max(from - 1, br.i0), i1 = Math.min(upto, br.i1);
      if (i1 <= i0) continue;
      lx.strokeStyle = br.col; lx.globalAlpha = br.a; lx.lineWidth = br.lw;
      lx.beginPath();
      for (let i = i0; i <= i1; i++) {
        const taper = Math.min(1, i / 10, (140 - i) / 14 + .35);
        const off = (br.u * s.w / 2) * (.75 + .25 * taper) + Math.sin(i * .09 + br.ph) * br.amp;
        const [x, y] = pos(i, off);
        i === i0 ? lx.moveTo(x, y) : lx.lineTo(x, y);
      }
      lx.stroke();
    }
    // vệt bóng ướt dọc thân vệt
    const h0 = Math.max(from - 1, 8), h1 = Math.min(upto, 125);
    if (h1 > h0) {
      lx.globalAlpha = .08; lx.strokeStyle = '#fff'; lx.lineWidth = s.w * .035;
      lx.beginPath();
      for (let i = h0; i <= h1; i++) { const [x, y] = pos(i, -s.w * .18); i === h0 ? lx.moveTo(x, y) : lx.lineTo(x, y); }
      lx.stroke();
    }
    lx.globalAlpha = 1;
    s.done = Math.max(s.done, upto + 1);
  }

  /* ---------- 2) vũng mực văng ---------- */
  function splatShape(r, sd) {
    const s0 = seed; seed = sd;
    const ph = [rnd() * 6, rnd() * 6, rnd() * 6];
    const body = [];
    for (let k = 0; k < 56; k++) {
      const a = k / 56 * Math.PI * 2;
      body.push([a, r * (1 + .16 * Math.sin(3 * a + ph[0]) + .09 * Math.sin(7 * a + ph[1]) + .05 * Math.sin(13 * a + ph[2]))]);
    }
    const spikes = Array.from({ length: 9 }, () => ({ a: rnd() * 6.28, len: r * (1.35 + rnd() * .9), w: r * (.06 + rnd() * .1) }));
    const drops = Array.from({ length: 22 }, () => {
      const a = rnd() * 6.28, d = r * (1.25 + rnd() * 1.6);
      return { a, d, r: r * (.025 + rnd() * rnd() * .16), e: 1 + rnd() * 1.8 };
    });
    seed = s0;
    return { body, spikes, drops };
  }
  function drawSplat(g, x, y, sh, k, fill) {
    g.save(); g.translate(x, y); g.scale(k, k);
    g.fillStyle = fill;
    g.beginPath();
    sh.body.forEach(([a, rr], i) => { const px = Math.cos(a) * rr, py = Math.sin(a) * rr; i ? g.lineTo(px, py) : g.moveTo(px, py); });
    g.closePath(); g.fill();
    for (const sp of sh.spikes) {
      const c = Math.cos(sp.a), s = Math.sin(sp.a);
      g.beginPath();
      g.moveTo(-s * sp.w * 2, c * sp.w * 2);
      g.quadraticCurveTo(c * sp.len * .7, s * sp.len * .7, c * sp.len, s * sp.len);
      g.quadraticCurveTo(c * sp.len * .7, s * sp.len * .7, s * sp.w * 2, -c * sp.w * 2);
      g.fill();
      g.beginPath(); g.arc(c * sp.len, s * sp.len, sp.w * .9, 0, 6.29); g.fill();
    }
    for (const d of sh.drops) {
      g.save(); g.rotate(d.a); g.beginPath(); g.ellipse(d.d, 0, d.r * d.e, d.r, 0, 0, 6.29); g.fill(); g.restore();
    }
    // ánh ướt
    g.globalAlpha = .18; g.fillStyle = '#fff';
    g.beginPath(); g.ellipse(-sh.body[0][1] * .3, -sh.body[0][1] * .35, sh.body[0][1] * .28, sh.body[0][1] * .14, -.5, 0, 6.29); g.fill();
    g.restore();
  }
  const splats = [
    { t: 1.0, x: .62, y: .44, r: M * .15, col: '#6A4BDC' },
    { t: 1.05, x: .26, y: .3, r: M * .1, col: '#7A5CF0' },
    { t: 1.08, x: .82, y: .8, r: M * .11, col: '#5B3FC4' },
    { t: 1.1, x: .2, y: .82, r: M * .08, col: '#8650F0' },
  ].map((s, i) => ({ ...s, x: s.x * W, y: s.y * H, sh: splatShape(s.r, 97 + i * 31), done: false }));
  // tia mực văng ở chỗ cọ đổi hướng / nhấc lên
  const flicks = [
    { t: .43, x: 1.0, y: .2 }, { t: .75, x: 0.02, y: .62 }, { t: 1.0, x: .98, y: .8 },
  ].map((f, i) => ({ ...f, x: f.x * W, y: f.y * H, sh: splatShape(M * .045, 400 + i * 17), done: false, col: pick(strokes[i].pal) }));

  const FLOOD0 = 1.12, FLOOD1 = 1.55;

  /* ---------- 3) chữ mực trắng ---------- */
  const fontPx = Math.round(Math.min(W * .13, H * .2, 120));
  const font = `700 ${fontPx}px "Dancing Script", "Segoe Script", cursive`;
  const word = 'GlassBox Ink';
  let tw = 0, tx = 0;
  const cx = W / 2, cy = H / 2, ty = cy + fontPx * .32;
  function measure() { ctx.font = font; tw = ctx.measureText(word).width; tx = cx - tw / 2; }
  const wdrops = Array.from({ length: 70 }, () => ({ u: rnd(), oy: (rnd() - .5) * fontPx * 2, r: 1.2 + rnd() * rnd() * fontPx * .12, life: .15 + rnd() * .35, vx: (rnd() - .3) * 60 }));
  const WR0 = 1.55, WR1 = 2.2;

  /* ---------- 4,5) logo ---------- */
  const S = M * .2, R = S * .25;
  const sig = new Path2D('M11 30.5c2.2-9 4.6-14 6.6-11.2 1.7 2.4-.2 11.6 2.6 10.3 2.4-1.1 3.2-6.7 5.6-5.2 2 1.3 1.6 4.6 4 3.6 1.7-.7 2.7-2.6 4.6-3.2 1-.3 1.8.1 2.6.6');
  const navLogo = document.querySelector('.nav .brand .logo');
  const nr = navLogo ? navLogo.getBoundingClientRect() : { left: 16, top: 14, width: 36 };
  const COL0 = 2.25, COL1 = 2.75, SIG0 = 2.55, SIG1 = 2.95, FLY0 = 3.0, FLY1 = 3.4;

  /* ---------- cọ vẽ thật ---------- */
  function rr(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
  const brushSt = { x: -200, y: H * .3, ang: 0, bend: 0, lift: 1, wet: '#5B3FC4', on: false };
  function drawBrush(st) {
    if (!st.on) return;
    const sc = Math.max(.8, M * .55 / 300) * (1 + st.lift * .08);
    ctx.save();
    // bóng đổ xuống giấy (nhấc càng cao càng xa, càng nhạt)
    ctx.save();
    ctx.translate(st.x + (8 + st.lift * 26) * sc, st.y + (14 + st.lift * 38) * sc); ctx.rotate(st.ang); ctx.scale(sc, sc);
    // bóng mềm: ba lớp mờ chồng nhau (nhẹ hơn nhiều so với bộ lọc blur)
    for (const [gw, al] of [[9, .05], [5, .06], [2, .07]]) {
      ctx.fillStyle = `rgba(20,8,60,${al * (1 - st.lift * .35)})`;
      ctx.beginPath(); ctx.moveTo(-gw * .5, 0); ctx.lineTo(66, -11 - gw); ctx.lineTo(300 + gw, -6 - gw); ctx.lineTo(300 + gw, 6 + gw); ctx.lineTo(66, 11 + gw); ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    ctx.translate(st.x, st.y); ctx.rotate(st.ang); ctx.scale(sc, sc);
    // cán sơn mài vàng, thuôn, có vệt bóng
    let g = ctx.createLinearGradient(0, -13, 0, 13);
    g.addColorStop(0, '#8A5600'); g.addColorStop(.16, '#E9AE1F'); g.addColorStop(.32, '#FFF4C6'); g.addColorStop(.48, '#F7C02A');
    g.addColorStop(.78, '#C98A07'); g.addColorStop(1, '#6B4300');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(110, -10.5);
    ctx.bezierCurveTo(150, -13.5, 215, -10, 296, -5.2); ctx.bezierCurveTo(306, -4.6, 306, 4.6, 296, 5.2);
    ctx.bezierCurveTo(215, 10, 150, 13.5, 110, 10.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(118, -6.5); ctx.bezierCurveTo(165, -8.6, 225, -6.2, 288, -3.3); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,50,0,.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(130, 5.5); ctx.bezierCurveTo(180, 7.5, 230, 5.5, 285, 3); ctx.stroke();
    // khâu kim loại có ngấn
    g = ctx.createLinearGradient(0, -12, 0, 12);
    g.addColorStop(0, '#6E747D'); g.addColorStop(.2, '#FAFBFC'); g.addColorStop(.42, '#B9BFC8'); g.addColorStop(.62, '#EEF1F5'); g.addColorStop(1, '#5A6068');
    ctx.fillStyle = g; rr(ctx, 64, -12, 48, 24, 3.5); ctx.fill();
    ctx.strokeStyle = 'rgba(30,30,40,.3)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(76, -12); ctx.lineTo(76, 12); ctx.moveTo(82, -12); ctx.lineTo(82, 12); ctx.moveTo(100, -12); ctx.lineTo(100, 12); ctx.stroke();
    // lông cọ: gốc khô màu lông tự nhiên, đầu ướt màu mực, cong theo hướng quét
    const bd = st.bend * 9;
    g = ctx.createLinearGradient(66, 0, -4, bd);
    g.addColorStop(0, '#D8BC8E'); g.addColorStop(.32, '#B48A57'); g.addColorStop(.5, st.wet); g.addColorStop(1, st.wet);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(66, -11.5);
    ctx.bezierCurveTo(42, -14 + bd * .25, 16, -8 + bd * .7, -4, bd);
    ctx.bezierCurveTo(16, 8 + bd * .7, 42, 14 + bd * .25, 66, 11.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,20,10,.22)'; ctx.lineWidth = .8;
    for (let k = -3; k <= 3; k++) {
      ctx.beginPath(); ctx.moveTo(64, k * 3); ctx.quadraticCurveTo(30, k * 2.4 + bd * .55, 6, bd * .9 + k * .6); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(48, -7); ctx.quadraticCurveTo(26, -6 + bd * .4, 8, -2 + bd * .8); ctx.stroke();
    ctx.restore();
  }
  function aimBrush(x, y, dirx, diry, lift, wet, dt) {
    const tilt = .55;
    const target = Math.atan2(-diry, -dirx) + tilt;  // thân cọ hướng ngược chiều đi, nghiêng
    let d = target - brushSt.ang;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    const k = 1 - Math.pow(.0005, dt);
    brushSt.ang += d * k;
    brushSt.bend += (clamp(-d * 4, -1, 1) - brushSt.bend) * k;
    brushSt.lift += (lift - brushSt.lift) * k;
    brushSt.x = x; brushSt.y = y; brushSt.wet = wet; brushSt.on = true;
  }

  /* ---------- cập nhật trạng thái tới thời điểm t (vẽ dần lớp mực) ---------- */
  let lastT = 0;
  function update(t) {
    const dt = Math.max(1 / 240, t - lastT); lastT = t;
    brushSt.on = false;
    strokes.forEach((s, si) => {
      const p = span(t, s.t0, s.t1);
      if (p <= 0) return;
      const idx = Math.min(140, Math.floor(eio(p) * 140));
      paintStroke(s, idx);
      if (p < 1) {
        const q = s.pts[idx];
        aimBrush(q.x, q.y, q.tx, q.ty, 0, s.pal[0], dt);
      }
    });
    // giữa các vệt: cọ nhấc lên bay vòng sang đầu vệt sau
    for (let i = 0; i < strokes.length - 1; i++) {
      const a = strokes[i], b = strokes[i + 1];
      if (t > a.t1 && t < b.t0) {
        const f = span(t, a.t1, b.t0), e = a.pts[140], s0 = b.pts[0];
        aimBrush(lerp(e.x, s0.x, f), lerp(e.y, s0.y, f) - Math.sin(f * Math.PI) * M * .1, s0.x - e.x, s0.y - e.y, 1, b.pal[0], dt);
      }
    }
    // cọ rời màn sau vệt cuối
    const last = strokes[strokes.length - 1];
    if (t >= last.t1 && t < last.t1 + .25) {
      const f = span(t, last.t1, last.t1 + .25), e = last.pts[140];
      aimBrush(e.x + f * M * .6, e.y - f * M * .5, 1, -1, 1, last.pal[0], dt);
    }
    for (const f of flicks) if (!f.done && t >= f.t + .12) { drawSplat(lx, f.x, f.y, f.sh, 1, f.col); f.done = true; }
    for (const s of splats) if (!s.done && t >= s.t + .16) { drawSplat(lx, s.x, s.y, s.sh, 1, s.col); s.done = true; }
  }

  /* ---------- vẽ một khung ---------- */
  function render(t) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
    if (t < COL0) {
      ctx.drawImage(layer, 0, 0, W, H);
      // mực văng đang rơi (bật nảy)
      for (const f of flicks) if (!f.done && t >= f.t) drawSplat(ctx, f.x, f.y, f.sh, back(span(t, f.t, f.t + .12)), f.col);
      for (const s of splats) if (!s.done && t >= s.t) drawSplat(ctx, s.x, s.y, s.sh, back(span(t, s.t, s.t + .16)), s.col);
      // mực loang từ các vũng
      const fp = span(t, FLOOD0, FLOOD1);
      if (fp > 0) {
        ctx.fillStyle = smooth;
        if (fp >= 1) ctx.fillRect(0, 0, W, H);
        else {
          splats.forEach((s, i) => {
            const Rr = s.r + eio(span(fp, i * .05, .85 + i * .05)) * diag * 1.05;
            ctx.beginPath();
            for (let k = 0; k <= 64; k++) {
              const a = k / 64 * Math.PI * 2;
              const r2 = Rr * (1 + .06 * Math.sin(5 * a + t * 7 + i) + .035 * Math.sin(11 * a - t * 9) + .02 * Math.sin(19 * a + i * 2));
              const px = s.x + Math.cos(a) * r2, py = s.y + Math.sin(a) * r2;
              k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
            }
            ctx.closePath(); ctx.fill();
          });
        }
      }
      drawBrush(brushSt);
      // chữ mực trắng
      const wp = span(t, WR0, WR1);
      if (wp > 0) {
        const edge = tx + tw * eio(wp);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, edge + 3, H); ctx.clip();
        ctx.font = font; ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(40,20,110,.3)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 3;
        ctx.fillText(word, tx, ty);
        ctx.restore();
        ctx.fillStyle = '#fff';
        for (const d of wdrops) {
          const age = (wp - d.u * .9) / d.life;
          if (age <= 0 || age >= 1) continue;
          ctx.globalAlpha = (1 - age) * .95;
          ctx.beginPath(); ctx.arc(tx + tw * d.u + d.vx * age, cy + d.oy * (.35 + age * .9), d.r * (1 - age * .4), 0, 6.29); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    } else {
      // nền tím co lại như thạch thành ô logo, chữ cuộn vào giữa
      const c = eio(span(t, COL0, COL1));
      const f = eio(span(t, FLY0, FLY1));
      const wob = Math.sin(span(t, COL0, COL1 + .25) * Math.PI * 3) * (1 - c) * .12 + Math.sin(span(t, COL1 - .1, COL1 + .3) * Math.PI * 2) * .05 * (1 - span(t, COL1, COL1 + .3));
      let w = lerp(W + 60, S, c) * (1 + wob), h = lerp(H + 60, S, c) * (1 - wob), r = lerp(0, R, c);
      let x = cx - w / 2, y = cy - h / 2;
      if (f > 0) {
        const size = lerp(S, nr.width, f);
        w = h = size; r = size * .25; x = lerp(cx - S / 2, nr.left, f); y = lerp(cy - S / 2, nr.top, f);
        ctx.clearRect(0, 0, W, H);
        ctx.globalAlpha = 1 - f; ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
        if (!revealed) { revealed = true; onReveal(); }
      }
      rr(ctx, x, y, w, h, r);
      ctx.fillStyle = smooth; ctx.fill();
      ctx.globalAlpha = f > 0 ? 1 : c; ctx.fillStyle = '#5B3FC4'; ctx.fill(); ctx.globalAlpha = 1;
      const k = 1 - c;
      if (k > .02) {
        ctx.save(); ctx.globalAlpha = k; ctx.translate(cx, cy);
        ctx.scale(lerp(.2, 1, k), lerp(.2, 1, k)); ctx.rotate((1 - k) * -.6);
        ctx.font = font; ctx.fillStyle = '#fff'; ctx.fillText(word, -tw / 2, fontPx * .32);
        ctx.restore();
      }
      const sp = eo(span(t, SIG0, SIG1));
      if (sp > 0) {
        const bs = Math.min(w, h), bx = x + (w - bs) / 2, by = y + (h - bs) / 2;
        ctx.save(); ctx.translate(bx, by); ctx.scale(bs / 48, bs / 48);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.setLineDash([92, 92]); ctx.lineDashOffset = 92 * (1 - sp); ctx.stroke(sig);
        ctx.restore();
      }
    }
  }

  let t0 = null, finished = false, revealed = false;
  const q = new URLSearchParams(location.search).get('introAt');
  const FREEZE = q !== null ? parseFloat(q) : null;
  function frame(ts) {
    if (finished) return;
    if (t0 === null) t0 = ts;
    const t = (ts - t0) / 1000;
    update(t); render(t);
    if (t >= FLY1) { done(); return; }
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
  addEventListener('keydown', done, { once: true });
  if (document.hidden && FREEZE === null) { done(); return; }
  if (FREEZE === null) setTimeout(done, 6500);
  const ready = document.fonts && document.fonts.load ? document.fonts.load(font, word) : Promise.resolve();
  Promise.race([ready, new Promise(r => setTimeout(r, 500))]).then(() => {
    measure();
    if (FREEZE !== null) {
      for (let s = 0; s <= FREEZE; s += 1 / 60) update(s);
      update(FREEZE); render(FREEZE);
      return;
    }
    requestAnimationFrame(frame);
  });
};
