import {
  CATEGORIES, UNITS, WH_ICON_KEYS, swatchFor, SILICONE_COLORS,
} from './data.js?v=2';
import * as S from './store-supabase.js';
import { ECOUNT_ITEMS } from './ecount-items.js';
import { makeMatcher, readPastedText, quotePrev } from './textread.js';
import * as DL from './delivery.js';

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
  invoice: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3L6 21z"/><path d="M9 8h6M9 12h6"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L18.5 9.5a2 2 0 0 0-3-3L5 17z"/><path d="M13.5 6.5l3 3"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.5 21a1.6 1.6 0 0 1-3 0"/></svg>',
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
// 계정(아이디) → 소유자 이름. 계정 늘면 여기 추가.
const ACCOUNT_NAMES = { admin: '김유화' };
let myAccount = '';
const myName = () => ACCOUNT_NAMES[myAccount] || myAccount || '담당자';

// 주소 → "도 시/군" 요약. 도 접두어(충남/충청남도 등) 있으면 축약, 없으면 도시명으로 도 추정.
const PROV = { 서울특별시: '서울', 부산광역시: '부산', 인천광역시: '인천', 대구광역시: '대구', 대전광역시: '대전', 광주광역시: '광주', 울산광역시: '울산', 세종특별자치시: '세종', 세종시: '세종', 경기도: '경기', 강원도: '강원', 강원특별자치도: '강원', 충청북도: '충북', 충청남도: '충남', 전라북도: '전북', 전북특별자치도: '전북', 전라남도: '전남', 경상북도: '경북', 경상남도: '경남', 제주특별자치도: '제주', 제주도: '제주' };
const CITY_SIDO = {
  수원: '경기', 성남: '경기', 고양: '경기', 용인: '경기', 부천: '경기', 안산: '경기', 안양: '경기', 남양주: '경기', 화성: '경기', 평택: '경기', 의정부: '경기', 시흥: '경기', 파주: '경기', 김포: '경기', 광명: '경기', 군포: '경기', 오산: '경기', 이천: '경기', 양주: '경기', 안성: '경기', 구리: '경기', 포천: '경기', 의왕: '경기', 하남: '경기', 여주: '경기', 동두천: '경기', 과천: '경기', 광주시: '경기',
  춘천: '강원', 원주: '강원', 강릉: '강원', 동해: '강원', 태백: '강원', 속초: '강원', 삼척: '강원', 홍천: '강원', 횡성: '강원',
  청주: '충북', 충주: '충북', 제천: '충북', 음성: '충북', 진천: '충북', 옥천: '충북', 영동: '충북',
  천안: '충남', 공주: '충남', 보령: '충남', 아산: '충남', 서산: '충남', 논산: '충남', 계룡: '충남', 당진: '충남', 예산: '충남', 홍성: '충남', 청양: '충남', 부여: '충남', 서천: '충남', 금산: '충남', 태안: '충남',
  전주: '전북', 군산: '전북', 익산: '전북', 정읍: '전북', 남원: '전북', 김제: '전북', 완주: '전북',
  목포: '전남', 여수: '전남', 순천: '전남', 나주: '전남', 광양: '전남', 무안: '전남',
  포항: '경북', 경주: '경북', 김천: '경북', 안동: '경북', 구미: '경북', 영주: '경북', 영천: '경북', 상주: '경북', 문경: '경북', 경산: '경북', 칠곡: '경북',
  창원: '경남', 진주: '경남', 통영: '경남', 사천: '경남', 김해: '경남', 밀양: '경남', 거제: '경남', 양산: '경남', 함안: '경남',
  제주: '제주', 서귀포: '제주',
};
const SIDO_SELF = new Set(['서울', '부산', '인천', '대구', '대전', '광주', '울산', '세종']);
function region(addr, place) {
  const a = (addr || '').trim();
  if (a) {
    const parts = a.split(/\s+/);
    const first = parts[0] || '';
    let prov = PROV[first] || '';
    if (!prov && !/(시|군|구)$/.test(first)) prov = first;   // 축약 도명(충남·경기 등)
    const rest = prov ? parts.slice(1).join(' ') : a;
    let city = ((rest.match(/([가-힣]{2,}(?:시|군))/) || rest.match(/([가-힣]{2,}구)/)) || [''])[0];
    if (!prov && city) prov = CITY_SIDO[city.replace(/(시|군)$/, '')] || '';  // 도 없으면 도시명으로 추정
    if (SIDO_SELF.has(prov) && city && city === prov) city = '';              // 서울 서울 방지
    if (city && prov && prov !== city) return `${prov} ${city}`;
    return prov || city || first;
  }
  return (place || '').trim();
}
const DISPATCH = ['이음물류', '직접', '기타'];
const HOLD_REASONS = ['단가 미확인', '매입처 미확인', '거래처 회신 대기', '기타'];
// 배차 업체 자동완성 목록 = 기본 + 지금까지 실제 쓴 값
const dispatchList = () => [...new Set([...DISPATCH, ...S.getShipments().map((s) => s.dispatchVia).filter(Boolean)])];
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
let sfExtra = [];           // 출고 등록 폼: 추가 품목 줄들(품명·수량·단위 직접입력)

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
  // 시간(몇시) 추출 — "오전 7시", "오후 3시 30분", "07:00"
  let time = '';
  const tm = t.match(/(오전|오후|새벽|아침|저녁|밤)?\s*(\d{1,2})\s*시\s*(\d{1,2})?\s*분?/);
  if (tm) {
    let h = Number(tm[2]); const min = tm[3] ? Number(tm[3]) : 0; const mer = tm[1];
    if ((mer === '오후' || mer === '저녁' || mer === '밤') && h < 12) h += 12;
    if ((mer === '오전' || mer === '새벽' || mer === '아침') && h === 12) h = 0;
    if (h >= 0 && h <= 23 && min <= 59) time = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  if (!time) { const cm = t.match(/\b(\d{1,2}):(\d{2})\b/); if (cm) time = `${cm[1].padStart(2, '0')}:${cm[2]}`; }
  return { driverName, driverPhone, vehicle, freight, payment, time, note: noteParts.join(' '),
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
  const needDispatch = ships.filter((s) => s.status === '출고예정');   // 예정=무조건 배차 요청 필요 (상태 기준)
  const inTransit = ships.filter((s) => s.status === '배차완료').length;
  const needCheck = ships.filter((s) => !s.name || (s.note || '').includes('확인'));
  const docPending = ships.filter((s) => s.status === '출고완료' && !s.docDone);
  const lowItems = items.filter((it) => S.stockStatus(it) === 'out');   // 대시보드는 품절만 (부족은 제외)
  // 배차완료(날짜무관) + 오늘 출고완료. 예정은 위 '배차 요청 필요'에.
  const todayList = ships.filter((s) => s.status === '배차완료' || (s.date === today && s.status !== '출고예정'))
    .sort((a, b) => ((a.date + (a.time || '~')).localeCompare(b.date + (b.time || '~'))));

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
    const needsDisp = isPlan;
    const left = isPlan ? mdDow(s.date) : (s.time || '--:--');
    const pillCls = needsDisp ? 'low' : (isPlan ? 'plan' : STAGE_PILL[s.status]);
    const pillTxt = needsDisp ? '배차필요' : (isPlan ? '예정' : STAGE_SHORT[s.status]);
    const sm = shipSummary(s);
    const call = (!isPlan && s.driverPhone) ? `<a class="callrow" href="${telHref(s.driverPhone)}">${I.phone}<span>기사님 전화걸기${s.driverName ? ' · ' + esc(s.driverName) : ''}</span></a>` : '';
    const markDone = s.status === '배차완료' ? `<button class="pill done" data-act="mark-done" data-id="${s.id}" style="flex:none">출고완료</button>` : '';
    // 명세서 발행 상태는 별도 '명세서' 메뉴에서 관리 → 홈 보드에선 라벨 제거
    const rightPill = isPlan ? `<span class="pill ${pillCls}">${pillTxt}</span>` : '';
    // 주소가 비면 창고·거래처 마스터 주소로 지역 추정
    const whAddr = (S.getWarehouses().find((w) => w.name === s.warehouse) || {}).address || '';
    const clAddr = (S.findPartner(s.client) || {}).address || '';
    const fr = region(s.loadAddr || whAddr, s.loadPlace || s.warehouse);
    const to = region(s.unloadAddr || clAddr, s.unloadPlace || s.client);
    const route = (s.status === '출고완료' && (fr || to)) ? `${esc(fr || '-')} <span class="arr">→</span> ${esc(to || '-')}` : '';
    return `<div class="brd">
    <div class="brd-top">
      <button class="brd-open" data-act="ship" data-id="${s.id}">
        <span class="bt">${esc(left)}</span>
        <div class="bmid"><b>${esc(s.client || '거래처 미지정')}</b>
          ${route ? `<div class="broute">${route}</div>` : ''}
          <div class="bsub">${esc(sm.itemLabel)} ${esc(sm.qtyLabel)} · ${whTag(s.warehouse)}</div></div>
      </button>
      ${rightPill ? `<span style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">${rightPill}</span>` : ''}${markDone}
    </div>${call}</div>`;
  };

  const pendingQuotes = S.getQuotes().filter((q) => q.status === '견적대기').sort((a, b) => daysSince(b.date) - daysSince(a.date));
  const problems = [];
  // 견적 미발송은 상단 '견적요청' 탭으로 이동(중복 제거)
  if (lowItems.length) problems.push(`<div class="psec"><span class="pttl">품절 (${lowItems.length})</span>
    ${lowItems.slice(0, 5).map((it) => `<button class="prow" data-act="wh" data-w="${esc(it.warehouse)}"><span>${esc(it.name)} · ${esc(it.warehouse)}</span><span class="pill ${S.stockStatus(it)}">${STATUS_KO[S.stockStatus(it)]}</span></button>`).join('')}</div>`);
  if (needCheck.length) problems.push(`<div class="psec"><span class="pttl">확인 필요 (${needCheck.length})</span>
    ${needCheck.slice(0, 5).map((s) => `<button class="prow" data-act="ship" data-id="${s.id}"><span>${esc(s.client || '-')} · ${s.name ? esc(s.note || '확인 필요') : '품목 미지정'}</span><span class="pill chk">확인</span></button>`).join('')}</div>`);

  const ready = ships.filter((s) => s.status === '배차완료').sort((a, b) => ((b.date + (b.time || '')).localeCompare(a.date + (a.time || ''))));
  const done = ships.filter((s) => s.status === '출고완료').sort((a, b) => ((b.date + (b.time || '')).localeCompare(a.date + (a.time || ''))));
  const htab = state.homeTab || 'need';
  const htabs = [['need', '배차 요청', needDispatch.length], ['ready', '오늘 출고', ready.length], ['done', '출고 완료', done.length], ['quote', '견적요청', pendingQuotes.length]];

  // 날짜별 그룹 렌더 (배차 요청·출고 완료 공용). desc=최신 먼저, relFn=날짜배지 문구.
  const addDays = (ds, n) => { const [y, m, d] = ds.split('-').map(Number); const t = new Date(y, m - 1, d + n); return dstr(t.getFullYear(), t.getMonth() + 1, t.getDate()); };
  const dgroupHTML = (list, dateOf, desc, relFn) => {
    const withD = list.filter((s) => dateOf(s));
    const noD = list.filter((s) => !dateOf(s));
    if (!withD.length && !noD.length) return '';
    const byDate = {};
    withD.forEach((s) => { const k = dateOf(s); (byDate[k] = byDate[k] || []).push(s); });
    const keys = Object.keys(byDate).sort(); if (desc) keys.reverse();
    let html = keys.map((d) => {
      const hd = d === today
        ? `<b class="td-big">오늘</b> <span class="td-date">${mdDow(d)}</span>`
        : `${mdDow(d)}${relFn(d) ? ` <span class="rel">${relFn(d)}</span>` : ''}`;
      return `<div class="dgrp${d === today ? ' today' : ''}">
      <div class="dghd">${hd}</div>
      <div class="rows">${byDate[d].map(boardRow).join('')}</div></div>`;
    }).join('');
    if (noD.length) html += `<div class="dgrp"><div class="dghd">날짜 미정</div><div class="rows">${noD.map(boardRow).join('')}</div></div>`;
    return html;
  };
  const needRel = (d) => { const n = daysSince(d); return n === 0 ? '오늘' : n === -1 ? '내일' : n < 0 ? '' : `${n}일 지연`; };
  const doneRel = (d) => { const n = daysSince(d); return n === 0 ? '오늘' : n === 1 ? '어제' : n < 0 ? '' : `${n}일 전`; };
  const needGroupsHTML = () => {
    const wk = addDays(today, 7);
    const list = needDispatch.filter((s) => !s.date || s.date <= wk);
    return dgroupHTML(list, (s) => s.date, false, needRel) || `<div class="empty"><div class="ico">${I.truck}</div>배차 요청할 게 없어요.</div>`;
  };
  // 출고 완료: 완료 누른 날짜(doneAt) 기준으로 날짜별 분리(최신 먼저). doneAt 없으면 출고일로 대체.
  const doneGroupsHTML = () => dgroupHTML(done, (s) => s.doneAt || s.date, true, doneRel) || `<div class="empty"><div class="ico">${I.truck}</div>출고 완료된 게 없어요.</div>`;

  const quoteRow = (q) => `<div class="brd"><div class="brd-top">
    <button class="brd-open" data-act="quote-open" data-id="${q.id}">
      <span class="bt">${mdDow(q.date)}</span>
      <div class="bmid"><b>${esc(q.client || '거래처 미지정')}</b>
        <div class="bsub">${esc(q.content || '견적 요청')}${q.phone ? ` · ${esc(q.phone)}` : ''}</div></div>
    </button>
    <span class="pill ${daysSince(q.date) >= 2 ? 'out' : 'plan'}" style="flex:none">${pendingLabel(q.date)}</span>
  </div></div>`;

  const bodyHTML = htab === 'need' ? needGroupsHTML()
    : htab === 'quote' ? (pendingQuotes.length ? `<div class="rows">${pendingQuotes.map(quoteRow).join('')}</div>` : `<div class="empty"><div class="ico">${I.doc}</div>받은 견적요청이 없어요.</div>`)
    : htab === 'ready' ? (ready.length ? `<div class="rows">${ready.map(boardRow).join('')}</div>` : `<div class="empty"><div class="ico">${I.truck}</div>오늘 출고 건이 없어요.</div>`)
    : doneGroupsHTML();

  const stuck = stuckItems();
  return `
  <div class="screen">
    ${stuck.total ? `<button class="alertbar" data-act="checklist"><span class="ab-ic">${I.bell}<i class="dot"></i></span><span class="ab-tx">확인 필요 <b>${stuck.total}건</b> · 명세서·견적·단가</span><span class="go">›</span></button>` : ''}
    <div class="homtabs">${htabs.map(([k, l, n]) => `<button data-act="hometab" data-t="${k}" class="${htab === k ? 'on' : ''}">${l}${n ? `<b>${n}</b>` : ''}</button>`).join('')}</div>
    ${bodyHTML}
  </div>`;
}

// 몰라서·정보부족으로 막혀 있는 건 모으기 (안전망)
function stuckItems() {
  const docs = S.getShipments().filter((s) => s.status === '출고완료' && !s.docDone && daysSince(s.doneAt || s.date) >= 1);
  const quotes = S.getQuotes().filter((q) => q.status === '견적대기' && daysSince(q.date) >= 1);
  const prices = priceStuckShips();   // 단가 빠진 출고 건
  const holds = [
    ...S.getShipments().filter((s) => s.holdReason).map((s) => ({ kind: 'ship', o: s })),
    ...S.getQuotes().filter((q) => q.holdReason).map((q) => ({ kind: 'quote', o: q })),
  ];
  return { docs, quotes, prices, holds, total: docs.length + quotes.length + prices.length + holds.length };
}
function sheetCheckList() {
  const s = stuckItems();
  const sec = (title, rowsHTML) => rowsHTML ? `<div class="psec"><span class="pttl">${title}</span>${rowsHTML}</div>` : '';
  const holdRow = (h) => h.kind === 'ship'
    ? `<button class="prow" data-act="ship" data-id="${h.o.id}"><span>${esc(h.o.client || '-')} · ${esc(shipSummary(h.o).itemLabel)}</span><span class="pill out">보류 · ${esc(h.o.holdReason)}</span></button>`
    : `<button class="prow" data-act="quote-open" data-id="${h.o.id}"><span>${esc(h.o.client || '-')}${h.o.content ? ` · ${esc(h.o.content)}` : ''}</span><span class="pill out">보류 · ${esc(h.o.holdReason)}</span></button>`;
  const docRow = (sh) => `<button class="prow" data-act="ship" data-id="${sh.id}"><span>${esc(sh.client || '-')} · ${esc(shipSummary(sh).itemLabel)}</span><span class="pill low">${daysSince(sh.doneAt || sh.date)}일째 미발행</span></button>`;
  const qRow = (q) => `<button class="prow" data-act="quote-open" data-id="${q.id}"><span>${esc(q.client || '-')}${q.content ? ` · ${esc(q.content)}` : ''}</span><span class="pill low">견적 ${daysSince(q.date)}일째</span></button>`;
  const pRow = (sh) => { const miss = S.shipLines(sh).filter((l) => effPrice(l, sh).price <= 0).map((l) => esc(l.name)).join(', ');
    return `<button class="prow" data-act="ship" data-id="${sh.id}"><span>${esc(sh.client || '-')} · ${miss}</span><span class="pill low">${esc(sh.date)}</span></button>`; };
  const priceSection = s.prices.length ? `<div class="psec"><span class="pttl">단가 확인 필요 (${s.prices.length}건)</span>
    <div style="display:flex;gap:8px;margin:6px 0 10px">
      <button class="btn" type="button" data-act="price-fill" style="flex:1;margin:0">단가 채우기</button>
      <button class="btn ghost" type="button" data-act="price-check-copy" style="flex:1;margin:0">메시지 복사</button>
    </div>${s.prices.map(pRow).join('')}</div>` : '';
  const body = sec('보류', s.holds.map(holdRow).join(''))
    + sec('명세서 미발행 (하루 이상)', s.docs.map(docRow).join(''))
    + sec('견적 미회신', s.quotes.map(qRow).join(''))
    + priceSection;
  return `<div class="grab"></div><h2>${I.bolt} 확인 필요</h2>
  <p class="hint">몰라서·정보 부족으로 막혀 있는 건들이에요. 눌러서 처리하세요.</p>
  ${body || `<div class="empty"><div class="ico">${I.check}</div>막혀 있는 건이 없어요 👍</div>`}
  <button class="btn danger" type="button" data-act="close" style="margin-top:10px">닫기</button>`;
}

// 아침 출고 공지 — 출고예정 건들을 거래처·창고·품목·재고·메모로 정리 (카톡 복붙용)
function buildBriefing() {
  const today = S.todayStr();
  const ships = S.getShipments().filter((s) => s.status === '출고예정' || s.status === '배차완료' || (s.status === '출고완료' && s.date === today))
    .sort((a, b) => (a.date + a.id).localeCompare(b.date + b.id));
  if (!ships.length) return `[출고 공지] ${mdDow(today)}\n\n예정된 출고가 없습니다.`;
  const L = [`[출고 공지] ${mdDow(today)}`, ''];
  ships.forEach((s, i) => {
    const day = s.date !== today ? ` (${mdDow(s.date)})` : '';
    L.push(`${i + 1}. ${s.client || '거래처 미지정'} · ${whShort(s.warehouse)}${day}`);
    S.shipLines(s).forEach((l) => {
      const it = S.getItems().find((x) => x.name === l.name && x.warehouse === s.warehouse);
      const stock = it ? ` (재고 ${Math.floor(S.currentStock(it))}${it.unit})` : '';
      L.push(`  · ${l.name} ${l.qty}${l.unit}${stock}`);
    });
    if ((s.note || '').trim()) L.push(`  ※ ${s.note.trim()}`);
    L.push('');
  });
  return L.join('\n').trim();
}
function sheetBriefing() {
  const txt = buildBriefing();
  return `<div class="grab"></div><h2>${I.doc} 오늘 출고 공지</h2>
  <p class="hint">출고예정 건을 정리했어요. 수정한 뒤 <b>복사</b>해서 대표님께 보내세요.<br>(※ 메모는 각 출고의 '비고'에 적으면 자동으로 들어와요)</p>
  <textarea id="brief-text" rows="14" style="width:100%;padding:13px;border-radius:12px;background:var(--surface-2);color:var(--ink);border:0;font-size:14px;line-height:1.6;font-family:inherit">${esc(txt)}</textarea>
  <button class="btn" type="button" data-act="briefing-copy" style="margin-top:10px">복사하기</button>
  <button class="btn danger" type="button" data-act="close">닫기</button>`;
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
  const allSil = S.getItems().filter((it) => it.category === '실리콘');
  // 창고 → 열 그룹 (천안 / NS / 기타)
  const whGroup = (w) => (w && w.includes('천안')) ? '천안' : (w && (w.includes('NS') || w.includes('로지스'))) ? 'NS' : '기타';
  const mat = {}; const units = {}; const lists = {};
  allSil.forEach((it) => {
    const g = whGroup(it.warehouse);
    const q = Math.floor(Math.max(0, S.currentStock(it)));
    (mat[it.name] = mat[it.name] || { 천안: 0, NS: 0, 기타: 0 })[g] += q;
    (lists[it.name] = lists[it.name] || []).push(it);
    units[it.name] = it.unit || '박스';
  });
  const hasEtc = allSil.some((it) => whGroup(it.warehouse) === '기타');
  const groups = ['천안', 'NS'].concat(hasEtc ? ['기타'] : []);
  const selWH = (state.silWH && groups.includes(state.silWH)) ? state.silWH : null;
  const cols = selWH ? [selWH] : groups;      // 창고 선택 시 그 창고 열만
  const showTot = !selWH;                      // 전체일 때만 합계 열
  const rank = { out: 0, low: 1, ok: 2 };
  let rows = Object.keys(mat).map((name) => {
    const m = mat[name]; const total = selWH ? m[selWH] : (m['천안'] + m['NS'] + m['기타']);
    const notes = lists[name].filter((it) => (it.note || '').trim())
      .map((it) => (lists[name].length > 1 ? whShort(it.warehouse) + ' ' : '') + it.note.trim());
    return { name, m, total, unit: units[name], st: colorStatus(total), notes };
  }).sort((a, b) => rank[a.st] - rank[b.st] || b.total - a.total);
  if (selWH) rows = rows.filter((r) => lists[r.name].some((it) => whGroup(it.warehouse) === selWH)); // 그 창고에 있는 색상만
  const colTot = (c) => rows.reduce((s, r) => s + r.m[c], 0);
  const grand = rows.reduce((s, r) => s + r.total, 0);
  const tabs = `<div class="tabs" style="margin-bottom:10px">
    <button data-act="sil-wh" data-w="" class="${!selWH ? 'on' : ''}">전체</button>
    ${groups.map((g) => `<button data-act="sil-wh" data-w="${esc(g)}" class="${selWH === g ? 'on' : ''}">${esc(g)}</button>`).join('')}
  </div>`;
  const matrix = `${tabs}<div class="sec-title">실리콘 재고 · ${selWH ? esc(selWH) + '창고' : '창고 합산'} · 색상 ${rows.length} · ${grand}</div>
    <div class="silmtx-wrap"><table class="silmtx">
      <thead><tr><th class="cell-nm">색상</th>${cols.map((c) => `<th>${c}</th>`).join('')}${showTot ? '<th class="cell-tot">합계</th>' : ''}</tr></thead>
      <tbody>${rows.map((r) => `<tr data-act="color" data-c="${esc(r.name)}">
        <td class="cell-nm"><span class="nmwrap">${swatchHTML(r.name)}${esc(r.name)}</span>${r.notes.length ? `<div class="mtx-note">${esc(r.notes.join(' · '))}</div>` : ''}</td>
        ${cols.map((c) => `<td class="${r.m[c] === 0 ? 'z' : ''}${selWH ? ' cell-tot ' + r.st : ''}">${r.m[c]}</td>`).join('')}
        ${showTot ? `<td class="cell-tot ${r.st}">${r.total}</td>` : ''}
      </tr>`).join('') || `<tr><td colspan="${cols.length + (showTot ? 2 : 1)}" style="color:var(--muted);padding:22px">실리콘 품목이 없어요</td></tr>`}</tbody>
      <tfoot><tr><td class="cell-nm">합계</td>${cols.map((c) => `<td>${colTot(c)}</td>`).join('')}${showTot ? `<td class="cell-tot">${grand}</td>` : ''}</tr></tfoot>
    </table></div>`;

  // 월별 실리콘 출고 내역 (어느 거래처에 몇 개)
  const silNames = new Set(allSil.map((it) => it.name));
  const outs = [];
  S.getShipments().forEach((s) => {
    S.shipLines(s).forEach((l) => {
      if (silNames.has(l.name) && Number(l.qty) > 0) outs.push({ id: s.id, date: s.date || '', month: (s.date || '').slice(0, 7), client: s.client || '거래처 미지정', name: l.name, qty: Number(l.qty), unit: l.unit || '', status: s.status });
    });
  });
  outs.sort((a, b) => (b.date + b.name).localeCompare(a.date + a.name));
  // 색상·거래처 필터
  const colorOpts = [...new Set(outs.map((e) => e.name))].sort();
  const clientOpts = [...new Set(outs.map((e) => e.client))].sort();
  const fColor = state.silOutColor || '', fClient = state.silOutClient || '';
  const fOuts = outs.filter((e) => (!fColor || e.name === fColor) && (!fClient || e.client === fClient));
  const fMonths = [...new Set(fOuts.map((e) => e.month))].filter(Boolean).sort().reverse();
  const fTotal = fOuts.reduce((s, e) => s + e.qty, 0);
  const monthBlock = (m) => {
    const es = fOuts.filter((e) => e.month === m);
    const total = es.reduce((s, e) => s + e.qty, 0);
    return `<div class="sec-title" style="margin-top:16px">${esc(m.replace('-', '. '))} · 합계 ${total}</div>
      <div class="rows">${es.map((e) => `<button class="ship" data-act="ship" data-id="${e.id}">
        ${swatchHTML(e.name)}
        <div class="body"><b>${esc(e.client)}</b><div class="meta">${esc(e.name)} · ${esc(e.date)}${e.status !== '출고완료' ? ` · <span style="color:var(--muted)">${esc(e.status)}</span>` : ''}</div></div>
        <div class="right"><span class="q">${e.qty}${esc(e.unit)}</span></div>
      </button>`).join('')}</div>`;
  };
  const filterBar = `<div class="outfilter">
    <select id="silout-color" class="minisel"><option value="">색상 전체</option>${colorOpts.map((c) => `<option ${c === fColor ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
    <select id="silout-client" class="minisel"><option value="">거래처 전체</option>${clientOpts.map((c) => `<option value="${esc(c)}" ${c === fClient ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
  </div>`;
  const outList = outs.length ? `<div class="sec-title" style="margin-top:26px">월별 출고 내역${(fColor || fClient) ? ` · 합계 <b>${fTotal}</b>` : ''}</div>${filterBar}
    ${fMonths.length ? fMonths.map(monthBlock).join('') : '<div class="empty" style="padding:22px">해당 내역이 없어요</div>'}` : '';

  return `<div class="screen">
    ${matrix}
    <p class="hint" style="margin-top:8px">색상 줄을 누르면 창고별 상세·비고를 볼 수 있어요</p>
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
    <button class="btn" data-act="add-inbound" style="margin-top:14px">＋ 입고 등록 (창고로 들어옴)</button>
    <button class="btn ghost" data-act="add-wh" style="margin-top:8px">＋ 창고 추가</button>
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
    const ships = S.getShipments();
    const CATS = [
      ['배차 요청', (s) => s.status === '출고예정'],
      ['출고 예정', (s) => s.status === '배차완료'],
      ['출고 완료', (s) => s.status === '출고완료'],
    ];
    const cat = state.shipCat;
    if (!cat) {
      const menu = `<div class="catlist">${CATS.map(([label, fn]) => {
        const n = ships.filter(fn).length;
        return `<button class="catrow" data-act="shipcat" data-c="${label}"><span class="cl">${label}</span><span class="cc ${n ? '' : 'zero'}">${n}</span></button>`;
      }).join('')}</div>`;
      return `<div class="screen">${seg}${quick}${menu}</div>`;
    }
    const def = CATS.find(([label]) => label === cat);
    const list = def ? ships.filter(def[1]) : [];
    return `<div class="screen">${seg}${quick}
      <button class="backlink" data-act="shipcat" data-c="">‹ 출고 메뉴</button>
      <div class="sec-title" style="margin-top:2px">${esc(cat)} <span style="color:var(--muted);font-weight:600">${list.length}</span></div>
      ${list.length ? `<div class="rows">${list.map(rowShip).join('')}</div>`
        : `<div class="empty"><div class="ico">${I.truck}</div>'${esc(cat)}' 건이 없어요</div>`}</div>`;
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
  const qtab = state.quoteTab || 'quote';
  const tabs = `<div class="homtabs">
    <button data-act="quotetab" data-t="quote" class="${qtab === 'quote' ? 'on' : ''}">견적</button>
    <button data-act="quotetab" data-t="price" class="${qtab === 'price' ? 'on' : ''}">단가표</button>
    <button data-act="quotetab" data-t="ecount" class="${qtab === 'ecount' ? 'on' : ''}">이카운트 품목</button>
    <button data-act="quotetab" data-t="map" class="${qtab === 'map' ? 'on' : ''}">품목사전</button>
  </div>`;
  if (qtab === 'price') return `<div class="screen">${tabs}${priceBody()}</div>`;
  if (qtab === 'ecount') return `<div class="screen">${tabs}${ecountBody()}</div>`;
  if (qtab === 'map') return `<div class="screen">${tabs}${mapBody()}</div>`;
  const all = S.getQuotes();
  const f = state.quoteFilter || '전체';
  const cnt = { 전체: all.length, 견적대기: all.filter((q) => q.status === '견적대기').length, 견적완료: all.filter((q) => q.status === '견적완료').length };
  const filt = `<div class="filtabs">${[['전체', cnt.전체], ['견적대기', cnt.견적대기], ['견적완료', cnt.견적완료]]
    .map(([k, c]) => `<button data-act="quote-filter" data-v="${k}" class="${f === k ? 'on' : ''}">${k.replace('견적', '')}<b>${c}</b></button>`).join('')}</div>`;
  const list = f === '전체' ? all : all.filter((q) => q.status === f);
  return `<div class="screen">${tabs}
    ${filt}
    <button class="btn" data-act="add-quote" style="margin-bottom:12px">＋ 견적 요청 추가</button>
    ${list.length ? `<div class="rows">${list.map(quoteRow).join('')}</div>`
      : `<div class="empty"><div class="ico">${I.doc}</div>${f === '전체' ? '견적 요청이 없어요' : `'${f.replace('견적', '')}' 건이 없어요`}</div>`}
  </div>`;
}

// 명세서 메뉴 — 판매(미발행/발행) + 구매(매입처별)
function screenInvoice() {
  const itab = state.invoiceTab || 'pending';
  const ships = S.getShipments().filter((s) => s.status === '출고완료');
  const pending = ships.filter((s) => !s.docDone).sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  const issued = ships.filter((s) => s.docDone).sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  const tabs = `<div class="homtabs">
    <button data-act="invoicetab" data-t="pending" class="${itab === 'pending' ? 'on' : ''}">미발행${pending.length ? `<b>${pending.length}</b>` : ''}</button>
    <button data-act="invoicetab" data-t="issued" class="${itab === 'issued' ? 'on' : ''}">발행 완료${issued.length ? `<b>${issued.length}</b>` : ''}</button>
    <button data-act="invoicetab" data-t="buy" class="${itab === 'buy' ? 'on' : ''}">구매</button>
  </div>`;
  if (itab === 'buy') return `<div class="screen">${tabs}${buyBody()}</div>`;
  const row = (s) => `<div class="ship">
    <button class="ship-open" data-act="ship" data-id="${s.id}"><div class="body"><b>${esc(s.client || '거래처 미지정')}</b>
      <div class="meta">${esc(shipSummary(s).itemLabel)} ${esc(shipSummary(s).qtyLabel)} · ${esc(s.date)}</div></div></button>
    ${s.docDone
      ? (s.docBy ? `<span class="issuer">${esc(s.docBy)}</span>` : '')
      : `<button class="pill done" data-act="doc-done" data-id="${s.id}" style="flex:none">발행완료</button>`}
  </div>`;
  const list = itab === 'pending' ? pending : issued;
  return `<div class="screen">${tabs}
    ${list.length ? `<div class="rows">${list.map(row).join('')}</div>`
      : `<div class="empty"><div class="ico">${I.invoice}</div>${itab === 'pending' ? '미발행 명세서가 없어요' : '발행 완료된 명세서가 없어요'}</div>`}
  </div>`;
}
// 출고 품목을 매입처별로 집계 → {매입처: [{name, unit, qty}]}
function buyGroups() {
  const g = {};
  S.getShipments().forEach((s) => {
    S.shipLines(s).forEach((l) => {
      const q = Number(l.qty) || 0; if (!q) return;
      const it = S.getItems().find((x) => x.name === l.name && x.warehouse === (l.warehouse || s.warehouse));
      const sup = (it && it.supplier) || '(매입처 미정)';
      const key = (l.name || '') + '|' + (l.unit || '');
      (g[sup] = g[sup] || {})[key] = { name: l.name, unit: l.unit || '', qty: ((g[sup] && g[sup][key]) ? g[sup][key].qty : 0) + q };
    });
  });
  return g;
}
function buyBody() {
  const g = buyGroups();
  const sups = Object.keys(g).sort();
  if (!sups.length) return `<div class="empty"><div class="ico">${I.invoice}</div>출고된 품목이 없어요</div>`;
  return `<p class="hint">출고 품목을 <b>매입처별</b>로 모았어요. 매입처에 보낼 구매명세서를 복사하세요. (구매단가 칸은 다음 단계)</p>
    ${sups.map((sup) => {
      const rows = Object.values(g[sup]).sort((a, b) => a.name.localeCompare(b.name));
      return `<div class="psec"><span class="pttl" style="display:flex;justify-content:space-between"><span>${esc(sup)}</span><span style="color:var(--muted)">${rows.length}품목</span></span>
        <div class="rows">${rows.map((r) => `<div class="prow"><span>${esc(r.name)}</span><span class="q">${r.qty}${esc(r.unit)}</span></div>`).join('')}</div>
        <button class="btn ghost" type="button" data-act="buy-copy" data-sup="${esc(sup)}" style="margin-top:8px">${esc(sup)} 구매명세서 복사</button></div>`;
    }).join('')}`;
}
function buildBuyStatement(sup) {
  const g = buyGroups()[sup];
  if (!g) return '해당 매입처 내역이 없습니다.';
  const rows = Object.values(g).sort((a, b) => a.name.localeCompare(b.name));
  const L = [`[구매명세서] ${esc(sup)}`, ''];
  rows.forEach((r, i) => L.push(`${i + 1}. ${esc(r.name)} ${r.qty}${esc(r.unit)}`));
  return L.join('\n');
}
function sheetBuyStatement(sup) {
  return `<div class="grab"></div><h2>${I.invoice} 구매명세서 · ${esc(sup)}</h2>
  <p class="hint">매입처에 보낼 문구예요. 수정 후 복사하세요.</p>
  <div class="field"><textarea id="brief-text" rows="10">${buildBuyStatement(sup)}</textarea></div>
  <button class="btn" type="button" data-act="briefing-copy">복사하기</button>
  <button class="btn danger" type="button" data-act="close">닫기</button>`;
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
  <div class="sec-title">보류 ${q.holdReason ? '' : '<span style="color:var(--faint);font-weight:400;font-size:13px">몰라서 막혔을 때</span>'}</div>
  ${q.holdReason
    ? `<div class="kv" style="margin-bottom:8px"><span>사유</span><span class="pill out">${esc(q.holdReason)}</span></div>
       <button class="btn ghost" type="button" data-act="unhold" data-id="${q.id}" data-kind="quote">보류 해제</button>`
    : `<div class="holdseg">${HOLD_REASONS.map((r) => `<button type="button" data-act="hold" data-id="${q.id}" data-kind="quote" data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div>`}
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
  const call = (s.status !== '출고예정' && s.driverPhone) ? `<a class="callbtn" href="${telHref(s.driverPhone)}" aria-label="기사님 전화">${I.phone}</a>` : '';
  return `<div class="ship">
    <button class="ship-open" data-act="ship" data-id="${s.id}">
      ${swatchHTML(sm.swatchName)}
      <div class="body"><b>${esc(s.client || '거래처 미지정')}</b>
        <div class="meta">${whTag(s.warehouse)} ${esc(sm.itemLabel)} · ${esc(s.date)}</div></div>
    </button>
    <div class="right" style="flex-wrap:wrap;justify-content:flex-end;gap:6px"><span class="q">${esc(sm.qtyLabel)}</span><span class="pill ${cls}">${STAGE_SHORT[s.status] || esc(s.status)}</span>${s.status === '출고완료' ? `<span class="pill ${s.docDone ? 'done' : 'low'}" style="font-size:11px">${s.docDone ? `명세서 발행${s.docBy ? ' · ' + esc(s.docBy) : ''}` : '명세서 미발행'}</span>` : ''}</div>
    ${call}
  </div>`;
}

// 그 거래처 + 그 품목의 마지막 판매단가 (종전가) — 다른 거래처는 안 봄
function lastSalePrice(name, client, excludeId) {
  if (!name || !client) return null;
  const cands = [];
  S.getShipments().forEach((s) => {
    if (s.id === excludeId || (s.client || '') !== client) return;
    S.shipLines(s).forEach((l) => {
      const p = Number(l.unitPrice) || 0;
      if (l.name === name && p > 0) cands.push({ price: p, date: s.date || '' });
    });
  });
  cands.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return cands[0] || null;
}
// 유효 판매단가: ①라인 직접입력 > ②품목 마스터 판매단가 > ③종전가(그 거래처·그 품목) > 0
function effPrice(l, sh) {
  const direct = Number(l.unitPrice) || 0;
  if (direct > 0) return { price: direct, src: '' };
  const it = S.getItems().find((x) => x.name === l.name && x.warehouse === (l.warehouse || (sh && sh.warehouse)));
  if (it && Number(it.unitPrice) > 0) return { price: Number(it.unitPrice), src: '단가표' };
  const prev = lastSalePrice(l.name, sh && sh.client, sh && sh.id);
  if (prev) return { price: prev.price, src: '종전가 ' + (prev.date || '').slice(0, 7) };
  return { price: 0, src: '' };
}
// 단가 확인 필요 = 실제 나간 출고 건 중 단가 빠진 라인이 있는 것 (판가 못 정해 명세서 못 냄)
// 종전가까지 폴백해도 값이 없는 라인만 '확인 필요'로 본다.
const needPrice = (it) => !(Number(it.unitPrice) > 0);
const priceStuckShips = () => S.getShipments().filter((s) => S.shipLines(s).some((l) => effPrice(l, s).price <= 0));
// 같은 품목명은 하나로 묶어 '마스터'로 봄 (창고 무관). 반환: [{name, category, unit, list, prices, suppliers, whs, perBox}]
function itemMasters() {
  const byName = {};
  S.getItems().forEach((it) => { (byName[it.name || '(미지정)'] = byName[it.name || '(미지정)'] || []).push(it); });
  return Object.keys(byName).map((name) => {
    const list = byName[name];
    return {
      name, list,
      category: (list.find((i) => i.category) || {}).category || '기타',
      unit: (list.find((i) => i.unit) || {}).unit || '',
      perBox: (list.find((i) => Number(i.perBox) > 0) || {}).perBox || 0,
      prices: [...new Set(list.map((i) => Number(i.unitPrice) || 0).filter((v) => v > 0))],
      anyZero: list.some((i) => !(Number(i.unitPrice) > 0)),
      suppliers: [...new Set(list.map((i) => i.supplier).filter(Boolean))],
      whs: [...new Set(list.map((i) => i.warehouse))],
    };
  });
}
function masterPriceLabel(m) {
  if (!m.prices.length) return { txt: '단가 없음', nop: true };
  if (m.prices.length === 1 && !m.anyZero) return { txt: m.prices[0].toLocaleString() + '원', nop: false };
  if (m.prices.length === 1 && m.anyZero) return { txt: m.prices[0].toLocaleString() + '원 (일부 미입력)', nop: false };
  return { txt: '창고별 상이', nop: false };
}
// 단가표 = 품목 마스터 (같은 품목명 한 줄, 단가는 품목명 단위). 견적 메뉴 '단가표' 탭.
function priceBody() {
  const masters = itemMasters().sort((a, b) => a.name.localeCompare(b.name));
  const byCat = {};
  masters.forEach((m) => { (byCat[m.category] = byCat[m.category] || []).push(m); });
  const cats = Object.keys(byCat).sort();
  const row = (m) => { const pl = masterPriceLabel(m); return `<button class="ship" data-act="master" data-name="${esc(m.name)}">
    ${swatchHTML(m.name)}
    <div class="body"><b>${esc(m.name)}</b>
      <div class="meta">${m.whs.map((w) => whTag(w)).join(' ')} ${esc(m.unit)}${m.perBox ? ` · ${m.perBox}개입` : ''}${m.suppliers.length ? ` · ${esc(m.suppliers.join(', '))}` : ''}</div></div>
    <div class="right"><span class="q" ${pl.nop ? 'style="color:#c0392b;font-weight:700"' : ''}>${pl.txt}</span></div>
  </button>`; };
  const noPrice = masters.filter((m) => !m.prices.length).length;
  return `
    <div class="quickbar" style="cursor:default;margin-top:4px"><span class="tx">품목 마스터 <b>${masters.length}</b>종${noPrice ? ` · 단가 미입력 <b>${noPrice}</b>` : ''}</span></div>
    ${cats.map((c) => `<div class="sec-title">${esc(c)} ${byCat[c].length}</div><div class="rows">${byCat[c].map(row).join('')}</div>`).join('')}
    <p class="hint" style="margin-top:16px">같은 품목명은 한 줄(마스터)로 묶었어요. 누르면 판매단가·매입처·별칭을 모든 창고에 한 번에 적용합니다.</p>`;
}
// 품목 마스터 편집 — 같은 이름 전체에 판매단가·매입처·별칭·단위 일괄 적용
function sheetMasterEdit(name) {
  const list = S.getItems().filter((it) => (it.name || '(미지정)') === name);
  if (!list.length) return '';
  const first = list[0];
  const prices = [...new Set(list.map((i) => Number(i.unitPrice) || 0).filter((v) => v > 0))];
  const priceVal = prices.length === 1 ? prices[0] : '';
  const supplier = [...new Set(list.map((i) => i.supplier).filter(Boolean))].join(', ');
  return `<div class="grab"></div><h2>${swatchHTML(name)} ${esc(name)}</h2>
  <p class="hint">판매단가·매입처·별칭을 <b>이 품목의 모든 창고</b>에 한 번에 적용해요.</p>
  <form id="master-form" data-name="${esc(name)}">
    <div class="field"><label>판매단가 (원)${prices.length > 1 ? ' <span style="color:#c0392b;font-weight:600">창고별 단가가 달라요 — 입력하면 통일됩니다</span>' : ''}</label>
      <input name="unitPrice" type="number" inputmode="numeric" value="${priceVal}" placeholder="단가"></div>
    <div class="field"><label>매입처</label><input name="supplier" value="${esc(supplier)}" placeholder="매입처 (비우면 미정)"></div>
    <div class="field"><label>별칭 <span style="color:var(--faint);font-weight:400">이렇게도 불러요 (쉼표)</span></label><input name="aliases" value="${esc(first.aliases || '')}" placeholder="예: 다루끼, 각재30" autocapitalize="none"></div>
    <div class="field"><label>단위</label><input name="unit" value="${esc(first.unit || '')}" placeholder="예: 박스"></div>
    <div class="card" style="margin-top:4px;padding:6px 14px"><div class="pttl" style="padding:6px 0">창고별 재고</div>
      ${list.map((it) => `<div class="kv"><span>${esc(whShort(it.warehouse))}</span><b>${Math.floor(S.currentStock(it)).toLocaleString()}${esc(it.unit || '')}</b></div>`).join('')}</div>
    <button class="btn" type="submit">저장 (모든 창고 적용)</button>
    <button class="btn danger" type="button" data-act="close">취소</button>
  </form>`;
}
// 이카운트 품목 검색 결과 HTML (재렌더 없이 결과칸만 갱신 — IME 안전)
function ecountResultsHTML(q) {
  q = (q || '').trim();
  let list = ECOUNT_ITEMS;
  if (q) { const qq = q.toLowerCase(); list = list.filter(([c, n]) => c.toLowerCase().includes(qq) || n.includes(q)); }
  const shown = list.slice(0, 200);
  return `<div class="quickbar" style="cursor:default;margin:4px 0"><span class="tx">${q ? `검색 <b>${list.length}</b>개` : `전체 <b>${ECOUNT_ITEMS.length}</b>개`}</span></div>
    ${shown.length ? `<div class="rows">${shown.map(([c, n]) => `<div class="ship"><div class="body"><b>${esc(n)}</b><div class="meta">코드 ${esc(c)}</div></div></div>`).join('')}</div>`
      : `<div class="empty" style="padding:24px">검색 결과가 없어요</div>`}
    ${list.length > 200 ? `<p class="hint" style="margin-top:12px">${list.length - 200}개 더 있어요 — 검색어를 더 입력하면 좁혀져요.</p>` : ''}`;
}
function ecountBody() {
  return `<div class="field" style="margin-top:6px"><input id="ecount-search" placeholder="코드·품목명 검색 (예: 라떼 / 03000 / 구조재)" autocapitalize="off" autocomplete="off" style="width:100%;padding:12px 13px;border-radius:11px;background:var(--surface-2);color:var(--ink);border:0"></div>
    <div id="ecount-results">${ecountResultsHTML('')}</div>`;
}
// 품목사전 검색 결과 (거래처 표기 → 우리 품목). 재렌더 없이 결과칸만 (IME 안전)
function mapMissingNote() {   // 매핑 사전은 공유 DB(item_map) — 표가 없거나 못 읽었을 때 안내
  const st = S.getItemMapState();
  if (st.missing) return '<p class="hint" style="margin:6px 0">매핑 사전 표가 아직 없어요 — 관리자가 Supabase에서 item_map SQL을 한 번 실행해야 해요.</p>';
  if (st.err) return `<p class="hint" style="margin:6px 0">매핑 사전을 못 읽었어요: ${esc(st.err)}</p>`;
  return '';
}
function mapResultsHTML(q) {
  q = (q || '').trim();
  const ITEM_MAP = S.getItemMap();
  let list = ITEM_MAP;
  if (q) { const qq = q.toLowerCase(); list = list.filter(([p, ext, ours]) => ext.toLowerCase().includes(qq) || ours.includes(q) || p.includes(q)); }
  const shown = list.slice(0, 200);
  return `${mapMissingNote()}<div class="quickbar" style="cursor:default;margin:4px 0"><span class="tx">${q ? `검색 <b>${list.length}</b>개` : `사전 <b>${ITEM_MAP.length}</b>개`}</span></div>
    ${shown.length ? `<div class="rows">${shown.map(([p, ext, ours]) => `<div class="ship"><div class="body"><b>${esc(ours)}</b><div class="meta">${esc(p)} 표기: ${esc(ext)}</div></div></div>`).join('')}</div>`
      : `<div class="empty" style="padding:24px">사전에 없어요. 거래처 표기를 다르게 넣어보거나, 이카운트 품목 탭에서 직접 찾아보세요.</div>`}
    ${list.length > 200 ? `<p class="hint" style="margin-top:12px">${list.length - 200}개 더 있어요 — 검색어를 더 입력하면 좁혀져요.</p>` : ''}`;
}
function mapBody() {
  return `<div class="field" style="margin-top:6px"><input id="map-search" placeholder="거래처 표기로 검색 (예: 평와샤 12*50 / 구조재VIDA)" autocapitalize="off" autocomplete="off" style="width:100%;padding:12px 13px;border-radius:11px;background:var(--surface-2);color:var(--ink);border:0"></div>
    <div id="map-results">${mapResultsHTML('')}</div>`;
}
// 대표님께 보낼 단가 확인 요청 문구 — 실제 출고 건 기준
function buildPriceCheck() {
  const ships = priceStuckShips().slice().sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  if (!ships.length) return '단가 확인 필요한 출고 건이 없습니다.';
  const L = ['[단가 확인 요청]', '아래 출고 건 구매단가 확인 부탁드립니다.', ''];
  ships.forEach((s) => {
    const miss = S.shipLines(s).filter((l) => effPrice(l, s).price <= 0).map((l) => `${l.name} ${l.qty}${l.unit || ''}`);
    L.push(`· ${s.client || '거래처'} (${s.date}) — ${miss.join(', ')}`);
  });
  return L.join('\n');
}
function sheetPriceCheck() {
  return `<div class="grab"></div><h2>${I.tag} 단가 확인 요청</h2>
  <p class="hint">대표님께 보낼 문구예요. 수정 후 복사해서 카톡으로 보내세요.</p>
  <div class="field"><textarea id="brief-text" rows="10">${buildPriceCheck()}</textarea></div>
  <button class="btn" type="button" data-act="briefing-copy">복사하기</button>
  <button class="btn danger" type="button" data-act="close">닫기</button>`;
}
// 출고 건별 단가 채우기 — 단가 빠진 라인만 모아 빨간 칸에 입력
function sheetPriceFill() {
  const ships = S.getShipments()
    .filter((s) => S.shipLines(s).some((l) => effPrice(l, s).price <= 0))
    .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  if (!ships.length) return `<div class="grab"></div><h2>${I.tag} 단가 채우기</h2>
    <div class="empty"><div class="ico">${I.check}</div>단가 빠진 출고 건이 없어요 👍</div>
    <button class="btn danger" type="button" data-act="close">닫기</button>`;
  const blocks = ships.map((s) => {
    const missing = S.shipLines(s).map((l, i) => ({ l, i })).filter((x) => effPrice(x.l, s).price <= 0);
    return `<div class="pfill-blk">
      <div class="pfill-hd"><b>${esc(s.client || '거래처 미지정')}</b><span>${esc(s.date)} · ${esc(whShort(s.warehouse))}</span></div>
      ${missing.map((x) => `<div class="pfill-row">
        <span class="pfill-nm">${esc(x.l.name || '(미지정)')}<span class="q2">${x.l.qty}${esc(x.l.unit || '')}</span></span>
        <input class="pfill-in" data-sid="${s.id}" data-li="${x.i}" type="number" inputmode="numeric" placeholder="단가">
      </div>`).join('')}
    </div>`;
  }).join('');
  return `<div class="grab"></div><h2>${I.tag} 단가 채우기 (${ships.length}건)</h2>
  <p class="hint">단가 빠진 품목만 모았어요. 빨간 칸에 구매단가를 넣고 저장하세요. (품목 단가도 같이 채워져요)</p>
  ${blocks}
  <button class="btn" type="button" data-act="pfill-save">입력한 단가 저장</button>
  <button class="btn danger" type="button" data-act="close">닫기</button>`;
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
  if (isDesk()) return sheetShipFormDesk();
  const p = shipPrefill || {};
  const curSt = p.status || '출고예정';
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
    <div class="field"><label>창고 <span style="color:var(--faint);font-weight:400">선택 또는 직접 입력 (매입창고 등)</span></label>
      <input name="warehouse" id="f-wh" list="f-wh-list" value="${esc(p.warehouse || S.warehouseNames()[0] || '')}" placeholder="창고명" autocomplete="off" style="width:100%;padding:12px 13px;border-radius:11px;background:var(--surface-2);color:var(--ink);border:0">
      <datalist id="f-wh-list">${S.warehouseNames().map((w) => `<option value="${esc(w)}"></option>`).join('')}</datalist></div>
    <div class="field"><label>품목 <span style="color:var(--faint);font-weight:400">이름 입력하면 자동완성 · 여러 개 추가 가능</span></label>
      <div id="sf-extra"></div>
      <button class="btn ghost" type="button" data-act="sf-add" style="margin-top:2px;padding:12px;font-size:14px">＋ 품목 추가</button>
      <datalist id="sf-items"></datalist>
      <datalist id="f-unit-list">${UNITS.map((u) => `<option value="${esc(u)}"></option>`).join('')}</datalist></div>
    <div class="field"><label>거래처 (하차지)</label>
      <input name="client" list="ship-partners" id="sf-client" placeholder="거래처 검색·선택 또는 직접 입력" value="${esc(p.client || '')}" autocomplete="off">
      <datalist id="ship-partners">${S.getPartners().map((pt) => `<option value="${esc(pt.name)}"></option>`).join('')}</datalist></div>
    <div class="field"><label>하차지 주소 <span style="color:var(--faint);font-weight:400">직접 입력 · 검색 (선택)</span></label>
      <div class="addr-row"><input name="unloadAddr" id="sf-unaddr" placeholder="하차지 주소" value="${esc(p.unloadAddr || '')}" autocomplete="off"><button type="button" data-act="db-search" data-target="sf-unaddr">주소검색</button></div></div>
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
        <div class="field"><label>배차 방법 (업체)</label>
          <input name="dispatchVia" list="dispatch-list" value="${esc(p.dispatchVia || '')}" placeholder="예: 이음물류 · 직접 · 다른 업체" autocomplete="off" style="width:100%;padding:12px 13px;border-radius:11px;background:var(--surface-2);color:var(--ink);border:0">
          <datalist id="dispatch-list">${dispatchList().map((d) => `<option value="${esc(d)}"></option>`).join('')}</datalist></div>
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

// PC 전표형 출고 입력 — 모바일 폼과 입력칸 이름·id·data-act 가 같아서 저장 처리(ship-form submit)는 그대로 쓴다
function sheetShipFormDesk() {
  const p = shipPrefill || {};
  const curSt = p.status || '출고예정';
  const hasDisp = !!(p.dispatchVia || p.driverName || p.driverPhone || p.vehicle || p.freight || p.payment);
  const courier = p.method === '택배';
  return `<h2>출고 입력</h2>
  <div class="e-sf-top">
    ${shipPrefill ? `<div class="parsed" style="margin:0">${I.bolt}<span>인식됨${p.matched ? '' : ' · 품목을 못 찾았어요, 직접 선택하세요'}</span></div>` : `<button type="button" class="e-btn" data-act="smart">${I.bolt} 문구 붙여넣어 자동 입력</button>`}
    <span class="sp"></span><span class="e-keys" style="font-size:11px;color:var(--e-faint)"><kbd>Enter</kbd>다음 칸<kbd>F8</kbd>저장<kbd>Esc</kbd>닫기</span>
  </div>
  <form id="ship-form">
    <table class="e-ftbl"><colgroup><col style="width:92px"><col><col style="width:92px"><col><col style="width:92px"><col></colgroup>
      <tr><th>상태</th><td><div class="seg" id="f-status">${['출고예정', '출고완료'].map((s) => `<button type="button" data-v="${s}" class="${curSt === s ? 'on' : ''}">${s}</button>`).join('')}</div></td>
        <th class="req">출고일</th><td><div class="row"><input class="e-in" name="date" type="date" value="${state.selDate || S.todayStr()}"><input class="e-in" name="time" type="time" value="${p.time || ''}" style="max-width:110px"></div></td>
        <th>출고 방식</th><td><div class="seg" id="f-method">${['배차', '택배'].map((m) => `<button type="button" data-v="${m}" class="${(p.method || '배차') === m ? 'on' : ''}">${m}</button>`).join('')}</div></td></tr>
      <tr><th class="req">거래처</th><td><input class="e-in" name="client" list="ship-partners" id="sf-client" placeholder="거래처 검색·선택 또는 직접 입력" value="${esc(p.client || '')}" autocomplete="off">
          <datalist id="ship-partners">${S.getPartners().map((pt) => `<option value="${esc(pt.name)}"></option>`).join('')}</datalist></td>
        <th class="req">창고</th><td><input class="e-in" name="warehouse" id="f-wh" list="f-wh-list" value="${esc(p.warehouse || S.warehouseNames()[0] || '')}" placeholder="창고명" autocomplete="off">
          <datalist id="f-wh-list">${S.warehouseNames().map((w) => `<option value="${esc(w)}"></option>`).join('')}</datalist></td>
        <th>비고</th><td><input class="e-in" name="note" placeholder="경로 / 혼적 / 당착 등" value="${esc(p.note || '')}"></td></tr>
      <tr><th>하차지 주소</th><td colspan="5"><div class="row"><input class="e-in" name="unloadAddr" id="sf-unaddr" placeholder="하차지 주소 (거래처 선택 시 등록 주소 자동)" value="${esc(p.unloadAddr || '')}" autocomplete="off"><button type="button" class="e-btn" data-act="db-search" data-target="sf-unaddr">주소검색</button></div></td></tr>
    </table>
    <div class="e-disp" id="f-dispatch-block"${courier ? ' style="display:none"' : ''}>
      <div class="e-disp-hd"><b>배차 정보</b><button type="button" class="tgl" data-act="toggle-disp" id="f-disp-toggle">${hasDisp ? '− 배차 정보 접기' : '＋ 배차 정보 입력 (기사·차량·운임) · 선택'}</button></div>
      <div id="f-disp-fields" style="display:${hasDisp ? 'block' : 'none'}">
        <table class="e-ftbl"><colgroup><col style="width:92px"><col><col style="width:92px"><col><col style="width:92px"><col></colgroup>
          <tr><th>배차 업체</th><td><input class="e-in" name="dispatchVia" list="dispatch-list" value="${esc(p.dispatchVia || '')}" placeholder="예: 이음물류 · 직접" autocomplete="off">
              <datalist id="dispatch-list">${dispatchList().map((d) => `<option value="${esc(d)}"></option>`).join('')}</datalist></td>
            <th>기사님</th><td><input class="e-in" name="driverName" placeholder="이름" value="${esc(p.driverName || '')}"></td>
            <th>기사 전화</th><td><input class="e-in" name="driverPhone" type="tel" placeholder="010-0000-0000" value="${esc(p.driverPhone || '')}"></td></tr>
          <tr><th>차량</th><td><input class="e-in" name="vehicle" placeholder="예: 1톤카고 / 경기85사7749" value="${esc(p.vehicle || '')}"></td>
            <th>운임 (원)</th><td><input class="e-in" name="freight" type="number" value="${p.freight || ''}" placeholder="예: 80000"></td>
            <th>결제</th><td><select class="e-sel" name="payment" style="width:100%;height:26px"><option value="">-</option><option ${p.payment === '현불' ? 'selected' : ''}>현불</option><option ${p.payment === '착불' ? 'selected' : ''}>착불</option></select></td></tr>
        </table>
      </div>
    </div>
    <div class="e-disp" id="f-courier-block"${courier ? '' : ' style="display:none"'}>
      <div class="e-disp-hd"><b>택배 정보</b></div>
      <table class="e-ftbl"><colgroup><col style="width:92px"><col><col style="width:92px"><col><col style="width:92px"><col></colgroup>
        <tr><th>택배사</th><td><input class="e-in" name="courier" list="courier-list" value="${esc(p.courier || '')}" placeholder="예: 경동택배">
            <datalist id="courier-list">${COURIERS.map((c) => `<option value="${c}"></option>`).join('')}</datalist></td>
          <th>송장번호</th><td><input class="e-in" name="trackingNo" value="${esc(p.trackingNo || '')}" placeholder="예: 1234-5678-9012"></td>
          <th>택배비 (원)</th><td><input class="e-in" name="courierFee" type="number" value="${p.courierFee || ''}" placeholder="예: 4000"></td></tr>
        <tr><th>받는 사람</th><td><input class="e-in" name="recvName" value="${esc(p.recvName || '')}" placeholder="성함"></td>
          <th>연락처</th><td><input class="e-in" name="recvPhone" type="tel" value="${esc(p.recvPhone || '')}" placeholder="010-0000-0000"></td>
          <th>받는 주소</th><td><input class="e-in" name="recvAddr" value="${esc(p.recvAddr || '')}" placeholder="배송지 주소"></td></tr>
      </table>
    </div>
    <div class="e-lines-hd"><b>품목</b><span class="hint2">이름 입력하면 자동완성 · 여러 개 추가 가능</span><span class="sp"></span>
      <button class="e-btn sm" type="button" data-act="sf-add">＋ 행 추가</button></div>
    <div id="sf-extra"></div>
    <datalist id="sf-items"></datalist>
    <datalist id="f-unit-list">${UNITS.map((u) => `<option value="${esc(u)}"></option>`).join('')}</datalist>
    <div class="e-fbar">
      <div class="sf-foot" id="sf-foot"></div><span class="sp"></span>
      <button class="btn danger" type="button" data-act="close">취소</button>
      <button class="btn" type="submit">저장 <span style="font-weight:500;opacity:.8">F8</span></button>
    </div>
  </form>`;
}

// 출고 폼 품목: 창고 바뀌면 자동완성 목록 갱신 + 통일 리스트 다시 그림
function fillItemSelect() {
  const whEl = document.getElementById('f-wh'); if (!whEl) return;
  fillSfItems(whEl.value); readSfExtra(); renderSfExtra();
}
// 추가 품목 줄 (품명 datalist·수량·단위 직접입력)
function fillSfItems(wh) {
  const dl = document.getElementById('sf-items');
  if (!dl) return;
  wh = wh || (document.getElementById('f-wh') || {}).value;
  const names = [...new Set(S.getItems().filter((it) => !wh || it.warehouse === wh).map((it) => it.name))];
  dl.innerHTML = names.map((n) => `<option value="${esc(n)}"></option>`).join('')
    // PC: 창고에 없는 품목도 이카운트 품목 목록에서 바로 고를 수 있게 (창고 품목이 먼저)
    + (isDesk() ? ECOUNT_ITEMS.filter(([, n]) => !names.includes(n)).map(([c, n]) => `<option value="${esc(n)}">${esc(c)}</option>`).join('') : '');
}
function readSfExtra() {
  document.querySelectorAll('#sf-extra [data-sf]').forEach((el) => {
    const i = Number(el.dataset.i); if (!sfExtra[i]) return;
    sfExtra[i][el.dataset.sf] = el.value;
  });
}
// 출고 폼 품목 리스트 초기화: 스마트 프리필 있으면 첫 줄 채우고, 없으면 빈 줄 1개
function initShipLines() {
  const p = shipPrefill || {};
  const it = p.itemId ? S.findItem(p.itemId) : null;
  const name = it ? it.name : (p.matched || p.guess || '');
  sfExtra = [{ name, qty: p.qty || '', unit: p.unit || (it && it.unit) || '', price: '' }];
}
// 출고 라인의 추천 판매단가 (그 거래처·그 품목 기준: 마스터 판매단가 > 종전가)
function suggestSalePrice(name, wh, client) {
  const it = S.getItems().find((x) => x.name === name && x.warehouse === wh) || S.getItems().find((x) => x.name === name);
  if (it && Number(it.unitPrice) > 0) return Number(it.unitPrice);
  const prev = lastSalePrice(name, client);
  return prev ? prev.price : 0;
}
function renderSfExtra() {
  const box = document.getElementById('sf-extra');
  if (!box) return;
  if (!sfExtra.length) sfExtra = [{ name: '', qty: '', unit: '', price: '' }];
  if (isDesk()) {   // PC 전표형 품목 그리드 (입력칸 data-sf/data-i 와 id 는 모바일과 동일)
    box.innerHTML = `<table class="e-grid"><colgroup><col style="width:32px"><col style="width:118px"><col><col style="width:78px"><col style="width:72px"><col style="width:62px"><col style="width:92px"><col style="width:96px"><col style="width:84px"><col style="width:100px"><col style="width:30px"></colgroup>
      <thead><tr><th>No</th><th>품목코드</th><th>품목명</th><th>현재고</th><th>수량</th><th>단위</th><th>단가</th><th>공급가</th><th>세액</th><th>합계</th><th></th></tr></thead>
      <tbody>${sfExtra.map((l, i) => `<tr class="sfline">
        <td class="no">${i + 1}</td><td class="code" id="sfcode-${i}"></td>
        <td><input data-sf="name" data-i="${i}" list="sf-items" value="${esc(l.name || '')}" placeholder="품목 검색·선택" autocomplete="off"></td>
        <td class="c"><span class="sfl-cur" id="sfcur-${i}"></span></td>
        <td><input class="num" data-sf="qty" data-i="${i}" type="number" min="0" value="${esc(l.qty || '')}"></td>
        <td><input data-sf="unit" data-i="${i}" list="f-unit-list" value="${esc(l.unit || '')}" autocomplete="off"></td>
        <td><input class="num" data-sf="price" data-i="${i}" type="number" min="0" value="${esc(l.price || '')}"></td>
        <td class="n" id="sfsup-${i}"></td><td class="n" id="sfvat-${i}"></td><td class="n" id="sftot-${i}" style="font-weight:700"></td>
        <td class="c"><button class="del" type="button" data-act="sf-del" data-i="${i}" title="행 삭제">✕</button></td></tr>`).join('')}</tbody></table>`;
    recalcSf();
    return;
  }
  const inp = 'padding:10px;border-radius:9px;background:var(--surface);color:var(--ink);border:0;font-size:15px;min-width:0';
  box.innerHTML = sfExtra.map((l, i) => `<div class="sfline">
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:7px">
      <input data-sf="name" data-i="${i}" list="sf-items" value="${esc(l.name || '')}" placeholder="품목 검색·선택" autocapitalize="none" autocomplete="off" style="flex:1;${inp}">
      <span class="sfl-cur" id="sfcur-${i}"></span>
      <button class="pill" type="button" data-act="sf-del" data-i="${i}" style="flex:none">✕</button>
    </div>
    <div style="display:flex;gap:6px">
      <input data-sf="qty" data-i="${i}" type="number" min="0" inputmode="numeric" value="${esc(l.qty || '')}" placeholder="수량" style="width:70px;text-align:right;${inp}">
      <input data-sf="unit" data-i="${i}" list="f-unit-list" value="${esc(l.unit || '')}" placeholder="단위" autocomplete="off" style="width:64px;${inp}">
      <input data-sf="price" data-i="${i}" type="number" min="0" inputmode="numeric" value="${esc(l.price || '')}" placeholder="단가" style="flex:1;text-align:right;${inp}">
    </div>
    <div class="sfl-amt" id="sfamt-${i}"></div>
  </div>`).join('') + `<div class="sf-foot" id="sf-foot"></div>`;
  recalcSf();
}
// 실시간 계산: 라인별 현재고·공급가·부가세·합계 + 하단 합계 (입력 재렌더 없이 span만 갱신 → IME 안전)
// opt.noFill: 타이핑 중(수량·단가 입력) 재계산에선 빈 단가 자동채움을 하지 않음 (기존처럼 칸을 벗어날 때 채움)
function recalcSf(opt = {}) {
  const whEl = document.getElementById('f-wh'); if (!whEl) return;
  const wh = whEl.value;
  const clientEl = document.getElementById('sf-client');
  const client = clientEl ? clientEl.value.trim() : '';
  let tQty = 0, tSup = 0, tVat = 0;
  document.querySelectorAll('#sf-extra .sfline').forEach((row, i) => {
    const g = (sf) => row.querySelector(`[data-sf="${sf}"]`);
    const name = (g('name').value || '').trim();
    const qty = Number(g('qty').value) || 0;
    const unit = (g('unit').value || '').trim();
    let price = Number(g('price').value) || 0;
    const it = S.getItems().find((x) => x.name === name && x.warehouse === wh);
    // 단가 비었으면 추천가 자동 채움
    if (!price && name && !opt.noFill) { const s = suggestSalePrice(name, wh, client); if (s) { price = s; g('price').value = s; } }
    const curEl = document.getElementById('sfcur-' + i);
    if (curEl) {
      if (it) {
        const cur = Math.floor(S.currentStock(it));
        const req = (unit === '낱개' && it.perBox) ? qty / it.perBox : qty;
        const over = req > cur + 1e-9;
        curEl.textContent = '재고 ' + cur;
        curEl.style.cssText = 'flex:none;font-size:11px;font-weight:600;padding:3px 8px;border-radius:20px;' + (over ? 'background:#fdecea;color:#e05a52' : 'background:var(--surface-2);color:var(--muted)');
      } else { curEl.textContent = name ? '신규' : ''; curEl.style.cssText = 'flex:none;font-size:11px;color:var(--faint);padding:3px 6px'; }
    }
    const sup = qty * price, vat = Math.round(sup * 0.1);
    // PC 그리드 칸 (품목코드·공급가·세액·합계) — 계산식은 위와 동일, 표시만
    const cEl = document.getElementById('sfcode-' + i); if (cEl) cEl.textContent = ecountCode(name) || (it && it.ecountCode) || '';
    const put = (k, v) => { const el = document.getElementById(k + i); if (el) el.textContent = v ? v.toLocaleString() : ''; };
    put('sfsup-', qty && price ? sup : 0); put('sfvat-', qty && price ? vat : 0); put('sftot-', qty && price ? sup + vat : 0);
    const amtEl = document.getElementById('sfamt-' + i);
    if (amtEl) amtEl.innerHTML = qty && price
      ? `<span>공급가 ${sup.toLocaleString()}</span><span>부가세 ${vat.toLocaleString()}</span><span style="color:var(--ink);font-weight:700">합계 ${(sup + vat).toLocaleString()}</span>`
      : '';
    tQty += qty; tSup += sup; tVat += vat;
  });
  const foot = document.getElementById('sf-foot');
  if (foot) foot.innerHTML = tSup
    ? `<div><span>수량 합계</span><b>${tQty.toLocaleString()}</b></div><div><span>공급가액 계</span><b>${tSup.toLocaleString()}</b></div><div><span>부가세 계</span><b>${tVat.toLocaleString()}</b></div><div class="big"><span>합계 금액</span><b>${(tSup + tVat).toLocaleString()}</b></div>`
    : '';
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
  // 모든 창고의 품목을 이름+분류로 중복 제거 → 그 창고에 재고/레코드가 없어도 입고할 수 있게
  const seen = new Map();
  S.getItems().forEach((it) => { const k = it.category + '|' + it.name; if (!seen.has(k)) seen.set(k, it); });
  const list = [...seen.values()].sort((a, b) => (a.category + a.name).localeCompare(b.category + b.name));
  sel.innerHTML = list.map((it) => {
    const here = S.getItems().some((x) => x.warehouse === wh && x.category === it.category && x.name === it.name);
    return `<option value="${esc(it.name)}" data-cat="${esc(it.category)}" data-unit="${esc(it.unit || '')}" data-pb="${it.perBox || ''}">${esc(it.name)} (${esc(it.category)})${here ? '' : ' · 신규'}</option>`;
  }).join('') || '<option value="">품목 없음 · 먼저 품목 추가</option>';
  updateInboundHint();
}
function updateInboundHint() {
  const opt = document.getElementById('ib-item').selectedOptions[0];
  const wh = document.getElementById('ib-wh').value;
  const hint = document.getElementById('ib-stock');
  const unit = document.getElementById('ib-unit');
  const pb = document.querySelector('#inbound-form [name=perBox]');
  if (opt && opt.value) {
    const it = S.getItems().find((x) => x.warehouse === wh && x.category === opt.dataset.cat && x.name === opt.value);
    unit.value = it ? it.unit : (opt.dataset.unit || '');
    if (pb && !pb.value && (it ? it.perBox : opt.dataset.pb)) pb.value = it ? it.perBox : opt.dataset.pb;
    if (it) {
      const sp = S.stockParts(it);
      hint.innerHTML = `현재고 <b style="color:var(--ink)">${sp.whole}${esc(it.unit)}${sp.loose ? ` ${sp.loose}개` : ''}</b>`;
    } else {
      hint.innerHTML = `이 창고엔 <b style="color:#e05a52">신규 품목</b> · 재고 0에서 시작`;
    }
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
// 채팅 문구 포맷 — **굵게** / 줄바꿈
function chatFmt(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }
// 재고 물어보는 질문인지 (예: "천안창고 라떼 재고 몇개?")
function isStockQuery(t) {
  return /재고|몇\s*개|몇\s*박스|몇\s*장|얼마나\s*(남|있)|남았|남아\s*있/.test(t)
    && !/출고|보내|나가|발주|주문|등록|빼\s*줘|차감|견적|배차|기사/.test(t);
}
// 재고 조회 답변 (창고·품목 감지 → 현재고)
function chatStockAnswer(txt) {
  const items = S.getItems();
  const wh = /엔에스|앤에스|\bns\b/i.test(txt) ? 'NS로지스' : /천안/.test(txt) ? '천안창고' : null;
  const aliasesOf = (it) => [it.name, ...String(it.aliases || '').split(/[,\n]/).map((s) => s.trim()).filter(Boolean)];
  const matchLen = (it) => Math.max(0, ...aliasesOf(it).filter((a) => a && txt.includes(a)).map((a) => a.length));
  const cands = items.filter((it) => matchLen(it) > 0).sort((a, b) => matchLen(b) - matchLen(a));
  if (!cands.length) return { role: 'bot', text: '어떤 품목인지 못 찾았어요. 품목 이름을 정확히 적어주실래요? (예: 라떼, 베이지)' };
  const topName = cands[0].name;
  let targets = items.filter((it) => it.name === topName);
  if (wh) targets = targets.filter((it) => it.warehouse === wh);
  if (!targets.length) return { role: 'bot', text: `${whShort(wh)} 창고엔 ${topName} 품목이 등록돼 있지 않아요.` };
  const lines = targets.map((it) => {
    const p = S.stockParts(it);
    const label = p.loose > 0 ? `${p.whole}${it.unit} +${p.loose}개` : `${p.whole}${it.unit || '개'}`;
    const flag = S.stockStatus(it) === 'out' ? ' (품절)' : S.stockStatus(it) === 'low' ? ' (부족)' : '';
    return `${whShort(it.warehouse)}: **${label}**${flag}`;
  });
  // 재고 답 + 그대로 출고 등록까지 연결 (재고문의 → 출고). 재고 있는 창고를 우선 프리필.
  const primary = targets.find((it) => S.currentStock(it) > 0) || targets[0];
  return { role: 'bot', kind: 'ship', actionLabel: `${topName} 출고 등록`,
    payload: { warehouse: primary.warehouse, itemId: primary.id, unit: primary.unit || '', status: '출고예정' },
    text: `${wh ? whShort(wh) + ' 창고 ' : ''}**${topName}** 재고\n${lines.join('\n')}\n출고 등록할까요?` };
}
// 붙여넣기/채팅 문구를 규칙기반으로 해석 → 봇 답변(요약+실행버튼)
function chatInterpret(txt) {
  if (isStockQuery(txt)) return chatStockAnswer(txt);
  const type = classifyPaste(txt);
  if (type === '견적') {
    const q = parseQuoteText(txt);
    return { role: 'bot', kind: 'quote', payload: q, actionLabel: '견적 폼 열기',
      text: `견적 요청으로 봤어요.${q.client ? ` 거래처 **${q.client}**` : ''}${q.phone ? ` · ${q.phone}` : ''}\n견적 폼을 열어 이어서 작성할까요?` };
  }
  if (type === '배차') {
    return { role: 'bot', kind: 'dispatch', payload: txt, actionLabel: '출고 건 고르기',
      text: '배차 안내로 봤어요.\n어느 출고 건에 이 배차 정보를 붙일지 골라주세요.' };
  }
  const multi = parseMultiLines(txt);
  if (multi.lines.length >= 2) {
    return { role: 'bot', kind: 'multiship', payload: multi, actionLabel: '확인 · 등록',
      text: `출고 ${multi.lines.length}품목으로 봤어요.\n${multi.lines.map((l) => `· ${l.name} ${l.qty}${l.unit || ''}`).join('\n')}${multi.client ? `\n거래처 **${multi.client}**` : ''}\n창고 확인 후 등록할게요.` };
  }
  const pq = parseQuick(txt);
  const itemTxt = pq.matched ? `${pq.matched}${pq.qty ? ` ${pq.qty}${pq.unit || ''}` : ''}` : (pq.guess ? `${pq.guess}(신규 품목?)` : '품목 미인식');
  const st = pq.status === '출고예정' ? '출고 예정' : pq.status === '배차완료' ? '배차 완료' : '출고';
  return { role: 'bot', kind: 'ship', payload: pq, actionLabel: '출고 등록 폼',
    text: `${st}(으)로 봤어요.${pq.client ? ` 거래처 **${pq.client}**` : ''} · ${itemTxt}\n등록 폼을 열까요?` };
}
function sheetChat() {
  const log = state.chat || [];
  const bubbles = log.length ? log.map((m, i) => m.role === 'user'
    ? `<div class="cbub user">${chatFmt(m.text)}</div>`
    : `<div class="cbub bot">${chatFmt(m.text)}${m.actionLabel ? `<button class="cbtn" type="button" data-act="chat-go" data-i="${i}">${esc(m.actionLabel)}</button>` : ''}</div>`).join('')
    : `<div class="cbub bot">안녕하세요! 카톡·문자 문구를 붙여넣거나 채팅하듯 적어주세요. 출고·견적·배차를 인식하고, <b>재고도 물어보면 답해드려요.</b><br><span style="color:var(--muted);font-size:13px">예) 원익 베이지 50박스 내일 오전착<br>예) 천안창고 라떼 재고 몇개?</span></div>`;
  return `<div class="grab"></div><h2>${I.bolt} 스마트 입력 · 챗봇</h2>
  <div class="chatlog" id="chat-log">${bubbles}</div>
  <div class="chatbar">
    <textarea id="chat-input" rows="1" placeholder="문구 붙여넣기 · 채팅하듯 입력" autocapitalize="off"></textarea>
    <button class="csend" type="button" data-act="chat-send" aria-label="보내기">↑</button>
  </div>
  ${log.length ? `<button class="btn ghost" type="button" data-act="chat-clear" style="margin-top:8px">대화 지우기</button>` : ''}`;
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
  const goods = sh ? S.shipLines(sh).map((l) => `${l.name} ${l.qty}${l.unit}`).join(', ') : '';
  const fromName = sh && sh.warehouse;
  const toName = sh && sh.client;
  const fromP = places.find((p) => p.name === fromName) || {};
  const toP = places.find((p) => p.name === toName) || {};
  const fromAddr = fromP.address || '';
  const toAddr = toP.address || '';
  const fromPhone = fromP.phone || '';
  const toPhone = toP.phone || '';
  return `<div class="grab"></div><h2>배차 요청 양식</h2>
  <p class="hint" style="margin-top:-4px"><b style="color:#e05a52">빨간 칸</b>만 채우면 돼요 (나머지는 출고에서 자동 입력)</p>
  <div class="field"><label>상차지</label><select id="db-from">${opts(fromName)}</select>
    <div class="addr-row"><input id="db-from-addr" placeholder="상차지 주소 (확인·수정)" value="${esc(fromAddr)}"><button type="button" data-act="db-search" data-t="from">주소검색</button></div>
    <input id="db-from-phone" placeholder="상차지 연락처 (직접 입력·자동저장)" value="${esc(fromPhone)}" type="tel" inputmode="tel" style="width:100%;margin-top:8px;padding:12px 13px;border-radius:11px;background:var(--surface-2);color:var(--ink);border:0"></div>
  <div class="field"><label>하차지 <span style="color:var(--faint);font-weight:400">선택 또는 직접 입력</span></label>
    <input id="db-to" list="db-places" value="${esc(toName || '')}" placeholder="하차지 (거래처 선택 또는 직접 입력)" autocomplete="off" style="width:100%;padding:12px 13px;border-radius:11px;background:var(--surface-2);color:var(--ink);border:0">
    <datalist id="db-places">${places.map((p) => `<option value="${esc(p.name)}"></option>`).join('')}</datalist>
    <div class="addr-row"><input id="db-to-addr" placeholder="하차지 주소 (확인·수정)" value="${esc(toAddr)}"><button type="button" data-act="db-search" data-t="to">주소검색</button></div>
    <input id="db-to-phone" placeholder="하차지 연락처 (직접 입력·자동저장)" value="${esc(toPhone)}" type="tel" inputmode="tel" style="width:100%;margin-top:8px;padding:12px 13px;border-radius:11px;background:var(--surface-2);color:var(--ink);border:0"></div>
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
  if (isDesk()) return sheetDocDesk(sh);
  const hasDispatch = sh.dispatchVia || sh.driverName || sh.driverPhone || sh.vehicle || sh.freight || sh.payment;
  const hasAddr = sh.loadAddr || sh.unloadAddr || sh.loadPlace || sh.unloadPlace;
  const isCourier = sh.method === '택배';
  return `<div class="grab"></div>
  <div class="dochdr"><h2 style="margin:0">출고 상세</h2>
    <button class="iconbtn" type="button" data-act="edit-ship" data-id="${sh.id}" aria-label="출고 수정">${I.pen}</button></div>
  ${shipStepper(sh)}
  <p class="hint" style="text-align:center;margin-top:-8px">단계를 눌러 상태 변경</p>
  <div class="doc">
    <h3>${esc(sh.client || '거래처 미지정')}</h3>
    <div class="docsub" style="margin-bottom:12px">출고일 ${esc(sh.date)}${isCourier ? ' · 택배' : ''}</div>
    ${(state.docEditLines && slId === sh.id) ? shipLinesEditor(sh) : `
    <div class="ilines">
      ${S.shipLines(sh).map((l) => {
        const ep = effPrice(l, sh);
        const price = ep.price;
        const amt = (Number(l.qty) || 0) * price;
        const lwh = l.warehouse || sh.warehouse;
        const it = S.getItems().find((x) => x.name === l.name && x.warehouse === lwh);
        const pcs = (it && Number(it.perBox) > 0 && (l.unit === '박스' || l.unit === 'plt' || l.unit === '파렛트')) ? ` <span class="il-pcs">${(Number(l.qty) * Number(it.perBox)).toLocaleString()}개</span>` : '';
        return `<div class="iline">
          <div class="il-l"><div class="il-nm">${esc(l.name || '(미지정)')}</div>
            <div class="il-sub">${whTag(lwh)}${l.spec ? `<span>${esc(l.spec)}</span>` : ''}</div></div>
          <div class="il-r">
            <div class="il-qty">${l.qty}${esc(l.unit || '')}${pcs}</div>
            <div class="il-price ${price > 0 ? '' : 'nop'}">${price > 0 ? price.toLocaleString() + '원' : '단가 미정'}${ep.src ? ` <span class="il-src">${esc(ep.src)}</span>` : ''}</div>
            ${amt > 0 ? `<div class="il-amt">${amt.toLocaleString()}원</div>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
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
    <div class="kv" style="margin-top:10px"><span>명세서</span><span class="pill ${sh.docDone ? 'done' : 'low'}">${sh.docDone ? `발행완료${sh.docBy ? ' · ' + esc(sh.docBy) : ''}` : '미발행'}</span></div>
  </div>
  ${(() => {
    const cliPhone = (S.findPartner(sh.client) || {}).phone || '';
    const calls = sh.calls || [];
    return `<div class="sec-title">거래처 연락 <span style="color:var(--faint);font-weight:400;font-size:13px">영업 대신 전화</span></div>
    ${cliPhone
      ? `<a class="btn" href="${telHref(cliPhone)}" data-act="ship-call" data-id="${sh.id}">${I.phone} 거래처 전화걸기 · ${esc(cliPhone)}</a>`
      : `<button class="btn ghost" type="button" data-act="ship-addphone" data-id="${sh.id}">거래처 전화번호 등록</button>`}
    ${calls.length ? `<div class="card" style="padding:4px 14px;margin-top:8px">${calls.slice().reverse().map((c) => `<div class="kv"><span>${esc(c)} 통화</span><b>✓</b></div>`).join('')}</div>` : ''}`;
  })()}
  <div class="sec-title">보류 ${sh.holdReason ? '' : '<span style="color:var(--faint);font-weight:400;font-size:13px">몰라서 막혔을 때</span>'}</div>
  ${sh.holdReason
    ? `<div class="kv" style="margin-bottom:8px"><span>사유</span><span class="pill out">${esc(sh.holdReason)}</span></div>
       <button class="btn ghost" type="button" data-act="unhold" data-id="${sh.id}" data-kind="ship">보류 해제</button>`
    : `<div class="holdseg">${HOLD_REASONS.map((r) => `<button type="button" data-act="hold" data-id="${sh.id}" data-kind="ship" data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div>`}
  ${sh.status === '출고예정' && !isCourier ? `<button class="btn" type="button" data-act="copy-dispatch" data-id="${sh.id}" style="margin-top:14px">배차 요청 양식 만들기</button>
    <button class="btn ghost" type="button" data-act="dispatch-paste" data-id="${sh.id}" style="margin-top:8px">배차 완료</button>` : ''}
  ${sh.status === '배차완료' && !isCourier ? `<button class="btn ghost" type="button" data-act="dispatch-paste" data-id="${sh.id}">배차 정보 다시 붙여넣기</button>` : ''}
  ${sh.status === '출고완료' ? `<button class="btn ${sh.docDone ? 'ghost' : ''}" type="button" data-act="toggle-doc" data-id="${sh.id}">${sh.docDone ? '명세서 발행됨 · 해제' : '명세서 발행 완료로 표시'}</button>` : ''}
  <button class="btn ghost" type="button" data-act="print-ship" data-id="${sh.id}" style="margin-top:8px">출력 / PDF (A4 전표)</button>
  <button class="btn danger" type="button" data-act="del-ship" data-id="${sh.id}">삭제</button>`;
}

// A4 출고 전표 (벽에 붙일 큰 글씨) — 거래처 숨김 옵션
function sheetPrint(id) {
  const sh = S.getShipments().find((s) => s.id === id);
  if (!sh) return '';
  const hide = !!state.printHide;
  const lines = S.shipLines(sh);
  const goods = lines.map((l) => {
    const it = S.getItems().find((x) => x.name === l.name && x.warehouse === (l.warehouse || sh.warehouse));
    const pcs = (it && Number(it.perBox) > 0 && (l.unit === '박스' || l.unit === 'plt' || l.unit === '파렛트')) ? ` (${(Number(l.qty) * Number(it.perBox)).toLocaleString()}개)` : '';
    return `${esc(l.name)} <b>${l.qty}${esc(l.unit)}</b>${pcs}`;
  }).join('<br>');
  const row = (k, v) => v ? `<tr><th>${k}</th><td>${v}</td></tr>` : '';
  const client = hide ? '홈트레이더스' : esc(sh.client || '-');
  const unload = hide ? '' : esc(sh.unloadPlace || sh.client || '');
  return `<div class="grab"></div><h2>${I.doc} A4 출고 전표</h2>
  <p class="hint">벽에 붙일 큰 글씨 전표예요. 아래 <b>인쇄</b>로 프린터 출력 또는 <b>PDF 저장</b> 가능.</p>
  <button type="button" class="tgl ${hide ? 'on' : ''}" data-act="print-hide" data-id="${id}" style="width:100%;margin-bottom:12px">거래처 숨김 (홈트레이더스로 표기)</button>
  <div class="printarea">
    <div class="pr-title">출 고 전 표</div>
    <div class="pr-date">${esc(sh.date)}${sh.time ? ` &nbsp; ${esc(sh.time)}` : ''}</div>
    <table class="pr-tbl">
      ${row('거래처', `<big>${client}</big>`)}
      ${row('품목', goods)}
      ${row('상차지', `${esc(sh.loadPlace || sh.warehouse || '')}${sh.loadAddr ? `<br><span class="pr-sub">${esc(sh.loadAddr)}</span>` : ''}`)}
      ${row('하차지', unload ? `${unload}${sh.unloadAddr ? `<br><span class="pr-sub">${esc(sh.unloadAddr)}</span>` : ''}` : (hide ? '<span class="pr-sub">— 비공개 —</span>' : ''))}
      ${row('기사님', sh.driverName ? `${esc(sh.driverName)}${sh.driverPhone ? ` &nbsp; ${esc(sh.driverPhone)}` : ''}` : '')}
      ${row('차량', esc(sh.vehicle || ''))}
      ${row('운임', sh.freight ? `${Number(sh.freight).toLocaleString()}원${sh.payment ? ` · ${esc(sh.payment)}` : ''}` : '')}
      ${row('비고', esc(sh.note || ''))}
    </table>
  </div>
  <button class="btn" type="button" data-act="print-now" style="margin-top:14px">인쇄 · PDF 저장</button>
  <button class="btn danger" type="button" data-act="close">닫기</button>`;
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
  return `<div class="grab"></div><h2>${I.bolt} 배차 완료</h2>
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
      <div><label>출고일</label><input name="date" type="date" value="${esc(sh.date)}"></div>
      <div><label>시간 <span style="color:var(--faint);font-weight:400">착/상차</span></label><input name="time" type="time" value="${esc(sh.time || '')}"></div>
    </div></div>
    <div class="field"><div class="row2">
      <div><label>수량</label><input name="qty" type="number" min="0" value="${sh.qty}"></div>
      <div><label>거래처</label><input name="client" value="${esc(sh.client)}"></div>
    </div></div>
    <div class="field"><label>출고 방식</label>
      <div class="seg" id="e-method">
        ${['배차', '택배'].map((m) => `<button type="button" data-v="${m}" class="${(sh.method || '배차') === m ? 'on' : ''}">${m}</button>`).join('')}
      </div></div>
    <div id="e-dispatch-block"${sh.method === '택배' ? ' style="display:none"' : ''}>
      <div class="field"><label>배차 방법 (업체)</label>
        <input name="dispatchVia" list="dispatch-list" value="${esc(sh.dispatchVia || '')}" placeholder="예: 이음물류 · 직접 · 다른 업체" autocomplete="off" style="width:100%;padding:12px 13px;border-radius:11px;background:var(--surface-2);color:var(--ink);border:0">
        <datalist id="dispatch-list">${dispatchList().map((d) => `<option value="${esc(d)}"></option>`).join('')}</datalist></div>
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

// ══════════════════════════════════════════════════════════════
// PC 업무형(ERP) 화면 — 가로 1024px 이상에서만. 모바일은 아래 render() 기존 화면 그대로.
// 데이터·계산·저장은 기존 함수와 data-act 핸들러를 그대로 부르고, 화면 구성만 새로 한다.
// ══════════════════════════════════════════════════════════════
const DESK_MQ = window.matchMedia('(min-width: 1024px)');
const isDesk = () => DESK_MQ.matches;

// 메뉴 — 기초등록 → 영업 → 구매 → 재고 → 설정 순. [route, 이름, act] act 있으면 입력 팝업 실행
const DESK_MENU = [
  ['현황', [['dash', '업무 현황']]],
  ['판매·재고', [['sale', '판매입력 (붙여넣기)'], ['silicone', '실리콘 재고'], ['stock', '재고 현황'], ['', '출고 입력', 'new-ship'], ['ships', '출고 조회'], ['dispatch', '배차 관리'], ['invoices', '거래명세서']]],
  ['매입·문서', [['docread', '문서 인식 (발주서·명세표)'], ['buy', '구매명세서'], ['', '입고 입력', 'add-inbound'], ['inbound', '입고 조회']]],
  ['기타', [['quotes', '견적서 조회'], ['', '견적서 입력', 'add-quote'], ['delivdocs', '납품확인서'], ['partners', '거래처 등록'], ['items', '품목 등록'], ['whs', '창고 등록'], ['ecount', '이카운트 품목 조회'], ['itemmap', '품목 매핑 사전'], ['settings', '환경설정']]],
];
const DESK_TITLES = {};
DESK_MENU.forEach(([g, items]) => items.forEach(([r, l]) => { if (r) DESK_TITLES[r] = [l, g]; }));
// 모바일 route ↔ PC route
const DESK_FROM_MOBILE = { home: 'dash', quote: 'quotes', ship: 'ships', invoice: 'invoices', stock: 'stock', silicone: 'silicone', settings: 'settings' };
const MOBILE_FROM_DESK = { dash: 'home', partners: 'settings', items: 'quote', whs: 'settings', ecount: 'quote', itemmap: 'quote', quotes: 'quote',
  ships: 'ship', dispatch: 'home', invoices: 'invoice', inbound: 'stock', buy: 'invoice', stock: 'stock', silicone: 'silicone', settings: 'settings',
  docread: 'home', delivdocs: 'home' };
function deskRoute(r) {
  if (DESK_TITLES[r]) return r;
  if (r === 'quote') { const t = state.quoteTab; state.quoteTab = 'quote'; return t === 'price' ? 'items' : t === 'ecount' ? 'ecount' : t === 'map' ? 'itemmap' : 'quotes'; }
  if (r === 'invoice' && state.invoiceTab === 'buy') { state.invoiceTab = 'pending'; return 'buy'; }
  return DESK_FROM_MOBILE[r] || 'dash';
}
function mobileFromDesk() {
  const r = state.route;
  if (r === 'items') state.quoteTab = 'price';
  if (r === 'ecount') state.quoteTab = 'ecount';
  if (r === 'itemmap') state.quoteTab = 'map';
  if (r === 'quotes') state.quoteTab = 'quote';
  if (r === 'buy') state.invoiceTab = 'buy';
  state.route = MOBILE_FROM_DESK[r] || 'home';
}

// ── 공통 조각 ─────────────────────────────────────
const eN = (v) => { const n = Number(v) || 0; return n ? n.toLocaleString() : ''; };
const eAddDays = (ds, n) => { const [y, m, d] = ds.split('-').map(Number); const t = new Date(y, m - 1, d + n); return dstr(t.getFullYear(), t.getMonth() + 1, t.getDate()); };
const eHas = (hay, q) => !q || String(hay || '').toLowerCase().includes(String(q).toLowerCase());
// 출고 금액 — 출고 상세(sheetDoc)와 같은 식: 라인 단가×수량 합, 부가세는 합계의 10%
function eAmt(s) {
  const sup = S.shipLines(s).reduce((a, l) => a + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);
  const vat = Math.round(sup * 0.1);
  return { sup, vat, tot: sup + vat };
}
const eNoPrice = (s) => S.shipLines(s).some((l) => effPrice(l, s).price <= 0);
function eShipBadge(s) {
  if (s.status === '출고예정') return s.method === '택배' ? '<span class="e-b gray">출고예정</span>' : '<span class="e-b orange">배차필요</span>';
  if (s.status === '배차완료') return '<span class="e-b blue">배차완료</span>';
  if (s.status === '출고완료') return '<span class="e-b green">출고완료</span>';
  return `<span class="e-b gray">${esc(s.status)}</span>`;
}
function eDocBadge(s) {
  if (s.status !== '출고완료') return '<span class="e-b ghost">-</span>';
  return s.docDone ? `<span class="e-b green">발행${s.docBy ? ' · ' + esc(s.docBy) : ''}</span>` : '<span class="e-b red">미발행</span>';
}
function eStockBadge(it) {
  if ((it.note || '').includes('확인')) return '<span class="e-b red">확인</span>';
  const st = S.stockStatus(it);
  return st === 'out' ? '<span class="e-b red">품절</span>' : st === 'low' ? '<span class="e-b orange">부족</span>' : '<span class="e-b green">정상</span>';
}
const eSite = (s) => (s.unloadPlace && s.unloadPlace !== s.client) ? s.unloadPlace : (s.unloadAddr || '');
function eRoute(s) {
  const whAddr = (S.getWarehouses().find((w) => w.name === s.warehouse) || {}).address || '';
  const clAddr = (S.findPartner(s.client) || {}).address || '';
  const fr = region(s.loadAddr || whAddr, s.loadPlace || s.warehouse);
  const to = region(s.unloadAddr || clAddr, s.unloadPlace || s.client);
  return (fr || to) ? `${fr || '-'} → ${to || '-'}` : '';
}
let _ecMap = null;   // 이카운트 품목명 → 코드
const ecountCode = (name) => { if (!_ecMap) _ecMap = new Map(ECOUNT_ITEMS.map(([c, n]) => [n, c])); return _ecMap.get((name || '').trim()) || ''; };

// 필터/정렬/선택 상태 (화면별)
state.eF = state.eF || {};
state.eSort = state.eSort || {};
state.eClosed = state.eClosed || {};
if (state.eClosed['기타'] === undefined) state.eClosed['기타'] = true;   // 기초·설정은 기본 접힘 (자주 안 씀)
let eSel = { route: '', ids: new Set() };
let eLast = null;   // 마지막으로 그린 표 (엑셀 저장용)
function eFilter(route, defaults) { state.eF[route] = { ...defaults, ...(state.eF[route] || {}) }; return state.eF[route]; }
function eSortRows(route, cols, rows) {
  const so = state.eSort[route]; if (!so) return rows;
  const col = cols.find((c) => c.k === so.k); if (!col) return rows;
  const val = col.sv || ((r) => String(col.v(r)).replace(/<[^>]*>/g, ''));
  return rows.slice().sort((a, b) => {
    const x = val(a), y = val(b);
    const r = (typeof x === 'number' && typeof y === 'number') ? x - y : String(x).localeCompare(String(y), 'ko', { numeric: true });
    return so.d === 'desc' ? -r : r;
  });
}

// 검색조건 줄 — fields: [{label, html, grow}]
const eCond = (fields) => `<div class="e-cond">${fields.map((f) => `<div class="e-cf ${f.grow ? 'grow' : ''}"><label>${f.label}</label><div class="v">${f.html}</div></div>`).join('')}</div>`;
const eIn = (k, v, cls = 'w-m', ph = '', list = '') => `<input class="e-in ${cls}" data-f="${k}" value="${esc(v || '')}" placeholder="${esc(ph)}" ${list ? `list="${list}"` : ''} autocomplete="off">`;
const eDate = (k, v) => `<input class="e-in w-date" type="date" data-f="${k}" value="${esc(v || '')}">`;
const eSel2 = (k, v, opts) => `<select class="e-sel" data-f="${k}">${opts.map((o) => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(lab)}</option>`; }).join('')}</select>`;
const eBtn = (label, act, extra = '', cls = '') => `<button class="e-btn ${cls}" type="button" data-act="${act}" ${extra}>${label}</button>`;
const eKey = (k) => `<span class="k">${k}</span>`;
function eStdTools(opts = {}) {
  const sel = opts.bulk ? `<span class="sep"></span><span class="e-selinfo">선택 <b id="e-selcnt">${eSel.ids.size}</b>건</span>${opts.bulk}` : '';
  return `<div class="e-tools">
    ${eBtn(`조회 ${eKey('F8')}`, 'erp-q', '', 'pri')}
    ${opts.newAct ? eBtn(`신규 ${eKey('F2')}`, opts.newAct) : ''}
    ${opts.extra || ''}
    ${eBtn('엑셀', 'erp-excel')}${eBtn('새로고침', 'erp-reload')}
    ${sel}<span class="sp"></span>${eBtn('조건 초기화', 'erp-reset')}
  </div>`;
}
const eTabs = (key, tabs) => `<div class="e-tabs">${tabs.map(([v, l, n]) => `<button class="e-tab ${state[key] === v ? 'on' : ''}" type="button" data-act="erp-tab" data-k="${key}" data-v="${v}">${l}${n != null ? `<span class="n">${n}</span>` : ''}</button>`).join('')}</div>`;

// 표 — cols: [{k, h, w, cls, v(row)→html, sv(row)→정렬값, csv(row)→엑셀값}]
function eTable(o) {
  const { route, cols, rows, rowAttr, sel, foot, empty, title, maxH } = o;
  const so = state.eSort[route] || {};
  const ids = sel && eSel.route === route ? eSel.ids : new Set();
  if (sel && eSel.route !== route) eSel = { route, ids: new Set() };
  if (!o.noExport) eLast = { title: title || (DESK_TITLES[route] || [''])[0], cols, rows };
  const allOn = sel && rows.length && rows.every((r) => ids.has(r.id));
  const th = (c) => `<th class="${c.cls || ''} ${o.noSort ? '' : 'srt'}" ${o.noSort ? '' : `data-act="erp-sort" data-r="${route}" data-k="${c.k}"`}>${c.h}${so.k === c.k ? `<span class="ar">${so.d === 'desc' ? '▼' : '▲'}</span>` : ''}</th>`;
  return `<div class="e-tw ${o.auto ? 'auto' : ''}" ${maxH ? `style="max-height:${maxH}"` : ''}><table class="e-tbl">
    <colgroup>${sel ? '<col style="width:30px">' : ''}<col style="width:38px">${cols.map((c) => `<col ${c.w ? `style="width:${c.w}px"` : ''}>`).join('')}</colgroup>
    <thead><tr>${sel ? `<th class="chk"><input type="checkbox" data-act="erp-selall" ${allOn ? 'checked' : ''} aria-label="전체 선택"></th>` : ''}<th>No</th>${cols.map(th).join('')}</tr></thead>
    <tbody>${rows.length ? rows.map((r, i) => `<tr class="${rowAttr ? 'ck' : ''} ${ids.has(r.id) ? 'sel' : ''}" tabindex="0" ${rowAttr ? rowAttr(r) : ''}>
      ${sel ? `<td class="chk"><input type="checkbox" data-act="erp-sel" data-id="${esc(r.id)}" ${ids.has(r.id) ? 'checked' : ''}></td>` : ''}<td class="no">${i + 1}</td>
      ${cols.map((c) => { const h = c.v(r); const tt = String(h).replace(/<[^>]*>/g, '').trim(); return `<td class="${c.cls || ''}"${tt.length > 14 ? ` title="${tt.replace(/"/g, '&quot;')}"` : ''}>${h}</td>`; }).join('')}</tr>`).join('')
      : `<tr><td colspan="${cols.length + (sel ? 2 : 1)}" class="e-empty">${empty || '조회된 내역이 없습니다.'}</td></tr>`}</tbody>
    ${foot ? `<tfoot><tr>${sel ? '<td></td>' : ''}<td></td>${foot}</tr></tfoot>` : ''}
  </table></div>`;
}
const ePage = (inner, cls = '') => `<div class="e-body ${cls}">${inner}</div>`;

// ── 헤더 · 메뉴 ───────────────────────────────────
function deskTop() {
  const n = stuckItems().total;
  return `<header class="e-top">
    <div class="e-brand"><img src="./icons/favicon.png" alt=""><b>홈트레이더스 재고·출고</b></div>
    <div class="e-corp">주식회사 홈트레이더스</div>
    <div class="e-quick">
      <button type="button" data-act="new-ship">${I.plus}출고 입력</button>
      <button type="button" data-act="add-inbound">입고 입력</button>
      <button type="button" data-act="add-quote">견적 입력</button>
      <button type="button" data-act="smart">붙여넣기 인식</button>
      <button type="button" data-act="briefing">출고 공지</button>
    </div>
    <div class="e-tr">
      <button type="button" class="e-bell" data-act="checklist" title="확인 필요">${I.bell}확인 필요${n ? `<span class="cnt">${n}</span>` : ''}</button>
      <span class="e-sep"></span>
      <span class="e-user">${esc(myName())}</span>
      <button type="button" data-act="erp-nav" data-r="settings">환경설정</button>
      <button type="button" data-act="logout">로그아웃</button>
    </div>
  </header>`;
}
function deskSide() {
  const ships = S.getShipments();
  const cnt = { dispatch: ships.filter((s) => s.status === '출고예정').length, invoices: ships.filter((s) => s.status === '출고완료' && !s.docDone).length, quotes: S.quotesPending() };
  return `<nav class="e-side">${DESK_MENU.map(([g, items]) => `<div class="e-grp ${state.eClosed[g] ? 'closed' : ''}">
    <button class="e-grp-hd" type="button" data-act="erp-grp" data-g="${g}"><span>${g}</span><span class="car">${state.eClosed[g] ? '▶' : '▼'}</span></button>
    <div class="e-grp-items">${items.map(([r, l, act]) => act
      ? `<button class="e-mi" type="button" data-act="${act}"><span>${l}</span><span class="act">＋</span></button>`
      : `<button class="e-mi ${state.route === r ? 'on' : ''}" type="button" data-act="erp-nav" data-r="${r}"><span>${l}</span>${cnt[r] ? `<span class="n ${r === 'invoices' ? 'hot' : ''}">${cnt[r]}</span>` : ''}</button>`).join('')}</div></div>`).join('')}</nav>`;
}
const ePhead = (title, grp) => `<div class="e-phead"><h1>${esc(title)}</h1><span class="e-crumb">${esc(grp)} › ${esc(title)}</span><span class="sp"></span>
  <span class="e-keys"><kbd>F2</kbd>신규<kbd>F8</kbd>조회<kbd>↑↓</kbd>행 이동<kbd>Enter</kbd>열기<kbd>/</kbd>검색</span></div>`;

// ── 화면: 업무 현황 ───────────────────────────────
function deskDash() {
  const ships = S.getShipments(); const today = S.todayStr();
  const need = ships.filter((s) => s.status === '출고예정').sort((a, b) => (a.date || '9').localeCompare(b.date || '9'));
  const ready = ships.filter((s) => s.status === '배차완료').sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
  const doneToday = ships.filter((s) => s.status === '출고완료' && (s.doneAt || s.date) === today);
  const docPend = ships.filter((s) => s.status === '출고완료' && !s.docDone).sort((a, b) => (a.doneAt || a.date).localeCompare(b.doneAt || b.date));
  const quotes = S.getQuotes().filter((q) => q.status === '견적대기').sort((a, b) => a.date.localeCompare(b.date));
  const outs = S.getItems().filter((it) => S.stockStatus(it) === 'out');
  const stuck = stuckItems();
  const needRel = (d) => { const n = daysSince(d); return n === 0 ? '오늘' : n === -1 ? '내일' : n < 0 ? `${-n}일 후` : `<span class="red">${n}일 지연</span>`; };
  const kpi = [
    ['배차 요청', need.length, 'data-act="erp-nav" data-r="dispatch" data-set="eDispTab=need"'],
    ['오늘 출고 (배차완료)', ready.length, 'data-act="erp-nav" data-r="dispatch" data-set="eDispTab=ready"'],
    ['오늘 출고완료', doneToday.length, 'data-act="erp-nav" data-r="dispatch" data-set="eDispTab=done"'],
    ['명세서 미발행', docPend.length, 'data-act="erp-nav" data-r="invoices" data-set="eInvTab=pending"', true],
    ['견적 대기', quotes.length, 'data-act="erp-nav" data-r="quotes"'],
    ['확인 필요', stuck.total, 'data-act="checklist"', true],
    ['품절 품목', outs.length, 'data-act="erp-nav" data-r="stock" data-preset="stock.status=out"', true],
  ];
  const panel = (title, n, tools, table) => `<div class="e-panel"><div class="e-panel-hd"><b>${title}</b><span class="n">${n}건</span><span class="sp"></span>${tools}</div>${table}</div>`;
  const shipAttr = (s) => `data-act="ship" data-id="${s.id}"`;
  const t1 = eTable({ route: 'dash-need', noSort: true, noExport: true, rows: need, rowAttr: shipAttr, empty: '배차 요청할 건이 없습니다.', cols: [
    { k: 'date', h: '출고일', w: 84, cls: 'c', v: (s) => esc(mdDow(s.date)) },
    { k: 'rel', h: '경과', w: 70, cls: 'c', v: (s) => s.date ? needRel(s.date) : '<span class="muted">미정</span>' },
    { k: 'client', h: '거래처', v: (s) => esc(s.client || '(미지정)') },
    { k: 'item', h: '품목', v: (s) => esc(shipSummary(s).itemLabel) },
    { k: 'qty', h: '수량', w: 60, cls: 'n', v: (s) => esc(shipSummary(s).qtyLabel) },
    { k: 'wh', h: '창고', w: 60, cls: 'c', v: (s) => esc(whShort(s.warehouse || '')) },
  ] });
  const t2 = eTable({ route: 'dash-ready', noSort: true, noExport: true, rows: ready, rowAttr: shipAttr, empty: '배차 완료된 건이 없습니다.', cols: [
    { k: 'd', h: '출고일', w: 84, cls: 'c', v: (s) => esc(mdDow(s.date)) + (s.time ? ` ${esc(s.time)}` : '') },
    { k: 'client', h: '거래처', v: (s) => esc(s.client || '(미지정)') },
    { k: 'item', h: '품목', v: (s) => esc(shipSummary(s).itemLabel) },
    { k: 'drv', h: '기사', w: 110, v: (s) => s.method === '택배' ? esc(s.courier || '택배') : `${esc(s.driverName || '')}${s.driverPhone ? ` <a class="tel" href="${telHref(s.driverPhone)}">${esc(s.driverPhone)}</a>` : ''}` },
    { k: 'act', h: '처리', w: 74, cls: 'c', v: (s) => `<button class="e-btn sm" type="button" data-act="mark-done" data-id="${s.id}">출고완료</button>` },
  ] });
  const t3 = eTable({ route: 'dash-doc', noSort: true, noExport: true, rows: docPend, rowAttr: shipAttr, empty: '미발행 명세서가 없습니다.', cols: [
    { k: 'd', h: '출고완료', w: 84, cls: 'c', v: (s) => esc(mdDow(s.doneAt || s.date)) },
    { k: 'ago', h: '경과', w: 60, cls: 'c', v: (s) => { const n = daysSince(s.doneAt || s.date); return n >= 1 ? `<span class="red">${n}일</span>` : '오늘'; } },
    { k: 'client', h: '거래처', v: (s) => esc(s.client || '(미지정)') },
    { k: 'item', h: '품목', v: (s) => esc(shipSummary(s).itemLabel) },
    { k: 'tot', h: '합계', w: 90, cls: 'n', v: (s) => eN(eAmt(s).tot) || '<span class="red">단가확인</span>' },
    { k: 'act', h: '처리', w: 62, cls: 'c', v: (s) => `<button class="e-btn sm" type="button" data-act="doc-done" data-id="${s.id}">발행</button>` },
  ] });
  const t4 = eTable({ route: 'dash-quote', noSort: true, noExport: true, rows: quotes, rowAttr: (q) => `data-act="quote-open" data-id="${q.id}"`, empty: '받은 견적요청이 없습니다.', cols: [
    { k: 'd', h: '접수일', w: 84, cls: 'c', v: (q) => esc(mdDow(q.date)) },
    { k: 'st', h: '경과', w: 80, cls: 'c', v: (q) => daysSince(q.date) >= 2 ? `<span class="red">${pendingLabel(q.date)}</span>` : esc(pendingLabel(q.date)) },
    { k: 'client', h: '거래처', w: 130, v: (q) => esc(q.client || '(미지정)') },
    { k: 'c', h: '요청 내용', v: (q) => esc(q.content || '') },
  ] });
  return ePage(`
    <div class="e-kpi">${kpi.map(([k, v, attr, hot]) => `<button type="button" ${attr}><span class="k">${k}</span><span class="v ${hot && v ? 'hot' : ''}">${v}<small>건</small></span></button>`).join('')}</div>
    <div class="e-tools">${eBtn(`출고 입력 ${eKey('F2')}`, 'new-ship', '', 'pri')}${eBtn('붙여넣기 인식', 'smart')}${eBtn('오늘 출고 공지', 'briefing')}${eBtn('입고 입력', 'add-inbound')}${eBtn('견적 입력', 'add-quote')}<span class="sp"></span>${eBtn('새로고침', 'erp-reload')}</div>
    <div class="e-panels">
      ${panel('배차 요청 (출고예정)', need.length, eBtn('배차 관리', 'erp-nav', 'data-r="dispatch" data-set="eDispTab=need"', 'sm'), t1)}
      ${panel('오늘 출고 (배차완료)', ready.length, eBtn('배차 관리', 'erp-nav', 'data-r="dispatch" data-set="eDispTab=ready"', 'sm'), t2)}
      ${panel('명세서 미발행', docPend.length, eBtn('거래명세서', 'erp-nav', 'data-r="invoices"', 'sm'), t3)}
      ${panel('견적 요청 (대기)', quotes.length, eBtn('견적서 조회', 'erp-nav', 'data-r="quotes"', 'sm'), t4)}
    </div>`);
}

// ── 화면: 출고 조회 ───────────────────────────────
function deskShips() {
  state.eShipView = state.eShipView || 'list';
  const tabs = eTabs('eShipView', [['list', '목록'], ['cal', '달력']]);
  if (state.eShipView === 'cal') {
    return ePage(`${tabs}<div class="e-tools">${eBtn(`출고 입력 ${eKey('F2')}`, 'new-ship', '', 'pri')}${eBtn('붙여넣기 인식', 'smart')}</div>
      <div class="e-legacy e-calwrap"><div>${calendarHTML()}</div><div>${dayDetailHTML()}</div></div>`, 'scroll');
  }
  const today = S.todayStr();
  const f = eFilter('ships', { from: eAddDays(today, -30), to: '', client: '', status: '', wh: '', doc: '', item: '', q: '' });
  let rows = S.getShipments().filter((s) => {
    if (f.from && (s.date || '') < f.from) return false;
    if (f.to && (s.date || '') > f.to) return false;
    if (f.status && s.status !== f.status) return false;
    if (f.wh && s.warehouse !== f.wh) return false;
    if (f.doc === 'pending' && !(s.status === '출고완료' && !s.docDone)) return false;
    if (f.doc === 'issued' && !s.docDone) return false;
    if (!eHas(s.client, f.client)) return false;
    if (f.item && !S.shipLines(s).some((l) => eHas(l.name, f.item))) return false;
    if (f.q && !eHas([s.note, s.driverName, s.driverPhone, s.vehicle, s.unloadPlace, s.unloadAddr, s.trackingNo, s.courier, s.dispatchVia].join(' '), f.q)) return false;
    return true;
  });
  const cols = [
    { k: 'date', h: '출고일', w: 94, cls: 'c', v: (s) => esc((s.date || '').slice(5)) + (s.time ? ` <span class="muted">${esc(s.time)}</span>` : ''), sv: (s) => (s.date || '') + (s.time || ''), csv: (s) => `${s.date || ''} ${s.time || ''}`.trim() },
    { k: 'client', h: '거래처', w: 120, v: (s) => esc(s.client || '(미지정)') },
    { k: 'site', h: '현장 / 하차지', w: 140, v: (s) => esc(eSite(s)) },
    { k: 'item', h: '품목', v: (s) => esc(shipSummary(s).itemLabel), csv: (s) => S.shipLines(s).map((l) => `${l.name} ${l.qty}${l.unit || ''}`).join(' / ') },
    { k: 'qty', h: '수량', w: 56, cls: 'n', v: (s) => esc(shipSummary(s).qtyLabel) },
    { k: 'sup', h: '공급가', w: 94, cls: 'n', v: (s) => eN(eAmt(s).sup) || (eNoPrice(s) ? '<span class="red">단가확인</span>' : ''), sv: (s) => eAmt(s).sup, csv: (s) => eAmt(s).sup },
    { k: 'tot', h: '합계', w: 94, cls: 'n', v: (s) => eN(eAmt(s).tot), sv: (s) => eAmt(s).tot, csv: (s) => eAmt(s).tot },
    { k: 'wh', h: '창고', w: 52, cls: 'c', v: (s) => esc(whShort(s.warehouse || '')) },
    { k: 'drv', h: '배차 / 기사', w: 130, v: (s) => s.method === '택배' ? `<span class="e-b gray">택배</span> ${esc([s.courier, s.trackingNo].filter(Boolean).join(' '))}` : esc([s.dispatchVia, s.driverName].filter(Boolean).join(' · ')),
      csv: (s) => (s.method === '택배' ? ['택배', s.courier, s.trackingNo] : [s.dispatchVia, s.driverName]).filter(Boolean).join(' ') },
    { k: 'status', h: '상태', w: 70, cls: 'c', v: eShipBadge, sv: (s) => STAGES.indexOf(s.status), csv: (s) => s.status },
    { k: 'doc', h: '명세서', w: 88, cls: 'c', v: eDocBadge, sv: (s) => (s.status === '출고완료' ? (s.docDone ? 2 : 1) : 0), csv: (s) => (s.status === '출고완료' ? (s.docDone ? '발행' : '미발행') : '') },
    { k: 'note', h: '비고 / 보류', w: 110, v: (s) => s.holdReason ? `<span class="e-b orange">보류 · ${esc(s.holdReason)}</span>` : esc(s.note || ''), csv: (s) => [s.holdReason && '보류:' + s.holdReason, s.note].filter(Boolean).join(' ') },
  ];
  rows = eSortRows('ships', cols, rows);
  const sum = rows.reduce((a, s) => { const m = eAmt(s); a.sup += m.sup; a.tot += m.tot; return a; }, { sup: 0, tot: 0 });
  const whOpts = [['', '전체'], ...S.warehouseNames().map((w) => [w, w])];
  return ePage(`
    ${tabs}
    ${eCond([
      { label: '출고일', html: `${eDate('from', f.from)}<span class="e-tilde">~</span>${eDate('to', f.to)}` },
      { label: '거래처', html: eIn('client', f.client, 'w-m', '거래처명', 'e-dl-partners') },
      { label: '상태', html: eSel2('status', f.status, [['', '전체'], '출고예정', '배차완료', '출고완료']) },
      { label: '창고', html: eSel2('wh', f.wh, whOpts) },
      { label: '명세서', html: eSel2('doc', f.doc, [['', '전체'], ['pending', '미발행'], ['issued', '발행']]) },
      { label: '품목', html: eIn('item', f.item, 'w-m', '품목명 일부') },
      { label: '검색', html: eIn('q', f.q, 'w-l', '비고·기사·주소·송장 등'), grow: true },
    ])}
    <datalist id="e-dl-partners">${S.getPartners().map((p) => `<option value="${esc(p.name)}"></option>`).join('')}</datalist>
    ${eStdTools({ newAct: 'new-ship', extra: eBtn('붙여넣기 인식', 'smart'),
      bulk: `${eBtn('선택 출고완료', 'erp-bulk', 'data-b="done"', 'sm')}${eBtn('선택 명세서 발행', 'erp-bulk', 'data-b="doc"', 'sm')}` })}
    ${eTable({ route: 'ships', cols, rows, sel: true, rowAttr: (s) => `data-act="ship" data-id="${s.id}"`,
      foot: `<td colspan="5" style="text-align:left">합계 ${rows.length.toLocaleString()}건</td><td class="n">${eN(sum.sup)}</td><td class="n">${eN(sum.tot)}</td><td colspan="5"></td>` })}`);
}

// ── 화면: 배차 관리 ───────────────────────────────
function deskDispatch() {
  state.eDispTab = state.eDispTab || 'need';
  const ships = S.getShipments();
  const need = ships.filter((s) => s.status === '출고예정').sort((a, b) => (a.date || '9').localeCompare(b.date || '9'));
  const ready = ships.filter((s) => s.status === '배차완료').sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const done = ships.filter((s) => s.status === '출고완료').sort((a, b) => (b.doneAt || b.date).localeCompare(a.doneAt || a.date));
  const tab = state.eDispTab;
  const rel = (d) => { if (!d) return '<span class="muted">미정</span>'; const n = daysSince(d); return n === 0 ? '오늘' : n === -1 ? '내일' : n < 0 ? `${-n}일 후` : `<span class="red">${n}일 지연</span>`; };
  const base = [
    { k: 'date', h: '출고일', w: 94, cls: 'c', v: (s) => esc(s.date || '') },
    { k: 'client', h: '거래처', w: 130, v: (s) => esc(s.client || '(미지정)') },
    { k: 'route', h: '상차 → 하차', w: 170, v: (s) => esc(eRoute(s)) },
    { k: 'item', h: '품목', v: (s) => esc(shipSummary(s).itemLabel) },
    { k: 'qty', h: '수량', w: 60, cls: 'n', v: (s) => esc(shipSummary(s).qtyLabel) },
  ];
  let cols, rows;
  if (tab === 'need') {
    rows = need;
    cols = [base[0], { k: 'rel', h: '경과', w: 70, cls: 'c', v: (s) => rel(s.date), sv: (s) => -daysSince(s.date) }, ...base.slice(1),
      { k: 'method', h: '방식', w: 46, cls: 'c', v: (s) => esc(s.method || '배차') },
      { k: 'hold', h: '보류', w: 110, v: (s) => s.holdReason ? `<span class="e-b orange">${esc(s.holdReason)}</span>` : '' },
      { k: 'act', h: '처리', w: 176, cls: 'c', v: (s) => s.method === '택배' ? '' : `${eBtn('배차 요청 양식', 'copy-dispatch', `data-id="${s.id}"`, 'sm')}${eBtn('배차 완료', 'dispatch-paste', `data-id="${s.id}"`, 'sm')}` }];
  } else if (tab === 'ready') {
    rows = ready;
    cols = [{ ...base[0], v: (s) => esc(s.date || '') + (s.time ? ` ${esc(s.time)}` : '') }, ...base.slice(1),
      { k: 'via', h: '배차업체', w: 80, v: (s) => esc(s.method === '택배' ? (s.courier || '택배') : s.dispatchVia || '') },
      { k: 'drv', h: '기사', w: 64, v: (s) => esc(s.driverName || s.recvName || '') },
      { k: 'tel', h: '연락처', w: 108, v: (s) => s.driverPhone ? `<a class="tel" href="${telHref(s.driverPhone)}">${esc(s.driverPhone)}</a>` : '' },
      { k: 'veh', h: '차량 / 송장', w: 130, v: (s) => esc(s.method === '택배' ? s.trackingNo || '' : s.vehicle || '') },
      { k: 'fr', h: '운임', w: 76, cls: 'n', v: (s) => eN(s.freight || s.courierFee), sv: (s) => Number(s.freight || s.courierFee) || 0 },
      { k: 'pay', h: '결제', w: 46, cls: 'c', v: (s) => esc(s.payment || '') },
      { k: 'act', h: '처리', w: 74, cls: 'c', v: (s) => eBtn('출고완료', 'mark-done', `data-id="${s.id}"`, 'sm') }];
  } else {
    rows = done;
    cols = [{ k: 'doneAt', h: '출고완료', w: 94, cls: 'c', v: (s) => esc(s.doneAt || s.date || '') }, ...base.slice(1),
      { k: 'drv', h: '기사 / 택배', w: 120, v: (s) => esc(s.method === '택배' ? [s.courier, s.trackingNo].filter(Boolean).join(' ') : [s.driverName, s.vehicle].filter(Boolean).join(' · ')) },
      { k: 'fr', h: '운임', w: 76, cls: 'n', v: (s) => eN(s.freight || s.courierFee), sv: (s) => Number(s.freight || s.courierFee) || 0 },
      { k: 'pay', h: '결제', w: 46, cls: 'c', v: (s) => esc(s.payment || '') },
      { k: 'doc', h: '명세서', w: 92, cls: 'c', v: eDocBadge }];
  }
  rows = eSortRows('dispatch-' + tab, cols, rows);
  return ePage(`
    ${eTabs('eDispTab', [['need', '배차 요청', need.length], ['ready', '배차 완료 (출고 대기)', ready.length], ['done', '출고 완료', done.length]])}
    <div class="e-tools">${eBtn('오늘 출고 공지', 'briefing', '', 'pri')}${eBtn('붙여넣기 인식', 'smart')}${eBtn(`출고 입력 ${eKey('F2')}`, 'new-ship')}
      ${tab === 'ready' ? `<span class="sep"></span><span class="e-selinfo">선택 <b id="e-selcnt">${eSel.ids.size}</b>건</span>${eBtn('선택 출고완료', 'erp-bulk', 'data-b="done"', 'sm')}` : ''}
      <span class="sp"></span>${eBtn('엑셀', 'erp-excel')}${eBtn('새로고침', 'erp-reload')}</div>
    ${eTable({ route: 'dispatch-' + tab, cols, rows, sel: tab === 'ready', rowAttr: (s) => `data-act="ship" data-id="${s.id}"`, title: '배차 관리' })}`);
}

// ── 화면: 거래명세서 ─────────────────────────────
function deskInvoices() {
  state.eInvTab = state.eInvTab || 'pending';
  const all = S.getShipments().filter((s) => s.status === '출고완료');
  const pending = all.filter((s) => !s.docDone);
  const issued = all.filter((s) => s.docDone);
  const tab = state.eInvTab;
  const f = eFilter('invoices', { client: '', from: '', to: '' });
  let rows = (tab === 'pending' ? pending : issued).filter((s) => eHas(s.client, f.client) && (!f.from || (s.doneAt || s.date) >= f.from) && (!f.to || (s.doneAt || s.date) <= f.to))
    .sort((a, b) => (b.doneAt || b.date).localeCompare(a.doneAt || a.date));
  const cols = [
    { k: 'date', h: '출고일', w: 94, cls: 'c', v: (s) => esc(s.date || '') },
    { k: 'doneAt', h: '출고완료', w: 94, cls: 'c', v: (s) => esc(s.doneAt || '') },
    { k: 'client', h: '거래처', w: 140, v: (s) => esc(s.client || '(미지정)') },
    { k: 'site', h: '현장 / 하차지', w: 170, v: (s) => esc(eSite(s)) },
    { k: 'item', h: '품목', v: (s) => esc(shipSummary(s).itemLabel), csv: (s) => S.shipLines(s).map((l) => `${l.name} ${l.qty}${l.unit || ''}`).join(' / ') },
    { k: 'qty', h: '수량', w: 60, cls: 'n', v: (s) => esc(shipSummary(s).qtyLabel) },
    { k: 'sup', h: '공급가', w: 92, cls: 'n', v: (s) => eN(eAmt(s).sup) || (eNoPrice(s) ? '<span class="red">단가확인</span>' : ''), sv: (s) => eAmt(s).sup, csv: (s) => eAmt(s).sup },
    { k: 'vat', h: '세액', w: 80, cls: 'n', v: (s) => eN(eAmt(s).vat), sv: (s) => eAmt(s).vat, csv: (s) => eAmt(s).vat },
    { k: 'tot', h: '합계', w: 92, cls: 'n', v: (s) => eN(eAmt(s).tot), sv: (s) => eAmt(s).tot, csv: (s) => eAmt(s).tot },
    { k: 'wh', h: '창고', w: 60, cls: 'c', v: (s) => esc(whShort(s.warehouse || '')) },
    tab === 'pending'
      ? { k: 'ago', h: '경과', w: 60, cls: 'c', v: (s) => { const n = daysSince(s.doneAt || s.date); return n >= 1 ? `<span class="red">${n}일</span>` : '오늘'; }, sv: (s) => daysSince(s.doneAt || s.date) }
      : { k: 'by', h: '발행자', w: 80, cls: 'c', v: (s) => esc(s.docBy || '') },
    tab === 'pending'
      ? { k: 'act', h: '처리', w: 62, cls: 'c', v: (s) => eBtn('발행', 'doc-done', `data-id="${s.id}"`, 'sm') }
      : { k: 'st', h: '상태', w: 70, cls: 'c', v: eDocBadge },
  ];
  rows = eSortRows('invoices-' + tab, cols, rows);
  const sum = rows.reduce((a, s) => { const m = eAmt(s); a.sup += m.sup; a.vat += m.vat; a.tot += m.tot; return a; }, { sup: 0, vat: 0, tot: 0 });
  return ePage(`
    ${eTabs('eInvTab', [['pending', '미발행', pending.length], ['issued', '발행 완료', issued.length]])}
    ${eCond([
      { label: '출고완료', html: `${eDate('from', f.from)}<span class="e-tilde">~</span>${eDate('to', f.to)}` },
      { label: '거래처', html: eIn('client', f.client, 'w-l', '거래처명', 'e-dl-partners'), grow: true },
    ])}
    <datalist id="e-dl-partners">${S.getPartners().map((p) => `<option value="${esc(p.name)}"></option>`).join('')}</datalist>
    ${eStdTools({ bulk: tab === 'pending' ? eBtn('선택 명세서 발행', 'erp-bulk', 'data-b="doc"', 'sm') : '' })}
    ${eTable({ route: 'invoices-' + tab, cols, rows, sel: tab === 'pending', rowAttr: (s) => `data-act="ship" data-id="${s.id}"`, title: tab === 'pending' ? '거래명세서_미발행' : '거래명세서_발행',
      foot: `<td colspan="6" style="text-align:left">합계 ${rows.length}건</td><td class="n">${eN(sum.sup)}</td><td class="n">${eN(sum.vat)}</td><td class="n">${eN(sum.tot)}</td><td colspan="3"></td>` })}`);
}

// ── 화면: 구매명세서 (매입처별 출고 품목) ───────────
function deskBuy() {
  const g = buyGroups();
  const sups = Object.keys(g).sort();
  const f = eFilter('buy', { sup: '', item: '' });
  const rows = [];
  sups.filter((s) => eHas(s, f.sup)).forEach((sup) => {
    const list = Object.values(g[sup]).filter((r) => eHas(r.name, f.item)).sort((a, b) => a.name.localeCompare(b.name));
    if (!list.length) return;
    rows.push({ grp: true, sup, n: list.length });
    list.forEach((r) => rows.push({ sup, ...r }));
  });
  eLast = { title: '구매명세서', cols: [{ h: '매입처', csv: (r) => r.sup }, { h: '품목', csv: (r) => r.name }, { h: '수량', csv: (r) => r.qty }, { h: '단위', csv: (r) => r.unit }], rows: rows.filter((r) => !r.grp) };
  let no = 0;
  return ePage(`
    ${eCond([{ label: '매입처', html: eIn('sup', f.sup, 'w-m', '매입처명') }, { label: '품목', html: eIn('item', f.item, 'w-l', '품목명 일부'), grow: true }])}
    ${eStdTools({})}
    <p class="hint" style="margin:0;color:var(--e-muted)">출고 품목을 <b>매입처별</b>로 모았어요. 매입처에 보낼 구매명세서를 복사하세요. (구매단가 칸은 다음 단계)</p>
    <div class="e-tw"><table class="e-tbl"><colgroup><col style="width:38px"><col style="width:180px"><col><col style="width:100px"><col style="width:70px"></colgroup>
      <thead><tr><th>No</th><th>매입처</th><th>품목</th><th class="n">수량</th><th>단위</th></tr></thead>
      <tbody>${rows.length ? rows.map((r) => r.grp
        ? `<tr class="grp"><td></td><td colspan="2">${esc(r.sup)} <span style="color:var(--e-muted);font-weight:600">${r.n}품목</span></td><td colspan="2" class="c">${eBtn('구매명세서 복사', 'buy-copy', `data-sup="${esc(r.sup)}"`, 'sm')}</td></tr>`
        : `<tr><td class="no">${++no}</td><td class="muted">${esc(r.sup)}</td><td>${esc(r.name)}</td><td class="n">${eN(r.qty)}</td><td class="c">${esc(r.unit)}</td></tr>`).join('')
        : '<tr><td colspan="5" class="e-empty">출고된 품목이 없습니다.</td></tr>'}</tbody></table></div>`);
}

// ── 화면: 견적서 조회 ─────────────────────────────
function deskQuotes() {
  const f = eFilter('quotes', { status: '', client: '', from: '', to: '', q: '' });
  let rows = S.getQuotes().filter((q) => (!f.status || q.status === f.status) && eHas(q.client, f.client)
    && (!f.from || q.date >= f.from) && (!f.to || q.date <= f.to) && eHas([q.content, q.note, q.phone].join(' '), f.q));
  const cols = [
    { k: 'date', h: '접수일', w: 94, cls: 'c', v: (q) => esc(q.date || '') },
    { k: 'client', h: '거래처', w: 150, v: (q) => esc(q.client || '(미지정)') },
    { k: 'phone', h: '연락처', w: 118, v: (q) => q.phone ? `<a class="tel" href="${telHref(q.phone)}" data-act="quote-call" data-id="${q.id}">${esc(q.phone)}</a>` : '', csv: (q) => q.phone || '' },
    { k: 'content', h: '요청 내용', v: (q) => esc(q.content || '') },
    { k: 'lines', h: '품목', w: 50, cls: 'n', v: (q) => (q.lines || []).length || '', sv: (q) => (q.lines || []).length },
    { k: 'amt', h: '견적금액', w: 100, cls: 'n', v: (q) => eN(quoteTotal(q.lines)), sv: (q) => quoteTotal(q.lines), csv: (q) => quoteTotal(q.lines) },
    { k: 'status', h: '상태', w: 74, cls: 'c', v: (q) => q.status === '견적완료' ? '<span class="e-b green">견적완료</span>' : '<span class="e-b gray">견적대기</span>', csv: (q) => q.status },
    { k: 'ago', h: '경과', w: 84, cls: 'c', v: (q) => q.status === '견적완료' ? '' : (daysSince(q.date) >= 2 ? `<span class="red">${pendingLabel(q.date)}</span>` : esc(pendingLabel(q.date))), sv: (q) => daysSince(q.date) },
    { k: 'call', h: '최근 통화', w: 120, v: (q) => esc((q.calls || []).slice(-1)[0] || '') },
    { k: 'hold', h: '보류', w: 110, v: (q) => q.holdReason ? `<span class="e-b orange">${esc(q.holdReason)}</span>` : '' },
  ];
  rows = eSortRows('quotes', cols, rows);
  const n = (st) => S.getQuotes().filter((q) => !st || q.status === st).length;
  return ePage(`
    ${eCond([
      { label: '접수일', html: `${eDate('from', f.from)}<span class="e-tilde">~</span>${eDate('to', f.to)}` },
      { label: '상태', html: eSel2('status', f.status, [['', `전체 (${n('')})`], ['견적대기', `견적대기 (${n('견적대기')})`], ['견적완료', `견적완료 (${n('견적완료')})`]]) },
      { label: '거래처', html: eIn('client', f.client, 'w-m', '거래처명') },
      { label: '검색', html: eIn('q', f.q, 'w-l', '요청 내용·메모·연락처'), grow: true },
    ])}
    ${eStdTools({ newAct: 'add-quote' })}
    ${eTable({ route: 'quotes', cols, rows, rowAttr: (q) => `data-act="quote-open" data-id="${q.id}"` })}`);
}

// ── 화면: 재고 현황 — 품목별(창고를 열로) / 창고별 상세. 행을 누르면 재고 수불부 ──
function deskStock() {
  if (state.stockWH) { state.eF.stock = { ...(state.eF.stock || {}), wh: state.stockWH }; state.stockWH = null; }
  state.eStockView = state.eStockView || 'item';
  const f = eFilter('stock', { wh: '', cat: '', status: '', q: '' });
  const items = S.getItems();
  const whs = S.getWarehouses();
  const cats = [...new Set(items.map((it) => it.category).filter(Boolean))].sort();
  const match = (it) => (!f.cat || it.category === f.cat) && eHas([it.name, it.aliases, it.supplier, it.note].join(' '), f.q);
  const ledger = (name) => `data-act="erp-ledger" data-name="${esc(name)}"`;
  const qtyHTML = (it) => { const sp = S.stockParts(it); const c = S.currentStock(it); return `<span class="${c <= 0 ? 'red' : ''}">${sp.whole.toLocaleString()}</span>${sp.loose ? `<span class="muted"> +${sp.loose}개</span>` : ''}`; };
  let cols, rows, rowAttr;
  if (state.eStockView === 'item') {
    // 같은 품목명 = 한 줄, 창고마다 열 (이카운트 창고별재고현황 방식)
    const byName = {};
    items.filter(match).forEach((it) => { (byName[it.name] = byName[it.name] || []).push(it); });
    rows = Object.entries(byName).map(([name, list]) => {
      const cur = list.reduce((a, it) => a + S.currentStock(it), 0);
      const res = list.reduce((a, it) => a + S.reservedQty(it), 0);
      const prices = [...new Set(list.map((i) => Number(i.unitPrice) || 0).filter((v) => v > 0))];
      return { id: name, name, list, cur, res, prices, cat: list[0].category || '', unit: (list.find((i) => i.unit) || {}).unit || '',
        pb: (list.find((i) => Number(i.perBox) > 0) || {}).perBox || 0, code: (list.find((i) => i.ecountCode) || {}).ecountCode || ecountCode(name),
        sup: [...new Set(list.map((i) => i.supplier).filter(Boolean))].join(', '), note: list.map((i) => i.note).filter(Boolean).join(' / '),
        st: list.some((i) => (i.note || '').includes('확인')) ? 'chk' : colorStatus(cur) };
    });
    if (f.wh) rows = rows.filter((r) => r.list.some((it) => it.warehouse === f.wh));
    if (f.status) rows = rows.filter((r) => r.st === f.status);
    const whCols = f.wh ? whs.filter((w) => w.name === f.wh) : whs;
    cols = [
      { k: 'cat', h: '구분', w: 60, cls: 'c', v: (r) => esc(r.cat) },
      { k: 'name', h: '품목', v: (r) => `<b>${esc(r.name)}</b>`, csv: (r) => r.name },
      { k: 'code', h: '품목코드', w: 116, v: (r) => `<span class="muted">${esc(r.code)}</span>`, csv: (r) => r.code },
      { k: 'unit', h: '단위', w: 50, cls: 'c', v: (r) => esc(r.unit) },
      ...whCols.map((w) => ({ k: 'wh:' + w.name, h: esc(whShort(w.name)), w: 76, cls: 'n',
        v: (r) => { const it = r.list.find((i) => i.warehouse === w.name); return it ? qtyHTML(it) : '<span class="muted">·</span>'; },
        sv: (r) => { const it = r.list.find((i) => i.warehouse === w.name); return it ? S.currentStock(it) : -1e9; },
        csv: (r) => { const it = r.list.find((i) => i.warehouse === w.name); return it ? Math.floor(S.currentStock(it)) : ''; } })),
      { k: 'cur', h: '재고 합계', w: 80, cls: 'n', v: (r) => `<b class="${r.cur <= 0 ? 'red' : ''}">${Math.floor(r.cur).toLocaleString()}</b>`, sv: (r) => r.cur, csv: (r) => Math.floor(r.cur) },
      { k: 'res', h: '출고예정', w: 70, cls: 'n', v: (r) => eN(Math.round(r.res)), sv: (r) => r.res },
      { k: 'av', h: '가용', w: 64, cls: 'n', v: (r) => { const a = Math.floor(r.cur - r.res); return a < 0 ? `<span class="red">${a.toLocaleString()}</span>` : a.toLocaleString(); }, sv: (r) => r.cur - r.res },
      { k: 'price', h: '판매단가', w: 84, cls: 'n', v: (r) => r.prices.length === 1 ? r.prices[0].toLocaleString() : r.prices.length ? '<span class="muted">창고별 상이</span>' : '', sv: (r) => r.prices[0] || 0 },
      { k: 'sup', h: '매입처', w: 84, v: (r) => esc(r.sup) },
      { k: 'note', h: '비고', w: 120, v: (r) => r.note.includes('확인') ? `<span class="red">${esc(r.note)}</span>` : esc(r.note) },
      { k: 'st', h: '상태', w: 54, cls: 'c', v: (r) => r.st === 'chk' ? '<span class="e-b red">확인</span>' : r.st === 'out' ? '<span class="e-b red">품절</span>' : r.st === 'low' ? '<span class="e-b orange">부족</span>' : '<span class="e-b green">정상</span>',
        sv: (r) => ({ chk: -1, out: 0, low: 1, ok: 2 }[r.st]), csv: (r) => ({ chk: '확인', out: '품절', low: '부족', ok: '정상' }[r.st]) },
    ];
    rowAttr = (r) => ledger(r.name);
  } else {
    rows = items.filter((it) => match(it) && (!f.wh || it.warehouse === f.wh) && (!f.status || S.stockStatus(it) === f.status));
    const avail = (it) => Math.floor(S.currentStock(it) - S.reservedQty(it));
    cols = [
      { k: 'wh', h: '창고', w: 84, v: (it) => esc(it.warehouse) },
      { k: 'cat', h: '구분', w: 60, cls: 'c', v: (it) => esc(it.category || '') },
      { k: 'name', h: '품목', v: (it) => esc(it.name) },
      { k: 'code', h: '품목코드', w: 116, v: (it) => `<span class="muted">${esc(it.ecountCode || ecountCode(it.name))}</span>`, csv: (it) => it.ecountCode || ecountCode(it.name) },
      { k: 'unit', h: '단위', w: 50, cls: 'c', v: (it) => esc(it.unit || '') },
      { k: 'pb', h: '입수', w: 50, cls: 'n', v: (it) => eN(it.perBox), sv: (it) => Number(it.perBox) || 0 },
      { k: 'cur', h: '현재고', w: 84, cls: 'n', v: (it) => `<b>${qtyHTML(it)}</b>`, sv: (it) => S.currentStock(it), csv: (it) => Math.floor(S.currentStock(it)) },
      { k: 'res', h: '출고예정', w: 70, cls: 'n', v: (it) => eN(Math.round(S.reservedQty(it))), sv: (it) => S.reservedQty(it) },
      { k: 'av', h: '가용', w: 64, cls: 'n', v: (it) => { const a = avail(it); return a < 0 ? `<span class="red">${a.toLocaleString()}</span>` : a.toLocaleString(); }, sv: avail },
      { k: 'price', h: '판매단가', w: 84, cls: 'n', v: (it) => eN(it.unitPrice), sv: (it) => Number(it.unitPrice) || 0 },
      { k: 'sup', h: '매입처', w: 84, v: (it) => esc(it.supplier || '') },
      { k: 'note', h: '비고', w: 120, v: (it) => (it.note || '').includes('확인') ? `<span class="red">${esc(it.note)}</span>` : esc(it.note || '') },
      { k: 'st', h: '상태', w: 54, cls: 'c', v: eStockBadge, sv: (it) => ({ out: 0, low: 1, ok: 2 }[S.stockStatus(it)]), csv: (it) => STATUS_KO[S.stockStatus(it)] },
    ];
    rowAttr = (it) => ledger(it.name);
  }
  rows = eSortRows('stock-' + state.eStockView, cols, rows);
  const nAll = (c) => new Set(items.filter((it) => !c || it.category === c).map((it) => it.name)).size;
  const warn = rows.filter((r) => (r.st || S.stockStatus(r)) !== 'ok').length;
  return ePage(`
    <div class="e-kpi">${whs.map((w) => { const sm = S.warehouseSummary(w.name); return `<button type="button" data-act="erp-nav" data-r="stock" data-preset="stock.wh=${f.wh === w.name ? '' : esc(w.name)}" style="${f.wh === w.name ? 'background:var(--e-sel)' : ''}"><span class="k">${esc(w.name)} · ${sm.itemCount}품목</span><span class="v">${sm.total.toLocaleString()}${sm.low ? `<small style="color:var(--e-warn)">부족·품절 ${sm.low}</small>` : ''}</span></button>`; }).join('')}</div>
    <div class="e-tabs">${[['', '전체'], ...cats.map((c) => [c, c])].map(([v, l]) => `<button class="e-tab ${f.cat === v ? 'on' : ''}" type="button" data-act="erp-nav" data-r="stock" data-preset="stock.cat=${esc(v)}">${esc(l)}<span class="n">${nAll(v)}</span></button>`).join('')}
      <span style="flex:1"></span>
      <span class="e-seg">${[['item', '품목별 (창고 합산)'], ['wh', '창고별 상세']].map(([v, l]) => `<button type="button" class="${state.eStockView === v ? 'on' : ''}" data-act="erp-tab" data-k="eStockView" data-v="${v}">${l}</button>`).join('')}</span></div>
    ${eCond([
      { label: '창고', html: eSel2('wh', f.wh, [['', '전체'], ...whs.map((w) => [w.name, w.name])]) },
      { label: '상태', html: eSel2('status', f.status, [['', '전체'], ['ok', '정상'], ['low', '부족'], ['out', '품절']]) },
      { label: '품목', html: eIn('q', f.q, 'w-l', '품목명·별칭·매입처·비고'), grow: true },
    ])}
    ${eStdTools({ newAct: 'add-item', extra: `${eBtn('입고 입력', 'add-inbound')}${eBtn('창고 등록', 'erp-nav', 'data-r="whs"')}` })}
    ${eTable({ route: 'stock-' + state.eStockView, cols, rows, rowAttr, title: '재고현황' })}
    <div class="e-sum"><span>품목 <b>${rows.length}</b>개${warn ? ` · 부족·품절·확인 <b style="color:var(--e-err)">${warn}</b>개` : ''}</span></div>`);
}

// 재고 수불부 — 품목의 창고별 재고 + 입고/출고 내역과 잔량 (재고 계산은 store 와 같은 기준으로 표시만)
function sheetStockLedger(name) {
  const list = S.getItems().filter((it) => (it.name || '(미지정)') === name);
  if (!list.length) return '';
  const f = list[0];
  const whRows = list.map((it) => {
    const cur = S.currentStock(it); const inb = S.inboundQty(it);
    return { it, cur, inb, out: Number(it.initial || 0) + inb - cur, res: S.reservedQty(it) };
  });
  // 이력: 입고(창고·구분·품목 일치) + 출고(출고의 창고 · 라인 품목 일치, 낱개는 입수로 나눔) — store 재고 계산과 같은 기준
  const ev = [];
  S.getInbounds().forEach((r) => { const it = list.find((i) => i.warehouse === r.warehouse && i.category === r.category); if (it && r.name === name) ev.push({ d: r.date || '', wh: r.warehouse, kind: '입고', who: r.supplier || '', q: `${r.qty}${r.unit || ''}`, base: Number(r.qty) || 0 }); });
  S.getShipments().forEach((s) => S.shipLines(s).forEach((l) => {
    if (l.name !== name) return;
    const it = list.find((i) => i.warehouse === s.warehouse); if (!it) return;
    const pb = Number(it.perBox) || 0;
    const base = (l.unit === '낱개' && pb > 0) ? (Number(l.qty) || 0) / pb : (Number(l.qty) || 0);
    ev.push({ d: s.date || '', wh: s.warehouse, kind: s.status === '출고완료' ? '출고' : s.status, who: s.client || '', q: `${l.qty}${l.unit || ''}`, base: -base, sid: s.id, plan: s.status !== '출고완료' });
  }));
  const done = ev.filter((e) => !e.plan).sort((a, b) => a.d.localeCompare(b.d));
  const bal = {}; list.forEach((it) => { bal[it.warehouse] = Number(it.initial) || 0; });
  const histRows = done.map((e) => { bal[e.wh] += e.base; return { ...e, bal: bal[e.wh] }; }).reverse();
  const plans = ev.filter((e) => e.plan).sort((a, b) => a.d.localeCompare(b.d));
  const fmt = (n) => (Math.round(n * 100) / 100).toLocaleString();
  return `<h2>재고 수불부 · ${esc(name)}</h2>
  <table class="e-ftbl"><colgroup><col style="width:92px"><col><col style="width:92px"><col><col style="width:92px"><col></colgroup>
    <tr><th>품목</th><td colspan="3"><b>${esc(name)}</b></td><th>품목코드</th><td>${esc(f.ecountCode || ecountCode(name))}</td></tr>
    <tr><th>구분</th><td>${esc(f.category || '')}</td><th>단위</th><td>${esc(f.unit || '')}${Number(f.perBox) > 0 ? ` · ${f.perBox}개입` : ''}</td><th>매입처</th><td>${esc([...new Set(list.map((i) => i.supplier).filter(Boolean))].join(', '))}</td></tr>
  </table>
  <div class="e-lines-hd"><b>창고별 재고</b><span class="hint2">현재고 = 기초 + 입고 − 출고완료</span></div>
  <table class="e-grid"><colgroup><col><col style="width:80px"><col style="width:80px"><col style="width:80px"><col style="width:90px"><col style="width:80px"><col style="width:80px"><col style="width:170px"></colgroup>
    <thead><tr><th>창고</th><th>기초</th><th>입고</th><th>출고완료</th><th>현재고</th><th>출고예정</th><th>가용</th><th>처리</th></tr></thead>
    <tbody>${whRows.map((w) => `<tr><td style="padding-left:7px">${esc(w.it.warehouse)}</td><td class="n">${fmt(Number(w.it.initial) || 0)}</td><td class="n">${fmt(w.inb)}</td><td class="n">${fmt(w.out)}</td>
      <td class="n"><b class="${w.cur <= 0 ? 'red' : ''}">${fmt(w.cur)}</b></td><td class="n">${fmt(w.res)}</td><td class="n">${fmt(w.cur - w.res)}</td>
      <td class="c">${eBtn('실사 수정', 'erp-stockfix', `data-id="${w.it.id}"`, 'sm')}${eBtn('품목 수정', 'item', `data-id="${w.it.id}"`, 'sm')}</td></tr>`).join('')}</tbody></table>
  ${plans.length ? `<div class="e-lines-hd"><b>출고 예정</b><span class="hint2">아직 재고에서 빠지지 않은 건</span></div>
  <table class="e-grid"><colgroup><col style="width:94px"><col style="width:84px"><col style="width:80px"><col><col style="width:90px"></colgroup>
    <thead><tr><th>출고일</th><th>창고</th><th>상태</th><th>거래처</th><th>수량</th></tr></thead>
    <tbody>${plans.map((e) => `<tr class="ck" data-act="ship" data-id="${e.sid}"><td class="c">${esc(e.d)}</td><td class="c">${esc(whShort(e.wh))}</td><td class="c">${eShipBadge({ status: e.kind })}</td><td style="padding-left:7px">${esc(e.who)}</td><td class="n">${esc(e.q)}</td></tr>`).join('')}</tbody></table>` : ''}
  <div class="e-lines-hd"><b>입출고 내역</b><span class="hint2">최근 순 · 잔량은 창고별</span></div>
  <table class="e-grid"><colgroup><col style="width:94px"><col style="width:84px"><col style="width:60px"><col><col style="width:90px"><col style="width:90px"></colgroup>
    <thead><tr><th>일자</th><th>창고</th><th>구분</th><th>거래처 / 매입처</th><th>수량</th><th>잔량</th></tr></thead>
    <tbody>${histRows.length ? histRows.map((e) => `<tr ${e.sid ? `class="ck" data-act="ship" data-id="${e.sid}"` : ''}><td class="c">${esc(e.d)}</td><td class="c">${esc(whShort(e.wh))}</td>
      <td class="c">${e.kind === '입고' ? '<span class="e-b blue">입고</span>' : '<span class="e-b gray">출고</span>'}</td><td style="padding-left:7px">${esc(e.who)}</td>
      <td class="n">${e.base > 0 ? '+' : '−'}${esc(e.q)}</td><td class="n"><b>${fmt(e.bal)}</b></td></tr>`).join('')
      : '<tr><td colspan="6" class="e-empty">입고·출고 내역이 없습니다.</td></tr>'}
      ${list.map((it) => `<tr><td class="c muted">-</td><td class="c">${esc(whShort(it.warehouse))}</td><td class="c"><span class="e-b ghost">기초</span></td><td class="muted" style="padding-left:7px">기초재고 (실사 반영)</td><td class="n"></td><td class="n">${fmt(Number(it.initial) || 0)}</td></tr>`).join('')}</tbody></table>
  <div class="e-fbar"><span class="sp"></span>
    <button class="btn ghost" type="button" data-act="add-inbound">입고 입력</button>
    <button class="btn ghost" type="button" data-act="color-ship" data-id="${list[0].id}">출고 입력</button>
    <button class="btn danger" type="button" data-act="close">닫기</button></div>`;
}

// 출고 상세 — 이카운트처럼 전표 화면 그대로 (상단 기본정보 · 품목 그리드 · 하단 처리 버튼). 모든 버튼은 기존 동작.
function sheetDocDesk(sh) {
  const isCourier = sh.method === '택배';
  const stages = isCourier ? ['출고예정', '출고완료'] : STAGES;
  const hasDispatch = sh.dispatchVia || sh.driverName || sh.driverPhone || sh.vehicle || sh.freight || sh.payment;
  const lines = S.shipLines(sh);
  const m = eAmt(sh);
  const editing = state.docEditLines && slId === sh.id;
  const cliPhone = (S.findPartner(sh.client) || {}).phone || '';
  const calls = sh.calls || [];
  const lineRows = lines.map((l, i) => {
    const raw = Number(l.unitPrice) || 0; const ep = effPrice(l, sh);
    const sup = (Number(l.qty) || 0) * raw; const vat = Math.round(sup * 0.1);
    const lwh = l.warehouse || sh.warehouse;
    const it = S.getItems().find((x) => x.name === l.name && x.warehouse === lwh);
    const pcs = (it && Number(it.perBox) > 0 && (l.unit === '박스' || l.unit === 'plt' || l.unit === '파렛트')) ? `${(Number(l.qty) * Number(it.perBox)).toLocaleString()}개` : '';
    const price = raw > 0 ? raw.toLocaleString() : (ep.price > 0 ? `<span class="muted">${ep.price.toLocaleString()} · ${esc(ep.src)}</span>` : '<span class="red">단가 미정</span>');
    return `<tr><td class="no">${i + 1}</td><td class="code">${esc(ecountCode(l.name) || (it && it.ecountCode) || '')}</td>
      <td style="padding-left:6px">${esc(l.name || '(미지정)')}${l.spec ? ` <span class="muted">${esc(l.spec)}</span>` : ''}</td><td class="c">${esc(whShort(lwh))}</td>
      <td class="n">${esc(l.qty)}</td><td class="c">${esc(l.unit || '')}</td><td class="n muted">${pcs}</td><td class="n">${price}</td>
      <td class="n">${eN(sup)}</td><td class="n">${eN(vat)}</td><td class="n"><b>${eN(sup + vat)}</b></td></tr>`;
  }).join('');
  const tqty = lines.reduce((a, l) => a + (Number(l.qty) || 0), 0);
  const grid = editing ? shipLinesEditorDesk(sh) : `<table class="e-grid"><colgroup><col style="width:32px"><col style="width:112px"><col><col style="width:54px"><col style="width:62px"><col style="width:54px"><col style="width:64px"><col style="width:120px"><col style="width:92px"><col style="width:80px"><col style="width:96px"></colgroup>
    <thead><tr><th>No</th><th>품목코드</th><th>품목명</th><th>창고</th><th>수량</th><th>단위</th><th>낱개</th><th>단가</th><th>공급가</th><th>세액</th><th>합계</th></tr></thead>
    <tbody>${lineRows}</tbody>
    <tfoot><tr><td></td><td></td><td style="padding-left:6px;font-weight:700">합계</td><td></td><td class="n"><b>${tqty.toLocaleString()}</b></td><td></td><td></td><td></td><td class="n"><b>${eN(m.sup)}</b></td><td class="n"><b>${eN(m.vat)}</b></td><td class="n"><b style="color:var(--e-blue)">${eN(m.tot)}</b></td></tr></tfoot></table>`;
  const stage = `<span class="e-seg">${stages.map((s) => `<button type="button" class="${sh.status === s ? 'on' : ''}" data-act="ship-stage" data-id="${sh.id}" data-v="${s}">${s}</button>`).join('')}</span>`;
  const docCell = sh.status === '출고완료'
    ? `${eDocBadge(sh)} ${eBtn(sh.docDone ? '발행 해제' : '발행 완료로 표시', 'toggle-doc', `data-id="${sh.id}"`, 'sm')}` : '<span class="muted">출고완료 후 발행</span>';
  const hold = sh.holdReason
    ? `<span class="e-b orange">보류 · ${esc(sh.holdReason)}</span> ${eBtn('보류 해제', 'unhold', `data-id="${sh.id}" data-kind="ship"`, 'sm')}`
    : HOLD_REASONS.map((r) => eBtn(esc(r), 'hold', `data-id="${sh.id}" data-kind="ship" data-r="${esc(r)}"`, 'sm')).join('');
  return `<h2>출고 전표 <span class="e-b gray" style="margin-left:4px">${esc(sh.date || '')}${sh.time ? ' ' + esc(sh.time) : ''}</span> ${eShipBadge(sh)}</h2>
  <table class="e-ftbl"><colgroup><col style="width:92px"><col><col style="width:92px"><col><col style="width:92px"><col></colgroup>
    <tr><th>진행 상태</th><td colspan="3">${stage}</td><th>명세서</th><td>${docCell}</td></tr>
    <tr><th>출고일</th><td>${esc(sh.date || '')}${sh.time ? ' ' + esc(sh.time) : ''}</td><th>거래처</th><td><b>${esc(sh.client || '(미지정)')}</b>${cliPhone ? ` <a class="tel" href="${telHref(cliPhone)}" data-act="ship-call" data-id="${sh.id}">${esc(cliPhone)}</a>` : ''}</td><th>창고</th><td>${esc(sh.warehouse || '')}</td></tr>
    <tr><th>출고 방식</th><td>${esc(sh.method || '배차')}</td><th>상차지</th><td>${esc(sh.loadPlace || sh.warehouse || '')}${sh.loadAddr ? ` <span class="muted">${esc(sh.loadAddr)}</span>` : ''}</td><th>하차지</th><td>${esc(sh.unloadPlace || sh.client || '')}${sh.unloadAddr ? ` <span class="muted">${esc(sh.unloadAddr)}</span>` : ''}</td></tr>
    ${isCourier ? `<tr><th>택배사</th><td>${esc(sh.courier || '')}</td><th>송장번호</th><td>${esc(sh.trackingNo || '')}</td><th>택배비</th><td>${eN(sh.courierFee)}</td></tr>
      <tr><th>받는 사람</th><td>${esc(sh.recvName || '')} ${esc(sh.recvPhone || '')}</td><th>받는 주소</th><td colspan="3">${esc(sh.recvAddr || '')}</td></tr>`
      : `<tr><th>배차</th><td>${esc(sh.dispatchVia || '')}${!hasDispatch ? '<span class="muted">배차 정보 없음</span>' : ''}</td><th>기사님</th><td>${esc(sh.driverName || '')}${sh.driverPhone ? ` <a class="tel" href="${telHref(sh.driverPhone)}">${esc(sh.driverPhone)}</a>` : ''}</td><th>차량 / 운임</th><td>${esc(sh.vehicle || '')}${sh.freight ? ` · ${Number(sh.freight).toLocaleString()}원` : ''}${sh.payment ? ` · ${esc(sh.payment)}` : ''}</td></tr>`}
    <tr><th>비고</th><td colspan="3">${esc(sh.note || '')}</td><th>보류</th><td>${hold}</td></tr>
  </table>
  <div class="e-lines-hd"><b>품목</b><span class="sp"></span>${editing ? '' : eBtn('품목 · 수량 · 단가 수정', 'doc-edit-lines', `data-id="${sh.id}"`, 'sm')}</div>
  ${grid}
  ${calls.length || !cliPhone ? `<div class="e-lines-hd" style="margin-top:8px"><b>거래처 연락</b><span class="sp"></span>${cliPhone ? '' : eBtn('거래처 전화번호 등록', 'ship-addphone', `data-id="${sh.id}"`, 'sm')}</div>
    ${calls.length ? `<div class="e-calls">${calls.slice().reverse().map((c) => `<span>${esc(c)} 통화 ✓</span>`).join('')}</div>` : ''}` : ''}
  <div class="e-fbar">
    <button class="btn ghost" type="button" data-act="edit-ship" data-id="${sh.id}">전표 수정</button>
    <button class="btn ghost" type="button" data-act="print-ship" data-id="${sh.id}">인쇄 / PDF</button>
    ${sh.status === '출고예정' && !isCourier ? `<button class="btn ghost" type="button" data-act="copy-dispatch" data-id="${sh.id}">배차 요청 양식</button>
      <button class="btn ghost" type="button" data-act="dispatch-paste" data-id="${sh.id}">배차 완료</button>` : ''}
    ${sh.status === '배차완료' && !isCourier ? `<button class="btn ghost" type="button" data-act="dispatch-paste" data-id="${sh.id}">배차 정보 다시 붙여넣기</button>` : ''}
    <span class="sp"></span>
    <button class="btn danger" type="button" data-act="del-ship" data-id="${sh.id}" style="color:var(--e-err)">삭제</button>
    <button class="btn" type="button" data-act="close">닫기</button>
  </div>`;
}
// 출고 상세 안에서 품목 줄 편집 (기존 sl-* 동작·data-sl 입력칸 그대로)
function shipLinesEditorDesk(sh) {
  const names = [...new Set(S.getItems().filter((it) => it.warehouse === sh.warehouse).map((it) => it.name))];
  return `<datalist id="sl-items">${names.map((n) => `<option value="${esc(n)}"></option>`).join('')}</datalist>
  <table class="e-grid"><colgroup><col style="width:32px"><col><col style="width:130px"><col style="width:70px"><col style="width:80px"><col style="width:100px"><col style="width:30px"></colgroup>
    <thead><tr><th>No</th><th>품목명</th><th>규격</th><th>단위</th><th>수량</th><th>단가</th><th></th></tr></thead>
    <tbody>${slLines.map((l, i) => `<tr><td class="no">${i + 1}</td>
      <td><input data-sl="name" data-i="${i}" list="sl-items" value="${esc(l.name || '')}" placeholder="품명 (직접 입력 가능)" autocomplete="off"></td>
      <td><input data-sl="spec" data-i="${i}" value="${esc(l.spec || '')}"></td>
      <td><input data-sl="unit" data-i="${i}" value="${esc(l.unit || '')}"></td>
      <td><input class="num" data-sl="qty" data-i="${i}" type="number" min="0" value="${l.qty}"></td>
      <td><input class="num" data-sl="unitPrice" data-i="${i}" type="number" min="0" value="${l.unitPrice || ''}"></td>
      <td class="c"><button class="del" type="button" data-act="sl-del" data-i="${i}" title="행 삭제">✕</button></td></tr>`).join('')}</tbody></table>
  <div class="e-tools" style="margin-top:6px">${eBtn('＋ 행 추가', 'sl-add', '', 'sm')}<span class="sp"></span>${eBtn('취소', 'sl-cancel', `data-id="${sh.id}"`)}${eBtn('품목 저장', 'sl-save', `data-id="${sh.id}"`, 'pri')}</div>`;
}

// ── 화면: 입고 조회 ───────────────────────────────
function deskInbound() {
  const f = eFilter('inbound', { from: '', to: '', wh: '', q: '' });
  let rows = S.getInbounds().filter((r) => (!f.from || r.date >= f.from) && (!f.to || r.date <= f.to) && (!f.wh || r.warehouse === f.wh)
    && eHas([r.name, r.supplier, r.note].join(' '), f.q));
  const cols = [
    { k: 'date', h: '입고일', w: 94, cls: 'c', v: (r) => esc(r.date || '') },
    { k: 'wh', h: '창고', w: 84, v: (r) => esc(r.warehouse || '') },
    { k: 'cat', h: '구분', w: 64, cls: 'c', v: (r) => esc(r.category || '') },
    { k: 'name', h: '품목', v: (r) => esc(r.name || '') },
    { k: 'qty', h: '수량', w: 70, cls: 'n', v: (r) => eN(r.qty), sv: (r) => Number(r.qty) || 0 },
    { k: 'unit', h: '단위', w: 50, cls: 'c', v: (r) => esc(r.unit || '') },
    { k: 'pb', h: '입수', w: 50, cls: 'n', v: (r) => eN(r.perBox) },
    { k: 'price', h: '단가', w: 84, cls: 'n', v: (r) => eN(r.unitPrice), sv: (r) => Number(r.unitPrice) || 0 },
    { k: 'vat', h: '부가세', w: 56, cls: 'c', v: (r) => (r.vatSeparate ? '별도' : '포함') },
    { k: 'sup', h: '매입처', w: 100, v: (r) => esc(r.supplier || '') },
    { k: 'note', h: '비고', w: 160, v: (r) => esc(r.note || '') },
  ];
  rows = eSortRows('inbound', cols, rows);
  return ePage(`
    ${eCond([
      { label: '입고일', html: `${eDate('from', f.from)}<span class="e-tilde">~</span>${eDate('to', f.to)}` },
      { label: '창고', html: eSel2('wh', f.wh, [['', '전체'], ...S.warehouseNames().map((w) => [w, w])]) },
      { label: '검색', html: eIn('q', f.q, 'w-l', '품목·매입처·비고'), grow: true },
    ])}
    ${eStdTools({ newAct: 'add-inbound' })}
    ${eTable({ route: 'inbound', cols, rows })}`);
}

// ── 화면: 거래처 / 품목 / 창고 등록 ───────────────
function deskPartners() {
  const f = eFilter('partners', { q: '' });
  const stat = {};
  S.getShipments().forEach((s) => { const k = s.client || ''; const o = stat[k] = stat[k] || { n: 0, last: '' }; o.n++; if ((s.date || '') > o.last) o.last = s.date; });
  let rows = S.getPartners().filter((p) => eHas([p.name, p.address, p.phone, p.note].join(' '), f.q)).map((p) => ({ ...p, id: p.name }));
  const cols = [
    { k: 'name', h: '거래처명', w: 170, v: (p) => `<b>${esc(p.name)}</b>` , csv: (p) => p.name },
    { k: 'addr', h: '주소', v: (p) => esc(p.address || '') },
    { k: 'phone', h: '전화', w: 120, v: (p) => esc(p.phone || '') },
    { k: 'note', h: '비고', w: 180, v: (p) => esc(p.note || '') },
    { k: 'n', h: '출고건수', w: 70, cls: 'n', v: (p) => eN((stat[p.name] || {}).n), sv: (p) => (stat[p.name] || {}).n || 0 },
    { k: 'last', h: '최근 출고', w: 90, cls: 'c', v: (p) => esc((stat[p.name] || {}).last || '') },
  ];
  rows = eSortRows('partners', cols, rows);
  return ePage(`${eCond([{ label: '검색', html: eIn('q', f.q, 'w-l', '거래처명·주소·전화·비고'), grow: true }])}
    ${eStdTools({ newAct: 'add-partner' })}
    ${eTable({ route: 'partners', cols, rows, rowAttr: (p) => `data-act="partner-edit" data-w="${esc(p.name)}"` })}`);
}
function deskItems() {
  state.eItemTab = state.eItemTab || 'master';
  const tab = state.eItemTab;
  const f = eFilter('items', { cat: '', q: '' });
  const cats = [...new Set(S.getItems().map((it) => it.category).filter(Boolean))].sort();
  let cols, rows, rowAttr;
  if (tab === 'master') {
    rows = itemMasters().filter((m) => (!f.cat || m.category === f.cat) && eHas([m.name, m.suppliers.join(' '), (m.list[0] || {}).aliases].join(' '), f.q)).map((m) => ({ ...m, id: m.name }));
    cols = [
      { k: 'cat', h: '구분', w: 64, cls: 'c', v: (m) => esc(m.category) },
      { k: 'name', h: '품목명', v: (m) => esc(m.name) },
      { k: 'code', h: '이카운트 코드', w: 118, v: (m) => esc((m.list.find((i) => i.ecountCode) || {}).ecountCode || ecountCode(m.name)) },
      { k: 'unit', h: '단위', w: 50, cls: 'c', v: (m) => esc(m.unit) },
      { k: 'pb', h: '입수', w: 50, cls: 'n', v: (m) => eN(m.perBox) },
      { k: 'price', h: '판매단가', w: 130, cls: 'n', v: (m) => { const pl = masterPriceLabel(m); return pl.nop ? `<span class="red">${pl.txt}</span>` : esc(pl.txt); }, sv: (m) => m.prices[0] || 0 },
      { k: 'sup', h: '매입처', w: 110, v: (m) => esc(m.suppliers.join(', ')) },
      { k: 'alias', h: '별칭', w: 140, v: (m) => esc((m.list.find((i) => i.aliases) || {}).aliases || '') },
      { k: 'whs', h: '보관 창고', w: 110, v: (m) => esc(m.whs.map(whShort).join(', ')) },
    ];
    rowAttr = (m) => `data-act="master" data-name="${esc(m.name)}"`;
  } else {
    rows = S.getItems().filter((it) => (!f.cat || it.category === f.cat) && eHas([it.name, it.aliases, it.supplier, it.note].join(' '), f.q));
    cols = [
      { k: 'wh', h: '창고', w: 84, v: (it) => esc(it.warehouse) },
      { k: 'cat', h: '구분', w: 64, cls: 'c', v: (it) => esc(it.category || '') },
      { k: 'name', h: '품목', v: (it) => esc(it.name) },
      { k: 'unit', h: '단위', w: 50, cls: 'c', v: (it) => esc(it.unit || '') },
      { k: 'init', h: '초기재고', w: 70, cls: 'n', v: (it) => eN(it.initial), sv: (it) => Number(it.initial) || 0 },
      { k: 'cur', h: '현재고', w: 70, cls: 'n', v: (it) => Math.floor(S.currentStock(it)).toLocaleString(), sv: (it) => S.currentStock(it) },
      { k: 'price', h: '판매단가', w: 84, cls: 'n', v: (it) => eN(it.unitPrice), sv: (it) => Number(it.unitPrice) || 0 },
      { k: 'sup', h: '매입처', w: 90, v: (it) => esc(it.supplier || '') },
      { k: 'alias', h: '별칭', w: 130, v: (it) => esc(it.aliases || '') },
      { k: 'note', h: '비고', w: 130, v: (it) => esc(it.note || '') },
    ];
    rowAttr = (it) => `data-act="item" data-id="${it.id}"`;
  }
  rows = eSortRows('items-' + tab, cols, rows);
  return ePage(`
    ${eTabs('eItemTab', [['master', '품목 마스터 (단가)'], ['wh', '창고별 품목']])}
    ${eCond([{ label: '구분', html: eSel2('cat', f.cat, [['', '전체'], ...cats.map((c) => [c, c])]) }, { label: '검색', html: eIn('q', f.q, 'w-l', '품목명·별칭·매입처'), grow: true }])}
    ${eStdTools({ newAct: 'add-item' })}
    ${tab === 'master' ? '<p class="hint" style="margin:0;color:var(--e-muted)">같은 품목명은 한 줄(마스터)로 묶었어요. 누르면 판매단가·매입처·별칭을 모든 창고에 한 번에 적용합니다.</p>' : ''}
    ${eTable({ route: 'items-' + tab, cols, rows, rowAttr, title: tab === 'master' ? '품목마스터' : '창고별품목' })}`);
}
function deskWhs() {
  const rows = S.getWarehouses().map((w) => ({ ...w, id: w.name, sm: S.warehouseSummary(w.name) }));
  const cols = [
    { k: 'name', h: '창고명', w: 140, v: (w) => `<b>${esc(w.name)}</b>`, csv: (w) => w.name },
    { k: 'addr', h: '주소', v: (w) => esc(w.address || '') },
    { k: 'phone', h: '전화', w: 120, v: (w) => esc(w.phone || '') },
    { k: 'n', h: '품목수', w: 64, cls: 'n', v: (w) => eN(w.sm.itemCount), sv: (w) => w.sm.itemCount },
    { k: 'total', h: '재고 합', w: 80, cls: 'n', v: (w) => w.sm.total.toLocaleString(), sv: (w) => w.sm.total },
    { k: 'low', h: '부족·품절', w: 74, cls: 'n', v: (w) => w.sm.low ? `<span class="red">${w.sm.low}</span>` : '', sv: (w) => w.sm.low },
    { k: 'act', h: '재고', w: 76, cls: 'c', v: (w) => eBtn('재고 보기', 'wh', `data-w="${esc(w.name)}"`, 'sm') },
  ];
  return ePage(`<div class="e-tools">${eBtn(`신규 ${eKey('F2')}`, 'add-wh', '', 'pri')}${eBtn('엑셀', 'erp-excel')}</div>
    ${eTable({ route: 'whs', cols, rows: eSortRows('whs', cols, rows), rowAttr: (w) => `data-act="wh-edit" data-w="${esc(w.name)}"` })}`);
}

// ── 화면: 이카운트 품목 / 품목 매핑 사전 (입력 즉시 결과표만 갱신 — IME 안전) ──
function deskEcountTable(q) {
  q = (q || '').trim();
  let list = ECOUNT_ITEMS;
  if (q) { const qq = q.toLowerCase(); list = list.filter(([c, n]) => c.toLowerCase().includes(qq) || n.includes(q)); }
  const shown = list.slice(0, 500);
  return `<div class="e-sum">${q ? `검색 <b>${list.length.toLocaleString()}</b>건` : `전체 <b>${ECOUNT_ITEMS.length.toLocaleString()}</b>건`}${list.length > 500 ? ' · 앞 500건만 표시 — 검색어를 더 입력하세요' : ''}</div>
    <div class="e-tw"><table class="e-tbl"><colgroup><col style="width:44px"><col style="width:180px"><col></colgroup>
    <thead><tr><th>No</th><th>품목코드</th><th>품목명</th></tr></thead>
    <tbody>${shown.length ? shown.map(([c, n], i) => `<tr><td class="no">${i + 1}</td><td>${esc(c)}</td><td>${esc(n)}</td></tr>`).join('') : '<tr><td colspan="3" class="e-empty">검색 결과가 없습니다.</td></tr>'}</tbody></table></div>`;
}
function deskMapTable(q) {
  q = (q || '').trim();
  const ITEM_MAP = S.getItemMap();
  let list = ITEM_MAP;
  if (q) { const qq = q.toLowerCase(); list = list.filter(([p, ext, ours]) => ext.toLowerCase().includes(qq) || ours.includes(q) || p.includes(q)); }
  return `${mapMissingNote()}<div class="e-sum">${q ? `검색 <b>${list.length}</b>건` : `사전 <b>${ITEM_MAP.length}</b>건`}</div>
    <div class="e-tw"><table class="e-tbl"><colgroup><col style="width:44px"><col style="width:140px"><col><col></colgroup>
    <thead><tr><th>No</th><th>거래처</th><th>거래처 표기</th><th>우리 품목명 (이카운트)</th></tr></thead>
    <tbody>${list.length ? list.slice(0, 500).map(([p, ext, ours], i) => `<tr><td class="no">${i + 1}</td><td>${esc(p)}</td><td>${esc(ext)}</td><td>${esc(ours)}</td></tr>`).join('')
      : '<tr><td colspan="4" class="e-empty">사전에 없어요. 거래처 표기를 다르게 넣어보거나, 이카운트 품목 조회에서 직접 찾아보세요.</td></tr>'}</tbody></table></div>`;
}
const deskEcount = () => ePage(`${eCond([{ label: '검색', html: '<input id="ecount-search" class="e-in w-l" placeholder="코드·품목명 (예: 라떼 / 03000 / 구조재)" autocomplete="off">', grow: true }])}
  <div id="ecount-results" style="display:flex;flex-direction:column;flex:1;min-height:0;gap:4px">${deskEcountTable('')}</div>`);
const deskItemMap = () => ePage(`${eCond([{ label: '검색', html: '<input id="map-search" class="e-in w-l" placeholder="거래처 표기로 검색 (예: 평와샤 12*50 / 구조재VIDA)" autocomplete="off">', grow: true }])}
  <div id="map-results" style="display:flex;flex-direction:column;flex:1;min-height:0;gap:4px">${deskMapTable('')}</div>`);

// ── 화면: 실리콘 재고 (기존 매트릭스 재사용) · 환경설정 ──
const deskSilicone = () => ePage(`<div class="e-tools">${eBtn(`출고 입력 ${eKey('F2')}`, 'new-ship', '', 'pri')}${eBtn('입고 입력', 'add-inbound')}</div><div class="e-legacy">${screenSilicone()}</div>`, 'scroll');
function deskSettings() {
  return ePage(`
    <div class="e-box" style="max-width:760px"><div class="e-box-hd">사용자</div>
      <div class="e-kv"><span>이름</span><div>${esc(myName())}</div></div>
      <div class="e-kv"><span>아이디</span><div>${esc(myAccount)}</div></div>
      <div class="e-kv"><span>로그아웃</span><div>${eBtn('로그아웃', 'logout', '', 'sm')}</div></div></div>
    <div class="e-box" style="max-width:760px"><div class="e-box-hd">데이터</div>
      <div class="e-kv"><span>데이터 내보내기</span><div>${eBtn('JSON 내보내기', 'export', '', 'sm')}</div></div>
      <div class="e-kv"><span>거래명세서 카톡 발송</span><div style="color:var(--e-muted)">2단계 예정</div></div>
      <div class="e-kv"><span>이카운트 ERP 연동</span><div style="color:var(--e-muted)">2단계 예정</div></div></div>
    <div class="e-box" style="max-width:760px"><div class="e-box-hd">단축키</div>
      ${[['F2', '신규 (화면별: 출고·견적·입고·품목·거래처·창고)'], ['F8', '조회 / 입력창에서는 저장'], ['Ctrl + Enter', '입력창 저장'], ['Enter', '입력창: 다음 칸 · 품목 마지막 칸이면 행 추가 / 목록: 선택한 행 열기'], ['↑ ↓', '목록 행 이동'], ['/', '검색칸으로 이동'], ['Esc', '입력창 닫기']]
        .map(([k, d]) => `<div class="e-kv"><span><kbd style="font-family:inherit">${k}</kbd></span><div>${d}</div></div>`).join('')}</div>`, 'scroll');
}

// ── 화면: 문서 인식 · 납품확인서 — 이 맥의 로컬 도우미(127.0.0.1:4180)가 AI 판독·매핑·견적서 생성을 맡는다 ──
const HELPER = 'http://127.0.0.1:4180';
let dr = { name: '', url: '', mime: '', b64: '', busy: false, err: '', doc: null, orig: null, usage: null, quote: null, note: '', buy: null, buyFile: '' };
let helperState = { checked: false, up: false, info: null };
let dd = { rows: null, err: '' };
async function helperFetch(path, body) {
  const r = await fetch(HELPER + path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  const j = await r.json().catch(() => ({ ok: false, error: '도우미 응답을 읽지 못했어요.' }));
  if (!j.ok) throw new Error(j.error || '도우미 오류');
  return j;
}
function helperCheck() {
  helperState.at = Date.now();  // 재확인 주기 기준 — 재조회 전에 찍어 무한 렌더 루프 방지
  helperFetch('/api/health').then((j) => { helperState = { checked: true, up: true, info: j, at: Date.now() }; })
    .catch(() => { helperState = { checked: true, up: false, info: null, at: Date.now() }; }).finally(() => { if (['docread', 'delivdocs'].includes(state.route)) render(); });
}
const helperBadge = () => !helperState.checked ? '<span class="e-b gray">도우미 확인 중…</span>'
  : !helperState.up ? '<span class="e-b red">로컬 도우미 꺼짐</span>'
    : `<span class="e-b green">도우미 연결</span> ${helperState.info.ai ? '<span class="e-b green">AI 판독 가능</span>' : '<span class="e-b orange">AI 키 없음 · 엑셀만</span>'}`;
const helperOff = () => `<div class="e-box"><div class="e-box-hd">로컬 도우미가 꺼져 있어요</div><div class="e-box-bd">이 맥의 터미널에서 켜주세요:<br>
  <code>cd ~/claude_workspace/homt-delivery-helper &amp;&amp; python3 server.py</code><br>${eBtn('다시 확인', 'erp-dr-check', '', 'sm')}</div></div>`;
const DR_CONF = { high: ['dr-high', '확실'], mid: ['dr-mid', '확인 필요'], none: ['dr-none', '못 찾음'], edit: ['dr-edit', '직접 지정'] };
// 여러 모양의 날짜(2025.9.9 · 2025년 9월 9일 · 20250909 · 25-09-09) → 2025-09-09, 못 읽으면 ''
function isoDate(v) {
  const t = String(v || '').trim();
  let m = t.match(/(20\d\d|\d\d)\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/) || t.match(/^(20\d\d)(\d\d)(\d\d)$/);
  if (!m) return '';
  const y = m[1].length === 2 ? '20' + m[1] : m[1], mo = Number(m[2]), d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function drNormDates(doc) {
  if (!doc) return doc;
  doc.doc_date = isoDate(doc.doc_date) || doc.doc_date || '';
  (doc.lines || []).forEach((l) => { l.date = isoDate(l.date); });
  return doc;
}
// 문서 인식은 무엇을 할지 먼저 고른다 — 고른 일에 필요한 칸·버튼만 보인다
let drMode = '';
const DR_MODES = [['deliv', '납품확인서'], ['buy', '구매전표'], ['quote', '견적·출고']];
const drModeTabs = () => `<div class="e-tabs">${DR_MODES.map(([v, l]) => `<button class="e-tab ${drMode === v ? 'on' : ''}" type="button" data-act="erp-dr-mode" data-v="${v}">${l}</button>`).join('')}</div>`;
function drSetMode(v) {
  drMode = v;
  if (v === 'buy' && drq.files.length > 1 && drq.docs.some((d) => d && d.lines) && !drq.batch) { drqCheck(); return; }
  render();
}
// 문서 인식 표 — 종전가·단가·금액 칸 (납품확인서 모드에서는 안 보임)
function drPriceCells(l, i) {
  const prev = l.prev ? `${Number(l.prev.price).toLocaleString()}<br><span class="muted">${esc(l.prev.src)}</span>` : '<span class="muted">-</span>';
  return `<td class="n">${prev}</td>
        <td><input class="num" data-drf="price" data-i="${i}" type="number" min="0" value="${esc(l.price || '')}"></td>
        <td class="n" id="dr-amt-${i}">${eN((Number(l.qty) || 0) * (Number(l.price) || 0))}</td>`;
}
function drTotals() {
  const ls = (dr.doc && dr.doc.lines) || [];
  const sup = ls.reduce((a, l) => a + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);
  const vat = Math.round(sup * 0.1);
  return { sup, vat, tot: sup + vat, noPrice: ls.filter((l) => !(Number(l.price) > 0)).length };
}
function deskDocRead() {
  if (!helperState.checked || !helperState.at || Date.now() - helperState.at > 60000) { helperState.at = Date.now(); helperCheck(); }
  if (!drMode) return ePage(`${drModeTabs()}<div class="e-empty" style="margin-top:24px">무엇을 할지 먼저 고르세요 — <b>납품확인서</b> · <b>구매전표</b> · <b>견적·출고</b><br><span class="muted">고른 일에 맞는 칸과 버튼만 나와요.</span></div>`);
  if (helperState.up) syncPrevPrices();
  if (drq.files.length > 1 && dr.fromBatch === undefined) return drqPanel();
  const d = dr.doc;
  const left = dr.url || dr.name ? (dr.mime.startsWith('image/') ? `<img src="${dr.url}" alt="원본">`
    : dr.mime === 'application/pdf' ? `<iframe src="${dr.url}" title="원본 PDF"></iframe>`
      : `<div class="dr-file"><b>${esc(dr.name)}</b><span>엑셀 파일은 미리보기 없이 바로 인식합니다</span></div>`)
    : '<div style="display:flex;flex-direction:column;align-items:center;width:100%;padding:0 16px 24px"><div class="dr-empty">발주서·거래명세표 파일을 여기로 끌어다 놓거나<br><b>[파일 선택]</b>을 누르세요<br>캡처·카톡 사진은 복사해서 <b>Cmd+V</b>로 붙여넣어도 돼요<br><span>사진(JPG·PNG·HEIC) · PDF · 엑셀 · 여러 장 가능</span></div>' + drTextBox() + '</div>';
  let right;
  if (!helperState.up && helperState.checked && !d && !dr.busy && drMode !== 'deliv') right = helperOff() + '<div class="e-empty"><b>붙여넣은 글</b>은 도우미 없이도 인식돼요 — 왼쪽 아래 칸에 붙여넣고 <b>[글자로 인식]</b>을 누르세요.</div>';
  else if (dr.busy) right = '<div class="e-empty">문서를 읽는 중이에요… (사진·PDF는 20~60초)</div>';
  else if (!d) right = `${dr.err ? `<div class="dr-err">${esc(dr.err)}</div>` : ''}<div class="e-empty">왼쪽에 문서를 올린 뒤 <b>[인식 시작]</b>을 누르세요.</div>`;
  else {
    const t = drTotals();
    const isDeliv = drMode === 'deliv';
    const cnt = { high: 0, mid: 0, none: 0, edit: 0 }; d.lines.forEach((l) => { cnt[l.conf] = (cnt[l.conf] || 0) + 1; });
    right = `${dr.err ? `<div class="dr-err">${esc(dr.err)}</div>` : ''}
    <table class="e-ftbl"><colgroup><col style="width:80px"><col><col style="width:80px"><col><col style="width:80px"><col></colgroup>
      <tr><th>문서</th><td>${esc(d.doc_type || '')}${dr.usage ? ` <span class="muted">AI ${dr.usage.in + dr.usage.out}토큰 · 약 ${Math.round(dr.usage.usd * 1400).toLocaleString()}원</span>` : ' <span class="muted">AI 미사용</span>'}</td>
        <th>거래처</th><td><input class="e-in" data-drh="partner" value="${esc(d.partner || '')}"></td><th>담당자</th><td><input class="e-in" data-drh="manager" value="${esc(d.manager || '')}"></td></tr>
      <tr><th>현장명</th><td style="display:flex;gap:4px"><input class="e-in" data-drh="owner" value="${esc(d.owner || '')}" style="flex:1">${drMode === 'buy' ? '' : `<label class="e-btn sm" for="dr-sitedoc" title="건축허가서·신고필증 사진/PDF에서 건축주·현장 주소를 채워요 (서류 날짜는 안 씀)">${siteDoc.busy ? '읽는 중…' : '현장 서류'}</label><input type="file" id="dr-sitedoc" accept="image/*,.heic,.pdf" hidden>`}</td><th>납품장소</th><td><input class="e-in" data-drh="site" value="${esc(d.site || '')}"></td><th>일자</th><td><input class="e-in" type="date" data-drh="doc_date" value="${esc(isoDate(d.doc_date))}" title="명세서 일자 — 줄마다 출고일이 비어 있으면 이 날짜가 납품일"></td></tr>
      ${d.remarks ? `<tr><th>메모</th><td colspan="5">${esc(d.remarks)}</td></tr>` : ''}
    </table>
    <div class="e-lines-hd"><b>품목 ${d.lines.length}</b>
      <span class="dr-legend"><i class="dr-high"></i>확실 ${cnt.high}<i class="dr-mid"></i>확인 필요 ${cnt.mid}<i class="dr-none"></i>못 찾음 ${cnt.none}${cnt.edit ? `<i class="dr-edit"></i>직접 지정 ${cnt.edit}` : ''}</span><span class="sp"></span></div>
    <div class="e-tw" style="flex:1;overflow-x:auto"><table class="e-grid" style="min-width:${isDeliv ? 860 : 980}px"><colgroup><col style="width:30px"><col style="width:22%">${isDeliv ? '<col style="width:128px">' : ''}<col style="width:84px"><col style="width:44px"><col style="width:48px"><col style="min-width:240px">${isDeliv ? '' : '<col style="width:96px"><col style="width:82px"><col style="width:86px">'}</colgroup>
      <thead><tr><th>No</th><th>문서 품명 (원문)</th>${isDeliv ? '<th title="비우면 위 일자">출고일</th>' : ''}<th>규격</th><th>단위</th><th>수량</th><th>우리 품목 (이카운트)</th>${isDeliv ? '' : '<th>종전가</th><th>견적 단가</th><th>금액(별도)</th>'}</tr></thead>
      <tbody>${d.lines.map((l, i) => { const [cls] = DR_CONF[l.conf] || DR_CONF.none; return `<tr>
        <td class="no">${i + 1}</td><td title="${esc(l.raw_name)}" style="padding-left:6px">${esc(l.raw_name)}${l.unclear ? ' <span class="e-b orange">흐림</span>' : ''}${l.note ? ` <span class="muted">${esc(l.note)}</span>` : ''}</td>
        ${isDeliv ? `<td><input class="e-in" type="date" data-drf="date" data-i="${i}" value="${esc(isoDate(l.date))}" title="비우면 위 일자" style="width:100%"></td>` : ''}
        <td><input class="e-in" data-drf="spec" data-i="${i}" value="${esc(l.spec)}" style="width:100%"></td><td><input class="e-in" data-drf="unit" data-i="${i}" value="${esc(l.unit)}" style="width:100%;text-align:center"></td><td><input class="num" data-drf="qty" data-i="${i}" type="number" min="0" value="${esc(l.qty)}"></td>
        <td class="${cls}"><input data-drf="ours" data-i="${i}" class="dr-ours" autocomplete="off" value="${esc(l.ours || '')}" placeholder="${l.cands && l.cands.length ? '후보: ' + esc(l.cands[0]) : '우리 품목 검색·선택'}" title="${esc(l.ours || '')}${l.cands && l.cands.length ? '\n후보: ' + l.cands.map(esc).join(' / ') : ''}"></td>
        ${isDeliv ? '' : drPriceCells(l, i)}</tr>`; }).join('')}</tbody>
      ${isDeliv ? '' : `<tfoot><tr><td></td><td colspan="5" style="padding-left:6px;font-weight:700">합계 <span class="muted" id="dr-noprice">${t.noPrice ? `단가 없음 ${t.noPrice}` : ''}</span></td><td class="n muted" colspan="2">부가세 <b id="dr-vat">${eN(t.vat)}</b></td><td class="n muted">포함 <b id="dr-tot">${eN(t.tot)}</b></td><td class="n"><b id="dr-sup">${eN(t.sup)}</b></td></tr></tfoot>`}</table></div>
    <div class="e-tools">${eBtn('매핑 저장 (다음부터 자동)', 'erp-dr-learn')}${drMode === 'quote' ? eBtn('출고 입력으로 보내기', 'erp-dr-ship') : ''}<span class="sp"></span>
      ${isDeliv && dr.deliv ? (dr.deliv.outs || [dr.deliv.out]).map((o) => `<a class="e-btn" href="${HELPER}/api/file?path=${encodeURIComponent(o)}">납품확인서 받기 · ${esc(o.split('/').pop())}</a>`).join('') : ''}
      ${drMode === 'quote' && dr.quote ? `<a class="e-btn" href="${HELPER}/api/file?path=${encodeURIComponent(dr.quote.out)}">견적서 받기 · ${esc(dr.quote.out.split('/').pop())}</a>` : ''}
      ${isDeliv ? eBtn('납품확인서 만들기', 'erp-dr-deliv', '', 'pri') : drMode === 'buy' ? eBtn('구매전표 만들기', 'erp-dr-buy', '', 'pri') : eBtn('견적서 만들기 (거래처 양식)', 'erp-dr-quote', '', 'pri')}</div>
    ${dr.note ? `<div class="e-sum"><span>${esc(dr.note)}</span></div>` : ''}
    ${drMode === 'buy' ? drBuyPanel() : ''}`;
  }
  return ePage(`${drModeTabs()}<div class="e-tools">${dr.fromBatch !== undefined ? eBtn(`← ${drMode === 'buy' ? '구매전표' : drMode === 'deliv' ? '납품확인서' : '명세서'} 모음으로`, 'erp-drq-back', '', 'pri') : ''}<label class="e-btn ${dr.fromBatch !== undefined ? '' : 'pri'}" for="dr-file">파일 선택</label><input type="file" id="dr-file" accept="image/*,.heic,.pdf,.xlsx,.xls,.csv" multiple hidden>
      ${eBtn('인식 시작', 'erp-dr-read', dr.b64 && !dr.busy ? '' : 'disabled')}${dr.name ? `<span class="e-selinfo">${esc(dr.name)}</span>${eBtn('비우기', 'erp-dr-clear', '', 'sm')}` : ''}
      <span class="sp"></span>${drMode === 'deliv' ? `<label class="e-btn sm" for="dr-stamp">${DL.getStamp() ? '도장 ✓' : '도장'}</label><input type="file" id="dr-stamp" accept="image/*" hidden>` : ''}${helperBadge()}</div>
    <div class="e-dr"><div class="e-panel dr-drop"><div class="e-panel-hd"><b>원본 문서</b></div><div class="dr-view">${left}</div></div>
      <div class="e-panel"><div class="e-panel-hd"><b>인식 결과</b><span class="sp"></span></div><div class="dr-res">${right}</div></div></div>`);
}
// 붙여넣은 글(카톡·문자 품목 목록) — 파일과 같은 인식·매칭 (도우미 /api/doc/read {text})
function drTextBox() {
  return `<div class="dr-text" style="display:flex;flex-direction:column;gap:6px;width:100%;max-width:460px;margin:14px auto 0">
    <b style="font-size:13px">또는 카톡·문자 품목 목록 붙여넣기</b>
    <textarea id="dr-text" data-drt="text" rows="9" style="width:100%;font:inherit;padding:8px;border:1px solid var(--line,#ccc);border-radius:6px;resize:vertical" placeholder="한 줄에 한 품목&#10;예) 합판 9t 40장 - 12300&#10;    시멘트보드 3*6 8700원&#10;    아연각파이프 X">${esc(dr.text || '')}</textarea>
    <div style="display:flex;gap:6px"><input class="e-in" data-drt="partner" style="flex:1" placeholder="거래처 (알면 적기 — 그 거래처 품목으로 먼저 찾음)" value="${esc(dr.textPartner || '')}">
    ${eBtn(dr.busy ? '읽는 중…' : '글자로 인식', 'erp-dr-text', dr.busy ? 'disabled' : '', 'pri')}</div>${prevSyncLine()}</div>`;
}
let textMatch = null, textMatchMap = null;   // 도우미 없을 때 쓰는 품목 매칭 (매핑 사전이 바뀌면 다시 만듦)
function drSetDoc(doc, usage) {
  drNormDates(doc);
  doc.lines = doc.lines.map((l) => ({ ...l, ours: l.match.ours, code: l.match.code, conf: l.match.conf, cands: l.match.cands, price: l.prev ? l.prev.price : '' }));
  dr.doc = doc; dr.orig = JSON.parse(JSON.stringify(doc.lines || [])); dr.usage = usage; dr.quote = null; dr.deliv = null; dr.buy = null; dr.buyFile = ''; dr.pushed = null; dr.buyCopied = false; dr.buyTag = undefined; dr.buyAll = false;
}
// 종전가 (도우미 없을 때): 공유 DB 견적서 종전가(prev_prices) vs 이 앱 출고 단가 — 더 최근 것 (도우미와 같은 규칙)
function prevForHere(partner, raw, spec, ours) {
  const q = quotePrev(S.getPrevPrices(), partner, raw, spec);
  const sale = ours && partner ? lastSalePrice(ours, partner) : null;
  if (q && (!sale || String(q.date) >= String(sale.date || ''))) return q;
  if (sale && Number(sale.price) > 0) return { price: sale.price, src: `출고 ${sale.date || ''}`.trim(), date: sale.date || '' };
  return null;
}
function drReadTextHere() {   // 도우미 없이 이 화면에서 — 사전·품목마스터·추정 매칭 + 공유 DB 종전가
  if (!textMatch || textMatchMap !== S.getItemMap()) { textMatchMap = S.getItemMap(); textMatch = makeMatcher(ECOUNT_ITEMS, textMatchMap); }
  drSetDoc(readPastedText(dr.text, dr.textPartner || '', textMatch, prevForHere), null);
}
// 도우미가 켜진 맥에서 문서 인식을 열면 견적서 종전가를 공유 DB 로 올림 (10분에 한 번, 바뀐 줄만) → 다른 PC 도 같은 종전가
let prevSync = { busy: false, at: 0, msg: '' };
async function syncPrevPrices(force) {
  if (prevSync.busy || !helperState.up || S.getPrevState().missing) return;
  if (!force && Date.now() - prevSync.at < 10 * 60 * 1000) return;
  prevSync.busy = true; prevSync.at = Date.now();
  try {
    const r = await fetch(`${HELPER}/api/prev-prices`);
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || '도우미 응답 오류');
    const res = await S.savePrevPrices(j.rows || []);
    prevSync.msg = res.error ? `종전가 올리기 실패: ${res.error.message}` : (res.changed || res.removed ? `견적서 종전가 ${res.changed}줄 올림${res.removed ? ` · ${res.removed}줄 지움` : ''}` : '');
  } catch (e) { prevSync.msg = `종전가 가져오기 실패: ${e.message}`; }
  finally { prevSync.busy = false; render(); }
}
function prevSyncLine() {
  const st = S.getPrevState();
  if (st.missing) return '<span class="muted" style="font-size:12px">종전가 표가 아직 없어요 — 관리자가 Supabase에서 prev_prices SQL을 한 번 실행해야 해요</span>';
  if (!st.ready) return '';
  return `<span class="muted" style="font-size:12px">견적서 종전가 ${st.count.toLocaleString()}줄 공유됨${prevSync.busy ? ' · 올리는 중…' : ''}${prevSync.msg ? ` · ${esc(prevSync.msg)}` : ''}</span>`;
}
function drReadText() {
  const el = document.getElementById('dr-text'); if (el) dr.text = el.value;
  if (!(dr.text || '').trim() || dr.busy) return;
  dr.err = '';
  if (!helperState.up) {
    try { drReadTextHere(); } catch (e) { dr.err = e.message; }
    render(); return;
  }
  dr.busy = true; render();
  helperFetch('/api/doc/read', { text: dr.text, partner: dr.textPartner || '' })
    .then((j) => drSetDoc(j.doc, j.usage))
    .catch(() => { try { drReadTextHere(); } catch (e) { dr.err = e.message; } })   // 도우미 연결이 끊기면 이 화면에서라도
    .finally(() => { dr.busy = false; render(); });
}
// 명세서 여러 개 — 한 번에 인식해서 구매전표 모음으로 (한 개면 기존 화면 그대로)
let drq = { files: [], docs: [], busy: false, idx: -1, batch: null, batchFile: '', copied: '', tags: {}, tagAll: {} };
// 클립보드 이미지(캡처·카톡 사진 복사) 붙여넣기 — Cmd+V
function drFileObj(f) {
  return new Promise((ok) => { const rd = new FileReader(); rd.onload = () => ok({ name: f.name, mime: f.type || '', b64: String(rd.result).split(',')[1] || '' }); rd.readAsDataURL(f); });
}
function drPasteFiles(files) {
  if (!files.length) return;
  const inBatch = drq.files.length > 1 && dr.fromBatch === undefined;
  const pendingSingle = !inBatch && dr.b64 && !dr.doc;        // 한 장 올려놓고 아직 인식 안 한 상태면 거기에 더함
  if (!inBatch && !pendingSingle) { drLoadFiles(files); return; }
  Promise.all(files.map(drFileObj)).then((arr) => {
    if (inBatch) {
      drq.files.push(...arr); drq.docs.push(...arr.map(() => null)); drq.batch = null; drq.batchFile = ''; drq.copied = '';
    } else {
      const first = { name: dr.name, mime: dr.mime, b64: dr.b64 };
      drq = { files: [first, ...arr], docs: [first, ...arr].map(() => null), busy: false, idx: -1, batch: null, batchFile: '', copied: '', tags: {}, tagAll: {} };
      if (dr.url) URL.revokeObjectURL(dr.url);
      dr = { ...dr, name: '', url: '', mime: '', b64: '', doc: null, buy: null, buyFile: '', err: '', note: '' };
    }
    render();
  });
}
document.addEventListener('paste', (e) => {
  if (state.route !== 'docread' || !isDesk() || !drMode) return;
  const items = [...((e.clipboardData && e.clipboardData.items) || [])];
  const stamp = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const base = `붙여넣기_${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}_${pad(stamp.getHours())}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}`;
  const files = items.filter((it) => it.kind === 'file' && /^image\/|pdf$/.test(it.type)).map((it, i) => {
    const f = it.getAsFile();
    if (!f) return null;
    const ext = (f.type.split('/')[1] || 'png').replace('jpeg', 'jpg').replace('svg+xml', 'svg');
    return f.name && f.name !== 'image.png' ? f : new File([f], `${base}${i ? '_' + (i + 1) : ''}.${ext}`, { type: f.type });
  }).filter(Boolean);
  if (!files.length) return;          // 글자 붙여넣기(규격 칸 등)는 그대로 둠
  e.preventDefault();
  drPasteFiles(files);
});
function drLoadFiles(list) {
  const files = [...(list || [])];
  if (files.length <= 1) { drq = { ...drq, files: [], docs: [], batch: null, batchFile: '', copied: '' }; drLoadFile(files[0]); return; }
  Promise.all(files.map((f) => new Promise((ok) => { const rd = new FileReader(); rd.onload = () => ok({ name: f.name, mime: f.type || '', b64: String(rd.result).split(',')[1] || '' }); rd.readAsDataURL(f); })))
    .then((arr) => { drq = { files: arr, docs: arr.map(() => null), busy: false, idx: -1, batch: null, batchFile: '', copied: '', tags: {}, tagAll: {} }; if (dr.url) URL.revokeObjectURL(dr.url); dr = { ...dr, name: '', url: '', mime: '', b64: '', doc: null, buy: null, buyFile: '', err: '', note: '' }; render(); });
}
async function drqReadAll() {
  if (drq.busy || !drq.files.length) return;
  drq.busy = true; render();
  for (let i = 0; i < drq.files.length; i++) {
    if (drq.docs[i] && drq.docs[i].lines) continue;
    drq.idx = i; render();
    try {
      const f = drq.files[i];
      const doc = helperState.up ? (await helperFetch('/api/doc/read', { name: f.name, data: f.b64 })).doc : await drReadHere(f);
      doc.lines = doc.lines.map((l) => ({ ...l, ours: l.match.ours, code: l.match.code, conf: l.match.conf, cands: l.match.cands, price: l.prev ? l.prev.price : '' }));
      doc._orig = JSON.parse(JSON.stringify(doc.lines));
      drNormDates(doc);
      drq.docs[i] = doc;
      if (drq.tags[i] === undefined && /^\d{4}-\d{2}-\d{2}$/.test(doc.doc_date || '')) drq.tags[i] = doc.doc_date.slice(5, 7) + doc.doc_date.slice(8, 10) + '/';
    } catch (e) { drq.docs[i] = { error: e.message }; }
  }
  drq.idx = -1; drq.busy = false;
  if (drMode === 'buy') drqCheck(); else render();
}
function drqItems() {
  return drq.docs.map((d, i) => (d && d.lines ? { doc: d, tag: (document.getElementById('drq-tag-' + i) || {}).value ?? drq.tags[i] ?? '', tag_all: !!drq.tagAll[i] } : null)).filter(Boolean);
}
function drqSyncTags() {
  drq.docs.forEach((d, i) => { const el = document.getElementById('drq-tag-' + i); if (el) drq.tags[i] = el.value; const cb = document.getElementById('drq-all-' + i); if (cb) drq.tagAll[i] = cb.checked; });
}
function drqCheck() {
  drqSyncTags();
  const items = drqItems();
  if (!items.length) { render(); return; }
  drq.busy = true; drq.batchFile = ''; drq.copied = ''; render();
  helperFetch('/api/purchase/batch', { items }).then((j) => { drq.batch = j; })
    .catch((e) => { dr.err = e.message; }).finally(() => { drq.busy = false; render(); });
}
function drqFile() {
  drqSyncTags();
  drq.busy = true; render();
  helperFetch('/api/purchase/batch/file', { items: drqItems() }).then((j) => { drq.batch = j; drq.batchFile = j.out; })
    .catch((e) => { dr.err = e.message; }).finally(() => { drq.busy = false; render(); });
}
function drCopyPaste(text, done) {
  if (!text) { alert('합계가 맞는 명세서가 없어 복사할 게 없어요.'); return; }
  navigator.clipboard.writeText(text).then(done).catch(() => { prompt('자동 복사가 막혀 있어요. 아래 글자를 전부 선택해 복사하세요.', text); });
}
function drqOpen(i) {
  const d = drq.docs[i];
  if (!d || !d.lines) return;
  drqSyncTags();
  dr = { ...dr, name: drq.files[i].name, mime: drq.files[i].mime, url: '', b64: drq.files[i].b64, doc: d, orig: d._orig, buy: null, buyFile: '', pushed: null, err: '', note: '', fromBatch: i };
  render();
}
function drqBack() {
  if (dr.fromBatch !== undefined && dr.doc) { drq.docs[dr.fromBatch] = dr.doc; }
  dr = { ...dr, name: '', url: '', mime: '', b64: '', doc: null, buy: null, buyFile: '', fromBatch: undefined };
  drqCheck();
}
function drqPanel() {
  if (drMode !== 'buy') return drqListPanel();
  const n = drq.files.length;
  const read = drq.docs.filter((d) => d && d.lines).length;
  const b = drq.batch;
  const res = b ? b.results : [];
  let k = -1;
  const rows = drq.files.map((f, i) => {
    const d = drq.docs[i];
    if (!d) return `<tr><td class="no">${i + 1}</td><td colspan="6">${esc(f.name)} <span class="muted">${drq.busy && drq.idx === i ? '읽는 중…' : '인식 전'}</span></td></tr>`;
    if (d.error) return `<tr><td class="no">${i + 1}</td><td colspan="6">${esc(f.name)} <span class="e-b red">인식 실패</span> <span class="muted">${esc(d.error)}</span></td></tr>`;
    k += 1;
    const r = res[k];
    const v = r ? r.voucher : null;
    const warn = r && r.warnings.length ? `<div class="muted" style="white-space:normal">⚠ ${r.warnings.map(esc).join('<br>⚠ ')}</div>` : '';
    const st = !r ? '<span class="muted">검사 전</span>' : (r.ok ? '<span class="e-b green">합계 일치</span>' : `<span class="e-b red">막힘</span><div class="muted" style="white-space:normal">${r.errors.map(esc).join('<br>')}</div>`) + warn;
    return `<tr><td class="no">${i + 1}</td><td title="${esc(f.name)}">${esc(v ? v.cust_name : d.partner || '')}<div class="muted">${esc(f.name)}</div></td>
      <td class="c">${esc(d.doc_date || '')}</td><td class="n">${r ? eN(r.sums.total) : ''}</td>
      <td style="white-space:nowrap"><input class="e-in" id="drq-tag-${i}" value="${esc(drq.tags[i] ?? '')}" placeholder="0911/뉴하우징/평택김인숙" style="width:calc(100% - 70px)"> <label class="muted"><input type="checkbox" id="drq-all-${i}" ${drq.tagAll[i] ? 'checked' : ''}> 모든 줄</label></td>
      <td style="white-space:normal">${st}</td><td class="c">${eBtn('열어서 고치기', 'erp-drq-open', `data-i="${i}"`, 'sm')}</td></tr>`;
  }).join('');
  return ePage(`${drModeTabs()}<div class="e-tools"><label class="e-btn" for="dr-file">파일 선택</label><input type="file" id="dr-file" accept="image/*,.heic,.pdf,.xlsx,.xls,.csv" multiple hidden>
      <span class="e-selinfo">명세서 ${n}개 · 인식 ${read}개${b ? ` · 합계 일치 ${b.passed}개 / 막힘 ${b.failed}개` : ''}</span><span class="sp"></span>${helperBadge()}</div>
    ${dr.err ? `<div class="dr-err">${esc(dr.err)}</div>` : ''}
    <div class="e-panel"><div class="e-panel-hd"><b>구매전표 모음</b><span class="sp"></span>
      ${eBtn(drq.busy ? '처리 중…' : '전부 인식', 'erp-drq-read', drq.busy || read === n ? 'disabled' : '', read === n ? '' : 'pri')}${eBtn('다시 검사', 'erp-drq-check', drq.busy || !read ? 'disabled' : '')}</div>
      <div class="e-tw" style="overflow-x:auto"><table class="e-grid" style="min-width:900px"><colgroup><col style="width:30px"><col style="width:22%"><col style="width:90px"><col style="width:100px"><col style="width:240px"><col><col style="width:100px"></colgroup>
        <thead><tr><th>No</th><th>거래처 / 파일</th><th>일자</th><th>총액</th><th>규격 (날짜/판매처/현장)</th><th>상태</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="e-sum"><span class="muted">규격은 이카운트 규격 칸에 들어가요 (기본 첫 줄). 막힌 명세서는 [열어서 고치기]로 품목·거래처를 고친 뒤 돌아오세요. 파일·복사에는 합계가 맞는 명세서만 들어가요.</span></div>
      <div class="e-tools"><span class="sp"></span>
        ${drq.batchFile ? `<a class="e-btn" href="${HELPER}/api/file?path=${encodeURIComponent(drq.batchFile)}">받기 · ${esc(drq.batchFile.split('/').pop())}</a>` : ''}
        ${eBtn('엑셀 만들기', 'erp-drq-file', b && b.passed ? '' : 'disabled')}
        ${eBtn(drq.copied ? '복사됨 ✓' : `이카운트 붙여넣기용 복사${b && b.passed ? ` (${b.passed}건)` : ''}`, 'erp-drq-copy', b && b.passed ? '' : 'disabled', 'pri')}</div></div>`);
}
// 여러 장 — 납품확인서·견적 모드: 명세서 목록 + (납품확인서면) 모음
function drqListPanel() {
  const n = drq.files.length;
  const read = drq.docs.filter((d) => d && d.lines).length;
  const rows = drq.files.map((f, i) => {
    const d = drq.docs[i];
    if (!d) return `<tr><td class="no">${i + 1}</td><td colspan="4">${esc(f.name)} <span class="muted">${drq.busy && drq.idx === i ? '읽는 중…' : '인식 전'}</span></td></tr>`;
    if (d.error) return `<tr><td class="no">${i + 1}</td><td colspan="4">${esc(f.name)} <span class="e-b red">인식 실패</span> <span class="muted">${esc(d.error)}</span></td></tr>`;
    const days = [...new Set(d.lines.map((l) => isoDate(l.date)).filter(Boolean))];
    return `<tr><td class="no">${i + 1}</td><td title="${esc(f.name)}">${esc(d.partner || '')}${d.owner ? ` · ${esc(d.owner)}` : ''}<div class="muted">${esc(f.name)}</div></td>
      <td class="c">${esc(isoDate(d.doc_date) || d.doc_date || '')}${days.length ? `<div class="muted">출고 ${days.map((x) => x.slice(5)).join(', ')}</div>` : ''}</td><td class="n">${d.lines.length}줄</td>
      <td class="c">${eBtn('열어서 고치기', 'erp-drq-open', `data-i="${i}"`, 'sm')}</td></tr>`;
  }).join('');
  return ePage(`${drModeTabs()}<div class="e-tools"><label class="e-btn" for="dr-file">파일 선택</label><input type="file" id="dr-file" accept="image/*,.heic,.pdf,.xlsx,.xls,.csv" multiple hidden>
      <span class="e-selinfo">명세서 ${n}개 · 인식 ${read}개</span><span class="sp"></span>${helperBadge()}</div>
    ${dr.err ? `<div class="dr-err">${esc(dr.err)}</div>` : ''}
    <div class="e-panel"><div class="e-panel-hd"><b>명세서 모음</b><span class="sp"></span>
      ${eBtn(drq.busy ? '처리 중…' : '전부 인식', 'erp-drq-read', drq.busy || read === n ? 'disabled' : '', read === n ? '' : 'pri')}</div>
      <div class="e-tw" style="overflow-x:auto"><table class="e-grid" style="min-width:700px"><colgroup><col style="width:30px"><col><col style="width:150px"><col style="width:70px"><col style="width:100px"></colgroup>
        <thead><tr><th>No</th><th>거래처 / 파일</th><th>일자</th><th>품목</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>
    ${drMode === 'deliv' ? drqDelivPanel(read) : ''}`);
}
// 납품확인서 모음 — 인식한 명세서 전부에서 인슐레이션·방수시트·타이벡만, 전표(출고) 날짜마다 1장. 같은 파일·같은 발행번호 수정본은 한 번만
function drqDelivPanel(read) {
  const dv = drq.deliv;
  const made = dv ? dv.made.map((m) => `<tr><td class="c">${esc(m.date)}</td><td>${esc(m.client)}<div class="muted">${esc(m.site)}</div></td><td>${esc(m.what)}</td>
      <td style="white-space:normal">${esc(m.items)}<div class="muted">${m.from.map(esc).join(', ')}</div></td>
      <td class="c">${m.out ? `<a class="e-btn sm" href="${HELPER}/api/file?path=${encodeURIComponent(m.out)}">받기</a>` : ''}</td></tr>`).join('') : '';
  const skipped = dv && dv.skipped.length ? `<div class="e-sum" style="white-space:normal"><span class="muted">뺀 파일 — ${dv.skipped.map((x) => `${esc(x.name)} (${esc(x.why)})`).join(' · ')}</span></div>` : '';
  return `<div class="e-panel" style="margin-top:10px"><div class="e-panel-hd"><b>납품확인서 모음</b><span class="sp"></span>
      ${eBtn(drq.delivBusy ? '만드는 중…' : '납품확인서 모두 만들기', 'erp-drq-deliv', drq.busy || drq.delivBusy || !read ? 'disabled' : '', 'pri')}</div>
    ${dv ? (dv.made.length ? `<div class="e-tw" style="overflow-x:auto"><table class="e-grid" style="min-width:760px"><colgroup><col style="width:96px"><col style="width:26%"><col style="width:90px"><col><col style="width:70px"></colgroup>
      <thead><tr><th>납품일</th><th>거래처 / 현장</th><th>품목</th><th>내용 / 명세서</th><th></th></tr></thead><tbody>${made}</tbody></table></div>`
      : '<div class="e-empty">인슐레이션·방수시트·타이벡이 든 명세서가 없어요.</div>') + skipped : ''}</div>`;
}
function drqDeliv() {
  drqSyncTags();
  const items = drq.docs.map((d, i) => (d && d.lines ? { name: drq.files[i].name, doc: d,
    lines: d.lines.map((l) => ({ ours: l.ours, raw_name: l.raw_name, name: l.name, unit: l.unit, qty: l.qty, date: l.date || '' })) } : null)).filter(Boolean);
  if (!items.length) return;
  if (!helperState.up) { drqDelivHere(items); return; }
  drq.delivBusy = true; dr.err = ''; render();
  helperFetch('/api/delivery/make-batch', { items }).then((j) => { drq.deliv = j; })
    .catch((e) => { dr.err = e.message; }).finally(() => { drq.delivBusy = false; render(); });
}
function drqDelivHere(items) {
  if (delivNeedStamp(() => drqDelivHere(items))) return;
  const seen = new Set(), skipped = [];
  const uniq = items.filter((it, i) => { const k = drq.files[drq.docs.indexOf(it.doc)]?.b64 || it.name + i; if (seen.has(k)) { skipped.push({ name: it.name, why: '같은 파일' }); return false; } seen.add(k); return true; });
  const made = delivHere(uniq);
  drq.deliv = { here: true, made, skipped };
  render();
  if (made.length) DL.printConfirms(made).catch((e) => { dr.err = e.message; render(); });
}
function drLoadFile(file) {
  if (!file) return;
  if (dr.url) URL.revokeObjectURL(dr.url);
  const rd = new FileReader();
  rd.onload = () => {
    dr = { ...dr, name: file.name, mime: file.type || '', url: URL.createObjectURL(file), b64: String(rd.result).split(',')[1] || '', doc: null, usage: null, quote: null, err: '', note: '' };
    render();
  };
  rd.readAsDataURL(file);
}
// 도우미 없이 이 화면에서 — 우리 견적서·명세서 엑셀만 (사진·PDF 는 도우미 필요)
async function drReadHere(f) {
  if (!/\.xlsx$/i.test(f.name || '')) throw new Error('사진·PDF 인식은 이 맥의 로컬 도우미가 켜져 있어야 해요. 도우미 없이는 우리 견적서 엑셀(.xlsx)과 붙여넣은 글만 돼요.');
  const doc = await DL.readQuoteXlsx(f.b64);
  if (!textMatch || textMatchMap !== S.getItemMap()) { textMatchMap = S.getItemMap(); textMatch = makeMatcher(ECOUNT_ITEMS, textMatchMap); }
  doc.lines = doc.lines.map((l) => {
    const m = textMatch(doc.partner, l.raw_name, l.spec);
    const prev = Number(l.unit_price) > 0 ? { price: l.unit_price, src: '엑셀 단가', date: doc.doc_date } : prevForHere(doc.partner, l.raw_name, l.spec, m.ours);
    return { ...l, match: m, prev: prev || null };
  });
  return doc;
}
function drRead() {
  if (!dr.b64 || dr.busy) return;
  dr.busy = true; dr.err = ''; render();
  if (!helperState.up) {
    drReadHere({ name: dr.name, b64: dr.b64 }).then((doc) => drSetDoc(doc, null))
      .catch((e) => { dr.err = e.message; }).finally(() => { dr.busy = false; render(); });
    return;
  }
  helperFetch('/api/doc/read', { name: dr.name, data: dr.b64 }).then((j) => {
    const doc = j.doc;
    doc.lines = doc.lines.map((l) => ({ ...l, ours: l.match.ours, code: l.match.code, conf: l.match.conf, cands: l.match.cands, price: l.prev ? l.prev.price : '' }));
    drNormDates(doc);
    dr.doc = doc; dr.orig = JSON.parse(JSON.stringify(doc.lines || [])); dr.usage = j.usage; if (j.usage && helperState.info) helperState.info.ai = true; dr.quote = null; dr.deliv = null; dr.buy = null; dr.buyFile = ''; dr.pushed = null; dr.buyCopied = false; dr.buyTag = undefined; dr.buyAll = false;
  }).catch((e) => { dr.err = e.message; }).finally(() => { dr.busy = false; render(); });
}
function drLearn() {
  if (!dr.doc) return;
  const items = dr.doc.lines.filter((l) => l.ours && l.conf !== 'high').map((l) => ({ raw: l.raw_name, spec: l.spec, ours: l.ours }));
  if (!items.length) { dr.note = '새로 저장할 매핑이 없어요 (확실한 줄은 이미 사전에 있음).'; render(); return; }
  drSaveFixes();
  helperFetch('/api/map/learn', { partner: dr.doc.partner, items }).then((j) => {
    dr.doc.lines.forEach((l) => { if (l.ours && l.conf !== 'high') l.conf = 'high'; });
    dr.note = `매핑 ${j.saved}개 저장 — 같은 거래처 표기는 다음부터 자동으로 초록(확실)으로 잡혀요.`;
  }).catch((e) => { dr.err = e.message; }).finally(render);
}
// 화면에서 고친 값을 도우미에 알려줘 다음 판독부터 맞게 읽게 한다 (조용히)
function drSaveFixes() {
  if (!dr.doc || !dr.orig) return;
  helperFetch('/api/doc/learn', { partner: dr.doc.partner, orig: dr.orig, lines: dr.doc.lines }).catch(() => {});
}
// 구매전표 — 거래처 거래명세서 → 이카운트 구매입력. 금액은 명세서 그대로, 합계가 1원이라도 다르면 파일을 만들지 않음
function drBuyPayload() {
  const wh = document.getElementById('dr-buy-wh');
  const cust = document.getElementById('dr-buy-cust');
  const tag = document.getElementById('dr-buy-tag');
  const all = document.getElementById('dr-buy-all');
  if (tag) dr.buyTag = tag.value;
  if (all) dr.buyAll = all.checked;
  const d = dr.doc || {};
  const defTag = /^\d{4}-\d{2}-\d{2}$/.test(d.doc_date || '') ? d.doc_date.slice(5, 7) + d.doc_date.slice(8, 10) + '/' : '';
  return { doc: dr.doc, wh: wh ? wh.value : '', cust: cust ? cust.value.trim() : '', tag: tag ? tag.value : (dr.buyTag ?? defTag), tag_all: all ? all.checked : !!dr.buyAll };
}
function drBuy() {
  if (!dr.doc || dr.busy) return;
  drSaveFixes();
  const payload = drBuyPayload();
  dr.busy = true; dr.buyFile = ''; dr.buyCopied = false; dr.stockMsg = null; render();
  helperFetch('/api/purchase', payload).then((j) => { dr.buy = j; })
    .catch((e) => { dr.err = e.message; }).finally(() => { dr.busy = false; render(); });
}
function drBuyFile() {
  if (!dr.doc || dr.busy) return;
  dr.busy = true; render();
  helperFetch('/api/purchase/file', drBuyPayload()).then((j) => { dr.buy = j; dr.buyFile = j.out; drStockFeed(j); })
    .catch((e) => { dr.err = e.message; }).finally(() => { dr.busy = false; render(); });
}
// 구매전표 → 운영앱 재고 입고 (실리콘). 입고창고가 재고창고(천안창고·NS로지스 등)일 때만 반영, 매입창고/직송은 미반영. 이카운트 ERP 처럼.
const SIL_ALIAS = { 징크진회색: '징크그레이', 진회색: '징크그레이', 흰색: '백색' };
const SIL_COLOR_KEYS = Object.keys(SILICONE_COLORS).sort((a, b) => b.length - a.length); // 긴 색상명 우선(상아색>상아, 초코색>초코)
function drSilColor(l) {
  const txt = `${l.ours || ''} ${l.spec || ''} ${l.raw_name || ''}`;
  for (const c of SIL_COLOR_KEYS) if (txt.includes(c)) return c;
  for (const [a, c] of Object.entries(SIL_ALIAS)) if (txt.includes(a)) return c;
  return '';
}
function drStockFeed(b) {
  if (!b || !b.valid || !dr.doc) return;
  const v = b.voucher || {};
  const ecWh = (b.warehouses || []).find((w) => w.code === v.wh_code);
  const whName = ecWh ? ecWh.name : (v.wh_name || '');
  const sig = `buy:${v.cust_code}|${v.date}|${(v.lines || []).map((x) => `${x.prod_cd || x.prod_des}:${x.qty}`).join(',')}`;
  if (S.getInbounds().some((r) => (r.note || '').includes(sig))) { dr.stockMsg = { skip: 'dup' }; return; }
  const stockWH = S.warehouseNames().find((n) => n === whName);
  if (!stockWH) { dr.stockMsg = { skip: 'direct', wh: whName }; return; }
  const made = [];
  (v.lines || []).forEach((x, i) => {
    const l = (dr.doc.lines || [])[i] || {};
    if (!(/실리콘/.test(l.ours || '') || l.category === '실리콘')) return;
    const color = drSilColor(l);
    if (!color) { made.push({ warn: l.ours || l.raw_name || x.prod_des }); return; }
    const item = S.getItems().find((it) => it.category === '실리콘' && it.name === color && it.warehouse === stockWH);
    const perBox = (item && item.perBox) || 25;
    const isBox = /박스|box|pt|파레트/i.test(`${l.unit || ''} ${x.spec || ''}`);
    const boxes = isBox ? x.qty : (perBox > 0 ? Math.round((x.qty / perBox) * 100) / 100 : x.qty);
    S.addInbound({ date: v.date, warehouse: stockWH, category: '실리콘', name: color, qty: boxes, unit: '박스', perBox, unitPrice: l.unit_price || x.price || 0, supplier: v.cust_name || '', note: `구매전표 자동입고 ${sig}` });
    made.push({ color, boxes });
  });
  dr.stockMsg = { wh: stockWH, made };
}
function drStockMsgHtml() {
  const m = dr.stockMsg; if (!m) return '';
  if (m.skip === 'dup') return '<div class="e-sum"><span class="muted">이 명세서는 이미 재고에 반영됨 — 중복 입고 안 함</span></div>';
  if (m.skip === 'direct') return `<div class="e-sum"><span class="muted">입고창고 '${esc(m.wh || '')}'는 재고창고가 아니라 재고 미반영(직송). 재고에 넣으려면 입고창고를 천안창고·NS로지스 등 재고창고로 바꿔 [다시 검사] 후 확정하세요.</span></div>`;
  const ok = (m.made || []).filter((x) => x.color);
  const warns = (m.made || []).filter((x) => x.warn);
  if (!ok.length && !warns.length) return '<div class="e-sum"><span class="muted">실리콘 품목이 없어 재고 반영 없음</span></div>';
  return `<div class="e-sum"><span class="e-b green">${esc(m.wh)} 재고 입고 반영</span> <span>${ok.map((x) => `${esc(x.color)} ${x.boxes}박스`).join(' · ')}</span>${warns.length ? `<br><span class="muted">색상 못 찾아 미반영: ${warns.map((x) => esc(x.warn)).join(', ')}</span>` : ''}</div>`;
}
function drBuyPush() {
  const b = dr.buy;
  if (!dr.doc || dr.busy || !b || !b.valid) return;
  const e = b.ecount || {};
  if (!e.ready) { alert('이카운트 연결 정보가 없어요. 도우미 .env 에 ' + (e.missing || []).join(', ') + ' 를 넣고 도우미를 다시 켜주세요.'); return; }
  const v = b.voucher;
  const where = e.mode === '실서버' ? '실제 이카운트 ERP' : '이카운트 테스트 서버';
  if (!confirm(`${where}에 구매전표를 등록할까요?\n\n거래처: ${v.cust_name} (${v.cust_code})\n일자: ${v.date}\n품목 ${v.lines.length}줄 · 총액 ${eN(b.sums.total)}원 (공급가액 ${eN(b.sums.supply)} + 부가세 ${eN(b.sums.vat)})`)) return;
  dr.busy = true; render();
  helperFetch('/api/purchase/push', drBuyPayload()).then((j) => { dr.buy = j; dr.pushed = j.push; dr.err = ''; drStockFeed(j); })
    .catch((err) => { dr.err = err.message; }).finally(() => { dr.busy = false; render(); });
}
function drBuyPanel() {
  const b = dr.buy;
  if (!b) return '';
  const v = b.voucher, st = b.sums, dt = b.doc_totals || {};
  const cmp = (k, label) => {
    if (dt[k] === undefined) return `<td>${label}</td><td class="n">${eN(st[k])}</td><td class="n muted">명세서에 없음</td><td></td>`;
    const same = dt[k] === st[k];
    return `<td>${label}</td><td class="n">${eN(st[k])}</td><td class="n">${eN(dt[k])}</td><td class="c">${same ? '<span class="e-b green">일치</span>' : `<span class="e-b red">${eN(st[k] - dt[k])}원 차이</span>`}</td>`;
  };
  return `<div class="e-panel" style="margin-top:8px"><div class="e-panel-hd"><b>구매전표 미리보기</b><span class="sp"></span>
      ${b.valid ? '<span class="e-b green">명세서와 합계 일치</span>' : '<span class="e-b red">전표 만들 수 없음</span>'}</div>
    <table class="e-ftbl"><colgroup><col style="width:80px"><col><col style="width:80px"><col></colgroup>
      <tr><th>거래처</th><td><input class="e-in" id="dr-buy-cust" value="${esc(v.cust_code)}" placeholder="거래처코드" style="width:130px"> ${esc(v.cust_name)} <span class="muted">${esc(v.cust_how)}</span></td>
        <th>입고창고</th><td><select class="e-sel" id="dr-buy-wh">${(b.warehouses || []).map((w) => `<option value="${esc(w.code)}"${w.code === v.wh_code ? ' selected' : ''}>${esc(w.code)} ${esc(w.name)}</option>`).join('')}</select></td></tr>
      <tr><th>일자</th><td>${esc(v.date)}</td>
        <th>규격</th><td><input class="e-in" id="dr-buy-tag" value="${esc(v.tag || '')}" placeholder="0911/뉴하우징/평택김인숙" style="width:180px"> <label class="muted"><input type="checkbox" id="dr-buy-all" ${v.tag_all ? 'checked' : ''}> 모든 줄</label> <span class="muted">(이카운트 규격 칸 · 고친 뒤 [다시 검사])</span></td></tr>
    </table>
    ${b.errors.length ? `<div class="dr-err">${b.errors.map(esc).join('<br>')}</div>` : ''}
    ${b.warnings.length ? `<div class="e-sum"><span class="muted">${b.warnings.map(esc).join('<br>')}</span></div>` : ''}
    ${b.valid ? '<div class="e-sum"><span class="muted">이카운트 등록: 구매관리 → 구매입력 → 웹자료올리기 → 표 첫 칸(1번 줄 일자) 클릭 → Cmd+V → 확인 후 저장(F8). ※ 판매입력 화면에 붙여넣지 마세요.</span></div>' : ''}
    <div class="e-tw" style="overflow-x:auto"><table class="e-grid" style="min-width:760px"><colgroup><col style="width:30px"><col style="width:110px"><col style="min-width:260px"><col style="width:60px"><col style="width:84px"><col style="width:96px"><col style="width:84px"></colgroup>
      <thead><tr><th>No</th><th>품목코드</th><th>품목명 [규격]</th><th>수량</th><th>단가</th><th>공급가액</th><th>부가세</th></tr></thead>
      <tbody>${v.lines.map((x, i) => `<tr><td class="no">${i + 1}</td><td>${x.prod_cd ? esc(x.prod_cd) : '<span class="e-b red">없음</span>'}</td><td title="${esc(x.prod_des)}">${esc(x.prod_des)}${x.spec ? ` <span class="muted">[${esc(x.spec)}]</span>` : ''}</td>
        <td class="n">${esc(x.qty)}</td><td class="n">${eN(x.price)}</td><td class="n">${eN(x.supply)}</td><td class="n">${eN(x.vat)}</td></tr>`).join('')}</tbody></table></div>
    <table class="e-grid" style="margin-top:6px"><thead><tr><th style="width:110px"></th><th>전표</th><th>명세서</th><th style="width:110px">대조</th></tr></thead>
      <tbody><tr>${cmp('supply', '공급가액 합계')}</tr><tr>${cmp('vat', '부가세 합계')}</tr><tr>${cmp('total', '총액')}</tr></tbody></table>
    ${dr.pushed && dr.pushed.ok ? `<div class="e-sum"><span class="e-b green">이카운트 등록 완료</span> <span>${esc(dr.pushed.mode)} · 전표번호 ${esc((dr.pushed.slip_nos || []).join(', ') || '-')}</span></div>` : ''}
    ${drStockMsgHtml()}
    <div class="e-tools">${eBtn('다시 검사', 'erp-dr-buy')}<span class="sp"></span>
      ${dr.buyFile ? `<a class="e-btn" href="${HELPER}/api/file?path=${encodeURIComponent(dr.buyFile)}">받기 · ${esc(dr.buyFile.split('/').pop())}</a>` : ''}
      ${eBtn('이카운트 올리기 엑셀 만들기', 'erp-dr-buyfile', b.valid ? '' : 'disabled')}
      ${eBtn(dr.buyCopied ? '복사됨 ✓' : '이카운트 붙여넣기용 복사', 'erp-dr-buycopy', b.valid ? '' : 'disabled')}
      ${eBtn(`이카운트에 바로 등록${b.ecount && b.ecount.mode === '테스트' ? ' (테스트)' : ''}`, 'erp-dr-buypush', b.valid && b.ecount && b.ecount.ready && !(dr.pushed && dr.pushed.ok) ? '' : `disabled title="${esc(b.ecount && !b.ecount.ready ? '도우미 .env 에 이카운트 API 인증키가 필요해요' : '')}"`, 'pri')}</div></div>`;
}
function drQuote() {
  if (!dr.doc) return;
  const t = drTotals();
  if (t.noPrice && !confirm(`단가가 없는 품목이 ${t.noPrice}개 있어요. 그 줄은 단가 없이 들어갑니다. 계속할까요?`)) return;
  dr.busy = true; render();
  drSaveFixes();
  helperFetch('/api/quote', { doc: dr.doc, lines: dr.doc.lines.map((l) => ({ raw_name: l.raw_name, spec: l.spec, unit: l.unit, qty: l.qty, price: Number(l.price) || 0 })) })
    .then((j) => { dr.quote = j; dr.note = `견적서 저장: ${j.out} · 합계 ${Math.round(j.total_incl).toLocaleString()}원(부가세 포함)`; })
    .catch((e) => { dr.err = e.message; }).finally(() => { dr.busy = false; render(); });
}
// 수동 납품확인서 — 인식한 거래명세서에서 인슐레이션·방수시트·타이벡만, 명세서 줄 일자마다 1장 (공간제작소는 품목군마다 1장)
// 도우미 없이 — 브라우저에서 같은 양식으로 만들어 인쇄 창(PDF 저장)
let stampWait = null;   // 도장을 아직 안 골랐으면 고른 뒤 이어서 만듦
function delivNeedStamp(then) {
  if (DL.getStamp()) return false;
  stampWait = then;
  const el = document.getElementById('dr-stamp'); if (el) el.click();
  return true;
}
function delivHere(docs) {
  const groups = {};
  docs.forEach(({ doc, lines, name }) => {
    const client = (doc.partner || doc.client || '').trim(), owner = (doc.owner || '').trim(), addr = (doc.site || '').trim();
    const byDate = DL.targetRows(lines, isoDate(doc.doc_date) || DL.isoDate(new Date()));
    Object.entries(byDate).forEach(([day, rows]) => {
      const g = (groups[[client, owner, addr].join('\u0001')] = groups[[client, owner, addr].join('\u0001')] || { client, owner, addr, byDate: {}, from: new Set() });
      const d0 = (g.byDate[day] = g.byDate[day] || {});
      Object.values(rows).forEach((r) => { if (d0[r.name]) d0[r.name].qty += r.qty; else d0[r.name] = { ...r }; });
      if (name) g.from.add(name);
    });
  });
  const out = [];
  Object.values(groups).forEach((g) => DL.planConfirms(g.client, g.owner, g.addr, g.byDate).forEach((c) => out.push({ ...c, site: g.owner || g.addr, from: [...g.from] })));
  return out;
}
function drDelivHere() {
  if (delivNeedStamp(drDelivHere)) return;
  const made = delivHere([{ doc: dr.doc, lines: dr.doc.lines }]);
  if (!made.length) { dr.err = '이 명세서엔 인슐레이션·방수시트·타이벡 품목이 없어서 납품확인서를 만들지 않았어요.'; render(); return; }
  dr.deliv = null; dr.err = '';
  dr.note = `납품확인서 ${made.length}장 — 인쇄 창에서 "PDF로 저장"을 고르세요 (${made.map((c) => c.date + ' ' + c.what).join(' · ')})`;
  render();
  DL.printConfirms(made).catch((e) => { dr.err = e.message; render(); });
}
function drDeliv() {
  if (!dr.doc) return;
  if (!helperState.up) { drDelivHere(); return; }
  dr.busy = true; render();
  drSaveFixes();
  helperFetch('/api/delivery/make', { doc: dr.doc, lines: dr.doc.lines.map((l) => ({ ours: l.ours, raw_name: l.raw_name, name: l.name, unit: l.unit, qty: l.qty, date: l.date || '' })) })
    .then((j) => { dr.deliv = j; dr.note = `납품확인서 저장: ${(j.outs || [j.out]).join(', ')}`; })
    .catch((e) => { dr.err = e.message; }).finally(() => { dr.busy = false; render(); });
}
// 현장 서류(건축허가서 등) → 현장명(건축주)·납품장소 채우기. 서류에 찍힌 날짜는 납품일로 안 씀
// 현장 서류(건축허가서 등) → 지금 열린 문서의 현장명(건축주)·납품장소 채우기. 서류에 찍힌 날짜는 납품일로 안 씀
let siteDoc = { busy: false };
function drSiteDoc(file) {
  if (!file || !dr.doc) return;
  siteDoc.busy = true; dr.err = ''; render();
  const rd = new FileReader();
  rd.onload = () => {
    helperFetch('/api/delivery/sitedoc', { name: file.name, data: String(rd.result).split(',')[1] || '' })
      .then((j) => {
        if (j.owner) dr.doc.owner = j.owner; if (j.site) dr.doc.site = j.site;
        dr.note = `현장 서류에서 채움: ${[j.owner, j.site].filter(Boolean).join(' · ')}`;
      })
      .catch((e) => { dr.err = e.message; }).finally(() => { siteDoc.busy = false; render(); });
  };
  rd.readAsDataURL(file);
}
function drToShip() {
  if (!dr.doc) return;
  drSaveFixes();
  const nm = (s) => (s || '').replace(/\(주\)|주식회사|\s/g, '');
  const pt = S.getPartners().find((p) => nm(p.name) === nm(dr.doc.partner)) || S.getPartners().find((p) => nm(dr.doc.partner).includes(nm(p.name)) && nm(p.name));
  shipPrefill = { client: pt ? pt.name : (dr.doc.partner || ''), unloadAddr: dr.doc.site || '', status: '출고예정', matched: true,
    note: [dr.doc.owner && `현장명 ${dr.doc.owner}`].filter(Boolean).join(' '), warehouse: S.warehouseNames()[0] || '' };
  sfExtra = dr.doc.lines.map((l) => ({ name: l.ours || l.raw_name, qty: l.qty || '', unit: l.unit || '', price: l.price || '' }));
  openSheet(sheetShipForm());
}
function deskDelivDocs() {
  if (!helperState.checked) helperCheck();
  if (helperState.up && dd.rows === null && !dd.loading) {
    dd.loading = true;
    helperFetch('/api/delivery').then((j) => { dd.rows = j.rows; dd.err = ''; }).catch((e) => { dd.err = e.message; dd.rows = []; })
      .finally(() => { dd.loading = false; if (state.route === 'delivdocs') render(); });
  }
  if (helperState.checked && !helperState.up) return ePage(helperOff());
  const w = helperState.info || {};
  const rows = (dd.rows || []).map((r, i) => ({ ...r, id: String(i) }));
  const cols = [
    { k: 't', h: '처리 시각', w: 130, cls: 'c', v: (r) => esc(r['처리시각']) },
    { k: 'd', h: '출고일', w: 94, cls: 'c', v: (r) => esc(r['출고일']) },
    { k: 'c', h: '거래처', w: 130, v: (r) => esc(r['거래처']) },
    { k: 'p', h: '납품처', w: 220, v: (r) => esc(r['납품처']) },
    { k: 'j', h: '판정', w: 90, cls: 'c', v: (r) => r['판정'] === '불필요' ? '<span class="e-b gray">불필요</span>' : `<span class="e-b green">${esc(r['판정'])}</span>` },
    { k: 'n', h: '내용', v: (r) => esc(r['내용']) },
    { k: 'f', h: '파일', w: 76, cls: 'c', v: (r) => r['파일'] ? `<a class="e-btn sm" href="${HELPER}/api/file?path=${encodeURIComponent(r['파일'])}">받기</a>` : '' },
  ];
  return ePage(`<div class="e-tools">${eBtn('새로고침', 'erp-dd-reload', '', 'pri')}<span class="sp"></span>${helperBadge()}
      ${w.watch ? '<span class="e-b green">자동 감시 중</span>' : `<span class="e-b orange" title="${esc(w.watchErr || '')}">자동 감시 꺼짐${w.watchErr ? ' · ' + esc(w.watchErr) : ''}</span>`}</div>
    ${dd.err ? `<div class="dr-err">${esc(dd.err)}</div>` : ''}
    ${dd.rows === null ? '<div class="e-empty">불러오는 중…</div>' : eTable({ route: 'delivdocs', cols, rows, title: '납품확인서', empty: '아직 만들어진 납품확인서가 없어요.' })}`);
}

// ── 판매입력 (붙여넣기) — 거래처마다 '*이름' 머리줄 + 품목. 실리콘 25개입/박스, 색상만이면 ss9000 비오염성 기본. 도우미 /api/sale ──
let saleS = { text: '', wh: '00123', date: new Date().toISOString().slice(0, 10), results: null, busy: false, err: '', file: '', copied: false, whs: [], paste: '', passed: 0, total: 0, seq: 0 };
function saleSync() {   // 화면의 모든 편집칸(거래처코드·단가·품목)을 상태에 먼저 반영 — 재검산이 겹쳐도 값이 안 날아감
  if (!saleS.results) return;
  document.querySelectorAll('input[data-sf]').forEach((el) => {
    const r = saleS.results[Number(el.dataset.p)]; if (!r) return;
    if (el.dataset.sf === 'cust') { r.voucher.cust_code = el.value.trim(); return; }
    const l = r.doc.lines[Number(el.dataset.i)]; if (!l) return;
    if (el.dataset.sf === 'price') { l.unit_price = Number(el.value) || 0; l.amount = (Number(l.qty) || 0) * l.unit_price; }
    else if (el.dataset.sf === 'ours') { l.ours = el.value.trim(); const h = ECOUNT_ITEMS.find(([, n]) => n === l.ours); l.code = h ? h[0] : ''; if (!l.match) l.match = { ours: l.ours, code: l.code, conf: l.ours ? 'edit' : 'none' }; }
  });
}
function saleItems() {
  saleSync();
  return (saleS.results || []).map((r) => ({ cust: r.voucher.cust_code || '', wh: saleS.wh, doc: r.doc }));
}
const _nkey = (s) => String(s || '').replace(/\(주\)|주식회사|㈜|\s/g, '');
function salePrevPrice(custName, l) {   // 과거 판매가(운영앱 출고 이력)에서 같은 거래처·같은 색상/품목 최신 단가 (개당으로 환산)
  const color = drSilColor(l);
  const ours = l.ours || '';
  const a = _nkey(custName);
  const perBox = (color && (S.getItems().find((it) => it.category === '실리콘' && it.name === color) || {}).perBox) || 25;
  let best = null;
  for (const s of S.getShipments()) {
    const b = _nkey(s.client);
    if (a && b && !(a.includes(b) || b.includes(a) || a.slice(0, 3) === b.slice(0, 3))) continue;   // 정식명↔약칭 양방향
    const lines = (s.lines && s.lines.length) ? s.lines : [{ name: s.name, unitPrice: s.unitPrice, qty: s.qty, unit: s.unit }];
    for (const x of lines) {
      const p = Number(x.unitPrice) || 0; if (p <= 0) continue;
      const nm = x.name || '';
      if (!((color && nm.includes(color)) || (ours && nm === ours))) continue;
      const perUnit = (color && /박스/.test(x.unit || '')) ? p / perBox : p;   // 실리콘 박스단가 → 개단가 (판매수량이 개라서)
      if (!best || (s.date || '') >= best.date) best = { price: Math.round(perUnit), date: s.date || '' };
    }
  }
  return best;
}
function salePrepPrices(fill) {   // 줄마다 종전가 표시 + (fill 이면) 비어있는 단가를 종전가로 자동 채움
  let filled = 0;
  (saleS.results || []).forEach((r) => {
    const cust = r.voucher.cust_name || r.doc.partner || '';
    (r.doc.lines || []).forEach((l) => {
      const pv = salePrevPrice(cust, l);
      if (pv) l.prev = pv;
      if (fill && pv && !(Number(l.unit_price) > 0)) { l.unit_price = pv.price; l.amount = (Number(l.qty) || 0) * pv.price; filled++; }
    });
  });
  return filled;
}
function saleApply(j, fill) {
  saleS.results = j.results; saleS.whs = j.warehouses || saleS.whs; saleS.paste = j.paste || '';
  saleS.passed = j.passed || 0; saleS.total = j.total || 0; saleS.file = ''; saleS.copied = false;
  return salePrepPrices(fill);
}
function saleRead() {
  const ta = document.getElementById('sale-text'); const dt = document.getElementById('sale-date'); const wh = document.getElementById('sale-wh');
  if (ta) saleS.text = ta.value; if (dt) saleS.date = dt.value; if (wh) saleS.wh = wh.value;
  if (!saleS.text.trim() || saleS.busy) return;
  const my = ++saleS.seq;
  saleS.busy = true; saleS.err = ''; saleS.stockMsg = null; render();
  helperFetch('/api/sale', { text: saleS.text, doc_date: saleS.date, wh: saleS.wh })
    .then((j) => { if (my === saleS.seq) { const filled = saleApply(j, true); if (filled) { saleS.busy = false; saleRebuild(); return; } } })
    .catch((e) => { if (my === saleS.seq) saleS.err = e.message; }).finally(() => { saleS.busy = false; render(); });
}
function saleRebuild() {
  if (!saleS.results) return;
  const my = ++saleS.seq;
  const items = saleItems();
  helperFetch('/api/sale', { items })
    .then((j) => { if (my === saleS.seq) { saleApply(j); render(); } })   // 늦게 온 응답(옛 편집)은 버림
    .catch((e) => { if (my === saleS.seq) { saleS.err = e.message; render(); } });
}
function saleWhName() { const w = (saleS.whs || []).find((x) => x.code === saleS.wh); return w ? w.name : ''; }
// 판매입력 확정 → 운영앱 재고 차감(출고 기록). 출하창고가 재고창고(천안창고·NS로지스)일 때만, 실리콘만. 이카운트 ERP 처럼 직송창고면 미반영. 중복 방지.
function saleStockFeed() {
  if (!saleS.results) return;
  const whName = saleWhName();
  const stockWH = S.warehouseNames().find((n) => n === whName);
  if (!stockWH) { saleS.stockMsg = { skip: 'direct', wh: whName }; return; }
  const made = [];
  saleS.results.forEach((r) => {
    if (!r.ok) return;
    const v = r.voucher;
    const sig = `sale:${v.cust_code}|${v.date}|${v.lines.map((x) => `${x.prod_cd}:${x.qty}`).join(',')}`;
    if (S.getShipments().some((s) => (s.note || '').includes(sig))) return;   // 이미 반영
    const lines = [];
    (r.doc.lines || []).forEach((l) => {
      if (!(/실리콘/.test(l.ours || '') || l.category === '실리콘')) return;
      const color = drSilColor(l); if (!color) return;
      const item = S.getItems().find((it) => it.category === '실리콘' && it.name === color && it.warehouse === stockWH);
      const perBox = (item && item.perBox) || 25;
      const boxes = perBox > 0 ? Math.round((Number(l.qty) || 0) / perBox * 100) / 100 : (Number(l.qty) || 0);
      lines.push({ name: color, category: '실리콘', unit: '박스', qty: boxes, unitPrice: (Number(l.unit_price) || 0) * perBox });   // 재고는 박스단위 → 단가도 박스당 저장(종전가 읽을 때 개당으로 되환산)
    });
    if (lines.length) { S.addShipment({ date: v.date, warehouse: stockWH, client: v.cust_name, status: '출고완료', note: `판매입력 자동출고 ${sig}`, lines }); made.push(...lines.map((x) => `${x.name} ${x.qty}박스`)); }
  });
  saleS.stockMsg = { wh: stockWH, made };
}
function saleStockMsgHtml() {
  const m = saleS.stockMsg; if (!m) return '';
  if (m.skip === 'direct') return `<div class="e-sum"><span class="muted">출하창고 '${esc(m.wh || '')}'는 재고창고가 아니라 재고 미반영(직송). 재고에서 빼려면 천안창고·NS로지스 등 재고창고로 출하창고를 바꿔 확정하세요.</span></div>`;
  if (!m.made || !m.made.length) return '<div class="e-sum"><span class="muted">실리콘 재고창고 품목이 없어 재고 반영 없음</span></div>';
  return `<div class="e-sum"><span class="e-b green">${esc(m.wh)} 재고 차감(출고) 반영</span> <span>${m.made.map(esc).join(' · ')}</span></div>`;
}
function saleFile() {
  if (!saleS.results || saleS.busy) return;
  const my = ++saleS.seq;
  const items = saleItems();
  saleS.busy = true; render();
  helperFetch('/api/sale/file', { items })
    .then((j) => { if (my === saleS.seq) { saleApply(j); saleS.file = j.out; saleStockFeed(); } }).catch((e) => { if (my === saleS.seq) saleS.err = e.message; }).finally(() => { saleS.busy = false; render(); });
}
function saleCard(r, pi) {
  const v = r.voucher;
  const rows = v.lines.map((x, i) => {
    const l = (r.doc.lines || [])[i] || {};
    return `<tr>
      <td>${x.prod_cd ? esc(x.prod_cd) : '<span class="e-b red">코드X</span>'}</td>
      <td><input class="e-in" data-sf="ours" data-p="${pi}" data-i="${i}" value="${esc(l.ours || x.prod_des || '')}" style="width:100%"></td>
      <td>${esc(x.spec)}</td><td class="n">${esc(x.qty)}</td>
      <td><input class="num" data-sf="price" data-p="${pi}" data-i="${i}" type="number" min="0" value="${esc(l.unit_price || '')}" style="width:82px"></td>
      <td class="n">${eN(x.supply)}</td><td class="n">${eN(x.vat)}</td>
      <td class="muted">${l.prev && l.prev.price ? eN(l.prev.price) : ''}</td></tr>`;
  }).join('');
  return `<div class="e-panel" style="margin-top:8px"><div class="e-panel-hd">
      <b>${esc(v.cust_name || '(거래처?)')}</b> ${r.ok ? '<span class="e-b green">전표 OK</span>' : '<span class="e-b red">확인 필요</span>'}<span class="sp"></span>
      거래처코드 <input class="e-in" data-sf="cust" data-p="${pi}" value="${esc(v.cust_code || '')}" placeholder="코드" style="width:120px"> <span class="muted">${esc(v.cust_how || '')}</span></div>
    ${r.errors.length ? `<div class="dr-err">${r.errors.map(esc).join('<br>')}</div>` : ''}
    ${r.warnings.length ? `<div class="e-sum"><span class="muted">${r.warnings.map(esc).join('<br>')}</span></div>` : ''}
    <div class="e-tw"><table class="e-grid" style="min-width:720px"><colgroup><col style="width:120px"><col style="min-width:220px"><col style="width:80px"><col style="width:60px"><col style="width:90px"><col style="width:96px"><col style="width:84px"><col style="width:80px"></colgroup>
      <thead><tr><th>품목코드</th><th>우리 품목(이카운트)</th><th>규격</th><th>수량</th><th>단가</th><th>공급가액</th><th>부가세</th><th>종전가</th></tr></thead>
      <tbody>${rows}</tbody></table></div></div>`;
}
function deskSale() {
  const s = saleS;
  const whs = s.whs.length ? s.whs : [{ code: '00123', name: '천안창고' }, { code: '00120', name: 'NS로지스' }];
  const whOpts = whs.map((w) => `<option value="${esc(w.code)}"${w.code === s.wh ? ' selected' : ''}>${esc(w.code)} ${esc(w.name)}</option>`).join('');
  const head = `<div class="e-tools">
      <label class="muted">일자 <input class="e-in" type="date" id="sale-date" value="${esc(s.date)}"></label>
      <label class="muted">출하창고 <select class="e-sel" id="sale-wh">${whOpts}</select></label>
      <span class="sp"></span>${eBtn(s.busy ? '인식 중…' : '판매전표 인식', 'erp-sale-read', s.busy ? 'disabled' : '', 'pri')}${s.results ? eBtn('지우기', 'erp-sale-clear') : ''}</div>`;
  const paste = `<div class="e-panel"><div class="e-panel-hd"><b>판매 목록 붙여넣기</b> <span class="muted">거래처마다 <b>*이름</b> 머리줄(예: *국제통상), 그 아래 품목. 실리콘은 25개입/박스 → 박스로 적으면 수량 자동 환산, 색상만이면 ss9000 비오염성으로.</span></div>
      <textarea id="sale-text" class="e-in" style="width:100%;min-height:120px;font-family:inherit" placeholder="*국제통상&#10;베이지 20박스&#10;상아색 20박스&#10;&#10;*테시&#10;베이지 12박스">${esc(s.text)}</textarea></div>`;
  const err = s.err ? `<div class="dr-err">${esc(s.err)}</div>` : '';
  let body = '';
  if (s.results) {
    body = s.results.map((r, pi) => saleCard(r, pi)).join('')
      + `<div class="e-tools" style="margin-top:8px">통과 <b>${s.passed}/${s.results.length}</b> · 합계 ${eN(s.total)}원<span class="sp"></span>
        ${s.file ? `<a class="e-btn" href="${HELPER}/api/file?path=${encodeURIComponent(s.file)}">받기 · ${esc(s.file.split('/').pop())}</a>` : ''}
        ${eBtn('판매입력 엑셀 만들기', 'erp-sale-file', s.passed ? '' : 'disabled')}
        ${eBtn(s.copied ? '복사됨 ✓' : '이카운트 붙여넣기용 복사', 'erp-sale-copy', s.passed ? '' : 'disabled')}</div>
      ${saleStockMsgHtml()}
      <div class="e-sum"><span class="muted">이카운트: 판매관리 → 판매입력 → 웹자료올리기 → 표 첫 칸 클릭 → 붙여넣기(Cmd+V) → 확인 후 저장. ※ 구매입력 화면에 붙이지 마세요.</span></div>`;
  }
  return ePage(`${head}${err}${paste}${body}`, 'scroll');
}
const DESK_SCREENS = { dash: deskDash, partners: deskPartners, items: deskItems, whs: deskWhs, ecount: deskEcount, itemmap: deskItemMap,
  quotes: deskQuotes, ships: deskShips, dispatch: deskDispatch, invoices: deskInvoices, inbound: deskInbound, buy: deskBuy, sale: deskSale,
  stock: deskStock, silicone: deskSilicone, settings: deskSettings, docread: deskDocRead, delivdocs: deskDelivDocs };
// 화면별 F2(신규)
const DESK_NEW = { dash: 'new-ship', ships: 'new-ship', dispatch: 'new-ship', silicone: 'new-ship', quotes: 'add-quote', inbound: 'add-inbound',
  stock: 'add-item', items: 'add-item', partners: 'add-partner', whs: 'add-wh' };

function renderDesk() {
  document.body.classList.add('erp');
  state.route = deskRoute(state.route);
  try { sessionStorage.setItem('ht_route', state.route); } catch (e) { /* 무시 */ }
  const prevTw = app.querySelector('.e-main .e-tw');
  const keep = prevTw && app.dataset.route === state.route ? prevTw.scrollTop : 0;
  const [title, grp] = DESK_TITLES[state.route];
  app.dataset.route = state.route;
  app.innerHTML = `${deskTop()}${deskSide()}<main class="e-main">${ePhead(title, grp)}${DESK_SCREENS[state.route]()}</main>
    ${state.sheet ? `<div class="sheet-bg" data-act="backdrop"><div class="sheet"><button class="sheet-x" type="button" data-act="close" aria-label="닫기">✕</button>${state.sheet}</div></div>` : ''}`;
  if (keep) { const tw = app.querySelector('.e-main .e-tw'); if (tw) tw.scrollTop = keep; }
  if (state.sheet && document.getElementById('f-wh')) { fillItemSelect(); }
  if (state.sheet && document.getElementById('ib-wh')) { fillInboundItems(); }
}

// 조회 — 검색조건 칸 값을 읽어 필터 반영
function eApplyFilters() {
  const key = state.route;
  const box = app.querySelector('.e-main .e-cond'); if (!box) { render(); return; }
  const f = state.eF[key] = state.eF[key] || {};
  box.querySelectorAll('[data-f]').forEach((el) => { f[el.dataset.f] = el.value.trim(); });
  render();
}
function eDownloadCSV() {
  if (!eLast || !eLast.rows) return alert('내보낼 표가 없어요.');
  const txt = (v) => String(v ?? '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
  const cell = (v) => { const s = txt(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const cols = eLast.cols.filter((c) => c.k !== 'act');
  const lines = [cols.map((c) => cell(c.h)).join(',')];
  eLast.rows.forEach((r) => lines.push(cols.map((c) => cell(c.csv ? c.csv(r) : c.v(r))).join(',')));
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${eLast.title}_${S.todayStr()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
// 선택 일괄 처리 — 각 건에 기존 개별 처리(mark-done / doc-done)와 같은 값을 넣는다
function eBulk(kind) {
  const ships = S.getShipments().filter((s) => eSel.ids.has(s.id));
  if (!ships.length) return alert('먼저 목록에서 체크박스로 선택하세요.');
  if (kind === 'done') {
    const list = ships.filter((s) => s.status !== '출고완료');
    if (!list.length) return alert('선택한 건이 모두 이미 출고완료예요.');
    if (!confirm(`선택한 ${list.length}건을 출고완료 처리할까요?\n(담당자 확인 · 재고에서 차감됩니다)\n\n${list.slice(0, 12).map((s) => `· ${s.client || '(미지정)'} ${shipSummary(s).itemLabel}`).join('\n')}${list.length > 12 ? `\n외 ${list.length - 12}건` : ''}`)) return;
    list.forEach((s) => S.updateShipment(s.id, { status: '출고완료', doneAt: S.todayStr() }));
  } else if (kind === 'doc') {
    const list = ships.filter((s) => s.status === '출고완료' && !s.docDone);
    if (!list.length) return alert('선택한 건 중 명세서 발행할 건(출고완료 · 미발행)이 없어요.');
    if (!confirm(`선택한 ${list.length}건의 명세서를 발행완료로 표시할까요?\n\n${list.slice(0, 12).map((s) => `· ${s.client || '(미지정)'} ${shipSummary(s).itemLabel}`).join('\n')}${list.length > 12 ? `\n외 ${list.length - 12}건` : ''}`)) return;
    list.forEach((s) => S.updateShipment(s.id, { docDone: true, docBy: myName() }));
  }
  eSel.ids.clear();
  render();
}
// erp-* 클릭 처리
function erpAct(act, t) {
  if (act === 'erp-nav') {
    state.route = t.dataset.r; state.sheet = null; eSel = { route: '', ids: new Set() };
    if (t.dataset.set) { const [k, v] = t.dataset.set.split('='); state[k] = v; }
    if (t.dataset.preset) { const [path, v] = t.dataset.preset.split('='); const [rt, k] = path.split('.'); state.eF[rt] = { ...(state.eF[rt] || {}), [k]: v }; }
    render();
  } else if (act === 'erp-grp') { state.eClosed[t.dataset.g] = !state.eClosed[t.dataset.g]; render(); }
  else if (act === 'erp-tab') { state[t.dataset.k] = t.dataset.v; eSel = { route: '', ids: new Set() }; render(); }
  else if (act === 'erp-q') { eApplyFilters(); }
  else if (act === 'erp-reset') { delete state.eF[state.route]; render(); }
  else if (act === 'erp-reload') { location.reload(); }
  else if (act === 'erp-excel') { eDownloadCSV(); }
  else if (act === 'erp-sort') {
    const cur = state.eSort[t.dataset.r];
    state.eSort[t.dataset.r] = (cur && cur.k === t.dataset.k) ? (cur.d === 'asc' ? { k: t.dataset.k, d: 'desc' } : null) : { k: t.dataset.k, d: 'asc' };
    if (!state.eSort[t.dataset.r]) delete state.eSort[t.dataset.r];
    render();
  } else if (act === 'erp-sel' || act === 'erp-selall') {
    // 선택은 다시 그리지 않고 행 표시·건수만 갱신 (스크롤 유지)
    const tbl = t.closest('table');
    const boxes = act === 'erp-selall' ? [...tbl.querySelectorAll('tbody input[data-act="erp-sel"]')] : [t];
    const on = t.checked;
    boxes.forEach((b) => { b.checked = on; b.closest('tr').classList.toggle('sel', on); if (on) eSel.ids.add(b.dataset.id); else eSel.ids.delete(b.dataset.id); });
    if (act === 'erp-sel') { const all = tbl.querySelector('thead input[data-act="erp-selall"]'); const bx = [...tbl.querySelectorAll('tbody input[data-act="erp-sel"]')]; if (all) all.checked = bx.length && bx.every((b) => b.checked); }
    const c = document.getElementById('e-selcnt'); if (c) c.textContent = eSel.ids.size;
  } else if (act === 'erp-bulk') { eBulk(t.dataset.b); }
  else if (act === 'erp-ledger') { openSheet(sheetStockLedger(t.dataset.name)); }
  else if (act === 'erp-dr-read') drRead();
  else if (act === 'erp-dr-text') drReadText();
  else if (act === 'erp-dr-learn') drLearn();
  else if (act === 'erp-dr-quote') drQuote();
  else if (act === 'erp-dr-deliv') drDeliv();
  else if (act === 'erp-drq-deliv') drqDeliv();
  else if (act === 'erp-dr-mode') drSetMode(t.dataset.v);
  else if (act === 'erp-dr-buy') drBuy();
  else if (act === 'erp-dr-buyfile') drBuyFile();
  else if (act === 'erp-dr-buypush') drBuyPush();
  else if (act === 'erp-dr-buycopy') { if (dr.buy) { drCopyPaste(dr.buy.paste, () => { dr.buyCopied = true; render(); }); drStockFeed(dr.buy); render(); } }
  else if (act === 'erp-sale-read') saleRead();
  else if (act === 'erp-sale-file') saleFile();
  else if (act === 'erp-sale-copy') { if (saleS.paste) { drCopyPaste(saleS.paste, () => { saleS.copied = true; render(); }); saleStockFeed(); render(); } }
  else if (act === 'erp-sale-clear') { saleS.results = null; saleS.text = ''; saleS.err = ''; saleS.file = ''; saleS.stockMsg = null; render(); }
  else if (act === 'erp-drq-read') drqReadAll();
  else if (act === 'erp-drq-check') drqCheck();
  else if (act === 'erp-drq-file') drqFile();
  else if (act === 'erp-drq-copy') { drqSyncTags(); if (drq.batch) drCopyPaste(drq.batch.paste, () => { drq.copied = 'y'; render(); }); }
  else if (act === 'erp-drq-open') drqOpen(Number(t.dataset.i));
  else if (act === 'erp-drq-back') drqBack();
  else if (act === 'erp-dr-ship') drToShip();
  else if (act === 'erp-dr-clear') { if (dr.url) URL.revokeObjectURL(dr.url); dr = { name: '', url: '', mime: '', b64: '', busy: false, err: '', doc: null, orig: null, usage: null, quote: null, note: '', buy: null, buyFile: '' }; render(); }
  else if (act === 'erp-dr-check') { helperState.checked = false; helperCheck(); render(); }
  else if (act === 'erp-dd-reload') { dd = { rows: null, err: '' }; helperState.checked = false; helperCheck(); render(); }
  else if (act === 'erp-stockfix') {   // 실사 수정 — 기존 stock-edit 과 같은 입력·같은 저장(setStock), 끝나면 수불부로 복귀
    const it = S.findItem(t.dataset.id); if (!it) return;
    const v = prompt(`${it.name} · ${it.warehouse}\n현재 재고를 실제 수량(${it.unit})으로 수정`, S.currentStock(it));
    if (v !== null && String(v).trim() !== '') { S.setStock(it.id, v); openSheet(sheetStockLedger(it.name)); }
  }
}
// 문서 인식 — 파일 선택/끌어놓기, 입력칸 반영 (다시 그리지 않고 합계 칸만 갱신 → 한글 입력 안전)
function drUpdateTotals(i) {
  const l = dr.doc.lines[i];
  const a = document.getElementById('dr-amt-' + i); if (a) a.textContent = eN((Number(l.qty) || 0) * (Number(l.price) || 0));
  const t = drTotals();
  [['dr-sup', t.sup], ['dr-vat', t.vat], ['dr-tot', t.tot]].forEach(([id, v]) => { const el = document.getElementById(id); if (el) el.textContent = eN(v); });
  const np = document.getElementById('dr-noprice'); if (np) np.textContent = t.noPrice ? `단가 없음 ${t.noPrice}` : '';
}
app.addEventListener('change', (e) => {
  const el = e.target;
  if (el.id === 'dr-file') { if (drMode) drLoadFiles(el.files); return; }
  if (el.id === 'dr-stamp') {
    const f = el.files && el.files[0]; el.value = '';
    if (!f) { stampWait = null; return; }
    DL.setStamp(f).then(() => { const go = stampWait; stampWait = null; render(); if (go) go(); }).catch((e) => { dr.err = e.message; render(); });
    return;
  }
  if (el.id === 'dr-sitedoc') { drSiteDoc(el.files && el.files[0]); el.value = ''; return; }
  if (el.dataset.sf) {   // 판매입력 카드 편집 (거래처코드·단가·품목) → 재검증
    const p = Number(el.dataset.p); const r = saleS.results && saleS.results[p]; if (!r) return;
    if (el.dataset.sf === 'cust') { r.voucher.cust_code = el.value.trim(); }
    else {
      const l = r.doc.lines[Number(el.dataset.i)]; if (!l) return;
      if (el.dataset.sf === 'price') { l.unit_price = Number(el.value) || 0; l.amount = (Number(l.qty) || 0) * l.unit_price; }
      else if (el.dataset.sf === 'ours') { l.ours = el.value.trim(); const hit = ECOUNT_ITEMS.find(([, n]) => n === l.ours); l.code = hit ? hit[0] : ''; l.conf = l.ours ? 'edit' : 'none'; if (!l.match) l.match = { ours: l.ours, code: l.code, conf: l.conf }; }
    }
    saleRebuild();
    return;
  }
  if (!dr.doc || !el.dataset) return;
  if (el.dataset.drh) { dr.doc[el.dataset.drh] = el.value.trim(); return; }
  if (el.dataset.drf === 'date') { const l = dr.doc.lines[Number(el.dataset.i)]; if (l) l.date = isoDate(el.value); return; }
  if (el.dataset.drf === 'spec' || el.dataset.drf === 'unit') { const l = dr.doc.lines[Number(el.dataset.i)]; if (l) l[el.dataset.drf] = el.value; return; }
  if (el.dataset.drf === 'ours') {
    const l = dr.doc.lines[Number(el.dataset.i)]; if (!l) return;
    l.ours = el.value.trim();
    // 이름을 고르면 품목코드도 같이 (예전엔 이름만 바뀌고 코드는 비어서 구매전표에서 '품목 지정 안 됨'으로 막힘)
    const hit = ECOUNT_ITEMS.find(([, n]) => n === l.ours);
    l.code = hit ? hit[0] : '';
    l.conf = !l.ours ? 'none' : (l.ours === l.match.ours && l.match.conf === 'high') ? 'high' : 'edit';
    el.parentElement.className = (DR_CONF[l.conf] || DR_CONF.none)[0];
    el.title = l.ours ? (hit ? `품목코드 ${hit[0]}` : '품목 목록에 없는 이름 — 이카운트 품목명과 똑같이 적어야 붙여넣을 때 코드가 채워져요') : '';
    if (dr.buy) { dr.buy = null; dr.buyFile = ''; render(); }   // 품목을 바꿨으니 구매전표는 다시 검사
  }
});
app.addEventListener('input', (e) => {
  if (e.target.dataset && e.target.dataset.drt) { if (e.target.dataset.drt === 'text') dr.text = e.target.value; else dr.textPartner = e.target.value; return; }   // 다시 그리지 않음 (한글 입력 안전)
  if (dr.doc && e.target.dataset && (e.target.dataset.drf === 'price' || e.target.dataset.drf === 'qty')) { const i = Number(e.target.dataset.i); dr.doc.lines[i][e.target.dataset.drf] = e.target.value; drUpdateTotals(i); }
});
app.addEventListener('dragover', (e) => { if (e.target.closest && e.target.closest('.dr-drop')) { e.preventDefault(); e.target.closest('.dr-drop').classList.add('over'); } });
app.addEventListener('dragleave', (e) => { const z = e.target.closest && e.target.closest('.dr-drop'); if (z) z.classList.remove('over'); });
app.addEventListener('drop', (e) => { if (e.target.closest && e.target.closest('.dr-drop')) { e.preventDefault(); if (drMode) drLoadFiles(e.dataTransfer.files); } });

// ── 우리 품목 커스텀 드롭다운 (기본 datalist 대신 — 입력칸 바로 아래(오른쪽)에 떠서 원본을 안 가림) ──
let _drPop = null;
function drEcClose() { if (_drPop) { _drPop.remove(); _drPop = null; } }
function drEcOpen(input) {
  if (!dr.doc) return;
  const q = input.value.trim().toLowerCase().replace(/\s/g, '');
  let items = ECOUNT_ITEMS;
  if (q) items = ECOUNT_ITEMS.filter(([c, n]) => n.toLowerCase().replace(/\s/g, '').indexOf(q) >= 0 || String(c).toLowerCase().indexOf(q) >= 0);
  const list = items.slice(0, 60);
  drEcClose();
  _drPop = document.createElement('div');
  _drPop.className = 'dr-ecpop';
  _drPop._i = input.dataset.i;
  _drPop._input = input;
  _drPop.innerHTML = list.length
    ? list.map(([c, n]) => `<div class="opt" data-n="${esc(n)}"><div class="nm">${esc(n)}</div><div class="cd">${esc(c)}</div></div>`).join('')
    : '<div class="none">일치하는 품목이 없어요 — 이름을 조금 더 정확히</div>';
  document.body.appendChild(_drPop);
  drEcPlace();
  // 목록 안 어디를 눌러도(스크롤바 포함) 입력칸 포커스를 뺏지 않게 — 포커스가 빠지면 목록이 닫히므로
  _drPop.addEventListener('mousedown', (ev) => {
    ev.preventDefault();
    const opt = ev.target.closest('.opt'); if (!opt) return;
    drEcPick(Number(_drPop._i), opt.dataset.n);
  });
}
// 입력칸 바로 아래에 붙인다. 입력칸이 화면 밖으로 나가면 닫는다.
function drEcPlace() {
  if (!_drPop) return;
  const input = _drPop._input;
  if (!input || !input.isConnected) { drEcClose(); return; }
  const r = input.getBoundingClientRect();
  if (r.bottom < 0 || r.top > window.innerHeight) { drEcClose(); return; }
  const w = Math.max(r.width, 320);
  let left = r.left;
  if (left + w > window.innerWidth - 8) left = window.innerWidth - 8 - w;
  _drPop.style.left = Math.max(8, left) + 'px';
  _drPop.style.top = (r.bottom + 2) + 'px';
  _drPop.style.width = w + 'px';
}
function drEcPick(i, name) {
  const l = dr.doc && dr.doc.lines[i]; if (!l) { drEcClose(); return; }
  l.ours = name;
  const hit = ECOUNT_ITEMS.find(([, n]) => n === name);
  l.code = hit ? hit[0] : '';
  l.conf = !name ? 'none' : (name === l.match.ours && l.match.conf === 'high') ? 'high' : 'edit';
  const inp = app.querySelector(`input[data-drf="ours"][data-i="${i}"]`);
  if (inp) { inp.value = name; inp.parentElement.className = (DR_CONF[l.conf] || DR_CONF.none)[0]; inp.title = hit ? `품목코드 ${hit[0]}` : ''; }
  drEcClose();
  if (dr.buy) { dr.buy = null; dr.buyFile = ''; render(); }
}
app.addEventListener('focusin', (e) => { if (e.target.classList && e.target.classList.contains('dr-ours')) drEcOpen(e.target); });
app.addEventListener('input', (e) => { if (e.target.classList && e.target.classList.contains('dr-ours')) drEcOpen(e.target); });
app.addEventListener('focusout', (e) => { if (e.target.classList && e.target.classList.contains('dr-ours')) setTimeout(() => { if (_drPop && document.activeElement && !document.activeElement.classList.contains('dr-ours')) drEcClose(); }, 160); });
document.addEventListener('mousedown', (e) => { if (_drPop && !_drPop.contains(e.target) && !(e.target.classList && e.target.classList.contains('dr-ours'))) drEcClose(); });
// 목록 자체를 스크롤할 때는 그대로 두고, 바깥(표·페이지)이 스크롤되면 입력칸을 따라 자리만 옮긴다
document.addEventListener('scroll', (e) => { if (_drPop && !_drPop.contains(e.target)) drEcPlace(); }, true);
window.addEventListener('resize', drEcPlace);


// 화면 폭이 기준(1024px)을 넘나들면 다시 그림
DESK_MQ.addEventListener('change', () => { if (!isDesk()) document.body.classList.remove('erp'); render(); });

// 키보드 — PC 화면에서만
function eFocusNext(el) {
  const form = el.form || el.closest('.sheet');
  const f = [...form.querySelectorAll('input, select')].filter((x) => !x.disabled && !x.readOnly && x.type !== 'hidden' && x.type !== 'checkbox' && x.offsetParent !== null);
  const i = f.indexOf(el);
  // 출고 입력: 마지막 품목 줄의 단가에서 Enter → 행 추가
  if (el.dataset && el.dataset.sf === 'price' && Number(el.dataset.i) === sfExtra.length - 1) {
    const add = form.querySelector('[data-act="sf-add"]');
    if (add) { add.click(); const nx = document.querySelector(`#sf-extra [data-sf="name"][data-i="${sfExtra.length - 1}"]`); if (nx) nx.focus(); return; }
  }
  if (i >= 0 && f[i + 1]) { f[i + 1].focus(); if (f[i + 1].select && f[i + 1].type !== 'date' && f[i + 1].type !== 'time') f[i + 1].select(); }
}
document.addEventListener('keydown', (e) => {
  if (!isDesk() || e.isComposing || e.keyCode === 229) return;
  const sheet = app.querySelector('.sheet');
  const tag = (e.target.tagName || '').toLowerCase();
  const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
  if (e.key === 'F2') {
    e.preventDefault();
    if (!sheet) { const a = DESK_NEW[state.route] || 'new-ship'; const b = document.createElement('button'); b.dataset.act = a; b.style.display = 'none'; app.appendChild(b); b.click(); b.remove(); }
    return;
  }
  if (e.key === 'F8' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
    if (sheet) { const form = sheet.querySelector('form'); if (form) { e.preventDefault(); form.requestSubmit(); } return; }
    if (e.key === 'F8') { e.preventDefault(); eApplyFilters(); }
    return;
  }
  if (e.key === 'Escape' && sheet) {
    const form = sheet.querySelector('form');
    if (form && ![...form.querySelectorAll('input, textarea')].some((x) => x.value && x.defaultValue !== x.value)) { closeSheet(); return; }
    if (!form || confirm('입력 중인 내용이 있어요. 닫을까요?')) closeSheet();
    return;
  }
  if (e.key === 'Enter' && !e.shiftKey) {
    if (!sheet && e.target.closest && e.target.closest('.e-cond')) { e.preventDefault(); eApplyFilters(); return; }
    if (sheet && tag === 'input' && e.target.form && !['submit', 'button', 'checkbox', 'radio', 'file'].includes(e.target.type)) { e.preventDefault(); eFocusNext(e.target); return; }
    if (!sheet && tag === 'tr') { e.preventDefault(); e.target.click(); return; }
  }
  if (!sheet && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && (tag === 'tr' || !typing)) {
    const rows = [...app.querySelectorAll('.e-main .e-tbl tbody tr.ck')];
    if (!rows.length) return;
    e.preventDefault();
    const i = rows.indexOf(e.target);
    const nx = i < 0 ? rows[0] : rows[Math.max(0, Math.min(rows.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
    nx.focus(); nx.scrollIntoView({ block: 'nearest' });
    return;
  }
  if (e.key === '/' && !sheet && !typing) {
    const q = app.querySelector('.e-main .e-cond [data-f="q"], .e-main .e-cond input, #ecount-search, #map-search');
    if (q) { e.preventDefault(); q.focus(); }
  }
});

// ── 렌더 ──────────────────────────────────────────────
const TITLES = { home: ['홈트레이더스', '재고 · 출고 관리'], quote: ['견적', '견적 · 단가표'], silicone: ['실리콘', '색상별 재고'], stock: ['창고', '창고별 재고'], ship: ['출고', '등록하면 재고 자동 차감'], invoice: ['명세서', '거래명세서 발행 관리'], settings: ['설정', '품목 · 데이터'] };

function render() {
  if (isDesk()) { renderDesk(); return; }   // PC(1024px↑) = 업무형 화면
  document.body.classList.remove('erp');
  if (!TITLES[state.route]) mobileFromDesk();
  try { sessionStorage.setItem('ht_route', state.route); } catch (e) { /* 무시 */ }
  const [title, sub] = TITLES[state.route];
  const body = { home: screenHome, quote: screenQuote, silicone: screenSilicone, stock: screenStock, ship: screenShip, invoice: screenInvoice, settings: screenSettings }[state.route]();
  const showFab = state.route === 'ship' || state.route === 'home' || state.route === 'stock';
  app.innerHTML = `
    <div class="appbar"><img class="logo" src="./icons/logo-full.png" alt="HOME TRADERS"><h1>${title}</h1><span class="sub">${sub}</span></div>
    ${body}
    ${showFab ? `<div class="fab-wrap">
      ${state.fabOpen ? `
        <button class="fab-item" data-act="briefing">${I.doc}<span>오늘 출고 공지</span></button>
        <button class="fab-item" data-act="smart">${I.bolt}<span>붙여넣기 인식</span></button>
        <button class="fab-item" data-act="add-inbound">${I.box}<span>입고 등록</span></button>
        <button class="fab-item" data-act="new-ship">${I.plus}<span>출고 등록</span></button>` : ''}
      <button class="fab-main ${state.fabOpen ? 'open' : ''}" data-act="fab-toggle">${I.plus}</button>
    </div>` : ''}
    <nav class="nav">
      ${[['home', '홈', I.home], ['quote', '견적', I.doc], ['silicone', '실리콘', I.drop], ['stock', '창고', WH_ICONS.warehouse], ['ship', '출고', I.truck], ['invoice', '명세서', I.invoice], ['settings', '설정', I.cog]]
        .map(([r, l, ic]) => `<button data-act="nav" data-r="${r}" class="${state.route === r ? 'on' : ''}">${ic}<span>${l}</span></button>`).join('')}
    </nav>
    ${state.sheet ? `<div class="sheet-bg" data-act="backdrop"><div class="sheet"><button class="sheet-x" type="button" data-act="close" aria-label="닫기">✕</button>${state.sheet}</div></div>` : ''}
  `;
  if (state.sheet && document.getElementById('f-wh')) { fillItemSelect(); }
  if (state.sheet && document.getElementById('ib-wh')) { fillInboundItems(); }
}

// ── 이벤트 ────────────────────────────────────────────
function openSheet(html) { state.sheet = html; state.fabOpen = false; render(); }
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
  if (act.startsWith('erp-')) { erpAct(act, t); return; }   // PC 업무형 화면 전용 (조회·정렬·선택·일괄처리 등)

  if (act === 'nav') { state.route = t.dataset.r; state.sheet = null; if (t.dataset.r === 'stock') state.stockWH = null; if (t.dataset.r === 'ship') state.shipCat = null; render(); }
  else if (act === 'wh') { state.route = 'stock'; state.stockWH = t.dataset.w; render(); }
  else if (act === 'tilego') {
    const [r, f] = t.dataset.v.split(':');
    if (r === 'ship') { state.route = 'ship'; state.shipView = 'list'; state.shipFilter = f || '전체'; render(); }
    else if (r === 'quote') { state.route = 'quote'; render(); }
  }
  else if (act === 'quote-filter') { state.quoteFilter = t.dataset.v; render(); }
  else if (act === 'add-quote') { quotePrefill = null; openSheet(sheetQuoteForm(null)); }
  else if (act === 'smart') { openSheet(sheetChat()); }
  else if (act === 'chat-send') {
    const inp = document.getElementById('chat-input');
    const txt = (inp ? inp.value : '').trim();
    if (!txt) return;
    state.chat = state.chat || [];
    state.chat.push({ role: 'user', text: txt });
    state.chat.push(chatInterpret(txt));
    openSheet(sheetChat());
    const log = document.getElementById('chat-log'); if (log) log.scrollTop = log.scrollHeight;
    const ni = document.getElementById('chat-input'); if (ni) ni.focus();
  }
  else if (act === 'chat-clear') { state.chat = []; openSheet(sheetChat()); }
  else if (act === 'chat-go') {
    const m = (state.chat || [])[Number(t.dataset.i)];
    if (!m) return;
    if (m.kind === 'quote') { quotePrefill = m.payload; state.route = 'quote'; openSheet(sheetQuoteForm(null)); }
    else if (m.kind === 'dispatch') { openSheet(sheetSmartDispatch(m.payload)); }
    else if (m.kind === 'multiship') { state.route = 'ship'; openSheet(sheetSmartShip(m.payload)); }
    else if (m.kind === 'ship') { shipPrefill = m.payload; initShipLines(); state.route = 'ship'; openSheet(sheetShipForm()); }
  }
  else if (act === 'briefing') { openSheet(sheetBriefing()); }
  else if (act === 'briefing-copy') {
    const ta = document.getElementById('brief-text');
    const txt = ta.value;
    const done = () => alert('복사됐어요. 대표님께 붙여넣어 보내세요.');
    const fallback = () => { ta.focus(); ta.select(); ta.setSelectionRange(0, txt.length); try { document.execCommand('copy'); done(); } catch (e) { alert('복사가 안 되면, 위 칸을 길게 눌러 전체선택 후 복사해주세요.'); } };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, fallback);
    } else fallback();
  }
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
      else { shipPrefill = parseQuick(txt); initShipLines(); state.route = 'ship'; openSheet(sheetShipForm()); }
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
  else if (act === 'ship-call') { S.logShipCall(t.dataset.id, myName()); openSheet(sheetDoc(S.getShipments().find((s) => s.id === t.dataset.id))); }
  else if (act === 'ship-addphone') {
    const sh = S.getShipments().find((s) => s.id === t.dataset.id); if (!sh) return;
    const partner = S.findPartner(sh.client);
    const ph = (prompt(`${sh.client || '거래처'} 전화번호를 입력하세요`, (partner && partner.phone) || '') || '').trim();
    if (!ph) return;
    if (partner) S.updatePartner(sh.client, { name: partner.name, address: partner.address, phone: ph, note: partner.note });
    else if (sh.client) S.addPartner({ name: sh.client, phone: ph });
    openSheet(sheetDoc(S.getShipments().find((s) => s.id === t.dataset.id)));
  }
  else if (act === 'hold') {
    let r = t.dataset.r;
    if (r === '기타') { r = (prompt('보류 사유를 적어주세요', '') || '').trim(); if (!r) return; }
    if (t.dataset.kind === 'quote') { S.updateQuote(t.dataset.id, { holdReason: r }); openSheet(sheetQuote(t.dataset.id)); }
    else { S.updateShipment(t.dataset.id, { holdReason: r }); openSheet(sheetDoc(S.getShipments().find((s) => s.id === t.dataset.id))); }
  }
  else if (act === 'unhold') {
    if (t.dataset.kind === 'quote') { S.updateQuote(t.dataset.id, { holdReason: '' }); openSheet(sheetQuote(t.dataset.id)); }
    else { S.updateShipment(t.dataset.id, { holdReason: '' }); openSheet(sheetDoc(S.getShipments().find((s) => s.id === t.dataset.id))); }
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
  else if (act === 'db-toggle') {
    t.classList.toggle('on');
    if (t.id === 'db-max') document.getElementById('db-weight')?.classList.remove('need');
    if (t.id === 'db-urgent' && t.classList.contains('on')) {   // 바로 상하차 → 현재 시각 자동 입력
      const d = new Date(); const hh = String(d.getHours()).padStart(2, '0'); const mm = String(d.getMinutes()).padStart(2, '0');
      const el = document.getElementById('db-sched');
      if (el) { el.value = `즉시 · 지금(${hh}:${mm}) 바로 상하차`; el.classList.remove('need'); }
    }
  }
  else if (act === 'db-search') {
    const target = t.dataset.target || (t.dataset.t === 'from' ? 'db-from-addr' : 'db-to-addr');
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
    const addrFromRaw = g('db-from-addr').value.trim(); const addrToRaw = g('db-to-addr').value.trim();
    const fromPhoneV = (g('db-from-phone') ? g('db-from-phone').value.trim() : ''); const toPhoneV = (g('db-to-phone') ? g('db-to-phone').value.trim() : '');
    const addrFrom = addrFromRaw || '(주소 미등록)';
    const addrTo = addrToRaw || '(주소 미등록)';
    const weight = g('db-max').classList.contains('on') ? '최대' : g('db-weight').value.trim();
    const payOn = document.querySelector('#db-pay .on');
    const L = ['[배차 요청]', '', `상차지: ${from}`, `　${addrFrom}`];
    if (fromPhoneV) L.push(`　연락처 ${fromPhoneV}`);
    L.push('', `하차지: ${hide ? '홈트레이더스' : to}`, `　${addrTo}`);
    if (toPhoneV && !hide) L.push(`　연락처 ${toPhoneV}`);
    L.push('');
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
    // 하차지 거래처+주소+연락처 자동 등록/갱신 → 다음 배차부터 자동으로 뜨고 채워짐
    const toNm = (to || '').trim();
    let savedPartner = false;
    if (toNm && toNm !== '홈트레이더스') {
      const ex = S.findPartner(toNm);
      if (!ex) { S.addPartner({ name: toNm, address: addrToRaw, phone: toPhoneV }); savedPartner = true; }
      else if ((addrToRaw && (ex.address || '') !== addrToRaw) || (toPhoneV && (ex.phone || '') !== toPhoneV)) {
        S.updatePartner(toNm, { name: toNm, address: addrToRaw || ex.address || '', phone: toPhoneV || ex.phone || '', note: ex.note || '' }); savedPartner = true;
      }
    }
    // 상차지(창고) 주소·연락처도 저장
    const fromWh = S.getWarehouses().find((w) => w.name === from);
    if (fromWh) {
      const patch = {};
      if (addrFromRaw && (fromWh.address || '') !== addrFromRaw) patch.address = addrFromRaw;
      if (fromPhoneV && (fromWh.phone || '') !== fromPhoneV) patch.phone = fromPhoneV;
      if (Object.keys(patch).length) S.setWarehouseInfo(from, patch);
    }
    navigator.clipboard.writeText(text).then(
      () => alert(`배차 양식 복사됨 · 출고 건에 저장${savedPartner ? '\n하차지 거래처·주소도 등록했어요 (다음부터 자동)' : ''}\n\n` + text),
      () => alert(text));
  }
  else if (act === 'shipview') { state.shipView = t.dataset.v; state.shipCat = null; render(); }
  else if (act === 'shipfilter') { state.shipFilter = t.dataset.v; render(); }
  else if (act === 'shipcat') { state.shipCat = t.dataset.c || null; render(); }
  else if (act === 'selday') { state.selDate = t.dataset.d; render(); }
  else if (act === 'calnav') {
    let m = state.calM + Number(t.dataset.v), y = state.calY;
    if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
    state.calM = m; state.calY = y; render();
  }
  else if (act === 'fab-toggle') { state.fabOpen = !state.fabOpen; render(); }
  else if (act === 'new-ship') { shipPrefill = null; initShipLines(); openSheet(sheetShipForm()); }
  else if (act === 'sf-add') { readSfExtra(); sfExtra.push({ name: '', qty: '', unit: '', price: '' }); renderSfExtra(); }
  else if (act === 'sf-del') { readSfExtra(); sfExtra.splice(Number(t.dataset.i), 1); renderSfExtra(); }
  else if (act === 'quick') { shipPrefill = null; openSheet(sheetQuick()); }
  else if (act === 'add-inbound') { openSheet(sheetInboundForm()); }
  else if (act === 'color') { openSheet(sheetColor(t.dataset.c)); }
  else if (act === 'sil-wh') { state.silWH = t.dataset.w || null; render(); }
  else if (act === 'hometab') { state.homeTab = t.dataset.t; render(); }
  else if (act === 'quotetab') { state.quoteTab = t.dataset.t; render(); }
  else if (act === 'invoicetab') { state.invoiceTab = t.dataset.t; render(); }
  else if (act === 'checklist') { openSheet(sheetCheckList()); }
  else if (act === 'price-check-copy') { openSheet(sheetPriceCheck()); }
  else if (act === 'price-fill') { openSheet(sheetPriceFill()); }
  else if (act === 'buy-copy') { openSheet(sheetBuyStatement(t.dataset.sup)); }
  else if (act === 'master') { openSheet(sheetMasterEdit(t.dataset.name)); }
  else if (act === 'pfill-save') {
    const bySid = {};
    document.querySelectorAll('.pfill-in').forEach((inp) => {
      const v = Number(inp.value);
      if (!(v > 0)) return;
      (bySid[inp.dataset.sid] = bySid[inp.dataset.sid] || []).push({ li: Number(inp.dataset.li), price: v });
    });
    let n = 0;
    Object.keys(bySid).forEach((sid) => {
      const sh = S.getShipments().find((s) => s.id === sid); if (!sh) return;
      const lines = S.shipLines(sh).map((l) => ({ ...l }));
      bySid[sid].forEach(({ li, price }) => {
        if (!lines[li]) return;
        lines[li].unitPrice = price; n++;
        const it = S.getItems().find((x) => x.name === lines[li].name && x.warehouse === (lines[li].warehouse || sh.warehouse));
        if (it && !(Number(it.unitPrice) > 0)) S.updateItem(it.id, { unitPrice: price });
      });
      S.updateShipment(sid, { lines });
    });
    if (!n) return alert('입력한 단가가 없어요.');
    alert(`${n}개 품목 단가를 저장했어요.`);
    openSheet(sheetPriceFill());
  }
  else if (act === 'color-ship') {
    const it = S.findItem(t.dataset.id);
    shipPrefill = { warehouse: it.warehouse, itemId: it.id, qty: '', unit: it.unit, client: '', status: '출고완료', note: '', matched: it.name };
    initShipLines(); state.route = 'ship'; openSheet(sheetShipForm());
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
    initShipLines(); state.route = 'ship';
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
  else if (act === 'ship-stage') {
    state.docEditLines = false;
    const id = t.dataset.id, target = t.dataset.v;
    const sh = S.getShipments().find((s) => s.id === id);
    const hasDisp = sh && (sh.driverName || sh.driverPhone || sh.vehicle || sh.dispatchVia || Number(sh.freight) > 0 || sh.payment);
    if (target === '출고예정' && hasDisp) {
      if (!confirm('배차 요청 상태로 되돌립니다.\n등록된 배차 정보(기사·차량·운임·결제)를 지울까요?')) return;
      S.updateShipment(id, { status: '출고예정', dispatchVia: '', driverName: '', driverPhone: '', vehicle: '', freight: 0, payment: '' });
    } else {
      S.updateShipment(id, { status: target });
    }
    openSheet(sheetDoc(S.getShipments().find((s) => s.id === id)));
  }
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
      time: d.time || sh.time || '', note: [sh.note, d.note].filter(Boolean).join(' / '),
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
  else if (act === 'print-ship') { state.printHide = false; openSheet(sheetPrint(t.dataset.id)); }
  else if (act === 'print-hide') { state.printHide = !state.printHide; openSheet(sheetPrint(t.dataset.id)); }
  else if (act === 'print-now') { window.print(); }
  else if (act === 'mark-done') {
    const sh = S.getShipments().find((s) => s.id === t.dataset.id);
    if (!confirm(`${sh && sh.client ? sh.client + ' — ' : ''}출고 완료됐나요?\n(담당자 확인 · 재고에서 차감됩니다)`)) return;
    S.updateShipment(t.dataset.id, { status: '출고완료', doneAt: S.todayStr() }); render();
  }
  else if (act === 'toggle-doc') {
    const sh = S.getShipments().find((s) => s.id === t.dataset.id);
    const on = !sh.docDone;
    S.updateShipment(t.dataset.id, { docDone: on, docBy: on ? myName() : '' });
    openSheet(sheetDoc(S.getShipments().find((s) => s.id === t.dataset.id)));
  }
  else if (act === 'doc-done') {
    const sh = S.getShipments().find((s) => s.id === t.dataset.id);
    if (!confirm(`${sh && sh.client ? sh.client + ' ' : ''}명세서를 발행완료로 표시할까요?`)) return;
    S.updateShipment(t.dataset.id, { docDone: true, docBy: myName() }); render();
  }
  else if (act === 'kakao') { alert('카카오톡 명세서 발송은 2단계에서 연동됩니다.\n(스튜디오밭 카카오 콘솔 템플릿 사용)'); }
  else if (act === 'export') { downloadJSON(); }
  else if (act === 'logout') { S.signOut(); }
  else if (act === 'reset') { if (confirm('모든 입력을 지우고 초기값으로 되돌릴까요?')) { S.resetAll(); state.sheet = null; render(); } }

});

// 붙여넣기 textarea 에서 Enter → 바로 실행 (Shift+Enter 는 줄바꿈, 한글 조합중 Enter 는 무시)
app.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing || e.keyCode === 229) return;
  let sel = null;
  if (e.target.id === 'chat-input') sel = '[data-act="chat-send"]';
  else if (e.target.id === 'q-text') sel = '[data-act="q-parse"]';
  if (!sel) return;
  const btn = app.querySelector(sel);
  if (!btn) return;
  e.preventDefault();
  btn.click();
});

app.addEventListener('input', (e) => {
  if (e.target.id === 'ecount-search') { const box = document.getElementById('ecount-results'); if (box) box.innerHTML = isDesk() ? deskEcountTable(e.target.value) : ecountResultsHTML(e.target.value); return; }
  if (e.target.id === 'map-search') { const box = document.getElementById('map-results'); if (box) box.innerHTML = isDesk() ? deskMapTable(e.target.value) : mapResultsHTML(e.target.value); return; }
  // 출고 품목 수량·단가 타이핑하는 동안 금액·합계 즉시 갱신 (입력칸은 다시 그리지 않음 → IME 안전)
  if (e.target.dataset && (e.target.dataset.sf === 'qty' || e.target.dataset.sf === 'price')) recalcSf({ noFill: true });
  if (e.target.classList && e.target.classList.contains('need') && e.target.value.trim()) e.target.classList.remove('need');
  if (e.target.classList && (e.target.classList.contains('ql-qty') || e.target.classList.contains('ql-price'))) {
    const i = Number(e.target.dataset.i);
    if (qLines[i]) { if (e.target.classList.contains('ql-qty')) qLines[i].qty = e.target.value; else qLines[i].unitPrice = e.target.value; }
    const tot = document.getElementById('ql-total'); if (tot) tot.textContent = quoteTotal(qLines).toLocaleString() + '원';
  }
});

app.addEventListener('change', (e) => {
  if (e.target.id === 'f-wh') fillItemSelect();
  if (e.target.id === 'silout-color') { state.silOutColor = e.target.value; render(); }
  if (e.target.id === 'silout-client') { state.silOutClient = e.target.value; render(); }
  if (e.target.id === 'sf-client') { const p = S.findPartner(e.target.value.trim()); const a = document.getElementById('sf-unaddr'); if (p && p.address && a && !a.value.trim()) a.value = p.address; recalcSf(); }
  if (e.target.dataset && e.target.dataset.sf) recalcSf();
  if (e.target.id === 'ib-wh') fillInboundItems();
  if (e.target.id === 'ib-item') updateInboundHint();
  if (e.target.id === 'db-from') { const p = getPlaces().find((x) => x.name === e.target.value); const a = document.getElementById('db-from-addr'), ph = document.getElementById('db-from-phone'); if (a) a.value = p ? p.address : ''; if (ph) ph.value = p ? p.phone : ''; }
  if (e.target.id === 'db-to') { const p = getPlaces().find((x) => x.name === e.target.value); const a = document.getElementById('db-to-addr'), ph = document.getElementById('db-to-phone'); if (a && p) a.value = p.address; if (ph && p) ph.value = p.phone; }
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
    const wh = document.getElementById('f-wh').value;
    const status = form.querySelector('#f-status .on').dataset.v;
    const common = {
      date: form.date.value, time: form.time.value, client: form.client.value.trim(), status,
      dispatchVia: form.dispatchVia.value, driverName: form.driverName.value.trim(),
      driverPhone: form.driverPhone.value.trim(), vehicle: form.vehicle.value.trim(),
      freight: form.freight.value, payment: form.payment.value, note: form.note.value.trim(),
      method: form.querySelector('#f-method .on')?.dataset.v || '배차',
      courier: form.courier.value.trim(), trackingNo: form.trackingNo.value.trim(), courierFee: form.courierFee.value,
      recvName: form.recvName.value.trim(), recvPhone: form.recvPhone.value.trim(), recvAddr: form.recvAddr.value.trim(),
      unloadPlace: form.client.value.trim(), unloadAddr: (form.unloadAddr ? form.unloadAddr.value.trim() : '') };
    // 품목 = 통일된 한 리스트(sfExtra)
    const lines = []; const stockRefs = [];
    readSfExtra();
    sfExtra.forEach((l) => {
      const name = (l.name || '').trim(); const q = Number(l.qty);
      if (!name || !(q > 0)) return;
      const it = S.getItems().find((x) => x.name === name && x.warehouse === wh);
      const unit = (l.unit || '').trim() || (it ? it.unit : '박스');
      lines.push({ name, category: it ? it.category : '', spec: '', unit, qty: q, unitPrice: Number(l.price) || (it ? Number(it.unitPrice) : 0) });
      if (it) stockRefs.push({ it, qty: q, unit });
    });
    if (!lines.length) return alert('품목과 수량을 입력하세요.');
    // 재고 초과 경고
    const over = stockRefs.map(({ it, qty, unit }) => { const cur = S.currentStock(it); const req = (unit === '낱개' && it.perBox) ? qty / it.perBox : qty; return req > cur + 1e-9 ? `${it.name} (현재고 ${cur}${it.unit} < 요청 ${qty}${unit})` : null; }).filter(Boolean);
    if (over.length && !confirm(`재고 부족 주의\n\n${over.join('\n')}\n\n재고보다 많습니다. 그래도 출고할까요?`)) return;
    const newSh = S.addShipment({ ...common, warehouse: wh, lines });
    state.route = 'ship'; state.selDate = form.date.value;
    state.calY = +form.date.value.slice(0, 4); state.calM = +form.date.value.slice(5, 7);
    if (status === '출고예정' && newSh) openSheet(sheetPostSave(newSh.id)); else closeSheet();
  }
  else if (form.id === 'master-form') {
    const name = form.dataset.name;
    const up = form.unitPrice.value.trim();
    const patch = { supplier: form.supplier.value.trim(), aliases: form.aliases.value.trim() };
    if (up !== '') patch.unitPrice = Number(up);
    const unit = form.unit.value.trim(); if (unit) patch.unit = unit;
    S.getItems().filter((it) => (it.name || '(미지정)') === name).forEach((it) => S.updateItem(it.id, patch));
    closeSheet();
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
    const opt = document.getElementById('ib-item').selectedOptions[0];
    const warehouse = document.getElementById('ib-wh').value;
    const qty = Number(form.qty.value);
    if (!opt || !opt.value) return alert('품목을 선택하세요. (없으면 먼저 품목 추가)');
    if (!qty || qty <= 0) return alert('입고 수량을 입력하세요.');
    const cat = opt.dataset.cat;
    const unit = opt.dataset.unit || (document.getElementById('ib-unit').value || '');
    // addInbound 가 그 창고에 품목 레코드 없으면 자동 생성 (재고 0에서 시작)
    S.addInbound({ date: form.date.value, warehouse, category: cat, name: opt.value,
      qty, unit, perBox: form.perBox.value, unitPrice: form.unitPrice.value,
      vatSeparate: form.querySelector('#ib-vat .on').dataset.v === '1',
      supplier: form.supplier.value.trim(), note: form.note.value.trim() });
    state.stockWH = warehouse;
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
      client: form.client.value.trim(), date: form.date.value, time: form.time.value,
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
  myAccount = ((session.user && session.user.email) || '').split('@')[0];
  if (booted) { render(); return; }
  app.innerHTML = '<div style="padding:64px 24px;text-align:center;color:#888;font-size:15px">불러오는 중…</div>';
  try { const r = sessionStorage.getItem('ht_route'); if (r && (TITLES[r] || DESK_TITLES[r])) state.route = r; } catch (e) { /* 무시 */ }
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
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    try { reg.update(); } catch (_) {}
    setInterval(() => { try { reg.update(); } catch (_) {} }, 60000);
  }).catch(() => {});
}
