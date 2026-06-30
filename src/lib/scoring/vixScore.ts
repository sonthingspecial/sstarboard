export function vixScore(vix: number): number {
  if (vix < 15) return 20
  if (vix < 20) return 16
  if (vix < 25) return 10
  if (vix < 30) return 5
  return 0
}
