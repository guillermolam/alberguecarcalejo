# DNI Registration Testing Guide

This guide covers end-to-end testing for the Pilgrim Registration System, focusing on DNI document processing, complete registration flow, and integration with Spin gateway and Rust WASM services.

## Prerequisites

1. **Dev Environment Running**: Application should be running in Replit via Spin on port 5173 for frontend and 8000 for API.
   ```bash
   npm run dev:replit
   ```
2. **Test Frameworks Installed**:
   - **TestCafe** for E2E: `npm list testcafe`
   - **Jest + Testing Library** for unit/component tests: `npm list jest @testing-library/react`
3. **Test Assets**:
   - OCR training images in `services/validation-service/tests/ocr-training/{dni-nif,passports,nie-tie}`
   - UI test fixtures in `frontend/tests/fixtures/`

## Test Files Overview

### 1. E2E DNI Registration Flow (`tests/e2e/dni-registration-flow.js`)
Covers:
- Full registration from document upload to payment and success page
- DNI OCR via validation-service
- Form field auto-population and manual override
- Bed assignment check
- Government SOAP submission result
- Success page cards and language selector

### 2. Quick DNI Validation (`tests/e2e/test-dni-simple.js`)
Focuses on:
- DNI image upload
- OCR response validation
- Basic form completion
- Error handling flows

### 3. Document Type Coverage Tests
Separate E2E suites for each document type:
- **Passport Flow**: `tests/e2e/passport-registration-flow.js` covering MRZ parsing, form auto-fill, error cases
- **NIE/TIE Flow**: `tests/e2e/nie-registration-flow.js` covering NIE format, residence permit extraction, fallback manual entry
- **Mixed Document Scenarios**: `tests/e2e/mixed-doc-registration-flow.js` testing user switching docs mid-flow

### 4. Payment Flow & Cancellation Tests
Covers different payment scenarios:
- **Online Payment Success**: `tests/e2e/payment-success-flow.js` (Stripe mock)
- **Online Payment Failure**: `tests/e2e/payment-failure-flow.js` triggering retry logic
- **Cash Payment via Admin**: `tests/e2e/cash-payment-admin-flow.js` registering cash and notifications
- **Reservation Expiry**: `tests/e2e/reservation-expiry-flow.js` auto-cancel after 2 h window
- **Cancellation by User**: `tests/e2e/user-cancellation-flow.js` manual cancel and bed release

### 5. Component & Unit Tests
- **Validation logic**: `validation-service/tests/` via `cargo test`
- **Booking flow**: `booking-service/tests/` with Rust unit tests
- **React components**: `frontend/tests/**/*.test.tsx` using Jest + Testing Library


- **Validation logic**: `validation-service/tests/` via `cargo test`
- **Booking flow**: `booking-service/tests/` with Rust unit tests
- **React components**: `frontend/tests/**/*.test.tsx` using Jest + Testing Library

## Running Tests

### Quick E2E Test
```bash
# Run simple DNI validation E2E test
npx testcafe chrome:headless tests/e2e/test-dni-simple.js --hostname 0.0.0.0 --ports 5173,8000
```

### Full E2E Suite
```bash
npx testcafe chrome:headless tests/e2e/dni-registration-flow.js --hostname 0.0.0.0 --ports 5173,8000 \
  --reporter spec,json:reports/test-results.json
```

### Unit & Component Tests
```bash
# Rust services
cargo test -p validation-service
cargo test -p booking-service
# Frontend
npm run test:ui
```

### Performance & Accessibility
```bash
npm run perf:k6           # API load tests
npm run perf:lh           # Lighthouse audits on http://localhost:5173
```

## Test Configuration

### testcafe-config.json
```json
{
  "browsers": ["chrome:headless"],
  "speed": 0.7,
  "assertionTimeout": 30000,
  "pageLoadTimeout": 30000,
  "screenshots": {
    "takeOnFails": true,
    "path": "screenshots/"
  }
}
```

### Jest Configuration (frontend/jest.config.js)
```js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/frontend/tests/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1',
  },
};
```

## Test Data

- **DNI fixtures** in `services/validation-service/tests/ocr-training/dni-nif/`
- **UI fixtures** in `frontend/tests/fixtures/` (JSON responses for Mock Service Worker)

## Debugging Failures

1. **Screenshots**: Check `screenshots/` directory.
2. **Verbose Logs**:
   ```bash
   npx testcafe chrome tests/e2e/dni-registration-flow.js --debug-on-fail
   ```
3. **Server health**:
   ```bash
   curl http://localhost:8000/api/health
   ```

## CI Integration

Add job in `.github/workflows/lint-test.yaml`:
```yaml
- name: Run UI and E2E tests
  run: |
    npm run dev:replit &
    npx wait-on tcp:5173 tcp:8000 && \
    npm run test:ui && \
    npx testcafe chrome:headless tests/e2e/**/*.js
```

## Best Practices

- **Isolation**: Reset DB state between test runs (`sqlx migrate redo --database-url $NEON_DATABASE_URL --clean`)
- **Fixtures**: Use MSW to mock external HTTP (RESTCountries, SOAP) in component tests
- **Timeouts**: Increase for OCR-heavy flows
- **Language Testing**: Run E2E in different locales using `?lang=es` or `?lang=en`

---
> **Note:** Update paths and ports if you change dev settings in `.replit` or `spin.toml`.
