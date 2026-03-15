import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/rescue/HomePage";
import RegisterPage from "./pages/public/RegisterPage";
import ConnectLinePage from "./pages/rescue/ConnectLinePage";
import DashboardPage from "./pages/rescue/DashboardPage";
import AdminRescueRequestsPage from "./pages/admin/AdminRescueRequestsPage";
import RegisterPendingPage from "./pages/public/RegisterPendingPage"
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRescueUnitsPage from "./pages/admin/AdminRescueUnitsPage";
import AdminIncidentsPage from "./pages/admin/AdminIncidentsPage";
import AdminLiveMapPage from "./pages/admin/AdminLiveMapPage";
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
      <Route path="/admin/units" element={<AdminRescueUnitsPage />} />
      <Route path="/admin/incidents" element={<AdminIncidentsPage />} />
      <Route path="/admin/live-map" element={<AdminLiveMapPage />} />
      <Route path="/register/pending" element={<RegisterPendingPage />} />
    </Routes>
  );
}