import { test, expect } from '@playwright/test';
import routesData from '../mock-data/routes.json' with { type: 'json' };
import authData from '../mock-data/auth.json' with { type: 'json' };
import weatherData from '../mock-data/weather.json' with { type: 'json' };

test.describe('Feature 3: Mocking & Stubbing with page.route()', () => {
  test.describe('Mock Routes API', () => {
    test('should render route list from mocked API data', async ({ page }) => {
      // Intercept the routes API and return mock data
      await page.route('**/api/routes?*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(routesData),
        })
      );
      // Also match without query params
      await page.route('**/api/routes', (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(routesData),
          });
        }
        return route.continue();
      });

      await page.goto('/routes');

      // Verify both mock routes are rendered
      await expect(page.getByText('Kandy Lake Loop')).toBeVisible();
      await expect(page.getByText('Colombo Coastal Trail')).toBeVisible();

      // Verify route metadata is displayed
      await expect(page.getByText(/Kamal Perera/)).toBeVisible();
      await expect(page.getByText(/Nimal Silva/)).toBeVisible();
    });

    test('should display empty state when no routes exist', async ({ page }) => {
      // Mock API returning empty routes
      await page.route('**/api/routes**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              items: [],
              pagination: { currentPage: 1, totalPages: 0, totalItems: 0, limit: 10 },
            },
          }),
        })
      );

      await page.goto('/routes');

      await expect(page.getByText(/no routes found/i)).toBeVisible();
    });

    test('should handle API error gracefully', async ({ page }) => {
      // Mock API returning a server error
      await page.route('**/api/routes**', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Internal server error',
          }),
        })
      );

      await page.goto('/routes');

      // The app should handle errors gracefully (show error or empty state)
      // Verify it doesn't crash — the page should still be interactive
      await expect(page.getByRole('heading', { name: /cycling routes/i })).toBeVisible();
    });
  });

  test.describe('Mock Auth API — Login', () => {
    test('successful login should redirect to dashboard', async ({ page }) => {
      // Mock login success
      await page.route('**/api/auth/login', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(authData.loginSuccess),
        })
      );

      // Mock /auth/me for the authenticated redirect
      await page.route('**/api/auth/me', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(authData.me),
        })
      );

      // Mock dashboard data endpoints
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

      await page.goto('/login');
      await page.getByRole('textbox', { name: /email/i }).fill('kamal@example.com');
      await page.getByRole('textbox', { name: /password/i }).fill('Password123');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should redirect to dashboard after successful login
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test('failed login should show error toast', async ({ page }) => {
      // Mock login failure with 400 (not 401, to avoid refresh interceptor)
      await page.route('**/api/auth/login', (route) =>
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify(authData.loginFailure),
        })
      );

      await page.goto('/login');
      await page.getByRole('textbox', { name: /email/i }).fill('wrong@example.com');
      await page.getByRole('textbox', { name: /password/i }).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Toast notification should appear with error message
      await expect(page.getByText(/invalid email or password/i)).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Mock Routes API — Network Errors', () => {
    test('should handle network failure gracefully', async ({ page }) => {
      // Simulate a network failure by aborting the request
      await page.route('**/api/routes**', (route) => route.abort('connectionrefused'));

      await page.goto('/routes');

      // The page should still render without crashing
      await expect(page.getByRole('heading', { name: /cycling routes/i })).toBeVisible();
    });
  });

  test.describe('Mock Weather API', () => {
    test('should render weather widget with mocked data', async ({ page }) => {
      // Mock auth for accessing route detail page (unauthenticated)
      await page.route('**/api/auth/me', (route) =>
        route.fulfill({ status: 401, body: '{}' })
      );

      // Prevent 401 refresh interceptor from redirecting by mocking refresh too
      await page.route('**/api/auth/refresh', (route) =>
        route.fulfill({ status: 401, body: '{}' })
      );

      // Mock route detail — coordinates use {lat, lng} format (not GeoJSON)
      await page.route('**/api/routes/route1', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              route: {
                _id: 'route1',
                title: 'Kandy Lake Loop',
                description: 'A scenic ride around Kandy Lake.',
                difficulty: 'easy',
                surfaceType: 'paved',
                distance: 5.2,
                estimatedDuration: 25,
                startPoint: { lat: 7.2906, lng: 80.635 },
                endPoint: { lat: 7.2906, lng: 80.635 },
                waypoints: [],
                averageRating: 4.5,
                reviewCount: 12,
                isVerified: true,
                createdBy: { _id: 'user1', firstName: 'Kamal', lastName: 'Perera' },
                createdAt: '2025-11-15T10:30:00.000Z',
              },
            },
          }),
        })
      );

      // Mock reviews — hook expects data.data.items (not data.data.reviews)
      await page.route('**/api/reviews**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              items: [],
              pagination: { currentPage: 1, totalPages: 0, totalItems: 0, limit: 10 },
            },
          }),
        })
      );

      // Mock rides (active ride check)
      await page.route('**/api/rides/active', (route) =>
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'No active ride' }),
        })
      );

      // Mock weather endpoint
      await page.route('**/api/routes/route1/weather', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(weatherData),
        })
      );

      await page.goto('/routes/route1');

      // Verify weather data is rendered
      await expect(page.getByText('26°C')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/partly cloudy/i)).toBeVisible();
      await expect(page.getByText(/72%/)).toBeVisible();
      await expect(page.getByText(/8.5 km\/h/)).toBeVisible();
    });
  });
});
