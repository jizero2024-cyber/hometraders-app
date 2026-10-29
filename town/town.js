// 홈트 마을 /town (10/29 대표 "게임처럼 · 디자인만 먼저") — 마을 · 단지 · 사무실 · 창고 네 화면, 아직 예시 자료
// 주소 뒤 #/campus · #/office · #/warehouse 로 화면 바뀜. 직원 계정만 (공간 계정 막음)
import * as S from '/js/store-supabase.js?v=9t2';
import * as JIM from './jim.js?v=2';
import * as W3D from './v3d.js?v=16';
import * as O3D from './o3d.js?v=13';
import { portrait, KINDS } from './kit3d.js?v=3';

const stage = document.getElementById('stage');
const IMG = './img/';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hm = (d = new Date()) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
let timers = [];
const every = (ms, fn) => { const t = setInterval(fn, ms); timers.push(t); return t; };
const later = (ms, fn) => timers.push(setTimeout(fn, ms));
const clearAll = () => { timers.forEach((t) => { clearInterval(t); clearTimeout(t); }); timers = []; };

function fit() {   // 1440×900 판을 창에 맞춤
  const k = Math.min(window.innerWidth / 1440, window.innerHeight / 900);
  stage.style.transform = `scale(${k})`;
}
window.addEventListener('resize', fit);

const truckSvg = (c, c2) => `<svg width="52" height="40" viewBox="0 0 58 44" aria-hidden="true" style="display:block"><ellipse cx="29" cy="40" rx="24" ry="4" fill="#000" opacity=".12"/><rect x="2" y="6" width="34" height="26" rx="7" fill="${c}"/><rect x="2" y="6" width="34" height="9" rx="6" fill="#fff" opacity=".25"/><rect x="34" y="14" width="20" height="18" rx="6" fill="${c2}"/><rect x="39" y="17" width="10" height="7" rx="2" fill="#E6F4FF"/><circle cx="13" cy="34" r="6" fill="#4A3F3A"/><circle cx="13" cy="34" r="2.5" fill="#D8D0CB"/><circle cx="44" cy="34" r="6" fill="#4A3F3A"/><circle cx="44" cy="34" r="2.5" fill="#D8D0CB"/></svg>`;
const backBtn = (href, label) => `<a class="btn" href="${href}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>${label}</a>`;
// 걷기 — 방향 따라 앞·옆·뒷모습 그림을 번갈아 (발걸음). 그림: img/walk/<이름>_0~5 (0 앞 서기, 1 앞 걸음, 2·3 옆(오른쪽), 4·5 뒤)
const WALK = new Set(['seal', 'cat', 'beaver', 'dog', 'guppy', 'raccoon', 'squirrel', 'owl', 'turtle', 'otter', 'hedgehog', 'penguin', 'rabbit', 'panda', 'redpanda', 'driver', 'boss1', 'worker']);
const wf = (av, k) => `${IMG}walk/${av}_${k}.webp`;
function mover(layer, o) {   // o: {av, path(points [[x,y]...]), speed px/s, size, say, c, loop, done}
  const pts = o.pts, segs = []; let total = 0;
  for (let i = 1; i < pts.length; i++) { const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], L = Math.hypot(dx, dy); segs.push({ a: pts[i - 1], dx, dy, L, s: total }); total += L; }
  const hasW = WALK.has(o.av), size = o.size || 38;
  const n = el(`<div style="position:absolute;left:0;top:0;z-index:7;pointer-events:none;will-change:transform"><div style="position:absolute;left:0;top:0;transform:translate(-50%,-100%)">
    ${o.say ? `<div style="position:absolute;left:50%;bottom:100%;transform:translateX(-50%);white-space:nowrap;margin-bottom:4px;padding:5px 9px;border-radius:12px;background:#fff;box-shadow:0 4px 12px rgba(30,60,110,.2);font-size:11px;font-weight:800;color:${o.c || '#4A3F3A'}">${esc(o.say)}</div>` : ''}
    <span class="shadow"></span><img alt="" style="height:${Math.round(size * 1.05)}px;display:block"></div></div>`);
  const img = n.querySelector('img'); layer.appendChild(n);
  if (!hasW) img.src = `${IMG}${o.av}.webp`;
  if (hasW) for (let k = 0; k < 6; k++) { const pre = new Image(); pre.src = wf(o.av, k); }
  const speed = o.speed || 60, t0 = performance.now(); let d = 0, dir = 1, raf;
  const step = (now) => {
    if (!n.isConnected) return;
    const t = (now - t0) / 1000; let dist = t * speed;
    if (o.loop) { const cyc = dist % (total * 2); dist = cyc <= total ? cyc : total * 2 - cyc; dir = cyc <= total ? 1 : -1; } else if (dist >= total) { dist = total; }
    let sg = segs[segs.length - 1]; for (const g of segs) { if (dist <= g.s + g.L) { sg = g; break; } }
    const f = sg.L ? (dist - sg.s) / sg.L : 1, x = sg.a[0] + sg.dx * f, y = sg.a[1] + sg.dy * f;
    n.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
    const dx = sg.dx * dir, dy = sg.dy * dir, ph = Math.floor(now / 170) % 2, moving = o.loop || dist < total;
    if (hasW) {
      let k, flip = 1;
      if (!moving) k = 0; else if (Math.abs(dx) > Math.abs(dy) * 0.8) { k = 2 + ph; flip = dx < 0 ? -1 : 1; } else if (dy > 0) k = ph; else k = 4 + ph;
      const src = wf(o.av, k); if (img.dataset.k !== src) { img.src = src; img.dataset.k = src; } img.style.transform = `scaleX(${flip}) translateY(${moving && ph ? -2 : 0}px)`;
    } else { img.style.transform = `scaleX(${dx < 0 ? -1 : 1}) translateY(${Math.floor(now / 170) % 2 ? -3 : 0}px)`; }
    if (!o.loop && dist >= total) { if (o.done) o.done(n); else setTimeout(() => n.remove(), 300); return; }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step); return n;
}
const ptsOf = (path) => { const a = (path.match(/-?\d+(\.\d+)?/g) || []).map(Number), out = []; for (let i = 0; i + 1 < a.length; i += 2) out.push([a[i], a[i + 1]]); return out; };
function walker(layer, w) {   // 예전 호출 그대로 — 길(path 글자) 따라 걷기
  const pts = ptsOf(w.path); let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return mover(layer, { av: w.av, pts, speed: L / ((w.dur || 8) * 0.92), size: w.size || 38, say: w.say, c: w.c });
}
function sprite(layer, s) {   // 자리에 있는 직원 — 일하는 모양대로 움직임
  const FX = { keys: '<span class="fx fxk">타닥</span><span class="fx fxk" style="animation-delay:.5s;left:70%">탁</span>', coin: '<span class="fx fxc"></span><span class="fx fxc" style="animation-delay:.7s;left:65%"></span>',
    stamp: '<span class="fx fxs">쾅</span>', bub: '<span class="fx fxb"></span><span class="fx fxb" style="animation-delay:.6s;left:60%"></span><span class="fx fxb" style="animation-delay:1.2s;left:40%"></span>',
    msg: '<span class="fx fxm">···</span>', scan: '<span class="fx fxg"></span>', tape: '<span class="fx fxt"></span>', draw: '<span class="fx fxd"></span>', zz: '<span class="fx fxz">z</span>',
    map: '<span class="fx fxp"></span>', cup: '<span class="fx fxcup"></span>', tag: '<span class="fx fxtag"></span>', file: '<span class="fx fxf"></span>', count: '<span class="fx fxn">1·2·3</span>', print: '<span class="fx fxpr"></span>' };
  const n = el(`<div class="spr ${s.act || 'type'}" style="left:${s.x}px;top:${s.y}px;animation-delay:${(Math.random() * -3).toFixed(2)}s"><img src="${IMG}${s.av}.webp" alt="${esc(s.name || '')}" style="width:${s.size || 40}px;display:block;transform:scaleX(${s.flip || 1})">${FX[s.fx] || ''}</div>`);
  layer.appendChild(n); return n;
}
function puff(layer, x, y, d) {   // 공사장 먼지
  layer.appendChild(el(`<span class="puff" style="left:${x}px;top:${y}px;animation-delay:${d}s"></span>`));
}
function leaver(layer, path, txt, c, c2) {   // 상차장에서 나가는 트럭
  const n = el(`<div class="truck" style="offset-path: path('${path}'); animation: walk 7s ease-in both"><div style="position:relative;margin:-34px 0 0 -26px;width:52px">${truckSvg(c, c2)}<span class="pill" style="position:absolute;left:50%;top:-24px;transform:translateX(-50%);background:#fff;color:${c2};box-shadow:0 2px 8px rgba(0,0,0,.12);font-size:11px">${esc(txt)}</span></div></div>`);
  layer.appendChild(n); setTimeout(() => n.remove(), 7200);
}

