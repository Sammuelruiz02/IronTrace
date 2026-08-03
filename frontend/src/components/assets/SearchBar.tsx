import { Search, SlidersHorizontal, X } from "lucide-react";
import type { AssetStatus } from "../../types/asset";

type StatusFilter = "All" | AssetStatus;

type SearchBarProps = {
  searchTerm: string;
  statusFilter: StatusFilter;
  projectFilter: string;
  projectOptions: string[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onProjectChange: (value: string) => void;
  onClear: () => void;
};

function SearchBar({
  searchTerm,
  statusFilter,
  projectFilter,
  projectOptions,
  onSearchChange,
  onStatusChange,
  onProjectChange,
  onClear,
}: SearchBarProps) {
  const hasFilters =
    searchTerm.trim().length > 0 ||
    statusFilter !== "All" ||
    projectFilter !== "All";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            aria-label="Search assets"
            type="search"
            placeholder="Search by asset number, name, project, category, or employee"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative">
            <span className="sr-only">Filter by project</span>
            <select
              value={projectFilter}
              onChange={(event) => onProjectChange(event.target.value)}
              className="h-11 min-w-48 appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All projects</option>
              {projectOptions.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
            <SlidersHorizontal
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
          </label>

          <label>
            <span className="sr-only">Filter by status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                onStatusChange(event.target.value as StatusFilter)
              }
              className="h-11 min-w-40 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All statuses</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </label>

          {hasFilters && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchBar;
