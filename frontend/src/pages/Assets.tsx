import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import AssetTable from "../components/assets/AssetTable";

type Asset = {
  assetNumber: string;
  assetName: string;
  project: string;
  status: string;
};

function Assets() {
  const [showForm, setShowForm] = useState(false);

  const [assetNumber, setAssetNumber] = useState("");
  const [assetName, setAssetName] = useState("");

  const [assets, setAssets] = useState<Asset[]>([
    {
      assetNumber: "1001",
      assetName: "Forklift",
      project: "Disney Project",
      status: "Online",
    },
    {
      assetNumber: "1002",
      assetName: "Generator",
      project: "Airport Project",
      status: "Offline",
    },
    {
      assetNumber: "1003",
      assetName: "Scissor Lift",
      project: "Universal Project",
      status: "Online",
    },
  ]);

  const handleSaveAsset = () => {
    if (!assetNumber || !assetName) {
      alert("Please fill in all fields.");
      return;
    }

    const newAsset: Asset = {
      assetNumber,
      assetName,
      project: "Unassigned",
      status: "Online",
    };

    setAssets([...assets, newAsset]);

    setAssetNumber("");
    setAssetName("");
    setShowForm(false);
  };

  const handleDeleteAsset = (assetNumber: string) => {
    setAssets(
      assets.filter((asset) => asset.assetNumber !== assetNumber)
    );
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div style={{ flex: 1 }}>
        <TopBar />

        <div style={{ padding: "30px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <h1>Assets</h1>
              <p>Total Assets: {assets.length}</p>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                padding: "12px 20px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              + Add Asset
            </button>
          </div>

          {showForm && (
            <div
              style={{
                background: "#f8fafc",
                padding: "20px",
                borderRadius: "12px",
                marginBottom: "20px",
                border: "1px solid #d1d5db",
              }}
            >
              <h2>Add New Asset</h2>

              <div style={{ marginBottom: "15px" }}>
                <label>Asset Number</label>
                <input
                  type="text"
                  value={assetNumber}
                  onChange={(e) => setAssetNumber(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "5px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label>Asset Name</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "5px",
                  }}
                />
              </div>

              <button
                onClick={handleSaveAsset}
                style={{
                  backgroundColor: "#16a34a",
                  color: "white",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Save Asset
              </button>
            </div>
          )}

          <AssetTable
            assets={assets}
            onDelete={handleDeleteAsset}
          />
        </div>
      </div>
    </div>
  );
}

export default Assets;