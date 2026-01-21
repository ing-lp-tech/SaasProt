-- Migración para hacer todas las secciones editables desde el admin
-- Agrega campos para Hero, FAQ, Workflow, Footer y Redes Sociales

-- Primero, agregar columnas base si no existen
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Imágenes generales (que pueden ya existir)
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS navbar_logo_url TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS hero_logo_url TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS hero_main_image_url TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS about_bg_url TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS workflow_image_url TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS footer_logo_url TEXT;

-- Hero/Portada
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS hero_title TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS hero_description TEXT;

-- Sobre Mí (IMPORTANTE: esta faltaba)
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS about_content JSONB DEFAULT '[]'::jsonb;

-- Preguntas Frecuentes
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS faq_title TEXT DEFAULT 'Preguntas Frecuentes';
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS faq_content JSONB DEFAULT '[]'::jsonb;

-- Cómo Trabajamos / Workflow
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS workflow_title TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS workflow_subtitle TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS workflow_content JSONB DEFAULT '[]'::jsonb;

-- Footer y Redes Sociales
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS footer_title TEXT DEFAULT 'Síguenos en nuestras redes';
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS social_facebook TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS social_instagram TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS social_tiktok TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS social_linkedin TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS social_youtube TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS social_twitter TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS footer_copyright TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS footer_designed_by TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS footer_designed_by_url TEXT;

-- Columnas de timestamp (IMPORTANTE para que funcione el update)
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Comentarios para documentación
COMMENT ON COLUMN public.site_config.hero_title IS 'Título principal de la sección Hero';
COMMENT ON COLUMN public.site_config.faq_content IS 'Contenido de FAQ en formato JSON: [{category, questions: [{question, answer}]}]';
COMMENT ON COLUMN public.site_config.workflow_content IS 'Pasos del workflow en formato JSON: [{title, description}]';
COMMENT ON COLUMN public.site_config.social_facebook IS 'URL de la página de Facebook';
COMMENT ON COLUMN public.site_config.social_instagram IS 'URL del perfil de Instagram';
