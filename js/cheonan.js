// 천안 재고 (10/31 대표 "천안 체크리스트·전자송장 체크를 재고 빠짐으로 연결")
//   실사 = 재고.xlsx '천안' 줄 (맥 town_status.py → site_inbox 'town:stock') — 이카운트 재고는 안 맞아서 안 씀
//   나갈 것 = 출고 흐름(flow:board) 구매 줄 중 거래처가 '천안…' 인 것 (대표가 전화로 불러 주는 천안 체크리스트)
//   빼기 = site_inbox kind 'cnout' (직원 전용 표) — 품목·수량을 고른 것만 재고에서 빠짐. 전자 송장 체크·서명은 옆에 표시하고 품목 채우기에 씀
import * as S from './store-supabase.js?v=12';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (n) => (Math.round((Number(n) || 0) * 10) / 10).toLocaleString();
const C = { at: 0, loading: false, err: '', stock: null, flow: null, outs: {}, es: [], open: '', draft: null, busy: false, all: false };
let ctx = { rerender: () => {}, me: () => '' };

export function load(force) {
  if (C.loading || (!force && Date.now() - C.at < 60000)) return;
  C.loading = true; C.at = Date.now();
  Promise.allSettled([S.getTownStock(), S.getFlowBoard(), S.getCnOuts(), S.listSongjang()]).then(([st, fb, o, es]) => {
    C.err = [st, fb, o].filter((x) => x.status === 'rejected').map((x) => x.reason.message).join(' · ');
    if (st.status === 'fulfilled') C.stock = st.value;
    if (fb.status === 'fulfilled') C.flow = fb.value;
    if (o.status === 'fulfilled') C.outs = o.value;
    if (es.status === 'fulfilled') C.es = es.value;
  }).finally(() => { C.loading = false; ctx.rerender(); });
}

const isCn = (w) => /천안/.test(String(w || ''));
function items() {   // 실사 품목 — 같은 이름은 합침
  const m = new Map();
  ((C.stock || {}).rows || []).filter((r) => isCn(r.wh) && r.state !== '반품').forEach((r) => {
    const k = String(r.item).trim(); if (!k) return;
    const x = m.get(k) || { item: k, qty: 0, plt: 0, check: false };
    x.qty += Number(r.qty) || 0; x.plt += Number(r.plt) || 0; if (r.state === '확인') x.check = true;
    m.set(k, x);
  });
  return [...m.values()];
}
function baseMd() {   // 실사 날짜 (메타 업데이트일자) — 이 날부터 나간 것을 뺌
  const u = (C.stock || {}).updated || '';
  const m = /\d{4}-(\d{2})-(\d{2})/.exec(u);
  return m ? +(m[1] + m[2]) : 0;
}
function outRows() {
  const b = baseMd();
  return ((C.flow || {}).rows || []).filter((r) => (r.md || 0) >= b && (r.buys || []).some((x) => isCn(x.name)))
    .map((r) => ({ r, text: r.buys.filter((x) => isCn(x.name)).map((x) => x.item).join(' / ') }))
    .sort((a, b2) => (b2.r.md || 0) - (a.r.md || 0) || String(b2.r.no).localeCompare(String(a.r.no)));
}
const spec = (s) => (/\d+\*\d+\*\d+/.exec(s) || [''])[0];
function guess(text) {   // 글에서 '2*6*12 6PLT' → 실사 품목·수량 (PLT 는 파렛트당 개수로)
  const its = items(), out = [];
  for (const it of its) {   // '12자(3600) 3PLT(98·83·196)' 처럼 길이·파렛트별 개수를 적었으면 그 합
    const len = (/\((\d{4})\)/.exec(it.item) || [])[1]; if (!len) continue;
    const m = new RegExp(`\\(${len}\\)\\s*\\d+\\s*(?:PLT|pt)\\s*\\(([\\d·,\\s]+)\\)`, 'i').exec(text);
    if (m) out.push({ item: it.item, qty: m[1].split(/[·,\s]+/).reduce((a, x) => a + (+x || 0), 0) });
  }
  for (const it of its) {
    const sp = spec(it.item); if (!sp) continue;
    const m = new RegExp(`${sp.replace(/\*/g, '\\*')}(?![\\d*])\\s*(\\d+)\\s*(PLT|pt|파레트|팔레트)?`, 'i').exec(text);
    if (!m) continue;
    let q = +m[1];
    if (m[2] && it.plt) q = Math.round(q * it.qty / it.plt);
    if (!out.some((o) => o.item === it.item) && !out.some((o) => spec(o.item) === sp)) out.push({ item: it.item, qty: q });
  }
  return out;
}
function esOf(r) {   // 같은 날·같은 거래처 전자 송장
  const ymd = r.md ? `2026${String(r.md).padStart(4, '0')}` : '';
  const p = String(r.partner || '').replace(/주식회사|\(주\)|\s/g, '');
  return (C.es || []).filter((x) => x.ymd === ymd && p && String(x.partner || '').replace(/주식회사|\(주\)|\s/g, '').includes(p.slice(0, 4)));
}
function used() {   // 품목별 뺀 수량
  const u = {};
  Object.values(C.outs).forEach((o) => { if (!o.skip) (o.lines || []).forEach((l) => { u[l.item] = (u[l.item] || 0) + (Number(l.qty) || 0); }); });
  return u;
}

