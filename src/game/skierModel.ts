import * as THREE from 'three';

export interface SkierMeshController {
  group: THREE.Group;
  leftSki: THREE.Group;
  rightSki: THREE.Group;
  leftPole: THREE.Group;
  rightPole: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  updateAnimation: (
    leanAngle: number,
    isJumping: boolean,
    isCrouching: boolean,
    trickName: string | null,
    airTime: number,
    isCrashing: boolean,
    crashProgress: number
  ) => void;
  resetPose: () => void;
  setColors: (
    jacketColor: number,
    accentColor: number,
    gogglesColor: number,
    skiColor: number,
    skiRoughness?: number,
    skiMetalness?: number
  ) => void;
}

export function createSkierModel(suitColor: number = 0x2563eb, skiColor: number = 0xef4444): SkierMeshController {
  const root = new THREE.Group();

  // Materials
  const skiMat = new THREE.MeshStandardMaterial({
    color: skiColor,
    roughness: 0.2,
    metalness: 0.6,
  });

  const skiEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.1,
    metalness: 0.9,
  });

  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.2,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8,
    metalness: 0.05,
  });

  const jacketMat = new THREE.MeshStandardMaterial({
    color: suitColor,
    roughness: 0.5,
    metalness: 0.15,
  });

  const jacketAccentMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Amber accent stripe
    roughness: 0.4,
    metalness: 0.2,
  });

  const poleMetalMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.2,
    metalness: 0.85,
  });

  const helmetMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.15,
    metalness: 0.1,
  });

  const gogglesMat = new THREE.MeshPhysicalMaterial({
    color: 0xf59e0b,
    roughness: 0.05,
    metalness: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 0.95,
  });

  // 1. Skis (Left & Right)
  function createSki(): THREE.Group {
    const skiGroup = new THREE.Group();

    // Main plank (Length 2.4, width 0.22, thickness 0.04)
    const plankGeo = new THREE.BoxGeometry(0.22, 0.04, 2.0);
    const plank = new THREE.Mesh(plankGeo, skiMat);
    plank.castShadow = true;
    skiGroup.add(plank);

    // Upturned tip at front (z = -1.0)
    const tipGeo = new THREE.BoxGeometry(0.22, 0.04, 0.4);
    const tip = new THREE.Mesh(tipGeo, skiMat);
    tip.position.set(0, 0.08, -1.15);
    tip.rotation.x = -Math.PI / 6;
    tip.castShadow = true;
    skiGroup.add(tip);

    // Metallic edges
    const edgeGeo = new THREE.BoxGeometry(0.24, 0.015, 2.3);
    const edge = new THREE.Mesh(edgeGeo, skiEdgeMat);
    edge.position.set(0, -0.018, -0.1);
    skiGroup.add(edge);

    // Binding
    const bindingGeo = new THREE.BoxGeometry(0.18, 0.08, 0.35);
    const binding = new THREE.Mesh(bindingGeo, bootMat);
    binding.position.set(0, 0.05, 0.05);
    skiGroup.add(binding);

    return skiGroup;
  }

  const leftSki = createSki();
  leftSki.position.set(-0.32, 0.05, 0);
  root.add(leftSki);

  const rightSki = createSki();
  rightSki.position.set(0.32, 0.05, 0);
  root.add(rightSki);

  // 2. Boots & Legs
  const legsGroup = new THREE.Group();

  // Left & right boots
  const bootGeo = new THREE.BoxGeometry(0.16, 0.18, 0.38);
  const leftBoot = new THREE.Mesh(bootGeo, bootMat);
  leftBoot.position.set(-0.32, 0.16, 0.06);
  leftBoot.castShadow = true;
  legsGroup.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, bootMat);
  rightBoot.position.set(0.32, 0.16, 0.06);
  rightBoot.castShadow = true;
  legsGroup.add(rightBoot);

  // Lower legs (shins angled slightly forward)
  const shinGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.45, 8);
  const leftShin = new THREE.Mesh(shinGeo, pantsMat);
  leftShin.position.set(-0.32, 0.38, 0.02);
  leftShin.rotation.x = 0.22;
  leftShin.castShadow = true;
  legsGroup.add(leftShin);

  const rightShin = new THREE.Mesh(shinGeo, pantsMat);
  rightShin.position.set(0.32, 0.38, 0.02);
  rightShin.rotation.x = 0.22;
  rightShin.castShadow = true;
  legsGroup.add(rightShin);

  // Thighs / Upper legs
  const thighGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.5, 8);
  const leftThigh = new THREE.Mesh(thighGeo, pantsMat);
  leftThigh.position.set(-0.28, 0.72, -0.06);
  leftThigh.rotation.x = -0.35;
  leftThigh.castShadow = true;
  legsGroup.add(leftThigh);

  const rightThigh = new THREE.Mesh(thighGeo, pantsMat);
  rightThigh.position.set(0.28, 0.72, -0.06);
  rightThigh.rotation.x = -0.35;
  rightThigh.castShadow = true;
  legsGroup.add(rightThigh);

  root.add(legsGroup);

  // 3. Torso & Arms & Poles
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.95, -0.15);

  // Hips
  const hipsGeo = new THREE.BoxGeometry(0.48, 0.22, 0.28);
  const hips = new THREE.Mesh(hipsGeo, pantsMat);
  hips.castShadow = true;
  torsoGroup.add(hips);

  // Chest / Jacket
  const chestGeo = new THREE.BoxGeometry(0.52, 0.55, 0.34);
  const chest = new THREE.Mesh(chestGeo, jacketMat);
  chest.position.set(0, 0.32, 0.02);
  chest.rotation.x = 0.2; // leaning slightly forward into downhill
  chest.castShadow = true;
  torsoGroup.add(chest);

  // Jacket accent stripe across chest
  const stripeGeo = new THREE.BoxGeometry(0.53, 0.12, 0.35);
  const stripe = new THREE.Mesh(stripeGeo, jacketAccentMat);
  stripe.position.set(0, 0.38, 0.02);
  stripe.rotation.x = 0.2;
  torsoGroup.add(stripe);

  // 4. Head, Helmet & Goggles
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.72, 0.08);

  const helmetGeo = new THREE.SphereGeometry(0.2, 16, 14);
  const helmet = new THREE.Mesh(helmetGeo, helmetMat);
  helmet.castShadow = true;
  headGroup.add(helmet);

  // Mirrored goggles band & visor
  const gogglesGeo = new THREE.BoxGeometry(0.3, 0.11, 0.16);
  const goggles = new THREE.Mesh(gogglesGeo, gogglesMat);
  goggles.position.set(0, 0.03, -0.14);
  headGroup.add(goggles);

  // Goggle strap
  const strapGeo = new THREE.CylinderGeometry(0.205, 0.205, 0.06, 16, 1, true);
  const strapMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  const strap = new THREE.Mesh(strapGeo, strapMat);
  strap.rotation.x = Math.PI / 2;
  strap.position.set(0, 0.03, 0);
  headGroup.add(strap);

  torsoGroup.add(headGroup);

  // 5. Arms & Poles
  function createArm(isLeft: boolean): { armGroup: THREE.Group; poleGroup: THREE.Group } {
    const armGroup = new THREE.Group();
    const sign = isLeft ? -1 : 1;
    armGroup.position.set(sign * 0.32, 0.5, 0.02);

    // Upper arm
    const upperArmGeo = new THREE.CylinderGeometry(0.065, 0.06, 0.35, 8);
    const upperArm = new THREE.Mesh(upperArmGeo, jacketMat);
    upperArm.position.set(sign * 0.06, -0.12, 0);
    upperArm.rotation.z = sign * -0.3;
    upperArm.rotation.x = 0.3;
    upperArm.castShadow = true;
    armGroup.add(upperArm);

    // Forearm
    const forearmGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.32, 8);
    const forearm = new THREE.Mesh(forearmGeo, jacketMat);
    forearm.position.set(sign * 0.12, -0.32, -0.12);
    forearm.rotation.x = -0.6;
    forearm.castShadow = true;
    armGroup.add(forearm);

    // Glove
    const gloveGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const glove = new THREE.Mesh(gloveGeo, bootMat);
    glove.position.set(sign * 0.12, -0.42, -0.25);
    armGroup.add(glove);

    // Ski Pole
    const poleGroup = new THREE.Group();
    poleGroup.position.set(sign * 0.12, -0.42, -0.25);

    // Shaft
    const shaftGeo = new THREE.CylinderGeometry(0.016, 0.012, 1.25, 8);
    const shaft = new THREE.Mesh(shaftGeo, poleMetalMat);
    shaft.position.set(0, -0.4, 0.15);
    shaft.rotation.x = -0.4;
    poleGroup.add(shaft);

    // Basket ring
    const basketGeo = new THREE.TorusGeometry(0.07, 0.015, 6, 12);
    const basket = new THREE.Mesh(basketGeo, bootMat);
    basket.position.set(0, -0.85, 0.38);
    basket.rotation.x = Math.PI / 3;
    poleGroup.add(basket);

    armGroup.add(poleGroup);

    return { armGroup, poleGroup };
  }

  const leftArmData = createArm(true);
  const rightArmData = createArm(false);
  torsoGroup.add(leftArmData.armGroup);
  torsoGroup.add(rightArmData.armGroup);

  root.add(torsoGroup);

  // Soft contact shadow underneath
  const shadowGeo = new THREE.PlaneGeometry(1.6, 2.6);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x0a192f,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, 0.02, 0);
  root.add(shadowMesh);

  // Animation logic
  function updateAnimation(
    leanAngle: number,
    isJumping: boolean,
    isCrouching: boolean,
    trickName: string | null,
    airTime: number,
    isCrashing: boolean,
    crashProgress: number
  ) {
    if (isCrashing) {
      // Skier tumbles into snow
      const t = Math.min(crashProgress, 1.0);
      root.rotation.x = t * Math.PI * 1.5;
      root.rotation.z = Math.sin(t * Math.PI * 2) * 1.2;
      root.position.y = Math.sin(t * Math.PI) * 1.5;

      leftSki.position.x = -0.32 - t * 1.8;
      leftSki.position.y = t * 1.2;
      leftSki.rotation.z = t * 3.0;

      rightSki.position.x = 0.32 + t * 1.8;
      rightSki.position.y = t * 1.2;
      rightSki.rotation.z = -t * 3.0;
      return;
    }

    // Normal skiing state
    // 1. Steering & Carving Lean
    // Torso banks and counter-balances
    torsoGroup.rotation.z = -leanAngle * 0.75;
    headGroup.rotation.z = leanAngle * 0.35; // Head stays relatively level with horizon

    // Skis roll onto their inside edges during turns
    leftSki.rotation.z = -leanAngle * 0.9;
    rightSki.rotation.z = -leanAngle * 0.9;
    leftSki.rotation.y = -leanAngle * 0.2;
    rightSki.rotation.y = -leanAngle * 0.2;

    // 2. Crouching / Aerodynamic Tuck
    if (isCrouching) {
      torsoGroup.position.y = 0.7;
      torsoGroup.rotation.x = 0.45;
      headGroup.position.z = 0.15;
      legsGroup.scale.set(1.05, 0.75, 1.05);
    } else {
      torsoGroup.position.y = 0.95;
      torsoGroup.rotation.x = 0.05;
      headGroup.position.z = 0.08;
      legsGroup.scale.set(1, 1, 1);
    }

    // 3. Jump and Air Tricks
    if (isJumping) {
      shadowMesh.scale.setScalar(Math.max(0.3, 1 - root.position.y * 0.15));

      if (trickName === '360') {
        root.rotation.y = airTime * Math.PI * 4;
      } else if (trickName === 'Backflip') {
        root.rotation.x = -airTime * Math.PI * 3.5;
      } else if (trickName === 'Daffy') {
        // One ski forward, one back
        leftSki.position.z = -0.5;
        leftSki.rotation.x = -0.4;
        rightSki.position.z = 0.5;
        rightSki.rotation.x = 0.4;
      } else if (trickName === 'Iron Cross') {
        // Skis cross in X
        leftSki.rotation.y = 0.6;
        rightSki.rotation.y = -0.6;
      } else {
        // Standard aerodynamic jump tuck
        leftSki.rotation.x = -0.15;
        rightSki.rotation.x = -0.15;
        torsoGroup.position.y = 0.8;
      }
    } else {
      root.rotation.y = 0;
      root.rotation.x = 0;
      shadowMesh.scale.setScalar(1.0);
      leftSki.position.z = 0;
      rightSki.position.z = 0;
      leftSki.rotation.x = 0;
      rightSki.rotation.x = 0;
    }
  }

  function resetPose() {
    root.rotation.set(0, 0, 0);
    root.position.set(0, 0, 0);
    leftSki.position.set(-0.32, 0.05, 0);
    leftSki.rotation.set(0, 0, 0);
    rightSki.position.set(0.32, 0.05, 0);
    rightSki.rotation.set(0, 0, 0);
    torsoGroup.position.set(0, 0.95, -0.15);
    torsoGroup.rotation.set(0, 0, 0);
    headGroup.rotation.set(0, 0, 0);
  }

  function setColors(
    newJacket: number,
    newAccent: number,
    newGoggles: number,
    newSki: number,
    skiRoughness: number = 0.2,
    skiMetalness: number = 0.6
  ) {
    jacketMat.color.setHex(newJacket);
    jacketAccentMat.color.setHex(newAccent);
    gogglesMat.color.setHex(newGoggles);
    skiMat.color.setHex(newSki);
    skiMat.roughness = skiRoughness;
    skiMat.metalness = skiMetalness;
  }

  return {
    group: root,
    leftSki,
    rightSki,
    leftPole: leftArmData.poleGroup,
    rightPole: rightArmData.poleGroup,
    torsoGroup,
    headGroup,
    updateAnimation,
    resetPose,
    setColors,
  };
}
