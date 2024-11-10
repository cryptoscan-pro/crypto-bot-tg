export function parseNumber(input: string): number | string {
  const parsed = Number(input);
  return isNaN(parsed) ? input : parsed;
}
