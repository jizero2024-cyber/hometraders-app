// 단가표 (11/03 대표 "품목마다 어떤 거래처엔 얼마에 팔고 구매가가 얼마고 엑셀처럼 · 필터 · 거래처별 · 날짜도 · 별도가인지 포함가인지 · 구조재는 자당")
// 맥 도우미 price_table.py 가 이카운트 판매·구매현황 전부에서 (품목, 판매|구매, 거래처)마다 마지막 단가를 site_inbox 'price:table' 에 올림
import { inboxBody } from './dbread.js?v=1';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = (n) => (n == null ? '' : Math.round(n).toLocaleString());
const P = { tab: 'table', flow: null, data: null, err: '', q: '', k: '', c: '', p: '', by: 'item', sort: '', dir: 1, lim: 600 };
let ctx = null;

const jaOf = (n, pr) => { const m = String(n).match(/구조재.*?\d+\s*\*\s*\d+\s*\*\s*(\d+)/); return m && +m[1] ? Math.round((pr * 1.1) / +m[1]) : null; };
const md = (d) => (d ? d.slice(2).replace(/-/g, '.') : '');

function rows() {   // 판가만 (11/03 대표 "판가만 나오게, 상단 셀에 거래처명들 좌르륵")
  const all = ((P.data && P.data.rows) || []).filter((r) => r.k === 's');
  const ws = P.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return all.filter((r) => (!P.c || r.c === P.c) && (!ws.length || ws.every((w) => `${r.n} ${r.p}`.toLowerCase().includes(w))));
}

function bodyHtml() {
  const rs = rows();
  const cnt = {};
  rs.forEach((r) => { cnt[r.p] = (cnt[r.p] || 0) + r.cnt; });
  let cols = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || a.localeCompare(b));
  if (P.p) cols = cols.filter((c) => c === P.p);
  const by = new Map();
  rs.forEach((r) => { if (!cols.includes(r.p)) return; if (!by.has(r.n)) by.set(r.n, { n: r.n, c: r.c, m: {} }); by.get(r.n).m[r.p] = r; });
  let items = [...by.values()];
  if (P.sort) items.sort((a, b) => ((b.m[P.sort] || {}).d || '').localeCompare((a.m[P.sort] || {}).d || '') || a.n.localeCompare(b.n));
  else items.sort((a, b) => a.c.localeCompare(b.c) || a.n.localeCompare(b.n));
  const head = `<tr><th class="pr-n">품목 <i>판가 · 부가세 별도 (구조재는 자당 · 포함)</i></th>${cols.map((c) => `<th data-pr="sort" data-k="${esc(c)}" class="pr-pc ${P.sort === c ? 'on' : ''}">${esc(c.replace(/\(주\)|주식회사|㈜/g, '').trim())}</th>`).join('')}</tr>`;
  const cell = (n, r) => { if (!r) return '<td></td>'; const ja = jaOf(n, r.pr); const up = r.pp ? (r.pr > r.pp ? 'up' : 'dn') : ''; return `<td class="pr-num pr-cl" data-pr="hist" data-n="${esc(n)}" data-p="${esc(r.p)}" title="${esc(r.p)} · ${esc(r.s)}${r.pp ? ` · 직전 ${won(r.pp)} (${md(r.pd)})` : ''}">${ja ? `<b class="${up}">자당 ${won(ja)}</b><i>전표 ${won(r.pr)} 별도</i>` : `<b class="${up}">${won(r.pr)}</b>`}<em>${md(r.d)}</em></td>`; };   // 구조재는 자당(부가세 포함)이 크게, 전표 단가는 작게 (11/03 대표)
  let lastC = null;
  const body = items.slice(0, P.lim).map((it) => { const g = !P.sort && it.c !== lastC; lastC = it.c; return `${g ? `<tr class="pr-cat"><td colspan="${cols.length + 1}">${esc(it.c)}</td></tr>` : ''}<tr><td class="pr-n">${esc(it.n)}</td>${cols.map((c) => cell(it.n, it.m[c])).join('')}</tr>`; }).join('');
  return { head, html: body || `<tr><td colspan="${cols.length + 1}" class="pr-none">없음</td></tr>`, n: items.length };
}

export const tab = () => P.tab;

