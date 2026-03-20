import type { Category } from "@/features/categories/api/categories.types";
import { getLotRemainingQuantity, isLotExpired } from "@/features/lots/lots-stock.utils";
import type { LotListItem } from "@/features/lots/lots.types";
import type { Product } from "@/features/products/api/products.types";
import type { ReceptionListItem } from "@/features/receptions/receptions.types";
import type { SupplierListItem } from "@/features/suppliers/suppliers.types";

type BreakdownRow = {
  id: string;
  label: string;
  value: number;
  quantity?: number;
  count?: number;
};

type ProductStockRow = {
  productId: string;
  productName: string;
  categoryName: string;
  unit: string;
  availableQuantity: number;
  expiredQuantity: number;
  availableValue: number;
  expiredValue: number;
  minimumStock: number;
  belowThreshold: boolean;
};

type AnalysisInsights = {
  purchaseByCategory: BreakdownRow[];
  purchaseBySupplier: BreakdownRow[];
  topPurchasedProducts: BreakdownRow[];
  topStockProducts: ProductStockRow[];
  topExpiredStockProducts: ProductStockRow[];
  stockByCategory: BreakdownRow[];
  underThresholdProducts: ProductStockRow[];
  purchasableLotsCount: number;
  expiredLotsCount: number;
};

type BuildAnalysisInsightsInput = {
  lots: LotListItem[];
  products: Product[];
  categories: Category[];
  receptions: ReceptionListItem[];
  suppliers: SupplierListItem[];
  from?: string;
  to?: string;
};

function asDay(dateLike?: string): number | null {
  if (!dateLike) return null;
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function isWithinRange(dateLike: string | undefined, from?: string, to?: string): boolean {
  const day = asDay(dateLike);
  if (day === null) return false;

  const fromDay = asDay(from);
  const toDay = asDay(to);

  if (fromDay !== null && day < fromDay) return false;
  if (toDay !== null && day > toDay) return false;
  return true;
}

function sortBreakdown(rows: BreakdownRow[]): BreakdownRow[] {
  return [...rows].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "fr"));
}

