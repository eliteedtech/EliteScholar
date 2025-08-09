import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";

export function useAuth() {
  const { user, token, logout } = useAuthStore();

  const { data: userData, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      if (!token) {
        return null;
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          return null;
        }
        throw new Error("Failed to fetch user data");
      }

      return response.json();
    },
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // If we have a token but failed to get user data, clear auth
  if (token && error && !isLoading) {
    logout();
  }

  return {
    user: userData || user,
    isLoading: token ? isLoading : false,
    isAuthenticated: !!(userData || user),
    logout,
  };
}