// ── 마을 ───────────────────────────────────────────────
const T = (x, y) => [Math.round(x * 1.0227 - 20), Math.round(y * 1.0227)];   // 동네 그림 좌표 → 판 좌표
const PLACES = {
  gonggan: { name: '공간제작소 · 화성 우정', at: [225, 40], g: [300, 180], msg: '발주 3일째 기다려요 · 루나우드 1PLT', tone: 'red', wait: 'boss1' },
  woorim: { name: '우림주택 · 곤지암', at: [575, 18], g: [560, 170], msg: '메가타이 10/28 입고', tone: 'ok' },
  wonik: { name: '원익큐브 · 여주', at: [975, 30], g: [900, 230], msg: '실리콘 박스 출고 준비', tone: 'blue' },
  hanlim: { name: '한림 · 청주', at: [1045, 255], g: [1100, 460], msg: '명세서 팩스 왔어요', tone: 'blue' },
  seosaeng: { name: '공간제작소 · 울산 서생', at: [125, 308], g: [300, 550], msg: '5톤 혼적 내일 아침', tone: 'blue' },
  suncheon: { name: '공간제작소 · 순천 낙안', at: [195, 552], g: [300, 600], msg: '클립 대신화물 발송', tone: 'ok' },
  anmyeon: { name: '나인건축 · 태안 안면도', at: [760, 578], g: [700, 640], msg: '배차 기다림 4시간 · 원바', tone: 'amb', wait: 'boss2' },
  cheongdo: { name: '사람사는집 · 청도', at: [1035, 492], g: [1100, 470], msg: '철물 07:30 착', tone: 'blue' },
  gunsan: { name: '뉴하우징 · 군산 ↓', at: [480, 840], g: [470, 870], msg: 'OSB 40장 가는 중', tone: 'blue' },
  paju: { name: '← 뉴하우징 · 파주', at: [40, 470], g: [20, 560], msg: '에디톤 내일 아침 착', tone: 'blue' },
  home: { name: '홈트레이더스 · 천안 직산', at: [585, 190], g: [760, 440], msg: '오늘 출고 11건 · 상차 중 1', tone: 'ok' },
};
const TONE = { red: ['#FF5A4E', '#FFFFFF'], amb: ['#FFB547', '#5A3A00'], blue: ['#FFFFFF', '#2F6BD6'], ok: ['#FFFFFF', '#1E8E3E'] };
const ROADN = { D: [760, 440], J1: [840, 500], J2: [560, 585], J3: [300, 550], Jl: [20, 560], Jr: [1100, 460], Jb: [470, 870], Jtl: [300, 180], Jt: [560, 170], Jtr: [900, 230] };
const ROADE = [['D','J1'],['J1','J2'],['J2','J3'],['J3','Jl'],['J1','Jr'],['J2','Jb'],['J3','Jtl'],['Jtl','Jt'],['Jt','Jtr'],['Jtr','J1']];
function route(fromKey, toKey) {
  const pt = {}, adj = {}, d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
  Object.entries(ROADN).forEach(([k, [x, y]]) => { const [X, Y] = T(x, y); pt[k] = { x: X, y: Y }; });
  ROADE.forEach(([a, b]) => { (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a); });
  const P = (k) => { const [x, y] = T(...PLACES[k].g); return { x, y: y + 6 }; };
  const a = P(fromKey), b = P(toKey), near = (p) => Object.keys(pt).reduce((m, k) => (d(pt[k], p) < d(pt[m], p) ? k : m), 'D');
  const s0 = near(a), t0 = near(b), dist = { [s0]: 0 }, prev = {}, todo = new Set(Object.keys(pt));
  while (todo.size) {
    let u = null; todo.forEach((k) => { if (dist[k] != null && (u == null || dist[k] < dist[u])) u = k; });
    if (u == null || u === t0) break; todo.delete(u);
    (adj[u] || []).forEach((v) => { const nd = dist[u] + d(pt[u], pt[v]); if (dist[v] == null || nd < dist[v]) { dist[v] = nd; prev[v] = u; } });
  }
  const chain = []; for (let k = t0; k; k = prev[k]) { chain.unshift(pt[k]); if (k === s0) break; }
  const pts = [a, ...chain, b].filter((p, i, arr) => i === 0 || d(p, arr[i - 1]) > 4);
  let L = 0; for (let i = 1; i < pts.length; i++) L += d(pts[i], pts[i - 1]);
  return { path: 'M ' + pts.map((p) => `${p.x} ${p.y}`).join(' L '), a, b, L };
}
const COLORS = [['#7FB2FF', '#3F7FE0'], ['#FFC56B', '#E07B1F'], ['#A6E3B8', '#2E9A5A'], ['#F7A8C8', '#C9457E'], ['#C3B4FF', '#6A52D8']];
const short = (k) => PLACES[k].name.replace(/[←↓]/g, '').split(' · ').pop().trim();
const V = { jobs: [
  { id: 'a', to: 'gonggan', item: '구조재 2*6*12 6PLT', st: 'open' },
  { id: 'b', to: 'anmyeon', item: '원바', st: 'open' },
  { id: 'c', to: 'paju', item: '에디톤 25박스', st: 'open' },
  { id: 'd', to: 'suncheon', item: '클립 200 · 대신화물', st: 'open' },
], dispOpen: false, drops: [{ name: '원익_거래명세표(양산).png', t: '08:55', st: 2 }, { name: '이음물류_대화내역.txt', t: '08:58', st: 2 }], log: [] };

