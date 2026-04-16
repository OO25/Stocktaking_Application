ALTER TABLE stocktake_new_items
ADD COLUMN IF NOT EXISTS name VARCHAR(300),
ADD COLUMN IF NOT EXISTS barcode VARCHAR(50),
ADD COLUMN IF NOT EXISTS package_size NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS uom_id INT REFERENCES units_of_measure(id);

-- Backfill structured fields from legacy description when possible.
UPDATE stocktake_new_items
SET name = split_part(description, ' | ', 1)
WHERE (name IS NULL OR name = '')
  AND description IS NOT NULL;

UPDATE stocktake_new_items
SET package_size = NULLIF(split_part(description, ' | ', 2), '')::numeric
WHERE package_size IS NULL
  AND description IS NOT NULL
  AND split_part(description, ' | ', 2) ~ '^[0-9]+(\.[0-9]+)?$';

UPDATE stocktake_new_items sni
SET uom_id = u.id
FROM units_of_measure u
WHERE sni.uom_id IS NULL
  AND lower(u.name) = lower(split_part(sni.description, ' | ', 3));
