window.AR_VIEWER_BOOTSTRAP = {
    defaultModelPath: "assets/human_anatomy_skin.glb",
    defaultTitle: "HUMAN SKIN",
    defaultStatusLoading: "Loading human skin model...",
    defaultStatusTracking: "Human skin placed",
    defaultFocusTag: "Skin structure",
    defaultOverview: {
        tag: "Skin anatomy",
        title: "HUMAN SKIN",
        info: "Inspect the layers of the skin in AR and tap the numbered labels to understand each protective and sensory structure.",
        hint: "Use Rotate, Scale and Labels to inspect the skin more clearly."
    },
    defaultConfig: {
        assets: {
            models: {
                primary: {
                    name: "Human Skin",
                    path: "assets/human_anatomy_skin.glb",
                    scale: { x: 0.46, y: 0.46, z: 0.46 },
                    position: { x: 0.08, y: 0.15, z: 0.03 },
                    rotation: { x: -0.22, y: Math.PI - 0.18, z: 0.0 },
                    autoCenter: true
                }
            }
        },
        settings: {
            arScale: 1.8,
            tracking: {
                markerLostGraceFrames: 30,
                trackingLerpAlpha: 0.28,
                trackingScaleLerpAlpha: 0.22,
                confirmFrames: 2,
                qrScanIntervalMs: 60,
                qrSearchIntervalMs: 100,
                positionDeadzone: 0.01,
                scaleDeadzone: 0.012,
                rotationDeadzoneRad: 0.02,
                fastFollowDistance: 0.08,
                fastFollowAlpha: 0.68
            }
        }
    }
};

const query = new URLSearchParams(window.location.search);
const currentTheme = query.get("theme") === "light" ? "light" : "dark";
const currentLanguage = query.get("lang") === "ar" ? "ar" : "en";
const BOOT = window.AR_VIEWER_BOOTSTRAP ?? {};
const DEFAULT_MODEL_PATH = BOOT.defaultModelPath ?? "assets/model.glb";
const DEFAULT_MODEL_ROTATION = BOOT.defaultModelRotation ?? {
    x: -0.22,
    y: Math.PI - 0.18,
    z: 0
};
const LOST_GRACE_FRAMES = 30;
const TRACKING_LERP_ALPHA = 0.18;
const TRACKING_SCALE_LERP_ALPHA = 0.12;
const CONFIRM_FRAMES = 3;
const MIN_QR_AREA_RATIO = 0.008;
const MIN_QR_EDGE = 48;
const MAX_QR_EDGE_RATIO = 2.3;
const MAX_CENTER_JUMP_RATIO = 0.12;
const QR_SCAN_INTERVAL_MS = 60;
const QR_SEARCH_INTERVAL_MS = 100;
const QR_SCAN_FRAME_WIDTH = 480;
const QR_SCAN_FRAME_HEIGHT = 270;
const MAX_RENDER_PIXEL_RATIO = BOOT.maxRenderPixelRatio ?? 1;
const CAMERA_IDEAL_WIDTH = 960;
const CAMERA_IDEAL_HEIGHT = 540;
const CAMERA_IDEAL_FRAME_RATE = 24;
const CAMERA_MAX_FRAME_RATE = 30;
const SHOW_DEBUG_CAMERA_CANVAS = false;
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

const defaultAnatomyParts = Array.isArray(BOOT.defaultAnatomyParts)
    ? BOOT.defaultAnatomyParts.map((part, index) => ({
    ...part,
    number: index + 1
    }))
    : [];

function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(baseValue, overrideValue) {
    if (Array.isArray(baseValue)) {
        return Array.isArray(overrideValue) ? overrideValue : [...baseValue];
    }

    if (!isPlainObject(baseValue)) {
        return overrideValue ?? baseValue;
    }

    const mergedValue = { ...baseValue };

    if (!isPlainObject(overrideValue)) {
        return mergedValue;
    }

    Object.keys(overrideValue).forEach((key) => {
        const baseEntry = mergedValue[key];
        const overrideEntry = overrideValue[key];

        if (Array.isArray(overrideEntry)) {
            mergedValue[key] = overrideEntry;
            return;
        }

        if (isPlainObject(baseEntry) && isPlainObject(overrideEntry)) {
            mergedValue[key] = deepMerge(baseEntry, overrideEntry);
            return;
        }

        mergedValue[key] = overrideEntry;
    });

    return mergedValue;
}

