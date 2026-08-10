import {
  Eye,
  MapPin,
  Pencil,
  Radio,
  Satellite,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import type {
  Asset,
  AssetStatus,
  GpsStatus,
} from "../../types/asset";


type AssetTableProps = {
  assets: Asset[];

  onView: (
    asset: Asset,
  ) => void;

  onEdit: (
    asset: Asset,
  ) => void;

  onDelete: (
    asset: Asset,
  ) => void;

  breachedAssetIds?: Set<number>;
};


const statusClasses:
  Record<
    AssetStatus,
    string
  > = {
  Online:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20",

  Offline:
    "bg-red-50 text-red-700 ring-red-600/20",

  Maintenance:
    "bg-amber-50 text-amber-800 ring-amber-600/20",
};


const gpsClasses:
  Record<
    GpsStatus,
    string
  > = {
  Live:
    "text-emerald-700",

  Stale:
    "text-amber-700",

  Offline:
    "text-red-700",

  Unassigned:
    "text-slate-500",
};


function AssetTable({
  assets,
  onView,
  onEdit,
  onDelete,
  breachedAssetIds =
    new Set<number>(),
}: AssetTableProps) {

  if (
    assets.length === 0
  ) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">

        <Satellite
          className="mx-auto text-slate-400"
          size={36}
        />

        <h3 className="mt-4 text-base font-semibold text-slate-900">
          No matching assets
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Change the search or
          filters to see more
          equipment.
        </p>

      </div>
    );
  }


  return (
    <div>

      {/* -----------------------------------------------
          SCROLL HELPER
      ------------------------------------------------ */}

      <div className="mb-2 flex items-center justify-end">

        <p className="text-xs font-semibold text-slate-500">
          Scroll right to see more
          asset details and actions →
        </p>

      </div>


      {/* -----------------------------------------------
          TABLE
      ------------------------------------------------ */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="min-w-full divide-y divide-slate-200">

            <thead className="bg-slate-50">

              <tr>

                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  Asset
                </th>


                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  Category
                </th>


                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  Project
                </th>


                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  Status
                </th>


                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  GPS
                </th>


                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  Assigned to
                </th>


                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  Last seen
                </th>


                <th className="sticky right-0 z-20 bg-slate-50 px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600 shadow-[-6px_0_10px_-8px_rgba(15,23,42,0.45)]">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-slate-100 bg-white">

              {assets.map(
                (asset) => {

                  const hasActiveBreach =
                    breachedAssetIds.has(
                      asset.id,
                    );


                  return (
                    <tr
                      key={
                        asset.id
                      }
                      className={
                        hasActiveBreach
                          ? "group bg-red-50/40 transition hover:bg-red-50"
                          : "group transition hover:bg-blue-50/40"
                      }
                    >

                      {/* ---------------------------------
                          ASSET
                      ---------------------------------- */}

                      <td className="whitespace-nowrap px-5 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            onView(
                              asset,
                            )
                          }
                          className="text-left"
                        >

                          <div className="flex items-center gap-2">

                            <span className="block text-sm font-bold text-blue-700 hover:underline">
                              {
                                asset.assetName
                              }
                            </span>


                            {hasActiveBreach && (

                              <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-red-700">

                                <ShieldAlert
                                  size={12}
                                />

                                Breach

                              </span>

                            )}

                          </div>


                          <span className="mt-0.5 block text-xs text-slate-500">
                            #
                            {
                              asset.assetNumber
                            }
                          </span>

                        </button>

                      </td>


                      {/* ---------------------------------
                          CATEGORY
                      ---------------------------------- */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">

                        {
                          asset.category
                        }

                      </td>


                      {/* ---------------------------------
                          PROJECT
                      ---------------------------------- */}

                      <td className="whitespace-nowrap px-5 py-4">

                        <div className="flex items-center gap-2 text-sm text-slate-700">

                          <MapPin
                            size={15}
                            className="text-slate-400"
                          />

                          {
                            asset.project
                          }

                        </div>

                      </td>


                      {/* ---------------------------------
                          STATUS
                      ---------------------------------- */}

                      <td className="whitespace-nowrap px-5 py-4">

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusClasses[asset.status]}`}
                        >
                          {
                            asset.status
                          }
                        </span>

                      </td>


                      {/* ---------------------------------
                          GPS
                      ---------------------------------- */}

                      <td className="whitespace-nowrap px-5 py-4">

                        <span
                          className={`inline-flex items-center gap-1.5 text-sm font-semibold ${gpsClasses[asset.gpsStatus]}`}
                        >

                          {asset.gpsStatus ===
                          "Live" ? (

                            <Radio
                              size={15}
                            />

                          ) : (

                            <Satellite
                              size={15}
                            />

                          )}

                          {
                            asset.gpsStatus
                          }

                        </span>

                      </td>


                      {/* ---------------------------------
                          ASSIGNED TO
                      ---------------------------------- */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">

                        {
                          asset.assignedTo
                        }

                      </td>


                      {/* ---------------------------------
                          LAST SEEN
                      ---------------------------------- */}

                      <td className="whitespace-nowrap px-5 py-4">

                        <div>

                          <p
                            className={
                              hasActiveBreach
                                ? "text-sm font-bold text-red-700"
                                : "text-sm text-slate-500"
                            }
                          >
                            {
                              asset.lastSeen
                            }
                          </p>


                          {hasActiveBreach && (

                            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-red-600">

                              <ShieldAlert
                                size={12}
                              />

                              Unacknowledged
                              geofence breach

                            </p>

                          )}

                        </div>

                      </td>


                      {/* ---------------------------------
                          ACTIONS
                      ---------------------------------- */}

                      <td
                        className={
                          hasActiveBreach
                            ? "sticky right-0 z-10 whitespace-nowrap bg-red-50 px-5 py-4 shadow-[-6px_0_10px_-8px_rgba(15,23,42,0.45)]"
                            : "sticky right-0 z-10 whitespace-nowrap bg-white px-5 py-4 shadow-[-6px_0_10px_-8px_rgba(15,23,42,0.45)] group-hover:bg-blue-50"
                        }
                      >

                        <div className="flex items-center justify-end gap-2">


                          <button
                            type="button"
                            onClick={() =>
                              onView(
                                asset,
                              )
                            }
                            className={
                              hasActiveBreach
                                ? "inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-300 bg-red-600 px-3 text-xs font-bold text-white transition hover:bg-red-700"
                                : "inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                            }
                          >

                            <Eye
                              size={15}
                            />

                            {hasActiveBreach
                              ? "View Alert"
                              : "View"}

                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              onEdit(
                                asset,
                              )
                            }
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                          >

                            <Pencil
                              size={15}
                            />

                            Edit

                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              onDelete(
                                asset,
                              )
                            }
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:bg-red-100"
                          >

                            <Trash2
                              size={15}
                            />

                            Delete

                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                },
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}


export default AssetTable;