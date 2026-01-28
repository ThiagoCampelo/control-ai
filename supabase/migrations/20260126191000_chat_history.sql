-- Tabela de Sessões de Chat
create table public.chat_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    company_id uuid references public.companies(id) on delete cascade not null,
    title text not null default 'Nova Conversa',
    model text not null default 'gpt-4',
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Tabela de Mensagens do Chat
create table public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references public.chat_sessions(id) on delete cascade not null,
    role text not null check (role in ('user', 'assistant', 'system')),
    content text not null,
    created_at timestamptz default now() not null
);

-- Índices para performance
create index idx_chat_sessions_user_id on public.chat_sessions(user_id);
create index idx_chat_sessions_company_id on public.chat_sessions(company_id);
create index idx_chat_messages_session_id on public.chat_messages(session_id);
create index idx_chat_messages_created_at on public.chat_messages(created_at);

-- Trigger para atualizar updated_at automaticamente
create or replace function public.update_chat_session_timestamp()
returns trigger
language plpgsql
as $$
begin
    update public.chat_sessions
    set updated_at = now()
    where id = NEW.session_id;
    return NEW;
end;
$$;

create trigger on_chat_message_insert
after insert on public.chat_messages
for each row
execute function public.update_chat_session_timestamp();

-- Habilita RLS
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- Políticas RLS para chat_sessions
create policy "Users can view own chat sessions"
on public.chat_sessions for select
using (auth.uid() = user_id);

create policy "Users can create own chat sessions"
on public.chat_sessions for insert
with check (auth.uid() = user_id);

create policy "Users can update own chat sessions"
on public.chat_sessions for update
using (auth.uid() = user_id);

create policy "Users can delete own chat sessions"
on public.chat_sessions for delete
using (auth.uid() = user_id);

-- Políticas RLS para chat_messages (baseada na sessão)
create policy "Users can view messages from own sessions"
on public.chat_messages for select
using (
    session_id in (select id from public.chat_sessions where user_id = auth.uid())
);

create policy "Users can create messages in own sessions"
on public.chat_messages for insert
with check (
    session_id in (select id from public.chat_sessions where user_id = auth.uid())
);
