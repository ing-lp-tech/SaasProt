-- MANUALLY INSERT MISSING TENANT CONFIG
-- This fixes the 406 error by ensuring a row exists for the current user's tenant.

INSERT INTO public.site_config (tenant_id, store_type, faq_title, footer_title)
VALUES (
    '1259568c-6922-46bc-8c01-1504eacb378e', -- Tu ID de Tenant (sacado de los logs)
    'femenino',                             -- Tema Femenino
    'Preguntas Frecuentes',
    'Síguenos en nuestras redes'
)
ON CONFLICT (tenant_id) 
DO UPDATE SET 
    store_type = EXCLUDED.store_type,
    updated_at = NOW();

-- ✅ Tenant Config fixed successfully
