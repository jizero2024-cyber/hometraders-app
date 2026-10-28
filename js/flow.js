// 첫 화면 맨 위 '출고 흐름' (10/28 대표 "배차 뭐뭐 해야 하는지 간편하게") — 목업 https://claude.ai/artifact/4boELHQ3xhPF3WmLSqFXEt
// 맥 도우미 flow_board.py 가 출고일보 줄을 출고 건(출고번호)마다 단계로 나눠 site_inbox 'flow:board' 에 올림 → 여기선 읽기만.
// 버튼은 있는 화면을 그 건 값으로 엶: 배차 요청(/homt) · 전자 송장 · 납품확인서 · 자재승인원 · 견적서 · 공간 올릴 전표
import * as S from './store-supabase.js?v=7';
import * as FM from './forms.js?v=11';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sv = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const IC = {
  견적: sv('<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8 7h8M8.5 11h1M11.5 11h1M14.5 11h1M8.5 14h1M11.5 14h1M14.5 14h1M8.5 17h1M11.5 17h4"/>'),
  발주: sv('<rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>'),
  '배차 요청': sv('<path d="M4 10v4l3 1 9 4V5L7 9z"/><path d="M19 9.5a3 3 0 0 1 0 5"/>'),
  '배차 완료': sv('<path d="M2.5 7h11v9h-11zM13.5 10h4l3 3v3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>'),
  '출고 완료': sv('<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>'),
  전표: sv('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
  명세표: sv('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 13l2 2 4-4"/>'),
  입금: sv('<circle cx="12" cy="12" r="8.5"/><path d="M8 9l1.5 6L12 10l2.5 5L16 9M7.5 12h9"/>'),
};
const STEPS = ['견적', '발주', '배차 요청', '배차 완료', '출고 완료'];   // 전표는 사이드바 '전표 확인'으로 (10/28 대표)
const LABEL = { 견적: '견적 요청' };   // 10/28 대표 "견적 텍스트 견적요청으로"
const FL = { marks: {}, data: null, err: '', at: 0, loading: false, cur: '배차 요청', view: 'flow', day: '', sel: '', links: {}, gwait: 0 };
let ctx = { rerender: () => {}, openFrame: () => {} };

export function load(force) {
  if (FL.loading || (!force && Date.now() - FL.at < 60000)) return;
  FL.loading = true; FL.at = Date.now();
  S.getFlowMarks().then((m) => { FL.marks = m; ctx.rerender(); }).catch(() => {});
  S.getFlowBoard().then((d) => { FL.data = d; FL.err = ''; }).catch((e) => { FL.err = e.message; })
    .finally(() => { FL.loading = false; ctx.rerender(); });
}
export function setGwait(n) { FL.gwait = n || 0; }

const rowsOf = (k) => (FL.data ? FL.data.rows : []).filter((r) => r.steps.includes(k));
const TODAY_ONLY = ['배차 요청', '배차 완료', '출고 완료'];   // 오늘 마감 — 오늘 건만 (10/28 대표). 견적 요청·발주는 날짜가 앞이라 다
const dueToday = (r) => { const t = (FL.data || {}).today || '', d = t.replace(/^0/, '');   // 견적 — 오늘까지 보내야 하는 것 (10/28 대표)
  const txt = `${r.time} ${r.item} ${r.memo || ''}`; return r.day === t || new RegExp(`(^|[^\\d/])(${t}|${d})(?![\\d/])`).test(txt); };   // '오늘' 글자는 옛 메모에도 있어서 오늘 날짜가 적힌 것만
const listOf = (k) => (FL.all || FL.view === '견적' ? rowsOf(k) : TODAY_ONLY.includes(k) ? rowsOf(k).filter((r) => r.day === (FL.data || {}).today) : k === '견적' ? rowsOf(k).filter(dueToday) : rowsOf(k));
const countOf = (k) => (k === '전표' ? rowsOf('입력 누락').filter((r) => r.day === (FL.data || {}).today).length
  : ['명세표', '입금'].includes(k) ? 0 : listOf(k).length);
const hotOf = (k) => (k === '전표' ? rowsOf('입력 누락').length > 0 : TODAY_ONLY.includes(k) && listOf(k).length > 0);
const title = (r) => `${esc(r.partner)} · ${r.site ? esc(r.site) : '<span class="fl-q">현장 확인</span>'}${r.boss ? ` · ${esc(r.boss)}` : ''}`;
const md = (d) => { const m = /^(\d{2})\/(\d{2})$/.exec(d || ''); return m ? `${m[1]}/${m[2]}` : ''; };
const tmr = () => { const x = new Date(Date.now() + 864e5); return `${String(x.getMonth() + 1).padStart(2, '0')}/${String(x.getDate()).padStart(2, '0')}`; };
const dayLab = (r) => { const t = (FL.data || {}).today; if (r.day === t) return '오늘'; if (r.late) return '지난 날'; if (md(r.day) === tmr()) return '내일'; return r.day === '미정' ? '날짜 미정' : r.day; };
const BTN = { 견적: [['quote', '견적서']], 발주: [['esong', '전자 송장']], '배차 요청': [['disp', '배차 요청'], ['esong', '전자 송장']], '배차 완료': [['esong', '전자 송장']],
  '출고 완료': [['deliv', '납품확인서'], ['approval', '자재승인원'], ['esong', '전자 송장']] };

function stepsHtml() {
  return `<nav class="fl-steps" aria-label="단계">${STEPS.map((k) => `<button type="button" class="fl-st ${FL.cur === k ? 'on' : ''} ${hotOf(k) ? 'hot' : ''}" data-fl="step" data-k="${k}">
    <i>${IC[k]}</i>${LABEL[k] || k}<b>${['명세표', '입금'].includes(k) ? '' : countOf(k)}</b></button>`).join('')}</nav>`;
}
const STMT_STEPS = ['배차 완료', '출고 완료'];
const saleSlips = (r) => [...new Set((r.lines || []).filter((l) => l.k === '판매' && l.st === '입력').flatMap((l) => l.slips || []))];
function stmtHtml(r) {   // 거래명세표 — 판매전표 PDF 보기 · 전달했는지 (10/28 대표)
  const sl = saleSlips(r);
  if (!sl.length) return '<span class="fl-stm na">판매 미입력</span>';
  const hit = sl.flatMap((x) => FL.links[x] || [])[0], mk = FL.marks[`sent:${r.no}`];
  return `<span class="fl-stm">${hit ? `<button type="button" class="fl-in ok" data-fl="pdf" data-s="${esc(sl.join(','))}">명세표 ›</button>` : `<span class="fl-in na">명세표 PDF 대기</span>`}
    ${mk ? `<span class="fl-chip ok">전달 ${esc(String(mk.created_at || '').slice(5, 10).replace('-', '/'))}</span>` : `<button type="button" class="fl-gh sm" data-fl="sent" data-no="${esc(r.no)}">전달함</button>`}</span>`;
}
function rowHtml(r) {
  const btns = (BTN[FL.cur] || []).map(([a, t], i) => `<button type="button" class="${i ? 'fl-gh' : 'fl-go'}" data-fl="${a}" data-no="${esc(r.no)}">${t}</button>`).join('');
  const asked = FL.cur === '배차 요청' && S.getShipments().find((s) => String(s.note || '').includes(`출고 흐름 ${r.no})`));
  const chips = [asked ? `<span class="fl-chip blu">요청함 ${esc((String(asked.note).match(/요청함 (\d\d:\d\d)/) || ['', ''])[1])}</span>` : '', r.late && FL.cur === '배차 요청' ? '<span class="fl-chip no">누락</span>' : '', FL.cur === '배차 완료' && !r.driver ? '<span class="fl-chip amb">기사·운임 확인</span>' : ''].join('');
  const route = FL.cur === '견적' ? '' : `${esc(r.from || '상차지 확인')} → ${esc(r.site || '하차지 확인')}`;
  return `<div class="fl-row ${FL.sel === r.no ? 'sel' : ''}" data-fl="row" data-no="${esc(r.no)}">
    <div class="fl-c fl-tm ${r.late || r.day === FL.data.today ? 'now' : ''}"><b>${esc(r.time || (r.day === '미정' ? '미정' : '시간 미정'))}</b><span>${esc(r.day)}</span></div>
    <div class="fl-c fl-nm">${title(r)}</div>
    <div class="fl-c fl-ds">${chips}${esc(r.item)}</div>
    <div class="fl-c fl-ds fl-rt">${route}</div>
    <div class="fl-c fl-ds fl-v">${FL.cur === '견적' ? '' : esc(r.size || '')}</div>
    <div class="fl-acts">${STMT_STEPS.includes(FL.cur) ? stmtHtml(r) : ''}${btns}</div></div>${FL.sel === r.no ? detailHtml(r) : ''}`;
}
function detailHtml(r) {
  const buys = (r.buys || []).filter((b) => b.name).map((b) => `<div class="fl-k">${esc(b.name)}</div><div class="fl-it">${esc(b.item)}</div>`).join('');
  return `<div class="fl-det">
    ${r.why ? `<div class="fl-why">${esc(r.why)}</div>` : ''}
    ${buys || `<div class="fl-it">${esc(r.items)}</div>`}
    ${r.veh ? `<div class="fl-k">차량</div><div class="fl-it">${esc(r.veh)}</div>` : ''}
    <div class="fl-k">전표</div><div>${linesHtml(r)}</div>
    ${(r.ev || []).length ? `<div class="fl-k">근거</div><div class="fl-memo">${r.ev.map((e) => `<a class="fl-evl" href="${esc(e.u)}" target="_blank" rel="noopener">${esc(e.t)}</a>`).join('')}</div>` : ''}</div>`;
}
function linesHtml(r) {
  return (r.lines || []).map((l) => {
    const has = l.st === '입력' && l.slips && l.slips.some((s) => FL.links[s]);
    const st = l.st === '입력' ? `<button type="button" class="fl-in ok" data-fl="pdf" data-s="${esc((l.slips || []).join(','))}">입력${has ? ' ›' : ''}</button>`
      : `<span class="fl-in ${l.st === '미입력' || l.st === '누락' ? 'no' : 'na'}">${esc(l.st)}</span>`;
    return `<div class="fl-ln"><span class="fl-lk">${esc(l.k)}</span><span class="fl-c">${esc(l.who)}</span><span class="fl-by">${esc(l.by || '')}</span>${st}</div>`;
  }).join('');
}
function evHtml(r) {
  const ev = (r.ev || []).map((e) => `<a class="fl-evl" href="${esc(e.u)}" target="_blank" rel="noopener">${esc(e.t)}</a>`).join('');
  return `<div class="fl-ev"><div class="fl-eh"><b>${title(r)}</b><span>${esc(r.day)}</span></div>${linesHtml(r)}${r.memo || ev ? `<div class="fl-memo">${r.memo ? `<span>${esc(r.memo)}</span>` : ''}${ev}</div>` : ''}</div>`;
}
function listHtml() {
  if (FL.err) return `<div class="fl-empty">${esc(FL.err)}</div>`;
  if (!FL.data) return '<div class="fl-empty">불러오는 중…</div>';
  if (FL.cur === '입금') return '<div class="fl-empty">준비 중</div>';
  if (FL.cur === '명세표') return `<div class="fl-links"><a class="fl-go" href="/gonggan/">공간 협업툴</a><a class="fl-go" href="/newhousing/">뉴하우징 협업툴</a><button type="button" class="fl-gh" data-fl="stmt">거래명세표</button></div>`;
  if (FL.cur === '전표') {   // 오늘 하차한 건만 — 누락 먼저, 완료 아래 (10/28 대표 "하루에 다 입력"). 지난 날 누락은 맨 위 한 줄
    const t = FL.data.today, miss = rowsOf('입력 누락'), ok = rowsOf('입력 완료');
    const old = miss.filter((r) => r.day !== t), tm = miss.filter((r) => r.day === t), to = ok.filter((r) => r.day === t);
    const oldLine = old.length ? `<button type="button" class="fl-old" data-fl="old">지난 날 입력 누락 <b>${old.length}</b><span>${FL.old ? '접기 ▴' : '보기 ▾'}</span></button>` + (FL.old ? old.slice().reverse().map(evHtml).join('') : '') : '';
    const body = (tm.length ? `<div class="fl-day no">입력 누락 ${tm.length}</div>${tm.map(evHtml).join('')}` : '') + (to.length ? `<div class="fl-day ok">입력 완료 ${to.length}</div>${to.map(evHtml).join('')}` : '');
    return oldLine + (body || '<div class="fl-empty">오늘 하차한 건이 없어요</div>');
  }
  const rows = listOf(FL.cur);
  if (!rows.length) return '<div class="fl-empty">없어요</div>';
  if (STMT_STEPS.includes(FL.cur)) setTimeout(() => rows.forEach(fetchLinks), 0);
  let h = `<div class="fl-lh"><span>${FL.cur === '견적' ? '언제까지' : '도착'}</span><span>판매처 · 현장</span><span>품목</span><span>${FL.cur === '견적' ? '' : '상차 → 하차'}</span><span>${FL.cur === '견적' ? '' : '차량'}</span><span></span></div>`, last = null;
  rows.forEach((r) => { const g = dayLab(r); if (g !== last) { h += `<div class="fl-day">${esc(g)}</div>`; last = g; } h += rowHtml(r); });
  return h;
}
const today = () => (FL.data || {}).today;
export const counts = () => ({
  miss: rowsOf('입력 누락').filter((r) => r.day === today()).length, missOld: rowsOf('입력 누락').filter((r) => r.day !== today()).length,
  quote: rowsOf('견적').length, disp: rowsOf('배차 요청').length, songjang: [...rowsOf('배차 완료'), ...rowsOf('출고 완료')].filter((r) => r.day === today()).length,
});
export const view = () => FL.view;
export function setView(v) { FL.view = v === '마감' ? 'flow' : v; FL.sel = ''; if (v === '견적') FL.cur = '견적'; else if (FL.cur === '견적' && v === 'flow') FL.cur = '배차 요청'; }
function slipHtml(kind) {   // 전표 확인 — 입력 누락(오늘 먼저 · 지난 날 아래) / 입력 완료(최근 것부터)
  if (!FL.data) return '<div class="fl-empty">불러오는 중…</div>';
  const t = today(), rows = rowsOf(kind).slice().reverse();
  const now = rows.filter((r) => r.day === t), old = rows.filter((r) => r.day !== t);
  return `<h1 class="fl-h1">${kind}</h1>` + (now.length ? `<div class="fl-day ${kind === '입력 누락' ? 'no' : 'ok'}">오늘 ${now.length}</div>${now.map(evHtml).join('')}` : '')
    + (old.length ? `<div class="fl-day">지난 날 ${old.length}</div>${old.map(evHtml).join('')}` : '') + (rows.length ? '' : '<div class="fl-empty">없어요</div>');
}
// 오늘 마감 대시보드 (10/28 대표 "오늘 마감 흐름이 보이게 · 오늘 마감 것만") — 오늘 건만 센다
export function closeItems(x) {
  const t = today(), d = new Date(), md = `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`;
  const on = (k) => rowsOf(k).filter((r) => r.day === t);
  const fare = (x.fare || []).filter((f) => !f.sent && String(f.job || '').trim().startsWith(md));
  const lines = (rs, f) => rs.slice(0, 3).map(f);
  const who = (r) => `${r.partner} · ${r.site || '현장 확인'}`;
  return [
    { k: '견적 회신', rows: rowsOf('견적').filter((r) => String(r.memo || '').includes(`견적 요청 ${t}`)), go: 'v-flow-견적', btn: '견적 요청', f: (r) => who(r) },
    { k: '자료 넣기', n: x.inbox || 0, go: 'box', btn: '자료 넣기' },
    { k: '배차', rows: on('배차 요청'), go: 'v-flow-배차 요청', btn: '배차 요청', f: (r) => `${who(r)} · ${r.time || '시간 미정'}` },
    { k: '전자 송장', rows: [...on('배차 완료'), ...on('출고 완료')], go: 'v-flow-배차 완료', btn: '전자 송장', f: (r) => who(r) },
    { k: '전표 입력', rows: on('입력 누락'), go: 'v-누락', btn: '입력 누락', f: (r) => `${who(r)} — ${(r.lines || []).filter((l) => l.st === '미입력' || l.st === '누락').map((l) => l.k).join('·')}` },
    { k: '운송비', rows: fare, go: 'fare', btn: '보내기', f: (r) => `${r.job} · ${Math.round(Number(r.amount) || 0).toLocaleString()}원` },
  ].map((i) => ({ ...i, n: i.rows ? i.rows.length : i.n, list: i.rows ? lines(i.rows, i.f) : [] }));
}
function closeHtml(x) {
  const items = closeItems(x), left = items.filter((i) => i.n).length, done = items.length - left, d = new Date();
  const first = items.findIndex((i) => i.n);
  const pct = Math.round((done / items.length) * 100);
  return `<div class="cl-hd"><h1 class="fl-h1">오늘 마감 <span>${d.getMonth() + 1}/${d.getDate()} (${'일월화수목금토'[d.getDay()]})</span></h1><b>${done} / ${items.length} 끝</b></div>
    <div class="cl-st" style="--pn:${(pct / 100).toFixed(3)}">${items.map((i, k) => `<button type="button" class="cl-s ${!i.n ? 'ok' : k === first ? 'now' : 'left'}" data-fl="go" data-k="${i.go}"><i>${i.n ? i.n : '✓'}</i>${i.k}</button>`).join('')}
      <span class="cl-s ${left ? '' : 'ok'}"><i>✓</i>마감</span></div>
    <div class="cl-cards">${items.map((i) => `<div class="cl-c ${i.n ? '' : 'done'}"><div class="cl-t">${i.k}<b class="${i.n ? '' : 'ok'}">${i.n || '✓'}</b></div>
      ${i.list.map((l) => `<div class="cl-l">${esc(l)}</div>`).join('')}${i.n > 3 ? `<div class="cl-l">… ${i.n - 3}건 더</div>` : ''}
      ${i.n ? `<button type="button" class="fl-go" data-fl="go" data-k="${i.go}">${i.btn}</button>` : ''}</div>`).join('')}</div>
    <button type="button" class="fl-close ${left ? '' : 'on'}" data-fl="close">${left ? `오늘 마감 (남은 것 ${left})` : '오늘 마감'}</button>`;
}
export function main(x) {
  load();

  if (FL.view === '견적') { FL.cur = '견적'; return `<section class="fl"><h1 class="fl-h1">견적 요청</h1><div class="fl-list" style="--acts:${[0, 130, 240, 350][(BTN[FL.cur] || []).length] + (STMT_STEPS.includes(FL.cur) ? 200 : 0)}px">${listHtml()}</div></section>`; }   // 사이드바 견적 요청 — 단계줄 없이 (10/28 대표)
  if (FL.view === '누락') return `<section class="fl">${slipHtml('입력 누락')}</section>`;
  if (FL.view === '완료') return `<section class="fl">${slipHtml('입력 완료')}</section>`;
  const tg = `<div class="fl-sub fl-tg"><button type="button" class="fl-sb mid ${FL.all ? '' : 'on'}" data-fl="all" data-k="0">오늘</button><button type="button" class="fl-sb mid ${FL.all ? 'on' : ''}" data-fl="all" data-k="1">전체보기</button></div>`;
  return `<section class="fl" id="fl-list" aria-label="오늘 마감">${tg}${stepsHtml()}<div class="fl-list" style="--acts:${[0, 130, 240, 350][(BTN[FL.cur] || []).length]}px">${listHtml()}</div></section>`;   // 출고 흐름과 같은 모양, 오늘 건만 (10/28 대표)
}
export const panel = main;

// 전표 PDF 링크 미리 받기 (입력 줄의 전표 번호)
function fetchLinks(r) {
  const want = [...new Set((r.lines || []).flatMap((l) => l.slips || []))].filter((s) => !(s in FL.links));
  if (!want.length) return;
  want.forEach((s) => { FL.links[s] = null; });
  S.getSlipLinks(want).then((m) => { Object.entries(m).forEach(([k, v]) => { FL.links[k] = v; }); ctx.rerender(); }).catch(() => {});
}
// 송장 품목 — 출고일보 품목 글 '판재 124 · 코너 46 · …' 을 줄로
function itemRows(txt) {
  return String(txt || '').replace(/^[^:：]{0,40}[:：]\s*/, '').replace(/@\s*[\d,]+원?/g, '').replace(/\([^)]*\)|\[[^\]]*\]/g, '').split(/\s*·\s*|,\s+|\s+\/\s+/).map((x) => x.replace(/\s*—.*$/, '').trim()).filter((x) => x && !/공급가|부가세|합계|명세서|견적|^\d[\d,\s]*원?$/.test(x)).slice(0, 30).map((x) => {
    const m = x.match(/^(.*?)\s*(\d+(?:\.\d+)?)\s*(PLT|plt|박스|BOX|장|개|롤|봉|줄|대|EA|ea)?$/);
    return m ? { name: m[1].trim() || x, qty: m[2], unit: m[3] || '개' } : { name: x, qty: '', unit: '개' };
  });
}
function dispSrc(r) {
  const f = { no: r.no, from: r.from || '', to: r.site_full || '', toName: r.site_ok ? `${r.partner} ${r.site}` : '', car: r.size || '', goods: r.item || '', sched: [r.day !== '미정' ? r.day : '', r.time].filter(Boolean).join(' '), say: r.ace ? '에이스' : '' };
  return `/homt?embed=1&f=${encodeURIComponent(JSON.stringify(f))}`;
}
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch (_) { /* 무시 */ }
  ta.remove(); return Promise.resolve();
}
export function bind(app, c) {
  ctx = c;
  setInterval(() => { if (document.visibilityState === 'visible' && app.querySelector('.fl')) load(true); }, 60000);   // 열어 둔 채로도 1분마다 새로 (도우미는 출고일보가 바뀌면 5분 안에 올림)
  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-fl]'); if (!t || !app.querySelector('.fl')) return;
    const a = t.dataset.fl, r = FL.data && FL.data.rows.find((x) => x.no === t.dataset.no);
    if (a !== 'row') e.stopPropagation();
    if (a === 'step') { FL.cur = t.dataset.k; FL.sel = ''; ctx.rerender(); }
    else if (a === 'sent' && r) { if (!confirm(`${r.partner} · ${r.site} 거래명세표 전달함으로 표시할까요?`)) return; S.addFlowMark(`sent:${r.no}`, `${r.partner} ${r.site}`, ctx.me ? ctx.me() : '').then((err) => { if (err) alert('저장 못 했어요 — ' + err); else { FL.marks[`sent:${r.no}`] = { created_at: new Date().toISOString() }; ctx.rerender(); } }); }
    else if (a === 'all') { FL.all = t.dataset.k === '1'; FL.sel = ''; ctx.rerender(); }
    else if (a === 'old') { FL.old = !FL.old; ctx.rerender(); }
    else if (a === 'go') { const k = t.dataset.k; if (k === 'fare' || k === 'box') ctx.home(k); else if (k.startsWith('v-flow-')) { FL.view = 'flow'; FL.cur = k.slice(7); FL.sel = ''; ctx.rerender(); setTimeout(() => { const el = document.getElementById('fl-list'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 0); } else { FL.view = k.slice(2); ctx.rerender(); } }
    else if (a === 'close') { if (t.classList.contains('on')) alert('오늘 마감했어요'); }
    else if (a === 'row') { if (e.target.closest('button,a')) return; FL.sel = FL.sel === t.dataset.no ? '' : t.dataset.no; if (FL.sel && r) fetchLinks(r); ctx.rerender(); }
    else if (a === 'disp' && r) ctx.openFrame('배차 요청', dispSrc(r));
    else if (a === 'esong' && r) {
      const open = (items) => { FM.preset('esong', { partner: r.partner, site: r.site, ymd: '', items }); FM.open('esong'); ctx.rerender(); };
      const sale = [...new Set((r.lines || []).filter((l) => l.k === '판매').flatMap((l) => l.slips || []))];
      if (!sale.length) { open(itemRows(r.items)); return; }
      S.getSlipRowsBySlip(sale).then((gs) => {   // 이카운트 판매전표 줄 — 품목명 뒤 [현장 태그] 는 뺌
        const rows = gs.filter((g) => g.kind === '판매').flatMap((g) => g.rows || []).filter((x) => x && x[3] && !/운반비/.test(x[3]))
          .map((x) => ({ name: String(x[3]).replace(/\s*\[[^\]]*\]\s*$/, '').trim(), qty: String(x[5] == null ? '' : x[5]), unit: '개' }));
        open(rows.length ? rows : itemRows(r.items));
      }).catch(() => open(itemRows(r.items)));
    }
    else if (['deliv', 'approval', 'quote', 'stmt'].includes(a)) { FM.open(a === 'stmt' ? '' : a); if (a === 'stmt') ctx.go('stmt'); else ctx.rerender(); }
    else if (a === 'pdf') {
      const slips = (t.dataset.s || '').split(',').filter(Boolean), hit = slips.flatMap((s) => FL.links[s] || [])[0];
      if (hit) window.open(`https://drive.google.com/file/d/${encodeURIComponent(hit.drive_id)}/view`, '_blank', 'noopener');
      else if (slips.length) copyText(slips.join(' ')).then(() => alert(`전표 PDF가 아직 안 올라왔어요 — 전표 번호 ${slips.join(', ')} 복사함`));
    }
  });
}
