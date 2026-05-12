import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import LandingPage from "./pages/LandingPage";
import { LoginPage, RegisterPage, ForgotPage } from "./pages/AuthPage";
import MainApp     from "./pages/MainApp";
import OnboardingTutorial from "./components/OnboardingTutorial";
import { ToastContainer } from "./components/NotificationCenter";
import { PageSkeleton } from "./components/SkeletonLoader";

/* Smooth page transition variants — HCI: maintain spatial awareness */
const pageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit:    { opacity: 0, y: -8, scale: 0.99 },
};

const pageTransition = {
  type: "tween",
  ease: [0.25, 0.46, 0.45, 0.94], /* easeOutQuad */
  duration: 0.35,
};

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      style={{ minHeight: "100vh" }}
    >
      {children}
    </motion.div>
  );
}

function AppRouter() {
  const { user, showOnboarding, theme, toggleTheme, isLoading } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) {
    return <PageSkeleton />;
  }

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

  // Auth Routes — wrapped in AnimatePresence for smooth transitions
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <AnimatedPage>
            <LandingPage onGetStarted={() => navigate("/register")} onLogin={() => navigate("/login")} theme={theme} toggleTheme={toggleTheme} />
          </AnimatedPage>
        } />
        <Route path="/login" element={
          <AnimatedPage>
            <LoginPage onBack={() => navigate("/")} onSwitchToRegister={() => navigate("/register")} onSwitchToForgot={() => navigate("/forgot")} />
          </AnimatedPage>
        } />
        <Route path="/register" element={
          <AnimatedPage>
            <RegisterPage onBack={() => navigate("/")} onSwitchToLogin={() => navigate("/login")} />
          </AnimatedPage>
        } />
        <Route path="/forgot" element={
          <AnimatedPage>
            <ForgotPage onBack={() => navigate("/login")} onSwitchToLogin={() => navigate("/login")} />
          </AnimatedPage>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
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
