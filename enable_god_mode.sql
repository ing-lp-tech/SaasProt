-- =================================================================
-- ENABLE GOD MODE FOR SUPER ADMIN (Owner)
-- This script ensures the Platform Owner can Read/Write ALL data 
-- across ALL tenants.
-- =================================================================

-- 1. Helper function to check if user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role = 'owner' -- The role string for Super Admin
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Update Policies for PRODUCTOS
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they conflict or are too restrictive (Optional, or just add new OR policy)
-- Let's ADD a new permissive policy for Super Admin.

CREATE POLICY "Super Admin Full Access Productos" ON public.productos
    FOR ALL
    TO authenticated
    USING ( public.is_super_admin() )
    WITH CHECK ( public.is_super_admin() );


-- 3. Update Policies for CATEGORIAS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin Full Access Categorias" ON public.categorias
    FOR ALL
    TO authenticated
    USING ( public.is_super_admin() )
    WITH CHECK ( public.is_super_admin() );


-- 4. Update Policies for SITE_CONFIG
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin Full Access SiteConfig" ON public.site_config
    FOR ALL
    TO authenticated
    USING ( public.is_super_admin() )
    WITH CHECK ( public.is_super_admin() );


-- 5. Update Policies for TENANT_INVITES
ALTER TABLE public.tenant_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin Full Access Invites" ON public.tenant_invites
    FOR ALL
    TO authenticated
    USING ( public.is_super_admin() )
    WITH CHECK ( public.is_super_admin() );

-- 6. Ensure Super Admin can read all TENANTS (Already usually public read, but ensuring write)
CREATE POLICY "Super Admin Full Access Tenants" ON public.tenants
    FOR ALL
    TO authenticated
    USING ( public.is_super_admin() )
    WITH CHECK ( public.is_super_admin() );


-- 7. Ensure Super Admin can manage USER_PROFILES
CREATE POLICY "Super Admin Full Access Profiles" ON public.user_profiles
    FOR ALL
    TO authenticated
    USING ( public.is_super_admin() )
    WITH CHECK ( public.is_super_admin() );

-- Notify
NOTIFY pgrst, 'reload config';
