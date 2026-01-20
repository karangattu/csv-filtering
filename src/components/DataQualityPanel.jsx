import React, { useMemo, useCallback } from 'react';
import { Shield, X, AlertTriangle, CheckCircle, XCircle, Copy, AlertOctagon } from 'lucide-react';
import { detectDataQuality } from '../lib/utils';
import { useFocusTrap } from '../hooks/useFocusTrap';

/**
 * Circular progress indicator for quality score
 */
function QualityRing({ score }) {
    const radius = 40;
    const strokeWidth = 8;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    // Color based on score
    let color = 'text-green-500';
    let bgColor = 'text-green-100 dark:text-green-900/30';
    let label = 'Excellent';

    if (score < 60) {
        color = 'text-red-500';
        bgColor = 'text-red-100 dark:text-red-900/30';
        label = 'Poor';
    } else if (score < 80) {
        color = 'text-amber-500';
        bgColor = 'text-amber-100 dark:text-amber-900/30';
        label = 'Fair';
    } else if (score < 90) {
        color = 'text-blue-500';
        bgColor = 'text-blue-100 dark:text-blue-900/30';
        label = 'Good';
    }

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={radius * 2} height={radius * 2} className="transform -rotate-90">
                <circle
                    className={bgColor}
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    className={color}
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className={`text-2xl font-bold ${color}`}>{score}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
            </div>
        </div>
    );
}

/**
 * Quality indicator badge
 */
function QualityBadge({ score }) {
    if (score >= 90) {
        return <CheckCircle size={16} className="text-green-500" />;
    } else if (score >= 70) {
        return <AlertTriangle size={16} className="text-amber-500" />;
    }
    return <XCircle size={16} className="text-red-500" />;
}

/**
 * Data Quality Panel - Modal showing quality metrics
 */
export function DataQualityPanel({ data, types, isOpen, onClose }) {
    const quality = useMemo(() => {
        if (!data || data.length === 0) return null;
        return detectDataQuality(data, types);
    }, [data, types]);

    // Focus trap for modal accessibility
    const handleEscape = useCallback(() => onClose(), [onClose]);
    const modalRef = useFocusTrap(isOpen && quality != null, { onEscape: handleEscape });

    if (!isOpen || !quality) return null;

    const columns = Object.keys(quality.columns);

    return (
        <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quality-panel-title"
        >
            <div 
                ref={modalRef}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg" aria-hidden="true">
                            <Shield className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 id="quality-panel-title" className="text-xl font-bold text-white">Data Quality Report</h2>
                            <p className="text-emerald-100 text-sm">{quality.totalRows} rows analyzed</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                        aria-label="Close data quality report"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
                    {/* Score Overview */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <QualityRing score={quality.overall} />

                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center sm:text-left">
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                    {quality.totalRows}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    Total Rows
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center sm:justify-start gap-2">
                                    <Copy size={18} />
                                    {quality.rowDuplicates}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    Duplicate Rows
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {columns.length}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    Columns
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column Details Table */}
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Column</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Score</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Missing</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Duplicates</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Outliers</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {columns.map(col => {
                                    const colQuality = quality.columns[col];
                                    return (
                                        <tr key={col} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                            <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]" title={col}>
                                                {col}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-bold ${colQuality.score >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        colQuality.score >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                    {colQuality.score}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-xs ${colQuality.missing.count > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
                                                    {colQuality.missing.count > 0 ? (
                                                        <>{colQuality.missing.count} <span className="text-gray-400">({colQuality.missing.percent}%)</span></>
                                                    ) : '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-xs ${colQuality.duplicates.count > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                                                    {colQuality.duplicates.count > 0 ? colQuality.duplicates.count : '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-xs ${colQuality.outliers.outlierCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                                                    {colQuality.outliers.outlierCount > 0 ? (
                                                        <span className="flex items-center justify-center gap-1">
                                                            <AlertOctagon size={12} />
                                                            {colQuality.outliers.outlierCount}
                                                        </span>
                                                    ) : '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <QualityBadge score={colQuality.score} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
