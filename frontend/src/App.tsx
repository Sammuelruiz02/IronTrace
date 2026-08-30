import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

import Alerts from "./pages/Alerts";
import Assets from "./pages/Assets";
import ComingSoon from "./pages/ComingSoon";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import LiveMap from "./pages/LiveMap";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import Register from "./pages/Register";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        <Route
          element={
            <ProtectedRoute />
          }
        >

          <Route
            path="/"
            element={
              <Dashboard />
            }
          />

          <Route
            path="/assets"
            element={
              <Assets />
            }
          />

          <Route
            path="/devices"
            element={
              <Devices />
            }
          />

          <Route
            path="/projects"
            element={
              <Projects />
            }
          />

          <Route
            path="/map"
            element={
              <LiveMap />
            }
          />

          <Route
            path="/alerts"
            element={
              <Alerts />
            }
          />


          <Route
            path="/maintenance"
            element={
              <ComingSoon
                title="Maintenance"
                description="Schedule service, record completed work, and track maintenance due dates."
              />
            }
          />

          <Route
            path="/reports"
            element={
              <ComingSoon
                title="Reports"
                description="Analyze asset utilization, idle time, tracking history, and operating status."
              />
            }
          />

          <Route
            path="/settings"
            element={
              <ComingSoon
                title="Settings"
                description="Manage company preferences, users, roles, notifications, and GPS integrations."
              />
            }
          />

        </Route>


        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}


export default App;