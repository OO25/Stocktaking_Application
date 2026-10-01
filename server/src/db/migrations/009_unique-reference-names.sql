-- Do not silently merge or delete existing reference data. If duplicates exist,
-- resolve their names before applying these indexes; the transaction rolls back.
BEGIN;
CREATE UNIQUE INDEX food_groups_normalized_name_key ON food_groups (LOWER(BTRIM(name)));
CREATE UNIQUE INDEX packaging_types_normalized_name_key ON packaging_types (LOWER(BTRIM(name)));
CREATE UNIQUE INDEX units_of_measure_normalized_name_key ON units_of_measure (LOWER(BTRIM(name)));
COMMIT;
