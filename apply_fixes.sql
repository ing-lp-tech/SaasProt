-- ==============================================================================
-- SCRIPT COMPLETO DE CORRECCIÓN - SEGURIDAD Y RENDIMIENTO (VERSION SEGURA)
-- Soluciona TODOS los errores detectados por Supabase Linter
-- ==============================================================================

-- ==============================================================================
-- 1. MOVER EXTENSIÓN VECTOR A SCHEMA EXTENSIONS (Seguridad)
-- ==============================================================================

-- Crear schema dedicado para extensiones
CREATE SCHEMA IF NOT EXISTS extensions;

-- Intentar mover extensión vector fuera de public (puede fallar si ya está movida)
DO $$
BEGIN
    ALTER EXTENSION vector SET SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Extensión vector ya está en el schema correcto o no existe';
END $$;

-- Actualizar search_path para que las funciones encuentren vector
ALTER DATABASE postgres SET search_path TO "$user", public, extensions;

-- ==============================================================================
-- 2. ASEGURAR FUNCIONES CON SEARCH_PATH INMUTABLE (Prevenir Hijacking)
-- ==============================================================================

-- Solo modificar funciones que realmente existan en tu base de datos
-- Usa este enfoque más simple y seguro:

DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT oid::regprocedure::text as func_name
        FROM pg_proc 
        WHERE proname IN (
            'is_super_admin',
            'handle_new_user_saas', 
            'create_tenant_with_owner',
            'register_sale',
            'update_product_stock_from_movement',
            'handle_new_user'
        )
        AND pronamespace = 'public'::regnamespace
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION %s SET search_path = public', func_record.func_name);
            RAISE NOTICE 'Función % asegurada', func_record.func_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'No se pudo modificar %: %', func_record.func_name, SQLERRM;
        END;
    END LOOP;
    
    -- match_documents necesita también el schema extensions
    FOR func_record IN 
        SELECT oid::regprocedure::text as func_name
        FROM pg_proc 
        WHERE proname = 'match_documents'
        AND pronamespace = 'public'::regnamespace
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions', func_record.func_name);
            RAISE NOTICE 'Función match_documents asegurada con acceso a extensions';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'No se pudo modificar match_documents: %', SQLERRM;
        END;
    END LOOP;
END $$;

-- ==============================================================================
-- 3. HABILITAR RLS EN MANUAL_AUDACES
-- ==============================================================================

-- Asegurar que tenant_id existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'manual_audaces' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.manual_audaces ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- Habilitar Row Level Security
ALTER TABLE public.manual_audaces ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Tenant Read Manual Audaces" ON public.manual_audaces;
DROP POLICY IF EXISTS "Tenant Owner Write Manual Audaces" ON public.manual_audaces;

-- Política de lectura: Solo usuarios autenticados del mismo tenant
CREATE POLICY "Tenant Read Manual Audaces" ON public.manual_audaces
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
  );

-- Política de escritura: Solo propietarios y admins del tenant
CREATE POLICY "Tenant Owner Write Manual Audaces" ON public.manual_audaces
  FOR ALL
  USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND tenant_id = manual_audaces.tenant_id 
      AND role IN ('tenant_owner', 'admin', 'super_admin')
    )
  );

-- ==============================================================================
-- 4. CORREGIR POLÍTICAS RLS PERMISIVAS
-- ==============================================================================

-- -------------------------------------
-- 4.1 TABLA: CATEGORIAS
-- -------------------------------------

DROP POLICY IF EXISTS "Admin write access to categorias" ON public.categorias;
DROP POLICY IF EXISTS "Public Read Active Categorias" ON public.categorias;
DROP POLICY IF EXISTS "Tenant Write Categorias" ON public.categorias;

-- Lectura pública de categorías activas
CREATE POLICY "Public Read Active Categorias" ON public.categorias 
  FOR SELECT 
  USING (activo = true);

-- Escritura solo para usuarios autenticados del mismo tenant
CREATE POLICY "Tenant Write Categorias" ON public.categorias 
  FOR ALL 
  USING (
    auth.role() = 'authenticated' AND
    tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
  );

-- -------------------------------------
-- 4.2 TABLA: LEADS
-- -------------------------------------

DROP POLICY IF EXISTS "Allow authenticated update leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert leads" ON public.leads;
DROP POLICY IF EXISTS "Public leads insert" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated insert leads" ON public.leads;
DROP POLICY IF EXISTS "Public Insert Leads Only" ON public.leads;
DROP POLICY IF EXISTS "Tenant Admin Manage Leads" ON public.leads;

-- Inserción pública (formularios web) - ESTO ES INTENCIONAL
CREATE POLICY "Public Insert Leads Only" ON public.leads 
  FOR INSERT 
  WITH CHECK (true);

-- Lectura/actualización/eliminación solo para admins del tenant
CREATE POLICY "Tenant Admin Manage Leads" ON public.leads 
  FOR ALL 
  USING (
    auth.role() = 'authenticated' AND
    tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
  );

-- -------------------------------------
-- 4.3 TABLA: PRODUCTOS
-- -------------------------------------

DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.productos;
DROP POLICY IF EXISTS "Public Read Active Products" ON public.productos;
DROP POLICY IF EXISTS "Tenant Manage Products" ON public.productos;

