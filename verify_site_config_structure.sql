-- Script simplificado para crear/verificar estructura de site_config
-- Compatible con la estructura actual de base de datos

-- 1. Crear la tabla site_config si no existe
CREATE TABLE IF NOT EXISTS public.site_config (
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
    
    -- Preguntas Frecuentes
    faq_title TEXT DEFAULT 'Preguntas Frecuentes',
    faq_content JSONB DEFAULT '[]'::jsonb,
    
    -- Cómo Trabajamos
    workflow_title TEXT,
    workflow_subtitle TEXT,
    workflow_content JSONB DEFAULT '[]'::jsonb,
    
    -- Sobre Mí
    about_content JSONB DEFAULT '[]'::jsonb,
    
    -- Footer y Redes Sociales
    footer_logo_url TEXT,
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
    
    -- Constraint: un solo registro por tenant
    UNIQUE(tenant_id)
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de seguridad simplificadas
-- Permitir que todos los usuarios autenticados vean configuraciones
DROP POLICY IF EXISTS "Allow authenticated users to view site config" ON public.site_config;
CREATE POLICY "Allow authenticated users to view site config" ON public.site_config
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Permitir que usuarios autenticados inserten/actualicen
-- (el tenant_id se asigna desde el contexto de TenantContext)
DROP POLICY IF EXISTS "Allow authenticated users to insert site config" ON public.site_config;
CREATE POLICY "Allow authenticated users to insert site config" ON public.site_config
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update site config" ON public.site_config;
CREATE POLICY "Allow authenticated users to update site config" ON public.site_config
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- 4. Comentarios para documentación
COMMENT ON TABLE public.site_config IS 'Configuración del sitio web para cada tenant';
COMMENT ON COLUMN public.site_config.tenant_id IS 'ID del tenant al que pertenece esta configuración';
COMMENT ON COLUMN public.site_config.about_content IS 'Contenido de la sección Sobre Mí en formato JSON: [{title, description}]';
COMMENT ON COLUMN public.site_config.faq_content IS 'Preguntas frecuentes en formato JSON: [{category, questions: [{question, answer}]}]';
COMMENT ON COLUMN public.site_config.workflow_content IS 'Pasos del proceso en formato JSON: [{title, description}]';

-- 5. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Tabla site_config creada/verificada correctamente';
    RAISE NOTICE 'Ahora puedes ejecutar add_all_site_config_fields.sql';
END $$;
