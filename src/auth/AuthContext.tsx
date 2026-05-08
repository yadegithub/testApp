import { useEffect, useState, type ReactNode } from "react";
import {
  AuthContext,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
  type AuthMode,
} from "./auth-context";
import {
  createRegisteredAccount,
  findAccountByEmail,
} from "./accountStore";
import {
  isFirebaseAuthConfigured,
  loginWithFirebase,
  refreshFirebaseSession,
  registerWithFirebase,
  sendPasswordResetEmailWithFirebase,
  shouldRefreshSession,
  type FirebaseSession,
} from "./firebaseAuth";
import { ensureUserProgressProfile } from "../profile/userProgressStore";

const LOCAL_STORAGE_KEY = "arlearn.auth.local";
const SESSION_STORAGE_KEY = "arlearn.auth.session";
const LOCAL_MODE_NOTICE =
  "Real auth is not active yet. Add Firebase config to use the same account on every device.";

interface StoredAuthSession {
  expiresAt?: number;
  idToken?: string;
  provider: AuthMode;
  refreshToken?: string;
  rememberMe: boolean;
  user: AuthUser;
}

interface ReadStoredSessionResult {
  session: StoredAuthSession | null;
  storageKey: typeof LOCAL_STORAGE_KEY | typeof SESSION_STORAGE_KEY | null;
}

const getAuthMode = (): AuthMode =>
  isFirebaseAuthConfigured() ? "firebase" : "local";

const normalizeLegacySession = (
  value: unknown,
  rememberMe: boolean,
): StoredAuthSession | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Partial<StoredAuthSession> & Partial<AuthUser>;

  if (payload.user) {
    return {
      provider: payload.provider === "firebase" ? "firebase" : "local",
      rememberMe:
        typeof payload.rememberMe === "boolean" ? payload.rememberMe : rememberMe,
      user: payload.user,
      idToken: payload.idToken,
      refreshToken: payload.refreshToken,
      expiresAt: payload.expiresAt,
    };
  }

  if (
    typeof payload.email === "string" &&
    typeof payload.name === "string" &&
    typeof payload.role === "string"
  ) {
    return {
      provider: "local",
      rememberMe,
      user: {
        email: payload.email,
        name: payload.name,
        role: payload.role,
      },
    };
  }

  return null;
};

const readStoredSession = (): ReadStoredSessionResult => {
  if (typeof window === "undefined") {
    return {
      session: null,
      storageKey: null,
    };
  }

  const sources = [
    {
      key: LOCAL_STORAGE_KEY,
      rememberMe: true,
      rawValue: window.localStorage.getItem(LOCAL_STORAGE_KEY),
    },
    {
      key: SESSION_STORAGE_KEY,
      rememberMe: false,
      rawValue: window.sessionStorage.getItem(SESSION_STORAGE_KEY),
    },
  ] as const;

  for (const source of sources) {
    if (!source.rawValue) {
      continue;
    }

    try {
      const parsedValue = JSON.parse(source.rawValue) as unknown;
      const normalizedSession = normalizeLegacySession(
        parsedValue,
        source.rememberMe,
      );

      if (normalizedSession) {
        return {
          session: normalizedSession,
          storageKey: source.key,
        };
      }
    } catch {
      return {
        session: null,
        storageKey: null,
      };
    }
  }

  return {
    session: null,
    storageKey: null,
  };
};

const clearStoredSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
};

const persistSession = (
  session: StoredAuthSession,
  rememberMe: boolean,
): StoredAuthSession => {
  clearStoredSession();

  const nextSession: StoredAuthSession = {
    ...session,
    rememberMe,
  };
  const storage = rememberMe ? window.localStorage : window.sessionStorage;

  storage.setItem(
    rememberMe ? LOCAL_STORAGE_KEY : SESSION_STORAGE_KEY,
    JSON.stringify(nextSession),
  );

  return nextSession;
};

const toStoredFirebaseSession = (
  session: FirebaseSession,
  rememberMe: boolean,
): StoredAuthSession => ({
  provider: "firebase",
  rememberMe,
  user: session.user,
  idToken: session.idToken,
  refreshToken: session.refreshToken,
  expiresAt: session.expiresAt,
});

