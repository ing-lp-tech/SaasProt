-- Configurar bucket 'site-assets' para imágenes de configuración del sitio
-- Este bucket almacena logos, imágenes del hero, carousel, etc.

-- 1. Crear el bucket si no existe (debe hacerse desde la UI de Supabase o con SQL extension)
-- NOTA: La creación de buckets requiere privilegios especiales, 
-- normalmente se hace desde el panel de Supabase Storage.

-- 2. Configurar políticas de acceso para el bucket site-assets

-- Permitir que usuarios autenticados SUBAN archivos
CREATE POLICY IF NOT EXISTS "Authenticated users can upload site assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-assets');

-- Permitir que usuarios autenticados ACTUALICEN sus archivos
CREATE POLICY IF NOT EXISTS "Authenticated users can update site assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'site-assets');

-- Permitir que usuarios autenticados ELIMINEN sus archivos
CREATE POLICY IF NOT EXISTS "Authenticated users can delete site assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'site-assets');

-- Permitir acceso público de LECTURA (para que las imágenes se vean en la web)
CREATE POLICY IF NOT EXISTS "Public read access for site assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'site-assets');

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Políticas de Storage configuradas para site-assets';
    RAISE NOTICE '⚠️  IMPORTANTE: Debes crear el bucket "site-assets" desde la UI de Supabase:';
    RAISE NOTICE '   1. Ve a Storage en el panel de Supabase';
    RAISE NOTICE '   2. Crea un nuevo bucket llamado "site-assets"';
    RAISE NOTICE '   3. Marca "Public bucket" para permitir acceso público de lectura';
END $$;
