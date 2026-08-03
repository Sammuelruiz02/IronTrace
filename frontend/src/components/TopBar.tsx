function TopBar() {
    return (
      <div
        style={{
          height: "70px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 30px",
          backgroundColor: "white",
        }}
      >
        <h2 style={{ margin: 0 }}>Dashboard</h2>
  
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span>🔔</span>
          <span>👤 Sam Ruiz</span>
        </div>
      </div>
    );
  }
  
  export default TopBar;