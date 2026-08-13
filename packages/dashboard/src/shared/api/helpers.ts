import {
  BaseQueryFn,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "src/app/store/store";
import i18n from "src/locales/i18n";
import { DEFAULT_SYSTEM_LANGUAGE } from "src/shared/utils/locales";
import { IResponseListItems } from "./types";
import { getAccessToken, logout } from "src/shared/utils/auth";
import { getTokenByRefreshToken } from "src/packages/authWidget/helpers/auth";
import {APP_PUBLIC_URL} from "src/shared/utils/appBasePath";

type TResponseMeta = {
  response?: {
    headers?: {
      get: (name: string) => string | null;
    };
  };
};

/**
 * Transforms the response into a format containing pagination information and data for list display.
 * @template T - The type of data for the list of received objects.
 * @param response - The response containing data for list display.
 * @param meta - Metadata, response headers.
 */
export const parseResponse = <T>(
  response: T,
  meta?: TResponseMeta
): IResponseListItems<T> => {
  const totalCount = parseInt(
    meta?.response?.headers?.get("X-Total-Count") || "0",
    10
  );
  const perPage = parseInt(
    meta?.response?.headers?.get("x-per-page") || "0",
    10
  );
  const currentOffset = parseInt(
    meta?.response?.headers?.get("x-current-offset") || "0",
    10
  );
  const nextOffset = parseInt(
    meta?.response?.headers?.get("x-next-offset") || "0",
    10
  );

  return {
    items: response,
    totalCount,
    perPage,
    currentOffset,
    nextOffset,
  };
};

/**
 * Creates a request object for making an HTTP request to the API.
 * @template T - The type of query parameters for the request.
 * @param endPoint - The API endpoint to which the request will be sent.
 * @param method - The HTTP method of the request ('GET', 'POST', 'DELETE').
 * @param query - The query parameters to be added.
 */
export const createFetchArgs = <T>(
  endPoint: string,
  method: string,
  query?: T
) => {
  return {
    url: `${endPoint}`,
    method,
    headers: {
      "Content-Type": "application/json",
    },
    params: query,
  };
};

/**
 * Creates a request object for making an HTTP request to the API with a request body.
 * @template T - The type of parameters for the request body.
 * @param endPoint - The API endpoint to which the request will be sent.
 * @param method - The HTTP method of the request ('GET', 'POST', 'DELETE').
 * @param body - The parameters to be added to the request body.
 */
export const createFetchArgsWithBody = <T>(
  endPoint: string,
  method: string,
  body: T
) => {
  return {
    url: `${endPoint}`,
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body,
  };
};

/**
 * Creates a base query for making HTTP requests to the API with authorization header added.
 * @param point - The API endpoint to which the request will be sent.
 */

let refreshPromise: Promise<string | null> | null = null;
let isRefreshing = false;
const requestQueue: (() => void)[] = [];

const waitForRefresh = () =>
  new Promise<void>((resolve) => {
    requestQueue.push(resolve);
  });

const notifyQueue = () => {
  while (requestQueue.length > 0) {
    const resolve = requestQueue.shift();
    resolve?.();
  }
};

const getRequestLocale = () => {
  const currentLocale = i18n.resolvedLanguage || i18n.language;

  if (typeof currentLocale === "string" && currentLocale.trim().length > 0) {
    return currentLocale;
  }

  return DEFAULT_SYSTEM_LANGUAGE;
};

export const createBaseQuery = (point?: string) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: `${APP_PUBLIC_URL}/api/v1/${point ?? ""}`,
    prepareHeaders: async (headers) => {
      headers.set("x-lang", getRequestLocale());

      const token = await getAccessToken();
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  });

  const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
  > = async (args, api, extraOptions) => {
    // If refresh is currently running, wait for it to complete before sending anything
    if (isRefreshing) {
      await waitForRefresh();
    }

    let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
      // Start refresh if no one is doing it right now
      if (!isRefreshing) {
        isRefreshing = true;

        refreshPromise = (async () => {
          try {
            const state = api.getState() as RootState;
            const systemClientId = state.app.systemClientId;

            if (!systemClientId) {
              throw new Error("System client ID is not initialized");
            }

            const { access_token, expires_in } = await getTokenByRefreshToken(
              systemClientId,
              APP_PUBLIC_URL
            );

            if (access_token) {
              localStorage.setItem("accessToken", access_token);
              if (expires_in) {
                const expiresAt = Date.now() + expires_in * 1000;
                localStorage.setItem("expiresIn", expiresAt.toString());
              }

              return access_token;
            }

            throw new Error("No token");
          } catch {
            api.dispatch(logout());
            return null;
          } finally {
            isRefreshing = false;
            notifyQueue(); // notify all who were waiting for refresh
          }
        })();
      }

      const newToken = await refreshPromise;

      if (newToken) {
        // Retry the request with the new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // refresh failed → logout already called
        return { error: { status: 401, data: "Authentication failed" } };
      }
    }

    return result;
  };

  return baseQueryWithReauth;
};
