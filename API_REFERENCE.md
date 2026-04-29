# API Reference - Expense Tracker

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints except `/auth/register` and `/auth/login` require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Creates a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "budget": 0
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

**Validation Rules:**
- Name: Required, non-empty
- Email: Required, valid email format, unique
- Password: Required, minimum 6 characters

---

### Login User
**POST** `/auth/login`

Authenticates user and returns JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "budget": 5000
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### Get Current User
**GET** `/auth/me`

Retrieves current authenticated user details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "budget": 5000
  }
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "message": "No token provided"
}
```

---

## Expense Endpoints

### Add Expense
**POST** `/expenses`

Creates a new expense entry.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 50.00,
  "category": "Food & Dining",
  "description": "Lunch at cafe",
  "date": "2024-04-26"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Expense added successfully",
  "expense": {
    "id": 1,
    "userId": 1,
    "amount": 50.00,
    "category": "Food & Dining",
    "description": "Lunch at cafe",
    "date": "2024-04-26"
  }
}
```

**Validation Rules:**
- amount: Required, positive number
- category: Required
- date: Required, valid date format (YYYY-MM-DD)

---

### Get Expenses
**GET** `/expenses`

Retrieves all expenses for the authenticated user with optional filters.

**Query Parameters:**
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)
- `category` (optional): Filter by category name (or 'all')

**Example:**
```
GET /expenses?startDate=2024-01-01&endDate=2024-12-31&category=Food%20%26%20Dining
```

**Response (Success - 200):**
```json
{
  "success": true,
  "expenses": [
    {
      "id": 1,
      "userId": 1,
      "amount": 50.00,
      "category": "Food & Dining",
      "description": "Lunch at cafe",
      "date": "2024-04-26",
      "createdAt": "2024-04-26T10:30:00.000Z",
      "updatedAt": "2024-04-26T10:30:00.000Z"
    }
  ]
}
```

---

### Update Expense
**PUT** `/expenses/:id`

Updates an existing expense.

**Parameters:**
- `id`: Expense ID

**Request Body:**
```json
{
  "amount": 75.00,
  "category": "Food & Dining",
  "description": "Dinner",
  "date": "2024-04-26"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Expense updated successfully"
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "Expense not found"
}
```

---

### Delete Expense
**DELETE** `/expenses/:id`

Deletes an expense entry.

**Parameters:**
- `id`: Expense ID

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "Expense not found"
}
```

---

### Get Expense Statistics
**GET** `/expenses/stats`

Retrieves expense statistics for a specific month.

**Query Parameters:**
- `month` (optional): Month number (1-12), defaults to current month
- `year` (optional): Year, defaults to current year

**Example:**
```
GET /expenses/stats?month=4&year=2024
```

**Response (Success - 200):**
```json
{
  "success": true,
  "stats": {
    "total": 250.00,
    "byCategory": [
      {
        "category": "Food & Dining",
        "amount": 150.00,
        "count": 3
      },
      {
        "category": "Transportation",
        "amount": 100.00,
        "count": 2
      }
    ],
    "daily": [
      {
        "date": "2024-04-26",
        "amount": 75.00
      },
      {
        "date": "2024-04-25",
        "amount": 50.00
      }
    ]
  }
}
```

---

## Budget Endpoints

### Set Budget
**POST** `/budget`

Sets the monthly budget for the user.

**Request Body:**
```json
{
  "amount": 5000.00
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Budget set successfully",
  "budget": 5000.00
}
```

**Validation Rules:**
- amount: Required, positive number greater than 0

---

### Get Budget
**GET** `/budget`

Retrieves budget information and spending summary.

**Response (Success - 200):**
```json
{
  "success": true,
  "budget": 5000.00,
  "spent": 250.00,
  "remaining": 4750.00,
  "percentage": 5
}
```

---

## Profile Endpoints

### Get Profile
**GET** `/profile`

Retrieves user profile information.

**Response (Success - 200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "budget": 5000.00,
    "language": "en",
    "theme": "dark",
    "createdAt": "2024-04-20T10:30:00.000Z"
  }
}
```

---

### Update Profile
**PUT** `/profile`

Updates user profile information.

**Request Body (all optional):**
```json
{
  "name": "Jane Doe",
  "language": "es",
  "theme": "light"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "john@example.com",
    "budget": 5000.00,
    "language": "es",
    "theme": "light"
  }
}
```

---

## Categories Endpoints

### Get Categories
**GET** `/categories`

Retrieves all available expense categories.

**Response (Success - 200):**
```json
{
  "success": true,
  "categories": [
    {
      "id": 1,
      "name": "Food & Dining",
      "icon": "🍔"
    },
    {
      "id": 2,
      "name": "Transportation",
      "icon": "🚗"
    },
    {
      "id": 3,
      "name": "Entertainment",
      "icon": "🎬"
    },
    {
      "id": 4,
      "name": "Shopping",
      "icon": "🛍️"
    },
    {
      "id": 5,
      "name": "Bills & Utilities",
      "icon": "💡"
    },
    {
      "id": 6,
      "name": "Health & Fitness",
      "icon": "⚕️"
    },
    {
      "id": 7,
      "name": "Education",
      "icon": "📚"
    },
    {
      "id": 8,
      "name": "Travel",
      "icon": "✈️"
    },
    {
      "id": 9,
      "name": "Other",
      "icon": "📌"
    }
  ]
}
```

---

## HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or missing required fields |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Token is invalid or expired |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## Error Response Format

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding in production for security.

---

## CORS Policy

The API accepts requests from:
```
http://localhost:5173
```

Configure the `FRONTEND_URL` in `.env` to change this.

---

## Pagination

Pagination is not currently implemented. All results are returned in full. Consider adding pagination for large datasets in future versions.
