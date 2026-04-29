export const formatPKR = (amount) =>
  `PKR ${Number(amount).toLocaleString("en-PK")}`;

export const getDayOfWeek = (dateStr) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[new Date(dateStr).getDay()];
};

export const getAutoCategory = () => {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 10) return "transport";
  if (hour >= 12 && hour < 14) return "food";
  if (hour >= 15 && hour < 17) return "books";
  if (hour >= 18 && hour < 22) return "entertainment";
  return "other";
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
    ur: [],
  };
  if (top) {
    advice.en.push(`You spend the most on ${top[0]} (PKR ${top[1].toLocaleString()}). Consider reducing it.`);
    advice.ur.push(`آپ سب سے زیادہ ${top[0]} پر خرچ کرتے ہیں۔ اسے کم کرنے کی کوشش کریں۔`);
  }
  if (catTotals.food > 5000) {
    advice.en.push("Try cooking at home to save on food expenses.");
    advice.ur.push("کھانے کے اخراجات بچانے کے لیے گھر پر کھانا پکانے کی کوشش کریں۔");
  }
  if (catTotals.entertainment > 3000) {
    advice.en.push("Entertainment spending is high. Try free alternatives.");
    advice.ur.push("تفریحی اخراجات زیادہ ہیں۔ مفت متبادل آزمائیں۔");
  }
  if (catTotals.transport > 4000) {
    advice.en.push("Your transport cost increased this week. Try carpooling.");
    advice.ur.push("آپ کی ٹرانسپورٹ لاگت اس ہفتے بڑھ گئی۔ کارپولنگ آزمائیں۔");
  }
  if (!advice[lang].length) {
    advice.en.push("Great job! Keep tracking your expenses daily.");
    advice.ur.push("شاباش! روزانہ اپنے اخراجات ٹریک کرتے رہیں۔");
  }
  return advice[lang];
};

export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

export const SEED_EXPENSES = [
  { id: "a1", amount: 350, category: "food", note: "Canteen lunch", date: "2025-04-15", time: "13:10" },
  { id: "a2", amount: 120, category: "transport", note: "Rickshaw", date: "2025-04-15", time: "08:00" },
  { id: "a3", amount: 800, category: "books", note: "OOP textbook", date: "2025-04-14", time: "11:30" },
  { id: "a4", amount: 500, category: "food", note: "Iftar items", date: "2025-04-14", time: "17:00" },
  { id: "a5", amount: 200, category: "transport", note: "Bus pass", date: "2025-04-13", time: "07:45" },
  { id: "a6", amount: 1200, category: "entertainment", note: "Mobile top-up", date: "2025-04-13", time: "19:00" },
  { id: "a7", amount: 450, category: "food", note: "Samosa + chai", date: "2025-04-12", time: "16:00" },
  { id: "a8", amount: 300, category: "health", note: "Paracetamol", date: "2025-04-12", time: "10:00" },
  { id: "a9", amount: 650, category: "clothing", note: "Socks and belt", date: "2025-04-11", time: "15:30" },
  { id: "a10", amount: 250, category: "food", note: "Evening snacks", date: "2025-04-11", time: "18:00" },
];
