// 첫 화면(에이스 / 홈트 고르기) + 홈트 배차 요청 화면 (2026-10-22)
// 상차지·하차지 = 창고 + 거래처(공유 DB — 도우미 배차 주소록도 10/22 여기로 옮김) + 지난 출고에 적힌 상·하차지.
// 맥 도우미 없이 누구 PC·휴대폰에서도 됨. 새로 적은 주소는 거래처에 저장돼 다음부터 모두에게 뜸.
// 검색은 초성도 됨 (ㅇㅇㅋㅂ → 원익큐브). [배차 요청] = 배차요청톡 복사 + 출고 목록에 '출고예정'으로 등록.
import * as S from './store-supabase.js?v=12';
import * as W from './weights.js?v=1';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// 품목 고르기 — 이음물류 톡 배차 요청(7/27~10/20, 282건)에 자주 나온 자재 순. 기본값 건축자재 (10/22 대표)
const GOODS = ['건축자재', '목재', '실리콘', '철물·부자재', '합판·OSB', '단열재', '석고보드'];   // 세라믹사이딩·쫄대는 넣지 않음 (10/22 대표)
const VEHICLES = ['다마스', '라보', '1톤', '1.4톤', '2.5톤', '3.5톤', '5톤', '5톤축', '11톤', '25톤'];
const KIND_ORDER = { 창고: 0, 거래처: 1, '지난 배차': 2, 택배: 3 };

// 화면이 다시 그려져도(공유 DB 실시간 갱신 등) 적던 내용이 남도록 여기 보관
// 보안: 화면 속성(data-*)에서 온 이름은 아래 목록에 있는 칸만 바꿈 · 공유 DB 로 가는 글자는 길이 제한 · 화면에 찍는 값은 모두 esc()
const SIDES = new Set(['from', 'to']);
const SET_KEYS = new Set(['pay', 'weight', 'sched', 'goods', 'sayAs']);
const IN_KEYS = new Set(['vehicle', 'goods', 'weight', 'sched', 'from.addr', 'from.phone', 'to.name', 'to.addr', 'to.phone']);
const MAX = { name: 60, addr: 120, phone: 30, text: 100 };
const LOAD_PHONE = '010-6207-8478';   // 상차지 연락처는 항상 이 번호 (10/22 대표) — 거래처 전화는 톡에 안 넣음
const cut = (v, n) => String(v || '').trim().slice(0, n);
const F = { from: null, to: null, cars: [], vehicle: '', pay: '현불', goods: '건축자재', weight: '', sched: '', say: false, sayAs: '홈트레이더스', open: '', q: { from: '', to: '' } };

// ── 초성 검색 ─────────────────────────────────────────
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const isJamo = (ch) => CHO.includes(ch);
const choOf = (ch) => { const c = ch.charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 ? CHO[Math.floor((c - 0xAC00) / 588)] : ch; };
const norm = (s) => String(s || '').toLowerCase().replace(/\(주\)|㈜|주식회사/g, '').replace(/[\s()\-·.,]/g, '');
// q 의 글자가 이어서 나오는 곳이 있으면 맞음 — 자음만 친 글자는 초성으로 비교 (원익큐브 ← ㅇㅇㅋㅂ, 원ㅇ, 큐브)
function hit(q, text) {
  const a = norm(q), b = norm(text);
  if (!a) return true;
  for (let i = 0; i + a.length <= b.length; i++) {
    let ok = true;
    for (let j = 0; j < a.length; j++) {
      const qc = a[j], tc = b[i + j];
      if (qc !== tc && !(isJamo(qc) && choOf(tc) === qc)) { ok = false; break; }
    }
    if (ok) return i === 0 ? 2 : 1;   // 앞에서부터 맞으면 위로
  }
  return 0;
}

