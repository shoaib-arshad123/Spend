# Full-Stack Setup Guide - Expense Tracker

## 📋 Overview

This guide will help you set up the Expense Tracker application from a frontend-only React app to a complete full-stack application with Node.js backend and MySQL database.

**Technology Stack:**
- **Frontend:** React 19, Vite, Framer Motion, Recharts
- **Backend:** Node.js, Express.js
- **Database:** MySQL 5.7+
- **Authentication:** JWT (JSON Web Tokens)
- **Password Security:** bcryptjs

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 14+ and npm
- MySQL 5.7+
- Git (optional)

### Step 1: Setup Database

1. Open MySQL Workbench or MySQL Command Line
2. Run the schema file to create database and tables:
   ```bash
   mysql -u root -p < backend/schema.sql
   ```
   Or paste the contents of `backend/schema.sql` into your MySQL client

### Step 2: Setup Backend

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=expense_tracker
   PORT=5000
   JWT_SECRET=your_secret_key_change_in_production
   FRONTEND_URL=http://localhost:5173
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```
   
   ✅ Backend should run on `http://localhost:5000`

### Step 3: Setup Frontend

1. Navigate to project root:
   ```bash
   cd ..
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   ✅ Frontend should run on `http://localhost:5173`

### Step 4: Test the Application

1. Open browser to `http://localhost:5173`
2. Click "Get Started" to register
3. Create account with test credentials:
   - Name: Test User
   - Email: test@example.com
   - Password: test123456

4. You're in! Start tracking expenses

---

## 📁 Project Structure

```
expense-tracker/
├── backend/                          # Node.js/Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # MySQL connection pool
│   │   ├── controllers/              # Business logic
│   │   │   ├── authController.js
│   │   │   ├── expenseController.js
│   │   │   ├── budgetController.js
│   │   │   ├── profileController.js
│   │   │   └── categoryController.js
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT verification
│   │   ├── routes/                   # API endpoints
│   │   │   ├── authRoutes.js
│   │   │   ├── expenseRoutes.js
│   │   │   ├── budgetRoutes.js
│   │   │   ├── profileRoutes.js
│   │   │   └── categoryRoutes.js
│   │   ├── utils/
│   │   │   └── helpers.js           # Password hashing, JWT, validation
│   │   └── server.js                 # Express app entry point
│   ├── package.json
│   ├── .env.example
│   └── schema.sql                    # MySQL database schema
│
├── src/                              # React frontend
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── services/
│   │   └── api.js                   # API service layer (NEW)
│   ├── App.jsx
│   └── main.jsx
│
└── package.json                      # Frontend dependencies
```

---

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Add new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/stats` - Get expense statistics

### Budget
- `GET /api/budget` - Get budget info
- `POST /api/budget` - Set budget

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Categories
- `GET /api/categories` - Get all categories

---

## 🗄️ Database Schema

### users
```sql
id (PK), name, email (UNIQUE), password, budget, language, theme, createdAt, updatedAt
```

### expenses
```sql
id (PK), userId (FK), amount, category, description, date, createdAt, updatedAt
```

### budgets
```sql
id (PK), userId (FK), amount, month, year, createdAt, updatedAt
UNIQUE(userId, month, year)
```

### categories
```sql
id (PK), name (UNIQUE), icon, createdAt
```

### notifications
```sql
id (PK), userId (FK), message, type, read, createdAt
```

### rewards
```sql
id (PK), userId (FK), points, description, createdAt
```

---

## 🔐 Authentication Flow

1. **Registration:**
   - User submits name, email, password
   - Backend validates email format and password length
   - Password is hashed using bcryptjs
   - User record created in database
   - JWT token generated and sent to client

2. **Login:**
   - User submits email and password
   - Backend retrieves user and validates password
   - If valid, JWT token generated and sent
   - Client stores token in localStorage

3. **Protected Requests:**
   - Client includes token in Authorization header: `Bearer <token>`
   - Backend middleware verifies token
   - If valid, request proceeds; if invalid, returns 401 Unauthorized

---

## 🛠️ Common Issues & Solutions

### 1. "Cannot GET /api/expenses"
**Problem:** Backend server not running or port mismatch

**Solution:**
```bash
# Check if backend is running
cd backend && npm run dev

# Verify CORS is configured correctly in .env
FRONTEND_URL=http://localhost:5173
```

### 2. "Database connection failed"
**Problem:** MySQL server not running or wrong credentials

**Solution:**
```bash
# Start MySQL service (Windows)
net start MySQL80

# Verify credentials in .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=expense_tracker
```

### 3. "Email already registered"
**Problem:** User tries to register with existing email

**Solution:** Use a different email or login instead

### 4. "Invalid token" error
**Problem:** Token expired or corrupted

**Solution:**
- Clear localStorage and login again
- Or use browser DevTools: `localStorage.removeItem('auth_token')`

### 5. CORS Error in Console
**Problem:** Frontend and backend not aligned

**Solution:**
```bash
# Ensure backend is running on port 5000
# Ensure frontend is running on port 5173
# Check CORS in server.js is configured correctly
```

---

## 📊 Features Implemented

### ✅ Authentication
- [x] User registration with validation
- [x] User login with JWT
- [x] Password hashing (bcryptjs)
- [x] Protected routes/endpoints

### ✅ Expense Management
- [x] Add expenses with category
- [x] View all expenses with filters
- [x] Update expense details
- [x] Delete expenses
- [x] Expense statistics by category

### ✅ Budget Tracking
- [x] Set monthly budget
- [x] Track spending vs budget
- [x] Budget utilization percentage

### ✅ User Profile
- [x] Update user name
- [x] Language preferences
- [x] Theme preferences (light/dark)

### ✅ Categories
- [x] Pre-defined expense categories
- [x] Category icons

---

## 🧪 Testing the API

### Using cURL

**Register User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Add Expense (with token):**
```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "amount": 50,
    "category": "Food & Dining",
    "description": "Lunch at cafe",
    "date": "2024-04-26"
  }'
```

### Using Postman

1. Import the API collection (create new collection)
2. Set up Authorization tab with Bearer token
3. Create requests for each endpoint

---

## 📈 Next Steps

### Optional Enhancements

1. **Image Upload**
   - Add multer for bill/receipt images
   - Store in backend file system or cloud

2. **Notifications**
   - Implement notification system
   - Alert when spending exceeds budget

3. **Reports**
   - Generate monthly/yearly reports
   - Export to PDF/CSV

4. **Recurring Expenses**
   - Add recurring expense tracking
   - Automatic monthly entries

5. **Sharing**
   - Share expense reports with others
   - Collaborative budgeting

6. **Mobile App**
   - React Native version
   - iOS/Android deployment

7. **Advanced Analytics**
   - Spending trends
   - Predictions and recommendations
   - Budget optimization

---

## 🚀 Deployment

### Backend Deployment (Heroku)

1. Add Procfile:
```
web: node src/server.js
```

2. Push to Heroku:
```bash
heroku create your-app-name
heroku addons:create cleardb:ignite
git push heroku main
```

### Frontend Deployment (Vercel)

1. Build:
```bash
npm run build
```

2. Deploy to Vercel:
```bash
npm install -g vercel
vercel
```

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API_REFERENCE.md for endpoint details
3. Check browser console for error messages
4. Verify all services are running (backend, MySQL)

---

## 📝 License

MIT License - Feel free to use and modify!

Happy Expense Tracking! 🎯