// 단가 확인 요청 (11/03 대표) — 출고 건 품목 중 판가가 안 들어간 것 · 그 거래처 마지막 판가 / 같은 품목 다른 거래처 판가 / 구매가
const toks = (s) => (String(s).match(/[가-힣A-Za-z]{2,}|\d+\*\d+(?:\*\d+)?|\d{3,}/g) || []).filter((w) => !/^(EA|ea|PLT|개|장|봉|줄)$/.test(w));
const normP = (p) => String(p || '').replace(/\(주\)|주식회사|㈜|\s/g, '');
function askHtml() {
  if (!P.flow) { inboxBody('flow:board', true).then((d) => { P.flow = d || { rows: [] }; ctx && ctx.rerender(); }).catch(() => { P.flow = { rows: [] }; ctx && ctx.rerender(); }); return '<div class="pr-none">불러오는 중…</div>'; }
  const sale = ((P.data && P.data.rows) || []).filter((r) => r.k === 's');
  const out = [];
  for (const r of P.flow.rows || []) {
    if (!(r.steps || []).some((k) => ['입력 누락', '입력 완료', '배차 완료', '출고 완료', '배차 요청', '발주'].includes(k))) continue;
    if ((r.lines || []).some((l) => l.k === '판매' && l.st === '입력') && !(r.chips || []).some((c) => /판매 빠짐/.test(c))) continue;   // 판매전표 들어간 건은 빼고 — 판가 몰라 못 넣은 것만 (11/03)
    for (const x of r.itab || []) {
      if (x.sale) continue;
      const ws = toks(x.it); if (!ws.length) continue;
      const hit = sale.filter((y) => ws.every((w) => y.n.includes(w)));
      let mine = hit.filter((y) => normP(y.p).slice(0, 4) === normP(r.partner).slice(0, 4)).sort((a, b) => b.d.localeCompare(a.d))[0];
      if (!mine) {   // 색 번호(3951)만 다른 같은 계열 — 그 거래처에 판 같은 종류 (아이큐브 V16 가격군, 11/03)
        const ws2 = ws.filter((w) => !/^\d{3,}$/.test(w));
        if (ws2.length && ws2.length < ws.length) mine = sale.filter((y) => normP(y.p).slice(0, 4) === normP(r.partner).slice(0, 4) && ws2.every((w) => y.n.includes(w))).sort((a, b) => b.d.localeCompare(a.d))[0];
        if (mine) mine = { ...mine, fam: 1 };
      }
      const other = hit.filter((y) => y !== mine).sort((a, b) => b.d.localeCompare(a.d)).slice(0, 2);
      out.push({ r, x, mine, other });
    }
  }
  const q = P.q.trim().toLowerCase();
  const rs = out.filter((o) => !q || `${o.r.partner} ${o.r.site} ${o.x.it}`.toLowerCase().includes(q)).sort((a, b) => (b.r.md ?? 0) - (a.r.md ?? 0) || String(a.r.no).localeCompare(String(b.r.no)));
  const pv = (y) => (y ? `${jaOf(y.n, y.pr) ? `자당 ${won(jaOf(y.n, y.pr))}` : won(y.pr)}<em>${y.fam ? '같은 계열 · ' : ''}${esc(y.p.replace(/\(주\)|주식회사|㈜/g, '').trim())} · ${md(y.d)}</em>` : '');
  return `<div class="pr-bar"><input id="pr-q" type="search" placeholder="거래처·현장·품목" value="${esc(P.q)}" autocomplete="off"><span class="pr-cnt" id="pr-cnt">${rs.length}품목</span></div>
  <div class="pr-tw"><table class="pr-t"><thead><tr><th>출고일</th><th>판매처 · 현장</th><th>품목</th><th>수량</th><th class="pr-num">구매가 <i>별도</i></th><th class="pr-num">이 거래처 마지막 판가</th><th class="pr-num">다른 거래처 판가</th></tr></thead>
  <tbody>${rs.map((o) => `<tr><td class="pr-d">${esc(o.r.day || '')}</td><td>${esc(o.r.partner)} · ${esc(o.r.site || '')}</td><td class="pr-n">${esc(o.x.it)}</td><td>${esc(o.x.q || '')}</td>
    <td class="pr-num">${o.x.bp ? won(o.x.bp) : o.x.buy === '—' ? '재고' : ''}</td><td class="pr-num">${pv(o.mine) || '<b class="pr-need">확인 필요</b>'}</td><td class="pr-num">${o.other.map(pv).join('')}</td></tr>`).join('') || '<tr><td colspan="7" class="pr-none">없음</td></tr>'}</tbody></table></div>`;
}

