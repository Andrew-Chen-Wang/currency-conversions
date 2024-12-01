import fs from "node:fs";
import path from "node:path";
import { type Page, chromium, expect, test } from "@playwright/test";
import { fetchCurrencyRate, getAllCurrencyRates } from "../src/index.js";
import { COMMON_CURRENCIES } from "../src/types.js";

test.describe("Currency Conversion Tests", () => {
  let page: Page;

  test.beforeAll(async () => {
    const browser = await chromium.launch();
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("fetchCurrencyRate returns valid rate for EUR/USD", async () => {
    const rate = await fetchCurrencyRate("EUR", "USD");
    expect(rate).not.toBeNull();
    expect(typeof rate).toBe("number");
    expect(rate).toBeGreaterThan(0);
  });

  test("getAllCurrencyRates generates valid JSON file", async () => {
    const rates = await getAllCurrencyRates();

    // Check if rates object is not empty
    expect(Object.keys(rates).length).toBeGreaterThan(0);

    // Check if rates are valid numbers
    for (const [pair, rate] of Object.entries(rates)) {
      expect(typeof rate).toBe("number");
      expect(rate).toBeGreaterThan(0);
    }

    // Check if JSON file was created
    const filePath = path.join(process.cwd(), "currency-rates.json");
    expect(fs.existsSync(filePath)).toBe(true);

    // Verify JSON content
    const fileContent = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    expect(fileContent).toEqual(rates);
  });

  test("handles all COMMON_CURRENCIES pairs", async () => {
    const rates = await getAllCurrencyRates();
    const expectedPairCount =
      COMMON_CURRENCIES.length * (COMMON_CURRENCIES.length - 1);
    const actualPairCount = Object.keys(rates).length;

    expect(actualPairCount).toBe(expectedPairCount);

    // Verify all currency pairs are present
    for (const fromCurrency of COMMON_CURRENCIES) {
      for (const toCurrency of COMMON_CURRENCIES) {
        if (fromCurrency === toCurrency) continue;
        const key = `${fromCurrency} / ${toCurrency}`;
        expect(rates[key]).toBeDefined();
      }
    }
  });
});
