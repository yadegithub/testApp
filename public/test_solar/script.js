let renderer;
let labelRenderer;
let scene;
let camera;
let arGroup;
let modelHolder;
let sourceSolarModel;
let animationMixer;
let activeStream;
let labels = [];
let currentMode = null;
let labelsVisible = true;
let isDragging = false;
let prevPos = { x: 0, y: 0 };
let arScale = 2.75;
let animationFrameId = 0;
let isArInitialized = false;
let isSessionStarting = false;
let focusedPartIndex = -1;
let lostMarkerFrames = 0;
let hasTrackingPose = false;
let hasLiveMarkerDetection = false;
let detectionStreak = 0;
let lastDetectionCenter = null;
let previousFrameTime = 0;
let lastQrScanTime = 0;
let focalLength = 0;
let qrScannerReady = false;
let qrScanInFlight = false;
let scanContext;
let lastScanResult = {
  markerFound: false,
  shouldHoldSteady: false,
};

const trackedMatrix = new THREE.Matrix4();
const trackedPosition = new THREE.Vector3();
const trackedQuaternion = new THREE.Quaternion();
const trackedScale = new THREE.Vector3();

function setStatus(message) {
  if (!UI.status || UI.status.textContent === message) {
    return;
  }
  UI.status.textContent = message;
}

function getSelectedBody() {
  return focusedPartIndex >= 0 ? solarBodies[focusedPartIndex] : null;
}

function updateInfoCard() {
  if (!UI.cardTag || !UI.partName || !UI.partInfo || !UI.cardHint) {
    return;
  }

  const selectedBody = getSelectedBody();
  if (!selectedBody) {
    UI.card.classList.remove("info-card--visible");
    UI.card.classList.remove("info-card--selected");
    return;
  }

  UI.cardTag.textContent = copy.focusTag;
  UI.partName.textContent = selectedBody.title;
  UI.partInfo.textContent = selectedBody.info;
  UI.cardHint.textContent = selectedBody.hint;
  UI.card.classList.add("info-card--visible");
  UI.card.classList.add("info-card--selected");
}

