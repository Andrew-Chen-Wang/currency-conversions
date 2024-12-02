import { jest } from "@jest/globals";
import axios from "axios";
import { fetchCurrencyRate, getAllCurrencyRates } from "../index.js";
import { COMMON_CURRENCIES } from "../types.js";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Currency Conversion Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetchCurrencyRate returns a valid number for EUR to USD", async () => {
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    // Mock successful API response
    mockedAxios.get.mockResolvedValueOnce({
      data: [{ close: 1.0576 }],
    });

    const rate = await fetchCurrencyRate("EUR", "USD");
    expect(rate).not.toBeNull();
    expect(typeof rate).toBe("number");
    expect(rate).toBe(1.0576);

    // Verify API was called with correct parameters
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://fxds-public-exchange-rates-api.oanda.com/cc-api/currencies",
      {
        params: {
          base: "EUR",
          quote: "USD",
          data_type: "chart",
          start_date: threeMonthsAgo.toISOString().split("T")[0],
          end_date: today.toISOString().split("T")[0],
        },
      }
    );
  });

  test("getAllCurrencyRates returns rates for all currency pairs", async () => {
    // Mock API responses for all currency pairs
    const mockRate = 1.2345;
    for (const fromCurrency of COMMON_CURRENCIES) {
      for (const toCurrency of COMMON_CURRENCIES) {
        if (fromCurrency === toCurrency) continue;
        mockedAxios.get.mockResolvedValueOnce({
          data: [{ close: mockRate }],
        });
      }
    }

    const rates = await getAllCurrencyRates();
    expect(rates).toBeTruthy();
    expect(Object.keys(rates).length).toBeGreaterThan(0);

    // Verify a few sample rates
    const eurUsd = rates["EUR / USD"];
    expect(eurUsd).toBe(mockRate);
    const usdJpy = rates["USD / JPY"];
    expect(usdJpy).toBe(mockRate);
  });

  test("invalid currency pair returns null", async () => {
    // Mock API error
    mockedAxios.get.mockRejectedValueOnce(new Error("Invalid currency"));

    // @ts-expect-error Testing invalid input
    const rate = await fetchCurrencyRate("INVALID", "USD");
    expect(rate).toBeNull();
  });
});
