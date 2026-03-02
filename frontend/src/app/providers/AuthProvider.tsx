import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearStoredSession,
  fetchCurrentUser,
  loadStoredSession,
  loginWithPassword,
  registerWithPassword,
  saveStoredSession,
  type AuthSession,
  type AuthUser,
} from "@/lib/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  displayName: string;
}

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const session = loadStoredSession();
    if (!session) {
      setStatus("unauthenticated");
      return;
    }

    setUser(session.user);
    setAccessToken(session.accessToken);

    void restoreSession(session.accessToken);
  }, []);

  async function restoreSession(token: string) {
    try {
      const currentUser = await fetchCurrentUser(token);
      setUser(currentUser);
      setAccessToken(token);
      saveStoredSession({
        access_token: token,
        token_type: "bearer",
        user: currentUser,
      });
      setStatus("authenticated");
    } catch {
      clearStoredSession();
      setUser(null);
      setAccessToken(null);
      setStatus("unauthenticated");
    }
  }

  async function applyAuthSession(authSession: AuthSession) {
    saveStoredSession(authSession);
    setUser(authSession.user);
    setAccessToken(authSession.access_token);
    setStatus("authenticated");
  }

  async function login(input: LoginInput) {
    const session = await loginWithPassword({
      email: input.email,
      password: input.password,
    });
    await applyAuthSession(session);
  }

  async function register(input: RegisterInput) {
    const session = await registerWithPassword({
      display_name: input.displayName,
      email: input.email,
      password: input.password,
    });
    await applyAuthSession(session);
  }

  async function refreshUser() {
    if (!accessToken) {
      return;
    }

    const currentUser = await fetchCurrentUser(accessToken);
    saveStoredSession({
      access_token: accessToken,
      token_type: "bearer",
      user: currentUser,
    });
    setUser(currentUser);
    setStatus("authenticated");
  }

  function logout() {
    clearStoredSession();
    setUser(null);
    setAccessToken(null);
    setStatus("unauthenticated");
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      accessToken,
      login,
      register,
      logout,
      refreshUser,
    }),
    [accessToken, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}