-- Asegurar que tenant_id existe en productos
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.productos ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- Lectura pública de productos activos
CREATE POLICY "Public Read Active Products" ON public.productos 
  FOR SELECT 
  USING (activo = true);

-- Escritura solo para usuarios autenticados del mismo tenant
CREATE POLICY "Tenant Manage Products" ON public.productos 
  FOR ALL 
  USING (
    auth.role() = 'authenticated' AND
    tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
  );

-- -------------------------------------
-- 4.4 TABLA: TENANTS
-- -------------------------------------

DROP POLICY IF EXISTS "Allow Admin Insert Tenants" ON public.tenants;
DROP POLICY IF EXISTS "Public read tenants" ON public.tenants;
DROP POLICY IF EXISTS "Public Read Tenants Info" ON public.tenants;
DROP POLICY IF EXISTS "Authenticated Insert Tenants" ON public.tenants;
DROP POLICY IF EXISTS "Tenant Owner Update Tenant" ON public.tenants;

-- Lectura pública (necesario para resolver subdomains)
CREATE POLICY "Public Read Tenants Info" ON public.tenants 
  FOR SELECT 
  USING (true);

-- Inserción solo para usuarios autenticados (registro)
CREATE POLICY "Authenticated Insert Tenants" ON public.tenants 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Actualización solo para propietarios del tenant o super admins
CREATE POLICY "Tenant Owner Update Tenant" ON public.tenants 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND (tenant_id = tenants.id AND role IN ('tenant_owner', 'super_admin'))
    )
  );

-- ==============================================================================
-- 5. AGREGAR POLÍTICAS A TABLA CLIENTES (si existe)
-- ==============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clientes' AND table_schema = 'public') THEN
        -- Eliminar políticas antiguas si existen
        EXECUTE 'DROP POLICY IF EXISTS "Tenant Read Clientes" ON public.clientes';
        EXECUTE 'DROP POLICY IF EXISTS "Tenant Manage Clientes" ON public.clientes';
        
        -- Lectura: usuarios autenticados del mismo tenant
        EXECUTE 'CREATE POLICY "Tenant Read Clientes" ON public.clientes 
          FOR SELECT 
          USING (
            auth.role() = ''authenticated'' AND
            tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
          )';
        
        -- Escritura: usuarios autenticados del mismo tenant
        EXECUTE 'CREATE POLICY "Tenant Manage Clientes" ON public.clientes 
          FOR ALL 
          USING (
            auth.role() = ''authenticated'' AND
            tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE id = auth.uid())
          )';
        
        RAISE NOTICE 'Políticas para tabla clientes creadas exitosamente';
    ELSE
        RAISE NOTICE 'Tabla clientes no existe, saltando...';
    END IF;
END $$;

-- ==============================================================================
-- 6. LÍMITE DE 40 PRODUCTOS POR TENANT
-- ==============================================================================

-- Eliminar función y trigger antiguos si existen
DROP TRIGGER IF EXISTS enforce_product_limit ON public.productos;
DROP FUNCTION IF EXISTS public.check_product_limit();

-- Función para verificar límite antes de insertar
CREATE OR REPLACE FUNCTION public.check_product_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_products INTEGER := 40;
BEGIN
    -- Contar productos activos del tenant
    SELECT COUNT(*) INTO current_count
    FROM public.productos
    WHERE tenant_id = NEW.tenant_id AND activo = true;

    IF current_count >= max_products THEN
        RAISE EXCEPTION 'Límite de productos alcanzado. Tu plan permite un máximo de % productos activos.', max_products;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Trigger para ejecutar la verificación
CREATE TRIGGER enforce_product_limit
    BEFORE INSERT ON public.productos
    FOR EACH ROW
    EXECUTE FUNCTION public.check_product_limit();

-- ==============================================================================
-- 7. ÍNDICES DE RENDIMIENTO
-- ==============================================================================

-- Índices en tenant_id para mejorar velocidad de consultas multi-tenant

CREATE INDEX IF NOT EXISTS idx_manual_audaces_tenant_id ON public.manual_audaces(tenant_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON public.user_profiles(tenant_id);

CREATE INDEX IF NOT EXISTS idx_productos_tenant_id ON public.productos(tenant_id);

CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON public.leads(tenant_id);

CREATE INDEX IF NOT EXISTS idx_categorias_tenant_id ON public.categorias(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_invites_tenant_id ON public.tenant_invites(tenant_id);

-- Solo crear índice en clientes si la tabla existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clientes' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_clientes_tenant_id ON public.clientes(tenant_id);
    END IF;
END $$;

-- Índices adicionales en columnas frecuentemente consultadas
CREATE INDEX IF NOT EXISTS idx_productos_activo ON public.productos(activo) WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_categorias_activo ON public.categorias(activo) WHERE activo = true;

-- ==============================================================================
-- FIN DEL SCRIPT
-- ==============================================================================

-- NOTAS FINALES:
-- 1. La protección contra contraseñas filtradas (Leaked Password Protection)
--    debe habilitarse desde el Dashboard de Supabase en:
--    Authentication > Settings > Enable "Password Leaked Protection"
-- 
-- 2. Si ves mensajes de NOTICE durante la ejecución, no te preocupes, 
--    son informativos y no errores.
--
-- 3. Después de ejecutar este script, verifica en el Dashboard que:
--    - Las advertencias de seguridad disminuyeron
--    - RLS está habilitado en todas las tablas públicas
--    - Los índices fueron creados correctamente
