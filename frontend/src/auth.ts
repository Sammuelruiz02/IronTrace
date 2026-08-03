export type AuthUser = {
    id: number;
    email: string;
    full_name: string;
    company_name: string;
    is_active: boolean;
  };
  
  export type LoginResponse = {
    access_token: string;
    token_type: string;
    user: AuthUser;
  };
  
  const TOKEN_KEY = "irontrace.access_token";
  const USER_KEY = "irontrace.user";
  
  export function saveAuthentication(response: LoginResponse) {
    window.localStorage.setItem(TOKEN_KEY, response.access_token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }
  
  export function getAccessToken(): string | null {
    return window.localStorage.getItem(TOKEN_KEY);
  }
  
  export function getAuthenticatedUser(): AuthUser | null {
    const savedUser = window.localStorage.getItem(USER_KEY);
  
    if (!savedUser) {
      return null;
    }
  
    try {
      return JSON.parse(savedUser) as AuthUser;
    } catch {
      clearAuthentication();
      return null;
    }
  }
  
  export function isAuthenticated(): boolean {
    return Boolean(getAccessToken());
  }
  
  export function clearAuthentication() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  }
  
  export function getAuthorizationHeaders(): HeadersInit {
    const token = getAccessToken();
  
    if (!token) {
      return {};
    }
  
    return {
      Authorization: `Bearer ${token}`,
    };
  }