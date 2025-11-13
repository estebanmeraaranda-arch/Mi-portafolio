// main.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Fireflies } from './fireflies.js';
import { loadCharacters } from './CharactersManager.js';
import { loadHouse, setupHouseEscape, disposeHouse } from './HouseManager.js';
import { loadPortal } from './PortalManager.js'; // ← NUEVO (para portal.glb y cubo)
import { setupPlaceholders, updatePlaceholders, disposePlaceholders } from './Placeholders.js';

// === ESCENA ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e0e1a);

// === CÁMARA ===
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0.8, 1.8);

// === RENDER ===
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('scene'),
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// === LUCES ===
const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(4, 8, 10);
light.castShadow = true;
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040, 1.2));

// === FÍSICA ===
const gravity = -0.03;
let velocityY = 0;
let onGround = false;

// === OBJETOS COLISIONABLES ===
let collidableMeshes = [];
let terrain = null;

// === PARÁMETROS ===
const FORWARD_RAY_DISTANCE = 0.6; 
const HILL_HEIGHT_THRESHOLD = 0.25; 
const SLOPE_Y_THRESHOLD = 0.7; 

let penguinRotationOverride = null;
let penguin;
const startPosition = new THREE.Vector3(0, 5, 0);

// === CARGA ESCENARIO ===
const loader = new GLTFLoader();
loader.load('./assets/glb/Low_Poly_Forest.glb', (gltf) => {
  terrain = gltf.scene;
  terrain.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      const name = (node.name || '').toLowerCase();
      const looksLikeGroundByName = name.includes('ground') || name.includes('terrain') || name.includes('floor') || name.includes('suelo');
      let looksLikeGroundBySize = false;
      try {
        if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
        const bb = node.geometry.boundingBox;
        const size = new THREE.Vector3().subVectors(bb.max, bb.min);
        if (size.x > 8 || size.z > 8) looksLikeGroundBySize = true;
      } catch {}
      if (!looksLikeGroundByName && !looksLikeGroundBySize) collidableMeshes.push(node);
    }
  });
  terrain.position.set(0, 0, 0);
  scene.add(terrain);
  new Fireflies(scene);
}, undefined, (error) => console.error('Error al cargar escenario:', error));

// === CARGA PINGÜINO ===
loader.load('./assets/glb/Pinguinomagico.glb', (gltf) => {
  penguin = gltf.scene;
  penguin.scale.set(0.08, 0.08, 0.08);
  penguin.position.copy(startPosition);
  penguin.rotation.y = Math.PI;
  penguin.traverse((node) => {
    if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; }
  });
  scene.add(penguin);
}, undefined, (error) => console.error('Error al cargar pingüino:', error));

// === CARGAR PERSONAJES, CASA Y PORTAL ===
Promise.all([
  loadCharacters(scene),
  loadHouse(scene),
  loadPortal(scene)  // ← NUEVO
]).then(([chars, houses, portals]) => {
  window.characters = chars;
  window.houses = houses;

  try {
    setupPlaceholders({ 
      scene,
      camera, 
      getPlayerPosition: () => (penguin ? penguin.position : null), 
      distance: 1.8
    });
  } catch(e) { console.warn('setupPlaceholders failed', e); }

  // Añadir personajes y casa a colisiones
  try {
    Object.keys(chars).forEach((k) => {
      const obj = chars[k];
      if (!obj) return;
      collidableMeshes.push(obj);
    });
    if (houses.casa) {
      collidableMeshes.push(houses.casa);
      console.log('Casa añadida a collidableMeshes');
    }
  } catch(e) { console.warn('Error añadiendo a collidableMeshes', e); }

  setupHouseEscape();
}).catch(err => console.warn('Error cargando assets:', err));

// === CONTROLES ===
const keys = {};
let velocity = new THREE.Vector3();
const walkSpeed = 0.04;
const runSpeed = 0.07;

function keydownHandler(e) { keys[e.code] = true; }
function keyupHandler(e) { keys[e.code] = false; }
document.addEventListener('keydown', keydownHandler);
document.addEventListener('keyup', keyupHandler);

// === CÁMARA ===
let pitch = 0;
let yaw = Math.PI;
let isLocked = false;
function bodyClickHandler() { document.body.requestPointerLock(); }
function pointerlockchangeHandler() { isLocked = document.pointerLockElement === document.body; }
function mousemoveHandler(event) {
  if (!isLocked) return;
  const sensitivity = 0.002;
  yaw -= event.movementX * sensitivity;
  pitch -= event.movementY * sensitivity;
  pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
}
document.body.addEventListener('click', bodyClickHandler);
document.addEventListener('pointerlockchange', pointerlockchangeHandler);
document.addEventListener('mousemove', mousemoveHandler);
// === CLICK EN CUBO PARA REDIRIGIR ===
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  for (let i = 0; i < intersects.length; i++) {
    if (intersects[i].object.name === 'PortalCube') {
      window.location.href = 'https://youtu.be/haf67eKF0uo?si=Yrz8jkuZ96VV_i6A'; // ← CAMBIA TU LINK
      break;
    }
  }
}
renderer.domElement.addEventListener('click', onMouseClick, false);
// === RAYCASTERS ===
const downRay = new THREE.Raycaster();
const forwardRay = new THREE.Raycaster();
function getWorldNormal(hit) {
  if (!hit.face) return new THREE.Vector3(0, 1, 0);
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
  return hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
}

