// Note: collectibles data is loaded from collectibles-data.js

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem('marbleJarState');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.warn('Failed to parse saved state', e);
        }
    }
    return { marbles: [], totalMarbles: 0 };
}

// Count collected items by image URL or type
function countCollected(state) {
    const collected = {};
    
    state.marbles.forEach(marble => {
        // For marble type collectibles, count by type name
        const config = collectibles[marble.type];
        if (config && config.isMarble) {
            collected[marble.type] = (collected[marble.type] || 0) + 1;
        } else {
            // For icon-based collectibles, count by image URL
            const key = marble.imageUrl || marble.type;
            collected[key] = (collected[key] || 0) + 1;
        }
    });
    
    return collected;
}

// Initialize the collection page
function init() {
    const state = loadState();
    const collected = countCollected(state);
    
    renderCollection(collected);
    updateStats(collected);
    setupCollectibleDetailModal();
}

// Setup double-click to open collectible detail popup
function setupCollectibleDetailModal() {
    const overlay = document.getElementById('collectibleDetailOverlay');
    const content = document.getElementById('collectibleDetailContent');
    const closeBtn = document.getElementById('collectibleDetailClose');
    const grid = document.getElementById('collectionGrid');
    
    if (!overlay || !content || !grid) return;
    
    function hideDetail() {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
    }
    
    function showDetail(categoryKey, index, itemName, isMarble, color) {
        const category = collectibles[categoryKey];
        if (!category) return;
        
        const description = typeof getItemDescription === 'function'
            ? getItemDescription(categoryKey, index, itemName)
            : `A wonderful ${itemName} to add to your growing collection!`;
        
        let previewHtml = '';
        if (isMarble && color) {
            const gradient = `radial-gradient(circle at 30% 30%, ${lightenColor(color, 40)} 0%, ${color} 50%, ${darkenColor(color, 30)} 100%)`;
            previewHtml = `<div class="collectible-detail-preview marble" style="background: ${gradient};"></div>`;
        } else if (category.images && category.images[index]) {
            const imageUrl = category.images[index];
            previewHtml = `<img class="collectible-detail-preview" src="${imageUrl}" alt="${escapeHtml(itemName)}">`;
        } else {
            previewHtml = `<div class="collectible-detail-preview marble" style="background: ${color || '#999'};"></div>`;
        }
        
        content.innerHTML = `
            ${previewHtml}
            <h3 class="collectible-detail-name">${escapeHtml(itemName)}</h3>
            <p class="collectible-detail-description">${escapeHtml(description)}</p>
        `;
        
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
    }
    
    grid.addEventListener('dblclick', (e) => {
        const wrapper = e.target.closest('.collectible-item-wrapper');
        const item = wrapper?.querySelector('.collectible-item') || e.target.closest('.collectible-item');
        if (!item) return;
        
        const categoryKey = item.dataset.category;
        const index = parseInt(item.dataset.index, 10);
        const itemName = item.dataset.name || `Item ${index + 1}`;
        const isMarble = item.dataset.isMarble === 'true';
        const color = item.dataset.color || '';
        
        if (categoryKey !== undefined && !isNaN(index)) {
            showDetail(categoryKey, index, itemName, isMarble, color);
        }
    });
    
    closeBtn.addEventListener('click', hideDetail);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) hideDetail(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideDetail(); });
}

