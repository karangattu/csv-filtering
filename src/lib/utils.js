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

        if (operator === 'is empty') return rowValue === '' || rowValue === null || rowValue === undefined;
        if (operator === 'is not empty') return rowValue !== '' && rowValue !== null && rowValue !== undefined;

        if (!field) return true;

        // Type conversion for comparison
        // We assume the type matches the inference, but we handle safe conversion
        let valA = rowValue;
        let valB = value;

        // Simple comparison logic
        if (operator === 'contains') return String(valA).toLowerCase().includes(String(valB).toLowerCase());
        if (operator === 'does not contain') return !String(valA).toLowerCase().includes(String(valB).toLowerCase());
        if (operator === 'is') return String(valA) === String(valB);
        if (operator === 'is not') return String(valA) !== String(valB);

        // Numeric
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
            if (operator === '=') return numA === numB;
            if (operator === '>') return numA > numB;
            if (operator === '<') return numA < numB;
            if (operator === '>=') return numA >= numB;
            if (operator === '<=') return numA <= numB;
        }

        // Date (basic string comparison or timestamp if needed, for MVP keeping simple)
        if (operator === 'is before') return new Date(valA) < new Date(valB);
        if (operator === 'is after') return new Date(valA) > new Date(valB);

        return true;
    }
    return true;
}
