// 거래명세표 만들기 — 이카운트 판매 엑셀을 브라우저에서 바로 읽어 품목별 거래명세표로 (로컬 도우미 없이 사이트 안에서)
//   읽는 것: 판매현황내역 · 거래처원장 · 거래명세서 (도우미 statement_split.py 와 같은 규칙)
//   내는 것: 전표·품목마다 A4 한 장 → 인쇄 창에서 PDF 저장·인쇄
import { LOGO, STAMP } from './stmt-assets.js';

const XLSX_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const H2C_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
const PER_ITEM_PARTNERS = ['공간제작소'];          // 이 거래처만 품목마다 한 장, 나머지는 전표당 한 장
const SUPPLIER = {
  name: '주식회사 홈트레이더스', ceo: '이 최 원', biz: '876-87-02032',
  addr: '경기도 화성시 동탄대로 595', kind: '도매 및 소매업', item: '건축자재',
  mgr: '김수정 매니저', tel: '010-2573-8478', mail: 'hometraders@naver.com',
  bank: '은행명 : 기업은행  |  계좌번호 : 120-187273-04-013  |  예금주 : 주식회사 홈트레이더스',
};
const PLACES = { 공간제작소: '경기 화성시 우정읍 매향리 2-22' };   // 거래처별 인도 장소 (없으면 빈칸)

const nfc = (v) => String(v == null ? '' : v).normalize('NFC').trim();
const num = (v) => {
  if (typeof v === 'number') return v;
  const t = nfc(v).replace(/,/g, '');
  if (!/\d/.test(t)) return null;
  const n = Number(t.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
};
const won = (n) => Math.round(Number(n) || 0).toLocaleString();
const esc2 = (s) => nfc(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── 엑셀 읽기 ───────────────────────────────────────────────
let xlsxLoading = null;
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (!xlsxLoading) {
    xlsxLoading = new Promise((ok, no) => {
      const s = document.createElement('script');
      s.src = XLSX_CDN;
      s.onload = () => ok(window.XLSX);
      s.onerror = () => no(new Error('엑셀 읽기 도구를 못 받았어요 — 인터넷 연결을 확인하세요.'));
      document.head.appendChild(s);
    });
  }
  return xlsxLoading;
}

function loadScript(src, has) {
  if (has()) return Promise.resolve(has());
  return new Promise((ok, no) => {
    const el = document.createElement('script');
    el.src = src; el.onload = () => ok(has());
    el.onerror = () => no(new Error('필요한 도구를 못 받았어요 — 인터넷 연결을 확인하세요.'));
    document.head.appendChild(el);
  });
}

export async function readSheets(file) {
  const XLSX = await loadXLSX();
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  return wb.SheetNames.map((n) => XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null }));
}

// ── 전표 읽기 (세 가지 모양) ────────────────────────────────
const stripTag = (s) => nfc(s).replace(/\s*\[[^\]]*\]\s*$/, '').trim();

function parseList(rows) {                          // 판매현황내역
  const hi = rows.findIndex((r) => r && r.some((c) => /^일자-?No/i.test(nfc(c).replace(/\s/g, '')))
    && r.some((c) => nfc(c).replace(/\s/g, '').startsWith('품목명')) && r.some((c) => nfc(c).replace(/\s/g, '').startsWith('공급가액')));
  if (hi < 0) return null;
  const H = rows[hi].map((c) => nfc(c).replace(/\s/g, ''));
  const col = (re) => H.findIndex((h) => re.test(h));
  const cNo = col(/^일자-?No/i), cP = col(/^거래처명/), cN = col(/^품목명/), cQ = col(/^수량/), cS = col(/^공급가액/), cV = col(/^부가세/);
  const by = {}, out = [];
  rows.slice(hi + 1).forEach((r) => {
    const m = /^(20\d\d)\/(\d{1,2})\/(\d{1,2})\s*-\s*(\d+)$/.exec(nfc(r && r[cNo]));
    if (!m) return;
    const ymd = `${m[1]}${String(+m[2]).padStart(2, '0')}${String(+m[3]).padStart(2, '0')}`;
    const name = nfc(r[cN]), qty = num(r[cQ]), supply = num(r[cS]);
    if (!name || !qty || supply == null) return;
    const slip = `${ymd}-${m[4]}`;
    if (!by[slip]) { by[slip] = { slip, ymd, partner: cP >= 0 ? nfc(r[cP]) : '', items: [] }; out.push(by[slip]); }
    by[slip].items.push({ date: new Date(+m[1], +m[2] - 1, +m[3]), name: stripTag(name), qty, supply, vat: (cV >= 0 ? num(r[cV]) : 0) || Math.round(supply * 0.1) });
  });
  return out;
}

