const query = new URLSearchParams(window.location.search);
const currentTheme = query.get("theme") === "light" ? "light" : "dark";
const currentLanguage = query.get("lang") === "ar" ? "ar" : "en";
const DEFAULT_MODEL_PATH = "assets/castle_of_consuegra_toledo_spain.glb";
const DEFAULT_MODEL_ROTATION = {
    x: 0,
    y: Math.PI,
    z: 0
};
const DEFAULT_MARKER_MODEL_POSITION = {
    x: 0.5,
    y: 0.5,
    z: 0.03
};
const MARKER_LOST_GRACE_FRAMES = 0;
const TRACKING_LERP_ALPHA = 0.18;
const TRACKING_SCALE_LERP_ALPHA = 0.12;
const CONFIRM_FRAMES = 3;
const MIN_QR_AREA_RATIO = 0.008;
const MIN_QR_EDGE = 48;
const MAX_QR_EDGE_RATIO = 2.3;
const MAX_CENTER_JUMP_RATIO = 0.12;
const QR_SCAN_INTERVAL_MS = 42;
const QR_SEARCH_INTERVAL_MS = 64;
const MAX_RENDER_PIXEL_RATIO = 1.25;
const CAMERA_IDEAL_WIDTH = 960;
const CAMERA_IDEAL_HEIGHT = 540;
const CAMERA_IDEAL_FRAME_RATE = 24;
const CAMERA_MAX_FRAME_RATE = 30;
const SHOW_DEBUG_CAMERA_CANVAS = false;
const MOBILE_INFO_CARD_BREAKPOINT = 820;
const IS_TOUCH_DEVICE = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
const DEVICE_MEMORY_GB = navigator.deviceMemory || 4;
const USE_FAST_CASTLE_MODEL = query.get("quality") === "fast";

document.documentElement.dataset.theme = currentTheme;
document.documentElement.lang = currentLanguage;
document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";

const UI = {
    appEyebrow: document.getElementById("app-eyebrow"),
    appTitle: document.getElementById("app-title"),
    canvasOutput: document.getElementById("canvasOutput"),
    canvasThree: document.getElementById("canvasThree"),
    card: document.getElementById("info-card"),
    cardHint: document.getElementById("card-hint"),
    cardTag: document.getElementById("card-tag"),
    collisionBtn: document.getElementById("btn-collision"),
    collisionLabel: document.getElementById("collision-label"),
    labelToggle: document.getElementById("label-toggle"),
    labelsLabel: document.getElementById("labels-label"),
    partInfo: document.getElementById("part-info"),
    partName: document.getElementById("part-name"),
    rotateBtn: document.getElementById("btn-rotate"),
    rotateLabel: document.getElementById("rotate-label"),
    scaleBtn: document.getElementById("btn-scale"),
    scaleLabel: document.getElementById("scale-label"),
    soundBtn: document.getElementById("btn-sound"),
    soundLabel: document.getElementById("sound-label"),
    status: document.getElementById("status"),
    video: document.getElementById("videoInput")
};

const defaultAnatomyParts = [
    {
        id: "main-keep",
        label: "Main Keep",
        title: "MAIN KEEP",
        info: "The keep was the strongest central structure, used for defense, command and shelter during attacks.",
        hint: "Look for the highest fortified mass of the castle.",
        normalizedPosition: [0, 0.28, 0.18]
    },
    {
        id: "defensive-walls",
        label: "Defensive Walls",
        title: "DEFENSIVE WALLS",
        info: "Thick walls protected the interior spaces and slowed attackers before they could reach the main courtyard.",
        hint: "Rotate the model to follow the wall line around the fortress.",
        normalizedPosition: [-0.34, 0.02, 0.18]
    },
    {
        id: "watchtower",
        label: "Watchtower",
        title: "WATCHTOWER",
        info: "Watchtowers gave guards a higher view of the surrounding plains and roads.",
        hint: "These raised points helped spot danger before it reached the castle.",
        normalizedPosition: [0.32, 0.2, 0.2]
    },
    {
        id: "entrance-gate",
        label: "Entrance Gate",
        title: "ENTRANCE GATE",
        info: "The gate controlled access and was usually one of the most protected parts of a medieval castle.",
        hint: "Gateways often combined narrow passages, strong doors and defensive angles.",
        normalizedPosition: [0.08, -0.2, 0.16]
    },
    {
        id: "courtyard",
        label: "Courtyard",
        title: "COURTYARD",
        info: "The courtyard was the working heart of the fortress, connecting storage, movement and daily activity.",
        hint: "This open area helped organize life inside the walls.",
        normalizedPosition: [0, -0.04, 0.28]
    }
].map((part, index) => ({
    ...part,
    number: index + 1
}));

const defaultCopy = {
    appEyebrow: "EduAR live scan",
    appTitle: "CASTLE OF CONSUEGRA",
    rotate: "Rotate",
    scale: "Scale",
    launchCollision: "Launch",
    pauseCollision: "Pause",
    sound: "Audio",
    labels: "Numbers On/Off",
    statusStarting: "Starting camera...",
    statusLoading: "Loading castle model...",
    statusReady: "Camera ready",
    statusTracking: "Castle placed",
    statusHoldSteady: "Hold steady while locking QR...",
    statusSearching: "Searching for QR code...",
    statusCameraError: "Camera access was denied.",
    statusModelError: "The castle model could not be loaded.",
    focusTag: "Castle feature",
    overview: {
        tag: "History model",
        title: "CASTLE OF CONSUEGRA",
        info: "Tap a numbered marker to understand the keep, walls, towers, gate and courtyard.",
        hint: "Use Rotate, Scale and Labels to inspect the castle more clearly."
    }
};

let anatomyParts = defaultAnatomyParts.map((part) => ({ ...part }));
let copy = {
    ...defaultCopy,
    overview: { ...defaultCopy.overview }
};

