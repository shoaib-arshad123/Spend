# 12. Data Flow Diagrams (DFD)

## Overview
Data Flow Diagrams (DFD) provide a graphical representation of how data moves through the SpendSmart system. They illustrate the processes, data stores, external entities, and data flows at different levels of abstraction.

---

## DFD Level 0: Context Diagram

### Purpose
The context diagram shows the complete system as a single process and displays all external entities that interact with it.

### Components

| Component | Symbol | Represents |
|-----------|--------|-----------|
| **External Entity** | Circle | User, Email Service, Bank API |
| **Process** | Rectangle/Circle | SpendSmart System |
| **Data Flow** | Arrow | Movement of data between entities and system |

### External Entities

1. **User (Student)** 
   - Initiates all actions
   - Provides expense data, queries
   - Receives dashboards, insights, reports

2. **Email Service**
   - Sends OTPs, alerts, reminders
   - Returns delivery confirmations
   - Third-party SMTP service (Nodemailer)

3. **Bank API** (Future Integration)
   - Provides transaction data
   - Validates account information
   - Returns transaction history

### Data Flows from Context Diagram

| From | To | Data | Type |
|------|----|----|------|
| User | System | Login, expenses, preferences | Input |
| System | User | Dashboard, analytics, insights | Output |
| System | Email | OTP, alerts, reminders | Outbound |
| Email | System | Delivery status | Inbound |
| Bank | System | Transactions | Inbound |
| System | Bank | Query requests | Outbound |

---

## DFD Level 1: Main Processes

### Seven Primary Processes

#### **P1: Authentication (🔐)**
- **Purpose:** Verify user identity and manage sessions
- **Inputs:** Login credentials, OTP
- **Outputs:** Session token, authentication status
- **Data Store:** D5 (Users)
- **Frequency:** Per login/logout

#### **P2: Expense Management (💰)**
- **Purpose:** Log, store, and retrieve expense records
- **Inputs:** Expense data (amount, category, date, description)
- **Outputs:** Expense confirmation, updated balance
- **Data Stores:** D1 (Expenses), D2 (Budgets)
- **Frequency:** On-demand + real-time updates
- **Sub-processes:**
  - P2.1: Validate expense data
  - P2.2: Calculate totals and budget impact
  - P2.3: Store in database
  - P2.4: Update analytics cache

#### **P3: Analytics (📊)**
- **Purpose:** Calculate spending trends and generate insights
- **Inputs:** Request for analytics data
- **Outputs:** Charts, metrics, recommendations
- **Data Stores:** D1 (Expenses), D2 (Budgets), D3 (Goals)
- **Frequency:** On-demand + periodic updates
- **Sub-processes:**
  - P3.1: Retrieve historical data
  - P3.2: Aggregate by category/period
  - P3.3: Calculate metrics and trends
  - P3.4: Generate AI insights

#### **P4: Goal Management (🎯)**
- **Purpose:** Create, track, and update savings goals
- **Inputs:** Goal data (name, target, deadline)
- **Outputs:** Goal status, progress updates
- **Data Store:** D3 (Goals)
- **Frequency:** On creation, periodically updated
- **Features:**
  - Track progress toward targets
  - Calculate days remaining
  - Send achievement notifications

#### **P5: Gamification (🏆)**
- **Purpose:** Track user engagement through streaks and badges
- **Inputs:** User activity, spending behavior
- **Outputs:** Streak counts, badge awards
- **Data Store:** D4 (Rewards)
- **Frequency:** Daily streak check, event-triggered badges
- **Metrics:**
  - Daily logging streaks
  - Budget adherence badges
  - Savings milestones

#### **P6: Notifications (🔔)**
- **Purpose:** Alert users about important events
- **Inputs:** Triggers (budget exceeded, goal achieved, subscription due)
- **Outputs:** Email alerts, SMS reminders
- **Data Stores:** D2 (Budgets), D3 (Goals), D8 (Recurring)
- **Frequency:** Event-triggered
- **Notification Types:**
  - Budget alerts
  - Goal achievements
  - Subscription reminders
  - Streak milestones

#### **P7: User Management (👤)**
- **Purpose:** Manage user profiles and preferences
- **Inputs:** Profile updates, preference changes
- **Outputs:** Stored preferences, theme settings
- **Data Store:** D5 (Users)
- **Frequency:** On-demand

---

## DFD Level 2: Detailed Processes

### P2: Expense Management Process (Detailed)

