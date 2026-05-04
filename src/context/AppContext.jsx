import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";

const AppContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4444/api";

// Helper: get auth headers
const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

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

// Helper: Fetch with retry logic for rate limiting (429) errors
const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
  let lastError;
  const signal = options.signal; // Preserve the signal
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      // If not rate limited, return the response
      if (res.status !== 429) return res;
      // If rate limited and not aborted, wait and retry
      if (!signal?.aborted) {
        lastError = res;
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (err) {
      // If aborted, re-throw immediately
      if (err.name === 'AbortError') throw err;
      lastError = err;
      if (!signal?.aborted) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  // After all retries, return last response or throw error
  if (lastError instanceof Response) return lastError;
  throw lastError;
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
  const hasNotifiedSubs = useRef(false);
  const hasNotifiedGoals = useRef(false);
  const processingSubsRef = useRef(new Set());
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
      const res = await fetchWithRetry(`${API_URL}/budget`, { headers: authHeaders(token) });
      const data = await res.json();
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
      const res = await fetchWithRetry(`${API_URL}/budget/history`, { headers: authHeaders(token) });
      const data = await res.json();
      if (data.success) {
        setBudgetHistory(data.history || []);
      }
    } catch (err) {
      console.error("Error fetching budget history:", err);
    }
  }, [user, token]);

  // Toasts - must be before logout, refreshRecurring, refreshGoals
  const pushToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...toast, id }]);

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

  const pushNotification = useCallback((notif) => {
    const now = new Date().toISOString();
    const n = { ...notif, id: Date.now(), createdAt: now, time: now, read: false, isRead: false };

    setNotifications(prev => [n, ...prev].slice(0, 60));
    playNotificationSound();
    triggerHaptic(notif.type || "success");

    if (token) {
      fetch(`${API_URL}/notifications`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(notif)
      })
        .then(res => res.json())
        .then(data => {
          if (!data.success) console.warn("Notification sync failed:", data.message);
        })
        .catch(err => console.error("Network error during notification sync:", err));
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(n.title || "SpendSmart", {
          body: n.message,
          icon: "/logo.png"
        });
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification(n.title || "SpendSmart", {
              body: n.message,
              icon: "/logo.png"
            });
          }
        });
      }
    }
  }, [playNotificationSound, token, triggerHaptic]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setExpenses([]);
    setBudgetState(0);
    setNotifications([]);
    setCategories([]);
    pushToast({ type: "info", message: "Logged out successfully." });
  }, [pushToast]);

  const refreshRecurring = useCallback(async () => {
    if (!user || !token) return;
    try {
      const res = await fetchWithRetry(`${API_URL}/recurring`, { headers: authHeaders(token) });
      const data = await res.json();
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
      const res = await fetchWithRetry(`${API_URL}/goals`, { headers: authHeaders(token) });
      const data = await res.json();
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
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    setToken(data.token);
    setUser(data.user);
    pushNotification({ title: "Welcome back!", message: `Hi ${data.user.name}, you are successfully logged in.`, type: "success", icon: "👋" });
    pushToast({ type: "success", message: `Welcome back, ${data.user.name}!` });
    return data;
  }, [pushToast, pushNotification]);

  const register = useCallback(async (name, email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Registration failed");
    setToken(data.token);
    setUser(data.user);
    setShowOnboarding(true);
    pushNotification({ 
      title: "Welcome to SpendSmart! 🚀", 
      message: `Hi ${data.user.name}, we're excited to help you save more. Start by setting your monthly budget in Profile!`, 
      type: "success", 
      icon: "👋" 
    });
    pushToast({ type: "success", message: `Welcome, ${data.user.name}!` });
    return data;
  }, [pushToast, pushNotification]);



  // --- SECURITY & VERIFICATION ---
  const sendOTP = useCallback(async (type, value) => {
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ type, value })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      pushNotification({ title: "OTP Sent", message: data.message, type: "info", icon: "📧" });
      pushToast({ type: "info", message: data.message });
      return data;
    } catch (err) {
      pushToast({ type: "danger", message: err.message || "Failed to send OTP" });
      throw err;
    }
  }, [token, pushToast, pushNotification]);

  const verifyOTP = useCallback(async (type, otp) => {
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ type, otp })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      pushNotification({ title: "Verification Successful", message: data.message, type: "success", icon: "✅" });
      pushToast({ type: "success", message: data.message });
      // Refresh user data to get updated verification status
      const meRes = await fetch(`${API_URL}/auth/me`, { headers: authHeaders(token) });
      const meData = await meRes.json();
      if (meData.success) setUser(meData.user);
      return data;
    } catch (err) {
      pushToast({ type: "danger", message: err.message || "Verification failed" });
      throw err;
    }
  }, [token, pushToast, pushNotification]);

  const forgotPassword = useCallback(async (identity) => {
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity })
      });
      const data = await res.json();
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
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity, otp, newPassword })
      });
      const data = await res.json();
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
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      pushNotification({ title: "Security Update", message: data.message, type: "success", icon: "🛡️" });
      pushToast({ type: "success", message: data.message });
      return data;
    } catch (err) {
      pushToast({ type: "danger", message: err.message || "Update failed" });
      throw err;
    }
  }, [token, pushToast, pushNotification]);

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
      const res = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ ...exp, userId: user.id })
      });
      const data = await res.json();
      if (!data.success) {
        if (data.message === 'Invalid token' || data.message === 'No token provided') logout();
        return { success: false, message: data.message || "Failed to save expense" };
      }

      // Expense saved successfully - update local state immediately
      setExpenses(prev => [{ ...exp, id: data.expense?.id || Date.now(), amount: Number(exp.amount) }, ...prev]);
      pushToast({ type: "success", message: `✅ PKR ${Number(exp.amount).toLocaleString()} added!` });
      playNotificationSound();
      triggerHaptic("success");

      // Push a permanent notification for the activity history
      pushNotification({
        title: "Expense Added",
        message: `${exp.category}: PKR ${Number(exp.amount).toLocaleString()} - ${exp.description || 'No description'}`,
        type: "success",
        icon: "💸"
      });

      // Secondary calls (won't block or cause error on the main flow)
      try { refreshBudget(); } catch (e) { console.warn("Budget refresh failed:", e); }

      try {
        if (Number(exp.amount) >= 5000) {
          pushNotification({
            title: "Large Spending Alert",
            message: `A large transaction of PKR ${Number(exp.amount).toLocaleString()} was recorded.`,
            type: "warning",
            icon: "⚠️"
          });
        }

        if (customNotification) {
          pushNotification(customNotification);
        } else {
          pushNotification({ title: "Expense Added", message: `PKR ${Number(exp.amount).toLocaleString()} saved successfully.`, type: "success", icon: "💸" });
        }
      } catch (e) { console.warn("Notification push failed:", e); }

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
      await fetch(`${API_URL}/expenses/${id}`, {
        method: "DELETE",
        headers: authHeaders(token)
      });
      setExpenses(prev => prev.filter(e => e.id !== id));
      refreshBudget();

      // Re-add: Auto-reverse goal savings
      if (expense?.description?.startsWith("Savings for: ")) {
        const goalName = expense.description.replace("Savings for: ", "");
        const goal = goals.find(g => g.name === goalName);
        if (goal) {
          fetch(`${API_URL}/goals/${goal.id}/savings`, {
            method: "PUT", headers: authHeaders(token),
            body: JSON.stringify({ amount: -expense.amount })
          }).then(() => refreshGoals());
          pushNotification({ title: "Goal Progress Updated", message: `PKR ${expense.amount.toLocaleString()} deducted from "${goalName}" after record removal.`, type: "warning", icon: "🎯" });
        }
      }

      // Re-add: Mark subscription for manual payment
      if (expense?.description?.startsWith("Bill Paid: ")) {
        const subDesc = expense.description.replace("Bill Paid: ", "");
        const sub = recurring.find(r => (r.description || r.category) === subDesc);
        if (sub) {
          fetch(`${API_URL}/recurring/${sub.id}`, {
            method: "PUT", headers: authHeaders(token),
            body: JSON.stringify({ ...sub, lastPaidDate: null })
          }).then(() => refreshRecurring());
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
      let url = `${API_URL}/expenses?1=1`;
      if (type) url += `&type=${type}`;
      if (month) url += `&month=${month}`;

      await fetch(url, { method: "DELETE", headers: authHeaders(token) });
      
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
      await fetch(`${API_URL}/expenses/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(updates)
      });
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
      const res = await fetch(`${API_URL}/budget`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ amount: num })
      });
      const data = await res.json();
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
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(updates)
      });
      const data = await res.json();
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

  // --- Category Handler ---
  const addCategory = useCallback(async (name, icon) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ name, icon })
      });
      const data = await res.json();
      if (data.success) {
        setCategories(prev => [...prev, data.category]);
        pushToast({ type: "success", message: "✅ Category created!" });
        pushNotification({ title: "Category Added", message: `${name} category was added successfully.`, type: "success", icon: "🗂️" });
      }
    } catch (err) {
      pushToast({ type: "danger", message: "Failed to create category" });
    }
  }, [user, token, pushToast, pushNotification]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    if (token) {
      fetch(`${API_URL}/notifications/mark-read`, { method: "PUT", headers: authHeaders(token) }).catch(console.error);
    }
  }, [token]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (token) {
      fetch(`${API_URL}/notifications`, { method: "DELETE", headers: authHeaders(token) }).catch(console.error);
    }
  }, [token]);

  const deleteNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (token) {
      fetch(`${API_URL}/notifications/${id}`, { method: "DELETE", headers: authHeaders(token) }).catch(console.error);
    }
  }, [token]);

  // Badge unlock checking and celebration
  const checkBadgeUnlocks = useCallback(() => {
    if (!user) return;

    const BADGES = [
      { id:"first",    icon:"🌟", title:"First Step",      desc:"Added your first expense",              unlocked:e=>e.length>=1 },
      { id:"five",     icon:"📊", title:"Data Tracker",    desc:"Tracked 5+ expenses",                   unlocked:e=>e.length>=5 },
      { id:"ten",      icon:"🔥", title:"On Fire!",         desc:"Tracked 10+ expenses",                  unlocked:e=>e.length>=10 },
      { id:"twenty",   icon:"💪", title:"Dedicated",       desc:"Tracked 20+ expenses",                  unlocked:e=>e.length>=20 },
      { id:"saver",    icon:"💰", title:"Smart Saver",     desc:"Stayed under 60% of budget",            unlocked:(e,b)=>b>0&&e.reduce((s,x)=>s+x.amount,0)/b<0.6 },
      { id:"variety",  icon:"🎨", title:"Well Rounded",    desc:"Used 4+ spending categories",           unlocked:e=>new Set(e.map(x=>x.category)).size>=4 },
      { id:"scanner",  icon:"📸", title:"Tech Savvy",      desc:"Scanned a bill receipt",                unlocked:e=>e.some(x=>x.source==="scanner") },
      { id:"voice",    icon:"🎙️", title:"Hands-Free",      desc:"Used voice to add expense",             unlocked:e=>e.some(x=>x.source==="voice") },
      { id:"books",    icon:"📚", title:"Scholar",         desc:"Tracked a book/stationery expense",     unlocked:e=>e.some(x=>x.category?.toLowerCase().includes("book") || x.category?.toLowerCase().includes("edu") || x.category?.toLowerCase().includes("stat")) },
      { id:"health",   icon:"💊", title:"Health Aware",    desc:"Tracked a health expense",              unlocked:e=>e.some(x=>x.category?.toLowerCase().includes("health") || x.category?.toLowerCase().includes("med") || x.category?.toLowerCase().includes("fit")) },
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
  }, [expenses, budget, unlockedBadges, pushNotification, playJingle]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const [currentMonthKey, setCurrentMonthKey] = useState(() => getLocalMonthKey());

  useEffect(() => {
    const interval = setInterval(() => {
      const key = getLocalMonthKey();
      setCurrentMonthKey(prev => (prev !== key ? key : prev));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

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

  // Side Effects (Fetching data) - with AbortController to prevent overlapping requests
  useEffect(() => {
    console.log("FETCH EFFECT TRIGGERED", { hasUser: !!user, hasToken: !!token });
    if (!user || !token) {
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();
    const headers = authHeaders(token);
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        // Expenses
        const expRes = await fetchWithRetry(`${API_URL}/expenses`, { headers, signal: abortController.signal });
        const expData = await expRes.json();
        if (isMounted && expData.success) {
          const mappedExpenses = (expData.expenses || []).map(e => ({
            ...e, 
            amount: Number(e.amount), 
            date: e.date ? e.date.slice(0, 10) : e.date,
            isHidden: e.isHidden === 1 || e.isHidden === true
          }));
          setExpenses(mappedExpenses);
          
          // Daily tracking reminder (alerts after 6 PM if no expenses today)
          const today = getLocalDateKey();
          const lastExpenseAlert = localStorage.getItem("last_expense_alert");
          if (mappedExpenses.length > 0 && lastExpenseAlert !== today) {
            const hasExpenseToday = mappedExpenses.some(e => e.date && e.date.startsWith(today.slice(0, 10)));
            if (!hasExpenseToday && new Date().getHours() >= 18) {
              localStorage.setItem("last_expense_alert", today);
              pushNotification({ title: "Track Your Spending 💸", message: "You haven't recorded any expenses today. Keep your budget up to date!", type: "warning", icon: "📝" });
            }
          }
        } else if (expData.message === 'Invalid token') logout();

        // Categories
        const catRes = await fetchWithRetry(`${API_URL}/categories`, { headers, signal: abortController.signal });
        const catData = await catRes.json();
        if (isMounted && catData.success) {
          // Filter out duplicates by name (case-insensitive) and consolidate
          const uniqueCats = [];
          const seen = new Set();
          (catData.categories || []).forEach(c => {
            if (!c || typeof c !== 'object') return;
            let name = (c.name || '').trim();
            const nameLower = name.toLowerCase();
            
            // Consolidate similar categories
            if (nameLower === "food" || nameLower === "dining") name = "Food & Dining";
            if (nameLower === "transport" || nameLower === "taxi" || nameLower === "car") name = "Transportation";
            if (nameLower === "bills" || nameLower === "utilities") name = "Bills & Utilities";
            if (nameLower === "health" || nameLower === "medical") name = "Health & Fitness";
            if (nameLower === "ent") name = "Entertainment";
            
            const normalized = name.toLowerCase();
            if (!seen.has(normalized)) {
              seen.add(normalized);
              uniqueCats.push({ ...c, name });
            }
          });
          setCategories(uniqueCats);
        }

        // Budget
        const budRes = await fetchWithRetry(`${API_URL}/budget`, { headers, signal: abortController.signal });
        const budData = await budRes.json();
        if (isMounted && budData.success) {
          setBudgetState(budData.budget || 0);
          setDefaultBudget(budData.defaultBudget || 0);
        }

        // Budget History
        const histRes = await fetchWithRetry(`${API_URL}/budget/history`, { headers, signal: abortController.signal });
        const histData = await histRes.json();
        if (isMounted && histData.success) setBudgetHistory(histData.history || []);

        // Notifications
        const notifRes = await fetchWithRetry(`${API_URL}/notifications`, { headers, signal: abortController.signal });
        const notifData = await notifRes.json();
        if (isMounted && notifData.success) setNotifications(notifData.notifications || []);

        // Profile
        const profRes = await fetchWithRetry(`${API_URL}/profile`, { headers, signal: abortController.signal });
        const profData = await profRes.json();
        if (isMounted && profData.success && profData.user) {
          setUser(prev => ({ ...prev, ...profData.user }));
        }

        // Recurring
        const recurRes = await fetchWithRetry(`${API_URL}/recurring`, { headers, signal: abortController.signal });
        const recurData = await recurRes.json();
        if (isMounted && recurData.success) {
          setRecurring((recurData.recurring || []).map(r => ({
            ...r,
            amount: Number(r.amount),
            isActive: r.isActive === true || r.isActive === 1
          })));
        } else if (recurData.message === 'Invalid token') logout();

        // Goals
        const goalRes = await fetchWithRetry(`${API_URL}/goals`, { headers, signal: abortController.signal });
        const goalData = await goalRes.json();
        if (isMounted && goalData.success) {
          const mappedGoals = (goalData.goals || []).map(g => ({
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
        } else if (goalData.message === 'Invalid token') logout();
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Error fetching data:", err);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [token]);

  // Auto-process subscriptions
  useEffect(() => {
    if (!recurring.length || !expenses.length || !token || !budget) return;
    const today = getLocalDateKey();

    recurring.forEach(item => {
      if (item.isActive && item.nextDueDate <= today && !processingSubsRef.current.has(item.id)) {
        const isPaid = item.lastPaidDate && item.lastPaidDate >= item.nextDueDate;
        if (!isPaid) {
          const totalSpentForMonth = expenses
            .filter(e => e.date && e.date.startsWith(today.slice(0, 7)))
            .reduce((s, e) => s + e.amount, 0);

          if (totalSpentForMonth + Number(item.amount) <= effectiveMonthlyBudget) {
            processingSubsRef.current.add(item.id);
            const nextDue = calculateNextDate(item.nextDueDate, item.frequency);

            addExpense({
              amount: Number(item.amount),
              category: item.category,
              description: `Bill Paid: ${item.description || item.category}`,
              date: today
            }, {
              title: "Auto-Payment Done",
              message: `Paid PKR ${item.amount} for ${item.description || item.category}.`,
              type: "success", icon: "✅"
            });

            fetch(`${API_URL}/recurring/${item.id}`, {
              method: "PUT", headers: authHeaders(token),
              body: JSON.stringify({ ...item, nextDueDate: nextDue, lastPaidDate: today })
            }).then(() => {
              fetch(`${API_URL}/recurring`, { headers: authHeaders(token) })
                .then(res => res.json())
                .then(d => { if (d.success) setRecurring(d.recurring); });
            });
          } else {
            const lastAlert = localStorage.getItem(`budget_alert_${item.id}`);
            if (lastAlert !== today) {
              localStorage.setItem(`budget_alert_${item.id}`, today);
              pushNotification({
                title: "Low Budget: Payment Paused",
                message: `Subscription for ${item.description || item.category} is pending.`,
                type: "danger", icon: "⚠️"
              });
            }
          }
        }
      }
    });
  }, [recurring, expenses, budget, token, addExpense, pushNotification, effectiveMonthlyBudget]);

  // Check for badge unlocks whenever expenses or budget changes
  useEffect(() => {
    checkBadgeUnlocks();
  }, [expenses, budget, checkBadgeUnlocks]);

  // Auto-request notification permissions after a brief delay if not already requested
  useEffect(() => {
    if (user && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        const timer = setTimeout(() => {
          requestNotificationPermission();
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, requestNotificationPermission]);

  return (
    <AppContext.Provider value={{
      theme, toggleTheme, accent, setAccent, lang, setLang,
      user, setUser, logout, updateProfile, login, register, token,
      expenses, addExpense, deleteExpense, editExpense, clearAllExpenses, clearMonthExpenses,
      monthlyExpenses, monthlySpent, allTimeTotal, daysSinceFirstExpense, totalTrackingDays,
      previousMonthCarryOver, effectiveMonthlyBudget, monthlyRemaining, monthlyBreakdown, allTimeBudget: allTimeBudgetVal, budgetHistory,
      budget, setBudget, defaultBudget, setDefaultBudget,
      categories, addCategory,
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
