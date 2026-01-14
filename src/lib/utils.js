import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function detectType(value) {
    if (value === null || value === undefined || value === '') return 'string';

    if (!isNaN(Number(value)) && value.trim() !== '') return 'number';

    const date = new Date(value);
    if (!isNaN(date.getTime()) && value.length > 5) return 'date'; // Simple heuristic

    return 'string';
}

export function detectColumnTypes(data) {
    if (!data || data.length === 0) return {};
    const types = {};
    const sample = data.slice(0, 10); // Check first 10 rows

    Object.keys(data[0]).forEach(key => {
        let type = 'string';
        // Check all non-empty values in sample
        for (const row of sample) {
            if (row[key]) {
                type = detectType(row[key]);
                if (type !== 'string') break; // Found a specific type
            }
        }
        // Double check if mixed (e.g., some numbers, some strings -> string)
        // For simplicity, we stick to the first specific type found or default to string
        types[key] = type;
    });
    return types;
}

export function applyFilter(row, filterNode) {
    if (filterNode.type === 'group') {
        const { logic, children } = filterNode;
        if (children.length === 0) return true;

        // Evaluate all children
        const results = children.map(child => applyFilter(row, child));

        if (logic === 'AND') {
            return results.every(r => r);
        } else { // OR
            return results.some(r => r);
        }
    } else if (filterNode.type === 'condition') {
        const { field, operator, value } = filterNode;
        const rowValue = row[field];

        // --- EMPTY CHECKS (Type Agnostic) ---
        if (operator === 'is empty') {
            return rowValue === '' || rowValue === null || rowValue === undefined || (typeof rowValue === 'string' && rowValue.trim() === '');
        }
        if (operator === 'is not empty') {
            return rowValue !== '' && rowValue !== null && rowValue !== undefined && !(typeof rowValue === 'string' && rowValue.trim() === '');
        }

        if (!field) return true;

        // --- TYPE SPECIFIC COMPARISONS ---
        
        // 1. TEXT / STRING
        // Helper for safe string conversion
        const strA = String(rowValue ?? '');
        const strB = String(value ?? '');
        const lowerA = strA.toLowerCase();
        const lowerB = strB.toLowerCase();

        // Exact match (insensitive)
        if (operator === 'is') return lowerA === lowerB;
        if (operator === 'is not') return lowerA !== lowerB;

        // Partial match
        if (operator === 'contains') return lowerA.includes(lowerB);
        if (operator === 'does not contain') return !lowerA.includes(lowerB);
        if (operator === 'startswith') return lowerA.startsWith(lowerB);
        if (operator === 'endswith') return lowerA.endsWith(lowerB);

        // List match
        if (operator === 'in') {
            const options = strB.split(',').map(s => s.trim().toLowerCase()).filter(s => s !== '');
            return options.includes(lowerA);
        }
        if (operator === 'not in') {
            const options = strB.split(',').map(s => s.trim().toLowerCase()).filter(s => s !== '');
            return !options.includes(lowerA);
        }

        // Regex
        if (operator === 'regexp') {
             try {
                const regex = new RegExp(strB, 'i');
                return regex.test(strA);
            } catch (e) {
                return false; // Invalid regex doesn't match
            }
        }

        // 2. NUMBER
        const numA = Number(rowValue);
        const numB = Number(value);
        
        // Check valid numbers for numeric ops
        if (!isNaN(numA) && !isNaN(numB) && rowValue !== '' && value !== '') {
            if (operator === '=') return numA === numB;
            if (operator === '≠') return numA !== numB;
            if (operator === '>') return numA > numB;
            if (operator === '<') return numA < numB;
            if (operator === '≥') return numA >= numB;
            if (operator === '≤') return numA <= numB;
        }

        // 3. DATETIME
        // Valid dates check
        const dateA = new Date(rowValue);
        const dateB = new Date(value);

        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime()) && rowValue !== '' && value !== '') {
            if (operator === 'is before') return dateA < dateB;
            if (operator === 'is after') return dateA > dateB;
        }

        return false;
    }
    return true;
}
