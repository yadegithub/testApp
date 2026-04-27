// ==========================================
// 1. CONFIGURATION ET UI
// ==========================================
const UI = {  
    video: document.getElementById("videoInput"),  
    status: document.getElementById("status"),  
    canvasOutput: document.getElementById("canvasOutput"),  
    canvasThree: document.getElementById("canvasThree")
};  

let src, cap, qrDetector, camMatrix, distCoeffs, rvec, tvec, rotMatr, objectPoints;  
let renderer, labelRenderer, scene, camera, arGroup, mainModel;
let AR_SCALE = 4.0; // Ajustez cette valeur pour la taille du pendule
const DEFAULT_MODEL_PATH = './assets/newtons_cradle (1).glb';

let currentMode = 'rotate'; 
let physicsLabels = []; 
let isDragging = false;
let prevPos = { x: 0, y: 0 };

// ==========================================
// 2. CHARGEMENT ET INITIALISATION
// ==========================================
window.addEventListener('resize', fitToScreen);  

function normalizeModelPath(modelPath) {
    if (!modelPath) return DEFAULT_MODEL_PATH;
    if (modelPath.startsWith('./') || modelPath.startsWith('../') || modelPath.includes('/')) {
        return modelPath;
    }
    return `./assets/${modelPath}`;
}

async function initProject() {
    UI.status.innerText = "Chargement du pendule...";
    try {
        // Tentative de lecture du config JSON
        const response = await fetch('./data.json');
        if (!response.ok) {
            throw new Error(`Impossible de charger data.json (${response.status})`);
        }
        const config = await response.json();
        AR_SCALE = config?.settings?.arScale || AR_SCALE;
        const path = normalizeModelPath(config?.assets?.models?.pendulum?.path);
        startAR(path);
    } catch (e) {
        // Si pas de JSON, on charge le fichier GLB directement
        startAR(DEFAULT_MODEL_PATH);
    }
}

function startAR(modelPath) {  
    navigator.mediaDevices.getUserMedia({  
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }  
    }).then(stream => {  
        UI.video.srcObject = stream;  
        UI.video.onloadedmetadata = () => {  
            UI.video.play();  
            UI.canvasOutput.width = UI.canvasThree.width = UI.video.videoWidth;
            UI.canvasOutput.height = UI.canvasThree.height = UI.video.videoHeight;
            fitToScreen();  
            
            // Attendre OpenCV
            const checkCV = () => {
                if (typeof cv !== "undefined" && cv.Mat) {
                    setupThreeJS(modelPath);
                    initOpenCV();
                    setupControls();
                    requestAnimationFrame(processFrame);
                } else { setTimeout(checkCV, 100); }
            };
            checkCV();
        };  
    }).catch(err => { UI.status.innerText = "Erreur CamÃ©ra"; });  
}  

// ==========================================
// 3. SCÃNE 3D (THREE.JS)
// ==========================================
function setupThreeJS(modelPath) {  
    renderer = new THREE.WebGLRenderer({ canvas: UI.canvasThree, alpha: true, antialias: true });  
    renderer.setSize(UI.video.width, UI.video.height, false);  
    
    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none'; 
    document.body.appendChild(labelRenderer.domElement);
    
    scene = new THREE.Scene();  
    camera = new THREE.PerspectiveCamera(45, UI.video.width / UI.video.height, 0.1, 1000);  
    
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
        
        // Ajout d'Ã©tiquettes propres au pendule
        addLabel("Pendule de Newton", 0, 1.5, 0);
        addLabel("Ãnergie CinÃ©tique", 0.7, 0.2, 0);
        
        UI.status.innerText = "PrÃªt : Scannez le QR Code";
        setupInteraction();
    }, undefined, (err) => {
        UI.status.innerText = "Erreur chargement modÃ¨le";
    });
}  

function addLabel(text, x, y, z) {
    const div = document.createElement('div');
    div.className = 'label-anatomie'; // Garde le style CSS existant
    div.textContent = text;
    const label = new THREE.CSS2DObject(div);
    label.position.set(x, y, z);
    arGroup.add(label);
    physicsLabels.push(label);
}

