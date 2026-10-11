export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  { code: 'INR', name: 'Indian Rupee (₹)', symbol: '₹', locale: 'en-IN' },
  { code: 'USD', name: 'US Dollar ($)', symbol: '$', locale: 'en-US' },
  { code: 'EUR', name: 'Euro (€)', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound (£)', symbol: '£', locale: 'en-GB' },
  { code: 'AED', name: 'UAE Dirham (د.إ)', symbol: 'AED', locale: 'ar-AE' },
  { code: 'CAD', name: 'Canadian Dollar ($)', symbol: 'CA$', locale: 'en-CA' },
  { code: 'AUD', name: 'Australian Dollar ($)', symbol: 'A$', locale: 'en-AU' },
  { code: 'SGD', name: 'Singapore Dollar (S$)', symbol: 'S$', locale: 'en-SG' },
];

export const DEFAULT_CURRENCY = 'INR';

/**
 * Converts decimal currency amount (e.g. 1500.50) into integer minor units (paise/cents, 150050).
 */
export function toMinorUnits(decimalAmount: number): number {
  if (isNaN(decimalAmount) || !isFinite(decimalAmount)) return 0;
  return Math.round(decimalAmount * 100);
}

/**
 * Converts integer minor units back to decimal float (150050 -> 1500.5).
 */
export function fromMinorUnits(minorUnits: number): number {
  if (isNaN(minorUnits) || !isFinite(minorUnits)) return 0;
  return minorUnits / 100;
}

/**
 * Formats minor units integer into a localized currency string.
 */
export function formatCurrency(
  amountMinor: number,
  currencyCode: string = DEFAULT_CURRENCY,
  showDecimals: boolean = true
): string {
  const currencyInfo =
    SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) ||
    SUPPORTED_CURRENCIES[0];

  const majorAmount = fromMinorUnits(amountMinor);

  try {
    const formatter = new Intl.NumberFormat(currencyInfo.locale, {
      style: 'currency',
      currency: currencyInfo.code,
      minimumFractionDigits: showDecimals && amountMinor % 100 !== 0 ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return formatter.format(majorAmount);
  } catch {
    // Fallback if locale or code is unsupported by browser
    const formattedNum = majorAmount.toLocaleString('en-US', {
      minimumFractionDigits: showDecimals && amountMinor % 100 !== 0 ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return `${currencyInfo.symbol} ${formattedNum}`;
  }
}

/**
 * Parses user input string (e.g. "50,000", "50000.50") into valid positive number or null.
 */
export function parseAmountInput(val: string): number | null {
  if (!val) return null;
  const cleaned = val.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  if (isNaN(num) || num <= 0 || !isFinite(num)) {
    return null;
  }
  return num;
}
