-- 출고 건을 운영 DB 로 (2026-10-28 밤 대표 "데이터베이스 먼저 하기로 했잖아") — 설계: 6_메뉴얼/출고건_DB기준_설계_261028.md
--   이 파일 하나만 Supabase SQL 창에 붙여 넣고 실행. 여러 번 돌려도 됨. 직원만 봄 (보안 1단계 lock_tables).
--   대표 "출고일보 안 맞을 수도 있어 지금" → 칸마다 어디서 왔는지(src) 남김:
--     ecount = 이카운트 전표 (기준) · ieum = 이음 배차안내 · site = 사이트에서 누름 · board = 출고일보에서 옮김(확인 전) · staff = 직원·대표가 고침

-- 출고 건 (출고번호 하나)
create table if not exists public.ship_case (
  no          text primary key,                 -- 출고번호 (한 번 정하면 안 바뀜)
  partner     text,                             -- 판매처
  site        text,                             -- 현장
  ship_date   text,                             -- 출고일 MM/DD (모르면 '미정')
  req         text,                             -- 요청 (도착 시각 원문)
  status      text,                             -- 견적·예정·진행중·완료·취소
  disp        text,                             -- 배차 상태
  vehicle     text,                             -- 차량·운임
  todo        text,                             -- 할 일
  src         jsonb not null default '{}',      -- 칸 → 출처 {"vehicle":"ieum","status":"board"}
  checked     boolean not null default false,   -- 직원·대표가 맞다고 확인
  checked_by  text,
  updated_at  timestamptz default now()
);

-- 줄 (판매·구매·운반비)
create table if not exists public.ship_line (
  key         text primary key,                 -- 줄 key (출고일보와 같음)
  no          text not null references public.ship_case(no) on update cascade on delete cascade,
  io          text not null,                    -- 판매 / 구매 / 운반비 / 반품
  party       text,                             -- 거래처
  items       text,                             -- 품목·수량
  spec        text,                             -- 이카운트 규격 꼬리표
  entry       text,                             -- 입력 / 미입력 / 착불 / —
  src         text not null default 'board',
  updated_at  timestamptz default now()
);
create index if not exists ship_line_no on public.ship_line (no);

-- 이카운트 전표 연결 (이카운트가 기준 — 여기는 어느 출고 건인지만)
create table if not exists public.ship_slip (
  slip        text not null,                    -- 20261028-5
  io          text not null,                    -- 판매 / 구매 / 운반비
  no          text not null,                    -- 출고번호
  party       text,
  how         text,                             -- push(넣으며) · tag(꼬리표) · pick(사람이 고름) · judge(AI 판단)
  by_who      text,
  note        text,
  at          timestamptz default now(),
  primary key (slip, io)
);
create index if not exists ship_slip_no on public.ship_slip (no);

-- 근거 (이음 배차안내 · 통화 · 카톡)
create table if not exists public.ship_evidence (
  id          text primary key,                 -- 메시지 id
  no          text,
  src         text,                             -- ieum · call · kakao · sms · tg
  at          text,
  who         text,
  summary     text,
  body        text
);
create index if not exists ship_evidence_no on public.ship_evidence (no);

-- 보안: 직원 허용 규칙 + 새 표 전부 직원만 (거래처 계정 0건) — lock_tables 의 staff_only 는 '막는' 규칙이라 허용 규칙이 따로 있어야 읽고 씀
do $$ declare t text; begin
  foreach t in array array['ship_case', 'ship_line', 'ship_slip', 'ship_evidence'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists staff_all on public.%I', t);
    execute format('create policy staff_all on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;
select public.lock_tables();

-- 확인: 표 4개가 staff_only 규칙으로 나오면 됨
select tablename, policyname from pg_policies where schemaname = 'public' and tablename like 'ship\_%' order by 1;
