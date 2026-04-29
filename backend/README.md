# Expense Tracker Backend

A complete Node.js/Express REST API for expense tracking with MySQL database, JWT authentication, and comprehensive API endpoints.

## Features

- ✅ User authentication (registration, login, JWT)
- ✅ Expense management (create, read, update, delete)
- ✅ Budget tracking and monitoring
- ✅ Expense statistics and analytics
- ✅ User profile management
- ✅ Pre-defined expense categories
- ✅ Password hashing with bcryptjs
- ✅ CORS-enabled for frontend integration
- ✅ Parameterized SQL queries (SQL injection protection)

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MySQL** - Relational database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin request handling

## Quick Start

### 1. Setup Database

```bash
# Run the schema
mysql -u root -p < schema.sql
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env` file:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=expense_tracker
PORT=5000
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
```

### 4. Start Server

```bash
npm run dev
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Add expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/stats` - Get statistics

### Budget
- `GET /api/budget` - Get budget info
- `POST /api/budget` - Set budget

### Profile
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile

### Categories
- `GET /api/categories` - Get all categories

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── expenseController.js
│   │   ├── budgetController.js
│   │   ├── profileController.js
│   │   └── categoryController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── budgetRoutes.js
│   │   ├── profileRoutes.js
│   │   └── categoryRoutes.js
│   ├── utils/
│   │   └── helpers.js
│   └── server.js
├── package.json
├── .env.example
└── schema.sql
```

## Database Schema

**Tables:**
- users
- expenses
- budgets
- categories
- notifications
- rewards

See `schema.sql` for complete schema.

## Authentication

JWT token required for protected endpoints. Include in header:
```
Authorization: Bearer <token>
```

## Error Handling

All errors return JSON response:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Testing with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Add Expense
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"amount":50,"category":"Food & Dining","description":"Lunch","date":"2024-04-26"}'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | MySQL host | localhost |
| DB_USER | MySQL user | root |
| DB_PASSWORD | MySQL password | - |
| DB_NAME | Database name | expense_tracker |
| PORT | Server port | 5000 |
| JWT_SECRET | JWT signing key | your_secret_key |
| FRONTEND_URL | Frontend origin for CORS | http://localhost:5173 |

## Security Notes

1. Change JWT_SECRET in production
2. Use strong MySQL passwords
3. Enable HTTPS in production
4. Keep dependencies updated
5. Implement rate limiting for production
6. Use environment variables for sensitive data

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production start
npm start
```

## License

MIT License

## Support

For issues or questions, check the main FULLSTACK_SETUP_GUIDE.md or API_REFERENCE.md
