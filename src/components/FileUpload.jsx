import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { cn, normalizeColumnName } from '../lib/utils';

const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024;
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export function FileUpload({ onDataLoaded, compact = false }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const abortRef = useRef(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        setError(null);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        setError(null);
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file) => {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError('Please upload a valid CSV file.');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
            return;
        }

        setIsLoading(true);
        setProgress(0);
        setError(null);
        abortRef.current = false;

        const isLargeFile = file.size > LARGE_FILE_THRESHOLD;
        const tableName = file.name.replace(/\.csv$/i, '').replace(/[^a-zA-Z0-9_]/g, '_');

        if (isLargeFile) {
            parseWithStreaming(file, tableName);
        } else {
            parseSmallFile(file, tableName);
        }
    };

    const parseSmallFile = (file, tableName) => {
        setStatusMessage('Parsing CSV...');
        setTimeout(() => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: 'greedy',
                transformHeader: normalizeColumnName,
                delimitersToGuess: [',', '\t', '|', ';'],
                complete: (results) => {
                    setIsLoading(false);
                    setProgress(100);
                    setStatusMessage('');
                    if (results.errors.length > 0) {
                        const criticalErrors = results.errors.filter(
                            e => e.type === 'Quotes' || e.type === 'FieldMismatch'
                        );
                        if (criticalErrors.length > 0) {
                            console.error("Parse errors:", criticalErrors);
                            setError(`CSV parsing issues detected: ${criticalErrors[0].message}`);
                        }
                    }
                    if (results.data && results.data.length > 0) {
                        onDataLoaded(results.data, tableName);
                    } else {
                        setError("The CSV file appears to be empty or has no valid data rows.");
                    }
                },
                error: (err) => {
                    setIsLoading(false);
                    setStatusMessage('');
                    setError(`Error parsing file: ${err.message}`);
                }
            });
        }, 100);
    };

    const parseWithStreaming = (file, tableName) => {
        const rows = [];
        let headers = null;
        let rowCount = 0;
        const fileSize = file.size;
        let bytesRead = 0;

        setStatusMessage('Processing large file...');

        Papa.parse(file, {
            header: true,
            skipEmptyLines: 'greedy',
            transformHeader: normalizeColumnName,
            delimitersToGuess: [',', '\t', '|', ';'],
            worker: true,
            chunk: (results, parser) => {
                if (abortRef.current) {
                    parser.abort();
                    return;
                }

                if (!headers && results.meta.fields) {
                    headers = results.meta.fields;
                }

                rows.push(...results.data);
                rowCount += results.data.length;

                bytesRead += results.data.reduce((acc, row) => {
                    return acc + JSON.stringify(row).length;
                }, 0);

                const estimatedProgress = Math.min(95, Math.round((bytesRead / fileSize) * 100));
                setProgress(estimatedProgress);
                setStatusMessage(`Processing... ${rowCount.toLocaleString()} rows`);

                if (results.errors.length > 0) {
                    const criticalErrors = results.errors.filter(
                        e => e.type === 'Quotes' || e.type === 'FieldMismatch'
                    );
                    if (criticalErrors.length > 0) {
                        console.warn("Chunk parse warnings:", criticalErrors);
                    }
                }
            },
            complete: () => {
                setIsLoading(false);
                setProgress(100);
                setStatusMessage('');

                if (rows.length > 0) {
                    onDataLoaded(rows, tableName);
                } else {
                    setError("The CSV file appears to be empty or has no valid data rows.");
                }
            },
            error: (err) => {
                setIsLoading(false);
                setStatusMessage('');
                setError(`Error parsing file: ${err.message}`);
            }
        });
    };

    return (
        <div
            className={clsx(
                "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden",
                isDragOver
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]"
                    : "border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isLoading && document.getElementById('file-input').click()}
        >
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3 w-full max-w-xs px-4">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{statusMessage}</span>
                        {progress > 0 && (
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                        {progress > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{progress}% complete</span>
                        )}
                    </div>
                </div>
            )}

            <input
                id="file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleChange}
                disabled={isLoading}
            />

            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                <Upload className="text-blue-600 dark:text-blue-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Upload your CSV</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
                Drag and drop your file here, or click to browse.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Supports files up to {MAX_FILE_SIZE / (1024 * 1024)}MB
            </p>
            {error && (
                <div className="mt-4 text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded">
                    {error}
                </div>
            )}
        </div>
    );
}