// ==========================================
// 4. CONTRÃLES ET INTERACTION
// ==========================================
function setupControls() {
    const btnRotate = document.getElementById("btn-rotate");
    const btnScale = document.getElementById("btn-scale");
    const labelToggle = document.getElementById("label-toggle");

    btnRotate.onclick = () => { 
        currentMode = 'rotate'; 
        btnRotate.classList.add('active'); 
        btnScale.classList.remove('active'); 
    };

    btnScale.onclick = () => { 
        currentMode = 'scale'; 
        btnScale.classList.add('active'); 
        btnRotate.classList.remove('active'); 
    };

    if (labelToggle) {
        labelToggle.onchange = (e) => {
            physicsLabels.forEach(l => l.element.style.opacity = e.target.checked ? "1" : "0");
        };
    }
}

function setupInteraction() {
    const start = (e) => {
        isDragging = true;
        const x = e.clientX || e.touches[0].clientX;
        const y = e.clientY || e.touches[0].clientY;
        prevPos = { x, y };
    };

    const move = (e) => {
        if (!isDragging || !mainModel) return;
        const x = e.clientX || e.touches[0].clientX;
        const y = e.clientY || e.touches[0].clientY;
        const dx = x - prevPos.x;
        const dy = y - prevPos.y;

        if (currentMode === 'rotate') {
            mainModel.rotation.y += dx * 0.01;
            mainModel.rotation.x += dy * 0.01;
        } else {
            const s = 1 - (dy * 0.005);
            mainModel.scale.multiplyScalar(s);
        }
        prevPos = { x, y };
    };

    UI.canvasThree.addEventListener('mousedown', start);
    UI.canvasThree.addEventListener('touchstart', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move);
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('touchend', () => isDragging = false);
}

// ==========================================
// 5. OPENCV TRACKING
// ==========================================
function initOpenCV() {  
    src = new cv.Mat(UI.video.height, UI.video.width, cv.CV_8UC4);  
    cap = new cv.VideoCapture(UI.video);  
    qrDetector = new cv.QRCodeDetector();  
    const f = Math.max(UI.video.width, UI.video.height);  
    camMatrix = cv.matFromArray(3, 3, cv.CV_64FC1, [f, 0, UI.video.width/2, 0, f, UI.video.height/2, 0, 0, 1]);  
    distCoeffs = new cv.Mat.zeros(5, 1, cv.CV_64FC1);  
    objectPoints = cv.matFromArray(4, 3, cv.CV_64FC1, [0,0,0, 1,0,0, 1,1,0, 0,1,0]);  
    rvec = new cv.Mat(); tvec = new cv.Mat(); rotMatr = new cv.Mat(3, 3, cv.CV_64FC1);  
    camera.projectionMatrix.set((2*f)/UI.video.width, 0, 0, 0, 0, (2*f)/UI.video.height, 0, 0, 0, 0, -1.002, -0.2, 0, 0, -1, 0);  
}  

function processFrame() {  
    cap.read(src);  
    cv.imshow("canvasOutput", src);  
    let points = new cv.Mat();  
    
    if (qrDetector.detect(src, points)) {  
        let imgPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
            points.data32F[0], points.data32F[1], points.data32F[2], points.data32F[3],
            points.data32F[4], points.data32F[5], points.data32F[6], points.data32F[7]
        ]);  
        
        if (cv.solvePnP(objectPoints, imgPts, camMatrix, distCoeffs, rvec, tvec)) {  
            cv.Rodrigues(rvec, rotMatr);  
            let r = rotMatr.data64F, t = tvec.data64F;  
            const m = new THREE.Matrix4();  
            m.set(  
                r[0]*AR_SCALE,  r[1]*AR_SCALE,  r[2]*AR_SCALE,  t[0],  
               -r[3]*AR_SCALE, -r[4]*AR_SCALE, -r[5]*AR_SCALE, -t[1],  
               -r[6]*AR_SCALE, -r[7]*AR_SCALE, -r[8]*AR_SCALE, -t[2],  
                0, 0, 0, 1  
            );  
            arGroup.matrix.copy(m); 
            arGroup.visible = true;  
        }  
        imgPts.delete();  
    } else { arGroup.visible = false; }  
    
    renderer.render(scene, camera);  
    labelRenderer.render(scene, camera); 
    points.delete();  
    requestAnimationFrame(processFrame);  
}  

function fitToScreen() {  
    const scale = Math.max(window.innerWidth / UI.video.videoWidth, window.innerHeight / UI.video.videoHeight);  
    [UI.canvasOutput, UI.canvasThree].forEach(c => {  
        c.style.width = (UI.video.videoWidth * scale) + "px";  
        c.style.height = (UI.video.videoHeight * scale) + "px";  
    });
    if (labelRenderer) labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

initProject();

