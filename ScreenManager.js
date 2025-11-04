class ScreenManager {
  constructor() {
    this.currentScreen = 1;
    this.transitioning = false;

    // Obtener referencias a las pantallas
    this.screen1 = document.getElementById("screen1");
    this.screen2 = document.getElementById("screen2");

    if (!this.screen1 || !this.screen2) {
      console.error("❌ No se encontraron las pantallas necesarias");
      return;
    }

    // Configurar event listeners
    this.setupEventListeners();
    console.log("✅ ScreenManager inicializado");
  }

  setupEventListeners() {
    // Escuchar el evento changeScreen
    window.addEventListener("changeScreen", (event) => this.handleScreenChange(event));
  }

  handleScreenChange(event) {
    console.log("🔄 Evento changeScreen recibido:", event.detail);
    this.changeToScreen(event.detail);
  }

  changeToScreen(screenNumber) {
    if (this.transitioning || screenNumber === this.currentScreen) return;
    console.log(`🔄 Cambiando a pantalla ${screenNumber}`);

    this.transitioning = true;
    const [fromScreen, toScreen] = screenNumber === 2 ? 
      [this.screen1, this.screen2] : [this.screen2, this.screen1];

    // Iniciar transición
    fromScreen.style.opacity = "0";
    fromScreen.classList.add("hidden");
    fromScreen.classList.remove("active");

    // Mostrar nueva pantalla
    toScreen.classList.remove("hidden");
    toScreen.classList.add("active");
    setTimeout(() => {
      toScreen.style.opacity = "1";
      this.transitioning = false;
      this.currentScreen = screenNumber;
      console.log(`✅ Cambio a pantalla ${screenNumber} completado`);
    }, 50);
  }
}

// Crear instancia cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  window.screenManager = new ScreenManager();
});
