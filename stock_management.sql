-- =================================================================
-- STOCK MANAGEMENT SYSTEM
-- =================================================================

-- 1. Create Stock Movements Table (Kardex)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.productos(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id), -- For query speed/security
    type TEXT CHECK (type IN ('IN', 'OUT')), -- IN: Entry (Purchase/Adjustment), OUT: Exit (Sale/Adjustment)
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reason TEXT, -- 'Initial Stock', 'Sale #123', 'Correction', etc.
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenant Owners manage stock movements" ON public.stock_movements
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND (up.role = 'tenant_owner' OR up.role = 'admin' OR up.role = 'owner') 
            AND (up.tenant_id = stock_movements.tenant_id OR up.role = 'owner')
        )
    );

-- 2. Trigger to Update 'stock_actual' on 'productos' automatically
-- This ensures 'stock_actual' is always in sync with movements
CREATE OR REPLACE FUNCTION public.update_product_stock_from_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'IN' THEN
        UPDATE public.productos 
        SET stock_actual = stock_actual + NEW.quantity 
        WHERE id = NEW.product_id;
    ELSIF NEW.type = 'OUT' THEN
        UPDATE public.productos 
        SET stock_actual = stock_actual - NEW.quantity 
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Trigger
DROP TRIGGER IF EXISTS trg_update_stock ON public.stock_movements;
CREATE TRIGGER trg_update_stock
    AFTER INSERT ON public.stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_stock_from_movement();


-- 3. RPC Function: Register Sale (Atomic Check & Deduct)
-- This is called from the Frontend "Checkout" button
CREATE OR REPLACE FUNCTION public.register_sale(
    cart_items JSONB, -- Array of objects: { "id": "uuid", "quantity": 5, "name": "..." }
    tenant_id_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item JSONB;
    p_id UUID;
    qty INTEGER;
    current_stock INTEGER;
    prod_name TEXT;
BEGIN
    -- 1. Validate Stock for ALL items first
    FOR item IN SELECT * FROM jsonb_array_elements(cart_items)
    LOOP
        p_id := (item->>'id')::UUID;
        qty := (item->>'quantity')::INTEGER;
        
        SELECT stock_actual, nombre INTO current_stock, prod_name 
        FROM public.productos 
        WHERE id = p_id;
        
        IF current_stock < qty THEN
            RAISE EXCEPTION 'Stock insuficiente para % (Stock: %, Solicitado: %)', prod_name, current_stock, qty;
        END IF;
    END LOOP;

    -- 2. If all good, Deduct Stock (Insert Movements)
    FOR item IN SELECT * FROM jsonb_array_elements(cart_items)
    LOOP
        p_id := (item->>'id')::UUID;
        qty := (item->>'quantity')::INTEGER;
        prod_name := item->>'name';

        INSERT INTO public.stock_movements (product_id, tenant_id, type, quantity, reason, created_by)
        VALUES (
            p_id, 
            tenant_id_param, 
            'OUT', 
            qty, 
            'Venta Web - ' || to_char(now(), 'DD/MM/YYYY HH24:MI'),
            auth.uid() -- Can be null for anon users? If anon, we might need to handle 'created_by' differently.
                       -- For now, let's assume auth.uid() or null is fine.
        );
    END LOOP;

    RETURN jsonb_build_object('success', true, 'message', 'Venta registrada');
END;
$$;

-- Allow Public execution of register_sale (since customers are public)
-- IMPORTANT: We need anon users to trigger this.
GRANT EXECUTE ON FUNCTION public.register_sale(JSONB, UUID) TO anon, authenticated, service_role;

-- Notify
NOTIFY pgrst, 'reload config';
