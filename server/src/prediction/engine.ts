/**
 * Deterministic, formula-based matchup prediction engine.
 *
 * This is intentionally a transparent statistical model — NOT machine
 * learning. Every step is explainable, and the module is self-contained
 * (pure functions, no I/O) so it can later be swapped for a trained model
 * (e.g. Python/scikit-learn behind a service) without touching the API.
 *
 * How it works:
 *  1. Each raw stat is min-max normalized against the rest of the league,
 *     so every input lands on a comparable 0..1 scale.
 *  2. Composite ratings are computed per team:
 *       offense  = 0.6 * norm(points/game)        + 0.4 * norm(yards/game)
 *       defense  = 0.6 * (1 - norm(points allowed)) + 0.4 * (1 - norm(yards allowed))
 *       overall  = 0.32*offense + 0.30*defense + 0.14*turnovers
 *                + 0.12*schedule strength + 0.12*recent form
 *     (weights sum to 1; offense/defense dominate, situational stats refine)
 *  3. If a home team is specified, its overall rating gets a flat
 *     HOME_FIELD_BONUS (~2-3 points of value).
 *  4. The rating difference is mapped to a win probability with a logistic
 *     curve: P(A wins) = 1 / (1 + e^(-diff * LOGISTIC_STEEPNESS)).
 *  5. Projected scores blend each offense against the opposing defense:
 *     (team PPG + opponent points-allowed/game) / 2, nudged by the rating
 *     difference and home field.
 *  6. Each stat category is compared head-to-head to produce human-readable
 *     "key factors" and a plain-English summary.
 */

import { PredictionFactorDto } from '../types/api';
import { EngineOutput, EngineTeam, LeagueBounds, StatBounds, StatKey } from './types';

// Weights for the composite overall rating (must sum to 1).
const WEIGHTS = {
  offense: 0.32,
  defense: 0.3,
  turnovers: 0.14,
  schedule: 0.12,
  form: 0.12,
} as const;

// Flat rating bonus for the home team (~55-60% of home games are won by
// comparable teams; 0.045 of overall rating ≈ 2.5 points).
const HOME_FIELD_BONUS = 0.045;

// Controls how quickly a rating gap turns into a lopsided probability.
// With 7, a 0.10 overall-rating edge ≈ 67% win probability; only true
// mismatches reach the 90s.
const LOGISTIC_STEEPNESS = 7;

const STAT_KEYS: StatKey[] = [
  'pointsPerGame',
  'pointsAllowedPerGame',
  'yardsPerGame',
  'yardsAllowedPerGame',
  'turnoverMargin',
  'strengthOfSchedule',
  'recentFormScore',
];

/** Compute league-wide min/max for each stat (used for normalization). */
export function computeLeagueBounds(teams: EngineTeam[]): LeagueBounds {
  const bounds = {} as LeagueBounds;
  for (const key of STAT_KEYS) {
    const values = teams.map((t) => t[key]);
    bounds[key] = { min: Math.min(...values), max: Math.max(...values) };
  }
  return bounds;
}

