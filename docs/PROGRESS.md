# Progress

## Phase 3 – Setup

**Done when:** `npm run dev` starts and `npm run seed` fills the database. ✅

- Project skeleton in `patisserie-api/` following the SPEC folder structure (route → controller → service → model).
- Config validated at boot with Zod (`src/config/env.js`), `.env.example` committed.
- MongoDB connection (`src/config/db.js`) and graceful shutdown.
- Mongoose models with `timestamps: true`: `User`, `Category`, `Product`, `Cart`, `Order`, `Payment`, with the indexes and rules from the schema table:
  - money as integer millimes (TND), prices multiple of 100;
  - product sale unit (`piece`, `box` with `weightGrams`, `kg`) and occasions (`ramadan`, `aid`, `mouled`, `wedding`);
  - Tunisian addresses (24 governorates, 4-digit postal code) and phones (+216 and 8 digits);
  - passwords hashed with bcrypt (12 rounds) in a pre-save hook, `passwordHash` never selected;
  - cart owned by exactly one of user or guestId, guest carts expire after 30 days (partial TTL index);
  - order total checked against its items, forward-only status transitions (`Order.canTransition`).
- Central error handling: `AppError`, `asyncHandler`, `notFound`, `errorHandler` (standard error shape; Mongoose, Zod, duplicate key and bad JSON errors mapped).
- `helmet`, CORS restricted to the Angular origin, `morgan`, JSON body limit.
- `GET /api/v1/health` (API + database status), Swagger UI at `/api/docs`.
- Seed script with Tunisian demo data (1 admin, 2 customers, 4 categories, 20 products, 3 orders, 2 payments).
- Tests (Jest + Supertest + in-memory MongoDB): 23 tests for health, error shape, CORS, Swagger, models, seed and money helpers.
- Postman collection and local environment in `patisserie-api/docs/postman/`.

**Decisions to note**

- Express 4 (not 5), because `express-mongo-sanitize` (phase 8) does not support Express 5.
- `bcryptjs` (pure JavaScript bcrypt) instead of the native `bcrypt` package, so `npm install` never needs build tools on Windows.
- A small internal `counters` collection generates sequential order numbers (`PAT-2026-000123`) atomically; it is not exposed by the API.
- `Payment` has a `provider` field (`stripe` or `mock`) so the mock provider and Stripe share the same collection.

## Phase 5 (part 1) – Vitrine (public catalogue)

**Done when:** a visitor can browse, filter, search and open products. ✅ The admin back-office part of phase 5 (create, edit, hide and delete products and categories, image upload) comes after phase 4 (auth), because it needs `authenticate` and `authorize('admin')`.

- `GET /categories`: visible categories in French alphabetical order, each with `productCount`.
- `GET /products`: filters `category` (slug), `occasion`, `unit`, `minPrice`/`maxPrice` (millimes) and `inStock`; `search` in name and description; `sort` (`newest`, `price_asc`, `price_desc`, `name`); pagination `page`/`limit` (max 50) returning `{ data, pagination: { page, limit, total, totalPages } }`.
- `GET /products/:slug`: product detail with category, ingredients and allergens.
- Visitors only see active products of active categories. Hidden seasonal products (Zlabia, Mkharek) and products of a hidden category return 404.
- New `validate` middleware with Zod schemas in `src/validators/`. Query values are converted to the right types, unknown parameters are dropped, and invalid input returns 422 with one entry per field.
- Layers: `routes/product.routes.js` → `controllers/product.controller.js` → `services/product.service.js` → `Product` model, and the same for categories.
- Swagger documents the three endpoints. The Postman folder **Vitrine (phase 5)** has 9 requests with test scripts.
- 13 new tests (40 in total).

**Decisions to note**

- `search` is a case-insensitive "contains" match on name and description, with the user's text escaped. It finds partial words (`makrou` finds Makroudh), which a MongoDB text index would not. With 20–100 products, speed is not a concern.
- An unknown or hidden `category` in the filter returns 404 rather than an empty list, so a broken link is visible.
- Sorting by name uses the French collation, so accented names sort naturally (Boîte comes before Debla).
