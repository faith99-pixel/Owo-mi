# Owó Mi API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require Bearer token in header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Auth
- `POST /auth/register` - Create account
- `POST /auth/login` - Login

### Wallet
- `GET /wallet/balance` - Get wallet balance
- `POST /wallet/fund` - Add money to wallet
- `POST /wallet/transfer` - Send money to another user

### Savings
- `POST /savings/goals` - Create savings goal
- `GET /savings/goals` - Get all savings goals
- `POST /savings/goals/:id/deposit` - Add money to goal
- `POST /savings/goals/:id/withdraw` - Withdraw from goal

### Transactions
- `GET /transactions` - Get transaction history
- `GET /transactions/stats` - Get spending statistics

## Example Usage

### Register
```javascript
POST /api/auth/register
{
  "email": "user@example.com",
  "phone": "08012345678",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Create Savings Goal
```javascript
POST /api/savings/goals
Headers: { Authorization: "Bearer <token>" }
{
  "title": "New Phone",
  "targetAmount": 500000,
  "emoji": "📱",
  "isLocked": true,
  "unlockDate": "2024-12-31"
}
```

### P2P Transfer
```javascript
POST /api/wallet/transfer
Headers: { Authorization: "Bearer <token>" }
{
  "recipientEmail": "friend@example.com",
  "amount": 5000,
  "description": "Lunch money"
}
```

## Features

✅ User authentication with JWT
✅ Wallet management
✅ Savings goals with lock feature
✅ P2P transfers
✅ Transaction history
✅ Virtual account numbers
✅ Interest calculation on savings

## Next Steps

1. Install MongoDB
2. Run `npm install` in api folder
3. Copy `.env.example` to `.env` and configure
4. Run `npm run dev`
5. API will be available at http://localhost:5000
