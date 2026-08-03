import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";

function Dashboard() {
    return (
      <div style={{ display: "flex" }}>
        <Sidebar />
  
        <div style={{ flex: 1 }}>
          <TopBar />
  
          <div style={{ padding: "30px" }}>
  <div
    style={{
      display: "flex",
      gap: "20px",
      marginBottom: "30px",
      flexWrap: "wrap",
    }}
  >
    <StatCard title="Assets" value="126" color="#2563eb" />
    <StatCard title="Online" value="122" color="#16a34a" />
    <StatCard title="Offline" value="4" color="#dc2626" />
    <StatCard title="Alerts" value="2" color="#f59e0b" />
  </div>

  <div
    style={{
      background: "white",
      borderRadius: "12px",
      height: "500px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "24px",
      color: "#6b7280",
    }}
  >
    🗺️ Live Map (Coming Soon)
  </div>
</div>
        </div>
      </div>
    );
  }


<div className="p-8 bg-gray-100 min-h-screen">
  <h1 className="text-4xl font-bold text-blue-600">
    IronTrace Dashboard
  </h1>

  <p className="mt-2 text-gray-600">
    Tailwind is working!
  </p>
</div>

export default Dashboard;