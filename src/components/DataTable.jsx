import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';

export function DataTable({ data }) {
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 100;

    // Sorting state
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Column Visibility state
    // We initialize this when data loads. 
    // Note: if columns change dynamically, this might need an effect, but for CSV it's usually static per file.
    const [visibleColumns, setVisibleColumns] = useState([]);
    const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

    const allColumns = useMemo(() => {
        if (!data || data.length === 0) return [];
        return Object.keys(data[0]);
    }, [data]);

    useEffect(() => {
        // Reset visibility when dataset changes (columns might differ)
        setVisibleColumns(prev => {
            // If we already have visibility set and columns match, keep it. 
            // Simplification: just reset to all visible on new file load
            return allColumns;
        });
        setCurrentPage(1);
        setSortConfig({ key: null, direction: 'asc' });
    }, [data, allColumns]);

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                No results found.
            </div>
        );
    }

    // Handle Sorting
    const sortedData = useMemo(() => {
        let sortableItems = [...data];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                // Basic Type Inference for sorting
                const aNum = Number(aVal);
                const bNum = Number(bVal);

                if (!isNaN(aNum) && !isNaN(bNum) && aVal !== '' && bVal !== '') {
                    aVal = aNum;
                    bVal = bNum;
                } else {
                    // String comparison
                    aVal = String(aVal).toLowerCase();
                    bVal = String(bVal).toLowerCase();
                }

                if (aVal < bVal) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aVal > bVal) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    // Request Sort Function
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Pagination Logic
    const totalPages = Math.ceil(sortedData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentData = sortedData.slice(startIndex, startIndex + rowsPerPage);

    // Toggle Column
    const toggleColumn = (col) => {
        setVisibleColumns(prev =>
            prev.includes(col)
                ? prev.filter(c => c !== col)
                : [...prev, col]
        );
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Table Actions / Toolbar */}
            <div className="flex justify-end relative">
                <button
                    onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                    <Eye size={16} />
                    Columns
                </button>

                {/* Dropdown Panel */}
                {isColumnDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 p-2 max-h-60 overflow-y-auto">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">Toggle Visibility</div>
                        {allColumns.map(col => (
                            <label key={col} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.includes(col)}
                                    onChange={() => toggleColumn(col)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{col}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                    <thead className="text-xs text-gray-700 dark:text-gray-200 uppercase bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            {allColumns.filter(col => visibleColumns.includes(col)).map(col => (
                                <th
                                    key={col}
                                    className="px-6 py-3 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group select-none"
                                    onClick={() => requestSort(col)}
                                >
                                    <div className="flex items-center gap-2">
                                        {col}
                                        <span className="text-gray-400">
                                            {sortConfig.key === col ? (
                                                sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                                            ) : (
                                                <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.map((row, i) => (
                            <tr key={i} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 last:border-b-0 transition-colors">
                                {allColumns.filter(col => visibleColumns.includes(col)).map(col => (
                                    <td key={`${i}-${col}`} className="px-6 py-4 whitespace-nowrap">
                                        {row[col] && typeof row[col] === 'string' && row[col].length > 50
                                            ? row[col].substring(0, 50) + '...'
                                            : row[col]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(startIndex + rowsPerPage, sortedData.length)}</span> of <span className="font-semibold">{sortedData.length}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
