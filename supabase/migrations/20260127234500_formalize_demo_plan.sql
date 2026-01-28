-- Formalize Demo Environment

-- 0. Update Role Constraint to allow 'demo_user'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('master_admin', 'tenant_admin', 'employee', 'demo_user'));

DO $$
DECLARE
    v_plan_id uuid;
BEGIN
    -- 1. Create Demo Plan (using JSONB limits) if it doesn't exist
    SELECT id INTO v_plan_id FROM plans WHERE name = 'Demo Plan';
    
    IF v_plan_id IS NULL THEN
        INSERT INTO plans (name, limits, price_id_stripe)
        VALUES ('Demo Plan', '{"max_users": 1, "max_chats": 10, "allowed_models": ["openai:gpt-4o-mini"]}', NULL)
        RETURNING id INTO v_plan_id;
    END IF;

    -- 2. Update Demo User Role and Company Plan
    -- We target the specific demo email
    UPDATE companies
    SET plan_id = v_plan_id
    WHERE id = (SELECT company_id FROM profiles WHERE email = 'demo@control.ai' LIMIT 1);

    UPDATE profiles
    SET role = 'demo_user' 
    WHERE email = 'demo@control.ai';

END $$;
