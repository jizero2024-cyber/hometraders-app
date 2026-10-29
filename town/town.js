// 홈트 마을 /town (10/29 대표 "게임처럼 · 디자인만 먼저") — 마을 · 단지 · 사무실 · 창고 네 화면, 아직 예시 자료
// 주소 뒤 #/campus · #/office · #/warehouse 로 화면 바뀜. 직원 계정만 (공간 계정 막음)
import * as S from '/js/store-supabase.js?v=9';

const stage = document.getElementById('stage');
const IMG = './img/';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hm = (d = new Date()) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
let timers = [];
const every = (ms, fn) => timers.push(setInterval(fn, ms));
const later = (ms, fn) => timers.push(setTimeout(fn, ms));
const clearAll = () => { timers.forEach((t) => { clearInterval(t); clearTimeout(t); }); timers = []; };

function fit() {   // 1440×900 판을 창에 맞춤
  const k = Math.min(window.innerWidth / 1440, window.innerHeight / 900);
  stage.style.transform = `scale(${k})`;
}
window.addEventListener('resize', fit);

const truckSvg = (c, c2) => `<svg width="52" height="40" viewBox="0 0 58 44" aria-hidden="true" style="display:block"><ellipse cx="29" cy="40" rx="24" ry="4" fill="#000" opacity=".12"/><rect x="2" y="6" width="34" height="26" rx="7" fill="${c}"/><rect x="2" y="6" width="34" height="9" rx="6" fill="#fff" opacity=".25"/><rect x="34" y="14" width="20" height="18" rx="6" fill="${c2}"/><rect x="39" y="17" width="10" height="7" rx="2" fill="#E6F4FF"/><circle cx="13" cy="34" r="6" fill="#4A3F3A"/><circle cx="13" cy="34" r="2.5" fill="#D8D0CB"/><circle cx="44" cy="34" r="6" fill="#4A3F3A"/><circle cx="44" cy="34" r="2.5" fill="#D8D0CB"/></svg>`;
const backBtn = (href, label) => `<a class="btn" href="${href}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>${label}</a>`;
function walker(layer, w) {   // 길 따라 걷는 직원 — 가는 쪽을 보고 뒤뚱뒤뚱
  const xs = (w.path.match(/-?\d+(\.\d+)?/g) || []).map(Number), flip = xs.length > 2 && xs[xs.length - 2] < xs[0] ? -1 : 1;
  const n = el(`<div class="walker" style="offset-path: path('${w.path}'); animation-duration: ${w.dur || 8}s"><div class="w"><span class="shadow"></span><div style="position:absolute;left:50%;bottom:100%;transform:translateX(-50%);white-space:nowrap;margin-bottom:4px;padding:5px 9px;border-radius:12px;background:#fff;box-shadow:0 4px 12px rgba(30,60,110,.2);font-size:11px;font-weight:800;color:${w.c}">${esc(w.say)}</div><img class="gait" src="${IMG}${w.av}.webp" alt="${esc(w.name)}" style="width:${w.size || 38}px;display:block;--fx:${flip}"></div></div>`);
  layer.appendChild(n); setTimeout(() => n.remove(), (w.dur || 8) * 1000 + 200);
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
  const v = el(`<div class="v" style="background:#8CC870">
    <img src="${IMG}town.webp" alt="" style="position:absolute;left:-20px;top:0;width:1194px;height:900px">
    <div id="lay" style="position:absolute;inset:0"></div>
    <a class="hot" href="#/campus" aria-label="홈트레이더스 단지 들어가기" style="left:326px;top:196px;width:520px;height:300px"></a>
    <button id="mail" type="button" aria-label="자료 넣기" style="position:absolute;left:512px;top:536px;width:54px;height:64px;border:0;background:transparent;cursor:pointer;z-index:4;transition:transform .2s">
      <span style="position:absolute;left:7px;top:34px;width:40px;height:18px;border-radius:50%;background:#E8732C;animation:pulse 1.8s ease-out infinite"></span>
      <span class="pill" style="position:absolute;left:50%;top:-20px;transform:translateX(-50%);background:#E8732C;color:#fff;font-size:11px;box-shadow:0 3px 10px rgba(232,115,44,.4)">자료 넣기 <b id="ndrop"></b></span>
    </button>
    <div style="position:absolute;left:20px;top:20px;display:flex;gap:10px;align-items:center;z-index:8">
      <div class="card" style="padding:9px 15px;border-radius:18px"><div style="font-size:12px;color:#8A7E77" id="vdate"></div><div style="font-size:24px;font-weight:800;letter-spacing:-.02em;line-height:1.1" id="vclock"></div></div>
      <button id="dispBtn" class="btn" type="button" style="height:48px"><img src="${IMG}cat.webp" alt="">배차 사무실 <b id="njobs"></b></button>
      <a class="btn or" href="#/campus" style="height:48px">우리 단지</a>
      <button type="button" class="btn boardBtn" style="height:48px;background:#FFE680;color:#5A4A00">할 일 칠판</button>
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
  const lay = v.querySelector('#lay');
  // 거래처 말풍선
  Object.entries(PLACES).forEach(([k, p]) => {
    const [x, y] = T(...p.at), [bg, fg] = TONE[p.tone];
    lay.appendChild(el(`<div style="position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;z-index:4;pointer-events:none">
      <div class="${p.tone === 'red' ? 'bob' : ''}" style="margin-bottom:4px;display:flex;flex-direction:column;align-items:center"><span style="max-width:180px;padding:6px 10px;border-radius:14px;background:${bg};color:${fg};font-size:11px;font-weight:800;line-height:1.3;text-align:center;box-shadow:0 4px 12px rgba(40,60,90,.18)">${esc(p.msg)}</span><span class="tail" style="background:${bg}"></span></div>
      ${p.wait ? `<img class="bob" src="${IMG}${p.wait}.webp" alt="기다리는 거래처" style="width:38px;margin-bottom:2px">` : ''}
      <span class="pill" style="background:${k === 'home' ? '#E8732C' : 'rgba(255,255,255,.96)'};color:${k === 'home' ? '#fff' : '#4A3F3A'};font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,.12)">${esc(p.name)}</span></div>`));
  });
  // 공사장 — 망치질하는 일꾼 · 먼지
  [[150, 380], [95, 420], [210, 640], [160, 690], [240, 150], [300, 175]].forEach(([x, y], i) => { const [X, Y] = T(x, y); sprite(lay, { av: 'driver', x: X, y: Y, size: 22, act: 'hammer' }); puff(lay, X + 10, Y - 6, i * 0.5); puff(lay, X - 8, Y - 2, i * 0.5 + 0.9); });
  // 트럭
  const addTruck = (t) => {
    const r = route(t.from, t.to), [c, c2] = COLORS[t.c % 5];
    const svg = el(`<svg width="1440" height="900" viewBox="0 0 1440 900" aria-hidden="true" style="position:absolute;left:0;top:0;pointer-events:none;z-index:2"><path class="route" d="${r.path}" fill="none" stroke="${c}" stroke-width="3.5" stroke-dasharray="2 10" stroke-linecap="round"/><circle cx="${r.a.x}" cy="${r.a.y}" r="6" fill="#fff" stroke="${c2}" stroke-width="3"/><path d="M ${r.b.x} ${r.b.y} l0 -26 l16 6 l-16 6" fill="${c2}" stroke="${c2}" stroke-width="2" stroke-linejoin="round"/></svg>`);
    const tr = el(`<div class="truck" style="offset-path: path('${r.path}'); animation-duration:${t.dur}s; animation-delay:${t.delay}s"><div style="position:relative;margin:-36px 0 0 -26px;width:52px">${truckSvg(c, c2)}<span style="position:absolute;left:50%;bottom:46px;transform:translateX(-50%);white-space:nowrap;padding:6px 10px 6px 8px;border-radius:12px;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.16);display:flex;gap:7px;align-items:center"><span style="width:6px;align-self:stretch;border-radius:3px;background:${c}"></span><span><span style="display:block;font-size:12px;font-weight:800">${esc(short(t.from))} <span style="color:${c2}">→</span> ${esc(short(t.to))}</span><span class="tsub" style="display:block;font-size:11px;color:#8A7E77">${esc(t.sub)}</span></span></span></div></div>`);
    lay.appendChild(svg); lay.appendChild(tr);
    return { svg, tr, setSub: (s) => { tr.querySelector('.tsub').textContent = s; } };
  };
  addTruck({ from: 'hanlim', to: 'gunsan', c: 0, dur: 40, delay: -24, sub: '이동 중 · OSB 11mm 40장 · 15:20 도착' });
  addTruck({ from: 'home', to: 'seosaeng', c: 1, dur: 60, delay: -18, sub: '이동 중 · 세라믹 판재 3m 5톤 혼적 · 내일 08:00' });
  // 배차 사무실
  const disp = v.querySelector('#disp');
  const drawDisp = () => {
    v.querySelector('#njobs').textContent = V.jobs.filter((j) => j.st === 'open').length;
    disp.innerHTML = `<div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#FFF1E6"><img src="${IMG}cat.webp" alt="" style="width:40px"><div><div style="font-size:15px;font-weight:800">배차 사무실</div><div style="font-size:12px;color:#C2551A;font-weight:700">배차 해야 함 ${V.jobs.filter((j) => j.st === 'open').length}</div></div></div>
      <div style="padding:6px 8px 8px">${V.jobs.map((j) => `<div style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:14px"><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(PLACES[j.to].name.replace(/[←↓]/g, '').trim())}</div><div style="font-size:11px;color:#8A7E77;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">천안 창고 상차 · ${esc(j.item)}</div></div>${j.st === 'open' ? `<button type="button" data-go="${j.id}" style="height:34px;padding:0 12px;border:0;border-radius:11px;background:#E8732C;color:#fff;font-size:13px;font-weight:800;cursor:pointer">배차</button>` : `<span class="pill" style="background:#E6F7EC;color:#1E8E3E">${{ load: '상차 중', drive: '이동 중', drop: '하차 중', done: '도착' }[j.st]}</span>`}</div>`).join('')}</div>`;
  };
  drawDisp();
  v.querySelector('#dispBtn').onclick = () => { V.dispOpen = !V.dispOpen; disp.style.display = V.dispOpen ? 'block' : 'none'; };
  disp.onclick = (e) => {
    const b = e.target.closest('[data-go]'); if (!b) return;
    const j = V.jobs.find((x) => x.id === b.dataset.go); if (!j || j.st !== 'open') return;
    const r = route('home', j.to), km = Math.round(r.L * 0.62), hrs = km / 70, eta = new Date(Date.now() + hrs * 3600e3);
    const LOAD = 3, DRIVE = Math.max(5, Math.min(16, r.L / 45)), DROP = 3;
    const t = addTruck({ from: 'home', to: j.to, c: 2 + (Math.random() * 3 | 0), dur: DRIVE, delay: LOAD, sub: `상차 중 · ${j.item}` });
    const set = (st, sub) => { j.st = st; drawDisp(); t.setSub(sub); };
    set('load', `상차 중 · ${j.item}`); say(`${PLACES[j.to].name} 배차 넣었어요. 창고에서 상차 중이에요.`);
    later(LOAD * 1000, () => { set('drive', `이동 중 · ${j.item} · ${hm(eta)} 도착 · ${km}km`); say(`상차 끝, 출발했어요. 약 ${Math.floor(hrs)}시간 ${Math.round((hrs % 1) * 60)}분 걸려요.`); });
    later((LOAD + DRIVE) * 1000, () => { set('drop', `하차 중 · ${j.item}`); say(`${PLACES[j.to].name} 도착, 하차 중이에요.`); });
    later((LOAD + DRIVE + DROP) * 1000, () => { set('done', `하차 끝 · ${j.item}`); say(`${PLACES[j.to].name} 하차 끝! 구매·판매 입력할게요.`); setTimeout(() => { t.svg.remove(); t.tr.remove(); }, 4000); });
  };
  // 김맥순 대화
  const chat = v.querySelector('#chat'), chatP = v.querySelector('#chatP'), chatBtn = v.querySelector('#chatBtn');
  chatBtn.onclick = () => { const o = chatP.style.display !== 'flex'; chatP.style.display = o ? 'flex' : 'none'; chatBtn.classList.toggle('or', o); };
  const bubble = (html, me) => { chat.appendChild(el(`<div style="align-self:${me ? 'flex-end' : 'flex-start'};max-width:${me ? 290 : 320}px;padding:11px 14px;border-radius:${me ? '18px 18px 6px 18px' : '18px 18px 18px 6px'};background:${me ? '#E8732C' : '#fff'};color:${me ? '#fff' : 'inherit'};font-size:14px;line-height:1.5;white-space:${me ? 'pre-line' : 'normal'};box-shadow:0 1px 3px rgba(0,0,0,.05);animation:rowin .35s ease-out both">${html}</div>`)); chat.scrollTop = chat.scrollHeight; };
  const say = (t) => bubble(esc(t));
  say('이음 톡 보니까 매향리 1.4톤 배차 됐어요. 운반비 13만 현불로 구매 입력할게요.');
  v.querySelector('#csend').onclick = () => {
    const ta = v.querySelector('#cin'), t = ta.value.trim(); if (!t) return; ta.value = '';
    bubble(esc(t), true);
    setTimeout(() => {
      bubble(`<div>공간제작소 매향리 건이네요. 지난번엔 이렇게 물어봤어요.</div>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;font-size:13px"><div style="display:flex;justify-content:space-between;padding:8px 10px;border-radius:12px;background:#F6F2EE"><span>원익큐브 · 10/27 견적</span><b>1,382,000</b></div><div style="display:flex;justify-content:space-between;padding:8px 10px;border-radius:12px;background:#F6F2EE"><span>한림 · 10/21 견적</span><b>1,419,000</b></div></div>
        <div style="margin-top:10px;font-weight:700">운송비까지 보면</div>
        <div style="margin-top:6px;display:flex;flex-direction:column;gap:6px;font-size:13px"><div style="display:flex;justify-content:space-between;padding:8px 10px;border-radius:12px;background:#FFF1E6"><span><b style="color:#C2551A">원익 여주 → 매향리</b><br>1톤 이음 지난 기록</span><b style="color:#C2551A">11만</b></div><div style="display:flex;justify-content:space-between;padding:8px 10px;border-radius:12px;background:#F6F2EE"><span><b>한림 청주 → 매향리</b><br>1톤 추정</span><b>14만</b></div></div>
        <div style="margin-top:10px">원익이 합계 <b>6만 원</b> 싸요.</div>
        <div style="display:flex;gap:8px;margin-top:10px"><button type="button" data-buy="원익" style="height:42px;padding:0 14px;border:0;border-radius:13px;background:#E8732C;color:#fff;font-weight:800;cursor:pointer">원익에서 구매</button><button type="button" data-buy="한림" style="height:42px;padding:0 14px;border:0;border-radius:13px;background:#F1ECE7;color:#4A3F3A;font-weight:700;cursor:pointer">한림에서 구매</button></div>`);
    }, 600);
  };
  chat.onclick = (e) => {
    const b = e.target.closest('[data-buy]'); if (!b) return;
    b.parentElement.remove(); const f = b.dataset.buy;
    bubble(`${esc(f)}에서 구매할게`, true);
    setTimeout(() => bubble(`<div>배차 요청 글이에요. 배차 사무실에도 올려 뒀어요.</div><div style="margin-top:8px;padding:10px 12px;border-radius:12px;background:#F6F2EE;font-size:13px;line-height:1.6;white-space:pre-line">배차 요청드립니다.
10/30(금) 오전 ${f === '원익' ? '여주 원익큐브' : '청주 한림'} 상차
→ 화성 우정읍 매향리 989 (공간제작소)
1톤 · 유도모음통 15BOX 외 · 현불</div>`), 500);
    V.jobs.push({ id: 'n' + Date.now(), to: 'gonggan', item: '유도모음통 15BOX 외', st: 'open' }); drawDisp();
  };
  // 자료 넣기
  const mail = v.querySelector('#mail');
  const ndrop = () => { v.querySelector('#ndrop').textContent = V.drops.filter((d) => d.st < 2).length || ''; };
  ndrop();
  const addDrops = (names) => {
    const t = hm(); const items = names.map((n) => ({ name: n, t, st: 0 })); V.drops.unshift(...items); ndrop(); drawDrop();
    say(`자료 ${items.length}개 받았어요. 읽고 출고 건에 넣을게요.`);
    later(1500, () => { items.forEach((x) => { x.st = 1; }); drawDrop(); ndrop(); });
    later(4500, () => { items.forEach((x) => { x.st = 2; }); drawDrop(); ndrop(); });
  };
  mail.ondragover = (e) => { e.preventDefault(); mail.style.transform = 'scale(1.18)'; };
  mail.ondragleave = () => { mail.style.transform = ''; };
  mail.ondrop = (e) => { e.preventDefault(); mail.style.transform = ''; const f = [...(e.dataTransfer.files || [])].map((x) => x.name); if (f.length) addDrops(f); };
  let modal = null;
  const drawDrop = () => {
    if (!modal) return;
    const kind = (n) => (/\.(png|jpe?g|heic|webp)$/i.test(n) ? ['IMG', '#E6F0FF', '#2F6BD6'] : /\.pdf$/i.test(n) ? ['PDF', '#FFE9E6', '#D93025'] : /\.(xlsx?|csv)$/i.test(n) ? ['XLS', '#E6F7EC', '#1E8E3E'] : ['TXT', '#F2ECE6', '#6B5E55']);
    modal.querySelector('#dlist').innerHTML = V.drops.map((d) => { const [k, bg, fg] = kind(d.name), st = [['받음', '#FFF1E6', '#C2551A'], ['김맥순 읽는 중', '#E6F0FF', '#2F6BD6'], ['출고 건에 반영', '#E6F7EC', '#1E8E3E']][d.st];
      return `<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:14px;background:#FBF8F5"><span style="width:34px;height:34px;border-radius:10px;background:${bg};color:${fg};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex:none">${k}</span><span style="flex:1;min-width:0"><span style="display:block;font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(d.name)}</span><span style="display:block;font-size:11px;color:#8A7E77">${d.t}</span></span><span class="pill" style="background:${st[1]};color:${st[2]}">${st[0]}</span></div>`; }).join('');
  };
  mail.onclick = () => {
    modal = el(`<div class="modal"><div class="card" style="width:620px;border-radius:28px;padding:22px 24px;display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;align-items:center;gap:12px"><div style="flex:1"><div style="font-size:20px;font-weight:800">자료 넣기</div><div style="font-size:12px;color:#8A7E77">카톡 · 사진 · PDF · 엑셀 · 명세서</div></div><button type="button" id="mx" aria-label="닫기" style="width:40px;height:40px;border:0;border-radius:12px;background:#F4EFEA;font-size:18px;cursor:pointer">✕</button></div>
      <label id="zone" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;height:170px;border:2.5px dashed #EAD9C9;border-radius:22px;background:#FFFBF7;cursor:pointer;transition:all .2s">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E8732C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
        <span style="font-size:16px;font-weight:800;color:#4A3F3A">여기에 끌어다 놓기</span><span style="font-size:13px;color:#8A7E77">또는 눌러서 파일 고르기</span>
        <input id="fin" type="file" multiple style="display:none"></label>
      <div style="display:flex;gap:8px;align-items:flex-end"><textarea id="dt" rows="2" placeholder="카톡 내용 붙여 넣기" aria-label="카톡 내용 붙여 넣기" style="flex:1;resize:none;border:1.5px solid #F0E6DD;border-radius:14px;padding:10px 12px;font:inherit;font-size:13px;outline:none"></textarea><button type="button" id="dadd" class="btn or" style="height:48px">넣기</button></div>
      <div id="dlist" class="scroll" style="display:flex;flex-direction:column;gap:6px;max-height:200px"></div></div></div>`);
    v.appendChild(modal); drawDrop();
    const zone = modal.querySelector('#zone');
    modal.querySelector('#mx').onclick = () => { modal.remove(); modal = null; };
    modal.onclick = (e) => { if (e.target === modal) { modal.remove(); modal = null; } };
    zone.ondragover = (e) => { e.preventDefault(); zone.style.borderColor = '#E8732C'; zone.style.background = '#FFF1E6'; };
    zone.ondragleave = () => { zone.style.borderColor = '#EAD9C9'; zone.style.background = '#FFFBF7'; };
    zone.ondrop = (e) => { e.preventDefault(); zone.ondragleave(); const f = [...(e.dataTransfer.files || [])].map((x) => x.name); if (f.length) addDrops(f); };
    modal.querySelector('#fin').onchange = (e) => { const f = [...(e.target.files || [])].map((x) => x.name); if (f.length) addDrops(f); e.target.value = ''; };
    modal.querySelector('#dadd').onclick = () => { const ta = modal.querySelector('#dt'), t = ta.value.trim(); if (!t) return; ta.value = ''; addDrops([t.split('\n')[0].slice(0, 40) + ' (붙여넣기)']); };
  };
  // 시계 · 김맥순 말
  const lines = ['배차 사무실에서 배차 누르면 트럭이 출발해요!', '공간제작소 소장님이 발주 3일째 기다리고 있어요.', '한림 트럭이 군산으로 가는 중이에요.', '오늘 출고 11건 끝났어요. 저녁에 보고할게요.'];
  let li = 0; const tick = () => { const n = new Date(); v.querySelector('#vclock').textContent = hm(n); v.querySelector('#vdate').textContent = `${n.getMonth() + 1}월 ${n.getDate()}일 ${'일월화수목금토'[n.getDay()]}요일`; };
  const say2 = () => { v.querySelector('#kbub').textContent = lines[li++ % lines.length]; };
  tick(); say2(); every(20000, tick); every(4200, say2);
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
function office() {
  const fl = [['6F 대표실', '#E8732C', 52], ['5F 견적·단가', '#9A6A3A', 162], ['4F 회계', '#5D6B7A', 258], ['3F 서류', '#E0662F', 350], ['2F 배차·통신', '#3F7FE0', 446], ['1F 디자인실·안내', '#C2551A', 538], ['마당 · 쉼터 · 와인바', '#2E9A5A', 642]];
  const v = el(`<div class="v" style="background:#D8E9FA">
    <div id="bld" style="position:absolute;left:376px;top:20px;width:688px;height:860px;transition:left .45s cubic-bezier(.3,.8,.3,1)">
      <img src="${IMG}office_e.webp" alt="홈트레이더스 사무실 6층과 앞마당" style="width:688px;height:860px;display:block;border-radius:28px">
      <img src="/icons/logo-full.png" alt="홈트레이더스 로고" style="position:absolute;left:392px;top:16px;width:64px">
      ${fl.map(([t, c, y]) => `<span class="pill" style="position:absolute;left:112px;top:${y}px;background:rgba(255,255,255,.92);color:${c};font-size:11px;z-index:2">${t}</span>`).join('')}
      <span class="paper" style="left:190px;top:372px"></span><span class="paper" style="left:190px;top:372px;animation-delay:1.1s"></span>
      <span class="steam" style="left:404px;top:84px"></span><span class="steam" style="left:412px;top:86px;animation-delay:1.2s"></span>
      ${[488, 512, 536, 560, 584].map((x, i) => `<span class="glow" style="left:${x}px;top:${[618, 612, 610, 614, 620][i]}px;animation-delay:${i * 0.4}s"></span>`).join('')}
      <span class="zz" style="left:120px;top:694px">z</span><span class="zz" style="left:190px;top:690px;animation-delay:.9s">z</span><span class="zz" style="left:336px;top:680px;animation-delay:1.6s">z</span>
      ${STAFF.map((s, i) => `<span class="pill tag" data-i="${i}" style="position:absolute;left:${s.x}px;top:${s.y + 4}px;transform:translate(-50%,-100%);padding:2px 7px;background:${s.c};color:#fff;font-size:10px;z-index:3">${esc(s.name)}</span>`).join('')}
      <div id="obub" class="bub"></div>
    </div>
    <div style="position:absolute;left:24px;bottom:22px;display:flex;gap:8px;z-index:8">${backBtn('#/campus', '단지')}<a class="btn" href="#/warehouse" style="color:#B07A2A">창고 가기</a><button type="button" class="btn boardBtn" style="background:#FFE680;color:#5A4A00">할 일 칠판</button></div>
    <button type="button" class="boardBtn hot" aria-label="할 일 칠판 열기" style="position:absolute;left:740px;top:170px;width:90px;height:70px;border:0;background:transparent;cursor:pointer;z-index:4"></button>
    <button id="book" type="button" class="btn" style="position:absolute;right:28px;top:24px;z-index:9;height:48px"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6z"/><path d="M6 3v18M4 7h4M4 12h4M4 17h4M10 8h6M10 12h6"/></svg>출석부 ${STAFF.length}</button>
    <div id="pnl" class="pnl" style="position:absolute;left:732px;right:24px;top:84px;bottom:20px;display:none;flex-direction:column;gap:12px;z-index:8">
      <div class="card" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px"><div><div style="font-size:12px;color:#8A7E77">천안 서북구 직산읍 신갈리</div><div style="font-size:22px;font-weight:800">홈트 사무실 · 직원 ${STAFF.length}명</div></div><div style="display:flex;gap:6px"><span class="pill" style="background:#FFF1E6;color:#C2551A">배차 5</span><span class="pill" style="background:#E6F0FF;color:#2F6BD6">가는 중 2</span><span class="pill" style="background:#E6F7EC;color:#1E8E3E">완료 11</span></div></div>
      <div id="cards" style="flex:1;min-height:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:10px"></div>
    </div></div>`);
  stage.appendChild(v);
  const bld = v.querySelector('#bld'), pnl = v.querySelector('#pnl'), book = v.querySelector('#book'), ob = v.querySelector('#obub');
  v.querySelector('#cards').innerHTML = STAFF.map((s, i) => `<button type="button" data-i="${i}" class="card" style="display:flex;align-items:center;gap:10px;padding:8px 12px 8px 8px;border:0;border-radius:18px;text-align:left;cursor:pointer;min-width:0"><span style="width:56px;height:56px;flex:none;border-radius:16px;background:${s.bg};display:flex;align-items:flex-end;justify-content:center;overflow:hidden"><img src="${IMG}${s.av}.webp" alt="" style="width:50px;height:50px;object-fit:contain"></span><span style="flex:1;min-width:0;display:flex;flex-direction:column"><span style="display:flex;align-items:center;gap:5px"><span style="font-size:14px;font-weight:800">${esc(s.name)}</span><span style="font-size:10px;font-weight:800;color:${s.c}">${s.floor}</span></span><span style="font-size:12px;font-weight:700;color:${s.c};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.role)}</span><span style="font-size:11px;color:#8A7E77">${esc(s.status)}</span></span></button>`).join('');
  let open = false, cur = 0, held = false;
  book.onclick = () => { open = !open; pnl.style.display = open ? 'flex' : 'none'; bld.style.left = open ? '24px' : '376px'; book.classList.toggle('or', open); };
  const show = (i) => {
    cur = i; const s = STAFF[i];
    ob.style.left = s.x + 'px'; ob.style.top = (s.y - 14) + 'px';
    ob.innerHTML = `<div style="display:flex;gap:10px;align-items:center;min-width:220px;max-width:280px;padding:10px 14px 10px 10px;border-radius:18px;background:#fff;box-shadow:0 10px 26px rgba(30,60,110,.22)"><img src="${IMG}${s.av}.webp" alt="" style="width:40px;height:40px;object-fit:contain"><div><div style="display:flex;align-items:center;gap:6px"><span style="font-size:12px;font-weight:800;color:${s.c}">${esc(s.name)} · ${esc(s.animal)}</span><span class="dots"><i class="d1"></i><i class="d2"></i><i class="d3"></i></span></div><div style="font-size:13px;line-height:1.4">${esc(s.say)}</div></div></div><div class="tail" style="background:#fff;width:14px;height:9px"></div>`;
    ob.style.animation = 'none'; void ob.offsetWidth; ob.style.animation = '';
    v.querySelectorAll('.tag').forEach((t) => { t.style.opacity = +t.dataset.i === i ? 0 : 0.95; });
    v.querySelectorAll('#cards [data-i]').forEach((c) => { c.style.boxShadow = +c.dataset.i === i ? `0 0 0 2.5px ${STAFF[i].c}, 0 6px 18px rgba(30,60,110,.12)` : ''; });
  };
  v.querySelector('#cards').onclick = (e) => { const c = e.target.closest('[data-i]'); if (c) { held = true; show(+c.dataset.i); } };
  show(0); every(3600, () => { if (!held) show((cur + 1) % STAFF.length); });
  // 자리마다 직원 (쉬는 직원은 마당 빈백·해먹)
  const REST = { '꼬북': [123, 736, 'nap'], '펭송': [194, 736, 'nap'], '눈썰미': [330, 716, 'nap'] };
  const ACT = {   // 업무마다 움직임 (10/29 대표 "자기 업무에 맞는 움직임")
    '김맥순': ['sway', 'cup'], '뚝딱': ['lean', 'draw'], '부엉': ['nod', 'tag'], '콩알': ['type', 'keys'], '수달': ['type', 'coin'], '고슴': ['stamp', 'stamp'],
    '도토리': ['lean', 'print'], '이음이': ['point', 'map'], '토깽': ['phone', 'msg'], '받아쓰기': ['swim', 'bub'], '그림이': ['lean', 'draw'],
    '꼬북': ['nap', 'zz'], '펭송': ['nap', 'zz'], '눈썰미': ['nap', 'zz'] };
  const seats = STAFF.map((s) => { const r = REST[s.name], a = ACT[s.name] || ['type', 'keys']; return sprite(bld, { av: s.av, name: s.name, x: r ? r[0] : s.x, y: r ? r[1] : s.y + 44, size: r ? 34 : (s.av === 'guppy' ? 30 : 40), act: a[0], fx: a[1] }); });
  STAFF.forEach((s, i) => { if (REST[s.name]) { s.status = '쉬는 중 · 마당'; } });
  const F = { 6: 142, 5: 238, 4: 330, 3: 426, 2: 522, 1: 634, 0: 737 };
  const wk = (x0, f0, x1, f1) => `M ${x0} ${F[f0]} L 470 ${F[f0]} L 516 ${F[f1]} L ${x1} ${F[f1]}`;
  const EV = [
    { name: '콩알', av: 'raccoon', c: '#5D6B7A', say: '6층에 전표 보고하러 가요', path: wk(220, 4, 360, 6) },
    { name: '이음이', av: 'cat', c: '#5D6B7A', say: '창고 재고 보러 나가요', path: wk(240, 2, 450, 0) },
    { name: '도토리', av: 'squirrel', c: '#E0662F', say: '명세표 결재 받으러 가요', path: wk(270, 3, 380, 6) },
    { name: '뚝딱', av: 'beaver', c: '#9A6A3A', say: '박스 시안 보러 1층 가요', path: wk(244, 5, 300, 1) },
    { name: '펭송', av: 'penguin', c: '#2E4A7A', say: '송장 들고 창고로 가요', path: wk(413, 3, 470, 0) },
    { name: '그림이', av: 'redpanda', c: '#C2551A', say: '팜플렛 시안 보고하러 가요', path: wk(230, 1, 360, 6) },
    { name: '수달', av: 'otter', c: '#8A6A4A', say: '와인바에서 잠깐 쉬어요', path: wk(286, 4, 540, 0) },
  ];
  let e = 0;
  const go = () => {   // 자리에서 일어나 다녀오기 — 그동안 자리는 비어 있음
    const w = EV[e++ % EV.length], i = STAFF.findIndex((s) => s.name === w.name); const seat = seats[i];
    if (seat) seat.style.visibility = 'hidden';
    walker(bld, { ...w, size: 34, dur: 7 });
    later(9000, () => { const back = 'M ' + w.path.replace(/^M\s*/, '').split(' L ').reverse().join(' L '); walker(bld, { ...w, say: '자리로 돌아가요', path: back, size: 34, dur: 7 }); });
    later(16200, () => { if (seat) seat.style.visibility = ''; });
  };
  go(); every(9000, go);
}

// ── 창고 ───────────────────────────────────────────────
function warehouse() {
  const tone = { done: ['#E6F7EC', '#1E8E3E'], go: ['#E6F0FF', '#2F6BD6'], load: ['#FFF1E6', '#C2551A'], wait: ['#F2ECE6', '#8A7E77'] };
  const rows = [
    { t: '06:02', who: '박건 기사님 · 3.5톤 광폭윙', where: '여주 → 천안창고 하차 · 서생 판재', st: '하차 완료', k: 'done' },
    { t: '08:54', who: '김석주 기사님 · 1톤', where: '곤지암 우림 → 창고 · 메가타이', st: '하차 완료', k: 'done' },
    { t: '09:40', who: '전국24시 · 1.4톤 카고', where: '창고 → 화성 매향리', st: '출발', k: 'go' },
    { t: '13:15', who: '정소장 · 5톤 혼적', where: '창고 → 울산 서생 · 3m 사이딩', st: '상차 중', k: 'load' },
    { t: '14:30', who: '대신화물', where: '창고 → 순천 낙안 · 클립 200', st: '대기', k: 'wait' },
    { t: '15:10', who: '삼양팀버 소장님 · 직접', where: '창고 → 팽성 · 인슐 R37 6롤', st: '대기', k: 'wait' },
  ];
  const stock = [['구조재 2*6*12', '120본', '캐나다 SPF', '#B07A2A'], ['구조재 2*6*16', '64본', 'J-GRADE', '#B07A2A'], ['실리콘 박스', '86박스', 'SS9000 · 원익', '#3F7FE0'], ['메가타이 철물', '32상자', 'HD3 · R1 · H-CLIP', '#5D6B7A'], ['단열재 R37', '6롤', '삼양 대기', '#C9A227'], ['세라믹 판재', '20장', '2층 자재칸', '#6A52D8']];
  const v = el(`<div class="v" style="background:#D8E9FA">
    <div id="wh" style="position:absolute;left:40px;top:20px;width:688px;height:860px">
      <img src="${IMG}warehouse_e.webp" alt="홈트 창고 — 구조재 랙, 실리콘 박스, 철물 벽, 키오스크, 상차장" style="width:688px;height:860px;display:block;border-radius:28px">
      <span style="position:absolute;left:444px;top:486px;width:44px;height:44px;border-radius:50%;background:radial-gradient(circle,rgba(120,200,255,.9),rgba(120,200,255,0) 70%);animation:glow 1.6s ease-in-out infinite;z-index:3"></span>
      <div id="wbub" class="bub"></div>
    </div>
    <div style="position:absolute;left:60px;bottom:22px;display:flex;gap:8px;z-index:8">${backBtn('#/campus', '단지')}<a class="btn" href="#/office" style="color:#E8732C">사무실 가기</a></div>
    <div style="position:absolute;left:760px;right:24px;top:20px;bottom:20px;display:flex;flex-direction:column;gap:12px">
      <div class="card" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px"><div><div style="font-size:12px;color:#8A7E77">천안 서북구 직산읍 신갈리 206-6</div><div style="font-size:22px;font-weight:800">홈트 창고</div></div><button id="ck" type="button" class="btn" style="background:#3F7FE0;color:#fff">기사님 체크인</button></div>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">${stock.map(([n, q, s, c]) => `<div class="card" style="border-radius:18px;padding:12px 14px"><div style="font-size:12px;font-weight:800;color:${c}">${n}</div><div style="font-size:24px;font-weight:800">${q}</div><div style="font-size:11px;color:#8A7E77">${s}</div></div>`).join('')}</div>
      <div class="card" style="flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden"><div style="display:flex;justify-content:space-between;padding:14px 18px 8px"><span style="font-size:16px;font-weight:800">키오스크 · 오늘 상하차</span><span id="nrow" style="font-size:12px;font-weight:800;color:#3F7FE0"></span></div><div id="rows" class="scroll" style="flex:1;padding:0 10px 10px"></div></div>
    </div></div>`);
  stage.appendChild(v);
  const box = v.querySelector('#rows');
  const row = (r, isNew) => `<div class="${isNew ? 'newrow' : ''}" style="display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px;border-bottom:1px solid #F1EEEA"><span style="font-size:14px;font-weight:800">${r.t}</span><span style="min-width:0"><span style="display:block;font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.who)}</span><span style="display:block;font-size:12px;color:#8A7E77;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.where)}</span></span><span class="pill" style="background:${tone[r.k][0]};color:${tone[r.k][1]}">${r.st}</span></div>`;
  box.innerHTML = rows.map((r) => row(r)).join(''); v.querySelector('#nrow').textContent = rows.length + '건';
  v.querySelector('#ck').onclick = () => { rows.unshift({ t: hm(), who: '새 기사님 · 키오스크 체크인', where: '배차 확인 중', st: '체크인', k: 'go' }); box.insertAdjacentHTML('afterbegin', row(rows[0], true)); v.querySelector('#nrow').textContent = rows.length + '건'; };
  const SB = [[466, 494, '키오스크', '#3F7FE0', '박건 기사님 체크인 · 서생 3.5톤'], [541, 504, '기사님', '#E07B1F', '상차증 받았어요, 출발할게요!'], [572, 656, '빨리 · 불독', '#B07A2A', '2*6*12 120본 남았어요'], [219, 680, '노훈님', '#2E4A7A', '5톤에 구조재 싣는 중이에요'], [516, 166, '2층 자재칸', '#6A52D8', '세라믹 판재 재고 확인 중']];
  const wb = v.querySelector('#wbub'); let i = 0;
  const show = () => { const [x, y, n, c, t] = SB[i++ % SB.length]; wb.style.left = x + 'px'; wb.style.top = (y - 12) + 'px'; wb.innerHTML = `<div style="min-width:180px;max-width:250px;padding:9px 13px;border-radius:16px;background:#fff;box-shadow:0 10px 26px rgba(30,60,110,.22)"><div style="font-size:12px;font-weight:800;color:${c}">${n}</div><div style="font-size:13px;line-height:1.4">${t}</div></div><div class="tail" style="background:#fff;width:14px;height:9px"></div>`; wb.style.animation = 'none'; void wb.offsetWidth; wb.style.animation = ''; };
  show(); every(3400, show);
  const wh = v.querySelector('#wh');
  sprite(wh, { av: 'driver', name: '기사님', x: 452, y: 572, size: 40, act: 'phone', fx: 'msg' });
  sprite(wh, { av: 'dog', name: '빨리', x: 574, y: 706, size: 46, act: 'nod', fx: 'count' });
  sprite(wh, { av: 'driver', name: '노훈님', x: 236, y: 700, size: 38, act: 'sway', flip: -1 });
  sprite(wh, { av: 'rabbit', name: '토깽', x: 515, y: 196, size: 30, act: 'nod', fx: 'file' });
  const drv = () => walker(wh, { name: '기사님', av: 'driver', c: '#E07B1F', say: '상차증 받았어요', path: 'M 540 570 L 560 640 L 470 700 L 380 720', size: 38, dur: 6 });
  drv(); every(12000, drv);
  const leaves = ['서생행 출발', '매향리행 출발', '순천 택배 출발']; let e = 0;
  const go = () => { leaver(v.querySelector('#wh'), 'M 470 770 L 560 800 L 720 860', leaves[e % 3], ...COLORS[e % 2]); e++; }; go(); every(9000, go);
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
const VIEWS = { '': village, campus, office, warehouse };
function show() {
  clearAll(); stage.innerHTML = '';
  setTimeout(() => stage.querySelectorAll('.boardBtn').forEach((b) => { b.onclick = openBoard; }), 0);
  const key = (location.hash.replace(/^#\/?/, '') || '').split('?')[0];
  (VIEWS[key] || village)();
}
async function boot() {
  fit();
  stage.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#6B8AA8;font-size:18px;font-weight:700">불러오는 중…</div>';
  let ok = false;
  try {
    const sess = await S.getSession();
    if (sess) { const acc = await S.myAccess(); const id = ((sess.user && sess.user.email) || '').split('@')[0]; ok = acc ? !!acc.staff : !/^space\d+$/.test(id); }
  } catch (e) { ok = false; }
  if (!ok) { stage.innerHTML = `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px"><div style="font-size:22px;font-weight:800">직원 로그인 필요</div><a class="btn or" href="/">로그인하러 가기</a></div>`; return; }
  window.addEventListener('hashchange', show); show();
}
boot();
