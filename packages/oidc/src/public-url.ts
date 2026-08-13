const PUBLIC_IMAGES_PATH = "public/images/";
const HTTP_URL_PATTERN = /^https?:\/\//i;

export function resolvePublicImageUrl(
  value: string | null | undefined,
  publicDomain: string,
): string | undefined {
  if (!value) return undefined;

  const normalizedValue = value.trim();
  if (!normalizedValue) return undefined;

  const normalizedDomain = publicDomain.replace(/\/+$/, "");
  const publicImagesIndex = normalizedValue.indexOf(PUBLIC_IMAGES_PATH);

  // Uploaded images belong to ID even when the database still contains an
  // absolute URL from an earlier domain or from a root-path deployment.
  if (publicImagesIndex >= 0) {
    return `${normalizedDomain}/${normalizedValue.slice(publicImagesIndex)}`;
  }

  if (HTTP_URL_PATTERN.test(normalizedValue)) {
    return normalizedValue;
  }

  return `${normalizedDomain}/${normalizedValue.replace(/^\/+/, "")}`;
}
