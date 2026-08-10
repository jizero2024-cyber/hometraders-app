import {
  CATEGORIES, UNITS, WH_ICON_KEYS, swatchFor,
} from './data.js?v=2';
import * as S from './store-supabase.js';

// 창고 아이콘 세트 (무채색)
const WH_ICONS = {
  warehouse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l9-4 9 4v12"/><path d="M2 21h20"/><rect x="8" y="13" width="8" height="8"/><path d="M8 17h8"/></svg>',
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18"/><path d="M9 7h1.5M13.5 7h1.5M9 11h1.5M13.5 11h1.5M9 15h1.5M13.5 15h1.5"/><path d="M2 21h20"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><rect x="10" y="14" width="4" height="6"/></svg>',
  boxes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="10" width="8" height="7"/><rect x="13" y="10" width="8" height="7"/><rect x="8" y="3" width="8" height="7"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.4 7-12A7 7 0 0 0 5 9c0 5.6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v9H3z"/><path d="M14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></svg>',
};
const whIcon = (k) => WH_ICONS[k] || WH_ICONS.warehouse;

// ── 아이콘 (인라인 SVG, currentColor) ─────────────────
const I = {
  home: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
  box: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></svg>',
  truck: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v9H3z"/><path d="M14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></svg>',
  cog: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 6.5"/></svg>',
  drop: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/></svg>',
  doc: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h4l2 5-2.5 1.5a12 12 0 0 0 6 6L15 14l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2z"/></svg>',
  tag: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12V4h8l9 9-8 8z"/><circle cx="7.5" cy="7.5" r="1.4"/></svg>',
};
const whShort = (n) => n.replace('창고', '').replace('로지스', '');

function shipStepper(sh) {
  const status = sh.status;
  const stages = sh.method === '택배' ? ['출고예정', '출고완료'] : STAGES;   // 택배는 배차 단계 없음
  const cur = stages.indexOf(status);
  const final = status === '출고완료';
  return `<div class="stepper">${stages.map((s, i) => {
    const cls = i < cur ? 'done' : (i === cur ? (final ? 'done' : 'now') : '');
    const inner = (i < cur || final) ? I.check : '';
    return `<button type="button" class="sc ${cls}" data-act="ship-stage" data-id="${sh.id}" data-v="${s}"><span class="ci">${inner}</span><span class="tl">${STAGE_SHORT[s]}</span></button>`;
  }).join('')}</div>`;
}

const _t = S.todayStr();
let state = { route: 'home', stockWH: null, sheet: null,
  shipView: 'cal', shipFilter: '전체', selDate: _t, calY: +_t.slice(0, 4), calM: +_t.slice(5, 7) };

const STAGES = ['출고예정', '배차완료', '출고완료'];
const STAGE_SHORT = { 출고예정: '예정', 배차완료: '배차', 출고완료: '출고' };
const STAGE_PILL = { 출고예정: 'plan', 배차완료: 'mid', 출고완료: 'done' };
const DISPATCH = ['이음물류', '직접', '기타'];
const COURIERS = ['경동택배', 'CJ대한통운', '로젠택배', '한진택배', '우체국택배', '대신택배'];
const telHref = (p) => 'tel:' + String(p || '').replace(/[^0-9]/g, '');

// 견적서 발행정보 (양식 고정값)
const SUPPLIER = {
  company: '주식회사 홈트레이더스', ceo: '이 최 원', bizno: '876-87-02032',
  addr: '경기도 화성시 동탄대로 595', type: '도매 및 소매업', item: '건축자재',
  manager: '김현아 대리', tel: '010-2469-9453', email: 'hometraders@naver.com',
};
function koreanMoney(num) {
  let n = Math.round(Number(num) || 0);
  if (n === 0) return '금 영원정';
  const d = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const su = ['', '십', '백', '천'];
  const bu = ['', '만', '억', '조', '경'];
  let res = '', g = 0;
  while (n > 0) {
    let part = n % 10000, s = '', p = part;
    for (let i = 0; i < 4; i++) { const dg = p % 10; if (dg > 0) s = d[dg] + su[i] + s; p = Math.floor(p / 10); }
    if (part > 0) res = s + bu[g] + res;
    n = Math.floor(n / 10000); g++;
  }
  return '금 ' + res + '원정';
}
function ymdK(ds) { const [y, m, d] = (ds || '').split('-'); return y ? `${y}년 ${+m}월 ${+d}일` : ''; }

const app = document.getElementById('app');
let shipPrefill = null;
let qLines = [];      // 견적 품목 작성 중 임시 배열
let qEditId = null;
let slLines = [];     // 출고 품목 줄 편집 중 임시 배열
let slId = null;
let quotePrefill = null;    // 스마트 붙여넣기 → 견적 프리필
let smartDispatchText = ''; // 스마트 붙여넣기 → 배차 원문(어느 출고에 붙일지 선택 대기)
let smartShipData = null;   // 스마트 붙여넣기 → 멀티 품목 출고 확인 대기

// 배차 안내 문구 → 기사·차량·운임·결제·경로 인식 (물류업체 회신 복붙용)
function parseDispatch(t) {
  const pm = t.match(/01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/);
  const driverPhone = pm ? pm[0].replace(/[\s.]/g, '-').replace(/-+/g, '-') : '';
  const nameM = t.match(/([가-힣]{2,4})\s*(?:기사님|기사|님)/);
  const driverName = nameM ? nameM[1] : '';
  const typeM = t.match(/\d+(?:\.\d+)?\s*톤\s*[가-힣]{0,4}/);        // 1톤카고
  const plateM = t.match(/(?:[가-힣]{2})?\d{2,3}[가-힣]\d{4}/);       // 경기85사7749
  const vehicle = [typeM ? typeM[0].trim() : '', plateM ? plateM[0] : ''].filter(Boolean).join(' ');
  let freight = 0;
  const manM = t.match(/(\d+(?:\.\d+)?)\s*만\s*원?/);                 // 8만원
  if (manM) freight = Math.round(parseFloat(manM[1]) * 10000);
  else { const wonM = t.match(/운임\s*([\d,]+)/); if (wonM) freight = Number(wonM[1].replace(/,/g, '')); }
  const payment = /착불/.test(t) ? '착불' : (/현불|현금/.test(t) ? '현불' : '');
  const routeM = t.match(/[가-힣]{2,}\s*-\s*[가-힣]{2,}/);            // 경광주곤지암-아산송악면
  const noteParts = [];
  if (routeM) noteParts.push(routeM[0].replace(/\s*-\s*/, '-'));
  if (/혼적/.test(t)) noteParts.push('혼적'); else if (/독차/.test(t)) noteParts.push('독차');
  if (/소분/.test(t)) noteParts.push('소분');
  if (/당착|바로|당일/.test(t)) noteParts.push('당착');
  return { driverName, driverPhone, vehicle, freight, payment, note: noteParts.join(' '),
    hasDispatch: !!(driverPhone || vehicle || freight), pm, typeM, plateM, routeM };
}

// 대표/물류 톡 → 출고 항목 인식 (규칙 기반)
function parseQuick(text) {
  const t = (text || '').trim();
  const items = S.getItems();
  let warehouse = /엔에스|앤에스|엔에스홈|\bns\b/i.test(t) ? 'NS로지스'
    : /천안/.test(t) ? '천안창고' : null;
  const qm = t.match(/(\d+)\s*(박스|낱개|개|장|본|단)/);
  const qty = qm ? Number(qm[1]) : '';
  let unit = qm ? qm[2] : '';
  const aliasesOf = (it) => [it.name, ...String(it.aliases || '').split(/[,\n]/).map((s) => s.trim()).filter(Boolean)];
  const matchLen = (it) => Math.max(0, ...aliasesOf(it).filter((a) => a && t.includes(a)).map((a) => a.length));
  let cands = items.filter((it) => matchLen(it) > 0);
  cands.sort((a, b) => matchLen(b) - matchLen(a));
  if (warehouse) { const inWh = cands.filter((it) => it.warehouse === warehouse); if (inWh.length) cands = inWh; }
  const item = cands[0] || null;
  if (item && !warehouse) warehouse = item.warehouse;
  if (item && !unit) unit = item.unit;
  const d = parseDispatch(t);
  const status = /예정|내일|명일|모레|낼|다음|나중|가능할까|발주|주문/.test(t) ? '출고예정' : (d.hasDispatch ? '배차완료' : '출고완료');
  let rest = t;
  if (item) aliasesOf(item).forEach((a) => { if (a) rest = rest.split(a).join(' '); });
  if (qm) rest = rest.split(qm[0]).join(' ');
  if (d.pm) rest = rest.split(d.pm[0]).join(' ');
  if (d.typeM) rest = rest.split(d.typeM[0]).join(' ');
  if (d.plateM) rest = rest.split(d.plateM[0]).join(' ');
  if (d.routeM) rest = rest.split(d.routeM[0]).join(' ');
  rest = rest.replace(/([가-힣]{2,4})\s*(?:기사님|기사|님)/g, ' ')
             .replace(/소분해서|소분|걍|그냥|보낼께|보낼게|보내|주세요|해서|착불|현불|현금|당착|바로|당일|예정|내일|모레|혼적|독차|운임|만원|만\s?원|배차안내|배차|안내|드립니다|드려요|부탁드립니다|부탁드려요|부탁/g, ' ')
             .replace(/천안창고|천안|NS로지스|엔에스홈|엔에스|앤에스|ns/gi, ' ');
  const words = rest.split(/[\s,.\/]+/).filter((w) => w.length >= 2 && /[가-힣A-Za-z]/.test(w));
  return { warehouse: warehouse || '천안창고', itemId: item ? item.id : '', qty, unit,
    client: words[0] || '', status, note: d.note, matched: item ? item.name : null,
    raw: t, guess: item ? '' : (words[0] || ''),   // 자동학습: 품목 못 찾으면 부른 말 추정
    dispatchVia: d.hasDispatch ? '이음물류' : '', driverName: d.driverName, driverPhone: d.driverPhone,
    vehicle: d.vehicle, freight: d.freight, payment: d.payment };
}

