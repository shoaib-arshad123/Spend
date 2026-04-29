# Quick Reference - Expense Tracker Commands

## 🚀 Getting Started (5 Minutes)

### Terminal 1: Database Setup
```bash
mysql -u root -p
# Enter password

# Then copy-paste schema.sql contents into MySQL, or:
mysql -u root -p < backend/schema.sql
```

### Terminal 2: Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MySQL password
npm run dev
# Backend runs on http://localhost:5000
```

### Terminal 3: Frontend
```bash
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 📁 File Locations

### Important Backend Files
```
backend/
├── .env.example          ← Copy this to .env
├── schema.sql            ← Run this in MySQL
├── package.json          ← Dependencies
├── README.md             ← Backend docs
└── src/
    ├── server.js         ← Main entry point
    ├── controllers/      ← Business logic
    ├── routes/           ← API endpoints
    ├── middleware/       ← Auth verification
    ├── config/           ← Database connection
    └── utils/            ← Helpers
```

### Important Frontend Files
```
src/
├── services/api.js       ← API integration (NEW)
├── context/              ← Global state
├── components/           ← UI components
├── pages/                ← Page routes
└── App.jsx              ← Root component
```

---

## 🔧 Common Commands

### Backend
```bash
cd backend
npm install              # Install dependencies
npm run dev              # Start development server
npm start                # Start production server
```

### Frontend
```bash
npm install              # Install dependencies
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
```

---

## 📝 Environment Setup

### .env File (Backend)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=expense_tracker
PORT=5000
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:5173
```

---

## 🧪 API Testing

### Quick Test with cURL

**1. Register User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

Copy the `token` from response.

**2. Add Expense**
```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"amount":50,"category":"Food & Dining","description":"Lunch","date":"2024-04-26"}'
```

**3. Get Expenses**
```bash
curl http://localhost:5000/api/expenses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**4. Get Budget**
```bash
curl http://localhost:5000/api/budget \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🗄️ Database Useful Queries

### Connect to Database
```bash
mysql -u root -p
# Password: (enter your password)

use expense_tracker;
```

### Check Data
```sql
-- See all users
SELECT * FROM users;

-- See all expenses
SELECT * FROM expenses;

-- See budget info
SELECT * FROM budgets;

-- See categories
SELECT * FROM categories;

-- Delete all test data (be careful!)
DELETE FROM expenses;
DELETE FROM users;
```

### Reset Database
```bash
# Drop and recreate
mysql -u root -p < backend/schema.sql
```

---

## 🔐 Security Notes

- ⚠️ Change `JWT_SECRET` in production
- ⚠️ Don't commit `.env` file
- ⚠️ Use strong MySQL password
- ⚠️ Keep dependencies updated: `npm update`

---

## 📚 Documentation Links

| Document | Purpose |
|----------|---------|
| [FULLSTACK_SETUP_GUIDE.md](../FULLSTACK_SETUP_GUIDE.md) | Complete setup instructions |
| [API_REFERENCE.md](../API_REFERENCE.md) | API endpoint documentation |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | System design and architecture |
| [README.md](../README.md) | Backend overview |

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process or change PORT in .env
```

### Database connection error
```bash
# Verify MySQL is running
mysql -u root -p  # If this works, MySQL is running

# Check .env credentials match MySQL setup
cat backend/.env
```

### Frontend can't connect to backend
```bash
# Verify backend is running
curl http://localhost:5000/health

# Check FRONTEND_URL in backend/.env
FRONTEND_URL=http://localhost:5173
```

### CORS errors
```
Make sure:
1. Backend is running on port 5000
2. Frontend is running on port 5173
3. FRONTEND_URL in .env is http://localhost:5173
4. No typos in API calls
```

---

## 🌐 Frontend-Backend Integration

### How API Calls Work
```javascript
// Frontend sends request
fetch('http://localhost:5000/api/expenses', {
  headers: { 'Authorization': 'Bearer token' }
})

// Backend verifies token
verifyToken middleware

// Backend processes request
Controller executes

// Backend returns response
JSON response to frontend

// Frontend updates UI
setState()
```

---

## 📊 API Endpoints Overview

### Auth (3 endpoints)
```
POST   /api/auth/register      # Create account
POST   /api/auth/login         # Login
GET    /api/auth/me            # Current user
```

### Expenses (5 endpoints)
```
GET    /api/expenses           # List expenses
POST   /api/expenses           # Add expense
PUT    /api/expenses/:id       # Update expense
DELETE /api/expenses/:id       # Delete expense
GET    /api/expenses/stats     # Statistics
```

### Budget (2 endpoints)
```
GET    /api/budget             # Get budget info
POST   /api/budget             # Set budget
```

### Profile (2 endpoints)
```
GET    /api/profile            # Get profile
PUT    /api/profile            # Update profile
```

### Categories (1 endpoint)
```
GET    /api/categories         # Get categories
```

---

## 💡 Pro Tips

1. **Use browser DevTools**
   - Network tab to see API calls
   - Console tab for errors
   - Storage tab to see tokens

2. **Save your first token**
   ```javascript
   // In browser console
   localStorage.getItem('auth_token')
   ```

3. **Test in MySQL Workbench**
   - Easy to query and visualize data
   - Good for debugging

4. **Use Postman for API testing**
   - Import cURL commands
   - Save requests for testing

5. **Keep both servers running**
   - Backend on Terminal 2
   - Frontend on Terminal 3
   - Work on Terminal 1 for commands

---

## 🎯 Development Workflow

```
1. Start MySQL service
2. Terminal 2: cd backend && npm run dev
3. Terminal 3: npm run dev (from root)
4. Open http://localhost:5173
5. Register new account
6. Test features
7. Check database in MySQL Workbench
8. Review API calls in browser DevTools
9. Check logs in Terminal 2
```

---

## 📈 Progress Checklist

- [ ] MySQL installed and running
- [ ] schema.sql executed
- [ ] backend/.env created and configured
- [ ] Backend dependencies installed
- [ ] Backend server running (port 5000)
- [ ] Frontend dependencies installed
- [ ] Frontend server running (port 5173)
- [ ] Can register new account
- [ ] Can add expense
- [ ] Can see expenses in database
- [ ] Can update profile
- [ ] Can set budget
- [ ] Can view analytics

---

## 🚀 You're Ready!

Everything is set up. Time to:
1. Run the servers
2. Test the application
3. Review the code
4. Deploy when ready

Happy coding! 🎉
