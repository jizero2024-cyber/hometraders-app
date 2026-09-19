// 납품확인서 — 도우미 없이 브라우저에서 (대표님 PC 등). 도우미(helper.py render)와 같은 규칙·같은 구글 시트 양식.
// 품목: 우리 견적서 엑셀(.xlsx) · 붙여넣은 글. 인슐레이션·방수시트·타이벡만, 납품일(줄 출고일, 없으면 문서 일자)마다 1장,
// 공간제작소는 날짜×품목군마다 1장. 결과는 인쇄 창 → PDF 로 저장.
// 도장은 공개 저장소에 넣지 않는다 — 기기마다 한 번 골라 이 브라우저에만 저장(localStorage).

export const CFG = {
  대상_품목: {
    인슐레이션: { 키워드: ['인슐레이션', '크나우프', '크나프트', '죤스맨빌', '존스맨빌', '글라스울'], 단위: '롤' },
    방수시트: { 키워드: ['방수시트', '언더가드'], 단위: 'ROLL' },
    타이벡: { 키워드: ['타이벡', '타이백', 'TYVEK', '하우스랩'], 단위: 'ROLL' },
  },
  대상_제외_키워드: ['석고'],
  품목별_분리_거래처: ['공간제작소'],
  인슐레이션_제원: { 크나우프: { 'R11-15': [16, 381, 2362], 'R19-15': [10, 381, 2388], 'R23-15': [4, 381, 2362], 'R37-15': [5, 381, 1194] } },
  인슐레이션_등급_순서: ['가등급', '나등급', '다등급'],
  인슐레이션_용도_순서: ['외벽', '지붕', '천장', '내벽', '바닥'],
  공급자: { 상호: '주식회사 홈트레이더스', 사업자번호: '876-87-02032', 대표자: '이 최 원', 주소: '경기도 화성시 영천동 동탄대로 595, 홈트레이더스' },
};
const CATS = Object.keys(CFG.대상_품목);
const BRANDS = ['크나우프', '크나프트', '죤스맨빌', '존스맨빌', '오웬스코닝', '듀폰', '벽산', 'KCC'];
const USES = ['외벽', '지붕', '천장', '내벽', '바닥'];
const SITE_TAG = /\s*\[\d{4}\/[^\]]*\]/g;   // 이카운트 품명 뒤 현장 태그 [0629/뉴하우징홈/평택/김인숙건축주]

const norm = (s) => String(s || '').replace(/\s+/g, '').toUpperCase();
const num = (v) => { const f = parseFloat(String(v ?? '').replace(/,/g, '')); return Number.isFinite(f) ? f : 0; };
const fmt = (n) => Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 2 });
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad2 = (n) => String(n).padStart(2, '0');

export function isoDate(v) {
  if (v instanceof Date && !isNaN(v)) return `${v.getFullYear()}-${pad2(v.getMonth() + 1)}-${pad2(v.getDate())}`;
  const t = String(v || '').trim();
  const m = t.match(/(20\d\d|\d\d)\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/) || t.match(/^(20\d\d)(\d\d)(\d\d)$/);
  if (!m) return '';
  const y = m[1].length === 2 ? '20' + m[1] : m[1], mo = Number(m[2]), d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  return `${y}-${pad2(mo)}-${pad2(d)}`;
}

export function categoryOf(name) {
  const n = norm(name);
  if (!n || CFG.대상_제외_키워드.some((k) => n.includes(norm(k)))) return null;   // 석고보드(크나우프) 같은 다른 품목의 같은 상표
  return CATS.find((c) => CFG.대상_품목[c].키워드.some((k) => n.includes(norm(k)))) || null;
}

