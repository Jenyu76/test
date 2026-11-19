// ==========================================
// Interactive 3D Cube Toy
// Pure Minimalist, Silent, Expressive
// 30% Smaller Size, Frantic Snappy Search Motion
// ==========================================

// Global Three.js State
let scene, camera, renderer;
let characterGroup, cubeMesh, shadowPlane;
let faceCanvas, faceCtx, faceTexture, faceMaterial;
let mouseX = 0, mouseY = 0;
let targetRotX = 0, targetRotY = 0;
let isMouseOffscreen = false;
let isDizzy = false;

// Physics / Jump Offset
let jumpOffset = 0;

// Clones & Bubble Gum
let clonesGroup = null;
let bubbleMesh = null;

// Click & Evolution State
const MAX_CLICKS = 10000;
let clickCount = parseInt(localStorage.getItem('wakey_clicks') || '0', 10);
let evolutionStage = parseInt(localStorage.getItem('wakey_stage') || '1', 10);
let baseCharacterColor = localStorage.getItem('wakey_color') || '#ff3b7c';
let characterScale = parseFloat(localStorage.getItem('wakey_scale') || '1.0');

// Rapid Click Progressive Rage State
let rageClicks = 0;
let calmDownTimer = null;
let isJumpscareActive = false;

// Long-press Charging State
let pressStartTime = 0;
let isCharging = false;
let chargeAnimFrame = null;

// Mouse Velocity Tracking
let lastMouseX = 0, lastMouseY = 0;
let mouseVelocity = 0;
let shakeScore = 0;

// Current Emotional State
let currentEmotion = 'happy';
let blinkTimer = null;

// DOM Elements
const container = document.getElementById('canvas-container');
const btnBoss = document.getElementById('btn-boss');
const stealthScreen = document.getElementById('stealth-screen');
const btnExitStealth = document.getElementById('btn-exit-stealth');
const evolutionContainer = document.getElementById('evolution-container');
const evolutionFill = document.getElementById('evolution-fill');
const clickCountText = document.getElementById('click-count');
const evolutionStageBadge = document.getElementById('evolution-stage');
const chargeIndicator = document.getElementById('charge-indicator');
const chargeProgressBar = document.getElementById('charge-progress');
const jumpscareOverlay = document.getElementById('jumpscare-overlay');
const jumpscareTitle = document.getElementById('jumpscare-title');

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
  initThree();
  initFaceTexture();
  buildCharacter();
  applySavedEvolution();
  updateEvolutionUI();
  setupEventListeners();
  startBlinkLoop();
  animate();
});

// ==========================================
// 1. Three.js Scene Setup
// ==========================================
function initThree() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0d0f18, 0.05);

  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
  camera.position.set(0, 0, 7.5);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffe6f0, 0.9);
  mainLight.position.set(5, 8, 6);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 1024;
  mainLight.shadow.mapSize.height = 1024;
  mainLight.shadow.bias = -0.001;
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0x7080ff, 0.4);
  fillLight.position.set(-5, -4, 4);
  scene.add(fillLight);

  // Soft Radial Drop Shadow (Sized to match smaller cube)
  const shadowGeo = new THREE.PlaneGeometry(2.6, 2.6);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.35,
    map: createRadialTexture()
  });
  shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.6;
  scene.add(shadowPlane);
}

function createRadialTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

// ==========================================
// 2. Procedural Dynamic Face Canvas
// ==========================================
function initFaceTexture() {
  faceCanvas = document.createElement('canvas');
  faceCanvas.width = 512;
  faceCanvas.height = 512;
  faceCtx = faceCanvas.getContext('2d');
  faceTexture = new THREE.CanvasTexture(faceCanvas);
  faceTexture.generateMipmaps = true;
  drawFace('happy');
}

