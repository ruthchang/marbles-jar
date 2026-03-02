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

const JAR_CLASS = 'jar-classic';

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
let jarInspectDragStartX = 0;
let jarInspectDragStartY = 0;
let jarInspectDragActive = false;
let jarInspectPointerDownX = 0;
let jarInspectPointerDownY = 0;
let jarInspectDragMoved = false;
let jarInspectTransform = null;
const jarInspectScale = 3.1;
const jarInspectImageCache = {};
let zoomHintObserver = null;

const SETTLE_LINEAR_SPEED = 0.05;
const SETTLE_ANGULAR_SPEED = 0.015;
const SETTLE_FRAMES = 12;

const JAR_SHAPE = {
    neckLeft: 0.345,
    neckRight: 0.655,
    neckTop: 0.108,
    neckBottom: 0.246,
    shoulderLeft: 0.255,
    shoulderRight: 0.745,
    shoulderY: 0.39,
    bodyLeft: 0.225,
    bodyRight: 0.775,
    sideBottomY: 0.84,
    bottomLeft: 0.34,
    bottomRight: 0.66,
    bottomCurveY: 0.95
};

const JAR_SHAPE_TUNER_STORAGE_KEY = 'marbleJarShapeTunerV2';
const JAR_SHAPE_TUNER_DEFAULTS = {
    mouthWidth: 50,
    neckHeight: 1.2,
    shoulderRoundness: 86,
    bodyWidth: 74
};
let jarShapeTuner = { ...JAR_SHAPE_TUNER_DEFAULTS };
let jarShapeRebuildTimer = null;

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
    const syncBadge = document.getElementById('syncBadge');
    const setSyncBadge = (text, cls) => {
        if (!syncBadge) return;
        syncBadge.textContent = text;
        syncBadge.classList.remove('sync-in', 'sync-out', 'sync-off', 'sync-unknown');
        syncBadge.classList.add(cls);
    };

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
                updateMarbleCount();
            }
        });
    }
}

function clampNumber(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
}

function normalizeJarShapeTuner(candidate = {}) {
    return {
        mouthWidth: clampNumber(candidate.mouthWidth, 36, 66, JAR_SHAPE_TUNER_DEFAULTS.mouthWidth),
        neckHeight: clampNumber(candidate.neckHeight, 0, 8, JAR_SHAPE_TUNER_DEFAULTS.neckHeight),
        shoulderRoundness: clampNumber(candidate.shoulderRoundness, 0, 100, JAR_SHAPE_TUNER_DEFAULTS.shoulderRoundness),
        bodyWidth: clampNumber(candidate.bodyWidth, 58, 82, JAR_SHAPE_TUNER_DEFAULTS.bodyWidth)
    };
}

function deriveJarShapeFromTuner(tuner) {
    const normalized = normalizeJarShapeTuner(tuner);
    const mouthHalf = normalized.mouthWidth / 200;
    const roundness = normalized.shoulderRoundness / 100;
    const neckTop = 0.098;
    const neckBottom = Math.min(0.18, neckTop + normalized.neckHeight / 300);
    const bodyHalf = normalized.bodyWidth / 205;
    const shoulderBlend = 1;
    const shoulderHalf = bodyHalf * shoulderBlend;
    const bottomHalf = bodyHalf * 0.74;
    const shoulderY = 0.305 + (1 - roundness) * 0.024;
    return {
        neckLeft: 0.5 - mouthHalf,
        neckRight: 0.5 + mouthHalf,
        neckTop,
        neckBottom,
        shoulderLeft: 0.5 - shoulderHalf,
        shoulderRight: 0.5 + shoulderHalf,
        shoulderY,
        bodyLeft: 0.5 - bodyHalf,
        bodyRight: 0.5 + bodyHalf,
        sideBottomY: 0.865,
        bottomLeft: 0.5 - bottomHalf,
        bottomRight: 0.5 + bottomHalf,
        bottomCurveY: 0.962
    };
}

