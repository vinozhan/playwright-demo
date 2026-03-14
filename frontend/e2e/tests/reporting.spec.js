import { test, expect } from '@playwright/test';

test.describe('Feature 4: Test Reporting', () => {
  test('structured test steps for HTML report hierarchy', async ({ page }) => {
    // test.step() creates collapsible sections in the HTML report
    await test.step('Navigate to the home page', async () => {
      await page.goto('/');
      await expect(page).toHaveURL('/');
    });

    await test.step('Verify hero section content', async () => {
      // Target the h1 hero heading specifically to avoid matching the h2 "Ready to ride safer?"
      const heroHeading = page.getByRole('heading', { level: 1 });
      await expect(heroHeading).toContainText(/cycle smarter/i);
      await expect(heroHeading).toContainText(/ride safer/i);
    });

    await test.step('Check navigation elements', async () => {
      const navbar = page.getByRole('navigation');
      await expect(navbar).toBeVisible();

      await expect(navbar.getByRole('link', { name: 'Routes' })).toBeVisible();
      await expect(navbar.getByRole('link', { name: 'Reports' })).toBeVisible();
    });

    await test.step('Navigate to routes page', async () => {
      await page.getByRole('navigation').getByRole('link', { name: 'Routes' }).click();
      await expect(page).toHaveURL(/\/routes/);
      await expect(page.getByRole('heading', { name: /cycling routes/i })).toBeVisible();
    });
  });

  test('custom annotations for test metadata', async ({ page }) => {
    // Annotations appear in the HTML report as metadata tags
    test.info().annotations.push(
      { type: 'feature', description: 'Home Page' },
      { type: 'severity', description: 'critical' },
      { type: 'owner', description: 'QA Team' }
    );

    await page.goto('/');
    await expect(page.getByText(/cycle smarter/i)).toBeVisible();
  });

  test('manual screenshot attachments in report', async ({ page }) => {
    await page.goto('/');

    // Attach a labeled screenshot manually — shows in HTML report under "Attachments"
    const screenshot = await page.screenshot();
    await test.info().attach('home-page-loaded', {
      body: screenshot,
      contentType: 'image/png',
    });

    // Navigate and capture another screenshot
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    const loginScreenshot = await page.screenshot();
    await test.info().attach('login-page-loaded', {
      body: loginScreenshot,
      contentType: 'image/png',
    });
  });

  test('soft assertions for non-fatal checks', async ({ page }) => {
    await page.goto('/');

    // expect.soft() continues the test even if the assertion fails
    // All soft assertion failures are collected and reported at the end
    const heroHeading = page.getByRole('heading', { level: 1 });
    await expect.soft(heroHeading).toContainText(/cycle smarter/i);
    await expect.soft(heroHeading).toContainText(/ride safer/i);

    // Use heading role to avoid matching duplicates in community stats
    await expect.soft(page.getByRole('heading', { name: 'Safe Routes' })).toBeVisible();
    await expect.soft(page.getByRole('heading', { name: 'Hazard Reports' })).toBeVisible();
    await expect.soft(page.getByRole('heading', { name: 'Earn Rewards' })).toBeVisible();

    // Verify community stats with soft assertions — none will halt the test
    await expect.soft(page.getByText('500+')).toBeVisible();
    await expect.soft(page.getByText(/Active Cyclists/)).toBeVisible();
    await expect.soft(page.getByText('120+')).toBeVisible();
  });
});
