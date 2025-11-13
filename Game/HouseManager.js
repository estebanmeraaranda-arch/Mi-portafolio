// HouseManager.js
// Carga la casa (casita.glb) y la hace interactiva con "E" → muestra imagen
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const houseLoader = new GLTFLoader();

// Contenedor para imagen de la casa (igual que YOGAME o zorrito)
let _houseImageContainer = null;

function createHouseImageOverlay() {
  if (_houseImageContainer) return _houseImageContainer;

  const c = document.createElement('div');
  c.id = 'houseImageContainer';
  c.style.position = 'fixed';
  c.style.top = '50%';
  c.style.left = '50%';
  c.style.transform = 'translate(-50%, -50%)';
  c.style.display = 'none';
  c.style.zIndex = '1000';
  c.style.opacity = '0';
  c.style.transition = 'opacity 0.3s ease';

  const img = document.createElement('img');
  // Placeholder temporal (cambia por tu imagen real después)
  img.src = './assets/img/E.png'; 
  img.style.display = 'block';
  img.style.width = '800px';
  img.style.height = 'auto';
  img.style.transition = 'opacity 0.3s ease';

  c.appendChild(img);
  document.body.appendChild(c);
  _houseImageContainer = c;
  return c;
}

function showHouseImage() {
  const container = createHouseImageOverlay();
  container.style.display = 'block';
  container.offsetHeight;
  container.style.opacity = '1';
}

function hideHouseImage() {
  if (_houseImageContainer) {
    _houseImageContainer.style.opacity = '0';
    setTimeout(() => {
      _houseImageContainer.style.display = 'none';
    }, 300);
  }
}

/**
 * Carga la casa (casita.glb)
 * @param {THREE.Scene} scene
 * @returns {Promise<{casa: THREE.Object3D|null}>}
 */
export async function loadHouse(scene) {
  const basePath = './assets/glb/';

  function load(path) {
    return new Promise((resolve, reject) => {
      houseLoader.load(path, (gltf) => resolve(gltf.scene), undefined, reject);
    });
  }

  const results = { casa: null };

  try {
    const casaScene = await load(basePath + 'casa6.glb'); // TU ARCHIVO

    if (casaScene) {
      casaScene.name = 'CasaInteractiva';
      
    casaScene.position.set(1.5, -0.1, 0); // 1.5, -0.1, 2
  casaScene.scale.set(1.2, 1.2, 1.2);
  
  // ← AQUÍ: ROTACIÓN DE LA CASA
  casaScene.rotation.y = Math.PI / 10;  // 45° (¡cambia este número!)

      // "E" arriba de la puerta
      casaScene.userData.hintOffset = { x: 0, y: 2.5, z: 0 };
      casaScene.userData.hintDistance = 1.2;

      // Marca como interactivo
      casaScene.userData.isInteractiveObject = true;
      casaScene.userData.interactKey = 'casa';

      // Acción al presionar E
      casaScene.userData.onInteract = () => {
        console.log('Entrando a la casa...');
        showHouseImage(); // Muestra imagen (como YOGAME)
      };

      results.casa = casaScene;
      if (scene) scene.add(casaScene);
    }

    return results;
  } catch (err) {
    console.error('Error cargando casita.glb:', err);
    return results;
  }
}

export function loadCasa(scene) {
  loadHouse(scene).then(() => {});
}

// ESC para cerrar imagen
let _escHandlerHouse = null;
export function setupHouseEscape() {
  if (_escHandlerHouse) return;

  _escHandlerHouse = function(e) {
    if (e.code === 'Escape' && _houseImageContainer && _houseImageContainer.style.display === 'block') {
      e.stopImmediatePropagation();
      e.preventDefault();
      hideHouseImage();
      return false;
    }
  };

  document.addEventListener('keydown', _escHandlerHouse, true);
}

export function disposeHouse() {
  if (_houseImageContainer && _houseImageContainer.parentNode) {
    _houseImageContainer.parentNode.removeChild(_houseImageContainer);
  }
  if (_escHandlerHouse) {
    document.removeEventListener('keydown', _escHandlerHouse, true);
    _escHandlerHouse = null;
  }
  _houseImageContainer = null;
}