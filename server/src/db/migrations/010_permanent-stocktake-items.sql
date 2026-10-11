-- Keep the counted item as a historical snapshot when copying it to the catalogue.
ALTER TABLE stocktake_new_items
    ADD COLUMN permanent_product_id INT REFERENCES products(id);