function applyJarShapeFromTuner() {
    Object.assign(JAR_SHAPE, deriveJarShapeFromTuner(jarShapeTuner));
}

function saveJarShapeTuner() {
    localStorage.setItem(JAR_SHAPE_TUNER_STORAGE_KEY, JSON.stringify(jarShapeTuner));
}

function renderJarShapeTunerControls() {
    const mouthInput = document.getElementById('jarShapeMouthInput');
    const neckInput = document.getElementById('jarShapeNeckInput');
    const shoulderInput = document.getElementById('jarShapeShoulderInput');
    const bodyInput = document.getElementById('jarShapeBodyInput');
    if (!mouthInput || !neckInput || !shoulderInput || !bodyInput) return;

    mouthInput.value = String(jarShapeTuner.mouthWidth);
    neckInput.value = String(jarShapeTuner.neckHeight);
    shoulderInput.value = String(jarShapeTuner.shoulderRoundness);
    bodyInput.value = String(jarShapeTuner.bodyWidth);

    const mouthValue = document.getElementById('jarShapeMouthValue');
    const neckValue = document.getElementById('jarShapeNeckValue');
    const shoulderValue = document.getElementById('jarShapeShoulderValue');
    const bodyValue = document.getElementById('jarShapeBodyValue');
    if (mouthValue) mouthValue.textContent = `${jarShapeTuner.mouthWidth.toFixed(1)}%`;
    if (neckValue) neckValue.textContent = `${jarShapeTuner.neckHeight.toFixed(1)}%`;
    if (shoulderValue) shoulderValue.textContent = `${Math.round(jarShapeTuner.shoulderRoundness)}%`;
    if (bodyValue) bodyValue.textContent = `${jarShapeTuner.bodyWidth.toFixed(1)}%`;
}

function scheduleJarShapeRebuild() {
    if (jarShapeRebuildTimer) clearTimeout(jarShapeRebuildTimer);
    jarShapeRebuildTimer = setTimeout(() => {
        jarShapeRebuildTimer = null;
        if (!engine) return;
        rebuildPhysics();
    }, 90);
}

function updateJarShapeTuner(nextValues, options = {}) {
    const { save = true, rebuild = true } = options;
    jarShapeTuner = normalizeJarShapeTuner({ ...jarShapeTuner, ...nextValues });
    applyJarShapeFromTuner();
    renderJarShapeTunerControls();
    updateJarSvgPaths();
    if (rebuild) scheduleJarShapeRebuild();
    if (save) saveJarShapeTuner();
}

function loadJarShapeTuner() {
    let parsed = null;
    const saved = localStorage.getItem(JAR_SHAPE_TUNER_STORAGE_KEY);
    if (saved) {
        try {
            parsed = JSON.parse(saved);
        } catch (e) {
            console.warn('Failed to parse jar shape tuner settings', e);
        }
    }
    jarShapeTuner = normalizeJarShapeTuner({ ...JAR_SHAPE_TUNER_DEFAULTS, ...(parsed || {}) });
    applyJarShapeFromTuner();
}

