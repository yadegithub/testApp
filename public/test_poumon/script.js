const query = new URLSearchParams(window.location.search);
const currentTheme = query.get("theme") === "light" ? "light" : "dark";
const languageParam = query.get("lang");
const currentLanguage = languageParam === "ar" ? "ar" : languageParam === "fr" ? "fr" : "en";

document.documentElement.dataset.theme = currentTheme;
document.documentElement.lang = currentLanguage;
document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";

const UI = {
    video: document.getElementById("videoInput"),
    status: document.getElementById("status"),
    canvasOutput: document.getElementById("canvasOutput"),
    canvasThree: document.getElementById("canvasThree"),
    card: document.getElementById("info-card"),
    cardTag: document.getElementById("card-tag"),
    labelsLayer: document.getElementById("organ-labels"),
    labelToggle: document.getElementById("label-toggle"),
    modelTitle: document.getElementById("model-title-pill"),
    overviewCard: document.getElementById("overview-card"),
    overviewTitle: document.getElementById("overview-title"),
    overviewText: document.getElementById("overview-text"),
    partName: document.getElementById("part-name"),
    partInfo: document.getElementById("part-info"),
    partHint: document.getElementById("card-hint")
};

const STATUS_COPY = {
    fr: {
        ready: "Pret : Scannez le QR Code",
        stable: "Modele stabilise",
        breathing: "Respiration en cours..."
    },
    en: {
        ready: "Ready: scan the QR code",
        stable: "Model stabilized",
        breathing: "Breathing in progress..."
    },
    ar: {
        ready: "جاهز: امسح رمز QR",
        stable: "تم تثبيت النموذج",
        breathing: "التنفس قيد التشغيل..."
    }
};
const STATUS_READY = STATUS_COPY[currentLanguage]?.ready ?? STATUS_COPY.en.ready;
const STATUS_STABLE = STATUS_COPY[currentLanguage]?.stable ?? STATUS_COPY.en.stable;
const STATUS_BREATHING = STATUS_COPY[currentLanguage]?.breathing ?? STATUS_COPY.en.breathing;

const INFO_COPY = {
    fr: {
        name: "Poumons humains",
        info: "Observez la trachee, les bronches et le volume pulmonaire dans un modele 3D place sur votre QR code.",
        hint: "Utilisez Rotate, Scale et Respire pour explorer le modele."
    },
    en: {
        name: "Human lungs",
        info: "Observe the trachea, bronchi and lung volume in a 3D model placed on your QR code.",
        hint: "Use Rotate, Scale and Breathe to explore the model."
    },
    ar: {
        name: "الرئتان",
        info: "شاهد القصبة الهوائية والشعب الهوائية وحجم الرئتين داخل نموذج ثلاثي الأبعاد مثبت فوق رمز QR.",
        hint: "استخدم التدوير والتحجيم والتنفس لاستكشاف النموذج."
    }
};

Object.assign(INFO_COPY.fr, {
    title: "SYSTEME RESPIRATOIRE",
    overviewTitle: "Poumons humains",
    overviewText: "Un modele interactif qui montre les principaux organes respiratoires avec des notes guidees pour chaque structure.",
    focusTag: "STRUCTURE RESPIRATOIRE"
});

Object.assign(INFO_COPY.en, {
    title: "RESPIRATORY SYSTEM",
    overviewTitle: "Human Lungs",
    overviewText: "An interactive model that shows the main respiratory organs with guided notes for each structure.",
    focusTag: "RESPIRATORY STRUCTURE"
});

Object.assign(INFO_COPY.ar, {
    title: "الجهاز التنفسي",
    overviewTitle: "رئتا الإنسان",
    overviewText: "نموذج تفاعلي يوضح أهم أعضاء الجهاز التنفسي مع ملاحظات إرشادية لكل بنية.",
    focusTag: "بنية تنفسية"
});

