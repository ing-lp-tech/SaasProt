-- 1. Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'productos-imagenes', 
  'productos-imagenes', 
  true, 
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de acceso (Sin ALTER TABLE)

-- Política para VER imágenes (Público)
DROP POLICY IF EXISTS "Public access to product images" ON storage.objects;
CREATE POLICY "Public access to product images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'productos-imagenes' );

-- Política para SUBIR imágenes (Solo autenticados)
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'productos-imagenes' 
  AND auth.role() = 'authenticated'
);

-- Política para ELIMINAR imágenes (Solo autenticados)
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'productos-imagenes'
  AND auth.role() = 'authenticated'
);

-- Recargar configuración
NOTIFY pgrst, 'reload config';
