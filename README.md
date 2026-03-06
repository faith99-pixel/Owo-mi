# Owomi - Leak-First Personal Finance for Nigerians

Owomi helps users spot where money is leaking, not just where money went.

Instead of behaving like a regular banking dashboard, Owomi focuses on:
- leak detection
- behavioral accountability
- practical weekly fixes

## What Makes Owomi Different

- Leak-first finance:
  Highlights recurring spend leak patterns (POS churn, repeated transfers, betting, airtime/data frequency).
- Nigerian-native intelligence:
  Category and merchant analysis tuned for Nigerian transaction behavior.
- Behavioral accountability:
  Money Leak Score, low-leak streak, and a weekly Truth Report.
- Actionable fixes:
  Suggestions like capping heavy categories, batching transfers, and bundling airtime/data.
- Shareability:
  One-click copy for a social-ready "shame card" style truth summary.

## Current Product Scope (This Repo)

This repository is a web application stack:
- Frontend: Next.js
- Backend API: Node.js + Express
- Database: MongoDB

It is not currently an Android native app, and it does not yet read SMS directly from device permissions.

## Current Features

- Authentication:
  Register, login, JWT-protected routes.
- Wallet:
  Balance view, wallet funding, transfers, transaction logging.
- Savings:
  Create goals, add/withdraw funds.
- Transactions:
  History, category spend breakdown, top merchants.
- Insights (leak-first):
  - Money Leak Score
  - Leakage Watch alerts
  - Weekly Truth Report
  - Low-leak streak
  - Actionable fixes
  - Copyable shame card text
- SMS import:
  Manual paste/import of SMS text, parsed into transaction entries.
- Utility UX:
  Amount privacy toggle, splash screen, custom favicon/logo, card management with searchable Nigerian bank picker.

## Tech Stack

- Frontend:
  - Next.js 14
  - React 18
  - react-hot-toast
- Backend:
  - Express 4
  - JWT auth (`jsonwebtoken`)
  - MongoDB with Mongoose

## Project Structure

```text
.
|-- pages/
|   |-- index.js
|   |-- login.js
|   |-- signup.js
|   `-- dashboard.js
|-- components/
|   `-- SplashScreen.js
|-- lib/
|   |-- api.js
|   `-- parser.js
|-- public/
|   |-- favicon.ico
|   |-- icon-192.png
|   |-- icon-512.png
|   `-- owomi-logo.svg
|-- api/
|   |-- server.js
|   |-- middleware/
|   |   `-- auth.js
|   |-- models/
|   |   |-- User.js
|   |   |-- Transaction.js
|   |   `-- SavingsGoal.js
|   `-- routes/
|       |-- auth.js
|       |-- wallet.js
|       |-- savings.js
|       |-- transactions.js
|       `-- virtualAccount.js
`-- styles/
    `-- globals.css
```

## Getting Started

## 1) Frontend

From project root:

```bash
npm install
npm run dev
```

Frontend runs at:
- `http://localhost:3000`

## 2) Backend API

From `api/` folder:

```bash
npm install
cp .env.example .env
npm run dev
```

API runs at:
- `http://localhost:5000`

Important backend env vars (`api/.env`):
- `PORT=5000`
- `MONGODB_URI=mongodb://localhost:27017/owomi`
- `JWT_SECRET=...`

## Product Positioning

Owomi is not trying to be another "bank app clone."

Owomi is a spending leak detector for Nigerians:
- See where money escapes
- Understand the behavior behind it
- Get weekly fixes you can act on immediately

## Roadmap

- Near-term:
  - Improve parser coverage for more Nigerian SMS formats and merchants
  - Better trend windows (week-over-week, month-over-month)
  - Sharable card images (not just copied text)
- Mid-term:
  - Budget caps with auto-alerting
  - Weekly notification digest
  - CSV export
- Long-term:
  - Optional mobile-native companion app
  - Peer comparison (privacy-safe, anonymized)
  - Encrypted backup/restore

## License

MIT

