// 첫 화면 맨 위 '출고 흐름' (10/28 대표 "배차 뭐뭐 해야 하는지 간편하게") — 목업 https://claude.ai/artifact/4boELHQ3xhPF3WmLSqFXEt
// 맥 도우미 flow_board.py 가 출고일보 줄을 출고 건(출고번호)마다 단계로 나눠 site_inbox 'flow:board' 에 올림 → 여기선 읽기만.
// 버튼은 있는 화면을 그 건 값으로 엶: 배차 요청(/homt) · 전자 송장 · 납품확인서 · 자재승인원 · 견적서 · 공간 올릴 전표
import * as S from './store-supabase.js?v=11';
import * as FM from './forms.js?v=22';

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
const STEPS = ['견적', '발주', '배차 요청', '배차 완료', '출고 완료', '전표'];   // 전표 = 오늘 전표 확인 (10/28 대표 "오늘 마감에 전표 확인도")   // 전표는 사이드바 '전표 확인'으로 (10/28 대표)
const LABEL = { 견적: '견적 요청', 전표: '최종 마감' };   // 10/28 대표 "견적 텍스트 견적요청으로"
const FL = { marks: {}, data: null, err: '', at: 0, loading: false, cur: '배차 요청', view: 'flow', day: '', sel: '', links: {}, gwait: 0, acts: {} };
let ctx = { rerender: () => {}, openFrame: () => {} };

export function load(force) {
  if (FL.loading || (!force && Date.now() - FL.at < 60000)) return;
  FL.loading = true; FL.at = Date.now();
  S.getFlowMarks().then((m) => { FL.marks = m; ctx.rerender(); }).catch(() => {});
  S.getFlowBoard().then((d) => { FL.data = d; FL.err = ''; }).catch((e) => { FL.err = e.message; })
    .finally(() => { FL.loading = false; ctx.rerender(); });
}
export function setGwait(n) { FL.gwait = n || 0; }

const tkey = (t) => {   // 같은 날 안에서 도착 이른 것 먼저, 시간 미정은 맨 아래 (10/28 대표)
  const m = String(t || '').match(/(\d{1,2})(?::(\d\d))?\s*시?/);
  if (m) return +m[1] * 60 + (+m[2] || 0) + (/오후/.test(t) && +m[1] < 12 ? 720 : 0);
  return /새벽/.test(t) ? 300 : /아침|오전/.test(t) ? 540 : /점심|정오/.test(t) ? 720 : /오후/.test(t) ? 840 : /저녁/.test(t) ? 1080 : 9999; };
const rowsOf = (k) => (FL.data ? FL.data.rows : []).filter((r) => r.steps.includes(k));
const TODAY_ONLY = ['배차 요청', '배차 완료', '출고 완료'];   // 오늘 마감 — 오늘 건만 (10/28 대표). 견적 요청·발주는 날짜가 앞이라 다
const dueToday = (r) => { const t = (FL.data || {}).today || '', d = t.replace(/^0/, '');   // 견적 — 오늘까지 보내야 하는 것 (10/28 대표)
  const txt = `${r.time} ${r.item} ${r.memo || ''}`; return r.day === t || new RegExp(`(^|[^\\d/])(${t}|${d})(?![\\d/])`).test(txt); };   // '오늘' 글자는 옛 메모에도 있어서 오늘 날짜가 적힌 것만
const NOBAR = ['명세표', '입금', '전표'];
const barOn = (k) => !NOBAR.includes(k) && (FL.view !== 'flow' || FL.all);   // 전체보기·사이드바 목록 — 검색·거래처·기간 (10/29 대표)
const rqOf = (k) => ((FL.rqs = FL.rqs || {})[k] = FL.rqs[k] || {});
const filt = (rs, k) => {
  const q = rqOf(k), w = String(q.q || '').trim().toLowerCase(), mdOf = (d) => (d ? +d.slice(5, 7) * 100 + +d.slice(8, 10) : null), a = mdOf(q.from), b = mdOf(q.to);
  const ps = Array.isArray(q.p) ? q.p : [];
  return rs.filter((r) => (!ps.length || ps.includes(r.partner)) && (a == null || (r.md ?? 0) >= a) && (b == null || (r.md ?? 9999) <= b)
    && (!w || `${r.partner} ${r.site_full} ${r.site} ${r.boss} ${r.item} ${r.items} ${r.from} ${r.veh} ${r.memo} ${r.no} ${(r.lines || []).flatMap((l) => l.slips || []).join(' ')}`.toLowerCase().includes(w)));
};
const baseOf = (k) => (k === '기록' ? rowsOf('기록') : k === '입력 완료' ? (FL.data ? FL.data.rows.filter((r) => (r.lines || []).length && (slipOk(r) || (r.steps.includes('입력 완료') && !slipTodo().includes(r)))) : []) : FL.all || FL.view === '견적' ? rowsOf(k) : TODAY_ONLY.includes(k) ? rowsOf(k).filter((r) => [r.day, r.arr].includes((FL.data || {}).today) || (k !== '출고 완료' && [md(r.day), r.arr].includes(tmr()))) : k === '견적' ? rowsOf(k).filter(dueToday) : rowsOf(k));
const listOf = (k) => (barOn(k) ? filt(baseOf(k), k) : baseOf(k));
const yst = () => { const x = new Date(Date.now() - 864e5); return `${String(x.getMonth() + 1).padStart(2, '0')}/${String(x.getDate()).padStart(2, '0')}`; };
const slipOk = (r) => !!FL.marks[`slipok:${r.case || r.no}`];   // 전표 확인 체크 → 입력 완료로 (10/28 대표)
const SHIP = ['배차 완료', '출고 완료', '기록', '입력 누락', '입력 완료'];
const slipTodo = () => (FL.data ? FL.data.rows.filter((r) => [yst(), (FL.data || {}).today, tmr()].includes(r.day) && r.steps.some((k) => SHIP.includes(k)) && allIn(r) && !slipOk(r)) : []);   // 어제·오늘·내일 배차된 건 중 사건 전체가 다 입력된 것
const countOf = (k) => (k === '전표' ? slipTodo().length
  : ['명세표', '입금'].includes(k) ? 0 : listOf(k).length);
