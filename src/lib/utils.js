import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function detectType(value) {
    if (value === null || value === undefined || value === '') return 'string';

    if (!isNaN(Number(value)) && String(value).trim() !== '') return 'number';

    // Check for date/datetime patterns more carefully
    const strVal = String(value).trim();
    // Look for date-like patterns (contains / or - with numbers)
    if (/\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4}/.test(strVal)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return 'date';
    }

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

// ============================================
// PREMIUM FEATURES - STATISTICAL FUNCTIONS
// ============================================

/**
 * Calculate median of an array of numbers
 */
export function calculateMedian(values) {
    if (!values || values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate mode (most frequent value) of an array
 */
export function calculateMode(values) {
    if (!values || values.length === 0) return null;
    const frequency = {};
    let maxFreq = 0;
    let mode = values[0];
    
    values.forEach(val => {
        frequency[val] = (frequency[val] || 0) + 1;
        if (frequency[val] > maxFreq) {
            maxFreq = frequency[val];
            mode = val;
        }
    });
    
    return maxFreq > 1 ? mode : null; // No mode if all values appear once
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(values, mean) {
    if (!values || values.length < 2) return null;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate comprehensive statistics for a numeric column
 */
export function calculateColumnStats(data, column) {
    if (!data || data.length === 0) return null;
    
    const values = data
        .map(row => row[column])
        .filter(val => val !== null && val !== undefined && val !== '' && !isNaN(Number(val)))
        .map(Number);
    
    if (values.length === 0) return null;
    
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const median = calculateMedian(values);
    const mode = calculateMode(values);
    const stdDev = calculateStdDev(values, mean);
    
    // Calculate distribution for sparkline (10 buckets)
    const range = max - min;
    const bucketSize = range / 10 || 1;
    const distribution = new Array(10).fill(0);
    values.forEach(val => {
        const bucketIndex = Math.min(Math.floor((val - min) / bucketSize), 9);
        distribution[bucketIndex]++;
    });
    
    return {
        count: values.length,
        sum: Math.round(sum * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        avg: Math.round(mean * 100) / 100,
        median: median !== null ? Math.round(median * 100) / 100 : null,
        mode: mode !== null ? Math.round(mode * 100) / 100 : null,
        stdDev: stdDev !== null ? Math.round(stdDev * 100) / 100 : null,
        distribution
    };
}

// ============================================
// PREMIUM FEATURES - DATA QUALITY
// ============================================

/**
 * Find duplicate rows in data
 */
export function findDuplicates(data) {
    if (!data || data.length === 0) return { duplicateIndices: [], duplicateCount: 0 };
    
    const seen = new Map();
    const duplicateIndices = [];
    
    data.forEach((row, index) => {
        const key = JSON.stringify(row);
        if (seen.has(key)) {
            duplicateIndices.push(index);
        } else {
            seen.set(key, index);
        }
    });
    
    return { duplicateIndices, duplicateCount: duplicateIndices.length };
}

/**
 * Find outliers using IQR method
 */
export function findOutliers(data, column) {
    const values = data
        .map((row, idx) => ({ value: row[column], index: idx }))
        .filter(item => item.value !== null && item.value !== undefined && item.value !== '' && !isNaN(Number(item.value)))
        .map(item => ({ ...item, value: Number(item.value) }));
    
    if (values.length < 4) return { outlierIndices: [], outlierCount: 0, bounds: null };
    
    const sorted = [...values].sort((a, b) => a.value - b.value);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index].value;
    const q3 = sorted[q3Index].value;
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outlierIndices = values
        .filter(item => item.value < lowerBound || item.value > upperBound)
        .map(item => item.index);
    
    return {
        outlierIndices,
        outlierCount: outlierIndices.length,
        bounds: { lower: Math.round(lowerBound * 100) / 100, upper: Math.round(upperBound * 100) / 100 }
    };
}

/**
 * Calculate data quality metrics for all columns
 */
export function detectDataQuality(data, types) {
    if (!data || data.length === 0) return { overall: 0, columns: {} };
    
    const columns = Object.keys(data[0]);
    const columnQuality = {};
    let totalScore = 0;
    let columnCount = 0;
    
    columns.forEach(col => {
        const values = data.map(row => row[col]);
        const totalRows = values.length;
        
        // Missing values
        const missingCount = values.filter(v => v === null || v === undefined || v === '' || (typeof v === 'string' && v.trim() === '')).length;
        const missingPercent = (missingCount / totalRows) * 100;
        
        // Duplicate values in column
        const uniqueValues = new Set(values.filter(v => v !== null && v !== undefined && v !== ''));
        const duplicateCount = totalRows - missingCount - uniqueValues.size;
        
        // Outliers (for numeric columns)
        let outlierInfo = { outlierCount: 0, bounds: null };
        if (types[col] === 'number') {
            outlierInfo = findOutliers(data, col);
        }
        
        // Calculate column score (100 = perfect)
        const missingPenalty = missingPercent;
        const outlierPenalty = (outlierInfo.outlierCount / totalRows) * 50;
        const columnScore = Math.max(0, 100 - missingPenalty - outlierPenalty);
        
        columnQuality[col] = {
            missing: { count: missingCount, percent: Math.round(missingPercent * 10) / 10 },
            duplicates: { count: Math.max(0, duplicateCount) },
            outliers: outlierInfo,
            score: Math.round(columnScore)
        };
        
        totalScore += columnScore;
        columnCount++;
    });
    
    // Row-level duplicates
    const { duplicateCount: rowDuplicates } = findDuplicates(data);
    
    return {
        overall: Math.round(totalScore / columnCount),
        rowDuplicates,
        totalRows: data.length,
        columns: columnQuality
    };
}

// ============================================
// PREMIUM FEATURES - SMART TYPE DETECTION
// ============================================

const SMART_TYPE_PATTERNS = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
    url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i,
    currency: /^[$€£¥₹]?\s?-?\d{1,3}(,\d{3})*(\.\d{1,2})?$|^-?\d+(\.\d{1,2})?\s?[$€£¥₹]?$/,
    // Date formats: YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY, with optional time HH:MM:SS AM/PM
    datetime: /^(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})(\s+\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM|am|pm)?)?$/,
    percentage: /^-?\d+(\.\d+)?%$/,
    zipcode: /^\d{5}(-\d{4})?$|^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i
};

/**
 * Detect smart type for a single value
 */
export function detectSmartType(value) {
    if (value === null || value === undefined || value === '') return null;
    
    const str = String(value).trim();
    
    for (const [type, pattern] of Object.entries(SMART_TYPE_PATTERNS)) {
        if (pattern.test(str)) {
            return type;
        }
    }
    
    return null;
}

/**
 * Detect smart types for all columns with validation stats
 */
export function detectSmartColumnTypes(data) {
    if (!data || data.length === 0) return {};
    
    const columns = Object.keys(data[0]);
    const result = {};
    
    columns.forEach(col => {
        const nonEmptyValues = data
            .map(row => row[col])
            .filter(v => v !== null && v !== undefined && v !== '');
        
        if (nonEmptyValues.length === 0) {
            result[col] = { smartType: null, validCount: 0, invalidCount: 0, validPercent: 0 };
            return;
        }
        
        // Check each smart type
        const typeCounts = {};
        nonEmptyValues.forEach(val => {
            const smartType = detectSmartType(val);
            if (smartType) {
                typeCounts[smartType] = (typeCounts[smartType] || 0) + 1;
            }
        });
        
        // Find dominant type (>50% of values)
        const totalNonEmpty = nonEmptyValues.length;
        let dominantType = null;
        let maxCount = 0;
        
        for (const [type, count] of Object.entries(typeCounts)) {
            if (count > maxCount && count >= totalNonEmpty * 0.5) {
                maxCount = count;
                dominantType = type;
            }
        }
        
        if (dominantType) {
            const validCount = typeCounts[dominantType];
            const invalidCount = totalNonEmpty - validCount;
            result[col] = {
                smartType: dominantType,
                validCount,
                invalidCount,
                validPercent: Math.round((validCount / totalNonEmpty) * 100)
            };
        } else {
            result[col] = { smartType: null, validCount: 0, invalidCount: 0, validPercent: 0 };
        }
    });
    
    return result;
}

// ============================================
// PREMIUM FEATURES - DATA CLEANING
// ============================================

/**
 * Clean a column with specified operation
 */
export function cleanColumn(data, column, operation) {
    return data.map(row => {
        const newRow = { ...row };
        let value = row[column];
        
        if (value === null || value === undefined) {
            return newRow;
        }
        
        const strValue = String(value);
        
        switch (operation) {
            case 'trim':
                newRow[column] = strValue.trim();
                break;
            case 'uppercase':
                newRow[column] = strValue.toUpperCase();
                break;
            case 'lowercase':
                newRow[column] = strValue.toLowerCase();
                break;
            case 'titlecase':
                newRow[column] = strValue
                    .toLowerCase()
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                break;
            case 'removeSpecialChars':
                newRow[column] = strValue.replace(/[^a-zA-Z0-9\s]/g, '');
                break;
            case 'removeNumbers':
                newRow[column] = strValue.replace(/[0-9]/g, '');
                break;
            case 'numbersOnly':
                newRow[column] = strValue.replace(/[^0-9.-]/g, '');
                break;
            default:
                break;
        }
        
        return newRow;
    });
}

/**
 * Remove duplicate rows from data
 */
export function removeDuplicateRows(data) {
    const seen = new Set();
    return data.filter(row => {
        const key = JSON.stringify(row);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

/**
 * Fill empty values with a specified value
 */
export function fillEmpty(data, column, fillValue) {
    return data.map(row => {
        const newRow = { ...row };
        if (row[column] === null || row[column] === undefined || row[column] === '' || 
            (typeof row[column] === 'string' && row[column].trim() === '')) {
            newRow[column] = fillValue;
        }
        return newRow;
    });
}

// ============================================
// PREMIUM FEATURES - PIVOT TABLE
// ============================================

/**
 * Aggregate function implementations
 */
const AGGREGATION_FUNCTIONS = {
    sum: (values) => values.reduce((a, b) => a + b, 0),
    avg: (values) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
    count: (values) => values.length,
    min: (values) => values.length ? Math.min(...values) : 0,
    max: (values) => values.length ? Math.max(...values) : 0,
    countDistinct: (values) => new Set(values).size
};

/**
 * Create pivot table data
 */
export function createPivotData(data, config) {
    const { rowField, columnField, valueField, aggFunc = 'sum' } = config;
    
    if (!rowField || !data || data.length === 0) {
        return { rows: [], columns: [], pivotData: {}, totals: {} };
    }
    
    // Get unique row and column values
    const uniqueRows = [...new Set(data.map(row => row[rowField] ?? '(Empty)'))].sort();
    const uniqueCols = columnField 
        ? [...new Set(data.map(row => row[columnField] ?? '(Empty)'))].sort()
        : ['Total'];
    
    // Build pivot structure
    const pivotData = {};
    const totals = { row: {}, column: {}, grand: 0 };
    
    uniqueRows.forEach(rowVal => {
        pivotData[rowVal] = {};
        uniqueCols.forEach(colVal => {
            // Filter data for this cell
            const cellData = data.filter(row => {
                const matchRow = (row[rowField] ?? '(Empty)') === rowVal;
                const matchCol = !columnField || (row[columnField] ?? '(Empty)') === colVal;
                return matchRow && matchCol;
            });
            
            // Get values and aggregate
            const values = cellData
                .map(row => valueField ? row[valueField] : 1)
                .filter(v => v !== null && v !== undefined && v !== '')
                .map(v => isNaN(Number(v)) ? 0 : Number(v));
            
            const aggregator = AGGREGATION_FUNCTIONS[aggFunc] || AGGREGATION_FUNCTIONS.sum;
            const result = values.length > 0 ? aggregator(values) : 0;
            pivotData[rowVal][colVal] = Math.round(result * 100) / 100;
        });
        
        // Row total
        const rowValues = Object.values(pivotData[rowVal]);
        totals.row[rowVal] = Math.round(rowValues.reduce((a, b) => a + b, 0) * 100) / 100;
    });
    
    // Column totals
    uniqueCols.forEach(colVal => {
        const colSum = uniqueRows.reduce((sum, rowVal) => sum + (pivotData[rowVal][colVal] || 0), 0);
        totals.column[colVal] = Math.round(colSum * 100) / 100;
    });
    
    // Grand total
    totals.grand = Math.round(Object.values(totals.row).reduce((a, b) => a + b, 0) * 100) / 100;
    
    return {
        rows: uniqueRows,
        columns: uniqueCols,
        pivotData,
        totals
    };
}
