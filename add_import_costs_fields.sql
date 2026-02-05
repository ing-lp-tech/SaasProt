-- Agregar campos para costos de importación y conversión de moneda
-- Ejecutar DESPUÉS de crear la tabla purchase_drafts

ALTER TABLE public.purchase_drafts 
ADD COLUMN IF NOT EXISTS gastos_importacion NUMERIC DEFAULT 0;

ALTER TABLE public.purchase_drafts 
ADD COLUMN IF NOT EXISTS tipo_dolar TEXT DEFAULT 'blue';

ALTER TABLE public.purchase_drafts 
ADD COLUMN IF NOT EXISTS cotizacion_dolar NUMERIC;

ALTER TABLE public.purchase_drafts 
ADD COLUMN IF NOT EXISTS precio_final_ars NUMERIC;

-- Comentario: 
-- gastos_importacion: Costos adicionales de envío/importación en USD
-- tipo_dolar: 'blue' o 'oficial' 
-- cotizacion_dolar: Valor del dólar al momento del cálculo
-- precio_final_ars: Precio final por unidad en pesos argentinos
