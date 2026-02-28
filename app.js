// Matter.js setup
const { Engine, Render, Runner, Bodies, Body, Composite, Events, Query } = Matter;

// App State
let state = {
    habits: [],
    marbles: [],
    collectibleType: 'marble',
    enabledCollectibles: [], // Populated on init; which types can appear when randomly adding
    totalMarbles: 0,
    pendingMarbles: 0,
    jarType: 'classic',
    jarCapacity: 50,
    soundTheme: 'default'
};

// Sound themes
const soundThemes = {
    default: {
        name: 'Default',
        icon: 'https://cdn-icons-png.flaticon.com/128/1378/1378177.png',
        description: 'Soft chime based on collectible',
        type: 'collectible',
        waveform: 'sine'
    },
    glass: {
        name: 'Glass Marbles',
        icon: 'https://cdn-icons-png.flaticon.com/128/6835/6835786.png',
        description: 'Classic glass marble clinks',
        frequencies: { min: 2000, max: 4000 },
        waveform: 'sine',
        duration: 0.08
    },
    wooden: {
        name: 'Wooden Beads',
        icon: 'https://cdn-icons-png.flaticon.com/128/2702/2702340.png',
        description: 'Warm wooden clacking',
        frequencies: { min: 200, max: 400 },
        waveform: 'triangle',
        duration: 0.1
    },
    crystal: {
        name: 'Crystal Gems',
        icon: 'https://cdn-icons-png.flaticon.com/128/10873/10873790.png',
        description: 'Sparkling crystal tones',
        frequencies: { min: 3000, max: 5000 },
        waveform: 'sine',
        duration: 0.15
    },
    bubble: {
        name: 'Bubbles',
        icon: 'https://cdn-icons-png.flaticon.com/128/525/525797.png',
        description: 'Soft bubbly pops',
        frequencies: { min: 600, max: 1200 },
        waveform: 'sine',
        duration: 0.05,
        pitchBend: true
    },
    chime: {
        name: 'Wind Chimes',
        icon: 'https://cdn-icons-png.flaticon.com/128/836/836906.png',
        description: 'Gentle wind chime tones',
        frequencies: { min: 800, max: 2400 },
        waveform: 'sine',
        duration: 0.3,
        reverb: true
    },
    retro: {
        name: 'Retro Game',
        icon: 'https://cdn-icons-png.flaticon.com/128/7223/7223166.png',
        description: '8-bit arcade sounds',
        frequencies: { min: 150, max: 600 },
        waveform: 'square',
        duration: 0.06
    },
    soft: {
        name: 'Soft & Quiet',
        icon: 'https://cdn-icons-png.flaticon.com/128/414/414825.png',
        description: 'Very gentle, muted sounds',
        frequencies: { min: 400, max: 800 },
        waveform: 'sine',
        duration: 0.12,
        volume: 0.03
    },
    silent: {
        name: 'Silent',
        icon: 'https://cdn-icons-png.flaticon.com/128/2880/2880929.png',
        description: 'No collision sounds',
        muted: true
    }
};

// Jar configurations
const jarTypes = {
    classic: {
        name: '🫙 Classic Jar',
        description: 'Traditional mason jar',
        cssClass: 'jar-classic'
    },
    round: {
        name: '🔮 Round Bowl',
        description: 'Spherical fishbowl shape',
        cssClass: 'jar-round'
    },
    tall: {
        name: '🧪 Tall Vase',
        description: 'Elegant tall vase',
        cssClass: 'jar-tall'
    },
    wide: {
        name: '🥣 Wide Basin',
        description: 'Shallow wide dish',
        cssClass: 'jar-wide'
    },
    heart: {
        name: '💖 Heart Jar',
        description: 'Heart-shaped container',
        cssClass: 'jar-heart'
    }
};

// Audio context for sound effects
let audioCtx = null;

// Physics engine variables
let engine, render, runner;
let jarWalls = [];
let marbleBodies = [];

// Image cache for sprites
const imageCache = {};

// Note: collectibles data is loaded from collectibles-data.js

// Preload images
function preloadImages() {
    Object.values(collectibles).forEach(config => {
        config.images.forEach(url => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = url;
            img.onload = () => {
                imageCache[url] = img;
            };
            img.onerror = () => {
                console.warn('Failed to load image:', url);
            };
        });
    });
}

// Sync UI and auth
function renderSyncUI() {
    const statusEl = document.getElementById('syncStatus');
    const formEl = document.getElementById('syncAuthForm');
    const hintEl = document.getElementById('syncHint');
    if (!statusEl || !formEl) return;

    if (typeof Sync === 'undefined' || !Sync.isConfigured || !Sync.isConfigured()) {
        statusEl.innerHTML = '<p class="sync-hint">Add Supabase URL and anon key to sync-config.js to enable sync.</p>';
        formEl.style.display = 'none';
        return;
    }

    Sync.getSession().then(session => {
        if (session) {
            statusEl.innerHTML = `
                <div class="sync-signed-in">
                    <span>Signed in as ${escapeHtml(session.user.email || 'user')}</span>
                    <button type="button" class="sync-sign-out-btn" id="syncSignOutBtn">Sign Out</button>
                </div>
            `;
            formEl.style.display = 'none';
            hintEl.textContent = 'Your jar syncs across devices when you sign in.';
            statusEl.querySelector('#syncSignOutBtn')?.addEventListener('click', async () => {
                await Sync.signOut();
                onSyncAuthChange(false, null);
            });
        } else {
            statusEl.innerHTML = '';
            formEl.style.display = 'block';
            hintEl.textContent = 'Sign in to sync your jar across devices.';
            const signInBtn = document.getElementById('syncSignInBtn');
            const signUpBtn = document.getElementById('syncSignUpBtn');
            if (signInBtn && !signInBtn._bound) { signInBtn._bound = true; signInBtn.addEventListener('click', handleSignIn); }
            if (signUpBtn && !signUpBtn._bound) { signUpBtn._bound = true; signUpBtn.addEventListener('click', handleSignUp); }
        }
    });
}

async function handleSignIn() {
    const email = document.getElementById('syncEmail')?.value?.trim();
    const password = document.getElementById('syncPassword')?.value;
    if (!email || !password) {
        alert('Enter email and password');
        return;
    }
    try {
        await Sync.signIn(email, password);
        renderSyncUI();
    } catch (e) {
        alert(e.message || 'Sign in failed');
    }
}

