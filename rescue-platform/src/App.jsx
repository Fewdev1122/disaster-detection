import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/rescue/HomePage";
import RegisterPage from "./pages/public/RegisterPage";
import ConnectLinePage from "./pages/rescue/ConnectLinePage";
import DashboardPage from "./pages/rescue/DashboardPage";
import AdminRescueRequestsPage from "./pages/admin/AdminRescueRequestsPage";
import RegisterPendingPage from "./pages/public/RegisterPendingPage"
import AdminDashboard from "./pages/admin/AdminDashboard";
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/connect-line" element={<ConnectLinePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route
        path="/admin/requests"
        element={<AdminRescueRequestsPage />}
      />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/register/pending" element={<RegisterPendingPage />} />
    </Routes>
  );
}