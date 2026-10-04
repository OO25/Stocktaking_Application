--
-- PostgreSQL database dump
--

\restrict MHSdF3O7S763dyyq35Z8xQm1KHeBZB6cR3RERTZRVuDcwi62c6woeDmkypufmqQ

-- Dumped from database version 17.10 (322a063)
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: period_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.period_status AS ENUM (
    'draft',
    'active',
    'complete'
);


ALTER TYPE public.period_status OWNER TO neondb_owner;

--
-- Name: stocktake_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.stocktake_status AS ENUM (
    'draft',
    'in_progress',
    'submitted',
    'locked'
);


ALTER TYPE public.stocktake_status OWNER TO neondb_owner;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public._migrations (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public._migrations OWNER TO neondb_owner;

--
-- Name: _migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public._migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._migrations_id_seq OWNER TO neondb_owner;

--
-- Name: _migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public._migrations_id_seq OWNED BY public._migrations.id;


--
-- Name: food_groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.food_groups (
    id integer NOT NULL,
    code character varying(20),
    name character varying(100) NOT NULL,
    parent_id integer,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.food_groups OWNER TO neondb_owner;

--
-- Name: food_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.food_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.food_groups_id_seq OWNER TO neondb_owner;

--
-- Name: food_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.food_groups_id_seq OWNED BY public.food_groups.id;


--
-- Name: outlet_products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.outlet_products (
    outlet_id integer NOT NULL,
    product_id integer NOT NULL
);


ALTER TABLE public.outlet_products OWNER TO neondb_owner;

--
-- Name: outlets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.outlets (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    cost_centre character varying(20) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.outlets OWNER TO neondb_owner;

--
-- Name: outlets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.outlets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.outlets_id_seq OWNER TO neondb_owner;

--
-- Name: outlets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.outlets_id_seq OWNED BY public.outlets.id;


--
-- Name: packaging_types; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.packaging_types (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.packaging_types OWNER TO neondb_owner;

--
-- Name: packaging_types_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.packaging_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.packaging_types_id_seq OWNER TO neondb_owner;

--
-- Name: packaging_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.packaging_types_id_seq OWNED BY public.packaging_types.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id integer NOT NULL,
    is_packaging boolean DEFAULT false NOT NULL,
    food_group_id integer,
    packaging_type_id integer,
    name character varying(300) NOT NULL,
    supplier_id integer,
    package_size numeric(10,2),
    barcode character varying(50),
    unit_size character varying(50),
    price numeric(10,2) DEFAULT 0 NOT NULL,
    last_price_check date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    uom_id integer,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    food_subcategory_id integer,
    CONSTRAINT chk_product_category CHECK ((((is_packaging = false) AND (food_group_id IS NOT NULL)) OR ((is_packaging = true) AND (packaging_type_id IS NOT NULL))))
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: stocktake_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stocktake_entries (
    id integer NOT NULL,
    session_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity numeric(10,2) DEFAULT 0 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    calculated_total numeric(12,2) GENERATED ALWAYS AS ((quantity * unit_price)) STORED
);


ALTER TABLE public.stocktake_entries OWNER TO neondb_owner;

--
-- Name: stocktake_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stocktake_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stocktake_entries_id_seq OWNER TO neondb_owner;

--
-- Name: stocktake_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stocktake_entries_id_seq OWNED BY public.stocktake_entries.id;


--
-- Name: stocktake_new_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stocktake_new_items (
    id integer NOT NULL,
    session_id integer NOT NULL,
    food_group_id integer,
    description character varying(300) NOT NULL,
    price numeric(10,2) NOT NULL,
    quantity numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) GENERATED ALWAYS AS ((quantity * price)) STORED,
    is_one_off boolean DEFAULT false NOT NULL,
    barcode character varying(50),
    name character varying(300) DEFAULT ''::character varying NOT NULL,
    package_size numeric(10,2),
    uom_id integer
);


ALTER TABLE public.stocktake_new_items OWNER TO neondb_owner;

--
-- Name: stocktake_new_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stocktake_new_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stocktake_new_items_id_seq OWNER TO neondb_owner;

--
-- Name: stocktake_new_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stocktake_new_items_id_seq OWNED BY public.stocktake_new_items.id;


--
-- Name: stocktake_periods; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stocktake_periods (
    id integer NOT NULL,
    month smallint NOT NULL,
    year smallint NOT NULL,
    status public.period_status DEFAULT 'draft'::public.period_status NOT NULL,
    CONSTRAINT stocktake_periods_month_check CHECK (((month >= 1) AND (month <= 12))),
    CONSTRAINT stocktake_periods_year_check CHECK ((year >= 2020))
);


ALTER TABLE public.stocktake_periods OWNER TO neondb_owner;

--
-- Name: stocktake_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stocktake_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stocktake_periods_id_seq OWNER TO neondb_owner;

--
-- Name: stocktake_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stocktake_periods_id_seq OWNED BY public.stocktake_periods.id;


--
-- Name: stocktake_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stocktake_sessions (
    id integer NOT NULL,
    period_id integer NOT NULL,
    outlet_id integer NOT NULL,
    status public.stocktake_status DEFAULT 'draft'::public.stocktake_status NOT NULL,
    counted_by character varying(100),
    counted_date date,
    name character varying(255),
    submitted_at timestamp with time zone
);


ALTER TABLE public.stocktake_sessions OWNER TO neondb_owner;

--
-- Name: stocktake_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stocktake_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stocktake_sessions_id_seq OWNER TO neondb_owner;

--
-- Name: stocktake_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stocktake_sessions_id_seq OWNED BY public.stocktake_sessions.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    contact_name character varying(200),
    email character varying(200),
    website_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    phone character varying(50)
);


ALTER TABLE public.suppliers OWNER TO neondb_owner;

--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO neondb_owner;

--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: units_of_measure; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.units_of_measure (
    id integer NOT NULL,
    name character varying(20) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.units_of_measure OWNER TO neondb_owner;

--
-- Name: units_of_measure_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.units_of_measure_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.units_of_measure_id_seq OWNER TO neondb_owner;

--
-- Name: units_of_measure_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.units_of_measure_id_seq OWNED BY public.units_of_measure.id;


--
-- Name: user_outlets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_outlets (
    user_id integer NOT NULL,
    outlet_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_outlets OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password_hash text NOT NULL,
    role character varying(50) DEFAULT 'viewer'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name character varying(200),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying, 'viewer'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: _migrations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public._migrations ALTER COLUMN id SET DEFAULT nextval('public._migrations_id_seq'::regclass);


--
-- Name: food_groups id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.food_groups ALTER COLUMN id SET DEFAULT nextval('public.food_groups_id_seq'::regclass);


--
-- Name: outlets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.outlets ALTER COLUMN id SET DEFAULT nextval('public.outlets_id_seq'::regclass);


--
-- Name: packaging_types id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.packaging_types ALTER COLUMN id SET DEFAULT nextval('public.packaging_types_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: stocktake_entries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_entries ALTER COLUMN id SET DEFAULT nextval('public.stocktake_entries_id_seq'::regclass);


--
-- Name: stocktake_new_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_new_items ALTER COLUMN id SET DEFAULT nextval('public.stocktake_new_items_id_seq'::regclass);


--
-- Name: stocktake_periods id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_periods ALTER COLUMN id SET DEFAULT nextval('public.stocktake_periods_id_seq'::regclass);


--
-- Name: stocktake_sessions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_sessions ALTER COLUMN id SET DEFAULT nextval('public.stocktake_sessions_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: units_of_measure id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.units_of_measure ALTER COLUMN id SET DEFAULT nextval('public.units_of_measure_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: _migrations _migrations_filename_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public._migrations
    ADD CONSTRAINT _migrations_filename_key UNIQUE (filename);


--
-- Name: _migrations _migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public._migrations
    ADD CONSTRAINT _migrations_pkey PRIMARY KEY (id);


--
-- Name: food_groups food_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.food_groups
    ADD CONSTRAINT food_groups_pkey PRIMARY KEY (id);


--
-- Name: outlet_products outlet_products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.outlet_products
    ADD CONSTRAINT outlet_products_pkey PRIMARY KEY (outlet_id, product_id);


--
-- Name: outlets outlets_cost_centre_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.outlets
    ADD CONSTRAINT outlets_cost_centre_key UNIQUE (cost_centre);


--
-- Name: outlets outlets_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.outlets
    ADD CONSTRAINT outlets_name_key UNIQUE (name);


--
-- Name: outlets outlets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.outlets
    ADD CONSTRAINT outlets_pkey PRIMARY KEY (id);


--
-- Name: packaging_types packaging_types_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.packaging_types
    ADD CONSTRAINT packaging_types_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: stocktake_entries stocktake_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_entries
    ADD CONSTRAINT stocktake_entries_pkey PRIMARY KEY (id);


--
-- Name: stocktake_entries stocktake_entries_session_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_entries
    ADD CONSTRAINT stocktake_entries_session_id_product_id_key UNIQUE (session_id, product_id);


--
-- Name: stocktake_new_items stocktake_new_items_barcode_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_new_items
    ADD CONSTRAINT stocktake_new_items_barcode_key UNIQUE (barcode);


--
-- Name: stocktake_new_items stocktake_new_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_new_items
    ADD CONSTRAINT stocktake_new_items_pkey PRIMARY KEY (id);


--
-- Name: stocktake_periods stocktake_periods_month_year_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_periods
    ADD CONSTRAINT stocktake_periods_month_year_key UNIQUE (month, year);


--
-- Name: stocktake_periods stocktake_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_periods
    ADD CONSTRAINT stocktake_periods_pkey PRIMARY KEY (id);


--
-- Name: stocktake_sessions stocktake_sessions_period_id_outlet_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_sessions
    ADD CONSTRAINT stocktake_sessions_period_id_outlet_id_key UNIQUE (period_id, outlet_id);


--
-- Name: stocktake_sessions stocktake_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_sessions
    ADD CONSTRAINT stocktake_sessions_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: units_of_measure units_of_measure_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.units_of_measure
    ADD CONSTRAINT units_of_measure_name_key UNIQUE (name);


--
-- Name: units_of_measure units_of_measure_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.units_of_measure
    ADD CONSTRAINT units_of_measure_pkey PRIMARY KEY (id);


--
-- Name: user_outlets user_outlets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_outlets
    ADD CONSTRAINT user_outlets_pkey PRIMARY KEY (user_id, outlet_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_products_food_group; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_products_food_group ON public.products USING btree (food_group_id);


--
-- Name: idx_products_name; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_products_name ON public.products USING btree (name);


--
-- Name: idx_products_packaging_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_products_packaging_type ON public.products USING btree (packaging_type_id);


--
-- Name: idx_products_supplier; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_products_supplier ON public.products USING btree (supplier_id);


--
-- Name: users_username_lower_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX users_username_lower_idx ON public.users USING btree (lower((username)::text));


--
-- Name: outlets outlets_set_updated_at; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER outlets_set_updated_at BEFORE UPDATE ON public.outlets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: products fk_products_food_subcategory; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_food_subcategory FOREIGN KEY (food_subcategory_id) REFERENCES public.food_groups(id);


--
-- Name: food_groups food_groups_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.food_groups
    ADD CONSTRAINT food_groups_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.food_groups(id);


--
-- Name: outlet_products outlet_products_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.outlet_products
    ADD CONSTRAINT outlet_products_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id);


--
-- Name: outlet_products outlet_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.outlet_products
    ADD CONSTRAINT outlet_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: products products_food_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_food_group_id_fkey FOREIGN KEY (food_group_id) REFERENCES public.food_groups(id);


--
-- Name: products products_packaging_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_packaging_type_id_fkey FOREIGN KEY (packaging_type_id) REFERENCES public.packaging_types(id);


--
-- Name: products products_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: products products_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.units_of_measure(id);


--
-- Name: stocktake_entries stocktake_entries_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_entries
    ADD CONSTRAINT stocktake_entries_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: stocktake_entries stocktake_entries_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_entries
    ADD CONSTRAINT stocktake_entries_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.stocktake_sessions(id);


--
-- Name: stocktake_new_items stocktake_new_items_food_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_new_items
    ADD CONSTRAINT stocktake_new_items_food_group_id_fkey FOREIGN KEY (food_group_id) REFERENCES public.food_groups(id);


--
-- Name: stocktake_new_items stocktake_new_items_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_new_items
    ADD CONSTRAINT stocktake_new_items_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.stocktake_sessions(id);


--
-- Name: stocktake_sessions stocktake_sessions_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_sessions
    ADD CONSTRAINT stocktake_sessions_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id);


--
-- Name: stocktake_sessions stocktake_sessions_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stocktake_sessions
    ADD CONSTRAINT stocktake_sessions_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.stocktake_periods(id);


--
-- Name: user_outlets user_outlets_outlet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_outlets
    ADD CONSTRAINT user_outlets_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE;


--
-- Name: user_outlets user_outlets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_outlets
    ADD CONSTRAINT user_outlets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict MHSdF3O7S763dyyq35Z8xQm1KHeBZB6cR3RERTZRVuDcwi62c6woeDmkypufmqQ

