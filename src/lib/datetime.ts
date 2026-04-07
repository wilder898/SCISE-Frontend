const COLOMBIA_TIME_ZONE = "America/Bogota";
const UTC_NAIVE_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

export function parseBackendDate(value: string | Date | undefined | null): Date | null {
  if (!value) {
    return null;
  }

  let normalizedValue = value;
  if (typeof normalizedValue === "string") {
    const trimmed = normalizedValue.trim();
    normalizedValue = UTC_NAIVE_TIMESTAMP_PATTERN.test(trimmed) ? `${trimmed}Z` : trimmed;
  }

  const parsed = normalizedValue instanceof Date ? normalizedValue : new Date(normalizedValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function formatDateTimeInBogota(value: string | Date | undefined | null): string {
  const parsed = parseBackendDate(value);
  if (!parsed) {
    return "Sin fecha";
  }

  return parsed.toLocaleString("es-CO", {
    timeZone: COLOMBIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatTimeInBogota(value: string | Date | undefined | null): string {
  const parsed = parseBackendDate(value);
  if (!parsed) {
    return "Sin hora";
  }

  return parsed.toLocaleTimeString("es-CO", {
    timeZone: COLOMBIA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatDateOnlyInBogota(value: string | Date | undefined | null): string {
  const parsed = parseBackendDate(value);
  if (!parsed) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: COLOMBIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(parsed);

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  if (!year || !month || !day) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

export function getBogotaTimeZone(): string {
  return COLOMBIA_TIME_ZONE;
}
