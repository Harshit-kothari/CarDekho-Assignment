export function formatLakhInr(lakh: number): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  });
  return `${formatter.format(lakh * 100_000)} (ex-showroom)`;
}

export function formatShortLakh(lakh: number): string {
  return `₹${lakh.toLocaleString('en-IN', { maximumFractionDigits: 2 })} L`;
}
