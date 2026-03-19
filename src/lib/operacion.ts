export interface OperationalUser {
  id: string;
  nombre: string;
  documento: string;
  rol: string;
}

export interface EquipmentCatalogItem {
  id: string;
  usuarioId: string;
  serial: string;
  tipo: string;
  descripcion: string;
}

export const OPERATIONAL_USERS_STORAGE_KEY = "scise-operacion-usuarios";
const EQUIPMENT_STORAGE_KEY = "scise-operacion-equipos";

const initialUsers: OperationalUser[] = [
  {
    id: "usr-001",
    nombre: "Juan Perez Garcia",
    documento: "1234567890",
    rol: "Aprendiz",
  },
  {
    id: "usr-002",
    nombre: "Maria Lopez Torres",
    documento: "9876543210",
    rol: "Instructor",
  },
  {
    id: "usr-003",
    nombre: "Carlos Rodriguez Martinez",
    documento: "5555555555",
    rol: "Coordinador",
  },
];

const initialEquipments: EquipmentCatalogItem[] = [
  {
    id: "equipo-001",
    usuarioId: "usr-001",
    serial: "LAP-2024-0012345",
    tipo: "Portatil",
    descripcion: "Lenovo ThinkPad E15",
  },
  {
    id: "equipo-002",
    usuarioId: "usr-001",
    serial: "MON-2024-0054321",
    tipo: "Monitor",
    descripcion: 'Dell UltraSharp 27"',
  },
  {
    id: "equipo-003",
    usuarioId: "usr-002",
    serial: "LAP-2024-0067890",
    tipo: "Portatil",
    descripcion: "HP ProBook 450 G9",
  },
  {
    id: "equipo-004",
    usuarioId: "usr-003",
    serial: "LAP-2024-0011111",
    tipo: "Portatil",
    descripcion: "HP EliteBook 840 G8",
  },
  {
    id: "equipo-005",
    usuarioId: "usr-003",
    serial: "MON-2024-0022222",
    tipo: "Monitor",
    descripcion: "LG 24UP550",
  },
  {
    id: "equipo-006",
    usuarioId: "usr-003",
    serial: "KEY-2024-0033333",
    tipo: "Teclado",
    descripcion: "Logitech MX Keys",
  },
];

function isOperationalUser(value: unknown): value is OperationalUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Record<string, unknown>;
  return (
    typeof user.id === "string" &&
    typeof user.nombre === "string" &&
    typeof user.documento === "string" &&
    typeof user.rol === "string"
  );
}

function isEquipmentCatalogItem(value: unknown): value is EquipmentCatalogItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const equipment = value as Record<string, unknown>;
  return (
    typeof equipment.id === "string" &&
    typeof equipment.usuarioId === "string" &&
    typeof equipment.serial === "string" &&
    typeof equipment.tipo === "string" &&
    typeof equipment.descripcion === "string"
  );
}

function cloneUsers(users: OperationalUser[]) {
  return users.map((user) => ({ ...user }));
}

function cloneEquipments(equipments: EquipmentCatalogItem[]) {
  return equipments.map((equipment) => ({ ...equipment }));
}

function saveOperationalUsers(users: OperationalUser[]) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(OPERATIONAL_USERS_STORAGE_KEY, JSON.stringify(users));
}

function dispatchOperationalUsersUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("scise:operacion-usuarios-updated"));
}

function cloneSeededItem<T extends object>(item: T): T {
  return { ...item };
}

function readSeededCollection<T extends object>(
  storageKey: string,
  initialValue: T[],
  guard: (value: unknown) => value is T
) {
  if (typeof localStorage === "undefined") {
    return initialValue.map((item) => cloneSeededItem(item));
  }

  try {
    const rawValue = localStorage.getItem(storageKey);

    if (!rawValue) {
      localStorage.setItem(storageKey, JSON.stringify(initialValue));
      return initialValue.map((item) => cloneSeededItem(item));
    }

    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      localStorage.setItem(storageKey, JSON.stringify(initialValue));
      return initialValue.map((item) => cloneSeededItem(item));
    }

    const filtered = parsed.filter(guard);

    if (!filtered.length) {
      localStorage.setItem(storageKey, JSON.stringify(initialValue));
      return initialValue.map((item) => cloneSeededItem(item));
    }

    return filtered.map((item) => cloneSeededItem(item));
  } catch {
    return initialValue.map((item) => cloneSeededItem(item));
  }
}

export function listOperationalUsers() {
  return cloneUsers(
    readSeededCollection(
      OPERATIONAL_USERS_STORAGE_KEY,
      initialUsers,
      isOperationalUser
    )
  );
}

export function findOperationalUserByDocument(documento: string) {
  return (
    listOperationalUsers().find((user) => user.documento === documento.trim()) || null
  );
}

export function listEquipmentsForUser(usuarioId: string) {
  return cloneEquipments(
    readSeededCollection(
      EQUIPMENT_STORAGE_KEY,
      initialEquipments,
      isEquipmentCatalogItem
    ).filter((equipment) => equipment.usuarioId === usuarioId)
  );
}

export function upsertOperationalUser(user: OperationalUser) {
  const users = listOperationalUsers();
  const normalizedUser = { ...user };
  const existingIndex = users.findIndex(
    (item) =>
      item.id === normalizedUser.id ||
      item.documento === normalizedUser.documento
  );

  if (existingIndex >= 0) {
    users[existingIndex] = normalizedUser;
  } else {
    users.unshift(normalizedUser);
  }

  saveOperationalUsers(users);
  dispatchOperationalUsersUpdated();
  return normalizedUser;
}
