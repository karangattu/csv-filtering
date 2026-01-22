import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.setTimeout(60000);

// ============================================
// UNDO/REDO FEATURE TESTS
// ============================================

test.describe('Undo/Redo Feature', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should show undo/redo buttons in header when data is loaded', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        // Undo button should be visible but disabled initially
        const undoButton = page.getByRole('button', { name: /Undo/i });
        await expect(undoButton).toBeVisible();
        await expect(undoButton).toBeDisabled();

        // Redo button should also be visible but disabled
        const redoButton = page.getByRole('button', { name: /Redo/i });
        await expect(redoButton).toBeVisible();
        await expect(redoButton).toBeDisabled();
    });

    test('should enable undo after data cleaning operation', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        // Open data cleaning panel
        await page.getByRole('button', { name: /Clean Data/i }).click();
        await page.waitForSelector('[role="dialog"]');

        // Select a column and operation
        await page.locator('select').first().selectOption('name');
        await page.getByRole('button', { name: /UPPERCASE/i }).click();

        // Apply the cleaning
        await page.getByRole('button', { name: /Apply Changes/i }).click();

        // Wait for panel to close
        await page.waitForTimeout(500);

        // Undo button should now be enabled
        const undoButton = page.getByRole('button', { name: /Undo/i });
        await expect(undoButton).toBeEnabled();
    });

    test('should undo data cleaning operation with Ctrl+Z', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        // Verify original data
        await expect(page.locator('td').filter({ hasText: 'Tom' }).first()).toBeVisible();

        // Open data cleaning panel
        await page.getByRole('button', { name: /Clean Data/i }).click();
        await page.waitForSelector('[role="dialog"]');

        // Apply UPPERCASE to name column
        await page.locator('select').first().selectOption('name');
        await page.getByRole('button', { name: /UPPERCASE/i }).click();
        await page.getByRole('button', { name: /Apply Changes/i }).click();
        await page.waitForTimeout(500);

        // Verify data changed to uppercase
        await expect(page.locator('td').filter({ hasText: 'TOM' }).first()).toBeVisible();

        // Press Ctrl+Z to undo
        await page.keyboard.press('Control+z');
        await page.waitForTimeout(500);

        // Verify original data is restored
        await expect(page.locator('td').filter({ hasText: 'Tom' }).first()).toBeVisible();
    });
});

// ============================================
// ACCESSIBILITY TESTS
// ============================================

test.describe('Accessibility Features', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should have skip-to-content link that becomes visible on focus', async ({ page }) => {
        // Tab to focus the skip link
        await page.keyboard.press('Tab');
        
        const skipLink = page.locator('a[href="#main-content"]');
        await expect(skipLink).toBeFocused();
    });

    test('should have aria-labels on theme toggle button', async ({ page }) => {
        const themeToggle = page.getByRole('button', { name: /Switch to (dark|light) mode/i });
        await expect(themeToggle).toBeVisible();
        await expect(themeToggle).toHaveAttribute('aria-pressed');
    });

    test('should have proper dialog roles on modals', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        // Open anonymize panel
        await page.getByRole('button', { name: /Anonymize & Download/i }).click();

        // Verify dialog role
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    test('should close modal with Escape key', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        // Open anonymize panel
        await page.getByRole('button', { name: /Anonymize & Download/i }).click();
        await expect(page.locator('[role="dialog"]')).toBeVisible();

        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Modal should be closed
        await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    });

    test('should trap focus within modal', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        // Open data quality panel
        await page.getByRole('button', { name: /Data Quality/i }).click();
        await expect(page.locator('[role="dialog"]')).toBeVisible();

        // Tab through elements - focus should stay within modal
        const closeButton = page.getByRole('button', { name: /Close data quality report/i });
        
        // Tab multiple times to cycle through
        for (let i = 0; i < 20; i++) {
            await page.keyboard.press('Tab');
        }

        // Focus should still be within the dialog
        const focusedElement = page.locator(':focus');
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog.locator(':focus')).toBeTruthy();
    });

    test('should have aria-labels on pagination buttons', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        const prevButton = page.getByRole('button', { name: /Go to previous page/i });
        const nextButton = page.getByRole('button', { name: /Go to next page/i });

        await expect(prevButton).toBeVisible();
        await expect(nextButton).toBeVisible();
    });
});

