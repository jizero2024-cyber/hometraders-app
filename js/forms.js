// 간단 서류 화면 (10/23 대표 — "자재승인원처럼 필요한 버튼과 입력란만, 수동 수정란")
//   stmt-gong 공간제작소 · stmt-etc 그 외 · stmt-ace 에이스 거래명세표 : 출고일보 전표 링크·이카운트 판매 엑셀 → 거래명세표 (js/stmt.js), 현장명·품명 손으로 고침
//   deliv     납품확인서 : 전표 링크·판매 엑셀·우리 견적서 엑셀·사진/PDF(도우미) → 납품확인서 (js/delivery.js), 칸마다 손으로 고침
import * as SM from './stmt.js';
import * as DL from './delivery.js';

export const ROUTES = ['stmt-gong', 'stmt-etc', 'stmt-ace', 'deliv'];
const ST = { 'stmt-gong': ['공간제작소 거래명세표', 'homt'], 'stmt-etc': ['그 외 명세표', 'homt'], 'stmt-ace': ['에이스 거래명세표', 'ace'] };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = (n) => Math.round(Number(n) || 0).toLocaleString();
const isGong = (p) => String(p || '').includes('공간제작소');
const blank = () => ({ text: '', files: [], docs: null, err: '', busy: false });
const F = { 'stmt-gong': blank(), 'stmt-etc': blank(), 'stmt-ace': blank(), deliv: { ...blank(), confirms: null } };
let ctx = { rerender: () => {}, go: () => {}, me: () => '', helper: async () => ({}), helperUp: () => false, slips: async () => ({ slips: [] }) };

function top(title, right) {
  return `<header class="hm-top"><div class="hm-in">
    <button type="button" class="hm-back" data-fm="go" data-r="${title === '납품확인서' ? 'main' : 'stmt'}">‹</button>
    <img src="./icons/logo-full.png" alt="HOME TRADERS" class="hm-logo" data-fm="go" data-r="main">
    <span class="sp"></span>${right || ''}<b class="hm-me">${esc(ctx.me())}</b></div></header>`;
}
function inputCard(f, accept, extra) {
  return `<section class="fm-in">
    <textarea id="fm-text" rows="3" placeholder="출고일보 전표 링크 붙여넣기">${esc(f.text)}</textarea>
    <div class="fm-row">
      <button type="button" class="fm-btn ghost" data-fm="pick">파일 고르기</button><input type="file" id="fm-file" multiple accept="${accept}" hidden>
      ${f.files.map((x, i) => `<span class="fm-file">${esc(x.name)}<button type="button" data-fm="unpick" data-i="${i}" aria-label="빼기">✕</button></span>`).join('')}
      <span class="sp"></span>${extra || ''}
      <button type="button" class="fm-btn" data-fm="load" ${f.busy ? 'disabled' : ''}>${f.busy ? '읽는 중…' : '불러오기'}</button>
    </div>${f.err ? `<div class="hm-err">${esc(f.err)}</div>` : ''}</section>`;
}

// ── 거래명세표 ─────────────────────────────────────────
function stmtScreen(route) {
  const f = F[route], gong = route === 'stmt-gong', [title] = ST[route];
  const docs = f.docs || [];
  const sum = docs.reduce((a, d) => a + d.items.reduce((b, x) => b + x.supply + x.vat, 0), 0);
  const list = !docs.length ? (f.docs ? '<div class="fm-empty">만들 명세표가 없어요</div>' : '') : `<section class="fm-out">
    <div class="fm-oh"><b>${docs.length}장</b><span>${won(sum)}원</span><span class="sp"></span>
      <button type="button" class="fm-btn" data-fm="st-pdf">전부 인쇄 · PDF</button><button type="button" class="fm-btn ghost" data-fm="st-img">전부 이미지</button></div>
    ${docs.map((d, i) => `<div class="fm-doc">
      <div class="fm-dh"><span class="fm-date">${d.ymd.slice(4, 6)}/${d.ymd.slice(6)}</span><span class="fm-slip">${esc(d.slip)}</span>${gong ? '' : `<b>${esc(d.partner)}</b>`}
        <input class="fm-site" data-fm-site="${i}" value="${esc(d.site || '')}" placeholder="현장명"><span class="sp"></span>
        <b class="fm-amt">${won(d.items.reduce((a, x) => a + x.supply + x.vat, 0))}원</b>
        <button type="button" class="fm-btn sm" data-fm="st-pdf" data-i="${i}">PDF</button><button type="button" class="fm-btn sm ghost" data-fm="st-img" data-i="${i}">이미지</button></div>
      ${d.items.map((x, k) => `<div class="fm-it"><input data-fm-item="${i}" data-k="${k}" value="${esc(x.name)}"><span>${won(x.qty)}</span><span>${won(x.supply / x.qty)}</span><span>${won(x.supply)}</span></div>`).join('')}
    </div>`).join('')}</section>`;
  return `<div class="hm fm">${top(title, gong ? '<button type="button" class="hm-link" data-fm="go" data-r="gonggan">BMS ›</button>' : '')}
    <main class="hm-main"><h1 class="hm-h1">${title}</h1>
    ${inputCard(f, '.xlsx,.xlsm,.xls')}${list}</main></div>`;
}