let renderer;
let labelRenderer;
let scene;
let camera;
let arGroup;
let heartModel;
let heartSound;
let animationMixer;
let animationClock;
let collisionActions = [];
let activeStream;
let anatomyLabels = [];
let currentMode = null;
let labelsVisible = true;
let isSoundPlaying = false;
let isCollisionPlaying = false;
let isDragging = false;
let prevPos = { x: 0, y: 0 };
let arScale = 3.0;
let markerLostGraceFrames = MARKER_LOST_GRACE_FRAMES;
let trackingLerpAlpha = TRACKING_LERP_ALPHA;
let trackingScaleLerpAlpha = TRACKING_SCALE_LERP_ALPHA;
let confirmFrames = CONFIRM_FRAMES;
let qrScanIntervalMs = QR_SCAN_INTERVAL_MS;
let qrSearchIntervalMs = QR_SEARCH_INTERVAL_MS;
let positionDeadzone = 0;
let scaleDeadzone = 0;
let rotationDeadzoneRad = 0;
let fastFollowDistance = 0;
let fastFollowAlpha = TRACKING_LERP_ALPHA;
let animationFrameId = 0;
let isArInitialized = false;
let isSessionStarting = false;
let focusedPartIndex = -1;
let lostMarkerFrames = 0;
let hasTrackingPose = false;
let hasLiveMarkerDetection = false;
let detectionStreak = 0;
let lastDetectionCenter = null;
let lastQrScanTime = 0;
let focalLength = 0;
let qrScannerReady = false;
let qrScanInFlight = false;
let scanContext;
let lastScanResult = {
    markerFound: false,
    shouldHoldSteady: false
};

const trackedMatrix = new THREE.Matrix4();
const trackedPosition = new THREE.Vector3();
const trackedQuaternion = new THREE.Quaternion();
const trackedScale = new THREE.Vector3();

const defaultConfig = {
    assets: {
        models: {
            primary: {
                name: "Castle of Consuegra",
                path: DEFAULT_MODEL_PATH,
                position: DEFAULT_MARKER_MODEL_POSITION,
                scale: { x: 0.9, y: 0.9, z: 0.9 },
                rotation: DEFAULT_MODEL_ROTATION,
                autoCenter: true
            }
        },
        audio: "/test_shared/assets/heartbeat.mp3"
    },
    content: {
        defaultPart: {
            en: {
                tag: "History model",
                name: "CASTLE OF CONSUEGRA",
                info: "Explore a historic Spanish castle in AR and tap the numbered labels to learn how medieval fortifications worked.",
                hint: "Use rotate, scale and labels while the model is active."
            }
        },
        ui: {
            en: {
                appEyebrow: "EduAR live scan",
                appTitle: "CASTLE OF CONSUEGRA",
                rotate: "Rotate",
                scale: "Scale",
                launchCollision: "Launch",
                pauseCollision: "Pause",
                labels: "Numbers On/Off",
                statusStarting: "Starting camera...",
                statusLoading: "Loading castle model...",
                statusReady: "Camera ready",
                statusTracking: "Castle placed",
                statusHoldSteady: "Hold steady while locking QR...",
                statusSearching: "Searching for QR code...",
                statusCameraError: "Camera access was denied.",
                statusModelError: "The castle model could not be loaded.",
                focusTag: "Castle feature"
            }
        },
        parts: defaultAnatomyParts
    },
    settings: {
        arScale: 2.6,
        tracking: {
            markerLostGraceFrames: MARKER_LOST_GRACE_FRAMES,
            trackingLerpAlpha: TRACKING_LERP_ALPHA,
            trackingScaleLerpAlpha: TRACKING_SCALE_LERP_ALPHA,
            confirmFrames: CONFIRM_FRAMES,
            qrScanIntervalMs: QR_SCAN_INTERVAL_MS,
            qrSearchIntervalMs: QR_SEARCH_INTERVAL_MS,
            positionDeadzone: 0,
            scaleDeadzone: 0,
            rotationDeadzoneRad: 0,
            fastFollowDistance: 0,
            fastFollowAlpha: TRACKING_LERP_ALPHA
        }
    }
};

function getLocalizedString(value, fallback = "") {
    if (typeof value === "string") {
        return value;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
        const localizedValue = value[currentLanguage] ?? value.en;
        if (typeof localizedValue === "string") {
            return localizedValue;
        }
    }

    return fallback;
}

function getLocalizedBlock(value, fallback = {}) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        const localizedValue = value[currentLanguage] ?? value.en;
        if (localizedValue && typeof localizedValue === "object") {
            return localizedValue;
        }
    }

    return fallback;
}

function getPrimaryModelConfig(config) {
    const configuredModels = config?.assets?.models;
    if (configuredModels && typeof configuredModels === "object") {
        const entries = Object.values(configuredModels);
        if (entries.length > 0 && entries[0] && typeof entries[0] === "object") {
            return entries[0];
        }
    }

    return defaultConfig.assets.models.primary;
}

function resolvePartPosition(part, modelSize) {
    if (Array.isArray(part.normalizedPosition) && modelSize) {
        return [
            part.normalizedPosition[0] * modelSize.x,
            part.normalizedPosition[1] * modelSize.y,
            part.normalizedPosition[2] * modelSize.z
        ];
    }

    if (Array.isArray(part.position)) {
        return part.position;
    }

    return [0, 0, 0];
}

function hydrateRuntimeContent(config) {
    const localizedDefaultPart = getLocalizedBlock(
        config?.content?.defaultPart,
        defaultConfig.content.defaultPart.en
    );
    const localizedUi = getLocalizedBlock(
        config?.content?.ui,
        defaultConfig.content.ui.en
    );

    copy = {
        ...defaultCopy,
        ...localizedUi,
        overview: {
            tag:
                localizedDefaultPart.tag ??
                defaultConfig.content.defaultPart.en.tag,
            title:
                localizedDefaultPart.name ??
                defaultConfig.content.defaultPart.en.name,
            info:
                localizedDefaultPart.info ??
                defaultConfig.content.defaultPart.en.info,
            hint:
                localizedDefaultPart.hint ??
                defaultConfig.content.defaultPart.en.hint
        }
    };

    if (!copy.appTitle) {
        copy.appTitle = copy.overview.title;
    }

    copy.focusTag = copy.focusTag || copy.overview.tag;

    const partsSource = Array.isArray(config?.content?.parts)
        ? config.content.parts
        : defaultConfig.content.parts;

    anatomyParts = partsSource.map((part, index) => {
        const label = getLocalizedString(
            part.label,
            part.id ? String(part.id) : `Part ${index + 1}`
        );
        const title = getLocalizedString(part.title, label.toUpperCase());
        const info = getLocalizedString(part.info, copy.overview.info);
        const hint = getLocalizedString(part.hint, copy.overview.hint);

        return {
            id: part.id ?? `part-${index + 1}`,
            label,
            title,
            info,
            hint,
            position: Array.isArray(part.position) ? part.position : null,
            normalizedPosition: Array.isArray(part.normalizedPosition)
                ? part.normalizedPosition
                : null,
            number: part.number ?? index + 1
        };
    });
}