async function handleSignUp() {
    const email = document.getElementById('syncEmail')?.value?.trim();
    const password = document.getElementById('syncPassword')?.value;
    if (!email || !password) {
        alert('Enter email and password');
        return;
    }
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    try {
        await Sync.signUp(email, password);
        alert('Check your email to confirm your account.');
        renderSyncUI();
    } catch (e) {
        alert(e.message || 'Sign up failed');
    }
}

function onSyncAuthChange(signedIn, user) {
    renderSyncUI();
    if (signedIn) {
        Sync.pullState().then(remote => {
            if (remote && remote.data) {
                applyStateData(remote.data);
                saveState();
                applyJarType();
                rebuildPhysics();
                renderHabits();
                updateMarbleCount();
                updatePendingDisplay();
            }
        });
    }
}

// Initialize the app
async function init() {
    preloadImages();
    loadState();
    if (typeof Sync !== 'undefined' && Sync.isConfigured && Sync.isConfigured()) {
        Sync.init();
        const session = await Sync.getSession();
        if (session) {
            const remote = await Sync.pullState();
            if (remote && remote.data) {
                applyStateData(remote.data);
                saveState();
            }
        }
    }
    applyJarType();
    setupPhysics();
    setupEventListeners();
    renderHabits();
    renderCollectibles();
    renderSoundSettings();
    renderSyncUI();
    updateMarbleCount();
    updatePendingDisplay();
    if (typeof Sync !== 'undefined' && Sync.isConfigured && Sync.isConfigured()) {
        window.onSyncAuthChange = onSyncAuthChange;
    }

    // Delay marble restoration to allow images to load
    setTimeout(restoreMarbles, 500);
}

// Apply jar type CSS class
function applyJarType() {
    const container = document.getElementById('jarContainer');
    if (!container) return;
    Object.values(jarTypes).forEach(jar => {
        container.classList.remove(jar.cssClass);
    });
    const jar = jarTypes[state.jarType] || jarTypes.classic;
    container.classList.add(jar.cssClass);
}

// Get marble size based on jar capacity
function getMarbleSize() {
    const baseSize = 28;
    const capacity = state.jarCapacity;
    
    if (capacity <= 20) return baseSize * 1.4;
    if (capacity <= 50) return baseSize * 1.0;
    if (capacity <= 100) return baseSize * 0.75;
    if (capacity <= 200) return baseSize * 0.55;
    return baseSize * 0.4;
}

// Resize existing marbles
function resizeExistingMarbles() {
    const newSize = getMarbleSize();
    const newRadius = newSize / 2;
    
    marbleBodies.forEach((marble, index) => {
        const scale = newRadius / marble.circleRadius;
        Body.scale(marble, scale, scale);
        
        if (marble.render.sprite) {
            marble.render.sprite.xScale = (newRadius * 2) / 128;
            marble.render.sprite.yScale = (newRadius * 2) / 128;
        }
    });
    
    state.marbles = state.marbles.map(m => ({
        ...m,
        radius: newRadius
    }));
    saveState();
}

// Render sound settings
function renderSoundSettings() {
    const soundPicker = document.getElementById('soundThemePicker');
    if (!soundPicker) return;
    
    soundPicker.innerHTML = Object.entries(soundThemes).map(([key, theme]) => {
        const label = theme.icon
            ? `<img class="sound-option-icon" src="${theme.icon}" alt="">${escapeHtml(theme.name)}`
            : escapeHtml(theme.name);
        return `<button class="sound-option ${state.soundTheme === key ? 'active' : ''}" 
                data-theme="${escapeHtml(key)}" 
                title="${escapeHtml(theme.description || '')}">
            ${label}
        </button>`;
    }).join('');
    
    soundPicker.querySelectorAll('.sound-option').forEach(btn => {
        btn.addEventListener('click', () => {
            soundPicker.querySelectorAll('.sound-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.soundTheme = btn.dataset.theme;
            saveState();
            
            // Play a preview sound
            playPreviewSound();
        });
    });
}

// Play a preview sound when selecting a theme
function playPreviewSound() {
    playCollisionSound(0.8);
    setTimeout(() => playCollisionSound(0.5), 100);
    setTimeout(() => playCollisionSound(0.6), 200);
}

// Rebuild physics when jar shape changes
function rebuildPhysics() {
    if (engine) {
        Composite.clear(engine.world);
        Engine.clear(engine);
        Render.stop(render);
        Runner.stop(runner);
    }
    
    jarWalls = [];
    marbleBodies = [];
    
    setupPhysics();
    setTimeout(restoreMarbles, 100);
}

// Apply parsed/remote state to app state (with migration)
function applyStateData(parsed) {
    if (!parsed) return;
    const allTypes = Object.keys(collectibles);
    state.habits = parsed.habits || [];
    state.marbles = parsed.marbles || [];
    state.collectibleType = parsed.collectibleType || 'marble';
    state.enabledCollectibles = Array.isArray(parsed.enabledCollectibles)
        ? parsed.enabledCollectibles.filter(k => collectibles[k])
        : allTypes;
    if (state.enabledCollectibles.length === 0) state.enabledCollectibles = allTypes;
    state.totalMarbles = parsed.totalMarbles ?? state.marbles.length;
    state.pendingMarbles = parsed.pendingMarbles || 0;
    state.jarType = jarTypes[parsed.jarType] ? parsed.jarType : 'classic';
    state.jarCapacity = Math.min(200, Math.max(10, parsed.jarCapacity ?? 50));
    state.soundTheme = parsed.soundTheme || 'default';
    state.habits = state.habits.map(h => ({
        ...h,
        timesPerDay: h.timesPerDay || 1,
        completedToday: h.completedToday || (h.completed ? 1 : 0)
    }));
}

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem('marbleJarState');
    if (saved) {
        try {
            applyStateData(JSON.parse(saved));
        } catch (e) {
            console.warn('Failed to parse saved state', e);
        }
    }
    if (state.enabledCollectibles.length === 0) {
        state.enabledCollectibles = Object.keys(collectibles);
    }
    const lastDate = localStorage.getItem('lastDate');
    const today = new Date().toDateString();
    if (lastDate !== today) {
        state.habits.forEach(h => { h.completedToday = 0; });
        localStorage.setItem('lastDate', today);
        saveState();
    }
}

