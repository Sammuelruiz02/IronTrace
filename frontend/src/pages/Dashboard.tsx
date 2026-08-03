import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  MapPin,
  Radio,
  Satellite,
  TriangleAlert,
  Wrench,
} from "lucide-react";

import {
  clearAuthentication,
  getAuthenticatedUser,
  getAuthorizationHeaders,
} from "../auth";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import TopBar from "../components/TopBar";
import type { Asset, AssetStatus } from "../types/asset";

const API_URL = `${import.meta.env.VITE_API_URL}/assets`;

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
          throw new Error("Unable to load dashboard data.");
        }

        const data = (await response.json()) as ApiAsset[];
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
        ? Math.round((onlineAssets / totalAssets) * 100)
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
                Here is the current condition of your tracked
                construction assets.
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
                value={loading ? "—" : String(dashboardStats.totalAssets)}
                description={
                  loading
                    ? "Loading project data"
                    : `Across ${dashboardStats.activeProjects} active ${
                        dashboardStats.activeProjects === 1
                          ? "project"
                          : "projects"
                      }`
                }
                color="blue"
              />

              <StatCard
                title="Online"
                value={loading ? "—" : String(dashboardStats.onlineAssets)}
                description={
                  loading
                    ? "Loading reporting status"
                    : `${dashboardStats.reportingPercentage}% reporting normally`
                }
                color="green"
              />

              <StatCard
                title="Offline"
                value={loading ? "—" : String(dashboardStats.offlineAssets)}
                description={
                  loading
                    ? "Loading offline assets"
                    : `${
                        dashboardStats.offlineAssets
                      } ${
                        dashboardStats.offlineAssets === 1
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
                    : String(dashboardStats.maintenanceAssets)
                }
                description={
                  loading
                    ? "Loading maintenance status"
                    : `${
                        dashboardStats.maintenanceAssets
                      } ${
                        dashboardStats.maintenanceAssets === 1
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
                      Mapbox integration is the next GPS milestone.
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    <Radio size={14} />
                    {loading
                      ? "Loading"
                      : `${dashboardStats.onlineAssets} live`}
                  </span>
                </div>

                <div className="relative flex min-h-[470px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_#dbeafe_0,_#f8fafc_55%,_#e2e8f0_100%)]">
                  <div className="absolute left-[18%] top-[28%] flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg ring-4 ring-blue-200">
                    <MapPin size={20} />
                  </div>

                  <div className="absolute right-[24%] top-[38%] flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg ring-4 ring-orange-200">
                    <MapPin size={20} />
                  </div>

                  <div className="absolute bottom-[25%] left-[48%] flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg ring-4 ring-emerald-200">
                    <MapPin size={20} />
                  </div>

                  <div className="rounded-xl border border-white/80 bg-white/90 px-6 py-5 text-center shadow-lg backdrop-blur">
                    <Satellite
                      className="mx-auto text-blue-700"
                      size={30}
                    />

                    <p className="mt-3 font-bold text-slate-950">
                      Live GPS map placeholder
                    </p>

                    <p className="mt-1 max-w-sm text-sm text-slate-600">
                      Asset markers, geofences, and movement trails
                      will appear here.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <h2 className="font-bold text-slate-950">
                    Asset status
                  </h2>

                  <button
                    type="button"
                    onClick={() => navigate("/assets")}
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
                    icon={<TriangleAlert size={18} />}
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
                    title={`${dashboardStats.activeProjects} active projects`}
                    detail="Jobsites with assigned equipment"
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
  tone: "blue" | "success" | "danger" | "warning";
  title: string;
  detail: string;
};

const activityTones = {
  blue: "bg-blue-50 text-blue-700",
  success: "bg-emerald-50 text-emerald-700",
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