// 명세서 줄 → {납품일: {품명: 줄}} — 대상 3종만, 같은 날 같은 품명은 합산 (helper._target_rows)
export function targetRows(lines, docDate) {
  const byDate = {};
  (lines || []).forEach((l) => {
    let name = String(l.ours || l.name || l.raw_name || '').replace(SITE_TAG, '').trim();
    const rv = (s) => (String(s || '').toUpperCase().match(/R-?(\d+)-(\d+)/) || []).slice(1).join('-');
    if (l.ours && rv(l.raw_name) && rv(l.ours) && rv(l.raw_name) !== rv(l.ours)) name = String(l.raw_name).trim();   // 매칭이 다른 R값(R37-15→R37-23)을 골랐으면 원문 품명으로
    const q = num(l.qty);
    if (!name || q <= 0) return;
    const cat = categoryOf(name) || categoryOf(l.raw_name);
    if (!cat) return;
    const day = isoDate(l.date) || docDate;
    const day0 = (byDate[day] = byDate[day] || {});
    const r = (day0[name] = day0[name] || { cat, name, unit: String(l.unit || '').trim() || CFG.대상_품목[cat].단위, qty: 0 });
    r.qty += q;
  });
  return byDate;
}

function itemCols(r) {
  const name = r.name;
  if (r.cat === '인슐레이션') {
    const toks = name.split(/[_\s]+/).map((t) => t.trim()).filter(Boolean);
    const brand = BRANDS.find((b) => name.includes(b)) || '';
    const grade = toks.find((t) => /^[가나다]등급$/.test(t)) || '';
    const use = USES.find((u) => toks.some((t) => t.startsWith(u))) || '';
    const prod = toks.find((t) => /^R-?\d/i.test(t)) || name;
    let note = '';
    const spec = ((CFG.인슐레이션_제원[brand] || {})[prod]);
    if (spec) {
      const [n, w, h] = spec;
      note = `${fmt(Math.round(r.qty * n * w * h / 1e6 * 100) / 100)} m2 / 낱장수량: ${fmt(r.qty * n)}개`;
    }
    return { brand, use: use ? use + '용' : '', prod, grade, unit: CFG.대상_품목.인슐레이션.단위, note };
  }
  const m = name.match(/\(([^)]*)\)/);
  const brand = BRANDS.find((b) => name.includes(b)) || (m ? m[1] : '');
  let prod = name.replace(/^기타자재[_\s]+/, '');
  if (brand && m && m[1].trim() === brand) prod = prod.replace(new RegExp(`\\s*\\(${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`), '');
  return { brand, use: '', prod, grade: '', unit: r.unit, note: '' };
}

function sortRows(rows) {
  const g = CFG.인슐레이션_등급_순서, u = CFG.인슐레이션_용도_순서;
  const key = (r, i) => {
    if (r.cat !== '인슐레이션') return [1, 0, 0, i];
    const c = itemCols(r);
    const gi = g.indexOf(c.grade), ui = u.indexOf(c.use.slice(0, -1));
    return [0, gi < 0 ? g.length : gi, ui < 0 ? u.length : ui, i];
  };
  return rows.map((r, i) => [key(r, i), r]).sort((a, b) => { for (let k = 0; k < 4; k++) if (a[0][k] !== b[0][k]) return a[0][k] - b[0][k]; return 0; }).map((x) => x[1]);
}

// 확인서 납품처 = 현장 / 주소
function deliveryPlace(s) {
  const head = s.unloadPlace && s.unloadPlace !== s.client ? s.unloadPlace : s.client;
  return [head, s.unloadAddr].filter(Boolean).join(' / ');
}

// → [{date, client, place, what, rows, file}] — 날짜마다 1장, 공간제작소는 날짜×품목군마다 1장
export function planConfirms(client, owner, addr, byDate) {
  const out = [];
  Object.keys(byDate).sort().forEach((day) => {
    const rows = Object.values(byDate[day]);
    if (!rows.length) return;
    const s = { date: day, client, unloadPlace: owner && owner !== client ? owner : '', unloadAddr: addr };
    const found = CATS.filter((c) => rows.some((r) => r.cat === c));
    const split = CFG.품목별_분리_거래처.some((k) => (client || '').includes(k));
    const parts = split ? found.map((c) => [c, rows.filter((r) => r.cat === c), c]) : [['', rows, found.join(', ')]];
    parts.forEach(([tail, part, what]) => {
      const file = [day.replace(/-/g, ''), client, s.unloadPlace || addr, tail].filter(Boolean).join('_').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
      out.push({ date: day, client, place: deliveryPlace(s), what, rows: part, file,
        items: part.map((r) => `${r.name} ${fmt(r.qty)}${r.unit}`).join(' / ') });
    });
  });
  return out;
}

