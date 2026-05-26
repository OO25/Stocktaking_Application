-- Central product catalogue
CREATE TABLE products (
    id                SERIAL        PRIMARY KEY,
    is_packaging      BOOLEAN       NOT NULL DEFAULT false,
    food_group_id     INT           REFERENCES food_groups(id),
    packaging_type_id INT           REFERENCES packaging_types(id),
    name              VARCHAR(300)  NOT NULL,
    supplier_id       INT           REFERENCES suppliers(id),
    package_size      NUMERIC(10,2),
    uom_id            INT           REFERENCES units_of_measure(id),
    barcode           VARCHAR(50),
    unit_size         VARCHAR(50),
    price             NUMERIC(10,2) NOT NULL DEFAULT 0,
    last_price_check  DATE,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    food_subcategory_id INT,
    -- Food items must have a food_group, packaging must have a packaging_type
    CONSTRAINT chk_product_category CHECK (
        (is_packaging = false AND food_group_id IS NOT NULL) OR
        (is_packaging = true  AND packaging_type_id IS NOT NULL)
    ),
    CONSTRAINT fk_products_food_subcategory FOREIGN KEY (food_subcategory_id)
        REFERENCES food_groups(id)
);

-- Which products are stocked at which outlets
CREATE TABLE outlet_products (
    outlet_id  INT NOT NULL REFERENCES outlets(id),
    product_id INT NOT NULL REFERENCES products(id),
    PRIMARY KEY (outlet_id, product_id)
);
