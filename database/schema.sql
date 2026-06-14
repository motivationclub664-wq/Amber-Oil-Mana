-- Generated schema from database

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE combo_products (
    combo_name VARCHAR(50) NOT NULL,
    product_name VARCHAR(50) NOT NULL
);

ALTER TABLE combo_products ADD CONSTRAINT combo_products_pkey PRIMARY KEY (combo_name, product_name);
ALTER TABLE combo_products ADD CONSTRAINT combo_products_combo_name_fkey FOREIGN KEY (combo_name) REFERENCES combos(name) ON DELETE CASCADE;
ALTER TABLE combo_products ADD CONSTRAINT combo_products_product_name_fkey FOREIGN KEY (product_name) REFERENCES products(name) ON DELETE CASCADE;
CREATE UNIQUE INDEX combo_products_pkey ON public.combo_products USING btree (combo_name, product_name);

CREATE TABLE combos (
    name VARCHAR(50) NOT NULL,
    date_effective DATE,
    price NUMERIC(12,2),
    notes VARCHAR(255),
    related_image BYTEA
);

ALTER TABLE combos ADD CONSTRAINT combos_pkey PRIMARY KEY (name);
CREATE UNIQUE INDEX combos_pkey ON public.combos USING btree (name);

CREATE TABLE customers (
    id INTEGER NOT NULL DEFAULT nextval('customers_id_seq'::regclass),
    name VARCHAR(25) NOT NULL,
    date DATE NOT NULL,
    phone VARCHAR(20),
    zalo VARCHAR(100) NOT NULL,
    address VARCHAR(50),
    location POINT,
    type VARCHAR(20),
    notes VARCHAR(255),
    related_image1 BYTEA,
    related_image2 BYTEA,
    related_image3 BYTEA,
    related_image4 BYTEA,
    referer_id INTEGER
);

ALTER TABLE customers ADD CONSTRAINT customers_type_check CHECK (((type)::text = ANY ((ARRAY['Grab'::character varying, 'Be'::character varying, 'Tada'::character varying, 'Ahamove'::character varying, 'Lalamove'::character varying, 'Wholesale Customer'::character varying, 'Other'::character varying])::text[])));
ALTER TABLE customers ADD CONSTRAINT customers_pkey PRIMARY KEY (id);
ALTER TABLE customers ADD CONSTRAINT customers_name_zalo_key UNIQUE (name, zalo);
ALTER TABLE customers ADD CONSTRAINT customers_referer_id_fkey FOREIGN KEY (referer_id) REFERENCES referers(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);
CREATE UNIQUE INDEX customers_name_zalo_key ON public.customers USING btree (name, zalo);

CREATE TABLE order_combos (
    order_id INTEGER NOT NULL,
    combo_name VARCHAR(50) NOT NULL
);

ALTER TABLE order_combos ADD CONSTRAINT order_combos_pkey PRIMARY KEY (order_id, combo_name);
ALTER TABLE order_combos ADD CONSTRAINT order_combos_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE order_combos ADD CONSTRAINT order_combos_combo_name_fkey FOREIGN KEY (combo_name) REFERENCES combos(name) ON DELETE CASCADE;
CREATE UNIQUE INDEX order_combos_pkey ON public.order_combos USING btree (order_id, combo_name);

CREATE TABLE order_products (
    order_id INTEGER NOT NULL,
    product_name VARCHAR(50) NOT NULL,
    quantity INTEGER
);

ALTER TABLE order_products ADD CONSTRAINT order_products_quantity_check CHECK ((quantity > 0));
ALTER TABLE order_products ADD CONSTRAINT order_products_pkey PRIMARY KEY (order_id, product_name);
ALTER TABLE order_products ADD CONSTRAINT order_products_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE order_products ADD CONSTRAINT order_products_product_name_fkey FOREIGN KEY (product_name) REFERENCES products(name) ON DELETE RESTRICT;
CREATE UNIQUE INDEX order_products_pkey ON public.order_products USING btree (order_id, product_name);

CREATE TABLE orders (
    id INTEGER NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
    order_date DATE NOT NULL,
    purchase_date DATE,
    ship_cost NUMERIC(12,2),
    net_profit NUMERIC(12,2),
    net_profit_margin NUMERIC(5,2),
    referrer_fee NUMERIC(12,2),
    notes VARCHAR(255),
    related_image BYTEA,
    customer_id INTEGER,
    total INTEGER,
    discount NUMERIC(5,2),
    surcharge INTEGER
);

ALTER TABLE orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);

CREATE TABLE products (
    name VARCHAR(50) NOT NULL,
    classical_name VARCHAR(50),
    net_price NUMERIC(12,2),
    quantity INTEGER,
    notes VARCHAR(255),
    related_image BYTEA,
    sale_price NUMERIC(12,2)
);

ALTER TABLE products ADD CONSTRAINT products_pkey PRIMARY KEY (name);
ALTER TABLE products ADD CONSTRAINT products_quantity_check CHECK (((quantity >= 0) AND (quantity < 1000000)));
CREATE UNIQUE INDEX products_pkey ON public.products USING btree (name);

CREATE TABLE referers (
    id INTEGER NOT NULL DEFAULT nextval('referers_id_seq'::regclass),
    name VARCHAR(25) NOT NULL,
    date DATE NOT NULL,
    offer_rate NUMERIC(5,2),
    notes VARCHAR(255),
    related_image BYTEA
);

ALTER TABLE referers ADD CONSTRAINT referers_pkey PRIMARY KEY (id);
ALTER TABLE referers ADD CONSTRAINT referers_name_date_key UNIQUE (name, date);
CREATE UNIQUE INDEX referers_pkey ON public.referers USING btree (id);
CREATE UNIQUE INDEX referers_name_date_key ON public.referers USING btree (name, date);

CREATE TABLE stocks (
    id INTEGER NOT NULL DEFAULT nextval('stocks_id_seq'::regclass),
    import_date DATE NOT NULL,
    import_price NUMERIC(12,2),
    quantity INTEGER,
    gift_quantity INTEGER,
    notes VARCHAR(255),
    related_image BYTEA,
    product_name VARCHAR(50)
);

ALTER TABLE stocks ADD CONSTRAINT stocks_pkey PRIMARY KEY (id);
ALTER TABLE stocks ADD CONSTRAINT stocks_product_name_fkey FOREIGN KEY (product_name) REFERENCES products(name) ON DELETE CASCADE;
ALTER TABLE stocks ADD CONSTRAINT stocks_quantity_check CHECK ((quantity >= 0));
ALTER TABLE stocks ADD CONSTRAINT stocks_gift_quantity_check CHECK ((gift_quantity >= 0));
CREATE UNIQUE INDEX stocks_pkey ON public.stocks USING btree (id);

