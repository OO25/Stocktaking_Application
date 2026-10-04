-- A stocktake period groups all outlet counts for a month
CREATE TABLE stocktake_periods (
    id     SERIAL        PRIMARY KEY,
    month  SMALLINT      NOT NULL CHECK (month BETWEEN 1 AND 12),
    year   SMALLINT      NOT NULL CHECK (year >= 2020),
    status period_status NOT NULL DEFAULT 'draft',
    UNIQUE (month, year)
);

-- One session per outlet per period
CREATE TABLE stocktake_sessions (
    id           SERIAL           PRIMARY KEY,
    period_id    INT              NOT NULL REFERENCES stocktake_periods(id),
    outlet_id    INT              NOT NULL REFERENCES outlets(id),
    name         VARCHAR(255),
    submitted_at TIMESTAMPTZ,
    status       stocktake_status NOT NULL DEFAULT 'draft',
    counted_by   VARCHAR(100),
    counted_date DATE,
    UNIQUE (period_id, outlet_id)
);

-- Individual line items counted during a session
CREATE TABLE stocktake_entries (
    id               SERIAL        PRIMARY KEY,
    session_id       INT           NOT NULL REFERENCES stocktake_sessions(id),
    product_id       INT           NOT NULL REFERENCES products(id),
    quantity         NUMERIC(10,2) NOT NULL DEFAULT 0,
    unit_price       NUMERIC(10,2) NOT NULL,
    calculated_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    UNIQUE (session_id, product_id)
);

-- Ad-hoc items not in the master catalogue
CREATE TABLE stocktake_new_items (
    id            SERIAL        PRIMARY KEY,
    session_id    INT           NOT NULL REFERENCES stocktake_sessions(id),
    food_group_id INT           REFERENCES food_groups(id),
    name          VARCHAR(300)  NOT NULL DEFAULT '',
    barcode       VARCHAR(50),
    package_size  NUMERIC(10,2),
    uom_id        INT           REFERENCES units_of_measure(id),
    description   VARCHAR(300)  NOT NULL,
    price         NUMERIC(10,2) NOT NULL,
    quantity      NUMERIC(10,2) NOT NULL DEFAULT 0,
    total         NUMERIC(12,2) GENERATED ALWAYS AS (quantity * price) STORED,
    is_one_off    BOOLEAN       NOT NULL DEFAULT false,
    CONSTRAINT stocktake_new_items_barcode_key UNIQUE (barcode)
);
