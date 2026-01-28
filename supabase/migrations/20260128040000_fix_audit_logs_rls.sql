-- Permite que usuários autenticados insiram seus próprios logs (usado pelo chat)
CREATE POLICY "Users can insert own logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Permite que usuários vejam logs da sua própria empresa (Tenant Admin/Employee)
CREATE POLICY "Users view company logs"
ON public.audit_logs
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);