const hotOf = (k) => (k === '전표' ? slipTodo().length > 0 : TODAY_ONLY.includes(k) && listOf(k).length > 0);
const title = (r) => `${esc(r.partner)} · ${r.site ? esc(r.site) : '<span class="fl-q">현장 확인</span>'}${r.boss ? ` · ${esc(r.boss)}` : ''}`;
const ioHtml = (r) => {   // 리스트에서 판매·구매·운반비 입력됐는지 바로 (10/28 대표)
  const seen = {}, na = {};
  (r.lines || []).forEach((l) => { const k = l.k === '반품' ? '판매' : l.k; const v = l.st === '입력' ? 2 : l.st === '—' ? 0 : 1; seen[k] = seen[k] === 1 || v === 1 ? 1 : Math.max(seen[k] ?? 0, v); if (l.na) na[k] = l.na; });   // 하나라도 안 됐으면 ✕ · na = 착불 (10/28 대표 "필요없음은 착불이라고")
  const ks = ['판매', '구매', '운반비'].filter((k) => k in seen);
  const sl = (k) => [...new Set((r.lines || []).filter((l) => (l.k === '반품' ? '판매' : l.k) === k && l.st === '입력').flatMap((l) => l.slips || []))];
  return ks.length ? `<div class="fl-io">${ks.map((k) => (seen[k] === 2 && sl(k).length   // 초록 = 누르면 그 전표 PDF (10/28 대표)
    ? `<button type="button" class="ok" data-fl="pdf" data-k="${k === '판매' ? '판매' : '구매'}" data-s="${esc(sl(k).join(','))}">${k} ✓</button>`
    : `<span class="${['na', 'no', 'ok'][seen[k]]}">${k}${seen[k] === 2 ? ' ✓' : seen[k] === 1 ? ' ✕' : ` ${na[k] || '—'}`}</span>`)).join('')}${plHtml(r)}</div>` : '';
};
const won = (n) => `${Math.round(n).toLocaleString()}원`;
const plHtml = (r) => (r.pl ? `<span class="fl-pl ${r.pl.net < 0 ? 'no' : ''}" title="판매 ${won(r.pl.sale)} − 구매 ${won(r.pl.buy)} − 운반비 ${won(r.pl.fare)} (공급가)">순이익 ${won(r.pl.net)} · ${r.pl.sale ? Math.round((100 * r.pl.net) / r.pl.sale) : 0}%</span>` : '');   // 판매·구매·운반비 다 들어간 건 (10/28 대표)
const allIn1 = (r) => (r.lines || []).length > 0 && r.lines.every((l) => l.st === '입력' || l.st === '—');
const caseRows = (r) => (r.case && FL.data ? FL.data.rows.filter((x) => x.case === r.case) : [r]);   // 같은 사건 (나중에 보낸 누락분도 같이)
const allIn = (r) => caseRows(r).every(allIn1);   // 사건 전체 판매·구매·운반비 다 들어감
const cmpBtn = (r) => (allIn(r) && (r.lines || []).some((l) => l.st === '입력' && (l.slips || []).length) ? `<button type="button" class="fl-gh sm" data-fl="cmp" data-no="${esc(r.no)}">대조</button>` : '');
const md = (d) => { const m = /^(\d{2})\/(\d{2})$/.exec(d || ''); return m ? `${m[1]}/${m[2]}` : ''; };
const tmr = () => { const x = new Date(Date.now() + 864e5); return `${String(x.getMonth() + 1).padStart(2, '0')}/${String(x.getDate()).padStart(2, '0')}`; };
const dday = (r) => (TODAY_ONLY.includes(FL.cur) && r.arr) || r.day;   // 배차·출고 목록은 도착 날로 묶음 (상차 오늘 → 내일 8시 착, 10/28 대표)
const mdN = (d) => { const m = /^(\d{2})\/(\d{2})$/.exec(d || ''); return m ? +m[1] * 100 + +m[2] : 9999; };
const dayLab = (r0) => { const t = (FL.data || {}).today, r = { ...r0, day: dday(r0) }; if (r.day === t) return '오늘'; if (r.late) return '지난 날'; if (md(r.day) === tmr()) return '내일'; if (r.day === yst()) return '어제'; return r.day === '미정' ? '날짜 미정' : r.day; };
const BTN = { 견적: [['quote', '견적서']], 발주: [['esong', '전자 송장']], '배차 요청': [['disp', '배차 요청'], ['dispok', '배차 완료'], ['esong', '전자 송장']], '배차 완료': [['shipok', '출고 완료'], ['esong', '전자 송장']],
  '출고 완료': [['deliv', '납품확인서'], ['approval', '자재승인원'], ['esong', '전자 송장']] };
BTN['기록'] = [...BTN['출고 완료'], ['cmp', '대조']];
BTN['입력 완료'] = [['cmp', '대조']];
BTN['전표'] = [['cmp', '대조']];   // 입력 완료 — 한 줄씩 리스트, [대조] (10/28 대표)

