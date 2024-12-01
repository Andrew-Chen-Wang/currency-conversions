import { chromium } from "playwright-extra";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  COMMON_CURRENCIES,
  type Currency,
  type CurrencyRates,
} from "./types.js";
import { stealth } from "puppeteer-extra-plugin-stealth";

// Add stealth plugin
chromium.use(stealth());

async function extractRateFromPage(page: any): Promise<number | null> {
  try {
    // Wait for the rate input field to be visible and get its value
    const rateInput = await page.locator('input[name="numberformat"]').nth(1);
    await rateInput.waitFor({ state: 'visible', timeout: 30000 });
    const rateText = await rateInput.inputValue();

    if (rateText) {
      return parseFloat(rateText.replace(/,/g, ""));
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
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    for (const fromCurrency of COMMON_CURRENCIES) {
      for (const toCurrency of COMMON_CURRENCIES) {
        if (fromCurrency === toCurrency) continue;

        const key = `${fromCurrency} / ${toCurrency}`;
        console.log(`Fetching rate for ${key}...`);

        try {
          await page.goto(
            `https://www.oanda.com/currency-converter/en/?from=${fromCurrency}&to=${toCurrency}&amount=1`,
            { waitUntil: "networkidle", timeout: 60000 }
          );

          const rate = await extractRateFromPage(page);
          if (rate !== null) {
            rates[key] = rate;
            console.log(`Successfully fetched rate for ${key}: ${rate}`);
          }

          // Increased delay to avoid rate limiting
          await page.waitForTimeout(3000);
        } catch (error) {
          console.error(`Failed to fetch rate for ${key}:`, error);
          continue;
        }
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
