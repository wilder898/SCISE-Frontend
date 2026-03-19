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

export interface MovementStats {
  totalEquipos: number;
  enInstalacion: number;
  fueraInstalacion: number;
  movimientosHoy: number;
  insidePct: number;
  outsidePct: number;
}

export interface MovementRecord {
  id: string;
  tipo: MovementType;
  usuarioId: string;
  usuarioNombre: string;
  usuarioDocumento: string;
  usuarioRol: string;
  equipoId: string;
  equipoSerial: string;
  equipoTipo: string;
  equipoDescripcion: string;
  timestamp: string;
}

export interface ActiveEquipmentRecord {
  id: string;
  serial: string;
  tipo: string;
  descripcion: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioDocumento: string;
  usuarioRol: string;
  timestampIngreso: string;
  horaIngreso: string;
  tiempoEnCtma: string;
}

export const MOVEMENTS_STORAGE_KEY = "scise-movimientos";

function isMovementRecord(value: unknown): value is MovementRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    (record.tipo === "Ingreso" || record.tipo === "Salida") &&
    typeof record.usuarioId === "string" &&
    typeof record.usuarioNombre === "string" &&
    typeof record.usuarioDocumento === "string" &&
    typeof record.usuarioRol === "string" &&
    typeof record.equipoId === "string" &&
    typeof record.equipoSerial === "string" &&
    typeof record.equipoTipo === "string" &&
    typeof record.equipoDescripcion === "string" &&
    typeof record.timestamp === "string"
  );
}

export function listMovements(): MovementRecord[] {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const rawValue = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsed) ? parsed.filter(isMovementRecord) : [];
  } catch {
    return [];
  }
}

function saveMovements(movements: MovementRecord[]) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(movements));
}

export function appendMovement(
  movement: Omit<MovementRecord, "id" | "timestamp"> & { timestamp?: string }
) {
  const movements = listMovements();
  const record: MovementRecord = {
    ...movement,
    id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: movement.timestamp ?? new Date().toISOString(),
  };

  movements.push(record);
  saveMovements(movements);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("scise:movimientos-updated", {
        detail: record,
      })
    );
  }

  return record;
}

export function formatMovementTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimeElapsed(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
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

export function getActiveEquipmentsForUser(userId: string): ActiveEquipmentRecord[] {
  const latestByEquipment = new Map<string, MovementRecord>();

  listMovements()
    .filter((movement) => movement.usuarioId === userId)
    .sort(
      (left, right) =>
        new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()
    )
    .forEach((movement) => {
      latestByEquipment.set(movement.equipoId, movement);
    });

  return Array.from(latestByEquipment.values())
    .filter((movement) => movement.tipo === "Ingreso")
    .map((movement) => ({
      id: movement.equipoId,
      serial: movement.equipoSerial,
      tipo: movement.equipoTipo,
      descripcion: movement.equipoDescripcion,
      usuarioId: movement.usuarioId,
      usuarioNombre: movement.usuarioNombre,
      usuarioDocumento: movement.usuarioDocumento,
      usuarioRol: movement.usuarioRol,
      timestampIngreso: movement.timestamp,
      horaIngreso: formatMovementTime(movement.timestamp),
      tiempoEnCtma: formatTimeElapsed(movement.timestamp),
    }));
}

export function getActiveEquipmentIdsForUser(userId: string) {
  return new Set(getActiveEquipmentsForUser(userId).map((equipment) => equipment.id));
}

export function mapMovementToReportRow(
  movement: MovementRecord
): MovementReportRow {
  return {
    id: movement.id,
    tipo: movement.tipo,
    nombre: movement.usuarioNombre,
    documento: movement.usuarioDocumento,
    equipo: movement.equipoDescripcion,
    equipoId: movement.equipoId,
    serial: movement.equipoSerial,
    fechaHora: movement.timestamp,
    estado: "Completado",
  };
}

export function listReportMovements() {
  return listMovements()
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    )
    .map((movement) => mapMovementToReportRow(movement));
}

export function getCurrentEquipmentState(
  movements: MovementReportRow[] = listReportMovements()
) {
  const latestByEquipment = new Map<string, MovementReportRow>();

  movements.forEach((movement) => {
    const current = latestByEquipment.get(movement.equipoId);

    if (!current || new Date(movement.fechaHora) > new Date(current.fechaHora)) {
      latestByEquipment.set(movement.equipoId, movement);
    }
  });

  return Array.from(latestByEquipment.values());
}

export function getMovementStats(
  movements: MovementReportRow[] = listReportMovements()
): MovementStats {
  const latestMovements = getCurrentEquipmentState(movements);
  const totalEquipos = latestMovements.length;
  const enInstalacion = latestMovements.filter(
    (movement) => movement.tipo === "Ingreso"
  ).length;
  const fueraInstalacion = latestMovements.filter(
    (movement) => movement.tipo === "Salida"
  ).length;
  const today = new Date().toISOString().slice(0, 10);
  const movimientosHoy = movements.filter(
    (movement) => movement.fechaHora.slice(0, 10) === today
  ).length;

  return {
    totalEquipos,
    enInstalacion,
    fueraInstalacion,
    movimientosHoy,
    insidePct: totalEquipos ? Math.round((enInstalacion / totalEquipos) * 100) : 0,
    outsidePct: totalEquipos
      ? Math.round((fueraInstalacion / totalEquipos) * 100)
      : 0,
  };
}