export async function fetchSummary() {   // town 창고 (10/31 대표 "town 에서 얼마 남았고 얼마 나가는지 보고 싶어")
  const [st, fb, o, es] = await Promise.allSettled([S.getTownStock(), S.getFlowBoard(), S.getCnOuts(), S.listSongjang()]);
  if (st.status === 'fulfilled') C.stock = st.value;
  if (fb.status === 'fulfilled') C.flow = fb.value;
  if (o.status === 'fulfilled') C.outs = o.value;
  if (es.status === 'fulfilled') C.es = es.value;
  C.at = Date.now();
  return summary();
}
export function summary() {   // 품목별 실사·나감(뺀 것)·남음·나갈 것(아직 안 뺀 천안 줄 추정)
  const its = items(), u = used(), pend = {}, pl = {};
  outRows().filter((o) => !C.outs[o.r.no]).forEach((o) => guess(o.text).forEach((g) => {
    pend[g.item] = (pend[g.item] || 0) + g.qty;
    (pl[g.item] = pl[g.item] || []).push({ no: o.r.no, md: o.r.md, partner: o.r.partner, site: o.r.site, qty: g.qty });
  }));
  return { updated: (C.stock || {}).updated || '', wait: waitN(), items: its.map((it) => ({ ...it, out: u[it.item] || 0, left: it.qty - (u[it.item] || 0), pend: pend[it.item] || 0, pendList: pl[it.item] || [] })) };
}
export const waitN = () => outRows().filter((o) => !C.outs[o.r.no]).length;

const CSS = `<style>
.cn{display:flex;flex-direction:column;gap:14px}
.cn-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.cn-h h2{margin:6px 0 0;font-size:19px}.cn .sp{flex:1}
.cn-tag{font-size:13px;font-weight:700;padding:3px 9px;border-radius:999px;background:#F2F2F0;color:#3A3A3C}.cn-tag.red{background:#FDE2E1;color:#B42318}
.cn-err{color:#B42318;font-size:14px}.cn-empty{color:#8A8A8E;padding:18px 4px}
.cn-t{width:100%;border-collapse:collapse;background:#fff;border:1px solid #E6E4DF;border-radius:12px;overflow:hidden;font-size:15px}
.cn-t th{background:#F7F7F5;font-size:13px;color:#6B6B70;font-weight:700;text-align:right;padding:9px 12px}.cn-t th:first-child,.cn-t td:first-child{text-align:left}
.cn-t td{padding:10px 12px;border-top:1px solid #EFEDE8;text-align:right;font-variant-numeric:tabular-nums}.cn-t td i{font-style:normal;font-size:12px;color:#B54708;background:#FEF0C7;border-radius:6px;padding:1px 6px}
.cn-t tr.neg td b{color:#B42318}
.cn-list{display:flex;flex-direction:column;gap:10px}
.cn-c{background:#fff;border:1px solid #E6E4DF;border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:8px}.cn-c.done{background:#FAFAF8}
.cn-r1{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.cn-d{font-size:17px}.cn-site{color:#6B6B70;font-size:14px}
.cn-tx{font-size:14px;color:#3A3A3C;line-height:1.5;word-break:keep-all}
.cn-st{font-size:13px;font-weight:700;padding:3px 9px;border-radius:8px;background:#F2F2F0;color:#6B6B70}.cn-st.ok{background:#1a1a1a;color:#fff}.cn-st.no{background:#fff;border:1px solid #D0D0D0;color:#3A3A3C}
.cn-es{font-size:13px;font-weight:700;padding:3px 9px;border-radius:8px;border:1px solid #D0D0D0;color:#3A3A3C;text-decoration:none}.cn-es.mid{border-color:#F79009;color:#B54708}.cn-es.ok{background:#ECFDF3;border-color:#ABEFC6;color:#067647}
.cn-ed{display:flex;flex-direction:column;gap:8px;border-top:1px dashed #E6E4DF;padding-top:10px}
.cn-l{display:grid;grid-template-columns:minmax(0,1fr) 110px 36px;gap:8px}.cn-l select,.cn-l input{height:40px;border:1px solid #D9D7D2;border-radius:8px;padding:0 10px;font:inherit;font-size:15px;background:#fff;min-width:0}
</style>`;

