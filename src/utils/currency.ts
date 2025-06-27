/**
 * Formats a numeric value into a currency string with appropriate suffixes (K, M, B)
 * @param value - The numeric value to format
 * @returns Formatted currency string
 */
export function formatCurrencyValue(value: number): string {
  if (value === 0) return '0';
  
  const suffixes = ['', 'K', 'M', 'B'];
  const base = 1000;
  
  // Find the appropriate suffix index
  const suffixIndex = Math.min(
    Math.floor(Math.log(value) / Math.log(base)),
    suffixes.length - 1
  );
  
  // Calculate the scaled value
  const scaledValue = value / Math.pow(base, suffixIndex);
  
  // Format the number with appropriate decimal places
  let formattedValue: string;
  if (suffixIndex === 0) {
    // For values less than 1000, show no decimals
    formattedValue = Math.round(scaledValue).toString();
  } else if (scaledValue >= 100) {
    // For values >= 100K, 100M, etc., show no decimals
    formattedValue = Math.round(scaledValue).toString();
  } else {
    // For other values, show one decimal place
    formattedValue = scaledValue.toFixed(1).replace(/\.0$/, '');
  }
  
  return `${formattedValue}${suffixes[suffixIndex]}`;
}

/**
 * Parses a currency string into a numeric value
 * @param value - The currency string to parse (e.g., "1.5M", "100K")
 * @returns The parsed numeric value
 */
export function parseCurrencyValue(value: string): number {
  if (!value) return 0;
  
  // Remove any non-alphanumeric characters except decimal point
  const cleanValue = value.replace(/[^0-9.]/g, '');
  
  // Get the suffix if it exists
  const suffix = value.match(/[KMB]$/i)?.[0]?.toUpperCase() || '';
  
  // Parse the numeric part
  const numericValue = parseFloat(cleanValue);
  
  // Apply the appropriate multiplier based on the suffix
  const multipliers: { [key: string]: number } = {
    'K': 1000,
    'M': 1000000,
    'B': 1000000000
  };
  
  return numericValue * (multipliers[suffix] || 1);
} 