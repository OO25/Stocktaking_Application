-- Replace the free-text uom column on products with a proper FK to units_of_measure

-- 1. Add the new FK column (nullable so existing rows aren't immediately broken)
ALTER TABLE products
  ADD COLUMN uom_id INT REFERENCES units_of_measure(id);

-- 2. Best-effort migration: match existing text values to units_of_measure by name (case-insensitive)
UPDATE products p
  SET uom_id = u.id
  FROM units_of_measure u
  WHERE LOWER(p.uom) = LOWER(u.name);

-- 3. Drop the old free-text column
ALTER TABLE products
  DROP COLUMN uom;
