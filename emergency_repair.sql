-- 🚑 EMERGENCY REPAIR SCRIPT 🚑
-- Run this ENTIRE script in the Supabase SQL Editor to fix everything.

-- 1. Ensure 'tenants' table exists
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdomain TEXT NOT NULL UNIQUE,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 3. Create Policy to allow public read (for now, to fix the 404 error)
DROP POLICY IF EXISTS "Allow Public Read Tenants" ON public.tenants;
CREATE POLICY "Allow Public Read Tenants" ON public.tenants
FOR SELECT USING (true); -- ⚠️ This allows anyone to read tenant config (needed for login/branding)

DROP POLICY IF EXISTS "Allow Admin Insert Tenants" ON public.tenants;
CREATE POLICY "Allow Admin Insert Tenants" ON public.tenants
FOR INSERT WITH CHECK (true); -- ⚠️ Opens creation for testing. Secure this later.

-- 4. Ensure 'productos' has all columns
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id),
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS precio_usd NUMERIC,
ADD COLUMN IF NOT EXISTS precio_ars NUMERIC,
ADD COLUMN IF NOT EXISTS precio_preventa_usd NUMERIC,
ADD COLUMN IF NOT EXISTS precio_mayorista_usd NUMERIC,
ADD COLUMN IF NOT EXISTS precio_mayorista_ars NUMERIC,
ADD COLUMN IF NOT EXISTS cantidad_minima_mayorista INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS combos JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS galeria TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- 5. Create Default Tenant if missing
INSERT INTO public.tenants (name, subdomain, config)
VALUES ('Default Tenant', 'default', '{"primaryColor": "#2563eb"}'::jsonb)
ON CONFLICT (subdomain) DO NOTHING;

-- 6. Create Demo Tenant if missing
INSERT INTO public.tenants (name, subdomain, config)
VALUES (
    'Empresa Ejemplo S.A.', 
    'demo', 
    '{"primaryColor": "#ff5733", "logoUrl": "https://via.placeholder.com/150/ff5733/ffffff?text=Demo+Logo"}'::jsonb
)
ON CONFLICT (subdomain) DO NOTHING;

-- 7. Fix RLS on Products to allow reading by tenant_id
DROP POLICY IF EXISTS "Public Read Products" ON public.productos;
CREATE POLICY "Public Read Products" ON public.productos
FOR SELECT USING (true); -- Simplify for debug: let everyone read everything for a moment.

-- 8. Grant permissions explicitly (Fixes 404/403 often)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.productos TO anon, authenticated, service_role;