function drawFace(emotion, lookOffset = { x: 0, y: 0 }) {
  currentEmotion = emotion;
  const ctx = faceCtx;
  const w = 512, h = 512;

  if (emotion === 'furious') {
    ctx.fillStyle = '#ff1744';
  } else if (emotion === 'annoyed') {
    ctx.fillStyle = '#ff6b8b';
  } else {
    ctx.fillStyle = baseCharacterColor;
  }
  ctx.fillRect(0, 0, w, h);

  // Rosy Cheeks
  ctx.fillStyle = 'rgba(255, 120, 160, 0.7)';
  ctx.beginPath();
  ctx.ellipse(110 + lookOffset.x * 15, 330, 42, 24, 0, 0, Math.PI * 2);
  ctx.ellipse(402 + lookOffset.x * 15, 330, 42, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#11131c';
  ctx.strokeStyle = '#11131c';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const eyeLeftX = 160 + lookOffset.x * 35;
  const eyeRightX = 352 + lookOffset.x * 35;
  const eyeY = 240 + lookOffset.y * 30;

  if (emotion === 'happy') {
    drawGleamEye(ctx, eyeLeftX, eyeY, 32);
    drawGleamEye(ctx, eyeRightX, eyeY, 32);

    ctx.beginPath();
    ctx.arc(256 + lookOffset.x * 20, 310 + lookOffset.y * 15, 48, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

  } else if (emotion === 'blink') {
    ctx.beginPath();
    ctx.arc(eyeLeftX, eyeY + 10, 30, 1.1 * Math.PI, 1.9 * Math.PI);
    ctx.arc(eyeRightX, eyeY + 10, 30, 1.1 * Math.PI, 1.9 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(256, 320, 36, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

  } else if (emotion === 'annoyed') {
    ctx.beginPath();
    ctx.moveTo(eyeLeftX - 30, eyeY + 15);
    ctx.lineTo(eyeLeftX + 30, eyeY - 5);
    ctx.stroke();

    drawGleamEye(ctx, eyeRightX, eyeY, 28);

    ctx.beginPath();
    ctx.moveTo(210, 330);
    ctx.quadraticCurveTo(235, 350, 256, 330);
    ctx.quadraticCurveTo(277, 310, 302, 330);
    ctx.stroke();

    ctx.fillStyle = '#00c3ff';
    ctx.beginPath();
    ctx.moveTo(90, 170);
    ctx.bezierCurveTo(70, 195, 70, 225, 90, 225);
    ctx.bezierCurveTo(110, 225, 110, 195, 90, 170);
    ctx.fill();

  } else if (emotion === 'furious') {
    ctx.beginPath();
    ctx.moveTo(100, 185);
    ctx.lineTo(215, 235);
    ctx.moveTo(412, 185);
    ctx.lineTo(297, 235);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeLeftX, eyeY + 10, 26, 0, Math.PI * 2);
    ctx.arc(eyeRightX, eyeY + 10, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(eyeLeftX, eyeY + 10, 12, 0, Math.PI * 2);
    ctx.arc(eyeRightX, eyeY + 10, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.rect(206, 315, 100, 40);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(236, 315); ctx.lineTo(236, 355);
    ctx.moveTo(256, 315); ctx.lineTo(256, 355);
    ctx.moveTo(276, 315); ctx.lineTo(276, 355);
    ctx.stroke();

    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(380, 130, 20, 0.2, 1.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(420, 130, 20, 1.2, 2.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(400, 110, 20, 2.2, 3.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(400, 150, 20, 3.2, 4.8); ctx.stroke();

  } else if (emotion === 'sad') {
    drawSadEye(ctx, eyeLeftX - 10, eyeY + 10, 34);
    drawSadEye(ctx, eyeRightX + 10, eyeY + 10, 34);

    ctx.beginPath();
    ctx.arc(256 + lookOffset.x * 10, 370, 38, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#8ce8ff';
    ctx.beginPath();
    ctx.arc(eyeRightX + 30, eyeY + 60, 10, 0, Math.PI * 2);
    ctx.fill();

  } else if (emotion === 'dizzy') {
    drawSpiral(ctx, eyeLeftX, eyeY, 34);
    drawSpiral(ctx, eyeRightX, eyeY, 34);

    ctx.beginPath();
    ctx.moveTo(210, 330);
    ctx.quadraticCurveTo(235, 310, 256, 330);
    ctx.quadraticCurveTo(277, 350, 302, 330);
    ctx.stroke();

  } else if (emotion === 'surprised') {
    drawSurprisedEye(ctx, eyeLeftX, eyeY, 38);
    drawSurprisedEye(ctx, eyeRightX, eyeY, 38);

    ctx.fillStyle = '#11131c';
    ctx.beginPath();
    ctx.ellipse(256, 340, 28, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff7b9f';
    ctx.beginPath();
    ctx.ellipse(256, 354, 18, 16, 0, 0, Math.PI * 2);
    ctx.fill();

  } else if (emotion === 'sunglasses') {
    ctx.fillStyle = '#05070a';
    ctx.fillRect(90, 200, 150, 75);
    ctx.fillRect(272, 200, 150, 75);
    ctx.fillRect(230, 225, 50, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(110, 215, 25, 20);
    ctx.fillRect(292, 215, 25, 20);

    ctx.beginPath();
    ctx.arc(260, 330, 42, 0.1 * Math.PI, 0.7 * Math.PI);
    ctx.stroke();

  } else if (emotion === 'heart') {
    drawHeart(ctx, eyeLeftX, eyeY - 10, 45);
    drawHeart(ctx, eyeRightX, eyeY - 10, 45);

    ctx.beginPath();
    ctx.arc(238, 330, 20, 0, Math.PI);
    ctx.arc(274, 330, 20, 0, Math.PI);
    ctx.stroke();

  } else if (emotion === 'sleep') {
    ctx.beginPath();
    ctx.moveTo(eyeLeftX - 30, eyeY + 15);
    ctx.lineTo(eyeLeftX + 30, eyeY + 15);
    ctx.moveTo(eyeRightX - 30, eyeY + 15);
    ctx.lineTo(eyeRightX + 30, eyeY + 15);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(256, 330, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = "bold 44px 'Nunito', sans-serif";
    ctx.fillStyle = "#818cf8";
    ctx.fillText("Zzz...", 340, 150);

  } else if (emotion === 'gum_splat') {
    drawGleamEye(ctx, eyeLeftX, eyeY, 30);
    drawGleamEye(ctx, eyeRightX, eyeY, 30);
    ctx.fillStyle = '#ff80bf';
    ctx.beginPath();
    ctx.arc(256, 310, 65, 0, Math.PI * 2);
    ctx.fill();
  }

  faceTexture.needsUpdate = true;
}

function drawGleamEye(ctx, x, y, radius) {
  ctx.fillStyle = '#11131c';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + radius * 0.35, y + radius * 0.3, radius * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

function drawSadEye(ctx, x, y, radius) {
  ctx.fillStyle = '#11131c';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - radius * 0.2, y - radius * 0.3, radius * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function drawSurprisedEye(ctx, x, y, radius) {
  ctx.fillStyle = '#11131c';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.38, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpiral(ctx, x, y, radius) {
  ctx.save();
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let i = 0; i < 40; i++) {
    const angle = 0.3 * i;
    const r = (radius / 40) * i;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function drawHeart(ctx, x, y, size) {
  ctx.fillStyle = '#ff1493';
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(x, y + topCurveHeight);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
  ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
  ctx.closePath();
  ctx.fill();
}

// ==========================================
// 3. Build Character 3D Geometry (30% Smaller: 1.55 instead of 2.2)
// ==========================================
function buildCharacter() {
  characterGroup = new THREE.Group();
  scene.add(characterGroup);

  // 30% Smaller Geometry (1.55 x 1.55 x 1.55)
  const geometry = new THREE.BoxGeometry(1.55, 1.55, 1.55, 6, 6, 6);
  faceMaterial = new THREE.MeshLambertMaterial({ map: faceTexture, roughness: 0.3 });

  rebuildCubeMaterials();

  cubeMesh = new THREE.Mesh(geometry, cubeMeshMaterials);
  cubeMesh.castShadow = true;
  characterGroup.add(cubeMesh);

  clonesGroup = new THREE.Group();
  characterGroup.add(clonesGroup);

  // Scaled Bubble Gum
  const bubbleGeo = new THREE.SphereGeometry(0.35, 32, 32);
  const bubbleMat = new THREE.MeshPhongMaterial({
    color: 0xff66b2,
    transparent: true,
    opacity: 0.85,
    shininess: 100
  });
  bubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
  bubbleMesh.position.set(0, -0.15, 0.85);
  bubbleMesh.scale.set(0.001, 0.001, 0.001);
  bubbleMesh.visible = false;
  characterGroup.add(bubbleMesh);
}

let cubeMeshMaterials = [];

function rebuildCubeMaterials(customColor = null) {
  const colorHex = customColor || baseCharacterColor;
  const col = new THREE.Color(colorHex);

  const sideCol = col.clone().offsetHSL(0, 0, -0.1);
  const topCol = col.clone().offsetHSL(0, 0, 0.1);
  const botCol = col.clone().offsetHSL(0, 0, -0.2);

  const bodyMaterial = new THREE.MeshLambertMaterial({ color: col, roughness: 0.3 });
  const sideMaterial = new THREE.MeshLambertMaterial({ color: sideCol, roughness: 0.4 });
  const topMaterial = new THREE.MeshLambertMaterial({ color: topCol, roughness: 0.3 });
  const bottomMaterial = new THREE.MeshLambertMaterial({ color: botCol, roughness: 0.5 });

  cubeMeshMaterials = [
    sideMaterial, sideMaterial, topMaterial, bottomMaterial, faceMaterial, bodyMaterial
  ];

  if (cubeMesh) {
    cubeMesh.material = cubeMeshMaterials;
  }
}

function applySavedEvolution() {
  rebuildCubeMaterials();
  characterGroup.scale.set(characterScale, characterScale, characterScale);
  drawFace('happy');
}

// ==========================================
// 4. 10,000 Clicks Evolution System
// ==========================================
function registerClick() {
  clickCount++;
  localStorage.setItem('wakey_clicks', clickCount.toString());
  updateEvolutionUI();

  if (clickCount >= MAX_CLICKS * evolutionStage) {
    triggerEvolution();
  }
}

function updateEvolutionUI() {
  const currentTierClicks = clickCount % MAX_CLICKS;
  const percent = Math.min(100, (currentTierClicks / MAX_CLICKS) * 100);

  evolutionFill.style.width = percent + '%';
  clickCountText.textContent = clickCount.toLocaleString();
  evolutionStageBadge.textContent = `Lv.${evolutionStage}`;
}

function triggerEvolution() {
  evolutionStage++;
  localStorage.setItem('wakey_stage', evolutionStage.toString());

  const colorPool = [
    '#00f0ff', '#a855f7', '#22c55e', '#f97316', '#eab308',
    '#3b82f6', '#ef4444', '#14b8a6', '#ec4899', '#ffffff'
  ];
  baseCharacterColor = colorPool[Math.floor(Math.random() * colorPool.length)];
  localStorage.setItem('wakey_color', baseCharacterColor);

  const scalePool = [0.8, 0.95, 1.15, 1.35, 1.5];
  characterScale = scalePool[Math.floor(Math.random() * scalePool.length)];
  localStorage.setItem('wakey_scale', characterScale.toString());

  drawFace('surprised');

  gsap.to(characterGroup.rotation, {
    y: "+=" + (Math.PI * 8),
    x: "+=" + (Math.PI * 4),
    duration: 2.2,
    ease: 'power3.inOut',
    onComplete: () => {
      applySavedEvolution();
      drawFace('happy');
    }
  });

  gsap.to(characterGroup.scale, {
    x: characterScale * 1.5,
    y: characterScale * 0.6,
    z: characterScale * 1.5,
    duration: 1.1,
    yoyo: true,
    repeat: 1,
    ease: 'power2.inOut',
    onComplete: () => {
      gsap.to(characterGroup.scale, {
        x: characterScale,
        y: characterScale,
        z: characterScale,
        duration: 0.5,
        ease: 'elastic.out(1, 0.4)'
      });
    }
  });

  if (window.confetti) {
    confetti({ particleCount: 150, spread: 120, origin: { y: 0.5 } });
  }
}

// ==========================================
// 5. Progressive Rage (30 Clicks) & 3s Calm Down
// ==========================================
function handleProgressiveRageClick() {
  rageClicks++;

  if (calmDownTimer) clearTimeout(calmDownTimer);
  calmDownTimer = setTimeout(calmDown, 3000);

  if (rageClicks >= 30) {
    rageClicks = 0;
    triggerFoxyJumpscare();
  } else if (rageClicks >= 20) {
    drawFace('furious');
    cubeMesh.position.x = (Math.random() - 0.5) * 0.18;
    cubeMesh.position.y = (Math.random() - 0.5) * 0.18;
  } else if (rageClicks >= 10) {
    drawFace('annoyed');
  } else {
    drawFace('surprised');
  }
}

function calmDown() {
  if (rageClicks === 0) return;
  rageClicks = 0;
  cubeMesh.position.set(0, 0, 0);
  drawFace('happy');
}

function triggerFoxyJumpscare() {
  if (isJumpscareActive) return;
  isJumpscareActive = true;

  const phrases = [
    "살살 만지세요!",
    "천천히 찌르세요!",
    "그만하세요!!",
    "아프다고요!!",
    "건드리지 마세요!!"
  ];
  jumpscareTitle.textContent = phrases[Math.floor(Math.random() * phrases.length)];

  jumpscareOverlay.classList.remove('hidden');

  gsap.to(document.body, {
    x: "+=12",
    y: "+=8",
    duration: 0.05,
    repeat: 25,
    yoyo: true,
    ease: 'none',
    onComplete: () => {
      document.body.style.transform = 'none';
    }
  });

  setTimeout(() => {
    jumpscareOverlay.classList.add('hidden');
    isJumpscareActive = false;
    cubeMesh.position.set(0, 0, 0);
    drawFace('happy');
  }, 1900);
}

// ==========================================
// 6. 8 Random Mystery Interactions (롱클릭)
// ==========================================
function triggerRandomMysteryInteraction() {
  const events = [
    'sunglasses',
    'gold',
    'bubble_gum',
    'clones',
    'super_saiyan',
    'heart_love',
    'rocket_jump',
    'fake_sleep'
  ];
  const chosen = events[Math.floor(Math.random() * events.length)];

  if (chosen === 'sunglasses') {
    drawFace('sunglasses');
    gsap.to(characterGroup.rotation, {
      y: "+=" + (Math.PI * 4),
      duration: 1.2,
      ease: 'power2.inOut',
      onComplete: () => {
        setTimeout(() => { if (!isMouseOffscreen) drawFace('happy'); }, 4000);
      }
    });

  } else if (chosen === 'gold') {
    const goldMat = new THREE.MeshPhongMaterial({ color: 0xffd700, shininess: 120, specular: 0xffffff });
    cubeMesh.material = goldMat;

    if (window.confetti) {
      confetti({ particleCount: 50, spread: 70, colors: ['#ffd700', '#ffae00', '#fff8b3'] });
    }

    setTimeout(() => {
      rebuildCubeMaterials();
      drawFace('happy');
    }, 4500);

  } else if (chosen === 'bubble_gum') {
    drawFace('surprised');
    bubbleMesh.visible = true;
    bubbleMesh.scale.set(0.1, 0.1, 0.1);

    gsap.to(bubbleMesh.scale, {
      x: 1.6, y: 1.6, z: 1.6, duration: 2, ease: 'power1.in',
      onComplete: () => {
        bubbleMesh.visible = false;
        drawFace('gum_splat');
        setTimeout(() => { if (!isMouseOffscreen) drawFace('happy'); }, 3500);
      }
    });

  } else if (chosen === 'clones') {
    spawnMiniClones();

  } else if (chosen === 'super_saiyan') {
    drawFace('dizzy');
    let flashCount = 0;
    const flashInterval = setInterval(() => {
      document.body.style.backgroundColor = flashCount % 2 === 0 ? '#ffea00' : '#0d0f18';
      flashCount++;
      if (flashCount > 10) {
        clearInterval(flashInterval);
        document.body.style.backgroundColor = '#0d0f18';
        drawFace('happy');
      }
    }, 90);

  } else if (chosen === 'heart_love') {
    drawFace('heart');
    let heartBounce = { y: 0 };
    gsap.to(heartBounce, {
      y: 0.6,
      yoyo: true,
      repeat: 5,
      duration: 0.22,
      ease: 'sine.inOut',
      onUpdate: () => { jumpOffset = heartBounce.y; },
      onComplete: () => {
        jumpOffset = 0;
        setTimeout(() => { if (!isMouseOffscreen) drawFace('happy'); }, 2000);
      }
    });

    if (window.confetti) {
      confetti({ particleCount: 45, spread: 80, colors: ['#ff1493', '#ff69b4', '#ffb6c1'] });
    }

  } else if (chosen === 'rocket_jump') {
    drawFace('surprised');
    let rocketTracker = { y: 0 };

    gsap.timeline()
      .to(rocketTracker, {
        y: 18,
        duration: 0.7,
        ease: 'power2.in',
        onUpdate: () => { jumpOffset = rocketTracker.y; }
      })
      .to(rocketTracker, {
        y: 0,
        duration: 0.5,
        ease: 'bounce.out',
        onUpdate: () => { jumpOffset = rocketTracker.y; },
        onComplete: () => {
          jumpOffset = 0;
          drawFace('happy');
          gsap.to(document.body, {
            x: 8, y: -8, duration: 0.04, repeat: 5, yoyo: true,
            onComplete: () => { document.body.style.transform = 'none'; }
          });
        }
      });

  } else if (chosen === 'fake_sleep') {
    drawFace('sleep');

    gsap.to(characterGroup.rotation, {
      x: 0.6,
      duration: 1.2,
      ease: 'power1.out',
      onComplete: () => {
        setTimeout(() => {
          drawFace('surprised');
          characterGroup.rotation.x = 0;
          setTimeout(() => { if (!isMouseOffscreen) drawFace('happy'); }, 2500);
        }, 1500);
      }
    });
  }
}

function spawnMiniClones() {
  while (clonesGroup.children.length > 0) {
    clonesGroup.remove(clonesGroup.children[0]);
  }

  const cloneGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const cloneMat = new THREE.MeshLambertMaterial({ color: baseCharacterColor });

  for (let i = 0; i < 3; i++) {
    const clone = new THREE.Mesh(cloneGeo, cloneMat);
    const angle = (i / 3) * Math.PI * 2;
    clone.position.set(Math.cos(angle) * 2.0, Math.sin(angle) * 0.6, Math.sin(angle) * 2.0);
    clonesGroup.add(clone);
  }

  gsap.to(clonesGroup.rotation, {
    y: "+=" + (Math.PI * 6),
    duration: 5,
    ease: 'power1.inOut',
    onComplete: () => {
      while (clonesGroup.children.length > 0) {
        clonesGroup.remove(clonesGroup.children[0]);
      }
    }
  });
}

// ==========================================
// 7. Natural Blinking Loop
// ==========================================
function startBlinkLoop() {
  const nextBlink = Math.random() * 3500 + 2000;
  blinkTimer = setTimeout(() => {
    if (!isMouseOffscreen && !isDizzy && currentEmotion === 'happy' && rageClicks === 0) {
      drawFace('blink');
      setTimeout(() => {
        if (!isMouseOffscreen && !isDizzy && currentEmotion === 'blink' && rageClicks === 0) {
          drawFace('happy');
        }
      }, 180);
    }
    startBlinkLoop();
  }, nextBlink);
}

// ==========================================
// 8. User Event Listeners
// ==========================================
function setupEventListeners() {
  window.addEventListener('mousemove', (e) => {
    const normX = (e.clientX / window.innerWidth) * 2 - 1;
    const normY = -(e.clientY / window.innerHeight) * 2 + 1;

    mouseX = normX;
    mouseY = normY;

    targetRotY = mouseX * 0.75;
    targetRotX = -mouseY * 0.6;

    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    mouseVelocity = dist;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    if (dist > 50) {
      shakeScore += 2;
      if (shakeScore > 35 && !isDizzy && rageClicks === 0) {
        triggerDizzyMode();
      }
    } else {
      shakeScore = Math.max(0, shakeScore - 0.4);
    }

    if (isMouseOffscreen) {
      handleMouseReturn();
    }
  });

  document.addEventListener('mouseleave', handleMouseLeave);
  window.addEventListener('blur', handleMouseLeave);
  document.addEventListener('mouseenter', handleMouseReturn);

  // Long-press Charging Logic & Click Handling
  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#ui-overlay') || e.target.closest('#stealth-screen') || e.target.closest('#jumpscare-overlay')) return;

    pressStartTime = Date.now();
    isCharging = true;

    chargeIndicator.classList.remove('hidden');
    chargeProgressBar.style.strokeDashoffset = '264';

    const chargeDuration = 1000;

    function updateCharge() {
      if (!isCharging) return;
      const elapsed = Date.now() - pressStartTime;
      const ratio = Math.min(1, elapsed / chargeDuration);
      chargeProgressBar.style.strokeDashoffset = (264 - (ratio * 264)).toString();

      cubeMesh.position.x = (Math.random() - 0.5) * ratio * 0.12;
      cubeMesh.position.y = (Math.random() - 0.5) * ratio * 0.12;

      if (ratio < 1) {
        chargeAnimFrame = requestAnimationFrame(updateCharge);
      }
    }
    chargeAnimFrame = requestAnimationFrame(updateCharge);
  });

  window.addEventListener('pointerup', (e) => {
    if (!isCharging) return;
    const pressDuration = Date.now() - pressStartTime;
    isCharging = false;
    cancelAnimationFrame(chargeAnimFrame);
    chargeIndicator.classList.add('hidden');
    cubeMesh.position.set(0, 0, 0);

    if (pressDuration >= 1000) {
      triggerRandomMysteryInteraction();
    } else {
      registerClick();
      handleProgressiveRageClick();

      gsap.killTweensOf(cubeMesh.scale);
      gsap.to(cubeMesh.scale, {
        x: 1.3, y: 0.75, z: 1.3, duration: 0.12, ease: 'power2.out',
        onComplete: () => {
          gsap.to(cubeMesh.scale, {
            x: 0.85, y: 1.25, z: 0.85, duration: 0.25, ease: 'elastic.out(1, 0.4)',
            onComplete: () => {
              gsap.to(cubeMesh.scale, { x: 1, y: 1, z: 1, duration: 0.35, ease: 'elastic.out(1, 0.5)' });
              if (!isMouseOffscreen && !isDizzy && rageClicks === 0) {
                drawFace('happy');
              }
            }
          });
        }
      });
    }
  });

  // Boss Key Handlers
  btnBoss.addEventListener('click', toggleStealth);
  btnExitStealth.addEventListener('click', toggleStealth);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.code === 'Space') {
      e.preventDefault();
      toggleStealth();
    }
    // Test Cheat Key: '+' or '=' adds +1,000 clicks
    if (e.key === '+' || e.key === '=') {
      clickCount += 1000;
      localStorage.setItem('wakey_clicks', clickCount.toString());
      updateEvolutionUI();
      if (clickCount >= MAX_CLICKS * evolutionStage) {
        triggerEvolution();
      }
    }
  });

  // Test Cheat: Clicking on Evolution Bar adds +1,000 clicks
  evolutionContainer.addEventListener('click', () => {
    clickCount += 1000;
    localStorage.setItem('wakey_clicks', clickCount.toString());
    updateEvolutionUI();
    if (clickCount >= MAX_CLICKS * evolutionStage) {
      triggerEvolution();
    }
  });

  window.addEventListener('resize', onWindowResize);
}

// ==========================================
// Frantic Snappy "Where did you go?!" Look Around Motion
// ==========================================
function handleMouseLeave() {
  if (isMouseOffscreen) return;
  isMouseOffscreen = true;

  drawFace('sad');

  gsap.killTweensOf(characterGroup.rotation);

  // Snappy, curious, dynamic searching glances in all directions!
  const lookTimeline = gsap.timeline({ repeat: -1 });
  lookTimeline
    // 1. Snappy glance to far left with head tilt
    .to(characterGroup.rotation, { y: -1.2, x: 0.25, z: 0.3, duration: 0.22, ease: 'power2.out' })
    .to({}, { duration: 0.35 }) // hold glance
    // 2. Whip head over to far right!
    .to(characterGroup.rotation, { y: 1.25, x: 0.2, z: -0.3, duration: 0.26, ease: 'power2.out' })
    .to({}, { duration: 0.35 }) // hold glance
    // 3. Quick glance up high
    .to(characterGroup.rotation, { y: -0.25, x: -0.7, z: 0.1, duration: 0.2, ease: 'power2.out' })
    .to({}, { duration: 0.25 })
    // 4. Look down bottom right
    .to(characterGroup.rotation, { y: 0.9, x: 0.6, z: -0.2, duration: 0.22, ease: 'power2.out' })
    .to({}, { duration: 0.3 })
    // 5. Frantic double take back to left
    .to(characterGroup.rotation, { y: -1.0, x: 0.1, z: 0.25, duration: 0.18, ease: 'power2.out' })
    .to({}, { duration: 0.35 });
}

function handleMouseReturn() {
  if (!isMouseOffscreen) return;
  isMouseOffscreen = false;

  gsap.killTweensOf(characterGroup.rotation);
  drawFace('happy');

  let returnJump = { y: 0 };
  gsap.to(returnJump, {
    y: 1.2, duration: 0.26, ease: 'power2.out', yoyo: true, repeat: 1,
    onUpdate: () => { jumpOffset = returnJump.y; },
    onComplete: () => { jumpOffset = 0; }
  });

  gsap.to(characterGroup.rotation, {
    z: "+=" + (Math.PI * 2), duration: 0.55, ease: 'back.out(1.5)'
  });

  if (window.confetti) {
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
  }
}

function triggerDizzyMode() {
  isDizzy = true;
  drawFace('dizzy');

  gsap.to(characterGroup.rotation, {
    z: "+=0.4",
    duration: 0.08,
    repeat: 15,
    yoyo: true,
    ease: 'none',
    onComplete: () => {
      isDizzy = false;
      shakeScore = 0;
      if (!isMouseOffscreen && rageClicks === 0) {
        drawFace('happy');
      }
    }
  });
}

function toggleStealth() {
  const isHidden = stealthScreen.classList.contains('hidden');
  if (isHidden) {
    stealthScreen.classList.remove('hidden');
    document.title = "2026-2학기_핵심_수업_정리노트.docx";
  } else {
    stealthScreen.classList.add('hidden');
    document.title = "...";
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ==========================================
// 9. Animation Loop
// ==========================================
let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  const baseHoverY = isMouseOffscreen ? Math.sin(time * 1.5) * 0.1 - 0.15 : Math.sin(time * 2.5) * 0.15;
  characterGroup.position.y = baseHoverY + jumpOffset;

  if (!isMouseOffscreen) {
    shadowPlane.scale.setScalar(Math.max(0.2, 1 - (characterGroup.position.y) * 0.18));

    characterGroup.rotation.x += (targetRotX - characterGroup.rotation.x) * 0.1;
    characterGroup.rotation.y += (targetRotY - characterGroup.rotation.y) * 0.1;

    const targetTilt = mouseX * -0.15;
    characterGroup.rotation.z += (targetTilt - characterGroup.rotation.z) * 0.1;
  } else {
    shadowPlane.scale.setScalar(0.85);
  }

  renderer.render(scene, camera);
}
