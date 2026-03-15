// Matter.js setup
const { Engine, Render, Runner, Bodies, Body, Composite, Events, Query } = Matter;
const DEFAULT_JAR_CAPACITY = 100;
const MIN_JAR_CAPACITY = 10;
const MAX_JAR_CAPACITY = 500;

// App State
let state = {
    marbles: [],
    collectionHistory: {},
    collectibleType: 'marble',
    enabledCollectibles: [], // Populated on init; which types can appear when randomly adding
    totalMarbles: 0,
    jarCapacity: DEFAULT_JAR_CAPACITY,
    soundTheme: 'glass'
};

// Sound themes
const soundThemes = {
    glass: {
        name: 'Glass Marbles',
        icon: 'https://cdn-icons-png.flaticon.com/128/6835/6835786.png',
        description: 'Classic glass marble clinks',
        frequencies: { min: 2000, max: 4000 },
        waveform: 'sine',
        duration: 0.08
    },
    default: {
        name: 'Plinks',
        icon: 'https://cdn-icons-png.flaticon.com/128/1378/1378177.png',
        description: 'Soft chime based on collectible',
        type: 'collectible',
        waveform: 'sine'
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

const JAR_CLASS = 'jar-classic';
const IS_PREMIUM_BUILD = false;
const FREE_COLLECTIBLE_TYPE = 'marble';
const FREE_SOUND_THEME = 'glass';
const JAR_CAPACITY_SLIDER_STOPS = [10, 100, 200, 300, 400, 500];
const PREMIUM_PRICE_LABEL = '$0.99';
const PREMIUM_STORAGE_KEY = 'marbleJarPremiumUnlocked';

let isPremiumUnlocked = IS_PREMIUM_BUILD;

function isPremiumMode() {
    return IS_PREMIUM_BUILD || isPremiumUnlocked;
}

function isCollectiblesLocked() {
    return !isPremiumMode();
}

function isSoundThemesLocked() {
    return !isPremiumMode();
}

function isSyncEnabled() {
    return isPremiumMode();
}



function setPremiumUnlocked(nextValue) {
    isPremiumUnlocked = !!nextValue;
    try {
        localStorage.setItem(PREMIUM_STORAGE_KEY, isPremiumUnlocked ? 'true' : 'false');
    } catch (e) {
        console.warn('Failed to persist premium entitlement:', e);
    }
}

async function refreshPremiumEntitlement() {
    let localPremium = false;
    try {
        localPremium = localStorage.getItem(PREMIUM_STORAGE_KEY) === 'true';
    } catch (e) {
        console.warn('Failed to read stored premium entitlement:', e);
    }

    const rcPremium = await rcGetPremiumStatus();
    setPremiumUnlocked(localPremium || rcPremium || IS_PREMIUM_BUILD);
}

async function purchasePremiumUnlock() {
    try {
        const result = await rcPresentPaywall();
        if (result === 'PURCHASED' || result === 'NOT_PRESENTED') {
            await refreshPremiumEntitlement();
            enforcePlanRestrictions();
            saveState();
            renderPremiumSettings();
            renderCollectibles();
            renderSoundSettings();
            renderSyncUI();
            updateMarbleCount();
        }
    } catch (e) {
        alert(e?.message || 'Purchase was not completed.');
    }
}

async function restorePremiumPurchases() {
    try {
        const hasPremium = await rcRestorePurchases();
        await refreshPremiumEntitlement();
        enforcePlanRestrictions();
        saveState();
        renderPremiumSettings();
        renderCollectibles();
        renderSoundSettings();
        renderSyncUI();
        updateMarbleCount();
        if (hasPremium) {
            alert('Purchases restored. Premium is active!');
        } else {
            alert('No purchase found for this Apple ID.');
        }
    } catch (e) {
        alert(e?.message || 'Restore failed.');
    }
}


function renderPremiumSettings() {
    const statusEl = document.getElementById('premiumStatus');
    const buyBtn = document.getElementById('premiumBuyBtn');
    const restoreBtn = document.getElementById('premiumRestoreBtn');
    const customerCenterBtn = document.getElementById('premiumCustomerCenterBtn');
    const syncBtn = document.getElementById('premiumSyncBtn');
    if (!statusEl || !buyBtn || !restoreBtn) return;

    if (isPremiumMode()) {
        statusEl.textContent = 'Marble Jar Pro — active';
        buyBtn.style.display = 'none';
        restoreBtn.style.display = 'none';
        if (customerCenterBtn) customerCenterBtn.style.display = '';
        if (syncBtn) syncBtn.style.display = 'none';
    } else {
        statusEl.textContent = `Unlock Marble Jar Pro`;
        buyBtn.style.display = '';
        buyBtn.textContent = `Unlock Premium`;
        restoreBtn.style.display = '';
        if (customerCenterBtn) customerCenterBtn.style.display = 'none';
        if (syncBtn) syncBtn.style.display = '';
    }
}

function showPremiumUpsell() {
    purchasePremiumUnlock();
}

function getAllowedCollectibleTypes() {
    return isCollectiblesLocked() ? [FREE_COLLECTIBLE_TYPE] : Object.keys(collectibles);
}

function getAllowedSoundThemeEntries() {
    if (isSoundThemesLocked()) return [[FREE_SOUND_THEME, soundThemes[FREE_SOUND_THEME]]];
    return Object.entries(soundThemes);
}

function enforcePlanRestrictions() {
    if (isCollectiblesLocked()) {
        state.marbles = (state.marbles || []).map((marble) => {
            if (marble.type === FREE_COLLECTIBLE_TYPE) return marble;
            return {
                ...marble,
                type: FREE_COLLECTIBLE_TYPE,
                marbleType: FREE_COLLECTIBLE_TYPE,
                imageUrl: null
            };
        });
        state.collectibleType = FREE_COLLECTIBLE_TYPE;
        state.enabledCollectibles = [FREE_COLLECTIBLE_TYPE];
        state.totalMarbles = state.marbles.length;
    }
    if (isSoundThemesLocked()) {
        state.soundTheme = FREE_SOUND_THEME;
    }
}

// Audio context for sound effects
let audioCtx = null;

// Physics engine variables
let engine, render, runner;
let jarWalls = [];
let marbleBodies = [];
let restoreTimer = null;
let restoreMarbleTimers = [];
let viewportResizeTimer = null;
let pendingRestoreSignature = '';
let lastRestoredSignature = '';
let isJarZoomed = false;
let jarInspectAnimationFrame = null;
let jarInspectPanX = 0;
let jarInspectPanY = 0;
let jarInspectTransform = null;
const jarInspectScale = 3.1;
const jarInspectImageCache = {};
let zoomHintObserver = null;
let jarEdgeLookupCache = null;
let confirmDialogResolver = null;
let isJarOnlyMode = false;
let suppressJarClickUntil = 0;
let nextMarbleAudioId = 1;
const pairCollisionAudioCooldowns = new Map();
let audioCooldownCleanupFrame = 0;
let isSimulationPaused = false;

const CALM_LINEAR_SPEED = 0.03;
const CALM_ANGULAR_SPEED = 0.01;
const SPAWN_SETTLE_FRAMES = 18;
const DISPLAY_LERP = 0.26;
const DISPLAY_LERP_FRESH = 0.34;
const DISPLAY_SNAP_DISTANCE = 0.3;
const DISPLAY_SNAP_ANGLE = 0.02;
const DISC_GRAVITY_SCALE = 0.52;
const DISC_AIR_DAMPING = 0.91;
const DISC_BOUNCE = 0.04;
const DISC_PAIR_RESTITUTION = 0.02;
const DISC_PAIR_PASSES = 6;
const DISC_SEPARATION_EPSILON = 0.08;

const JAR_SHAPE = {
    neckLeft: 0.25,
    neckRight: 0.75,
    neckTop: 0.098,
    neckBottom: 0.102,
    shoulderLeft: 0.139024,
    shoulderRight: 0.860976,
    shoulderY: 0.30836,
    shoulderHandleInY: 0.26,
    shoulderHandleOutY: 0.45,
    bodyLeft: 0.139024,
    bodyRight: 0.860976,
    sideBottomY: 0.78,
    bottomLeft: 0.29,
    bottomRight: 0.71,
    bottomCurveY: 0.962
};

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
    const syncGroup = document.getElementById('syncGroup');
    if (!statusEl || !formEl) return;
    const syncBadge = document.getElementById('syncBadge');
    const setSyncBadge = (text, cls) => {
        if (!syncBadge) return;
        syncBadge.textContent = text;
        syncBadge.classList.remove('sync-in', 'sync-out', 'sync-off', 'sync-unknown');
        syncBadge.classList.add(cls);
    };

    if (!isSyncEnabled()) {
        if (syncGroup) syncGroup.style.display = 'none';
        if (syncBadge) syncBadge.style.display = 'none';
        statusEl.innerHTML = '';
        formEl.style.display = 'none';
        hintEl.textContent = '';
        return;
    }

    if (syncGroup) syncGroup.style.display = '';
    if (syncBadge) syncBadge.style.display = '';

    if (typeof Sync === 'undefined' || !Sync.isConfigured || !Sync.isConfigured()) {
        statusEl.innerHTML = '<p class="sync-hint">Add Supabase URL and anon key to sync-config.js to enable sync.</p>';
        formEl.style.display = 'none';
        setSyncBadge('Sync: Not Configured', 'sync-off');
        return;
    }

    Sync.getSession()
        .then(session => {
            if (session) {
                statusEl.innerHTML = `
                    <div class="sync-signed-in">
                        <span>Signed in as ${escapeHtml(session.user.email || 'user')}</span>
                        <button type="button" class="sync-sign-out-btn" id="syncSignOutBtn">Sign Out</button>
                    </div>
                `;
                formEl.style.display = 'none';
                hintEl.textContent = 'Your jar syncs across devices when you sign in.';
                setSyncBadge('Sync: Signed In', 'sync-in');
                statusEl.querySelector('#syncSignOutBtn')?.addEventListener('click', async () => {
                    await Sync.signOut();
                    onSyncAuthChange(false, null);
                });
            } else {
                statusEl.innerHTML = '';
                formEl.style.display = 'block';
                hintEl.textContent = 'Sign in to sync your jar across devices.';
                setSyncBadge('Sync: Signed Out', 'sync-out');
                const signInBtn = document.getElementById('syncSignInBtn');
                const signUpBtn = document.getElementById('syncSignUpBtn');
                if (signInBtn && !signInBtn._bound) { signInBtn._bound = true; signInBtn.addEventListener('click', handleSignIn); }
                if (signUpBtn && !signUpBtn._bound) { signUpBtn._bound = true; signUpBtn.addEventListener('click', handleSignUp); }
            }
        })
        .catch((err) => {
            console.warn('Failed to resolve sync session state:', err);
            statusEl.innerHTML = '';
            formEl.style.display = 'block';
            hintEl.textContent = 'Sign in to sync your jar across devices.';
            setSyncBadge('Sync: Signed Out', 'sync-out');
            const signInBtn = document.getElementById('syncSignInBtn');
            const signUpBtn = document.getElementById('syncSignUpBtn');
            if (signInBtn && !signInBtn._bound) { signInBtn._bound = true; signInBtn.addEventListener('click', handleSignIn); }
            if (signUpBtn && !signUpBtn._bound) { signUpBtn._bound = true; signUpBtn.addEventListener('click', handleSignUp); }
        });
}

async function handleSignIn() {
    if (!isSyncEnabled()) return;
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
    if (!isSyncEnabled()) return;
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
    if (!isSyncEnabled()) return;
    renderSyncUI();
    if (signedIn) {
        Sync.pullState().then(remote => {
            if (remote && remote.data) {
                applyStateData(remote.data);
                saveState();
                applyJarType();
                rebuildPhysics();
                updateMarbleCount();
            }
        });
    }
}

// Initialize the app
async function init() {
    preloadImages();
    await rcInit();
    await refreshPremiumEntitlement();
    loadState();
    if (isSyncEnabled() && typeof Sync !== 'undefined' && Sync.isConfigured && Sync.isConfigured()) {
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
    updateJarSvgPaths();
    setupPhysics();
    setupEventListeners();
    setJarZoom(false);
    renderCollectibles();
    renderSoundSettings();
    renderPremiumSettings();
    renderSyncUI();
    updateMarbleCount();
    window.onSyncAuthChange = onSyncAuthChange;

    // Show premium upsell if redirected from collection page locked item
    try {
        if (sessionStorage.getItem('showPremiumUpsell') === '1') {
            sessionStorage.removeItem('showPremiumUpsell');
            if (!isPremiumMode()) setTimeout(() => {
                document.getElementById('settingsBtn')?.click();
                setTimeout(showPremiumUpsell, 400);
            }, 600);
        }
    } catch (_) {}

    // Delay collectible restoration briefly after physics init.
    scheduleRestoreMarbles(500);

    window.addEventListener('resize', () => {
        if (viewportResizeTimer) clearTimeout(viewportResizeTimer);
        viewportResizeTimer = setTimeout(() => {
            updateJarSvgPaths();
            if (!engine || marbleBodies.length === 0) return;
            resizeExistingMarbles();
            checkMarbleBounds();
        }, 120);
    });
}

// Apply jar type CSS class
function applyJarType() {
    const container = document.getElementById('jarContainer');
    if (!container) return;
    container.classList.add(JAR_CLASS);
}

function getJarGeometry(width, height) {
    const px = (v) => width * v;
    const py = (v) => height * v;
    const roundness = 0.86;
    const shoulderDelta = Math.max(0.03, JAR_SHAPE.shoulderY - JAR_SHAPE.neckBottom);
    const shoulderC1Y = JAR_SHAPE.neckBottom + shoulderDelta * (0.26 + 0.18 * roundness);
    const shoulderC2Y = JAR_SHAPE.neckBottom + shoulderDelta * (0.68 + 0.26 * roundness);
    const shoulderC1X = JAR_SHAPE.neckLeft - (0.03 + 0.04 * roundness);
    const shoulderC2X = JAR_SHAPE.shoulderLeft;
    const sideBow = 0;
    const lowerY1 = JAR_SHAPE.sideBottomY + (JAR_SHAPE.bottomCurveY - JAR_SHAPE.sideBottomY) * 0.55;
    const lowerY2 = JAR_SHAPE.sideBottomY + (JAR_SHAPE.bottomCurveY - JAR_SHAPE.sideBottomY) * 0.98;
    const lowerX1 = JAR_SHAPE.bodyLeft + (JAR_SHAPE.bottomLeft - JAR_SHAPE.bodyLeft) * 0.0;
    const lowerX2 = JAR_SHAPE.bodyLeft + (JAR_SHAPE.bottomLeft - JAR_SHAPE.bodyLeft) * 0.45;
    return {
        neckLeftX: px(JAR_SHAPE.neckLeft),
        neckRightX: px(JAR_SHAPE.neckRight),
        neckTopY: py(JAR_SHAPE.neckTop),
        neckBottomY: py(JAR_SHAPE.neckBottom),
        shoulderLeftX: px(JAR_SHAPE.shoulderLeft),
        shoulderRightX: px(JAR_SHAPE.shoulderRight),
        shoulderY: py(JAR_SHAPE.shoulderY),
        bodyLeftX: px(JAR_SHAPE.bodyLeft),
        bodyRightX: px(JAR_SHAPE.bodyRight),
        sideBottomY: py(JAR_SHAPE.sideBottomY),
        bottomLeftX: px(JAR_SHAPE.bottomLeft),
        bottomRightX: px(JAR_SHAPE.bottomRight),
        bottomCurveY: py(JAR_SHAPE.bottomCurveY),
        leftShoulderC1X: px(shoulderC1X),
        leftShoulderC1Y: py(shoulderC1Y),
        leftShoulderC2X: px(JAR_SHAPE.shoulderLeft),
        leftShoulderC2Y: py(JAR_SHAPE.shoulderHandleInY),
        leftBodyC1X: px(JAR_SHAPE.bodyLeft),
        leftBodyC1Y: py(JAR_SHAPE.shoulderHandleOutY),
        leftBodyC2X: px(JAR_SHAPE.bodyLeft - sideBow * 0.6),
        leftBodyC2Y: py(JAR_SHAPE.shoulderY + (JAR_SHAPE.sideBottomY - JAR_SHAPE.shoulderY) * 0.78),
        leftLowerC1X: px(lowerX1),
        leftLowerC1Y: py(lowerY1),
        leftLowerC2X: px(lowerX2),
        leftLowerC2Y: py(lowerY2),
        rightShoulderC1X: px(JAR_SHAPE.shoulderRight),
        rightShoulderC1Y: py(JAR_SHAPE.shoulderHandleInY),
        rightShoulderC2X: px(1 - shoulderC1X),
        rightShoulderC2Y: py(shoulderC1Y),
        rightBodyC1X: px(JAR_SHAPE.bodyRight),
        rightBodyC1Y: py(JAR_SHAPE.shoulderHandleOutY),
        rightBodyC2X: px(JAR_SHAPE.bodyRight + sideBow * 0.6),
        rightBodyC2Y: py(JAR_SHAPE.shoulderY + (JAR_SHAPE.sideBottomY - JAR_SHAPE.shoulderY) * 0.78),
        rightLowerC1X: px(1 - lowerX1),
        rightLowerC1Y: py(lowerY1),
        rightLowerC2X: px(1 - lowerX2),
        rightLowerC2Y: py(lowerY2)
    };
}

function getCubicPoint(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    return {
        x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
        y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y
    };
}

function interpolateXAtY(samples, y) {
    if (!samples || samples.length === 0) return 0;
    if (y <= samples[0].y) return samples[0].x;
    const last = samples[samples.length - 1];
    if (y >= last.y) return last.x;
    for (let i = 1; i < samples.length; i += 1) {
        const a = samples[i - 1];
        const b = samples[i];
        if (y > b.y) continue;
        const dy = b.y - a.y;
        if (Math.abs(dy) < 0.0001) return Math.min(a.x, b.x);
        const t = (y - a.y) / dy;
        return a.x + (b.x - a.x) * t;
    }
    return last.x;
}

function getJarEdgeLookup(width, height) {
    if (
        jarEdgeLookupCache &&
        Math.abs(jarEdgeLookupCache.width - width) < 0.1 &&
        Math.abs(jarEdgeLookupCache.height - height) < 0.1
    ) {
        return jarEdgeLookupCache;
    }

    const g = getJarGeometry(width, height);
    const steps = 36;
    const left = [{ x: g.neckLeftX, y: g.neckTopY }, { x: g.neckLeftX, y: g.neckBottomY }];
    const right = [{ x: g.neckRightX, y: g.neckTopY }, { x: g.neckRightX, y: g.neckBottomY }];
    const sampleCubic = (p0, p1, p2, p3, out) => {
        for (let i = 1; i <= steps; i += 1) {
            out.push(getCubicPoint(p0, p1, p2, p3, i / steps));
        }
    };

    sampleCubic(
        { x: g.neckLeftX, y: g.neckBottomY },
        { x: g.leftShoulderC1X, y: g.leftShoulderC1Y },
        { x: g.leftShoulderC2X, y: g.leftShoulderC2Y },
        { x: g.shoulderLeftX, y: g.shoulderY },
        left
    );
    sampleCubic(
        { x: g.shoulderLeftX, y: g.shoulderY },
        { x: g.leftBodyC1X, y: g.leftBodyC1Y },
        { x: g.leftBodyC2X, y: g.leftBodyC2Y },
        { x: g.bodyLeftX, y: g.sideBottomY },
        left
    );
    sampleCubic(
        { x: g.bodyLeftX, y: g.sideBottomY },
        { x: g.leftLowerC1X, y: g.leftLowerC1Y },
        { x: g.leftLowerC2X, y: g.leftLowerC2Y },
        { x: g.bottomLeftX, y: g.bottomCurveY },
        left
    );
    sampleCubic(
        { x: g.neckRightX, y: g.neckBottomY },
        { x: g.rightShoulderC2X, y: g.rightShoulderC2Y },
        { x: g.rightShoulderC1X, y: g.rightShoulderC1Y },
        { x: g.shoulderRightX, y: g.shoulderY },
        right
    );
    sampleCubic(
        { x: g.shoulderRightX, y: g.shoulderY },
        { x: g.rightBodyC1X, y: g.rightBodyC1Y },
        { x: g.rightBodyC2X, y: g.rightBodyC2Y },
        { x: g.bodyRightX, y: g.sideBottomY },
        right
    );
    sampleCubic(
        { x: g.bodyRightX, y: g.sideBottomY },
        { x: g.rightLowerC1X, y: g.rightLowerC1Y },
        { x: g.rightLowerC2X, y: g.rightLowerC2Y },
        { x: g.bottomRightX, y: g.bottomCurveY },
        right
    );

    left.sort((a, b) => a.y - b.y);
    right.sort((a, b) => a.y - b.y);
    jarEdgeLookupCache = { width, height, left, right };
    return jarEdgeLookupCache;
}

function buildShoulderSegmentWalls(g, wallOptions, wallThickness) {
    const segments = [];
    const sideThickness = wallThickness / 2.1;
    const steps = 8;

    const leftP0 = { x: g.neckLeftX, y: g.neckBottomY };
    const leftP1 = { x: g.leftShoulderC1X, y: g.leftShoulderC1Y };
    const leftP2 = { x: g.leftShoulderC2X, y: g.leftShoulderC2Y };
    const leftP3 = { x: g.shoulderLeftX, y: g.shoulderY };

    const rightP0 = { x: g.shoulderRightX, y: g.shoulderY };
    const rightP1 = { x: g.rightShoulderC1X, y: g.rightShoulderC1Y };
    const rightP2 = { x: g.rightShoulderC2X, y: g.rightShoulderC2Y };
    const rightP3 = { x: g.neckRightX, y: g.neckBottomY };

    const addCurveSegments = (p0, p1, p2, p3) => {
        let prev = getCubicPoint(p0, p1, p2, p3, 0);
        for (let i = 1; i <= steps; i += 1) {
            const t = i / steps;
            const next = getCubicPoint(p0, p1, p2, p3, t);
            const dx = next.x - prev.x;
            const dy = next.y - prev.y;
            const length = Math.max(20, Math.hypot(dx, dy) + 8);
            const angle = Math.atan2(dy, dx);
            segments.push(Bodies.rectangle(
                (prev.x + next.x) / 2,
                (prev.y + next.y) / 2,
                length,
                sideThickness,
                { ...wallOptions, angle }
            ));
            prev = next;
        }
    };

    addCurveSegments(leftP0, leftP1, leftP2, leftP3);
    addCurveSegments(rightP0, rightP1, rightP2, rightP3);
    return segments;
}

function buildJarPathData(width, height, closed = false) {
    const g = getJarGeometry(width, height);
    const d = [
        `M${g.neckLeftX} ${g.neckTopY}`,
        `L${g.neckLeftX} ${g.neckBottomY}`,
        `C${g.leftShoulderC1X} ${g.leftShoulderC1Y} ${g.leftShoulderC2X} ${g.leftShoulderC2Y} ${g.shoulderLeftX} ${g.shoulderY}`,
        `C${g.leftBodyC1X} ${g.leftBodyC1Y} ${g.leftBodyC2X} ${g.leftBodyC2Y} ${g.bodyLeftX} ${g.sideBottomY}`,
        `C${g.leftLowerC1X} ${g.leftLowerC1Y} ${g.leftLowerC2X} ${g.leftLowerC2Y} ${g.bottomLeftX} ${g.bottomCurveY}`,
        `L${g.bottomRightX} ${g.bottomCurveY}`,
        `C${g.rightLowerC2X} ${g.rightLowerC2Y} ${g.rightLowerC1X} ${g.rightLowerC1Y} ${g.bodyRightX} ${g.sideBottomY}`,
        `C${g.rightBodyC2X} ${g.rightBodyC2Y} ${g.rightBodyC1X} ${g.rightBodyC1Y} ${g.shoulderRightX} ${g.shoulderY}`,
        `C${g.rightShoulderC1X} ${g.rightShoulderC1Y} ${g.rightShoulderC2X} ${g.rightShoulderC2Y} ${g.neckRightX} ${g.neckBottomY}`,
        `L${g.neckRightX} ${g.neckTopY}`
    ];
    if (closed) d.push('Z');
    return d.join(' ');
}

function traceJarCanvasPath(ctx, width, height) {
    const g = getJarGeometry(width, height);
    ctx.moveTo(g.neckLeftX, g.neckTopY);
    ctx.lineTo(g.neckLeftX, g.neckBottomY);
    ctx.bezierCurveTo(g.leftShoulderC1X, g.leftShoulderC1Y, g.leftShoulderC2X, g.leftShoulderC2Y, g.shoulderLeftX, g.shoulderY);
    ctx.bezierCurveTo(g.leftBodyC1X, g.leftBodyC1Y, g.leftBodyC2X, g.leftBodyC2Y, g.bodyLeftX, g.sideBottomY);
    ctx.bezierCurveTo(g.leftLowerC1X, g.leftLowerC1Y, g.leftLowerC2X, g.leftLowerC2Y, g.bottomLeftX, g.bottomCurveY);
    ctx.lineTo(g.bottomRightX, g.bottomCurveY);
    ctx.bezierCurveTo(g.rightLowerC2X, g.rightLowerC2Y, g.rightLowerC1X, g.rightLowerC1Y, g.bodyRightX, g.sideBottomY);
    ctx.bezierCurveTo(g.rightBodyC2X, g.rightBodyC2Y, g.rightBodyC1X, g.rightBodyC1Y, g.shoulderRightX, g.shoulderY);
    ctx.bezierCurveTo(g.rightShoulderC1X, g.rightShoulderC1Y, g.rightShoulderC2X, g.rightShoulderC2Y, g.neckRightX, g.neckBottomY);
    ctx.lineTo(g.neckRightX, g.neckTopY);
    ctx.closePath();
}

function updateJarSvgPaths() {
    const container = document.getElementById('jarContainer');
    if (!container) return;
    const width = container.offsetWidth || 304;
    const height = container.offsetHeight || 390;
    const fillSvg = container.querySelector('.jar-fill-full');
    const fillPath = fillSvg?.querySelector('path');
    const outlineSvg = container.querySelector('.jar-outline-full');
    const outlinePath = outlineSvg?.querySelector('path');
    const outlineD = buildJarPathData(width, height, false);
    const fillD = buildJarPathData(width, height, true);
    if (fillSvg) fillSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    if (outlineSvg) outlineSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    if (fillPath) fillPath.setAttribute('d', fillD);
    if (outlinePath) outlinePath.setAttribute('d', outlineD);
    const mouthWidthPct = (JAR_SHAPE.neckRight - JAR_SHAPE.neckLeft) * 100;
    const lidWidth = Math.max(38, Math.min(72, mouthWidthPct + 8));
    container.style.setProperty('--lid-width', `${lidWidth}%`);

    const existingDebug = container.querySelector('.jar-debug-points');
    if (existingDebug) existingDebug.remove();
}

// Get collectible size from jar geometry, tuned so ~100 pieces fill near the top.
function getMarbleSize() {
    const targetFillCount = Math.max(1, state.jarCapacity || DEFAULT_JAR_CAPACITY);
    const container = document.getElementById('jarContainer');
    if (!container) return 20;

    const width = container.offsetWidth || 280;
    const height = container.offsetHeight || 350;
    const bounds = getJarBoundaries(width, height);

    const interiorWidth = Math.max(20, bounds.right - bounds.left - 8);
    const interiorHeight = Math.max(20, bounds.bottom - bounds.top - 8);
    let usableArea = interiorWidth * interiorHeight;

    usableArea *= 0.84;

    // Approximate settled packing fill factor.
    const packingFill = 0.76;
    const areaPerItem = (usableArea * packingFill) / Math.max(1, targetFillCount);
    const diameter = Math.sqrt((4 * areaPerItem) / Math.PI);

    return Math.max(10, Math.min(44, diameter));
}

// Resize existing marbles
function resizeExistingMarbles() {
    const newSize = getMarbleSize();
    const newRadius = newSize / 2;
    
    marbleBodies.forEach((marble, index) => {
        const previousRadius = marble.circleRadius || newRadius;
        const scale = newRadius / previousRadius;
        Body.scale(marble, scale, scale);
        
        if (marble.render.sprite) {
            const config = collectibles[marble.marbleType];
            if (config?.isMarble && marble.marbleColor) {
                const refreshedTextureSize = getMarbleTextureResolution(newRadius * 2);
                marble.render.sprite.texture = createMarbleTexture(marble.marbleColor, refreshedTextureSize, {
                    marbleType: marble.marbleType,
                    itemName: marble.itemName
                });
                marble._spriteBaseSize = refreshedTextureSize;
                marble.marbleImage = marble.render.sprite.texture;
            }
            const baseSize = marble._spriteBaseSize || 128;
            const visualScale = (newRadius * 2) / baseSize;
            marble.render.sprite.xScale = visualScale;
            marble.render.sprite.yScale = visualScale;
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
        const isLocked = isSoundThemesLocked() && key !== FREE_SOUND_THEME;
        const isSelected = state.soundTheme === key;
        const label = theme.icon
            ? `<img class="sound-option-icon" src="${theme.icon}" alt="">${escapeHtml(theme.name)}`
            : escapeHtml(theme.name);
        return `<label class="sound-option ${isSelected ? 'active' : ''} ${isLocked ? 'premium-locked' : ''}" 
                title="${escapeHtml(theme.description || '')}">
            <input 
                type="radio" 
                name="soundTheme"
                class="sound-option-radio ${key === FREE_SOUND_THEME ? 'free-theme-radio' : ''}"
                value="${escapeHtml(key)}"
                ${isSelected ? 'checked' : ''}
                ${isLocked ? 'disabled' : ''}>
            <span class="sound-option-content">${label}</span>
        </label>`;
    }).join('');
    
    soundPicker.querySelectorAll('.sound-option.premium-locked').forEach(label => {
        label.addEventListener('click', () => showPremiumUpsell());
    });
    soundPicker.querySelectorAll('.sound-option-radio').forEach(input => {
        input.addEventListener('change', () => {
            const option = input.closest('.sound-option');
            if (!input.checked || option?.classList.contains('premium-locked')) return;
            soundPicker.querySelectorAll('.sound-option').forEach(o => o.classList.remove('active'));
            option?.classList.add('active');
            state.soundTheme = input.value;
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
    scheduleRestoreMarbles(100);
}

// Apply parsed/remote state to app state (with migration)
function applyStateData(parsed) {
    if (!parsed) return;
    const typeMap = {
        ocean: 'seaLife',
        gemMarbles: 'marble'
    };
    const normalizeType = (type) => typeMap[type] || type;
    const allTypes = getAllowedCollectibleTypes();
    state.marbles = (parsed.marbles || []).map(marble => ({
        ...marble,
        type: normalizeType(marble.type),
        // Strip stored data URLs — they're regenerated at runtime and bloat localStorage
        imageUrl: (marble.imageUrl && marble.imageUrl.startsWith('data:')) ? '' : (marble.imageUrl || '')
    }));
    state.collectibleType = normalizeType(parsed.collectibleType || 'marble');
    state.enabledCollectibles = Array.isArray(parsed.enabledCollectibles)
        ? [...new Set(parsed.enabledCollectibles.map(normalizeType))].filter(k => collectibles[k] && allTypes.includes(k))
        : allTypes;
    state.collectionHistory = {};
    if (parsed.collectionHistory && typeof parsed.collectionHistory === 'object') {
        Object.entries(parsed.collectionHistory).forEach(([rawKey, count]) => {
            if (typeof count !== 'number' || count <= 0) return;
            const [rawType, rawIndex] = rawKey.split('::');
            const normalizedType = normalizeType(rawType);
            const key = rawIndex == null ? normalizedType : `${normalizedType}::${rawIndex}`;
            state.collectionHistory[key] = (state.collectionHistory[key] || 0) + count;
        });
    }
    state.totalMarbles = state.marbles.length;
    const parsedCapacity = parsed.jarCapacity;
    const migratedCapacity = (parsedCapacity == null || parsedCapacity === 50)
        ? DEFAULT_JAR_CAPACITY
        : parsedCapacity;
    state.jarCapacity = clampJarCapacity(migratedCapacity);
    state.soundTheme = parsed.soundTheme || FREE_SOUND_THEME;

    // Backfill history from current marbles for older saves and keep it inclusive.
    const inferredHistory = buildCollectionHistoryFromMarbles(state.marbles);
    Object.entries(inferredHistory).forEach(([key, count]) => {
        state.collectionHistory[key] = Math.max(state.collectionHistory[key] || 0, count);
    });

    if (state.marbles.length > state.jarCapacity) {
        state.marbles = state.marbles.slice(0, state.jarCapacity);
        state.totalMarbles = state.marbles.length;
    }

    enforcePlanRestrictions();
}

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem('marbleJarState');
    let parsed = false;
    if (saved) {
        try {
            applyStateData(JSON.parse(saved));
            parsed = true;
        } catch (e) {
            console.warn('Failed to parse saved state', e);
        }
    }
    if (!parsed && state.enabledCollectibles.length === 0) {
        state.enabledCollectibles = getAllowedCollectibleTypes();
    }
    enforcePlanRestrictions();
}

// Save state to localStorage (and push to sync if signed in)
function saveState() {
    enforcePlanRestrictions();
    localStorage.setItem('marbleJarState', JSON.stringify(state));
    if (isSyncEnabled() && typeof Sync !== 'undefined' && Sync.isConfigured && Sync.isConfigured()) {
        Sync.getSession().then(session => {
            if (session) Sync.pushState(state);
        });
    }
}

function clampJarCapacity(value) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return DEFAULT_JAR_CAPACITY;
    return Math.max(MIN_JAR_CAPACITY, Math.min(MAX_JAR_CAPACITY, n));
}

function snapJarCapacitySliderValue(value) {
    const numeric = clampJarCapacity(value);
    let best = JAR_CAPACITY_SLIDER_STOPS[0];
    let bestDistance = Math.abs(numeric - best);
    for (let i = 1; i < JAR_CAPACITY_SLIDER_STOPS.length; i += 1) {
        const stop = JAR_CAPACITY_SLIDER_STOPS[i];
        const distance = Math.abs(numeric - stop);
        if (distance < bestDistance) {
            best = stop;
            bestDistance = distance;
        }
    }
    return best;
}

function getMarbleVariantIndexByData(type, itemName, fallbackColor, imageUrl) {
    const config = collectibles[type];
    if (!config || !config.isMarble) return -1;
    if (itemName && Array.isArray(config.itemNames)) {
        const byName = config.itemNames.indexOf(itemName);
        if (byName >= 0) return byName;
    }
    const normalizedColor = String(fallbackColor || '').toLowerCase();
    if (normalizedColor && Array.isArray(config.fallbackColors)) {
        const byColor = config.fallbackColors.findIndex(c => String(c || '').toLowerCase() === normalizedColor);
        if (byColor >= 0) return byColor;
    }
    const byImage = Array.isArray(config.images) ? config.images.indexOf(imageUrl || '') : -1;
    if (byImage >= 0) return byImage;
    return 0;
}

function buildCollectionHistoryFromMarbles(marbles) {
    const history = {};
    (marbles || []).forEach((marble) => {
        const config = collectibles[marble.type];
        if (!config) return;
        if (config.isMarble) {
            history[marble.type] = (history[marble.type] || 0) + 1;
            const variantIndex = getMarbleVariantIndexByData(
                marble.type,
                marble.itemName,
                marble.fallbackColor,
                marble.imageUrl
            );
            if (variantIndex >= 0) {
                const variantKey = `${marble.type}::${variantIndex}`;
                history[variantKey] = (history[variantKey] || 0) + 1;
            }
            return;
        }

        const key = marble.imageUrl || marble.type;
        history[key] = (history[key] || 0) + 1;
    });
    return history;
}

function recordCollectedHistory(type, itemName, fallbackColor, imageUrl) {
    const config = collectibles[type];
    if (!config) return;
    if (!state.collectionHistory || typeof state.collectionHistory !== 'object') {
        state.collectionHistory = {};
    }

    if (config.isMarble) {
        state.collectionHistory[type] = (state.collectionHistory[type] || 0) + 1;
        const variantIndex = getMarbleVariantIndexByData(type, itemName, fallbackColor, imageUrl);
        if (variantIndex >= 0) {
            const variantKey = `${type}::${variantIndex}`;
            state.collectionHistory[variantKey] = (state.collectionHistory[variantKey] || 0) + 1;
        }
        return;
    }

    const key = imageUrl || type;
    state.collectionHistory[key] = (state.collectionHistory[key] || 0) + 1;
}

// Render collectible options
function renderCollectibles() {
    const picker = document.getElementById('collectiblePicker');
    if (!picker) return;
    const disableCollectibleSelection = isCollectiblesLocked();
    picker.innerHTML = Object.entries(collectibles).map(([key, config]) => {
        const isPremiumLocked = disableCollectibleSelection && key !== FREE_COLLECTIBLE_TYPE;
        const isSelectionDisabled = disableCollectibleSelection;
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
        return `<label class="collectible-option ${state.collectibleType === key ? 'active' : ''} ${enabled ? 'enabled' : ''} ${isPremiumLocked ? 'premium-locked' : ''} ${isSelectionDisabled ? 'free-locked' : ''}" data-type="${key}">
            <input type="checkbox" class="collectible-option-checkbox" ${enabled ? 'checked' : ''} ${isSelectionDisabled ? 'disabled' : ''}>
            <span class="collectible-option-content">${icon}<span class="collectible-option-label">${label}</span></span>
        </label>`;
    }).join('');
    
    picker.querySelectorAll('.collectible-option-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const option = cb.closest('.collectible-option');
            if (option?.classList.contains('premium-locked') || option?.classList.contains('free-locked')) {
                cb.checked = false;
                showPremiumUpsell();
                return;
            }
            e.stopPropagation();
            const key = option.dataset.type;
            if (cb.checked) {
                if (!state.enabledCollectibles.includes(key)) state.enabledCollectibles.push(key);
            } else {
                state.enabledCollectibles = state.enabledCollectibles.filter(k => k !== key);
            }
            option.classList.toggle('enabled', cb.checked);
            saveState();
        });
    });
    
    picker.querySelectorAll('.collectible-option-content').forEach(span => {
        span.addEventListener('click', (e) => {
            e.preventDefault();
            const option = span.closest('.collectible-option');
            if (option?.classList.contains('premium-locked') || option?.classList.contains('free-locked')) { showPremiumUpsell(); return; }
            const checkbox = option.querySelector('.collectible-option-checkbox');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
            picker.querySelectorAll('.collectible-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            state.collectibleType = option.dataset.type;
            saveState();
        });
    });
}

function setAllCollectiblesEnabled(enabled) {
    if (isCollectiblesLocked()) {
        state.enabledCollectibles = [FREE_COLLECTIBLE_TYPE];
        state.collectibleType = FREE_COLLECTIBLE_TYPE;
        saveState();
        renderCollectibles();
        return;
    }
    const allTypes = getAllowedCollectibleTypes();
    state.enabledCollectibles = enabled ? [...allTypes] : [];

    const picker = document.getElementById('collectiblePicker');
    if (picker) {
        picker.querySelectorAll('.collectible-option').forEach((option) => {
            const checkbox = option.querySelector('.collectible-option-checkbox');
            if (!checkbox) return;
            checkbox.checked = enabled;
            option.classList.toggle('enabled', enabled);
        });
    }

    saveState();
}

// Get classic jar boundaries.
function getJarBoundaries(width, height) {
    const g = getJarGeometry(width, height);
    return {
        left: g.bodyLeftX,
        right: g.bodyRightX,
        top: g.neckBottomY,
        bottom: g.bottomCurveY,
        curveRadius: Math.max(12, g.bottomLeftX - g.bodyLeftX),
        shape: 'classic'
    };
}

function getJarNeckBounds(width, height) {
    const g = getJarGeometry(width, height);
    return {
        left: g.neckLeftX,
        right: g.neckRightX,
        centerX: (g.neckLeftX + g.neckRightX) / 2,
        shoulderTop: g.neckBottomY,
        shoulderBottom: g.shoulderY
    };
}

// Setup Matter.js physics
function setupPhysics() {
    const canvas = document.getElementById('jarCanvas');
    const container = document.getElementById('jarContainer');
    
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    
    canvas.width = width;
    canvas.height = height;
    
    // Reset wall cache when rebuilding physics on resize/reinit.
    jarWalls = [];

    engine = Engine.create({
        gravity: { x: 0, y: 0.95 },
        enableSleeping: true,
        positionIterations: 18,
        velocityIterations: 14,
        constraintIterations: 4
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
            showSleeping: false,
            pixelRatio: window.devicePixelRatio || 1,
            hasBounds: false
        }
    });
    
    // Get classic jar boundaries.
    const bounds = getJarBoundaries(width, height);
    const { left: jarLeft, right: jarRight, top: jarTop, bottom: jarBottom } = bounds;
    
    // Create jar walls (invisible boundaries matching the jar shape)
    const wallOptions = {
        isStatic: true,
        render: { visible: false },
        friction: 0.02,
        frictionStatic: 0.05,
        restitution: 0
    };
    
    const wallThickness = 30;
    const centerX = width / 2;
    const g = getJarGeometry(width, height);
    
    const sideHeight = jarBottom - g.shoulderY + 30;
    const sideY = g.shoulderY + sideHeight / 2 - 15;
    jarWalls.push(Bodies.rectangle(jarLeft - wallThickness / 2, sideY, wallThickness, sideHeight, wallOptions));
    jarWalls.push(Bodies.rectangle(jarRight + wallThickness / 2, sideY, wallThickness, sideHeight, wallOptions));
    jarWalls.push(Bodies.rectangle(centerX, jarBottom + wallThickness / 2, jarRight - jarLeft + 40, wallThickness, wallOptions));
    const neck = getJarNeckBounds(width, height);
    jarWalls.push(Bodies.rectangle(centerX, jarTop - wallThickness / 2, neck.right - neck.left + 16, wallThickness, wallOptions));
    const neckHeight = Math.max(10, g.neckBottomY - g.neckTopY + 6);
    const neckMidY = (g.neckTopY + g.neckBottomY) / 2;
    jarWalls.push(Bodies.rectangle(g.neckLeftX - wallThickness / 4, neckMidY, wallThickness / 2, neckHeight, wallOptions));
    jarWalls.push(Bodies.rectangle(g.neckRightX + wallThickness / 4, neckMidY, wallThickness / 2, neckHeight, wallOptions));
    jarWalls.push(...buildShoulderSegmentWalls(g, wallOptions, wallThickness));
    
    Composite.add(engine.world, jarWalls);
    
    // Check for escaped marbles every frame
    Events.on(engine, 'afterUpdate', checkMarbleBounds);
    // Hard-clip rendered content to the jar interior so nothing can be visible outside the outline.
    Events.on(render, 'afterRender', () => {
        if (!render?.context) return;
        const containerEl = document.getElementById('jarContainer');
        const clipW = containerEl?.offsetWidth || width;
        const clipH = containerEl?.offsetHeight || height;
        const ctx = render.context;
        renderJarMarbles(ctx, clipW, clipH);
        ctx.save();
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        traceJarCanvasPath(ctx, clipW, clipH);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
    });
    
    // Start the engine and renderer
    runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);
    
    // Setup shake/drag interaction
    setupShakeInteraction();

    // Click/tap collectible for detail modal
    setupMarbleZoom(canvas);
}

function wakeMarble(marble) {
    marble._spawnFrames = Math.max(marble._spawnFrames || 0, 6);
    marble._sleepFrames = 0;
}

function wakeAllMarbles() {
    marbleBodies.forEach(wakeMarble);
    resumeSimulation();
}

function pauseSimulation() {
    if (isSimulationPaused) return;
    isSimulationPaused = true;
    if (runner) runner.enabled = false;
    Render.stop(render);
    if (jarInspectAnimationFrame) {
        cancelAnimationFrame(jarInspectAnimationFrame);
        jarInspectAnimationFrame = null;
    }
    // Draw one final settled frame so the canvas isn't blank
    requestAnimationFrame(() => {
        if (!render?.context) return;
        Render.world(render);
        const containerEl = document.getElementById('jarContainer');
        const clipW = containerEl?.offsetWidth || 280;
        const clipH = containerEl?.offsetHeight || 350;
        const ctx = render.context;
        renderJarMarbles(ctx, clipW, clipH);
        ctx.save();
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        traceJarCanvasPath(ctx, clipW, clipH);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
    });
}

function resumeSimulation() {
    if (!isSimulationPaused) return;
    isSimulationPaused = false;
    if (runner) runner.enabled = true;
    Render.run(render);
}

function computeClampState(marble, edgeLookup, bounds) {
    const pos = marble.position;
    const radius = marble.circleRadius || getMarbleSize() / 2;
    const innerPad = 3;
    const cornerSafetyPad = 4;
    const clampTolerance = 0.75;
    const { left: jarLeft, right: jarRight, top: jarTop, bottom: jarBottom, curveRadius } = bounds;
    const minY = jarTop + radius + innerPad;
    const maxY = jarBottom - radius - innerPad - 1;
    let correctedX = pos.x;
    let correctedY = pos.y;
    let corrected = false;

    const leftAtY = interpolateXAtY(edgeLookup.left, correctedY);
    const rightAtY = interpolateXAtY(edgeLookup.right, correctedY);
    const minX = leftAtY + radius + innerPad;
    const maxX = rightAtY - radius - innerPad;
    if (correctedX < minX - clampTolerance) {
        correctedX = minX;
        corrected = true;
    } else if (correctedX > maxX + clampTolerance) {
        correctedX = maxX;
        corrected = true;
    }
    if (correctedY < minY - clampTolerance) {
        correctedY = minY;
        corrected = true;
    } else if (correctedY > maxY + clampTolerance) {
        correctedY = maxY;
        corrected = true;
    }

    // Recompute side bounds after Y clamp using actual jar edge profile.
    const leftAtClampedY = interpolateXAtY(edgeLookup.left, correctedY);
    const rightAtClampedY = interpolateXAtY(edgeLookup.right, correctedY);
    const minAllowedX = leftAtClampedY + radius + innerPad;
    const maxAllowedX = rightAtClampedY - radius - innerPad;
    const cornerZoneTop = jarBottom - curveRadius;
    const cornerBlend = Math.max(0, Math.min(1, (correctedY - cornerZoneTop) / Math.max(curveRadius, 1)));
    const cornerInset = cornerSafetyPad * cornerBlend;
    const minAllowedXWithInset = minAllowedX + cornerInset;
    const maxAllowedXWithInset = maxAllowedX - cornerInset;
    if (correctedX < minAllowedXWithInset - clampTolerance) {
        correctedX = minAllowedXWithInset;
        corrected = true;
    } else if (correctedX > maxAllowedXWithInset + clampTolerance) {
        correctedX = maxAllowedXWithInset;
        corrected = true;
    }

    // Clamp to rounded bottom-corner arcs so items cannot cross the visible outline.
    const arcRadius = Math.max(6, curveRadius - radius - innerPad - cornerSafetyPad);
    if (correctedX < jarLeft + curveRadius && correctedY > jarBottom - curveRadius) {
        const cx = jarLeft + curveRadius;
        const cy = jarBottom - curveRadius;
        const dx = correctedX - cx;
        const dy = correctedY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > arcRadius) {
            const scale = arcRadius / Math.max(dist, 0.0001);
            correctedX = cx + dx * scale;
            correctedY = cy + dy * scale;
            corrected = true;
        }
    }
    if (correctedX > jarRight - curveRadius && correctedY > jarBottom - curveRadius) {
        const cx = jarRight - curveRadius;
        const cy = jarBottom - curveRadius;
        const dx = correctedX - cx;
        const dy = correctedY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > arcRadius) {
            const scale = arcRadius / Math.max(dist, 0.0001);
            correctedX = cx + dx * scale;
            correctedY = cy + dy * scale;
            corrected = true;
        }
    }

    return {
        pos,
        radius,
        corrected,
        correctedX,
        correctedY,
        maxY,
        minAllowedXWithInset,
        maxAllowedXWithInset
    };
}

