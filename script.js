// ============================================
// DATA LOADING
// ============================================

let toolsData = null;

// ============================================
// FAVORITES/SAVED TOOLS
// ============================================

/**
 * Get saved tools from localStorage
 */
function getSavedTools() {
    try {
        const saved = localStorage.getItem('gubicooLensSavedTools');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('[FAVORITES] Error loading saved tools:', error);
        return [];
    }
}

/**
 * Save tools to localStorage
 */
function saveToolsToStorage(toolIds) {
    try {
        localStorage.setItem('gubicooLensSavedTools', JSON.stringify(toolIds));
        console.log('[FAVORITES] Saved tools updated:', toolIds);
    } catch (error) {
        console.error('[FAVORITES] Error saving tools:', error);
    }
}

/**
 * Check if a tool is saved
 */
function isToolSaved(toolId) {
    const saved = getSavedTools();
    return saved.includes(toolId);
}

/**
 * Toggle tool saved state
 */
function toggleToolSaved(toolId) {
    const saved = getSavedTools();
    const index = saved.indexOf(toolId);
    
    if (index > -1) {
        saved.splice(index, 1);
        console.log(`[FAVORITES] Removed ${toolId} from saved`);
    } else {
        saved.push(toolId);
        console.log(`[FAVORITES] Added ${toolId} to saved`);
    }
    
    saveToolsToStorage(saved);
    return !isToolSaved(toolId); // Return new state (true if now saved)
}

/**
 * Get saved tools data
 */
function getSavedToolsData(data) {
    const savedIds = getSavedTools();
    if (!data || !data.tools) return [];
    return data.tools.filter(tool => savedIds.includes(tool.id));
}

async function loadData() {
    if (toolsData) {
        console.log('[DATA] Using cached data');
        return toolsData;
    }
    
    try {
        console.log('[DATA] Loading tools-data.json...');
        const response = await fetch('tools-data.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        toolsData = await response.json();
        
        // Validate data structure
        if (!toolsData || !Array.isArray(toolsData.categories) || !Array.isArray(toolsData.tools)) {
            throw new Error('Invalid data structure');
        }
        
        console.log(`[DATA] Loaded successfully: ${toolsData.categories.length} categories, ${toolsData.tools.length} tools`);
        return toolsData;
    } catch (error) {
        console.error('[DATA] Error loading data:', error);
        // Show user-friendly error
        showError('Failed to load tools data. Please refresh the page.');
        return null;
    }
}

// ============================================
// ERROR HANDLING
// ============================================

function showError(message) {
    console.error('[ERROR]', message);
    // Try to show error in the main content area
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = 'padding: 2rem; text-align: center; color: #c62828; background: #ffebee; border: 1px solid #ef5350; border-radius: 8px; margin: 2rem 0;';
        errorDiv.textContent = message;
        mainContent.appendChild(errorDiv);
    }
}

// ============================================
// HOME PAGE - LOAD CATEGORIES (OLD - for category grid)
// ============================================

async function loadCategories() {
    console.log('[CATEGORIES] Starting to load categories...');
    
    const data = await loadData();
    if (!data) {
        console.error('[CATEGORIES] No data available');
        return;
    }

    const grid = document.getElementById('categoriesGrid');
    if (!grid) {
        console.error('[CATEGORIES] Grid element not found');
        return;
    }

    console.log(`[CATEGORIES] Rendering ${data.categories.length} categories`);
    grid.innerHTML = '';

    let renderedCount = 0;
    let errorCount = 0;

    data.categories.forEach((category, index) => {
        try {
            // Defensive checks
            if (!category || !category.id || !category.name) {
                console.warn(`[CATEGORIES] Skipping invalid category at index ${index}:`, category);
                errorCount++;
                return;
            }

            const card = document.createElement('a');
            card.href = `category.html?id=${category.id}`;
            card.className = 'category-card';
            
            card.innerHTML = `
                <div class="category-icon"><span class="material-symbols-outlined">${category.icon || 'folder'}</span></div>
                <h3 class="category-name">${category.name}</h3>
                <p class="category-description">${category.description || 'No description available'}</p>
            `;
            
            grid.appendChild(card);
            renderedCount++;
        } catch (error) {
            console.error(`[CATEGORIES] Error rendering category at index ${index}:`, error);
            errorCount++;
        }
    });

    console.log(`[CATEGORIES] Rendering complete: ${renderedCount} rendered, ${errorCount} errors`);

    if (renderedCount === 0 && data.categories.length > 0) {
        grid.innerHTML = '<p class="text-center" style="padding: 2rem; color: #666;">Failed to load categories. Please refresh the page.</p>';
    }
}

// ============================================
// HOME PAGE - LOAD HOMEPAGE CONTENT (NEW)
// ============================================

async function loadHomePage() {
    console.log('[HOMEPAGE] Loading homepage content...');
    
    const data = await loadData();
    if (!data) {
        console.error('[HOMEPAGE] No data available');
        return;
    }

    // Initialize particle animation
    initParticleAnimation();
    initBackgroundParticleAnimation(); // Initialize background particles
    
    // Load category chips
    loadCategoryChips(data);
    
    // Load trending tools
    loadTrendingTools(data);
    
    // Load featured tools
    loadFeaturedTools(data);

    // Load all tools
    loadAllTools(data);

    // Initialize search functionality
    initializeSearch(data);
}

function loadCategoryChips(data) {
    const chipsContainer = document.getElementById('categoryChips');
    if (!chipsContainer) return;

    console.log(`[CHIPS] Rendering ${data.categories.length} category chips`);

    // Add "All" chip - make it functional to show all tools
    const allChip = document.createElement('a');
    allChip.href = '#';
    allChip.className = 'chip active';
    allChip.innerHTML = `
        <span class="material-symbols-outlined chip-icon">auto_awesome</span>
        <span>All</span>
    `;
    allChip.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        
        // Reload all tools to ensure all are displayed
        loadAllTools(data);
        
        // Show all sections and hide search results
        const searchResults = document.getElementById('searchResults');
        if (searchResults) searchResults.style.display = 'none';
        
        const sectionsToShow = document.querySelectorAll('.trending-section, .featured-section, .all-tools-section');
        sectionsToShow.forEach(section => {
            if (section) section.style.display = '';
        });
        
        // Scroll to all tools section
        const allToolsSection = document.querySelector('.all-tools-section');
        if (allToolsSection) {
            allToolsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
    chipsContainer.appendChild(allChip);

    // Add category chips
    data.categories.forEach((category, index) => {
        try {
            if (!category || !category.id || !category.name) {
                console.warn(`[CHIPS] Skipping invalid category at index ${index}`);
                return;
            }

            const chip = document.createElement('a');
            chip.href = `category.html?id=${category.id}`;
            chip.className = 'chip';
            chip.textContent = category.name;
            
            chipsContainer.appendChild(chip);
        } catch (error) {
            console.error(`[CHIPS] Error rendering chip at index ${index}:`, error);
        }
    });
}

function loadTrendingTools(data) {
    const trendingContainer = document.getElementById('trendingCards');
    if (!trendingContainer) return;

    // Get top rated tools (trending)
    const trendingTools = [...data.tools]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 3);

    console.log(`[TRENDING] Rendering ${trendingTools.length} trending tools`);

    trendingContainer.innerHTML = '';

    const iconClasses = ['purple', 'green', 'blue'];

    trendingTools.forEach((tool, index) => {
        try {
            if (!tool || !tool.id || !tool.name) {
                console.warn(`[TRENDING] Skipping invalid tool at index ${index}`);
                return;
            }

            const card = document.createElement('a');
            card.href = `tool-detail.html?id=${tool.id}`;
            card.className = 'trending-card';

            // Use new pricingType field or fall back to old pricing structure
            const pricingType = tool.pricingType || (tool.pricing && tool.pricing.free && tool.pricing.free.available ? 'Freemium' : 'Paid');
            const isFree = pricingType === 'Free' || pricingType === 'Freemium' || (tool.pricing && tool.pricing.free && tool.pricing.free.available);
            const priceBadgeClass = isFree ? 'free' : 'paid';
            const priceBadgeText = pricingType === 'Free' ? 'Free' : (isFree ? 'Freemium' : 'Paid');

            // Get category name
            const categoryName = tool.categoryName || getCategoryName(data, tool.category) || 'AI Tool';
            
            // Get icon (Simple Icons or Material Symbols fallback)
            const iconHtml = getToolIconHtml(tool, '', 'large');
            const iconUrl = getToolIconUrl(tool);
            // Use logo container if Simple Icon is available, otherwise use colored icon
            const iconContainerClass = iconUrl ? 'trending-card-icon-logo' : `trending-card-icon ${iconClasses[index % iconClasses.length]}`;

            const isSaved = isToolSaved(tool.id);
            card.innerHTML = `
                <button class="trending-card-favorite ${isSaved ? 'saved' : ''}" onclick="event.preventDefault(); event.stopPropagation(); toggleFavorite('${tool.id}', this);">
                    <span class="material-symbols-outlined">${isSaved ? 'favorite' : 'favorite_border'}</span>
                </button>
                <div class="${iconContainerClass}">
                    ${iconHtml}
                </div>
                <h3 class="trending-card-name">${escapeHtml(tool.name)}</h3>
                <p class="trending-card-category">${escapeHtml(categoryName)}</p>
                <div class="trending-card-footer">
                    <div class="rating-badge">
                        <span class="material-symbols-outlined">star</span>
                        <span class="rating-value">${tool.rating || 'N/A'}</span>
                    </div>
                    <span class="price-badge ${priceBadgeClass}">${priceBadgeText}</span>
                </div>
            `;

            trendingContainer.appendChild(card);
        } catch (error) {
            console.error(`[TRENDING] Error rendering tool at index ${index}:`, error);
        }
    });
}

function loadFeaturedTools(data) {
    const featuredContainer = document.getElementById('featuredTools');
    if (!featuredContainer) return;

    // Get featured tools (all tools, sorted by rating)
    const featuredTools = [...data.tools]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 6);

    console.log(`[FEATURED] Rendering ${featuredTools.length} featured tools`);

    featuredContainer.innerHTML = '';

    const iconColors = ['#1e293b', '#f97316', '#ec4899', '#3b82f6', '#2563eb', '#10b981'];

    featuredTools.forEach((tool, index) => {
        try {
            if (!tool || !tool.id || !tool.name) {
                console.warn(`[FEATURED] Skipping invalid tool at index ${index}`);
                return;
            }

            const item = document.createElement('a');
            item.href = `tool-detail.html?id=${tool.id}`;
            item.className = 'featured-item';

            // Use new fields with fallbacks
            const categoryName = tool.categoryName || getCategoryName(data, tool.category) || 'AI Tool';
            const iconHtml = getToolIconHtml(tool, '', 'medium');
            const iconColor = iconColors[index % iconColors.length];
            const description = tool.purpose || tool.description || 'No description available';
            
            // Determine pricing badge
            const pricingType = tool.pricingType || (tool.pricing && tool.pricing.free && tool.pricing.free.available ? 'Freemium' : 'Paid');
            const isFree = pricingType === 'Free' || pricingType === 'Freemium' || (tool.pricing && tool.pricing.free && tool.pricing.free.available);
            const pricingBadge = isFree ? '<span class="tag" style="background: rgba(16, 185, 129, 0.1); color: #059669;">' + (pricingType === 'Free' ? 'Free' : 'Freemium') + '</span>' : '';

            // Use Simple Icons if available, otherwise use colored icon
            const iconUrl = getToolIconUrl(tool);
            const iconContainerStyle = iconUrl 
                ? 'background: var(--bg-white); border: 1px solid var(--border-light); padding: 0.5rem;'
                : `background-color: ${iconColor};`;

            const isSaved = isToolSaved(tool.id);
            item.innerHTML = `
                <button class="featured-item-favorite ${isSaved ? 'saved' : ''}" onclick="event.preventDefault(); event.stopPropagation(); toggleFavorite('${tool.id}', this);">
                    <span class="material-symbols-outlined">${isSaved ? 'favorite' : 'favorite_border'}</span>
                </button>
                <div class="featured-item-icon" style="${iconContainerStyle}">
                    ${iconHtml}
                </div>
                <div class="featured-item-content">
                    <div class="featured-item-header">
                        <h3 class="featured-item-name">${escapeHtml(tool.name)}</h3>
                        <div class="featured-item-rating">
                            <span class="material-symbols-outlined">star</span>
                            <span class="featured-item-rating-value">${tool.rating || 'N/A'}</span>
                        </div>
                    </div>
                    <p class="featured-item-description">${escapeHtml(description)}</p>
                    <div class="featured-item-tags">
                        <span class="tag">${escapeHtml(categoryName)}</span>
                        ${pricingBadge}
                    </div>
                </div>
                <button class="featured-item-action" onclick="event.preventDefault(); event.stopPropagation(); window.location.href='tool-detail.html?id=${tool.id}';">
                    <span class="material-symbols-outlined">arrow_forward</span>
                </button>
            `;

            featuredContainer.appendChild(item);
        } catch (error) {
            console.error(`[FEATURED] Error rendering tool at index ${index}:`, error);
        }
    });
}

function getCategoryName(data, categoryId) {
    if (!data || !data.categories) return null;
    const category = data.categories.find(cat => cat && cat.id === categoryId);
    return category ? category.name : null;
}

// ============================================
// ALL TOOLS SECTION
// ============================================

