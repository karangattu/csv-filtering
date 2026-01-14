import React from 'react';
import { Mail, Phone, Link, DollarSign, Calendar, Percent, MapPin, Check, AlertTriangle } from 'lucide-react';

const SMART_TYPE_CONFIG = {
    email: { icon: Mail, label: 'Email', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    phone: { icon: Phone, label: 'Phone', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    url: { icon: Link, label: 'URL', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    currency: { icon: DollarSign, label: 'Currency', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    date: { icon: Calendar, label: 'Date', color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30' },
    percentage: { icon: Percent, label: 'Percent', color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
    zipcode: { icon: MapPin, label: 'Zip', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' }
};

/**
 * Badge component showing detected smart type for a column
 */
export function SmartColumnBadge({ smartType, validPercent, showValidation = true }) {
    if (!smartType || !SMART_TYPE_CONFIG[smartType]) {
        return null;
    }

    const config = SMART_TYPE_CONFIG[smartType];
    const Icon = config.icon;
    const isFullyValid = validPercent === 100;

    return (
        <div className="inline-flex items-center gap-1 group relative">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${config.bg} ${config.color}`}>
                <Icon size={10} />
                {config.label}
            </span>

            {showValidation && (
                <span className={`inline-flex items-center ${isFullyValid ? 'text-green-500' : 'text-amber-500'}`}>
                    {isFullyValid ? <Check size={10} /> : <AlertTriangle size={10} />}
                </span>
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {validPercent}% valid {config.label.toLowerCase()} values
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
            </div>
        </div>
    );
}

/**
 * Simple type badge for basic types (number, string, date)
 */
export function TypeBadge({ type }) {
    const config = {
        number: { label: '#', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        date: { label: '📅', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        string: { label: 'Aa', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' }
    };

    const typeConfig = config[type] || config.string;

    return (
        <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${typeConfig.bg} ${typeConfig.color}`}>
            {typeConfig.label}
        </span>
    );
}
