export type AssetStatus =
  | "Online"
  | "Offline"
  | "Maintenance";

export type GpsStatus =
  | "Live"
  | "Stale"
  | "Offline"
  | "Unassigned";

export interface Asset {
  id: number;

  assetNumber: string;
  assetName: string;
  category: string;
  project: string;
  projectId: number | null;

  status: AssetStatus;
  gpsStatus: GpsStatus;

  assignedTo: string;
  lastSeen: string;

  latitude: number | null;
  longitude: number | null;
  gpsUpdatedAt: string | null;

  hasTrackerKey: boolean;
  trackerKeyCreatedAt: string | null;

  geofenceEnabled: boolean;
  geofenceLatitude: number | null;
  geofenceLongitude: number | null;
  geofenceRadiusMeters: number | null;

  notes: string;
  createdAt: string;
}

export interface AssetFormValues {
  assetNumber: string;
  assetName: string;
  category: string;
  project: string;
  projectId: number | null;

  status: AssetStatus;
  gpsStatus: GpsStatus;

  assignedTo: string;

  latitude: number | null;
  longitude: number | null;

  geofenceEnabled: boolean;
  geofenceLatitude: number | null;
  geofenceLongitude: number | null;
  geofenceRadiusMeters: number | null;

  notes: string;
}

export interface AssetApiResponse {
  id: number;

  asset_number: string;
  asset_name: string;
  category: string;
  project: string;
  project_id: number | null;

  status: AssetStatus;
  gps_status: GpsStatus;

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
}

export interface AssetApiPayload {
  asset_number: string;
  asset_name: string;
  category: string;
  project: string;
  project_id: number | null;

  status: AssetStatus;
  gps_status: GpsStatus;

  assigned_to: string;
  last_seen: string;

  latitude: number | null;
  longitude: number | null;
  gps_updated_at: string | null;

  geofence_enabled: boolean;
  geofence_latitude: number | null;
  geofence_longitude: number | null;
  geofence_radius_meters: number | null;

  notes: string;
}