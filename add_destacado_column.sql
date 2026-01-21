-- Add 'destacado' column to productos table
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS destacado BOOLEAN DEFAULT false;

-- Notify
COMMENT ON COLUMN public.productos.destacado IS 'Indicates if the product is featured in the store home page';
