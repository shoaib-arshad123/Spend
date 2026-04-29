import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppProvider, useApp } from "./context/AppContext";
import LandingPage from "./pages/LandingPage";
import { LoginPage, RegisterPage } from "./pages/AuthPage";
import MainApp     from "./pages/MainApp";
import OnboardingTutorial from "./components/OnboardingTutorial";
import { ToastContainer } from "./components/NotificationCenter";

function AppRouter() {
  const { user, showOnboarding, theme, toggleTheme } = useApp();
  const [page, setPage] = useState("landing"); // landing | login | register

  if (user) {
    return (
      <>
        <MainApp />
        <ToastContainer />
        <AnimatePresence>
          {showOnboarding && <OnboardingTutorial />}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {page === "landing" && (
          <motion.div key="land" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0, x:-30 }} transition={{ duration:0.3 }}>
            <LandingPage onGetStarted={() => setPage("register")} onLogin={() => setPage("login")} theme={theme} toggleTheme={toggleTheme} />
          </motion.div>
        )}
        {page === "login" && (
          <motion.div key="login" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
            <LoginPage onBack={() => setPage("landing")} onSwitchToRegister={() => setPage("register")} />
          </motion.div>
        )}
        {page === "register" && (
          <motion.div key="reg" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
            <RegisterPage onBack={() => setPage("landing")} onSwitchToLogin={() => setPage("login")} />
          </motion.div>
        )}
      </AnimatePresence>
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
