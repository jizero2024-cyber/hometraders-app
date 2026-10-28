// 뉴하우징 협업툴 — 현장 먼저 (2026-10-28 대표, 시안 https://claude.ai/artifact/Hpd8tk53ZdqDzdBWru4Udr 의 B)
// 줄 = 이카운트 판매현황의 뉴하우징홈 판매 줄(nh_sales, 맥 도우미 nh_bms.py 가 넣으면 바로 올림) → 거래명세표 변환기(stmt.js)로 장마다 나눔.
// 왼쪽 = 현장('<지역>-<소장 이니셜>'), 현장 안 = 거래명세표·세금계산서 / 납품송장 / 세트 대조표(nh_sites).
// 장마다 상태·세금계산서 = nh_docs (첫 화면 출고 흐름 명세표 탭도 같은 표). 뉴하우징 계정(view)은 보기·다운로드만 — 상태·세금계산서 넣기는 직원만.
import * as S from './nh-store.js?v=1';
import * as SM from './stmt.js?v=101';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = (n) => Math.round(Number(n) || 0).toLocaleString();
const qn = (n) => (n == null ? '' : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }));
const HEAD = ['일자-No.', '거래처명', '품목명(규격)', '수량', '단가', '공급가액', '부가세'];
const STATUS = ['전체', '결재전', '기안중', '수정요청', '최종완료'];
const BADGE = { 결재전: 'background:#FFF1E6;color:#B4471A', 기안중: 'background:#EAF1FB;color:#1D4F91', 수정요청: 'background:#FDECEC;color:#B42318', 최종완료: 'background:#1F2328;color:#fff' };
const ALL = '전체';
const X = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="#1F2328" stroke-width="1.8" stroke-linecap="round"></path></svg>';
const DOWN = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8M4.5 7L8 10.5 11.5 7M3 13h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
const PEN = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 2.5l3 3L6 13H3v-3z" fill="none" stroke="#1F2328" stroke-width="1.6" stroke-linejoin="round"></path></svg>';
const TRASH = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" fill="none" stroke="#D92D20" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

const G = { loaded: false, loading: false, err: '', list: [], docs: {}, sites: {}, site: ALL, tab: 'stmt', status: '전체', open: null, zoom: '', reason: '', img: {}, full: {}, pend: null, panel: 'tax', syncAt: null };
let ctx = { rerender: () => {}, goStart: () => {}, me: () => '', role: () => 'view', logout: () => {} };
const STAFF = () => ctx.role() === 'staff';

// ── 데이터 ─────────────────────────────────────────
const slipKey = (slip) => { const m = /(20\d\d)\/(\d{1,2})\/(\d{1,2})\s*-\s*(\d+)/.exec(String(slip)); return m ? `${m[1]}${m[2].padStart(2, '0')}${m[3].padStart(2, '0')}-${m[4]}` : String(slip); };
const docId = (d) => `${d.ymd}|${(d.slips || [d.slip]).slice().sort().join(',')}|${(d.items[0] || {}).name || ''}`;
const itemsTotal = (d) => d.items.reduce((a, x) => a + x.supply + x.vat, 0);
const siteOf = (d) => ((G.docs[d.id] || {}).manual || {}).site || d.place || '현장 미상';
export async function load(force) {
  if (G.loading || (G.loaded && !force)) return;
  G.loading = true; G.err = '';
  try {
    const [sales, docs, sites] = await Promise.all([S.getSales(), S.getDocs(), S.getSites().catch(() => [])]);
    const lineNo = (id) => { const p = String(id).split('|')[1] || ''; return /^\d+$/.test(p) ? +p : 1e6; };
    sales.sort((a, b) => String(a.id).split('|')[0].localeCompare(String(b.id).split('|')[0]) || lineNo(a.id) - lineNo(b.id));
    const rows = sales.map((r) => [r.slip, r.partner, r.name, r.qty, r.price, r.supply, r.vat]);
    const list = rows.length ? SM.splitSheets(SM.parseSales([[HEAD, ...rows]]), {}) : [];
    const placeOf = {}, regOf = {};
    sales.forEach((r) => { const k = slipKey(r.slip); if (r.site && !placeOf[k]) placeOf[k] = r.site; if (r.reg && (!regOf[k] || r.reg < regOf[k])) regOf[k] = r.reg; });
    G.docs = Object.fromEntries(docs.map((x) => [x.id, x]));
    G.sites = Object.fromEntries(sites.map((x) => [x.id, x]));
    G.list = list.map((d) => {
      const sl = (d.slips || [d.slip]).map(slipKey), id = docId(d), m = (G.docs[id] || {}).manual || {};
      return { ...d, id, total: m.total ? Number(m.total) : itemsTotal(d), place: sl.map((k) => placeOf[k]).find(Boolean) || '', reg: sl.map((k) => regOf[k]).filter(Boolean).sort()[0] || '' };
    }).filter((d) => (G.docs[d.id] || {}).status !== '삭제').sort((a, b) => (b.ymd + b.slip).localeCompare(a.ymd + a.slip));
    G.syncAt = [...sales.map((r) => r.updated_at), ...docs.map((x) => x.updated_at), ...sites.map((x) => x.updated_at)].filter(Boolean).map((t) => new Date(t)).sort((a, b) => b - a)[0] || null;
    if (!G.picked || (G.site !== ALL && !siteList().some((s) => s.id === G.site))) G.site = (siteList()[0] || {}).id || ALL;
  } catch (e) { G.err = e.message || String(e); if (!G.site) G.site = ALL; }
  G.loaded = true;   // 실패해도 다시 부르지 않음 (계속 다시 부르던 것)
  G.loading = false; ctx.rerender();
}
function siteList() {   // 최근 출고 순
  const by = {};
  G.list.forEach((d) => { const s = siteOf(d); (by[s] = by[s] || { id: s, n: 0, last: '' }).n += 1; if (d.ymd > by[s].last) by[s].last = d.ymd; });
  Object.values(G.sites).forEach((x) => { if (!by[x.id] && (x.sj || []).length) by[x.id] = { id: x.id, n: 0, last: (x.span || '').slice(-8) }; });
  return Object.values(by).sort((a, b) => b.last.localeCompare(a.last) || a.id.localeCompare(b.id));
}
const statusOf = (d) => { const x = G.docs[d.id] || {}; return ['최종완료', '수정요청', '기안중'].includes(x.status) ? x.status : '결재전'; };
async function save(id, patch) {
  const prev = G.docs[id] || { id };
  const row = { ...prev, ...patch, id, updated_by: ctx.me(), updated_at: new Date().toISOString() };
  const { tax_data, stmt_data, ...light } = row;
  G.docs[id] = light;
  if ('tax_data' in patch || 'stmt_data' in patch) G.full[id] = { ...(G.full[id] || {}), ...('tax_data' in patch ? { tax_data } : {}), ...('stmt_data' in patch ? { stmt_data } : {}) };
  ctx.rerender();
  const err = await S.saveDoc(row);
  if (err) alert('저장에 실패했어요 — ' + err);
}
async function ensureFull(id) {
  if (G.full[id]) return;
  G.full[id] = { loading: true };
  try { G.full[id] = await S.getDocFull(id) || {}; } catch (e) { G.full[id] = {}; }
  ctx.rerender();
}
async function ensureImg(d) {
  if (G.img[d.id]) return;
  G.img[d.id] = 'loading';
  try { G.img[d.id] = URL.createObjectURL(await SM.pngBlob(d, 'homt')); } catch (e) { G.img[d.id] = ''; }
  ctx.rerender();
}

