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
    { h: 'Vào Privacy & Security, bấm Open Anyway', p: 'Mở <b>System Settings → Privacy &amp; Security</b>, kéo xuống mục Security, bấm <b>Open Anyway</b> (Vẫn mở) cạnh dòng “GlassBox Ink” was blocked.', img: 'mac-3-van-mo.png', mid: true },
    { h: 'Xác nhận Open Anyway', p: 'Bấm <b>Open Anyway</b> lần nữa (có thể máy hỏi mật khẩu). Xong, GlassBox Ink mở ra.', img: 'mac-4-xac-nhan.png', narrow: true },
  ];
  const GUIDE = {
    win: {
      asset: 'win-x64', title: 'GlassBox Ink cho Windows', icon: '#i-win',
      note: 'GlassBox Ink mới ra mắt, chưa nhiều người tải nên Windows sẽ hỏi lại một lần. Thầy cô yên tâm, chỉ việc làm theo các bước dưới đây.',
      // Claude (16/11/2026, anh chốt tải zip cho Windows): đã thử thật bằng Edge — tải zip không bị hỏi "isn't commonly downloaded" /
      //   "Keep anyway", bấm tệp cài trong zip không hỏi giải nén, đi thẳng tới hộp "Windows protected your PC". Ảnh chụp thật trên máy
      //   anh (đã che đường dẫn thư mục riêng). Ảnh cũ win-1-giu-lai, win-2-van-giu để lại trong media.
      steps: [
        { h: 'Tải xong, bấm Open file', p: 'Trong danh sách tải của trình duyệt, bấm <b>Open file</b> (Mở tệp) ngay dưới tên tệp <b>GlassBox-Ink-…-win-x64.zip</b>. Hoặc mở thư mục <b>Downloads</b> rồi bấm đúp tệp zip.', img: 'win-zip-1-mo.png', narrow: true },
        { h: 'Bấm đúp tệp cài trong cửa sổ vừa mở', p: 'Cửa sổ mở ra có một tệp <b>GlassBox-Ink-…-win-x64.exe</b>. Bấm đúp vào tệp này, không cần giải nén.', img: 'win-zip-2-tep-cai.png' },
        { h: 'Windows hỏi: bấm More info rồi Run anyway', p: 'Hiện hộp xanh “Windows protected your PC”: bấm <b>More info</b> (Thông tin thêm), rồi <b>Run anyway</b> (Vẫn chạy).', img: 'win-2-van-chay.png' },
        { h: 'Bấm Cài đặt', p: 'Không cần quyền quản trị. Cài xong có biểu tượng <b>GlassBox Ink</b> trên màn hình nền.' },
      ],
    },
    'mac-arm': { asset: 'mac-arm64', title: 'GlassBox Ink cho Mac chip Apple', icon: '#i-mac', note: MAC_NOTE, steps: macSteps },
    'mac-intel': { asset: 'mac-x64', title: 'GlassBox Ink cho Mac chip Intel', icon: '#i-mac', note: MAC_NOTE, steps: macSteps },
  };
  GUIDE.gemini = {
    guide: true, hash: '#huong-dan-gemini', icon: '#i-scan',
    kicker: 'Hướng dẫn · khoảng 2 phút', title: 'Lấy khoá Gemini miễn phí cho Quét đề',
    note: 'Quét đề dùng AI Gemini của Google để đọc đề và dựng hình. Thầy cô cần một <b>khoá Gemini miễn phí</b>, chỉ làm <b>một lần</b>.',
    steps: [
      { part: 'Phần 1. Lấy khoá trên Google AI Studio' },
      { h: 'Vào Google AI Studio', p: 'Mở trình duyệt, vào <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> và đăng nhập bằng Gmail. Nếu trang hiện ra là trang hướng dẫn như hình, bấm <b>Create or view a Gemini API Key</b>. Lần đầu vào, Google có thể hỏi đồng ý điều khoản: tích ô đồng ý rồi bấm tiếp.', img: 'gemini-1.png' },
      { h: 'Bấm Create API key', p: 'Ở trang <b>API Keys</b>, bấm <b>Create API key</b>.', img: 'gemini-2.png' },
      { h: 'Bấm Create key', p: 'Hộp <b>Create a new key</b> hiện ra. Giữ nguyên tên và dự án, bấm <b>Create key</b>.', img: 'gemini-3.png', mid: true },
      { h: 'Bấm Copy key để chép khoá', p: 'Hộp <b>API key details</b> hiện ra. Bấm <b>Copy key</b>.', tip: 'Không cần bấm “Set up billing”: gói Free tier miễn phí là đủ dùng. Khoá giống như mật khẩu, thầy cô đừng gửi cho người khác.', img: 'gemini-4.png', narrow: true },
      { part: 'Phần 2. Dán khoá vào GlassBox Ink' },
      { h: 'Mở GlassBox Ink, bấm tab AI', p: 'Tab <b>AI</b> nằm trên thanh công cụ (bản cũ: tab <b>Chèn</b>, số 5 trong hình).', img: 'gemini-5.png' },
      { h: 'Bấm Quét đề', p: 'Bấm <b>Quét đề</b> (số 6). Lần đầu, app hiện hộp <b>Khoá Gemini cho Quét đề</b>.' },
      { h: 'Dán khoá vào ô', p: 'Bấm vào ô <b>Dán khoá API Gemini</b>, nhấn <b>Ctrl + V</b> (trên Mac: <b>⌘ + V</b>).', img: 'gemini-6.png', mid: true },
      { h: 'Bấm Lưu', p: 'Ô <b>Mô hình AI</b> để nguyên. Vậy là xong.' },
    ],
    done: `<div><h3>Dùng Quét đề</h3>
      <p>Dán ảnh đề vào trang (chụp màn hình rồi nhấn <b>Ctrl + V</b>, hoặc <b>Chèn → Chèn ảnh</b>). Bấm <b>AI → Quét đề</b>, kéo khung quanh đề, chọn chép đề, dựng hình hay cả hai. App gửi vùng đã khoanh cho Gemini, đọc đề và dựng hình ngay trong sổ. Nhiều ảnh, cả trang đề: dùng <b>AI → Quét hàng loạt ảnh</b>.</p>
      <p>Muốn đổi khoá: nhấn <b>Ctrl + K</b> (Mac: <b>⌘ + K</b>), gõ “Khoá Gemini” rồi chọn lệnh <b>Khoá Gemini…</b></p></div>
      <div class="dlp-done-a"><a class="btn" href="#xem-app" data-dlp-close>Xem Quét đề chạy thật</a>
      <a class="btn ghost" href="https://zalo.me/g/bov0yustx6fiwfgeb471" target="_blank" rel="noopener">Hỏi nhóm Zalo</a></div>`,
  };
  // Claude (23/11/2026): hướng dẫn bật đồng bộ Google Drive. Ảnh dựng từ giao diện thật của app (không phải ảnh chụp có email thật).
  GUIDE.dongbo = {
    guide: true, hash: '#huong-dan-dong-bo', icon: '#i-cloud',
    kicker: 'Hướng dẫn · khoảng 1 phút', title: 'Bật đồng bộ Google Drive',
    note: 'Đồng bộ giúp <b>mọi máy dùng chung một bộ sổ</b> (máy ở nhà, máy ở trường…). Không bắt buộc, miễn phí, làm <b>một lần trên mỗi máy</b> với cùng một tài khoản Google.',
    steps: [
      { h: 'Mở bảng Đồng bộ trong app', p: 'Trong GlassBox Ink, bấm tab <b>Tệp</b> → <b>Đồng bộ đám mây</b> (nhóm Đám mây). Bảng Đồng bộ Google Drive hiện ra, bấm <b>Đăng nhập Google</b>.', img: 'drive-1-bang.png', mid: true },
      { h: 'Chọn tài khoản Google', p: 'Trình duyệt mở trang của Google. Chọn tài khoản Google của bạn (dùng cùng một tài khoản trên mọi máy).' },
      { h: 'TÍCH ô Google Drive rồi bấm Tiếp tục', p: 'Ở trang “GlassBox Ink muốn truy cập Tài khoản Google của bạn”, Google để <b>trống sẵn</b> ô Google Drive. Bạn <b>tích vào ô đó</b> như hình rồi bấm <b>Tiếp tục</b>.', tip: 'Quên tích ô này thì app chưa đồng bộ được: app sẽ báo và hướng dẫn bạn đăng nhập lại.', img: 'drive-2-tich.png', mid: true },
      { h: 'Quay lại app: xong', p: 'Trình duyệt báo đã đăng nhập, bạn quay lại GlassBox Ink. Chấm đám mây cạnh chữ <b>Đã lưu</b> chuyển xanh là sổ đã đồng bộ. Bấm vào chấm đó để xem tài khoản và mở thư mục <b>GlassBox Ink</b> trên Drive.', img: 'drive-3-xong.png', mid: true },
    ],
    done: `<div><h3>Dùng trên máy khác</h3>
      <p>Cài GlassBox Ink, đăng nhập Google bằng <b>đúng tài khoản đó</b> (nhớ tích ô Google Drive). App tự tải toàn bộ sổ về; từ đó các máy tự đồng bộ với nhau.</p>
      <p>Sổ nằm trong thư mục <b>GlassBox Ink</b> ở Drive của tôi. Thư mục con “Dữ liệu đồng bộ” là tệp kỹ thuật: bạn đừng sửa hay xoá tay. <a href="chinh-sach-rieng-tu.html">Chính sách quyền riêng tư</a></p></div>
      <div class="dlp-done-a"><a class="btn" href="#tai-ve" data-dlp-close>Tải GlassBox Ink</a>
      <a class="btn ghost" href="https://zalo.me/g/bov0yustx6fiwfgeb471" target="_blank" rel="noopener">Hỏi nhóm Zalo</a></div>`,
  };
  const GUIDE_OF_HASH = { '#huong-dan-gemini': 'gemini', '#huong-dan-dong-bo': 'dongbo' };
  const OS_OF_ASSET = { 'win-x64': 'win', 'mac-arm64': 'mac-arm', 'mac-x64': 'mac-intel' };

  const page = $('#dlp');
  if (!page) return;
  const stepsEl = $('[data-dlp-steps]', page);
  const doneEl = $('[data-dlp-done]', page);
  const doneDefault = doneEl.innerHTML;
  let curUrl = '', closeTimer = 0;

  function render(os) {
    const g = GUIDE[os];
    $('#dlpTitle').textContent = g.title;
    $('.dlp-os use', page).setAttribute('href', g.icon);
    $('[data-dlp-note]', page).innerHTML = g.note;
    stepsEl.innerHTML = g.steps.map((s, i) => s.part ? `<li class="part" style="--i:${i}"><span>${s.part}</span></li>` : `
      <li style="--i:${i}"><div class="dlp-card">
        <h3>${s.h}</h3><p>${s.p}</p>${s.tip ? `<p class="tip">${s.tip}</p>` : ''}
        ${s.img ? `<figure><img src="${IMG + s.img}" alt="${s.h.replace(/"/g, '')}" loading="lazy" class="${s.narrow ? 'narrow' : s.mid ? 'mid' : ''}"></figure>` : ''}
      </div></li>`).join('');
    doneEl.innerHTML = g.done || doneDefault;
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
    const g = GUIDE[os];
    if (g.guide) download = false;
    curUrl = g.asset ? assetUrl(g.asset) : '';
    page.classList.remove('started');
    page.classList.toggle('guide', !!g.guide);
    $('[data-dlp-state]', page).textContent = g.kicker || (download ? 'Đang tải xuống' : 'Hướng dẫn cài đặt');
    $('.dlp-sub', page).hidden = !download;
    page.hidden = false;
    document.documentElement.classList.add('dlp-lock');
    $('.dlp-scroll', page).scrollTop = 0;
    void page.offsetWidth;            // ép trình duyệt dựng vị trí đầu rồi mới trượt lên
    page.classList.add('open');
    if (push) history.pushState({ dlp: os }, '', GUIDE[os].hash || '#tai-' + os);
    if (download) setTimeout(startDownload, reduce ? 0 : 650);
    setTimeout(() => $('.dlp-back', page).focus({ preventScroll: true }), 600);
  }
  function close({ pop = false } = {}) {
    if (page.hidden) return;
    page.classList.remove('open');
    document.documentElement.classList.remove('dlp-lock');
    closeTimer = setTimeout(() => { page.hidden = true; }, reduce ? 0 : 560);
    if (!pop && /^#(tai-|huong-dan-)/.test(location.hash)) history.back();
  }

  // bấm nút tải (thẻ máy hoặc nút chính ở đầu trang)
  document.addEventListener('click', e => {
    const gl = e.target.closest('a[href^="#huong-dan-"]');
    const gk = gl && GUIDE_OF_HASH[gl.getAttribute('href')];
    if (gk) { e.preventDefault(); if (!page.hidden) { page.classList.remove('open'); history.replaceState(null, '', location.pathname + location.search); } open(gk); return; }
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
  addEventListener('hashchange', () => { const os = hashOs(); if (os && page.hidden) open(os, { download: false, push: false }); });
  addEventListener('popstate', () => {
    const os = hashOs();
    if (os) open(os, { download: false, push: false }); else close({ pop: true });
  });
  // mở thẳng link hướng dẫn (vd gửi cho thầy cô: glassboxink.io.vn/#tai-win)
  function hashOs() {
    if (GUIDE_OF_HASH[location.hash]) return GUIDE_OF_HASH[location.hash];
    const m = location.hash.match(/^#tai-(win|mac-arm|mac-intel)$/);
    return m ? m[1] : null;
  }
  const os0 = hashOs();
  if (os0) open(os0, { download: false, push: false });

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
