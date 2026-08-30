import {
    Bell,
    Check,
    CheckCircle2,
    CircleAlert,
    Filter,
    Loader2,
    RefreshCw,
    Search,
    ShieldAlert,
  } from "lucide-react";
  import {
    useCallback,
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    getAuthenticatedUser,
  } from "../auth";
  import {
    getNotifications,
    markNotificationRead,
    resolveNotification,
  } from "../api/notifications";
  import Sidebar from "../components/Sidebar";
  import TopBar from "../components/TopBar";
  import type { Notification } from "../types/notification";
  
  
  type SeverityFilter =
    | "All"
    | "Critical"
    | "Warning"
    | "Info";
  
  type StatusFilter =
    | "All"
    | "Unread"
    | "Unresolved"
    | "Resolved";
  
  
  function Alerts() {
    const user = getAuthenticatedUser();
  
    const [notifications, setNotifications] =
      useState<Notification[]>([]);
  
    const [loading, setLoading] =
      useState(true);
  
    const [refreshing, setRefreshing] =
      useState(false);
  
    const [pageError, setPageError] =
      useState<string | null>(null);
  
    const [processingId, setProcessingId] =
      useState<number | null>(null);
  
    const [severityFilter, setSeverityFilter] =
      useState<SeverityFilter>("All");
  
    const [statusFilter, setStatusFilter] =
      useState<StatusFilter>("All");
  
    const [searchTerm, setSearchTerm] =
      useState("");
  
  
    const canResolve =
      user?.role === "admin" ||
      user?.role === "manager";
  
  
    const loadNotifications = useCallback(
      async (
        background = false
      ) => {
        if (background) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
  
        setPageError(null);
  
        try {
          const data =
            await getNotifications();
  
          setNotifications(data);
        } catch (error) {
          setPageError(
            error instanceof Error
              ? error.message
              : "Unable to load alerts."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );
  
  
    useEffect(() => {
      void loadNotifications();
  
      const interval =
        window.setInterval(
          () => {
            void loadNotifications(true);
          },
          15000
        );
  
      return () => {
        window.clearInterval(interval);
      };
    }, [loadNotifications]);
  
  
    const handleMarkRead = async (
      notification: Notification
    ) => {
      if (notification.is_read) {
        return;
      }
  
      setProcessingId(notification.id);
      setPageError(null);
  
      try {
        const updated =
          await markNotificationRead(
            notification.id
          );
  
        setNotifications((current) =>
          current.map((item) =>
            item.id === updated.id
              ? updated
              : item
          )
        );
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Unable to mark alert read."
        );
      } finally {
        setProcessingId(null);
      }
    };
  
  
    const handleResolve = async (
      notification: Notification
    ) => {
      if (notification.is_resolved) {
        return;
      }
  
      setProcessingId(notification.id);
      setPageError(null);
  
      try {
        const updated =
          await resolveNotification(
            notification.id
          );
  
        setNotifications((current) =>
          current.map((item) =>
            item.id === updated.id
              ? updated
              : item
          )
        );
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Unable to resolve alert."
        );
      } finally {
        setProcessingId(null);
      }
    };
  
  
    const filteredNotifications =
      useMemo(() => {
        const normalizedSearch =
          searchTerm
            .trim()
            .toLowerCase();
  
        return notifications.filter(
          (notification) => {
            if (
              severityFilter !== "All" &&
              notification.severity
                .toLowerCase() !==
                severityFilter.toLowerCase()
            ) {
              return false;
            }
  
            if (
              statusFilter === "Unread" &&
              notification.is_read
            ) {
              return false;
            }
  
            if (
              statusFilter === "Unresolved" &&
              notification.is_resolved
            ) {
              return false;
            }
  
            if (
              statusFilter === "Resolved" &&
              !notification.is_resolved
            ) {
              return false;
            }
  
            if (!normalizedSearch) {
              return true;
            }
  
            const searchable = [
              notification.title,
              notification.message,
              notification.notification_type,
              notification.severity,
              notification.asset_id
                ? `asset ${notification.asset_id}`
                : "",
              notification.device_id
                ? `device ${notification.device_id}`
                : "",
            ]
              .join(" ")
              .toLowerCase();
  
            return searchable.includes(
              normalizedSearch
            );
          }
        );
      }, [
        notifications,
        severityFilter,
        statusFilter,
        searchTerm,
      ]);
  
  
    const stats = useMemo(() => {
      return {
        total: notifications.length,
  
        critical: notifications.filter(
          (notification) =>
            notification.severity
              .toLowerCase() ===
            "critical"
        ).length,
  
        unread: notifications.filter(
          (notification) =>
            !notification.is_read
        ).length,
  
        unresolved: notifications.filter(
          (notification) =>
            !notification.is_resolved
        ).length,
      };
    }, [notifications]);
  
  
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
  
        <div className="min-w-0 flex-1">
          <TopBar title="Alerts" />
  
          <main className="p-5 sm:p-7 lg:p-8">
            <div className="mx-auto max-w-[1600px]">
  
              {/* PAGE HEADER */}
  
              <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-red-700">
                    Security & monitoring
                  </p>
  
                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                    Alerts Center
                  </h1>
  
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Review geofence breaches,
                    tracker events, and other
                    equipment alerts across your
                    organization.
                  </p>
                </div>
  
                <button
                  type="button"
                  disabled={refreshing}
                  onClick={() =>
                    void loadNotifications(true)
                  }
                  className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 lg:self-auto"
                >
                  <RefreshCw
                    size={17}
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  />
  
                  Refresh
                </button>
              </div>
  
  
              {/* ERROR */}
  
              {pageError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {pageError}
                </div>
              )}
  
  
              {/* STATS */}
  
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <AlertStat
                  label="Total alerts"
                  value={stats.total}
                  icon={
                    <Bell size={20} />
                  }
                  tone="blue"
                />
  
                <AlertStat
                  label="Critical"
                  value={stats.critical}
                  icon={
                    <ShieldAlert size={20} />
                  }
                  tone="red"
                />
  
                <AlertStat
                  label="Unread"
                  value={stats.unread}
                  icon={
                    <CircleAlert size={20} />
                  }
                  tone="orange"
                />
  
                <AlertStat
                  label="Unresolved"
                  value={stats.unresolved}
                  icon={
                    <CheckCircle2 size={20} />
                  }
                  tone="slate"
                />
              </section>
  
  
              {/* FILTERS */}
  
              <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
  
                  <div className="relative w-full xl:max-w-md">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
  
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(
                          event.target.value
                        )
                      }
                      placeholder="Search alerts, assets, messages..."
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
                        value={severityFilter}
                        onChange={(event) =>
                          setSeverityFilter(
                            event.target
                              .value as SeverityFilter
                          )
                        }
                        className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600"
                      >
                        <option value="All">
                          All severities
                        </option>
  
                        <option value="Critical">
                          Critical
                        </option>
  
                        <option value="Warning">
                          Warning
                        </option>
  
                        <option value="Info">
                          Info
                        </option>
                      </select>
                    </div>
  
                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(
                          event.target
                            .value as StatusFilter
                        )
                      }
                      className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-600"
                    >
                      <option value="All">
                        All statuses
                      </option>
  
                      <option value="Unread">
                        Unread
                      </option>
  
                      <option value="Unresolved">
                        Unresolved
                      </option>
  
                      <option value="Resolved">
                        Resolved
                      </option>
                    </select>
                  </div>
                </div>
              </section>
  
  
              {/* ALERT LIST */}
  
              <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-slate-950">
                      Alert history
                    </h2>
  
                    <p className="mt-1 text-xs text-slate-500">
                      Showing{" "}
                      {
                        filteredNotifications.length
                      }{" "}
                      of {notifications.length} alerts
                    </p>
                  </div>
                </div>
  
                {loading ? (
                  <div className="flex min-h-[300px] items-center justify-center gap-2 text-sm font-medium text-slate-500">
                    <Loader2
                      size={20}
                      className="animate-spin"
                    />
  
                    Loading alerts...
                  </div>
                ) : filteredNotifications.length ===
                  0 ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Bell size={25} />
                    </div>
  
                    <h3 className="mt-4 text-lg font-bold text-slate-900">
                      No alerts found
                    </h3>
  
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      No notifications match your
                      current filters.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredNotifications.map(
                      (notification) => (
                        <AlertRow
                          key={notification.id}
                          notification={
                            notification
                          }
                          canResolve={
                            Boolean(canResolve)
                          }
                          processing={
                            processingId ===
                            notification.id
                          }
                          onMarkRead={
                            handleMarkRead
                          }
                          onResolve={
                            handleResolve
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </section>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  
  type AlertRowProps = {
    notification: Notification;
    canResolve: boolean;
    processing: boolean;
  
    onMarkRead: (
      notification: Notification
    ) => void;
  
    onResolve: (
      notification: Notification
    ) => void;
  };
  
  
  function AlertRow({
    notification,
    canResolve,
    processing,
    onMarkRead,
    onResolve,
  }: AlertRowProps) {
    const severityClasses =
      getSeverityClasses(
        notification.severity
      );
  
    return (
      <article
        className={`p-5 transition ${
          notification.is_read
            ? "bg-white"
            : "bg-blue-50/30"
        }`}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
  
          <div className="flex min-w-0 gap-4">
  
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${severityClasses.icon}`}
            >
              <ShieldAlert size={20} />
            </div>
  
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
  
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${severityClasses.badge}`}
                >
                  {notification.severity}
                </span>
  
                {!notification.is_read && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                    Unread
                  </span>
                )}
  
                {notification.is_resolved && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    <CheckCircle2
                      size={12}
                    />
  
                    Resolved
                  </span>
                )}
              </div>
  
              <h3 className="mt-3 text-base font-bold text-slate-950">
                {notification.title}
              </h3>
  
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                {notification.message}
              </p>
  
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
  
                <span>
                  {formatDateTime(
                    notification.created_at
                  )}
                </span>
  
                {notification.asset_id !==
                  null && (
                  <span>
                    Asset ID:{" "}
                    {notification.asset_id}
                  </span>
                )}
  
                {notification.device_id !==
                  null && (
                  <span>
                    Device ID:{" "}
                    {notification.device_id}
                  </span>
                )}
  
                {notification.geofence_event_id !==
                  null && (
                  <span>
                    Event ID:{" "}
                    {
                      notification.geofence_event_id
                    }
                  </span>
                )}
              </div>
  
              {notification.is_resolved &&
                notification.resolved_at && (
                  <p className="mt-2 text-xs text-emerald-700">
                    Resolved{" "}
                    {formatDateTime(
                      notification.resolved_at
                    )}
                  </p>
                )}
            </div>
          </div>
  
  
          {/* ACTIONS */}
  
          <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
  
            {!notification.is_read && (
              <button
                type="button"
                disabled={processing}
                onClick={() =>
                  onMarkRead(notification)
                }
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Check size={15} />
                )}
  
                Mark read
              </button>
            )}
  
            {canResolve &&
              !notification.is_resolved && (
                <button
                  type="button"
                  disabled={processing}
                  onClick={() =>
                    onResolve(notification)
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle2
                      size={15}
                    />
                  )}
  
                  Resolve
                </button>
              )}
          </div>
        </div>
      </article>
    );
  }
  
  
  type AlertStatProps = {
    label: string;
    value: number;
    icon: React.ReactNode;
  
    tone:
      | "blue"
      | "red"
      | "orange"
      | "slate";
  };
  
  
  const statToneClasses = {
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    orange:
      "bg-orange-50 text-orange-700",
    slate:
      "bg-slate-100 text-slate-700",
  };
  
  
  function AlertStat({
    label,
    value,
    icon,
    tone,
  }: AlertStatProps) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              {label}
            </p>
  
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {value}
            </p>
          </div>
  
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${statToneClasses[tone]}`}
          >
            {icon}
          </div>
        </div>
      </div>
    );
  }
  
  
  function getSeverityClasses(
    severity: string
  ) {
    const normalized =
      severity.toLowerCase();
  
    if (normalized === "critical") {
      return {
        badge:
          "bg-red-100 text-red-700",
  
        icon:
          "bg-red-100 text-red-700",
      };
    }
  
    if (normalized === "warning") {
      return {
        badge:
          "bg-amber-100 text-amber-800",
  
        icon:
          "bg-amber-100 text-amber-700",
      };
    }
  
    return {
      badge:
        "bg-blue-100 text-blue-700",
  
      icon:
        "bg-blue-100 text-blue-700",
    };
  }
  
  
  function formatDateTime(
    value: string
  ) {
    const date = new Date(value);
  
    if (Number.isNaN(date.getTime())) {
      return value;
    }
  
    return date.toLocaleString();
  }
  
  
  export default Alerts;