function syncLabels() {
  const shouldShowLabels =

    labelsVisible && Boolean(arGroup?.visible) && (hasLiveMarkerDetection || hasTrackingPose);

    labelsVisible && Boolean(arGroup?.visible);


  labels.forEach((entry) => {
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

  const selectedEntry = focusedPartIndex >= 0 ? labels[focusedPartIndex] : null;
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
  focusedPartIndex = Math.max(-1, Math.min(solarBodies.length - 1, index));
  updateInfoCard();
  syncLabels();
  positionInfoCard();
}

function showViewerUi() {
  if (UI.sideMenu) {
    UI.sideMenu.style.display = "";
  }

  if (UI.card) {
    UI.card.style.display = "";
  }
}

function applyCopy() {
  UI.appEyebrow.textContent = copy.appEyebrow;
  UI.appTitle.textContent = copy.appTitle;
  UI.rotateLabel.textContent = copy.rotate;
  UI.scaleLabel.textContent = copy.scale;
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
  let config = defaultConfig;
  try {
    const response = await fetch("./data.json");
    if (response.ok) {
      config = await response.json();
    }
  } catch (error) {
    config = defaultConfig;
  }
  showViewerUi();
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
    activeStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: CAMERA_IDEAL_WIDTH },
        height: { ideal: CAMERA_IDEAL_HEIGHT },
        frameRate: {
          ideal: CAMERA_IDEAL_FRAME_RATE,
          max: CAMERA_MAX_FRAME_RATE,
        },
      },
    });
    await new Promise((resolve) => {
      const handleLoadedMetadata = () => {
        UI.video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        resolve();
      };
      UI.video.addEventListener("loadedmetadata", handleLoadedMetadata);
      UI.video.srcObject = activeStream;
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
    console.error("Solar QR session failed to start.", error);
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
    0,
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
    antialias: true,
  });
  renderer.setSize(UI.video.width, UI.video.height, false);
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, MAX_RENDER_PIXEL_RATIO),
  );

  labelRenderer = new THREE.CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0";
  labelRenderer.domElement.style.left = "0";
  labelRenderer.domElement.style.pointerEvents = "none";
    labelRenderer.domElement.dir = "ltr";
    labelRenderer.domElement.style.direction = "ltr";
  labelRenderer.domElement.style.zIndex = "25";
  document.body.appendChild(labelRenderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    45,
    UI.video.width / UI.video.height,
    0.1,
    1000,
  );

  arGroup = new THREE.Group();
  arGroup.visible = false;
  arGroup.matrixAutoUpdate = true;
  scene.add(arGroup);

  modelHolder = new THREE.Group();
  arGroup.add(modelHolder);

  scene.add(new THREE.AmbientLight(0xffffff, 1.15));

  const keyLight = new THREE.PointLight(0xffffff, 0.9);
  keyLight.position.set(5, 6, 7);
  scene.add(keyLight);

  const warmLight = new THREE.PointLight(0xffc56c, 0.7);
  warmLight.position.set(-5, 3, 4);
  scene.add(warmLight);

  const modelConfig =
    config.assets?.models?.solar ?? defaultConfig.assets.models.solar;
  const modelPath = modelConfig.path ?? MODEL_PATH;
  const loader = new THREE.GLTFLoader();
  const enhanceDirectModel =
    modelConfig.enhanceDirectModel ?? defaultConfig.assets.models.solar.enhanceDirectModel;
  const modelPosition =
    modelConfig.position ?? defaultConfig.assets.models.solar.position;
  const modelRotation =
    modelConfig.rotation ?? defaultConfig.assets.models.solar.rotation;

  arScale = config.settings?.arScale ?? defaultConfig.settings.arScale;

  setStatus(copy.statusLoading);

  modelHolder.position.set(
    modelPosition.x ?? 0.44,
    modelPosition.y ?? 0.36,
    modelPosition.z ?? 0.03,
  );
  modelHolder.rotation.set(
    modelRotation.x ?? DEFAULT_ROTATION.x,
    modelRotation.y ?? DEFAULT_ROTATION.y,
    modelRotation.z ?? DEFAULT_ROTATION.z,
  );

  loader.load(
    modelPath,
    (loadedAsset) => {
      sourceSolarModel = loadedAsset.scene;
      renderDirectSolarModel(sourceSolarModel, modelConfig, {
        enhanceModel: enhanceDirectModel,
        animations: loadedAsset.animations ?? [],
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
    },
  );
}

function setupControls() {
  const syncModeButtons = () => {
    UI.rotateBtn.classList.toggle("active", currentMode === "rotate");
    UI.scaleBtn.classList.toggle("active", currentMode === "scale");
    UI.rotateBtn.setAttribute("aria-pressed", String(currentMode === "rotate"));
    UI.scaleBtn.setAttribute("aria-pressed", String(currentMode === "scale"));
  };

  const setMode = (mode) => {
    currentMode = currentMode === mode ? null : mode;
    isDragging = false;
    syncModeButtons();
  };

  UI.rotateBtn.onclick = () => setMode("rotate");
  UI.scaleBtn.onclick = () => setMode("scale");
  UI.labelToggle.onchange = (event) => {
    labelsVisible = event.target.checked;
    syncLabels();
    positionInfoCard();
  };

  syncModeButtons();
  syncLabels();
}

function setupInteraction() {
  const start = (event) => {
    if (!modelHolder || !currentMode) {
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
    if (!isDragging || !modelHolder || !currentMode) {
      return;
    }
    const point = event.touches?.[0] ?? event;
    const deltaX = point.clientX - prevPos.x;
    const deltaY = point.clientY - prevPos.y;
    if (currentMode === "rotate") {
      modelHolder.rotation.y += deltaX * 0.01;
      modelHolder.rotation.x += deltaY * 0.006;
    } else if (currentMode === "scale") {
      const factor = Math.max(0.78, Math.min(1.28, 1 - deltaY * 0.004));
      modelHolder.scale.multiplyScalar(factor);
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
    ? QR_SCAN_INTERVAL_MS
    : QR_SEARCH_INTERVAL_MS;
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
        y: Number(point.y),
      }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

    return corners.length === 4 ? corners : null;
  }

  const position = source.position ?? source;
  const orderedCorners = [
    position.topLeft,
    position.topRight,
    position.bottomRight,
    position.bottomLeft,
  ];

  if (orderedCorners.some((point) => !point)) {
    return null;
  }

  const corners = orderedCorners
    .map((point) => ({
      x: Number(point.x),
      y: Number(point.y),
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
    }, 0) / 2,
  );

  const center = corners.reduce(
    (accumulator, corner) => ({
      x: accumulator.x + corner.x / corners.length,
      y: accumulator.y + corner.y / corners.length,
    }),
    { x: 0, y: 0 },
  );

  return {
    area,
    center,
    maxEdge: Math.max(...edgeLengths),
    minEdge: Math.min(...edgeLengths),
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
      metrics.center.y - lastDetectionCenter.y,
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
        augmented[pivotIndex],
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
    { x: 0, y: 1 },
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
    [solution[6], solution[7], 1],
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
    left[2] - right[2],
  ];
}

function cross3(left, right) {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
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
    column[2],
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
    scaleVector3(rotation1, dot3(rawRotation2, rotation1)),
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
    1,
  );

  trackedMatrix.decompose(trackedPosition, trackedQuaternion, trackedScale);
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

  arGroup.position.lerp(trackedPosition, TRACK_ALPHA);
  arGroup.quaternion.slerp(trackedQuaternion, TRACK_ALPHA);
  arGroup.scale.lerp(trackedScale, TRACK_ALPHA);
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
    const frame = scanContext.getImageData(0, 0, UI.video.width, UI.video.height);
    const results = await window.ZXingWASM.readBarcodes(frame, {
      formats: ["QRCode"],
      maxNumberOfSymbols: 1,
      tryDownscale: true,
      tryHarder: true,
      tryInvert: true,
      tryRotate: true,
    });

    const detectedBarcode = results.find((result) => result?.position);

    if (detectedBarcode) {
      const corners = getDetectedCorners(detectedBarcode.position);
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
      if (hasTrackingPose && lostMarkerFrames < LOST_GRACE_FRAMES) {
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
    console.error("Solar QR scan failed.", error);
  } finally {
    qrScanInFlight = false;
  }
}

function processFrame(timestamp) {
  if (!activeStream || !renderer || !labelRenderer) {
    return;
  }

  const deltaSeconds = previousFrameTime
    ? Math.min((timestamp - previousFrameTime) / 1000, 0.05)
    : 0;
  previousFrameTime = timestamp;

  if (animationMixer && deltaSeconds > 0) {
    animationMixer.update(deltaSeconds);
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

<<<<<<< HEAD
  syncLabels();
=======
  if (!arGroup?.visible && focusedPartIndex !== -1) {
    setFocusedPart(-1);
  } else {
    syncLabels();
  }
>>>>>>> 3d83a33be87afefb237d7c9cb5b948afea5a7de7

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  positionInfoCard();

  animationFrameId = window.requestAnimationFrame(processFrame);
}

function fitToScreen() {
  const scale = Math.max(
    window.innerWidth / UI.video.videoWidth,
    window.innerHeight / UI.video.videoHeight,
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

  isDragging = false;
  isArInitialized = false;
  focusedPartIndex = -1;
  lostMarkerFrames = 0;
  hasTrackingPose = false;
  hasLiveMarkerDetection = false;
  resetDetectionConfidence();
  previousFrameTime = 0;
  lastQrScanTime = 0;
  focalLength = 0;
  qrScannerReady = false;
  qrScanInFlight = false;
  lastScanResult = {
    markerFound: false,
    shouldHoldSteady: false,
  };

  if (renderer) {
    renderer.dispose();
  }
  if (labelRenderer?.domElement?.parentNode) {
    labelRenderer.domElement.parentNode.removeChild(labelRenderer.domElement);
  }

  labels = [];
  showViewerUi();
  scanContext = undefined;
  renderer = undefined;
  labelRenderer = undefined;
  scene = undefined;
  camera = undefined;
  arGroup = undefined;
  modelHolder = undefined;
  sourceSolarModel = undefined;
  animationMixer = undefined;
}

window.addEventListener("resize", fitToScreen);
window.addEventListener("pagehide", cleanup);
window.addEventListener("beforeunload", cleanup);

loadConfig();
