// Claude: màn hình tải riêng theo loại máy + đếm ngược ưu đãi (15/11/2026).
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hướng dẫn từng loại máy ---------- */
  const IMG = 'media/huong-dan/';
  const MAC_NOTE = 'GlassBox Ink mới ra mắt, chưa đăng ký với Apple nên lần đầu mở macOS sẽ chặn. Thầy cô yên tâm, chỉ cần cho phép một lần theo các bước dưới đây, từ lần sau app mở bình thường.';
  const macSteps = [
    { h: 'Kéo GlassBox Ink vào Applications', p: 'Mở tệp <b>.dmg</b> vừa tải, kéo biểu tượng GlassBox Ink thả vào thư mục <b>Applications</b>.', img: 'mac-1-keo-vao.png' },
    { h: 'Mở app, macOS báo chặn: bấm Done', p: 'Lần đầu mở, macOS hiện “GlassBox Ink” Not Opened. Bấm <b>Done</b> (Xong), đừng bấm Move to Trash.', img: 'mac-2-xong.png', narrow: true },
    { h: 'Vào Privacy & Security, bấm Open Anyway', p: 'Mở <b>System Settings → Privacy &amp; Security</b>, kéo xuống mục Security, bấm <b>Open Anyway</b> (Vẫn mở) cạnh dòng “GlassBox Ink” was blocked.', img: 'mac-3-van-mo.png' },
    { h: 'Xác nhận Open Anyway', p: 'Bấm <b>Open Anyway</b> lần nữa (có thể máy hỏi mật khẩu). Xong, GlassBox Ink mở ra.', img: 'mac-4-xac-nhan.png', narrow: true },
  ];
  const GUIDE = {
    win: {
      asset: 'win-x64', title: 'GlassBox Ink cho Windows', icon: '#i-win',
      note: 'GlassBox Ink mới ra mắt, chưa nhiều người tải nên Windows và trình duyệt sẽ cảnh báo. Thầy cô yên tâm, chỉ việc bấm <b>giữ lại</b> và <b>vẫn chạy</b> app theo hai bước dưới đây.',
      steps: [
        { h: 'Trình duyệt hỏi: bấm Keep (Giữ lại)', p: 'Khi tệp tải xong, trình duyệt có thể báo tệp “isn\'t commonly downloaded”. Bấm dấu <b>···</b> cạnh tệp, chọn <b>Keep</b> (Giữ lại).', img: 'win-1-giu-lai.png', narrow: true },
        { h: 'Mở tệp, bấm More info rồi Run anyway', p: 'Mở tệp vừa tải. Nếu hiện “Windows protected your PC”, bấm <b>More info</b> (Thông tin thêm), rồi <b>Run anyway</b> (Vẫn chạy).', img: 'win-2-van-chay.png' },
        { h: 'Bấm Cài đặt', p: 'Không cần quyền quản trị. Cài xong có biểu tượng <b>GlassBox Ink</b> trên màn hình nền.' },
      ],
    },
    'mac-arm': { asset: 'mac-arm64', title: 'GlassBox Ink cho Mac chip Apple', icon: '#i-mac', note: MAC_NOTE, steps: macSteps },
    'mac-intel': { asset: 'mac-x64', title: 'GlassBox Ink cho Mac chip Intel', icon: '#i-mac', note: MAC_NOTE, steps: macSteps },
  };
  const OS_OF_ASSET = { 'win-x64': 'win', 'mac-arm64': 'mac-arm', 'mac-x64': 'mac-intel' };

  const page = $('#dlp');
  if (!page) return;
  const stepsEl = $('[data-dlp-steps]', page);
  let curUrl = '', closeTimer = 0;

  function render(os) {
    const g = GUIDE[os];
    $('#dlpTitle').textContent = g.title;
    $('.dlp-os use', page).setAttribute('href', g.icon);
    $('[data-dlp-note]', page).innerHTML = g.note;
    stepsEl.innerHTML = g.steps.map((s, i) => `
      <li style="--i:${i}"><div class="dlp-card">
        <h3>${s.h}</h3><p>${s.p}</p>
        ${s.img ? `<figure><img src="${IMG + s.img}" alt="${s.h.replace(/"/g, '')}" loading="lazy" class="${s.narrow ? 'narrow' : ''}"></figure>` : ''}
      </div></li>`).join('');
    // ảnh chưa có thì hiện khung ghi chú thay vì ảnh vỡ
    $$('img', stepsEl).forEach(img => img.addEventListener('error', () => {
      const d = document.createElement('div'); d.className = 'miss'; d.textContent = 'Ảnh minh hoạ đang cập nhật';
      img.replaceWith(d);
    }, { once: true }));
  }
  function assetUrl(key) {
    const a = $(`a[data-asset="${key}"]`);
    return a ? a.href : '';
  }
  function startDownload() {
    if (!curUrl) return;
    const a = document.createElement('a');
    a.href = curUrl; a.rel = 'noopener';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => {
      page.classList.add('started');
      $('[data-dlp-state]', page).textContent = 'Đã bắt đầu tải';
    }, 900);
  }
  function open(os, { download = true, push = true } = {}) {
    if (!GUIDE[os]) return;
    clearTimeout(closeTimer);
    render(os);
    curUrl = assetUrl(GUIDE[os].asset);
    page.classList.remove('started');
    $('[data-dlp-state]', page).textContent = download ? 'Đang tải xuống' : 'Hướng dẫn cài đặt';
    $('.dlp-sub', page).hidden = !download;
    page.hidden = false;
    document.documentElement.classList.add('dlp-lock');
    $('.dlp-scroll', page).scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => page.classList.add('open')));
    if (push) history.pushState({ dlp: os }, '', '#tai-' + os);
    if (download) setTimeout(startDownload, reduce ? 0 : 650);
    setTimeout(() => $('.dlp-back', page).focus({ preventScroll: true }), 600);
  }
  function close({ pop = false } = {}) {
    if (page.hidden) return;
    page.classList.remove('open');
    document.documentElement.classList.remove('dlp-lock');
    closeTimer = setTimeout(() => { page.hidden = true; }, reduce ? 0 : 560);
    if (!pop && location.hash.startsWith('#tai-')) history.back();
  }

  // bấm nút tải (thẻ máy hoặc nút chính ở đầu trang)
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-asset], a[data-dl-primary]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    let key = a.dataset.asset;
    if (!key) {
      const m = a.href.match(/(win-x64|mac-arm64|mac-x64)/);
      if (!m) return;                       // máy chưa rõ loại: để cuộn xuống mục Tải về
      key = m[1];
    }
    e.preventDefault();
    open(OS_OF_ASSET[key]);
  });
  page.addEventListener('click', e => {
    if (e.target.closest('[data-dlp-again]')) { e.preventDefault(); startDownload(); return; }
    const c = e.target.closest('[data-dlp-close]');
    if (c) {
      if (c.getAttribute('href') === '#bang-gia') {
        e.preventDefault(); close();
        setTimeout(() => $('#bang-gia')?.scrollIntoView({ behavior: 'smooth' }), 620);
      } else close();
      return;
    }
    const img = e.target.closest('.dlp-card img');
    if (img) { const z = $('#zoom'); $('img', z).src = img.src; z.hidden = false; }
  });
  $('#zoom')?.addEventListener('click', e => { e.currentTarget.hidden = true; });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const z = $('#zoom');
    if (z && !z.hidden) { z.hidden = true; return; }
    close();
  });
  addEventListener('popstate', () => {
    const m = location.hash.match(/^#tai-(win|mac-arm|mac-intel)$/);
    if (m) open(m[1], { download: false, push: false }); else close({ pop: true });
  });
  // mở thẳng link hướng dẫn (vd gửi cho thầy cô: glassboxink.io.vn/#tai-win)
  const m0 = location.hash.match(/^#tai-(win|mac-arm|mac-intel)$/);
  if (m0) open(m0[1], { download: false, push: false });

  /* ---------- Đếm ngược ưu đãi ra mắt: 15/11/2026 → 15/12/2026 ---------- */
  const SALE_START = Date.parse('2026-11-15T16:00:00+07:00');
  const SALE_END = Date.parse('2026-12-15T23:59:59+07:00');
  const sale = $('#sale');
  if (sale) {
    const cells = { d: $('[data-cd="d"]', sale), h: $('[data-cd="h"]', sale), m: $('[data-cd="m"]', sale), s: $('[data-cd="s"]', sale) };
    const barEl = $('#saleBar');
    const pad = n => String(n).padStart(2, '0');
    let timer = 0;
    function endSale() {
      sale.classList.add('over');
      $('.sale-t', sale).innerHTML = 'Ưu đãi ra mắt đã kết thúc. Cảm ơn thầy cô đã ủng hộ!';
      // về giá gốc
      $$('.plan').forEach(p => {
        const old = $('.old', p), price = $('.price', p), off = $('.off', p);
        if (old && old.textContent.trim()) {
          price.innerHTML = old.textContent.replace('đ', '<small>đ</small>');
          old.textContent = '';
          off?.remove();
        }
      });
    }
    function tick() {
      const left = SALE_END - Date.now();
      if (left <= 0) { clearInterval(timer); endSale(); return; }
      const d = Math.floor(left / 864e5), h = Math.floor(left / 36e5) % 24, mi = Math.floor(left / 6e4) % 60, se = Math.floor(left / 1e3) % 60;
      const val = { d: String(d), h: pad(h), m: pad(mi), s: pad(se) };
      for (const k in val) {
        const el = cells[k];
        if (el.textContent !== val[k]) {
          el.textContent = val[k];
          if (!reduce) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
        }
      }
      barEl.style.transform = `scaleX(${Math.max(0, Math.min(1, left / (SALE_END - SALE_START))).toFixed(4)})`;
    }
    tick();
    timer = setInterval(tick, 1000);
  }
})();