// ── 세금계산서 승인번호 (gbms.js 와 같음) ──
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const loadJs = (src, has) => (has() ? Promise.resolve(has()) : new Promise((ok, no) => { const el = document.createElement('script'); el.src = src; el.onload = () => ok(has()); el.onerror = () => no(new Error('도구를 못 받았어요 — 인터넷 연결 확인')); document.head.appendChild(el); }));
const NO_RE = /(\d{8})\s*[-–—]\s*(\d{8})\s*[-–—]\s*(\d{8})/;
async function pdfDoc(dataUrl) {
  const lib = await loadJs(PDFJS, () => window.pdfjsLib);
  lib.GlobalWorkerOptions.workerSrc = PDFJS.replace('pdf.min.js', 'pdf.worker.min.js');
  return lib.getDocument({ data: Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0)) }).promise;
}
async function findTaxNo(id, dataUrl) {
  try {
    let text = '';
    if (dataUrl.startsWith('data:application/pdf')) text = (await (await (await pdfDoc(dataUrl)).getPage(1)).getTextContent()).items.map((it) => it.str).join(' ');
    else { const OCR = await import('./stmt-ocr.js'); text = (await OCR.readImage(await (await fetch(dataUrl)).blob())).join(' '); }
    const m = NO_RE.exec(text.replace(/[Oo]/g, '0').replace(/\s+/g, ''));
    if (m) save(id, { tax_no: `${m[1]}-${m[2]}-${m[3]}` });
  } catch (e) { /* 못 찾으면 손으로 */ }
}
async function pdfCanvas(dataUrl) {
  const pg = await (await pdfDoc(dataUrl)).getPage(1), vp = pg.getViewport({ scale: 2.5 });
  const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  await pg.render({ canvasContext: g, viewport: vp, intent: 'print' }).promise;
  return c;
}
const pdfImg = {};
function pdfView(id, src) {
  const v = pdfImg[id];
  if (v && v.src === src) return v.url;
  pdfImg[id] = { src, url: '' };
  pdfCanvas(src).then((c) => { pdfImg[id] = { src, url: c.toDataURL('image/jpeg', 0.92) }; ctx.rerender(); }).catch(() => {});
  return '';
}

// ── 화면 ─────────────────────────────────────────
const md = (ymd) => `${ymd.slice(4, 6)}/${ymd.slice(6, 8)}`;
const itemTitle = (d) => ((G.docs[d.id] || {}).manual || {}).title || `${(d.items[0] || {}).name || ''}${d.items.length > 1 ? ` 외 ${d.items.length - 1}개` : ''}`;
const tabStyle = (on) => `height:38px;padding:0 16px;border-radius:19px;font:inherit;font-size:14px;cursor:pointer;${on ? 'background:#1F2328;color:#fff;border:1px solid #1F2328;font-weight:700' : 'background:#fff;color:#1F2328;border:1px solid #E6E4DF'}`;
const navStyle = (on) => `display:flex;justify-content:space-between;gap:8px;padding:10px;border-radius:8px;border:0;font:inherit;font-size:14px;cursor:pointer;text-align:left;${on ? 'background:#FDF0E6;color:#9A3412;font-weight:700' : 'background:none;color:#1F2328'}`;
const card = (label, n, unit, hot) => `<div style="display:flex;flex-direction:column;gap:4px;padding:14px 16px;border-radius:12px;background:#fff;${hot ? 'border:2px solid #E8732C' : 'border:1px solid #E6E4DF'}"><span style="font-size:13px;color:#5C5C5C">${label}</span><b style="font-size:26px;${hot ? 'color:#C2410C' : ''}">${n}<span style="font-size:14px;font-weight:500;margin-left:3px">${unit}</span></b></div>`;
const okTag = '<span style="display:inline-block;padding:6px 10px;border-radius:6px;background:#EEF6EE;color:#1E6B34;font-size:12px;font-weight:600;white-space:nowrap">첨부됨</span>';
const noTag = '<span style="font-size:12px;color:#9A9A9A">—</span>';
const addBtn = (id) => `<button type="button" data-nh="addtax" data-id="${esc(id)}" style="width:92px;height:34px;border-radius:8px;border:1.5px dashed #B8B8B8;background:#F4F4F4;color:#4B4B4B;font:inherit;font-weight:700;font-size:13px;cursor:pointer">+ 넣기</button>`;
const badge = (st) => `<span style="display:inline-block;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:700;${BADGE[st]}">${st}</span>`;
const statusPick = (id, st) => `<select data-nh="setstatus" data-id="${esc(id)}" aria-label="상태 바꾸기" style="appearance:none;-webkit-appearance:none;border:0;cursor:pointer;padding:4px 10px;border-radius:12px;font:inherit;font-size:12px;font-weight:700;text-align:center;${BADGE[st]}">${STATUS.slice(1).map((k) => `<option style="color:#1F2328;background:#fff" ${k === st ? 'selected' : ''}>${k}</option>`).join('')}</select>`;
const dspan = (span) => { const m = /^(\d{8})-(\d{8})$/.exec(span || ''); return !m ? '' : m[1] === m[2] ? md(m[1]) : `${md(m[1])} ~ ${md(m[2])}`; };

