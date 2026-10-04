-- Indexes so the queries are faster
CREATE INDEX IF NOT EXISTS idx_products_food_group     ON products (food_group_id);
CREATE INDEX IF NOT EXISTS idx_products_packaging_type ON products (packaging_type_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier       ON products (supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_name           ON products (name);
