# 14. Low Fidelity Prototype

## Overview
A low-fidelity prototype is a simplified, interactive version of the application that focuses on user flows and interactions rather than detailed design. This prototype demonstrates the core functionality and user journeys of the SpendSmart application.

## Purpose
- **User Testing:** Gather feedback on navigation and flows
- **Concept Validation:** Verify core features and functionality
- **Rapid Iteration:** Quickly make changes based on feedback
- **Wireframe Validation:** Test wireframe layouts in interactive format
- **Stakeholder Alignment:** Show progress and get approval

---

## Key Features of This Prototype

### 1. **Interactive Navigation**
- Click on screen names in the sidebar to navigate
- No page reloads - instant screen switching
- Breadcrumb trail shows current location
- Smooth transitions between screens

### 2. **Functional Forms**
- Input fields for user interaction
- Dropdowns for category selection
- Date and time pickers
- Checkboxes and radio buttons
- Form submission feedback

### 3. **Data Visualization**
- Mock charts and graphs (placeholder areas)
- Progress bars for budgets and goals
- Stats cards showing key metrics
- List views for transactions

### 4. **User Flows Demonstrated**

#### Flow 1: User Authentication
```
Login Page → OTP Verification → Dashboard
     ↓
Sign Up Page → OTP Verification → Dashboard
```

#### Flow 2: Expense Logging
```
Dashboard → Add Expense → Select Category → Save → Success Message → Dashboard
```

#### Flow 3: Analytics Review
```
Dashboard → Analytics → Select Time Period → View Charts → Back to Dashboard
```

#### Flow 4: Goal Tracking
```
Dashboard → Goals → View Progress → Back to Dashboard
```

#### Flow 5: Subscription Management
```
Dashboard → Subscriptions → View List → Back to Dashboard
```

---

## Prototype Screens

### 1. Authentication Screens

#### 1.1 Login Screen
**Elements:**
- Email input field (pre-filled with demo email)
- Password input field (pre-filled with demo password)
- Remember me checkbox
- Login button
- Forgot Password link
- Sign Up link

**Interactions:**
- Click "Login" → Navigate to OTP Verification
- Click "Create Account?" → Navigate to Sign Up
- Click "Forgot Password?" → Alert (functionality not implemented)

**Validation:**
- Email format check (placeholder)
- Password strength (placeholder)

#### 1.2 Sign Up Screen
**Elements:**
- Full Name input
- Email input
- Password input
- Confirm Password input
- Terms & Conditions checkbox
- Create Account button
- Login link

**Interactions:**
- Click "Create Account" → Navigate to OTP
- Click "Already have account?" → Navigate to Login

#### 1.3 OTP Verification Screen
**Elements:**
- Email display (partially masked)
- 6-digit code input
- Countdown timer (4:30)
- Verify button
- Resend OTP button

**Interactions:**
- Click "Verify & Continue" → Navigate to Dashboard
- Click "Resend Code" → Alert message

---

### 2. Main Application Screens

#### 2.1 Dashboard
**Sections:**
1. **Welcome Message** - Personalized greeting
2. **All-Time Analytics Widget**
   - Total Spent: PKR 85,000
   - Days Tracked: 45
   - Average Per Day: PKR 1,889
   - Transaction Count: (auto-calculated)

3. **Monthly Budget Widget**
   - Progress bar showing 85% usage
   - Remaining balance display
   - Status indicator (On Track / Over Budget)

4. **Smart Advice Widget**
   - Spending Score: 72/100
   - Personalized recommendation
   - Behavioral insight

5. **Streak Widget**
   - Current streak: 15 days
   - Best streak: 47 days

**Key Buttons:**
- ➕ Add Expense
- 📈 View Analytics

**Purpose:**
- Provide at-a-glance financial overview
- Motivate continued use with streaks
- Quick access to main features

---

#### 2.2 Add Expense Screen
**Form Fields:**
1. **Amount Input** (required)
   - Type: Number
   - Min: 0
   - Placeholder: 500

2. **Category Selection** (required)
   - Grid of 6 category icons
   - Options: Food, Transport, Education, Entertainment, Health, Shopping
   - Visual selection with hover states

3. **Date Picker** (required)
   - Default: Today
   - Type: Date picker

4. **Description** (optional)
   - Type: Textarea
   - Placeholder: "What did you spend on?"
   - 3-line default height

**Buttons:**
- 💾 Save Expense → Saves and returns to Dashboard
- Cancel → Returns to Dashboard without saving

**Features:**
- Category grid for quick selection
- Real-time form validation
- Success feedback after saving

---

#### 2.3 Expense History Screen
**Elements:**
1. **Search Box** - Search by description
2. **Category Filter** - Dropdown to filter by category
3. **Transaction List**
   - Each item shows: Description, Date, Amount
   - Date in light gray text
   - Amount aligned to right

**Sample Data:**
- Restaurant - May 4 - PKR 1,500
- Uber - May 4 - PKR 450
- Coffee - May 3 - PKR 250
- Grocery - May 3 - PKR 3,200

**Features:**
- Sortable by date, amount, category
- Pagination (future: load more)
- Quick actions (edit, delete) - placeholder

