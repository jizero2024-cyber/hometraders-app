// 첫 화면(에이스 / 홈트 고르기) + 홈트 배차 요청 화면 (2026-10-22)
// 상차지·하차지 = 창고 + 거래처(공유 DB — 도우미 배차 주소록도 10/22 여기로 옮김) + 지난 출고에 적힌 상·하차지.
// 맥 도우미 없이 누구 PC·휴대폰에서도 됨. 새로 적은 주소는 거래처에 저장돼 다음부터 모두에게 뜸.
// 검색은 초성도 됨 (ㅇㅇㅋㅂ → 원익큐브). [배차 요청] = 배차요청톡 복사 + 출고 목록에 '출고예정'으로 등록.
import * as S from './store-supabase.js';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// 품목 고르기 — 이음물류 톡 배차 요청(7/27~10/20, 282건)에 자주 나온 자재 순. 기본값 건축자재 (10/22 대표)
const GOODS = ['건축자재', '목재', '실리콘', '철물·부자재', '합판·OSB', '단열재', '석고보드'];   // 세라믹사이딩·쫄대는 넣지 않음 (10/22 대표)
const VEHICLES = ['다마스', '라보', '1톤', '1.4톤', '2.5톤', '3.5톤', '5톤', '5톤축', '11톤', '25톤'];
const KIND_ORDER = { 창고: 0, 거래처: 1, '지난 배차': 2, 택배: 3 };

// 화면이 다시 그려져도(공유 DB 실시간 갱신 등) 적던 내용이 남도록 여기 보관
// 보안: 화면 속성(data-*)에서 온 이름은 아래 목록에 있는 칸만 바꿈 · 공유 DB 로 가는 글자는 길이 제한 · 화면에 찍는 값은 모두 esc()
const SIDES = new Set(['from', 'to']);
const SET_KEYS = new Set(['vehicle', 'pay', 'weight', 'sched', 'goods', 'sayAs']);
const IN_KEYS = new Set(['vehicle', 'goods', 'weight', 'sched', 'from.addr', 'from.phone', 'to.addr', 'to.phone']);
const MAX = { name: 60, addr: 120, phone: 30, text: 100 };
const cut = (v, n) => String(v || '').trim().slice(0, n);
const F = { from: null, to: null, vehicle: '', pay: '현불', goods: '건축자재', weight: '', sched: '', say: false, sayAs: '홈트레이더스', open: '', q: { from: '', to: '' } };

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

function placeField(t, label) {
  const p = F[t];
  return `<div class="hd-field"><label>${label}</label>
    ${p ? `<div class="hd-picked"><div class="hd-picked-top"><b>${esc(p.name)}</b><span class="hd-kind">${esc(p.kind || '직접')}</span>
        <button type="button" class="hd-x" data-hd="clear" data-t="${t}">바꾸기</button></div>
        <input class="hd-in" data-hd-in="${t}.addr" maxlength="120" value="${esc(p.addr)}" placeholder="주소 (확인·수정)">
        <input class="hd-in" data-hd-in="${t}.phone" maxlength="30" value="${esc(p.phone)}" placeholder="연락처 (선택)" inputmode="tel"></div>`
      : `<input class="hd-in hd-search" id="hd-q-${t}" data-hd-q="${t}" maxlength="60" value="${esc(F.q[t])}" placeholder="검색 — 이름·주소·초성 (예: ㅇㅇㅋㅂ)" autocomplete="off">
        <div class="hd-list" id="hd-list-${t}" style="${F.open === t ? '' : 'display:none'}">${listHtml(t)}</div>`}
  </div>`;
}

