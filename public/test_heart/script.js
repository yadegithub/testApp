const query = new URLSearchParams(window.location.search);
const currentTheme = query.get("theme") === "light" ? "light" : "dark";
const currentLanguage = query.get("lang") === "ar" ? "ar" : "en";
const HEART_MODEL_PATH = "assets/human_heart.glb";
const DEFAULT_HEART_ROTATION = {
    x: 0,
    y: Math.PI,
    z: 0
};
const MARKER_LOST_GRACE_FRAMES = 6;
const TRACKING_LERP_ALPHA = 0.4;
const CONFIRM_FRAMES = 2;
const MIN_QR_AREA_RATIO = 0.016;
const MIN_QR_EDGE = 70;
const MAX_QR_EDGE_RATIO = 2.3;
const MAX_CENTER_JUMP_RATIO = 0.08;
const QR_SCAN_INTERVAL_MS = 42;
const QR_SEARCH_INTERVAL_MS = 64;
const MAX_RENDER_PIXEL_RATIO = 1.25;
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

const anatomyParts = [
    {
        id: "aorta",
        label: "Aorta",
        title: "AORTA",
        info: "The aorta carries oxygen-rich blood from the left ventricle to the rest of the body.",
        hint: "This is the main artery leaving the heart.",
        position: [0.1, 0.72, 0.15]
    },
    {
        id: "pulmonary-artery",
        label: "Pulmonary Artery",
        title: "PULMONARY ARTERY",
        info: "The pulmonary artery moves oxygen-poor blood from the heart to the lungs.",
        hint: "It begins pulmonary circulation.",
        position: [0.25, 0.45, 0.2]
    },
    {
        id: "left-atrium",
        label: "Left Atrium",
        title: "LEFT ATRIUM",
        info: "The left atrium receives oxygen-rich blood returning from the lungs.",
        hint: "It passes fresh blood into the left ventricle.",
        position: [0.35, 0.05, 0.3]
    },
    {
        id: "left-ventricle",
        label: "Left Ventricle",
        title: "LEFT VENTRICLE",
        info: "The left ventricle pumps oxygen-rich blood out through the aorta.",
        hint: "This chamber has the thickest wall.",
        position: [0.25, -0.4, 0.4]
    },
    {
        id: "right-atrium",
        label: "Right Atrium",
        title: "RIGHT ATRIUM",
        info: "The right atrium receives oxygen-poor blood coming back from the body.",
        hint: "It sends blood down into the right ventricle.",
        position: [-0.4, 0.05, 0.25]
    },
    {
        id: "right-ventricle",
        label: "Right Ventricle",
        title: "RIGHT VENTRICLE",
        info: "The right ventricle pumps oxygen-poor blood toward the lungs.",
        hint: "It starts the trip to the lungs for oxygen.",
        position: [-0.35, -0.45, 0.35]
    }
].map((part, index) => ({
    ...part,
    number: index + 1
}));

const copy = {
    appEyebrow: "AR Learn live scan",
    appTitle: "HUMAN HEART",
    rotate: "Rotate",
    scale: "Scale",
    sound: "Audio",
    labels: "Numbers On/Off",
    statusStarting: "Starting camera...",
    statusLoading: "Loading heart model...",
    statusReady: "Camera ready",
    statusTracking: "Heart placed",
    statusHoldSteady: "Hold steady while locking QR...",
    statusSearching: "Searching for QR code...",
    statusCameraError: "Camera access was denied.",
    statusModelError: "The heart model could not be loaded.",
    focusTag: "Selected part",
    overview: {
        tag: "Open-heart view",
        title: "OPEN HEART",
        info: "Tap a numbered marker to read the definition of each structure inside the heart.",
        hint: "Rotate the model until the cutaway side faces you, or use Scale to zoom closer."
    }
};

let src;
let cap;
let qrDetector;
let qrPoints;
let imagePoints;
let camMatrix;
let distCoeffs;
let rvec;
let tvec;
let rotMatr;
let objectPoints;
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
let animationFrameId = 0;
let openCvCheckTimerId = 0;
let isArInitialized = false;
let isSessionStarting = false;
let focusedPartIndex = -1;
let lostMarkerFrames = 0;
let hasTrackingPose = false;
let hasLiveMarkerDetection = false;
let detectionStreak = 0;
let lastDetectionCenter = null;
let lastQrScanTime = 0;

const trackedMatrix = new THREE.Matrix4();
const trackedPosition = new THREE.Vector3();
const trackedQuaternion = new THREE.Quaternion();
const trackedScale = new THREE.Vector3();

const defaultConfig = {
    assets: {
        models: {
            heart: {
                path: HEART_MODEL_PATH,
                position: { x: 0.5, y: 0.55, z: 0.0 },
                scale: { x: 1.15, y: 1.15, z: 1.15 },
                rotation: DEFAULT_HEART_ROTATION
            }
        },
        audio: "assets/heartbeat.mp3"
    },
    settings: {
        arScale: 3.0
    }
};

