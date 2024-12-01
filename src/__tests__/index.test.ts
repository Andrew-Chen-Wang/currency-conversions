import { test, expect } from '@playwright/test';
import { fetchCurrencyRate, getAllCurrencyRates } from "../index.js";

test.describe("Currency Conversion Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate with shorter timeout and wait for load instead of networkidle
    await page.goto("https://www.oanda.com/currency-converter/en/", {
      waitUntil: "load",
      timeout: 25000,
    });

    // Additional wait for currency dropdowns to be ready
    await page.waitForSelector('select[data-testid="from-currency-select"]', {
      timeout: 25000,
    });
  });

  test("fetchCurrencyRate returns a valid number for EUR to USD", async ({ page }) => {
    const rate = await fetchCurrencyRate("EUR", "USD", page);
    expect(rate).not.toBeNull();
    expect(typeof rate).toBe("number");
    expect(rate).toBeGreaterThan(0);
  });

  test("getAllCurrencyRates returns rates for all currency pairs", async ({ page }) => {
    const rates = await getAllCurrencyRates(page);
    expect(rates).toBeTruthy();

    const eurUsd = rates["EUR / USD"];
    expect(eurUsd).toBeTruthy();
    expect(typeof eurUsd).toBe("number");
    expect(eurUsd).toBeGreaterThan(0);

    const usdJpy = rates["USD / JPY"];
    expect(usdJpy).toBeTruthy();
    expect(typeof usdJpy).toBe("number");
    expect(usdJpy).toBeGreaterThan(0);
  });

  test("invalid currency pair returns null", async ({ page }) => {
    // @ts-expect-error Testing invalid input
    const rate = await fetchCurrencyRate("INVALID", "USD", page);
    expect(rate).toBeNull();
  });
});
