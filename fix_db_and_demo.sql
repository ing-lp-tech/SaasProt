-- 1. Add missing columns to 'productos' table to match Frontend
ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS precio_usd NUMERIC,
ADD COLUMN IF NOT EXISTS precio_ars NUMERIC,
ADD COLUMN IF NOT EXISTS precio_pre_venta NUMERIC,
ADD COLUMN IF NOT EXISTS precio_de_llegada NUMERIC,
ADD COLUMN IF NOT EXISTS precio_mayorista_usd NUMERIC,
ADD COLUMN IF NOT EXISTS precio_mayorista_ars NUMERIC,
ADD COLUMN IF NOT EXISTS cantidad_minima_mayorista INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS combos JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS galeria TEXT[] DEFAULT '{}';

-- 2. Update existing rows (optional, map 'precio' to 'precio_usd' or 'precio_ars')
UPDATE public.productos SET precio_ars = precio WHERE precio_ars IS NULL;

-- 3. Now Create the Demo Tenant and Products
-- (Re-running the previous logic but with correct columns)

-- Create Tenant
INSERT INTO public.tenants (name, subdomain, config)
VALUES (
    'Empresa Ejemplo S.A.', 
    'demo', 
    '{"primaryColor": "#ff5733", "logoUrl": "https://via.placeholder.com/150/ff5733/ffffff?text=Demo+Logo"}'::jsonb
)
ON CONFLICT (subdomain) DO NOTHING;

-- Insert Products
DO $$
DECLARE
    demo_tenant_id UUID;
BEGIN
    SELECT id INTO demo_tenant_id FROM public.tenants WHERE subdomain = 'demo' LIMIT 1;

    -- Insert PC Gamer (Example of complex product)
    INSERT INTO public.productos (nombre, descripcion, precio_usd, precio_ars, stock, categoria, tenant_id, activo, specs, combos)
    VALUES 
    (
        'PC Gamer Demo Ultra', 
        'Computadora de alto rendimiento para demostración.', 
        null, -- Use combos for price
        null,
        10, 
        'Computadoras',
        demo_tenant_id,
        true,
        '{"procesador": "Demo CPU i9", "ram": "32GB Demo", "graficos": "RTX Demo 4090"}'::jsonb,
        '{"basico": 1500000, "conMonitor": 1800000}'::jsonb
    );

    -- Insert Plotter (Example)
    INSERT INTO public.productos (nombre, descripcion, precio_pre_venta, precio_de_llegada, stock, categoria, tenant_id, activo)
    VALUES 
    (
        'Plotter Demo 1000', 
        'Plotter industrial de prueba.', 
        3500, -- pre-venta USD
        4000, -- llegada USD
        5, 
        'Plotters inyección',
        demo_tenant_id,
        true
    );

END $$;
