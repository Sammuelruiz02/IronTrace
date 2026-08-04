import { useState } from "react";
import {
  Check,
  ClipboardList,
  Clock3,
  Copy,
  ExternalLink,
  KeyRound,
  LoaderCircle,
  MapPin,
  Radio,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { getAuthorizationHeaders } from "../../auth";
import type { Asset } from "../../types/asset";

const API_URL = `${import.meta.env.VITE_API_URL}/assets`;

type AssetDetailsProps = {
  asset: Asset | null;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
};

type TrackerKeyResponse = {
  asset_id: number;
  asset_number: string;
  tracker_key: string;
  created_at: string;
  description: string;
};

type ApiError = {
  detail?: string;
};

async function getErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const errorData = (await response.json()) as ApiError;

    return errorData.detail || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

function AssetDetails({
  asset,
  onClose,
  onEdit,
}: AssetDetailsProps) {
  const [trackerKey, setTrackerKey] = useState("");
  const [generatedKeyCreatedAt, setGeneratedKeyCreatedAt] =
    useState("");
  const [trackerError, setTrackerError] = useState("");
  const [isGeneratingKey, setIsGeneratingKey] =
    useState(false);
  const [isDisablingTracker, setIsDisablingTracker] =
    useState(false);
  const [trackerDisabled, setTrackerDisabled] =
    useState(false);
  const [copied, setCopied] = useState(false);

  if (!asset) {
    return null;
  }

  const hasCoordinates =
    asset.latitude !== null &&
    asset.longitude !== null;

  const hasActiveTrackerKey =
    !trackerDisabled &&
    (asset.hasTrackerKey || trackerKey !== "");

  const trackerKeyCreatedAt =
    generatedKeyCreatedAt ||
    asset.trackerKeyCreatedAt ||
    "";

  const formattedGpsUpdatedAt =
    asset.gpsUpdatedAt !== null
      ? new Date(asset.gpsUpdatedAt).toLocaleString()
      : "No GPS update recorded";

  const formattedTrackerKeyCreatedAt =
    trackerKeyCreatedAt !== ""
      ? new Date(trackerKeyCreatedAt).toLocaleString()
      : "Creation time unavailable";

  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${asset.latitude},${asset.longitude}`
    : null;

  const generateTrackerKey = async () => {
    if (
      hasActiveTrackerKey &&
      !window.confirm(
        "Replace this tracker key? The current key will stop working immediately.",
      )
    ) {
      return;
    }

    try {
      setIsGeneratingKey(true);
      setTrackerError("");
      setCopied(false);

      const response = await fetch(
        `${API_URL}/${asset.id}/tracker-key`,
        {
          method: "POST",
          headers: {
            ...getAuthorizationHeaders(),
          },
        },
      );

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "The tracker key could not be generated.",
        );

        throw new Error(message);
      }

      const data =
        (await response.json()) as TrackerKeyResponse;

      setTrackerKey(data.tracker_key);
      setGeneratedKeyCreatedAt(data.created_at);
      setTrackerDisabled(false);
    } catch (error) {
      setTrackerError(
        error instanceof Error
          ? error.message
          : "The tracker key could not be generated.",
      );
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const disableTracker = async () => {
    const confirmed = window.confirm(
      "Disable this tracker? The current tracker key will stop working immediately and the device will no longer be able to send GPS updates.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDisablingTracker(true);
      setTrackerError("");
      setCopied(false);

      const response = await fetch(
        `${API_URL}/${asset.id}/tracker-key`,
        {
          method: "DELETE",
          headers: {
            ...getAuthorizationHeaders(),
          },
        },
      );

      if (!response.ok && response.status !== 204) {
        const message = await getErrorMessage(
          response,
          "The tracker could not be disabled.",
        );

        throw new Error(message);
      }

      setTrackerKey("");
      setGeneratedKeyCreatedAt("");
      setTrackerDisabled(true);
    } catch (error) {
      setTrackerError(
        error instanceof Error
          ? error.message
          : "The tracker could not be disabled.",
      );
    } finally {
      setIsDisablingTracker(false);
    }
  };

  const copyTrackerKey = async () => {
    if (!trackerKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(trackerKey);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setTrackerError(
        "The key could not be copied automatically. Select it and copy it manually.",
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-details-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-slate-900 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300">
                Asset #{asset.assetNumber}
              </p>

              <h2
                id="asset-details-title"
                className="mt-1 text-2xl font-bold"
              >
                {asset.assetName}
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                {asset.category}
              </p>
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
          <DetailCard
            icon={<MapPin size={19} />}
            label="Current project"
          >
            {asset.project}
          </DetailCard>

          <DetailCard
            icon={<Radio size={19} />}
            label="GPS status"
          >
            {trackerDisabled
              ? "Unassigned · Tracker disabled"
              : `${asset.gpsStatus} · ${asset.lastSeen}`}
          </DetailCard>

          <DetailCard
            icon={<UserRound size={19} />}
            label="Assigned to"
          >
            {asset.assignedTo}
          </DetailCard>

          <DetailCard
            icon={<ClipboardList size={19} />}
            label="Operational status"
          >
            {asset.status}
          </DetailCard>

          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 sm:col-span-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white">
                <MapPin size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  GPS location
                </p>

                {hasCoordinates ? (
                  <>
                    <p className="mt-2 break-words text-sm font-semibold text-slate-900">
                      {asset.latitude}, {asset.longitude}
                    </p>

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock3 size={16} />

                        <span>
                          Updated {formattedGpsUpdatedAt}
                        </span>
                      </div>

                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
                        >
                          Open in Maps
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">
                    No GPS coordinates have been received for
                    this asset yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 sm:col-span-2">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white">
                  <KeyRound size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                    GPS tracker access
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    The tracker key allows the GPS device to
                    send location updates without using your
                    personal IronTrace login.
                  </p>
                </div>
              </div>

              {trackerError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {trackerError}
                </div>
              )}

              {trackerKey ? (
                <div className="rounded-xl border border-emerald-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <ShieldCheck size={18} />

                    <p className="text-sm font-bold">
                      New tracker key generated
                    </p>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    Copy this key now. IronTrace will not
                    display the complete key again after this
                    window is closed.
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      readOnly
                      value={trackerKey}
                      aria-label="Generated tracker key"
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 outline-none"
                    />

                    <button
                      type="button"
                      onClick={copyTrackerKey}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800"
                    >
                      {copied ? (
                        <>
                          <Check size={16} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copy key
                        </>
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Generated {formattedTrackerKeyCreatedAt}
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={generateTrackerKey}
                      disabled={
                        isGeneratingKey ||
                        isDisablingTracker
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isGeneratingKey ? (
                        <LoaderCircle
                          className="animate-spin"
                          size={16}
                        />
                      ) : (
                        <RefreshCw size={16} />
                      )}

                      Replace tracker key
                    </button>

                    <button
                      type="button"
                      onClick={disableTracker}
                      disabled={
                        isGeneratingKey ||
                        isDisablingTracker
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDisablingTracker ? (
                        <>
                          <LoaderCircle
                            className="animate-spin"
                            size={16}
                          />
                          Disabling...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} />
                          Disable tracker
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : hasActiveTrackerKey ? (
                <div className="rounded-xl border border-emerald-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <ShieldCheck size={20} />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-emerald-800">
                        Tracker connected
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Key created{" "}
                        {formattedTrackerKeyCreatedAt}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    The complete tracker key is hidden for
                    security. Replace it only if the key was
                    exposed, lost, or the GPS device was
                    changed.
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={generateTrackerKey}
                      disabled={
                        isGeneratingKey ||
                        isDisablingTracker
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isGeneratingKey ? (
                        <>
                          <LoaderCircle
                            className="animate-spin"
                            size={16}
                          />
                          Replacing key...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          Replace tracker key
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={disableTracker}
                      disabled={
                        isGeneratingKey ||
                        isDisablingTracker
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDisablingTracker ? (
                        <>
                          <LoaderCircle
                            className="animate-spin"
                            size={16}
                          />
                          Disabling...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} />
                          Disable tracker
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {trackerDisabled ? (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-bold text-amber-800">
                        Tracker disabled
                      </p>

                      <p className="mt-1 text-sm text-amber-700">
                        The previous key can no longer send
                        GPS updates.
                      </p>
                    </div>
                  ) : (
                    <p className="mb-4 text-sm text-slate-600">
                      No tracker key is currently connected to
                      this asset.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={generateTrackerKey}
                    disabled={isGeneratingKey}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGeneratingKey ? (
                      <>
                        <LoaderCircle
                          className="animate-spin"
                          size={17}
                        />
                        Generating key...
                      </>
                    ) : (
                      <>
                        <KeyRound size={17} />
                        Generate tracker key
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Notes
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              {asset.notes ||
                "No notes have been added for this asset."}
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

function DetailCard({
  icon,
  label,
  children,
}: DetailCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-blue-700">
        {icon}

        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </p>
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-900">
        {children}
      </p>
    </div>
  );
}

export default AssetDetails;