function applyBoundaryCorrection(marble, clampState) {
    if (!clampState.corrected) return;
    const dx = clampState.correctedX - marble.position.x;
    const dy = clampState.correctedY - marble.position.y;
    const shiftSq = dx * dx + dy * dy;
    const speedSq = marble.velocity.x * marble.velocity.x + marble.velocity.y * marble.velocity.y;
    const angularSpeed = Math.abs(marble.angularVelocity || 0);
    const isCalm = speedSq < 0.0025 && angularSpeed < 0.02;
    const touchingGlass =
        clampState.correctedX <= clampState.minAllowedXWithInset + 1.4 ||
        clampState.correctedX >= clampState.maxAllowedXWithInset - 1.4;
    // Ignore tiny correction nudges for calm marbles to prevent visible micro-jitter.
    if (isCalm && shiftSq < 4.0) return;

    Body.setPosition(marble, { x: clampState.correctedX, y: clampState.correctedY });
    if (isCalm) {
        Body.setVelocity(marble, { x: 0, y: 0 });
        Body.setAngularVelocity(marble, 0);
        if (touchingGlass && typeof Sleeping !== 'undefined' && Sleeping.set) {
            Sleeping.set(marble, true);
        }
        return;
    }
    Body.setVelocity(marble, {
        x: marble.velocity.x * 0.08,
        y: marble.velocity.y * 0.08
    });
}

