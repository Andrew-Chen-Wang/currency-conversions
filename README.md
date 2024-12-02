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

## Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or higher)
- [pnpm](https://pnpm.io/) package manager

### Install Dependencies
```bash
# Install project dependencies
pnpm install
```

### Local Development Tools

The project uses several tools to ensure code quality:

#### Biome
[Biome](https://biomejs.dev/) is used for linting and formatting:

```bash
# Install Biome
pnpm biome install

# Run linter
pnpm lint

# Run formatter
pnpm format
```

#### Husky and Lint-Staged
[Husky](https://typicode.github.io/husky/) is used for Git hooks, and [lint-staged](https://github.com/okonet/lint-staged) runs linters on staged files:

```bash
# Set up Husky
pnpm run prepare

# This will:
# 1. Install Husky hooks
# 2. Configure pre-commit hook to run linters and formatters
# 3. Set up lint-staged to check only staged files
```

The pre-commit hook will automatically run linting and formatting on your staged files before each commit. If there are any issues, the commit will be blocked until they are fixed.

## License

MIT
