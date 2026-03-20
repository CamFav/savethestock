import type { LotListItem } from "@/features/lots/lots.types";

export function getLotRemainingQuantity(lot: LotListItem): number {
  const quantity = lot.quantityRemaining ?? lot.quantityInitial;
  return Number.isFinite(quantity) ? Math.max(quantity, 0) : 0;
}

export function isLotExpired(expiryDate?: string): boolean {
  if (!expiryDate) {
    return false;
  }

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  return expiry < today;
}

export function getLotExpiryVariant(expiryDate?: string): "expired" | "soon" | null {
  if (!expiryDate) {
    return null;
  }

  if (isLotExpired(expiryDate)) {
    return "expired";
  }

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const soonLimit = new Date(today);
  soonLimit.setDate(soonLimit.getDate() + 3);
  expiry.setHours(0, 0, 0, 0);

  return expiry <= soonLimit ? "soon" : null;
}

export function getProductStockFromLots(lots: LotListItem[]) {
  return lots.reduce(
    (acc, lot) => {
      const remainingQuantity = getLotRemainingQuantity(lot);
      if (remainingQuantity <= 0) {
        return acc;
      }

      const unitPrice = typeof lot.unitCost === "number" ? lot.unitCost : null;
      const isExpired = isLotExpired(lot.expiryDate);

      if (unitPrice !== null) {
        acc.latestUnitPrice = unitPrice;
      }

      if (isExpired) {
        acc.expiredQuantity += remainingQuantity;
        return acc;
      }

      acc.availableQuantity += remainingQuantity;
      if (unitPrice !== null) {
        acc.availableValue += remainingQuantity * unitPrice;
      }

      return acc;
    },
    {
      availableQuantity: 0,
      expiredQuantity: 0,
      availableValue: 0,
      latestUnitPrice: null as number | null,
    },
  );
}