export function screen() {
  load();
  const its = items(), u = used(), outs = outRows();
  const wait = outs.filter((o) => !C.outs[o.r.no]);
  const show = C.all ? outs : outs.filter((o) => !C.outs[o.r.no] || C.open === o.r.no);
  const upd = (C.stock || {}).updated || '';
  const tbl = its.length ? `<table class="cn-t"><thead><tr><th>품목</th><th>실사</th><th>나감</th><th>남음</th></tr></thead><tbody>
    ${its.map((it) => { const o = u[it.item] || 0, left = it.qty - o; return `<tr class="${left < 0 ? 'neg' : ''}"><td>${esc(it.item)}${it.check ? ' <i>확인</i>' : ''}</td><td>${num(it.qty)}</td><td>${o ? '−' + num(o) : ''}</td><td><b>${num(left)}</b></td></tr>`; }).join('')}
    </tbody></table>` : `<div class="cn-empty">${C.loading ? '불러오는 중…' : '실사 재고 없음'}</div>`;
  return `${CSS}<section class="cn">
    <div class="cn-h"><h1 class="hm-h1">천안 재고</h1>${upd ? `<span class="cn-tag">실사 ${esc(upd.slice(5).replace('-', '/'))}</span>` : ''}<span class="sp"></span>
      <button type="button" class="fm-btn ghost" data-cn="reload">새로고침</button></div>
    ${C.err ? `<div class="cn-err">${esc(C.err)}</div>` : ''}
    ${tbl}
    <div class="cn-h"><h2>천안에서 나갈 것</h2><span class="cn-tag ${wait.length ? 'red' : ''}">안 뺀 것 ${wait.length}</span><span class="sp"></span>
      <button type="button" class="fm-btn ghost" data-cn="all">${C.all ? '안 뺀 것만' : `전체 ${outs.length}`}</button></div>
    <div class="cn-list">${show.length ? show.map(card).join('') : '<div class="cn-empty">없음</div>'}</div></section>`;
}

function card({ r, text }) {
  const o = C.outs[r.no], es = esOf(r), on = C.open === r.no;
  const esTag = es.map((x) => { const n = (x.items || []).length, k = (x.checks || []).length; return `<a class="cn-es ${x.signed_at ? 'ok' : k ? 'mid' : ''}" href="/s/${esc(x.code || '')}?p=1" target="_blank" rel="noopener">송장 ${x.signed_at ? '서명' : `체크 ${k}/${n}`}</a>`; }).join('');
  const st = o ? (o.skip ? '<span class="cn-st">재고 아님</span>' : `<span class="cn-st ok">빠짐 · ${(o.lines || []).map((l) => `${esc(l.item)} ${num(l.qty)}`).join(' · ')}</span>`) : '<span class="cn-st no">안 뺌</span>';
  const dayS = r.md ? `${String(r.md).padStart(4, '0').slice(0, 2)}/${String(r.md).padStart(4, '0').slice(2)}` : r.day;
  return `<div class="cn-c ${o ? 'done' : ''}">
    <div class="cn-r1"><b class="cn-d">${esc(dayS)}</b><b>${esc(r.partner || '')}</b><span class="cn-site">${esc(r.site || '')}</span><span class="sp"></span>${esTag}${st}
      ${on ? '' : `<button type="button" class="fm-btn ${o ? 'ghost' : ''}" data-cn="open" data-no="${esc(r.no)}">${o ? '고치기' : '빼기'}</button>`}</div>
    <div class="cn-tx">${esc(text)}</div>
    ${on ? editor(r) : ''}</div>`;
}

