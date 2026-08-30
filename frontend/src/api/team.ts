import {
    getAuthorizationHeaders,
  } from "../auth";
  
  import type {
    UserRole,
  } from "../auth";
  
  import type {
    TeamMember,
  } from "../types/team";
  
  
  const API_BASE_URL =
    import.meta.env.VITE_API_URL;
  
  
  async function getErrorMessage(
    response: Response,
    fallback: string
  ) {
    try {
      const data =
        await response.json();
  
      if (
        data &&
        typeof data.detail ===
          "string"
      ) {
        return data.detail;
      }
    } catch {
      // Use fallback.
    }
  
    return fallback;
  }
  
  
  export async function getTeam():
    Promise<TeamMember[]> {
    const response = await fetch(
      `${API_BASE_URL}/auth/team`,
      {
        headers: {
          ...getAuthorizationHeaders(),
        },
      }
    );
  
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          "Unable to load organization team."
        )
      );
    }
  
    return response.json();
  }
  
  
  export async function updateTeamMemberRole(
    userId: number,
    role: UserRole
  ): Promise<TeamMember> {
    const response = await fetch(
      `${API_BASE_URL}/auth/team/${userId}/role`,
      {
        method: "PATCH",
  
        headers: {
          "Content-Type":
            "application/json",
  
          ...getAuthorizationHeaders(),
        },
  
        body: JSON.stringify({
          role,
        }),
      }
    );
  
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          "Unable to update team member role."
        )
      );
    }
  
    return response.json();
  }