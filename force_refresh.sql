-- ============================================
-- FORZAR ACTUALIZACIÓN DE CACHÉ DE API
-- ============================================
-- Al crear y borrar una tabla, forzamos a Supabase a leer de nuevo la base de datos.
-- Esto soluciona el error "Could not find the table ... in the schema cache".

CREATE TABLE IF NOT EXISTS public.temp_cache_refresh (
    id SERIAL PRIMARY KEY
);

NOTIFY pgrst, 'reload config';

DROP TABLE public.temp_cache_refresh;

-- Verificar que la tabla mercadopago_config sea visible
SELECT * FROM public.mercadopago_config LIMIT 1;
