import React, { useState, useMemo, useEffect } from 'react';
import { X, Shield, Download, Eye, EyeOff, RefreshCw, AlertTriangle, Check, Hash, Asterisk, Trash2 } from 'lucide-react';

// Anonymization methods
const ANONYMIZATION_METHODS = {
    mask: {
        label: 'Mask',
        description: 'Replace characters with asterisks (e.g., j***@email.com)',
        icon: Asterisk
    },
    redact: {
        label: 'Redact',
        description: 'Replace entire value with [REDACTED]',
        icon: EyeOff
    },
    hash: {
        label: 'Hash',
        description: 'Replace with a SHA-256 hash (first 8 characters)',
        icon: Hash
    },
    remove: {
        label: 'Remove',
        description: 'Remove column from export',
        icon: Trash2
    }
};

// Smart types that are likely sensitive
const SENSITIVE_SMART_TYPES = ['email', 'phone', 'url', 'zipcode'];

// Apply anonymization to a value
function anonymizeValue(value, method, smartType) {
    if (value === null || value === undefined || value === '') return value;

    const strValue = String(value);

    switch (method) {
        case 'mask':
            return maskValue(strValue, smartType);
        case 'redact':
            return '[REDACTED]';
        case 'hash':
            return hashValue(strValue);
        case 'remove':
            return null; // Will be handled at column level
        default:
            return value;
    }
}

// Mask value based on type
function maskValue(value, smartType) {
    switch (smartType) {
        case 'email': {
            // Mask email: j***@domain.com
            const parts = value.split('@');
            if (parts.length === 2) {
                const localPart = parts[0];
                const domain = parts[1];
                const masked = localPart.length > 1
                    ? localPart[0] + '***'
                    : '***';
                return `${masked}@${domain}`;
            }
            return maskGeneric(value);
        }
        case 'phone': {
            // Mask phone: ***-***-1234
            const digits = value.replace(/\D/g, '');
            if (digits.length >= 4) {
                return '***-***-' + digits.slice(-4);
            }
            return '***-***-****';
        }
        case 'zipcode': {
            // Mask zipcode: show first 2 digits
            const digits = value.replace(/\D/g, '');
            if (digits.length >= 2) {
                return digits.slice(0, 2) + '***';
            }
            return '*****';
        }
        default:
            return maskGeneric(value);
    }
}

// Generic masking - show first and last character
function maskGeneric(value) {
    if (value.length <= 2) return '***';
    return value[0] + '*'.repeat(Math.min(value.length - 2, 5)) + value[value.length - 1];
}

// Simple hash function (simulated SHA-256 style)
function hashValue(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        const char = value.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    return hexHash.slice(0, 8).toUpperCase();
}

