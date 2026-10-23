-- 공간제작소 BMS (거래명세표 · 세금계산서 · 기안) — 2026-10-23
-- gonggan_sales: 이카운트 판매현황의 공간제작소 판매 줄 (맥 도우미가 올림). 화면이 거래명세표 변환기(js/stmt.js)로 장마다 나눔.
-- gonggan_docs : 거래명세표 한 장마다 상태 · 세금계산서 · 수정요청 사유 · 고친 명세표 (화면에서 씀).
-- 직원 계정(@hometraders.local)만 읽고 씀 — 현구 과장님도 직원 계정이 있어야 함.
create table if not exists public.gonggan_sales (
  id          text primary key,                 -- '20261012-1|3' (전표|줄 순번)
  ymd         text not null,                    -- '20261012'
  slip        text not null,                    -- '2026/10/12 -1'
  partner     text not null,
  name        text not null,                    -- 품목명(규격) 그대로 — 현장 태그 [1012/공간/울산/서생] 포함
  qty         numeric,
  price       numeric,
  supply      numeric,
  vat         numeric,
  biz         text not null default 'homt',     -- homt / ace
  updated_at  timestamptz default now()
);
create table if not exists public.gonggan_docs (
  id          text primary key,                 -- 화면이 만든 거래명세표 한 장의 키
  biz         text not null default 'homt',
  status      text,                             -- null(세금계산서 유무로 결재전/기안중) · 수정요청 · 최종완료
  tax_data    text,                             -- 세금계산서 그림/PDF (data URL)
  tax_name    text,
  stmt_data   text,                             -- 연필로 바꾼 거래명세표 (data URL, 없으면 자동 생성본)
  reason      text,                             -- 수정요청 사유
  drafted_at  timestamptz,
  updated_by  text,
  updated_at  timestamptz default now()
);
alter table public.gonggan_sales enable row level security;
alter table public.gonggan_docs enable row level security;
drop policy if exists gonggan_sales_staff on public.gonggan_sales;
create policy gonggan_sales_staff on public.gonggan_sales for all to authenticated
  using ((auth.jwt() ->> 'email') like '%@hometraders.local') with check ((auth.jwt() ->> 'email') like '%@hometraders.local');
drop policy if exists gonggan_docs_staff on public.gonggan_docs;
create policy gonggan_docs_staff on public.gonggan_docs for all to authenticated
  using ((auth.jwt() ->> 'email') like '%@hometraders.local') with check ((auth.jwt() ->> 'email') like '%@hometraders.local');
alter table public.gonggan_docs add column if not exists tax_no text;   -- 세금계산서 승인번호 (2026-10-23, 화면이 PDF 글자·그림 글자 인식으로 찾음)
