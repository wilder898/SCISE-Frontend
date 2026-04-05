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

function toDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function formatMovementTime(timestamp: string): string {
  const parsed = toDate(timestamp);
  if (!parsed) {
    return "Sin hora";
  }

  return parsed.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatMovementDateTime(timestamp: string): string {
  const parsed = toDate(timestamp);
  if (!parsed) {
    return "Sin fecha";
  }

  return parsed.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatTimeElapsed(timestamp: string): string {
  const parsed = toDate(timestamp);
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
