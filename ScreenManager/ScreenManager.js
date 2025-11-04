// === ScreenManager/ScreenManager.js (MODIFICADO) ===

// 1. ELIMINA LA IMPORTACIÓN DE stopAllMusic
// import { stopAllMusic } from '../Audio/audioManager.js'; // <- BORRA ESTA LÍNEA

document.addEventListener("DOMContentLoaded", () => {
  // Importamos el juego y los efectos
  import("../main.js");
  import("../fireflies.js");

  const screen1 = document.getElementById("screen1");
  const screen2 = document.getElementById("screen2");
  const startButton = document.getElementById("start");

  if (!startButton || !screen1 || !screen2) {
    console.error("❌ No se encontraron los elementos necesarios (screen1, screen2 o start).");
    return;
  }

// ... (inicio del archivo, código anterior) ...

  startButton.addEventListener("click", () => {
    console.log("✅ Click detectado, cambiando de pantalla...");

    // Transición visual
    screen1.classList.remove('active');
    screen1.classList.add('hidden');
    
    // Esperamos a que la animación de 'fade out' termine
    setTimeout(() => {
      screen2.classList.remove('hidden');
      screen2.classList.add('active');
      
      // 3. Disparamos el evento
      window.dispatchEvent(new CustomEvent("changeScreen", { detail: 2 }));

      // ✨ ¡AÑADE ESTA LÍNEA DE NUEVO! ✨
      // La solicitamos aquí, ya que el canvas está visible.
      document.body.requestPointerLock();

    }, 800); // 800ms para la transición
  });
});