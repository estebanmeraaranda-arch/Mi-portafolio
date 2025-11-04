// --- fireflies.js ---

import * as THREE from 'three';

export class Fireflies {
  constructor(scene) {
    this.scene = scene;
    this.fireflies = [];
    this.createFireflies();
    this.animate();
  }

  createFireflies() {
    const count = 50;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 5 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffaa,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points); // ✅ escena válida
  }

  animate() {
    setInterval(() => {
      const positions = this.points.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        positions.array[i * 3 + 1] += Math.sin(Date.now() * 0.001 + i) * 0.002;
      }
      positions.needsUpdate = true;
    }, 16);
  }
}