```
User Input → P2.1 Validate → P2.2 Process → P2.3 Store → P2.4 Cache Update → Confirmation
                    ↓
                Error Response
```

**Steps:**

1. **P2.1: Validate Expense**
   - Check amount > 0
   - Verify category exists
   - Validate date format
   - Ensure description not empty
   - Response: Valid/Invalid

2. **P2.2: Process Expense**
   - Retrieve current budget from D2
   - Calculate new remaining balance
   - Check if budget exceeded
   - Determine status: "On Track" / "Over Budget"

3. **P2.3: Store Data**
   - Write expense record to D1
   - Update budget remaining in D2
   - Generate transaction ID
   - Record timestamp

4. **P2.4: Update Cache**
   - Recalculate category totals
   - Update daily/monthly summaries
   - Refresh D1a (Analytics Cache)
   - Trigger dashboard refresh

---

### P3: Analytics Process (Detailed)

```
Analytics Request → P3.1 Retrieve → P3.2 Aggregate → P3.3 Calculate → P3.4 Insights → User
```

**Steps:**

1. **P3.1: Retrieve Data**
   - Query D1 (Expenses) for user
   - Query D2 (Budgets) for limits
   - Apply date filters
   - Return raw data

2. **P3.2: Aggregate Data**
   - Group by category
   - Group by time period (daily, weekly, monthly)
   - Calculate subtotals per group
   - Organize hierarchically

3. **P3.3: Calculate Metrics**
   - Total spending
   - Spending by category (%)
   - Daily average spending
   - Trend (increasing/decreasing)
   - Budget status (% used)
   - Days until budget depletion
   - Category predictions

4. **P3.4: Generate Insights**
   - Analyze spending patterns
   - Identify unusual activity
   - Generate recommendations
   - Calculate spending score (0-100)
   - Create actionable advice

---

### P6: Notification Process (Detailed)

```
P6.1 Check Triggers → P6.2 Determine Type → P6.3 Compose → P6.4 Send → Email Service
```

**Steps:**

1. **P6.1: Check Triggers**
   - Monitor budget status
   - Check goal progress
   - Review subscription dates
   - Check streak count
   - Conditions: Daily at 10 PM + event-triggered

2. **P6.2: Determine Type**
   - **Budget Alert:** If spending >= 80% of budget
   - **Goal Achievement:** If goal target reached
   - **Subscription Due:** If within 3 days
   - **Streak Milestone:** If streak = 7, 30, 100 days

3. **P6.3: Compose Message**
   - Select template by type
   - Fill dynamic values
   - Personalize with user name
   - Add call-to-action link
   - Generate subject line

4. **P6.4: Send Notification**
   - Queue message in D7
   - Call email service API
   - Record sending time
   - Mark delivery status
   - Set retry if failed

---

## Data Stores

### D1: Expenses Table
```
Structure:
- expense_id (PK)
- user_id (FK)
- amount (decimal)
- category_id (FK)
- description (string)
- date (datetime)
- created_at (datetime)
- updated_at (datetime)

Indexes: user_id, date, category_id
```

### D2: Budgets Table
```
Structure:
- budget_id (PK)
- user_id (FK)
- month (date)
- limit (decimal)
- spent (decimal)
- remaining (decimal)
- status (enum: on_track/over_budget)
- created_at (datetime)

Indexes: user_id, month
```

### D3: Goals Table
```
Structure:
- goal_id (PK)
- user_id (FK)
- name (string)
- target_amount (decimal)
- current_amount (decimal)
- deadline (date)
- status (enum: active/completed/archived)
- created_at (datetime)

Indexes: user_id, status
```

### D4: Rewards Table
```
Structure:
- reward_id (PK)
- user_id (FK)
- streak_count (int)
- badge_type (string)
- date_earned (datetime)
- created_at (datetime)

Indexes: user_id, badge_type
```

### D5: Users Table
```
Structure:
- user_id (PK)
- email (string, unique)
- password_hash (string)
- name (string)
- theme (enum: dark/light)
- accent_color (string)
- default_budget (decimal)
- created_at (datetime)
- last_login (datetime)

Indexes: email
```

### D6: Categories Table
```
Structure:
- category_id (PK)
- name (string)
- icon (string)
- color (string)
- user_id (FK, nullable for global categories)
- created_at (datetime)

Indexes: user_id
```