// Render the collection grid
function renderCollection(collected) {
    const grid = document.getElementById('collectionGrid');
    
    grid.innerHTML = Object.entries(collectibles).map(([categoryKey, category]) => {
        // Handle marble type which doesn't have images
        const isMarbleType = category.isMarble;
        const itemCount = isMarbleType ? category.fallbackColors.length : category.images.length;
        
        let categoryCollected = 0;
        if (isMarbleType) {
            // For marbles, total count (capped at item count for display)
            categoryCollected = Math.min(collected[categoryKey] || 0, itemCount);
        } else {
            categoryCollected = category.images.filter(img => collected[img]).length;
        }
        
        const isComplete = categoryCollected >= itemCount;
        const categoryLabel = category.name.split(/\s+/).slice(1).join(' ') || category.name;
        const categoryIcon = isMarbleType && category.marbleGradients?.length
            ? `<span class="category-header-icon marble-icon" style="background: ${category.marbleGradients[0]}"></span>`
            : category.images?.length
                ? `<img class="category-header-icon" src="${category.images[0]}" alt="">`
                : `<span class="category-header-icon marble-icon" style="background: ${category.fallbackColors?.[0] || '#999'}"></span>`;
        
        return `
            <div class="category-section">
                <div class="category-header">
                    <div class="category-title-wrap">
                        ${categoryIcon}
                        <h2 class="category-title">${categoryLabel}</h2>
                    </div>
                    <span class="category-count ${isComplete ? 'complete' : ''}">
                        ${isMarbleType ? (collected[categoryKey] || 0) : categoryCollected}/${itemCount}
                    </span>
                </div>
                <div class="items-grid">
                    ${isMarbleType ? renderMarbleItems(category, collected, categoryKey) : category.images.map((imageUrl, index) => {
                        const count = collected[imageUrl] || 0;
                        const isCollected = count > 0;
                        const itemName = category.itemNames?.[index] || `Item ${index + 1}`;
                        
                        return `
                            <div class="collectible-item-wrapper">
                                <div class="collectible-item ${isCollected ? 'collected' : 'locked'}" 
                                     data-name="${escapeHtml(itemName)}"
                                     data-category="${escapeHtml(categoryKey)}"
                                     data-index="${index}">
                                    <div class="collectible-item-visual">
                                        <img src="${imageUrl}" alt="${escapeHtml(itemName)}" 
                                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                        <div class="fallback-circle" style="display: none; background: ${category.fallbackColors[index]};"></div>
                                    </div>
                                    <div class="collectible-item-footer">
                                        <span class="collectible-item-name${itemName.length > 8 ? ' long-name' : ''}">${escapeHtml(itemName)}</span>
                                    </div>
                                </div>
                                <div class="collectible-item-badges">
                                    ${isCollected ? '<span class="collected-badge">✓</span>' : ''}
                                    ${count > 1 ? `<span class="collected-count">×${count}</span>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="category-progress">
                    <div class="category-progress-bar ${isComplete ? 'complete' : ''}" 
                         style="width: ${(categoryCollected / itemCount) * 100}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Render marble items with gradient previews
function renderMarbleItems(category, collected, categoryKey) {
    const totalMarbleCount = collected[categoryKey] || 0;
    
    return category.fallbackColors.map((color, index) => {
        const itemName = category.itemNames?.[index] || `Marble ${index + 1}`;
        const isCollected = totalMarbleCount > index;
        const isLastCollectedSlot = isCollected && index === Math.min(totalMarbleCount, category.fallbackColors.length) - 1;
        const showMarbleCount = totalMarbleCount > 0 && isLastCollectedSlot;
        
        return `
            <div class="collectible-item-wrapper">
                <div class="collectible-item ${isCollected ? 'collected' : 'locked'}" 
                     data-name="${escapeHtml(itemName)}"
                     data-category="${escapeHtml(categoryKey)}"
                     data-index="${index}"
                     data-is-marble="true"
                     data-color="${escapeHtml(color)}">
                    <div class="collectible-item-visual">
                        <div class="marble-preview" style="background: radial-gradient(circle at 30% 30%, ${lightenColor(color, 40)} 0%, ${color} 50%, ${darkenColor(color, 30)} 100%);"></div>
                        <div class="marble-shine"></div>
                    </div>
                    <div class="collectible-item-footer">
                        <span class="collectible-item-name${itemName.length > 8 ? ' long-name' : ''}">${escapeHtml(itemName)}</span>
                    </div>
                </div>
                <div class="collectible-item-badges">
                    ${isCollected ? '<span class="collected-badge">✓</span>' : ''}
                    ${showMarbleCount && totalMarbleCount > 1 ? `<span class="collected-count">×${totalMarbleCount}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Update stats display
function updateStats(collected) {
    let totalCollected = 0;
    let uniqueCollected = 0;
    let totalAvailable = 0;
    
    Object.entries(collectibles).forEach(([key, category]) => {
        if (category.isMarble) {
            totalAvailable += category.fallbackColors.length;
            const marbleCount = collected[key] || 0;
            totalCollected += marbleCount;
            uniqueCollected += Math.min(marbleCount, category.fallbackColors.length);
        } else {
            totalAvailable += category.images.length;
            category.images.forEach(img => {
                if (collected[img]) {
                    uniqueCollected++;
                    totalCollected += collected[img];
                }
            });
        }
    });
    
    const completionPercent = Math.round((uniqueCollected / totalAvailable) * 100);
    
    document.getElementById('totalCollected').textContent = totalCollected;
    document.getElementById('totalAvailable').textContent = totalAvailable;
    document.getElementById('completionPercent').textContent = `${completionPercent}%`;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
