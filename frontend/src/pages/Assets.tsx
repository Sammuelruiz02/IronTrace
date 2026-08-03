import { useEffect, useMemo, useState } from "react";
import { PackagePlus, Radio, TriangleAlert, Wrench } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import AssetDetails from "../components/assets/AssetDetails";
import AssetForm from "../components/assets/AssetForm";
import AssetTable from "../components/assets/AssetTable";
import SearchBar from "../components/assets/SearchBar";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { sampleAssets } from "../data/sampleAssets";
import type {
  Asset,
  AssetFormValues,
  AssetStatus,
} from "../types/asset";

const STORAGE_KEY = "irontrace.assets.v2";
type StatusFilter = "All" | AssetStatus;

function getInitialAssets(): Asset[] {
  try {
    const savedAssets = window.localStorage.getItem(STORAGE_KEY);
    return savedAssets ? (JSON.parse(savedAssets) as Asset[]) : sampleAssets;
  } catch {
    return sampleAssets;
  }
}

function Assets() {
  const [assets, setAssets] = useState<Asset[]>(getInitialAssets);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  }, [assets]);

  const projectOptions = useMemo(
    () =>
      Array.from(new Set(assets.map((asset) => asset.project))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [assets],
  );

  const filteredAssets = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesSearch =
        search.length === 0 ||
        [
          asset.assetNumber,
          asset.assetName,
          asset.category,
          asset.project,
          asset.assignedTo,
        ].some((value) => value.toLowerCase().includes(search));

      const matchesStatus =
        statusFilter === "All" || asset.status === statusFilter;
      const matchesProject =
        projectFilter === "All" || asset.project === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [assets, projectFilter, searchTerm, statusFilter]);

  const openCreateForm = () => {
    setFormMode("create");
    setEditingAsset(null);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (asset: Asset) => {
    setViewingAsset(null);
    setFormMode("edit");
    setEditingAsset(asset);
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSaveAsset = (values: AssetFormValues) => {
    if (formMode === "create") {
      const duplicate = assets.some(
        (asset) => asset.assetNumber === values.assetNumber,
      );

      if (duplicate) {
        setFormError(`Asset #${values.assetNumber} already exists.`);
        return;
      }

      const newAsset: Asset = {
        ...values,
        lastSeen:
          values.gpsStatus === "Live"
            ? "Live now"
            : values.gpsStatus === "Offline"
              ? "Not reporting"
              : "No GPS assigned",
      };

      setAssets((current) => [newAsset, ...current]);
    } else if (editingAsset) {
      const updatedAsset: Asset = {
        ...editingAsset,
        ...values,
        lastSeen:
          values.lastSeen ||
          (values.gpsStatus === "Live"
            ? "Live now"
            : values.gpsStatus === "Offline"
              ? "Not reporting"
              : "No GPS assigned"),
      };

      setAssets((current) =>
        current.map((asset) =>
          asset.assetNumber === editingAsset.assetNumber ? updatedAsset : asset,
        ),
      );
    }

    setIsFormOpen(false);
    setEditingAsset(null);
    setFormError("");
  };

  const handleDeleteAsset = () => {
    if (!deletingAsset) return;

    setAssets((current) =>
      current.filter(
        (asset) => asset.assetNumber !== deletingAsset.assetNumber,
      ),
    );
    setDeletingAsset(null);
  };

  const onlineCount = assets.filter((asset) => asset.status === "Online").length;
  const offlineCount = assets.filter((asset) => asset.status === "Offline").length;
  const maintenanceCount = assets.filter(
    (asset) => asset.status === "Maintenance",
  ).length;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <TopBar title="Assets" />

        <main className="p-5 sm:p-7 lg:p-8">
          <div className="mx-auto max-w-[1600px]">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
                  Equipment management
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                  Assets
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Track equipment assignments, GPS health, and jobsite status.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <PackagePlus size={18} />
                Add asset
              </button>
            </div>

            <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Total assets" value={assets.length} icon={<PackagePlus />} />
              <SummaryCard label="Online" value={onlineCount} icon={<Radio />} tone="success" />
              <SummaryCard label="Offline" value={offlineCount} icon={<TriangleAlert />} tone="danger" />
              <SummaryCard label="Maintenance" value={maintenanceCount} icon={<Wrench />} tone="warning" />
            </section>

            <div className="mb-4">
              <SearchBar
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                projectFilter={projectFilter}
                projectOptions={projectOptions}
                onSearchChange={setSearchTerm}
                onStatusChange={setStatusFilter}
                onProjectChange={setProjectFilter}
                onClear={() => {
                  setSearchTerm("");
                  setStatusFilter("All");
                  setProjectFilter("All");
                }}
              />
            </div>

            <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
              <p>
                Showing <span className="font-bold text-slate-900">{filteredAssets.length}</span> of{" "}
                <span className="font-bold text-slate-900">{assets.length}</span> assets
              </p>
              <p className="hidden sm:block">Data is saved in this browser during the prototype stage.</p>
            </div>

            <AssetTable
              assets={filteredAssets}
              onView={setViewingAsset}
              onEdit={openEditForm}
              onDelete={setDeletingAsset}
            />
          </div>
        </main>
      </div>

      {isFormOpen && (
        <AssetForm
          key={`${formMode}-${editingAsset?.assetNumber ?? "new"}`}
          mode={formMode}
          asset={editingAsset}
          errorMessage={formError}
          onClose={() => {
            setIsFormOpen(false);
            setEditingAsset(null);
            setFormError("");
          }}
          onSubmit={handleSaveAsset}
        />
      )}

      <AssetDetails
        asset={viewingAsset}
        onClose={() => setViewingAsset(null)}
        onEdit={openEditForm}
      />

      <ConfirmDialog
        open={Boolean(deletingAsset)}
        title="Delete this asset?"
        description={
          deletingAsset
            ? `${deletingAsset.assetName} (#${deletingAsset.assetNumber}) will be removed from IronTrace. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete asset"
        onCancel={() => setDeletingAsset(null)}
        onConfirm={handleDeleteAsset}
      />
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  icon: React.ReactElement;
  tone?: "default" | "success" | "danger" | "warning";
};

const summaryTones = {
  default: "bg-blue-50 text-blue-700",
  success: "bg-emerald-50 text-emerald-700",
  danger: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-800",
};

function SummaryCard({
  label,
  value,
  icon,
  tone = "default",
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${summaryTones[tone]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default Assets;
