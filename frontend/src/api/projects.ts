import {
    getAuthorizationHeaders,
  } from "../auth";
  
  import type {
    Project,
    ProjectFormValues,
  } from "../types/project";
  
  
  const API_BASE_URL =
    import.meta.env.VITE_API_URL;
  
  
  function getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      ...getAuthorizationHeaders(),
    };
  }
  
  
  async function getErrorMessage(
    response: Response,
    fallback: string
  ): Promise<string> {
    try {
      const data = await response.json();
  
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
  
  
  export async function getProjects():
    Promise<Project[]> {
    const response = await fetch(
      `${API_BASE_URL}/projects/`,
      {
        headers: getHeaders(),
      }
    );
  
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          "Unable to load projects."
        )
      );
    }
  
    return response.json();
  }
  
  
  export async function createProject(
    values: ProjectFormValues
  ): Promise<Project> {
    const response = await fetch(
      `${API_BASE_URL}/projects/`,
      {
        method: "POST",
  
        headers: getHeaders(),
  
        body: JSON.stringify({
          name: values.name.trim(),
  
          code:
            values.code.trim() || null,
  
          address:
            values.address.trim() || null,
  
          status:
            values.status.trim() ||
            "Active",
  
          notes: values.notes.trim(),
        }),
      }
    );
  
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          "Unable to create project."
        )
      );
    }
  
    return response.json();
  }
  
  
  export async function updateProject(
    projectId: number,
    values: ProjectFormValues
  ): Promise<Project> {
    const response = await fetch(
      `${API_BASE_URL}/projects/${projectId}`,
      {
        method: "PUT",
  
        headers: getHeaders(),
  
        body: JSON.stringify({
          name: values.name.trim(),
  
          code:
            values.code.trim() || null,
  
          address:
            values.address.trim() || null,
  
          status:
            values.status.trim() ||
            "Active",
  
          notes: values.notes.trim(),
        }),
      }
    );
  
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          "Unable to update project."
        )
      );
    }
  
    return response.json();
  }
  
  
  export async function deleteProject(
    projectId: number
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/projects/${projectId}`,
      {
        method: "DELETE",
        headers: getAuthorizationHeaders(),
      }
    );
  
    if (
      !response.ok &&
      response.status !== 204
    ) {
      throw new Error(
        await getErrorMessage(
          response,
          "Unable to delete project."
        )
      );
    }
  }