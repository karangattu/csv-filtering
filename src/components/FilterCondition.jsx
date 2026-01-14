import React, { useMemo, useState } from 'react';
import { Trash2, ChevronDown, X, Check } from 'lucide-react';

const OPERATORS_BY_TYPE = {
    string: [
        'is', 'is not',
        'contains', 'does not contain',
        'startswith', 'endswith',
        'in', 'not in',
        'is empty', 'is not empty',
        'regexp'
    ],
    number: [
        '=', '≠', '<', '>', '≤', '≥',
        'is empty', 'is not empty'
    ],
    date: [
        'is before', 'is after',
        'is empty', 'is not empty'
    ],
};

// Max unique values to show as dropdown (beyond this, use text input)
const MAX_DROPDOWN_VALUES = 50;

/**
 * Multi-select dropdown component for "in" / "not in" operators
 */
function MultiSelectDropdown({ options, selectedValues, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const selected = selectedValues ? selectedValues.split(',').map(v => v.trim()).filter(Boolean) : [];

    const toggleValue = (val) => {
        const newSelected = selected.includes(val)
            ? selected.filter(v => v !== val)
            : [...selected, val];
        onChange(newSelected.join(', '));
    };

    const removeValue = (val, e) => {
        e.stopPropagation();
        const newSelected = selected.filter(v => v !== val);
        onChange(newSelected.join(', '));
    };

    return (
        <div className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full min-h-[30px] border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer flex flex-wrap gap-1 items-center"
            >
                {selected.length === 0 ? (
                    <span className="text-gray-400">Select values...</span>
                ) : (
                    selected.map(val => (
                        <span
                            key={val}
                            className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-xs"
                        >
                            {val}
                            <X
                                size={12}
                                className="cursor-pointer hover:text-red-500"
                                onClick={(e) => removeValue(val, e)}
                            />
                        </span>
                    ))
                )}
                <ChevronDown size={14} className="ml-auto text-gray-400" />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-48 overflow-auto">
                        {options.map((opt, idx) => (
                            <div
                                key={idx}
                                onClick={() => toggleValue(opt)}
                                className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${selected.includes(opt) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected.includes(opt)
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                    {selected.includes(opt) && <Check size={12} />}
                                </div>
                                <span className="text-gray-700 dark:text-gray-200">{opt || '(empty)'}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Count badge */}
            {selected.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                    {selected.length}
                </span>
            )}
        </div>
    );
}

export function FilterCondition({ node, columns, types, updateNode, removeNode, columnUniqueValues = {} }) {
    const { field, operator, value } = node;
    const fieldType = types[field] || 'string';
    const operators = OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.string;

    // Get unique values for the selected field
    const uniqueValues = useMemo(() => {
        if (!field || !columnUniqueValues[field]) return null;
        const values = columnUniqueValues[field];
        // Only show dropdown if reasonable number of unique values
        if (values.length > MAX_DROPDOWN_VALUES) return null;
        return values;
    }, [field, columnUniqueValues]);

    // Determine if we should show dropdown for value input
    const showValueDropdown = uniqueValues &&
        uniqueValues.length > 0 &&
        fieldType === 'string' &&
        ['is', 'is not'].includes(operator);

    // Determine if we should show multi-select for "in" / "not in"
    const showMultiSelect = uniqueValues &&
        uniqueValues.length > 0 &&
        fieldType === 'string' &&
        ['in', 'not in'].includes(operator);

    return (
        <div className="flex items-center gap-2 mb-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in zoom-in duration-200">
            <div className="text-gray-400 dark:text-gray-500 text-sm font-medium w-16">Where</div>

            {/* Field Selector */}
            <select
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={field}
                onChange={(e) => updateNode(node.id, { field: e.target.value, operator: operators[0], value: '' })}
            >
                <option value="" disabled>Select field</option>
                {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                ))}
            </select>

            {/* Operator Selector */}
            <select
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={operator}
                onChange={(e) => updateNode(node.id, { operator: e.target.value, value: '' })}
            >
                {operators.map(op => (
                    <option key={op} value={op}>{op}</option>
                ))}
            </select>

            {/* Value Input */}
            {!['is empty', 'is not empty'].includes(operator) && (
                <div className="flex-1 min-w-[200px]">
                    {showMultiSelect ? (
                        // Multi-select for "in" / "not in" operators
                        <MultiSelectDropdown
                            options={uniqueValues}
                            selectedValues={value}
                            onChange={(newValue) => updateNode(node.id, { value: newValue })}
                        />
                    ) : showValueDropdown ? (
                        // Single dropdown for "is" / "is not" operators
                        <div className="relative">
                            <select
                                className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 pr-8 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer"
                                value={value}
                                onChange={(e) => updateNode(node.id, { value: e.target.value })}
                            >
                                <option value="">Select value...</option>
                                {uniqueValues.map((val, idx) => (
                                    <option key={idx} value={val}>
                                        {val === '' ? '(empty)' : val}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            {/* Show count badge */}
                            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                                {uniqueValues.length}
                            </span>
                        </div>
                    ) : fieldType === 'date' ? (
                        <input
                            type="date"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            value={value}
                            onChange={(e) => updateNode(node.id, { value: e.target.value })}
                        />
                    ) : fieldType === 'number' ? (
                        <input
                            type="number"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            value={value}
                            onChange={(e) => updateNode(node.id, { value: e.target.value })}
                            placeholder="Enter value..."
                        />
                    ) : (
                        <input
                            type="text"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            value={value}
                            onChange={(e) => updateNode(node.id, { value: e.target.value })}
                            placeholder={uniqueValues ? `${uniqueValues.length} unique values...` : "Enter text..."}
                        />
                    )}
                </div>
            )}

            {/* Remove Button */}
            <button
                onClick={() => removeNode(node.id)}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                title="Remove condition"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}
