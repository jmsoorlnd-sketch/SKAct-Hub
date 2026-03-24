# Selenium Testing Setup Guide

This guide explains how to set up and run Selenium tests for the Barangay Management System.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Chrome Browser** installed
3. **ChromeDriver** (automatically installed via npm)

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npx mocha tests/auth.test.js --timeout 30000
npx mocha tests/eventScheduler.test.js --timeout 30000
npx mocha tests/messaging.test.js --timeout 30000
npx mocha tests/barangayStorage.test.js --timeout 30000
npx mocha tests/skPersonnel.test.js --timeout 30000
npx mocha tests/projectManagement.test.js --timeout 30000
npx mocha tests/adminMonitoring.test.js --timeout 30000
```

## Test Configuration

### Environment Setup
Before running tests, ensure:

1. **Backend Server** is running on `http://localhost:5000`
2. **Frontend Server** is running on `http://localhost:5173`
3. **Database** is properly configured and seeded with test data

### Test Data Requirements
The tests expect the following test accounts to exist:
- Admin: `admin@example.com` / `adminpass`
- User: `user@example.com` / `userpass`
- SK Personnel: `sk@example.com` / `skpass`

## Test Structure

### Test Files
- `auth.test.js` - User authentication tests
- `eventScheduler.test.js` - Event scheduling functionality
- `messaging.test.js` - Message system tests
- `barangayStorage.test.js` - File storage tests
- `skPersonnel.test.js` - SK personnel features
- `projectManagement.test.js` - Project management tests
- `adminMonitoring.test.js` - Admin dashboard tests

### Test Configuration
- **Timeout**: 30 seconds per test
- **Browser**: Chrome (headless mode)
- **Base URL**: `http://localhost:5173`

## Writing New Tests

### Basic Test Structure
```javascript
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('chai').assert;

describe('Feature Tests', function() {
    this.timeout(30000);
    let driver;

    before(async function() {
        const options = new chrome.Options();
        options.addArguments('--headless');
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    });

    after(async function() {
        if (driver) await driver.quit();
    });

    beforeEach(async function() {
        await loginAsUser(driver, 'user@example.com', 'userpass');
    });

    it('should perform action', async function() {
        // Test implementation
    });
});
```

### Helper Functions
- `loginAsUser(driver, email, password)` - Login as regular user
- `loginAsAdmin(driver, email, password)` - Login as admin
- `loginAsSKPersonnel(driver, email, password)` - Login as SK personnel

## Troubleshooting

### Common Issues

1. **ChromeDriver not found**
   - Ensure ChromeDriver is installed: `npm install chromedriver`
   - Check Chrome version compatibility

2. **Tests timeout**
   - Increase timeout in test file or command line
   - Check if servers are running and responsive

3. **Element not found**
   - Verify CSS selectors match actual DOM elements
   - Add wait conditions for dynamic content

4. **Database connection issues**
   - Ensure backend is running and database is accessible
   - Check test data exists

### Debug Mode
Run tests without headless mode to see browser actions:
```javascript
// Remove this line from before() hook:
options.addArguments('--headless');
```

## Best Practices

1. **Use descriptive test names** that explain what is being tested
2. **Add appropriate wait conditions** for dynamic content
3. **Clean up test data** after tests complete
4. **Use data-testid attributes** for reliable element selection
5. **Group related tests** in describe blocks
6. **Handle async operations** properly with await

## CI/CD Integration

To run tests in CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Selenium Tests
  run: |
    cd frontend
    npm install
    npm test
  env:
    CI: true
```

## Contributing

When adding new tests:
1. Follow the existing naming convention
2. Add appropriate assertions
3. Include error handling
4. Update this documentation if needed