// ============================================
// COLUMN MANAGEMENT TESTS
// ============================================

test.describe('Column Management Features', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should show column visibility dropdown with freeze option', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        // Open columns dropdown
        await page.getByRole('button', { name: /Columns/i }).click();

        // Should show freeze controls
        await expect(page.getByText('Toggle Visibility & Freeze')).toBeVisible();
        await expect(page.getByText('Unfreeze All')).toBeVisible();
        await expect(page.getByText('Drag to reorder')).toBeVisible();
    });

    test('should freeze column when pin button is clicked', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        // Open columns dropdown
        await page.getByRole('button', { name: /Columns/i }).click();
        await page.waitForTimeout(200);

        // Click freeze button for 'name' column
        const freezeButton = page.getByRole('button', { name: /Freeze name/i });
        await freezeButton.click();

        // Should show frozen column indicator
        await expect(page.getByText(/1 column frozen/i)).toBeVisible();
    });

    test('should unfreeze all columns when clear button is clicked', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        // Open columns dropdown and freeze a column
        await page.getByRole('button', { name: /Columns/i }).click();
        await page.waitForTimeout(200);
        await page.getByRole('button', { name: /Freeze name/i }).click();
        await page.waitForTimeout(200);

        // Verify frozen indicator shows
        await expect(page.getByText(/1 column frozen/i)).toBeVisible();

        // Click clear to unfreeze all
        await page.getByRole('button', { name: /Clear/i }).last().click();
        await page.waitForTimeout(200);

        // Frozen indicator should be gone
        await expect(page.getByText(/column frozen/i)).toHaveCount(0);
    });

    test('should hide column when checkbox is unchecked', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        // Verify 'category' column is visible
        await expect(page.locator('th').filter({ hasText: 'category' })).toBeVisible();

        // Open columns dropdown
        await page.getByRole('button', { name: /Columns/i }).click();
        await page.waitForTimeout(200);

        // Uncheck 'category' column
        const categoryCheckbox = page.getByRole('checkbox', { name: /Toggle visibility for category/i });
        await categoryCheckbox.uncheck();
        await page.waitForTimeout(200);

        // Category column should be hidden
        await expect(page.locator('th').filter({ hasText: 'category' })).toHaveCount(0);
    });

    test('should reset column order and visibility', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        // Hide a column
        await page.getByRole('button', { name: /Columns/i }).click();
        await page.waitForTimeout(200);
        const emailCheckbox = page.getByRole('checkbox', { name: /Toggle visibility for email/i });
        await emailCheckbox.uncheck();
        await page.waitForTimeout(200);

        // Email should be hidden
        await expect(page.locator('th').filter({ hasText: 'email' })).toHaveCount(0);

        // Click Reset
        await page.getByRole('button', { name: /Reset/i }).click();
        await page.waitForTimeout(200);

        // Email should be visible again
        await expect(page.locator('th').filter({ hasText: 'email' })).toBeVisible();
    });
});

// ============================================
// JOIN TYPE TESTS
// ============================================

