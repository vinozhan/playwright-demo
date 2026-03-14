import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page.js';
import { LoginPage } from '../pages/login.page.js';

test.describe('Feature 1: Playwright Assertions', () => {
  test.describe('Home Page Assertions', () => {
    test('should have the correct title and URL', async ({ page }) => {
      await page.goto('/');

      await expect(page).toHaveURL('/');
      await expect(page).toHaveTitle(/CycleSync/i);
    });

    test('should display the hero section with correct content', async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      // toBeVisible — hero heading is rendered and visible
      await expect(home.heroHeading).toBeVisible();

      // toContainText — tagline contains expected text
      await expect(page.locator('body')).toContainText('Cycle smarter');
      await expect(page.locator('body')).toContainText('ride safer');
    });

    test('should display feature cards', async ({ page }) => {
      await page.goto('/');

      // Use heading role to avoid matching the duplicate text in community stats section
      await expect(page.getByRole('heading', { name: 'Safe Routes' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Hazard Reports' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Earn Rewards' })).toBeVisible();
    });

    test('should display community stats', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByText('500+')).toBeVisible();
      await expect(page.getByText(/Active Cyclists/)).toBeVisible();
    });

    test('should show navigation links', async ({ page }) => {
      await page.goto('/');

      const navbar = page.getByRole('navigation');
      await expect(navbar).toBeVisible();

      await expect(navbar.getByRole('link', { name: 'Routes' })).toBeVisible();
      await expect(navbar.getByRole('link', { name: 'Reports' })).toBeVisible();
      await expect(navbar.getByRole('link', { name: 'Rewards' })).toBeVisible();
    });
  });

  test.describe('Login Form Assertions', () => {
    test('should have editable and empty form fields', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      // toBeEditable — inputs accept user input
      await expect(loginPage.emailInput).toBeEditable();
      await expect(loginPage.passwordInput).toBeEditable();

      // toBeEmpty — fields start empty
      await expect(loginPage.emailInput).toBeEmpty();
      await expect(loginPage.passwordInput).toBeEmpty();

      // toBeEnabled — submit button is interactive
      await expect(loginPage.submitButton).toBeEnabled();
    });

    test('should reflect typed values in form fields', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.emailInput.fill('test@example.com');
      await loginPage.passwordInput.fill('password123');

      // toHaveValue — input value matches what was typed
      await expect(loginPage.emailInput).toHaveValue('test@example.com');
      await expect(loginPage.passwordInput).toHaveValue('password123');
    });

    test('should display the sign in heading', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await expect(loginPage.heading).toBeVisible();
      await expect(loginPage.heading).toHaveText(/Sign in to CycleSync/i);
    });
  });

  test.describe('Register Form Validation Assertions', () => {
    test('should show password validation errors', async ({ page }) => {
      await page.goto('/register');

      const passwordInput = page.locator('input[name="password"]');
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');

      // Type a short password to trigger validation
      await passwordInput.fill('short');
      // Click away or move to next field to trigger validation
      await confirmPasswordInput.click();

      // toBeVisible — validation error message is displayed
      const shortError = page.getByText(/must be at least 8 characters/i);
      await expect(shortError).toBeVisible();
    });

    test('should show password mismatch error', async ({ page }) => {
      await page.goto('/register');

      const passwordInput = page.locator('input[name="password"]');
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');

      await passwordInput.fill('ValidPass1');
      await confirmPasswordInput.fill('DifferentPass1');
      // Click away to trigger validation
      await page.locator('input[name="email"]').click();

      const mismatchError = page.getByText(/passwords do not match/i);
      await expect(mismatchError).toBeVisible();
    });
  });

  test.describe('Boundary Tests — Password Length', () => {
    test('should reject password with exactly 7 characters (below minimum)', async ({ page }) => {
      await page.goto('/register');

      const passwordInput = page.locator('input[name="password"]');
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');

      // Boundary: 7 chars — just below the 8-char minimum
      await passwordInput.fill('Abcde1x');
      await confirmPasswordInput.click();

      await expect(page.getByText(/must be at least 8 characters/i)).toBeVisible();
    });

    test('should accept password with exactly 8 characters (at minimum boundary)', async ({ page }) => {
      await page.goto('/register');

      const passwordInput = page.locator('input[name="password"]');
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');

      // Boundary: exactly 8 chars with uppercase, lowercase, and number
      await passwordInput.fill('Abcdef1x');
      await confirmPasswordInput.click();

      // No validation error should appear — the password hint text should remain
      await expect(page.getByText(/must be at least 8 characters/i)).not.toBeVisible();
      await expect(page.getByText(/must include an uppercase letter/i)).not.toBeVisible();
    });

    test('should reject 8-char password missing uppercase letter', async ({ page }) => {
      await page.goto('/register');

      const passwordInput = page.locator('input[name="password"]');
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');

      // 8 chars, has lowercase and number, but no uppercase
      await passwordInput.fill('abcdefg1');
      await confirmPasswordInput.click();

      await expect(page.getByText(/must include an uppercase letter/i)).toBeVisible();
    });

    test('should reject 8-char password missing lowercase letter', async ({ page }) => {
      await page.goto('/register');

      const passwordInput = page.locator('input[name="password"]');
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');

      // 8 chars, has uppercase and number, but no lowercase
      await passwordInput.fill('ABCDEFG1');
      await confirmPasswordInput.click();

      await expect(page.getByText(/must include a lowercase letter/i)).toBeVisible();
    });

    test('should reject 8-char password missing a number', async ({ page }) => {
      await page.goto('/register');

      const passwordInput = page.locator('input[name="password"]');
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]');

      // 8 chars, has uppercase and lowercase, but no number
      await passwordInput.fill('Abcdefgh');
      await confirmPasswordInput.click();

      await expect(page.getByText(/must include a number/i)).toBeVisible();
    });
  });

  test.describe('Negative Tests — Invalid Input & Error Handling', () => {
    test('should show invalid email error for malformed email', async ({ page }) => {
      await page.goto('/register');

      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');

      // Type an email without a domain
      await emailInput.fill('notanemail');
      await passwordInput.click();

      await expect(page.getByText(/invalid email address/i)).toBeVisible();
    });

    test('should show invalid email error for email missing TLD', async ({ page }) => {
      await page.goto('/register');

      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');

      // Email with @ but no valid TLD
      await emailInput.fill('user@domain');
      await passwordInput.click();

      await expect(page.getByText(/invalid email address/i)).toBeVisible();
    });

    test('should not submit login form with empty required fields', async ({ page }) => {
      await page.goto('/login');

      // Click submit without filling any fields — HTML required should prevent submission
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should remain on login page (form not submitted)
      await expect(page).toHaveURL(/\/login/);
    });

    test('should not submit register form with empty required fields', async ({ page }) => {
      await page.goto('/register');

      // Click submit without filling any fields
      await page.getByRole('button', { name: /create account/i }).click();

      // Should remain on register page
      await expect(page).toHaveURL(/\/register/);
    });
  });

  test.describe('Navigation Assertions', () => {
    test('should navigate to routes page from home', async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await home.clickExploreRoutes();
      await expect(page).toHaveURL(/\/routes/);
    });

    test('should navigate to login from home "Get Started"', async ({ page }) => {
      const home = new HomePage(page);
      await home.goto();

      await home.clickGetStarted();
      await expect(page).toHaveURL(/\/register/);
    });

    test('should navigate from login to register via sign up link', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      // Use the form's "Sign up" link (inside main content), not the navbar/footer ones
      await loginPage.signUpLink.click();
      await expect(page).toHaveURL(/\/register/);
    });
  });

  test.describe('404 Page Assertions', () => {
    test('should display 404 page for unknown routes', async ({ page }) => {
      await page.goto('/this-page-does-not-exist');

      await expect(page.getByText(/wrong turn/i)).toBeVisible();
      await expect(page.getByText(/doesn't exist/i)).toBeVisible();
    });

    test('should have "Back to Home" link with correct href', async ({ page }) => {
      await page.goto('/nonexistent-page');

      const backLink = page.getByRole('link', { name: /back to home/i });
      await expect(backLink).toBeVisible();

      // toHaveAttribute — verify the link points to the home page
      await expect(backLink).toHaveAttribute('href', '/');
    });

    test('should have quick links to main sections', async ({ page }) => {
      await page.goto('/nonexistent');

      // Target the quick links section in main content specifically
      const main = page.getByRole('main');
      await expect(main.getByRole('link', { name: /browse routes/i })).toHaveAttribute('href', '/routes');
      await expect(main.getByRole('link', { name: /safety reports/i })).toHaveAttribute('href', '/reports');
      await expect(main.getByRole('link', { name: 'Rewards' })).toHaveAttribute('href', '/rewards');
    });
  });
});