// 붙여넣은 문구의 성격 분류: 배차 안내 / 견적 요청 / (기본) 출고 요청
function classifyPaste(t) {
  const s = t || '';
  if (/기사님|기사|\d+(?:\.\d+)?\s*톤|(?:[가-힣]{2})?\d{2,3}[가-힣]\d{4}|운임|현불|착불|배차|상차지|하차지/.test(s)) return '배차';
  if (/견적|단가|얼마|가격|견적서|할인/.test(s)) return '견적';
  return '출고';
}
// 견적 요청 문구 → 견적 폼 프리필
function parseQuoteText(t) {
  const s = (t || '').trim();
  const client = (S.getPartners().find((p) => p.name && s.includes(p.name)) || {}).name || '';
  const phone = (s.match(/01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/) || [''])[0].replace(/[\s.]/g, '-');
  return { client, phone, content: s };
}
// 여러 품목+수량이 한 문구에 오는 출고 요청 파싱 (예: "라떼 5박스, 베이지 5박스, 상아 10박스")
function parseMultiLines(t) {
  const text = (t || '').trim();
  const items = S.getItems();
  const aliasesOf = (it) => [it.name, ...String(it.aliases || '').split(/[,\n]/).map((s) => s.trim()).filter(Boolean)];
  const segs = text.split(/[,\n·]|그리고|및/).map((s) => s.trim()).filter(Boolean);
  const lines = []; const seen = new Set();
  segs.forEach((seg) => {
    const qm = seg.match(/(\d+(?:\.\d+)?)\s*(박스|낱개|개|장|본|단|롤|plt|파렛트)?/);
    if (!qm) return;
    let cand = null, len = 0;
    items.forEach((it) => aliasesOf(it).forEach((a) => { if (a && seg.includes(a) && a.length > len) { cand = it; len = a.length; } }));
    if (!cand || seen.has(cand.warehouse + cand.name)) return;
    seen.add(cand.warehouse + cand.name);
    lines.push({ name: cand.name, category: cand.category, unit: qm[2] || cand.unit || '', qty: Number(qm[1]), unitPrice: cand.unitPrice || 0, warehouse: cand.warehouse });
  });
  const client = (S.getPartners().find((p) => p.name && text.includes(p.name)) || {}).name || '';
  const status = /예정|내일|명일|모레|낼|다음|나중|가능할까|발주|주문/.test(text) ? '출고예정' : '출고완료';
  return { lines, warehouse: lines[0] ? lines[0].warehouse : (S.warehouseNames()[0] || ''), client, status };
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function swatchHTML(name) {
  const [hex, white] = swatchFor(name);
  const ch = esc(name.slice(0, 1));
  return `<span class="sw" style="background:${hex};color:${white ? '#fff' : '#000'}">${ch}</span>`;
}
const STATUS_KO = { ok: '정상', low: '부족', out: '품절' };

// 창고별 칩 스타일 — 천안=검정, NS=회색 (그 외는 순서 기반)
function whStyle(name) {
  if (name && name.includes('천안')) return 'background:var(--accent);color:var(--accent-ink)';
  if (name && (name.includes('NS') || name.includes('엔에스'))) return 'background:var(--surface-3);color:var(--ink)';
  const names = S.getWarehouses().map((w) => w.name).sort();
  const i = Math.max(0, names.indexOf(name));
  const tints = [['var(--accent-soft)', 'var(--ink)'], ['var(--out-bg)', 'var(--out-ink)'], ['var(--surface-2)', 'var(--ink)']];
  const [bg, fg] = tints[i % tints.length];
  return `background:${bg};color:${fg}`;
}
function whTag(name) {
  const w = S.getWarehouses().find((x) => x.name === name);
  return `<span class="whtag" style="${whStyle(name)}">${whIcon(w ? w.icon : 'warehouse')}<span>${esc(name)}</span></span>`;
}

// ── 화면들 ────────────────────────────────────────────
function screenHome() {
  const today = S.todayStr();
  const ships = S.getShipments();
  const items = S.getItems();
  const wait = ships.filter((s) => s.status === '출고예정').length;
  const needDispatch = ships.filter((s) => s.status === '출고예정' && !s.dispatchVia && !s.driverName);
  const inTransit = ships.filter((s) => s.status === '배차완료').length;
  const needCheck = ships.filter((s) => !s.name || (s.note || '').includes('확인'));
  const docPending = ships.filter((s) => s.status === '출고완료' && !s.docDone);
  const lowItems = items.filter((it) => S.stockStatus(it) === 'out');   // 대시보드는 품절만 (부족은 제외)
  const todayList = ships.filter((s) => s.date === today && !(s.status === '출고예정' && !s.dispatchVia && !s.driverName))
    .sort((a, b) => ((a.time || '~').localeCompare(b.time || '~')));

  const tiles = [
    ['견적대기', S.quotesPending(), 'quote'],
    ['출고대기', wait, 'ship:출고예정'],
    ['배차필요', needDispatch.length, 'ship:출고예정'],
    ['배송중', inTransit, 'ship:배차완료'],
    ['명세서 미발행', docPending.length, ''],
    ['확인필요', needCheck.length, ''],
  ];
  const tile = ([k, v, act]) => `<button class="tile ${v === '—' ? 'soft' : ''}" ${act ? `data-act="tilego" data-v="${act}"` : ''}>
    <span class="tk">${k}</span><span class="tv">${v}</span></button>`;

  const boardRow = (s) => {
    const isPlan = s.status === '출고예정';
    const needsDisp = isPlan && !s.dispatchVia && !s.driverName;
    const left = isPlan ? mdDow(s.date) : (s.time || '--:--');
    const pillCls = needsDisp ? 'low' : (isPlan ? 'plan' : STAGE_PILL[s.status]);
    const pillTxt = needsDisp ? '배차필요' : (isPlan ? '예정' : STAGE_SHORT[s.status]);
    const sm = shipSummary(s);
    return `<button class="brd" data-act="ship" data-id="${s.id}">
    <span class="bt">${esc(left)}</span>
    <div class="bmid"><b>${esc(s.client || '거래처 미지정')}</b>
      <div class="bsub">${esc(sm.itemLabel)} ${esc(sm.qtyLabel)} · ${whTag(s.warehouse)}</div></div>
    <span style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
      <span class="pill ${pillCls}">${pillTxt}</span>
      ${s.status === '출고완료' ? `<span class="pill ${s.docDone ? 'done' : 'low'}" style="font-size:11px">${s.docDone ? '명세서 발행' : '명세서 미발행'}</span>` : ''}
    </span></button>`;
  };

  const pendingQuotes = S.getQuotes().filter((q) => q.status === '견적대기').sort((a, b) => daysSince(b.date) - daysSince(a.date));
  const problems = [];
  if (pendingQuotes.length) problems.push(`<div class="psec"><span class="pttl">견적 미발송 (${pendingQuotes.length})</span>
    ${pendingQuotes.slice(0, 5).map((q) => `<button class="prow" data-act="quote-open" data-id="${q.id}"><span>${esc(q.client || '-')}${q.content ? ` · ${esc(q.content)}` : ''}</span><span class="pill ${daysSince(q.date) >= 2 ? 'out' : 'plan'}">${pendingLabel(q.date)}</span></button>`).join('')}</div>`);
  if (lowItems.length) problems.push(`<div class="psec"><span class="pttl">품절 (${lowItems.length})</span>
    ${lowItems.slice(0, 5).map((it) => `<button class="prow" data-act="wh" data-w="${esc(it.warehouse)}"><span>${esc(it.name)} · ${esc(it.warehouse)}</span><span class="pill ${S.stockStatus(it)}">${STATUS_KO[S.stockStatus(it)]}</span></button>`).join('')}</div>`);
  if (needDispatch.length) problems.push(`<div class="psec"><span class="pttl">배차 미정 (${needDispatch.length})</span>
    ${needDispatch.slice(0, 5).map((s) => `<button class="prow" data-act="ship" data-id="${s.id}"><span>${esc(s.name)} · ${esc(s.client || '-')}</span><span class="pill plan">배차필요</span></button>`).join('')}</div>`);
  if (docPending.length) problems.push(`<div class="psec"><span class="pttl">명세서 미발행 (${docPending.length})</span>
    ${docPending.slice(0, 5).map((s) => `<button class="prow" data-act="ship" data-id="${s.id}"><span>${esc(s.client || '-')} · ${esc(s.name || '')} ${s.qty}${esc(s.unit)}</span><span class="pill low">미발행</span></button>`).join('')}</div>`);
  if (needCheck.length) problems.push(`<div class="psec"><span class="pttl">확인 필요 (${needCheck.length})</span>
    ${needCheck.slice(0, 5).map((s) => `<button class="prow" data-act="ship" data-id="${s.id}"><span>${esc(s.client || '-')} · ${s.name ? esc(s.note || '확인 필요') : '품목 미지정'}</span><span class="pill chk">확인</span></button>`).join('')}</div>`);

  return `
  <div class="screen">
    <div class="sec-title">오늘 처리 현황</div>
    <div class="tiles">${tiles.map(tile).join('')}</div>

    <div class="sec-title">배차 요청 필요</div>
    ${needDispatch.length ? `<div class="rows">${needDispatch.map(boardRow).join('')}</div>`
      : `<div class="card" style="color:var(--muted);font-size:14px">배차 요청할 게 없어요.</div>`}

    <div class="sec-title">오늘 출고 · 도착</div>
    ${todayList.length ? `<div class="rows">${todayList.map(boardRow).join('')}</div>`
      : `<div class="card" style="color:var(--muted);font-size:14px">오늘 예정된 출고·도착이 없어요.</div>`}

    <div class="sec-title">체크리스트</div>
    ${problems.length ? problems.join('') : `<div class="card" style="color:var(--muted);font-size:14px">오늘 챙길 게 없어요. 정상입니다.</div>`}
  </div>`;
}

function rowStock(it) {
  const sp = S.stockParts(it);
  const st = S.stockStatus(it);
  const res = Math.round(S.reservedQty(it));
  const needCheck = (it.note || '').includes('확인');
  const noteHtml = it.note ? ` · <span style="color:${needCheck ? '#e05a52' : 'var(--muted)'};font-weight:${needCheck ? '600' : '400'}">${esc(it.note)}</span>` : '';
  return `<button class="row" data-act="item" data-id="${it.id}">
    ${swatchHTML(it.name)}
    <div class="nm"><b>${esc(it.name)}</b><span>${esc(it.warehouse)} · ${esc(it.category)}${it.perBox ? ` · ${it.perBox}개입` : ''}${res >= 1 ? ` · 예정 ${res}` : ''}${noteHtml}</span></div>
    <div class="qty"><b>${sp.whole}</b><span>${esc(sp.unit)}${sp.loose ? ` +${sp.loose}개` : ''}</span></div>
    ${needCheck ? '<span class="pill chk">확인</span>' : `<span class="pill ${st}">${STATUS_KO[st]}</span>`}
  </button>`;
}
const boxText = (it) => { const sp = S.stockParts(it); return sp.loose ? `${sp.whole}+${sp.loose}개` : `${sp.whole}`; };

function screenStock() {
  return state.stockWH ? screenWarehouseStock(state.stockWH) : screenWarehouses();
}

function colorStatus(total) { return total <= 0 ? 'out' : (total <= 10 ? 'low' : 'ok'); }

function screenSilicone() {
  const wh = state.silWH || null;
  const allSil = S.getItems().filter((it) => it.category === '실리콘');
  const sil = wh ? allSil.filter((it) => it.warehouse === wh) : allSil;
  const silWhs = [...new Set(allSil.map((it) => it.warehouse))];
  const byName = {};
  sil.forEach((it) => { (byName[it.name] = byName[it.name] || []).push(it); });
  const rows = Object.keys(byName).map((name) => {
    const list = byName[name];
    const total = Math.floor(list.reduce((s, it) => s + Math.max(0, S.currentStock(it)), 0));
    return { name, list, total, unit: list[0].unit, st: colorStatus(total) };
  });
  const rank = { out: 0, low: 1, ok: 2 };
  rows.sort((a, b) => rank[a.st] - rank[b.st] || b.total - a.total);

  // 월별 실리콘 출고 내역 (어느 거래처에 몇 개)
  const silNames = new Set(allSil.map((it) => it.name));
  const outs = [];
  S.getShipments().forEach((s) => {
    if (wh && s.warehouse !== wh) return;
    S.shipLines(s).forEach((l) => {
      if (silNames.has(l.name) && Number(l.qty) > 0) outs.push({ id: s.id, date: s.date || '', month: (s.date || '').slice(0, 7), client: s.client || '거래처 미지정', name: l.name, qty: Number(l.qty), unit: l.unit || '', status: s.status });
    });
  });
  outs.sort((a, b) => (b.date + b.name).localeCompare(a.date + a.name));
  const months = [...new Set(outs.map((e) => e.month))].filter(Boolean).sort().reverse();
  const monthBlock = (m) => {
    const es = outs.filter((e) => e.month === m);
    const total = es.reduce((s, e) => s + e.qty, 0);
    return `<div class="sec-title" style="margin-top:16px">${esc(m.replace('-', '. '))} · 합계 ${total}</div>
      <div class="rows">${es.map((e) => `<button class="ship" data-act="ship" data-id="${e.id}">
        ${swatchHTML(e.name)}
        <div class="body"><b>${esc(e.client)}</b><div class="meta">${esc(e.name)} · ${esc(e.date)}${e.status !== '출고완료' ? ` · <span style="color:var(--muted)">${esc(e.status)}</span>` : ''}</div></div>
        <div class="right"><span class="q">${e.qty}${esc(e.unit)}</span></div>
      </button>`).join('')}</div>`;
  };
  const outList = months.length ? `<div class="sec-title" style="margin-top:26px">월별 출고 내역</div>${months.map(monthBlock).join('')}` : '';

  return `<div class="screen">
    <div class="tabs" style="margin-bottom:12px">
      <button data-act="sil-wh" data-w="" class="${!wh ? 'on' : ''}">전체</button>
      ${silWhs.map((w) => `<button data-act="sil-wh" data-w="${esc(w)}" class="${wh === w ? 'on' : ''}">${esc(whShort(w))}</button>`).join('')}
    </div>
    <div class="sec-title">색상 ${rows.length} · ${wh ? esc(whShort(wh)) + ' 창고' : '창고 합산'}</div>
    <div class="rows">
      ${rows.map((r) => { const ns = r.list.filter((it) => (it.note || '').trim()).map((it) => esc((silWhs.length > 1 ? whShort(it.warehouse) + ' ' : '') + it.note)); return `<button class="row" data-act="color" data-c="${esc(r.name)}">
        ${swatchHTML(r.name)}
        <div class="nm" style="flex:0 1 auto;min-width:0"><b>${esc(r.name)}</b>
          <div class="split">${r.list.map((it) => `<span class="wtag" style="${whStyle(it.warehouse)}">${esc(whShort(it.warehouse))} ${boxText(it)}</span>`).join('')}</div></div>
        ${ns.length ? `<div style="flex:1;min-width:0;text-align:center;color:#e05a52;font-size:12px;font-weight:600;padding:0 8px;line-height:1.35">${ns.join(' · ')}</div>` : '<div style="flex:1"></div>'}
        <div class="qty"><b>${r.total}</b><span>${esc(r.unit)}</span></div>
        <span class="pill ${r.st}">${STATUS_KO[r.st]}</span>
      </button>`; }).join('')}
    </div>
    ${outList}
  </div>`;
}

function sheetColor(name) {
  const list = S.getItems().filter((it) => it.category === '실리콘' && it.name === name);
  const [hex, white] = swatchFor(name);
  const recent = S.getShipments().filter((s) => S.shipLines(s).some((l) => l.name === name)).slice(0, 6);
  return `<div class="grab"></div>
  <h2><span class="sw" style="background:${hex};color:${white ? '#fff' : '#000'};width:26px;height:26px">${esc(name.slice(0, 1))}</span> ${esc(name)}</h2>
  <div class="rows">
    ${list.map((it) => {
      const cur = S.currentStock(it);
      return `<div style="margin-bottom:12px">
        <div class="row" style="box-shadow:none;background:var(--surface-2)">
          <span class="whic sm">${whIcon((S.getWarehouses().find((w) => w.name === it.warehouse) || {}).icon || 'warehouse')}</span>
          <div class="nm"><b>${esc(it.warehouse)}</b><span>${it.perBox ? `${it.perBox}개입 · ` : ''}${S.reservedQty(it) ? `예정 ${S.reservedQty(it)}` : '　'}</span></div>
          <div class="qty"><b>${cur}</b><span>${esc(it.unit)}</span></div>
          <button class="pill" data-act="stock-edit" data-id="${it.id}" style="margin-right:6px">수정</button>
          <button class="pill done" data-act="color-ship" data-id="${it.id}">출고</button>
        </div>
        <input data-note-id="${it.id}" value="${esc(it.note || '')}" placeholder="비고 — 입고예정일 등 (리스트에 빨간색 표시)" autocapitalize="none" style="width:100%;margin-top:6px;padding:10px 12px;border-radius:9px;background:var(--surface);color:#e05a52;font-weight:600;font-size:13px;border:0">
      </div>`;
    }).join('')}
  </div>
  ${recent.length ? `<div class="sec-title">이 색 최근 출고</div><div class="rows">${recent.map((s) => {
      const ln = S.shipLines(s).find((l) => l.name === name) || {};
      return `<button class="ship" data-act="ship" data-id="${s.id}">
        <div class="body"><b>${esc(s.client || '거래처 미지정')}</b>
          <div class="meta">${whTag(s.warehouse)} · ${esc(s.date)}</div></div>
        <div class="right" style="flex-wrap:wrap;justify-content:flex-end;gap:6px">
          <span class="q">${ln.qty || 0}${esc(ln.unit || '')}</span>
          <span class="pill ${STAGE_PILL[s.status] || 'plan'}">${STAGE_SHORT[s.status] || esc(s.status)}</span></div>
      </button>`;
    }).join('')}</div>` : ''}
  <button class="btn ghost" type="button" data-act="close" style="margin-top:12px">닫기</button>`;
}

function screenWarehouses() {
  const whs = S.getWarehouses();
  return `<div class="screen">
    <div class="sec-title">창고 (${whs.length})</div>
    <div class="rows">
      ${whs.map((w) => {
        const sm = S.warehouseSummary(w.name);
        return `<button class="whcard" data-act="wh" data-w="${esc(w.name)}">
          <span class="whic">${whIcon(w.icon)}</span>
          <div class="nm"><b>${esc(w.name)}</b><span>${sm.itemCount}품목${sm.low ? ` · 부족·품절 ${sm.low}` : ''}</span></div>
          <div class="qty"><b>${sm.total.toLocaleString()}</b><span>재고</span></div>
          <span class="chev">›</span>
        </button>`;
      }).join('')}
    </div>
    <button class="btn ghost" data-act="add-wh" style="margin-top:12px">＋ 창고 추가</button>
  </div>`;
}

function screenWarehouseStock(wh) {
  const w = S.getWarehouses().find((x) => x.name === wh);
  const items = S.getItems().filter((it) => it.warehouse === wh);
  const groups = {};
  items.forEach((it) => { (groups[it.category] = groups[it.category] || []).push(it); });
  const order = Object.keys(groups).sort();
  return `<div class="screen">
    <button class="backbar" data-act="wh-back">‹ 창고 목록</button>
    <div class="whtitle">${esc(wh)}</div>
    ${w && (w.address || w.phone) ? `<div class="whaddr">${esc(w.address || '')}${w.phone ? ` · ${esc(w.phone)}` : ''}</div>` : ''}
    ${order.length ? order.map((k) => `
      <div class="sec-title">${esc(k)}</div>
      <div class="rows">${groups[k].sort((a, b) => b.initial - a.initial).map(rowStock).join('')}</div>
    `).join('') : `<div class="empty"><div class="ico">${I.box}</div>이 창고에 품목이 없어요</div>`}
    <button class="btn" data-act="add-inbound" style="margin-top:14px">＋ 입고 등록 (재고 늘리기)</button>
    <button class="btn ghost" data-act="add-item" style="margin-top:8px">＋ 이 창고에 품목 추가</button>
  </div>`;
}

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const pad2 = (n) => String(n).padStart(2, '0');
const dstr = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`;

function dateLabel(ds) {
  const [y, m, d] = ds.split('-').map(Number);
  const w = DOW[new Date(y, m - 1, d).getDay()];
  const today = ds === S.todayStr();
  return `${m}월 ${d}일 (${w})${today ? ' · 오늘' : ''}`;
}

function screenShip() {
  const seg = `<div class="tabs" style="margin-bottom:12px">
    <button data-act="shipview" data-v="cal" class="${state.shipView === 'cal' ? 'on' : ''}">달력</button>
    <button data-act="shipview" data-v="list" class="${state.shipView === 'list' ? 'on' : ''}">목록</button>
  </div>`;
  const quick = `<button class="quickbar" data-act="smart"><span class="ic">${I.bolt}</span>
    <span class="tx">문구 붙여넣어 <b>자동 인식</b> · 출고·견적·배차</span><span class="go">›</span></button>`;
  if (state.shipView === 'list') {
    const cnt = S.statusCounts();
    const f = state.shipFilter;
    const filt = `<div class="filtabs">${[['전체', cnt.전체], ...STAGES.map((s) => [s, cnt[s]])]
      .map(([k, c]) => `<button data-act="shipfilter" data-v="${k}" class="${f === k ? 'on' : ''}">${STAGE_SHORT[k] || k}<b>${c}</b></button>`).join('')}</div>`;
    let list = S.getShipments();
    if (f !== '전체') list = list.filter((s) => s.status === f);
    return `<div class="screen">${seg}${quick}${filt}${list.length
      ? `<div class="rows">${list.map(rowShip).join('')}</div>`
      : `<div class="empty"><div class="ico">${I.truck}</div>${f === '전체' ? '아직 출고가 없어요' : `'${STAGE_SHORT[f] || f}' 상태가 없어요`}</div>`}</div>`;
  }
  return `<div class="screen">${seg}${quick}${calendarHTML()}${dayDetailHTML()}</div>`;
}

function emptyShip() {
  return `<div class="empty"><div class="ico">${I.truck}</div>아직 출고가 없어요<br><span style="font-size:13px">아래 <b>+ 출고 등록</b> 으로 시작하세요</span></div>`;
}

function calendarHTML() {
  const { calY: y, calM: m } = state;
  const byDate = {};
  S.getShipments().forEach((s) => { (byDate[s.date] = byDate[s.date] || []).push(s); });
  const startDow = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push('');
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7) cells.push('');
  const today = S.todayStr();

  const cellHTML = (d) => {
    if (!d) return `<div class="cell empty"></div>`;
    const ds = dstr(y, m, d);
    const list = byDate[ds] || [];
    const done = list.filter((s) => s.status === '출고완료').length;
    const dot = list.length
      ? `<span class="cdot ${done ? '' : 'plan'}">${list.length}</span>` : `<span class="cdot ghost"></span>`;
    return `<button class="cell ${ds === state.selDate ? 'sel' : ''} ${ds === today ? 'today' : ''}"
      data-act="selday" data-d="${ds}"><span class="dnum">${d}</span>${dot}</button>`;
  };

  return `<div class="cal">
    <div class="cal-nav">
      <button data-act="calnav" data-v="-1" aria-label="이전 달">‹</button>
      <b>${y}년 ${m}월</b>
      <button data-act="calnav" data-v="1" aria-label="다음 달">›</button>
    </div>
    <div class="dow">${DOW.map((w, i) => `<span class="${i === 0 ? 'sun' : ''}">${w}</span>`).join('')}</div>
    <div class="grid7">${cells.map(cellHTML).join('')}</div>
  </div>`;
}

function dayDetailHTML() {
  const list = S.getShipments().filter((s) => s.date === state.selDate);
  return `<div class="dayhdr"><b>${dateLabel(state.selDate)}</b><span class="cnt">${list.length}건</span></div>
    ${list.length ? `<div class="rows">${list.map(rowShip).join('')}</div>`
      : `<div class="empty" style="padding:28px 20px">이 날짜엔 출고가 없어요<br>
         <button class="btn ghost" data-act="new-ship" style="margin-top:12px;width:auto;padding:10px 18px">＋ 이 날짜로 출고 등록</button></div>`}`;
}

function daysSince(ds) {
  if (!ds) return 0;
  const [y, m, d] = ds.split('-').map(Number);
  const t = S.todayStr().split('-').map(Number);
  return Math.round((new Date(t[0], t[1] - 1, t[2]) - new Date(y, m - 1, d)) / 86400000);
}
const pendingLabel = (ds) => { const n = daysSince(ds); return n <= 0 ? '오늘 접수' : `${n}일째 대기`; };
const DOW_S = ['일', '월', '화', '수', '목', '금', '토'];
function mdDow(ds) { if (!ds) return ''; const [y, m, d] = ds.split('-').map(Number); return `${m}/${d}(${DOW_S[new Date(y, m - 1, d).getDay()]})`; }

function screenQuote() {
  const all = S.getQuotes();
  const f = state.quoteFilter || '전체';
  const cnt = { 전체: all.length, 견적대기: all.filter((q) => q.status === '견적대기').length, 견적완료: all.filter((q) => q.status === '견적완료').length };
  const filt = `<div class="filtabs">${[['전체', cnt.전체], ['견적대기', cnt.견적대기], ['견적완료', cnt.견적완료]]
    .map(([k, c]) => `<button data-act="quote-filter" data-v="${k}" class="${f === k ? 'on' : ''}">${k.replace('견적', '')}<b>${c}</b></button>`).join('')}</div>`;
  const list = f === '전체' ? all : all.filter((q) => q.status === f);
  return `<div class="screen">
    ${filt}
    <button class="btn" data-act="add-quote" style="margin-bottom:12px">＋ 견적 요청 추가</button>
    ${list.length ? `<div class="rows">${list.map(quoteRow).join('')}</div>`
      : `<div class="empty"><div class="ico">${I.doc}</div>${f === '전체' ? '견적 요청이 없어요' : `'${f.replace('견적', '')}' 건이 없어요`}</div>`}
  </div>`;
}

function quoteRow(q) {
  const done = q.status === '견적완료';
  const lastCall = q.calls && q.calls.length ? q.calls[q.calls.length - 1] : '';
  return `<div class="ship">
    <button class="qopen" data-act="quote-open" data-id="${q.id}">
      <span class="whic sm">${I.doc}</span>
      <div class="body"><b>${esc(q.client || '거래처 미지정')}</b>
        <div class="meta">${esc(q.content || '-')}${!done ? ` · <b style="color:${daysSince(q.date) >= 2 ? '#e05a52' : 'var(--muted)'}">${pendingLabel(q.date)}</b>` : ''}${lastCall ? ` · 통화 ${esc(lastCall)}` : ''}</div></div>
    </button>
    <div class="right">
      ${q.phone ? `<a class="pill call" href="tel:${telHref(q.phone)}" data-act="quote-call" data-id="${q.id}">전화</a>` : ''}
      <span class="pill ${done ? 'done' : 'plan'}">${done ? '완료' : '대기'}</span>
    </div>
  </div>`;
}

function sheetQuote(id) {
  const q = S.getQuotes().find((x) => x.id === id);
  if (!q) return '';
  const done = q.status === '견적완료';
  const sil = S.getItems().filter((it) => it.category === '실리콘');
  const lines = q.lines || [];
  return `<div class="grab"></div><h2 id="quote-detail">${esc(q.client || '거래처 미지정')}</h2>
  <div class="doc">
    <div class="kv"><span>요청 내용</span><b>${esc(q.content || '-')}</b></div>
    <div class="kv"><span>연락처</span><b>${esc(q.phone || '-')}</b></div>
    ${q.note ? `<div class="kv"><span>비고</span><b>${esc(q.note)}</b></div>` : ''}
  </div>
  ${lines.length ? `<div class="sec-title">견적 품목</div>
  <div class="doc"><table>
    <tr><th>품목</th><th class="n">수량</th><th class="n">단가</th><th class="n">금액</th></tr>
    ${lines.map((l) => `<tr><td>${esc(l.name)}</td><td class="n">${l.qty}</td><td class="n">${Number(l.unitPrice).toLocaleString()}</td><td class="n">${((Number(l.qty) || 0) * (Number(l.unitPrice) || 0)).toLocaleString()}</td></tr>`).join('')}
    <tr><td colspan="3"><b>합계</b></td><td class="n"><b>${quoteTotal(lines).toLocaleString()}원</b></td></tr>
  </table></div>` : ''}
  <button class="btn ghost" type="button" data-act="quote-lines" data-id="${q.id}" style="margin-top:10px">${lines.length ? '견적 품목 수정' : '견적 품목 작성 (단가·금액)'}</button>
  ${lines.length ? `<button class="btn" type="button" data-act="quote-to-ship" data-id="${q.id}">이 견적으로 출고 만들기</button>` : ''}
  ${q.phone ? `<a class="btn" href="tel:${telHref(q.phone)}" data-act="quote-call" data-id="${q.id}">📞 전화 걸기</a>`.replace('📞 ', '') : ''}
  ${q.calls && q.calls.length ? `<div class="sec-title">통화 기록 (${q.calls.length})</div>
    <div class="card" style="padding:6px 14px">${q.calls.slice().reverse().map((c) => `<div class="kv"><span>${esc(c)}</span><b style="color:var(--text-accent,var(--ink))">✓</b></div>`).join('')}</div>` : ''}

  <div class="sec-title">단가 변경 (통화 중)</div>
  <div class="card" style="display:flex;gap:8px;align-items:center">
    <select id="q-item" style="flex:1;padding:10px;border-radius:10px;background:var(--surface-2);border:0;color:var(--ink)">
      ${sil.map((it) => `<option value="${it.id}">${esc(it.name)} (${esc(whShort(it.warehouse))})${it.unitPrice ? ` · ${it.unitPrice}원` : ''}</option>`).join('') || '<option value="">실리콘 없음</option>'}
    </select>
    <input id="q-price" type="number" inputmode="numeric" placeholder="새 단가" style="width:92px;padding:10px;border-radius:10px;background:var(--surface-2);border:0;color:var(--ink)">
    <button class="pill done" data-act="quote-price" style="padding:10px 12px">적용</button>
  </div>

  <div class="sec-title">상태</div>
  <div class="seg">
    <button type="button" data-act="quote-status" data-id="${q.id}" data-v="견적대기" class="${done ? '' : 'on'}">견적대기</button>
    <button type="button" data-act="quote-status" data-id="${q.id}" data-v="견적완료" class="${done ? 'on' : ''}">견적완료</button>
  </div>
  <button class="btn ghost" type="button" data-act="quote-edit" data-id="${q.id}" style="margin-top:12px">내용 수정</button>
  <button class="btn danger" type="button" data-act="del-quote" data-id="${q.id}">이 견적요청 삭제</button>`;
}

const quoteTotal = (lines) => (lines || []).reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);

function quoteLineRow(l, i, items) {
  return `<div class="qlrow">
    <select class="ql-item" data-i="${i}">${items.map((it) => `<option value="${esc(it.name)}" data-price="${it.unitPrice || ''}" ${l.name === it.name ? 'selected' : ''}>${esc(it.name)}${it.unitPrice ? ` (${it.unitPrice}원)` : ''}</option>`).join('')}</select>
    <input class="ql-qty" data-i="${i}" type="number" inputmode="numeric" placeholder="수량" value="${l.qty || ''}">
    <input class="ql-price" data-i="${i}" type="number" inputmode="numeric" placeholder="단가" value="${l.unitPrice || ''}">
    <button type="button" class="ql-del" data-act="ql-del" data-i="${i}">×</button>
  </div>`;
}

function sheetQuoteLines(id) {
  const items = S.getItems();
  return `<div class="grab"></div><h2>견적 품목 작성</h2>
  <p class="hint">품목을 고르면 <b>단가표 단가</b>가 자동으로 들어와요 · 수정 가능</p>
  <div class="qlhead"><span>품목</span><span>수량</span><span>단가</span><span></span></div>
  <div id="ql-rows">${qLines.map((l, i) => quoteLineRow(l, i, items)).join('')}</div>
  <button class="btn ghost" type="button" data-act="ql-add" style="margin-top:8px">＋ 품목 추가</button>
  <div class="kv" style="font-size:16px;padding:14px 2px 4px"><span>합계</span><b id="ql-total">${quoteTotal(qLines).toLocaleString()}원</b></div>
  <button class="btn" type="button" data-act="ql-save" data-id="${id}">견적 품목 저장</button>
  <button class="btn danger" type="button" data-act="close">취소</button>`;
}

function sheetQuoteForm(id) {
  const q = id ? S.getQuotes().find((x) => x.id === id) : null;
  const pf = (!q && quotePrefill) ? quotePrefill : {};
  const partners = S.getPartners();
  return `<div class="grab"></div><h2>${q ? '견적 요청 수정' : '견적 요청 추가'}</h2>
  ${pf.content ? `<div class="parsed">${I.bolt}<span>견적 요청으로 인식됨</span></div>` : ''}
  <form id="quote-form" data-id="${q ? q.id : ''}">
    <div class="field"><label>거래처</label>
      <input name="client" list="partner-list" value="${q ? esc(q.client) : esc(pf.client || '')}" placeholder="거래처명">
      <datalist id="partner-list">${partners.map((p) => `<option value="${esc(p.name)}"></option>`).join('')}</datalist></div>
    <div class="field"><label>연락처</label><input name="phone" type="tel" value="${q ? esc(q.phone || '') : esc(pf.phone || '')}" placeholder="비우면 거래처 연락처 자동"></div>
    <div class="field"><label>요청 내용</label><textarea name="content" rows="2" placeholder="예: 베이지 200박스 견적 요청">${q ? esc(q.content || '') : esc(pf.content || '')}</textarea></div>
    <div class="field"><label>비고</label><input name="note" value="${q ? esc(q.note || '') : ''}" placeholder="선택"></div>
    <button class="btn" type="submit">저장</button>
    <button class="btn danger" type="button" data-act="close">취소</button>
  </form>`;
}

function shipSummary(s) {
  const lines = S.shipLines(s);
  const first = lines[0] || {};
  const itemLabel = lines.length > 1 ? `${first.name || ''} 외 ${lines.length - 1}종` : (first.name || s.name || '(미지정)');
  const qtyLabel = lines.length > 1 ? `${lines.length}종` : `${first.qty ?? s.qty ?? ''}${first.unit || s.unit || ''}`;
  return { itemLabel, qtyLabel, swatchName: first.name || s.name || '' };
}
function rowShip(s) {
  const cls = STAGE_PILL[s.status] || 'plan';
  const sm = shipSummary(s);
  return `<button class="ship" data-act="ship" data-id="${s.id}">
    ${swatchHTML(sm.swatchName)}
    <div class="body"><b>${esc(s.client || '거래처 미지정')}</b>
      <div class="meta">${whTag(s.warehouse)} ${esc(sm.itemLabel)} · ${esc(s.date)}</div></div>
    <div class="right" style="flex-wrap:wrap;justify-content:flex-end;gap:6px"><span class="q">${esc(sm.qtyLabel)}</span><span class="pill ${cls}">${STAGE_SHORT[s.status] || esc(s.status)}</span>${s.status === '출고완료' ? `<span class="pill ${s.docDone ? 'done' : 'low'}" style="font-size:11px">${s.docDone ? '명세서 발행' : '명세서 미발행'}</span>` : ''}</div>
  </button>`;
}

// 단가표 마스터 — 품목별 최근 단가·공급처 (탭하면 단가 수정). 업데이트 시점·엑셀은 다음 단계.
function screenPrice() {
  const items = S.getItems().slice();
  const byCat = {};
  items.forEach((it) => { (byCat[it.category || '기타'] = byCat[it.category || '기타'] || []).push(it); });
  Object.values(byCat).forEach((list) => list.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
  const cats = Object.keys(byCat).sort();
  const priceRow = (it) => `<button class="ship" data-act="item" data-id="${it.id}">
    ${swatchHTML(it.name)}
    <div class="body"><b>${esc(it.name)}</b>
      <div class="meta">${whTag(it.warehouse)} ${esc(it.unit || '')}${it.perBox ? ` · ${it.perBox}개입` : ''}${it.supplier ? ` · ${esc(it.supplier)}` : ''}</div></div>
    <div class="right" style="flex-wrap:wrap;justify-content:flex-end;gap:6px">
      <span class="q">${Number(it.unitPrice) > 0 ? Number(it.unitPrice).toLocaleString() + '원' : '단가 없음'}</span>
      ${it.vatSeparate ? '<span class="pill low" style="font-size:11px">부가세 별도</span>' : ''}
    </div>
  </button>`;
  const noPrice = items.filter((it) => !(Number(it.unitPrice) > 0)).length;
  return `<div class="screen">
    <div class="quickbar" style="cursor:default"><span class="tx">품목 <b>${items.length}</b>${noPrice ? ` · 단가 미입력 <b>${noPrice}</b>` : ''}</span></div>
    ${cats.map((c) => `<div class="sec-title">${esc(c)} ${byCat[c].length}</div><div class="rows">${byCat[c].map(priceRow).join('')}</div>`).join('')}
    <p class="hint" style="margin-top:16px">품목을 누르면 단가를 수정할 수 있어요. (단가 변경 이력·업데이트 시점·엑셀 추출은 다음 단계에 추가)</p>
  </div>`;
}

function screenSettings() {
  const items = S.getItems();
  const whs = S.getWarehouses();
  return `
  <div class="screen">
    <div class="sec-title">창고 관리 (${whs.length})</div>
    <div class="rows">
      ${whs.map((w) => `<button class="row" data-act="wh-edit" data-w="${esc(w.name)}">
        <span class="whic sm">${whIcon(w.icon)}</span>
        <div class="nm"><b>${esc(w.name)}</b><span>${S.warehouseSummary(w.name).itemCount}품목</span></div>
        <span class="pill plan">설정</span></button>`).join('')}
    </div>
    <button class="btn ghost" data-act="add-wh" style="margin-top:10px">＋ 창고 추가</button>

    <div class="sec-title">거래처 주소록 (${S.getPartners().length})</div>
    <div class="rows">
      ${S.getPartners().map((p) => `<button class="row" data-act="partner-edit" data-w="${esc(p.name)}">
        <span class="whic sm">${whIcon('pin')}</span>
        <div class="nm"><b>${esc(p.name)}</b><span>${esc(p.address || '주소 미등록')}</span></div>
        <span class="pill plan">수정</span></button>`).join('') || `<div class="card" style="color:var(--muted);font-size:13px">등록된 거래처가 없어요. 아래에서 추가하세요.</div>`}
    </div>
    <button class="btn ghost" data-act="add-partner" style="margin-top:10px">＋ 거래처 추가</button>

    <div class="sec-title">품목 관리 (${items.length})</div>
    <div class="rows">
      ${items.map((it) => `<button class="row" data-act="item" data-id="${it.id}">
        ${swatchHTML(it.name)}
        <div class="nm"><b>${esc(it.name)}</b><span>${esc(it.warehouse)} · ${esc(it.category)} · 초기 ${it.initial}${esc(it.unit)}</span></div>
        <span class="pill plan">수정</span></button>`).join('')}
    </div>
    <button class="btn ghost" data-act="add-item" style="margin-top:12px">＋ 품목 추가</button>

    <div class="sec-title">데이터</div>
    <div class="card">
      <div class="kv"><span>거래명세서 카톡 발송</span><b style="color:var(--muted)">2단계 예정</b></div>
      <div class="kv"><span>이카운트 ERP 연동</span><b style="color:var(--muted)">2단계 예정</b></div>
    </div>
    <button class="btn ghost" data-act="export" style="margin-top:12px">데이터 내보내기 (JSON)</button>
    <button class="btn ghost" data-act="logout" style="margin-top:8px">로그아웃</button>
    <p class="hint" style="text-align:center;margin-top:14px">홈트레이더스 재고·출고 · 1단계 MVP</p>
  </div>`;
}

// ── 시트(모달) ────────────────────────────────────────
function sheetShipForm() {
  const p = shipPrefill || {};
  const curSt = p.status || '출고완료';
  const hasDisp = !!(p.dispatchVia || p.driverName || p.driverPhone || p.vehicle || p.freight || p.payment);
  const banner = shipPrefill
    ? `<div class="parsed">${I.bolt}<span>인식됨${p.matched ? '' : ' · 품목을 못 찾았어요, 직접 선택하세요'}</span></div>` : '';
  return `<div class="grab"></div><h2>출고 등록</h2>${banner}
  ${!shipPrefill ? `<button type="button" class="quickbar" data-act="smart" style="margin-bottom:14px"><span class="ic">${I.bolt}</span><span class="tx">문구 붙여넣어 <b>자동 입력</b> (카톡·문자)</span><span class="go">›</span></button>` : ''}
  <form id="ship-form">
    <div class="field"><label>상태 <span style="color:var(--faint);font-weight:400">요청만 왔으면 출고예정 · 바로 나갔으면 출고완료</span></label>
      <div class="seg" id="f-status">
        ${['출고예정', '출고완료'].map((s) => `<button type="button" data-v="${s}" class="${curSt === s ? 'on' : ''}">${s}</button>`).join('')}
      </div></div>
    <div class="field"><label>창고</label>
      <select name="warehouse" id="f-wh">${S.warehouseNames().map((w) => `<option ${p.warehouse === w ? 'selected' : ''}>${w}</option>`).join('')}</select></div>
    <div class="field"><label>품목</label>
      <select name="itemId" id="f-item"></select>
      <p class="hint" id="f-stock" style="margin-top:8px"></p></div>
    ${(shipPrefill && !shipPrefill.matched && shipPrefill.guess) ? `<div class="field"><label>별칭 학습 <span style="color:var(--faint);font-weight:400">이 문구에서 위 품목을 부른 말 → 저장하면 다음부터 자동인식</span></label><input name="learnAlias" value="${esc(shipPrefill.guess)}" placeholder="예: 다루끼" autocapitalize="none"></div>` : ''}
    <div class="field"><div class="row2">
      <div><label>수량</label><input name="qty" id="f-qty" type="number" min="1" inputmode="numeric" placeholder="0" value="${p.qty ?? ''}"></div>
      <div><label>단위 <span style="color:var(--faint);font-weight:400">박스/낱개</span></label><select name="unit" id="f-unit"></select></div>
    </div></div>
    <div class="field"><label>거래처 (하차지)</label>
      <input name="client" list="ship-partners" placeholder="거래처 검색·선택" value="${esc(p.client || '')}" autocomplete="off">
      <datalist id="ship-partners">${S.getPartners().map((pt) => `<option value="${esc(pt.name)}"></option>`).join('')}</datalist></div>
    <div class="field"><div class="row2">
      <div><label>출고일</label><input name="date" type="date" value="${state.selDate || S.todayStr()}"></div>
      <div><label>시간</label><input name="time" type="time" value="${p.time || ''}"></div>
    </div></div>
    <div class="field"><label>출고 방식</label>
      <div class="seg" id="f-method">
        ${['배차', '택배'].map((m) => `<button type="button" data-v="${m}" class="${(p.method || '배차') === m ? 'on' : ''}">${m}</button>`).join('')}
      </div></div>
    <div id="f-dispatch-block"${p.method === '택배' ? ' style="display:none"' : ''}>
      <button type="button" class="tgl" data-act="toggle-disp" id="f-disp-toggle">${hasDisp ? '− 배차 정보 접기' : '＋ 배차 정보 입력 (기사·차량·운임) · 선택'}</button>
      <div id="f-disp-fields" style="display:${hasDisp ? 'block' : 'none'};margin-top:12px">
        <div class="field"><label>배차 방법</label>
          <select name="dispatchVia">
            <option value="">배차 방법…</option>
            ${DISPATCH.map((d) => `<option ${p.dispatchVia === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select></div>
        <div class="field"><div class="row2">
          <div><label>기사님 이름</label><input name="driverName" placeholder="예: 주정택" value="${esc(p.driverName || '')}"></div>
          <div><label>기사님 전화</label><input name="driverPhone" type="tel" inputmode="tel" placeholder="010-0000-0000" value="${esc(p.driverPhone || '')}"></div>
        </div></div>
        <div class="field"><label>차량</label><input name="vehicle" placeholder="예: 1톤카고 / 경기85사7749" value="${esc(p.vehicle || '')}"></div>
        <div class="field"><div class="row2">
          <div><label>운임 (원)</label><input name="freight" type="number" inputmode="numeric" value="${p.freight || ''}" placeholder="예: 80000"></div>
          <div><label>결제</label><select name="payment"><option value="">-</option><option ${p.payment === '현불' ? 'selected' : ''}>현불</option><option ${p.payment === '착불' ? 'selected' : ''}>착불</option></select></div>
        </div></div>
      </div>
    </div>
    <div id="f-courier-block"${p.method === '택배' ? '' : ' style="display:none"'}>
      <div class="field"><label>택배사</label>
        <input name="courier" list="courier-list" value="${esc(p.courier || '')}" placeholder="예: 경동택배">
        <datalist id="courier-list">${COURIERS.map((c) => `<option value="${c}"></option>`).join('')}</datalist></div>
      <div class="field"><label>송장번호</label><input name="trackingNo" value="${esc(p.trackingNo || '')}" placeholder="예: 1234-5678-9012"></div>
      <div class="field"><label>택배비 (원)</label><input name="courierFee" type="number" inputmode="numeric" value="${p.courierFee || ''}" placeholder="예: 4000"></div>
      <div class="field"><div class="row2">
        <div><label>받는 사람</label><input name="recvName" value="${esc(p.recvName || '')}" placeholder="성함"></div>
        <div><label>연락처</label><input name="recvPhone" type="tel" inputmode="tel" value="${esc(p.recvPhone || '')}" placeholder="010-0000-0000"></div>
      </div></div>
      <div class="field"><label>받는 주소</label><input name="recvAddr" value="${esc(p.recvAddr || '')}" placeholder="배송지 주소"></div>
    </div>

    <div class="field"><label>비고</label><input name="note" placeholder="경로 / 혼적 / 당착 등" value="${esc(p.note || '')}"></div>
    <button class="btn" type="submit">저장하기</button>
    <button class="btn danger" type="button" data-act="close">취소</button>
  </form>`;
}

function fillItemSelect() {
  const wh = document.getElementById('f-wh').value;
  const sel = document.getElementById('f-item');
  const items = S.getItems().filter((it) => it.warehouse === wh);
  sel.innerHTML = items.map((it) => `<option value="${it.id}">${esc(it.name)} (${esc(it.category)})</option>`).join('')
    || '<option value="">품목 없음</option>';
  if (shipPrefill && shipPrefill.itemId && items.some((it) => it.id === shipPrefill.itemId)) {
    sel.value = shipPrefill.itemId;
  }
  updateStockHint();
}

function sheetInboundForm() {
  const defWH = state.stockWH || S.warehouseNames()[0];
  return `<div class="grab"></div><h2>입고 등록</h2>
  <form id="inbound-form">
    <div class="field"><label>창고</label>
      <select name="warehouse" id="ib-wh">${S.warehouseNames().map((w) => `<option ${defWH === w ? 'selected' : ''}>${esc(w)}</option>`).join('')}</select></div>
    <div class="field"><label>품목</label>
      <select name="itemId" id="ib-item"></select>
      <p class="hint" id="ib-stock" style="margin-top:8px"></p></div>
    <div class="field"><div class="row2">
      <div><label>입고 수량</label><input name="qty" id="ib-qty" type="number" min="1" inputmode="numeric" placeholder="0"></div>
      <div><label>단위</label><input name="unit" id="ib-unit" readonly></div>
    </div></div>
    <div class="field"><div class="row2">
      <div><label>박스당 개수</label><input name="perBox" type="number" inputmode="numeric" placeholder="예: 25"></div>
      <div><label>단가 (원)</label><input name="unitPrice" type="number" inputmode="numeric" placeholder="예: 2100"></div>
    </div></div>
    <div class="field"><label>단가 기준</label>
      <div class="seg" id="ib-vat">
        <button type="button" data-v="1" class="on">부가세 별도</button>
        <button type="button" data-v="0">부가세 포함</button>
      </div></div>
    <div class="field"><label>공급처</label><input name="supplier" placeholder="예: 원익"></div>
    <div class="field"><label>입고일</label><input name="date" type="date" value="${S.todayStr()}"></div>
    <div class="field"><label>비고</label><input name="note" placeholder="선택"></div>
    <button class="btn" type="submit">입고 저장 · 재고에 더하기</button>
    <button class="btn danger" type="button" data-act="close">취소</button>
  </form>`;
}
function fillInboundItems() {
  const wh = document.getElementById('ib-wh').value;
  const sel = document.getElementById('ib-item');
  const its = S.getItems().filter((it) => it.warehouse === wh);
  sel.innerHTML = its.map((it) => `<option value="${it.id}">${esc(it.name)} (${esc(it.category)})</option>`).join('')
    || '<option value="">품목 없음 · 먼저 품목 추가</option>';
  updateInboundHint();
}
function updateInboundHint() {
  const it = S.findItem(document.getElementById('ib-item').value);
  const hint = document.getElementById('ib-stock');
  const unit = document.getElementById('ib-unit');
  const pb = document.querySelector('#inbound-form [name=perBox]');
  if (it) {
    const sp = S.stockParts(it);
    hint.innerHTML = `현재고 <b style="color:var(--ink)">${sp.whole}${esc(it.unit)}${sp.loose ? ` ${sp.loose}개` : ''}</b>`;
    unit.value = it.unit;
    if (pb && !pb.value && it.perBox) pb.value = it.perBox;
  } else { hint.textContent = ''; unit.value = ''; }
}

function sheetQuick() {
  return `<div class="grab"></div><h2>${I.bolt} 빠른 출고</h2>
  <p class="hint">대표님 카톡 문구를 그대로 붙여넣고 <b>인식하기</b>를 누르면 출고 폼이 자동으로 채워집니다.</p>
  <div class="field"><textarea id="q-text" rows="3" placeholder="예: 원익 베이지 50박스 소분해서"></textarea></div>
  <button class="btn" type="button" data-act="q-parse">인식하기</button>
  <button class="btn danger" type="button" data-act="close">취소</button>`;
}
// 통합 스마트 붙여넣기 — 아무 문구나 넣으면 성격(출고·견적·배차) 판별 후 맞는 양식으로
function sheetSmart() {
  return `<div class="grab"></div><h2>${I.bolt} 붙여넣기 인식</h2>
  <p class="hint">카톡·문자 문구를 그대로 붙여넣으면 <b>출고요청 · 견적 · 배차</b> 중 성격을 판별해 맞는 양식으로 보내드려요.</p>
  <div class="field"><textarea id="sm-text" rows="4" placeholder="예) 다루끼 30단 명일 오전착으로 발주 가능할까요?"></textarea></div>
  <button class="btn" type="button" data-act="sm-parse">인식하기</button>
  <button class="btn danger" type="button" data-act="close">취소</button>`;
}
// 배차로 인식된 경우 — 어느 출고 건에 붙일지 선택
function sheetSmartDispatch(txt) {
  smartDispatchText = txt;
  const cands = S.getShipments().filter((s) => s.status === '출고예정' || s.status === '배차완료').slice(0, 15);
  return `<div class="grab"></div><h2>${I.bolt} 배차 안내로 인식됨</h2>
  <p class="hint">어느 출고 건에 이 배차 정보를 붙일까요?</p>
  <div class="rows">
    ${cands.length ? cands.map((s) => { const sm = shipSummary(s); return `<button class="row" data-act="sm-dispatch-pick" data-id="${s.id}">
      <div class="nm"><b>${esc(s.client || '거래처 미지정')}</b><span>${esc(s.date)} · ${esc(sm.itemLabel)} ${esc(sm.qtyLabel)}</span></div>
      <span class="pill ${STAGE_PILL[s.status]}">${STAGE_SHORT[s.status]}</span></button>`; }).join('')
    : '<div class="card" style="color:var(--muted);font-size:14px">붙일 출고예정 건이 없어요. 먼저 출고를 등록하세요.</div>'}
  </div>
  <button class="btn ghost" type="button" data-act="smart" style="margin-top:8px">← 다시 붙여넣기</button>
  <button class="btn danger" type="button" data-act="close">취소</button>`;
}
// 여러 품목 출고로 인식됨 — 확인 후 등록
function sheetSmartShip(d) {
  smartShipData = d;
  const inp = 'width:100%;padding:11px 12px;border-radius:10px;background:var(--surface-2);color:var(--ink);border:0;font-size:15px';
  return `<div class="grab"></div><h2>${I.bolt} 출고 인식됨 · ${d.lines.length}품목</h2>
  <p class="hint">품목마다 나가는 <b>창고</b>를 확인하세요. 창고가 다르면 자동으로 나눠서 등록됩니다.</p>
  <div>
    ${d.lines.map((l, i) => {
      const whs = [...new Set(S.getItems().filter((it) => it.name === l.name).map((it) => it.warehouse))];
      const opts = whs.length ? whs : S.warehouseNames();
      return `<div style="background:var(--surface-2);border-radius:12px;padding:10px 12px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:9px">
          ${swatchHTML(l.name)}
          <b style="flex:1;min-width:0">${esc(l.name)}</b>
          <b>${l.qty}</b><span style="color:var(--muted);font-size:13px">${esc(l.unit)}</span>
        </div>
        <select data-ss-wh="${i}" style="width:100%;margin-top:8px;padding:9px 11px;border-radius:9px;background:var(--surface);border:0;color:var(--ink);font-size:14px">
          ${opts.map((w) => `<option ${w === l.warehouse ? 'selected' : ''}>${esc(w)}</option>`).join('')}
        </select>
      </div>`;
    }).join('')}
  </div>
  <div class="field" style="margin-top:12px"><label>거래처 (하차지)</label>
    <input id="ss-client" list="ship-partners" value="${esc(d.client || '')}" placeholder="거래처 검색·선택" autocomplete="off" style="${inp}">
    <datalist id="ship-partners">${S.getPartners().map((pt) => `<option value="${esc(pt.name)}"></option>`).join('')}</datalist></div>
  <div class="field"><label>상태</label><select id="ss-status" style="${inp}">${['출고예정', '출고완료'].map((s) => `<option ${s === d.status ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
  <button class="btn" type="button" data-act="ss-save">출고 등록</button>
  <button class="btn ghost" type="button" data-act="smart" style="margin-top:8px">← 다시 붙여넣기</button>
  <button class="btn danger" type="button" data-act="close">취소</button>`;
}
function updateStockHint() {
  const id = document.getElementById('f-item').value;
  const it = S.findItem(id);
  const hint = document.getElementById('f-stock');
  const unitSel = document.getElementById('f-unit');
  if (it) {
    const sp = S.stockParts(it);
    hint.innerHTML = `현재고 <b style="color:var(--ink)">${sp.whole}${esc(it.unit)}${sp.loose ? ` ${sp.loose}개` : ''}</b>${it.perBox ? ` · ${it.perBox}개입` : ''}`;
    const opts = [it.unit];
    if (Number(it.perBox) > 0 && it.unit !== '낱개') opts.push('낱개');
    const prev = (shipPrefill && shipPrefill.unit) || unitSel.value;
    unitSel.innerHTML = opts.map((u) => `<option ${prev === u ? 'selected' : ''}>${esc(u)}</option>`).join('');
  } else { hint.textContent = ''; unitSel.innerHTML = ''; }
}

function sheetItemForm(existing) {
  const whs = S.warehouseNames();
  const it = existing || { warehouse: state.stockWH || whs[0], category: '실리콘', name: '', unit: '박스', initial: 0, note: '' };
  return `<div class="grab"></div><h2>${existing ? '품목 수정' : '품목 추가'}</h2>
  <form id="item-form" data-id="${existing ? existing.id : ''}">
    <div class="field"><label>창고</label>
      <div class="seg wrap" data-seg="warehouse">${whs.map((w) => `<button type="button" data-v="${esc(w)}" class="${it.warehouse === w ? 'on' : ''}">${esc(w)}</button>`).join('')}</div></div>
    <div class="field"><label>구분</label>
      <div class="seg" data-seg="category">${CATEGORIES.map((c) => `<button type="button" data-v="${c}" class="${it.category === c ? 'on' : ''}">${c}</button>`).join('')}</div></div>
    <div class="field"><label>품목명 (색상 또는 규격)</label><input name="name" value="${esc(it.name)}" placeholder="예: 베이지 / 2*6*12"></div>
    <div class="field"><label>별칭 <span style="color:var(--faint);font-weight:400">이렇게도 불러요 · 쉼표로 구분 (붙여넣기 자동인식)</span></label><input name="aliases" value="${esc(it.aliases || '')}" placeholder="예: 다루끼, 다루끼목, 30각" autocapitalize="none"></div>
    <div class="field"><div class="row2">
      <div><label>${existing ? '현재 재고 (실사 수정)' : '초기 재고'}</label><input name="stock" type="number" inputmode="decimal" value="${existing ? S.currentStock(it) : (it.initial || 0)}"></div>
      <div><label>단위</label><select name="unit">${UNITS.map((u) => `<option ${it.unit === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
    </div></div>
    <div class="field"><div class="row2">
      <div><label>박스당 개수</label><input name="perBox" type="number" inputmode="numeric" value="${it.perBox || ''}" placeholder="예: 25"></div>
      <div><label>최근 단가 (원)</label><input name="unitPrice" type="number" inputmode="numeric" value="${it.unitPrice || ''}" placeholder="예: 2100"></div>
    </div></div>
    <div class="field"><label>공급처</label><input name="supplier" value="${esc(it.supplier || '')}" placeholder="예: 원익"></div>
    <div class="field"><label>비고</label><input name="note" value="${esc(it.note || '')}" placeholder="선택"></div>
    <button class="btn" type="submit">저장</button>
    ${existing ? `<button class="btn danger" type="button" data-act="del-item" data-id="${existing.id}">이 품목 삭제</button>` : `<button class="btn danger" type="button" data-act="close">취소</button>`}
  </form>`;
}

function sheetWarehouseForm(name) {
  const w = name ? S.getWarehouses().find((x) => x.name === name) : null;
  const cur = w ? w.icon : 'warehouse';
  const hasItems = w ? S.warehouseSummary(w.name).itemCount > 0 : false;
  return `<div class="grab"></div><h2>${w ? '창고 설정' : '창고 추가'}</h2>
  <form id="wh-form" data-orig="${w ? esc(w.name) : ''}">
    <div class="field"><label>창고 이름</label><input name="name" value="${w ? esc(w.name) : ''}" placeholder="예: 부산창고"></div>
    <div class="field"><label>주소 <span style="color:var(--faint);font-weight:400">(배차 상차지)</span></label><input name="address" value="${w ? esc(w.address || '') : ''}" placeholder="예: 충청남도 천안시 …"></div>
    <div class="field"><label>연락처</label><input name="phone" type="tel" value="${w ? esc(w.phone || '') : ''}" placeholder="010-0000-0000"></div>
    <div class="field"><label>아이콘</label>
      <div class="iconpick" id="wh-icons">
        ${WH_ICON_KEYS.map((k) => `<button type="button" data-act="wh-icon" data-v="${k}" class="${cur === k ? 'on' : ''}">${whIcon(k)}</button>`).join('')}
      </div></div>
    <button class="btn" type="submit">저장</button>
    ${w ? `<button class="btn danger" type="button" data-act="del-wh" data-w="${esc(w.name)}" ${hasItems ? 'disabled' : ''}>${hasItems ? '품목이 있어 삭제 불가' : '이 창고 삭제'}</button>`
        : `<button class="btn danger" type="button" data-act="close">취소</button>`}
  </form>`;
}

function sheetPartnerForm(name) {
  const p = name ? S.findPartner(name) : null;
  return `<div class="grab"></div><h2>${p ? '거래처 설정' : '거래처 추가'}</h2>
  <form id="partner-form" data-orig="${p ? esc(p.name) : ''}">
    <div class="field"><label>거래처명</label><input name="name" value="${p ? esc(p.name) : ''}" placeholder="예: 원익"></div>
    <div class="field"><label>하차지 주소</label><input name="address" value="${p ? esc(p.address || '') : ''}" placeholder="예: 경기도 화성시 …"></div>
    <div class="field"><label>연락처</label><input name="phone" type="tel" value="${p ? esc(p.phone || '') : ''}" placeholder="010-0000-0000"></div>
    <div class="field"><label>유의사항</label><input name="note" value="${p ? esc(p.note || '') : ''}" placeholder="예: 지게차 없음 / 오전만 하차"></div>
    <button class="btn" type="submit">저장</button>
    ${p ? `<button class="btn danger" type="button" data-act="del-partner" data-w="${esc(p.name)}">이 거래처 삭제</button>`
        : `<button class="btn danger" type="button" data-act="close">취소</button>`}
  </form>`;
}

// 상/하차지 선택용 장소 목록 = 창고 + 거래처
function getPlaces() {
  return [
    ...S.getWarehouses().map((w) => ({ name: w.name, address: w.address || '', phone: w.phone || '' })),
    ...S.getPartners().map((p) => ({ name: p.name, address: p.address || '', phone: p.phone || '' })),
  ];
}

function sheetPostSave(id) {
  return `<div class="grab"></div>
  <div style="text-align:center;padding:4px 0 2px">
    <div class="okmark">${I.check}</div>
    <h2 style="justify-content:center;margin-bottom:4px">출고 요청 저장 완료</h2>
    <p class="hint" style="text-align:center">재고에 <b>예정</b>으로 반영됐어요.</p>
  </div>
  <button class="btn" type="button" data-act="copy-dispatch" data-id="${id}">바로 배차 요청하기</button>
  <button class="btn ghost" type="button" data-act="close">나중에</button>`;
}

function sheetDispatchBuilder(shipId) {
  const sh = shipId ? S.getShipments().find((s) => s.id === shipId) : null;
  const places = getPlaces();
  const opts = (sel) => places.map((p) => `<option ${sel === p.name ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  const pay = sh ? sh.payment : '';
  const goods = sh && sh.name ? `${sh.category === '실리콘' ? '실리콘 ' : ''}${sh.name}` : '목재';
  const fromName = sh && sh.warehouse;
  const toName = sh && sh.client;
  const fromAddr = (places.find((p) => p.name === fromName) || {}).address || '';
  const toAddr = (places.find((p) => p.name === toName) || {}).address || '';
  return `<div class="grab"></div><h2>배차 요청 양식</h2>
  <p class="hint" style="margin-top:-4px"><b style="color:#e05a52">빨간 칸</b>만 채우면 돼요 (나머지는 출고에서 자동 입력)</p>
  <div class="field"><label>상차지</label><select id="db-from">${opts(fromName)}</select>
    <div class="addr-row"><input id="db-from-addr" placeholder="상차지 주소 (확인·수정)" value="${esc(fromAddr)}"><button type="button" data-act="db-search" data-t="from">주소검색</button></div></div>
  <div class="field"><label>하차지</label><select id="db-to">${opts(toName)}</select>
    <div class="addr-row"><input id="db-to-addr" placeholder="하차지 주소 (확인·수정)" value="${esc(toAddr)}"><button type="button" data-act="db-search" data-t="to">주소검색</button></div></div>
  <div class="field"><label>하차지 거래처명 <span style="color:var(--faint);font-weight:400">물류업체에 보낼 때</span></label>
    <div class="seg" id="db-cust">
      <button type="button" data-v="real" class="on">실제 이름</button>
      <button type="button" data-v="hide">홈트레이더스로 숨김</button>
    </div></div>
  <div class="field"><label>물품</label><input id="db-goods" value="${esc(goods)}" placeholder="예: 목재 8PT"></div>
  <div class="field"><div class="row2">
    <div><label>중량</label><input id="db-weight" class="need" placeholder="예: 5톤"></div>
    <div><label style="visibility:hidden">.</label><button type="button" class="tgl" data-act="db-toggle" id="db-max">중량 최대로</button></div>
  </div></div>
  <div class="field"><label>차량 <span style="color:var(--faint);font-weight:400">(선택)</span></label><input id="db-vehicle" value="${esc(sh ? sh.vehicle || '' : '')}" placeholder="예: 5톤축"></div>
  <div class="field"><label>결제</label>
    <div class="seg ${pay ? '' : 'need'}" id="db-pay">
      <button type="button" data-v="현불" class="${pay === '현불' ? 'on' : ''}">현불</button>
      <button type="button" data-v="착불" class="${pay === '착불' ? 'on' : ''}">착불</button>
    </div></div>
  <div class="field"><label>일정</label>
    <input id="db-sched" class="need" placeholder="예: 오늘 오후 상차 · 내일 오전 7시 착">
    <button type="button" class="btn ghost" data-act="db-sched-fill" style="margin-top:8px;padding:10px">오늘 오후 상차 · 내일 오전 착 자동입력</button></div>
  <button type="button" class="tgl" data-act="db-toggle" id="db-urgent" style="width:100%;margin-bottom:12px">긴급 · 바로 상하차</button>
  <button class="btn" type="button" data-act="db-generate" data-id="${shipId || ''}">배차 양식 만들어 복사</button>
  <button class="btn danger" type="button" data-act="close">취소</button>`;
}

// (구) 배차 양식 텍스트 — 지금은 빌더 사용
function dispatchText(sh) {
  const w = S.getWarehouses().find((x) => x.name === sh.warehouse) || {};
  const p = S.findPartner(sh.client) || {};
  const L = [];
  L.push('[배차 요청]');
  L.push('');
  L.push(`상차지: ${sh.warehouse}`);
  L.push(`　주소: ${w.address || '(미등록)'}`);
  L.push(`　연락처: ${w.phone || '(미등록)'}`);
  L.push('');
  L.push(`하차지: ${sh.client || '(미지정)'}`);
  L.push(`　주소: ${p.address || '(주소 미등록 — 거래처에 등록하세요)'}`);
  L.push(`　연락처: ${p.phone || '(미등록)'}`);
  L.push('');
  L.push(`품목: ${sh.category ? sh.category + ' ' : ''}${sh.name || ''} ${sh.qty}${sh.unit}`);
  if (sh.vehicle) L.push(`차량: ${sh.vehicle}`);
  const notes = [sh.note, p.note].filter(Boolean).join(' / ');
  if (notes) L.push(`유의사항: ${notes}`);
  return L.join('\n');
}

function sheetDoc(sh) {
  const hasDispatch = sh.dispatchVia || sh.driverName || sh.driverPhone || sh.vehicle || sh.freight || sh.payment;
  const hasAddr = sh.loadAddr || sh.unloadAddr || sh.loadPlace || sh.unloadPlace;
  const isCourier = sh.method === '택배';
  return `<div class="grab"></div><h2>출고 상세</h2>
  ${shipStepper(sh)}
  <p class="hint" style="text-align:center;margin-top:-8px">단계를 눌러 상태 변경</p>
  <div class="doc">
    <h3>${esc(sh.client || '거래처 미지정')}</h3>
    <div class="docsub">출고일 ${esc(sh.date)} · ${esc(sh.warehouse)}${isCourier ? ' · 택배' : ''}</div>
    ${(state.docEditLines && slId === sh.id) ? shipLinesEditor(sh) : `
    <table>
      <tr><th>품목</th><th class="n">수량</th><th class="n">단가</th><th class="n">금액</th></tr>
      ${S.shipLines(sh).map((l) => { const amt = (Number(l.qty) || 0) * (Number(l.unitPrice) || 0); return `<tr>
        <td>${esc(l.name || '(미지정)')}${l.spec ? `<br><span style="color:var(--muted);font-size:12px">${esc(l.spec)}</span>` : ''}</td>
        <td class="n">${l.qty} ${esc(l.unit)}</td>
        <td class="n">${Number(l.unitPrice) > 0 ? Number(l.unitPrice).toLocaleString() : '-'}</td>
        <td class="n">${amt > 0 ? amt.toLocaleString() : '-'}</td>
      </tr>`; }).join('')}
    </table>
    <button class="btn ghost" type="button" data-act="doc-edit-lines" data-id="${sh.id}" style="margin-top:10px;font-size:13px;padding:9px">수량 · 품목 · 단가 수정</button>`}
    ${hasAddr ? `<div class="docblock">
      <div class="kv"><span>상차지</span><b>${esc(sh.loadPlace || sh.warehouse || '-')}</b></div>
      ${sh.loadAddr ? `<div style="text-align:right;font-size:12px;color:var(--muted);margin:-4px 0 8px">${esc(sh.loadAddr)}</div>` : ''}
      <div class="kv"><span>하차지</span><b>${esc(sh.unloadPlace || sh.client || '-')}</b></div>
      ${sh.unloadAddr ? `<div style="text-align:right;font-size:12px;color:var(--muted);margin:-4px 0 2px">${esc(sh.unloadAddr)}</div>` : ''}
    </div>` : ''}
    ${hasDispatch ? `<div class="docblock">
      <div class="kv"><span>배차</span><b>${esc(sh.dispatchVia || '-')}</b></div>
      ${sh.driverName ? `<div class="kv"><span>기사님</span><b>${esc(sh.driverName)}</b></div>` : ''}
      ${sh.driverPhone ? `<div class="kv"><span>연락처</span><a class="tel" href="${telHref(sh.driverPhone)}">${esc(sh.driverPhone)}</a></div>` : ''}
      ${sh.vehicle ? `<div class="kv"><span>차량</span><b>${esc(sh.vehicle)}</b></div>` : ''}
      ${sh.freight ? `<div class="kv"><span>운임</span><b>${Number(sh.freight).toLocaleString()}원${sh.payment ? ` · ${esc(sh.payment)}` : ''}</b></div>`
        : (sh.payment ? `<div class="kv"><span>결제</span><b>${esc(sh.payment)}</b></div>` : '')}
    </div>` : ''}
    ${isCourier ? `<div class="docblock">
      <div class="kv"><span>택배사</span><b>${esc(sh.courier || '-')}</b></div>
      ${sh.trackingNo ? `<div class="kv"><span>송장번호</span><b>${esc(sh.trackingNo)}</b></div>` : ''}
      ${sh.courierFee ? `<div class="kv"><span>택배비</span><b>${Number(sh.courierFee).toLocaleString()}원</b></div>` : ''}
      ${sh.recvName ? `<div class="kv"><span>받는 사람</span><b>${esc(sh.recvName)}${sh.recvPhone ? ` · ${esc(sh.recvPhone)}` : ''}</b></div>` : ''}
      ${sh.recvAddr ? `<div class="kv"><span>주소</span><b>${esc(sh.recvAddr)}</b></div>` : ''}
    </div>` : ''}
    ${sh.note ? `<div class="kv" style="margin-top:10px"><span>비고</span><b>${esc(sh.note)}</b></div>` : ''}
    ${(() => {
      const supply = S.shipLines(sh).reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);
      if (supply <= 0) return `<div class="kv"><span>공급가액</span><b style="color:var(--muted)">단가 입력 시 자동계산</b></div>`;
      const vat = Math.round(supply * 0.1);
      return `<div class="docblock" style="margin-top:10px">
        <div class="kv"><span>공급가액</span><b>${supply.toLocaleString()}원</b></div>
        <div class="kv"><span>부가세 (10%)</span><b>${vat.toLocaleString()}원</b></div>
        <div class="kv" style="border-top:1px solid var(--surface-3);padding-top:8px;margin-top:4px"><span>합계</span><b>${(supply + vat).toLocaleString()}원</b></div>
      </div>`;
    })()}
    <div class="kv" style="margin-top:10px"><span>명세서</span><span class="pill ${sh.docDone ? 'done' : 'low'}">${sh.docDone ? '발행완료' : '미발행'}</span></div>
  </div>
  ${sh.status === '출고예정' && !isCourier ? `<button class="btn" type="button" data-act="copy-dispatch" data-id="${sh.id}">배차 요청 양식 만들기</button>
    <button class="btn ghost" type="button" data-act="dispatch-paste" data-id="${sh.id}" style="margin-top:8px">배차 확인 붙여넣기 (회신 받으면)</button>` : ''}
  ${sh.status === '배차완료' && !isCourier ? `<button class="btn ghost" type="button" data-act="dispatch-paste" data-id="${sh.id}">배차 정보 다시 붙여넣기</button>` : ''}
  ${sh.status === '출고완료' ? `<button class="btn ${sh.docDone ? 'ghost' : ''}" type="button" data-act="toggle-doc" data-id="${sh.id}">${sh.docDone ? '명세서 발행됨 · 해제' : '명세서 발행 완료로 표시'}</button>` : ''}
  <button class="btn ghost" type="button" data-act="edit-ship" data-id="${sh.id}" style="margin-top:8px">출고 수정 (거래처 · 배차 · 상태)</button>
  <button class="btn danger" type="button" data-act="del-ship" data-id="${sh.id}">삭제</button>`;
}

// 출고 품목 줄 편집 — 멀티라인 출고에서 줄 추가/삭제/수량변경 (예: 재고없는 품목 한 줄만 빼기)
function shipWh() { const sh = S.getShipments().find((s) => s.id === slId); return sh ? sh.warehouse : ''; }
function readShipLinesDom() {   // 재렌더 전 현재 입력값을 임시배열에 반영 (입력 유실 방지)
  const wh = shipWh();
  document.querySelectorAll('[data-sl]').forEach((el) => {
    const i = Number(el.dataset.i); if (!slLines[i]) return;
    const k = el.dataset.sl;
    if (k === 'qty') slLines[i].qty = el.value;
    else if (k === 'spec') slLines[i].spec = el.value;
    else if (k === 'unit') slLines[i].unit = el.value.trim();
    else if (k === 'unitPrice') slLines[i].unitPrice = Number(el.value) || 0;
    else if (k === 'name') {
      slLines[i].name = el.value.trim();
      const it = S.getItems().find((x) => x.name === slLines[i].name && x.warehouse === wh);
      if (it) slLines[i].category = it.category;   // 기존 품목과 일치하면 재고 매칭용 구분 반영
    }
  });
}
// 출고 상세 안에서 바로 품목 표를 인라인 편집 (품명·규격·수량·단위, 직접입력 가능 · ERP 동일 구조)
function shipLinesEditor(sh) {
  const names = [...new Set(S.getItems().filter((it) => it.warehouse === sh.warehouse).map((it) => it.name))];
  const dl = `<datalist id="sl-items">${names.map((n) => `<option value="${esc(n)}"></option>`).join('')}</datalist>`;
  const inp = 'padding:9px 10px;border-radius:9px;background:var(--surface);border:0;color:var(--ink);font-size:15px';
  return `${dl}<div class="rows" style="margin-top:2px">
    ${slLines.map((l, i) => `<div style="background:var(--surface-2);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px">
      <div style="display:flex;gap:8px;align-items:center">
        <input data-sl="name" data-i="${i}" list="sl-items" value="${esc(l.name || '')}" placeholder="품명 (직접 입력 가능)" autocapitalize="none" style="flex:1;min-width:0;${inp}">
        <button class="pill" type="button" data-act="sl-del" data-i="${i}" style="min-width:34px">✕</button>
      </div>
      <div style="display:flex;gap:8px">
        <input data-sl="spec" data-i="${i}" value="${esc(l.spec || '')}" placeholder="규격" style="flex:1;min-width:0;${inp}">
        <input data-sl="unit" data-i="${i}" value="${esc(l.unit || '')}" placeholder="단위" style="width:64px;${inp}">
      </div>
      <div style="display:flex;gap:8px">
        <input data-sl="qty" data-i="${i}" type="number" min="0" inputmode="decimal" value="${l.qty}" placeholder="수량" style="flex:1;min-width:0;text-align:right;${inp}">
        <input data-sl="unitPrice" data-i="${i}" type="number" min="0" inputmode="numeric" value="${l.unitPrice || ''}" placeholder="단가" style="flex:1;min-width:0;text-align:right;${inp}">
      </div>
    </div>`).join('')}
  </div>
  <button class="btn ghost" type="button" data-act="sl-add" style="margin-top:8px">+ 품목 추가</button>
  <div style="display:flex;gap:8px;margin-top:10px">
    <button class="btn" type="button" data-act="sl-save" data-id="${sh.id}" style="flex:1">저장</button>
    <button class="btn ghost" type="button" data-act="sl-cancel" data-id="${sh.id}" style="flex:1">취소</button>
  </div>`;
}

function sheetDispatchPaste(id) {
  return `<div class="grab"></div><h2>${I.bolt} 배차 확인 붙여넣기</h2>
  <p class="hint">물류업체가 보낸 배차 안내 문구를 붙여넣으면 <b>기사·차량·운임·결제·경로</b>가 자동 입력되고 <b>배차완료</b>로 바뀝니다.</p>
  <div class="field"><textarea id="dp-text" rows="5" placeholder="예)&#10;배차안내드립니다&#10;경광주곤지암-아산송악면 혼적 운임 8만원/현불&#10;1톤카고 경기85사7749&#10;김익태님 010-6416-6758"></textarea></div>
  <button class="btn" type="button" data-act="dp-apply" data-id="${id}">인식해서 배차완료</button>
  <button class="btn danger" type="button" data-act="close">취소</button>`;
}

function sheetEditShip(sh) {
  return `<div class="grab"></div><h2>출고 수정</h2>
  <form id="editship-form" data-id="${sh.id}">
    <div class="field"><label>품목 (창고 · 품목)</label>
      <select name="itemPick">${S.getItems().map((it) => `<option value="${it.id}" ${(it.name === sh.name && it.warehouse === sh.warehouse && it.category === sh.category) ? 'selected' : ''}>${esc(it.warehouse)} · ${esc(it.name)}</option>`).join('')}</select></div>
    <div class="field"><label>상태</label>
      <div class="seg" id="e-status">
        ${STAGES.map((s) => `<button type="button" data-v="${s}" class="${sh.status === s ? 'on' : ''}">${STAGE_SHORT[s]}</button>`).join('')}
      </div></div>
    <div class="field"><div class="row2">
      <div><label>수량</label><input name="qty" type="number" min="0" value="${sh.qty}"></div>
      <div><label>출고일</label><input name="date" type="date" value="${esc(sh.date)}"></div>
    </div></div>
    <div class="field"><label>거래처</label><input name="client" value="${esc(sh.client)}"></div>
    <div class="field"><label>출고 방식</label>
      <div class="seg" id="e-method">
        ${['배차', '택배'].map((m) => `<button type="button" data-v="${m}" class="${(sh.method || '배차') === m ? 'on' : ''}">${m}</button>`).join('')}
      </div></div>
    <div id="e-dispatch-block"${sh.method === '택배' ? ' style="display:none"' : ''}>
      <div class="field"><label>배차 방법</label>
        <select name="dispatchVia"><option value="">배차 방법…</option>
          ${DISPATCH.map((d) => `<option ${sh.dispatchVia === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
      <div class="field"><div class="row2">
        <div><label>기사님 이름</label><input name="driverName" value="${esc(sh.driverName || '')}" placeholder="예: 주정택"></div>
        <div><label>기사님 전화</label><input name="driverPhone" type="tel" value="${esc(sh.driverPhone || '')}" placeholder="010-0000-0000"></div>
      </div></div>
      <div class="field"><label>차량</label><input name="vehicle" value="${esc(sh.vehicle || '')}" placeholder="예: 1톤카고 / 경기85사7749"></div>
      <div class="field"><div class="row2">
        <div><label>운임 (원)</label><input name="freight" type="number" inputmode="numeric" value="${sh.freight || ''}"></div>
        <div><label>결제</label><select name="payment"><option value="">-</option><option ${sh.payment === '현불' ? 'selected' : ''}>현불</option><option ${sh.payment === '착불' ? 'selected' : ''}>착불</option></select></div>
      </div></div>
    </div>
    <div id="e-courier-block"${sh.method === '택배' ? '' : ' style="display:none"'}>
      <div class="field"><label>택배사</label>
        <input name="courier" list="courier-list-e" value="${esc(sh.courier || '')}" placeholder="예: 경동택배">
        <datalist id="courier-list-e">${COURIERS.map((c) => `<option value="${c}"></option>`).join('')}</datalist></div>
      <div class="field"><label>송장번호</label><input name="trackingNo" value="${esc(sh.trackingNo || '')}" placeholder="예: 1234-5678-9012"></div>
      <div class="field"><label>택배비 (원)</label><input name="courierFee" type="number" inputmode="numeric" value="${sh.courierFee || ''}"></div>
      <div class="field"><div class="row2">
        <div><label>받는 사람</label><input name="recvName" value="${esc(sh.recvName || '')}" placeholder="성함"></div>
        <div><label>연락처</label><input name="recvPhone" type="tel" value="${esc(sh.recvPhone || '')}" placeholder="010-0000-0000"></div>
      </div></div>
      <div class="field"><label>받는 주소</label><input name="recvAddr" value="${esc(sh.recvAddr || '')}" placeholder="배송지 주소"></div>
    </div>
    <div class="field"><label>비고</label><input name="note" value="${esc(sh.note)}"></div>
    <button class="btn" type="submit">저장</button>
    <button class="btn danger" type="button" data-act="close">취소</button>
  </form>`;
}

// ── 렌더 ──────────────────────────────────────────────
const TITLES = { home: ['홈트레이더스', '재고 · 출고 관리'], quote: ['견적', '견적 요청 관리'], silicone: ['실리콘', '색상별 재고'], stock: ['창고', '창고별 재고'], ship: ['출고', '등록하면 재고 자동 차감'], price: ['단가표', '품목별 단가 마스터'], settings: ['설정', '품목 · 데이터'] };

function render() {
  const [title, sub] = TITLES[state.route];
  const body = { home: screenHome, quote: screenQuote, silicone: screenSilicone, stock: screenStock, ship: screenShip, price: screenPrice, settings: screenSettings }[state.route]();
  const showFab = state.route === 'ship' || state.route === 'home';
  app.innerHTML = `
    <div class="appbar"><span class="logo">H</span><h1>${title}</h1><span class="sub">${sub}</span></div>
    ${body}
    ${showFab ? `<button class="fab fab2" data-act="smart">${I.bolt} 붙여넣기 인식</button>
    <button class="fab" data-act="new-ship">${I.plus} 출고 등록</button>` : ''}
    <nav class="nav">
      ${[['home', '홈', I.home], ['quote', '견적', I.doc], ['silicone', '실리콘', I.drop], ['stock', '창고', WH_ICONS.warehouse], ['ship', '출고', I.truck], ['price', '단가', I.tag], ['settings', '설정', I.cog]]
        .map(([r, l, ic]) => `<button data-act="nav" data-r="${r}" class="${state.route === r ? 'on' : ''}">${ic}<span>${l}</span></button>`).join('')}
    </nav>
    ${state.sheet ? `<div class="sheet-bg" data-act="backdrop"><div class="sheet"><button class="sheet-x" type="button" data-act="close" aria-label="닫기">✕</button>${state.sheet}</div></div>` : ''}
  `;
  if (state.sheet && document.getElementById('f-wh')) { fillItemSelect(); }
  if (state.sheet && document.getElementById('ib-wh')) { fillInboundItems(); }
}

// ── 이벤트 ────────────────────────────────────────────
function openSheet(html) { state.sheet = html; render(); }
function closeSheet() { state.sheet = null; state.docEditLines = false; render(); }

app.addEventListener('click', (e) => {
  // 세그먼트 / 아이콘 선택 토글 (data-act 없는 버튼도 동작하도록 최상단에서 처리)
  const segBtn = e.target.closest('.seg button, .iconpick button');
  if (segBtn && segBtn.dataset.act == null) {
    segBtn.parentElement.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
    segBtn.classList.add('on');
    segBtn.parentElement.classList.remove('need');
    if (segBtn.parentElement.id === 'f-method' || segBtn.parentElement.id === 'e-method') {   // 출고 방식 → 배차/택배 칸 전환
      const pfx = segBtn.parentElement.id[0];      // 'f' 또는 'e'
      const courier = segBtn.dataset.v === '택배';
      const db = document.getElementById(pfx + '-dispatch-block'); const cb = document.getElementById(pfx + '-courier-block');
      if (db) db.style.display = courier ? 'none' : '';
      if (cb) cb.style.display = courier ? '' : 'none';
    }
    return;
  }
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const act = t.dataset.act;

  if (act === 'nav') { state.route = t.dataset.r; state.sheet = null; if (t.dataset.r === 'stock') state.stockWH = null; render(); }
  else if (act === 'wh') { state.route = 'stock'; state.stockWH = t.dataset.w; render(); }
  else if (act === 'tilego') {
    const [r, f] = t.dataset.v.split(':');
    if (r === 'ship') { state.route = 'ship'; state.shipView = 'list'; state.shipFilter = f || '전체'; render(); }
    else if (r === 'quote') { state.route = 'quote'; render(); }
  }
  else if (act === 'quote-filter') { state.quoteFilter = t.dataset.v; render(); }
  else if (act === 'add-quote') { quotePrefill = null; openSheet(sheetQuoteForm(null)); }
  else if (act === 'smart') { openSheet(sheetSmart()); }
  else if (act === 'toggle-disp') {
    const el = document.getElementById('f-disp-fields');
    if (el) { const show = el.style.display === 'none'; el.style.display = show ? 'block' : 'none';
      t.textContent = show ? '− 배차 정보 접기' : '＋ 배차 정보 입력 (기사·차량·운임) · 선택'; }
  }
  else if (act === 'sm-parse') {
    const txt = document.getElementById('sm-text').value;
    if (!txt.trim()) return alert('문구를 붙여넣으세요.');
    const type = classifyPaste(txt);
    if (type === '견적') { quotePrefill = parseQuoteText(txt); state.route = 'quote'; openSheet(sheetQuoteForm(null)); }
    else if (type === '배차') { openSheet(sheetSmartDispatch(txt)); }
    else {
      const multi = parseMultiLines(txt);
      if (multi.lines.length >= 2) { state.route = 'ship'; openSheet(sheetSmartShip(multi)); }
      else { shipPrefill = parseQuick(txt); state.route = 'ship'; openSheet(sheetShipForm()); }
    }
  }
  else if (act === 'ss-save') {
    const d = smartShipData; if (!d) return;
    const client = document.getElementById('ss-client').value.trim();
    const status = document.getElementById('ss-status').value;
    d.lines.forEach((l, i) => { const sel = document.querySelector(`[data-ss-wh="${i}"]`); if (sel) l.warehouse = sel.value; });
    const byWh = {};
    d.lines.forEach((l) => { (byWh[l.warehouse] = byWh[l.warehouse] || []).push(l); });
    const whList = Object.keys(byWh);
    let first = null;
    whList.forEach((wh) => {
      const lines = byWh[wh].map((l) => ({ name: l.name, category: l.category, spec: '', unit: l.unit, qty: l.qty, unitPrice: l.unitPrice }));
      const sh = S.addShipment({ date: S.todayStr(), warehouse: wh, client, status, lines });
      if (!first) first = sh;
    });
    state.route = 'ship';
    if (whList.length > 1) { state.shipView = 'list'; closeSheet(); alert(`창고가 달라 ${whList.length}건으로 나눠 등록했어요.\n(${whList.join(', ')})`); }
    else if (first) openSheet(sheetDoc(S.getShipments().find((s) => s.id === first.id)));
    else closeSheet();
  }
  else if (act === 'sm-dispatch-pick') {
    const sh = S.getShipments().find((s) => s.id === t.dataset.id);
    const d = parseDispatch(smartDispatchText);
    S.updateShipment(t.dataset.id, { status: '배차완료', dispatchVia: sh.dispatchVia || '이음물류',
      driverName: d.driverName || sh.driverName, driverPhone: d.driverPhone || sh.driverPhone,
      vehicle: d.vehicle || sh.vehicle, freight: d.freight || sh.freight, payment: d.payment || sh.payment,
      note: [sh.note, d.note].filter(Boolean).join(' / ') });
    openSheet(sheetDoc(S.getShipments().find((s) => s.id === t.dataset.id)));
  }
  else if (act === 'quote-open') { openSheet(sheetQuote(t.dataset.id)); }
  else if (act === 'quote-edit') { openSheet(sheetQuoteForm(t.dataset.id)); }
  else if (act === 'del-quote') { if (confirm('이 견적요청을 삭제할까요?')) { S.deleteQuote(t.dataset.id); closeSheet(); } }
  else if (act === 'quote-call') {
    S.logQuoteCall(t.dataset.id);
    if (state.sheet) openSheet(sheetQuote(t.dataset.id)); else render();
  }
  else if (act === 'quote-status') { S.updateQuote(t.dataset.id, { status: t.dataset.v }); openSheet(sheetQuote(t.dataset.id)); }
  else if (act === 'quote-lines') {
    const q = S.getQuotes().find((x) => x.id === t.dataset.id);
    qEditId = t.dataset.id;
    qLines = (q.lines && q.lines.length ? q.lines.map((l) => ({ ...l })) : [{ name: (S.getItems()[0] || {}).name || '', qty: '', unitPrice: (S.getItems()[0] || {}).unitPrice || '' }]);
    openSheet(sheetQuoteLines(qEditId));
  }
  else if (act === 'ql-add') {
    const it = S.getItems()[0] || {};
    qLines.push({ name: it.name || '', qty: '', unitPrice: it.unitPrice || '' });
    openSheet(sheetQuoteLines(qEditId));
  }
  else if (act === 'ql-del') { qLines.splice(Number(t.dataset.i), 1); openSheet(sheetQuoteLines(qEditId)); }
  else if (act === 'ql-save') {
    S.updateQuote(t.dataset.id, { lines: qLines.filter((l) => l.name && Number(l.qty) > 0) });
    openSheet(sheetQuote(t.dataset.id));
  }
  else if (act === 'quote-to-ship') {
    const q = S.getQuotes().find((x) => x.id === t.dataset.id);
    const lines = (q.lines || []).map((l) => ({ name: l.name, spec: l.spec || '', unit: l.unit || 'ea', qty: l.qty, unitPrice: l.unitPrice }));
    if (!lines.length) return alert('견적 품목을 먼저 작성하세요.');
    const sh = S.addShipment({ date: S.todayStr(), warehouse: S.warehouseNames()[0], client: q.client, status: '출고예정', lines });
    state.route = 'ship';
    openSheet(sheetPostSave(sh.id));
  }
  else if (act === 'quote-price') {
    const itId = document.getElementById('q-item').value;
    const price = Number(document.getElementById('q-price').value);
    if (!itId || !price) return alert('품목과 새 단가를 입력하세요.');
    S.updateItem(itId, { unitPrice: price });
    alert('단가가 변경됐어요. (품목에 반영)');
  }
  else if (act === 'wh-back') { state.stockWH = null; render(); }
  else if (act === 'add-wh') { openSheet(sheetWarehouseForm(null)); }
  else if (act === 'wh-edit') { openSheet(sheetWarehouseForm(t.dataset.w)); }
  else if (act === 'add-partner') { openSheet(sheetPartnerForm(null)); }
  else if (act === 'partner-edit') { openSheet(sheetPartnerForm(t.dataset.w)); }
  else if (act === 'del-partner') { if (confirm('이 거래처를 삭제할까요?')) { S.deletePartner(t.dataset.w); closeSheet(); } }
  else if (act === 'copy-dispatch') { openSheet(sheetDispatchBuilder(t.dataset.id)); }
  else if (act === 'db-toggle') { t.classList.toggle('on'); if (t.id === 'db-max') document.getElementById('db-weight')?.classList.remove('need'); }
  else if (act === 'db-search') {
    const target = t.dataset.t === 'from' ? 'db-from-addr' : 'db-to-addr';
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({ oncomplete: (data) => { const el = document.getElementById(target); if (el) el.value = data.roadAddress || data.jibunAddress || data.address; } }).open();
    } else { alert('주소 검색은 인터넷 연결이 필요해요. 주소는 직접 입력·수정도 됩니다.'); }
  }
  else if (act === 'db-sched-fill') {
    const d = new Date(); d.setDate(d.getDate() + 1);
    document.getElementById('db-sched').value = `오늘 오후 상차 · ${d.getMonth() + 1}/${d.getDate()}(내일) 오전 7시 착`;
  }
  else if (act === 'db-generate') {
    const g = (id) => document.getElementById(id);
    const from = g('db-from').value, to = g('db-to').value;
    const hide = document.querySelector('#db-cust .on').dataset.v === 'hide';
    const addrFrom = g('db-from-addr').value.trim() || '(주소 미등록)';
    const addrTo = g('db-to-addr').value.trim() || '(주소 미등록)';
    const weight = g('db-max').classList.contains('on') ? '최대' : g('db-weight').value.trim();
    const payOn = document.querySelector('#db-pay .on');
    const L = ['[배차 요청]', '', `상차지: ${from}`, `　${addrFrom}`, '', `하차지: ${hide ? '홈트레이더스' : to}`, `　${addrTo}`, ''];
    if (g('db-goods').value.trim()) L.push(`물품: ${g('db-goods').value.trim()}`);
    if (weight) L.push(`중량: ${weight}`);
    if (g('db-vehicle').value.trim()) L.push(`차량: ${g('db-vehicle').value.trim()}`);
    if (payOn) L.push(`결제: ${payOn.dataset.v}`);
    if (g('db-sched').value.trim()) L.push(`일정: ${g('db-sched').value.trim()}`);
    if (g('db-urgent').classList.contains('on')) L.push('※ 긴급 · 바로 상하차');
    const text = L.join('\n');
    // 주소를 출고 건에 저장 (출고 상세에서 확인)
    if (t.dataset.id) {
      S.updateShipment(t.dataset.id, {
        loadPlace: from, loadAddr: g('db-from-addr').value.trim(),
        unloadPlace: to, unloadAddr: g('db-to-addr').value.trim(),
      });
    }
    navigator.clipboard.writeText(text).then(
      () => alert('배차 양식 복사됨 · 주소는 출고 건에 저장됐어요.\n\n' + text),
      () => alert(text));
  }
  else if (act === 'shipview') { state.shipView = t.dataset.v; render(); }
  else if (act === 'shipfilter') { state.shipFilter = t.dataset.v; render(); }
  else if (act === 'selday') { state.selDate = t.dataset.d; render(); }
  else if (act === 'calnav') {
    let m = state.calM + Number(t.dataset.v), y = state.calY;
    if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
    state.calM = m; state.calY = y; render();
  }
  else if (act === 'new-ship') { shipPrefill = null; openSheet(sheetShipForm()); }
  else if (act === 'quick') { shipPrefill = null; openSheet(sheetQuick()); }
  else if (act === 'add-inbound') { openSheet(sheetInboundForm()); }
  else if (act === 'color') { openSheet(sheetColor(t.dataset.c)); }
  else if (act === 'sil-wh') { state.silWH = t.dataset.w || null; render(); }
  else if (act === 'color-ship') {
    const it = S.findItem(t.dataset.id);
    shipPrefill = { warehouse: it.warehouse, itemId: it.id, qty: '', unit: it.unit, client: '', status: '출고완료', note: '', matched: it.name };
    state.route = 'ship'; openSheet(sheetShipForm());
  }
  else if (act === 'stock-edit') {
    const it = S.findItem(t.dataset.id);
    if (!it) return;
    const v = prompt(`${it.name} · ${it.warehouse}\n현재 재고를 실제 수량(${it.unit})으로 수정`, S.currentStock(it));
    if (v !== null && String(v).trim() !== '') { S.setStock(it.id, v); openSheet(sheetColor(it.name)); }
  }
  else if (act === 'note-edit') {
    const it = S.findItem(t.dataset.id);
    if (!it) return;
    const v = prompt(`${it.name} · ${it.warehouse}\n비고 (입고예정일 등 — 리스트에 빨간색 표시)`, it.note || '');
    if (v !== null) { S.updateItem(it.id, { note: v.trim() }); openSheet(sheetColor(it.name)); }
  }
  else if (act === 'q-parse') {
    const txt = document.getElementById('q-text').value;
    if (!txt.trim()) return alert('대표님 문구를 붙여넣으세요.');
    shipPrefill = parseQuick(txt);
    state.route = 'ship';
    openSheet(sheetShipForm());
  }
  else if (act === 'add-item') { openSheet(sheetItemForm(null)); }
  else if (act === 'item') { openSheet(sheetItemForm(S.findItem(t.dataset.id))); }
  else if (act === 'ship') { state.docEditLines = false; openSheet(sheetDoc(S.getShipments().find((s) => s.id === t.dataset.id))); }
  else if (act === 'edit-ship') { openSheet(sheetEditShip(S.getShipments().find((s) => s.id === t.dataset.id))); }
  else if (act === 'doc-edit-lines') {
    const sh = S.getShipments().find((s) => s.id === t.dataset.id);
    slId = sh.id; slLines = S.shipLines(sh).map((l) => ({ ...l })); state.docEditLines = true;
    openSheet(sheetDoc(sh));
  }
  else if (act === 'sl-add') {
    readShipLinesDom();
    slLines.push({ name: '', category: '', spec: '', unit: '', qty: '', unitPrice: 0 });   // 빈 줄 — 직접 입력
    openSheet(sheetDoc(S.getShipments().find((s) => s.id === slId)));
  }
  else if (act === 'sl-del') { readShipLinesDom(); slLines.splice(Number(t.dataset.i), 1); openSheet(sheetDoc(S.getShipments().find((s) => s.id === slId))); }
  else if (act === 'sl-cancel') { state.docEditLines = false; openSheet(sheetDoc(S.getShipments().find((s) => s.id === slId))); }
  else if (act === 'sl-save') {
    readShipLinesDom();
    const lines = slLines.filter((l) => l.name && Number(l.qty) > 0);
    if (!lines.length) return alert('품목이 최소 1줄은 있어야 해요. 전부 빼려면 출고 자체를 삭제하세요.');
    const f = lines[0];
    S.updateShipment(slId, { lines, name: f.name, category: f.category || '', qty: f.qty, unit: f.unit || '' });
    state.docEditLines = false;
    openSheet(sheetDoc(S.getShipments().find((s) => s.id === slId)));
  }
  else if (act === 'ship-stage') { state.docEditLines = false; S.updateShipment(t.dataset.id, { status: t.dataset.v }); openSheet(sheetDoc(S.getShipments().find((s) => s.id === t.dataset.id))); }
  else if (act === 'dispatch-paste') { openSheet(sheetDispatchPaste(t.dataset.id)); }
  else if (act === 'dp-apply') {
    const text = document.getElementById('dp-text').value;
    if (!text.trim()) return alert('배차 안내 문구를 붙여넣으세요.');
    const d = parseDispatch(text);
    const sh = S.getShipments().find((s) => s.id === t.dataset.id);
    S.updateShipment(t.dataset.id, {
      status: '배차완료', dispatchVia: '이음물류',
      driverName: d.driverName || sh.driverName, driverPhone: d.driverPhone || sh.driverPhone,
      vehicle: d.vehicle || sh.vehicle, freight: d.freight || sh.freight, payment: d.payment || sh.payment,
      note: [sh.note, d.note].filter(Boolean).join(' / '),
    });
    openSheet(sheetDoc(S.getShipments().find((s) => s.id === t.dataset.id)));
  }
  else if (act === 'close') { closeSheet(); }   // 바깥 탭으로는 안 닫힘(입력 유실 방지) — 닫기/취소 버튼으로만
  else if (act === 'del-item') { if (confirm('이 품목을 삭제할까요?')) { S.deleteItem(t.dataset.id); closeSheet(); } }
  else if (act === 'del-wh') {
    if (confirm('이 창고를 삭제할까요?')) {
      if (S.deleteWarehouse(t.dataset.w)) { if (state.stockWH === t.dataset.w) state.stockWH = null; closeSheet(); }
      else alert('품목이 있는 창고는 삭제할 수 없어요.');
    }
  }
  else if (act === 'del-ship') { if (confirm('이 출고를 삭제할까요? (재고가 복구됩니다)')) { S.deleteShipment(t.dataset.id); closeSheet(); } }
  else if (act === 'toggle-doc') {
    const sh = S.getShipments().find((s) => s.id === t.dataset.id);
    S.updateShipment(t.dataset.id, { docDone: !sh.docDone });
    openSheet(sheetDoc(S.getShipments().find((s) => s.id === t.dataset.id)));
  }
  else if (act === 'kakao') { alert('카카오톡 명세서 발송은 2단계에서 연동됩니다.\n(스튜디오밭 카카오 콘솔 템플릿 사용)'); }
  else if (act === 'export') { downloadJSON(); }
  else if (act === 'logout') { S.signOut(); }
  else if (act === 'reset') { if (confirm('모든 입력을 지우고 초기값으로 되돌릴까요?')) { S.resetAll(); state.sheet = null; render(); } }

});

app.addEventListener('input', (e) => {
  if (e.target.classList && e.target.classList.contains('need') && e.target.value.trim()) e.target.classList.remove('need');
  if (e.target.classList && (e.target.classList.contains('ql-qty') || e.target.classList.contains('ql-price'))) {
    const i = Number(e.target.dataset.i);
    if (qLines[i]) { if (e.target.classList.contains('ql-qty')) qLines[i].qty = e.target.value; else qLines[i].unitPrice = e.target.value; }
    const tot = document.getElementById('ql-total'); if (tot) tot.textContent = quoteTotal(qLines).toLocaleString() + '원';
  }
});

app.addEventListener('change', (e) => {
  if (e.target.id === 'f-wh') fillItemSelect();
  if (e.target.id === 'f-item') updateStockHint();
  if (e.target.id === 'ib-wh') fillInboundItems();
  if (e.target.id === 'ib-item') updateInboundHint();
  if (e.target.id === 'db-from') { const p = getPlaces().find((x) => x.name === e.target.value); const el = document.getElementById('db-from-addr'); if (el) el.value = p ? p.address : ''; }
  if (e.target.id === 'db-to') { const p = getPlaces().find((x) => x.name === e.target.value); const el = document.getElementById('db-to-addr'); if (el) el.value = p ? p.address : ''; }
  if (e.target.classList && e.target.classList.contains('ql-item')) {
    const i = Number(e.target.dataset.i);
    if (qLines[i]) {
      qLines[i].name = e.target.value;
      const price = e.target.selectedOptions[0].dataset.price;
      if (price) { qLines[i].unitPrice = price; const pin = document.querySelector(`.ql-price[data-i="${i}"]`); if (pin) pin.value = price; }
    }
    const tot = document.getElementById('ql-total'); if (tot) tot.textContent = quoteTotal(qLines).toLocaleString() + '원';
  }
});

app.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  if (form.id === 'login-form') {
    const errEl = document.getElementById('login-err'); if (errEl) errEl.textContent = '로그인 중…';
    S.signIn(form.userid.value.trim(), form.password.value).catch((err) => {
      const raw = (err && (err.message || err.error_description || '')).toLowerCase();
      let msg = '로그인 실패 — 아이디/비밀번호를 확인하세요';
      if (raw.includes('not confirmed')) msg = '로그인 실패 — 계정 이메일 인증이 필요해요 (관리자 확인)';
      else if (raw.includes('invalid')) msg = '로그인 실패 — 아이디 또는 비밀번호가 틀렸어요';
      if (errEl) errEl.textContent = msg;
      console.warn(err);
    });
    return;
  }
  if (form.id === 'ship-form') {
    const it = S.findItem(document.getElementById('f-item').value);
    const qty = Number(form.qty.value);
    if (!it) return alert('품목을 선택하세요.');
    if (!qty || qty <= 0) return alert('수량을 입력하세요.');
    const unit = document.getElementById('f-unit').value || it.unit;
    const cur = S.currentStock(it);
    const reqBoxes = (unit === '낱개' && it.perBox) ? qty / it.perBox : qty;
    if (reqBoxes > cur + 1e-9 && !confirm(`재고 부족 주의\n\n${it.name} (${it.warehouse})\n현재고 ${cur}${it.unit} · 요청 ${qty}${unit}\n\n재고보다 많습니다. 그래도 출고할까요?`)) return;
    const status = form.querySelector('#f-status .on').dataset.v;
    const saved = S.addShipment({ date: form.date.value, time: form.time.value, warehouse: it.warehouse, category: it.category,
      name: it.name, qty, unit, client: form.client.value.trim(), status,
      dispatchVia: form.dispatchVia.value, driverName: form.driverName.value.trim(),
      driverPhone: form.driverPhone.value.trim(), vehicle: form.vehicle.value.trim(),
      freight: form.freight.value, payment: form.payment.value, note: form.note.value.trim(),
      method: form.querySelector('#f-method .on')?.dataset.v || '배차',
      courier: form.courier.value.trim(), trackingNo: form.trackingNo.value.trim(), courierFee: form.courierFee.value,
      recvName: form.recvName.value.trim(), recvPhone: form.recvPhone.value.trim(), recvAddr: form.recvAddr.value.trim() });
    const newSh = saved;
    const la = form.learnAlias ? form.learnAlias.value.trim() : '';   // 자동학습: 부른 말을 품목 별칭에 추가
    if (la && it) {
      const cur = String(it.aliases || '').split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      if (!cur.includes(la)) S.updateItem(it.id, { aliases: [...cur, la].join(', ') });
    }
    state.route = 'ship'; state.selDate = form.date.value;
    state.calY = +form.date.value.slice(0, 4); state.calM = +form.date.value.slice(5, 7);
    if (status === '출고예정' && newSh) openSheet(sheetPostSave(newSh.id)); else closeSheet();
  }
  else if (form.id === 'quote-form') {
    const client = form.client.value.trim();
    if (!client) return alert('거래처를 입력하세요.');
    let phone = form.phone.value.trim();
    if (!phone) { const p = S.findPartner(client); if (p) phone = p.phone || ''; }
    const base = { client, phone, content: form.content.value.trim(), note: form.note.value.trim() };
    if (form.dataset.id) S.updateQuote(form.dataset.id, base); // 날짜는 접수일 그대로 보존
    else S.addQuote({ ...base, date: S.todayStr() });         // 신규는 오늘 날짜
    state.route = 'quote'; closeSheet();
  }
  else if (form.id === 'partner-form') {
    const orig = form.dataset.orig;
    const name = form.name.value.trim();
    if (!name) return alert('거래처명을 입력하세요.');
    const o = { name, address: form.address.value.trim(), phone: form.phone.value.trim(), note: form.note.value.trim() };
    const ok = orig ? S.updatePartner(orig, o) : S.addPartner(o);
    if (!ok) return alert('같은 이름의 거래처가 있어요.');
    closeSheet();
  }
  else if (form.id === 'inbound-form') {
    const it = S.findItem(document.getElementById('ib-item').value);
    const qty = Number(form.qty.value);
    if (!it) return alert('품목을 선택하세요. (없으면 먼저 품목 추가)');
    if (!qty || qty <= 0) return alert('입고 수량을 입력하세요.');
    S.addInbound({ date: form.date.value, warehouse: it.warehouse, category: it.category, name: it.name,
      qty, unit: it.unit, perBox: form.perBox.value, unitPrice: form.unitPrice.value,
      vatSeparate: form.querySelector('#ib-vat .on').dataset.v === '1',
      supplier: form.supplier.value.trim(), note: form.note.value.trim() });
    state.stockWH = it.warehouse;
    closeSheet();
  }
  else if (form.id === 'item-form') {
    const warehouse = form.querySelector('[data-seg="warehouse"] .on').dataset.v;
    const category = form.querySelector('[data-seg="category"] .on').dataset.v;
    const name = form.name.value.trim();
    if (!name) return alert('품목명을 입력하세요.');
    const payload = { warehouse, category, name, unit: form.unit.value,
      perBox: Number(form.perBox.value) || 0, unitPrice: Number(form.unitPrice.value) || 0,
      supplier: form.supplier.value.trim(), note: form.note.value.trim(), aliases: form.aliases.value.trim() };
    if (form.dataset.id) { S.updateItem(form.dataset.id, payload); S.setStock(form.dataset.id, form.stock.value); }
    else S.addItem({ ...payload, initial: form.stock.value });
    closeSheet();
  }
  else if (form.id === 'wh-form') {
    const orig = form.dataset.orig;
    const name = form.name.value.trim();
    const icon = form.querySelector('#wh-icons .on')?.dataset.v || 'warehouse';
    if (!name) return alert('창고 이름을 입력하세요.');
    if (orig) {
      if (name !== orig && !S.renameWarehouse(orig, name)) return alert('같은 이름의 창고가 있어요.');
      S.setWarehouseIcon(name, icon);
      if (state.stockWH === orig) state.stockWH = name;
    } else if (!S.addWarehouse(name, icon)) {
      return alert('이미 있는 창고 이름이에요.');
    }
    S.setWarehouseInfo(name, { address: form.address.value.trim(), phone: form.phone.value.trim() });
    closeSheet();
  }
  else if (form.id === 'editship-form') {
    const pick = S.findItem(form.itemPick.value);
    S.updateShipment(form.dataset.id, {
      ...(pick ? { warehouse: pick.warehouse, category: pick.category, name: pick.name } : {}),
      qty: form.qty.value,
      status: form.querySelector('#e-status .on').dataset.v,
      client: form.client.value.trim(), date: form.date.value,
      dispatchVia: form.dispatchVia.value, driverName: form.driverName.value.trim(),
      driverPhone: form.driverPhone.value.trim(), vehicle: form.vehicle.value.trim(),
      freight: form.freight.value, payment: form.payment.value, note: form.note.value.trim(),
      method: form.querySelector('#e-method .on')?.dataset.v || '배차',
      courier: form.courier.value.trim(), trackingNo: form.trackingNo.value.trim(), courierFee: form.courierFee.value,
      recvName: form.recvName.value.trim(), recvPhone: form.recvPhone.value.trim(), recvAddr: form.recvAddr.value.trim() });
    closeSheet();
  }
});

function downloadJSON() {
  const blob = new Blob([S.exportData()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `hometraders_${S.todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function showLogin(msg) {
  app.innerHTML = `
  <div style="max-width:340px;margin:12vh auto 0;padding:0 24px;text-align:center">
    <div style="width:56px;height:56px;border-radius:16px;background:var(--accent);color:var(--accent-ink);display:grid;place-items:center;font-size:26px;font-weight:800;margin:0 auto 16px">H</div>
    <h1 style="font-size:22px;font-weight:800;margin:0">홈트레이더스</h1>
    <p style="color:var(--muted);font-size:13px;margin:4px 0 24px">재고 · 출고 관리 · 로그인</p>
    <form id="login-form" style="display:flex;flex-direction:column;gap:10px;text-align:left">
      <input name="userid" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="아이디" style="padding:13px;border-radius:11px;background:var(--surface-2);border:0;color:var(--ink);font-size:16px">
      <input name="password" type="password" autocomplete="current-password" placeholder="비밀번호" style="padding:13px;border-radius:11px;background:var(--surface-2);border:0;color:var(--ink);font-size:16px">
      <button class="btn" type="submit" style="margin-top:4px">로그인</button>
      <p id="login-err" style="color:#e05a52;font-size:13px;text-align:center;min-height:18px;margin:2px 0">${msg || ''}</p>
    </form>
  </div>`;
}

let booted = false;
async function boot() {
  const session = await S.getSession();
  if (!session) { booted = false; showLogin(); return; }
  if (booted) { render(); return; }
  app.innerHTML = '<div style="padding:64px 24px;text-align:center;color:#888;font-size:15px">불러오는 중…</div>';
  try { await S.init(); booted = true; render(); }
  catch (e) { app.innerHTML = `<div style="padding:48px 24px;text-align:center"><b>연결 오류</b><br><span style="color:#888;font-size:13px">${esc(e.message || String(e))}</span></div>`; }
}
// 실리콘 상세 비고 입력칸 — 다른 곳 탭(blur)하면 자동 저장
app.addEventListener('change', (e) => {
  const el = e.target.closest('[data-note-id]');
  if (!el) return;
  const it = S.findItem(el.dataset.noteId);
  if (!it) return;
  const v = el.value.trim();
  if ((it.note || '') === v) return;
  S.updateItem(it.id, { note: v });
  openSheet(sheetColor(it.name));
});
S.subscribe(render);
S.onError((m) => alert('저장에 실패했어요 — 잠시 후 다시 시도해주세요.\n\n원인: ' + m));
S.onAuthChange(() => boot());
boot();

// PWA 서비스워커
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
