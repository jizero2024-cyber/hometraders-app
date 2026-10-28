-- 보안 1단계 — 직원 명단에 있는 계정만 우리 업무 표를 봄 (2026-10-25 계획, 10/28 대표 "보안하자")
--   이 파일 하나만 Supabase SQL 창에 붙여 넣고 실행. 여러 번 돌려도 됨.
--   2026-10-25-staff-allowlist.sql · 2026-10-27-e-songjang-all.sql 은 이 파일에 들어 있음 (따로 안 돌려도 됨).
--
--   직원 계정      staff_accounts 에 있는 계정 → 모든 표
--   거래처 계정    partner_accounts (거래처 이름 · 권한 edit/view) → partner_tables 에 그 거래처로 적힌 표만
--   그 밖의 계정   아무 표도 못 봄 (새로 만든 계정은 처음부터 막힘)
--   로그인 안 한 사람  표는 못 봄. 전자 송장 링크는 아래 함수로 그 한 장만.

-- ── 1. 명단 표 ──
create table if not exists public.staff_accounts (uid uuid primary key references auth.users(id) on delete cascade, login text, added_at timestamptz default now());
create table if not exists public.partner_accounts (uid uuid primary key references auth.users(id) on delete cascade, partner text not null, login text, added_at timestamptz default now());
alter table public.partner_accounts add column if not exists role text not null default 'view';   -- edit = 고치기·넣기 다 됨, view = 수정요청·기안 확정만 (화면에서 막음)
create table if not exists public.partner_tables (tbl text primary key, partner text not null, partner_write boolean not null default true);   -- 거래처 계정이 볼 수 있는 표
alter table public.staff_accounts enable row level security;
alter table public.partner_accounts enable row level security;
alter table public.partner_tables enable row level security;

create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.staff_accounts where uid = auth.uid()) $$;
create or replace function public.my_partner() returns text language sql stable security definer set search_path = public as
$$ select partner from public.partner_accounts where uid = auth.uid() $$;
-- 화면이 로그인한 계정의 권한을 물을 때 (직원인지 · 어느 거래처 · edit/view)
create or replace function public.my_access() returns json language sql stable security definer set search_path = public as
$$ select json_build_object('staff', public.is_staff(), 'partner', p.partner, 'role', p.role)
     from (select 1) x left join public.partner_accounts p on p.uid = auth.uid() $$;
revoke execute on function public.is_staff() from anon, public;
revoke execute on function public.my_partner() from anon, public;
revoke execute on function public.my_access() from anon, public;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.my_partner() to authenticated;
grant execute on function public.my_access() to authenticated;

-- ── 2. 거래처 계정 ──
-- 공간제작소: space1234 = 현구 대리님(view). space1225 는 우리 직원이 쓰는 계정 → 직원 명단 (10/28 대표 "space1225도 직원처럼 써야 해, 우리 직원만 씀")
insert into public.partner_accounts (uid, partner, login, role)
  select id, '공간제작소', split_part(email, '@', 1), 'view'
  from auth.users where email = 'space1234@hometraders.local'
on conflict (uid) do update set partner = excluded.partner, role = excluded.role;
delete from public.partner_accounts where login = 'space1225';
-- 뉴하우징 (10/28 대표: 공간제작소처럼 직원 계정 / 클라이언트 계정 따로) — 클라이언트 계정을 만들면 아래 두 줄의 '--' 를 지우고 아이디를 넣어 실행
-- insert into public.partner_accounts (uid, partner, login, role)
--   select id, '뉴하우징', split_part(email, '@', 1), 'view' from auth.users where email = '<아이디>@hometraders.local' on conflict (uid) do nothing;

-- 거래처가 볼 수 있는 표 (partner_write = 거래처 계정이 고칠 수도 있음)
insert into public.partner_tables (tbl, partner, partner_write) values
  ('gonggan_sales', '공간제작소', false),
  ('gonggan_docs',  '공간제작소', true)
