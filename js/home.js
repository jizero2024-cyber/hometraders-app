// 홈트 새 첫 화면 (2026-10-23, 시안 https://claude.ai/artifact/73p2e2adSEoEeCTJ7QnjHY)
// 맨 위 빨간 칸 = 기사 운임 미송금 (fare_unpaid — 맥 도우미가 출고일보 폴더 '기사_운임_미송금_정리' 엑셀에서 올림. '보냄' 누르면 엑셀 보냄 칸에 O)
// 버튼: 배차 요청 · 자료 넣기(site_inbox — 출고일보 업데이트 때 판매·구매입력) · 거래명세표(공간제작소 · 그 외 · 에이스) · 납품확인서 · 자재승인원 · 견적서 · 입금표
//   서류 화면은 모두 js/forms.js (같은 머리·카드·버튼)
import * as S from './store-supabase.js?v=7';
import * as FM from './forms.js?v=17';
import * as FL from './flow.js?v=42';   // 맨 위 출고 흐름 (10/28)

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = (n) => Math.round(Number(n) || 0).toLocaleString();
const H = { gwait: 0, fare: null, fareErr: '', inbox: {}, inboxErr: '', at: 0, loading: false, fareAll: false, toast: '', busy: false, box: false, text: '', frame: null };
let ctx = { rerender: () => {}, go: () => {}, me: () => '', helper: async () => ({}) };

const svg = (stroke, d) => `<svg viewBox="0 0 24 24" style="width:38px;height:38px;fill:none;stroke:${stroke};stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round">${d}</svg>`;
const IC = {
  truck: svg('#C2410C', '<path d="M2 7h11v9H2zM13 10h4l3 3v3h-7"></path><circle cx="6" cy="17.5" r="1.8"></circle><circle cx="16.5" cy="17.5" r="1.8"></circle>'),
  up: svg('#1D4F91', '<path d="M12 15V4M7 9l5-5 5 5"></path><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"></path>'),
  stmt: svg('#1E6B34', '<path d="M6 3h9l4 4v14H6z"></path><path d="M9 11h7M9 15h7M9 7h3"></path>'),
  deliv: svg('#1E6B34', '<path d="M6 3h9l4 4v14H6z"></path><path d="M9 13l2.2 2.2L16 10.5"></path>'),
  pack: svg('#5B3FA8', '<path d="M4 6h6l2 2h8v11H4z"></path><path d="M9 14l2 2 4-4"></path>'),
  won: svg('#B54708', '<rect x="3" y="6" width="18" height="12" rx="2"></rect><circle cx="12" cy="12" r="2.6"></circle><path d="M6.5 9v6M17.5 9v6"></path>'),
  sign: svg('#C2410C', '<path d="M6 3h9l4 4v14H6z"></path><path d="M9 15c1.5-2 2.5-2 3 0s1.5 2 3-1"></path><path d="M9 18h7"></path>'),
  quote: svg('#3F3F46', '<path d="M6 3h9l4 4v14H6z"></path><path d="M9 9h3M9 13h7M9 17h5"></path><path d="M15 3v4h4"></path>'),
};

export function load(force) {
  if (H.loading || (!force && Date.now() - H.at < 60000)) return;
  H.loading = true; H.at = Date.now();
  S.getGongganWaitCount().then((n) => { H.gwait = n; FL.setGwait(n); ctx.rerender(); }).catch(() => {});   // 공간 올릴 전표 (10/27)
  FL.load(force);
  Promise.allSettled([S.getFareUnpaid(), S.getInboxCounts()]).then(([f, i]) => {
    if (f.status === 'fulfilled') { H.fare = f.value; H.fareErr = ''; } else H.fareErr = f.reason.message;
    if (i.status === 'fulfilled') { H.inbox = i.value; H.inboxErr = ''; } else H.inboxErr = i.reason.message;
  }).finally(() => { H.loading = false; ctx.rerender(); });
}

