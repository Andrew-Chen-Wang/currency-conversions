import { test, expect } from "@playwright/test";
import { fetchCurrencyRate, getAllCurrencyRates } from "../index.js";
import { COMMON_CURRENCIES } from "../types.js";

test.describe("Currency Conversion Tests", () => {
  test("fetchCurrencyRate returns a valid number for EUR to USD", async () => {
    const rate = await fetchCurrencyRate("EUR", "USD");
    expect(rate).not.toBeNull();
    expect(typeof rate).toBe("number");
    expect(rate).toBeGreaterThan(0);
  });

  test("getAllCurrencyRates returns rates for all currency pairs", async () => {
    const rates = await getAllCurrencyRates();
    expect(rates).toBeTruthy();

    // Check a few sample currency pairs
    const eurUsd = rates["EUR / USD"];
    expect(eurUsd).toBeTruthy();
    expect(typeof eurUsd).toBe("number");
    expect(eurUsd).toBeGreaterThan(0);

    const usdJpy = rates["USD / JPY"];
    expect(usdJpy).toBeTruthy();
    expect(typeof usdJpy).toBe("number");
    expect(usdJpy).toBeGreaterThan(0);
  });

  test("invalid currency pair returns null", async () => {
    // @ts-expect-error Testing invalid input
    const rate = await fetchCurrencyRate("INVALID", "USD");
    expect(rate).toBeNull();
  });
});
