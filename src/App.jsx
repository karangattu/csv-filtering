import React, { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataTable } from './components/DataTable';
import { FilterGroup } from './components/FilterGroup';
import { ChartsView } from './components/ChartsView';
import { ThemeToggle } from './components/ThemeToggle';
import { useFilter } from './hooks/useFilter';
import { useDarkMode } from './hooks/useDarkMode';
import { detectColumnTypes, applyFilter } from './lib/utils';
import { Filter, Download, LayoutGrid, Table as TableIcon } from 'lucide-react';
import Papa from 'papaparse';

function App() {
    const [data, setData] = useState([]);
    const [columnTypes, setColumnTypes] = useState({});
    const [activeTab, setActiveTab] = useState('table'); // 'table' | 'charts'

    const { filterTree, addCondition, addGroup, removeNode, updateNode, setFilterTree } = useFilter();
    const { theme, toggleTheme } = useDarkMode();

    const columns = useMemo(() => {
        if (data.length === 0) return [];
        return Object.keys(data[0]);
    }, [data]);

    const handleDataLoaded = (newData) => {
        setData(newData);
        const types = detectColumnTypes(newData);
        setColumnTypes(types);
    };

    const filteredData = useMemo(() => {
        if (data.length === 0) return [];
        return data.filter(row => applyFilter(row, filterTree));
    }, [data, filterTree]);

    const handleDownload = () => {
        const csv = Papa.unparse(filteredData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'filtered_data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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

                {/* Upload Section */}
                {data.length === 0 ? (
                    <div className="max-w-2xl mx-auto mt-20 animate-in fade-in slide-in-from-bottom-5 duration-500">
                        <FileUpload onDataLoaded={handleDataLoaded} />
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Action Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <button
                                onClick={() => setData([])}
                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 underline transition-colors"
                            >
                                ← Upload a different file
                            </button>

                            <div className="flex items-center gap-3">
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
                                </div>

                                <button
                                    onClick={handleDownload}
                                    disabled={filteredData.length === 0}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download size={18} />
                                    Download CSV
                                </button>
                            </div>
                        </div>

                        {/* Filter Builder */}
                        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                            <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                                <h2 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                    <Filter size={18} />
                                    Filter Records
                                </h2>
                                <div className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded border border-gray-200 dark:border-gray-700">
                                    <span className="font-semibold text-gray-800 dark:text-gray-100">{filteredData.length}</span> matches found
                                </div>
                            </div>
                            <div className="p-6">
                                <FilterGroup
                                    node={filterTree}
                                    columns={columns}
                                    types={columnTypes}
                                    addCondition={addCondition}
                                    addGroup={addGroup}
                                    removeNode={removeNode}
                                    updateNode={updateNode}
                                />
                            </div>
                        </section>

                        {/* Content Area */}
                        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {activeTab === 'table' ? (
                                <DataTable data={filteredData} types={columnTypes} />
                            ) : (
                                <ChartsView data={filteredData} columns={columns} types={columnTypes} />
                            )}
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