function loadAllTools(data) {
    const allToolsContainer = document.getElementById('allTools');
    const toolsCountEl = document.getElementById('toolsCount');
    
    if (!allToolsContainer) {
        console.warn('[ALL TOOLS] Container not found');
        return;
    }

    // Get ALL tools - NO LIMITS, NO SLICING
    // Sort by rating (highest first), then by name for consistency
    const allTools = [...data.tools]
        .filter(tool => tool && tool.id && tool.name) // Filter out invalid tools
        .sort((a, b) => {
            const ratingDiff = (b.rating || 0) - (a.rating || 0);
            if (ratingDiff !== 0) return ratingDiff;
            return (a.name || '').localeCompare(b.name || '');
        });

    console.log(`[ALL TOOLS] Found ${data.tools.length} total tools, rendering ${allTools.length} valid tools`);

    // Update count
    if (toolsCountEl) {
        toolsCountEl.textContent = `${allTools.length} tools`;
    }

    // Clear container
    allToolsContainer.innerHTML = '';

    // Extended icon colors for variety (cycles for 150+ tools)
    const iconColors = [
        '#1e293b', '#f97316', '#ec4899', '#3b82f6', '#2563eb', '#10b981', 
        '#14b8a6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#2563eb',
        '#f43f5e', '#0ea5e9', '#22c55e', '#eab308', '#2563eb', '#1d4ed8'
    ];

    // Default icons (cycles for variety)
    const defaultIcons = [
        'edit_note', 'movie', 'mic', 'code', 'image', 'smart_toy', 
        'psychology', 'search', 'terminal', 'brush', 'palette', 'design_services',
        'auto_awesome', 'rocket_launch', 'trending_up', 'settings', 'apps', 'extension'
    ];

    let renderedCount = 0;
    let errorCount = 0;

    // Render all tools
    allTools.forEach((tool, index) => {
        try {
            const item = document.createElement('a');
            item.href = `tool-detail.html?id=${tool.id}`;
            item.className = 'featured-item all-tool-item';
            item.style.animationDelay = `${index * 0.02}s`; // Stagger animations

            // Use new fields with fallbacks
            const categoryName = tool.categoryName || getCategoryName(data, tool.category) || 'AI Tool';
            const iconHtml = getToolIconHtml(tool, '', 'medium');
            const iconColor = iconColors[index % iconColors.length];
            const description = tool.purpose || tool.description || 'No description available';
            
            // Determine pricing badge
            const pricingType = tool.pricingType || (tool.pricing && tool.pricing.free && tool.pricing.free.available ? 'Freemium' : 'Paid');
            const isFree = pricingType === 'Free' || pricingType === 'Freemium' || (tool.pricing && tool.pricing.free && tool.pricing.free.available);
            const pricingBadge = isFree ? '<span class="tag" style="background: rgba(16, 185, 129, 0.1); color: #059669;">' + (pricingType === 'Free' ? 'Free' : 'Freemium') + '</span>' : '';

            // Use Simple Icons if available, otherwise use colored icon
            const iconUrl = getToolIconUrl(tool);
            const iconContainerStyle = iconUrl 
                ? 'background: var(--bg-white); border: 1px solid var(--border-light); padding: 0.5rem;'
                : `background-color: ${iconColor};`;

            const isSaved = isToolSaved(tool.id);
            item.innerHTML = `
                <button class="featured-item-favorite ${isSaved ? 'saved' : ''}" onclick="event.preventDefault(); event.stopPropagation(); toggleFavorite('${tool.id}', this);">
                    <span class="material-symbols-outlined">${isSaved ? 'favorite' : 'favorite_border'}</span>
                </button>
                <div class="featured-item-icon" style="${iconContainerStyle}">
                    ${iconHtml}
                </div>
                <div class="featured-item-content">
                    <div class="featured-item-header">
                        <h3 class="featured-item-name">${escapeHtml(tool.name)}</h3>
                        <div class="featured-item-rating">
                            <span class="material-symbols-outlined">star</span>
                            <span class="featured-item-rating-value">${tool.rating || 'N/A'}</span>
                        </div>
                    </div>
                    <p class="featured-item-description">${escapeHtml(description)}</p>
                    <div class="featured-item-tags">
                        <span class="tag">${escapeHtml(categoryName)}</span>
                        ${pricingBadge}
                    </div>
                </div>
                <button class="featured-item-action" onclick="event.preventDefault(); event.stopPropagation(); window.location.href='tool-detail.html?id=${tool.id}';">
                    <span class="material-symbols-outlined">arrow_forward</span>
                </button>
            `;

            allToolsContainer.appendChild(item);
            renderedCount++;
        } catch (error) {
            console.error(`[ALL TOOLS] Error rendering tool at index ${index}:`, error);
            errorCount++;
        }
    });

    console.log(`[ALL TOOLS] Rendering complete: ${renderedCount} rendered, ${errorCount} errors`);

    if (renderedCount === 0 && allTools.length > 0) {
        allToolsContainer.innerHTML = '<p class="text-center" style="padding: 2rem; color: #666;">Failed to load tools. Please refresh the page.</p>';
    }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function initializeSearch(data) {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchResultsList = document.getElementById('searchResultsList');
    const clearSearchBtn = document.getElementById('clearSearch');

    if (!searchInput) {
        console.warn('[SEARCH] Search input not found');
        return;
    }
    
    if (!searchResults || !searchResultsList) {
        console.warn('[SEARCH] Search results container not found');
        return;
    }
    
    if (!data || !data.tools) {
        console.error('[SEARCH] No data available for search');
        return;
    }
    
    console.log('[SEARCH] Initializing search with', data.tools.length, 'tools');

    let searchTimeout;

    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        console.log('[SEARCH] Input changed:', query);
        
        if (query.length === 0) {
            searchResults.style.display = 'none';
            // Show other sections again when search is cleared
            const sectionsToShow = document.querySelectorAll('.trending-section, .featured-section, .all-tools-section');
            sectionsToShow.forEach(section => {
                if (section) section.style.display = '';
            });
            return;
        }

        searchTimeout = setTimeout(() => {
            performSearch(data, query.toLowerCase());
        }, 300);
    });
    
    // Also add keyup listener as backup for Enter key
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            e.stopPropagation();
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            console.log('[SEARCH] Enter keyup, query:', query);
            if (query.length > 0) {
                performSearch(data, query.toLowerCase());
            }
        }
    });

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            e.stopPropagation();
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            console.log('[SEARCH] Enter keydown pressed, query:', query);
            if (query.length > 0) {
                // Immediately perform search without delay
                performSearch(data, query.toLowerCase());
            } else {
                searchResults.style.display = 'none';
                // Show other sections again when search is cleared
                const sectionsToShow = document.querySelectorAll('.trending-section, .featured-section, .all-tools-section');
                sectionsToShow.forEach(section => {
                    if (section) section.style.display = '';
                });
            }
            return false;
        }
    });

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            if (searchInput) searchInput.value = '';
            searchResults.style.display = 'none';
            // Show other sections again when search is cleared
            const sectionsToShow = document.querySelectorAll('.trending-section, .featured-section, .all-tools-section');
            sectionsToShow.forEach(section => {
                if (section) section.style.display = '';
            });
            searchInput.focus();
        });
    }
}

function performSearch(data, query) {
    console.log('[SEARCH] Performing search for:', query);
    const searchResults = document.getElementById('searchResults');
    const searchResultsList = document.getElementById('searchResultsList');
    
    if (!searchResults || !searchResultsList) {
        console.warn('[SEARCH] Search results container not found');
        return;
    }

    if (!data || !data.tools) {
        console.error('[SEARCH] No data available');
        return;
    }

    const queryLower = query.toLowerCase().trim();
    console.log('[SEARCH] Searching in', data.tools.length, 'tools');
    
    const results = data.tools.filter(tool => {
        if (!tool || !tool.name) return false;
        
        // Search in tool name (exact and partial match)
        const name = (tool.name || '').toLowerCase();
        const nameMatch = name.includes(queryLower) || name === queryLower;
        
        // Search in purpose/description
        const purpose = (tool.purpose || tool.description || '').toLowerCase();
        const purposeMatch = purpose.includes(queryLower);
        
        // Search in category
        const categoryName = tool.categoryName || getCategoryName(data, tool.category) || '';
        const category = categoryName.toLowerCase();
        const categoryMatch = category.includes(queryLower);
        
        // Search in tool ID (for exact matches)
        const id = (tool.id || '').toLowerCase();
        const idMatch = id.includes(queryLower);
        
        const matches = nameMatch || purposeMatch || categoryMatch || idMatch;
        
        if (matches) {
            console.log('[SEARCH] Match found:', tool.name);
        }
        
        return matches;
    });

    console.log('[SEARCH] Found', results.length, 'results');
    displaySearchResults(results, query, data);
}

