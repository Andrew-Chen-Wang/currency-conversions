import { chromium } from "@playwright/test";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  COMMON_CURRENCIES,
  type Currency,
  type CurrencyRates,
} from "./types.js";

async function extractRateFromPage(page: any): Promise<number | null> {
  try {
    // Wait for the rate to be visible
    await page.waitForSelector('[data-testid="conversion-result"]', { timeout: 10000 });
    const rateText = await page.locator('[data-testid="conversion-result"]').textContent();

    // Extract the numeric rate from the text
    const match = rateText.match(/1.+?=\s*([\d,.]+)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ""));
    }
    return null;
  } catch (error) {
    console.error("Error extracting rate:", error);
    return null;
  }
}

export async function fetchCurrencyRate(
  fromCurrency: Currency,
  toCurrency: Currency,
): Promise<number | null> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(
      `https://www.oanda.com/currency-converter/en/?from=${fromCurrency}&to=${toCurrency}&amount=1`,
      { waitUntil: "networkidle" }
    );

    return await extractRateFromPage(page);
  } finally {
    await browser.close();
  }
}

export async function getAllCurrencyRates(): Promise<CurrencyRates> {
  const rates: CurrencyRates = {};
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    for (const fromCurrency of COMMON_CURRENCIES) {
      for (const toCurrency of COMMON_CURRENCIES) {
        if (fromCurrency === toCurrency) continue;

        const key = `${fromCurrency} / ${toCurrency}`;
        console.log(`Fetching rate for ${key}...`);

        await page.goto(
          `https://www.oanda.com/currency-converter/en/?from=${fromCurrency}&to=${toCurrency}&amount=1`,
          { waitUntil: "networkidle" }
        );

        const rate = await extractRateFromPage(page);
        if (rate !== null) {
          rates[key] = rate;
        }

        // Add a small delay to avoid rate limiting
        await page.waitForTimeout(1000);
      }
    }
  } finally {
    await browser.close();
  }

  // Save rates to JSON file
  const outputPath = path.join(process.cwd(), "currency-rates.json");
  writeFileSync(outputPath, JSON.stringify(rates, null, 2));

  return rates;
}

// CLI support
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  getAllCurrencyRates()
    .then(() => console.log("Currency rates fetched and saved successfully"))
    .catch(console.error);
}