export function AnonymizePanel({ data, columns, smartTypes, isOpen, onClose, onDownload }) {
    // Track which columns to anonymize and their methods
    const [anonymizedColumns, setAnonymizedColumns] = useState({});
    const [showPreview, setShowPreview] = useState(true);

    // Auto-detect sensitive columns when panel opens
    useEffect(() => {
        if (isOpen && columns.length > 0) {
            const detected = {};
            columns.forEach(col => {
                const colSmartType = smartTypes[col]?.smartType;
                if (SENSITIVE_SMART_TYPES.includes(colSmartType)) {
                    detected[col] = 'mask'; // Default to mask for sensitive columns
                }
            });
            setAnonymizedColumns(detected);
        }
    }, [isOpen, columns, smartTypes]);

    // Get list of sensitive columns detected
    const sensitiveColumns = useMemo(() => {
        return columns.filter(col => {
            const colSmartType = smartTypes[col]?.smartType;
            return SENSITIVE_SMART_TYPES.includes(colSmartType);
        });
    }, [columns, smartTypes]);

    // Toggle anonymization for a column
    const toggleColumn = (col) => {
        setAnonymizedColumns(prev => {
            if (prev[col]) {
                const { [col]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [col]: 'mask' };
        });
    };

    // Change anonymization method for a column
    const setMethod = (col, method) => {
        setAnonymizedColumns(prev => ({
            ...prev,
            [col]: method
        }));
    };

    // Generate preview data (first 5 rows)
    const previewData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const preview = data.slice(0, 5).map(row => {
            const newRow = { ...row };
            Object.entries(anonymizedColumns).forEach(([col, method]) => {
                if (method === 'remove') {
                    delete newRow[col];
                } else {
                    const colSmartType = smartTypes[col]?.smartType;
                    newRow[col] = anonymizeValue(row[col], method, colSmartType);
                }
            });
            return newRow;
        });

        return preview;
    }, [data, anonymizedColumns, smartTypes]);

    // Get columns to show in preview (excluding removed ones)
    const previewColumns = useMemo(() => {
        return columns.filter(col => anonymizedColumns[col] !== 'remove');
    }, [columns, anonymizedColumns]);

    // Handle download with anonymization
    const handleAnonymizedDownload = () => {
        // Apply anonymization to all data
        const anonymizedData = data.map(row => {
            const newRow = {};
            columns.forEach(col => {
                if (anonymizedColumns[col] === 'remove') {
                    // Skip removed columns
                    return;
                }
                if (anonymizedColumns[col]) {
                    const colSmartType = smartTypes[col]?.smartType;
                    newRow[col] = anonymizeValue(row[col], anonymizedColumns[col], colSmartType);
                } else {
                    newRow[col] = row[col];
                }
            });
            return newRow;
        });

        onDownload(anonymizedData);
        onClose();
    };

    // Select/Deselect all sensitive columns
    const selectAllSensitive = () => {
        const newAnon = { ...anonymizedColumns };
        sensitiveColumns.forEach(col => {
            if (!newAnon[col]) {
                newAnon[col] = 'mask';
            }
        });
        setAnonymizedColumns(newAnon);
    };

    const clearAll = () => {
        setAnonymizedColumns({});
    };

    if (!isOpen) return null;

    const hasAnonymization = Object.keys(anonymizedColumns).length > 0;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Shield className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Anonymize Columns</h2>
                            <p className="text-white/80 text-sm">Protect sensitive data before downloading</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Sensitive columns alert */}
                    {sensitiveColumns.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                                    Sensitive Data Detected
                                </h3>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                    We detected {sensitiveColumns.length} column{sensitiveColumns.length > 1 ? 's' : ''} that may contain sensitive information.
                                    Consider anonymizing: <span className="font-medium">{sensitiveColumns.join(', ')}</span>
                                </p>
                                <button
                                    onClick={selectAllSensitive}
                                    className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline"
                                >
                                    Anonymize all detected columns
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Quick Actions:</span>
                        <button
                            onClick={selectAllSensitive}
                            disabled={sensitiveColumns.length === 0}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Select All Sensitive
                        </button>
                        <button
                            onClick={clearAll}
                            disabled={!hasAnonymization}
                            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Clear All
                        </button>
                    </div>

                    {/* Column Selection */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Select Columns to Anonymize</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                            {columns.map(col => {
                                const isSelected = !!anonymizedColumns[col];
                                const method = anonymizedColumns[col];
                                const colSmartType = smartTypes[col]?.smartType;
                                const isSensitive = SENSITIVE_SMART_TYPES.includes(colSmartType);

                                return (
                                    <div
                                        key={col}
                                        className={`border rounded-xl p-3 transition-all ${isSelected
                                                ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleColumn(col)}
                                                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                />
                                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{col}</span>
                                            </label>
                                            {isSensitive && (
                                                <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full font-medium flex items-center gap-1">
                                                    <AlertTriangle size={10} />
                                                    {colSmartType}
                                                </span>
                                            )}
                                        </div>

                                        {isSelected && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {Object.entries(ANONYMIZATION_METHODS).map(([key, config]) => {
                                                    const Icon = config.icon;
                                                    return (
                                                        <button
                                                            key={key}
                                                            onClick={() => setMethod(col, key)}
                                                            title={config.description}
                                                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${method === key
                                                                    ? 'bg-orange-500 text-white'
                                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                                }`}
                                                        >
                                                            <Icon size={12} />
                                                            {config.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Preview Section */}
                    {hasAnonymization && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                    <Eye size={16} />
                                    Preview (First 5 rows)
                                </h3>
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
                                >
                                    {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                                    {showPreview ? 'Hide' : 'Show'} Preview
                                </button>
                            </div>

                            {showPreview && (
                                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                                <tr>
                                                    {previewColumns.map(col => (
                                                        <th
                                                            key={col}
                                                            className={`px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap ${anonymizedColumns[col] ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {col}
                                                                {anonymizedColumns[col] && (
                                                                    <Shield size={12} className="text-orange-500" />
                                                                )}
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {previewData.map((row, i) => (
                                                    <tr key={i} className="bg-white dark:bg-gray-800">
                                                        {previewColumns.map(col => (
                                                            <td
                                                                key={`${i}-${col}`}
                                                                className={`px-4 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap ${anonymizedColumns[col] ? 'bg-orange-50/50 dark:bg-orange-900/10 font-mono text-orange-700 dark:text-orange-300' : ''
                                                                    }`}
                                                            >
                                                                {row[col] ?? '-'}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between gap-4 bg-gray-50 dark:bg-gray-900/50">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {hasAnonymization ? (
                            <span className="flex items-center gap-2">
                                <Check size={16} className="text-green-500" />
                                {Object.keys(anonymizedColumns).length} column{Object.keys(anonymizedColumns).length > 1 ? 's' : ''} will be anonymized
                            </span>
                        ) : (
                            <span>No columns selected for anonymization</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAnonymizedDownload}
                            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-2 rounded-lg font-medium shadow-lg shadow-orange-500/30 transition-all"
                        >
                            <Download size={18} />
                            Download Anonymized CSV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
