// pause.js -- manejador del menú de pausa
document.addEventListener('DOMContentLoaded', () => {
  const panel = document.getElementById('panelEsc');
  const resumeBtn = document.getElementById('resumeBtn');
  const menuBtn = document.getElementById('menuBtn');

  if (!panel) return;

  function showPause() {
    panel.classList.add('active');
    panel.setAttribute('aria-hidden', 'false');
    window.gamePaused = true;
    // Pausar música del juego si existe
    try { if (window.musicManager && window.musicManager.gameMusic) window.musicManager.gameMusic.pause(); } catch(e){}
  }

  function hidePause() {
    panel.classList.remove('active');
    panel.setAttribute('aria-hidden', 'true');
    window.gamePaused = false;
    // Reanudar música del juego si existe
    try { if (window.musicManager && window.musicManager.gameMusic) window.musicManager.gameMusic.play().catch(()=>{}); } catch(e){}
  }

  // Toggle con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (panel.classList.contains('active')) hidePause();
      else showPause();
    }
  });

  // Botón de volver al juego
  if (resumeBtn) resumeBtn.addEventListener('click', () => {
    hidePause();
  });

  // Botón de volver al menú
  if (menuBtn) menuBtn.addEventListener('click', () => {
    // Parar música del juego
    try { if (window.musicManager) window.musicManager.stopAll(); } catch(e){}
    window.gamePaused = false;

    // Intentar destruir el juego (cancelar loop y liberar recursos) si está disponible
    try { if (typeof window.destroyGame === 'function') { window.destroyGame(); } } catch(e) { console.warn('destroyGame failed', e); }

    // Recargar la página para restablecer el menú y la música de forma fiable
    // Esto evita reconstruir manualmente DOM y la inicialización de módulos cargados como ES modules.
    setTimeout(() => {
      window.location.reload();
    }, 100);
  });
});
