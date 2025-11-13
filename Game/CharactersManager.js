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
      meScene.scale.set(0.8, 1, 0.8);
      meScene.position.set(-1, 0.05, -0.4);
      // vertical hint offset (meters above model top); tweak this per-model if needed
      meScene.userData.hintOffset = { x: -0.63, y: 0.80, z: -2.26 };
      meScene.userData.hintDistance = 1.6;
      results.me = meScene;
      if (scene) scene.add(meScene);
    }

    if (zorritoScene) {
      zorritoScene.name = 'ZorritoFinal';
      zorritoScene.scale.set(0.8, 0.8, 0.8);
      zorritoScene.position.set(-2, 0, 0);
      // vertical hint offset (meters above model top)
      zorritoScene.userData.hintOffset = { x: -1.5, y: 1, z: -0.6};
      zorritoScene.userData.hintDistance = 1.6;

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

// ---------------- Interaction Management ----------------
// Funciones de utilidad para manejar offsets de hints (mantenidas por compatibilidad)

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
