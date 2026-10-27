// 공간제작소 페이지 (/gonggan/ · /gonggan-ace/) — 우리 업무 앱(app.js)과 완전히 따로 (10/23 대표 "공간제작소 관련된 건 사이트 코드 분리")
//   이 페이지는 우리 업무 앱 코드를 하나도 불러오지 않음: 로그인 · 공간제작소 명세(gbms.js) · 거래명세표 그리기(stmt.js) 만.
//   공간제작소 계정(space1234)은 코드 하나로 로그인. 직원 계정도 같은 화면 (직원만: 직접 등록 · 처음 화면 · 거래명세표 지우기).
import * as S from './gonggan-store.js?v=7';
import * as GB from './gbms.js?v=39';

const app = document.getElementById('app');
const GONG_ID = 'space1234';
const GONG_MIN_LOGIN = '2026-10-25T05:37:00Z';   // 공간제작소 계정: 이 시각(10/25 14:37 — 비밀번호 바꾼 뒤) 전에 로그인한 기기는 다시 로그인해야 함 — 비밀번호 바꿀 때마다 이 값을 지금으로
const CLOSED = false;  // 공간제작소 계정 닫기 스위치 (10/23 닫음 → 10/25 대표 "이제 열어줘" → 10/27 오전 "아직 막아줘" → 10/27 대표 "기안확정·수정요청·다운받기만 되게 하고 이제 풀어줘"). 닫을 땐 true + DB 정책 gonggan_closed
const HELPER = 'http://127.0.0.1:4180';   // 사무실 맥 도우미 — 직원이 직접 등록할 때 PDF·사진 읽기
let me = '';
let booted = false;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const bizFromPath = () => (location.pathname.startsWith('/gonggan-ace') ? 'ace' : 'homt');
function render() {
  if (!booted || !me) return;   // 로그인·준비 전엔 그리지 않음
  GB.setBiz(bizFromPath());
  app.innerHTML = GB.screen();
}

function showLogin(msg) {
  app.innerHTML = `
  <div class="gb-login" style="position:fixed;inset:0;background:#fff;display:flex;flex-direction:column;align-items:center;padding:18vh 24px 0;box-sizing:border-box;font-family:Pretendard,'Noto Sans KR',system-ui,sans-serif">
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:28px"><img src="/icons/partner-gongan.png" alt="공간제작소" style="height:48px"><span aria-hidden="true" style="color:#8A8A8A">×</span><img src="/icons/logo-full.png" alt="HOME TRADERS" style="height:44px"></div>
    <form id="gg-login" style="width:100%;max-width:320px;display:flex;flex-direction:column;gap:10px">
      <input name="uid" autocomplete="username" autocapitalize="off" placeholder="아이디" aria-label="아이디" style="padding:14px;border-radius:11px;background:#F3F4F6;border:0;font-size:16px;text-align:center">
      <input name="code" type="password" autocomplete="current-password" placeholder="비밀번호" aria-label="비밀번호" style="padding:14px;border-radius:11px;background:#F3F4F6;border:0;font-size:16px;text-align:center">
      <button type="submit" style="margin-top:4px;width:100%;padding:15px;border:0;border-radius:13px;background:#1F2328;color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer">로그인</button>
      <p id="gg-err" style="color:#e05a52;font-size:13px;min-height:18px;margin:2px 0;text-align:center">${esc(msg || '')}</p>
    </form>
  </div>`;
}
app.addEventListener('submit', (e) => {
  if (e.target.id !== 'gg-login') return;
  e.preventDefault();
  const id = (e.target.elements.uid.value.trim() || GONG_ID).toLowerCase(), code = e.target.code.value.trim(), err = document.getElementById('gg-err');   // 10/27 대표: space1234 = 현구 과장님, space1225 = 우리 직원 — 아이디로 나눔
  if (err) err.textContent = '로그인 중…';
  S.signIn(id, code).catch(() => { if (err) err.textContent = '아이디·비밀번호를 확인해 주세요'; });   // 아이디는 space1234 고정, 코드 = 비밀번호 (10/23 대표: 비밀번호를 바꿔도 코드만 새로)
});

async function boot() {
  const session = await S.getSession();
  if (!session) { booted = false; me = ''; if (!document.getElementById('gg-login')) showLogin(); return; }
  me = ((session.user && session.user.email) || '').split('@')[0];
  const signedAt = Date.parse((session.user && session.user.last_sign_in_at) || '') || 0;
  if (me === GONG_ID && signedAt < Date.parse(GONG_MIN_LOGIN)) {   // 이 시각 전에 들어온 공간제작소 로그인은 끊음 — 비밀번호 바꾼 뒤 예전 로그인이 남은 기기 (10/25 대표)
    booted = false; me = '';
    await S.signOut();
    showLogin('코드를 확인해 주세요');
    return;
  }
  if (me === GONG_ID && CLOSED) {   // 지금은 공간제작소 계정으로 못 들어옴 (10/23 대표 "나만 들어갈 수 있게") — 다시 열 때 CLOSED = false
    booted = false; me = '';
    await S.signOut();
    showLogin('코드를 확인해 주세요');
    return;
  }
  booted = true;
  if (location.hash === '#wait' && me !== GONG_ID) { GB.openWait(); history.replaceState(null, '', location.pathname); }   // 처음 화면 '공간 올릴 전표' 칸에서 (10/27)
  render();
}