async function loadStmt(route) {
  const f = F[route];
  const text = f.text.trim();
  if (!text && !f.files.length) { f.err = '전표 링크를 붙여넣거나 판매 엑셀을 골라 주세요'; ctx.rerender(); return; }
  f.busy = true; f.err = ''; ctx.rerender();
  const vouchers = [], errs = [];
  try {
    if (text) {
      const r = await ctx.slips(text);
      (r.slips || []).filter((s) => s.error).forEach((s) => errs.push(s.error));
      const sale = (r.slips || []).filter((s) => s.rows && s.rows.length && s.kind !== '구매');
      if (sale.length) vouchers.push(...SM.parseSales([[r.head, ...sale.flatMap((s) => s.rows)]]));
    }
    for (const x of f.files) {
      try { vouchers.push(...SM.parseSales(await SM.readSheets(x.file))); } catch (e) { errs.push(`${x.name}: ${e.message || e}`); }
    }
    let docs = vouchers.length ? SM.splitSheets(vouchers, {}) : [];
    docs = docs.filter((d) => (route === 'stmt-gong' ? isGong(d.partner) : true));
    f.docs = docs;
    if (!docs.length && route === 'stmt-gong' && vouchers.length) errs.push('공간제작소 전표가 아니에요');
  } catch (e) { errs.push(e.message || String(e)); }
  f.err = errs.join(' · '); f.busy = false; ctx.rerender();
}

// ── 납품확인서 ─────────────────────────────────────────
const COLS = [['brand', '브랜드', 90], ['use', '용도', 80], ['prod', '품명', 0], ['grade', '등급', 70], ['qty', '수량', 70], ['unit', '단위', 70], ['note', '비고', 180]];
function delivScreen() {
  const f = F.deliv, cs = f.confirms || [];
  const card = (c, i) => `<div class="fm-doc">
    <div class="fm-grid">
      <label>납품일<input type="date" data-fm-c="${i}" data-k="date" value="${esc(c.date)}"></label>
      <label class="w2">납품처<input data-fm-c="${i}" data-k="place" value="${esc(c.place)}"></label>
      <label class="w2">납품 내용<input data-fm-c="${i}" data-k="what" value="${esc(c.what)}"></label>
      <button type="button" class="fm-btn sm ghost" data-fm="dv-del" data-i="${i}">장 지우기</button>
    </div>
    <div class="fm-tab"><div class="fm-th">${COLS.map(([, l]) => `<span>${l}</span>`).join('')}<span></span></div>
      ${c.rows.map((r, k) => { const x = DL.itemCols(r); return `<div class="fm-tr">${COLS.map(([key]) => `<input data-fm-r="${i}" data-k="${k}" data-f="${key}" value="${esc(key === 'qty' ? r.qty : x[key])}"${key === 'qty' ? ' inputmode="decimal"' : ''}>`).join('')}
        <button type="button" class="fm-x" data-fm="dv-rdel" data-i="${i}" data-k="${k}" aria-label="줄 지우기">✕</button></div>`; }).join('')}
      <button type="button" class="fm-add" data-fm="dv-radd" data-i="${i}">＋ 줄</button></div>
  </div>`;
  const out = !cs.length ? (f.confirms ? '<div class="fm-empty">인슐레이션·방수시트·타이벡 품목이 없어요</div>' : '') : `<section class="fm-out">
    <div class="fm-oh"><b>${cs.length}장</b><span class="sp"></span>
      <label class="fm-btn ghost" for="fm-stamp">${DL.getStamp() ? '도장 바꾸기' : '도장 고르기'}</label><input type="file" id="fm-stamp" accept="image/*" hidden>
      <button type="button" class="fm-btn" data-fm="dv-print">인쇄 · PDF</button></div>
    ${cs.map(card).join('')}</section>`;
  return `${inputCard(f, '.xlsx,.xlsm,.xls,image/*,.heic,.pdf', '<button type="button" class="fm-btn ghost" data-fm="dv-new">빈 양식</button>')}${out}`;
}
// 첫 화면에서 여는 납품확인서 팝업 (10/23 대표 "팝업 형태로") — /deliv 주소로 열면 전체 화면
export function openDeliv() { F.deliv.open = true; }
export function delivPopup() {
  if (!F.deliv.open) return '';
  return `<div class="hm-ov fm fm-pop" data-fm="dv-close-bg"><div class="fm-modal" role="dialog" aria-label="납품확인서">
    <div class="hm-mh"><b>납품확인서</b><button type="button" class="hm-x" data-fm="dv-close" aria-label="닫기">✕</button></div>
    ${delivScreen()}</div></div>`;
}

