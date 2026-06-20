-- Database schema for Business Manager App

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE referers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(25) NOT NULL,
    date DATE NOT NULL,
    offer_rate INT,
    notes VARCHAR(255),
    related_image BYTEA,
    UNIQUE (name, date)
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(25) NOT NULL,
    date DATE NOT NULL,
    phone VARCHAR(20),
    zalo VARCHAR(100) NOT NULL,
    address VARCHAR(50),
    location POINT,
    type VARCHAR(20) CHECK (type IN ('Grab','Be','Tada','Ahamove','Lalamove','Wholesale Customer','Other')),
    notes VARCHAR(255),
    related_image1 BYTEA,
-- Removed combos and combo_products tables in favor of direct order-product relation
);
CREATE TABLE order_products (
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_name VARCHAR(50) REFERENCES products(name) ON DELETE RESTRICT,
    quantity INT CHECK (quantity > 0),
    PRIMARY KEY (order_id, product_name)
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_date DATE NOT NULL,
    purchase_date DATE,
    ship_cost INT,
    net_profit INT,
    net_profit_margin NUMERIC(2,2),
    referrer_fee INT,
    surcharge_fee INT,
    notes VARCHAR(255),
    related_image BYTEA,
    customer_id INT REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE combos (
    name VARCHAR(50) PRIMARY KEY,
    date_effective DATE,
    price NUMERIC(12,2),
    notes VARCHAR(255),
    related_image BYTEA
);

CREATE TABLE products (
    name VARCHAR(50) PRIMARY KEY,
    classical_name VARCHAR(50),
    net_price INT,
    quantity INT CHECK (quantity >= 0 AND quantity < 1000000),
    notes VARCHAR(255),
    related_image BYTEA
);

CREATE TABLE stocks (
    id SERIAL PRIMARY KEY,
    import_date DATE NOT NULL,
    import_price INT,
    quantity INT CHECK (quantity >= 0 AND quantity < 1000),
    gift_quantity INT CHECK (gift_quantity >= 0 AND gift_quantity < 100),
    notes VARCHAR(255),
    related_image BYTEA,
    product_name VARCHAR(50) REFERENCES products(name) ON DELETE CASCADE
);

CREATE TABLE order_combos (
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    combo_name VARCHAR(50) REFERENCES combos(name) ON DELETE CASCADE,
    PRIMARY KEY (order_id, combo_name)
);

CREATE TABLE combo_products (
    combo_name VARCHAR(50) REFERENCES combos(name) ON DELETE CASCADE,
    product_name VARCHAR(50) REFERENCES products(name) ON DELETE CASCADE,
    PRIMARY KEY (combo_name, product_name)
);
