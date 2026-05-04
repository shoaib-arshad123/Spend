# 11. UML Diagrams

## 11.1 Use Case Diagram

### Overview
The Use Case Diagram illustrates the interactions between actors (Student Users, System, and Administrator) and the various use cases in the SpendSmart application. It provides a high-level view of system functionality and user interactions.

### Actors

| Actor | Role | Responsibilities |
|-------|------|------------------|
| **Student User** | Primary Actor | Manages expenses, tracks budgets, sets goals, receives insights |
| **System** | Secondary Actor | Automates notifications, tracks habits, calculates streaks, awards badges |
| **Administrator** | Secondary Actor | Monitors users, manages system health, views analytics |

---

### Use Cases Breakdown

#### **Authentication Module (Cases 1-3)**
- **Sign Up**: User creates a new account with email and password
- **Log In**: User authenticates using credentials, receives OTP verification
- **Log Out**: User securely exits the application

#### **Dashboard & Navigation (Cases 4-5, 14-17, 23)**
- **Access Dashboard**: Main hub after login showing financial overview
- **View Monthly Budget & Spending Status**: Real-time budget progress tracking
- **View Profile**: Access personal settings and preferences
- **Change Theme & Preferences**: Customize visual appearance and settings
- **Check Rewards**: View streaks, badges, and achievement progress
- **Get Notifications**: View alerts and reminders
- **Manage Data**: View, search, and archive expense history

#### **Expense Logging (Cases 6-8)**
Three distinct pathways for recording expenses:
- **Add Expense Manually**: Traditional form-based entry with amount, category, date, description
- **Scan Bill/Receipt**: OCR-powered bill scanning with automated amount detection
- **Log via Voice Input**: Hands-free voice-based logging (e.g., "Spent 500 on lunch")

All three methods include: **Select Category** - Categorizing expenses (Food, Transport, Education, Entertainment, etc.)

#### **Analytics & Insights (Cases 9-10, 13)**
- **View Spending Trends**: Access comprehensive spending analytics
- **View Category Breakdown**: Interactive donut charts showing category distribution
- **View 7-Day Trends**: Bar charts displaying weekly spending patterns
- **Receive AI Financial Insights & Score**: Personalized spending scores and behavioral recommendations

#### **Financial Planning (Cases 11-12)**
- **Create & Track Savings Goals**: Set targets (laptop, emergency fund, etc.) and monitor progress
- **Manage Recurring Expenses**: Track subscriptions (Netflix, gym, mobile plans) and receive reminders

#### **System Automation (Cases 18-22)**
- **Send Email OTP**: Secure authentication via email verification
- **Calculate Daily Streaks**: Track consecutive days of expense logging
- **Award Achievement Badges**: Grant badges based on spending behavior
- **Predict Days Until Budget Depletion**: Calculate budget runway
- **Send Subscription Reminders**: Alert users about upcoming recurring payments

#### **Administrative Functions (Cases 24-25)**
- **Access Admin Dashboard**: Admin portal for system monitoring
- **Monitor Users & System Stats**: View user statistics and system health metrics

---

### Use Case Relationships

#### **Include Relationships** (dotted lines)
- All expense logging methods (Manual, OCR, Voice) include **Select Category**
- This represents a mandatory sub-step in the expense creation process

#### **Extension Points**
- Voice Input extends the basic expense logging with natural language processing
- OCR scanning extends manual entry with automated detection

---

### Key Features Represented

| Feature | Use Cases | Priority |
|---------|-----------|----------|
| Authentication | 1-3 | Critical |
| Expense Tracking | 4-8, 23 | Critical |
| Analytics | 9-10, 13 | High |
| Goal Management | 11-12 | High |
| Gamification | 16, 19-20 | Medium |
| Notifications | 17-18, 22 | High |
| Personalization | 14-15 | Medium |
| Administration | 24-25 | Medium |

---

### System Boundaries

The diagram shows clear boundaries:
- **Left boundary**: Student User interactions (main functionality)
- **Right boundary**: Administrator functions
- **Center**: System-automated processes (background tasks)

---

### Flow Patterns

**Typical User Journey:**
1. Sign Up / Log In (Cases 1-2)
2. Access Dashboard (Case 4)
3. Log Expense via Manual/OCR/Voice (Cases 6-8)
4. View Analytics (Cases 9-10)
5. Check Goals & Streaks (Cases 11-12, 16)
6. Receive AI Insights (Case 13)

**System Background Processes:**
- Continuously track streaks (Case 19)
- Award badges when milestones met (Case 20)
- Send notifications for subscriptions (Case 22)
- Calculate predictive budget data (Case 21)

---

### Detailed Use Case Specifications

#### **UC-1: Sign Up**
- **Actor**: Student User
- **Precondition**: User not yet registered
- **Main Flow**:
  1. User navigates to sign-up page
  2. Enters email, password, and confirms password
  3. System validates email format and password strength
  4. Account created successfully
- **Postcondition**: User can now log in

#### **UC-6: Add Expense Manually**
- **Actor**: Student User
- **Precondition**: User is logged in and on dashboard
- **Main Flow**:
  1. User clicks "Add Expense"
  2. System presents expense form
  3. User enters amount, selects category, picks date, adds description
  4. System validates data (amount > 0, valid category)
  5. Expense is recorded and dashboard updates
- **Postcondition**: Expense appears in history; analytics updated

#### **UC-7: Scan Bill/Receipt**
- **Actor**: Student User
- **Precondition**: User has camera access; is logged in
- **Main Flow**:
  1. User clicks "Scan Receipt"
  2. System opens camera/file upload
  3. User captures receipt image
  4. OCR engine extracts amount, merchant, date
  5. System presents prefilled form for confirmation
  6. User selects/confirms category
  7. Expense is saved
- **Postcondition**: Expense recorded with OCR-extracted data

#### **UC-13: Receive AI Financial Insights**
- **Actor**: System, Student User
- **Precondition**: User has logged expenses (>=3 days)
- **Main Flow**:
  1. System analyzes spending patterns
  2. System calculates spending score (0-100)
  3. System generates contextual advice
  4. Dashboard displays insights widget
  5. User reviews recommendations
- **Postcondition**: Insights displayed on dashboard

---

### Technology Considerations

- **Authentication**: OTP-based verification for security
- **OCR**: Tesseract.js for receipt scanning
- **Voice Processing**: Web Speech API for voice input
- **Real-time Updates**: WebSocket for live notifications
- **AI Insights**: Rule-based recommendation engine

---

### Future Extensions

1. **Social Sharing**: Share goals and achievements with friends
2. **Budget Collaboration**: Shared family or roommate budgets
3. **Bank Integration**: Direct synchronization with bank accounts
4. **Mobile App**: Native iOS/Android applications
5. **Advanced Analytics**: Machine learning-based spending predictions
6. **Bill Splitting**: Integration with splitting apps for shared expenses

---

### Notes

- The diagram encompasses 25 primary use cases
- Three distinct actors with different permission levels
- Emphasis on automation and user convenience
- Strong focus on data security and privacy
- Scalable architecture for future enhancements

