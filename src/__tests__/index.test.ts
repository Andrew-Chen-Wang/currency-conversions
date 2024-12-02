import { jest } from "@jest/globals";
import axios from "axios";
import { fetchCurrencyRate, getAllCurrencyRates } from "../index.js";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Currency Conversion Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetchCurrencyRate returns a valid number for EUR to USD", async () => {
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
      expect.objectContaining({
        params: expect.objectContaining({
          base: "EUR",
          quote: "USD",
          data_type: "chart",
        }),
      })
    );
  });

  test("getAllCurrencyRates returns rates for all currency pairs", async () => {
    // Mock API responses for different currency pairs
    mockedAxios.get
      .mockResolvedValueOnce({
        data: [{ close: 1.0576 }],
      })
      .mockResolvedValueOnce({
        data: [{ close: 150.25 }],
      });

    const rates = await getAllCurrencyRates();
    expect(rates).toBeTruthy();

    const eurUsd = rates["EUR / USD"];
    expect(eurUsd).toBe(1.0576);

    const usdJpy = rates["USD / JPY"];
    expect(usdJpy).toBe(150.25);
  });

  test("invalid currency pair returns null", async () => {
    // Mock API error
    mockedAxios.get.mockRejectedValueOnce(new Error("Invalid currency"));

    // @ts-expect-error Testing invalid input
    const rate = await fetchCurrencyRate("INVALID", "USD");
    expect(rate).toBeNull();
  });
});
