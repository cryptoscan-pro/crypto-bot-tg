export const getBigNumber = (fee: number): string | number => {
  const f = fee > 1 ? Math.ceil(fee) : fee;

  if (Math.abs(fee) > 1_000_000_000) {
    return `${(f / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(fee) > 1_000_000) {
    return `${(f / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(fee) > 1_000) {
    return `${(f / 1_000).toFixed(2)}K`;
  }

  return f;
};