// ── 구글 시트 양식(납품확인서_양식.xlsx) 그대로 — 칸 너비·줄 높이는 시트 px (helper.render 와 같음)
const COLS = [109, 80, 95, 90, 86, 59, 103, 89, 145, 66];
const ZOOM = 0.7075;
const ROWS_MIN = 10;

function sheetHtml(c, logo, stamp, today) {
  const sup = CFG.공급자;
  const rows = sortRows(c.rows);
  const cols = rows.map(itemCols);
  const total = rows.reduce((a, r) => a + r.qty, 0);
  const units = [...new Set(cols.map((x) => x.unit))];
  const tr = (h, cells) => `<tr style="height:${h}px">${cells}<td class="x"></td></tr>`;
  const lab = (t, span = 1) => `<td class="hd" colspan="${span}">${t}</td>`;
  const val = (t, span = 1) => `<td class="v" colspan="${span}">${esc(t)}</td>`;
  let items = rows.map((r, i) => { const x = cols[i]; return tr(21, `<td class="i">${esc(c.date)}</td><td class="i">${esc(x.brand)}</td><td class="i">${esc(x.use)}</td>`
    + `<td class="i">${esc(x.prod)}</td><td class="i">${esc(x.grade)}</td><td class="i">${fmt(r.qty)}</td>`
    + `<td class="i">${esc(x.unit)}</td><td class="i" colspan="2">${esc(x.note)}</td>`); }).join('');
  items += tr(21, '<td class="i"></td>'.repeat(7) + '<td class="i" colspan="2"></td>').repeat(Math.max(0, ROWS_MIN - rows.length));
  const colg = COLS.map((w) => `<col style="width:${w}px">`).join('');
  const stampLeft = COLS.slice(0, 6).reduce((a, b) => a + b, 0) + 8;
  return `<div class="sheet"><table><colgroup>${colg}</colgroup>
<tr style="height:73px"><td colspan="10"></td></tr>
<tr style="height:73px"><td colspan="10" style="vertical-align:top;text-align:left;padding:0"><img src="${logo}" style="width:120px;height:62px;display:block"></td></tr>
<tr style="height:73px"><td colspan="9" style="font-size:24pt;font-weight:700">납 품 확 인 서</td><td></td></tr>
${tr(26, lab('납 품 일') + val(c.date, 8))}
${tr(26, lab('납 품 처') + val(c.place, 8))}
${tr(26, '<td></td>' + lab('공 급 자', 8))}
${tr(26, lab('상 호') + val(sup.상호, 5) + lab('대 표 자') + val(sup.대표자, 2))}
${tr(26, lab('사업자번호') + val(sup.사업자번호, 8))}
${tr(26, lab('주 소') + val(sup.주소, 8))}
${tr(26, lab('납 품 내 용') + val(c.what + ' 납품의 건', 8))}
<tr style="height:20px"><td colspan="10"></td></tr>
<tr style="height:20px"><td colspan="10" style="text-align:left;vertical-align:bottom;font-size:8pt;font-weight:700;padding:0 0 1px 3px">※ 아래와 같이 납품 하였음을 확인 합니다.</td></tr>
${tr(48, "<td class='h'>납품일자<br>년/월/일</td><td class='h'>브랜드</td><td class='h'>용도</td><td class='h'>품 명</td><td class='h'>등급</td><td class='h'>수량</td><td class='h'>단위</td><td class='h' colspan='2'>비 고<br><span style='font-size:7pt'>(시공 가능 면적 / 수량)</span></td>")}
${items}
${tr(22, "<td class='hd' colspan='5' style='font-size:11pt;border:1px solid #D9D9D9'>합&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;계</td>"
    + `<td class='v' style='font-size:10pt;font-weight:700'>${fmt(total)}</td>`
    + `<td style='font-size:10pt;border-left:1px solid #D9D9D9;border-right:1px solid #D9D9D9'>${units.length === 1 ? esc(units[0]) : ''}</td><td class='v' colspan='2'></td>`)}
<tr style="height:21px"><td colspan="10"></td></tr>
<tr style="height:21px"><td colspan="10"></td></tr>
<tr style="height:28px"><td colspan="9" style="font-size:12pt">${today.getFullYear()} 년&nbsp;&nbsp;&nbsp;${today.getMonth() + 1} 월&nbsp;&nbsp;&nbsp;${today.getDate()} 일</td><td></td></tr>
<tr style="height:21px"><td colspan="10"></td></tr>
<tr style="height:62px"><td colspan="9" style="font-size:16pt;position:relative">${esc(sup.상호)}
${stamp ? `<img src="${stamp}" style="position:absolute;left:${stampLeft}px;top:1px;width:62px;height:62px">` : ''}</td><td></td></tr>
</table></div>`;
}

