const query = new URLSearchParams(window.location.search);
const currentTheme = query.get("theme") === "light" ? "light" : "dark";
const currentLanguage = query.get("lang") === "ar" ? "ar" : "en";

document.documentElement.dataset.theme = currentTheme;
document.documentElement.lang = currentLanguage;
document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";

const UI = {
    video: document.getElementById("videoInput"),
    status: document.getElementById("status"),
    canvasOutput: document.getElementById("canvasOutput"),
    canvasThree: document.getElementById("canvasThree"),
    appEyebrow: document.getElementById("app-eyebrow"),
    appTitle: document.getElementById("app-title"),
    cardHint: document.getElementById("card-hint"),
    cardTag: document.getElementById("card-tag"),
    partInfo: document.getElementById("part-info"),
    partName: document.getElementById("part-name")
};

let renderer;
let scene;
let camera;
let arGroup;
let mainModel;
let activeStream;
let scanContext;
let qrScannerReady = false;
let qrScanInFlight = false;
let focalLength = 0;
let animationFrameId = 0;
let lastQrScanTime = 0;
let lastScanResult = {
    markerFound: false,
    shouldHoldSteady: false
};

let AR_SCALE = 0.1;
const BUILD_VERSION = "20260514-1";
const DEFAULT_MODEL_PATH = "./assets/newtons_cradle (1).glb";
const DEFAULT_MODEL_SCALE = { x: 0.45, y: 0.45, z: 0.45 };
const DEFAULT_MODEL_POSITION = { x: 0, y: 0, z: 0 };
const DEFAULT_MODEL_ROTATION = { x: -Math.PI / 2, y: 0, z: 0 };
const MAX_RENDER_PIXEL_RATIO = 1.25;
const CAMERA_IDEAL_WIDTH = 960;
const CAMERA_IDEAL_HEIGHT = 540;
const CAMERA_IDEAL_FRAME_RATE = 24;
const CAMERA_MAX_FRAME_RATE = 30;
const SHOW_DEBUG_CAMERA_CANVAS = false;

const TRACKING_DEFAULTS = {
    markerLostGraceFrames: 6,
    trackingLerpAlpha: 0.12,
    trackingScaleLerpAlpha: 0.08,
    confirmFrames: 3,
    minQrAreaRatio: 0.008,
    minQrEdge: 48,
    maxQrEdgeRatio: 2.3,
    maxCenterJumpRatio: 0.12,
    qrScanIntervalMs: 96,
    qrSearchIntervalMs: 120,
    positionDeadzone: 0.025,
    scaleDeadzone: 0.035,
    rotationDeadzoneRad: 0.055,
    fastFollowDistance: 0.2,
    fastFollowAlpha: 0.45
};

let markerLostGraceFrames = TRACKING_DEFAULTS.markerLostGraceFrames;
let trackingLerpAlpha = TRACKING_DEFAULTS.trackingLerpAlpha;
let trackingScaleLerpAlpha = TRACKING_DEFAULTS.trackingScaleLerpAlpha;
let confirmFrames = TRACKING_DEFAULTS.confirmFrames;
let minQrAreaRatio = TRACKING_DEFAULTS.minQrAreaRatio;
let minQrEdge = TRACKING_DEFAULTS.minQrEdge;
let maxQrEdgeRatio = TRACKING_DEFAULTS.maxQrEdgeRatio;
let maxCenterJumpRatio = TRACKING_DEFAULTS.maxCenterJumpRatio;
let qrScanIntervalMs = TRACKING_DEFAULTS.qrScanIntervalMs;
let qrSearchIntervalMs = TRACKING_DEFAULTS.qrSearchIntervalMs;
let positionDeadzone = TRACKING_DEFAULTS.positionDeadzone;
let scaleDeadzone = TRACKING_DEFAULTS.scaleDeadzone;
let rotationDeadzoneRad = TRACKING_DEFAULTS.rotationDeadzoneRad;
let fastFollowDistance = TRACKING_DEFAULTS.fastFollowDistance;
let fastFollowAlpha = TRACKING_DEFAULTS.fastFollowAlpha;