// Save state to localStorage (and push to sync if signed in)
function saveState() {
    localStorage.setItem('marbleJarState', JSON.stringify(state));
    if (typeof Sync !== 'undefined' && Sync.isConfigured && Sync.isConfigured()) {
        Sync.getSession().then(session => {
            if (session) Sync.pushState(state);
        });
    }
}

// Render collectible options
function renderCollectibles() {
    const picker = document.getElementById('collectiblePicker');
    picker.innerHTML = Object.entries(collectibles).map(([key, config]) => {
        const label = config.name.split(/\s+/).slice(1).join(' ') || config.name;
        const enabled = state.enabledCollectibles.includes(key);
        let icon;
        if (config.isMarble && config.marbleGradients?.length) {
            icon = `<span class="collectible-option-icon marble-icon" style="background: ${config.marbleGradients[0]}"></span>`;
        } else if (config.images?.length) {
            icon = `<img class="collectible-option-icon" src="${config.images[0]}" alt="">`;
        } else {
            icon = `<span class="collectible-option-icon marble-icon" style="background: ${config.fallbackColors?.[0] || '#999'}"></span>`;
        }
        return `<label class="collectible-option ${state.collectibleType === key ? 'active' : ''} ${enabled ? 'enabled' : ''}" data-type="${key}">
            <input type="checkbox" class="collectible-option-checkbox" ${enabled ? 'checked' : ''}>
            <span class="collectible-option-content">${icon}<span class="collectible-option-label">${label}</span></span>
        </label>`;
    }).join('');
    
    picker.querySelectorAll('.collectible-option-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            e.stopPropagation();
            const option = cb.closest('.collectible-option');
            const key = option.dataset.type;
            if (cb.checked) {
                if (!state.enabledCollectibles.includes(key)) state.enabledCollectibles.push(key);
            } else {
                state.enabledCollectibles = state.enabledCollectibles.filter(k => k !== key);
                if (state.enabledCollectibles.length === 0) {
                    state.enabledCollectibles.push(key);
                    cb.checked = true;
                }
            }
            option.classList.toggle('enabled', cb.checked);
            saveState();
        });
    });
    
    picker.querySelectorAll('.collectible-option-content').forEach(span => {
        span.addEventListener('click', (e) => {
            e.preventDefault();
            const option = span.closest('.collectible-option');
            picker.querySelectorAll('.collectible-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            state.collectibleType = option.dataset.type;
            saveState();
        });
    });
}

// Get jar boundaries based on jar type
function getJarBoundaries(width, height) {
    const jarType = state.jarType;
    
    switch (jarType) {
        case 'round':
            return {
                left: 25,
                right: width - 25,
                top: 40,
                bottom: height - 20,
                curveRadius: 80,
                shape: 'round'
            };
        case 'tall':
            return {
                left: 55,
                right: width - 55,
                top: 35,
                bottom: height - 20,
                curveRadius: 30,
                shape: 'tall'
            };
        case 'wide':
            return {
                left: 15,
                right: width - 15,
                top: 80,
                bottom: height - 15,
                curveRadius: 50,
                shape: 'wide'
            };
        case 'heart':
            return {
                left: 30,
                right: width - 30,
                top: 50,
                bottom: height - 25,
                curveRadius: 45,
                shape: 'heart'
            };
        case 'classic':
        default:
            return {
                left: 34,
                right: width - 34,
                top: 55,
                bottom: height - 25,
                curveRadius: 40,
                shape: 'classic'
            };
    }
}

