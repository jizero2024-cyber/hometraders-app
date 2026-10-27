// 공간제작소 BMS — 거래명세표 · 세금계산서 · 기안 (2026-10-23, 시안 https://claude.ai/artifact/Kmkve915nhwknjJYE76xGE)
// 줄 = 이카운트 판매현황의 공간제작소 판매 줄(gonggan_sales, 맥 도우미가 올림) → 거래명세표 변환기(stmt.js)로 장마다 나눔.
// 장마다 상태·세금계산서·수정요청 사유 = gonggan_docs. 홈트레이더스·현구 과장님 같은 화면.
import * as S from './gonggan-store.js?v=6';   // 우리 업무 앱 저장소와 따로 (10/23)
import * as SM from './stmt.js?v=101';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = (n) => Math.round(Number(n) || 0).toLocaleString();
const HEAD = ['일자-No.', '거래처명', '품목명(규격)', '수량', '단가', '공급가액', '부가세'];
const STATUS = ['전체', '결재전', '기안중', '수정요청', '최종완료'];
const BADGE = { 결재전: 'background:#FFF1E6;color:#B4471A', 기안중: 'background:#EAF1FB;color:#1D4F91', 수정요청: 'background:#FDECEC;color:#B42318', 최종완료: 'background:#1F2328;color:#fff' };
const PEN = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 2.5l3 3L6 13H3v-3z" fill="none" stroke="#1F2328" stroke-width="1.6" stroke-linejoin="round"></path></svg>';
const TRASH = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" fill="none" stroke="#D92D20" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
const X = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="#1F2328" stroke-width="1.8" stroke-linecap="round"></path></svg>';
const DOWN = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8M4.5 7L8 10.5 11.5 7M3 13h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
const CHEV = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" style="position:absolute;right:14px;top:12px;pointer-events:none"><path d="M4 6l4 4 4-4" fill="none" stroke="#1F2328" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

const G = { biz: 'homt', loaded: '', loading: false, err: '', list: [], docs: {}, month: '전체', status: '전체', site: '', q: '', page: 1, size: 20,
  pick: new Set(), open: null, zoom: '', reason: '', img: {}, full: {}, busy: '', reg: null, view: 'list', wait: [], waitBusy: '', waitMeta: {}, waitOpen: '' };
let ctx = { rerender: () => {}, goStart: () => {}, go: () => {}, me: () => '', slips: async () => ({ slips: [] }), helper: async () => ({}), helperUp: () => false };

// ── 데이터 ─────────────────────────────────────────
const slipKey = (slip) => { const m = /(20\d\d)\/(\d{1,2})\/(\d{1,2})\s*-\s*(\d+)/.exec(String(slip)); return m ? `${m[1]}${m[2].padStart(2, '0')}${m[3].padStart(2, '0')}-${m[4]}` : String(slip); };
// 운반비 빠진 출고는 화면에 표시하지 않음 — 공간제작소와 같이 보는 화면 (10/23 대표). 누락은 출고일보 작업(ROUTINE)에서 이카운트에 넣음
// 직접 등록한 장 (gonggan_docs.manual = {ymd, site, partner, items:[{name, qty, price}]}) → 목록 한 장
function manualDoc(x) {
  const m = x.manual, date = new Date(+m.ymd.slice(0, 4), +m.ymd.slice(4, 6) - 1, +m.ymd.slice(6, 8));
  const items = m.items.map((it) => {   // m.vatIn: 단가가 부가세 포함가 (10/27 대표 — 소수점 떼서 넣지 말고 포함가로) — 예전 장은 그대로 별도가
    const amt = Math.round((Number(it.qty) || 0) * (Number(it.price) || 0));
    const supply = m.vatIn ? Math.round(amt / 1.1) : amt;
    return { date, name: it.name, qty: Number(it.qty) || 0, supply, vat: m.vatIn ? amt - supply : Math.round(supply * 0.1) };
  });
  return { id: x.id, reg: m.reg || '', ymd: m.ymd, slip: `${m.ymd}-${m.no || 1}`, seq: m.no || 1, partner: m.partner || '(주)공간제작소', site: m.site || '', items, manual: true, total: m.total ? Number(m.total) : items.reduce((a, i) => a + i.supply + i.vat, 0) };
}
const docId = (d) => `${d.ymd}|${(d.slips || [d.slip]).slice().sort().join(',')}|${(d.items[0] || {}).name || ''}`;
// 거래명세표 그림을 바꿔 넣을 때 적은 합계 (gonggan_docs.manual = {total}) — 목록·제목 합계를 그 값으로 (10/26 공간제작소 수정요청)
const itemsTotal = (d) => d.items.reduce((a, x) => a + x.supply + x.vat, 0);
const ovTotal = (id) => { const m = (G.docs[id] || {}).manual; return m && m.total ? Number(m.total) : null; };
export async function load(biz, force) {
  if (G.loading || (G.loaded === biz && !force)) return;
  G.biz = biz; G.loading = true; G.err = '';
  try {
    const [sales, docs] = await Promise.all([S.getGongganSales(biz), S.getGongganDocs(biz)]);
    const lineNo = (id) => { const p = String(id).split('|')[1] || ''; return /^\d+$/.test(p) ? +p : 1e6; };   // 전표 줄 순서대로 (1, 2, … 10 — 붙인 실리콘·운반비는 뒤)
    sales.sort((a, b) => String(a.id).split('|')[0].localeCompare(String(b.id).split('|')[0]) || lineNo(a.id) - lineNo(b.id));
    const rows = sales.map((r) => [r.slip, r.partner, r.name, r.qty, r.price, r.supply, r.vat]);
    const list = rows.length ? SM.splitSheets(SM.parseSales([[HEAD, ...rows]]), {}) : [];
    G.docs = Object.fromEntries(docs.map((x) => [x.id, x]));
    const regOf = {};
    sales.forEach((r) => { const k = slipKey(r.slip); if (r.reg && (!regOf[k] || r.reg < regOf[k])) regOf[k] = r.reg; });
    const noOf = {};                                      // 판매전표 → 출고일보 출고번호 (10/26 대표 "맨 왼쪽에 표시")
    sales.forEach((r) => { const k = slipKey(r.slip); if (r.board_no && !noOf[k]) noOf[k] = r.board_no; });
    const manual = docs.filter((x) => x.manual && x.manual.items).map(manualDoc);   // 직접 등록한 장 (10/23)
    G.list = [...list.map((d) => ({ ...d, id: docId(d), total: ovTotal(docId(d)) ?? itemsTotal(d) })), ...manual]
      .map((d) => ({ ...d, site0: d.site, site: ((G.docs[d.id] || {}).manual || {}).site || d.site, reg: d.manual ? (d.reg || '') : (d.slips || [d.slip]).map((sl) => regOf[sl]).filter(Boolean).sort()[0] || '', no: d.manual ? '' : (d.slips || [d.slip]).map((sl) => noOf[slipKey(sl)]).find(Boolean) || '' }))   // 직접 등록한 장은 번호가 이카운트 전표가 아님
      .filter((d) => (G.docs[d.id] || {}).status !== '삭제')                         // 지운 장은 안 보임 (10/23)
      .sort((a, b) => (b.ymd + b.slip).localeCompare(a.ymd + a.slip));
    G.wait = [];                                         // 올릴 전표 (10/27) — 홈트 목록에만, 공간제작소 계정은 안 봄
    if (biz === 'homt' && ctx.me() !== 'space1234') {
      const [w, wm] = await Promise.all([S.getGongganSales('homt_wait').catch(() => []), S.getGongganDocs('homt_wait').catch(() => [])]);
      G.waitMeta = Object.fromEntries(wm.filter((x) => x.manual && x.manual.slip).map((x) => [x.manual.slip, x.manual]));   // 전표 → {pdf, who} (맥이 올림)
      w.sort((a, b) => String(a.id).split('|')[0].localeCompare(String(b.id).split('|')[0]) || lineNo(a.id) - lineNo(b.id));
      const wl = w.length ? SM.splitSheets(SM.parseSales([[HEAD, ...w.map((r) => [r.slip, r.partner, r.name, r.qty, r.price, r.supply, r.vat])]]), {}) : [];
      G.wait = wl.map((d) => ({ ...d, id: docId(d), total: itemsTotal(d), rows: w.filter((r) => (d.slips || [d.slip]).includes(slipKey(r.slip))) }))
        .sort((a, b) => (b.ymd + b.slip).localeCompare(a.ymd + a.slip));
    }
    G.syncAt = [...sales.map((r) => r.updated_at), ...docs.map((x) => x.updated_at)].filter(Boolean).map((t) => new Date(t)).sort((a, b) => b - a)[0] || null;
    G.feed = feedOf(G.list);
    G.loaded = biz;
  } catch (e) { G.err = e.message || String(e); }
  G.loading = false; ctx.rerender();
}
// 상태 직접 바꾸기 (10/23 대표 "기안중 결재전 이런 식으로") — 색 띠 모양 그대로 고르는 칸
const statusPick = (id, st) => LIM() ? `<span style="display:inline-block;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:700;${BADGE[st]}">${st}</span>` : `<select data-gb="setstatus" data-id="${esc(id)}" aria-label="상태 바꾸기" style="appearance:none;-webkit-appearance:none;border:0;cursor:pointer;padding:4px 10px;border-radius:12px;font:inherit;font-size:12px;font-weight:700;text-align:center;${BADGE[st]}">${STATUS.slice(1).map((k) => `<option style="color:#1F2328;background:#fff" ${k === st ? 'selected' : ''}>${k}</option>`).join('')}</select>`;
// 현구대리님 계정(space1234) — 수정요청 · 기안 확정만 (10/27 대표). 최종완료는 우리가 입금 확인 후. 고치기·넣기·지우기 버튼은 안 보이고 눌려도 안 됨
const LIM = () => ctx.me() === 'space1234';
const LIM_ACTS = new Set(['editsite', 'edittitle', 'edittotal', 'delrow', 'delstmt', 'deltax', 'replace', 'addstmt', 'addtax', 'pend-save', 'pend-cancel', 'editno', 'reg', 'reg-save']);
const limHtml = (h) => (!LIM() ? h : h.replace(/<button[^>]*data-gb="(?:editsite|edittitle|edittotal|delrow|delstmt|deltax|replace|addstmt|addtax|pend-save|editno)"[^>]*>[\s\S]*?<\/button>/g, '')
  .replace(/<b>(거래명세표|세금계산서) 넣기<\/b><span[^>]*>[^<]*<\/span>/g, '<b>$1 없음</b>'));