const ORGAN_PARTS = [
    {
        id: "right-lung",
        label: "Poumon droit",
        info: "Le poumon droit reçoit l'air riche en oxygène et aide le corps à rejeter le dioxyde de carbone.",
        hint: "Il est un peu plus grand que le poumon gauche et comporte trois lobes.",
        screenOffset: { x: -1, y: 0.12 }
    },
    {
        id: "left-lung",
        label: "Poumon gauche",
        info: "Le poumon gauche participe aux échanges respiratoires comme le poumon droit.",
        hint: "Il est plus petit car il laisse de la place au coeur.",
        screenOffset: { x: 1, y: 0.12 }
    },
    {
        id: "trachea",
        label: "Trachée",
        info: "La trachée est un tube qui transporte l'air depuis le nez et la bouche vers la poitrine.",
        hint: "En bas, elle se divise en deux bronches qui entrent dans les poumons.",
        screenOffset: { x: 0, y: -0.9 }
    },
    {
        id: "bronchi",
        label: "Bronches",
        info: "Les bronches sont des conduits qui se ramifient dans les poumons pour distribuer l'air.",
        hint: "Elles deviennent de plus en plus petites à l'intérieur des poumons.",
        screenOffset: { x: 0, y: -0.22 }
    }
];

const ORGAN_PARTS_AR = {
    "right-lung": {
        label: "الرئة اليمنى",
        info: "تستقبل الرئة اليمنى الهواء الغني بالأكسجين وتساعد الجسم على التخلص من ثاني أكسيد الكربون.",
        hint: "هي أكبر قليلا من الرئة اليسرى وتتكون من ثلاثة فصوص."
    },
    "left-lung": {
        label: "الرئة اليسرى",
        info: "تشارك الرئة اليسرى في تبادل الغازات مثل الرئة اليمنى.",
        hint: "هي أصغر لأنها تترك مساحة للقلب."
    },
    trachea: {
        label: "القصبة الهوائية",
        info: "القصبة الهوائية أنبوب ينقل الهواء من الأنف والفم إلى الصدر.",
        hint: "في أسفلها تنقسم إلى شعبتين تدخلان إلى الرئتين."
    },
    bronchi: {
        label: "الشعب الهوائية",
        info: "الشعب الهوائية قنوات تتفرع داخل الرئتين لتوزيع الهواء.",
        hint: "تصبح أصغر فأصغر داخل الرئتين."
    }
};

if (currentLanguage === "ar") {
    ORGAN_PARTS.forEach((part) => {
        Object.assign(part, ORGAN_PARTS_AR[part.id] ?? {});
    });
}

let renderer;
let scene;
let camera;
let arGroup;
let mainModel;
let activeStream;
let organLabels = [];
let activeOrganIndex = -1;
let labelsVisible = true;

let AR_SCALE = 0.12;
const BUILD_VERSION = "20260506-4";
const DEFAULT_MODEL_PATH = "./assets/realistic_human_lungs.glb";
const MAX_RENDER_PIXEL_RATIO = 1.25;
const CAMERA_IDEAL_WIDTH = 960;
const CAMERA_IDEAL_HEIGHT = 540;
const CAMERA_IDEAL_FRAME_RATE = 24;
const CAMERA_MAX_FRAME_RATE = 30;
const SHOW_DEBUG_CAMERA_CANVAS = false;
const MARKER_LOST_GRACE_FRAMES = 20;
const CONFIRM_FRAMES = 2;
const MIN_QR_AREA_RATIO = 0.008;
const MIN_QR_EDGE = 48;
const MAX_QR_EDGE_RATIO = 2.3;
const MAX_CENTER_JUMP_RATIO = 0.12;
const POSITION_SMOOTH_FACTOR = 0.28;
const ROTATION_SMOOTH_FACTOR = 0.24;
const SCALE_SMOOTH_FACTOR = 0.28;
const QR_SCAN_INTERVAL_MS = 80;
const QR_SEARCH_INTERVAL_MS = 120;

