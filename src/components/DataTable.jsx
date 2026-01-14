import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Eye, Search } from 'lucide-react';

export function DataTable({ data, types }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [searchTerm, setSearchTerm] = useState('');

    // Sorting state
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Column Visibility state
    const [visibleColumns, setVisibleColumns] = useState([]);
    const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

    const allColumns = useMemo(() => {
        if (!data || data.length === 0) return [];
        return Object.keys(data[0]);
    }, [data]);

    useEffect(() => {
        setVisibleColumns(prev => allColumns);
        setCurrentPage(1);
        setSortConfig({ key: null, direction: 'asc' });
        setSearchTerm('');
    }, [data, allColumns]);

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                No results found.
            </div>
        );
    }

    // 1. Search Filtering
    const searchedData = useMemo(() => {
        if (!searchTerm) return data;
        const lowerTerm = searchTerm.toLowerCase();
        return data.filter(row =>
            Object.values(row).some(val =>
                String(val).toLowerCase().includes(lowerTerm)
            )
        );
    }, [data, searchTerm]);

    // 2. Sorting
    const sortedData = useMemo(() => {
        let sortableItems = [...searchedData];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                const aNum = Number(aVal);
                const bNum = Number(bVal);

                if (!isNaN(aNum) && !isNaN(bNum) && aVal !== '' && bVal !== '') {
                    aVal = aNum;
                    bVal = bNum;
                } else {
                    aVal = String(aVal).toLowerCase();
                    bVal = String(bVal).toLowerCase();
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [searchedData, sortConfig]);

    // 2.5 Column Sums (computed on sortedData which represents the full filtered/searched dataset)
    const columnSums = useMemo(() => {
        if (!sortedData || sortedData.length === 0 || !types) return {};

        const sums = {};
        allColumns.forEach(col => {
            if (types[col] === 'number') {
                const sum = sortedData.reduce((acc, row) => {
                    const val = Number(row[col]);
                    return acc + (isNaN(val) ? 0 : val);
                }, 0);
                // Round to 2 decimal places if needed, or keep precision? 
                // Let's keep up to 2 decimals for display to be safe
                sums[col] = Math.round(sum * 100) / 100;
            }
        });
        return sums;
    }, [sortedData, allColumns, types]);

    // Request Sort Function
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // 3. Pagination
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
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            {/* Table Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Quick search..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 relative">
                    {/* Rows Per Page */}
                    <select
                        value={rowsPerPage}
                        onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={10}>10 rows</option>
                        <option value={20}>20 rows</option>
                        <option value={50}>50 rows</option>
                        <option value={100}>100 rows</option>
                        <option value={500}>500 rows</option>
                    </select>

                    {/* Columns Toggle */}
                    <button
                        onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                    >
                        <Eye size={16} />
                        Columns
                    </button>

                    {/* Columns Dropdown */}
                    {isColumnDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 p-2 max-h-60 overflow-y-auto ring-1 ring-black/5">
                            <div className="flex justify-between items-center px-2 mb-2">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Toggle Visibility</span>
                                <button
                                    onClick={() => setVisibleColumns(allColumns)}
                                    className="text-[10px] text-blue-600 hover:underline"
                                >
                                    Reset
                                </button>
                            </div>
                            {allColumns.map(col => (
                                <label key={col} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns.includes(col)}
                                        onChange={() => toggleColumn(col)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-200 truncate group-hover:text-gray-900 dark:group-hover:text-white">{col}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Table Container - Fixed Height for Sticky Header */}
            <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 max-h-[70vh] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300 relative">
                    <thead className="text-xs text-gray-700 dark:text-gray-200 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
                        <tr>
                            {allColumns.filter(col => visibleColumns.includes(col)).map(col => (
                                <th
                                    key={col}
                                    className="px-6 py-3 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group select-none bg-gray-50 dark:bg-gray-900"
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
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {currentData.length > 0 ? (
                            currentData.map((row, i) => (
                                <tr key={i} className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                    {allColumns.filter(col => visibleColumns.includes(col)).map(col => (
                                        <td key={`${i}-${col}`} className="px-6 py-3 whitespace-nowrap">
                                            {row[col] && typeof row[col] === 'string' && row[col].length > 50
                                                ? <span title={row[col]}>{row[col].substring(0, 50)}...</span>
                                                : row[col]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={visibleColumns.length} className="px-6 py-10 text-center text-gray-500">
                                    No matches found for "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {/* Footer Sums */}
                    <tfoot className="bg-gray-100 dark:bg-gray-900 border-t-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-gray-100 sticky bottom-0 z-10 shadow-md">
                        <tr>
                            {allColumns.filter(col => visibleColumns.includes(col)).map(col => (
                                <td key={`sum-${col}`} className="px-6 py-3 whitespace-nowrap text-sm">
                                    {types && types[col] === 'number' ? (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-gray-500 font-normal">Sum</span>
                                            <span>{columnSums[col]?.toLocaleString() ?? '-'}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 font-normal text-xs">-</span>
                                    )}
                                </td>
                            ))}
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{startIndex + 1}</span> to <span className="font-semibold text-gray-900 dark:text-gray-100">{Math.min(startIndex + rowsPerPage, sortedData.length)}</span> of <span className="font-semibold text-gray-900 dark:text-gray-100">{sortedData.length}</span> results
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px] text-center">
                        Page {currentPage} / {totalPages || 1}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div >
    );
}