function setStatus(message) {
    if (!UI.status || UI.status.textContent === message) {
        return;
    }

    UI.status.textContent = message;
}

function applyTrackingSettings(config) {
    const runtimeTracking = config?.settings?.tracking ?? defaultConfig.settings.tracking;

    markerLostGraceFrames = Math.max(
        0,
        Number(runtimeTracking.markerLostGraceFrames ?? MARKER_LOST_GRACE_FRAMES)
    );
    trackingLerpAlpha = Math.min(
        1,
        Math.max(
            0.01,
            Number(runtimeTracking.trackingLerpAlpha ?? TRACKING_LERP_ALPHA)
        )
    );
    trackingScaleLerpAlpha = Math.min(
        1,
        Math.max(
            0.01,
            Number(
                runtimeTracking.trackingScaleLerpAlpha ??
                    TRACKING_SCALE_LERP_ALPHA
            )
        )
    );
    confirmFrames = Math.max(
        1,
        Number(runtimeTracking.confirmFrames ?? CONFIRM_FRAMES)
    );
    qrScanIntervalMs = Math.max(
        10,
        Number(runtimeTracking.qrScanIntervalMs ?? QR_SCAN_INTERVAL_MS)
    );
    qrSearchIntervalMs = Math.max(
        10,
        Number(runtimeTracking.qrSearchIntervalMs ?? QR_SEARCH_INTERVAL_MS)
    );
    positionDeadzone = Math.max(
        0,
        Number(runtimeTracking.positionDeadzone ?? 0)
    );
    scaleDeadzone = Math.max(0, Number(runtimeTracking.scaleDeadzone ?? 0));
    rotationDeadzoneRad = Math.max(
        0,
        Number(runtimeTracking.rotationDeadzoneRad ?? 0)
    );
    fastFollowDistance = Math.max(
        0,
        Number(runtimeTracking.fastFollowDistance ?? 0)
    );
    fastFollowAlpha = Math.min(
        1,
        Math.max(
            trackingLerpAlpha,
            Number(runtimeTracking.fastFollowAlpha ?? trackingLerpAlpha)
        )
    );
}

function getSelectedPart() {
    return focusedPartIndex >= 0 ? anatomyParts[focusedPartIndex] : null;
}

function updateInfoCard() {
    if (!UI.cardTag || !UI.partName || !UI.partInfo || !UI.cardHint) {
        return;
    }

    const selectedPart = getSelectedPart();

    if (!selectedPart) {
        UI.card.classList.remove("info-card--visible");
        UI.card.classList.remove("info-card--selected");
        return;
    }

    UI.cardTag.textContent = copy.focusTag;
    UI.partName.textContent = selectedPart.title;
    UI.partInfo.textContent = selectedPart.info;
    UI.cardHint.textContent = selectedPart.hint;
    UI.card.classList.add("info-card--visible");
    UI.card.classList.add("info-card--selected");
}

function syncLabels() {
    const shouldShowLabels =
        labelsVisible && Boolean(arGroup?.visible) && (hasLiveMarkerDetection || hasTrackingPose);

    anatomyLabels.forEach((entry) => {
        const isActive = entry.index === focusedPartIndex;
        entry.label.element.style.opacity = shouldShowLabels ? "1" : "0";
        entry.label.element.style.visibility = shouldShowLabels
            ? "visible"
            : "hidden";
        entry.label.element.style.pointerEvents = shouldShowLabels
            ? "auto"
            : "none";
        entry.label.element.classList.toggle("hotspot-label--active", isActive);
        entry.label.element.setAttribute("aria-pressed", String(isActive));
    });
}

function positionInfoCard() {
    if (!UI.card) {
        return;
    }

    const selectedEntry =
        focusedPartIndex >= 0 ? anatomyLabels[focusedPartIndex] : null;

    if (!selectedEntry || !arGroup?.visible) {
        UI.card.classList.remove("info-card--floating");
        UI.card.style.left = "50%";
        UI.card.style.top = "";
        UI.card.style.right = "";
        UI.card.style.bottom = "18px";
        UI.card.style.transform = "translateX(-50%)";
        return;
    }

    const markerRect = selectedEntry.label.element.getBoundingClientRect();
    const cardWidth = UI.card.offsetWidth || 300;
    const cardHeight = UI.card.offsetHeight || 170;

    let left = markerRect.right + 18;
    if (left + cardWidth > window.innerWidth - 16) {
        left = markerRect.left - cardWidth - 18;
    }

    let top = markerRect.top + markerRect.height / 2 - cardHeight / 2;
    left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, left));
    top = Math.max(16, Math.min(window.innerHeight - cardHeight - 16, top));

    UI.card.classList.add("info-card--floating");
    UI.card.style.left = `${left}px`;
    UI.card.style.top = `${top}px`;
    UI.card.style.right = "auto";
    UI.card.style.bottom = "auto";
    UI.card.style.transform = "none";
}

function setFocusedPart(index) {
    focusedPartIndex = Math.max(-1, Math.min(anatomyParts.length - 1, index));
    updateInfoCard();
    syncLabels();
    positionInfoCard();
}

