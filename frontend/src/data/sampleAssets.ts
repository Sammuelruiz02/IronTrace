import type { Asset } from "../types/asset";

export const sampleAssets: Asset[] = [
  {
    id: 1001,

    assetNumber: "1001",
    assetName: "Forklift 02",
    category: "Material Handling",
    project: "Disney Project",
    projectId: null,

    status: "Online",
    gpsStatus: "Live",

    assignedTo: "Jose Martinez",
    lastSeen: "Live now",

    latitude: 28.2927,
    longitude: -81.4084,
    gpsUpdatedAt: new Date().toISOString(),

    hasTrackerKey: true,
    trackerKeyCreatedAt: new Date().toISOString(),

    geofenceEnabled: true,
    geofenceLatitude: 28.2927,
    geofenceLongitude: -81.4084,
    geofenceRadiusMeters: 500,

    notes: "Assigned to the loading and staging team.",
    createdAt: new Date().toISOString(),
  },
  {
    id: 1002,

    assetNumber: "1002",
    assetName: "Generator 04",
    category: "Power Equipment",
    project: "Airport Project",
    projectId: null,

    status: "Offline",
    gpsStatus: "Offline",

    assignedTo: "Unassigned",
    lastSeen: "3 hours ago",

    latitude: null,
    longitude: null,
    gpsUpdatedAt: null,

    hasTrackerKey: true,
    trackerKeyCreatedAt: new Date().toISOString(),

    geofenceEnabled: false,
    geofenceLatitude: null,
    geofenceLongitude: null,
    geofenceRadiusMeters: null,

    notes: "GPS device requires a battery check.",
    createdAt: new Date().toISOString(),
  },
  {
    id: 1003,

    assetNumber: "1003",
    assetName: "Scissor Lift 07",
    category: "Aerial Equipment",
    project: "Universal Project",
    projectId: null,

    status: "Online",
    gpsStatus: "Live",

    assignedTo: "Miguel Rivera",
    lastSeen: "2 minutes ago",

    latitude: 28.2919,
    longitude: -81.4075,
    gpsUpdatedAt: new Date().toISOString(),

    hasTrackerKey: true,
    trackerKeyCreatedAt: new Date().toISOString(),

    geofenceEnabled: true,
    geofenceLatitude: 28.2919,
    geofenceLongitude: -81.4075,
    geofenceRadiusMeters: 300,

    notes: "Currently operating on Level 3.",
    createdAt: new Date().toISOString(),
  },
  {
    id: 1004,

    assetNumber: "1004",
    assetName: "Enclosed Trailer 03",
    category: "Trailer",
    project: "Disney Project",
    projectId: null,

    status: "Maintenance",
    gpsStatus: "Live",

    assignedTo: "Warehouse Team",
    lastSeen: "12 minutes ago",

    latitude: 28.294,
    longitude: -81.41,
    gpsUpdatedAt: new Date().toISOString(),

    hasTrackerKey: false,
    trackerKeyCreatedAt: null,

    geofenceEnabled: false,
    geofenceLatitude: null,
    geofenceLongitude: null,
    geofenceRadiusMeters: null,

    notes: "Scheduled for tire inspection this week.",
    createdAt: new Date().toISOString(),
  },
];
