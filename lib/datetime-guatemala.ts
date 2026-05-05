/**
 * Zona horaria del panel CMS. Más adelante puede volverse dinámica (p. ej. por proyecto),
 * como en personal finances; por ahora fija en Guatemala.
 */
export const DASHBOARD_TIME_ZONE = "America/Guatemala" as const;

const dateTimeOptions: Intl.DateTimeFormatOptions = {
  timeZone: DASHBOARD_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const dateOnlyOptions: Intl.DateTimeFormatOptions = {
  timeZone: DASHBOARD_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

function parseIso(iso?: string | null): Date | null {
  if (!iso?.trim()) {
    return null;
  }
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Fecha y hora en America/Guatemala (24 h). */
export function formatDateTimeGuatemala(iso?: string | null): string {
  const d = parseIso(iso);
  if (!d) {
    return "—";
  }
  return new Intl.DateTimeFormat("es-GT", dateTimeOptions).format(d);
}

/** Solo fecha civil en America/Guatemala (útil para inicios de evento o fechas de premio). */
export function formatDateGuatemala(iso?: string | null): string {
  const d = parseIso(iso);
  if (!d) {
    return "—";
  }
  return new Intl.DateTimeFormat("es-GT", dateOnlyOptions).format(d);
}