function applyCopy() {
    UI.appEyebrow.textContent = copy.appEyebrow;
    UI.appTitle.textContent = copy.appTitle;
    UI.rotateLabel.textContent = copy.rotate;
    UI.scaleLabel.textContent = copy.scale;
    if (UI.collisionLabel) {
        UI.collisionLabel.textContent = copy.launchCollision;
    }
    UI.labelsLabel.textContent = copy.labels;
    document.title = `EduAR - ${copy.appTitle}`;
    updateInfoCard();
    positionInfoCard();
    setStatus(copy.statusStarting);
}

async function loadConfig() {
    if (isSessionStarting || activeStream) {
        return;
    }

    isSessionStarting = true;
    let config = defaultConfig;

    try {
        const response = await fetch("./data.json");
        if (response.ok) {
            config = await response.json();
        }
    } catch (error) {
        config = defaultConfig;
    }

    hydrateRuntimeContent(config);
    applyTrackingSettings(config);
    applyCopy();

    try {
        await startCamera(config);
    } finally {
        isSessionStarting = false;
    }
}

async function startCamera(config) {
    if (activeStream) {
        return;
    }

    setStatus(copy.statusStarting);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment",
                width: { ideal: CAMERA_IDEAL_WIDTH },
                height: { ideal: CAMERA_IDEAL_HEIGHT },
                frameRate: {
                    ideal: CAMERA_IDEAL_FRAME_RATE,
                    max: CAMERA_MAX_FRAME_RATE
                }
            }
        });
        activeStream = stream;

        await new Promise((resolve) => {
            const handleLoadedMetadata = () => {
                UI.video.removeEventListener("loadedmetadata", handleLoadedMetadata);
                resolve();
            };

            UI.video.addEventListener("loadedmetadata", handleLoadedMetadata);
            UI.video.srcObject = stream;
        });

        await UI.video.play().catch(() => undefined);

        const width = UI.video.videoWidth;
        const height = UI.video.videoHeight;

        [UI.video, UI.canvasOutput, UI.canvasThree].forEach((element) => {
            element.width = width;
            element.height = height;
        });

        fitToScreen();
        await initQrScanner();
        isArInitialized = true;
        initThree(config ?? defaultConfig);
        initTrackingProjection();
        setupControls();
        animationFrameId = window.requestAnimationFrame(processFrame);
    } catch (error) {
        console.error("Civilisation QR session failed to start.", error);
        setStatus(copy.statusCameraError);
    }
}

async function initQrScanner() {
    if (qrScannerReady) {
        return;
    }

    if (!window.ZXingWASM?.readBarcodes) {
        throw new Error("zxing-wasm reader was not loaded.");
    }

    scanContext =
        UI.canvasOutput?.getContext("2d", { willReadFrequently: true }) ??
        undefined;

    if (!scanContext) {
        throw new Error("A 2D scan context could not be created.");
    }

    await window.ZXingWASM.prepareZXingModule({ fireImmediately: true });
    qrScannerReady = true;
}

function initTrackingProjection() {
    focalLength = Math.max(UI.video.width, UI.video.height);

    const depthNear = 0.1;
    const depthFar = 1000;
    camera.projectionMatrix.set(
        (2 * focalLength) / UI.video.width,
        0,
        0,
        0,
        0,
        (2 * focalLength) / UI.video.height,
        0,
        0,
        0,
        0,
        -(depthFar + depthNear) / (depthFar - depthNear),
        (-2 * depthFar * depthNear) / (depthFar - depthNear),
        0,
        0,
        -1,
        0
    );
}

function initThree(config) {
    if (UI.video) {
        UI.video.style.display = "block";
        UI.video.style.zIndex = "0";
        UI.video.style.objectFit = "cover";
    }

    if (UI.canvasOutput) {
        UI.canvasOutput.style.display = SHOW_DEBUG_CAMERA_CANVAS ? "block" : "none";
        UI.canvasOutput.style.zIndex = "1";
    }

    if (UI.canvasThree) {
        UI.canvasThree.style.zIndex = SHOW_DEBUG_CAMERA_CANVAS ? "2" : "1";
    }

    renderer = new THREE.WebGLRenderer({
        canvas: UI.canvasThree,
        alpha: true,
        antialias: !IS_TOUCH_DEVICE,
        powerPreference: "low-power"
    });
    renderer.setSize(UI.video.width, UI.video.height, false);
    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, MAX_RENDER_PIXEL_RATIO)
    );

    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0";
    labelRenderer.domElement.style.left = "0";
    labelRenderer.domElement.style.pointerEvents = "none";
    labelRenderer.domElement.dir = "ltr";
    labelRenderer.domElement.style.direction = "ltr";
    labelRenderer.domElement.style.zIndex = "18";
    document.body.appendChild(labelRenderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        45,
        UI.video.width / UI.video.height,
        0.1,
        1000
    );

    arGroup = new THREE.Group();
    arGroup.visible = false;
    arGroup.matrixAutoUpdate = true;
    scene.add(arGroup);

    scene.add(new THREE.AmbientLight(0xffffff, 1.3));
    animationClock = new THREE.Clock();

    const keyLight = new THREE.PointLight(0xffffff, 0.95);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const accentLight = new THREE.PointLight(0x29d5ff, 0.9);
    accentLight.position.set(-4, 3, 4);
    scene.add(accentLight);

    const loader = new THREE.GLTFLoader();
    const modelConfig = getPrimaryModelConfig(config);
    const defaultModelConfig = defaultConfig.assets.models.primary;
    const modelPath = modelConfig.path ?? DEFAULT_MODEL_PATH;
    const modelPosition = modelConfig.position ?? defaultModelConfig.position;
    const modelScale = modelConfig.scale ?? defaultModelConfig.scale;
    const modelRotation =
        modelConfig.rotation ?? defaultModelConfig.rotation;
    const autoCenter = modelConfig.autoCenter ?? defaultModelConfig.autoCenter;

    arScale = config.settings?.arScale ?? defaultConfig.settings.arScale;
    heartSound = new Audio(config.assets?.audio ?? defaultConfig.assets.audio);
    heartSound.loop = true;

    setStatus(copy.statusLoading);

    const mountModel = (model, animations = []) => {
        heartModel = model;
        collisionActions = [];
        if (Array.isArray(animations) && animations.length > 0) {
            animationMixer = new THREE.AnimationMixer(heartModel);
            collisionActions = animations.map((clip) => {
                const action = animationMixer.clipAction(clip);
                action.setLoop(THREE.LoopRepeat, Infinity);
                action.clampWhenFinished = false;
                action.enabled = true;
                action.paused = true;
                action.play();
                return action;
            });
        }
            const localBounds = new THREE.Box3().setFromObject(heartModel);
            const modelCenter = localBounds.getCenter(new THREE.Vector3());
            const modelSize = localBounds.getSize(new THREE.Vector3());
            const modelAnchor = new THREE.Group();
            modelAnchor.position.set(
                modelPosition.x ?? DEFAULT_MARKER_MODEL_POSITION.x,
                modelPosition.y ?? DEFAULT_MARKER_MODEL_POSITION.y,
                modelPosition.z ?? DEFAULT_MARKER_MODEL_POSITION.z
            );
            arGroup.add(modelAnchor);

            const modelRig = new THREE.Group();
            modelRig.scale.set(
                modelScale.x ?? 0.95,
                modelScale.y ?? 0.95,
                modelScale.z ?? 0.95
            );
            modelRig.rotation.set(
                modelRotation.x ?? DEFAULT_MODEL_ROTATION.x,
                modelRotation.y ?? DEFAULT_MODEL_ROTATION.y,
                modelRotation.z ?? DEFAULT_MODEL_ROTATION.z
            );
            modelAnchor.add(modelRig);

            heartModel.position.set(
                autoCenter ? -modelCenter.x : 0,
                autoCenter ? -modelCenter.y : 0,
                autoCenter ? -modelCenter.z : 0
            );
            modelRig.add(heartModel);

            anatomyParts.forEach((part, index) => {
                addAnatomyLabel(part, index, modelSize, modelRig);
            });

            setupInteraction();
            updateInfoCard();
            syncLabels();
            positionInfoCard();
            setStatus(copy.statusReady);
    };

    if (USE_FAST_CASTLE_MODEL && modelPath === DEFAULT_MODEL_PATH) {
        mountModel(createFastCastleModel());
        return;
    }

    loader.load(
        modelPath,
        (gltf) => {
            mountModel(gltf.scene, gltf.animations);
        },
        undefined,
        () => {
            mountModel(createFastCastleModel());
        }
    );
}