const b64 = (file) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = () => no(r.error); r.readAsDataURL(file); });
function confirmsFrom(docs) {   // [{doc:{partner, owner, site, doc_date}, lines:[{name|ours|raw_name, qty, unit, date}]}] → 확인서 (대화 화면 delivHere 와 같은 규칙)
  const groups = {};
  docs.forEach(({ doc, lines }) => {
    const client = (doc.partner || '').trim(), owner = (doc.owner || '').trim(), addr = (doc.site || '').trim();
    const byDate = DL.targetRows(lines, DL.isoDate(doc.doc_date) || DL.isoDate(new Date()));
    const key = [client, owner, addr].join('\u0001');
    const g = (groups[key] = groups[key] || { client, owner, addr, byDate: {} });
    Object.entries(byDate).forEach(([day, rows]) => {
      const d0 = (g.byDate[day] = g.byDate[day] || {});
      Object.values(rows).forEach((r) => { if (d0[r.name]) d0[r.name].qty += r.qty; else d0[r.name] = { ...r }; });
    });
  });
  return Object.values(groups).flatMap((g) => DL.planConfirms(g.client, g.owner, g.addr, g.byDate));
}
async function loadDeliv() {
  const f = F.deliv, text = f.text.trim();
  if (!text && !f.files.length) { f.err = '전표 링크를 붙여넣거나 파일을 골라 주세요'; ctx.rerender(); return; }
  f.busy = true; f.err = ''; ctx.rerender();
  const docs = [], errs = [];
  const fromSales = (vouchers) => SM.splitSheets(vouchers, {}).forEach((d) => docs.push({ doc: { partner: d.partner, owner: d.site || '', site: '', doc_date: d.ymd },
    lines: d.items.map((x) => ({ name: x.name, qty: x.qty, date: DL.isoDate(x.date) })) }));
  try {
    if (text) {
      const r = await ctx.slips(text);
      (r.slips || []).filter((s) => s.error).forEach((s) => errs.push(s.error));
      const sale = (r.slips || []).filter((s) => s.rows && s.rows.length && s.kind === '판매');
      if (sale.length) fromSales(SM.parseSales([[r.head, ...sale.flatMap((s) => s.rows)]]));
    }
    for (const x of f.files) {
      try {
        if (/\.(xlsx|xlsm|xls)$/i.test(x.name)) {
          try { fromSales(SM.parseSales(await SM.readSheets(x.file))); }
          catch (_) { const d = await DL.readQuoteXlsx(await b64(x.file)); docs.push({ doc: d, lines: d.lines }); }   // 이카운트 판매 엑셀이 아니면 우리 견적서·명세서 엑셀
        } else {
          if (!ctx.helperUp()) { errs.push(`${x.name}: 사진·PDF 는 사무실 맥 도우미가 켜져 있어야 읽어요`); continue; }
          const j = await ctx.helper('/api/doc/read', { name: x.name, data: await b64(x.file) });
          docs.push({ doc: j.doc, lines: j.doc.lines });
        }
      } catch (e) { errs.push(`${x.name}: ${e.message || e}`); }
    }
    f.confirms = [...(f.confirms || []).filter((c) => c.manual), ...confirmsFrom(docs)];
  } catch (e) { errs.push(e.message || String(e)); }
  f.err = errs.join(' · '); f.busy = false; ctx.rerender();
}
function printDeliv() {
  const cs = (F.deliv.confirms || []).map((c) => ({ ...c, rows: c.rows.filter((r) => (r.name || (r.ov && r.ov.prod)) && Number(r.qty) > 0).map((r) => ({ ...r, qty: Number(r.qty) })),
    file: [c.date.replace(/-/g, ''), c.place].filter(Boolean).join('_').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim() })).filter((c) => c.rows.length);
  if (!cs.length) { F.deliv.err = '품명·수량이 있는 줄이 없어요'; ctx.rerender(); return; }
  if (!DL.getStamp()) { const el = document.getElementById('fm-stamp'); if (el) { F.deliv.afterStamp = true; el.click(); } return; }
  DL.printConfirms(cs).catch((e) => { F.deliv.err = e.message || String(e); ctx.rerender(); });
}