// Initialize the app
async function init() {
    preloadImages();
    loadState();
    loadJarShapeTuner();
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
    updateJarSvgPaths();
    setupPhysics();
    setupEventListeners();
    renderJarShapeTunerControls();
    setJarZoom(false);
    renderCollectibles();
    renderSoundSettings();
    renderSyncUI();
    updateMarbleCount();
    if (typeof Sync !== 'undefined' && Sync.isConfigured && Sync.isConfigured()) {
        window.onSyncAuthChange = onSyncAuthChange;
    }

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
    const roundness = jarShapeTuner.shoulderRoundness / 100;
    const shoulderDelta = Math.max(0.03, JAR_SHAPE.shoulderY - JAR_SHAPE.neckBottom);
    const shoulderC1Y = JAR_SHAPE.neckBottom + shoulderDelta * (0.26 + 0.18 * roundness);
    const shoulderC2Y = JAR_SHAPE.neckBottom + shoulderDelta * (0.68 + 0.26 * roundness);
    const shoulderC1X = JAR_SHAPE.neckLeft - (0.0005 + 0.004 * roundness);
    const shoulderC2X = JAR_SHAPE.shoulderLeft;
    const sideBow = 0;
    const lowerY1 = JAR_SHAPE.sideBottomY + (JAR_SHAPE.bottomCurveY - JAR_SHAPE.sideBottomY) * 0.40;
    const lowerY2 = JAR_SHAPE.sideBottomY + (JAR_SHAPE.bottomCurveY - JAR_SHAPE.sideBottomY) * 0.9;
    const lowerX1 = JAR_SHAPE.bodyLeft + (JAR_SHAPE.bottomLeft - JAR_SHAPE.bodyLeft) * 0.10;
    const lowerX2 = JAR_SHAPE.bodyLeft + (JAR_SHAPE.bottomLeft - JAR_SHAPE.bodyLeft) * 0.70;
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
        leftShoulderC2X: px(shoulderC2X),
        leftShoulderC2Y: py(shoulderC2Y),
        leftBodyC1X: px(JAR_SHAPE.bodyLeft - sideBow),
        leftBodyC1Y: py(JAR_SHAPE.shoulderY + (JAR_SHAPE.sideBottomY - JAR_SHAPE.shoulderY) * 0.38),
        leftBodyC2X: px(JAR_SHAPE.bodyLeft - sideBow * 0.6),
        leftBodyC2Y: py(JAR_SHAPE.shoulderY + (JAR_SHAPE.sideBottomY - JAR_SHAPE.shoulderY) * 0.78),
        leftLowerC1X: px(lowerX1),
        leftLowerC1Y: py(lowerY1),
        leftLowerC2X: px(lowerX2),
        leftLowerC2Y: py(lowerY2),
        rightShoulderC1X: px(1 - shoulderC2X),
        rightShoulderC1Y: py(shoulderC2Y),
        rightShoulderC2X: px(1 - shoulderC1X),
        rightShoulderC2Y: py(shoulderC1Y),
        rightBodyC1X: px(JAR_SHAPE.bodyRight + sideBow),
        rightBodyC1Y: py(JAR_SHAPE.shoulderY + (JAR_SHAPE.sideBottomY - JAR_SHAPE.shoulderY) * 0.38),
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
    const lidWidth = clampNumber(jarShapeTuner.mouthWidth + 8, 38, 72, 56);
    container.style.setProperty('--lid-width', `${lidWidth}%`);
}

// Get collectible size from jar geometry, tuned so ~100 pieces fill near the top.
function getMarbleSize() {
    const targetFillCount = 100;
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
    scheduleRestoreMarbles(100);
}

