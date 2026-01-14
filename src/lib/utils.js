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

export function applyFilter(row, filterNode, isCaseSensitive = false) {
    if (filterNode.type === 'group') {
        const { logic, children } = filterNode;
        if (children.length === 0) return true;

        // Evaluate all children
        const results = children.map(child => applyFilter(row, child, isCaseSensitive));

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
        
        const valA = isCaseSensitive ? strA : strA.toLowerCase();
        const valB = isCaseSensitive ? strB : strB.toLowerCase();

        // Exact match
        if (operator === 'is') return valA === valB;
        if (operator === 'is not') return valA !== valB;

        // Partial match
        if (operator === 'contains') return valA.includes(valB);
        if (operator === 'does not contain') return !valA.includes(valB);
        if (operator === 'startswith') return valA.startsWith(valB);
        if (operator === 'endswith') return valA.endsWith(valB);

        // List match
        if (operator === 'in') {
            const options = strB.split(',').map(s => s.trim());
            const finalOptions = isCaseSensitive ? options : options.map(o => o.toLowerCase());
            return finalOptions.includes(valA);
        }
        if (operator === 'not in') {
            const options = strB.split(',').map(s => s.trim());
            const finalOptions = isCaseSensitive ? options : options.map(o => o.toLowerCase());
            return !finalOptions.includes(valA);
        }

        // Regex
        if (operator === 'regexp') {
             try {
                const regex = new RegExp(strB, isCaseSensitive ? '' : 'i');
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

/**
 * Perform INNER JOIN across multiple tables based on join definitions.
 * @param {Object} tables - { tableName: { data: [], types: {} } }
 * @param {Array} joins - [{ leftTable, leftColumn, rightTable, rightColumn }]
 * @returns {{ data: Array, types: Object, columns: Array }}
 */
export function performJoin(tables, joins) {
    if (!joins || joins.length === 0 || Object.keys(tables).length < 2) {
        return { data: [], types: {}, columns: [] };
    }

    // Start with the first join
    const firstJoin = joins[0];
    const leftTable = tables[firstJoin.leftTable];
    const rightTable = tables[firstJoin.rightTable];

    if (!leftTable || !rightTable) {
        return { data: [], types: {}, columns: [] };
    }

    // Perform INNER JOIN
    let result = [];
    const leftData = leftTable.data;
    const rightData = rightTable.data;

    // Create index on right table for faster lookup
    const rightIndex = {};
    rightData.forEach(row => {
        const key = String(row[firstJoin.rightColumn] ?? '').toLowerCase();
        if (!rightIndex[key]) {
            rightIndex[key] = [];
        }
        rightIndex[key].push(row);
    });

    // Join
    leftData.forEach(leftRow => {
        const key = String(leftRow[firstJoin.leftColumn] ?? '').toLowerCase();
        const matchingRightRows = rightIndex[key] || [];
        
        matchingRightRows.forEach(rightRow => {
            // Combine rows with prefixed column names
            const combinedRow = {};
            
            // Add left table columns
            Object.entries(leftRow).forEach(([col, val]) => {
                combinedRow[`${firstJoin.leftTable}.${col}`] = val;
            });
            
            // Add right table columns
            Object.entries(rightRow).forEach(([col, val]) => {
                combinedRow[`${firstJoin.rightTable}.${col}`] = val;
            });
            
            result.push(combinedRow);
        });
    });

    // Apply subsequent joins if any
    for (let i = 1; i < joins.length; i++) {
        const join = joins[i];
        const nextTable = tables[join.rightTable];
        
        if (!nextTable) continue;

        // Create index for next table
        const nextIndex = {};
        nextTable.data.forEach(row => {
            const key = String(row[join.rightColumn] ?? '').toLowerCase();
            if (!nextIndex[key]) {
                nextIndex[key] = [];
            }
            nextIndex[key].push(row);
        });

        // Join result with next table
        const newResult = [];
        result.forEach(resultRow => {
            // The left column is already prefixed
            const leftColName = join.leftColumn.includes('.') ? join.leftColumn : `${join.leftTable}.${join.leftColumn}`;
            const key = String(resultRow[leftColName] ?? '').toLowerCase();
            const matchingRows = nextIndex[key] || [];

            matchingRows.forEach(nextRow => {
                const combinedRow = { ...resultRow };
                Object.entries(nextRow).forEach(([col, val]) => {
                    combinedRow[`${join.rightTable}.${col}`] = val;
                });
                newResult.push(combinedRow);
            });
        });

        result = newResult;
    }

    // Build types for joined columns
    const types = {};
    joins.forEach(join => {
        const leftTypes = tables[join.leftTable]?.types || {};
        const rightTypes = tables[join.rightTable]?.types || {};
        
        Object.entries(leftTypes).forEach(([col, type]) => {
            types[`${join.leftTable}.${col}`] = type;
        });
        Object.entries(rightTypes).forEach(([col, type]) => {
            types[`${join.rightTable}.${col}`] = type;
        });
    });

    // Get columns from result
    const columns = result.length > 0 ? Object.keys(result[0]) : [];

    return { data: result, types, columns };
}