function createFastCastleModel() {
    const castle = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: 0xb6ad9f, roughness: 0.85 });
    const darkStone = new THREE.MeshStandardMaterial({ color: 0x81796f, roughness: 0.9 });
    const roof = new THREE.MeshStandardMaterial({ color: 0x7b4b35, roughness: 0.75 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.16, 1.5), darkStone);
    base.position.y = -0.46;
    castle.add(base);

    const keep = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.1, 0.64), stone);
    keep.position.set(0, 0.08, 0);
    castle.add(keep);

    const wallShapes = [
        [0, -0.18, 0.68, 2.55, 0.42, 0.16],
        [0, -0.18, -0.68, 2.55, 0.42, 0.16],
        [-1.2, -0.18, 0, 0.16, 0.42, 1.22],
        [1.2, -0.18, 0, 0.16, 0.42, 1.22]
    ];

    wallShapes.forEach(([x, y, z, w, h, d]) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stone);
        wall.position.set(x, y, z);
        castle.add(wall);
    });

    [
        [-1.2, 0.03, -0.68],
        [1.2, 0.03, -0.68],
        [-1.2, 0.03, 0.68],
        [1.2, 0.03, 0.68]
    ].forEach(([x, y, z]) => {
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.9, 12), stone);
        tower.position.set(x, y, z);
        castle.add(tower);

        const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(0.23, 0.32, 12), roof);
        towerRoof.position.set(x, y + 0.6, z);
        castle.add(towerRoof);
    });

    const gate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.08), darkStone);
    gate.position.set(0, -0.34, 0.77);
    castle.add(gate);

    const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.36, 4), roof);
    keepRoof.position.set(0, 0.82, 0);
    keepRoof.rotation.y = Math.PI / 4;
    castle.add(keepRoof);

    return castle;
}

function addAnatomyLabel(part, index, modelSize, parentGroup) {
    if (!parentGroup) {
        return;
    }

    const labelPosition = resolvePartPosition(part, modelSize);
    const labelAnchor = new THREE.Group();
    labelAnchor.position.set(
        labelPosition[0],
        labelPosition[1],
        labelPosition[2]
    );
    parentGroup.add(labelAnchor);

    const button = document.createElement("button");
    button.className = "hotspot-label";
    button.dir = "ltr";
    button.style.direction = "ltr";
    button.type = "button";
    button.textContent = String(part.number);
    button.setAttribute("aria-label", part.label);
    button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setFocusedPart(focusedPartIndex === index ? -1 : index);
    });

    const label = new THREE.CSS2DObject(button);
    label.position.set(0, 0, 0);
    labelAnchor.add(label);
    anatomyLabels.push({ id: part.id, index, label });
}

