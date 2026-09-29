// 거래명세표 만들기 — 이카운트 판매 엑셀을 브라우저에서 바로 읽어 품목별 거래명세표로 (로컬 도우미 없이 사이트 안에서)
//   읽는 것: 판매현황내역 · 거래처원장 · 거래명세서 (도우미 statement_split.py 와 같은 규칙)
//   내는 것: 전표·품목마다 A4 한 장 → 인쇄 창에서 PDF 저장·인쇄
import { LOGO, STAMP } from './stmt-assets.js';

const XLSX_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
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
function sheetHtml(doc) {
  const d = doc.items[0].date;
  const sd = new Date(+doc.ymd.slice(0, 4), +doc.ymd.slice(4, 6) - 1, +doc.ymd.slice(6, 8));
  const supply = doc.items.reduce((a, i) => a + i.supply, 0), vat = doc.items.reduce((a, i) => a + i.vat, 0);
  const place = PLACES[key(doc.partner)] || '';
  const rows = doc.items.map((it, i) => `<tr>
      <td class="c">${i + 1}</td><td class="c">${it.date.getMonth() + 1}월 ${it.date.getDate()}일</td>
      <td class="nm">${esc2(it.name)}</td><td class="c">개</td><td class="n">${won(it.qty)}</td>
      <td class="n">${won(it.supply / it.qty)}</td><td class="n">${won(it.supply)}</td><td class="n">${won(it.vat)}</td>
      <td class="n">${won(it.supply + it.vat)}</td><td class="c"></td></tr>`).join('')
    + ('<tr>' + '<td></td>'.repeat(10) + '</tr>').repeat(Math.max(0, ITEM_ROWS - doc.items.length));
  return `<section class="sheet">
    <div class="ttl">거 래 명 세 서</div>
    <div class="head">
      <div class="to"><b>${esc2(doc.partner)} 貴下</b><span>${esc2(place)}</span>
        <div class="no">발행번호 : ${doc.ymd}${String(doc.seq).padStart(4, '0')}<br>발행일자 : ${sd.getFullYear()}년 ${sd.getMonth() + 1}월 ${sd.getDate()}일</div>
        <div class="ask">아래와 같이 대금 지급을 요청드립니다.</div></div>
      <div class="from"><b>${SUPPLIER.name}</b>
        <table><tr><th>대표자</th><td>${SUPPLIER.ceo} <img class="stamp" src="${STAMP}"></td></tr>
          <tr><th>등록번호</th><td>${SUPPLIER.biz}</td></tr><tr><th>소재지</th><td>${SUPPLIER.addr}</td></tr>
          <tr><th>업 태</th><td>${SUPPLIER.kind}　종 목　${SUPPLIER.item}</td></tr>
          <tr><th>담당자</th><td>${SUPPLIER.mgr}　　연락처　${SUPPLIER.tel}</td></tr>
          <tr><th>이메일</th><td><b>${SUPPLIER.mail}</b></td></tr></table></div>
    </div>
    <div class="sum"><div class="lb">합계금액 (부가세포함)</div><div class="val">${won(supply + vat)}</div></div>
    <div class="hangul">${wonHangul(supply + vat)}</div>
    <div class="terms">* 거래조건<br>1. 납품일자 : ${d.getMonth() + 1}월 ${d.getDate()}일<br>2. 인도조건 및 장소 : ${esc2(place || '담당자 협의')}<br>
      3. 대금 지불조건 : 협의사항<br>4. 결제정보<br>&nbsp;-&nbsp; ${SUPPLIER.bank}<img class="logo" src="${LOGO}"></div>
    <table class="items">
      <colgroup><col style="width:5%"><col style="width:9%"><col><col style="width:5%"><col style="width:7%"><col style="width:9%"><col style="width:11%"><col style="width:9%"><col style="width:11%"><col style="width:8%"></colgroup>
      <thead><tr><th>순번</th><th>출고일</th><th>품명</th><th>단위</th><th>수량</th><th>단가</th><th>공급가액</th><th>부가세</th><th>총합계 ( 포함가)</th><th>비고</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td class="tot" colspan="6">합　계</td><td class="n">${won(supply)}</td><td class="n">${won(vat)}</td><td class="n">${won(supply + vat)}</td><td></td></tr></tfoot>
    </table>
  </section>`;
}

