-- 1. Create Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdomain TEXT NOT NULL UNIQUE,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. Create Default Tenant
INSERT INTO public.tenants (name, subdomain)
VALUES ('Default Tenant', 'default')
ON CONFLICT (subdomain) DO NOTHING;

-- 3. Setup Products Table (and others)
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT id INTO default_tenant_id FROM public.tenants WHERE subdomain = 'default' LIMIT 1;

    -- Create 'productos' if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.productos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      nombre TEXT,
      descripcion TEXT,
      precio NUMERIC,
      stock INTEGER,
      categoria TEXT,
      imagen_url TEXT,
      creado_por UUID REFERENCES auth.users(id),
      tenant_id UUID REFERENCES public.tenants(id)
    );
    
    -- Add tenant_id if missing (for existing tables)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.productos ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;

    -- Update null tenant_ids
    IF default_tenant_id IS NOT NULL THEN
        UPDATE public.productos SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    END IF;

    -- Enable RLS
    ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

    -- Create Policy (Example: Allow all for now, restrict later)
    DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.productos;
    CREATE POLICY "Tenant Isolation Policy" ON public.productos
    USING (true); -- Placeholder

    -- Creating 'clientes' table example
    CREATE TABLE IF NOT EXISTS public.clientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre TEXT,
        email TEXT,
        tenant_id UUID REFERENCES public.tenants(id)
    );
     ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

END $$;
