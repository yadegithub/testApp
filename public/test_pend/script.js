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

let src, cap, qrDetector, camMatrix, distCoeffs, rvec, tvec, rotMatr, objectPoints;
let renderer, scene, camera, arGroup, mainModel;
let AR_SCALE = 0.1;
const BUILD_VERSION = "20260503-4";
const DEFAULT_MODEL_PATH = "./assets/newtons_cradle (1).glb";
const MAX_RENDER_PIXEL_RATIO = 1.25;
const CAMERA_IDEAL_WIDTH = 960;
const CAMERA_IDEAL_HEIGHT = 540;
const CAMERA_IDEAL_FRAME_RATE = 24;
const CAMERA_MAX_FRAME_RATE = 30;
const SHOW_DEBUG_CAMERA_CANVAS = false;
const MARKER_LOST_GRACE_FRAMES = 3;
const INITIAL_CONFIRM_FRAMES = 3;
const TRACKED_CONFIRM_FRAMES = 1;
const MIN_QR_AREA_RATIO = 0.006;
const MIN_QR_EDGE = 56;
const MAX_QR_EDGE_RATIO = 2.8;
const MAX_CENTER_JUMP_RATIO = 0.2;

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
let detectionStreak = 0;
let lastDetectionCenter = null;
let hasLockedOnQr = false;

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
        appTitle: "بندول نيوتن",
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
        steady: "تم اكتشاف QR، أبقه ثابتا...",
        rotate: "تدوير",
        scale: "تحجيم",
        launch: "تشغيل"
    }
    : {
        appEyebrow: "AR Learn live scan",
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
    if (!modelPath) return withCacheBuster(DEFAULT_MODEL_PATH);
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

async function initProject() {
    applyLocalizedCopy();
    setStatus(COPY.loading);
    try {
        const response = await fetch(withCacheBuster("./data.json"));
        if (!response.ok) {
            throw new Error(`Impossible de charger data.json (${response.status})`);
        }

        const config = await response.json();
        AR_SCALE = config?.settings?.arScale || AR_SCALE;
        const path = normalizeModelPath(config?.assets?.models?.pendulum?.path);
        startAR(path);
    } catch (error) {
        console.error("Config error:", error);
        startAR(withCacheBuster(DEFAULT_MODEL_PATH));
    }
}

function startAR(modelPath) {
    document.body.classList.remove("camera-ready");
    UI.video.muted = true;
    UI.video.autoplay = true;
    UI.video.playsInline = true;
    setStatus(COPY.cameraRequest);

    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "environment",
            width: { ideal: CAMERA_IDEAL_WIDTH },
            height: { ideal: CAMERA_IDEAL_HEIGHT },
            frameRate: {
                ideal: CAMERA_IDEAL_FRAME_RATE,
                max: CAMERA_MAX_FRAME_RATE
            }
        }
    }).then(stream => {
        UI.video.srcObject = stream;
        UI.video.onloadedmetadata = async () => {
            await UI.video.play();
            document.body.classList.add("camera-ready");

            const { width, height } = getVideoSize();
            UI.video.width = width;
            UI.video.height = height;
            UI.canvasOutput.width = UI.canvasThree.width = width;
            UI.canvasOutput.height = UI.canvasThree.height = height;
            fitToScreen();

            const checkCV = () => {
                if (typeof cv !== "undefined" && cv.Mat) {
                    setupThreeJS(modelPath);
                    initOpenCV();
                    setupControls();
                    requestAnimationFrame(processFrame);
                } else {
                    setTimeout(checkCV, 100);
                }
            };

            checkCV();
        };
    }).catch(err => {
        console.error("Camera error:", err);
        setStatus(`Camera error: ${err.name || "Access denied"}`);
    });
}

