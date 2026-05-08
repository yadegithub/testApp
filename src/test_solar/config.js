const query = new URLSearchParams(window.location.search);
const currentTheme = query.get("theme") === "light" ? "light" : "dark";
const currentLanguage = query.get("lang") === "ar" ? "ar" : "en";

document.documentElement.dataset.theme = currentTheme;
document.documentElement.lang = currentLanguage;
document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";

const MODEL_PATH = "assets/solar_system.glb";
const DEFAULT_ROTATION = { x: 0, y: 0, z: 0 };
const LOST_GRACE_FRAMES = 1;
const TRACK_ALPHA = 0.58;
const CONFIRM_FRAMES = 2;
const MIN_QR_AREA_RATIO = 0.016;
const MIN_QR_EDGE = 70;
const MAX_QR_EDGE_RATIO = 2.3;
const MAX_CENTER_JUMP_RATIO = 0.08;
const MAX_RENDER_PIXEL_RATIO = 1.25;
const QR_SCAN_INTERVAL_MS = 42;
const QR_SEARCH_INTERVAL_MS = 64;
const CAMERA_IDEAL_WIDTH = 960;
const CAMERA_IDEAL_HEIGHT = 540;
const CAMERA_IDEAL_FRAME_RATE = 24;
const CAMERA_MAX_FRAME_RATE = 30;
const SHOW_DEBUG_CAMERA_CANVAS = false;
const DIRECT_LABEL_LIFT_SCALE = 0.72;
const DIRECT_ORBIT_TUBE_RADIUS = 0.012;
const DIRECT_ORBIT_OPACITY = 0.46;
const DIRECT_ORBIT_COLOR = 0xffc46d;
const DECORATION_KEYWORDS = [
  "orbit",
  "orbits",
  "orbita",
  "path",
  "curve",
  "spline",
  "trail",
  "trajectory",
  "guide",
  "helper",
  "wire",
  "line",
  "ellipse",
];

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
  sideMenu: document.getElementById("side-menu"),
  status: document.getElementById("status"),
  video: document.getElementById("videoInput"),
};