// Setup Matter.js physics
function setupPhysics() {
    const canvas = document.getElementById('jarCanvas');
    const container = document.getElementById('jarContainer');
    
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    
    canvas.width = width;
    canvas.height = height;
    
    // Create engine with lower gravity for gentler movement
    engine = Engine.create({
        gravity: { x: 0, y: 0.8 }
    });
    
    // Create renderer
    render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: width,
            height: height,
            wireframes: false,
            background: 'transparent',
            pixelRatio: window.devicePixelRatio || 1
        }
    });
    
    // Get jar boundaries based on type
    const bounds = getJarBoundaries(width, height);
    const { left: jarLeft, right: jarRight, top: jarTop, bottom: jarBottom, curveRadius, shape } = bounds;
    
    // Create jar walls (invisible boundaries matching the jar shape)
    const wallOptions = {
        isStatic: true,
        render: { visible: false },
        friction: 0.3,
        restitution: 0.2
    };
    
    const wallThickness = 30;
    const centerX = width / 2;
    
    if (shape === 'round') {
        // Round bowl - complete circular containment with thick boundaries
        const bowlCenterX = centerX;
        const bowlCenterY = height / 2 + 25;
        const bowlRadius = Math.min(width, height) / 2 - 5;
        
        // Create complete circular boundary using dense overlapping circles
        // This creates a solid wall all around the bowl
        for (let layer = 0; layer < 2; layer++) {
            const layerRadius = bowlRadius + layer * 12;
            for (let i = 0; i < 60; i++) {
                const angle = (Math.PI * 2 * i) / 60;
                // Create boundary from angles 0.2 to PI - 0.2 (bottom and sides)
                if (angle > 0.15 && angle < Math.PI - 0.15) {
                    const x = bowlCenterX + Math.cos(angle) * layerRadius;
                    const y = bowlCenterY + Math.sin(angle) * (layerRadius * 0.7);
                    jarWalls.push(Bodies.circle(x, y, 16, wallOptions));
                }
            }
        }
        
        // Left side wall - tall solid barrier to prevent side escapes
        jarWalls.push(Bodies.rectangle(
            jarLeft - 10, 
            jarTop + (jarBottom - jarTop) / 2 - 20, 
            wallThickness, 
            (jarBottom - jarTop) * 0.7, 
            wallOptions
        ));
        
        // Right side wall - tall solid barrier
        jarWalls.push(Bodies.rectangle(
            jarRight + 10, 
            jarTop + (jarBottom - jarTop) / 2 - 20, 
            wallThickness, 
            (jarBottom - jarTop) * 0.7, 
            wallOptions
        ));
        
        // Top wall (lid) - solid barrier across the narrow opening
        jarWalls.push(Bodies.rectangle(centerX, jarTop - 10, width * 0.6, wallThickness + 10, wallOptions));
        
        // Additional lid-side connections using dense circles
        for (let i = 0; i < 10; i++) {
            const t = i / 9;
            // Left side connection
            const leftX = centerX - width * 0.25 - t * 30;
            const leftY = jarTop + t * 35;
            jarWalls.push(Bodies.circle(leftX, leftY, 14, wallOptions));
            // Right side connection
            const rightX = centerX + width * 0.25 + t * 30;
            jarWalls.push(Bodies.circle(rightX, leftY, 14, wallOptions));
        }
        
        // Bottom reinforcement - flat floor
        jarWalls.push(Bodies.rectangle(centerX, jarBottom + 5, jarRight - jarLeft - 40, wallThickness / 2, wallOptions));
        
    } else if (shape === 'heart') {
        // Heart jar - use simple angled walls converging to a narrow bottom
        
        // Narrow bottom wall
        jarWalls.push(Bodies.rectangle(centerX, jarBottom + wallThickness/2, 60, wallThickness, wallOptions));
        
        // Top wall (lid)
        jarWalls.push(Bodies.rectangle(centerX, jarTop - wallThickness/2, 100, wallThickness, wallOptions));
        
        // Side walls - angled inward to create V shape
        // These need to form a continuous wall from top to bottom
        const heartHeight = jarBottom - jarTop;
        const topWidth = jarRight - jarLeft;
        const bottomWidth = 40;
        
        // Left angled wall - straight line from top-left to bottom-center
        const leftAngle = Math.atan2(heartHeight, (topWidth / 2) - (bottomWidth / 2));
        const wallLength = heartHeight / Math.cos(leftAngle) + 20;
        
        // Position walls along the angled path
        for (let i = 0; i < 12; i++) {
            const t = i / 11;
            const leftX = jarLeft + t * ((topWidth / 2) - (bottomWidth / 2));
            const leftY = jarTop + 20 + t * (heartHeight - 30);
            jarWalls.push(Bodies.circle(leftX, leftY, 12, wallOptions));
            
            const rightX = jarRight - t * ((topWidth / 2) - (bottomWidth / 2));
            jarWalls.push(Bodies.circle(rightX, leftY, 12, wallOptions));
        }
        
        // Extra circles at the bottom V-point
        for (let i = 0; i < 5; i++) {
            const x = centerX - 20 + i * 10;
            jarWalls.push(Bodies.circle(x, jarBottom - 5, 8, wallOptions));
        }
        
    } else if (shape === 'tall') {
        // Tall vase - narrower with curved bottom
        
        // Side walls
        jarWalls.push(Bodies.rectangle(jarLeft - wallThickness/2, height / 2, wallThickness, height - 60, wallOptions));
        jarWalls.push(Bodies.rectangle(jarRight + wallThickness/2, height / 2, wallThickness, height - 60, wallOptions));
        
        // Bottom wall
        jarWalls.push(Bodies.rectangle(centerX, jarBottom + wallThickness/2, jarRight - jarLeft + 20, wallThickness, wallOptions));
        
        // Top wall (lid)
        jarWalls.push(Bodies.rectangle(centerX, jarTop - wallThickness/2, jarRight - jarLeft + 30, wallThickness, wallOptions));
        
        // Angled corner slopes - steeper for tall jar
        const tallSlopeLength = curveRadius * 2;
        jarWalls.push(Bodies.rectangle(
            jarLeft + curveRadius / 2 + 5,
            jarBottom - curveRadius / 2,
            tallSlopeLength,
            wallThickness / 2,
            { ...wallOptions, angle: Math.PI / 5 }
        ));
        jarWalls.push(Bodies.rectangle(
            jarRight - curveRadius / 2 - 5,
            jarBottom - curveRadius / 2,
            tallSlopeLength,
            wallThickness / 2,
            { ...wallOptions, angle: -Math.PI / 5 }
        ));
        
        // Curved corners
        for (let i = 0; i < 8; i++) {
            const angle = Math.PI / 2 + (Math.PI / 2) * (i / 7);
            const x1 = jarLeft + curveRadius + Math.cos(angle) * curveRadius;
            const y1 = jarBottom - curveRadius + Math.sin(angle) * curveRadius;
            jarWalls.push(Bodies.circle(x1, y1, 6, wallOptions));
            
            const x2 = jarRight - curveRadius + Math.cos(Math.PI - angle) * curveRadius;
            const y2 = jarBottom - curveRadius + Math.sin(Math.PI - angle) * curveRadius;
            jarWalls.push(Bodies.circle(x2, y2, 6, wallOptions));
        }
        
    } else if (shape === 'wide') {
        // Wide basin - shallow with curved bottom
        
        // Side walls - extend from top to bottom
        const wideWallHeight = jarBottom - jarTop + 20;
        const wideWallY = jarTop + wideWallHeight / 2;
        jarWalls.push(Bodies.rectangle(jarLeft - wallThickness/2, wideWallY, wallThickness, wideWallHeight, wallOptions));
        jarWalls.push(Bodies.rectangle(jarRight + wallThickness/2, wideWallY, wallThickness, wideWallHeight, wallOptions));
        
        // Bottom wall
        jarWalls.push(Bodies.rectangle(centerX, jarBottom + wallThickness/2, jarRight - jarLeft + 30, wallThickness, wallOptions));
        
        // Top wall (lid)
        jarWalls.push(Bodies.rectangle(centerX, jarTop - wallThickness/2, jarRight - jarLeft + 40, wallThickness, wallOptions));
        
        // Angled corner slopes - gentler for wide basin
        const wideSlopeLength = curveRadius * 2.5;
        jarWalls.push(Bodies.rectangle(
            jarLeft + curveRadius,
            jarBottom - curveRadius / 2 + 5,
            wideSlopeLength,
            wallThickness / 2,
            { ...wallOptions, angle: Math.PI / 7 }
        ));
        jarWalls.push(Bodies.rectangle(
            jarRight - curveRadius,
            jarBottom - curveRadius / 2 + 5,
            wideSlopeLength,
            wallThickness / 2,
            { ...wallOptions, angle: -Math.PI / 7 }
        ));
        
        // Curved corners (larger for wide basin)
        for (let i = 0; i < 12; i++) {
            const angle = Math.PI / 2 + (Math.PI / 2) * (i / 11);
            const x1 = jarLeft + curveRadius + Math.cos(angle) * (curveRadius + 10);
            const y1 = jarBottom - curveRadius + Math.sin(angle) * (curveRadius + 10);
            jarWalls.push(Bodies.circle(x1, y1, 8, wallOptions));
            
            const x2 = jarRight - curveRadius + Math.cos(Math.PI - angle) * (curveRadius + 10);
            const y2 = jarBottom - curveRadius + Math.sin(Math.PI - angle) * (curveRadius + 10);
            jarWalls.push(Bodies.circle(x2, y2, 8, wallOptions));
        }
        
    } else {
        // Classic jar (default) - flat bottom, no corner shelves
        const wallHeight = jarBottom - jarTop + 30;
        const wallY = jarTop + wallHeight / 2 - 15;
        jarWalls.push(Bodies.rectangle(jarLeft - wallThickness/2, wallY, wallThickness, wallHeight, wallOptions));
        jarWalls.push(Bodies.rectangle(jarRight + wallThickness/2, wallY, wallThickness, wallHeight, wallOptions));
        
        jarWalls.push(Bodies.rectangle(centerX, jarBottom + wallThickness/2, jarRight - jarLeft + 40, wallThickness, wallOptions));
        
        jarWalls.push(Bodies.rectangle(centerX, jarTop - wallThickness/2, jarRight - jarLeft + 20, wallThickness, wallOptions));
        
        // Corner curves flush with floor - no raised shelves
        const cornerR = 22;
        for (let i = 0; i < 8; i++) {
            const t = i / 7;
            const angle1 = Math.PI / 2 + (Math.PI / 2.5) * t;
            jarWalls.push(Bodies.circle(
                jarLeft + cornerR + Math.cos(angle1) * cornerR,
                jarBottom - 2 + Math.sin(angle1) * cornerR,
                5, wallOptions
            ));
            const angle2 = Math.PI / 2 - (Math.PI / 2.5) * t;
            jarWalls.push(Bodies.circle(
                jarRight - cornerR + Math.cos(angle2) * cornerR,
                jarBottom - 2 + Math.sin(angle2) * cornerR,
                5, wallOptions
            ));
        }
    }
    
    Composite.add(engine.world, jarWalls);
    
    // Collision sound effects
    Events.on(engine, 'collisionStart', handleCollision);
    
    // Check for escaped marbles every frame
    Events.on(engine, 'afterUpdate', checkMarbleBounds);
    
    // Start the engine and renderer
    runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);
    
    // Setup shake/drag interaction
    setupShakeInteraction();

    // Double-click to zoom on marble
    setupMarbleZoom(canvas);
}