let currentMode = "rotate";
let isDragging = false;
let prevPos = { x: 0, y: 0 };
let pointerStart = null;
let pointerMoved = false;
let launchButton = null;
let lostMarkerFrames = 0;
let hasTrackingPose = false;
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

let userModelScale = 1;
let breathScale = 1;
let breathStartTime = 0;
let breathing = false;

const BREATH_CYCLE_DURATION = 2200;
const BREATH_CYCLE_COUNT = 4;
const BREATH_SCALE_AMPLITUDE = 0.08;
const MODEL_MIN_SCALE = 0.35;
const MODEL_MAX_SCALE = 4.5;
const CLICK_MOVE_THRESHOLD = 8;

const trackedMatrix = new THREE.Matrix4();
const trackedPosition = new THREE.Vector3();
const trackedQuaternion = new THREE.Quaternion();
const trackedScale = new THREE.Vector3();
const poseTargetPosition = new THREE.Vector3();
const poseTargetQuaternion = new THREE.Quaternion();
const poseTargetScale = new THREE.Vector3();
const baseModelScale = new THREE.Vector3(1, 1, 1);
const modelCenter = new THREE.Vector3();
const modelSize = new THREE.Vector3();
const projectedModelCenter = new THREE.Vector3();

window.addEventListener("resize", fitToScreen);

function getCopy() {
    return INFO_COPY[currentLanguage] || INFO_COPY.en;
}

function applyInfoCard() {
    const copy = getCopy();
    const menuCopy = {
        fr: {
            eyebrow: "Scan AR en direct",
            appTitle: "POUMONS HUMAINS",
            rotate: "Rotation",
            scale: "Taille",
            launch: "Respire",
            labels: "Labels On/Off"
        },
        en: {
            eyebrow: "EduAR live scan",
            appTitle: "HUMAN LUNGS",
            rotate: "Rotate",
            scale: "Scale",
            launch: "Breathe",
            labels: "Labels On/Off"
        },
        ar: {
            eyebrow: "مسح مباشر",
            appTitle: "رئتا الإنسان",
            rotate: "تدوير",
            scale: "تحجيم",
            launch: "تنفس",
            labels: "التسميات تشغيل/إيقاف"
        }
    }[currentLanguage] || menuCopy.en;

    document.getElementById("app-eyebrow").innerText = menuCopy.eyebrow;
    document.getElementById("app-title").innerText = menuCopy.appTitle;
    document.querySelector("#btn-rotate .label").innerText = menuCopy.rotate;
    document.querySelector("#btn-scale .label").innerText = menuCopy.scale;
    document.querySelector("#btn-launch .label").innerText = menuCopy.launch;
    document.getElementById("labels-label").innerText = menuCopy.labels;

    if (UI.modelTitle) {
        UI.modelTitle.innerText = copy.title;
    }

    if (UI.overviewTitle) {
        UI.overviewTitle.innerText = copy.overviewTitle;
    }

    if (UI.overviewText) {
        UI.overviewText.innerText = copy.overviewText;
    }

    if (UI.cardTag) {
        UI.cardTag.innerText = copy.focusTag;
    }

    if (UI.partName) {
        UI.partName.innerText = copy.name;
    }

    if (UI.partInfo) {
        UI.partInfo.innerText = copy.info;
    }

    if (UI.partHint) {
        UI.partHint.innerText = copy.hint;
    }

    activeOrganIndex = -1;
    if (UI.card) {
        UI.card.classList.remove("info-card--visible", "info-card--selected");
    }
    updateOrganLabels();
    positionInfoCard();
}

function hideSelectedInfoCard() {
    activeOrganIndex = -1;
    if (UI.card) {
        UI.card.classList.remove("info-card--visible", "info-card--selected");
    }
    updateOrganLabels();
    positionInfoCard();
}

