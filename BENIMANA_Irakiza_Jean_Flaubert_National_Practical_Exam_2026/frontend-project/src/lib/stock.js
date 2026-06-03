// Available stock for a product = base quantityInStock + all stock-in - all stock-out
// (optionally excluding one transaction, e.g. the row being edited). Shared by the
// transaction create form and the transaction edit dialog so the rule lives in one place.
export function computeAvailable(productId, products, transactions, excludeId = null) {
  const product = products.find((p) => p._id === productId);
  if (!product) return null;
  let total = product.quantityInStock;
  for (const t of transactions) {
    if (t._id === excludeId) continue;
    const tProductId = t.product?._id || t.product;
    if (tProductId !== productId) continue;
    total += t.transactionType === 'STOCK_IN' ? t.quantityMoved : -t.quantityMoved;
  }
  return total;
}