function parseLedger(rows) {                        // 거래처원장 — 머리줄이 없을 수도 있음 (일자 | 품명 | 수량 | 단가 | 금액(부가세 포함) | 수금 | 잔액)
  const titleRow = rows.find((r) => r && /회사명\s*[:：]/.test(nfc(r[0])));
  const title = nfc(titleRow && titleRow[0]);
  const hi = rows.findIndex((r) => r && r.some((c) => nfc(c).replace(/\s/g, '').startsWith('품목명')));
  let cD = 0, cN = 1, cQ = 2, cA = 4;                // 머리줄이 없으면 칸 자리로 (이카운트 원장 기본 순서)
  if (hi >= 0) {
    const H = rows[hi].map((c) => nfc(c).replace(/\s/g, ''));
    const col = (re, dflt) => { const i = H.findIndex((h) => re.test(h)); return i < 0 ? dflt : i; };
    cD = col(/^일자/, 0); cN = col(/^품목명/, 1); cQ = col(/^수량/, 2); cA = col(/^(판매|금액)/, 4);
  }
  const parts = title.split('/').map((t) => t.trim());
  const ledgerClient = parts.length > 2 ? parts[1] : '';
  const years = [...title.matchAll(/(20\d\d)\/(\d\d)\/\d\d/g)].map((m) => [m[1], m[2]]);
  const yearFor = (mm) => {
    if (!years.length) return new Date().getFullYear();
    const [y0, m0] = years[0], [y1] = years[years.length - 1];
    return Number(y0 === y1 || +mm >= +m0 ? y0 : y1);
  };
  const by = {}, out = [];
  rows.slice(hi >= 0 ? hi + 1 : 0).forEach((r) => {
    const m = /^(?:(20\d\d)\/)?(\d\d)\/(\d\d)\s*-\s*(\d+)$/.exec(nfc(r && r[cD]));
    const name = nfc(r && r[cN]);
    if (!m || !name) return;
    const qty = num(r[cQ]), amount = num(r[cA]);
    if (!qty || amount == null || amount === 0) return;
    const y = m[1] ? +m[1] : yearFor(m[2]);
    const ymd = `${y}${m[2]}${m[3]}`, slip = `${ymd}-${m[4]}`;
    const supply = Math.round(amount / 1.1);        // 원장 금액은 부가세 포함
    if (!by[slip]) { by[slip] = { slip, ymd, partner: ledgerClient, items: [] }; out.push(by[slip]); }
    by[slip].items.push({ date: new Date(y, +m[2] - 1, +m[3]), name: stripTag(name), qty, supply, vat: amount - supply });
  });
  return out.length ? out : null;
}


// 에이스 원장 — 일자 | 적요 | 판매 | 수금 | 잔액
//   전표 줄: '2026/08/13 -1' + 판매 합계, 그 아래 품목 줄: 적요 '선홈통(브라운) [0826/공간] / 200 * 9,499'
//   판매 금액은 부가세 포함 → 공급가액 = 금액 ÷ 1.1
function parseAceLedger(rows) {
  const title = nfc(rows.find((r) => r && /회사명\s*[:：]/.test(nfc(r[0]))) ? rows.find((r) => r && /회사명\s*[:：]/.test(nfc(r[0])))[0] : '');
  const hi = rows.findIndex((r) => r && nfc(r[0]) === '일자' && r.some((c) => nfc(c) === '적요') && r.some((c) => nfc(c) === '판매'));
  if (hi < 0) return null;
  const H = rows[hi].map((c) => nfc(c));
  const cD = 0, cN = H.indexOf('적요'), cS = H.indexOf('판매');
  const parts = title.split('/').map((t) => t.trim());
  const partner = parts.length > 1 ? nfc(parts[1]) : '';       // 회사명 : 에이스목재산업 / 공간제작소 / 기간
  const out = [];
  let cur = null;
  rows.slice(hi + 1).forEach((r) => {
    const d = nfc(r && r[cD]);
    const m = /^(20\d\d)\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*-\s*(\d+)$/.exec(d);
    if (m) {
      const ymd = `${m[1]}${String(+m[2]).padStart(2, '0')}${String(+m[3]).padStart(2, '0')}`;
      cur = { slip: `${ymd}-${m[4]}`, ymd, partner, items: [], date: new Date(+m[1], +m[2] - 1, +m[3]) };
      out.push(cur);
      return;
    }
    if (!cur) return;
    const memo = nfc(r && r[cN]);
    const amount = num(r && r[cS]);
    if (!memo || !amount) return;
    const im = /^(.*?)\s*\/\s*([\d,]+)\s*\*\s*([\d,.]+)\s*$/.exec(memo);   // 품명 / 수량 * 단가
    const name = stripTag(im ? im[1] : memo);
    const qty = im ? num(im[2]) : null;
    const supply = Math.round(amount / 1.1);
    if (!name) return;
    cur.items.push({ date: cur.date, name, qty: qty || 1, supply, vat: amount - supply });
  });
  return out.filter((v) => v.items.length).length ? out.filter((v) => v.items.length) : null;
}

