-- 1. Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- 2. Create Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdomain TEXT NOT NULL UNIQUE,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 3. Create Default Tenant
INSERT INTO public.tenants (name, subdomain)
VALUES ('Default Tenant', 'default')
ON CONFLICT (subdomain) DO NOTHING;

-- 4. Get Default Tenant ID
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT id INTO default_tenant_id FROM public.tenants WHERE subdomain = 'default' LIMIT 1;

    -- 5. Add tenant_id to existing tables (if they exist)
    -- Adjust these table names if you haven't created them yet in the new project.
    -- If this is a fresh project, you might need to create the other tables first.
    
    -- Example for 'productos'
    CREATE TABLE IF NOT EXISTS public.productos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      nombre TEXT,
      descripcion TEXT,
      precio NUMERIC,
      stock INTEGER,
      categoria TEXT,
      imagen_url TEXT,
      creado_por UUID REFERENCES auth.users(id)
    );
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.productos ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        IF default_tenant_id IS NOT NULL THEN
            UPDATE public.productos SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        END IF;
        -- ALTER TABLE public.productos ALTER COLUMN tenant_id SET NOT NULL; -- Optional for now
    END IF;
    
    -- Enable RLS on products
    ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS Policy for Products
    -- (Simple version: check if tenant_id matches)
    DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.productos;
    CREATE POLICY "Tenant Isolation Policy" ON public.productos
    USING (true); -- Placeholder: We will restrict this later when Auth is fully setup

END $$;
