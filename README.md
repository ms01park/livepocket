# Live Pocket

Small concert booking MVP with user signup/login, performance management, reservations, payment confirmation, and QR ticket verification.

## Stack

- Node.js
- PostgreSQL
- Plain HTML/CSS/JavaScript

## Local Setup

```bash
npm install
copy .env.example .env
npm start
```

Set `DATABASE_URL` in `.env` before starting the server.

## Environment Variables

```env
PORT=3000
APP_BASE_URL=http://localhost:3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/live_pocket
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=change-this-password
```

The super admin account is created or updated from these environment variables when the server starts.

## Deployment

See [DEPLOY.md](DEPLOY.md).
