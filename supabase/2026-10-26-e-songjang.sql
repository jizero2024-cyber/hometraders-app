-- 전자 송장 (2026-10-26 대표 — 휴대폰으로 품목 체크 + 서명)
--   업무툴에서 직원이 만들면 id(맞히기 어려운 긴 글자) 가 링크가 됨: https://erp.hometraders.co.kr/songjang/?k=<id>
--   받는 분은 로그인 없이 링크로만 봄 → 표를 직접 못 읽고, 아래 두 함수로 그 한 장만 읽고 서명함.

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
alter table public.e_songjang enable row level security;

-- 직원만 표를 직접 읽고 씀 (공간제작소 계정 space… 은 못 봄)
drop policy if exists staff_all on public.e_songjang;
create policy staff_all on public.e_songjang for all to authenticated
  using (coalesce(auth.jwt() ->> 'email', '') not like 'space%')
  with check (coalesce(auth.jwt() ->> 'email', '') not like 'space%');

-- 링크로 한 장 읽기
create or replace function public.songjang_get(k text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('partner', partner, 'site', site, 'ymd', ymd, 'items', items, 'checks', checks,
                           'sign', sign, 'signer', signer, 'signed_at', signed_at)
  from public.e_songjang where id = k and length(k) >= 20
$$;

-- 링크로 서명 (한 번만 — 서명된 장은 다시 못 바꿈)
create or replace function public.songjang_sign(k text, c jsonb, s text, who text) returns text
language plpgsql security definer set search_path = public as $$
begin
  if length(k) < 20 or s is null or length(s) > 600000 or coalesce(trim(who), '') = '' then return 'bad'; end if;
  update public.e_songjang set checks = coalesce(c, '[]'::jsonb), sign = s, signer = left(trim(who), 40), signed_at = now()
   where id = k and signed_at is null;
  if not found then return 'already'; end if;
  return 'ok';
end $$;

grant execute on function public.songjang_get(text) to anon, authenticated;
grant execute on function public.songjang_sign(text, jsonb, text, text) to anon, authenticated;
