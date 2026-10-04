-- Custom enum types used across the schema
CREATE TYPE period_status AS ENUM ('draft', 'active', 'complete');
CREATE TYPE stocktake_status AS ENUM ('draft', 'in_progress', 'submitted', 'locked');
