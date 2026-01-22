-- PASSO 2: Criar Tabelas e Políticas
-- Execute APÓS o Passo 1 ter sido concluído com sucesso.

-- 1. Create Tracking Sessions Table
create table if not exists tracking_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id text references users(uid),
  congregation_id uuid references congregations(id),
  start_time timestamptz not null default now(),
  end_time timestamptz,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  distance_meters float default 0,
  duration_seconds int default 0,
  observations text,
  notes text,
  created_at timestamptz default now()
);

-- 2. Create Tracking Points Table
create table if not exists tracking_points (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references tracking_sessions(id) on delete cascade,
  latitude float not null,
  longitude float not null,
  accuracy float,
  heading float,
  speed float,
  timestamp timestamptz not null,
  created_at timestamptz default now()
);

-- 3. Enable RLS
alter table tracking_sessions enable row level security;
alter table tracking_points enable row level security;

-- 4. Policies
create policy "Users can insert their own sessions" on tracking_sessions for insert with check (auth.uid()::text = user_id);
create policy "Users can view their own sessions" on tracking_sessions for select using (auth.uid()::text = user_id);

create policy "Admins/Elders can view all sessions" on tracking_sessions for select using (
  exists (
    select 1 from users
    where users.uid = auth.uid()::text
    and users.role in ('admin', 'elder', 'service_overseer')
  )
);

create policy "Users can insert points for their sessions" on tracking_points for insert with check (
  exists (
    select 1 from tracking_sessions
    where tracking_sessions.id = session_id
    and tracking_sessions.user_id = auth.uid()::text
  )
);
create policy "Users can view their own points" on tracking_points for select using (
  exists (
    select 1 from tracking_sessions
    where tracking_sessions.id = session_id
    and tracking_sessions.user_id = auth.uid()::text
  )
);
