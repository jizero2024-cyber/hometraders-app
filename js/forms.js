// 간단 서류 화면 (10/23 대표 — "자재승인원처럼 필요한 버튼과 입력란만, 수동 수정란")
//   stmt-gong 공간제작소 · stmt-etc 그 외 · stmt-ace 에이스 거래명세표 : 출고일보 전표 링크·이카운트 판매 엑셀 → 거래명세표 (js/stmt.js), 현장명·품명 손으로 고침
//   deliv     납품확인서 : 전표 링크·판매 엑셀·우리 견적서 엑셀·사진/PDF(도우미) → 납품확인서 (js/delivery.js), 칸마다 손으로 고침
//   approval  자재승인원 : 제조사·현장명·출고일자·발행일자·납품확인서 PDF → 도우미 make_pack.py
//   quote     견적서     : 카톡 글·발주서 사진/PDF/엑셀 → 도우미 판독(종전가) → 줄 고치기 → 도우미 견적서 엑셀
//   deposit   입금표     : deposit.html (같은 머리 아래)
//   화면 모양은 모두 같음 — 머리(‹ · 로고 · 이름) · 제목 · 불러오기 칸 · 결과 칸, 파일은 끌어다 놓기도 됨
import * as SM from './stmt.js';
import * as DL from './delivery.js';

export const ROUTES = ['stmt-gong', 'stmt-etc', 'stmt-ace', 'deliv', 'approval', 'quote', 'deposit'];
const ST = { 'stmt-gong': ['공간제작소 거래명세표', 'homt'], 'stmt-etc': ['그 외 명세표', 'homt'], 'stmt-ace': ['에이스 거래명세표', 'ace'] };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = (n) => Math.round(Number(n) || 0).toLocaleString();
const isGong = (p) => String(p || '').includes('공간제작소');
const blank = () => ({ text: '', files: [], docs: null, err: '', busy: false });
const today = () => DL.isoDate(new Date());
const F = { 'stmt-gong': blank(), 'stmt-etc': blank(), 'stmt-ace': blank(), deliv: { ...blank(), confirms: null },
  approval: { presets: null, preset: '', site: '', ship: '', issue: '', file: null, busy: false, err: '', out: null },
  quote: { ...blank(), doc: null, out: null }, deposit: {} };
let ctx = { rerender: () => {}, go: () => {}, me: () => '', helper: async () => ({}), helperUp: () => false, helperFile: () => '', slips: async () => ({ slips: [] }) };