// Check and respawn marbles that escape the jar bounds
function checkMarbleBounds() {
    const container = document.getElementById('jarContainer');
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    
    const bounds = getJarBoundaries(width, height);
    const { left: jarLeft, right: jarRight, top: jarTop, bottom: jarBottom, curveRadius } = bounds;
    const centerX = width / 2;
    
    marbleBodies.forEach(marble => {
        const pos = marble.position;
        let needsReset = false;
        
        // Check if marble escaped bounds
        if (pos.x < jarLeft - 50 || pos.x > jarRight + 50 || 
            pos.y < jarTop - 100 || pos.y > jarBottom + 50) {
            needsReset = true;
        }
        
        // Check if marble has crazy velocity (flung too hard)
        const speed = Math.sqrt(marble.velocity.x ** 2 + marble.velocity.y ** 2);
        if (speed > 30) {
            Body.setVelocity(marble, { 
                x: marble.velocity.x * 0.3, 
                y: marble.velocity.y * 0.3 
            });
        }
        
        // Check if marble is stuck in bottom corners (slow velocity, near corner)
        const nearLeftCorner = pos.x < jarLeft + 50;
        const nearRightCorner = pos.x > jarRight - 50;
        const isNearBottom = pos.y > jarBottom - 60;
        const isMovingSlow = speed < 0.8;
        
        if (isNearBottom && (nearLeftCorner || nearRightCorner) && isMovingSlow) {
            // Nudge toward center and down so marbles settle on the floor
            const nudgeX = nearLeftCorner ? 0.0012 : -0.0012;
            Body.applyForce(marble, pos, { x: nudgeX, y: 0.001 });
        }
        
        // If marble is above the center and not moving much, nudge it toward center-bottom
        const jarCenterY = (jarTop + jarBottom) / 2;
        if (pos.y < jarCenterY && speed < 1) {
            const nudgeX = (centerX - pos.x) * 0.00003;
            Body.applyForce(marble, pos, { x: nudgeX, y: 0.0004 });
        }
        
        if (needsReset) {
            // Respawn at random position inside jar
            const newX = jarLeft + 20 + Math.random() * (jarRight - jarLeft - 40);
            const newY = jarTop + 20 + Math.random() * 50;
            Body.setPosition(marble, { x: newX, y: newY });
            Body.setVelocity(marble, { x: 0, y: 0 });
        }
    });
}

// Handle collision sounds
function handleCollision(event) {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        const relativeVelocity = Math.sqrt(
            Math.pow(bodyA.velocity.x - bodyB.velocity.x, 2) +
            Math.pow(bodyA.velocity.y - bodyB.velocity.y, 2)
        );
        
        if (relativeVelocity > 2) {
            playCollisionSound(Math.min(relativeVelocity / 10, 1));
        }
    });
}

// Play collision sound
function playCollisionSound(intensity) {
    const theme = soundThemes[state.soundTheme] || soundThemes.default;
    
    // Check if muted
    if (theme.muted) return;
    
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    let frequency, waveform, duration, volume;
    
    if (theme.type === 'collectible') {
        // Use collectible-based sounds (default behavior)
        const config = collectibles[state.collectibleType];
        if (!config) return;
        frequency = config.sounds.min + Math.random() * (config.sounds.max - config.sounds.min);
        waveform = theme.waveform || 'sine';
        duration = 0.1;
        volume = 0.1 * intensity;
    } else {
        // Use theme-based sounds
        frequency = theme.frequencies.min + Math.random() * (theme.frequencies.max - theme.frequencies.min);
        waveform = theme.waveform || 'sine';
        duration = theme.duration || 0.1;
        volume = (theme.volume || 0.1) * intensity;
    }
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = waveform;
    
    // Pitch bend for bubble effect
    if (theme.pitchBend) {
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, audioCtx.currentTime + duration);
    }
    
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
}

