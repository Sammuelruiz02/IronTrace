import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import type {
  LatLngBoundsExpression,
} from "leaflet";

import {
  LogIn,
  LogOut,
  MapPin,
  Pencil,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import type {
  Asset,
} from "../../types/asset";

import {
  getAuthorizationHeaders,
} from "../../auth";


interface AssetDetailsProps {
  asset: Asset | null;
  onClose: () => void;
  onEdit?: (asset: Asset) => void;
  onGeofenceAcknowledged?: (assetId: number) => void;
}


interface AssetLocation {
  id: number;
  asset_id: number;
  latitude: number;
  longitude: number;
  gps_status: string;
  recorded_at: string;
  created_at: string;
}


interface GeofenceEvent {
  id: number;
  asset_id: number;
  event_type:
    | "Entered"
    | "Exited";
  geofence_status:
    | "Inside"
    | "Outside";
  latitude: number;
  longitude: number;
  distance_meters: number;
  geofence_radius_meters: number;
  recorded_at: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by_user_id: number | null;
  acknowledged_by_name: string | null;
  acknowledged_by_email: string | null;
  created_at: string;
}


interface TrackerKeyResponse {
  asset_id: number;
  asset_number: string;
  tracker_key: string;
  created_at: string;
  description: string;
}


type GpsFreshnessStatus =
  | "Live"
  | "Stale"
  | "Offline"
  | "Unassigned";


type GeofenceStatus =
  | "Inside"
  | "Outside"
  | "Unavailable";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";


const GPS_REFRESH_INTERVAL =
  10000;

const LIVE_THRESHOLD_MS =
  2 * 60 * 1000;

const STALE_THRESHOLD_MS =
  10 * 60 * 1000;


const DEFAULT_MAP_CENTER:
  [number, number] = [
    28.291956,
    -81.40757,
  ];


function formatDateTime(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}


function getGpsFreshnessStatus(
  updatedAt:
    | string
    | null
    | undefined,
  currentTime: number,
  trackerDisabled: boolean,
): GpsFreshnessStatus {
  if (
    trackerDisabled ||
    !updatedAt
  ) {
    return "Unassigned";
  }

  const updatedTime =
    new Date(
      updatedAt,
    ).getTime();

  if (
    Number.isNaN(
      updatedTime,
    )
  ) {
    return "Offline";
  }

  const age = Math.max(
    0,
    currentTime -
      updatedTime,
  );

  if (
    age <
    LIVE_THRESHOLD_MS
  ) {
    return "Live";
  }

  if (
    age <
    STALE_THRESHOLD_MS
  ) {
    return "Stale";
  }

  return "Offline";
}


function formatGpsAge(
  updatedAt:
    | string
    | null
    | undefined,
  currentTime: number,
) {
  if (!updatedAt) {
    return "No GPS update";
  }

  const updatedTime =
    new Date(
      updatedAt,
    ).getTime();

  if (
    Number.isNaN(
      updatedTime,
    )
  ) {
    return "Unknown";
  }

  const ageMs = Math.max(
    0,
    currentTime -
      updatedTime,
  );

  const seconds =
    Math.floor(
      ageMs / 1000,
    );

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes =
    Math.floor(
      seconds / 60,
    );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(
      hours / 24,
    );

  return `${days}d ago`;
}


function calculateDistanceMeters(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const earthRadiusMeters =
    6371000;

  const toRadians = (
    value: number,
  ) =>
    value *
    (Math.PI / 180);

  const lat1 =
    toRadians(latitude1);

  const lon1 =
    toRadians(longitude1);

  const lat2 =
    toRadians(latitude2);

  const lon2 =
    toRadians(longitude2);

  const deltaLat =
    lat2 - lat1;

  const deltaLon =
    lon2 - lon1;

  const a =
    Math.sin(
      deltaLat / 2,
    ) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(
        deltaLon / 2,
      ) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a),
    );

  return (
    earthRadiusMeters * c
  );
}


function GpsStatusBadge({
  status,
}: {
  status:
    GpsFreshnessStatus;
}) {
  const classes:
    Record<
      GpsFreshnessStatus,
      string
    > = {
    Live:
      "border-green-200 bg-green-50 text-green-700",

    Stale:
      "border-amber-200 bg-amber-50 text-amber-700",

    Offline:
      "border-red-200 bg-red-50 text-red-700",

    Unassigned:
      "border-gray-200 bg-gray-50 text-gray-600",
  };

  const dotClasses:
    Record<
      GpsFreshnessStatus,
      string
    > = {
    Live:
      "bg-green-500",

    Stale:
      "bg-amber-500",

    Offline:
      "bg-red-500",

    Unassigned:
      "bg-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${classes[status]}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${dotClasses[status]}`}
      />

      {status}
    </span>
  );
}


