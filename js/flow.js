// 첫 화면 맨 위 '출고 흐름' (10/28 대표 "배차 뭐뭐 해야 하는지 간편하게") — 목업 https://claude.ai/artifact/4boELHQ3xhPF3WmLSqFXEt
// 맥 도우미 flow_board.py 가 출고일보 줄을 출고 건(출고번호)마다 단계로 나눠 site_inbox 'flow:board' 에 올림 → 여기선 읽기만.
// 버튼은 있는 화면을 그 건 값으로 엶: 배차 요청(/homt) · 전자 송장 · 납품확인서 · 자재승인원 · 견적서 · 공간 올릴 전표
import * as S from './store-supabase.js?v=7';
import * as FM from './forms.js?v=10';

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
const STEPS = ['견적', '발주', '배차 요청', '배차 완료', '출고 완료', '전표', '명세표', '입금'];
const LABEL = { 견적: '견적 요청' };   // 10/28 대표 "견적 텍스트 견적요청으로"
const FL = { data: null, err: '', at: 0, loading: false, cur: '배차 요청', day: '', sel: '', links: {}, gwait: 0 };
let ctx = { rerender: () => {}, openFrame: () => {} };

export function load(force) {
  if (FL.loading || (!force && Date.now() - FL.at < 60000)) return;
  FL.loading = true; FL.at = Date.now();
  S.getFlowBoard().then((d) => { FL.data = d; FL.err = ''; }).catch((e) => { FL.err = e.message; })
    .finally(() => { FL.loading = false; ctx.rerender(); });
}
export function setGwait(n) { FL.gwait = n || 0; }

const rowsOf = (k) => (FL.data ? FL.data.rows : []).filter((r) => r.steps.includes(k));
const countOf = (k) => (k === '전표' ? rowsOf('입력 누락').length
  : ['명세표', '입금'].includes(k) ? 0 : rowsOf(k).length);
const hotOf = (k) => (k === '전표' ? rowsOf('입력 누락').length > 0 : rowsOf(k).some((r) => r.late || r.day === (FL.data || {}).today));
const title = (r) => `${esc(r.partner)} · ${r.site ? esc(r.site) : '<span class="fl-q">현장 확인</span>'}${r.boss ? ` · ${esc(r.boss)}` : ''}`;
const md = (d) => { const m = /^(\d{2})\/(\d{2})$/.exec(d || ''); return m ? `${m[1]}/${m[2]}` : ''; };
const tmr = () => { const x = new Date(Date.now() + 864e5); return `${String(x.getMonth() + 1).padStart(2, '0')}/${String(x.getDate()).padStart(2, '0')}`; };
const dayLab = (r) => { const t = (FL.data || {}).today; if (r.day === t) return '오늘'; if (r.late) return '지난 날'; if (md(r.day) === tmr()) return '내일'; return r.day === '미정' ? '날짜 미정' : r.day; };
const BTN = { 견적: [['quote', '견적서']], 발주: [['esong', '납품송장']], '배차 요청': [['disp', '배차 요청']], '배차 완료': [['esong', '납품송장']],
  '출고 완료': [['deliv', '납품확인서'], ['approval', '자재승인원']] };

