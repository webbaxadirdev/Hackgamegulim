// Tilt Maze + Levels + Timer + Best Score + Sound + PWA + CMatrix background
// Works best on HTTPS (GitHub Pages). iOS requires DeviceOrientation permission from a user gesture.

/* ----------------------------- DOM helpers ----------------------------- */
const $ = (s)=>document.querySelector(s);
const cv = $("#cv");
const ctx = cv.getContext("2d");

const sLevel = $("#sLevel");
const sTime  = $("#sTime");
const sBest  = $("#sBest");
const sStatus= $("#sStatus");
const sGamma = $("#sGamma");
const sBeta  = $("#sBeta");
const sMoves = $("#sMoves");
const sFps   = $("#sFps");
const toast  = $("#toast");

const btnStart = $("#btnStart");
const btnReset = $("#btnReset");
const btnCal   = $("#btnCal");
const btnMute  = $("#btnMute");
const btnInstall = $("#btnInstall");

/* ----------------------------- game config ----------------------------- */
let W=0, H=0, DPR=1;

const BALL = {
  r: 12,
  x: 60, y: 60,
  vx: 0, vy: 0
};

let running = false;
let moves = 0;

let lastGamma = 0, lastBeta = 0;
let offsetGamma = 0, offsetBeta = 0;

// physics
const ACCEL = 0.20;
const FRICTION = 0.92;
const MAX_SPEED = 9.5;

// levels (normalized 0..1 rectangles). Keep borders in every level.
const BORDER = [
  {x:0.00,y:0.00,w:1.00,h:0.03},
  {x:0.00,y:0.97,w:1.00,h:0.03},
  {x:0.00,y:0.00,w:0.03,h:1.00},
  {x:0.97,y:0.00,w:0.03,h:1.00},
];

const LEVELS = [
  {
    name: "Level 1",
    walls: [
      ...BORDER,
      {x:0.08,y:0.10,w:0.62,h:0.03},
      {x:0.08,y:0.10,w:0.03,h:0.22},
      {x:0.18,y:0.20,w:0.60,h:0.03},
      {x:0.78,y:0.20,w:0.03,h:0.22},
      {x:0.18,y:0.30,w:0.03,h:0.18},
      {x:0.18,y:0.48,w:0.42,h:0.03},
      {x:0.60,y:0.38,w:0.03,h:0.13},
      {x:0.60,y:0.30,w:0.28,h:0.03},
      {x:0.10,y:0.60,w:0.70,h:0.03},
      {x:0.10,y:0.60,w:0.03,h:0.22},
      {x:0.22,y:0.72,w:0.03,h:0.20},
      {x:0.22,y:0.72,w:0.55,h:0.03},
      {x:0.77,y:0.72,w:0.03,h:0.18},
      {x:0.52,y:0.84,w:0.20,h:0.03},
      {x:0.52,y:0.84,w:0.03,h:0.10},
    ],
    start: {x:0.08,y:0.08},
    finish: {x:0.88,y:0.88,w:0.07,h:0.07},
  },
  {
    name: "Level 2",
    walls: [
      ...BORDER,
      {x:0.06,y:0.12,w:0.76,h:0.03},
      {x:0.06,y:0.12,w:0.03,h:0.22},
      {x:0.18,y:0.24,w:0.76,h:0.03},
      {x:0.91,y:0.24,w:0.03,h:0.22},
      {x:0.18,y:0.36,w:0.03,h:0.22},
      {x:0.18,y:0.58,w:0.62,h:0.03},
      {x:0.80,y:0.44,w:0.03,h:0.17},
      {x:0.30,y:0.44,w:0.50,h:0.03},
      {x:0.08,y:0.70,w:0.75,h:0.03},
      {x:0.08,y:0.70,w:0.03,h:0.20},
      {x:0.20,y:0.82,w:0.55,h:0.03},
      {x:0.72,y:0.82,w:0.03,h:0.12},
      {x:0.40,y:0.28,w:0.03,h:0.22},
      {x:0.52,y:0.36,w:0.03,h:0.22},
    ],
    start: {x:0.07,y:0.90},
    finish: {x:0.88,y:0.08,w:0.07,h:0.07},
  },
  {
    name: "Level 3",
    walls: [
      ...BORDER,
      {x:0.10,y:0.10,w:0.80,h:0.03},
      {x:0.10,y:0.10,w:0.03,h:0.76},
      {x:0.10,y:0.83,w:0.80,h:0.03},
      {x:0.87,y:0.20,w:0.03,h:0.66},
      // inner zig-zag
      {x:0.22,y:0.22,w:0.62,h:0.03},
      {x:0.22,y:0.22,w:0.03,h:0.18},
      {x:0.22,y:0.37,w:0.50,h:0.03},
      {x:0.69,y:0.37,w:0.03,h:0.18},
      {x:0.34,y:0.52,w:0.38,h:0.03},
      {x:0.34,y:0.52,w:0.03,h:0.18},
      {x:0.34,y:0.67,w:0.38,h:0.03},
      {x:0.69,y:0.67,w:0.03,h:0.13},
    ],
    start: {x:0.12,y:0.12},
    finish: {x:0.86,y:0.86,w:0.07,h:0.07},
  },
];