function editor(r) {
  const d = C.draft || [], its = items();
  const opts = (v) => `<option value="">품목</option>${its.map((it) => `<option ${it.item === v ? 'selected' : ''}>${esc(it.item)}</option>`).join('')}`;
  return `<div class="cn-ed">
    ${d.map((l, i) => `<div class="cn-l"><select data-cn-l="${i}" data-f="item">${opts(l.item)}</select><input data-cn-l="${i}" data-f="qty" inputmode="decimal" value="${esc(l.qty)}" placeholder="수량"><button type="button" class="fm-x" data-cn="ldel" data-i="${i}" aria-label="줄 지우기">✕</button></div>`).join('')}
    <div class="fm-row"><button type="button" class="fm-btn ghost" data-cn="ladd">줄 추가</button><button type="button" class="fm-btn ghost" data-cn="skip" data-no="${esc(r.no)}">재고 아님</button><span class="sp"></span>
      <button type="button" class="fm-btn ghost" data-cn="close">닫기</button><button type="button" class="fm-btn" data-cn="save" data-no="${esc(r.no)}" ${C.busy ? 'disabled' : ''}>빼기</button></div></div>`;
}

function openEd(no) {
  const x = outRows().find((o) => o.r.no === no); if (!x) return;
  const o = C.outs[no];
  let d = o && !o.skip ? o.lines.map((l) => ({ ...l })) : guess(x.text);
  if (!d.length) {   // 글에서 못 찾으면 전자 송장 체크한 품목으로
    const es = esOf(x.r)[0];
    if (es) d = guess((es.items || []).filter((_, i) => !(es.checks || []).length || (es.checks || []).includes(i)).map((it) => `${it.name} ${it.qty}`).join(' / '));
  }
  C.open = no; C.draft = d.length ? d : [{ item: '', qty: '' }];
}

async function save(no, skip) {
  const x = outRows().find((o) => o.r.no === no); if (!x || C.busy) return;
  const lines = skip ? [] : (C.draft || []).map((l) => ({ item: l.item, qty: Number(String(l.qty).replace(/[^\d.]/g, '')) || 0 })).filter((l) => l.item && l.qty > 0);
  if (!skip && !lines.length) { alert('품목·수량을 넣어 주세요'); return; }
  const body = { no, md: x.r.md, partner: x.r.partner, lines, skip: !!skip, by: ctx.me(), at: new Date().toISOString() };
  C.busy = true; ctx.rerender();
  const e = await S.saveCnOut(no, x.r.partner || '', body, ctx.me());
  C.busy = false;
  if (e) { alert('저장 못 했어요 — ' + e); ctx.rerender(); return; }
  C.outs[no] = body; C.open = ''; C.draft = null; ctx.rerender();
}

export function bind(app, c) {
  ctx = c;
  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-cn]'); if (!t || !app.querySelector('.cn')) return;
    const a = t.dataset.cn;
    if (a === 'reload') load(true);
    else if (a === 'all') { C.all = !C.all; ctx.rerender(); }
    else if (a === 'open') { openEd(t.dataset.no); ctx.rerender(); }
    else if (a === 'close') { C.open = ''; C.draft = null; ctx.rerender(); }
    else if (a === 'ladd') { C.draft.push({ item: '', qty: '' }); ctx.rerender(); }
    else if (a === 'ldel') { C.draft.splice(+t.dataset.i, 1); if (!C.draft.length) C.draft.push({ item: '', qty: '' }); ctx.rerender(); }
    else if (a === 'save') save(t.dataset.no, false);
    else if (a === 'skip') save(t.dataset.no, true);
  });
  const upd = (e) => { const el = e.target; if (el.dataset.cnL === undefined || !C.draft) return; C.draft[+el.dataset.cnL][el.dataset.f] = el.value; };
  app.addEventListener('input', upd);
  app.addEventListener('change', upd);
}