function parseVouchers(rows) {                      // 거래명세서 (전표번호 · 수신-거래처 · 일자 줄)
  const out = [];
  let cur = null;
  rows.forEach((row) => {
    const cells = (row || []).filter((c) => c != null && nfc(c) !== '');
    if (!cells.length) return;
    const first = nfc(cells[0]);
    let m = /전표번호\s*[:：]\s*(\d{8})\s*-\s*(\d+)/.exec(first);
    if (m) { cur = { slip: `${m[1]}-${m[2]}`, ymd: m[1], partner: '', items: [] }; out.push(cur); return; }
    if (!cur) return;
    m = /수신\s*-?\s*거래처\s*[:：]\s*(.+)/.exec(first);
    if (m) { cur.partner = nfc(m[1]); return; }
    m = /^(\d{1,2})\/(\d{1,2})$/.exec(first);
    if (m && cells.length >= 5) {
      const name = nfc(cells[1]), qty = num(cells[2]), supply = num(cells[4]), vat = cells.length > 5 ? num(cells[5]) : 0;
      if (!name || !qty || supply == null) return;
      cur.items.push({ date: new Date(+cur.ymd.slice(0, 4), +m[1] - 1, +m[2]), name: stripTag(name), qty, supply, vat: vat || Math.round(supply * 0.1) });
    }
  });
  return out.filter((v) => v.items.length);
}

function dropCancelled(vs) {                        // 취소(마이너스) 전표와 짝이 되는 원래 전표는 둘 다 뺌
  const sig = (v) => v.items.map((i) => `${i.name.replace(/\s/g, '')}|${Math.abs(i.qty)}|${Math.abs(i.supply)}`).sort().join('#');
  const total = (v) => v.items.reduce((a, i) => a + i.supply, 0);
  const gone = new Set();
  vs.forEach((n) => {
    if (total(n) >= 0) return;
    gone.add(n);
    const orig = vs.find((o) => !gone.has(o) && total(o) > 0 && o.partner === n.partner && sig(o) === sig(n));
    if (orig) gone.add(orig);
  });
  return vs.filter((v) => !gone.has(v) && total(v) > 0).map((v) => ({ ...v, items: v.items.filter((i) => i.supply > 0) }));
}

export function parseSales(sheets) {
  let got = [];
  sheets.forEach((rows) => { const r = parseList(rows); if (r) got = got.concat(r); });
  if (got.length) return dropCancelled(got);
  sheets.forEach((rows) => { const r = parseAceLedger(rows); if (r) got = got.concat(r); });
  if (got.length) return dropCancelled(got);
  sheets.forEach((rows) => { const r = parseLedger(rows); if (r) got = got.concat(r); });
  if (got.length) return dropCancelled(got);
  sheets.forEach((rows) => { got = got.concat(parseVouchers(rows)); });
  if (!got.length) throw new Error('판매 전표를 못 찾았어요 — 이카운트 판매현황내역·거래처원장·거래명세서 엑셀인지 확인하세요.');
  return dropCancelled(got);
}

// ── 한 장 단위로 나누기 ─────────────────────────────────────
const key = (s) => nfc(s).replace(/\(주\)|주식회사|㈜|\s/g, '');
const perItem = (partner) => PER_ITEM_PARTNERS.some((p) => key(partner).includes(p) || p.includes(key(partner)));

