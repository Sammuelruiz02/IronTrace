export type TrackerDevice = {
    id: number;
    organization_id: number;
  
    asset_id: number | null;
  
    device_name: string;
    serial_number: string;
  
    provider: string;
    provider_device_id: string | null;
  
    imei: string | null;
    sim_iccid: string | null;
  
    status: string;
  
    last_communication_at: string | null;
    assigned_at: string | null;
  
    notes: string;
  
    created_at: string;
  };
  
  export type DeviceFormValues = {
    device_name: string;
    serial_number: string;
  
    provider: string;
    provider_device_id: string;
  
    imei: string;
    sim_iccid: string;
  
    status: string;
    notes: string;
  };
  
  export type DeviceAsset = {
    id: number;
    asset_number: string;
    asset_name: string;
    project: string;
    status: string;
  };