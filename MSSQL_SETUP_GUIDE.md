# SQL Server Setup Guide - Expense Tracker

## ✅ Converted to SQL Server (MSSQL)

Your expense tracker backend has been **converted to use SQL Server** instead of MySQL. This guide shows how to set it up.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Database Schema in SSMS

1. **Open SQL Server Management Studio (SSMS)**
2. **Connect to your SQL Server instance**
3. **Open a New Query Window:**
   - Right-click on "Databases" → Select "New Query"
4. **Copy-paste the entire contents of** `backend/schema_mssql.sql`
5. **Execute the query** (Ctrl + E or F5)

✅ Database and tables created!

---

### Step 2: Configure Backend

Edit `backend/.env`:
```env
DB_HOST=localhost
DB_USER=sa
DB_PASSWORD=your_sa_password
DB_NAME=expense_tracker
DB_PORT=1433
PORT=5000
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:5173
```

**Important:** 
- Replace `your_sa_password` with the password you set for SQL Server SA account
- Port `1433` is SQL Server's default port

---

### Step 3: Install Dependencies

```bash
cd backend
npm install
```

This installs the `mssql` driver instead of `mysql2`

---

### Step 4: Start Backend

```bash
npm run dev
```

✅ Backend runs on `http://localhost:5000`

---

### Step 5: Start Frontend

In a new terminal:
```bash
npm run dev
```

✅ Frontend runs on `http://localhost:5173`

---

## 📁 Files Changed for SQL Server

### New Files
- `schema_mssql.sql` - SQL Server database schema (T-SQL)

### Updated Files
- `package.json` - Now uses `mssql` driver instead of `mysql2`
- `.env.example` - SQL Server configuration template
- `src/config/database.js` - SQL Server connection pool
- `src/controllers/authController.js` - MSSQL queries
- `src/controllers/expenseController.js` - MSSQL queries
- `src/controllers/budgetController.js` - MSSQL queries
- `src/controllers/profileController.js` - MSSQL queries
- `src/controllers/categoryController.js` - MSSQL queries

---

## 🔍 Verify SQL Server Setup

### Check SQL Server is Running
1. Open **SQL Server Configuration Manager**
2. Verify **SQL Server** service is running (green arrow)
3. Default instance name: `MSSQLSERVER`

### Test Connection in SSMS
1. Open SSMS
2. Server name: `localhost` or `.` (for local)
3. Authentication: Windows or SQL Server
4. Click Connect

✅ If it connects, you're good!

---

## 🗄️ Database Schema Created

The schema creates:

### Tables
- **users** - User accounts
- **expenses** - Expense records
- **budgets** - Monthly budgets
- **categories** - 9 pre-defined categories
- **notifications** - User notifications
- **rewards** - User reward points

### Default Categories
- Food & Dining 🍔
- Transportation 🚗
- Entertainment 🎬
- Shopping 🛍️
- Bills & Utilities 💡
- Health & Fitness ⚕️
- Education 📚
- Travel ✈️
- Other 📌

---

## 🧪 Test the Connection

### Terminal Test
```bash
cd backend
npm install
npm run dev
```

If you see: `Database connected successfully` ✅

If error, check:
1. SQL Server is running
2. Correct hostname/password in .env
3. Database `expense_tracker` exists

---

## 📊 Differences from MySQL

| Aspect | MySQL | SQL Server |
|--------|-------|-----------|
| Driver | mysql2 | mssql |
| Parameter syntax | ? | @paramName |
| Identity | AUTO_INCREMENT | IDENTITY(1,1) |
| Output | No keyword | OUTPUT INSERTED.id |
| Date cast | DATE() | CAST(date as DATE) |
| Current date | CURRENT_TIMESTAMP | GETDATE() |
| Boolean | 0/1 | BIT |
| Port | 3306 | 1433 |

---

## 🔐 SQL Server Authentication

### Windows Authentication (Recommended)
- Use Windows credentials
- No SA password needed

### SQL Server Authentication (What we use)
- Use `sa` (system admin) login
- Password set during SQL Server installation
- Less secure but easier for development

---

## 🐛 Troubleshooting

### Error: "Cannot open database"
**Problem:** Database not created

**Solution:**
1. Run schema_mssql.sql in SSMS
2. Verify in SSMS: Right-click Databases → Refresh

### Error: "Login failed for user"
**Problem:** Wrong SA password in .env

**Solution:**
1. Check password is correct
2. Use Windows authentication instead:
   ```env
   DB_USER=your_windows_username
   DB_PASSWORD=your_windows_password
   ```

### Error: "Timeout expired"
**Problem:** SQL Server not running

**Solution:**
1. Open SQL Server Configuration Manager
2. Start SQL Server service
3. Restart backend

### Error: "Port 1433 already in use"
**Problem:** Another SQL Server instance running

**Solution:**
```bash
# Find what's using port 1433
netstat -ano | findstr :1433

# Or change port in SQL Server Configuration
```

---

## 📝 Environment Variables

```env
# Database
DB_HOST=localhost                    # Server address
DB_USER=sa                           # SQL Server user
DB_PASSWORD=YourPassword123          # SA password
DB_NAME=expense_tracker              # Database name
DB_PORT=1433                         # SQL Server default port

# Server
PORT=5000                            # Backend port
NODE_ENV=development                 # Environment

# Security
JWT_SECRET=your_secret_key_here      # Change in production!
JWT_EXPIRE=7d                        # Token expiration

# Frontend
FRONTEND_URL=http://localhost:5173   # Frontend URL
```

---

## ✅ Verification Checklist

- [ ] SQL Server installed
- [ ] SQL Server service running
- [ ] Can connect via SSMS
- [ ] schema_mssql.sql executed
- [ ] expense_tracker database exists
- [ ] backend/.env configured
- [ ] `npm install` completed
- [ ] `npm run dev` shows "Database connected successfully"
- [ ] Can access http://localhost:5000/health
- [ ] Frontend runs on http://localhost:5173

---

## 🚀 Next Steps

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Test Registration:**
   - Open http://localhost:5173
   - Click "Get Started"
   - Create an account
   - Add an expense

4. **Verify in SQL Server:**
   - Open SSMS
   - Run: `SELECT * FROM users;`
   - Run: `SELECT * FROM expenses;`

---

## 📞 Key Differences from MySQL Setup

| Step | MySQL | SQL Server |
|------|-------|-----------|
| Install | Download MySQL installer | SQL Server already installed |
| Schema | mysql -u root -p < schema.sql | Copy-paste in SSMS |
| Connection | mysql -u root -p | SSMS GUI |
| User | root | sa |
| Port | 3306 | 1433 |

---

## 🎯 You're Ready!

Everything is configured for SQL Server. Time to:
1. Create the schema in SSMS ✅
2. Configure .env ✅
3. Run `npm install` ✅
4. Start the servers ✅
5. Test the app ✅

**Happy coding!** 🚀
