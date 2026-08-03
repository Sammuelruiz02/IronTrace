import { Construction } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

type ComingSoonProps = {
  title: string;
  description: string;
};

function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <TopBar title={title} />
        <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-6">
          <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
              <Construction size={28} />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-slate-950">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            <span className="mt-6 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              Planned for an upcoming sprint
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ComingSoon;
