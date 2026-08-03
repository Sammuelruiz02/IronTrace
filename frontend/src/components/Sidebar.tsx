import { NavLink } from "react-router-dom";
import {
  Bell,
  Building2,
  ChartNoAxesCombined,
  LayoutDashboard,
  Map,
  Package,
  Settings,
  Wrench,
} from "lucide-react";

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assets", label: "Assets", icon: Package },
  { to: "/projects", label: "Projects", icon: Building2 },
  { to: "/map", label: "Live Map", icon: Map },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/reports", label: "Reports", icon: ChartNoAxesCombined },
];

function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-white lg:flex">
      <div className="flex h-20 items-center border-b border-slate-800 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600 font-black">
          IT
        </div>
        <div className="ml-3">
          <p className="text-lg font-black tracking-tight">IronTrace</p>
          <p className="text-xs font-medium text-slate-400">Asset Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Operations
        </p>
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-blue-700 text-white"
                : "text-slate-300 hover:bg-slate-900 hover:text-white"
            }`
          }
        >
          <Settings size={19} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;
