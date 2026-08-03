import {
  ArrowRight,
  MapPin,
  Radio,
  Satellite,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import TopBar from "../components/TopBar";

function Dashboard() {
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
                Good afternoon, Sammuel
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Here is the current condition of your tracked construction assets.
              </p>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Total assets" value="126" description="Across 8 active projects" color="blue" />
              <StatCard title="Online" value="122" description="96.8% reporting normally" color="green" />
              <StatCard title="Offline" value="4" description="2 require attention" color="red" />
              <StatCard title="Open alerts" value="2" description="1 high-priority alert" color="orange" />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-slate-950">Live asset map</h2>
                    <p className="mt-1 text-xs text-slate-500">Mapbox integration is the next GPS milestone.</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    <Radio size={14} /> 122 live
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
                    <Satellite className="mx-auto text-blue-700" size={30} />
                    <p className="mt-3 font-bold text-slate-950">Live GPS map placeholder</p>
                    <p className="mt-1 max-w-sm text-sm text-slate-600">
                      Asset markers, geofences, and movement trails will appear here.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <h2 className="font-bold text-slate-950">Recent activity</h2>
                  <button type="button" className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">
                    View all <ArrowRight size={14} />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  <Activity icon={<TriangleAlert size={18} />} tone="danger" title="Generator 04 went offline" detail="Airport Project · 18 minutes ago" />
                  <Activity icon={<MapPin size={18} />} tone="blue" title="Trailer 03 entered the geofence" detail="Disney Project · 32 minutes ago" />
                  <Activity icon={<Wrench size={18} />} tone="warning" title="Scissor Lift 07 maintenance due" detail="Universal Project · Due tomorrow" />
                  <Activity icon={<Radio size={18} />} tone="success" title="Forklift 02 reported a new location" detail="Disney Project · Live now" />
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

function Activity({ icon, tone, title, detail }: ActivityProps) {
  return (
    <div className="flex gap-3 px-5 py-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${activityTones[tone]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

export default Dashboard;
