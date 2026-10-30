// 세로형 키오스크 '/kiosk' (10/29 대표 "세로형 화면에도 한눈에 — 배차 요청해야 하는 건·배차 완료·발주 요청")
// 첫 화면 출고 흐름과 같은 자료(site_inbox 'flow:board'), 1분마다 새로 받음. 줄 누르면 상세 + 배차 완료·출고 완료 (10/29 대표) — 저장은 첫 화면과 같은 S.setShipCase
import * as S from './store-supabase.js?v=10';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const K = { chk: {}, data: null, err: '', timer: 0, clock: 0, lock: null, sel: '', ask: '', busy: false, toast: '', me: '', over: {}, anim: false, tool: '', talk: '', sug: null, note: '' };   // tool = 'talk'(카톡 넣기) · 'box'(자료 넣기)   // over = 방금 누른 건 (맥 도우미가 새 판을 올릴 때까지 화면에 유지)
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
    quote: sortRows(rows.filter((r) => has(r, '견적') && !has(r, '발주', '배차 요청', '배차 완료') && !done(r))),   // 견적 줘야 하는데 못 준 것 (10/30 대표)
  };
}

const when = (r) => { const d = dayOf(r); return d === today() ? '오늘' : d === tmr() ? '내일' : /^\d\d\/\d\d$/.test(d) ? d : '미정'; };
const who = (r) => String(r.partner || '').replace(/^\(주\)|^주식회사\s*/, '').replace(/제작소$|홈$/, '');
const itemsOf = (r) => String(r.items || r.item || '').replace(/^[^:·]{1,20}:\s*/, '').split(/\s*·\s*|\s*,\s+|\n+/).map((t) => t.trim()).filter(Boolean);   // 품목 한 줄에 하나 (10/30 대표)
function row(r, red) {
  const lt = red && late(r), d = dayOf(r), ok = /^\d\d\/\d\d$/.test(d), w = when(r);   // 출고 요청일을 크게, 요일·시간은 아래 (10/30 대표)
  const wd = ok ? '일월화수목금토'[new Date(new Date().getFullYear(), +d.slice(0, 2) - 1, +d.slice(3)).getDay()] : '';
  const t = String(r.time || '').replace(/\s*착$/, '').trim(), big = ok ? d.replace(/^0/, '') : '미정';
  const sub = [lt ? '지남' : w === '오늘' || w === '내일' ? w : wd, t].filter(Boolean).join(' · ');
  return `<div class="ki-r ${lt ? 'late' : ''} ${w === '오늘' ? 'today' : ''}" data-ki="row" data-no="${esc(r.no)}"><div class="ki-w"><b>${esc(big)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div>
    <div class="ki-m"><div class="ki-p">${esc(who(r) || r.site || '거래처 확인')}</div><div class="ki-a">${esc(r.site && who(r) ? r.site : '')}</div><div class="ki-i">${esc(itemsOf(r).join(' · '))}</div>${r.car && !/^배차 (필요|완료)$|^—$|^확인$/.test(r.car) ? `<div class="ki-c">${esc(r.car)}</div>` : ''}</div><i class="ki-ch" aria-hidden="true">›</i></div>`;
}
function sec(cls, name, rs, max, red) {
  const more = rs.length - max;
  return `<section class="ki-s ${cls}" id="ki-${cls}"><h2><span class="ki-hi">${IC[cls]}</span><span>${name}</span><em>${rs.length}</em></h2><div class="ki-card">
    ${rs.length ? rs.slice(0, max).map((r) => row(r, red)).join('') : '<div class="ki-z">없음</div>'}${more > 0 ? `<div class="ki-more">+${more}</div>` : ''}</div></section>`;
}

