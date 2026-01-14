import React, { useState } from 'react';
import { X, Plus, Link, Trash2, ArrowRight } from 'lucide-react';

export function JoinConfig({ tables, joins, onUpdateJoins, onClose }) {
    const tableNames = Object.keys(tables);

    const [newJoin, setNewJoin] = useState({
        leftTable: tableNames[0] || '',
        leftColumn: '',
        rightTable: tableNames[1] || '',
        rightColumn: ''
    });

    const getColumnsForTable = (tableName) => {
        if (!tableName || !tables[tableName] || !tables[tableName].data.length) return [];
        return Object.keys(tables[tableName].data[0]);
    };

    const handleAddJoin = () => {
        if (newJoin.leftTable && newJoin.leftColumn && newJoin.rightTable && newJoin.rightColumn) {
            onUpdateJoins([...joins, { ...newJoin }]);
            // Reset for next join
            setNewJoin({
                leftTable: tableNames[0] || '',
                leftColumn: '',
                rightTable: tableNames[1] || '',
                rightColumn: ''
            });
        }
    };

    const handleRemoveJoin = (index) => {
        onUpdateJoins(joins.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Link size={18} className="text-blue-600" />
                        Configure Table Joins
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                    {/* Existing Joins */}
                    {joins.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Joins</h3>
                            {joins.map((join, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
                                >
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="font-mono text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                                            {join.leftTable}.{join.leftColumn}
                                        </span>
                                        <ArrowRight size={16} className="text-purple-500" />
                                        <span className="font-mono text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                                            {join.rightTable}.{join.rightColumn}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveJoin(index)}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add New Join */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Add New Join</h3>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                            {/* Left Side */}
                            <div className="flex-1 space-y-2">
                                <label className="block text-xs font-medium text-gray-500 uppercase">Left Table</label>
                                <select
                                    value={newJoin.leftTable}
                                    onChange={(e) => setNewJoin({ ...newJoin, leftTable: e.target.value, leftColumn: '' })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Select table</option>
                                    {tableNames.map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                                <select
                                    value={newJoin.leftColumn}
                                    onChange={(e) => setNewJoin({ ...newJoin, leftColumn: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    disabled={!newJoin.leftTable}
                                >
                                    <option value="">Select column</option>
                                    {getColumnsForTable(newJoin.leftTable).map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Equals Sign */}
                            <div className="flex items-center justify-center text-gray-400 font-bold text-lg">=</div>

                            {/* Right Side */}
                            <div className="flex-1 space-y-2">
                                <label className="block text-xs font-medium text-gray-500 uppercase">Right Table</label>
                                <select
                                    value={newJoin.rightTable}
                                    onChange={(e) => setNewJoin({ ...newJoin, rightTable: e.target.value, rightColumn: '' })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Select table</option>
                                    {tableNames.filter(n => n !== newJoin.leftTable).map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                                <select
                                    value={newJoin.rightColumn}
                                    onChange={(e) => setNewJoin({ ...newJoin, rightColumn: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    disabled={!newJoin.rightTable}
                                >
                                    <option value="">Select column</option>
                                    {getColumnsForTable(newJoin.rightTable).map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddJoin}
                            disabled={!newJoin.leftColumn || !newJoin.rightColumn}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={16} />
                            Add Join
                        </button>
                    </div>

                    {/* Info */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg">
                        <strong>How it works:</strong> Joins combine rows from different tables where the specified columns match (INNER JOIN).
                        The resulting data will include columns from both tables, prefixed with their table names.
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
