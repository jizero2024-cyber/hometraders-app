// 단가표 (11/03 대표 "품목마다 어떤 거래처엔 얼마에 팔고 구매가가 얼마고 엑셀처럼 · 필터 · 거래처별 · 날짜도 · 별도가인지 포함가인지 · 구조재는 자당")
// 맥 도우미 price_table.py 가 이카운트 판매·구매현황 전부에서 (품목, 판매|구매, 거래처)마다 마지막 단가를 site_inbox 'price:table' 에 올림
import { inboxBody } from './dbread.js?v=1';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = (n) => (n == null ? '' : Math.round(n).toLocaleString());
const P = { data: null, err: '', q: '', k: '', c: '', p: '', by: 'item', sort: '', dir: 1, lim: 600 };
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
  const cell = (n, r) => { if (!r) return '<td></td>'; const ja = jaOf(n, r.pr); const up = r.pp ? (r.pr > r.pp ? 'up' : 'dn') : ''; return `<td class="pr-num" title="${esc(r.p)} · ${esc(r.s)}${r.pp ? ` · 직전 ${won(r.pp)} (${md(r.pd)})` : ''}">${ja ? `<b class="${up}">자당 ${won(ja)}</b><i>전표 ${won(r.pr)} 별도</i>` : `<b class="${up}">${won(r.pr)}</b>`}<em>${md(r.d)}</em></td>`; };   // 구조재는 자당(부가세 포함)이 크게, 전표 단가는 작게 (11/03 대표)
  let lastC = null;
  const body = items.slice(0, P.lim).map((it) => { const g = !P.sort && it.c !== lastC; lastC = it.c; return `${g ? `<tr class="pr-cat"><td colspan="${cols.length + 1}">${esc(it.c)}</td></tr>` : ''}<tr><td class="pr-n">${esc(it.n)}</td>${cols.map((c) => cell(it.n, it.m[c])).join('')}</tr>`; }).join('');
  return { head, html: body || `<tr><td colspan="${cols.length + 1}" class="pr-none">없음</td></tr>`, n: items.length };
}

export function screen() {
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
    if (e.target.id === 'pr-q') { P.q = e.target.value; P.lim = 600; refreshBody(); }
    else if (e.target.id === 'pr-p') { const v = e.target.value.trim(); const all = (P.data && P.data.rows) || []; if (!v || all.some((r) => r.p === v)) { P.p = v; P.lim = 600; refreshBody(); } }
  });
  app.addEventListener('change', (e) => {
    const t = e.target.closest('[data-pr]'); if (!t || t.tagName !== 'SELECT') return;
    P[t.dataset.pr] = t.value; P.lim = 600; ctx.rerender();
  });
  app.addEventListener('click', (e) => {
    const t = e.target.closest('[data-pr]'); if (!t || t.tagName === 'SELECT') return;
    const a = t.dataset.pr;
    if (a === 'by') { P.by = t.dataset.v; P.sort = ''; ctx.rerender(); }
    else if (a === 'sort') { const k = t.dataset.k; P.sort = P.sort === k ? '' : k; ctx.rerender(); }   // 거래처 칸 누르면 그 거래처에 판 품목이 위로
    else if (a === 'more') { P.lim += 1000; ctx.rerender(); }
  });
}
