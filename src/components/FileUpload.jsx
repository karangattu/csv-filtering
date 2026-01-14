import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { cn } from '../lib/utils';

export function FileUpload({ onDataLoaded, compact = false }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

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

        setIsLoading(true);

        // Simulate a small delay for visual feedback if file is tiny
        setTimeout(() => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setIsLoading(false);
                    if (results.errors.length > 0) {
                        console.error("Parse errors:", results.errors);
                    }
                    if (results.data && results.data.length > 0) {
                        // Extract table name from filename (without extension)
                        const tableName = file.name.replace(/\.csv$/i, '').replace(/[^a-zA-Z0-9_]/g, '_');
                        onDataLoaded(results.data, tableName);
                    } else {
                        setError("The CSV file appears to be empty.");
                    }
                },
                error: (err) => {
                    setIsLoading(false);
                    setError(`Error parsing file: ${err.message}`);
                }
            });
        }, 500);
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
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Parsing CSV...</span>
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
            {error && (
                <div className="mt-4 text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded">
                    {error}
                </div>
            )}
        </div>
    );
}
