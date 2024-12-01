export interface CurrencyConversion {
  from: string;
  to: string;
  rate: number;
}

export interface CurrencyPair {
  key: string;
  rate: number;
}

export interface CurrencyRates {
  [key: string]: number; // Format: "USD / EUR" -> rate
}

export const COMMON_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "HKD",
  "NZD",
  "SEK",
  "KRW",
  "SGD",
  "NOK",
  "MXN",
  "INR",
  "RUB",
  "ZAR",
  "TRY",
  "BRL",
  "TWD",
  "DKK",
  "PLN",
  "THB",
  "IDR",
  "HUF",
  "CZK",
  "ILS",
  "CLP",
  "PHP",
  "AED",
  "SAR",
  "MYR",
  "RON",
  "BGN",
  "HRK",
  "PKR",
  "ISK",
  "VND",
  "EGP",
] as const;

export type Currency = (typeof COMMON_CURRENCIES)[number];