const sv = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  talk: sv('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
  box: sv('<path d="M4 7h16v12H4z"/><path d="M4 7l2-3h12l2 3"/><path d="M9 12h6"/>'),
  'k-need': sv('<path d="M4 10v4l3 1 9 4V5L7 9z"/><path d="M19 9.5a3 3 0 0 1 0 5"/>'),
  'k-car': sv('<path d="M2.5 7h11v9h-11zM13.5 10h4l3 3v3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>'),
  'k-order': sv('<rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>'),
  'k-out': sv('<path d="M20 6 9 17l-5-5"/>'),
  'k-quote': sv('<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8 7h8M8.5 11h1M11.5 11h1M14.5 11h1M8.5 14h1M11.5 14h1M14.5 14h1M8.5 17h1M11.5 17h4"/>'),
};
const byNo = (no) => ((K.data && K.data.rows) || []).find((r) => r.no === no);
const stage = (r) => (done(r) ? '출고 완료' : has(r, '배차 완료') ? '차 잡힘' : has(r, '배차 요청') ? '배차 해야 함' : has(r, '발주') ? '발주 요청' : has(r, '견적') ? '견적 보내야 함' : '');
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
  const btns = st === '견적 보내야 함' ? '' : [st === '배차 해야 함' || st === '발주 요청' ? btn('disp', '배차 완료') : '', st !== '출고 완료' ? btn('ship', '출고 완료') : ''].join('');
  const it = itemsOf(r);
  const chk = memo.map((t, j) => { const k = r.no + '|' + j, on = !!K.chk[k];
    return `<button type="button" class="ks-ck ${on ? 'on' : ''}" data-ki="chk" data-k="${esc(k)}"><span class="ks-bx" aria-hidden="true">${on ? '✓' : ''}</span><span class="ks-ct">${esc(t)}</span></button>`; }).join('');
  const a = K.anim ? ' in' : ''; K.anim = false;   // 처음 열 때만 아래에서 올라옴
  return `<div class="ks-ov${a}" data-ki="close"><div class="ks${a}" role="dialog" aria-label="출고 건">
    <div class="ks-grab"></div>
    <div class="ks-hd"><div><div class="ks-st">${esc(st)}</div><div class="ks-t">${r.site ? esc(r.site) : '현장 확인'}</div><div class="ks-s">${esc(r.partner || '')}${r.boss ? ' · ' + esc(r.boss) : ''}</div></div>
      <button type="button" class="ks-x" data-ki="close" aria-label="닫기">✕</button></div>
    <div class="ks-g">
      ${kv('도착', [dayOf(r), r.time].filter(Boolean).join(' '))}${kv('주소', r.site_full)}${kv('상차', r.from)}${kv('차량', r.veh || (r.car && !/^—$|^배차 필요$|^확인$/.test(r.car) ? r.car : ''))}${kv('규격', r.size)}${missHtml(r)}
    </div>
    ${memo.length ? `<div class="ks-k">할 일</div><div class="ks-cl">${chk}</div>` : ''}
    ${it.length ? `<div class="ks-k">품목 ${it.length}</div><div class="ks-box ks-its">${it.map((x) => `<div>${esc(x)}</div>`).join('')}</div>` : ''}
    ${btns ? `<div class="ks-bs">${btns}</div>` : ''}
  </div></div>`;
}

