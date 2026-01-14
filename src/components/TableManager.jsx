import React from 'react';
import { Database, X, Plus, Link } from 'lucide-react';

export function TableManager({ tables, activeTable, onSelectTable, onRemoveTable, onAddTable, onOpenJoinConfig }) {
    const tableNames = Object.keys(tables);

    if (tableNames.length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <Database size={16} />
                    Loaded Tables
                </h3>
                <div className="flex items-center gap-2">
                    {tableNames.length >= 2 && (
                        <button
                            type="button"
                            onClick={onOpenJoinConfig}
                            className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                            <Link size={12} />
                            Configure Joins
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onAddTable}
                        className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <Plus size={12} />
                        Add Table
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {tableNames.map(name => (
                    <div
                        key={name}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${activeTable === name
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                    >
                        <button
                            onClick={() => onSelectTable(name)}
                            className="flex items-center gap-2"
                        >
                            <span className="font-medium text-sm">{name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({tables[name].data.length} rows)
                            </span>
                        </button>
                        {tableNames.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemoveTable(name); }}
                                className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                title={`Remove ${name}`}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
