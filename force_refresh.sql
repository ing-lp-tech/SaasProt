-- FORCE RELOAD SCHEMA CACHE
-- Ejecuta esto para decirle a Supabase que ya creaste la tabla y debe actualizarse.

NOTIFY pgrst, 'reload config';
