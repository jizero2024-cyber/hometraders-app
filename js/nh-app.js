// 뉴하우징 페이지 (/newhousing/) — 우리 업무 앱(app.js)과 완전히 따로 (공간제작소 gonggan-app.js 와 같은 방식, 10/28 대표)
//   뉴하우징 계정은 코드 한 칸으로 로그인. 직원은 첫 화면에서 로그인하고 들어옴 (같은 로그인).
//   권한(staff · view)은 DB 의 staff_accounts · partner_accounts 가 정함 (2026-10-28-newhousing.sql).
import * as S from './nh-store.js?v=1';
import * as NB from './nhbms.js?v=2';

const app = document.getElementById('app');
const CODE_LOGIN = 'newhousing';   // 뉴하우징 계정 아이디 (비밀번호 = 코드)
let me = '', role = '', booted = false;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function render() { if (booted && me) app.innerHTML = NB.screen(); }
function showLogin(msg) {
  app.innerHTML = `
  <div style="position:fixed;inset:0;background:#fff;display:flex;flex-direction:column;align-items:center;padding:18vh 24px 0;box-sizing:border-box;font-family:Pretendard,'Noto Sans KR',system-ui,sans-serif">
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:28px"><b style="font-size:22px">뉴하우징홈</b><span aria-hidden="true" style="color:#8A8A8A">×</span><img src="/icons/logo-full.png" alt="HOME TRADERS" style="height:40px"></div>
    <form id="nh-login" style="width:100%;max-width:320px;display:flex;flex-direction:column;gap:10px">
      <input name="code" type="password" autocomplete="current-password" placeholder="코드" aria-label="코드" style="padding:14px;border-radius:11px;background:#F3F4F6;border:0;font-size:16px;text-align:center">
      <button type="submit" style="margin-top:4px;width:100%;padding:15px;border:0;border-radius:13px;background:#1F2328;color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer">로그인</button>
      <p id="nh-err" style="color:#e05a52;font-size:13px;min-height:18px;margin:2px 0;text-align:center">${esc(msg || '')}</p>
    </form>
  </div>`;
}
app.addEventListener('submit', (e) => {
  if (e.target.id !== 'nh-login') return;
  e.preventDefault();
  const err = document.getElementById('nh-err');
  if (err) err.textContent = '로그인 중…';
  S.signIn(CODE_LOGIN, e.target.code.value.trim()).catch(() => { if (err) err.textContent = '코드를 확인해 주세요'; });
});

async function boot() {
  const session = await S.getSession();
  if (!session) { booted = false; me = ''; if (!document.getElementById('nh-login')) showLogin(); return; }
  me = ((session.user && session.user.email) || '').split('@')[0];
  const acc = await S.myAccess();
  role = acc && acc.staff ? 'staff' : acc && acc.partner === '뉴하우징' ? 'view' : '';
  if (!role) {   // 직원도 뉴하우징 계정도 아님 (공간제작소 계정 포함)
    booted = false; me = '';
    await S.signOut();
    showLogin('코드를 확인해 주세요');
    return;
  }
  booted = true;
  render();
}

NB.bind(app, {
  rerender: render,
  goStart: () => { if (role === 'staff') location.href = '/main'; },
  me: () => me,
  role: () => role,
  logout: () => { booted = false; me = ''; role = ''; S.signOut().finally(() => showLogin()); },
});
S.onAuthChange(() => boot());
boot();
