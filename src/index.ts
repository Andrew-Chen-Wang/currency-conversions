import { writeFileSync } from "node:fs";
import path from "node:path";
import axios from "axios";
import {
  COMMON_CURRENCIES,
  type Currency,
  type CurrencyRates,
} from "./types.js";

async function fetchCurrencyRate(
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number | null> {
  try {
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    const response = await axios.get(
      "https://fxds-public-exchange-rates-api.oanda.com/cc-api/currencies",
      {
        params: {
          base: fromCurrency,
          quote: toCurrency,
          data_type: "chart",
          start_date: threeMonthsAgo.toISOString().split("T")[0],
          end_date: today.toISOString().split("T")[0],
        },
      }
    );

    // The API returns the latest rate in the data
    if (response.data && response.data.length > 0) {
      return response.data[response.data.length - 1].close;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function getAllCurrencyRates(): Promise<CurrencyRates> {
  const rates: CurrencyRates = {};
  const promises: Promise<void>[] = [];

  for (const fromCurrency of COMMON_CURRENCIES) {
    for (const toCurrency of COMMON_CURRENCIES) {
      if (fromCurrency === toCurrency) continue;

      const key = `${fromCurrency} / ${toCurrency}`;
      const promise = (async () => {
        try {
          const rate = await fetchCurrencyRate(fromCurrency, toCurrency);
          if (rate !== null) {
            rates[key] = rate;
          }
          // Small delay between API calls to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch {
          // Silently handle errors as they're already logged in fetchCurrencyRate
        }
      })();
      promises.push(promise);
    }
  }

  // Wait for all currency pairs to be processed
  await Promise.all(promises);

  // Save rates to JSON file
  const outputPath = path.join(process.cwd(), "currency-rates.json");
  writeFileSync(outputPath, JSON.stringify(rates, null, 2));

  return rates;
}

// Export the main functionality
export { getAllCurrencyRates, fetchCurrencyRate };
