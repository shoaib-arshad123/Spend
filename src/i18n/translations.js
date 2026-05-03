export const translations = {
  appTitle: "Smart Expense Tracker",
  appSubtitle: "Your Financial Assistant",
  dashboard: "Dashboard",
  addExpense: "Add Expense",
  history: "History",
  advice: "Smart Advice",
  rewards: "Rewards",
  totalSpent: "Total Spent",
  budget: "Monthly Budget",
  remaining: "Remaining",
  savings: "Saved",
  addNew: "Add New Expense",
  amount: "Amount (PKR)",
  category: "Category",
  note: "Note (optional)",
  save: "Save Expense",
  cancel: "Cancel",
  search: "Search expenses...",
  filterAll: "All",
  noExpenses: "No expenses yet. Start tracking!",
  budgetAlert80: "You have used 80% of your budget",
  budgetAlertOver: "Budget exceeded! Overspent by",
  spendingHigh: "Your spending is higher than usual this week",
  prediction: "At your current rate, budget will finish in",
  days: "days",
  userSaver: "Saver",
  userBalanced: "Balanced",
  userSpender: "Spender",
  categories: {
    food: "Food",
    transport: "Transport",
    books: "Books",
    health: "Health",
    entertainment: "Entertainment",
    clothing: "Clothing",
    savings: "Savings",
    other: "Other",
  },
  adviceTitle: "Smart Suggestions",
  streakDays: "Day Streak",
  badges: "Badges Earned",
  setBudget: "Set Budget",
  weeklySpending: "Weekly Spending",
  categoryBreakdown: "By Category",
  recentExpenses: "Recent Expenses",
  viewAll: "View All",
  deleteConfirm: "Delete this expense?",
  topCategory: "Top spending category",
  savingTip: "Saving Tip",
};

export const getCategoryIcon = (cat) => {
  if (!cat) return "📦";
  const n = cat.toLowerCase();
  if (n.includes("food") || n.includes("din")) return "🍔";
  if (n.includes("trans") || n.includes("car") || n.includes("ride")) return "🚌";
  if (n.includes("book") || n.includes("educ") || n.includes("stat")) return "📚";
  if (n.includes("health") || n.includes("med") || n.includes("fit")) return "💊";
  if (n.includes("ent") || n.includes("game") || n.includes("mov")) return "🎮";
  if (n.includes("shop") || n.includes("cloth")) return "🛍️";
  if (n.includes("bill") || n.includes("util")) return "💡";
  if (n.includes("trav")) return "✈️";
  if (n.includes("sav")) return "💰";
  return "📦";
};

export const getCategoryColor = (cat) => {
  if (!cat) return "#6b7280";
  const n = cat.toLowerCase();
  if (n.includes("food") || n.includes("din")) return "#f5b800";
  if (n.includes("trans") || n.includes("car") || n.includes("ride")) return "#3b82f6";
  if (n.includes("book") || n.includes("educ") || n.includes("stat")) return "#8b5cf6";
  if (n.includes("health") || n.includes("med") || n.includes("fit")) return "#10b981";
  if (n.includes("ent") || n.includes("game") || n.includes("mov")) return "#ec4899";
  if (n.includes("shop") || n.includes("cloth")) return "#f97316";
  if (n.includes("bill") || n.includes("util")) return "#6366f1";
  if (n.includes("trav")) return "#06b6d4";
  if (n.includes("sav")) return "#10b981";
  return "#6b7280";
};
