// 홈트 새 첫 화면 (2026-10-23, 시안 https://claude.ai/artifact/73p2e2adSEoEeCTJ7QnjHY)
// 맨 위 빨간 칸 = 기사 운임 미송금 (fare_unpaid — 맥 도우미가 출고일보 폴더 '기사_운임_미송금_정리' 엑셀에서 올림. '보냄' 누르면 엑셀 보냄 칸에 O)
// 버튼: 배차 요청 · 자료 넣기(site_inbox — 출고일보 업데이트 때 판매·구매입력) · 거래명세표(공간제작소 명세 / 그 외 명세) · 납품확인서 · 자재승인원 · 그 밖의 서류
import * as S from './store-supabase.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = (n) => Math.round(Number(n) || 0).toLocaleString();
const H = { fare: null, fareErr: '', inbox: {}, inboxErr: '', at: 0, loading: false, fareAll: false, toast: '', busy: false, pack: null };
let ctx = { rerender: () => {}, go: () => {}, me: () => '', helper: async () => ({}) };

const svg = (stroke, d) => `<svg viewBox="0 0 24 24" style="width:38px;height:38px;fill:none;stroke:${stroke};stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round">${d}</svg>`;
const IC = {
  truck: svg('#C2410C', '<path d="M2 7h11v9H2zM13 10h4l3 3v3h-7"></path><circle cx="6" cy="17.5" r="1.8"></circle><circle cx="16.5" cy="17.5" r="1.8"></circle>'),
  up: svg('#1D4F91', '<path d="M12 15V4M7 9l5-5 5 5"></path><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"></path>'),
  stmt: svg('#1E6B34', '<path d="M6 3h9l4 4v14H6z"></path><path d="M9 11h7M9 15h7M9 7h3"></path>'),
  deliv: svg('#1E6B34', '<path d="M6 3h9l4 4v14H6z"></path><path d="M9 13l2.2 2.2L16 10.5"></path>'),
  pack: svg('#5B3FA8', '<path d="M4 6h6l2 2h8v11H4z"></path><path d="M9 14l2 2 4-4"></path>'),
  more: svg('#3F3F46', '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"></rect><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"></rect><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"></rect><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"></rect>'),
};
const PRESETS = ['오웬스'];   // 드라이브 자재승인원/make_pack.py PRESETS 와 같게

export function load(force) {
  if (H.loading || (!force && Date.now() - H.at < 60000)) return;
  H.loading = true; H.at = Date.now();
  Promise.allSettled([S.getFareUnpaid(), S.getInboxCounts()]).then(([f, i]) => {
    if (f.status === 'fulfilled') { H.fare = f.value; H.fareErr = ''; } else H.fareErr = f.reason.message;
    if (i.status === 'fulfilled') { H.inbox = i.value; H.inboxErr = ''; } else H.inboxErr = i.reason.message;
  }).finally(() => { H.loading = false; ctx.rerender(); });
}

function top(back) {
  return `<header class="hm-top"><div class="hm-in">
    ${back ? `<button type="button" class="hm-back" data-hm="go" data-r="${back}">‹</button>` : ''}
    <img src="./icons/logo-full.png" alt="HOME TRADERS" class="hm-logo" data-hm="go" data-r="main">
    <span class="sp"></span><b class="hm-me">${esc(ctx.me())}</b>
    <button type="button" class="hm-link" data-hm="go" data-r="start">처음 화면</button></div></header>`;
}

function farePanel() {
  if (H.fareErr) return '';
  const list = (H.fare || []).filter((r) => !r.sent);
  if (!list.length) return '';
  const sum = list.reduce((a, r) => a + (Number(r.amount) || 0), 0);
  const show = H.fareAll ? list : list.slice(0, 5);
  const row = (r) => `<div class="hm-fr">
      <span class="hm-urg">${esc(r.urgent)}</span>
      <span class="hm-who"><b>${esc(r.driver)}</b><a href="tel:${esc(r.phone)}">${esc(r.phone)}</a></span>
      <span class="hm-job">${esc(r.job)}</span>
      <span class="hm-amt">${r.amount ? won(r.amount) + '원' : '금액 확인'}</span>
      <span class="hm-acc">${r.account ? `${esc(r.bank)} <b>${esc(r.account)}</b> ${esc(r.holder)}` : `<i>${esc(r.todo || '계좌 받기')}</i>`}</span>
      <button type="button" class="hm-sent" data-hm="sent" data-id="${esc(r.id)}">보냄</button></div>`;
  return `<section class="hm-fare">
    <div class="hm-fh"><b>운송비 미송금</b><span>${list.length}건 · ${won(sum)}원</span><span class="sp"></span>
      ${list.length > 5 ? `<button type="button" class="hm-more" data-hm="fare-all">${H.fareAll ? '접기 ▴' : `전체 ${list.length}건 ▾`}</button>` : ''}</div>
    <div class="hm-fl">${show.map(row).join('')}</div></section>`;
}


