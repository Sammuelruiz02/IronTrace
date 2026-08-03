import {
  ClipboardList,
  MapPin,
  Radio,
  UserRound,
  X,
} from "lucide-react";
import type { Asset } from "../../types/asset";

type AssetDetailsProps = {
  asset: Asset | null;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
};

function AssetDetails({ asset, onClose, onEdit }: AssetDetailsProps) {
  if (!asset) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-details-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-slate-900 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300">
                Asset #{asset.assetNumber}
              </p>
              <h2 id="asset-details-title" className="mt-1 text-2xl font-bold">
                {asset.assetName}
              </h2>
              <p className="mt-1 text-sm text-slate-300">{asset.category}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close asset details"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <DetailCard icon={<MapPin size={19} />} label="Current project">
            {asset.project}
          </DetailCard>
          <DetailCard icon={<Radio size={19} />} label="GPS status">
            {asset.gpsStatus} · {asset.lastSeen}
          </DetailCard>
          <DetailCard icon={<UserRound size={19} />} label="Assigned to">
            {asset.assignedTo}
          </DetailCard>
          <DetailCard icon={<ClipboardList size={19} />} label="Operational status">
            {asset.status}
          </DetailCard>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Notes
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {asset.notes || "No notes have been added for this asset."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onEdit(asset)}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            Edit asset
          </button>
        </div>
      </div>
    </div>
  );
}

type DetailCardProps = {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
};

function DetailCard({ icon, label, children }: DetailCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-blue-700">
        {icon}
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{children}</p>
    </div>
  );
}

export default AssetDetails;