export function screen() {
  if (!G.loaded && !G.loading) load();
  const sites = siteList(), cur = G.site;
  const mine = G.list.filter((d) => cur === ALL || siteOf(d) === cur);
  const info = G.sites[cur] || null;
  const tabs = cur === ALL ? [['stmt', '거래명세표 · 세금계산서', mine.length]] : [['stmt', '거래명세표 · 세금계산서', mine.length], ['sj', '납품송장', (info && info.sj || []).length], ['set', '세트 대조표', '']];
  if (!tabs.some((t) => t[0] === G.tab)) G.tab = 'stmt';
  const span = info ? dspan(info.span) : '';
  const open = G.open && G.list.find((d) => d.id === G.open);
  return `<div class="nh" style="font-family:Pretendard,'Noto Sans KR',system-ui,sans-serif;color:#1F2328;background:#F7F7F5;min-height:100vh;display:flex;flex-wrap:wrap"><style>
.nh .nh-cards{display:none}
@media (max-width:760px){
 .nh .nh-nav{flex:1 1 100%!important;max-width:none!important;flex-direction:row!important;flex-wrap:nowrap;overflow-x:auto;align-items:center;gap:6px!important;padding:8px 12px!important;border-right:0!important;border-bottom:1px solid #E6E4DF;position:sticky;top:0;z-index:5}
 .nh .nh-nav button{flex:0 0 auto;padding:8px 12px!important;margin:0!important;font-size:13px!important}
 .nh .nh-logo{display:none!important}
 .nh .nh-main{padding:14px 12px 40px!important;gap:12px!important}
 .nh .nh-h1{font-size:18px!important}
 .nh .nh-tabs{flex-wrap:nowrap!important;overflow-x:auto}.nh .nh-tabs button{flex:0 0 auto;height:34px!important;font-size:13px!important}
 .nh .nh-stat{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
 .nh .nh-table{display:none}.nh .nh-cards{display:flex;flex-direction:column;gap:10px}
 .nh .nh-ov{padding:0!important}.nh .nh-dlg{border-radius:0!important;min-height:100vh;padding:14px 12px 18px!important}
 .nh .nh-dlg>div:first-child{flex-direction:column!important}
 .nh .nh-two{grid-template-columns:1fr!important}
}
</style>
  <nav class="nh-nav" aria-label="현장" style="flex:1 1 220px;max-width:240px;background:#fff;border-right:1px solid #E6E4DF;padding:20px 14px;box-sizing:border-box;display:flex;flex-direction:column;gap:4px">
    <div class="nh-logo" style="display:flex;align-items:center;gap:10px;padding:4px 8px 18px"><b style="font-size:16px;white-space:nowrap">뉴하우징홈</b><span aria-hidden="true" style="color:#8A8A8A">×</span><img src="/icons/logo-full.png" alt="HOME TRADERS" style="height:30px"></div>
    ${STAFF() ? `<button type="button" data-nh="site" data-v="${ALL}" style="${navStyle(cur === ALL)}"><span>전체</span><span>${G.list.length}</span></button>` : ''}
    ${sites.map((s) => `<button type="button" data-nh="site" data-v="${esc(s.id)}" style="${navStyle(cur === s.id)}"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.id)}</span><span>${s.n || ''}</span></button>`).join('')}
    ${STAFF() ? '<button type="button" data-nh="start" style="margin-top:auto;border:0;background:none;text-align:left;padding:14px 8px 4px;font:inherit;font-size:12px;color:#6B6B6B;cursor:pointer">‹ 처음 화면</button>' : ''}
    <button type="button" data-nh="logout" style="${STAFF() ? '' : 'margin-top:auto;'}border:0;background:none;text-align:left;padding:10px 8px 4px;font:inherit;font-size:12px;color:#6B6B6B;cursor:pointer">로그아웃</button>
  </nav>
  <main class="nh-main" style="flex:999 1 560px;min-width:0;padding:28px 32px 48px;box-sizing:border-box;display:flex;flex-direction:column;gap:18px">
    <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap"><h1 class="nh-h1" style="margin:0;font-size:22px">${esc(cur === ALL ? '전체 현장' : cur)}</h1>
      <span style="font-size:14px;color:#5C5C5C">${esc([info && info.set_name, span].filter(Boolean).join(' · '))}</span></div>
    ${G.err ? `<div style="padding:12px 14px;border-radius:8px;background:#FDECEC;color:#7A1A12;font-size:13px">${esc(G.err)}</div>` : ''}
    <div class="nh-tabs" role="tablist" aria-label="보기" style="display:flex;gap:6px;flex-wrap:wrap">${tabs.map(([k, t, n]) => `<button type="button" role="tab" aria-selected="${G.tab === k}" data-nh="tab" data-v="${k}" style="${tabStyle(G.tab === k)}">${t}${n !== '' ? ` <span style="opacity:.7;margin-left:4px">${n}</span>` : ''}</button>`).join('')}</div>
    ${G.tab === 'sj' ? sjHtml(info) : G.tab === 'set' ? setHtml(info) : stmtHtml(mine)}
  </main>
  ${open ? modalHtml(open) : ''}
  <input type="file" id="nh-file" accept="image/*,application/pdf" hidden>
</div>`;
}