function isMarbleEscaped(pos, bounds) {
    return (
        pos.x < bounds.left - 50 ||
        pos.x > bounds.right + 50 ||
        pos.y < bounds.top - 100 ||
        pos.y > bounds.bottom + 50
    );
}

function dampMarbleMotion(marble) {
    if (marble._spawnFrames && marble._spawnFrames > 0) {
        marble._spawnFrames -= 1;
    }
    if ((marble.angle || 0) !== 0) Body.setAngle(marble, 0);
    if ((marble.angularVelocity || 0) !== 0) Body.setAngularVelocity(marble, 0);
    const speed = Math.hypot(marble._vx || 0, marble._vy || 0);
    return { speed, angularSpeed: 0, isFresh: (marble._spawnFrames || 0) > 0 };
}


function respawnEscapedMarble(marble, neck, bounds) {
    const newX = neck.left + 12 + Math.random() * Math.max(1, (neck.right - neck.left - 24));
    const newY = bounds.top + 20 + Math.random() * 50;
    Body.setPosition(marble, { x: newX, y: newY });
    Body.setVelocity(marble, { x: 0, y: 0 });
}

// Check and respawn marbles that escape the jar bounds
function checkMarbleBounds() {
    const container = document.getElementById('jarContainer');
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    updateMarbleDiscPhysics(width, height);
}