function setupThreeJS(modelPath) {
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
        arGroup.add(mainModel);
        setupPendulumBalls();

        setStatus(COPY.ready);
        setupInteraction();
    }, undefined, (err) => {
        console.error("Model error:", err);
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

function applyLocalizedCopy() {
    UI.appEyebrow.textContent = COPY.appEyebrow;
    UI.appTitle.textContent = COPY.appTitle;
    UI.cardHint.textContent = COPY.cardHint;
    UI.cardTag.textContent = COPY.cardTag;
    UI.partInfo.textContent = COPY.cardInfo;
    UI.partName.textContent = COPY.cardName;
    document.title = `AR Learn - ${COPY.appTitle}`;
}

function setupInteraction() {
    const start = (e) => {
        isDragging = true;
        pointerMoved = false;

        const { x, y } = getPointerCoords(e);
        prevPos = { x, y };
        pointerStart = { x, y };
        pressedBall = getClickedPendulumBall(x, y);
    };

    const move = (e) => {
        if (!isDragging || !mainModel) return;

        const { x, y } = getPointerCoords(e);
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

function initOpenCV() {
    const { width, height } = getVideoSize();

    src = new cv.Mat(height, width, cv.CV_8UC4);
    cap = new cv.VideoCapture(UI.video);
    qrDetector = new cv.QRCodeDetector();

    const f = Math.max(width, height);
    camMatrix = cv.matFromArray(3, 3, cv.CV_64FC1, [
        f, 0, width / 2,
        0, f, height / 2,
        0, 0, 1
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

    camera.projectionMatrix.set(
        (2 * f) / width, 0, 0, 0,
        0, (2 * f) / height, 0, 0,
        0, 0, -1.002, -0.2,
        0, 0, -1, 0
    );
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

    let area = 0;
    for (let index = 0; index < corners.length; index += 1) {
        const current = corners[index];
        const next = corners[(index + 1) % corners.length];
        area += (current.x * next.y) - (next.x * current.y);
    }

    const edgeLengths = corners.map((corner, index) => {
        const next = corners[(index + 1) % corners.length];
        return Math.hypot(next.x - corner.x, next.y - corner.y);
    });

    const center = corners.reduce((accumulator, corner) => ({
        x: accumulator.x + (corner.x / corners.length),
        y: accumulator.y + (corner.y / corners.length)
    }), { x: 0, y: 0 });

    return {
        area: Math.abs(area) * 0.5,
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
        const maxJump = Math.min(UI.video.width, UI.video.height) * MAX_CENTER_JUMP_RATIO;
        const currentJump = Math.hypot(
            metrics.center.x - lastDetectionCenter.x,
            metrics.center.y - lastDetectionCenter.y
        );
        detectionStreak = currentJump <= maxJump ? detectionStreak + 1 : 1;
    } else {
        detectionStreak = 1;
    }

    lastDetectionCenter = metrics.center;
    const requiredFrames = hasLockedOnQr ? TRACKED_CONFIRM_FRAMES : INITIAL_CONFIRM_FRAMES;
    return detectionStreak >= requiredFrames;
}

function resetDetectionConfidence() {
    detectionStreak = 0;
    lastDetectionCenter = null;
}

function isPendulumAnimating() {
    return pendulumPhases.length > 0 && pendulumPhaseIndex < pendulumPhases.length;
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

    setStatus(COPY.ready);
}

function processFrame() {
    if (!cap || !src) {
        requestAnimationFrame(processFrame);
        return;
    }

    cap.read(src);
    if (SHOW_DEBUG_CAMERA_CANVAS) {
        cv.imshow("canvasOutput", src);
    }

    const points = new cv.Mat();
    let markerFound = false;
    let shouldHoldSteady = false;

    if (qrDetector.detect(src, points)) {
        const metrics = getQrMetrics(points);
        const confirmedDetection = updateDetectionConfidence(metrics);
        shouldHoldSteady = Boolean(metrics);

        if (confirmedDetection) {
            const imgPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
                points.data32F[0], points.data32F[1],
                points.data32F[2], points.data32F[3],
                points.data32F[4], points.data32F[5],
                points.data32F[6], points.data32F[7]
            ]);

            if (cv.solvePnP(objectPoints, imgPts, camMatrix, distCoeffs, rvec, tvec)) {
                cv.Rodrigues(rvec, rotMatr);
                const r = rotMatr.data64F;
                const t = tvec.data64F;

                trackedMatrix.set(
                    r[0] * AR_SCALE,  r[1] * AR_SCALE,  r[2] * AR_SCALE,  t[0],
                   -r[3] * AR_SCALE, -r[4] * AR_SCALE, -r[5] * AR_SCALE, -t[1],
                   -r[6] * AR_SCALE, -r[7] * AR_SCALE, -r[8] * AR_SCALE, -t[2],
                    0,                0,                0,                1
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
                    hasLockedOnQr = true;
                } else {
                    arGroup.position.copy(trackedPosition);
                    arGroup.quaternion.copy(trackedQuaternion);
                    arGroup.scale.copy(trackedScale);
                }

                arGroup.visible = true;
                markerFound = true;
                lostMarkerFrames = 0;
            }

            imgPts.delete();
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

    updatePendulumAnimation(performance.now());
    updateTrackingStatus(markerFound, shouldHoldSteady);
    renderer.render(scene, camera);
    points.delete();
    requestAnimationFrame(processFrame);
}

function fitToScreen() {
    const { width, height } = getVideoSize();
    const scale = Math.max(window.innerWidth / width, window.innerHeight / height);

    [UI.video, UI.canvasOutput, UI.canvasThree].forEach(layer => {
        layer.style.width = `${width * scale}px`;
        layer.style.height = `${height * scale}px`;
        layer.style.left = "50%";
        layer.style.top = "50%";
        layer.style.transform = "translate(-50%, -50%)";
    });

}

initProject();

