import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Map,
  Bell,
  Building2,
  Settings,
} from "lucide-react";

function Sidebar() {
  return (
    <div
      style={{
        width: "250px",
        backgroundColor: "#1f2937",
        color: "white",
        height: "100vh",
        padding: "24px",
      }}
    >
      <h2 style={{ marginBottom: "30px" }}>IronTrace</h2>

      <Link
        to="/"
        style={{
          textDecoration: "none",
          color: "white",
        }}
      >
        <MenuItem icon={<LayoutDashboard size={20} />} text="Dashboard" />
      </Link>

      <Link
        to="/assets"
        style={{
          textDecoration: "none",
          color: "white",
        }}
      >
        <MenuItem icon={<Package size={20} />} text="Assets" />
      </Link>

      <Link
        to="/map"
        style={{
          textDecoration: "none",
          color: "white",
        }}
      >
        <MenuItem icon={<Map size={20} />} text="Live Map" />
      </Link>

      <Link
        to="/alerts"
        style={{
          textDecoration: "none",
          color: "white",
        }}
      >
        <MenuItem icon={<Bell size={20} />} text="Alerts" />
      </Link>

      <Link
        to="/projects"
        style={{
          textDecoration: "none",
          color: "white",
        }}
      >
        <MenuItem icon={<Building2 size={20} />} text="Projects" />
      </Link>

      <Link
        to="/settings"
        style={{
          textDecoration: "none",
          color: "white",
        }}
      >
        <MenuItem icon={<Settings size={20} />} text="Settings" />
      </Link>
    </div>
  );
}

type MenuItemProps = {
  icon: React.ReactNode;
  text: string;
};

function MenuItem({ icon, text }: MenuItemProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "22px",
        cursor: "pointer",
      }}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}

export default Sidebar;