on conflict (tbl) do update set partner = excluded.partner, partner_write = excluded.partner_write;
-- 뉴하우징 표가 생기면: insert into public.partner_tables values ('<표 이름>', '뉴하우징', false); 하고 이 파일을 다시 실행

-- ── 3. 직원 명단 ──
-- 지금 있는 계정 중 거래처 계정(위 partner_accounts)과 space… 를 뺀 전부. 맨 아래 결과에 직원이 아닌 계정이 보이면
--   delete from public.staff_accounts where login = '<그 아이디>';
insert into public.staff_accounts (uid, login)
  select u.id, split_part(u.email, '@', 1) from auth.users u
  where u.email not like 'space%'
    and not exists (select 1 from public.partner_accounts p where p.uid = u.id)
on conflict (uid) do nothing;
insert into public.staff_accounts (uid, login)
  select id, 'space1225' from auth.users where email = 'space1225@hometraders.local'
on conflict (uid) do nothing;
delete from public.staff_accounts s using public.partner_accounts p where s.uid = p.uid;   -- 거래처 계정은 직원 명단에서 빠짐

-- 명단 표 자체: 직원만 읽음, 고치기는 SQL 창으로만
drop policy if exists staff_read on public.staff_accounts;
create policy staff_read on public.staff_accounts for select to authenticated using (public.is_staff());
drop policy if exists staff_read on public.partner_accounts;
create policy staff_read on public.partner_accounts for select to authenticated using (public.is_staff());
drop policy if exists staff_read on public.partner_tables;
create policy staff_read on public.partner_tables for select to authenticated using (public.is_staff());

-- ── 4. 전자 송장 (2026-10-27-e-songjang-all.sql 과 같음, 직원 규칙만 is_staff 로) ──
create table if not exists public.e_songjang (
  id          text primary key,
  partner     text,
  site        text,
  ymd         text,
  items       jsonb not null default '[]',
  checks      jsonb not null default '[]',
  sign        text,
  signer      text,
  signed_at   timestamptz,
  created_by  text,
  created_at  timestamptz default now()
);
alter table public.e_songjang add column if not exists code           text;
alter table public.e_songjang add column if not exists opened_at      timestamptz;
alter table public.e_songjang add column if not exists last_opened_at timestamptz;
alter table public.e_songjang add column if not exists open_count     int not null default 0;
alter table public.e_songjang add column if not exists checked_at     timestamptz;
create unique index if not exists e_songjang_code on public.e_songjang (code);
alter table public.e_songjang enable row level security;
drop policy if exists staff_all on public.e_songjang;
create policy staff_all on public.e_songjang for all to authenticated using (public.is_staff()) with check (public.is_staff());

create or replace function public.songjang_id(k text) returns text
language sql stable security definer set search_path = public as $$
  select id from public.e_songjang
   where (length(k) >= 20 and id = k) or (length(k) = 6 and code = upper(k))
   limit 1
$$;
drop function if exists public.songjang_get(text);
create or replace function public.songjang_get(k text, peek boolean default false) returns json
language plpgsql security definer set search_path = public as $$
declare i text := public.songjang_id(k); r json;
begin
  if i is null then return null; end if;
  if not peek then
    update public.e_songjang set opened_at = coalesce(opened_at, now()), last_opened_at = now(), open_count = open_count + 1 where id = i;
  end if;
  select json_build_object('partner', partner, 'site', site, 'ymd', ymd, 'items', items, 'checks', checks,
                           'sign', sign, 'signer', signer, 'signed_at', signed_at)
    into r from public.e_songjang where id = i;
  return r;
