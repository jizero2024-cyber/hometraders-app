-- 뉴하우징 협업툴 (/newhousing/) — 2026-10-28 대표 "공간제작소처럼 직원 계정 / 클라이언트 계정 따로"
--   이 파일 하나만 Supabase SQL 창에 붙여 넣고 실행. 여러 번 돌려도 됨. (보안 1단계 2026-10-28-security-step1.sql 을 먼저 돌린 뒤)
--
--   nh_sales : 이카운트 판매현황의 뉴하우징홈 판매 줄 (맥 도우미 nh_bms.py 가 10분마다 올림)
--   nh_docs  : 거래명세표 한 장마다 상태 · 세금계산서 · 수정요청 사유 (화면 · 첫 화면 출고 흐름 명세표 탭이 같이 씀)
--   nh_sites : 현장마다 세트 대조표(세트 → 발주 → 출고 → 송장 확인)와 납품송장 목록 (맥 도우미가 올림, 단가·구매처 없음)
--
--   볼 수 있는 사람: 직원(staff_accounts) · 뉴하우징 계정(partner_accounts 의 partner = '뉴하우징')만.
--   뉴하우징 계정은 nh_sales · nh_sites 는 읽기만, nh_docs 는 읽기 + 쓰기(화면에서 막음).

-- ── 1. 표 ──
create table if not exists public.nh_sales (
  id          text primary key,                 -- '20261012-1|3' (전표|줄 순번)
  ymd         text not null,
  slip        text not null,                    -- '2026/10/12 -1'
  partner     text not null,
  name        text not null,                    -- 품목명(규격) 그대로 — 현장 태그 [1012/뉴하/파주/이충혁소장님] 포함
  qty         numeric,
  price       numeric,
  supply      numeric,
  vat         numeric,
  site        text,                             -- '파주-CH' (지역-소장 이니셜, 맥 도우미가 정함)
  reg         text,                             -- 사이트에 처음 올라간 시각
  updated_at  timestamptz default now()
);
create table if not exists public.nh_docs (
  id          text primary key,                 -- 화면이 만든 거래명세표 한 장의 키
  status      text,                             -- null(결재전) · 기안중 · 수정요청 · 최종완료 · 삭제
  tax_data    text,                             -- 세금계산서 그림/PDF (data URL)
  tax_name    text,
  tax_no      text,                             -- 승인번호
  stmt_data   text,                             -- 바꿔 넣은 거래명세표 (data URL, 없으면 자동 생성본)
  reason      text,
  manual      jsonb,                            -- {site, title, total} 손으로 고친 것
  paid        text,
  drafted_at  timestamptz,
  updated_by  text,
  updated_at  timestamptz default now()
);
create table if not exists public.nh_sites (
  id          text primary key,                 -- 현장 이름 '파주-CH'
  set_name    text,                             -- '골조 8002'
  span        text,                             -- '20261012-20261024'
  order_file  text,                             -- 발주서 파일 이름
  rows        jsonb not null default '[]',      -- [{name, set, order, out, sj}]
  sj          jsonb not null default '[]',      -- 납품송장 [{id, code, ymd, n, checked, signer, signed_at, opened_at}]
  updated_at  timestamptz default now()
);

-- ── 2. 규칙 — 로그인한 계정은 일단 통과(permissive), 실제로 누가 보는지는 아래 3번의 partner_only(restrictive)가 정함 ──
alter table public.nh_sales enable row level security;
alter table public.nh_docs  enable row level security;
alter table public.nh_sites enable row level security;
drop policy if exists nh_auth on public.nh_sales;
create policy nh_auth on public.nh_sales for all to authenticated using (true) with check (true);
drop policy if exists nh_auth on public.nh_docs;
create policy nh_auth on public.nh_docs  for all to authenticated using (true) with check (true);
drop policy if exists nh_auth on public.nh_sites;
create policy nh_auth on public.nh_sites for all to authenticated using (true) with check (true);

-- ── 3. 거래처 표로 적고 모든 표 규칙 다시 (보안 1단계의 lock_tables) ──
insert into public.partner_tables (tbl, partner, partner_write) values
  ('nh_sales', '뉴하우징', false),
  ('nh_sites', '뉴하우징', false),
  ('nh_docs',  '뉴하우징', true)
on conflict (tbl) do update set partner = excluded.partner, partner_write = excluded.partner_write;
select public.lock_tables();

-- ── 4. 공간제작소 계정 격리 다시 (2026-10-23-gonggan-lockdown.sql — 새 표가 생겼으니) ──
--   space1234 는 공간제작소 표(gonggan_sales · gonggan_docs) 말고는 아무 표도 못 봄 — 뉴하우징 표 포함
do $$
declare t text;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' and c.relname not in ('gonggan_sales', 'gonggan_docs')
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists no_gonggan_acct on public.%I', t);
    execute format($p$create policy no_gonggan_acct on public.%I as restrictive for all to authenticated
      using (coalesce(auth.jwt() ->> 'email', '') <> 'space1234@hometraders.local')
      with check (coalesce(auth.jwt() ->> 'email', '') <> 'space1234@hometraders.local')$p$, t);
  end loop;
end $$;

-- ── 5. 뉴하우징 클라이언트 계정 ──
--   Supabase › Authentication › Users › Add user 로 아이디 newhousing@hometraders.local (비밀번호 = 로그인 코드) 를 만든 뒤 이 파일을 다시 실행
insert into public.partner_accounts (uid, partner, login, role)
  select id, '뉴하우징', split_part(email, '@', 1), 'view' from auth.users where email = 'newhousing@hometraders.local'
on conflict (uid) do update set partner = excluded.partner, role = excluded.role;
delete from public.staff_accounts s using public.partner_accounts p where s.uid = p.uid;   -- 거래처 계정은 직원 명단에서 빠짐

-- ── 6. 결과 — 표마다 규칙 · 뉴하우징 계정 ──
select 'table' as kind, c.relname as name,
       string_agg(q.policyname, ', ' order by q.policyname) as policies
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  left join pg_policies q on q.schemaname = 'public' and q.tablename = c.relname
 where n.nspname = 'public' and c.relname in ('nh_sales', 'nh_docs', 'nh_sites', 'gonggan_sales', 'gonggan_docs')
 group by c.relname
union all
select 'partner:' || partner || ':' || role, login, null from public.partner_accounts
order by 1, 2;