function stmtHtml(mine) {
  const shown = mine.filter((d) => G.status === '전체' || statusOf(d) === G.status);
  const cnt = (k) => mine.filter((d) => k === '전체' || statusOf(d) === k).length;
  const cols = STAFF() ? 7 : 5;
  const empty = `<div style="padding:40px;text-align:center;color:#6B6B6B">${G.loading ? '불러오는 중…' : '없어요'}</div>`;
  return `${STAFF() ? `<div class="nh-stat" style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px">${STATUS.map((k) => `<button type="button" data-nh="status" data-v="${k}" style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:14px 16px;border-radius:12px;font:inherit;text-align:left;cursor:pointer;background:#fff;${G.status === k ? 'border:2px solid #E8732C' : 'border:1px solid #E6E4DF'}"><span style="font-size:13px;color:#5C5C5C">${k === '전체' ? '전체보기' : k}</span><b style="font-size:26px">${cnt(k)}<span style="font-size:14px;font-weight:500;margin-left:3px">건</span></b></button>`).join('')}</div>` : ''}
    <div class="nh-cards">${shown.map((d) => { const x = G.docs[d.id] || {}; return `<div data-nh="row" data-id="${esc(d.id)}" style="background:#fff;border:1px solid #E6E4DF;border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:6px;cursor:pointer">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span style="font-size:12px;color:#6B6B6B"><b style="color:#1F2328;font-size:14px">${md(d.ymd)}</b> ${G.site === ALL ? esc(siteOf(d)) : ''}</span>${STAFF() ? badge(statusOf(d)) : ''}</div>
      <div style="font-weight:600;font-size:14px;line-height:1.4">${esc(itemTitle(d))}</div>
      <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px;padding:3px 8px;border-radius:10px;${x.tax_name ? 'background:#EEF6EE;color:#1E6B34' : 'background:#F3F4F6;color:#8A8A8A'}">${x.tax_name ? '✓ ' : ''}계산서</span><b style="font-size:15px;font-variant-numeric:tabular-nums">${won(d.total)}원</b></div></div>`; }).join('') || empty}</div>
    <div class="nh-table" style="background:#fff;border:1px solid #E6E4DF;border-radius:12px;overflow-x:auto">
      <table style="width:100%;min-width:${STAFF() ? 900 : 720}px;border-collapse:collapse;font-size:13px">
        <thead><tr style="background:#FAFAF8;color:#5C5C5C;text-align:left">
          <th style="padding:12px 8px 12px 16px;font-weight:600">출고일</th>${G.site === ALL ? '<th style="padding:12px 8px;font-weight:600">현장</th>' : ''}<th style="padding:12px 8px;font-weight:600">품목명</th>
          <th style="padding:12px 8px;font-weight:600;text-align:right;white-space:nowrap">합계 (VAT 포함)</th><th style="padding:12px 8px;font-weight:600;text-align:center">거래명세표</th><th style="padding:12px 8px;font-weight:600;text-align:center">세금계산서</th>
          ${STAFF() ? '<th style="padding:12px 16px 12px 8px;font-weight:600;text-align:center">상태</th>' : ''}
        </tr></thead>
        <tbody>${shown.map((d) => { const x = G.docs[d.id] || {}, st = statusOf(d); return `<tr data-nh="row" data-id="${esc(d.id)}" style="cursor:pointer;border-top:1px solid #EFEDE8">
          <td style="padding:12px 8px 12px 16px;white-space:nowrap"><b>${md(d.ymd)}</b><div style="font-size:11px;color:#6B6B6B">${esc((d.slips || [d.slip]).map((s) => s.slice(4)).join(', '))}</div></td>
          ${G.site === ALL ? `<td style="padding:12px 8px;white-space:nowrap">${esc(siteOf(d))}</td>` : ''}
          <td style="padding:12px 8px"><div style="font-weight:600">${esc(itemTitle(d))}</div>${STAFF() && st === '수정요청' && x.reason ? `<div style="margin-top:6px;font-size:12px;color:#B42318"><b>수정요청</b> ${esc(x.reason)}</div>` : ''}</td>
          <td style="padding:12px 8px;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums">${won(d.total)}</td>
          <td style="padding:12px 8px;text-align:center">${okTag}</td>
          <td style="padding:12px 8px;text-align:center">${x.tax_name ? okTag : STAFF() ? addBtn(d.id) : noTag}</td>
          ${STAFF() ? `<td style="padding:12px 16px 12px 8px;text-align:center;white-space:nowrap">${statusPick(d.id, st)}</td>` : ''}
        </tr>`; }).join('') || `<tr><td colspan="${cols}" style="padding:40px;text-align:center;color:#6B6B6B">${G.loading ? '불러오는 중…' : '없어요'}</td></tr>`}</tbody>
      </table>
    </div>`;
}

function sjHtml(info) {
  const list = ((info && info.sj) || []).slice().sort((a, b) => String(b.ymd || '').localeCompare(String(a.ymd || '')));
  if (!list.length) return `<div style="padding:40px;text-align:center;color:#6B6B6B;background:#fff;border:1px solid #E6E4DF;border-radius:12px">없어요</div>`;
  return `<div style="display:flex;flex-direction:column;gap:10px">${list.map((x) => {
    const done = !!x.signed_at, all = x.n && x.checked >= x.n;
    return `<div style="background:#fff;border:1px solid #E6E4DF;border-radius:12px;padding:14px 16px;display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px">
      <b style="flex:0 0 auto;min-width:56px">${x.ymd ? md(String(x.ymd).replace(/-/g, '')) : ''}</b>
      <span style="flex:1 1 200px;min-width:0">${esc(x.site || '')} <span style="color:#6B6B6B;font-size:13px">· ${x.n}품목</span></span>
      <span style="flex:0 0 auto;font-size:13px;color:${all ? '#1E6B34' : '#5C5C5C'}">체크 <b>${x.checked}/${x.n}</b></span>
      <span style="flex:0 0 auto;font-size:13px;color:#5C5C5C">${x.opened_at ? `열어봄 ${x.open_count || 1}` : '안 열어봄'}</span>
      <span style="flex:0 0 auto;font-size:13px;font-weight:700;color:${done ? '#1E6B34' : '#B4471A'}">${done ? `✓ 서명 ${esc(x.signer || '')}` : '서명 대기'}</span>
      ${x.code ? `<a href="/s/${esc(x.code)}" target="_blank" rel="noopener" style="flex:0 0 auto;height:36px;line-height:36px;padding:0 14px;border:1px solid #E6E4DF;border-radius:8px;background:#fff;color:#1F2328;font-size:13px;font-weight:600;text-decoration:none">열기</a>` : ''}
    </div>`; }).join('')}</div>`;
}

function setHtml(info) {
  const rows = (info && info.rows) || [];
  if (!rows.length) return `<div style="padding:40px;text-align:center;color:#6B6B6B;background:#fff;border:1px solid #E6E4DF;border-radius:12px">없어요</div>`;
  const left = (r) => { const want = r.order ?? r.set; return want == null || r.out == null ? null : Math.max(0, want - r.out); };
  const n = (f) => rows.filter(f).length;
  const sjOf = (r) => (r.sj === 'ok' ? '<span style="color:#1E6B34;font-weight:700">✓</span>' : r.sj === 'wait' ? '<span style="color:#B4471A;font-weight:700">서명 대기</span>' : '<span style="color:#9A9A9A">—</span>');
  return `<div class="nh-stat" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px">${card('세트', n((r) => r.set != null), '품목')}${card('발주', n((r) => r.order != null), '품목')}${card('출고', n((r) => r.out), '품목')}${card('남음', n((r) => left(r) > 0), '품목', n((r) => left(r) > 0) > 0)}</div>
    <div style="background:#fff;border:1px solid #E6E4DF;border-radius:12px;overflow-x:auto">
      <table style="width:100%;min-width:720px;border-collapse:collapse;font-size:13px">
        <thead><tr style="background:#FAFAF8;color:#5C5C5C;text-align:left">
          <th style="padding:12px 8px 12px 16px;font-weight:600">품목</th><th style="padding:12px 8px;font-weight:600;text-align:right">세트</th><th style="padding:12px 8px;font-weight:600;text-align:right">발주</th><th style="padding:12px 8px;font-weight:600;text-align:right">출고</th><th style="padding:12px 8px;font-weight:600;text-align:center">송장 확인</th><th style="padding:12px 16px 12px 8px;font-weight:600;text-align:right">남음</th>
        </tr></thead>
        <tbody>${rows.map((r) => { const l = left(r); return `<tr style="border-top:1px solid #EFEDE8;${r.set == null && r.order == null ? 'background:#FAFAF8' : ''}">
          <td style="padding:10px 8px 10px 16px">${esc(r.name)}</td><td style="padding:10px 8px;text-align:right">${qn(r.set)}</td><td style="padding:10px 8px;text-align:right">${qn(r.order)}</td><td style="padding:10px 8px;text-align:right">${qn(r.out)}</td>
          <td style="padding:10px 8px;text-align:center">${sjOf(r)}</td><td style="padding:10px 16px 10px 8px;text-align:right;${l > 0 ? 'font-weight:700;color:#C2410C' : ''}">${l == null ? '' : qn(l)}</td></tr>`; }).join('')}</tbody>
      </table>
    </div>`;
}

// ── 한 장 보기 ─────────────────────────────────────
const srcOf = (d, kind) => (kind === 'stmt' ? (G.full[d.id] || {}).stmt_data || (G.img[d.id] !== 'loading' ? G.img[d.id] : '') : (G.full[d.id] || {}).tax_data);
const viewSrc = (d, kind) => { const s0 = srcOf(d, kind); return s0 && s0.startsWith('data:application/pdf') ? pdfView(d.id + kind, s0) : s0; };
function docBox(kind, d) {
  const label = kind === 'stmt' ? '거래명세표' : '세금계산서', P = G.pend && G.pend.id === d.id ? G.pend[kind] : null;
  const src = P ? (P.data.startsWith('data:application/pdf') ? pdfView('pend' + d.id, P.data) : P.data) : viewSrc(d, kind);
  const no = kind === 'tax' && !P && srcOf(d, 'tax') ? (G.docs[d.id] || {}).tax_no || '' : '';
  const sel = STAFF() && G.panel === kind ? 'outline:2px solid #1D4F91;outline-offset:6px;border-radius:6px;' : '';
  const btns = P ? `<button type="button" data-nh="pend-cancel" style="height:30px;padding:0 10px;border:1px solid #E6E4DF;border-radius:6px;background:#fff;font:inherit;font-size:12px;cursor:pointer">빼기</button>`
    : [['copy', '복사'], ['pdf', 'PDF 저장']].map(([a, t]) => `<button type="button" data-nh="${a}" data-k="${kind}" ${src ? '' : 'disabled'} style="height:30px;padding:0 10px;border:1px solid #E6E4DF;border-radius:6px;background:#fff;font:inherit;font-size:12px;cursor:pointer">${t}</button>`).join('');
  const box = src ? `<button type="button" data-nh="zoom" data-k="${kind}" aria-label="${label} 크게 보기" style="display:flex;align-items:flex-start;justify-content:center;width:100%;height:100%;padding:0;border:0;background:none;cursor:zoom-in"><img src="${src}" alt="${label}" style="max-width:100%;max-height:100%;object-fit:contain;display:block"></button>`
    : kind === 'tax' && STAFF() ? `<div data-nh="panel" data-k="tax" data-nh-drop="tax" tabindex="0" style="height:100%;border:2px dashed #B8B8B8;border-radius:8px;background:#F4F4F4;color:#4B4B4B;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;box-sizing:border-box"><b>세금계산서 넣기</b><span style="font-size:13px;color:#6B6B6B">누르고 Ctrl+V (⌘V) · 끌어다 놓기</span><button type="button" data-nh="pick" data-k="tax" style="height:36px;padding:0 16px;border:1px solid #B8B8B8;border-radius:8px;background:#fff;font:inherit;font-size:13px;cursor:pointer">파일 고르기</button></div>`
    : `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#6B6B6B;font-size:13px">${kind === 'tax' ? '세금계산서 없음' : '불러오는 중…'}</div>`;
  const tools = STAFF() && !P && kind === 'tax' && srcOf(d, 'tax') ? `<button type="button" data-nh="deltax" aria-label="세금계산서 지우기" style="position:absolute;bottom:8px;right:46px;width:30px;height:30px;border-radius:15px;border:1px solid #F1B5AF;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">${TRASH}</button><button type="button" data-nh="pick" data-k="tax" aria-label="세금계산서 바꾸기" style="position:absolute;bottom:8px;right:8px;width:30px;height:30px;border-radius:15px;border:1px solid #D5D8DD;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">${PEN}</button>` : '';
  return `<figure data-nh="panel" data-k="${kind}" style="margin:0;display:flex;flex-direction:column;gap:8px;${sel}">
    <div style="display:flex;align-items:center;gap:8px;min-height:32px;font-size:14px">${no ? `<span style="color:#5C5C5C">승인번호</span><b>${esc(no)}</b>` : ''}</div>
    <figcaption style="display:flex;justify-content:space-between;align-items:center"><b>${label}</b><span style="display:flex;gap:6px">${btns}</span></figcaption>
    <div ${kind === 'tax' && STAFF() ? 'data-nh-drop="tax"' : ''} style="position:relative;aspect-ratio:1588/1400;border:1px solid #D9D9D9;border-radius:6px;overflow:hidden;background:#fff">${box}${tools}</div></figure>`;
}
function modalHtml(d) {
  ensureImg(d); ensureFull(d.id);
  const st = statusOf(d), x = G.docs[d.id] || {};
  const zoomSrc = G.zoom ? viewSrc(d, G.zoom) : '';
  const hasPend = !!(G.pend && G.pend.id === d.id && G.pend.tax);
  return `<div class="nh-ov" data-nh="overlay" style="position:fixed;inset:0;background:rgba(17,20,24,.45);display:flex;align-items:flex-start;justify-content:center;padding:20px 16px;box-sizing:border-box;overflow-y:auto;z-index:50">
    <div class="nh-dlg" role="dialog" aria-modal="true" aria-label="거래명세표 · 세금계산서" style="width:100%;max-width:1360px;background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.25);padding:20px 22px 22px;box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div style="display:flex;flex-direction:column;gap:6px"><b style="font-size:17px">${md(d.ymd)} · ${esc(siteOf(d))}${STAFF() ? ` <button type="button" data-nh="editsite" aria-label="현장 고치기" style="border:0;background:none;padding:2px;cursor:pointer;display:inline-flex;vertical-align:middle">${PEN}</button>` : ''} · ${esc(itemTitle(d))}</b>
          <span style="display:flex;align-items:center;gap:8px;font-size:13px;color:#5C5C5C">합계 ${won(d.total)}원 ${STAFF() ? statusPick(d.id, st) : ''}</span></div>
        <div style="display:flex;gap:8px;align-items:center">
          ${hasPend ? '<button type="button" data-nh="pend-save" style="height:40px;padding:0 22px;border:0;border-radius:8px;background:#1F2328;color:#fff;font:inherit;font-size:15px;font-weight:800;cursor:pointer">저장</button>' : ''}
          ${STAFF() ? `<button type="button" data-nh="delrow" aria-label="목록에서 삭제" style="width:40px;height:40px;border:1px solid #F1B5AF;border-radius:8px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">${TRASH}</button>` : ''}
          <button type="button" data-nh="both" style="height:40px;padding:0 16px;border:1px solid #1F2328;border-radius:8px;background:#fff;color:#1F2328;font:inherit;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px">${DOWN}2장 한 번에 다운로드</button>
          <button type="button" data-nh="close" aria-label="닫기" style="width:40px;height:40px;border:1px solid #E6E4DF;border-radius:20px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">${X}</button>
        </div>
      </div>
      <div class="nh-two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">${docBox('stmt', d)}${docBox('tax', d)}</div>
      ${STAFF() ? `<div style="margin:4px -22px -22px;padding:18px 22px 22px;background:#F3F4F6;border-radius:0 0 14px 14px;display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px">
        <label style="flex:1 1 480px;display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:#3F3F46">수정요청 사유
          <textarea data-nh="reason" rows="1" style="height:44px;min-height:44px;resize:vertical;border:1px solid #3F3F46;border-radius:10px;padding:10px 12px;font:inherit;font-size:14px;font-weight:400;background:#fff;box-sizing:border-box">${esc(G.reason || (st === '수정요청' ? x.reason || '' : ''))}</textarea></label>
        <div style="display:flex;gap:8px"><button type="button" data-nh="reject" style="height:44px;min-width:128px;padding:0 18px;border-radius:8px;border:1px solid #B42318;background:#fff;color:#B42318;font:inherit;font-size:15px;font-weight:700;cursor:pointer">수정요청</button>
          ${['결재전', '수정요청'].includes(st) ? '<button type="button" data-nh="draft" style="height:44px;min-width:128px;padding:0 18px;border-radius:8px;border:1px solid #1D4F91;background:#1D4F91;color:#fff;font:inherit;font-size:15px;font-weight:700;cursor:pointer">기안 확정</button>' : ''}</div>
      </div>` : ''}
    </div>
  </div>
  ${zoomSrc ? `<div data-nh="unzoom" style="position:fixed;inset:0;background:rgba(10,12,14,.82);z-index:60;overflow:auto;padding:24px;box-sizing:border-box;cursor:zoom-out"><button type="button" data-nh="unzoom" aria-label="닫기" style="position:fixed;top:16px;right:16px;width:44px;height:44px;border-radius:22px;border:0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center">${X}</button><img src="${zoomSrc}" alt="크게 보기" style="display:block;width:min(100%,1588px);margin:0 auto;border-radius:6px;background:#fff"></div>` : ''}`;
}

