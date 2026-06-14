import { test, expect, type Page } from '@playwright/test';

const SCREENSHOT_DIR = 'tests/e2e/__screenshots__';

/**
 * Attach console-error / page-error / failed-request / 4xx-5xx listeners BEFORE
 * any navigation. The returned arrays accumulate problems so the main test can
 * assert the app produced ZERO errors.
 *
 * NOTE: file `/content` streaming responses come back 200 (and may be 206 for
 * range requests) — those are fine. Only status >= 400 is recorded as a failure.
 */
function attachGuards(page: Page): { consoleErrors: string[]; failed: string[] } {
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

// --- shared locators / helpers ----------------------------------------------

const content = (page: Page) => page.locator('.content-panel');
const grid = (page: Page) => page.locator('.node-grid');
const previewPanel = (page: Page) => page.locator('.preview-panel');

/** A right-panel card by its visible name. */
function card(page: Page, name: string) {
  return grid(page)
    .locator('.node-card')
    .filter({ has: page.locator('.node-card__name', { hasText: name }) });
}

/** A left-tree row by its visible name (first match). */
function treeRow(page: Page, name: string) {
  return page.locator('.tree-node__row').filter({ hasText: name }).first();
}

/** Open a folder by single-clicking its row in the left tree. */
async function openFolderInTree(page: Page, name: string): Promise<void> {
  await treeRow(page, name).click();
}

/** Wait for the app shell + tree to be ready after navigation. */
async function waitForApp(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Documents', { exact: true })).toBeVisible();
}

test.describe('Real-file UI — Phase 3 end-to-end', () => {
  // ---------------------------------------------------------------------------
  // Main flow: preview text + image + toggle, with the zero-error guard.
  // ---------------------------------------------------------------------------
  test('preview text + image + toggle (zero-error guard)', async ({ page }) => {
    const { consoleErrors, failed } = attachGuards(page);

    await page.goto('/');
    await waitForApp(page);

    // Open Documents — its real files (welcome.txt, pixel.png) load into the grid.
    await openFolderInTree(page, 'Documents');
    await expect(card(page, 'welcome.txt')).toBeVisible();
    await expect(card(page, 'pixel.png')).toBeVisible();

    // --- 1. Preview text -----------------------------------------------------
    await card(page, 'welcome.txt').dblclick();

    // The PreviewPanel (third column) appears with the text contents.
    await expect(previewPanel(page)).toBeVisible({ timeout: 10_000 });
    await expect(previewPanel(page).getByText('Welcome to Explorer!')).toBeVisible({
      timeout: 10_000,
    });
    // Header reflects the previewed file.
    await expect(previewPanel(page).locator('.preview-panel__name')).toHaveText('welcome.txt');

    // Screenshot deliverable: text preview open.
    await page.screenshot({ path: `${SCREENSHOT_DIR}/phase3-preview-text.png`, fullPage: true });

    // --- 2. Preview image ----------------------------------------------------
    await card(page, 'pixel.png').dblclick();

    // An <img> pointing at the real content endpoint renders in the preview.
    const previewImg = previewPanel(page).locator('img.preview-panel__image');
    await expect(previewImg).toBeVisible({ timeout: 10_000 });
    const imgSrc = await previewImg.getAttribute('src');
    expect(imgSrc).toContain('/nodes/');
    expect(imgSrc).toContain('/content');
    // The image actually decoded (non-zero natural dimensions).
    await expect
      .poll(async () => previewImg.evaluate((el: HTMLImageElement) => el.naturalWidth), {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);

    // Screenshot deliverable: image preview open.
    await page.screenshot({ path: `${SCREENSHOT_DIR}/phase3-preview-image.png`, fullPage: true });

    // --- 3. Preview toggle ---------------------------------------------------
    // The header eye button hides the preview column, then shows it again.
    // Scope to the banner so we don't also match the PreviewPanel's own
    // "Close preview" button.
    const previewToggle = page
      .getByRole('banner')
      .getByRole('button', { name: /preview/i });
    await expect(previewToggle).toBeEnabled();

    await previewToggle.click();
    await expect(previewPanel(page)).toBeHidden({ timeout: 5_000 });

    await previewToggle.click();
    await expect(previewPanel(page)).toBeVisible({ timeout: 5_000 });
    // Same file still previewed after re-showing.
    await expect(previewPanel(page).locator('.preview-panel__name')).toHaveText('pixel.png');

    // --- Zero-error guard (CRITICAL) ----------------------------------------
    await page.waitForLoadState('networkidle');
    expect(consoleErrors).toEqual([]);
    expect(failed).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // Extract: right-click sample.zip → "Extract here" → entries appear.
  // ---------------------------------------------------------------------------
  test('extract sample.zip in Downloads surfaces its entries', async ({ page }) => {
    const { consoleErrors, failed } = attachGuards(page);

    await page.goto('/');
    await waitForApp(page);

    await openFolderInTree(page, 'Downloads');
    await expect(content(page).locator('.breadcrumb')).toContainText('Downloads');
    await expect(card(page, 'sample.zip')).toBeVisible();

    // Right-click the archive → context menu with "Extract here".
    await card(page, 'sample.zip').click({ button: 'right' });
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await menu.getByRole('menuitem', { name: /extract here/i }).click();

    // The extracted top-level entry (readme.txt) shows up in the Downloads grid.
    await expect(card(page, 'readme.txt')).toBeVisible({ timeout: 15_000 });

    // Screenshot deliverable: Downloads after extracting sample.zip.
    await page.screenshot({ path: `${SCREENSHOT_DIR}/phase3-extract.png`, fullPage: true });

    // --- Zero-error guard ---
    await page.waitForLoadState('networkidle');
    expect(consoleErrors).toEqual([]);
    expect(failed).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // Upload: feed the hidden <input type=file> a Buffer-backed file.
  // ---------------------------------------------------------------------------
  test('upload a file via the hidden input appears in the grid', async ({ page }) => {
    const { consoleErrors, failed } = attachGuards(page);

    await page.goto('/');
    await waitForApp(page);

    // Upload into Documents/Work (a folder with no real files, so the new one is
    // obvious). Work is nested, so open Documents first, then navigate into Work
    // by double-clicking its folder card.
    await openFolderInTree(page, 'Documents');
    await expect(card(page, 'Work')).toBeVisible();
    await card(page, 'Work').dblclick();
    await expect(content(page).locator('.breadcrumb')).toContainText('Work');

    const UPLOAD_NAME = 'e2e-upload.txt';

    // The hidden multiple file input lives in the content header.
    const fileInput = page.locator('input[type=file]');
    await fileInput.setInputFiles({
      name: UPLOAD_NAME,
      mimeType: 'text/plain',
      buffer: Buffer.from('uploaded by playwright e2e\n'),
    });

    // The uploaded file appears in the grid.
    await expect(card(page, UPLOAD_NAME)).toBeVisible({ timeout: 15_000 });

    // --- Zero-error guard ---
    await page.waitForLoadState('networkidle');
    expect(consoleErrors).toEqual([]);
    expect(failed).toEqual([]);
  });
});
