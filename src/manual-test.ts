import { chromium } from "@playwright/test";

async function testCurrencySelection() {
  console.log("Initializing browser...");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    console.log("Navigating to OANDA...");
    // Use basic load strategy first
    await page.goto(
      "https://www.oanda.com/currency-converter/en/?from=EUR&to=USD&amount=1",
      { timeout: 60000 }
    );

    console.log("Waiting for page to be ready...");
    // Wait for initial page load
    await page.waitForLoadState("domcontentloaded", { timeout: 60000 });

    // Wait for the rate input to be visible
    const rateInput = await page.waitForSelector('[devinid="67"]', {
      state: "visible",
      timeout: 60000,
    });

    if (!rateInput) {
      throw new Error("Exchange rate input not found");
    }

    const rate = await rateInput.inputValue();
    console.log(`Exchange rate: ${rate}`);
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

testCurrencySelection();
