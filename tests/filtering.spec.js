import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Increase timeout for actions
test.setTimeout(60000);

test.describe('CSV Filtering App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load the app and show upload zone', async ({ page }) => {
    await expect(page.getByText('Advanced CSV Filtering')).toBeVisible();
    await expect(page.getByText(/Drag and drop your file here/i)).toBeVisible();
  });

  test('should upload a CSV and display data', async ({ page }) => {
    const csvPath = path.resolve('guests.csv');

    // Create the file if it doesn't exist for some reason in CI
    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, 'id,name,email,category\n1,Tom,tom@example.com,VIP\n2,Jane,jane@example.com,Standard');
    }

    // Upload file
    await page.locator('input[type="file"]').setInputFiles(csvPath);

    // Wait for table to appear
    await page.waitForSelector('table');

    // Verify header appears - WITHOUT table prefix when only one table is loaded
    await expect(page.locator('th').filter({ hasText: 'name' })).toBeVisible();
    // Verify data appears
    await expect(page.locator('td').filter({ hasText: 'Tom' }).first()).toBeVisible();
  });

  test('should filter data based on condition', async ({ page }) => {
    // Upload file first
    await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
    await page.waitForSelector('table');

    // Add filter
    await page.getByRole('button', { name: /Condition/i }).click();

    // Wait for the condition row to appear and use more specific selectors
    await page.locator('.border-gray-300.dark\\:border-gray-600').first().waitFor();

    // Set condition: name contains "Jane" - use specific selectors within the filter section
    const filterSection = page.locator('.bg-white.dark\\:bg-gray-800').filter({ has: page.locator('select').first() }).first();
    await filterSection.locator('select').first().selectOption('name');
    await filterSection.locator('select').nth(1).selectOption('contains');
    await page.getByPlaceholder(/unique values|Enter text/i).fill('Jane');

    // Wait for filter to take effect
    await page.waitForTimeout(500);

    // Verify "Jane" is visible
    await expect(page.locator('td').filter({ hasText: 'Jane' }).first()).toBeVisible();

    // Check Tom is not visible - use locator count
    const tomCells = page.locator('td').filter({ hasText: /^Tom$/ });
    await expect(tomCells).toHaveCount(0);
  });

  test('should respect case sensitivity toggle', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
    await page.waitForSelector('table');

    await page.getByRole('button', { name: /Condition/i }).click();
    await page.locator('.border-gray-300.dark\\:border-gray-600').first().waitFor();

    // Default: Case Insensitive - "tom" should match "Tom"
    const filterSection = page.locator('.bg-white.dark\\:bg-gray-800').filter({ has: page.locator('select').first() }).first();
    await filterSection.locator('select').first().selectOption('name');
    await filterSection.locator('select').nth(1).selectOption('contains');
    await page.getByPlaceholder(/unique values|Enter text/i).fill('tom');
    await page.waitForTimeout(500);

    await expect(page.locator('td').filter({ hasText: 'Tom' }).first()).toBeVisible();

    // Toggle Case Sensitive
    await page.getByRole('button', { name: /Match Case/i }).click();
    await page.waitForTimeout(500);

    // Tom should be filtered out now
    const tomCells = page.locator('td').filter({ hasText: /^Tom$/ });
    await expect(tomCells).toHaveCount(0);

    // Change value to "Tom"
    await page.getByPlaceholder(/unique values|Enter text/i).fill('Tom');
    await page.waitForTimeout(500);
    await expect(page.locator('td').filter({ hasText: 'Tom' }).first()).toBeVisible();
  });

  test('should filter mixed date and datetime values by calendar date', async ({ page }) => {
    const csvContent = [
      'id,date_submitted',
      'a,1/1/2025',
      'b,1/1/2025 23:30:00',
      'c,1/2/2025 00:10:00',
    ].join('\n');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'mixed_dates.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent, 'utf-8'),
    });
    await page.waitForSelector('table');

    // Add filter
    await page.getByRole('button', { name: /Condition/i }).click();
    await page.locator('select').first().waitFor();

    // date_submitted is detected as a date column and uses a date picker input.
    await page.locator('select').first().selectOption('date_submitted');
    await page.locator('select').nth(1).selectOption('is before');
    await page.locator('input[type="date"]').fill('2025-01-02');

    await page.waitForTimeout(500);

    // Rows a and b are on 1/1/2025 (b has a time component) and must remain.
    await expect(page.locator('td').filter({ hasText: /^a$/ }).first()).toBeVisible();
    await expect(page.locator('td').filter({ hasText: /^b$/ }).first()).toBeVisible();

    // Row c is 1/2/2025 and should be filtered out.
    await expect(page.locator('td').filter({ hasText: /^c$/ })).toHaveCount(0);
  });

  test('should support date operators is on / is not on', async ({ page }) => {
    const csvContent = [
      'id,date_submitted',
      'a,1/1/2025',
      'b,1/1/2025 11:31:53 AM',
      'c,1/2/2025 00:10:00',
    ].join('\n');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'mixed_dates_on.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent, 'utf-8'),
    });
    await page.waitForSelector('table');

    await page.getByRole('button', { name: /Condition/i }).click();
    await page.locator('.border-gray-300.dark\\:border-gray-600').first().waitFor();

    const filterSection = page.locator('.bg-white.dark\\:bg-gray-800').filter({ has: page.locator('select').first() }).first();
    await filterSection.locator('select').first().selectOption('date_submitted');
    await filterSection.locator('select').nth(1).selectOption('is on');
    await page.locator('input[type="date"]').fill('2025-01-01');
    await page.waitForTimeout(500);

    await expect(page.locator('td').filter({ hasText: /^a$/ }).first()).toBeVisible();
    await expect(page.locator('td').filter({ hasText: /^b$/ }).first()).toBeVisible();
    await expect(page.locator('td').filter({ hasText: /^c$/ })).toHaveCount(0);

    // Switch operator to "is not on" and confirm only c remains.
    await filterSection.locator('select').nth(1).selectOption('is not on');
    await page.locator('input[type="date"]').fill('2025-01-01');
    await page.waitForTimeout(500);
    await expect(page.locator('td').filter({ hasText: /^c$/ }).first()).toBeVisible();
    await expect(page.locator('td').filter({ hasText: /^a$/ })).toHaveCount(0);
    await expect(page.locator('td').filter({ hasText: /^b$/ })).toHaveCount(0);
  });

  test('should support date operator is between (inclusive)', async ({ page }) => {
    const csvContent = [
      'id,date_submitted',
      'a,1/1/2025',
      'b,1/1/2025 11:31:53 AM',
      'c,1/2/2025 00:10:00',
      'd,1/3/2025',
    ].join('\n');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'mixed_dates_between.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent, 'utf-8'),
    });
    await page.waitForSelector('table');

    await page.getByRole('button', { name: /Condition/i }).click();
    await page.locator('.border-gray-300.dark\\:border-gray-600').first().waitFor();

    const filterSection = page.locator('.bg-white.dark\\:bg-gray-800').filter({ has: page.locator('select').first() }).first();
    await filterSection.locator('select').first().selectOption('date_submitted');
    await filterSection.locator('select').nth(1).selectOption('is between');

    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(2);
    await dateInputs.nth(0).fill('2025-01-01');
    await dateInputs.nth(1).fill('2025-01-02');
    await page.waitForTimeout(500);

    await expect(page.locator('td').filter({ hasText: /^a$/ }).first()).toBeVisible();
    await expect(page.locator('td').filter({ hasText: /^b$/ }).first()).toBeVisible();
    await expect(page.locator('td').filter({ hasText: /^c$/ }).first()).toBeVisible();
    await expect(page.locator('td').filter({ hasText: /^d$/ })).toHaveCount(0);
  });

  test('should handle multi-table joins', async ({ page }) => {
    // Upload guests.csv
    await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
    await page.waitForSelector('table');

    // Add attendance.csv
    await page.getByRole('button', { name: /Add another table/i }).click();
    await page.locator('input[type="file"]').setInputFiles(path.resolve('attendance.csv'));
    await page.waitForTimeout(500);

    // Configure Join
    await page.getByRole('button', { name: /Configure Joins/i }).click();
    await page.waitForSelector('[role="dialog"], .fixed.inset-0');

    // Select tables and columns
    const selects = page.locator('select');
    await selects.nth(0).selectOption('attendance');
    await selects.nth(1).selectOption('guest_id');
    await selects.nth(2).selectOption('guests');
    await selects.nth(3).selectOption('id');

    await page.getByRole('button', { name: /Add Join/i }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /Done/i }).click();
    await page.waitForTimeout(500);

    // Verify joined data - columns are prefixed with aliases (t2 for attendance, guests unchanged)
    // Check for program column (could be t2.program or attendance.program depending on alias)
    const programHeader = page.locator('th').filter({ hasText: /\.program/i });
    await expect(programHeader.first()).toBeVisible();
    // Check for name column (guests.name since 'guests' is short enough to not be aliased)
    const nameHeader = page.locator('th').filter({ hasText: /\.name/i });
    await expect(nameHeader.first()).toBeVisible();
  });
});
