# Currency Converted Data Fetcher

A Node.js package that fetches real-time currency conversion rates from OANDA.

## Installation

```bash
npm install currency-converted-data-fetcher
# or
pnpm add currency-converted-data-fetcher
```

## Usage

```typescript
import { getAllCurrencyRates, fetchCurrencyRate } from 'currency-converted-data-fetcher';

// Fetch all currency rates
const rates = await getAllCurrencyRates();
console.log(rates['USD / EUR']); // Get USD to EUR rate

// Fetch specific currency rate
const rate = await fetchCurrencyRate('USD', 'EUR');
console.log(rate); // Get USD to EUR rate
```

## Features

- Fetches real-time currency conversion rates from OANDA
- Supports major world currencies
- Provides TypeScript types
- Saves results to JSON file
- Ignores cryptocurrencies

## License

MIT
