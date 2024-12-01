import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-extra";
import { Page } from "@playwright/test";
import stealth from "playwright-extra";
import {
  COMMON_CURRENCIES,
  type Currency,
  type CurrencyRates,
} from "./types.js";

// Add stealth plugin
chromium.use(stealth());

async function selectCurrency(
  page: Page,
  fromOrTo: "from" | "to",
  currency: Currency
): Promise<void> {
  // Click the dropdown to open it
  await page.click(`#${fromOrTo}-button`);
  // Wait for the dropdown menu to be visible
  await page.waitForSelector(`#${fromOrTo}-menu`, { state: "visible" });
  // Click the currency option
  await page.click(`[data-value="${currency}"]`);
  // Wait for the rate to update
  await page.waitForTimeout(1000);
}

async function extractRateFromPage(page: Page): Promise<number | null> {
  try {
    // Wait for the rate input field to be visible and get its value
    const rateInput = await page.locator('input[name="numberformat"]').nth(1);
    await rateInput.waitFor({ state: "visible", timeout: 30000 });
    const rateText = await rateInput.inputValue();

    if (rateText) {
      return Number.parseFloat(rateText.replace(/,/g, ""));
    }
    return null;
  } catch (error) {
    console.error("Error extracting rate:", error);
    return null;
  }
}

export async function fetchCurrencyRate(
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number | null> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Load the initial page
    await page.goto("https://www.oanda.com/currency-converter/en/", {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    // Select currencies using dropdowns
    await selectCurrency(page, "from", fromCurrency);
    await selectCurrency(page, "to", toCurrency);

    return await extractRateFromPage(page);
  } finally {
    await browser.close();
  }
}

export async function getAllCurrencyRates(): Promise<CurrencyRates> {
  const rates: CurrencyRates = {};
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    // Load the page once
    await page.goto("https://www.oanda.com/currency-converter/en/", {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    for (const fromCurrency of COMMON_CURRENCIES) {
      for (const toCurrency of COMMON_CURRENCIES) {
        if (fromCurrency === toCurrency) continue;

        const key = `${fromCurrency} / ${toCurrency}`;
        console.log(`Fetching rate for ${key}...`);

        try {
          // Use dropdowns to select currencies
          await selectCurrency(page, "from", fromCurrency);
          await selectCurrency(page, "to", toCurrency);

          const rate = await extractRateFromPage(page);
          if (rate !== null) {
            rates[key] = rate;
            console.log(`Successfully fetched rate for ${key}: ${rate}`);
          }

          // Small delay between currency switches
          await page.waitForTimeout(1000);
        } catch (error) {
          console.error(`Failed to fetch rate for ${key}:`, error);
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
