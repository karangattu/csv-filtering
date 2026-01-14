import React, { useMemo, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function ChartsView({ data, columns, types }) {
    // Find categorical columns (strings with low cardinality) to chart
    const categoricalColumns = useMemo(() => {
        return columns.filter(col => {
            const type = types[col];
            // Heuristic: If it's a string and has < 20 unique values, it's good for a chart
            if (type === 'string') {
                const uniqueValues = new Set(data.map(row => row[col])).size;
                return uniqueValues > 0 && uniqueValues < 20;
            }
            return false;
        });
    }, [data, columns, types]);

    const [selectedColumn, setSelectedColumn] = useState('');

    // Set default column when categoricalColumns changes or if selectedColumn is no longer valid
    React.useEffect(() => {
        if (categoricalColumns.length > 0) {
            if (!selectedColumn || !categoricalColumns.includes(selectedColumn)) {
                setSelectedColumn(categoricalColumns[0]);
            }
        } else {
            setSelectedColumn('');
        }
    }, [categoricalColumns, selectedColumn]);

    const chartData = useMemo(() => {
        if (!selectedColumn) return [];

        // Aggregate counts
        const counts = {};
        data.forEach(row => {
            const val = row[selectedColumn] || '(Empty)';
            counts[val] = (counts[val] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Sort desc
    }, [data, selectedColumn]);

    if (categoricalColumns.length === 0) {
        return (
            <div className="p-10 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                No suitable categorical columns found to chart (need columns with &lt; 20 unique values).
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Quick Visualization</h3>
                <select
                    value={selectedColumn}
                    onChange={(e) => setSelectedColumn(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    {categoricalColumns.map(col => (
                        <option key={col} value={col}>Group by {col}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-80">
                {/* Bar Chart */}
                <div className="min-h-[300px] w-full">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 text-center">Bar Chart</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} />
                            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="min-h-[300px] w-full">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 text-center">Distribution</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
