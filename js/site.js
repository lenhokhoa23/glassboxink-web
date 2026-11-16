// Claude: hành vi trang GlassBox Ink, bản 2 (15/11/2026). Không thư viện ngoài; hiệu ứng chỉ chạy khi nhìn thấy.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Tách tiêu đề thành từng từ ---------- */
  function split(el) {
    let i = 0;
    const walk = node => [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) {
        const frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.append(p); return; }
          const w = document.createElement('span');
          w.className = 'w'; w.style.setProperty('--i', i++); w.textContent = p;
          frag.append(w);
        });
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1) {
        if (ch.classList.contains('line2')) walk(ch);
        else if (ch.tagName.toLowerCase() !== 'svg') { ch.classList.add('w'); ch.style.setProperty('--i', i++); }
      }
    });
    walk(el);
    el.classList.add('split');
  }
  $$('[data-split]').forEach(split);

  /* ---------- Bắt đầu trang (sau màn mở đầu) ---------- */
  function start() {
    root.classList.add('go');
    $('.hero h1')?.classList.add('in');
    playHero();
  }

  /* ---------- Màn mở đầu (js/intro.js) ---------- */
  const intro = $('#intro');
  if (root.classList.contains('no-intro') || !intro || !window.GBIntro) {
    intro?.remove();
    requestAnimationFrame(start);
  } else {
    try { sessionStorage.setItem('gb-intro', '1'); } catch (e) {}
    window.GBIntro(start);
  }

  /* ---------- Menu điện thoại, thanh trên, tiến độ cuộn ---------- */
  const menuBtn = $('#menuBtn'), links = $('#navLinks');
  menuBtn.addEventListener('click', () => menuBtn.setAttribute('aria-expanded', links.classList.toggle('open')));
  links.addEventListener('click', e => { if (e.target.closest('a')) { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); } });
  const nav = $('.nav'), bar = $('#progress'), heroWin = $('#heroWin');
  let ticking = false;
  function onScroll() {
    ticking = false;
    nav.classList.toggle('scrolled', scrollY > 8);
    const h = root.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    if (heroWin && !reduce && innerWidth >= 760 && scrollY < innerHeight * 1.5) {
      const r = heroWin.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, 1 - (r.top - 80) / (innerHeight * .7)));
      heroWin.style.transform = `rotateX(${(16 * (1 - p)).toFixed(2)}deg) scale(${(.95 + .05 * p).toFixed(3)})`;
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Hiện dần khi cuộn ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
    setTimeout(() => e.target.classList.add('settled'), 900);
  }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.rv, h2[data-split]').forEach(el => io.observe(el));

  /* ---------- Video: chỉ chạy khi nhìn thấy ---------- */
  function playHero() {
    const v = $('#heroWin video');
    if (!v || reduce) return;
    v.preload = 'auto';
    new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: .2 }).observe(v);
  }

  const tabs = $$('.tab'), sv = $('#showVideo'), desc = $('#tabDesc');
  let cur = 0, showVisible = false, loaded = false;
  function load(name) {
    sv.src = `media/video/${name}.mp4`;
    sv.poster = `media/video/${name}.jpg`;
    loaded = true;
  }
  function select(i) {
    cur = (i + tabs.length) % tabs.length;
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === cur); t.querySelector('.bar b').style.transform = 'scaleX(0)'; });
    desc.textContent = tabs[cur].querySelector('p').textContent;
    sv.classList.add('swap');
    setTimeout(() => {
      load(tabs[cur].dataset.video);
      requestAnimationFrame(() => sv.classList.remove('swap'));
      if (showVisible && !reduce) sv.play().catch(() => {});
    }, 200);
    const list = tabs[cur].parentElement;
    if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: tabs[cur].offsetLeft - (list.clientWidth - tabs[cur].offsetWidth) / 2, behavior: 'smooth' });
  }
  tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
  sv.addEventListener('timeupdate', () => {
    if (sv.duration) tabs[cur].querySelector('.bar b').style.transform = `scaleX(${(sv.currentTime / sv.duration).toFixed(3)})`;
  });
  sv.addEventListener('ended', () => select(cur + 1));
  if (reduce) sv.controls = true;
  desc.textContent = tabs[0].querySelector('p').textContent;
  new IntersectionObserver(es => es.forEach(e => {
    showVisible = e.isIntersecting;
    if (showVisible) { if (!loaded) load(tabs[cur].dataset.video); if (!reduce) sv.play().catch(() => {}); }
    else sv.pause();
  }), { threshold: .25, rootMargin: '200px 0px' }).observe(sv);

  /* ---------- Chữ viết tay (SVG tự vẽ) ---------- */
  const hw = $('#hw');
  if (hw) {
    const lines = [['#c1 rect', '#t1', 1.7], ['#c2 rect', '#t2', 1.5], ['#c3 rect', '#t3', 1.3, true], ['#c4 rect', '#t4', .7]]
      .map(([c, el, dur, hl]) => ({ rect: $(c, hw), node: $(el, hw), dur, hl }));
    const nibEl = $('#nib', hw), hlEl = $('#hl', hw);
    const gap = .3, hold = 3;
    const total = lines.reduce((s, l) => s + l.dur + gap, 0) + hold;
    const ease = x => x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
    let boxes = null, t0 = null, raf = 0, on = false;
    function draw(t) {
      let s = 0, pen = false;
      lines.forEach((l, i) => {
        const b = boxes[i];
        const p = Math.min(1, Math.max(0, (t - s) / l.dur));
        const w = (b.x + b.width + 12) * (p >= 1 ? 1 : ease(p));
        l.rect.setAttribute('width', p <= 0 ? 0 : w);
        if (l.hl) hlEl.setAttribute('width', Math.max(0, (w - 112) * .98));
        if (p > 0 && p < 1) { pen = true; nibEl.setAttribute('cx', w); nibEl.setAttribute('cy', b.y + b.height * (.55 + .25 * Math.sin(t * 24))); }
        s += l.dur + gap;
      });
      nibEl.setAttribute('opacity', pen ? .85 : 0);
      hw.style.opacity = t > total - .4 ? Math.max(0, (total - t) / .4) : 1;
    }
    const loop = ts => { if (!on) return; if (t0 === null) t0 = ts; draw(((ts - t0) / 1000) % total); raf = requestAnimationFrame(loop); };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) {
          boxes = boxes || lines.map(l => l.node.getBBox());
          if (reduce) { draw(total - hold); return; }
          if (!on) { on = true; t0 = null; raf = requestAnimationFrame(loop); }
        } else { on = false; cancelAnimationFrame(raf); }
      }), { threshold: .3 }).observe(hw);
    });
  }

  /* ---------- Thẻ PDF: khoảng trống mở ra giữa hai đoạn ---------- */
  const pdf = $('#pdfAnim');
  if (pdf && !reduce) {
    const botEl = $('#pdfBot', pdf), gapEl = $('#pdfGap', pdf);
    let t0 = null, on = false;
    const f = ts => {
      if (!on) return;
      if (t0 === null) t0 = ts;
      const t = ((ts - t0) / 1000) % 4.2;
      const o = t < .6 ? 0 : t < 1.6 ? t - .6 : t < 3.2 ? 1 : t < 4 ? 1 - (t - 3.2) / .8 : 0;
      const h = 56 * (o < .5 ? 2 * o * o : 1 - (-2 * o + 2) ** 2 / 2);
      botEl.setAttribute('transform', `translate(0 ${h.toFixed(1)})`);
      gapEl.setAttribute('height', h.toFixed(1));
      requestAnimationFrame(f);
    };
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { if (!on) { on = true; t0 = null; requestAnimationFrame(f); } } else on = false;
    })).observe(pdf);
  }

  /* ---------- Thẻ nghiêng, vầng sáng theo chuột (gộp theo khung hình) ---------- */
  if (fine && !reduce) {
    $$('.tilt, #final').forEach(card => {
      let ev = null, pending = false;
      card.addEventListener('pointermove', e => {
        ev = e;
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          const r = card.getBoundingClientRect();
          const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
          card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
          card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
          if (card.classList.contains('tilt')) {
            card.style.setProperty('--ry', ((x - .5) * 7).toFixed(2) + 'deg');
            card.style.setProperty('--rx', ((.5 - y) * 5).toFixed(2) + 'deg');
          }
        });
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- Ảnh chụp: thẻ ở giữa nổi lên, kéo chuột để cuộn ---------- */
  const gal = $('#gallery');
  if (gal) {
    const shots = $$('.shot', gal);
    let qd = false;
    const upd = () => {
      qd = false;
      const c = gal.getBoundingClientRect().left + gal.clientWidth / 2;
      shots.forEach(s => {
        const r = s.getBoundingClientRect();
        const d = Math.min(1, Math.abs(r.left + r.width / 2 - c) / (r.width * 1.1));
        s.style.setProperty('--s', (1 - .07 * d).toFixed(3));
        s.style.setProperty('--o', (1 - .4 * d).toFixed(3));
      });
    };
    gal.addEventListener('scroll', () => { if (!qd) { qd = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd);
    upd();
    let down = null;
    gal.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') down = { x: e.clientX, l: gal.scrollLeft }; });
    addEventListener('pointerup', () => { if (down) { down = null; gal.style.scrollSnapType = ''; } });
    gal.addEventListener('pointermove', e => { if (!down) return; gal.style.scrollSnapType = 'none'; gal.scrollLeft = down.l - (e.clientX - down.x); });
  }

  /* ---------- Tải về: đoán máy, lấy bản mới nhất từ GitHub ---------- */
  const ua = navigator.userAgent;
  const isMac = /Macintosh|Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua);
  const isWin = /Windows/.test(ua);
  const label = { win: 'Windows', 'mac-arm': 'Mac chip Apple', 'mac-intel': 'Mac chip Intel' };
  async function markOs() {
    let mine = isWin ? 'win' : null;
    if (isMac) {
      mine = 'mac-arm';
      try { const h = await navigator.userAgentData?.getHighEntropyValues(['architecture']); if (h?.architecture === 'x86') mine = 'mac-intel'; } catch (e) {}
    }
    if (!mine) { $$('[data-os-name]').forEach(s => s.textContent = 'máy tính'); return; }
    $$('.dl-card').forEach(c => c.classList.toggle('me', c.dataset.os === mine));
    $$('[data-os-name]').forEach(s => s.textContent = label[mine]);
    const a = $(`.dl-card[data-os="${mine}"] a[data-asset]`);
    if (a) $$('[data-dl-primary]').forEach(b => b.href = a.href);
  }
  markOs();
  fetch('https://api.github.com/repos/lenhokhoa23/net-phat-hanh/releases/latest', { headers: { Accept: 'application/vnd.github+json' } })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(rel => {
      const ver = String(rel.tag_name || '').replace(/^v/, '');
      if (ver) $$('[data-ver]').forEach(e => e.textContent = ver);
      // Claude (16/11/2026, anh chốt tải zip cho Windows): bật WIN_ZIP khi hướng dẫn 3 bước có đủ ảnh thật. Tắt thì Windows tải .exe;
      //   bật mà bản phát hành chưa có .zip thì vẫn dùng .exe.
      const WIN_ZIP = true;
      const assets = rel.assets || [];
      const winExt = WIN_ZIP && assets.some(x => /-win-x64\.zip$/.test(x.name)) ? '.zip' : '.exe';
      for (const asset of assets) {
        const key = ['win-x64', 'mac-arm64', 'mac-x64'].find(k => asset.name.includes(k));
        if (!key) continue;
        const kind = asset.name.slice(asset.name.lastIndexOf('.'));
        if (key === 'win-x64' && kind !== winExt) continue;
        $$(`a[data-asset="${key}"]`).forEach(a => a.href = asset.browser_download_url);
        $$(`[data-size="${key}"]`).forEach(s => s.textContent = `${kind} · ${Math.round(asset.size / 1048576)} MB`);
      }
      markOs();
    })
    .catch(() => {});
})();
