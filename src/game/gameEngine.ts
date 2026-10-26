import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PlayerState, GameMode, TimeOfDayState, ActiveChallenge, TemporaryScoreBonus } from '../types/game';
import { createSkierModel, SkierMeshController } from './skierModel';
import { createAlpineEnvironment, AlpineEnvironment } from './environment';
import { createObstacleSystem, ObstacleSystem, DifficultyProfile } from './obstacleManager';
import { createParticleSystem, ParticleSystem } from './particles';
import { createSkiTrailsSystem, SkiTrailsSystem } from './skiTrails';
import { ChallengeManager } from './challengeManager';
import { sounds } from '../audio/soundManager';

export interface GameEngineCallbacks {
  onStateUpdate: (playerState: PlayerState, timeOfDay: TimeOfDayState) => void;
  onGameOver: (finalScore: number, distance: number, timeSec: number, coinsEarned: number) => void;
  onGatePassed: (combo: number, points: number) => void;
  onTrickLanded: (trickName: string, points: number) => void;
  onDamageTaken: (remainingHealth: number) => void;
  onChallengeCompleted: (challenge: ActiveChallenge, bonusPoints: number, multiplier: number, durationSec: number) => void;
  onChallengeFailed: (challenge: ActiveChallenge) => void;
  onChallengeStarted: (challenge: ActiveChallenge) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private frameId: number = 0;
  private isDestroyed: boolean = false;

  // Components
  private skier: SkierMeshController;
  private environment: AlpineEnvironment;
  private obstacleSystem: ObstacleSystem;
  private particles: ParticleSystem;
  private skiTrails: SkiTrailsSystem;
  private challengeManager: ChallengeManager;

  // Game state
  private mode: GameMode = 'title';
  private callbacks: GameEngineCallbacks;

  private player: PlayerState = {
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vz: 14,
    vy: 0,
    speedKmh: 50,
    isGrounded: true,
    isJumping: false,
    isCrouching: false,
    isSlidingOnIce: false,
    rotationY: 0,
    leanAngle: 0,
    pitchAngle: 0,
    currentTrick: null,
    airTime: 0,
    health: 3,
    score: 0,
    combo: 0,
    maxCombo: 0,
    gatesCleared: 0,
    invincibleTimer: 0,
    isCrashing: false,
    elapsedTimeSec: 0,
    currentDifficultyStage: 'Piste Verte · Échauffement',
    currentDifficultyColor: '#22c55e',
    coinsEarned: 0,
    activeChallenge: null,
    scoreMultiplierBonus: null,
  };

  private currentDifficulty: DifficultyProfile;

  // Inputs
  public keysHeld = {
    left: false,
    right: false,
    down: false,
    up: false,
    space: false,
  };
  private touchSteer: number = 0;

  // FX & Camera state
  private cameraShake: number = 0;
  private hitstopTimer: number = 0;
  private crashTimer: number = 0;
  private isSoftwareGl: boolean = false;
  private lastTimeOfDay: TimeOfDayState;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Scene & Fog
    this.scene = new THREE.Scene();
    const skyBlue = new THREE.Color(0xbfe0f7);
    this.scene.background = skyBlue;
    this.scene.fog = new THREE.Fog(skyBlue, 35, 260);

    // 4. Camera
    this.camera = new THREE.PerspectiveCamera(
      58,
      container.clientWidth / container.clientHeight,
      0.1,
      800
    );
    this.camera.position.set(0, 4.5, -8);
    this.camera.lookAt(0, 1.2, 5);

    // 5. Room Environment
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {
      // Fallback
    }

    // 6. World systems
    this.environment = createAlpineEnvironment(this.scene);
    this.obstacleSystem = createObstacleSystem(this.scene);
    this.particles = createParticleSystem(this.scene);
    this.skiTrails = createSkiTrailsSystem(this.scene);
    this.skier = createSkierModel(0x2563eb, 0xef4444);
    this.scene.add(this.skier.group);

    this.challengeManager = new ChallengeManager({
      onChallengeCompleted: (ch, pts, mult, dur) => {
        sounds.playTrickSuccess();
        this.player.score += pts;
        this.player.coinsEarned += 50;
        this.callbacks.onChallengeCompleted(ch, pts, mult, dur);
      },
      onChallengeFailed: (ch) => {
        this.callbacks.onChallengeFailed(ch);
      },
      onChallengeStarted: (ch) => {
        this.callbacks.onChallengeStarted(ch);
      },
    });

    this.currentDifficulty = this.obstacleSystem.getDifficultyAtDistance(0);

