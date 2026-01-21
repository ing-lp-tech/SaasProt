-- Agregar columnas faltantes a la tabla categorias
ALTER TABLE public.categorias 
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Habilitar RLS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad (RLS)
-- 1. Permitir ver categorías públicas (o filtradas por tenant en el futuro)
CREATE POLICY "Categorías visibles para todos" 
ON public.categorias FOR SELECT 
USING (true);

-- 2. Permitir a dueños y admins gestionar sus categorías
CREATE POLICY "Admins gestionan sus categorías" 
ON public.categorias FOR ALL 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_profiles 
    WHERE tenant_id = categorias.tenant_id 
    AND role IN ('owner', 'admin', 'tenant_owner')
  )
);

-- 3. Permitir insertar si el usuario pertenece al tenant
CREATE POLICY "Admins crean categorías" 
ON public.categorias FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.user_profiles 
    WHERE tenant_id = categorias.tenant_id 
    AND role IN ('owner', 'admin', 'tenant_owner')
  )
);
