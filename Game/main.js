import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Fireflies } from './fireflies.js';

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
const startPosition = new THREE.Vector3(0, 3, 0);

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
  // Agregar las luciérnagas después de cargar el terreno
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

// === CONTROLES ===
const keys = {};
let velocity = new THREE.Vector3();
const walkSpeed = 0.04;
const runSpeed = 0.07;
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

// === CÁMARA ===
let pitch = 0;
let yaw = Math.PI;
let isLocked = false;
document.body.addEventListener('click', () => document.body.requestPointerLock());
document.addEventListener('pointerlockchange', () => { isLocked = document.pointerLockElement === document.body; });
document.addEventListener('mousemove', (event) => {
  if (!isLocked) return;
  const sensitivity = 0.002;
  yaw -= event.movementX * sensitivity;
  pitch -= event.movementY * sensitivity;
  pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
});

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
  requestAnimationFrame(animate);

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

    // Altura suelo
    downRay.set(penguin.position.clone().add(new THREE.Vector3(0,0.6,0)), new THREE.Vector3(0,-1,0));
    const groundHits = downRay.intersectObject(terrain, true);
    let groundY = -Infinity;
    if (groundHits.length > 0) groundY = groundHits[0].point.y;

    // Colisión frontal
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

    // Gravedad
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

    // Cámara sigue
    const cameraOffset = new THREE.Vector3(0,0.6,1.4);
    const offsetRotated = cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
    const cameraTarget = penguin.position.clone().add(offsetRotated);
    camera.position.lerp(cameraTarget,0.1);
    camera.lookAt(penguin.position.clone().add(new THREE.Vector3(0,0.4,0)));
  }

  renderer.render(scene,camera);
}
animate();

// === AJUSTE VENTANA ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === AJUSTE VENTANA ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
