-- 보안 1단계 확인 — Supabase SQL 창에서 실행 (아무것도 안 바꿈, 끝에 rollback)
--   맨 위 아이디를 바꿔 가며 실행: 공간 계정 · 직원 계정
--   공간 계정: gonggan_docs · gonggan_sales 만 숫자, 나머지 0 (보안 1단계 SQL 전에는 다른 표도 숫자가 나옴)
--   직원 계정: 전부 숫자
begin;
select set_config('request.jwt.claims',
  json_build_object('role', 'authenticated', 'sub', (select id from auth.users where email = 'space1225@hometraders.local'))::text, true);
set local role authenticated;
select 'partners' as t, count(*) from public.partners
union all select 'items', count(*) from public.items
union all select 'shipments', count(*) from public.shipments
union all select 'quotes', count(*) from public.quotes
union all select 'prev_prices', count(*) from public.prev_prices
union all select 'site_inbox', count(*) from public.site_inbox
union all select 'fare_unpaid', count(*) from public.fare_unpaid
union all select 'slip_rows', count(*) from public.slip_rows
union all select 'gonggan_sales', count(*) from public.gonggan_sales
union all select 'gonggan_docs', count(*) from public.gonggan_docs;
rollback;