export function splitSheets(vouchers) {
  const out = [], seq = {};
  vouchers.forEach((v) => {
    let groups;
    if (!perItem(v.partner)) groups = [v.items];
    else {
      const cer = v.items.filter((i) => i.name.replace(/\s/g, '').includes('세라믹사이딩'));
      groups = (cer.length >= 2 ? [cer] : cer.map((i) => [i])).concat(v.items.filter((i) => !i.name.replace(/\s/g, '').includes('세라믹사이딩')).map((i) => [i]));
    }
    groups.forEach((items) => {
      if (!items.length) return;
      const k = `${v.ymd}|${v.partner}`;
      seq[k] = (seq[k] || 0) + 1;
      out.push({ slip: v.slip, ymd: v.ymd, partner: v.partner, seq: seq[k], items });
    });
  });
  return out;
}

// ── 한글 금액 ───────────────────────────────────────────────
export function wonHangul(n) {
  n = Math.round(Number(n) || 0);
  if (n <= 0) return '영원정';
  const D = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'], U = ['', '십', '백', '천'], B = ['', '만', '억', '조'];
  let s = '', bi = 0;
  while (n > 0) {
    const part = n % 10000;
    let t = '';
    for (let i = 0; i < 4; i++) { const d = Math.floor(part / 10 ** i) % 10; if (d) t = D[d] + U[i] + t; }
    if (t) s = t + B[bi] + s;
    n = Math.floor(n / 10000); bi++;
  }
  return s + '원정';
}

// ── 인쇄용 HTML (양식: 거래명세표_기본과 같은 구성) ──────────
const ITEM_ROWS = 5;
// ── 에이스목재산업 양식 (에이스 → 거래처) ─────────────────
const CLIENTS = {                                   // 받는 곳 정보 (알고 있는 거래처)
  공간제작소: { ceo: '박정진', biz: '812-88-00492', addr: '경기도 화성시 우정읍 매향리 2-22', mail: 'gg-arch@naver.com' },
};

const ACE = {
  name: '에이스 목재 산업', ceo: '이혜원', biz: '373-26-00984',
  addr: '인천광역시 서구 고산후로 95번길 24', mail: 'lhw6150@naver.com',
  bank: '국민은행  650701-01-426117  (예금주 : 에이스목재산업)',
};

function aceHtml(doc) {
  const d = doc.items[0].date;
  const supply = doc.items.reduce((a, i) => a + i.supply, 0), vat = doc.items.reduce((a, i) => a + i.vat, 0);
  const no = `제 ${doc.ymd.slice(2)}-${String(doc.slip || '').split('-')[1] || doc.seq}호`;
  const iso = `${doc.ymd.slice(0, 4)}-${doc.ymd.slice(4, 6)}-${doc.ymd.slice(6, 8)}`;
  const ck = nfc(doc.partner).replace(/\(주\)|주식회사|㈜|\s/g, '');
  const cl = CLIENTS[ck] || {};
  const rows = doc.items.map((it, i) => `<tr>
      <td class="c">${i + 1}</td><td class="nm">${esc2(it.name).replace(/([_*(])/g, '$1&#8203;')}</td>
      <td class="c">${esc2(it.spec || '')}</td><td class="c">${esc2(it.unit || '')}</td>
      <td class="n">${won(it.qty)}</td><td class="n">${won(it.supply / it.qty)}</td>
      <td class="n">${won(it.supply)}</td><td class="n">${won(it.vat)}</td></tr>`).join('')
    + ('<tr>' + '<td></td>'.repeat(8) + '</tr>').repeat(Math.max(0, 11 - doc.items.length));
  return `<section class="sheet ace">
    <div class="ttl">거 래 명 세 서</div>
    <table class="no"><colgroup><col style="width:18%"><col style="width:35%"><col style="width:20%"><col></colgroup>
      <tr><td class="lb">문서번호 NO.</td><td class="c b">${no}</td><td class="lb">발행일자</td><td class="c b">${iso}</td></tr></table>
    <table class="who"><colgroup><col style="width:18%"><col style="width:32%"><col style="width:18%"><col></colgroup>
      <tr><td class="hd" colspan="2">공 급 받 는 자　(수신)</td><td class="hd" colspan="2">공 급 자　(발신)</td></tr>
      <tr><td class="lb">상호</td><td>${esc2(doc.partner)}</td><td class="lb">상호</td><td>${ACE.name}</td></tr>
      <tr><td class="lb">대표자</td><td>${esc2(cl.ceo || '')}</td><td class="lb">대표자</td><td>${ACE.ceo}</td></tr>
      <tr><td class="lb">사업자등록번호</td><td>${esc2(cl.biz || '')}</td><td class="lb">사업자등록번호</td><td>${ACE.biz}</td></tr>
      <tr><td class="lb">주소</td><td>${esc2(cl.addr || '')}</td><td class="lb">소재지</td><td>${ACE.addr}</td></tr>
      <tr><td class="lb">이메일</td><td>${esc2(cl.mail || '')}</td><td class="lb">이메일</td><td>${ACE.mail}</td></tr>
    </table>
    <p class="say">아래와 같이 납품하였음을 확인합니다.</p>
    <table class="total"><colgroup><col style="width:52%"><col></colgroup>
      <tr><td class="hd">합계금액 (공급가액 + 세액)</td><td class="hd sum">${won(supply + vat)}원</td></tr></table>
    <table class="items ace">
      <colgroup><col style="width:5%"><col style="width:22%"><col style="width:14%"><col style="width:10%"><col style="width:9%"><col style="width:11%"><col style="width:15%"><col style="width:14%"></colgroup>
      <thead><tr><th>NO</th><th>품　명</th><th>규　격</th><th>B/D</th><th>수량</th><th>단가</th><th>공급가액</th><th>세액</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td class="tot" colspan="6">합　　계</td><td class="n">${won(supply)}</td><td class="n">${won(vat)}</td></tr>
        <tr><td class="tot big" colspan="6">총　계 (공급가액 + 세액)</td><td class="n big" colspan="2">₩${won(supply + vat)}</td></tr></tfoot>
    </table>
    <table class="foot2"><colgroup><col style="width:18%"><col></colgroup>
      <tr><td class="lb">납기 / 납품일</td><td>${d.getMonth() + 1}월 ${d.getDate()}일</td></tr>
      <tr><td class="lb">입금계좌</td><td>${ACE.bank}</td></tr>
      <tr><td class="lb">특기사항</td><td></td></tr></table>
  </section>`;
}

