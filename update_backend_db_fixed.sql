-- 0. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Create manual_audaces if not exists
CREATE TABLE IF NOT EXISTS public.manual_audaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT,
  metadata JSONB,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Add tenant_id column (safely)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'manual_audaces' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.manual_audaces ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END $$;

-- 3. Set default tenant_id for existing records
UPDATE public.manual_audaces 
SET tenant_id = (SELECT id FROM public.tenants WHERE subdomain = 'default' LIMIT 1) 
WHERE tenant_id IS NULL;

-- 4. Update match_documents function to filter by tenant_id
DROP FUNCTION IF EXISTS public.match_documents;

CREATE OR REPLACE FUNCTION public.match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_tenant_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    manual_audaces.id,
    manual_audaces.content,
    manual_audaces.metadata,
    1 - (manual_audaces.embedding <=> query_embedding) as similarity
  FROM manual_audaces
  WHERE 1 - (manual_audaces.embedding <=> query_embedding) > match_threshold
  AND manual_audaces.tenant_id = filter_tenant_id
  ORDER BY manual_audaces.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