function village() {
  const v = el(`<div class="v v3">
    <button id="mail" type="button" aria-label="자료 넣기" style="display:none"><b id="ndrop"></b></button>
    <div style="position:absolute;right:24px;bottom:24px;display:flex;flex-direction:column;gap:6px;z-index:8"><button id="zin" type="button" class="btn" style="width:46px;justify-content:center;padding:0;font-size:22px">+</button><button id="zout" type="button" class="btn" style="width:46px;justify-content:center;padding:0;font-size:22px">−</button><button id="zre" type="button" class="btn" style="width:46px;justify-content:center;padding:0;font-size:12px">전체</button></div>
    <div style="position:absolute;left:20px;top:20px;display:flex;gap:10px;align-items:center;z-index:8">
      <div class="card" style="padding:9px 15px;border-radius:18px"><div style="font-size:12px;color:#8A7E77" id="vdate"></div><div style="display:flex;align-items:baseline;gap:8px"><div style="font-size:24px;font-weight:800;letter-spacing:-.02em;line-height:1.1" id="vclock"></div><div id="vwx" style="font-size:13px;font-weight:700;color:#5B6B7C"></div></div></div>
      <button id="dispBtn" class="btn" type="button" style="height:48px"><img src="${IMG}cat.webp" alt="">배차 사무실 <b id="njobs"></b></button>
      <a class="btn or" href="#/campus" style="height:48px">우리 단지</a>
      <button type="button" class="btn boardBtn" style="height:48px;background:#FFE680;color:#5A4A00">할 일 칠판</button>
      <a class="btn" href="#/jim" style="height:48px">짐짜기</a>
    </div>
    <div id="disp" class="card pnl" style="position:absolute;left:20px;top:96px;width:260px;overflow:hidden;z-index:8;display:none"></div>
    <div style="position:absolute;left:22px;bottom:22px;display:flex;align-items:flex-end;gap:4px;z-index:8;pointer-events:none">
      <img class="bob" src="${IMG}seal.webp" alt="김맥순" style="width:86px">
      <div class="card" style="margin-bottom:62px;max-width:230px;padding:11px 14px;border-radius:18px 18px 18px 6px"><div style="font-size:11px;font-weight:800;color:#E8732C">김맥순</div><div id="kbub" style="font-size:13px;font-weight:500;line-height:1.45;margin-top:2px"></div></div>
    </div>
    <button id="chatBtn" type="button" class="btn" style="position:absolute;right:24px;top:20px;z-index:9;height:52px"><img src="${IMG}seal.webp" alt="" style="width:38px;height:38px">김맥순과 대화</button>
    <div id="chatP" class="card pnl" style="position:absolute;right:24px;top:84px;bottom:24px;width:380px;border-radius:28px;display:none;flex-direction:column;overflow:hidden;z-index:8">
      <div style="display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid #F3EEE9"><span style="width:46px;height:46px;border-radius:50%;background:#FFF1E6;display:flex;align-items:center;justify-content:center"><img src="${IMG}seal.webp" alt="" style="width:40px"></span><div style="flex:1"><div style="font-size:16px;font-weight:800">김맥순</div><div style="font-size:12px;color:#8A7E77;display:flex;align-items:center;gap:5px"><span style="width:7px;height:7px;border-radius:50%;background:#34C759"></span>홈트레이더스 · 일하는 중</div></div></div>
      <div id="chat" class="scroll" style="flex:1;padding:16px 18px;display:flex;flex-direction:column;gap:10px;background:#FBF8F5"></div>
      <div style="padding:12px 14px 14px;border-top:1px solid #F3EEE9;display:flex;gap:8px;align-items:flex-end">
        <textarea id="cin" rows="3" placeholder="거래처 카톡 붙여 넣기" aria-label="거래처 카톡 붙여 넣기" style="flex:1;resize:none;border:1.5px solid #F0E6DD;border-radius:16px;padding:10px 12px;font:inherit;font-size:13px;line-height:1.45;outline:none">공간제작소 발주건이야
안녕하세요~
유도모음통 15BOX
걸이쇠 6BOX
용마루벤트 20BOX
루나우드 1PLT
발주 부탁드리겠습니다!</textarea>
        <button id="csend" type="button" aria-label="보내기" style="width:48px;height:48px;flex:none;border:0;border-radius:16px;background:#E8732C;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
      </div>
    </div>
  </div>`);
  stage.appendChild(v);
  // 진짜 3D 마을 (10/29 대표 "진짜 3D로 다시")
  const host = el('<div class="w3host" style="position:fixed;inset:0;z-index:0;background:#BFE3FF"></div>'); document.body.querySelectorAll('.w3host').forEach((n) => n.remove()); document.body.prepend(host);   // 화면 꽉 (10/29 대표 "양옆도 꽉")
  const W = W3D.mount(host, { alive: () => v.isConnected, portrait, places: PLACES, tone: TONE, esc, img: IMG, wf,
    onPick: (k) => { if (k === 'office') location.hash = '#/office'; else if (k === 'warehouse') location.hash = '#/warehouse'; else if (k === 'mail') v.querySelector('#mail').click(); else openPlace(k); },
    onDrop: (f) => addDrops(f), onWeather: (w) => { v.querySelector('#vwx').textContent = `${w.temp != null ? Math.round(w.temp) + '° ' : ''}${w.label}`; } });
  v.querySelector('#zin').onclick = () => W.zoom(0.75); v.querySelector('#zout').onclick = () => W.zoom(1.33); v.querySelector('#zre').onclick = () => W.reset();
  v.addEventListener('click', (e) => { const b = e.target.closest('[data-pk]'); if (b) openPlace(b.dataset.pk); });
  function openPlace(k) {   // 거래처 카드
    const p = PLACES[k]; if (!p) return; if (k === 'home') { location.hash = '#/campus'; return; }
    const ORD = { gonggan: ['10/29 구조재 2*6*12 6PLT · 배차 필요', '10/28 유도모음통 15BOX · 하차 완료', '발주 3일째: 루나우드 1PLT · 용마루벤트'], anmyeon: ['10/29 원바 · 배차 기다림 4시간'], hanlim: ['10/28 SPF 2*4*12 80 · 명세서 받음', '10/29 OSB 40장 → 군산 이동 중'], wonik: ['10/29 세라믹 판재 · 실리콘 박스 출고 준비'], woorim: ['10/28 메가타이 철물 · 창고 입고 · 구매 10/28-20'] };
    const m = el(`<div class="modal"><div class="card pnl" style="width:460px;border-radius:26px;padding:22px 24px;display:flex;flex-direction:column;gap:12px"><div style="display:flex;align-items:center;gap:10px"><div style="flex:1"><div style="font-size:12px;color:#8A7E77">거래처</div><div style="font-size:22px;font-weight:800">${esc(p.name.replace(/[←↓]/g, '').trim())}</div></div><button type="button" class="x" style="width:40px;height:40px;border:0;border-radius:12px;background:#F4EFEA;font-size:18px;cursor:pointer">✕</button></div>
      <div style="padding:10px 12px;border-radius:14px;background:${TONE[p.tone][0] === '#FFFFFF' ? '#F6F2EE' : TONE[p.tone][0]};color:${TONE[p.tone][1] === '#FFFFFF' ? '#fff' : TONE[p.tone][1]};font-weight:800;font-size:14px">${esc(p.msg)}</div>
      <div style="font-size:13px;font-weight:800;color:#8A7E77">진행 중</div>${(ORD[k] || ['진행 중인 출고 없음']).map((o) => `<div style="padding:9px 12px;border-radius:12px;background:#FBF8F5;font-size:13px">${esc(o)}</div>`).join('')}
      <div style="display:flex;gap:8px;margin-top:4px"><button type="button" class="btn or x2">배차 요청</button><button type="button" class="btn x2">견적 요청</button><button type="button" class="btn x2">카톡 보기</button></div></div></div>`);
    v.appendChild(m); m.onclick = (ev) => { if (ev.target === m || ev.target.closest('.x')) m.remove(); if (ev.target.closest('.x2')) { ev.target.textContent = '준비 중'; } };
  }
  // 트럭
  const addTruck = (t) => { const [c, c2] = COLORS[t.c % 5]; return W.addTruck({ from: t.from, to: t.to, c, c2, title: `${esc(short(t.from))} <span style="color:${c2}">→</span> ${esc(short(t.to))}`, sub: t.sub, dur: t.dur, delay: t.delay, loop: t.delay < 0 }); };
  // 거래처 말풍선 = 실제 출고 건 (10/29 대표 "응, 실제로")
  function placeMsgs(L) {
    const rows = (L.flow && L.flow.rows) || [], today = (L.flow && L.flow.today) || mdOf(new Date()), tmr = mdOf(new Date(Date.now() + 864e5));
    const has = (x, k) => (x.steps || []).includes(k), by = {};
    rows.forEach((x) => { const k = lotOf(x); if (k) (by[k] = by[k] || []).push(x); });
    const sup = {}; L.today.forEach((x) => { const f = (FROM.find(([re]) => re.test(`${x.from || ''} ${x.memo || ''}`)) || [])[1]; if (f) sup[f] = (sup[f] || 0) + 1; });
    Object.keys(PLACES).forEach((k) => {
      if (k === 'home') { W.setPlace(k, `오늘 출고 ${L.shipped.length} / ${L.today.length}${L.needDisp.length ? ` · 배차 요청 ${L.needDisp.length}` : ''}`, L.needDisp.length ? 'amb' : 'ok'); return; }
      const rs = by[k] || [], nd = rs.filter((x) => has(x, '배차 요청') && [today, tmr].includes(x.day)), sh = rs.filter((x) => x.day === today && (has(x, '배차 완료') || has(x, '출고 완료')));
      const old = rs.filter((x) => (has(x, '발주') || has(x, '배차 요청')) && (x.md || 0) && x.day < today && !has(x, '배차 완료') && !has(x, '출고 완료'));
      if (old.length) W.setPlace(k, `기다림 ${old.length}건 · ${old[0].item || old[0].site || ''}`.slice(0, 34), 'red', k === 'anmyeon' ? 'boss2' : 'boss1');
      else if (nd.length) W.setPlace(k, `배차 요청 ${nd.length} · ${nd[0].day}${nd[0].time ? ' ' + nd[0].time : ''}`, 'amb');
      else if (sh.length) W.setPlace(k, `오늘 출고 ${sh.length} · ${sh[0].veh || sh[0].site || ''}`.slice(0, 34), 'ok');
      else if (sup[k]) W.setPlace(k, `오늘 상차 ${sup[k]}`, 'blue');
      else W.setPlace(k, '');
    });
  }
  // 트럭 = 오늘 실제 배차·출고 건만 (10/29 대표 "안 싣고 다니는 차는 없애") — 거래처 이름으로 마을 자리 찾기
  const FROM = [[/원익/, 'wonik'], [/한림/, 'hanlim'], [/우림/, 'woorim']];
  live().then((L) => { if (!v.isConnected) return; L.shipped.slice(0, 8).forEach((x, i) => {
    const to = lotOf(x); if (!to) return;
    const from = (FROM.find(([re]) => re.test(`${x.from || ''} ${x.memo || ''}`)) || [])[1] || 'home'; if (from === to) return;
    const done = (x.steps || []).includes('출고 완료');
    addTruck({ from, to, c: i, dur: 50 + i * 7, delay: -(i * 9 + 5), sub: `${done ? '출고 완료' : '배차 완료'} · ${x.site || ''} · ${x.veh || ''} ${x.time || ''}`.replace(/\s+/g, ' ').trim() });
  }); });
  // 배차 사무실 — 실제 배차 요청 건 (출고 흐름과 같은 자료)
  const disp = v.querySelector('#disp'); let LL = null;
  const drawDisp = () => {
    const nd = LL ? LL.needDisp : []; v.querySelector('#njobs').textContent = nd.length || '';
    disp.innerHTML = `<div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#FFF1E6"><img src="${portrait('cat')}" alt="" style="width:40px"><div><div style="font-size:15px;font-weight:800">배차 사무실</div><div style="font-size:12px;color:#C2551A;font-weight:700">배차 요청 ${nd.length}</div></div></div>
      <div class="scroll" style="padding:6px 8px 8px;max-height:420px">${nd.map((x) => `<div style="padding:8px;border-radius:12px"><div style="font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.partner)} · ${esc(x.site || '')}</div><div style="font-size:11px;color:#8A7E77;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.day)} ${esc(x.time || '')} · ${esc(x.item || '')}</div></div>`).join('') || '<div style="padding:10px;font-size:13px;color:#8A7E77">배차 요청 없음</div>'}
      <a class="btn or" href="/" target="_blank" rel="noopener" style="margin:6px 4px 2px;height:40px;font-size:13px">출고 흐름 열기 ↗</a></div>`;
  };
  v.querySelector('#dispBtn').onclick = () => { V.dispOpen = !V.dispOpen; disp.style.display = V.dispOpen ? 'block' : 'none'; };
  // 김맥순 대화 — 붙여 넣은 카톡은 실제 자료 넣기로 (15분 빠른 반영이 출고일보에 넣음)
  const chat = v.querySelector('#chat'), chatP = v.querySelector('#chatP'), chatBtn = v.querySelector('#chatBtn');
  chatBtn.onclick = () => { const o2 = chatP.style.display !== 'flex'; chatP.style.display = o2 ? 'flex' : 'none'; chatBtn.classList.toggle('or', o2); };
  const bubble = (html, me) => { chat.appendChild(el(`<div style="align-self:${me ? 'flex-end' : 'flex-start'};max-width:${me ? 290 : 320}px;padding:11px 14px;border-radius:${me ? '18px 18px 6px 18px' : '18px 18px 18px 6px'};background:${me ? '#E8732C' : '#fff'};color:${me ? '#fff' : 'inherit'};font-size:14px;line-height:1.5;white-space:pre-line;box-shadow:0 1px 3px rgba(0,0,0,.05);animation:rowin .35s ease-out both">${html}</div>`)); chat.scrollTop = chat.scrollHeight; };
  const say = (t) => bubble(esc(t));
  v.querySelector('#cin').value = '';
  v.querySelector('#csend').onclick = async () => {
    const ta = v.querySelector('#cin'), t = ta.value.trim(); if (!t) return; ta.value = ''; bubble(esc(t), true);
    const r = await putInbox([t]); say(r.err ? `못 넣었어요 — ${r.err}` : '자료 넣기에 넣었어요. 15분 안에 출고일보에 반영돼요.'); load();
  };
  // 자료 넣기 (우체통) — 실제로 올림
  const mail = v.querySelector('#mail');
  const addDrops = async (files) => { const r = await putInbox(files); say(r.err ? `못 넣었어요 — ${r.err}` : `자료 ${r.ok}개 넣었어요. 읽고 출고 건에 넣을게요.`); load(); };
  mail.onclick = () => {
    const st = { wait: ['받음', '#C2551A'], got: ['읽는 중', '#2F7BF6'], done: ['반영', '#1E8E3E'], check: ['확인 필요', '#B07A00'] };
    const m = el(`<div class="modal"><div class="card" style="width:600px;border-radius:28px;padding:22px 24px;display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:center;gap:12px"><div style="flex:1"><div style="font-size:20px;font-weight:800">자료 넣기</div><div style="font-size:12px;color:#8A7E77">카톡 · 사진 · PDF · 엑셀 · 명세서</div></div><button type="button" class="mx" aria-label="닫기" style="width:40px;height:40px;border:0;border-radius:12px;background:#F4EFEA;font-size:18px;cursor:pointer">✕</button></div>
      <label class="zone" style="display:flex;align-items:center;justify-content:center;height:130px;border:2.5px dashed #EAD9C9;border-radius:22px;background:#FFFBF7;cursor:pointer;font-size:16px;font-weight:800;color:#4A3F3A">여기에 끌어다 놓기<input type="file" multiple style="display:none"></label>
      <div style="display:flex;gap:8px;align-items:flex-end"><textarea rows="2" placeholder="카톡 내용 붙여 넣기" style="flex:1;resize:none;border:1.5px solid #F0E6DD;border-radius:14px;padding:10px 12px;font:inherit;font-size:13px;outline:none"></textarea><button type="button" class="btn or dadd" style="height:48px">넣기</button></div>
      <div class="dmsg" style="font-size:12px;color:#8A7E77"></div>
      <div class="scroll" style="display:flex;flex-direction:column;gap:6px;max-height:220px">${(LL ? LL.inbox : []).slice(0, 12).map((x) => prow(`${esc(x.name || '')} <span style="color:#8A7E77">${esc(x.created_by || '')} ${tOf(x.created_at)}</span>`, (st[x.status] || [x.status])[0], `color:${(st[x.status] || [0, '#8A7E77'])[1]}`)).join('')}</div></div></div>`);
    v.appendChild(m);
    const go = async (its) => { m.querySelector('.dmsg').textContent = '올리는 중…'; const r = await putInbox(its); m.querySelector('.dmsg').textContent = r.err ? `못 넣었어요 — ${r.err}` : `${r.ok}건 넣었어요`; load(); };
    m.onclick = (e) => { if (e.target === m || e.target.closest('.mx')) m.remove(); };
    const z = m.querySelector('.zone'); z.ondragover = (e) => { e.preventDefault(); z.style.borderColor = '#E8732C'; }; z.ondragleave = () => { z.style.borderColor = '#EAD9C9'; }; z.ondrop = (e) => { e.preventDefault(); z.ondragleave(); go([...(e.dataTransfer.files || [])]); };
    m.querySelector('input[type=file]').onchange = (e) => go([...(e.target.files || [])]);
    m.querySelector('.dadd').onclick = () => { const t = m.querySelector('textarea').value.trim(); if (t) go([t]); };
  };
  // 시계 · 김맥순 말 — 실제 숫자로
  let lines = ['자료 불러오는 중이에요.'], li = 0;
  const tick = () => { const n = new Date(); v.querySelector('#vclock').textContent = hm(n); v.querySelector('#vdate').textContent = `${n.getMonth() + 1}월 ${n.getDate()}일 ${'일월화수목금토'[n.getDay()]}요일`; };
  const say2 = () => { v.querySelector('#kbub').textContent = lines[li++ % lines.length]; };
  const load = () => live().then((L) => { if (!v.isConnected) return; LL = L; drawDisp(); placeMsgs(L);
    const bad = ((L.ai && L.ai.workers) || []).filter((w) => w.st === 'bad');
    lines = [`오늘 출고 ${L.shipped.length} / ${L.today.length}건이에요.`, L.needDisp.length ? `배차 요청 ${L.needDisp.length}건 남았어요.` : '배차 요청은 다 잡혔어요.', L.checks.length ? `확인 칠판에 전표 ${L.checks.length}건 있어요.` : '확인할 전표 없어요.', ...bad.map((w) => `${w.who}: ${w.note}`), L.unpaid.length ? `기사님 운임 미송금 ${L.unpaid.length}건이에요.` : ''].filter(Boolean); });
  say('카톡을 붙여 넣으면 자료 넣기에 넣어요. 15분 안에 출고일보에 반영돼요.');
  tick(); say2(); load(); every(20000, tick); every(4200, say2); every(60000, load);
}

// ── 단지 ───────────────────────────────────────────────
function campus() {
  const k = 1392 / 1344;
  const P = (x, y) => [Math.round(x * k), Math.round(y * k)];
  const v = el(`<div class="v" style="background:#D8E9FA">
    <div style="position:absolute;left:24px;top:20px;display:flex;gap:10px;align-items:center;z-index:8">${backBtn('#/', '마을')}<div class="card" style="padding:8px 16px;border-radius:14px"><div style="font-size:12px;color:#8A7E77">천안 서북구 직산읍 신갈리</div><div style="font-size:18px;font-weight:800">홈트레이더스 단지</div></div></div>
    <div style="position:absolute;right:24px;top:20px;display:flex;gap:8px;z-index:8"><a class="btn or" href="#/office">사무실 들어가기</a><a class="btn" href="#/warehouse" style="color:#B07A2A">창고 들어가기</a></div>
    <div id="cp" style="position:absolute;left:24px;top:96px;width:1392px;height:779px">
      <img src="${IMG}campus_e.webp" alt="홈트레이더스 단지 — 왼쪽 6층 사무실, 오른쪽 높은 창고, 가운데 넓은 앞마당" style="width:1392px;height:779px;display:block">
      <img src="/icons/logo-full.png" alt="홈트레이더스 로고" style="position:absolute;left:357px;top:37px;width:58px;z-index:2">
      <a class="hot" href="#/office" aria-label="사무실 들어가기" style="left:92px;top:36px;width:420px;height:530px"></a>
      <a class="hot" href="#/warehouse" aria-label="창고 들어가기" style="left:846px;top:46px;width:448px;height:560px"></a>
      <span class="pill" style="position:absolute;left:108px;top:6px;background:#E8732C;color:#fff;font-size:13px;z-index:3">사무실 6층</span>
      <span class="pill" style="position:absolute;left:862px;top:16px;background:#B07A2A;color:#fff;font-size:13px;z-index:3">창고</span>
      ${[728, 752, 776, 800, 824].map((x, i) => `<span class="glow" style="left:${x}px;top:${i === 0 || i === 4 ? 458 : 452}px;animation-delay:${i * 0.4}s"></span>`).join('')}
      <span class="zz" style="left:286px;top:594px">z</span><span class="zz" style="left:372px;top:588px;animation-delay:.9s">z</span><span class="zz" style="left:640px;top:452px;animation-delay:1.6s">z</span>
      <div id="cb"></div>
    </div></div>`);
  stage.appendChild(v);
  const cp = v.querySelector('#cp'), cb = v.querySelector('#cb');
  const B = [
    [305, 84, '김맥순 · 오늘 출고 11건', '#E8732C'], [1176, 392, '키오스크 · 박건 기사님 체크인', '#3F7FE0'], [1302, 496, '빨리 · 2*6*12 120본 남음', '#B07A2A'],
    [1020, 512, '노훈님 · 5톤 상차 중', '#2E4A7A'], [330, 610, '쉬는 중 · 빈백', '#2E9A5A'], [780, 440, '와인바 18시 오픈', '#9A6A00'],
  ];
  cb.innerHTML = B.map(([x, y, t, c], i) => `<div class="bub" style="left:${x}px;top:${y}px;animation-delay:0s, ${(i % 3) * -0.6}s"><div style="max-width:200px;padding:7px 11px;border-radius:14px;background:#fff;color:${c};font-size:12px;font-weight:800;text-align:center;box-shadow:0 6px 16px rgba(30,60,110,.18)">${esc(t)}</div><div class="tail" style="background:#fff"></div></div>`).join('');
  [['cat', 290, 632, 'nap', 34], ['rabbit', 380, 634, 'nap', 32], ['otter', 634, 482, 'nap', 30], ['driver', 1175, 424, 'phone', 34], ['dog', 1302, 522, 'type', 38], ['driver', 1024, 540, 'sway', 30],
   ['seal', 300, 120, 'sway', 26], ['beaver', 218, 218, 'type', 24], ['owl', 280, 222, 'type', 22], ['raccoon', 186, 296, 'type', 22], ['otter', 250, 298, 'type', 22], ['hedgehog', 318, 296, 'type', 22],
   ['squirrel', 240, 372, 'type', 22], ['turtle', 304, 372, 'type', 22], ['penguin', 364, 374, 'type', 22], ['cat', 214, 470, 'point', 22], ['rabbit', 276, 454, 'phone', 20], ['panda', 330, 464, 'type', 22], ['redpanda', 196, 540, 'type', 22]]
    .forEach(([av, x, y, act, size]) => sprite(cp, { av, x, y, act, size }));
  const EV = [
    { name: '이음이', av: 'cat', c: '#5D6B7A', say: '창고 재고 보러 가요', path: 'M 300 560 L 470 600 L 700 620 L 900 570 L 1120 450' },
    { name: '빨리', av: 'dog', c: '#B07A2A', say: '재고 보고하러 사무실 가요', path: 'M 1120 450 L 900 570 L 700 620 L 470 600 L 300 560' },
    { name: '펭송', av: 'penguin', c: '#2E4A7A', say: '송장 들고 창고로 가요', path: 'M 320 565 L 520 640 L 760 650 L 960 580 L 1130 455' },
    { name: '수달', av: 'otter', c: '#8A6A4A', say: '와인바에서 잠깐 쉬어요', path: 'M 300 560 L 470 600 L 640 610 L 760 560' },
    { name: '그림이', av: 'redpanda', c: '#C2551A', say: '박스 시안 들고 창고로', path: 'M 280 560 L 500 650 L 800 650 L 1000 560 L 1140 450' },
  ];
  const leaves = ['서생행 출발', '매향리행 출발', '순천 택배 출발'];
  let e = 0; const go = () => { walker(cp, EV[e % EV.length]); later(3500, () => leaver(cp, 'M 1090 520 L 1190 600 L 1330 650', leaves[e % 3], ...COLORS[e % 2])); e++; };
  go(); every(9000, go);
  void P;
}

// ── 사무실 ─────────────────────────────────────────────
const STAFF = [
  { name: '김맥순', animal: '물범', floor: '6층', role: '대표 · 전체 지휘 · 출고일보', status: '일하는 중', x: 336, y: 77, c: '#E8732C', bg: '#FFF1E6', av: 'seal', say: '오늘 출고 11건, 다들 잘하고 있어요' },
  { name: '뚝딱', animal: '비버', floor: '5층', role: '견적서 만들기', status: '일하는 중', x: 244, y: 190, c: '#9A6A3A', bg: '#F6ECE0', av: 'beaver', say: '공간 매향리 견적서 만들었어요' },
  { name: '부엉', animal: '부엉이', floor: '5층', role: '단가 · 종전가 · 마진', status: '일하는 중', x: 305, y: 196, c: '#8A7E6A', bg: '#F3EFE8', av: 'owl', say: '판가가 매입가보다 낮아요, 확인!' },
  { name: '콩알', animal: '너구리', floor: '4층', role: '이카운트 구매·판매 입력', status: '일하는 중', x: 219, y: 284, c: '#5D6B7A', bg: '#EEF1F4', av: 'raccoon', say: '우림 구매 10/28-20 넣었어요' },
  { name: '수달', animal: '수달', floor: '4층', role: '운임 송금 · 입금 확인', status: '일하는 중', x: 286, y: 288, c: '#8A6A4A', bg: '#F4ECE3', av: 'otter', say: '기사 운임 미송금 2건 있어요' },
  { name: '고슴', animal: '고슴도치', floor: '4층', role: '공간 명세표 · 전표', status: '일하는 중', x: 359, y: 286, c: '#6A52D8', bg: '#EFEBFF', av: 'hedgehog', say: '공간 전표 PDF 올렸어요' },
  { name: '도토리', animal: '다람쥐', floor: '3층', role: '거래명세표', status: '일하는 중', x: 269, y: 372, c: '#E0662F', bg: '#FFEDE3', av: 'squirrel', say: '공간 10월 명세표 뽑는 중이에요' },
  { name: '꼬북', animal: '거북이', floor: '3층', role: '자재승인원 서류', status: '기다리는 중', x: 344, y: 372, c: '#2E9A5A', bg: '#E6F7EC', av: 'turtle', say: '오웬스 승인원 묶음 준비됐어요' },
  { name: '펭송', animal: '펭귄', floor: '3층', role: '전자 송장 · 납품확인서', status: '기다리는 중', x: 413, y: 375, c: '#2E4A7A', bg: '#E6EEF9', av: 'penguin', say: '청주 송장 링크 보냈어요' },
  { name: '이음이', animal: '회색 고양이', floor: '2층', role: '배차 · 이음 운임', status: '일하는 중', x: 240, y: 484, c: '#5D6B7A', bg: '#EEF1F4', av: 'cat', say: '서생 5톤 혼적 가는 중이에요' },
  { name: '토깽', animal: '토끼', floor: '2층', role: '텔레그램 질문 · 공지', status: '다음 14:30', x: 306, y: 461, c: '#C9457E', bg: '#FDEAF2', av: 'rabbit', say: '내일 아침 배차 공지 보낼게요' },
  { name: '눈썰미', animal: '판다', floor: '2층', role: '사진·명세서 읽기', status: '기다리는 중', x: 365, y: 475, c: '#3A3A3A', bg: '#F0F0F0', av: 'panda', say: '원익 명세서 7장 읽었어요' },
  { name: '받아쓰기', animal: '구피', floor: '2층', role: '비토 통화 정리', status: '다음 15:17', x: 422, y: 484, c: '#3F7FE0', bg: '#E6F0FF', av: 'guppy', say: '정소장 통화 요약했어요' },
  { name: '그림이', animal: '레서판다', floor: '1층', role: '디자인 · 박스·팜플렛 · 안내', status: '일하는 중', x: 230, y: 564, c: '#C2551A', bg: '#FFEDE3', av: 'redpanda', say: '실리콘 박스 시안 3개 만들었어요' },
];
// 실제 자료 (10/29 대표 "AI 가 무슨 작업 · 얼마나 · 누가 확인 — 의미 없는 가짜는 빼")
let ME = '';
const AI = [   // 실제로 돌아가는 AI 작업만. kind: task = 할 일 0 이면 마당에서 쉼, feed = 계속 받는 일
  { k: 'seal', who: '김맥순', job: '출고일보', av: 'seal', f: 4, x: 8, kind: 'feed' },
  { k: 'raccoon', who: '콩알', job: '이카운트 받기 · 입력', av: 'raccoon', f: 3, x: -12, kind: 'task' },
  { k: 'otter', who: '수달', job: '운임 미송금', av: 'otter', f: 3, x: 0, kind: 'task' },
  { k: 'hedgehog', who: '고슴', job: '공간 사이트 전표', av: 'hedgehog', f: 3, x: 12, kind: 'task' },
  { k: 'squirrel', who: '도토리', job: '전표 PDF · 명세서', av: 'squirrel', f: 2, x: 2, kind: 'feed' },
  { k: 'cat', who: '이음이', job: '배차', av: 'cat', f: 1, x: -12, kind: 'task' },
  { k: 'guppy', who: '받아쓰기', job: '비토 통화', av: 'guppy', f: 1, x: 0, kind: 'feed' },
  { k: 'rabbit', who: '토깽', job: '문자 · 텔레그램', av: 'rabbit', f: 1, x: 12, kind: 'feed' },
  { k: 'redpanda', who: '그림이', job: '디자인 · 카탈로그', av: 'redpanda', f: 0, x: 4, kind: 'task' },
];
const PAMPH = ['표지', '제품 소개', '부속자재', '시공 순서', '기능 상세', '뒷표지 주소', '인쇄소 보내기'];
const mdOf = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
const tOf = (iso) => (iso ? String(iso).slice(11, 16) : '');
function lotOf(x) {   // 출고 건 → 마을 자리 (거래처 + 현장 이름)
  const p = x.partner || '', t = `${x.site_full || ''} ${x.site || ''} ${x.item || ''}`;
  if (/공간/.test(p)) return /서생|울산/.test(t) ? 'seosaeng' : /순천|낙안/.test(t) ? 'suncheon' : 'gonggan';
  if (/뉴하우징/.test(p)) return /파주/.test(t) ? 'paju' : 'gunsan';
  return [[/한림/, 'hanlim'], [/원익/, 'wonik'], [/우림/, 'woorim'], [/나인/, 'anmyeon'], [/사람사는/, 'cheongdo']].reduce((a, [re, k]) => a || (re.test(p) ? k : ''), '') || '';
}
async function live() {
  const r = await Promise.allSettled([S.getTownAI(), S.getFlowBoard(), S.getFlowMarks(), S.getFareUnpaid(), S.listSongjang(), S.getGongganWaitCount(), S.getTownInbox(), S.getTownChecks()]);
  const g = (i, d) => (r[i].status === 'fulfilled' && r[i].value != null ? r[i].value : d);
  const L = { ai: g(0, null), flow: g(1, null), marks: g(2, {}), fare: g(3, []), sj: g(4, []), gwait: g(5, 0), inbox: g(6, []), chk: g(7, []) };
  const rows = (L.flow && L.flow.rows) || [], today = (L.flow && L.flow.today) || mdOf(new Date()), yst = mdOf(new Date(Date.now() - 864e5)), tmr = mdOf(new Date(Date.now() + 864e5));
  const has = (x, k) => (x.steps || []).includes(k);
  L.today = rows.filter((x) => x.day === today && ['배차 요청', '배차 완료', '출고 완료'].some((k) => has(x, k)));
  L.shipped = L.today.filter((x) => has(x, '출고 완료') || has(x, '배차 완료'));
  L.needDisp = rows.filter((x) => has(x, '배차 요청') && [today, tmr].includes(x.day));
  L.miss = rows.filter((x) => has(x, '입력 누락'));
  L.unpaid = L.fare.filter((x) => !x.sent);
  L.checks = rows.filter((x) => [yst, today, tmr].includes(x.day) && ['배차 완료', '출고 완료', '기록', '입력 누락', '입력 완료'].some((k) => has(x, k)) && !L.marks[`slipok:${x.case || x.no}`]);
  L.inCheck = L.inbox.filter((x) => x.status === 'check');
  L.chkOn = PAMPH.map((_, i) => (L.chk.find((c) => c.id === `pamph:${i}`) || {}).status === 'on');
  const aiw = (k) => ((L.ai && L.ai.workers) || []).find((w) => w.k === k) || { st: 'ok', note: '' };
  const W = {
    seal: { n: L.checks.length, line: `출고 ${L.shipped.length} / ${L.today.length}`, st: aiw('seal').st, note: aiw('seal').note },
    raccoon: { n: L.miss.length, line: aiw('raccoon').st === 'bad' ? '받기 멈춤' : `입력 누락 ${L.miss.length}`, st: aiw('raccoon').st, note: aiw('raccoon').note },
    otter: { n: L.unpaid.length, line: `미송금 ${L.unpaid.length}`, st: 'ok', note: '' },
    hedgehog: { n: L.gwait, line: `올릴 전표 ${L.gwait}`, st: aiw('hedgehog').st, note: aiw('hedgehog').note },
    squirrel: { n: 0, line: `PDF ${tOf(aiw('squirrel').at) || '—'}`, st: aiw('squirrel').st, note: aiw('squirrel').note },
    cat: { n: L.needDisp.length, line: `배차 요청 ${L.needDisp.length}`, st: aiw('cat').st, note: aiw('cat').note },
    guppy: { n: 0, line: aiw('guppy').note || '통화', st: aiw('guppy').st, note: aiw('guppy').note },
    rabbit: { n: 0, line: (aiw('rabbit').note || '').split(' · ')[0] || '문자', st: aiw('rabbit').st, note: aiw('rabbit').note },
    redpanda: { n: PAMPH.length - L.chkOn.filter(Boolean).length, line: `카탈로그 ${L.chkOn.filter(Boolean).length} / ${PAMPH.length}`, st: 'ok', note: aiw('redpanda').note },
  };
  if (L.ai && L.ai.run) W.seal.st = 'run';
  L.W = W; return L;
}
const tagHtml = (who, line, st, n) => `<div title="${esc(line)}" style="display:flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;background:#fff;box-shadow:0 3px 12px rgba(30,40,60,.2);font:800 11px Pretendard,sans-serif;color:#4A3F3A;white-space:nowrap"><span style="width:8px;height:8px;border-radius:50%;background:${O3D.DOT[st] || O3D.DOT.ok}"></span>${esc(who)}${n ? `<span style="padding:1px 7px;border-radius:999px;background:#FF453A;color:#fff">${n}</span>` : ''}</div>`;
const objHtml = (t, n, c = '#E8732C') => `<div style="display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:12px;background:#FFF6D8;box-shadow:0 3px 12px rgba(30,40,60,.18);font:800 11px Pretendard,sans-serif;color:#7A5A00;white-space:nowrap">${esc(t)}${n != null ? `<span style="padding:1px 7px;border-radius:999px;background:${c};color:#fff">${n}</span>` : ''}</div>`;
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
async function putInbox(its) {   // 자료 넣기 실제 올리기 — 첫 화면 자료 넣기와 같은 꼴 (site_inbox wait)
  let ok = 0, err = '';
  for (const it of its) {
    const row = { id: newId(), created_by: ME, status: 'wait' };
    if (typeof it === 'string') Object.assign(row, { kind: 'text', name: it.trim().split('\n')[0].slice(0, 60), body: it });
    else { if (it.size > 8e6) { err = `${it.name}: 8MB 넘음`; continue; } const data = await new Promise((r2) => { const fr = new FileReader(); fr.onload = () => r2(fr.result); fr.readAsDataURL(it); }); Object.assign(row, { kind: 'file', name: it.name, mime: it.type, data }); }
    const e = await S.addInbox(row); if (e) err = e; else ok += 1;
  }
  return { ok, err };
}
function host3d(bg) { document.body.querySelectorAll('.w3host').forEach((n) => n.remove()); const h = el(`<div class="w3host" style="position:fixed;inset:0;z-index:0;background:${bg}"></div>`); document.body.prepend(h); return h; }
function panelBox(v) {
  const p = el('<div class="card pnl" style="position:absolute;right:24px;top:84px;bottom:24px;width:400px;border-radius:26px;display:none;flex-direction:column;overflow:hidden;z-index:8"><div style="display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid #F3EEE9"><div style="flex:1"><div class="pt" style="font-size:18px;font-weight:800"></div><div class="ps" style="font-size:12px;color:#8A7E77"></div></div><button type="button" class="px" aria-label="닫기" style="width:38px;height:38px;border:0;border-radius:12px;background:#F4EFEA;font-size:17px;cursor:pointer">✕</button></div><div class="pb scroll" style="flex:1;padding:14px 18px;display:flex;flex-direction:column;gap:8px"></div></div>');
  v.appendChild(p); p.querySelector('.px').onclick = () => { p.style.display = 'none'; };
  return { el: p, show: (t, sub, html) => { p.querySelector('.pt').textContent = t; p.querySelector('.ps').textContent = sub || ''; p.querySelector('.pb').innerHTML = html; p.style.display = 'flex'; } };
}
const prow = (l, r, rc = '') => `<div style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:12px;background:#FBF8F5;font-size:13px"><span style="flex:1;min-width:0">${l}</span>${r != null ? `<span style="font-weight:800;${rc}">${r}</span>` : ''}</div>`;
const plink = (t, href) => `<a class="btn" href="${href}" target="_blank" rel="noopener" style="height:40px;font-size:13px">${esc(t)} ↗</a>`;
const ioTxt = (x) => { const seen = {}; (x.lines || []).forEach((l) => { const k = l.k === '반품' ? '판매' : l.k; seen[k] = seen[k] === false || !(l.st === '입력' || l.st === '—') ? false : true; }); return Object.entries(seen).map(([k, ok]) => `${k} ${ok ? '✓' : '✕'}`).join(' · '); };

function office() {
  const v = el(`<div class="v v3">
    <div style="position:absolute;left:20px;top:20px;display:flex;gap:10px;align-items:center;z-index:8">${backBtn('#/', '마을')}<a class="btn" href="#/warehouse" style="height:46px;color:#B07A2A">창고</a><button type="button" class="btn boardBtn" style="background:#FFE680;color:#5A4A00">할 일 칠판</button><button id="meet" type="button" class="btn" style="background:#2E9A5A;color:#fff">회의</button><span id="oat" class="pill" style="background:rgba(255,255,255,.9);color:#8A7E77"></span></div>
  </div>`);
  stage.appendChild(v);
  const P = panelBox(v);
  let L = null;
  const O = O3D.office(host3d('#D8E9FA'), { alive: () => v.isConnected, staff: AI, onPick: (k) => open(k) });
  const draw = () => {
    if (!L) return;
    AI.forEach((a, i) => { const w = L.W[a.k]; O.setTag(a.k, tagHtml(a.who, w.line, w.st, w.n)); O.setIdle(a.k, a.kind === 'task' && !w.n && w.st !== 'bad', i); });
    AI.forEach((a) => { const w = L.W[a.k]; O.setScreen(a.k, [a.who, w.line], w.st === 'bad' ? '#7A2A2A' : '#1F3A5F'); });   // 책상 모니터에 실제 숫자
    O.setScreen('wallA', ['배차 요청', `${L.needDisp.length}건 남음`], '#22406A'); O.setScreen('wallB', ['오늘 출고', `${L.shipped.length} / ${L.today.length}`], '#2A4A3A');
    O.setTag('board', objHtml('확인 칠판', L.checks.length + L.inCheck.length, '#FF453A'));
    O.setTag('printer', objHtml('프린터 · 송장', L.sj.filter((x) => String(x.created_at || '').slice(0, 10) === new Date().toISOString().slice(0, 10)).length, '#2F7BF6'));
    O.setTag('pamph', objHtml('팜플렛', `${L.chkOn.filter(Boolean).length}/${PAMPH.length}`, '#2E9A5A'));
    O.setTag('mail', objHtml('우체통 · 자료 넣기', L.inbox.filter((x) => x.status === 'wait' || x.status === 'got').length || null, '#2F7BF6'));
    O.setTag('meet', objHtml('회의 테이블'));
    v.querySelector('#oat').textContent = L.ai ? `AI 상태 ${tOf(L.ai.at)}` : 'AI 상태 없음';
  };
  const load = () => live().then((x) => { L = x; draw(); });
  load(); every(60000, load);
  function open(k) {
    if (!L) return; const a = AI.find((x) => x.k === k), w = a && L.W[k];
    if (a) {
      let body = prow('상태', { ok: '정상', bad: '멈춤 · 실패', run: '지금 작업 중' }[w.st] || '정상', `color:${O3D.DOT[w.st]}`) + (w.note ? prow(esc(w.note)) : '');
      if (k === 'seal') body += prow('오늘 출고', `${L.shipped.length} / ${L.today.length}`) + prow('확인 대기', L.checks.length) + plink('출고 흐름', '/');
      if (k === 'raccoon') body += L.miss.slice(0, 12).map((x) => prow(`${esc(x.partner)} · ${esc(x.site || '')} <span style="color:#8A7E77">${esc(x.day || '')}</span>`, '누락', 'color:#FF453A')).join('') || prow('입력 누락 없음');
      if (k === 'otter') body += L.unpaid.slice(0, 14).map((x) => prow(`${esc(x.driver || '')} <span style="color:#8A7E77">${esc(x.job || '')}</span>`, x.amount ? Number(x.amount).toLocaleString() : '', 'color:#FF453A')).join('') || prow('미송금 없음');
      if (k === 'hedgehog') body += prow('올릴 전표', L.gwait) + plink('공간 사이트', '/gonggan/');
      if (k === 'cat') body += L.needDisp.slice(0, 14).map((x) => prow(`${esc(x.partner)} · ${esc(x.site || '')} <span style="color:#8A7E77">${esc(x.day)} ${esc(x.time || '')}</span>`, '배차 요청', 'color:#E8732C')).join('') || prow('배차 요청 없음');
      if (k === 'redpanda') { open('pamph'); return; }
      P.show(`${a.who} · ${a.job}`, w.st === 'bad' ? '멈춤' : '', body); return;
    }
    if (k === 'board') {
      const rows = L.checks.slice(0, 20).map((x) => { const io = ioTxt(x), ok = io && !io.includes('✕'); return `<div style="padding:10px 12px;border-radius:12px;background:#FBF8F5;display:flex;gap:8px;align-items:center"><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:800">${esc(x.partner)} · ${esc(x.site || '')} <span style="color:#8A7E77;font-weight:600">${esc(x.day)}</span></div><div style="font-size:12px;color:${ok ? '#1E8E3E' : '#D93025'}">AI 먼저 봄: ${esc(io || '입력 정보 없음')}</div></div><button type="button" class="btn or" data-ok="${esc(x.case || x.no)}" data-nm="${esc(`${x.partner} ${x.site || ''}`)}" style="height:38px;font-size:13px">확인</button></div>`; }).join('');
      const ins = L.inCheck.slice(0, 8).map((x) => prow(`자료 · ${esc(x.name || '')}<div style="font-size:12px;color:#B07A00">${esc(x.note || '확인 필요')}</div>`)).join('');
      P.show('확인 칠판', `대신 확인 · ${ME || ''}`, (rows || prow('확인할 전표 없음')) + ins);
      P.el.querySelectorAll('[data-ok]').forEach((b) => { b.onclick = async () => { b.textContent = '…'; const e = await S.addFlowMark(`slipok:${b.dataset.ok}`, b.dataset.nm, ME); b.textContent = e ? '실패' : '확인함'; if (!e) { b.disabled = true; load(); } }; });
      return;
    }
    if (k === 'printer') {
      const sj = L.sj.slice(0, 12).map((x) => prow(`${esc(x.partner || '')} · ${esc(x.site || '')} <span style="color:#8A7E77">${esc(x.ymd || '')}</span>`, x.signed_at ? '서명' : x.opened_at ? '열어봄' : '안 열어봄', x.signed_at ? 'color:#1E8E3E' : x.opened_at ? 'color:#2F7BF6' : 'color:#8A7E77')).join('');
      P.show('프린터 · 송장 · 명세표', '최근 발행', (sj || prow('발행한 송장 없음')) + `<div style="display:flex;gap:8px;margin-top:6px">${plink('전자 송장', '/songjang/')}${plink('거래명세표 만들기', '/convert.html')}</div>`); return;
    }
    if (k === 'pamph') {
      P.show('팜플렛 · 아이큐브 카탈로그', L.W.redpanda.note || '', PAMPH.map((t, i) => `<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:#FBF8F5;font-size:14px;cursor:pointer"><input type="checkbox" data-pc="${i}" ${L.chkOn[i] ? 'checked' : ''} style="width:18px;height:18px">${esc(t)}</label>`).join('') + `<div style="margin-top:6px">${plink('카탈로그 열기', '/catalog/')}</div>`);
      P.el.querySelectorAll('[data-pc]').forEach((c) => { c.onchange = async () => { const i = +c.dataset.pc; await S.setTownCheck(`pamph:${i}`, PAMPH[i], c.checked, ME); load(); }; });
      return;
    }
    if (k === 'mail') {
      const st = { wait: ['받음', '#C2551A'], got: ['읽는 중', '#2F7BF6'], done: ['반영', '#1E8E3E'], check: ['확인 필요', '#B07A00'] };
      P.show('우체통 · 자료 넣기', '카톡 · 사진 · PDF · 엑셀', `<label id="dz" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;height:120px;border:2.5px dashed #EAD9C9;border-radius:18px;background:#FFFBF7;cursor:pointer;font-weight:800;color:#4A3F3A">끌어다 놓기<input id="dfin" type="file" multiple style="display:none"></label><div style="display:flex;gap:8px"><textarea id="dtx" rows="2" placeholder="카톡 붙여 넣기" style="flex:1;resize:none;border:1.5px solid #F0E6DD;border-radius:12px;padding:8px 10px;font:inherit;font-size:13px"></textarea><button type="button" id="dgo" class="btn or">넣기</button></div><div id="dmsg" style="font-size:12px;color:#8A7E77"></div>` + L.inbox.slice(0, 12).map((x) => prow(`${esc(x.name || '')} <span style="color:#8A7E77">${esc(x.created_by || '')} ${tOf(x.created_at)}</span>`, (st[x.status] || [x.status])[0], `color:${(st[x.status] || [0, '#8A7E77'])[1]}`)).join(''));
      const put = async (its) => { const msg = P.el.querySelector('#dmsg'); msg.textContent = '올리는 중…'; let ok = 0, err = ''; for (const it of its) { const row = { id: newId(), created_by: ME, status: 'wait' }; if (typeof it === 'string') Object.assign(row, { kind: 'text', name: it.trim().split('\n')[0].slice(0, 60), body: it }); else { if (it.size > 8e6) { err = `${it.name}: 8MB 넘음`; continue; } const data = await new Promise((r2) => { const fr = new FileReader(); fr.onload = () => r2(fr.result); fr.readAsDataURL(it); }); Object.assign(row, { kind: 'file', name: it.name, mime: it.type, data }); } const e = await S.addInbox(row); if (e) err = e; else ok += 1; } msg.textContent = err ? `못 넣음 — ${err}` : `${ok}건 넣었어요`; load(); };
      const dz = P.el.querySelector('#dz'); dz.ondragover = (e) => { e.preventDefault(); dz.style.borderColor = '#E8732C'; }; dz.ondragleave = () => { dz.style.borderColor = '#EAD9C9'; }; dz.ondrop = (e) => { e.preventDefault(); dz.ondragleave(); put([...(e.dataTransfer.files || [])]); };
      P.el.querySelector('#dfin').onchange = (e) => put([...(e.target.files || [])]);
      P.el.querySelector('#dgo').onclick = () => { const t = P.el.querySelector('#dtx').value.trim(); if (t) put([t]); };
      return;
    }
    if (k === 'meet') v.querySelector('#meet').click();
  }
  let meeting = false;
  v.querySelector('#meet').onclick = () => {
    if (meeting || !L) return; meeting = true; v.querySelector('#meet').textContent = '회의 중…';
    O.meeting(AI.map((a) => a.k), (k) => { const a = AI.find((x) => x.k === k), w = L.W[k]; O.setTag(k, `<div style="max-width:260px;padding:8px 12px;border-radius:14px;background:#fff;box-shadow:0 6px 18px rgba(30,40,60,.25);font:600 12px Pretendard,sans-serif;color:#2B2522"><b style="color:#E8732C">${esc(a.who)}</b> ${esc(w.line)}${w.note && w.st === 'bad' ? ` · ${esc(w.note)}` : ''}</div>`, [O.OBJ.meet[0], O.OBJ.meet[1] + 2, O.OBJ.meet[2]]); setTimeout(() => { O.setTag(k, tagHtml(a.who, w.line, w.st, w.n), [O.seats[k].home[0], O.seats[k].home[1] + 7.2, O.seats[k].home[2]]); }, 2300); },
      () => { meeting = false; v.querySelector('#meet').textContent = '회의'; });
  };
}

// ── 창고 ───────────────────────────────────────────────
function warehouse() {
  const v = el(`<div class="v v3">
    <div style="position:absolute;left:20px;top:20px;display:flex;gap:10px;align-items:center;z-index:8">${backBtn('#/', '마을')}<a class="btn" href="#/office" style="height:46px">사무실</a><a class="btn" href="#/jim" style="height:46px">짐짜기</a><span id="wat" class="pill" style="background:rgba(255,255,255,.9);color:#8A7E77"></span></div>
  </div>`);
  stage.appendChild(v);
  const P = panelBox(v);
  Promise.allSettled([S.getTownStock(), live(), S.init()]).then(([sr, lr]) => {   // 재고 = 실사 재고표 (재고.xlsx, 10/30 대표 "실제 최근 재고 체크한 것")
    if (!v.isConnected) return;
    const L = lr.status === 'fulfilled' ? lr.value : { shipped: [], today: [] };
    const ST = (sr.status === 'fulfilled' && sr.value) || { rows: [] };
    const all = (ST.rows || []).map((r, i) => ({ ...r, key: i }));
    const items = all.filter((r) => /천안/.test(r.wh) && Number(r.qty) > 0).map((r) => ({ r, key: r.key, name: r.item, qty: Number(r.qty), unit: '', cat: '구조재' }));
    const others = all.filter((r) => !/천안/.test(r.wh));
    // 철물 = 실사 자료가 없어서 사이트 재고 장부 (천안 창고 · 재고 있는 것만) — 이름표에 '장부'
    const hw = S.getItems().filter((it) => /천안|신갈/.test(it.warehouse || '천안') && !/구조재|방부목|OSB|합판/.test(`${it.category || ''} ${it.name}`) && S.currentStock(it) > 0)
      .sort((a, b) => S.currentStock(b) - S.currentStock(a)).map((it) => ({ it, key: 'h' + it.id, name: String(it.name).replace(/^[^_]*_/, '').slice(0, 16), qty: S.currentStock(it), unit: it.unit || '' }));
    v.querySelector('#wat').textContent = `구조재 실사 ${String(ST.updated || '').slice(5).replace('-', '/')} ${items.length}품목 · 랙 장부 ${hw.length} · 오늘 출고 ${L.shipped.length}`;
    const ob = el('<button type="button" class="btn" style="height:46px">다른 창고</button>'); v.querySelector('#wat').before(ob);
    ob.onclick = () => P.show('다른 창고 실사', `재고표 ${ST.updated || ''}`, others.map((r) => prow(`${esc(r.wh)} · ${esc(r.item)}<div style="font-size:12px;color:#8A7E77">${esc(r.date || '')} ${esc(r.state || '')}</div>`, `${r.qty}${r.plt ? ` · ${r.plt}PLT` : ''}`)).join('') || prow('없음'));
    // 오늘 천안창고에서 실은 차만 — 원익·한림·우림 등 매입처 상차는 뺌 · 번호판·차종은 출고 건 차량 칸(이음 배차안내)에서
    const plateOf = (t) => ((t || '').match(/([가-힣]{2})?\s?\d{2,3}\s?[가-힣]\s?\d{4}/) || [''])[0].replace(/\s/g, '');
    const typeOf = (t) => (/다마스|라보/.test(t) ? 'damas' : /5\s*톤\s*축|5톤축|축차/.test(t) ? 'ax5' : /윙|11\s*톤|25\s*톤|츄레라/.test(t) ? 'wing' : /2\.5\s*톤|3\.5\s*톤|5\s*톤/.test(t) ? 'mid' : /1\.4\s*톤/.test(t) ? 'l14' : 'lt');
    const drivers = L.shipped.filter((x) => /천안|신갈|직산/.test(`${x.veh || ''} ${x.memo || ''}`) || !/원익|한림|우림|매입창고|경동|직송/.test(`${x.from || ''} ${x.veh || ''}`)).map((x) => { const t = `${x.veh || ''} ${x.memo || ''}`; return { key: x.case || x.no, row: x, plate: plateOf(t), type: typeOf(t), label: `${(t.match(/(츄레라|다마스|라보)?\s*[가-힣]{1,3}\s*(소장|기사)님?/) || [''])[0] || x.partner || ''} → ${x.site || ''}`.trim().slice(0, 20) }; });
    const unpaid = (L.unpaid || []).map((u) => ({ id: u.id, driver: u.driver, amount: u.amount, job: u.job }));
    const WH = O3D.warehouse(host3d('#E6E2DA'), { alive: () => v.isConnected, items, hw, drivers, unpaid, onPick: (k) => {
      if (k.startsWith('item:h')) { const h = hw.find((y) => y.key === k.slice(5)); if (!h) return; P.show(h.it.name, `${h.it.warehouse || ''} · 사이트 재고 장부 (실사 없음)`, prow('장부 재고', `${Math.floor(h.qty)}${h.unit}`) + prow('출고 예정 · 배차 완료', `${Math.floor(S.reservedQty(h.it))}${h.unit}`) + prow('규격', esc(h.it.spec || '—'))); return; }
      if (k.startsWith('item:')) { const x = items.find((y) => String(y.key) === k.slice(5)); if (!x) return; const r = x.r; P.show(`구조재 ${x.name}`, `${r.wh} · 실사 ${ST.updated || ''}`, prow('수량', `${r.qty}${r.plt ? ` · ${r.plt}PLT` : ''}`) + prow('상태', esc(r.state || '—'), r.state === '확인' ? 'color:#B07A00' : '') + (r.date ? prow('입고일자', esc(r.date)) : '') + (r.note ? prow(`<div style="font-size:12px;line-height:1.5">${esc(r.note)}</div>`) : '')); return; }
      if (k === 'unpaid') { const draw2 = () => P.show('미입금 기사님', '입금 완료 누르면 창고 밖에서 사라져요', unpaid.map((u) => `<div style="display:flex;gap:8px;align-items:center;padding:9px 12px;border-radius:12px;background:#FBF8F5"><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:800">${esc(u.driver || '')}</div><div style="font-size:12px;color:#8A7E77;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(u.job || '')}</div></div><b style="color:#FF453A">${u.amount ? Number(u.amount).toLocaleString() : ''}</b><button type="button" class="btn or" data-paid="${esc(u.id)}" style="height:36px;font-size:12px">입금 완료</button></div>`).join('') || prow('미입금 없음'));
        draw2(); P.el.querySelectorAll('[data-paid]').forEach((b) => { b.onclick = async () => { b.textContent = '…'; const e = await S.markFareSent(b.dataset.paid, ME); if (e) { b.textContent = '실패'; return; } WH.removeWaiter(b.dataset.paid); unpaid.splice(unpaid.findIndex((u) => String(u.id) === b.dataset.paid), 1); b.closest('div').remove(); }; }); return; }
      if (k === 'kiosk' || k === 'noh' || k.startsWith('drv:')) { const list = (k.startsWith('drv:') ? drivers.filter((d) => String(d.key) === k.slice(4)) : drivers).map((d) => prow(`${esc(d.row.partner)} · ${esc(d.row.site || '')}<div style="font-size:12px;color:#8A7E77">${esc(d.row.veh || '')} ${esc(d.row.time || '')} · ${esc(d.row.item || '')}</div>`, (d.row.steps || []).includes('출고 완료') ? '출고 완료' : '배차 완료', 'color:#1E8E3E')).join(''); P.show(k === 'noh' ? '노훈님 · 오늘 상차' : k === 'kiosk' ? '키오스크 · 오늘 출고' : '기사님', '', list || prow('오늘 출고 없음')); }
    } });
  });
}

// ── 할 일 칠판 (10/29 대표 "포스트잇처럼 · 옮기고 · 그림도") — 지금은 이 기기에만 저장
const NOTE_C = ['#FFE680', '#FFC9D6', '#C8F0C9', '#C9E4FF', '#FFD9B0'];
const NOTES0 = [
  ['대림우드 세금계산서 실수 고치기', 0], ['삼일아이앤씨 10월 원장 보내기', 1], ['우림 구매 10/28-20 맞는지 확인', 3], ['군산 OSB 기사·운임 확인', 2],
  ['케이에스우드 900원 단가 단위 확인', 4], ['순천 판재 30장 → 공간 다음 현장으로', 0], ['콜센터 30만 예약 취소됐는지', 1], ['서생 정소장 기사번호·운임 받기', 2],
  ['에디톤 바로 가는지 이충혁 소장께', 3], ['실리콘 판매·택배비 이카운트 입력', 4],
].map(([t, c], i) => ({ id: 'n' + i, t, c, x: 60 + (i % 5) * 250, y: 110 + Math.floor(i / 5) * 230, r: ((i * 37) % 9) - 4 }));
function loadBoard() { try { const b = JSON.parse(localStorage.getItem('town:board') || 'null'); if (b && b.notes) return b; } catch (e) { /* 무시 */ } return { notes: NOTES0, draw: '' }; }
function saveBoard(b) { try { localStorage.setItem('town:board', JSON.stringify(b)); } catch (e) { /* 무시 */ } }
function openBoard() {
  const B = loadBoard();
  const m = el(`<div class="modal" style="background:rgba(30,40,60,.45)"><div style="position:relative;width:1360px;height:820px;border-radius:28px;background:#F7F4EC;box-shadow:0 20px 60px rgba(0,0,0,.3), inset 0 0 0 14px #C9A26B;overflow:hidden">
    <div style="position:absolute;left:28px;top:22px;right:28px;display:flex;align-items:center;gap:10px;z-index:5">
      <div style="font-size:22px;font-weight:800;margin-right:auto;padding-left:8px">할 일 칠판</div>
      ${NOTE_C.map((c, i) => `<button type="button" data-add="${i}" aria-label="포스트잇 추가" style="width:38px;height:38px;border:0;border-radius:8px;background:${c};box-shadow:0 2px 6px rgba(0,0,0,.15);cursor:pointer;font-size:20px;font-weight:800;color:#6B5E55">+</button>`).join('')}
      <span style="width:1px;height:30px;background:#D8CDB8;margin:0 4px"></span>
      <button type="button" id="pen" class="btn" style="height:40px">그리기</button>
      ${['#2B2522', '#E5483B', '#3F7FE0', '#2E9A5A'].map((c) => `<button type="button" data-pc="${c}" aria-label="펜 색" style="width:26px;height:26px;border-radius:50%;border:3px solid #fff;background:${c};box-shadow:0 1px 4px rgba(0,0,0,.2);cursor:pointer"></button>`).join('')}
      <button type="button" id="clr" class="btn" style="height:40px">그림 지우기</button>
      <button type="button" id="bx" class="btn" style="height:40px">닫기</button>
    </div>
    <canvas id="cv" width="1360" height="820" style="position:absolute;inset:0;z-index:1"></canvas>
    <div id="nl" style="position:absolute;inset:0;z-index:2"></div>
    <div id="trash" style="position:absolute;right:28px;bottom:24px;width:120px;height:56px;border-radius:16px;border:2px dashed #D8B8A8;color:#B08070;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;z-index:3">여기로 버리기</div>
  </div></div>`);
  stage.appendChild(m);
  const nl = m.querySelector('#nl'), cv = m.querySelector('#cv'), ctx = cv.getContext('2d'), trash = m.querySelector('#trash');
  if (B.draw) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0); im.src = B.draw; }
  const k = () => cv.getBoundingClientRect().width / 1360;
  const draw = () => {
    nl.innerHTML = B.notes.map((n) => `<div class="note" data-id="${n.id}" style="position:absolute;left:${n.x}px;top:${n.y}px;width:210px;min-height:170px;padding:30px 16px 14px;background:${NOTE_C[n.c]};border-radius:4px 4px 18px 4px;box-shadow:0 8px 16px rgba(0,0,0,.14);transform:rotate(${n.r}deg);cursor:grab;touch-action:none"><span style="position:absolute;left:50%;top:8px;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:#E5483B;box-shadow:0 2px 3px rgba(0,0,0,.3)"></span><div class="nt" contenteditable="true" spellcheck="false" style="font-size:18px;font-weight:700;line-height:1.45;color:#3A3128;outline:none;cursor:text">${esc(n.t)}</div></div>`).join('');
  };
  draw();
  let pen = false, color = '#2B2522', drag = null, drawing = false;
  m.querySelector('#bx').onclick = () => { saveBoard(B); m.remove(); };
  m.querySelectorAll('[data-add]').forEach((b) => { b.onclick = () => { B.notes.push({ id: 'n' + Date.now(), t: '할 일 적기', c: +b.dataset.add, x: 560 + Math.random() * 120, y: 300 + Math.random() * 120, r: Math.round(Math.random() * 8 - 4) }); draw(); saveBoard(B); }; });
  m.querySelector('#pen').onclick = (e) => { pen = !pen; e.currentTarget.classList.toggle('or', pen); cv.style.zIndex = pen ? 4 : 1; cv.style.cursor = pen ? 'crosshair' : ''; };
  m.querySelectorAll('[data-pc]').forEach((b) => { b.onclick = () => { color = b.dataset.pc; if (!pen) m.querySelector('#pen').click(); }; });
  m.querySelector('#clr').onclick = () => { ctx.clearRect(0, 0, 1360, 820); B.draw = ''; saveBoard(B); };
  nl.addEventListener('input', (e) => { const n = B.notes.find((x) => x.id === e.target.closest('.note').dataset.id); if (n) { n.t = e.target.innerText; saveBoard(B); } });
  nl.addEventListener('pointerdown', (e) => {
    const note = e.target.closest('.note'); if (!note || e.target.closest('.nt') && document.activeElement === e.target.closest('.nt')) return;
    const n = B.notes.find((x) => x.id === note.dataset.id); drag = { n, note, sx: e.clientX, sy: e.clientY, x: n.x, y: n.y, moved: false }; note.style.cursor = 'grabbing'; note.style.zIndex = 10; note.setPointerCapture(e.pointerId);
  });
  nl.addEventListener('pointermove', (e) => {
    if (!drag) return; const dx = (e.clientX - drag.sx) / k(), dy = (e.clientY - drag.sy) / k(); if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (!drag.moved) return; drag.n.x = drag.x + dx; drag.n.y = drag.y + dy; drag.note.style.left = drag.n.x + 'px'; drag.note.style.top = drag.n.y + 'px';
    const tr = trash.getBoundingClientRect(); trash.style.background = e.clientX > tr.left && e.clientY > tr.top ? '#FFE4DE' : '';
  });
  nl.addEventListener('pointerup', (e) => {
    if (!drag) return; const tr = trash.getBoundingClientRect();
    if (drag.moved && e.clientX > tr.left && e.clientY > tr.top) { B.notes = B.notes.filter((x) => x !== drag.n); draw(); }
    else { drag.note.style.cursor = 'grab'; drag.note.style.zIndex = ''; if (!drag.moved) drag.note.querySelector('.nt').focus(); }
    trash.style.background = ''; drag = null; saveBoard(B);
  });
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / k(), (e.clientY - r.top) / k()]; };
  cv.addEventListener('pointerdown', (e) => { if (!pen) return; drawing = true; const [x, y] = pos(e); ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x, y); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (!drawing) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); });
  cv.addEventListener('pointerup', () => { if (!drawing) return; drawing = false; B.draw = cv.toDataURL(); saveBoard(B); });
}