// Setup drag + device motion (no jar shake animation)
function setupShakeInteraction() {
    const container = document.getElementById('jarContainer');
    const shakeHint = document.getElementById('shakeHint');
    let isDragging = false;
    let hasMoved = false;
    const dragThreshold = 12;
    let lastX = 0, lastY = 0;
    let velocityX = 0, velocityY = 0;
    
    function startDrag(e) {
        isDragging = true;
        hasMoved = false;
        const pos = getEventPosition(e);
        lastX = pos.x;
        lastY = pos.y;
    }
    
    function moveDrag(e) {
        if (!isDragging) return;
        const pos = getEventPosition(e);
        const dx = pos.x - lastX;
        const dy = pos.y - lastY;
        if (!hasMoved && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
            hasMoved = true;
            shakeHint.classList.add('hidden');
        }
        if (hasMoved) {
            velocityX = dx * 0.3;
            velocityY = dy * 0.2;
            const maxVel = 15;
            velocityX = Math.max(-maxVel, Math.min(maxVel, velocityX));
            velocityY = Math.max(-maxVel, Math.min(maxVel, velocityY));
            marbleBodies.forEach(marble => {
                Body.applyForce(marble, marble.position, {
                    x: velocityX * 0.0005,
                    y: velocityY * 0.0005
                });
            });
        }
        lastX = pos.x;
        lastY = pos.y;
    }
    
    function endDrag() {
        isDragging = false;
    }
    
    function getEventPosition(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }
    
    container.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('mouseup', endDrag);
    container.addEventListener('touchstart', startDrag, { passive: true });
    document.addEventListener('touchmove', moveDrag, { passive: true });
    document.addEventListener('touchend', endDrag);
    
    // Device motion (for mobile shake)
    if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', (e) => {
            const acceleration = e.accelerationIncludingGravity;
            if (!acceleration) return;
            
            const threshold = 15;
            const shake = Math.abs(acceleration.x) + Math.abs(acceleration.y);
            
            if (shake > threshold) {
                shakeHint.classList.add('hidden');
                
                marbleBodies.forEach(marble => {
                    Body.applyForce(marble, marble.position, {
                        x: acceleration.x * 0.0005,
                        y: -acceleration.y * 0.0003
                    });
                });
                
            }
        });
    }
}

// Double-click marble to zoom in for a closer look
function setupMarbleZoom(canvas) {
    const overlay = document.getElementById('marbleZoomOverlay');
    const content = document.getElementById('marbleZoomContent');
    const closeBtn = document.getElementById('marbleZoomClose');

    const container = document.getElementById('jarContainer');

    function worldPointFromEvent(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    }

    function showMarbleZoom(marble) {
        const config = collectibles[marble.marbleType];
        const isMarbleType = config && config.isMarble;
        const name = marble.itemName || config?.name?.split(/\s+/).slice(1).join(' ') || marble.marbleType;

        let preview = '';
        if (isMarbleType) {
            const gradient = `radial-gradient(circle at 30% 30%, ${lightenColor(marble.marbleColor || '#FF69B4', 40)} 0%, ${marble.marbleColor || '#FF69B4'} 50%, ${darkenColor(marble.marbleColor || '#FF69B4', 30)} 100%)`;
            preview = `<div class="marble-zoom-gradient" style="background: ${gradient};"></div>`;
        } else if (marble.marbleImage && isSafeImageUrl(marble.marbleImage)) {
            preview = `<div class="marble-zoom-preview" style="background-image: url('${marble.marbleImage.replace(/'/g, "\\'")}');"></div>`;
        } else {
            preview = `<div class="marble-zoom-gradient" style="background: ${marble.marbleColor || '#FF69B4'};"></div>`;
        }
        content.innerHTML = `${preview}<span class="marble-zoom-name">${escapeHtml(name)}</span>`;

        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
    }

    function hideMarbleZoom() {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
    }

    function tryShowMarbleZoom(e) {
        const point = worldPointFromEvent(e);
        const hit = Query.point(marbleBodies, point);
        if (hit.length > 0) {
            showMarbleZoom(hit[0]);
        }
    }

    // Manual double-click: use mousedown (click can be suppressed by touch-action)
    let lastDownTime = 0;
    let lastDownPoint = null;
    const dblClickDelay = 500;
    const dblClickDistance = 35;

    function handleMouseDown(e) {
        const point = worldPointFromEvent(e);
        const now = Date.now();
        const isSecondClick = lastDownPoint && (now - lastDownTime) < dblClickDelay &&
            Math.abs(point.x - lastDownPoint.x) < dblClickDistance &&
            Math.abs(point.y - lastDownPoint.y) < dblClickDistance;
        if (isSecondClick) {
            lastDownTime = 0;
            lastDownPoint = null;
            tryShowMarbleZoom(e);
        } else {
            lastDownTime = now;
            lastDownPoint = point;
        }
    }

    container.addEventListener('mousedown', handleMouseDown);

    closeBtn.addEventListener('click', hideMarbleZoom);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) hideMarbleZoom(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideMarbleZoom(); });

    // Touch: double-tap
    let lastTap = 0;
    let lastTapPoint = null;
    canvas.addEventListener('touchend', (e) => {
        const now = Date.now();
        const point = worldPointFromEvent(e);
        const isSecondTap = lastTapPoint && (now - lastTap) < 350 &&
            Math.abs(point.x - lastTapPoint.x) < 25 &&
            Math.abs(point.y - lastTapPoint.y) < 25;
        if (isSecondTap) {
            e.preventDefault();
            tryShowMarbleZoom(e);
            lastTap = 0;
            lastTapPoint = null;
        } else {
            lastTap = now;
            lastTapPoint = point;
        }
    });
}