function setOrganInfo(index) {
    activeOrganIndex = activeOrganIndex === index ? -1 : index;

    if (activeOrganIndex < 0) {
        hideSelectedInfoCard();
        return;
    }

    const part = ORGAN_PARTS[activeOrganIndex];
    const copy = getCopy();

    if (UI.cardTag) {
        UI.cardTag.innerText = copy.focusTag;
    }

    if (UI.partName) {
        UI.partName.innerText = part.label.toUpperCase();
    }

    if (UI.partInfo) {
        UI.partInfo.innerText = part.info;
    }

    if (UI.partHint) {
        UI.partHint.innerText = part.hint;
    }

    if (UI.card) {
        UI.card.classList.add("info-card--visible", "info-card--selected");
    }

    updateOrganLabels();
    positionInfoCard();
}

function createOrganLabels() {
    if (!UI.labelsLayer || !mainModel) {
        return;
    }

    UI.labelsLayer.replaceChildren();
    organLabels = ORGAN_PARTS.map((part, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "organ-label";
        button.textContent = String(index + 1);
        button.setAttribute("aria-label", part.label);
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            setOrganInfo(index);
        });

        UI.labelsLayer.appendChild(button);

        return {
            button,
            screenOffset: part.screenOffset
        };
    });

    updateOrganLabels();
}

function updateOrganLabels() {
    organLabels.forEach((entry, index) => {
        const isActive = index === activeOrganIndex;
        entry.button.classList.toggle("organ-label--active", isActive);
        entry.button.setAttribute("aria-pressed", String(isActive));
    });

    if (UI.labelToggle) {
        UI.labelToggle.checked = labelsVisible;
    }
}

function positionOrganLabels() {
    if (!labelsVisible || !mainModel || !camera || !arGroup?.visible) {
        organLabels.forEach((entry) => {
            entry.button.classList.remove("organ-label--visible");
        });
        if (activeOrganIndex >= 0 || UI.card?.classList.contains("info-card--visible")) {
            hideSelectedInfoCard();
        }
        syncFloatingUi(false);
        return;
    }

    projectedModelCenter.set(0, 0, 0);
    arGroup.localToWorld(projectedModelCenter);
    projectedModelCenter.project(camera);

    const centerIsVisible = projectedModelCenter.z > -1 && projectedModelCenter.z < 1;
    const centerX = ((projectedModelCenter.x + 1) / 2) * window.innerWidth;
    const centerY = ((-projectedModelCenter.y + 1) / 2) * window.innerHeight;
    const labelScale = clamp(userModelScale, MODEL_MIN_SCALE, MODEL_MAX_SCALE);
    const spread = clamp(
        Math.min(window.innerWidth, window.innerHeight) * 0.18 * labelScale,
        42,
        150
    );
    const sidePadding = Math.min(120, Math.max(76, window.innerWidth * 0.16));

    let activeLabelIsVisible = false;

    organLabels.forEach((entry, index) => {
        const x = clamp(
            centerX + (entry.screenOffset.x * spread),
            sidePadding,
            window.innerWidth - sidePadding
        );
        const y = clamp(
            centerY + (entry.screenOffset.y * spread),
            42,
            window.innerHeight - 58
        );
        const isOnScreen =
            centerIsVisible &&
            centerX > -100 &&
            centerX < window.innerWidth + 100 &&
            centerY > -100 &&
            centerY < window.innerHeight + 100;

        entry.button.classList.toggle("organ-label--visible", isOnScreen);
        entry.button.style.left = `${x}px`;
        entry.button.style.top = `${y}px`;
        entry.button.style.setProperty("--marker-scale", String(labelScale));

        if (index === activeOrganIndex) {
            activeLabelIsVisible = isOnScreen;
        }
    });

    if (activeOrganIndex >= 0 && !activeLabelIsVisible) {
        hideSelectedInfoCard();
    }

    positionTitlePill(centerX, centerY, spread, centerIsVisible);
    syncFloatingUi(centerIsVisible);
}