const PAGE_CSS = `@page { size:A4 portrait; margin:1in 0.4in 0.6in 0.76in; }
body{margin:0;font-family:"Pretendard Variable",Pretendard,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:#434343;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.sheet{zoom:${ZOOM};break-after:page}
.sheet:last-child{break-after:auto}
table{border-collapse:collapse;table-layout:fixed;width:${COLS.reduce((a, b) => a + b, 0)}px}
td{padding:0 3px;text-align:center;vertical-align:middle;overflow:hidden;white-space:nowrap}
td.x{border:none}
.hd{background:#F0B346;color:#fff;font-weight:700;font-size:10pt;border:1px solid #fff}
.v{border:1px solid #D9D9D9;font-size:9pt}
.h{background:#F0B346;color:#fff;font-weight:700;font-size:9pt;border:1px solid #D9D9D9;line-height:1.3;white-space:normal}
.i{border:1px solid #D9D9D9;font-size:8pt;white-space:normal;word-break:break-all;line-height:1.25}`;

// ── 도장 (이 기기 브라우저에만)
const STAMP_KEY = 'ht.deliv.stamp';
export function getStamp() { try { return localStorage.getItem(STAMP_KEY) || ''; } catch { return ''; } }
export function setStamp(file) {
  return new Promise((ok, no) => {
    const rd = new FileReader();
    rd.onload = () => { try { localStorage.setItem(STAMP_KEY, String(rd.result)); ok(true); } catch (e) { no(new Error('도장 이미지를 이 브라우저에 저장하지 못했어요: ' + e.message)); } };
    rd.onerror = () => no(new Error('도장 이미지를 읽지 못했어요.'));
    rd.readAsDataURL(file);
  });
}

async function dataUrl(url) {
  const b = await (await fetch(url)).blob();
  return new Promise((ok) => { const rd = new FileReader(); rd.onload = () => ok(String(rd.result)); rd.readAsDataURL(b); });
}