export function screen(route) {
  return route === 'deliv' ? `<div class="hm fm">${top('납품확인서')}<main class="hm-main"><h1 class="hm-h1">납품확인서</h1>${delivScreen()}</main></div>` : stmtScreen(route);
}

export function bind(app, c) {
  ctx = c;
  const cur = () => (app.querySelector('.fm-pop') ? 'deliv' : ROUTES.find((r) => app.querySelector('.fm') && ctx.route() === r));
  app.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-fm]'); const r = cur(); if (!t || !r) return;
    const a = t.dataset.fm, f = F[r], i = Number(t.dataset.i);
    if (a === 'go') ctx.go(t.dataset.r);
    else if (a === 'dv-close' || (a === 'dv-close-bg' && e.target === t)) { F.deliv.open = false; ctx.rerender(); }
    else if (a === 'pick') document.getElementById('fm-file').click();
    else if (a === 'unpick') { f.files.splice(i, 1); ctx.rerender(); }
    else if (a === 'load') { f.text = (document.getElementById('fm-text') || {}).value || ''; if (r === 'deliv') loadDeliv(); else loadStmt(r); }
    else if (a === 'st-pdf') SM.printSheets(Number.isNaN(i) ? f.docs : [f.docs[i]], ST[r][1]);
    else if (a === 'st-img') { f.busy = true; ctx.rerender(); try { await SM.saveImages(Number.isNaN(i) ? f.docs : [f.docs[i]], null, ST[r][1]); } catch (err) { f.err = err.message || String(err); } f.busy = false; ctx.rerender(); }
    else if (a === 'dv-new') { f.confirms = [...(f.confirms || []), { manual: true, date: DL.isoDate(new Date()), client: '', place: '', what: '', rows: [{ cat: '', name: '', unit: 'ROLL', qty: '', ov: {} }] }]; ctx.rerender(); }
    else if (a === 'dv-del') { f.confirms.splice(i, 1); ctx.rerender(); }
    else if (a === 'dv-radd') { f.confirms[i].rows.push({ cat: '', name: '', unit: 'ROLL', qty: '', ov: {} }); ctx.rerender(); }
    else if (a === 'dv-rdel') { f.confirms[i].rows.splice(Number(t.dataset.k), 1); ctx.rerender(); }
    else if (a === 'dv-print') printDeliv();
  });
  app.addEventListener('input', (e) => {
    const r = cur(); if (!r) return;
    const el = e.target, f = F[r], d = el.dataset;
    if (el.id === 'fm-text') f.text = el.value;
    else if (d.fmSite !== undefined) f.docs[Number(d.fmSite)].site = el.value;
    else if (d.fmItem !== undefined) f.docs[Number(d.fmItem)].items[Number(d.k)].name = el.value;
    else if (d.fmC !== undefined) f.confirms[Number(d.fmC)][d.k] = el.value;
    else if (d.fmR !== undefined) {
      const row = f.confirms[Number(d.fmR)].rows[Number(d.k)];
      if (d.f === 'qty') row.qty = el.value.replace(/[^\d.]/g, '');
      else { row.ov = { ...(row.ov || {}), [d.f]: el.value }; if (d.f === 'prod' && !row.name) row.name = el.value; }
    }
  });
  app.addEventListener('change', async (e) => {
    const r = cur(); if (!r) return;
    if (e.target.id === 'fm-file') { F[r].files.push(...[...e.target.files].map((file) => ({ name: file.name, file }))); e.target.value = ''; ctx.rerender(); }
    else if (e.target.id === 'fm-stamp' && e.target.files[0]) {
      try { await DL.setStamp(e.target.files[0]); } catch (err) { F.deliv.err = err.message; }
      e.target.value = ''; ctx.rerender();
      if (F.deliv.afterStamp) { F.deliv.afterStamp = false; printDeliv(); }
    }
  });
}
