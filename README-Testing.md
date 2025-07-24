# DNI Registration Testing Guide

This guide covers comprehensive end-to-end testing for the Pilgrim Registration System with focus on DNI document processing and the complete registration flow.

## Prerequisites

1. **Server Running**: Ensure the application is running on `http://localhost:5000`
   ```bash
   npm run dev
   ```

2. **TestCafe Installed**: The testing framework is already installed
   ```bash
   npm list testcafe
   ```

3. **Test Assets**: DNI images are available in `attached_assets/` directory

## Test Files Overview

### 1. Complete E2E Test (`tests/dni-registration-flow.js`)
Comprehensive end-to-end test covering:
- ✅ Full registration flow from document upload to payment
- ✅ DNI OCR processing and data extraction
- ✅ Form validation and user interaction
- ✅ Payment processing simulation
- ✅ Bed assignment verification
- ✅ Government submission compliance
- ✅ Admin dashboard integration

### 2. Quick Validation Test (`test-dni-simple.js`)
Fast validation test focusing on:
- ✅ DNI document upload and OCR processing
- ✅ Basic form field population
- ✅ DNI format validation
- ✅ Error handling verification
- ✅ Responsive design check

## Running Tests

### Quick Test (Recommended for Development)
```bash
# Run simple DNI validation test
npx testcafe chrome test-dni-simple.js

# Run with visible browser (for debugging)
npx testcafe chrome test-dni-simple.js --debug-on-fail
```

### Complete End-to-End Test
```bash
# Run full registration flow test
npx testcafe chrome tests/dni-registration-flow.js

# Run with detailed reporting
npx testcafe chrome tests/dni-registration-flow.js --reporter spec,json:reports/test-results.json
```

### Automated Test Runner
```bash
# Use the custom test runner with health checks
node run-dni-tests.js
```

### Multiple Browser Testing
```bash
# Test across different browsers
npx testcafe chrome,firefox,edge tests/dni-registration-flow.js
```

## Test Configuration Options

### Basic Configuration (`testcafe-config.json`)
```json
{
  "browsers": ["chrome:headless"],
  "speed": 0.8,
  "screenshots": {
    "takeOnFails": true,
    "path": "screenshots/"
  },
  "assertionTimeout": 30000,
  "pageLoadTimeout": 30000
}
```

### Advanced Options
- **Debug Mode**: `--debug-on-fail` - Pause on test failures
- **Live Mode**: `--live` - Watch file changes and rerun tests
- **Video Recording**: Enabled in full test suite
- **Screenshot Capture**: Automatic on failures

## Test Data

### DNI Test Document
- **File**: `attached_assets/dni-españa-informatizado-1024x669_1753385962506.jpg`
- **Expected Data**: Spanish DNI with valid format (8 digits + letter)
- **OCR Processing**: ~15-30 seconds with Tesseract.js fallback

### Test Scenarios Covered

#### 1. Successful DNI Registration
```javascript
✅ Document upload and OCR processing
✅ Personal data extraction (name, DNI number, birth date)
✅ Form completion with extracted data
✅ Accommodation selection (dormitory/private)
✅ Payment processing simulation
✅ Bed assignment confirmation
✅ Government compliance submission
```

#### 2. Error Handling
```javascript
✅ Invalid document format rejection
✅ OCR processing failures
✅ Network connectivity issues
✅ Payment processing errors
✅ Bed availability constraints
```

#### 3. Validation Tests
```javascript
✅ DNI checksum validation (mod-23 algorithm)
✅ Email format validation
✅ Phone number format validation
✅ Date range validation
✅ Required field validation
```

## Debugging Test Failures

### 1. Screenshot Analysis
- Screenshots saved to `screenshots/` directory
- Organized by date/time and test case
- Captured automatically on failures

### 2. Console Logs
```bash
# Enable verbose logging
npx testcafe chrome test-dni-simple.js --debug-mode
```

### 3. Network Issues
```bash
# Check server health
curl http://localhost:5000/api/health

# Verify OCR endpoint
curl -X POST http://localhost:5000/api/ocr/dni \
  -H "Content-Type: application/json" \
  -d '{"fileData":"test"}'
```

### 4. Common Issues

#### OCR Processing Timeout
- **Cause**: Large image files or slow processing
- **Solution**: Increase `assertionTimeout` to 60000ms
- **Workaround**: Use smaller test images

#### Element Not Found
- **Cause**: Dynamic content loading or CSS selector changes
- **Solution**: Add wait conditions or update selectors
- **Debug**: Use browser developer tools to inspect elements

#### Payment Simulation Failures
- **Cause**: Missing payment form or validation errors
- **Solution**: Check payment integration configuration
- **Test**: Use test credit card numbers (4242424242424242)

## Performance Benchmarks

### Expected Processing Times
- **Page Load**: < 3 seconds
- **OCR Processing**: 15-30 seconds (local fallback)
- **AWS Lambda OCR**: 2-5 seconds (when available)
- **Form Validation**: < 1 second
- **Payment Processing**: 3-8 seconds
- **Complete Flow**: 2-5 minutes total

### Resource Usage
- **Memory**: ~100MB browser memory
- **Network**: ~2-5MB for document upload
- **Processing**: CPU intensive during OCR

## Continuous Integration

### GitHub Actions Setup
```yaml
name: DNI Registration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run dev &
      - run: npx testcafe chrome:headless tests/dni-registration-flow.js
```

### Test Reports
- **JSON Report**: `reports/test-results.json`
- **HTML Report**: Generated with custom reporter
- **Coverage**: Integration with test coverage tools

## Best Practices

### 1. Test Data Management
- Use consistent test documents
- Avoid real personal information
- Rotate test data regularly

### 2. Test Isolation
- Clear localStorage/sessionStorage between tests
- Reset database state if needed
- Use unique test identifiers

### 3. Assertions
- Use specific, meaningful assertion messages
- Test both positive and negative scenarios
- Verify visual elements and data accuracy

### 4. Maintenance
- Update selectors when UI changes
- Review test timeouts periodically
- Keep test documentation current

## Troubleshooting

### Server Not Responding
```bash
# Check if server is running
curl http://localhost:5000/api/health

# Restart server if needed
npm run dev
```

### TestCafe Installation Issues
```bash
# Reinstall TestCafe
npm uninstall testcafe
npm install testcafe

# Clear npm cache
npm cache clean --force
```

### Browser Issues
```bash
# Use different browser
npx testcafe firefox test-dni-simple.js

# Update browser
npx testcafe chrome:headless --version
```

For additional support, check the TestCafe documentation at [testcafe.io](https://testcafe.io/) or review the application logs for specific error details.