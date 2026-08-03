import { useEffect, useMemo, useState } from "react";
import {
  PackagePlus,
  Radio,
  TriangleAlert,
  Wrench,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import AssetDetails from "../components/assets/AssetDetails";
import AssetForm from "../components/assets/AssetForm";
import AssetTable from "../components/assets/AssetTable";
import SearchBar from "../components/assets/SearchBar";
import ConfirmDialog from "../components/ui/ConfirmDialog";

import type {
  Asset,
  AssetFormValues,
  AssetStatus,
} from "../types/asset";

const API_URL = "http://127.0.0.1:8000/assets";

type StatusFilter = "All" | AssetStatus;

type ApiAsset = {
  id: number;
  asset_number: string;
  asset_name: string;
  category: string;
  project: string;
  status: AssetStatus;
  gps_status: Asset["gpsStatus"];
  assigned_to: string;
  last_seen: string;
  notes: string;
  created_at: string;
};

function mapApiAsset(asset: ApiAsset): Asset {
  return {
    id: asset.id,
    assetNumber: asset.asset_number,
    assetName: asset.asset_name,
    category: asset.category,
    project: asset.project,
    status: asset.status,
    gpsStatus: asset.gps_status,
    assignedTo: asset.assigned_to,
    lastSeen: asset.last_seen,
    notes: asset.notes,
  };
}

function mapFormValues(values: AssetFormValues) {
  return {
    asset_number: values.assetNumber,
    asset_name: values.assetName,
    category: values.category,
    project: values.project,
    status: values.status,
    gps_status: values.gpsStatus,
    assigned_to: values.assignedTo,
    last_seen:
      values.lastSeen ||
      (values.gpsStatus === "Live"
        ? "Live now"
        : values.gpsStatus === "Offline"
          ? "Not reporting"
          : "No GPS assigned"),
    notes: values.notes,
  };
}

function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");
  const [projectFilter, setProjectFilter] = useState("All");

  const [formMode, setFormMode] =
    useState<"create" | "edit">("create");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] =
    useState<Asset | null>(null);
  const [viewingAsset, setViewingAsset] =
    useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] =
    useState<Asset | null>(null);

  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const loadAssets = async () => {
      try {
        setLoading(true);
        setPageError("");

        const response = await fetch(`${API_URL}/`);

        if (!response.ok) {
          throw new Error("Unable to load assets.");
        }

        const data = (await response.json()) as ApiAsset[];

        setAssets(data.map(mapApiAsset));
      } catch {
        setPageError(
          "Could not connect to the IronTrace API. Make sure FastAPI is running.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadAssets();
  }, []);

  const projectOptions = useMemo(
    () =>
      Array.from(
        new Set(assets.map((asset) => asset.project)),
      ).sort((a, b) => a.localeCompare(b)),
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
        ].some((value) =>
          value.toLowerCase().includes(search),
        );

      const matchesStatus =
        statusFilter === "All" ||
        asset.status === statusFilter;

      const matchesProject =
        projectFilter === "All" ||
        asset.project === projectFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProject
      );
    });
  }, [
    assets,
    projectFilter,
    searchTerm,
    statusFilter,
  ]);

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

  const handleSaveAsset = async (
    values: AssetFormValues,
  ) => {
    try {
      setFormError("");
      setPageError("");

      if (formMode === "create") {
        const response = await fetch(`${API_URL}/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mapFormValues(values)),
        });

        if (response.status === 409) {
          setFormError(
            `Asset #${values.assetNumber} already exists.`,
          );
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to create asset.");
        }

        const createdAsset = mapApiAsset(
          (await response.json()) as ApiAsset,
        );

        setAssets((current) => [
          createdAsset,
          ...current,
        ]);
      } else if (editingAsset) {
        const response = await fetch(
          `${API_URL}/${editingAsset.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(
              mapFormValues(values),
            ),
          },
        );

        if (response.status === 409) {
          setFormError(
            `Asset #${values.assetNumber} already exists.`,
          );
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to update asset.");
        }

        const updatedAsset = mapApiAsset(
          (await response.json()) as ApiAsset,
        );

        setAssets((current) =>
          current.map((asset) =>
            asset.id === editingAsset.id
              ? updatedAsset
              : asset,
          ),
        );
      }

      setIsFormOpen(false);
      setEditingAsset(null);
      setFormError("");
    } catch {
      setFormError(
        "The asset could not be saved. Make sure the API is running.",
      );
    }
  };

  const handleDeleteAsset = async () => {
    if (!deletingAsset) {
      return;
    }

    try {
      setPageError("");

      const response = await fetch(
        `${API_URL}/${deletingAsset.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok && response.status !== 204) {
        throw new Error("Unable to delete asset.");
      }

      setAssets((current) =>
        current.filter(
          (asset) => asset.id !== deletingAsset.id,
        ),
      );

      setDeletingAsset(null);
    } catch {
      setPageError(
        "The asset could not be deleted. Make sure the API is running.",
      );
    }
  };

  const onlineCount = assets.filter(
    (asset) => asset.status === "Online",
  ).length;

  const offlineCount = assets.filter(
    (asset) => asset.status === "Offline",
  ).length;

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
                  Track equipment assignments, GPS
                  health, and jobsite status.
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

            {pageError && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {pageError}
              </div>
            )}

            <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Total assets"
                value={assets.length}
                icon={<PackagePlus />}
              />

              <SummaryCard
                label="Online"
                value={onlineCount}
                icon={<Radio />}
                tone="success"
              />

              <SummaryCard
                label="Offline"
                value={offlineCount}
                icon={<TriangleAlert />}
                tone="danger"
              />

              <SummaryCard
                label="Maintenance"
                value={maintenanceCount}
                icon={<Wrench />}
                tone="warning"
              />
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
                Showing{" "}
                <span className="font-bold text-slate-900">
                  {filteredAssets.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-900">
                  {assets.length}
                </span>{" "}
                assets
              </p>

              <p className="hidden sm:block">
                Data is saved securely in PostgreSQL.
              </p>
            </div>

            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
                Loading assets...
              </div>
            ) : (
              <AssetTable
                assets={filteredAssets}
                onView={setViewingAsset}
                onEdit={openEditForm}
                onDelete={setDeletingAsset}
              />
            )}
          </div>
        </main>
      </div>

      {isFormOpen && (
        <AssetForm
          key={`${formMode}-${editingAsset?.id ?? "new"}`}
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
  tone?:
    | "default"
    | "success"
    | "danger"
    | "warning";
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
          <p className="text-sm font-semibold text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${summaryTones[tone]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default Assets;