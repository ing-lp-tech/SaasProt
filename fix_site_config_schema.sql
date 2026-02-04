-- Create site_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.site_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    navbar_logo_url TEXT,
    hero_logo_url TEXT,
    hero_main_image_url TEXT,
    about_bg_url TEXT,
    workflow_image_url TEXT,
    footer_logo_url TEXT,
    hero_title TEXT,
    hero_subtitle TEXT,
    hero_description TEXT,
    about_content JSONB DEFAULT '[]'::jsonb,
    workflow_title TEXT,
    workflow_subtitle TEXT,
    workflow_content JSONB DEFAULT '[]'::jsonb,
    faq_title TEXT,
    faq_content JSONB DEFAULT '[]'::jsonb,
    footer_title TEXT,
    -- Theme fields
    preset_id TEXT DEFAULT 'default',
    primary_color TEXT,
    font TEXT,
    -- Advanced features
    hero_carousel_images JSONB DEFAULT '[]'::jsonb,
    store_type TEXT DEFAULT 'unisex',
    theme_primary_color TEXT,
    theme_secondary_color TEXT,
    theme_accent_color TEXT,
    why_choose_features JSONB DEFAULT '[]'::jsonb
);

-- Add index on tenant_id for performance
CREATE INDEX IF NOT EXISTS idx_site_config_tenant_id ON public.site_config(tenant_id);

-- Enable RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Create policy to allow access (adjust based on your auth needs)
-- For now, allowing public read if you want, or restricted to tenant
DROP POLICY IF EXISTS "Enable read access for all users" ON public.site_config;
CREATE POLICY "Enable read access for all users" ON public.site_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.site_config;
CREATE POLICY "Enable insert for authenticated users only" ON public.site_config FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for users based on tenant" ON public.site_config;
CREATE POLICY "Enable update for users based on tenant" ON public.site_config FOR UPDATE USING (auth.role() = 'authenticated');

-- Explicitly add columns if table already existed but columns were missing
DO $$
BEGIN
    ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS why_choose_features JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS hero_carousel_images JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS store_type TEXT DEFAULT 'unisex';
    ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS theme_primary_color TEXT;
    ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS theme_secondary_color TEXT;
    ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS theme_accent_color TEXT;
    ALTER TABLE public.site_config ADD COLUMN IF NOT EXISTS about_bg_url TEXT;
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
