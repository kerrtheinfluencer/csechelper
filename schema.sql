-- =========================================================
-- CXC PAST PAPERS — Supabase Schema
-- Run this in your Supabase SQL Editor
-- =========================================================

-- SUBJECTS table
create table if not exists subjects (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  emoji     text default '📄',
  level     text not null check (level in ('CSEC', 'CAPE')),
  created_at timestamptz default now()
);

-- PAPERS table
create table if not exists papers (
  id              uuid primary key default gen_random_uuid(),
  subject_id      uuid references subjects(id) on delete cascade,
  title           text not null,
  year            int not null,
  paper_number    int,          -- 1, 2, 3 etc.
  is_mark_scheme  boolean default false,
  file_url        text,         -- Public URL (Google Drive, Supabase Storage, etc.)
  downloads       int default 0,
  created_at      timestamptz default now()
);

-- INDEX for fast subject lookups
create index if not exists papers_subject_idx on papers(subject_id);
create index if not exists papers_year_idx    on papers(year);

-- RPC to increment downloads (avoids direct update from client)
create or replace function increment_downloads(paper_id uuid)
returns void language sql as $$
  update papers set downloads = downloads + 1 where id = paper_id;
$$;

-- Enable Row Level Security (read-only for anon users)
alter table subjects enable row level security;
alter table papers    enable row level security;

create policy "Public read subjects" on subjects for select using (true);
create policy "Public read papers"   on papers   for select using (true);

-- =========================================================
-- SEED DATA — 5 subjects to start
-- =========================================================
insert into subjects (name, emoji, level) values
  ('Mathematics',      '🔢', 'CSEC'),
  ('English A',        '✍️', 'CSEC'),
  ('Biology',          '🧬', 'CSEC'),
  ('Principles of Accounts', '📊', 'CSEC'),
  ('History',          '🏛️', 'CSEC'),
  ('Physics',          '⚛️', 'CSEC'),
  ('Chemistry',        '🧪', 'CSEC'),
  ('Geography',        '🌍', 'CSEC'),
  ('Information Technology', '💻', 'CSEC'),
  ('Spanish',          '🇪🇸', 'CSEC'),
  ('Economics',        '📈', 'CAPE'),
  ('Communication Studies', '💬', 'CAPE')
on conflict do nothing;

-- Example paper row (replace file_url with your actual PDF link)
-- insert into papers (subject_id, title, year, paper_number, is_mark_scheme, file_url)
-- values (
--   (select id from subjects where name = 'Mathematics' limit 1),
--   'CSEC Mathematics Paper 1 2023',
--   2023, 1, false,
--   'https://your-storage-url/csec-maths-2023-p1.pdf'
-- );
