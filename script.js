// Tool loading and rendering functions
// Note: Comparison functionality has been removed

function loadCategoryTools(categoryId) {
    // This function should load tools for a category
    // Implementation depends on your data structure
    console.log('Loading tools for category:', categoryId);
}

// Remove any comparison UI elements that might exist
(function removeComparisonUI() {
    // Remove comparison elements from DOM
    const comparisonSelectors = [
        '.compare-section',
        '.compare-selectors',
        '.compare-select',
        '.compare-result',
        '.compare-placeholder',
        '.compare-results',
        '.compare-tool-card',
        '[class*="compare"]',
        '[id*="compare"]',
        '[id*="comparison"]',
        '[class*="comparison"]',
        'a[href*="comparison"]',
        'a[href*="compare"]',
        'button[onclick*="comparison"]',
        'button[onclick*="compare"]'
    ];
    
    function removeElements() {
        comparisonSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el && el.parentNode) {
                        el.parentNode.removeChild(el);
                    }
                });
            } catch (e) {
                // Ignore selector errors
            }
        });
    }
    
    // Remove immediately
    removeElements();
    
    // Remove after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeElements);
    } else {
        removeElements();
    }
    
    // Remove after a short delay to catch dynamically created elements
    setTimeout(removeElements, 100);
    setTimeout(removeElements, 500);
    setTimeout(removeElements, 1000);
    
    // Watch for new elements being added
    const observer = new MutationObserver(function(mutations) {
        removeElements();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
