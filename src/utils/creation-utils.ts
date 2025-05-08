export function calcUnitPrice(casePrice: number, qty: number): number {
  return Math.ceil((casePrice / 2.016 / qty) * 2.5) - 0.01;
}