function nudgeMarbles(vx, vy) {
    resumeSimulation();
    marbleBodies.forEach((marble) => {
        marble._vx = (marble._vx || 0) + vx;
        marble._vy = (marble._vy || 0) + vy;
    });
}

function getAudioNow() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
}

function maybePlayGlassCollisionSound(marble, impactSpeed) {
    if (impactSpeed < 2.5) return;
    const now = getAudioNow();
    if (now - (marble._lastGlassSoundAt || 0) < 140) return;
    marble._lastGlassSoundAt = now;
    playCollisionSound(Math.min(impactSpeed / 8, 1));
}

function maybePlayMarbleCollisionSound(A, B, impactSpeed) {
    if (impactSpeed < 2.0) return;
    const aId = A._audioId || 0;
    const bId = B._audioId || 0;
    const pairKey = aId < bId ? `${aId}:${bId}` : `${bId}:${aId}`;
    const now = getAudioNow();
    const lastAt = pairCollisionAudioCooldowns.get(pairKey) || 0;
    if (now - lastAt < 120) return;
    pairCollisionAudioCooldowns.set(pairKey, now);
    playCollisionSound(Math.min(impactSpeed / 7, 1));
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
        if (!config?.sounds) return;
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
    if (setupShakeInteraction._initialized) return;
    setupShakeInteraction._initialized = true;

    const container = document.getElementById('jarContainer');
    const shakeHint = document.getElementById('shakeHint');
    const tapLidHint = document.getElementById('tapLidHint');
    const dragHint = document.getElementById('dragHint');
    function dismissHint(el) {
        if (!el || el.style.display === 'none') return;
        el.style.transition = 'opacity 0.3s ease';
        el.style.opacity = '0';
        setTimeout(() => { el.style.display = 'none'; updateHintSeparators(); }, 300);
    }
    let isDragging = false;
    let hasMoved = false;
    let dragStartTime = 0;
    let dragStartPos = { x: 0, y: 0 };
    const tapMaxDuration = 280;
    const lidTapHeight = 72;
    const dragThreshold = 12;
    const lidTapCooldownMs = 260;
    let lastX = 0, lastY = 0;
    let velocityX = 0, velocityY = 0;
    let flingVX = 0, flingVY = 0;
    let activePointerKind = null;
    let ignoreMouseUntil = 0;
    let lastLidTapAt = 0;

    function getEventKind(e) {
        return e.type && e.type.startsWith('touch') ? 'touch' : 'mouse';
    }
    
    function startDrag(e) {
        const kind = getEventKind(e);
        if (kind === 'mouse' && Date.now() < ignoreMouseUntil) return;
        if (kind === 'touch') ignoreMouseUntil = Date.now() + 700;
        activePointerKind = kind;
        isDragging = true;
        hasMoved = false;
        dragStartTime = Date.now();
        const pos = getEventPosition(e);
        lastX = pos.x;
        lastY = pos.y;
        dragStartPos = pos;
        flingVX = 0;
        flingVY = 0;
    }
    
    function moveDrag(e) {
        if (!isDragging) return;
        if (getEventKind(e) !== activePointerKind) return;
        const pos = getEventPosition(e);
        const dx = pos.x - lastX;
        const dy = pos.y - lastY;
        if (!hasMoved && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
            hasMoved = true;
            dismissHint(dragHint);
            suppressJarClickUntil = Date.now() + 250;
            wakeAllMarbles();
        }
        if (hasMoved) {
            velocityX = dx * 0.7;
            velocityY = dy * 0.56;
            const maxVel = 28;
            velocityX = Math.max(-maxVel, Math.min(maxVel, velocityX));
            velocityY = Math.max(-maxVel, Math.min(maxVel, velocityY));
            flingVX = velocityX;
            flingVY = velocityY;
            nudgeMarbles(velocityX * 0.25, velocityY * 0.25);
        }
        lastX = pos.x;
        lastY = pos.y;
    }
    
    function endDrag(e) {
        if (!isDragging) return;
        if (e && getEventKind(e) !== activePointerKind) return;
        const wasTap = !hasMoved && (Date.now() - dragStartTime) < tapMaxDuration;
        if (wasTap) {
            const rect = container.getBoundingClientRect();
            const tapY = dragStartPos.y - rect.top;
            if (tapY >= 0 && tapY <= lidTapHeight) {
                const now = Date.now();
                if (now - lastLidTapAt < lidTapCooldownMs) {
                    isDragging = false;
                    activePointerKind = null;
                    return;
                }
                lastLidTapAt = now;
                addMarble();
                dismissHint(tapLidHint);
            }
        } else if (hasMoved) {
            wakeAllMarbles();
            nudgeMarbles(flingVX * 0.34, flingVY * 0.34);
        }
        isDragging = false;
        activePointerKind = null;
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
    
    const defaultGravity = { x: 0, y: 0.8 };
    const gravityStrength = 0.9;

    // Sensor motion (for mobile shake + tilt gravity)
    let motionEnabled = false;
    let orientationEnabled = false;
    let lastMotionAt = 0;
    let lastMotionX = null;
    let lastMotionY = null;
    let lastMotionZ = null;
    let filteredGravityX = defaultGravity.x;
    let filteredGravityY = defaultGravity.y;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function setEngineGravity(x, y) {
        if (!engine || !engine.gravity) return;
        const dx = Math.abs((engine.gravity.x || 0) - x);
        const dy = Math.abs((engine.gravity.y || 0) - y);
        if (dx + dy > 0.04) wakeAllMarbles();
        engine.gravity.x = x;
        engine.gravity.y = y;
    }

    function getOrientationAngle() {
        if (window.screen?.orientation && typeof window.screen.orientation.angle === 'number') {
            return window.screen.orientation.angle;
        }
        if (typeof window.orientation === 'number') {
            return window.orientation;
        }
        return 0;
    }

    function orientationToGravity(beta, gamma) {
        const angle = ((getOrientationAngle() % 360) + 360) % 360;
        const b = clamp((beta || 0) / 45, -1, 1);
        const g = clamp((gamma || 0) / 45, -1, 1);

        let gx = 0;
        let gy = 0;

        // Map screen orientation so "tilt down" always means gravity follows tilt.
        if (angle === 90) {
            gx = b;
            gy = -g;
        } else if (angle === 270) {
            gx = -b;
            gy = g;
        } else if (angle === 180) {
            gx = -g;
            gy = -b;
        } else {
            gx = g;
            gy = b;
        }

        return { x: gx * gravityStrength, y: gy * gravityStrength };
    }

    function handleDeviceMotion(e) {
        if (!motionEnabled) return;
        const acceleration = e.accelerationIncludingGravity || e.acceleration;
        if (!acceleration) return;

        const x = acceleration.x || 0;
        const y = acceleration.y || 0;
        const z = acceleration.z || 0;

        if (lastMotionX === null) {
            lastMotionX = x;
            lastMotionY = y;
            lastMotionZ = z;
            return;
        }

        const deltaX = Math.abs(x - lastMotionX);
        const deltaY = Math.abs(y - lastMotionY);
        const deltaZ = Math.abs(z - lastMotionZ);
        const shakeStrength = deltaX + deltaY + deltaZ;

        lastMotionX = x;
        lastMotionY = y;
        lastMotionZ = z;

        const now = Date.now();
        const threshold = 12;
        const cooldownMs = 200;
        if (shakeStrength < threshold || now - lastMotionAt < cooldownMs) return;

        lastMotionAt = now;
        shakeHint.classList.add('hidden');

        wakeAllMarbles();
        nudgeMarbles(x * 0.12, -y * 0.1);
    }

    function handleDeviceOrientation(e) {
        if (!orientationEnabled) return;
        if (e.beta == null || e.gamma == null) return;

        const target = orientationToGravity(e.beta, e.gamma);

        // Low-pass filter to avoid jittery motion from sensor noise.
        filteredGravityX = filteredGravityX * 0.85 + target.x * 0.15;
        filteredGravityY = filteredGravityY * 0.85 + target.y * 0.15;
        setEngineGravity(filteredGravityX, filteredGravityY);
    }

    function enableMotion() {
        if (motionEnabled) return;
        motionEnabled = true;
        window.addEventListener('devicemotion', handleDeviceMotion);
    }

    function enableOrientation() {
        if (orientationEnabled) return;
        orientationEnabled = true;
        window.addEventListener('deviceorientation', handleDeviceOrientation);
    }

    async function requestSensorPermission() {
        if (!window.DeviceMotionEvent && !window.DeviceOrientationEvent) return;

        let motionGranted = false;
        let orientationGranted = false;

        // iOS 13+ requires explicit permission for both motion and orientation.
        if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                motionGranted = (await DeviceMotionEvent.requestPermission()) === 'granted';
            } catch (err) {
                console.warn('Motion permission request failed:', err);
            }
        } else if (window.DeviceMotionEvent) {
            motionGranted = true;
        }

        if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                orientationGranted = (await DeviceOrientationEvent.requestPermission()) === 'granted';
            } catch (err) {
                console.warn('Orientation permission request failed:', err);
            }
        } else if (window.DeviceOrientationEvent) {
            orientationGranted = true;
        }

        if (motionGranted) enableMotion();
        if (orientationGranted) enableOrientation();
        if (!orientationGranted) {
            // Keep original gravity if tilt control is unavailable.
            setEngineGravity(defaultGravity.x, defaultGravity.y);
        }
    }

    requestSensorPermission();
    container.addEventListener('touchstart', requestSensorPermission, { passive: true });
    container.addEventListener('click', requestSensorPermission);
}