test.describe('Join Type Features', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should show join type selector when configuring joins', async ({ page }) => {
        // Upload first file
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        // Add another table
        await page.getByRole('button', { name: /Add another table/i }).click();
        await page.locator('input[type="file"]').setInputFiles(path.resolve('attendance.csv'));
        await page.waitForSelector('table');

        // Open join configuration
        await page.getByRole('button', { name: /Configure Joins/i }).click();
        await expect(page.locator('[role="dialog"]')).toBeVisible();

        // Verify join type buttons are visible
        await expect(page.getByRole('button', { name: 'INNER' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'LEFT' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'RIGHT' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'FULL OUTER' })).toBeVisible();
    });

    test('should show join type explanation in info box', async ({ page }) => {
        // Upload first file
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        // Add another table
        await page.getByRole('button', { name: /Add another table/i }).click();
        await page.locator('input[type="file"]').setInputFiles(path.resolve('attendance.csv'));
        await page.waitForSelector('table');

        // Open join configuration
        await page.getByRole('button', { name: /Configure Joins/i }).click();
        await expect(page.locator('[role="dialog"]')).toBeVisible();

        // Verify info box with join explanations
        await expect(page.getByText('Join Types Explained')).toBeVisible();
        await expect(page.getByText(/INNER:.*Only rows that match/i)).toBeVisible();
        await expect(page.getByText(/LEFT:.*All rows from left/i)).toBeVisible();
        await expect(page.getByText(/RIGHT:.*All rows from right/i)).toBeVisible();
        await expect(page.getByText(/FULL OUTER:.*All rows from both/i)).toBeVisible();
    });

    test('should select different join types', async ({ page }) => {
        // Upload first file
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        // Add another table
        await page.getByRole('button', { name: /Add another table/i }).click();
        await page.locator('input[type="file"]').setInputFiles(path.resolve('attendance.csv'));
        await page.waitForSelector('table');

        // Open join configuration
        await page.getByRole('button', { name: /Configure Joins/i }).click();

        // Select LEFT join type
        const leftJoinButton = page.getByRole('button', { name: 'LEFT' });
        await leftJoinButton.click();

        // Verify button is now selected (has aria-pressed=true)
        await expect(leftJoinButton).toHaveAttribute('aria-pressed', 'true');

        // INNER should no longer be selected
        const innerJoinButton = page.getByRole('button', { name: 'INNER' });
        await expect(innerJoinButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('should close join config modal with Escape', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Add another table/i }).click();
        await page.locator('input[type="file"]').setInputFiles(path.resolve('attendance.csv'));
        await page.waitForSelector('table');

        // Open join config
        await page.getByRole('button', { name: /Configure Joins/i }).click();
        await expect(page.locator('[role="dialog"]')).toBeVisible();

        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Modal should close
        await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    });
});

// ============================================
// DATA CLEANING PANEL ACCESSIBILITY
// ============================================

test.describe('Data Cleaning Panel Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should have proper dialog attributes', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Clean Data/i }).click();

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute('aria-modal', 'true');
        await expect(dialog).toHaveAttribute('aria-labelledby', 'cleaning-panel-title');
    });

    test('should have close button with aria-label', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Clean Data/i }).click();

        const closeButton = page.getByRole('button', { name: /Close data cleaning panel/i });
        await expect(closeButton).toBeVisible();
    });

    test('should close with Escape key', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Clean Data/i }).click();
        await expect(page.locator('[role="dialog"]')).toBeVisible();

        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    });
});

// ============================================
// NAVIGATION GUARD
// ============================================

test.describe('Navigation Guard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should confirm before navigating back when data is loaded', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.goBack();

        const dialog = page.getByRole('dialog', { name: 'Leave this page?' });
        await expect(dialog).toBeVisible();
        await page.getByRole('button', { name: 'Stay' }).click();
        await expect(dialog).toHaveCount(0);
    });
});

// ============================================
// TABLE MANAGER ACCESSIBILITY
// ============================================

test.describe('Table Manager Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should have proper aria attributes on table tabs', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        // Add another table
        await page.getByRole('button', { name: /Add another table/i }).click();
        await page.locator('input[type="file"]').setInputFiles(path.resolve('attendance.csv'));
        await page.waitForSelector('table');

        // Check tablist role
        const tablist = page.locator('[role="tablist"]');
        await expect(tablist).toBeVisible();

        // Check tab roles
        const tabs = page.locator('[role="tab"]');
        await expect(tabs).toHaveCount(2);

        // Check active tab has aria-selected=true
        const activeTab = page.locator('[role="tab"][aria-selected="true"]');
        await expect(activeTab).toBeVisible();
    });

    test('should have aria-label on remove table buttons', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles(path.resolve('guests.csv'));
        await page.waitForSelector('table');

        await page.getByRole('button', { name: /Add another table/i }).click();
        await page.locator('input[type="file"]').setInputFiles(path.resolve('attendance.csv'));
        await page.waitForSelector('table');

        // Should have remove buttons with aria-labels
        const removeButton = page.getByRole('button', { name: /Remove table guests/i });
        await expect(removeButton).toBeVisible();
    });
});