function setStatus(message) {
    if (!UI.status || UI.status.textContent === message) {
        return;
    }

    UI.status.textContent = message;
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
        labelsVisible && Boolean(arGroup?.visible) && hasLiveMarkerDetection;

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
    UI.soundLabel.textContent = copy.sound;
    UI.labelsLabel.textContent = copy.labels;
    updateInfoCard();
    positionInfoCard();
    setStatus(copy.statusStarting);
}

async function loadConfig() {
    if (isSessionStarting || activeStream) {
        return;
    }

    isSessionStarting = true;
    applyCopy();
    let config = defaultConfig;

    try {
        const response = await fetch("./data.json");
        if (response.ok) {
            config = await response.json();
        }
    } catch (error) {
        config = defaultConfig;
    }

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
        checkOpenCV(config ?? defaultConfig);
    } catch (error) {
        setStatus(copy.statusCameraError);
    }
}

function checkOpenCV(config) {
    if (!activeStream || isArInitialized) {
        return;
    }

    if (typeof cv !== "undefined" && cv.Mat) {
        isArInitialized = true;
        initThree(config);
        initCV(config);
        setupControls();
        animationFrameId = window.requestAnimationFrame(processFrame);
        return;
    }

    openCvCheckTimerId = window.setTimeout(() => checkOpenCV(config), 120);
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
        antialias: true
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
    labelRenderer.domElement.style.zIndex = "25";
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

    const loader = new THREE.GLTFLoader();
    const modelConfig = config.assets?.models?.heart ?? defaultConfig.assets.models.heart;
    const modelPath = modelConfig.path ?? HEART_MODEL_PATH;
    const modelPosition = modelConfig.position ?? defaultConfig.assets.models.heart.position;
    const modelScale = modelConfig.scale ?? defaultConfig.assets.models.heart.scale;
    const modelRotation =
        modelConfig.rotation ?? defaultConfig.assets.models.heart.rotation;

    arScale = config.settings?.arScale ?? defaultConfig.settings.arScale;
    heartSound = new Audio(config.assets?.audio ?? defaultConfig.assets.audio);
    heartSound.loop = true;

    setStatus(copy.statusLoading);

    loader.load(
        modelPath,
        (gltf) => {
            heartModel = gltf.scene;
            heartModel.position.set(
                modelPosition.x ?? 0.5,
                modelPosition.y ?? 0.55,
                modelPosition.z ?? 0
            );
            heartModel.scale.set(
                modelScale.x ?? 1.15,
                modelScale.y ?? 1.15,
                modelScale.z ?? 1.15
            );
            heartModel.rotation.set(
                modelRotation.x ?? DEFAULT_HEART_ROTATION.x,
                modelRotation.y ?? DEFAULT_HEART_ROTATION.y,
                modelRotation.z ?? DEFAULT_HEART_ROTATION.z
            );
            arGroup.add(heartModel);

            anatomyParts.forEach((part, index) => {
                addAnatomyLabel(part, index);
            });

            setupInteraction();
            updateInfoCard();
            syncLabels();
            positionInfoCard();
            setStatus(copy.statusReady);
        },
        undefined,
        () => {
            setStatus(copy.statusModelError);
        }
    );
}