// Pick a random type from enabled collectibles
function getRandomEnabledType() {
    const enabled = state.enabledCollectibles.filter(k => collectibles[k]);
    if (enabled.length === 0) return state.collectibleType;
    return enabled[Math.floor(Math.random() * enabled.length)];
}

// Add a collectible to the jar
function addMarble(type) {
    if (type == null) type = getRandomEnabledType();
    const container = document.getElementById('jarContainer');
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    
    const config = collectibles[type];
    if (!config) return;
    
    const size = getMarbleSize();
    const radius = size / 2;
    const bounds = getJarBoundaries(width, height);
    
    // Start position (drop from inside jar, below the lid)
    const x = bounds.left + 20 + Math.random() * (bounds.right - bounds.left - 40);
    const y = bounds.top + 15;
    
    let renderOptions;
    let imageUrl = '';
    let fallbackColor = config.fallbackColors[Math.floor(Math.random() * config.fallbackColors.length)];
    
    // Check if this is a marble type (rendered with gradients)
    let itemName = '';
    if (config.isMarble) {
        const colorIndex = Math.floor(Math.random() * config.fallbackColors.length);
        fallbackColor = config.fallbackColors[colorIndex];
        itemName = config.itemNames?.[colorIndex] || '';
        const textureUrl = createMarbleTexture(fallbackColor, radius * 2);
        renderOptions = {
            sprite: {
                texture: textureUrl,
                xScale: 1,
                yScale: 1
            }
        };
        imageUrl = textureUrl;
    } else {
        const imageIndex = Math.floor(Math.random() * config.images.length);
        imageUrl = config.images[imageIndex];
        itemName = config.itemNames?.[imageIndex] || '';
        const cachedImage = imageCache[imageUrl];
        
        if (cachedImage) {
            renderOptions = {
                sprite: {
                    texture: imageUrl,
                    xScale: (radius * 2) / 128,
                    yScale: (radius * 2) / 128
                }
            };
        } else {
            renderOptions = {
                fillStyle: fallbackColor,
                strokeStyle: darkenColor(fallbackColor, 20),
                lineWidth: 2
            };
        }
    }
    
    const marble = Bodies.circle(x, y, radius, {
        restitution: 0.6,
        friction: 0.05,
        frictionAir: 0.001,
        density: 0.001,
        render: renderOptions
    });
    
    marble.marbleType = type;
    marble.marbleImage = imageUrl;
    marble.marbleColor = fallbackColor;
    marble.itemName = itemName;
    
    Composite.add(engine.world, marble);
    marbleBodies.push(marble);
    
    // Save marble data
    state.marbles.push({ type, imageUrl, fallbackColor, radius, itemName });
    state.totalMarbles++;
    saveState();
    updateMarbleCount();
    
    // Play add sound
    playAddSound();
    
    return marble;
}

// Create a cute marble texture using canvas
function createMarbleTexture(baseColor, size) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 1;
    
    // Create radial gradient for 3D marble effect
    const gradient = ctx.createRadialGradient(
        centerX * 0.7, centerY * 0.6, 0,
        centerX, centerY, radius
    );
    
    // Lighten and darken the base color for gradient
    const lighterColor = lightenColor(baseColor, 40);
    const darkerColor = darkenColor(baseColor, 30);
    
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.15, lighterColor);
    gradient.addColorStop(0.5, baseColor);
    gradient.addColorStop(1, darkerColor);
    
    // Draw the main marble
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add a subtle shine highlight
    const shineGradient = ctx.createRadialGradient(
        centerX * 0.5, centerY * 0.4, 0,
        centerX * 0.5, centerY * 0.4, radius * 0.4
    );
    shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.beginPath();
    ctx.arc(centerX * 0.6, centerY * 0.5, radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = shineGradient;
    ctx.fill();
    
    // Add a smaller secondary shine
    ctx.beginPath();
    ctx.arc(centerX * 0.4, centerY * 0.35, radius * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    
    return canvas.toDataURL();
}

// Restore marbles from saved state
function restoreMarbles() {
    const container = document.getElementById('jarContainer');
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const bounds = getJarBoundaries(width, height);
    const currentSize = getMarbleSize();
    
    state.marbles.forEach((marbleData, index) => {
        setTimeout(() => {
            const x = bounds.left + 20 + Math.random() * (bounds.right - bounds.left - 40);
            const y = bounds.top + 20 + (index * 2) % 60;
            
            const radius = currentSize / 2;
            const config = collectibles[marbleData.type];
            
            let renderOptions;
            
            // Check if this is a marble type (rendered with gradients)
            if (config && config.isMarble) {
                const textureUrl = createMarbleTexture(marbleData.fallbackColor, radius * 2);
                renderOptions = {
                    sprite: {
                        texture: textureUrl,
                        xScale: 1,
                        yScale: 1
                    }
                };
            } else {
                const cachedImage = imageCache[marbleData.imageUrl];
                if (cachedImage) {
                    renderOptions = {
                        sprite: {
                            texture: marbleData.imageUrl,
                            xScale: (radius * 2) / 128,
                            yScale: (radius * 2) / 128
                        }
                    };
                } else {
                    renderOptions = {
                        fillStyle: marbleData.fallbackColor || '#FF69B4',
                        strokeStyle: darkenColor(marbleData.fallbackColor || '#FF69B4', 20),
                        lineWidth: 2
                    };
                }
            }
            
            const marble = Bodies.circle(x, y, radius, {
                restitution: 0.6,
                friction: 0.05,
                frictionAir: 0.001,
                density: 0.001,
                render: renderOptions
            });
            
            marble.marbleType = marbleData.type;
            marble.marbleImage = marbleData.imageUrl;
            marble.marbleColor = marbleData.fallbackColor;
            let itemName = marbleData.itemName;
            if (!itemName && config) {
                const idx = config.images?.indexOf(marbleData.imageUrl);
                if (idx >= 0 && config.itemNames?.[idx]) itemName = config.itemNames[idx];
            }
            marble.itemName = itemName || '';
            
            Composite.add(engine.world, marble);
            marbleBodies.push(marble);
        }, index * 50);
    });
}

// Play sound when adding marble
function playAddSound() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.4);
}

// Update marble count display
function updateMarbleCount() {
    document.getElementById('marbleCount').textContent = state.totalMarbles;
}