const toStoredLocalSession = (
  user: AuthUser,
  rememberMe: boolean,
): StoredAuthSession => ({
  provider: "local",
  rememberMe,
  user,
});

const bootstrapStoredSession = () => {
  const storedState = readStoredSession();
  const authMode = getAuthMode();
  const alignedSession =
    storedState.session?.provider === authMode ? storedState.session : null;
  const canRefreshFirebaseSession =
    alignedSession?.provider === "firebase" &&
    authMode === "firebase" &&
    Boolean(alignedSession.refreshToken) &&
    shouldRefreshSession(alignedSession.expiresAt);

  return {
    authMode,
    initialSession: canRefreshFirebaseSession ? null : alignedSession,
    initialStorageKey: alignedSession ? storedState.storageKey : null,
    needsRefresh: canRefreshFirebaseSession,
    staleSession: canRefreshFirebaseSession ? alignedSession : null,
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    authMode,
    initialSession,
    initialStorageKey,
    needsRefresh,
    staleSession,
  } = bootstrapStoredSession();
  const [session, setSession] = useState<StoredAuthSession | null>(initialSession);
  const [isReady, setIsReady] = useState(!needsRefresh);

  useEffect(() => {
    if (session?.user) {
      ensureUserProgressProfile(session.user);
    }
  }, [session]);

  useEffect(() => {
    if (!needsRefresh || !staleSession?.refreshToken) {
      return;
    }

    let isMounted = true;

    refreshFirebaseSession(staleSession.refreshToken)
      .then((refreshedSession) => {
        if (!isMounted) {
          return;
        }

        const rememberMe =
          staleSession.rememberMe ?? initialStorageKey === LOCAL_STORAGE_KEY;
        const nextStoredSession = persistSession(
          toStoredFirebaseSession(refreshedSession, rememberMe),
          rememberMe,
        );

        setSession(nextStoredSession);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        clearStoredSession();
        setSession(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initialStorageKey, needsRefresh, staleSession]);

  const login = async ({
    email,
    password,
    rememberMe,
  }: LoginPayload): Promise<AuthUser> => {
    if (authMode === "firebase") {
      const firebaseSession = await loginWithFirebase({
        email,
        password,
        rememberMe,
      });
      const nextSession = persistSession(
        toStoredFirebaseSession(firebaseSession, rememberMe),
        rememberMe,
      );

      setSession(nextSession);

      return nextSession.user;
    }

    const matchingAccount = findAccountByEmail(email);

    if (!matchingAccount || matchingAccount.password !== password) {
      throw new Error(`Invalid email or password. ${LOCAL_MODE_NOTICE}`);
    }

    const nextUser: AuthUser = {
      email: matchingAccount.email,
      name: matchingAccount.name,
      role: matchingAccount.role,
    };
    const nextSession = persistSession(
      toStoredLocalSession(nextUser, rememberMe),
      rememberMe,
    );

    setSession(nextSession);

    return nextUser;
  };

  const requestPasswordReset = async (email: string) => {
    if (authMode === "firebase") {
      await sendPasswordResetEmailWithFirebase(email);
      return;
    }

    throw new Error(LOCAL_MODE_NOTICE);
  };

  const register = async ({
    email,
    name,
    password,
    rememberMe,
  }: RegisterPayload): Promise<AuthUser> => {
    if (authMode === "firebase") {
      const firebaseSession = await registerWithFirebase({
        email,
        name: name.trim(),
        password,
        rememberMe,
      });
      const nextSession = persistSession(
        toStoredFirebaseSession(firebaseSession, rememberMe),
        rememberMe,
      );

      setSession(nextSession);

      return nextSession.user;
    }

    const nextUser = createRegisteredAccount({
      email,
      name: name.trim(),
      password,
      role: "New Learner",
    });
    const nextSession = persistSession(
      toStoredLocalSession(nextUser, rememberMe),
      rememberMe,
    );

    setSession(nextSession);

    return nextUser;
  };

  const logout = () => {
    clearStoredSession();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        authMode,
        authNotice: authMode === "local" ? LOCAL_MODE_NOTICE : "",
        isAuthenticated: Boolean(session?.user),
        isReady,
        login,
        requestPasswordReset,
        register,
        logout,
        user: session?.user ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
