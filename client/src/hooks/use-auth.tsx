import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  const {
    data: userData,
    isLoading,
    error,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) return undefined;
        throw new Error("Error fetching user data");
      }
      return await res.json();
    },
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (data: User) => {
      setUser(data);
      queryClient.setQueryData(["/api/me"], data);
      toast({
        title: "Inicio de sesión exitoso",
        description: "Has iniciado sesión correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Credenciales incorrectas",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (data: User) => {
      setUser(data);
      queryClient.setQueryData(["/api/me"], data);
      toast({
        title: "Registro exitoso",
        description: "Te has registrado correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al registrarse",
        description: error.message || "Ha ocurrido un error al registrarse",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout", {});
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(["/api/me"], null);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al cerrar sesión",
        description: error.message || "Ha ocurrido un error al cerrar sesión",
        variant: "destructive",
      });
    },
  });

  const login = async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  };

  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error: error as Error | null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}