let currentMode = "rotate";
let isDragging = false;
let prevPos = { x: 0, y: 0 };
let pointerStart = null;
let pointerMoved = false;
let pressedBall = null;
let selectedPendulumBall = null;
let launchButton = null;
let pendulumBalls = [];
let pendulumPhases = [];
let pendulumPhaseIndex = 0;
let pendulumPhaseStartedAt = 0;
let lostMarkerFrames = 0;
let hasTrackingPose = false;
let hasLiveMarkerDetection = false;
let detectionStreak = 0;
let lastDetectionCenter = null;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const trackedMatrix = new THREE.Matrix4();
const trackedPosition = new THREE.Vector3();
const trackedQuaternion = new THREE.Quaternion();
const trackedScale = new THREE.Vector3();
const CLICK_MOVE_THRESHOLD = 8;
const DEFAULT_SWING_ANGLE = 0.95;
const SWING_DAMPING = 0.72;
const MIN_SWING_ANGLE = 0.18;

const COPY = currentLanguage === "ar"
    ? {
        appEyebrow: "مسح مباشر",
        appTitle: "البندول البسيط",
        cardHint: "المس كرة جانبية أو استعمل زر التشغيل لبدء الحركة.",
        cardInfo: "يوضح هذا النموذج حفظ كمية الحركة والطاقة. عندما تصطدم كرة، تنتقل الدفعة عبر الكرات الساكنة وتخرج من الجهة الأخرى.",
        cardName: "بندول نيوتن",
        cardTag: "نموذج فيزيائي",
        cameraRequest: "جار طلب الوصول إلى الكاميرا...",
        clickOuterBall: "المس كرة جانبية",
        collision: "الحركة جارية...",
        loading: "جار تحميل البندول...",
        modelError: "تعذر تحميل النموذج",
        noBall: "لا توجد كرة متاحة",
        ready: "جاهز: امسح رمز QR",
        stable: "تم تثبيت النموذج",
        steady: "تم اكتشاف QR، أبقه ثابتاً...",
        searching: "جار البحث عن رمز QR...",
        rotate: "تدوير",
        scale: "تحجيم",
        launch: "تشغيل"
    }
    : {
        appEyebrow: "EduAR live scan",
        appTitle: "SIMPLE PENDULUM",
        cardHint: "Touch a side ball or use Launch to start the motion.",
        cardInfo: "This model illustrates conservation of momentum and energy. When one ball collides, the impulse travels through the still balls and exits on the other side.",
        cardName: "Newton's Cradle",
        cardTag: "PHYSICS MODEL",
        cameraRequest: "Requesting camera access...",
        clickOuterBall: "Click a side ball",
        collision: "Collision in progress...",
        loading: "Loading pendulum...",
        modelError: "Model loading error",
        noBall: "No ball available",
        ready: "Ready: scan the QR code",
        stable: "Model stabilized",
        steady: "QR detected, keep it steady...",
        searching: "Searching for QR code...",
        rotate: "Rotate",
        scale: "Scale",
        launch: "Launch"
    };

window.addEventListener("resize", fitToScreen);

function setStatus(message) {
    if (!UI.status || UI.status.innerText === message) {
        return;
    }

    UI.status.innerText = message;
}

