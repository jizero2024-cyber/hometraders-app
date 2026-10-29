// 짐짜기 도우미 (10/29 대표) — 품목 넣으면 무게·짐칸 크기로 차 추천 + 짐칸 배치 그림
// 무게는 대표가 준 표(적재가능 무게 계산), 짐칸 크기는 대략 값 — 맞지 않으면 TRUCKS 숫자만 고치면 됨
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const JA = 0.303;   // 1자 = 30.3cm

// 차종: 짐칸 길이·폭(m), 실을 수 있는 무게(톤)
export const TRUCKS = [
  { id: 't1', name: '1톤', L: 2.8, W: 1.6, cap: 1.0 },
  { id: 't14', name: '1.4톤', L: 3.1, W: 1.7, cap: 1.4 },
  { id: 't25', name: '2.5톤', L: 4.3, W: 2.0, cap: 2.5 },
  { id: 't35', name: '3.5톤', L: 4.6, W: 2.06, cap: 3.5 },
  { id: 't35w', name: '3.5톤 광폭', L: 5.1, W: 2.3, cap: 3.5 },
  { id: 't5', name: '5톤', L: 6.2, W: 2.35, cap: 5 },
  { id: 't5x', name: '5톤 축', L: 7.6, W: 2.35, cap: 8 },
  { id: 't11', name: '11톤', L: 9.1, W: 2.35, cap: 11 },
  { id: 't25t', name: '25톤 츄레라', L: 12.0, W: 2.4, cap: 25 },
];

// 구조재·방부목 — 12자 기준 개/PT, 개당 무게(kg)
const LUMBER = {
  '구조재': { '2*4': [240, 6.6], '2*6': [160, 10], '2*8': [120, 13.3], '2*10': [96, 16.6], '2*12': [80, 20] },
  '방부목': { '2*4': [240, 9], '2*6': [160, 13.7], '2*8': [120, 18.3], '2*10': [96, 22.9], '2*12': [80, 27.5] },
};
const COLORS = { '구조재': '#F2D29B', '방부목': '#C9DDA6', 'OSB': '#E6C38A', '세라믹사이딩': '#C9CEDB', '메탈사이딩': '#B7C6D9', '비닐사이딩': '#E3D9F0', '다루끼': '#F5DEB3', '실리콘': '#BFE3F5', '기타': '#E9E2D8' };

// 줄 하나 → 짐 덩어리(블록)들 {label, L, W, kg}
export function blocksOf(it) {
  const out = [], q = Math.max(0, +it.qty || 0); if (!q) return out;
  const k = it.kind;
  if (k === '구조재' || k === '방부목') {
    const [per, kg12] = (LUMBER[k][it.size] || LUMBER[k]['2*6']), ja = +it.ja || 12, perKg = kg12 * ja / 12;
    let left = q, n = 0;
    while (left > 0) { const c = Math.min(per, left); out.push({ label: `${k === '방부목' ? '방부 ' : ''}${it.size}*${ja}자`, sub: `${c}개`, L: ja * JA, W: it.size === '2*8' || it.size === '2*10' || it.size === '2*12' ? 1.2 : 1.1, kg: c * perKg, c: COLORS[k] }); left -= c; if (++n > 60) break; }
  } else if (k === 'OSB') {
    let left = q; while (left > 0) { const c = Math.min(70, left); out.push({ label: 'OSB 11mm', sub: `${c}장`, L: 2.44, W: 1.22, kg: c * 22, c: COLORS.OSB }); left -= c; }
  } else if (k === '세라믹사이딩') {
    let left = q; while (left > 0) { const c = Math.min(80, left); out.push({ label: '세라믹 판재', sub: `${c}장`, L: 3.03, W: 0.95, kg: c * 27, c: COLORS[k] }); left -= c; }
  } else if (k === '메탈사이딩') {
    let left = q; while (left > 0) { const c = Math.min(12, left); out.push({ label: '메탈사이딩', sub: `${c}박스`, L: 3.0, W: 0.8, kg: c * 35, c: COLORS[k] }); left -= c; }
  } else if (k === '비닐사이딩') {
    let left = q; while (left > 0) { const c = Math.min(12, left); out.push({ label: '비닐사이딩', sub: `${c}박스`, L: 3.7, W: 0.62, kg: c * 40, c: COLORS[k] }); left -= c; }
  } else if (k === '다루끼') {
    const ja = +it.ja || 12; let left = q; while (left > 0) { const c = Math.min(1560, left); out.push({ label: `다루끼 ${ja}자`, sub: `${c}장`, L: ja * JA, W: 1.1, kg: c * (1500 / 1560) * ja / 12, c: COLORS[k] }); left -= c; }
  } else if (k === '실리콘') {
    let left = q; while (left > 0) { const c = Math.min(48, left); out.push({ label: '실리콘', sub: `${c}박스`, L: 1.0, W: 1.0, kg: c * 10, c: COLORS[k] }); left -= c; }
  } else {
    for (let i = 0; i < Math.min(q, 40); i++) out.push({ label: it.name || '기타', sub: '', L: +it.L || 1, W: +it.W || 1, kg: +it.kg || 100, c: COLORS['기타'] });
  }
  return out;
}