const won = (n) => (n ? `${Math.round(n).toLocaleString()}원` : '—');
const vshort = (v) => String(v || '').replace(/^\(주\)|^주식회사\s*|\s*주식회사$|\s*유한회사$/g, '').trim();
function sugHtml(g) {   // 카톡 넣기 결과 — 한 곳 추천 · 품목별 매입처 단가(언제 값인지) · 지난 운임 · 같은 현장 지난 출고
  if (!g) return '';
  if (!g.ok) return `<div class="kt-err">${esc(g.error || '못 읽었어요')}</div>`;
  const one = g.best, c = g.combo || {};
  const head = one ? `<div class="kt-rec"><span>한 곳에서 다</span><b>${esc(vshort(one.vendor))}</b><em>${won(one.total)}</em></div>`
    : `<div class="kt-rec two"><span>한 곳에서 다 되는 곳 없음</span><b>${esc((c.vendors || []).map(vshort).join(' + ') || '—')}</b><em>${won(c.total)}${(c.vendors || []).length > 1 ? ` · 상차 ${c.vendors.length}곳` : ''}</em></div>`;
  const vs = (g.vendors || []).slice(0, 5).map((v) => `<div class="kt-v ${v.cover === v.of ? 'all' : ''}"><b>${esc(vshort(v.vendor))}</b><span>${v.cover}/${v.of}</span><em>${won(v.total)}</em>
    ${v.missing.length ? `<i>없음 ${esc(v.missing.join(' · '))}</i>` : '<i>다 있음</i>'}</div>`).join('');
  const ls = (g.lines || []).map((l) => { const c0 = l.cands[0];
    const offers = l.cands.flatMap((cd) => cd.vendors.filter((v) => !v.odd).map((v) => ({ ...v, item: cd.item }))).sort((a, b) => a.price - b.price).slice(0, 4);
    const sold = c0 && c0.sold ? `<span class="kt-sold">판매 ${won(c0.sold.price)} ${esc(c0.sold.day || '')}</span>` : '';
    return `<div class="kt-l"><div class="kt-lh"><b>${esc(l.name)}</b><span>${l.qty}${esc(l.unit)}</span>${sold}</div>
      ${c0 ? `<div class="kt-it">${esc(c0.item)}</div>` : '<div class="kt-it no">매입 기록 없음</div>'}
      ${offers.map((v, i) => `<div class="kt-o ${i === 0 ? 'low' : ''}"><b>${esc(vshort(v.vendor))}</b><em>${won(v.price)}</em><span>${esc(v.day)} ${esc(v.src === '이카운트 구매' ? '구매' : v.src)}</span></div>`).join('')}</div>`; }).join('');
  const fs = (g.fares || []).filter((f) => !f.err).map((f) => `<div class="kt-o"><b>${esc(f.day)} ${esc(f.car || '')}</b><em>${won(f.won)}</em><span>${esc(vshort(f.from) || '')}</span></div>`).join('');
  const ps = (g.past || []).map((x) => `<div class="kt-p"><b>${esc(x.day)}${x.from ? ' · ' + esc(vshort(x.from)) : ''}</b><span>${esc(x.items)}</span></div>`).join('');
  return `${g.site || g.when ? `<div class="ks-g">${g.site ? `<div class="ks-kv"><span>현장</span><b>${esc(g.site)}</b></div>` : ''}${g.when ? `<div class="ks-kv"><span>도착</span><b>${esc(g.when)}</b></div>` : ''}</div>` : ''}
    ${head}<div class="ks-k">매입처</div><div class="ks-box kt-vs">${vs || '<div>없음</div>'}</div>
    <div class="ks-k">품목별 매입가</div><div class="kt-ls">${ls}</div>
    ${fs ? `<div class="ks-k">${esc(g.region)} 지난 운임</div><div class="ks-box">${fs}</div>` : ''}
    ${ps ? `<div class="ks-k">같은 현장 지난 출고</div><div class="ks-box">${ps}</div>` : ''}`;
}
function toolSheet() {
  if (!K.tool) return '';
  const a = K.anim ? ' in' : ''; K.anim = false;
  const talk = K.tool === 'talk';
  const body = talk
    ? `<textarea id="kt-text" class="kt-ta" rows="6" placeholder="카톡 글 붙여넣기">${esc(K.talk)}</textarea>
       <div class="ks-bs kt-bs"><button type="button" class="ks-b" data-ki="paste">붙여넣기</button><button type="button" class="ks-b go" data-ki="suggest" ${K.busy ? 'disabled' : ''}>${K.busy ? '찾는 중…' : '구매처 찾기'}</button></div>
       ${sugHtml(K.sug)}`
    : `<textarea id="kt-text" class="kt-ta" rows="6" placeholder="카톡·문자 글 붙여넣기">${esc(K.talk)}</textarea>
       <div class="ks-bs kt-bs"><button type="button" class="ks-b" data-ki="pick">사진·파일</button><button type="button" class="ks-b go" data-ki="put" ${K.busy ? 'disabled' : ''}>${K.busy ? '올리는 중…' : '넣기'}</button></div>
       ${K.note ? `<div class="kt-note">${esc(K.note)}</div>` : ''}<input type="file" id="kt-file" multiple accept="image/*,.heic,.pdf,.xlsx,.xls,.csv,.txt" hidden>`;
  return `<div class="ks-ov${a}" data-ki="close"><div class="ks${a}" role="dialog" aria-label="${talk ? '카톡 넣기' : '자료 넣기'}">
    <div class="ks-grab"></div>
    <div class="ks-hd"><div><div class="ks-t">${talk ? '카톡 넣기' : '자료 넣기'}</div></div><button type="button" class="ks-x" data-ki="close" aria-label="닫기">✕</button></div>
    ${body}</div></div>`;
}