// ── 직원 직접 등록용 (공간제작소 계정은 버튼이 안 보이고 DB 에서도 막힘) ──
const SLIP_HEAD = ['일자', '순번', '거래처명', '품목명', '규격', '수량', '단가', '공급가액', '부가세'];
const DRIVE_IDS = /drive\.google\.com\/(?:file\/d\/|open\?id=)([A-Za-z0-9_-]{20,})/g;
const BOARD_NO = /[^\s,·]+-\d{6}-\d{2}/g;
async function slipsFor(text) {   // 출고 번호(공간제작소-261020-01) · 전표 번호(20261020-3 · 10/20-3) · 전표 링크 → 판매전표 줄
  const out = { head: SLIP_HEAD, slips: [] };
  const ids = [...new Set([...text.matchAll(DRIVE_IDS)].map((m) => m[1]))];
  if (ids.length) {
    const got = await S.getSlipRowsByDrive(ids);
    ids.forEach((id) => { const g = got.find((x) => x.drive_id === id); out.slips.push(g ? { id, ...g } : { id, error: '공유 DB 에 아직 없는 전표 링크예요' }); });
  }
  const rest = text.replace(/https?:\/\/\S+/g, ' ');
  const nos = [...new Set(rest.match(BOARD_NO) || [])];
  const left = rest.replace(BOARD_NO, ' ');
  const want = new Set([...left.matchAll(/(?<!\d)20(?:26|27)(\d{4})-(\d+)/g)].map((m) => `2026${m[1]}-${m[2]}`));
  [...left.matchAll(/(?<![\d/])(\d{1,2})\/(\d{1,2})-(\d+)/g)].forEach((m) => want.add(`2026${m[1].padStart(2, '0')}${m[2].padStart(2, '0')}-${m[3]}`));
  if (nos.length) {
    const found = await S.getBoardSlips(nos);
    nos.forEach((no) => { const b = found.find((x) => x.no === no); if (b) b.slips.forEach((x) => want.add(x)); else out.slips.push({ id: no, error: `출고 번호 ${no}: 이카운트에 넣은 판매전표가 아직 없어요` }); });
  }
  if (want.size) {
    const got = (await S.getSlipRowsBySlip([...want])).filter((g) => g.kind === '판매');
    [...want].forEach((sl) => { const g = got.find((x) => x.slip === sl); out.slips.push(g ? { id: sl, ...g } : { id: sl, error: `판매전표 ${sl}: 공유 DB 에 아직 없어요` }); });
  }
  if (!out.slips.length) out.slips.push({ id: '-', error: '출고 번호(공간제작소-261020-01)·전표 번호(20261020-3)·전표 링크를 넣어 주세요' });
  return out;
}
let helper = { up: false, at: 0 };
async function helperFetch(path, body) {
  const r = await fetch(HELPER + path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  const j = await r.json().catch(() => ({ ok: false, error: '도우미 응답을 읽지 못했어요.' }));
  if (!j.ok) throw new Error(j.error || '도우미 오류');
  return j;
}
function helperUp() {
  if (me === GONG_ID) return false;
  if (Date.now() - helper.at > 60000) { helper.at = Date.now(); helperFetch('/api/health').then(() => { helper.up = true; }).catch(() => { helper.up = false; }); }
  return helper.up;
}

GB.bind(app, {
  rerender: render,
  goStart: () => { if (me !== GONG_ID) location.href = '/main'; },   // 직원만 (공간제작소 계정엔 버튼이 없음)
  go: (r) => { history.pushState(null, '', r === 'gonggan-ace' ? '/gonggan-ace/' : '/gonggan/'); render(); },
  me: () => me,
  logout: () => { booted = false; me = ''; S.signOut().finally(() => showLogin()); },   // 같은 기기에서 직원 계정으로 바꿔 들어갈 때 (10/25)
  slips: (text) => (me === GONG_ID ? Promise.resolve({ head: SLIP_HEAD, slips: [] }) : slipsFor(text)),
  helper: (path, body) => (me === GONG_ID ? Promise.reject(new Error('사용할 수 없어요')) : helperFetch(path, body)),
  helperUp,
});
window.addEventListener('popstate', render);
// 이 기기의 오프라인 저장소를 지움 — 옛 저장본이 공간제작소 주소에 우리 앱을 대신 보여 주던 일 다시 없게 (10/25). 우리 앱은 다음에 열 때 다시 만듦
if (navigator.serviceWorker) navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
S.onAuthChange(() => boot());
boot();