function sheetHtml(doc) {
  const d = doc.items[0].date;
  const sd = new Date(+doc.ymd.slice(0, 4), +doc.ymd.slice(4, 6) - 1, +doc.ymd.slice(6, 8));
  const supply = doc.items.reduce((a, i) => a + i.supply, 0), vat = doc.items.reduce((a, i) => a + i.vat, 0);
  const place = PLACES[key(doc.partner)] || '';
  const rows = doc.items.map((it, i) => `<tr>
      <td class="c">${i + 1}</td><td class="c">${it.date.getMonth() + 1}월 ${it.date.getDate()}일</td>
      <td class="nm">${esc2(it.name).replace(/([_*(])/g, '$1&#8203;')}</td><td class="c">개</td><td class="n">${won(it.qty)}</td>
      <td class="n">${won(it.supply / it.qty)}</td><td class="n">${won(it.supply)}</td><td class="n">${won(it.vat)}</td>
      <td class="n">${won(it.supply + it.vat)}</td><td class="c"></td></tr>`).join('')
    + ('<tr>' + '<td></td>'.repeat(10) + '</tr>').repeat(Math.max(0, ITEM_ROWS - doc.items.length));
  return `<section class="sheet">
    <div class="ttl">거 래 명 세 서</div>
    <div class="head">
      <div class="to"><b>${esc2(doc.partner)} 貴下</b><span>${esc2(place)}</span>
        <div class="no">발행번호 : ${doc.ymd}${String(doc.seq).padStart(4, '0')}<br>발행일자 : ${sd.getFullYear()}년 ${sd.getMonth() + 1}월 ${sd.getDate()}일</div>
        <div class="ask">아래와 같이 대금 지급을 요청드립니다.</div></div>
      <div class="from"><b class="cname">${SUPPLIER.name}</b><img class="stamp" src="${STAMP}" alt="">
        <table><colgroup><col style="width:58px"><col></colgroup>
          <tr><th>대표자</th><td>${SUPPLIER.ceo}</td></tr>
          <tr><th>등록번호</th><td>${SUPPLIER.biz}</td></tr><tr><th>소재지</th><td>${SUPPLIER.addr}</td></tr>
          <tr><th>업 태</th><td>${SUPPLIER.kind}　종 목　${SUPPLIER.item}</td></tr>
          <tr><th>담당자</th><td>${SUPPLIER.mgr}　　연락처　${SUPPLIER.tel}</td></tr>
          <tr><th>이메일</th><td>${SUPPLIER.mail}</td></tr></table></div>
    </div>
    <div class="sum"><div class="lb">합계금액 (부가세포함)</div><div class="val">${won(supply + vat)}</div></div>
    <div class="hangul">${wonHangul(supply + vat)}</div>
    <div class="terms">* 거래조건<br>1. 납품일자 : ${d.getMonth() + 1}월 ${d.getDate()}일<br>2. 인도조건 및 장소 : ${esc2(place || '담당자 협의')}<br>
      3. 대금 지불조건 : 협의사항<br>4. 결제정보<br>&nbsp;-&nbsp; ${SUPPLIER.bank}<img class="logo" src="${LOGO}"></div>
    <table class="items">
      <colgroup><col style="width:4.5%"><col style="width:8.5%"><col style="width:34%"><col style="width:4.5%"><col style="width:6.5%"><col style="width:8.5%"><col style="width:10.5%"><col style="width:8.5%"><col style="width:10.5%"><col style="width:4%"></colgroup>
      <thead><tr><th>순번</th><th>출고일</th><th>품명</th><th>단위</th><th>수량</th><th>단가</th><th>공급가액</th><th>부가세</th><th>총합계 ( 포함가)</th><th>비고</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td class="tot" colspan="6">합　계</td><td class="n">${won(supply)}</td><td class="n">${won(vat)}</td><td class="n">${won(supply + vat)}</td><td></td></tr></tfoot>
    </table>
  </section>`;
}

