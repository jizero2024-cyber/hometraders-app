// 전자 송장 (2026-10-26 대표 "모바일용 전자 송장 — 품목 체크 + 모두의싸인처럼 서명")
//   /songjang/?k=<id> — 받는 분이 로그인 없이 링크로 엶. 표는 직접 못 읽고 songjang_get · songjang_sign 함수로만 (supabase/2026-10-26-e-songjang.sql)
//   모양은 납품 송장(songjang.py)처럼: 왼쪽 위 '납품 송장', 오른쪽 위 로고, 아래 품목 — 단가·금액 없음
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const app = document.getElementById('app');
const key = new URLSearchParams(location.search).get('k') || '';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (n) => { const v = Number(n) || 0; return Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 2 }); };
const day = (ymd) => (ymd && ymd.length >= 8 ? `${ymd.slice(0, 4)}년 ${Number(ymd.slice(4, 6))}월 ${Number(ymd.slice(6, 8))}일` : '');
const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const S = { doc: null, checks: new Set(), name: '', drawn: false, busy: false, msg: '' };
let pad = null;

function head() {
  return `<div class="sj-head"><img src="/icons/logo-full.png" alt="HOME TRADERS"><h1>납품 송장</h1></div><div class="sj-bar"></div>`;
}
function info(d) {
  return `<div class="sj-meta">${d.site ? `<span>현장</span><b>${esc(d.site)}</b>` : ''}<span>납품일자</span><b>${esc(day(d.ymd))}</b></div>`;
}
function items(d, locked) {
  const n = d.items.length, k = S.checks.size;
  const row = (it, i) => `<button type="button" class="sj-it ${S.checks.has(i) ? 'on' : ''}" data-i="${i}" ${locked ? 'disabled' : ''} aria-pressed="${S.checks.has(i)}">
      <span class="sj-ck">${CHECK}</span>
      <span class="sj-nm"><small>${i + 1}</small>${esc(it.name)}</span>
      <span class="sj-q">${num(it.qty)}<small>${esc(it.unit || '개')}</small></span></button>`;
  return `<section class="sj-card">
    <div class="sj-lh"><b>품목 ${n}개</b><span class="cnt">${k}/${n} 확인</span><span class="sp"></span>${locked || k === n ? '' : '<button type="button" class="sj-all" data-act="all">모두 확인</button>'}</div>
    <div class="sj-items">${d.items.map(row).join('')}</div></section>`;
}
function signBox(d) {
  if (d.signed_at) {
    const t = new Date(d.signed_at);
    return `<section class="sj-card sj-done"><span class="ok">✓ 서명 완료</span>
      ${d.sign ? `<img src="${d.sign}" alt="서명">` : ''}
      <span class="who">${esc(d.signer || '')} · ${t.getMonth() + 1}월 ${t.getDate()}일 ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}</span></section>`;
  }
  const ready = S.checks.size === d.items.length && S.name.trim() && S.drawn && !S.busy;
  return `<section class="sj-card sj-sign"><h2>받는 분 서명</h2>
    <input class="sj-name" data-act="name" placeholder="성함" autocomplete="name" value="${esc(S.name)}">
    <div class="sj-pad"><canvas id="sj-canvas"></canvas>${S.drawn ? '' : '<span class="ph">여기에 서명</span>'}</div>
    <div class="sj-row"><button type="button" class="sj-clear" data-act="clear">다시 쓰기</button>
      <button type="button" class="sj-go" data-act="sign" ${ready ? '' : 'disabled'}>${S.busy ? '보내는 중…' : S.checks.size < d.items.length ? `품목 ${d.items.length - S.checks.size}개 더 확인` : '서명하고 완료'}</button></div>
    <div class="sj-msg">${esc(S.msg)}</div></section>`;
}
function render() {
  const d = S.doc;
  if (!d) return;
  const keep = pad && pad.snapshot();
  app.innerHTML = `<section class="sj-card">${head()}${info(d)}</section>${items(d, !!d.signed_at)}${signBox(d)}`;
  if (!d.signed_at) { pad = makePad(document.getElementById('sj-canvas')); if (keep) pad.restore(keep); }
}
// 서명 칸만 다시 그리지 않고 버튼 상태만 바꿈 (그리는 중에 화면 전체를 다시 그리면 획이 끊김)
function refreshButton() {
  const d = S.doc, b = app.querySelector('[data-act="sign"]'); if (!b || !d) return;
  const ready = S.checks.size === d.items.length && S.name.trim() && S.drawn && !S.busy;
  b.disabled = !ready;
  b.textContent = S.busy ? '보내는 중…' : S.checks.size < d.items.length ? `품목 ${d.items.length - S.checks.size}개 더 확인` : '서명하고 완료';
  const ph = app.querySelector('.sj-pad .ph'); if (ph && S.drawn) ph.remove();
}

