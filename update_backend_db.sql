-- Add tenant_id to manual_audaces table
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT id INTO default_tenant_id FROM public.tenants WHERE subdomain = 'default' LIMIT 1;

    -- Create manual_audaces if not exists (it should exist based on server.js)
    -- But just in case
    CREATE TABLE IF NOT EXISTS public.manual_audaces (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content TEXT,
      metadata JSONB,
      embedding vector(1536),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Add tenant_id
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'manual_audaces' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.manual_audaces ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        
        IF default_tenant_id IS NOT NULL THEN
            UPDATE public.manual_audaces SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        END IF;
    END IF;

    -- Update match_documents function to filter by tenant_id
    -- We need to drop and recreate it because we are changing signature
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

END $$;
