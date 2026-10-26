export type GameMode = 'title' | 'playing' | 'paused' | 'gameover';

export interface TimeOfDayState {
  phase: 'day' | 'sunset' | 'night' | 'dawn';
  phaseLabel: string;
  cycleProgress: number; // 0 to 1 through full cycle
  sunIntensity: number;
  skyColor: string;
  fogColor: string;
}

export type ChallengeType =
  | 'gates_no_jump'     // Pass N gates in a row without jumping
  | 'consecutive_gates' // Pass N consecutive gates
  | 'tuck_duration'     // Hold tuck for N seconds
  | 'speed_duration'    // Maintain speed > X km/h for N seconds
  | 'land_tricks'       // Land N aerial tricks
  | 'hit_ramp'          // Launch off a ramp and land cleanly
  | 'survive_distance'  // Ski N meters without taking damage
  | 'cross_ice';        // Skid through N ice patches without hitting obstacle

export interface ActiveChallenge {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  timeLimitSec: number;
  remainingTimeSec: number;
  rewardPoints: number;
  rewardMultiplier: number;
  rewardMultiplierDurationSec: number;
  isCompleted: boolean;
  isFailed: boolean;
}

export interface TemporaryScoreBonus {
  multiplier: number; // e.g. 2x
  remainingTimeSec: number;
  maxTimeSec: number;
}

export interface ObstacleData {
  id: number;
  type: 'tree' | 'rock' | 'gate' | 'ramp' | 'ice' | 'snowball' | 'boost' | 'charger' | 'sweeper';
  x: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  gatePassed?: boolean;
  gateMissed?: boolean;
  gateColor?: 'red' | 'blue';
  meshIndex?: number;
  active?: boolean;
  snowballVelocity?: { x: number; z: number };
  velocity?: { x: number; z: number };
  sweepDir?: number;
  sweepSpeed?: number;
}

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  vy: number;
  speedKmh: number;
  isGrounded: boolean;
  isJumping: boolean;
  isCrouching: boolean;
  isSlidingOnIce: boolean;
  rotationY: number;
  leanAngle: number;
  pitchAngle: number;
  currentTrick: string | null;
  airTime: number;
  health: number;
  score: number;
  combo: number;
  maxCombo: number;
  gatesCleared: number;
  invincibleTimer: number;
  isCrashing: boolean;
  elapsedTimeSec: number;
  currentDifficultyStage: string;
  currentDifficultyColor: string;
  coinsEarned: number;
  activeChallenge: ActiveChallenge | null;
  scoreMultiplierBonus: TemporaryScoreBonus | null;
}

export interface GameRecords {
  bestTimeSec: number;
  bestDistanceM: number;
  bestScore: number;
  totalCoins: number;
  totalGamesPlayed: number;
}

export interface SkinItem {
  id: string;
  name: string;
  description: string;
  priceEur: number;
  priceCoins: number;
  colorHex: string;
  jacketColor: number;
  accentColor: number;
  gogglesColor: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface SkiItem {
  id: string;
  name: string;
  description: string;
  priceEur: number;
  priceCoins: number;
  colorHex: string;
  skiColor: number;
  roughness: number;
  metalness: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface CustomizationState {
  equippedSkinId: string;
  equippedSkiId: string;
  unlockedSkinIds: string[];
  unlockedSkiIds: string[];
}
