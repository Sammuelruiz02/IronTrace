import {
  Eye,
  MapPin,
  Pencil,
  Radio,
  Satellite,
  Trash2,
} from "lucide-react";
import type { Asset, AssetStatus, GpsStatus } from "../../types/asset";

type AssetTableProps = {
  assets: Asset[];
  onView: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
};

const statusClasses: Record<AssetStatus, string> = {
  Online: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Offline: "bg-red-50 text-red-700 ring-red-600/20",
  Maintenance: "bg-amber-50 text-amber-800 ring-amber-600/20",
};

const gpsClasses: Record<GpsStatus, string> = {
  Live: "text-emerald-700",
  Offline: "text-red-700",
  Unassigned: "text-slate-500",
};

function AssetTable({ assets, onView, onEdit, onDelete }: AssetTableProps) {
  if (assets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
        <Satellite className="mx-auto text-slate-400" size={36} />
        <h3 className="mt-4 text-base font-semibold text-slate-900">
          No matching assets
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Change the search or filters to see more equipment.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Asset",
                "Category",
                "Project",
                "Status",
                "GPS",
                "Assigned to",
                "Last seen",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className={`px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600 ${
                    heading === "Actions" ? "text-right" : ""
                  }`}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {assets.map((asset) => (
              <tr
                key={asset.assetNumber}
                className="transition hover:bg-blue-50/40"
              >
                <td className="whitespace-nowrap px-5 py-4">
                  <button
                    type="button"
                    onClick={() => onView(asset)}
                    className="text-left"
                  >
                    <span className="block text-sm font-bold text-blue-700 hover:underline">
                      {asset.assetName}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      #{asset.assetNumber}
                    </span>
                  </button>
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                  {asset.category}
                </td>

                <td className="whitespace-nowrap px-5 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <MapPin size={15} className="text-slate-400" />
                    {asset.project}
                  </div>
                </td>

                <td className="whitespace-nowrap px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusClasses[asset.status]}`}
                  >
                    {asset.status}
                  </span>
                </td>

                <td className="whitespace-nowrap px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold ${gpsClasses[asset.gpsStatus]}`}
                  >
                    {asset.gpsStatus === "Live" ? (
                      <Radio size={15} />
                    ) : (
                      <Satellite size={15} />
                    )}
                    {asset.gpsStatus}
                  </span>
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                  {asset.assignedTo}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                  {asset.lastSeen}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-right">
                  <div className="inline-flex items-center gap-1">
                    <ActionButton
                      label="View asset"
                      onClick={() => onView(asset)}
                    >
                      <Eye size={17} />
                    </ActionButton>
                    <ActionButton
                      label="Edit asset"
                      onClick={() => onEdit(asset)}
                    >
                      <Pencil size={17} />
                    </ActionButton>
                    <ActionButton
                      label="Delete asset"
                      danger
                      onClick={() => onDelete(asset)}
                    >
                      <Trash2 size={17} />
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type ActionButtonProps = {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ActionButton({
  label,
  danger = false,
  onClick,
  children,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${
        danger
          ? "text-slate-500 hover:bg-red-50 hover:text-red-700"
          : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
      }`}
    >
      {children}
    </button>
  );
}

export default AssetTable;
