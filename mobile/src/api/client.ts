import { getStoredServerUrl } from "@/auth/session";

// 10.0.2.2 is the host machine as seen from the Android emulator (SPEC M-009).
export const DEFAULT_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3000/api/v1";

const REQUEST_TIMEOUT_MS = 15000;

/** An error the API returned in the shared shape from SPEC section 6. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string[]>,
    readonly resendAvailableInSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The request never reached the API, so there is no error body to read. */
export class NetworkError extends Error {
  constructor(message = "Could not reach the server. Check your connection or the server URL.") {
    super(message);
    this.name = "NetworkError";
  }
}

export async function resolveBaseUrl(): Promise<string> {
  // A URL saved on the device wins, so a reviewer can point the APK at their own machine.
  const stored = await getStoredServerUrl();
  return (stored ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT";
  body?: unknown;
  token?: string;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = await resolveBaseUrl();
  const controller = new AbortController();
  // Without this, a wrong server URL hangs on the TCP timeout instead of showing an error.
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new NetworkError();
  } finally {
    clearTimeout(timeout);
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw toApiError(response.status, payload);
  }

  return payload as T;
}

function toApiError(status: number, payload: unknown): ApiError {
  const error =
    payload && typeof payload === "object" && "error" in payload
      ? (payload as { error: Record<string, unknown> }).error
      : null;

  if (!error || typeof error.code !== "string" || typeof error.message !== "string") {
    return new ApiError(status, "INTERNAL_SERVER_ERROR", "An unexpected server error occurred.");
  }

  return new ApiError(
    status,
    error.code,
    error.message,
    error.fields as Record<string, string[]> | undefined,
    typeof error.resendAvailableInSeconds === "number"
      ? error.resendAvailableInSeconds
      : undefined,
  );
}

/** Message for a screen-level banner, whichever failure happened. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof NetworkError) return error.message;
  return "Something went wrong. Please try again.";
}
