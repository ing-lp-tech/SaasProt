-- 1. Create a Demo Tenant
INSERT INTO public.tenants (name, subdomain, config)
VALUES (
    'Empresa Ejemplo S.A.', 
    'demo', 
    '{"primaryColor": "#ff5733", "logoUrl": "https://via.placeholder.com/150/ff5733/ffffff?text=Demo+Logo"}'::jsonb
)
ON CONFLICT (subdomain) DO NOTHING;

-- 2. Get the ID of the new tenant
DO $$
DECLARE
    demo_tenant_id UUID;
    user_id UUID;
BEGIN
    SELECT id INTO demo_tenant_id FROM public.tenants WHERE subdomain = 'demo' LIMIT 1;

    -- 3. Insert specific products for this Demo Tenant
    -- Note that we are using the current user (auth.uid()) as creator for simplicity, 
    -- or we needs a valid user ID. 
    -- For this script to work globally without auth context issues, we'll try to pick the first user found or leave created_by null if allowed.
    SELECT id INTO user_id FROM auth.users LIMIT 1;

    INSERT INTO public.productos (nombre, descripcion, precio_usd, precio_ars, stock, categoria, tenant_id, creado_por, activo)
    VALUES 
    (
        'Producto Exclusivo Demo 1', 
        'Este producto solo lo ve la empresa Demo.', 
        100, 
        120000, 
        50, 
        'Computadoras', -- Asegurate que esta categoría exista or use one that does
        demo_tenant_id,
        user_id,
        true
    ),
    (
        'Servicio Especial Demo', 
        'Servicio único para este cliente.', 
        500, 
        600000, 
        10, 
        'Computadoras',
        demo_tenant_id,
        user_id,
        true
    );

END $$;
