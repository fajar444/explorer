import { test, expect, type Page } from '@playwright/test';

const SCREENSHOT_DIR = 'tests/e2e/__screenshots__';

/**
 * Attach console-error / page-error / failed-request / 4xx-5xx listeners BEFORE
 * any navigation. The returned arrays accumulate problems so a test can assert
 * the app produced ZERO errors (including a favicon 404 or any other 4xx/5xx).
 */
function attachErrorGuards(page: Page): { consoleErrors: string[]; failed: string[] } {
  const consoleErrors: string[] = [];
  const failed: string[] = [];

  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => {
    consoleErrors.push(e.message);
  });
  page.on('requestfailed', (r) => {
    failed.push(`FAILED ${r.url()}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });

  return { consoleErrors, failed };
}

test.describe('Explorer end-to-end', () => {
  test('core flow with zero console errors and zero failed requests', async ({ page }) => {
    const { consoleErrors, failed } = attachErrorGuards(page);

    // --- 1. Load -----------------------------------------------------------
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Left tree shows the root folders (async load).
    await expect(page.getByText('Documents', { exact: true })).toBeVisible();
    await expect(page.getByText('Music', { exact: true })).toBeVisible();

    // Right panel starts on the "Select a folder" empty state.
    await expect(page.getByText('Select a folder')).toBeVisible();

    // --- 2. Select folder --------------------------------------------------
    await page.getByText('Documents', { exact: true }).click();

    const content = page.locator('.content-panel');
    // Children of Documents appear in the right panel.
    await expect(content.getByText('Projects', { exact: true })).toBeVisible();
    await expect(content.getByText('Work', { exact: true })).toBeVisible();
    await expect(content.getByText('Resume.pdf', { exact: true })).toBeVisible();

    // Breadcrumb reflects the current folder.
    const breadcrumb = page.locator('.breadcrumb');
    await expect(breadcrumb.getByText('Documents', { exact: true })).toBeVisible();

    // Screenshot: documents selected, light theme.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/light-documents.png`, fullPage: true });

    // --- 3. Expand a folder in the LEFT tree -------------------------------
    // Target the Music row's chevron (the expand toggle), not the row itself.
    const musicRow = page
      .locator('.tree-node__row')
      .filter({ hasText: 'Music' })
      .first();
    await musicRow.getByRole('button', { name: 'Expand' }).click();

    // The child folder "Artists" becomes visible in the LEFT tree.
    const tree = page.locator('.tree-panel');
    await expect(tree.getByText('Artists', { exact: true })).toBeVisible();

    // --- 4. Search ---------------------------------------------------------
    const search = page.getByRole('searchbox');
    await search.fill('music');
    // Search results banner appears with a count.
    const searchInfo = page.locator('.search-info');
    await expect(searchInfo).toBeVisible();
    await expect(searchInfo).toContainText(/result/i);
    // The Music result shows in the right panel.
    await expect(content.getByText('Music', { exact: true })).toBeVisible();

    // Now search for "resume" — Resume.pdf appears in results.
    await search.fill('resume');
    await expect(searchInfo).toContainText(/result/i);
    await expect(content.getByText('Resume.pdf', { exact: true })).toBeVisible();

    // --- 5. Clear search ---------------------------------------------------
    await search.fill('');
    // Banner disappears; we revert to the previously selected folder view.
    await expect(page.locator('.search-info')).toHaveCount(0);
    await expect(page.locator('.breadcrumb')).toBeVisible();

    // --- 6. Theme toggle ---------------------------------------------------
    const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(themeBefore).toBe('light');

    await page.getByRole('button', { name: /theme/i }).click();

    const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(themeAfter).toBe('dark');
    expect(themeAfter).not.toBe(themeBefore);

    // Re-select Documents so the dark screenshot mirrors the light one.
    await page.locator('.tree-node__row').filter({ hasText: 'Documents' }).first().click();
    await expect(content.getByText('Resume.pdf', { exact: true })).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/dark-documents.png`, fullPage: true });

    // --- Zero-error guard (CRITICAL) ---------------------------------------
    await page.waitForLoadState('networkidle');
    expect(consoleErrors).toEqual([]);
    expect(failed).toEqual([]);
  });

  test('no favicon 404 or any 4xx/5xx on initial load', async ({ page }) => {
    const { consoleErrors, failed } = attachErrorGuards(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tree must have rendered (proves the data flow worked, not just an empty page).
    await expect(page.getByText('Documents', { exact: true })).toBeVisible();

    expect(consoleErrors).toEqual([]);
    expect(failed).toEqual([]);
  });
});