const PRINT_CSS = `
  @page { size:A4 portrait; margin:12mm 10mm; }
  *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact} body{margin:0;font-family:"Pretendard","Apple SD Gothic Neo",sans-serif;color:#222;font-size:9pt}
  .sheet{page-break-after:always;padding:2mm 0}
  .ttl{background:#F0B346;color:#fff;font-size:20pt;font-weight:800;letter-spacing:.5em;text-align:center;padding:10px 0 10px 12px}
  .head{display:flex;justify-content:space-between;margin:10mm 0 6mm}
  .to b{font-size:13pt} .to span{display:block;font-size:8.5pt;color:#555;margin:2px 0 6mm}
  .to .no{font-size:8pt;line-height:1.6} .to .ask{margin-top:8mm;font-size:8.5pt}
  .from{position:relative;width:300px;margin-left:auto;text-align:left}
  .from .cname{font-size:13pt;font-weight:800;display:block;margin-bottom:6px;text-align:left}
  .from table{border-collapse:collapse;font-size:8pt;table-layout:fixed;width:100%}
  .from th{text-align:left;color:#555;font-weight:500;padding:1.5px 0;white-space:nowrap}
  .from td{text-align:left;padding:1.5px 0;white-space:nowrap;font-weight:400}
  .stamp{position:absolute;left:96px;top:4px;width:48px;height:48px;opacity:.8;z-index:2}
  .sum{display:flex;border:1px solid #ddd} .sum .lb{background:#F0B346;color:#fff;font-weight:700;text-align:center;padding:5px 0;width:42%}
  .sum .val{flex:1;text-align:center;padding:5px 0;font-size:11pt}
  .hangul{text-align:center;font-size:9pt;margin:3px 0 5px}
  .terms{position:relative;border:1px solid #ddd;padding:6px 8px;line-height:1.7;font-size:8pt;min-height:26mm}
  .logo{position:absolute;right:10px;bottom:8px;width:98px}
  .items{width:100%;border-collapse:collapse;margin-top:6mm;table-layout:fixed}
  .items th{background:#F0B346;color:#fff;font-weight:700;font-size:8pt;padding:4px 2px;border:1px solid #fff;text-align:center;vertical-align:middle}
  .items td{border:1px solid #e3e3e3;padding:3px 4px;height:22px;font-size:8pt;overflow:hidden}
  .items td.c{text-align:center} .items td.n{text-align:right} .items td.nm{white-space:normal;word-break:break-all;line-height:1.3}
  .items tfoot .tot{background:#F0B346;color:#fff;font-weight:700;text-align:center}
  .items tfoot td{font-weight:700;background:#f5f5f5}
  .sheet.ace{--navy:#20365c;--navy2:#2c4470}
  .sheet.ace .ttl{background:none;color:var(--navy);border:0;border-bottom:2.5px solid var(--navy);letter-spacing:.55em;font-size:19pt;font-weight:800;padding:0 0 7px;margin:0 0 6mm}
  .sheet.ace table{border-collapse:collapse;width:100%;margin-bottom:3mm;table-layout:fixed}
  .sheet.ace td,.sheet.ace th{border:1px solid #c9cfda;padding:5px 8px;font-size:8.5pt;color:#1e2430}
  .sheet.ace .lb{background:#eef1f6;font-weight:700;text-align:center;white-space:nowrap;color:var(--navy)}
  .sheet.ace .hd{background:var(--navy);color:#fff;font-weight:700;text-align:center;border-color:var(--navy)}
  .sheet.ace .hd.sum{background:#eef1f6;color:var(--navy);text-align:center;font-weight:800;font-size:10pt}
  .sheet.ace .c{text-align:center} .sheet.ace .n{text-align:right} .sheet.ace .b{font-weight:700}
  .sheet.ace .say{margin:4mm 0 2mm;text-align:center;font-size:9pt;font-weight:600}
  .sheet.ace .items th{background:var(--navy);color:#fff;border-color:var(--navy);font-weight:700;font-size:8.5pt;text-align:center}
  .sheet.ace .items td{height:22px}
  .sheet.ace .items td.nm{font-size:8pt;text-align:left;white-space:normal;word-break:keep-all;overflow-wrap:anywhere}
  .sheet.ace .items tfoot .tot{background:var(--navy2);color:#fff;text-align:center;font-weight:700;border-color:var(--navy2)}
  .sheet.ace .items tfoot td{background:#f4f6fa;font-weight:700}
  .sheet.ace .items tfoot .big{font-size:10pt}
  .sheet.ace .total{margin-bottom:0}
  .sheet.ace .foot2 td{height:24px}
  @media screen { body{background:#eee;padding:14px} .sheet{background:#fff;box-shadow:0 1px 6px #0002;margin:0 auto 14px;padding:10mm;width:210mm} }
`;