function positionTitlePill(centerX, centerY, spread, isVisible) {
    if (!UI.modelTitle) {
        return;
    }

    if (!isVisible || !arGroup?.visible) {
        UI.modelTitle.classList.remove("model-title-pill--visible");
        return;
    }

    const pillWidth = UI.modelTitle.offsetWidth || 190;
    const left = clamp(centerX - (pillWidth / 2), 18, window.innerWidth - pillWidth - 18);
    const top = clamp(centerY - (spread * 1.55), 18, window.innerHeight - 96);

    UI.modelTitle.style.left = `${left}px`;
    UI.modelTitle.style.top = `${top}px`;
    UI.modelTitle.classList.add("model-title-pill--visible");
}

function syncFloatingUi(isVisible) {
    const shouldShow = Boolean(isVisible && arGroup?.visible);

    if (UI.modelTitle && !shouldShow) {
        UI.modelTitle.classList.remove("model-title-pill--visible");
    }

    void shouldShow;
}

function positionInfoCard() {
    if (!UI.card) {
        return;
    }

    const selectedEntry = activeOrganIndex >= 0 ? organLabels[activeOrganIndex] : null;

    if (!selectedEntry || !arGroup?.visible) {
        UI.card.classList.remove("info-card--floating");
        UI.card.style.left = "50%";
        UI.card.style.top = "";
        UI.card.style.right = "";
        UI.card.style.bottom = window.innerWidth <= 600 ? "12px" : "18px";
        UI.card.style.transform = "translateX(-50%)";
        return;
    }

    const markerRect = selectedEntry.button.getBoundingClientRect();
    const cardWidth = UI.card.offsetWidth || 300;
    const cardHeight = UI.card.offsetHeight || 150;

    let left = markerRect.right + 22;
    if (left + cardWidth > window.innerWidth - 18) {
        left = markerRect.left - cardWidth - 22;
    }

    let top = markerRect.top + (markerRect.height / 2) - (cardHeight / 2);
    left = clamp(left, 18, window.innerWidth - cardWidth - 18);
    top = clamp(top, 18, window.innerHeight - cardHeight - 18);

    UI.card.classList.add("info-card--floating");
    UI.card.style.left = `${left}px`;
    UI.card.style.top = `${top}px`;
    UI.card.style.right = "auto";
    UI.card.style.bottom = "auto";
    UI.card.style.transform = "none";
}

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

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function setLaunchButtonActive(isActive) {
    if (!launchButton) {
        return;
    }

    launchButton.classList.toggle("active", isActive);
}

function applyModelScale() {
    if (!mainModel) {
        return;
    }

    mainModel.scale.set(
        baseModelScale.x * userModelScale * breathScale,
        baseModelScale.y * userModelScale * breathScale,
        baseModelScale.z * userModelScale * breathScale
    );
}

