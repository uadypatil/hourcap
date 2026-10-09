import { CircularProgress } from "@mui/material";
import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import PrivateRoute from "./PrivateRoute";

const Landing = lazy(() => import("../features/landing/LandingPage"));
const Login = lazy(() => import("../features/auth/LoginPage"));
const Dashboard = lazy(() => import("../features/dashboard/DashboardPage"));
const Calendar = lazy(() => import("../features/calendar/CalendarPage"));
const Reports = lazy(() => import("../features/reports/ReportsPage"));
const Leaves = lazy(() => import("../features/leaves/LeavesPage"));
const Settings = lazy(() => import("../features/settings/SettingsPage"));

const AppRoutes: React.FC = () => (
  <Suspense fallback={<div className="grid min-h-screen place-items-center"><CircularProgress aria-label="Loading" /></div>}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<PrivateRoute><AppShell /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="reports" element={<Reports />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Landing />} />
    </Routes>
  </Suspense>
);
export default AppRoutes;
