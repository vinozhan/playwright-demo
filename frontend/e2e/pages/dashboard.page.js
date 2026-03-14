export class DashboardPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /dashboard/i }).first();
    this.totalPoints = page.getByText(/total points/i);
    this.ridesCompleted = page.getByText(/rides completed/i);
    this.createRouteLink = page.getByRole('link', { name: /create route/i });
    this.reportHazardLink = page.getByRole('link', { name: /report hazard/i });
    this.exploreRoutesLink = page.getByRole('link', { name: /explore routes/i });
    this.welcomeMessage = page.getByText(/welcome to cyclesync/i);
  }

  async goto() {
    await this.page.goto('/dashboard');
  }
}
