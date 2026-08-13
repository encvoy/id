const runtimeModulePath = new URL(import.meta.url).pathname;

const resolveBasePath = () => {
  const markerIndex = Math.max(
    ...["/assets/", "/src/"].map((marker) =>
      runtimeModulePath.lastIndexOf(marker)
    )
  );

  return markerIndex >= 0 ? runtimeModulePath.slice(0, markerIndex) : "";
};

export const APP_BASE_PATH = resolveBasePath().replace(/\/+$/, "");
export const APP_PUBLIC_URL = `${window.location.origin}${APP_BASE_PATH}`;

export const withAppBase = (path: string) =>
  `${APP_BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;

export const withAppPublicUrl = (path: string) =>
  `${APP_PUBLIC_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const withAppPublicUrlAtPort = (port: string | number, path = "") => {
  const url = new URL(APP_PUBLIC_URL);
  url.port = String(port);
  url.pathname = `${APP_BASE_PATH}${
    path ? (path.startsWith("/") ? path : `/${path}`) : ""
  }`;
  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
};
