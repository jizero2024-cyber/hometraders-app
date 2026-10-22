-- 출고일보 전표 링크 → 거래명세표 (대화 화면) — 2026-10-22
-- 맥 도우미가 출고일보 전표 폴더의 이카운트 전표 PDF 를 읽어 줄을 올려 두면, 화면은 맥 도우미 없이 링크(드라이브 번호)로 찾아 명세표를 만든다.
-- 직원 계정(@hometraders.local)만 읽고 씀. 거래처·금액이 들어가므로 공개 금지.
create table if not exists public.slip_rows (
  drive_id    text primary key,                            -- https://drive.google.com/file/d/<drive_id>/view
  kind        text not null,                               -- 판매 / 구매
  slip        text not null,                               -- 20261021-1
  partner     text,
  file        text,                                        -- 판매전표_20261021-1_ecount.pdf
  rows        jsonb not null default '[]'::jsonb,          -- 판매전표 엑셀 꼴 줄 [일자, 순번, 거래처명, 품목명, 규격, 수량, 단가, 공급가액, 부가세]
  warn        text default '',
  updated_at  timestamptz default now()
);
alter table public.slip_rows enable row level security;
drop policy if exists slip_rows_staff on public.slip_rows;
create policy slip_rows_staff on public.slip_rows
  for all to authenticated
  using ((auth.jwt() ->> 'email') like '%@hometraders.local')
  with check ((auth.jwt() ->> 'email') like '%@hometraders.local');