// ── 장소 목록 (있는 데이터에서) ─────────────────────────
function places() {
  const out = [];
  const seen = new Map();
  const add = (p) => {   // 같은 이름은 한 줄 — 앞에 나온 것(창고 > 거래처 > 지난 배차)이 우선, 빈 주소·연락처만 뒤에서 채움
    const name = (p.name || '').trim();
    if (!name) return;
    const ex = seen.get(norm(name));
    if (ex) { if (!ex.addr && p.addr) ex.addr = p.addr; if (!ex.phone && p.phone) ex.phone = p.phone; return; }
    const o = { name, addr: p.addr || '', phone: p.phone || '', kind: p.kind, note: p.note || '' };
    out.push(o); seen.set(norm(name), o);
  };
  S.getWarehouses().forEach((w) => add({ name: w.name, addr: w.address, phone: w.phone, kind: '창고' }));
  S.getPartners().forEach((p) => add({ name: p.name, addr: p.address, phone: p.phone, kind: '거래처', note: p.note }));
  S.getShipments().slice(0, 400).forEach((s) => {
    if (s.loadPlace) add({ name: s.loadPlace, addr: s.loadAddr, kind: '지난 배차' });
    if (s.unloadPlace) add({ name: s.unloadPlace, addr: s.unloadAddr, kind: '지난 배차' });
  });
  add({ name: '경동택배', addr: '', kind: '택배', note: '지점 주소는 직접 입력' });
  return out;
}
function search(q) {
  const all = places();
  if (!norm(q)) return all.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]).slice(0, 60);
  return all.map((p) => ({ p, s: Math.max(hit(q, p.name) * 2, hit(q, p.addr)) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || KIND_ORDER[a.p.kind] - KIND_ORDER[b.p.kind] || a.p.name.length - b.p.name.length)
    .slice(0, 40).map((x) => x.p);
}

// ── 화면 ──────────────────────────────────────────────
export function startScreen() {
  return `<div class="hd-start">
    <button class="hd-half ace" type="button" data-hd="go-ace"><span class="hd-big">에이스</span><span class="hd-sub">기존 ERP 화면</span></button>
    <button class="hd-half homt" type="button" data-hd="go-homt" aria-label="홈트 배차 요청"><img src="./icons/logo-full.png" alt="HOME TRADERS"></button>
  </div>`;
}

function listHtml(t) {
  if (F.open !== t) return '';
  const list = search(F.q[t]);
  const typed = (F.q[t] || '').trim();
  return `${list.map((x, i) => `<button type="button" class="hd-opt" data-hd="pick" data-t="${t}" data-i="${i}">
      <span class="hd-opt-nm">${esc(x.name)}</span><span class="hd-kind">${esc(x.kind)}</span>
      <span class="hd-opt-ad">${esc(x.addr || x.note || '주소 없음')}</span></button>`).join('')}
    ${typed ? `<button type="button" class="hd-opt new" data-hd="pick-new" data-t="${t}"><span class="hd-opt-nm">'${esc(typed)}' 직접 입력</span></button>` : ''}
    ${!list.length && !typed ? '<div class="hd-empty">목록이 비어 있어요</div>' : ''}`;
}
// 검색칸은 그대로 두고 목록만 바꿈 — 칸을 다시 그리면 한글 조합 중인 글자가 깨짐
function updateList(t) {
  const box = document.getElementById('hd-list-' + t);
  if (!box) return;
  const h = listHtml(t);
  box.innerHTML = h;
  box.style.display = h ? '' : 'none';
}

// 아이콘 (선 그림)
const svg = (d, w = 18) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  pin: svg('<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z" fill="currentColor"/><circle cx="12" cy="10" r="2.2" fill="#fff" stroke="none"/>', 26),
  swap: svg('<path d="M7 4v16M3 8l4-4 4 4M17 20V4M21 16l-4 4-4-4"/>', 20),
  truck: svg('<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
  box: svg('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>'),
  cash: svg('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>'),
  scale: svg('<path d="M6 20h12l-2-11H8z"/><circle cx="12" cy="6" r="2"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  alarm: svg('<circle cx="12" cy="13" r="7"/><path d="M12 10v3l2 1M5 4 3 6M19 4l2 2"/>'),
  user: svg('<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5"/>'),
};
function endHtml(t, lab) {
  const p = F[t];
  const ico = t === 'from' ? '<span class="hd-ico"><span class="hd-sq"></span></span>' : `<span class="hd-ico hd-pin">${IC.pin}</span>`;
  if (!p) return `<div class="hd-field hd-end hd-end-${t}">${ico}<div class="hd-end-lab">${lab}</div>
      <input class="hd-in hd-search hd-end-q" id="hd-q-${t}" data-hd-q="${t}" maxlength="60" value="${esc(F.q[t])}" placeholder="이름 · 주소 · 초성" autocomplete="off">
      <div class="hd-list" id="hd-list-${t}" style="${F.open === t ? '' : 'display:none'}">${listHtml(t)}</div>
      ${t === 'to' ? '<button type="button" class="hd-direct" data-hd="direct" data-t="to">＋ 주소 직접 입력</button>' : ''}</div>`;
  const direct = p.kind === '현장';
  return `<div class="hd-field hd-end hd-end-${t}">${ico}<div class="hd-end-lab">${lab}<span class="hd-kind">${esc(p.kind || '직접')}</span><button type="button" class="hd-x" data-hd="clear" data-t="${t}">바꾸기</button></div>
    ${direct ? `<input class="hd-in hd-end-q" data-hd-in="${t}.name" maxlength="60" value="${esc(p.name)}" placeholder="현장 이름">` : `<div class="hd-end-nm">${esc(p.name)}</div>`}
    <input class="hd-in hd-end-in" data-hd-in="${t}.addr" maxlength="120" value="${esc(p.addr)}" placeholder="주소">
    ${t === 'from' ? `<div class="hd-end-sub">연락처 ${LOAD_PHONE}</div>`
      : `<input class="hd-in hd-end-in" data-hd-in="${t}.phone" maxlength="30" value="${esc(p.phone)}" placeholder="연락처" inputmode="tel">`}</div>`;
}
const routeCard = () => `<div class="hd-route">
    <div class="hd-ends">${endHtml('from', '상차')}${endHtml('to', '하차')}</div>
    <button type="button" class="hd-swap" data-hd="swap" aria-label="상차 하차 바꾸기">${IC.swap}</button>
  </div>`;
// 오늘 배차 요청 마감 15:00 (10/27 대표)
const DEADLINE = { h: 15, m: 0 };
function dlHtml() {
  const now = new Date(), dl = new Date(now); dl.setHours(DEADLINE.h, DEADLINE.m, 0, 0);
  const left = Math.floor((dl - now) / 60000), hh = `${DEADLINE.h}:${String(DEADLINE.m).padStart(2, '0')}`;
  if (left < 0) return `<div class="hd-dl over" id="hd-dl"><span>${IC.alarm} 오늘 마감</span><b>${hh} 지남</b></div>`;
  const rest = left >= 60 ? `${Math.floor(left / 60)}시간 ${left % 60}분` : `${left}분`;
  return `<div class="hd-dl${left <= 30 ? ' soon' : ''}" id="hd-dl"><span>${IC.alarm} 오늘 마감</span><b>${hh} · ${rest} 남음</b></div>`;
}

// 차량은 여러 대 골라도 됨 — "1톤 또는 1.4톤" (10/22 대표). 직접 적은 차량(F.vehicle)은 맨 뒤에
const carText = () => [...VEHICLES.filter((v) => F.cars.includes(v)), F.vehicle.trim()].filter(Boolean).join(' 또는 ');
export function dispatchText() {
  const L = ['배차 부탁드립니다!'];
  if (F.say) L.push(`${F.sayAs} 물건이라고 하시면 됩니다!`);   // 상차지에서 누구 물건인지 — 매입처 직송·맡긴 물건 찾을 때 (이음물류 톡 10/22 분석)
  L.push('');
  const place = (lab, p) => {
    L.push(`${lab}: ${p ? (p.name || p.addr || '○○') : '○○'}`);
    if (p && p.addr && p.name) L.push(p.addr);
    const phone = lab === '상차지' ? LOAD_PHONE : p && p.phone;
    if (phone) L.push(`연락처: ${phone}`);
    L.push('');
  };
  place('상차지', F.from);
  place('하차지', F.to);
  L.push(`차량: ${carText() || '○톤'}`);
  L.push(`운임: ${F.pay}`);
  L.push(`물건: ${F.goods.trim() || '○○'}`);
  if (F.weight.trim()) L.push(`무게: ${F.weight.trim()}`);
  if (F.sched.trim()) L.push(`일정: ${F.sched.trim()}`);
  L.push('', '감사합니다!');
  return L.join('\n');
}

const EMBED = new URLSearchParams(location.search).has('embed');   // 첫 화면 팝업 안(/homt?embed=1) — 머리·제목 없이
// 첫 화면 '출고 흐름'에서 그 출고 건 값으로 열기 (/homt?embed=1&f={from,to,toName,car,goods,sched,say}, 10/28) — 상차지는 주소록에서 찾고 없으면 직접 입력
let RCTX = null, FLOW_NO = '';
let PRE = (() => { try { const f = new URLSearchParams(location.search).get('f'); return f ? JSON.parse(f) : null; } catch (_) { return null; } })();
function applyPre() {
  if (!PRE) return;
  const p = PRE, ready = S.getPartners().length > 0;
  if (!ready && !applyPre.tried) { applyPre.tried = true; setTimeout(() => { if (PRE) { applyPre.late = true; if (RCTX) RCTX.rerender(); } }, 2500); return; }
  if (!ready && !applyPre.late) return;
  PRE = null;
  FLOW_NO = cut(p.no || '', MAX.name);
  const find = (q) => { const r = q ? search(q) : []; return r.length && hit(q, r[0].name) ? { ...r[0] } : null; };
  if (p.from) F.from = find(cut(p.from, MAX.name)) || { name: cut(p.from, MAX.name), addr: '', phone: '', kind: '직접' };
  if (p.to) F.to = { name: cut(p.toName || '', MAX.name), addr: cut(p.to, MAX.addr), phone: '', kind: '현장' };
  const car = VEHICLES.find((v) => v === p.car);
  if (car) F.cars = [car]; else if (p.car) F.vehicle = cut(p.car, MAX.text);
  if (p.goods) F.goods = cut(p.goods, MAX.text);
  if (p.sched) F.sched = cut(p.sched, MAX.text);
  if (p.say) { F.say = true; F.sayAs = p.say === '에이스' ? '에이스' : '홈트레이더스'; }
}
const chip = (k, v, on) => `<button type="button" class="hd-chip ${on ? 'on' : ''}" data-hd="set" data-k="${k}" data-v="${esc(v)}">${esc(v)}</button>`;
// 무게 칩 — 품목 글로 계산한 예상 무게(적재가능 무게 표, weights.js)를 누르면 무게 칸에 들어감 (10/29 대표)
const wtEst = () => { const e = W.estimate(F.goods); return e ? W.label(e.kg) : ''; };
function wtChips() {
  const est = wtEst();
  return `${est ? chip('weight', est, F.weight === est) : ''}${chip('weight', '최대중량', F.weight === '최대중량')}`;
}
export function homtScreen() {
  applyPre();
  return `<div class="hm">${EMBED ? '' : `<header class="hm-top"><div class="hm-in">
    <button type="button" class="hm-back" data-hd="back" aria-label="뒤로">‹</button><img src="./icons/logo-full.png" alt="HOME TRADERS" class="hm-logo" data-hd="back"></div></header>`}
    <div class="hd-page">${EMBED ? '' : '<h1 class="hm-h1" style="margin:12px 0 16px">배차 요청</h1>'}
    ${routeCard()}
    <div class="hd-sheet"><div class="hd-handle"></div>
    <div class="hd-field"><label class="hd-check"><input type="checkbox" data-hd="say" ${F.say ? 'checked' : ''}> 상차지에 우리 물건이라고 말해 주세요</label>
      ${F.say ? `<div class="hd-chips">${chip('sayAs', '홈트레이더스', F.sayAs === '홈트레이더스')}${chip('sayAs', '에이스', F.sayAs === '에이스')}</div>` : ''}</div>
    <div class="hd-field"><label>${IC.truck} 차량</label><div class="hd-chips">${VEHICLES.map((v) => `<button type="button" class="hd-chip ${F.cars.includes(v) ? 'on' : ''}" data-hd="car" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div>
      <input class="hd-in" data-hd-in="vehicle" maxlength="100" value="${esc(F.vehicle)}" placeholder="직접 입력 (예: 1톤 탑차) · 여러 개 고르면 '또는'"></div>
    <div class="hd-field"><label>${IC.cash} 운임</label><div class="hd-seg">${['현불', '착불'].map((v) => `<button type="button" class="${F.pay === v ? 'on' : ''}" data-hd="set" data-k="pay" data-v="${v}">${v}</button>`).join('')}</div></div>
    <div class="hd-field"><label>${IC.box} 품목</label><div class="hd-chips">${GOODS.map((v) => chip('goods', v, F.goods === v)).join('')}</div>
      <input class="hd-in" data-hd-in="goods" maxlength="100" value="${esc(GOODS.includes(F.goods) ? '' : F.goods)}" placeholder="직접 입력 (예: 방킬라이 1PLT · 3m)"></div>
    <div class="hd-field"><label>${IC.scale} 무게</label><div class="hd-chips" id="hd-wt">${wtChips()}</div>
      <input class="hd-in" data-hd-in="weight" maxlength="100" value="${esc(F.weight === '최대중량' || (F.weight && F.weight === wtEst()) ? '' : F.weight)}" placeholder="예: 600kg"></div>
    <div class="hd-field"><label>${IC.clock} 일정</label><div class="hd-chips">${chip('sched', '오늘 상차 / 내일 하차', F.sched === '오늘 상차 / 내일 하차')}${chip('sched', '바로 상차 / 바로 하차', F.sched === '바로 상차 / 바로 하차')}</div>
      <input class="hd-in" data-hd-in="sched" maxlength="100" value="${esc(['오늘 상차 / 내일 하차', '바로 상차 / 바로 하차'].includes(F.sched) ? '' : F.sched)}" placeholder="예: 내일 오전 8시 착"></div>
    <div class="hd-field"><label>배차요청톡 미리보기</label><pre class="hd-pre" id="hd-pre">${esc(dispatchText())}</pre></div>
    ${dlHtml()}
    <button type="button" class="hd-go" data-hd="submit">배차 요청</button>
  </div></div></div>`;
}

// ── 입력·클릭 ──────────────────────────────────────────
// ctx = { rerender, goAce, goHomt, goStart }
export function bind(app, ctx) {
  RCTX = ctx;
  setInterval(() => { const el = document.getElementById('hd-dl'); if (el) el.outerHTML = dlHtml(); }, 30000);
  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-hd]');
    if (!t) {
      if (F.open && !e.target.closest('.hd-field')) { const o = F.open; F.open = ''; updateList(o); }
      return;
    }
    const a = t.dataset.hd, k = t.dataset.t;
    if (['pick', 'pick-new', 'clear', 'direct'].includes(a) && !SIDES.has(k)) return;
    if (a === 'go-ace') ctx.goAce();
    else if (a === 'go-homt') ctx.goHomt();
    else if (a === 'back') ctx.goStart();
    else if (a === 'pick') { F[k] = { ...search(F.q[k])[Number(t.dataset.i)] }; F.open = ''; F.q[k] = ''; ctx.rerender(); }
    else if (a === 'pick-new') { F[k] = { name: cut(F.q[k], MAX.name), addr: '', phone: '', kind: '직접' }; F.open = ''; F.q[k] = ''; ctx.rerender(); }
    else if (a === 'direct') { F[k] = { name: '', addr: cut(F.q[k], MAX.addr), phone: '', kind: '현장' }; F.open = ''; F.q[k] = ''; ctx.rerender(); focusIn(`${k}.name`); }   // 거래처 아닌 하차지 — 거래처에 저장 안 함
    else if (a === 'clear') { F[k] = null; F.open = k; ctx.rerender(); }
    else if (a === 'set') { const key = t.dataset.k; if (!SET_KEYS.has(key)) return; F[key] = F[key] === t.dataset.v && key !== 'pay' && key !== 'sayAs' ? '' : t.dataset.v; ctx.rerender(); }
    else if (a === 'car') { const v = t.dataset.v; if (!VEHICLES.includes(v)) return; F.cars = F.cars.includes(v) ? F.cars.filter((x) => x !== v) : [...F.cars, v]; ctx.rerender(); }
    else if (a === 'say') { F.say = !!t.checked; ctx.rerender(); }
    else if (a === 'swap') { [F.from, F.to] = [F.to, F.from]; [F.q.from, F.q.to] = [F.q.to, F.q.from]; F.open = ''; ctx.rerender(); }
    else if (a === 'submit') submit(ctx);
  });
  app.addEventListener('focusin', (e) => {
    const q = e.target.closest('[data-hd-q]');
    if (q && F.open !== q.dataset.hdQ) { const o = F.open; F.open = q.dataset.hdQ; if (o) updateList(o); updateList(F.open); }
  });
  app.addEventListener('input', (e) => {
    const q = e.target.closest('[data-hd-q]');
    if (q) { if (!SIDES.has(q.dataset.hdQ)) return; F.q[q.dataset.hdQ] = q.value.slice(0, MAX.name); F.open = q.dataset.hdQ; updateList(F.open); return; }
    const f = e.target.closest('[data-hd-in]');
    if (!f || !IN_KEYS.has(f.dataset.hdIn)) return;
    const [a, b] = f.dataset.hdIn.split('.');
    if (b) { if (F[a]) F[a][b] = f.value; } else F[a] = f.value;
    if (a === 'goods') { const w = document.getElementById('hd-wt'); if (w) w.innerHTML = wtChips(); }
    const pre = document.getElementById('hd-pre'); if (pre) pre.textContent = dispatchText();
  });
}
// 다시 그린 뒤 검색칸이 열려 있었으면 커서를 돌려놓음 (공유 DB 갱신으로 화면이 새로 그려져도 치던 글자가 끊기지 않게)
export function afterRender() { if (F.open) focusQ(F.open); }
function focusIn(k) { setTimeout(() => { const el = document.querySelector(`[data-hd-in="${k}"]`); if (el) el.focus(); }, 60); }
function focusQ(t) {
  const el = document.getElementById('hd-q-' + t);
  if (el) { el.focus(); const n = el.value.length; try { el.setSelectionRange(n, n); } catch (_) { /* 무시 */ } }
}

// 새로 적은 곳·빈 주소 채운 곳을 거래처(공유 DB)에 저장 — 다음부터 다른 직원 화면에도 뜸. 있던 주소는 덮어쓰지 않음
function savePlaces() {
  const whs = new Set(S.getWarehouses().map((w) => norm(w.name)));
  [F.from, F.to].forEach((p) => {
    if (!p || !p.name || p.kind === '택배' || p.kind === '현장' || whs.has(norm(p.name))) return;   // 직접 입력한 현장은 거래처가 아님
    const ex = S.getPartners().find((x) => norm(x.name) === norm(p.name));
    const addr = cut(p.addr, MAX.addr), phone = cut(p.phone, MAX.phone);
    if (!ex) { if (addr) S.addPartner({ name: cut(p.name, MAX.name), address: addr, phone, note: '배차 요청에서 등록' }); return; }
    const patch = {};
    if (!(ex.address || '').trim() && addr) patch.address = addr;
    if (!(ex.phone || '').trim() && phone) patch.phone = phone;
    if (Object.keys(patch).length) S.updatePartner(ex.name, { ...ex, ...patch });
  });
}

function submit(ctx) {
  if (!F.from || !F.to) return alert('상차지와 하차지를 골라 주세요.');
  if (!F.to.name && !(F.to.addr || '').trim()) return alert('하차지 주소를 적어 주세요.');
  if (!carText()) return alert('차량을 골라 주세요.');
  const text = dispatchText();
  const done = () => {
    savePlaces();
    S.addShipment({
      date: S.todayStr(), warehouse: cut(F.from.name, MAX.name), client: cut(F.to.name, MAX.name), status: '출고예정', method: '배차',
      name: cut(F.goods, MAX.text), qty: 0, unit: '', vehicle: cut(carText(), MAX.text), payment: F.pay,
      loadPlace: cut(F.from.name, MAX.name), loadAddr: cut(F.from.addr, MAX.addr), unloadPlace: cut(F.to.name || F.to.addr, MAX.name), unloadAddr: cut(F.to.addr, MAX.addr),
      note: [FLOW_NO ? `배차 요청함 ${new Date().toTimeString().slice(0, 5)}(출고 흐름 ${FLOW_NO})` : '배차 요청함(홈트 첫 화면)', F.weight && `무게 ${cut(F.weight, MAX.phone)}`, F.sched && `일정 ${cut(F.sched, MAX.text)}`].filter(Boolean).join(' · '),
    });
    if (FLOW_NO && S.setShipCase) S.setShipCase(FLOW_NO, { disp: `배차 요청함 ${new Date().toTimeString().slice(0, 5)}` }, (ctx && ctx.me && ctx.me()) || '').catch(() => {});   // 운영 DB 먼저
    alert('배차요청톡을 복사했어요. 이음물류 카톡방에 붙여넣으세요.\n출고 목록에도 \'출고예정\'으로 등록했어요.');
    Object.assign(F, { from: null, to: null, cars: [], vehicle: '', pay: '현불', goods: '건축자재', weight: '', sched: '', say: false, sayAs: '홈트레이더스', open: '', q: { from: '', to: '' } });
    ctx.rerender();
  };
  const fallback = () => {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (_) { /* 무시 */ }
    ta.remove(); done();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
  else fallback();
}
