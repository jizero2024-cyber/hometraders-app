// 세로형 키오스크 '/kiosk' (10/29 대표 "세로형 화면에도 한눈에 — 배차 요청해야 하는 건·배차 완료·발주 요청")
// 첫 화면 출고 흐름과 같은 자료(site_inbox 'flow:board')를 읽기만. 누르는 곳 없음, 1분마다 새로 받음.
import * as S from './store-supabase.js?v=9';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const K = { data: null, err: '', timer: 0, clock: 0, wxt: 0, lock: null, wx: null };
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

// 날씨 — 화성 본사 근처 (Open-Meteo, 키 없음) · 20분마다
const WX_URL = 'https://api.open-meteo.com/v1/forecast?latitude=37.20&longitude=127.07&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&forecast_days=2&timezone=Asia%2FSeoul';
const wxName = (c) => (c === 0 ? '맑음' : c <= 2 ? '구름 조금' : c === 3 ? '흐림' : c <= 48 ? '안개' : c <= 57 ? '이슬비' : c <= 67 ? '비' : c <= 77 ? '눈' : c <= 82 ? '소나기' : c <= 86 ? '눈' : '뇌우');
const wxIc = (c, h) => {   // 단순한 선 아이콘
  const sun = '<circle cx="12" cy="12" r="4.2" fill="#FFB800" stroke="none"/><path stroke="#FFB800" d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5"/>';
  const moon = '<path fill="#9AA6C8" stroke="none" d="M15.5 3.5a8.5 8.5 0 1 0 5 13.6A7 7 0 0 1 15.5 3.5z"/>';
  const cloud = (f) => `<path fill="${f}" stroke="none" d="M7 18.5h10.2a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.6A3.2 3.2 0 0 0 7 18.5z"/>`;
  const drops = '<path stroke="#3B8BEB" d="M9 20.5l-1 2M13 20.5l-1 2M17 20.5l-1 2"/>';
  const flakes = '<path stroke="#8FB8E8" d="M9 21h.01M13 22h.01M17 21h.01"/>';
  const day = h == null || (h >= 6 && h < 18);
  const g = c === 0 ? (day ? sun : moon) : c <= 2 ? `<g transform="translate(-3 -3) scale(.8)">${day ? sun : moon}</g>${cloud('#D9DEE6')}` : c === 3 || c <= 48 ? cloud('#C3C9D3')
    : c <= 67 || (c >= 80 && c <= 82) ? cloud('#AEB6C2') + drops : c <= 77 || (c >= 85 && c <= 86) ? cloud('#C3C9D3') + flakes : cloud('#8E97A5') + '<path fill="#FFB800" stroke="none" d="M12.5 17l-2 3.5h2l-1 3 3-4.2h-2l1-2.3z"/>';
  return `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">${g}</svg>`;
};
function wxHtml() {
  const w = K.wx; if (!w || !w.current) return '';
  const c = w.current, d = w.daily || {}, H = w.hourly || {}, now = new Date().getHours();
  const i0 = Math.max(0, (H.time || []).findIndex((t) => t.slice(0, 13) === c.time.slice(0, 13)));
  const hrs = [1, 2, 3, 4, 5].map((k) => i0 + k * 2).filter((i) => H.time && H.time[i]).map((i) => {
    const h = +H.time[i].slice(11, 13), pp = H.precipitation_probability[i];
    return `<div class="kw-hr"><span>${h}시</span>${wxIc(H.weather_code[i], h)}<b>${Math.round(H.temperature_2m[i])}°</b><em>${pp >= 30 ? pp + '%' : ''}</em></div>`; }).join('');
  const tp = (d.precipitation_probability_max || [])[1], tc = (d.weather_code || [])[1];
  return `<div class="kw"><div class="kw-top"><div><div class="kw-loc">화성</div><div class="kw-t">${Math.round(c.temperature_2m)}°</div></div>
      <div class="kw-r">${wxIc(c.weather_code, now)}<div class="kw-n">${wxName(c.weather_code)}</div><div class="kw-hl">최고 ${Math.round(d.temperature_2m_max[0])}° 최저 ${Math.round(d.temperature_2m_min[0])}°</div></div></div>
    <div class="kw-hrs">${hrs}</div>
    ${tc != null ? `<div class="kw-tm ${tp >= 50 ? 'wet' : ''}"><span>내일</span>${wxIc(tc, 12)}<span>${wxName(tc)}</span><span>${Math.round(d.temperature_2m_min[1])}° / ${Math.round(d.temperature_2m_max[1])}°</span>${tp >= 30 ? `<b>비 ${tp}%</b>` : ''}</div>` : ''}</div>`;
}

export function screen() {
  const n = new Date(), wd = '일월화수목금토'[n.getDay()];
  if (!K.data) return `<div class="ki-box"><div class="ki"><div class="ki-z">${esc(K.err || '불러오는 중')}</div></div></div>`;
  const g = groups(), at = K.data.at ? String(K.data.at).slice(11, 16) : '';
  return `<div class="ki-box"><div class="ki">
    <header class="ki-h"><div class="ki-clk"><span>${n.getMonth() + 1}월 ${n.getDate()}일 ${wd}요일</span><b>${p2(n.getHours())}:${p2(n.getMinutes())}</b></div>${wxHtml()}</header>
    <div class="ki-t"><div class="k-need"><b>${g.need.length}</b><span>배차 해야 함</span></div><div><b>${g.car.length}</b><span>차 잡힘</span></div>
      <div><b>${g.order.length}</b><span>발주 요청</span></div><div class="k-out"><b>${g.out.length}</b><span>출고 완료</span></div></div>
    ${sec('k-need', '배차 해야 함', g.need, 9, true)}
    ${sec('k-car', '차 잡힘 · 도착 확인', g.car, 5, false)}
    ${sec('k-order', '발주 요청', g.order, 5, false)}
    <div class="ki-out"><span>오늘 출고 완료</span><span>${g.out.length}</span></div>
    ${at ? `<div class="ki-at">${esc(at)}</div>` : ''}
  </div></div>`;
}

function pullWx(draw) { fetch(WX_URL).then((r) => r.json()).then((w) => { K.wx = w; draw(); }).catch(() => {}); }
function pull(draw) {
  S.getFlowBoard().then((d) => { if (d) K.data = d; K.err = ''; }).catch((e) => { K.err = e.message; }).finally(draw);
}
export function start(draw) {   // 1분마다 새 자료, 시계는 20초마다 · 화면 꺼짐 막기
  if (K.timer) return;
  pull(draw); pullWx(draw);
  K.timer = setInterval(() => pull(draw), 60000);
  K.wxt = setInterval(() => pullWx(draw), 1200000);
  K.clock = setInterval(draw, 20000);
  const wake = () => { try { if (navigator.wakeLock && document.visibilityState === 'visible') navigator.wakeLock.request('screen').then((l) => { K.lock = l; }).catch(() => {}); } catch (_) { /* 무시 */ } };
  wake(); document.addEventListener('visibilitychange', wake);
  document.addEventListener('click', () => {   // 화면 한 번 누르면 전체 화면 — 브라우저 주소창 숨김 (10/29 대표)
    if (!document.body.classList.contains('kiosk') || document.fullscreenElement) return;
    try { const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen({ navigationUI: 'hide' }); if (p) p.catch(() => {}); } catch (_) { /* 무시 */ }
  });
}
export function stop() { clearInterval(K.timer); clearInterval(K.clock); clearInterval(K.wxt); K.timer = 0; K.clock = 0; try { if (K.lock) K.lock.release(); } catch (_) { /* 무시 */ } }