const RENDER = { homt: (d) => sheetHtml(d), ace: (d) => aceHtml(d) };
const html_ = (doc, style) => (RENDER[style] || RENDER.homt)(doc);

export function printSheets(docs, style) {
  const w = window.open('', '_blank');
  if (!w) throw new Error('팝업이 막혔어요 — 주소창 오른쪽에서 팝업을 허용해 주세요.');
  w.document.write(`<!doctype html><meta charset="utf-8"><title>거래명세표 ${docs.length}장</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
    <style>${PRINT_CSS}</style>${docs.map((d) => html_(d, style)).join('')}
    <script>window.onload=function(){setTimeout(function(){window.print();},400);};<\/script>`);
  w.document.close();
}

export const sheetTitle = (doc) => {
  const short = (n) => {
    const m = /(\d+\*\d+\*\d+)/.exec(n.replace(/(\d),(?=\d{3})/g, '$1'));
    return m ? m[1].replace(/\*/g, 'x') : n.split('_').pop();
  };
  const slip = String(doc.slip || '').split('-')[1] || '1';          // 이카운트 전표번호 뒷자리 (20260721-1 → 1)
  return `${doc.ymd.slice(2)}-${slip}_${key(doc.partner)}_${String(doc.seq).padStart(2, '0')}_${short(doc.items[0].name)}`;
};

// ── 도우미(AI)가 읽은 문서 → 전표 한 장 (캡처·PDF용) ────────
export function fromDoc(doc) {
  const d = doc || {};
  const iso = nfc(d.doc_date) || new Date().toISOString().slice(0, 10);
  const m = /(20\d\d)[-./년\s]*(\d{1,2})[-./월\s]*(\d{1,2})/.exec(iso) || [];
  const y = +(m[1] || new Date().getFullYear()), mo = +(m[2] || (new Date().getMonth() + 1)), dd = +(m[3] || new Date().getDate());
  const ymd = `${y}${String(mo).padStart(2, '0')}${String(dd).padStart(2, '0')}`;
  const items = (d.lines || []).map((l) => {
    const qty = num(l.qty) || 0;
    let supply = num(l.supply) != null ? num(l.supply) : (num(l.amount) != null ? num(l.amount) : qty * (num(l.price) || 0));
    supply = Math.round(supply || 0);
    const vat = num(l.vat) != null ? Math.round(num(l.vat)) : Math.round(supply * 0.1);
    return { date: new Date(y, mo - 1, dd), name: stripTag(l.ours || l.raw_name || l.name || ''), qty, supply, vat };
  }).filter((it) => it.name && it.qty > 0 && it.supply > 0);
  if (!items.length) throw new Error('읽은 문서에서 품목·금액을 못 찾았어요 — 수량과 단가(또는 공급가액)가 보이는 사진인지 확인하세요.');
  return splitSheets([{ slip: `${ymd}-1`, ymd, partner: nfc(d.partner) || '거래처미상', items }]);
}