// Update pending marbles display
function updatePendingDisplay() {
    const pendingBtn = document.getElementById('addPendingBtn');
    if (!pendingBtn) return;
    
    if (state.pendingMarbles > 0) {
        pendingBtn.classList.add('has-pending');
        pendingBtn.innerHTML = `<span class="pending-icon">✨</span> Add ${state.pendingMarbles} marble${state.pendingMarbles > 1 ? 's' : ''}!`;
    } else {
        pendingBtn.classList.remove('has-pending');
        pendingBtn.innerHTML = `<span class="pending-icon">💤</span> Complete habits to earn marbles`;
    }
}

// Add all pending marbles to the jar
function addPendingMarbles() {
    if (state.pendingMarbles <= 0) return;
    
    const count = state.pendingMarbles;
    state.pendingMarbles = 0;
    saveState();
    updatePendingDisplay();
    
    // Add marbles with a slight delay between each
    for (let i = 0; i < count; i++) {
        setTimeout(() => addMarble(), i * 200);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add habit button
    document.getElementById('addHabitBtn').addEventListener('click', showModal);
    
    // Modal buttons
    document.getElementById('modalCancel').addEventListener('click', hideModal);
    document.getElementById('modalConfirm').addEventListener('click', addHabit);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'modalOverlay') hideModal();
    });
    
    // Enter key in input
    document.getElementById('habitInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addHabit();
    });
    
    // Add pending marbles button
    document.getElementById('addPendingBtn').addEventListener('click', addPendingMarbles);
    
    // Settings button - open settings page
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('settingsBackBtn').addEventListener('click', closeSettings);
    document.getElementById('settingsResetBtn').addEventListener('click', () => {
        if (confirm('Empty your jar? This will remove all collected items.')) {
            clearAllMarbles();
        }
    });
}

// Open settings page
function openSettings() {
    document.getElementById('settingsPage').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close settings page
function closeSettings() {
    document.getElementById('settingsPage').classList.remove('active');
    document.body.style.overflow = '';
}

// Show add habit modal
function showModal() {
    if (state.habits.length >= 1) return;
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById('habitInput').focus();
}

// Increment times per day
function incrementTimes() {
    const input = document.getElementById('habitTimesInput');
    const current = parseInt(input.value) || 1;
    input.value = Math.min(99, current + 1);
}

// Decrement times per day
function decrementTimes() {
    const input = document.getElementById('habitTimesInput');
    const current = parseInt(input.value) || 1;
    input.value = Math.max(1, current - 1);
}

// Hide add habit modal
function hideModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('habitInput').value = '';
    const timesInput = document.getElementById('habitTimesInput');
    if (timesInput) timesInput.value = '1';
}

// Add a new habit
function addHabit() {
    if (state.habits.length >= 1) return;
    const input = document.getElementById('habitInput');
    const timesInput = document.getElementById('habitTimesInput');
    const name = input.value.trim();
    const timesPerDay = Math.max(1, parseInt(timesInput?.value) || 1);
    
    if (!name) return;
    
    state.habits.push({
        id: Date.now(),
        name: name,
        timesPerDay: timesPerDay,
        completedToday: 0
    });
    
    saveState();
    renderHabits();
    hideModal();
}

// Delete a habit
function deleteHabit(id) {
    state.habits = state.habits.filter(h => h.id !== id);
    saveState();
    renderHabits();
}

// Complete a habit (add to completion count)
function completeHabit(id) {
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;
    
    // Check if habit can still be completed today
    if (habit.completedToday < habit.timesPerDay) {
        habit.completedToday++;
        state.pendingMarbles++;
        saveState();
        renderHabits();
        updatePendingDisplay();
    }
}

// Undo last completion of a habit
function undoHabitCompletion(id) {
    const habit = state.habits.find(h => h.id === id);
    if (!habit || habit.completedToday <= 0) return;
    
    habit.completedToday--;
    if (state.pendingMarbles > 0) {
        state.pendingMarbles--;
    }
    saveState();
    renderHabits();
    updatePendingDisplay();
}

// Render habits list
function renderHabits() {
    const list = document.getElementById('habitsList');
    
    if (state.habits.length === 0) {
        const addBtn = document.getElementById('addHabitBtn');
        if (addBtn) addBtn.style.display = '';
        list.innerHTML = `
            <div class="empty-habits">
                <span>🌱</span>
                <p>Add your first habit to start collecting!</p>
            </div>
        `;
        return;
    }
    
    const addBtn = document.getElementById('addHabitBtn');
    if (addBtn) addBtn.style.display = state.habits.length >= 1 ? 'none' : '';
    
    list.innerHTML = state.habits.map(habit => {
        const isFullyCompleted = habit.completedToday >= habit.timesPerDay;
        const progress = habit.timesPerDay > 1 ? `${habit.completedToday}/${habit.timesPerDay}` : '';
        
        return `
            <div class="habit-item ${isFullyCompleted ? 'completed' : ''}" data-id="${habit.id}">
                <button class="habit-checkbox ${habit.completedToday > 0 ? 'has-progress' : ''}" 
                        onclick="completeHabit(${habit.id})" 
                        ${isFullyCompleted ? 'disabled' : ''}
                        aria-label="Complete ${escapeHtml(habit.name)}">
                    ${habit.completedToday > 0 ? '✓' : ''}
                </button>
                <div class="habit-info">
                    <span class="habit-name">${escapeHtml(habit.name)}</span>
                    ${progress ? `<span class="habit-progress">${progress}</span>` : ''}
                </div>
                ${habit.completedToday > 0 ? `<button class="habit-undo" onclick="undoHabitCompletion(${habit.id})" aria-label="Undo">↩</button>` : ''}
                <button class="habit-delete" onclick="deleteHabit(${habit.id})" aria-label="Delete ${escapeHtml(habit.name)}">×</button>
            </div>
        `;
    }).join('');
}

// Clear all marbles from the jar
function clearAllMarbles() {
    // Remove marble bodies from physics world
    marbleBodies.forEach(marble => {
        Composite.remove(engine.world, marble);
    });
    marbleBodies = [];
    
    // Clear state
    state.marbles = [];
    state.totalMarbles = 0;
    saveState();
    updateMarbleCount();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Handle window resize - Matter.js Render auto-updates canvas size; no additional logic needed
