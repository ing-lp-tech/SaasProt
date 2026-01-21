-- Migración para características avanzadas: Carousel, Temas, etc.

-- Carousel Hero (3 imágenes)
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS hero_carousel_images JSONB DEFAULT '[]'::jsonb;

-- Sistema de Temas
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS store_type TEXT DEFAULT 'unisex';
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS theme_primary_color TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS theme_secondary_color TEXT;
ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS theme_accent_color TEXT;

-- Comentarios
COMMENT ON COLUMN public.site_config.hero_carousel_images IS 'Array de URLs de imágenes para carousel: ["url1", "url2", "url3"]';
COMMENT ON COLUMN public.site_config.store_type IS 'Tipo de tienda: mujer, hombre, ninos, unisex';
COMMENT ON COLUMN public.site_config.theme_primary_color IS 'Color primario personalizado (opcional, override del tema)';

-- Mensaje
DO $$
BEGIN
    RAISE NOTICE '✅ Columnas de características avanzadas agregadas';
END $$;
