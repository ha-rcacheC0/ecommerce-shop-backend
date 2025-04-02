export function calcUnitPrice(casePrice: number, qty: number): number {
  return Math.ceil((casePrice / 1.53 / qty) * 2.42) - 0.01; // 2.2*
}
