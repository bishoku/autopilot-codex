export const formatSequentialId = (prefix: string, index: number) => {
  const padded = String(index).padStart(4, "0");
  return `${prefix}-${padded}`;
};