export function dispatchText() {
  const L = ['배차 부탁드립니다!'];
  if (F.say) L.push(`${F.sayAs} 물건이라고 하시면 됩니다!`);   // 상차지에서 누구 물건인지 — 매입처 직송·맡긴 물건 찾을 때 (이음물류 톡 10/22 분석)
  L.push('');
  const place = (lab, p) => {
    L.push(`${lab}: ${p ? p.name : '○○'}`);
    if (p && p.addr) L.push(p.addr);
    if (p && p.phone) L.push(`연락처: ${p.phone}`);
    L.push('');
  };
  place('상차지', F.from);
  place('하차지', F.to);
  L.push(`차량: ${F.vehicle || '○톤'}`);
  L.push(`운임: ${F.pay}`);
  L.push(`물건: ${F.goods.trim() || '○○'}`);
  if (F.weight.trim()) L.push(`무게: ${F.weight.trim()}`);
  if (F.sched.trim()) L.push(`일정: ${F.sched.trim()}`);
  L.push('', '감사합니다!');
  return L.join('\n');
}

export function homtScreen() {
  const chip = (k, v, on) => `<button type="button" class="hd-chip ${on ? 'on' : ''}" data-hd="set" data-k="${k}" data-v="${esc(v)}">${esc(v)}</button>`;
  return `<div class="hd-page">
    <div class="hd-top"><button type="button" class="hd-back" data-hd="back">‹ 처음으로</button><b>홈트 배차 요청</b><span></span></div>
    ${placeField('from', '상차지')}
    ${placeField('to', '하차지')}
    <div class="hd-field"><label class="hd-check"><input type="checkbox" data-hd="say" ${F.say ? 'checked' : ''}> 상차지에 우리 물건이라고 말해 주세요</label>
      ${F.say ? `<div class="hd-chips">${chip('sayAs', '홈트레이더스', F.sayAs === '홈트레이더스')}${chip('sayAs', '에이스', F.sayAs === '에이스')}</div>` : ''}</div>
    <div class="hd-field"><label>차량</label><div class="hd-chips">${VEHICLES.map((v) => chip('vehicle', v, F.vehicle === v)).join('')}</div>
      <input class="hd-in" data-hd-in="vehicle" maxlength="100" value="${esc(VEHICLES.includes(F.vehicle) ? '' : F.vehicle)}" placeholder="직접 입력 (예: 1톤 탑차)"></div>
    <div class="hd-field"><label>운임</label><div class="hd-chips">${chip('pay', '현불', F.pay === '현불')}${chip('pay', '착불', F.pay === '착불')}</div></div>
    <div class="hd-field"><label>품목</label><div class="hd-chips">${GOODS.map((v) => chip('goods', v, F.goods === v)).join('')}</div>
      <input class="hd-in" data-hd-in="goods" maxlength="100" value="${esc(GOODS.includes(F.goods) ? '' : F.goods)}" placeholder="직접 입력 (예: 방킬라이 1PLT · 3m)"></div>
    <div class="hd-field"><label>무게</label><div class="hd-chips">${chip('weight', '최대중량', F.weight === '최대중량')}</div>
      <input class="hd-in" data-hd-in="weight" maxlength="100" value="${esc(F.weight === '최대중량' ? '' : F.weight)}" placeholder="예: 600kg"></div>
    <div class="hd-field"><label>일정 <span class="hd-opt-lab">(선택)</span></label><div class="hd-chips">${chip('sched', '오늘 상차 / 내일 하차', F.sched === '오늘 상차 / 내일 하차')}${chip('sched', '바로 상차 / 바로 하차', F.sched === '바로 상차 / 바로 하차')}</div>
      <input class="hd-in" data-hd-in="sched" maxlength="100" value="${esc(['오늘 상차 / 내일 하차', '바로 상차 / 바로 하차'].includes(F.sched) ? '' : F.sched)}" placeholder="예: 내일 오전 8시 착"></div>
    <div class="hd-field"><label>배차요청톡 미리보기</label><pre class="hd-pre" id="hd-pre">${esc(dispatchText())}</pre></div>
    <button type="button" class="hd-go" data-hd="submit">배차 요청 — 복사 + 출고 등록</button>
  </div>`;
}

