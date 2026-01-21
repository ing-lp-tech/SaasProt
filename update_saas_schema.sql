-- ==========================================
-- SaaS Multi-Tenant Architecture Migration
-- ==========================================

-- 1. Tenants Table (Empresas)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdomain TEXT NOT NULL UNIQUE,
    config JSONB DEFAULT '{}'::jsonb, -- Logo, colors, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Allow public read of tenants (needed for TenantContext to load basic branding)
CREATE POLICY "Public read tenants" ON public.tenants
    FOR SELECT USING (true);

-- Only Super Admin can insert/update/delete (We'll define Super Admin policy later or manually)

-- 2. Update User Profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id),
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update ROLE column check/logic handled in application, but we can document roles:
-- 'super_admin': Platform owner
-- 'tenant_owner': Client owner (Master)
-- 'staff': Employee

-- 3. Function: Create Tenant with Owner
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
    -- 1. Create Tenant
    INSERT INTO public.tenants (name, subdomain)
    VALUES (tenant_name, tenant_subdomain)
    RETURNING id INTO new_tenant_id;

    -- 2. Create User in Auth (This usually requires Service Role key if done via API, 
    -- inside SQL it's harder to create auth.users direct safely. 
    -- BETTER APPROACH: The user creates the auth account first, or we use Supabase Admin API.
    -- FOR THIS FUNCTION: We assume the user creates the account via Client first, 
    -- OR this function is called by a Super Admin UI that handles both.)
    -- Let's change strategy: Update Profile of EXISTING user to be Owner.
    
    -- Assuming user exists in auth.users by email lookup
    SELECT id INTO new_user_id FROM auth.users WHERE email = owner_email;
    
    IF new_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found. Please sign up first.', owner_email;
    END IF;

    -- 3. Update Profile
    UPDATE public.user_profiles
    SET tenant_id = new_tenant_id,
        role = 'tenant_owner'
    WHERE id = new_user_id;

    -- If profile doesn't exist (race condition), insert it
    IF NOT FOUND THEN
        INSERT INTO public.user_profiles (id, email, role, tenant_id)
        VALUES (new_user_id, owner_email, 'tenant_owner', new_tenant_id);
    END IF;

    RETURN jsonb_build_object('tenant_id', new_tenant_id, 'user_id', new_user_id);
END;
$$;

-- 4. Function: Invite/Add Collaborator
-- Simplification: Collaborator signs up -> trigger adds default profile -> Tenant Admin updates them.
-- OR: Tenant Admin creates a "Pre-authorized" email entry.
-- Let's go with: Tenant Admin invites email -> We store in 'tenant_invites' table -> User signs up -> Trigger checks invites.

CREATE TABLE IF NOT EXISTS public.tenant_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    email TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    department TEXT,
    invited_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending', -- pending, accepted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id, email)
);

ALTER TABLE public.tenant_invites ENABLE ROW LEVEL SECURITY;

-- Tenant Owners can view/insert invites for their tenant
CREATE POLICY "Tenant Owners manage invites" ON public.tenant_invites
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.tenant_id = tenant_invites.tenant_id 
            AND up.role = 'tenant_owner'
        )
    );

-- 5. Updated Trigger for New Users logic
CREATE OR REPLACE FUNCTION public.handle_new_user_saas()
RETURNS TRIGGER AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Check if there is an invite for this email
    SELECT * INTO invite_record FROM public.tenant_invites 
    WHERE email = new.email AND status = 'pending';

    IF invite_record.id IS NOT NULL THEN
        -- Link to tenant
        INSERT INTO public.user_profiles (id, email, role, tenant_id, department)
        VALUES (new.id, new.email, invite_record.role, invite_record.tenant_id, invite_record.department);
        
        -- Mark invite as accepted
        UPDATE public.tenant_invites SET status = 'accepted' WHERE id = invite_record.id;
    ELSE
        -- Default orphan user (Waiting for assignment or self-service if enabled)
        INSERT INTO public.user_profiles (id, email, role)
        VALUES (new.id, new.email, 'user');
    END IF;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_saas();