function addAnatomyLabel(part, index) {
    if (!heartModel) {
        return;
    }

    const labelAnchor = new THREE.Group();
    labelAnchor.position.set(part.position[0], part.position[1], part.position[2]);
    heartModel.add(labelAnchor);

    const button = document.createElement("button");
    button.className = "hotspot-label";
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
    UI.soundBtn.onclick = toggleSound;
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

function initCV() {
    src = new cv.Mat(UI.video.height, UI.video.width, cv.CV_8UC4);
    cap = new cv.VideoCapture(UI.video);
    qrDetector = new cv.QRCodeDetector();
    qrPoints = new cv.Mat();
    imagePoints = new cv.Mat(4, 1, cv.CV_32FC2);

    const focalLength = Math.max(UI.video.width, UI.video.height);
    camMatrix = cv.matFromArray(3, 3, cv.CV_64FC1, [
        focalLength,
        0,
        UI.video.width / 2,
        0,
        focalLength,
        UI.video.height / 2,
        0,
        0,
        1
    ]);
    distCoeffs = new cv.Mat.zeros(5, 1, cv.CV_64FC1);
    objectPoints = cv.matFromArray(4, 3, cv.CV_64FC1, [
        0, 0, 0,
        1, 0, 0,
        1, 1, 0,
        0, 1, 0
    ]);
    rvec = new cv.Mat();
    tvec = new cv.Mat();
    rotMatr = new cv.Mat(3, 3, cv.CV_64FC1);

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

function getQrScanInterval() {
    return hasTrackingPose || detectionStreak > 0
        ? QR_SCAN_INTERVAL_MS
        : QR_SEARCH_INTERVAL_MS;
}

function updateImagePoints(points) {
    const source = points.data32F;
    const target = imagePoints.data32F;

    for (let index = 0; index < 8; index += 1) {
        target[index] = source[index];
    }
}

function getDetectedCorners(points) {
    if (!points?.data32F || points.data32F.length < 8) {
        return null;
    }

    return [
        { x: points.data32F[0], y: points.data32F[1] },
        { x: points.data32F[2], y: points.data32F[3] },
        { x: points.data32F[4], y: points.data32F[5] },
        { x: points.data32F[6], y: points.data32F[7] }
    ];
}

function getQrMetrics(points) {
    const corners = getDetectedCorners(points);

    if (!corners) {
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
    return detectionStreak >= CONFIRM_FRAMES;
}

function resetDetectionConfidence() {
    detectionStreak = 0;
    lastDetectionCenter = null;
}

function runQrDetection() {
    let markerFound = false;
    let shouldHoldSteady = false;
    let liveMarkerDetected = false;

    if (qrDetector.detect(src, qrPoints)) {
        const metrics = getQrMetrics(qrPoints);
        const confirmedDetection = updateDetectionConfidence(metrics);
        shouldHoldSteady = Boolean(metrics);

        if (confirmedDetection) {
            updateImagePoints(qrPoints);

            if (
                cv.solvePnP(objectPoints, imagePoints, camMatrix, distCoeffs, rvec, tvec)
            ) {
                cv.Rodrigues(rvec, rotMatr);
                const rotation = rotMatr.data64F;
                const translation = tvec.data64F;

                trackedMatrix.set(
                    rotation[0] * arScale,
                    rotation[1] * arScale,
                    rotation[2] * arScale,
                    translation[0],
                    -rotation[3] * arScale,
                    -rotation[4] * arScale,
                    -rotation[5] * arScale,
                    -translation[1],
                    -rotation[6] * arScale,
                    -rotation[7] * arScale,
                    -rotation[8] * arScale,
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

                if (!hasTrackingPose) {
                    arGroup.position.copy(trackedPosition);
                    arGroup.quaternion.copy(trackedQuaternion);
                    arGroup.scale.copy(trackedScale);
                    hasTrackingPose = true;
                } else {
                    arGroup.position.lerp(trackedPosition, TRACKING_LERP_ALPHA);
                    arGroup.quaternion.slerp(
                        trackedQuaternion,
                        TRACKING_LERP_ALPHA
                    );
                    arGroup.scale.lerp(trackedScale, TRACKING_LERP_ALPHA);
                }

                arGroup.visible = true;
                markerFound = true;
                liveMarkerDetected = true;
                lostMarkerFrames = 0;
            }
        }
    } else {
        resetDetectionConfidence();
    }

    if (!markerFound) {
        if (hasTrackingPose && lostMarkerFrames < MARKER_LOST_GRACE_FRAMES) {
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

    return { markerFound, shouldHoldSteady };
}

function processFrame(timestamp) {
    if (!activeStream || !cap || !src || !renderer || !labelRenderer) {
        return;
    }

    cap.read(src);

    if (SHOW_DEBUG_CAMERA_CANVAS) {
        cv.imshow("canvasOutput", src);
    }

    let markerFound = arGroup.visible;
    let shouldHoldSteady = detectionStreak > 0 && !hasTrackingPose;

    if (!lastQrScanTime || timestamp - lastQrScanTime >= getQrScanInterval()) {
        lastQrScanTime = timestamp;
        ({ markerFound, shouldHoldSteady } = runQrDetection());
    }

    if (markerFound) {
        setStatus(copy.statusTracking);
    } else if (shouldHoldSteady && detectionStreak > 0) {
        setStatus(copy.statusHoldSteady);
    } else {
        setStatus(copy.statusSearching);
    }

    if (!hasLiveMarkerDetection && focusedPartIndex !== -1) {
        setFocusedPart(-1);
    } else {
        syncLabels();
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
    if (openCvCheckTimerId) {
        window.clearTimeout(openCvCheckTimerId);
        openCvCheckTimerId = 0;
    }

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
    resetDetectionConfidence();
    lastQrScanTime = 0;

    if (renderer) {
        renderer.dispose();
    }

    if (labelRenderer?.domElement?.parentNode) {
        labelRenderer.domElement.parentNode.removeChild(labelRenderer.domElement);
    }

    [src, qrPoints, imagePoints, camMatrix, distCoeffs, objectPoints, rvec, tvec, rotMatr].forEach((mat) => {
        if (mat && typeof mat.delete === "function") {
            mat.delete();
        }
    });

    if (qrDetector && typeof qrDetector.delete === "function") {
        qrDetector.delete();
    }

    anatomyLabels = [];
    src = undefined;
    cap = undefined;
    qrDetector = undefined;
    qrPoints = undefined;
    imagePoints = undefined;
    camMatrix = undefined;
    distCoeffs = undefined;
    rvec = undefined;
    tvec = undefined;
    rotMatr = undefined;
    objectPoints = undefined;
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
