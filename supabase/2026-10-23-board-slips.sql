-- 출고일보 번호 → 판매전표 번호 (2026-10-23) — 맥 도우미(site_home.py)가 출고일보 입력 칸에서 올림. 사이트 명세표 칸에 '공간제작소-261020-01' 로 넣으면 찾음
create table if not exists public.board_slips (no text primary key, slips text[] not null default '{}', partner text, ymd text, updated_at timestamptz default now());
alter table public.board_slips enable row level security;
drop policy if exists board_slips_staff on public.board_slips;
create policy board_slips_staff on public.board_slips for all to authenticated using ((auth.jwt() ->> 'email') like '%@hometraders.local') with check ((auth.jwt() ->> 'email') like '%@hometraders.local');
drop policy if exists no_gonggan_acct on public.board_slips;   -- 공간제작소 계정 차단 (2026-10-23-gonggan-lockdown.sql)
create policy no_gonggan_acct on public.board_slips as restrictive for all to authenticated using (coalesce(auth.jwt() ->> 'email', '') <> 'space1234@hometraders.local') with check (coalesce(auth.jwt() ->> 'email', '') <> 'space1234@hometraders.local');
