import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// CharactersManager.js
// Encapsula la carga de modelos de personajes para mantener el main más limpio.

const charactersLoader = new GLTFLoader();

/**
 * Carga los personajes y los agrega opcionalmente a la escena.
 * @param {THREE.Scene} scene - escena donde añadir los modelos (opcional)
 * @returns {Promise<{me: THREE.Object3D|null, zorrito: THREE.Object3D|null}>}
 */
export async function loadCharacters(scene) {
  const basePath = './assets/glb/';

  function load(path) {
    return new Promise((resolve, reject) => {
      charactersLoader.load(path, (gltf) => resolve(gltf.scene), undefined, reject);
    });
  }

  const results = { me: null, zorrito: null };

  try {
    const [meScene, zorritoScene] = await Promise.all([
      load(basePath + 'MeFinal.glb'),
      load(basePath + 'zorritoFinal.glb'),
    ]);

    // Ajustes por defecto (escala/posición). Puedes modificar desde main después.
    if (meScene) {
      meScene.name = 'MeFinal';
      meScene.scale.set(0.8, 0.8, 0.8);
      meScene.position.set(-1, 0.05, -0.4);
      // vertical hint offset (meters above model top); tweak this per-model if needed
  meScene.userData.hintOffset = { x: -0.63, y: 0.60, z: -2.26 };
      results.me = meScene;
      if (scene) scene.add(meScene);
    }

    if (zorritoScene) {
      zorritoScene.name = 'ZorritoFinal';
      zorritoScene.scale.set(0.8, 0.8, 0.8);
      zorritoScene.position.set(-1, 0.1, 1);
      // vertical hint offset (meters above model top)
  zorritoScene.userData.hintOffset = { x: 6, y: 2, z: 4 };
      results.zorrito = zorritoScene;
      if (scene) scene.add(zorritoScene);
    }

    return results;
  } catch (err) {
    console.error('Error cargando personajes:', err);
    return results;
  }
}

/**
 * Alias sincrónico que agrega los personajes usando callbacks (por compatibilidad si se necesita).
 * @param {THREE.Scene} scene
 */
export function loadAllCharacters(scene) {
  // Llamamos a la versión async pero no esperamos
  loadCharacters(scene).then(() => {});
}

// ---------------- Interaction / Hints Management ----------------
// The manager can create DOM hints above characters and handle 'E' interactions.

let _renderer = null;
let _camera = null;
let _getPlayerPos = null;
let _container = null;
let _hints = {};
let _keyHandler = null;
let _keyUpHandler = null;
let _escHandler = null;
let _imageContainer = null;
let _interactDistance = 2.0;
const _callbacks = {};

function createImageOverlay() {
  if (_imageContainer) return _imageContainer;
  const c = document.createElement('div');
  c.id = 'yogameContainer';
  c.style.position = 'fixed';
  c.style.top = '50%';
  c.style.left = '50%';
  c.style.transform = 'translate(-50%, -50%)';
  c.style.display = 'none';
  c.style.zIndex = '1000';
  c.style.opacity = '0';
  c.style.transition = 'opacity 0.3s ease';
  
  const img = document.createElement('img');
  img.src = './assets/img/YOGAME.png';
  img.style.display = 'block';
  // tamaño ajustado y transición suave
  img.style.width = '800px'; // tamaño aumentado
  img.style.height = 'auto';
  img.style.transition = 'opacity 0.3s ease';
  
  c.appendChild(img);
  document.body.appendChild(c);
  _imageContainer = c;
  return c;
}

function ensureContainer() {
  if (_container) return _container;
  const c = document.createElement('div');
  c.id = 'interactionContainer';
  c.style.position = 'absolute';
  c.style.top = '0';
  c.style.left = '0';
  c.style.width = '100%';
  c.style.height = '100%';
  c.style.pointerEvents = 'none';
  document.body.appendChild(c);
  _container = c;
  return c;
}

