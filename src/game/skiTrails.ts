import * as THREE from 'three';

/**
 * Procedural ski trails carved into the snow surface
 * Creates soft indented lines behind each ski.
 */
export interface SkiTrailsSystem {
  mesh: THREE.LineSegments;
  addTrailPoint: (leftX: number, leftZ: number, rightX: number, rightZ: number) => void;
  update: (playerZ: number) => void;
  reset: () => void;
}

export function createSkiTrailsSystem(scene: THREE.Scene): SkiTrailsSystem {
  const MAX_POINTS = 600;
  const positions = new Float32Array(MAX_POINTS * 3 * 2); // 2 lines: left and right ski
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: 0x93c5fd, // Soft powder blue shadow in carved snow
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });

  const lines = new THREE.LineSegments(geometry, material);
  scene.add(lines);

  let pointIndex = 0;
  let lastLeft = { x: 0, z: 0 };
  let lastRight = { x: 0, z: 0 };
  let hasInit = false;

  function addTrailPoint(leftX: number, leftZ: number, rightX: number, rightZ: number) {
    if (!hasInit) {
      lastLeft = { x: leftX, z: leftZ };
      lastRight = { x: rightX, z: rightZ };
      hasInit = true;
      return;
    }

    // Only add if moved a bit
    const dist = Math.hypot(leftX - lastLeft.x, leftZ - lastLeft.z);
    if (dist < 0.6) return;

    const pos = geometry.attributes.position.array as Float32Array;
    const baseIdx = (pointIndex % (MAX_POINTS / 2)) * 12;

    // Left ski segment (from lastLeft to current left)
    pos[baseIdx + 0] = lastLeft.x;
    pos[baseIdx + 1] = 0.02;
    pos[baseIdx + 2] = lastLeft.z;

    pos[baseIdx + 3] = leftX;
    pos[baseIdx + 4] = 0.02;
    pos[baseIdx + 5] = leftZ;

    // Right ski segment (from lastRight to current right)
    pos[baseIdx + 6] = lastRight.x;
    pos[baseIdx + 7] = 0.02;
    pos[baseIdx + 8] = lastRight.z;

    pos[baseIdx + 9] = rightX;
    pos[baseIdx + 10] = 0.02;
    pos[baseIdx + 11] = rightZ;

    lastLeft = { x: leftX, z: leftZ };
    lastRight = { x: rightX, z: rightZ };
    pointIndex++;

    geometry.attributes.position.needsUpdate = true;
  }

  function update(playerZ: number) {
    // Clear segments far behind the player (beyond 150m)
    const pos = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < MAX_POINTS * 2; i++) {
      if (pos[i * 3 + 2] < playerZ - 120) {
        pos[i * 3 + 1] = -10; // hide under ground
      }
    }
  }

  function reset() {
    const pos = geometry.attributes.position.array as Float32Array;
    pos.fill(0);
    geometry.attributes.position.needsUpdate = true;
    pointIndex = 0;
    hasInit = false;
  }

  return {
    mesh: lines,
    addTrailPoint,
    update,
    reset,
  };
}