async function initProject() {
    applyInfoCard();
    setStatus("Chargement des poumons...");

    try {
        const response = await fetch(withCacheBuster("./data.json"));
        if (!response.ok) {
            throw new Error(`Impossible de charger data.json (${response.status})`);
        }

        const config = await response.json();
        AR_SCALE = config?.settings?.arScale || AR_SCALE;
        const path = normalizeModelPath(config?.assets?.models?.lung?.path);
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
    setStatus("Demande d'acces a la camera...");

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
        activeStream = stream;
        UI.video.srcObject = stream;
        UI.video.onloadedmetadata = async () => {
            try {
                await UI.video.play();
                document.body.classList.add("camera-ready");

                const { width, height } = getVideoSize();
                UI.video.width = width;
                UI.video.height = height;
                UI.canvasOutput.width = UI.canvasThree.width = width;
                UI.canvasOutput.height = UI.canvasThree.height = height;
                fitToScreen();

                setupThreeJS(modelPath);
                await initQrScanner();
                initTrackingProjection();
                setupControls();
                requestAnimationFrame(processFrame);
            } catch (error) {
                console.error("Lung QR session failed to start.", error);
                setStatus("Erreur initialisation QR");
            }
        };
    }).catch(err => {
        console.error("Camera error:", err);
        setStatus(`Erreur camera: ${err.name || "Acces refuse"}`);
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

    scene.add(new THREE.AmbientLight(0xffffff, 1.6));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    keyLight.position.set(2, 5, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x89c8ff, 0.45);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const loader = new THREE.GLTFLoader();
    loader.load(modelPath, (gltf) => {
        mainModel = gltf.scene;
        prepareModel(mainModel);
        arGroup.add(mainModel);
        createOrganLabels();
        setupInteraction();
        setStatus(STATUS_READY);
    }, undefined, (err) => {
        console.error("Model error:", err);
        setStatus("Erreur chargement modele");
    });
}

function prepareModel(model) {
    const box = new THREE.Box3().setFromObject(model);

    if (!box.isEmpty()) {
        box.getCenter(modelCenter);
        box.getSize(modelSize);

        model.position.x -= modelCenter.x;
        model.position.y -= modelCenter.y;
        model.position.z -= modelCenter.z;

        const largestAxis = Math.max(modelSize.x, modelSize.y, modelSize.z, 0.0001);
        const normalizedScale = 1.15 / largestAxis;
        model.scale.setScalar(normalizedScale);
        baseModelScale.copy(model.scale);
    } else {
        baseModelScale.set(1, 1, 1);
    }

    userModelScale = 1;
    breathScale = 1;
    applyModelScale();
}

function startBreathingAnimation() {
    if (!mainModel) {
        setLaunchButtonActive(false);
        setStatus(currentLanguage === "ar" ? "النموذج غير محمّل" : "Model not loaded");
        return;
    }

    breathing = true;
    breathStartTime = performance.now();
    setLaunchButtonActive(true);
    setStatus(STATUS_BREATHING);
}

function updateBreathingAnimation(now) {
    if (!breathing) {
        return;
    }

    const totalDuration = BREATH_CYCLE_DURATION * BREATH_CYCLE_COUNT;
    const elapsed = now - breathStartTime;

    if (elapsed >= totalDuration) {
        breathing = false;
        breathScale = 1;
        applyModelScale();
        setLaunchButtonActive(false);
        setStatus(arGroup?.visible ? STATUS_STABLE : STATUS_READY);
        return;
    }

    const cycleProgress = (elapsed % BREATH_CYCLE_DURATION) / BREATH_CYCLE_DURATION;
    const inhaleProgress = cycleProgress <= 0.5
        ? cycleProgress / 0.5
        : 1 - ((cycleProgress - 0.5) / 0.5);

    breathScale = lerp(1, 1 + BREATH_SCALE_AMPLITUDE, easeInOutSine(inhaleProgress));
    applyModelScale();
}

function setupControls() {
    const btnRotate = document.getElementById("btn-rotate");
    const btnScale = document.getElementById("btn-scale");
    const btnLaunch = document.getElementById("btn-launch");

    launchButton = btnLaunch;

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
            startBreathingAnimation();
        };
    }

    if (UI.labelToggle) {
        UI.labelToggle.onchange = (event) => {
            labelsVisible = event.target.checked;
            if (!labelsVisible && activeOrganIndex >= 0) {
                activeOrganIndex = -1;
                applyInfoCard();
            }
            updateOrganLabels();
            positionOrganLabels();
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
            mainModel.rotation.x = clamp(
                mainModel.rotation.x + (dy * 0.01),
                -Math.PI / 2,
                Math.PI / 2
            );
        } else {
            const scaleFactor = clamp(1 - (dy * 0.005), 0.92, 1.08);
            userModelScale = clamp(userModelScale * scaleFactor, MODEL_MIN_SCALE, MODEL_MAX_SCALE);
            applyModelScale();
        }

        prevPos = { x, y };
    };

    const end = () => {
        if (!isDragging) {
            return;
        }

        isDragging = false;
        pointerStart = null;
    };

    UI.canvasThree.addEventListener("mousedown", start);
    UI.canvasThree.addEventListener("touchstart", start);
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move);
    window.addEventListener("mouseup", end);
    window.addEventListener("touchend", end);
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
    const { width, height } = getVideoSize();

    focalLength = Math.max(width, height);

    camera.projectionMatrix.set(
        (2 * focalLength) / width, 0, 0, 0,
        0, (2 * focalLength) / height, 0, 0,
        0, 0, -1.002, -0.2,
        0, 0, -1, 0
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
    return detectionStreak >= CONFIRM_FRAMES;
}