function displaySearchResults(results, query, data) {
    const searchResults = document.getElementById('searchResults');
    const searchResultsList = document.getElementById('searchResultsList');
    
    if (!searchResults || !searchResultsList) {
        console.warn('[SEARCH] Search results container not found');
        return;
    }

    // Hide other sections when showing search results
    const sectionsToHide = document.querySelectorAll('.trending-section, .featured-section, .all-tools-section, .saved-section');
    sectionsToHide.forEach(section => {
        if (section) section.style.display = 'none';
    });

    if (results.length === 0) {
        searchResultsList.innerHTML = `
            <div class="no-results">
                <span class="material-symbols-outlined">search_off</span>
                <p>No tools found for "${escapeHtml(query)}"</p>
                <p class="no-results-hint">Try searching for "chatbot", "image", "coding", etc.</p>
            </div>
        `;
        searchResults.style.display = 'block';
        return;
    }

    searchResultsList.innerHTML = '';
    results.forEach(tool => {
        const item = createSearchResultItem(tool, data);
        searchResultsList.appendChild(item);
    });

    searchResults.style.display = 'block';
    searchResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function createSearchResultItem(tool, data) {
    const item = document.createElement('a');
    item.href = `tool-detail.html?id=${tool.id}`;
    item.className = 'search-result-item';

    const categoryName = tool.categoryName || getCategoryName(data, tool.category) || 'AI Tool';
    const iconHtml = getToolIconHtml(tool, '', 'medium');
    const pricingType = tool.pricingType || (tool.pricing && tool.pricing.free && tool.pricing.free.available ? 'Freemium' : 'Paid');
    const isFree = pricingType === 'Free' || pricingType === 'Freemium';
    
    // Check if Simple Icons are available
    const iconUrl = getToolIconUrl(tool);
    const iconContainerStyle = iconUrl 
        ? 'background: var(--bg-white); border: 1px solid var(--border-light); padding: 0.5rem;'
        : 'background: var(--accent-color);';

    const isSaved = isToolSaved(tool.id);
    item.style.position = 'relative';
    item.innerHTML = `
        <button class="featured-item-favorite ${isSaved ? 'saved' : ''}" onclick="event.preventDefault(); event.stopPropagation(); toggleFavorite('${tool.id}', this);">
            <span class="material-symbols-outlined">${isSaved ? 'favorite' : 'favorite_border'}</span>
        </button>
        <div class="search-result-icon" style="${iconContainerStyle}">
            ${iconHtml}
        </div>
        <div class="search-result-content">
            <div class="search-result-header">
                <h3 class="search-result-name">${escapeHtml(tool.name)}</h3>
                <div class="search-result-badges">
                    <span class="search-result-rating"><span class="material-symbols-outlined" style="font-size: 0.875rem; vertical-align: middle;">star</span> ${tool.rating || 'N/A'}</span>
                    <span class="search-result-pricing ${isFree ? 'free' : 'paid'}">${pricingType}</span>
                </div>
            </div>
            <p class="search-result-description">${escapeHtml(tool.purpose || tool.description || 'No description')}</p>
            <div class="search-result-meta">
                <span class="search-result-category">${escapeHtml(categoryName)}</span>
            </div>
        </div>
        <span class="material-symbols-outlined search-result-arrow">arrow_forward</span>
    `;

    return item;
}

// ============================================
// CATEGORY PAGE - LOAD TOOLS
// ============================================

async function loadCategoryTools(categoryId) {
    console.log(`[TOOLS] Loading tools for category: ${categoryId}`);
    
    const data = await loadData();
    if (!data) {
        console.error('[TOOLS] No data available');
        return;
    }

    // Find category - normalize category ID for matching
    const normalizedCategoryId = (categoryId || '').toString().toLowerCase().trim();
    const category = data.categories.find(cat => {
        if (!cat || !cat.id) return false;
        return (cat.id.toString().toLowerCase().trim()) === normalizedCategoryId;
    });
    
    if (!category) {
        console.warn(`[TOOLS] Category not found: ${categoryId}`);
        console.warn(`[TOOLS] Available categories:`, data.categories.map(c => c.id));
        window.location.href = 'index.html';
        return;
    }

    // Update page title
    const title = document.getElementById('categoryTitle');
    if (title) title.textContent = category.name;
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = `${category.name} - gubicoo Lens`;

    // Filter tools by category - NO LIMITS, case-insensitive matching
    // Use normalized category ID for consistent matching
    const tools = data.tools.filter(tool => {
        if (!tool || !tool.id || !tool.name) return false;
        // Match category ID (case-insensitive for robustness)
        const toolCategory = (tool.category || '').toString().toLowerCase().trim();
        return toolCategory === normalizedCategoryId;
    });
    
    console.log(`[TOOLS] Found ${tools.length} tools for category "${category.name}" (ID: ${categoryId})`);
    console.log(`[TOOLS] Total tools in database: ${data.tools.length}`);
    
    // Log category distribution for debugging
    const categoryDistribution = {};
    data.tools.forEach(tool => {
        if (tool && tool.category) {
            categoryDistribution[tool.category] = (categoryDistribution[tool.category] || 0) + 1;
        }
    });
    console.log(`[TOOLS] Category distribution:`, categoryDistribution);
    
    const grid = document.getElementById('toolsGrid');
    if (!grid) {
        console.error('[TOOLS] Grid element not found');
        return;
    }

    grid.innerHTML = '';

    if (tools.length === 0) {
        console.warn('[TOOLS] No tools found for this category');
        grid.innerHTML = '<p class="text-center" style="padding: 2rem; color: #666;">No tools found in this category.</p>';
        return;
    }

    let renderedCount = 0;
    let errorCount = 0;

    tools.forEach((tool, index) => {
        try {
            // Defensive checks
            if (!tool || !tool.id || !tool.name) {
                console.warn(`[TOOLS] Skipping invalid tool at index ${index}:`, tool);
                errorCount++;
                return;
            }

            const card = document.createElement('a');
            card.href = `tool-detail.html?id=${tool.id}`;
            card.className = 'tool-card';
            
            // Determine badge with defensive checks
            // Determine badge - use new pricingType or fall back to old structure
            let badgeHtml = '';
            const pricingType = tool.pricingType || (tool.pricing && tool.pricing.free && tool.pricing.free.available ? 'Freemium' : 'Paid');
            if (pricingType === 'Free') {
                badgeHtml = '<span class="badge badge-free">Free</span>';
            } else if (pricingType === 'Freemium' || (tool.pricing && tool.pricing.free && tool.pricing.free.available)) {
                badgeHtml = '<span class="badge badge-free">Freemium</span>';
            } else if (pricingType === 'Paid' || (tool.pricing && tool.pricing.paid)) {
                badgeHtml = '<span class="badge badge-paid">Paid</span>';
            }
            
            const description = tool.purpose || tool.description || 'No description available';
            const iconHtml = getToolIconHtml(tool, 'tool-card-icon', 'medium');
            // Check if Simple Icons are available
            const iconUrl = getToolIconUrl(tool);
            const iconContainerStyle = iconUrl 
                ? 'background: var(--bg-white); border: 1px solid var(--border-light); padding: 0.5rem; margin-bottom: 0.75rem;'
                : 'background: var(--accent-color); margin-bottom: 0.75rem; padding: 0.75rem;';
            
            card.innerHTML = `
                <div class="tool-card-icon-container" style="${iconContainerStyle}">
                    ${iconHtml}
                </div>
                <h3 class="tool-name">${escapeHtml(tool.name)}</h3>
                <p class="tool-description">${escapeHtml(description)}</p>
                <div class="tool-badges">${badgeHtml}</div>
            `;
            
            grid.appendChild(card);
            renderedCount++;
        } catch (error) {
            console.error(`[TOOLS] Error rendering tool at index ${index}:`, error);
            errorCount++;
        }
    });

    console.log(`[TOOLS] Rendering complete: ${renderedCount} rendered, ${errorCount} errors`);
    console.log(`[TOOLS] Expected ${tools.length} tools, successfully rendered ${renderedCount}`);

    if (renderedCount === 0 && tools.length > 0) {
        grid.innerHTML = '<p class="text-center" style="padding: 2rem; color: #666;">Failed to load tools. Please refresh the page.</p>';
    } else if (renderedCount < tools.length) {
        console.warn(`[TOOLS] WARNING: Only rendered ${renderedCount} out of ${tools.length} tools. Some tools may have failed to render.`);
    }
    
    // Ensure all tools are visible (no CSS hiding)
    if (grid && grid.children.length > 0) {
        console.log(`[TOOLS] Successfully displayed ${grid.children.length} tool cards in the grid`);
    }
}

// ============================================
// TOOL DETAIL PAGE - LOAD TOOL DETAILS
// ============================================

async function loadToolDetails(toolId) {
    console.log(`[TOOL DETAIL] Loading tool: ${toolId}`);
    
    const data = await loadData();
    if (!data) {
        console.error('[TOOL DETAIL] No data available');
        return;
    }

    const tool = data.tools.find(t => t && t.id === toolId);
    if (!tool) {
        console.warn(`[TOOL DETAIL] Tool not found: ${toolId}`);
        window.location.href = 'index.html';
        return;
    }

    console.log(`[TOOL DETAIL] Rendering tool: ${tool.name}`);

    // Store tool globally for favorite button
    if (typeof window !== 'undefined') {
        window.currentToolId = toolId;
        window.currentTool = tool;
    }

    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = `${tool.name} - gubicoo Lens`;

    // Hero Section
    const toolDetailHero = document.getElementById('toolDetailHero');
    if (toolDetailHero) {
        const iconHtml = getToolIconHtml(tool, 'tool-detail-icon', 'large');
        const categoryName = tool.categoryName || getCategoryName(data, tool.category) || 'AI Tool';
        const rating = tool.rating ? `<div class="rating-display"><span class="material-symbols-outlined">star</span> ${tool.rating.toFixed(1)}</div>` : '';
        const pricingType = tool.pricingType || 'Unknown';
        const pricingBadge = pricingType === 'Free' 
            ? '<span class="pricing-badge free">Free</span>'
            : pricingType === 'Freemium'
            ? '<span class="pricing-badge freemium">Freemium</span>'
            : '<span class="pricing-badge paid">Paid</span>';
        
        toolDetailHero.innerHTML = `
            <div class="hero-icon">${iconHtml}</div>
            <div class="hero-content">
                <h1 class="hero-title">${escapeHtml(tool.name)}</h1>
                <div class="hero-meta">
                    ${rating}
                    <span class="category-tag">${escapeHtml(categoryName)}</span>
                    ${pricingBadge}
                </div>
            </div>
        `;
    }

    // Stats Bar
    const toolStatsBar = document.getElementById('toolStatsBar');
    if (toolStatsBar) {
        const stats = [];
        if (tool.rating) stats.push(`<div class="stat-item"><span class="material-symbols-outlined">star</span><span>${tool.rating.toFixed(1)} Rating</span></div>`);
        if (tool.pricingType) stats.push(`<div class="stat-item"><span class="material-symbols-outlined">${tool.pricingType === 'Free' ? 'free_breakfast' : 'workspace_premium'}</span><span>${tool.pricingType}</span></div>`);
        if (tool.categoryName) stats.push(`<div class="stat-item"><span class="material-symbols-outlined">category</span><span>${tool.categoryName}</span></div>`);
        toolStatsBar.innerHTML = stats.join('');
    }

    // Description
    const descEl = document.getElementById('toolDescription');
    if (descEl) {
        const description = tool.purpose || tool.description || 'No description available';
        descEl.innerHTML = `<p class="detail-text-large">${escapeHtml(description)}</p>`;
    }

    // Category
    const categoryEl = document.getElementById('toolCategory');
    if (categoryEl) {
        const categoryName = tool.categoryName || getCategoryName(data, tool.category) || 'AI Tool';
        categoryEl.innerHTML = `<span class="category-badge-large-text">${escapeHtml(categoryName)}</span>`;
    }

    // Website
    const websiteEl = document.getElementById('toolWebsite');
    if (websiteEl && tool.domain) {
        const websiteUrl = tool.domain.startsWith('http') ? tool.domain : `https://${tool.domain}`;
        websiteEl.href = websiteUrl;
    }

    // Free Plan
    const freePlanEl = document.getElementById('freePlan');
    if (freePlanEl) {
        const freeTier = tool.freeTier || (tool.pricing && tool.pricing.free && tool.pricing.free.limits);
        const hasFree = tool.pricingType === 'Free' || tool.pricingType === 'Freemium' || (tool.pricing && tool.pricing.free && tool.pricing.free.available);
        
        if (hasFree && freeTier) {
            freePlanEl.innerHTML = `
                <div class="pricing-card-header">
                    <span class="material-symbols-outlined">check_circle</span>
                    <h3>Free Plan Available</h3>
                </div>
                <div class="pricing-card-body">
                    <p>${escapeHtml(freeTier)}</p>
                </div>
            `;
        } else if (hasFree) {
            freePlanEl.innerHTML = `
                <div class="pricing-card-header">
                    <span class="material-symbols-outlined">check_circle</span>
                    <h3>Free Plan Available</h3>
                </div>
                <div class="pricing-card-body">
                    <p>This tool offers a free plan with basic features.</p>
                </div>
            `;
        } else {
            freePlanEl.innerHTML = `
                <div class="pricing-card-header">
                    <span class="material-symbols-outlined">cancel</span>
                    <h3>No Free Plan</h3>
                </div>
                <div class="pricing-card-body">
                    <p>This tool does not offer a free plan.</p>
                </div>
            `;
        }
    }

    // Paid Plan
    const paidPlanEl = document.getElementById('paidPlan');
    if (paidPlanEl) {
        const paidTier = tool.paidTier || (tool.pricing && tool.pricing.paid && tool.pricing.paid.benefits);
        const hasPaid = tool.pricingType === 'Paid' || tool.pricingType === 'Freemium' || (tool.pricing && tool.pricing.paid);
        
        if (hasPaid && paidTier) {
            paidPlanEl.innerHTML = `
                <div class="pricing-card-header">
                    <span class="material-symbols-outlined">workspace_premium</span>
                    <h3>Paid Plan Available</h3>
                </div>
                <div class="pricing-card-body">
                    <p>${escapeHtml(paidTier)}</p>
                </div>
            `;
        } else if (hasPaid) {
            paidPlanEl.innerHTML = `
                <div class="pricing-card-header">
                    <span class="material-symbols-outlined">workspace_premium</span>
                    <h3>Paid Plan Available</h3>
                </div>
                <div class="pricing-card-body">
                    <p>This tool offers premium features with a paid subscription.</p>
                </div>
            `;
        } else {
            paidPlanEl.innerHTML = `
                <div class="pricing-card-header">
                    <span class="material-symbols-outlined">free_breakfast</span>
                    <h3>Free Only</h3>
                </div>
                <div class="pricing-card-body">
                    <p>This tool is completely free with no paid plans.</p>
                </div>
            `;
        }
    }

    // Pricing Details
    const pricingEl = document.getElementById('pricingInfo');
    if (pricingEl) {
        if (tool.pricing && tool.pricing.paid) {
            pricingEl.innerHTML = `
                <div class="pricing-detail-card">
                    <div class="pricing-detail-header">
                        <span class="material-symbols-outlined">calendar_month</span>
                        <h4>Monthly</h4>
                    </div>
                    <div class="pricing-detail-value">$${tool.pricing.paid.monthly || 'N/A'}<span class="pricing-period">/mo</span></div>
                </div>
                <div class="pricing-detail-card">
                    <div class="pricing-detail-header">
                        <span class="material-symbols-outlined">calendar_today</span>
                        <h4>Yearly</h4>
                    </div>
                    <div class="pricing-detail-value">$${tool.pricing.paid.yearly || 'N/A'}<span class="pricing-period">/yr</span></div>
                </div>
            `;
        } else {
            pricingEl.innerHTML = '<div class="pricing-detail-card"><p class="detail-text">This tool is completely free.</p></div>';
        }
    }

    // Should Pay
    const shouldPayEl = document.getElementById('shouldPay');
    if (shouldPayEl && tool.shouldIPay) {
        const shouldPayText = tool.shouldIPay;
        const isYes = shouldPayText.toUpperCase().includes('YES') || shouldPayText.toUpperCase().includes('WORTH');
        shouldPayEl.innerHTML = `
            <div class="should-pay-indicator ${isYes ? 'yes' : 'maybe'}">
                <span class="material-symbols-outlined">${isYes ? 'thumb_up' : 'help'}</span>
                <h3>${escapeHtml(shouldPayText)}</h3>
            </div>
        `;
    }

    // Best For
    const bestForEl = document.getElementById('bestFor');
    if (bestForEl) {
        if (Array.isArray(tool.bestFor) && tool.bestFor.length > 0) {
            bestForEl.innerHTML = tool.bestFor.map(item => `
                <div class="feature-item">
                    <span class="material-symbols-outlined">check_circle</span>
                    <span>${escapeHtml(item)}</span>
                </div>
            `).join('');
        } else {
            bestForEl.innerHTML = '<div class="feature-item"><span>No information available</span></div>';
        }
    }

    // Not Good For
    const notGoodForEl = document.getElementById('notGoodFor');
    if (notGoodForEl) {
        if (Array.isArray(tool.notGoodFor) && tool.notGoodFor.length > 0) {
            notGoodForEl.innerHTML = tool.notGoodFor.map(item => `
                <div class="feature-item">
                    <span class="material-symbols-outlined">cancel</span>
                    <span>${escapeHtml(item)}</span>
                </div>
            `).join('');
        } else {
            notGoodForEl.innerHTML = '<div class="feature-item"><span>No information available</span></div>';
        }
    }

    // Limits
    const limitsEl = document.getElementById('toolLimits');
    if (limitsEl) {
        const limits = tool.limits || (tool.pricing && tool.pricing.free && tool.pricing.free.limits);
        if (limits) {
            limitsEl.innerHTML = `<p class="detail-text">${escapeHtml(limits)}</p>`;
        } else {
            limitsEl.innerHTML = '<p class="detail-text">No specific limits mentioned.</p>';
        }
    }

    // User Types
    const userTypesEl = document.getElementById('userTypes');
    if (userTypesEl && tool.recommendedFor && tool.recommendedFor.userType) {
        const userTypes = tool.recommendedFor.userType;
        if (Array.isArray(userTypes) && userTypes.length > 0) {
            userTypesEl.innerHTML = userTypes.map(type => `
                <div class="recommendation-item">
                    <span class="material-symbols-outlined">person</span>
                    <span>${escapeHtml(type.charAt(0).toUpperCase() + type.slice(1))}</span>
                </div>
            `).join('');
        } else {
            userTypesEl.innerHTML = '<div class="recommendation-item"><span>Not specified</span></div>';
        }
    }

    // Industries
    const industriesEl = document.getElementById('industries');
    if (industriesEl && tool.recommendedFor && tool.recommendedFor.industries) {
        const industries = tool.recommendedFor.industries;
        if (Array.isArray(industries) && industries.length > 0) {
            industriesEl.innerHTML = industries.map(industry => `
                <div class="recommendation-item">
                    <span class="material-symbols-outlined">business</span>
                    <span>${escapeHtml(industry)}</span>
                </div>
            `).join('');
        } else {
            industriesEl.innerHTML = '<div class="recommendation-item"><span>Not specified</span></div>';
        }
    }

    // Use Cases
    const useCasesEl = document.getElementById('useCases');
    if (useCasesEl && tool.recommendedFor && tool.recommendedFor.useCases) {
        const useCases = tool.recommendedFor.useCases;
        if (Array.isArray(useCases) && useCases.length > 0) {
            useCasesEl.innerHTML = useCases.map(useCase => `
                <div class="recommendation-item">
                    <span class="material-symbols-outlined">task_alt</span>
                    <span>${escapeHtml(useCase)}</span>
                </div>
            `).join('');
        } else {
            useCasesEl.innerHTML = '<div class="recommendation-item"><span>Not specified</span></div>';
        }
    }

    // AI Level - Handle as array
    const aiLevelEl = document.getElementById('aiLevel');
    if (aiLevelEl) {
        if (tool.recommendedFor && tool.recommendedFor.aiLevel && Array.isArray(tool.recommendedFor.aiLevel) && tool.recommendedFor.aiLevel.length > 0) {
            const aiLevels = tool.recommendedFor.aiLevel;
            // Capitalize and format levels
            const formattedLevels = aiLevels.map(level => {
                const levelMap = {
                    'beginner': 'Beginner',
                    'intermediate': 'Intermediate',
                    'advanced': 'Advanced',
                    'ai-first': 'AI-First'
                };
                return levelMap[level.toLowerCase()] || level.charAt(0).toUpperCase() + level.slice(1);
            });
            
            aiLevelEl.innerHTML = `
                <div class="ai-level-indicator">
                    <span class="material-symbols-outlined">psychology</span>
                    <div class="ai-level-content">
                        <span class="ai-level-label">Required AI Skill Level</span>
                        <div class="ai-level-badges">
                            ${formattedLevels.map(level => `<span class="ai-level-badge">${escapeHtml(level)}</span>`).join('')}
                        </div>
                        <p class="ai-level-description">This tool is suitable for users with these AI experience levels</p>
                    </div>
                </div>
            `;
        } else {
            aiLevelEl.innerHTML = `
                <div class="ai-level-indicator">
                    <span class="material-symbols-outlined">psychology</span>
                    <div class="ai-level-content">
                        <span class="ai-level-label">Required AI Skill Level</span>
                        <span class="ai-level-text">Not specified</span>
                        <p class="ai-level-description">AI experience level information not available</p>
                    </div>
                </div>
            `;
        }
    }

    // Budget - Handle as array
    const budgetEl = document.getElementById('budgetRec');
    if (budgetEl) {
        if (tool.recommendedFor && tool.recommendedFor.budget && Array.isArray(tool.recommendedFor.budget) && tool.recommendedFor.budget.length > 0) {
            const budgets = tool.recommendedFor.budget;
            // Format budget levels
            const formattedBudgets = budgets.map(budget => {
                const budgetMap = {
                    'free': 'Free',
                    'low': 'Low ($0-$20/mo)',
                    'medium': 'Medium ($20-$100/mo)',
                    'high': 'High ($100+/mo)'
                };
                return budgetMap[budget.toLowerCase()] || budget.charAt(0).toUpperCase() + budget.slice(1);
            });
            
            budgetEl.innerHTML = `
                <div class="budget-indicator">
                    <span class="material-symbols-outlined">account_balance_wallet</span>
                    <div class="budget-content">
                        <span class="budget-label">Recommended Budget Range</span>
                        <div class="budget-badges">
                            ${formattedBudgets.map(budget => `<span class="budget-badge">${escapeHtml(budget)}</span>`).join('')}
                        </div>
                        <p class="budget-description">This tool fits within these budget ranges</p>
                    </div>
                </div>
            `;
        } else {
            budgetEl.innerHTML = `
                <div class="budget-indicator">
                    <span class="material-symbols-outlined">account_balance_wallet</span>
                    <div class="budget-content">
                        <span class="budget-label">Recommended Budget Range</span>
                        <span class="budget-text">Not specified</span>
                        <p class="budget-description">Budget recommendation information not available</p>
                    </div>
                </div>
            `;
        }
    }

    // Verdict
    const verdictEl = document.getElementById('verdict');
    if (verdictEl) {
        const verdictText = tool.verdict || (tool.shouldIPay ? `Should you pay? ${tool.shouldIPay}` : 'No verdict available.');
        verdictEl.innerHTML = `
            <div class="verdict-content">
                <div class="verdict-icon">
                    <span class="material-symbols-outlined">gavel</span>
                </div>
                <div class="verdict-text">
                    <p>${escapeHtml(verdictText)}</p>
                </div>
            </div>
        `;
    }

    // Favorite Button - Use centralized function
    const favoriteBtn = document.getElementById('favoriteBtn');
    if (favoriteBtn) {
        const isSaved = isToolSaved(toolId);
        const favoriteIcon = document.getElementById('favoriteIcon');
        const favoriteText = document.getElementById('favoriteText');
        if (favoriteIcon) {
            favoriteIcon.textContent = isSaved ? 'favorite' : 'favorite_border';
            favoriteIcon.style.color = isSaved ? '#ef4444' : '';
        }
        if (favoriteText) {
            favoriteText.textContent = isSaved ? 'Saved to Favorites' : 'Save to Favorites';
        }
        console.log(`[TOOL DETAIL] Favorite button initialized. Tool ${toolId} is ${isSaved ? 'saved' : 'not saved'}`);
    }

    console.log('[TOOL DETAIL] Rendering complete');
}

// ============================================
// COMPARISON PAGE - LOAD COMPARISON TABLE (OLD - multi-tool)
// ============================================

async function loadComparisonTable() {
    console.log('[COMPARISON] Loading comparison table...');
    
    const data = await loadData();
    if (!data) {
        console.error('[COMPARISON] No data available');
        return;
    }

    // Populate category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        data.categories.forEach(category => {
            if (category && category.id && category.name) {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            }
        });

        categoryFilter.addEventListener('change', function() {
            renderComparisonTable(data, this.value);
        });
    }

    // Initial render - NO LIMITS, show ALL tools
    renderComparisonTable(data, 'all');
}

