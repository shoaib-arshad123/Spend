export const formatPKR = (amount) =>
  `PKR ${Number(amount).toLocaleString("en-PK")}`;

export const getDayOfWeek = (dateStr) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[new Date(dateStr).getDay()];
};

export const getAutoCategory = () => {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 10) return "Transportation";
  if (hour >= 12 && hour < 14) return "Food & Dining";
  if (hour >= 15 && hour < 17) return "Education";
  if (hour >= 18 && hour < 22) return "Entertainment";
  return "Other";
};

export const classifyUser = (totalSpent, budget) => {
  const pct = budget > 0 ? (totalSpent / budget) * 100 : 0;
  if (pct < 60) return "saver";
  if (pct < 85) return "balanced";
  return "spender";
};

export const getPredictionDays = (expenses, budget) => {
  if (!expenses.length || budget <= 0) return null;
  const now = new Date();
  const dayOfMonth = now.getDate();
  if (dayOfMonth === 0) return null;
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const dailyRate = totalSpent / dayOfMonth;
  if (dailyRate <= 0) return null;
  const remaining = budget - totalSpent;
  if (remaining <= 0) return 0;
  return Math.round(remaining / dailyRate);
};

export const getSmartAdvice = (expenses, lang) => {
  const catTotals = {};
  expenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });
  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const advice = {
    en: [],
  };
  if (top) {
    advice.en.push(`You spend the most on ${top[0]} (PKR ${top[1].toLocaleString()}). Consider reducing it.`);
  }
  const foodTotal = catTotals["Food & Dining"] || catTotals.food || 0;
  const entTotal = catTotals["Entertainment"] || catTotals.entertainment || 0;
  const transTotal = catTotals["Transportation"] || catTotals.transport || 0;

  if (transTotal > 4000) {
    advice.en.push("Your transport cost increased this week. Try carpooling.");
  }
  if (!advice.en.length) {
    advice.en.push("Great job! Keep tracking your expenses daily.");
  }
  return advice.en;
};

export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

export const SEED_EXPENSES = [];
