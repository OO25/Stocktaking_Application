-- Outlets / branches
CREATE TABLE outlets (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    cost_centre VARCHAR(20)  NOT NULL UNIQUE,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Food Categories
CREATE TABLE food_groups (
    id         SERIAL       PRIMARY KEY,
    code       VARCHAR(20),
    name       VARCHAR(100) NOT NULL,
    parent_id  INT          REFERENCES food_groups(id),
    sort_order INT          NOT NULL DEFAULT 0
);

-- Packaging types 
CREATE TABLE packaging_types (
    id         SERIAL       PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0
);

-- Suppliers
CREATE TABLE suppliers (
    id           SERIAL       PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    contact_name VARCHAR(200),
    email        VARCHAR(200)
);
