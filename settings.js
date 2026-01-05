// ============================================
// SETTINGS PAGE - USER PREFERENCES
// ============================================

// Default settings
const defaultSettings = {
    theme: 'light',
    language: 'en',
    currency: 'USD',
    region: 'Global'
};

// ============================================
// MODAL FUNCTIONS - Define early for global access
// ============================================

// Open settings modal - Define early and make globally accessible
function openSettingsModal() {
    console.log('[SETTINGS MODAL] Opening modal...');
    const modal = document.getElementById('settingsModal');
    if (!modal) {
        console.error('[SETTINGS MODAL] Modal element not found!');
        return;
    }
    
    console.log('[SETTINGS MODAL] Modal found, loading settings...');
    
    // Load current settings
    const settings = loadSettings();
    const themeSelectModal = document.getElementById('themeSelectModal');
    if (themeSelectModal) {
        themeSelectModal.value = settings.theme;
    }
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    console.log('[SETTINGS MODAL] Modal should be visible now');
}

// Close settings modal
function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    
    modal.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
}

// Close modal when clicking overlay
function closeSettingsModalOnOverlay(event) {
    if (event.target === event.currentTarget) {
        closeSettingsModal();
    }
}

// Make functions globally accessible immediately
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.closeSettingsModalOnOverlay = closeSettingsModalOnOverlay;

// Load settings from localStorage
function loadSettings() {
    try {
        const saved = localStorage.getItem('gubicooLensSettings');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error('[SETTINGS] Error loading settings:', error);
    }
    return defaultSettings;
}

// Save settings to localStorage
function saveSettings(settings) {
    try {
        localStorage.setItem('gubicooLensSettings', JSON.stringify(settings));
        console.log('[SETTINGS] Settings saved:', settings);
        return true;
    } catch (error) {
        console.error('[SETTINGS] Error saving settings:', error);
        return false;
    }
}

// Apply theme
function applyTheme(theme) {
    const html = document.documentElement;
    const body = document.body;
    
    // Remove existing theme classes
    html.classList.remove('theme-light', 'theme-dark');
    body.classList.remove('theme-light', 'theme-dark');
    
    if (theme === 'dark') {
        html.classList.add('theme-dark');
        body.classList.add('theme-dark');
    } else {
        html.classList.add('theme-light');
        body.classList.add('theme-light');
    }
}

// Apply settings to page
function applySettings(settings) {
    // Apply theme
    applyTheme(settings.theme);
    
    // Update select elements
    const themeSelect = document.getElementById('themeSelect');
    const languageSelect = document.getElementById('languageSelect');
    const currencySelect = document.getElementById('currencySelect');
    const regionSelect = document.getElementById('regionSelect');
    
    if (themeSelect) themeSelect.value = settings.theme;
    if (languageSelect) languageSelect.value = settings.language;
    // Currency is always USD, no need to update select
    if (regionSelect) regionSelect.value = settings.region;
    
    // Force currency to USD
    if (settings.currency !== 'USD') {
        settings.currency = 'USD';
        saveSettings(settings);
    }
}

// Initialize settings page
function initializeSettingsPage() {
    console.log('[SETTINGS] Initializing settings page...');
    
    // Load and apply saved settings
    const settings = loadSettings();
    applySettings(settings);
    
    // Add event listeners
    const themeSelect = document.getElementById('themeSelect');
    const languageSelect = document.getElementById('languageSelect');
    const currencySelect = document.getElementById('currencySelect'); // May not exist anymore
    const regionSelect = document.getElementById('regionSelect');
    const cookieSelect = document.getElementById('cookieSelect');
    const saveBtn = document.getElementById('saveSettingsBtn');
    
    // Theme change (apply immediately)
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            const newSettings = loadSettings();
            newSettings.theme = this.value;
            applyTheme(newSettings.theme);
            saveSettings(newSettings);
            showSaveNotification('Theme updated');
        });
    }
    
    // Save button
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const currentSettings = {
                theme: themeSelect ? themeSelect.value : defaultSettings.theme,
                language: languageSelect ? languageSelect.value : defaultSettings.language,
                currency: 'USD', // Always USD
                region: regionSelect ? regionSelect.value : defaultSettings.region
            };
            
            if (saveSettings(currentSettings)) {
                applySettings(currentSettings);
                showSaveNotification('Settings saved successfully!');
            } else {
                showSaveNotification('Error saving settings', true);
            }
        });
    }
}

// Show save notification
function showSaveNotification(message, isError = false) {
    // Remove existing notification
    const existing = document.querySelector('.settings-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `settings-notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    
    // Append to modal if it exists and is open, otherwise to body
    const modal = document.getElementById('settingsModal');
    const modalBody = modal && modal.classList.contains('show') 
        ? modal.querySelector('.settings-modal-body')
        : null;
    
    const container = modalBody || document.body;
    container.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Get current settings (for use in other pages)
function getCurrentSettings() {
    return loadSettings();
}

// Get currency symbol (USD only)
function getCurrencySymbol(currency) {
    // Always return USD symbol
    return '$';
}

// Format price with currency (USD only)
function formatPrice(price, currency) {
    // Always use USD
    if (typeof price === 'number') {
        return `$${price.toLocaleString()}`;
    }
    return `$${price}`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeSettingsPage();
    initializeSettingsModal();
});

// Initialize settings modal (for popup)
function initializeSettingsModal() {
    console.log('[SETTINGS] Initializing settings modal...');
    
    // Check if modal exists
    const modal = document.getElementById('settingsModal');
    if (!modal) {
        console.warn('[SETTINGS] Modal element not found on this page');
        return;
    }
    
    // Load and apply saved settings
    const settings = loadSettings();
    
    // Update modal theme select
    const themeSelectModal = document.getElementById('themeSelectModal');
    if (themeSelectModal) {
        themeSelectModal.value = settings.theme;
        
        // Theme change (apply immediately)
        themeSelectModal.addEventListener('change', function() {
            const newSettings = loadSettings();
            newSettings.theme = this.value;
            applyTheme(newSettings.theme);
            saveSettings(newSettings);
            showSaveNotification('Theme updated');
        });
        console.log('[SETTINGS] Modal theme select initialized');
    } else {
        console.warn('[SETTINGS] Theme select not found in modal');
    }
}

// Functions already defined at top of file

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('settingsModal');
        if (modal && modal.classList.contains('show')) {
            closeSettingsModal();
        }
    }
});

// Functions are already made globally accessible above

// Apply settings globally when script loads (for other pages)
(function() {
    const settings = loadSettings();
    applyTheme(settings.theme);
})();

