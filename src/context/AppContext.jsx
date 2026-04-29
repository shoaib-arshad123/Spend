import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AppContext = createContext(null);
const API_URL = "http://localhost:4444/api";

// Helper: get auth headers
const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

export function AppProvider({ children }) {
  // Theme & Lang (Keep in LocalStorage for instant load)
  const [theme, setThemeState] = useState(() => localStorage.getItem("sset_theme") || "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sset_theme", theme);
  }, [theme]);
  const toggleTheme = useCallback(() => setThemeState(t => t === "dark" ? "light" : "dark"), []);
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
  const [notifications, setNotifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [toasts, setToasts] = useState([]);

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

  // Fetch data from backend when user is logged in
  useEffect(() => {
    if (!user || !token) return;

    const headers = authHeaders(token);

    // Fetch expenses
    fetch(`${API_URL}/expenses`, { headers })
      .then(res => res.json())
      .then(data => { 
        if (data.success) setExpenses(data.expenses || []); 
        else if (data.message === 'Invalid token' || data.message === 'No token provided') logout();
      })
      .catch(err => console.error("Error fetching expenses:", err));

    // Fetch categories
    fetch(`${API_URL}/categories`, { headers })
      .then(res => res.json())
      .then(data => { if (data.success) setCategories(data.categories || []); })
      .catch(err => console.error("Error fetching categories:", err));

    // Fetch budget
    fetch(`${API_URL}/budget`, { headers })
      .then(res => res.json())
      .then(data => { if (data.success) setBudgetState(data.budget || 0); })
      .catch(err => console.error("Error fetching budget:", err));

    // Fetch notifications
    fetch(`${API_URL}/notifications`, { headers })
      .then(res => res.json())
      .then(data => { if (data.success) setNotifications(data.notifications || []); })
      .catch(err => console.error("Error fetching notifications:", err));

  }, [user, token]);

  // Toasts
  const pushToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 3800);
  }, []);

  const pushNotification = useCallback((notif) => {
    const n = { ...notif, id: Date.now(), createdAt: new Date().toISOString(), isRead: false };
    setNotifications(prev => [n, ...prev].slice(0, 60));
  }, []);

  // --- Auth Handlers ---

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Login failed");
    setToken(data.token);
    setUser(data.user);
    pushToast({ type: "success", message: `Welcome back, ${data.user.name}!` });
    return data;
  }, [pushToast]);

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
    pushToast({ type: "success", message: `Welcome, ${data.user.name}!` });
    return data;
  }, [pushToast]);

  // Legacy local sign-in (for development/demo mode without backend)
  const localSignIn = useCallback((email, password, name = null) => {
    setUser({
      id: 1,
      email,
      name: name || email.split("@")[0],
      avatar: "🧑‍💻",
      onboarded: true
    });
    setToken("demo-token");
    pushToast({ type: "success", message: "Welcome back!" });
  }, [pushToast]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setExpenses([]);
    setBudgetState(0);
    setNotifications([]);
    setCategories([]);
    pushToast({ type: "info", message: "Logged out successfully." });
  }, [pushToast]);

  // --- Expense Handlers ---

  const addExpense = useCallback(async (exp) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(exp)
      });
      const data = await res.json();
      if (!data.success) {
        if (data.message === 'Invalid token' || data.message === 'No token provided') logout();
        throw new Error(data.message);
      }
      setExpenses(prev => [{ ...exp, id: data.expense?.id || Date.now() }, ...prev]);
      pushToast({ type: "success", message: `✅ PKR ${Number(exp.amount).toLocaleString()} added!` });
    } catch (err) {
      pushToast({ type: "danger", message: "Failed to save expense" });
    }
  }, [user, token, pushToast]);

  const deleteExpense = useCallback(async (id) => {
    try {
      await fetch(`${API_URL}/expenses/${id}`, {
        method: "DELETE",
        headers: authHeaders(token)
      });
      setExpenses(prev => prev.filter(e => e.id !== id));
      pushToast({ type: "warning", message: "🗑️ Expense deleted" });
    } catch (err) {
      pushToast({ type: "danger", message: "Failed to delete expense" });
    }
  }, [token, pushToast]);

  const editExpense = useCallback(async (id, updates) => {
    try {
      await fetch(`${API_URL}/expenses/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(updates)
      });
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
      pushToast({ type: "success", message: "✅ Expense updated!" });
    } catch (err) {
      pushToast({ type: "danger", message: "Failed to update expense" });
    }
  }, [token, pushToast]);

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
      pushToast({ type: "success", message: `✅ Budget updated to PKR ${num.toLocaleString()}` });
    } catch (err) {
      pushToast({ type: "danger", message: "Failed to update budget" });
    }
  }, [user, token, pushToast]);

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
      setUser(prev => ({ ...prev, ...data.user }));
      pushToast({ type: "success", message: "✅ Profile updated!" });
    } catch (err) {
      pushToast({ type: "danger", message: "Failed to update profile" });
    }
  }, [user, token, pushToast]);

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
      if (data.success) setCategories(prev => [...prev, data.category]);
      pushToast({ type: "success", message: "✅ Category created!" });
    } catch (err) {
      pushToast({ type: "danger", message: "Failed to create category" });
    }
  }, [user, token, pushToast]);

  // --- Notification Handlers ---

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      user, setUser, logout, updateProfile, localSignIn, login, register,
      token,
      expenses, addExpense, deleteExpense, editExpense,
      budget, setBudget,
      lang, setLang,
      categories, addCategory,
      notifications, unreadCount, markAllRead, clearNotifications, pushNotification,
      toasts, pushToast,
      showOnboarding, setShowOnboarding,
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
