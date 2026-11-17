# patisserie-api

REST API of **Pâtisserie Maison**, an online shop for a traditional Tunisian pâtisserie.
Node.js + Express + MongoDB (Mongoose), JavaScript ES modules. Prices and payments are in Tunisian dinars (TND).

The full specification is in [`../docs/SPEC.md`](../docs/SPEC.md) and progress per phase in [`../docs/PROGRESS.md`](../docs/PROGRESS.md).

## Requirements

- Node.js 20 or newer (`node -v`)
- MongoDB 6 or newer running locally on port 27017, either:
  - [MongoDB Community Server](https://www.mongodb.com/try/download/community), or
  - Docker: `docker run -d --name mongo -p 27017:27017 mongo:7`

## Run it

```bash
cd patisserie-api
npm install
cp .env.example .env      # Windows (PowerShell): copy .env.example .env
npm run seed              # wipes and fills the "patisserie" database with demo data
npm run dev               # http://localhost:3000/api/v1, restarts on file changes
```

Check it works: open <http://localhost:3000/api/v1/health>, which should return `{"status":"ok","database":"connected",...}`.
API documentation (Swagger UI): <http://localhost:3000/api/docs>.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the API with nodemon (auto-restart) |
| `npm start` | Start the API with node |
| `npm run seed` | Reset the database and insert the demo data |
| `npm test` | Run the Jest + Supertest suite against an in-memory MongoDB (no running MongoDB needed; the first run downloads a MongoDB binary) |

## Test with Postman

1. In Postman: **Import** → select both files in [`docs/postman/`](docs/postman):
   - `patisserie.postman_collection.json` (the requests, grouped by phase, with test scripts)
   - `patisserie.local.postman_environment.json` (`baseUrl = http://localhost:3000/api/v1`)
2. Select the environment **Pâtisserie Maison – local** (top right).
3. Send the requests one by one, or right-click the collection → **Run collection** to run them all and see the test results.

## Demo data (`npm run seed`)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `SEED_ADMIN_EMAIL` (default `admin@patisserie.tn`) | `SEED_ADMIN_PASSWORD` from `.env` |
| Customer | `amira.bensalah@example.tn` (La Marsa, Tunis) | `Client2026` |
| Customer | `youssef.trabelsi@example.tn` (Sfax) | `Client2026` |

Plus 4 categories (Baklawa & fruits secs, Gâteaux secs, Douceurs au miel, Plateaux de fête), 20 traditional products (Zlabia and Mkharek are hidden out of Ramadan season), and 3 orders: delivered, preparing and a pending guest order.

These passwords are for local development only.

## Money

All amounts are **integers in millimes** (1 TND = 1000 millimes): `priceMillimes: 18500` means 18.500 DT.
Prices are multiples of 100 millimes. The server always recomputes totals; clients never send prices.

## Environment variables

| Name | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test` or `production` |
| `PORT` | `3000` | HTTP port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/patisserie` | MongoDB connection string |
| `CLIENT_ORIGIN` | `http://localhost:4200` | The only origin allowed by CORS (Angular dev server) |
| `SEED_ADMIN_EMAIL` | `admin@patisserie.tn` | First admin, created by the seed script |
| `SEED_ADMIN_PASSWORD` | none | Required by `npm run seed` |

Variables are validated at boot (`src/config/env.js`); the server refuses to start with an invalid value.

## Structure

```text
src/
├── app.js            # builds the Express app; middleware order is commented
├── server.js         # connects to MongoDB, starts listening, graceful shutdown
├── config/           # env.js (validated), db.js, constants.js (TND, governorates, units…)
├── models/           # User, Category, Product, Cart, Order, Payment (+ Counter for order numbers)
├── routes/           # one express.Router() per resource, mounted under /api/v1
├── controllers/      # read the request, send the response
├── services/         # business rules
├── middlewares/      # notFound, errorHandler (more from phase 4)
├── utils/            # AppError, asyncHandler, money, slugify, orderNumber
└── docs/swagger.yaml
scripts/seed.js       # + seedData.js
tests/                # Jest + Supertest
docs/postman/         # Postman collection and environment
```

## Errors

Every error has the same JSON shape:

```json
{ "status": 422, "code": "VALIDATION_ERROR", "message": "Invalid input", "details": [{ "field": "priceMillimes", "message": "..." }] }
```
