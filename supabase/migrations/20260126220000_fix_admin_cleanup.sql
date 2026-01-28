-- Migration to clean up the Admin user to allow fresh creation via API
-- This resolves potential corruption in auth.users due to previous manual inserts

DO $$
BEGIN
    -- Delete from public tables first (foreign keys)
    DELETE FROM public.profiles WHERE email = 'admin@controlai.com';
    
    -- Delete from auth tables
    -- Note: auth.identities usually cascades, but good to be explicit if needed
    DELETE FROM auth.identities WHERE user_id = 'd0d8c19c-3b36-4423-8f6d-7132534576d8';
    
    -- Cleanup by ID (The one we hardcoded)
    DELETE FROM auth.users WHERE id = 'd0d8c19c-3b36-4423-8f6d-7132534576d8';
    
    -- Cleanup by Email (Just in case ID was different)
    DELETE FROM auth.users WHERE email = 'admin@controlai.com';
END $$;
