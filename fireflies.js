import * as THREE from 'three';

class Fireflies {
  constructor(scene, count = 100) {
    this.scene = scene;
    this.count = count;
    this.clock = new THREE.Clock();
    this.fireflies = null;
    this.createFireflies();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  createFireflies() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const colors = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 5 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 0.6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.fireflies = new THREE.Points(geometry, material);
    this.scene.add(this.fireflies);
  }

  animate() {
    const time = this.clock.getElapsedTime();
    const positions = this.fireflies.geometry.attributes.position;

    for (let i = 0; i < this.count; i++) {
      const index = i * 3;
      positions.array[index + 1] += Math.sin(time * 2 + i) * 0.005;
    }

    positions.needsUpdate = true;
    requestAnimationFrame(this.animate);
  }
}

// Esperar a que la escena esté disponible desde el main
const waitForScene = setInterval(() => {
  if (window.scene) {
    new Fireflies(window.scene, 120);
    clearInterval(waitForScene);
  }
}, 200);
