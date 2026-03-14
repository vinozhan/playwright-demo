import { test, expect } from '@playwright/test';

/**
 * Real E2E Flow — runs against live frontend + backend (no mocks).
 *
 * Prerequisites:
 *   - MongoDB running and configured in backend/.env
 *   - Backend server on port 5000 (started by playwright.config.js webServer)
 *   - Frontend dev server on port 5173 (started by playwright.config.js webServer)
 *
 * This test contrasts with Feature 3 (mocking.spec.js) by hitting actual APIs.
 * It creates real data in the database, demonstrating a true end-to-end flow.
 */

test.describe('Real E2E Flow: Register -> Dashboard -> Logout -> Login', () => {
  // Generate unique credentials for each test run to avoid collisions
  const timestamp = Date.now();
  const testUser = {
    firstName: 'TestUser',
    lastName: 'E2E',
    email: `testuser+${timestamp}@e2etest.com`,
    password: 'TestPass123',
  };

  test('full user journey: register, dashboard, logout, login', async ({ page }) => {
    // ── Step 1: Register a new user ──
    await test.step('Register a new account', async () => {
      await page.goto('/register');
      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();

      await page.locator('input[name="firstName"]').fill(testUser.firstName);
      await page.locator('input[name="lastName"]').fill(testUser.lastName);
      await page.locator('input[name="email"]').fill(testUser.email);
      await page.locator('input[name="password"]').fill(testUser.password);
      await page.locator('input[name="confirmPassword"]').fill(testUser.password);

      await page.getByRole('button', { name: /create account/i }).click();

      // Should redirect to dashboard after successful registration
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    });

    // ── Step 2: Verify dashboard loads with user data ──
    await test.step('Verify dashboard displays user info', async () => {
      // User's name should appear in the welcome heading
      await expect(page.getByRole('heading', { name: new RegExp(`Welcome, ${testUser.firstName}`) })).toBeVisible({ timeout: 10000 });

      // Dashboard stats section should be visible
      await expect(page.getByText(/total points/i)).toBeVisible();

      // New user welcome message may appear
      const welcomeMessage = page.getByText(/welcome to cyclesync/i);
      // Soft assert since the welcome message depends on user state
      await expect.soft(welcomeMessage).toBeVisible();
    });

    // ── Step 3: Logout ──
    await test.step('Logout from the application', async () => {
      // Click the logout button in the navbar
      const logoutButton = page.getByRole('button', { name: /logout/i });
      await logoutButton.click();

      // Should redirect to home page or login
      await expect(page).toHaveURL(/\//, { timeout: 10000 });

      // Verify user is logged out — should see Login/Sign Up links
      await expect(page.getByRole('navigation').getByRole('link', { name: /login/i })).toBeVisible();
    });

    // ── Step 4: Login with the same credentials ──
    await test.step('Login with registered credentials', async () => {
      await page.goto('/login');

      await page.getByRole('textbox', { name: /email/i }).fill(testUser.email);
      await page.getByRole('textbox', { name: /password/i }).fill(testUser.password);
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should redirect to dashboard after successful login
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    });

    // ── Step 5: Verify dashboard again after login ──
    await test.step('Verify dashboard after re-login', async () => {
      await expect(page.getByRole('heading', { name: new RegExp(`Welcome, ${testUser.firstName}`) })).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/total points/i)).toBeVisible();
    });
  });
});
