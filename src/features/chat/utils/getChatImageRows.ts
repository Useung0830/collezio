export function getChatImageRows(count: number): number[] {
  const rows: Record<number, number[]> = {
    1: [1],
    2: [2],
    3: [2, 1],
    4: [2, 2],
    5: [3, 2],
    6: [3, 3],
    7: [3, 2, 2],
    8: [3, 3, 2],
    9: [3, 3, 3],
    10: [3, 3, 4],
  };
  return rows[count] ?? [];
}
