// 단가표 (11/03 대표 "품목마다 어떤 거래처엔 얼마에 팔고 구매가가 얼마고 엑셀처럼 · 필터 · 거래처별 · 날짜도 · 별도가인지 포함가인지 · 구조재는 자당")
// 맥 도우미 price_table.py 가 이카운트 판매·구매현황 전부에서 (품목, 판매|구매, 거래처)마다 마지막 단가를 site_inbox 'price:table' 에 올림
import { inboxBody } from './dbread.js?v=1';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = (n) => (n == null ? '' : Math.round(n).toLocaleString());
const P = { data: null, err: '', q: '', k: '', c: '', p: '', by: 'item', sort: '', dir: 1, lim: 600 };
let ctx = null;

const jaOf = (n, pr) => { const m = String(n).match(/구조재.*?\d+\s*\*\s*\d+\s*\*\s*(\d+)/); return m && +m[1] ? Math.round((pr * 1.1) / +m[1]) : null; };
const md = (d) => (d ? d.slice(2).replace(/-/g, '.') : '');

function rows() {
  const all = (P.data && P.data.rows) || [];
  const ws = P.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let rs = all.filter((r) => (!P.k || r.k === P.k) && (!P.c || r.c === P.c) && (!P.p || r.p === P.p)
    && (!ws.length || ws.every((w) => `${r.n} ${r.p}`.toLowerCase().includes(w))));
  const key = { n: (r) => r.n, p: (r) => r.p, pr: (r) => r.pr, d: (r) => r.d, cnt: (r) => r.cnt, k: (r) => r.k };
  if (P.sort) rs = rs.slice().sort((a, b) => { const x = key[P.sort](a), y = key[P.sort](b); return (x > y ? 1 : x < y ? -1 : 0) * P.dir; });
  else if (P.by === 'partner') rs = rs.slice().sort((a, b) => a.p.localeCompare(b.p) || a.n.localeCompare(b.n));
  else rs = rs.slice().sort((a, b) => a.c.localeCompare(b.c) || a.n.localeCompare(b.n) || (a.k === b.k ? 0 : a.k === 'b' ? -1 : 1) || b.d.localeCompare(a.d));
  return rs;
}

function bodyHtml() {
  const rs = rows(), grpKey = P.sort ? null : P.by === 'partner' ? 'p' : 'n';
  let last = null;
  const tr = rs.slice(0, P.lim).map((r) => {
    const g = grpKey ? r[grpKey] : null, first = g !== last; last = g;
    const ja = jaOf(r.n, r.pr), pja = r.pp ? jaOf(r.n, r.pp) : null;
    const up = r.pp ? (r.pr > r.pp ? 'up' : 'dn') : '';
    return `<tr class="${first && grpKey ? 'pr-g' : ''}">
      <td class="pr-n">${grpKey === 'n' && !first ? '' : esc(r.n)}</td>
      <td><span class="pr-k ${r.k}">${r.k === 's' ? '판매' : '구매'}</span></td>
      <td class="pr-p">${grpKey === 'p' && !first ? '' : esc(r.p)}</td>
      <td class="pr-num"><b>${won(r.pr)}</b>${ja ? `<i>자당 ${won(ja)} 포함</i>` : ''}</td>
      <td class="pr-d">${md(r.d)}</td>
      <td class="pr-num pr-pv ${up}">${r.pp ? `${won(r.pp)}${pja ? `<i>자당 ${won(pja)}</i>` : ''}<em>${md(r.pd)}</em>` : ''}</td>
      <td class="pr-num">${r.cnt}</td>
      <td class="pr-s">${esc(r.s.replace(/^\d{4}(\d\d)(\d\d)-/, '$1/$2-'))}</td></tr>`;
  }).join('');
  return { html: tr || '<tr><td colspan="8" class="pr-none">없음</td></tr>', n: rs.length };
}

export function screen() {
  if (!P.data && !P.err) { inboxBody('price:table').then((d) => { P.data = d || { rows: [] }; ctx && ctx.rerender(); }).catch((e) => { P.err = String(e); ctx && ctx.rerender(); }); }
  if (!P.data) return `<section class="pr"><h1 class="fl-h1">단가표</h1><div class="pr-none">${P.err ? esc(P.err) : '불러오는 중…'}</div></section>`;
  const all = P.data.rows || [];
  const cats = [...new Set(all.map((r) => r.c))].sort();
  const parts = [...new Set(all.filter((r) => !P.k || r.k === P.k).map((r) => r.p))].sort();
  const b = bodyHtml();
  const th = (k, lab) => `<th data-pr="sort" data-k="${k}" class="${P.sort === k ? 'on' : ''}">${lab}${P.sort === k ? (P.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`;
  return `<section class="pr"><div class="pr-hd"><h1 class="fl-h1">단가표</h1><span class="pr-at">이카운트 ${esc(md((P.data.at || '').slice(0, 10)))} ${esc((P.data.at || '').slice(11, 16))}</span></div>
    <div class="pr-bar">
      <input id="pr-q" type="search" placeholder="품목·거래처" value="${esc(P.q)}" autocomplete="off">
      <select data-pr="k"><option value="">판매·구매</option><option value="s" ${P.k === 's' ? 'selected' : ''}>판매</option><option value="b" ${P.k === 'b' ? 'selected' : ''}>구매</option></select>
      <select data-pr="c"><option value="">분류 전체</option>${cats.map((c) => `<option ${P.c === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
      <input id="pr-p" list="pr-pl" placeholder="거래처 전체" value="${esc(P.p)}" autocomplete="off"><datalist id="pr-pl">${parts.map((p) => `<option value="${esc(p)}">`).join('')}</datalist>
      <span class="pr-seg"><button type="button" data-pr="by" data-v="item" class="${P.by === 'item' ? 'on' : ''}">품목별</button><button type="button" data-pr="by" data-v="partner" class="${P.by === 'partner' ? 'on' : ''}">거래처별</button></span>
      <span class="pr-cnt" id="pr-cnt">${b.n.toLocaleString()}건</span>
    </div>
    <div class="pr-tw"><table class="pr-t"><thead><tr>${th('n', '품목')}${th('k', '구분')}${th('p', '거래처')}${th('pr', '단가 <i>부가세 별도</i>')}${th('d', '날짜')}<th>직전 단가</th>${th('cnt', '횟수')}<th>전표</th></tr></thead>
    <tbody id="pr-body">${b.html}</tbody></table></div>
    ${b.n > P.lim ? `<button type="button" class="pr-more" data-pr="more">더 보기 (${(b.n - P.lim).toLocaleString()})</button>` : ''}</section>`;
}

function refreshBody() {   // 글자 칠 때는 표만 다시 (한글 입력 안 끊기게)
  const b = bodyHtml(), t = document.getElementById('pr-body'), c = document.getElementById('pr-cnt');
  if (t) t.innerHTML = b.html;
  if (c) c.textContent = `${b.n.toLocaleString()}건`;
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
    else if (a === 'sort') { const k = t.dataset.k; if (P.sort === k) { if (P.dir > 0) P.dir = -1; else { P.sort = ''; P.dir = 1; } } else { P.sort = k; P.dir = k === 'd' || k === 'cnt' || k === 'pr' ? -1 : 1; } ctx.rerender(); }
    else if (a === 'more') { P.lim += 1000; ctx.rerender(); }
  });
}