// ── 화면 바꾸기 · 직원 계정만 ───────────────────────────
function jim() { const v = el('<div class="v"></div>'); stage.appendChild(v); JIM.mount(v, { back: backBtn('#/warehouse', '창고') }); }
const VIEWS = { '': village, campus, office, warehouse, jim };
function swapAv() {
  document.querySelectorAll('#stage img, .w3host img').forEach((im) => { const mm = (im.getAttribute('src') || '').match(/img\/(\w+)\.webp$/); if (mm && KINDS.includes(mm[1])) { try { im.src = portrait(mm[1]); } catch (e) { /* WebGL 없으면 그림 그대로 */ } } });
}
function show() {
  clearAll(); stage.innerHTML = '';
  setTimeout(() => stage.querySelectorAll('.boardBtn').forEach((b) => { b.onclick = openBoard; }), 0);
  const key = (location.hash.replace(/^#\/?/, '') || '').split('?')[0];
  (VIEWS[key] || village)();
  swapAv(); setTimeout(swapAv, 400); setTimeout(swapAv, 2500);   // 그림 얼굴 → 3D 캐릭터 얼굴 (또렷하게)
}
async function boot() {
  fit();
  stage.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#6B8AA8;font-size:18px;font-weight:700">불러오는 중…</div>';
  let ok = false;
  try {
    const sess = await S.getSession();
    if (sess) { const acc = await S.myAccess(); const id = ((sess.user && sess.user.email) || '').split('@')[0]; ME = id; ok = acc ? !!acc.staff : !/^space\d+$/.test(id); }
  } catch (e) { ok = false; }
  if (!ok) { stage.innerHTML = `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px"><div style="font-size:22px;font-weight:800">직원 로그인 필요</div><a class="btn or" href="/">로그인하러 가기</a></div>`; return; }
  window.addEventListener('hashchange', show); show();
}
boot();
