-- 새 첫 화면 (2026-10-23)
-- site_inbox : 첫 화면 '자료 넣기' 칸에 넣은 카톡 글·명세표 사진·PDF·엑셀. 맥 도우미가 받아 출고일보 업데이트 때 판매·구매입력.
-- fare_unpaid: 기사 운임 미송금 (출고일보 폴더 '기사_운임_미송금_정리' 엑셀 → 맥 도우미가 올림). 첫 화면 빨간 칸.
-- 직원 계정(@hometraders.local)만 — 공간제작소 계정(space1234)은 못 봄 (계좌번호가 있어서).
create table if not exists public.site_inbox (
  id          text primary key,                 -- 화면이 만든 키
  kind        text not null,                    -- text / file
  name        text,                             -- 파일 이름 (글이면 첫 줄)
  mime        text,
  data        text,                             -- 파일 (data URL)
  body        text,                             -- 붙여넣은 글
  status      text not null default 'wait',     -- wait(대기) · got(도우미가 받음) · done(입력함) · check(확인필요)
  note        text,                             -- 처리 결과 (전표번호·확인필요 사유)
  created_by  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create table if not exists public.fare_unpaid (
  id          text primary key,                 -- 연락처|건
  section     text,                             -- 바로 송금 · 먼저 받기 · 확인만
  sort        int,                              -- 엑셀 줄 순서
  urgent      text,                             -- 🔴 🟠 🟡 택배
  driver      text,
  phone       text,
  job         text,                             -- 날짜 · 구간
  amount      numeric,                          -- 보낼 금액 (부가세 포함, 모르면 null)
  bank        text,
  account     text,
  holder      text,
  todo        text,                             -- 계좌 없으면 먼저 할 것 (계좌 받기 등)
  note        text,                             -- 부가세 · 근거
  sent        boolean default false,            -- 화면에서 '보냄' 누름 → 도우미가 엑셀 보냄 칸에 O
  sent_by     text,
  sent_at     timestamptz,
  updated_at  timestamptz default now()
);
alter table public.site_inbox enable row level security;
alter table public.fare_unpaid enable row level security;
drop policy if exists site_inbox_staff on public.site_inbox;
create policy site_inbox_staff on public.site_inbox for all to authenticated
  using ((auth.jwt() ->> 'email') like '%@hometraders.local' and (auth.jwt() ->> 'email') <> 'space1234@hometraders.local')
  with check ((auth.jwt() ->> 'email') like '%@hometraders.local' and (auth.jwt() ->> 'email') <> 'space1234@hometraders.local');
drop policy if exists fare_unpaid_staff on public.fare_unpaid;
create policy fare_unpaid_staff on public.fare_unpaid for all to authenticated
  using ((auth.jwt() ->> 'email') like '%@hometraders.local' and (auth.jwt() ->> 'email') <> 'space1234@hometraders.local')
  with check ((auth.jwt() ->> 'email') like '%@hometraders.local' and (auth.jwt() ->> 'email') <> 'space1234@hometraders.local');
-- 표를 먼저 만든 뒤 칸을 더했을 때 (10/23)
alter table public.fare_unpaid add column if not exists section text;
alter table public.fare_unpaid add column if not exists sort int;
alter table public.fare_unpaid add column if not exists sent boolean default false;
alter table public.fare_unpaid add column if not exists sent_by text;
alter table public.fare_unpaid add column if not exists sent_at timestamptz;