function resolveItemIndex(marble, config) {
    if (!config) return 0;
    if (config.isMarble) {
        const byName = config.itemNames?.indexOf(marble.itemName || '');
        if (typeof byName === 'number' && byName >= 0) return byName;
        const byColor = config.fallbackColors?.findIndex(c =>
            String(c || '').toLowerCase() === String(marble.marbleColor || '').toLowerCase()
        );
        if (typeof byColor === 'number' && byColor >= 0) return byColor;
        return 0;
    }

    const byImage = config.images?.indexOf(marble.marbleImage || '');
    if (typeof byImage === 'number' && byImage >= 0) return byImage;
    const byName = config.itemNames?.indexOf(marble.itemName || '');
    if (typeof byName === 'number' && byName >= 0) return byName;
    return 0;
}

function openMarbleZoomDetails(marble) {
    const overlay = document.getElementById('marbleZoomOverlay');
    const content = document.getElementById('marbleZoomContent');
    if (!overlay || !content || !marble) return;

    const config = collectibles[marble.marbleType];
    const isMarbleType = config && config.isMarble;
    const name = marble.itemName || config?.name?.split(/\s+/).slice(1).join(' ') || marble.marbleType;
    const index = resolveItemIndex(marble, config);
    const description = typeof getItemDescription === 'function'
        ? getItemDescription(marble.marbleType, index, name)
        : `A wonderful ${name} to add to your growing collection!`;

    let preview = '';
    if (isMarbleType) {
        const color = marble.marbleColor || '#1AA39D';
        const textureUrl = createMarbleTexture(color, 280);
        preview = `<img class="marble-zoom-image" src="${textureUrl}" alt="${escapeHtml(name)}">`;
    } else if (marble.marbleImage && isSafeImageUrl(marble.marbleImage)) {
        preview = `<img class="marble-zoom-image" src="${marble.marbleImage.replace(/"/g, '&quot;')}" alt="${escapeHtml(name)}">`;
    } else {
        preview = `<div class="marble-zoom-gradient" style="background: ${marble.marbleColor || '#1AA39D'};"></div>`;
    }
    content.innerHTML = `${preview}<span class="marble-zoom-name">${escapeHtml(name)}</span><p class="marble-zoom-description">${escapeHtml(description)}</p>`;

    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
}

function hideMarbleZoomDetails() {
    const overlay = document.getElementById('marbleZoomOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
}

// Click/tap collectible in jar to view details
function setupMarbleZoom(canvas) {
    const overlay = document.getElementById('marbleZoomOverlay');
    const closeBtn = document.getElementById('marbleZoomClose');

    const container = document.getElementById('jarContainer');
    if (!overlay || !closeBtn || !container || !canvas) return;

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
        // Matter world units track CSS pixels here; avoid DPR scaling mismatch.
        return { x: (clientX - rect.left), y: (clientY - rect.top) };
    }

    function tryShowMarbleZoom(e) {
        if (Date.now() < suppressJarClickUntil) return;
        const point = worldPointFromEvent(e);
        const hit = Query.point(marbleBodies, point);
        if (hit.length > 0) {
            openMarbleZoomDetails(hit[0]);
        }
    }

    // Click to open details (dragging/swiping won't trigger click)
    canvas.addEventListener('click', tryShowMarbleZoom);
    container.addEventListener('click', tryShowMarbleZoom);

    // Touch fallback for browsers where click can be suppressed by touch interactions
    let touchStartPoint = null;
    let touchStartTime = 0;
    canvas.addEventListener('touchstart', (e) => {
        if (!e.touches || e.touches.length === 0) return;
        touchStartPoint = worldPointFromEvent(e);
        touchStartTime = Date.now();
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
        if (!touchStartPoint) return;
        const endPoint = worldPointFromEvent(e);
        const dt = Date.now() - touchStartTime;
        const moved = Math.hypot(endPoint.x - touchStartPoint.x, endPoint.y - touchStartPoint.y);
        touchStartPoint = null;
        touchStartTime = 0;
        if (dt < 300 && moved < 18) {
            tryShowMarbleZoom(e);
        }
    }, { passive: true });

    closeBtn.addEventListener('click', hideMarbleZoomDetails);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) hideMarbleZoomDetails(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideMarbleZoomDetails(); });
}

// Pick a random type from enabled collectibles
function getRandomEnabledType() {
    if (isCollectiblesLocked()) return FREE_COLLECTIBLE_TYPE;
    const enabled = state.enabledCollectibles.filter(k => collectibles[k]);
    if (enabled.length === 0) return state.collectibleType;
    return enabled[Math.floor(Math.random() * enabled.length)];
}

function getMarbleTextureResolution(displayDiameter) {
    const dpr = window.devicePixelRatio || 1;
    return Math.max(64, Math.round(displayDiameter * dpr * 1.6));
}

function fillMarbleCircle(ctx, size, fillStyle) {
    const radius = size / 2 - 1;
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
}

function drawMarbleBand(ctx, size, points, width, color, alpha = 1) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(points[0][0] * size, points[0][1] * size);
    for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i][0] * size, points[i][1] * size);
    }
    ctx.stroke();
    ctx.restore();
}

function createMarbleBody(x, y, radius, renderOptions) {
    const marble = Bodies.circle(x, y, radius, {
        isStatic: true,
        restitution: 0.02,
        friction: 0.02,
        frictionStatic: 0.05,
        frictionAir: 0.02,
        density: 0.0012,
        slop: 0,
        sleepThreshold: 18,
        render: {
            ...renderOptions,
            visible: false
        }
    });

    marble._spawnFrames = SPAWN_SETTLE_FRAMES;
    marble._sleepFrames = 0;
    marble._vx = 0;
    marble._vy = 0;
    marble._audioId = nextMarbleAudioId++;
    marble._lastGlassSoundAt = 0;
    marble._displayX = x;
    marble._displayY = y;
    marble._displayAngle = 0;
    Body.setVelocity(marble, { x: 0, y: 0 });
    Body.setAngularVelocity(marble, 0);

    return marble;
}

function clampDiscToJar(marble, edgeLookup, bounds) {
    const clampState = computeClampState(marble, edgeLookup, bounds);
    if (!clampState.corrected) return;

    const prevX = marble.position.x;
    const prevY = marble.position.y;
    const prevVx = marble._vx || 0;
    const prevVy = marble._vy || 0;
    Body.setPosition(marble, { x: clampState.correctedX, y: clampState.correctedY });
    marble.positionPrev.x = clampState.correctedX;
    marble.positionPrev.y = clampState.correctedY;

    if (clampState.correctedX !== prevX) {
        marble._vx = -((marble._vx || 0) * DISC_BOUNCE);
    }
    if (clampState.correctedY !== prevY) {
        marble._vy = clampState.correctedY < prevY
            ? -((marble._vy || 0) * DISC_BOUNCE)
            : Math.max(0, -((marble._vy || 0) * DISC_BOUNCE));
    }

    const impactSpeed = Math.max(
        clampState.correctedX !== prevX ? Math.abs(prevVx) : 0,
        clampState.correctedY !== prevY ? Math.abs(prevVy) : 0
    );
    maybePlayGlassCollisionSound(marble, impactSpeed);
}

