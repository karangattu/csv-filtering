# AGENTS.md

This document provides guidelines for AI agents working on the csv-filtering codebase.

## Project Overview

The csv-filtering project is a React-based web application for filtering, analyzing, and transforming CSV data entirely in the browser. Key features include multi-table support, table joins, advanced filtering with AND/OR logic, data visualization with charts, pivot tables, data quality analysis, and anonymization capabilities.

## Build, Lint, and Test Commands

### Core Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Testing

```bash
# Run all E2E tests
npm run test:e2e

# Run a specific test file
npx playwright test tests/filtering.spec.js

# Run a specific test by name (uses --grep)
npx playwright test --grep "should filter data"

# Run tests with UI (headed mode)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug

# Run a single test in a specific file
npx playwright test tests/filtering.spec.js -g "should upload a CSV"
```

### Playwright Configuration

The project uses Playwright with the following setup:
- Tests are located in `./tests`
- Base URL: `http://localhost:5173/csv-filtering/`
- Chromium browser only
- HTML reporter with trace on first retry
- Dev server starts automatically before tests

## Code Style Guidelines

### General Principles

- Write clean, readable, and maintainable code
- Prefer functional components with hooks over class components
- Use composition over inheritance
- Keep functions small and focused on a single responsibility
- Avoid premature optimization; optimize for readability first

### File Organization

```
src/
├── components/     # React components (PascalCase: DataTable.jsx)
├── hooks/          # Custom React hooks (camelCase: useFilter.js)
├── lib/            # Utility functions (camelCase: utils.js)
├── App.jsx         # Main application component
├── main.jsx        # Entry point
└── index.css       # Global styles
```

### Component Structure

Components should follow this pattern:

```jsx
import React, { useState, useMemo, useCallback } from 'react';
import { IconName } from 'lucide-react';
import { helperFn } from '../lib/utils';

export function ComponentName({ prop1, prop2, optionalProp = defaultValue }) {
    // State declarations
    const [state, setState] = useState(initialValue);

    // Memoized values
    const computed = useMemo(() => {
        return calculation;
    }, [dependency]);

    // Callbacks with useCallback
    const handleAction = useCallback((arg) => {
        // implementation
    }, [dependency]);

    // Early returns for conditions
    if (!data) return null;

    return (
        <JSX />
    );
}
```

### Imports

- Use absolute imports from package names for external libraries
- Use relative imports (`./`, `../`) for internal project files
- Group imports in this order:
  1. React imports
  2. External library imports (lucide-react, recharts, etc.)
  3. Internal component imports
  4. Hook imports
  5. Utility function imports

```jsx
import React, { useState, useMemo } from 'react';
import { FileUpload, Filter, Download } from 'lucide-react';
import { DataTable } from './components/DataTable';
import { useFilter } from './hooks/useFilter';
import { cn, detectColumnTypes } from './lib/utils';
```

### Naming Conventions

| Construct | Convention | Examples |
|-----------|------------|----------|
| Components | PascalCase | `DataTable`, `FilterGroup`, `AnonymizePanel` |
| Hooks | camelCase + "use" prefix | `useFilter`, `useDarkMode` |
| Functions | camelCase | `handleDataLoaded`, `applyFilter`, `detectColumnTypes` |
| Variables | camelCase | `activeTable`, `filterTree`, `columnUniqueValues` |
| Constants | UPPER_SNAKE_CASE | `MAX_SAMPLE_SIZE`, `DEFAULT_ROWS_PER_PAGE` |
| CSS Classes | kebab-case (via Tailwind) | `bg-blue-600`, `text-gray-900` |
| Files (components) | PascalCase | `DataTable.jsx`, `JoinConfig.jsx` |
| Files (utilities/hooks) | camelCase | `utils.js`, `useFilter.js` |

### Type Handling

- Use JavaScript's dynamic typing with runtime type detection for CSV columns
- The codebase includes smart column type detection for: strings, numbers, dates, emails, phone numbers, URLs, and currency
- Store detected types in a `types` object keyed by column name
- Use TypeScript types when adding new files (convert `.jsx` to `.tsx`)

```javascript
// Example: Type detection pattern
const types = detectColumnTypes(data);
// Result: { name: 'string', age: 'number', email: 'email', date: 'date' }
```

### Error Handling

- Use early returns for validation checks
- Provide graceful fallbacks for missing data
- Log errors appropriately for debugging
- Handle edge cases (null, undefined, empty arrays)

```jsx
// Good patterns
if (!data || data.length === 0) return null;

const value = row[col] ?? defaultValue; // Use nullish coalescing

// Avoid: Silent failures or catching without handling
try {
    operation();
} catch (e) {
    console.error('Operation failed:', e);
    // Handle or rethrow appropriately
}
```

### State Management

- Use `useState` for local component state
- Use `useMemo` for expensive computations
- Use `useCallback` for callback functions passed as props
- Use `useDeferredValue` for non-blocking UI updates during heavy computations
- Prefer immutable updates with spread syntax

```jsx
// Immutable update pattern
setTables(prev => ({
    ...prev,
    [tableName]: { data: newData, types, smartTypes }
}));
```

### Tailwind CSS Usage

- Use Tailwind utility classes for all styling
- Support dark mode with `dark:` prefix
- Use semantic color names: `bg-white`, `text-gray-900`, `border-gray-200`
- Add transitions with `transition-colors` or `transition-all`
- Use `animate-in` classes for entrance animations

```jsx
<div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 transition-colors">
    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
        Action
    </button>
</div>
```

### Utility Functions

- Place shared utilities in `src/lib/utils.js`
- Export functions individually
- Use functional programming patterns where appropriate
- Helper functions for recursive tree operations should be private (not exported)

```javascript
// Public export
export function detectColumnTypes(data) { ... }

// Private helper (file-scoped)
function isBlank(value) { ... }
```

### Hooks

- Create custom hooks for reusable logic in `src/hooks/`
- Hooks should start with "use" and return an object
- Use the pattern: `const { state, actions } = useHook(params);`

### Testing Patterns

- E2E tests use Playwright in `tests/` directory
- Use `test.describe` for grouping related tests
- Use `test.setTimeout()` for longer operations
- Wait for elements with appropriate selectors
- Use `expect` assertions for verification

```javascript
test('should filter data based on condition', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(csvPath);
    await page.waitForSelector('table');
    await expect(page.locator('td').filter({ hasText: 'Jane' })).toBeVisible();
});
```

### Git Conventions

- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Commit messages: Present tense, descriptive
- No force pushes to main

### Browser Compatibility

- Target modern browsers (Chrome, Firefox, Safari, Edge)
- All processing happens client-side
- No server-side dependencies for core functionality
