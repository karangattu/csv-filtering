import { test, expect } from '@playwright/test';
import path from 'path';

test.setTimeout(60000);

test.describe('CSV Parsing Robustness', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should handle CSV with quoted column names', async ({ page }) => {
        const csvContent = [
            '"Name","Age","City"',
            '"Alice",30,"New York"',
            '"Bob",25,"Los Angeles"',
            '"Charlie",35,"Chicago"'
        ].join('\n');

        await page.locator('input[type="file"]').setInputFiles({
            name: 'quoted_columns.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent, 'utf-8'),
        });

        await page.waitForSelector('table');

        await expect(page.locator('th').filter({ hasText: 'Name' })).toBeVisible();
        await expect(page.locator('th').filter({ hasText: 'Age' })).toBeVisible();
        await expect(page.locator('th').filter({ hasText: 'City' })).toBeVisible();

        await expect(page.locator('td').filter({ hasText: 'Alice' }).first()).toBeVisible();
    });

    test('should handle CSV with special characters in column names', async ({ page }) => {
        const csvContent = [
            '"Column With Spaces",Column-With-Dashes,"Column (With Parens)"',
            'Value1,Value2,Value3',
            'Test1,Test2,Test3'
        ].join('\n');

        await page.locator('input[type="file"]').setInputFiles({
            name: 'special_chars.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent, 'utf-8'),
        });

        await page.waitForSelector('table');

        await expect(page.locator('th').filter({ hasText: 'Column With Spaces' })).toBeVisible();
        await expect(page.locator('th').filter({ hasText: 'Column-With-Dashes' })).toBeVisible();
        await expect(page.locator('th').filter({ hasText: 'Column (With Parens)' })).toBeVisible();

        await expect(page.locator('td').filter({ hasText: 'Value1' }).first()).toBeVisible();
    });

    test('should normalize column names with surrounding whitespace', async ({ page }) => {
        const csvContent = [
            '"  Whitespace  ",Normal,  Spaces  ',
            'Value1,Value2,Value3'
        ].join('\n');

        await page.locator('input[type="file"]').setInputFiles({
            name: 'whitespace.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent, 'utf-8'),
        });

        await page.waitForSelector('table');

        await expect(page.locator('th').filter({ hasText: 'Whitespace' })).toBeVisible();
        await expect(page.locator('th').filter({ hasText: 'Normal' })).toBeVisible();
        await expect(page.locator('th').filter({ hasText: 'Spaces' })).toBeVisible();
    });

    test('should handle CSV with embedded quotes in column names', async ({ page }) => {
        const csvContent = [
            'Name,Description,Notes',
            'Alice,"A ""quoted"" value",Note1',
            'Bob,"Another value",Note2'
        ].join('\n');

        await page.locator('input[type="file"]').setInputFiles({
            name: 'embedded_quotes.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent, 'utf-8'),
        });

        await page.waitForSelector('table');

        await expect(page.locator('th').filter({ hasText: 'Name' })).toBeVisible();
        await expect(page.locator('th').filter({ hasText: 'Description' })).toBeVisible();
        await expect(page.locator('td').filter({ hasText: /quoted/ }).first()).toBeVisible();
    });

    test('should handle CSV with values containing commas inside quotes', async ({ page }) => {
        const csvContent = [
            'Name,Address,City',
            'Alice,"123 Main St, Apt 4",NewYork',
            'Bob,"456 Oak Ave, Suite 10",Chicago'
        ].join('\n');

        await page.locator('input[type="file"]').setInputFiles({
            name: 'commas_in_values.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent, 'utf-8'),
        });

        await page.waitForSelector('table');

        await expect(page.locator('td').filter({ hasText: '123 Main St, Apt 4' }).first()).toBeVisible();
        await expect(page.locator('td').filter({ hasText: '456 Oak Ave, Suite 10' }).first()).toBeVisible();
    });

    test('should show progress for large files', async ({ page }) => {
        const rows = ['row_id,full_name,amount'];
        for (let i = 0; i < 10000; i++) {
            rows.push(`${i},Name${i},${Math.random() * 1000}`);
        }
        const csvContent = rows.join('\n');

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
            name: 'large_file.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent, 'utf-8'),
        });

        await page.waitForSelector('table', { timeout: 30000 });

        await expect(page.locator('th').filter({ hasText: /^row_id/ }).first()).toBeVisible();
        await expect(page.locator('th').filter({ hasText: /^full_name/ }).first()).toBeVisible();
        await expect(page.locator('th').filter({ hasText: /^amount/ }).first()).toBeVisible();
    });

    test('should handle empty CSV gracefully', async ({ page }) => {
        const csvContent = '';

        await page.locator('input[type="file"]').setInputFiles({
            name: 'empty.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent, 'utf-8'),
        });

        await page.waitForTimeout(1000);

        await expect(page.getByText(/empty|no valid data/i)).toBeVisible();
    });

    test('should handle CSV with only headers', async ({ page }) => {
        const csvContent = 'Name,Age,City\n';

        await page.locator('input[type="file"]').setInputFiles({
            name: 'headers_only.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent, 'utf-8'),
        });

        await page.waitForTimeout(1000);

        await expect(page.getByText(/empty|no valid data|No results/i)).toBeVisible();
    });

    test('should handle different delimiters', async ({ page }) => {
        const csvContent = [
            'Name\tAge\tCity',
            'Alice\t30\tNew York',
            'Bob\t25\tChicago'
        ].join('\n');

        await page.locator('input[type="file"]').setInputFiles({
            name: 'tab_delimited.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent, 'utf-8'),
        });

        await page.waitForSelector('table');

        await expect(page.locator('th').filter({ hasText: 'Name' })).toBeVisible();
        await expect(page.locator('th').filter({ hasText: 'Age' })).toBeVisible();
        await expect(page.locator('td').filter({ hasText: 'Alice' }).first()).toBeVisible();
    });

    test('should filter correctly on normalized column names', async ({ page }) => {
        const csvContent = [
            '"Full Name","Age"',
            'Alice Smith,30',
            'Bob Jones,25',
            'Charlie Brown,35'
        ].join('\n');

        await page.locator('input[type="file"]').setInputFiles({
            name: 'filter_test.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from(csvContent, 'utf-8'),
        });

        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Condition/i }).click();
        await page.locator('.border-gray-300.dark\\:border-gray-600').first().waitFor();

        const filterSection = page.locator('.bg-white.dark\\:bg-gray-800').filter({ has: page.locator('select').first() }).first();
        await filterSection.locator('select').first().selectOption('Full Name');
        await filterSection.locator('select').nth(1).selectOption('contains');
        await page.getByPlaceholder(/unique values|Enter text/i).fill('Alice');

        await page.waitForTimeout(500);

        await expect(page.locator('td').filter({ hasText: 'Alice Smith' }).first()).toBeVisible();
        const bobCells = page.locator('td').filter({ hasText: /^Bob/ });
        await expect(bobCells).toHaveCount(0);
    });
});
