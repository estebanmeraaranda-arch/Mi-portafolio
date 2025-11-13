// Placeholders.js
// Control de los indicadores "E" e imágenes overlay para cada personaje/lugar
import * as THREE from 'three';

let _scene = null;
let _camera = null;
let _getPlayerPos = null;
let _interactDistance = 1.8;
let _imageContainer = null;
let _zorritoImageContainer = null;
let _studyImageContainer = null;
let _keyHandler = null;
let _keyUpHandler = null;
let _escHandler = null;
let _raycaster = null;

let _placeholderSprites = {};
let _placeholderGroups = {};
const _pulseStates = {};

let _lastTime = performance.now();

/* --------------------------------------------------------------------------
   🧍 PLACEHOLDER 1 — YO (imagen YOGAME.PNG)
-------------------------------------------------------------------------- */
function createImageOverlay() {
  if (_imageContainer) return _imageContainer;

  const c = document.createElement('div');
  c.id = 'yogameContainer';
  c.style.position = 'fixed';
  c.style.top = '0';
  c.style.left = '0';
  c.style.width = '100%';
  c.style.height = '100%';
  c.style.display = 'none';
  c.style.zIndex = '1000';
  c.style.opacity = '0';
  c.style.transition = 'opacity 0.3s ease';
  c.style.pointerEvents = 'auto';
  c.style.alignItems = 'center';
  c.style.justifyContent = 'center';
  c.style.background = 'rgba(0,0,0,0.6)';

  const wrapper = document.createElement('div');
  wrapper.style.maxWidth = '90vw';
  wrapper.style.maxHeight = '90vh';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';

  const img = document.createElement('img');
  img.src = './assets/img/YOGAME.png';
  img.alt = 'YO';
  img.style.display = 'block';
  img.style.width = 'auto';
  img.style.height = '80vh';
  img.style.maxWidth = '95%';
  img.style.objectFit = 'contain';
  img.style.transition = 'transform 0.2s ease, opacity 0.2s ease';

  img.addEventListener('mouseenter', () => {
    img.style.transform = 'scale(1.03)';
    img.style.opacity = '0.95';
  });
  img.addEventListener('mouseleave', () => {
    img.style.transform = 'scale(1)';
    img.style.opacity = '1';
  });

  img.addEventListener('error', () => {
    console.warn('⚠️ No se pudo cargar ./assets/img/YOGAME.png');
    img.style.display = 'none';
    const t = document.createElement('div');
    t.textContent = 'Imagen no encontrada';
    t.style.color = '#fff';
    t.style.fontSize = '18px';
    t.style.padding = '12px';
    wrapper.appendChild(t);
  });

  c.addEventListener('click', (ev) => {
    if (ev.target === c) hideImage();
  });

  wrapper.appendChild(img);
  c.appendChild(wrapper);
  document.body.appendChild(c);
  _imageContainer = c;
  return c;
}

