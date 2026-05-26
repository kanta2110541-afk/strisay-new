-- Striday DB Schema
-- Supabaseのダッシュボード > SQL Editor で実行してください

-- users テーブル
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  created_at timestamptz default now()
);
alter table public.users enable row level security;
create policy "自分のデータのみ参照" on public.users
  for all using (auth.uid() = id);

-- 新規ユーザー登録時に自動でusersに追加するトリガー
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- study_logs テーブル
create table if not exists public.study_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  vocabulary_id integer not null,
  is_correct boolean not null,
  response_time integer not null,
  created_at timestamptz default now()
);
alter table public.study_logs enable row level security;
create policy "自分のログのみ操作" on public.study_logs
  for all using (auth.uid() = user_id);
create index idx_study_logs_user_created on public.study_logs(user_id, created_at desc);
create index idx_study_logs_user_vocab on public.study_logs(user_id, vocabulary_id);

-- daily_stats テーブル
create table if not exists public.daily_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  study_date date not null,
  study_time integer default 0,
  correct_rate float default 0,
  word_count integer default 0,
  unique(user_id, study_date)
);
alter table public.daily_stats enable row level security;
create policy "自分のデータのみ操作" on public.daily_stats
  for all using (auth.uid() = user_id);
create index idx_daily_stats_user_date on public.daily_stats(user_id, study_date desc);

-- weak_words テーブル
create table if not exists public.weak_words (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  vocabulary_id integer not null,
  mistake_count integer default 0,
  avg_response_time integer default 0,
  is_overcome boolean default false,
  overcome_at timestamptz,
  unique(user_id, vocabulary_id)
);
alter table public.weak_words enable row level security;
create policy "自分のデータのみ操作" on public.weak_words
  for all using (auth.uid() = user_id);
create index idx_weak_words_user on public.weak_words(user_id, is_overcome);

-- vocabulary_progress テーブル
create table if not exists public.vocabulary_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  vocabulary_id integer not null,
  consecutive_correct integer default 0,
  is_mastered boolean default false,
  mastered_at timestamptz,
  unique(user_id, vocabulary_id)
);
alter table public.vocabulary_progress enable row level security;
create policy "自分のデータのみ操作" on public.vocabulary_progress
  for all using (auth.uid() = user_id);
create index idx_vocab_progress_user on public.vocabulary_progress(user_id, is_mastered);
