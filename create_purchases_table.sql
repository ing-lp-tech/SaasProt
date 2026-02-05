-- Tabla para el módulo "Posibles Compras" / Purchase Planner

-- Eliminar tabla anterior si existe para recrearla limpia
DROP TABLE IF EXISTS public.purchase_drafts;

CREATE TABLE IF NOT EXISTS public.purchase_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Datos Básicos
    nombre TEXT NOT NULL,
    marca TEXT,
    codigo TEXT,
    imagen_url TEXT,
    fecha_compra DATE DEFAULT CURRENT_DATE,

    -- Datos de Cálculo
    tipo_unidad TEXT CHECK (tipo_unidad IN ('UNIDAD', 'DOCENA', 'PACK')), -- Tipo de agrupación
    cantidad_por_paquete INTEGER DEFAULT 1, -- 1 si es Unidad, 12 si es Docena, X si es Pack
    cantidad_paquetes INTEGER DEFAULT 1, -- Cuántos bultos/unidades se compran
    
    costo_por_paquete NUMERIC DEFAULT 0, -- Costo de 1 bulto
    costo_total NUMERIC DEFAULT 0, -- Costo final (paquetes * costo_paquete)
    
    costo_unitario_final NUMERIC, -- El costo real de CADA item individual (Calculado por App)

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.purchase_drafts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Auth Manage Purchase Drafts" ON public.purchase_drafts
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_drafts_tenant ON public.purchase_drafts(tenant_id);