function showImage() {
  const c = createImageOverlay();
  c.style.display = 'flex';
  c.offsetHeight;
  c.style.opacity = '1';
}
function hideImage() {
  if (_imageContainer) {
    _imageContainer.style.opacity = '0';
    setTimeout(() => (_imageContainer.style.display = 'none'), 300);
  }
}
/* --------------------------------------------------------------------------
   🦊 PLACEHOLDER 2 — ZORRITO (izquierda/centro unidos, derecha independiente)
-------------------------------------------------------------------------- */
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
  c.style.pointerEvents = 'auto';
  c.style.alignItems = 'center';
  c.style.justifyContent = 'center';
  c.style.background = 'rgba(0,0,0,0.6)';

  // Contenedor principal: dos columnas
  //  - leftCol: contiene las dos imágenes (izquierda + centro) con la misma altura (80vh)
  //  - rightCol: contiene la imagen derecha con tamaño independiente (60vh)
  const mainWrapper = document.createElement('div');
  mainWrapper.style.display = 'flex';
  mainWrapper.style.alignItems = 'center';
  mainWrapper.style.justifyContent = 'center';
  mainWrapper.style.gap = '24px';
  mainWrapper.style.maxWidth = '95vw';
  mainWrapper.style.height = '80vh';
  mainWrapper.style.margin = 'auto';
  mainWrapper.style.boxSizing = 'border-box';

  // LEFT COLUMN: dos imágenes iguales (izquierda + centro)
  const leftCol = document.createElement('div');
  leftCol.style.display = 'flex';
  leftCol.style.flexDirection = 'row';
  leftCol.style.gap = '16px';
  leftCol.style.flex = '1 1 60%';
  leftCol.style.alignItems = 'center';
  leftCol.style.justifyContent = 'center';
  leftCol.style.height = '100%';

  const leftPaths = [
    './assets/img/izquierda.png',
    './assets/img/centro.png'
  ];
  for (const path of leftPaths) {
    const imgWrapper = document.createElement('div');
    imgWrapper.style.flex = '1';
    imgWrapper.style.display = 'flex';
    imgWrapper.style.alignItems = 'center';
    imgWrapper.style.justifyContent = 'center';
    imgWrapper.style.height = '100%';
    imgWrapper.style.boxSizing = 'border-box';

    const img = document.createElement('img');
    img.src = path;
    img.style.display = 'block';
    img.style.height = '100%';    // ambas tendrán la misma altura (80vh del mainWrapper)
    img.style.width = 'auto';
    img.style.maxWidth = '100%';
    img.style.objectFit = 'contain';
    img.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
    img.style.filter = 'drop-shadow(0 0 8px rgba(0,0,0,0.45))';

    img.addEventListener('mouseenter', () => { img.style.transform = 'scale(1.03)'; img.style.opacity = '0.95'; });
    img.addEventListener('mouseleave', () => { img.style.transform = 'scale(1)'; img.style.opacity = '1'; });

    imgWrapper.appendChild(img);
    leftCol.appendChild(imgWrapper);
  }

  // RIGHT COLUMN: imagen independiente (DERECHA.PNG) con su propio tamaño
  const rightCol = document.createElement('div');
  rightCol.style.display = 'flex';
  rightCol.style.flex = '0 0 32%'; // ocupa ~32% del ancho; ajusta si quieres
  rightCol.style.alignItems = 'center';
  rightCol.style.justifyContent = 'center';
  rightCol.style.height = '100%';

  const rightImg = document.createElement('img');
  rightImg.src = './assets/img/DERECHA.PNG';
  rightImg.style.display = 'block';
  rightImg.style.height = '120vh';   // <- TAMAÑO INDEPENDIENTE: cambia este valor si quieres
  rightImg.style.width = 'auto';
  rightImg.style.maxWidth = '100%';
  rightImg.style.objectFit = 'contain';
  rightImg.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
  rightImg.style.filter = 'drop-shadow(0 0 8px rgba(0,0,0,0.45))';

  rightImg.addEventListener('mouseenter', () => { rightImg.style.transform = 'scale(1.03)'; rightImg.style.opacity = '0.95'; });
  rightImg.addEventListener('mouseleave', () => { rightImg.style.transform = 'scale(1)'; rightImg.style.opacity = '1'; });

  rightCol.appendChild(rightImg);

  // Ensamblar
  mainWrapper.appendChild(leftCol);
  mainWrapper.appendChild(rightCol);
  c.appendChild(mainWrapper);

  // Click fuera para cerrar
  c.addEventListener('click', (ev) => {
    if (ev.target === c) hideZorritoImages();
  });

  document.body.appendChild(c);
  _zorritoImageContainer = c;
  return c;
}

function showZorritoImages() {
  const c = createZorritoImageOverlay();
  c.style.display = 'flex';
  // fuerza reflow para transición
  // eslint-disable-next-line no-unused-expressions
  c.offsetHeight;
  c.style.opacity = '1';
}

function hideZorritoImages() {
  if (_zorritoImageContainer) {
    _zorritoImageContainer.style.opacity = '0';
    setTimeout(() => {
      _zorritoImageContainer.style.display = 'none';
    }, 300);
  }
}


/* --------------------------------------------------------------------------
   🏠 PLACEHOLDER 3 — CASA (imagen ESTUDIO.PNG)
-------------------------------------------------------------------------- */
function createStudyOverlay() {
  if (_studyImageContainer) return _studyImageContainer;

  const c = document.createElement('div');
  c.id = 'studyImageContainer';
  c.style.position = 'fixed';
  c.style.top = '0';
  c.style.left = '0';
  c.style.width = '100%';
  c.style.height = '100%';
  c.style.display = 'none';
  c.style.zIndex = '1000';
  c.style.opacity = '0';
  c.style.transition = 'opacity 0.3s ease';
  c.style.pointerEvents = 'auto';
  c.style.alignItems = 'center';
  c.style.justifyContent = 'center';
  c.style.background = 'rgba(0,0,0,0.6)';

  const wrapper = document.createElement('div');
  wrapper.style.maxWidth = '90vw';
  wrapper.style.maxHeight = '90vh';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';

  const img = document.createElement('img');
  img.src = './assets/img/ESTUDIO.PNG';
  img.alt = 'ESTUDIO';
  img.style.height = '80vh';
  img.style.objectFit = 'contain';
  img.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
  img.addEventListener('mouseenter', () => { img.style.transform = 'scale(1.03)'; img.style.opacity = '0.95'; });
  img.addEventListener('mouseleave', () => { img.style.transform = 'scale(1)'; img.style.opacity = '1'; });

  c.addEventListener('click', (ev) => {
    if (ev.target === c) hideStudyImage();
  });

  wrapper.appendChild(img);
  c.appendChild(wrapper);
  document.body.appendChild(c);
  _studyImageContainer = c;
  return c;
}