let levelIndex = 0;

/* ----------------------------- timer + best ---------------------------- */
let tStart = 0;
let tNow = 0;
let timerRunning = false;

function bestKeyForLevel(i){ return `tiltMaze_best_level_${i}`; }

function loadBest(i){
  const v = localStorage.getItem(bestKeyForLevel(i));
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function saveBest(i, seconds){
  localStorage.setItem(bestKeyForLevel(i), String(seconds));
}

/* ------------------------------- sound fx ------------------------------ */
let soundOn = true;
let audioCtx = null;

function ensureAudio(){
  if (!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function beep({freq=440, dur=0.07, type="sine", gain=0.05}={}){
  if (!soundOn) return;
  ensureAudio();
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(t);
  o.stop(t + dur);
}

function sfxStart(){ beep({freq:520,dur:0.10,type:"triangle",gain:0.06}); }
function sfxWall(){ beep({freq:190,dur:0.04,type:"square",gain:0.04}); }
function sfxWin(){
  if (!soundOn) return;
  ensureAudio();
  const seq = [660, 880, 990, 1320];
  let t = audioCtx.currentTime;
  for (const f of seq){
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type="triangle";
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(audioCtx.destination);
    o.start(t);
    o.stop(t + 0.12);
    t += 0.08;
  }
}

/* ------------------------------ UI helpers ----------------------------- */
function setStatus(t){ sStatus.textContent = t; }
function setToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(setToast._t);
  setToast._t = setTimeout(()=>toast.classList.remove("show"), 1400);
}
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

function resize(){
  DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const rect = cv.getBoundingClientRect();
  W = Math.floor(rect.width * DPR);
  H = Math.floor(rect.height * DPR);
  cv.width = W; cv.height = H;

  // keep ball inside
  BALL.x = clamp(BALL.x, BALL.r + 6, W - BALL.r - 6);
  BALL.y = clamp(BALL.y, BALL.r + 6, H - BALL.r - 6);

  draw();
}
window.addEventListener("resize", resize);

/* ------------------------------ level logic ---------------------------- */
function currentLevel(){ return LEVELS[levelIndex]; }

function levelWallsScaled(){
  const lv = currentLevel();
  return lv.walls.map(w => ({
    x: w.x * W, y: w.y * H, w: w.w * W, h: w.h * H
  }));
}

function finishScaled(){
  const f = currentLevel().finish;
  return { x: f.x*W, y: f.y*H, w: f.w*W, h: f.h*H };
}

function resetLevel({keepCal=true}={}){
  const lv = currentLevel();
  BALL.x = lv.start.x * W;
  BALL.y = lv.start.y * H;
  BALL.vx = 0; BALL.vy = 0;

  moves = 0;
  sMoves.textContent = String(moves);

  // timer reset
  timerRunning = false;
  tStart = 0;
  tNow = 0;
  sTime.textContent = "0.00";

  // best update
  const best = loadBest(levelIndex);
  sBest.textContent = best ? best.toFixed(2) : "—";

  sLevel.textContent = String(levelIndex + 1);
  draw();
}

function nextLevel(){
  levelIndex = (levelIndex + 1) % LEVELS.length;
  setToast(`${LEVELS[levelIndex].name} ▶️`);
  beep({freq:420, dur:0.08, type:"triangle", gain:0.05});
  resetLevel();
}

/* ---------------------- collision: circle vs rect ---------------------- */
function resolveCircleAABB(circle, rect){
  const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const dist2 = dx*dx + dy*dy;
  const r = circle.r;

  if (dist2 >= r*r) return false;

  // Penetration depths
  const overlapX1 = (circle.x + r) - rect.x;
  const overlapX2 = (rect.x + rect.w) - (circle.x - r);
  const overlapY1 = (circle.y + r) - rect.y;
  const overlapY2 = (rect.y + rect.h) - (circle.y - r);

  const penX = Math.min(overlapX1, overlapX2);
  const penY = Math.min(overlapY1, overlapY2);

  if (penX < penY){
    if (overlapX1 < overlapX2){
      circle.x -= penX;
      circle.vx *= -0.55;
    } else {
      circle.x += penX;
      circle.vx *= -0.55;
    }
  } else {
    if (overlapY1 < overlapY2){
      circle.y -= penY;
      circle.vy *= -0.55;
    } else {
      circle.y += penY;
      circle.vy *= -0.55;
    }
  }
  return true;
}

/* -------------------------------- physics ------------------------------ */
function physicsStep(){
  // friction
  BALL.vx *= FRICTION;
  BALL.vy *= FRICTION;

  // integrate
  BALL.x += BALL.vx;
  BALL.y += BALL.vy;

  // collisions
  const walls = levelWallsScaled();
  let hit = false;
  for (const w of walls){
    if (resolveCircleAABB(BALL, w)) hit = true;
  }
  if (hit) sfxWall();

  // clamp (safety)
  BALL.x = clamp(BALL.x, BALL.r, W - BALL.r);
  BALL.y = clamp(BALL.y, BALL.r, H - BALL.r);
}

function checkFinish(){
  const f = finishScaled();
  if (BALL.x > f.x && BALL.x < f.x + f.w && BALL.y > f.y && BALL.y < f.y + f.h){
    // stop timer
    const seconds = timerRunning ? (performance.now() - tStart)/1000 : 0;
    timerRunning = false;

    // best save
    if (seconds > 0){
      const best = loadBest(levelIndex);
      if (!best || seconds < best){
        saveBest(levelIndex, seconds);
        sBest.textContent = seconds.toFixed(2);
        setToast(`NEW BEST: ${seconds.toFixed(2)}s 🏁`);
      } else {
        setToast(`Finish: ${seconds.toFixed(2)}s 🏁`);
      }
    } else {
      setToast("Finish 🏁");
    }

    sfxWin();
    // next level after short delay
    setTimeout(nextLevel, 700);
  }
}

function updateTimer(){
  if (!timerRunning) return;
  tNow = (performance.now() - tStart)/1000;
  sTime.textContent = tNow.toFixed(2);
}

/* -------------------------------- render ------------------------------ */
function draw(){
  // background tint for readability (over matrix)
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0,0,W,H);

  // grid
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  const step = 28 * DPR;
  for (let x=0; x<=W; x+=step){ ctx.moveTo(x,0); ctx.lineTo(x,H); }
  for (let y=0; y<=H; y+=step){ ctx.moveTo(0,y); ctx.lineTo(W,y); }
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1 * DPR;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // walls
  const walls = levelWallsScaled();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1.2 * DPR;
  for (const w of walls){
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }

  // finish
  const f = finishScaled();
  ctx.fillStyle = "rgba(55,255,139,0.16)";
  ctx.strokeStyle = "rgba(55,255,139,0.90)";
  ctx.lineWidth = 2 * DPR;
  ctx.fillRect(f.x, f.y, f.w, f.h);
  ctx.strokeRect(f.x, f.y, f.w, f.h);

  // ball
  const grd = ctx.createRadialGradient(BALL.x - BALL.r*0.4, BALL.y - BALL.r*0.55, BALL.r*0.25, BALL.x, BALL.y, BALL.r*1.25);
  grd.addColorStop(0, "#ffffff");
  grd.addColorStop(0.2, "#ffb0b0");
  grd.addColorStop(0.6, "#ff2d2d");
  grd.addColorStop(1, "#9c0000");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(BALL.x, BALL.y, BALL.r, 0, Math.PI*2);
  ctx.fill();
}

/* -------------------------------- loop -------------------------------- */
let lastFrame = performance.now();
let fpsAcc = 0, fpsN = 0, fpsLast = performance.now();

function loop(){
  if (!running) return;

  // fps calc
  const now = performance.now();
  const dt = now - lastFrame;
  lastFrame = now;
  if (dt > 0){
    fpsAcc += 1000/dt;
    fpsN++;
    if (now - fpsLast > 600){
      sFps.textContent = (fpsAcc/fpsN).toFixed(0);
      fpsAcc = 0; fpsN = 0; fpsLast = now;
    }
  }

  physicsStep();
  updateTimer();
  checkFinish();
  draw();

  requestAnimationFrame(loop);
}

/* -------------------------- device orientation ------------------------- */
function onOrientation(e){
  if (typeof e.gamma !== "number" || typeof e.beta !== "number") return;

  const gamma = e.gamma - offsetGamma;
  const beta  = e.beta  - offsetBeta;

  lastGamma = gamma;
  lastBeta = beta;

  sGamma.textContent = gamma.toFixed(1);
  sBeta.textContent  = beta.toFixed(1);

  const ax = clamp(gamma, -45, 45) * ACCEL;
  const ay = clamp(beta,  -45, 45) * ACCEL * 0.75;

  BALL.vx = clamp(BALL.vx + ax, -MAX_SPEED, MAX_SPEED);
  BALL.vy = clamp(BALL.vy + ay, -MAX_SPEED, MAX_SPEED);

  // timer starts on first real movement
  if (!timerRunning && (Math.abs(ax)+Math.abs(ay) > 0.9)){
    timerRunning = true;
    tStart = performance.now();
  }

  // moves counter
  if (Math.abs(ax) + Math.abs(ay) > 0.8){
    moves++;
    sMoves.textContent = String(moves);
  }
}

async function requestIOSPermissionIfNeeded(){
  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function") {
    const state = await DeviceOrientationEvent.requestPermission();
    return state === "granted";
  }
  return true;
}

