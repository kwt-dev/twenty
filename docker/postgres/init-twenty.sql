-- Twenty CRM Database Initialization Script

-- Enable required extensions (based on Twenty's setup-db.ts)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgres_fdw";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create default schema if not exists
CREATE SCHEMA IF NOT EXISTS "public";

-- Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Set default search path
ALTER DATABASE twenty SET search_path TO public;

-- Create metadata schema for Twenty
CREATE SCHEMA IF NOT EXISTS "metadata";
GRANT ALL ON SCHEMA metadata TO postgres;

-- Create core schema for Twenty
CREATE SCHEMA IF NOT EXISTS "core";
GRANT ALL ON SCHEMA core TO postgres;

-- Performance optimizations for Twenty
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;

-- Connection pooling optimizations
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET max_prepared_transactions = 100;

-- Enable query performance monitoring  
-- Note: pg_stat_statements requires restart to take effect
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
-- ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Log slow queries for debugging (optional)
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries slower than 1 second

-- Apply settings (requires restart in production)
SELECT pg_reload_conf();

-- Create initial workspace schema placeholder
-- Twenty will create the actual workspace schemas dynamically
DO $$
BEGIN
    RAISE NOTICE 'Twenty database initialized successfully';
    RAISE NOTICE 'Required extensions installed: uuid-ossp, postgres_fdw, pg_trgm';
    RAISE NOTICE 'Schemas created: public, metadata, core';
END $$;