function showStudyImage() {
  const c = createStudyOverlay();
  c.style.display = 'flex';
  c.offsetHeight;
  c.style.opacity = '1';
}
function hideStudyImage() {
  if (_studyImageContainer) {
    _studyImageContainer.style.opacity = '0';
    setTimeout(() => (_studyImageContainer.style.display = 'none'), 300);
  }
}

/* --------------------------------------------------------------------------
   🔤 SPRITE (E)
-------------------------------------------------------------------------- */
function createPlaceholderSprite(imagePath, size = 0.5) {
  const loader = new THREE.TextureLoader();
  const texture = loader.load(imagePath);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.01,
    depthTest: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(size, size, 1);
  sprite.frustumCulled = false;
  sprite.renderOrder = 10000;
  return sprite;
}
function createEImagePlaceholder(size = 0.18) {
  return createPlaceholderSprite('./assets/img/E.png', size);
}

/* --------------------------------------------------------------------------
   ⚙️ SETUP (teclas y eventos)
-------------------------------------------------------------------------- */
export function setupPlaceholders({ scene, camera, getPlayerPosition, distance = 1.8 }) {
  _scene = scene;
  _camera = camera;
  _getPlayerPos = getPlayerPosition;
  _interactDistance = distance;

  _keyHandler = function (e) {
    if (e.code !== 'KeyE') return;
    const playerPos = _getPlayerPos && _getPlayerPos();
    if (!playerPos) return;
    const p = playerPos.position || playerPos;
    const chars = window.characters || {};

    // Encontrar personaje más cercano
    let nearest = null;
    let nd = Infinity;
    Object.keys(chars).forEach((k) => {
      const obj = chars[k];
      if (!obj) return;
      const d = p.distanceTo(obj.position);
      if (d < nd) { nd = d; nearest = { key: k, obj }; }
    });

    if (!nearest || nd > _interactDistance) return;

    // Mostrar overlay correspondiente
    if (nearest.key === 'me') showImage();
    else if (nearest.key === 'zorrito') showZorritoImages();
    else if (nearest.key === 'casa') showStudyImage();
  };

  _escHandler = function (e) {
    if (e.code === 'Escape') {
      hideImage();
      hideZorritoImages();
      hideStudyImage();
    }
  };

  document.addEventListener('keydown', _keyHandler);
  document.addEventListener('keydown', _escHandler);
}

/* --------------------------------------------------------------------------
   🔁 UPDATE (animación y posición)
-------------------------------------------------------------------------- */
export function updatePlaceholders() {
  if (!_scene || !_camera) return;
  const chars = window.characters || {};
  const playerPos = _getPlayerPos && _getPlayerPos();
  const p = playerPos.position || playerPos;

  Object.keys(chars).forEach((key) => {
    const obj = chars[key];
    if (!obj) return;
    const worldPos = new THREE.Vector3();
    obj.getWorldPosition(worldPos);
    const dist = p.distanceTo(worldPos);

    const limit = obj.userData?.hintDistance ?? _interactDistance;
    const show = dist <= limit;

    if (show) {
      if (!_placeholderGroups[key]) {
        const g = new THREE.Group();
        const s = createEImagePlaceholder(obj.userData?.hintSpriteSize ?? 0.18);
        g.add(s);
        _scene.add(g);
        _placeholderGroups[key] = g;
        _placeholderSprites[key] = s;
      }

      const g = _placeholderGroups[key];
      const s = _placeholderSprites[key];
      g.visible = true;

      const pos = worldPos.clone();
      if (obj.userData?.hintOffset) {
        const o = obj.userData.hintOffset;
        pos.x += o.x || 0;
        pos.y += o.y || 0;
        pos.z += o.z || 0;
      }

      g.position.lerp(pos, 0.25);
      g.lookAt(_camera.position);
      s.material.opacity = 0.8 + 0.2 * Math.sin(performance.now() * 0.005);
    } else if (_placeholderGroups[key]) {
      _placeholderGroups[key].visible = false;
    }
  });
}

/* --------------------------------------------------------------------------
   🧹 CLEANUP
-------------------------------------------------------------------------- */
export function disposePlaceholders() {
  document.removeEventListener('keydown', _keyHandler);
  document.removeEventListener('keydown', _escHandler);
  if (_scene) {
    Object.values(_placeholderGroups).forEach((g) => _scene.remove(g));
  }
  [_imageContainer, _zorritoImageContainer, _studyImageContainer].forEach((el) => {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  });
  _imageContainer = _zorritoImageContainer = _studyImageContainer = null;
  _scene = _camera = _getPlayerPos = null;
}