const ask = (t, msg) => {   // 키오스크 가로(iframe)는 confirm 창이 안 떠서 — 한 번 더 누르면 실행 (10/30 대표 "배차완료 눌렀는데 안 돼")
  if (!document.body.classList.contains('hm-wall')) return confirm(msg);
  if (t.dataset.arm && Date.now() - +t.dataset.arm < 5000) { delete t.dataset.arm; t.classList.remove('arm'); return true; }
  const o = t.dataset.lab || t.textContent; t.dataset.lab = o; t.dataset.arm = String(Date.now()); t.textContent = `${o} 한 번 더`; t.classList.add('arm');
  setTimeout(() => { if (t.dataset.arm) { delete t.dataset.arm; t.classList.remove('arm'); t.textContent = o; } }, 5000);
  return false;
};
const memoHtml = (r) => {   // 참고 메모 — [날짜 누가] 단위로 한 덩어리, 지금 전표에 없는 번호(고쳐서 다시 넣은 옛 번호)는 줄 긋기 (10/30 대표)
  const cur = new Set((r.lines || []).flatMap((l) => l.slips || []).map((x) => `${x.slice(4, 6)}/${x.slice(6, 8)}-${x.split('-')[1]}`));
  return String(r.memo || '').split(/\s*·\s*(?=\[)/).map((t) => t.trim()).filter(Boolean).map((t) => {
    const m = t.match(/^\[([^\]]+)\]\s*([\s\S]*)$/), h = m ? m[1] : '', body = esc(m ? m[2] : t).replace(/\s·\s/g, '<br>')
      .replace(/(\d\d\/\d\d-\d+)/g, (x) => (cur.size && !cur.has(x) ? `<s title="이카운트에 없는 옛 전표 번호">${x}</s>` : x));
    return `<div class="fl-mm">${h ? `<div class="fl-mh">${esc(h)}</div>` : ''}<div>${body}</div></div>`;
  }).join('');
};
function stepsHtml() {
  return `<nav class="fl-steps" aria-label="단계">${STEPS.map((k) => `<button type="button" class="fl-st ${FL.cur === k ? 'on' : ''} ${hotOf(k) ? 'hot' : ''}" data-fl="step" data-k="${k}">
    <i>${IC[k]}</i>${LABEL[k] || k}<b>${['명세표', '입금'].includes(k) ? '' : countOf(k)}</b></button>`).join('')}</nav>`;
}
const STMT_STEPS = ['배차 완료', '출고 완료', '기록', '입력 누락', '입력 완료', '전표'];
const DATE_FIRST = ['기록', '입력 누락', '입력 완료', '전표'];   // 날짜를 왼쪽에 진하게 (10/29 대표, 최종 마감 = 출고 날짜)
const saleSlips = (r) => [...new Set((r.lines || []).filter((l) => l.k === '판매' && l.st === '입력').flatMap((l) => l.slips || []))];
function stmtHtml(r) {   // 거래명세표 — 판매전표 PDF 보기 · 전달했는지 (10/28 대표)
  const sl = saleSlips(r);
  if (!sl.length) return '';
  const mk = FL.marks[`sent:${r.no}`];
  return `<span class="fl-stm"><button type="button" class="fl-in ok" data-fl="pdf" data-k="판매" data-s="${esc(sl.join(','))}">명세표 ›</button><button type="button" class="fl-gh" data-fl="stmtgo" data-no="${esc(r.no)}" data-s="${esc(sl.join(','))}">변환</button>
    ${mk ? `<span class="fl-sent on" title="전달 ${esc(String(mk.created_at || '').slice(5, 10).replace('-', '/'))}"><i>✓</i>거래처 전달</span>` : `<button type="button" class="fl-sent" data-fl="sent" data-no="${esc(r.no)}"><i></i>거래처 전달</button>`}</span>`;
}
function rowHtml(r) {
  const btns = (BTN[FL.cur] || []).filter(([a]) => a !== 'cmp' || allIn(r)).map(([a, t], i) => `<button type="button" class="${i ? 'fl-gh' : 'fl-go'}" data-fl="${a}" data-no="${esc(r.no)}">${t}</button>`).join('');
  const asked = FL.cur === '배차 요청' && S.getShipments().find((s) => String(s.note || '').includes(`출고 흐름 ${r.no})`));
  const cn = caseRows(r).length;
  const chips = [FL.cur === '입력 완료' && slipOk(r) ? '<span class="fl-chip ok">마감 확인</span>' : '', ...(r.imgs || []).map((x) => `<button type="button" class="fl-chip blu" data-fl="img" data-id="${esc(x.id)}" data-n="${esc(x.name)}">사진</button>`), cn > 1 ? `<span class="fl-chip blu">같은 주문 ${cn}건</span>` : '', (() => { const L = caseRows(r).flatMap((x) => x.miss || []).reduce((a, m) => a + Math.max(0, mLeft(m, Object.fromEntries((FL.data ? FL.data.rows : []).map((x) => [x.no, x])))), 0); return L > 0 ? `<span class="fl-chip no">누락 남음 ${L.toLocaleString()}</span>` : ''; })(), ...(r.chips || []).map((c) => `<span class="fl-chip amb">${esc(c)}</span>`), asked ? `<span class="fl-chip blu">요청함 ${esc((String(asked.note).match(/요청함 (\d\d:\d\d)/) || ['', ''])[1])}</span>` : '', r.late && FL.cur === '배차 요청' ? '<span class="fl-chip no">누락</span>' : '', FL.cur === '배차 완료' && !r.driver ? '<span class="fl-chip amb">기사·운임 확인</span>' : ''].join('');
  const route = FL.cur === '견적' ? '' : `${esc(r.from || '상차지 확인')} → ${esc(r.site || '하차지 확인')}`;
  return `<div class="fl-row ${FL.sel === r.no ? 'sel' : ''}" data-fl="row" data-no="${esc(r.no)}">
    <div class="fl-c fl-tm ${r.late || dday(r) === FL.data.today ? 'now' : ''}">${(DATE_FIRST.includes(FL.cur) || ['배차 완료', '출고 완료'].includes(FL.cur)) ? `<b>${esc(dday(r))}</b><span>${esc(r.time || '')}</span>` : `<b>${esc(r.time || (r.day === '미정' ? '미정' : '시간 미정'))}</b><span>${esc(dday(r))}</span>`}</div>
    <div class="fl-c fl-nm"><div class="fl-nmt">${title(r)}</div>${STMT_STEPS.includes(FL.cur) ? ioHtml(r) : ''}</div>
    <div class="fl-c fl-ds">${chips}${esc(r.item)}</div>
    <div class="fl-c fl-ds fl-rt">${route}</div>
    <div class="fl-c fl-ds fl-v">${FL.cur === '견적' ? '' : esc(r.size || '')}</div>
    <div class="fl-acts">${STMT_STEPS.includes(FL.cur) ? stmtHtml(r) : ''}${btns}${FL.cur === '전표' ? `<button type="button" class="fl-sent" data-fl="slipok" data-no="${esc(r.no)}"><i></i>입력 확인</button>` : ''}</div></div>${FL.sel === r.no ? detailHtml(r) : ''}`;
}
const stLab = (x) => (x.steps.includes('출고 완료') || x.steps.includes('기록') ? '출고 완료' : x.steps.includes('배차 완료') ? '배차 완료' : x.steps.includes('배차 요청') ? '배차 요청' : x.steps.includes('발주') ? '발주' : x.steps[0] || '');
const mGone = (t, by) => by[t.no] && ['출고 완료', '배차 완료'].includes(stLab(by[t.no]));   // 차가 잡힌 것만 보낸 걸로
const mLeft = (m, by) => m.need - m.sent.filter((t) => mGone(t, by)).reduce((a, t) => a + t.q, 0);
function caseHtml(r) {   // 같은 주문 — 처음 보낸 것·누락분 2차·3차, 누락 남은 것 (10/29 대표)
  const cs = caseRows(r).slice().sort((a, b) => (a.md || 9999) - (b.md || 9999) || String(a.no).localeCompare(String(b.no)));
  const ms = cs.flatMap((x) => x.miss || []);
  if (cs.length < 2 && !ms.length) return '';
  const nth = (i) => (i ? `${i + 1}차` : '처음');
  const rows = cs.map((x, i) => `<div class="fl-cs ${x.no === r.no ? 'me' : ''}"><b>${esc(x.day)}</b><span class="fl-csn">${nth(i)}</span><span class="fl-csi">${esc(x.item || x.items || '')}</span><span class="fl-css">${esc(stLab(x))}</span></div>`).join('');
  const miss = [...new Set(cs.flatMap((x) => String(x.memo || '').split(/\s+·\s+/)).filter((t) => /누락|빠짐|덜\s?감|추가로 보낼|더 보내/.test(t)).map((t) => t.trim()))].slice(0, 6);
  const by = Object.fromEntries((FL.data ? FL.data.rows : []).map((x) => [x.no, x])), q = (n) => `${Number(n).toLocaleString()}`;
  const gone = (t) => mGone(t, by), lf = (m) => mLeft(m, by);
  const mq = ms.map((m) => `<div class="fl-ms"><b>${esc(m.item)}</b><span>빠짐 ${q(m.need)}${esc(m.unit)}</span>${m.sent.map((t) => `<span class="fl-msd">${esc(t.day || '')} ${q(t.q)} ${gone(t) ? '보냄' : '보낼 것'} · ${esc(by[t.no] ? stLab(by[t.no]) : '')}</span>`).join('')}<em class="${lf(m) > 0 ? 'no' : 'ok'}">${lf(m) > 0 ? `남음 ${q(lf(m))}${esc(m.unit)}` : '다 보냄'}</em></div>`).join('');
  return `${cs.length > 1 ? `<div class="fl-k">같은 주문 ${cs.length}건</div><div class="fl-csl">${rows}</div>` : ''}${mq ? `<div class="fl-k">누락</div><div class="fl-csl">${mq}</div>` : miss.length ? `<div class="fl-k">누락</div><div class="fl-it">${miss.map((t) => `<div>${esc(t)}</div>`).join('')}</div>` : ''}`;
}
function detailHtml(r) {
  const buys = (r.buys || []).filter((b) => b.name).map((b) => `<div class="fl-k">${esc(b.name)}</div><div class="fl-it">${esc(b.item)}</div>`).join('');
  return `<div class="fl-det">
    ${r.why ? `<div class="fl-why">${esc(r.why)}</div>` : ''}
    ${r.no.startsWith('Q') ? '' : `<div class="fl-k">상차 → 하차</div><div class="fl-it"><b>${esc(r.from || '상차지 확인')}</b> → <b>${esc(r.site_full || r.site || '하차지 확인')}</b></div>`}
    ${buys || `<div class="fl-it">${esc(r.items)}</div>`}
    ${r.veh ? `<div class="fl-k">차량</div><div class="fl-it">${esc(r.veh)}</div>` : ''}
    ${r.memo ? `<div class="fl-k">메모</div><div class="fl-it fl-memo">${memoHtml(r)}</div>` : ''}
    ${caseHtml(r)}
    <div class="fl-k">전표</div><div>${linesHtml(r)}</div>
    ${r.pl ? `<div class="fl-k">순이익</div><div class="fl-pld"><span>판매 ${won(r.pl.sale)}</span><i>−</i><span>구매 ${won(r.pl.buy)}</span><i>−</i><span>운반비 ${won(r.pl.fare)}</span><i>=</i><b class="${r.pl.net < 0 ? 'no' : ''}">${won(r.pl.net)}</b><em>${r.pl.sale ? Math.round((100 * r.pl.net) / r.pl.sale) : 0}% · 공급가</em></div>` : ''}
    ${(r.ev || []).length ? `<div class="fl-k">근거</div><div class="fl-memo">${evLinks(r.ev)}</div>` : ''}
    ${(r.imgs || []).length ? `<div class="fl-k">사진</div><div class="fl-imgs">${r.imgs.map((x) => `<iframe src="https://drive.google.com/file/d/${encodeURIComponent(x.id)}/preview" title="${esc(x.name)}" loading="lazy"></iframe>`).join('')}</div>` : ''}</div>`;   // 견적 요청 사진 — 펼치면 바로 (10/28 대표)
}
function linesHtml(r) {
  return (r.lines || []).map((l) => {
    const kk = l.k === '판매' ? '판매' : '구매', has = l.st === '입력' && l.slips && l.slips.some((s) => (FL.links[s] || []).some((x) => !x.kind || x.kind === kk));
    const st = l.st === '입력' ? `<button type="button" class="fl-in ok" data-fl="pdf" data-k="${l.k === '판매' ? '판매' : '구매'}" data-s="${esc((l.slips || []).join(','))}">입력${has ? ' ›' : ''}</button>`
      : `<span class="fl-in ${l.st === '미입력' || l.st === '누락' ? 'no' : 'na'}">${esc(l.st)}</span>`;
    const nos = (l.slips || []).map((x) => x.replace(/^\d{4}(\d\d)(\d\d)-/, '$1/$2-')).join(' · ');   // 전표 번호 · 운반비는 어디서 어디·금액 (10/28 대표)
    const info = [l.route ? `<span class="fl-lr">${esc(l.route)}</span>` : '', l.amt ? `<b class="fl-la">${Number(l.amt).toLocaleString()}원</b>` : '', nos ? `<span class="fl-lno">${esc(nos)}</span>` : ''].join('');
    return `<div class="fl-ln"><span class="fl-lk">${esc(l.k)}</span><span class="fl-c">${esc(l.who)}${info}</span><span class="fl-by">${esc(l.by || '')}</span>${st}</div>`;
  }).join('');
}
const evLinks = (es) => (es || []).map((e) => (e.u ? `<a class="fl-evl" href="${esc(e.u)}" target="_blank" rel="noopener">${esc(e.t)}</a>`
  : `<button type="button" class="fl-evl ${/^카톡/.test(e.t) ? 'k' : 'm'}" data-fl="evx" data-x="${esc(e.x || e.t)}">${esc(e.t)}</button>`)).join('');   // 카톡·문자는 출고일보 원문 시트 글 (10/28 대표 "톡·문자도")