---

#### 2.4 Analytics Screen
**Elements:**
1. **Time Period Filter**
   - Buttons: Week (active), Month, Year
   - Selected period highlighted

2. **Category Breakdown Section**
   - Mock chart area (placeholder for pie/donut chart)
   - Category list with percentages
   - Food: PKR 25,000 (35%)
   - Transport: PKR 15,000 (21%)
   - Shopping: PKR 12,000 (17%)
   - Other: PKR 18,000 (27%)

3. **7-Day Trend Section**
   - Mock chart area (placeholder for bar chart)
   - Shows daily spending patterns

**Features:**
- Interactive time period selection
- Visual representation of spending data
- Percentage breakdown

---

#### 2.5 Savings Goals Screen
**Elements:**
1. **Create New Goal Button** - Opens form (placeholder)
2. **Goal Cards** (3 active goals)
   - Goal name and emoji
   - Target amount
   - Current savings
   - Progress bar with percentage
   - Days remaining

**Goal Examples:**
1. **💻 New Laptop**
   - Target: PKR 100,000
   - Saved: PKR 45,000 (45%)
   - Days Remaining: 123

2. **🏖️ Vacation**
   - Target: PKR 50,000
   - Saved: PKR 18,000 (36%)
   - Days Remaining: 180

3. **🚗 Emergency Fund**
   - Target: PKR 75,000
   - Saved: PKR 22,500 (30%)
   - No deadline (Ongoing)

**Features:**
- Visual progress tracking
- Auto-update on new expenses
- Achievement notifications (future)

---

#### 2.6 Recurring Expenses Screen
**Elements:**
1. **Add Subscription Button**
2. **Monthly Total Summary** - PKR 2,500
3. **Subscription List** (4 items)
   - Name, frequency, amount
   - Due date
   - Edit/Cancel buttons

**Subscriptions:**
1. Netflix - PKR 500/month - Due: May 10
2. Gym - PKR 2,000/month - Due: May 15
3. Spotify - PKR 180/month - Due: May 20
4. Cloud Storage - PKR 820/month - Due: June 5

**Features:**
- Subscription tracking
- Automated reminders (3 days before)
- Total monthly commitment display

---

#### 2.7 User Profile Screen
**Sections:**
1. **Account Information**
   - Name: John Doe
   - Email: john@example.com
   - Member Since: January 2024
   - Status: Active ✓

2. **Budget Configuration**
   - Default Monthly Budget input (PKR 50,000)
   - Save button

3. **Preferences**
   - Theme toggle (Light/Dark)
   - Language dropdown (English, Urdu, Spanish)
   - Currency selector

**Buttons:**
- Save - Updates settings
- Back to Dashboard
- Logout - Returns to login with confirmation

---

#### 2.8 Achievements Screen
**Elements:**
1. **Current Streak**
   - 15 Days (prominent display)
   - Best Streak: 47 Days
   - Total Transactions: 342

2. **Earned Badges** (4 badges)
   - First Expense ✓
   - Week Warrior (7 days) ✓
   - Budget Master ✓
   - Saver Supreme (30 days) ✓

3. **Locked Badges** (3 locked badges)
   - Goal Getter (Complete 1 goal)
   - Century Club (100 days)
   - Financial Guru (All achievements)

4. **Progress to Next Badge**
   - Century Club progress: 15% (85 days to go)
   - Visual progress bar

**Features:**
- Motivation through gamification
- Clear goals for next achievements
- Progress tracking

---

## User Flows & Interactions

### Primary User Journey (First Time User)
```
1. Start on Login Screen
2. Click "Create Account?" → Sign Up Screen
3. Fill in details (Name, Email, Password)
4. Click "Create Account" → OTP Verification
5. Enter 6-digit code → Dashboard
6. Dashboard loads with welcome message
7. Click "Add Expense" → Add Expense Form
8. Enter amount, select category, save → Back to Dashboard
9. Click "Analytics" → View spending trends
10. Click "Goals" → View savings progress
11. Explore other features
12. Click "Logout" → Back to Login
```

### Expense Logging Flow
```
From Any Screen → Click Add Expense → Fill Form → Save → Dashboard
      ↓
   Dashboard shows updated budget
   Analytics updated
   Goal progress auto-updated
```

### Analytics Review Flow
```
Dashboard → Analytics → Select Time Period → View Charts → Back to Dashboard
```

### Goal Management Flow
```
Dashboard → Goals → View Progress → Back to Dashboard
```

### Subscription Tracking Flow
```
Dashboard → Subscriptions → View List → Back to Dashboard
```

---

## Prototype Features & Interactions

### Form Elements
- **Text Input:** Email, name, description, search
- **Number Input:** Amount with validation
- **Date Picker:** For transaction dates
- **Dropdown:** Category and filter selection
- **Checkboxes:** Remember me, terms acceptance
- **Radio Buttons:** Theme selection
- **Textarea:** Detailed descriptions

