export type AssetStatus = "Online" | "Offline" | "Maintenance";
export type GpsStatus = "Live" | "Offline" | "Unassigned";

export type Asset = {
  assetNumber: string;
  assetName: string;
  category: string;
  project: string;
  status: AssetStatus;
  gpsStatus: GpsStatus;
  assignedTo: string;
  lastSeen: string;
  notes: string;
};

export type AssetFormValues = Omit<Asset, "lastSeen"> & {
  lastSeen?: string;
};
