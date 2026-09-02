# order-saga-api

A Node.js REST API that manages order lifecycles using the **Saga orchestration pattern**. Each order moves through a sequence of steps (payment → inventory → shipping). If something goes wrong at any step, the orchestrator rolls back all previous steps automatically using compensating transactions.

Built this to explore how distributed systems handle consistency without distributed locks — a pattern I kept running into at work.

## How it works

```
POST /orders          →  creates order (status: PENDING)
POST /orders/:id/advance  →  moves to next step
POST /orders/:id/advance  { fail: true }  →  triggers compensation
GET  /orders/:id/timeline  →  full audit log of what happened and when
```

State machine:
```
PENDING → PAYMENT_OK → RESERVED → SHIPPED → DELIVERED
                ↓ (fail at any point)
          COMPENSATING → CANCELLED
```

Each state transition fires a webhook event to any registered subscribers, with exponential backoff retry on delivery failure.

## Stack

- Express + better-sqlite3 (no external database)
- JWT auth with bcryptjs
- Swagger docs at `/docs`
- Mocha + Chai integration tests
- GitHub Actions CI

## Running locally

```bash
cp .env.example .env
npm install
npm run dev
```

Then open `http://localhost:3000/docs` to explore the API.

## Tests

```bash
npm test
```
