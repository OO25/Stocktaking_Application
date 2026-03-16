-- Units of measure (Kg, L, etc.)
CREATE TABLE units_of_measure (
    id         SERIAL       PRIMARY KEY,
    name       VARCHAR(20)  NOT NULL UNIQUE,
    description TEXT        NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);