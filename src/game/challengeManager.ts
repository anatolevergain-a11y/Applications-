import { ActiveChallenge, ChallengeType, TemporaryScoreBonus } from '../types/game';

export interface ChallengeCallbacks {
  onChallengeCompleted: (challenge: ActiveChallenge, bonusPoints: number, multiplier: number, durationSec: number) => void;
  onChallengeFailed: (challenge: ActiveChallenge) => void;
  onChallengeStarted: (challenge: ActiveChallenge) => void;
}

export class ChallengeManager {
  private activeChallenge: ActiveChallenge | null = null;
  private scoreBonus: TemporaryScoreBonus | null = null;
  private cooldownTimer: number = 3.0; // initial challenge starts after 3s
  private callbacks: ChallengeCallbacks;

  // Tracking state
  private startDistanceForNoHit: number = 0;
  private tuckAccumulator: number = 0;
  private highSpeedAccumulator: number = 0;
  private lastJumpedDuringChallenge: boolean = false;

  constructor(callbacks: ChallengeCallbacks) {
    this.callbacks = callbacks;
  }

  public reset() {
    this.activeChallenge = null;
    this.scoreBonus = null;
    this.cooldownTimer = 3.0;
    this.tuckAccumulator = 0;
    this.highSpeedAccumulator = 0;
    this.lastJumpedDuringChallenge = false;
  }

  public getActiveChallenge(): ActiveChallenge | null {
    return this.activeChallenge;
  }

  public getScoreBonus(): TemporaryScoreBonus | null {
    return this.scoreBonus;
  }

  public getScoreMultiplier(): number {
    return this.scoreBonus ? this.scoreBonus.multiplier : 1;
  }

  private pickRandomChallenge(currentZ: number): ActiveChallenge {
    const templates: Array<{
      type: ChallengeType;
      title: string;
      description: string;
      targetCount: number;
      timeLimitSec: number;
      rewardPoints: number;
      rewardMultiplier: number;
      rewardMultiplierDurationSec: number;
    }> = [
      {
        type: 'gates_no_jump',
        title: 'Slalom Pur',
        description: 'Passer 3 portes d’affilée sans sauter',
        targetCount: 3,
        timeLimitSec: 22,
        rewardPoints: 1200,
        rewardMultiplier: 2,
        rewardMultiplierDurationSec: 10,
      },
      {
        type: 'tuck_duration',
        title: 'Recherche de Vitesse',
        description: 'Maintenir la position basse (Tuck) pendant 4 secondes',
        targetCount: 4,
        timeLimitSec: 18,
        rewardPoints: 1000,
        rewardMultiplier: 2,
        rewardMultiplierDurationSec: 10,
      },
      {
        type: 'consecutive_gates',
        title: 'Combo Portes',
        description: 'Franchir 4 portes de slalom consécutives',
        targetCount: 4,
        timeLimitSec: 25,
        rewardPoints: 1500,
        rewardMultiplier: 2.5,
        rewardMultiplierDurationSec: 12,
      },
      {
        type: 'land_tricks',
        title: 'Accro des Tremplins',
        description: 'Réaliser 2 figures aériennes (360°, Backflip, Daffy)',
        targetCount: 2,
        timeLimitSec: 24,
        rewardPoints: 1800,
        rewardMultiplier: 2,
        rewardMultiplierDurationSec: 12,
      },
      {
        type: 'speed_duration',
        title: 'Plein Gaz',
        description: 'Rester au-dessus de 80 km/h pendant 5 secondes',
        targetCount: 5,
        timeLimitSec: 20,
        rewardPoints: 1200,
        rewardMultiplier: 2,
        rewardMultiplierDurationSec: 10,
      },
      {
        type: 'hit_ramp',
        title: 'Envol Aérien',
        description: 'Prendre un tremplin de saut et atterrir proprement',
        targetCount: 1,
        timeLimitSec: 20,
        rewardPoints: 1000,
        rewardMultiplier: 2,
        rewardMultiplierDurationSec: 10,
      },
      {
        type: 'survive_distance',
        title: 'Descente Propre',
        description: 'Parcourir 200 m sans subir le moindre impact',
        targetCount: 200,
        timeLimitSec: 22,
        rewardPoints: 1400,
        rewardMultiplier: 2,
        rewardMultiplierDurationSec: 10,
      },
      {
        type: 'cross_ice',
        title: 'Maître du Verglas',
        description: 'Glisser sur 2 plaques de glace sans perdre le contrôle',
        targetCount: 2,
        timeLimitSec: 26,
        rewardPoints: 1600,
        rewardMultiplier: 2.5,
        rewardMultiplierDurationSec: 12,
      },
    ];

    const chosen = templates[Math.floor(Math.random() * templates.length)];
    this.startDistanceForNoHit = currentZ;
    this.tuckAccumulator = 0;
    this.highSpeedAccumulator = 0;
    this.lastJumpedDuringChallenge = false;

    return {
      id: 'ch_' + Date.now(),
      type: chosen.type,
      title: chosen.title,
      description: chosen.description,
      targetCount: chosen.targetCount,
      currentCount: 0,
      timeLimitSec: chosen.timeLimitSec,
      remainingTimeSec: chosen.timeLimitSec,
      rewardPoints: chosen.rewardPoints,
      rewardMultiplier: chosen.rewardMultiplier,
      rewardMultiplierDurationSec: chosen.rewardMultiplierDurationSec,
      isCompleted: false,
      isFailed: false,
    };
  }

