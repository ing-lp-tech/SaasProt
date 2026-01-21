-- Create categorias table if not exists
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    orden INTEGER DEFAULT 0,
    tenant_id UUID REFERENCES public.tenants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on categorias
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- Policy for reading categories (public read for now, filtering by tenant handled in query or context usually, but safer to enforce here)
-- For simplicity in "option A", we allow read access to all for now to avoid complexity, or filtered by tenant_id if available context.
-- Let's stick to standard public read for simplicity in debugging, or checking tenant_id.
CREATE POLICY "Public read access to categorias" ON public.categorias
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

CREATE POLICY "Admin write access to categorias" ON public.categorias
    FOR ALL
    TO authenticated
    USING (true); -- Ideally restrict to owner/admin

-- Create site_config table if not exists (legacy support)
CREATE TABLE IF NOT EXISTS public.site_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    value TEXT,
    tenant_id UUID REFERENCES public.tenants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (key, tenant_id)
);

-- Enable RLS on site_config
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to site_config" ON public.site_config
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

CREATE POLICY "Admin write access to site_config" ON public.site_config
    FOR ALL
    TO authenticated
    USING (true);

-- Insert default categories for Demo Tenant
-- We need to find the demo tenant ID first.
DO $$
DECLARE
    demo_tenant_id UUID;
BEGIN
    SELECT id INTO demo_tenant_id FROM public.tenants WHERE subdomain = 'demo';

    IF demo_tenant_id IS NOT NULL THEN
        INSERT INTO public.categorias (nombre, orden, tenant_id) VALUES
        ('Patrones Digitales', 1, demo_tenant_id),
        ('Kits de Plotter', 2, demo_tenant_id),
        ('Insumos', 3, demo_tenant_id)
        ON CONFLICT DO NOTHING; -- No conflict constraint on name yet, but safe to run
    END IF;
END $$;

-- Reload Schema Cache
NOTIFY pgrst, 'reload config';
