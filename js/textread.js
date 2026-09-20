// 붙여넣은 글(카톡·문자 품목 목록) 인식 — 도우미 없이 이 화면 안에서.
// 도우미 textread.py(글 나누기) + matcher.py(품목 매칭 중 사전·품목마스터·추정)를 옮긴 것. AI 는 쓰지 않는다.
// 도우미가 켜져 있으면 app.js 가 도우미를 먼저 쓰고(학습 매핑·견적서 종전가까지), 꺼져 있을 때만 이 파일로 읽는다.

const UNIT = String.raw`(?:단|장|개|EA|ea|Ea|롤|ROLL|roll|R(?![0-9A-Za-z])|박스|BOX|box|Box|본|매|봉|포|통|말|kg|KG|세트|SET|set|자루|묶음|번들|파레트|파렛트|빠레트|파렛|PLT|plt|PT|pt|헤베|㎡|m2|루베|평|개입|권|판|대|각|갑|곽|케이스)`;
const NUMS = String.raw`\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?`;
const QTY = new RegExp(String.raw`(?<![\d.*xX×])(${NUMS})\s*(${UNIT})(?![가-힣A-Za-z])`, 'g');
const QTY_X = new RegExp(String.raw`(?:^|\s)[xX×]\s*(${NUMS})\s*(${UNIT})?(?![\d.*])`);
const SPEC = [
  /(?<![#\d.])\d+(?:\.\d+)?\s*[*xX×]\s*\d+(?:\.\d+)?(?:\s*[*xX×]\s*\d+(?:\.\d+)?)*(?:\s*(?:mm|MM|자|m|M))?/g,
  /(?<![\d.*xX×#])\d+(?:\.\d+)?\s*(?:t|T|mm|MM|㎜|밀리|미리)(?![가-힣A-Za-z])/g,
  /(?<![A-Za-z])R-?\d{2}(?![0-9])/g,
  /(?<![\d.])\d+\s*(?:PCS|pcs|Pcs|입)(?![A-Za-z가-힣])/g,
  /(?<![\d.])\d+\s*자(?![가-힣])/g,
];
const SIL_COLORS = ['상아색', '반투명', '백색', '돼지백색변성', '라떼색', '라떼', '베이지', '초코색', '초코', '연밤색', '연혹색', '연흑색', '진회색', '네이비', '아이보리', '미색', '징크그레이', '징크진회색', '상아']; // 실리콘 색상 (긴 것 우선)
const NA = /(?:^|\s)(X|x|×|없음|없어요|품절|재고\s*없음|안\s*됨|불가)\s*$/;
const BULLET = /^\s*(?:[-*•·▶▷ㄴ]\s*|\d{1,2}[.)]\s+)/;
const PRICE_WON = new RegExp(String.raw`@?\s*(${NUMS})\s*(만|천)?\s*원`);
const PRICE_AT = new RegExp(String.raw`@\s*(${NUMS})\s*(만|천)?`);
const PRICE_ONLY = new RegExp(String.raw`^\s*(${NUMS})\s*(만|천)?\s*$`);
const DASH = /^(.*?\S)\s*[-–—=:]\s*(?=\S)(.*)$/;
const KAKAO_HEAD = /^\s*(?:20\d\d\.\s*\d{1,2}\.\s*\d{1,2}\.\s*(?:오전|오후)\s*\d{1,2}:\d{2},\s*[^:]{1,20}:\s*|\[[^\]]{1,20}\]\s*\[(?:오전|오후)\s*\d{1,2}:\d{2}\]\s*)/;

const pad2 = (n) => String(n).padStart(2, '0');
function normDate(v, today = new Date()) {
  const s = String(v || '').trim();
  let y; let mo; let d;
  let m = s.match(/(20\d\d)\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/) || s.match(/^(20\d\d)(\d\d)(\d\d)$/);
  if (m) [, y, mo, d] = m;
  else {
    m = s.match(/^(\d{1,2})\s*[./월]\s*(\d{1,2})\s*일?$/);
    if (!m) return '';
    y = today.getFullYear(); [, mo, d] = m;
  }
  const dt = new Date(Number(y), Number(mo) - 1, Number(d));
  if (dt.getMonth() !== Number(mo) - 1 || dt.getDate() !== Number(d)) return '';
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}
function findDate(text, today) {
  const t = String(text || '');
  let m = t.match(/(20\d\d)\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/);
  if (m) return normDate(m[0], today);
  m = t.match(/(?<!\d)(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  return m ? normDate(`${m[1]}월 ${m[2]}일`, today) : '';
}
function num(s, mult) {
  const v = parseFloat(String(s).replace(/,/g, '')) * ({ 만: 10000, 천: 1000 }[mult || ''] || 1);
  return Number.isInteger(v) ? v : v;
}
function priceIn(text) {
  for (const rx of [PRICE_WON, PRICE_AT]) {
    const m = text.match(rx);
    if (m) return [num(m[1], m[2]), (text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length)).trim()];
  }
  const m = text.match(PRICE_ONLY);
  if (m) return [num(m[1], m[2]), ''];
  return [null, text];
}

const LEAD_DATE = /^\s*((?:20\d\d\s*[.\-/]\s*)?\d{1,2}\s*[./]\s*\d{1,2}|\d{1,2}\s*월\s*\d{1,2}\s*일)(?=\s)/;   // 줄 맨 앞 출고일 '08/06'
function leadDate(t, today = new Date()) {
  const m = String(t).trim().match(/^(?:(20\d\d)\s*[.\-/]\s*)?(\d{1,2})\s*[./월]\s*(\d{1,2})\s*일?$/);
  if (!m) return '';
  return normDate(`${m[1] || today.getFullYear()}-${m[2]}-${m[3]}`, today);
}
// 규격 떼기 — 단, 밑줄로 이어 붙인 우리 품번(인슐레이션_크나우프_가등급_지붕_R37-15) 안은 건드리지 않음
function cutSpecs(left) {
  const specs = [];
  const out = left.split(/(\s+)/).map((tok) => {
    if (tok.includes('_')) return tok;
    for (const rx of SPEC) {
      for (const m of tok.matchAll(rx)) specs.push(m[0].trim());
      tok = tok.replace(rx, ' ');
    }
    return tok;
  }).join('');
  return [out, specs];
}

export function parseLine(line) {
  const raw = line.trim();
  let s = raw.replace(BULLET, '').trim();
  if (!s) return null;
  let lineDate = '';
  const ld = s.match(LEAD_DATE);
  if (ld && leadDate(ld[1])) { lineDate = leadDate(ld[1]); s = s.slice(ld[0].length).trim(); }
  // 구조재 규격 축약: '2-6 10자' → 2*6*10 (단면 2*6 + 길이 10자). 길이 '자' 있을 때만.
  let structSpec = '';
  const sm = s.match(/(?<!\d)(\d{1,2})\s*[-*xX×]\s*(\d{1,2})\s+(\d{1,3})\s*자(?!\d)/);
  if (sm) { structSpec = `${sm[1]}*${sm[2]}*${sm[3]}`; s = (s.slice(0, sm.index) + ' ' + s.slice(sm.index + sm[0].length)).trim(); }
  const note = [];
  let price = null;
  const na = s.match(NA);
  if (na) { note.push(`없음(${na[1]})`); s = s.slice(0, na.index).trim(); }
  let left = s; let right = '';
  let qty = 0; let unit = '';
  // 슬래시로 칸을 나눈 붙여넣기: '품명(-규격) / 수량 단위 / 단가원'. 품명 속 하이픈에 흔들리지 않게 칸으로 먼저 나눠 읽음
  const parts = s.split(/\s+\/\s+/);
  const slash = parts.length >= 2 && parts.slice(1).some((p) => new RegExp(QTY.source).test(p) || QTY_X.test(p) || PRICE_WON.test(p) || PRICE_AT.test(p));
  if (slash) {
    left = parts[0];
    for (const p of parts.slice(1)) {
      const mq = p.match(new RegExp(QTY.source)) || p.match(QTY_X);
      if (mq && !qty) { qty = num(mq[1]); unit = mq[2] || ''; continue; }
      if (price === null) {
        let pv = null;
        if (PRICE_WON.test(p) || PRICE_AT.test(p)) { [pv] = priceIn(p); } else { const mo = p.match(PRICE_ONLY); if (mo) pv = num(mo[1], mo[2]); }
        if (pv !== null) { price = pv; continue; }
      }
      if (p.trim()) note.push(p.trim());
    }
  } else {
    const d = s.match(DASH);
    if (d && /\d|원/.test(d[2]) && !/^\d$/.test(d[1].slice(-1))) { left = d[1].trim(); right = d[2].trim(); }
    if (right) {
      const [p, rest] = priceIn(right);
      price = p;
      if ((rest && rest !== right) || (price !== null && rest)) note.push(right);
      else if (price === null) note.push(right);
    }
    if (price === null && (PRICE_WON.test(left) || PRICE_AT.test(left))) {
      const [p2, rest] = priceIn(left);
      if (p2 !== null) { price = p2; left = rest; }
    }
    const ms = [...left.matchAll(QTY)];
    if (ms.length) {
      const m = ms[ms.length - 1];
      qty = num(m[1]); unit = m[2];
      left = (left.slice(0, m.index) + ' ' + left.slice(m.index + m[0].length)).trim();
    } else {
      const mx = left.match(QTY_X);
      if (mx) {
        qty = num(mx[1]); unit = mx[2] || '';
        left = (left.slice(0, mx.index) + ' ' + left.slice(mx.index + mx[0].length)).trim();
      }
    }
  }
  // 실리콘(색상·SS코드·세라믹전용실란트)은 25개입/박스: 박스로 오면 수량×25(개), 개로 오면 그대로 — 규격 칸에 박스수 표시.
  let silSpec = '';
  const isSil = raw.includes('실리콘') || /SS\s?\d{3,}|CTG|세라믹전용실란트/i.test(raw) || SIL_COLORS.some((c) => (raw + ' ' + left).includes(c));
  if (qty && isSil) {
    if (/박스|box/i.test(String(unit))) {
      const boxes = qty; qty = Math.round(qty * 25); unit = '개'; silSpec = `${boxes}박스`;
      note.push(`${boxes}박스×25개입 = ${qty}개`);
    } else if (/개|EA/i.test(String(unit)) || !unit) {
      const b = qty / 25; silSpec = `${Number.isInteger(b) ? b : Math.round(b * 100) / 100}박스`;
    }
  } else if (isSil && !qty) {
    // 실리콘은 색상+숫자만 있으면(단위 없이) 보통 박스. 2자리 이하=박스, 3자리 이상=개.
    const mnum = left.match(/(?<![\d.])(\d{1,4})(?![\d.])/);
    if (mnum) {
      const n = Number(mnum[1]);
      left = (left.slice(0, mnum.index) + ' ' + left.slice(mnum.index + mnum[0].length)).trim();
      if (n <= 99) { qty = n * 25; unit = '개'; silSpec = `${n}박스`; note.push(`${n}박스×25개입 = ${qty}개 (단위없음→박스로 봄)`); }
      else { qty = n; unit = '개'; const b = n / 25; silSpec = `${Number.isInteger(b) ? b : Math.round(b * 100) / 100}박스`; }
    }
  }
  const [cut, specs] = cutSpecs(left);
  left = cut;
  if (structSpec) specs.unshift(structSpec);
  let name = left.replace(/\(\s*\)|\[\s*\]/g, ' ').replace(/\s{2,}/g, ' ').trim().replace(/^[\s\-–—:=,/]+|[\s\-–—:=,/]+$/g, '');
  const cnt = (c) => name.split(c).length - 1;
  while (name && ('([,/'.includes(name.slice(-1)) || (name.slice(-1) === ')' && cnt('(') < cnt(')')) || (name.slice(-1) === ']' && cnt('[') < cnt(']')))) {
    name = name.slice(0, -1).trimEnd();
  }
  if (!name && structSpec) name = '구조재';   // 품명 없이 규격만 온 구조재 — 거래처+규격으로 매칭·학습
  if (/부가세\s*(별도|포함)|VAT/i.test(raw) && !note.some((n) => n.includes('부가세') || n.toUpperCase().includes('VAT'))) {
    note.push(raw.match(/부가세\s*(?:별도|포함)|VAT\s*\S*/i)[0]);
  }
  return {
    raw_name: name || raw, spec: silSpec || specs.join(' '), unit, qty, unit_price: price || 0,
    amount: qty && price ? qty * price : 0, vat: 0, note: note.join(' · '),
    unclear: !name || (!qty && price === null && !na), source_line: raw, date: lineDate,
  };
}

export function parseText(text, partner = '', today = new Date()) {
  const body = String(text || '').split(/\r?\n/).map((l) => l.replace(KAKAO_HEAD, ''));
  const lines = body
    .filter((l) => !/^\s*-*\s*20\d\d년\s*\d{1,2}월\s*\d{1,2}일.*$/.test(l))
    .map(parseLine)
    .filter((x) => x && !(!x.qty && !x.unit_price && findDate(x.source_line, today)));   // '9월 4일 발주' 같은 날짜 줄은 품목 아님
  return {
    doc_type: '붙여넣은 글', text_paste: true, partner: partner || '', manager: '', owner: '', site: '',
    doc_date: findDate(text, today), lines, remarks: `붙여넣은 글 ${lines.length}줄 — 단가는 적힌 그대로(부가세 포함 여부 확인)`,
    biz_no: '', totals: {},
  };
}

// ── 품목 매칭 (matcher.py 의 사전 → 품목마스터 → 품목군·규격 추정) ──
export function norm(s) {
  let t = String(s || '').toUpperCase();
  t = /\d\s*[X×]\s*\d/.test(t) ? t.replace(/[×X]/g, '*') : t.replace(/×/g, '*');
  return t.replace(/[\s"'″`_/()[\],.:;-]+/g, '');
}
function normKeepDot(s) {
  return String(s || '').toUpperCase().replace(/×/g, '*').replace(/(\d)\s*X\s*(\d)/g, '$1*$2').replace(/\s+/g, '|');
}
export function dims(s) {
  const t = normKeepDot(s);
  const out = new Set(t.match(/\d+(?:\.\d+)?\*\d+(?:\.\d+)?(?:\*\d+(?:\.\d+)?)?/g) || []);
  for (const m of t.matchAll(/R\d{2}/g)) out.add(m[0]);
  for (const m of t.matchAll(/(\d{2,3})MM/g)) out.add(m[1] + 'MM');
  for (const m of t.matchAll(/(?<![\d.])(\d{1,2}(?:\.\d)?)T(?![A-Z])/g)) out.add(m[1] + 'T');
  return out;
}
const CATS = [
  [/구조목|구조재|SPF|스프러스|SPRUCE|REDWOOD|WHITEWOOD|WHI\s*TEWOOD/, '구조재'], [/SPF/, 'SPF'], [/SPRUCE|스프러스/, '스프러스'], [/REDWOOD|레드우드/, '레드파인'], [/방부목/, '방부목'], [/OSB|O\.S\.B/, 'O.S.B'], [/태고/, '태고합판'],
  [/시멘트\s*보드/, '시멘트보드'], [/각파이프|각관/, '각관'], [/내수/, '내수'], [/합판/, '합판'], [/방수시트|루핑|언더가드/, '방수시트'], [/타이백|타이벡|TYVEK|하우스랩/, '타이벡'],
  [/이지실|이지씰|EZ\s*SEAL/, '이지씰'], [/실씰러|씰실러|SILL/, '씰실러'], [/조이스트|롤건네일/, '롤건네일'],
  [/건네일|스틱네일/, '스틱네일'], [/해머타카핀/, '해머타카핀'], [/타카핀/, '타카핀'], [/크나프트|크나우프/, '크나우프'],
  [/죤스맨빌|존스맨빌/, '인슐레이션'], [/인슐/, '인슐레이션'], [/석고/, '석고보드'], [/MDF/, 'MDF'],
  [/각재|다루끼/, '다루끼'], [/세트앙카|앙카/, '앙카'], [/와샤|와셔/, '와셔'], [/PSCL/, 'PSCL'], [/HD3/, 'HD3'],
  [/\bR1\b|R1\s*\(/, '_R1'], [/JH\s*26/, 'JH26'], [/월드폼|폼본드/, '폼본드'], [/우레탄폼/, '우레탄폼'],
  [/델타피스|델타스크류/, '델타스크류'], [/DAP/, 'DAP'], [/레프트|래프트|벤트|밴트/, '래프트벤트'], [/톤백/, '톤백'],
  [/마대/, '마대'], [/실리콘/, '실리콘'], [/사이딩/, '사이딩'], [/몰딩/, '몰딩'], [/템바/, '템바'],
];
const GRADES = [[/J-?GRADE|JAS/, 'JAS/J-GRADE'], [/PREM|PRIEM/, 'PREMIUM/SE'], [/2&BTR|2&B/, '2&BTR']];
const cats = (s) => { const u = String(s || '').toUpperCase(); return CATS.filter(([rx]) => rx.test(u)).map(([, c]) => c); };
const LEDGER_TAIL = /\s*\/\s*[\d,.]+\s*[*xX×]\s*[\d,.]+\s*$/;
const TAG_TAIL = /\s*\[[^\]]*\]\s*$/;

export function makeMatcher(ecountItems, itemMap) {
  const byName = new Map(ecountItems.map(([c, n]) => [n, c]));
  const byNorm = new Map();
  for (const [c, n] of ecountItems) if (!byNorm.has(norm(n))) byNorm.set(norm(n), [c, n]);
  const seeds = new Map();
  for (const [partner, raw, ours] of itemMap) {
    const k = norm(raw);
    if (!seeds.has(k)) seeds.set(k, []);
    seeds.get(k).push({ partner, ours });
  }
  let prepared = null;   // 품목마다 대문자 이름·규격 토큰 (처음 추정할 때 한 번만)
  const masterName = (raw) => {
    const t = String(raw || '').normalize('NFC').trim();
    const t2 = t.replace(LEDGER_TAIL, '').trim();
    for (const x of new Set([t, t2, t2.replace(TAG_TAIL, '').trim()])) {
      if (byName.has(x)) return [byName.get(x), x];
      if (byNorm.has(norm(x))) return byNorm.get(norm(x));
    }
    return null;
  };
  return function match(partner, raw, spec = '') {
    const hit = seeds.get(norm(raw)) || (spec && seeds.get(norm(`${raw} ${spec}`))) || [];
    if (hit.length) {
      const pick = hit.find((s) => norm(s.partner) === norm(partner)) || hit[0];
      const alts = [...new Set(hit.filter((s) => s.ours !== pick.ours).map((s) => s.ours))];
      return { ours: pick.ours, code: byName.get(pick.ours) || '', conf: 'high', src: '사전', cands: alts.slice(0, 4) };
    }
    const mm = masterName(raw);
    if (mm) return { ours: mm[1], code: mm[0], conf: 'high', src: '품목마스터', cands: [] };
    const text = `${raw} ${spec}`;
    const cs = cats(text); const ds = dims(text);
    const up = text.toUpperCase();
    const grade = (GRADES.find(([rx]) => rx.test(up)) || [])[1] || '';
    if (!prepared) prepared = ecountItems.map(([code, name]) => ({ code, name, un: name.toUpperCase(), dm: dims(name) }));
    const scored = [];
    for (const it of prepared) {
      const cm = cs.filter((c) => it.un.includes(c.toUpperCase()));
      if (cs.length && !cm.length) continue;
      let sc = 3 * cm.length;
      for (const x of ds) if (it.dm.has(x)) sc += 4;
      if (grade && grade.split('/').some((g) => it.un.replace('J-GRADE', 'JAS/J-GRADE').includes(g))) sc += 1;
      if (sc >= 3) scored.push([sc, it.name, it.code, it.dm]);
    }
    scored.sort((a, b) => b[0] - a[0] || b[1].length - a[1].length);
    if (!scored.length || scored[0][0] < 7 || ![...ds].some((x) => scored[0][3].has(x))) {
      return { ours: '', code: '', conf: 'none', src: '', cands: scored.slice(0, 3).map((x) => x[1]) };
    }
    return { ours: scored[0][1], code: scored[0][2], conf: 'mid', src: '추정', cands: scored.slice(1, 4).map((x) => x[1]) };
  };
}

// ── 종전가 (도우미 matcher.prev_price 와 같은 규칙) ──
// rows = 견적서 원래 줄 [{partner, raw, spec, price, date, saved}] (공유 DB prev_prices)
function latest(c) {   // 가장 최근 견적일자(같은 날이면 나중 파일). 새 견적 단가가 옛 견적 단가를 그대로 옮긴 것이면 새 단가로 안 침
  let best = null; const older = new Set();
  for (const q of [...c].sort((a, b) => String(a.date).localeCompare(String(b.date)) || Number(a.saved) - Number(b.saved))) {
    const p = Number(q.price);
    if (!best || p === Number(best.price) || !older.has(p)) best = q;
    older.add(p);
  }
  return best;
}
export function quotePrev(rows, partner, raw, spec = '') {
  const pn = norm(partner);
  const same = rows.filter((q) => { const qp = norm(q.partner); return !pn || qp.includes(pn.slice(0, 4)) || pn.includes(qp.slice(0, 4)); });
  let c = same.filter((q) => norm(q.raw) === norm(raw));
  if (!c.length) {   // '실리콘 반투명' ↔ 품명 '실리콘' + 규격 '반투명'
    const joined = norm(raw + spec);
    c = same.filter((q) => norm(q.raw + q.spec) === joined || norm(q.raw) === joined);
  }
  if (spec) { const cs = c.filter((q) => norm(q.spec) === norm(spec)); if (cs.length) c = cs; }
  const b = latest(c);
  return b ? { price: Number(b.price), src: `견적 ${b.date}`, date: b.date } : null;
}

// 글 → 화면에 넣을 문서 (도우미 /api/doc/read 와 같은 모양).
// prevFor(거래처, 원문품명, 규격, 우리품목) → {price, src, date} | null
export function readPastedText(text, partner, match, prevFor) {
  const doc = parseText(text, partner);
  doc.remarks += ' · 도우미 없이 이 화면에서 인식 (학습 매핑은 도우미가 켜져 있을 때만)';
  doc.lines = doc.lines.map((l) => {
    const m = match(doc.partner, l.raw_name, l.spec);
    let prev = null;
    if (Number(l.unit_price) > 0) prev = { price: l.unit_price, src: '붙여넣은 단가', date: doc.doc_date };
    else if (prevFor) prev = prevFor(doc.partner, l.raw_name, l.spec, m.ours) || null;
    return { ...l, match: m, prev };
  });
  return doc;
}