function resolveDiscPair(A, B) {
    const ra = A.circleRadius || getMarbleSize() / 2;
    const rb = B.circleRadius || getMarbleSize() / 2;
    const minDist = ra + rb + DISC_SEPARATION_EPSILON;

    let dx = B.position.x - A.position.x;
    let dy = B.position.y - A.position.y;
    let distSq = dx * dx + dy * dy;
    if (distSq >= minDist * minDist) return;

    if (distSq < 0.000001) {
        dx = 0.0001;
        dy = 0;
        distSq = dx * dx;
    }

    const dist = Math.sqrt(distSq);
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = minDist - dist;

    const aAsleep = (A._sleepFrames || 0) > 6;
    const bAsleep = (B._sleepFrames || 0) > 6;

    // Treat sleeping marbles as immovable — push only the awake one
    if (aAsleep && bAsleep) return;
    if (aAsleep) {
        Body.setPosition(B, { x: B.position.x + nx * overlap, y: B.position.y + ny * overlap });
        B.positionPrev.x = B.position.x;
        B.positionPrev.y = B.position.y;
    } else if (bAsleep) {
        Body.setPosition(A, { x: A.position.x - nx * overlap, y: A.position.y - ny * overlap });
        A.positionPrev.x = A.position.x;
        A.positionPrev.y = A.position.y;
    } else {
        const moveX = nx * overlap * 0.5;
        const moveY = ny * overlap * 0.5;
        Body.setPosition(A, { x: A.position.x - moveX, y: A.position.y - moveY });
        Body.setPosition(B, { x: B.position.x + moveX, y: B.position.y + moveY });
        A.positionPrev.x = A.position.x;
        A.positionPrev.y = A.position.y;
        B.positionPrev.x = B.position.x;
        B.positionPrev.y = B.position.y;
    }

    const relVx = (B._vx || 0) - (A._vx || 0);
    const relVy = (B._vy || 0) - (A._vy || 0);
    const normalSpeed = relVx * nx + relVy * ny;
    if (normalSpeed >= 0) return;

    maybePlayMarbleCollisionSound(A, B, -normalSpeed);

    const impulse = -(1 + DISC_PAIR_RESTITUTION) * normalSpeed * 0.5;
    if (!aAsleep) { A._vx -= impulse * nx; A._vy -= impulse * ny; }
    if (!bAsleep) { B._vx += impulse * nx; B._vy += impulse * ny; }
}

function updateMarbleDiscPhysics(width, height) {
    if (marbleBodies.length === 0) return;

    const bounds = getJarBoundaries(width, height);
    const neck = getJarNeckBounds(width, height);
    const edgeLookup = getJarEdgeLookup(width, height);
    const gx = (engine?.gravity?.x || 0) * DISC_GRAVITY_SCALE;
    const gy = (engine?.gravity?.y || 0.95) * DISC_GRAVITY_SCALE;

    marbleBodies.forEach((marble) => {
        dampMarbleMotion(marble);
        if ((marble._sleepFrames || 0) > 6) return;
        marble._vx = (marble._vx || 0) + gx;
        marble._vy = (marble._vy || 0) + gy;
        marble._vx *= DISC_AIR_DAMPING;
        marble._vy *= DISC_AIR_DAMPING;

        const nextX = marble.position.x + marble._vx;
        const nextY = marble.position.y + marble._vy;
        Body.setPosition(marble, { x: nextX, y: nextY });
        marble.positionPrev.x = nextX;
        marble.positionPrev.y = nextY;
        clampDiscToJar(marble, edgeLookup, bounds);

        if (isMarbleEscaped(marble.position, bounds)) {
            respawnEscapedMarble(marble, neck, bounds);
            marble._vx = 0;
            marble._vy = 0;
        }
    });

    for (let pass = 0; pass < DISC_PAIR_PASSES; pass += 1) {
        for (let i = 0; i < marbleBodies.length; i += 1) {
            for (let j = i + 1; j < marbleBodies.length; j += 1) {
                resolveDiscPair(marbleBodies[i], marbleBodies[j]);
            }
        }
        marbleBodies.forEach((marble) => clampDiscToJar(marble, edgeLookup, bounds));
    }

    marbleBodies.forEach((marble) => {
        const wasSleeping = (marble._sleepFrames || 0) > 6;
        const speed = Math.hypot(marble._vx || 0, marble._vy || 0);
        if (speed < CALM_LINEAR_SPEED) {
            marble._sleepFrames = (marble._sleepFrames || 0) + 1;
            if (marble._sleepFrames > 6) {
                marble._vx = 0;
                marble._vy = 0;
            }
        } else if (wasSleeping && speed < CALM_LINEAR_SPEED * 8) {
            // Sleeping marble got a tiny nudge from pair resolution — keep it asleep
            marble._vx = 0;
            marble._vy = 0;
        } else {
            marble._sleepFrames = 0;
        }
    });

    // Evict stale audio cooldown entries every ~300 frames to prevent unbounded growth
    audioCooldownCleanupFrame += 1;
    if (audioCooldownCleanupFrame >= 300) {
        audioCooldownCleanupFrame = 0;
        const cutoff = getAudioNow() - 5000;
        pairCollisionAudioCooldowns.forEach((time, key) => {
            if (time < cutoff) pairCollisionAudioCooldowns.delete(key);
        });
    }

    // Pause simulation when all marbles are fully at rest
    const allResting = marbleBodies.length > 0 && marbleBodies.every(m => (m._sleepFrames || 0) > 6);
    if (allResting && !isSimulationPaused) pauseSimulation();

}

function updateMarbleDisplayState(body) {
    if (typeof body._displayX !== 'number' || typeof body._displayY !== 'number') {
        body._displayX = body.position.x;
        body._displayY = body.position.y;
        body._displayAngle = body.angle || 0;
        return;
    }

    const dx = body.position.x - body._displayX;
    const dy = body.position.y - body._displayY;
    const da = (body.angle || 0) - (body._displayAngle || 0);
    const speed = Math.hypot(body._vx || 0, body._vy || 0);
    const angularSpeed = 0;
    const isFresh = (body._spawnFrames || 0) > 0;
    const lerp = isFresh ? DISPLAY_LERP_FRESH : DISPLAY_LERP;

    if (
        (body._sleepFrames || 0) > 6 ||
        (speed < CALM_LINEAR_SPEED &&
         Math.abs(dx) < DISPLAY_SNAP_DISTANCE &&
         Math.abs(dy) < DISPLAY_SNAP_DISTANCE &&
         Math.abs(da) < DISPLAY_SNAP_ANGLE)
    ) {
        body._displayX = body.position.x;
        body._displayY = body.position.y;
        body._displayAngle = body.angle || 0;
        return;
    }

    body._displayX += dx * lerp;
    body._displayY += dy * lerp;
    body._displayAngle = (body._displayAngle || 0) + da * lerp;
}

function drawJarMarble(ctx, body) {
    const x = body._displayX;
    const y = body._displayY;
    const r = Math.max(2, body.circleRadius || getMarbleSize() / 2);
    const config = collectibles[body.marbleType];

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(body._displayAngle || 0);

    if (config?.isMarble) {
        // Draw gradient directly — no async image loading, always looks 3D
        const color = body.marbleColor || '#1AA39D';
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.4, 0, 0, 0, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.15, lightenColor(color, 35));
        grad.addColorStop(0.55, color);
        grad.addColorStop(1, darkenColor(color, 30));
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        const shine = ctx.createRadialGradient(-r * 0.4, -r * 0.45, 0, -r * 0.3, -r * 0.35, r * 0.4);
        shine.addColorStop(0, 'rgba(255,255,255,0.75)');
        shine.addColorStop(0.5, 'rgba(255,255,255,0.25)');
        shine.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = shine;
        ctx.fill();
    } else {
        const img = getJarInspectImage(body.marbleImage);
        if (img) {
            ctx.drawImage(img, -r, -r, r * 2, r * 2);
        } else {
            ctx.fillStyle = body.marbleColor || '#1AA39D';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

function renderJarMarbles(ctx, width, height) {
    ctx.save();
    ctx.beginPath();
    traceJarCanvasPath(ctx, width, height);
    ctx.clip();

    const sortedBodies = [...marbleBodies].sort((a, b) => a.position.y - b.position.y);
    sortedBodies.forEach((body) => {
        updateMarbleDisplayState(body);
        drawJarMarble(ctx, body);
    });

    ctx.restore();
}

function findLeastOverlapSpawn(radius, bounds, neck, options = {}) {
    const tries = options.tries || 40;
    const topOffset = options.topOffset || 14;
    const depthJitter = options.depthJitter || 12;
    const maxDepth = options.maxDepth || 90;
    const lateralPadding = 12;

    const safeNeckWidth = Math.max(1, neck.right - neck.left - lateralPadding * 2);
    const fallback = {
        x: neck.left + lateralPadding + Math.random() * safeNeckWidth,
        y: bounds.top + topOffset
    };

    let best = fallback;
    let bestPenalty = Infinity;

    for (let attempt = 0; attempt < tries; attempt += 1) {
        const depthBase = Math.min(maxDepth, attempt * 4);
        const x = neck.left + lateralPadding + Math.random() * safeNeckWidth;
        const y = bounds.top + topOffset + depthBase + Math.random() * depthJitter;
        let penalty = 0;

        for (let i = 0; i < marbleBodies.length; i += 1) {
            const other = marbleBodies[i];
            const or = other.circleRadius || radius;
            const minDist = radius + or + 3;
            const dx = x - other.position.x;
            const dy = y - other.position.y;
            const dist = Math.hypot(dx, dy);
            if (dist < minDist) {
                penalty += (minDist - dist);
            }
        }

        if (penalty <= 0.0001) {
            return { x, y };
        }

        if (penalty < bestPenalty) {
            bestPenalty = penalty;
            best = { x, y };
        }
    }

    return best;
}

// Add a collectible to the jar
// Resolve a marble-type variant to a defined color+name from config.
// If the saved color/name doesn't match any defined entry, assigns a random one.
function resolveMarbleVariant(config, fallbackColor, itemName) {
    if (!config?.isMarble) return null;
    const names = config.itemNames || [];
    const colors = config.fallbackColors || [];
    // Match by name first
    if (itemName) {
        const idx = names.indexOf(itemName);
        if (idx >= 0) return { color: colors[idx], itemName: names[idx] };
    }
    // Match by exact color
    if (fallbackColor) {
        const idx = colors.indexOf(fallbackColor);
        if (idx >= 0) return { color: colors[idx], itemName: names[idx] || '' };
    }
    // Unknown — assign random defined color
    const idx = Math.floor(Math.random() * colors.length);
    return { color: colors[idx], itemName: names[idx] || '' };
}

function addMarble(type, options = {}) {
    const { playSound = true } = options;
    if (state.totalMarbles >= state.jarCapacity) return null;
    if (isCollectiblesLocked()) type = FREE_COLLECTIBLE_TYPE;
    if (type == null) type = getRandomEnabledType();
    const container = document.getElementById('jarContainer');
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    
    const config = collectibles[type];
    if (!config) return;
    
    const size = getMarbleSize();
    const radius = size / 2;
    const bounds = getJarBoundaries(width, height);
    const neck = getJarNeckBounds(width, height);
    
    // Start near the neck with conservative non-overlap spacing.
    const spawn = findLeastOverlapSpawn(radius, bounds, neck, {
        tries: 60,
        topOffset: 10,
        depthJitter: 8,
        maxDepth: 64
    });
    const x = spawn.x;
    const y = spawn.y;
    
    let renderOptions;
    let imageUrl = '';
    let fallbackColor = config.fallbackColors[Math.floor(Math.random() * config.fallbackColors.length)];
    
    // Check if this is a marble type (rendered with gradients)
    let itemName = '';
    if (config.isMarble) {
        const colorIndex = Math.floor(Math.random() * config.fallbackColors.length);
        const variant = resolveMarbleVariant(config, config.fallbackColors[colorIndex], config.itemNames?.[colorIndex]) || { color: config.fallbackColors[colorIndex], itemName: config.itemNames?.[colorIndex] || '' };
        fallbackColor = variant.color;
        itemName = variant.itemName;
        const textureSize = getMarbleTextureResolution(radius * 2);
        const textureUrl = createMarbleTexture(fallbackColor, textureSize, {
            marbleType: type,
            itemName
        });
        renderOptions = {
            sprite: {
                texture: textureUrl,
                xScale: (radius * 2) / textureSize,
                yScale: (radius * 2) / textureSize
            }
        };
        imageUrl = textureUrl;
    } else {
        const imageIndex = Math.floor(Math.random() * config.images.length);
        imageUrl = config.images[imageIndex];
        itemName = config.itemNames?.[imageIndex] || '';
        renderOptions = {
            sprite: {
                texture: imageUrl,
                xScale: (radius * 2) / 128,
                yScale: (radius * 2) / 128
            }
        };
    }
    
    const marble = createMarbleBody(x, y, radius, renderOptions);
    
    marble.marbleType = type;
    marble.marbleImage = imageUrl;
    marble.marbleColor = fallbackColor;
    marble.itemName = itemName;
    marble._spriteBaseSize = config.isMarble
        ? getMarbleTextureResolution(radius * 2)
        : 128;
    resumeSimulation();
    Composite.add(engine.world, marble);
    marbleBodies.push(marble);

    // Save marble data
    state.marbles.push({ type, imageUrl, fallbackColor, radius, itemName });
    recordCollectedHistory(type, itemName, fallbackColor, imageUrl);
    state.totalMarbles++;
    saveState();
    updateMarbleCount();
    
    // Play add sound
    if (playSound) playAddSound();
    
    return marble;
}

// Create a cute marble texture using canvas
function createMarbleTexture(baseColor, size, options = {}) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 1;
    
    const gradient = ctx.createRadialGradient(
        centerX * 0.7, centerY * 0.6, 0,
        centerX, centerY, radius
    );
    const lighterColor = lightenColor(baseColor, 40);
    const darkerColor = darkenColor(baseColor, 30);
    
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.15, lighterColor);
    gradient.addColorStop(0.5, baseColor);
    gradient.addColorStop(1, darkerColor);
    
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
    // Cancel staged timers from previous restore attempts.
    restoreMarbleTimers.forEach((timerId) => clearTimeout(timerId));
    restoreMarbleTimers = [];

    // Ensure we don't duplicate physics bodies if restore is triggered twice.
    if (engine && marbleBodies.length > 0) {
        marbleBodies.forEach((body) => Composite.remove(engine.world, body));
        marbleBodies = [];
    }

    const container = document.getElementById('jarContainer');
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const bounds = getJarBoundaries(width, height);
    const neck = getJarNeckBounds(width, height);
    const currentSize = getMarbleSize();
    
    const marblesToRestore = state.marbles.slice(0, state.jarCapacity);
    state.marbles = marblesToRestore;
    state.totalMarbles = marblesToRestore.length;

    marblesToRestore.forEach((marbleData, index) => {
        const timerId = setTimeout(() => {
            const radius = currentSize / 2;
            const spawn = findLeastOverlapSpawn(radius, bounds, neck, {
                tries: 48,
                topOffset: 12,
                depthJitter: 10,
                maxDepth: 96
            });
            const x = spawn.x;
            const y = spawn.y;

            const config = collectibles[marbleData.type];
            
            let renderOptions;
            
            // Check if this is a marble type (rendered with gradients directly — no texture needed)
            if (config && config.isMarble) {
                renderOptions = {};
            } else {
                if (marbleData.imageUrl) {
                    renderOptions = {
                        sprite: {
                            texture: marbleData.imageUrl,
                            xScale: (radius * 2) / 128,
                            yScale: (radius * 2) / 128
                        }
                    };
                } else {
                    renderOptions = {
                        fillStyle: marbleData.fallbackColor || '#1AA39D',
                        strokeStyle: darkenColor(marbleData.fallbackColor || '#1AA39D', 20),
                        lineWidth: 2
                    };
                }
            }
            
            const marble = createMarbleBody(x, y, radius, renderOptions);
            
            marble.marbleType = marbleData.type;
            marble.marbleImage = marbleData.imageUrl;
            marble._spriteBaseSize = (config && config.isMarble) ? 0 : 128;

            if (config && config.isMarble) {
                // Normalize to a defined color+name — handles old/arbitrary saved state
                const variant = resolveMarbleVariant(config, marbleData.fallbackColor, marbleData.itemName);
                marble.marbleColor = variant.color;
                marble.itemName = variant.itemName;
                // Persist normalized values so next restore is also correct
                marbleData.fallbackColor = variant.color;
                marbleData.itemName = variant.itemName;
            } else {
                marble.marbleColor = marbleData.fallbackColor;
                let itemName = marbleData.itemName;
                if (!itemName && config) {
                    const idx = config.images?.indexOf(marbleData.imageUrl);
                    if (idx >= 0 && config.itemNames?.[idx]) itemName = config.itemNames[idx];
                }
                marble.itemName = itemName || '';
            }
            
            Composite.add(engine.world, marble);
            marbleBodies.push(marble);
        }, index * 50);
        restoreMarbleTimers.push(timerId);
    });
}

