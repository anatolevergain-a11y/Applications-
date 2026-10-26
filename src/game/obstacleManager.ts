import * as THREE from 'three';
import { ObstacleData } from '../types/game';

export interface DifficultyProfile {
  stageName: string;
  stageColor: string;
  baseSpeed: number;
  maxSpeed: number;
  obstacleDensity: number;
  slalomGatesDensity: number;
  hasIce: boolean;
  hasRamps: boolean;
  hasRollingSnowballs: boolean;
  hasYeti: boolean;
  hasFrontChargers: boolean;
  hasSideSweepers: boolean;
  blizzardIntensity: number;
}

export interface ObstacleSystem {
  group: THREE.Group;
  obstacles: ObstacleData[];
  yetiGroup: THREE.Group | null;
  reset: () => void;
  getDifficultyAtDistance: (distanceM: number) => DifficultyProfile;
  update: (playerZ: number, playerX: number, playerSpeed: number, delta: number, playerY?: number) => {
    hitObstacle: ObstacleData | null;
    clearedGate: ObstacleData | null;
    missedGate: ObstacleData | null;
    hitRamp: ObstacleData | null;
    hitIce: ObstacleData | null;
    hitBoost: ObstacleData | null;
    yetiCaught: boolean;
    difficulty: DifficultyProfile;
  };
}