function stepsHtml() {
  return `<nav class="fl-steps" aria-label="단계">${STEPS.map((k) => `<button type="button" class="fl-st ${FL.cur === k ? 'on' : ''} ${hotOf(k) ? 'hot' : ''}" data-fl="step" data-k="${k}">
    <i>${IC[k]}</i>${LABEL[k] || k}<b>${['명세표', '입금'].includes(k) ? '' : countOf(k)}</b></button>`).join('')}</nav>`;
}
function rowHtml(r) {
  const btns = (BTN[FL.cur] || []).map(([a, t], i) => `<button type="button" class="${i ? 'fl-gh' : 'fl-go'}" data-fl="${a}" data-no="${esc(r.no)}">${t}</button>`).join('');
  const asked = FL.cur === '배차 요청' && S.getShipments().find((s) => String(s.note || '').includes(`출고 흐름 ${r.no})`));
  const chips = [asked ? `<span class="fl-chip blu">요청함 ${esc((String(asked.note).match(/요청함 (\d\d:\d\d)/) || ['', ''])[1])}</span>` : '', r.late && FL.cur === '배차 요청' ? '<span class="fl-chip no">누락</span>' : '', FL.cur === '배차 완료' && !r.driver ? '<span class="fl-chip amb">기사·운임 확인</span>' : ''].join('');
  const route = `${esc(r.from || '상차지 확인')} → ${esc(r.site || '하차지 확인')}`;
  return `<div class="fl-row ${FL.sel === r.no ? 'sel' : ''}" data-fl="row" data-no="${esc(r.no)}">
    <div class="fl-c fl-tm ${r.late || r.day === FL.data.today ? 'now' : ''}"><b>${esc(r.time || (r.day === '미정' ? '미정' : '시간 미정'))}</b><span>${esc(r.day)}</span></div>
    <div class="fl-c fl-nm">${title(r)}</div>
    <div class="fl-c fl-ds">${chips}${esc(r.item)}</div>
    <div class="fl-c fl-ds fl-rt">${route}</div>
    <div class="fl-c fl-ds fl-v">${esc(r.size || '')}</div>
    <div class="fl-acts">${btns}</div></div>${FL.sel === r.no ? detailHtml(r) : ''}`;
}
function detailHtml(r) {
  const buys = (r.buys || []).filter((b) => b.name).map((b) => `<div class="fl-k">${esc(b.name)}</div><div class="fl-it">${esc(b.item)}</div>`).join('');
  return `<div class="fl-det">
    ${r.why ? `<div class="fl-why">${esc(r.why)}</div>` : ''}
    ${buys || `<div class="fl-it">${esc(r.items)}</div>`}
    ${r.veh ? `<div class="fl-k">차량</div><div class="fl-it">${esc(r.veh)}</div>` : ''}
    <div class="fl-k">전표</div><div>${linesHtml(r)}</div></div>`;
}
function linesHtml(r) {
  return (r.lines || []).map((l) => {
    const has = l.st === '입력' && l.slips && l.slips.some((s) => FL.links[s]);
    const st = l.st === '입력' ? `<button type="button" class="fl-in ok" data-fl="pdf" data-s="${esc((l.slips || []).join(','))}">입력${has ? ' ›' : ''}</button>`
      : `<span class="fl-in ${l.st === '미입력' ? 'no' : 'na'}">${esc(l.st)}</span>`;
    return `<div class="fl-ln"><span class="fl-lk">${esc(l.k)}</span><span class="fl-c">${esc(l.who)}</span><span class="fl-by">${esc(l.by || '')}</span>${st}</div>`;
  }).join('');
}
function evHtml(r) {
  return `<div class="fl-ev"><div class="fl-eh"><b>${title(r)}</b><span>${esc(r.day)}</span></div>${linesHtml(r)}</div>`;
}
function listHtml() {
  if (FL.err) return `<div class="fl-empty">${esc(FL.err)}</div>`;
  if (!FL.data) return '<div class="fl-empty">불러오는 중…</div>';
  if (FL.cur === '입금') return '<div class="fl-empty">준비 중</div>';
  if (FL.cur === '명세표') return `<div class="fl-links"><a class="fl-go" href="/gonggan/">공간 협업툴</a><a class="fl-go" href="/newhousing/">뉴하우징 협업툴</a><button type="button" class="fl-gh" data-fl="stmt">거래명세표</button></div>`;
  if (FL.cur === '전표') {   // 날짜마다 — 그날 건은 그날 다 입력 (10/28 대표). 올릴 전표는 공간 협업툴에서
    const all = [...rowsOf('입력 누락'), ...rowsOf('입력 완료')];
    const days = [...new Set(all.map((r) => r.day))].sort().reverse();
    if (!days.length) return '<div class="fl-empty">없어요</div>';
    if (!days.includes(FL.day)) FL.day = days[0];
    const t = FL.data.today, lab = (d) => (d === t ? '오늘' : d);
    const tabs = `<div class="fl-sub fl-days">${days.slice(0, 14).map((d) => { const n = all.filter((r) => r.day === d && r.steps.includes('입력 누락')).length;
      return `<button type="button" class="fl-sb ${n ? 'no' : 'ok'} ${FL.day === d ? 'on' : ''}" data-fl="day" data-k="${esc(d)}">${esc(lab(d))}${n ? `<b>${n}</b>` : ' ✓'}</button>`; }).join('')}</div>`;
    const miss = all.filter((r) => r.day === FL.day && r.steps.includes('입력 누락')), ok = all.filter((r) => r.day === FL.day && r.steps.includes('입력 완료'));
    return tabs + (miss.length ? `<div class="fl-day no">입력 누락 ${miss.length}</div>${miss.map(evHtml).join('')}` : '')
      + (ok.length ? `<div class="fl-day ok">입력 완료 ${ok.length}</div>${ok.map(evHtml).join('')}` : '');
  }
  const rows = rowsOf(FL.cur);
  if (!rows.length) return '<div class="fl-empty">없어요</div>';
  let h = `<div class="fl-lh"><span>${FL.cur === '견적' ? '언제까지' : '도착'}</span><span>판매처 · 현장</span><span>품목</span><span>상차 → 하차</span><span>차량</span><span></span></div>`, last = null;
  rows.forEach((r) => { const g = dayLab(r); if (g !== last) { h += `<div class="fl-day">${esc(g)}</div>`; last = g; } h += rowHtml(r); });
  return h;
}
export function panel() {
  load();
  return `<section class="fl" aria-label="출고 흐름">${stepsHtml()}<div class="fl-list">${listHtml()}</div></section>`;
}