// ── 톡으로 빼기 (10/31 대표 "톡 형태로 '실리콘 베이지색 비드앤비 나감' 적어도 알아서") — town 맨 아래 채팅창
//   실리콘 = 사이트 재고 장부(출고 기록) · 구조재 = 천안 실사에서 빼기(cnout). 쓰기 전에 꼭 [빼기] 확인
const nk = (s) => String(s || '').replace(/주식회사|\(주\)|\s/g, '').replace(/엔/g, '앤');
export async function talk(text) {
  const t = String(text || '').trim(); if (!t) return null;
  if (/들어|입고|들어옴|들어왔/.test(t)) return { reply: '입고는 아직 못 받아요 — 나간 것만 적어 주세요' };
  await S.init();
  const sils = S.getItems().filter((it) => (it.category === '실리콘' || /실리콘/.test(it.name)) && isCn(it.warehouse || '천안'));
  const sil = /실리콘|박스/.test(t) || sils.some((it) => t.includes(it.name)) ? sils.filter((it) => t.includes(it.name) || t.includes(String(it.name).replace(/색$/, ''))).sort((a, b) => b.name.length - a.name.length)[0] : null;
  const qm = /(\d+(?:\.\d+)?)\s*(박스|box|개|ea|PLT|파레트)?/i.exec(t.replace(/\d+\*\d+\*\d+/g, ' '));
  let rest = t.replace(/\d+\*\d+\*\d+/g, ' ').replace(qm ? qm[0] : /$^/, ' ').replace(/실리콘|구조재|구조목|박스|나감|나갔어?요?|나갔음|출고|보냄|보냈어?요?|빼줘|빼|천안창고|천안|오늘|에서/g, ' ');
  if (sil) rest = rest.replace(sil.name, ' ').replace(String(sil.name).replace(/색$/, ''), ' ').replace(/색/g, ' ');
  const pt = S.getPartners().map((p) => p.name).filter(Boolean).filter((n) => nk(n).length >= 2 && nk(rest).includes(nk(n).slice(0, Math.max(2, nk(n).length - 1)))).sort((a, b) => b.length - a.length)[0];   // 품목 말을 뺀 나머지에서 거래처 찾기
  const client = pt || (rest.split(/[\s,.]+/).filter((w) => w.length >= 2 && /[가-힣A-Za-z]/.test(w))[0] || '');
  if (sil) {
    const qty = qm ? +qm[1] : 1, today = S.todayStr();
    const dup = S.getShipments().find((s) => s.date === today && s.status !== '취소' && nk(s.client).includes(nk(client).slice(0, 3)) && (s.lines && s.lines.length ? s.lines : [s]).some((l) => l.name === sil.name));
    return { kind: 'sil', item: sil, qty, client, text: t, dup: !!dup, reply: `실리콘 ${sil.name} ${qty}박스${client ? ` · ${client}` : ''} — 천안에서 뺄까요?${dup ? ' (오늘 같은 거래처·색이 이미 있어요)' : ''}` };
  }
  if (!C.stock) await fetchSummary();
  const g = guess(t);
  if (g.length) return { kind: 'cn', lines: g, client, text: t, reply: `${g.map((l) => `${l.item} ${num(l.qty)}`).join(' · ')}${client ? ` · ${client}` : ''} — 천안 실사에서 뺄까요?` };
  return { reply: '품목을 못 찾았어요 — 예) 실리콘 베이지 2박스 비드앤비 나감 · 2*6*12 160 공간 나감' };
}
export async function apply(a, me) {
  if (a.kind === 'sil') {
    S.addShipment({ date: S.todayStr(), warehouse: a.item.warehouse || '천안창고', client: a.client, status: '출고완료', note: `톡 ${a.text}`, lines: [{ name: a.item.name, category: '실리콘', unit: '박스', qty: a.qty }] });
    const it = S.getItems().find((x) => x.id === a.item.id);
    return `뺐어요 · ${a.item.name} 남음 ${num(it ? S.currentStock(it) : 0)}박스`;
  }
  const no = `talk-${Date.now().toString(36)}`, d = new Date();
  const body = { no, md: (d.getMonth() + 1) * 100 + d.getDate(), partner: a.client, lines: a.lines, skip: false, by: me, at: d.toISOString(), talk: a.text };
  const e = await S.saveCnOut(no, a.client || '톡', body, me);
  if (e) return `못 뺐어요 — ${e}`;
  C.outs[no] = body;
  const sm = summary();
  return `뺐어요 · ${a.lines.map((l) => { const x = sm.items.find((y) => y.item === l.item); return `${l.item} 남음 ${num(x ? x.left : 0)}`; }).join(' · ')}`;
}