// ============================================
// MULTI-TOOL COMPARISON (2-5 TOOLS)
// ============================================

let comparisonData = null;
let selectedTools = [];

async function loadMultiToolComparison() {
    console.log('[MULTI-TOOL COMPARISON] Loading multi-tool comparison...');
    
    const data = await loadData();
    if (!data) {
        console.error('[MULTI-TOOL COMPARISON] No data available');
        return;
    }

    comparisonData = data;
    const toolSelectors = document.getElementById('toolSelectors');
    const addToolBtn = document.getElementById('addToolBtn');

    if (!toolSelectors || !addToolBtn) {
        console.error('[MULTI-TOOL COMPARISON] Required elements not found');
        return;
    }

    // Initialize with 2 tool selectors
    addToolSelector(data, toolSelectors);
    addToolSelector(data, toolSelectors);

    // Add tool button
    addToolBtn.addEventListener('click', function() {
        if (selectedTools.length < 5) {
            addToolSelector(data, toolSelectors);
        } else {
            alert('Maximum 5 tools can be compared at once.');
        }
    });

    // Initial render
    renderMultiToolComparison(data);
}

function addToolSelector(data, container) {
    if (selectedTools.length >= 5) return;

    const selectorIndex = selectedTools.length;
    const selectorGroup = document.createElement('div');
    selectorGroup.className = 'selector-group';
    selectorGroup.dataset.index = selectorIndex;

    const label = document.createElement('label');
    label.setAttribute('for', `toolSelect${selectorIndex}`);
    label.textContent = `Tool ${String.fromCharCode(65 + selectorIndex)}`;

    const select = document.createElement('select');
    select.id = `toolSelect${selectorIndex}`;
    select.className = 'tool-selector';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Choose a tool...';
    select.appendChild(defaultOption);

    // Populate with all tools
    data.tools.forEach(tool => {
        if (tool && tool.id && tool.name) {
            const option = document.createElement('option');
            option.value = tool.id;
            option.textContent = tool.name;
            select.appendChild(option);
        }
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-tool-btn';
    removeBtn.type = 'button';
    removeBtn.title = 'Remove this tool';
    removeBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
    removeBtn.style.display = selectedTools.length < 2 ? 'none' : 'flex';

    removeBtn.addEventListener('click', function() {
        if (selectedTools.length <= 2) {
            alert('At least 2 tools are required for comparison.');
            return;
        }
        selectorGroup.remove();
        updateToolSelectors();
        renderMultiToolComparison(data);
    });

    select.addEventListener('change', function() {
        updateToolSelectors();
        renderMultiToolComparison(data);
    });

    selectorGroup.appendChild(label);
    selectorGroup.appendChild(select);
    selectorGroup.appendChild(removeBtn);
    container.appendChild(selectorGroup);

    updateToolSelectors();
}

function updateToolSelectors() {
    selectedTools = [];
    const selectors = document.querySelectorAll('.tool-selector');
    const removeBtns = document.querySelectorAll('.remove-tool-btn');
    const addToolBtn = document.getElementById('addToolBtn');

    selectors.forEach((select, index) => {
        if (select.value) {
            selectedTools.push(select.value);
        }
        // Update remove button visibility
        if (removeBtns[index]) {
            removeBtns[index].style.display = selectors.length > 2 ? 'flex' : 'none';
        }
    });

    // Update add button state
    if (addToolBtn) {
        if (selectedTools.length >= 5) {
            addToolBtn.disabled = true;
            addToolBtn.style.opacity = '0.5';
            addToolBtn.style.cursor = 'not-allowed';
        } else {
            addToolBtn.disabled = false;
            addToolBtn.style.opacity = '1';
            addToolBtn.style.cursor = 'pointer';
        }
    }
}

function renderMultiToolComparison(data) {
    const compareTableHead = document.getElementById('compareTableHead');
    const compareBody = document.getElementById('compareBody');
    const compareTable = document.getElementById('compareTable');
    const compareTableWrapper = document.querySelector('.compare-table-wrapper');

    if (!compareTableHead || !compareBody || !compareTable || !compareTableWrapper) return;

    // Get selected tools
    const tools = selectedTools
        .map(id => data.tools.find(t => t && t.id === id))
        .filter(tool => tool != null);

    // Check if mobile (max-width: 600px)
    const isMobile = window.innerWidth <= 600;

    if (tools.length < 2) {
        compareBody.innerHTML = `
            <tr>
                <td colspan="2" class="compare-placeholder">
                    <div class="placeholder-content">
                        <span class="material-symbols-outlined">compare_arrows</span>
                        <p>Select at least two tools to compare</p>
                    </div>
                </td>
            </tr>
        `;
        // Remove mobile cards if exists
        const existingMobileCards = compareTableWrapper.querySelector('.mobile-compare-cards');
        if (existingMobileCards) existingMobileCards.remove();
        return;
    }

    // On mobile, render cards instead of table
    if (isMobile) {
        renderMobileComparisonCards(tools, data, compareTableWrapper);
        // Hide table on mobile
        if (compareTable) compareTable.style.display = 'none';
        return;
    }

    // Show table on desktop, hide mobile cards
    if (compareTable) compareTable.style.display = '';
    const existingMobileCards = compareTableWrapper.querySelector('.mobile-compare-cards');
    if (existingMobileCards) existingMobileCards.remove();

    // Update table headers
    const headerRow = compareTableHead.querySelector('tr');
    if (headerRow) {
        // Keep first column (Feature), remove old headers
        while (headerRow.cells.length > 1) {
            headerRow.deleteCell(1);
        }
        
        // Add headers for selected tools
        tools.forEach(tool => {
            const th = document.createElement('th');
            th.textContent = tool.name;
            headerRow.appendChild(th);
        });
    }

    // Helper functions
    const getValue = (tool, field, fallback = 'N/A') => {
        return tool[field] || fallback;
    };

    const getCategoryName = (tool) => {
        return tool.categoryName || getCategoryNameFromId(data, tool.category) || 'N/A';
    };

    // Build comparison rows
    const rows = [
        {
            feature: 'Category',
            values: tools.map(tool => escapeHtml(getCategoryName(tool)))
        },
        {
            feature: 'Purpose',
            values: tools.map(tool => escapeHtml(getValue(tool, 'purpose', tool.description || 'N/A')))
        },
        {
            feature: 'Pricing Type',
            values: tools.map(tool => {
                const pricingType = tool.pricingType || (tool.pricing && tool.pricing.free && tool.pricing.free.available ? 'Freemium' : 'Paid');
                return escapeHtml(pricingType || 'N/A');
            })
        },
        {
            feature: 'Free Tier',
            values: tools.map(tool => {
                const freeTier = tool.freeTier || (tool.pricing && tool.pricing.free && tool.pricing.free.limits);
                const hasFree = tool.pricingType === 'Free' || tool.pricingType === 'Freemium' || (tool.pricing && tool.pricing.free && tool.pricing.free.available);
                return escapeHtml(hasFree ? (freeTier || 'Available') : 'None');
            })
        },
        {
            feature: 'Paid Tier',
            values: tools.map(tool => escapeHtml(getValue(tool, 'paidTier', tool.pricing && tool.pricing.paid && tool.pricing.paid.benefits || 'N/A')))
        },
        {
            feature: 'Monthly Price',
            values: tools.map(tool => {
                if (!tool.pricing || !tool.pricing.paid) return 'N/A';
                return `$${tool.pricing.paid.monthly || 'N/A'}`;
            })
        },
        {
            feature: 'Yearly Price',
            values: tools.map(tool => {
                if (!tool.pricing || !tool.pricing.paid) return 'N/A';
                return `$${tool.pricing.paid.yearly || 'N/A'}`;
            })
        },
        {
            feature: 'Limits',
            values: tools.map(tool => escapeHtml(getValue(tool, 'limits', 'N/A')))
        },
        {
            feature: 'Rating',
            values: tools.map(tool => `${tool.rating || 'N/A'}`)
        },
        {
            feature: 'Should I Pay?',
            values: tools.map(tool => `<strong>${escapeHtml(getValue(tool, 'shouldIPay', 'N/A'))}</strong>`)
        },
        {
            feature: 'Best For',
            values: tools.map(tool => {
                if (!Array.isArray(tool.bestFor) || tool.bestFor.length === 0) return 'N/A';
                return tool.bestFor.slice(0, 3).map(item => escapeHtml(item)).join(', ');
            })
        }
    ];

    // Render table
    compareBody.innerHTML = '';
    rows.forEach(row => {
        const tr = document.createElement('tr');
        
        const th = document.createElement('th');
        th.textContent = row.feature;
        tr.appendChild(th);

        row.values.forEach(value => {
            const td = document.createElement('td');
            td.innerHTML = value;
            tr.appendChild(td);
        });

        compareBody.appendChild(tr);
    });

    // Update colspan for placeholder if needed
    const placeholder = compareBody.querySelector('.compare-placeholder');
    if (placeholder) {
        placeholder.setAttribute('colspan', tools.length + 1);
    }

    console.log(`[MULTI-TOOL COMPARISON] Rendered comparison for ${tools.length} tools`);
}

function getCategoryNameFromId(data, categoryId) {
    if (!data || !data.categories) return null;
    const category = data.categories.find(cat => cat && cat.id === categoryId);
    return category ? category.name : null;
}

function renderComparisonTable(data, categoryFilter) {
    console.log(`[COMPARISON] Rendering table with filter: ${categoryFilter}`);
    
    // Filter tools - NO LIMITS
    let tools = data.tools.filter(tool => tool && tool.id && tool.name);
    
    if (categoryFilter !== 'all') {
        tools = tools.filter(tool => tool.category === categoryFilter);
    }

    console.log(`[COMPARISON] Found ${tools.length} tools to compare`);

    if (tools.length === 0) {
        const tbody = document.getElementById('comparisonBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 2rem; color: #666;">No tools to compare.</td></tr>';
        }
        return;
    }

    // REMOVED: Hard limit of 3 tools - now show ALL tools
    // Dynamic column headers based on actual tool count
    const thead = document.querySelector('.comparison-table thead');
    if (thead) {
        const headerRow = thead.querySelector('tr');
        if (headerRow) {
            // Keep first column (Feature), remove old tool headers, add new ones
            while (headerRow.cells.length > 1) {
                headerRow.deleteCell(1);
            }
            
            // Add headers for all tools
            tools.forEach(tool => {
                const th = document.createElement('th');
                th.textContent = tool.name;
                headerRow.appendChild(th);
            });
        }
    }

    // Build comparison rows - use new fields with fallbacks
    const rows = [
        {
            feature: 'Pricing Type',
            values: tools.map(tool => {
                const pricingType = tool.pricingType || (tool.pricing && tool.pricing.free && tool.pricing.free.available ? 'Freemium' : 'Paid');
                return pricingType || 'N/A';
            })
        },
        {
            feature: 'Free Tier',
            values: tools.map(tool => {
                const freeTier = tool.freeTier || (tool.pricing && tool.pricing.free && tool.pricing.free.limits);
                const hasFree = tool.pricingType === 'Free' || tool.pricingType === 'Freemium' || (tool.pricing && tool.pricing.free && tool.pricing.free.available);
                return hasFree ? (freeTier || 'Available') : 'None';
            })
        },
        {
            feature: 'Monthly Price',
            values: tools.map(tool => {
                if (!tool.pricing || !tool.pricing.paid) return 'N/A';
                return `$${tool.pricing.paid.monthly || 'N/A'}`;
            })
        },
        {
            feature: 'Yearly Price',
            values: tools.map(tool => {
                if (!tool.pricing || !tool.pricing.paid) return 'N/A';
                return `$${tool.pricing.paid.yearly || 'N/A'}`;
            })
        },
        {
            feature: 'Rating',
            values: tools.map(tool => `${tool.rating || 'N/A'}`)
        },
        {
            feature: 'Should You Pay?',
            values: tools.map(tool => tool.shouldIPay || 'N/A')
        },
        {
            feature: 'Best For',
            values: tools.map(tool => {
                if (!Array.isArray(tool.bestFor) || tool.bestFor.length === 0) return 'N/A';
                return tool.bestFor.slice(0, 2).join(', ');
            })
        }
    ];

    // Render table
    const tbody = document.getElementById('comparisonBody');
    if (!tbody) {
        console.error('[COMPARISON] Table body not found');
        return;
    }

    tbody.innerHTML = '';

    let renderedRows = 0;
    rows.forEach((row, rowIndex) => {
        try {
            const tr = document.createElement('tr');
            
            const th = document.createElement('th');
            th.className = 'sticky-col';
            th.textContent = row.feature;
            tr.appendChild(th);

            row.values.forEach((value, index) => {
                const td = document.createElement('td');
                if (index === 0) td.className = 'sticky-col';
                td.textContent = value || '—';
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
            renderedRows++;
        } catch (error) {
            console.error(`[COMPARISON] Error rendering row at index ${rowIndex}:`, error);
        }
    });

    console.log(`[COMPARISON] Rendering complete: ${renderedRows} rows, ${tools.length} tools`);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// ICON HELPER FUNCTIONS (CLEARBIT API)
// ============================================

/**
 * Get tool icon URL using Simple Icons CDN
 * Falls back to Material Symbols icon if icon name not available
 */
function getToolIconUrl(tool) {
    if (!tool) {
        console.warn('[ICON] No tool provided to getToolIconUrl');
        return null;
    }
    
    // Map tool names/domains to Simple Icons names
    // Check https://simpleicons.org/ for available icons
    const iconMap = {
        // Chatbots & Assistants
        'chatgpt': 'openai',
        'openai.com': 'openai',
        'openai': 'openai',
        'claude': 'anthropic',
        'anthropic.com': 'anthropic',
        'anthropic': 'anthropic',
        'perplexity': 'perplexity',
        'perplexity ai': 'perplexity',
        'perplexityai': 'perplexity',
        'copilot': 'microsoft',
        'microsoft copilot': 'microsoft',
        'microsoft co pilot': 'microsoft', // Common spacing variation
        'microsoftcopilot': 'microsoft',
        'gemini': 'google',
        'bard': 'google',
        'google': 'google',
        'googleai': 'google',
        
        // Coding & Development
        'github_copilot': 'github',
        'github copilot': 'github',
        'githubcopilot': 'github',
        'github.com': 'github',
        'github': 'github',
        'cursor': 'cursor',
        'codeium': 'codeium',
        'tabnine': 'tabnine',
        'replit': 'replit',
        
        // Image & Design
        'midjourney': 'midjourney',
        'midjourney.com': 'midjourney',
        'midjourneyy': 'midjourney', // Common typo
        'canva': 'canva',
        'canva.com': 'canva',
        'figma': 'figma',
        'figma ai': 'figma',
        'adobe_firefly': 'adobe',
        'adobe firefly': 'adobe',
        'adobefirefly': 'adobe',
        'adobe': 'adobe',
        'firefly': 'adobe',
        'dalle': 'openai',
        'dall-e 3': 'openai',
        'dall-e': 'openai',
        'dalle3': 'openai',
        'dalle-3': 'openai',
        'dalle3': 'openai',
        'stable_diffusion': 'stabilityai',
        'stable diffusion': 'stabilityai',
        'stablediffusion': 'stabilityai',
        'stable difusion': 'stabilityai', // Common typo
        'stabilityai': 'stabilityai',
        'stability ai': 'stabilityai',
        'leonardo': 'leonardo',
        'leonardo ai': 'leonardo',
        'leonardoai': 'leonardo',
        
        // Video & Audio
        'elevenlabs': 'elevenlabs',
        'elevenlabs.io': 'elevenlabs',
        'eleven labs': 'elevenlabs',
        'elevenlabsai': 'elevenlabs',
        'runway': 'runwayml',
        'runwayml': 'runwayml',
        'runway ml': 'runwayml',
        'synthesia': 'synthesia',
        'syntesis': 'synthesia', // Common typo
        'synthesis': 'synthesia', // Alternative spelling
        'descript': 'descript',
        'descript ai': 'descript',
        'descriptai': 'descript',
        'pika': 'pika',
        'pika labs': 'pika',
        'pikalabs': 'pika',
        'luma': 'luma',
        'luma ai': 'luma',
        'lumai': 'luma',
        'heygen': 'heygen',
        'hey gen': 'heygen',
        'heygenai': 'heygen',
        'murf': 'murf',
        'murf ai': 'murf',
        'murfai': 'murf',
        'playht': 'playht',
        'play.ht': 'playht',
        'playhtai': 'playht',
        'blackmagic': 'blackmagicdesign',
        'blackmagic design': 'blackmagicdesign',
        'blackmagicdesign': 'blackmagicdesign',
        'blackmagic ai': 'blackmagicdesign',
        
        // Writing & Content
        'jasper': 'jasper',
        'jasper ai': 'jasper',
        'jasperai': 'jasper',
        'jasper_seo': 'jasper',
        'jasper seo': 'jasper',
        'jasperseo': 'jasper',
        'copyai': 'copyai',
        'copy.ai': 'copyai',
        'copy ai': 'copyai',
        'copyai': 'copyai',
        'grammarly': 'grammarly',
        'notion_ai': 'notion',
        'notion ai': 'notion',
        'notionai': 'notion',
        'notion': 'notion',
        'writesonic': 'writesonic',
        'write sonic': 'writesonic',
        'writesonicai': 'writesonic',
        'surfer': 'surfer',
        'surfer seo': 'surfer',
        'surferseo': 'surfer',
        'fathom': 'fathom',
        'fathom ai': 'fathom',
        'fathomai': 'fathom',
        'otter': 'otter',
        'otter.ai': 'otter',
        'otter ai': 'otter',
        'otterai': 'otter',
        
        // AI Platforms
        'huggingface': 'huggingface',
        'hugging face': 'huggingface',
        'huggingfaceai': 'huggingface',
        'replicate': 'replicate',
        'together': 'togetherdotai',
        'together ai': 'togetherdotai',
        'togetherai': 'togetherdotai',
        'cohere': 'cohere',
        'mistral': 'mistralai',
        'mistralai': 'mistralai',
        'mistral ai': 'mistralai',
        'openrouter': 'openrouter',
        
        // Productivity
        'zapier': 'zapier',
        'zapier ai': 'zapier',
        'make': 'make',
        'make.com': 'make',
        'makeautomation': 'make',
        'integromat': 'make',
        'microsoft': 'microsoft',
        'automate': 'microsoft',
        
        // 3D Modeling
        'spline': 'spline',
        'meshy': 'meshy',
        'meshy ai': 'meshy',
        'meshyai': 'meshy',
        
        // New Coding Tools
        'bolt': 'stackblitz',
        'bolt.new': 'stackblitz',
        'stackblitz': 'stackblitz',
        'v0': 'vercel',
        'v0.dev': 'vercel',
        'vercel': 'vercel',
        'lovable': 'lovable',
        'lovable.dev': 'lovable',
        'devin': 'cognition',
        'cognition': 'cognition',
        'cognition.ai': 'cognition',
        'sweep': 'sweep',
        'sweep ai': 'sweep',
        'sweepai': 'sweep',
        'sweep.dev': 'sweep',
        'sourcegraph': 'sourcegraph',
        'sourcegraph cody': 'sourcegraph',
        'cody': 'sourcegraph',
        'continue': 'continue',
        'continue.dev': 'continue',
        
        // Automation & Agents
        'autogpt': 'github',
        'autogpt ai': 'github',
        'crewai': 'crewai',
        'crew ai': 'crewai',
        'langgraph': 'langchain',
        'lang graph': 'langchain',
        'langchain': 'langchain',
        'openhands': 'openhands',
        'open hands': 'openhands',
        'openhands.dev': 'openhands',
        'n8n': 'n8n',
        'zapier_ai': 'zapier',
        
        // New Image Tools
        'ideogram': 'ideogram',
        'ideogram.ai': 'ideogram',
        'krea': 'krea',
        'krea.ai': 'krea',
        'playground': 'playground',
        'playground ai': 'playground',
        'playgroundai': 'playground',
        'playgroundai.com': 'playground',
        'nightcafe': 'nightcafe',
        'night cafe': 'nightcafe',
        'nightcafe.studio': 'nightcafe',
        'fooocus': 'github',
        
        // New Video Tools
        'veed': 'veed',
        'veed.io': 'veed',
        
        // Research & Analysis
        'elicit': 'elicit',
        'elicit.com': 'elicit',
        'consensus': 'consensus',
        'consensus.app': 'consensus',
        'scite': 'scite',
        'scite.ai': 'scite',
        
        // Writing & Marketing
        'sudowrite': 'sudowrite',
        'sudo write': 'sudowrite',
        'sudowrite.com': 'sudowrite',
        'frase': 'frase',
        'frase.io': 'frase',
        
        // Productivity
        'tome': 'tome',
        'tome.app': 'tome',
        'mem': 'mem',
        'mem.ai': 'mem',
        
        // Finance & Analytics
        'alphasense': 'alphasense',
        'alpha sense': 'alphasense',
        'alphasense.com': 'alphasense',
        'tickeron': 'tickeron',
        'tickeron.com': 'tickeron',
        
        // AI Directories
        'toolify': 'toolify',
        'toolify.ai': 'toolify',
        'taaft': 'theresanaiforthat',
        'theres an ai for that': 'theresanaiforthat',
        'theresanaiforthat': 'theresanaiforthat',
        'theresanaiforthat.com': 'theresanaiforthat',
        
        // Education & Teaching
        'magicschool': 'magicschool',
        'magicschool.ai': 'magicschool',
        'magicschool ai': 'magicschool',
        'diffit': 'diffit',
        'diffit.me': 'diffit',
        'education_copilot': 'educationcopilot',
        'education copilot': 'educationcopilot',
        'educationcopilot': 'educationcopilot',
        'educationcopilot.com': 'educationcopilot',
        'curipod': 'curipod',
        'curipod.com': 'curipod',
        'classpoint_ai': 'classpoint',
        'classpoint ai': 'classpoint',
        'classpoint': 'classpoint',
        'classpoint.io': 'classpoint',
        'teachermatic': 'teachermatic',
        'teachermatic.com': 'teachermatic',
        'quizizz_ai': 'quizizz',
        'quizizz ai': 'quizizz',
        'quizizz': 'quizizz',
        'quizizz.com': 'quizizz',
        'edpuzzle': 'edpuzzle',
        'edpuzzle.com': 'edpuzzle',
        'khanmigo': 'khanacademy',
        'khan migo': 'khanacademy',
        'khanacademy': 'khanacademy',
        'khanacademy.org': 'khanacademy',
        'schoolai': 'schoolai',
        'school ai': 'schoolai',
        'schoolai.com': 'schoolai',
        
        // New Tools
        'whisper_flow': 'whisperflow',
        'whisper flow': 'whisperflow',
        'whisperflow': 'whisperflow',
        'whisperflow.app': 'whisperflow',
        'wisp_flow': 'whisperflow',
        'wispr flow': 'whisperflow',
        'wisprflow': 'whisperflow',
        'whisperflow.org': 'whisperflow',
        'runway_ml': 'runway',
        'runway ml': 'runway',
        'runwayml': 'runway',
        'runwayml.com': 'runway',
        'runway': 'runway',
        'pika_labs': 'pika',
        'pika labs': 'pika',
        'pikalabs': 'pika',
        'pika.art': 'pika',
        'pika': 'pika',
        'stability_ai': 'stabilityai',
        'stability ai': 'stabilityai',
        'stabilityai': 'stabilityai',
        'stability.ai': 'stabilityai',
        'leonardo_ai': 'leonardo',
        'leonardo ai': 'leonardo',
        'leonardoai': 'leonardo',
        'leonardo.ai': 'leonardo',
        'leonardo': 'leonardo',
        'jasper_ai': 'jasper',
        'jasper ai': 'jasper',
        'jasperai': 'jasper',
        'jasper.ai': 'jasper',
        'jasper': 'jasper',
        'copy_ai': 'copyai',
        'copy ai': 'copyai',
        'copyai': 'copyai',
        'copy.ai': 'copyai',
        'character_ai': 'characterai',
        'character ai': 'characterai',
        'characterai': 'characterai',
        'character.ai': 'characterai',
        'pi_ai': 'inflection',
        'pi ai': 'inflection',
        'piai': 'inflection',
        'pi.ai': 'inflection',
        'inflection': 'inflection',
        'claude_artifacts': 'anthropic',
        'claude artifacts': 'anthropic'
    };
    
    // Try to find icon mapping from tool id, name, or domain
    let iconMapping = null;
    
    // Try by ID first
    if (tool.id) {
        const idLower = tool.id.toLowerCase();
        if (iconMap[idLower]) {
            iconMapping = iconMap[idLower];
            console.log(`[ICON MAP] Found icon for ${tool.name} (ID: ${tool.id}) -> ${iconMapping}`);
        } else {
            // Try with underscores replaced
            const idNoUnderscore = idLower.replace(/_/g, ' ');
            if (iconMap[idNoUnderscore]) {
                iconMapping = iconMap[idNoUnderscore];
                console.log(`[ICON MAP] Found icon for ${tool.name} (ID variant: ${idNoUnderscore})`);
            }
        }
    }
    
    // Try by domain if not found
    if (!iconMapping && tool.domain) {
        const domainLower = tool.domain.toLowerCase();
        if (iconMap[domainLower]) {
            iconMapping = iconMap[domainLower];
        } else {
            // Extract base domain (e.g., "github.com" -> "github")
            const domainParts = domainLower.split('.');
            if (domainParts.length > 0) {
                const baseDomain = domainParts[0];
                if (iconMap[baseDomain]) {
                    iconMapping = iconMap[baseDomain];
                }
            }
        }
    }
    
    // Try by name if not found
    if (!iconMapping && tool.name) {
        const nameLower = tool.name.toLowerCase().trim();
        // Try exact match
        if (iconMap[nameLower]) {
            iconMapping = iconMap[nameLower];
        } else {
            // Try without spaces
            const nameNoSpaces = nameLower.replace(/\s+/g, '');
            if (iconMap[nameNoSpaces]) {
                iconMapping = iconMap[nameNoSpaces];
            } else {
                // Try with underscores
                const nameUnderscore = nameLower.replace(/\s+/g, '_');
                if (iconMap[nameUnderscore]) {
                    iconMapping = iconMap[nameUnderscore];
                } else {
                    // Try removing common suffixes
                    const nameNoSuffix = nameLower.replace(/\s+(ai|ai|io|com|app|tool|platform)$/i, '');
                    if (iconMap[nameNoSuffix]) {
                        iconMapping = iconMap[nameNoSuffix];
                    }
                }
            }
        }
    }
    
    if (iconMapping) {
        // Handle both string format (legacy) and object format (new)
        let iconSet = 'simple-icons';
        let iconName = null;
        
        console.log(`[ICON DEBUG] iconMapping type: ${typeof iconMapping}, value:`, iconMapping, 'for tool:', tool.name);
        
        if (typeof iconMapping === 'string') {
            // Legacy format: just the icon name
            iconName = iconMapping.trim();
            console.log(`[ICON DEBUG] Using string format, iconName: "${iconName}"`);
        } else if (typeof iconMapping === 'object' && iconMapping !== null) {
            // New format: { iconSet: 'simple-icons', iconName: 'icon-name' }
            iconSet = (iconMapping.iconSet || 'simple-icons').trim();
            iconName = iconMapping.iconName ? String(iconMapping.iconName).trim() : null;
            console.log(`[ICON DEBUG] Using object format, iconSet: "${iconSet}", iconName: "${iconName}"`);
        } else {
            console.error(`[ICON ERROR] Unexpected iconMapping type for ${tool.name}:`, typeof iconMapping, iconMapping);
            return null;
        }
        
        // Validate iconName before using it
        if (!iconName || typeof iconName !== 'string' || iconName.length === 0) {
            console.warn(`[ICON ERROR] Invalid iconName for ${tool.name}:`, iconName, 'iconMapping:', iconMapping);
            return null;
        }
        
        // Check for template literal issues or invalid characters
        if (iconName.includes('{') || iconName.includes('}') || iconName.includes(' ') || iconName.includes('/')) {
            console.error(`[ICON ERROR] iconName contains invalid characters for ${tool.name}:`, iconName);
            return null;
        }
        
        // Ensure iconSet is valid
        if (!iconSet || typeof iconSet !== 'string' || iconSet.length === 0) {
            iconSet = 'simple-icons';
        }
        
        // Use Iconify API - more reliable and supports multiple icon sets
        // Format: https://api.iconify.design/{icon-set}/{icon-name}.svg
        // Note: Iconify API doesn't support color parameter in query string
        // For Simple Icons, use the Simple Icons CDN which supports color
        if (iconSet === 'simple-icons') {
            // Use Simple Icons CDN - correct format from jsDelivr
            // Format: https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/{icon-name}.svg
            const iconUrl = `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${iconName}.svg`;
            console.log(`[ICON URL] Generated URL for ${tool.name}: ${iconUrl}`);
            return iconUrl;
        } else {
            // Use Iconify API for other icon sets
            const iconUrl = `https://api.iconify.design/${iconSet}/${iconName}.svg`;
            console.log(`[ICON URL] Generated URL for ${tool.name}: ${iconUrl}`);
            return iconUrl;
        }
    }
    
    // If no Simple Icons mapping found, try alternative icon sources
    console.log(`[ICON MAP] No Simple Icon found for ${tool.name}, trying alternative sources...`);
    
    // ALWAYS try alternative icon sources based on domain or tool name
    if (tool.domain) {
        const domain = tool.domain.toLowerCase().trim();
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        
        // Option 1: Clearbit Logo API (high quality, reliable)
        // Format: https://logo.clearbit.com/{domain}
        const clearbitUrl = `https://logo.clearbit.com/${cleanDomain}`;
        console.log(`[ICON ALT] Using Clearbit Logo API for ${tool.name}: ${clearbitUrl}`);
        return clearbitUrl;
    }
    
    // If no domain, try to construct domain from tool name
    if (tool.name) {
        const toolNameLower = tool.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        // Try common domain patterns
        const possibleDomains = [
            `${toolNameLower}.com`,
            `${toolNameLower}.io`,
            `${toolNameLower}.ai`
        ];
        
        for (const possibleDomain of possibleDomains) {
            const clearbitUrl = `https://logo.clearbit.com/${possibleDomain}`;
            console.log(`[ICON ALT] Trying constructed domain for ${tool.name}: ${clearbitUrl}`);
            // Return first attempt - fallback will handle if it fails
            return clearbitUrl;
        }
    }
    
    // Return null to use Material Symbols fallback
    console.log(`[ICON MAP] No alternative icon source available for ${tool.name} (ID: ${tool.id || 'N/A'}, Domain: ${tool.domain || 'N/A'})`);
    return null;
}

/**
 * Get alternative icon URLs for fallback
 * Returns array of URLs to try in order
 */
function getAlternativeIconUrls(tool) {
    const urls = [];
    
    // Get domain from tool.domain or construct from tool name/id
    let cleanDomain = null;
    
    if (tool.domain) {
        const domain = tool.domain.toLowerCase().trim();
        cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    } else {
        // Construct domain from tool name or ID for common tools
        const nameToDomain = {
            'midjourney': 'midjourney.com',
            'descript': 'descript.com',
            'leonardo': 'leonardo.ai',
            'luma': 'lumalabs.ai',
            'runway': 'runwayml.com',
            'runwayml': 'runwayml.com',
            'jasper': 'jasper.ai',
            'otter': 'otter.ai',
            'pika': 'pika.art',
            'spline': 'spline.design',
            'surfer': 'surferseo.com',
            'copyai': 'copy.ai',
            'meshy': 'meshy.ai',
            'murf': 'murf.ai',
            'stabilityai': 'stability.ai',
            'stable_diffusion': 'stability.ai',
            'playht': 'play.ht',
            'heygen': 'heygen.com',
            'writesonic': 'writesonic.com',
            'synthesia': 'synthesia.io',
            'tabnine': 'tabnine.com',
            'fathom': 'fathom.video',
            'grammarly': 'grammarly.com',
            'notion_ai': 'notion.so',
            'notion': 'notion.so',
            'codeium': 'codeium.com',
            'replit': 'replit.com',
            'figma': 'figma.com',
            'canva': 'canva.com',
            'zapier': 'zapier.com',
            'make': 'make.com',
            'cursor': 'cursor.sh',
            'elevenlabs': 'elevenlabs.io',
            'blackmagic': 'blackmagicdesign.com',
            'blackmagicdesign': 'blackmagicdesign.com',
            'adobe_firefly': 'adobe.com',
            'adobe': 'adobe.com',
            'dalle': 'openai.com',
            'chatgpt': 'openai.com',
            'claude': 'anthropic.com',
            'anthropic': 'anthropic.com',
            'github_copilot': 'github.com',
            'github': 'github.com',
            'gemini': 'google.com',
            'google': 'google.com',
            'copilot': 'microsoft.com',
            'microsoft': 'microsoft.com',
            'perplexity': 'perplexity.ai',
            'openai': 'openai.com',
            // New tools
            'bolt': 'stackblitz.com',
            'v0': 'v0.dev',
            'lovable': 'lovable.dev',
            'devin': 'cognition.ai',
            'sweep': 'sweep.dev',
            'sourcegraph': 'sourcegraph.com',
            'continue': 'continue.dev',
            'autogpt': 'github.com',
            'crewai': 'crewai.com',
            'langgraph': 'langchain.com',
            'openhands': 'openhands.dev',
            'ideogram': 'ideogram.ai',
            'krea': 'krea.ai',
            'playground': 'playgroundai.com',
            'nightcafe': 'nightcafe.studio',
            'fooocus': 'github.com',
            'veed': 'veed.io',
            'elicit': 'elicit.com',
            'consensus': 'consensus.app',
            'scite': 'scite.ai',
            'sudowrite': 'sudowrite.com',
            'frase': 'frase.io',
            'tome': 'tome.app',
            'mem': 'mem.ai',
            'zapier_ai': 'zapier.com',
            'n8n': 'n8n.io',
            'alphasense': 'alphasense.com',
            'tickeron': 'tickeron.com',
            'toolify': 'toolify.ai',
            'taaft': 'theresanaiforthat.com',
            'theres an ai for that': 'theresanaiforthat.com'
        };
        
        const toolId = (tool.id || '').toLowerCase();
        const toolName = (tool.name || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        
        cleanDomain = nameToDomain[toolId] || nameToDomain[toolName] || null;
        
        // If still no domain, try constructing from name
        if (!cleanDomain && tool.name) {
            const nameLower = tool.name.toLowerCase()
                .replace(/\s+/g, '')
                .replace(/[^a-z0-9]/g, '');
            if (nameLower.length > 0) {
                // Try common TLDs - we'll use the first one, fallback will try others
                cleanDomain = `${nameLower}.com`;
            }
        }
    }
    
    if (cleanDomain) {
        // Option 1: Clearbit Logo API (high quality, CORS-friendly)
        urls.push(`https://logo.clearbit.com/${cleanDomain}`);
        
        // Option 2: Icon Horse (CORS-friendly favicon service)
        urls.push(`https://icon.horse/icon/${cleanDomain}`);
    }
    
    return urls;
}

/**
 * Create an icon element (img with fallback to Material Symbols)
 */
function createToolIcon(tool, className = '', size = 'medium') {
    const iconUrl = getToolIconUrl(tool);
    const iconSymbol = tool.icon || 'smart_toy';
    const alternativeUrls = getAlternativeIconUrls(tool);
    let currentUrlIndex = 0;
    
    if (iconUrl || alternativeUrls.length > 0) {
        const img = document.createElement('img');
        const urlsToTry = iconUrl ? [iconUrl, ...alternativeUrls] : alternativeUrls;
        img.src = urlsToTry[0];
        img.alt = `${tool.name} logo`;
        img.className = className;
        img.style.width = size === 'small' ? '24px' : size === 'large' ? '48px' : '32px';
        img.style.height = size === 'small' ? '24px' : size === 'large' ? '48px' : '32px';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '4px';
        
        // Try alternative URLs if current one fails
        img.onerror = function() {
            // Prevent infinite retry loops
            const retryCount = parseInt(this.dataset.retryCount || '0');
            
            if (retryCount < urlsToTry.length - 1) {
                const nextIndex = retryCount + 1;
                this.dataset.retryCount = nextIndex;
                console.log(`[ICON FALLBACK] Trying alternative URL ${nextIndex + 1}/${urlsToTry.length} for ${tool.name}: ${urlsToTry[nextIndex]}`);
                // Temporarily remove error handler to allow retry
                const currentHandler = this.onerror;
                this.onerror = null;
                this.src = urlsToTry[nextIndex];
                // Re-attach after image loads or fails
                setTimeout(() => {
                    this.onerror = currentHandler;
                }, 50);
            } else {
                // All URLs failed, use Material Symbols fallback
                console.warn(`[ICON ERROR] All ${urlsToTry.length} icon sources failed for ${tool.name}, using Material Symbols fallback`);
                this.style.display = 'none';
                const fallback = document.createElement('span');
                fallback.className = `material-symbols-outlined ${className}`;
                fallback.textContent = iconSymbol;
                fallback.style.fontSize = size === 'small' ? '24px' : size === 'large' ? '48px' : '32px';
                if (this.parentNode) {
                    this.parentNode.appendChild(fallback);
                }
            }
        };
        
        // Track successful loads
        img.onload = function() {
            console.log(`[ICON SUCCESS] Icon loaded for ${tool.name} from ${this.src}`);
        };
        
        return img;
    } else {
        // Use Material Symbols as fallback
        const span = document.createElement('span');
        span.className = `material-symbols-outlined ${className}`;
        span.textContent = iconSymbol;
        return span;
    }
}

/**
 * Get icon HTML string (for innerHTML usage)
 * Uses multiple icon sources with proper fallback handling
 */
function getToolIconHtml(tool, className = '', size = 'medium') {
    if (!tool) {
        const iconSymbol = 'smart_toy';
        return `<span class="material-symbols-outlined ${className}">${iconSymbol}</span>`;
    }
    
    const iconSymbol = tool.icon || 'smart_toy';
    const sizePx = size === 'small' ? '24px' : size === 'large' ? '80px' : '48px';
    
    // Try to get primary icon URL (Simple Icons or Iconify)
    const iconUrl = getToolIconUrl(tool);
    const alternativeUrls = getAlternativeIconUrls(tool);
    const urlsToTry = iconUrl ? [iconUrl, ...alternativeUrls] : alternativeUrls;
    
    if (urlsToTry.length > 0) {
        // Create a unique ID for this icon to handle fallback
        const iconId = `icon-${(tool.id || Math.random().toString(36).substr(2, 9)).replace(/[^a-zA-Z0-9]/g, '-')}`;
        const primaryUrl = urlsToTry[0];
        const fallbackUrls = urlsToTry.slice(1);
        
        console.log(`[ICON] Using icon source for ${tool.name}: ${primaryUrl}`);
        
        // Build fallback URL list as JSON for JavaScript
        const fallbackUrlsJson = JSON.stringify(fallbackUrls);
        
        return `
            <img id="${iconId}" 
                 src="${primaryUrl}" 
                 alt="${escapeHtml(tool.name)} logo" 
                 class="${className} tool-logo-img"
                 style="width: ${sizePx}; height: ${sizePx}; object-fit: contain; border-radius: 4px; display: block; max-width: 100%; max-height: 100%; background: transparent;"
                 loading="lazy"
                 crossorigin="anonymous"
                 data-fallback-urls='${fallbackUrlsJson}'
                 data-current-index="0"
                 onerror="(function(img) { var fallbacks = JSON.parse(img.getAttribute('data-fallback-urls') || '[]'); var index = parseInt(img.getAttribute('data-current-index') || '0') + 1; if (index < fallbacks.length) { console.log('[ICON FALLBACK] Trying alternative URL ' + (index + 1) + '/' + fallbacks.length + ' for ${escapeHtml(tool.name)}'); img.src = fallbacks[index]; img.setAttribute('data-current-index', index); } else { console.warn('[ICON ERROR] All icon sources failed for ${escapeHtml(tool.name)} - using fallback'); img.style.display='none'; var fallback=document.getElementById('${iconId}-fallback'); if(fallback) { fallback.style.display='inline-block'; fallback.classList.add('show'); } else { var newFallback=document.createElement('span'); newFallback.className='material-symbols-outlined ${className} tool-logo-fallback show'; newFallback.style.cssText='font-size: ${sizePx}; color: white; display: inline-block;'; newFallback.textContent='${iconSymbol}'; img.parentNode.appendChild(newFallback); } } })(this);"
                 onload="console.log('[ICON SUCCESS] Icon loaded for ${escapeHtml(tool.name)}')">
            <span id="${iconId}-fallback" class="material-symbols-outlined ${className} tool-logo-fallback" style="display: none; font-size: ${sizePx}; color: white;">${iconSymbol}</span>
        `;
    } else {
        // No icon source available, use Material Symbols directly
        console.log(`[ICON] No icon source found for ${tool.name}, using Material Symbols: ${iconSymbol}`);
        return `<span class="material-symbols-outlined ${className}" style="font-size: ${sizePx}; color: white;">${iconSymbol}</span>`;
    }
}

// ============================================
// RECOMMENDATION SYSTEM
// ============================================

let recommendationData = null;
let quickAnswers = {};
let guidedAnswers = {};

async function initializeRecommendationSystem() {
    console.log('[RECOMMENDATIONS] Initializing recommendation system...');
    
    try {
        const data = await loadData();
        if (!data) {
            console.error('[RECOMMENDATIONS] No data available');
            showErrorMessage('Failed to load tools data. Please refresh the page.');
            return;
        }

        if (!data.tools || data.tools.length === 0) {
            console.error('[RECOMMENDATIONS] No tools found in data');
            showErrorMessage('No tools found. Please check the data file.');
            return;
        }

        recommendationData = data;
        console.log(`[RECOMMENDATIONS] Loaded ${data.tools.length} tools`);

        // Mode selection
        const modeCards = document.querySelectorAll('.mode-card');
        if (modeCards.length === 0) {
            console.error('[RECOMMENDATIONS] Mode cards not found');
            return;
        }
        
        modeCards.forEach(card => {
            card.addEventListener('click', function() {
                const mode = this.dataset.mode;
                console.log(`[RECOMMENDATIONS] Mode selected: ${mode}`);
                showMode(mode);
            });
        });

        // Quick mode handlers
        setupQuickMode();
        
        // Guided mode handlers
        setupGuidedMode();

        // Restart button
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', function() {
                resetRecommendationFlow();
            });
        }

        console.log('[RECOMMENDATIONS] System initialized successfully');
    } catch (error) {
        console.error('[RECOMMENDATIONS] Error initializing:', error);
        showErrorMessage('An error occurred. Please refresh the page.');
    }
}

function showErrorMessage(message) {
    const main = document.querySelector('.app-main');
    if (main) {
        main.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <span class="material-symbols-outlined" style="font-size: 3rem; color: #ef4444; margin-bottom: 1rem;">error</span>
                <p style="color: #ef4444; font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">Error</p>
                <p style="color: var(--text-secondary);">${message}</p>
                <a href="index.html" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--accent-color); color: white; border-radius: var(--radius-lg); text-decoration: none; font-weight: 600;">Go Back Home</a>
            </div>
        `;
    }
}

function showMode(mode) {
    const modeSelection = document.getElementById('modeSelection');
    if (!modeSelection) {
        console.error('[RECOMMENDATIONS] Mode selection element not found');
        return;
    }
    
    modeSelection.style.display = 'none';
    
    if (mode === 'quick') {
        const quickMode = document.getElementById('quickMode');
        const quickStep1 = document.getElementById('quickStep1');
        if (quickMode && quickStep1) {
            quickMode.style.display = 'block';
            quickStep1.style.display = 'block';
            console.log('[RECOMMENDATIONS] Quick mode activated');
        } else {
            console.error('[RECOMMENDATIONS] Quick mode elements not found');
        }
    } else if (mode === 'guided') {
        const guidedMode = document.getElementById('guidedMode');
        const guidedStep1 = document.getElementById('guidedStep1');
        if (guidedMode && guidedStep1) {
            guidedMode.style.display = 'block';
            guidedStep1.style.display = 'block';
            console.log('[RECOMMENDATIONS] Guided mode activated');
        } else {
            console.error('[RECOMMENDATIONS] Guided mode elements not found');
        }
    }
}

function setupQuickMode() {
    // Step 1: User type
    const step1Cards = document.querySelectorAll('#quickStep1 .option-card');
    if (step1Cards.length === 0) {
        console.warn('[RECOMMENDATIONS] Quick step 1 cards not found');
        return;
    }
    
    step1Cards.forEach(card => {
        card.addEventListener('click', function() {
            step1Cards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            quickAnswers.userType = this.dataset.value;
            console.log(`[RECOMMENDATIONS] User type selected: ${quickAnswers.userType}`);
            
            setTimeout(() => {
                const step1 = document.getElementById('quickStep1');
                const step2 = document.getElementById('quickStep2');
                if (step1) step1.style.display = 'none';
                if (step2) step2.style.display = 'block';
            }, 300);
        });
    });

    // Step 2: Use cases (multi-select)
    const step2Cards = document.querySelectorAll('#quickStep2 .option-card');
    const getRecommendationsBtn = document.getElementById('quickGetRecommendations');
    
    if (step2Cards.length === 0) {
        console.warn('[RECOMMENDATIONS] Quick step 2 cards not found');
    } else {
        step2Cards.forEach(card => {
            card.addEventListener('click', function() {
                this.classList.toggle('selected');
                updateQuickUseCases();
            });
        });
    }

    if (getRecommendationsBtn) {
        getRecommendationsBtn.addEventListener('click', function() {
            if (quickAnswers.useCases && quickAnswers.useCases.length > 0) {
                console.log('[RECOMMENDATIONS] Generating quick recommendations...');
                generateQuickRecommendations();
            } else {
                console.warn('[RECOMMENDATIONS] No use cases selected');
            }
        });
    } else {
        console.warn('[RECOMMENDATIONS] Quick get recommendations button not found');
    }
}

function updateQuickUseCases() {
    const selected = document.querySelectorAll('#quickStep2 .option-card.selected');
    quickAnswers.useCases = Array.from(selected).map(card => card.dataset.value);
    
    const getRecommendationsBtn = document.getElementById('quickGetRecommendations');
    if (getRecommendationsBtn) {
        getRecommendationsBtn.style.display = quickAnswers.useCases.length > 0 ? 'block' : 'none';
    }
}

function setupGuidedMode() {
    let currentStep = 1;
    const maxSteps = 5;

    // Step 1: Organization type
    setupStepButtons('#guidedStep1 .option-card', (value) => {
        guidedAnswers.orgType = value;
        nextGuidedStep(2);
    });

    // Step 2: Industry
    setupStepButtons('#guidedStep2 .option-card', (value) => {
        guidedAnswers.industry = value;
        nextGuidedStep(3);
    });

    // Step 3: Team needs (multi-select)
    const step3Cards = document.querySelectorAll('#guidedStep3 .option-card');
    const continueBtn3 = document.getElementById('guidedContinue3');
    
    step3Cards.forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('selected');
            updateGuidedNeeds();
        });
    });

    if (continueBtn3) {
        continueBtn3.addEventListener('click', function() {
            if (guidedAnswers.needs && guidedAnswers.needs.length > 0) {
                nextGuidedStep(4);
            }
        });
    }

    // Step 4: Budget
    setupStepButtons('#guidedStep4 .option-card', (value) => {
        guidedAnswers.budget = value;
        nextGuidedStep(5);
    });

    // Step 5: AI maturity
    setupStepButtons('#guidedStep5 .option-card', (value) => {
        guidedAnswers.aiLevel = value;
        const getRecommendationsBtn = document.getElementById('guidedGetRecommendations');
        if (getRecommendationsBtn) {
            getRecommendationsBtn.style.display = 'block';
        }
    });

    const getRecommendationsBtn = document.getElementById('guidedGetRecommendations');
    if (getRecommendationsBtn) {
        getRecommendationsBtn.addEventListener('click', function() {
            generateGuidedRecommendations();
        });
    }
}

function setupStepButtons(selector, callback) {
    const cards = document.querySelectorAll(selector);
    cards.forEach(card => {
        card.addEventListener('click', function() {
            cards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            callback(this.dataset.value);
        });
    });
}

function updateGuidedNeeds() {
    const selected = document.querySelectorAll('#guidedStep3 .option-card.selected');
    guidedAnswers.needs = Array.from(selected).map(card => card.dataset.value);
    
    const continueBtn = document.getElementById('guidedContinue3');
    if (continueBtn) {
        continueBtn.style.display = guidedAnswers.needs.length > 0 ? 'block' : 'none';
    }
}

function nextGuidedStep(stepNum) {
    for (let i = 1; i <= 5; i++) {
        const step = document.getElementById(`guidedStep${i}`);
        if (step) {
            step.style.display = i === stepNum ? 'block' : 'none';
        }
    }
}

function generateQuickRecommendations() {
    if (!recommendationData) return;

    const userType = quickAnswers.userType;
    const useCases = quickAnswers.useCases || [];

    // Map user types to recommendation metadata
    const userTypeMap = {
        'personal': 'personal',
        'startup': 'startup',
        'enterprise': 'enterprise',
        'developer': 'startup',
        'creator': 'personal',
        'analyst': 'personal'
    };

    // Map use cases to categories - keep both original and mapped for better matching
    const useCaseMap = {
        'writing': 'writing',
        'coding': 'coding',
        'design': 'image',
        'video': 'video',
        'automation': 'productivity',
        'research': 'chatbots',
        'marketing': 'seo',
        'support': 'chatbots'
    };

    const mappedUserType = userTypeMap[userType] || 'personal';
    // Keep both original use cases and mapped categories for better matching
    const mappedUseCases = useCases.map(uc => useCaseMap[uc] || uc).filter(Boolean);
    const originalUseCases = [...useCases]; // Keep original for better matching
    const allUseCases = [...new Set([...mappedUseCases, ...originalUseCases])]; // Combine both
    const primaryCategory = mappedUseCases.length > 0 ? mappedUseCases[0] : null;
    const budget = 'free'; // Default for quick mode

    // Score-based ranking system - NO FILTERING
    const scoredTools = recommendationData.tools
        .filter(tool => tool && tool.id && tool.name) // Only filter invalid tools
        .map(tool => ({
            tool,
            score: scoreTool(tool, {
                userType: mappedUserType,
                useCases: mappedUseCases,
                budget: budget,
                primaryCategory: primaryCategory
            })
        }))
        .filter(item => item.score > 0) // Only exclude zero-score tools
        .sort((a, b) => b.score - a.score);

    // Log scores for debugging
    console.log('[RECOMMENDATIONS] Top 10 scored tools:');
    scoredTools.slice(0, 10).forEach(item => {
        console.log(`  ${item.tool.name}: ${item.score.toFixed(2)}`);
    });

    // Get top 5 tools
    const topTools = scoredTools.slice(0, 5).map(item => item.tool);

    // If we have less than 5 tools or scores are too low, add general tools
    if (topTools.length < 5 || (scoredTools.length > 0 && scoredTools[0].score < 5)) {
        const generalTools = ['chatgpt', 'claude', 'perplexity'];
        generalTools.forEach(toolId => {
            const tool = recommendationData.tools.find(t => t && t.id === toolId);
            if (tool && !topTools.find(t => t.id === toolId)) {
                topTools.push(tool);
            }
        });
        // Re-score and re-sort
        const rescored = topTools.map(tool => ({
            tool,
            score: scoreTool(tool, {
                userType: mappedUserType,
                useCases: allUseCases, // Use combined use cases
                budget: budget,
                primaryCategory: primaryCategory
            })
        })).sort((a, b) => b.score - a.score);
        topTools.length = 0;
        topTools.push(...rescored.slice(0, 5).map(item => item.tool));
    }

    // Separate into primary and optional
    const primaryTools = topTools.slice(0, 3);
    const optionalTools = topTools.slice(3);

    // Removed: Avoid tools section - no longer showing tools to avoid
    const avoidTools = [];

    displayRecommendations(primaryTools, optionalTools, avoidTools, mappedUserType);
}

function generateGuidedRecommendations() {
    if (!recommendationData) return;

    const orgType = guidedAnswers.orgType;
    const industry = guidedAnswers.industry;
    const needs = guidedAnswers.needs || [];
    const budget = guidedAnswers.budget || 'free';
    const aiLevel = guidedAnswers.aiLevel || 'beginner';

    // Map organization types
    const orgTypeMap = {
        'individual': 'personal',
        'startup-0-10': 'startup',
        'startup-10-50': 'startup',
        'sme-50-200': 'enterprise',
        'enterprise-200': 'enterprise'
    };

    // Map needs to categories/useCases
    const needsMap = {
        'coding': 'coding',
        'writing': 'writing',
        'design': 'image',
        'support': 'chatbots',
        'documentation': 'writing',
        'sales': 'productivity',
        'automation': 'productivity',
        'analysis': 'productivity',
        'video': 'video'
    };

    const mappedOrgType = orgTypeMap[orgType] || 'personal';
    const mappedNeeds = needs.map(n => needsMap[n] || n).filter(Boolean);
    const originalNeeds = [...needs]; // Keep original for better matching
    const allNeeds = [...new Set([...mappedNeeds, ...originalNeeds])]; // Combine both
    const primaryCategory = mappedNeeds.length > 0 ? mappedNeeds[0] : null;

    // Score-based ranking system - NO FILTERING
    const scoredTools = recommendationData.tools
        .filter(tool => tool && tool.id && tool.name) // Only filter invalid tools
        .map(tool => ({
            tool,
            score: scoreTool(tool, {
                userType: mappedOrgType,
                useCases: allNeeds, // Use combined needs for better matching
                budget: budget,
                primaryCategory: primaryCategory,
                industry: industry,
                aiLevel: aiLevel
            })
        }))
        .filter(item => item.score > 0) // Only exclude zero-score tools
        .sort((a, b) => b.score - a.score);

    // Log scores for debugging
    console.log('[RECOMMENDATIONS] Top 10 scored tools:');
    scoredTools.slice(0, 10).forEach(item => {
        console.log(`  ${item.tool.name}: ${item.score.toFixed(2)}`);
    });

    // Get top 5 tools
    let topTools = scoredTools.slice(0, 5).map(item => item.tool);

    // If we have less than 5 tools or scores are too low, add general tools
    if (topTools.length < 5 || (scoredTools.length > 0 && scoredTools[0].score < 5)) {
        const generalTools = ['chatgpt', 'claude', 'perplexity'];
        generalTools.forEach(toolId => {
            const tool = recommendationData.tools.find(t => t && t.id === toolId);
            if (tool && !topTools.find(t => t.id === toolId)) {
                topTools.push(tool);
            }
        });
        // Re-score and re-sort
        const rescored = topTools.map(tool => ({
            tool,
            score: scoreTool(tool, {
                userType: mappedOrgType,
                useCases: allNeeds, // Use combined needs
                budget: budget,
                primaryCategory: primaryCategory,
                industry: industry,
                aiLevel: aiLevel
            })
        })).sort((a, b) => b.score - a.score);
        topTools.length = 0;
        topTools.push(...rescored.slice(0, 5).map(item => item.tool));
    }

    // Separate into primary and optional
    const primaryTools = topTools.slice(0, 3);
    const optionalTools = topTools.slice(3);

    // Removed: Avoid tools section - no longer showing tools to avoid
    const avoidTools = [];

    displayRecommendations(primaryTools, optionalTools, avoidTools, mappedOrgType, budget);
}

/**
 * Score-based tool recommendation system
 * Uses weighted scoring instead of filtering
 */
function scoreTool(tool, criteria) {
    if (!tool || !tool.id || !tool.name) return 0;

    const {
        userType,
        useCases = [],
        budget = 'free',
        primaryCategory = null,
        industry = null,
        aiLevel = null
    } = criteria;

    let score = 0;

    // Base rating influence (rating × 1)
    score += (tool.rating || 0) * 1;

    // General tools boost (+4)
    const generalTools = ['chatgpt', 'claude', 'perplexity'];
    if (generalTools.includes(tool.id.toLowerCase())) {
        score += 4;
    }

    // UseCase match (+5) - Improved matching logic
    if (useCases.length > 0) {
        const toolUseCases = tool.recommendedFor?.useCases || [];
        const toolCategory = tool.category || '';
        const toolPurpose = (tool.purpose || tool.description || '').toLowerCase();
        const toolName = (tool.name || '').toLowerCase();
        
        // Check if any useCase matches
        const hasUseCaseMatch = useCases.some(uc => {
            const ucLower = uc.toLowerCase();
            
            // Direct match in recommendedFor.useCases
            if (toolUseCases.some(tuc => tuc.toLowerCase() === ucLower)) return true;
            
            // Category match (exact)
            if (toolCategory === uc) return true;
            
            // Category mapping (bidirectional)
            const categoryMap = {
                'coding': ['coding', 'development', 'code'],
                'writing': ['writing', 'content', 'text'],
                'image': ['design', 'image', 'graphic', 'art'],
                'video': ['video', 'editing', 'production'],
                'productivity': ['automation', 'productivity', 'workflow'],
                'chatbots': ['research', 'chatbot', 'assistant', 'ai'],
                'seo': ['marketing', 'seo', 'promotion']
            };
            
            // Check category mapping
            const categoryVariations = categoryMap[toolCategory] || [];
            if (categoryVariations.some(v => v === ucLower)) return true;
            
            // Reverse mapping - check if useCase maps to category
            for (const [cat, variations] of Object.entries(categoryMap)) {
                if (variations.includes(ucLower) && cat === toolCategory) return true;
            }
            
            // Text matching in purpose/description/name
            if (toolPurpose.includes(ucLower) || toolName.includes(ucLower)) return true;
            
            return false;
        });
        
        if (hasUseCaseMatch) {
            score += 5;
        }
    }

    // UserType match (+3)
    if (userType) {
        const toolUserTypes = tool.recommendedFor?.userType || [];
        if (toolUserTypes.includes(userType)) {
            score += 3;
        }
    }

    // Budget match (+2)
    if (budget) {
        const toolBudgets = tool.recommendedFor?.budget || [];
        const isFree = tool.pricingType === 'Free' || 
            (tool.pricing && tool.pricing.free && tool.pricing.free.available);
        const monthlyPrice = tool.pricing && tool.pricing.paid ? tool.pricing.paid.monthly : 0;
        
        if (toolBudgets.includes(budget)) {
            score += 2;
        } else {
            // Fallback budget matching
            if (budget === 'free' && isFree) {
                score += 2;
            } else if (budget === 'low' && monthlyPrice > 0 && monthlyPrice <= 20) {
                score += 2;
            } else if (budget === 'flexible' && monthlyPrice > 0) {
                score += 1; // Partial match
            }
        }
    }

    // Category match (+2)
    if (primaryCategory && tool.category === primaryCategory) {
        score += 2;
    }

    // Industry match (bonus)
    if (industry && tool.recommendedFor?.industries) {
        if (tool.recommendedFor.industries.includes(industry)) {
            score += 1;
        }
    }

    // AI Level match (bonus)
    if (aiLevel && tool.recommendedFor?.aiLevel) {
        if (tool.recommendedFor.aiLevel.includes(aiLevel)) {
            score += 1;
        }
    }

    return score;
}

function displayRecommendations(primaryTools, optionalTools, avoidTools, userType, budget) {
    console.log('[RECOMMENDATIONS] Displaying recommendations:', {
        primary: primaryTools.length,
        optional: optionalTools.length,
        avoid: avoidTools.length
    });

    // Hide flows, show results
    const quickMode = document.getElementById('quickMode');
    const guidedMode = document.getElementById('guidedMode');
    const resultsPanel = document.getElementById('resultsPanel');
    
    if (quickMode) quickMode.style.display = 'none';
    if (guidedMode) guidedMode.style.display = 'none';
    if (!resultsPanel) {
        console.error('[RECOMMENDATIONS] Results panel not found');
        return;
    }
    
    resultsPanel.style.display = 'block';
    
    // Scroll to results
    setTimeout(() => {
        resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // Render primary tools
    const primaryContainer = document.getElementById('primaryTools');
    if (primaryContainer) {
        primaryContainer.innerHTML = '';
        if (primaryTools.length === 0) {
            primaryContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No primary tools found. Please try different selections.</p>';
        } else {
            primaryTools.forEach(tool => {
                const card = createRecommendationCard(tool, 'primary');
                primaryContainer.appendChild(card);
            });
        }
    }

    // Render optional tools
    const optionalContainer = document.getElementById('optionalTools');
    const optionalSection = document.getElementById('optionalSection');
    if (optionalContainer && optionalSection) {
        if (optionalTools.length > 0) {
            optionalSection.style.display = 'block';
            optionalContainer.innerHTML = '';
            optionalTools.forEach(tool => {
                const card = createRecommendationCard(tool, 'optional');
                optionalContainer.appendChild(card);
            });
        } else {
            optionalSection.style.display = 'none';
        }
    }

    // Removed: Avoid tools section - no longer displaying tools to avoid

    // Render verdict
    const verdictContainer = document.getElementById('verdictContent');
    if (verdictContainer) {
        const verdict = generateVerdict(userType, budget, primaryTools);
        verdictContainer.innerHTML = `<p class="verdict-text">${verdict}</p>`;
    }
}

function createRecommendationCard(tool, type) {
    const card = document.createElement('a');
    card.href = `tool-detail.html?id=${tool.id}`;
    card.className = `recommendation-card ${type}`;

    const iconHtml = getToolIconHtml(tool, '', 'medium');
    const pricingType = tool.pricingType || (tool.pricing && tool.pricing.free && tool.pricing.free.available ? 'Freemium' : 'Paid');
    const isFree = pricingType === 'Free' || pricingType === 'Freemium';
    
    // Use white background for logos, accent color for icons
    const iconContainerStyle = tool.domain 
        ? 'background: white; border: 1px solid var(--border-light); padding: 0.5rem;'
        : 'background: var(--accent-color);';

    card.innerHTML = `
        <div class="recommendation-card-icon" style="${iconContainerStyle}">
            ${iconHtml}
        </div>
        <div class="recommendation-card-content">
            <h4 class="recommendation-card-name">${escapeHtml(tool.name)}</h4>
            <p class="recommendation-card-desc">${escapeHtml(tool.purpose || tool.description || tool.bestFor?.join(', ') || 'AI tool to help with your workflow')}</p>
            <div class="recommendation-card-meta">
                <span class="recommendation-rating"><span class="material-symbols-outlined" style="font-size: 0.875rem; vertical-align: middle;">star</span> ${tool.rating || 'N/A'}</span>
                <span class="recommendation-pricing ${isFree ? 'free' : 'paid'}">${pricingType}</span>
            </div>
        </div>
        <span class="material-symbols-outlined recommendation-arrow">arrow_forward</span>
    `;

    return card;
}

/**
 * Toggle favorite for a tool (global function for onclick)
 */
function toggleFavorite(toolId, buttonElement) {
    const isNowSaved = toggleToolSaved(toolId);
    const icon = buttonElement.querySelector('.material-symbols-outlined');
    
    if (isNowSaved) {
        buttonElement.classList.add('saved');
        icon.textContent = 'favorite';
        icon.style.color = '#ef4444';
    } else {
        buttonElement.classList.remove('saved');
        icon.textContent = 'favorite_border';
        icon.style.color = '';
    }
}

/**
 * Remove tool from saved list (specific function for saved page)
 */
function removeFromSaved(toolId, buttonElement) {
    console.log('[SAVED] Removing tool:', toolId);
    
    // Remove from saved
    toggleToolSaved(toolId);
    
    // Remove the item from DOM
    const item = buttonElement.closest('.saved-tool-item') || buttonElement.closest('.featured-item');
    if (item) {
        // Animate out
        item.style.transition = 'opacity 0.3s, transform 0.3s';
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            item.remove();
            
            // Check if list is now empty
            const savedContainer = document.getElementById('savedTools');
            if (savedContainer) {
                // Count remaining items (excluding empty state)
                const remainingItems = Array.from(savedContainer.children).filter(
                    child => !child.classList.contains('empty-state') && child.tagName !== 'SCRIPT'
                );
                
                console.log('[SAVED] Remaining items:', remainingItems.length);
                
                if (remainingItems.length === 0) {
                    savedContainer.innerHTML = `
                        <div class="empty-state">
                            <span class="material-symbols-outlined empty-icon">favorite_border</span>
                            <h3 class="empty-title">No saved tools yet</h3>
                            <p class="empty-description">Start exploring and save your favorite AI tools!</p>
                            <a href="index.html" class="empty-action">Browse Tools</a>
                        </div>
                    `;
                }
            }
        }, 300);
    } else {
        console.warn('[SAVED] Could not find item to remove');
    }
}

/**
 * Load saved tools page
 */
function loadSavedTools(data) {
    const savedTools = getSavedToolsData(data);
    const savedContainer = document.getElementById('savedTools');
    
    if (!savedContainer) {
        console.warn('[SAVED] Saved tools container not found');
        return;
    }
    
    console.log(`[SAVED] Loading ${savedTools.length} saved tools`);
    
    if (savedTools.length === 0) {
        savedContainer.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined empty-icon">favorite_border</span>
                <h3 class="empty-title">No saved tools yet</h3>
                <p class="empty-description">Start exploring and save your favorite AI tools!</p>
                <a href="index.html" class="empty-action">Browse Tools</a>
            </div>
        `;
        return;
    }
    
    savedContainer.innerHTML = '';
    
    savedTools.forEach((tool, index) => {
        try {
            const item = document.createElement('a');
            item.href = `tool-detail.html?id=${tool.id}`;
            item.className = 'featured-item saved-tool-item';
            item.style.position = 'relative';
            
            const categoryName = tool.categoryName || getCategoryName(data, tool.category) || 'AI Tool';
            const iconHtml = getToolIconHtml(tool, '', 'medium');
            const description = tool.purpose || tool.description || 'No description available';
            
            const pricingType = tool.pricingType || (tool.pricing && tool.pricing.free && tool.pricing.free.available ? 'Freemium' : 'Paid');
            const isFree = pricingType === 'Free' || pricingType === 'Freemium';
            const pricingBadge = isFree ? '<span class="tag" style="background: rgba(16, 185, 129, 0.1); color: #059669;">' + (pricingType === 'Free' ? 'Free' : 'Freemium') + '</span>' : '';
            
            const iconUrl = getToolIconUrl(tool);
            const iconContainerStyle = iconUrl 
                ? 'background: var(--bg-white); border: 1px solid var(--border-light); padding: 0.5rem;'
                : 'background: var(--accent-color);';
            
            // Create favorite button separately to avoid innerHTML issues
            const favoriteBtn = document.createElement('button');
            favoriteBtn.className = 'featured-item-favorite saved';
            favoriteBtn.innerHTML = '<span class="material-symbols-outlined">favorite</span>';
            favoriteBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                removeFromSaved(tool.id, this);
            };
            
            // Create icon container
            const iconDiv = document.createElement('div');
            iconDiv.className = 'featured-item-icon';
            iconDiv.style.cssText = iconContainerStyle;
            iconDiv.innerHTML = iconHtml;
            
            // Create content container
            const contentDiv = document.createElement('div');
            contentDiv.className = 'featured-item-content';
            contentDiv.innerHTML = `
                <div class="featured-item-header">
                    <h3 class="featured-item-name">${escapeHtml(tool.name)}</h3>
                    <div class="featured-item-rating">
                        <span class="material-symbols-outlined">star</span>
                        <span class="featured-item-rating-value">${tool.rating || 'N/A'}</span>
                    </div>
                </div>
                <p class="featured-item-description">${escapeHtml(description)}</p>
                <div class="featured-item-tags">
                    <span class="tag">${escapeHtml(categoryName)}</span>
                    ${pricingBadge}
                </div>
            `;
            
            // Create action button
            const actionBtn = document.createElement('button');
            actionBtn.className = 'featured-item-action';
            actionBtn.innerHTML = '<span class="material-symbols-outlined">arrow_forward</span>';
            actionBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `tool-detail.html?id=${tool.id}`;
            };
            
            // Append all elements
            item.appendChild(favoriteBtn);
            item.appendChild(iconDiv);
            item.appendChild(contentDiv);
            item.appendChild(actionBtn);
            
            savedContainer.appendChild(item);
        } catch (error) {
            console.error(`[SAVED] Error rendering tool at index ${index}:`, error);
        }
    });
}

