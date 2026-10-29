// 세로형 키오스크 '/kiosk' (10/29 대표 "세로형 화면에도 한눈에 — 배차 요청해야 하는 건·배차 완료·발주 요청")
// 첫 화면 출고 흐름과 같은 자료(site_inbox 'flow:board'), 1분마다 새로 받음. 줄 누르면 상세 + 배차 완료·출고 완료 (10/29 대표) — 저장은 첫 화면과 같은 S.setShipCase
import * as S from './store-supabase.js?v=9';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const K = { data: null, err: '', timer: 0, clock: 0, lock: null, sel: '', ask: '', busy: false, toast: '', me: '', over: {} };   // over = 방금 누른 건 (맥 도우미가 새 판을 올릴 때까지 화면에 유지)
const p2 = (n) => String(n).padStart(2, '0');
const mdOf = (d) => `${p2(d.getMonth() + 1)}/${p2(d.getDate())}`;
const today = () => (K.data && K.data.today) || mdOf(new Date());
const tmr = () => { const [m, d] = today().split('/').map(Number); const x = new Date(new Date().getFullYear(), m - 1, d + 1); return mdOf(x); };
const num = (md) => (/^\d\d\/\d\d$/.test(md || '') ? +md.slice(0, 2) * 100 + +md.slice(3) : 9999);
const tkey = (t) => {   // flow.js 와 같은 순서 — 도착 이른 것 먼저, 시간 미정은 아래
  const m = String(t || '').match(/(\d{1,2})(?::(\d\d))?\s*시?/);
  if (m) return +m[1] * 60 + (+m[2] || 0) + (/오후/.test(t) && +m[1] < 12 ? 720 : 0);
  return /새벽/.test(t) ? 300 : /아침|오전/.test(t) ? 540 : /점심|정오/.test(t) ? 720 : /오후/.test(t) ? 840 : /저녁/.test(t) ? 1080 : 9999; };
const dayOf = (r) => r.arr || r.day || '';
const has = (r, ...k) => k.some((x) => (r.steps || []).includes(x));
const done = (r) => has(r, '출고 완료', '기록');
const late = (r) => { const d = num(dayOf(r)), t = num(today()); if (d < t) return true;
  if (d > t) return false; const n = new Date(); return tkey(r.time) < 9999 && tkey(r.time) < n.getHours() * 60 + n.getMinutes(); };
const sortRows = (rs) => rs.slice().sort((a, b) => num(dayOf(a)) - num(dayOf(b)) || tkey(a.time) - tkey(b.time));

function groups() {
  const rows = (K.data && K.data.rows) || [], t = num(today()), m = num(tmr());
  const near = (r) => { const d = num(dayOf(r)); return d >= t - 3 && d <= m; };   // 사흘 전 ~ 내일
  return {
    need: sortRows(rows.filter((r) => has(r, '배차 요청') && !has(r, '배차 완료') && !done(r) && near(r))),
    car: sortRows(rows.filter((r) => has(r, '배차 완료') && !done(r) && near(r))),
    order: sortRows(rows.filter((r) => has(r, '발주') && !has(r, '배차 요청', '배차 완료') && !done(r))),
    out: sortRows(rows.filter((r) => done(r) && num(dayOf(r)) === t)),
  };
}

const when = (r) => { const d = dayOf(r); return d === today() ? '오늘' : d === tmr() ? '내일' : /^\d\d\/\d\d$/.test(d) ? d : '미정'; };
const tm = (r) => String(r.time || '').replace(/\s*착$/, '').trim() || (when(r) === '미정' ? '미정' : when(r));
const who = (r) => String(r.partner || '').replace(/^\(주\)|^주식회사\s*/, '').replace(/제작소$|홈$/, '');
function row(r, red) {
  const lt = red && late(r), w = when(r), sub = tm(r) === w ? '' : w;
  return `<div class="ki-r ${lt ? 'late' : ''}" data-ki="row" data-no="${esc(r.no)}"><div class="ki-w"><b>${esc(tm(r))}</b>${sub || lt ? `<span>${esc(lt ? '지남' : sub)}</span>` : ''}</div>
    <div class="ki-m"><div class="ki-p">${r.site ? esc(r.site) : '현장 확인'}</div><div class="ki-i">${esc(who(r))} · ${esc(r.item || '')}</div>${r.car && !/^배차 (필요|완료)$|^—$|^확인$/.test(r.car) ? `<div class="ki-c">${esc(r.car)}</div>` : ''}</div><i class="ki-ch" aria-hidden="true">›</i></div>`;
}
function sec(cls, name, rs, max, red) {
  const more = rs.length - max;
  return `<section class="ki-s ${cls}" id="ki-${cls}"><h2><span class="ki-hi">${IC[cls]}</span><span>${name}</span><em>${rs.length}</em></h2><div class="ki-card">
    ${rs.length ? rs.slice(0, max).map((r) => row(r, red)).join('') : '<div class="ki-z">없음</div>'}${more > 0 ? `<div class="ki-more">+${more}</div>` : ''}</div></section>`;
}

