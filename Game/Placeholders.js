// Placeholders.js
// Maneja los placeholders como sprites 3D en el espacio del mundo
import * as THREE from 'three';

let _scene = null;
let _camera = null;
let _getPlayerPos = null;
let _interactDistance = 1.8;
let _imageContainer = null;
let _zorritoImageContainer = null;
let _keyHandler = null;
let _keyUpHandler = null;
let _escHandler = null;
let _raycaster = null;

let _placeholderSprites = {};
let _placeholderGroups = {};
const _pulseStates = {};

let _lastTime = performance.now();

/* -----------------------
   Overlays (sin cambios)
   ----------------------- */
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
  img.style.width = '800px';
  img.style.height = 'auto';
  img.style.transition = 'opacity 0.3s ease';
 
  c.appendChild(img);
  document.body.appendChild(c);
  _imageContainer = c;
  return c;
}

function showImage() {
  const container = createImageOverlay();
  container.style.display = 'block';
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

function createZorritoImageOverlay() {
  if (_zorritoImageContainer) return _zorritoImageContainer;
 
  const c = document.createElement('div');
  c.id = 'zorritoImagesContainer';
  c.style.position = 'fixed';
  c.style.top = '0';
  c.style.left = '0';
  c.style.width = '100%';
  c.style.height = '100%';
  c.style.display = 'none';
  c.style.zIndex = '1000';
  c.style.opacity = '0';
  c.style.transition = 'opacity 0.3s ease';
  c.style.pointerEvents = 'none';
 
  const imagesWrapper = document.createElement('div');
  imagesWrapper.style.position = 'relative';
  imagesWrapper.style.width = '100%';
  imagesWrapper.style.height = '100%';
  imagesWrapper.style.display = 'flex';
  imagesWrapper.style.alignItems = 'center';
  imagesWrapper.style.justifyContent = 'center';
  imagesWrapper.style.gap = '20px';
 
  const imgLeft = document.createElement('img');
  imgLeft.src = './assets/img/izquierda.png';
  imgLeft.style.width = 'auto';
  imgLeft.style.height = '80vh';
  imgLeft.style.maxWidth = '30%';
  imgLeft.style.objectFit = 'contain';
  imgLeft.style.transition = 'opacity 0.3s ease';
 
  const imgCenter = document.createElement('img');
  imgCenter.src = './assets/img/centro.png';
  imgCenter.style.width = 'auto';
  imgCenter.style.height = '80vh';
  imgCenter.style.maxWidth = '30%';
  imgCenter.style.objectFit = 'contain';
  imgCenter.style.transition = 'opacity 0.3s ease';
 
  const imgRight = document.createElement('img');
  imgRight.src = './assets/img/derecha.png';
  imgRight.style.width = 'auto';
  imgRight.style.height = '80vh';
  imgRight.style.maxWidth = '30%';
  imgRight.style.objectFit = 'contain';
  imgRight.style.transition = 'opacity 0.3s ease';
 
  imagesWrapper.appendChild(imgLeft);
  imagesWrapper.appendChild(imgCenter);
  imagesWrapper.appendChild(imgRight);
  c.appendChild(imagesWrapper);
  document.body.appendChild(c);
 
  _zorritoImageContainer = c;
  return c;
}

function showZorritoImages() {
  const container = createZorritoImageOverlay();
  container.style.display = 'block';
  container.offsetHeight;
  container.style.opacity = '1';
}

function hideZorritoImages() {
  if (_zorritoImageContainer) {
    _zorritoImageContainer.style.opacity = '0';
    setTimeout(() => {
      _zorritoImageContainer.style.display = 'none';
    }, 300);
  }
}

/* --------------------------------------
   Funciones para crear placeholders E
   -------------------------------------- */
function createPlaceholderSprite(imagePath, size = 0.5) {
  const loader = new THREE.TextureLoader();
  const texture = loader.load(imagePath, undefined, undefined, (err) => {
    console.warn('Error cargando placeholder:', err);
  });
 
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.01,
    depthTest: false,
    depthWrite: false
  });
 
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(size, size, 1);
  sprite.userData.isPlaceholder = true;
  sprite.frustumCulled = false;
  sprite.renderOrder = 10000;
 
  sprite.userData._zShift = 0.001;
  sprite.onBeforeRender = function () {
    if (!this.userData._zShiftApplied) {
      this.position.z += this.userData._zShift;
      this.userData._zShiftApplied = true;
    }
  };
  sprite.onAfterRender = function () {
    if (this.userData._zShiftApplied) {
      this.position.z -= this.userData._zShift;
      this.userData._zShiftApplied = false;
    }
  };
 
  return sprite;
}