function evHtml(r) {
  const ev = evLinks(r.ev);
  return `<div class="fl-ev"><div class="fl-eh"><b>${title(r)}</b>${plHtml(r)}${cmpBtn(r)}<span>${esc(r.day)}</span></div>${linesHtml(r)}${r.memo || ev ? `<div class="fl-memo">${r.memo ? `<span>${esc(r.memo)}</span>` : ''}${ev}</div>` : ''}</div>`;
}
function listHtml() {
  if (FL.err) return `<div class="fl-empty">${esc(FL.err)}</div>`;
  if (!FL.data) return '<div class="fl-empty">불러오는 중…</div>';
  if (FL.cur === '입금') return '<div class="fl-empty">준비 중</div>';
  if (FL.cur === '명세표') return `<div class="fl-links"><a class="fl-go" href="/gonggan/">공간 협업툴</a><a class="fl-go" href="/newhousing/">뉴하우징 협업툴</a><button type="button" class="fl-gh" data-fl="stmt">거래명세표</button></div>`;
  if (FL.cur === '전표') {   // 어제·오늘·내일 배차 건 중 다 입력된 사건만 — [대조] 후 체크하면 입력 완료로 (10/28 대표)
    const rs = slipTodo().sort((a, b) => ((a.md ?? 0) - (b.md ?? 0)) || (tkey(a.time) - tkey(b.time)));
    if (!rs.length) return '<div class="fl-empty">없어요</div>';
    setTimeout(fitActs, 0);
    let h = `<div class="fl-lh"><span>도착</span><span>판매처 · 현장</span><span>품목</span><span>상차 → 하차</span><span>차량</span><span></span></div>`, last = null;
    rs.forEach((r) => { const g = dayLab(r); if (g !== last) { h += `<div class="fl-day">${esc(g)}</div>`; last = g; } h += rowHtml(r); });
    const pls = rs.filter((r) => r.pl), net = pls.reduce((a, r) => a + r.pl.net, 0), sale = pls.reduce((a, r) => a + r.pl.sale, 0);   // 하단 총 순이익 (10/28 대표)
    if (pls.length) h += `<div class="fl-tot"><span>총 순이익</span><b class="${net < 0 ? 'no' : ''}">${won(net)}</b><em>${sale ? Math.round((100 * net) / sale) : 0}% · ${pls.length}건${pls.length < rs.length ? ` (순이익 못 낸 ${rs.length - pls.length}건 빼고)` : ''}</em></div>`;
    return h;
  }
  const rows = listOf(FL.cur).map((r, i) => [r, i]).sort((a, b) => (mdN(dday(a[0])) - mdN(dday(b[0]))) || (tkey(a[0].time) - tkey(b[0].time)) || (a[1] - b[1])).map((x) => x[0]);
  if (DATE_FIRST.includes(FL.cur)) rows.reverse();   // 최근 것 먼저
  if (!rows.length) return '<div class="fl-empty">없어요</div>';
  setTimeout(fitActs, 0);
  let h = `<div class="fl-lh"><span>${FL.cur === '견적' ? '언제까지' : '도착'}</span><span>판매처 · 현장</span><span>품목</span><span>${FL.cur === '견적' ? '' : '상차 → 하차'}</span><span>${FL.cur === '견적' ? '' : '차량'}</span><span></span></div>`, last = null;
  rows.forEach((r) => { const g = dayLab(r); if (g !== last) { h += `<div class="fl-day">${esc(g)}</div>`; last = g; } h += rowHtml(r); });
  return h;
}
function fitActs() {
  const L = document.querySelector('.fl-list');
  if (!L) return;
  const w = Math.max(0, ...[...L.querySelectorAll('.fl-row .fl-acts')].map((a) => [...a.children].reduce((s_, c) => s_ + c.getBoundingClientRect().width + 6, 0)));
  if (w && Math.abs(w - (FL.acts[FL.cur] || 0)) > 2) { FL.acts[FL.cur] = Math.ceil(w); L.style.setProperty('--acts', `${FL.acts[FL.cur]}px`); }
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
const pLab = (q) => { const p = Array.isArray(q.p) ? q.p : []; return !p.length ? '거래처 전체' : p.length === 1 ? p[0] : `${p[0]} 외 ${p.length - 1}`; };   // 거래처 여러 곳 고르기 (10/29 대표)
function rqBar(k) {
  const q = rqOf(k), ps = [...new Set(baseOf(k).map((r) => r.partner))].sort((a, b) => a.localeCompare(b, 'ko'));
  const iso = (n) => new Date(Date.now() - n * 864e5 + 9 * 36e5).toISOString().slice(0, 10), tday = iso(0);
  const qk = [['오늘', 0], ['1주', 7], ['1달', 30], ['전체', '']].map(([t, n]) => `<button type="button" class="fl-sb mid ${(n === '' ? !q.from && !q.to : q.from === iso(n) && q.to === tday) ? 'on' : ''}" data-fl="rqp" data-k="${n}">${t}</button>`).join('');
  return `<div class="fl-rq"><input type="search" class="fl-rqi" data-rq="q" placeholder="검색" value="${esc(q.q || '')}">
    <details class="fl-rqp"><summary class="fl-rqps">${esc(pLab(q))}</summary><div class="fl-rqpl"><input type="search" data-rqf="1" placeholder="거래처 찾기">
      ${ps.map((p_) => `<label><input type="checkbox" data-rq="p" value="${esc(p_)}" ${(q.p || []).includes(p_) ? 'checked' : ''}>${esc(p_)}</label>`).join('')}</div></details>
    <input type="date" data-rq="from" value="${esc(q.from || '')}"><span>~</span><input type="date" data-rq="to" value="${esc(q.to || '')}">
    <div class="fl-sub fl-rqk">${qk}</div><b class="fl-rqn">${listOf(k).length}건</b></div>`;
}
const listBox = (k, w) => `${barOn(k) ? rqBar(k) : ''}<div class="fl-list" id="fl-rec" style="--acts:${FL.acts[k] || w}px">${listHtml()}</div>`;
export function main(x) {
  load();

  if (FL.view === '견적') { FL.cur = '견적'; return `<section class="fl"><h1 class="fl-h1">견적 요청</h1>${listBox('견적', 130)}</section>`; }   // 사이드바 견적 요청 — 단계줄 없이 (10/28 대표)
  if (FL.view === '기록') { FL.cur = '기록'; return `<section class="fl"><h1 class="fl-h1">전체 출고</h1>${listBox('기록', 760)}</section>`; }
  if (FL.view === '누락') { FL.cur = '입력 누락'; return `<section class="fl"><h1 class="fl-h1">입력 누락</h1>${listBox('입력 누락', 290)}</section>`; }   // 입력 완료와 같은 줄 모양 (10/29 대표)
  if (FL.view === '완료') { FL.cur = '입력 완료'; return `<section class="fl"><h1 class="fl-h1">입력 완료</h1>${listBox('입력 완료', 300)}</section>`; }
  const tg = `<div class="fl-sub fl-tg"><button type="button" class="fl-sb mid ${FL.all ? '' : 'on'}" data-fl="all" data-k="0">오늘</button><button type="button" class="fl-sb mid ${FL.all ? 'on' : ''}" data-fl="all" data-k="1">전체보기</button></div>`;
  return `<section class="fl" id="fl-list" aria-label="오늘 마감">${tg}${stepsHtml()}${listBox(FL.cur, [0, 130, 240, 350, 460][(BTN[FL.cur] || []).length] + (STMT_STEPS.includes(FL.cur) ? 290 : 0))}</section>`;   // 출고 흐름과 같은 모양, 오늘 건만 (10/28 대표)
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
// 견적서 — 뉴하우징·공간제작소면 세트·키트 고르기, 그 외는 품목 글 그대로 → 견적서 화면이 우리 품목명·종전가로 채움
function closeQ() { const x = document.querySelector('.fl-qov'); if (x) x.remove(); }
function quoteFor(r) {
  const all = (FL.data && FL.data.kits) || {}, kits = /뉴하우징/.test(r.partner) ? all['뉴하우징'] || {} : /공간/.test(r.partner) ? all['공간제작소'] || {} : {};
  const names = Object.keys(kits);
  if (!names.length) { FM.presetQuote(String(r.items || r.item || '').split(/\s*·\s*/).join('\n'), r.partner, r.site); ctx.rerender(); return; }
  FL.qpick = { r, kits }; closeQ();
  const ov = document.createElement('div'); ov.className = 'hm-ov fl-qov';
  ov.innerHTML = `<div class="hm-modal fl-qm" role="dialog" aria-label="견적서"><div class="hm-mh"><b>${esc(r.partner)} 견적서</b><button type="button" class="hm-x" data-fl="qx" aria-label="닫기">✕</button></div>
    ${/공간/.test(r.partner) ? '<label class="fl-qcl">색상<input id="fl-qc" class="fm-in" placeholder="EFX3453"></label>' : ''}
    <div class="fl-qbs">${names.map((n) => `<button type="button" class="fl-go" data-fl="qk" data-k="${esc(n)}">${esc(n)}</button>`).join('')}<button type="button" class="fl-gh" data-fl="qk" data-k="">품목 그대로</button></div></div>`;
  ov.addEventListener('click', (e) => { if (e.target === ov) { FL.qpick = null; closeQ(); } });
  document.body.appendChild(ov);
  ov.addEventListener('click', (e) => { const b = e.target.closest('[data-fl]'); if (b) clickQ(b); });
}
let clickQ = () => {};
export function bind(app, c) {
  ctx = c;
  setInterval(() => { if (document.visibilityState === 'visible' && app.querySelector('.fl')) load(true); }, 60000);   // 열어 둔 채로도 1분마다 새로 (도우미는 출고일보가 바뀌면 5분 안에 올림)
  const onRq = (e) => {
    const t = e.target.closest('[data-rq]'); if (!t || !app.querySelector('.fl')) return;
    const q = rqOf(FL.cur);
    if (t.type === 'checkbox') { const set = new Set(Array.isArray(q.p) ? q.p : []); if (t.checked) set.add(t.value); else set.delete(t.value); q.p = [...set]; const sm = app.querySelector('.fl-rqps'); if (sm) sm.textContent = pLab(q); }
    else q[t.dataset.rq] = t.value;
    const L = document.getElementById('fl-rec'), n = app.querySelector('.fl-rqn');
    if (L) L.innerHTML = listHtml(); if (n) n.textContent = `${listOf(FL.cur).length}건`;
  };
  app.addEventListener('input', onRq);
  document.addEventListener('click', (e) => { const d = document.querySelector('.fl-rqp[open]'); if (d && !d.contains(e.target)) d.open = false; });
  app.addEventListener('input', (e) => { const f = e.target.closest('[data-rqf]'); if (!f) return; const w = f.value.trim().toLowerCase(); f.parentNode.querySelectorAll('label').forEach((l) => { l.style.display = !w || l.textContent.toLowerCase().includes(w) ? '' : 'none'; }); });
  const onClick = (e) => {
    const t = e.target.closest('[data-fl]'); if (!t || (!app.querySelector('.fl') && !t.closest('.fl-qov'))) return;
    const a = t.dataset.fl, r = FL.data && FL.data.rows.find((x) => x.no === t.dataset.no);
    if (a !== 'row') e.stopPropagation();
    if (a === 'rqp') { const q = rqOf(FL.cur), n = t.dataset.k, iso = (d) => new Date(Date.now() - d * 864e5 + 9 * 36e5).toISOString().slice(0, 10); if (n === '') { q.from = ''; q.to = ''; } else { q.from = iso(+n); q.to = iso(0); } FL.sel = ''; ctx.rerender(); }
    else if (a === 'step') { FL.cur = t.dataset.k; FL.sel = ''; ctx.rerender(); }
    else if (a === 'img') {   // 견적 요청 사진
      closeQ(); const ov = document.createElement('div'); ov.className = 'hm-ov fl-qov';
      ov.innerHTML = `<div class="hm-modal fl-cmpm" role="dialog" aria-label="사진"><div class="hm-mh"><b>${esc(t.dataset.n || '사진')}</b><button type="button" class="hm-x" aria-label="닫기">✕</button></div><div class="fl-cmpg"><div class="fl-cmpc"><iframe src="https://drive.google.com/file/d/${encodeURIComponent(t.dataset.id)}/preview" title="사진"></iframe></div></div></div>`;
      ov.addEventListener('click', (ev) => { if (ev.target === ov || ev.target.closest('.hm-x')) ov.remove(); });
      document.body.appendChild(ov);
    }
    else if (a === 'slipok' && r) { const key = `slipok:${r.case || r.no}`, me = ctx.me ? ctx.me() : ''; S.addFlowMark(key, `${r.partner} ${r.site}`, me).then((err) => { if (err) alert('저장 못 했어요 — ' + err); else { FL.marks[key] = { created_at: new Date().toISOString() }; caseRows(r).forEach((x) => S.setShipCase(x.no, { checked: true, checked_by: me || null }, me).catch(() => {})); ctx.rerender(); } }); }
    else if (a === 'sent' && r) { if (!ask(t, `${r.partner} · ${r.site} 거래처 전달 체크할까요?`)) return; S.addFlowMark(`sent:${r.no}`, `${r.partner} ${r.site}`, ctx.me ? ctx.me() : '').then((err) => { if (err) alert('저장 못 했어요 — ' + err); else { FL.marks[`sent:${r.no}`] = { created_at: new Date().toISOString() }; ctx.rerender(); } }); }
    else if (a === 'stmtgo' && r) { FM.presetStmt(/공간/.test(r.partner) ? 'stmt-gong' : 'stmt-etc', (t.dataset.s || '').split(',').join(' '), r.salerows); ctx.rerender(); }
    else if (a === 'evx') {   // 카톡·문자 원문 — 같은 방 앞뒤 대화 (배차안내까지)
      closeQ(); const ov = document.createElement('div'); ov.className = 'hm-ov fl-qov';
      ov.innerHTML = `<div class="hm-modal fl-txm" role="dialog" aria-label="원문"><div class="hm-mh"><b>${esc(t.textContent)}</b><button type="button" class="hm-x" aria-label="닫기">✕</button></div><pre class="fl-tx">${esc(t.dataset.x || '')}</pre></div>`;
      ov.addEventListener('click', (ev) => { if (ev.target === ov || ev.target.closest('.hm-x')) ov.remove(); });
      document.body.appendChild(ov);
    }
    else if (a === 'cmp' && r) {   // 대조 — 구매 거래명세표(원본) · 구매 입력 전표 · 판매 입력 거래명세표 나란히 (10/28 대표)
      const L = caseRows(r).flatMap((x) => x.lines || []).filter((l) => l.st === '입력'), srcs = (FL.data && FL.data.srcs) || {};
      const slipsOf = (f) => [...new Set(L.filter(f).flatMap((l) => l.slips || []))];
      const buy = slipsOf((l) => l.k === '구매'), fare = slipsOf((l) => l.k === '운반비'), sale = slipsOf((l) => l.k === '판매');
      const nm = (s_) => s_.replace(/^\d{4}(\d\d)(\d\d)-/, '$1/$2-');
      const frame = (id, cap) => `<div class="fl-cmpc"><div class="fl-cmph">${cap}</div><iframe src="https://drive.google.com/file/d/${encodeURIComponent(id)}/preview" title="${esc(cap)}" loading="lazy"></iframe></div>`;
      const none = (cap) => `<div class="fl-cmpc na"><div class="fl-cmph">${cap}</div><div class="fl-empty">없음</div></div>`;
      S.getSlipLinks([...new Set([...buy, ...fare, ...sale])]).then((m) => {
        const pdf = (kk, s_) => { const seen = new Set(); return (m[s_] || []).filter((x) => x.kind === kk && !seen.has(x.file || x.slip) && seen.add(x.file || x.slip)).slice(0, 1); };
        const col1 = buy.flatMap((s_) => (srcs[`구매|${s_}`] || []).map((x) => frame(x.id, `<b>구매 거래명세표</b> <span>${esc(nm(s_))}</span>`)));
        const col2 = [...buy, ...fare].flatMap((s_) => pdf('구매', s_).map((x) => frame(x.drive_id, `<b>${fare.includes(s_) && !buy.includes(s_) ? '운반비 전표' : '구매 전표'}</b> <span>${esc(nm(s_))}</span>`)));
        const col3 = sale.flatMap((s_) => pdf('판매', s_).map((x) => frame(x.drive_id, `<b>판매 거래명세표</b> <span>${esc(nm(s_))}</span>`)));
        const g = (cols, cap) => (cols.length ? cols.join('') : none(`<b>${cap}</b>`));
        closeQ(); const ov = document.createElement('div'); ov.className = 'hm-ov fl-qov';
        ov.innerHTML = `<div class="hm-modal fl-cmpm" role="dialog" aria-label="전표 대조"><div class="hm-mh"><b>${title(r)}</b>${plHtml(r)}<button type="button" class="hm-x" aria-label="닫기">✕</button></div>
          <div class="fl-cmpg">${g(col1, '구매 거래명세표')}${g(col2, '구매 전표')}${g(col3, '판매 거래명세표')}</div></div>`;
        ov.addEventListener('click', (ev) => { if (ev.target === ov || ev.target.closest('.hm-x')) ov.remove(); });
        document.body.appendChild(ov);
      }).catch((err) => alert('전표를 못 불러왔어요 — ' + (err.message || err)));
    }
    else if (a === 'all') { FL.all = t.dataset.k === '1'; FL.sel = ''; ctx.rerender(); }
    else if (a === 'old') { FL.old = !FL.old; ctx.rerender(); }
    else if (a === 'go') { const k = t.dataset.k; if (k === 'fare' || k === 'box') ctx.home(k); else if (k.startsWith('v-flow-')) { FL.view = 'flow'; FL.cur = k.slice(7); FL.sel = ''; ctx.rerender(); setTimeout(() => { const el = document.getElementById('fl-list'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 0); } else { FL.view = k.slice(2); ctx.rerender(); } }
    else if (a === 'close') { if (t.classList.contains('on')) alert('오늘 마감했어요'); }
    else if (a === 'row') { if (e.target.closest('button,a')) return; FL.sel = FL.sel === t.dataset.no ? '' : t.dataset.no; if (FL.sel && r) fetchLinks(r); ctx.rerender(); }
    else if (a === 'disp' && r) ctx.openFrame('배차 요청', dispSrc(r));
    else if ((a === 'dispok' || a === 'shipok') && r) {   // 배차 완료·출고 완료 → 운영 DB ship_case (10/29 대표)
      const ok = a === 'dispok', hm = new Date().toTimeString().slice(0, 5);
      if (!ask(t, `${r.partner} · ${r.site} ${ok ? '배차 완료' : '출고 완료'}?`)) return;
      S.setShipCase(r.no, ok ? { disp: `배차 완료 ${hm}` } : { status: '완료' }, ctx.me ? ctx.me() : '', true).then((err) => {
        if (err) { alert('저장 못 했어요 — ' + err); return; }
        r.steps = ok ? r.steps.filter((k) => !['발주', '배차 요청'].includes(k)).concat(r.steps.includes('배차 완료') ? [] : ['배차 완료'])
          : r.steps.filter((k) => !['발주', '배차 요청', '배차 완료'].includes(k)).concat(['출고 완료', '기록'].filter((k) => !r.steps.includes(k)));
        if (ok) r.car = `배차 완료 ${hm}`;
        FL.sel = ''; ctx.rerender();
      }).catch((e2) => alert('저장 못 했어요 — ' + e2));
    }
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
    else if (a === 'quote' && r) quoteFor(r);
    else if (a === 'qk' && FL.qpick) { const p = FL.qpick, k = t.dataset.k, color = ((document.getElementById('fl-qc') || {}).value || '').trim().toUpperCase(); FL.qpick = null; closeQ();
      const body = k === '' ? String(p.r.items || p.r.item || '').split(/\s*·\s*/).join('\n') : (p.kits[k] || []).map(([n, q, u]) => `${String(n).replace(/<색상>/g, color || '색상').replace(/_?<색>/g, '')} ${q} ${String(u || '').replace(/\s*\(.*\)/, '')}`.trim()).join('\n');
      FM.presetQuote(body, p.r.partner, p.r.site); ctx.rerender(); }
    else if (a === 'qx') { FL.qpick = null; closeQ(); }
    else if (a === 'deliv' && r) { FM.presetDeliv(saleSlips(r).join(' ')); ctx.rerender(); }
    else if (['deliv', 'approval', 'quote', 'stmt'].includes(a)) { FM.open(a === 'stmt' ? '' : a); if (a === 'stmt') ctx.go('stmt'); else ctx.rerender(); }
    else if (a === 'pdf') {
      const slips = (t.dataset.s || '').split(',').filter(Boolean), kk = t.dataset.k, w = window.open('', '_blank');   // 누를 때 받음 (미리 다 받으면 화면이 깜빡임)
      S.getSlipLinks(slips).then((m) => {
        const hit = slips.flatMap((s_) => m[s_] || []).find((x) => !kk || !x.kind || x.kind === kk);
        if (hit) { if (w) w.location = `https://drive.google.com/file/d/${encodeURIComponent(hit.drive_id)}/view`; else window.open(`https://drive.google.com/file/d/${encodeURIComponent(hit.drive_id)}/view`, '_blank'); }
        else { if (w) w.close(); if (slips.length) copyText(slips.join(' ')).then(() => alert(`전표 PDF가 아직 안 올라왔어요 — 전표 번호 ${slips.join(', ')} 복사함`)); }
      }).catch((err) => { if (w) w.close(); alert('전표를 못 불러왔어요 — ' + (err.message || err)); });
    }
  };
  app.addEventListener('click', onClick);
  clickQ = (b) => onClick({ target: b, stopPropagation() {} });
}
