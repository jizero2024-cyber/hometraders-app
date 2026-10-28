// 사진·PDF 거래명세표 읽기 — 사무실 맥 없이 (2026-10-27 대표 "맥 도우미 없이 그냥 되게")
// 슈퍼베이스 Edge Function 'doc-read'. 비밀값: ANTHROPIC_API_KEY (워크스페이스에 묶인 키), 필요하면 ANTHROPIC_WORKSPACE_ID
// 직원 명단(staff_accounts)에 있는 계정만. 맥 도우미 docread.py 와 같은 지시·형식.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SCHEMA = {"type": "object", "properties": {"doc_type": {"type": "string", "enum": ["발주서", "거래명세표", "견적서", "기타"]}, "own_sale": {"type": "boolean", "description": "공급자(보내는 쪽, 사업자번호·도장 칸)가 주식회사 홈트레이더스(876-87-02032)인 우리 판매 문서면 true. 다른 회사가 홈트레이더스 앞으로 보낸 견적서·명세서(홈트레이더스가 공급받는자·수신·귀하 쪽)는 false"}, "supplier_biz_no": {"type": "string", "description": "공급자(보내는 쪽) 칸에 찍힌 사업자등록번호 그대로 000-00-00000. 홈트레이더스 번호여도 그대로 적음. 없으면 빈 문자열"}, "partner": {"type": "string", "description": "상대 회사 이름 (홈트레이더스가 아닌 쪽). 발주서면 발주처, 거래명세표면 공급자 — 단 공급자가 홈트레이더스인 우리 판매 거래명세서면 공급받는자"}, "manager": {"type": "string", "description": "상대 회사 담당자 (예: 이상진 상무). 없으면 빈 문자열"}, "owner": {"type": "string", "description": "건축주명 (없으면 빈 문자열)"}, "site": {"type": "string", "description": "납품장소·현장 주소 (없으면 빈 문자열)"}, "doc_date": {"type": "string", "description": "문서 일자 YYYY-MM-DD (없으면 빈 문자열)"}, "lines": {"type": "array", "items": {"type": "object", "properties": {"raw_name": {"type": "string", "description": "품명 — 문서에 적힌 글자 그대로"}, "spec": {"type": "string", "description": "규격 칸 (없으면 빈 문자열)"}, "unit": {"type": "string", "description": "단위 칸 (EA, ROLL, BOX, 단, 장 …)"}, "qty": {"type": "number", "description": "수량. 안 적혀 있으면 0"}, "unit_price": {"type": "number", "description": "단가. 안 적혀 있으면 0"}, "amount": {"type": "number", "description": "금액(공급가액). 명세서에 찍힌 숫자 그대로 — 수량×단가로 계산하지 말 것. 안 적혀 있으면 0"}, "vat": {"type": "number", "description": "그 줄 부가세(세액). 찍힌 숫자 그대로. 칸이 없거나 비어 있으면 0"}, "note": {"type": "string", "description": "그 줄 비고 (없으면 빈 문자열)"}, "date": {"type": "string", "description": "표에 줄마다 일자 칸이 있으면 그 줄 일자 YYYY-MM-DD (연도가 없으면 문서 일자의 연도). 일자 칸이 없으면 빈 문자열"}, "unclear": {"type": "boolean", "description": "손글씨·흐림 등으로 값이 확실하지 않으면 true"}}, "required": ["raw_name", "spec", "unit", "qty", "unit_price", "amount", "vat", "note", "date", "unclear"], "additionalProperties": false}}, "remarks": {"type": "string", "description": "특이사항·결제방법 등 문서 하단 메모 (없으면 빈 문자열)"}, "biz_no": {"type": "string", "description": "상대 회사(partner) 사업자등록번호 000-00-00000. 홈트레이더스(876-87-02032) 번호는 아님. 없으면 빈 문자열"}, "total_supply": {"type": "number", "description": "문서 하단에 찍힌 공급가액 합계 그대로. 없으면 0"}, "total_vat": {"type": "number", "description": "문서 하단에 찍힌 세액(부가세) 합계 그대로. 없으면 0"}, "total_amount": {"type": "number", "description": "문서에 찍힌 총액(공급가액+세액, 합계금액·총계) 그대로. 없으면 0"}}, "required": ["doc_type", "own_sale", "supplier_biz_no", "partner", "manager", "owner", "site", "doc_date", "lines", "remarks", "biz_no", "total_supply", "total_vat", "total_amount"], "additionalProperties": false};
const SYSTEM = "당신은 건축자재 유통회사(주식회사 홈트레이더스)의 문서 입력 담당입니다.\n거래처가 보낸 발주서·거래명세표·견적서(사진, PDF, 엑셀 표)를 읽어 정해진 JSON 으로 옮깁니다.\n\n- 품명·규격·단위는 문서에 적힌 글자를 그대로 옮깁니다. 줄임말을 풀거나 표준 이름으로 바꾸지 않습니다.\n- 발주서 양식에는 수량이 비어 있는 기본 품목 줄이 많습니다. 수량이 0이거나 빈 줄은 넣지 않습니다.\n- 합계·소계·운반비 안내 같은 요약 줄은 품목이 아니므로 넣지 않습니다.\n- 숫자에 쉼표가 있으면 빼고 숫자로 적습니다. 값이 없으면 0 입니다.\n- 손글씨나 흐림 때문에 확실하지 않은 값은 가장 그럴듯한 값을 적고 unclear 를 true 로 둡니다.\n- 거래명세서의 금액(공급가액·세액·합계)은 ERP 전표에 그대로 들어가므로 문서에 찍힌 숫자를 한 자리도 바꾸지 않고 옮깁니다.\n  수량×단가와 공급가액이 달라도(단가 반올림) 계산해서 고치지 말고 찍힌 값을 적습니다. 하단 합계도 직접 더하지 말고 찍힌 값을 적습니다.";
const MODEL = 'claude-sonnet-5-5';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const out = (j: unknown, status = 200) => new Response(JSON.stringify(j), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } });
    const { data: { user } } = await sb.auth.getUser();
    const email = (user && user.email) || '';
    const { data: staff, error: se } = await sb.rpc('is_staff');   // 보안 1단계 SQL 전이면 예전 규칙
    if (se ? (!email.endsWith('@hometraders.local') || email.startsWith('space')) : !staff) return out({ ok: false, error: '직원 계정만 쓸 수 있어요' }, 403);
    const key = Deno.env.get('ANTHROPIC_API_KEY');
    if (!key) return out({ ok: false, error: '서버에 AI 키가 아직 없어요' }, 500);
    const { name = '', data = '', mime = '' } = await req.json();
    if (!data) return out({ ok: false, error: '파일이 비어 있어요' }, 400);
    const isPdf = /pdf/.test(mime) || /\.pdf$/i.test(name);
    const block = isPdf
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } }
      : { type: 'image', source: { type: 'base64', media_type: /png/.test(mime) ? 'image/png' : /webp/.test(mime) ? 'image/webp' : 'image/jpeg', data } };
    const headers: Record<string, string> = { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' };
    const ws = Deno.env.get('ANTHROPIC_WORKSPACE_ID'); if (ws) headers['anthropic-workspace-id'] = ws;
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers, body: JSON.stringify({
      model: MODEL, max_tokens: 16000, system: SYSTEM,
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: [block, { type: 'text', text: '이 문서의 내용을 JSON 으로 옮겨 주세요.' }] }],
    }) });
    const j = await r.json();
    if (!r.ok) return out({ ok: false, error: (j.error && j.error.message) || `AI 오류 ${r.status}` }, 502);
    if (j.stop_reason === 'max_tokens') return out({ ok: false, error: '문서가 너무 길어 끝까지 읽지 못했어요. 페이지를 나눠서 올려주세요.' }, 422);
    const text = (j.content || []).find((b: { type: string }) => b.type === 'text')?.text || '{}';
    const doc = JSON.parse(text);
    doc.totals = {};
    for (const [k, src] of [['supply', 'total_supply'], ['vat', 'total_vat'], ['total', 'total_amount']]) { if (doc[src]) doc.totals[k] = doc[src]; delete doc[src]; }
    const sup = String(doc.supplier_biz_no || '').replace(/\D/g, ''); delete doc.supplier_biz_no;
    doc.own_sale = sup === '8768702032';   // 우리 판매 문서인지는 공급자 사업자번호로
    doc.read_mode = 'AI (서버)';
    return out({ ok: true, doc, usage: { model: j.model, in: j.usage?.input_tokens, out: j.usage?.output_tokens } });
  } catch (e) {
    return out({ ok: false, error: String((e as Error).message || e).slice(0, 300) }, 500);
  }
});