// 짐칸에 놓기 — 긴 것부터, 폭 방향으로 줄(레인)을 나눠 앞에서 뒤로
export function pack(blocks, t) {
  const bs = blocks.map((b, i) => ({ ...b, i })).sort((a, b) => b.L - a.L || b.W - a.W), lanes = [], placed = [], over = [];
  let usedW = 0;
  bs.forEach((b) => {
    let L = b.L, W = b.W;
    if (L > t.L && W <= t.L && L <= t.W) { [L, W] = [W, L]; }
    let lane = lanes.filter((l) => l.w >= W - 1e-6 && l.used + L <= t.L + 1e-6).sort((a, z) => a.used - z.used)[0];
    if (!lane && usedW + W <= t.W + 1e-6 && L <= t.L + 1e-6) { lane = { x: usedW, w: W, used: 0 }; lanes.push(lane); usedW += W; }
    if (!lane) { over.push(b); return; }
    placed.push({ ...b, x: lane.x, y: lane.used, L, W }); lane.used += L;
  });
  return { placed, over, kg: blocks.reduce((a, b) => a + b.kg, 0) };
}
export function recommend(blocks) {
  const kg = blocks.reduce((a, b) => a + b.kg, 0);
  for (const t of TRUCKS) { if (kg / 1000 <= t.cap + 1e-6 && pack(blocks, t).over.length === 0) return t; }
  return TRUCKS[TRUCKS.length - 1];
}

// 카톡 붙여넣기 → 줄들
export function parse(text) {
  const items = [];
  String(text || '').split(/\n|,|·/).forEach((raw) => {
    const s = raw.trim(); if (!s) return;
    const num = (re) => { const m = s.match(re); return m ? +m[1] : 0; };
    const qty = num(/(\d+)\s*(개|장|본|ea|EA|박스|BOX|box|pt|PT|파레트|롤)/) || num(/(\d+)\s*$/);
    const lm = s.match(/(2)\s*[*x×]\s*(4|6|8|10|12)\s*[*x×]\s*(\d{1,2})/);
    if (lm) {
      const kind = /방부/.test(s) ? '방부목' : '구조재', size = `2*${lm[2]}`, ja = +lm[3];
      let q = qty; if (/pt|PT|파레트/.test(s)) q = qty * (LUMBER[kind][size] || [160])[0];
      items.push({ kind, size, ja, qty: q || (LUMBER[kind][size] || [160])[0] }); return;
    }
    if (/osb/i.test(s)) { let q = qty; if (/pt|PT|파레트/.test(s)) q *= 70; items.push({ kind: 'OSB', qty: q || 70 }); return; }
    if (/세라믹/.test(s)) { let q = qty; if (/pt|PT|파레트/.test(s)) q *= 80; items.push({ kind: '세라믹사이딩', qty: q || 80 }); return; }
    if (/메탈/.test(s)) { items.push({ kind: '메탈사이딩', qty: qty || 8 }); return; }
    if (/비닐/.test(s)) { items.push({ kind: '비닐사이딩', qty: qty || 10 }); return; }
    if (/다루끼/.test(s)) { const ja = num(/(\d{1,2})\s*자/) || 12; let q = qty; if (/pt|PT|파레트/.test(s)) q *= 1560; items.push({ kind: '다루끼', ja, qty: q || 1560 }); return; }
    if (/실리콘/.test(s)) { items.push({ kind: '실리콘', qty: qty || 10 }); return; }
  });
  return items;
}

