import { getLotRemainingQuantity, isLotExpired } from "@/features/lots/lots-stock.utils";
import type { LotListItem } from "@/features/lots/lots.types";
import type { Category } from "@/features/categories/api/categories.types";
import type { Product } from "@/features/products/api/products.types";

export type WasteLotOption = {
  id: string;
  label: string;
  remainingQuantity: number;
  expiryDate?: string;
  lotCode?: string;
  productName: string;
  productId: string;
  categoryId?: string;
  categoryName?: string;
  unit?: string;
  unitCost?: number;
  isExpired: boolean;
  createdAt?: string;
};

function formatQuantity(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function buildWasteLotOptions({
  lots,
  products,
  categories,
  includeEmpty = false,
}: {
  lots: LotListItem[];
  products: Product[];
  categories: Category[];
  includeEmpty?: boolean;
}) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  const options: WasteLotOption[] = [];

  for (const lot of lots) {
    const remainingQuantity = getLotRemainingQuantity(lot);
    if (!includeEmpty && remainingQuantity <= 0) {
      continue;
    }

    const product = productById.get(lot.productId);
    const productName = product?.name ?? lot.productName ?? "Produit inconnu";
    const categoryName = product ? categoryNameById.get(product.categoryId) : undefined;
    const formattedExpiry = formatDate(lot.expiryDate);
    const expired = isLotExpired(lot.expiryDate);
    const lotCode = lot.lotCode ?? "Sans code";
    const unit = product?.unit;

    const parts = [
      productName,
      categoryName,
      `Lot ${lotCode}`,
      `restant ${formatQuantity(remainingQuantity)}${unit ? ` ${unit}` : ""}`,
      expired ? "expiré" : formattedExpiry ? `expire le ${formattedExpiry}` : undefined,
    ].filter(Boolean);

    options.push({
      id: lot.id,
      label: parts.join(" • "),
      remainingQuantity,
      expiryDate: lot.expiryDate,
      lotCode: lot.lotCode,
      productName,
      productId: lot.productId,
      categoryId: product?.categoryId,
      categoryName,
      unit,
      unitCost: lot.unitCost,
      isExpired: expired,
      createdAt: lot.createdAt,
    });
  }

  return options.sort((left, right) => {
    if (left.isExpired !== right.isExpired) {
      return left.isExpired ? -1 : 1;
    }

    if (left.expiryDate && right.expiryDate) {
      return left.expiryDate.localeCompare(right.expiryDate);
    }

    if (left.expiryDate || right.expiryDate) {
      return left.expiryDate ? -1 : 1;
    }

    if (left.createdAt && right.createdAt) {
      return left.createdAt.localeCompare(right.createdAt);
    }

    return left.productName.localeCompare(right.productName, "fr-FR");
  });
}