function createEImagePlaceholder(size = 0.18) {
  const imagePath = './assets/img/E.png';
  return createPlaceholderSprite(imagePath, size);
}

/* --------------------------------------
   Setup (listeners y lógica KeyE)
   -------------------------------------- */
export function setupPlaceholders(options) {
  _scene = options.scene;
  _camera = options.camera;
  _getPlayerPos = options.getPlayerPosition;
  if (options.distance) _interactDistance = options.distance;
 
  _raycaster = new THREE.Raycaster();
  let isShowingImage = false;
  let isShowingZorritoImages = false;
  let isKeyDown = false;

  _keyHandler = function(e) {
    if (e.code !== 'KeyE') return;
    if (isKeyDown) return;
    isKeyDown = true;
    const playerPos = _getPlayerPos && _getPlayerPos();
    if (!playerPos) return;
    const playerVec = (playerPos.position && playerPos.position.isVector3)
      ? playerPos.position
      : (playerPos.isVector3 ? playerPos : (playerPos.position || null));
    if (!playerVec) return;

    let nearest = null;
    let nd = Infinity;
    Object.keys(window.characters || {}).forEach((k) => {
      const obj = window.characters[k];
      if (!obj) return;
      const d = playerVec.distanceTo(obj.position);
      if (d < nd) {
        nd = d;
        nearest = { k, obj, d };
      }
    });

    if (nearest && nd <= _interactDistance && nearest.k === 'me' && !isShowingImage && !isShowingZorritoImages) {
      showImage();
      isShowingImage = true;
    }
    else if (nearest && nd <= _interactDistance && nearest.k === 'zorrito' && !isShowingZorritoImages && !isShowingImage) {
      showZorritoImages();
      isShowingZorritoImages = true;
    }
  };

  _keyUpHandler = function(e) {
    if (e.code === 'KeyE') {
      isKeyDown = false;
    }
  };

  _escHandler = function(e) {
    if (!_scene || !_camera) return;
    if (e.code === 'Escape') {
      if (isShowingImage) {
        e.stopImmediatePropagation();
        e.preventDefault();
        hideImage();
        isShowingImage = false;
        return false;
      }
      if (isShowingZorritoImages) {
        e.stopImmediatePropagation();
        e.preventDefault();
        hideZorritoImages();
        isShowingZorritoImages = false;
        return false;
      }
    }
  };

  setTimeout(() => {
    document.addEventListener('keydown', _escHandler, true);
    document.addEventListener('keydown', _keyHandler);
    document.addEventListener('keyup', _keyUpHandler);
  }, 100);
}

/* --------------------------------------
   updatePlaceholders (se llama cada frame)
   -------------------------------------- */
