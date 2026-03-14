import { test, expect } from '../fixtures/auth.fixture.js';
import { HomePage } from '../pages/home.page.js';
import { DashboardPage } from '../pages/dashboard.page.js';

// ─── Setup / Teardown Hooks Demo ────────────────────────────────────

let testRunId;

test.beforeAll(async () => {
  // Runs once before all tests in this file — ideal for global setup
  testRunId = `run-${Date.now()}`;
  console.log(`[beforeAll] Starting test run: ${testRunId}`);
});

test.beforeEach(async ({ page }) => {
  // Runs before each test — useful for resetting state
  console.log(`[beforeEach] Preparing test environment`);
  // Example: clear any stale test data by intercepting API calls
  await page.route('**/api/users/*/stats', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          stats: {
            totalPoints: 150,
            ridesCompleted: 5,
            co2Saved: 12.5,
            routesCreated: 3,
            reportsSubmitted: 7,
            reviewsWritten: 2,
            totalDistance: 45.2,
            achievements: 1,
          },
        },
      }),
    })
  );
  await page.route('**/api/users/*/achievements', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { achievements: [] },
      }),
    })
  );
});

test.afterEach(async ({}, testInfo) => {
  // Runs after each test — useful for logging results or cleanup
  console.log(`[afterEach] Test "${testInfo.title}" finished: ${testInfo.status}`);
});

test.afterAll(async () => {
  // Runs once after all tests — ideal for global cleanup
  console.log(`[afterAll] Test run ${testRunId} complete`);
});

// ─── Tests Using Custom Fixtures ────────────────────────────────────

test.describe('Feature 2: Fixtures & Setup/Teardown', () => {
  test.describe('Authenticated User Fixture', () => {
    test('authenticated user sees "Go to Dashboard" on Home page', async ({
      authenticatedPage,
    }) => {
      const home = new HomePage(authenticatedPage);
      await home.goto();

      // Authenticated users should see the dashboard CTA instead of "Get Started"
      await expect(home.goToDashboardLink).toBeVisible();
    });

    test('authenticated user can access the dashboard', async ({
      authenticatedPage,
    }) => {
      const dashboard = new DashboardPage(authenticatedPage);
      await dashboard.goto();

      // Should not redirect to login — the dashboard should load
      await expect(authenticatedPage).toHaveURL(/\/dashboard/);
      await expect(dashboard.totalPoints).toBeVisible();
    });

    test('authenticated user sees their name in the navbar', async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto('/');

      // The navbar displays the user's first name
      await expect(authenticatedPage.getByText('Kamal')).toBeVisible();
    });
  });

  test.describe('Admin Fixture', () => {
    test('admin user sees Admin link in navigation', async ({ adminPage }) => {
      await adminPage.goto('/');

      // Admin users get an "Admin" link in the navbar — target the nav link specifically
      // (avoid matching the "AU Admin" profile link which also contains "admin")
      const adminLink = adminPage.getByRole('navigation').getByRole('link', { name: 'Admin', exact: true });
      await expect(adminLink).toBeVisible();
    });

    test('admin user can access the admin panel', async ({ adminPage }) => {
      await adminPage.goto('/admin');

      // Should not be redirected — admin panel should load
      await expect(adminPage).toHaveURL(/\/admin/);
    });
  });

  test.describe('Unauthenticated User Behavior', () => {
    test('unauthenticated user is redirected from dashboard to login', async ({
      page,
    }) => {
      await page.goto('/dashboard');

      // ProtectedRoute should redirect unauthenticated users to /login
      await expect(page).toHaveURL(/\/login/);
    });

    test('unauthenticated user sees "Get Started" on Home page', async ({
      page,
    }) => {
      const home = new HomePage(page);
      await home.goto();

      await expect(home.getStartedLink).toBeVisible();
    });
  });
});
