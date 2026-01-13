import React from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ theme, toggleTheme }) {
    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                    ? 'bg-gray-800 text-yellow-500 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
}