const genericDefaultCopy = {
    appEyebrow: "AR Learn live scan",
    appTitle: BOOT.defaultTitle ?? "MODEL EXPERIENCE",
    rotate: "Rotate",
    scale: "Scale",
    sound: "Audio",
    labels: "Numbers On/Off",
    statusStarting: "Starting camera...",
    statusLoading: BOOT.defaultStatusLoading ?? "Loading model...",
    statusReady: "Camera ready",
    statusTracking: BOOT.defaultStatusTracking ?? "Model placed",
    statusHoldSteady: "Hold steady while locking QR...",
    statusSearching: "Searching for QR code...",
    statusCameraError: "Camera access was denied.",
    statusModelError: "The model could not be loaded.",
    focusTag: BOOT.defaultFocusTag ?? "Selected structure",
    overview: {
        tag: BOOT.defaultOverview?.tag ?? "Model anatomy",
        title: BOOT.defaultOverview?.title ?? (BOOT.defaultTitle ?? "MODEL EXPERIENCE"),
        info:
            BOOT.defaultOverview?.info ??
            "Inspect the model in AR and tap the numbered labels to read more about each structure.",
        hint:
            BOOT.defaultOverview?.hint ??
            "Use Rotate, Scale and Labels to inspect the model more clearly."
    }
};

const defaultCopy = deepMerge(genericDefaultCopy, BOOT.defaultCopy ?? {});

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
let activeStream;
let anatomyLabels = [];
let currentMode = null;
let labelsVisible = true;
let isSoundPlaying = false;
let isDragging = false;
let prevPos = { x: 0, y: 0 };
let arScale = 3.0;
let markerLostGraceFrames = LOST_GRACE_FRAMES;
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
let preloadedModelPath = "";
let preloadedModelPromise;
let isModelMounted = false;

const trackedMatrix = new THREE.Matrix4();
const trackedPosition = new THREE.Vector3();
const trackedQuaternion = new THREE.Quaternion();
const trackedScale = new THREE.Vector3();

