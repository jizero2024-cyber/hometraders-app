-- 전자 송장 — 한 번에 실행 (2026-10-27 대표 "짧은 코드 링크 + 발행한 송장 확인 목록, SQL 한 번에")
--   ※ 2026-10-28-security-step1.sql 에 이 내용이 들어 있음 — 그 파일을 돌렸으면 이 파일은 안 돌려도 됨
--   이 파일 하나만 Supabase SQL 창에서 실행하면 됨 (2026-10-26-e-songjang.sql 을 이미 돌렸어도 다시 돌려도 됨)
--   링크: https://erp.hometraders.co.kr/s/<코드 6자리>  (예전 긴 링크 /songjang/?k=<id> 도 그대로 열림)
--   받는 분은 로그인 없이 링크로만 봄 → 표를 직접 못 읽고, 아래 함수로 그 한 장만 읽고·체크하고·서명함.

create table if not exists public.e_songjang (
  id          text primary key,
  partner     text,
  site        text,
  ymd         text,
  items       jsonb not null default '[]',   -- [{name, qty, unit}]
  checks      jsonb not null default '[]',   -- 체크한 줄 번호 [0, 2, …]
  sign        text,                          -- 서명 그림 (data URL)
  signer      text,                          -- 받는 분 성함
  signed_at   timestamptz,
  created_by  text,
  created_at  timestamptz default now()
);
alter table public.e_songjang add column if not exists code           text;          -- 짧은 링크 코드 (대문자·숫자 6자리)
alter table public.e_songjang add column if not exists opened_at      timestamptz;   -- 처음 열어 본 때
alter table public.e_songjang add column if not exists last_opened_at timestamptz;
alter table public.e_songjang add column if not exists open_count     int not null default 0;
alter table public.e_songjang add column if not exists checked_at     timestamptz;   -- 마지막으로 체크한 때 (서명 전)
create unique index if not exists e_songjang_code on public.e_songjang (code);
alter table public.e_songjang enable row level security;

-- 직원만 표를 직접 읽고 씀 (공간제작소 계정 space… 은 못 봄)
drop policy if exists staff_all on public.e_songjang;
create policy staff_all on public.e_songjang for all to authenticated
  using (coalesce(auth.jwt() ->> 'email', '') not like 'space%')
  with check (coalesce(auth.jwt() ->> 'email', '') not like 'space%');

-- 링크 글자 → 그 장 id (긴 id 20자 이상 또는 코드 6자리)
create or replace function public.songjang_id(k text) returns text
language sql stable security definer set search_path = public as $$
  select id from public.e_songjang
   where (length(k) >= 20 and id = k) or (length(k) = 6 and code = upper(k))
   limit 1
$$;

-- 링크로 한 장 읽기 — 받는 분이 열면 '열어 봄' 기록 (peek = 우리 직원이 미리보기로 연 것은 기록 안 함)
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

-- 서명 전 체크 저장 (우리 목록에 '체크 4/6' 으로 보임)
create or replace function public.songjang_check(k text, c jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare i text := public.songjang_id(k);
begin
  if i is null or jsonb_typeof(c) <> 'array' or jsonb_array_length(c) > 500 then return 'bad'; end if;
  update public.e_songjang set checks = c, checked_at = now() where id = i and signed_at is null;
  return case when found then 'ok' else 'already' end;
end $$;

-- 링크로 서명 (한 번만 — 서명된 장은 다시 못 바꿈)
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