export function buildAnalysisInsights({
  lots,
  products,
  categories,
  receptions,
  suppliers,
  from,
  to,
}: BuildAnalysisInsightsInput): AnalysisInsights {
  const productMap = new Map(products.map((product) => [product.id, product]));
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const receptionMap = new Map(receptions.map((reception) => [reception.id, reception]));
  const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier]));

  const purchaseByCategory = new Map<string, BreakdownRow>();
  const purchaseBySupplier = new Map<string, BreakdownRow>();
  const purchaseByProduct = new Map<string, BreakdownRow>();
  const stockByProduct = new Map<string, ProductStockRow>();
  const stockByCategory = new Map<string, BreakdownRow>();

  let purchasableLotsCount = 0;
  let expiredLotsCount = 0;

  for (const lot of lots) {
    const product = productMap.get(lot.productId);
    const category = product ? categoryMap.get(product.categoryId) : undefined;
    const categoryName = category?.name ?? "Sans catégorie";
    const productName = product?.name ?? lot.productName ?? "Produit inconnu";
    const unit = product?.unit ?? "u";
    const minimumStock = product?.minimumStock ?? product?.alertThreshold ?? 0;
    const remainingQuantity = getLotRemainingQuantity(lot);
    const reception = lot.receptionId ? receptionMap.get(lot.receptionId) : undefined;
    const supplier =
      reception?.supplierId && supplierMap.has(reception.supplierId)
        ? supplierMap.get(reception.supplierId)
        : undefined;
    const supplierName = supplier?.name ?? "Sans fournisseur";
    const receptionDate = reception?.receptionDate ?? lot.createdAt;
    const lotIsExpired = isLotExpired(lot.expiryDate);
    const unitCost = typeof lot.unitCost === "number" ? lot.unitCost : 0;

    if (remainingQuantity > 0) {
      if (lotIsExpired) {
        expiredLotsCount += 1;
      } else {
        purchasableLotsCount += 1;
      }
    }

    const existingStock = stockByProduct.get(lot.productId) ?? {
      productId: lot.productId,
      productName,
      categoryName,
      unit,
      availableQuantity: 0,
      expiredQuantity: 0,
      availableValue: 0,
      expiredValue: 0,
      minimumStock,
      belowThreshold: false,
    };

    if (remainingQuantity > 0) {
      if (lotIsExpired) {
        existingStock.expiredQuantity += remainingQuantity;
        existingStock.expiredValue += remainingQuantity * unitCost;
      } else {
        existingStock.availableQuantity += remainingQuantity;
        existingStock.availableValue += remainingQuantity * unitCost;
      }
    }

    stockByProduct.set(lot.productId, existingStock);

    if (!isWithinRange(receptionDate, from, to)) {
      continue;
    }

    const purchaseValue = lot.quantityInitial * unitCost;
    if (purchaseValue <= 0) {
      continue;
    }

    const categoryKey = category?.id ?? "uncategorized";
    const existingCategory = purchaseByCategory.get(categoryKey) ?? {
      id: categoryKey,
      label: categoryName,
      value: 0,
      quantity: 0,
      count: 0,
    };
    existingCategory.value += purchaseValue;
    existingCategory.quantity = (existingCategory.quantity ?? 0) + lot.quantityInitial;
    existingCategory.count = (existingCategory.count ?? 0) + 1;
    purchaseByCategory.set(categoryKey, existingCategory);

    const supplierKey = supplier?.id ?? "supplier-unknown";
    const existingSupplier = purchaseBySupplier.get(supplierKey) ?? {
      id: supplierKey,
      label: supplierName,
      value: 0,
      quantity: 0,
      count: 0,
    };
    existingSupplier.value += purchaseValue;
    existingSupplier.quantity = (existingSupplier.quantity ?? 0) + lot.quantityInitial;
    existingSupplier.count = (existingSupplier.count ?? 0) + 1;
    purchaseBySupplier.set(supplierKey, existingSupplier);

    const existingProduct = purchaseByProduct.get(lot.productId) ?? {
      id: lot.productId,
      label: productName,
      value: 0,
      quantity: 0,
      count: 0,
    };
    existingProduct.value += purchaseValue;
    existingProduct.quantity = (existingProduct.quantity ?? 0) + lot.quantityInitial;
    existingProduct.count = (existingProduct.count ?? 0) + 1;
    purchaseByProduct.set(lot.productId, existingProduct);
  }

  const stockRows = [...stockByProduct.values()].map((row) => ({
    ...row,
    belowThreshold: row.minimumStock > 0 && row.availableQuantity < row.minimumStock,
  }));

  for (const row of stockRows) {
    const categoryKey = `${row.categoryName}`;
    const existingCategory = stockByCategory.get(categoryKey) ?? {
      id: categoryKey,
      label: row.categoryName,
      value: 0,
      quantity: 0,
      count: 0,
    };
    existingCategory.value += row.availableValue;
    existingCategory.quantity = (existingCategory.quantity ?? 0) + row.availableQuantity;
    existingCategory.count = (existingCategory.count ?? 0) + 1;
    stockByCategory.set(categoryKey, existingCategory);
  }

  return {
    purchaseByCategory: sortBreakdown([...purchaseByCategory.values()]),
    purchaseBySupplier: sortBreakdown([...purchaseBySupplier.values()]),
    topPurchasedProducts: sortBreakdown([...purchaseByProduct.values()]),
    topStockProducts: [...stockRows].sort((a, b) => b.availableValue - a.availableValue || a.productName.localeCompare(b.productName, "fr")),
    topExpiredStockProducts: [...stockRows]
      .filter((row) => row.expiredValue > 0)
      .sort((a, b) => b.expiredValue - a.expiredValue || a.productName.localeCompare(b.productName, "fr")),
    stockByCategory: sortBreakdown([...stockByCategory.values()]),
    underThresholdProducts: [...stockRows]
      .filter((row) => row.belowThreshold)
      .sort((a, b) => a.availableQuantity - b.availableQuantity || a.productName.localeCompare(b.productName, "fr")),
    purchasableLotsCount,
    expiredLotsCount,
  };
}
