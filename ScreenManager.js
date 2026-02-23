class ScreenManager {
  constructor() {
    this.currentScreen = 1;
    this.transitioning = false;
    this.controlsOverlay = null;
    this.escHandler = null;

    this.screen1 = document.getElementById('screen1');
    this.screen2 = document.getElementById('screen2');

    if (!this.screen1 || !this.screen2) {
      console.error('No se encontraron las pantallas necesarias');
      return;
    }

    this.setupEventListeners();
    console.log('ScreenManager inicializado');
  }

  setupEventListeners() {
    window.addEventListener('changeScreen', (event) => this.handleScreenChange(event));
  }

  handleScreenChange(event) {
    console.log('Evento changeScreen recibido:', event.detail);
    this.changeToScreen(event.detail);
  }

  createControlsOverlay() {
    if (this.controlsOverlay) return this.controlsOverlay;

    const c = document.createElement('div');
    c.id = 'controlsOverlay';
    c.style.position = 'fixed';
    c.style.top = '0';
    c.style.left = '0';
    c.style.width = '100%';
    c.style.height = '100%';
    c.style.display = 'none';
    c.style.alignItems = 'center';
    c.style.justifyContent = 'center';
    c.style.background = 'rgba(0,0,0,0.65)';
    c.style.zIndex = '1200';
    c.style.opacity = '0';
    c.style.transition = 'opacity 0.25s ease';

    const img = document.createElement('img');
    img.src = './assets/Img/Controles.png';
    img.alt = 'Controles';
    img.style.maxWidth = '70vw';
    img.style.maxHeight = '70vh';
    img.style.objectFit = 'contain';
    img.style.boxShadow = '0 12px 40px rgba(0,0,0,0.45)';
    img.style.borderRadius = '12px';

    c.appendChild(img);
    document.body.appendChild(c);
    c.addEventListener('click', (ev) => {
      if (ev.target === c) this.hideControlsOverlay();
    });

    this.escHandler = (e) => {
      if (e.code === 'Escape') this.hideControlsOverlay();
    };
    document.addEventListener('keydown', this.escHandler);

    this.controlsOverlay = c;
    return c;
  }

  showControlsOverlay() {
    const c = this.createControlsOverlay();
    c.style.display = 'flex';
    void c.offsetHeight; // reflow
    c.style.opacity = '1';
  }

  hideControlsOverlay() {
    if (!this.controlsOverlay) return;
    this.controlsOverlay.style.opacity = '0';
    setTimeout(() => {
      this.controlsOverlay.style.display = 'none';
    }, 250);
  }

  changeToScreen(screenNumber) {
    if (this.transitioning || screenNumber === this.currentScreen) return;
    console.log(`Cambiando a pantalla ${screenNumber}`);

    this.transitioning = true;
    const [fromScreen, toScreen] = screenNumber === 2
      ? [this.screen1, this.screen2]
      : [this.screen2, this.screen1];

    fromScreen.style.opacity = '0';
    fromScreen.classList.add('hidden');
    fromScreen.classList.remove('active');

    toScreen.classList.remove('hidden');
    toScreen.classList.add('active');
    setTimeout(() => {
      toScreen.style.opacity = '1';
      this.transitioning = false;
      this.currentScreen = screenNumber;
      try {
        if (window.musicManager) {
          if (screenNumber === 2) {
            window.musicManager.playGame();
          } else {
            window.musicManager.playMenu();
          }
        }
      } catch (e) {
        console.warn('music switch error', e);
      }

      if (screenNumber === 2) {
        this.showControlsOverlay();
      }

      console.log(`Cambio a pantalla ${screenNumber} completado`);
    }, 50);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.screenManager = new ScreenManager();
});