export function screen() {
  const n = new Date(), wd = '일월화수목금토'[n.getDay()];
  if (!K.data) return `<div class="ki-box"><div class="ki"><div class="ki-z">${esc(K.err || '불러오는 중')}</div></div></div>`;
  const g = groups(), at = K.data.at ? String(K.data.at).slice(11, 16) : '';
  return `<div class="ki-box"><div class="ki">
    <header class="ki-h"><div class="ki-clk" data-ki="reload"><span>${n.getMonth() + 1}월 ${n.getDate()}일 ${wd}요일</span><b>${p2(n.getHours())}:${p2(n.getMinutes())}</b></div><img class="ki-logo" src="/icons/logo-full.png" alt="HOME TRADERS"></header>
    <div class="ki-act"><button type="button" data-ki="tool" data-k="talk">${IC.talk}<span>카톡 넣기</span></button><button type="button" data-ki="tool" data-k="box">${IC.box}<span>자료 넣기</span></button></div>
    <div class="ki-t">${[['k-need', g.need, '배차 해야 함'], ['k-quote', g.quote, '견적 대기'], ['k-car', g.car, '차 잡힘'], ['k-order', g.order, '발주 요청'], ['k-out', g.out, '출고 완료']]
      .map(([k, rs, l]) => `<div class="${k}" data-ki="jump" data-k="${k}"><i>${IC[k]}</i><b>${rs.length}</b><span>${l}</span></div>`).join('')}</div>
    ${sec('k-need', '배차 해야 함', g.need, 14, true)}
    ${sec('k-quote', '견적 보내야 함', g.quote, 10, false)}
    ${sec('k-car', '차 잡힘 · 도착 확인', g.car, 8, false)}
    ${sec('k-order', '발주 요청', g.order, 8, false)}
    ${sec('k-out', '오늘 출고 완료', g.out, 12, false)}
    ${at ? `<div class="ki-at">${esc(at)}</div>` : ''}
  </div>${K.tool ? toolSheet() : sheet()}${K.toast ? `<div class="ki-toast">${esc(K.toast)}</div>` : ''}</div>`;
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
function suggest(draw) {   // 사무실 맥 도우미 /api/buy/suggest (읽기만) — 공유 DB 로 대신 부탁 (10/30 대표 "카톡 넣으면 구매처 추천·단가·언제 견적")
  if (!K.talk.trim() || K.busy) return;
  K.busy = true; K.sug = null; draw();
  S.relayHelper('/api/buy/suggest', { text: K.talk }, K.me).then((j) => { K.sug = j; }).catch((e) => { K.sug = { ok: false, error: e.message || String(e) }; })
    .finally(() => { K.busy = false; draw(); });
}
const readUrl = (f) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(f); });
async function shrink(f) {   // 큰 사진은 2200px JPEG (첫 화면 자료 넣기와 같음)
  if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size < 1.5e6) return { data: await readUrl(f), mime: f.type };
  const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(f); });
  const k = Math.min(1, 2200 / Math.max(img.width, img.height)), c = document.createElement('canvas');
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return { data: c.toDataURL('image/jpeg', 0.85), mime: 'image/jpeg' };
}
async function putInbox(items, draw) {   // 자료 넣기 — site_inbox (첫 화면 자료 넣기와 같은 꼴, 맥 도우미가 가져감)
  if (!items.length || K.busy) return;
  K.busy = true; K.note = ''; draw();
  let ok = 0, err = '';
  for (const it of items) {
    try {
      const row = { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, created_by: K.me || null, status: 'wait' };
      if (typeof it === 'string') Object.assign(row, { kind: 'text', name: it.trim().split('\n')[0].slice(0, 60), body: it });
      else {
        if (it.size > 8e6 && !/^image\//.test(it.type)) { err = `${it.name}: 8MB 넘음`; continue; }
        const { data, mime } = await shrink(it);
        Object.assign(row, { kind: 'file', name: it.name || '사진.png', mime: mime || it.type, data });
      }
      const e = await S.addInbox(row); if (e) err = e; else ok += 1;
    } catch (e) { err = e.message || String(e); }
  }
  K.busy = false;
  if (!err) K.talk = '';
  K.note = err ? `못 넣었어요 — ${err}` : `${ok}건 넣었어요`;
  draw();
}
function shut(draw) {   // 핸드폰처럼 아래로 내려가며 닫힘
  const ov = document.querySelector('.ks-ov'), ks = ov && ov.querySelector('.ks');
  const off = () => { K.sel = ''; K.ask = ''; K.tool = ''; draw(); };
  if (!ks || ov.classList.contains('out')) { off(); return; }
  ov.classList.add('out'); ks.style.transform = '';
  setTimeout(off, 240);
}
function drag(draw) {   // 시트 위쪽을 잡아 아래로 끌면 닫힘
  let y0 = 0, dy = 0, ks = null;
  document.addEventListener('pointerdown', (e) => {
    const k = e.target.closest('.ks'); if (!k || k.scrollTop > 0 || e.target.closest('button, textarea')) return;
    ks = k; y0 = e.clientY; dy = 0; ks.style.transition = 'none';
  });
  document.addEventListener('pointermove', (e) => { if (!ks) return; dy = Math.max(0, e.clientY - y0); ks.style.transform = dy ? `translateY(${dy}px)` : ''; });
  const up = () => { if (!ks) return; const k = ks; ks = null; k.style.transition = '';
    if (dy > 90) { K.drag = true; setTimeout(() => { K.drag = false; }, 400); shut(draw); } else k.style.transform = ''; };
  document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
}
function onTap(e, draw) {
  if (K.drag) { K.drag = false; return; }
  if (!document.body.classList.contains('kiosk')) return;
  const t = e.target.closest('[data-ki]'); if (!t) return;
  const a = t.dataset.ki;
  if (a === 'close' && (e.target === t || t.classList.contains('ks-x'))) shut(draw);
  else if (a === 'row') { K.sel = t.dataset.no; K.ask = ''; K.anim = true; draw(); }
  else if (a === 'disp' || a === 'ship') { if (K.ask === a) save(a, draw); else { K.ask = a; draw(); } }
  else if (a === 'jump') { const el = document.getElementById('ki-' + t.dataset.k); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else if (a === 'reload') pull(draw);
  else if (a === 'chk') { const k = t.dataset.k; K.chk[k] = !K.chk[k]; draw(); }
  else if (a === 'tool') { K.tool = t.dataset.k; K.note = ''; if (K.tool === 'box') K.sug = null; K.anim = true; draw(); }
  else if (a === 'paste') { try { navigator.clipboard.readText().then((x) => { if (x) { K.talk = x; draw(); } }).catch(() => {}); } catch (_) { /* 무시 */ } }
  else if (a === 'suggest') suggest(draw);
  else if (a === 'pick') { const f = document.getElementById('kt-file'); if (f) f.click(); }
  else if (a === 'put') { if (K.talk.trim()) putInbox([K.talk], draw); }
}
export function start(draw, me) {
  K.me = me || K.me;   // 1분마다 새 자료, 시계는 20초마다 · 화면 꺼짐 막기
  if (K.timer) return;
  const tick = () => { if (!K.tool) draw(); };   // 카톡·자료 넣기 여는 동안은 다시 안 그림 (쓰던 글 유지)
  pull(draw);
  K.timer = setInterval(() => pull(tick), 60000);
  K.clock = setInterval(tick, 20000);
  document.addEventListener('input', (e) => { if (e.target.id === 'kt-text') K.talk = e.target.value; });
  document.addEventListener('change', (e) => { if (e.target.id === 'kt-file') { putInbox([...e.target.files], draw); e.target.value = ''; } });
  const wake = () => { try { if (navigator.wakeLock && document.visibilityState === 'visible') navigator.wakeLock.request('screen').then((l) => { K.lock = l; }).catch(() => {}); } catch (_) { /* 무시 */ } };
  wake(); document.addEventListener('visibilitychange', wake);
  document.addEventListener('click', (e) => onTap(e, draw));
  drag(draw);
  document.addEventListener('click', () => {   // 화면 한 번 누르면 전체 화면 — 브라우저 주소창 숨김 (10/29 대표)
    if (!document.body.classList.contains('kiosk') || document.fullscreenElement) return;
    try { const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen({ navigationUI: 'hide' }); if (p) p.catch(() => {}); } catch (_) { /* 무시 */ }
  });
}
export function stop() { clearInterval(K.timer); clearInterval(K.clock); K.timer = 0; K.clock = 0; try { if (K.lock) K.lock.release(); } catch (_) { /* 무시 */ } }