async function start(){
  if (running) return;

  try{
    setStatus("requesting...");
    const ok = await requestIOSPermissionIfNeeded();
    if (!ok){
      setStatus("permission denied");
      setToast("Permission berilmedi ❌");
      return;
    }

    window.addEventListener("deviceorientation", onOrientation, true);
    running = true;
    btnCal.disabled = false;
    setStatus("running");
    setToast("Sensors ON ✅");
    sfxStart();

    requestAnimationFrame(loop);
  }catch(err){
    console.error(err);
    setStatus("error");
    setToast("Sensor error ❌");
  }
}

function resetAll(){
  // Keep calibration offsets, but stop timer and reset ball
  resetLevel();
  setToast("Reset ✅");
}

function calibrate(){
  offsetGamma += lastGamma;
  offsetBeta  += lastBeta;
  setToast("Calibrated 🎚️");
  beep({freq:340, dur:0.08, type:"triangle", gain:0.05});
}

/* ------------------------------- PWA install --------------------------- */
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  btnInstall.hidden = false;
});

btnInstall.addEventListener("click", async ()=>{
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  btnInstall.hidden = true;
});

/* ------------------------------- SW register --------------------------- */
if ("serviceWorker" in navigator){
  window.addEventListener("load", ()=>{
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  });
}

