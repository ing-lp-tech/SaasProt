-- 1. Agregar columna tenant_id a la tabla leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 2. Habilitar RLS en leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 3. Política para INSERT (Público puede crear leads)
DROP POLICY IF EXISTS "Public leads insert" ON public.leads;
CREATE POLICY "Public leads insert" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

-- 4. Política para SELECT (Ver leads)
-- Super Admin / Owner: Ve todo
-- Tenant Owner / Vendedor: Ve solo sus leads
DROP POLICY IF EXISTS "View leads policy" ON public.leads;
CREATE POLICY "View leads policy" 
ON public.leads 
FOR SELECT 
USING (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('owner', 'admin', 'super_admin')
  OR
  (tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()))
);

-- 5. Política para UPDATE/DELETE (Gestionar leads)
DROP POLICY IF EXISTS "Manage leads policy" ON public.leads;
CREATE POLICY "Manage leads policy" 
ON public.leads 
FOR ALL
USING (
  (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('owner', 'admin', 'super_admin')
  OR
  (tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid()))
);

-- 6. Recargar caché de esquema (para que la API detecte la nueva columna)
NOTIFY pgrst, 'reload config';
