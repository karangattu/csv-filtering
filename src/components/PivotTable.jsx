import React, { useState, useMemo } from 'react';
import { Grid3X3, Download, GripVertical, X, ChevronDown, HelpCircle } from 'lucide-react';
import { createPivotData } from '../lib/utils';
import Papa from 'papaparse';

const AGGREGATION_OPTIONS = [
    { id: 'sum', label: 'Sum', description: 'Total of all values' },
    { id: 'avg', label: 'Average', description: 'Mean of all values' },
    { id: 'count', label: 'Count', description: 'Number of entries' },
    { id: 'min', label: 'Min', description: 'Smallest value' },
    { id: 'max', label: 'Max', description: 'Largest value' },
    { id: 'countDistinct', label: 'Count Distinct', description: 'Unique values' }
];

/**
 * Help popover component for pivot table tutorial
 */
function PivotHelpPopover({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-t-xl">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <HelpCircle size={16} className="text-indigo-500" />
                        How to Use Pivot Tables
                    </h4>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={16} />
                    </button>
                </div>
            </div>
            <div className="p-4 space-y-4 text-sm max-h-80 overflow-y-auto">
                <div>
                    <h5 className="font-medium text-gray-700 dark:text-gray-200 mb-1">📊 What is a Pivot Table?</h5>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                        A pivot table summarizes your data by grouping and calculating totals. Great for answering questions like "How many orders per city?" or "Total sales by category?"
                    </p>
                </div>

                <div className="space-y-2">
                    <h5 className="font-medium text-gray-700 dark:text-gray-200">⚙️ Configuration Fields</h5>
                    <div className="space-y-1.5 text-xs">
                        <div className="flex gap-2">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 w-20">Row Field</span>
                            <span className="text-gray-500 dark:text-gray-400">Groups data into rows (e.g., City, Category)</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 w-20">Column Field</span>
                            <span className="text-gray-500 dark:text-gray-400">Creates columns (optional, for cross-tabs)</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 w-20">Value Field</span>
                            <span className="text-gray-500 dark:text-gray-400">The numbers to calculate (leave empty to count)</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400 w-20">Aggregation</span>
                            <span className="text-gray-500 dark:text-gray-400">How to combine: Sum, Average, Count, etc.</span>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
                    <h5 className="font-medium text-indigo-700 dark:text-indigo-300 mb-1 text-xs">💡 Quick Start</h5>
                    <ol className="text-xs text-indigo-600 dark:text-indigo-400 space-y-1 list-decimal list-inside">
                        <li>Pick a <strong>Row Field</strong> (e.g., City)</li>
                        <li>Leave Column Field as "(None)" for simple summary</li>
                        <li>Select a <strong>Value Field</strong> for numbers, or use Count</li>
                        <li>Choose how to aggregate (Sum, Average, etc.)</li>
                    </ol>
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                    Tip: Click "Export Pivot" to download your results as CSV!
                </div>
            </div>
        </div>
    );
}

/**
 * Field selector dropdown
 */
