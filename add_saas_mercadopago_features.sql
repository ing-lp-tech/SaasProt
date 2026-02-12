-- ============================================
-- MIGRACIÓN: MÓDULO SAAS + MERCADOPAGO
-- ============================================
-- Agrega funcionalidad de gestión financiera de tenants
-- y sistema de pagos con MercadoPago (3 opciones)
-- ============================================

-- ============================================
-- 1. CAMPOS FINANCIEROS EN TENANTS
-- ============================================
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'up_to_date', 
ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS owner_phone TEXT,
ADD COLUMN IF NOT EXISTS custom_domain TEXT;

-- Índice para búsqueda por dominio personalizado
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_tenants_payment_status ON tenants(payment_status);

-- Comentarios
COMMENT ON COLUMN tenants.payment_status IS 'Estado de pago del cliente SaaS: up_to_date, debt, cancelled';
COMMENT ON COLUMN tenants.custom_domain IS 'Dominio personalizado del cliente (ej: tiendadejuan.com)';

-- ============================================
-- 2. CONFIGURACIÓN MERCADOPAGO POR TENANT
-- ============================================
CREATE TABLE IF NOT EXISTS mercadopago_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  access_token_encrypted TEXT, -- Token de acceso (TODO: implementar encriptación)
  public_key TEXT,
  is_sandbox BOOLEAN DEFAULT true, -- true = pruebas, false = producción
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id)
);

COMMENT ON TABLE mercadopago_config IS 'Credenciales de MercadoPago por tenant';
COMMENT ON COLUMN mercadopago_config.is_sandbox IS 'true = modo prueba, false = producción';

-- ============================================
-- 3. MÉTODOS DE PAGO HABILITADOS POR TENANT
-- ============================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('cash', 'mercadopago_full', 'mercadopago_deposit')),
  enabled BOOLEAN DEFAULT true,
  deposit_percentage DECIMAL(5, 2) DEFAULT 30.00, -- % de seña (para método mixto)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, method_type)
);

COMMENT ON TABLE payment_methods IS 'Métodos de pago habilitados por cada tenant';
COMMENT ON COLUMN payment_methods.method_type IS 'cash, mercadopago_full, mercadopago_deposit';
COMMENT ON COLUMN payment_methods.deposit_percentage IS 'Porcentaje de seña para método mixto (default 30%)';

-- ============================================
-- 4. TRANSACCIONES MERCADOPAGO
-- ============================================
CREATE TABLE IF NOT EXISTS mercadopago_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  mp_payment_id TEXT, -- ID de pago de MercadoPago
  mp_preference_id TEXT, -- ID de preferencia de pago
  payment_type TEXT CHECK (payment_type IN ('full', 'deposit')), -- 'full' = pago completo, 'deposit' = seña
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled', 'refunded'
  status_detail TEXT,
  payment_method TEXT, -- tarjeta, efectivo MP, etc.
  external_reference TEXT,
  webhook_data JSONB, -- Datos completos del webhook
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mp_transactions_tenant ON mercadopago_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mp_transactions_order ON mercadopago_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_mp_transactions_mp_payment ON mercadopago_transactions(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_mp_transactions_status ON mercadopago_transactions(status);

COMMENT ON TABLE mercadopago_transactions IS 'Registro de todas las transacciones con MercadoPago';
COMMENT ON COLUMN mercadopago_transactions.payment_type IS 'full = pago completo, deposit = seña';

-- ============================================
-- 5. ACTUALIZAR TABLA ORDERS
-- ============================================
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash', -- 'cash', 'mercadopago_full', 'mercadopago_deposit'
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending', -- 'pending', 'partial', 'completed'
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

COMMENT ON COLUMN orders.payment_method IS 'cash, mercadopago_full, mercadopago_deposit';
COMMENT ON COLUMN orders.payment_status IS 'pending, partial (seña pagada), completed';
COMMENT ON COLUMN orders.paid_amount IS 'Monto ya pagado';
COMMENT ON COLUMN orders.remaining_amount IS 'Monto pendiente de pago';

-- ============================================
-- 6. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE mercadopago_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercadopago_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para mercadopago_config
CREATE POLICY "Tenants can view their own MP config"
  ON mercadopago_config FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE id = auth.uid()::uuid
    UNION
    SELECT tenant_id FROM users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Tenants can update their own MP config"
  ON mercadopago_config FOR ALL
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE id = auth.uid()::uuid
    UNION
    SELECT tenant_id FROM users WHERE user_id = auth.uid()
  ));

-- Políticas para payment_methods
CREATE POLICY "Tenants can view their payment methods"
  ON payment_methods FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE id = auth.uid()::uuid
    UNION
    SELECT tenant_id FROM users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Tenants can manage their payment methods"
  ON payment_methods FOR ALL
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE id = auth.uid()::uuid
    UNION
    SELECT tenant_id FROM users WHERE user_id = auth.uid()
  ));

-- Políticas para mercadopago_transactions
CREATE POLICY "Tenants can view their MP transactions"
  ON mercadopago_transactions FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE id = auth.uid()::uuid
    UNION
    SELECT tenant_id FROM users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Backend can insert MP transactions"
  ON mercadopago_transactions FOR INSERT
  WITH CHECK (true); -- El backend usa service key

-- ============================================
-- 7. DATOS INICIALES
-- ============================================

-- Insertar métodos de pago por defecto para tenants existentes
INSERT INTO payment_methods (tenant_id, method_type, enabled, deposit_percentage)
SELECT 
  id,
  'cash',
  true,
  NULL
FROM tenants
ON CONFLICT (tenant_id, method_type) DO NOTHING;

-- ============================================
-- 8. FUNCIONES ÚTILES
-- ============================================

-- Función para obtener tenants con deuda
CREATE OR REPLACE FUNCTION get_tenants_with_debt()
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
    t.company_name,
    t.subdomain,
    t.monthly_fee,
    t.last_payment_date,
    EXTRACT(DAY FROM NOW() - t.last_payment_date)::INTEGER as days_since_payment
  FROM tenants t
  WHERE t.payment_status = 'debt'
  ORDER BY t.last_payment_date ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para calcular monto de seña
CREATE OR REPLACE FUNCTION calculate_deposit_amount(
  p_tenant_id UUID,
  p_total_amount DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  v_percentage DECIMAL;
BEGIN
  SELECT deposit_percentage INTO v_percentage
  FROM payment_methods
  WHERE tenant_id = p_tenant_id 
    AND method_type = 'mercadopago_deposit'
    AND enabled = true;
  
  IF v_percentage IS NULL THEN
    v_percentage := 30.00; -- Default
  END IF;
  
  RETURN ROUND((p_total_amount * v_percentage / 100)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRACIÓN COMPLETADA
-- ============================================
-- Ejecuta este script en tu base de datos Supabase
-- Luego verifica con: SELECT * FROM mercadopago_config;
