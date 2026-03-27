-- Enable the pg_trgm extension for fuzzy text searching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Set a lower similarity threshold to catch more matches
-- Default is 0.3; we'll lower it to 0.2 for better partial matching
ALTER DATABASE postgres SET pg_trgm.similarity_threshold = 0.2;

-- Create GIN indexes on searchable columns for better performance
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_product_code_trgm ON products USING gin(product_code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_suppliers_name_trgm ON suppliers USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_outlets_name_trgm ON outlets USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_outlets_cost_centre_trgm ON outlets USING gin(cost_centre gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_food_groups_name_trgm ON food_groups USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_packaging_types_name_trgm ON packaging_types USING gin(name gin_trgm_ops);