### Buttons & Navigation
- **Primary Buttons:** Blue (#667eea) - main actions
- **Secondary Buttons:** Outline style - alternative actions
- **Hover States:** Color change and visual feedback
- **Active States:** Highlighted navigation items

### Feedback & Validation
- **Success Messages:** Green background with checkmark
- **Warning Messages:** Yellow background with alert
- **Error Messages:** Red background (placeholder)
- **Loading States:** (Future enhancement)
- **Confirmation Dialogs:** Alert boxes for destructive actions

### Data Visualization
- **Progress Bars:** For budgets, goals, achievements
- **Mock Charts:** Placeholder areas for actual charts
- **Stats Cards:** Key metrics in card format
- **Lists:** Transaction history and subscription lists

---

## Prototype Limitations & Future Enhancements

### Current Limitations
1. **No Backend:** Data doesn't persist between sessions
2. **Mock Data:** Fixed sample data for demonstration
3. **No Validation:** Email/password validation is basic
4. **No Real Charts:** Chart areas are placeholder boxes
5. **No Database:** No actual expense storage
6. **No Search:** Search functionality is placeholder

### Future Enhancements for High-Fidelity Prototype
1. **Data Persistence:** LocalStorage or Backend API
2. **Real-time Updates:** Charts update as expenses are added
3. **Advanced Validation:** Email verification, password strength
4. **Interactive Charts:** Recharts library with real data
5. **File Upload:** Receipt image upload for OCR
6. **Voice Input:** Web Speech API integration
7. **Notifications:** Toast messages and alerts
8. **Mobile Responsiveness:** Full mobile optimization
9. **Animations:** Smooth transitions and micro-interactions
10. **Accessibility:** Full WCAG 2.1 compliance

---

## Testing Scenarios

### Scenario 1: New User Onboarding
**Goal:** Test new user signup and initial dashboard setup
**Steps:**
1. Click "Create Account"
2. Fill signup form
3. Verify OTP
4. Set budget
5. Add first expense
6. View dashboard

**Expected Outcome:** User successfully onboarded with first expense tracked

### Scenario 2: Expense Logging & Analytics
**Goal:** Test expense tracking and analytics viewing
**Steps:**
1. Add multiple expenses with different categories
2. View analytics for week/month
3. Check budget status
4. Verify goal updates

**Expected Outcome:** All data correctly displayed in analytics

### Scenario 3: Goal Tracking
**Goal:** Test savings goal functionality
**Steps:**
1. View existing goals
2. Add new goal
3. Track progress
4. Achieve milestone

**Expected Outcome:** Goal progress updates automatically with expenses

### Scenario 4: Settings Management
**Goal:** Test user preferences and customization
**Steps:**
1. Go to profile
2. Change budget
3. Update theme/language
4. Save settings
5. Logout and re-login

**Expected Outcome:** Settings persist through sessions

---

## Prototype Metrics

| Metric | Value |
|--------|-------|
| Total Screens | 12 |
| Form Fields | 25+ |
| Interactive Elements | 50+ |
| Data Inputs | 100+ mock data points |
| User Flows | 5 major flows |
| Time to Complete Demo | 10-15 minutes |

---

## How to Use This Prototype

### For Stakeholders
1. Open the HTML file in browser
2. Click through screens in sidebar
3. Fill in sample data
4. Click buttons to see navigation
5. Provide feedback on flows and UX

### For Developers
1. Review form structures
2. Study data flows
3. Check navigation patterns
4. Note placeholder areas
5. Plan backend integration points

### For Designers
1. Validate wireframe layouts
2. Test interaction patterns
3. Review color schemes
4. Check typography
5. Optimize user flows

### For QA/Testing
1. Document test scenarios
2. Create test cases
3. Check all navigation paths
4. Validate form inputs
5. Test error handling

---

## Feedback Collection

### Questions to Ask Users
1. Is the navigation intuitive?
2. Can you easily add an expense?
3. Is the dashboard helpful?
4. Are the goals clear and motivating?
5. What features are most valuable?
6. What's confusing or missing?
7. Would you use this app?
8. What improvements would you suggest?

### Success Criteria
- User can complete core tasks in <2 minutes
- Navigation is intuitive without instructions
- Forms are easy to fill out
- Information is clearly displayed
- User wants to use the app
- No major usability issues

---

## Next Steps

### After Prototype Testing
1. **Gather Feedback** - Collect user and stakeholder feedback
2. **Iterate** - Make improvements based on feedback
3. **Validate** - Ensure improvements address feedback
4. **High-Fidelity** - Create polished visual design
5. **Development** - Begin actual development
6. **Testing** - Comprehensive QA and user testing
7. **Launch** - Release to production

### Design Decisions to Document
1. Why certain colors were chosen
2. Why forms are structured this way
3. Why navigation is organized like this
4. Why metrics are displayed prominently
5. Why gamification is emphasized

---

## Resources

### Design Files
- Wireframes: 13_UI_UX_Wireframes.html
- Use Cases: 11_UML_Diagrams.html
- Data Flow: 12_Data_Flow_Diagrams.html

### Development Resources
- React for UI components
- Recharts for data visualization
- React Router for navigation
- Formik for form management

### Feedback & Iteration
- User testing recordings
- Feedback spreadsheet
- Change log
- Version history