// === ANIMATE ===
function animate() {
  window.gameAnimId = requestAnimationFrame(animate);

  if (window.gamePaused) {
    renderer.render(scene, camera);
    return;
  }

  if (penguin && terrain) {
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2));
    velocity.set(0,0,0);
    if(keys['KeyS']) velocity.add(forward);
    if(keys['KeyW']) velocity.sub(forward);
    if(keys['KeyA']) velocity.sub(right);
    if(keys['KeyD']) velocity.add(right);
    if(velocity.length() > 0) velocity.normalize();
    const currentSpeed = keys['ShiftLeft'] ? runSpeed : walkSpeed;

    downRay.set(penguin.position.clone().add(new THREE.Vector3(0,0.6,0)), new THREE.Vector3(0,-1,0));
    const groundHits = downRay.intersectObject(terrain, true);
    let groundY = -Infinity;
    if (groundHits.length > 0) groundY = groundHits[0].point.y;

    let canMove = true;
    if(velocity.length() > 0) {
      const direction = velocity.clone().normalize();
      const rayOrigin = penguin.position.clone().add(new THREE.Vector3(0,0.3,0));
      forwardRay.set(rayOrigin,direction);
      forwardRay.far = FORWARD_RAY_DISTANCE;
      const candidates = collidableMeshes.slice();
      if(terrain) candidates.push(terrain);
      const hits = forwardRay.intersectObjects(candidates,true);
      if(hits.length>0){
        const first = hits[0];
        const hitDistance = first.distance;
        const hitPointY = first.point.y;
        const surfaceNormal = getWorldNormal(first);
        const heightDiff = hitPointY - groundY;
        let root = first.object;
        while(root.parent && !collidableMeshes.includes(root) && root.parent.type!=='Scene') root = root.parent;
        const isSolidObject = collidableMeshes.includes(root) || collidableMeshes.includes(first.object);
        if(isSolidObject && hitDistance<0.25) canMove=false;
        else if(surfaceNormal.y<SLOPE_Y_THRESHOLD || heightDiff>HILL_HEIGHT_THRESHOLD) if(hitDistance<0.25) canMove=false;
      }
    }

    if(canMove) penguin.position.addScaledVector(velocity,currentSpeed);
    if(velocity.length()>0) penguin.rotation.y = yaw + THREE.MathUtils.degToRad(90);

    velocityY += gravity;
    const downHitsForStep = downRay.intersectObject(terrain,true);
    if(downHitsForStep.length>0){
      const gY = downHitsForStep[0].point.y;
      const distance = penguin.position.y-gY;
      if(distance<=0.3){ penguin.position.y = gY-0.08; velocityY=0; onGround=true; }
      else onGround=false;
    } else onGround=false;
    penguin.position.y += velocityY;
    if(penguin.position.y<-10){ penguin.position.copy(startPosition); velocityY=0; }

    const cameraOffset = new THREE.Vector3(0,0.6,1.4);
    const offsetRotated = cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
    const cameraTarget = penguin.position.clone().add(offsetRotated);
    camera.position.lerp(cameraTarget,0.1);
    camera.lookAt(penguin.position.clone().add(new THREE.Vector3(0,0.4,0)));
  }

  try { updatePlaceholders(); } catch(e) {}

  renderer.render(scene,camera);
}
animate();

// === CLEANUP / DESTROY ===
window.destroyGame = function destroyGame() {
  try { if (window.gameAnimId) cancelAnimationFrame(window.gameAnimId); } catch (e) {}

  try { document.removeEventListener('keydown', keydownHandler); } catch(e){}
  try { document.removeEventListener('keyup', keyupHandler); } catch(e){}
  try { document.body.removeEventListener('click', bodyClickHandler); } catch(e){}
  try { document.removeEventListener('pointerlockchange', pointerlockchangeHandler); } catch(e){}
  try { document.removeEventListener('mousemove', mousemoveHandler); } catch(e){}
  try { window.removeEventListener('resize', resizeHandler); } catch(e){}

  try { disposePlaceholders(); } catch(e){}
  try { disposeHouse(); } catch(e){}
  try { disposePortalCube(); } catch(e){}  // ← LIMPIEZA DEL CUBO

  try { if (window.musicManager && window.musicManager.gameMusic) { window.musicManager.gameMusic.pause(); } } catch(e){}

  try {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => { if (m.dispose) m.dispose(); });
          else if (obj.material.dispose) obj.material.dispose();
        }
      }
    });
  } catch(e) { console.warn('error disposing scene', e); }

  try {
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
  } catch(e) { console.warn('error disposing renderer', e); }

  window.gameAnimId = null;
  window.gameDestroyed = true;
  console.log('Juego destruido y recursos liberados');
};

// === AJUSTE VENTANA ===
function resizeHandler() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resizeHandler);