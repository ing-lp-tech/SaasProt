-- ⚠️ IMPORTANTE: Este script ELIMINARÁ la tabla site_config existente
-- Si tienes datos importantes, haz un backup primero

-- 1. Hacer backup de datos existentes (opcional, descomentar si necesitas)
-- CREATE TABLE site_config_backup AS SELECT * FROM public.site_config;

-- 2. Eliminar tabla vieja
DROP TABLE IF EXISTS public.site_config CASCADE;

-- 3. Crear tabla con estructura nueva
CREATE TABLE public.site_config (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Imágenes generales
    navbar_logo_url TEXT,
    hero_logo_url TEXT,
    hero_main_image_url TEXT,
    about_bg_url TEXT,
    workflow_image_url TEXT,
    footer_logo_url TEXT,
    
    -- Hero/Portada
    hero_title TEXT,
    hero_subtitle TEXT,
    hero_description TEXT,
    
    -- Sobre Mí
    about_content JSONB DEFAULT '[]'::jsonb,
    
    -- Preguntas Frecuentes
    faq_title TEXT DEFAULT 'Preguntas Frecuentes',
    faq_content JSONB DEFAULT '[]'::jsonb,
    
    -- Cómo Trabajamos
    workflow_title TEXT,
    workflow_subtitle TEXT,
    workflow_content JSONB DEFAULT '[]'::jsonb,
    
    
    -- Footer y Redes Sociales
    footer_title TEXT DEFAULT 'Síguenos en nuestras redes',
    social_facebook TEXT,
    social_instagram TEXT,
    social_tiktok TEXT,
    social_linkedin TEXT,
    social_youtube TEXT,
    social_twitter TEXT,
    footer_copyright TEXT,
    footer_designed_by TEXT,
    footer_designed_by_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Solo un registro por tenant
    UNIQUE(tenant_id)
);

-- 4. Habilitar RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de seguridad
CREATE POLICY "Allow authenticated users to view site config" ON public.site_config
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert site config" ON public.site_config
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update site config" ON public.site_config
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- 6. Comentarios
COMMENT ON TABLE public.site_config IS 'Configuración del sitio web para cada tenant (esquema nuevo con columnas)';

-- 7. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Tabla site_config recreada exitosamente con nuevo esquema';
    RAISE NOTICE '📝 Ahora puedes guardar contenido desde el editor';
END $$;
