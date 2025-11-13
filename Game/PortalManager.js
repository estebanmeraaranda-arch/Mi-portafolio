// PortalManager.js
// Carga el portal (Portal.glb) - SIN placeholder "E", solo KeyE por proximidad
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const portalLoader = new GLTFLoader();

/**
 * Carga el portal (Portal.glb)
 * @param {THREE.Scene} scene
 * @returns {Promise<{portal: THREE.Object3D|null}>}
 */
export async function loadPortal(scene) {
  const basePath = './assets/glb/';

  function load(path) {
    return new Promise((resolve, reject) => {
      portalLoader.load(path, (gltf) => resolve(gltf.scene), undefined, reject);
    });
  }

  const results = { portal: null };

  try {
    const portalScene = await load(basePath + 'Portal.glb'); // TU ARCHIVO

    if (portalScene) {
      portalScene.name = 'PortalInteractivo';
      
      // POSICIÓN EN SCREEN2 (ajusta según tu mapa)
      portalScene.position.set(1, 0.46, -3,9);  // ← CAMBIA x/z si quieres
      portalScene.scale.set(0.50, 0.50, 0.50);    // Escala ajustable
      portalScene.rotation.y = Math.PI / 4;  // Rotado un poco a la derecha (30°)


      // === CUBO CELESTE RELUCIENTE EN POSICIÓN INDEPENDIENTE ===
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const cubeMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,        // Celeste
        emissive: 0x00cccc,     // Brilla
        emissiveIntensity: 1.5,
        emissiveIntensity: 1.5,
        metalness: 0.8,
        roughness: 0.2,
        envMapIntensity: 2.0
      });

      const portalCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      portalCube.name = 'PortalCube';
      portalCube.position.set(0.45, 0.46, -3.5); // Independiente (cambia si quieres offset, e.g., 1.6, 0.46, -3)
      portalCube.scale.set(0.2, 1, 0.4); // Independiente
      portalCube.rotation.y = -Math.PI /4;   // Independiente

      // Añadir cubo a la escena
      scene.add(portalCube);

      results.portal = portalScene;
      if (scene) scene.add(portalScene);
    }

    return results;
  } catch (err) {
    console.error('Error cargando Portal.glb:', err);
    return results;
  }
}

export function loadPortalSync(scene) {
  loadPortal(scene).then(() => {});
}