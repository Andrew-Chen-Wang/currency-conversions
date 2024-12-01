import { expect, test } from "@playwright/test";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import { chromium } from "playwright";
import { addExtra } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { fetchCurrencyRate, getAllCurrencyRates } from "../index.js";

test.describe("Currency Conversion Tests", () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    // Initialize browser with stealth plugin
    const playwright = addExtra(chromium);
    playwright.use(StealthPlugin());

    browser = await playwright.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
      ],
    });

    context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 720 },
    });

    page = await context.newPage();
  });

  test.beforeEach(async () => {
    // Navigate with extended timeout and wait for network idle
    await page.goto("https://www.oanda.com/currency-converter/en/", {
      waitUntil: "networkidle",
      timeout: 90000,
    });
  });

  test.afterAll(async () => {
    await context?.close();
    await browser?.close();
  });

  test("fetchCurrencyRate returns a valid number for EUR to USD", async () => {
    const rate = await fetchCurrencyRate("EUR", "USD", page);
    expect(rate).not.toBeNull();
    expect(typeof rate).toBe("number");
    expect(rate).toBeGreaterThan(0);
  });

  test("getAllCurrencyRates returns rates for all currency pairs", async () => {
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

  test("invalid currency pair returns null", async () => {
    // @ts-expect-error Testing invalid input
    const rate = await fetchCurrencyRate("INVALID", "USD", page);
    expect(rate).toBeNull();
  });
});