function generateVerdict(userType, budget, primaryTools) {
    const hasFreeTools = primaryTools.some(t => 
        t.pricingType === 'Free' || (t.pricing && t.pricing.free && t.pricing.free.available)
    );

    if (userType === 'personal' && hasFreeTools) {
        return "❌ <strong>Not yet.</strong> Start with free tools. Upgrade only when you're using AI tools regularly (weekly or more).";
    } else if (userType === 'startup') {
        return "✅ <strong>Yes, but selectively.</strong> Pay for tools that directly impact revenue (like ChatGPT for content, Cursor for coding). Avoid expensive tools until you have 50+ customers.";
    } else if (userType === 'enterprise') {
        return "✅ <strong>Yes.</strong> For teams, paid tools provide better collaboration, support, and reliability. The ROI is clear for established organizations.";
    } else {
        return "<strong>Consider it.</strong> If you use AI tools regularly, paid plans offer better features and limits. Start with one tool and expand as needed.";
    }
}

function resetRecommendationFlow() {
    quickAnswers = {};
    guidedAnswers = {};
    
    // Reset all selections
    document.querySelectorAll('.option-card.selected').forEach(card => {
        card.classList.remove('selected');
    });

    // Hide all flows and results
    document.getElementById('quickMode').style.display = 'none';
    document.getElementById('guidedMode').style.display = 'none';
    document.getElementById('resultsPanel').style.display = 'none';
    
    // Show mode selection
    document.getElementById('modeSelection').style.display = 'block';
    
    // Reset step visibility
    document.getElementById('quickStep1').style.display = 'block';
    document.getElementById('quickStep2').style.display = 'none';
    for (let i = 1; i <= 5; i++) {
        const step = document.getElementById(`guidedStep${i}`);
        if (step) step.style.display = i === 1 ? 'block' : 'none';
    }
}