// 확인서들 → 인쇄 창 (PDF 로 저장). 여러 장이면 한 파일에 쪽마다 1장
export async function printConfirms(confirms) {
  if (!confirms.length) return;
  const logo = await dataUrl('./icons/confirm-logo.png');
  const stamp = getStamp();
  const today = new Date();
  const title = confirms.length === 1 ? `납품확인서_${confirms[0].file}` : `납품확인서_${confirms[0].client || ''}_${confirms.length}장`.replace(/_+/g, '_');
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${PAGE_CSS}</style></head><body>${confirms.map((c) => sheetHtml(c, logo, stamp, today)).join('')}</body></html>`;
  const old = document.getElementById('deliv-print');
  if (old) old.remove();
  const fr = document.createElement('iframe');
  fr.id = 'deliv-print';
  fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(fr);
  await new Promise((ok) => { fr.onload = ok; fr.srcdoc = html; });
  const w = fr.contentWindow;
  await w.document.fonts.ready.catch(() => {});
  await Promise.all([...w.document.images].map((im) => (im.complete ? 0 : new Promise((ok) => { im.onload = im.onerror = ok; }))));
  const prevTitle = document.title;
  document.title = title;                 // 크롬은 PDF 파일 이름을 바깥 문서 제목에서 가져감
  w.focus(); w.print();
  setTimeout(() => { document.title = prevTitle; }, 1000);
}

// ── 우리 견적서·거래명세서 엑셀(.xlsx) → 문서 (AI 없이)
// 머리: 'OO 貴下' → 거래처, '건축주명: OO' → 현장명, 발행/견적/출고일자 → 일자. 표: '품명'·'수량' 머리 줄 아래, '출고일' 칸 있으면 줄 날짜(합친 칸은 위 값으로 채움)
let XLSXP = null;
const loadXlsx = () => (XLSXP = XLSXP || import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm'));

export async function readQuoteXlsx(b64) {
  const X = await loadXlsx();
  const wb = X.read(b64, { type: 'base64', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  for (const m of ws['!merges'] || []) {            // 합친 칸 → 모든 칸에 같은 값
    const top = ws[X.utils.encode_cell(m.s)];
    if (!top) continue;
    for (let r = m.s.r; r <= m.e.r; r++) for (let c = m.s.c; c <= m.e.c; c++) {
      const a = X.utils.encode_cell({ r, c });
      if (!ws[a]) ws[a] = { ...top };
    }
  }
  const grid = X.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
  const txt = (v) => (v instanceof Date ? isoDate(v) : String(v ?? '').trim());
  const key = (v) => txt(v).replace(/\s+/g, '');
  const hi = grid.findIndex((row) => row.some((v) => key(v) === '품명') && row.some((v) => key(v).startsWith('수량')));
  if (hi < 0) throw new Error('이 엑셀은 우리 견적서·거래명세서 모양이 아니에요 ("품명"·"수량" 머리 줄을 못 찾음).');
  const head = grid[hi].map(key);
  const col = (...names) => head.findIndex((h) => names.some((n) => h.startsWith(n)));
  const cName = col('품명'), cSpec = col('규격'), cUnit = col('단위'), cQty = col('수량'), cDate = col('출고일', '납품일', '일자'), cNote = col('비고'), cPrice = col('단가');

  let partner = '', manager = '', owner = '', docDate = '', docNo = '';
  grid.slice(0, hi).forEach((row) => row.forEach((v, j) => {
    const t = txt(v);
    if (!t) return;
    const to = t.match(/^(.*?)\s*貴\s*下/);
    if (to && !partner) { const w = to[1].replace(/님$/, '').trim().split(/[\s_]+/).filter(Boolean); partner = w[0] || ''; manager = w.slice(1).join(' '); }
    const ow = t.match(/건축주명\s*[:：]\s*(.*)$/);
    if (ow && !owner) owner = ow[1].replace(/님$/, '').trim();
    if (/^(발행|견적|출고|납품)\s*일\s*자$/.test(t.replace(/\s+/g, ' ')) || /^(발행|견적|출고|납품)일자$/.test(key(t))) {
      const rest = row.slice(j + 1).map(txt).find((x) => isoDate(x));
      if (rest && !docDate) docDate = isoDate(rest);
    }
    if (/^(발행|견적)번호$/.test(key(t))) { const n = row.slice(j + 1).map(txt).join(' ').match(/\d{6,}/); if (n) docNo = n[0]; }
  }));

  const lines = [];
  let blank = 0;
  for (let i = hi + 1; i < grid.length && blank < 5; i++) {
    const row = grid[i];
    const name = txt(row[cName]);
    if (/^합\s*계/.test(txt(row[0])) || /^합\s*계/.test(name)) break;
    if (!name) { blank++; continue; }
    blank = 0;
    const qty = num(row[cQty]);
    if (qty <= 0) continue;
    lines.push({ raw_name: name, spec: cSpec >= 0 ? txt(row[cSpec]) : '', unit: cUnit >= 0 ? txt(row[cUnit]) : '', qty,
      unit_price: cPrice >= 0 ? num(row[cPrice]) : 0, amount: 0, note: cNote >= 0 ? txt(row[cNote]) : '', unclear: false,
      date: cDate >= 0 ? isoDate(row[cDate]) : '' });
  }
  if (!lines.length) throw new Error('엑셀에서 수량이 있는 품목 줄을 못 찾았어요.');
  return { doc_type: '견적서·명세서 엑셀', partner, manager, owner, site: '', doc_date: docDate, doc_no: docNo, lines,
    remarks: '도우미 없이 이 화면에서 엑셀 인식', biz_no: '', totals: {} };
}
