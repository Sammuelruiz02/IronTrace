import {
    Circle as LeafletCircle,
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap,
  } from "react-leaflet";
  
  import L from "leaflet";
  
  import {
    Crosshair,
    Filter,
    Loader2,
    MapPin,
    Radio,
    Search,
    Shield,
    TriangleAlert,
  } from "lucide-react";
  
  import {
    useCallback,
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    clearAuthentication,
    getAuthorizationHeaders,
  } from "../auth";
  
  import Sidebar from "../components/Sidebar";
  import TopBar from "../components/TopBar";
  
  import type {
    Asset,
    AssetStatus,
  } from "../types/asset";
  
  
  const API_URL =
    `${import.meta.env.VITE_API_URL}/assets`;
  
  
  const DEFAULT_MAP_CENTER:
    [number, number] = [
      28.291956,
      -81.40757,
    ];
  
  
  type ApiAsset = {
    id: number;
  
    asset_number: string;
    asset_name: string;
  
    category: string;
    project: string;
    project_id: number | null;
  
    status: AssetStatus;
    gps_status: Asset["gpsStatus"];
  
    assigned_to: string;
    last_seen: string;
  
    latitude: number | null;
    longitude: number | null;
    gps_updated_at: string | null;
  
    has_tracker_key: boolean;
    tracker_key_created_at: string | null;
  
    geofence_enabled: boolean;
    geofence_latitude: number | null;
    geofence_longitude: number | null;
    geofence_radius_meters: number | null;
  
    notes: string;
    created_at: string;
  };
  
  
  function mapApiAsset(
    asset: ApiAsset
  ): Asset {
    return {
      id: asset.id,
  
      assetNumber:
        asset.asset_number,
  
      assetName:
        asset.asset_name,
  
      category:
        asset.category,
  
      project:
        asset.project,
      
      projectId:
        asset.project_id,
  
      status:
        asset.status,
  
      gpsStatus:
        asset.gps_status,
  
      assignedTo:
        asset.assigned_to,
  
      lastSeen:
        asset.last_seen,
  
      latitude:
        asset.latitude,
  
      longitude:
        asset.longitude,
  
      gpsUpdatedAt:
        asset.gps_updated_at,
  
      hasTrackerKey:
        asset.has_tracker_key,
  
      trackerKeyCreatedAt:
        asset.tracker_key_created_at,
  
      geofenceEnabled:
        asset.geofence_enabled,
  
      geofenceLatitude:
        asset.geofence_latitude,
  
      geofenceLongitude:
        asset.geofence_longitude,
  
      geofenceRadiusMeters:
        asset.geofence_radius_meters,
  
      notes:
        asset.notes,
  
      createdAt:
        asset.created_at,
    };
  }
  
  
  function getMarkerColor(
    asset: Asset
  ) {
    if (
      asset.status ===
      "Maintenance"
    ) {
      return "#d97706";
    }
  
    if (
      asset.status ===
        "Offline" ||
      asset.gpsStatus ===
        "Offline"
    ) {
      return "#dc2626";
    }
  
    if (
      asset.gpsStatus ===
      "Live"
    ) {
      return "#059669";
    }
  
    return "#1d4ed8";
  }
  
  
  function createAssetMarker(
    asset: Asset
  ) {
    const color =
      getMarkerColor(asset);
  
    return L.divIcon({
      className: "",
  
      html: `
        <div
          style="
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 9999px;
            background: ${color};
            border: 4px solid white;
            box-shadow: 0 8px 20px rgba(15, 23, 42, 0.32);
            color: white;
            font-size: 15px;
            font-weight: 800;
          "
          aria-label="Asset marker"
        >
          ${asset.assetNumber.slice(0, 3)}
        </div>
      `,
  
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -23],
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
      if (
        assets.length === 0
      ) {
        map.setView(
          DEFAULT_MAP_CENTER,
          11
        );
  
        return;
      }
  
      if (
        assets.length === 1
      ) {
        const asset =
          assets[0];
  
        if (
          asset.latitude !== null &&
          asset.longitude !== null
        ) {
          map.setView(
            [
              asset.latitude,
              asset.longitude,
            ],
            16
          );
        }
  
        return;
      }
  
      const bounds =
        L.latLngBounds(
          assets
            .filter(
              (asset) =>
                asset.latitude !==
                  null &&
                asset.longitude !==
                  null
            )
            .map(
              (asset) => [
                asset.latitude as number,
                asset.longitude as number,
              ]
            )
        );
  
      if (
        bounds.isValid()
      ) {
        map.fitBounds(
          bounds,
          {
            padding: [60, 60],
            maxZoom: 16,
          }
        );
      }
    }, [
      assets,
      map,
    ]);
  
    return null;
  }
  
  
  function LiveMap() {
    const [
      assets,
      setAssets,
    ] =
      useState<Asset[]>([]);
  
    const [
      loading,
      setLoading,
    ] =
      useState(true);
  
    const [
      refreshing,
      setRefreshing,
    ] =
      useState(false);
  
    const [
      pageError,
      setPageError,
    ] =
      useState("");
  
    const [
      searchTerm,
      setSearchTerm,
    ] =
      useState("");
  
    const [
      statusFilter,
      setStatusFilter,
    ] =
      useState("All");
  
    const [
      projectFilter,
      setProjectFilter,
    ] =
      useState("All");
  
    const [
      showGeofences,
      setShowGeofences,
    ] =
      useState(true);
  
  
    const loadAssets =
      useCallback(
        async (
          background =
            false
        ) => {
          try {
            if (background) {
              setRefreshing(true);
            } else {
              setLoading(true);
            }
  
            setPageError("");
  
            const response =
              await fetch(
                `${API_URL}/`,
                {
                  headers: {
                    ...getAuthorizationHeaders(),
                  },
                }
              );
  
            if (
              response.status ===
              401
            ) {
              clearAuthentication();
  
              window.location.href =
                "/login";
  
              return;
            }
  
            if (!response.ok) {
              throw new Error(
                "Unable to load live asset locations."
              );
            }
  
            const data =
              (await response.json()) as
                ApiAsset[];
  
            setAssets(
              data.map(
                mapApiAsset
              )
            );
          } catch (error) {
            setPageError(
              error instanceof Error
                ? error.message
                : "Unable to load live map."
            );
          } finally {
            setLoading(false);
            setRefreshing(false);
          }
        },
        []
      );
  
  
    useEffect(() => {
      void loadAssets();
  
      const interval =
        window.setInterval(
          () => {
            void loadAssets(
              true
            );
          },
          10000
        );
  
      return () => {
        window.clearInterval(
          interval
        );
      };
    }, [loadAssets]);
  
  
    const mappedAssets =
      useMemo(
        () =>
          assets.filter(
            (asset) =>
              asset.latitude !==
                null &&
              asset.longitude !==
                null
          ),
        [assets]
      );
  
  
    const projectOptions =
      useMemo(
        () =>
          Array.from(
            new Set(
              assets
                .map(
                  (asset) =>
                    asset.project
                )
                .filter(
                  (project) =>
                    project &&
                    project
                      .toLowerCase() !==
                      "unassigned"
                )
            )
          ).sort(
            (a, b) =>
              a.localeCompare(b)
          ),
        [assets]
      );
  
  
    const visibleAssets =
      useMemo(() => {
        const search =
          searchTerm
            .trim()
            .toLowerCase();
  
        return mappedAssets.filter(
          (asset) => {
            const matchesSearch =
              !search ||
              [
                asset.assetNumber,
                asset.assetName,
                asset.category,
                asset.project,
                asset.assignedTo,
              ].some(
                (value) =>
                  value
                    .toLowerCase()
                    .includes(
                      search
                    )
              );
  
            const matchesStatus =
              statusFilter ===
                "All" ||
              asset.status ===
                statusFilter;
  
            const matchesProject =
              projectFilter ===
                "All" ||
              asset.project ===
                projectFilter;
  
            return (
              matchesSearch &&
              matchesStatus &&
              matchesProject
            );
          }
        );
      }, [
        mappedAssets,
        searchTerm,
        statusFilter,
        projectFilter,
      ]);
  
  
    const liveCount =
      visibleAssets.filter(
        (asset) =>
          asset.gpsStatus ===
          "Live"
      ).length;
  
  
    const offlineCount =
      visibleAssets.filter(
        (asset) =>
          asset.status ===
            "Offline" ||
          asset.gpsStatus ===
            "Offline"
      ).length;
  
  
    const geofenceCount =
      visibleAssets.filter(
        (asset) =>
          asset.geofenceEnabled
      ).length;
  
  
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
  
        <div className="min-w-0 flex-1">
          <TopBar title="Live Map" />
  
          <main className="p-5 sm:p-7 lg:p-8">
            <div className="mx-auto max-w-[1800px]">
  
              {/* HEADER */}
  
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
                    GPS operations
                  </p>
  
                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                    Live Asset Map
                  </h1>
  
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Monitor current GPS
                    locations, tracker status,
                    geofences, and jobsite
                    activity across your
                    equipment fleet.
                  </p>
                </div>
  
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                    <Radio
                      size={14}
                    />
  
                    Auto-refresh 10s
                  </span>
  
                  {refreshing && (
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
  
                      Updating
                    </span>
                  )}
                </div>
              </div>
  
  
              {pageError && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {pageError}
                </div>
              )}
  
  
              {/* STATS */}
  
              <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MapStat
                  label="Mapped assets"
                  value={
                    visibleAssets.length
                  }
                  icon={
                    <MapPin size={20} />
                  }
                  tone="blue"
                />
  
                <MapStat
                  label="Live GPS"
                  value={liveCount}
                  icon={
                    <Radio size={20} />
                  }
                  tone="green"
                />
  
                <MapStat
                  label="Offline"
                  value={
                    offlineCount
                  }
                  icon={
                    <TriangleAlert
                      size={20}
                    />
                  }
                  tone="red"
                />
  
                <MapStat
                  label="Geofences"
                  value={
                    geofenceCount
                  }
                  icon={
                    <Shield size={20} />
                  }
                  tone="orange"
                />
              </section>
  
  
              {/* FILTER BAR */}
  
              <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
  
                  <div className="relative flex-1">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
  
                    <input
                      type="search"
                      placeholder="Search assets, category, project, or assignee..."
                      value={
                        searchTerm
                      }
                      onChange={(
                        event
                      ) =>
                        setSearchTerm(
                          event.target
                            .value
                        )
                      }
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
  
  
                  <div className="flex flex-col gap-3 sm:flex-row">
  
                    <div className="flex items-center gap-2">
                      <Filter
                        size={16}
                        className="text-slate-400"
                      />
  
                      <select
                        value={
                          statusFilter
                        }
                        onChange={(
                          event
                        ) =>
                          setStatusFilter(
                            event.target
                              .value
                          )
                        }
                        className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600"
                      >
                        <option value="All">
                          All statuses
                        </option>
  
                        <option value="Online">
                          Online
                        </option>
  
                        <option value="Offline">
                          Offline
                        </option>
  
                        <option value="Maintenance">
                          Maintenance
                        </option>
                      </select>
                    </div>
  
  
                    <select
                      value={
                        projectFilter
                      }
                      onChange={(
                        event
                      ) =>
                        setProjectFilter(
                          event.target
                            .value
                        )
                      }
                      className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600"
                    >
                      <option value="All">
                        All projects
                      </option>
  
                      {projectOptions.map(
                        (project) => (
                          <option
                            key={
                              project
                            }
                            value={
                              project
                            }
                          >
                            {project}
                          </option>
                        )
                      )}
                    </select>
  
  
                    <button
                      type="button"
                      onClick={() =>
                        setShowGeofences(
                          (current) =>
                            !current
                        )
                      }
                      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition ${
                        showGeofences
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Crosshair
                        size={17}
                      />
  
                      Geofences
                    </button>
                  </div>
                </div>
              </section>
  
  
              {/* MAP AREA */}
  
              <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
  
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
  
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                      <h2 className="font-bold text-slate-950">
                        Asset locations
                      </h2>
  
                      <p className="mt-1 text-xs text-slate-500">
                        Showing{" "}
                        {
                          visibleAssets.length
                        }{" "}
                        of{" "}
                        {
                          mappedAssets.length
                        }{" "}
                        assets with GPS
                        coordinates.
                      </p>
                    </div>
  
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                      Live
  
                      <span className="ml-2 h-2.5 w-2.5 rounded-full bg-red-600" />
                      Offline
  
                      <span className="ml-2 h-2.5 w-2.5 rounded-full bg-amber-600" />
                      Maintenance
                    </div>
                  </div>
  
  
                  <div className="relative min-h-[650px]">
  
                    {loading && (
                      <div className="absolute inset-0 z-[700] flex items-center justify-center bg-white/80 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                          <Loader2
                            size={20}
                            className="animate-spin"
                          />
  
                          Loading live GPS...
                        </div>
                      </div>
                    )}
  
  
                    {!loading &&
                      visibleAssets.length ===
                        0 && (
                        <div className="absolute inset-0 z-[600] flex items-center justify-center bg-white/75 p-6 backdrop-blur-sm">
                          <div className="max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-center shadow-lg">
                            <MapPin
                              size={32}
                              className="mx-auto text-blue-700"
                            />
  
                            <h3 className="mt-3 font-bold text-slate-950">
                              No mapped assets
                            </h3>
  
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              No GPS locations
                              match the current
                              filters.
                            </p>
                          </div>
                        </div>
                      )}
  
  
                    <MapContainer
                      center={
                        DEFAULT_MAP_CENTER
                      }
                      zoom={11}
                      scrollWheelZoom
                      className="h-[650px] w-full"
                    >
                      <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
  
  
                      <FitMapToAssets
                        assets={
                          visibleAssets
                        }
                      />
  
  
                      {showGeofences &&
                        visibleAssets.map(
                          (asset) => {
                            if (
                              !asset.geofenceEnabled ||
                              asset.geofenceLatitude ===
                                null ||
                              asset.geofenceLongitude ===
                                null ||
                              asset.geofenceRadiusMeters ===
                                null
                            ) {
                              return null;
                            }
  
                            return (
                              <LeafletCircle
                                key={`geofence-${asset.id}`}
                                center={[
                                  asset.geofenceLatitude,
                                  asset.geofenceLongitude,
                                ]}
                                radius={
                                  asset.geofenceRadiusMeters
                                }
                                pathOptions={{
                                  color:
                                    "#2563eb",
                                  fillColor:
                                    "#3b82f6",
                                  fillOpacity:
                                    0.08,
                                  weight: 2,
                                }}
                              />
                            );
                          }
                        )}
  
  
                      {visibleAssets.map(
                        (asset) => (
                          <Marker
                            key={
                              asset.id
                            }
                            position={[
                              asset.latitude as number,
                              asset.longitude as number,
                            ]}
                            icon={createAssetMarker(
                              asset
                            )}
                          >
                            <Popup>
                              <div className="min-w-[230px]">
                                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                                  Asset #
                                  {
                                    asset.assetNumber
                                  }
                                </p>
  
                                <p className="mt-1 text-base font-bold text-slate-950">
                                  {
                                    asset.assetName
                                  }
                                </p>
  
                                <p className="mt-1 text-sm text-slate-600">
                                  {
                                    asset.project
                                  }
                                </p>
  
                                <div className="mt-3 space-y-1.5 text-sm text-slate-700">
                                  <p>
                                    <strong>
                                      Status:
                                    </strong>{" "}
                                    {
                                      asset.status
                                    }
                                  </p>
  
                                  <p>
                                    <strong>
                                      GPS:
                                    </strong>{" "}
                                    {
                                      asset.gpsStatus
                                    }
                                  </p>
  
                                  <p>
                                    <strong>
                                      Assigned:
                                    </strong>{" "}
                                    {
                                      asset.assignedTo
                                    }
                                  </p>
  
                                  <p>
                                    <strong>
                                      Geofence:
                                    </strong>{" "}
                                    {asset.geofenceEnabled
                                      ? "Enabled"
                                      : "Disabled"}
                                  </p>
  
                                  <p>
                                    <strong>
                                      Last GPS:
                                    </strong>{" "}
                                    {formatGpsTime(
                                      asset.gpsUpdatedAt
                                    )}
                                  </p>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        )
                      )}
                    </MapContainer>
                  </div>
                </div>
  
  
                {/* ASSET LIST */}
  
                <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
  
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="font-bold text-slate-950">
                      Visible assets
                    </h2>
  
                    <p className="mt-1 text-xs text-slate-500">
                      Current map results
                    </p>
                  </div>
  
  
                  <div className="max-h-[650px] overflow-y-auto divide-y divide-slate-100">
  
                    {visibleAssets.length ===
                    0 ? (
                      <div className="p-6 text-center text-sm text-slate-500">
                        No assets to display.
                      </div>
                    ) : (
                      visibleAssets.map(
                        (asset) => (
                          <div
                            key={
                              asset.id
                            }
                            className="px-5 py-4"
                          >
                            <div className="flex items-start gap-3">
  
                              <span
                                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    getMarkerColor(
                                      asset
                                    ),
                                }}
                              />
  
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-950">
                                  {
                                    asset.assetName
                                  }
                                </p>
  
                                <p className="mt-1 text-xs text-slate-500">
                                  #
                                  {
                                    asset.assetNumber
                                  }{" "}
                                  ·{" "}
                                  {
                                    asset.category
                                  }
                                </p>
  
                                <p className="mt-2 truncate text-xs font-semibold text-slate-600">
                                  {
                                    asset.project
                                  }
                                </p>
  
                                <p className="mt-1 text-xs text-slate-400">
                                  GPS:{" "}
                                  {
                                    asset.gpsStatus
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>
                </aside>
              </section>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  
  type MapStatProps = {
    label: string;
    value: number;
    icon: React.ReactNode;
  
    tone:
      | "blue"
      | "green"
      | "red"
      | "orange";
  };
  
  
  const mapStatTones = {
    blue:
      "bg-blue-50 text-blue-700",
  
    green:
      "bg-emerald-50 text-emerald-700",
  
    red:
      "bg-red-50 text-red-700",
  
    orange:
      "bg-orange-50 text-orange-700",
  };
  
  
  function MapStat({
    label,
    value,
    icon,
    tone,
  }: MapStatProps) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
  
          <div>
            <p className="text-sm font-semibold text-slate-500">
              {label}
            </p>
  
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {value}
            </p>
          </div>
  
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${mapStatTones[tone]}`}
          >
            {icon}
          </div>
        </div>
      </div>
    );
  }
  
  
  function formatGpsTime(
    value: string | null
  ) {
    if (!value) {
      return "No GPS update";
    }
  
    const date =
      new Date(value);
  
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }
  
    return date.toLocaleString();
  }
  
  
  export default LiveMap;