### D7: Notifications Table
```
Structure:
- notification_id (PK)
- user_id (FK)
- type (enum: budget/goal/subscription/streak)
- message (text)
- sent_at (datetime)
- read_at (datetime, nullable)
- email_status (enum: pending/sent/failed)

Indexes: user_id, sent_at
```

### D8: Recurring Expenses Table
```
Structure:
- recurring_id (PK)
- user_id (FK)
- name (string)
- amount (decimal)
- frequency (enum: daily/weekly/monthly/yearly)
- next_due_date (date)
- category_id (FK)
- created_at (datetime)

Indexes: user_id, next_due_date
```

### D1a: Analytics Cache (In-Memory)
- Category totals (refreshed per expense)
- Daily totals (refreshed per expense)
- Monthly totals (refreshed daily)
- Trend data (refreshed daily)
- TTL: 1 hour

---

## Data Dictionary - Key Flows

### Expense Input Flow
```
{
  amount: number (required, > 0),
  category_id: string (required),
  date: datetime (required),
  description: string (optional),
  receipt_image: binary (optional)
}
```

### Expense Output Flow
```
{
  expense_id: string,
  user_id: string,
  amount: number,
  category: string,
  date: datetime,
  remaining_budget: number,
  budget_status: "on_track" | "over_budget",
  created_at: datetime
}
```

### Analytics Output Flow
```
{
  total_spent: number,
  budget_limit: number,
  remaining: number,
  percentage_used: number,
  by_category: {
    [category]: {
      amount: number,
      percentage: number
    }
  },
  daily_average: number,
  trend: "increasing" | "stable" | "decreasing",
  days_until_depletion: number,
  insights: string[],
  spending_score: number,
  recommendations: string[]
}
```

---

## Data Flow Timing & Frequency

| Data Flow | Trigger | Frequency | Latency Requirement |
|-----------|---------|-----------|-------------------|
| Expense Input | User action | On demand | < 100ms |
| Expense Store | Validation success | Per transaction | < 500ms |
| Analytics Update | Per expense | Real-time | < 1s |
| Notification Check | Scheduled + events | Daily 10 PM + immediate | < 5 minutes |
| Email Send | Notification triggered | Immediate | < 30s |
| Cache Refresh | Per expense | Real-time | < 500ms |
| Goal Update | Per expense | Real-time | < 1s |
| Badge Award | Criteria met | Event-based | < 1 minute |

---

## System Constraints & Rules

### Data Validation Rules
- **Amounts:** Must be positive, max 10 million
- **Categories:** Must exist in D6, cannot be empty
- **Dates:** Cannot be in future, max 1 year old
- **Descriptions:** Max 500 characters
- **Emails:** Valid format, unique per user

### Business Rules
- Budget resets on 1st of month
- Streaks reset if no expense logged for a day
- Notifications only sent if user opted in
- Goals can only be deleted if not started
- Recurring expenses auto-log on due date

### Security Rules
- All user data filtered by user_id
- Passwords hashed using bcrypt
- OTP valid for 10 minutes only
- API calls rate-limited to 100/15 minutes
- Audit logs kept for 90 days

---

## DFD-to-Database Mapping

| Process | Read Tables | Write Tables | Update Tables |
|---------|------------|-------------|---------------|
| P1 | D5 | D5 | D5 |
| P2 | D2, D6 | D1 | D2, D1a |
| P3 | D1, D2, D3 | - | D1a |
| P4 | D3 | D3 | D3 |
| P5 | D4 | D4 | D4 |
| P6 | D2, D3, D8 | D7 | D7 |
| P7 | D5 | - | D5 |

---

## Performance Optimization Strategies

### Query Optimization
- Indexes on frequently filtered fields (user_id, date)
- Pagination for large result sets (50 items/page)
- Caching of analytics data (D1a)

### Process Optimization
- Asynchronous notification sending (background job)
- Batch processing for recurring expense updates
- Cache warming before peak hours

### Database Optimization
- Connection pooling
- Query result caching
- Archive old expense records (>2 years)

---

## Future Enhancements

1. **Enhanced Analytics**
   - Machine learning-based predictions
   - Budget optimization suggestions
   - Anomaly detection

2. **Advanced Notifications**
   - SMS notifications
   - Push notifications (mobile app)
   - Customizable alert thresholds

3. **Data Integration**
   - Bank account synchronization
   - Credit card import
   - Cryptocurrency tracking

4. **Reporting**
   - PDF export of monthly statements
   - Tax category reports
   - Annual spending summary

