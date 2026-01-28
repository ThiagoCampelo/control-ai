-- Allow Master Admin and Tenant Admins to insert new profiles (for invitations)
CREATE POLICY "Admins can insert profiles" ON profiles
FOR INSERT
WITH CHECK (
  (get_my_role() = 'master_admin') 
  OR 
  (
    get_my_role() = 'tenant_admin' 
    AND 
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);
