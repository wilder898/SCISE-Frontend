export type MovementType = "Ingreso" | "Salida";

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

const STORAGE_KEY = "scise-movimientos";

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
    const rawValue = localStorage.getItem(STORAGE_KEY);
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

  localStorage.setItem(STORAGE_KEY, JSON.stringify(movements));
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
