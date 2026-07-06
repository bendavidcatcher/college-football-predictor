import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { GameDto, OleMissDashboardDto, WeeklyPerformanceDto } from '../types/api';
import { CURRENT_SEASON, toGameDto, toTeamDto } from './team.service';
import { computeMatchup } from './prediction.service';

const OLE_MISS_NAME = 'Ole Miss';

/**
 * Aggregates everything the Ole Miss dashboard page needs into one payload:
 * team + stats, full schedule, weekly scoring trend, and a prediction
 * preview for the next scheduled game.
 */
export async function getOleMissDashboard(): Promise<OleMissDashboardDto> {
  const team = await prisma.team.findUnique({
    where: { name: OLE_MISS_NAME },
    include: { seasonStats: true },
  });
  if (!team) {
    throw ApiError.notFound('Ole Miss is not in the database — did you run the seed?');
  }

  const games = await prisma.game.findMany({
    where: {
      season: CURRENT_SEASON,
      OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
    },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { week: 'asc' },
  });

  const gameDtos = games.map(toGameDto);
  const weeklyPerformance = buildWeeklyPerformance(gameDtos, team.id);
  const nextGame = gameDtos.find((g) => g.status === 'SCHEDULED') ?? null;

  let nextGamePrediction = null;
  if (nextGame) {
    const opponentId =
      nextGame.homeTeam.id === team.id ? nextGame.awayTeam.id : nextGame.homeTeam.id;
    // Team A is always Ole Miss in the preview; home team comes from the
    // actual scheduled venue.
    nextGamePrediction = await computeMatchup(team.id, opponentId, nextGame.homeTeam.id);
  }

  return {
    team: toTeamDto(team),
    games: gameDtos,
    nextGame,
    nextGamePrediction,
    weeklyPerformance,
  };
}

function buildWeeklyPerformance(games: GameDto[], teamId: number): WeeklyPerformanceDto[] {
  return games
    .filter((g) => g.status === 'FINAL' && g.homeScore !== null && g.awayScore !== null)
    .map((g) => {
      const isHome = g.homeTeam.id === teamId;
      const pointsFor = isHome ? g.homeScore! : g.awayScore!;
      const pointsAgainst = isHome ? g.awayScore! : g.homeScore!;
      const opponentName = isHome ? g.awayTeam.name : g.homeTeam.name;
      return {
        week: g.week,
        opponent: isHome ? `vs ${opponentName}` : `@ ${opponentName}`,
        pointsFor,
        pointsAgainst,
        result: (pointsFor > pointsAgainst ? 'W' : 'L') as 'W' | 'L',
      };
    });
}
