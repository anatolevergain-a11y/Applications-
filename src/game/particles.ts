import * as THREE from 'three';

export interface ParticleSystem {
  group: THREE.Group;
  emitSnowSpray: (x: number, y: number, z: number, count: number, speed: number, spreadDir: number) => void;
  emitConfetti: (x: number, y: number, z: number) => void;
  update: (playerZ: number, delta: number, blizzardIntensity: number) => void;
  reset: () => void;
}

export function createParticleSystem(scene: THREE.Scene): ParticleSystem {
  const group = new THREE.Group();
  scene.add(group);

  // 1. Ambient Falling Snow Particles
  const SNOW_COUNT = 1500;
  const snowGeo = new THREE.BufferGeometry();
  const snowPositions = new Float32Array(SNOW_COUNT * 3);
  const snowVelocities = new Float32Array(SNOW_COUNT * 3);

  for (let i = 0; i < SNOW_COUNT; i++) {
    snowPositions[i * 3 + 0] = (Math.random() - 0.5) * 80; // x
    snowPositions[i * 3 + 1] = Math.random() * 25;         // y
    snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 120; // z

    snowVelocities[i * 3 + 0] = (Math.random() - 0.5) * 2;
    snowVelocities[i * 3 + 1] = -(4 + Math.random() * 6);
    snowVelocities[i * 3 + 2] = -(Math.random() * 4);
  }

  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));

  // Circular soft snowflake texture
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.5, 'rgba(230,245,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();

  const snowTex = new THREE.CanvasTexture(canvas);

  const snowMat = new THREE.PointsMaterial({
    map: snowTex,
    size: 0.55,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const ambientSnow = new THREE.Points(snowGeo, snowMat);
  group.add(ambientSnow);

  // 2. Dynamic Carving Snow Spray Particles
  const SPRAY_COUNT = 300;
  const sprayGeo = new THREE.BufferGeometry();
  const sprayPositions = new Float32Array(SPRAY_COUNT * 3);
  const sprayVelocities = new Float32Array(SPRAY_COUNT * 3);
  const sprayLifetimes = new Float32Array(SPRAY_COUNT); // remaining life 0..1

  // Initialize invisible / dead
  for (let i = 0; i < SPRAY_COUNT; i++) {
    sprayPositions[i * 3 + 1] = -100;
    sprayLifetimes[i] = 0;
  }

  sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPositions, 3));

  const sprayMat = new THREE.PointsMaterial({
    map: snowTex,
    size: 0.65,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });

  const sprayPoints = new THREE.Points(sprayGeo, sprayMat);
  group.add(sprayPoints);

  let nextSprayIdx = 0;

  function emitSnowSpray(x: number, y: number, z: number, count: number, speed: number, spreadDir: number) {
    for (let c = 0; c < count; c++) {
      const idx = nextSprayIdx;
      nextSprayIdx = (nextSprayIdx + 1) % SPRAY_COUNT;

      sprayPositions[idx * 3 + 0] = x + (Math.random() - 0.5) * 0.4;
      sprayPositions[idx * 3 + 1] = y + 0.1;
      sprayPositions[idx * 3 + 2] = z + (Math.random() - 0.5) * 0.4;

      // Spray shoots outward opposite to turn direction
      const angle = spreadDir + (Math.random() - 0.5) * 0.8;
      const sprayForce = 2.0 + Math.random() * (speed * 0.15 + 2.0);
      sprayVelocities[idx * 3 + 0] = Math.cos(angle) * sprayForce;
      sprayVelocities[idx * 3 + 1] = 1.5 + Math.random() * 2.2;
      sprayVelocities[idx * 3 + 2] = -speed * 0.2 + (Math.random() - 0.5) * 2;

      sprayLifetimes[idx] = 0.5 + Math.random() * 0.4;
    }
    sprayGeo.attributes.position.needsUpdate = true;
  }

  // 3. Victory Confetti
  const CONFETTI_COUNT = 400;
  const confettiGeo = new THREE.BufferGeometry();
  const confPositions = new Float32Array(CONFETTI_COUNT * 3);
  const confColors = new Float32Array(CONFETTI_COUNT * 3);
  const confVelocities = new Float32Array(CONFETTI_COUNT * 3);
  const confLifetimes = new Float32Array(CONFETTI_COUNT);

  const confettiPalette = [
    new THREE.Color(0xf59e0b), // gold
    new THREE.Color(0xef4444), // red
    new THREE.Color(0x3b82f6), // blue
    new THREE.Color(0x10b981), // emerald
    new THREE.Color(0x8b5cf6), // purple
  ];

  for (let i = 0; i < CONFETTI_COUNT; i++) {
    confPositions[i * 3 + 1] = -100;
    const col = confettiPalette[i % confettiPalette.length];
    confColors[i * 3 + 0] = col.r;
    confColors[i * 3 + 1] = col.g;
    confColors[i * 3 + 2] = col.b;
  }

  confettiGeo.setAttribute('position', new THREE.BufferAttribute(confPositions, 3));
  confettiGeo.setAttribute('color', new THREE.BufferAttribute(confColors, 3));

  const confettiMat = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
  });

  const confettiPoints = new THREE.Points(confettiGeo, confettiMat);
  group.add(confettiPoints);

  function emitConfetti(x: number, y: number, z: number) {
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      confPositions[i * 3 + 0] = x + (Math.random() - 0.5) * 16;
      confPositions[i * 3 + 1] = y + 5 + Math.random() * 6;
      confPositions[i * 3 + 2] = z + (Math.random() - 0.5) * 8;

      confVelocities[i * 3 + 0] = (Math.random() - 0.5) * 12;
      confVelocities[i * 3 + 1] = 6 + Math.random() * 10;
      confVelocities[i * 3 + 2] = (Math.random() - 0.5) * 10;
      confLifetimes[i] = 3.5;
    }
    confettiGeo.attributes.position.needsUpdate = true;
  }

  function update(playerZ: number, delta: number, blizzardIntensity: number) {
    // 1. Ambient snow
    const pos = snowGeo.attributes.position.array as Float32Array;
    const windPush = blizzardIntensity * 18;

    for (let i = 0; i < SNOW_COUNT; i++) {
      pos[i * 3 + 1] += snowVelocities[i * 3 + 1] * delta;
      pos[i * 3 + 0] += (snowVelocities[i * 3 + 0] - windPush) * delta;

      // Wrap around player's active area
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 1] = 22 + Math.random() * 4;
        pos[i * 3 + 0] = (Math.random() - 0.5) * 70;
        pos[i * 3 + 2] = playerZ + (Math.random() - 0.5) * 100;
      }
      if (pos[i * 3 + 2] < playerZ - 50) {
        pos[i * 3 + 2] = playerZ + 50 + Math.random() * 30;
      }
    }
    snowGeo.attributes.position.needsUpdate = true;

    // 2. Update carving spray
    const sPos = sprayGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < SPRAY_COUNT; i++) {
      if (sprayLifetimes[i] > 0) {
        sprayLifetimes[i] -= delta;
        sPos[i * 3 + 0] += sprayVelocities[i * 3 + 0] * delta;
        sPos[i * 3 + 1] += sprayVelocities[i * 3 + 1] * delta;
        sPos[i * 3 + 2] += sprayVelocities[i * 3 + 2] * delta;
        sprayVelocities[i * 3 + 1] -= 9.8 * delta; // gravity

        if (sPos[i * 3 + 1] <= 0 || sprayLifetimes[i] <= 0) {
          sPos[i * 3 + 1] = -100;
          sprayLifetimes[i] = 0;
        }
      }
    }
    sprayGeo.attributes.position.needsUpdate = true;

    // 3. Update confetti
    const cPos = confettiGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      if (confLifetimes[i] > 0) {
        confLifetimes[i] -= delta;
        cPos[i * 3 + 0] += confVelocities[i * 3 + 0] * delta;
        cPos[i * 3 + 1] += confVelocities[i * 3 + 1] * delta;
        cPos[i * 3 + 2] += confVelocities[i * 3 + 2] * delta;
        confVelocities[i * 3 + 1] -= 5.0 * delta; // slow flutter fall

        if (cPos[i * 3 + 1] <= 0) {
          cPos[i * 3 + 1] = 0.05; // rest on snow
        }
      }
    }
    confettiGeo.attributes.position.needsUpdate = true;
  }

  function reset() {
    for (let i = 0; i < SPRAY_COUNT; i++) {
      sprayPositions[i * 3 + 1] = -100;
      sprayLifetimes[i] = 0;
    }
    sprayGeo.attributes.position.needsUpdate = true;

    for (let i = 0; i < CONFETTI_COUNT; i++) {
      confPositions[i * 3 + 1] = -100;
      confLifetimes[i] = 0;
    }
    confettiGeo.attributes.position.needsUpdate = true;
  }

  return {
    group,
    emitSnowSpray,
    emitConfetti,
    update,
    reset,
  };
}