  public update(
    delta: number,
    playerZ: number,
    isCrouching: boolean,
    speedKmh: number
  ) {
    // 1. Update active score multiplier timer
    if (this.scoreBonus) {
      this.scoreBonus.remainingTimeSec -= delta;
      if (this.scoreBonus.remainingTimeSec <= 0) {
        this.scoreBonus = null;
      }
    }

    // 2. Cooldown before starting next challenge
    if (!this.activeChallenge) {
      this.cooldownTimer -= delta;
      if (this.cooldownTimer <= 0) {
        this.activeChallenge = this.pickRandomChallenge(playerZ);
        this.callbacks.onChallengeStarted(this.activeChallenge);
      }
      return;
    }

    const ch = this.activeChallenge;

    // Countdown active challenge timer
    ch.remainingTimeSec -= delta;

    // Continuous condition checks
    if (ch.type === 'tuck_duration') {
      if (isCrouching) {
        this.tuckAccumulator += delta;
        ch.currentCount = Math.min(ch.targetCount, Math.round(this.tuckAccumulator * 10) / 10);
        if (this.tuckAccumulator >= ch.targetCount) {
          this.completeChallenge();
          return;
        }
      }
    } else if (ch.type === 'speed_duration') {
      if (speedKmh >= 80) {
        this.highSpeedAccumulator += delta;
        ch.currentCount = Math.min(ch.targetCount, Math.round(this.highSpeedAccumulator * 10) / 10);
        if (this.highSpeedAccumulator >= ch.targetCount) {
          this.completeChallenge();
          return;
        }
      }
    } else if (ch.type === 'survive_distance') {
      const distanceCovered = Math.max(0, Math.round(playerZ - this.startDistanceForNoHit));
      ch.currentCount = Math.min(ch.targetCount, distanceCovered);
      if (distanceCovered >= ch.targetCount) {
        this.completeChallenge();
        return;
      }
    }

    // Timeout failure
    if (ch.remainingTimeSec <= 0) {
      ch.isFailed = true;
      this.callbacks.onChallengeFailed(ch);
      this.activeChallenge = null;
      this.cooldownTimer = 6.0; // wait 6 seconds before next challenge
    }
  }

  public onGateCleared() {
    if (!this.activeChallenge) return;
    const ch = this.activeChallenge;

    if (ch.type === 'gates_no_jump' || ch.type === 'consecutive_gates') {
      ch.currentCount++;
      if (ch.currentCount >= ch.targetCount) {
        this.completeChallenge();
      }
    }
  }

  public onJumpTriggered() {
    if (!this.activeChallenge) return;
    const ch = this.activeChallenge;

    // If challenge requires no jumping, jumping resets current streak!
    if (ch.type === 'gates_no_jump') {
      ch.currentCount = 0;
    }
  }

  public onTrickLanded() {
    if (!this.activeChallenge) return;
    const ch = this.activeChallenge;

    if (ch.type === 'land_tricks') {
      ch.currentCount++;
      if (ch.currentCount >= ch.targetCount) {
        this.completeChallenge();
      }
    }
  }

  public onRampLaunched() {
    if (!this.activeChallenge) return;
    const ch = this.activeChallenge;

    if (ch.type === 'hit_ramp') {
      ch.currentCount = 1;
      this.completeChallenge();
    }
  }

  public onIceEntered() {
    if (!this.activeChallenge) return;
    const ch = this.activeChallenge;

    if (ch.type === 'cross_ice') {
      ch.currentCount++;
      if (ch.currentCount >= ch.targetCount) {
        this.completeChallenge();
      }
    }
  }

  public onDamageTaken(currentZ: number) {
    if (!this.activeChallenge) return;
    const ch = this.activeChallenge;

    if (ch.type === 'survive_distance') {
      // Reset distance counter
      this.startDistanceForNoHit = currentZ;
      ch.currentCount = 0;
    } else if (ch.type === 'gates_no_jump' || ch.type === 'consecutive_gates') {
      ch.currentCount = 0;
    }
  }

  private completeChallenge() {
    if (!this.activeChallenge) return;
    const ch = this.activeChallenge;
    ch.isCompleted = true;

    // Set active score bonus multiplier
    this.scoreBonus = {
      multiplier: ch.rewardMultiplier,
      remainingTimeSec: ch.rewardMultiplierDurationSec,
      maxTimeSec: ch.rewardMultiplierDurationSec,
    };

    this.callbacks.onChallengeCompleted(
      ch,
      ch.rewardPoints,
      ch.rewardMultiplier,
      ch.rewardMultiplierDurationSec
    );

    this.activeChallenge = null;
    this.cooldownTimer = 7.0; // Cooldown before next challenge starts
  }
}
