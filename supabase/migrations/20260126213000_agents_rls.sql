-- Políticas de segurança para gestão de Agentes IA

-- 1. Permitir INSERT para Tenant Admin e Master Admin da mesma empresa
create policy "Tenant Admins can create agents"
on public.ai_agents
for insert
with check (
  auth.uid() in (
    select id from public.profiles 
    where company_id = public.ai_agents.company_id
    and role in ('tenant_admin', 'master_admin')
  )
);

-- 2. Permitir UPDATE para Tenant Admin e Master Admin da mesma empresa
create policy "Tenant Admins can update agents"
on public.ai_agents
for update
using (
  auth.uid() in (
    select id from public.profiles 
    where company_id = public.ai_agents.company_id
    and role in ('tenant_admin', 'master_admin')
  )
);

-- 3. Permitir DELETE para Tenant Admin e Master Admin da mesma empresa
create policy "Tenant Admins can delete agents"
on public.ai_agents
for delete
using (
  auth.uid() in (
    select id from public.profiles 
    where company_id = public.ai_agents.company_id
    and role in ('tenant_admin', 'master_admin')
  )
);