function createHint(name) {
  if (_hints[name]) return _hints[name];
  const c = ensureContainer();
  const el = document.createElement('div');
  el.className = 'interaction-hint';
  el.textContent = 'E';
  el.style.position = 'absolute';
  el.style.display = 'none';
  el.style.pointerEvents = 'none';
  c.appendChild(el);
  _hints[name] = el;
  return el;
}

function getModelTopY(obj) {
  // compute bounding box of object to estimate top Y
  try {
    const box = new THREE.Box3().setFromObject(obj);
    return box.max.y;
  } catch (e) {
    return obj.position.y + 1.6;
  }
}

export function setupInteraction(options) {
  // Primero limpiamos cualquier listener previo para evitar duplicados
  disposeInteraction();
  
  _renderer = options.renderer;
  _camera = options.camera;
  _getPlayerPos = options.getPlayerPosition; // function
  if (options.distance) _interactDistance = options.distance;

  function showImage() {
    const container = createImageOverlay();
    container.style.display = 'block';
  }

  function hideImage() {
    if (_imageContainer) {
      _imageContainer.style.display = 'none';
    }
  }

  let isShowingImage = false;
  let isKeyDown = false;

  _keyHandler = function(e) {
    if (e.code !== 'KeyE') return;
    if (isKeyDown) return; // prevent repeat events
    isKeyDown = true;

    const playerPos = _getPlayerPos && _getPlayerPos();
    if (!playerPos) return;
    const playerVec = (playerPos.position && playerPos.position.isVector3) ? playerPos.position : (playerPos.isVector3 ? playerPos : (playerPos.position || null));
    if (!playerVec) return;

    let nearest = null;
    let nd = Infinity;
    Object.keys(window.characters || {}).forEach((k) => {
      const obj = window.characters[k];
      if (!obj) return;
      const d = playerVec.distanceTo(obj.position);
      if (d < nd) { nd = d; nearest = { k, obj, d }; }
    });

    if (nearest && nd <= _interactDistance && nearest.k === 'me' && !isShowingImage) {
      showImage();
      isShowingImage = true;
    }
  };

  _keyUpHandler = function(e) {
    if (e.code === 'KeyE') {
      isKeyDown = false;
      // Ya no ocultamos la imagen al soltar E
    }
  };

  _escHandler = function(e) {
    // Solo procesar el evento si viene del juego
    if (!_renderer || !_camera) return;
    
    if (e.code === 'Escape') {
      if (isShowingImage) {
        e.stopImmediatePropagation();
        e.preventDefault();
        hideImage();
        isShowingImage = false;
        return false;
      }
    }
  };

  // Retrasar la adición de los listeners para asegurar que el menú inicial esté completamente cargado
  setTimeout(() => {
    document.addEventListener('keydown', _escHandler, true);
    document.addEventListener('keydown', _keyHandler);
    document.addEventListener('keyup', _keyUpHandler);
  }, 100);

  // Modifica showImage y hideImage para usar transiciones
  function showImage() {
    const container = createImageOverlay();
    container.style.display = 'block';
    // Forzar reflow
    container.offsetHeight;
    container.style.opacity = '1';
  }

  function hideImage() {
    if (_imageContainer) {
      _imageContainer.style.opacity = '0';
      setTimeout(() => {
        _imageContainer.style.display = 'none';
      }, 300);
    }
  }

  // Exponer checkDistance para llamarlo en cada frame
  window.checkInteractionDistance = checkDistance;
}

