-- Habilita extensão para UUIDs
create extension if not exists "uuid-ossp";

-- 1. Tabela de Planos (SaaS)
create table public.plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price_id_stripe text, 
  limits jsonb not null, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Empresas (Tenants)
create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  plan_id uuid references public.plans(id),
  stripe_customer_id text,
  api_key_openai text, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Perfis (Usuários/Colaboradores)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text check (role in ('master_admin', 'tenant_admin', 'employee')) not null,
  company_id uuid references public.companies(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Agentes IA
create table public.ai_agents (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) not null,
  name text not null,
  prompt_system text not null,
  model text default 'gpt-4',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabelas de Auditoria (Logs)
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id),
  user_id uuid references public.profiles(id),
  action text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Tabela de Conversas (Histórico de Chat)
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) not null,
  agent_id uuid references public.ai_agents(id),
  user_id uuid references public.profiles(id),
  messages jsonb not null default '[]',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- === SEGURANÇA: RLS (ROW LEVEL SECURITY) ===
-- Obrigatório ativar RLS em TODAS as tabelas 

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.ai_agents enable row level security;
alter table public.audit_logs enable row level security;
alter table public.conversations enable row level security;
alter table public.plans enable row level security;

-- Permitir leitura pública de planos (para a página de Pricing)
create policy "Public read plans" on public.plans for select using (true);

-- Política Base: Usuários só veem dados da sua própria empresa
-- Exemplo para ai_agents:
create policy "Users can view data from their own company"
on public.ai_agents
for select
using (
  company_id in (
    select company_id from public.profiles where id = auth.uid()
  )
);

-- TRIGGER AUTOMÁTICO: Cria perfil ao cadastrar usuário no Auth
-- Isso facilita o teste local
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (new.id, new.email, 'tenant_admin', new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();