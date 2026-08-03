type Asset = {
    assetNumber: string;
    assetName: string;
    project: string;
    status: string;
  };
  
  type AssetTableProps = {
    assets: Asset[];
    onDelete: (assetNumber: string) => void;
  };
  
  function AssetTable({ assets, onDelete }: AssetTableProps) {
    return (
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "white",
          boxShadow: "0 2px 8px rgba(0,0,0,.08)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            <th style={{ padding: "15px", textAlign: "left" }}>Asset #</th>
            <th style={{ padding: "15px", textAlign: "left" }}>Name</th>
            <th style={{ padding: "15px", textAlign: "left" }}>Project</th>
            <th style={{ padding: "15px", textAlign: "left" }}>Status</th>
            <th style={{ padding: "15px", textAlign: "center" }}>Actions</th>
          </tr>
        </thead>
  
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.assetNumber}>
              <td style={{ padding: "15px", borderTop: "1px solid #eee" }}>
                {asset.assetNumber}
              </td>
  
              <td style={{ padding: "15px", borderTop: "1px solid #eee" }}>
                {asset.assetName}
              </td>
  
              <td style={{ padding: "15px", borderTop: "1px solid #eee" }}>
                {asset.project}
              </td>
  
              <td
                style={{
                  padding: "15px",
                  borderTop: "1px solid #eee",
                  color:
                    asset.status === "Online"
                      ? "#16a34a"
                      : "#dc2626",
                  fontWeight: "bold",
                }}
              >
                {asset.status}
              </td>
  
              <td
                style={{
                  padding: "15px",
                  borderTop: "1px solid #eee",
                  textAlign: "center",
                }}
              >
                <button
                  onClick={() => onDelete(asset.assetNumber)}
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  
  export default AssetTable;