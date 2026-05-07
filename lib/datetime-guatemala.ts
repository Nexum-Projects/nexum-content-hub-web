import { TZDate } from "@date-fns/tz";

/**
 * Zona horaria del panel CMS. Más adelante puede volverse dinámica (p. ej. por proyecto),
 * como en personal finances; por ahora fija en Guatemala.
 */
export const DASHBOARD_TIME_ZONE = "America/Guatemala" as const;

function pad2(n: number): string {
  return String(Math.floor(n)).padStart(2, "0");
}

/**
 * Interpreta el texto del formulario como fecha/hora civil en {@link DASHBOARD_TIME_ZONE}
 * y devuelve ISO UTC (`...Z`) para enviar al API.
 *
 * Formatos soportados: `YYYY-MM-DD` (medianoche local), `YYYY-MM-DDTHH:mm`, con segundos opcionales.
 * Si el valor ya incluye `Z` u offset (`±hh:mm`), se normaliza con `Date` → `toISOString()`.
 */
export function guatemalaLocalInputToUtcIso(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) {
    return undefined;
  }

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(v)) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(v);
  if (!match) {
    return undefined;
  }

  const y = Number(match[1]);
  const mo = Number(match[2]);
  const day = Number(match[3]);
  const hh = match[4] !== undefined ? Number(match[4]) : 0;
  const mm = match[5] !== undefined ? Number(match[5]) : 0;
  const ss = match[6] !== undefined ? Number(match[6]) : 0;

  const z = new TZDate(y, mo - 1, day, hh, mm, ss, 0, DASHBOARD_TIME_ZONE);
  return z.toISOString();
}

/** Instant UTC en milisegundos; útil para validar orden inicio/fin en formularios. */
export function guatemalaLocalInputToUtcMs(raw: string): number | null {
  const iso = guatemalaLocalInputToUtcIso(raw);
  if (!iso) {
    return null;
  }
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

/** Convierte ISO UTC del API al fragmento `YYYY-MM-DDTHH:mm` en hora Guatemala (inputs del panel). */
export function utcIsoToGuatemalaLocalForm(iso?: string | null): string {
  const d = parseIso(iso);
  if (!d) {
    return "";
  }

  const z = new TZDate(d, DASHBOARD_TIME_ZONE);
  return `${pad2(z.getFullYear())}-${pad2(z.getMonth() + 1)}-${pad2(z.getDate())}T${pad2(z.getHours())}:${pad2(z.getMinutes())}`;
}

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
