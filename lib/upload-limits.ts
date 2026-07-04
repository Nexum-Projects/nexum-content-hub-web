/** Vercel limita el body de server actions (~4.5 MB). Dejamos margen para FormData. */
export const MAX_SERVER_ACTION_IMAGE_BYTES = 4 * 1024 * 1024;

export const MAX_SERVER_ACTION_IMAGE_LABEL = "4MB";

export function formatBytes(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export function validateImageFile(
  file: File,
  options: {
    maxBytes?: number;
    maxBytesLabel?: string;
    accept?: string;
  } = {},
): string | undefined {
  const acceptList = (options.accept ?? "image/jpeg,image/png,image/webp")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedByExt = ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp";
  const allowedByType = acceptList.includes(file.type);

  if (!allowedByExt && !allowedByType) {
    return "La imagen debe ser JPG, PNG o WEBP.";
  }

  if (options.maxBytes && file.size > options.maxBytes) {
    const limitLabel = options.maxBytesLabel ?? formatBytes(options.maxBytes);
    return `La imagen pesa ${formatBytes(file.size)}. El maximo permitido es ${limitLabel}.`;
  }

  return undefined;
}

export function describeServerActionClientError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Intenta nuevamente en unos segundos.";
  }

  const message = error.message.trim();

  if (message.includes("An unexpected response was received from the server")) {
    return `La peticion no llego al servidor (limite ~${MAX_SERVER_ACTION_IMAGE_LABEL} con imagen en produccion). Usa una imagen mas ligera o crea la ubicacion sin imagen.`;
  }

  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return "No hubo conexion con el servidor. Revisa tu red e intenta de nuevo.";
  }

  return message || "Intenta nuevamente en unos segundos.";
}
