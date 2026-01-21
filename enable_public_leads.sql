-- =================================================================
-- ENABLE PUBLIC LEADS CAPTURE
-- This script ensures the 'leads' table exists and allows public inserts
-- so users on the Landing Page can request a store.
-- =================================================================

-- 1. Create or Update Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT,
    telefono TEXT,
    email TEXT,
    mensaje TEXT,
    social_link TEXT,
    origen TEXT DEFAULT 'landing',
    estado TEXT DEFAULT 'nuevo', -- nuevo, contactado, descartado, cliente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add email column if it doesn't exist (migrations safe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'email') THEN
        ALTER TABLE public.leads ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'mensaje') THEN
        ALTER TABLE public.leads ADD COLUMN mensaje TEXT;
    END IF;

     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'estado') THEN
        ALTER TABLE public.leads ADD COLUMN estado TEXT DEFAULT 'nuevo';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'social_link') THEN
        ALTER TABLE public.leads ADD COLUMN social_link TEXT;
    END IF;
END $$;

-- 2. Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow Public (Anon) INSERT
-- This allows anyone on the internet to send a lead form.
DROP POLICY IF EXISTS "Allow public insert leads" ON public.leads;
CREATE POLICY "Allow public insert leads" ON public.leads
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 4. Policy: Allow Admin Read/Update
-- Only authenticated users (admins) can view leads.
-- (We assume admins are authenticated. We can refine to 'role=owner' later if needed)
DROP POLICY IF EXISTS "Allow authenticated read leads" ON public.leads;
CREATE POLICY "Allow authenticated read leads" ON public.leads
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated update leads" ON public.leads;
CREATE POLICY "Allow authenticated update leads" ON public.leads
    FOR UPDATE
    TO authenticated
    USING (true);

-- Notify
NOTIFY pgrst, 'reload config';
