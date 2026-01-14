import React from 'react';
import { Trash2 } from 'lucide-react';

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

export function FilterCondition({ node, columns, types, updateNode, removeNode }) {
    const { field, operator, value } = node;
    const fieldType = types[field] || 'string';
    const operators = OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE.string;

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
                onChange={(e) => updateNode(node.id, { operator: e.target.value })}
            >
                {operators.map(op => (
                    <option key={op} value={op}>{op}</option>
                ))}
            </select>

            {/* Value Input */}
            {!['is empty', 'is not empty'].includes(operator) && (
                <div className="flex-1 min-w-[200px]">
                    {fieldType === 'date' ? (
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
                            placeholder="Enter text..."
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
