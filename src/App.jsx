import { AnimatePresence } from "framer-motion";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import LandingPage from "./pages/LandingPage";
import { LoginPage, RegisterPage, ForgotPage } from "./pages/AuthPage";
import MainApp     from "./pages/MainApp";
import OnboardingTutorial from "./components/OnboardingTutorial";
import { ToastContainer } from "./components/NotificationCenter";

function AppRouter() {
  const { user, showOnboarding, theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // If user is logged in, they should stay in MainApp
  if (user) {
    return (
      <>
        <Routes>
          <Route path="/dashboard" element={<MainApp tab="dashboard" />} />
          <Route path="/analytics" element={<MainApp tab="analytics" />} />
          <Route path="/add"       element={<MainApp tab="addExpense" />} />
          <Route path="/history"   element={<MainApp tab="history" />} />
          <Route path="/recurring" element={<MainApp tab="recurring" />} />
          <Route path="/goals"     element={<MainApp tab="goals" />} />
          <Route path="/advice"    element={<MainApp tab="advice" />} />
          <Route path="/rewards"   element={<MainApp tab="rewards" />} />
          <Route path="/profile"   element={<MainApp tab="profile" />} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <AnimatePresence>
          {showOnboarding && <OnboardingTutorial />}
        </AnimatePresence>
      </>
    );
  }

  // Auth Routes
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"         element={<LandingPage onGetStarted={() => navigate("/register")} onLogin={() => navigate("/login")} theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/login"    element={<LoginPage onBack={() => navigate("/")} onSwitchToRegister={() => navigate("/register")} onSwitchToForgot={() => navigate("/forgot")} />} />
        <Route path="/register" element={<RegisterPage onBack={() => navigate("/")} onSwitchToLogin={() => navigate("/login")} />} />
        <Route path="/forgot"   element={<ForgotPage onBack={() => navigate("/login")} onSwitchToLogin={() => navigate("/login")} />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
