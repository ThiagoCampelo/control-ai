-- Corrige políticas RLS de chat_messages para usar função SECURITY DEFINER
-- Isso evita problemas de performance e recursão

-- Remove políticas antigas
drop policy if exists "Users can view messages from own sessions" on public.chat_messages;
drop policy if exists "Users can create messages in own sessions" on public.chat_messages;

-- Cria função para verificar se o usuário é dono da sessão
create or replace function public.user_owns_session(p_session_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.chat_sessions 
    where id = p_session_id and user_id = auth.uid()
  )
$$;

-- Recria políticas usando a função
create policy "Users can view messages from own sessions"
on public.chat_messages for select
using (public.user_owns_session(session_id));

create policy "Users can create messages in own sessions"
on public.chat_messages for insert
with check (public.user_owns_session(session_id));
