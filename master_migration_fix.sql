-- MASTER MIGRATION FIX
-- Run this script to ensure your database has all necessary tables and columns for the Site Config and Theme features.

-- 1. Create table site_config if it doesn't exist
CREATE TABLE IF NOT EXISTS public.site_config (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    UNIQUE(tenant_id)
);

-- 2. Add Basic Configuration Columns
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS navbar_logo_url TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS hero_logo_url TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS hero_main_image_url TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS about_bg_url TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS workflow_image_url TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS footer_logo_url TEXT;

ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS hero_title TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS hero_description TEXT;

ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS faq_title TEXT DEFAULT 'Preguntas Frecuentes';
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS faq_content JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS workflow_title TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS workflow_subtitle TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS workflow_content JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS about_content JSONB DEFAULT '[]'::jsonb;

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

ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Add Advanced Features Columns (Carousel & Themes)
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS hero_carousel_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS store_type TEXT DEFAULT 'unisex';
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS theme_primary_color TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS theme_secondary_color TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS theme_accent_color TEXT;

-- 4. Enable RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- 5. Fix Policies (CRITICAL: Public Read Access)

-- Allow public read access (for landing page visitors)
DROP POLICY IF EXISTS "Allow public read access to site_config" ON public.site_config;
CREATE POLICY "Allow public read access to site_config" ON public.site_config
    FOR SELECT
    USING (true);

-- Allow authenticated users (admins) to insert/update
DROP POLICY IF EXISTS "Allow authenticated users to insert site config" ON public.site_config;
CREATE POLICY "Allow authenticated users to insert site config" ON public.site_config
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update site config" ON public.site_config;
CREATE POLICY "Allow authenticated users to update site config" ON public.site_config
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- 6. Grant usage to anon (just in case)
GRANT SELECT ON public.site_config TO anon;
GRANT SELECT ON public.site_config TO authenticated;
GRANT ALL ON public.site_config TO service_role;

DO $$
BEGIN
    RAISE NOTICE '✅ Base de datos actualizada correctamente. Tabla site_config lista.';
END $$;
