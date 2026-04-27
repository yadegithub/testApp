const UI = {
    video: document.getElementById("videoInput"),
    status: document.getElementById("status"),
    canvasOutput: document.getElementById("canvasOutput"),
    canvasThree: document.getElementById("canvasThree")
};

let src, cap, qrDetector, camMatrix, distCoeffs, rvec, tvec, rotMatr, objectPoints;
let renderer, scene, camera, arGroup, mainModel;
let AR_SCALE = 2.0;
const BUILD_VERSION = "20260427-1";
const DEFAULT_MODEL_PATH = "./assets/newtons_cradle (1).glb";

let currentMode = "rotate";
let isDragging = false;
let prevPos = { x: 0, y: 0 };
let pointerStart = null;
let pointerMoved = false;
let pressedBall = null;
let selectedPendulumBall = null;
let pendulumBalls = [];
let pendulumPhases = [];
let pendulumPhaseIndex = 0;
let pendulumPhaseStartedAt = 0;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const CLICK_MOVE_THRESHOLD = 8;
const DEFAULT_SWING_ANGLE = 0.95;
const SWING_DAMPING = 0.72;
const MIN_SWING_ANGLE = 0.18;

window.addEventListener("resize", fitToScreen);

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

async function initProject() {
    UI.status.innerText = "Chargement du pendule...";
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
    UI.video.muted = true;
    UI.video.autoplay = true;
    UI.video.playsInline = true;
    UI.status.innerText = "Demande d'acces a la camera...";

    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    }).then(stream => {
        UI.video.srcObject = stream;
        UI.video.onloadedmetadata = async () => {
            await UI.video.play();

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
        UI.status.innerText = `Erreur camera: ${err.name || "Acces refuse"}`;
    });
}

function setupThreeJS(modelPath) {
    const { width, height } = getVideoSize();

    renderer = new THREE.WebGLRenderer({
        canvas: UI.canvasThree,
        alpha: true,
        antialias: true
    });
    renderer.setSize(width, height, false);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    arGroup = new THREE.Group();
    arGroup.visible = false;
    arGroup.matrixAutoUpdate = false;
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

        UI.status.innerText = "Pret : Scannez le QR Code";
        setupInteraction();
    }, undefined, (err) => {
        console.error("Model error:", err);
        UI.status.innerText = "Erreur chargement modele";
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
        UI.status.innerText = "Aucune bille disponible";
        return;
    }

    if (!ball.isOuter) {
        UI.status.innerText = "Cliquez sur une bille laterale";
        return;
    }

    selectedPendulumBall = ball;

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
    UI.status.innerText = "Collision en cours...";
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
        UI.status.innerText = "Pret : Scannez le QR Code";
    }
}

function setupControls() {
    const btnRotate = document.getElementById("btn-rotate");
    const btnScale = document.getElementById("btn-scale");
    const btnLaunch = document.getElementById("btn-launch");
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

function processFrame() {
    if (!cap || !src) {
        requestAnimationFrame(processFrame);
        return;
    }

    cap.read(src);
    cv.imshow("canvasOutput", src);

    const points = new cv.Mat();

    if (qrDetector.detect(src, points)) {
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
            const m = new THREE.Matrix4();

            m.set(
                r[0] * AR_SCALE,  r[1] * AR_SCALE,  r[2] * AR_SCALE,  t[0],
               -r[3] * AR_SCALE, -r[4] * AR_SCALE, -r[5] * AR_SCALE, -t[1],
               -r[6] * AR_SCALE, -r[7] * AR_SCALE, -r[8] * AR_SCALE, -t[2],
                0,                0,                0,                1
            );

            arGroup.matrix.copy(m);
            arGroup.visible = true;
        }

        imgPts.delete();
    } else {
        arGroup.visible = false;
    }

    updatePendulumAnimation(performance.now());
    renderer.render(scene, camera);
    points.delete();
    requestAnimationFrame(processFrame);
}

function fitToScreen() {
    const { width, height } = getVideoSize();
    const scale = Math.max(window.innerWidth / width, window.innerHeight / height);

    [UI.canvasOutput, UI.canvasThree].forEach(canvas => {
        canvas.style.width = `${width * scale}px`;
        canvas.style.height = `${height * scale}px`;
    });

}

initProject();
