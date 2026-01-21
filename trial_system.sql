-- =================================================================
-- TRIAL SYSTEM IMPLEMENTATION
-- =================================================================

-- 1. Add Trial Columns to Tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'trial', -- 'trial', 'active', 'suspended', 'expired'
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days');

-- 2. Update create_tenant_with_owner to set default trial
CREATE OR REPLACE FUNCTION public.create_tenant_with_owner(
    tenant_name TEXT,
    tenant_subdomain TEXT,
    owner_email TEXT,
    owner_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_tenant_id UUID;
    new_user_id UUID;
BEGIN
    -- 1. Create Tenant (Default 7 days trial)
    INSERT INTO public.tenants (name, subdomain,  plan_status, trial_ends_at)
    VALUES (tenant_name, tenant_subdomain, 'trial', now() + interval '7 days')
    RETURNING id INTO new_tenant_id;

    -- 2. Create User in Auth (if not exists)
    -- NOTE: In a real scenario, we might check if user exists first.
    -- For simplicity, we assume this function is used for NEW users or we handle conflict externally,
    -- catch is hard in PLPGSQL for auth.
    
    -- Check if user exists in public.user_profiles just to be safe about logic flow,
    -- but usually we need their auth.users id.
    
    -- Only 'service_role' can create users directly in auth.users via API, 
    -- from PLPGSQL it's harder without extension.
    -- workaround: We assume the user is created via Supabase Auth API *before* or we rely on the caller.
    -- BUT, adapting to previous logic: likely we bind an EXISTING email or create a placeholder.
    -- Let's assume the user MIGHT exist. We'll try to find them.
    
    SELECT id INTO new_user_id FROM auth.users WHERE email = owner_email;
    
    IF new_user_id IS NULL THEN
        -- If user doesn't exist, we can't create in auth.users easily from pure SQL without extensions.
        -- We will return a specific code so the Frontend knows it must invite them or create them via Admin API.
        -- However, previous implementation implied we set password.
        -- If we can't create auth user here, we just fail or expect frontend to do it.
        -- Let's return the tenant_id so frontend can handle user creation if needed.
        RAISE EXCEPTION 'User % not found. Please create the user first.', owner_email;
    END IF;

    -- 3. Link User to Tenant (Update Profile)
    -- We assume profile exists if user exists (via triggers), otherwise insert.
    INSERT INTO public.user_profiles (id, email, role, tenant_id, full_name)
    VALUES (new_user_id, owner_email, 'tenant_owner', new_tenant_id, 'Dueño ' || tenant_name)
    ON CONFLICT (id) DO UPDATE
    SET role = 'tenant_owner',
        tenant_id = new_tenant_id;

    RETURN jsonb_build_object(
        'success', true,
        'tenant_id', new_tenant_id,
        'user_id', new_user_id
    );
END;
$$;
