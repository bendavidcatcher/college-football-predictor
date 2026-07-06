import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { computeLeagueBounds, predictMatchup } from '../prediction/engine';
import { EngineTeam } from '../prediction/types';
import { PredictionFactorDto, PredictionResultDto, SavedPredictionDto, TeamDto } from '../types/api';
import { CURRENT_SEASON, toTeamDto } from './team.service';

interface MatchupContext {
  teamA: TeamDto;
  teamB: TeamDto;
  engineA: EngineTeam;
  engineB: EngineTeam;
  bounds: ReturnType<typeof computeLeagueBounds>;
}

function toEngineTeam(team: TeamDto): EngineTeam {
  if (!team.stats) {
    throw new ApiError(422, `${team.name} has no stats for the ${CURRENT_SEASON} season`);
  }
  return {
    id: team.id,
    name: team.name,
    pointsPerGame: team.stats.pointsPerGame,
    pointsAllowedPerGame: team.stats.pointsAllowedPerGame,
    yardsPerGame: team.stats.yardsPerGame,
    yardsAllowedPerGame: team.stats.yardsAllowedPerGame,
    turnoverMargin: team.stats.turnoverMargin,
    strengthOfSchedule: team.stats.strengthOfSchedule,
    recentFormScore: team.stats.recentFormScore,
  };
}

async function loadMatchupContext(teamAId: number, teamBId: number): Promise<MatchupContext> {
  if (teamAId === teamBId) {
    throw ApiError.badRequest('Pick two different teams');
  }

  const teams = await prisma.team.findMany({ include: { seasonStats: true } });
  const teamARecord = teams.find((t) => t.id === teamAId);
  const teamBRecord = teams.find((t) => t.id === teamBId);
  if (!teamARecord) throw ApiError.notFound('Team A not found');
  if (!teamBRecord) throw ApiError.notFound('Team B not found');

  const teamA = toTeamDto(teamARecord);
  const teamB = toTeamDto(teamBRecord);

  // Normalization bounds come from the whole league so ratings are stable
  // regardless of which two teams are being compared.
  const allEngineTeams = teams
    .map(toTeamDto)
    .filter((t) => t.stats !== null)
    .map(toEngineTeam);
  const bounds = computeLeagueBounds(allEngineTeams);

  return { teamA, teamB, engineA: toEngineTeam(teamA), engineB: toEngineTeam(teamB), bounds };
}

function validateHomeTeamId(homeTeamId: number | null, teamAId: number, teamBId: number) {
  if (homeTeamId !== null && homeTeamId !== teamAId && homeTeamId !== teamBId) {
    throw ApiError.badRequest('homeTeamId must be one of the two selected teams, or null');
  }
}

/**
 * Run the engine for a matchup without persisting anything
 * (used by the Ole Miss dashboard preview).
 */
export async function computeMatchup(
  teamAId: number,
  teamBId: number,
  homeTeamId: number | null
): Promise<PredictionResultDto> {
  validateHomeTeamId(homeTeamId, teamAId, teamBId);
  const ctx = await loadMatchupContext(teamAId, teamBId);
  const output = predictMatchup(ctx.engineA, ctx.engineB, homeTeamId, ctx.bounds);

  return {
    id: null,
    teamA: ctx.teamA,
    teamB: ctx.teamB,
    homeTeamId,
    ...output,
  };
}

/** Run the engine and persist the result so it can be saved by users. */
export async function createPrediction(
  teamAId: number,
  teamBId: number,
  homeTeamId: number | null
): Promise<PredictionResultDto> {
  const result = await computeMatchup(teamAId, teamBId, homeTeamId);

  const record = await prisma.prediction.create({
    data: {
      teamAId,
      teamBId,
      homeTeamId,
      winnerTeamId: result.winnerTeamId,
      teamAWinProbability: result.teamAWinProbability,
      teamBWinProbability: result.teamBWinProbability,
      projectedScoreA: result.projectedScoreA,
      projectedScoreB: result.projectedScoreB,
      factors: result.factors as unknown as Prisma.InputJsonValue,
      summary: result.summary,
    },
  });

  return { ...result, id: record.id };
}

export async function savePrediction(userId: number, predictionId: number): Promise<SavedPredictionDto> {
  const prediction = await prisma.prediction.findUnique({ where: { id: predictionId } });
  if (!prediction) throw ApiError.notFound('Prediction not found');

  const existing = await prisma.savedPrediction.findUnique({
    where: { userId_predictionId: { userId, predictionId } },
  });
  if (existing) throw ApiError.conflict('You already saved this prediction');

  const saved = await prisma.savedPrediction.create({ data: { userId, predictionId } });
  const dto = await toSavedDto(saved.id);
  return dto;
}

export async function getSavedPredictions(userId: number): Promise<SavedPredictionDto[]> {
  const saved = await prisma.savedPrediction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      prediction: {
        include: {
          teamA: { include: { seasonStats: true } },
          teamB: { include: { seasonStats: true } },
        },
      },
    },
  });

  return saved.map((s) => ({
    id: s.id,
    createdAt: s.createdAt.toISOString(),
    prediction: {
      id: s.prediction.id,
      teamA: toTeamDto(s.prediction.teamA),
      teamB: toTeamDto(s.prediction.teamB),
      homeTeamId: s.prediction.homeTeamId,
      winnerTeamId: s.prediction.winnerTeamId,
      teamAWinProbability: s.prediction.teamAWinProbability,
      teamBWinProbability: s.prediction.teamBWinProbability,
      projectedScoreA: s.prediction.projectedScoreA,
      projectedScoreB: s.prediction.projectedScoreB,
      factors: s.prediction.factors as unknown as PredictionFactorDto[],
      summary: s.prediction.summary,
    },
  }));
}

async function toSavedDto(savedId: number): Promise<SavedPredictionDto> {
  const saved = await prisma.savedPrediction.findUniqueOrThrow({
    where: { id: savedId },
    include: {
      prediction: {
        include: {
          teamA: { include: { seasonStats: true } },
          teamB: { include: { seasonStats: true } },
        },
      },
    },
  });
  return {
    id: saved.id,
    createdAt: saved.createdAt.toISOString(),
    prediction: {
      id: saved.prediction.id,
      teamA: toTeamDto(saved.prediction.teamA),
      teamB: toTeamDto(saved.prediction.teamB),
      homeTeamId: saved.prediction.homeTeamId,
      winnerTeamId: saved.prediction.winnerTeamId,
      teamAWinProbability: saved.prediction.teamAWinProbability,
      teamBWinProbability: saved.prediction.teamBWinProbability,
      projectedScoreA: saved.prediction.projectedScoreA,
      projectedScoreB: saved.prediction.projectedScoreB,
      factors: saved.prediction.factors as unknown as PredictionFactorDto[],
      summary: saved.prediction.summary,
    },
  };
}

export async function deleteSavedPrediction(userId: number, savedId: number): Promise<void> {
  const saved = await prisma.savedPrediction.findUnique({ where: { id: savedId } });
  if (!saved) throw ApiError.notFound('Saved prediction not found');
  if (saved.userId !== userId) throw ApiError.forbidden('Not your saved prediction');

  await prisma.savedPrediction.delete({ where: { id: savedId } });
}