function resetDetectionConfidence() {
    detectionStreak = 0;
    lastDetectionCenter = null;
}

function getQrScanInterval() {
    return hasTrackingPose || detectionStreak > 0
        ? QR_SCAN_INTERVAL_MS
        : QR_SEARCH_INTERVAL_MS;
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
        rotation1[0] * AR_SCALE,  rotation1[1] * AR_SCALE,  rotation1[2] * AR_SCALE,  translation[0],
       -rotation2[0] * AR_SCALE, -rotation2[1] * AR_SCALE, -rotation2[2] * AR_SCALE, -translation[1],
       -rotation3[0] * AR_SCALE, -rotation3[1] * AR_SCALE, -rotation3[2] * AR_SCALE, -translation[2],
        0,                       0,                       0,                       1
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
        arGroup.position.copy(poseTargetPosition);
        arGroup.quaternion.copy(poseTargetQuaternion);
        arGroup.scale.copy(poseTargetScale);
        return;
    }

    arGroup.position.lerp(poseTargetPosition, POSITION_SMOOTH_FACTOR);
    arGroup.quaternion.slerp(poseTargetQuaternion, ROTATION_SMOOTH_FACTOR);
    arGroup.scale.lerp(poseTargetScale, SCALE_SMOOTH_FACTOR);
}

function isModelAnimating() {
    return breathing;
}

function updateTrackingStatus(markerFound, shouldHoldSteady) {
    if (markerFound && isModelAnimating()) {
        setStatus(STATUS_BREATHING);
        return;
    }

    if (markerFound) {
        setStatus(STATUS_STABLE);
        return;
    }

    if (shouldHoldSteady && detectionStreak > 0) {
        setStatus("QR detecte, gardez-le stable...");
        return;
    }

    setStatus(STATUS_READY);
}

async function runQrDetection() {
    if (!qrScannerReady || qrScanInFlight || !scanContext) {
        return;
    }

    qrScanInFlight = true;
    let markerFound = false;
    let shouldHoldSteady = false;

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
            const corners = getDetectedCorners(detectedBarcode.position);
            const metrics = getQrMetrics(corners);
            const confirmedDetection = updateDetectionConfidence(metrics);
            shouldHoldSteady = Boolean(metrics);

            if (confirmedDetection && corners && updateTrackedPoseFromCorners(corners)) {
                poseTargetPosition.copy(trackedPosition);
                poseTargetQuaternion.copy(trackedQuaternion);
                poseTargetScale.copy(trackedScale);

                applyTrackedPose(!hasTrackingPose);
                hasTrackingPose = true;
                arGroup.visible = true;
                markerFound = true;
                lostMarkerFrames = 0;
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

        lastScanResult = { markerFound, shouldHoldSteady };
    } catch (error) {
        console.error("Lung QR scan failed.", error);
    } finally {
        qrScanInFlight = false;
    }
}

function processFrame(timestamp) {
    if (!activeStream || !renderer) {
        requestAnimationFrame(processFrame);
        return;
    }

    if (!lastQrScanTime || timestamp - lastQrScanTime >= getQrScanInterval()) {
        lastQrScanTime = timestamp;
        void runQrDetection();
    }

    const { markerFound, shouldHoldSteady } = lastScanResult;

    updateBreathingAnimation(performance.now());
    updateTrackingStatus(markerFound, shouldHoldSteady);
    renderer.render(scene, camera);
    positionOrganLabels();
    positionInfoCard();
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

    positionOrganLabels();
    positionInfoCard();
}

initProject();
