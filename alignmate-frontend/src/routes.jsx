import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LivePosturePage from "./pages/LivePosturePage";
import AboutPage from "@/pages/AboutPage";
import ResearchPage from "@/pages/ResearchPage";
import DashboardPage from "@/pages/DashboardPage";
import OnboardingPage from "@/pages/OnboardingPage";
import PlanPage from "@/pages/PlanPage";
import CalendarPage from "@/pages/CalendarPage";
import ProfilePage from "@/pages/ProfilePage";
import ExercisePage from "@/pages/ExercisePage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"           element={<Home />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/register"   element={<RegisterPage />} />
          <Route path="/about"      element={<AboutPage />} />
          <Route path="/research"   element={<ResearchPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/live"       element={<LivePosturePage />} />
            <Route path="/exercise"   element={<ExercisePage />} />
            <Route path="/dashboard"  element={<DashboardPage />} />
            <Route path="/plan"       element={<PlanPage />} />
            <Route path="/calendar"   element={<CalendarPage />} />
            <Route path="/profile"    element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;