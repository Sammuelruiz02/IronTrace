import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  MapPin,
  Radio,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import {
  clearAuthentication,
  getAuthenticatedUser,
  getAuthorizationHeaders,
} from "../auth";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import TopBar from "../components/TopBar";

import type {
  Asset,
  AssetStatus,
} from "../types/asset";

const API_URL = `${import.meta.env.VITE_API_URL}/assets`;

const DEFAULT_MAP_CENTER: [number, number] = [
  28.291956,
  -81.40757,
];

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
  latitude: number | null;
  longitude: number | null;
  gps_updated_at: string | null;
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
    latitude: asset.latitude,
    longitude: asset.longitude,
    gpsUpdatedAt: asset.gps_updated_at,
    notes: asset.notes,
    createdAt: asset.created_at,
  };
}

function getFirstName(fullName?: string) {
  if (!fullName) {
    return "there";
  }

  return fullName.trim().split(/\s+/)[0];
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function getMarkerColor(asset: Asset) {
  if (asset.status === "Maintenance") {
    return "#d97706";
  }

  if (
    asset.status === "Offline" ||
    asset.gpsStatus === "Offline"
  ) {
    return "#dc2626";
  }

  if (asset.gpsStatus === "Live") {
    return "#059669";
  }

  return "#1d4ed8";
}

function createAssetMarker(asset: Asset) {
  const color = getMarkerColor(asset);

  return L.divIcon({
    className: "",
    html: `
      <div
        style="
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background: ${color};
          border: 4px solid white;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.28);
          color: white;
          font-size: 16px;
          font-weight: 800;
        "
        aria-label="Asset marker"
      >
        ${asset.assetNumber.slice(0, 3)}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22],
  });
}

type FitMapToAssetsProps = {
  assets: Asset[];
};

function FitMapToAssets({
  assets,
}: FitMapToAssetsProps) {
  const map = useMap();

  useEffect(() => {
    if (assets.length === 0) {
      map.setView(DEFAULT_MAP_CENTER, 11);
      return;
    }

    if (assets.length === 1) {
      const asset = assets[0];

      if (
        asset.latitude !== null &&
        asset.longitude !== null
      ) {
        map.setView(
          [asset.latitude, asset.longitude],
          15,
        );
      }

      return;
    }

    const bounds = L.latLngBounds(
      assets
        .filter(
          (asset) =>
            asset.latitude !== null &&
            asset.longitude !== null,
        )
        .map((asset) => [
          asset.latitude as number,
          asset.longitude as number,
        ]),
    );

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 16,
      });
    }
  }, [assets, map]);

  return null;
}

function Dashboard() {
  const navigate = useNavigate();
  const user = getAuthenticatedUser();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const firstName = getFirstName(user?.full_name);
  const greeting = getGreeting();

  useEffect(() => {
    const loadAssets = async () => {
      try {
        setLoading(true);
        setPageError("");

        const response = await fetch(`${API_URL}/`, {
          headers: {
            ...getAuthorizationHeaders(),
          },
        });

        if (response.status === 401) {
          clearAuthentication();
          navigate("/login", { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Unable to load dashboard data.",
          );
        }

        const data =
          (await response.json()) as ApiAsset[];

        setAssets(data.map(mapApiAsset));
      } catch {
        setPageError(
          "Could not load dashboard data. Make sure the IronTrace API is running.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadAssets();
  }, [navigate]);

  const mappedAssets = useMemo(
    () =>
      assets.filter(
        (asset) =>
          asset.latitude !== null &&
          asset.longitude !== null,
      ),
    [assets],
  );

  const dashboardStats = useMemo(() => {
    const totalAssets = assets.length;

    const onlineAssets = assets.filter(
      (asset) => asset.status === "Online",
    ).length;

    const offlineAssets = assets.filter(
      (asset) => asset.status === "Offline",
    ).length;

    const maintenanceAssets = assets.filter(
      (asset) => asset.status === "Maintenance",
    ).length;

    const activeProjects = new Set(
      assets
        .map((asset) => asset.project.trim())
        .filter(
          (project) =>
            project &&
            project.toLowerCase() !== "unassigned",
        ),
    ).size;

    const reportingPercentage =
      totalAssets > 0
        ? Math.round(
            (onlineAssets / totalAssets) * 100,
          )
        : 0;

    return {
      totalAssets,
      onlineAssets,
      offlineAssets,
      maintenanceAssets,
      activeProjects,
      reportingPercentage,
    };
  }, [assets]);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <TopBar title="Dashboard" />

        <main className="p-5 sm:p-7 lg:p-8">
          <div className="mx-auto max-w-[1600px]">
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
                Operations overview
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                {greeting}, {firstName}
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Here is the current condition of your
                tracked construction assets.
              </p>
            </div>

            {pageError && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {pageError}
              </div>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total assets"
                value={
                  loading
                    ? "—"
                    : String(
                        dashboardStats.totalAssets,
                      )
                }
                description={
                  loading
                    ? "Loading project data"
                    : `Across ${
                        dashboardStats.activeProjects
                      } active ${
                        dashboardStats.activeProjects ===
                        1
                          ? "project"
                          : "projects"
                      }`
                }
                color="blue"
              />

              <StatCard
                title="Online"
                value={
                  loading
                    ? "—"
                    : String(
                        dashboardStats.onlineAssets,
                      )
                }
                description={
                  loading
                    ? "Loading reporting status"
                    : `${dashboardStats.reportingPercentage}% reporting normally`
                }
                color="green"
              />

              <StatCard
                title="Offline"
                value={
                  loading
                    ? "—"
                    : String(
                        dashboardStats.offlineAssets,
                      )
                }
                description={
                  loading
                    ? "Loading offline assets"
                    : `${
                        dashboardStats.offlineAssets
                      } ${
                        dashboardStats.offlineAssets ===
                        1
                          ? "asset requires"
                          : "assets require"
                      } attention`
                }
                color="red"
              />

              <StatCard
                title="Maintenance"
                value={
                  loading
                    ? "—"
                    : String(
                        dashboardStats.maintenanceAssets,
                      )
                }
                description={
                  loading
                    ? "Loading maintenance status"
                    : `${
                        dashboardStats.maintenanceAssets
                      } ${
                        dashboardStats
                          .maintenanceAssets === 1
                          ? "asset is"
                          : "assets are"
                      } in maintenance`
                }
                color="orange"
              />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-slate-950">
                      Live asset map
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Showing assets with available GPS
                      coordinates.
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    <Radio size={14} />

                    {loading
                      ? "Loading"
                      : `${mappedAssets.length} mapped`}
                  </span>
                </div>

                <div className="relative min-h-[470px]">
                  {!loading &&
                    mappedAssets.length === 0 && (
                      <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/85 p-6 text-center backdrop-blur-sm">
                        <div className="max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
                          <MapPin
                            className="mx-auto text-blue-700"
                            size={32}
                          />

                          <p className="mt-3 font-bold text-slate-950">
                            No GPS locations available
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            Assets will appear here after
                            IronTrace receives their
                            coordinates.
                          </p>
                        </div>
                      </div>
                    )}

                  <MapContainer
                    center={DEFAULT_MAP_CENTER}
                    zoom={11}
                    scrollWheelZoom
                    className="h-[470px] w-full"
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <FitMapToAssets
                      assets={mappedAssets}
                    />

                    {mappedAssets.map((asset) => (
                      <Marker
                        key={asset.id}
                        position={[
                          asset.latitude as number,
                          asset.longitude as number,
                        ]}
                        icon={createAssetMarker(asset)}
                      >
                        <Popup>
                          <div className="min-w-[210px]">
                            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                              Asset #
                              {asset.assetNumber}
                            </p>

                            <p className="mt-1 text-base font-bold text-slate-950">
                              {asset.assetName}
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                              {asset.project}
                            </p>

                            <div className="mt-3 space-y-1 text-sm text-slate-700">
                              <p>
                                <strong>Status:</strong>{" "}
                                {asset.status}
                              </p>

                              <p>
                                <strong>GPS:</strong>{" "}
                                {asset.gpsStatus}
                              </p>

                              <p>
                                <strong>
                                  Assigned:
                                </strong>{" "}
                                {asset.assignedTo}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                navigate("/assets")
                              }
                              className="mt-4 inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"
                            >
                              View asset
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <h2 className="font-bold text-slate-950">
                    Asset status
                  </h2>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/assets")
                    }
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                  >
                    View assets
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  <Activity
                    icon={<Radio size={18} />}
                    tone="success"
                    title={`${dashboardStats.onlineAssets} online`}
                    detail="Assets currently reporting normally"
                  />

                  <Activity
                    icon={
                      <TriangleAlert size={18} />
                    }
                    tone="danger"
                    title={`${dashboardStats.offlineAssets} offline`}
                    detail="Assets that may require attention"
                  />

                  <Activity
                    icon={<Wrench size={18} />}
                    tone="warning"
                    title={`${dashboardStats.maintenanceAssets} in maintenance`}
                    detail="Equipment currently unavailable for service"
                  />

                  <Activity
                    icon={<MapPin size={18} />}
                    tone="blue"
                    title={`${mappedAssets.length} mapped assets`}
                    detail="Assets with available GPS coordinates"
                  />
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

type ActivityProps = {
  icon: React.ReactNode;
  tone:
    | "blue"
    | "success"
    | "danger"
    | "warning";
  title: string;
  detail: string;
};

const activityTones = {
  blue: "bg-blue-50 text-blue-700",
  success:
    "bg-emerald-50 text-emerald-700",
  danger: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-800",
};

function Activity({
  icon,
  tone,
  title,
  detail,
}: ActivityProps) {
  return (
    <div className="flex gap-3 px-5 py-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${activityTones[tone]}`}
      >
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {detail}
        </p>
      </div>
    </div>
  );
}

export default Dashboard;