// 화면
export function mount(root, opts = {}) {
  const st = { items: [{ kind: '구조재', size: '2*6', ja: 12, qty: 480 }, { kind: 'OSB', qty: 140 }, { kind: '세라믹사이딩', qty: 60 }, { kind: '실리콘', qty: 20 }], truck: '', placed: null };
  root.innerHTML = `
  <div style="position:absolute;inset:0;background:#F4F1EA;display:flex;gap:16px;padding:20px 24px">
    <div style="width:430px;flex:none;display:flex;flex-direction:column;gap:12px">
      <div class="card" style="padding:16px 18px;display:flex;align-items:center;gap:10px">${opts.back || ''}<div style="flex:1"><div style="font-size:22px;font-weight:800">짐짜기</div><div style="font-size:12px;color:#8A7E77">품목 → 차 추천 · 짐칸 배치</div></div></div>
      <div class="card" style="padding:14px 16px;display:flex;flex-direction:column;gap:8px">
        <textarea id="jpaste" rows="4" placeholder="카톡 붙여 넣기 · 예) 2*6*12 480개 / OSB 140장 / 세라믹 60장 / 실리콘 20박스" aria-label="카톡 붙여 넣기" style="resize:none;border:1.5px solid #EDE3D8;border-radius:14px;padding:10px 12px;font:inherit;font-size:13px;outline:none"></textarea>
        <button id="jread" type="button" class="btn or" style="height:42px;justify-content:center">읽어서 넣기</button>
      </div>
      <div class="card scroll" style="flex:1;min-height:0;padding:10px 12px"><div id="jrows" style="display:flex;flex-direction:column;gap:6px"></div>
        <button id="jadd" type="button" class="btn" style="height:38px;margin-top:8px;width:100%;justify-content:center;box-shadow:none;background:#F4EFEA">+ 품목 추가</button></div>
    </div>
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:12px">
      <div class="card" style="padding:12px 14px;display:flex;flex-wrap:wrap;gap:6px" id="jtrucks"></div>
      <div class="card" style="padding:14px 18px;display:flex;align-items:center;gap:18px" id="jsum"></div>
      <div class="card" style="flex:1;min-height:0;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center" id="jbedbox"><div id="jbed" style="position:relative"></div></div>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button id="jcopy" type="button" class="btn">배차 요청 글 복사</button><button id="jpng" type="button" class="btn or">짐짜기 그림 저장</button></div>
    </div>
  </div>`;
  const $ = (s) => root.querySelector(s);
  const KINDS = ['구조재', '방부목', 'OSB', '세라믹사이딩', '메탈사이딩', '비닐사이딩', '다루끼', '실리콘', '기타'];
  const UNIT = { '구조재': '개', '방부목': '개', 'OSB': '장', '세라믹사이딩': '장', '메탈사이딩': '박스', '비닐사이딩': '박스', '다루끼': '장', '실리콘': '박스', '기타': '개' };
  const sel = (opts2, v, a) => `<select data-f="${a}" style="height:36px;border:1.5px solid #EDE3D8;border-radius:10px;padding:0 6px;font:inherit;font-size:13px;background:#fff">${opts2.map((o) => `<option ${String(o) === String(v) ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  const inp = (v, a, w, ph) => `<input data-f="${a}" value="${esc(v ?? '')}" placeholder="${ph || ''}" inputmode="decimal" style="width:${w}px;height:36px;border:1.5px solid #EDE3D8;border-radius:10px;padding:0 8px;font:inherit;font-size:13px">`;
  function rows() {
    $('#jrows').innerHTML = st.items.map((it, i) => `<div data-i="${i}" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px;border-radius:12px;background:#FBF8F5">
      <span style="width:12px;height:12px;border-radius:3px;background:${COLORS[it.kind] || COLORS['기타']};flex:none"></span>${sel(KINDS, it.kind, 'kind')}
      ${it.kind === '구조재' || it.kind === '방부목' ? sel(['2*4', '2*6', '2*8', '2*10', '2*12'], it.size || '2*6', 'size') + inp(it.ja || 12, 'ja', 48, '자') + '<span style="font-size:12px;color:#8A7E77">자</span>' : ''}
      ${it.kind === '다루끼' ? inp(it.ja || 12, 'ja', 48, '자') + '<span style="font-size:12px;color:#8A7E77">자</span>' : ''}
      ${it.kind === '기타' ? inp(it.name, 'name', 80, '이름') + inp(it.L, 'L', 46, '길이m') + inp(it.W, 'W', 46, '폭m') + inp(it.kg, 'kg', 54, 'kg') : ''}
      ${inp(it.qty, 'qty', 64)}<span style="font-size:12px;color:#8A7E77">${UNIT[it.kind]}</span>
      <button type="button" data-del="${i}" aria-label="빼기" style="margin-left:auto;width:30px;height:30px;border:0;border-radius:9px;background:#F1E8E0;cursor:pointer">✕</button></div>`).join('');
  }
  let blocks = [], truck = null, layout = null;
  function calc(keepTruck) {
    blocks = st.items.flatMap(blocksOf);
    const rec = recommend(blocks); truck = (keepTruck && TRUCKS.find((t) => t.id === st.truck)) || rec; st.truck = truck.id;
    layout = pack(blocks, truck);
    $('#jtrucks').innerHTML = TRUCKS.map((t) => `<button type="button" data-t="${t.id}" class="btn" style="height:38px;box-shadow:none;${t.id === truck.id ? 'background:#E8732C;color:#fff' : 'background:#F4EFEA'}">${t.name}${t.id === rec.id ? ' ★' : ''}</button>`).join('');
    const kg = layout.kg, area = layout.placed.reduce((a, b) => a + b.L * b.W, 0) / (truck.L * truck.W), wPct = Math.min(100, kg / 10 / truck.cap);
    $('#jsum').innerHTML = `<div><div style="font-size:12px;color:#8A7E77">추천</div><div style="font-size:24px;font-weight:800;color:#E8732C">${rec.name}</div></div>
      <div><div style="font-size:12px;color:#8A7E77">총 무게</div><div style="font-size:20px;font-weight:800">${(kg / 1000).toFixed(2)}톤</div></div>
      <div style="flex:1"><div style="display:flex;justify-content:space-between;font-size:12px;color:#8A7E77"><span>${truck.name} 무게 ${Math.round(kg / 10 / truck.cap)}%</span><span>바닥 ${Math.round(area * 100)}%</span></div><div style="height:10px;border-radius:6px;background:#F1E8E0;overflow:hidden;margin-top:4px"><div style="height:100%;width:${wPct}%;background:${kg / 1000 > truck.cap ? '#FF5A4E' : '#34C759'}"></div></div>
      <div style="font-size:12px;color:#8A7E77;margin-top:4px">짐칸 ${truck.L}m × ${truck.W}m · ${blocks.length}덩어리${layout.over.length ? ` · <b style="color:#E5483B">안 들어감 ${layout.over.length}</b>` : ''}</div></div>`;
    bed();
  }
  function bed() {
    const box = $('#jbedbox').getBoundingClientRect(), pad = 60, sc = Math.min((box.width - pad * 2) / truck.L, (box.height - pad * 2) / truck.W, 140);
    const b = $('#jbed'); b.style.width = truck.L * sc + 'px'; b.style.height = truck.W * sc + 'px';
    b.innerHTML = `<div style="position:absolute;inset:-10px;border-radius:10px;background:#D9DDE3;box-shadow:inset 0 0 0 3px #B8BEC8"></div>
      <div style="position:absolute;right:-58px;top:50%;transform:translateY(-50%);width:44px;height:${Math.min(truck.W * sc, 120)}px;border-radius:10px 20px 20px 10px;background:#7FB2FF"><div style="position:absolute;left:8px;top:10px;right:8px;height:30%;border-radius:6px;background:#E6F4FF"></div></div>
      <div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,#EEF0F3 0 ${sc - 1}px,#E2E6EB ${sc - 1}px ${sc}px)"></div>
      ${layout.placed.map((p, j) => `<div class="jb" data-j="${j}" style="position:absolute;left:${p.y * sc}px;top:${p.x * sc}px;width:${p.L * sc - 3}px;height:${p.W * sc - 3}px;border-radius:6px;background:${p.c};box-shadow:inset 0 0 0 2px rgba(0,0,0,.12), 0 3px 6px rgba(0,0,0,.12);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;cursor:grab;touch-action:none;overflow:hidden;padding:2px">
        <span style="font-size:${Math.max(10, Math.min(14, p.W * sc / 4))}px;font-weight:800;color:#3A3128;white-space:nowrap">${esc(p.label)}</span><span style="font-size:11px;color:#5E534C;white-space:nowrap">${esc(p.sub)} · ${p.kg >= 1000 ? (p.kg / 1000).toFixed(1) + '톤' : Math.round(p.kg) + 'kg'}</span></div>`).join('')}
      <div style="position:absolute;left:0;bottom:-30px;font-size:12px;color:#8A7E77">뒤 (문)</div><div style="position:absolute;right:0;bottom:-30px;font-size:12px;color:#8A7E77">앞 (운전석)</div>`;
    layout.sc = sc;
  }
  rows(); calc();
  window.addEventListener('resize', () => bed());
  $('#jrows').addEventListener('change', (e) => { const r = e.target.closest('[data-i]'); if (!r) return; const it = st.items[+r.dataset.i], f = e.target.dataset.f; it[f] = ['qty', 'ja', 'L', 'W', 'kg'].includes(f) ? +e.target.value : e.target.value; if (f === 'kind') rows(); calc(); });
  $('#jrows').addEventListener('click', (e) => { const d = e.target.closest('[data-del]'); if (!d) return; st.items.splice(+d.dataset.del, 1); rows(); calc(); });
  $('#jadd').onclick = () => { st.items.push({ kind: '구조재', size: '2*6', ja: 12, qty: 160 }); rows(); calc(); };
  $('#jread').onclick = () => { const its = parse($('#jpaste').value); if (!its.length) return; st.items = its; $('#jpaste').value = ''; rows(); calc(); };
  $('#jtrucks').onclick = (e) => { const t = e.target.closest('[data-t]'); if (!t) return; st.truck = t.dataset.t; calc(true); };
  // 블록 끌어 옮기기
  let drag = null;
  $('#jbed').addEventListener('pointerdown', (e) => { const n = e.target.closest('.jb'); if (!n) return; drag = { n, p: layout.placed[+n.dataset.j], sx: e.clientX, sy: e.clientY, x: parseFloat(n.style.left), y: parseFloat(n.style.top) }; n.style.cursor = 'grabbing'; n.style.zIndex = 5; n.setPointerCapture(e.pointerId); });
  $('#jbed').addEventListener('pointermove', (e) => { if (!drag) return; const k = drag.n.getBoundingClientRect().width / drag.n.offsetWidth || 1; drag.n.style.left = (drag.x + (e.clientX - drag.sx) / k) + 'px'; drag.n.style.top = (drag.y + (e.clientY - drag.sy) / k) + 'px'; });
  $('#jbed').addEventListener('pointerup', () => { if (!drag) return; const sc = layout.sc; drag.p.y = parseFloat(drag.n.style.left) / sc; drag.p.x = parseFloat(drag.n.style.top) / sc; drag.n.style.cursor = 'grab'; drag.n.style.zIndex = ''; drag = null; });
  $('#jcopy').onclick = async () => {
    const lines = st.items.map((it) => `${it.kind}${it.size ? ' ' + it.size + '*' + (it.ja || 12) : it.ja ? ' ' + it.ja + '자' : ''} ${it.qty}${UNIT[it.kind]}`);
    const txt = `배차 요청드립니다.\n${truck.name} 1대 · 총 ${(layout.kg / 1000).toFixed(1)}톤 · 짐 길이 최대 ${Math.max(...blocks.map((b) => b.L), 0).toFixed(1)}m\n${lines.join('\n')}`;
    try { await navigator.clipboard.writeText(txt); $('#jcopy').textContent = '복사했어요'; setTimeout(() => { $('#jcopy').textContent = '배차 요청 글 복사'; }, 1500); } catch (e) { prompt('복사해서 쓰세요', txt); }
  };
  $('#jpng').onclick = () => {   // 짐칸 그림을 PNG 로 (캔버스에 다시 그림)
    const sc = 120, M = 40, cw = truck.L * sc + M * 2 + 60, chh = truck.W * sc + M * 2 + 60, c = document.createElement('canvas'); c.width = cw; c.height = chh; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, cw, chh); g.fillStyle = '#2B2522'; g.font = 'bold 22px Pretendard, sans-serif'; g.fillText(`${truck.name} · 총 ${(layout.kg / 1000).toFixed(2)}톤 · 짐칸 ${truck.L}×${truck.W}m`, M, 30);
    g.fillStyle = '#E2E6EB'; g.fillRect(M, M + 20, truck.L * sc, truck.W * sc); g.strokeStyle = '#9AA2AE'; g.lineWidth = 3; g.strokeRect(M, M + 20, truck.L * sc, truck.W * sc);
    layout.placed.forEach((p) => { const x = M + p.y * sc, y = M + 20 + p.x * sc, w = p.L * sc - 3, h = p.W * sc - 3; g.fillStyle = p.c; g.fillRect(x, y, w, h); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.strokeRect(x, y, w, h); g.fillStyle = '#3A3128'; g.font = 'bold 15px Pretendard, sans-serif'; g.textAlign = 'center'; g.fillText(p.label, x + w / 2, y + h / 2 - 4); g.font = '13px Pretendard, sans-serif'; g.fillText(`${p.sub} · ${p.kg >= 1000 ? (p.kg / 1000).toFixed(1) + '톤' : Math.round(p.kg) + 'kg'}`, x + w / 2, y + h / 2 + 14); g.textAlign = 'left'; });
    g.fillStyle = '#8A7E77'; g.font = '13px Pretendard, sans-serif'; g.fillText('← 뒤 (문)', M, M + 20 + truck.W * sc + 22); g.textAlign = 'right'; g.fillText('앞 (운전석) →', M + truck.L * sc, M + 20 + truck.W * sc + 22);
    const a = document.createElement('a'); const d = new Date(); a.download = `짐짜기_${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${truck.name}.png`; a.href = c.toDataURL('image/png'); a.click();
  };
}