function getRestoreSignature() {
    const marbles = state.marbles || [];
    const sample = marbles.slice(0, 12).map((m) => [
        m.type || '',
        m.itemName || '',
        m.imageUrl || '',
        m.fallbackColor || '',
        Number(m.radius || 0).toFixed(2)
    ]);
    return JSON.stringify({
        jarCapacity: state.jarCapacity,
        count: marbles.length,
        sample
    });
}

function scheduleRestoreMarbles(delay = 0) {
    const signature = getRestoreSignature();

    // Skip replaying the same restore on top of already-restored bodies.
    if (marbleBodies.length > 0 && signature === lastRestoredSignature) {
        return;
    }

    if (restoreTimer && signature === pendingRestoreSignature) {
        return;
    }

    if (restoreTimer) clearTimeout(restoreTimer);
    pendingRestoreSignature = signature;
    restoreTimer = setTimeout(() => {
        restoreTimer = null;
        pendingRestoreSignature = '';

        // If another path already restored this same state, do nothing.
        if (marbleBodies.length > 0 && signature === lastRestoredSignature) {
            return;
        }

        lastRestoredSignature = signature;
        restoreMarbles();
    }, delay);
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

function updateHintSeparators() {
    const sep1 = document.getElementById('hintSep1');
    const sep2 = document.getElementById('hintSep2');
    const tapEl = document.getElementById('tapLidHint');
    const dragEl = document.getElementById('dragHint');
    const zoomEl = document.getElementById('zoomHintSlot');
    const vis = (el) => el && el.style.display !== 'none';
    if (sep1) sep1.style.display = (vis(tapEl) && (vis(dragEl) || vis(zoomEl))) ? '' : 'none';
    if (sep2) sep2.style.display = (vis(dragEl) && vis(zoomEl)) ? '' : 'none';
}

// Update marble count display
function updateMarbleCount() {
    document.getElementById('marbleCount').textContent = state.totalMarbles;
    const labelEl = document.getElementById('marbleCountLabel');
    if (labelEl) {
        labelEl.textContent = state.totalMarbles === 1 ? 'marble collected' : 'marbles collected';
    }
    const undoBtn = document.getElementById('undoMarbleBtn');
    if (undoBtn) undoBtn.disabled = state.totalMarbles === 0;
    const tapLidHintEl = document.getElementById('tapLidHint');
    const dragHintEl = document.getElementById('dragHint');
    const zoomHintSlotEl = document.getElementById('zoomHintSlot');
    if (state.totalMarbles === 0) {
        if (tapLidHintEl) { tapLidHintEl.style.display = ''; tapLidHintEl.style.opacity = '1'; }
        if (dragHintEl) { dragHintEl.style.display = 'none'; }
        if (zoomHintSlotEl) { zoomHintSlotEl.style.display = ''; zoomHintSlotEl.style.opacity = '1'; }
    } else {
        if (dragHintEl) { dragHintEl.style.display = ''; dragHintEl.style.opacity = '1'; }
    }
    updateHintSeparators();
    positionZoomButtonByHintVisibility();
    const countInput = document.getElementById('settingsMarbleCountInput');
    if (countInput) {
        countInput.value = String(state.totalMarbles);
        countInput.max = String(state.jarCapacity);
    }
    const capacityInput = document.getElementById('settingsCapacityInput');
    if (capacityInput) capacityInput.value = String(state.jarCapacity);
    const capacitySlider = document.getElementById('settingsCapacitySlider');
    if (capacitySlider) capacitySlider.value = String(state.jarCapacity);
}

function closeConfirmDialog(result) {
    const overlay = document.getElementById('confirmOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
    }
    if (confirmDialogResolver) {
        const resolve = confirmDialogResolver;
        confirmDialogResolver = null;
        resolve(!!result);
    }
}

function showConfirmDialog(message, confirmLabel = 'Confirm') {
    const overlay = document.getElementById('confirmOverlay');
    const messageEl = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmConfirmBtn');

    if (!overlay || !messageEl || !confirmBtn) {
        return Promise.resolve(window.confirm(message));
    }

    messageEl.textContent = message;
    confirmBtn.textContent = confirmLabel;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');

    return new Promise((resolve) => {
        confirmDialogResolver = resolve;
    });
}

function setMarbleCount(targetCount) {
    if (!Number.isFinite(targetCount)) return;
    const clampedTarget = Math.max(0, Math.min(state.jarCapacity, Math.floor(targetCount)));
    const current = state.totalMarbles;
    if (clampedTarget === current) return;

    if (clampedTarget > current) {
        const toAdd = clampedTarget - current;
        for (let i = 0; i < toAdd; i++) {
            addMarble(undefined, { playSound: false });
        }
        return;
    }

    const toRemove = current - clampedTarget;
    for (let i = 0; i < toRemove; i++) {
        const body = marbleBodies.pop();
        if (body && engine) Composite.remove(engine.world, body);
        state.marbles.pop();
    }
    state.totalMarbles = state.marbles.length;
    saveState();
    updateMarbleCount();
}

function setJarCapacity(nextCapacity) {
    const clamped = clampJarCapacity(nextCapacity);
    if (clamped === state.jarCapacity) {
        updateMarbleCount();
        return;
    }
    state.jarCapacity = clamped;
    if (state.totalMarbles > clamped) {
        setMarbleCount(clamped);
    }
    if (marbleBodies.length > 0) {
        resizeExistingMarbles();
        checkMarbleBounds();
    }
    saveState();
    updateMarbleCount();
}

function clearCollectionHistory() {
    state.collectionHistory = {};
    saveState();
}

function setFrontMenuOpen(open) {
    const menu = document.getElementById('frontMenu');
    const toggleBtn = document.getElementById('menuToggleBtn');
    const backdrop = document.getElementById('menuBackdrop');
    const shouldOpen = !!open;
    if (shouldOpen) positionFrontMenu();
    if (menu) menu.classList.toggle('open', shouldOpen);
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    if (backdrop) {
        backdrop.classList.toggle('active', shouldOpen);
        backdrop.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
    }
}

function toggleFrontMenu() {
    const menu = document.getElementById('frontMenu');
    setFrontMenuOpen(!(menu && menu.classList.contains('open')));
}

function setJarOnlyMode(enabled) {
    isJarOnlyMode = !!enabled;
    document.body.classList.toggle('jar-only-mode', isJarOnlyMode);
    if (isJarOnlyMode) {
        setFrontMenuOpen(false);
    }
}

function isBlankAreaTapTarget(target) {
    if (!(target instanceof Element)) return false;
    if (target.closest(
        '#settingsPage.active, #confirmOverlay.active, #marbleZoomOverlay.active, #jarInspectOverlay.active'
    )) return false;
    if (target.closest(
        '#jarContainer, header, .jar-stats, .menu-dock, .front-menu, .menu-backdrop, .settings-page, .confirm-modal, .marble-zoom-modal, .jar-inspect-modal'
    )) return false;
    if (target.closest('button, a, input, textarea, select, label, [role=\"button\"]')) return false;
    return !!target.closest('body, .app-container, main, .jar-section, .zoom-center-row');
}

function positionFrontMenu() {
    const menu = document.getElementById('frontMenu');
    const dock = document.getElementById('frontControls');
    if (!menu || !dock) return;
    const rect = dock.getBoundingClientRect();
    const gap = 10;
    const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
    const fromBottom = Math.max(16, viewportH - rect.top + gap);
    menu.style.bottom = `${fromBottom}px`;
}

function positionZoomButtonByHintVisibility() {
    const zoomBtn = document.getElementById('zoomJarBtn');
    const hint = document.getElementById('shakeHint');
    const hintSlot = document.getElementById('zoomHintSlot');
    const centerSlot = document.getElementById('zoomCenterSlot');
    if (!zoomBtn || !hint || !hintSlot || !centerSlot) return;

    const hintHidden = hint.classList.contains('hidden') || hint.classList.contains('hidden-empty');
    const targetParent = hintHidden ? centerSlot : hintSlot;
    if (zoomBtn.parentElement !== targetParent) {
        targetParent.appendChild(zoomBtn);
    }
}

function getJarInspectElements() {
    return {
        overlay: document.getElementById('jarInspectOverlay'),
        closeBtn: document.getElementById('jarInspectClose'),
        viewport: document.getElementById('jarInspectViewport'),
        canvas: document.getElementById('jarInspectCanvas'),
        source: document.getElementById('jarCanvas'),
        zoomBtn: document.getElementById('zoomJarBtn')
    };
}

function clampJarInspectPan(viewW, viewH, finalW, finalH) {
    const maxPanX = Math.max(0, (finalW - viewW) / 2);
    const maxPanY = Math.max(0, (finalH - viewH) / 2);
    jarInspectPanX = Math.max(-maxPanX, Math.min(maxPanX, jarInspectPanX));
    jarInspectPanY = Math.max(-maxPanY, Math.min(maxPanY, jarInspectPanY));
}

function getJarInspectImage(url) {
    if (!isSafeImageUrl(url)) return null;
    if (imageCache[url] && imageCache[url].complete) return imageCache[url];
    if (jarInspectImageCache[url] && jarInspectImageCache[url].complete) return jarInspectImageCache[url];
    if (!jarInspectImageCache[url]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        jarInspectImageCache[url] = img;
    }
    return null;
}

function traceJarInspectPath(ctx, width, height) {
    traceJarCanvasPath(ctx, width, height);
}

function renderJarInspectFrame() {
    const { viewport, canvas, source } = getJarInspectElements();
    if (!isJarZoomed || !viewport || !canvas || !source) return;

    const viewW = viewport.clientWidth;
    const viewH = viewport.clientHeight;
    if (viewW <= 0 || viewH <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.max(1, Math.floor(viewW * dpr));
    const targetH = Math.max(1, Math.floor(viewH * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
    }

    const sourceRect = source.getBoundingClientRect();
    const sourceW = Math.max(1, sourceRect.width || source.clientWidth || 280);
    const sourceH = Math.max(1, sourceRect.height || source.clientHeight || 350);
    const coverScale = Math.max(viewW / sourceW, viewH / sourceH);
    const totalScale = coverScale * jarInspectScale;
    const finalW = sourceW * totalScale;
    const finalH = sourceH * totalScale;

    clampJarInspectPan(viewW, viewH, finalW, finalH);

    const drawX = (viewW - finalW) / 2 + jarInspectPanX;
    const drawY = (viewH - finalH) / 2 + jarInspectPanY;
    jarInspectTransform = { drawX, drawY, scale: totalScale };

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.fillStyle = '#f8fcfc';
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw high-res collectibles inside jar clipping path.
    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.scale(totalScale, totalScale);
    ctx.beginPath();
    traceJarInspectPath(ctx, sourceW, sourceH);
    ctx.clip();

    const sortedBodies = [...marbleBodies].sort((a, b) => a.position.y - b.position.y);
    sortedBodies.forEach((body) => {
        const x = typeof body._displayX === 'number' ? body._displayX : body.position.x;
        const y = typeof body._displayY === 'number' ? body._displayY : body.position.y;
        const r = Math.max(2, body.circleRadius || getMarbleSize() / 2);
        const config = collectibles[body.marbleType];

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(body._displayAngle || body.angle || 0);

        if (config?.isMarble) {
            // Draw gradient marble directly — no async image loading, no flash
            const color = body.marbleColor || '#1AA39D';
            const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.4, 0, 0, 0, r);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.15, lightenColor(color, 35));
            grad.addColorStop(0.55, color);
            grad.addColorStop(1, darkenColor(color, 30));
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
            // Shine highlight
            const shine = ctx.createRadialGradient(-r * 0.4, -r * 0.45, 0, -r * 0.3, -r * 0.35, r * 0.4);
            shine.addColorStop(0, 'rgba(255,255,255,0.75)');
            shine.addColorStop(0.5, 'rgba(255,255,255,0.25)');
            shine.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fillStyle = shine;
            ctx.fill();
        } else {
            const img = getJarInspectImage(body.marbleImage);
            if (img) {
                ctx.drawImage(img, -r, -r, r * 2, r * 2);
            } else {
                ctx.fillStyle = body.marbleColor || '#1AA39D';
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    });
    ctx.restore();

    // Jar outline overlay for context in zoom window.
    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.scale(totalScale, totalScale);
    ctx.beginPath();
    traceJarInspectPath(ctx, sourceW, sourceH);
    ctx.lineWidth = 3 / totalScale;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.stroke();
    ctx.restore();

    jarInspectAnimationFrame = null;
}

function tryShowZoomedMarbleDetailsFromClientPoint(clientX, clientY) {
    const { viewport } = getJarInspectElements();
    if (!viewport || !jarInspectTransform) return;
    const rect = viewport.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const worldX = (localX - jarInspectTransform.drawX) / jarInspectTransform.scale;
    const worldY = (localY - jarInspectTransform.drawY) / jarInspectTransform.scale;
    if (!Number.isFinite(worldX) || !Number.isFinite(worldY)) return;

    const point = { x: worldX, y: worldY };
    const hit = Query.point(marbleBodies, point);
    if (hit.length > 0) {
        openMarbleZoomDetails(hit[0]);
    }
}

function setJarZoom(zoomed) {
    isJarZoomed = !!zoomed;
    const { overlay, zoomBtn } = getJarInspectElements();

    if (overlay) {
        overlay.classList.toggle('active', isJarZoomed);
        overlay.setAttribute('aria-hidden', isJarZoomed ? 'false' : 'true');
    }

    if (zoomBtn) {
        zoomBtn.classList.toggle('active', isJarZoomed);
        zoomBtn.textContent = isJarZoomed ? 'Zoom Out' : 'Zoom In';
        zoomBtn.setAttribute('aria-pressed', isJarZoomed ? 'true' : 'false');
        zoomBtn.setAttribute('title', isJarZoomed ? 'Zoom out jar' : 'Zoom in jar');
    }

    if (isJarZoomed) {
        jarInspectPanX = 0;
        jarInspectPanY = -99999; // clamp will snap to bottom of jar
        if (jarInspectAnimationFrame) cancelAnimationFrame(jarInspectAnimationFrame);
        jarInspectAnimationFrame = requestAnimationFrame(renderJarInspectFrame);
    } else {
        if (jarInspectAnimationFrame) {
            cancelAnimationFrame(jarInspectAnimationFrame);
            jarInspectAnimationFrame = null;
        }
        jarInspectTransform = null;
    }
}

function toggleJarZoom() {
    setJarZoom(!isJarZoomed);
}

function undoLastMarble() {
    if (state.totalMarbles <= 0) return;
    const body = marbleBodies.pop();
    if (body && engine) {
        Composite.remove(engine.world, body);
    }
    state.marbles.pop();
    state.totalMarbles = state.marbles.length;
    saveState();
    updateMarbleCount();
}

// Setup event listeners
function setupEventListeners() {
    // Settings button - open settings page
    document.getElementById('settingsBtn')?.addEventListener('click', openSettings);
    document.getElementById('settingsCloseBtn')?.addEventListener('click', closeSettings);
    document.getElementById('premiumBuyBtn')?.addEventListener('click', purchasePremiumUnlock);
    document.getElementById('premiumRestoreBtn')?.addEventListener('click', restorePremiumPurchases);
    document.getElementById('premiumCustomerCenterBtn')?.addEventListener('click', rcPresentCustomerCenter);
    document.getElementById('premiumSyncBtn')?.addEventListener('click', showPremiumUpsell);
    document.getElementById('settingsResetBtn')?.addEventListener('click', async () => {
        const confirmed = await showConfirmDialog(
            'Warning: all items will be removed from the jar.\n\nThis cannot be undone.',
            'Empty Jar'
        );
        if (confirmed) {
            clearAllMarbles();
            alert('Jar emptied.');
        }
    });
    document.getElementById('selectAllCollectiblesBtn')?.addEventListener('click', () => {
        if (isCollectiblesLocked()) { showPremiumUpsell(); return; }
        setAllCollectiblesEnabled(true);
    });
    document.getElementById('deselectAllCollectiblesBtn')?.addEventListener('click', () => {
        if (isCollectiblesLocked()) { showPremiumUpsell(); return; }
        setAllCollectiblesEnabled(false);
    });
    document.getElementById('settingsClearCollectiblesBtn')?.addEventListener('click', async () => {
        const confirmed = await showConfirmDialog(
            'Warning: all items that have been tracked as collected will be cleared. Current items in the jar will stay.\n\nThis cannot be undone.',
            'Clear History'
        );
        if (confirmed) {
            clearCollectionHistory();
            alert('Collected items history cleared.');
        }
    });
    const applyCountBtn = document.getElementById('settingsApplyCountBtn');
    const countInput = document.getElementById('settingsMarbleCountInput');
    const capacityInput = document.getElementById('settingsCapacityInput');
    const capacitySlider = document.getElementById('settingsCapacitySlider');
    const applyCapacityBtn = document.getElementById('settingsApplyCapacityBtn');

    applyCountBtn?.addEventListener('click', () => {
        const value = Number(countInput?.value);
        setMarbleCount(value);
    });
    countInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = Number(countInput.value);
            setMarbleCount(value);
        }
    });
    applyCapacityBtn?.addEventListener('click', () => {
        const value = Number(capacityInput?.value);
        setJarCapacity(value);
    });
    capacitySlider?.addEventListener('input', () => {
        const snapped = snapJarCapacitySliderValue(Number(capacitySlider.value));
        capacitySlider.value = String(snapped);
        if (capacityInput) capacityInput.value = String(snapped);
    });
    capacityInput?.addEventListener('input', () => {
        const rawValue = Number(capacityInput.value || state.jarCapacity);
        const value = clampJarCapacity(rawValue);
        capacityInput.value = String(value);
        if (capacitySlider) capacitySlider.value = String(value);
    });
    capacityInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = Number(capacityInput.value);
            setJarCapacity(value);
        }
    });
    document.getElementById('undoMarbleBtn')?.addEventListener('click', undoLastMarble);
    document.getElementById('zoomJarBtn')?.addEventListener('click', toggleJarZoom);
    document.getElementById('menuToggleBtn')?.addEventListener('click', toggleFrontMenu);

    document.getElementById('menuCollectionLink')?.addEventListener('click', () => setFrontMenuOpen(false));
    document.getElementById('menuBackdrop')?.addEventListener('click', () => setFrontMenuOpen(false));
    document.getElementById('jarInspectClose')?.addEventListener('click', () => setJarZoom(false));
    document.getElementById('confirmCancelBtn')?.addEventListener('click', () => closeConfirmDialog(false));
    document.getElementById('confirmConfirmBtn')?.addEventListener('click', () => closeConfirmDialog(true));
    document.getElementById('confirmOverlay')?.addEventListener('click', (e) => {
        if (e.target?.id === 'confirmOverlay') closeConfirmDialog(false);
    });
    document.getElementById('jarInspectOverlay')?.addEventListener('click', (e) => {
        if (e.target?.id === 'jarInspectOverlay') setJarZoom(false);
    });

    const inspectViewport = document.getElementById('jarInspectViewport');
    let inspectPointerDownX = 0;
    let inspectPointerDownY = 0;
    let inspectDragStartX = 0;
    let inspectDragStartY = 0;
    let inspectDragActive = false;
    let inspectDragMoved = false;
    inspectViewport?.addEventListener('pointerdown', (e) => {
        inspectDragActive = true;
        inspectDragMoved = false;
        inspectPointerDownX = e.clientX;
        inspectPointerDownY = e.clientY;
        inspectDragStartX = e.clientX;
        inspectDragStartY = e.clientY;
        inspectViewport.setPointerCapture?.(e.pointerId);
    });
    inspectViewport?.addEventListener('pointermove', (e) => {
        if (!inspectDragActive || !isJarZoomed) return;
        const dx = e.clientX - inspectDragStartX;
        const dy = e.clientY - inspectDragStartY;
        if (!inspectDragMoved && Math.hypot(e.clientX - inspectPointerDownX, e.clientY - inspectPointerDownY) > 6) {
            inspectDragMoved = true;
        }
        jarInspectPanX += dx;
        jarInspectPanY += dy;
        inspectDragStartX = e.clientX;
        inspectDragStartY = e.clientY;
        renderJarInspectFrame();
    });
    const endInspectDrag = (e) => {
        if (isJarZoomed && !inspectDragMoved) {
            tryShowZoomedMarbleDetailsFromClientPoint(e.clientX, e.clientY);
        }
        inspectDragActive = false;
        inspectDragMoved = false;
        inspectViewport?.releasePointerCapture?.(e.pointerId);
    };
    inspectViewport?.addEventListener('pointerup', endInspectDrag);
    inspectViewport?.addEventListener('pointercancel', endInspectDrag);

    const syncBadge = document.getElementById('syncBadge');
    syncBadge?.setAttribute('role', 'button');
    syncBadge?.setAttribute('tabindex', '0');
    const openSyncSettings = () => {
        if (!isSyncEnabled()) return;
        setFrontMenuOpen(false);
        openSettings();
        const syncGroup = document.getElementById('syncGroup');
        if (syncGroup) {
            syncGroup.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        const emailInput = document.getElementById('syncEmail');
        if (emailInput && emailInput.offsetParent !== null) {
            setTimeout(() => emailInput.focus(), 180);
        }
    };
    syncBadge?.addEventListener('click', openSyncSettings);
    syncBadge?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openSyncSettings();
        }
    });
    const shakeHint = document.getElementById('shakeHint');
    if (shakeHint && !zoomHintObserver) {
        zoomHintObserver = new MutationObserver(() => positionZoomButtonByHintVisibility());
        zoomHintObserver.observe(shakeHint, { attributes: true, attributeFilter: ['class'] });
    }
    positionZoomButtonByHintVisibility();
    window.addEventListener('resize', positionFrontMenu);
    document.addEventListener('click', (e) => {
        if (!isBlankAreaTapTarget(e.target)) return;
        setJarOnlyMode(!isJarOnlyMode);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('confirmOverlay')?.classList.contains('active')) {
            closeConfirmDialog(false);
        }
        if (e.key === 'Escape') setFrontMenuOpen(false);
        if (e.key === 'Escape' && isJarZoomed) {
            setJarZoom(false);
        }
        if (e.key === 'Escape' && document.getElementById('settingsPage')?.classList.contains('active')) {
            closeSettings();
        }
    });
}

// Open settings page
function openSettings() {
    setFrontMenuOpen(false);
    document.getElementById('settingsPage').classList.add('active');
    document.body.classList.add('settings-open');
    document.body.style.overflow = 'hidden';
    renderPremiumSettings();
    const countInput = document.getElementById('settingsMarbleCountInput');
    if (countInput) countInput.value = String(state.totalMarbles);
    const capacityInput = document.getElementById('settingsCapacityInput');
    if (capacityInput) capacityInput.value = String(state.jarCapacity);
    const capacitySlider = document.getElementById('settingsCapacitySlider');
    if (capacitySlider) capacitySlider.value = String(state.jarCapacity);
}

// Close settings page
function closeSettings() {
    document.getElementById('settingsPage').classList.remove('active');
    document.body.classList.remove('settings-open');
    document.body.style.overflow = '';
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
