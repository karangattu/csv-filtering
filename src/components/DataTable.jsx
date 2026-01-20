import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Eye, Search, Pin, GripVertical } from 'lucide-react';
import { SmartColumnBadge, TypeBadge } from './SmartColumnBadge';

export function DataTable({ data, types, smartTypes = {} }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCaseSensitiveSearch, setIsCaseSensitiveSearch] = useState(false);

    // Sorting state
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Column Visibility state
    const [visibleColumns, setVisibleColumns] = useState([]);
    const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
    const [columnSearchTerm, setColumnSearchTerm] = useState('');

    // Column Freezing state
    const [frozenColumns, setFrozenColumns] = useState([]);

    // Column Reordering state
    const [columnOrder, setColumnOrder] = useState([]);
    const [draggedColumn, setDraggedColumn] = useState(null);

    const allColumns = useMemo(() => {
        if (!data || data.length === 0) return [];
        return Object.keys(data[0]);
    }, [data]);

    // Ordered columns based on user reordering and frozen columns
    const orderedColumns = useMemo(() => {
        if (columnOrder.length === 0) return allColumns;
        // Ensure all columns are in the order array
        const orderSet = new Set(columnOrder);
        const newCols = allColumns.filter(col => !orderSet.has(col));
        return [...columnOrder.filter(col => allColumns.includes(col)), ...newCols];
    }, [columnOrder, allColumns]);

    // Display columns: frozen first, then unfrozen, filtered by visibility
    const displayColumns = useMemo(() => {
        const visible = orderedColumns.filter(col => visibleColumns.includes(col));
        const frozen = visible.filter(col => frozenColumns.includes(col));
        const unfrozen = visible.filter(col => !frozenColumns.includes(col));
        return [...frozen, ...unfrozen];
    }, [orderedColumns, visibleColumns, frozenColumns]);

    const filteredColumns = useMemo(() => {
        if (!columnSearchTerm) return orderedColumns;
        const term = columnSearchTerm.toLowerCase();
        return orderedColumns.filter(col => col.toLowerCase().includes(term));
    }, [orderedColumns, columnSearchTerm]);

    useEffect(() => {
        setVisibleColumns(allColumns);
        setColumnOrder(allColumns);
        setFrozenColumns([]);
        setCurrentPage(1);
        setSortConfig({ key: null, direction: 'asc' });
        setSearchTerm('');
        setColumnSearchTerm('');
    }, [data, allColumns]);

    // Toggle column freeze
    const toggleFreezeColumn = useCallback((col) => {
        setFrozenColumns(prev => 
            prev.includes(col) 
                ? prev.filter(c => c !== col)
                : [...prev, col]
        );
    }, []);

    // Drag and drop handlers for column reordering
    const handleDragStart = useCallback((e, col) => {
        setDraggedColumn(col);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', col);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e, targetCol) => {
        e.preventDefault();
        if (!draggedColumn || draggedColumn === targetCol) return;

        setColumnOrder(prev => {
            const newOrder = [...prev];
            const dragIndex = newOrder.indexOf(draggedColumn);
            const targetIndex = newOrder.indexOf(targetCol);
            
            if (dragIndex === -1 || targetIndex === -1) return prev;
            
            newOrder.splice(dragIndex, 1);
            newOrder.splice(targetIndex, 0, draggedColumn);
            return newOrder;
        });
        setDraggedColumn(null);
    }, [draggedColumn]);

    // 1. Search Filtering
    const searchedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        if (!searchTerm) return data;

        const term = isCaseSensitiveSearch ? searchTerm : searchTerm.toLowerCase();

        return data.filter(row =>
            Object.values(row).some(val => {
                const rowVal = String(val ?? '');
                const finalRowVal = isCaseSensitiveSearch ? rowVal : rowVal.toLowerCase();
                return finalRowVal.includes(term);
            })
        );
    }, [data, searchTerm, isCaseSensitiveSearch]);

    // 2. Sorting
    const sortedData = useMemo(() => {
        if (searchedData.length === 0) return [];
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

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                No results found.
            </div>
        );
    }

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

    const splitColumnName = (col) => {
        const lastDot = col.lastIndexOf('.');
        if (lastDot === -1) return { table: null, column: col };
        return {
            table: col.slice(0, lastDot),
            column: col.slice(lastDot + 1)
        };
    };

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            {/* Table Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">

                {/* Search Input */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Quick search..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none w-full transition-all"
                        />
                    </div>
                    <button
                        onClick={() => { setIsCaseSensitiveSearch(!isCaseSensitiveSearch); setCurrentPage(1); }}
                        className={`text-[10px] px-2 py-1.5 rounded border transition-colors font-medium flex items-center gap-1.5 whitespace-nowrap ${isCaseSensitiveSearch
                            ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300"
                            : "bg-white border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                        title="Match Case Sensitivity for Quick Search"
                    >
                        Aa
                    </button>
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
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 p-2 max-h-72 overflow-y-auto ring-1 ring-black/5">
                            <div className="flex justify-between items-center px-2 mb-2">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Toggle Visibility & Freeze</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setFrozenColumns([])}
                                        className="text-[10px] text-orange-600 hover:underline"
                                        aria-label="Unfreeze all columns"
                                    >
                                        Unfreeze All
                                    </button>
                                    <button
                                        onClick={() => { setVisibleColumns(allColumns); setColumnOrder(allColumns); }}
                                        className="text-[10px] text-blue-600 hover:underline"
                                        aria-label="Reset column visibility and order"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                            <div className="px-2 mb-2">
                                <input
                                    type="text"
                                    value={columnSearchTerm}
                                    onChange={(e) => setColumnSearchTerm(e.target.value)}
                                    placeholder="Search columns..."
                                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                    aria-label="Search columns"
                                />
                            </div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 px-2 mb-1">
                                Drag to reorder • Click pin to freeze
                            </div>
                            {filteredColumns.map(col => (
                                <div 
                                    key={col} 
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-move group"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, col)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, col)}
                                >
                                    <GripVertical size={12} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 flex-shrink-0" aria-hidden="true" />
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns.includes(col)}
                                        onChange={() => toggleColumn(col)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                        aria-label={`Toggle visibility for ${col}`}
                                    />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleFreezeColumn(col); }}
                                        className={`p-0.5 rounded transition-colors flex-shrink-0 ${
                                            frozenColumns.includes(col)
                                                ? 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
                                                : 'text-gray-300 dark:text-gray-600 hover:text-orange-500'
                                        }`}
                                        title={frozenColumns.includes(col) ? 'Unfreeze column' : 'Freeze column'}
                                        aria-label={frozenColumns.includes(col) ? `Unfreeze ${col}` : `Freeze ${col}`}
                                        aria-pressed={frozenColumns.includes(col)}
                                    >
                                        <Pin size={12} />
                                    </button>
                                    {(() => {
                                        const { table, column } = splitColumnName(col);
                                        return (
                                            <span className="text-sm text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white flex-1 min-w-0" title={col}>
                                                <span className="block font-medium truncate">{column}</span>
                                                {table && (
                                                    <span className="block text-[10px] text-gray-400 dark:text-gray-500 truncate">{table}</span>
                                                )}
                                            </span>
                                        );
                                    })()}
                                </div>
                            ))}
                            {filteredColumns.length === 0 && (
                                <div className="px-2 py-2 text-xs text-gray-400">No columns found.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Frozen columns indicator */}
            {frozenColumns.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-800">
                    <Pin size={12} aria-hidden="true" />
                    <span>{frozenColumns.length} column{frozenColumns.length > 1 ? 's' : ''} frozen</span>
                    <button 
                        onClick={() => setFrozenColumns([])} 
                        className="ml-auto hover:underline"
                        aria-label="Unfreeze all columns"
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Table Container - Fixed Height for Sticky Header */}
            <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 max-h-[70vh] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300 relative" role="grid">
                    <thead className="text-xs text-gray-700 dark:text-gray-200 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
                        <tr>
                            {displayColumns.map((col, colIndex) => {
                                const isFrozen = frozenColumns.includes(col);
                                return (
                                    <th
                                        key={col}
                                        className={`px-6 py-3 font-semibold whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group select-none bg-gray-50 dark:bg-gray-900 ${
                                            isFrozen ? 'sticky left-0 z-20 border-r-2 border-orange-300 dark:border-orange-600' : ''
                                        }`}
                                        style={isFrozen ? { left: colIndex * 150 + 'px' } : undefined}
                                        onClick={() => requestSort(col)}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, col)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, col)}
                                        aria-sort={sortConfig.key === col ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isFrozen && <Pin size={10} className="text-orange-500" aria-hidden="true" />}
                                            <span className="truncate max-w-[150px]" title={col}>{col}</span>
                                            {smartTypes[col]?.smartType ? (
                                                <SmartColumnBadge
                                                    smartType={smartTypes[col].smartType}
                                                    validPercent={smartTypes[col].validPercent}
                                                    showValidation={true}
                                                />
                                            ) : types[col] ? (
                                                <TypeBadge type={types[col]} />
                                            ) : null}
                                            <span className="text-gray-400" aria-hidden="true">
                                                {sortConfig.key === col ? (
                                                    sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                                                ) : (
                                                    <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {currentData.length > 0 ? (
                            currentData.map((row, i) => (
                                <tr key={i} className="bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                    {displayColumns.map((col, colIndex) => {
                                        const isFrozen = frozenColumns.includes(col);
                                        return (
                                            <td 
                                                key={`${i}-${col}`} 
                                                className={`px-6 py-3 whitespace-nowrap ${
                                                    isFrozen ? 'sticky left-0 bg-white dark:bg-gray-800 border-r-2 border-orange-300 dark:border-orange-600 z-10' : ''
                                                }`}
                                                style={isFrozen ? { left: colIndex * 150 + 'px' } : undefined}
                                            >
                                                {row[col] != null && typeof row[col] === 'string' && row[col].length > 50
                                                    ? <span title={row[col]}>{row[col].substring(0, 50)}...</span>
                                                    : (row[col] ?? <span className="text-gray-300 dark:text-gray-600 italic">null</span>)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={displayColumns.length} className="px-6 py-10 text-center text-gray-500">
                                    No matches found for "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {/* Footer Sums */}
                    <tfoot className="bg-gray-100 dark:bg-gray-900 border-t-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-gray-100 sticky bottom-0 z-10 shadow-md">
                        <tr>
                            {displayColumns.map((col, colIndex) => {
                                const isFrozen = frozenColumns.includes(col);
                                return (
                                    <td 
                                        key={`sum-${col}`} 
                                        className={`px-6 py-3 whitespace-nowrap text-sm ${
                                            isFrozen ? 'sticky left-0 bg-gray-100 dark:bg-gray-900 border-r-2 border-orange-300 dark:border-orange-600 z-10' : ''
                                        }`}
                                        style={isFrozen ? { left: colIndex * 150 + 'px' } : undefined}
                                    >
                                        {types && types[col] === 'number' ? (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase text-gray-500 font-normal">Sum</span>
                                                <span>{columnSums[col]?.toLocaleString() ?? '-'}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 font-normal text-xs">-</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Pagination Controls */}
            <nav className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm gap-4" aria-label="Pagination">
                <div className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
                    Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{startIndex + 1}</span> to <span className="font-semibold text-gray-900 dark:text-gray-100">{Math.min(startIndex + rowsPerPage, sortedData.length)}</span> of <span className="font-semibold text-gray-900 dark:text-gray-100">{sortedData.length}</span> results
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
                        aria-label="Go to previous page"
                    >
                        <ChevronLeft size={18} aria-hidden="true" />
                    </button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[80px] text-center" aria-current="page">
                        Page {currentPage} / {totalPages || 1}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
                        aria-label="Go to next page"
                    >
                        <ChevronRight size={18} aria-hidden="true" />
                    </button>
                </div>
            </nav>
        </div >
    );
}
