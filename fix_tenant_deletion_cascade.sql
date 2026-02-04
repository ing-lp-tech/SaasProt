DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'productos',
        'clientes',
        'proveedores',
        'ventas',
        'compras',
        'categorias',
        'site_config',
        'manual_audaces',
        'leads',
        'gastos',
        'movimientos_stock',
        'presupuestos',
        'caja_diaria',
        'pedidos',
        'user_profiles',
        'stock_movements'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Check if table exists
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            
            -- Check if tenant_id column exists
            IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'tenant_id') THEN
                
                -- Drop existing constraint if it exists (we need to find its name or try generic names)
                -- Usually it is table_tenant_id_fkey
                
                -- Attempt to drop the specific constraint reported in the error for 'productos' and generic for others
                BEGIN
                    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', t, t || '_tenant_id_fkey');
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Could not drop constraint %_tenant_id_fkey on table %', t, t;
                END;

                -- Also try to drop the one reported in the screenshot specifically for generic match
                BEGIN
                     EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS "productos_tenant_id_fkey"', t);
                EXCEPTION WHEN OTHERS THEN
                    NULL;
                END;

                 -- Add new constraint with ON DELETE CASCADE
                BEGIN
                    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE', t, t || '_tenant_id_fkey');
                    RAISE NOTICE 'Updated table % with ON DELETE CASCADE', t;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Failed to add constraint on table %: %', t, SQLERRM;
                END;
                
            END IF;
        END IF;
    END LOOP;
END $$;