function setupControls() {
    const syncModeButtons = () => {
        UI.rotateBtn.classList.toggle("active", currentMode === "rotate");
        UI.scaleBtn.classList.toggle("active", currentMode === "scale");
        UI.rotateBtn.setAttribute("aria-pressed", String(currentMode === "rotate"));
        UI.scaleBtn.setAttribute("aria-pressed", String(currentMode === "scale"));
    };

    const syncCollisionButton = () => {
        if (!UI.collisionBtn || !UI.collisionLabel) {
            return;
        }

        UI.collisionBtn.classList.toggle("active", isCollisionPlaying);
        UI.collisionBtn.setAttribute("aria-pressed", String(isCollisionPlaying));
        UI.collisionLabel.textContent = copy.launchCollision;
    };

    const syncSoundButton = () => {
        if (!UI.soundBtn) {
            return;
        }
        UI.soundBtn.classList.toggle("active", isSoundPlaying);
        UI.soundBtn.setAttribute("aria-pressed", String(isSoundPlaying));
    };

    const setMode = (mode) => {
        currentMode = currentMode === mode ? null : mode;
        isDragging = false;
        syncModeButtons();
    };

    const toggleSound = () => {
        if (!heartSound) {
            return;
        }

        if (isSoundPlaying) {
            isSoundPlaying = false;
            syncSoundButton();
            heartSound.pause();
            heartSound.currentTime = 0;
            return;
        }

        heartSound.play().then(() => {
            isSoundPlaying = true;
            syncSoundButton();
        }).catch(() => {
            isSoundPlaying = false;
            syncSoundButton();
        });
    };

    const toggleCollision = () => {
        if (!collisionActions.length) {
            return;
        }

        isCollisionPlaying = true;
        if (animationMixer) {
            animationMixer.setTime(0);
        }

        collisionActions.forEach((action) => {
            action.reset();
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.paused = false;
            action.play();
        });

        if (animationClock) {
            animationClock.getDelta();
        }

        syncCollisionButton();
    };

    UI.rotateBtn.onclick = () => setMode("rotate");
    UI.scaleBtn.onclick = () => setMode("scale");
    if (UI.collisionBtn) {
        UI.collisionBtn.onclick = toggleCollision;
    }
    if (UI.soundBtn) {
        UI.soundBtn.onclick = toggleSound;
    }
    UI.labelToggle.onchange = (event) => {
        labelsVisible = event.target.checked;
        syncLabels();
        positionInfoCard();
    };

    syncModeButtons();
    syncSoundButton();
    syncCollisionButton();
    syncLabels();
}

function setupInteraction() {
    const start = (event) => {
        if (!heartModel || !currentMode) {
            return;
        }

        isDragging = true;
        const point = event.touches?.[0] ?? event;
        prevPos = { x: point.clientX, y: point.clientY };

        if (event.cancelable) {
            event.preventDefault();
        }
    };

    const move = (event) => {
        if (!isDragging || !heartModel || !currentMode) {
            return;
        }

        const point = event.touches?.[0] ?? event;
        const deltaX = point.clientX - prevPos.x;
        const deltaY = point.clientY - prevPos.y;

        if (currentMode === "rotate") {
            heartModel.rotation.y += deltaX * 0.01;
            heartModel.rotation.x += deltaY * 0.01;
        } else if (currentMode === "scale") {
            const factor = Math.max(0.65, Math.min(1.45, 1 - deltaY * 0.005));
            heartModel.scale.multiplyScalar(factor);
        }

        prevPos = { x: point.clientX, y: point.clientY };

        if (event.cancelable) {
            event.preventDefault();
        }
    };

    UI.canvasThree.addEventListener("mousedown", start);
    UI.canvasThree.addEventListener("touchstart", start, { passive: false });
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("mouseup", () => {
        isDragging = false;
    });
    window.addEventListener("touchend", () => {
        isDragging = false;
    });
    UI.canvasThree.addEventListener("click", () => {
        if (!isDragging) {
            setFocusedPart(-1);
        }
    });
}

function getQrScanInterval() {
    return hasTrackingPose || detectionStreak > 0
        ? qrScanIntervalMs
        : qrSearchIntervalMs;
}

function getDetectedCorners(source) {
    if (!source) {
        return null;
    }

    if (Array.isArray(source) && source.length >= 4) {
        const corners = source
            .slice(0, 4)
            .map((point) => ({
                x: Number(point.x),
                y: Number(point.y)
            }))
            .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

        return corners.length === 4 ? corners : null;
    }

    const position = source.position ?? source;
    const orderedCorners = [
        position.topLeft,
        position.topRight,
        position.bottomRight,
        position.bottomLeft
    ];

    if (orderedCorners.some((point) => !point)) {
        return null;
    }

    const corners = orderedCorners
        .map((point) => ({
            x: Number(point.x),
            y: Number(point.y)
        }))
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

    return corners.length === 4 ? corners : null;
}

function getQrMetrics(corners) {
    if (!corners?.length) {
        return null;
    }

    const edgeLengths = corners.map((corner, index) => {
        const nextCorner = corners[(index + 1) % corners.length];
        return Math.hypot(nextCorner.x - corner.x, nextCorner.y - corner.y);
    });

    const area = Math.abs(
        corners.reduce((sum, corner, index) => {
            const nextCorner = corners[(index + 1) % corners.length];
            return sum + corner.x * nextCorner.y - nextCorner.x * corner.y;
        }, 0) / 2
    );

    const center = corners.reduce(
        (accumulator, corner) => ({
            x: accumulator.x + corner.x / corners.length,
            y: accumulator.y + corner.y / corners.length
        }),
        { x: 0, y: 0 }
    );

    return {
        area,
        center,
        maxEdge: Math.max(...edgeLengths),
        minEdge: Math.min(...edgeLengths)
    };
}

function isReliableDetection(metrics) {
    if (!metrics) {
        return false;
    }

    const frameArea = UI.video.width * UI.video.height;

    if (metrics.area < frameArea * MIN_QR_AREA_RATIO) {
        return false;
    }

    if (metrics.minEdge < MIN_QR_EDGE) {
        return false;
    }

    if (metrics.maxEdge / Math.max(metrics.minEdge, 1) > MAX_QR_EDGE_RATIO) {
        return false;
    }

    return true;
}

function updateDetectionConfidence(metrics) {
    if (!isReliableDetection(metrics)) {
        detectionStreak = 0;
        lastDetectionCenter = null;
        return false;
    }

    if (lastDetectionCenter) {
        const maxJump =
            Math.min(UI.video.width, UI.video.height) * MAX_CENTER_JUMP_RATIO;
        const currentJump = Math.hypot(
            metrics.center.x - lastDetectionCenter.x,
            metrics.center.y - lastDetectionCenter.y
        );
        detectionStreak = currentJump <= maxJump ? detectionStreak + 1 : 1;
    } else {
        detectionStreak = 1;
    }

    lastDetectionCenter = metrics.center;
    return detectionStreak >= confirmFrames;
}

function resetDetectionConfidence() {
    detectionStreak = 0;
    lastDetectionCenter = null;
}