/* ----------------------------- CMatrix background ---------------------- */
(function startMatrix(){
  const mcv = document.getElementById("matrix");
  const mctx = mcv.getContext("2d");
  let mw=0,mh=0,mdpr=1;
  const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@%&*";
  let columns = 0;
  let drops = [];

  function mResize(){
    mdpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    mw = Math.floor(window.innerWidth * mdpr);
    mh = Math.floor(window.innerHeight * mdpr);
    mcv.width = mw;
    mcv.height = mh;
    mcv.style.width = "100%";
    mcv.style.height = "100%";
    const fontSize = 16 * mdpr;
    columns = Math.floor(mw / fontSize);
    drops = new Array(columns).fill(0).map(()=>Math.floor(Math.random()*mh/fontSize));
    mctx.font = `${fontSize}px monospace`;
  }

  function tick(){
    // fade
    mctx.fillStyle = "rgba(0,0,0,0.08)";
    mctx.fillRect(0,0,mw,mh);

    const fontSize = 16 * mdpr;

    for (let i=0;i<columns;i++){
      const x = i * fontSize;
      const y = drops[i] * fontSize;
      const ch = chars[Math.floor(Math.random()*chars.length)];
      // cmatrix green
      mctx.fillStyle = "rgba(55,255,139,0.75)";
      mctx.fillText(ch, x, y);

      if (y > mh && Math.random() > 0.985) drops[i] = 0;
      drops[i] += 1;
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", mResize);
  mResize();
  tick();
})();

/* ------------------------------ UI wiring ------------------------------ */
btnStart.addEventListener("click", start);
btnReset.addEventListener("click", resetAll);
btnCal.addEventListener("click", calibrate);

btnMute.addEventListener("click", ()=>{
  soundOn = !soundOn;
  btnMute.textContent = `Sound: ${soundOn ? "ON" : "OFF"}`;
  btnMute.setAttribute("aria-pressed", String(!soundOn));
  setToast(soundOn ? "Sound ON 🔊" : "Sound OFF 🔇");
  if (soundOn) beep({freq:520, dur:0.06, type:"triangle", gain:0.05});
});

/* -------------------------------- init -------------------------------- */
function init(){
  resize();
  resetLevel();
  setStatus("idle");
  setToast("Ready ✅");
}
init();