// Apply parsed/remote state to app state (with migration)
function applyStateData(parsed) {
    if (!parsed) return;
    const typeMap = {
        ocean: 'seaLife'
    };
    const normalizeType = (type) => typeMap[type] || type;
    const allTypes = Object.keys(collectibles);
    state.marbles = (parsed.marbles || []).map(marble => ({
        ...marble,
        type: normalizeType(marble.type)
    }));
    state.collectibleType = normalizeType(parsed.collectibleType || 'marble');
    state.enabledCollectibles = Array.isArray(parsed.enabledCollectibles)
        ? [...new Set(parsed.enabledCollectibles.map(normalizeType))].filter(k => collectibles[k])
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
    state.soundTheme = parsed.soundTheme || 'default';

    // Backfill history from current marbles for older saves and keep it inclusive.
    const inferredHistory = buildCollectionHistoryFromMarbles(state.marbles);
    Object.entries(inferredHistory).forEach(([key, count]) => {
        state.collectionHistory[key] = Math.max(state.collectionHistory[key] || 0, count);
    });

    if (state.marbles.length > state.jarCapacity) {
        state.marbles = state.marbles.slice(0, state.jarCapacity);
        state.totalMarbles = state.marbles.length;
    }
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
        state.enabledCollectibles = Object.keys(collectibles);
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

function clampJarCapacity(value) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return DEFAULT_JAR_CAPACITY;
    return Math.max(MIN_JAR_CAPACITY, Math.min(MAX_JAR_CAPACITY, n));
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
            }
            option.classList.toggle('enabled', cb.checked);
            saveState();
        });
    });
    
    picker.querySelectorAll('.collectible-option-content').forEach(span => {
        span.addEventListener('click', (e) => {
            e.preventDefault();
            const option = span.closest('.collectible-option');
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
    const allTypes = Object.keys(collectibles);
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
    
    // Create engine with lower gravity for gentler movement
    engine = Engine.create({
        gravity: { x: 0, y: 0.8 },
        enableSleeping: false
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
            pixelRatio: window.devicePixelRatio || 1
        }
    });
    
    // Get classic jar boundaries.
    const bounds = getJarBoundaries(width, height);
    const { left: jarLeft, right: jarRight, top: jarTop, bottom: jarBottom } = bounds;
    
    // Create jar walls (invisible boundaries matching the jar shape)
    const wallOptions = {
        isStatic: true,
        render: { visible: false },
        friction: 0.08,
        frictionStatic: 0,
        restitution: 0.02
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

    // Click/tap collectible for detail modal
    setupMarbleZoom(canvas);
}

function wakeMarble(marble) {
    marble._settleFrames = 0;
    if (marble._lockedSettled) {
        Body.setStatic(marble, false);
        marble._lockedSettled = false;
    }
}

function wakeAllMarbles() {
    marbleBodies.forEach(wakeMarble);
}

// Check and respawn marbles that escape the jar bounds
function checkMarbleBounds() {
    const container = document.getElementById('jarContainer');
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    
    const bounds = getJarBoundaries(width, height);
    const { left: jarLeft, right: jarRight, top: jarTop, bottom: jarBottom, curveRadius } = bounds;
    const neck = getJarNeckBounds(width, height);
    const centerX = width / 2;
    marbleBodies.forEach(marble => {
        const pos = marble.position;
        const radius = marble.circleRadius || getMarbleSize() / 2;
        const innerPad = 2;
        const minX = jarLeft + radius + innerPad;
        const maxX = jarRight - radius - innerPad;
        const minY = jarTop + radius + innerPad;
        const maxY = jarBottom - radius - innerPad;
        let needsReset = false;
        let correctedX = pos.x;
        let correctedY = pos.y;
        let corrected = false;

        // Keep each collectible fully inside the jar rectangle.
        if (correctedX < minX) {
            correctedX = minX;
            corrected = true;
        } else if (correctedX > maxX) {
            correctedX = maxX;
            corrected = true;
        }
        if (correctedY < minY) {
            correctedY = minY;
            corrected = true;
        } else if (correctedY > maxY) {
            correctedY = maxY;
            corrected = true;
        }

        // Keep marbles inside a gradual neck taper near the top.
        if (correctedY <= neck.shoulderBottom) {
            const bodyHalf = (jarRight - jarLeft) / 2 - radius - innerPad;
            const neckHalf = (neck.right - neck.left) / 2 - radius - innerPad;
            const taperLinear = Math.max(
                0,
                Math.min(
                    1,
                    (correctedY - neck.shoulderTop) / Math.max(1, (neck.shoulderBottom - neck.shoulderTop))
                )
            );
            const taperProgress = taperLinear * taperLinear * (3 - 2 * taperLinear);
            const allowedHalfWidth = neckHalf + (bodyHalf - neckHalf) * taperProgress;
            const minAllowedX = neck.centerX - allowedHalfWidth;
            const maxAllowedX = neck.centerX + allowedHalfWidth;
            if (correctedX < minAllowedX) {
                correctedX = minAllowedX;
                corrected = true;
            } else if (correctedX > maxAllowedX) {
                correctedX = maxAllowedX;
                corrected = true;
            }
        }

        // Clamp to rounded bottom-corner arcs so items cannot cross the visible outline.
        const arcRadius = Math.max(8, curveRadius - radius - innerPad);

        // Left bottom corner quarter-circle
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

        // Right bottom corner quarter-circle
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

        if (corrected) {
            Body.setPosition(marble, { x: correctedX, y: correctedY });
            Body.setVelocity(marble, {
                x: marble.velocity.x * -0.15,
                y: marble.velocity.y * -0.15
            });
        }
        
        // Check if marble escaped bounds
        if (pos.x < jarLeft - 50 || pos.x > jarRight + 50 || 
            pos.y < jarTop - 100 || pos.y > jarBottom + 50) {
            needsReset = true;
        }
        
        // Check if marble has crazy velocity (flung too hard)
        const speed = Math.sqrt(marble.velocity.x ** 2 + marble.velocity.y ** 2);
        const angularSpeed = Math.abs(marble.angularVelocity || 0);
        if (speed > 30) {
            Body.setVelocity(marble, { 
                x: marble.velocity.x * 0.3, 
                y: marble.velocity.y * 0.3 
            });
        }

        // Aggressively damp residual spin; otherwise bodies can keep rotating forever.
        if (angularSpeed < 0.035) {
            if (angularSpeed !== 0) Body.setAngularVelocity(marble, 0);
        } else if (speed < 0.35) {
            Body.setAngularVelocity(marble, marble.angularVelocity * 0.82);
        }

        const nearFloorLine = correctedY >= maxY - 6;
        const nearBottomRegion = correctedY >= jarBottom - Math.max(90, curveRadius + 35);
        const isNearSideWall = correctedX <= minX + 2 || correctedX >= maxX - 2;
        const hasSupportBelow = marbleBodies.some((other) => {
            if (other === marble) return false;
            const verticalGap = other.position.y - correctedY;
            if (verticalGap < radius * 0.55 || verticalGap > radius * 2.3) return false;
            return Math.abs(other.position.x - correctedX) < radius * 1.75;
        });
        const canSleepHere = nearBottomRegion && (nearFloorLine || hasSupportBelow);

        // Never keep a body locked if it's not in the floor-settle zone.
        if (marble._lockedSettled && !nearBottomRegion) {
            Body.setStatic(marble, false);
            marble._lockedSettled = false;
            marble._settleFrames = 0;
        }
        const shouldSettleLock =
            canSleepHere &&
            ((speed < SETTLE_LINEAR_SPEED && angularSpeed < SETTLE_ANGULAR_SPEED) ||
            (speed < 0.12 && angularSpeed < 0.04));

        if (shouldSettleLock) {
            marble._settleFrames = (marble._settleFrames || 0) + 1;
            if (marble._settleFrames >= SETTLE_FRAMES) {
                Body.setVelocity(marble, { x: 0, y: 0 });
                Body.setAngularVelocity(marble, 0);
                marble.force.x = 0;
                marble.force.y = 0;
                marble.torque = 0;
                if (!marble._lockedSettled) {
                    Body.setStatic(marble, true);
                    marble._lockedSettled = true;
                }
                return;
            }
        } else {
            marble._settleFrames = 0;
        }

        // If an item is hugging a side wall without support, nudge it downward.
        if (isNearSideWall && !canSleepHere && speed < 0.35) {
            const pushX = correctedX < centerX ? 0.00008 : -0.00008;
            Body.applyForce(marble, marble.position, { x: pushX, y: 0.00033 });
        }
        
        if (needsReset) {
            // Respawn at random position inside jar
            const newX = neck.left + 12 + Math.random() * Math.max(1, (neck.right - neck.left - 24));
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
    if (setupShakeInteraction._initialized) return;
    setupShakeInteraction._initialized = true;

    const container = document.getElementById('jarContainer');
    const shakeHint = document.getElementById('shakeHint');
    let isDragging = false;
    let hasMoved = false;
    let dragStartTime = 0;
    let dragStartPos = { x: 0, y: 0 };
    const tapMaxDuration = 280;
    const lidTapHeight = 72;
    const dragThreshold = 12;
    let lastX = 0, lastY = 0;
    let velocityX = 0, velocityY = 0;
    
    function startDrag(e) {
        isDragging = true;
        hasMoved = false;
        dragStartTime = Date.now();
        const pos = getEventPosition(e);
        lastX = pos.x;
        lastY = pos.y;
        dragStartPos = pos;
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
            wakeAllMarbles();
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
        if (!isDragging) return;
        const wasTap = !hasMoved && (Date.now() - dragStartTime) < tapMaxDuration;
        if (wasTap) {
            const rect = container.getBoundingClientRect();
            const tapY = dragStartPos.y - rect.top;
            if (tapY >= 0 && tapY <= lidTapHeight) {
                addMarble();
                shakeHint.classList.add('hidden');
            }
        }
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
        marbleBodies.forEach(marble => {
            Body.applyForce(marble, marble.position, {
                x: x * 0.0007,
                y: -y * 0.0006
            });
        });
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
        const gradient = `radial-gradient(circle at 30% 30%, ${lightenColor(marble.marbleColor || '#1AA39D', 40)} 0%, ${marble.marbleColor || '#1AA39D'} 50%, ${darkenColor(marble.marbleColor || '#1AA39D', 30)} 100%)`;
        preview = `<div class="marble-zoom-gradient" style="background: ${gradient};"></div>`;
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
    const enabled = state.enabledCollectibles.filter(k => collectibles[k]);
    if (enabled.length === 0) return state.collectibleType;
    return enabled[Math.floor(Math.random() * enabled.length)];
}

// Add a collectible to the jar
function addMarble(type, options = {}) {
    const { playSound = true } = options;
    if (state.totalMarbles >= state.jarCapacity) return null;
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
    
    // Start position (drop from inside jar, below the lid)
    const x = neck.left + 12 + Math.random() * Math.max(1, (neck.right - neck.left - 24));
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
        renderOptions = {
            sprite: {
                texture: imageUrl,
                xScale: (radius * 2) / 128,
                yScale: (radius * 2) / 128
            }
        };
    }
    
    const marble = Bodies.circle(x, y, radius, {
        restitution: 0.18,
        friction: 0.05,
        frictionStatic: 0.01,
        frictionAir: 0.008,
        density: 0.001,
        sleepThreshold: 25,
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
    recordCollectedHistory(type, itemName, fallbackColor, imageUrl);
    state.totalMarbles++;
    saveState();
    updateMarbleCount();
    
    // Play add sound
    if (playSound) playAddSound();
    
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
            const x = neck.left + 12 + Math.random() * Math.max(1, (neck.right - neck.left - 24));
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
            
            const marble = Bodies.circle(x, y, radius, {
                restitution: 0.18,
                friction: 0.05,
                frictionStatic: 0.01,
                frictionAir: 0.008,
                density: 0.001,
                sleepThreshold: 25,
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

// Update marble count display
function updateMarbleCount() {
    document.getElementById('marbleCount').textContent = state.totalMarbles;
    const labelEl = document.getElementById('marbleCountLabel');
    if (labelEl) {
        labelEl.textContent = state.totalMarbles === 1 ? 'marble collected' : 'marbles collected';
    }
    const undoBtn = document.getElementById('undoMarbleBtn');
    if (undoBtn) undoBtn.disabled = state.totalMarbles === 0;
    const shakeHint = document.getElementById('shakeHint');
    if (shakeHint) {
        shakeHint.classList.toggle('hidden-empty', state.totalMarbles === 0);
    }
    positionZoomButtonByHintVisibility();
    const countInput = document.getElementById('settingsMarbleCountInput');
    if (countInput) {
        countInput.value = String(state.totalMarbles);
        countInput.max = String(state.jarCapacity);
    }
    const capacityInput = document.getElementById('settingsCapacityInput');
    if (capacityInput) capacityInput.value = String(state.jarCapacity);
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
        return;
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

function traceJarInspectPath(ctx, bounds, width, height) {
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

function renderJarInspectFrame() {
    const { viewport, canvas, source } = getJarInspectElements();
    if (!isJarZoomed || !viewport || !canvas || !source) return;

    const viewW = viewport.clientWidth;
    const viewH = viewport.clientHeight;
    if (viewW <= 0 || viewH <= 0) {
        jarInspectAnimationFrame = requestAnimationFrame(renderJarInspectFrame);
        return;
    }

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

    const bounds = getJarBoundaries(sourceW, sourceH);

    // Draw high-res collectibles inside jar clipping path.
    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.scale(totalScale, totalScale);
    ctx.beginPath();
    traceJarInspectPath(ctx, bounds, sourceW, sourceH);
    ctx.clip();

    const sortedBodies = [...marbleBodies].sort((a, b) => a.position.y - b.position.y);
    sortedBodies.forEach((body) => {
        const x = body.position.x;
        const y = body.position.y;
        const r = Math.max(2, body.circleRadius || getMarbleSize() / 2);
        const config = collectibles[body.marbleType];

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(body.angle || 0);

        if (config?.isMarble) {
            const base = body.marbleColor || '#1AA39D';
            const grad = ctx.createRadialGradient(-r * 0.32, -r * 0.28, 0, 0, 0, r);
            grad.addColorStop(0, lightenColor(base, 40));
            grad.addColorStop(0.5, base);
            grad.addColorStop(1, darkenColor(base, 30));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
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
    traceJarInspectPath(ctx, bounds, sourceW, sourceH);
    ctx.lineWidth = 3 / totalScale;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.stroke();
    ctx.restore();

    jarInspectAnimationFrame = requestAnimationFrame(renderJarInspectFrame);
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
        jarInspectPanY = 0;
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
    document.getElementById('settingsPage')?.addEventListener('click', (e) => {
        if (e.target?.id === 'settingsPage') closeSettings();
    });
    document.getElementById('settingsResetBtn')?.addEventListener('click', () => {
        if (confirm('Empty your jar? This clears current jar contents but keeps your collection history.')) {
            clearAllMarbles();
        }
    });
    document.getElementById('selectAllCollectiblesBtn')?.addEventListener('click', () => {
        setAllCollectiblesEnabled(true);
    });
    document.getElementById('deselectAllCollectiblesBtn')?.addEventListener('click', () => {
        setAllCollectiblesEnabled(false);
    });
    document.getElementById('settingsClearCollectiblesBtn')?.addEventListener('click', () => {
        if (confirm('Clear all collected-item history? This will reset what appears unlocked in Collection.')) {
            clearCollectionHistory();
        }
    });
    const applyCountBtn = document.getElementById('settingsApplyCountBtn');
    const countInput = document.getElementById('settingsMarbleCountInput');
    const capacityInput = document.getElementById('settingsCapacityInput');
    const applyCapacityBtn = document.getElementById('settingsApplyCapacityBtn');
    const capacityDownBtn = document.getElementById('settingsCapacityDownBtn');
    const capacityUpBtn = document.getElementById('settingsCapacityUpBtn');
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
    capacityInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = Number(capacityInput.value);
            setJarCapacity(value);
        }
    });
    capacityDownBtn?.addEventListener('click', () => {
        setJarCapacity(state.jarCapacity - 1);
    });
    capacityUpBtn?.addEventListener('click', () => {
        setJarCapacity(state.jarCapacity + 1);
    });
    const shapeMouthInput = document.getElementById('jarShapeMouthInput');
    const shapeNeckInput = document.getElementById('jarShapeNeckInput');
    const shapeShoulderInput = document.getElementById('jarShapeShoulderInput');
    const shapeBodyInput = document.getElementById('jarShapeBodyInput');
    const bindShapeInput = (el, key) => {
        el?.addEventListener('input', () => {
            updateJarShapeTuner({ [key]: Number(el.value) });
        });
    };
    bindShapeInput(shapeMouthInput, 'mouthWidth');
    bindShapeInput(shapeNeckInput, 'neckHeight');
    bindShapeInput(shapeShoulderInput, 'shoulderRoundness');
    bindShapeInput(shapeBodyInput, 'bodyWidth');
    document.getElementById('jarShapeResetBtn')?.addEventListener('click', () => {
        updateJarShapeTuner({ ...JAR_SHAPE_TUNER_DEFAULTS });
    });
    document.getElementById('undoMarbleBtn')?.addEventListener('click', undoLastMarble);
    document.getElementById('zoomJarBtn')?.addEventListener('click', toggleJarZoom);
    document.getElementById('menuToggleBtn')?.addEventListener('click', toggleFrontMenu);
    document.getElementById('menuCollectionLink')?.addEventListener('click', () => setFrontMenuOpen(false));
    document.getElementById('menuBackdrop')?.addEventListener('click', () => setFrontMenuOpen(false));
    document.getElementById('jarInspectClose')?.addEventListener('click', () => setJarZoom(false));
    document.getElementById('jarInspectOverlay')?.addEventListener('click', (e) => {
        if (e.target?.id === 'jarInspectOverlay') setJarZoom(false);
    });

    const inspectViewport = document.getElementById('jarInspectViewport');
    inspectViewport?.addEventListener('pointerdown', (e) => {
        jarInspectDragActive = true;
        jarInspectDragMoved = false;
        jarInspectPointerDownX = e.clientX;
        jarInspectPointerDownY = e.clientY;
        jarInspectDragStartX = e.clientX;
        jarInspectDragStartY = e.clientY;
        inspectViewport.setPointerCapture?.(e.pointerId);
    });
    inspectViewport?.addEventListener('pointermove', (e) => {
        if (!jarInspectDragActive || !isJarZoomed) return;
        const dx = e.clientX - jarInspectDragStartX;
        const dy = e.clientY - jarInspectDragStartY;
        if (!jarInspectDragMoved && Math.hypot(e.clientX - jarInspectPointerDownX, e.clientY - jarInspectPointerDownY) > 6) {
            jarInspectDragMoved = true;
        }
        jarInspectPanX += dx;
        jarInspectPanY += dy;
        jarInspectDragStartX = e.clientX;
        jarInspectDragStartY = e.clientY;
    });
    const endInspectDrag = (e) => {
        if (isJarZoomed && !jarInspectDragMoved) {
            tryShowZoomedMarbleDetailsFromClientPoint(e.clientX, e.clientY);
        }
        jarInspectDragActive = false;
        jarInspectDragMoved = false;
        inspectViewport?.releasePointerCapture?.(e.pointerId);
    };
    inspectViewport?.addEventListener('pointerup', endInspectDrag);
    inspectViewport?.addEventListener('pointercancel', endInspectDrag);

    const syncBadge = document.getElementById('syncBadge');
    syncBadge?.setAttribute('role', 'button');
    syncBadge?.setAttribute('tabindex', '0');
    const openSyncSettings = () => {
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

    document.addEventListener('keydown', (e) => {
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
    const countInput = document.getElementById('settingsMarbleCountInput');
    if (countInput) countInput.value = String(state.totalMarbles);
    const capacityInput = document.getElementById('settingsCapacityInput');
    if (capacityInput) capacityInput.value = String(state.jarCapacity);
    renderJarShapeTunerControls();
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
