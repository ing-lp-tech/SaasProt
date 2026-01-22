-- Corrigiendo las columnas para el soporte de Temas
-- Ejecuta esto completo en el Editor SQL de Supabase

ALTER TABLE public.site_config 
ADD COLUMN IF NOT EXISTS font TEXT,
ADD COLUMN IF NOT EXISTS preset_id TEXT;

-- NOMBRE CORRECTO: primary_color (snake_case)
ALTER TABLE public.site_config 
ADD COLUMN IF NOT EXISTS primary_color TEXT;

-- Si por error se creó la columna "primaryColor" (con comillas), copiamos los datos y la borramos opcionalmente
-- (Esto es solo limpieza, lo importante es que exista primary_color)
DO $$
BEGIN
    -- Si existe la columna incorrecta "primaryColor"
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='site_config' AND column_name='primaryColor') THEN
        -- Copiar datos si primary_color está vacío
        UPDATE public.site_config SET primary_color = "primaryColor" WHERE primary_color IS NULL;
    END IF;
END $$;
