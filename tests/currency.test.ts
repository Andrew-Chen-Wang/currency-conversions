import { describe, expect, test, vi } from "vitest";
import { fetchCurrencyRate, getAllCurrencyRates } from "../src/index.js";
import { COMMON_CURRENCIES, type Currency } from "../src/types.js";

describe("Currency Conversion Fetcher", () => {
  test("fetchCurrencyRate returns a valid rate for GBP/USD", async () => {
    const rate = await fetchCurrencyRate("GBP", "USD");
    expect(rate).not.toBeNull();
    expect(typeof rate).toBe("number");
    expect(rate).toBeGreaterThan(0);
  });

  test("getAllCurrencyRates respects concurrent fetch limit", async () => {
    let maxConcurrent = 0;
    let currentConcurrent = 0;

    // Patch console.log to track concurrent operations
    const consoleSpy = vi.spyOn(console, "log");
    consoleSpy.mockImplementation((message: string) => {
      if (message.includes("Fetching rate for")) {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
      } else if (message.includes("Successfully fetched rate")) {
        currentConcurrent--;
      }
    });

    await getAllCurrencyRates();
    consoleSpy.mockRestore();

    expect(maxConcurrent).toBeLessThanOrEqual(3);
  });

  test("getAllCurrencyRates returns rates for major currency pairs", async () => {
    const rates = await getAllCurrencyRates();
    const majorPairs = ["USD / EUR", "GBP / USD", "EUR / GBP"];

    for (const pair of majorPairs) {
      expect(rates[pair]).toBeDefined();
      expect(typeof rates[pair]).toBe("number");
      expect(rates[pair]).toBeGreaterThan(0);
    }
  });

  test("getAllCurrencyRates excludes same currency pairs", async () => {
    const rates = await getAllCurrencyRates();

    for (const currency of COMMON_CURRENCIES) {
      const samePair = `${currency} / ${currency}`;
      expect(rates[samePair]).toBeUndefined();
    }
  });
});