const PRINT_CSS = `
  @page { size:A4 portrait; margin:12mm 10mm; }
  *{box-sizing:border-box} body{margin:0;font-family:"Pretendard","Apple SD Gothic Neo",sans-serif;color:#222;font-size:9pt}
  .sheet{page-break-after:always;padding:2mm 0}
  .ttl{background:#F0B346;color:#fff;font-size:20pt;font-weight:800;letter-spacing:.5em;text-align:center;padding:10px 0 10px 12px}
  .head{display:flex;justify-content:space-between;margin:10mm 0 6mm}
  .to b{font-size:13pt} .to span{display:block;font-size:8.5pt;color:#555;margin:2px 0 6mm}
  .to .no{font-size:8pt;line-height:1.6} .to .ask{margin-top:8mm;font-size:8.5pt}
  .from{text-align:right} .from b{font-size:13pt;display:block;margin-bottom:4px}
  .from table{border-collapse:collapse;font-size:8pt} .from th{text-align:left;color:#555;font-weight:500;padding:1px 14px 1px 0}
  .from td{text-align:left;padding:1px 0;position:relative}
  .stamp{position:absolute;left:34px;top:-16px;width:44px;height:44px;opacity:.95}
  .sum{display:flex;border:1px solid #ddd} .sum .lb{background:#F0B346;color:#fff;font-weight:700;text-align:center;padding:5px 0;width:42%}
  .sum .val{flex:1;text-align:center;padding:5px 0;font-size:11pt}
  .hangul{text-align:center;font-size:9pt;margin:3px 0 5px}
  .terms{position:relative;border:1px solid #ddd;padding:6px 8px;line-height:1.7;font-size:8pt;min-height:26mm}
  .logo{position:absolute;right:10px;bottom:8px;width:98px}
  .items{width:100%;border-collapse:collapse;margin-top:6mm;table-layout:fixed}
  .items th{background:#F0B346;color:#fff;font-weight:700;font-size:8pt;padding:4px 2px;border:1px solid #fff}
  .items td{border:1px solid #e3e3e3;padding:3px 4px;height:22px;font-size:8pt;overflow:hidden}
  .items td.c{text-align:center} .items td.n{text-align:right} .items td.nm{white-space:normal;word-break:break-all;line-height:1.3}
  .items tfoot .tot{background:#F0B346;color:#fff;font-weight:700;text-align:center}
  .items tfoot td{font-weight:700;background:#f5f5f5}
  @media screen { body{background:#eee;padding:14px} .sheet{background:#fff;box-shadow:0 1px 6px #0002;margin:0 auto 14px;padding:10mm;width:210mm} }
`;

export function printSheets(docs) {
  const w = window.open('', '_blank');
  if (!w) throw new Error('팝업이 막혔어요 — 주소창 오른쪽에서 팝업을 허용해 주세요.');
  w.document.write(`<!doctype html><meta charset="utf-8"><title>거래명세표 ${docs.length}장</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
    <style>${PRINT_CSS}</style>${docs.map(sheetHtml).join('')}
    <script>window.onload=function(){setTimeout(function(){window.print();},400);};<\/script>`);
  w.document.close();
}

export const sheetTitle = (doc) => {
  const short = (n) => {
    const m = /(\d+\*\d+\*\d+)/.exec(n.replace(/(\d),(?=\d{3})/g, '$1'));
    return m ? m[1].replace(/\*/g, 'x') : n.split('_').pop();
  };
  return `${doc.ymd.slice(2)}_${key(doc.partner)}_${String(doc.seq).padStart(2, '0')}_${short(doc.items[0].name)}`;
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
