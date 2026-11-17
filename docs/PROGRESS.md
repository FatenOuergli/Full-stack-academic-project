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
