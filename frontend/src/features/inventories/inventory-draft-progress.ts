const STORAGE_KEY = "savethestock.inventory-draft-progress";

type DraftProgressState = Record<string, string[]>;

function readState(): DraftProgressState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue) as DraftProgressState;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

function writeState(state: DraftProgressState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getUntouchedInventoryLineIds(inventoryId: string): Set<string> {
  const state = readState();
  return new Set(state[inventoryId] ?? []);
}

export function markInventoryLinesAsUntouched(inventoryId: string, lineIds: string[]) {
  if (lineIds.length === 0) {
    return;
  }

  const state = readState();
  const existing = new Set(state[inventoryId] ?? []);
  for (const lineId of lineIds) {
    existing.add(lineId);
  }

  state[inventoryId] = [...existing];
  writeState(state);
}

export function markInventoryLinesAsCounted(inventoryId: string, lineIds: string[]) {
  if (lineIds.length === 0) {
    return;
  }

  const state = readState();
  const existing = new Set(state[inventoryId] ?? []);
  for (const lineId of lineIds) {
    existing.delete(lineId);
  }

  if (existing.size === 0) {
    delete state[inventoryId];
  } else {
    state[inventoryId] = [...existing];
  }

  writeState(state);
}

export function removeInventoryLineFromDraftProgress(inventoryId: string, lineId: string) {
  markInventoryLinesAsCounted(inventoryId, [lineId]);
}

export function clearInventoryDraftProgress(inventoryId: string) {
  const state = readState();
  if (!(inventoryId in state)) {
    return;
  }

  delete state[inventoryId];
  writeState(state);
}
