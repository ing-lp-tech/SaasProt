-- Add 'stock_actual' column if it does not exist
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS stock_actual INTEGER DEFAULT 0;

-- Add 'cantidad_minima_mayorista' if it does not exist (checking just in case)
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS cantidad_minima_mayorista INTEGER DEFAULT 1;

-- Ensure 'precio_preventa_usd' exists
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS precio_preventa_usd NUMERIC;

-- Ensure 'precio_mayorista_usd' exists
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS precio_mayorista_usd NUMERIC;

-- Ensure 'precio_mayorista_ars' exists
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS precio_mayorista_ars NUMERIC;

-- Notify
COMMENT ON COLUMN public.productos.stock_actual IS 'Current stock quantity';
