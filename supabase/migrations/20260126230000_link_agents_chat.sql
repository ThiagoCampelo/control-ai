
-- Adiciona agent_id à tabela de sessões de chat
alter table public.chat_sessions 
add column agent_id uuid references public.ai_agents(id) on delete set null;

-- Comentário para documentar a coluna
comment on column public.chat_sessions.agent_id is 'O agente de IA que está respondendo nesta sessão.';

-- Atualiza a política de visualização se necessário (já deve funcionar via user_id)
