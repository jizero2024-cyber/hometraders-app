// 배차 요청 예상 무게 — 품목 글(예: "레드파인 2*6*10 7파레트 · 실리콘 6박스")에서 자재·규격·수량을 읽어 kg 합계 (10/29 대표 '적재가능 무게 계산' 표)
// 표: 세라믹사이딩 1장 27kg(1PT 80장) · 메탈사이딩 1장 4.4kg(1박스 8장 35kg) · 비닐사이딩 1박스 40kg
//     구조재 12자 1PT 1.6톤(1자당 0.13톤) · 방부목 12자 1PT 2.2톤 · 개당(12자) 구조재 2*4 6.6 / 2*6 10 / 2*8 13.3, 방부목 9 / 13.7 / 18.3kg
//     OSB 11.1mm 1장 22kg(1PT 70장 1.6톤) · 다루끼 1PT 1,560개 1.5톤 · 실리콘 1박스 10kg(25개)
// 2*10·2*12 개당 무게는 폭 비례로 늘린 추정값.

const PER12 = { 구조재: { 4: 6.6, 6: 10, 8: 13.3, 10: 17, 12: 20.6, 2: 2.8 }, 방부목: { 4: 9, 6: 13.7, 8: 18.3, 10: 23.4, 12: 28.4, 2: 3.8 } };
const PT12 = { 구조재: 1600, 방부목: 2200 };

const UNIT = {
  pt: /(\d+(?:\.\d+)?)\s*(?:pt|plt|파레트|파렛트|파렛|팔레트|빠레트|빠렛)/i,
  box: /(\d+(?:\.\d+)?)\s*(?:박스|box|bx)/i,
  sheet: /(\d+(?:\.\d+)?)\s*(?:장|매)/,
  ea: /(\d+(?:\.\d+)?)\s*(?:개|본|ea|pcs)/i,
};
const qty = (s, u) => { const m = s.match(UNIT[u]); return m ? Number(m[1]) : 0; };

// 한 덩어리 → kg (모르면 null)
function one(s) {
  const t = s.replace(/\s+/g, ' ');
  const pt = qty(t, 'pt'), box = qty(t, 'box'), sh = qty(t, 'sheet'), ea = qty(t, 'ea');
  if (/실리콘|실란트/.test(t)) return box ? box * 10 : ea ? ea * 0.4 : null;
  if (/세라믹|판재/.test(t) && !/메탈/.test(t)) { const n = sh || ea; return pt ? pt * 2200 : n ? n * 27 : null; }
  if (/메탈/.test(t)) return box ? box * 35 : (sh || ea) ? (sh || ea) * 4.4 : null;
  if (/비닐/.test(t)) return box ? box * 40 : null;
  if (/osb/i.test(t)) return pt ? pt * 1600 : (sh || ea) ? (sh || ea) * 22 : null;
  if (/다루끼/.test(t)) return pt ? pt * 1500 : ea ? ea * 0.96 : null;
  const m = t.match(/2\s*[*x×]\s*(\d{1,2})(?:\s*[*x×]\s*(\d{1,2})|\s+(\d{1,2})\s*자)/i);   // 2*6*10 · 2*4 20자 → 폭, 길이(자)
  if (m) {
    const kind = /방부/.test(t) ? '방부목' : '구조재';
    const w = Number(m[1]), len = Number(m[2] || m[3]);
    if (pt) return pt * PT12[kind] * len / 12;
    const per = PER12[kind][w];
    const bare = t.slice(m.index + m[0].length).match(/^\s*(\d+)\s*$/);   // '구조재 2*4 20자 100' 처럼 단위 없이 끝난 수 = 개수
    const n = ea || sh || (bare ? Number(bare[1]) : 0);
    return per && n ? n * per * len / 12 : null;
  }
  return null;
}

// 품목 글 전체 → { kg, known, unknown } — 하나라도 읽으면 kg 를 돌려줌
export function estimate(text) {
  const parts = String(text || '').split(/[·,+\n]|\s\/\s/).map((x) => x.trim()).filter(Boolean);
  let kg = 0, known = 0, unknown = 0;
  parts.forEach((p) => { const v = one(p); if (v == null) { if (/\d/.test(p)) unknown++; } else { kg += v; known++; } });
  return known ? { kg, known, unknown } : null;
}

// 1,000kg 넘으면 톤(소수 한 자리), 아니면 10kg 단위
export function label(kg) {
  if (kg >= 1000) return `약 ${(Math.round(kg / 100) / 10).toFixed(1)}톤`;
  return `약 ${Math.max(10, Math.round(kg / 10) * 10)}kg`;
}
