import React, { useState, useCallback } from 'react';
import { X, Plus, Link, Trash2, ArrowRight, Edit3 } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

function generateDefaultAlias(tableName, index) {
    const baseName = tableName.replace(/\.(csv|xlsx?|json)$/i, '').replace(/[^a-zA-Z0-9]/g, '_');
    if (baseName.length <= 6) return baseName;
    return `t${index + 1}`;
}

export function JoinConfig({ tables, joins, onUpdateJoins, tableAliases, onUpdateAliases, onClose }) {
    const tableNames = Object.keys(tables);

    const [newJoin, setNewJoin] = useState({
        leftTable: tableNames[0] || '',
        leftColumn: '',
        rightTable: tableNames[1] || '',
        rightColumn: '',
        joinType: 'inner' // Default to inner join
    });

    // Focus trap for modal accessibility
    const handleEscape = useCallback(() => onClose(), [onClose]);
    const modalRef = useFocusTrap(true, { onEscape: handleEscape });

    const getColumnsForTable = (tableName) => {
        if (!tableName || !tables[tableName] || !tables[tableName].data.length) return [];
        return Object.keys(tables[tableName].data[0]);
    };

    const handleAddJoin = () => {
        if (newJoin.leftTable && newJoin.leftColumn && newJoin.rightTable && newJoin.rightColumn) {
            onUpdateJoins([...joins, { ...newJoin }]);
            setNewJoin({
                leftTable: tableNames[0] || '',
                leftColumn: '',
                rightTable: tableNames[1] || '',
                rightColumn: '',
                joinType: 'inner'
            });
        }
    };

    const handleRemoveJoin = (index) => {
        onUpdateJoins(joins.filter((_, i) => i !== index));
    };

    const handleAliasChange = (tableName, newAlias) => {
        onUpdateAliases({
            ...tableAliases,
            [tableName]: newAlias.trim() || generateDefaultAlias(tableName, tableNames.indexOf(tableName))
        });
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-config-title"
        >
            <div 
                ref={modalRef}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                    <h2 id="join-config-title" className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Link size={18} className="text-blue-600" aria-hidden="true" />
                        Configure Table Joins
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        aria-label="Close join configuration"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
                    {/* Table Aliases Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Edit3 size={14} />
                            Table Aliases
                            <span className="text-xs text-gray-400 font-normal">(for shorter column names)</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {tableNames.map((tableName, idx) => (
                                <div key={tableName} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={tableName}>
                                            {tableName}
                                        </div>
                                        <input
                                            type="text"
                                            value={tableAliases[tableName] || ''}
                                            onChange={(e) => handleAliasChange(tableName, e.target.value)}
                                            placeholder={generateDefaultAlias(tableName, idx)}
                                            className="w-full mt-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Existing Joins */}
                    {joins.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Joins</h3>
                            {joins.map((join, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
                                >
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                        join.joinType === 'left' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                        join.joinType === 'right' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                        join.joinType === 'full' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                                        'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                    }`}>
                                        {join.joinType?.toUpperCase() || 'INNER'}
                                    </span>
                                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                                        <span className="font-mono text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                                            <span className="text-purple-600 dark:text-purple-400">{tableAliases[join.leftTable] || join.leftTable}</span>.{join.leftColumn}
                                        </span>
                                        <ArrowRight size={16} className="text-purple-500" aria-hidden="true" />
                                        <span className="font-mono text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                                            <span className="text-purple-600 dark:text-purple-400">{tableAliases[join.rightTable] || join.rightTable}</span>.{join.rightColumn}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveJoin(index)}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                        aria-label={`Remove join between ${join.leftTable} and ${join.rightTable}`}
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
                        
                        {/* Join Type Selection */}
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <label className="text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Join Type:</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'inner', label: 'INNER', desc: 'Only matching rows' },
                                    { value: 'left', label: 'LEFT', desc: 'All left + matching right' },
                                    { value: 'right', label: 'RIGHT', desc: 'All right + matching left' },
                                    { value: 'full', label: 'FULL OUTER', desc: 'All rows from both' }
                                ].map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setNewJoin({ ...newJoin, joinType: type.value })}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                            newJoin.joinType === type.value
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                        title={type.desc}
                                        aria-pressed={newJoin.joinType === type.value}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                            {/* Left Side */}
                            <div className="flex-1 space-y-2">
                                <label className="block text-xs font-medium text-gray-500 uppercase" id="left-table-label">Left Table</label>
                                <select
                                    value={newJoin.leftTable}
                                    onChange={(e) => setNewJoin({ ...newJoin, leftTable: e.target.value, leftColumn: '' })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    aria-labelledby="left-table-label"
                                >
                                    <option value="">Select table</option>
                                    {tableNames.map(name => (
                                        <option key={name} value={name}>{tableAliases[name] || name}</option>
                                    ))}
                                </select>
                                <select
                                    value={newJoin.leftColumn}
                                    onChange={(e) => setNewJoin({ ...newJoin, leftColumn: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    disabled={!newJoin.leftTable}
                                    aria-label="Left column"
                                >
                                    <option value="">Select column</option>
                                    {getColumnsForTable(newJoin.leftTable).map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Equals Sign */}
                            <div className="flex items-center justify-center text-gray-400 font-bold text-lg" aria-hidden="true">=</div>

                            {/* Right Side */}
                            <div className="flex-1 space-y-2">
                                <label className="block text-xs font-medium text-gray-500 uppercase" id="right-table-label">Right Table</label>
                                <select
                                    value={newJoin.rightTable}
                                    onChange={(e) => setNewJoin({ ...newJoin, rightTable: e.target.value, rightColumn: '' })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    aria-labelledby="right-table-label"
                                >
                                    <option value="">Select table</option>
                                    {tableNames.filter(n => n !== newJoin.leftTable).map(name => (
                                        <option key={name} value={name}>{tableAliases[name] || name}</option>
                                    ))}
                                </select>
                                <select
                                    value={newJoin.rightColumn}
                                    onChange={(e) => setNewJoin({ ...newJoin, rightColumn: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    disabled={!newJoin.rightTable}
                                    aria-label="Right column"
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
                            <Plus size={16} aria-hidden="true" />
                            Add Join
                        </button>
                    </div>

                    {/* Info */}
                    <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg space-y-2">
                        <p><strong>Join Types Explained:</strong></p>
                        <ul className="list-disc list-inside space-y-1 text-gray-500 dark:text-gray-400">
                            <li><strong>INNER:</strong> Only rows that match in both tables</li>
                            <li><strong>LEFT:</strong> All rows from left table + matching rows from right</li>
                            <li><strong>RIGHT:</strong> All rows from right table + matching rows from left</li>
                            <li><strong>FULL OUTER:</strong> All rows from both tables, with nulls where no match</li>
                        </ul>
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
