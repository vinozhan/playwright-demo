export class HomePage {
  constructor(page) {
    this.page = page;
    this.heroHeading = page.getByRole('heading', { name: /cycle smarter/i });
    this.heroTagline = page.getByText(/ride safer/i);
    this.exploreRoutesLink = page.getByRole('link', { name: /explore routes/i }).first();
    this.getStartedLink = page.getByRole('link', { name: /get started/i });
    this.goToDashboardLink = page.getByRole('link', { name: /go to dashboard/i });
    this.featuresSection = page.getByText(/safe routes/i);
    this.navbar = page.getByRole('navigation');
    this.logo = page.getByRole('link', { name: /cyclesync/i }).first();
  }

  async goto() {
    await this.page.goto('/');
  }

  async clickExploreRoutes() {
    await this.exploreRoutesLink.click();
  }

  async clickGetStarted() {
    await this.getStartedLink.click();
  }

  async clickGoToDashboard() {
    await this.goToDashboardLink.click();
  }
}