// ============================================
// PARTICLE ANIMATION FOR HEADLINE
// ============================================

function initParticleAnimation() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 80; // Increased for more visibility
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Particle class with reduced opacity
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 4 + 2; // Larger particles
            this.speedX = (Math.random() - 0.5) * 0.8;
            this.speedY = (Math.random() - 0.5) * 0.8;
            this.opacity = Math.random() * 0.2 + 0.3; // Reduced opacity (0.3-0.5)
            this.pulseSpeed = Math.random() * 0.02 + 0.01;
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.glowSize = this.size * 3; // Larger glow
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.pulsePhase += this.pulseSpeed;
            
            // Pulsing effect (reduced opacity)
            const pulse = Math.sin(this.pulsePhase) * 0.2 + 1;
            this.currentSize = this.size * pulse;
            this.currentOpacity = this.opacity * (0.7 + Math.sin(this.pulsePhase) * 0.1); // Reduced base opacity
            
            // Wrap around edges
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        
        draw() {
            // Draw glow effect (reduced opacity)
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.glowSize
            );
            gradient.addColorStop(0, `rgba(100, 116, 139, ${this.currentOpacity * 0.5})`);
            gradient.addColorStop(0.4, `rgba(148, 163, 184, ${this.currentOpacity * 0.3})`);
            gradient.addColorStop(0.7, `rgba(148, 163, 184, ${this.currentOpacity * 0.1})`);
            gradient.addColorStop(1, 'rgba(148, 163, 184, 0)');
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.glowSize, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Draw main particle (reduced opacity)
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(71, 85, 105, ${Math.min(this.currentOpacity, 0.4)})`;
            ctx.fill();
            
            // Draw outer ring for definition (reduced opacity)
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(100, 116, 139, ${this.currentOpacity * 0.3})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            
            // Draw inner highlight (reduced opacity)
            ctx.beginPath();
            ctx.arc(this.x - this.currentSize * 0.3, this.y - this.currentSize * 0.3, this.currentSize * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.currentOpacity * 0.2})`;
            ctx.fill();
        }
    }
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    // Draw enhanced connections
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    const opacity = (1 - distance / 150) * 0.25; // Reduced opacity
                    const gradient = ctx.createLinearGradient(
                        particles[i].x, particles[i].y,
                        particles[j].x, particles[j].y
                    );
                    gradient.addColorStop(0, `rgba(71, 85, 105, ${opacity})`);
                    gradient.addColorStop(0.5, `rgba(100, 116, 139, ${opacity})`);
                    gradient.addColorStop(1, `rgba(148, 163, 184, ${opacity})`);
                    
                    ctx.beginPath();
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 1.5; // Thicker lines
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw connections first (behind particles)
        drawConnections();
        
        // Draw particles on top
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