function top(back, right) {
  return `<header class="hm-top"><div class="hm-in">
    <button type="button" class="hm-back" data-fm="go" data-r="${back}">‹</button>
    <img src="./icons/logo-full.png" alt="HOME TRADERS" class="hm-logo" data-fm="go" data-r="main">
    <span class="sp"></span>${right || ''}<b class="hm-me">${esc(ctx.me())}</b></div></header>`;
}
let inPop = false;   // 팝업 안에 그릴 땐 머리·제목 없이 본문만
function page(back, title, body, right) {
  if (inPop) return body;
  return `<div class="hm fm">${top(back, right)}<main class="hm-main"><h1 class="hm-h1">${title}</h1>${body}</main></div>`;
}
const noHelper = () => (ctx.helperUp() ? '' : '<div class="fm-warn">사무실 맥 도우미가 꺼져 있어요</div>');
function inputCard(f, accept, extra, ph) {
  return `<section class="fm-in" id="fm-drop">
    <textarea id="fm-text" class="fm-ta" rows="2" placeholder="${ph || '출고일보 전표 링크 붙여넣기'}">${esc(f.text)}</textarea>
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
        ${route === 'stmt-ace' ? '' : `<input class="fm-site" data-fm-site="${i}" value="${esc(d.site || '')}" placeholder="현장명">`}<span class="sp"></span>
        <b class="fm-amt">${won(d.items.reduce((a, x) => a + x.supply + x.vat, 0))}원</b>
        <button type="button" class="fm-btn sm" data-fm="st-pdf" data-i="${i}">PDF</button><button type="button" class="fm-btn sm ghost" data-fm="st-img" data-i="${i}">이미지</button></div>
      ${d.items.map((x, k) => `<div class="fm-it"><input data-fm-item="${i}" data-k="${k}" value="${esc(x.name)}"><span>${won(x.qty)}</span><span>${won(x.supply / x.qty)}</span><span>${won(x.supply)}</span></div>`).join('')}
    </div>`).join('')}</section>`;
  return page('stmt', title, inputCard(f, '.xlsx,.xlsm,.xls') + list, gong ? '<button type="button" class="hm-link" data-fm="go" data-r="gonggan">BMS ›</button>' : '');
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
  return inputCard(f, '.xlsx,.xlsm,.xls,image/*,.heic,.pdf', '<button type="button" class="fm-btn ghost" data-fm="dv-new">빈 양식</button>') + out;
}
// 팝업 (10/23 대표 "팝업 형태로") — 첫 화면·거래명세표 화면 버튼은 모두 팝업. 주소(/deliv · /quote …)로 열면 전체 화면
const TITLE = { ...Object.fromEntries(Object.entries(ST).map(([k, v]) => [k, v[0]])), deliv: '납품확인서', approval: '자재승인원', quote: '견적서', deposit: '입금표' };
export function open(route) { ROUTES.forEach((r) => { F[r].open = r === route; }); }
export function popup() {
  const r = ROUTES.find((x) => F[x].open);
  if (!r) return '';
  inPop = true;
  let body;
  try { body = screen(r); } finally { inPop = false; }
  const bms = r === 'stmt-gong' ? '<button type="button" class="hm-link" data-fm="go" data-r="gonggan">BMS ›</button>' : '';
  return `<div class="hm-ov fm fm-pop" data-fm="pop-close-bg" data-r="${r}"><div class="fm-modal ${r === 'quote' ? 'wide' : ''}" role="dialog" aria-label="${TITLE[r]}">
    <div class="hm-mh"><b>${TITLE[r]}</b><span class="sp"></span>${bms}<button type="button" class="hm-x" data-fm="pop-close" aria-label="닫기">✕</button></div>
    ${body}</div></div>`;
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

// ── 자재승인원 ─────────────────────────────────────────
function approvalScreen() {
  const a = F.approval, up = ctx.helperUp();
  if (up && !a.presets && !a.busy) {
    a.busy = true;
    ctx.helper('/api/approval/presets').then((j) => { a.presets = j.presets || []; a.preset = a.preset || (a.presets[0] || {}).key || ''; })
      .catch((e) => { a.err = e.message; }).finally(() => { a.busy = false; ctx.rerender(); });
  }
  const body = `${noHelper()}<section class="fm-in"><div class="fm-form">
    <label>제조사<select data-fm-a="preset">${(a.presets || []).map((p) => `<option value="${esc(p.key)}" ${a.preset === p.key ? 'selected' : ''}>${esc(p.key)} · ${esc(p.name)}</option>`).join('')}</select></label>
    <label class="w2">현장명<input data-fm-a="site" value="${esc(a.site)}" placeholder="단양 단성중학교 (명산종합건재·주성건설)"></label>
    <label>출고일자<input type="date" data-fm-a="ship" value="${esc(a.ship)}"></label>
    <label>발행일자<input type="date" data-fm-a="issue" value="${esc(a.issue || today())}"></label>
    <label>납품확인서<button type="button" class="fm-btn ghost" data-fm="ap-pick">${a.file ? esc(a.file.name) : 'PDF 고르기'}</button></label>
    </div><input type="file" id="fm-ap-file" accept=".pdf,application/pdf" hidden>
    <div class="fm-row"><span class="sp"></span><button type="button" class="fm-btn" data-fm="ap-make" ${a.busy || !up ? 'disabled' : ''}>${a.busy ? '만드는 중…' : '만들기'}</button></div>
    ${a.err ? `<div class="hm-err">${esc(a.err)}</div>` : ''}</section>
    ${a.out ? `<section class="fm-out"><div class="fm-oh"><b>${esc(a.out.name)}</b><span class="sp"></span><a class="fm-btn" href="${a.out.url}" download="${esc(a.out.name)}">내려받기</a></div></section>` : ''}`;
  return page('main', '자재승인원', body);
}
async function makeApproval() {
  const a = F.approval;
  a.err = ''; a.out = null;
  if (!a.site.trim()) a.err = '현장명을 적어 주세요';
  else if (!a.file) a.err = '납품확인서 PDF 를 골라 주세요';
  if (a.err) { ctx.rerender(); return; }
  a.busy = true; ctx.rerender();
  try {
    const j = await ctx.helper('/api/approval/make', { preset: a.preset, site: a.site.trim(), dates: a.ship ? [a.ship] : [], issue: a.issue || today(), deliv: { name: a.file.name, data: await b64(a.file) } });
    const bin = Uint8Array.from(atob(j.data), (c) => c.charCodeAt(0));
    a.out = { name: j.name, url: URL.createObjectURL(new Blob([bin], { type: 'application/pdf' })) };
  } catch (e) { a.err = e.message || String(e); }
  a.busy = false; ctx.rerender();
}

// ── 견적서 ─────────────────────────────────────────────
// 한 화면에서: ① 붙여넣기·파일 → ② 거래처·현장·날짜 한 줄 → ③ 품목 표(금액 바로 계산, 종전가는 단가 아래 작게) → ④ 합계·만들기 (아래 고정)
const QCOLS = [['raw_name', '품명'], ['spec', '규격'], ['unit', '단위'], ['qty', '수량'], ['price', '단가']];
const qAmt = (l) => (Number(l.qty) || 0) * (Number(l.price) || 0);
const qSum = (d) => d.lines.reduce((a, l) => a + qAmt(l), 0);
function quoteScreen() {
  const q = F.quote, d = q.doc;
  const step1 = inputCard(q, '.xlsx,.xls,image/*,.heic,.pdf', '<button type="button" class="fm-btn ghost" data-fm="q-new">빈 양식</button>', '카톡 글 · 품목 목록 붙여넣기 (발주서 사진·PDF·엑셀은 파일로)');
  if (!d) return page('main', '견적서', noHelper() + step1);
  const sup = qSum(d);
  const out = `<section class="fm-out fm-q">
    <div class="fm-qh">
      <label>거래처<input data-fm-q="partner" value="${esc(d.partner)}" placeholder="거래처"></label>
      <label>현장 · 건축주<input data-fm-q="owner" value="${esc(d.owner)}" placeholder="현장"></label>
      <label>견적일<input type="date" data-fm-q="doc_date" value="${esc(d.doc_date)}"></label>
    </div>
    <div class="fm-tab"><div class="fm-th q">${QCOLS.map(([, l]) => `<span>${l}</span>`).join('')}<span class="r">금액</span><span></span></div>
      ${d.lines.map((l, k) => `<div class="fm-tr q">${QCOLS.map(([key]) => `<div class="fm-cell"><input data-fm-ql="${k}" data-f="${key}" value="${esc(l[key])}"${key === 'qty' || key === 'price' ? ' inputmode="decimal" class="n"' : ''}>${key === 'price' && l.prevSrc ? `<small>${esc(l.prevSrc)}</small>` : ''}</div>`).join('')}
        <span class="fm-amt r" id="fm-qamt-${k}">${qAmt(l) ? won(qAmt(l)) : ''}</span>
        <button type="button" class="fm-x" data-fm="q-rdel" data-k="${k}" aria-label="줄 지우기">✕</button></div>`).join('')}
      <button type="button" class="fm-add" data-fm="q-radd">＋ 줄</button></div>
    <div class="fm-qf">
      <span>공급가 <b id="fm-qsup">${won(sup)}</b></span><span>부가세 <b id="fm-qvat">${won(sup * 0.1)}</b></span><span class="tot">합계 <b id="fm-qtotal">${won(sup * 1.1)}원</b></span>
      <span class="sp"></span>
      ${q.out ? `<a class="fm-btn ghost" href="${ctx.helperFile(q.out)}">${esc(q.out.split('/').pop())}</a>` : ''}
      <button type="button" class="fm-btn" data-fm="q-make" ${q.busy || !ctx.helperUp() ? 'disabled' : ''}>${q.busy ? '만드는 중…' : '견적서 만들기'}</button></div>
    ${q.err ? `<div class="hm-err">${esc(q.err)}</div>` : ''}
  </section>`;
  return page('main', '견적서', noHelper() + `<details class="fm-again"><summary>다른 자료로 다시 불러오기</summary>${step1}</details>` + out);
}
async function loadQuote() {
  const q = F.quote, text = q.text.trim();
  if (!text && !q.files.length) { q.err = '품목 글을 붙여넣거나 파일을 골라 주세요'; ctx.rerender(); return; }
  if (!ctx.helperUp()) { q.err = '사무실 맥 도우미가 켜져 있어야 읽어요'; ctx.rerender(); return; }
  q.busy = true; q.err = ''; q.out = null; ctx.rerender();
  try {
    const j = text ? await ctx.helper('/api/doc/read', { text }) : await ctx.helper('/api/doc/read', { name: q.files[0].name, data: await b64(q.files[0].file) });
    const d = j.doc || {};
    q.doc = { partner: d.partner || '', owner: d.owner || '', manager: d.manager || '', site: d.site || '', doc_date: DL.isoDate(d.doc_date) || today(),
      lines: (d.lines || []).map((l) => ({ raw_name: l.raw_name || l.name || '', spec: l.spec || '', unit: l.unit || '', qty: l.qty || '',
        price: Number(l.price) || Number(l.unit_price) || (l.prev && Number(l.prev.price)) || '', prevSrc: l.prev && l.prev.price ? `${l.prev.src || '종전가'} ${l.prev.date || ''}` : '' })) };
  } catch (e) { q.err = e.message || String(e); }
  q.busy = false; ctx.rerender();
}
async function makeQuote() {
  const q = F.quote, d = q.doc;
  const lines = d.lines.filter((l) => String(l.raw_name).trim() && Number(l.qty) > 0).map((l) => ({ raw_name: l.raw_name, spec: l.spec, unit: l.unit, qty: Number(l.qty), price: Number(l.price) || 0 }));
  if (!d.partner.trim()) { q.err = '거래처를 적어 주세요'; ctx.rerender(); return; }
  if (!lines.length) { q.err = '품명·수량이 있는 줄이 없어요'; ctx.rerender(); return; }
  q.busy = true; q.err = ''; ctx.rerender();
  try { const r = await ctx.helper('/api/quote', { doc: { partner: d.partner, owner: d.owner, manager: d.manager, site: d.site, doc_date: d.doc_date }, lines }); q.out = r.out; }
  catch (e) { q.err = e.message || String(e); }
  q.busy = false; ctx.rerender();
}

// ── 입금표 ─────────────────────────────────────────────
function depositScreen() {
  return page('main', '입금표', '<iframe class="fm-frame" src="./deposit.html?embed=1" title="입금표"></iframe>');
}

export function screen(route) {
  if (route === 'deliv') return page('main', '납품확인서', delivScreen());
  if (route === 'approval') return approvalScreen();
  if (route === 'quote') return quoteScreen();
  if (route === 'deposit') return depositScreen();
  return stmtScreen(route);
}

export function bind(app, c) {
  ctx = c;
  const cur = () => { const p = app.querySelector('.fm-pop'); return p ? p.dataset.r : ROUTES.find((r) => app.querySelector('.fm') && ctx.route() === r); };
  app.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-fm]'); const r = cur(); if (!t || !r) return;
    const a = t.dataset.fm, f = F[r], i = Number(t.dataset.i);
    if (a === 'go') { open(''); ctx.go(t.dataset.r); }
    else if (a === 'pop-close' || (a === 'pop-close-bg' && e.target === t)) { F[r].open = false; ctx.rerender(); }
    else if (a === 'pick') document.getElementById('fm-file').click();
    else if (a === 'unpick') { f.files.splice(i, 1); ctx.rerender(); }
    else if (a === 'load') { f.text = (document.getElementById('fm-text') || {}).value || ''; if (r === 'deliv') loadDeliv(); else if (r === 'quote') loadQuote(); else loadStmt(r); }
    else if (a === 'ap-pick') document.getElementById('fm-ap-file').click();
    else if (a === 'ap-make') makeApproval();
    else if (a === 'q-new') { f.doc = { partner: '', owner: '', manager: '', site: '', doc_date: today(), lines: [{ raw_name: '', spec: '', unit: '', qty: '', price: '' }] }; f.out = null; ctx.rerender(); }
    else if (a === 'q-radd') { f.doc.lines.push({ raw_name: '', spec: '', unit: '', qty: '', price: '' }); ctx.rerender(); }
    else if (a === 'q-rdel') { f.doc.lines.splice(Number(t.dataset.k), 1); ctx.rerender(); }
    else if (a === 'q-make') makeQuote();
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
    else if (d.fmA !== undefined) F.approval[d.fmA] = el.value;
    else if (d.fmQ !== undefined) f.doc[d.fmQ] = el.value;
    else if (d.fmQl !== undefined) {
      f.doc.lines[Number(d.fmQl)][d.f] = d.f === 'qty' || d.f === 'price' ? el.value.replace(/[^\d.]/g, '') : el.value;
      const k = Number(d.fmQl), sup = qSum(f.doc), set = (id, v) => { const x = document.getElementById(id); if (x) x.textContent = v; };   // 금액·합계만 바로 (칸을 다시 그리면 입력 중인 글자가 끊김)
      set(`fm-qamt-${k}`, qAmt(f.doc.lines[k]) ? won(qAmt(f.doc.lines[k])) : ''); set('fm-qsup', won(sup)); set('fm-qvat', won(sup * 0.1)); set('fm-qtotal', `${won(sup * 1.1)}원`);
    }
    else if (d.fmR !== undefined) {
      const row = f.confirms[Number(d.fmR)].rows[Number(d.k)];
      if (d.f === 'qty') row.qty = el.value.replace(/[^\d.]/g, '');
      else { row.ov = { ...(row.ov || {}), [d.f]: el.value }; if (d.f === 'prod' && !row.name) row.name = el.value; }
    }
  });
  app.addEventListener('dragover', (e) => { const d = cur() && e.target.closest && e.target.closest('#fm-drop'); if (d) { e.preventDefault(); d.classList.add('over'); } });
  app.addEventListener('dragleave', (e) => { const d = e.target.closest && e.target.closest('#fm-drop'); if (d) d.classList.remove('over'); });
  app.addEventListener('drop', (e) => {
    const r = cur(), d = r && e.target.closest && e.target.closest('#fm-drop'); if (!d) return;
    e.preventDefault(); d.classList.remove('over');
    const files = [...(e.dataTransfer.files || [])], text = e.dataTransfer.getData('text/plain');
    if (files.length) F[r].files.push(...files.map((file) => ({ name: file.name, file })));
    else if (text.trim()) F[r].text = [F[r].text, text].filter(Boolean).join('\n');
    ctx.rerender();
  });
  app.addEventListener('change', async (e) => {
    const r = cur(); if (!r) return;
    if (e.target.dataset.fmA) { F.approval[e.target.dataset.fmA] = e.target.value; return; }
    if (e.target.id === 'fm-ap-file' && e.target.files[0]) { F.approval.file = e.target.files[0]; e.target.value = ''; ctx.rerender(); return; }
    if (e.target.id === 'fm-file') { F[r].files.push(...[...e.target.files].map((file) => ({ name: file.name, file }))); e.target.value = ''; ctx.rerender(); }
    else if (e.target.id === 'fm-stamp' && e.target.files[0]) {
      try { await DL.setStamp(e.target.files[0]); } catch (err) { F.deliv.err = err.message; }
      e.target.value = ''; ctx.rerender();
      if (F.deliv.afterStamp) { F.deliv.afterStamp = false; printDeliv(); }
    }
  });
}