// ── 이미지(PNG)로 저장 — 카톡·문자로 바로 보내기 ────────────
const A4_W = 794;                                   // A4 가로 210mm ≈ 794px (96dpi)

async function renderImage(doc, scale = 2, style) {
  const h2c = await loadScript(H2C_CDN, () => window.html2canvas);
  // 페이지 CSS가 섞이지 않게 iframe 안에서 그린다 — 인쇄(PDF) 결과와 똑같이 나오도록
  const fr = document.createElement('iframe');
  fr.setAttribute('style', `position:fixed;left:-10000px;top:0;width:${A4_W}px;height:1200px;border:0;background:#fff`);
  document.body.appendChild(fr);
  try {
    const d = fr.contentDocument;
    d.open();
    d.write(`<!doctype html><meta charset="utf-8">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
      <style>${PRINT_CSS}\nbody{background:#fff;padding:0;width:${A4_W}px}.sheet{width:${A4_W}px;margin:0;box-shadow:none;padding:10mm}</style>
      ${html_(doc, style)}`);
    d.close();
    await new Promise((ok) => setTimeout(ok, 350));
    if (d.fonts && d.fonts.ready) await d.fonts.ready.catch(() => {});
    const el = d.querySelector('.sheet');
    const canvas = await h2c(el, { scale, backgroundColor: '#ffffff', useCORS: true, logging: false, windowWidth: A4_W, width: A4_W, height: el.scrollHeight });
    return await new Promise((ok) => canvas.toBlob((b) => ok(b), 'image/png'));
  } finally {
    fr.remove();
  }
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function saveImages(docs, onStep, style) {
  for (let i = 0; i < docs.length; i++) {
    if (onStep) onStep(i + 1, docs.length);
    const blob = await renderImage(docs[i], 2, style);
    if (blob) {
      saveBlob(blob, sheetTitle(docs[i]) + '.png');
      try {
        const got = await saveToDrive(docs[i], blob, '.png');
        if (got && onStep) onStep(`드라이브 저장됨 (${got[0] && got[0].folder || ''})`, i + 1);
      } catch (e) { if (onStep) onStep(`드라이브 저장 실패: ${e.message}`, 0); }
    }
    await new Promise((r) => setTimeout(r, 250));   // 브라우저가 여러 장 내려받기를 막지 않게 사이를 둠
  }
}

// ── 구글 드라이브로 자동 저장 (Apps Script 저장 창구) ────────
//    거래명세표/<거래처>/<연-월>/<월-일 (요일)>/ 에 쌓인다. 창구 주소는 브라우저에 기억시켜 둔다.
const DRIVE_KEY = 'ht_drive_endpoint';
// 기본 저장 창구 (배포된 Apps Script 웹 앱) — 설정 없이도 바로 저장된다. [드라이브 연결]로 바꾸거나 끌 수 있음
const DRIVE_DEFAULT = 'https://script.google.com/macros/s/AKfycbwO58PSbjeCicjpPa6ms7SyjAoKbQBMkWCASnIMY67Nq0HtYRjvpjN2TFQyJUzbWSlP/exec';
export const driveUrl = () => {
  try {
    const v = (localStorage.getItem(DRIVE_KEY) || '').trim();
    if (v === 'off') return '';                    // 일부러 끈 경우만 저장 안 함
    return /^https?:/.test(v) ? v : DRIVE_DEFAULT; // 빈 값·이상한 값이면 기본 주소로
  } catch (_) { return DRIVE_DEFAULT; }
};
export const setDriveUrl = (u) => { try { localStorage.setItem(DRIVE_KEY, (u || '').trim() || 'off'); } catch (_) {} };

const toB64 = (blob) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.readAsDataURL(blob); });

export async function saveToDrive(doc, blob, ext) {
  const url = driveUrl();
  if (!url) return null;
  const body = { files: [{ partner: doc.partner, ymd: doc.ymd, name: sheetTitle(doc) + ext, mime: blob.type || 'application/octet-stream', data: await toB64(blob) }] };
  const res = await fetch(url, { method: 'POST', body: JSON.stringify(body) });   // Apps Script 는 단순 요청만 받음
  const j = await res.json().catch(() => ({ ok: false, error: '드라이브 응답을 읽지 못했어요.' }));
  if (!j.ok) throw new Error(j.error || '드라이브 저장 실패');
  return j.made;
}

// 이미지(PNG)를 만들어 드라이브에도 올린다 (창구 주소가 있을 때만)
export async function pngBlob(doc, style) {
  return renderImage(doc, 2, style);
}
