import { writeFileSync } from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import {
  COMMON_CURRENCIES,
  type Currency,
  type CurrencyRates,
} from "./types.js";

const MIN_DELAY_MS = 3000; // 3 second minimum delay between requests
const MAX_BACKOFF_MS = 3600000; // 1 hour maximum backoff
const INITIAL_BACKOFF_MS = 1000; // Start with 1 second backoff

function getEndDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 90);
  return date.toISOString().split("T")[0];
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchCurrencyRate(
  fromCurrency: Currency,
  toCurrency: Currency,
  retryCount = 0
): Promise<number | null> {
  const backoffMs = Math.min(
    INITIAL_BACKOFF_MS * 2 ** retryCount,
    MAX_BACKOFF_MS
  );

  try {
    const response = await fetch(
      `https://fxds-public-exchange-rates-api.oanda.com/cc-api/currencies?base=${fromCurrency}&quote=${toCurrency}&data_type=chart&start_date=${getStartDate()}&end_date=${getEndDate()}`
    );

    if (response.status === 429 && retryCount < 10) {
      console.log(
        `Rate limited for ${fromCurrency}/${toCurrency}, backing off for ${
          backoffMs / 1000
        } seconds...`
      );
      await sleep(backoffMs);
      return fetchCurrencyRate(fromCurrency, toCurrency, retryCount + 1);
    }

    if (!response.ok) {
      console.error(
        `HTTP error for ${fromCurrency}/${toCurrency}: ${response.status}`
      );
      return null;
    }

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      if (data.response && data.response.length > 0) {
        const latestRate = data.response[data.response.length - 1];
        return Number.parseFloat(latestRate.average_bid);
      }
      return null;
    } catch (parseError) {
      console.error(
        `JSON parse error for ${fromCurrency}/${toCurrency}: ${text.slice(
          0,
          100
        )}...`
      );
      return null;
    }
  } catch (error) {
    console.error(
      `Error fetching rate for ${fromCurrency}/${toCurrency}:`,
      error
    );
    return null;
  }
}

export async function getAllCurrencyRates(): Promise<CurrencyRates> {
  const rates: CurrencyRates = {};

  for (const fromCurrency of COMMON_CURRENCIES) {
    for (const toCurrency of COMMON_CURRENCIES) {
      if (fromCurrency === toCurrency) continue;

      const key = `${fromCurrency} / ${toCurrency}`;
      console.log(`Fetching rate for ${key}...`);

      const rate = await fetchCurrencyRate(fromCurrency, toCurrency);
      if (rate !== null) {
        rates[key] = rate;
        console.log(`Successfully fetched rate for ${key}: ${rate}`);
      }

      // Always wait at least 3 seconds between requests
      await sleep(MIN_DELAY_MS);
    }
  }

  // Save rates to JSON file
  const outputPath = path.join(process.cwd(), "currency-rates.json");
  writeFileSync(outputPath, JSON.stringify(rates, null, 2));

  return rates;
}

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  getAllCurrencyRates()
    .then(() => console.log("Currency rates fetched and saved successfully"))
    .catch(console.error);
}
