# Order Saga API

A Node.js REST API demonstrating the **Saga orchestration pattern** for distributed order management.

Each order flows through sequential steps (payment → inventory → shipping). If any step fails, the orchestrator automatically runs compensating transactions in reverse — guaranteeing consistency without a distributed lock.

## Architecture

```
routes/ → usecases/ → saga/orchestrator.js → SQLite
                    ↘ saga/webhookDispatcher.js → subscribers
```

| Layer | Responsibility |
|---|---|
| `routes/` | HTTP, Swagger docs |
| `usecases/` | Validation, authorization, orchestration calls |
| `saga/orchestrator.js` | Saga state machine + compensation logic |
| `saga/webhookDispatcher.js` | Event delivery with exponential backoff retry |
| `db/database.js` | SQLite schema |

## Saga states

```
PENDING → PAYMENT_OK → RESERVED → SHIPPED → DELIVERED
                ↓ (fail=true at any point)
          COMPENSATING → CANCELLED
```

## Quick start

```bash
cp .env.example .env   # set JWT_SECRET
npm install
npm run dev
```

API docs at `http://localhost:3000/docs`

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | — | Register, get JWT |
| POST | /auth/login | — | Login, get JWT |
| POST | /orders | ✓ | Create order (starts saga) |
| GET | /orders/:id | ✓ | Order + saga steps |
| POST | /orders/:id/advance | ✓ | Advance saga (`{ fail: true }` to simulate failure) |
| GET | /orders/:id/timeline | ✓ | Full audit log |
| POST | /webhooks | ✓ | Subscribe to order events |
| GET | /webhooks/deliveries | ✓ | Delivery log with retry info |

## Stack

- **Express** — REST API
- **better-sqlite3** — embedded database, zero external dependencies
- **jsonwebtoken + bcryptjs** — auth
- **Mocha + Chai** — integration tests
- **GitHub Actions** — CI on every push

## Running tests

```bash
npm test
```