function makePad(cv) {
  const ctx = cv.getContext('2d');
  const fit = () => { const r = cv.getBoundingClientRect(), k = window.devicePixelRatio || 1; cv.width = Math.round(r.width * k); cv.height = Math.round(r.height * k); ctx.setTransform(k, 0, 0, k, 0, 0); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#111'; };
  fit();
  let down = false, last = null;
  const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); down = true; last = pt(e); ctx.beginPath(); ctx.arc(last.x, last.y, 1.4, 0, Math.PI * 2); ctx.fillStyle = '#111'; ctx.fill(); });
  cv.addEventListener('pointermove', (e) => {
    if (!down) return; e.preventDefault();
    const p = pt(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p;
    if (!S.drawn) { S.drawn = true; refreshButton(); }
  });
  const up = () => { down = false; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  return {
    clear() { ctx.clearRect(0, 0, cv.width, cv.height); },
    snapshot() { return S.drawn ? cv.toDataURL('image/png') : null; },
    restore(src) { const im = new Image(); im.onload = () => { const r = cv.getBoundingClientRect(); ctx.drawImage(im, 0, 0, r.width, r.height); }; im.src = src; },
    image() {   // 흰 바탕 PNG (작게)
      const r = cv.getBoundingClientRect(), o = document.createElement('canvas'); o.width = Math.round(r.width * 1.5); o.height = Math.round(r.height * 1.5);
      const g = o.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, o.width, o.height); g.drawImage(cv, 0, 0, o.width, o.height); return o.toDataURL('image/png');
    },
  };
}

app.addEventListener('click', async (e) => {
  const it = e.target.closest('.sj-it');
  if (it && !it.disabled) { const i = Number(it.dataset.i); if (S.checks.has(i)) S.checks.delete(i); else S.checks.add(i); render(); return; }
  const a = (e.target.closest('[data-act]') || {}).dataset?.act;
  if (a === 'all') { S.doc.items.forEach((_, i) => S.checks.add(i)); render(); }
  else if (a === 'clear') { if (pad) pad.clear(); S.drawn = false; render(); }
  else if (a === 'sign') {
    if (S.busy) return;
    S.busy = true; S.msg = ''; refreshButton();
    const { data, error } = await sb.rpc('songjang_sign', { k: key, c: [...S.checks].sort((x, y) => x - y), s: pad.image(), who: S.name.trim() });
    S.busy = false;
    if (error || data === 'bad') { S.msg = '보내지 못했어요. 다시 눌러 주세요.'; refreshButton(); app.querySelector('.sj-msg').textContent = S.msg; return; }
    await load();   // 서명된 장으로 다시 그림 ('already' 면 먼저 서명된 것)
  }
});
app.addEventListener('input', (e) => { if (e.target.dataset.act === 'name') { S.name = e.target.value.slice(0, 40); refreshButton(); } });

async function load() {
  if (key.length < 20) { app.innerHTML = '<div class="sj-empty">송장 링크가 올바르지 않아요</div>'; return; }
  const { data, error } = await sb.rpc('songjang_get', { k: key });
  if (error || !data) { app.innerHTML = `<div class="sj-empty">${error ? '불러오지 못했어요' : '송장을 찾을 수 없어요'}</div>`; return; }
  S.doc = { ...data, items: data.items || [] };
  if (data.signed_at) S.checks = new Set(data.checks || []);
  pad = null;
  render();
}
load();
