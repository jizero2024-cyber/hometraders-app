// 공간제작소 BMS — 거래명세표 · 세금계산서 · 기안 (2026-10-23, 시안 https://claude.ai/artifact/Kmkve915nhwknjJYE76xGE)
// 줄 = 이카운트 판매현황의 공간제작소 판매 줄(gonggan_sales, 맥 도우미가 올림) → 거래명세표 변환기(stmt.js)로 장마다 나눔.
// 장마다 상태·세금계산서·수정요청 사유 = gonggan_docs. 홈트레이더스·현구 과장님 같은 화면.
import * as S from './store-supabase.js';
import * as SM from './stmt.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = (n) => Math.round(Number(n) || 0).toLocaleString();
const HEAD = ['일자-No.', '거래처명', '품목명(규격)', '수량', '단가', '공급가액', '부가세'];
const STATUS = ['전체', '결재전', '기안중', '수정요청', '최종완료'];
const BADGE = { 결재전: 'background:#FFF1E6;color:#B4471A', 기안중: 'background:#EAF1FB;color:#1D4F91', 수정요청: 'background:#FDECEC;color:#B42318', 최종완료: 'background:#EEF6EE;color:#1E6B34' };
const PEN = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 2.5l3 3L6 13H3v-3z" fill="none" stroke="#1F2328" stroke-width="1.6" stroke-linejoin="round"></path></svg>';
const TRASH = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" fill="none" stroke="#D92D20" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
const X = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="#1F2328" stroke-width="1.8" stroke-linecap="round"></path></svg>';
const DOWN = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8M4.5 7L8 10.5 11.5 7M3 13h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
const CHEV = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" style="position:absolute;right:14px;top:12px;pointer-events:none"><path d="M4 6l4 4 4-4" fill="none" stroke="#1F2328" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

const G = { biz: 'homt', loaded: '', loading: false, err: '', list: [], docs: {}, month: '전체', status: '전체', site: '', q: '', page: 1, size: 20,
  pick: new Set(), open: null, zoom: '', reason: '', img: {}, full: {}, busy: '' };
let ctx = { rerender: () => {}, goStart: () => {}, go: () => {}, me: () => '' };

// ── 데이터 ─────────────────────────────────────────
const docId = (d) => `${d.ymd}|${(d.slips || [d.slip]).slice().sort().join(',')}|${(d.items[0] || {}).name || ''}`;
export async function load(biz, force) {
  if (G.loading || (G.loaded === biz && !force)) return;
  G.biz = biz; G.loading = true; G.err = '';
  try {
    const [sales, docs] = await Promise.all([S.getGongganSales(biz), S.getGongganDocs(biz)]);
    const rows = sales.map((r) => [r.slip, r.partner, r.name, r.qty, r.price, r.supply, r.vat]);
    const list = rows.length ? SM.splitSheets(SM.parseSales([[HEAD, ...rows]]), {}) : [];
    G.list = list.map((d) => ({ ...d, id: docId(d), total: d.items.reduce((a, x) => a + x.supply + x.vat, 0) }))
      .sort((a, b) => (b.ymd + b.slip).localeCompare(a.ymd + a.slip));
    G.docs = Object.fromEntries(docs.map((x) => [x.id, x]));
    G.loaded = biz;
  } catch (e) { G.err = e.message || String(e); }
  G.loading = false; ctx.rerender();
}
const statusOf = (d) => { const x = G.docs[d.id] || {}; return x.status === '최종완료' || x.status === '수정요청' ? x.status : (x.tax_name ? '기안중' : '결재전'); };
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
    const m = NO_RE.exec((await textOf(dataUrl)).replace(/[Oo]/g, '0'));
    if (m) save(id, { tax_no: `${m[1]}-${m[2]}-${m[3]}` });
  } catch (e) { /* 못 찾으면 손으로 */ }
  finding.delete(id);
}
async function ensureImg(d) {
  if (G.img[d.id]) return;
  G.img[d.id] = 'loading';
  try { G.img[d.id] = URL.createObjectURL(await SM.pngBlob(d, 'homt')); } catch (e) { G.img[d.id] = ''; }
  ctx.rerender();
}

