-- Create the tenants table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdomain TEXT NOT NULL UNIQUE,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure RLS is enabled on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (necessary for resolving subdomain)
DROP POLICY IF EXISTS "Public read access to tenants" ON public.tenants;
CREATE POLICY "Public read access to tenants" ON public.tenants
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

-- Ensure products table has tenant_id
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Grant permissions explicitly (often the cause of visibility issues)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.productos TO anon, authenticated, service_role;

-- Force Schema Cache Reload by creating and dropping a dummy table
-- This is often more effective than just NOTIFY in stubborn cases
CREATE TABLE IF NOT EXISTS public.schema_cache_buster (id int);
DROP TABLE public.schema_cache_buster;

-- Also try the standard notify
NOTIFY pgrst, 'reload config';

-- Insert Demo Tenant if not exists (to ensure we have data to fetch)
INSERT INTO public.tenants (name, subdomain, config)
VALUES ('Empresa Ejemplo S.A.', 'demo', '{"logoUrl": "https://via.placeholder.com/150", "primaryColor": "#007bff"}'::jsonb)
ON CONFLICT (subdomain) DO NOTHING;
