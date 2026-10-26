import * as THREE from 'three';
import { TimeOfDayState } from '../types/game';

export interface AlpineEnvironment {
  scene: THREE.Scene;
  groundGroup: THREE.Group;
  backgroundMountains: THREE.Group;
  dirLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  starField: THREE.Points;
  skierHeadlight: THREE.SpotLight;
  headlightTarget: THREE.Object3D;
  update: (playerZ: number, playerX: number, playerY: number, elapsedTimeSec: number) => TimeOfDayState;
}

export function createAlpineEnvironment(scene: THREE.Scene): AlpineEnvironment {
  const groundGroup = new THREE.Group();
  scene.add(groundGroup);

  // 1. Terrain Chunks
  const CHUNK_LENGTH = 350;
  const CHUNK_WIDTH = 120;
  const NUM_CHUNKS = 4;

  const snowMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  });

  const pisteBorderMaterial = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.9,
    metalness: 0.0,
  });

  const chunks: THREE.Mesh[] = [];

  for (let i = 0; i < NUM_CHUNKS; i++) {
    const geo = new THREE.PlaneGeometry(CHUNK_WIDTH, CHUNK_LENGTH, 24, 32);
    geo.rotateX(-Math.PI / 2);

    const posAttr = geo.attributes.position;
    for (let v = 0; v < posAttr.count; v++) {
      const vx = posAttr.getX(v);
      const vz = posAttr.getZ(v);

      const absX = Math.abs(vx);
      let y = 0;
      if (absX > 18) {
        y += Math.pow((absX - 18) * 0.25, 2.0);
      }
      y += Math.sin(vx * 0.15) * Math.cos(vz * 0.1) * 0.45;
      posAttr.setY(v, y);
    }
    geo.computeVertexNormals();

    const chunkMesh = new THREE.Mesh(geo, snowMaterial);
    chunkMesh.position.set(0, -0.05, i * CHUNK_LENGTH);
    chunkMesh.receiveShadow = true;
    groundGroup.add(chunkMesh);
    chunks.push(chunkMesh);

    // Lateral boundary snow banks
    const bankGeo = new THREE.BoxGeometry(4, 3, CHUNK_LENGTH);
    const leftBank = new THREE.Mesh(bankGeo, pisteBorderMaterial);
    leftBank.position.set(-26, 0.8, i * CHUNK_LENGTH);
    groundGroup.add(leftBank);

    const rightBank = new THREE.Mesh(bankGeo, pisteBorderMaterial);
    rightBank.position.set(26, 0.8, i * CHUNK_LENGTH);
    groundGroup.add(rightBank);
  }

  // 2. Distant Alpine Mountain Peaks
  const backgroundMountains = new THREE.Group();
  scene.add(backgroundMountains);

  const mountainRockMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.9,
    metalness: 0.1,
    flatShading: true,
  });

  const mountainSnowMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.7,
    metalness: 0.05,
    flatShading: true,
  });

  function createMountainPeak(scaleX: number, scaleY: number, scaleZ: number): THREE.Group {
    const peakGroup = new THREE.Group();
    const rockGeo = new THREE.ConeGeometry(scaleX, scaleY, 6, 4);
    const rockMesh = new THREE.Mesh(rockGeo, mountainRockMat);
    peakGroup.add(rockMesh);

    const snowCapGeo = new THREE.ConeGeometry(scaleX * 0.45, scaleY * 0.42, 6, 2);
    const snowCapMesh = new THREE.Mesh(snowCapGeo, mountainSnowMat);
    snowCapMesh.position.y = scaleY * 0.3;
    peakGroup.add(snowCapMesh);

    return peakGroup;
  }

  const mountainPeaks: THREE.Group[] = [];
  for (let side = -1; side <= 1; side += 2) {
    for (let m = 0; m < 14; m++) {
      const peak = createMountainPeak(
        75 + Math.random() * 45,
        140 + Math.random() * 90,
        75 + Math.random() * 45
      );
      peak.position.set(
        side * (120 + Math.random() * 140),
        -10,
        m * 170 - 200
      );
      peak.rotation.y = Math.random() * Math.PI;
      backgroundMountains.add(peak);
      mountainPeaks.push(peak);
    }
  }

  // 3. Night Sky Starfield
  const STAR_COUNT = 800;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(STAR_COUNT * 3);

  for (let s = 0; s < STAR_COUNT; s++) {
    starPositions[s * 3 + 0] = (Math.random() - 0.5) * 600;
    starPositions[s * 3 + 1] = 60 + Math.random() * 160;
    starPositions[s * 3 + 2] = (Math.random() - 0.5) * 600;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.4,
    transparent: true,
    opacity: 0, // faded in at night
  });

  const starField = new THREE.Points(starGeo, starMat);
  scene.add(starField);

  // 4. Dynamic Day-to-Night Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x93c5fd, 0.7);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
  dirLight.position.set(25, 45, -20);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 10;
  dirLight.shadow.camera.far = 120;
  const d = 25;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0005;
  dirLight.shadow.normalBias = 0.02;
  scene.add(dirLight);

  // 5. Skier Headlight (turns on during sunset/night)
  const skierHeadlight = new THREE.SpotLight(0xfff7ed, 0, 45, Math.PI / 4.5, 0.45, 1.2);
  skierHeadlight.castShadow = false;
  const headlightTarget = new THREE.Object3D();
  scene.add(headlightTarget);
  skierHeadlight.target = headlightTarget;
  scene.add(skierHeadlight);

  // Lighting Colors for each phase
  // Full cycle is 90 seconds:
  // 0s..35s: Day
  // 35s..50s: Sunset
  // 50s..75s: Night
  // 75s..90s: Dawn -> back to Day
  const CYCLE_DURATION = 90; // seconds per full day-night cycle

  // Reusable colors
  const colDaySky = new THREE.Color(0xbfe0f7);
  const colSunsetSky = new THREE.Color(0xfb923c);
  const colNightSky = new THREE.Color(0x090d16);
  const colDawnSky = new THREE.Color(0xfbcfe8);

  const colDaySun = new THREE.Color(0xfffbeb);
  const colSunsetSun = new THREE.Color(0xf97316);
  const colNightSun = new THREE.Color(0x60a5fa); // moonlight
  const colDawnSun = new THREE.Color(0xfef08a);

  const colDayHemi = new THREE.Color(0xbae6fd);
  const colSunsetHemi = new THREE.Color(0xd946ef);
  const colNightHemi = new THREE.Color(0x1e293b);
  const colDawnHemi = new THREE.Color(0xc4b5fd);

  const _tempSky = new THREE.Color();
  const _tempSun = new THREE.Color();
  const _tempHemi = new THREE.Color();

  function update(playerZ: number, playerX: number, playerY: number, elapsedTimeSec: number): TimeOfDayState {
    // 1. Endless Terrain scrolling
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.position.z < playerZ - CHUNK_LENGTH * 0.7) {
        chunk.position.z += CHUNK_LENGTH * NUM_CHUNKS;
      }
    }

    // Parallax mountain range alongside player
    backgroundMountains.position.z = playerZ * 0.75;
    starField.position.z = playerZ;

    // 2. Dynamic Day-Night Lighting calculation
    const cycleTime = elapsedTimeSec % CYCLE_DURATION;
    const cycleProgress = cycleTime / CYCLE_DURATION;

    let phase: 'day' | 'sunset' | 'night' | 'dawn' = 'day';
    let phaseLabel = 'Plein Jour';
    let sunIntensity = 1.4;
    let starOpacity = 0;
    let headlightIntensity = 0;
    let sunAngleY = 45;
    let sunAngleX = 25;

    if (cycleTime < 35) {
      // Day (0 to 35s)
      phase = 'day';
      phaseLabel = 'Plein Jour Alpin';
      _tempSky.copy(colDaySky);
      _tempSun.copy(colDaySun);
      _tempHemi.copy(colDayHemi);
      sunIntensity = 1.45;
      starOpacity = 0;
      headlightIntensity = 0;
      sunAngleY = 45;
      sunAngleX = 25;
    } else if (cycleTime < 50) {
      // Sunset / Alpenglow (35s to 50s)
      phase = 'sunset';
      phaseLabel = 'Crépuscule Doré';
      const t = (cycleTime - 35) / 15;
      _tempSky.lerpColors(colDaySky, colSunsetSky, t);
      _tempSun.lerpColors(colDaySun, colSunsetSun, t);
      _tempHemi.lerpColors(colDayHemi, colSunsetHemi, t);
      sunIntensity = 1.45 - t * 0.35;
      starOpacity = t * 0.5;
      headlightIntensity = t * 1.5;
      sunAngleY = 45 - t * 30; // Sun sinks down towards horizon
      sunAngleX = 25 + t * 20;
    } else if (cycleTime < 75) {
      // Night (50s to 75s)
      phase = 'night';
      phaseLabel = 'Nuit Polaire Étoilée';
      const t = (cycleTime - 50) / 25;
      _tempSky.lerpColors(colSunsetSky, colNightSky, Math.min(1, t * 2));
      _tempSun.lerpColors(colSunsetSun, colNightSun, Math.min(1, t * 2));
      _tempHemi.lerpColors(colSunsetHemi, colNightHemi, Math.min(1, t * 2));
      sunIntensity = 0.5; // Moonlight
      starOpacity = 0.95;
      headlightIntensity = 3.2; // Full front headlight
      sunAngleY = 35;
      sunAngleX = -15;
    } else {
      // Dawn (75s to 90s)
      phase = 'dawn';
      phaseLabel = 'Aube Céleste';
      const t = (cycleTime - 75) / 15;
      _tempSky.lerpColors(colNightSky, colDawnSky, t);
      _tempSun.lerpColors(colNightSun, colDawnSun, t);
      _tempHemi.lerpColors(colNightHemi, colDawnHemi, t);
      sunIntensity = 0.5 + t * 0.9;
      starOpacity = Math.max(0, 0.95 - t * 1.5);
      headlightIntensity = Math.max(0, 3.2 - t * 3.2);
      sunAngleY = 15 + t * 30;
      sunAngleX = -15 + t * 40;
    }

    // Apply colors to scene & renderer
    scene.background = _tempSky;
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(_tempSky);
      if (phase === 'night') {
        scene.fog.near = 20;
        scene.fog.far = 170;
      } else {
        scene.fog.near = 35;
        scene.fog.far = 260;
      }
    }

    dirLight.color.copy(_tempSun);
    dirLight.intensity = sunIntensity;
    dirLight.position.set(playerX + sunAngleX, sunAngleY, playerZ - 20);
    dirLight.target.position.set(playerX, 0, playerZ + 12);
    dirLight.target.updateMatrixWorld();

    hemiLight.color.copy(_tempHemi);
    hemiLight.intensity = phase === 'night' ? 0.35 : 0.7;

    // Update stars
    (starField.material as THREE.PointsMaterial).opacity = starOpacity;

    // Update skier headlight
    skierHeadlight.intensity = headlightIntensity;
    skierHeadlight.position.set(playerX, playerY + 1.2, playerZ);
    headlightTarget.position.set(playerX, 0, playerZ + 22);
    headlightTarget.updateMatrixWorld();

    return {
      phase,
      phaseLabel,
      cycleProgress,
      sunIntensity,
      skyColor: '#' + _tempSky.getHexString(),
      fogColor: '#' + _tempSky.getHexString(),
    };
  }

  return {
    scene,
    groundGroup,
    backgroundMountains,
    dirLight,
    hemiLight,
    starField,
    skierHeadlight,
    headlightTarget,
    update,
  };
}
