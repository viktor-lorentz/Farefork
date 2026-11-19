export type Cents = number;

export type FormatUsdOptions = {
  dropZeroCents?: boolean;
  signed?: boolean;
};

const MINUS_SIGN = '−';

function groupThousands(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatUsd(cents: Cents, options: FormatUsdOptions = {}): string {
  const rounded = Math.round(cents);
  const absolute = Math.abs(rounded);
  const dollars = Math.floor(absolute / 100);
  const remainder = absolute % 100;
  const fraction =
    options.dropZeroCents === true && remainder === 0
      ? ''
      : `.${remainder.toString().padStart(2, '0')}`;
  const body = `$${groupThousands(dollars)}${fraction}`;
  if (rounded < 0) {
    return `${MINUS_SIGN}${body}`;
  }
  if (options.signed === true && rounded > 0) {
    return `+${body}`;
  }
  return body;
}

export function dollarsToCents(dollars: number): Cents {
  return Math.round(dollars * 100);
}
