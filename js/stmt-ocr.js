// 캡처 사진 → 거래명세표 — 브라우저 안에서만 (서버·API 키 없음)
//   1) tesseract.js 로 글자 인식 (한국어+영문, 처음 한 번만 받아 두면 다음부터 빠름)
//   2) 이카운트 거래명세서 화면은 칸이 늘 같아서, 줄 단위로 규칙대로 나눔
//   3) 수량×단가 ≈ 공급가액, 공급가액+부가세 = 합계 로 검산 — 안 맞으면 '확인 필요'
//   4) 품명은 이카운트 품목 목록과 대조해 가장 가까운 이름으로 교정
const TESS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.0/tesseract.min.js';

const nfc = (v) => String(v == null ? '' : v).normalize('NFC').trim();
const digits = (t) => {
  const s = nfc(t).replace(/[OoＯ]/g, '0').replace(/[lI|]/g, '1').replace(/[^\d]/g, '');
  return s ? Number(s) : null;
};

function loadTess() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  return new Promise((ok, no) => {
    const el = document.createElement('script');
    el.src = TESS_CDN;
    el.onload = () => ok(window.Tesseract);
    el.onerror = () => no(new Error('글자 인식 도구를 못 받았어요 — 인터넷 연결을 확인하세요.'));
    document.head.appendChild(el);
  });
}

// 작은 사진은 그대로 읽으면 잘 안 되니 2배로 키우고 흑백·대비를 올린다
async function prep(file) {
  const img = await new Promise((ok, no) => {
    const i = new Image();
    i.onload = () => ok(i); i.onerror = () => no(new Error('사진을 열지 못했어요.'));
    i.src = URL.createObjectURL(file);
  });
  const scale = img.width < 1600 ? 2 : 1;
  const cv = document.createElement('canvas');
  cv.width = img.width * scale; cv.height = img.height * scale;
  const cx = cv.getContext('2d');
  cx.drawImage(img, 0, 0, cv.width, cv.height);
  const d = cx.getImageData(0, 0, cv.width, cv.height);
  for (let i = 0; i < d.data.length; i += 4) {
    const g = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2];
    const v = g > 165 ? 255 : g < 105 ? 0 : g;      // 옅은 칸선은 날리고 글자는 진하게
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
  }
  cx.putImageData(d, 0, 0);
  URL.revokeObjectURL(img.src);
  return cv;
}

export async function readImage(file, onStep) {
  const T = await loadTess();
  if (onStep) onStep('사진 다듬는 중…');
  const cv = await prep(file);
  if (onStep) onStep('글자 읽는 중… (처음 한 번은 20~40초)');
  const { data } = await T.recognize(cv, 'kor+eng', {
    logger: (m) => { if (onStep && m.status === 'recognizing text') onStep(`글자 읽는 중… ${Math.round((m.progress || 0) * 100)}%`); },
  });
  return (data.lines || []).map((l) => nfc(l.text)).filter(Boolean);
}

// ── 줄 → 전표 ──────────────────────────────────────────────
// 이카운트 거래명세서 화면: '일련번호 2026/09/29 -2', '(주)○○ 貴中', 품목 줄(일자 품명 수량 단가 공급가액 부가세)
export function parseLines(lines, items) {
  const all = lines.join('\n');
  let ymd = '', seq = 1;
  const m = /(20\d\d)\s*[\/.\-]\s*(\d{1,2})\s*[\/.\-]\s*(\d{1,2})\s*-?\s*(\d+)?/.exec(all);
  if (m) { ymd = `${m[1]}${String(+m[2]).padStart(2, '0')}${String(+m[3]).padStart(2, '0')}`; seq = +(m[4] || 1); }

  // 받는 거래처 — '貴中' 줄이 흐리게 읽혀도 되게, (주)○○ 중 우리 회사가 아닌 것
  let partner = '';
  const pm = /([(（]?\s*주\s*[)）]?\s*[가-힣A-Za-z0-9]{2,12})\s*貴/.exec(all);
  if (pm) partner = nfc(pm[1]).replace(/\s+/g, '');
  if (!partner) {
    const cand = [...all.matchAll(/[(（]?\s*주\s*[)）]\s*([가-힣A-Za-z0-9]{2,12})/g)].map((x) => '(주)' + x[1]);
    partner = cand.find((c) => !/홈트레이더스/.test(c)) || '';
  }

  const out = [], warn = [];
  lines.forEach((ln) => {
    if (!/^.{0,4}\d{1,2}\s*[\/.\-]\s*\d{1,2}[\s|]/.test(ln)) return;      // 품목 줄은 '09/29' 로 시작 (앞에 표 선이 섞여도)
    const body = ln.replace(/\[[^\]]*\]/g, ' ');                       // [0929/공간] 같은 현장 태그의 숫자는 뺌
    const nums = [...body.matchAll(/\d[\d,.]{1,}\d/g)].map((x) => digits(x[0])).filter((n) => n);   // 8.871.273 처럼 점이 섞여 읽혀도 한 덩어리로
    if (nums.length < 2) return;
    const got = pickNumbers(nums);
    const head = body.replace(/^.{0,4}?\d{1,2}\s*[\/.\-]\s*\d{1,2}\s*/, '');   // 일자 떼고
    const cut = head.search(/(\s+[\d,.]{2,}[|.\s]*){2,}$/);                      // 끝에 몰린 숫자 칸들 앞에서 자름
    let name = (cut > 0 ? head.slice(0, cut) : head).replace(/\s{2,}/g, ' ').trim();
    name = fixName(name, items, ln);
    if (!got) { warn.push(name || ln); return; }
    out.push({ name, qty: got.qty, supply: got.supply, vat: got.vat, checked: got.ok });
    if (!got.ok) warn.push(name || ln);
  });
  if (!out.length) throw new Error('사진에서 품목 줄을 못 찾았어요 — 표 전체가 잘리지 않게 다시 캡처해 주세요.');
  return { ymd: ymd || new Date().toISOString().slice(0, 10).replace(/-/g, ''), seq, partner: partner || '거래처미상', items: out, warn };
}

