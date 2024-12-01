# Currency Fetching Optimization and Test Suite

## Changes Made
- Optimized currency fetching by using dropdowns instead of URL parameters
- Reduced page loads by reusing browser instance for all currency pairs
- Added comprehensive test suite using Playwright
- Set up GitHub Actions workflow for CI testing

## Testing Status
✅ Local Testing:
- Successfully tested currency pair selection using dropdowns
- Verified rate extraction functionality
- Confirmed JSON file generation
- All tests passing locally

✅ CI Integration:
- Added GitHub Actions workflow for automated testing
- Includes Playwright browser installation
- Runs full test suite on PR and push events

## Optimization Details
- Single page load instead of loading for each currency pair
- Uses dropdown interaction for currency selection
- Proper error handling and retries
- Reduced rate limiting risk through optimized page interaction

## Link to Devin run
https://preview.devin.ai/devin/37ef83db52c04389830b6e18d0627d30

Please review the changes and let me know if any adjustments are needed.
