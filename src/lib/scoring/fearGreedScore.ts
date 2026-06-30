export function fearGreedScore(score: number): number {
  return Math.round((score / 100) * 25)
}
