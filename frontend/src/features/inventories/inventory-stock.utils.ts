import type { LotListItem } from "@/features/lots/lots.types";
import { getProductStockFromLots } from "@/features/lots/lots-stock.utils";
import type { Product } from "@/features/products/api/products.types";

export function buildAvailableStockByProduct(lots: LotListItem[]) {
  const lotsByProduct = new Map<string, LotListItem[]>();

  for (const lot of lots) {
    const entries = lotsByProduct.get(lot.productId) ?? [];
    entries.push(lot);
    lotsByProduct.set(lot.productId, entries);
  }

  const stockByProduct = new Map<string, number>();

  for (const [productId, productLots] of lotsByProduct.entries()) {
    stockByProduct.set(productId, getProductStockFromLots(productLots).availableQuantity);
  }

  return stockByProduct;
}

export function getInventorySeedProducts(products: Product[], lots: LotListItem[]) {
  const stockByProduct = buildAvailableStockByProduct(lots);

  const stockedProducts = products.filter((product) => (stockByProduct.get(product.id) ?? 0) > 0);
  if (stockedProducts.length > 0) {
    return stockedProducts;
  }

  return products.filter((product) => product.isActive);
}

export function getDraftInventoryExpectedQuantity(productId: string, stockByProduct: Map<string, number>) {
  return stockByProduct.get(productId) ?? 0;
}
