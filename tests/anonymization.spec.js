import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.setTimeout(60000);

test.describe('CSV Anonymization Feature', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should show anonymize button after uploading CSV', async ({ page }) => {
        const csvPath = path.resolve('guests.csv');
        await page.locator('input[type="file"]').setInputFiles(csvPath);
        await page.waitForSelector('table');

        await expect(page.getByRole('button', { name: /Anonymize & Download/i })).toBeVisible();
    });

    test('should open anonymize panel when button is clicked', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Anonymize & Download/i }).click();

        await expect(page.getByText('Anonymize Columns')).toBeVisible();
        await expect(page.getByText('Protect sensitive data before downloading')).toBeVisible();
    });

    test('should detect and highlight sensitive columns (email)', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Anonymize & Download/i }).click();
        await page.waitForSelector('.fixed.inset-0');

        await expect(page.getByText('Sensitive Data Detected')).toBeVisible();
        await expect(page.locator('.bg-amber-50').getByText('email').first()).toBeVisible();
    });

    test('should allow selecting columns for anonymization', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Anonymize & Download/i }).click();
        const modal = page.getByRole('dialog', { name: /Anonymize Columns/i });
        await expect(modal).toBeVisible();

        const nameCheckbox = modal.getByRole('checkbox', { name: /^name$/i });
        await nameCheckbox.check();
        await expect(nameCheckbox).toBeChecked();

        // 2 columns: auto-selected email + manually selected name
        await expect(page.getByText('2 columns will be anonymized')).toBeVisible();
    });

    test('should show anonymization method options when column is selected', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Anonymize & Download/i }).click();
        const modal = page.getByRole('dialog', { name: /Anonymize Columns/i });
        await expect(modal).toBeVisible();

        const nameCheckbox = modal.getByRole('checkbox', { name: /^name$/i });
        await nameCheckbox.check();

        await expect(modal.getByRole('button', { name: 'Mask' }).first()).toBeVisible();
        await expect(modal.getByRole('button', { name: 'Redact' }).first()).toBeVisible();
        await expect(modal.getByRole('button', { name: 'Hash' }).first()).toBeVisible();
        await expect(modal.getByRole('button', { name: 'Remove' }).first()).toBeVisible();
    });

    test('should show preview of anonymized data', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Anonymize & Download/i }).click();
        const modal = page.getByRole('dialog', { name: /Anonymize Columns/i });
        await expect(modal).toBeVisible();

        const nameCheckbox = modal.getByRole('checkbox', { name: /^name$/i });
        await nameCheckbox.check();

        await expect(modal.getByText('Preview (First 5 rows)')).toBeVisible();
    });

    test('should switch between anonymization methods', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Anonymize & Download/i }).click();
        const modal = page.getByRole('dialog', { name: /Anonymize Columns/i });
        await expect(modal).toBeVisible();

        const nameCheckbox = modal.getByRole('checkbox', { name: /^name$/i });
        await nameCheckbox.check();

        await modal.getByRole('button', { name: 'Redact' }).first().click();
        await expect(page.locator('td').filter({ hasText: '[REDACTED]' }).first()).toBeVisible();
    });

    test('should close anonymize panel when cancel is clicked', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Anonymize & Download/i }).click();
        await page.waitForSelector('.fixed.inset-0');

        await expect(page.getByText('Anonymize Columns')).toBeVisible();

        await page.getByRole('button', { name: 'Cancel' }).click();

        await expect(page.getByText('Anonymize Columns')).not.toBeVisible();
    });

    test('should use select all sensitive columns quick action', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Anonymize & Download/i }).click();
        await page.waitForSelector('.fixed.inset-0');

        await page.getByRole('button', { name: 'Select All Sensitive' }).click();

        const emailCheckbox = page.locator('label').filter({ hasText: 'email' }).locator('input[type="checkbox"]');
        await expect(emailCheckbox).toBeChecked();
    });

    test('should clear all selections with clear all button', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Anonymize & Download/i }).click();
        await page.waitForSelector('.fixed.inset-0');

        await page.getByRole('button', { name: 'Select All Sensitive' }).click();

        await page.getByRole('button', { name: 'Clear All', exact: true }).click();

        await expect(page.getByText('No columns selected for anonymization')).toBeVisible();
    });

    test('should download anonymized CSV when button is clicked', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Anonymize & Download/i }).click();
        await page.waitForSelector('.fixed.inset-0');

        const nameCheckbox = page.locator('label').filter({ hasText: 'name' }).locator('input[type="checkbox"]');
        await nameCheckbox.check();

        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Download Anonymized CSV' }).click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toBe('guests_anonymized.csv');
    });

    test('should keep regular download button functional', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: /^Download CSV$/i }).click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toBe('filtered_data.csv');
    });
});