// ── 입력·클릭 ──────────────────────────────────────────
// ctx = { rerender, goAce, goHomt, goStart }
export function bind(app, ctx) {
  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-hd]');
    if (!t) {
      if (F.open && !e.target.closest('.hd-field')) { const o = F.open; F.open = ''; updateList(o); }
      return;
    }
    const a = t.dataset.hd, k = t.dataset.t;
    if (['pick', 'pick-new', 'clear'].includes(a) && !SIDES.has(k)) return;
    if (a === 'go-ace') ctx.goAce();
    else if (a === 'go-homt') ctx.goHomt();
    else if (a === 'back') ctx.goStart();
    else if (a === 'pick') { F[k] = { ...search(F.q[k])[Number(t.dataset.i)] }; F.open = ''; F.q[k] = ''; ctx.rerender(); }
    else if (a === 'pick-new') { F[k] = { name: cut(F.q[k], MAX.name), addr: '', phone: '', kind: '직접' }; F.open = ''; F.q[k] = ''; ctx.rerender(); }
    else if (a === 'clear') { F[k] = null; F.open = k; ctx.rerender(); }
    else if (a === 'set') { const key = t.dataset.k; if (!SET_KEYS.has(key)) return; F[key] = F[key] === t.dataset.v && key !== 'pay' && key !== 'sayAs' ? '' : t.dataset.v; ctx.rerender(); }
    else if (a === 'say') { F.say = !!t.checked; ctx.rerender(); }
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
    const pre = document.getElementById('hd-pre'); if (pre) pre.textContent = dispatchText();
  });
}
// 다시 그린 뒤 검색칸이 열려 있었으면 커서를 돌려놓음 (공유 DB 갱신으로 화면이 새로 그려져도 치던 글자가 끊기지 않게)
export function afterRender() { if (F.open) focusQ(F.open); }
function focusQ(t) {
  const el = document.getElementById('hd-q-' + t);
  if (el) { el.focus(); const n = el.value.length; try { el.setSelectionRange(n, n); } catch (_) { /* 무시 */ } }
}

// 새로 적은 곳·빈 주소 채운 곳을 거래처(공유 DB)에 저장 — 다음부터 다른 직원 화면에도 뜸. 있던 주소는 덮어쓰지 않음
function savePlaces() {
  const whs = new Set(S.getWarehouses().map((w) => norm(w.name)));
  [F.from, F.to].forEach((p) => {
    if (!p || !p.name || p.kind === '택배' || whs.has(norm(p.name))) return;
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
  if (!F.vehicle) return alert('차량을 골라 주세요.');
  const text = dispatchText();
  const done = () => {
    savePlaces();
    S.addShipment({
      date: S.todayStr(), warehouse: cut(F.from.name, MAX.name), client: cut(F.to.name, MAX.name), status: '출고예정', method: '배차',
      name: cut(F.goods, MAX.text), qty: 0, unit: '', vehicle: cut(F.vehicle, MAX.phone), payment: F.pay,
      loadPlace: cut(F.from.name, MAX.name), loadAddr: cut(F.from.addr, MAX.addr), unloadPlace: cut(F.to.name, MAX.name), unloadAddr: cut(F.to.addr, MAX.addr),
      note: ['배차 요청함(홈트 첫 화면)', F.weight && `무게 ${cut(F.weight, MAX.phone)}`, F.sched && `일정 ${cut(F.sched, MAX.text)}`].filter(Boolean).join(' · '),
    });
    alert('배차요청톡을 복사했어요. 이음물류 카톡방에 붙여넣으세요.\n출고 목록에도 \'출고예정\'으로 등록했어요.');
    Object.assign(F, { from: null, to: null, vehicle: '', pay: '현불', goods: '건축자재', weight: '', sched: '', say: false, sayAs: '홈트레이더스', open: '', q: { from: '', to: '' } });
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
