import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";
import { chromium } from "playwright";
import { addExtra } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import {
  COMMON_CURRENCIES,
  type Currency,
  type CurrencyRates,
} from "./types.js";

// Add stealth plugin and launch browser
const browser = addExtra(chromium).use(StealthPlugin());

async function selectCurrency(
  page: Page,
  fromOrTo: "from" | "to",
  currency: Currency
): Promise<void> {
  try {
    // Wait for the page to be ready and stable
    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle");

    // Wait for and click the dropdown with retry
    const button = page.locator(`[id="${fromOrTo}-button"]`);
    await button.waitFor({ state: "visible", timeout: 60000 });
    await page.waitForTimeout(1000); // Ensure UI is stable
    await button.click();

    // Wait for and click the currency option
    const option = page.locator(`[data-value="${currency}"]`).first();
    await option.waitFor({ state: "visible", timeout: 60000 });
    await option.click();

    // Wait for the rate to update
    await page.waitForTimeout(2000); // Allow time for rate update
  } catch (error) {
    console.error(`Failed to select ${currency} for ${fromOrTo}:`, error);
    throw error;
  }
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
  toCurrency: Currency,
  page: Page
): Promise<number | null> {
  try {
    // Load the initial page if needed
    if (!page.url().includes("oanda.com")) {
      await page.goto("https://www.oanda.com/currency-converter/en/", {
        waitUntil: "networkidle",
        timeout: 60000,
      });
    }

    // Select currencies using dropdowns
    await selectCurrency(page, "from", fromCurrency);
    await selectCurrency(page, "to", toCurrency);

    return await extractRateFromPage(page);
  } catch (error) {
    console.error(
      `Failed to fetch rate for ${fromCurrency}/${toCurrency}:`,
      error
    );
    return null;
  }
}

export async function getAllCurrencyRates(page: Page): Promise<CurrencyRates> {
  const rates: CurrencyRates = {};

  try {
    // Load the page if needed
    if (!page.url().includes("oanda.com")) {
      await page.goto("https://www.oanda.com/currency-converter/en/", {
        waitUntil: "networkidle",
        timeout: 60000,
      });
    }

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

    // Save rates to JSON file
    const outputPath = path.join(process.cwd(), "currency-rates.json");
    writeFileSync(outputPath, JSON.stringify(rates, null, 2));

    return rates;
  } catch (error) {
    console.error("Failed to get all currency rates:", error);
    return rates;
  }
}

// CLI support
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const instance = await browser.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await instance.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    await getAllCurrencyRates(page)
      .then(() => console.log("Currency rates fetched and saved successfully"))
      .catch(console.error);
  } finally {
    await context.close();
    await instance.close();
  }
}