const FARE_SHEET = 'https://docs.google.com/spreadsheets/d/1UoXiU_raLj5wtT24I3VsRdG-j9XPbcQF/edit';   // 기사 운임 미송금 정리 — 늘 이 파일 하나만 고침, 링크 고정 (10/23 대표)
const BOARD_SHEET = 'https://docs.google.com/spreadsheets/d/1yBcId-iFWtdmt_og2rA71mbmnicyvoZI/edit';   // 드라이브 홈트레이더스_출고일보/출고일보/출고일보.xlsx — build_board 가 같은 파일을 덮어써서 링크 고정 (10/23 대표 바로가기)
function top(back) {
  return `<header class="hm-top"><div class="hm-in">
    ${back ? `<button type="button" class="hm-back" data-hm="go" data-r="${back}">‹</button>` : ''}
    <img src="./icons/logo-full.png" alt="HOME TRADERS" class="hm-logo" data-hm="go" data-r="main">
    ${fareBadge()}
    <span class="sp"></span><a class="hm-sheet" href="${BOARD_SHEET}" target="_blank" rel="noopener">출고일보 ↗</a><b class="hm-me">${esc(ctx.me())}</b>
    <button type="button" class="hm-link" data-hm="go" data-r="start">처음 화면</button></div></header>`;
}

