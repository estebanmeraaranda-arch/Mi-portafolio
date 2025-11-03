// === Importaciones necesarias de Three.js ===
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// === ESCENA PRINCIPAL ===
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

// === RENDERIZADOR ===
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

// === FÍSICA BÁSICA ===
const gravity = -0.03;
let velocityY = 0;
let onGround = false;

// === OBJETOS CON LOS QUE SE PUEDE COLISIONAR ===
let collidableMeshes = []; // objetos "sólidos" (árboles, casas, rocas)
let terrain = null;        // el mesh/scene que consideramos "suelo" para alturas

// === PARÁMETROS AJUSTABLES ===
// Distancia máxima del raycast frontal para chequear obstáculos
const FORWARD_RAY_DISTANCE = 0.6; 
// Si la diferencia de altura entre punto adelante y punto bajo los pies es menor a esto -> lo tratamos como mini colina (permitir paso)
const HILL_HEIGHT_THRESHOLD = 0.25; 
// Si la normal del punto hit tiene componente Y >= este umbral la superficie es plana/suave; si está por debajo -> inclinada/obstáculo
const SLOPE_Y_THRESHOLD = 0.7; 

// === Permitir forzar rotación exacta en radianes (null = automático) ===
let penguinRotationOverride = null; // p.ej: 1.5708 para 90 grados

// === CARGA DEL ESCENARIO ===
const loader = new GLTFLoader();

loader.load(
  'Low_Poly_Forest.glb',
  (gltf) => {
    terrain = gltf.scene;
    // Recorremos las mallas y clasificamos:
    terrain.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        // Intentamos identificar si la malla es "suelo" o "objeto" por su nombre o por tamaño.
        // Primero intentamos por nombre (si el autor del glb nombró 'ground','terrain','floor' etc).
        const name = (node.name || '').toLowerCase();
        const looksLikeGroundByName = name.includes('ground') || name.includes('terrain') || name.includes('floor') || name.includes('suelo');

        // Si no tiene nombre obvio, medimos su bounding box: mallas muy grandes las tratamos como terreno.
        let looksLikeGroundBySize = false;
        try {
          if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
          const bb = node.geometry.boundingBox;
          const size = new THREE.Vector3().subVectors(bb.max, bb.min);
          // si la malla es ancha (ej: > 10 unidades en alguna dimensión local) la consideramos parte del suelo.
          if (size.x > 8 || size.z > 8) looksLikeGroundBySize = true;
        } catch (e) {
          // en caso de fallo, no marcar por tamaño
        }

        // Si es suelo, lo dejamos para hacer raycasts de altura (no lo agregamos a collidableMeshes)
        if (looksLikeGroundByName || looksLikeGroundBySize) {
          // lo consideramos terreno para ajustes verticales
          // No lo añadimos a collidableMeshes para que no bloquee el paso (las colisiones frontales se decidirán dinámicamente)
        } else {
          // objetos "sólidos" que siempre deberían bloquear movimiento
          collidableMeshes.push(node);
        }
      }
    });

    terrain.position.set(0, 0, 0);
    scene.add(terrain);
  },
  undefined,
  (error) => console.error('Error al cargar escenario:', error)
);

// === CARGA DEL PINGÜINO ===
let penguin;
const startPosition = new THREE.Vector3(0, 3, 0);

loader.load(
  'Pinguinomagico.glb',
  (gltf) => {
    penguin = gltf.scene;
    penguin.scale.set(0.08, 0.08, 0.08);
    penguin.position.copy(startPosition);
    penguin.rotation.y = Math.PI; // orientación por defecto

    penguin.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    scene.add(penguin);
  },
  undefined,
  (error) => console.error('Error al cargar pingüino:', error)
);

// === CONTROLES DE MOVIMIENTO ===
const keys = {};
let velocity = new THREE.Vector3();
const walkSpeed = 0.04;
const runSpeed = 0.07;
document.addEventListener('keydown', (e) => (keys[e.code] = true));
document.addEventListener('keyup', (e) => (keys[e.code] = false));

// === CONTROL DE CÁMARA ===
let pitch = 0;
let yaw = Math.PI;
let isLocked = false;
document.body.addEventListener('click', () => document.body.requestPointerLock());
document.addEventListener('pointerlockchange', () => {
  isLocked = document.pointerLockElement === document.body;
});
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

// Helper: obtener normal del hit en world space (si existe)
function getWorldNormal(hit) {
  if (!hit.face) return new THREE.Vector3(0, 1, 0);
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
  return hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
}