const statusOf = (d) => { const x = G.docs[d.id] || {}; return ['최종완료', '수정요청', '기안중'].includes(x.status) ? x.status : '결재전'; };   // 세금계산서를 넣어도 결재전 (10/23 대표)
async function save(id, patch) {
  const prev = G.docs[id] || { id, biz: G.biz };
  const row = { ...prev, ...patch, id, biz: G.biz, updated_by: ctx.me(), updated_at: new Date().toISOString() };
  const { tax_data, stmt_data, ...light } = row;
  G.docs[id] = light;
  if ('tax_data' in patch || 'stmt_data' in patch) G.full[id] = { ...(G.full[id] || {}), ...('tax_data' in patch ? { tax_data } : {}), ...('stmt_data' in patch ? { stmt_data } : {}) };
  ctx.rerender();
  const err = await S.saveGongganDoc(row);
  if (err) { alert('저장에 실패했어요 — ' + err); }
}
async function ensureFull(id) {
  if (G.full[id]) return;
  G.full[id] = { loading: true };
  try { G.full[id] = await S.getGongganDocFull(id) || {}; } catch (e) { G.full[id] = {}; }
  ctx.rerender();
  const x = G.docs[id] || {};
  if (G.full[id].tax_data && !x.tax_no) findTaxNo(id, G.full[id].tax_data);   // 예전에 넣은 세금계산서도 승인번호 찾기
}
// ── 세금계산서 승인번호 (20261013-10261013-99366706) — PDF 는 글자 그대로, 그림은 글자 인식 (10/23 대표) ──
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const loadJs = (src, has) => (has() ? Promise.resolve(has()) : new Promise((ok, no) => { const el = document.createElement('script'); el.src = src; el.onload = () => ok(has()); el.onerror = () => no(new Error('도구를 못 받았어요 — 인터넷 연결 확인')); document.head.appendChild(el); }));
const NO_RE = /(\d{8})\s*[-–—]\s*(\d{8})\s*[-–—]\s*(\d{8})/;
async function textOf(dataUrl) {
  if (dataUrl.startsWith('data:application/pdf')) {
    const lib = await loadJs(PDFJS, () => window.pdfjsLib);
    lib.GlobalWorkerOptions.workerSrc = PDFJS.replace('pdf.min.js', 'pdf.worker.min.js');
    const bin = Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0));
    const pdf = await lib.getDocument({ data: bin }).promise;
    const pg = await pdf.getPage(1);
    return (await pg.getTextContent()).items.map((it) => it.str).join(' ');
  }
  const OCR = await import('./stmt-ocr.js');
  const blob = await (await fetch(dataUrl)).blob();
  return (await OCR.readImage(blob)).join(' ');
}
const finding = new Set();
async function findTaxNo(id, dataUrl) {
  if (finding.has(id)) return;
  finding.add(id);
  try {
    // 홈택스 PDF 는 글자마다 빈칸이 끼어 있음 (2 0 2 6 1 0 1 3 - …) → 빈칸을 다 빼고 찾음
    const m = NO_RE.exec((await textOf(dataUrl)).replace(/[Oo]/g, '0').replace(/\s+/g, ''));
    if (m) save(id, { tax_no: `${m[1]}-${m[2]}-${m[3]}` });
  } catch (e) { /* 못 찾으면 손으로 */ }
  finding.delete(id);
  ctx.rerender();   // '찾는 중…' 지우기
}
async function ensureImg(d) {
  if (G.img[d.id]) return;
  G.img[d.id] = 'loading';
  try { G.img[d.id] = URL.createObjectURL(await SM.pngBlob(d, G.biz === 'ace' ? 'ace' : 'homt')); } catch (e) { G.img[d.id] = ''; }
  ctx.rerender();
}