export function screen() {
  if (P.tab === 'ask') { if (!P.data && !P.err) inboxBody('price:table').then((d) => { P.data = d || { rows: [] }; ctx && ctx.rerender(); }).catch(() => {}); return `<section class="pr"><h1 class="fl-h1">단가 확인 요청</h1>${askHtml()}</section>`; }
  if (!P.data && !P.err) { inboxBody('price:table').then((d) => { P.data = d || { rows: [] }; ctx && ctx.rerender(); }).catch((e) => { P.err = String(e); ctx && ctx.rerender(); }); }
  if (!P.data) return `<section class="pr"><h1 class="fl-h1">단가표</h1><div class="pr-none">${P.err ? esc(P.err) : '불러오는 중…'}</div></section>`;
  const sale = (P.data.rows || []).filter((r) => r.k === 's');
  const cats = [...new Set(sale.map((r) => r.c))].sort();
  const parts = [...new Set(sale.map((r) => r.p))].sort();
  const b = bodyHtml();
  return `<section class="pr"><div class="pr-hd"><h1 class="fl-h1">단가표</h1><span class="pr-at">판가 · 부가세 별도 · 이카운트 ${esc(md((P.data.at || '').slice(0, 10)))} ${esc((P.data.at || '').slice(11, 16))}</span></div>
    <div class="pr-bar">
      <input id="pr-q" type="search" placeholder="품목·거래처" value="${esc(P.q)}" autocomplete="off">
      <select data-pr="c"><option value="">분류 전체</option>${cats.map((c) => `<option ${P.c === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
      <input id="pr-p" list="pr-pl" placeholder="거래처 전체" value="${esc(P.p)}" autocomplete="off"><datalist id="pr-pl">${parts.map((p) => `<option value="${esc(p)}">`).join('')}</datalist>
      <span class="pr-cnt" id="pr-cnt">${b.n.toLocaleString()}품목</span>
    </div>
    <div class="pr-tw"><table class="pr-t pr-pv2"><thead id="pr-head">${b.head}</thead><tbody id="pr-body">${b.html}</tbody></table></div>
    ${b.n > P.lim ? `<button type="button" class="pr-more" data-pr="more">더 보기 (${(b.n - P.lim).toLocaleString()})</button>` : ''}</section>`;
}

function refreshBody() {   // 글자 칠 때는 표만 다시 (한글 입력 안 끊기게)
  const b = bodyHtml(), t = document.getElementById('pr-body'), h = document.getElementById('pr-head'), c = document.getElementById('pr-cnt');
  if (t) t.innerHTML = b.html;
  if (h) h.innerHTML = b.head;
  if (c) c.textContent = `${b.n.toLocaleString()}품목`;
}

export function bind(app, c) {
  ctx = c;
  app.addEventListener('input', (e) => {
    if (e.target.id === 'pr-q') { P.q = e.target.value; P.lim = 600; if (P.tab === 'ask') { if (e.isComposing) return; const pos = e.target.selectionStart; ctx.rerender(); const i = document.getElementById('pr-q'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } } else refreshBody(); }
    else if (e.target.id === 'pr-p') { const v = e.target.value.trim(); const all = (P.data && P.data.rows) || []; if (!v || all.some((r) => r.p === v)) { P.p = v; P.lim = 600; refreshBody(); } }
  });
  app.addEventListener('compositionend', (e) => { if (e.target.id === 'pr-q' && P.tab === 'ask') e.target.dispatchEvent(new Event('input', { bubbles: true })); });
  app.addEventListener('change', (e) => {
    const t = e.target.closest('[data-pr]'); if (!t || t.tagName !== 'SELECT') return;
    P[t.dataset.pr] = t.value; P.lim = 600; ctx.rerender();
  });
  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-pr]'); if (!t || t.tagName === 'SELECT') return;
    const a = t.dataset.pr;
    if (a === 'tab') { P.tab = t.dataset.v; P.q = ''; if (P.tab === 'ask') P.flow = null; ctx.rerender(); }
    else if (a === 'by') { P.by = t.dataset.v; P.sort = ''; ctx.rerender(); }
    else if (a === 'sort') { const k = t.dataset.k; P.sort = P.sort === k ? '' : k; ctx.rerender(); }   // 거래처 칸 누르면 그 거래처에 판 품목이 위로
    else if (a === 'more') { P.lim += 1000; ctx.rerender(); }
    else if (a === 'hist') {   // 그 거래처·품목 날짜별 판가 (11/03 대표 "누르면 날짜별로 판가 좌르륵")
      const r = ((P.data && P.data.rows) || []).find((x) => x.k === 's' && x.n === t.dataset.n && x.p === t.dataset.p); if (!r) return;
      const ov = document.createElement('div'); ov.className = 'hm-ov';
      const h = r.h || [];
      ov.innerHTML = `<div class="hm-modal pr-hm" role="dialog" aria-label="날짜별 판가"><div class="hm-mh"><b>${esc(r.p)}</b><button type="button" class="hm-x" aria-label="닫기">✕</button></div>
        <div class="pr-hn">${esc(r.n)}</div><table class="pr-t"><thead><tr><th>날짜</th><th class="pr-num">${jaOf(r.n, r.pr) ? '자당 <i>포함</i>' : '판가 <i>별도</i>'}</th>${jaOf(r.n, r.pr) ? '<th class="pr-num">전표 단가 <i>별도</i></th>' : ''}<th class="pr-num">수량</th><th>전표</th></tr></thead>
        <tbody>${h.map(([d, pr, q, sl], i) => { const ja = jaOf(r.n, pr), nx = h[i + 1]; const up = nx && nx[1] !== pr ? (pr > nx[1] ? 'up' : 'dn') : ''; return `<tr><td class="pr-d">${esc(d.replace(/-/g, '.'))}</td><td class="pr-num"><b class="${up}">${ja ? won(ja) : won(pr)}</b></td>${ja ? `<td class="pr-num">${won(pr)}</td>` : ''}<td class="pr-num">${won(q)}</td><td class="pr-s">${esc(sl.replace(/^(\d\d)(\d\d)-/, '$1/$2-'))}</td></tr>`; }).join('')}</tbody></table></div>`;
      ov.addEventListener('click', (ev) => { if (ev.target === ov || ev.target.closest('.hm-x')) ov.remove(); });
      document.body.appendChild(ov);
    }
  });
}
