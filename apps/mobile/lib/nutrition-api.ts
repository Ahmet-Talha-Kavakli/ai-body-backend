export async function searchFoodByBarcode(barcode: string): Promise<any> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
  if (!res.ok) return null;
  const data = await res.json();
  return {
    name: data.product?.product_name,
    calories: data.product?.nutriments?.['energy-kcal'],
    protein: data.product?.nutriments?.proteins,
    carbs: data.product?.nutriments?.carbohydrates,
    fat: data.product?.nutriments?.fat,
  };
}