// ── 파일 ─────────────────────────────────────────
const readUrl = (file) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => no(new Error('파일을 읽지 못했어요')); r.readAsDataURL(file); });
async function toStored(file) {     // 그림은 2200px 안쪽 JPG 로, PDF 는 그대로 (4MB 까지)
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '')) { if (file.size > 4e6) throw new Error('PDF 가 너무 커요 (4MB 까지)'); return readUrl(file); }
  const url = await readUrl(file);
  const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('그림을 읽지 못했어요')); i.src = url; });
  const k = Math.min(1, 2200 / Math.max(im.width, im.height));
  const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.88);
}
async function attach(id, file) {   // 올린 세금계산서는 미리보기 + [저장] (공간과 같음)
  if (!file || !STAFF()) return;
  try { G.pend = { id, tax: { name: file.name || '세금계산서', data: await toStored(file) } }; G.panel = 'tax'; ctx.rerender(); } catch (e) { alert(e.message || e); }
}
async function commitPending() {
  const p = G.pend; if (!p || !p.tax) return;
  G.pend = null;
  const prev = G.docs[p.id] || {};
  await save(p.id, { tax_data: p.tax.data, tax_name: p.tax.name, tax_no: null, status: prev.status === '수정요청' ? null : prev.status || null });
  findTaxNo(p.id, p.tax.data);
}
async function leavePend() {
  if (!G.pend) return;
  if (confirm('올린 세금계산서를 아직 저장하지 않았어요.\n[확인] 저장하고 닫기 · [취소] 저장하지 않고 닫기')) await commitPending();
  else G.pend = null;
}
async function canvasOf(src) {
  if (src.startsWith('data:application/pdf')) return pdfCanvas(src);
  const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('그림을 읽지 못했어요')); i.src = src; });
  const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0); return c;
}
const fileName = (d, kind) => `${d.ymd.slice(2)}_${siteOf(d).replace(/[\\/:*?"<>|]/g, ' ')}_${kind === 'stmt' ? '거래명세표' : kind === 'tax' ? '세금계산서' : '거래명세표_세금계산서'}.pdf`;
async function savePdf(d, kinds) {   // 한 장 또는 2장 한 번에 — A4 한 쪽에 하나씩
  try {
    const { jsPDF } = await loadJs(JSPDF, () => window.jspdf);
    let doc = null;
    for (const kind of kinds) {
      const src = srcOf(d, kind); if (!src || src === 'loading') continue;
      const c = await canvasOf(src);
      const land = c.width > c.height * 1.15, W = land ? 297 : 210, Hh = land ? 210 : 297, m = 8;
      if (!doc) doc = new jsPDF({ orientation: land ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' }); else doc.addPage('a4', land ? 'landscape' : 'portrait');
      const k = Math.min((W - m * 2) / c.width, (Hh - m * 2) / c.height);
      doc.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', (W - c.width * k) / 2, m, c.width * k, c.height * k);
    }
    if (doc) doc.save(fileName(d, kinds.length > 1 ? 'both' : kinds[0]));
  } catch (e) { alert('PDF 로 저장하지 못했어요 — ' + (e.message || e)); }
}
async function copyImg(d, kind) {
  const src = srcOf(d, kind); if (!src || src === 'loading') return;
  try {
    const c = await canvasOf(src);
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    alert(`${kind === 'stmt' ? '거래명세표' : '세금계산서'}를 복사했어요.`);
  } catch (e) { alert('복사하지 못했어요 — 그림에서 오른쪽 클릭 → 이미지 복사를 써주세요.'); }
}

// ── 입력 ─────────────────────────────────────────
const pick = () => { const f = document.getElementById('nh-file'); if (f) { f.value = ''; f.click(); } };
export function bind(app, c) {
  ctx = c;
  app.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-nh]'); if (!t || !app.querySelector('.nh')) return;
    const a = t.dataset.nh, id = t.dataset.id, cur = G.open && G.list.find((d) => d.id === G.open);
    const staffOnly = ['addtax', 'pick', 'deltax', 'delrow', 'editsite', 'reject', 'draft', 'pend-save', 'pend-cancel', 'start'];
    if (!STAFF() && staffOnly.includes(a)) return;
    if (a === 'site') { G.site = t.dataset.v; G.picked = true; G.status = '전체'; G.open = null; ctx.rerender(); }
    else if (a === 'tab') { G.tab = t.dataset.v; ctx.rerender(); }
    else if (a === 'status') { G.status = t.dataset.v; ctx.rerender(); }
    else if (a === 'row') { if (e.target.closest('button, input, a, label, select')) return; G.open = id; G.reason = ''; G.zoom = ''; G.panel = 'tax'; ctx.rerender(); }
    else if (a === 'overlay') { if (e.target === t) { await leavePend(); G.open = null; ctx.rerender(); } }
    else if (a === 'close') { await leavePend(); G.open = null; G.zoom = ''; ctx.rerender(); }
    else if (a === 'zoom') { G.zoom = t.dataset.k; ctx.rerender(); }
    else if (a === 'unzoom') { G.zoom = ''; ctx.rerender(); }
    else if (a === 'panel') { if (G.panel !== t.dataset.k) { G.panel = t.dataset.k; ctx.rerender(); } }
    else if (a === 'addtax') { G.open = id; G.panel = 'tax'; ctx.rerender(); pick(); }
    else if (a === 'pick') pick();
    else if (a === 'pend-save') commitPending();
    else if (a === 'pend-cancel') { G.pend = null; ctx.rerender(); }
    else if (a === 'deltax' && cur) { if (confirm('삭제하시겠습니까?')) save(cur.id, { tax_data: null, tax_name: null, tax_no: null }); }
    else if (a === 'delrow' && cur) {
      if (!confirm(`이 장을 목록에서 삭제하시겠습니까?\n${md(cur.ymd)} ${siteOf(cur)} ${won(cur.total)}원`)) return;
      G.list = G.list.filter((d) => d.id !== cur.id); G.open = null; save(cur.id, { status: '삭제' });
    }
    else if (a === 'editsite' && cur) {   // 이 장의 현장 바꾸기 — 비우면 맥 도우미가 정한 현장
      const v = prompt('현장', siteOf(cur)); if (v === null) return;
      const m = { ...((G.docs[cur.id] || {}).manual || {}) };
      if (v.trim() && v.trim() !== cur.place) m.site = v.trim(); else delete m.site;
      await save(cur.id, { manual: Object.keys(m).length ? m : null }); G.site = siteOf(cur); ctx.rerender();
    }
    else if (a === 'draft' && cur) { if (confirm(`기안 확정하시겠습니까?\n${md(cur.ymd)} ${siteOf(cur)} ${won(cur.total)}원`)) save(cur.id, { status: '기안중', drafted_at: new Date().toISOString() }); }
    else if (a === 'reject' && cur) { save(cur.id, { status: '수정요청', reason: G.reason.trim() || (G.docs[cur.id] || {}).reason || '수정요청' }); G.reason = ''; }
    else if (a === 'copy' && cur) copyImg(cur, t.dataset.k);
    else if (a === 'pdf' && cur) savePdf(cur, [t.dataset.k]);
    else if (a === 'both' && cur) savePdf(cur, ['stmt', 'tax']);
    else if (a === 'start') ctx.goStart();
    else if (a === 'logout') ctx.logout();
  });
  app.addEventListener('change', (e) => {
    const t = e.target; if (!app.querySelector('.nh') || !STAFF()) return;
    if (t.id === 'nh-file') { const f = t.files && t.files[0]; if (G.open) attach(G.open, f); return; }
    if (t.dataset.nh === 'setstatus') { const v = t.value; save(t.dataset.id, v === '결재전' ? { status: null } : v === '기안중' ? { status: v, drafted_at: new Date().toISOString() } : { status: v }); }
  });
  app.addEventListener('input', (e) => { if (e.target.dataset.nh === 'reason') G.reason = e.target.value.slice(0, 300); });
  const dropBox = (e) => STAFF() && G.open && e.target.closest && e.target.closest('[data-nh-drop="tax"]');
  app.addEventListener('dragover', (e) => { const b = dropBox(e); if (!b) return; e.preventDefault(); b.style.outline = '3px solid #1D4F91'; });
  app.addEventListener('dragleave', (e) => { const b = dropBox(e); if (b) b.style.outline = ''; });
  app.addEventListener('drop', (e) => {
    const b = dropBox(e); if (!b) return;
    e.preventDefault(); b.style.outline = '';
    const f = [...((e.dataTransfer && e.dataTransfer.files) || [])].find((x) => /^image\/|pdf$/.test(x.type) || /\.pdf$/i.test(x.name));
    if (f) attach(G.open, f); else alert('그림(사진·캡처)이나 PDF 파일만 넣을 수 있어요');
  });
  window.addEventListener('paste', (e) => {   // 열린 장에 세금계산서 캡처 붙여넣기 (직원만)
    if (!G.open || !app.querySelector('.nh') || !STAFF()) return;
    const cd = e.clipboardData || {};
    const f = [...(cd.files || [])][0] || ([...(cd.items || [])].find((i) => i.kind === 'file') || { getAsFile: () => null }).getAsFile(); if (!f) return;
    e.preventDefault(); attach(G.open, f);
  });
  window.addEventListener('beforeunload', (e) => { if (G.pend) { e.preventDefault(); e.returnValue = ''; } });
}
