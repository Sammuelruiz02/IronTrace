import { BrowserRouter, Route, Routes } from "react-router-dom";
import Assets from "./pages/Assets";
import ComingSoon from "./pages/ComingSoon";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/projects" element={<ComingSoon title="Projects" description="Create jobsites, assign equipment, and review project-level asset activity." />} />
        <Route path="/map" element={<ComingSoon title="Live Map" description="Display real-time GPS positions, geofences, movement history, and asset health." />} />
        <Route path="/alerts" element={<ComingSoon title="Alerts" description="Review geofence exits, low battery events, offline trackers, and maintenance warnings." />} />
        <Route path="/maintenance" element={<ComingSoon title="Maintenance" description="Schedule service, record completed work, and track maintenance due dates." />} />
        <Route path="/reports" element={<ComingSoon title="Reports" description="Analyze asset utilization, idle time, tracking history, and operating status." />} />
        <Route path="/settings" element={<ComingSoon title="Settings" description="Manage company preferences, users, roles, notifications, and GPS integrations." />} />
        <Route path="*" element={<ComingSoon title="Page not found" description="The requested IronTrace page does not exist yet." />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
