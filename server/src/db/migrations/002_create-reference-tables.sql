-- Outlets / branches
CREATE TABLE outlets (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    cost_centre VARCHAR(20)  NOT NULL UNIQUE,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Food Categories
CREATE TABLE food_groups (
    id         SERIAL       PRIMARY KEY,
    code       VARCHAR(20),
    name       VARCHAR(100) NOT NULL,
    parent_id  INT          REFERENCES food_groups(id),
    sort_order INT          NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Packaging types 
CREATE TABLE packaging_types (
    id         SERIAL       PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Units of measure (Kg, L, etc.)
CREATE TABLE units_of_measure (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(20)  NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Suppliers
CREATE TABLE suppliers (
    id           SERIAL       PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    contact_name VARCHAR(200),
    email        VARCHAR(200),
    phone        VARCHAR(50),
        website_url  TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Shared trigger function for updated_at columns
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER outlets_set_updated_at
BEFORE UPDATE ON outlets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
