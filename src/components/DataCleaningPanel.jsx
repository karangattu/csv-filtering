import React, { useState, useMemo } from 'react';
import { Sparkles, X, Trash2, Type, CaseSensitive, Hash, Eye, Check, RotateCcw } from 'lucide-react';
import { cleanColumn, removeDuplicateRows } from '../lib/utils';

const CLEANING_OPERATIONS = [
    { id: 'trim', label: 'Trim Whitespace', icon: Sparkles, description: 'Remove leading and trailing spaces' },
    { id: 'uppercase', label: 'UPPERCASE', icon: Type, description: 'Convert all text to uppercase' },
    { id: 'lowercase', label: 'lowercase', icon: Type, description: 'Convert all text to lowercase' },
    { id: 'titlecase', label: 'Title Case', icon: CaseSensitive, description: 'Capitalize first letter of each word' },
    { id: 'removeSpecialChars', label: 'Remove Special Chars', icon: Hash, description: 'Keep only letters, numbers, and spaces' },
    { id: 'numbersOnly', label: 'Numbers Only', icon: Hash, description: 'Keep only numeric characters' }
];

/**
 * Preview row showing before/after for cleaning
 */
function PreviewRow({ before, after, column }) {
    const changed = before !== after;
    return (
        <div className={`flex items-center gap-4 px-3 py-2 rounded text-sm ${changed ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-900/30'}`}>
            <span className="flex-1 truncate text-gray-500 dark:text-gray-400 line-through" title={before}>
                {before || '(empty)'}
            </span>
            <span className="text-gray-400">→</span>
            <span className={`flex-1 truncate font-medium ${changed ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'}`} title={after}>
                {after || '(empty)'}
            </span>
        </div>
    );
}

/**
 * Data Cleaning Panel - Modal for cleaning operations
 */
export function DataCleaningPanel({ data, columns, isOpen, onClose, onApply }) {
    const [selectedColumn, setSelectedColumn] = useState('');
    const [selectedOperation, setSelectedOperation] = useState('');
    const [previewData, setPreviewData] = useState(null);

    // Reset state when opened
    React.useEffect(() => {
        if (isOpen && columns.length > 0) {
            setSelectedColumn(columns[0]);
            setSelectedOperation('');
            setPreviewData(null);
        }
    }, [isOpen, columns]);

    // Generate preview when column and operation are selected
    const preview = useMemo(() => {
        if (!selectedColumn || !selectedOperation || !data || data.length === 0) {
            return [];
        }

        // Get first 10 rows that would be affected
        const sampleData = data.slice(0, 100);
        const cleanedData = cleanColumn(sampleData, selectedColumn, selectedOperation);

        return sampleData
            .map((row, idx) => ({
                before: String(row[selectedColumn] ?? ''),
                after: String(cleanedData[idx][selectedColumn] ?? '')
            }))
            .filter(item => item.before !== item.after)
            .slice(0, 10);
    }, [data, selectedColumn, selectedOperation]);

    const handleApply = () => {
        if (!selectedColumn || !selectedOperation) return;

        const cleanedData = cleanColumn(data, selectedColumn, selectedOperation);
        onApply(cleanedData);
        setPreviewData(null);
    };

    const handleRemoveDuplicates = () => {
        const dedupedData = removeDuplicateRows(data);
        const removed = data.length - dedupedData.length;
        if (removed > 0) {
            onApply(dedupedData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Sparkles className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Data Cleaning</h2>
                            <p className="text-violet-100 text-sm">Transform and clean your data</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-100px)]">
                    {/* Column Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Column
                        </label>
                        <select
                            value={selectedColumn}
                            onChange={(e) => { setSelectedColumn(e.target.value); setSelectedOperation(''); }}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            {columns.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

                    {/* Operations Grid */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Choose Operation
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {CLEANING_OPERATIONS.map(op => {
                                const Icon = op.icon;
                                const isSelected = selectedOperation === op.id;
                                return (
                                    <button
                                        key={op.id}
                                        onClick={() => setSelectedOperation(op.id)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${isSelected
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        <span className="text-xs font-medium text-center">{op.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Preview Section */}
                    {selectedOperation && preview.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center gap-2 mb-3">
                                <Eye size={16} className="text-purple-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Preview ({preview.length} changes shown)
                                </span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                                {preview.map((item, idx) => (
                                    <PreviewRow key={idx} before={item.before} after={item.after} column={selectedColumn} />
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedOperation && preview.length === 0 && (
                        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                            <Check size={32} className="mx-auto mb-2 text-green-500" />
                            <p className="text-sm">No changes needed - column is already clean!</p>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <button
                            onClick={handleRemoveDuplicates}
                            className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                        >
                            <Trash2 size={16} />
                            Remove Duplicate Rows
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!selectedOperation || preview.length === 0}
                        className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-colors"
                    >
                        <Check size={18} />
                        Apply Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