// === LOOP PRINCIPAL ===
function animate() {
  requestAnimationFrame(animate);

  if (penguin && terrain) {
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2));

    velocity.set(0, 0, 0);
    if (keys['KeyS']) velocity.add(forward);
    if (keys['KeyW']) velocity.sub(forward);
    if (keys['KeyA']) velocity.sub(right);
    if (keys['KeyD']) velocity.add(right);
    if (velocity.length() > 0) velocity.normalize();
    const currentSpeed = keys['ShiftLeft'] ? runSpeed : walkSpeed;

    // === Detectar altura del suelo bajo el pingüino (para comparar con punto adelante) ===
    downRay.set(penguin.position.clone().add(new THREE.Vector3(0, 0.6, 0)), new THREE.Vector3(0, -1, 0));
    const groundHits = downRay.intersectObject(terrain, true);
    let groundY = -Infinity;
    if (groundHits.length > 0) {
      groundY = groundHits[0].point.y;
    }

    // === COLISIÓN FRONTAL: verificamos tanto objetos "sólidos" como el terreno ADELANTE ===
    let canMove = true;
    if (velocity.length() > 0) {
      const direction = velocity.clone().normalize();
      const rayOrigin = penguin.position.clone().add(new THREE.Vector3(0, 0.3, 0));
      forwardRay.set(rayOrigin, direction);
      forwardRay.far = FORWARD_RAY_DISTANCE;

      // Intersectamos contra objetos sólidos + terreno (si terrain no es null)
      const candidates = collidableMeshes.slice();
      if (terrain) candidates.push(terrain);

      const hits = forwardRay.intersectObjects(candidates, true);

      if (hits.length > 0) {
        const first = hits[0];
        const hitDistance = first.distance;
        const hitPointY = first.point.y;
        const surfaceNormal = getWorldNormal(first);
        const heightDiff = hitPointY - groundY; // si positivo, algo más alto que nuestro suelo actual

        // Decisión:
        // - Si el hit es con una malla marcada como "sólida" (estaba en collidableMeshes),
        //   lo consideramos obstáculo sin mirar altura (bloquea).
        // - Si el hit es con el terrain (o una malla grande que actuó como terreno),
        //   usamos heightDiff y normal para decidir si es mini colina o obstáculo.
        const hitObjectRoot = first.object;
        // subimos hasta la raíz para comparar con collidableMeshes entries
        let root = hitObjectRoot;
        while (root.parent && !collidableMeshes.includes(root) && root.parent.type !== 'Scene') {
          root = root.parent;
        }
        const isSolidObject = collidableMeshes.includes(root) || collidableMeshes.includes(first.object);

        if (isSolidObject) {
          // obstáculo sólido — bloquea si está muy cercano
          if (hitDistance < 0.25) canMove = false;
        } else {
          // hit con terreno o malla grande: decídelo por altura y pendiente
          // si la pendiente es pronunciada (surfaceNormal.y < SLOPE_Y_THRESHOLD) -> obstáculo
          // si la diferencia de altura es mayor a HILL_HEIGHT_THRESHOLD -> obstáculo
          if (surfaceNormal.y < SLOPE_Y_THRESHOLD || heightDiff > HILL_HEIGHT_THRESHOLD) {
            if (hitDistance < 0.25) canMove = false;
          } else {
            // es una mini colina suave: permitir paso (no hacer nada)
          }
        }
      }
    }

    // === MOVIMIENTO ===
    if (canMove) {
      penguin.position.addScaledVector(velocity, currentSpeed);
    }

// Rotación exacta del pingüino (en radianes)
let penguinRotationDegrees = 90;

// Dentro del animate()
if (velocity.length() > 0) {
  // 270° (izquierda) + dirección de cámara (yaw)
  penguin.rotation.y = yaw + THREE.MathUtils.degToRad(90);
} 
    // === GRAVEDAD / PISO (ajuste vertical) ===
    velocityY += gravity;
    // usamos solo terrain para detección vertical
    const downHitsForStep = downRay.intersectObject(terrain, true);
    if (downHitsForStep.length > 0) {
      const gY = downHitsForStep[0].point.y;
      const distance = penguin.position.y - gY;
      if (distance <= 0.3) {
        penguin.position.y = gY + -0.08;
        velocityY = 0;
        onGround = true;
      } else {
        onGround = false;
      }
    } else {
      onGround = false;
    }

    penguin.position.y += velocityY;

    if (penguin.position.y < -10) {
      penguin.position.copy(startPosition);
      velocityY = 0;
    }

    // === CÁMARA SIGUE DETRÁS DEL PINGÜINO ===
    const cameraOffset = new THREE.Vector3(0, 0.6, 1.4);
    const offsetRotated = cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const cameraTarget = penguin.position.clone().add(offsetRotated);
    camera.position.lerp(cameraTarget, 0.1);
    camera.lookAt(penguin.position.clone().add(new THREE.Vector3(0, 0.4, 0)));
  }

  renderer.render(scene, camera);
}

animate();

// === AJUSTE DE PANTALLA ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
export { scene, camera, renderer };
window.scene = scene;