export function createObstacleSystem(scene: THREE.Scene): ObstacleSystem {
  const group = new THREE.Group();
  scene.add(group);

  let obstacles: ObstacleData[] = [];
  const obstacleMeshes: Map<number, THREE.Object3D> = new Map();

  let nextObstacleId = 1;
  let highestGeneratedZ = 0;
  let gateCount = 0;

  // Materials
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.9,
    metalness: 0.05,
  });

  const pineNeedleMat = new THREE.MeshStandardMaterial({
    color: 0x14532d,
    roughness: 0.75,
    metalness: 0.05,
    flatShading: true,
  });

  const pineSnowMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.6,
    metalness: 0.05,
    flatShading: true,
  });

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.85,
    metalness: 0.2,
    flatShading: true,
  });

  const rockSnowMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.7,
    metalness: 0.05,
    flatShading: true,
  });

  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0x67e8f9,
    roughness: 0.05,
    metalness: 0.3,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.8,
  });

  const rampMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    roughness: 0.5,
    metalness: 0.1,
  });

  const rampEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.3,
    metalness: 0.4,
  });

  const boostMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  });

  const snowballMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.9,
    metalness: 0.05,
  });

  // Yeti
  let yetiGroup: THREE.Group | null = null;
  let yetiZ = -30;
  let yetiX = 0;
  let yetiActive = false;

  function createPineTreeMesh(): THREE.Group {
    const tree = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 1.8, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.9;
    trunk.castShadow = true;
    tree.add(trunk);

    const tiers = [
      { r: 2.2, h: 2.5, y: 2.2 },
      { r: 1.7, h: 2.2, y: 3.5 },
      { r: 1.1, h: 1.9, y: 4.8 },
    ];

    tiers.forEach((tier) => {
      const coneGeo = new THREE.ConeGeometry(tier.r, tier.h, 7);
      const cone = new THREE.Mesh(coneGeo, pineNeedleMat);
      cone.position.y = tier.y;
      cone.castShadow = true;
      tree.add(cone);

      const snowGeo = new THREE.ConeGeometry(tier.r * 0.9, tier.h * 0.4, 7);
      const snow = new THREE.Mesh(snowGeo, pineSnowMat);
      snow.position.y = tier.y + tier.h * 0.25;
      tree.add(snow);
    });

    return tree;
  }

  function createRockMesh(): THREE.Group {
    const rock = new THREE.Group();
    const geo = new THREE.DodecahedronGeometry(1.4, 1);
    const mesh = new THREE.Mesh(geo, rockMat);
    mesh.position.y = 1.0;
    mesh.scale.set(1.4, 0.9, 1.2);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    mesh.castShadow = true;
    rock.add(mesh);

    const snowCapGeo = new THREE.SphereGeometry(0.9, 6, 6);
    const snowCap = new THREE.Mesh(snowCapGeo, rockSnowMat);
    snowCap.position.y = 1.6;
    snowCap.scale.set(1.2, 0.35, 1.0);
    rock.add(snowCap);

    return rock;
  }

  function createSlalomGateMesh(color: 'red' | 'blue'): THREE.Group {
    const gate = new THREE.Group();
    const flagColor = color === 'red' ? 0xef4444 : 0x3b82f6;

    const poleMat = new THREE.MeshStandardMaterial({
      color: flagColor,
      roughness: 0.3,
      metalness: 0.5,
    });

    const flagMat = new THREE.MeshStandardMaterial({
      color: flagColor,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const GATE_WIDTH = 4.4;

    [-GATE_WIDTH / 2, GATE_WIDTH / 2].forEach((xOffset) => {
      const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(xOffset, 1.1, 0);
      pole.castShadow = true;
      gate.add(pole);

      const flagGeo = new THREE.PlaneGeometry(0.7, 0.45);
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(xOffset + (xOffset < 0 ? -0.35 : 0.35), 1.8, 0);
      gate.add(flag);
    });

    return gate;
  }

  function createRampMesh(): THREE.Group {
    const ramp = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0, 0.05);
    shape.lineTo(4.5, 1.4);
    shape.lineTo(4.5, 0);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, { steps: 1, depth: 4.0, bevelEnabled: false });
    geo.rotateY(-Math.PI / 2);
    geo.translate(2.0, 0, -2.25);

    const mesh = new THREE.Mesh(geo, rampMat);
    mesh.castShadow = true;
    ramp.add(mesh);

    const lipGeo = new THREE.BoxGeometry(4.0, 0.1, 0.3);
    const lip = new THREE.Mesh(lipGeo, rampEdgeMat);
    lip.position.set(0, 1.4, 2.2);
    ramp.add(lip);

    return ramp;
  }

  function createIcePatchMesh(): THREE.Group {
    const ice = new THREE.Group();
    const geo = new THREE.PlaneGeometry(5.5, 12, 4, 4);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, iceMat);
    mesh.position.y = 0.02;
    ice.add(mesh);
    return ice;
  }

  function createBoostMesh(): THREE.Group {
    const boost = new THREE.Group();
    const geo = new THREE.PlaneGeometry(3.5, 8);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, boostMat);
    mesh.position.y = 0.03;
    boost.add(mesh);

    const chevronGeo = new THREE.BoxGeometry(2.2, 0.05, 0.35);
    const chevMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-2, 0, 2].forEach((zOff) => {
      const ch = new THREE.Mesh(chevronGeo, chevMat);
      ch.position.set(0, 0.04, zOff);
      boost.add(ch);
    });

    return boost;
  }

  function createSnowballMesh(): THREE.Group {
    const ball = new THREE.Group();
    const geo = new THREE.SphereGeometry(1.6, 12, 10);
    const mesh = new THREE.Mesh(geo, snowballMat);
    mesh.position.y = 1.6;
    mesh.castShadow = true;
    ball.add(mesh);
    return ball;
  }

  function createYetiMesh(): THREE.Group {
    const yeti = new THREE.Group();

    const furMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.9,
      metalness: 0.05,
    });
    const faceMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.5,
      metalness: 0.1,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    const bodyGeo = new THREE.SphereGeometry(1.8, 12, 10);
    bodyGeo.scale(1.1, 1.3, 0.9);
    const body = new THREE.Mesh(bodyGeo, furMat);
    body.position.y = 2.4;
    body.castShadow = true;
    yeti.add(body);

    const headGeo = new THREE.SphereGeometry(1.1, 10, 8);
    const head = new THREE.Mesh(headGeo, furMat);
    head.position.set(0, 4.3, 0.2);
    yeti.add(head);

    const faceGeo = new THREE.BoxGeometry(0.8, 0.6, 0.3);
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(0, 4.2, 1.15);
    yeti.add(face);

    [-0.22, 0.22].forEach((x) => {
      const eyeGeo = new THREE.SphereGeometry(0.1, 6, 6);
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(x, 4.35, 1.3);
      yeti.add(eye);
    });

    [-2.2, 2.2].forEach((x) => {
      const armGeo = new THREE.CylinderGeometry(0.4, 0.5, 2.5, 8);
      const arm = new THREE.Mesh(armGeo, furMat);
      arm.position.set(x, 2.8, 0.4);
      arm.rotation.x = -0.5;
      arm.rotation.z = x < 0 ? 0.3 : -0.3;
      yeti.add(arm);
    });

    yeti.scale.set(1.4, 1.4, 1.4);
    return yeti;
  }

  // 1. Front-charging snowmobile/groomer (seen far down the track, charging towards skier from 3000m+)
  function createChargerMesh(): THREE.Group {
    const charger = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Racing hazard red
      roughness: 0.3,
      metalness: 0.5,
    });

    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2,
    });

    const lightGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a, // Glowing yellow high-beam headlights
    });

    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b, // Amber strobe
    });

    // Main cab body
    const bodyGeo = new THREE.BoxGeometry(2.2, 1.0, 3.4);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    body.castShadow = true;
    charger.add(body);

    // Dark cabin roof
    const cabGeo = new THREE.BoxGeometry(1.7, 0.75, 1.6);
    const cab = new THREE.Mesh(cabGeo, chassisMat);
    cab.position.set(0, 1.4, 0.2);
    charger.add(cab);

    // Dual front headlights (oriented towards negative Z, facing uphill towards the oncoming player!)
    [-0.7, 0.7].forEach((x) => {
      const lightGeo = new THREE.SphereGeometry(0.24, 8, 8);
      const light = new THREE.Mesh(lightGeo, lightGlowMat);
      light.position.set(x, 0.8, -1.75);
      charger.add(light);

      // Long visible high-beam light cone cutting through the snow
      const beamGeo = new THREE.ConeGeometry(2.4, 25, 8, 1, true);
      beamGeo.rotateX(Math.PI / 2);
      beamGeo.translate(0, 0, -12.5);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(x, 0.8, -1.75);
      charger.add(beam);
    });

    // Amber roof hazard beacon
    const beaconGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.28, 8);
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 1.9, 0.2);
    charger.add(beacon);

    // Front Skis
    [-0.9, 0.9].forEach((x) => {
      const skiGeo = new THREE.BoxGeometry(0.26, 0.1, 2.4);
      const ski = new THREE.Mesh(skiGeo, chassisMat);
      ski.position.set(x, 0.08, -0.6);
      charger.add(ski);
    });

    return charger;
  }

  // 2. Horizontal sweeping obstacle (sweeping left and right across piste from 5000m+)
  function createSweeperMesh(): THREE.Group {
    const sweeper = new THREE.Group();

    const rollerMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.35,
      metalness: 0.7,
      flatShading: true,
    });

    const hazardMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // High-visibility neon orange
      roughness: 0.5,
      metalness: 0.2,
    });

    // Sweeping cylinder roller (width 6.5m)
    const rollerGeo = new THREE.CylinderGeometry(0.9, 0.9, 6.5, 14);
    rollerGeo.rotateZ(Math.PI / 2);
    const roller = new THREE.Mesh(rollerGeo, rollerMat);
    roller.position.y = 0.9;
    roller.castShadow = true;
    sweeper.add(roller);

    // Studs / teeth along roller
    for (let s = -2.6; s <= 2.6; s += 0.9) {
      const studGeo = new THREE.BoxGeometry(0.25, 0.25, 2.0);
      const stud = new THREE.Mesh(studGeo, hazardMat);
      stud.position.set(s, 0.9, 0);
      sweeper.add(stud);
    }

    // End plates with warning flags
    [-3.25, 3.25].forEach((x) => {
      const plateGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.25, 12);
      plateGeo.rotateZ(Math.PI / 2);
      const plate = new THREE.Mesh(plateGeo, hazardMat);
      plate.position.set(x, 0.9, 0);
      sweeper.add(plate);

      // Warning flag pole
      const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6);
      const pole = new THREE.Mesh(poleGeo, hazardMat);
      pole.position.set(x, 2.0, 0);
      sweeper.add(pole);

      // Fluorescent flag
      const flagGeo = new THREE.PlaneGeometry(0.7, 0.45);
      const flagMat = new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide });
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(x + (x < 0 ? -0.35 : 0.35), 2.8, 0);
      sweeper.add(flag);

      // Flashing beacon
      const strobeGeo = new THREE.SphereGeometry(0.14, 6, 6);
      const strobeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const strobe = new THREE.Mesh(strobeGeo, strobeMat);
      strobe.position.set(x, 3.15, 0);
      sweeper.add(strobe);
    });

    return sweeper;
  }

  // Calculate difficulty progression dynamically based on distance traveled (accelerated ramp-up)
  function getDifficultyAtDistance(dist: number): DifficultyProfile {
    if (dist < 250) {
      return {
        stageName: 'Piste Verte · Échauffement Express',
        stageColor: '#22c55e',
        baseSpeed: 55,
        maxSpeed: 85,
        obstacleDensity: 3.8,
        slalomGatesDensity: 2.6,
        hasIce: false,
        hasRamps: true,
        hasRollingSnowballs: false,
        hasYeti: false,
        hasFrontChargers: false,
        hasSideSweepers: false,
        blizzardIntensity: 0.05,
      };
    } else if (dist < 650) {
      return {
        stageName: 'Piste Bleue · Crête Glacée',
        stageColor: '#3b82f6',
        baseSpeed: 72,
        maxSpeed: 105,
        obstacleDensity: 6.0,
        slalomGatesDensity: 3.4,
        hasIce: true,
        hasRamps: true,
        hasRollingSnowballs: false,
        hasYeti: false,
        hasFrontChargers: false,
        hasSideSweepers: false,
        blizzardIntensity: 0.2,
      };
    } else if (dist < 1200) {
      return {
        stageName: 'Piste Rouge · Vallon Rapide',
        stageColor: '#ef4444',
        baseSpeed: 90,
        maxSpeed: 122,
        obstacleDensity: 8.0,
        slalomGatesDensity: 4.0,
        hasIce: true,
        hasRamps: true,
        hasRollingSnowballs: true,
        hasYeti: false,
        hasFrontChargers: false,
        hasSideSweepers: false,
        blizzardIntensity: 0.35,
      };
    } else if (dist < 1900) {
      return {
        stageName: 'Piste Noire · Couloir Sombre',
        stageColor: '#0f172a',
        baseSpeed: 108,
        maxSpeed: 138,
        obstacleDensity: 9.4,
        slalomGatesDensity: 4.4,
        hasIce: true,
        hasRamps: true,
        hasRollingSnowballs: true,
        hasYeti: false,
        hasFrontChargers: false,
        hasSideSweepers: false,
        blizzardIntensity: 0.55,
      };
    } else if (dist < 3000) {
      return {
        stageName: 'Hors-Piste · Traque du Yéti',
        stageColor: '#8b5cf6',
        baseSpeed: 124,
        maxSpeed: 155,
        obstacleDensity: 10.4,
        slalomGatesDensity: 4.6,
        hasIce: true,
        hasRamps: true,
        hasRollingSnowballs: true,
        hasYeti: true,
        hasFrontChargers: false,
        hasSideSweepers: false,
        blizzardIntensity: 0.7,
      };
    } else if (dist < 5000) {
      // 3000m+: Front-charging obstacles moving towards skier!
      return {
        stageName: 'Secteur Péril · Charges Frontales',
        stageColor: '#f97316',
        baseSpeed: 134,
        maxSpeed: 162,
        obstacleDensity: 11.2,
        slalomGatesDensity: 4.8,
        hasIce: true,
        hasRamps: true,
        hasRollingSnowballs: true,
        hasYeti: true,
        hasFrontChargers: true,
        hasSideSweepers: false,
        blizzardIntensity: 0.8,
      };
    } else {
      // 5000m+: Horizontal sweepers moving left-to-right across piste + front chargers + Yeti!
      return {
        stageName: 'Zone Tempête · Balayeurs Transversaux',
        stageColor: '#ec4899',
        baseSpeed: 142,
        maxSpeed: 170,
        obstacleDensity: 12.0,
        slalomGatesDensity: 5.0,
        hasIce: true,
        hasRamps: true,
        hasRollingSnowballs: true,
        hasYeti: true,
        hasFrontChargers: true,
        hasSideSweepers: true,
        blizzardIntensity: 0.88,
      };
    }
  }

  // Dynamically generate obstacles ahead
  function generateAhead(upToZ: number) {
    while (highestGeneratedZ < upToZ) {
      const z = highestGeneratedZ;
      const diff = getDifficultyAtDistance(z);

      // Gate check
      const gateInterval = 100 / Math.max(1, diff.slalomGatesDensity);
      if (z % Math.round(gateInterval) < 15) {
        const gateColor = gateCount % 2 === 0 ? 'blue' : 'red';
        const gateX = Math.sin(gateCount * 1.8) * 8.5;
        const gateData: ObstacleData = {
          id: nextObstacleId++,
          type: 'gate',
          x: gateX,
          z: z,
          width: 4.4,
          height: 2.2,
          depth: 1.5,
          gatePassed: false,
          gateMissed: false,
          gateColor: gateColor,
        };
        obstacles.push(gateData);

        const gateMesh = createSlalomGateMesh(gateColor);
        gateMesh.position.set(gateX, 0, z);
        group.add(gateMesh);
        obstacleMeshes.set(gateData.id, gateMesh);

        gateCount++;
      }

      // Hazards
      const hazardInterval = 100 / Math.max(1, diff.obstacleDensity);
      const rand = Math.random();
      const trackX = (Math.random() * 2 - 1) * 16.5;

      const nearGate = obstacles.some((o) => o.type === 'gate' && Math.abs(o.z - z) < 8 && Math.abs(o.x - trackX) < 4);

      if (!nearGate) {
        if (diff.hasFrontChargers && rand < 0.22) {
          // 3000m+ : Front-charging snowmobiles seen far down the track coming towards the skier
          const chargerZ = z + 110 + Math.random() * 30;
          const chargerData: ObstacleData = {
            id: nextObstacleId++,
            type: 'charger',
            x: (Math.random() * 2 - 1) * 13,
            z: chargerZ,
            width: 2.2,
            height: 1.6,
            depth: 3.4,
            velocity: {
              x: (Math.random() - 0.5) * 1.5,
              z: -32, // Moving uphill towards player at ~115 km/h!
            },
          };
          obstacles.push(chargerData);
          const cMesh = createChargerMesh();
          cMesh.position.set(chargerData.x, 0, chargerZ);
          group.add(cMesh);
          obstacleMeshes.set(chargerData.id, cMesh);
        } else if (diff.hasSideSweepers && rand < 0.42) {
          // 5000m+ : Left-to-right sweeping rollers crossing the track
          const startLeft = Math.random() < 0.5;
          const sweeperData: ObstacleData = {
            id: nextObstacleId++,
            type: 'sweeper',
            x: startLeft ? -14 : 14,
            z: z,
            width: 6.5,
            height: 1.8,
            depth: 2.2,
            sweepDir: startLeft ? 1 : -1,
            sweepSpeed: 13 + Math.random() * 5,
          };
          obstacles.push(sweeperData);
          const swMesh = createSweeperMesh();
          swMesh.position.set(sweeperData.x, 0, z);
          group.add(swMesh);
          obstacleMeshes.set(sweeperData.id, swMesh);
        } else if (diff.hasRamps && rand < 0.50) {
          const rampData: ObstacleData = {
            id: nextObstacleId++,
            type: 'ramp',
            x: trackX,
            z: z,
            width: 4.0,
            height: 1.5,
            depth: 4.5,
          };
          obstacles.push(rampData);
          const rampMesh = createRampMesh();
          rampMesh.position.set(trackX, 0, z);
          group.add(rampMesh);
          obstacleMeshes.set(rampData.id, rampMesh);
        } else if (diff.hasIce && rand < 0.60) {
          const iceData: ObstacleData = {
            id: nextObstacleId++,
            type: 'ice',
            x: trackX,
            z: z,
            width: 5.5,
            height: 0.2,
            depth: 12.0,
          };
          obstacles.push(iceData);
          const iceMesh = createIcePatchMesh();
          iceMesh.position.set(trackX, 0, z);
          group.add(iceMesh);
          obstacleMeshes.set(iceData.id, iceMesh);
        } else if (rand < 0.68) {
          const boostData: ObstacleData = {
            id: nextObstacleId++,
            type: 'boost',
            x: trackX,
            z: z,
            width: 3.5,
            height: 0.2,
            depth: 8.0,
          };
          obstacles.push(boostData);
          const bMesh = createBoostMesh();
          bMesh.position.set(trackX, 0, z);
          group.add(bMesh);
          obstacleMeshes.set(boostData.id, bMesh);
        } else if (diff.hasRollingSnowballs && rand < 0.78) {
          const snowballData: ObstacleData = {
            id: nextObstacleId++,
            type: 'snowball',
            x: trackX,
            z: z,
            width: 2.8,
            height: 2.8,
            depth: 2.8,
            snowballVelocity: {
              x: (Math.random() - 0.5) * 4.5,
              z: diff.baseSpeed * 0.25,
            },
          };
          obstacles.push(snowballData);
          const sMesh = createSnowballMesh();
          sMesh.position.set(trackX, 0, z);
          group.add(sMesh);
          obstacleMeshes.set(snowballData.id, sMesh);
        } else if (rand < 0.90) {
          const treeData: ObstacleData = {
            id: nextObstacleId++,
            type: 'tree',
            x: trackX,
            z: z,
            width: 1.8,
            height: 5.0,
            depth: 1.8,
          };
          obstacles.push(treeData);
          const treeMesh = createPineTreeMesh();
          treeMesh.position.set(trackX, 0, z);
          const scale = 0.85 + Math.random() * 0.4;
          treeMesh.scale.set(scale, scale, scale);
          treeMesh.rotation.y = Math.random() * Math.PI * 2;
          group.add(treeMesh);
          obstacleMeshes.set(treeData.id, treeMesh);
        } else {
          const rockData: ObstacleData = {
            id: nextObstacleId++,
            type: 'rock',
            x: trackX,
            z: z,
            width: 2.4,
            height: 1.8,
            depth: 2.4,
          };
          obstacles.push(rockData);
          const rockMesh = createRockMesh();
          rockMesh.position.set(trackX, 0, z);
          group.add(rockMesh);
          obstacleMeshes.set(rockData.id, rockMesh);
        }
      }

      // Lateral border pines
      [-23 - Math.random() * 5, 23 + Math.random() * 5].forEach((bx) => {
        const borderTree = createPineTreeMesh();
        borderTree.position.set(bx, 0.4, z + (Math.random() - 0.5) * 6);
        const bScale = 1.0 + Math.random() * 0.5;
        borderTree.scale.set(bScale, bScale, bScale);
        group.add(borderTree);
      });

      highestGeneratedZ += hazardInterval * (0.6 + Math.random() * 0.7);
    }
  }

  function reset() {
    obstacleMeshes.forEach((mesh) => group.remove(mesh));
    obstacleMeshes.clear();
    obstacles = [];

    if (yetiGroup) {
      group.remove(yetiGroup);
      yetiGroup = null;
    }

    nextObstacleId = 1;
    highestGeneratedZ = 40;
    gateCount = 0;
    yetiActive = false;

    // Generate first 200m
    generateAhead(220);
  }

  function update(playerZ: number, playerX: number, playerSpeed: number, delta: number, playerY: number = 0) {
    const diff = getDifficultyAtDistance(playerZ);

    // Stream obstacles ahead up to playerZ + 200m
    generateAhead(playerZ + 200);

    // Clean up far-behind obstacles (z < playerZ - 40)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      if (obs.z < playerZ - 45) {
        const mesh = obstacleMeshes.get(obs.id);
        if (mesh) {
          group.remove(mesh);
          obstacleMeshes.delete(obs.id);
        }
        obstacles.splice(i, 1);
      }
    }

    // Yeti activation when entering Yeti territory (3500m+)
    if (diff.hasYeti && !yetiActive) {
      yetiActive = true;
      yetiGroup = createYetiMesh();
      yetiZ = playerZ - 35;
      yetiX = playerX;
      yetiGroup.position.set(yetiX, 0, yetiZ);
      group.add(yetiGroup);
    }

    let hitObstacle: ObstacleData | null = null;
    let clearedGate: ObstacleData | null = null;
    let missedGate: ObstacleData | null = null;
    let hitRamp: ObstacleData | null = null;
    let hitIce: ObstacleData | null = null;
    let hitBoost: ObstacleData | null = null;
    let yetiCaught = false;

    // Dynamic moving obstacles: snowballs, front-charging snowmobiles, and side-sweeping rollers
    obstacles.forEach((obs) => {
      if (obs.type === 'snowball' && obs.snowballVelocity) {
        obs.x += obs.snowballVelocity.x * delta;
        obs.z += obs.snowballVelocity.z * delta;
        if (obs.x < -16 || obs.x > 16) {
          obs.snowballVelocity.x *= -1;
        }
        const mesh = obstacleMeshes.get(obs.id);
        if (mesh) {
          mesh.position.set(obs.x, 0, obs.z);
          mesh.rotation.x += delta * 4;
        }
      } else if (obs.type === 'charger' && obs.velocity) {
        // Charging uphill directly towards the skier!
        obs.z += obs.velocity.z * delta;
        obs.x += obs.velocity.x * delta;
        if (obs.x < -14 || obs.x > 14) {
          obs.velocity.x *= -1;
        }
        const mesh = obstacleMeshes.get(obs.id);
        if (mesh) {
          mesh.position.set(obs.x, 0, obs.z);
          mesh.position.y = Math.abs(Math.sin(obs.z * 1.5)) * 0.06;
        }
      } else if (obs.type === 'sweeper') {
        // Sweeping left and right across the slope
        const dir = obs.sweepDir || 1;
        const speed = obs.sweepSpeed || 14;
        obs.x += dir * speed * delta;
        if (obs.x > 14.5) {
          obs.x = 14.5;
          obs.sweepDir = -1;
        } else if (obs.x < -14.5) {
          obs.x = -14.5;
          obs.sweepDir = 1;
        }
        const mesh = obstacleMeshes.get(obs.id);
        if (mesh) {
          mesh.position.set(obs.x, 0, obs.z);
          mesh.rotation.z -= (dir * speed * delta) / 0.9;
        }
      }
    });

    // Check collisions
    for (const obs of obstacles) {
      const dz = obs.z - playerZ;
      const dx = Math.abs(obs.x - playerX);

      if (dz < -10 || dz > 15) continue;

      if (obs.type === 'gate') {
        if (!obs.gatePassed && !obs.gateMissed) {
          if (Math.abs(dz) < 1.4) {
            if (dx <= obs.width * 0.5) {
              obs.gatePassed = true;
              clearedGate = obs;
            }
          } else if (dz < -1.4) {
            obs.gateMissed = true;
            missedGate = obs;
          }
        }
      } else if (obs.type === 'ramp') {
        if (Math.abs(dz) < obs.depth * 0.5 && dx < obs.width * 0.5) {
          hitRamp = obs;
        }
      } else if (obs.type === 'ice') {
        if (Math.abs(dz) < obs.depth * 0.5 && dx < obs.width * 0.5) {
          hitIce = obs;
        }
      } else if (obs.type === 'boost') {
        if (Math.abs(dz) < obs.depth * 0.5 && dx < obs.width * 0.5) {
          hitBoost = obs;
        }
      } else if (obs.type === 'charger') {
        if (Math.abs(dz) < 2.5 && dx < obs.width * 0.48) {
          hitObstacle = obs;
        }
      } else if (obs.type === 'sweeper') {
        if (Math.abs(dz) < 1.8 && dx < obs.width * 0.48) {
          // Can jump over sweeper if high enough
          const pY = playerY || 0;
          if (pY < 1.4) {
            hitObstacle = obs;
          }
        }
      } else if (obs.type === 'tree' || obs.type === 'rock' || obs.type === 'snowball') {
        if (Math.abs(dz) < obs.depth * 0.45 && dx < obs.width * 0.45) {
          hitObstacle = obs;
        }
      }
    }

    // Yeti tracking logic
    if (yetiGroup && yetiActive) {
      const yetiSpeedKmh = Math.max(70, playerSpeed * 0.95 + 6);
      const yetiVz = (yetiSpeedKmh * 1000) / 3600;
      yetiZ += yetiVz * delta;
      yetiX += (playerX - yetiX) * Math.min(1.0, delta * 2.5);

      yetiGroup.position.set(yetiX, 0, yetiZ);
      yetiGroup.rotation.y = Math.sin(yetiZ * 0.5) * 0.2;
      yetiGroup.position.y = Math.abs(Math.sin(yetiZ * 0.8)) * 0.4;

      if (yetiZ >= playerZ - 1.2 && Math.abs(yetiX - playerX) < 2.5) {
        yetiCaught = true;
      }
    }

    return {
      hitObstacle,
      clearedGate,
      missedGate,
      hitRamp,
      hitIce,
      hitBoost,
      yetiCaught,
      difficulty: diff,
    };
  }

  // Initial generation
  reset();

  return {
    group,
    obstacles,
    yetiGroup,
    reset,
    getDifficultyAtDistance,
    update,
  };
}
