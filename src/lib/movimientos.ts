import { formatDateTimeInBogota, formatTimeInBogota, parseBackendDate } from "./datetime";

export type MovementType = "Ingreso" | "Salida";

export interface MovementReportRow {
  id: string;
  tipo: MovementType;
  nombre: string;
  documento: string;
  equipo: string;
  equipoId: string;
  serial: string;
  fechaHora: string;
  estado: string;
}

export function formatMovementTime(timestamp: string): string {
  return formatTimeInBogota(timestamp);
}

export function formatMovementDateTime(timestamp: string): string {
  return formatDateTimeInBogota(timestamp);
}

export function formatTimeElapsed(timestamp: string): string {
  const parsed = parseBackendDate(timestamp);
  if (!parsed) {
    return "Sin registro";
  }

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours < 24) {
    return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours ? `${days} d ${remainingHours} h` : `${days} d`;
}
