import { useEffect, useRef } from 'react';

/**
 * Custom hook for trapping focus within a modal/dialog
 * @param {boolean} isActive - Whether the focus trap is active
 * @param {Object} options - Configuration options
 * @param {Function} options.onEscape - Callback when Escape key is pressed
 */
export function useFocusTrap(isActive, options = {}) {
    const containerRef = useRef(null);
    const previousActiveElement = useRef(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        // Store the previously focused element
        previousActiveElement.current = document.activeElement;

        // Get all focusable elements within the container
        const getFocusableElements = () => {
            const focusableSelectors = [
                'button:not([disabled])',
                'input:not([disabled])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                'a[href]',
                '[tabindex]:not([tabindex="-1"])',
            ].join(', ');

            return Array.from(containerRef.current?.querySelectorAll(focusableSelectors) || [])
                .filter(el => el.offsetParent !== null); // Filter out hidden elements
        };

        // Focus the first focusable element
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            // Try to find a close button or the first interactive element
            const closeButton = focusableElements.find(el => 
                el.getAttribute('aria-label')?.toLowerCase().includes('close') ||
                el.textContent?.toLowerCase().includes('close') ||
                el.textContent?.toLowerCase().includes('done') ||
                el.textContent?.toLowerCase().includes('cancel')
            );
            (closeButton || focusableElements[0]).focus();
        }

        const handleKeyDown = (e) => {
            // Handle Escape key
            if (e.key === 'Escape' && options.onEscape) {
                e.preventDefault();
                options.onEscape();
                return;
            }

            // Handle Tab key for focus trapping
            if (e.key === 'Tab') {
                const focusableElements = getFocusableElements();
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            
            // Restore focus to the previously focused element
            if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
                previousActiveElement.current.focus();
            }
        };
    }, [isActive, options.onEscape]);

    return containerRef;
}
