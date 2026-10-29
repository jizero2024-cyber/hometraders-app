// 세로형 키오스크 '/kiosk' (10/29 대표 "세로형 화면에도 한눈에 — 배차 요청해야 하는 건·배차 완료·발주 요청")
// 첫 화면 출고 흐름과 같은 자료(site_inbox 'flow:board')를 읽기만. 누르는 곳 없음, 1분마다 새로 받음.
import * as S from './store-supabase.js?v=9';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const K = { data: null, err: '', timer: 0, clock: 0, lock: null };
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
  return `<div class="ki-r ${lt ? 'late' : ''}"><div class="ki-w"><b>${esc(tm(r))}</b><span>${esc(lt ? (sub ? sub + ' · 지남' : '지남') : sub)}</span></div>
    <div class="ki-m"><div class="ki-p">${r.site ? esc(r.site) : '현장 확인'}</div><div class="ki-i">${esc(who(r))} · ${esc(r.item || '')}</div>${r.car && !/^배차 (필요|완료)$|^—$|^확인$/.test(r.car) ? `<div class="ki-c">${esc(r.car)}</div>` : ''}</div></div>`;
}
function sec(cls, name, rs, max, red) {
  const more = rs.length - max;
  return `<section class="ki-s ${cls}"><h2><span>${name}</span><span>${rs.length}</span></h2><div class="ki-card">
    ${rs.length ? rs.slice(0, max).map((r) => row(r, red)).join('') : '<div class="ki-z">없음</div>'}${more > 0 ? `<div class="ki-more">+${more}</div>` : ''}</div></section>`;
}

export function screen() {
  const n = new Date(), wd = '일월화수목금토'[n.getDay()];
  if (!K.data) return `<div class="ki-box"><div class="ki"><div class="ki-z">${esc(K.err || '불러오는 중')}</div></div></div>`;
  const g = groups(), at = K.data.at ? String(K.data.at).slice(11, 16) : '';
  return `<div class="ki-box"><div class="ki">
    <header class="ki-h"><div class="ki-clk"><span>${n.getMonth() + 1}월 ${n.getDate()}일 ${wd}요일</span><b>${p2(n.getHours())}:${p2(n.getMinutes())}</b></div></header>
    <div class="ki-t"><div class="k-need"><b>${g.need.length}</b><span>배차 해야 함</span></div><div><b>${g.car.length}</b><span>차 잡힘</span></div>
      <div><b>${g.order.length}</b><span>발주 요청</span></div><div class="k-out"><b>${g.out.length}</b><span>출고 완료</span></div></div>
    ${sec('k-need', '배차 해야 함', g.need, 9, true)}
    ${sec('k-car', '차 잡힘 · 도착 확인', g.car, 5, false)}
    ${sec('k-order', '발주 요청', g.order, 5, false)}
    <div class="ki-out"><span>오늘 출고 완료</span><span>${g.out.length}</span></div>
    ${at ? `<div class="ki-at">${esc(at)}</div>` : ''}
  </div></div>`;
}

function pull(draw) {
  S.getFlowBoard().then((d) => { if (d) K.data = d; K.err = ''; }).catch((e) => { K.err = e.message; }).finally(draw);
}
export function start(draw) {   // 1분마다 새 자료, 시계는 20초마다 · 화면 꺼짐 막기
  if (K.timer) return;
  pull(draw);
  K.timer = setInterval(() => pull(draw), 60000);
  K.clock = setInterval(draw, 20000);
  const wake = () => { try { if (navigator.wakeLock && document.visibilityState === 'visible') navigator.wakeLock.request('screen').then((l) => { K.lock = l; }).catch(() => {}); } catch (_) { /* 무시 */ } };
  wake(); document.addEventListener('visibilitychange', wake);
  document.addEventListener('click', () => {   // 화면 한 번 누르면 전체 화면 — 브라우저 주소창 숨김 (10/29 대표)
    if (!document.body.classList.contains('kiosk') || document.fullscreenElement) return;
    try { const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen({ navigationUI: 'hide' }); if (p) p.catch(() => {}); } catch (_) { /* 무시 */ }
  });
}
export function stop() { clearInterval(K.timer); clearInterval(K.clock); K.timer = 0; K.clock = 0; try { if (K.lock) K.lock.release(); } catch (_) { /* 무시 */ } }
