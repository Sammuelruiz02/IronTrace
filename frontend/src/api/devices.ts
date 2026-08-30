import {
    getAuthorizationHeaders,
  } from "../auth";
  
  import type {
    DeviceFormValues,
    TrackerDevice,
  } from "../types/device";
  
  
  const API_BASE_URL =
    import.meta.env.VITE_API_URL;
  
  
  function headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      ...getAuthorizationHeaders(),
    };
  }
  
  
  async function errorMessage(
    response: Response,
    fallback: string
  ) {
    try {
      const data =
        await response.json();
  
      if (
        data &&
        typeof data.detail === "string"
      ) {
        return data.detail;
      }
    } catch {
      // Use fallback.
    }
  
    return fallback;
  }
  
  
  export async function getDevices():
    Promise<TrackerDevice[]> {
    const response = await fetch(
      `${API_BASE_URL}/devices/`,
      {
        headers: headers(),
      }
    );
  
    if (!response.ok) {
      throw new Error(
        await errorMessage(
          response,
          "Unable to load tracker devices."
        )
      );
    }
  
    return response.json();
  }
  
  
  export async function createDevice(
    values: DeviceFormValues
  ): Promise<TrackerDevice> {
    const response = await fetch(
      `${API_BASE_URL}/devices/`,
      {
        method: "POST",
        headers: headers(),
  
        body: JSON.stringify({
          device_name:
            values.device_name.trim(),
  
          serial_number:
            values.serial_number.trim(),
  
          provider:
            values.provider.trim() ||
            "Manual",
  
          provider_device_id:
            values.provider_device_id.trim() ||
            null,
  
          imei:
            values.imei.trim() ||
            null,
  
          sim_iccid:
            values.sim_iccid.trim() ||
            null,
  
          status:
            values.status.trim() ||
            "Active",
  
          notes:
            values.notes.trim(),
        }),
      }
    );
  
    if (!response.ok) {
      throw new Error(
        await errorMessage(
          response,
          "Unable to create tracker device."
        )
      );
    }
  
    return response.json();
  }
  
  
  export async function updateDevice(
    deviceId: number,
    values: DeviceFormValues
  ): Promise<TrackerDevice> {
    const response = await fetch(
      `${API_BASE_URL}/devices/${deviceId}`,
      {
        method: "PUT",
        headers: headers(),
  
        body: JSON.stringify({
          device_name:
            values.device_name.trim(),
  
          serial_number:
            values.serial_number.trim(),
  
          provider:
            values.provider.trim() ||
            "Manual",
  
          provider_device_id:
            values.provider_device_id.trim() ||
            null,
  
          imei:
            values.imei.trim() ||
            null,
  
          sim_iccid:
            values.sim_iccid.trim() ||
            null,
  
          status:
            values.status.trim() ||
            "Active",
  
          notes:
            values.notes.trim(),
        }),
      }
    );
  
    if (!response.ok) {
      throw new Error(
        await errorMessage(
          response,
          "Unable to update tracker device."
        )
      );
    }
  
    return response.json();
  }
  
  
  export async function assignDevice(
    deviceId: number,
    assetId: number
  ): Promise<TrackerDevice> {
    const response = await fetch(
      `${API_BASE_URL}/devices/${deviceId}/assign/${assetId}`,
      {
        method: "POST",
        headers: headers(),
      }
    );
  
    if (!response.ok) {
      throw new Error(
        await errorMessage(
          response,
          "Unable to assign tracker."
        )
      );
    }
  
    return response.json();
  }
  
  
  export async function unassignDevice(
    deviceId: number
  ): Promise<TrackerDevice> {
    const response = await fetch(
      `${API_BASE_URL}/devices/${deviceId}/unassign`,
      {
        method: "POST",
        headers: headers(),
      }
    );
  
    if (!response.ok) {
      throw new Error(
        await errorMessage(
          response,
          "Unable to unassign tracker."
        )
      );
    }
  
    return response.json();
  }
  
  
  export async function deleteDevice(
    deviceId: number
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/devices/${deviceId}`,
      {
        method: "DELETE",
        headers:
          getAuthorizationHeaders(),
      }
    );
  
    if (
      !response.ok &&
      response.status !== 204
    ) {
      throw new Error(
        await errorMessage(
          response,
          "Unable to delete tracker device."
        )
      );
    }
  }