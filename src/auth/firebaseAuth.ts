import type { AuthUser, LoginPayload, RegisterPayload } from "./auth-context";

const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY?.trim() ?? "";
const FIREBASE_ROLE = "Student";
const TOKEN_REFRESH_BUFFER_MS = 60_000;

interface FirebaseAuthResponse {
  email?: string;
  expiresIn?: string;
  idToken?: string;
  localId?: string;
  refreshToken?: string;
}

interface FirebaseLookupResponse {
  users?: Array<{
    displayName?: string;
    email?: string;
  }>;
}

interface FirebaseRefreshResponse {
  expires_in?: string;
  id_token?: string;
  refresh_token?: string;
}

interface FirebaseErrorResponse {
  error?: {
    message?: string;
  };
}

export interface FirebaseSession {
  user: AuthUser;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

const getFirebaseEndpoint = (path: string) =>
  `https://identitytoolkit.googleapis.com/v1/${path}?key=${FIREBASE_API_KEY}`;

const buildSession = (
  response: FirebaseAuthResponse,
  nameOverride?: string,
): FirebaseSession => {
  if (
    !response.email ||
    !response.idToken ||
    !response.refreshToken ||
    !response.expiresIn
  ) {
    throw new Error("Firebase authentication returned an incomplete session.");
  }

  return {
    user: {
      email: response.email,
      name: nameOverride?.trim() || response.email.split("@")[0] || "Learner",
      role: FIREBASE_ROLE,
    },
    idToken: response.idToken,
    refreshToken: response.refreshToken,
    expiresAt: Date.now() + Number(response.expiresIn) * 1000,
  };
};

const mapFirebaseError = (errorCode: string | undefined) => {
  switch (errorCode) {
    case "EMAIL_EXISTS":
      return "This email is already registered.";
    case "EMAIL_NOT_FOUND":
    case "INVALID_PASSWORD":
    case "INVALID_LOGIN_CREDENTIALS":
      return "Invalid email or password.";
    case "USER_DISABLED":
      return "This account has been disabled.";
    case "WEAK_PASSWORD : Password should be at least 6 characters":
    case "WEAK_PASSWORD":
      return "Password must be at least 6 characters.";
    case "OPERATION_NOT_ALLOWED":
      return "Email/password sign-in is not enabled in Firebase yet.";
    case "API_KEY_INVALID":
      return "Firebase API key is invalid.";
    case "MISSING_EMAIL":
      return "Enter your email address first.";
    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return "Too many attempts. Please try again later.";
    default:
      return "Authentication failed. Please try again.";
  }
};

const mapPasswordResetError = (errorCode: string | undefined) => {
  switch (errorCode) {
    case "EMAIL_NOT_FOUND":
      return "No account was found for this email.";
    case "MISSING_EMAIL":
      return "Enter your email address first.";
    default:
      return mapFirebaseError(errorCode);
  }
};

const parseFirebaseResponse = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json()) as T & FirebaseErrorResponse;

  if (!response.ok) {
    throw new Error(mapFirebaseError(payload.error?.message));
  }

  return payload;
};

const fetchFirebase = async <T>(
  path: string,
  payload: Record<string, string | boolean>,
) => {
  if (!FIREBASE_API_KEY) {
    throw new Error(
      "Firebase auth is not configured yet. Add VITE_FIREBASE_API_KEY to use real auth.",
    );
  }

  const response = await fetch(getFirebaseEndpoint(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseFirebaseResponse<T>(response);
};

const updateDisplayName = async (idToken: string, displayName: string) =>
  fetchFirebase<FirebaseAuthResponse>("accounts:update", {
    displayName,
    idToken,
    returnSecureToken: true,
  });

const lookupProfile = async (idToken: string) =>
  fetchFirebase<FirebaseLookupResponse>("accounts:lookup", {
    idToken,
  });

export const isFirebaseAuthConfigured = () => Boolean(FIREBASE_API_KEY);

export const shouldRefreshSession = (expiresAt?: number) =>
  typeof expiresAt === "number" &&
  expiresAt <= Date.now() + TOKEN_REFRESH_BUFFER_MS;

export const loginWithFirebase = async ({
  email,
  password,
}: LoginPayload): Promise<FirebaseSession> => {
  const response = await fetchFirebase<FirebaseAuthResponse>(
    "accounts:signInWithPassword",
    {
      email: email.trim(),
      password,
      returnSecureToken: true,
    },
  );

  const profile = await lookupProfile(response.idToken ?? "");
  const profileName = profile.users?.[0]?.displayName;

  return buildSession(response, profileName);
};

export const sendPasswordResetEmailWithFirebase = async (email: string) => {
  if (!FIREBASE_API_KEY) {
    throw new Error(
      "Firebase auth is not configured yet. Add VITE_FIREBASE_API_KEY to use real auth.",
    );
  }

  const response = await fetch(getFirebaseEndpoint("accounts:sendOobCode"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim(),
      requestType: "PASSWORD_RESET",
    }),
  });

  const payload = (await response.json()) as FirebaseErrorResponse;

  if (!response.ok) {
    throw new Error(mapPasswordResetError(payload.error?.message));
  }
};

export const registerWithFirebase = async ({
  email,
  name,
  password,
}: RegisterPayload): Promise<FirebaseSession> => {
  const signUpResponse = await fetchFirebase<FirebaseAuthResponse>(
    "accounts:signUp",
    {
      email: email.trim(),
      password,
      returnSecureToken: true,
    },
  );

  const profileResponse = await updateDisplayName(
    signUpResponse.idToken ?? "",
    name.trim(),
  );

  return buildSession(
    {
      ...signUpResponse,
      ...profileResponse,
      email: profileResponse.email ?? signUpResponse.email,
    },
    name,
  );
};

export const refreshFirebaseSession = async (
  refreshToken: string,
): Promise<FirebaseSession> => {
  if (!FIREBASE_API_KEY) {
    throw new Error("Firebase auth is not configured yet.");
  }

  const response = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    },
  );

  const payload = (await response.json()) as
    | FirebaseRefreshResponse
    | FirebaseErrorResponse;
  const refreshError =
    "error" in payload ? payload.error?.message : undefined;

  if (!response.ok || !("id_token" in payload) || !payload.id_token) {
    throw new Error(mapFirebaseError(refreshError));
  }

  const profile = await lookupProfile(payload.id_token);
  const profileUser = profile.users?.[0];

  if (!profileUser?.email) {
    throw new Error("Unable to restore your Firebase session.");
  }

  return {
    user: {
      email: profileUser.email,
      name:
        profileUser.displayName?.trim() ||
        profileUser.email.split("@")[0] ||
        "Learner",
      role: FIREBASE_ROLE,
    },
    idToken: payload.id_token,
    refreshToken: payload.refresh_token ?? refreshToken,
    expiresAt: Date.now() + Number(payload.expires_in ?? "0") * 1000,
  };
};