    this.lastTimeOfDay = {
      phase: 'day',
      phaseLabel: 'Plein Jour Alpin',
      cycleProgress: 0,
      sunIntensity: 1.45,
      skyColor: '#bfe0f7',
      fogColor: '#bfe0f7',
    };

    // Initial reset
    this.resetGame();

    // Event listeners
    this.bindInputs();
    window.addEventListener('resize', this.onResize);

    // Start loop
    this.startLoop();
  }

  public setMode(mode: GameMode) {
    this.mode = mode;
    if (mode === 'paused' || mode === 'title') {
      sounds.stopContinuousSounds();
    }
  }

  public getMode(): GameMode {
    return this.mode;
  }

  public resetGame() {
    this.obstacleSystem.reset();
    this.particles.reset();
    this.skiTrails.reset();
    this.skier.resetPose();
    this.challengeManager.reset();

    this.currentDifficulty = this.obstacleSystem.getDifficultyAtDistance(0);

    this.player = {
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vz: (this.currentDifficulty.baseSpeed * 1000) / 3600,
      vy: 0,
      speedKmh: this.currentDifficulty.baseSpeed,
      isGrounded: true,
      isJumping: false,
      isCrouching: false,
      isSlidingOnIce: false,
      rotationY: 0,
      leanAngle: 0,
      pitchAngle: 0,
      currentTrick: null,
      airTime: 0,
      health: 3,
      score: 0,
      combo: 0,
      maxCombo: 0,
      gatesCleared: 0,
      invincibleTimer: 0,
      isCrashing: false,
      elapsedTimeSec: 0,
      currentDifficultyStage: this.currentDifficulty.stageName,
      currentDifficultyColor: this.currentDifficulty.stageColor,
      coinsEarned: 0,
      activeChallenge: null,
      scoreMultiplierBonus: null,
    };

    this.skier.group.position.set(0, 0, 0);
    this.cameraShake = 0;
    this.hitstopTimer = 0;
    this.crashTimer = 0;

    this.callbacks.onStateUpdate(this.player, this.lastTimeOfDay);
  }

  public updateSkierAppearance(
    jacketColor: number,
    accentColor: number,
    gogglesColor: number,
    skiColor: number,
    skiRoughness: number = 0.2,
    skiMetalness: number = 0.6
  ) {
    this.skier.setColors(jacketColor, accentColor, gogglesColor, skiColor, skiRoughness, skiMetalness);
  }

  public triggerJump() {
    if (this.mode !== 'playing') return;
    if (this.player.isGrounded && !this.player.isCrashing) {
      this.player.isGrounded = false;
      this.player.isJumping = true;
      this.player.vy = 6.8;
      this.player.airTime = 0;
      this.challengeManager.onJumpTriggered();
      sounds.playJump();
    }
  }

  public setTouchSteer(val: number) {
    this.touchSteer = Math.max(-1, Math.min(1, val));
  }

  private bindInputs() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keysHeld.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keysHeld.right = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keysHeld.down = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keysHeld.up = true;

      if (e.code === 'Space') {
        e.preventDefault();
        this.keysHeld.space = true;
        this.triggerJump();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keysHeld.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keysHeld.right = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keysHeld.down = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keysHeld.up = false;
      if (e.code === 'Space') this.keysHeld.space = false;
    });

    window.addEventListener('blur', () => {
      this.keysHeld.left = false;
      this.keysHeld.right = false;
      this.keysHeld.down = false;
      this.keysHeld.up = false;
      this.keysHeld.space = false;
      this.touchSteer = 0;
      sounds.stopContinuousSounds();
    });
  }

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private startLoop() {
    const tick = () => {
      if (this.isDestroyed) return;
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.render();

      this.frameId = requestAnimationFrame(tick);
    };
    this.frameId = requestAnimationFrame(tick);
  }

  private update(dt: number) {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    if (this.mode === 'title') {
      const time = performance.now() * 0.0006;
      this.camera.position.x = Math.sin(time) * 6;
      this.camera.position.y = 3.5 + Math.cos(time * 0.7) * 1.0;
      this.camera.position.z = -7 + Math.sin(time * 0.5) * 3;
      this.camera.lookAt(0, 1.2, 8);
      this.lastTimeOfDay = this.environment.update(0, 0, 0, performance.now() * 0.001);
      this.particles.update(0, dt, 0.05);
      return;
    }

    if (this.mode === 'paused') return;

    if (this.player.isCrashing) {
      this.crashTimer += dt;
      this.skier.updateAnimation(0, false, false, null, 0, true, this.crashTimer);
      if (this.crashTimer > 1.4 && this.mode === 'playing') {
        this.mode = 'gameover';
        sounds.stopContinuousSounds();
        sounds.playGameOver();
        this.callbacks.onGameOver(this.player.score, Math.round(this.player.z), this.player.elapsedTimeSec, this.player.coinsEarned);
      }
      return;
    }

    // --- Active Playing Physics ---
    this.player.elapsedTimeSec += dt;

    // Difficulty at current distance
    const diff = this.obstacleSystem.getDifficultyAtDistance(this.player.z);
    this.currentDifficulty = diff;
    this.player.currentDifficultyStage = diff.stageName;
    this.player.currentDifficultyColor = diff.stageColor;

    // 1. Steering inputs
    let steerDir = 0;
    if (this.keysHeld.left) steerDir -= 1;
    if (this.keysHeld.right) steerDir += 1;
    if (Math.abs(this.touchSteer) > 0.05) steerDir = this.touchSteer;

    this.player.isCrouching = this.keysHeld.down;

    const turnResponsiveness = this.player.isSlidingOnIce ? 14 : 32;
    const targetVx = steerDir * (this.player.isSlidingOnIce ? 18 : 22);
    this.player.vx += (targetVx - this.player.vx) * Math.min(1.0, dt * turnResponsiveness);

    const targetLean = (this.player.vx / 22) * 0.65;
    this.player.leanAngle += (targetLean - this.player.leanAngle) * Math.min(1.0, dt * 12);

    // 2. Downhill speed & momentum based on dynamic difficulty stage
    const targetSpeedKmh = this.player.isCrouching
      ? diff.maxSpeed
      : Math.abs(steerDir) > 0.5
      ? diff.baseSpeed * 0.9
      : diff.baseSpeed;

    const currentKmh = (this.player.vz * 3600) / 1000;
    const accelRate = this.player.isCrouching ? 16 : 8;
    const newKmh = currentKmh + (targetSpeedKmh - currentKmh) * Math.min(1.0, dt * (accelRate / 10));
    this.player.vz = (newKmh * 1000) / 3600;
    this.player.speedKmh = Math.round(newKmh);

    // 3. Movement
    this.player.x += this.player.vx * dt;
    this.player.z += this.player.vz * dt;

    if (this.player.x < -19.5) {
      this.player.x = -19.5;
      this.player.vx = Math.max(0, this.player.vx);
    } else if (this.player.x > 19.5) {
      this.player.x = 19.5;
      this.player.vx = Math.min(0, this.player.vx);
    }

    // 4. In-Air Jump & Aerial Tricks
    if (!this.player.isGrounded) {
      this.player.airTime += dt;
      this.player.vy -= 18.0 * dt;
      this.player.y += this.player.vy * dt;

      if (!this.player.currentTrick) {
        if (this.keysHeld.left || this.keysHeld.right) {
          this.player.currentTrick = '360';
        } else if (this.keysHeld.up) {
          this.player.currentTrick = 'Daffy';
        } else if (this.keysHeld.down) {
          this.player.currentTrick = 'Iron Cross';
        } else if (this.keysHeld.space) {
          this.player.currentTrick = 'Backflip';
        }
      }

      if (this.player.y <= 0) {
        this.player.y = 0;
        this.player.vy = 0;
        this.player.isGrounded = true;
        this.player.isJumping = false;
        sounds.playLand();
        this.cameraShake = 0.25;

        this.particles.emitSnowSpray(this.player.x, 0, this.player.z, 25, 20, Math.PI / 2);

        if (this.player.currentTrick) {
          const trickBase = this.player.currentTrick === 'Backflip' ? 800 : 500;
          const trickPoints = Math.round(trickBase * this.challengeManager.getScoreMultiplier());
          this.player.score += trickPoints;
          this.player.coinsEarned += 25;
          sounds.playTrickSuccess();
          this.challengeManager.onTrickLanded();
          this.callbacks.onTrickLanded(this.player.currentTrick, trickPoints);
          this.player.currentTrick = null;
        }
      }
    } else {
      this.player.y = 0;
    }

    // 5. Snow spray & ski carving trails
    if (this.player.isGrounded) {
      const isCarvingHard = Math.abs(this.player.leanAngle) > 0.25;
      if (isCarvingHard) {
        const sprayDir = this.player.leanAngle > 0 ? Math.PI : 0;
        this.particles.emitSnowSpray(
          this.player.x,
          0,
          this.player.z,
          Math.round(Math.abs(this.player.leanAngle) * 5),
          this.player.speedKmh,
          sprayDir
        );
      }

      this.skiTrails.addTrailPoint(
        this.player.x - 0.32,
        this.player.z,
        this.player.x + 0.32,
        this.player.z
      );

      sounds.updateContinuousSounds(this.player.speedKmh, isCarvingHard, true);
    } else {
      sounds.updateContinuousSounds(this.player.speedKmh, false, false);
    }

    // 6. Invincibility blink
    if (this.player.invincibleTimer > 0) {
      this.player.invincibleTimer -= dt;
      this.skier.group.visible = Math.floor(this.player.invincibleTimer * 12) % 2 === 0;
    } else {
      this.skier.group.visible = true;
    }

    // 7. Update Skier Object3D
    this.skier.group.position.set(this.player.x, this.player.y, this.player.z);
    this.skier.updateAnimation(
      this.player.leanAngle,
      this.player.isJumping,
      this.player.isCrouching,
      this.player.currentTrick,
      this.player.airTime,
      false,
      0
    );

    // 8. Obstacles & Collisions
    const collision = this.obstacleSystem.update(
      this.player.z,
      this.player.x,
      this.player.speedKmh,
      dt,
      this.player.y
    );

    if (collision.hitIce && !this.player.isSlidingOnIce) {
      this.challengeManager.onIceEntered();
    }
    this.player.isSlidingOnIce = !!collision.hitIce;

    if (collision.hitBoost) {
      this.player.vz += (25 * 1000) / 3600;
      this.player.score += Math.round(150 * this.challengeManager.getScoreMultiplier());
      sounds.playBoost();
      this.cameraShake = 0.3;
    }

    if (collision.hitRamp && this.player.isGrounded) {
      this.player.isGrounded = false;
      this.player.isJumping = true;
      this.player.vy = 10.5;
      this.player.airTime = 0;
      this.challengeManager.onRampLaunched();
      sounds.playJump();
    }

    if (collision.clearedGate) {
      this.player.combo++;
      this.player.gatesCleared++;
      this.player.maxCombo = Math.max(this.player.maxCombo, this.player.combo);
      const basePoints = 250 * Math.min(this.player.combo, 5);
      const points = Math.round(basePoints * this.challengeManager.getScoreMultiplier());
      this.player.score += points;
      this.player.coinsEarned += 10;
      sounds.playGatePass(this.player.combo);
      this.challengeManager.onGateCleared();
      this.callbacks.onGatePassed(this.player.combo, points);
    }

    if (collision.missedGate) {
      this.player.combo = 0;
    }

    if ((collision.hitObstacle || collision.yetiCaught) && this.player.invincibleTimer <= 0) {
      this.player.health--;
      this.player.combo = 0;
      sounds.playCrash();
      this.cameraShake = 0.6;
      this.hitstopTimer = 0.06;
      this.challengeManager.onDamageTaken(this.player.z);
      this.callbacks.onDamageTaken(this.player.health);

      if (this.player.health <= 0 || collision.yetiCaught) {
        this.player.isCrashing = true;
        this.crashTimer = 0;
      } else {
        this.player.invincibleTimer = 1.6;
        this.player.vz *= 0.6;
      }
    }

    // 9. Challenge Manager Update
    this.challengeManager.update(dt, this.player.z, this.player.isCrouching, this.player.speedKmh);
    this.player.activeChallenge = this.challengeManager.getActiveChallenge();
    this.player.scoreMultiplierBonus = this.challengeManager.getScoreBonus();

    // Passive score accumulation (multiplied if active bonus)
    const passiveMultiplier = this.challengeManager.getScoreMultiplier();
    this.player.score += Math.round(this.player.vz * dt * 2.5 * passiveMultiplier);

    // 9. Day-to-Night Dynamic Lighting Update!
    this.lastTimeOfDay = this.environment.update(
      this.player.z,
      this.player.x,
      this.player.y,
      this.player.elapsedTimeSec
    );

    // Particles & Trails
    this.particles.update(this.player.z, dt, diff.blizzardIntensity);
    this.skiTrails.update(this.player.z);

    // 10. Camera Follow
    const targetCamX = this.player.x * 0.75;
    const targetCamY = 4.2 + this.player.y * 0.4;
    const targetCamZ = this.player.z - 7.5;

    this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1.0, dt * 10);
    this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(1.0, dt * 8);
    this.camera.position.z += (targetCamZ - this.camera.position.z) * Math.min(1.0, dt * 14);

    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake * 1.2;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake * 1.2;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2.0);
    }

    const baseFov = 58;
    const speedRatio = Math.min(1.0, this.player.speedKmh / diff.maxSpeed);
    const targetFov = baseFov + speedRatio * 8;
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, dt * 4);
    this.camera.updateProjectionMatrix();

    this.camera.lookAt(this.player.x * 0.4, 1.2 + this.player.y * 0.3, this.player.z + 12);

    this.callbacks.onStateUpdate({ ...this.player }, this.lastTimeOfDay);
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    sounds.stopContinuousSounds();

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
