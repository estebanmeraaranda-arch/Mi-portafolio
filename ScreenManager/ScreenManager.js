document.addEventListener("DOMContentLoaded", () => {
  import("../main.js");
  import("../fireflies.js");

  const screen1 = document.getElementById("screen1");
  const screen2 = document.getElementById("screen2");
  const startButton = document.getElementById("start");

  if (!startButton || !screen1 || !screen2) {
    console.error("❌ No se encontraron los elementos necesarios (screen1, screen2 o start).");
    return;
  }

  startButton.addEventListener("click", () => {
    console.log("✅ Click detectado, cambiando de pantalla...");

    // Transición visual
    screen1.style.opacity = 0;
    screen1.style.pointerEvents = "none";

    setTimeout(() => {
      screen1.style.display = "none";
      screen2.style.display = "block";
      screen2.style.opacity = 0;

      setTimeout(() => {
        screen2.style.opacity = 1;
      }, 50);
    }, 800);
  });
});
