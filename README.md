# Customer Lookup

A backend project with an Express API, a SQLite connection helper, and two synthetic upstream services: CRM for customer identity and account records, and Billing for subscriptions and invoices. All records and credentials are fictional.

## Quick Start

Install Node.js 24 and Git. If you use nvm, `nvm use` selects the version in .nvmrc.

```sh
nvm use
npm ci
cp .env.example .env
```

Start the CRM and Billing services in a separate terminal:

```sh
npm run mocks
```

Alternatively, start them with Docker Compose:

```sh
docker compose up --build --wait -d
```

Use one mock startup option at a time. Then verify the services and start the API:

```sh
npm run smoke
npm run dev
```

| Service | Address |
| --- | --- |
| Customer Lookup API | http://127.0.0.1:3000 |
| CRM API | http://127.0.0.1:4101 |
| Billing API | http://127.0.0.1:4102 |

GET /health returns the application's health status. The customer route currently returns 501, and the reconciliation command is a placeholder. The included tests verify starter infrastructure.

Stop local services with Ctrl+C. Stop Docker mocks with `docker compose down`.

## Project Structure

```text
customer-lookup-exercise/
├── src/                  # Express API, configuration, and SQLite helper
│   ├── app.ts            # Routes
│   ├── server.ts         # HTTP server entry point
│   ├── config.ts         # Environment configuration
│   ├── db.ts             # SQLite connection helper
│   └── reconcile.ts      # Command entry point
├── mocks/                # CRM and Billing services with synthetic fixtures
├── tests/                # Starter infrastructure tests
├── docs/                 # Upstream API documentation
├── scripts/              # Smoke check and mock controls
├── data/                 # Ignored local database and report files
├── compose.yaml          # Docker startup for upstream services
└── package.json
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with automatic reload |
| `npm start` | Start the API without automatic reload |
| `npm run mocks` | Start both upstream services locally |
| `npm run smoke` | Check upstream health, authentication, and a first page |
| `npm test` | Run the tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Check TypeScript types |
| `npm run reconcile` | Run the command entry point; currently a placeholder |
| `npm run fault -- <profile>` | Set the upstream fault profile and reset counters |

Fault profiles are healthy, crm-timeout, crm-transient, billing-rate-limit, and billing-down. Restore the healthy profile before running smoke checks. See the upstream usage guide for behavior and counter details.

## Configuration

Copy .env.example to .env before running the scripts. It contains service URLs, local ports, synthetic API credentials, the database path, and a fixed exercise clock. The Docker setup uses the default credentials in compose.yaml; if you change credentials in .env, also update compose.yaml or use local mocks.

## Database

The SQLite helper uses Node.js's built-in SQLite module. DATABASE_PATH defaults to ./data/reconciliation.sqlite. The helper creates the parent directory when opening a file database; it does not create application tables. Runtime data files are ignored by Git. Some Node.js 24 releases print an experimental SQLite warning.

## Upstream Documentation

- [Upstream usage guide](docs/UPSTREAMS.md)
- [CRM OpenAPI contract](docs/crm.openapi.json)
- [Billing OpenAPI contract](docs/billing.openapi.json)

## Tech Stack

- **Backend:** Node.js 24, TypeScript, Express
- **Database:** SQLite through node:sqlite
- **Testing:** Vitest, Supertest
- **Development:** tsx, optional Docker Compose
