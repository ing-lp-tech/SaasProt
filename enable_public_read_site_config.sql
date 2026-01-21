-- Enable public read access for site_config so landing pages can load it
-- This is necessary because the previous policy restricted it to authenticated users only

DROP POLICY IF EXISTS "Allow public read access to site_config" ON public.site_config;

CREATE POLICY "Allow public read access to site_config" ON public.site_config
    FOR SELECT
    USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