// ── 화면 ─────────────────────────────────────────
const md = (ymd) => `${ymd.slice(4, 6)}/${ymd.slice(6, 8)}`;
const itemTitle = (d) => `${(d.items[0] || {}).name || ''}${d.items.length > 1 ? ` 외 ${d.items.length - 1}개` : ''}`;
function filtered() {
  const q = G.q.trim().toLowerCase();
  return G.list.filter((d) => (G.month === '전체' || d.ymd.slice(4, 6) === G.month)
    && (!G.site || d.site === G.site)
    && (!q || `${d.site} ${d.slip} ${(d.slips || []).join(' ')} ${d.items.map((x) => x.name).join(' ')}`.toLowerCase().includes(q)));
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
  const draftable = rows.filter((d) => statusOf(d) !== '최종완료');
  const picked = draftable.filter((d) => G.pick.has(d.id));
  const tab = (on) => `height:38px;padding:0 16px;border-radius:19px;font:inherit;font-size:14px;cursor:pointer;${on ? 'background:#1F2328;color:#fff;border:1px solid #1F2328;font-weight:700' : 'background:#fff;color:#1F2328;border:1px solid #E6E4DF'}`;
  const open = G.open && G.list.find((d) => d.id === G.open);
  return `<div class="gb" style="font-family:Pretendard,'Noto Sans KR',system-ui,sans-serif;color:#1F2328;background:#F7F7F5;min-height:100vh;display:flex;flex-wrap:wrap">
  <nav aria-label="메뉴" style="flex:1 1 220px;max-width:240px;background:#fff;border-right:1px solid #E6E4DF;padding:20px 14px;box-sizing:border-box;display:flex;flex-direction:column;gap:4px">
    <div style="display:flex;align-items:center;gap:10px;padding:4px 8px 18px"><img src="./icons/partner-gongan.png" alt="공간제작소" style="height:40px"><span aria-hidden="true" style="color:#8A8A8A">×</span><img src="./icons/logo-full.png" alt="HOME TRADERS" style="height:36px"></div>
    <button type="button" data-gb="biz" data-v="homt" style="${navStyle(!isAce)}"><span>홈트레이더스</span><span>${isAce ? '' : G.list.length}</span></button>
    <button type="button" data-gb="biz" data-v="ace" style="${navStyle(isAce)}"><span>에이스</span><span>${isAce ? G.list.length : ''}</span></button>
    ${ctx.me() === 'space1234' ? '' : '<button type="button" data-gb="start" style="margin-top:auto;border:0;background:none;text-align:left;padding:14px 8px 4px;font:inherit;font-size:12px;color:#6B6B6B;cursor:pointer">‹ 처음 화면</button>'}
  </nav>
  <main style="flex:999 1 560px;min-width:0;padding:28px 32px 48px;box-sizing:border-box;display:flex;flex-direction:column;gap:18px">
    <h1 style="margin:0;font-size:22px">공간제작소 거래명세표 · 세금계산서 <span style="display:inline-block;vertical-align:middle;margin-left:8px;padding:3px 10px;border-radius:12px;font-size:13px;${isAce ? 'background:#E8EDF4;color:#1F3A5F' : 'background:#FDF0E6;color:#9A3412'}">${isAce ? '에이스' : '홈트레이더스'}</span></h1>
    ${G.err ? `<div style="padding:12px 14px;border-radius:8px;background:#FDECEC;color:#7A1A12;font-size:13px">${esc(G.err)}</div>` : ''}
    <div role="tablist" aria-label="월" style="display:flex;gap:6px;flex-wrap:wrap">
      ${months.map((m) => `<button type="button" role="tab" data-gb="month" data-v="${m}" style="${tab(G.month === m)}">2026년 ${Number(m)}월 <span style="opacity:.7;margin-left:4px">${G.list.filter((d) => d.ymd.slice(4, 6) === m).length}</span></button>`).join('')}
      <button type="button" role="tab" data-gb="month" data-v="전체" style="${tab(G.month === '전체')}">전체보기 <span style="opacity:.7;margin-left:4px">${G.list.length}</span></button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px">
      ${STATUS.map((k) => `<button type="button" data-gb="status" data-v="${k}" style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:14px 16px;border-radius:12px;font:inherit;text-align:left;cursor:pointer;background:#fff;${G.status === k ? 'border:2px solid #E8732C' : 'border:1px solid #E6E4DF'}"><span style="font-size:13px;color:#5C5C5C">${k === '전체' ? '전체보기' : k}</span><b style="font-size:26px">${cnt(k)}<span style="font-size:14px;font-weight:500;margin-left:3px">건</span></b></button>`).join('')}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
      <span style="position:relative;display:inline-flex"><select data-gb="site" aria-label="현장" style="height:38px;border:1px solid #E6E4DF;border-radius:8px;padding:0 40px 0 14px;font:inherit;font-size:13px;background:#fff;appearance:none;-webkit-appearance:none;cursor:pointer"><option value="">전체 현장</option>${sites.map((x) => `<option ${G.site === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>${CHEV}</span>
      <input data-gb="q" aria-label="검색" value="${esc(G.q)}" placeholder="현장, 전표번호, 품목으로 검색…" style="flex:1 1 260px;height:38px;border:1px solid #E6E4DF;border-radius:8px;padding:0 12px;font:inherit;font-size:13px;background:#fff">
    </div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="font-size:13px;color:#5C5C5C">선택 <b style="color:#1F2328">${picked.length}</b>건</span>
      <button type="button" data-gb="bulk" ${picked.length ? '' : 'disabled'} style="height:38px;padding:0 16px;border-radius:8px;font:inherit;font-size:14px;font-weight:700;${picked.length ? 'background:#1D4F91;color:#fff;border:1px solid #1D4F91;cursor:pointer' : 'background:#F1F1F1;color:#8A8A8A;border:1px solid #E0E0E0'}">선택한 건 기안 확정</button>
    </div>
    <div style="background:#fff;border:1px solid #E6E4DF;border-radius:12px;overflow-x:auto">
      <table style="width:100%;min-width:1000px;border-collapse:collapse;font-size:13px">
        <thead><tr style="background:#FAFAF8;color:#5C5C5C;text-align:left">
          <th style="padding:12px 6px 12px 14px;width:28px"><input type="checkbox" data-gb="pickall" aria-label="전체 선택" ${draftable.length && picked.length === draftable.length ? 'checked' : ''} style="width:16px;height:16px;accent-color:#1D4F91"></th>
          <th style="padding:12px 8px;font-weight:600">출고일</th><th style="padding:12px 8px;font-weight:600">현장</th><th style="padding:12px 8px;font-weight:600">품목명</th>
          <th style="padding:12px 8px;font-weight:600;text-align:right;white-space:nowrap">합계 (VAT 포함)</th><th style="padding:12px 8px;font-weight:600;text-align:center">거래명세표</th>
          <th style="padding:12px 8px;font-weight:600;text-align:center">세금계산서</th><th style="padding:12px 8px;font-weight:600;text-align:center">상태</th><th style="padding:12px 14px 12px 8px;font-weight:600;text-align:center">기안</th>
        </tr></thead>
        <tbody>${rows.map(rowHtml).join('') || `<tr><td colspan="9" style="padding:40px;text-align:center;color:#6B6B6B">${G.loading ? '불러오는 중…' : '없어요'}</td></tr>`}</tbody>
      </table>
    </div>
    <nav aria-label="페이지" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <span style="font-size:13px;color:#5C5C5C">총 ${shown.length}건</span>
      <div style="display:flex;gap:4px">${Array.from({ length: pages }, (_, i) => i + 1).map((n) => `<button type="button" data-gb="page" data-v="${n}" style="min-width:36px;height:36px;padding:0 10px;border-radius:8px;font:inherit;font-size:13px;cursor:pointer;${n === G.page ? 'background:#1F2328;color:#fff;border:1px solid #1F2328;font-weight:700' : 'background:#fff;color:#1F2328;border:1px solid #E6E4DF'}">${n}</button>`).join('')}</div>
      <span style="position:relative;display:inline-flex"><select data-gb="size" aria-label="한 페이지에" style="height:36px;border:1px solid #E6E4DF;border-radius:8px;padding:0 40px 0 14px;font:inherit;font-size:13px;background:#fff;appearance:none;-webkit-appearance:none;cursor:pointer">${[20, 50, 100].map((n) => `<option value="${n}" ${G.size === n ? 'selected' : ''}>${n}개씩</option>`).join('')}</select>${CHEV}</span>
    </nav>
  </main>
  ${open ? modalHtml(open) : ''}
  <input type="file" id="gb-file" accept="image/*,application/pdf" hidden>
</div>`;
}
const navStyle = (on) => `display:flex;justify-content:space-between;padding:10px;border-radius:8px;border:0;font:inherit;font-size:14px;cursor:pointer;text-align:left;${on ? 'background:#FDF0E6;color:#9A3412;font-weight:700' : 'background:none;color:#1F2328'}`;
const addBtn = (act, id) => `<button type="button" data-gb="${act}" data-id="${esc(id)}" style="width:92px;height:34px;border-radius:8px;border:1.5px dashed #B8B8B8;background:#F4F4F4;color:#4B4B4B;font:inherit;font-weight:700;font-size:13px;cursor:pointer">+ 넣기</button>`;
const okTag = '<span style="display:inline-block;padding:6px 10px;border-radius:6px;background:#EEF6EE;color:#1E6B34;font-size:12px;font-weight:600">첨부됨</span>';
function rowHtml(d) {
  const st = statusOf(d), x = G.docs[d.id] || {};
  const canDraft = st !== '최종완료';
  return `<tr data-gb="row" data-id="${esc(d.id)}" style="cursor:pointer;border-top:1px solid #EFEDE8;${x.tax_name ? '' : 'background:#FFFCF8'}">
    <td style="padding:12px 6px 12px 14px">${canDraft ? `<input type="checkbox" data-gb="pick" data-id="${esc(d.id)}" aria-label="선택" ${G.pick.has(d.id) ? 'checked' : ''} style="width:16px;height:16px;accent-color:#1D4F91">` : ''}</td>
    <td style="padding:12px 8px;white-space:nowrap"><b>${md(d.ymd)}</b><div style="font-size:11px;color:#6B6B6B">${esc((d.slips || [d.slip]).map((s) => s.slice(4)).join(', '))}</div></td>
    <td style="padding:12px 8px;white-space:nowrap">${esc(d.site || '')}</td>
    <td style="padding:12px 8px"><div style="font-weight:600">${esc(itemTitle(d))}</div>${st === '수정요청' && x.reason ? `<div style="margin-top:6px;max-width:340px;font-size:12px;line-height:1.5;color:#B42318;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden"><b>수정요청</b> ${esc(x.reason)}</div>` : ''}</td>
    <td style="padding:12px 8px;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums">${won(d.total)}</td>
    <td style="padding:12px 8px;text-align:center">${okTag}</td>
    <td style="padding:12px 8px;text-align:center">${x.tax_name ? okTag : addBtn('addtax', d.id)}</td>
    <td style="padding:12px 8px;text-align:center;white-space:nowrap"><span style="display:inline-block;white-space:nowrap;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:700;${BADGE[st]}">${st}</span></td>
    <td style="padding:12px 14px 12px 8px;text-align:center">${canDraft ? `<button type="button" data-gb="draft" data-id="${esc(d.id)}" style="height:32px;padding:0 12px;border-radius:6px;border:1px solid #1D4F91;background:#fff;color:#1D4F91;font:inherit;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">기안 확정</button>` : '<span style="font-size:12px;color:#1E6B34;font-weight:600">완료</span>'}</td>
  </tr>`;
}
function docBox(kind, d) {
  const f = G.full[d.id] || {};
  const src = kind === 'stmt' ? (f.stmt_data || (G.img[d.id] && G.img[d.id] !== 'loading' ? G.img[d.id] : '')) : f.tax_data;
  const label = kind === 'stmt' ? '거래명세표' : '세금계산서';
  const no = kind === 'tax' && src ? (G.docs[d.id] || {}).tax_no || '' : '';
  const noRow = kind === 'tax' && src ? `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:14px">
      <span style="color:#5C5C5C">승인번호</span>
      ${no ? `<b style="font-size:16px;letter-spacing:.2px">${esc(no)}</b>` : `<input data-gb="taxno" placeholder="${finding.has(d.id) ? '찾는 중…' : '20261013-10261013-99366706'}" style="height:32px;width:260px;border:1px solid #D0D0D0;border-radius:6px;padding:0 10px;font:inherit;font-size:14px">`}
      <button type="button" data-gb="copyno" ${no ? '' : 'disabled'} style="height:32px;padding:0 12px;border:1px solid #1D4F91;border-radius:6px;background:#fff;color:#1D4F91;font:inherit;font-size:13px;font-weight:700;cursor:pointer">복사하기</button></div>` : '';
  const cap = `${noRow}<figcaption style="display:flex;justify-content:space-between;align-items:center"><b>${label}</b><span style="display:flex;gap:6px">${[['copy', '복사'], ['jpg', 'JPG 저장'], ['pdf', 'PDF 저장']].map(([a, t]) => `<button type="button" data-gb="${a}" data-k="${kind}" ${src ? '' : 'disabled'} style="height:30px;padding:0 10px;border:1px solid #E6E4DF;border-radius:6px;background:#fff;font:inherit;font-size:12px;cursor:pointer">${t}</button>`).join('')}</span></figcaption>`;
  const pen = `<button type="button" data-gb="replace" data-k="${kind}" aria-label="${label} 바꾸기" style="position:absolute;top:8px;right:8px;width:30px;height:30px;border-radius:15px;border:1px solid #D5D8DD;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">${PEN}</button>`;
  if (!src && kind === 'stmt') return `<figure style="margin:0;display:flex;flex-direction:column;gap:8px">${cap}<div style="aspect-ratio:1588/1408;border:1px solid #D9D9D9;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#6B6B6B;font-size:13px">불러오는 중…</div></figure>`;
  if (!src) return `<figure style="margin:0;display:flex;flex-direction:column;gap:8px">${cap}<button type="button" data-gb="replace" data-k="tax" style="aspect-ratio:1588/1408;border:2px dashed #B8B8B8;border-radius:8px;background:#F4F4F4;color:#4B4B4B;font:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer"><span style="font-size:32px">+</span><b>세금계산서 넣기</b></button></figure>`;
  const pdf = src.startsWith('data:application/pdf');
  const del = kind === 'tax' ? `<button type="button" data-gb="deltax" aria-label="세금계산서 지우기" style="position:absolute;top:8px;right:46px;width:30px;height:30px;border-radius:15px;border:1px solid #F1B5AF;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">${TRASH}</button>` : '';   // 잘못 넣은 세금계산서 지우기 (10/23 대표)
  return `<figure style="margin:0;display:flex;flex-direction:column;gap:8px">${cap}<div style="position:relative;border:1px solid #D9D9D9;border-radius:6px;overflow:hidden;background:#fff">${pdf ? `<embed src="${src}" type="application/pdf" style="width:100%;aspect-ratio:1588/1408;display:block">` : `<button type="button" data-gb="zoom" data-k="${kind}" aria-label="${label} 크게 보기" style="display:block;width:100%;padding:0;border:0;background:none;cursor:zoom-in"><img src="${src}" alt="${label}" style="width:100%;height:auto;display:block"></button>`}${del}${pen}</div></figure>`;
}
function modalHtml(d) {
  ensureImg(d); ensureFull(d.id);
  const st = statusOf(d), x = G.docs[d.id] || {};
  const zoomSrc = G.zoom === 'stmt' ? ((G.full[d.id] || {}).stmt_data || G.img[d.id]) : G.zoom === 'tax' ? (G.full[d.id] || {}).tax_data : '';
  return `<div data-gb="overlay" style="position:fixed;inset:0;background:rgba(17,20,24,.45);display:flex;align-items:flex-start;justify-content:center;padding:20px 16px;box-sizing:border-box;overflow-y:auto;z-index:50">
    <div role="dialog" aria-modal="true" aria-label="거래명세표 · 세금계산서" style="width:100%;max-width:1360px;background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.25);padding:20px 22px 22px;box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div style="display:flex;flex-direction:column;gap:6px"><b style="font-size:17px">${md(d.ymd)} · ${esc(d.site || '')} · ${esc(itemTitle(d))}</b>
          <span style="display:flex;align-items:center;gap:8px;font-size:13px;color:#5C5C5C">합계 ${won(d.total)}원 <span style="display:inline-block;white-space:nowrap;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:700;${BADGE[st]}">${st}</span></span></div>
        <div style="display:flex;gap:8px;align-items:center">
          <button type="button" data-gb="both" style="height:40px;padding:0 16px;border:1px solid #1F2328;border-radius:8px;background:#fff;color:#1F2328;font:inherit;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px">${DOWN}2장 한 번에 다운로드</button>
          <button type="button" data-gb="close" aria-label="닫기" style="width:40px;height:40px;border:1px solid #E6E4DF;border-radius:20px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">${X}</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">${docBox('stmt', d)}${docBox('tax', d)}</div>
      ${st === '수정요청' && x.reason ? `<div style="padding:12px 14px;border-radius:8px;background:#FDECEC;border:1px solid #F5C2C0;color:#7A1A12;font-size:13px;line-height:1.5"><b>수정요청</b><br>${esc(x.reason)}</div>` : ''}
      <div style="margin:4px -22px -22px;padding:18px 22px 22px;background:#F3F4F6;border-radius:0 0 14px 14px;display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px">
        <label style="flex:1 1 480px;display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:#3F3F46">수정요청 사유
          <textarea data-gb="reason" rows="1" placeholder="예: 세금계산서 작성일자가 출고일과 달라요" style="height:44px;min-height:44px;resize:vertical;border:1px solid #3F3F46;border-radius:10px;padding:10px 12px;font:inherit;font-size:14px;font-weight:400;background:#fff;box-sizing:border-box">${esc(G.reason)}</textarea></label>
        <div style="display:flex;gap:8px;align-items:flex-end">
          <button type="button" data-gb="reject" style="height:44px;min-width:128px;padding:0 18px;border-radius:8px;border:1px solid #B42318;background:#fff;color:#B42318;font:inherit;font-size:15px;font-weight:700;cursor:pointer">수정요청</button>
          <button type="button" data-gb="confirm" ${st === '최종완료' ? 'disabled' : ''} style="height:44px;min-width:128px;padding:0 18px;border-radius:8px;font:inherit;font-size:15px;font-weight:700;${st === '최종완료' ? 'background:#EEF6EE;color:#1E6B34;border:1px solid #CFE6D3' : 'background:#1D4F91;color:#fff;border:1px solid #1D4F91;cursor:pointer'}">기안 확정</button>
        </div>
      </div>
    </div>
  </div>
  ${zoomSrc ? `<div data-gb="unzoom" style="position:fixed;inset:0;background:rgba(10,12,14,.82);z-index:60;overflow:auto;padding:24px;box-sizing:border-box;cursor:zoom-out"><button type="button" data-gb="unzoom" aria-label="닫기" style="position:fixed;top:16px;right:16px;width:44px;height:44px;border-radius:22px;border:0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center">${X}</button><img src="${zoomSrc}" alt="크게 보기" style="display:block;width:min(100%,1588px);margin:0 auto;border-radius:6px;background:#fff"></div>` : ''}`;
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
async function attach(id, kind, file) {
  if (!file) return;
  try {
    const data = await toStored(file);
    const prev = G.docs[id] || {};
    if (kind === 'tax') { await save(id, { tax_data: data, tax_name: file.name || '세금계산서', tax_no: null, status: prev.status === '수정요청' ? null : prev.status || null }); findTaxNo(id, data); }
    else save(id, { stmt_data: data });
  } catch (e) { alert(e.message || e); }
}
async function canvasOf(src) {
  const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('그림을 읽지 못했어요')); i.src = src; });
  const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0); return c;
}
const srcOf = (d, kind) => (kind === 'stmt' ? ((G.full[d.id] || {}).stmt_data || G.img[d.id]) : (G.full[d.id] || {}).tax_data);
const fileName = (d, kind) => `${d.ymd.slice(2)}_${(d.site || '공간제작소').replace(/[\\/:*?"<>|]/g, ' ')}_${kind === 'stmt' ? '거래명세표' : '세금계산서'}.jpg`;
async function saveJpg(d, kind) {
  const src = srcOf(d, kind); if (!src || src === 'loading') return;
  if (src.startsWith('data:application/pdf')) { const a = document.createElement('a'); a.href = src; a.download = fileName(d, kind).replace(/\.jpg$/, '.pdf'); a.click(); return; }
  const c = await canvasOf(src);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.92));
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName(d, kind); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
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
async function copyImg(d, kind) {
  const src = srcOf(d, kind); if (!src || src === 'loading' || src.startsWith('data:application/pdf')) return;
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
export function setBiz(biz) { if (G.biz !== biz) { G.biz = biz; G.loaded = ''; G.page = 1; G.pick.clear(); G.open = null; G.month = '전체'; G.status = '전체'; G.site = ''; } }
export function bind(app, c) {
  ctx = c;
  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-gb]'); if (!t || !app.querySelector('.gb')) return;
    const a = t.dataset.gb, id = t.dataset.id, cur = G.open && G.list.find((d) => d.id === G.open);
    if (a === 'row') { if (e.target.closest('button, input, a, label, select')) return; G.open = id; G.reason = ''; G.zoom = ''; ctx.rerender(); }
    else if (a === 'overlay') { if (e.target === t) { G.open = null; ctx.rerender(); } }
    else if (a === 'close') { G.open = null; G.zoom = ''; ctx.rerender(); }
    else if (a === 'biz') { setBiz(t.dataset.v); ctx.go(t.dataset.v === 'ace' ? 'gonggan-ace' : 'gonggan'); }
    else if (a === 'start') ctx.goStart();
    else if (a === 'month') { G.month = t.dataset.v; G.page = 1; ctx.rerender(); }
    else if (a === 'status') { G.status = t.dataset.v; G.page = 1; ctx.rerender(); }
    else if (a === 'page') { G.page = Number(t.dataset.v) || 1; ctx.rerender(); }
    else if (a === 'addtax') { G.open = id; pickFile(id, 'tax'); ctx.rerender(); }
    else if (a === 'replace' && cur) pickFile(cur.id, t.dataset.k);
    else if (a === 'deltax' && cur) { if (confirm('세금계산서를 지울까요?')) save(cur.id, { tax_data: null, tax_name: null, tax_no: null, status: null, drafted_at: null }); }   // 지우면 결재전으로
    else if (a === 'draft') save(id, { status: '최종완료', drafted_at: new Date().toISOString() });
    else if (a === 'bulk') { const ids = [...G.pick]; G.pick.clear(); ids.forEach((x) => save(x, { status: '최종완료', drafted_at: new Date().toISOString() })); }
    else if (a === 'confirm' && cur) { save(cur.id, { status: '최종완료', drafted_at: new Date().toISOString() }); G.open = null; }
    else if (a === 'reject' && cur) { save(cur.id, { status: '수정요청', reason: G.reason.trim() || '수정요청' }); G.open = null; G.reason = ''; }
    else if (a === 'zoom') { G.zoom = t.dataset.k; ctx.rerender(); }
    else if (a === 'unzoom') { G.zoom = ''; ctx.rerender(); }
    else if (a === 'jpg' && cur) saveJpg(cur, t.dataset.k);
    else if (a === 'copy' && cur) copyImg(cur, t.dataset.k);
    else if (a === 'pdf' && cur) savePdf(cur, t.dataset.k);
    else if (a === 'copyno' && cur) { const v = (G.docs[cur.id] || {}).tax_no || ''; navigator.clipboard.writeText(v).then(() => { t.textContent = '복사됨'; setTimeout(() => { t.textContent = '복사하기'; }, 1500); }).catch(() => alert(v)); }
    else if (a === 'both' && cur) { saveJpg(cur, 'stmt'); setTimeout(() => saveJpg(cur, 'tax'), 600); }
  });
  app.addEventListener('change', (e) => {
    const t = e.target; if (!app.querySelector('.gb')) return;
    if (t.id === 'gb-file') { const f = t.files && t.files[0]; if (fileTarget) attach(fileTarget.id, fileTarget.kind, f); return; }
    const a = t.dataset && t.dataset.gb;
    if (a === 'taxno') { const m = NO_RE.exec(t.value); const cur = G.open && G.list.find((d) => d.id === G.open); if (m && cur) save(cur.id, { tax_no: `${m[1]}-${m[2]}-${m[3]}` }); else if (t.value.trim()) alert('승인번호는 20261013-10261013-99366706 모양이에요'); return; }
    if (a === 'pick') { if (t.checked) G.pick.add(t.dataset.id); else G.pick.delete(t.dataset.id); ctx.rerender(); }
    else if (a === 'pickall') { const ids = filtered().filter((d) => statusOf(d) !== '최종완료').map((d) => d.id); if (t.checked) ids.forEach((x) => G.pick.add(x)); else G.pick.clear(); ctx.rerender(); }
    else if (a === 'site') { G.site = t.value; G.page = 1; ctx.rerender(); }
    else if (a === 'size') { G.size = Number(t.value) || 20; G.page = 1; ctx.rerender(); }
  });
  app.addEventListener('input', (e) => {
    const t = e.target; if (!app.querySelector('.gb')) return;
    if (t.dataset.gb === 'reason') G.reason = t.value.slice(0, 300);
    else if (t.dataset.gb === 'q') { G.q = t.value.slice(0, 60); G.page = 1; clearTimeout(G.qt); G.qt = setTimeout(() => { ctx.rerender(); const el = document.querySelector('[data-gb="q"]'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 250); }
  });
  window.addEventListener('paste', (e) => {      // 팝업이 열려 있으면 캡처 붙여넣기 = 세금계산서
    if (!G.open || !app.querySelector('.gb')) return;
    const f = [...((e.clipboardData && e.clipboardData.files) || [])][0]; if (!f) return;
    e.preventDefault(); attach(G.open, 'tax', f);
  });
}
