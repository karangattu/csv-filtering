import React, { useState, useMemo, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataTable } from './components/DataTable';
import { FilterGroup } from './components/FilterGroup';
import { ChartsView } from './components/ChartsView';
import { ThemeToggle } from './components/ThemeToggle';
import { TableManager } from './components/TableManager';
import { JoinConfig } from './components/JoinConfig';
import { ColumnStatistics } from './components/ColumnStatistics';
import { DataQualityPanel } from './components/DataQualityPanel';
import { DataCleaningPanel } from './components/DataCleaningPanel';
import { PivotTable } from './components/PivotTable';
import { AnonymizePanel } from './components/AnonymizePanel';
import { useFilter } from './hooks/useFilter';
import { useDarkMode } from './hooks/useDarkMode';
import { detectColumnTypes, applyFilter, performJoin, detectSmartColumnTypes, cn } from './lib/utils';
import { Filter, Download, LayoutGrid, Table as TableIcon, Grid3X3, Shield, Sparkles, BarChart3, ShieldCheck } from 'lucide-react';
import Papa from 'papaparse';

function App() {
    // Multi-table state: { tableName: { data: [], types: {}, smartTypes: {} } }
    const [tables, setTables] = useState({});
    const [activeTable, setActiveTable] = useState(null);
    const [activeTab, setActiveTab] = useState('table'); // 'table' | 'charts' | 'pivot'

    // Join configuration state
    const [joins, setJoins] = useState([]); // [{ leftTable, leftColumn, rightTable, rightColumn }]
    const [isJoinConfigOpen, setIsJoinConfigOpen] = useState(false);
    const [isAddingTable, setIsAddingTable] = useState(false);
    const [isCaseSensitive, setIsCaseSensitive] = useState(false);

    // Premium features state
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isQualityPanelOpen, setIsQualityPanelOpen] = useState(false);
    const [isCleaningPanelOpen, setIsCleaningPanelOpen] = useState(false);
    const [isAnonymizePanelOpen, setIsAnonymizePanelOpen] = useState(false);

    const { filterTree, addCondition, addGroup, removeNode, updateNode, setFilterTree } = useFilter();
    const { theme, toggleTheme } = useDarkMode();

    const tableNames = useMemo(() => Object.keys(tables), [tables]);
    const hasData = tableNames.length > 0;

    // Compute joined data when joins are configured
    const joinedData = useMemo(() => {
        if (tableNames.length === 0) return { data: [], types: {}, columns: [], smartTypes: {} };

        if (joins.length > 0 && tableNames.length >= 2) {
            const result = performJoin(tables, joins);
            return { ...result, smartTypes: detectSmartColumnTypes(result.data) };
        }

        // No joins configured - use active table data
        if (activeTable && tables[activeTable]) {
            const table = tables[activeTable];
            return {
                data: table.data,
                types: table.types,
                columns: table.data.length > 0 ? Object.keys(table.data[0]) : [],
                smartTypes: table.smartTypes || {}
            };
        }

        return { data: [], types: {}, columns: [], smartTypes: {} };
    }, [tables, joins, activeTable, tableNames]);

    // Combined columns from all tables for filtering (prefixed with table name)
    const allColumnsWithTables = useMemo(() => {
        const cols = [];
        tableNames.forEach(tableName => {
            const tableData = tables[tableName]?.data;
            if (tableData && tableData.length > 0) {
                Object.keys(tableData[0]).forEach(col => {
                    cols.push({ table: tableName, column: col, fullName: `${tableName}.${col}` });
                });
            }
        });
        return cols;
    }, [tables, tableNames]);

    // Combined types for filtering
    const allTypesWithTables = useMemo(() => {
        const types = {};
        tableNames.forEach(tableName => {
            const tableTypes = tables[tableName]?.types || {};
            Object.entries(tableTypes).forEach(([col, type]) => {
                types[`${tableName}.${col}`] = type;
            });
        });
        return types;
    }, [tables, tableNames]);

    // Compute unique values per column for filter dropdowns
    const columnUniqueValues = useMemo(() => {
        const data = joinedData.data;
        if (!data || data.length === 0) return {};

        const uniqueVals = {};
        const columns = joinedData.columns;

        columns.forEach(col => {
            const valuesSet = new Set();
            data.forEach(row => {
                const val = row[col];
                if (val !== null && val !== undefined) {
                    valuesSet.add(String(val));
                }
            });
            // Sort values alphabetically
            uniqueVals[col] = Array.from(valuesSet).sort((a, b) => a.localeCompare(b));
        });

        return uniqueVals;
    }, [joinedData.data, joinedData.columns]);

    const handleDataLoaded = useCallback((newData, tableName) => {
        const types = detectColumnTypes(newData);
        const smartTypes = detectSmartColumnTypes(newData);
        setTables(prev => ({
            ...prev,
            [tableName]: { data: newData, types, smartTypes }
        }));
        // Set as active table if it's the first one
        setActiveTable(prev => prev || tableName);
        setIsAddingTable(false);
    }, []);

    const handleRemoveTable = useCallback((tableName) => {
        setTables(prev => {
            const newTables = { ...prev };
            delete newTables[tableName];
            return newTables;
        });
        // Update active table if removed
        setActiveTable(prev => {
            if (prev === tableName) {
                const remaining = Object.keys(tables).filter(t => t !== tableName);
                return remaining[0] || null;
            }
            return prev;
        });
        // Remove joins referencing this table
        setJoins(prev => prev.filter(j => j.leftTable !== tableName && j.rightTable !== tableName));
    }, [tables]);

    const handleClearAll = useCallback(() => {
        setTables({});
        setActiveTable(null);
        setJoins([]);
        setFilterTree({ id: 'root', type: 'group', logic: 'AND', children: [] });
    }, [setFilterTree]);

    // Apply filters to joined data
    const filteredData = useMemo(() => {
        if (joinedData.data.length === 0) return [];
        return joinedData.data.filter(row => applyFilter(row, filterTree, isCaseSensitive));
    }, [joinedData.data, filterTree, isCaseSensitive]);

    // Handle data cleaning updates
    const handleCleaningApply = useCallback((cleanedData) => {
        if (!activeTable || !tables[activeTable]) return;

        const types = detectColumnTypes(cleanedData);
        const smartTypes = detectSmartColumnTypes(cleanedData);
        setTables(prev => ({
            ...prev,
            [activeTable]: { data: cleanedData, types, smartTypes }
        }));
        setIsCleaningPanelOpen(false);
    }, [activeTable, tables]);

    const handleDownload = (dataToDownload = filteredData, filename = 'filtered_data.csv') => {
        const csv = Papa.unparse(dataToDownload);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAnonymizedDownload = useCallback((anonymizedData) => {
        handleDownload(anonymizedData, 'anonymized_data.csv');
    }, []);

    return (
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300`}>

            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4 sticky top-0 z-10 transition-colors">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/30">
                            <Filter className="text-white" size={24} />
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                            Advanced CSV Filtering
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-8 space-y-8">

                {/* Upload Section - Show when no tables or adding new */}
                {(!hasData || isAddingTable) && (
                    <div className="max-w-2xl mx-auto mt-20 animate-in fade-in slide-in-from-bottom-5 duration-500">
                        {isAddingTable && (
                            <button
                                onClick={() => setIsAddingTable(false)}
                                className="mb-4 text-sm text-gray-500 hover:text-blue-600 underline"
                            >
                                ← Cancel
                            </button>
                        )}
                        <FileUpload onDataLoaded={handleDataLoaded} />
                    </div>
                )}

                {hasData && !isAddingTable && (
                    <div className="space-y-6 animate-in fade-in duration-500">

                        {/* Table Manager */}
                        <TableManager
                            tables={tables}
                            activeTable={activeTable}
                            onSelectTable={setActiveTable}
                            onRemoveTable={handleRemoveTable}
                            onAddTable={() => setIsAddingTable(true)}
                            onOpenJoinConfig={() => setIsJoinConfigOpen(true)}
                        />

                        {/* Join Configuration Modal */}
                        {isJoinConfigOpen && (
                            <JoinConfig
                                tables={tables}
                                joins={joins}
                                onUpdateJoins={setJoins}
                                onClose={() => setIsJoinConfigOpen(false)}
                            />
                        )}

                        {/* Premium Feature Modals */}
                        <DataQualityPanel
                            data={filteredData}
                            types={joins.length > 0 ? allTypesWithTables : joinedData.types}
                            isOpen={isQualityPanelOpen}
                            onClose={() => setIsQualityPanelOpen(false)}
                        />

                        <DataCleaningPanel
                            data={joinedData.data}
                            columns={joinedData.columns}
                            isOpen={isCleaningPanelOpen}
                            onClose={() => setIsCleaningPanelOpen(false)}
                            onApply={handleCleaningApply}
                        />

                        <AnonymizePanel
                            data={filteredData}
                            columns={joinedData.columns}
                            smartTypes={joinedData.smartTypes}
                            isOpen={isAnonymizePanelOpen}
                            onClose={() => setIsAnonymizePanelOpen(false)}
                            onDownload={handleAnonymizedDownload}
                        />

                        {/* Action Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <button
                                onClick={handleClearAll}
                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 underline transition-colors"
                            >
                                ← Clear all tables
                            </button>

                            <div className="flex items-center gap-3 flex-wrap justify-center">
                                {/* Join Status */}
                                {joins.length > 0 && (
                                    <div className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-full font-medium">
                                        {joins.length} join{joins.length > 1 ? 's' : ''} active
                                    </div>
                                )}

                                {/* Premium Feature Buttons */}
                                <button
                                    onClick={() => setIsQualityPanelOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                                >
                                    <Shield size={14} />
                                    Data Quality
                                </button>

                                <button
                                    onClick={() => setIsCleaningPanelOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-medium hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                                >
                                    <Sparkles size={14} />
                                    Clean Data
                                </button>

                                {/* View Toggles */}
                                <div className="bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center">
                                    <button
                                        onClick={() => setActiveTab('table')}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'table' ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        <TableIcon size={16} /> Table
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('charts')}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'charts' ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        <LayoutGrid size={16} /> Charts
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('pivot')}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'pivot' ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        <Grid3X3 size={16} /> Pivot
                                    </button>
                                </div>

                                <button
                                    onClick={() => handleDownload()}
                                    disabled={filteredData.length === 0}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download size={18} />
                                    Download CSV
                                </button>

                                <button
                                    onClick={() => setIsAnonymizePanelOpen(true)}
                                    disabled={filteredData.length === 0}
                                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ShieldCheck size={18} />
                                    Anonymize & Download
                                </button>
                            </div>
                        </div>

                        {/* Column Statistics Panel */}
                        {activeTab === 'table' && (
                            <ColumnStatistics
                                data={filteredData}
                                types={joins.length > 0 ? allTypesWithTables : joinedData.types}
                                isOpen={isStatsOpen}
                                onToggle={() => setIsStatsOpen(!isStatsOpen)}
                            />
                        )}

                        {/* Filter Builder */}
                        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                            <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                                <h2 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                    <Filter size={18} />
                                    Filter Records
                                </h2>
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCaseSensitive(!isCaseSensitive)}
                                        className={cn(
                                            "text-xs px-2 py-1 rounded border transition-colors flex items-center gap-1.5 font-medium",
                                            isCaseSensitive
                                                ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300"
                                                : "bg-white border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        )}
                                        title="Match Case Sensitivity"
                                    >
                                        <div className={cn("w-2 h-2 rounded-full", isCaseSensitive ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600")} />
                                        Match Case
                                    </button>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded border border-gray-200 dark:border-gray-700">
                                        <span className="font-semibold text-gray-800 dark:text-gray-100">{filteredData.length}</span> matches found
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <FilterGroup
                                    node={filterTree}
                                    columns={joins.length > 0 ? allColumnsWithTables.map(c => c.fullName) : joinedData.columns}
                                    types={joins.length > 0 ? allTypesWithTables : joinedData.types}
                                    addCondition={addCondition}
                                    addGroup={addGroup}
                                    removeNode={removeNode}
                                    updateNode={updateNode}
                                    columnUniqueValues={columnUniqueValues}
                                />
                            </div>
                        </section>

                        {/* Content Area */}
                        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {activeTab === 'table' ? (
                                <DataTable
                                    data={filteredData}
                                    types={joins.length > 0 ? allTypesWithTables : joinedData.types}
                                    smartTypes={joinedData.smartTypes}
                                />
                            ) : activeTab === 'charts' ? (
                                <ChartsView
                                    data={filteredData}
                                    columns={joinedData.columns}
                                    types={joins.length > 0 ? allTypesWithTables : joinedData.types}
                                />
                            ) : (
                                <PivotTable
                                    data={filteredData}
                                    columns={joinedData.columns}
                                    types={joins.length > 0 ? allTypesWithTables : joinedData.types}
                                />
                            )}
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