function initBackgroundParticleAnimation() {
    const canvas = document.getElementById('backgroundParticleCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 120; // More particles for full page background
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Particle class with reduced opacity
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 4 + 2; // Larger particles
            this.speedX = (Math.random() - 0.5) * 0.6;
            this.speedY = (Math.random() - 0.5) * 0.6;
            this.opacity = Math.random() * 0.2 + 0.3; // Reduced opacity (0.3-0.5)
            this.pulseSpeed = Math.random() * 0.015 + 0.008;
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.glowSize = this.size * 3; // Larger glow
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.pulsePhase += this.pulseSpeed;
            
            // Pulsing effect (reduced opacity)
            const pulse = Math.sin(this.pulsePhase) * 0.2 + 1;
            this.currentSize = this.size * pulse;
            this.currentOpacity = this.opacity * (0.7 + Math.sin(this.pulsePhase) * 0.1); // Reduced base opacity
            
            // Wrap around edges
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        
        draw() {
            // Draw glow effect (reduced opacity)
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.glowSize
            );
            gradient.addColorStop(0, `rgba(100, 116, 139, ${this.currentOpacity * 0.5})`);
            gradient.addColorStop(0.4, `rgba(148, 163, 184, ${this.currentOpacity * 0.3})`);
            gradient.addColorStop(0.7, `rgba(148, 163, 184, ${this.currentOpacity * 0.1})`);
            gradient.addColorStop(1, 'rgba(148, 163, 184, 0)');
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.glowSize, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Draw main particle (reduced opacity)
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(71, 85, 105, ${Math.min(this.currentOpacity, 0.4)})`;
            ctx.fill();
            
            // Draw outer ring for definition (reduced opacity)
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(100, 116, 139, ${this.currentOpacity * 0.3})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            
            // Draw inner highlight (reduced opacity)
            ctx.beginPath();
            ctx.arc(this.x - this.currentSize * 0.3, this.y - this.currentSize * 0.3, this.currentSize * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.currentOpacity * 0.2})`;
            ctx.fill();
        }
    }
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    // Draw enhanced connections
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    const opacity = (1 - distance / 150) * 0.25; // Reduced opacity
                    const gradient = ctx.createLinearGradient(
                        particles[i].x, particles[i].y,
                        particles[j].x, particles[j].y
                    );
                    gradient.addColorStop(0, `rgba(71, 85, 105, ${opacity})`);
                    gradient.addColorStop(0.5, `rgba(100, 116, 139, ${opacity})`);
                    gradient.addColorStop(1, `rgba(148, 163, 184, ${opacity})`);
                    
                    ctx.beginPath();
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 1.5; // Thicker lines
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw connections first (behind particles)
        drawConnections();
        
        // Draw particles on top
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
}
