// === audioManager.js (CORREGIDO Y LIMPIO) ===

// Cargamos las canciones con rutas relativas a la carpeta Audio
const menuMusic = new Audio('Audio/Hip Shop - Toby Fox.mp3');
const gameMusic = new Audio('Audio/Death By Glamour - Toby Fox.mp3');

// Activamos loop
menuMusic.loop = true;
gameMusic.loop = true;

// Ajusta volumen si quieres
menuMusic.volume = 0.5;
gameMusic.volume = 0.5;

// Precarga los archivos
menuMusic.load();
gameMusic.load();

// Control general de música
function playMenuMusic() {
  // NO llames a stopAllMusic() aquí.
  menuMusic.currentTime = 0;
  menuMusic.play().catch((e) => {
    // La interacción del usuario (clic en Start) se gestionará en los otros scripts.
    console.warn('Autoplay bloqueado, esperando interacción del usuario...', e);
  });
  // NO añadas un listener de click de respaldo aquí.
}

function playGameMusic() {
  // NO llames a stopAllMusic() aquí.
  gameMusic.currentTime = 0;
  gameMusic.play().catch((e) => {
    // El clic en "Start" ya debería haber dado permiso al navegador.
    console.warn('Error al reproducir música del juego:', e);
  });
  // NO añadas un listener de click de respaldo aquí.
}

function stopAllMusic() {
  menuMusic.pause();
  gameMusic.pause();
}

export { playMenuMusic, playGameMusic, stopAllMusic };