-- ============================================
-- FIX: CREAR CONFIGURACIÓN FALTANTE DE MERCADOPAGO
-- ============================================

-- 1. Insertar configuración vacía para tenants que no la tienen
INSERT INTO public.mercadopago_config (tenant_id, public_key, access_token_encrypted, is_sandbox, enabled)
SELECT 
    t.id, 
    NULL, -- Public Key vacía
    NULL, -- Access Token vacío
    true, -- Sandbox por defecto
    false -- Deshabilitado por defecto hasta que pongan claves
FROM public.tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM public.mercadopago_config mp WHERE mp.tenant_id = t.id
);

-- 2. Asegurar que existan métodos de pago
INSERT INTO public.payment_methods (tenant_id, method_type, enabled, deposit_percentage)
SELECT 
    t.id,
    'cash',
    true,
    NULL
FROM public.tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM public.payment_methods pm 
    WHERE pm.tenant_id = t.id AND pm.method_type = 'cash'
);

INSERT INTO public.payment_methods (tenant_id, method_type, enabled, deposit_percentage)
SELECT 
    t.id,
    'mercadopago_full',
    false, -- Deshabilitado hasta que configuren MP
    NULL
FROM public.tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM public.payment_methods pm 
    WHERE pm.tenant_id = t.id AND pm.method_type = 'mercadopago_full'
);

INSERT INTO public.payment_methods (tenant_id, method_type, enabled, deposit_percentage)
SELECT 
    t.id,
    'mercadopago_deposit',
    false, -- Deshabilitado hasta que configuren MP
    30.00
FROM public.tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM public.payment_methods pm 
    WHERE pm.tenant_id = t.id AND pm.method_type = 'mercadopago_deposit'
);

-- 3. Verificación
SELECT * FROM public.mercadopago_config;