// ── 화면 ─────────────────────────────────────────
const md = (ymd) => `${ymd.slice(4, 6)}/${ymd.slice(6, 8)}`;
const hm = (t) => { const d = t instanceof Date ? t : new Date(t); return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const regTime = (reg) => (/\d{1,2}:\d{2}/.exec(reg || '') || [''])[0];   // 등록 시각 (10/27부터 올라간 것만 — 예전 것은 날짜만)
// 상단 업데이트 (10/27 대표 "상단에 업데이트 내용 자동으로") — 최근 3일 새로 올라온 장 + 상태·계산서·입금이 바뀐 장, 최근 순 6개
function feedOf(list) {
  const since = Date.now() - 3 * 864e5, out = [];
  for (const d of list) {
    const t = regTime(d.reg);
    if (t) { const at = new Date(`${d.reg.slice(0, 10)}T${t}:00`); if (at >= since) out.push({ at, id: d.id, tag: '새로 올라옴' }); }
    const x = G.docs[d.id];
    if (x && x.updated_at && new Date(x.updated_at) >= since) out.push({ at: new Date(x.updated_at), id: d.id, tag: x.paid ? '입금' : ['최종완료', '수정요청', '기안중'].includes(x.status) ? x.status : x.tax_name ? '계산서' : '수정' });
  }
  return out.sort((a, b) => b.at - a.at).filter((f, i, a) => a.findIndex((g) => g.id === f.id && g.tag === f.tag) === i).slice(0, 6);
}
const itemTitle = (d) => ((G.docs[d.id] || {}).manual || {}).title || `${(d.items[0] || {}).name || ''}${d.items.length > 1 ? ` 외 ${d.items.length - 1}개` : ''}`;   // 손으로 고친 제목(manual.title) 먼저 (10/26 공간제작소)
function filtered() {
  const q = G.q.trim().toLowerCase();
  return G.list.filter((d) => (G.month === '전체' || d.ymd.slice(4, 6) === G.month)
    && (!G.site || d.site === G.site)
    && (!q || `${d.site} ${d.no || ''} ${d.slip} ${(d.slips || []).join(' ')} ${d.items.map((x) => x.name).join(' ')}`.toLowerCase().includes(q)));
}
export function screen() {
  const isAce = G.biz === 'ace';
  if (G.loaded !== G.biz && !G.loading) load(G.biz);
  const base = filtered();
  const shown = base.filter((d) => G.status === '전체' || statusOf(d) === G.status);
  const pages = Math.max(1, Math.ceil(shown.length / G.size)); if (G.page > pages) G.page = pages;
  const rows = shown.slice((G.page - 1) * G.size, G.page * G.size);
  const months = [...new Set(G.list.map((d) => d.ymd.slice(4, 6)))].sort();
  const sites = [...new Set(G.list.map((d) => d.site).filter(Boolean))].sort();
  const cnt = (k) => base.filter((d) => k === '전체' || statusOf(d) === k).length;
  const tab = (on) => `height:38px;padding:0 16px;border-radius:19px;font:inherit;font-size:14px;cursor:pointer;${on ? 'background:#1F2328;color:#fff;border:1px solid #1F2328;font-weight:700' : 'background:#fff;color:#1F2328;border:1px solid #E6E4DF'}`;
  const open = G.open && G.list.find((d) => d.id === G.open);
  return `<div class="gb" style="font-family:Pretendard,'Noto Sans KR',system-ui,sans-serif;color:#1F2328;background:#F7F7F5;min-height:100vh;display:flex;flex-wrap:wrap"><style>
.gb .gb-cards{display:none}
@media (max-width:760px){
 .gb .gb-nav{flex:1 1 100%!important;max-width:none!important;flex-direction:row!important;align-items:center;gap:6px!important;padding:8px 12px!important;border-right:0!important;border-bottom:1px solid #E6E4DF;position:sticky;top:0;z-index:5}
 .gb .gb-nav button{padding:8px 12px!important;margin:0!important;font-size:13px!important}
 .gb .gb-nav button span+span{margin-left:6px;opacity:.7}
 .gb .gb-nav [data-gb="logout"],.gb .gb-nav [data-gb="start"]{margin-left:auto!important;padding:8px 4px!important}
 .gb .gb-nav [data-gb="start"]~[data-gb="logout"]{margin-left:0!important}
 .gb .gb-logo{padding:0 6px 0 0!important}.gb .gb-logo img{height:26px!important}.gb .gb-logo img+span+img{display:none}.gb .gb-logo span{display:none}
 .gb .gb-main{padding:14px 12px 40px!important;gap:12px!important}
 .gb .gb-h1{font-size:17px!important}
 .gb .gb-months{flex-wrap:nowrap!important;overflow-x:auto;padding-bottom:2px}.gb .gb-months button{flex:0 0 auto;height:34px!important;font-size:13px!important}
 .gb .gb-stat{gap:6px!important}.gb .gb-stat button{padding:8px 4px!important;align-items:center!important;text-align:center!important}
 .gb .gb-stat button *{font-size:11px!important}.gb .gb-stat button b,.gb .gb-stat button strong{font-size:18px!important}
 .gb .gb-table{display:none}.gb .gb-cards{display:flex;flex-direction:column;gap:10px}
 .gb .gb-ov{padding:0!important}.gb .gb-dlg{border-radius:0!important;min-height:100vh;padding:14px 12px 18px!important;max-width:none!important}
 .gb .gb-dlg>div:first-child{flex-direction:column!important}
 .gb .gb-two{grid-template-columns:1fr!important}
 .gb .gb-dlg button,.gb .gb-dlg select{min-height:40px}
}
</style>
  <nav class="gb-nav" aria-label="메뉴" style="flex:1 1 220px;max-width:240px;background:#fff;border-right:1px solid #E6E4DF;padding:20px 14px;box-sizing:border-box;display:flex;flex-direction:column;gap:4px">
    <div class="gb-logo" style="display:flex;align-items:center;gap:10px;padding:4px 8px 18px"><img src="/icons/partner-gongan.png" alt="공간제작소" style="height:40px"><span aria-hidden="true" style="color:#8A8A8A">×</span><img src="/icons/logo-full.png" alt="HOME TRADERS" style="height:36px"></div>
    <button type="button" data-gb="biz" data-v="homt" style="${navStyle(!isAce && G.view !== 'wait')}"><span>홈트레이더스</span><span>${isAce ? '' : G.list.length}</span></button>
    <button type="button" data-gb="biz" data-v="ace" style="${navStyle(isAce)}"><span>에이스</span><span>${isAce ? G.list.length : ''}</span></button>
    ${ctx.me() === 'space1234' || isAce ? '' : `<button type="button" data-gb="view" data-v="${G.view === 'wait' ? 'list' : 'wait'}" style="${navStyle(G.view === 'wait')};margin-top:10px"><span>올릴 전표</span><span style="${G.wait.length ? 'min-width:20px;padding:0 6px;border-radius:10px;background:#E8732C;color:#fff;font-size:12px;text-align:center' : ''}">${G.wait.length || ''}</span></button>`}
    ${ctx.me() === 'space1234' ? '' : '<button type="button" data-gb="start" style="margin-top:auto;border:0;background:none;text-align:left;padding:14px 8px 4px;font:inherit;font-size:12px;color:#6B6B6B;cursor:pointer">‹ 처음 화면</button>'}
    <button type="button" data-gb="logout" style="${ctx.me() === 'space1234' ? 'margin-top:auto;' : ''}border:0;background:none;text-align:left;padding:10px 8px 4px;font:inherit;font-size:12px;color:#9A9A9A;cursor:pointer">로그아웃</button>
  </nav>
  <main class="gb-main" style="flex:999 1 560px;min-width:0;padding:28px 32px 48px;box-sizing:border-box;display:flex;flex-direction:column;gap:18px">
    ${G.view === 'wait' && !isAce ? waitHtml() + '<div hidden>' : ''}
    <h1 class="gb-h1" style="margin:0;font-size:22px">공간제작소 거래명세표 · 세금계산서 <span style="display:inline-block;vertical-align:middle;margin-left:8px;padding:3px 10px;border-radius:12px;font-size:13px;${isAce ? 'background:#E8EDF4;color:#1F3A5F' : 'background:#FDF0E6;color:#9A3412'}">${isAce ? '에이스' : '홈트레이더스'}</span></h1>
    ${G.err ? `<div style="padding:12px 14px;border-radius:8px;background:#FDECEC;color:#7A1A12;font-size:13px">${esc(G.err)}</div>` : ''}
    <div class="gb-months" role="tablist" aria-label="월" style="display:flex;gap:6px;flex-wrap:wrap">
      ${months.map((m) => `<button type="button" role="tab" data-gb="month" data-v="${m}" style="${tab(G.month === m)}">2026년 ${Number(m)}월 <span style="opacity:.7;margin-left:4px">${G.list.filter((d) => d.ymd.slice(4, 6) === m).length}</span></button>`).join('')}
      <button type="button" role="tab" data-gb="month" data-v="전체" style="${tab(G.month === '전체')}">전체보기 <span style="opacity:.7;margin-left:4px">${G.list.length}</span></button>
    </div>
    ${G.syncAt ? `<section class="gb-feed" aria-label="업데이트" style="background:#fff;border:1px solid #E6E4DF;border-radius:12px;padding:12px 16px;display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#5C5C5C"><b style="color:#1F2328">업데이트</b><span style="font-variant-numeric:tabular-nums">${hm(G.syncAt)}</span></div>
      ${(G.feed || []).map((f) => { const d = G.list.find((x) => x.id === f.id); return d ? `<button type="button" data-gb="feed" data-id="${esc(d.id)}" style="display:flex;align-items:center;gap:10px;border:0;border-top:1px solid #F1EFEA;background:none;padding:8px 0 0;font:inherit;font-size:13px;text-align:left;cursor:pointer;min-width:0">
        <span style="flex:none;font-variant-numeric:tabular-nums;color:#6B6B6B">${hm(f.at)}</span>
        <span style="flex:none;font-size:11px;padding:2px 8px;border-radius:10px;${f.tag === '새로 올라옴' ? 'background:#FDF0E6;color:#9A3412' : 'background:#F3F4F6;color:#3F3F46'}">${esc(f.tag)}</span>
        <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><b>${md(d.ymd)}</b> ${esc(d.site || '')} · ${esc(itemTitle(d))}</span>
        <b style="flex:none;margin-left:auto;font-variant-numeric:tabular-nums">${won(d.total)}</b></button>` : ''; }).join('')}
    </section>` : ''}
    <div class="gb-stat" style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px">
      ${STATUS.map((k) => `<button type="button" data-gb="status" data-v="${k}" style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:14px 16px;border-radius:12px;font:inherit;text-align:left;cursor:pointer;background:#fff;${G.status === k ? 'border:2px solid #E8732C' : 'border:1px solid #E6E4DF'}"><span style="font-size:13px;color:#5C5C5C">${k === '전체' ? '전체보기' : k}</span><b style="font-size:26px">${cnt(k)}<span style="font-size:14px;font-weight:500;margin-left:3px">건</span></b></button>`).join('')}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
      <span style="position:relative;display:inline-flex"><select data-gb="site" aria-label="현장" style="height:38px;border:1px solid #E6E4DF;border-radius:8px;padding:0 40px 0 14px;font:inherit;font-size:13px;background:#fff;appearance:none;-webkit-appearance:none;cursor:pointer"><option value="">전체 현장</option>${sites.map((x) => `<option ${G.site === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>${CHEV}</span>
      <input data-gb="q" aria-label="검색" value="${esc(G.q)}" placeholder="현장, 전표번호, 품목으로 검색…" style="flex:1 1 260px;height:38px;border:1px solid #E6E4DF;border-radius:8px;padding:0 12px;font:inherit;font-size:13px;background:#fff">
    </div>
    <div class="gb-cards">${rows.map(cardHtml).join('') || `<div style="padding:40px;text-align:center;color:#6B6B6B">${G.loading ? '불러오는 중…' : '없어요'}</div>`}</div>
    <div class="gb-table" style="background:#fff;border:1px solid #E6E4DF;border-radius:12px;overflow-x:auto">
      <table style="width:100%;min-width:1000px;border-collapse:collapse;font-size:13px">
        <thead><tr style="background:#FAFAF8;color:#5C5C5C;text-align:left">
          <th style="padding:12px 8px 12px 16px;font-weight:600">출고일</th><th style="padding:12px 8px;font-weight:600">현장</th><th style="padding:12px 8px;font-weight:600">품목명</th>
          <th style="padding:12px 8px;font-weight:600;text-align:right;white-space:nowrap">합계 (VAT 포함)</th><th style="padding:12px 8px;font-weight:600;text-align:center;white-space:nowrap">거래명세표</th>
          <th style="padding:12px 8px;font-weight:600;text-align:center;white-space:nowrap">세금계산서</th><th style="padding:12px 8px;font-weight:600;text-align:center">상태</th><th style="padding:12px 14px 12px 8px;font-weight:600;text-align:center;white-space:nowrap">등록일</th><th style="width:44px"></th>
        </tr></thead>
        <tbody>${rows.map(rowHtml).join('') || `<tr><td colspan="9" style="padding:40px;text-align:center;color:#6B6B6B">${G.loading ? '불러오는 중…' : '없어요'}</td></tr>`}</tbody>
      </table>
    </div>
    <nav aria-label="페이지" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <span style="display:flex;align-items:center;gap:14px;font-size:13px;color:#5C5C5C">총 ${shown.length}건${ctx.me() === 'space1234' ? '' : '<button type="button" data-gb="reg" style="border:0;background:none;padding:0;font:inherit;font-size:12px;color:#9A9A9A;cursor:pointer;text-decoration:underline;text-underline-offset:3px">+ 직접 등록</button>'}</span>
      <div style="display:flex;gap:4px">${Array.from({ length: pages }, (_, i) => i + 1).map((n) => `<button type="button" data-gb="page" data-v="${n}" style="min-width:36px;height:36px;padding:0 10px;border-radius:8px;font:inherit;font-size:13px;cursor:pointer;${n === G.page ? 'background:#1F2328;color:#fff;border:1px solid #1F2328;font-weight:700' : 'background:#fff;color:#1F2328;border:1px solid #E6E4DF'}">${n}</button>`).join('')}</div>
      <span style="position:relative;display:inline-flex"><select data-gb="size" aria-label="한 페이지에" style="height:36px;border:1px solid #E6E4DF;border-radius:8px;padding:0 40px 0 14px;font:inherit;font-size:13px;background:#fff;appearance:none;-webkit-appearance:none;cursor:pointer">${[20, 50, 100].map((n) => `<option value="${n}" ${G.size === n ? 'selected' : ''}>${n}개씩</option>`).join('')}</select>${CHEV}</span>
    </nav>
    ${G.view === 'wait' && !isAce ? '</div>' : ''}
  </main>${G.view === 'wait' ? waitModal() : ''}
  ${open ? modalHtml(open) : ''}${G.reg ? regHtml() : ''}
  <input type="file" id="gb-file" accept="image/*,application/pdf" hidden>
  <input type="file" id="gb-reg-file" multiple accept=".xlsx,.xlsm,.xls,.csv,.pdf,image/*,.heic" hidden>
</div>`;
}
const navStyle = (on) => `display:flex;justify-content:space-between;padding:10px;border-radius:8px;border:0;font:inherit;font-size:14px;cursor:pointer;text-align:left;${on ? 'background:#FDF0E6;color:#9A3412;font-weight:700' : 'background:none;color:#1F2328'}`;
const addBtn = (act, id) => `<button type="button" data-gb="${act}" data-id="${esc(id)}" style="width:92px;height:34px;border-radius:8px;border:1.5px dashed #B8B8B8;background:#F4F4F4;color:#4B4B4B;font:inherit;font-weight:700;font-size:13px;cursor:pointer">+ 넣기</button>`;
const okTag = '<span style="display:inline-block;padding:6px 10px;border-radius:6px;background:#EEF6EE;color:#1E6B34;font-size:12px;font-weight:600;white-space:nowrap">첨부됨</span>';
// 입금 확인 (10/25 대표 — 통장 입금 금액·날짜를 명세표 합계와 맞춘 것) — 상태 아래 검정 라벨 체크 + 입금일
const paidTag = (ymd) => `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px 3px 4px;border-radius:10px;background:#1F2328;color:#fff;font-size:11px;font-weight:700;white-space:nowrap"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.5" fill="#fff"></circle><path d="M4.6 8.3l2.2 2.2 4.6-4.8" fill="none" stroke="#1F2328" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>${md(String(ymd).replace(/-/g, ''))} 입금</span>`;
// 휴대폰 목록 카드 (10/26 대표 "모바일에서 직관적으로") — 누르면 상세
function cardHtml(d) {
  const st = statusOf(d), x = G.docs[d.id] || {};
  const chip = (on, t) => `<span style="font-size:11px;padding:3px 8px;border-radius:10px;${on ? 'background:#EEF6EE;color:#1E6B34' : 'background:#F3F4F6;color:#8A8A8A'}">${on ? '✓ ' : ''}${t}</span>`;
  return limHtml(`<div data-gb="row" data-id="${esc(d.id)}" style="background:#fff;border:1px solid #E6E4DF;border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:6px;cursor:pointer">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span style="font-size:12px;color:#6B6B6B"><b style="color:#1F2328;font-size:14px">${md(d.ymd)}</b> ${esc(d.site || '')}</span>${statusPick(d.id, st)}</div>
    <div style="font-weight:600;font-size:14px;line-height:1.4">${esc(itemTitle(d))}</div>
    ${st === '수정요청' && x.reason ? `<div style="font-size:12px;color:#B42318"><b>수정요청</b> ${esc(x.reason)}</div>` : ''}
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span style="display:flex;gap:4px;flex-wrap:wrap">${chip(!(x.manual || {}).stmtDel, '명세표')}${chip(!!x.tax_name, '계산서')}${x.paid ? paidTag(x.paid) : ''}</span><b style="font-size:15px;font-variant-numeric:tabular-nums">${won(d.total)}원</b></div>
    <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px;color:#9A9A9A">${esc(d.no || '')}${d.reg ? ` · 등록 ${md(d.reg.replace(/-/g, ''))} ${regTime(d.reg)}` : ''}</span><button type="button" data-gb="delrow" data-id="${esc(d.id)}" aria-label="목록에서 삭제" title="목록에서 삭제" style="width:30px;height:30px;border-radius:15px;border:1px solid #F1B5AF;background:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0">${TRASH}</button></div>
  </div>`);
}
// 올릴 전표 (10/27 대표) — 이카운트에 있는데 목록에 아직 없는 공간제작소 판매전표, [올리기] 누르면 바로 목록에
function waitHtml() {
  const btn = (on) => `height:36px;padding:0 16px;border:0;border-radius:8px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;${on ? 'background:#E6E4DF;color:#6B6B6B' : 'background:#E8732C;color:#fff'}`;
  return `<h1 class="gb-h1" style="margin:0;font-size:22px">올릴 전표 <span style="font-size:15px;color:#6B6B6B;font-weight:500;margin-left:4px">${G.wait.length}건</span></h1>
    ${G.err ? `<div style="padding:12px 14px;border-radius:8px;background:#FDECEC;color:#7A1A12;font-size:13px">${esc(G.err)}</div>` : ''}
    <div style="display:flex;flex-direction:column;gap:10px">${G.wait.map((d) => `<div data-gb="wait-open" data-id="${esc(d.id)}" style="background:#fff;border:1px solid #E6E4DF;border-radius:12px;padding:14px 16px;display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;cursor:pointer">
      <div style="flex:0 0 auto;min-width:84px"><b>${md(d.ymd)}</b><div style="font-size:11px;color:#6B6B6B">${esc((d.slips || [d.slip]).map((x) => x.slice(4)).join(', '))}</div></div>
      <div style="flex:1 1 280px;min-width:0"><div style="font-weight:600">${esc(d.site ? d.site + ' · ' : '')}${esc(itemTitle(d))}</div>
        <div style="margin-top:4px;font-size:12px;color:#6B6B6B;line-height:1.6">${d.items.slice(0, 4).map((i) => `${esc(i.name)} ${won(i.qty)}`).join('<br>')}${d.items.length > 4 ? `<br>외 ${d.items.length - 4}줄` : ''}</div></div>
      <span style="flex:0 0 auto;font-size:12px;color:#5C5C5C">입력 <b style="color:#1F2328">${esc(waitWho(d) || '—')}</b></span>
      <b style="flex:0 0 auto;font-variant-numeric:tabular-nums">${won(d.total)}원</b>
      <span style="flex:0 0 auto;display:flex;gap:6px"><button type="button" data-gb="wait-skip" data-id="${esc(d.id)}" ${G.waitBusy ? 'disabled' : ''} style="height:36px;padding:0 12px;border:1px solid #E6E4DF;border-radius:8px;background:#fff;color:#5C5C5C;font:inherit;font-size:13px;cursor:pointer">빼기</button>
      <button type="button" data-gb="wait-up" data-id="${esc(d.id)}" ${G.waitBusy ? 'disabled' : ''} style="${btn(G.waitBusy === d.id)}">${G.waitBusy === d.id ? '올리는 중…' : '올리기'}</button></span>
    </div>`).join('') || `<div style="padding:40px;text-align:center;color:#6B6B6B;background:#fff;border:1px solid #E6E4DF;border-radius:12px">${G.loading ? '불러오는 중…' : '없어요'}</div>`}</div>`;
}
const waitInfo = (d) => (d.slips || [d.slip]).map((sl) => ({ slip: sl, ...(G.waitMeta[sl] || {}) }));
const waitWho = (d) => [...new Set(waitInfo(d).map((x) => x.who).filter(Boolean))].join(', ');
// 올릴 전표 누르면 — 이카운트 판매전표 PDF (출고일보에 붙던 것) + [올리기]
function waitModal() {
  const d = G.wait.find((x) => x.id === G.waitOpen); if (!d) return '';
  const pdfs = waitInfo(d).filter((x) => x.pdf);
  return `<div data-gb="wait-bg" class="gb-ov" style="position:fixed;inset:0;background:rgba(17,20,24,.45);display:flex;align-items:flex-start;justify-content:center;padding:32px 16px;box-sizing:border-box;overflow-y:auto;z-index:50">
    <div class="gb-dlg" role="dialog" aria-label="전표" style="background:#fff;border-radius:14px;width:100%;max-width:880px;padding:18px 20px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b style="font-size:17px">${md(d.ymd)} ${esc(d.site || '')}</b><span style="font-size:13px;color:#6B6B6B">${esc((d.slips || [d.slip]).map((x) => x.slice(4)).join(', '))} · 입력 ${esc(waitWho(d) || '—')} · ${won(d.total)}원</span>
        <span style="flex:1"></span>
        <button type="button" data-gb="wait-up" data-id="${esc(d.id)}" ${G.waitBusy ? 'disabled' : ''} style="height:38px;padding:0 18px;border:0;border-radius:8px;background:#E8732C;color:#fff;font:inherit;font-size:14px;font-weight:700;cursor:pointer">${G.waitBusy === d.id ? '올리는 중…' : '올리기'}</button>
        <button type="button" data-gb="wait-close" aria-label="닫기" style="width:36px;height:36px;border:0;background:none;cursor:pointer">${X}</button></div>
      ${pdfs.length ? pdfs.map((x) => `<iframe src="${esc(x.pdf)}" title="판매전표 ${esc(x.slip)}" style="width:100%;height:72vh;border:1px solid #E6E4DF;border-radius:8px"></iframe>`).join('')
        : `<div style="padding:40px;text-align:center;color:#6B6B6B;background:#FAFAF8;border-radius:8px">전표 PDF 받는 중</div>`}
    </div></div>`;
}
async function waitSkip(id) {
  const d = G.wait.find((x) => x.id === id); if (!d || G.waitBusy) return;
  if (!confirm(`올릴 전표에서 빼시겠습니까?\n${md(d.ymd)} ${d.site || ''} ${won(d.total)}원`)) return;
  G.waitBusy = id; G.err = ''; ctx.rerender();
  try { await S.skipWait(d.slips || [d.slip], d.rows.map((r) => r.id), ctx.me()); G.waitOpen = ''; }
  catch (e) { G.err = e.message || String(e); }
  G.waitBusy = ''; await load(G.biz, true);
}
async function waitUp(id) {
  const d = G.wait.find((x) => x.id === id); if (!d || G.waitBusy) return;
  G.waitBusy = id; G.err = ''; ctx.rerender();
  const n = new Date(), p = (v) => String(v).padStart(2, '0');
  try { await S.putWaitRows(d.rows, `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}`); }
  catch (e) { G.err = e.message || String(e); }
  G.waitBusy = ''; if (!G.err) G.waitOpen = ''; await load(G.biz, true);
}
function rowHtml(d) {
  const st = statusOf(d), x = G.docs[d.id] || {};
  return limHtml(`<tr data-gb="row" data-id="${esc(d.id)}" style="cursor:pointer;border-top:1px solid #EFEDE8;${x.tax_name ? '' : 'background:#FFFCF8'}">
    <td style="padding:12px 8px 12px 16px;white-space:nowrap"><b>${md(d.ymd)}</b><div style="font-size:11px;color:#6B6B6B">${esc(d.no || (d.slips || [d.slip]).map((s) => s.slice(4)).join(', '))}</div></td>
    <td style="padding:12px 8px;white-space:nowrap">${esc(d.site || '')}</td>
    <td style="padding:12px 8px"><div style="font-weight:600">${esc(itemTitle(d))}</div>${st === '수정요청' && x.reason ? `<div style="margin-top:6px;max-width:340px;font-size:12px;line-height:1.5;color:#B42318;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden"><b>수정요청</b> ${esc(x.reason)}</div>` : ''}</td>
    <td style="padding:12px 8px;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums">${won(d.total)}</td>
    <td style="padding:12px 8px;text-align:center">${(x.manual || {}).stmtDel ? addBtn('addstmt', d.id) : okTag}</td>
    <td style="padding:12px 8px;text-align:center">${x.tax_name ? okTag : addBtn('addtax', d.id)}</td>
    <td style="padding:12px 8px;text-align:center;white-space:nowrap">${statusPick(d.id, st)}${x.paid ? `<div style="margin-top:6px">${paidTag(x.paid)}</div>` : ''}</td>
    <td style="padding:12px 14px 12px 8px;text-align:center;white-space:nowrap;font-size:13px;color:#3F3F46">${x.delivered ? `<span style="font-weight:700;color:#1E6B34">✓ ${esc(x.delivered)} 전달완료</span>` : d.reg ? `${md(d.reg.replace(/-/g, ''))}${regTime(d.reg) ? `<div style="font-size:11px;color:#8A8A8A">${regTime(d.reg)}</div>` : ''}` : ''}</td>
    <td style="padding:12px 12px 12px 0;text-align:center"><button type="button" data-gb="delrow" data-id="${esc(d.id)}" aria-label="목록에서 삭제" title="목록에서 삭제" style="width:30px;height:30px;border-radius:15px;border:1px solid #F1B5AF;background:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0">${TRASH}</button></td>
  </tr>`);
}
function docBox(kind, d) { return limHtml(docBox0(kind, d)); }
function docBox0(kind, d) {
  const f = G.full[d.id] || {};
  const hid = kind === 'stmt' && (f.stmt_data === 'none' || !!(((G.docs[d.id] || {}).manual || {}).stmtDel));   // 휴지통으로 지운 명세표 — 목록 줄은 남고 그림만 비움 (10/27 대표)
  const src = kind === 'stmt' ? (hid ? '' : f.stmt_data || (G.img[d.id] && G.img[d.id] !== 'loading' ? G.img[d.id] : '')) : f.tax_data;
  const label = kind === 'stmt' ? '거래명세표' : '세금계산서';
  const no = kind === 'tax' && src ? (G.docs[d.id] || {}).tax_no || '' : '';
  const noRow = kind === 'tax' && src ? `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:14px;min-height:32px">
      <span style="color:#5C5C5C">승인번호</span>
      ${no && !G.editNo ? `<b style="font-size:16px;letter-spacing:.2px">${esc(no)}</b><button type="button" data-gb="editno" aria-label="승인번호 고치기" style="width:28px;height:28px;border-radius:14px;border:1px solid #D5D8DD;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">${PEN}</button>`
        : `<input data-gb="taxno" value="${esc(no)}" placeholder="${finding.has(d.id) ? '찾는 중…' : '20261013-10261013-99366706'}" style="height:32px;width:260px;border:1px solid #D0D0D0;border-radius:6px;padding:0 10px;font:inherit;font-size:14px">`}
      <button type="button" data-gb="copyno" ${no ? '' : 'disabled'} style="height:32px;padding:0 12px;border:1px solid #1D4F91;border-radius:6px;background:#fff;color:#1D4F91;font:inherit;font-size:13px;font-weight:700;cursor:pointer">${G.copied ? '복사됨 ✓' : '복사하기'}</button></div>` : '<div style="min-height:32px"></div>';   // 거래명세표 쪽도 같은 높이 → 두 그림 위아래 맞춤 (10/23 대표)
  const cap = `${noRow}<figcaption style="display:flex;justify-content:space-between;align-items:center"><b>${label}</b><span style="display:flex;gap:6px">${[['copy', '복사'], ['pdf', 'PDF 저장']].map(([a, t]) => `<button type="button" data-gb="${a}" data-k="${kind}" ${src ? '' : 'disabled'} style="height:30px;padding:0 10px;border:1px solid #E6E4DF;border-radius:6px;background:#fff;font:inherit;font-size:12px;cursor:pointer">${t}</button>`).join('')}</span></figcaption>`;
  const pen = `<button type="button" data-gb="replace" data-k="${kind}" aria-label="${label} 바꾸기" style="position:absolute;bottom:8px;right:8px;width:30px;height:30px;border-radius:15px;border:1px solid #D5D8DD;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">${PEN}</button>`;
  // 올린 사진 미리보기는 빈 칸·원래 그림보다 먼저 (10/27 — 세금계산서가 없는 장에서 붙여넣기가 안 보이던 것)
  const P = G.pend && G.pend.id === d.id ? G.pend[kind] : null;
  if (P) {
    const isPdf = P.data.startsWith('data:application/pdf');
    if (isPdf && !P.img && !P.drawing) {   // PDF 도 첫 쪽을 그림으로 미리보기 (10/27 대표 "PDF 넣었을 때 왜 이렇게 떠")
      P.drawing = true;
      pdfCanvas(P.data).then((c) => { P.img = c.toDataURL('image/jpeg', 0.9); ctx.rerender(); }).catch(() => { P.img = ''; P.drawing = false; });
    }
    return `<figure data-gb="panel" data-k="${kind}" style="margin:0;display:flex;flex-direction:column;gap:8px;outline:2px solid #1D4F91;outline-offset:6px;border-radius:6px">${kind === 'tax' ? '<div style="min-height:32px"></div>' : ''}<figcaption style="display:flex;justify-content:space-between;align-items:center"><b>${label}</b><span style="font-size:12px;color:#6B6B6B">${esc(P.name)}</span></figcaption>
      <div style="aspect-ratio:1588/1400;border:1px solid #D9D9D9;border-radius:6px;overflow:hidden;background:#F7F7F5;display:flex;align-items:center;justify-content:center">${isPdf ? (P.img ? `<img src="${P.img}" alt="" style="width:100%;height:100%;object-fit:contain;background:#fff">` : `<span style="color:#6B6B6B;font-size:13px">불러오는 중…</span>`) : `<img src="${P.data}" alt="" style="width:100%;height:100%;object-fit:contain">`}</div>
      <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end;flex-wrap:wrap">${kind === 'stmt' ? `<label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#5C5C5C;margin-right:auto">합계금액 <input data-gb="pend-total" inputmode="numeric" value="${esc(P.total ? Number(P.total).toLocaleString() : '')}" style="height:34px;width:150px;border:1px solid #D0D0D0;border-radius:6px;padding:0 10px;font:inherit;font-size:14px;text-align:right"> 원</label>` : ''}
        <button type="button" data-gb="pend-cancel" data-k="${kind}" style="height:36px;padding:0 16px;border:1px solid #D5D8DD;border-radius:8px;background:#fff;font:inherit;font-size:14px;cursor:pointer">빼기</button></div></figure>`;
  }
  if (hid) return `<figure data-gb="panel" data-k="stmt" style="margin:0;display:flex;flex-direction:column;gap:8px">${cap}<div data-gb="panel" data-k="stmt" tabindex="0" style="aspect-ratio:1588/1400;border:2px dashed ${G.panel === 'stmt' ? '#1D4F91' : '#B8B8B8'};border-radius:8px;background:${G.panel === 'stmt' ? '#EEF3FB' : '#F4F4F4'};color:#4B4B4B;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;outline:none"><b>거래명세표 넣기</b><span style="font-size:13px;color:#6B6B6B">누르고 Ctrl+V (⌘V)</span><span style="display:flex;gap:8px"><button type="button" data-gb="replace" data-k="stmt" style="height:36px;padding:0 16px;border:1px solid #B8B8B8;border-radius:8px;background:#fff;font:inherit;font-size:13px;cursor:pointer">파일 고르기</button></span></div></figure>`;
  if (!src && kind === 'stmt') return `<figure data-gb="panel" data-k="${kind}" style="margin:0;display:flex;flex-direction:column;gap:8px;${G.panel === kind ? 'outline:2px solid #1D4F91;outline-offset:6px;border-radius:6px' : ''}">${cap}<div style="aspect-ratio:1588/1400;border:1px solid #D9D9D9;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#6B6B6B;font-size:13px">불러오는 중…</div></figure>`;
  if (!src) return `<figure data-gb="panel" data-k="${kind}" style="margin:0;display:flex;flex-direction:column;gap:8px;${G.panel === kind ? 'outline:2px solid #1D4F91;outline-offset:6px;border-radius:6px' : ''}">${cap}<div data-gb="panel" data-k="tax" data-gb-drop="tax" tabindex="0" style="aspect-ratio:1588/1400;border:2px dashed ${G.panel === 'tax' ? '#1D4F91' : '#B8B8B8'};border-radius:8px;background:${G.panel === 'tax' ? '#EEF3FB' : '#F4F4F4'};color:#4B4B4B;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;outline:none"><b>세금계산서 넣기</b><span style="font-size:13px;color:#6B6B6B">누르고 Ctrl+V (⌘V) · 끌어다 놓기</span><button type="button" data-gb="replace" data-k="tax" style="height:36px;padding:0 16px;border:1px solid #B8B8B8;border-radius:8px;background:#fff;font:inherit;font-size:13px;cursor:pointer">파일 고르기</button></div></figure>`;   // 빈 칸을 누르면 파일 창 대신 이 칸이 골라짐 → 바로 Ctrl+V (10/27 대표 "세금계산서를 클릭하고 복붙하면 되게")
  const pdf = src.startsWith('data:application/pdf');
  const staff = true;   // 10/26 대표: 공간제작소 계정도 지우기 됨 (계정 나누면 다시 막을 수 있게 남겨 둠)
  const canDelStmt = staff;   // 휴지통 = 명세표 그림만 지움, 목록 줄은 남음 (10/27 대표 "문서 삭제할 때 목록까지 삭제되면 안 돼" · "쓰레기통 기능 어디 갔어")
  const del = kind === 'stmt' && canDelStmt ? `<button type="button" data-gb="delstmt" aria-label="거래명세표 지우기" style="position:absolute;bottom:8px;right:46px;width:30px;height:30px;border-radius:15px;border:1px solid #F1B5AF;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">${TRASH}</button>` : kind === 'tax' && staff ? `<button type="button" data-gb="deltax" aria-label="세금계산서 지우기" style="position:absolute;bottom:8px;right:46px;width:30px;height:30px;border-radius:15px;border:1px solid #F1B5AF;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">${TRASH}</button>` : '';   // 잘못 넣은 세금계산서 지우기 (10/23 대표)
  return `<figure data-gb="panel" data-k="${kind}" style="margin:0;display:flex;flex-direction:column;gap:8px;${G.panel === kind ? 'outline:2px solid #1D4F91;outline-offset:6px;border-radius:6px' : ''}">${cap}<div ${kind === 'tax' ? 'data-gb-drop="tax"' : ''} style="position:relative;aspect-ratio:1588/1400;border:1px solid #D9D9D9;border-radius:6px;overflow:hidden;background:#fff">${pdf && !pdfView(d.id, src) ? '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#6B6B6B;font-size:13px">불러오는 중…</div>' : `<button type="button" data-gb="zoom" data-k="${kind}" aria-label="${label} 크게 보기" style="display:flex;align-items:flex-start;justify-content:center;width:100%;height:100%;padding:0;border:0;background:none;cursor:zoom-in"><img src="${pdf ? pdfView(d.id, src) : src}" alt="${label}" style="max-width:100%;max-height:100%;object-fit:contain;display:block"></button>`}${del}${pen}</div></figure>`;
}
function modalHtml(d) {
  ensureImg(d); ensureFull(d.id);
  const st = statusOf(d), x = G.docs[d.id] || {};
  const zoomSrc = G.zoom === 'stmt' ? (((G.full[d.id] || {}).stmt_data !== 'none' && (G.full[d.id] || {}).stmt_data) || G.img[d.id]) : G.zoom === 'tax' ? viewSrc(d, 'tax') : '';
  return limHtml(`<div class="gb-ov" data-gb="overlay" style="position:fixed;inset:0;background:rgba(17,20,24,.45);display:flex;align-items:flex-start;justify-content:center;padding:20px 16px;box-sizing:border-box;overflow-y:auto;z-index:50">
    <div class="gb-dlg" role="dialog" aria-modal="true" aria-label="거래명세표 · 세금계산서" style="width:100%;max-width:1360px;background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.25);padding:20px 22px 22px;box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div style="display:flex;flex-direction:column;gap:6px"><b style="font-size:17px">${md(d.ymd)} · ${esc(d.site || '')} <button type="button" data-gb="editsite" aria-label="현장명 고치기" style="border:0;background:none;padding:2px;cursor:pointer;display:inline-flex;vertical-align:middle">${PEN}</button> · ${esc(itemTitle(d))} <button type="button" data-gb="edittitle" aria-label="제목 고치기" style="border:0;background:none;padding:2px;cursor:pointer;display:inline-flex;vertical-align:middle">${PEN}</button></b>
          <span style="display:flex;align-items:center;gap:8px;font-size:13px;color:#5C5C5C">합계 ${won(d.total)}원 <button type="button" data-gb="edittotal" aria-label="합계 고치기" style="border:0;background:none;padding:2px;cursor:pointer;display:inline-flex;vertical-align:middle">${PEN}</button> ${statusPick(d.id, st)}${x.paid ? paidTag(x.paid) : ''}${x.delivered ? `<span style="font-size:12px;font-weight:700;color:#1E6B34">✓ ${esc(x.delivered)} 전달완료</span>` : ''}</span></div>
        <div style="display:flex;gap:8px;align-items:center">
          ${hasPend() ? `<button type="button" data-gb="pend-save" style="height:40px;padding:0 22px;border:0;border-radius:8px;background:#1F2328;color:#fff;font:inherit;font-size:15px;font-weight:800;cursor:pointer">저장</button>` : ''}
          <button type="button" data-gb="delrow" aria-label="목록에서 삭제" title="목록에서 삭제" style="width:40px;height:40px;border:1px solid #F1B5AF;border-radius:8px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">${TRASH}</button>
          <button type="button" data-gb="both" style="height:40px;padding:0 16px;border:1px solid #1F2328;border-radius:8px;background:#fff;color:#1F2328;font:inherit;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px">${DOWN}2장 한 번에 다운로드</button>
          <button type="button" data-gb="close" aria-label="닫기" style="width:40px;height:40px;border:1px solid #E6E4DF;border-radius:20px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">${X}</button>
        </div>
      </div>
      <div class="gb-two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">${docBox('stmt', d)}${docBox('tax', d)}</div>
      ${st === '수정요청' && x.reason ? `<div style="padding:12px 14px;border-radius:8px;background:#FDECEC;border:1px solid #F5C2C0;color:#7A1A12;font-size:13px;line-height:1.5"><b>수정요청</b><br>${esc(x.reason)}</div>` : ''}
      <div style="margin:4px -22px -22px;padding:18px 22px 22px;background:#F3F4F6;border-radius:0 0 14px 14px;display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px">
        <label style="flex:1 1 480px;display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:#3F3F46">수정요청 사유
          <textarea data-gb="reason" rows="1" placeholder="예: 세금계산서 작성일자가 출고일과 달라요" style="height:44px;min-height:44px;resize:vertical;border:1px solid #3F3F46;border-radius:10px;padding:10px 12px;font:inherit;font-size:14px;font-weight:400;background:#fff;box-sizing:border-box">${esc(G.reason)}</textarea></label>
        <div style="display:flex;gap:8px;align-items:flex-end">
          <button type="button" data-gb="reject" style="height:44px;min-width:128px;padding:0 18px;border-radius:8px;border:1px solid #B42318;background:#fff;color:#B42318;font:inherit;font-size:15px;font-weight:700;cursor:pointer">수정요청</button>
          ${['결재전', '수정요청'].includes(st) ? '<button type="button" data-gb="draft" style="height:44px;min-width:128px;padding:0 18px;border-radius:8px;border:1px solid #1D4F91;background:#1D4F91;color:#fff;font:inherit;font-size:15px;font-weight:700;cursor:pointer">기안 확정</button>' : ''}
        </div>
      </div>
    </div>
  </div>
  ${zoomSrc ? `<div data-gb="unzoom" style="position:fixed;inset:0;background:rgba(10,12,14,.82);z-index:60;overflow:auto;padding:24px;box-sizing:border-box;cursor:zoom-out"><button type="button" data-gb="unzoom" aria-label="닫기" style="position:fixed;top:16px;right:16px;width:44px;height:44px;border-radius:22px;border:0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center">${X}</button><img src="${zoomSrc}" alt="크게 보기" style="display:block;width:min(100%,1588px);margin:0 auto;border-radius:6px;background:#fff"></div>` : ''}`);
}

// ── 직접 등록 (10/23 대표) — 출고일보 ✅ 없이 손으로 한 장. 홈트 화면에서 넣으면 홈트, 에이스 화면에서 넣으면 에이스 ──
const regBlank = () => ({ text: '', files: [], ymd: new Date().toISOString().slice(0, 10), site: '', partner: '(주)공간제작소', rows: [{ name: '', qty: '', price: '' }], busy: false, err: '', preview: '' });
const regSum = (r) => r.rows.reduce((a, x) => a + Math.round((Number(x.qty) || 0) * (Number(x.price) || 0)), 0);
function regDoc() {
  const r = G.reg;
  return manualDoc({ id: 'preview', manual: { vatIn: true, ymd: r.ymd.replace(/-/g, ''), site: r.site.trim(), partner: r.partner.trim(), items: r.rows.filter((x) => x.name.trim() && Number(x.qty) > 0).map((x) => ({ name: x.name.trim(), qty: Number(x.qty), price: Number(x.price) || 0 })) } });
}
function regHtml() {
  const r = G.reg, sup = regSum(r), ace = G.biz === 'ace';
  const inp = 'height:38px;border:1px solid #D0D0D0;border-radius:8px;padding:0 10px;font:inherit;font-size:14px;background:#fff;box-sizing:border-box;min-width:0;width:100%';
  return `<div data-gb="reg-bg" style="position:fixed;inset:0;background:rgba(17,20,24,.45);display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;box-sizing:border-box;overflow-y:auto;z-index:55">
    <div role="dialog" aria-label="직접 등록" style="width:100%;max-width:860px;background:#F7F7F5;border-radius:18px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.25);display:flex;flex-direction:column">
      <div style="display:flex;align-items:center;gap:12px;padding:16px 20px;background:#fff;border-bottom:1px solid #E6E4DF">
        <b style="font-size:18px">거래명세표 직접 등록</b><span style="padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;${ace ? 'background:#EAF1FB;color:#1D4F91' : 'background:#FFF1E6;color:#B4471A'}">${ace ? '에이스' : '홈트레이더스'}</span>
        <span style="flex:1"></span><button type="button" data-gb="reg-close" aria-label="닫기" style="border:0;background:none;font-size:20px;cursor:pointer">✕</button></div>
      <div style="padding:18px 20px;display:flex;flex-direction:column;gap:14px">
        <section style="background:#fff;border:1px solid #E6E4DF;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;gap:8px;align-items:center">
            <input data-gb="reg-text" value="${esc(r.text)}" placeholder="출고 번호 · 전표 번호 · 전표 링크 (예: 공간제작소-261016-01)" style="${inp};flex:1">
            <button type="button" data-gb="reg-pick" style="height:38px;padding:0 14px;border:1px solid #D0D0D0;border-radius:8px;background:#fff;font:inherit;font-size:13px;cursor:pointer;white-space:nowrap">파일 고르기</button>
            <button type="button" data-gb="reg-load" ${r.busy ? 'disabled' : ''} style="height:38px;padding:0 16px;border:0;border-radius:8px;background:#1F2328;color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">${r.busy ? '읽는 중…' : '불러오기'}</button></div>
          ${r.files.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px">${r.files.map((f, i) => `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:#F3F4F6;border-radius:14px;font-size:13px">${esc(f.name)}<button type="button" data-gb="reg-unpick" data-i="${i}" aria-label="빼기" style="border:0;background:none;cursor:pointer;color:#6B6B6B">✕</button></span>`).join('')}</div>` : ''}
        </section>
        <section style="background:#fff;border:1px solid #E6E4DF;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px">
          <div style="display:grid;grid-template-columns:160px 1fr 1fr;gap:10px">
            <label style="display:flex;flex-direction:column;gap:5px;font-size:12px;color:#5C5C5C">출고일<input type="date" data-gb="reg-f" data-k="ymd" value="${esc(r.ymd)}" style="${inp}"></label>
            <label style="display:flex;flex-direction:column;gap:5px;font-size:12px;color:#5C5C5C">현장명<input data-gb="reg-f" data-k="site" value="${esc(r.site)}" placeholder="현장명" style="${inp}"></label>
            <label style="display:flex;flex-direction:column;gap:5px;font-size:12px;color:#5C5C5C">받는 곳<input data-gb="reg-f" data-k="partner" value="${esc(r.partner)}" style="${inp}"></label></div>
          <div style="display:grid;grid-template-columns:1fr 80px 110px 120px 24px;gap:6px;font-size:12px;color:#6B6B6B;padding:0 2px"><span>품명</span><span style="text-align:right">수량</span><span style="text-align:right">단가(부가세 포함)</span><span style="text-align:right">금액(부가세 포함)</span><span></span></div>
          ${r.rows.map((x, k) => `<div style="display:grid;grid-template-columns:1fr 80px 110px 120px 24px;gap:6px;align-items:center">
            <input data-gb="reg-r" data-k="${k}" data-f="name" value="${esc(x.name)}" style="${inp}">
            <input data-gb="reg-r" data-k="${k}" data-f="qty" value="${esc(x.qty)}" inputmode="decimal" style="${inp};text-align:right">
            <input data-gb="reg-r" data-k="${k}" data-f="price" value="${esc(x.price)}" inputmode="decimal" style="${inp};text-align:right">
            <b id="gb-reg-amt-${k}" style="text-align:right;font-size:14px">${Number(x.qty) * Number(x.price) ? won(Number(x.qty) * Number(x.price)) : ''}</b>
            <button type="button" data-gb="reg-rdel" data-k="${k}" aria-label="줄 지우기" style="border:0;background:none;color:#9A9A9A;cursor:pointer">✕</button></div>`).join('')}
          <button type="button" data-gb="reg-radd" style="align-self:flex-start;border:1px dashed #C9C6BF;background:#fff;border-radius:8px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer;color:#3F3F46">＋ 줄</button>
          ${r.err ? `<div style="font-size:13px;color:#B42318">${esc(r.err)}</div>` : ''}
        </section>
        ${r.preview ? `<img src="${r.preview}" alt="미리보기" style="width:100%;border:1px solid #E6E4DF;border-radius:10px;background:#fff">` : ''}
      </div>
      <div style="position:sticky;bottom:0;display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:14px 20px;background:#FFF7F0;border-top:1px solid #F3D9C6;font-size:14px;color:#5C5C5C">
        <span>공급가 <b id="gb-reg-sup" style="color:#1F2328">${won(Math.round(sup / 1.1))}</b></span><span>부가세 <b id="gb-reg-vat" style="color:#1F2328">${won(sup - Math.round(sup / 1.1))}</b></span><span style="font-size:16px">합계 <b id="gb-reg-tot" style="font-size:20px;color:#C2410C">${won(sup)}원</b></span>
        <span style="flex:1"></span>
        <button type="button" data-gb="reg-preview" style="height:40px;padding:0 16px;border:1px solid #D0D0D0;border-radius:10px;background:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer">명세표 미리보기</button>
        <button type="button" data-gb="reg-save" style="height:40px;padding:0 18px;border:0;border-radius:10px;background:#E8732C;color:#fff;font:inherit;font-size:14px;font-weight:700;cursor:pointer">${ace ? '에이스' : '홈트'} 목록에 올리기</button></div>
    </div></div>`;
}
const b64of = (file) => readUrl(file).then((u) => u.split(',')[1]);
async function regLoad() {   // 출고 번호·전표·링크·파일 → 품목 줄 (명세표 칸과 같은 규칙)
  const r = G.reg, text = r.text.trim();
  if (!text && !r.files.length) { r.err = '출고 번호·전표 번호·링크를 넣거나 파일을 골라 주세요'; ctx.rerender(); return; }
  r.busy = true; r.err = ''; ctx.rerender();
  const vouchers = [], errs = [];
  try {
    if (text) {
      const x = await ctx.slips(text);
      (x.slips || []).filter((s2) => s2.error).forEach((s2) => errs.push(s2.error));
      const sale = (x.slips || []).filter((s2) => s2.rows && s2.rows.length && s2.kind !== '구매');
      if (sale.length) vouchers.push(...SM.parseSales([[x.head, ...sale.flatMap((s2) => s2.rows)]]));
    }
    for (const f of r.files) {
      try {
        if (/\.(xlsx|xlsm|xls|csv)$/i.test(f.name)) { vouchers.push(...SM.parseSales(await SM.readSheets(f.file))); continue; }
        if (!ctx.helperUp()) { errs.push(`${f.name}: PDF·사진은 사무실 맥 도우미가 켜져 있어야 읽어요`); continue; }
        const data = await b64of(f.file);
        let j = null;
        if (/\.pdf$/i.test(f.name)) { try { j = await ctx.helper('/api/slip/pdf', { data }); } catch (_) { j = null; } }
        if (j && j.slip && j.slip.rows && j.slip.rows.length) { vouchers.push(...SM.parseSales([[j.head, ...j.slip.rows]])); continue; }
        const rd = await ctx.helper('/api/doc/read', { name: f.name, data });
        vouchers.push(SM.voucherFromDoc(rd.doc));
      } catch (e) { errs.push(`${f.name}: ${e.message || e}`); }
    }
    if (vouchers.length) {
      const docs = SM.splitSheets(vouchers, {});
      const v0 = vouchers[0];
      r.ymd = `${v0.ymd.slice(0, 4)}-${v0.ymd.slice(4, 6)}-${v0.ymd.slice(6, 8)}`;
      r.site = r.site || (docs.find((d2) => d2.site) || {}).site || '';
      r.rows = vouchers.flatMap((v) => v.items).map((it) => ({ name: it.name, qty: it.qty, price: it.qty ? Math.round(it.supply / it.qty) : '' }));
      r.preview = '';
    }
  } catch (e) { errs.push(e.message || String(e)); }
  r.err = errs.join(' · '); r.busy = false; ctx.rerender();
}
async function regPreview() {
  const d = regDoc();
  if (!d.items.length) { G.reg.err = '품명·수량이 있는 줄이 없어요'; ctx.rerender(); return; }
  G.reg.err = ''; G.reg.preview = 'loading'; ctx.rerender();
  try { G.reg.preview = URL.createObjectURL(await SM.pngBlob(d, G.biz === 'ace' ? 'ace' : 'homt')); } catch (e) { G.reg.preview = ''; G.reg.err = e.message || String(e); }
  ctx.rerender();
}
async function regSave() {
  const d = regDoc(), r = G.reg;
  if (!d.items.length) { r.err = '품명·수량이 있는 줄이 없어요'; ctx.rerender(); return; }
  const id = `m${Date.now().toString(36)}`;
  const no = G.list.filter((x) => x.ymd === d.ymd).length + 1;   // 그날 몇 번째 장 (에이스 양식 문서번호 제 261020-2호)
  const manual = { ymd: d.ymd, no, reg: new Date().toLocaleDateString('sv-SE'), site: d.site, partner: d.partner, vatIn: true, items: r.rows.filter((x) => x.name.trim() && Number(x.qty) > 0).map((x) => ({ name: x.name.trim(), qty: Number(x.qty), price: Number(x.price) || 0 })) };
  const err = await S.saveGongganDoc({ id, biz: G.biz, manual, status: null, updated_by: ctx.me(), updated_at: new Date().toISOString() });
  if (err) { r.err = '저장하지 못했어요 — ' + err; ctx.rerender(); return; }
  G.docs[id] = { id, biz: G.biz, manual, status: null };
  G.list = [manualDoc({ id, manual }), ...G.list].sort((a, b) => (b.ymd + b.slip).localeCompare(a.ymd + a.slip));
  G.reg = null; G.open = id; ctx.rerender();   // 올리면 바로 그 장을 열어 세금계산서 넣기
}

// ── 파일 ─────────────────────────────────────────
const readUrl = (file) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => no(new Error('파일을 읽지 못했어요')); r.readAsDataURL(file); });
async function toStored(file) {     // 그림은 2200px 안쪽 JPG 로 줄여서, PDF 는 그대로 (4MB 까지)
  if (file.type === 'application/pdf') { if (file.size > 4e6) throw new Error('PDF 가 너무 커요 (4MB 까지)'); return readUrl(file); }
  const url = await readUrl(file);
  const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('그림을 읽지 못했어요')); i.src = url; });
  const k = Math.min(1, 2200 / Math.max(im.width, im.height));
  const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.88);
}
async function attach(id, kind, file) {   // 올린 사진은 바로 저장하지 않고 미리보기 + [저장]·[취소] (10/26 대표 "사진 올리고 저장하기 버튼")
  if (!file) return;
  try {
    const cur = G.list.find((d) => d.id === id);
    const one = { name: file.name || '', data: await toStored(file), total: cur ? Math.round(cur.total) : '' };
    G.pend = { ...(G.pend && G.pend.id === id ? G.pend : { id }), [kind]: one };   // 두 장(명세표·세금계산서)을 올려도 저장은 위 [저장] 하나로 (10/27 대표)
    G.panel = kind; ctx.rerender();
  } catch (e) { alert(e.message || e); }
}
const hasPend = () => !!(G.pend && (G.pend.stmt || G.pend.tax));
async function commitPending() {   // 올린 명세표·세금계산서를 한 번에 저장
  const p = G.pend; if (!p) return;
  G.pend = null; G.panel = 'tax';   // 저장 뒤 Ctrl+V 는 세금계산서로 (10/27 — 복붙이 다시 명세표로 가던 것)
  const id = p.id;
  try {
    if (p.tax) {
      const prev = G.docs[id] || {};
      await save(id, { tax_data: p.tax.data, tax_name: p.tax.name || '세금계산서', tax_no: null, status: prev.status === '수정요청' ? null : prev.status || null }); findTaxNo(id, p.tax.data);
    }
    if (p.stmt) {
      const prev = G.docs[id] || {}, cur = G.list.find((d) => d.id === id);
      const n = Number(String(p.stmt.total || '').replace(/[^\d]/g, ''));
      if (n && cur) cur.total = n;
      const m2 = { ...(prev.manual || {}) }; delete m2.stmtDel; if (n) m2.total = n;
      await save(id, { stmt_data: p.stmt.data, manual: Object.keys(m2).length ? m2 : null });   // 직접 등록한 장은 품목은 그대로, 합계만
    }
  } catch (e) { alert(e.message || e); }
}
// 저장 안 한 사진이 있으면 창을 닫거나 다른 장으로 갈 때 물어봄 (10/27 대표 "창 닫거나 이럴 때 팝업도 뜨게")
async function leavePend() {
  if (!hasPend()) return;
  if (confirm('올린 사진을 아직 저장하지 않았어요.\n[확인] 저장하고 닫기 · [취소] 저장하지 않고 닫기')) await commitPending();
  else G.pend = null;
}
async function canvasOf(src) {
  const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('그림을 읽지 못했어요')); i.src = src; });
  const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0); return c;
}
const srcOf = (d, kind) => (kind === 'stmt' ? ((G.full[d.id] || {}).stmt_data === 'none' ? '' : (G.full[d.id] || {}).stmt_data || G.img[d.id]) : (G.full[d.id] || {}).tax_data);
// PDF 세금계산서는 첫 쪽을 그림으로 그려서 보여 줌 — 브라우저 PDF 보기(도구 줄·축소)가 끼지 않게 (10/23 대표 "왜 이렇게 떠")
const pdfImg = {};
function pdfView(id, src) {
  const v = pdfImg[id];
  if (v && v.src === src) return v.url;
  if (!v || v.src !== src) {
    pdfImg[id] = { src, url: '' };
    pdfCanvas(src).then((c) => { pdfImg[id] = { src, url: c.toDataURL('image/jpeg', 0.92) }; ctx.rerender(); }).catch(() => { /* 못 그리면 불러오는 중 그대로 */ });
  }
  return '';
}
const viewSrc = (d, kind) => { const s0 = srcOf(d, kind); return s0 && s0.startsWith('data:application/pdf') ? pdfView(d.id, s0) : s0; };   // 보기·복사·JPG 용 그림
const fileName = (d, kind) => `${d.ymd.slice(2)}_${(d.site || '공간제작소').replace(/[\\/:*?"<>|]/g, ' ')}_${kind === 'stmt' ? '거래명세표' : '세금계산서'}.jpg`;
async function saveJpg(d, kind) {
  const src = srcOf(d, kind); if (!src || src === 'loading') return;
  const c = src.startsWith('data:application/pdf') ? await pdfCanvas(src) : await canvasOf(src);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.92));
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName(d, kind); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
// 글자 복사 — 클립보드 권한이 막혀 있어도 되게 (숨긴 칸 → 복사 명령), 눌렀다는 표시는 2초 (10/23 승인번호)
async function copyText(v) {
  if (!v) return;
  let ok = false;
  try { await navigator.clipboard.writeText(v); ok = true; } catch (_) { /* 아래로 */ }
  if (!ok) {
    const ta = document.createElement('textarea');
    ta.value = v; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, v.length);
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    ta.remove();
  }
  if (!ok) { prompt('복사하지 못했어요 — 아래 번호를 직접 복사하세요', v); return; }
  G.copied = Date.now(); ctx.rerender();
  setTimeout(() => { if (Date.now() - G.copied >= 1900) { G.copied = 0; ctx.rerender(); } }, 2000);
}
async function savePdf(d, kind) {   // PDF 로 저장 — 이미 PDF 면 그대로, 그림은 A4 한 장에 맞춰
  const src = srcOf(d, kind); if (!src || src === 'loading') return;
  const name = fileName(d, kind).replace(/\.jpg$/, '.pdf');
  if (src.startsWith('data:application/pdf')) { const a = document.createElement('a'); a.href = src; a.download = name; a.click(); return; }
  try {
    const { jsPDF } = await loadJs(JSPDF, () => window.jspdf);
    const c = await canvasOf(src);
    const land = c.width > c.height * 1.15;
    const doc = new jsPDF({ orientation: land ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
    const W = land ? 297 : 210, Hh = land ? 210 : 297, m = 8;
    const k = Math.min((W - m * 2) / c.width, (Hh - m * 2) / c.height);
    doc.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', (W - c.width * k) / 2, m, c.width * k, c.height * k);
    doc.save(name);
  } catch (e) { alert('PDF 로 저장하지 못했어요 — ' + (e.message || e)); }
}
async function pdfCanvas(dataUrl) {   // PDF 첫 쪽 → 그림 (세금계산서 PDF 를 2장 PDF 에 넣을 때)
  const lib = await loadJs(PDFJS, () => window.pdfjsLib);
  lib.GlobalWorkerOptions.workerSrc = PDFJS.replace('pdf.min.js', 'pdf.worker.min.js');
  const pdf = await lib.getDocument({ data: Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0)) }).promise;
  const pg = await pdf.getPage(1), vp = pg.getViewport({ scale: 2.5 });
  const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  await pg.render({ canvasContext: g, viewport: vp, intent: 'print' }).promise;   // print = 화면 그리기 신호를 안 기다림 (창이 뒤에 있어도 그려짐)
  return c;
}
async function saveBothPdf(d) {   // 2장 한 번에 = 거래명세표 + 세금계산서를 PDF 한 파일로 (10/23 대표)
  try {
    const { jsPDF } = await loadJs(JSPDF, () => window.jspdf);
    let doc = null;
    for (const kind of ['stmt', 'tax']) {
      const src = srcOf(d, kind); if (!src || src === 'loading') continue;
      const c = src.startsWith('data:application/pdf') ? await pdfCanvas(src) : await canvasOf(src);
      const land = c.width > c.height * 1.15, W = land ? 297 : 210, Hh = land ? 210 : 297, m = 8;
      if (!doc) doc = new jsPDF({ orientation: land ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
      else doc.addPage('a4', land ? 'landscape' : 'portrait');
      const k = Math.min((W - m * 2) / c.width, (Hh - m * 2) / c.height);
      doc.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', (W - c.width * k) / 2, m, c.width * k, c.height * k);
    }
    if (!doc) return;
    doc.save(fileName(d, 'stmt').replace(/거래명세표\.jpg$/, '거래명세표_세금계산서.pdf'));
  } catch (e) { alert('PDF 로 저장하지 못했어요 — ' + (e.message || e)); }
}
async function copyImg(d, kind) {
  const src = viewSrc(d, kind); if (!src || src === 'loading') return;
  try {
    const c = await canvasOf(src);
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    alert(`${kind === 'stmt' ? '거래명세표' : '세금계산서'}를 복사했어요. 기안에 붙여넣기(Cmd+V) 하세요.`);
  } catch (e) { alert('복사하지 못했어요 — 그림에서 오른쪽 클릭 → 이미지 복사를 써주세요.'); }
}

// ── 입력 ─────────────────────────────────────────
let fileTarget = null;
const pickFile = (id, kind) => { fileTarget = { id, kind }; const f = document.getElementById('gb-file'); if (f) { f.value = ''; f.click(); } };
// 업데이트 줄을 누르면 그 장이 보이게 거르기·쪽을 풀고 목록의 그 줄로 내려가 잠깐 표시
function feedGo(id) {
  const d = G.list.find((x) => x.id === id);
  if (!d) return;
  if (G.month !== '전체' && d.ymd.slice(4, 6) !== G.month) G.month = d.ymd.slice(4, 6);
  if (G.site && d.site !== G.site) G.site = '';
  if (G.q) G.q = '';
  if (G.status !== '전체' && statusOf(d) !== G.status) G.status = '전체';
  const shown = filtered().filter((x) => G.status === '전체' || statusOf(x) === G.status);
  G.page = Math.floor(Math.max(0, shown.findIndex((x) => x.id === id)) / G.size) + 1;
  ctx.rerender();
  requestAnimationFrame(() => {
    const el = [...document.querySelectorAll(`[data-gb="row"][data-id="${CSS.escape(id)}"]`)].find((x) => x.offsetParent);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const bg = el.style.background;
    el.style.transition = 'background .3s'; el.style.background = '#FFE8D6';
    setTimeout(() => { el.style.background = bg; }, 1800);
  });
}
export function openWait() { G.view = 'wait'; }
export function setBiz(biz) { if (G.biz !== biz) { G.biz = biz; G.loaded = ''; G.page = 1; G.pick.clear(); G.open = null; G.month = '전체'; G.status = '전체'; G.site = ''; } }
export function bind(app, c) {
  ctx = c;
  app.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-gb]'); if (!t || !app.querySelector('.gb')) return;
    const a = t.dataset.gb, id = t.dataset.id, cur = G.open && G.list.find((d) => d.id === G.open);
    if (LIM() && LIM_ACTS.has(a)) return;
    if (a === 'view') { G.view = t.dataset.v; G.open = null; ctx.rerender(); return; }
    if (a === 'wait-up' && id) { waitUp(id); return; }
    if (a === 'wait-skip' && id) { waitSkip(id); return; }
    if (a === 'wait-open' && id) { if (e.target.closest('button')) return; G.waitOpen = id; ctx.rerender(); return; }
    if (a === 'wait-close' || (a === 'wait-bg' && e.target === t)) { G.waitOpen = ''; ctx.rerender(); return; }
    if (a === 'feed' && id) { feedGo(id); return; }   // 업데이트 줄 → 아래 목록의 그 줄로 (10/27 대표)
    if (a === 'row') { if (e.target.closest('button, input, a, label, select')) return; G.open = id; G.reason = ''; G.zoom = ''; G.panel = 'tax'; ctx.rerender(); }
    else if (a === 'pend-save') commitPending();
    else if (a === 'pend-cancel' && G.pend) { G.pend[t.dataset.k] = null; if (!hasPend()) G.pend = null; ctx.rerender(); }
    else if (a === 'panel') { if (G.panel !== t.dataset.k) { G.panel = t.dataset.k; ctx.rerender(); } }   // 누른 칸 = Ctrl+C·V 대상 (10/26)
    else if (a === 'overlay') { if (e.target === t) { await leavePend(); G.open = null; ctx.rerender(); } }
    else if (a === 'close') { await leavePend(); G.open = null; G.zoom = ''; G.editNo = false; ctx.rerender(); }
    else if (a === 'biz') { G.view = 'list'; setBiz(t.dataset.v); ctx.go(t.dataset.v === 'ace' ? 'gonggan-ace' : 'gonggan'); }
    else if (a === 'start') ctx.goStart();
    else if (a === 'logout') ctx.logout();
    else if (a === 'month') { G.month = t.dataset.v; G.page = 1; ctx.rerender(); }
    else if (a === 'status') { G.status = t.dataset.v; G.page = 1; ctx.rerender(); }
    else if (a === 'page') { G.page = Number(t.dataset.v) || 1; ctx.rerender(); }
    else if (a === 'addtax') { G.open = id; pickFile(id, 'tax'); ctx.rerender(); }
    else if (a === 'addstmt') { G.open = id; G.panel = 'stmt'; pickFile(id, 'stmt'); ctx.rerender(); }
    else if (a === 'replace' && cur) pickFile(cur.id, t.dataset.k);
    else if (a === 'reg') { G.reg = regBlank(); ctx.rerender(); }
    else if (a === 'reg-close' || (a === 'reg-bg' && e.target === t)) { G.reg = null; ctx.rerender(); }
    else if (a === 'reg-pick') document.getElementById('gb-reg-file').click();
    else if (a === 'reg-unpick' && G.reg) { G.reg.files.splice(Number(t.dataset.i), 1); ctx.rerender(); }
    else if (a === 'reg-load' && G.reg) regLoad();
    else if (a === 'reg-radd' && G.reg) { G.reg.rows.push({ name: '', qty: '', price: '' }); ctx.rerender(); }
    else if (a === 'reg-rdel' && G.reg) { G.reg.rows.splice(Number(t.dataset.k), 1); if (!G.reg.rows.length) G.reg.rows.push({ name: '', qty: '', price: '' }); ctx.rerender(); }
    else if (a === 'reg-preview' && G.reg) regPreview();
    else if (a === 'reg-save' && G.reg) regSave();
    else if (a === 'editsite' && cur) {   // 현장명 손으로 고치기 (10/26 대표) — 비우면 이카운트 규격 꼬리표의 현장
      const m = { ...((G.docs[cur.id] || {}).manual || {}) };
      const v = prompt('현장명', cur.site || '');
      if (v === null) return;
      if (v.trim()) m.site = v.trim(); else delete m.site;
      cur.site = m.site || (m.items ? '' : (cur.site0 ?? ''));
      save(cur.id, { manual: Object.keys(m).length ? m : null });
    }
    else if ((a === 'edittitle' || a === 'edittotal') && cur) {   // 제목·합계 손으로 고치기 (10/26 공간제작소 수정요청) — 비우면 원래대로
      const m = { ...((G.docs[cur.id] || {}).manual || {}) }, k = a === 'edittitle' ? 'title' : 'total';
      const v = prompt(a === 'edittitle' ? '제목' : '합계금액 (부가세 포함)', a === 'edittitle' ? itemTitle(cur) : String(Math.round(cur.total)));
      if (v === null) return;
      const val = k === 'total' ? Number(v.replace(/[^\d]/g, '')) : v.trim();
      if (val) m[k] = val; else delete m[k];
      if (k === 'total') cur.total = val || (m.items ? manualDoc({ ...G.docs[cur.id], manual: m }).total : itemsTotal(cur));
      save(cur.id, { manual: Object.keys(m).length ? m : null });
    }
    else if (a === 'delstmt' && cur) {   // 거래명세표 지우기 — 그림만 비우고(stmt_data 'none') 목록 줄·상태·세금계산서는 그대로. 바꿀 때 적은 합계도 풂
      if (confirm('삭제하시겠습니까?')) { const m = { ...((G.docs[cur.id] || {}).manual || {}) }; const had = 'total' in m; delete m.total; if (had) cur.total = m.items ? manualDoc({ ...G.docs[cur.id], manual: m }).total : itemsTotal(cur); m.stmtDel = true; G.panel = 'stmt'; save(cur.id, { stmt_data: 'none', manual: m }); }
    }
    else if (a === 'delrow' && (id ? G.list.find((d) => d.id === id) : cur)) {   // 목록 줄 통째로 지우기 — 중복된 장 (10/27 대표). status '삭제' 로 숨김(표에는 남아 되살릴 수 있음, 이카운트 조회가 다시 올려도 안 보임)
      const cur = id ? G.list.find((d) => d.id === id) : G.list.find((d) => d.id === G.open), x = G.docs[cur.id] || {};
      if (!confirm(`이 장을 목록에서 삭제하시겠습니까?\n${md(cur.ymd)} ${cur.site || ''} ${won(cur.total)}원${x.paid ? '\n(입금 확인된 장이에요)' : ''}`)) return;
      G.list = G.list.filter((d) => d.id !== cur.id); if (G.open === cur.id) { G.open = null; G.pend = null; }
      save(cur.id, { status: '삭제' });
    }
    else if (a === 'deltax' && cur) { if (confirm('삭제하시겠습니까?')) save(cur.id, { tax_data: null, tax_name: null, tax_no: null, status: null, drafted_at: null }); }   // 지우면 결재전으로
    else if (a === 'draft' && cur) {   // 기안 확정 = 기안중 (10/27 대표) — 누르기 전에 한 번 묻기 (10/27 대표 "확정하시겠습니까?")
      if (!confirm(`기안 확정하시겠습니까?\n${md(cur.ymd)} ${cur.site || ''} ${won(cur.total)}원`)) return;
      save(cur.id, { status: '기안중', drafted_at: new Date().toISOString() });
    }
    else if (a === 'reject' && cur) { save(cur.id, { status: '수정요청', reason: G.reason.trim() || '수정요청' }); G.open = null; G.reason = ''; }
    else if (a === 'zoom') { if (G.panel !== t.dataset.k) { G.panel = t.dataset.k; ctx.rerender(); } else if (e.detail >= 2 || G.panelAt && Date.now() - G.panelAt < 400) { G.zoom = t.dataset.k; ctx.rerender(); } G.panelAt = Date.now(); }   // 한 번 = 칸 고르기(Ctrl+V 대상), 두 번 = 크게 보기 (10/27)
    else if (a === 'unzoom') { G.zoom = ''; ctx.rerender(); }
    else if (a === 'jpg' && cur) saveJpg(cur, t.dataset.k);
    else if (a === 'copy' && cur) copyImg(cur, t.dataset.k);
    else if (a === 'pdf' && cur) savePdf(cur, t.dataset.k);
    else if (a === 'editno') { G.editNo = true; ctx.rerender(); const el = app.querySelector('[data-gb="taxno"]'); if (el) el.focus(); }
    else if (a === 'copyno' && cur) copyText((G.docs[cur.id] || {}).tax_no || '');
    else if (a === 'both' && cur) saveBothPdf(cur);
  });
  app.addEventListener('change', (e) => {
    const t = e.target; if (!app.querySelector('.gb')) return;
    if (t.id === 'gb-reg-file' && G.reg) { G.reg.files.push(...[...t.files].map((file) => ({ name: file.name, file }))); t.value = ''; ctx.rerender(); return; }
    if (t.id === 'gb-file') { const f = t.files && t.files[0]; if (fileTarget) attach(fileTarget.id, fileTarget.kind, f); return; }
    const a = t.dataset && t.dataset.gb;
    if (a === 'taxno') { const m = NO_RE.exec(t.value); const cur = G.open && G.list.find((d) => d.id === G.open); if (m && cur) { G.editNo = false; save(cur.id, { tax_no: `${m[1]}-${m[2]}-${m[3]}` }); } else if (t.value.trim()) alert('승인번호는 20261013-10261013-99366706 모양이에요'); return; }
    if (a === 'setstatus' && LIM()) return;
    if (a === 'setstatus') { const v = t.value; save(t.dataset.id, v === '결재전' ? { status: null } : v === '기안중' ? { status: v, drafted_at: new Date().toISOString() } : { status: v }); return; }
    else if (a === 'site') { G.site = t.value; G.page = 1; ctx.rerender(); }
    else if (a === 'size') { G.size = Number(t.value) || 20; G.page = 1; ctx.rerender(); }
  });
  app.addEventListener('input', (e) => {
    const t = e.target; if (!app.querySelector('.gb')) return;
    if (t.dataset.gb === 'reason') G.reason = t.value.slice(0, 300);
    else if (t.dataset.gb === 'pend-total' && G.pend && G.pend.stmt) G.pend.stmt.total = t.value.replace(/[^\d]/g, '');   // 다시 그리지 않음 (입력 중 커서 유지)
    else if (t.dataset.gb === 'reg-text' && G.reg) G.reg.text = t.value;
    else if (t.dataset.gb === 'reg-f' && G.reg) G.reg[t.dataset.k] = t.value;
    else if (t.dataset.gb === 'reg-r' && G.reg) {   // 금액·합계만 바로 (칸을 다시 그리면 입력 중인 글자가 끊김)
      const k = Number(t.dataset.k), row = G.reg.rows[k], f = t.dataset.f;
      row[f] = f === 'name' ? t.value : t.value.replace(/[^\d.]/g, '');
      const sup = regSum(G.reg), set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set(`gb-reg-amt-${k}`, Number(row.qty) * Number(row.price) ? won(Number(row.qty) * Number(row.price)) : ''); set('gb-reg-sup', won(Math.round(sup / 1.1))); set('gb-reg-vat', won(sup - Math.round(sup / 1.1))); set('gb-reg-tot', `${won(sup)}원`);   // sup = 부가세 포함 합계
    }
    else if (t.dataset.gb === 'q') { G.q = t.value.slice(0, 60); G.page = 1; clearTimeout(G.qt); G.qt = setTimeout(() => { ctx.rerender(); const el = document.querySelector('[data-gb="q"]'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 250); }
  });
  // 세금계산서 파일을 팝업의 세금계산서 칸에 끌어다 놓기 (10/23 대표 — 파일 고르기만 되던 것)
  const dropBox = (e) => !LIM() && G.open && e.target.closest && e.target.closest('[data-gb-drop="tax"]');
  app.addEventListener('dragover', (e) => { const b = dropBox(e); if (!b) return; e.preventDefault(); b.style.outline = '3px solid #1D4F91'; });
  app.addEventListener('dragleave', (e) => { const b = dropBox(e); if (b) b.style.outline = ''; });
  app.addEventListener('drop', (e) => {
    const b = dropBox(e); if (!b) return;
    e.preventDefault(); b.style.outline = '';
    const f = [...((e.dataTransfer && e.dataTransfer.files) || [])].find((x) => /^image\/|pdf$/.test(x.type) || /\.pdf$/i.test(x.name));
    if (f) attach(G.open, 'tax', f); else alert('그림(사진·캡처)이나 PDF 파일만 넣을 수 있어요');
  });
  window.addEventListener('paste', (e) => {      // 팝업이 열려 있으면 캡처 붙여넣기 — 누른 칸(명세표·세금계산서), 기본은 세금계산서
    if (!G.open || !app.querySelector('.gb') || LIM()) return;
    const cd = e.clipboardData || {};
    const f = [...(cd.files || [])][0] || ([...(cd.items || [])].find((i) => i.kind === 'file') || { getAsFile: () => null }).getAsFile(); if (!f) return;
    e.preventDefault(); attach(G.open, G.panel === 'stmt' ? 'stmt' : 'tax', f);   // 누른 칸으로 — 이미 있으면 교체 (10/27 대표, 공간제작소 계정도)
  });
  window.addEventListener('beforeunload', (e) => { if (hasPend()) { e.preventDefault(); e.returnValue = ''; } });   // 저장 안 한 사진이 있으면 브라우저 창을 닫을 때도 물어봄
  window.addEventListener('keydown', (e) => {    // 누른 칸에서 Ctrl+C(⌘C) = 그 그림 복사 (10/26)
    if (!G.open || !G.panel || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'c' || !app.querySelector('.gb')) return;
    if (/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '') || String(window.getSelection() || '')) return;
    const cur = G.list.find((d) => d.id === G.open); if (!cur) return;
    e.preventDefault(); copyImg(cur, G.panel);
  });
}
