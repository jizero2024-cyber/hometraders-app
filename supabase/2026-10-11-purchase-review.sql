-- 구매 확인 목록 (ERP 🔔 알림) — 2026-10-11
-- 스밭비서가 2027 날짜로 넣은 전표(2026 누락 후보 등)를 대표가 ERP에서 보고 판단 → 스밭비서가 읽어 2026 으로 입력·정리
-- 직원 계정(@hometraders.local)만 읽고 씀. 통화 원문·금액이 들어가므로 공개 금지.
create table if not exists public.purchase_review (
  id          text primary key,
  kind        text not null default '2026 누락',          -- 2026 누락 / 확인 필요 / 2026 고칠 것
  status      text not null default '확인 전',            -- 확인 전 / 판단 완료 / 2026 입력완료 / 제외 / 보류
  vendor      text not null,
  doc_date    date,
  amount      bigint,
  slip_nos    text[] default '{}',                        -- 스밭비서가 넣은 2027 전표번호
  sort        int default 0,
  data        jsonb not null default '{}'::jsonb,         -- lines·why·sources·calls·title·price_flag
  decision    text,                                       -- 맞음 / 고쳐서 / 단가 오류 / 누락 아님 / 보류
  memo        text,
  fix         jsonb,                                      -- 고칠 값 {qty, price, spec}
  decided_by  text,
  decided_at  timestamptz,
  result      text,                                       -- 스밭비서 처리 결과 (예: 2026 입력 20260819-7)
  updated_at  timestamptz default now()
);
alter table public.purchase_review enable row level security;
drop policy if exists purchase_review_staff on public.purchase_review;
create policy purchase_review_staff on public.purchase_review
  for all to authenticated
  using ((auth.jwt() ->> 'email') like '%@hometraders.local')
  with check ((auth.jwt() ->> 'email') like '%@hometraders.local');
create index if not exists purchase_review_status_idx on public.purchase_review (status, sort);
