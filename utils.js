// Shared utility functions

function escapeHtml(text) {
    if (text == null || text === '') return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function isSafeImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const s = url.trim().toLowerCase();
    return s.startsWith('https://') || s.startsWith('data:image/');
}

function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function darkenColor(color, percent) {
    if (!color || !color.startsWith('#')) return '#666666';
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