/** Min-max normalize a value to 0..1 (0.5 when the league has no spread). */
function normalize(value: number, { min, max }: StatBounds): number {
  if (max === min) return 0.5;
  return clamp((value - min) / (max - min), 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface TeamRating {
  offense: number;
  defense: number;
  turnovers: number;
  schedule: number;
  form: number;
  overall: number;
}

/** Composite 0..1 ratings for one team, given league normalization bounds. */
function rateTeam(team: EngineTeam, bounds: LeagueBounds): TeamRating {
  const offense =
    0.6 * normalize(team.pointsPerGame, bounds.pointsPerGame) +
    0.4 * normalize(team.yardsPerGame, bounds.yardsPerGame);

  // Lower is better for points/yards allowed, hence the (1 - norm).
  const defense =
    0.6 * (1 - normalize(team.pointsAllowedPerGame, bounds.pointsAllowedPerGame)) +
    0.4 * (1 - normalize(team.yardsAllowedPerGame, bounds.yardsAllowedPerGame));

  const turnovers = normalize(team.turnoverMargin, bounds.turnoverMargin);
  const schedule = normalize(team.strengthOfSchedule, bounds.strengthOfSchedule);
  const form = normalize(team.recentFormScore, bounds.recentFormScore);

  const overall =
    WEIGHTS.offense * offense +
    WEIGHTS.defense * defense +
    WEIGHTS.turnovers * turnovers +
    WEIGHTS.schedule * schedule +
    WEIGHTS.form * form;

  return { offense, defense, turnovers, schedule, form, overall };
}

/**
 * Predict a matchup between two teams.
 *
 * @param teamA / teamB  season stats for both teams
 * @param homeTeamId     id of the home team, or null for a neutral site
 * @param bounds         league-wide stat bounds from computeLeagueBounds()
 */
export function predictMatchup(
  teamA: EngineTeam,
  teamB: EngineTeam,
  homeTeamId: number | null,
  bounds: LeagueBounds
): EngineOutput {
  const ratingA = rateTeam(teamA, bounds);
  const ratingB = rateTeam(teamB, bounds);

  const homeBonusA = homeTeamId === teamA.id ? HOME_FIELD_BONUS : 0;
  const homeBonusB = homeTeamId === teamB.id ? HOME_FIELD_BONUS : 0;

  const diff = ratingA.overall + homeBonusA - (ratingB.overall + homeBonusB);

  // Logistic curve maps the rating gap to a probability; clamped so the
  // model never claims certainty.
  const rawProbA = 1 / (1 + Math.exp(-diff * LOGISTIC_STEEPNESS));
  const teamAWinProbability = round4(clamp(rawProbA, 0.03, 0.97));
  const teamBWinProbability = round4(1 - teamAWinProbability);

  // Projected score: each offense meets the opposing defense in the middle,
  // then the overall rating gap and home field nudge the totals.
  const ratingGap = ratingA.overall - ratingB.overall;
  const homePointsA = homeBonusA > 0 ? 1.25 : homeBonusB > 0 ? -1.25 : 0;
  let projectedScoreA = Math.round(
    clamp((teamA.pointsPerGame + teamB.pointsAllowedPerGame) / 2 + ratingGap * 12 + homePointsA, 10, 55)
  );
  let projectedScoreB = Math.round(
    clamp((teamB.pointsPerGame + teamA.pointsAllowedPerGame) / 2 - ratingGap * 12 - homePointsA, 10, 55)
  );

  const winnerTeamId = teamAWinProbability >= 0.5 ? teamA.id : teamB.id;

  // Avoid a projected tie and keep the score consistent with the winner.
  if (projectedScoreA === projectedScoreB) {
    if (winnerTeamId === teamA.id) projectedScoreA += 1;
    else projectedScoreB += 1;
  } else if (winnerTeamId === teamA.id !== (projectedScoreA > projectedScoreB)) {
    // Rare edge case: probability and score disagree — swap the scores.
    [projectedScoreA, projectedScoreB] = [projectedScoreB, projectedScoreA];
  }

  const factors = buildFactors(teamA, teamB);
  const summary = buildSummary(
    teamA,
    teamB,
    winnerTeamId,
    winnerTeamId === teamA.id ? teamAWinProbability : teamBWinProbability,
    factors,
    homeTeamId
  );

  return {
    winnerTeamId,
    teamAWinProbability,
    teamBWinProbability,
    projectedScoreA,
    projectedScoreB,
    factors,
    summary,
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

interface FactorSpec {
  key: StatKey;
  category: string;
  lowerIsBetter: boolean;
  /** Minimum absolute difference before we call it an edge (not EVEN). */
  evenThreshold: number;
  /** Phrase used in the summary when this factor favors the winner. */
  reason: string;
}

const FACTOR_SPECS: FactorSpec[] = [
  { key: 'pointsPerGame', category: 'Points Per Game', lowerIsBetter: false, evenThreshold: 1.5, reason: 'a more productive offense' },
  { key: 'pointsAllowedPerGame', category: 'Points Allowed Per Game', lowerIsBetter: true, evenThreshold: 1.5, reason: 'a stingier defense' },
  { key: 'yardsPerGame', category: 'Yards Per Game', lowerIsBetter: false, evenThreshold: 15, reason: 'a stronger offensive rating' },
  { key: 'yardsAllowedPerGame', category: 'Yards Allowed Per Game', lowerIsBetter: true, evenThreshold: 15, reason: 'a stouter defensive front' },
  { key: 'turnoverMargin', category: 'Turnover Margin', lowerIsBetter: false, evenThreshold: 2, reason: 'a higher turnover margin' },
  { key: 'strengthOfSchedule', category: 'Strength of Schedule', lowerIsBetter: false, evenThreshold: 0.04, reason: 'a tougher schedule played' },
  { key: 'recentFormScore', category: 'Recent Form', lowerIsBetter: false, evenThreshold: 1.5, reason: 'better recent form' },
];

/** Head-to-head comparison of every stat category with a readable note. */
function buildFactors(teamA: EngineTeam, teamB: EngineTeam): PredictionFactorDto[] {
  return FACTOR_SPECS.map((spec) => {
    const a = teamA[spec.key];
    const b = teamB[spec.key];
    const rawDiff = a - b;

    let edge: 'A' | 'B' | 'EVEN' = 'EVEN';
    if (Math.abs(rawDiff) >= spec.evenThreshold) {
      const aIsBetter = spec.lowerIsBetter ? rawDiff < 0 : rawDiff > 0;
      edge = aIsBetter ? 'A' : 'B';
    }

    const better = edge === 'A' ? teamA : edge === 'B' ? teamB : null;
    const description = better
      ? `${better.name} has the edge in ${spec.category.toLowerCase()} (${formatStat(a, spec.key)} vs ${formatStat(b, spec.key)})`
      : `${spec.category} is effectively even (${formatStat(a, spec.key)} vs ${formatStat(b, spec.key)})`;

    return {
      category: spec.category,
      teamAValue: a,
      teamBValue: b,
      edge,
      description,
    };
  });
}

function formatStat(value: number, key: StatKey): string {
  if (key === 'turnoverMargin') return value > 0 ? `+${value}` : `${value}`;
  if (key === 'strengthOfSchedule') return value.toFixed(2);
  return `${Math.round(value * 10) / 10}`;
}

/** Plain-English one-liner explaining who is favored and why. */
function buildSummary(
  teamA: EngineTeam,
  teamB: EngineTeam,
  winnerTeamId: number,
  winnerProbability: number,
  factors: PredictionFactorDto[],
  homeTeamId: number | null
): string {
  const winner = winnerTeamId === teamA.id ? teamA : teamB;
  const winnerEdge = winnerTeamId === teamA.id ? 'A' : 'B';
  const pct = Math.round(winnerProbability * 100);

  const reasons = FACTOR_SPECS.filter(
    (spec, i) => factors[i].edge === winnerEdge
  ).map((spec) => spec.reason);

  if (homeTeamId === winnerTeamId) {
    reasons.push('home-field advantage');
  }

  if (reasons.length === 0) {
    return `This one is close to a coin flip — ${winner.name} gets the slight nod at ${pct}% on overall rating.`;
  }

  const top = reasons.slice(0, 3);
  const reasonText =
    top.length === 1 ? top[0] : `${top.slice(0, -1).join(', ')} and ${top[top.length - 1]}`;

  return `${winner.name} is favored (${pct}%) because they have ${reasonText}.`;
}
