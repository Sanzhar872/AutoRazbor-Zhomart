export function getFavoriteSlots(stock: number): number {
  if (stock === 0) return 0
  if (stock < 5)  return 3
  if (stock < 10) return 4
  if (stock < 20) return 5
  return 7
}
