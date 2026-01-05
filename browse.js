// ============================================
// BROWSE PAGE - NEW UX FLOW
// ============================================

let browseData = null;
let selectedUserType = null;
let selectedHelpWith = [];

// User type cards
const userTypeCards = [
    {
        icon: "school",
        title: "Student / Personal use",
        helper: "Learning, experimenting, daily tasks",
        value: "student",
        searchTerms: ["student", "education", "learning", "personal", "study", "homework"],
        categories: ["writing", "chatbots", "productivity"],
        preferredPricing: "free"
    },
    {
        icon: "rocket_launch",
        title: "Startup / Founder",
        helper: "Building products, MVPs, growth",
        value: "startup",
        searchTerms: ["startup", "business", "founder", "entrepreneur", "mvp", "growth"],
        categories: ["writing", "seo", "productivity", "chatbots", "coding"],
        preferredPricing: "freemium"
    },
    {
        icon: "business",
        title: "Business / Organisation",
        helper: "Teams, processes, scale",
        value: "business",
        searchTerms: ["business", "enterprise", "organization", "team", "corporate", "scale"],
        categories: ["productivity", "chatbots", "coding", "seo"],
        preferredPricing: "paid"
    },
    {
        icon: "code",
        title: "Developer / Tech team",
        helper: "Coding, automation, APIs",
        value: "developer",
        searchTerms: ["coding", "developer", "programming", "tech", "automation", "api", "code"],
        categories: ["coding", "productivity"],
        preferredPricing: "freemium"
    },
    {
        icon: "palette",
        title: "Creator / Designer",
        helper: "Content, design, video",
        value: "creator",
        searchTerms: ["design", "creative", "content", "video", "image", "visual", "art"],
        categories: ["image", "video", "3d", "writing"],
        preferredPricing: "freemium"
    },
    {
        icon: "school",
        title: "Teacher / Educator",
        helper: "Lesson planning, teaching, classroom",
        value: "teacher",
        searchTerms: ["teacher", "education", "teaching", "lesson", "curriculum", "classroom", "educator"],
        categories: ["education", "writing", "productivity"],
        preferredPricing: "freemium"
    }
];

// Help with options
const helpWithOptions = [
    {
        icon: "edit",
        text: "Writing",
        value: "writing",
        categories: ["writing", "chatbots"]
    },
    {
        icon: "terminal",
        text: "Coding",
        value: "coding",
        categories: ["coding"]
    },
    {
        icon: "palette",
        text: "Design",
        value: "design",
        categories: ["image", "3d"]
    },
    {
        icon: "movie",
        text: "Video",
        value: "video",
        categories: ["video"]
    },
    {
        icon: "bolt",
        text: "Automation",
        value: "automation",
        categories: ["productivity"]
    },
    {
        icon: "search",
        text: "Research",
        value: "research",
        categories: ["chatbots", "productivity"]
    },
    {
        icon: "school",
        text: "Teaching",
        value: "teaching",
        categories: ["education", "writing", "productivity"]
    }
];

