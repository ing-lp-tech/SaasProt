-- Add missing 'activo' column to categorias table
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Reload Schema Cache to ensure the API picks up the new column
NOTIFY pgrst, 'reload config';
