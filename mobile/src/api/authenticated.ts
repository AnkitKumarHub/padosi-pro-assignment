import { getToken } from "@/auth/session";
import { ApiError, request } from "./client";

type AuthedOptions = {
  method?: "GET" | "POST" | "PUT";
  body?: unknown;
};

export async function authedRequest<T>(path: string, options: AuthedOptions = {}): Promise<T> {
  const token = await getToken();
  if (!token) {
    throw new ApiError(401, "UNAUTHORIZED", "Your session has expired. Please log in again.");
  }
  return request<T>(path, { ...options, token });
}