const solarBodies = [
  {
    id: "sun",
    label: "Sun",
    title: "SUN",
    info: "The Sun is the star at the center of the solar system and provides light and heat to every planet.",
    hint: "It holds most of the solar system's mass.",
    aliases: ["sun", "sol", "plsun"],
    orbit: { radius: 0, size: 0.108, speed: 0, spinSpeed: 0.12, phase: 0, labelLift: 0.165 },
  },
  {
    id: "mercury",
    label: "Mercury",
    title: "MERCURY",
    info: "Mercury is the smallest planet and the closest one to the Sun.",
    hint: "It moves around the Sun very quickly.",
    aliases: ["mercury", "mercurio"],
    orbit: { radius: 0.084, size: 0.012, speed: 1.55, spinSpeed: 0.85, phase: 0.34, labelLift: 0.045 },
  },
  {
    id: "venus",
    label: "Venus",
    title: "VENUS",
    info: "Venus is similar in size to Earth but has a thick atmosphere that traps heat.",
    hint: "It is often the brightest planet in the sky.",
    aliases: ["venus"],
    orbit: { radius: 0.128, size: 0.018, speed: 1.12, spinSpeed: 0.62, phase: 1.52, labelLift: 0.05 },
  },
  {
    id: "earth",
    label: "Earth",
    title: "EARTH",
    info: "Earth is our home planet and the only known world with abundant liquid water on its surface.",
    hint: "It completes one orbit around the Sun every year.",
    aliases: ["earth", "tierra"],
    orbit: { radius: 0.176, size: 0.02, speed: 0.88, spinSpeed: 0.94, phase: 2.42, labelLift: 0.056 },
  },
  {
    id: "mars",
    label: "Mars",
    title: "MARS",
    info: "Mars is called the red planet because iron-rich dust gives its surface a reddish color.",
    hint: "Scientists study Mars for signs of past water.",
    aliases: ["mars", "marte"],
    orbit: { radius: 0.234, size: 0.016, speed: 0.72, spinSpeed: 0.78, phase: 0.92, labelLift: 0.052 },
  },
  {
    id: "jupiter",
    label: "Jupiter",
    title: "JUPITER",
    info: "Jupiter is the largest planet in the solar system and is famous for its Great Red Spot storm.",
    hint: "It is a gas giant with many moons.",
    aliases: ["jupiter"],
    orbit: { radius: 0.348, size: 0.044, speed: 0.38, spinSpeed: 0.68, phase: 1.16, labelLift: 0.088 },
  },
  {
    id: "saturn",
    label: "Saturn",
    title: "SATURN",
    info: "Saturn is a gas giant surrounded by wide bright rings made of ice and rock.",
    hint: "Its ring system is the most recognizable in the solar system.",
    aliases: ["saturn", "saturno"],
    orbit: {
      radius: 0.448,
      size: 0.038,
      speed: 0.28,
      spinSpeed: 0.6,
      phase: 2.66,
      labelLift: 0.084,
      ringInner: 0.056,
      ringOuter: 0.084,
      ringTilt: { x: 1.14, y: 0.18, z: 0.22 },
    },
  },
  {
    id: "uranus",
    label: "Uranus",
    title: "URANUS",
    info: "Uranus is an ice giant that rotates at a very strong tilt.",
    hint: "It almost looks like it rolls around the Sun.",
    aliases: ["uranus"],
    orbit: { radius: 0.544, size: 0.028, speed: 0.2, spinSpeed: 0.42, phase: 0.52, labelLift: 0.07 },
  },
  {
    id: "neptune",
    label: "Neptune",
    title: "NEPTUNE",
    info: "Neptune is the farthest major planet from the Sun and is known for powerful winds.",
    hint: "It is a deep-blue ice giant.",
    aliases: ["neptune", "neptuno"],
    orbit: { radius: 0.632, size: 0.027, speed: 0.16, spinSpeed: 0.4, phase: 1.92, labelLift: 0.068 },
  },
].map((body, index) => ({
  ...body,
  number: index + 1,
  layout: {
    position: [body.orbit.radius, 0, 0],
    size: Math.max(body.orbit.size * 3.2, 0.08),
    labelLift: body.orbit.labelLift,
  },
}));

const BODY_FALLBACK_COLORS = {
  sun: 0xffb347,
  mercury: 0xb8a89d,
  venus: 0xe3c98f,
  earth: 0x4e8dff,
  mars: 0xc96b45,
  jupiter: 0xd8b08b,
  saturn: 0xd9c27d,
  uranus: 0x79d7df,
  neptune: 0x537dff,
};

const DIRECT_PLANET_SCALE_FACTORS = {
  sun: 1.14,
  mercury: 1.38,
  venus: 1.34,
  earth: 1.34,
  mars: 1.36,
  jupiter: 1.24,
  saturn: 1.22,
  uranus: 1.3,
  neptune: 1.3,
};

const copy = {
  appEyebrow: "AR Learn live scan",
  appTitle: "SOLAR SYSTEM",
  rotate: "Rotate",
  scale: "Scale",
  labels: "Labels On/Off",
  statusStarting: "Starting camera...",
  statusLoading: "Loading solar model...",
  statusReady: "Camera ready",
  statusTracking: "Solar system locked",
  statusSearching: "Point the camera at the QR code",
  statusHoldSteady: "Hold the QR steady for a moment...",
  statusCameraError: "Camera access was denied.",
  statusModelError: "The solar model could not be loaded.",
  focusTag: "Selected planet",
};

const defaultConfig = {
  assets: {
    models: {
      solar: {
        path: MODEL_PATH,
        targetSize: 1.75,
        enhanceDirectModel: false,
        animationClipName: "solar system",
        animationTimeScale: 0.3,
        position: { x: 0.44, y: 0.36, z: 0.03 },
        rotation: { x: 1.5708, y: 0, z: 0 },
      },
    },
  },
  settings: {
    arScale: 1.75,
  },
};