// 숫자 되살리기 — 부가세 = 공급가액×10% 로 기준을 잡고, 수량·단가는 곱셈이 맞는 조합을 고른다
// (글자 인식이 912 를 12 로 읽어도 공급가액÷단가 로 되살림)
function pickNumbers(nums) {
  const near = (a, b, tol) => Math.abs(a - b) <= Math.max(2, tol);
  // 1) 공급가액·부가세 — 부가세가 공급가액의 10% 인 짝
  let base = null;
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (i !== j && nums[i] > 1000 && near(Math.round(nums[i] * 0.1), nums[j], nums[i] * 0.003)) base = { supply: nums[i], vat: nums[j], si: i, vi: j };
    }
  }
  if (!base) return null;
  const rest = nums.filter((_, k) => k !== base.si && k !== base.vi);

  // 2) 수량 — 공급가액 ÷ 단가 로 되계산하고, 읽은 수량과 끝자리가 같은 것을 고른다
  //    (이카운트 단가는 반올림이라 곱이 딱 안 떨어짐: 912 × 9,727 ≈ 8,871,273)
  const prices = [...rest].sort((a, b) => b - a);
  for (const price of prices) {
    if (price < 50) continue;
    const q = Math.round(base.supply / price);
    if (q < 1 || q > 1000000) continue;
    const hit = rest.some((t) => t !== price && (String(q).endsWith(String(t)) || String(t).endsWith(String(q))));
    if (hit) return { qty: q, supply: base.supply, vat: base.vat, ok: true };
  }
  // 3) 그래도 못 맞추면 가장 큰 값을 단가로 보고 되계산 — '확인 필요' 로 표시
  const price = prices.find((p) => p >= 50);
  const qty = price ? Math.round(base.supply / price) : (rest.length ? Math.min(...rest) : 0);
  return { qty, supply: base.supply, vat: base.vat, ok: false };
}

// 이카운트 품목 목록에서 가장 가까운 이름으로 (글자 인식 오타 교정)
// 사진에서 읽은 품명 다듬기 — 표 선·잡자 지우고 규격 기호를 * 로 통일
function cleanName(raw) {
  let t = nfc(raw).replace(/[|_]{2,}/g, ' ').replace(/[\[\]{}]/g, ' ');
  t = t.replace(/^[^가-힣A-Za-z]+/, '');                       // 앞쪽 표 선·부호 덩어리 제거
  t = t.replace(/^[A-Za-z]{1,3}\s+(?=[가-힣])/, '');            // 'EM 레드우드' 처럼 앞에 붙은 잡글자
  t = t.replace(/(\d)\s*[+·xX×]\s*(\d)/g, '$1*$2');            // 38+140+3048 → 38*140*3048
  t = t.replace(/(\d)\s+(?=\d)/g, '$1*');                      // 2 6*10 → 2*6*10
  t = t.replace(/\s*\(\s*\)/g, '').replace(/\s{2,}/g, ' ').replace(/[\s.·|]+$/, '');
  return t.trim();
}

// 이카운트 품목 목록과 대조 — 규격이 같고 '품목 이름 낱말'이 모두 들어맞을 때만 교정한다
// (목록에 없는 품목을 비슷한 다른 품목으로 바꿔버리면 안 되므로 보수적으로)
function fixName(raw, items, full) {
  const src = cleanName(raw);
  if (!src || !items || !items.length) return src;
  const key = (x) => nfc(x).replace(/\s+/g, '').toUpperCase().replace(/[×xX+·*]/g, '*');
  const sizes = [...key(full || src).matchAll(/\d+\*\d+\*\d+/g)].map((x) => x[0]);
  if (!sizes.length) return src;
  const pool = items.filter((nm) => sizes.every((sz) => key(nm).includes(sz)));
  if (!pool.length) return src;
  const words = (nfc(src).match(/[가-힣]{2,}/g) || []).filter((w) => !/규격|수량|단가/.test(w));
  if (!words.length) return src;
  const hit = pool.filter((nm) => words.every((w) => nfc(nm).replace(/\s+/g, '').includes(w)));
  return hit.length === 1 ? hit[0] : src;       // 딱 하나로 좁혀질 때만 바꾼다
}
