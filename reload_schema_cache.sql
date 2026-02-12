-- ============================================
-- REFRESCAR CACHÉ DE API (SCHEMA CACHE)
-- ============================================
-- Ejecuta este comando si recibes el error:
-- "Could not find the table '...' in the schema cache"

NOTIFY pgrst, 'reload config';

-- Verifica que la tabla existe y es visible
SELECT * FROM public.mercadopago_config LIMIT 1;
