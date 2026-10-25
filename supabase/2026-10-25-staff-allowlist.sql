-- 보안 1단계 — '막을 계정 목록' 대신 '들어올 수 있는 직원 목록' (2026-10-25 대표 "보안 체계, 거래처마다 코드, 업무툴은 절대 공개 안 되게")
--   직원 명단(staff_accounts)에 있는 계정만 우리 업무 표를 봄. 새로 생기는 계정(거래처 코드 등)은 처음부터 아무것도 못 봄.
--   거래처 계정은 partner_accounts 에 적고, 자기 거래처 표(gonggan_sales · gonggan_docs)만 봄.
--   새 표를 만들면 맨 아래 do 블록을 다시 돌릴 것 (staff_only 를 새 표에도 붙임).

create table if not exists public.staff_accounts (uid uuid primary key references auth.users(id) on delete cascade, login text, added_at timestamptz default now());
create table if not exists public.partner_accounts (uid uuid primary key references auth.users(id) on delete cascade, partner text not null, login text, added_at timestamptz default now());
alter table public.staff_accounts enable row level security;
alter table public.partner_accounts enable row level security;

create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.staff_accounts where uid = auth.uid()) $$;
create or replace function public.my_partner() returns text language sql stable security definer set search_path = public as
$$ select partner from public.partner_accounts where uid = auth.uid() $$;

-- 직원 명단: 지금 있는 hometraders.local 계정 중 공간제작소(space…) 빼고 전부 — 아래 select 결과를 보고 직원이 아닌 계정이 있으면 지울 것
insert into public.staff_accounts (uid, login)
  select id, split_part(email, '@', 1) from auth.users
  where email like '%@hometraders.local' and email not like 'space%'
on conflict do nothing;
insert into public.partner_accounts (uid, partner, login)
  select id, '공간제작소', split_part(email, '@', 1) from auth.users where email = 'space1234@hometraders.local'
on conflict do nothing;

-- 명단 표 자체: 직원만 읽음, 고치기는 SQL 로만
drop policy if exists staff_read on public.staff_accounts;
create policy staff_read on public.staff_accounts for select to authenticated using (public.is_staff());
drop policy if exists staff_read on public.partner_accounts;
create policy staff_read on public.partner_accounts for select to authenticated using (public.is_staff());

-- 거래처 표: 직원 또는 그 거래처 계정만
drop policy if exists gonggan_closed on public.gonggan_sales;
drop policy if exists gonggan_closed on public.gonggan_docs;
drop policy if exists partner_only on public.gonggan_sales;
create policy partner_only on public.gonggan_sales as restrictive for all to authenticated
  using (public.is_staff() or public.my_partner() = '공간제작소') with check (public.is_staff());
drop policy if exists partner_only on public.gonggan_docs;
create policy partner_only on public.gonggan_docs as restrictive for all to authenticated
  using (public.is_staff() or public.my_partner() = '공간제작소') with check (public.is_staff() or public.my_partner() = '공간제작소');

-- 그 밖의 모든 표: 직원만 (예전 no_gonggan_acct 는 이걸로 대신)
do $$
declare t text;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r'
             and c.relname not in ('gonggan_sales', 'gonggan_docs', 'staff_accounts', 'partner_accounts')
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists staff_only on public.%I', t);
    execute format('create policy staff_only on public.%I as restrictive for all to authenticated using (public.is_staff()) with check (public.is_staff())', t);
    execute format('drop policy if exists no_gonggan_acct on public.%I', t);
  end loop;
end $$;

-- 확인: 직원 명단 · 거래처 명단
select 'staff' as kind, login from public.staff_accounts union all select 'partner:' || partner, login from public.partner_accounts order by 1, 2;
