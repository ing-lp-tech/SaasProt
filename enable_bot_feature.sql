-- Run this in your Supabase SQL Editor
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS bot_enabled BOOLEAN DEFAULT FALSE;
