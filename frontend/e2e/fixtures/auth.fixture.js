import { test as base } from '@playwright/test';
import authData from '../mock-data/auth.json' with { type: 'json' };

/**
 * Custom fixtures that extend Playwright's base test with authenticated page contexts.
 * Demonstrates test.extend(), page.route() for API mocking, and page.addInitScript()
 * for injecting localStorage tokens before navigation.
 */
export const test = base.extend({
  // Fixture: authenticated regular user page
  authenticatedPage: async ({ page }, use) => {
    // Mock the /auth/me endpoint to return a logged-in cyclist user
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(authData.me),
      })
    );

    // Inject the access token into localStorage before the page loads
    await page.addInitScript((token) => {
      window.localStorage.setItem('accessToken', token);
    }, authData.loginSuccess.data.accessToken);

    await use(page);
  },

  // Fixture: authenticated admin user page
  adminPage: async ({ page }, use) => {
    // Mock the /auth/me endpoint to return an admin user
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(authData.meAdmin),
      })
    );

    // Inject the access token into localStorage before the page loads
    await page.addInitScript((token) => {
      window.localStorage.setItem('accessToken', token);
    }, authData.loginSuccess.data.accessToken);

    await use(page);
  },
});

export { expect } from '@playwright/test';
