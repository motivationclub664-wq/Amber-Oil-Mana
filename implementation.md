# Business Manager App – Full Project Specification

## 1. Overview
A web application for managing a small business: products, imports (stock), sales (orders), customers, referrers, combos, revenue, and profit.  
The app provides CRUD + duplicate operations on every main entity and a dashboard with key metrics.

**User role**: Shop owner / employee (no complex auth for now).  
**Deployment**: Vercel + Neon (PostgreSQL).  
**UI**: Beautiful, professional, responsive, with animations.

---

## 2. Technology Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, Framer Motion, Recharts
- **Backend**: Next.js API Routes (serverless functions on Vercel)
- **Database**: PostgreSQL on Neon (cloud), using `@neondatabase/serverless` for serverless pooling
- **Image storage**: Base64 text in `BYTEA` (or `TEXT`) columns

---

## 3. Directory Structure
business-manager/
├── .env.local
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── database/
│ └── schema.sql # Single script to create all tables
├── lib/
│ ├── db.ts # PostgreSQL pool connection
│ └── utils.ts # Currency/date formatting, helpers
├── app/
│ ├── layout.tsx # Root layout with sidebar & header
│ ├── page.tsx # Dashboard page
│ ├── referers/
│ │ └── page.tsx # Referer management page
│ ├── customers/
│ │ └── page.tsx
│ ├── products/
│ │ └── page.tsx
│ ├── orders/
│ │ └── page.tsx
│ ├── combos/
│ │ └── page.tsx
│ ├── stocks/
│ │ └── page.tsx
│ └── api/
│ ├── referers/
│ │ └── route.ts # CRUD + Duplicate for Referers
│ ├── customers/
│ │ └── route.ts
│ ├── products/
│ │ └── route.ts
│ ├── orders/
│ │ └── route.ts
│ ├── combos/
│ │ └── route.ts
│ ├── stocks/
│ │ └── route.ts
│ └── dashboard/
│ └── route.ts # Dashboard metrics API
├── components/
│ ├── Layout.tsx
│ ├── Sidebar.tsx
│ ├── Header.tsx
│ ├── DataTable.tsx # Reusable data table with search, pagination, actions
│ ├── Modal.tsx # Reusable modal
│ ├── FormFields/
│ │ ├── RefererForm.tsx
│ │ ├── CustomerForm.tsx
│ │ ├── ProductForm.tsx
│ │ ├── OrderForm.tsx
│ │ ├── ComboForm.tsx
│ │ └── StockForm.tsx
│ ├── ImageUpload.tsx # File to base64 component
│ ├── StatsCard.tsx
│ └── charts/
│ └── RevenueChart.tsx
└── public/
└── ... (static assets if any)

text

---

## 4. Database Schema (PostgreSQL)

**Important design decision**: Although the original requirement specified composite keys `(Name, Date)` for Referer and `(Name, Zalo)` for Customer, for practical foreign key relationships we introduce a surrogate `id SERIAL PRIMARY KEY` in **every** table. The required composite uniqueness is enforced via `UNIQUE` constraints. All foreign keys reference the `id` column.

### 4.1 Table `referers`
| Column         | Type            | Constraints                              |
|----------------|-----------------|------------------------------------------|
| id             | SERIAL          | PRIMARY KEY                              |
| name           | VARCHAR(25)     | NOT NULL                                 |
| date           | DATE            | NOT NULL                                 |
| offer_rate     | NUMERIC(5,2)    | (percentage, e.g., 5.00)                 |
| notes          | VARCHAR(255)    |                                          |
| related_image  | BYTEA           | stores full image binary (or base64)     |
| **UNIQUE**     | (name, date)    |                                          |

### 4.2 Table `customers`
| Column          | Type            | Constraints                              |
|-----------------|-----------------|------------------------------------------|
| id              | SERIAL          | PRIMARY KEY                              |
| name            | VARCHAR(25)     | NOT NULL                                 |
| date            | DATE            | NOT NULL                                 |
| phone           | VARCHAR(20)     |                                          |
| zalo            | VARCHAR(100)    | NOT NULL                                 |
| address         | VARCHAR(50)     |                                          |
| location        | POINT           | (lat, lng)                                |
| type            | VARCHAR(20)     | CHECK (IN 'Grab','Be','Tada','Ahamove','Lalamove','Wholesale Customer','Other') |
| notes           | VARCHAR(255)    |                                          |
| related_image1  | BYTEA           |                                          |
| related_image2  | BYTEA           |                                          |
| related_image3  | BYTEA           |                                          |
| related_image4  | BYTEA           |                                          |
| referer_id      | INT             | REFERENCES referers(id) ON DELETE SET NULL |
| **UNIQUE**      | (name, zalo)    |                                          |