function tile(o) {
  return `<${o.tag || 'button'} ${o.tag === 'label' ? '' : 'type="button"'} class="hm-tile ${o.cls || ''}" ${o.attr || ''}>
    ${o.badge ? `<span class="hm-badge" style="${o.badgeStyle || ''}">${o.badge}</span>` : ''}
    <span class="hm-ic" style="background:${o.bg}">${o.icon}</span><b>${o.title}</b>${o.sub ? `<span class="hm-sub">${o.sub}</span>` : ''}${o.extra || ''}</${o.tag || 'button'}>`;
}

function packModal() {
  const p = H.pack;
  if (!p) return '';
  return `<div class="hm-ov" data-hm="pack-close-bg"><div class="hm-modal" role="dialog" aria-label="자재승인원">
    <div class="hm-mh"><b>자재승인원</b><button type="button" class="hm-x" data-hm="pack-close" aria-label="닫기">✕</button></div>
    <label>제조사<select data-hm-in="preset">${PRESETS.map((x) => `<option ${p.preset === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
    <label>현장명<input data-hm-in="site" value="${esc(p.site)}" placeholder="단양 단성중학교 (명산종합건재·주성건설)"></label>
    <label>출고일자<input data-hm-in="dates" value="${esc(p.dates)}" placeholder="2026-10-06"></label>
    <label>납품확인서 PDF<input type="file" id="hm-pack-file" accept=".pdf,application/pdf"></label>
    ${p.fileName ? `<div class="hm-ok">${esc(p.fileName)}</div>` : ''}
    ${p.err ? `<div class="hm-err">${esc(p.err)}</div>` : ''}
    <button type="button" class="hm-go" data-hm="pack-make" ${p.busy ? 'disabled' : ''}>${p.busy ? '만드는 중…' : 'PDF 만들기'}</button></div></div>`;
}

export function screen(view) {
  load();
  if (view === 'stmt') {
    return `<div class="hm">${top('main')}<main class="hm-main"><h1 class="hm-h1">거래명세표</h1>
      <div class="hm-grid2">
        ${tile({ title: '공간제작소 명세', icon: '<img src="./icons/partner-gongan.png" alt="" style="width:62px;height:auto">', bg: '#FFF6D6', cls: 'big', attr: 'data-hm="go" data-r="gonggan"' })}
        ${tile({ title: '그 외 명세', icon: IC.stmt, bg: '#EEF6EE', cls: 'big', sub: '이카운트 엑셀 · 전표 링크', attr: 'data-hm="go" data-r="chat" data-mode="stmt"' })}
      </div></main></div>`;
  }
  const wait = (H.inbox.wait || 0) + (H.inbox.got || 0), chk = H.inbox.check || 0;
  return `<div class="hm">${top('')}<main class="hm-main">
    ${farePanel()}
    <div class="hm-grid">
      ${tile({ title: '배차 요청', icon: IC.truck, bg: '#FDF0E6', attr: 'data-hm="go" data-r="homt"' })}
      ${tile({ tag: 'label', title: '자료 넣기', icon: IC.up, bg: '#EAF1FB', cls: 'drop wide', sub: '카톡 글 · 거래명세표 · 발주서 · 사진 · PDF · 엑셀 — 끌어다 놓기 · Cmd+V',
        badge: chk ? `확인 ${chk}` : wait ? `대기 ${wait}` : '', badgeStyle: chk ? 'background:#D92D20' : 'background:#1D4F91', attr: 'id="hm-drop"',
        extra: `<input type="file" id="hm-file" multiple accept="image/*,.heic,.pdf,.xlsx,.xls,.csv,.txt" hidden>${H.toast ? `<span class="hm-toast">${esc(H.toast)}</span>` : ''}` })}
      ${tile({ title: '거래명세표', icon: IC.stmt, bg: '#EEF6EE', attr: 'data-hm="go" data-r="stmt"' })}
      ${tile({ title: '납품확인서', icon: IC.deliv, bg: '#EEF6EE', attr: 'data-hm="go" data-r="chat" data-mode="deliv"' })}
      ${tile({ title: '자재승인원', icon: IC.pack, bg: '#F2EEFB', attr: 'data-hm="pack"' })}
      ${tile({ title: '그 밖의 서류', icon: IC.more, bg: '#F3F4F6', cls: 'wide', sub: '구매명세표 · 에이스명세표 · 견적서 · 입금표', attr: 'data-hm="go" data-r="chat"' })}
    </div></main>${packModal()}</div>`;
}

// ── 자료 넣기 ─────────────────────────────────────────
const readUrl = (f) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(r.error); r.readAsDataURL(f); });
async function shrink(f) {   // 큰 사진은 2200px JPEG 로 (공유 DB 용량)
  if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size < 1.5e6) return { data: await readUrl(f), mime: f.type };
  const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(f); });
  const k = Math.min(1, 2200 / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return { data: c.toDataURL('image/jpeg', 0.85), mime: 'image/jpeg' };
}
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
async function putInbox(items) {
  if (!items.length || H.busy) return;
  H.busy = true; H.toast = '올리는 중…'; ctx.rerender();
  let ok = 0, err = '';
  for (const it of items) {
    try {
      const row = { id: newId(), created_by: ctx.me(), status: 'wait' };
      if (typeof it === 'string') Object.assign(row, { kind: 'text', name: it.trim().split('\n')[0].slice(0, 60), body: it });
      else {
        if (it.size > 8e6 && !/^image\//.test(it.type)) { err = `${it.name}: 8MB 넘는 파일은 못 올려요`; continue; }
        const { data, mime } = await shrink(it);
        Object.assign(row, { kind: 'file', name: it.name || '붙여넣은 사진.png', mime: mime || it.type, data });
      }
      const e = await S.addInbox(row);
      if (e) err = e; else ok += 1;
    } catch (e) { err = e.message || String(e); }
  }
  H.busy = false;
  H.toast = err ? `못 넣었어요 — ${err}` : `${ok}건 넣었어요`;
  load(true);
  setTimeout(() => { H.toast = ''; ctx.rerender(); }, 4000);
}

async function makePack() {
  const p = H.pack;
  if (!p.site.trim() || !p.file) { p.err = '현장명과 납품확인서 PDF 를 넣어 주세요'; ctx.rerender(); return; }
  p.busy = true; p.err = ''; ctx.rerender();
  try {
    const j = await ctx.helper('/api/approval/make', { preset: p.preset, site: p.site.trim(), dates: p.dates.match(/20\d\d-\d\d-\d\d/g) || [],
      deliv: { name: p.file.name, data: (await readUrl(p.file)).split(',')[1] } });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([Uint8Array.from(atob(j.data), (c) => c.charCodeAt(0))], { type: 'application/pdf' }));
    a.download = j.name; a.click();
    H.pack = null;
  } catch (e) { p.err = /fetch|network/i.test(e.message) ? '사무실 맥 도우미가 켜져 있어야 만들 수 있어요' : e.message; p.busy = false; }
  ctx.rerender();
}

export function bind(app, c) {
  ctx = c;
  const on = () => app.querySelector('.hm');
  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-hm]'); if (!t || !on()) return;
    const a = t.dataset.hm;
    if (a === 'go') ctx.go(t.dataset.r, t.dataset.mode);
    else if (a === 'fare-all') { H.fareAll = !H.fareAll; ctx.rerender(); }
    else if (a === 'sent') {
      const r = (H.fare || []).find((x) => x.id === t.dataset.id); if (!r) return;
      if (!confirm(`${r.driver} ${r.amount ? won(r.amount) + '원' : ''} — 보냄으로 표시할까요?`)) return;
      S.markFareSent(r.id, ctx.me()).then((err) => { if (err) alert('저장 못 했어요 — ' + err); else { r.sent = true; ctx.rerender(); } });
    }
    else if (a === 'pack') { H.pack = { preset: PRESETS[0], site: '', dates: '', file: null, fileName: '', err: '', busy: false }; ctx.rerender(); }
    else if (a === 'pack-close' || (a === 'pack-close-bg' && e.target === t)) { H.pack = null; ctx.rerender(); }
    else if (a === 'pack-make') makePack();
  });
  app.addEventListener('input', (e) => { const k = e.target.dataset && e.target.dataset.hmIn; if (k && H.pack) H.pack[k] = e.target.value; });
  app.addEventListener('change', (e) => {
    if (!on()) return;
    const k = e.target.dataset && e.target.dataset.hmIn; if (k && H.pack) { H.pack[k] = e.target.value; return; }
    if (e.target.id === 'hm-file') { putInbox([...e.target.files]); e.target.value = ''; }
    if (e.target.id === 'hm-pack-file' && H.pack) { H.pack.file = e.target.files[0] || null; H.pack.fileName = H.pack.file ? H.pack.file.name : ''; ctx.rerender(); }
  });
  app.addEventListener('dragover', (e) => { const d = e.target.closest && e.target.closest('#hm-drop'); if (d) { e.preventDefault(); d.classList.add('over'); } });
  app.addEventListener('dragleave', (e) => { const d = e.target.closest && e.target.closest('#hm-drop'); if (d) d.classList.remove('over'); });
  app.addEventListener('drop', (e) => {
    const d = e.target.closest && e.target.closest('#hm-drop'); if (!d) return;
    e.preventDefault(); d.classList.remove('over');
    const files = [...(e.dataTransfer.files || [])], text = e.dataTransfer.getData('text/plain');
    putInbox(files.length ? files : text.trim() ? [text] : []);
  });
  document.addEventListener('paste', (e) => {   // 첫 화면에서 Cmd+V = 자료 넣기 (입력칸 안은 제외)
    if (!app.querySelector('#hm-drop') || H.pack || e.target.closest('input, textarea, [contenteditable]')) return;
    const files = [...(e.clipboardData.files || [])], text = e.clipboardData.getData('text/plain');
    if (files.length || text.trim()) { e.preventDefault(); putInbox(files.length ? files : [text]); }
  });
}
