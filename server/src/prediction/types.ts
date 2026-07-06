import { PredictionFactorDto } from '../types/api';

/** The per-season stats the engine needs for one team. */
export interface EngineTeam {
  id: number;
  name: string;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  yardsPerGame: number;
  yardsAllowedPerGame: number;
  turnoverMargin: number;
  strengthOfSchedule: number;
  recentFormScore: number;
}

export type StatKey = Exclude<keyof EngineTeam, 'id' | 'name'>;

export interface StatBounds {
  min: number;
  max: number;
}

/** League-wide min/max per stat, used to normalize raw stats to 0..1. */
export type LeagueBounds = Record<StatKey, StatBounds>;

export interface EngineOutput {
  winnerTeamId: number;
  teamAWinProbability: number;
  teamBWinProbability: number;
  projectedScoreA: number;
  projectedScoreB: number;
  factors: PredictionFactorDto[];
  summary: string;
}
