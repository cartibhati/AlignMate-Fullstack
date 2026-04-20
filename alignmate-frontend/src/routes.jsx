import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LivePosturePage from "./pages/LivePosturePage";
import AboutPage from "@/pages/AboutPage";
import ResearchPage from "@/pages/ResearchPage";
import DashboardPage from "@/pages/DashboardPage";   // ← NEW

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"          element={<Home />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/register"  element={<RegisterPage />} />
          <Route path="/live"      element={<LivePosturePage />} />
          <Route path="/about"     element={<AboutPage />} />
          <Route path="/research"  element={<ResearchPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />  {/* ← NEW */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;