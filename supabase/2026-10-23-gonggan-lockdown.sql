-- 공간제작소 계정(space1234) 잠금 — 2026-10-23 대표 "우리 업무툴로 절대 연동되면 안 돼"
-- 공간제작소 명세 표(gonggan_sales · gonggan_docs) 말고는 모든 표에서 막음 (RESTRICTIVE = 다른 허용 규칙이 있어도 이 조건을 꼭 통과해야 함).
-- 직원 계정은 그대로. 새 표를 만들면 여기 이름을 더해 다시 돌릴 것.
do $$
declare t text;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' and c.relname not in ('gonggan_sales', 'gonggan_docs')
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists no_gonggan_acct on public.%I', t);
    execute format($p$create policy no_gonggan_acct on public.%I as restrictive for all to authenticated
      using (coalesce(auth.jwt() ->> 'email', '') <> 'space1234@hometraders.local')
      with check (coalesce(auth.jwt() ->> 'email', '') <> 'space1234@hometraders.local')$p$, t);
  end loop;
end $$;
