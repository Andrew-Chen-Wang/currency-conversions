import { writeFileSync } from "node:fs";
import path from "node:path";
import fetch from "node-fetch";
import {
  COMMON_CURRENCIES,
  type Currency,
  type CurrencyRates,
} from "./types.js";

const CONCURRENT_FETCHES = 3;

function getEndDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 90);
  return date.toISOString().split("T")[0];
}

export async function fetchCurrencyRate(
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number | null> {
  try {
    const response = await fetch(
      `https://fxds-public-exchange-rates-api.oanda.com/cc-api/currencies?base=${fromCurrency}&quote=${toCurrency}&data_type=chart&start_date=${getStartDate()}&end_date=${getEndDate()}`
    );

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
        `JSON parse error for ${fromCurrency}/${toCurrency}: ${text.slice(0, 100)}...`
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
  const pendingFetches: Promise<void>[] = [];
  const activeFetches = new Set<Promise<void>>();

  for (const fromCurrency of COMMON_CURRENCIES) {
    for (const toCurrency of COMMON_CURRENCIES) {
      if (fromCurrency === toCurrency) continue;

      const fetchOperation = async () => {
        const key = `${fromCurrency} / ${toCurrency}`;
        console.log(`Fetching rate for ${key}...`);

        try {
          const rate = await fetchCurrencyRate(fromCurrency, toCurrency);
          if (rate !== null) {
            rates[key] = rate;
            console.log(`Successfully fetched rate for ${key}: ${rate}`);
          }
        } catch (error) {
          console.error(`Failed to fetch rate for ${key}:`, error);
        }
      };

      const fetchPromise = fetchOperation();
      const wrappedPromise = async () => {
        try {
          await fetchPromise;
        } finally {
          activeFetches.delete(wrappedPromise);
        }
      };
      const promise = wrappedPromise();

      pendingFetches.push(promise);
      activeFetches.add(promise);

      // Wait if we've reached the concurrent fetch limit
      if (activeFetches.size >= CONCURRENT_FETCHES) {
        await Promise.race(Array.from(activeFetches));
      }
    }
  }

  // Wait for all remaining fetches to complete
  await Promise.all(pendingFetches);

  // Save rates to JSON file
  const outputPath = path.join(process.cwd(), "currency-rates.json");
  writeFileSync(outputPath, JSON.stringify(rates, null, 2));

  return rates;
}

// CLI support
if (require.main === module) {
  getAllCurrencyRates()
    .then(() => console.log("Currency rates fetched and saved successfully"))
    .catch(console.error);
}