function withCacheBuster(url) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${BUILD_VERSION}`;
}

function normalizeModelPath(modelPath) {
    if (!modelPath) {
        return withCacheBuster(DEFAULT_MODEL_PATH);
    }

    if (modelPath.startsWith("./") || modelPath.startsWith("../") || modelPath.includes("/")) {
        return withCacheBuster(modelPath);
    }

    return withCacheBuster(`./assets/${modelPath}`);
}

function getVideoSize() {
    return {
        width: UI.video.videoWidth || UI.video.width || 1280,
        height: UI.video.videoHeight || UI.video.height || 720
    };
}

function getPointerCoords(event) {
    if (event.touches && event.touches[0]) {
        return {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    }

    if (event.changedTouches && event.changedTouches[0]) {
        return {
            x: event.changedTouches[0].clientX,
            y: event.changedTouches[0].clientY
        };
    }

    return {
        x: event.clientX,
        y: event.clientY
    };
}

function lerp(start, end, amount) {
    return start + ((end - start) * amount);
}

function easeInOutSine(amount) {
    return -(Math.cos(Math.PI * amount) - 1) / 2;
}

function setLaunchButtonActive(isActive) {
    if (!launchButton) {
        return;
    }

    launchButton.classList.toggle("active", isActive);
}

function applyLocalizedCopy() {
    UI.appEyebrow.textContent = COPY.appEyebrow;
    UI.appTitle.textContent = COPY.appTitle;
    UI.cardHint.textContent = COPY.cardHint;
    UI.cardTag.textContent = COPY.cardTag;
    UI.partInfo.textContent = COPY.cardInfo;
    UI.partName.textContent = COPY.cardName;
    document.title = `EduAR - ${COPY.appTitle}`;
}

function applyTrackingSettings(config) {
    const runtimeTracking = config?.settings?.tracking ?? {};
    markerLostGraceFrames = Math.max(
        0,
        Number(runtimeTracking.markerLostGraceFrames ?? TRACKING_DEFAULTS.markerLostGraceFrames)
    );
    trackingLerpAlpha = Math.min(
        0.95,
        Math.max(
            0.01,
            Number(runtimeTracking.trackingLerpAlpha ?? TRACKING_DEFAULTS.trackingLerpAlpha)
        )
    );
    trackingScaleLerpAlpha = Math.min(
        0.95,
        Math.max(
            0.01,
            Number(runtimeTracking.trackingScaleLerpAlpha ?? TRACKING_DEFAULTS.trackingScaleLerpAlpha)
        )
    );
    confirmFrames = Math.max(
        1,
        Number(runtimeTracking.confirmFrames ?? TRACKING_DEFAULTS.confirmFrames)
    );
    minQrAreaRatio = Math.max(
        0.0001,
        Number(runtimeTracking.minQrAreaRatio ?? TRACKING_DEFAULTS.minQrAreaRatio)
    );
    minQrEdge = Math.max(
        4,
        Number(runtimeTracking.minQrEdge ?? TRACKING_DEFAULTS.minQrEdge)
    );
    maxQrEdgeRatio = Math.max(
        1.1,
        Number(runtimeTracking.maxQrEdgeRatio ?? TRACKING_DEFAULTS.maxQrEdgeRatio)
    );
    maxCenterJumpRatio = Math.max(
        0.01,
        Number(runtimeTracking.maxCenterJumpRatio ?? TRACKING_DEFAULTS.maxCenterJumpRatio)
    );
    qrScanIntervalMs = Math.max(
        16,
        Number(runtimeTracking.qrScanIntervalMs ?? TRACKING_DEFAULTS.qrScanIntervalMs)
    );
    qrSearchIntervalMs = Math.max(
        qrScanIntervalMs,
        Number(runtimeTracking.qrSearchIntervalMs ?? TRACKING_DEFAULTS.qrSearchIntervalMs)
    );
    positionDeadzone = Math.max(
        0,
        Number(runtimeTracking.positionDeadzone ?? TRACKING_DEFAULTS.positionDeadzone)
    );
    scaleDeadzone = Math.max(
        0,
        Number(runtimeTracking.scaleDeadzone ?? TRACKING_DEFAULTS.scaleDeadzone)
    );
    rotationDeadzoneRad = Math.max(
        0,
        Number(runtimeTracking.rotationDeadzoneRad ?? TRACKING_DEFAULTS.rotationDeadzoneRad)
    );
    fastFollowDistance = Math.max(
        0,
        Number(runtimeTracking.fastFollowDistance ?? TRACKING_DEFAULTS.fastFollowDistance)
    );
    fastFollowAlpha = Math.min(
        0.95,
        Math.max(
            trackingLerpAlpha,
            Number(runtimeTracking.fastFollowAlpha ?? TRACKING_DEFAULTS.fastFollowAlpha)
        )
    );
}

async function initProject() {
    applyLocalizedCopy();
    setStatus(COPY.loading);

    try {
        const response = await fetch(withCacheBuster("./data.json"));
        if (!response.ok) {
            throw new Error(`Unable to load data.json (${response.status})`);
        }

        const config = await response.json();
        AR_SCALE = Number(config?.settings?.arScale ?? AR_SCALE);
        applyTrackingSettings(config);
        const modelConfig = config?.assets?.models?.pendulum ?? {};
        const path = normalizeModelPath(modelConfig.path);
        startAR(path, modelConfig);
    } catch (error) {
        console.error("Config error:", error);
        startAR(withCacheBuster(DEFAULT_MODEL_PATH), {});
    }
}

async function startAR(modelPath, modelConfig = {}) {
    document.body.classList.remove("camera-ready");
    UI.video.muted = true;
    UI.video.autoplay = true;
    UI.video.playsInline = true;
    setStatus(COPY.cameraRequest);

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
        UI.video.srcObject = stream;

        await new Promise((resolve) => {
            const handleLoadedMetadata = () => {
                UI.video.removeEventListener("loadedmetadata", handleLoadedMetadata);
                resolve();
            };

            UI.video.addEventListener("loadedmetadata", handleLoadedMetadata);
        });

        await UI.video.play();
        document.body.classList.add("camera-ready");

        const { width, height } = getVideoSize();
        UI.video.width = width;
        UI.video.height = height;
        UI.canvasOutput.width = UI.canvasThree.width = width;
        UI.canvasOutput.height = UI.canvasThree.height = height;

        fitToScreen();
        await initQrScanner();
        setupThreeJS(modelPath, modelConfig);
        initTrackingProjection();
        setupControls();
        animationFrameId = window.requestAnimationFrame(processFrame);
    } catch (error) {
        console.error("Camera error:", error);
        setStatus(`Camera error: ${error.name || "Access denied"}`);
    }
}

function setupThreeJS(modelPath, modelConfig = {}) {
    const { width, height } = getVideoSize();

    if (UI.canvasOutput) {
        UI.canvasOutput.style.display = SHOW_DEBUG_CAMERA_CANVAS ? "block" : "none";
    }

    renderer = new THREE.WebGLRenderer({
        canvas: UI.canvasThree,
        alpha: true,
        antialias: window.matchMedia?.("(pointer: fine)")?.matches ?? false,
        powerPreference: "low-power"
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_RENDER_PIXEL_RATIO));

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    arGroup = new THREE.Group();
    arGroup.visible = false;
    arGroup.matrixAutoUpdate = true;
    scene.add(arGroup);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 5, 2);
    scene.add(light);

    const loader = new THREE.GLTFLoader();
    loader.load(modelPath, (gltf) => {
        mainModel = gltf.scene;
        const modelPosition = modelConfig.position ?? DEFAULT_MODEL_POSITION;
        const modelScale = modelConfig.scale ?? DEFAULT_MODEL_SCALE;
        const modelRotation = modelConfig.rotation ?? DEFAULT_MODEL_ROTATION;
        const autoCenter = modelConfig.autoCenter ?? true;
        const localBounds = new THREE.Box3().setFromObject(mainModel);
        const modelCenter = localBounds.getCenter(new THREE.Vector3());

        const modelAnchor = new THREE.Group();
        modelAnchor.position.set(
            modelPosition.x ?? DEFAULT_MODEL_POSITION.x,
            modelPosition.y ?? DEFAULT_MODEL_POSITION.y,
            modelPosition.z ?? DEFAULT_MODEL_POSITION.z
        );
        arGroup.add(modelAnchor);

        const modelRig = new THREE.Group();
        modelRig.scale.set(
            modelScale.x ?? DEFAULT_MODEL_SCALE.x,
            modelScale.y ?? DEFAULT_MODEL_SCALE.y,
            modelScale.z ?? DEFAULT_MODEL_SCALE.z
        );
        modelRig.rotation.set(
            modelRotation.x ?? DEFAULT_MODEL_ROTATION.x,
            modelRotation.y ?? DEFAULT_MODEL_ROTATION.y,
            modelRotation.z ?? DEFAULT_MODEL_ROTATION.z
        );
        modelAnchor.add(modelRig);

        mainModel.position.set(
            autoCenter ? -modelCenter.x : 0,
            autoCenter ? -modelCenter.y : 0,
            autoCenter ? -modelCenter.z : 0
        );
        modelRig.add(mainModel);
        setupPendulumBalls();
        setupInteraction();
        setStatus(COPY.ready);
    }, undefined, (error) => {
        console.error("Model error:", error);
        setStatus(COPY.modelError);
    });
}

function setupPendulumBalls() {
    pendulumBalls = [];

    mainModel.traverse((node) => {
        if (!node.name || !node.name.toLowerCase().startsWith("kulka")) {
            return;
        }

        const ballMesh = node.children.find((child) => child.isMesh);
        if (!ballMesh) {
            return;
        }

        pendulumBalls.push({
            pivot: node,
            mesh: ballMesh,
            currentAngle: node.rotation.x,
            baseRotationY: node.rotation.y,
            baseRotationZ: node.rotation.z
        });
    });

    pendulumBalls.sort((left, right) => right.pivot.position.z - left.pivot.position.z);

    const swingAngle = Math.max(
        pendulumBalls.reduce((maxAngle, ball) => Math.max(maxAngle, Math.abs(ball.currentAngle)), 0),
        DEFAULT_SWING_ANGLE
    );

    pendulumBalls.forEach((ball, index) => {
        ball.index = index;
        ball.isOuter = index === 0 || index === pendulumBalls.length - 1;

        if (!ball.isOuter) {
            ball.outwardAngle = 0;
        } else if (Math.abs(ball.currentAngle) > 0.05) {
            ball.outwardAngle = Math.sign(ball.currentAngle) * swingAngle;
        } else {
            ball.outwardAngle = index === 0 ? -swingAngle : swingAngle;
        }

        ball.mesh.userData.pendulumBall = ball;
    });

    selectedPendulumBall = pendulumBalls.find((ball) => ball.isOuter) || null;
}

function setPendulumBallAngle(ball, angle) {
    ball.currentAngle = angle;
    ball.pivot.rotation.x = angle;
    ball.pivot.rotation.y = ball.baseRotationY;
    ball.pivot.rotation.z = ball.baseRotationZ;
}

function getClickedPendulumBall(clientX, clientY) {
    if (!camera || !mainModel || !arGroup.visible || pendulumBalls.length === 0) {
        return null;
    }

    const rect = UI.canvasThree.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);

    const intersections = raycaster.intersectObjects(
        pendulumBalls.map((ball) => ball.mesh),
        false
    );

    return intersections[0]?.object?.userData?.pendulumBall || null;
}

function queuePendulumPhase(ball, from, to, duration) {
    pendulumPhases.push({ ball, from, to, duration });
}

function getLaunchBall() {
    if (selectedPendulumBall?.isOuter) {
        return selectedPendulumBall;
    }

    return pendulumBalls.find((ball) => ball.isOuter) || null;
}

function startPendulumAnimation(ball) {
    if (!ball) {
        setLaunchButtonActive(false);
        setStatus(COPY.noBall);
        return;
    }

    if (!ball.isOuter) {
        setLaunchButtonActive(false);
        setStatus(COPY.clickOuterBall);
        return;
    }

    selectedPendulumBall = ball;
    setLaunchButtonActive(true);

    const oppositeBall = ball.index === 0
        ? pendulumBalls[pendulumBalls.length - 1]
        : pendulumBalls[0];

    pendulumPhases = [];
    pendulumPhaseIndex = 0;

    pendulumBalls.forEach((item) => {
        if (item !== ball && item !== oppositeBall && item.isOuter) {
            setPendulumBallAngle(item, 0);
        }
    });

    if (ball !== oppositeBall) {
        setPendulumBallAngle(oppositeBall, 0);
    }

    const releaseAngle = Math.abs(ball.currentAngle) > 0.05
        ? ball.currentAngle
        : ball.outwardAngle;

    if (Math.abs(ball.currentAngle - ball.outwardAngle) > 0.05) {
        queuePendulumPhase(ball, ball.currentAngle, ball.outwardAngle, 220);
    }

    queuePendulumPhase(ball, releaseAngle, 0, 260);

    let activeBall = oppositeBall;
    let energy = 1;

    while ((Math.abs(ball.outwardAngle) * energy) >= MIN_SWING_ANGLE) {
        const targetAngle = Math.sign(activeBall.outwardAngle) * Math.abs(ball.outwardAngle) * energy;
        queuePendulumPhase(activeBall, 0, targetAngle, 240);
        queuePendulumPhase(activeBall, targetAngle, 0, 280);

        activeBall = activeBall === oppositeBall ? ball : oppositeBall;
        energy *= SWING_DAMPING;
    }

    pendulumPhaseStartedAt = performance.now();
    setStatus(COPY.collision);
}

function updatePendulumAnimation(now) {
    if (pendulumPhases.length === 0 || pendulumPhaseIndex >= pendulumPhases.length) {
        return;
    }

    const phase = pendulumPhases[pendulumPhaseIndex];
    const progress = Math.min(1, (now - pendulumPhaseStartedAt) / phase.duration);
    const angle = lerp(phase.from, phase.to, easeInOutSine(progress));
    setPendulumBallAngle(phase.ball, angle);

    if (progress < 1) {
        return;
    }

    setPendulumBallAngle(phase.ball, phase.to);
    pendulumPhaseIndex += 1;
    pendulumPhaseStartedAt = now;

    if (pendulumPhaseIndex >= pendulumPhases.length) {
        pendulumPhases = [];
        pendulumPhaseIndex = 0;
        setLaunchButtonActive(false);
        setStatus(COPY.ready);
    }
}

function setupControls() {
    const btnRotate = document.getElementById("btn-rotate");
    const btnScale = document.getElementById("btn-scale");
    const btnLaunch = document.getElementById("btn-launch");
    launchButton = btnLaunch;
    document.querySelector("#btn-rotate .label").innerText = COPY.rotate;
    document.querySelector("#btn-scale .label").innerText = COPY.scale;
    document.querySelector("#btn-launch .label").innerText = COPY.launch;

    btnRotate.onclick = () => {
        currentMode = "rotate";
        btnRotate.classList.add("active");
        btnScale.classList.remove("active");
    };

    btnScale.onclick = () => {
        currentMode = "scale";
        btnScale.classList.add("active");
        btnRotate.classList.remove("active");
    };

    if (btnLaunch) {
        btnLaunch.onclick = () => {
            const ball = getLaunchBall();
            startPendulumAnimation(ball);
        };
    }
}

function setupInteraction() {
    const start = (event) => {
        isDragging = true;
        pointerMoved = false;

        const { x, y } = getPointerCoords(event);
        prevPos = { x, y };
        pointerStart = { x, y };
        pressedBall = getClickedPendulumBall(x, y);
    };

    const move = (event) => {
        if (!isDragging || !mainModel) {
            return;
        }

        const { x, y } = getPointerCoords(event);
        const dx = x - prevPos.x;
        const dy = y - prevPos.y;

        if (pointerStart) {
            const traveled = Math.hypot(x - pointerStart.x, y - pointerStart.y);
            if (traveled > CLICK_MOVE_THRESHOLD) {
                pointerMoved = true;
            }
        }

        if (currentMode === "rotate") {
            mainModel.rotation.y += dx * 0.01;
            mainModel.rotation.x += dy * 0.01;
        } else {
            const scaleFactor = Math.max(0.2, 1 - (dy * 0.005));
            mainModel.scale.multiplyScalar(scaleFactor);
        }

        prevPos = { x, y };
    };

    const end = () => {
        if (!isDragging) {
            return;
        }

        if (pressedBall?.isOuter) {
            selectedPendulumBall = pressedBall;
        }

        if (!pointerMoved && pressedBall) {
            startPendulumAnimation(pressedBall);
        }

        isDragging = false;
        pointerStart = null;
        pressedBall = null;
    };

    UI.canvasThree.addEventListener("mousedown", start);
    UI.canvasThree.addEventListener("touchstart", start);
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move);
    window.addEventListener("mouseup", end);
    window.addEventListener("touchend", end);
}

function getQrScanInterval() {
    return hasTrackingPose || detectionStreak > 0
        ? qrScanIntervalMs
        : qrSearchIntervalMs;
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

    if (metrics.area < frameArea * minQrAreaRatio) {
        return false;
    }

    if (metrics.minEdge < minQrEdge) {
        return false;
    }

    if (metrics.maxEdge / Math.max(metrics.minEdge, 1) > maxQrEdgeRatio) {
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
            Math.min(UI.video.width, UI.video.height) * maxCenterJumpRatio;
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

            for (let columnIndex = pivotIndex; columnIndex <= size; columnIndex += 1) {
                augmented[rowIndex][columnIndex] -= factor * augmented[pivotIndex][columnIndex];
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
        rotation1[0] * AR_SCALE,
        rotation1[1] * AR_SCALE,
        rotation1[2] * AR_SCALE,
        translation[0],
        -rotation2[0] * AR_SCALE,
        -rotation2[1] * AR_SCALE,
        -rotation2[2] * AR_SCALE,
        -translation[1],
        -rotation3[0] * AR_SCALE,
        -rotation3[1] * AR_SCALE,
        -rotation3[2] * AR_SCALE,
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

function isPendulumAnimating() {
    return pendulumPhases.length > 0 && pendulumPhaseIndex < pendulumPhases.length;
}

async function runQrDetection() {
    if (!qrScannerReady || qrScanInFlight || !scanContext || !renderer) {
        return;
    }

    qrScanInFlight = true;
    let markerFound = false;
    let shouldHoldSteady = false;
    let liveMarkerDetected = false;

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
            tryHarder: true,
            tryInvert: true,
            tryRotate: true
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
        console.error("Pendulum QR scan failed.", error);
    } finally {
        qrScanInFlight = false;
    }
}

function updateTrackingStatus(markerFound, shouldHoldSteady) {
    if (markerFound && isPendulumAnimating()) {
        setStatus(COPY.collision);
        return;
    }

    if (markerFound) {
        setStatus(COPY.stable);
        return;
    }

    if (shouldHoldSteady && detectionStreak > 0) {
        setStatus(COPY.steady);
        return;
    }

    setStatus(COPY.searching);
}

function processFrame(timestamp) {
    if (!activeStream || !renderer) {
        return;
    }

    updatePendulumAnimation(timestamp);

    if (!lastQrScanTime || timestamp - lastQrScanTime >= getQrScanInterval()) {
        lastQrScanTime = timestamp;
        void runQrDetection();
    }

    updateTrackingStatus(lastScanResult.markerFound, lastScanResult.shouldHoldSteady);
    renderer.render(scene, camera);
    animationFrameId = window.requestAnimationFrame(processFrame);
}

function fitToScreen() {
    if (!UI.video?.videoWidth || !UI.video?.videoHeight) {
        return;
    }

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

    if (renderer) {
        renderer.setSize(UI.video.videoWidth, UI.video.videoHeight, false);
    }

    if (camera) {
        camera.aspect = UI.video.videoWidth / UI.video.videoHeight;
        camera.updateProjectionMatrix();
    }
}

initProject();
