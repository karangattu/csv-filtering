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

    // Wait for the condition row to appear
    await page.locator('select').first().waitFor();

    // Set condition: name contains "Jane" - for SINGLE TABLE, options are NOT prefixed!
    await page.locator('select').first().selectOption('name');
    await page.locator('select').nth(1).selectOption('contains');
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
    await page.locator('select').first().waitFor();

    // Default: Case Insensitive - "tom" should match "Tom"
    // For SINGLE TABLE, options are NOT prefixed!
    await page.locator('select').first().selectOption('name');
    await page.locator('select').nth(1).selectOption('contains');
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

  test('should handle multi-table joins', async ({ page }) => {
    // Upload guests.csv
    await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
    await page.waitForSelector('table');

    // Add attendance.csv
    await page.getByRole('button', { name: /Add Table/i }).click();
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

    // Verify joined data - AFTER joining, columns ARE prefixed
    await expect(page.locator('th').filter({ hasText: 'attendance.program' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'guests.name' })).toBeVisible();
  });
});