function GeofenceStatusCard({
  status,
  distance,
  radius,
}: {
  status:
    GeofenceStatus;
  distance:
    number | null;
  radius:
    number | null;
}) {
  if (
    status ===
    "Unavailable"
  ) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start gap-3">
          <MapPin
            className="mt-0.5 text-slate-500"
            size={22}
          />

          <div>
            <p className="font-bold text-slate-900">
              Geofence unavailable
            </p>

            <p className="mt-1 text-sm text-slate-600">
              IronTrace needs an
              enabled geofence and a
              current GPS location to
              determine the asset's
              boundary status.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isInside =
    status === "Inside";

  return (
    <div
      className={
        isInside
          ? "rounded-xl border border-emerald-200 bg-emerald-50 p-5"
          : "rounded-xl border border-red-300 bg-red-50 p-5"
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={
              isInside
                ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"
                : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white"
            }
          >
            {isInside ? (
              <ShieldCheck
                size={23}
              />
            ) : (
              <ShieldAlert
                size={23}
              />
            )}
          </div>

          <div>
            <p
              className={
                isInside
                  ? "text-lg font-black text-emerald-900"
                  : "text-lg font-black text-red-800"
              }
            >
              {isInside
                ? "INSIDE GEOFENCE"
                : "OUTSIDE GEOFENCE"}
            </p>

            <p
              className={
                isInside
                  ? "mt-1 text-sm text-emerald-800"
                  : "mt-1 text-sm font-semibold text-red-700"
              }
            >
              {isInside
                ? "Asset is currently within the allowed jobsite boundary."
                : "Asset has moved outside the allowed jobsite boundary."}
            </p>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Distance from center
          </p>

          <p className="mt-1 text-xl font-black text-slate-950">
            {distance !== null
              ? `${Math.round(
                  distance,
                ).toLocaleString()} m`
              : "—"}
          </p>

          {radius !== null && (
            <p className="mt-1 text-xs font-medium text-slate-600">
              Allowed radius:{" "}
              {radius.toLocaleString()}{" "}
              m
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


function FitMovementTrail({
  positions,
  geofenceCenter,
  geofenceRadius,
}: {
  positions:
    [number, number][];
  geofenceCenter:
    [number, number] | null;
  geofenceRadius:
    number | null;
}) {
  const map = useMap();

  useEffect(() => {
    const allPositions:
      [number, number][] = [
        ...positions,
      ];

    if (geofenceCenter) {
      allPositions.push(
        geofenceCenter,
      );
    }

    if (
      allPositions.length ===
      0
    ) {
      return;
    }

    if (
      allPositions.length ===
      1
    ) {
      map.setView(
        allPositions[0],
        16,
      );

      return;
    }

    const bounds:
      LatLngBoundsExpression =
        allPositions;

    map.fitBounds(
      bounds,
      {
        padding: [40, 40],
        maxZoom: 17,
      },
    );

    if (
      geofenceCenter &&
      geofenceRadius &&
      positions.length <= 1
    ) {
      map.setView(
        geofenceCenter,
        15,
      );
    }
  }, [
    map,
    positions,
    geofenceCenter,
    geofenceRadius,
  ]);

  return null;
}


export default function AssetDetails({
  asset,
  onClose,
  onEdit,
  onGeofenceAcknowledged,
}: AssetDetailsProps) {
  const [
    trackerKey,
    setTrackerKey,
  ] =
    useState<
      string | null
    >(null);

  const [
    trackerKeyCreatedAt,
    setTrackerKeyCreatedAt,
  ] =
    useState<
      string | null
    >(null);

  const [
    hasTrackerKey,
    setHasTrackerKey,
  ] =
    useState(false);

  const [
    trackerDisabled,
    setTrackerDisabled,
  ] =
    useState(false);

  const [
    trackerLoading,
    setTrackerLoading,
  ] =
    useState(false);

  const [
    trackerError,
    setTrackerError,
  ] =
    useState<
      string | null
    >(null);

  const [
    copied,
    setCopied,
  ] =
    useState(false);

  const [
    locations,
    setLocations,
  ] =
    useState<
      AssetLocation[]
    >([]);

  const [
    locationsLoading,
    setLocationsLoading,
  ] =
    useState(false);

  const [
    locationsError,
    setLocationsError,
  ] =
    useState<
      string | null
    >(null);

  const [
    geofenceEvents,
    setGeofenceEvents,
  ] =
    useState<
      GeofenceEvent[]
    >([]);

  const [
    geofenceEventsLoading,
    setGeofenceEventsLoading,
  ] =
    useState(false);

  const [
    geofenceEventsError,
    setGeofenceEventsError,
  ] =
    useState<
      string | null
    >(null);

  const [
    acknowledgingEventId,
    setAcknowledgingEventId,
  ] = useState<number | null>(null);

  const [
    acknowledgeError,
    setAcknowledgeError,
  ] = useState<string | null>(null);

  const [
    lastRefreshAt,
    setLastRefreshAt,
  ] =
    useState<
      Date | null
    >(null);

  const [
    currentTime,
    setCurrentTime,
  ] =
    useState(
      Date.now(),
    );


  useEffect(() => {
    if (!asset) {
      setTrackerKey(null);
      setTrackerKeyCreatedAt(
        null,
      );
      setHasTrackerKey(false);
      setTrackerDisabled(
        false,
      );
      setLocations([]);
      setGeofenceEvents([]);
      setLocationsError(
        null,
      );
      setGeofenceEventsError(
        null,
      );
      setAcknowledgeError(null);
      setAcknowledgingEventId(null);
      setLastRefreshAt(
        null,
      );

      return;
    }

    setTrackerKey(null);

    setTrackerKeyCreatedAt(
      asset.trackerKeyCreatedAt,
    );

    setHasTrackerKey(
      asset.hasTrackerKey,
    );

    setTrackerDisabled(
      false,
    );

    setTrackerError(
      null,
    );

    setCopied(false);
  }, [asset]);


  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          setCurrentTime(
            Date.now(),
          );
        },
        GPS_REFRESH_INTERVAL,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, []);


  useEffect(() => {
    if (!asset) {
      return;
    }

    let isActive = true;

    const loadTrackingData =
      async (
        showLoading = false,
      ) => {
        try {
          if (showLoading) {
            setLocationsLoading(
              true,
            );

            setGeofenceEventsLoading(
              true,
            );
          }

          setLocationsError(
            null,
          );

          setGeofenceEventsError(
            null,
          );

          const [
            locationsResponse,
            geofenceEventsResponse,
          ] =
            await Promise.all([
              fetch(
                `${API_URL}/assets/${asset.id}/locations`,
                {
                  headers: {
                    ...getAuthorizationHeaders(),
                  },
                },
              ),

              fetch(
                `${API_URL}/assets/${asset.id}/geofence-events`,
                {
                  headers: {
                    ...getAuthorizationHeaders(),
                  },
                },
              ),
            ]);

          if (
            !locationsResponse.ok
          ) {
            throw new Error(
              "Unable to load location history.",
            );
          }

          if (
            !geofenceEventsResponse.ok
          ) {
            throw new Error(
              "Unable to load geofence event history.",
            );
          }

          const locationData:
            AssetLocation[] =
              await locationsResponse.json();

          const eventData:
            GeofenceEvent[] =
              await geofenceEventsResponse.json();

          if (!isActive) {
            return;
          }

          setLocations(
            locationData,
          );

          setGeofenceEvents(
            eventData,
          );

          setLastRefreshAt(
            new Date(),
          );

          setCurrentTime(
            Date.now(),
          );
        } catch (error) {
          if (!isActive) {
            return;
          }

          if (
            error instanceof Error
          ) {
            if (
              error.message.includes(
                "geofence",
              )
            ) {
              setGeofenceEventsError(
                error.message,
              );
            } else {
              setLocationsError(
                error.message,
              );
            }
          } else {
            setLocationsError(
              "Unable to load tracking data.",
            );
          }
        } finally {
          if (
            isActive &&
            showLoading
          ) {
            setLocationsLoading(
              false,
            );

            setGeofenceEventsLoading(
              false,
            );
          }
        }
      };

    void loadTrackingData(
      true,
    );

    const intervalId =
      window.setInterval(
        () => {
          void loadTrackingData(
            false,
          );
        },
        GPS_REFRESH_INTERVAL,
      );

    return () => {
      isActive = false;

      window.clearInterval(
        intervalId,
      );
    };
  }, [asset?.id]);


  const movementPositions =
    useMemo<
      [number, number][]
    >(() => {
      return [
        ...locations,
      ]
        .sort(
          (a, b) =>
            new Date(
              a.recorded_at,
            ).getTime() -
            new Date(
              b.recorded_at,
            ).getTime(),
        )
        .map(
          (location) => [
            location.latitude,
            location.longitude,
          ],
        );
    }, [locations]);


  const latestLocation =
    useMemo(() => {
      if (
        locations.length ===
        0
      ) {
        return null;
      }

      return [
        ...locations,
      ].sort(
        (a, b) =>
          new Date(
            b.recorded_at,
          ).getTime() -
          new Date(
            a.recorded_at,
          ).getTime(),
      )[0];
    }, [locations]);


  if (!asset) {
    return null;
  }


  const currentLatitude =
    latestLocation?.latitude ??
    asset.latitude;

  const currentLongitude =
    latestLocation?.longitude ??
    asset.longitude;

  const currentGpsUpdatedAt =
    latestLocation?.recorded_at ??
    asset.gpsUpdatedAt;


  const gpsFreshnessStatus =
    getGpsFreshnessStatus(
      currentGpsUpdatedAt,
      currentTime,
      trackerDisabled,
    );


  const gpsAge =
    formatGpsAge(
      currentGpsUpdatedAt,
      currentTime,
    );


  const hasValidGeofence =
    asset.geofenceEnabled &&
    asset.geofenceLatitude !==
      null &&
    asset.geofenceLongitude !==
      null &&
    asset.geofenceRadiusMeters !==
      null;


  const geofenceCenter:
    [number, number] | null =
      hasValidGeofence
        ? [
            asset.geofenceLatitude as number,
            asset.geofenceLongitude as number,
          ]
        : null;


  const geofenceDistance =
    hasValidGeofence &&
    currentLatitude !== null &&
    currentLongitude !== null
      ? calculateDistanceMeters(
          currentLatitude,
          currentLongitude,
          asset.geofenceLatitude as number,
          asset.geofenceLongitude as number,
        )
      : null;


  const geofenceStatus:
    GeofenceStatus =
      !hasValidGeofence ||
      geofenceDistance ===
        null
        ? "Unavailable"
        : geofenceDistance <=
            (asset.geofenceRadiusMeters as number)
          ? "Inside"
          : "Outside";


  const latestGeofenceEvent =
    geofenceEvents.length > 0
      ? geofenceEvents[0]
      : null;


  const activeGeofenceBreach =
    geofenceStatus === "Outside";


  const acknowledgeGeofenceEvent =
    async (eventId: number) => {
      try {
        setAcknowledgingEventId(eventId);
        setAcknowledgeError(null);

        const response = await fetch(
          `${API_URL}/assets/${asset.id}/geofence-events/${eventId}/acknowledge`,
          {
            method: "POST",
            headers: {
              ...getAuthorizationHeaders(),
            },
          },
        );

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => null);

          throw new Error(
            errorData?.detail ||
              "Unable to acknowledge geofence breach.",
          );
        }

        const updatedEvent: GeofenceEvent =
          await response.json();

        setGeofenceEvents((currentEvents) =>
          currentEvents.map((event) =>
            event.id === updatedEvent.id
              ? updatedEvent
              : event,
          ),
        );

        onGeofenceAcknowledged?.(asset.id);
      } catch (error) {
        if (error instanceof Error) {
          setAcknowledgeError(error.message);
        } else {
          setAcknowledgeError(
            "Unable to acknowledge geofence breach.",
          );
        }
      } finally {
        setAcknowledgingEventId(null);
      }
    };


  const generateTrackerKey =
    async () => {
      try {
        setTrackerLoading(
          true,
        );

        setTrackerError(
          null,
        );

        setCopied(false);

        const response =
          await fetch(
            `${API_URL}/assets/${asset.id}/tracker-key`,
            {
              method:
                "POST",

              headers: {
                ...getAuthorizationHeaders(),
              },
            },
          );

        if (!response.ok) {
          const errorData =
            await response
              .json()
              .catch(
                () => null,
              );

          throw new Error(
            errorData?.detail ||
              "Unable to generate tracker key.",
          );
        }

        const data:
          TrackerKeyResponse =
            await response.json();

        setTrackerKey(
          data.tracker_key,
        );

        setTrackerKeyCreatedAt(
          data.created_at,
        );

        setHasTrackerKey(
          true,
        );

        setTrackerDisabled(
          false,
        );
      } catch (error) {
        if (
          error instanceof
          Error
        ) {
          setTrackerError(
            error.message,
          );
        } else {
          setTrackerError(
            "Unable to generate tracker key.",
          );
        }
      } finally {
        setTrackerLoading(
          false,
        );
      }
    };


  const replaceTrackerKey =
    async () => {
      const confirmed =
        window.confirm(
          "Replacing this tracker key will immediately disable the existing key. Continue?",
        );

      if (!confirmed) {
        return;
      }

      await generateTrackerKey();
    };


  const disableTrackerKey =
    async () => {
      const confirmed =
        window.confirm(
          "Disable this tracker? The current tracker key will stop working immediately.",
        );

      if (!confirmed) {
        return;
      }

      try {
        setTrackerLoading(
          true,
        );

        setTrackerError(
          null,
        );

        const response =
          await fetch(
            `${API_URL}/assets/${asset.id}/tracker-key`,
            {
              method:
                "DELETE",

              headers: {
                ...getAuthorizationHeaders(),
              },
            },
          );

        if (!response.ok) {
          const errorData =
            await response
              .json()
              .catch(
                () => null,
              );

          throw new Error(
            errorData?.detail ||
              "Unable to disable tracker.",
          );
        }

        setHasTrackerKey(
          false,
        );

        setTrackerKey(null);

        setTrackerKeyCreatedAt(
          null,
        );

        setTrackerDisabled(
          true,
        );

        setCurrentTime(
          Date.now(),
        );
      } catch (error) {
        if (
          error instanceof
          Error
        ) {
          setTrackerError(
            error.message,
          );
        } else {
          setTrackerError(
            "Unable to disable tracker.",
          );
        }
      } finally {
        setTrackerLoading(
          false,
        );
      }
    };


  const copyTrackerKey =
    async () => {
      if (!trackerKey) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          trackerKey,
        );

        setCopied(true);

        window.setTimeout(
          () => {
            setCopied(
              false,
            );
          },
          2000,
        );
      } catch {
        setTrackerError(
          "Unable to copy tracker key.",
        );
      }
    };


  const googleMapsUrl =
    currentLatitude !==
      null &&
    currentLongitude !==
      null
      ? `https://www.google.com/maps?q=${currentLatitude},${currentLongitude}`
      : null;


  const mapCenter:
    [number, number] =
      currentLatitude !==
        null &&
      currentLongitude !==
        null
        ? [
            currentLatitude,
            currentLongitude,
          ]
        : geofenceCenter ??
          DEFAULT_MAP_CENTER;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <div className="sticky top-0 z-[1000] flex items-start justify-between border-b border-gray-200 bg-white px-6 py-5">
          <div>
            <p className="text-sm font-medium text-gray-500">
              {
                asset.assetNumber
              }
            </p>

            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              {
                asset.assetName
              }
            </h2>
          </div>

          <div className="flex gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() =>
                  onEdit(asset)
                }
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <Pencil
                  size={15}
                />

                Edit
              </button>
            )}

            <button
              type="button"
              onClick={
                onClose
              }
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              Close
            </button>
          </div>
        </div>


        <div className="space-y-8 p-6">

          <section>
            <h3 className="text-lg font-semibold text-gray-900">
              Asset Information
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoCard
                label="Project"
                value={
                  asset.project
                }
              />

              <InfoCard
                label="Category"
                value={
                  asset.category
                }
              />

              <InfoCard
                label="Assigned To"
                value={
                  asset.assignedTo
                }
              />

              <InfoCard
                label="Status"
                value={
                  asset.status
                }
              />
            </div>
          </section>


          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Current GPS Location
              </h3>

              <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />

                Auto-refreshing
                every 10 seconds
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    GPS Health
                  </p>

                  <div className="mt-2">
                    <GpsStatusBadge
                      status={
                        gpsFreshnessStatus
                      }
                    />
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Last Signal
                  </p>

                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {gpsAge}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoCard
                label="GPS Status"
                value={
                  gpsFreshnessStatus
                }
              />

              <InfoCard
                label="Latitude"
                value={
                  currentLatitude !==
                  null
                    ? currentLatitude.toFixed(
                        6,
                      )
                    : "Not available"
                }
              />

              <InfoCard
                label="Longitude"
                value={
                  currentLongitude !==
                  null
                    ? currentLongitude.toFixed(
                        6,
                      )
                    : "Not available"
                }
              />

              <InfoCard
                label="GPS Updated"
                value={
                  formatDateTime(
                    currentGpsUpdatedAt,
                  )
                }
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              {googleMapsUrl && (
                <a
                  href={
                    googleMapsUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Open Current
                  Location in Maps
                </a>
              )}

              {lastRefreshAt && (
                <span className="text-xs text-gray-500">
                  IronTrace checked
                  for updates:{" "}
                  {lastRefreshAt.toLocaleTimeString()}
                </span>
              )}
            </div>
          </section>


          <section>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-orange-600">
                Security Zone
              </p>

              <h3 className="mt-1 text-xl font-black text-slate-950">
                Geofence Status
              </h3>
            </div>

            {!asset.geofenceEnabled ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-bold text-slate-900">
                  Geofence disabled
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Edit this asset to
                  enable a jobsite
                  geofence.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <GeofenceStatusCard
                  status={
                    geofenceStatus
                  }
                  distance={
                    geofenceDistance
                  }
                  radius={
                    asset.geofenceRadiusMeters
                  }
                />
              </div>
            )}


            {activeGeofenceBreach && (
              <div className="mt-4 rounded-xl border-2 border-red-500 bg-red-50 p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
                    <ShieldAlert
                      size={25}
                    />
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-widest text-red-600">
                      Active Security Alert
                    </p>

                    <h4 className="mt-1 text-xl font-black text-red-900">
                      Geofence Breach Detected
                    </h4>

                    <p className="mt-2 text-sm font-medium text-red-800">
                      This asset is currently
                      outside its authorized
                      jobsite boundary.
                    </p>

                    {geofenceDistance !== null && (
                      <p className="mt-2 text-sm text-red-700">
                        Current distance from
                        geofence center:{" "}
                        <strong>
                          {Math.round(
                            geofenceDistance,
                          ).toLocaleString()}{" "}
                          meters
                        </strong>
                      </p>
                    )}

                    {latestGeofenceEvent?.event_type === "Exited" && (
                      <p className="mt-2 text-xs font-semibold text-red-700">
                        Breach recorded:{" "}
                        {formatDateTime(
                          latestGeofenceEvent.recorded_at,
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}


            {hasValidGeofence && (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <InfoCard
                  label="Center Latitude"
                  value={
                    (
                      asset.geofenceLatitude as number
                    ).toFixed(6)
                  }
                />

                <InfoCard
                  label="Center Longitude"
                  value={
                    (
                      asset.geofenceLongitude as number
                    ).toFixed(6)
                  }
                />

                <InfoCard
                  label="Allowed Radius"
                  value={`${(
                    asset.geofenceRadiusMeters as number
                  ).toLocaleString()} meters`}
                />
              </div>
            )}
          </section>


          <section>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                GPS Movement &
                Geofence
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Live asset location,
                historical movement,
                and the allowed
                jobsite boundary.
              </p>
            </div>

            {locationsLoading ? (
              <div className="mt-4 rounded-xl border border-gray-200 p-5 text-sm text-gray-500">
                Loading map...
              </div>
            ) : locationsError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {
                  locationsError
                }
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                <MapContainer
                  center={
                    mapCenter
                  }
                  zoom={16}
                  scrollWheelZoom
                  className="h-[500px] w-full"
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <FitMovementTrail
                    positions={
                      movementPositions
                    }
                    geofenceCenter={
                      geofenceCenter
                    }
                    geofenceRadius={
                      asset.geofenceRadiusMeters
                    }
                  />

                  {hasValidGeofence &&
                    geofenceCenter &&
                    asset.geofenceRadiusMeters !==
                      null && (
                      <Circle
                        center={
                          geofenceCenter
                        }
                        radius={
                          asset.geofenceRadiusMeters
                        }
                        pathOptions={{
                          color:
                            geofenceStatus ===
                            "Outside"
                              ? "#dc2626"
                              : "#f97316",

                          fillColor:
                            geofenceStatus ===
                            "Outside"
                              ? "#ef4444"
                              : "#fb923c",

                          fillOpacity:
                            0.12,

                          weight:
                            3,
                        }}
                      >
                        <Popup>
                          <div>
                            <strong>
                              Jobsite
                              Geofence
                            </strong>

                            <div>
                              Radius:{" "}
                              {
                                asset.geofenceRadiusMeters
                              }{" "}
                              meters
                            </div>

                            <div>
                              Status:{" "}
                              {
                                geofenceStatus
                              }
                            </div>
                          </div>
                        </Popup>
                      </Circle>
                    )}

                  {movementPositions.length >
                    1 && (
                    <Polyline
                      positions={
                        movementPositions
                      }
                    />
                  )}

                  {latestLocation && (
                    <Marker
                      position={[
                        latestLocation.latitude,
                        latestLocation.longitude,
                      ]}
                    >
                      <Popup>
                        <div>
                          <strong>
                            Latest
                            Location
                          </strong>

                          <div>
                            {
                              asset.assetName
                            }
                          </div>

                          <div>
                            {latestLocation.latitude.toFixed(
                              6,
                            )}
                            ,{" "}
                            {latestLocation.longitude.toFixed(
                              6,
                            )}
                          </div>

                          <div>
                            GPS:{" "}
                            {
                              gpsFreshnessStatus
                            }
                          </div>

                          {asset.geofenceEnabled && (
                            <div>
                              Geofence:{" "}
                              {
                                geofenceStatus
                              }
                            </div>
                          )}

                          <div>
                            {formatDateTime(
                              latestLocation.recorded_at,
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
              <span>
                {
                  movementPositions.length
                }{" "}
                GPS{" "}
                {movementPositions.length ===
                1
                  ? "point"
                  : "points"}
              </span>

              {latestLocation && (
                <span>
                  Latest:{" "}
                  {formatDateTime(
                    latestLocation.recorded_at,
                  )}
                </span>
              )}

              {geofenceDistance !==
                null && (
                <span>
                  Distance from
                  geofence center:{" "}
                  {Math.round(
                    geofenceDistance,
                  )}{" "}
                  m
                </span>
              )}
            </div>
          </section>


          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-orange-600">
                  Security History
                </p>

                <h3 className="mt-1 text-xl font-black text-slate-950">
                  Geofence Event Log
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Boundary crossings
                  recorded automatically
                  by IronTrace.
                </p>
              </div>

              {!geofenceEventsLoading && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {
                    geofenceEvents.length
                  }{" "}
                  {geofenceEvents.length ===
                  1
                    ? "event"
                    : "events"}
                </span>
              )}
            </div>


            {acknowledgeError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {acknowledgeError}
              </div>
            )}


            {geofenceEventsLoading && (
              <div className="mt-4 rounded-xl border border-slate-200 p-5 text-sm text-slate-500">
                Loading geofence
                events...
              </div>
            )}


            {!geofenceEventsLoading &&
              geofenceEventsError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {
                    geofenceEventsError
                  }
                </div>
              )}


            {!geofenceEventsLoading &&
              !geofenceEventsError &&
              geofenceEvents.length ===
                0 && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-bold text-slate-900">
                    No boundary
                    crossings yet
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Entered and Exited
                    events will appear
                    here when this asset
                    crosses its geofence.
                  </p>
                </div>
              )}


            {!geofenceEventsLoading &&
              !geofenceEventsError &&
              geofenceEvents.length >
                0 && (
                <div className="mt-4 space-y-3">
                  {geofenceEvents.map(
                    (event) => {
                      const isExit =
                        event.event_type ===
                        "Exited";

                      const eventMapUrl =
                        `https://www.google.com/maps?q=${event.latitude},${event.longitude}`;

                      return (
                        <div
                          key={
                            event.id
                          }
                          className={
                            isExit
                              ? "rounded-xl border border-red-200 bg-red-50 p-5"
                              : "rounded-xl border border-emerald-200 bg-emerald-50 p-5"
                          }
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-3">
                              <div
                                className={
                                  isExit
                                    ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white"
                                    : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"
                                }
                              >
                                {isExit ? (
                                  <LogOut
                                    size={21}
                                  />
                                ) : (
                                  <LogIn
                                    size={21}
                                  />
                                )}
                              </div>

                              <div>
                                <p
                                  className={
                                    isExit
                                      ? "font-black text-red-800"
                                      : "font-black text-emerald-800"
                                  }
                                >
                                  {isExit
                                    ? "Exited Geofence"
                                    : "Entered Geofence"}
                                </p>

                                <p className="mt-1 text-sm text-slate-700">
                                  {formatDateTime(
                                    event.recorded_at,
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  GPS:{" "}
                                  {event.latitude.toFixed(
                                    6,
                                  )}
                                  ,{" "}
                                  {event.longitude.toFixed(
                                    6,
                                  )}
                                </p>

                                {isExit && event.acknowledged && (
                                  <div className="mt-3">
                                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800">
                                      Acknowledged
                                    </span>

                                    <p className="mt-2 text-xs font-semibold text-emerald-800">
                                      Reviewed: {formatDateTime(
                                        event.acknowledged_at,
                                      )}
                                    </p>

                                    {event.acknowledged_by_name && (
                                      <p className="mt-1 text-xs font-semibold text-emerald-800">
                                        Acknowledged by {event.acknowledged_by_name}
                                      </p>
                                    )}

                                    {event.acknowledged_by_email && (
                                      <p className="mt-1 text-xs text-emerald-700">
                                        {event.acknowledged_by_email}
                                      </p>
                                    )}

                                    {!event.acknowledged_by_name &&
                                      event.acknowledged_by_user_id !== null && (
                                        <p className="mt-1 text-xs text-emerald-700">
                                          Acknowledged by user #{event.acknowledged_by_user_id}
                                        </p>
                                      )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                              <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Distance
                                  from center
                                </p>

                                <p className="mt-1 text-lg font-black text-slate-950">
                                  {Math.round(
                                    event.distance_meters,
                                  ).toLocaleString()}{" "}
                                  m
                                </p>
                              </div>

                              <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Allowed
                                  radius
                                </p>

                                <p className="mt-1 text-lg font-black text-slate-950">
                                  {Math.round(
                                    event.geofence_radius_meters,
                                  ).toLocaleString()}{" "}
                                  m
                                </p>
                              </div>

                              {isExit && !event.acknowledged && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void acknowledgeGeofenceEvent(
                                      event.id,
                                    )
                                  }
                                  disabled={
                                    acknowledgingEventId ===
                                    event.id
                                  }
                                  className="inline-flex h-11 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {acknowledgingEventId ===
                                  event.id
                                    ? "Acknowledging..."
                                    : "Acknowledge"}
                                </button>
                              )}

                              <a
                                href={
                                  eventMapUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800"
                              >
                                Open in Maps
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
          </section>


          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Location History
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  GPS readings
                  received for this
                  asset.
                </p>
              </div>

              {!locationsLoading && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {
                    locations.length
                  }{" "}
                  {locations.length ===
                  1
                    ? "reading"
                    : "readings"}
                </span>
              )}
            </div>

            {locationsLoading && (
              <div className="mt-4 rounded-xl border border-gray-200 p-5 text-sm text-gray-500">
                Loading location
                history...
              </div>
            )}

            {!locationsLoading &&
              locationsError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {
                    locationsError
                  }
                </div>
              )}

            {!locationsLoading &&
              !locationsError &&
              locations.length ===
                0 && (
                <div className="mt-4 rounded-xl border border-gray-200 p-5">
                  <p className="font-medium text-gray-900">
                    No location
                    history yet
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    GPS readings will
                    appear here after
                    IronTrace receives
                    location updates.
                  </p>
                </div>
              )}

            {!locationsLoading &&
              !locationsError &&
              locations.length >
                0 && (
                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Time
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Latitude
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Longitude
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Reported
                          </th>

                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Map
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100 bg-white">
                        {locations.map(
                          (
                            location,
                          ) => {
                            const mapUrl =
                              `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

                            return (
                              <tr
                                key={
                                  location.id
                                }
                              >
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                  {formatDateTime(
                                    location.recorded_at,
                                  )}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-700">
                                  {location.latitude.toFixed(
                                    6,
                                  )}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-700">
                                  {location.longitude.toFixed(
                                    6,
                                  )}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                  {
                                    location.gps_status
                                  }
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                  <a
                                    href={
                                      mapUrl
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                  >
                                    Open
                                  </a>
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </section>


          <section>
            <h3 className="text-lg font-semibold text-gray-900">
              GPS Tracker Access
            </h3>

            <div className="mt-4 rounded-xl border border-gray-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">
                    {hasTrackerKey
                      ? "Tracker Connected"
                      : "No Tracker Connected"}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {hasTrackerKey
                      ? "This asset has an active tracker API key."
                      : "Generate a tracker key to connect a GPS device to this asset."}
                  </p>

                  {trackerKeyCreatedAt && (
                    <p className="mt-2 text-xs text-gray-400">
                      Key created:{" "}
                      {formatDateTime(
                        trackerKeyCreatedAt,
                      )}
                    </p>
                  )}
                </div>

                {!hasTrackerKey ? (
                  <button
                    type="button"
                    onClick={
                      generateTrackerKey
                    }
                    disabled={
                      trackerLoading
                    }
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {trackerLoading
                      ? "Generating..."
                      : "Generate Tracker Key"}
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={
                        replaceTrackerKey
                      }
                      disabled={
                        trackerLoading
                      }
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Replace Key
                    </button>

                    <button
                      type="button"
                      onClick={
                        disableTrackerKey
                      }
                      disabled={
                        trackerLoading
                      }
                      className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Disable Tracker
                    </button>
                  </div>
                )}
              </div>

              {trackerKey && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    Save this tracker
                    key now
                  </p>

                  <p className="mt-1 text-sm text-amber-800">
                    IronTrace will not
                    display the full
                    key again after
                    you close this
                    window.
                  </p>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      readOnly
                      value={
                        trackerKey
                      }
                      className="min-w-0 flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-xs text-gray-900"
                    />

                    <button
                      type="button"
                      onClick={
                        copyTrackerKey
                      }
                      className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800"
                    >
                      {copied
                        ? "Copied!"
                        : "Copy Key"}
                    </button>
                  </div>
                </div>
              )}

              {trackerDisabled && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                  Tracker disabled
                  successfully.
                </div>
              )}

              {trackerError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {
                    trackerError
                  }
                </div>
              )}
            </div>
          </section>


          <section>
            <h3 className="text-lg font-semibold text-gray-900">
              Notes
            </h3>

            <div className="mt-4 rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
              {asset.notes ||
                "No notes added."}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}


interface InfoCardProps {
  label: string;
  value: string;
}


function InfoCard({
  label,
  value,
}: InfoCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}