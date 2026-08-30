import {
  Bell,
  Check,
  CheckCircle2,
  Loader2,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  clearAuthentication,
  getAuthenticatedUser,
} from "../auth";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  resolveNotification,
} from "../api/notifications";
import type { Notification } from "../types/notification";

type TopBarProps = {
  title: string;
};

function TopBar({ title }: TopBarProps) {
  const navigate = useNavigate();
  const user = getAuthenticatedUser();

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [loadingNotifications, setLoadingNotifications] =
    useState(false);

  const [notificationError, setNotificationError] =
    useState<string | null>(null);

  const [processingNotificationId, setProcessingNotificationId] =
    useState<number | null>(null);

  const notificationPanelRef =
    useRef<HTMLDivElement | null>(null);

    const canResolve =
    user?.role === "admin" ||
    user?.role === "manager";

  const handleLogout = () => {
    clearAuthentication();
    navigate("/login", { replace: true });
  };

  const loadUnreadCount = useCallback(async () => {
    try {
      const count =
        await getUnreadNotificationCount();

      setUnreadCount(count);
    } catch {
      // Silent background failure.
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    setNotificationError(null);

    try {
      const [items, count] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);

      setNotifications(items);
      setUnreadCount(count);
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : "Unable to load notifications."
      );
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();

    const interval = window.setInterval(
      loadUnreadCount,
      10000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!notificationsOpen) {
      return;
    }

    loadNotifications();
  }, [
    notificationsOpen,
    loadNotifications,
  ]);

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(
          event.target as Node
        )
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleMarkRead = async (
    notification: Notification
  ) => {
    if (notification.is_read) {
      return;
    }

    setProcessingNotificationId(
      notification.id
    );

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

      setUnreadCount((current) =>
        Math.max(0, current - 1)
      );
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : "Unable to mark notification read."
      );
    } finally {
      setProcessingNotificationId(null);
    }
  };

  const handleResolve = async (
    notification: Notification
  ) => {
    setProcessingNotificationId(
      notification.id
    );

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
      setNotificationError(
        error instanceof Error
          ? error.message
          : "Unable to resolve notification."
      );
    } finally {
      setProcessingNotificationId(null);
    }
  };

  const formatNotificationTime = (
    value: string
  ) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString();
  };

  const getSeverityClasses = (
    severity: string
  ) => {
    const normalized =
      severity.toLowerCase();

    if (normalized === "critical") {
      return "bg-red-100 text-red-700";
    }

    if (normalized === "warning") {
      return "bg-amber-100 text-amber-700";
    }

    return "bg-slate-100 text-slate-700";
  };

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

          <h2 className="text-xl font-bold text-slate-950">
            {title}
          </h2>
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

        <div
          ref={notificationPanelRef}
          className="relative"
        >
          <button
            type="button"
            aria-label="Notifications"
            onClick={() =>
              setNotificationsOpen(
                (current) => !current
              )
            }
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Bell size={19} />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 z-50 w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                <div>
                  <h3 className="font-bold text-slate-950">
                    Notifications
                  </h3>

                  <p className="text-xs text-slate-500">
                    {unreadCount === 0
                      ? "No unread alerts"
                      : `${unreadCount} unread alert${
                          unreadCount === 1
                            ? ""
                            : "s"
                        }`}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close notifications"
                  onClick={() =>
                    setNotificationsOpen(false)
                  }
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="max-h-[520px] overflow-y-auto">
                {loadingNotifications && (
                  <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-slate-500">
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Loading alerts...
                  </div>
                )}

                {!loadingNotifications &&
                  notificationError && (
                    <div className="px-5 py-6">
                      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        {notificationError}
                      </p>
                    </div>
                  )}

                {!loadingNotifications &&
                  !notificationError &&
                  notifications.length ===
                    0 && (
                    <div className="px-6 py-12 text-center">
                      <Bell
                        size={28}
                        className="mx-auto mb-3 text-slate-300"
                      />

                      <p className="font-semibold text-slate-700">
                        No notifications yet
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        IronTrace alerts will
                        appear here.
                      </p>
                    </div>
                  )}

                {!loadingNotifications &&
                  !notificationError &&
                  notifications.map(
                    (notification) => {
                      const processing =
                        processingNotificationId ===
                        notification.id;

                      return (
                        <div
                          key={notification.id}
                          className={`border-b border-slate-100 px-4 py-4 last:border-b-0 ${
                            notification.is_read
                              ? "bg-white"
                              : "bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${getSeverityClasses(
                                    notification.severity
                                  )}`}
                                >
                                  {
                                    notification.severity
                                  }
                                </span>

                                {notification.is_resolved && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                    <CheckCircle2
                                      size={12}
                                    />
                                    Resolved
                                  </span>
                                )}

                                {!notification.is_read && (
                                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                                )}
                              </div>

                              <h4 className="text-sm font-bold text-slate-950">
                                {
                                  notification.title
                                }
                              </h4>

                              <p className="mt-1 text-sm leading-5 text-slate-600">
                                {
                                  notification.message
                                }
                              </p>

                              <p className="mt-2 text-xs text-slate-400">
                                {formatNotificationTime(
                                  notification.created_at
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {!notification.is_read && (
                              <button
                                type="button"
                                disabled={processing}
                                onClick={() =>
                                  handleMarkRead(
                                    notification
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {processing ? (
                                  <Loader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Check
                                    size={14}
                                  />
                                )}

                                Mark read
                              </button>
                            )}

                            {canResolve &&
                              !notification.is_resolved && (
                                <button
                                  type="button"
                                  disabled={
                                    processing
                                  }
                                  onClick={() =>
                                    handleResolve(
                                      notification
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {processing ? (
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <CheckCircle2
                                      size={14}
                                    />
                                  )}

                                  Resolve
                                </button>
                              )}
                          </div>
                        </div>
                      );
                    }
                  )}
              </div>

              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    navigate("/alerts");
                  }}
                  className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
                >
                  View all alerts
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="ml-1 flex items-center gap-3 border-l border-slate-200 pl-3 sm:pl-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
            <UserRound size={19} />
          </div>

          <div className="hidden xl:block">
            <p className="text-sm font-bold text-slate-900">
              {user?.full_name ??
                "IronTrace User"}
            </p>

            <p className="text-xs text-slate-500">
              {user?.company_name ??
                "Company account"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={19} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;