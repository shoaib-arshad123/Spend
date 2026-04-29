# Architecture Overview - Expense Tracker Full-Stack

## System Architecture

```
┌─────────────────┐                    ┌─────────────────┐
│                 │                    │                 │
│  React Frontend │◄──── REST API ────►│ Node.js Backend │
│  (Port 5173)    │   (JSON over HTTP) │  (Port 5000)    │
│                 │                    │                 │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │ LocalStorage                         │ MySQL Driver
         │                                      │
         │                            ┌─────────▼────────┐
         │                            │                  │
         │                            │  MySQL Database  │
         │                            │  (Port 3306)     │
         │                            │                  │
         └────────────────────────────┴──────────────────┘
```

---

## Frontend Architecture

### Technology Stack
- **Framework:** React 19.2
- **Build Tool:** Vite
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Icons:** Lucide React

### Folder Structure
```
src/
├── components/               # Reusable UI components
│   ├── AddExpense.jsx
│   ├── Analytics.jsx
│   ├── Dashboard.jsx
│   ├── ExpenseHistory.jsx
│   ├── Profile.jsx
│   ├── NotificationCenter.jsx
│   ├── OnboardingTutorial.jsx
│   ├── BillScanner.jsx
│   ├── RewardSystem.jsx
│   ├── SmartAdvice.jsx
│   ├── VoiceInput.jsx
│   └── shared/
│
├── pages/                    # Page components
│   ├── LandingPage.jsx
│   ├── AuthPage.jsx (Login/Register)
│   └── MainApp.jsx
│
├── context/                  # State management
│   └── AppContext.jsx        # Global app state
│
├── services/                 # API communication
│   └── api.js               # API service layer
│
├── i18n/                     # Internationalization
│   └── translations.js
│
├── styles/                   # Global styles
│   └── index.css
│
├── App.jsx                   # Root component
└── main.jsx                  # Entry point
```

### Data Flow

```
User Input
    ↓
Component (e.g., AddExpense.jsx)
    ↓
API Service (api.js)
    ↓
HTTP Request → Backend → Database
    ↓
HTTP Response
    ↓
AppContext (global state)
    ↓
Component Re-render
    ↓
Updated UI
```

### API Service Layer (api.js)

Centralized API communication:
- Authentication methods
- Expense CRUD operations
- Budget management
- Profile operations
- Category retrieval

**Benefits:**
- Single point for API configuration
- Error handling in one place
- Easy to mock for testing
- Token management centralized

---

## Backend Architecture

### Technology Stack
- **Runtime:** Node.js 14+
- **Framework:** Express.js 4.18
- **Database:** MySQL 5.7+
- **Authentication:** JWT (JSON Web Tokens)
- **Password Security:** bcryptjs
- **Middleware:** CORS, Body Parser
- **Async:** Async/Await with Promises

### MVC Pattern

```
Request
  ↓
Route (routes/*.js)
  ↓
Middleware (middleware/auth.js)
  ↓
Controller (controllers/*.js)
  ↓
Database (config/database.js)
  ↓
Response
```

### Folder Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MySQL connection pool
│   │
│   ├── controllers/              # Business logic
│   │   ├── authController.js    # Register, Login, CurrentUser
│   │   ├── expenseController.js # CRUD + Stats
│   │   ├── budgetController.js  # Budget operations
│   │   ├── profileController.js # Profile management
│   │   └── categoryController.js # Category retrieval
│   │
│   ├── middleware/
│   │   └── auth.js              # JWT verification middleware
│   │
│   ├── routes/                   # API endpoint definitions
│   │   ├── authRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── budgetRoutes.js
│   │   ├── profileRoutes.js
│   │   └── categoryRoutes.js
│   │
│   ├── utils/
│   │   └── helpers.js           # Utility functions
│   │
│   └── server.js                # Express app setup
│
├── package.json
├── .env.example
└── schema.sql
```

### Request Processing Flow

```
Client HTTP Request
        ↓
Express Server
        ↓
CORS & Body Parser Middleware
        ↓
Route Matching
        ↓
Authentication Middleware (if protected route)
        ↓
Controller Method
        ↓
Database Operation
        ↓
Response Construction
        ↓
Client HTTP Response
```

### Controller Pattern Example

Each controller handles specific domain logic:

```javascript
// expenseController.js
export const addExpense = async (req, res) => {
  try {
    // 1. Validate input
    // 2. Get database connection
    // 3. Execute query
    // 4. Return response
  } catch (error) {
    // Error handling
  }
};
```

---

## Database Architecture

### Schema Design

```
Users (1) ──────────────────┐
                             │
                    ┌────────┼────────┐
                    │        │        │
                Expenses  Budgets  Notifications
                    │        │        │
                    └────────┼────────┘
                             │
                         Rewards
