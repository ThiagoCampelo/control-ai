-- Add is_active column to companies and profiles
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Drop old select policies to avoid duplicates (assuming cleanup might be needed, 
-- but we mainly focus on the UPDATE policies we just added)

-- Companies Update Policy
DROP POLICY IF EXISTS "Master Admins can update any company" ON companies;
CREATE POLICY "Master Admins can update any company" ON companies
FOR UPDATE USING (get_my_role() = 'master_admin');

DROP POLICY IF EXISTS "Tenant Admins can update their own company" ON companies;
CREATE POLICY "Tenant Admins can update their own company" ON companies
FOR UPDATE USING (
  id IN (SELECT company_id FROM profiles WHERE id = auth.uid()) 
  AND get_my_role() = 'tenant_admin'
);

-- Profiles Update Policy
DROP POLICY IF EXISTS "Master Admins can update any profile" ON profiles;
CREATE POLICY "Master Admins can update any profile" ON profiles
FOR UPDATE USING (get_my_role() = 'master_admin');

DROP POLICY IF EXISTS "Tenant Admins can update profiles in their company" ON profiles;
CREATE POLICY "Tenant Admins can update profiles in their company" ON profiles
FOR UPDATE USING (
  company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND get_my_role() = 'tenant_admin'
);