const baseDefaultConfig = {
    assets: {
        models: {
            primary: {
                name: BOOT.defaultTitle ?? "Model Experience",
                path: DEFAULT_MODEL_PATH,
                position: { x: 0.08, y: 0.15, z: 0.03 },
                scale: { x: 1, y: 1, z: 1 },
                rotation: DEFAULT_MODEL_ROTATION,
                autoCenter: false
            }
        },
        audio: BOOT.defaultAudioPath ?? ""
    },
    content: {
        defaultPart: {
            en: {
                tag: defaultCopy.overview.tag,
                name: defaultCopy.overview.title,
                info: defaultCopy.overview.info,
                hint: defaultCopy.overview.hint
            }
        },
        ui: {
            en: {
                appEyebrow: defaultCopy.appEyebrow,
                appTitle: defaultCopy.appTitle,
                rotate: defaultCopy.rotate,
                scale: defaultCopy.scale,
                labels: defaultCopy.labels,
                statusStarting: defaultCopy.statusStarting,
                statusLoading: defaultCopy.statusLoading,
                statusReady: defaultCopy.statusReady,
                statusTracking: defaultCopy.statusTracking,
                statusHoldSteady: defaultCopy.statusHoldSteady,
                statusSearching: defaultCopy.statusSearching,
                statusCameraError: defaultCopy.statusCameraError,
                statusModelError: defaultCopy.statusModelError,
                focusTag: defaultCopy.focusTag
            }
        },
        parts: defaultAnatomyParts
    },
    settings: {
        arScale: 1.8,
        tracking: {
            markerLostGraceFrames: LOST_GRACE_FRAMES,
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

const defaultConfig = deepMerge(baseDefaultConfig, BOOT.defaultConfig ?? {});

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

function getConfiguredModelPath(config) {
    return getPrimaryModelConfig(config).path ?? DEFAULT_MODEL_PATH;
}

function startModelPreload(config) {
    const modelPath = getConfiguredModelPath(config);

    if (preloadedModelPromise && preloadedModelPath === modelPath) {
        return preloadedModelPromise;
    }

    preloadedModelPath = modelPath;
    preloadedModelPromise = new Promise((resolve, reject) => {
        const loader = new THREE.GLTFLoader();
        loader.load(modelPath, resolve, undefined, reject);
    });

    return preloadedModelPromise;
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
        Number(runtimeTracking.markerLostGraceFrames ?? LOST_GRACE_FRAMES)
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
    const isCompactViewport = window.innerWidth <= 600;
    const viewportMargin = isCompactViewport ? 10 : 16;
    const gap = isCompactViewport ? 10 : 18;
    const cardWidth = UI.card.offsetWidth || (isCompactViewport ? 220 : 300);
    const cardHeight = UI.card.offsetHeight || 170;
    const markerCenterX = markerRect.left + markerRect.width / 2;
    const markerCenterY = markerRect.top + markerRect.height / 2;

    const placementCandidates = isCompactViewport
        ? [
              {
                  left: markerCenterX - cardWidth / 2,
                  top: markerRect.top - cardHeight - gap
              },
              {
                  left: markerCenterX - cardWidth / 2,
                  top: markerRect.bottom + gap
              },
              {
                  left: markerRect.right + gap,
                  top: markerCenterY - cardHeight / 2
              },
              {
                  left: markerRect.left - cardWidth - gap,
                  top: markerCenterY - cardHeight / 2
              }
          ]
        : [
              {
                  left: markerRect.right + gap,
                  top: markerCenterY - cardHeight / 2
              },
              {
                  left: markerRect.left - cardWidth - gap,
                  top: markerCenterY - cardHeight / 2
              },
              {
                  left: markerCenterX - cardWidth / 2,
                  top: markerRect.top - cardHeight - gap
              },
              {
                  left: markerCenterX - cardWidth / 2,
                  top: markerRect.bottom + gap
              }
          ];

    const placementFitsViewport = ({ left, top }) =>
        left >= viewportMargin &&
        top >= viewportMargin &&
        left + cardWidth <= window.innerWidth - viewportMargin &&
        top + cardHeight <= window.innerHeight - viewportMargin;

    const clampPlacementToViewport = ({ left, top }) => ({
        left: Math.max(
            viewportMargin,
            Math.min(window.innerWidth - cardWidth - viewportMargin, left)
        ),
        top: Math.max(
            viewportMargin,
            Math.min(window.innerHeight - cardHeight - viewportMargin, top)
        )
    });

    const chosenPlacement = placementCandidates.find(placementFitsViewport)
        ?? clampPlacementToViewport(placementCandidates[0]);

    UI.card.classList.add("info-card--floating");
    UI.card.style.left = `${chosenPlacement.left}px`;
    UI.card.style.top = `${chosenPlacement.top}px`;
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
    UI.labelsLabel.textContent = copy.labels;
    document.title = `AR Learn - ${copy.appTitle}`;
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
    startModelPreload(config);

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
            if (element === UI.canvasOutput) {
                element.width = QR_SCAN_FRAME_WIDTH;
                element.height = QR_SCAN_FRAME_HEIGHT;
                return;
            }

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
        console.error("Human skin QR session failed to start.", error);
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
        antialias: false,
        powerPreference: "high-performance"
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

    const keyLight = new THREE.PointLight(0xffffff, 0.95);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const accentLight = new THREE.PointLight(0x29d5ff, 0.9);
    accentLight.position.set(-4, 3, 4);
    scene.add(accentLight);

    const modelConfig = getPrimaryModelConfig(config);
    const defaultModelConfig = defaultConfig.assets.models.primary;
    const modelPosition = modelConfig.position ?? defaultModelConfig.position;
    const modelScale = modelConfig.scale ?? defaultModelConfig.scale;
    const modelRotation =
        modelConfig.rotation ?? defaultModelConfig.rotation;
    const autoCenter = modelConfig.autoCenter ?? defaultModelConfig.autoCenter;
    const alignBaseY =
        modelConfig.alignBaseY ?? defaultModelConfig.alignBaseY ?? false;

    arScale = config.settings?.arScale ?? defaultConfig.settings.arScale;

    setStatus(copy.statusLoading);
    mountPrimaryModel(config, {
        modelPosition,
        modelScale,
        modelRotation,
        autoCenter,
        alignBaseY
    });
}

function mountPrimaryModel(config, runtimeModelConfig) {
    startModelPreload(config)
        .then((gltf) => {
            if (!arGroup || isModelMounted) {
                return;
            }

            heartModel = gltf.scene;

            if (heartModel.parent) {
                heartModel.parent.remove(heartModel);
            }

            const localBounds = new THREE.Box3().setFromObject(heartModel);
            const modelCenter = localBounds.getCenter(new THREE.Vector3());
            const modelSize = localBounds.getSize(new THREE.Vector3());
            const modelAnchor = new THREE.Group();
            modelAnchor.position.set(
                runtimeModelConfig.modelPosition.x ?? 0.5,
                runtimeModelConfig.modelPosition.y ?? 0.55,
                runtimeModelConfig.modelPosition.z ?? 0
            );
            arGroup.add(modelAnchor);

            const modelRig = new THREE.Group();
            modelRig.scale.set(
                runtimeModelConfig.modelScale.x ?? 1,
                runtimeModelConfig.modelScale.y ?? 1,
                runtimeModelConfig.modelScale.z ?? 1
            );
            modelRig.rotation.set(
                runtimeModelConfig.modelRotation.x ?? DEFAULT_MODEL_ROTATION.x,
                runtimeModelConfig.modelRotation.y ?? DEFAULT_MODEL_ROTATION.y,
                runtimeModelConfig.modelRotation.z ?? DEFAULT_MODEL_ROTATION.z
            );
            modelAnchor.add(modelRig);

            const modelOffsetY = runtimeModelConfig.alignBaseY
                ? -localBounds.min.y
                : runtimeModelConfig.autoCenter
                    ? -modelCenter.y
                    : 0;

            heartModel.position.set(
                runtimeModelConfig.autoCenter ? -modelCenter.x : 0,
                modelOffsetY,
                runtimeModelConfig.autoCenter ? -modelCenter.z : 0
            );
            modelRig.add(heartModel);

            anatomyParts.forEach((part, index) => {
                addAnatomyLabel(part, index, modelSize, modelRig);
            });

            isModelMounted = true;
            setupInteraction();
            updateInfoCard();
            syncLabels();
            positionInfoCard();
            setStatus(hasLiveMarkerDetection ? copy.statusTracking : copy.statusReady);
        })
        .catch(() => {
            setStatus(copy.statusModelError);
        });
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

    UI.rotateBtn.onclick = () => setMode("rotate");
    UI.scaleBtn.onclick = () => setMode("scale");
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

function scaleCornersToVideoSpace(corners) {
    if (!corners?.length || !UI.canvasOutput?.width || !UI.canvasOutput?.height) {
        return null;
    }

    const scaleX = UI.video.width / UI.canvasOutput.width;
    const scaleY = UI.video.height / UI.canvasOutput.height;

    return corners.map((corner) => ({
        x: corner.x * scaleX,
        y: corner.y * scaleY
    }));
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

            for (
                let columnIndex = pivotIndex;
                columnIndex <= size;
                columnIndex += 1
            ) {
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

    let rotation1 = normalizeVector3(scaleVector3(basis1, 1 / averageBasisLength));
    if (!rotation1) {
        return false;
    }

    const rawRotation2 = scaleVector3(basis2, 1 / averageBasisLength);
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

    let translation = scaleVector3(translationVector, 1 / averageBasisLength);
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

    trackedMatrix.decompose(
        trackedPosition,
        trackedQuaternion,
        trackedScale
    );

    return Number.isFinite(trackedPosition.x) && Number.isFinite(trackedScale.x);
}

function applyTrackedPose(immediate = false) {
    if (!arGroup) {
        return;
    }

    if (immediate || !hasTrackingPose) {
        arGroup.position.copy(trackedPosition);
        arGroup.quaternion.copy(trackedQuaternion);
        arGroup.scale.copy(trackedScale);
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
    const isTrackingActive =
        hasTrackingPose || detectionStreak > 0 || lostMarkerFrames > 0;

    try {
        scanContext.drawImage(
            UI.video,
            0,
            0,
            UI.canvasOutput.width,
            UI.canvasOutput.height
        );
        const frame = scanContext.getImageData(
            0,
            0,
            UI.canvasOutput.width,
            UI.canvasOutput.height
        );
        const results = await window.ZXingWASM.readBarcodes(frame, {
            formats: ["QRCode"],
            maxNumberOfSymbols: 1,
            tryDownscale: true,
            tryHarder: !isTrackingActive,
            tryInvert: !isTrackingActive,
            tryRotate: !isTrackingActive
        });

        const detectedBarcode = results.find((result) => result?.position);

        if (detectedBarcode) {
            const detectedCorners = getDetectedCorners(detectedBarcode.position);
            const corners = scaleCornersToVideoSpace(detectedCorners);
            const metrics = getQrMetrics(corners);
            const confirmedDetection = updateDetectionConfidence(metrics);
            shouldHoldSteady = Boolean(metrics);

            if (confirmedDetection && corners && updateTrackedPoseFromCorners(corners)) {
                applyTrackedPose(!hasTrackingPose);
                hasTrackingPose = true;
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
        console.error("Human skin QR scan failed.", error);
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
    isDragging = false;
    isArInitialized = false;
    focusedPartIndex = -1;
    lostMarkerFrames = 0;
    hasTrackingPose = false;
    hasLiveMarkerDetection = false;
    isModelMounted = false;
    resetDetectionConfidence();
    lastQrScanTime = 0;
    focalLength = 0;
    qrScannerReady = false;
    qrScanInFlight = false;
    scanContext = undefined;
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
    renderer = undefined;
    labelRenderer = undefined;
    scene = undefined;
    camera = undefined;
    arGroup = undefined;
    heartModel = undefined;
    heartSound = undefined;
}

window.addEventListener("resize", fitToScreen);
window.addEventListener("pagehide", cleanup);
window.addEventListener("beforeunload", cleanup);

loadConfig();

