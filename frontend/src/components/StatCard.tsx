type StatCardProps = {
    title: string;
    value: string;
    color?: string;
  };
  
  function StatCard({
    title,
    value,
    color = "#2563eb",
  }: StatCardProps) {
    return (
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          width: "220px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderLeft: `6px solid ${color}`,
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#6b7280",
            fontSize: "16px",
          }}
        >
          {title}
        </h3>
  
        <h1
          style={{
            marginTop: "12px",
            marginBottom: 0,
            fontSize: "40px",
          }}
        >
          {value}
        </h1>
      </div>
    );
  }
  
  export default StatCard;