export type Notification = {
    id: number;
    organization_id: number;
  
    asset_id: number | null;
    device_id: number | null;
    geofence_event_id: number | null;
  
    notification_type: string;
    severity: string;
  
    title: string;
    message: string;
  
    is_read: boolean;
    read_at: string | null;
    read_by_user_id: number | null;
  
    is_resolved: boolean;
    resolved_at: string | null;
    resolved_by_user_id: number | null;
  
    created_at: string;
  };
  
  export type NotificationUnreadCount = {
    unread_count: number;
  };