// Question categories for normal browsing (keep existing)
const questionCategories = [
    {
        title: "For Professionals",
        icon: "work",
        color: "#3b82f6",
        questions: [
            {
                text: "Best AI tools for Students",
                searchTerms: ["student", "education", "learning", "study", "homework", "essay", "research"],
                categories: ["writing", "chatbots", "productivity"]
            },
            {
                text: "Best AI tools for Entrepreneurs",
                searchTerms: ["startup", "business", "entrepreneur", "founder", "marketing", "sales"],
                categories: ["writing", "seo", "productivity", "chatbots"]
            },
            {
                text: "Best AI tools for Teachers",
                searchTerms: ["teacher", "education", "lesson", "curriculum", "teaching", "classroom"],
                categories: ["education", "writing", "productivity", "chatbots"]
            },
            {
                text: "Best AI tools for Developers",
                searchTerms: ["coding", "programming", "developer", "code", "software", "app"],
                categories: ["coding", "productivity"]
            },
            {
                text: "Best AI tools for Writers",
                searchTerms: ["writing", "content", "blog", "article", "copywriting", "editor"],
                categories: ["writing", "chatbots"]
            },
            {
                text: "Best AI tools for Marketers",
                searchTerms: ["marketing", "seo", "social", "campaign", "advertising", "content"],
                categories: ["seo", "writing", "image", "video"]
            }
        ]
    },
    {
        title: "For Industries",
        icon: "business_center",
        color: "#2563eb",
        questions: [
            {
                text: "Best AI tools for Healthcare",
                searchTerms: ["healthcare", "medical", "hospital", "patient", "clinical", "health"],
                categories: ["chatbots", "productivity", "writing"]
            },
            {
                text: "Best AI tools for Education",
                searchTerms: ["education", "school", "university", "learning", "teaching", "student"],
                categories: ["education", "writing", "chatbots", "productivity", "video"]
            },
            {
                text: "Best AI tools for E-commerce",
                searchTerms: ["ecommerce", "online", "store", "retail", "shopping", "sales"],
                categories: ["seo", "image", "writing", "productivity"]
            }
        ]
    },
    {
        title: "For Specific Tasks",
        icon: "task_alt",
        color: "#10b981",
        questions: [
            {
                text: "Best AI tools for Content Creation",
                searchTerms: ["content", "create", "generate", "produce", "creative"],
                categories: ["writing", "image", "video"]
            },
            {
                text: "Best AI tools for Video Editing",
                searchTerms: ["video", "edit", "production", "film", "movie", "clip"],
                categories: ["video"]
            },
            {
                text: "Best AI tools for Image Generation",
                searchTerms: ["image", "generate", "art", "picture", "photo", "visual"],
                categories: ["image", "3d"]
            },
            {
                text: "Best AI tools for SEO",
                searchTerms: ["seo", "search", "optimization", "ranking", "keywords"],
                categories: ["seo", "writing"]
            }
        ]
    }
];

async function loadBrowsePage() {
    console.log('[BROWSE] Loading browse page...');
    
    const data = await loadData();
    if (!data) {
        console.error('[BROWSE] No data available');
        return;
    }

    browseData = data;
    
    // Ensure section is visible
    const whoAreYouSection = document.getElementById('whoAreYouSection');
    if (whoAreYouSection) {
        whoAreYouSection.style.display = 'block';
    }
    
    renderWhoAreYouCards();
    renderNormalBrowsing();
}

function renderWhoAreYouCards() {
    const container = document.getElementById('whoAreYouCards');
    if (!container) {
        console.error('[BROWSE] whoAreYouCards container not found');
        return;
    }

    console.log('[BROWSE] Rendering', userTypeCards.length, 'user type cards');
    container.innerHTML = '';

    userTypeCards.forEach(card => {
        const cardElement = document.createElement('button');
        cardElement.className = 'who-are-you-card';
        cardElement.innerHTML = `
            <div class="who-are-you-card-emoji"><span class="material-symbols-outlined">${card.icon || 'person'}</span></div>
            <div class="who-are-you-card-content">
                <h3 class="who-are-you-card-title">${card.title}</h3>
                <p class="who-are-you-card-helper">${card.helper}</p>
            </div>
            <span class="material-symbols-outlined who-are-you-card-arrow">arrow_forward</span>
        `;
        
        cardElement.addEventListener('click', function() {
            handleUserTypeClick(card);
        });
        
        container.appendChild(cardElement);
    });
}

