import { test, expect, type Page } from '@playwright/test';

const SCREENSHOT_DIR = 'tests/e2e/__screenshots__';

/**
 * Attach console-error / page-error / failed-request / 4xx-5xx listeners BEFORE
 * any navigation. The returned arrays accumulate problems so a test can assert
 * the app produced ZERO errors (including a favicon 404 or any other 4xx/5xx).
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
const treePanel = (page: Page) => page.locator('.tree-panel');

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

test.describe('File manager — Phase 2 end-to-end', () => {
  // ---------------------------------------------------------------------------
  // 1. Create folder + rename
  // ---------------------------------------------------------------------------
  test('create a folder, then rename it', async ({ page }) => {
    const { consoleErrors, failed } = attachGuards(page);

    await page.goto('/');
    await waitForApp(page);

    // Open Documents (loads its children into the right panel + makes it the
    // active folder, so a new folder is created INSIDE Documents).
    await openFolderInTree(page, 'Documents');
    await expect(card(page, 'Projects')).toBeVisible();
    await expect(card(page, 'Resume.pdf')).toBeVisible();

    // --- New Folder via the tree-header button ---
    await treePanel(page).getByRole('button', { name: 'New folder' }).click();

    const newFolderDialog = page.getByRole('dialog');
    await expect(newFolderDialog.getByText('New Folder', { exact: true })).toBeVisible();

    const nameInput = page.getByRole('textbox', { name: 'Folder name' });
    await nameInput.fill('E2E_NewFolder');
    await page.getByRole('button', { name: 'Create' }).click();

    // The created folder shows up in the right panel.
    await expect(card(page, 'E2E_NewFolder')).toBeVisible({ timeout: 10_000 });

    // --- Rename via the context menu ---
    await card(page, 'E2E_NewFolder').click({ button: 'right' });
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await menu.getByRole('menuitem', { name: 'Rename' }).click();

    const renameDialog = page.getByRole('dialog');
    await expect(renameDialog.getByText('Rename', { exact: true })).toBeVisible();
    const renameInput = page.getByRole('textbox', { name: 'New name' });
    await renameInput.fill('E2E_Renamed');
    await page.getByRole('button', { name: 'Save' }).click();

    // Renamed folder appears; old name is gone.
    await expect(card(page, 'E2E_Renamed')).toBeVisible({ timeout: 10_000 });
    await expect(card(page, 'E2E_NewFolder')).toHaveCount(0);

    // --- Zero-error guard ---
    await page.waitForLoadState('networkidle');
    expect(consoleErrors).toEqual([]);
    expect(failed).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // 2. Multi-select + delete + recycle-bin restore
  // ---------------------------------------------------------------------------
  test('multi-select two items, delete, then restore one from the recycle bin', async ({
    page,
  }) => {
    const { consoleErrors, failed } = attachGuards(page);

    await page.goto('/');
    await waitForApp(page);

    await openFolderInTree(page, 'Documents');
    await expect(card(page, 'Personal')).toBeVisible();
    await expect(card(page, 'Projects')).toBeVisible();

    // Select one, Ctrl-click the second → SelectionBar shows "2 selected".
    await card(page, 'Personal').click();
    await card(page, 'Projects').click({ modifiers: ['Control'] });

    const selectionBar = page.locator('.selection-bar');
    await expect(selectionBar).toBeVisible();
    await expect(selectionBar).toContainText('2 selected');

    // Screenshot deliverable: selection + SelectionBar visible.
    await page.screenshot({ path: `${SCREENSHOT_DIR}/phase2-selection.png`, fullPage: true });

    // Delete → confirm in the modal.
    await selectionBar.getByRole('button', { name: 'Delete' }).click();
    const confirm = page.getByRole('dialog');
    await expect(confirm.getByText('Move to Recycle Bin')).toBeVisible();
    await confirm.getByRole('button', { name: 'Move to Bin' }).click();

    // Both items leave the grid.
    await expect(card(page, 'Personal')).toHaveCount(0, { timeout: 10_000 });
    await expect(card(page, 'Projects')).toHaveCount(0, { timeout: 10_000 });

    // --- Open the Recycle Bin ---
    await treePanel(page).getByRole('button', { name: 'Recycle Bin' }).click();
    const trash = page.locator('.trash-view');
    await expect(trash).toBeVisible();

    const trashRow = (name: string) =>
      trash.locator('.trash-row').filter({
        has: page.locator('.trash-row__name', { hasText: name }),
      });

    await expect(trashRow('Personal')).toBeVisible({ timeout: 10_000 });
    await expect(trashRow('Projects')).toBeVisible();

    // Screenshot deliverable: Recycle Bin view.
    await page.screenshot({ path: `${SCREENSHOT_DIR}/phase2-recycle-bin.png`, fullPage: true });

    // Select one trash item → Restore → it leaves the bin.
    await trashRow('Personal').click();
    const trashBulk = trash.locator('.trash-view__bulk');
    await expect(trashBulk).toBeVisible();
    await expect(trashBulk).toContainText('1 selected');
    await trashBulk.getByRole('button', { name: 'Restore' }).click();

    await expect(trashRow('Personal')).toHaveCount(0, { timeout: 10_000 });
    // Projects is still in the bin.
    await expect(trashRow('Projects')).toBeVisible();

    // --- Zero-error guard ---
    await page.waitForLoadState('networkidle');
    expect(consoleErrors).toEqual([]);
    expect(failed).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // 3. Copy / paste via the context menu
  // ---------------------------------------------------------------------------
  test('copy a folder and paste it into a different folder', async ({ page }) => {
    const { consoleErrors, failed } = attachGuards(page);

    await page.goto('/');
    await waitForApp(page);

    await openFolderInTree(page, 'Documents');
    await expect(card(page, 'Work')).toBeVisible();

    // Right-click the folder → Copy.
    await card(page, 'Work').click({ button: 'right' });
    let menu = page.getByRole('menu');
    await expect(menu).toBeVisible();

    // Screenshot deliverable: context menu open.
    await page.screenshot({ path: `${SCREENSHOT_DIR}/phase2-context-menu.png`, fullPage: true });

    await menu.getByRole('menuitem', { name: 'Copy' }).click();
    await expect(menu).toHaveCount(0);

    // Navigate to Downloads via the tree.
    await openFolderInTree(page, 'Downloads');
    // Downloads exists in the seed; wait for the panel to settle on it.
    await expect(content(page).locator('.breadcrumb')).toContainText('Downloads');
    // Downloads should not already contain a "Work" copy.
    await expect(card(page, 'Work')).toHaveCount(0);

    // Right-click empty content-panel space (the scroll area below the cards) →
    // Paste. The body is large; its bottom region is reliably free of cards.
    const body = content(page).locator('.content-panel__body');
    const box = await body.boundingBox();
    if (!box) throw new Error('content body not measured');
    await body.click({
      button: 'right',
      position: { x: box.width - 20, y: box.height - 20 },
    });
    menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await menu.getByRole('menuitem', { name: 'Paste' }).click();

    // The pasted copy appears in Downloads.
    await expect(card(page, 'Work')).toBeVisible({ timeout: 10_000 });

    // --- Zero-error guard ---
    await page.waitForLoadState('networkidle');
    expect(consoleErrors).toEqual([]);
    expect(failed).toEqual([]);
  });
});
