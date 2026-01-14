import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { calculateColumnStats } from '../lib/utils';

/**
 * Mini sparkline component to show distribution
 */
function Sparkline({ data, color = '#3b82f6' }) {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data);
    const height = 24;
    const width = 60;
    const barWidth = width / data.length - 1;

    return (
        <svg width={width} height={height} className="inline-block">
            {data.map((val, i) => {
                const barHeight = max > 0 ? (val / max) * height : 0;
                return (
                    <rect
                        key={i}
                        x={i * (barWidth + 1)}
                        y={height - barHeight}
                        width={barWidth}
                        height={barHeight}
                        fill={color}
                        opacity={0.7 + (val / max) * 0.3}
                        rx={1}
                    />
                );
            })}
        </svg>
    );
}

/**
 * Single stat card for a column
 */
function StatCard({ column, stats }) {
    if (!stats) return null;

    return (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 truncate text-sm" title={column}>
                    {column}
                </h4>
                <Sparkline data={stats.distribution} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="space-y-0.5">
                    <div className="text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[10px]">Min</div>
                    <div className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <TrendingDown size={12} />
                        {stats.min?.toLocaleString() ?? '-'}
                    </div>
                </div>
                <div className="space-y-0.5">
                    <div className="text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[10px]">Max</div>
                    <div className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                        <TrendingUp size={12} />
                        {stats.max?.toLocaleString() ?? '-'}
                    </div>
                </div>
                <div className="space-y-0.5">
                    <div className="text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[10px]">Avg</div>
                    <div className="font-semibold text-purple-600 dark:text-purple-400">
                        {stats.avg?.toLocaleString() ?? '-'}
                    </div>
                </div>
                <div className="space-y-0.5">
                    <div className="text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[10px]">Median</div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                        {stats.median?.toLocaleString() ?? '-'}
                    </div>
                </div>
                <div className="space-y-0.5">
                    <div className="text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[10px]">Mode</div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                        {stats.mode?.toLocaleString() ?? '-'}
                    </div>
                </div>
                <div className="space-y-0.5">
                    <div className="text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[10px]">Std Dev</div>
                    <div className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Activity size={10} />
                        {stats.stdDev?.toLocaleString() ?? '-'}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Column Statistics Panel - shows stats for all numeric columns
 */
export function ColumnStatistics({ data, types, isOpen, onToggle }) {
    const numericColumns = useMemo(() => {
        if (!types) return [];
        return Object.entries(types)
            .filter(([_, type]) => type === 'number')
            .map(([col]) => col);
    }, [types]);

    const columnStats = useMemo(() => {
        if (!data || data.length === 0) return {};

        const stats = {};
        numericColumns.forEach(col => {
            stats[col] = calculateColumnStats(data, col);
        });
        return stats;
    }, [data, numericColumns]);

    if (numericColumns.length === 0) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 shadow-sm">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg shadow-md">
                        <BarChart3 className="text-white" size={18} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                            Column Statistics
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {numericColumns.length} numeric column{numericColumns.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {isOpen && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {numericColumns.map(col => (
                            <StatCard key={col} column={col} stats={columnStats[col]} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
