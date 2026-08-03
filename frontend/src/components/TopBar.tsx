import { Bell, Menu, Search, UserRound } from "lucide-react";

type TopBarProps = {
  title: string;
};

function TopBar({ title }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-7 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            IronTrace
          </p>
          <h2 className="text-xl font-bold text-slate-950">{title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="Search IronTrace"
          className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
        >
          <Search size={19} />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-600 ring-2 ring-white" />
        </button>

        <div className="ml-1 hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
            <UserRound size={19} />
          </div>
          <div className="hidden xl:block">
            <p className="text-sm font-bold text-slate-900">Sammuel Ruiz</p>
            <p className="text-xs text-slate-500">Company administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