### 4.3 Table `orders`
| Column            | Type            | Constraints                              |
|-------------------|-----------------|------------------------------------------|
| id                | SERIAL          | PRIMARY KEY                              |
| order_date        | DATE            | NOT NULL                                 |
| purchase_date     | DATE            |                                          |
| ship_cost         | NUMERIC(12,2)   | VND                                      |
| surcharge         | INT             | VND                                      |
| net_profit        | NUMERIC(12,2)   | VND                                      |
| net_profit_margin | NUMERIC(5,2)    | percentage                               |
| referrer_fee      | NUMERIC(12,2)   | VND                                      |
| notes             | VARCHAR(255)    |                                          |
| related_image     | BYTEA           |                                          |
| customer_id       | INT             | REFERENCES customers(id) ON DELETE CASCADE |

### 4.4 Table `combos`
| Column          | Type            | Constraints                  |
|-----------------|-----------------|------------------------------|
| name            | VARCHAR(50)     | PRIMARY KEY                  |
| date_effective  | DATE            |                              |
| price           | NUMERIC(12,2)   | VND                          |
| notes           | VARCHAR(255)    |                              |
| related_image   | BYTEA           |                              |

### 4.5 Table `products`
| Column          | Type            | Constraints                              |
|-----------------|-----------------|------------------------------------------|
| name            | VARCHAR(50)     | PRIMARY KEY                              |
| classical_name  | VARCHAR(50)     |                                          |
| net_price       | NUMERIC(12,2)   | VND                                      |
| quantity        | INT             | CHECK (quantity >= 0 AND quantity < 1000)|
| notes           | VARCHAR(255)    |                                          |
| related_image   | BYTEA           |                                          |

### 4.6 Table `stocks`
| Column          | Type            | Constraints                              |
|-----------------|-----------------|------------------------------------------|
| id              | SERIAL          | PRIMARY KEY                              |
| import_date     | DATE            | NOT NULL                                 |
| import_price    | NUMERIC(12,2)   | VND                                      |
| quantity        | INT             | CHECK (quantity >= 0 AND quantity < 1000)|
| gift_quantity   | INT             | CHECK (gift_quantity >= 0 AND gift_quantity < 100)|
| notes           | VARCHAR(255)    |                                          |
| related_image   | BYTEA           |                                          |
| product_name    | VARCHAR(50)     | REFERENCES products(name) ON DELETE CASCADE |