end $$;
create or replace function public.songjang_check(k text, c jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare i text := public.songjang_id(k);
begin
  if i is null or jsonb_typeof(c) <> 'array' or jsonb_array_length(c) > 500 then return 'bad'; end if;
  update public.e_songjang set checks = c, checked_at = now() where id = i and signed_at is null;
  return case when found then 'ok' else 'already' end;
end $$;
create or replace function public.songjang_sign(k text, c jsonb, s text, who text) returns text
language plpgsql security definer set search_path = public as $$
declare i text := public.songjang_id(k);
begin
  if i is null or s is null or length(s) > 600000 or coalesce(trim(who), '') = '' then return 'bad'; end if;
  update public.e_songjang set checks = coalesce(c, '[]'::jsonb), sign = s, signer = left(trim(who), 40), signed_at = now()
   where id = i and signed_at is null;
  if not found then return 'already'; end if;
  return 'ok';
end $$;
revoke execute on function public.songjang_id(text) from anon, authenticated, public;
grant execute on function public.songjang_get(text, boolean) to anon, authenticated;
grant execute on function public.songjang_check(text, jsonb) to anon, authenticated;
grant execute on function public.songjang_sign(text, jsonb, text, text) to anon, authenticated;

-- ── 5. 모든 표에 규칙 ──
-- 거래처 표(partner_tables): 직원 또는 그 거래처 계정만. 그 밖의 표: 직원만. 로그인 안 한 사람(anon)도 같이 막힘.
-- (예전 no_gonggan_acct · gonggan_closed 는 이걸로 대신)
create or replace function public.lock_tables() returns void language plpgsql set search_path = public as $$
declare t text; p record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('r', 'p')
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists no_gonggan_acct on public.%I', t);
    execute format('drop policy if exists gonggan_closed on public.%I', t);
    execute format('drop policy if exists staff_only on public.%I', t);
    execute format('drop policy if exists partner_only on public.%I', t);
    select * into p from public.partner_tables where tbl = t;
    if t in ('staff_accounts', 'partner_accounts', 'partner_tables') then
      null;   -- 위 staff_read 규칙 (고치기는 SQL 창으로만)
    elsif found then
      execute format('create policy partner_only on public.%I as restrictive for all to public using (public.is_staff() or public.my_partner() = %L) with check (public.is_staff() or (%L and public.my_partner() = %L))',
                     t, p.partner, p.partner_write, p.partner);
    else
      execute format('create policy staff_only on public.%I as restrictive for all to public using (public.is_staff()) with check (public.is_staff())', t);
    end if;
  end loop;
end $$;
revoke execute on function public.lock_tables() from anon, authenticated, public;
select public.lock_tables();

-- 새로 만드는 표도 바로 '직원만' (안 되는 환경이면 알림만 나오고 넘어감 — 그땐 새 표를 만든 뒤 이 파일을 다시 실행)
create or replace function public.lock_new_table() returns event_trigger language plpgsql as $$
declare r record;
begin
  for r in select * from pg_event_trigger_ddl_commands() where command_tag = 'CREATE TABLE' and schema_name = 'public' loop
    begin
      execute format('alter table %s enable row level security', r.object_identity);
      execute format('create policy staff_only on %s as restrictive for all to public using (public.is_staff()) with check (public.is_staff())', r.object_identity);
    exception when others then raise notice 'lock_new_table: %', sqlerrm;
    end;
  end loop;
end $$;
do $$ begin
  drop event trigger if exists lock_new_table;
  create event trigger lock_new_table on ddl_command_end when tag in ('CREATE TABLE') execute function public.lock_new_table();
exception when others then raise notice '새 표 자동 잠금은 이 환경에서 안 됨: %', sqlerrm;
end $$;

-- ── 6. 결과 ──
-- 맨 아래 표: kind 가 staff 인 줄 = 직원 명단 (직원이 아닌 아이디가 있으면 3번의 delete 로 빼기)
--             partner:… = 거래처 계정 · 권한
--             (규칙 없음) 으로 나오는 표가 있으면 이 파일을 다시 실행
select kind, login from (
  select 'staff' as kind, login from public.staff_accounts
  union all select 'partner:' || partner || ':' || role, login from public.partner_accounts
  union all select '(규칙 없음)', c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
      and c.relname not in ('staff_accounts', 'partner_accounts', 'partner_tables')
      and not exists (select 1 from pg_policies q where q.schemaname = 'public' and q.tablename = c.relname and q.policyname in ('staff_only', 'partner_only'))
) z order by 1, 2;
