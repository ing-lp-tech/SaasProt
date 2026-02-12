-- ============================================
-- VERIFICAR CONFIGURACIÓN DE MERCADOPAGO
-- ============================================
-- Este script te ayudará a diagnosticar problemas

-- 1. Ver TODOS los tenants disponibles
SELECT id, subdomain, name 
FROM tenants 
ORDER BY created_at DESC;

-- 2. Ver configuración de MercadoPago de TODOS los tenants
SELECT 
    mp.id,
    mp.tenant_id,
    t.subdomain,
    t.name as tenant_name,
    mp.public_key,
    CASE 
        WHEN mp.access_token_encrypted IS NOT NULL 
        THEN '✓ Token configurado' 
        ELSE '✗ Token NO configurado' 
    END as token_status,
    mp.is_sandbox,
    mp.enabled,
    mp.created_at,
    mp.updated_at
FROM mercadopago_config mp
LEFT JOIN tenants t ON t.id = mp.tenant_id
ORDER BY mp.updated_at DESC;

-- 3. Ver métodos de pago configurados
SELECT 
    pm.id,
    t.subdomain,
    pm.method_type,
    pm.enabled,
    pm.deposit_percentage,
    pm.updated_at
FROM payment_methods pm
LEFT JOIN tenants t ON t.id = pm.tenant_id
ORDER BY pm.tenant_id, pm.method_type;

-- 4. Si NO aparece nada arriba, puede que el problema sea que
--    estás usando un tenant diferente al que configuraste.
--    
--    SOLUCIÓN: Anota el tenant_id que aparece en la sección 2
--    y verifica que coincida con el tenant que estás usando en el frontend.
