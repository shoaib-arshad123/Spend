import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  authApi, expenseApi, budgetApi, profileApi, categoryApi,
  notificationApi, recurringApi, goalsApi
} from "../services/supabaseApi";
import { mergeCategories } from "../utils/categories";

const AppContext = createContext(null);

const getLocalDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getLocalMonthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const calculateNextDate = (current, freq) => {
  const d = new Date(current);
  if (freq === "daily") d.setDate(d.getDate() + 1);
  else if (freq === "weekly") d.setDate(d.getDate() + 7);
  else if (freq === "monthly") d.setMonth(d.getMonth() + 1);
  else if (freq === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

export function AppProvider({ children }) {
  // Theme & Lang (Keep in LocalStorage for instant load)
  const [theme, setThemeState] = useState(() => localStorage.getItem("sset_theme") || "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sset_theme", theme);
  }, [theme]);
  const toggleTheme = useCallback(() => setThemeState(t => t === "dark" ? "light" : "dark"), []);

  // Accent Color
  const [accent, setAccentState] = useState(() => localStorage.getItem("sset_accent") || "orange");
  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem("sset_accent", accent);
  }, [accent]);
  const setAccent = useCallback((a) => setAccentState(a), []);

  const [lang, setLang] = useState("en");

  // Auth token
  const [token, setToken] = useState(() => localStorage.getItem("sset_token") || null);

  // User State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("sset_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Data States
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudgetState] = useState(0);
  const [defaultBudget, setDefaultBudget] = useState(0);
  const [budgetHistory, setBudgetHistory] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [goals, setGoals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [dueSubscriptions, setDueSubscriptions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [celebrationReward, setCelebrationReward] = useState(null); // For badge unlock celebrations
  const [unlockedBadges, setUnlockedBadges] = useState(() =>
    JSON.parse(localStorage.getItem("sset_unlocked_badges") || "[]")
  );
  const processingSubsRef = useRef(new Set());
  const toastDedupeRef = useRef(new Map());
  const notificationDedupeRef = useRef(new Map());
  const lastNotificationSoundAtRef = useRef(0);
  const badgeBaselineReadyRef = useRef(false);
  const audioCtxRef = useRef(null);

  const ensureAudioContext = () => {
    if (audioCtxRef.current) return audioCtxRef.current;
    if (typeof window === "undefined" || !(window.AudioContext || window.webkitAudioContext)) return null;
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtxRef.current;
  };

  const playTone = useCallback((frequency, duration = 0.09, type = "sine", volume = 0.18) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }, []);

  const playSequence = useCallback((notes = []) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    let start = ctx.currentTime + 0.02;
    notes.forEach(({ freq, dur = 0.08, type = "sine", vol = 0.15 }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = vol;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      start += dur + 0.02;
    });
  }, []);

  const triggerHaptic = useCallback((type = "click") => {
    if (typeof window === "undefined" || !window.navigator?.vibrate) return;
    try {
      if (type === "success") window.navigator.vibrate([15, 30, 15]);
      else if (type === "error" || type === "danger") window.navigator.vibrate([50, 50, 50]);
      else if (type === "warning") window.navigator.vibrate([30, 40, 30]);
      else window.navigator.vibrate(10); // standard click
    } catch (e) { /* ignore */ }
  }, []);

  const playNotificationSound = useCallback(() => {
    playSequence([
      { freq: 660, dur: 0.08, type: "sine", vol: 0.18 },
      { freq: 880, dur: 0.08, type: "sine", vol: 0.17 },
      { freq: 1040, dur: 0.1, type: "sine", vol: 0.16 }
    ]);
  }, [playSequence]);

  const playJingle = useCallback(() => {
    playSequence([
      { freq: 523, dur: 0.12, type: "triangle", vol: 0.16 },
      { freq: 659, dur: 0.12, type: "triangle", vol: 0.16 },
      { freq: 784, dur: 0.16, type: "triangle", vol: 0.16 },
      { freq: 880, dur: 0.18, type: "triangle", vol: 0.14 }
    ]);
  }, [playSequence]);

  // Persist token
  useEffect(() => {
    if (token) localStorage.setItem("sset_token", token);
    else localStorage.removeItem("sset_token");
  }, [token]);

  // Persist user
  useEffect(() => {
    if (user) localStorage.setItem("sset_user", JSON.stringify(user));
    else localStorage.removeItem("sset_user");
  }, [user]);

  const refreshBudget = useCallback(async () => {
    if (!user || !token) return;
    try {
      const data = await budgetApi.get();
      if (data.success) {
        setBudgetState(data.budget || 0);
        setDefaultBudget(data.defaultBudget || 0);
      }
    } catch (err) {
      console.error("Error fetching budget:", err);
    }
  }, [user, token]);

  const refreshBudgetHistory = useCallback(async () => {
    if (!user || !token) return;
    try {
      const data = await budgetApi.getHistory();
      if (data.success) {
        setBudgetHistory(data.history || []);
      }
    } catch (err) {
      console.error("Error fetching budget history:", err);
    }
  }, [user, token]);

  const refreshExpenses = useCallback(async () => {
    if (!user || !token) return;
    try {
      const expData = await expenseApi.getAll();
      if (expData.success) {
        const mappedExpenses = (expData.expenses || []).map(e => ({
          ...e,
          amount: Number(e.amount),
          date: e.date ? String(e.date).slice(0, 10) : e.date,
          isHidden: e.isHidden === true
        }));
        setExpenses(mappedExpenses);
      }
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  }, [user, token]);

  // Toasts - must be before logout, refreshRecurring, refreshGoals
  const pushToast = useCallback((toast) => {
    const now = Date.now();
    const key = `${toast.type || "info"}:${toast.message || ""}`;
    const lastShown = toastDedupeRef.current.get(key) || 0;
    if (toast.dedupe !== false && now - lastShown < 1400) return;
    toastDedupeRef.current.set(key, now);

    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-2), { ...toast, id }]);

    if (toast.type === "success") {
      triggerHaptic("success");
    } else if (toast.type === "danger" || toast.type === "error") {
      triggerHaptic("error");
      playTone(300, 0.15, "sawtooth");
    } else {
      triggerHaptic("click");
    }

    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3800);
  }, [triggerHaptic, playTone]);

  const pushNotification = useCallback((notif, options = {}) => {
    const {
      dedupeKey,
      dedupeMs = 5000,
      persist = true,
      sound = true,
      haptic = true,
      desktop = false,
    } = options;

    const dedupeId = dedupeKey || `${notif.type || "info"}:${notif.title || ""}:${notif.message || ""}`;
    const nowMs = Date.now();
    const lastShown = notificationDedupeRef.current.get(dedupeId) || 0;
    if (dedupeMs > 0 && nowMs - lastShown < dedupeMs) return null;
    notificationDedupeRef.current.set(dedupeId, nowMs);

    const now = new Date().toISOString();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const n = { ...notif, id: tempId, createdAt: now, time: now, read: false, isRead: false };

    setNotifications(prev => [n, ...prev].slice(0, 60));

    if (sound && Date.now() - lastNotificationSoundAtRef.current > 900) {
      lastNotificationSoundAtRef.current = Date.now();
      playNotificationSound();
    }
    if (haptic) triggerHaptic(notif.type || "success");

    if (persist && token) {
      notificationApi.create(notif)
        .then(data => {
          if (data.success && data.notification) {
            setNotifications(prev => prev.map(item =>
              item.id === tempId ? { ...data.notification, isRead: false, read: false } : item
            ));
          } else if (!data.success) {
            console.warn("Notification sync failed:", data.message);
          }
        })
        .catch(err => console.error("Network error during notification sync:", err));
    }

    if (desktop && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(n.title || "SpendSmart", {
          body: n.message,
          icon: "/logo.png"
        });
      }
    }
    return n;
  }, [playNotificationSound, token, triggerHaptic]);

  const logout = useCallback(() => {
    authApi.logout().catch(console.error);
    setUser(null);
    setToken(null);
    setExpenses([]);
    setBudgetState(0);
    setDefaultBudget(0);
    setBudgetHistory([]);
    setRecurring([]);
    setGoals([]);
    setDueSubscriptions(0);
    setNotifications([]);
    setCategories([]);
    badgeBaselineReadyRef.current = false;
    processingSubsRef.current.clear();
    pushToast({ type: "info", message: "Logged out successfully." });
  }, [pushToast]);

  const refreshRecurring = useCallback(async () => {
    if (!user || !token) return;
    try {
      const data = await recurringApi.getAll();
      if (data.success) {
        setRecurring((data.recurring || []).map(r => ({
          ...r,
          amount: Number(r.amount),
          isActive: r.isActive === true || r.isActive === 1
        })));
      } else if (data.message === 'Invalid token') {
        logout();
      }
    } catch (err) {
      console.error("Error fetching recurring expenses:", err);
    }
  }, [logout, token, user]);

  const refreshGoals = useCallback(async () => {
    if (!user || !token) return;
    try {
      const data = await goalsApi.getAll();
      if (data.success) {
        const mappedGoals = (data.goals || []).map(g => ({
          ...g,
          targetAmount: Number(g.targetAmount),
          savedAmount: Number(g.savedAmount),
          isCompleted: g.isCompleted === true || g.isCompleted === 1
        }));
        setGoals(mappedGoals);

        const today = getLocalDateKey();
        const lastGoalNotif = localStorage.getItem("last_notified_goals");
        if (mappedGoals.length > 0 && lastGoalNotif !== today) {
          const activeGoals = mappedGoals.filter(g => !g.isCompleted);
          if (activeGoals.length > 0) {
            const urgent = activeGoals.filter(g => {
              if (!g.deadline) return false;
              const daysLeft = Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24));
              return daysLeft > 0 && daysLeft <= 7 && g.savedAmount < g.targetAmount;
            });

            if (urgent.length > 0) {
              localStorage.setItem("last_notified_goals", today);
              pushNotification({ title: "Goal Deadline Approaching ⏳", message: `You have ${urgent.length} goal(s) due within a week. Keep saving!`, type: "warning", icon: "🎯" });
            } else {
              const stagnant = activeGoals.filter(g => (g.savedAmount || 0) === 0);
              if (stagnant.length > 0) {
                localStorage.setItem("last_notified_goals", today);
                pushNotification({ title: "Start Saving 🎯", message: `You have ${stagnant.length} goals with no progress. Make your first contribution!`, type: "info", icon: "💰" });
              }
            }
          }
        }
      } else if (data.message === 'Invalid token') {
        logout();
      }
    } catch (err) {
      console.error("Error fetching savings goals:", err);
    }
  }, [logout, pushNotification, token, user]);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      playJingle();
      pushToast({ type: "success", message: "Notifications enabled! 🔔" });
      return true;
    }
    return false;
  }, [playJingle, pushToast]);

  // --- Auth Handlers ---
  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    if (!data.success) throw new Error(data.message);
    setIsLoading(true);
    setToken(data.token);
    setUser(data.user);
    badgeBaselineReadyRef.current = false;
    pushToast({ type: "success", message: `Welcome back, ${data.user.name}!` });
    return data;
  }, [pushToast]);

  const register = useCallback(async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    if (!data.success) throw new Error(data.message || "Registration failed");
    setIsLoading(true);
    setToken(data.token);
    setUser(data.user);
    setShowOnboarding(true);
    badgeBaselineReadyRef.current = false;
    pushNotification({
      title: "Welcome to SpendSmart! 🚀",
      message: `Hi ${data.user.name}, we're excited to help you save more. Start by setting your monthly budget in Profile!`,
      type: "success",
      icon: "👋"
    });
    pushToast({ type: "success", message: `Welcome, ${data.user.name}! You can verify your email anytime from Profile.` });
    return data;
  }, [pushToast, pushNotification]);



  // --- SECURITY & VERIFICATION ---
  const sendOTP = useCallback(async (type, value) => {
    try {
      const data = await authApi.sendOTP(type, value);
      if (!data.success) throw new Error(data.message);
      pushNotification({ title: "OTP Sent", message: data.message, type: "info", icon: "📧" });
      pushToast({ type: "info", message: data.message });
      return data;
    } catch (err) {
      pushToast({ type: "danger", message: err.message || "Failed to send OTP" });
      throw err;
    }
  }, [pushToast, pushNotification]);

  const verifyOTP = useCallback(async (type, otp) => {
    try {
      const data = await authApi.verifyOTP(type, otp);
      if (!data.success) throw new Error(data.message);
      pushNotification({ title: "Verification Successful", message: data.message, type: "success", icon: "✅" });
      pushToast({ type: "success", message: data.message });
      const meData = await authApi.me();
      if (meData.success) setUser(meData.user);
      return data;
    } catch (err) {
      pushToast({ type: "danger", message: err.message || "Verification failed" });
      throw err;
    }
  }, [pushToast, pushNotification]);

  const forgotPassword = useCallback(async (identity) => {
    try {
      const data = await authApi.forgotPassword(identity);
      if (!data.success) throw new Error(data.message);
      pushNotification({ title: "Password Reset Requested", message: data.message, type: "info", icon: "🔑" });
      pushToast({ type: "info", message: data.message });
      return data;
    } catch (err) {
      pushToast({ type: "danger", message: err.message || "Request failed" });
      throw err;
    }
  }, [pushToast, pushNotification]);

  const resetPassword = useCallback(async (identity, otp, newPassword) => {
    try {
      const data = await authApi.resetPassword(identity, otp, newPassword);
      if (!data.success) throw new Error(data.message);
      pushNotification({ title: "Password Reset", message: data.message, type: "success", icon: "🔒" });
      pushToast({ type: "success", message: data.message });
      return data;
    } catch (err) {
      pushToast({ type: "danger", message: err.message || "Reset failed" });
      throw err;
    }
  }, [pushToast, pushNotification]);

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    try {
      const data = await authApi.changePassword(oldPassword, newPassword);
      if (!data.success) throw new Error(data.message);
      pushNotification({ title: "Security Update", message: data.message, type: "success", icon: "🛡️" });
      pushToast({ type: "success", message: data.message });
      return data;
    } catch (err) {
      pushToast({ type: "danger", message: err.message || "Update failed" });
      throw err;
    }
  }, [pushToast, pushNotification]);

  // --- Expense Handlers ---
  const addExpense = useCallback(async (exp, customNotification = null) => {
    if (!user) {
      pushToast({ type: "danger", message: "You must be signed in to add expenses." });
      return { success: false, message: "You must be signed in." };
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlySpent = expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const remaining = (budget || 0) - monthlySpent;

    if (budget > 0 && Number(exp.amount) > remaining) {
      triggerHaptic("error");
      const msg = "Budget exceeded! Cannot add this expense.";
      pushToast({ type: "danger", message: `❌ ${msg}` });
      return { success: false, message: msg };
    }

    try {
      const data = await expenseApi.add(exp);
      if (!data.success) {
        if (data.message === 'Invalid token' || data.message === 'No token provided') logout();
        return { success: false, message: data.message || "Failed to save expense" };
      }

      // Expense saved successfully - update local state immediately
      setExpenses(prev => [{ ...exp, id: data.expense?.id || Date.now(), amount: Number(exp.amount) }, ...prev]);
      pushToast({ type: "success", message: `✅ PKR ${Number(exp.amount).toLocaleString()} added!` });

      // One notification per expense (saved to database via pushNotification)
      if (customNotification) {
        pushNotification(customNotification);
      } else {
        pushNotification({
          title: "Expense Added",
          message: `${exp.category}: PKR ${Number(exp.amount).toLocaleString()}${exp.description ? ` — ${exp.description}` : ''}`,
          type: "success",
          icon: "💸"
        });
      }

      if (Number(exp.amount) >= 5000) {
        pushNotification({
          title: "Large Spending Alert",
          message: `A large transaction of PKR ${Number(exp.amount).toLocaleString()} was recorded.`,
          type: "warning",
          icon: "⚠️"
        });
      }

      // Budget alerts only when crossing a threshold (not on every expense)
      const newMonthlySpent = monthlySpent + Number(exp.amount);
      const monthBudget = budget || 0;
      if (monthBudget > 0) {
        const prevPct = Math.round((monthlySpent / monthBudget) * 100);
        const newPct = Math.round((newMonthlySpent / monthBudget) * 100);
        if (prevPct < 100 && newPct >= 100) {
          pushNotification({
            title: "Budget Exceeded",
            message: `You've gone over your PKR ${monthBudget.toLocaleString()} monthly budget.`,
            type: "danger",
            icon: "🚨"
          });
        } else if (prevPct < 80 && newPct >= 80) {
          pushNotification({
            title: "Budget Warning",
            message: `You've used ${newPct}% of your monthly budget. PKR ${Math.max(0, monthBudget - newMonthlySpent).toLocaleString()} left.`,
            type: "warning",
            icon: "⚠️"
          });
        }
      }

      try { refreshBudget(); } catch (e) { console.warn("Budget refresh failed:", e); }

      return { success: true };
    } catch (err) {
      console.error("Expense save error:", err);
      pushToast({ type: "danger", message: "Failed to save expense. Check your connection." });
      return { success: false, message: "Network error. Please try again." };
    }
  }, [user, token, expenses, budget, pushToast, pushNotification, refreshBudget, logout, triggerHaptic]);

  const deleteExpense = useCallback(async (id) => {
    const expense = expenses.find(e => e.id === id);
    try {
      await expenseApi.delete(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      refreshBudget();

      // Re-add: Auto-reverse goal savings
      if (expense?.description?.startsWith("Savings for: ")) {
        const goalName = expense.description.replace("Savings for: ", "");
        const goal = goals.find(g => g.name === goalName);
        if (goal) {
          goalsApi.addSavings(goal.id, -expense.amount).then(() => refreshGoals());
          pushNotification({ title: "Goal Progress Updated", message: `PKR ${expense.amount.toLocaleString()} deducted from "${goalName}" after record removal.`, type: "warning", icon: "🎯" });
        }
      }

      // Re-add: Mark subscription for manual payment
      if (expense?.description?.startsWith("Bill Paid: ")) {
        const subDesc = expense.description.replace("Bill Paid: ", "");
        const sub = recurring.find(r => (r.description || r.category) === subDesc);
        if (sub) {
          recurringApi.update(sub.id, { ...sub, lastPaidDate: null }).then(() => refreshRecurring());
          pushNotification({ title: "Bill Payment Reversed", message: `"${subDesc}" status reset to unpaid.`, type: "danger", icon: "🗓️" });
        }
      }

      pushToast({ type: "warning", message: "🗑️ Record removed and progress updated" });
    } catch (err) {
      pushToast({ type: "danger", message: "Failed to update record" });
    }
  }, [token, expenses, goals, recurring, refreshGoals, refreshRecurring, pushToast, pushNotification, refreshBudget]);

  // Bulk delete: clear expenses (can filter by type or month)
  const clearAllExpenses = useCallback(async (type = null, month = null) => {
    try {
      await expenseApi.clearAll(type, month);

      // Update local state: mark as hidden instead of removing
      setExpenses(prev => prev.map(e => {
        const matchesType = !type ||
          (type === 'regular' && !e.description?.startsWith("Savings for: ") && !e.description?.startsWith("Bill Paid: ")) ||
          (type === 'goal' && e.description?.startsWith("Savings for: ")) ||
          (type === 'subscription' && e.description?.startsWith("Bill Paid: "));
        const matchesMonth = !month || (e.date && e.date.startsWith(month));

        if (matchesType && matchesMonth) return { ...e, isHidden: true };
        return e;
      }));

      refreshBudget();
      pushToast({ type: "warning", message: `🗑️ History ${month ? 'for ' + month : ''} hidden` });
      pushNotification({ title: "History Updated", message: `Records have been hidden from your list, but your totals remain the same.`, type: "info", icon: "👁️‍🗨️" });
    } catch (err) {
      pushToast({ type: "danger", message: "Failed to update history" });
    }
  }, [token, pushToast, pushNotification, refreshBudget]);

  // Bulk delete: clear a specific month (wrapper for clearAllExpenses)
  const clearMonthExpenses = useCallback(async (monthKey) => {
    return clearAllExpenses(null, monthKey);
  }, [clearAllExpenses]);

  const editExpense = useCallback(async (id, updates) => {
    try {
      await expenseApi.update(id, updates);
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      refreshBudget();
      pushToast({ type: "success", message: "✅ Expense updated!" });
      pushNotification({ title: "Expense Updated", message: "Your expense was updated successfully.", type: "info", icon: "✏️" });
    } catch (err) {
      pushToast({ type: "danger", message: "Failed to update expense" });
    }
  }, [token, pushToast, pushNotification, refreshBudget]);

  // --- Budget Handler ---
  const setBudget = useCallback(async (val) => {
    const num = Number(val);
    if (!user) return;
    try {
      const data = await budgetApi.set(num);
      if (!data.success) {
        if (data.message === 'Invalid token' || data.message === 'No token provided') logout();
        throw new Error(data.message);
      }
      setBudgetState(num);
      await refreshBudgetHistory();
      await refreshBudget();
      pushToast({ type: "success", message: `✅ Budget updated to PKR ${num.toLocaleString()}` });
      pushNotification({ title: "Budget Updated", message: `Your monthly budget is now PKR ${num.toLocaleString()}.`, type: "success", icon: "💰" });
    } catch (err) {
      pushToast({ type: "danger", message: "Failed to update budget" });
    }
  }, [user, token, pushToast, pushNotification, refreshBudgetHistory, refreshBudget, logout]);

  // --- Profile Handler ---
  const updateProfile = useCallback(async (updates) => {
    if (!user) return;
    try {
      const data = await profileApi.update(updates);
      if (!data.success) {
        if (data.message === 'Invalid token' || data.message === 'No token provided') logout();
        throw new Error(data.message);
      }
      setUser(prev => ({
        ...prev,
        ...data.user,
        avatar: data.user.avatar !== undefined ? data.user.avatar : prev?.avatar,
        photo: data.user.photo !== undefined ? data.user.photo : prev?.photo,
      }));
      pushToast({ type: "success", message: "✅ Profile updated!" });
      pushNotification({ title: "Profile Updated", message: "Your profile changes were saved.", type: "info", icon: "👤" });
    } catch (err) {
      pushToast({ type: "danger", message: "Failed to update profile" });
    }
  }, [user, token, pushToast, pushNotification, logout]);

  const refreshCategories = useCallback(async () => {
    if (!user || !token) return;
    try {
      const data = await categoryApi.getAll();
      if (data.success) {
        setCategories(mergeCategories(data.categories || []));
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, [user, token]);

  // --- Category Handler ---
  const addCategory = useCallback(async (name, icon) => {
    if (!user) return;
    try {
      const data = await categoryApi.create(name, icon);
      if (data.success) {
        setCategories(prev => mergeCategories([...prev, data.category]));
        pushToast({ type: "success", message: "✅ Category created!" });
        pushNotification({ title: "Category Added", message: `${name} category was added successfully.`, type: "success", icon: "🗂️" });
        return data;
      }
      throw new Error(data.message || "Failed to create category");
    } catch (err) {
      pushToast({ type: "danger", message: err.message || "Failed to create category" });
      throw err;
    }
  }, [user, pushToast, pushNotification]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
    if (token) {
      notificationApi.markRead().catch(console.error);
    }
  }, [token]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (token) {
      notificationApi.clear().catch(console.error);
    }
  }, [token]);

  const deleteNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (token) {
      notificationApi.delete(id).catch(console.error);
    }
  }, [token]);

  // Badge unlock checking and celebration
  const checkBadgeUnlocks = useCallback(() => {
    if (!user) return;

    const BADGES = [
      { id: "first", icon: "🌟", title: "First Step", desc: "Added your first expense", unlocked: e => e.length >= 1 },
      { id: "five", icon: "📊", title: "Data Tracker", desc: "Tracked 5+ expenses", unlocked: e => e.length >= 5 },
      { id: "ten", icon: "🔥", title: "On Fire!", desc: "Tracked 10+ expenses", unlocked: e => e.length >= 10 },
      { id: "twenty", icon: "💪", title: "Dedicated", desc: "Tracked 20+ expenses", unlocked: e => e.length >= 20 },
      { id: "saver", icon: "💰", title: "Smart Saver", desc: "Stayed under 60% of budget", unlocked: (e, b) => b > 0 && e.reduce((s, x) => s + x.amount, 0) / b < 0.6 },
      { id: "variety", icon: "🎨", title: "Well Rounded", desc: "Used 4+ spending categories", unlocked: e => new Set(e.map(x => x.category)).size >= 4 },
      { id: "scanner", icon: "📸", title: "Tech Savvy", desc: "Scanned a bill receipt", unlocked: e => e.some(x => x.source === "scanner") },
      { id: "voice", icon: "🎙️", title: "Hands-Free", desc: "Used voice to add expense", unlocked: e => e.some(x => x.source === "voice") },
      { id: "books", icon: "📚", title: "Scholar", desc: "Tracked a book/stationery expense", unlocked: e => e.some(x => x.category?.toLowerCase().includes("book") || x.category?.toLowerCase().includes("edu") || x.category?.toLowerCase().includes("stat")) },
      { id: "health", icon: "💊", title: "Health Aware", desc: "Tracked a health expense", unlocked: e => e.some(x => x.category?.toLowerCase().includes("health") || x.category?.toLowerCase().includes("med") || x.category?.toLowerCase().includes("fit")) },
    ];

    const newly = BADGES.filter(b => b.unlocked(expenses, budget) && !unlockedBadges.includes(b.id));

    if (newly.length > 0) {
      const badge = newly[0];
      setCelebrationReward(badge);
      setUnlockedBadges(prev => {
        const updated = [...prev, badge.id];
        localStorage.setItem("sset_unlocked_badges", JSON.stringify(updated));
        return updated;
      });
      pushNotification({
        title: `🎉 Badge Unlocked!`,
        message: `${badge.icon} ${badge.title} - ${badge.desc}`,
        type: "success",
        icon: badge.icon
      });

      playJingle();

      // Auto-close celebration after 4 seconds
      setTimeout(() => setCelebrationReward(null), 4000);
    }
  }, [user, expenses, budget, unlockedBadges, pushNotification, playJingle]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !(n.isRead === true || n.read === true)).length,
    [notifications]
  );

  const [currentMonthKey, setCurrentMonthKey] = useState(() => getLocalMonthKey());
  const [currentDateKey, setCurrentDateKey] = useState(() => getLocalDateKey());

  useEffect(() => {
    const interval = setInterval(() => {
      const key = getLocalMonthKey();
      const dateKey = getLocalDateKey();
      setCurrentMonthKey(prev => (prev !== key ? key : prev));
      setCurrentDateKey(prev => (prev !== dateKey ? dateKey : prev));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const today = currentDateKey;
    const dueCount = recurring.filter(item => {
      if (!item.isActive || !item.nextDueDate || item.nextDueDate > today) return false;
      return !(item.lastPaidDate && item.lastPaidDate >= item.nextDueDate);
    }).length;
    setDueSubscriptions(dueCount);
  }, [recurring, currentDateKey]);

  const monthlyExpenses = useMemo(() =>
    expenses.filter(e => e.date && e.date.startsWith(currentMonthKey) && (e.isHidden === 0 || e.isHidden === false || !e.isHidden)),
    [expenses, currentMonthKey]
  );

  const monthlySpent = useMemo(() =>
    expenses.filter(e => e.date && e.date.startsWith(currentMonthKey)).reduce((sum, exp) => sum + exp.amount, 0),
    [expenses, currentMonthKey]
  );

  const allTimeTotal = useMemo(() =>
    expenses.reduce((sum, exp) => sum + exp.amount, 0),
    [expenses]
  );

  const daysSinceFirstExpense = useMemo(() => {
    if (expenses.length === 0) return 0;
    const oldest = new Date(Math.min(...expenses.map(e => new Date(e.date))));
    return Math.max(1, Math.ceil((Date.now() - oldest) / (1000 * 60 * 60 * 24)));
  }, [expenses]);

  const totalTrackingDays = daysSinceFirstExpense;

  const budgetHistoryMap = useMemo(() => {
    return budgetHistory.reduce((map, item) => {
      const key = `${item.year}-${String(item.month).padStart(2, "0")}`;
      map[key] = item.amount;
      return map;
    }, {});
  }, [budgetHistory]);

  const currentMonthBudget = budgetHistoryMap[currentMonthKey] ?? budget;

  const previousMonthCarryOver = useMemo(() => {
    if (currentMonthBudget <= 0) return 0;
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
    const lastMonthExpenses = expenses.filter(e => e.date && e.date.startsWith(lastMonthKey));
    if (lastMonthExpenses.length === 0) return 0;
    const lastMonthSpent = lastMonthExpenses.reduce((s, e) => s + e.amount, 0);
    const lastMonthBudget = budgetHistoryMap[lastMonthKey] ?? 0;
    return Math.max(0, lastMonthBudget - lastMonthSpent);
  }, [expenses, currentMonthBudget, budgetHistoryMap]);

  const effectiveMonthlyBudget = currentMonthBudget + previousMonthCarryOver;
  const monthlyRemaining = effectiveMonthlyBudget - monthlySpent;

  const monthlyBreakdown = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      if (!e.date) return;
      const mo = e.date.slice(0, 7);
      map[mo] = (map[mo] || 0) + e.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, spent]) => {
        const dateObj = new Date(month + "-01");
        const label = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const isCurrent = month === currentMonthKey;
        const monthBudget = budgetHistoryMap[month] ?? 0;
        const effectiveBudget = monthBudget + (isCurrent ? previousMonthCarryOver : 0);
        const remaining = effectiveBudget - spent;
        return { month, spent, budget: monthBudget, effectiveBudget, remaining, label, isCurrent };
      });
  }, [expenses, budget, previousMonthCarryOver, currentMonthKey, budgetHistoryMap]);

  const allTimeBudgetVal = useMemo(() =>
    monthlyBreakdown.reduce((sum, mo) => sum + mo.budget, 0),
    [monthlyBreakdown]
  );

  const loadUserData = useCallback(async ({ isCurrent = () => true } = {}) => {
    setIsLoading(true);

    try {
      const [
        expData,
        catData,
        budData,
        histData,
        notifData,
        profData,
        recurData,
        goalData,
      ] = await Promise.all([
        expenseApi.getAll(),
        categoryApi.getAll(),
        budgetApi.get(),
        budgetApi.getHistory(),
        notificationApi.getAll(),
        profileApi.get(),
        recurringApi.getAll(),
        goalsApi.getAll(),
      ]);

      if (!isCurrent()) return;

      if (expData.success) {
        setExpenses((expData.expenses || []).map(e => ({
          ...e,
          amount: Number(e.amount),
          date: e.date ? String(e.date).slice(0, 10) : e.date,
          isHidden: e.isHidden === true
        })));
      } else if (expData.message === "Invalid token") {
        logout();
        return;
      }

      setCategories(catData.success ? mergeCategories(catData.categories || []) : mergeCategories([]));

      if (budData.success) {
        setBudgetState(budData.budget || 0);
        setDefaultBudget(budData.defaultBudget || 0);
      }

      if (histData.success) setBudgetHistory(histData.history || []);

      if (notifData.success) {
        setNotifications((notifData.notifications || []).map(n => ({
          ...n,
          isRead: n.isRead === true || n.read === true,
          read: n.isRead === true || n.read === true,
        })));
      }

      if (profData.success && profData.user) {
        setUser(prev => ({ ...(prev || {}), ...profData.user }));
      }

      if (recurData.success) {
        setRecurring((recurData.recurring || []).map(r => ({
          ...r,
          amount: Number(r.amount),
          isActive: r.isActive === true || r.isActive === 1
        })));
      } else if (recurData.message === "Invalid token") {
        logout();
        return;
      }

      if (goalData.success) {
        setGoals((goalData.goals || []).map(g => ({
          ...g,
          targetAmount: Number(g.targetAmount),
          savedAmount: Number(g.savedAmount),
          isCompleted: g.isCompleted === true || g.isCompleted === 1
        })));
      } else if (goalData.message === "Invalid token") {
        logout();
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      if ((err?.message || "").toLowerCase().includes("not authenticated")) {
        logout();
      }
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, [logout]);

  // Restore Supabase session on load
  useEffect(() => {
    authApi.getSession().then((data) => {
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setToken(session.access_token);
        authApi.me().then((d) => { if (d.success) setUser(d.user); });
      } else {
        setToken(null);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Side Effects (Fetching data)
  useEffect(() => {
    if (!user || !token) {
      setIsLoading(false);
      badgeBaselineReadyRef.current = false;
      return;
    }

    let isMounted = true;
    loadUserData({ isCurrent: () => isMounted });
    return () => { isMounted = false; };
  }, [loadUserData, token, user?.id]);

  // Auto-process subscriptions
  useEffect(() => {
    if (isLoading || !recurring.length || !token || effectiveMonthlyBudget <= 0) return;
    const today = currentDateKey;

    recurring.forEach(item => {
      if (!item.isActive || !item.nextDueDate || item.nextDueDate > today) return;
      if (processingSubsRef.current.has(item.id)) return;

      const paymentDescription = `Bill Paid: ${item.description || item.category}`;
      const isPaid = item.lastPaidDate && item.lastPaidDate >= item.nextDueDate;
      const alreadyRecorded = expenses.some(e =>
        e.description === paymentDescription &&
        e.date >= item.nextDueDate &&
        e.date <= today
      );

      const processSubscription = async () => {
        processingSubsRef.current.add(item.id);
        const nextDue = calculateNextDate(item.nextDueDate, item.frequency);

        try {
          if (isPaid || alreadyRecorded) {
            await recurringApi.update(item.id, { ...item, nextDueDate: nextDue, lastPaidDate: item.lastPaidDate || today });
            await refreshRecurring();
            return;
          }

          const totalSpentForMonth = expenses
            .filter(e => e.date && e.date.startsWith(today.slice(0, 7)))
            .reduce((s, e) => s + Number(e.amount), 0);

          if (totalSpentForMonth + Number(item.amount) > effectiveMonthlyBudget) {
            const lastAlert = localStorage.getItem(`budget_alert_${item.id}`);
            if (lastAlert !== today) {
              localStorage.setItem(`budget_alert_${item.id}`, today);
              pushNotification({
                title: "Low Budget: Payment Paused",
                message: `Subscription for ${item.description || item.category} is pending.`,
                type: "danger", icon: "⚠️"
              }, { dedupeKey: `subscription-budget-${item.id}-${today}`, dedupeMs: 86_400_000 });
            }
            return;
          }

          const result = await addExpense({
            amount: Number(item.amount),
            category: item.category,
            description: paymentDescription,
            date: today
          }, {
            title: "Auto-Payment Done",
            message: `Paid PKR ${Number(item.amount).toLocaleString()} for ${item.description || item.category}.`,
            type: "success", icon: "✅"
          });

          if (result?.success) {
            await recurringApi.update(item.id, { ...item, nextDueDate: nextDue, lastPaidDate: today });
            await refreshRecurring();
          }
        } catch (err) {
          console.error("Auto-payment failed:", err);
        } finally {
          processingSubsRef.current.delete(item.id);
        }
      };

      processSubscription();
    });
  }, [isLoading, recurring, expenses, token, addExpense, pushNotification, effectiveMonthlyBudget, currentDateKey, refreshRecurring]);

  // Check for badge unlocks whenever expenses or budget changes
  useEffect(() => {
    if (!user || isLoading) return;
    if (!badgeBaselineReadyRef.current) {
      badgeBaselineReadyRef.current = true;
      return;
    }
    checkBadgeUnlocks();
  }, [user, isLoading, expenses, budget, checkBadgeUnlocks]);

  return (
    <AppContext.Provider value={{
      theme, toggleTheme, accent, setAccent, lang, setLang,
      user, setUser, logout, updateProfile, login, register, token,
      expenses, refreshExpenses, addExpense, deleteExpense, editExpense, clearAllExpenses, clearMonthExpenses,
      monthlyExpenses, monthlySpent, allTimeTotal, daysSinceFirstExpense, totalTrackingDays,
      previousMonthCarryOver, effectiveMonthlyBudget, monthlyRemaining, monthlyBreakdown, allTimeBudget: allTimeBudgetVal, budgetHistory,
      budget, setBudget, defaultBudget, setDefaultBudget,
      categories, addCategory, refreshCategories,
      notifications, unreadCount, markAllRead, clearNotifications, deleteNotification, pushNotification, requestNotificationPermission,
      toasts, pushToast, showOnboarding, setShowOnboarding,
      sendOTP, verifyOTP, forgotPassword, resetPassword, changePassword,
      playTone, playSequence, triggerHaptic, playJingle, isLoading, dueSubscriptions, goals, setGoals, refreshGoals, recurring, setRecurring, refreshRecurring,
      celebrationReward, setCelebrationReward, checkBadgeUnlocks
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};