function FieldSelector({ label, value, options, onChange, placeholder, allowEmpty = false, tooltip }) {
    return (
        <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                {label}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                >
                    {allowEmpty && <option value="">{placeholder}</option>}
                    {options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
        </div>
    );
}

/**
 * Pivot Table Component
 */
export function PivotTable({ data, columns, types }) {
    const [rowField, setRowField] = useState('');
    const [columnField, setColumnField] = useState('');
    const [valueField, setValueField] = useState('');
    const [aggFunc, setAggFunc] = useState('sum');
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    // Set defaults when columns change
    React.useEffect(() => {
        if (columns.length > 0 && !rowField) {
            // Try to find a categorical column for rows
            const categoricalCol = columns.find(col => types[col] === 'string');
            setRowField(categoricalCol || columns[0]);

            // Try to find a numeric column for values
            const numericCol = columns.find(col => types[col] === 'number');
            setValueField(numericCol || '');
        }
    }, [columns, types, rowField]);

    // Calculate pivot data
    const pivotResult = useMemo(() => {
        if (!rowField || !data || data.length === 0) {
            return null;
        }

        return createPivotData(data, {
            rowField,
            columnField: columnField || null,
            valueField: valueField || null,
            aggFunc
        });
    }, [data, rowField, columnField, valueField, aggFunc]);

    // Export pivot to CSV
    const handleExport = () => {
        if (!pivotResult) return;

        const exportData = pivotResult.rows.map(rowVal => {
            const row = { [rowField]: rowVal };
            pivotResult.columns.forEach(colVal => {
                const header = columnField ? `${columnField}: ${colVal}` : 'Value';
                row[header] = pivotResult.pivotData[rowVal][colVal];
            });
            row['Total'] = pivotResult.totals.row[rowVal];
            return row;
        });

        // Add totals row
        const totalsRow = { [rowField]: 'Grand Total' };
        pivotResult.columns.forEach(colVal => {
            const header = columnField ? `${columnField}: ${colVal}` : 'Value';
            totalsRow[header] = pivotResult.totals.column[colVal];
        });
        totalsRow['Total'] = pivotResult.totals.grand;
        exportData.push(totalsRow);

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'pivot_table.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-16 text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                No data available for pivot table.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Configuration Panel */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-4 relative">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg shadow-md">
                            <Grid3X3 className="text-white" size={18} />
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                            Pivot Table Configuration
                        </h3>
                    </div>
                    <button
                        onClick={() => setIsHelpOpen(!isHelpOpen)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isHelpOpen
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                            }`}
                    >
                        <HelpCircle size={14} />
                        Help
                    </button>
                    <PivotHelpPopover isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <FieldSelector
                        label="Row Field"
                        value={rowField}
                        options={columns}
                        onChange={setRowField}
                        placeholder="Select..."
                    />
                    <FieldSelector
                        label="Column Field"
                        value={columnField}
                        options={columns.filter(c => c !== rowField)}
                        onChange={setColumnField}
                        placeholder="(None)"
                        allowEmpty
                    />
                    <FieldSelector
                        label="Value Field"
                        value={valueField}
                        options={columns.filter(c => types[c] === 'number')}
                        onChange={setValueField}
                        placeholder="(Count)"
                        allowEmpty
                    />
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                            Aggregation
                        </label>
                        <div className="relative">
                            <select
                                value={aggFunc}
                                onChange={(e) => setAggFunc(e.target.value)}
                                className="w-full pl-3 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                            >
                                {AGGREGATION_OPTIONS.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Pivot Table Display */}
            {pivotResult && pivotResult.rows.length > 0 ? (
                <div className="overflow-auto max-h-[500px]">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                                    {rowField}
                                </th>
                                {pivotResult.columns.map(col => (
                                    <th key={col} className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                                        {col}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-right font-bold text-indigo-700 dark:text-indigo-400 border-b border-l border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {pivotResult.rows.map(rowVal => (
                                <tr key={rowVal} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                                        {rowVal}
                                    </td>
                                    {pivotResult.columns.map(col => (
                                        <td key={col} className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                                            {(pivotResult.pivotData[rowVal]?.[col] ?? 0).toLocaleString()}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-right font-semibold text-indigo-700 dark:text-indigo-400 border-l border-gray-200 dark:border-gray-700 bg-indigo-50/50 dark:bg-indigo-900/10 tabular-nums">
                                        {pivotResult.totals.row[rowVal]?.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600">
                            <tr>
                                <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                                    Total
                                </td>
                                {pivotResult.columns.map(col => (
                                    <td key={col} className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 tabular-nums">
                                        {pivotResult.totals.column[col]?.toLocaleString()}
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-right font-bold text-indigo-800 dark:text-indigo-300 border-l border-gray-200 dark:border-gray-700 bg-indigo-100 dark:bg-indigo-900/30 tabular-nums">
                                    {pivotResult.totals.grand?.toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Grid3X3 size={40} className="mx-auto mb-3 opacity-50" />
                    <p>Configure the fields above to generate a pivot table</p>
                </div>
            )}

            {/* Footer */}
            {pivotResult && pivotResult.rows.length > 0 && (
                <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {pivotResult.rows.length} rows × {pivotResult.columns.length} columns
                    </span>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                    >
                        <Download size={16} />
                        Export Pivot
                    </button>
                </div>
            )}
        </div>
    );
}
