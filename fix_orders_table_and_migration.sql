-- ============================================
-- CORRECCIÓN: CREAR TABLA ORDERS SI NO EXISTE
-- ============================================

-- 1. Asegurar que existe la tabla ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, completed, cancelled
  items_description TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'pending',
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  remaining_amount DECIMAL(10, 2)
);

-- Indices básicos
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ============================================
-- 2. APLICAR CAMBIOS DE MERCADOPAGO (RESTO DE LA MIGRACIÓN)
-- ============================================

-- CAMPOS FINANCIEROS EN TENANTS
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'up_to_date', 
ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS owner_phone TEXT,
ADD COLUMN IF NOT EXISTS custom_domain TEXT;

CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain);

-- CONFIGURACIÓN MERCADOPAGO
CREATE TABLE IF NOT EXISTS mercadopago_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  access_token_encrypted TEXT,
  public_key TEXT,
  is_sandbox BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- MÉTODOS DE PAGO
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  deposit_percentage DECIMAL(5, 2) DEFAULT 30.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, method_type)
);

-- TRANSACCIONES MERCADOPAGO
CREATE TABLE IF NOT EXISTS mercadopago_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  payment_type TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  status_detail TEXT,
  payment_method TEXT,
  external_reference TEXT,
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mp_transactions_tenant ON mercadopago_transactions(tenant_id);

-- POLÍTICAS RLS
ALTER TABLE mercadopago_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercadopago_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas simplificadas (ajustar según necesidad)
CREATE POLICY "Public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Tenants manage own config" ON mercadopago_config USING (auth.uid() = tenant_id OR auth.uid() IN (SELECT user_id FROM users WHERE tenant_id = mercadopago_config.tenant_id));
CREATE POLICY "Tenants manage own methods" ON payment_methods USING (auth.uid() = tenant_id OR auth.uid() IN (SELECT user_id FROM users WHERE tenant_id = payment_methods.tenant_id));

-- DATOS INICIALES
INSERT INTO payment_methods (tenant_id, method_type, enabled, deposit_percentage)
SELECT id, 'cash', true, NULL FROM tenants
ON CONFLICT (tenant_id, method_type) DO NOTHING;
