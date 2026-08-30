import type {
    UserRole,
  } from "../auth";
  
  
  export type TeamMember = {
    id: number;
    email: string;
    full_name: string;
    company_name: string;
    organization_id: number | null;
    role: UserRole;
    is_active: boolean;
  };
  
  
  export type CreateTeamMemberPayload = {
    email: string;
    full_name: string;
    password: string;
    role: UserRole;
  };
  
  
  export type RoleUpdatePayload = {
    role: UserRole;
  };