const sv = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  'k-need': sv('<path d="M4 10v4l3 1 9 4V5L7 9z"/><path d="M19 9.5a3 3 0 0 1 0 5"/>'),
  'k-car': sv('<path d="M2.5 7h11v9h-11zM13.5 10h4l3 3v3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>'),
  'k-order': sv('<rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>'),
  'k-out': sv('<path d="M20 6 9 17l-5-5"/>'),
};
const byNo = (no) => ((K.data && K.data.rows) || []).find((r) => r.no === no);
const stage = (r) => (done(r) ? '출고 완료' : has(r, '배차 완료') ? '차 잡힘' : has(r, '배차 요청') ? '배차 해야 함' : has(r, '발주') ? '발주 요청' : '');
function missHtml(r) {
  const by = Object.fromEntries(((K.data && K.data.rows) || []).map((x) => [x.no, x]));
  const gone = (t) => { const x = by[t.no]; return !!x && (has(x, '배차 완료') || done(x)); };
  return (r.miss || []).map((m) => { const left = m.need - m.sent.filter(gone).reduce((a, t) => a + t.q, 0);
    return `<div class="ks-kv"><span>${esc(m.item)} 누락</span><b class="${left > 0 ? 'no' : 'ok'}">${left > 0 ? `남음 ${left.toLocaleString()}${esc(m.unit)}` : '다 보냄'}</b></div>`; }).join('');
}
function sheet() {
  const r = K.sel && byNo(K.sel); if (!r) return '';
  const st = stage(r), memo = String(r.memo || '').split(/\s+·\s+/).map((t) => t.trim()).filter(Boolean).slice(0, 6);
  const kv = (k, v) => (v ? `<div class="ks-kv"><span>${k}</span><b>${esc(v)}</b></div>` : '');
  const btn = (k, label) => `<button type="button" class="ks-b ${K.ask === k ? 'ask' : ''}" data-ki="${k}" ${K.busy ? 'disabled' : ''}>${K.ask === k ? `${label} 확인` : label}</button>`;
  const btns = [st === '배차 해야 함' || st === '발주 요청' ? btn('disp', '배차 완료') : '', st !== '출고 완료' ? btn('ship', '출고 완료') : ''].join('');
  return `<div class="ks-ov" data-ki="close"><div class="ks" role="dialog" aria-label="출고 건">
    <div class="ks-grab"></div>
    <div class="ks-hd"><div><div class="ks-st">${esc(st)}</div><div class="ks-t">${r.site ? esc(r.site) : '현장 확인'}</div><div class="ks-s">${esc(r.partner || '')}${r.boss ? ' · ' + esc(r.boss) : ''}</div></div>
      <button type="button" class="ks-x" data-ki="close" aria-label="닫기">✕</button></div>
    <div class="ks-g">
      ${kv('도착', [dayOf(r), r.time].filter(Boolean).join(' '))}${kv('주소', r.site_full)}${kv('상차', r.from)}${kv('차량', r.veh || (r.car && !/^—$|^배차 필요$|^확인$/.test(r.car) ? r.car : ''))}${kv('규격', r.size)}${missHtml(r)}
    </div>
    <div class="ks-k">품목</div><div class="ks-box">${esc(r.items || r.item || '')}</div>
    ${memo.length ? `<div class="ks-k">할 일</div><div class="ks-box">${memo.map((t) => `<div>${esc(t)}</div>`).join('')}</div>` : ''}
    ${btns ? `<div class="ks-bs">${btns}</div>` : ''}
  </div></div>`;
}

