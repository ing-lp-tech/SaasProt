-- ============================================
-- MIGRACIÓN MERCADOPAGO - VERSIÓN SIMPLIFICADA
-- Compatible con el esquema actual del proyecto
-- ============================================

-- 1. CREAR TABLA ORDERS SI NO EXISTE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  items_description TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'pending',
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  remaining_amount DECIMAL(10, 2)
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- ============================================
-- 2. CAMPOS FINANCIEROS EN TENANTS
-- ============================================
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'up_to_date', 
ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS owner_phone TEXT,
ADD COLUMN IF NOT EXISTS custom_domain TEXT;

CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON public.tenants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_tenants_payment_status ON public.tenants(payment_status);

-- ============================================
-- 3. CONFIGURACIÓN MERCADOPAGO POR TENANT
-- ============================================
CREATE TABLE IF NOT EXISTS public.mercadopago_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  access_token_encrypted TEXT,
  public_key TEXT,
  is_sandbox BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- ============================================
-- 4. MÉTODOS DE PAGO HABILITADOS POR TENANT
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('cash', 'mercadopago_full', 'mercadopago_deposit')),
  enabled BOOLEAN DEFAULT true,
  deposit_percentage DECIMAL(5, 2) DEFAULT 30.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, method_type)
);

-- ============================================
-- 5. TRANSACCIONES MERCADOPAGO
-- ============================================
CREATE TABLE IF NOT EXISTS public.mercadopago_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  payment_type TEXT CHECK (payment_type IN ('full', 'deposit')),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  status_detail TEXT,
  payment_method TEXT,
  external_reference TEXT,
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mp_transactions_tenant ON public.mercadopago_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mp_transactions_order ON public.mercadopago_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_mp_transactions_mp_payment ON public.mercadopago_transactions(mp_payment_id);

-- ============================================
-- 6. ENABLE RLS (ROW LEVEL SECURITY)
-- ============================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mercadopago_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mercadopago_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. POLÍTICAS RLS SIMPLIFICADAS
-- ============================================

-- Políticas para ORDERS (acceso público por ahora, ajustar según necesidad)
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update orders" ON public.orders;
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true);

-- Políticas para MERCADOPAGO_CONFIG (acceso público temporal)
DROP POLICY IF EXISTS "Public access mercadopago_config" ON public.mercadopago_config;
CREATE POLICY "Public access mercadopago_config" 
  ON public.mercadopago_config 
  USING (true) 
  WITH CHECK (true);

-- Políticas para PAYMENT_METHODS (acceso público temporal)
DROP POLICY IF EXISTS "Public access payment_methods" ON public.payment_methods;
CREATE POLICY "Public access payment_methods" 
  ON public.payment_methods 
  USING (true) 
  WITH CHECK (true);

-- Políticas para MERCADOPAGO_TRANSACTIONS (acceso público temporal)
DROP POLICY IF EXISTS "Public access mercadopago_transactions" ON public.mercadopago_transactions;
CREATE POLICY "Public access mercadopago_transactions" 
  ON public.mercadopago_transactions 
  USING (true) 
  WITH CHECK (true);

-- ============================================
-- 8. DATOS INICIALES
-- ============================================

-- Insertar método de pago "cash" por defecto para todos los tenants existentes
INSERT INTO public.payment_methods (tenant_id, method_type, enabled, deposit_percentage)
SELECT 
  id,
  'cash',
  true,
  NULL
FROM public.tenants
ON CONFLICT (tenant_id, method_type) DO NOTHING;

-- ============================================
-- 9. FUNCIONES ÚTILES
-- ============================================

-- Función para calcular monto de seña
CREATE OR REPLACE FUNCTION public.calculate_deposit_amount(
  p_tenant_id UUID,
  p_total_amount DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  v_percentage DECIMAL;
BEGIN
  SELECT deposit_percentage INTO v_percentage
  FROM public.payment_methods
  WHERE tenant_id = p_tenant_id 
    AND method_type = 'mercadopago_deposit'
    AND enabled = true;
  
  IF v_percentage IS NULL THEN
    v_percentage := 30.00;
  END IF;
  
  RETURN ROUND((p_total_amount * v_percentage / 100)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql;

-- Función para obtener tenants con deuda
CREATE OR REPLACE FUNCTION public.get_tenants_with_debt()
RETURNS TABLE (
  tenant_id UUID,
  company_name TEXT,
  subdomain TEXT,
  monthly_fee DECIMAL(10, 2),
  last_payment_date TIMESTAMP WITH TIME ZONE,
  days_since_payment INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name as company_name,
    t.subdomain,
    t.monthly_fee,
    t.last_payment_date,
    EXTRACT(DAY FROM NOW() - t.last_payment_date)::INTEGER as days_since_payment
  FROM public.tenants t
  WHERE t.payment_status = 'debt'
  ORDER BY t.last_payment_date ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRACIÓN COMPLETADA ✅
-- ============================================
-- Ejecuta este script en Supabase SQL Editor
-- Verifica con: SELECT * FROM public.mercadopago_config;