export function updateHints() {
  if (!_renderer || !_camera) return;
  const chars = window.characters || {};
  const canvas = _renderer.domElement;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const offsetLeft = rect.left + window.scrollX;
  const offsetTop = rect.top + window.scrollY;
  const playerPos = _getPlayerPos && _getPlayerPos();
  const playerVec = (playerPos && playerPos.position && playerPos.position.isVector3) ? playerPos.position : (playerPos && playerPos.isVector3 ? playerPos : (playerPos && playerPos.position ? playerPos.position : null));

  Object.keys(chars).forEach((key) => {
    const obj = chars[key];
    if (!obj) return;
    const hint = createHint(key);
    if (!playerVec) { hint.style.display = 'none'; return; }
    const d = playerVec.distanceTo(obj.position);
    // Mostrar el hint siempre que la distancia sea menor o igual a _interactDistance
    // Sin importar qué tan cerca estemos
    if (d > _interactDistance) { 
      hint.style.display = 'none'; 
      return; 
    }

  // compute world position: use the model's world position (X/Z) and add a vertical offset
  // This is simpler and more robust when the model pivot is not at the visual center.
  const worldPos = new THREE.Vector3();
  obj.getWorldPosition(worldPos);
  // support hintOffset as {x,y,z} or numeric (y)
  let offX = 0, offY = 0.15, offZ = 0;
  if (obj && obj.userData && obj.userData.hintOffset !== undefined) {
    const ho = obj.userData.hintOffset;
    if (typeof ho === 'number') offY = ho;
    else if (ho && typeof ho === 'object') {
      offX = Number(ho.x) || 0;
      offY = (typeof ho.y === 'number') ? ho.y : offY;
      offZ = Number(ho.z) || 0;
    }
  }
  worldPos.x += offX;
  worldPos.y += offY;
  worldPos.z += offZ;
    const proj = worldPos.project(_camera);
    // Ajustamos la condición para mantener visible el hint incluso cuando estamos muy cerca
    if (proj.z > 1) { hint.style.display = 'none'; return; }
    const x = offsetLeft + (proj.x * 0.5 + 0.5) * width;
    const y = offsetTop + (-proj.y * 0.5 + 0.5) * height;
    hint.style.left = `${Math.round(x)}px`;
    hint.style.top = `${Math.round(y)}px`;
    hint.style.transform = 'translate(-50%, -140%)';
    // Aseguramos que el hint sea visible
    hint.style.display = 'block';
  });
}

export function registerInteractionCallback(name, fn) {
  _callbacks[name] = fn;
}

export function setHintOffset(name, xOrObj, y, z) {
  // Usage:
  // setHintOffset('me', 0.6) -> sets numeric Y offset
  // setHintOffset('me', {x:0,y:0.6,z:0}) -> sets full object
  // setHintOffset('me', dx, dy, dz) -> sets components
  try {
    const chars = window.characters || {};
    const obj = chars[name];
    if (!obj) return false;
    obj.userData = obj.userData || {};
    if (typeof xOrObj === 'object') {
      obj.userData.hintOffset = { x: Number(xOrObj.x) || 0, y: Number(xOrObj.y) || 0, z: Number(xOrObj.z) || 0 };
    } else if (typeof xOrObj === 'number' && y === undefined) {
      obj.userData.hintOffset = Number(xOrObj) || 0;
    } else {
      obj.userData.hintOffset = { x: Number(xOrObj) || 0, y: Number(y) || 0, z: Number(z) || 0 };
    }
    return true;
  } catch (e) { return false; }
}

export function getHintOffset(name) {
  try {
    const chars = window.characters || {};
    const obj = chars[name];
    if (!obj) return null;
    return obj.userData && obj.userData.hintOffset ? obj.userData.hintOffset : null;
  } catch (e) { return null; }
}

export function disposeInteraction() {
  try { 
    document.removeEventListener('keydown', _keyHandler); 
    document.removeEventListener('keyup', _keyUpHandler);
    document.removeEventListener('keydown', _escHandler, true);
    
    if (_container && _container.parentNode) {
      _container.parentNode.removeChild(_container);
    }
    if (_imageContainer && _imageContainer.parentNode) {
      _imageContainer.parentNode.removeChild(_imageContainer);
    }
    
    // Reset all state variables
    _keyHandler = null;
    _keyUpHandler = null;
    _escHandler = null;
    isShowingImage = false;
    isKeyDown = false;
  } catch(e){
    console.error('Error cleaning up interaction:', e);
  }
  try {
    if (_imageContainer && _imageContainer.parentNode) _imageContainer.parentNode.removeChild(_imageContainer);
  } catch(e){}
  _container = null;
  _imageContainer = null;
  _hints = {};
  _renderer = null;
  _camera = null;
  _getPlayerPos = null;
}