```

### Tables

#### users
```
id (PK)
├─ name (VARCHAR)
├─ email (UNIQUE)
├─ password (hashed)
├─ budget (DECIMAL)
├─ language
├─ theme
├─ createdAt
└─ updatedAt
```

#### expenses (FK: users.id)
```
id (PK)
├─ userId (FK)
├─ amount (DECIMAL)
├─ category (VARCHAR)
├─ description (TEXT)
├─ date (DATE)
├─ createdAt
└─ updatedAt
```

#### budgets (FK: users.id)
```
id (PK)
├─ userId (FK)
├─ amount (DECIMAL)
├─ month (INT)
├─ year (INT)
├─ createdAt
└─ updatedAt
UNIQUE(userId, month, year)
```

#### Other Tables
- **categories:** Pre-defined expense types
- **notifications:** User alerts and messages
- **rewards:** User points and achievements

### Indexing Strategy

Indexes created for:
- users.email (login optimization)
- expenses.userId (user's expenses query)
- expenses.date (date range queries)
- expenses.userId + date (combined queries)
- notifications.userId, .read (notification queries)
- rewards.userId (user rewards lookup)

---

## Authentication Flow

### Registration
```
1. User enters name, email, password
2. Frontend validates input
3. Frontend sends POST /auth/register
4. Backend validates input
5. Backend checks email uniqueness
6. Backend hashes password (bcryptjs)
7. Backend creates user record
8. Backend generates JWT token
9. Frontend stores token in localStorage
10. User redirected to dashboard
```

### Login
```
1. User enters email, password
2. Frontend sends POST /auth/login
3. Backend retrieves user by email
4. Backend compares password hash
5. Backend generates JWT token
6. Frontend stores token in localStorage
7. Frontend includes token in all subsequent requests
8. User redirected to dashboard
```

### Protected Requests
```
1. Frontend includes token: Authorization: Bearer <token>
2. Backend middleware verifies token
3. If valid: extract userId, proceed to controller
4. If invalid: return 401 Unauthorized
5. Controller processes request with userId
```

### Token Structure
```
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "id": 1,
  "iat": 1234567890,
  "exp": 1234654290
}

Signature: HMACSHA256(header + payload, secret)
```

---

## Security Features

### 1. Password Security
- Bcryptjs hashing (10 salt rounds)
- Plaintext never stored
- Not returnable from API

### 2. Authentication
- JWT-based stateless authentication
- Token expiration (7 days default)
- Middleware verification on protected routes

### 3. Data Validation
- Email format validation
- Password length requirements
- Input sanitization in controllers

### 4. SQL Injection Prevention
- Parameterized queries (mysql2 driver)
- No string concatenation in SQL

### 5. CORS Protection
- Whitelist frontend URL
- Configurable via .env

### 6. Authorization
- User can only access their own data
- Frontend doesn't verify authorization
- Backend verifies userId ownership for all operations

---

## API Communication Pattern

### Request Example
```javascript
// Frontend: src/services/api.js
const response = await fetch('http://localhost:5000/api/expenses', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
```

### Response Format
```json
{
  "success": true/false,
  "message": "Description",
  "data": { /* payload */ }
}
```

### Error Handling
```javascript
try {
  const result = await apiCall('/endpoint', 'POST', data);
  // Handle success
} catch (error) {
  // Handle error
  console.error(error.message);
}
```

---

## Deployment Considerations

### Frontend Deployment
- Build: `npm run build`
- Output: dist/ folder
- Host on: Vercel, Netlify, AWS S3
- Update `FRONTEND_URL` in backend .env

### Backend Deployment
- Environment: Node.js hosting
- Host on: Heroku, AWS, DigitalOcean, Railway
- Update database credentials in .env
- Ensure MySQL accessibility

### Database Deployment
- Managed MySQL: AWS RDS, Google Cloud SQL, Azure MySQL
- Or self-hosted MySQL server
- Update DB_HOST, DB_USER, DB_PASSWORD in .env

---

## Scalability Considerations

### Current Limitations
- Single Node.js process (no clustering)
- No caching layer (Redis)
- No database connection pooling limits
- No API rate limiting

### Future Enhancements
- Load balancing for multiple backend instances
- Redis caching for categories and user data
- Database query optimization and more indexes
- Pagination for large result sets
- File upload handling with CDN
- Real-time features with WebSockets
- Background jobs for reports and notifications

---

## Development Workflow

### Local Development
```
1. Start MySQL service
2. Run: cd backend && npm run dev
3. In new terminal: npm run dev (frontend)
4. Frontend makes requests to http://localhost:5000/api
5. Changes auto-reload via Vite and Node watch
```

### Testing Workflow
```
1. Test registration in UI
2. Test login
3. Add expenses
4. Check database with MySQL client
5. Use browser DevTools to inspect network requests
6. Check console for errors
```

---

## File Size and Performance

### Bundle Sizes
- Frontend: ~300KB (React, Framer Motion, Recharts)
- Backend: Minimal Node.js process

### Database Performance
- Indexes on critical columns
- MySQL connection pooling
- Parameterized queries for safety

### API Response Times
- Authentication: ~50-100ms
- Data retrieval: ~10-50ms
- Complex stats queries: ~50-200ms
