import { getAuthorizationHeaders } from "../auth";
import type {
  Notification,
  NotificationUnreadCount,
} from "../types/notification";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

function buildHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...getAuthorizationHeaders(),
  };
}

async function handleResponse<T>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    let message = "Something went wrong.";

    try {
      const data = await response.json();

      if (typeof data?.detail === "string") {
        message = data.detail;
      }
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function getNotifications(): Promise<
  Notification[]
> {
  const response = await fetch(
    `${API_BASE_URL}/notifications/`,
    {
      headers: buildHeaders(),
    }
  );

  return handleResponse<Notification[]>(response);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await fetch(
    `${API_BASE_URL}/notifications/unread-count`,
    {
      headers: buildHeaders(),
    }
  );

  const data =
    await handleResponse<NotificationUnreadCount>(
      response
    );

  return data.unread_count;
}

export async function markNotificationRead(
  notificationId: number
): Promise<Notification> {
  const response = await fetch(
    `${API_BASE_URL}/notifications/${notificationId}/read`,
    {
      method: "POST",
      headers: buildHeaders(),
    }
  );

  return handleResponse<Notification>(response);
}

export async function resolveNotification(
  notificationId: number
): Promise<Notification> {
  const response = await fetch(
    `${API_BASE_URL}/notifications/${notificationId}/resolve`,
    {
      method: "POST",
      headers: buildHeaders(),
    }
  );

  return handleResponse<Notification>(response);
}