export function screen() {
  const n = new Date(), wd = '일월화수목금토'[n.getDay()];
  if (!K.data) return `<div class="ki-box"><div class="ki"><div class="ki-z">${esc(K.err || '불러오는 중')}</div></div></div>`;
  const g = groups(), at = K.data.at ? String(K.data.at).slice(11, 16) : '';
  return `<div class="ki-box"><div class="ki">
    <header class="ki-h"><div class="ki-clk" data-ki="reload"><span>${n.getMonth() + 1}월 ${n.getDate()}일 ${wd}요일</span><b>${p2(n.getHours())}:${p2(n.getMinutes())}</b></div></header>
    <div class="ki-t">${[['k-need', g.need, '배차 해야 함'], ['k-car', g.car, '차 잡힘'], ['k-order', g.order, '발주 요청'], ['k-out', g.out, '출고 완료']]
      .map(([k, rs, l]) => `<div class="${k}" ${k === 'k-out' ? '' : `data-ki="jump" data-k="${k}"`}><i>${IC[k]}</i><b>${rs.length}</b><span>${l}</span></div>`).join('')}</div>
    ${sec('k-need', '배차 해야 함', g.need, 9, true)}
    ${sec('k-car', '차 잡힘 · 도착 확인', g.car, 5, false)}
    ${sec('k-order', '발주 요청', g.order, 5, false)}
    <div class="ki-out"><i>${IC['k-out']}</i><span>오늘 출고 완료</span><em>${g.out.length}</em></div>
    ${at ? `<div class="ki-at">${esc(at)}</div>` : ''}
  </div>${sheet()}${K.toast ? `<div class="ki-toast">${esc(K.toast)}</div>` : ''}</div>`;
}

function pull(draw) {
  S.getFlowBoard().then((d) => { if (d) { const at = Date.parse(d.at) || 0;
    Object.entries(K.over).forEach(([no, o]) => { const r = (d.rows || []).find((x) => x.no === no); if (at > o.t + 60000 || !r) delete K.over[no]; else Object.assign(r, { steps: o.steps, car: o.car }); });
    K.data = d; } K.err = ''; }).catch((e) => { K.err = e.message; }).finally(draw);
}
function save(kind, draw) {
  const r = byNo(K.sel); if (!r || K.busy) return;
  const hm = new Date().toTimeString().slice(0, 5), ok = kind === 'disp';
  K.busy = true; draw();
  S.setShipCase(r.no, ok ? { disp: `배차 완료 ${hm}` } : { status: '완료' }, K.me, true).then((err) => {
    K.busy = false;
    if (err) { K.toast = '저장 못 했어요 — ' + err; draw(); return; }
    r.steps = ok ? r.steps.filter((k) => !['발주', '배차 요청'].includes(k)).concat(r.steps.includes('배차 완료') ? [] : ['배차 완료'])
      : r.steps.filter((k) => !['발주', '배차 요청', '배차 완료'].includes(k)).concat(['출고 완료', '기록'].filter((k) => !r.steps.includes(k)));
    if (ok) r.car = `배차 완료 ${hm}`;
    K.over[r.no] = { steps: r.steps, car: r.car, t: Date.now() };
    K.sel = ''; K.ask = ''; K.toast = `${r.site || r.partner} ${ok ? '배차 완료' : '출고 완료'}`; draw();
    setTimeout(() => { K.toast = ''; draw(); }, 2500);
  }).catch((e) => { K.busy = false; K.toast = '저장 못 했어요 — ' + (e.message || e); draw(); });
}
function onTap(e, draw) {
  if (!document.body.classList.contains('kiosk')) return;
  const t = e.target.closest('[data-ki]'); if (!t) return;
  const a = t.dataset.ki;
  if (a === 'close' && (e.target === t || t.classList.contains('ks-x'))) { K.sel = ''; K.ask = ''; draw(); }
  else if (a === 'row') { K.sel = t.dataset.no; K.ask = ''; draw(); }
  else if (a === 'disp' || a === 'ship') { if (K.ask === a) save(a, draw); else { K.ask = a; draw(); } }
  else if (a === 'jump') { const el = document.getElementById('ki-' + t.dataset.k); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else if (a === 'reload') pull(draw);
}
export function start(draw, me) {
  K.me = me || K.me;   // 1분마다 새 자료, 시계는 20초마다 · 화면 꺼짐 막기
  if (K.timer) return;
  pull(draw);
  K.timer = setInterval(() => pull(draw), 60000);
  K.clock = setInterval(draw, 20000);
  const wake = () => { try { if (navigator.wakeLock && document.visibilityState === 'visible') navigator.wakeLock.request('screen').then((l) => { K.lock = l; }).catch(() => {}); } catch (_) { /* 무시 */ } };
  wake(); document.addEventListener('visibilitychange', wake);
  document.addEventListener('click', (e) => onTap(e, draw));
  document.addEventListener('click', () => {   // 화면 한 번 누르면 전체 화면 — 브라우저 주소창 숨김 (10/29 대표)
    if (!document.body.classList.contains('kiosk') || document.fullscreenElement) return;
    try { const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen({ navigationUI: 'hide' }); if (p) p.catch(() => {}); } catch (_) { /* 무시 */ }
  });
}
export function stop() { clearInterval(K.timer); clearInterval(K.clock); K.timer = 0; K.clock = 0; try { if (K.lock) K.lock.release(); } catch (_) { /* 무시 */ } }