function fareBadge() {   // 운송비 미송금 — 위쪽 배지, 누르면 펼침 (10/28 대표 "하단에 계속 안 붙어 다녀도 돼")
  const n = (H.fare || []).filter((r) => !r.sent).length;
  return n ? `<button type="button" class="hm-farebtn" data-hm="fare-open">운송비 미송금<span>${n}</span></button>` : `<a class="hm-sheet fare" href="${FARE_SHEET}" target="_blank" rel="noopener">운송비 ↗</a>`;
}
function farePanel() {
  if (H.fareErr || !H.fareOpen) return '';
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
    <div class="hm-fh"><b>운송비 미송금</b><span>${list.length}건 · ${won(sum)}원</span><a class="hm-more" href="${FARE_SHEET}" target="_blank" rel="noopener">엑셀 ↗</a><span class="sp"></span>
      ${list.length > 5 ? `<button type="button" class="hm-more" data-hm="fare-all">${H.fareAll ? '접기 ▴' : `전체 ${list.length}건 ▾`}</button>` : ''}</div>
    <div class="hm-fl">${show.map(row).join('')}</div></section>`;
}


function tile(o) {
  return `<${o.tag || 'button'} ${o.tag === 'label' ? '' : 'type="button"'} class="hm-tile ${o.cls || ''}" ${o.attr || ''}>
    ${o.badge ? `<span class="hm-badge" style="${o.badgeStyle || ''}">${o.badge}</span>` : ''}
    <span class="hm-ic" style="background:${o.bg}">${o.icon}</span><b>${o.title}</b>${o.sub ? `<span class="hm-sub">${o.sub}</span>` : ''}${o.extra || ''}</${o.tag || 'button'}>`;
}

// 배차 요청 · 입금표 팝업 (10/23 대표) — 이미 있는 화면(/homt · deposit.html)을 창으로 띄움 (?embed=1 = 위 줄 없이).
//   첫 화면은 자주 다시 그려져서(미송금·대기함 새로고침) 창을 그 안에 두면 매번 새로 열려 깜빡임 → body 에 따로 붙임
function closeFrame() { const ov = document.querySelector('.hm-frame-ov'); if (ov) ov.remove(); H.frame = null; }
function openFrame(title, src) {
  closeFrame();
  const ov = document.createElement('div');
  ov.className = 'hm-ov hm-frame-ov';
  ov.innerHTML = `<div class="hm-frame" role="dialog" aria-label="${esc(title)}">
    <div class="hm-mh"><b>${esc(title)}</b><button type="button" class="hm-x" data-x="1" aria-label="닫기">✕</button></div>
    <iframe src="${esc(src)}" title="${esc(title)}"></iframe></div>`;
  ov.addEventListener('click', (e) => { if (e.target === ov || e.target.closest('[data-x]')) closeFrame(); });
  document.body.appendChild(ov);
  H.frame = { title, src };
}

function boxModal() {   // 자료 넣기 — 카톡 글 붙여넣기 칸 + 파일 (휴대폰은 Cmd+V 가 없어서)
  if (!H.box) return '';
  return `<div class="hm-ov" data-hm="box-bg"><div class="hm-modal" role="dialog" aria-label="자료 넣기">
    <div class="hm-mh"><b>자료 넣기</b><button type="button" class="hm-x" data-hm="box-close" aria-label="닫기">✕</button></div>
    <textarea id="hm-text" class="fm-ta" rows="7" placeholder="카톡 글 붙여넣기">${esc(H.text)}</textarea>
    <div class="fm-row"><button type="button" class="fm-btn ghost" data-hm="pick">파일 고르기</button><span class="sp"></span>
      <button type="button" class="fm-btn" data-hm="put" ${H.busy ? 'disabled' : ''}>넣기</button></div></div></div>`;
}

export function screen(view) {
  load();
  if (view === 'stmt') {   // 거래명세표 고르기 — 공간제작소 · 그 외 · 에이스 (10/23 대표)
    return `<div class="hm">${top('main')}<main class="hm-main"><h1 class="hm-h1">거래명세표</h1>
      <div class="hm-grid3">
        ${tile({ title: '공간제작소 거래명세표', icon: '<img src="./icons/partner-gongan.png" alt="" style="width:62px;height:auto">', bg: '#FFF6D6', cls: 'big', attr: 'data-hm="form" data-r="stmt-gong"' })}
        ${tile({ title: '그 외 명세표', icon: IC.stmt, bg: '#EEF6EE', cls: 'big', attr: 'data-hm="form" data-r="stmt-etc"' })}
        ${tile({ title: '에이스 거래명세표', icon: IC.stmt, bg: '#F3F4F6', cls: 'big', attr: 'data-hm="form" data-r="stmt-ace"' })}
      </div></main>${FM.popup()}</div>`;
  }
  const wait = (H.inbox.wait || 0) + (H.inbox.got || 0), chk = H.inbox.check || 0;
  return `<div class="hm">${top('')}<div class="hm-body">${sideHtml()}<main class="hm-main">
    ${FL.main({ fare: H.fare || [], inbox: wait + chk })}${farePanel()}</main></div>${quickHtml(wait, chk)}${boxModal()}${FM.popup()}<input type="file" id="hm-file" multiple accept="image/*,.heic,.pdf,.xlsx,.xls,.csv,.txt" hidden></div>`;
}

// 사이드바 (10/28 대표) — 오늘 마감(출고 흐름과 합침) · 견적 요청 · 서류 변환 · 전표 확인 · 거래처. 자료 넣기는 오른쪽 아래 퀵메뉴로
function sideHtml() {
  const c = FL.counts(), v = FL.view(), n = (k) => (k ? `<b>${k}</b>` : '');
  const it = (lab, attr, on, badge, cls) => `<button type="button" class="hm-si ${on ? 'on' : ''} ${cls || ''}" ${attr}><span>${lab}</span>${badge || ''}</button>`;
  return `<nav class="hm-side" aria-label="메뉴">
    ${it('오늘 마감', 'data-hm="fv" data-v="flow"', v === 'flow', n(FL.closeItems({ fare: H.fare || [], inbox: (H.inbox.wait || 0) + (H.inbox.got || 0) + (H.inbox.check || 0) }).filter((i) => i.n).length))}
    ${it('견적 요청', 'data-hm="fv" data-v="견적"', v === '견적', n(c.quote))}
    <div class="hm-sg">서류 변환</div>
    ${it('거래명세표', 'data-hm="go" data-r="stmt"', false, '', 'sub')}
    ${it('납품확인서', 'data-hm="form" data-r="deliv"', false, '', 'sub')}
    ${it('자재승인원', 'data-hm="form" data-r="approval"', false, '', 'sub')}
    ${it('입금표', 'data-hm="frame" data-src="./deposit.html?embed=1" data-title="입금표"', false, '', 'sub')}
    <div class="hm-sg">전표 확인</div>
    ${it('입력 누락', 'data-hm="fv" data-v="누락"', v === '누락', n(c.miss + c.missOld), 'sub')}
    ${it('입력 완료', 'data-hm="fv" data-v="완료"', v === '완료', '', 'sub')}
    ${it('전체보기', 'data-hm="fv" data-v="기록"', v === '기록', '', 'sub')}
    <div class="hm-sg">거래처</div>
    <a class="hm-si sub" href="/gonggan/"><span>공간 협업툴</span>${n(H.gwait)}</a>
    ${it('뉴하우징 협업툴', 'disabled', false, '<i>준비중</i>', 'sub off')}
  </nav>`;
}
// 퀵메뉴 — 자료 넣기(끌어다 놓기·붙여넣기도 여기로) · 배차 요청 · 전자 송장 · 견적서
function quickHtml(wait, chk) {
  return `<div class="hm-quick ${H.quick ? 'open' : ''}">
    ${H.quick ? `<div class="hm-qm">
      <button type="button" data-hm="box">자료 넣기${chk ? ` <b class="r">확인 ${chk}</b>` : wait ? ` <b>대기 ${wait}</b>` : ''}</button>
      <button type="button" data-hm="frame" data-src="/homt?embed=1" data-title="배차 요청">배차 요청</button>
      <button type="button" data-hm="form" data-r="esong">전자 송장</button>
      <button type="button" data-hm="form" data-r="quote">견적서</button></div>` : ''}
    <button type="button" class="hm-qb" id="hm-drop" data-hm="quick" aria-label="퀵메뉴">${H.quick ? '✕' : '＋'}</button>
    ${H.toast ? `<span class="hm-toast">${esc(H.toast)}</span>` : ''}</div>`;
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
  if (!err) { H.box = false; H.text = ''; }
  H.toast = err ? `못 넣었어요 — ${err}` : `${ok}건 넣었어요`;
  load(true);
  setTimeout(() => { H.toast = ''; ctx.rerender(); }, 4000);
}

export function bind(app, c) {
  ctx = c;
  FL.bind(app, { rerender: () => ctx.rerender(), openFrame, go: (r) => ctx.go(r), me: () => ctx.me(),
    home: (k) => { if (k === 'fare') { H.fareOpen = true; ctx.rerender(); setTimeout(() => { const x = document.querySelector('.hm-fare'); if (x) x.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 0); } else { H.box = true; ctx.rerender(); } } });
  const on = () => app.querySelector('.hm');
  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-hm]'); if (!t || !on()) return;
    const a = t.dataset.hm;
    if (a === 'go') { FM.open(''); closeFrame(); ctx.go(t.dataset.r, t.dataset.mode); }   // 화면을 옮기면 열린 팝업은 닫음
    else if (a === 'fv') { FL.setView(t.dataset.v); H.quick = false; ctx.rerender(); }
    else if (a === 'quick') { H.quick = !H.quick; ctx.rerender(); }
    else if (a === 'fare-all') { H.fareAll = !H.fareAll; ctx.rerender(); }
    else if (a === 'fare-open') { H.fareOpen = !H.fareOpen; ctx.rerender(); if (H.fareOpen) setTimeout(() => { const x = document.querySelector('.hm-fare'); if (x) x.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 0); }
    else if (a === 'sent') {
      const r = (H.fare || []).find((x) => x.id === t.dataset.id); if (!r) return;
      if (!confirm(`${r.driver} ${r.amount ? won(r.amount) + '원' : ''} — 보냄으로 표시할까요?`)) return;
      S.markFareSent(r.id, ctx.me()).then((err) => { if (err) alert('저장 못 했어요 — ' + err); else { r.sent = true; ctx.rerender(); } });
    }
    else if (a === 'form') { FM.open(t.dataset.r); ctx.rerender(); }   // 서류는 모두 팝업 (10/23 대표) — 주소(/deliv · /quote …)로 열면 전체 화면
    else if (a === 'frame') openFrame(t.dataset.title, t.dataset.src);
    else if (a === 'box') { H.quick = false; H.box = true; ctx.rerender(); setTimeout(() => { const x = document.getElementById('hm-text'); if (x) x.focus(); }, 0); }
    else if (a === 'box-close' || (a === 'box-bg' && e.target === t)) { H.box = false; ctx.rerender(); }
    else if (a === 'pick') document.getElementById('hm-file').click();
    else if (a === 'put') { const v = (document.getElementById('hm-text') || {}).value || ''; if (v.trim()) putInbox([v]); }
  });
  app.addEventListener('input', (e) => { if (e.target.id === 'hm-text') H.text = e.target.value; });
  app.addEventListener('change', (e) => {
    if (!on()) return;
    if (e.target.id === 'hm-file') { putInbox([...e.target.files]); e.target.value = ''; }
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
    if (!app.querySelector('#hm-drop') || app.querySelector('.fm-pop') || H.frame || e.target.closest('input, textarea, [contenteditable]')) return;
    const files = [...(e.clipboardData.files || [])], text = e.clipboardData.getData('text/plain');
    if (files.length || text.trim()) { e.preventDefault(); putInbox(files.length ? files : [text]); }
  });
}