export function updatePlaceholders() {
  if (!_scene || !_camera) return;
 
  const now = performance.now();
  const dt = (now - _lastTime) / 1000;
  _lastTime = now;

  if (!window.screenManager || window.screenManager.currentScreen !== 2) {
    Object.keys(_placeholderGroups).forEach((key) => {
      const g = _placeholderGroups[key];
      if (g) g.visible = false;
    });
    return;
  }
 
  const chars = window.characters || {};
  const playerPos = _getPlayerPos && _getPlayerPos();
  const playerVec = (playerPos && playerPos.position && playerPos.position.isVector3)
    ? playerPos.position
    : (playerPos && playerPos.isVector3 ? playerPos : (playerPos && playerPos.position ? playerPos.position : null));
  if (!playerVec) return;

  Object.keys(chars).forEach((key) => {
    const obj = chars[key];
    if (!obj) return;
   
    // Distancia real en 3D
    const worldPos = new THREE.Vector3();
    obj.getWorldPosition(worldPos);
    const distanceToPlayer = playerVec.distanceTo(worldPos);

    // Distancia personalizada (si el personaje la define)
    let characterDistance = _interactDistance;
    if (obj.userData && obj.userData.hintDistance !== undefined) {
      characterDistance = Number(obj.userData.hintDistance) || _interactDistance;
    }

    const shouldShow = distanceToPlayer <= characterDistance;

    if (shouldShow) {
      // Asegurar grupo / sprite
      if (!_placeholderGroups[key]) {
        const group = new THREE.Group();
        const spriteSize = obj.userData && obj.userData.hintSpriteSize ? Number(obj.userData.hintSpriteSize) : 0.18;
        const sprite = createEImagePlaceholder(spriteSize);

        if (key === 'zorrito') {
          sprite.scale.set(0.3, 0.3, 1);
        }

        group.add(sprite);
        group.frustumCulled = false;
        group.renderOrder = 10000;
        _placeholderGroups[key] = group;
        _placeholderSprites[key] = sprite;
        _pulseStates[key] = { phase: Math.random() * Math.PI * 2 };
        _scene.add(group);
      }

      const group = _placeholderGroups[key];
      const sprite = _placeholderSprites[key];

      if (!group.parent) _scene.add(group);
      group.visible = true;
      sprite.visible = true;

      // Posicionamiento con offset
      const finalPos = worldPos.clone();
      if (obj.userData && obj.userData.hintOffset) {
        const ho = obj.userData.hintOffset;
        if (typeof ho === 'object' && ho !== null) {
          finalPos.x += Number(ho.x) || 0;
          finalPos.y += Number(ho.y) || 0;
          finalPos.z += Number(ho.z) || 0;
        } else if (typeof ho === 'number') {
          finalPos.y += ho;
        }
      }

      group.position.lerp(finalPos, 0.25);

      // Billboard
      try { group.lookAt(_camera.position); } catch (e) {}

      // Escala en función de la distancia para mantener tamaño visual consistente
      const baseScale = (key === 'zorrito') ? 0.28 : 0.18;
      const minScale = baseScale * 0.75;
      const maxScale = baseScale * 1.5;
      const scale = THREE.MathUtils.clamp(baseScale * (1.0 + 0.3 / Math.max(distanceToPlayer, 0.2)), minScale, maxScale);
      sprite.scale.set(scale, scale, 1);

      // Pulso (efecto de latido suave)
      const ps = _pulseStates[key] || { phase: 0 };
      ps.phase += dt * 4.0;
      const opacity = 0.8 + 0.2 * Math.sin(ps.phase);
      if (sprite.material) {
        sprite.material.opacity = opacity;
        sprite.material.needsUpdate = true;
      }
      _pulseStates[key] = ps;
    } else {
      if (_placeholderGroups[key]) {
        _placeholderGroups[key].visible = false;
        if (_pulseStates[key]) _pulseStates[key].phase = 0;
      }
    }
  });
}

/* --------------------------------------
   Limpieza / Dispose
   -------------------------------------- */
export function disposePlaceholders() {
  try {
    document.removeEventListener('keydown', _keyHandler);
    document.removeEventListener('keyup', _keyUpHandler);
    document.removeEventListener('keydown', _escHandler, true);
  } catch(e) {}

  try {
    Object.keys(_placeholderGroups).forEach((key) => {
      const group = _placeholderGroups[key];
      if (group && _scene) {
        _scene.remove(group);
        group.traverse((child) => {
          if (child.isSprite && child.material) {
            if (child.material.map) {
              try { child.material.map.dispose(); } catch(e) {}
            }
            try { child.material.dispose(); } catch(e) {}
          }
        });
      }
    });
  } catch(e) {
    console.error('Error removing placeholder groups:', e);
  }
   
  try {
    if (_imageContainer && _imageContainer.parentNode) {
      _imageContainer.parentNode.removeChild(_imageContainer);
    }
    if (_zorritoImageContainer && _zorritoImageContainer.parentNode) {
      _zorritoImageContainer.parentNode.removeChild(_zorritoImageContainer);
    }
  } catch(e) {}
   
  _keyHandler = null;
  _keyUpHandler = null;
  _escHandler = null;
  _imageContainer = null;
  _zorritoImageContainer = null;
  _scene = null;
  _camera = null;
  _getPlayerPos = null;
  _raycaster = null;
  _placeholderSprites = {};
  _placeholderGroups = {};
  Object.keys(_pulseStates).forEach(k => delete _pulseStates[k]);
}