function handleUserTypeClick(card) {
    console.log('[BROWSE] User type selected:', card.value);
    selectedUserType = card;
    
    // Smooth scroll to next section
    const helpWithSection = document.getElementById('helpWithSection');
    if (helpWithSection) {
        // Show help with section
        helpWithSection.style.display = 'block';
        
        // Render help with cards
        renderHelpWithCards();
        
        // Smooth scroll
        setTimeout(() => {
            helpWithSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

function renderHelpWithCards() {
    const container = document.getElementById('helpWithCards');
    if (!container) return;

    container.innerHTML = '';

    helpWithOptions.forEach(option => {
        const cardElement = document.createElement('button');
        cardElement.className = 'help-with-card';
        cardElement.dataset.value = option.value;
        cardElement.innerHTML = `
            <span class="help-with-card-emoji"><span class="material-symbols-outlined">${option.icon || 'help'}</span></span>
            <span class="help-with-card-text">${option.text}</span>
        `;
        
        cardElement.addEventListener('click', function() {
            this.classList.toggle('selected');
            updateSelectedHelpWith();
        });
        
        container.appendChild(cardElement);
    });
    
    // Add "Show recommendations" button
    const showRecsBtn = document.createElement('button');
    showRecsBtn.className = 'show-recommendations-btn';
    showRecsBtn.innerHTML = `
        <span>Show Recommendations</span>
        <span class="material-symbols-outlined">arrow_forward</span>
    `;
    showRecsBtn.addEventListener('click', function() {
        if (selectedHelpWith.length > 0) {
            showRecommendations();
        } else {
            // If nothing selected, show recommendations based on user type only
            showRecommendations();
        }
    });
    container.appendChild(showRecsBtn);
}

function updateSelectedHelpWith() {
    const selected = document.querySelectorAll('.help-with-card.selected');
    selectedHelpWith = Array.from(selected).map(card => {
        const option = helpWithOptions.find(opt => opt.value === card.dataset.value);
        return option;
    }).filter(Boolean);
    
    console.log('[BROWSE] Selected help with:', selectedHelpWith.map(h => h.value));
}

function showRecommendations() {
    if (!browseData || !selectedUserType) return;
    
    console.log('[BROWSE] Showing recommendations for:', selectedUserType.value);
    
    // Find matching tools
    const matchingTools = findMatchingToolsForUser(selectedUserType, selectedHelpWith, browseData);
    
    // Show recommendations section
    const recommendationsSection = document.getElementById('browseRecommendations');
    const recommendationsList = document.getElementById('browseRecommendationsList');
    const recommendationsTitle = document.getElementById('recommendationsTitle');
    
    if (!recommendationsSection || !recommendationsList) return;
    
    // Update title
    if (recommendationsTitle) {
        const helpText = selectedHelpWith.length > 0 
            ? selectedHelpWith.map(h => h.text).join(', ')
            : 'you';
        recommendationsTitle.textContent = `Recommended for ${helpText}`;
    }
    
    // Render tools
    recommendationsList.innerHTML = '';
    
    if (matchingTools.length === 0) {
        recommendationsList.innerHTML = `
            <div class="browse-no-results">
                <span class="material-symbols-outlined">search_off</span>
                <p>No tools found</p>
                <p class="browse-no-results-hint">Try selecting different options</p>
            </div>
        `;
    } else {
        matchingTools.forEach(tool => {
            const toolCard = createBrowseResultCard(tool, browseData);
            recommendationsList.appendChild(toolCard);
        });
    }
    
    // Show section and scroll
    recommendationsSection.style.display = 'block';
    setTimeout(() => {
        recommendationsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function findMatchingToolsForUser(userType, helpWith, data) {
    const searchTerms = [...userType.searchTerms];
    const categories = [...userType.categories];
    
    // Add help with categories
    if (helpWith.length > 0) {
        helpWith.forEach(h => {
            categories.push(...h.categories);
        });
    }
    
    // Remove duplicates
    const uniqueCategories = [...new Set(categories)];
    
    const matchingTools = data.tools.filter(tool => {
        if (!tool || !tool.id || !tool.name) return false;
        
        // Check category match
        const categoryMatch = uniqueCategories.length === 0 || 
            uniqueCategories.includes(tool.category);
        
        // Check search term match
        const name = (tool.name || '').toLowerCase();
        const purpose = (tool.purpose || '').toLowerCase();
        const description = (tool.description || '').toLowerCase();
        const categoryName = (tool.categoryName || '').toLowerCase();
        
        // Also check recommendedFor fields for better matching
        const toolIndustries = (tool.recommendedFor?.industries || []).map(i => i.toLowerCase());
        const toolUseCases = (tool.recommendedFor?.useCases || []).map(uc => uc.toLowerCase());
        
        const textMatch = searchTerms.some(term => {
            const termLower = term.toLowerCase();
            return name.includes(termLower) || 
                   purpose.includes(termLower) || 
                   description.includes(termLower) ||
                   categoryName.includes(termLower) ||
                   toolIndustries.some(ind => ind.includes(termLower)) ||
                   toolUseCases.some(uc => uc.includes(termLower));
        });
        
        // If category matches OR text matches, include the tool
        if (!categoryMatch && !textMatch) return false;
        
        // Check pricing preference
        const isFree = tool.pricingType === 'Free' || 
            (tool.pricing && tool.pricing.free && tool.pricing.free.available);
        const isFreemium = tool.pricingType === 'Freemium' || isFree;
        const isPaid = tool.pricingType === 'Paid' || 
            (tool.pricing && tool.pricing.paid);
        
        let pricingMatch = true;
        if (userType.preferredPricing === 'free' && !isFree) {
            pricingMatch = false;
        } else if (userType.preferredPricing === 'freemium' && !isFreemium && !isFree) {
            pricingMatch = false;
        }
        
        return pricingMatch;
    });
    
    // Sort by rating (highest first), then by pricing preference
    matchingTools.sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        
        // Prefer tools matching pricing preference
        const aIsFree = a.pricingType === 'Free' || (a.pricing && a.pricing.free && a.pricing.free.available);
        const bIsFree = b.pricingType === 'Free' || (b.pricing && b.pricing.free && b.pricing.free.available);
        
        if (userType.preferredPricing === 'free') {
            if (aIsFree && !bIsFree) return -1;
            if (!aIsFree && bIsFree) return 1;
        }
        
        return 0;
    });
    
    // Return top 10 results
    return matchingTools.slice(0, 10);
}

function createBrowseResultCard(tool, data) {
    const card = document.createElement('a');
    card.href = `tool-detail.html?id=${tool.id}`;
    card.className = 'browse-result-card';
    card.style.position = 'relative';
    
    const categoryName = tool.categoryName || getCategoryName(data, tool.category) || 'AI Tool';
    const iconHtml = getToolIconHtml(tool, '', 'medium');
    const pricingType = tool.pricingType || (tool.pricing && tool.pricing.free && tool.pricing.free.available ? 'Freemium' : 'Paid');
    const isFree = pricingType === 'Free' || pricingType === 'Freemium';
    
    const iconContainerStyle = tool.domain 
        ? 'background: white; border: 1px solid var(--border-light); padding: 0.5rem;'
        : 'background: var(--accent-color);';
    
    const isSaved = isToolSaved(tool.id);
    card.innerHTML = `
        <button class="featured-item-favorite ${isSaved ? 'saved' : ''}" onclick="event.preventDefault(); event.stopPropagation(); toggleFavorite('${tool.id}', this);">
            <span class="material-symbols-outlined">${isSaved ? 'favorite' : 'favorite_border'}</span>
        </button>
        <div class="browse-result-icon" style="${iconContainerStyle}">
            ${iconHtml}
        </div>
        <div class="browse-result-content">
            <div class="browse-result-header">
                <h3 class="browse-result-name">${escapeHtml(tool.name)}</h3>
                <div class="browse-result-badges">
                    <span class="browse-result-rating"><span class="material-symbols-outlined" style="font-size: 0.875rem; vertical-align: middle;">star</span> ${tool.rating || 'N/A'}</span>
                    <span class="browse-result-pricing ${isFree ? 'free' : 'paid'}">${pricingType}</span>
                </div>
            </div>
            <p class="browse-result-description">${escapeHtml(tool.purpose || tool.description || 'No description')}</p>
            <div class="browse-result-meta">
                <span class="browse-result-category">${escapeHtml(categoryName)}</span>
            </div>
        </div>
        <span class="material-symbols-outlined browse-result-arrow">arrow_forward</span>
    `;
    
    return card;
}

function renderNormalBrowsing() {
    const sectionsContainer = document.getElementById('browseSections');
    if (!sectionsContainer) return;

    sectionsContainer.innerHTML = '';

    questionCategories.forEach((category, catIndex) => {
        const section = document.createElement('div');
        section.className = 'browse-category-section';
        
        const header = document.createElement('div');
        header.className = 'browse-category-header';
        header.innerHTML = `
            <div class="browse-category-icon" style="background: linear-gradient(135deg, ${category.color}, ${adjustColor(category.color, -20)});">
                <span class="material-symbols-outlined">${category.icon}</span>
            </div>
            <h2 class="browse-category-title">${category.title}</h2>
        `;
        
        const questionsGrid = document.createElement('div');
        questionsGrid.className = 'browse-questions-grid';
        
        category.questions.forEach((question, qIndex) => {
            const questionCard = document.createElement('button');
            questionCard.className = 'browse-question-card';
            questionCard.innerHTML = `
                <span class="browse-question-text">${question.text}</span>
                <span class="material-symbols-outlined browse-question-arrow">arrow_forward</span>
            `;
            
            questionCard.addEventListener('click', function() {
                handleQuestionClick(question, category.title);
            });
            
            questionsGrid.appendChild(questionCard);
        });
        
        section.appendChild(header);
        section.appendChild(questionsGrid);
        sectionsContainer.appendChild(section);
    });
}

function handleQuestionClick(question, categoryTitle) {
    console.log('[BROWSE] Question clicked:', question.text);
    
    if (!browseData) {
        console.error('[BROWSE] No data available');
        return;
    }

    // Find matching tools
    const matchingTools = findMatchingTools(question, browseData);
    
    // Show results in recommendations section
    const recommendationsSection = document.getElementById('browseRecommendations');
    const recommendationsList = document.getElementById('browseRecommendationsList');
    const recommendationsTitle = document.getElementById('recommendationsTitle');
    
    if (recommendationsSection && recommendationsList) {
        if (recommendationsTitle) {
            recommendationsTitle.textContent = question.text;
        }
        
        recommendationsList.innerHTML = '';
        
        if (matchingTools.length === 0) {
            recommendationsList.innerHTML = `
                <div class="browse-no-results">
                    <span class="material-symbols-outlined">search_off</span>
                    <p>No tools found for this question</p>
                </div>
            `;
        } else {
            matchingTools.forEach(tool => {
                const toolCard = createBrowseResultCard(tool, browseData);
                recommendationsList.appendChild(toolCard);
            });
        }
        
        recommendationsSection.style.display = 'block';
        setTimeout(() => {
            recommendationsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

function findMatchingTools(question, data) {
    const searchTerms = question.searchTerms.map(term => term.toLowerCase());
    const categoryIds = question.categories || [];
    
    const matchingTools = data.tools.filter(tool => {
        if (!tool || !tool.id || !tool.name) return false;
        
        const categoryMatch = categoryIds.length === 0 || 
            categoryIds.includes(tool.category);
        
        if (!categoryMatch) return false;
        
        const name = (tool.name || '').toLowerCase();
        const purpose = (tool.purpose || '').toLowerCase();
        const description = (tool.description || '').toLowerCase();
        const categoryName = (tool.categoryName || getCategoryName(data, tool.category) || '').toLowerCase();
        
        const textMatch = searchTerms.some(term => 
            name.includes(term) || 
            purpose.includes(term) || 
            description.includes(term) ||
            categoryName.includes(term)
        );
        
        return textMatch;
    });
    
    matchingTools.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return matchingTools.slice(0, 10);
}

function adjustColor(color, amount) {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Initialize browse page
document.addEventListener('DOMContentLoaded', function() {
    console.log('[BROWSE] DOM loaded, initializing...');
    
    // Ensure section exists before loading
    const whoAreYouSection = document.getElementById('whoAreYouSection');
    if (!whoAreYouSection) {
        console.error('[BROWSE] whoAreYouSection element not found in DOM');
        return;
    }
    
    loadBrowsePage();
    
    // Start over button
    const startOverBtn = document.getElementById('startOverBtn');
    if (startOverBtn) {
        startOverBtn.addEventListener('click', function() {
            resetBrowseFlow();
        });
    }
    
    // Navigation handlers
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.page;
            if (page === 'search') {
                window.location.href = 'index.html';
                setTimeout(() => {
                    const searchInput = document.getElementById('searchInput');
                    if (searchInput) searchInput.focus();
                }, 100);
            }
        });
    });
});

function resetBrowseFlow() {
    selectedUserType = null;
    selectedHelpWith = [];
    
    // Reset UI
    document.getElementById('whoAreYouSection').style.display = 'block';
    document.getElementById('helpWithSection').style.display = 'none';
    document.getElementById('browseRecommendations').style.display = 'none';
    
    // Reset selections
    document.querySelectorAll('.who-are-you-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelectorAll('.help-with-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
