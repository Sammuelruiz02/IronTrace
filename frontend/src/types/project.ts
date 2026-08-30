export type ProjectStatus =
  | "Active"
  | "Inactive"
  | "Completed";

export type Project = {
  id: number;
  organization_id: number;

  name: string;
  code: string | null;
  address: string | null;

  status: string;
  notes: string;

  created_at: string;
};

export type ProjectFormValues = {
  name: string;
  code: string;
  address: string;
  status: string;
  notes: string;
};

export type ProjectAsset = {
  id: number;

  asset_number: string;
  asset_name: string;

  category: string;
  status: string;

  project: string;
  project_id: number | null;

  gps_status: string;
  assigned_to: string;
};