### 4.7 Junction tables
```sql
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
5. API Routes & Logic
Each entity has a single route handler file under app/api/<entity>/route.ts.
Supported HTTP methods and actions:

GET: Retrieve list (supports ?search=, ?page=, ?limit=) or a single record by ?id=.

POST: Create a new record.

PUT: Update a record (requires id in body or query).

DELETE: Delete by ?id=.

PATCH: Duplicate a record (body contains { action: "duplicate", id }).

5.1 Referers API
POST/PUT body: { name, date, offerRate, notes, relatedImage } (relatedImage as base64 string).

Server converts base64 to Buffer for BYTEA column.

Duplicate: copy all fields but require new name and date (due to UNIQUE constraint).

5.2 Customers API
Body: name, date, phone, zalo, address, location (as "lat,lng" string), type, notes, four image fields (base64), referer_id.

Server parses location into POINT.

Duplicate: requires new name and zalo.

5.3 Products API
Body: name, classicalName, netPrice, quantity, notes, relatedImage.

PK is name, so duplicate must provide a new name.

5.4 Combos API
Body: name, dateEffective, price, notes, relatedImage, and an array productNames[] for many-to-many.

On create/update, the handler will delete existing combo_products for that combo and re-insert the selected product names.

Duplicate: requires new name.

5.5 Orders API
Body: orderDate, purchaseDate, shipCost, netProfit, netProfitMargin, referrerFee, notes, relatedImage, customerId, and an array comboNames[].

On create/update, manage order_combos similarly.

Duplicate: copies all fields; user can modify them in the form.

5.6 Stocks API
Body: importDate, importPrice, quantity, giftQuantity, notes, relatedImage, productName.

No automatic inventory update: The product's quantity is NOT automatically incremented. The user manually manages the product quantity.

Duplicate: copies all fields (no unique constraint other than id).

5.7 Dashboard API
Endpoint: /api/dashboard?month=MM&year=YYYY

Returns JSON:

json
{
  "totalNetProfit": number,
  "newCustomers": number,
  "returningCustomers": number,
  "totalOrders": number,
  "lowStockProducts": [ ... ],
  "topProducts": [ { "name": "...", "orderCount": number } ],
  "recentOrders": [ ... ]
}
returningCustomers: customers who placed an order this month AND had orders before this month.

topProducts: based on appearance in order_combos joined to combo_products.

6. Frontend Details
6.1 Layout
Sidebar: Navigation links (Dashboard, Referers, Customers, Products, Orders, Combos, Stocks). Collapsible on mobile via hamburger menu.

Header: Page title and mobile menu toggle.

Content area: The main page component.

6.2 Dashboard Page (/)
A grid of StatsCard components: Total Net Profit, New Customers (month), Returning Customers, Total Orders.

A bar chart (Recharts) showing net profit by day for the last 7 days.

A table: Top 5 best-selling products (by order count).

A table: Products with quantity < 10 (low stock).

Framer motion animations on cards and chart appearance.

6.3 Entity Management Pages
Each page (e.g., /referers) displays:

A DataTable showing all records (with columns appropriate to the entity).

Search bar (searches by name or main field).

Pagination.

Action buttons: Add New, and on each row: Edit, Duplicate, Delete (with confirmation).

Clicking Add/Edit/Duplicate opens a Modal containing the corresponding form.

The table has horizontal scroll on mobile.

Row hover effects and action buttons appear on hover (desktop).

6.4 DataTable Component
Reusable, receives:

columns definition

data array

onEdit, onDelete, onDuplicate callbacks

onAdd callback

loading boolean

pagination controls

6.5 Forms
Each form uses React Hook Form for validation.

Image fields: Use ImageUpload component that reads file as base64 and shows preview.

Dropdown selections:

Customer form: Referer dropdown (fetched list).

Order form: Customer dropdown + Combo multi-select checkboxes.

Combo form: Product multi-select checkboxes.

Stock form: Product dropdown (single select).

Location field: Simple text input for "lat,lng".

Date fields: Use date picker (native HTML or a simple component) with dd/mm/yyyy display.

6.6 Design & Responsiveness
TailwindCSS utility classes, mobile-first approach.

Smooth modal animations (fade + scale) with Framer Motion.

Table row animation on load (staggered fade in).

Toast notifications for success/error (could use react-hot-toast).

Professional color scheme (indigo/blue primary).

7. Deployment Instructions
Database: Create a Neon project, run database/schema.sql in SQL Editor.

Environment: Set DATABASE_URL (Neon connection string) in .env.local and Vercel.

Vercel: Connect GitHub repo, Vercel auto-detects Next.js. No special config needed.

Note: The @neondatabase/serverless package must be used for the database driver.

8. Local Development Setup
bash
git clone <repo>
cd business-manager
npm install
# create .env.local with DATABASE_URL
npm run dev
Run schema.sql on your Neon database before using the app.

9. Important Design Decisions
Surrogate primary keys: All tables have id SERIAL PRIMARY KEY while enforcing business unique constraints separately. This simplifies relationships.

Image storage: Images are stored as base64-encoded strings in BYTEA (or TEXT) columns. The frontend sends base64, the backend inserts it directly. This may increase database size but avoids external storage.

No automatic stock deduction: Creating an order does not change product quantities. The user must update inventory manually via the Stock/Product modules.

No automatic profit calculation: The user enters netProfit directly. Future enhancement could compute it from Combo price, ship cost, etc.

Location: Stored as PostgreSQL POINT, entered as "lat,lng".

Duplicate logic: On duplicate, the modal pre-fills all fields except those with unique constraints (name/date/zalo), which are cleared for user input.

10. Final Notes for AI Agent Implementation
Follow the directory structure exactly.

Create all API routes with correct HTTP method handling (switch on request.method).

Use parameterized queries to prevent SQL injection.

The dashboard API must join tables correctly for metrics.

Ensure all forms handle base64 images properly.

Implement toast notifications for CRUD operations.

Make the UI beautiful, responsive, and include subtle animations as described.

Now, generate all the code files as specified.