function solveLinearSystem(matrix, vector) {
    const size = vector.length;
    const augmented = matrix.map((row, rowIndex) => [...row, vector[rowIndex]]);

    for (let pivotIndex = 0; pivotIndex < size; pivotIndex += 1) {
        let bestRowIndex = pivotIndex;
        let bestValue = Math.abs(augmented[pivotIndex][pivotIndex]);

        for (let rowIndex = pivotIndex + 1; rowIndex < size; rowIndex += 1) {
            const candidateValue = Math.abs(augmented[rowIndex][pivotIndex]);
            if (candidateValue > bestValue) {
                bestValue = candidateValue;
                bestRowIndex = rowIndex;
            }
        }

        if (bestValue < 1e-8) {
            return null;
        }

        if (bestRowIndex !== pivotIndex) {
            [augmented[pivotIndex], augmented[bestRowIndex]] = [
                augmented[bestRowIndex],
                augmented[pivotIndex]
            ];
        }

        const pivot = augmented[pivotIndex][pivotIndex];
        for (let columnIndex = pivotIndex; columnIndex <= size; columnIndex += 1) {
            augmented[pivotIndex][columnIndex] /= pivot;
        }

        for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
            if (rowIndex === pivotIndex) {
                continue;
            }

            const factor = augmented[rowIndex][pivotIndex];
            if (!factor) {
                continue;
            }

            for (let columnIndex = pivotIndex; columnIndex <= size; columnIndex += 1) {
                augmented[rowIndex][columnIndex] -=
                    factor * augmented[pivotIndex][columnIndex];
            }
        }
    }

    return augmented.map((row) => row[size]);
}

function computeHomography(corners) {
    if (!corners || corners.length !== 4) {
        return null;
    }

    const sourceCorners = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 }
    ];
    const matrix = [];
    const vector = [];

    sourceCorners.forEach((sourcePoint, index) => {
        const targetPoint = corners[index];
        const { x, y } = sourcePoint;
        const u = targetPoint.x;
        const v = targetPoint.y;

        matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
        vector.push(u);
        matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
        vector.push(v);
    });

    const solution = solveLinearSystem(matrix, vector);
    if (!solution) {
        return null;
    }

    return [
        [solution[0], solution[1], solution[2]],
        [solution[3], solution[4], solution[5]],
        [solution[6], solution[7], 1]
    ];
}

function vectorLength3(vector) {
    return Math.hypot(vector[0], vector[1], vector[2]);
}