// 전표 PDF 링크 미리 받기 (입력 줄의 전표 번호)
function fetchLinks(r) {
  const want = [...new Set((r.lines || []).flatMap((l) => l.slips || []))].filter((s) => !(s in FL.links));
  if (!want.length) return;
  want.forEach((s) => { FL.links[s] = null; });
  S.getSlipLinks(want).then((m) => { Object.entries(m).forEach(([k, v]) => { FL.links[k] = v; }); ctx.rerender(); }).catch(() => {});
}
// 송장 품목 — 출고일보 품목 글 '판재 124 · 코너 46 · …' 을 줄로
function itemRows(txt) {
  return String(txt || '').replace(/^[^:：]{0,40}[:：]\s*/, '').replace(/@\s*[\d,]+원?/g, '').replace(/\([^)]*\)|\[[^\]]*\]/g, '').split(/\s*·\s*|,\s+|\s+\/\s+/).map((x) => x.trim()).filter(Boolean).slice(0, 30).map((x) => {
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
  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-fl]'); if (!t || !app.querySelector('.fl')) return;
    const a = t.dataset.fl, r = FL.data && FL.data.rows.find((x) => x.no === t.dataset.no);
    if (a !== 'row') e.stopPropagation();
    if (a === 'step') { FL.cur = t.dataset.k; FL.sel = ''; ctx.rerender(); }
    else if (a === 'day') { FL.day = t.dataset.k; ctx.rerender(); }
    else if (a === 'row') { if (e.target.closest('button,a')) return; FL.sel = FL.sel === t.dataset.no ? '' : t.dataset.no; if (FL.sel && r) fetchLinks(r); ctx.rerender(); }
    else if (a === 'disp' && r) ctx.openFrame('배차 요청', dispSrc(r));
    else if (a === 'esong' && r) { FM.preset('esong', { partner: r.partner, site: r.site, ymd: '', items: itemRows(r.items) }); FM.open('esong'); ctx.rerender(); }
    else if (['deliv', 'approval', 'quote', 'stmt'].includes(a)) { FM.open(a === 'stmt' ? '' : a); if (a === 'stmt') ctx.go('stmt'); else ctx.rerender(); }
    else if (a === 'pdf') {
      const slips = (t.dataset.s || '').split(',').filter(Boolean), hit = slips.flatMap((s) => FL.links[s] || [])[0];
      if (hit) window.open(`https://drive.google.com/file/d/${encodeURIComponent(hit.drive_id)}/view`, '_blank', 'noopener');
      else if (slips.length) copyText(slips.join(' ')).then(() => alert(`전표 PDF가 아직 안 올라왔어요 — 전표 번호 ${slips.join(', ')} 복사함`));
    }
  });
}
