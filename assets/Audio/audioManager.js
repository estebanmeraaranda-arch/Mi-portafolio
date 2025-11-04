export class MusicManager {
  constructor() {
    this.menuMusic = new Audio("./assets/Audio/Hip Shop - Toby Fox.mp3");
    this.gameMusic = new Audio("./assets/Audio/Death By Glamour - Toby Fox.mp3");

    this.menuMusic.loop = true;
    this.gameMusic.loop = true;
    this.menuMusic.volume = 0.6;
    this.gameMusic.volume = 0.6;
  }

  playMenu() {
    this.stopAll();
    this.menuMusic.currentTime = 0;
    this.menuMusic.play().catch(err => console.warn("🎧 Autoplay bloqueado hasta interacción:", err));
  }

  playGame() {
    this.stopAll();
    this.gameMusic.currentTime = 0;
    this.gameMusic.play().catch(err => console.warn("🎧 Autoplay bloqueado hasta interacción:", err));
  }

  stopAll() {
    this.menuMusic.pause();
    this.gameMusic.pause();
  }

  fadeOut(audio, duration = 1000) {
    const step = audio.volume / (duration / 100);
    const fade = setInterval(() => {
      if (audio.volume - step > 0) {
        audio.volume -= step;
      } else {
        clearInterval(fade);
        audio.pause();
        audio.volume = 0.6;
      }
    }, 100);
  }
}