function dot3(left, right) {
    return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function scaleVector3(vector, scalar) {
    return [vector[0] * scalar, vector[1] * scalar, vector[2] * scalar];
}

function subtractVector3(left, right) {
    return [
        left[0] - right[0],
        left[1] - right[1],
        left[2] - right[2]
    ];
}

function cross3(left, right) {
    return [
        left[1] * right[2] - left[2] * right[1],
        left[2] * right[0] - left[0] * right[2],
        left[0] * right[1] - left[1] * right[0]
    ];
}

function normalizeVector3(vector) {
    const length = vectorLength3(vector);
    if (length < 1e-8) {
        return null;
    }

    return scaleVector3(vector, 1 / length);
}

function updateTrackedPoseFromCorners(corners) {
    const homography = computeHomography(corners);
    if (!homography || !focalLength) {
        return false;
    }

    const principalX = UI.video.width / 2;
    const principalY = UI.video.height / 2;

    const toCameraVector = (column) => [
        (column[0] - principalX * column[2]) / focalLength,
        (column[1] - principalY * column[2]) / focalLength,
        column[2]
    ];

    const column1 = [homography[0][0], homography[1][0], homography[2][0]];
    const column2 = [homography[0][1], homography[1][1], homography[2][1]];
    const column3 = [homography[0][2], homography[1][2], homography[2][2]];

    const basis1 = toCameraVector(column1);
    const basis2 = toCameraVector(column2);
    const translationVector = toCameraVector(column3);
    const averageBasisLength =
        (vectorLength3(basis1) + vectorLength3(basis2)) * 0.5;

    if (!averageBasisLength) {
        return false;
    }

    const scaleFactor = 1 / averageBasisLength;
    let rotation1 = normalizeVector3(scaleVector3(basis1, scaleFactor));
    if (!rotation1) {
        return false;
    }

    const rawRotation2 = scaleVector3(basis2, scaleFactor);
    const rotation2Projected = subtractVector3(
        rawRotation2,
        scaleVector3(rotation1, dot3(rawRotation2, rotation1))
    );
    let rotation2 = normalizeVector3(rotation2Projected);
    if (!rotation2) {
        return false;
    }

    let rotation3 = normalizeVector3(cross3(rotation1, rotation2));
    if (!rotation3) {
        return false;
    }

    let translation = scaleVector3(translationVector, scaleFactor);
    if (translation[2] < 0) {
        rotation1 = scaleVector3(rotation1, -1);
        rotation2 = scaleVector3(rotation2, -1);
        translation = scaleVector3(translation, -1);
        rotation3 = normalizeVector3(cross3(rotation1, rotation2));
        if (!rotation3) {
            return false;
        }
    }

    trackedMatrix.set(
        rotation1[0] * arScale,
        rotation1[1] * arScale,
        rotation1[2] * arScale,
        translation[0],
        -rotation2[0] * arScale,
        -rotation2[1] * arScale,
        -rotation2[2] * arScale,
        -translation[1],
        -rotation3[0] * arScale,
        -rotation3[1] * arScale,
        -rotation3[2] * arScale,
        -translation[2],
        0,
        0,
        0,
        1
    );

    trackedMatrix.decompose(trackedPosition, trackedQuaternion, trackedScale);

    const uniformTrackedScale = Math.max(
        arScale * 0.84,
        Math.min(
            arScale * 1.16,
            (trackedScale.x + trackedScale.y + trackedScale.z) / 3
        )
    );
    trackedScale.setScalar(uniformTrackedScale);

    return Number.isFinite(trackedPosition.x) && Number.isFinite(trackedScale.x);
}

function applyTrackedPose() {
    if (!hasTrackingPose) {
        arGroup.position.copy(trackedPosition);
        arGroup.quaternion.copy(trackedQuaternion);
        arGroup.scale.copy(trackedScale);
        hasTrackingPose = true;
        return;
    }

    const positionDistance = arGroup.position.distanceTo(trackedPosition);
    const rotationDistance = arGroup.quaternion.angleTo(trackedQuaternion);
    const scaleDistance = Math.abs(arGroup.scale.x - trackedScale.x);
    const followAlpha =
        fastFollowDistance > 0 && positionDistance > fastFollowDistance
            ? fastFollowAlpha
            : trackingLerpAlpha;

    if (positionDistance > positionDeadzone) {
        arGroup.position.lerp(trackedPosition, followAlpha);
    }

    if (rotationDistance > rotationDeadzoneRad) {
        arGroup.quaternion.slerp(trackedQuaternion, followAlpha);
    }

    if (scaleDistance > scaleDeadzone) {
        arGroup.scale.lerp(trackedScale, trackingScaleLerpAlpha);
    }
}

async function runQrDetection() {
    if (!qrScannerReady || qrScanInFlight || !scanContext) {
        return;
    }

    qrScanInFlight = true;
    let markerFound = false;
    let shouldHoldSteady = false;
    let liveMarkerDetected = false;

    try {
        scanContext.drawImage(UI.video, 0, 0, UI.video.width, UI.video.height);
        const frame = scanContext.getImageData(
            0,
            0,
            UI.video.width,
            UI.video.height
        );
        const results = await window.ZXingWASM.readBarcodes(frame, {
            formats: ["QRCode"],
            maxNumberOfSymbols: 1,
            tryDownscale: true,
            tryHarder: true,
            tryInvert: true,
            tryRotate: true
        });

        const detectedBarcode = results.find((result) => result?.position);

        if (detectedBarcode) {
            const corners = getDetectedCorners(detectedBarcode.position);
            const metrics = getQrMetrics(corners);
            const confirmedDetection = updateDetectionConfidence(metrics);
            shouldHoldSteady = Boolean(metrics);

            if (
                confirmedDetection &&
                corners &&
                updateTrackedPoseFromCorners(corners)
            ) {
                applyTrackedPose();
                arGroup.visible = true;
                markerFound = true;
                liveMarkerDetected = true;
                lostMarkerFrames = 0;
            }
        } else {
            resetDetectionConfidence();
        }

        if (!markerFound) {
            if (hasTrackingPose && lostMarkerFrames < markerLostGraceFrames) {
                lostMarkerFrames += 1;
                arGroup.visible = true;
                markerFound = true;
            } else {
                arGroup.visible = false;
                hasTrackingPose = false;
                lostMarkerFrames = 0;
            }
        }

        hasLiveMarkerDetection = liveMarkerDetected;
        lastScanResult = { markerFound, shouldHoldSteady };
    } catch (error) {
        console.error("Civilisation QR scan failed.", error);
    } finally {
        qrScanInFlight = false;
    }
}

function processFrame(timestamp) {
    if (!activeStream || !renderer || !labelRenderer) {
        return;
    }

    if (!lastQrScanTime || timestamp - lastQrScanTime >= getQrScanInterval()) {
        lastQrScanTime = timestamp;
        void runQrDetection();
    }

    const { markerFound, shouldHoldSteady } = lastScanResult;

    if (markerFound) {
        setStatus(copy.statusTracking);
    } else if (shouldHoldSteady && detectionStreak > 0) {
        setStatus(copy.statusHoldSteady);
    } else {
        setStatus(copy.statusSearching);
    }

    syncLabels();

    if (animationMixer && isCollisionPlaying && animationClock) {
        animationMixer.update(animationClock.getDelta());
    } else if (animationClock) {
        animationClock.getDelta();
    }

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    positionInfoCard();

    animationFrameId = window.requestAnimationFrame(processFrame);
}

function fitToScreen() {
    const scale = Math.max(
        window.innerWidth / UI.video.videoWidth,
        window.innerHeight / UI.video.videoHeight
    );
    const width = UI.video.videoWidth * scale;
    const height = UI.video.videoHeight * scale;

    [UI.video, UI.canvasOutput, UI.canvasThree].forEach((layer) => {
        if (!layer) {
            return;
        }

        layer.style.width = `${width}px`;
        layer.style.height = `${height}px`;
        layer.style.left = "50%";
        layer.style.top = "50%";
        layer.style.transform = "translate(-50%, -50%)";
    });

    if (labelRenderer) {
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    positionInfoCard();
}

function cleanup() {
    if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
    }

    if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
        activeStream = undefined;
    }

    if (UI.video.srcObject) {
        UI.video.pause();
        UI.video.srcObject = null;
    }

    if (heartSound) {
        heartSound.pause();
        heartSound.currentTime = 0;
    }

    isSoundPlaying = false;
    isCollisionPlaying = false;
    isDragging = false;
    isArInitialized = false;
    focusedPartIndex = -1;
    lostMarkerFrames = 0;
    hasTrackingPose = false;
    hasLiveMarkerDetection = false;
    resetDetectionConfidence();
    lastQrScanTime = 0;
    focalLength = 0;
    qrScannerReady = false;
    qrScanInFlight = false;
    lastScanResult = {
        markerFound: false,
        shouldHoldSteady: false
    };

    if (renderer) {
        renderer.dispose();
    }

    if (labelRenderer?.domElement?.parentNode) {
        labelRenderer.domElement.parentNode.removeChild(labelRenderer.domElement);
    }

    anatomyLabels = [];
    scanContext = undefined;
    renderer = undefined;
    labelRenderer = undefined;
    scene = undefined;
    camera = undefined;
    arGroup = undefined;
    heartModel = undefined;
    heartSound = undefined;
    animationMixer = undefined;
    animationClock = undefined;
    collisionActions = [];
}

window.addEventListener("resize", fitToScreen);
window.addEventListener("pagehide", cleanup);
window.addEventListener("beforeunload", cleanup);

loadConfig();
